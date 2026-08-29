// SND//WCH — scripts/backup-db
// Vuelca TODOS los datos del esquema `public` de Supabase a archivos JSON.
//
// POR QUÉ EXISTE. La organización está en el plan `free` de Supabase, y el plan free
// **no tiene respaldos automáticos de ningún tipo**. Hasta el 2026-08-29 no existía ni un
// solo respaldo de esta base: un `delete` sin `where`, una migración mal escrita o una
// cuenta comprometida borraban los pedidos, los clientes, los puntos y el saldo de crédito
// sin ninguna vuelta atrás. Es el único punto de toda la lista de mejoras cuyo peor caso no
// es "se degradó algo", es "se perdió el negocio".
//
// QUÉ RESPALDA Y QUÉ NO. Solo **datos**. El ESQUEMA (tablas, RPCs, políticas, cron jobs)
// ya vive versionado en `supabase/migrations/`, verificado archivo por archivo contra la
// base — duplicarlo acá sería crear una segunda fuente de verdad, que es exactamente el
// defecto que en este repo ya costó tres semanas de precios fantasma. La restauración
// completa es entonces: aplicar las migraciones sobre un proyecto vacío, y después cargar
// estos datos. `scripts/backup-to-sql.mjs` genera el SQL de esa segunda mitad.
//
// CÓMO SE AUTENTICA. Con `SUPABASE_ACCESS_TOKEN`, el MISMO secret que el repo ya usa para
// desplegar las edge functions (`.github/workflows/deploy-api.yml`). No hace falta ningún
// secret nuevo, ninguna cadena de conexión a la base, y ninguna decisión del dueño: por eso
// esto se pudo construir hoy en vez de quedar esperando en la lista de pendientes de él.
//
// LA LISTA DE TABLAS NO ESTÁ ESCRITA A MANO. Se lee de `pg_class` en cada corrida. Una
// lista fija habría dejado fuera, en silencio, cualquier tabla creada después — y el día
// que eso importe es justamente el día del desastre.
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';

const PROJECT_REF = process.env.SUPABASE_PROJECT_REF || 'rjosezuoyngiadunfzyn';
const TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const OUT_DIR = process.env.BACKUP_DIR || 'backup';
const PAGE = Number(process.env.BACKUP_PAGE_SIZE || 2000);

if (!TOKEN) {
  console.error('✗ Falta SUPABASE_ACCESS_TOKEN. Es el mismo secret que usa deploy-api.yml.');
  process.exit(1);
}

// La base de la API es configurable SOLO para poder probar este script de verdad contra un
// servidor de mentira (`tests-api/respaldo.test.ts`): la paginación por ctid y el hash del
// volcado son justo lo que no se puede verificar leyendo el código. En producción nadie
// pasa esta variable.
const API_BASE = process.env.SUPABASE_API_URL || 'https://api.supabase.com';
const API = `${API_BASE}/v1/projects/${PROJECT_REF}/database/query`;

/** Ejecuta SQL por la Management API. Reintenta: una corrida nocturna no puede caerse por
 *  un 502 pasajero y dejar el día sin respaldo. */
async function sql(query, { readOnly = true } = {}) {
  let ultimoError;
  for (let intento = 1; intento <= 4; intento++) {
    try {
      const res = await fetch(API, {
        method: 'POST',
        headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, read_only: readOnly }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 400)}`);
      return await res.json();
    } catch (e) {
      ultimoError = e;
      if (intento < 4) await new Promise((r) => setTimeout(r, 2000 * 2 ** (intento - 1)));
    }
  }
  throw ultimoError;
}

const stamp = new Date().toISOString();

console.log(`Respaldo de ${PROJECT_REF} — ${stamp}`);
rmSync(OUT_DIR, { recursive: true, force: true });
mkdirSync(join(OUT_DIR, 'data'), { recursive: true });

// ── 1. Qué tablas hay. Se descubre, no se asume.
const tablas = (
  await sql(`select c.relname as tabla
             from pg_class c join pg_namespace n on n.oid = c.relnamespace
             where n.nspname = 'public' and c.relkind = 'r'
             order by c.relname`)
).map((r) => r.tabla);
console.log(`  ${tablas.length} tablas`);

// ── 2. Las columnas de cada una. Sirven para dos cosas: reconstruir las tablas en la
//      verificación de restauración (`scripts/restore-check.mjs`) y, sobre todo, detectar
//      que una columna desapareció entre dos respaldos.
const columnas = await sql(
  `select table_name, column_name, ordinal_position, data_type, udt_name, is_nullable
   from information_schema.columns
   where table_schema = 'public'
   order by table_name, ordinal_position`,
);
const esquema = {};
for (const c of columnas) {
  (esquema[c.table_name] ||= []).push({
    nombre: c.column_name,
    tipo: c.data_type,
    udt: c.udt_name,
    nullable: c.is_nullable === 'YES',
  });
}

// ── 3. Las secuencias. Sin esto, una base restaurada empieza a repartir ids que YA
//      existen: el primer pedido nuevo choca contra la clave primaria de uno viejo.
const secuencias = (await sql(`select sequencename, last_value from pg_sequences where schemaname = 'public' order by 1`)).map(
  (s) => ({ nombre: s.sequencename, last_value: s.last_value }),
);

// ── 4. Los cron jobs, como REFERENCIA de que siguen registrados los que deben.
//      El `command` va REDACTADO a propósito: lleva el secreto de cron en texto plano y
//      esto termina guardado como artefacto de GitHub. Mismo criterio que los 4 archivos
//      de `supabase/migrations/` que ya lo llevan redactado.
let crons = [];
try {
  crons = (await sql(`select jobid, jobname, schedule, active from cron.job order by jobname`)).map((j) => ({
    ...j,
    command: '<REDACTADO: lleva el secreto de cron>',
  }));
} catch {
  console.log('  · cron.job no accesible, se omite (no es parte de los datos de negocio)');
}

// ── 5. Los datos, tabla por tabla, paginando por `ctid`.
//      Paginar con OFFSET habría sido más simple y habría estado MAL: sin un ORDER BY
//      estable, dos páginas consecutivas pueden repetir y saltarse filas a la vez. El
//      `ctid` es la posición física, siempre existe y siempre ordena — no hace falta que
//      la tabla tenga clave primaria.
const manifiesto = { proyecto: PROJECT_REF, fecha: stamp, tablas: {} };
let filasTotales = 0;

for (const tabla of tablas) {
  const filas = [];
  let cursor = '(0,0)';
  let pedidoAnterior = null;
  for (;;) {
    // El cursor tiene que ser distinto al de la vuelta pasada. Si no lo es, la próxima
    // consulta devuelve exactamente lo mismo y esto gira para siempre llenando memoria —
    // sea porque el servidor no avanzó o porque el código olvidó mover el cursor. Un
    // respaldo trabado es peor que uno que falla: el workflow queda "en curso" y nadie se
    // entera de que hace días no hay respaldo.
    if (cursor === pedidoAnterior) {
      throw new Error(`${tabla}: el cursor de paginación se quedó en ${cursor}. Volcado abortado.`);
    }
    pedidoAnterior = cursor;
    const pagina = await sql(
      // `row_to_json(t)::text` y no `row_to_json(t)`: si la fila viaja como objeto JSON,
      // JS la reparsea y todo número pasa por un `double`. Un `numeric` con muchos dígitos
      // o un `bigint` por encima de 2^53 vuelven CAMBIADOS, y el respaldo quedaría con un
      // dinero distinto al que la base tiene. Como texto, JS nunca toca los números.
      `select ctid::text as _ctid, row_to_json(t)::text as _fila
       from public."${tabla}" t
       where ctid > '${cursor}'::tid
       order by ctid
       limit ${PAGE}`,
    );
    if (!pagina.length) break;
    for (const p of pagina) filas.push(p._fila);
    cursor = pagina[pagina.length - 1]._ctid;
    if (pagina.length < PAGE) break;
  }

  // `filas` ya son las líneas JSON tal cual las escribió Postgres: no se re-serializan.
  const cuerpo = filas.join('\n') + (filas.length ? '\n' : '');
  writeFileSync(join(OUT_DIR, 'data', `${tabla}.jsonl`), cuerpo);
  manifiesto.tablas[tabla] = {
    filas: filas.length,
    columnas: (esquema[tabla] || []).map((c) => c.nombre),
    sha256: createHash('sha256').update(cuerpo).digest('hex'),
    bytes: Buffer.byteLength(cuerpo),
  };
  filasTotales += filas.length;
  console.log(`  · ${tabla.padEnd(28)} ${String(filas.length).padStart(7)} filas`);
}

writeFileSync(join(OUT_DIR, 'esquema.json'), JSON.stringify(esquema, null, 2));
writeFileSync(join(OUT_DIR, 'secuencias.json'), JSON.stringify(secuencias, null, 2));
writeFileSync(join(OUT_DIR, 'cron.json'), JSON.stringify(crons, null, 2));
manifiesto.filasTotales = filasTotales;
manifiesto.secuencias = secuencias.length;
writeFileSync(join(OUT_DIR, 'manifiesto.json'), JSON.stringify(manifiesto, null, 2));

console.log(`\n✓ ${tablas.length} tablas · ${filasTotales} filas · ${secuencias.length} secuencias → ${OUT_DIR}/`);

// Una base de negocio que respalda CERO filas casi siempre significa que el volcado falló,
// no que el negocio esté vacío. Falla ruidosamente en vez de guardar un archivo vacío que
// nadie va a mirar hasta el día que lo necesite.
const conDatos = Object.values(manifiesto.tablas).filter((t) => t.filas > 0).length;
if (conDatos === 0) {
  console.error('\n✗ Ninguna tabla tiene filas. Esto es casi seguro un volcado fallido, no una base vacía.');
  process.exit(1);
}
