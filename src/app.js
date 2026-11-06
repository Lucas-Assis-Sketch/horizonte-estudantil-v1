import express from 'express';
import helmet from 'helmet';
import { fileURLToPath } from 'node:url';

export function app(c) {
 const server=express();
 server.disable('x-powered-by');
 server.set('trust proxy',c.trustProxy||false);
 server.use(helmet({contentSecurityPolicy:{directives:{"script-src":["'self'"],"style-src":["'self'"],"img-src":["'self'",'data:'],"connect-src":["'self'"],"form-action":["'none'"],"upgrade-insecure-requests":c.production?[]:null}},strictTransportSecurity:c.production?undefined:false}));
 server.use((req,res,next)=>{res.set('Cache-Control','no-store');next();});
 server.get('/api/health',(req,res)=>res.json({status:'ok',version:'1.1.0'}));
 // A versão sem contas não abre o banco nem expõe APIs de dados pessoais.
 server.use('/api',(req,res)=>res.status(404).json({error:'Recurso não encontrado.'}));
 server.use(express.static(fileURLToPath(new URL('../frontend/',import.meta.url)),{index:'index.html',dotfiles:'deny',etag:false}));
 server.use((req,res)=>res.status(404).type('text').send('Página não encontrada.'));
 server.use((err,req,res,next)=>{console.error('Falha ao servir a página.');res.status(500).type('text').send('Não foi possível abrir a página. Tente novamente.');});
 return server;
}
