import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {app} from '../src/app.js';
import {config} from '../src/config.js';
let server,origin;
before(async()=>{server=app({production:false}).listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));origin=`http://127.0.0.1:${server.address().port}`;});
after(async()=>{await new Promise(r=>server.close(r));});
test('acesso sem sessão e sem emissão de cookie',async()=>{
 for(const path of ['/','/app.js','/styles.css','/palette.css','/favicon.svg']){
  const r=await fetch(origin+path);assert.equal(r.status,200,path);assert.equal(r.headers.get('set-cookie'),null);
 }
 const r=await fetch(origin+'/api/health');assert.deepEqual(await r.json(),{status:'ok',version:'1.1.0'});
});
test('APIs de contas deixam de existir, inclusive com cookie antigo',async()=>{
 for(const [path,method] of [['/api/auth/register','POST'],['/api/auth/login','POST'],['/api/auth/logout','POST'],['/api/me','GET'],['/api/account/password','POST'],['/api/account/preferences','PATCH']]){
  const r=await fetch(origin+path,{method,headers:{cookie:'horizonte-session=legacy','content-type':'application/json'},...(method==='GET'?{}:{body:'{}'})});
  assert.equal(r.status,404,path);assert.equal(r.headers.get('set-cookie'),null);assert.deepEqual(await r.json(),{error:'Recurso não encontrado.'});
 }
});
test('CSP continua ativa e arquivos privados não são servidos',async()=>{
 const r=await fetch(origin);assert.match(r.headers.get('content-security-policy'),/script-src 'self'/);
 for(const path of ['/src/app.js','/.env','/data/horizonte-v1.db','/security/findings.json','/package.json'])assert.equal((await fetch(origin+path)).status,404,path);
});
test('produção mantém requisito de origem HTTPS',()=>{
 assert.throws(()=>config({NODE_ENV:'production',APP_ORIGIN:'http://localhost:4173'}));
 assert.equal(config({NODE_ENV:'production',APP_ORIGIN:'https://escola.example'}).production,true);
});
