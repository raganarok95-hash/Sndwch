// SND//WCH — scripts/check-cliente-sin-panel
// Comprueba que el bundle del CLIENTE no dependa de nada declarado en el del PANEL.
//
// ── POR QUÉ EXISTE ──
// El 2026-09-10 el panel se sacó del archivo que descarga cada cliente: son ~317 KB de
// ~940 por 34 pantallas que solo abre el dueño, y la conversión es la única de las tres
// variables del CAC que el negocio controla. Al partirlo apareció que el CLIENTE ENTERO
// dependía de cosas que vivían del lado del panel: `icon()` (usada 45 veces en las partes
// 01-07), `haversineKm` (la distancia con la que se COBRA el envío), `invQty` (el stock que
// decide si un Signature sale agotado), y la infraestructura del propio `render()`.
//
// Con el panel sin cargar, la app no pintaba una sola pantalla. Y eso nunca rompió nada
// mientras todo viajara en un mismo archivo — ése es exactamente el punto: un acoplamiento
// así no se manifiesta hasta el día que intentas separar, y entonces se manifiesta como la
// app en blanco para el 100% de los clientes.
//
// Arreglarlo a mano fue ir descubriendo una pieza por render, una a una. Este chequeo las
// encuentra TODAS de una sola pasada, y evita que vuelvan: basta una función nueva escrita
// del lado equivocado para volver a romperlo, sin ningún error visible mientras se
// desarrolla con los dos bundles cargados.
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const APP_DIR = join(ROOT, 'src/app');

const files = readdirSync(APP_DIR).filter((f) => f.endsWith('.ts')).sort();
const iRouter = files.findIndex((f) => /^\d{2}-router\.ts$/.test(f));
if (iRouter === -1) {
  console.error('✗ check:cliente — no hay ninguna parte NN-router.ts.');
  process.exit(1);
}
const cliente = files.slice(0, iRouter + 1);
const panel = files.slice(iRouter + 1);

// Todo lo que el panel declara a nivel raíz.
const declaradoEnPanel = new Map();
for (const f of panel) {
  const src = readFileSync(join(APP_DIR, f), 'utf8');
  for (const re of [/^(?:var|let|const)\s+([A-Za-z_$][\w$]*)/gm, /^(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/gm]) {
    for (const m of src.matchAll(re)) if (!declaradoEnPanel.has(m[1])) declaradoEnPanel.set(m[1], f);
  }
}

// Quita comentarios y literales: lo que va dentro de un string es un `onclick` que solo
// corre si alguien lo toca, y eso se juzga aparte (ver ADMIN_ONLY abajo).
function soloCodigo(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/^\s*\/\/[^\n]*$/gm, ' ')
    .replace(/(['"`])(?:\\.|(?!\1)[^\\])*\1/g, '""');
}

// Referencias que SÍ son legítimas desde el cliente porque solo se ejecutan en un camino
// que ya exige tener el panel cargado. Cada una con su motivo: una lista sin motivos se
// llena de excepciones que nadie recuerda por qué están.
const ADMIN_ONLY = {
  loadAdmin: 'el cajón de herramientas del panel — solo se abre desde una pantalla de admin',
  loadDashboard: 'ídem',
  adminToolsSections: 'ídem',
};

const problems = [];
for (const f of cliente) {
  const src = readFileSync(join(APP_DIR, f), 'utf8');
  const codigo = soloCodigo(src);
  const vistos = new Set();
  for (const m of codigo.matchAll(/\b[A-Za-z_$][\w$]*\b/g)) {
    const n = m[0];
    if (vistos.has(n) || !declaradoEnPanel.has(n) || ADMIN_ONLY[n]) continue;
    vistos.add(n);
    problems.push(`${f} usa \`${n}\`, que se declara en ${declaradoEnPanel.get(n)}`);
  }
}

if (problems.length) {
  console.error('✗ check:cliente — el cliente depende del panel:\n');
  for (const p of problems) console.error('  · ' + p);
  console.error(
    `\n${problems.length} dependencia(s). Ninguna rompe nada mientras desarrolles con los dos\n` +
      'bundles cargados: el panel se descarga bajo demanda, así que esto se manifiesta recién en\n' +
      'el celular de un cliente que nunca lo pide — como la app EN BLANCO.\n\n' +
      'Arreglo: si es algo compartido de verdad (un ícono, un cálculo, estado del catálogo), va a\n' +
      'una parte del cliente. Si de verdad es del panel y solo se alcanza desde una pantalla de\n' +
      'admin, agrégalo a ADMIN_ONLY en este archivo CON SU MOTIVO.',
  );
  process.exit(1);
}

console.log(
  `✓ check:cliente — las ${cliente.length} partes del cliente no dependen de las ${panel.length} del panel`,
);
