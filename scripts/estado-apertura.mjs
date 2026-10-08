// SND//WCH — scripts/estado-apertura: qué está listo para abrir, verificado contra producción
// (nunca por inferencia: CLAUDE.md, «un secret no se da por ausente mirando el código»).
// Lista NOMBRES de secrets (la API no da valores), lo que el cliente recibe en get-store-hours y
// get-catalog, y el estado de la base. Corre en GitHub (.github/workflows/estado-apertura.yml).
import { SB, REF, conectar } from './video-auto/produccion.mjs';

const { pedir, accion } = await conectar();
const r = await fetch(`https://api.supabase.com/v1/projects/${REF}/secrets`, { headers: { Authorization: `Bearer ${process.env.SUPABASE_ACCESS_TOKEN}` } });
const hay = new Set((await r.json()).map((x) => x.name));
const CLAVE = {
  'Pagos con tarjeta': ['CULQI_SECRET_KEY'],
  'Correos (Resend)': ['RESEND_API_KEY'],
  'Píxel de Meta': ['META_PIXEL_ID'],
  'Compras a Meta desde el servidor (CAPI)': ['META_CAPI_TOKEN'],
  'Publicar en Instagram/Facebook': ['META_PAGE_ACCESS_TOKEN'],
  'Pauta (lectura de gasto; si falta, usa el token de la página)': ['META_ADS_TOKEN'],
  'Google (entrar y mapa)': ['GOOGLE_CLIENT_ID', 'GOOGLE_MAPS_KEY'],
};
console.log('## Secrets (solo nombres)');
for (const [k, v] of Object.entries(CLAVE)) console.log(`${v.every((n) => hay.has(n)) ? '✓' : '✗'} ${k}: ${v.map((n) => `${n}${hay.has(n) ? '' : ' (falta)'}`).join(', ')}`);
console.log('Otros nombres presentes:', [...hay].filter((n) => !Object.values(CLAVE).flat().includes(n) && !n.startsWith('SUPABASE_')).join(', '));

const h = await accion('get-store-hours');
console.log('\n## Lo que recibe el cliente');
console.log('business_launched:', h.businessLaunched, '· pausa:', h.pausedUntil || 'no', '· píxel:', h.metaPixelId ? 'sí' : 'NO', '· Google:', h.googleClientId ? 'sí' : 'NO');
console.log('horario:', JSON.stringify(h.hours));
const c = await accion('get-catalog');
console.log('Signatures activos:', Object.entries(c.sigItems || {}).filter(([, x]) => x.active !== false).map(([id, x]) => `${id} ${x.n} ${x.p15}/${x.p30}`).join(' · '));
console.log('inventario cargado:', Object.keys(c.inventory || {}).length, 'productos');

console.log('\n## La base');
console.log('pedidos:', (await pedir(`${SB}/rest/v1/orders?select=ref,payment_method,payment_status,status,created_at&order=created_at.desc&limit=10`)).map((o) => `${o.ref} ${o.payment_method} ${o.payment_status} ${o.status}`).join(' | ') || 'ninguno');
