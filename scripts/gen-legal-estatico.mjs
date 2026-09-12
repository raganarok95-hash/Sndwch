// SND//WCH — genera privacidad.html: la política de privacidad como HTML ESTÁTICO.
//
// ── POR QUÉ EXISTE ──
// La app es una sola página de JavaScript, así que `?legal=privacidad` solo muestra el texto
// DESPUÉS de que el navegador ejecute el bundle. El verificador de Google NO ejecuta JS, así
// que ve una página vacía — y eso es literalmente lo que respondió el 2026-09-12:
//   «La página de tu política de privacidad no tiene suficiente contenido.»
// Sin una página estática, la pantalla de consentimiento de OAuth no se publica nunca y
// "Continuar con Google" se queda en modo prueba para siempre.
//
// ── UNA SOLA FUENTE ──
// El texto NO se copia acá: se EXTRAE de `sPLegal()` en src/app/06-*.ts, que es donde lo
// lee el cliente. Dos copias del texto legal es exactamente el defecto que este repo lleva
// documentado desde los precios fantasma — y en un texto legal, la copia vieja es la que
// termina delante de un revisor o de un reclamo.
//
// ── FALLA RUIDOSAMENTE ──
// Si la extracción no encuentra las secciones, este script SALE CON ERROR en vez de escribir
// una página vacía. Una política vacía publicada es peor que no tenerla: parece que existe.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const FUENTE = join(ROOT, 'src/app/06-cuenta-y-pedidos.ts');
const ESTADO = join(ROOT, 'src/app/01-catalogo-y-estado.ts');
const MIN_SECCIONES = 5;

const src = readFileSync(FUENTE, 'utf8');
const estado = readFileSync(ESTADO, 'utf8');

function constante(nombre) {
  const m = estado.match(new RegExp(`${nombre}\\s*=\\s*'((?:[^'\\\\]|\\\\.)*)'`));
  if (!m) throw new Error(`no se encontró ${nombre} en 01-catalogo-y-estado.ts`);
  return m[1].replace(/\\'/g, "'");
}
const BIZ = {
  name: constante('BIZ_NAME'),
  ruc: constante('BIZ_RUC'),
  city: constante('BIZ_CITY'),
  email: constante('BIZ_EMAIL'),
};

const i = src.indexOf('function sPLegal()');
const j = src.indexOf('function sPReturns()');
if (i < 0 || j < 0) {
  console.error('✗ gen:legal — no se encontró sPLegal() en src/app/06-cuenta-y-pedidos.ts.');
  process.exit(1);
}
const bloque = src.slice(i, j);

// Las secciones son `sec('TÍTULO //','cuerpo')`. El cuerpo puede concatenar constantes con
// `'+BIZ_CITY+'` — se resuelven acá para que el HTML no salga con el código a la vista.
const secciones = [];
for (const m of bloque.matchAll(/sec\('([^']*)',\s*'((?:[^'\\]|\\.)*)'((?:\s*\+\s*\w+\s*\+\s*'(?:[^'\\]|\\.)*')*)\)/g)) {
  let cuerpo = m[2];
  for (const t of (m[3] || '').matchAll(/\+\s*(\w+)\s*\+\s*'((?:[^'\\]|\\.)*)'/g)) {
    const v = { BIZ_CITY: BIZ.city, BIZ_EMAIL: BIZ.email, BIZ_NAME: BIZ.name, BIZ_RUC: BIZ.ruc }[t[1]];
    if (v === undefined) {
      console.error(`✗ gen:legal — el texto interpola \`${t[1]}\`, que este script no sabe resolver.`);
      console.error('  Agrégala al mapa de arriba: si se queda sin resolver, la política sale con un hueco.');
      process.exit(1);
    }
    cuerpo += v + t[2];
  }
  secciones.push([m[1].replace(/\s*\/\/\s*$/, ''), cuerpo.replace(/\\'/g, "'")]);
}

if (secciones.length < MIN_SECCIONES) {
  console.error(`✗ gen:legal — solo se extrajeron ${secciones.length} secciones (mínimo ${MIN_SECCIONES}).`);
  console.error('  El formato de sPLegal() cambió y este script quedó ciego. NO se escribió la página:');
  console.error('  una política vacía publicada es peor que no tenerla, porque parece que existe.');
  process.exit(1);
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Política de Privacidad y Términos — SND//WCH</title>
<meta name="description" content="Qué datos recoge SND//WCH, para qué los usa y con quién los comparte. Delivery de sándwiches en ${esc(BIZ.city)}.">
<style>
  :root{color-scheme:light dark}
  body{margin:0;background:#1E3932;color:#F2F0EB;font-family:Georgia,'Times New Roman',serif;line-height:1.65}
  main{max-width:44rem;margin:0 auto;padding:2.5rem 1.25rem 4rem}
  h1{font-size:1.75rem;line-height:1.2;margin:0 0 .25rem}
  .sub{color:#A8C8B0;font-size:.85rem;font-style:italic;margin:0 0 2rem}
  h2{font-size:1rem;letter-spacing:.12em;color:#CBA258;margin:2rem 0 .5rem;text-transform:uppercase}
  p{margin:0 0 1rem}
  .datos{border:1px solid #3A6B58;border-radius:10px;padding:1rem 1.25rem;margin:0 0 2rem;font-size:.9rem}
  .datos div{margin-bottom:.35rem}
  .datos span{color:#CBA258}
  a{color:#CBA258}
  footer{margin-top:2.5rem;border-top:1px solid #3A6B58;padding-top:1.25rem;font-size:.85rem;color:#A8C8B0}
</style>
</head>
<body>
<main>
<h1>Términos y Política de Privacidad</h1>
<p class="sub">SND//WCH — delivery de sándwiches en ${esc(BIZ.city)}. Última actualización: 2026.</p>

<div class="datos">
  <div><span>Proveedor · </span>${esc(BIZ.name)}</div>
  <div><span>RUC · </span>${esc(BIZ.ruc)}</div>
  <div><span>Cobertura · </span>Delivery en ${esc(BIZ.city)} (sin local de atención al público)</div>
  <div><span>Contacto · </span>${esc(BIZ.email)}</div>
</div>

${secciones.map(([t, c]) => `<h2>${esc(t)}</h2>\n<p>${esc(c)}</p>`).join('\n\n')}

<footer>
  <p>Esta página es la versión legible sin JavaScript del mismo texto que se muestra dentro de
  la aplicación en <a href="/?legal=privacidad">sndwch.app</a>. Se genera automáticamente desde
  la misma fuente, así que no puede quedar desactualizada respecto de la app.</p>
  <p><a href="/">Volver a SND//WCH</a> · <a href="/?legal=reclamaciones">Libro de Reclamaciones</a></p>
</footer>
</main>
</body>
</html>
`;

const DESTINO = join(ROOT, 'privacidad.html');
const palabras = secciones.reduce((n, [, c]) => n + c.split(/\s+/).length, 0);

// --check: no escribe, COMPARA. Existe porque el archivo servido es un artefacto, y un
// artefacto viejo en el repo no rompe nada — solo deja en producción una política que ya no
// describe lo que la app hace, que es el defecto que este archivo vino a evitar.
if (process.argv.includes('--check')) {
  let actual = '';
  try { actual = readFileSync(DESTINO, 'utf8'); } catch { /* no existe */ }
  if (actual !== html) {
    console.error('✗ check:legal — privacidad.html no coincide con el texto de sPLegal().');
    console.error(actual ? '  El texto legal cambió y nadie regeneró la página estática.' : '  La página estática no existe.');
    console.error('  Arreglo: `npm run build` (lo regenera solo) y commitea privacidad.html.');
    process.exit(1);
  }
  console.log(`✓ check:legal — privacidad.html al día (${secciones.length} secciones, ${palabras} palabras)`);
  process.exit(0);
}

writeFileSync(DESTINO, html);
console.log(`✓ privacidad.html — ${secciones.length} secciones, ${palabras} palabras, sin JavaScript`);
