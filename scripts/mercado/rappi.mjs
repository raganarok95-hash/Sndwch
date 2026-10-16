// SND//WCH — mercado/rappi: el estudio de mercado de sándwiches en Trujillo (2026-10-16).
//
// Dueño: «para ver el precio necesito un estudio de mercado real, un análisis profundo a
// competidores; hay algunos que venden mucho más caro y más pequeños». Lee las páginas PÚBLICAS de
// Rappi (las mismas que indexa Google, sin cuenta ni ubicación): la categoría de sándwiches de
// Trujillo y la página de cada local, con su carta y precios. Corre en GitHub (el proxy de las
// sesiones bloquea rappi.com.pe), una vez, despacio (una página cada 2 s) y con un tope de locales.
//
// Escribe mercado/rappi.json (todo) y mercado/rappi-productos.csv (una fila por producto). Si una
// página no trae los datos donde se esperan, guarda su HTML en mercado/crudo/ para ajustar el lector.
//
// Uso: node scripts/mercado/rappi.mjs [tope de locales]
import { mkdirSync, writeFileSync } from 'node:fs';

const TOPE = Number(process.argv[2] || 70);
const BASE = 'https://www.rappi.com.pe';
const CATEGORIAS = ['/trujillo/restaurantes/category/sandwiches', '/trujillo/restaurantes/category/s%C3%A1ndwiches'];
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36';
mkdirSync('mercado/crudo', { recursive: true });
const pausa = (ms) => new Promise((r) => setTimeout(r, ms));

async function pagina(ruta) {
  const r = await fetch(BASE + ruta, { headers: { 'User-Agent': UA, 'Accept-Language': 'es-PE,es;q=0.9' } });
  const html = await r.text();
  return { estado: r.status, html };
}
// Next.js deja los datos de la página en <script id="__NEXT_DATA__">.
function datos(html) {
  const m = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (!m) return null;
  try { return JSON.parse(m[1]); } catch { return null; }
}
// Recorre un objeto y junta todo lo que cumpla `es`.
function juntar(obj, es, out = [], vistos = new Set()) {
  if (!obj || typeof obj !== 'object' || vistos.has(obj)) return out;
  vistos.add(obj);
  if (es(obj)) out.push(obj);
  for (const v of Object.values(obj)) juntar(v, es, out, vistos);
  return out;
}
const limpio = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();

// 1 · Los locales de la categoría (enlaces /restaurantes/<id>-<nombre>).
const locales = new Map();
for (const c of CATEGORIAS) {
  const { estado, html } = await pagina(c);
  console.log(`categoría ${c} → ${estado}, ${html.length} bytes`);
  writeFileSync(`mercado/crudo/categoria-${locales.size}.html`, html);
  for (const m of html.matchAll(/\/restaurantes\/(\d+)-([a-z0-9-]+)/gi)) {
    if (!locales.has(m[1])) locales.set(m[1], `/restaurantes/${m[1]}-${m[2]}`);
  }
  await pausa(2000);
}
console.log(`locales encontrados: ${locales.size}`);

// 2 · Cada local: sus datos y su carta.
const salida = [];
let i = 0;
for (const [id, ruta] of locales) {
  if (i++ >= TOPE) break;
  const { estado, html } = await pagina(ruta);
  const d = datos(html);
  const local = { id, ruta, estado };
  if (!d) {
    writeFileSync(`mercado/crudo/local-${id}.html`, html);
    local.error = 'sin __NEXT_DATA__';
    salida.push(local);
    console.log(`${ruta} → ${estado} sin datos`);
    await pausa(2000);
    continue;
  }
  // Lo del local: el primer objeto con nombre y dirección.
  const tienda = juntar(d, (o) => typeof o.name === 'string' && (o.address || o.store_id || o.storeId) && !o.price)[0] || {};
  local.nombre = limpio(tienda.name);
  local.direccion = limpio(tienda.address?.address || tienda.address);
  local.ciudad = limpio(tienda.city_name || tienda.city || tienda.address?.city);
  local.calificacion = tienda.rating?.score ?? tienda.rating ?? tienda.score ?? null;
  local.resenas = tienda.rating?.total_reviews ?? tienda.ratings_count ?? tienda.reviews ?? null;
  local.envio = tienda.delivery_price ?? tienda.deliveryPrice ?? null;
  // Los productos: objetos con nombre y precio.
  const prods = juntar(d, (o) => typeof o.name === 'string' && (typeof o.price === 'number' || typeof o.real_price === 'number'));
  local.productos = prods.map((p) => ({
    nombre: limpio(p.name), descripcion: limpio(p.description).slice(0, 300),
    precio: p.price ?? null, precio_lista: p.real_price ?? null, categoria: limpio(p.corridor_name || p.category || ''),
  }));
  if (!local.productos.length) writeFileSync(`mercado/crudo/local-${id}.html`, html);
  salida.push(local);
  console.log(`${local.nombre || ruta} · ${local.ciudad} · ${local.productos.length} productos`);
  await pausa(2000);
}
writeFileSync('mercado/rappi.json', JSON.stringify({ fecha: new Date().toISOString(), locales: salida }, null, 1));
const csv = ['local,ciudad,calificacion,resenas,producto,precio,precio_lista,descripcion'];
for (const l of salida) for (const p of l.productos || []) {
  csv.push([l.nombre, l.ciudad, l.calificacion, l.resenas, p.nombre, p.precio, p.precio_lista, p.descripcion]
    .map((x) => `"${String(x ?? '').replace(/"/g, '""')}"`).join(','));
}
writeFileSync('mercado/rappi-productos.csv', csv.join('\n'));
console.log(`listo: ${salida.length} locales, ${csv.length - 1} productos`);
