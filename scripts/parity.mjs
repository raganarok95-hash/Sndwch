// Comprobación de paridad cliente ↔ servidor.
//
// Hay ~20 constantes que existen DOS veces en este repo: una en `src/app/` (para que el
// cliente pueda mostrar precios y totales sin esperar al servidor) y otra en
// `supabase/functions/api/` (que es la que de verdad cobra). Hasta ahora la única defensa
// contra que se separen era un comentario "DEBE coincidir con ..." al lado de cada una, y
// un comentario no falla el build. Cuando se separan, el cliente muestra un precio y el
// servidor cobra otro.
//
// Desde el 2026-08-26 también compara los NOMBRES de todo el catálogo (ver la sección al
// final del archivo). Antes solo cubría dinero y composición, así que un nombre podía
// quedar distinto entre lo que ve el cliente y lo que sale impreso en su recibo sin que
// nada lo detectara.
//
// Esto compara los dos lados leyendo los archivos como texto (no se pueden importar: el
// servidor es Deno con imports .ts y el cliente es un script plano sin exports) y devuelve
// código 1 si hay alguna diferencia. Corre dentro de `npm run verify`.
//
// OJO — esto NO reemplaza la revisión de `catalog_prices` en la base de datos: en runtime
// esa tabla se carga ENCIMA de los literales del servidor, así que dos archivos idénticos
// pueden seguir sin coincidir con lo que se cobra de verdad (ver CLAUDE.md). Esto solo
// garantiza que los dos lados del CÓDIGO digan lo mismo.

import { readFileSync, readdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
// El cliente ya no es un solo archivo: vive en src/app/NN-*.ts y el build los concatena
// por orden alfabético (ver scripts/build.mjs y scripts/check-bundle.mjs). Acá se leen y
// se pegan igual, así que todos los regex de abajo siguen funcionando exactamente como
// cuando había un único src/app.ts — este script nunca necesitó saber dónde empieza y
// termina cada parte, solo que el texto completo esté disponible.
const app = readdirSync(join(ROOT, 'src/app'))
  .filter((f) => f.endsWith('.ts'))
  .sort()
  .map((f) => readFileSync(join(ROOT, 'src/app', f), 'utf8'))
  .join('\n');
const catalog = readFileSync(join(ROOT, 'supabase/functions/api/catalog.ts'), 'utf8');
const env = readFileSync(join(ROOT, 'supabase/functions/api/env.ts'), 'utf8');
const customer = readFileSync(join(ROOT, 'supabase/functions/api/actions/customer.ts'), 'utf8');

const problems = [];
let checks = 0;

// `etiquetas` existe porque no todas las comprobaciones de este script son cliente↔servidor:
// las de los supuestos del modelo comparan env.ts contra el Python de `modelo/`. Un error que
// nombra mal las dos partes manda a abrir el archivo equivocado, que es peor que un error
// escueto.
function cmp(what, clientVal, serverVal, etiquetas) {
  checks++;
  const [ea, eb] = etiquetas || ['cliente', 'servidor'];
  const a = JSON.stringify(clientVal);
  const b = JSON.stringify(serverVal);
  if (a !== b) problems.push(`${what}\n    ${ea}: ${a}\n    ${eb}: ${b}`);
}

// Falla ruidosamente si un patrón deja de encontrar nada: un regex que dejó de matchear
// (porque alguien reformateó el archivo) se vería como "todo coincide" y sería peor que
// no tener esta comprobación.
function need(map, what) {
  if (!map || Object.keys(map).length === 0) {
    problems.push(`${what}: no se pudo extraer nada — el formato del archivo cambió y este script quedó ciego`);
    return {};
  }
  return map;
}

function scalar(src, name, re, file) {
  const m = src.match(re);
  if (!m) {
    problems.push(`${name}: no se encontró en ${file} — el formato cambió y este script quedó ciego`);
    return null;
  }
  return Number(m[1]);
}

// ── YA NO HAY DOS COPIAS QUE COMPARAR (2026-09-24) ─────────────────────────────────────
// La carta (`_shared/carta.ts`), el dinero (`_shared/dinero.ts`) y las reglas del negocio
// (`_shared/reglas.ts`: envío, tienda, horario, rangos, referidos, retos, tarjeta, Plan Semanal,
// cola, ventana de entrega, «Algo salió mal») viven UNA sola vez y las importan el cliente y el
// servidor. Lo que se vigila es que ninguna vuelva a escribirse como valor propio en un lado,
// que es exactamente como empieza una segunda copia. Los puntos del referido y la escalera se
// DERIVAN de las recompensas en reglas.ts: su invariante ya no se compara, se cumple.
const reglasTxt = readFileSync(join(ROOT, 'supabase/functions/_shared/reglas.ts'), 'utf8');
const NOMBRES_DE_REGLAS = [...reglasTxt.matchAll(/^export const ([A-Z][A-Z0-9_]+)/gm)].map((m) => m[1]);
if (NOMBRES_DE_REGLAS.length < 20) problems.push(`reglas.ts: solo se leyeron ${NOMBRES_DE_REGLAS.length} reglas; ¿cambió su forma?`);
const servidor = [
  ['env.ts', env], ['catalog.ts', catalog], ['actions/customer.ts', customer],
  ['actions/problems.ts', readFileSync(join(ROOT, 'supabase/functions/api/actions/problems.ts'), 'utf8')],
];
const DE_DINERO = ['COMBO_DISCOUNT_PER_PAIR', 'OFFPEAK_DRINK_PROMO_CAP', 'ORGANIZER_FREE_MIN_SANDWICHES', 'EXTRA_SAUCE_PRICE', 'BASE_SURCHARGE', 'OFFPEAK_DRINK_PROMO_HOURS_LIMA'];
for (const [nombre, origen] of [...NOMBRES_DE_REGLAS.map((n) => [n, 'reglas.ts']), ...DE_DINERO.map((n) => [n, 'dinero.ts (REGLAS)'])]) {
  for (const [archivo, texto] of [['src/app/', app], ...servidor]) {
    checks++;
    // Un valor propio es un literal (número, texto, lista u objeto) donde debería ir la lectura.
    const re = new RegExp('(?:var|const|let)\\s+' + nombre + '\\b[^=\\n]*=\\s*[-\\d{\\[\'"]');
    if (re.test(texto)) problems.push(`${nombre}: ${archivo} lo vuelve a escribir como valor propio. Vive en _shared/${origen}; léelo de ahí.`);
  }
}

// ---------- los supuestos del modelo financiero: env.ts ↔ Python ----------
//
// ESTE BLOQUE NO COMPARA CLIENTE CONTRA SERVIDOR, sino el SERVIDOR contra el MODELO EN
// PYTHON, y es el único de este script que cruza lenguajes.
//
// Por qué hace falta: `MODELO_SUPUESTOS` (env.ts) es lo que la pantalla "Las tres palancas"
// enseña como "el modelo asume X", y el modelo de verdad vive en `modelo/comparativa_menu.py`
// y `modelo/modelo_v11_metas.py`. Son dos copias del mismo número en dos lenguajes que nada
// más conecta. Si el modelo se re-corre con otro supuesto y nadie toca env.ts, la pantalla
// sigue midiendo contra una meta que ya no existe — y no falla nada: solo miente en silencio.
// Es exactamente el defecto que este repo documenta para los textos de marketing.
//
// Se leen del Python con regex, igual que el resto de este script lee TypeScript. Si el
// formato del Python cambia, el chequeo lo DICE en vez de pasar en blanco.
const compMenu = readFileSync(join(ROOT, 'modelo/comparativa_menu.py'), 'utf8');
const metasPy = readFileSync(join(ROOT, 'modelo/modelo_v11_metas.py'), 'utf8');

function pyNum(src, nombre, archivo) {
  const m = src.match(new RegExp('^' + nombre + '\\s*=\\s*([0-9.]+)', 'm'));
  if (!m) {
    problems.push(`${nombre}: no se encontró en ${archivo} — el formato cambió y este chequeo quedó ciego`);
    return null;
  }
  return Number(m[1]);
}
function cmpModelo(what, archivoPy, envVal, pyVal) {
  cmp(what, envVal, pyVal, ['env.ts', archivoPy]);
}
function tsSupuesto(nombre) {
  const bloque = env.match(/export const MODELO_SUPUESTOS = \{([\s\S]*?)\}/);
  if (!bloque) {
    problems.push('MODELO_SUPUESTOS: no se encontró en env.ts — el formato cambió y este chequeo quedó ciego');
    return null;
  }
  const m = bloque[1].match(new RegExp(nombre + ':\\s*([0-9.]+)'));
  if (!m) {
    problems.push(`MODELO_SUPUESTOS.${nombre}: no está en env.ts`);
    return null;
  }
  return Number(m[1]);
}
// El Python guarda fracciones (0.50) y env.ts porcentajes (50), porque es lo que la pantalla
// enseña. La conversión se hace acá, en un solo sitio, y es parte de lo que se verifica.
cmpModelo('Supuesto del modelo: mezcla ARMA EL TUYO (FRAC_BYO ↔ byoPct)', 'modelo/comparativa_menu.py',
    tsSupuesto('byoPct'), (pyNum(compMenu, 'FRAC_BYO', 'comparativa_menu.py') ?? 0) * 100);
cmpModelo('Supuesto del modelo: attach de bebida (DRINK_ATTACH ↔ drinkPct)', 'modelo/comparativa_menu.py',
    tsSupuesto('drinkPct'), (pyNum(compMenu, 'DRINK_ATTACH', 'comparativa_menu.py') ?? 0) * 100);
cmpModelo('Supuesto del modelo: viralidad (VIRAL ↔ referralsPer100)', 'modelo/modelo_v11_metas.py',
    tsSupuesto('referralsPer100'), (pyNum(metasPy, 'VIRAL', 'modelo_v11_metas.py') ?? 0) * 100);

// ---------- el techo de CAC contra el Python ----------
//
// Estos NO se comparan contra una copia del número en otro archivo: se obtienen CORRIENDO
// `modelo/modelo_v11.py`. `CONTRIB_PEDIDO` allá no es un literal — lo calcula
// `_contrib_menu("actual", FRAC_BYO)` a partir del catálogo — así que un regex sobre el
// fuente no lo vería, y una copia escrita a mano se desincronizaría el día que cambie un
// precio desde el panel sin que nada avise.
//
// Es el mismo criterio que ya se aplica a MODELO_SUPUESTOS, llevado un paso más allá: aquel
// compara dos literales, éste compara contra el resultado real del modelo. Importa porque
// sobre `contribPedido` se calcula el TECHO: si el servidor cree que un pedido deja S/14.13
// y en realidad deja S/12, el freno deja pasar un CAC que ya está quemando plata.
function modeloV11Numeros() {
  const py = [
    'import sys; sys.path.insert(0, "modelo")',
    'import modelo_v11 as M',
    'print("%.2f|%.2f|%.2f|%.2f" % (M.CONTRIB_PEDIDO, M.OVERHEAD_POR_PEDIDO, M.COSTO_REFERIDO, M.CONV_APRENDIZAJE_7D))',
  ].join('; ');
  // ⚠ `-B` Y `PYTHONPYCACHEPREFIX` NO SON HIGIENE: sin ellos este chequeo compara contra un
  // modelo VIEJO y no se entera. Python valida su bytecode cacheado por (mtime, tamaño) del
  // fuente, así que cambiar `0.50` por `0.85` —mismo número de bytes— dentro del mismo
  // segundo deja la caché dándose por válida. Pasó de verdad al probar este chequeo: el
  // fuente decía 0.50, `import` devolvía 0.85, y parity reportaba una diferencia que ya no
  // existía. Al revés es peor: habría dado verde sobre un techo desactualizado.
  // `-B` no basta por sí solo (impide ESCRIBIR caché, no leerla); el prefijo a un directorio
  // temporal es lo que garantiza compilación en frío. Cuesta ~0.1 s.
  const cacheFria = mkdtempSync(join(tmpdir(), 'sndwch-pyc-'));
  try {
    const out = execFileSync('python3', ['-B', '-c', py], {
      cwd: ROOT, encoding: 'utf8', timeout: 30000,
      env: { ...process.env, PYTHONPYCACHEPREFIX: cacheFria, PYTHONDONTWRITEBYTECODE: '1' },
    }).trim();
    const partes = out.split('\n').pop().split('|').map(Number);
    if (partes.length !== 4 || partes.some((n) => !Number.isFinite(n))) throw new Error('salida inesperada: ' + out);
    return partes;
  } catch (e) {
    problems.push(`modelo_v11.py: no se pudo correr para verificar el techo de CAC (${e.message.split('\n')[0]}) — este chequeo quedó ciego`);
    return null;
  } finally {
    try { rmSync(cacheFria, { recursive: true, force: true }); } catch { /* nada que limpiar */ }
  }
}
function tsCacTecho(nombre) {
  const bloque = env.match(/export const CAC_TECHO = \{([\s\S]*?)\n\}/);
  if (!bloque) {
    problems.push('CAC_TECHO: no se encontró en env.ts — el formato cambió y este chequeo quedó ciego');
    return null;
  }
  const m = bloque[1].match(new RegExp(nombre + ':\\s*([0-9.]+)'));
  if (!m) {
    problems.push(`CAC_TECHO.${nombre}: no está en env.ts`);
    return null;
  }
  return Number(m[1]);
}
{
  const py = modeloV11Numeros();
  if (py) {
    const [contrib, overhead, referido, aprendizaje] = py;
    cmpModelo('Techo de CAC: contribución por pedido (CONTRIB_PEDIDO ↔ contribPedido)', 'modelo/modelo_v11.py',
        tsCacTecho('contribPedido'), contrib);
    cmpModelo('Techo de CAC: overhead por pedido (OVERHEAD_POR_PEDIDO ↔ overheadPedido)', 'modelo/modelo_v11.py',
        tsCacTecho('overheadPedido'), overhead);
    cmpModelo('Techo de CAC: costo del referido (COSTO_REFERIDO ↔ costoReferido)', 'modelo/modelo_v11.py',
        tsCacTecho('costoReferido'), referido);
    cmpModelo('Techo de CAC: conversiones de aprendizaje (CONV_APRENDIZAJE_7D ↔ convAprendizaje7d)', 'modelo/modelo_v11.py',
        tsCacTecho('convAprendizaje7d'), aprendizaje);
  }
}

// ---------- salida ----------
if (problems.length) {
  console.error(`\n✗ Paridad cliente ↔ servidor: ${problems.length} diferencia(s) de ${checks} comprobaciones\n`);
  for (const p of problems) console.error('  • ' + p + '\n');
  console.error('  El cliente mostraría un número y el servidor cobraría otro. Corrige los dos lados.');
  console.error('  Recuerda además revisar `catalog_prices` en Supabase si tocaste un precio.\n');
  process.exit(1);
}
console.log(`✓ Paridad: ninguna regla compartida vuelve a escribirse en un lado, y el modelo coincide con el servidor (${checks} comprobaciones)`);
