// SND//WCH — video-auto/revisar: el Revisor del equipo de marketing, como código.
// Cada día a las 11:15 de Lima (.github/workflows/revisar-marketing.yml) revisa los borradores del
// Productor contra producción y aprueba UNO o los bloquea con motivo. Aprobar = pasarlo a
// 'scheduled': el cron auto-publish-calendar lo publica en los 15 minutos siguientes, así que la
// hora de este paso ES la hora de publicación (arranque del almuerzo).
//
// Por qué código y no una sesión de Claude: todas las reglas son mecánicas (el texto del post ya
// sale interpolado de la carta), cuesta S/0 y no gasta créditos. Reglas en reglas-del-revisor.mjs.
import { SB, BUCKET, conectar, ahoraEnLima, hoyEnLima, faltanParaPublicar } from './produccion.mjs';
import { decidir } from './reglas-del-revisor.mjs';

const { pedir, accion } = await conectar();
const hoy = hoyEnLima();

const faltan = await faltanParaPublicar();
if (faltan.length) console.log(`::warning::Instagram/Facebook no pueden publicar: faltan los secrets ${faltan.join(', ')} en Supabase.`);
else console.log('✓ Secrets de publicación de Meta presentes.');

const piezas = await pedir(`${SB}/rest/v1/marketing_calendar?rol=eq.productor&status=eq.draft&revision=eq.pendiente&select=id,src,caption_text,datos,created_at`);
if (!piezas.length) { console.log('Nada que revisar.'); process.exit(0); }

const [cat, horario] = await Promise.all([accion('get-catalog'), accion('get-store-hours')]);
const dia = horario.hours?.[ahoraEnLima().getUTCDay()];
const abreHoy = !!dia && dia.closed !== true && !horario.pausedUntil;

const conVideo = new Set();
for (const p of piezas) {
  const r = await fetch(`${SB}/storage/v1/object/public/${BUCKET}/videos/${p.src}.mp4`, { method: 'HEAD' });
  if (r.ok) conVideo.add(p.src);
}
const desde = new Date(Date.now() - 2 * 86400e3).toISOString().slice(0, 10);
const cerca = await pedir(`${SB}/rest/v1/marketing_calendar?rol=eq.productor&status=in.(scheduled,publishing,posted)&scheduled_date=gte.${desde}&select=datos`);
const recientes = new Set(cerca.map((x) => x.datos?.sig).filter(Boolean));

const veredictos = decidir({ piezas, hoy, abreHoy, cat, conVideo, recientes });
for (const v of veredictos) {
  console.log(`${v.src} → ${v.veredicto}${v.motivo ? ` (${v.motivo})` : ''}`);
  if (v.veredicto === 'espera') continue;
  const patch = v.veredicto === 'aprobada'
    ? { revision: 'aprobada', status: 'scheduled', scheduled_date: hoy, updated_at: new Date().toISOString() }
    : { revision: 'bloqueada', motivo_revision: v.motivo, updated_at: new Date().toISOString() };
  // Solo si SIGUE pendiente: si alguien la tocó a mano entretanto, manda lo suyo.
  await pedir(`${SB}/rest/v1/marketing_calendar?id=eq.${v.id}&revision=eq.pendiente`, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json', Prefer: 'return=minimal' }, body: JSON.stringify(patch),
  });
}
