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

// El token de CAPI, probado DE VERDAD contra Meta (no basta con que el nombre exista): la
// acción verificar-meta pide el secreto del cron, que vive en el Vault de la base.
if (hay.has('META_CAPI_TOKEN')) {
  const q = await fetch(`https://api.supabase.com/v1/projects/${REF}/database/query`, {
    method: 'POST', headers: { Authorization: `Bearer ${process.env.SUPABASE_ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: "select decrypted_secret as s from vault.decrypted_secrets where name = 'sndwch_cron_secret'" }),
  });
  const cronSecret = q.ok ? (await q.json())?.[0]?.s : null;
  if (!cronSecret) console.log('? CAPI: no pude leer el secreto del cron para probar el token');
  else {
    console.log(`::add-mask::${cronSecret}`);
    try {
      const v = await accion('verificar-meta', { cronSecret, pixeles: process.env.PIXELES || '' });
      const ok = v.tokenValido && v.puedeEscribirAlPixel;
      console.log(`${ok ? '✓' : '✗'} CAPI probado contra Meta: token ${v.tokenValido ? 'válido' : v.tokenValido === false ? 'NO VÁLIDO' : '?'}, ` +
        `escribe al píxel: ${v.puedeEscribirAlPixel ? 'sí' : v.puedeEscribirAlPixel === false ? 'NO' : '?'}${v.detalle ? ` — ${v.detalle}` : ''}`);
      for (const [id, c] of Object.entries(v.candidatos || {})) {
        console.log(`  · el token contra el conjunto ${id}: ${c.puedeEscribirAlPixel ? 'SÍ puede escribir' : c.puedeEscribirAlPixel === false ? 'no tiene permiso' : '?'}${c.detalle ? ` — ${c.detalle.slice(0, 120)}` : ''}`);
      }
    } catch (e) { console.log('? CAPI: la prueba falló —', String(e.message || e).slice(0, 200)); }
  }
}

const h = await accion('get-store-hours');
console.log('\n## Lo que recibe el cliente');
console.log('business_launched:', h.businessLaunched, '· pausa:', h.pausedUntil || 'no', '· píxel:', h.metaPixelId ? 'sí' : 'NO', '· Google:', h.googleClientId ? 'sí' : 'NO');
console.log('horario:', JSON.stringify(h.hours));
const c = await accion('get-catalog');
console.log('Signatures activos:', Object.entries(c.sigItems || {}).filter(([, x]) => x.active !== false).map(([id, x]) => `${id} ${x.n} ${x.p15}/${x.p30}`).join(' · '));
console.log('inventario cargado:', Object.keys(c.inventory || {}).length, 'productos');

console.log('\n## La base');
console.log('pedidos:', (await pedir(`${SB}/rest/v1/orders?select=ref,payment_method,payment_status,status,created_at&order=created_at.desc&limit=10`)).map((o) => `${o.ref} ${o.payment_method} ${o.payment_status} ${o.status}`).join(' | ') || 'ninguno');
