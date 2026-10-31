import { resolve } from 'node:path';
export function config(env = process.env) {
  const production = env.NODE_ENV === 'production';
  const port = Number(env.PORT || 4173);
  if (!Number.isInteger(port) || port < 1024 || port > 65535) throw Error('PORT inválida');
  const origin = env.APP_ORIGIN || `http://127.0.0.1:${port}`;
  const url = new URL(origin);
  if (url.origin !== origin || url.username || url.password || !['http:', 'https:'].includes(url.protocol)) throw Error('APP_ORIGIN inválida');
  if (production && url.protocol !== 'https:') throw Error('Produção exige APP_ORIGIN HTTPS');
  if (!production && !['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname)) throw Error('Desenvolvimento requer origem local');
  if (env.TRUST_PROXY && env.TRUST_PROXY !== 'loopback') throw Error('TRUST_PROXY permitido: loopback');
  return { production, port, origin, trustProxy: env.TRUST_PROXY || false, dbPath: resolve(env.DB_PATH || 'data/horizonte-v1.db') };
}
