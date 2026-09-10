// SND//WCH — scripts/check-crons
// Comprueba que TODA acción de `api` que es un cron tenga su `cron.schedule` versionado.
//
// ── POR QUÉ EXISTE ──
// El 2026-09-10, auditando qué automatizaciones sirven, aparecieron DOS que estaban
// escritas, registradas en la tabla ACTIONS, probadas y documentadas en CLAUDE.md con su
// horario exacto — y que **nunca corrieron ni una vez**: `alert-admin-access` (el aviso de
// que alguien intenta entrar a tu panel: seguridad) y `send-retention-report` (el reporte
// de cohortes, "el mejor dato del panel"). Cero filas en `cron_heartbeats` para las dos.
// No es que fallaran. Es que a nadie se le ocurrió que faltaba el `cron.schedule`.
//
// ⚠ Y EL DEAD-MAN SWITCH NO PODÍA VERLO. `dead_cron_jobs()` cruza `cron.job` contra los
// latidos: detecta un job que dispara y no llega. Un job que nunca se creó no está en
// `cron.job`, así que no entra al cruce. La red de seguridad tenía su punto ciego
// exactamente donde vivía el defecto — que es la definición del problema, no un accidente:
// una alarma solo puede vigilar lo que sabe que existe.
//
// Por eso este chequeo NO es SQL y no consulta la base (que además está bloqueada por el
// proxy de este entorno). Compara dos cosas que sí viven en el repo: la tabla ACTIONS de
// `supabase/functions/api/index.ts` y las migraciones de `supabase/migrations/`.
//
// El modo de fallo que persigue es SILENCIO PURO: no hay excepción, no hay log, no hay
// nada. Solo una automatización que el negocio cree tener.
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

// Prefijos que, por convención de este repo, marcan una acción disparada por cron y no por
// el cliente. Si alguna vez hay una acción de cron con otro nombre, va en EXCEPCIONES.
const PREFIJOS_DE_CRON = /^(alert|remind|expire|reconcile|send|auto|anniversary|bounce)-/;

// Acciones que coinciden con el prefijo pero NO son cron. Cada una con su razón: una lista
// sin motivos se llena de excepciones que nadie recuerda por qué están.
const EXCEPCIONES = {
  'send-order-email': 'la manda el flujo del pedido, no un horario',
  'auto-assign-district': 'la llama el checkout del cliente',
};

const idx = readFileSync(join(ROOT, 'supabase/functions/api/index.ts'), 'utf8');
const tabla = idx.slice(idx.indexOf('const ACTIONS'));
const acciones = [...tabla.matchAll(/^\s*"([a-z0-9-]+)"\s*:/gm)].map((m) => m[1]);

const sql = readdirSync(join(ROOT, 'supabase/migrations'))
  .filter((f) => f.endsWith('.sql'))
  .map((f) => readFileSync(join(ROOT, 'supabase/migrations', f), 'utf8'))
  .join('\n');

// Se busca la acción DENTRO de un cron.schedule, no en cualquier parte del SQL: mencionarla
// en un comentario no la programa.
const programadas = new Set(
  [...sql.matchAll(/cron\.schedule\s*\(([\s\S]*?)\$\$\s*\)/g)]
    .flatMap((m) => [...m[1].matchAll(/'action'\s*,\s*'([a-z0-9-]+)'/g)].map((x) => x[1])),
);

const faltan = acciones.filter(
  (a) => PREFIJOS_DE_CRON.test(a) && !EXCEPCIONES[a] && !programadas.has(a),
);

if (faltan.length) {
  console.error('✗ check:crons — acciones de cron SIN su cron.schedule versionado:\n');
  for (const a of faltan) console.error('  · ' + a);
  console.error(
    `\n${faltan.length} acción(es). Están escritas y registradas en ACTIONS, así que compilan,\n` +
      'pasan el typecheck y se pueden llamar a mano — pero NADIE las dispara. No fallan: no\n' +
      'ocurren. Y `dead_cron_jobs()` tampoco las ve, porque cruza contra los jobs que EXISTEN.\n\n' +
      'Arreglo: aplica el cron con mcp__Supabase__apply_migration y escribe el mismo SQL en\n' +
      'supabase/migrations/<version exacta que registró la base>_<nombre>.sql, en la misma sesión.\n' +
      'Si la acción de verdad no es un cron, agrégala a EXCEPCIONES en este archivo CON SU MOTIVO.',
  );
  process.exit(1);
}

console.log(
  `✓ check:crons — las ${acciones.filter((a) => PREFIJOS_DE_CRON.test(a) && !EXCEPCIONES[a]).length} acciones de cron tienen su cron.schedule versionado`,
);
