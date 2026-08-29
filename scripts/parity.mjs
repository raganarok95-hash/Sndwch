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

import { readFileSync, readdirSync } from 'node:fs';
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

function cmp(what, clientVal, serverVal) {
  checks++;
  const a = JSON.stringify(clientVal);
  const b = JSON.stringify(serverVal);
  if (a !== b) problems.push(`${what}\n    cliente: ${a}\n    servidor: ${b}`);
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

// ---------- cliente ----------
function clientObjArray(varName, idPrefix, fields) {
  const start = app.indexOf('var ' + varName);
  if (start < 0) return {};
  const chunk = app.slice(start, start + 30000);
  const out = {};
  const re = new RegExp("\\{id:'(" + idPrefix + "\\d+)'([^}]*)\\}", 'g');
  let m;
  while ((m = re.exec(chunk))) {
    const [, id, body] = m;
    if (out[id]) break; // ya salimos del array y estamos leyendo otra estructura
    const rec = {};
    for (const f of fields) {
      const fm = body.match(new RegExp('\\b' + f + ':(-?[\\d.]+)'));
      if (fm) rec[f] = Number(fm[1]);
    }
    out[id] = rec;
  }
  return out;
}

const cProt = need(clientObjArray('PROTS', 'P', ['p15', 'p30', 'pDbl', 'pDbl30']), 'PROTS (cliente)');
const cSide = need(clientObjArray('SIDES', 'D', ['p']), 'SIDES (cliente)');
const cRew = need(clientObjArray('RWDS', 'R', ['pts']), 'RWDS (cliente)');

// SIGS: bloques multilínea, así que se recorta por id y se leen los campos sueltos.
const cSig = {};
{
  const start = app.indexOf('var SIGS');
  const chunk = app.slice(start, start + 40000);
  const re = /\{id:'(SIG\d+)',([\s\S]*?)\n(?=  \{id:'SIG|\];)/g;
  let m;
  while ((m = re.exec(chunk))) {
    const [, id, body] = m;
    const num = (f) => { const x = body.match(new RegExp('\\b' + f + ':(-?[\\d.]+)')); return x ? Number(x[1]) : null; };
    const str = (f) => { const x = body.match(new RegExp('\\b' + f + ":'([^']*)'")); return x ? x[1] : null; };
    const arr = (f) => { const x = body.match(new RegExp('\\b' + f + ':\\[([^\\]]*)\\]')); return x ? x[1].split(',').map((s) => s.trim().replace(/'/g, '')).filter(Boolean) : null; };
    cSig[id] = { p15: num('p15'), p30: num('p30'), base: str('base'), prot: str('prot'), tops: arr('tops'), sauces: arr('sauces') };
  }
}
need(cSig, 'SIGS (cliente)');

const cZones = {};
{
  const m = app.match(/var DELIVERY_PRICE_ZONES=\[([\s\S]*?)\];/);
  if (m) for (const z of m[1].matchAll(/\{id:'([a-z_]+)'[^}]*fee:([\d.]+)/g)) cZones[z[1]] = Number(z[2]);
}
need(cZones, 'DELIVERY_PRICE_ZONES (cliente)');

// ---------- servidor ----------
function serverRecord(src, name, fields) {
  const start = src.indexOf('export const ' + name);
  if (start < 0) return {};
  const chunk = src.slice(start, src.indexOf('\n};', start) + 3 || start + 8000);
  const out = {};
  for (const m of chunk.matchAll(/^\s{2}([A-Z]\d+): \{([^}]*)\}/gm)) {
    const rec = {};
    for (const f of fields) {
      const fm = m[2].match(new RegExp('\\b' + f + ': (-?[\\d.]+)'));
      if (fm) rec[f] = Number(fm[1]);
    }
    out[m[1]] = rec;
  }
  return out;
}

const sProt = need(serverRecord(catalog, 'PROT_PRICE', ['p15', 'p30', 'pDbl', 'pDbl30']), 'PROT_PRICE (servidor)');
const sRew = need(serverRecord(catalog, 'REWARDS', ['pts']), 'REWARDS (servidor)');

const sSig = {};
{
  const start = catalog.indexOf('export const SIG_DATA');
  const chunk = catalog.slice(start, catalog.indexOf('\n};', start));
  for (const m of chunk.matchAll(/^\s{2}(SIG\d+): \{(.*)\}/gm)) {
    const body = m[2];
    const num = (f) => { const x = body.match(new RegExp('\\b' + f + ': (-?[\\d.]+)')); return x ? Number(x[1]) : null; };
    const str = (f) => { const x = body.match(new RegExp('\\b' + f + ': "([^"]*)"')); return x ? x[1] : null; };
    const arr = (f) => { const x = body.match(new RegExp('\\b' + f + ': \\[([^\\]]*)\\]')); return x ? x[1].split(',').map((s) => s.trim().replace(/"/g, '')).filter(Boolean) : null; };
    sSig[m[1]] = { p15: num('p15'), p30: num('p30'), base: str('base'), prot: str('prot'), tops: arr('tops'), sauces: arr('sauces') };
  }
}
need(sSig, 'SIG_DATA (servidor)');

const sSide = {};
{
  const m = catalog.match(/export const SIDE_PRICE[^=]*= \{([^}]*)\}/);
  if (m) for (const p of m[1].matchAll(/(D\d+): ([\d.]+)/g)) sSide[p[1]] = { p: Number(p[2]) };
}
need(sSide, 'SIDE_PRICE (servidor)');

const sZones = {};
{
  const m = env.match(/export const DELIVERY_ZONE_FEES[^=]*= \{([\s\S]*?)\};/);
  if (m) for (const z of m[1].matchAll(/([a-z_]+): ([\d.]+)/g)) sZones[z[1]] = Number(z[2]);
}
need(sZones, 'DELIVERY_ZONE_FEES (servidor)');

// ---------- comparaciones ----------
for (const id of new Set([...Object.keys(cProt), ...Object.keys(sProt)])) {
  cmp(`Proteína ${id} (PROTS ↔ PROT_PRICE)`, cProt[id] ?? null, sProt[id] ?? null);
}
for (const id of new Set([...Object.keys(cSide), ...Object.keys(sSide)])) {
  cmp(`Bebida ${id} (SIDES ↔ SIDE_PRICE)`, cSide[id] ?? null, sSide[id] ?? null);
}
for (const id of new Set([...Object.keys(cRew), ...Object.keys(sRew)])) {
  cmp(`Recompensa ${id} (REWARDS)`, cRew[id] ?? null, sRew[id] ?? null);
}
for (const id of new Set([...Object.keys(cSig), ...Object.keys(sSig)])) {
  // SIG05 es la excepción documentada: su composición y precio viven en la tabla
  // `secret_signature` y se recargan en cada llamada, así que los literales de los dos
  // lados son solo semilla y no tienen por qué coincidir entre sí.
  if (id === 'SIG05') continue;
  cmp(`Signature ${id} (SIGS ↔ SIG_DATA)`, cSig[id] ?? null, sSig[id] ?? null);
}
cmp('Zonas de delivery (DELIVERY_PRICE_ZONES ↔ DELIVERY_ZONE_FEES)', cZones, sZones);

cmp('COMBO_DISCOUNT_PER_PAIR',
  scalar(app, 'COMBO_DISCOUNT_PER_PAIR', /var COMBO_DISCOUNT_PER_PAIR=([\d.]+)/, 'src/app/'),
  scalar(catalog, 'COMBO_DISCOUNT_PER_PAIR', /const COMBO_DISCOUNT_PER_PAIR = ([\d.]+)/, 'catalog.ts'));
cmp('GIFT_CARD_POINTS_PER_SOL',
  scalar(app, 'GIFT_CARD_POINTS_PER_SOL', /var GIFT_CARD_POINTS_PER_SOL=([\d.]+)/, 'src/app/'),
  scalar(customer, 'GIFT_CARD_POINTS_PER_SOL', /const GIFT_CARD_POINTS_PER_SOL = ([\d.]+)/, 'customer.ts'));
cmp('CULQI_FEE_RATE',
  scalar(app, 'CULQI_FEE_RATE', /var CULQI_FEE_RATE=([\d.]+)/, 'src/app/'),
  scalar(env, 'CULQI_FEE_RATE', /const CULQI_FEE_RATE = ([\d.]+)/, 'env.ts'));

cmp('REFERRAL_BONUS_POINTS (lo que recibe el invitado)',
  scalar(app, 'REFERRAL_BONUS_POINTS', /var REFERRAL_BONUS_POINTS=(\d+)/, 'src/app/'),
  scalar(env, 'REFERRAL_BONUS_POINTS', /const REFERRAL_BONUS_POINTS = (\d+)/, 'env.ts'));

// Invariante, no duplicación: lo que recibe QUIEN INVITA es "un 15CM gratis" entregado
// como puntos, así que tiene que valer exactamente lo mismo que la recompensa R06. Si R06
// se recalibra y este número se queda, el que invita recibe de más o de menos sin que
// nadie lo note (ya pasó una vez: R06 bajó de 720 a 400 y hubo que seguirlo a mano).
cmp('REFERRER_REWARD_POINTS debe valer lo mismo que R06 (un 15CM gratis)',
  scalar(env, 'REFERRER_REWARD_POINTS', /const REFERRER_REWARD_POINTS = (\d+)/, 'env.ts'),
  sRew.R06 ? sRew.R06.pts : null);

// ---------- TOPES, UMBRALES Y EL PRECIO SIN TABLA (agregado 2026-08-28) ----------
//
// Estas 7 constantes estaban duplicadas en los dos lados y NINGUNA se comparaba. Cambiar
// cualquiera en un solo lado hacía que el cliente mostrara un total y el servidor cobrara
// otro, y el checkout se rechazara con "el total no coincide" sin ninguna pista de por qué.
// EXTRA_SAUCE_PRICE es el caso más grave: es el único precio del catálogo que no vive en
// `catalog_prices`, así que esta comparación es su ÚNICA defensa.
cmp('R03_FLAT_WAIVER (tope de "sube a 30CM gratis")',
  scalar(app, 'R03_FLAT_WAIVER', /var R03_FLAT_WAIVER=([\d.]+)/, 'src/app/'),
  scalar(catalog, 'R03_FLAT_WAIVER', /const R03_FLAT_WAIVER = ([\d.]+)/, 'catalog.ts'));
cmp('R04_FLAT_WAIVER (tope de doble proteína gratis)',
  scalar(app, 'R04_FLAT_WAIVER', /var R04_FLAT_WAIVER=([\d.]+)/, 'src/app/'),
  scalar(catalog, 'R04_FLAT_WAIVER', /const R04_FLAT_WAIVER = ([\d.]+)/, 'catalog.ts'));
cmp('R05_FLAT_WAIVER (tope de bebida gratis)',
  scalar(app, 'R05_FLAT_WAIVER', /var R05_FLAT_WAIVER=([\d.]+)/, 'src/app/'),
  scalar(catalog, 'R05_FLAT_WAIVER', /const R05_FLAT_WAIVER = ([\d.]+)/, 'catalog.ts'));
cmp('OFFPEAK_DRINK_PROMO_CAP (tope de la bebida de hora valle)',
  scalar(app, 'OFFPEAK_DRINK_PROMO_CAP', /var OFFPEAK_DRINK_PROMO_CAP=([\d.]+)/, 'src/app/'),
  scalar(catalog, 'OFFPEAK_DRINK_PROMO_CAP', /const OFFPEAK_DRINK_PROMO_CAP = ([\d.]+)/, 'catalog.ts'));
cmp('ORGANIZER_FREE_MIN_SANDWICHES (umbral del sándwich gratis del organizador)',
  scalar(app, 'ORGANIZER_FREE_MIN_SANDWICHES', /var ORGANIZER_FREE_MIN_SANDWICHES=(\d+)/, 'src/app/'),
  scalar(catalog, 'ORGANIZER_FREE_MIN_SANDWICHES', /export const ORGANIZER_FREE_MIN_SANDWICHES = (\d+)/, 'catalog.ts'));
cmp('EXTRA_SAUCE_PRICE (el único precio que NO vive en catalog_prices)',
  scalar(app, 'EXTRA_SAUCE_PRICE', /var EXTRA_SAUCE_PRICE=([\d.]+)/, 'src/app/'),
  scalar(catalog, 'EXTRA_SAUCE_PRICE', /export const EXTRA_SAUCE_PRICE = ([\d.]+)/, 'catalog.ts'));
cmp('WEEKLY_PLAN_PRICE (lo que paga hoy)',
  scalar(app, 'WEEKLY_PLAN_PRICE', /var WEEKLY_PLAN_PRICE=([\d.]+)/, 'src/app/'),
  scalar(customer, 'WEEKLY_PLAN_PRICE', /const WEEKLY_PLAN_PRICE = ([\d.]+)/, 'customer.ts'));
cmp('WEEKLY_PLAN_CREDIT (el saldo que recibe)',
  scalar(app, 'WEEKLY_PLAN_CREDIT', /var WEEKLY_PLAN_CREDIT=([\d.]+)/, 'src/app/'),
  scalar(customer, 'WEEKLY_PLAN_CREDIT', /const WEEKLY_PLAN_CREDIT = ([\d.]+)/, 'customer.ts'));

// Zonas EXCLUIDAS del reparto. No es dinero, pero desincronizarlas es peor que un precio
// distinto: el cliente cree que le llega y el servidor le rechaza el pedido ya pagado, o al
// revés. `parity` ya comparaba las zonas con precio pero nunca estas.
function excludedZones(src, re, where) {
  const m = src.match(re);
  if (!m) { console.error(`✗ No se encontró DELIVERY_EXCLUDED_ZONES en ${where}`); process.exitCode = 1; return null; }
  return m[1].split(',').map((x) => x.trim().replace(/^["']|["']$/g, '')).filter(Boolean).sort().join('|');
}
cmp('DELIVERY_EXCLUDED_ZONES (zonas sin reparto)',
  excludedZones(app, /var DELIVERY_EXCLUDED_ZONES=\[([^\]]*)\]/, 'src/app/'),
  excludedZones(env, /export const DELIVERY_EXCLUDED_ZONES = \[([^\]]*)\]/, 'env.ts'));

// Menú secreto: el rango que lo desbloquea sí vive en código en los dos lados.
cmp('Menú secreto — pedidos mínimos (SIGS.SIG05.minOrders ↔ SIG_GATES.SIG05)',
  scalar(app, 'minOrders del menú secreto', /secret:true,minOrders:(\d+)/, 'src/app/'),
  scalar(catalog, 'SIG_GATES.SIG05', /SIG05: \{ minOrders: (\d+) \}/, 'catalog.ts'));

// ---------- NOMBRES (agregado 2026-08-26) ----------
//
// Hasta acá todo lo comparado era DINERO y composición. Los NOMBRES no se comparaban nunca,
// y son la otra mitad que se puede desincronizar sin que nada avise: el cliente arma la
// etiqueta desde `l`/`n` + `s` de cada array, y el servidor tiene su propio mapa *_LABEL,
// que es el que sale impreso en el recibo, el correo de confirmación y la push. Si se
// separan, el cliente ve "The Marinara" y el comprobante dice otra cosa. Ya pasó con P06,
// que era "MEATBALL // MARINARA" en el servidor y "Albóndiga" en el cliente — se detectó a
// ojo en una auditoría, no por una comprobación automática.
//
// Convención: la etiqueta del servidor es (l + " // " + s). Se compara SIN distinguir
// mayúsculas a propósito: el servidor no es uniforme (SIG_LABEL y PROT_LABEL van en
// mayúsculas, SAUCE_LABEL/TOP_LABEL/BASE_LABEL en capitalización normal) y esa diferencia
// es de presentación, no un desajuste. Lo que importa es que las PALABRAS sean las mismas.
function clientLabels(varName, idPrefix, nameField) {
  const start = app.indexOf('var ' + varName);
  if (start < 0) return {};
  const chunk = app.slice(start, start + 40000);
  const out = {};
  // Una entrada por línea en todos estos arrays, así que leer por línea es mucho más
  // robusto que intentar delimitar objetos con lookaheads sobre texto multilínea.
  const re = new RegExp("^\\s*\\{id:'(" + idPrefix + "\\d+)'(.*)$", 'gm');
  let m;
  while ((m = re.exec(chunk))) {
    const [, id, body] = m;
    if (out[id]) break; // ya salimos de este array y estamos leyendo otra estructura
    const g = (f) => { const x = body.match(new RegExp("\\b" + f + ":\\s*'([^']*)'")); return x ? x[1] : null; };
    const l = g(nameField), sub = g('s');
    if (l && sub) out[id] = (l + ' // ' + sub).toUpperCase();
  }
  return out;
}

function serverLabels(name) {
  const start = catalog.indexOf('export const ' + name);
  if (start < 0) return {};
  const chunk = catalog.slice(start, catalog.indexOf('\n};', start) + 3 || start + 8000);
  const out = {};
  for (const m of chunk.matchAll(/^\s{2}([A-Z]+\d+):\s*"([^"]*)"/gm)) out[m[1]] = m[2].toUpperCase();
  return out;
}

for (const [varName, prefix, nameField, serverMap, humano] of [
  ['SIGS', 'SIG', 'n', 'SIG_LABEL', 'Signature'],
  ['PROTS', 'P', 'l', 'PROT_LABEL', 'Proteína'],
  ['TOPS', 'T', 'l', 'TOP_LABEL', 'Topping'],
  ['SAUCES', 'S', 'l', 'SAUCE_LABEL', 'Salsa'],
  ['SIDES', 'D', 'l', 'SIDE_LABEL', 'Bebida'],
  ['BASES', 'B', 'l', 'BASE_LABEL', 'Pan'],
]) {
  const c = need(clientLabels(varName, prefix, nameField), varName + ' — nombres (cliente)');
  const sv = need(serverLabels(serverMap), serverMap + ' (servidor)');
  for (const id of new Set([...Object.keys(c), ...Object.keys(sv)])) {
    // El menú secreto cambia de nombre cada mes desde `secret_signature`, así que sus
    // literales son semilla y no tienen por qué coincidir (misma excepción que arriba).
    if (id === 'SIG05') continue;
    cmp(humano + ' ' + id + ' — nombre (' + varName + ' ↔ ' + serverMap + ')', c[id] ?? null, sv[id] ?? null);
  }
}

// ---------- constantes que NO son de dinero pero igual viven duplicadas ----------
// Las cuatro de abajo estaban defendidas solo por un comentario "DEBE coincidir con...",
// y un comentario no falla el build — que es exactamente el motivo por el que existe este
// archivo. Hoy los dos lados coinciden; esto es para que sigan coincidiendo mañana.
//
// No mueven el total de un pedido, pero cada una decide si un pedido SE PUEDE HACER:
// el horario y la ventana de hora valle deciden si se acepta, RANKS decide qué rango ve
// el cliente contra el que calcula el servidor, y NO_DOUBLE_PROTS decide si el doble de
// atún se puede pedir. Si se separan, el cliente ofrece algo que el servidor rechaza al
// pagar — el mismo síntoma que un precio desalineado, con otra causa.

// Horario de atención. En runtime los dos lados lo sobreescriben desde `store_hours`, así
// que esto compara la SEMILLA: lo que rige en el primer render antes de que resuelva el
// fetch, y el respaldo si la base no responde.
function hoursPairs(src, re, file) {
  const m = src.match(re);
  if (!m) {
    problems.push(`STORE_HOURS: no se encontró en ${file} — el formato cambió y este script quedó ciego`);
    return null;
  }
  // Normaliza "[11,22]" y "null" de los dos lenguajes a una forma común comparable.
  return m[1]
    .split(/,(?![^[]*\])/)
    .map((x) => x.trim())
    .filter(Boolean)
    .map((x) => (x === 'null' ? null : x.replace(/[[\]\s]/g, '').split(',').map(Number)));
}
cmp('STORE_HOURS (semilla del horario de atención)',
  hoursPairs(app, /var STORE_HOURS=\[([\s\S]*?)\];/, 'src/app/'),
  hoursPairs(env, /export const STORE_HOURS: Array<\[number, number\] \| null> = \[([\s\S]*?)\];/, 'env.ts'));

// Ventana de la promo de hora valle. Si se separan, el cliente promete "BEBIDA // GRATIS"
// a una hora en la que el servidor no la perdona, y el checkout rebota por total que no
// coincide.
function hourWindows(src, re, file) {
  const m = src.match(re);
  if (!m) {
    problems.push(`OFFPEAK_DRINK_PROMO_HOURS_LIMA: no se encontró en ${file} — el formato cambió y este script quedó ciego`);
    return null;
  }
  return m[1].match(/\[\s*\d+\s*,\s*\d+\s*\]/g)?.map((x) => x.replace(/[[\]\s]/g, '').split(',').map(Number)) ?? null;
}
cmp('OFFPEAK_DRINK_PROMO_HOURS_LIMA (ventana de la bebida gratis)',
  hourWindows(app, /var OFFPEAK_DRINK_PROMO_HOURS_LIMA=(\[[\s\S]*?\]);/, 'src/app/'),
  hourWindows(catalog, /const OFFPEAK_DRINK_PROMO_HOURS_LIMA: \[number, number\]\[\] = (\[[\s\S]*?\]);/, 'catalog.ts'));

// Rangos. Son de puro reconocimiento (nunca cambian precio ni multiplicador), pero el
// cliente pinta uno y el servidor guarda otro en `orders.customer_rank` — dos historias
// distintas del mismo pedido.
function ranks(src, re, file) {
  const m = src.match(re);
  if (!m) {
    problems.push(`RANKS: no se encontró en ${file} — el formato cambió y este script quedó ciego`);
    return null;
  }
  const out = [];
  const rx = /name:\s*'([^']+)'\s*,\s*minOrders:\s*(\d+)|name:\s*"([^"]+)"\s*,\s*minOrders:\s*(\d+)/g;
  let r;
  while ((r = rx.exec(m[1]))) out.push([r[1] ?? r[3], Number(r[2] ?? r[4])]);
  return out.length ? out : null;
}
cmp('RANKS (nombres y umbrales de rango)',
  ranks(app, /var RANKS=\[([\s\S]*?)\];/, 'src/app/'),
  ranks(env, /export const RANKS: \{ name: string; minOrders: number \}\[\] = \[([\s\S]*?)\];/, 'env.ts'));

// Proteínas sin opción de doble. El cliente la esconde con `noDouble`, el servidor la
// rechaza con NO_DOUBLE_PROTS. Si se separan, o se ofrece un extra que el servidor no
// cobra, o se cobra uno que el cliente nunca mostró.
function clientNoDouble() {
  const start = app.indexOf('var PROTS');
  if (start < 0) return null;
  const block = app.slice(start, app.indexOf('];', start));
  const out = [];
  const rx = /\{\s*id:\s*'(P\d+)'[^}]*?noDouble:\s*true/g;
  let m;
  while ((m = rx.exec(block))) out.push(m[1]);
  return out.sort();
}
function serverNoDouble() {
  const m = catalog.match(/export const NO_DOUBLE_PROTS = new Set\(\[([^\]]*)\]\)/);
  if (!m) {
    problems.push('NO_DOUBLE_PROTS: no se encontró en catalog.ts — el formato cambió y este script quedó ciego');
    return null;
  }
  return (m[1].match(/"(P\d+)"/g) ?? []).map((x) => x.replace(/"/g, '')).sort();
}
cmp('NO_DOUBLE_PROTS (proteínas sin doble)', clientNoDouble(), serverNoDouble());

// ---------- salida ----------
if (problems.length) {
  console.error(`\n✗ Paridad cliente ↔ servidor: ${problems.length} diferencia(s) de ${checks} comprobaciones\n`);
  for (const p of problems) console.error('  • ' + p + '\n');
  console.error('  El cliente mostraría un número y el servidor cobraría otro. Corrige los dos lados.');
  console.error('  Recuerda además revisar `catalog_prices` en Supabase si tocaste un precio.\n');
  process.exit(1);
}
console.log(`✓ Paridad cliente ↔ servidor: ${checks} comprobaciones, todo coincide`);
