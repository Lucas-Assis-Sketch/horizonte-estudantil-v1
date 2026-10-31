import express from 'express';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createSession, hash, transaction } from './db.js';
import { encodePassword, verifyPassword } from './password.js';
const password = z.string().min(12).max(128);
const email = z.string().trim().max(254).email().transform(s => s.toLowerCase());
const credentials = z.object({ email, password }).strict();
const register = credentials.extend({ confirmPassword: password, className: z.string().trim().min(1).max(80).refine(s => !/[\x00-\x1f\x7f]/.test(s)) }).strict()
  .refine(v => v.password === v.confirmPassword, { message: 'As senhas devem ser iguais', path: ['confirmPassword'] });
const accents = ['red','blue','teal','green','violet','rose','amber','slate'];
const publicAccount = a => ({ id: a.id, email: a.email, className: a.class_name, preferences: { theme: a.theme, accent: a.accent } });
const fail = (status, message) => { throw Object.assign(Error(message), { status }); };
export function app(db, c, { limits = true } = {}) {
  const app = express(), cookieName = c.production ? '__Host-horizonte' : 'horizonte-session';
  const cookieOptions = { httpOnly: true, secure: c.production, sameSite: 'strict', path: '/' };
  app.disable('x-powered-by'); app.set('trust proxy', c.trustProxy || false);
  app.use(helmet({ contentSecurityPolicy: { directives: { "script-src": ["'self'"], "style-src": ["'self'"], "img-src": ["'self'", 'data:'], "connect-src": ["'self'"], "form-action": ["'self'"], "upgrade-insecure-requests": c.production ? [] : null } }, strictTransportSecurity: c.production ? undefined : false }));
  app.use((req,res,next) => { res.set('Cache-Control','no-store'); next(); });
  app.use('/api', express.json({ limit: '8kb' }));
  if (limits) {
    app.use('/api', rateLimit({ windowMs: 60000, limit: 150, standardHeaders: 'draft-8', legacyHeaders: false, message: { error: 'Muitas tentativas. Aguarde um minuto.' } }));
    const authLimit = rateLimit({ windowMs: 15*60000, limit: 15, standardHeaders: 'draft-8', legacyHeaders: false, message: { error: 'Muitas tentativas. Aguarde 15 minutos.' } });
    app.use(['/api/auth/login','/api/auth/register','/api/account/password'], authLimit);
  }
  app.use('/api', (req,res,next) => {
    if (!['GET','HEAD','OPTIONS'].includes(req.method)) {
      if (req.get('origin') !== c.origin || !req.is('application/json')) return res.status(403).json({error:'Requisição não autorizada.'});
    }
    next();
  });
  const readToken = req => (req.headers.cookie || '').split(';').map(s=>s.trim()).find(s=>s.startsWith(cookieName+'='))?.slice(cookieName.length+1);
  function issue(req,res,id) {
    const old = readToken(req); if (old) db.prepare('DELETE FROM sessions WHERE id=?').run(hash(old));
    const s = createSession(db,id); res.cookie(cookieName,s.token,{...cookieOptions,maxAge:s.seconds*1000}); return s;
  }
  const dummy = encodePassword(randomUUID());
  app.get('/api/health', (req,res) => res.json({status:'ok',version:'1.0.0'}));
  app.post('/api/auth/register', async (req,res) => {
    const input = register.parse(req.body);
    const encoded = await encodePassword(input.password);
    if (db.prepare('SELECT id FROM accounts WHERE email=?').get(input.email)) fail(409,'Não foi possível criar a conta com esses dados. Tente entrar ou use outro e-mail.');
    const id = randomUUID();
    transaction(db, () => {
      db.prepare('INSERT INTO accounts(id,email,password_hash,class_name) VALUES (?,?,?,?)').run(id,input.email,encoded,input.className);
      const s = issue(req,res,id);
      res.status(201).json({user:publicAccount(db.prepare('SELECT * FROM accounts WHERE id=?').get(id)),csrfToken:s.csrf});
    });
  });
  app.post('/api/auth/login', async (req,res) => {
    const input = credentials.parse(req.body), a = db.prepare('SELECT * FROM accounts WHERE email=?').get(input.email);
    const valid = await verifyPassword(input.password, a?.password_hash || await dummy);
    if (!a || !valid) fail(401,'E-mail ou senha incorretos.');
    const s = issue(req,res,a.id); res.json({user:publicAccount(a),csrfToken:s.csrf});
  });
  app.use('/api', (req,res,next) => {
    const token = readToken(req), s = token && db.prepare('SELECT * FROM sessions WHERE id=? AND expires>?').get(hash(token),Date.now());
    if (!s) return res.status(401).json({error:'Sua sessão terminou. Entre novamente.'});
    if (!['GET','HEAD','OPTIONS'].includes(req.method) && req.get('x-csrf-token') !== s.csrf) return res.status(403).json({error:'Requisição não autorizada.'});
    req.session=s; next();
  });
  app.get('/api/me', (req,res) => res.json({user:publicAccount(db.prepare('SELECT * FROM accounts WHERE id=?').get(req.session.account_id)),csrfToken:req.session.csrf}));
  app.post('/api/auth/logout', (req,res) => { db.prepare('DELETE FROM sessions WHERE id=?').run(req.session.id); res.clearCookie(cookieName,cookieOptions); res.status(204).end(); });
  app.patch('/api/account/preferences', (req,res) => {
    const p = z.object({theme:z.enum(['light','dark']),accent:z.enum(accents)}).strict().parse(req.body);
    db.prepare('UPDATE accounts SET theme=?,accent=? WHERE id=?').run(p.theme,p.accent,req.session.account_id); res.json({preferences:p});
  });
  app.post('/api/account/password', async (req,res) => {
    const p = z.object({currentPassword:password,newPassword:password,confirmPassword:password}).strict()
      .refine(v=>v.newPassword===v.confirmPassword).refine(v=>v.newPassword!==v.currentPassword).parse(req.body);
    const a = db.prepare('SELECT * FROM accounts WHERE id=?').get(req.session.account_id);
    if (!await verifyPassword(p.currentPassword,a.password_hash)) fail(400,'A senha atual está incorreta.');
    const encoded = await encodePassword(p.newPassword);
    transaction(db, () => {
      const result = db.prepare('UPDATE accounts SET password_hash=? WHERE id=? AND password_hash=?').run(encoded,a.id,a.password_hash);
      if (!result.changes) fail(409,'A senha foi alterada em outra sessão. Entre novamente.');
      db.prepare('DELETE FROM sessions WHERE account_id=?').run(a.id); res.clearCookie(cookieName,cookieOptions);
    });
    res.json({message:'Senha alterada. Entre novamente com a nova senha.'});
  });
  app.use('/api', (req,res) => res.status(404).json({error:'Recurso não encontrado.'}));
  app.use(express.static(fileURLToPath(new URL('../frontend/',import.meta.url)),{index:'index.html',dotfiles:'deny',etag:false}));
  app.use((req,res) => res.status(404).type('text').send('Página não encontrada.'));
  app.use((err,req,res,next) => {
    const status = err instanceof z.ZodError ? 400 : (err.status >=400 && err.status<500 ? err.status : 500);
    if (status===500) console.error(JSON.stringify({event:'request_failed',requestId:randomUUID(),method:req.method}));
    res.status(status).json({error:status===400?'Confira os campos. Senhas: 12 a 128 caracteres; confirmação igual à nova senha.':status===500?'Não foi possível concluir. Tente novamente.':err.message});
  });
  return app;
}
