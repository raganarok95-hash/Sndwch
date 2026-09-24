// SND//WCH — scripts/e2e/servidor-local
// Levanta el BACKEND REAL, completo, en esta máquina:
//   Postgres propio con el esquema real (supabase/esquema-actual.sql)
//   → PostgREST (lo mismo que Supabase pone delante de la base)
//   → un proxy que imita la ruta /rest/v1 de Supabase
//   → la edge function `api` tal cual está en supabase/functions, corriendo en Deno.
//
// Nada está simulado salvo lo que sale a terceros (Culqi, Resend, Meta, Web Push): sin sus
// claves, el propio código ya los salta. Así un flujo de punta a punta ejecuta cada línea del
// servidor y cada función de la base, que es justo lo que las pruebas de pantalla no hacen
// (mockean el `api` entero).
import { execFileSync, spawn } from 'node:child_process';
import { createServer, request } from 'node:http';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { levantarPostgres } from '../pg-local/postgres.mjs';
import { cargarEsquema, psql } from '../pg-local/esquema.mjs';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const VERSION_POSTGREST = 'v12.2.3';

/** PostgREST en una caché fuera de git. Si no se puede bajar, se DICE: un flujo de punta a punta
 *  que se salta en silencio es peor que no tenerlo. */
function binPostgrest() {
  const dir = join(RAIZ, '.cache', 'postgrest', VERSION_POSTGREST);
  const bin = join(dir, 'postgrest');
  if (existsSync(bin)) return bin;
  mkdirSync(dir, { recursive: true });
  const url = `https://github.com/PostgREST/postgrest/releases/download/${VERSION_POSTGREST}/postgrest-${VERSION_POSTGREST}-linux-static-x64.tar.xz`;
  try {
    execFileSync('sh', ['-c', `curl -sSfL --max-time 120 '${url}' | tar -xJ -C '${dir}'`], { stdio: 'pipe' });
  } catch (e) {
    throw new Error(`No se pudo descargar PostgREST (${url}): ${String(e.stderr || e.message).slice(0, 300)}`);
  }
  return bin;
}

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
async function hastaQueResponda(url, cuerpo, intentos = 80) {
  for (let i = 0; i < intentos; i++) {
    try {
      const r = await fetch(url, cuerpo ? { method: 'POST', body: JSON.stringify(cuerpo), headers: { 'Content-Type': 'application/json' } } : undefined);
      if (r.status < 500) return;
    } catch { /* todavía no */ }
    await esperar(250);
  }
  throw new Error(`${url} no respondió a tiempo`);
}
function puertoLibre() {
  return new Promise((resolve) => {
    const s = createServer();
    s.listen(0, '127.0.0.1', () => {
      const p = s.address().port;
      s.close(() => resolve(p));
    });
  });
}

export async function levantarServidor({ semilla = '' } = {}) {
  const procesos = [];
  const temporales = [];
  let pg = null;
  let proxy = null;
  const parar = () => {
    for (const p of procesos) try { p.kill('SIGKILL'); } catch { /* ya terminó */ }
    if (proxy) proxy.close();
    if (pg) pg.parar();
    for (const t of temporales) rmSync(t, { recursive: true, force: true });
  };
  try {
    pg = levantarPostgres();
    if (!pg) throw new Error('No hay Postgres local (initdb).');
    cargarEsquema(pg.url);
    // Lo mínimo para que la tienda esté abierta y reciba pedidos, sin tocar nada más.
    psql(pg.url, `
      insert into app_settings (id, business_launched) values (true, true);
      insert into store_hours (weekday, open_hour, close_hour, closed) select d, 0, 24, false from generate_series(0, 6) d;
      ${semilla}`);

    // PostgREST, entrando como service_role (la clave con la que corre el `api` en Supabase).
    const pPostgrest = await puertoLibre();
    const conf = mkdtempSync(join(tmpdir(), 'sndwch-postgrest-'));
    temporales.push(conf);
    writeFileSync(join(conf, 'postgrest.conf'), [
      `db-uri = "${pg.url.replace('postgresql://postgres@/postgres?', 'postgres://postgres@/postgres?')}"`,
      'db-schemas = "public"',
      'db-anon-role = "service_role"',
      `server-port = ${pPostgrest}`,
      'server-host = "127.0.0.1"',
    ].join('\n'));
    const postgrest = spawn(binPostgrest(), [join(conf, 'postgrest.conf')], { stdio: ['ignore', 'pipe', 'pipe'] });
    procesos.push(postgrest);
    let logPostgrest = '';
    postgrest.stderr.on('data', (d) => (logPostgrest += d));
    postgrest.stdout.on('data', (d) => (logPostgrest += d));
    await hastaQueResponda(`http://127.0.0.1:${pPostgrest}/`).catch((e) => {
      throw new Error(e.message + '\n' + logPostgrest.slice(-800));
    });

    // Supabase sirve PostgREST en /rest/v1 y valida la clave antes. El proxy quita el prefijo y
    // los encabezados de autenticación (PostgREST local entra siempre como service_role).
    const pProxy = await puertoLibre();
    proxy = createServer((req, res) => {
      const ruta = req.url.replace(/^\/rest\/v1/, '');
      const headers = { ...req.headers };
      delete headers.authorization;
      delete headers.apikey;
      delete headers.host;
      const up = request({ host: '127.0.0.1', port: pPostgrest, path: ruta, method: req.method, headers }, (r) => {
        res.writeHead(r.statusCode || 500, r.headers);
        r.pipe(res);
      });
      up.on('error', (e) => { res.writeHead(502); res.end(String(e)); });
      req.pipe(up);
    });
    await new Promise((r) => proxy.listen(pProxy, '127.0.0.1', r));

    // El `api` real. Se copia a una carpeta temporal para quitarle la línea de tipos de ambiente
    // de jsr.io (bloqueado por el proxy de red, y solo son tipos: no cambia nada al correr).
    const fn = mkdtempSync(join(tmpdir(), 'sndwch-api-'));
    temporales.push(fn);
    cpSync(join(RAIZ, 'supabase', 'functions'), join(fn, 'functions'), { recursive: true });
    const entrada = join(fn, 'functions', 'api', 'index.ts');
    // Y el puerto: en Supabase lo pone la plataforma; acá se le pasa por variable de entorno.
    const codigo = readFileSync(entrada, 'utf8')
      .replace(/^import "jsr:[^"]*";\n/m, '')
      .replace('Deno.serve(async (req', 'Deno.serve({ port: Number(Deno.env.get("PUERTO_LOCAL")), hostname: "127.0.0.1" }, async (req');
    if (!codigo.includes('PUERTO_LOCAL')) throw new Error('El entrypoint del api cambió: no se encontró `Deno.serve(async (req`.');
    writeFileSync(entrada, codigo);
    const pApi = await puertoLibre();
    const api = spawn(join(RAIZ, 'node_modules', '.bin', 'deno'), ['run', '--no-check', '--allow-net', '--allow-env', '--allow-read', entrada], {
      cwd: fn,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: {
        ...process.env,
        SUPABASE_URL: `http://127.0.0.1:${pProxy}`,
        SUPABASE_SERVICE_ROLE_KEY: 'clave-local',
        SESSION_SECRET: 'secreto-de-sesion-local-de-pruebas-e2e',
        PUERTO_LOCAL: String(pApi),
      },
    });
    procesos.push(api);
    let logApi = '';
    api.stderr.on('data', (d) => (logApi += d));
    api.stdout.on('data', (d) => (logApi += d));
    const URL_API = `http://127.0.0.1:${pApi}`;
    await hastaQueResponda(URL_API, { action: 'ping' }).catch((e) => {
      throw new Error(e.message + '\n' + logApi.slice(-1500));
    });

    return {
      url: URL_API,
      sql: (q) => psql(pg.url, q),
      log: () => logApi,
      async llamar(accion, datos = {}) {
        const r = await fetch(URL_API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: accion, ...datos }) });
        const cuerpo = await r.json().catch(() => ({}));
        return { status: r.status, ...cuerpo };
      },
      parar,
    };
  } catch (e) {
    parar();
    throw e;
  }
}
