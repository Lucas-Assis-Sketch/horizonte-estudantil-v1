import { config } from './config.js';
import { app } from './app.js';
const c=config();
const server=app(c).listen(c.port,'127.0.0.1',()=>console.log(`IOS 1.1: ${c.origin}`));
server.requestTimeout=15000;server.headersTimeout=10000;
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>server.close(()=>process.exit(0)));
