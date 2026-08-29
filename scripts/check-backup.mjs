// SND//WCH — scripts/check-backup
// Comprueba que el respaldo de la base sirve para restaurar, haciendo el viaje completo:
// volcar → generar SQL → cargar en un Postgres de verdad → comparar fila por fila contra
// lo que se volcó.
//
// POR QUÉ EXISTE. Un respaldo que nunca se restauró no es un respaldo, es fe. El modo de
// fallo real no es "no había archivo": es que el archivo existía, se generó todos los días
// durante meses, y el día que hizo falta resultó que a una columna `text[]` la había
// escrito con corchetes en vez de llaves, o que un pedido con una comilla en las notas
// partía el SQL a la mitad. Eso solo se descubre cargándolo.
//
// LOS DATOS DE PRUEBA SON HOSTILES A PROPÓSITO. Comillas simples, `$$`, saltos de línea,
// tildes y emoji, jsonb anidado, arreglos de texto y de enteros, nulos en columnas
// nullables, numeric con decimales que en coma flotante se van a la basura, y una tabla
// con más filas que el tamaño de página para que la paginación por ctid tenga que dar más
// de una vuelta. Un juego de datos "normal" pasa siempre y no prueba nada.
import { execFileSync, spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdtempSync, rmSync, readFileSync, writeFileSync, existsSync, chmodSync } from 'node:fs';
import { globSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const TAM_PAGINA = 3; // chico a propósito: obliga a la paginación a dar varias vueltas

// ── El juego de datos hostil ────────────────────────────────────────────────────────────
const COLS = {
  pedidos: [
    ['ref', 'text', 'text', false],
    ['notas', 'text', 'text', true],
    ['total', 'numeric', 'numeric', false],
    ['items', 'jsonb', 'jsonb', false],
    ['creado', 'timestamp with time zone', 'timestamptz', false],
    ['pagado', 'boolean', 'bool', false],
  ],
  reservas: [
    ['id', 'bigint', 'int8', false],
    ['codigos', 'ARRAY', '_text', true],
    ['cantidades', 'ARRAY', '_int4', true],
  ],
  vacia: [['id', 'bigint', 'int8', false]],
  // Tabla dedicada a la precisión numérica. Sus filas se escriben como TEXTO JSON crudo
  // porque son valores que JavaScript no puede representar: un bigint por encima de 2^53 y
  // un numeric con más dígitos de los que entran en un double. Si el volcado los hiciera
  // pasar por JSON.parse volverían cambiados, y el respaldo tendría un dinero distinto al
  // que la base guarda.
  precision: [
    ['id', 'bigint', 'int8', false],
    ['monto', 'numeric', 'numeric', false],
  ],
};

const FILAS = {
  pedidos: [
    { ref: 'A-1', notas: "sin cebolla, con 'aioli'", total: 20.9, items: { s: ['SIG01'] }, creado: '2026-08-27T01:49:41.669174+00:00', pagado: true },
    { ref: 'A-2', notas: 'línea uno\nlínea dos\ttab', total: 34.9, items: { s: [] }, creado: '2026-08-27T02:00:00+00:00', pagado: false },
    { ref: 'A-3', notas: null, total: 0.1, items: { nota: '$$ y $j$ y \\backslash' }, creado: '2026-08-27T03:00:00+00:00', pagado: true },
    { ref: 'A-4', notas: 'ñandú 🥪 «acentos»', total: 1234.56, items: { anidado: { a: [1, 2, { b: null }] } }, creado: '2026-08-27T04:00:00+00:00', pagado: false },
    { ref: 'A-5', notas: '"comillas dobles"', total: 0, items: {}, creado: '2026-08-27T05:00:00+00:00', pagado: true },
    { ref: 'A-6', notas: '', total: 99.99, items: { s: ['SIG05'] }, creado: '2026-08-27T06:00:00+00:00', pagado: false },
    { ref: 'A-7', notas: 'último', total: 16.42, items: { s: ['SIG02'] }, creado: '2026-08-27T07:00:00+00:00', pagado: true },
  ],
  reservas: [
    { id: 1, codigos: ['P01', "con'comilla"], cantidades: [2, 3] },
    { id: 2, codigos: null, cantidades: null },
    { id: 3, codigos: [], cantidades: [] },
  ],
  vacia: [],
  precision: [
    '{"id":9007199254740993,"monto":12345678901234567890.123456789}',
    '{"id":9223372036854775807,"monto":0.10000000000000000001}',
  ],
};

const SECUENCIAS = [
  { sequencename: 'pedidos_id_seq', last_value: 42 },
  { sequencename: 'nunca_usada_seq', last_value: null },
];

// ── Un servidor que finge ser la Management API de Supabase ─────────────────────────────
function responder(q) {
  if (/from pg_class/.test(q)) return Object.keys(COLS).map((t) => ({ tabla: t }));
  if (/information_schema\.columns/.test(q)) {
    return Object.entries(COLS).flatMap(([t, cs]) =>
      cs.map(([column_name, data_type, udt_name, nul], i) => ({
        table_name: t, column_name, ordinal_position: i + 1, data_type, udt_name,
        is_nullable: nul ? 'YES' : 'NO',
      })),
    );
  }
  if (/pg_sequences/.test(q)) return SECUENCIAS;
  if (/cron\.job/.test(q)) return [{ jobid: 1, jobname: 'x', schedule: '0 * * * *', active: true, command: 'select net.http_post(... secreto ...)' }];
  const m = q.match(/from public\."([^"]+)"[\s\S]*ctid > '\((\d+),(\d+)\)'::tid[\s\S]*limit (\d+)/);
  if (m) {
    const [, tabla, , off, lim] = m;
    return FILAS[tabla]
      // Como la API real: la fila viaja ya serializada por Postgres, no como objeto. Las
      // filas que ya vienen como texto se pasan tal cual (ver la tabla `precision`).
      .map((f, i) => ({ _ctid: `(0,${i + 1})`, _fila: typeof f === 'string' ? f : JSON.stringify(f) }))
      .filter((_, i) => i + 1 > Number(off))
      .slice(0, Number(lim));
  }
  throw new Error('consulta no prevista por el servidor de prueba: ' + q.slice(0, 120));
}

const server = createServer((req, res) => {
  let cuerpo = '';
  req.on('data', (c) => (cuerpo += c));
  req.on('end', () => {
    try {
      const salida = responder(JSON.parse(cuerpo).query);
      res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify(salida));
    } catch (e) {
      res.writeHead(500).end(String(e.message));
    }
  });
});

// El servidor de prueba vive en ESTE proceso, así que el hijo tiene que correr de forma
// asíncrona: con execFileSync el bucle de eventos queda bloqueado y el servidor nunca llega
// a contestarle — se traban los dos esperándose.
function correr(args, env) {
  return new Promise((res, rej) => {
    const hijo = spawn(process.execPath, args, { env: { ...process.env, ...env } });
    let salida = '', err = '';
    hijo.stdout.on('data', (d) => (salida += d));
    hijo.stderr.on('data', (d) => (err += d));
    hijo.on('close', (code) => (code === 0 ? res(salida) : rej(new Error(`${args[0]} salió con ${code}\n${err}${salida}`))));
  });
}

// ── Postgres desechable ─────────────────────────────────────────────────────────────────
// El chequeo levanta su propio clúster en vez de exigir uno configurado. Es lo que lo hace
// parte de `npm run verify` en cualquier máquina: si dependiera de una variable de entorno,
// la comprobación se saltaría en silencio justo donde nadie la está mirando, que es la
// única forma en que un respaldo se pudre sin que nadie se entere.
function levantarPostgres() {
  if (process.env.CHECK_BACKUP_PG) return { url: process.env.CHECK_BACKUP_PG, parar() {} };

  const bin = [...globSync('/usr/lib/postgresql/*/bin'), ...globSync('/usr/local/pgsql/bin'), ''].find(
    (d) => existsSync(join(d, 'initdb')),
  );
  if (bin === undefined) return null;

  const base = mkdtempSync(join('/var/tmp', 'sndwch-pgtest-'));
  const datos = join(base, 'datos');
  const puerto = 5000 + (process.pid % 20000);
  // initdb se niega a correr como root. En este contenedor la sesión ES root, en un runner
  // de GitHub no — así que se resuelven los dos casos en vez de asumir uno.
  const comoRoot = typeof process.getuid === 'function' && process.getuid() === 0;
  const correrPg = (cmd) =>
    comoRoot
      ? execFileSync('su', ['postgres', '-c', cmd], { stdio: 'pipe' })
      : execFileSync('sh', ['-c', cmd], { stdio: 'pipe' });
  if (comoRoot) {
    chmodSync(base, 0o777);
    execFileSync('chown', ['postgres:postgres', base], { stdio: 'pipe' });
  }
  correrPg(`${join(bin, 'initdb')} -D ${datos} -U postgres --auth=trust -E UTF8`);
  // El `-l` no es cosmético: sin él el servidor hereda la salida de pg_ctl, ese pipe nunca
  // se cierra mientras Postgres siga vivo, y execFileSync se queda esperando para siempre a
  // un proceso que ya terminó.
  correrPg(`${join(bin, 'pg_ctl')} -D ${datos} -o '-p ${puerto} -k ${base}' -l ${join(base, 'servidor.log')} -w start`);
  const url = `postgresql://postgres@/postgres?host=${base}&port=${puerto}`;
  return {
    url,
    parar() {
      try {
        correrPg(`${join(bin, 'pg_ctl')} -D ${datos} -m immediate stop`);
      } catch {}
      rmSync(base, { recursive: true, force: true });
    },
  };
}

// El servidor de prueba vive en ESTE proceso, así que el hijo tiene que correr de forma
const problemas = [];
const dir = mkdtempSync(join(tmpdir(), 'sndwch-backup-'));

await new Promise((r) => server.listen(0, '127.0.0.1', r));
const puerto = server.address().port;
const pg = levantarPostgres();

try {
  // ── 1. Volcar ─────────────────────────────────────────────────────────────────────────
  await correr([join(ROOT, 'scripts/backup-db.mjs')], {
    SUPABASE_ACCESS_TOKEN: 'token-de-prueba',
    SUPABASE_API_URL: `http://127.0.0.1:${puerto}`,
    SUPABASE_PROJECT_REF: 'proyecto-de-prueba',
    BACKUP_DIR: dir,
    BACKUP_PAGE_SIZE: String(TAM_PAGINA),
  });

  const manifiesto = JSON.parse(readFileSync(join(dir, 'manifiesto.json'), 'utf8'));

  // La paginación es lo único que no se puede comprobar leyendo el código: con 7 filas y
  // páginas de 3 tiene que dar 3 vueltas y no repetir ni saltarse ninguna.
  for (const [tabla, esperadas] of Object.entries(FILAS)) {
    const leidas = readFileSync(join(dir, 'data', `${tabla}.jsonl`), 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
    if (leidas.length !== esperadas.length) {
      problemas.push(`${tabla}: se volcaron ${leidas.length} filas y había ${esperadas.length}. La paginación por ctid se saltó o repitió filas.`);
    }
    if (manifiesto.tablas[tabla]?.filas !== esperadas.length) {
      problemas.push(`${tabla}: el manifiesto dice ${manifiesto.tablas[tabla]?.filas} filas y el archivo tiene ${leidas.length}.`);
    }
  }
  // El volcado en sí no puede tocar los números: las líneas del archivo tienen que ser,
  // carácter por carácter, lo que escribió Postgres.
  const crudoPrecision = readFileSync(join(dir, 'data', 'precision.jsonl'), 'utf8').split('\n').filter(Boolean);
  if (crudoPrecision.join('\u0001') !== FILAS.precision.join('\u0001')) {
    problemas.push(
      `El volcado alteró números que JavaScript no puede representar (bigint sobre 2^53, numeric largo).\n      esperado: ${FILAS.precision.join(' | ')}\n      volcado:  ${crudoPrecision.join(' | ')}`,
    );
  }
  if (!/REDACTADO/.test(readFileSync(join(dir, 'cron.json'), 'utf8'))) {
    problemas.push('cron.json guardó el comando del cron sin redactar: lleva el secreto de cron y esto termina como artefacto de GitHub.');
  }

  // ── 2. Generar el SQL de restauración ─────────────────────────────────────────────────
  const sql = await correr([join(ROOT, 'scripts/backup-to-sql.mjs'), '--ddl', dir], {});
  writeFileSync(join(dir, 'restaurar.sql'), sql);

  // ── 3. Cargarlo en un Postgres de verdad y comparar ───────────────────────────────────
  if (!pg) {
    problemas.push('No se encontró Postgres para la prueba de restauración (ni CHECK_BACKUP_PG ni initdb instalado). Sin cargarlo de verdad esto solo comprueba el volcado, y un respaldo que nunca se restauró no es un respaldo.');
  } else {
    const PG = pg.url;
    let cargo = true;
    try {
      execFileSync('psql', [PG, '-v', 'ON_ERROR_STOP=1', '-q', '-f', join(dir, 'restaurar.sql')], { stdio: 'pipe' });
    } catch (e) {
      cargo = false;
      problemas.push(`El SQL del respaldo no carga en Postgres:\n      ${String(e.stderr || e.message).trim().split('\n').join('\n      ')}`);
    }
    for (const [tabla, esperadas] of Object.entries(cargo ? FILAS : {})) {
      const salida = execFileSync(
        'psql',
        [PG, '-t', '-A', '-c', `select coalesce(string_agg(row_to_json(t)::text, e'\\n' order by row_to_json(t)::text), '') from public."${tabla}" t`],
        { encoding: 'utf8' },
      ).replace(/\n$/, '');
      const crudas = salida ? salida.split('\n') : [];

      // Contenido: se comparan como objetos. El texto crudo no sirve acá porque `jsonb`
      // tiene su propia forma canónica de escribirse ({"a": 1} con espacio) y compararlo
      // contra lo que emite JSON.stringify daría un falso positivo por puro formato.
      const norm = (fs) => fs.map((f) => JSON.stringify(typeof f === 'string' ? JSON.parse(f) : f)).sort().join('\u0001');
      if (norm(crudas) !== norm(esperadas)) {
        problemas.push(
          `${tabla}: lo restaurado NO coincide con lo respaldado.\n      respaldado: ${norm(esperadas).replaceAll('\u0001', ' | ').slice(0, 400)}\n      restaurado: ${norm(crudas).replaceAll('\u0001', ' | ').slice(0, 400)}`,
        );
      }

      // Precisión numérica: acá SÍ se compara el texto exacto, porque es justo lo que se
      // vigila. La tabla `precision` no tiene jsonb a propósito, así que no hay ambigüedad
      // de formato — cualquier diferencia es un número que volvió cambiado.
      if (tabla === 'precision') {
        const ordenadas = [...crudas].sort();
        const quiero = [...esperadas].sort();
        if (ordenadas.join('\u0001') !== quiero.join('\u0001')) {
          problemas.push(
            `precision: la restauración cambió un número.\n      respaldado: ${quiero.join(' | ')}\n      restaurado: ${ordenadas.join(' | ')}`,
          );
        }
      }
    }
    // Las secuencias sin usar no se tocan; las que tenían valor deben quedar donde estaban.
    if (!/setval\('public\."pedidos_id_seq"', 42, true\)/.test(sql)) {
      problemas.push('El SQL no restaura la secuencia pedidos_id_seq en 42: una base restaurada repartiría ids que ya existen.');
    }
    // `setval(seq, null)` es un error de Postgres, así que una secuencia nunca usada no
    // puede aparecer en ese bloque (sí puede aparecer en el DDL: existe igual).
    if (/setval\([^)]*nunca_usada_seq/.test(sql)) {
      problemas.push('El SQL hace setval de una secuencia que nunca se usó (last_value nulo): eso es un error en Postgres y corta la restauración a la mitad.');
    }
  }
} finally {
  server.close();
  pg?.parar();
  rmSync(dir, { recursive: true, force: true });
}

if (problemas.length) {
  console.error(`\n✗ Respaldo/restauración: ${problemas.length} problema(s)\n`);
  for (const p of problemas) console.error('  • ' + p + '\n');
  process.exit(1);
}
console.log('✓ Respaldo: volcado, SQL y restauración en Postgres real coinciden fila por fila');
