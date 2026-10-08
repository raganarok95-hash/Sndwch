// SND//WCH — video-auto/diario: el Productor del equipo de marketing (docs/marketing/EQUIPO.md).
// Cada día arma UN Reel de un Signature, lo sube y lo deja en el calendario como BORRADOR
// pendiente de revisión. Nadie graba ni escribe nada: todo sale de la carta y de producción.
//
// Corre en GitHub (.github/workflows/video-diario.yml): el proxy de las sesiones bloquea
// supabase.co. Con el SUPABASE_ACCESS_TOKEN del despliegue saca la llave de servicio, como
// scripts/capturas-reales.mjs.
//
// Por qué BORRADOR y no 'scheduled': el cron auto-publish-calendar publica cada 15 min toda
// entrada 'scheduled' sin mirar `revision`. Si el Productor la dejara programada, un video
// saldría sin que el Revisor lo viera (y antes de abrir, con un «Pídelo hoy» falso). La pasa a
// 'scheduled' solo el Revisor, al aprobarla.
//
// Uso: node scripts/video-auto/diario.mjs [--sin-subir]   (FFMPEG, PLAYWRIGHT_CHROMIUM_PATH opcionales)
import { writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { mkdtempSync, readFileSync } from 'node:fs';
import { SB, BUCKET, conectar, mananaEnLima, precio } from './produccion.mjs';

const sinSubir = process.argv.includes('--sin-subir');
const { pedir, accion } = await conectar();
// El video es para MAÑANA (2026-10-08): GitHub atrasa sus horarios de 5 a 9 horas, así que se
// produce y se revisa un día antes, y sale a su hora con `publicar_desde` (lo pone el Revisor).
const hoy = mananaEnLima();

// 1 · La carta REAL: la misma respuesta que recibe el celular del cliente.
const cat = await accion('get-catalog');
const items = cat.sigItems || {};
const inv = cat.inventory || {};
const agotado = (code) => code && inv[code] && inv[code].inStock === false;
// Ni el secreto (su gracia es no mostrarse) ni lo inactivo ni lo agotado: un video que vende lo
// que hoy no se puede pedir es plata tirada y un cliente frustrado.
// Qué es secreto y qué existe lo dice la carta (la lógica pregunta por propiedades, no por códigos).
const carta = JSON.parse(execFileSync('node_modules/.bin/deno', ['eval',
  "import { CARTA } from './supabase/functions/_shared/carta.ts'; console.log(JSON.stringify(CARTA.signatures.map((s) => ({ id: s.id, secreto: !!s.secreto }))))"], { encoding: 'utf8' }));
const publicos = new Set(carta.filter((s) => !s.secreto).map((s) => s.id));
const candidatos = Object.entries(items)
  .filter(([id, it]) => publicos.has(id) && it.active !== false && Number(it.p15) > 0 && !agotado(id) && !agotado(it.prot))
  .map(([id]) => id)
  .sort();
if (!candidatos.length) { console.log('Hoy no hay ningún Signature disponible: no se arma video.'); process.exit(0); }

// 2 · Rotación: el que hace más tiempo no sale (o nunca salió).
const usados = await pedir(`${SB}/rest/v1/marketing_calendar?plantilla=eq.signature&select=datos,created_at&order=created_at.desc&limit=300`);
const ultimo = {};
for (const u of usados) { const sig = u.datos?.sig; if (sig && !ultimo[sig]) ultimo[sig] = u.created_at; }
const sig = candidatos.sort((a, b) => String(ultimo[a] || '').localeCompare(String(ultimo[b] || '')))[0];
const src = `v-${sig.toLowerCase()}-${hoy.replace(/-/g, '')}`;

// Un día, un video: si el workflow se reintenta, no duplica (src también es único en la base).
const ya = await pedir(`${SB}/rest/v1/marketing_calendar?src=eq.${src}&select=id`);
if (ya.length) { console.log(`Ya existe el video de ${hoy} (${src}).`); process.exit(0); }

// 3 · Los datos del video (deno lee la carta) y el render.
const tmp = mkdtempSync(join(tmpdir(), 'video-diario-'));
writeFileSync(join(tmp, 'real.json'), JSON.stringify(items[sig]));
const datosTxt = execFileSync('node_modules/.bin/deno', ['run', '--allow-read', '--no-check', 'scripts/video-auto/datos.ts', sig, join(tmp, 'real.json')], { encoding: 'utf8' });
const datos = JSON.parse(datosTxt);
writeFileSync(join(tmp, 'datos.json'), datosTxt);
// En la carpeta del repo (ignorada por git): el workflow la guarda como artefacto para verla.
const mp4 = `video-del-dia.mp4`;
execFileSync('node', ['scripts/video-auto/render.mjs', join(tmp, 'datos.json'), mp4], { stdio: 'inherit' });

// El texto del post: interpolado, nunca escrito (regla del repo). El enlace lleva su `src`:
// así el analista sabe cuántas visitas y pedidos trajo ESTE video.
const caption = [
  `${datos.gancho}.`,
  '',
  `${datos.nombre} · 15CM ${precio(datos.p15)} · 30CM ${precio(datos.p30)}`,
  datos.ingredientes.join(' · '),
  '',
  `Pídelo en sndwch.app/?src=${src}`,
].join('\n');
console.log(`\n${sig} → ${src}\n${caption}\n`);
if (sinSubir) { console.log(`(--sin-subir) video en ${mp4}`); process.exit(0); }

// 4 · Subir (bucket público: Meta descarga el video desde ahí) y anotar en el calendario.
const ruta = `videos/${src}.mp4`;
await pedir(`${SB}/storage/v1/object/${BUCKET}/${ruta}`, { method: 'POST', headers: { 'Content-Type': 'video/mp4', 'x-upsert': 'true' }, body: readFileSync(mp4) });
const videoUrl = `${SB}/storage/v1/object/public/${BUCKET}/${ruta}`;
await pedir(`${SB}/rest/v1/marketing_calendar`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Prefer: 'return=minimal' },
  body: JSON.stringify({
    scheduled_date: hoy, channel: 'instagram', status: 'draft', title: `${datos.nombre} — video del día`,
    caption_text: caption, media_type: 'video', video_url: videoUrl, created_by: 'productor',
    plantilla: 'signature', gancho: datos.gancho, src, rol: 'productor', revision: 'pendiente',
    datos: { sig, prot: items[sig]?.prot || null, p15: datos.p15, p30: datos.p30 },
  }),
});
console.log(`✓ ${videoUrl}\n✓ en el calendario como borrador, pendiente de revisión`);
