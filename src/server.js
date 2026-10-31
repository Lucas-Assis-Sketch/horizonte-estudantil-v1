import { config } from './config.js';
import { database } from './db.js';
import { app } from './app.js';
const c=config(),db=database(c.dbPath);
const cleanup=()=>db.prepare('DELETE FROM sessions WHERE expires<=?').run(Date.now()); cleanup();
const timer=setInterval(cleanup,60000).unref();
const server=app(db,c).listen(c.port,'127.0.0.1',()=>console.log(`Horizonte 1.0: ${c.origin}`));
server.requestTimeout=15000;server.headersTimeout=10000;
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>{clearInterval(timer);server.close(()=>{db.close();process.exit(0);});});
