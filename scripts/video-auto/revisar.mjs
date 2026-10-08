// SND//WCH — video-auto/revisar: el Revisor del equipo de marketing, como código.
// Revisa los borradores del Productor contra producción y aprueba UNO por día o los bloquea con
// motivo (.github/workflows/revisar-marketing.yml).
//
// La hora de publicar NO es la hora de este paso (2026-10-08): GitHub atrasa sus horarios de 5 a 9
// horas en este repo. Aprobar = 'scheduled' con `publicar_desde` (la franja de su día, 12:00 o 18:00
// de Lima: horaDelVideo) y esa franja en `datos.franja`, para medir cuál trae más pedidos. El
// cron de Supabase, que sí es puntual, la publica a esa hora. Por eso se revisa un día antes, y
// también lo de hoy que haya llegado tarde (si todavía es hora). El stock se mira al publicar
// (agotadoAlPublicar en api/actions/social.ts): un día antes no se sabe.
//
// Por qué código y no una sesión de Claude: todas las reglas son mecánicas (el texto del post ya
// sale interpolado de la carta), cuesta S/0 y no gasta créditos. Reglas en reglas-del-revisor.mjs.
import { SB, BUCKET, conectar, hoyEnLima, mananaEnLima, faltanParaPublicar } from './produccion.mjs';
import { decidir, horaDePublicar, horaDelVideo } from './reglas-del-revisor.mjs';

const { pedir, accion } = await conectar();
const hoy = hoyEnLima();
const manana = mananaEnLima();

const faltan = await faltanParaPublicar();
if (faltan.length) console.log(`::warning::Instagram/Facebook no pueden publicar: faltan los secrets ${faltan.join(', ')} en Supabase.`);
else console.log('✓ Secrets de publicación de Meta presentes.');

const piezas = await pedir(`${SB}/rest/v1/marketing_calendar?rol=eq.productor&status=eq.draft&revision=eq.pendiente&scheduled_date=in.(${hoy},${manana})&select=id,src,caption_text,datos,created_at,scheduled_date`);
if (!piezas.length) { console.log('Nada que revisar.'); process.exit(0); }

const [cat, horario] = await Promise.all([accion('get-catalog'), accion('get-store-hours')]);
// El inventario de HOY no dice nada de mañana: el stock se revisa al publicar.
const catSinStock = { ...cat, inventory: {} };

const conVideo = new Set();
for (const p of piezas) {
  const r = await fetch(`${SB}/storage/v1/object/public/${BUCKET}/videos/${p.src}.mp4`, { method: 'HEAD' });
  if (r.ok) conVideo.add(p.src);
}
const desde = new Date(Date.now() - 2 * 86400e3).toISOString().slice(0, 10);
const cerca = await pedir(`${SB}/rest/v1/marketing_calendar?rol=eq.productor&status=in.(scheduled,publishing,posted)&scheduled_date=gte.${desde}&select=datos`);
const recientes = new Set(cerca.map((x) => x.datos?.sig).filter(Boolean));

for (const dia of [hoy, manana]) {
  const delDia = piezas.filter((p) => p.scheduled_date === dia);
  if (!delDia.length) continue;
  const semana = horario.hours?.[new Date(`${dia}T12:00:00-05:00`).getUTCDay()];
  const abre = !!semana && semana.closed !== true && !(horario.pausedUntil && dia === hoy);
  const desdeCuando = horaDePublicar(dia, hoy, new Date());
  const veredictos = decidir({ piezas: delDia, hoy: dia, abreHoy: abre, cat: catSinStock, conVideo, recientes });
  for (const v of veredictos) {
    const tarde = v.veredicto === 'aprobada' && !desdeCuando;
    console.log(`${dia} ${v.src} → ${tarde ? 'espera (tarde para hoy)' : v.veredicto}${v.motivo ? ` (${v.motivo})` : ''}`);
    if (v.veredicto === 'espera' || tarde) continue;
    // `datos` se reemplaza entero al hacer PATCH: va lo que ya tenía más la franja.
    const datos = { ...(delDia.find((p) => p.id === v.id)?.datos || {}), franja: horaDelVideo(dia) };
    const patch = v.veredicto === 'aprobada'
      ? { revision: 'aprobada', status: 'scheduled', scheduled_date: dia, publicar_desde: desdeCuando, datos, updated_at: new Date().toISOString() }
      : { revision: 'bloqueada', motivo_revision: v.motivo, updated_at: new Date().toISOString() };
    // Solo si SIGUE pendiente: si alguien la tocó a mano entretanto, manda lo suyo.
    await pedir(`${SB}/rest/v1/marketing_calendar?id=eq.${v.id}&revision=eq.pendiente`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json', Prefer: 'return=minimal' }, body: JSON.stringify(patch),
    });
  }
}
