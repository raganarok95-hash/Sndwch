// SND//WCH — scripts/capturas-reales
// Lee las capturas de Yape QUE YA ESTÁN GUARDADAS en producción con el mismo lector que usa el
// celular (tesseract.js 6, español) y deja el texto en capturas-reales.json para que
// `scripts/decidir-capturas.ts` les aplique las reglas de producción. NO escribe nada en la base.
//
// Por qué existe (dueño, 2026-10-03): «no haré más pruebas con 0.10 céntimos. Debes probar con los
// comprobantes que ya se tienen». Corre en GitHub (el proxy de las sesiones bloquea supabase.co),
// con el SUPABASE_ACCESS_TOKEN del despliegue, del que saca la llave de servicio solo para leer.
import { writeFileSync } from 'node:fs';
import Tesseract from 'tesseract.js';

const REF = 'rjosezuoyngiadunfzyn';
const SB = `https://${REF}.supabase.co`;
const tok = process.env.SUPABASE_ACCESS_TOKEN;
if (!tok) throw new Error('Falta SUPABASE_ACCESS_TOKEN');

const keys = await (await fetch(`https://api.supabase.com/v1/projects/${REF}/api-keys?reveal=true`, { headers: { Authorization: `Bearer ${tok}` } })).json();
const servicio = (keys.find((k) => k.name === 'service_role') || {}).api_key;
if (!servicio) throw new Error('No se obtuvo la llave de servicio');
console.log(`::add-mask::${servicio}`);
const h = { apikey: servicio, Authorization: `Bearer ${servicio}` };

const limite = Number(process.env.LIMITE || 20);
const pedidos = await (await fetch(`${SB}/rest/v1/orders?receipt_path=not.is.null&select=ref,total,payment_method,payment_status,status,receipt_path,created_at&order=created_at.desc&limit=${limite}`, { headers: h })).json();
console.log(`${pedidos.length} pedido(s) con captura guardada`);

const salida = [];
for (const o of pedidos) {
  const r = await fetch(`${SB}/storage/v1/object/payment-receipts/${encodeURIComponent(o.receipt_path)}`, { headers: h });
  if (!r.ok) { console.log(`${o.ref}: no se pudo bajar la captura (${r.status})`); continue; }
  const img = Buffer.from(await r.arrayBuffer());
  const t0 = Date.now();
  const { data } = await Tesseract.recognize(img, 'spa');
  console.log(`${o.ref}: leída en ${((Date.now() - t0) / 1000).toFixed(1)} s`);
  salida.push({ order: o, texto: data.text });
}
writeFileSync('capturas-reales.json', JSON.stringify(salida, null, 2));
