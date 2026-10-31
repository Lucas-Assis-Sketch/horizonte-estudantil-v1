import {writeFileSync} from 'node:fs';
import {app} from 'file:///C:/Users/PC-GAMER/Documents/Codex/2026-10-30/new-chat/work/horizonte-v1/src/app.js';
import {database} from 'file:///C:/Users/PC-GAMER/Documents/Codex/2026-10-30/new-chat/work/horizonte-v1/src/db.js';
const db=database(':memory:');const c={production:false,origin:'http://localhost:4173'};const server=app(db,c,{limits:false}).listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));const url='http://127.0.0.1:'+server.address().port;
async function request(path,method='GET',body,session={},extra={}){const r=await fetch(url+path,{method,headers:{origin:c.origin,'content-type':'application/json',...(session.cookie?{cookie:session.cookie,'x-csrf-token':session.csrf}:{}),...extra},body:body?JSON.stringify(body):undefined});const v=r.status===204?null:await r.json();return{status:r.status,value:v,cookie:r.headers.get('set-cookie')?.split(';')[0],headers:Object.fromEntries(r.headers)};}
const password='Senha de teste longa 123!',newPassword='Nova senha sintética 456!';
async function register(email,className='2A'){const r=await request('/api/auth/register','POST',{email,password,confirmPassword:password,className});return{...r,csrf:r.value.csrfToken};}
const results=[];
try{
const a=await register('attack-a@example.test');
const b=await register('attack-b@example.test');
results.push({test:'email_not_verified',status:a.status,acceptedEmail:a.value.user.email,authenticated:(await request('/api/me','GET',null,a)).status,note:'No mailbox confirmation required. This is not ownership proof.'});
const duplicate=await register('attack-a@example.test');results.push({test:'registration_enumeration',existing:duplicate.status,unused:b.status});
results.push({test:'sql_login_bypass',status:(await request('/api/auth/login','POST',{email:"' OR 1=1--@example.test",password})).status});
results.push({test:'csrf_missing',status:(await request('/api/account/preferences','PATCH',{theme:'dark',accent:'red'},a,{'x-csrf-token':''})).status});
results.push({test:'cross_origin_write',status:(await request('/api/account/preferences','PATCH',{theme:'dark',accent:'red'},a,{origin:'https://evil.example'})).status});
results.push({test:'mass_assignment_other_account',status:(await request('/api/account/preferences','PATCH',{theme:'dark',accent:'red',id:b.value.user.id},a)).status,otherPreferences:(await request('/api/me','GET',null,b)).value.user.preferences});
for(const path of ['/src/app.js','/.env','/data/horizonte-v1.db','/%2e%2e/src/app.js']){const r=await fetch(url+path);results.push({test:'private_file',path,status:r.status});}
const xss=await register('xss@example.test','<img src=x onerror=alert(1)>');results.push({test:'xss_storage',status:xss.status,note:'User-controlled class stored; frontend escape function inspected, no browser execution claimed.'});
for(const delay of [60,80,100,120,140,160]){
 const s=await register('race-'+delay+'@example.test');const t=performance.now();
 const rotation=request('/api/account/password','POST',{currentPassword:password,newPassword,confirmPassword:newPassword},s).then(r=>({...r,ms:performance.now()-t}));
 await new Promise(r=>setTimeout(r,delay));
 const login=await request('/api/auth/login','POST',{email:'race-'+delay+'@example.test',password});
 const loginMs=performance.now()-t;const changed=await rotation;
 const me=login.cookie?await request('/api/me','GET',null,{cookie:login.cookie}):null;
 results.push({test:'password_rotation_race',delayMs:delay,rotationStatus:changed.status,rotationMs:Math.round(changed.ms),oldPasswordLoginStatus:login.status,loginMs:Math.round(loginMs),postRotationSessionStatus:me?.status??null});
}
const limited=app(db,c).listen(0,'127.0.0.1');await new Promise(r=>limited.once('listening',r));const limitedUrl='http://127.0.0.1:'+limited.address().port;const statuses=[];
for(let i=0;i<16;i++)statuses.push((await fetch(limitedUrl+'/api/auth/login',{method:'POST',headers:{origin:c.origin,'content-type':'application/json'},body:JSON.stringify({email:'none@example.test',password})})).status);
results.push({test:'auth_rate_limit',statuses});await new Promise(r=>limited.close(r));
}finally{await new Promise(r=>server.close(r));db.close();}
const output={scope:'loopback only, synthetic accounts, in-memory DB; implementation not modified',results};writeFileSync(new URL('./active-results.json',import.meta.url),JSON.stringify(output,null,2));console.log(JSON.stringify(output,null,2));
