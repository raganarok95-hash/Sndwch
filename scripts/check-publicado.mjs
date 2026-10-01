// ¿TODO LO QUE LA APP PIDE SE PUBLICA? (2026-10-01)
//
// `.vercelignore` excluía `marca/` sin anclar, y con eso también `img/marca/`: el logo de la
// cuenta llevaba días sin cargar en producción y ninguna prueba lo veía, porque las pruebas abren
// el archivo local, donde la imagen sí está. Este chequeo lee cada ruta local que piden
// index.html, sw.js y manifest.json y verifica que (1) exista y (2) ninguna regla de
// .vercelignore la deje fuera. Sigue la sintaxis de .gitignore para lo que usamos: «/» al inicio
// ancla a la raíz, «/» al final es carpeta, «*» comodín dentro de un segmento.
import { readFileSync, existsSync } from 'node:fs';

const reglas = readFileSync('.vercelignore', 'utf8').split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));
const aRegex = (seg) => new RegExp('^' + seg.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '[^/]*') + '$');
function excluida(ruta) {
  const partes = ruta.split('/');
  return reglas.find((r) => {
    const anclada = r.startsWith('/');
    const carpeta = r.endsWith('/');
    const segs = r.replace(/^\//, '').replace(/\/$/, '').split('/').map(aRegex);
    const inicios = anclada ? [0] : partes.map((_, i) => i);
    return inicios.some((i) => {
      if (i + segs.length > partes.length) return false;
      if (!segs.every((rx, k) => rx.test(partes[i + k]))) return false;
      // Una carpeta solo excluye si después del patrón todavía hay algo (es un directorio).
      return carpeta ? i + segs.length < partes.length : true;
    });
  });
}
const fuentes = ['index.html', 'sw.js', 'manifest.json'].filter(existsSync).map((f) => readFileSync(f, 'utf8')).join('\n');
const rutas = new Set();
for (const m of fuentes.matchAll(/["'(]\.?\/?((?:img|icon|apple|favicon|qr)[A-Za-z0-9_\-/.]*\.(?:png|jpe?g|webp|svg|gif|ico))["')]/g)) rutas.add(m[1]);
const problemas = [];
for (const r of rutas) {
  if (!existsSync(r)) problemas.push(`${r}: la app la pide y no existe en el repo`);
  const regla = excluida(r);
  if (regla) problemas.push(`${r}: la app la pide y .vercelignore la deja fuera (regla «${regla}»)`);
}
if (problemas.length) {
  console.error('✗ check:publicado\n  ' + problemas.join('\n  '));
  process.exit(1);
}
console.log(`✓ check:publicado — ${rutas.size} archivos que pide la app existen y se publican`);
