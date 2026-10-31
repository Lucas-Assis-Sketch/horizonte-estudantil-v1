import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {app} from '../src/app.js';
import {database} from '../src/db.js';
import {config} from '../src/config.js';
import {encodePassword,verifyPassword} from '../src/password.js';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const db=database(':memory:');let server,origin,c;
before(async()=>{c={production:false,origin:'http://localhost:4173'};server=app(db,c,{limits:false}).listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));origin=`http://127.0.0.1:${server.address().port}`;});
after(async()=>{await new Promise(r=>server.close(r));db.close();});
async function call(path,method='GET',body,session={},headers={}){return fetch(origin+path,{method,headers:{origin:c.origin,...(body?{'content-type':'application/json'}:{}),...(session.cookie?{cookie:session.cookie,'x-csrf-token':session.csrf}:{}),...headers},body:body?JSON.stringify(body):undefined});}
async function account(email='estudante@example.test'){const r=await call('/api/auth/register','POST',{email,password:'Frase sintética 123!',confirmPassword:'Frase sintética 123!',className:'2º A'});assert.equal(r.status,201);const value=await r.json();return{cookie:r.headers.get('set-cookie').split(';')[0],csrf:value.csrfToken,user:value.user};}
test('cadastro, persistência, login normalizado e isolamento entre contas',async()=>{
 const a=await account(),b=await account('outra@example.test');assert.equal(a.user.className,'2º A');
 const row=db.prepare('SELECT * FROM accounts WHERE id=?').get(a.user.id);assert.notEqual(row.password_hash,'Frase sintética 123!');assert.ok(!JSON.stringify(a.user).includes('password'));
 const me=await(await call('/api/me','GET',null,a)).json();assert.equal(me.user.id,a.user.id);assert.notEqual(me.user.id,b.user.id);
 const r=await call('/api/auth/login','POST',{email:' ESTUDANTE@EXAMPLE.TEST ',password:'Frase sintética 123!'});assert.equal(r.status,200);
});
test('validação de senha, confirmação e campos extras',async()=>{
 const base={email:'invalid@example.test',password:'Frase sintética 123!',confirmPassword:'Frase sintética 123!',className:'2º A'};
 for(const change of [{password:'curta'},{confirmPassword:'Não corresponde 123'},{email:'invalido'},{className:' '},{role:'admin'}])assert.equal((await call('/api/auth/register','POST',{...base,...change})).status,400);
});
test('preferências persistem e outro usuário não pode alterá-las',async()=>{
 const a=await account('prefs@example.test'),b=await account('prefs2@example.test');
 assert.equal((await call('/api/account/preferences','PATCH',{theme:'dark',accent:'teal'},a)).status,200);
 assert.deepEqual((await(await call('/api/me','GET',null,a)).json()).user.preferences,{theme:'dark',accent:'teal'});
 assert.equal((await(await call('/api/me','GET',null,b)).json()).user.preferences.theme,'light');
 assert.equal((await call('/api/account/preferences','PATCH',{theme:'dark',accent:'javascript:'},a)).status,400);
 assert.equal((await call('/api/account/preferences','PATCH',{theme:'dark',accent:'red',id:b.user.id},a)).status,400);
});
test('troca exige senha atual, grava hash, invalida todas as sessões e aceita só senha nova',async()=>{
 const a=await account('senha@example.test');const login=await call('/api/auth/login','POST',{email:a.user.email,password:'Frase sintética 123!'});const second={cookie:login.headers.get('set-cookie').split(';')[0]};
 const body={currentPassword:'Errada sintética 123',newPassword:'Outra frase segura 456!',confirmPassword:'Outra frase segura 456!'};
 assert.equal((await call('/api/account/password','POST',body,a)).status,400);
 assert.equal((await call('/api/account/password','POST',{...body,currentPassword:'Frase sintética 123!'},a)).status,200);
 assert.equal((await call('/api/me','GET',null,a)).status,401);assert.equal((await call('/api/me','GET',null,second)).status,401);
 assert.equal((await call('/api/auth/login','POST',{email:a.user.email,password:'Frase sintética 123!'})).status,401);
 assert.equal((await call('/api/auth/login','POST',{email:a.user.email,password:body.newPassword})).status,200);
});
test('CSRF, origem, sessão, expiração e logout',async()=>{
 const a=await account('csrf@example.test'),body={theme:'light',accent:'blue'};
 assert.equal((await call('/api/me')).status,401);
 assert.equal((await call('/api/account/preferences','PATCH',body,a,{'x-csrf-token':''})).status,403);
 assert.equal((await call('/api/account/preferences','PATCH',body,a,{origin:'https://evil.test'})).status,403);
 const logout=await call('/api/auth/logout','POST',{},a);assert.equal(logout.status,204);assert.match(logout.headers.get('set-cookie'),/HttpOnly/);assert.match(logout.headers.get('set-cookie'),/SameSite=Strict/);
 assert.equal((await call('/api/me','GET',null,a)).status,401);
 const b=await account('expiry@example.test');db.prepare('UPDATE sessions SET expires=0 WHERE account_id=?').run(b.user.id);assert.equal((await call('/api/me','GET',null,b)).status,401);
});
test('hashes usam salts diferentes e comparação correta',async()=>{const a=await encodePassword('Frase sintética 123!'),b=await encodePassword('Frase sintética 123!');assert.notEqual(a,b);assert.equal(await verifyPassword('Frase sintética 123!',a),true);assert.equal(await verifyPassword('incorreta',a),false);});
test('banco de arquivo preserva dados após reabertura',()=>{const folder=mkdtempSync(join(tmpdir(),'horizonte-test-'));const path=join(folder,'test.db');try{const d=database(path);d.prepare('INSERT INTO accounts(id,email,password_hash,class_name) VALUES (?,?,?,?)').run('test','teste@example.test','synthetic','1A');d.close();const reopened=database(path);assert.equal(reopened.prepare('SELECT class_name FROM accounts WHERE id=?').get('test').class_name,'1A');reopened.close();}finally{rmSync(folder,{recursive:true,force:true});}});
test('produção exige HTTPS',()=>{assert.throws(()=>config({NODE_ENV:'production',APP_ORIGIN:'http://localhost:4173'}));assert.equal(config({NODE_ENV:'production',APP_ORIGIN:'https://escola.example'}).production,true);});
test('interface servida com CSP e arquivos privados inacessíveis',async()=>{const r=await fetch(origin);assert.equal(r.status,200);assert.match(r.headers.get('content-security-policy'),/script-src 'self'/);assert.match(await r.text(),/Horizonte/);for(const path of ['/src/app.js','/.env','/data/horizonte-v1.db'])assert.equal((await fetch(origin+path)).status,404);});
