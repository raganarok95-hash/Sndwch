// SND//WCH — scripts/poner-pixel: pone META_PIXEL_ID en los secrets de las edge functions.
// Corre en GitHub (.github/workflows/pixel-de-meta.yml). El ID del píxel NO es secreto (va en el
// HTML de cualquier página que lo use); el token de CAPI sí, y este script no lo toca nunca.
// Existe porque el 2026-10-08 el píxel y el token apuntaban a conjuntos de datos distintos
// (docs/CONFIGURAR_META.md §A3b) y el dueño pidió «soluciona lo del token».
import { REF } from './video-auto/produccion.mjs';

const id = String(process.env.PIXEL || '').trim();
if (!/^\d{6,20}$/.test(id)) throw new Error(`El ID del píxel tiene que ser solo dígitos (llegó «${id}»).`);
const r = await fetch(`https://api.supabase.com/v1/projects/${REF}/secrets`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${process.env.SUPABASE_ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
  body: JSON.stringify([{ name: 'META_PIXEL_ID', value: id }]),
});
if (!r.ok) throw new Error(`No se pudo poner META_PIXEL_ID: ${r.status} ${await r.text()}`);
console.log(`✓ META_PIXEL_ID = ${id}`);
