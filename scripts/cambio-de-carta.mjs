// SND//WCH — scripts/cambio-de-carta
// Dueño (2026-11-10): «Todo debe funcionar en automático» · «también debemos mejorar la intercomunicación
// de equipos». Con el ITALIAN HOAGIE (2026-11-03) se cambiaron carta, base y receta, pero la foto y las
// piezas del feed siguieron mostrando los fiambres de antes: nadie le avisó a los otros hilos.
//
// Compara modelo/carta.json de antes y de ahora (lo corre .github/workflows/cambio-de-carta.yml en cada push
// a main que lo toque) y, por cada producto que cambió, deja una entrega en docs/entregas/<hilo>/ para
// cada hilo al que le toca (reglas en docs/entregas/README.md).
//
//   node scripts/cambio-de-carta.mjs <carta-antes.json> <carta-ahora.json> [AAAA-MM-DD]
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';

const LISTAS = ['signatures', 'proteinas', 'bebidas', 'salsas'];
// Qué campo cambiado le toca a qué hilo. La receta (lo que lleva) mueve compras y costo; el nombre o el
// texto mueven las piezas; la foto y lo que lleva mueven la foto de la app.
const RECETA = ['pan', 'prot', 'vegetales', 'salsas', 'queso', 'sabor'];
const TEXTO = ['nombre', 'pitch', 'desc'];

export function cambios(antes, ahora) {
  const out = [];
  for (const lista of LISTAS) {
    const viejo = new Map((antes[lista] || []).map((x) => [x.id, x]));
    for (const x of ahora[lista] || []) {
      const v = viejo.get(x.id);
      const campos = v ? Object.keys({ ...v, ...x }).filter((k) => JSON.stringify(v[k]) !== JSON.stringify(x[k])) : ['nuevo'];
      if (campos.length) out.push({ lista, id: x.id, nombre: x.nombre || x.id, campos });
    }
  }
  return out;
}

export function entregasDe(c) {
  const receta = c.campos.some((k) => RECETA.includes(k)) || c.campos.includes('nuevo');
  const texto = c.campos.some((k) => TEXTO.includes(k)) || c.campos.includes('nuevo');
  // El texto cuenta también: el ITALIAN HOAGIE cambió solo su descripción en la carta (los gramos viven en el
  // modelo y en el panel) y la foto quedó mostrando otros fiambres.
  const foto = receta || texto || c.campos.includes('foto');
  const e = [];
  if (foto) e.push(['app', 'que la foto de la app muestre lo que dice y lleva ahora (y anotarla en img/fuente/FUENTES.md)']);
  if (receta || texto) e.push(['marketing', 'revisar las piezas, reels e historias que lo muestran o lo nombran']);
  if (receta || c.lista === 'proteinas') e.push(['operativo', 'actualizar la lista de compras y el stock mínimo con los gramos nuevos']);
  if (receta) e.push(['finanzas', 'revisar el costo y el techo de 45% con la receta nueva']);
  if (receta && c.lista === 'bebidas') e.push(['disenos', 'revisar la etiqueta (ingredientes y tabla)']);
  return e;
}

function main() {
  const [a, b, fecha = new Date(Date.now() - 5 * 36e5).toISOString().slice(0, 10)] = process.argv.slice(2);
  const lista = cambios(JSON.parse(readFileSync(a, 'utf8')), JSON.parse(readFileSync(b, 'utf8')));
  let n = 0;
  for (const c of lista) {
    for (const [hilo, que] of entregasDe(c)) {
      const dir = `docs/entregas/${hilo}`;
      const f = `${dir}/${fecha}-carta-${c.id.toLowerCase()}.md`;
      if (existsSync(f)) continue;
      mkdirSync(dir, { recursive: true });
      writeFileSync(f, `de: automatizaciones\npara: ${hilo}\nestado: abierta\npara-cuando: ${fecha}\n---\n` +
        `Cambió ${c.nombre.toUpperCase()} (${c.id}) en la carta: ${c.campos.join(', ')}.\n` +
        `Falta: ${que}.\nLo dejó solo scripts/cambio-de-carta.mjs. Al terminar, cambia «estado: abierta» por «estado: hecha» y una línea de qué hiciste.\n`);
      console.log(`→ ${f}`);
      n++;
    }
  }
  console.log(`${lista.length} producto(s) cambiaron · ${n} entrega(s) nuevas`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
