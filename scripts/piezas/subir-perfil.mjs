// SND//WCH — piezas/subir-perfil: el Instagram final aprobado por el dueño el 2026-10-30
// (docs/marketing/instagram-perfil/final/). Reemplaza al lanzamiento anterior (subir.mjs).
// Corre en GitHub (.github/workflows/subir-perfil.yml), en dos tiempos:
//  1. Sin PUBLICAR: sube las piezas al bucket público y las carga en `marketing_calendar` como BORRADORES,
//     en el orden de publicación de publicar.json (de abajo hacia arriba de la cuadrícula). Bloquea los
//     borradores del lanzamiento anterior, que ya no se usan. Es idempotente: lo cargado se actualiza y lo
//     publicado no se toca.
//  2. Con PUBLICAR=si: programa lo que sale ya (`cuando: 'ya'`), cinco minutos una de otra, para que cada
//     corrida del cron (cada 15 minutos) publique tres como mucho y en orden. Lo que todavía no llega sale con
//     «Próximamente» en la imagen (dueño, 2026-10-30); lo que tenga otro `cuando` espera.
// Ningún texto que invite a pedir sale antes de abrir: se revisa con invitaAPedir() antes de programar.
import { readFileSync } from 'node:fs';
import { SB, BUCKET, conectar } from '../video-auto/produccion.mjs';
import { invitaAPedir } from '../video-auto/reglas-del-revisor.mjs';

const DIR = 'docs/marketing/instagram-perfil/final';
const PUBLICAR = process.env.PUBLICAR === 'si';
const piezas = JSON.parse(readFileSync(`${DIR}/publicar.json`, 'utf8'));
const { pedir } = await conectar();
const urlDe = (f) => `${SB}/storage/v1/object/public/${BUCKET}/perfil/${f}`;
const hoyLima = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima' }).format(new Date());
const json = { 'Content-Type': 'application/json', Prefer: 'return=minimal' };

if (PUBLICAR) {
  const ya = piezas.filter((p) => p.cuando === 'ya');
  for (const p of ya) if (p.texto && invitaAPedir(p.texto)) throw new Error(`${p.src} invita a pedir: espera a abrir`);
  const base = Date.now();
  for (const [k, p] of ya.entries()) {
    const fila = await pedir(`${SB}/rest/v1/marketing_calendar?src=eq.${p.src}&select=id,status`);
    if (!fila.length) throw new Error(`${p.src} no está cargada: corre primero sin PUBLICAR`);
    if (fila[0].status !== 'draft') { console.log(`${k + 1}. ${p.src}: ya está ${fila[0].status}`); continue; }
    await pedir(`${SB}/rest/v1/marketing_calendar?id=eq.${fila[0].id}&status=eq.draft`, {
      method: 'PATCH', headers: json,
      body: JSON.stringify({ status: 'scheduled', revision: 'aprobada', scheduled_date: hoyLima, publicar_desde: new Date(base + k * 5 * 60e3).toISOString(), updated_at: new Date().toISOString() }),
    });
    console.log(`${k + 1}. ${p.src}: programada`);
  }
  process.exit(0);
}

for (const [i, p] of piezas.entries()) {
  for (const f of [...p.laminas, p.video].filter(Boolean)) {
    const tipo = f.endsWith('.mp4') ? 'video/mp4' : f.endsWith('.png') ? 'image/png' : 'image/jpeg';
    await pedir(`${SB}/storage/v1/object/${BUCKET}/perfil/${f}`, { method: 'POST', headers: { 'Content-Type': tipo, 'x-upsert': 'true' }, body: readFileSync(`${DIR}/${f}`) });
  }
  const datos = { pieza: p.pieza, orden: i + 1, laminas: p.laminas.map(urlDe), fijar: !!p.fijar, cuando: p.cuando, destacado: p.destacado || null };
  const fila = {
    scheduled_date: hoyLima, channel: 'instagram', title: `Perfil · ${p.pieza}`, caption_text: p.texto || '',
    media_type: p.video ? 'video' : 'image', image_url: urlDe(p.laminas[0]), video_url: p.video ? urlDe(p.video) : null,
    formato: p.formato || 'feed', datos, revision: 'pendiente', updated_at: new Date().toISOString(),
  };
  const ya = await pedir(`${SB}/rest/v1/marketing_calendar?src=eq.${p.src}&select=id,status`);
  if (ya.length) {
    if (ya[0].status === 'draft') {
      await pedir(`${SB}/rest/v1/marketing_calendar?id=eq.${ya[0].id}&status=eq.draft`, { method: 'PATCH', headers: json, body: JSON.stringify(fila) });
      console.log(`${i + 1}. ${p.src}: borrador actualizado`);
    } else console.log(`${i + 1}. ${p.src}: ya está ${ya[0].status}, no se toca`);
    continue;
  }
  await pedir(`${SB}/rest/v1/marketing_calendar`, {
    method: 'POST', headers: json,
    body: JSON.stringify({ ...fila, status: 'draft', created_by: 'perfil-final', plantilla: 'perfil', src: p.src, rol: 'lanzamiento' }),
  });
  console.log(`${i + 1}. ${p.src}: cargada`);
  // Un segundo entre filas: el cron publica por fecha, hora y creación.
  await new Promise((r) => setTimeout(r, 1000));
}

// El lanzamiento anterior (docs/marketing/lanzamiento) queda reemplazado: sus borradores no salen nunca.
const nuevos = new Set(piezas.map((p) => p.src));
const viejos = (await pedir(`${SB}/rest/v1/marketing_calendar?rol=eq.lanzamiento&status=eq.draft&select=id,src`)).filter((f) => !nuevos.has(f.src));
for (const f of viejos) {
  await pedir(`${SB}/rest/v1/marketing_calendar?id=eq.${f.id}&status=eq.draft`, {
    method: 'PATCH', headers: json,
    body: JSON.stringify({ revision: 'bloqueada', motivo_revision: 'Reemplazado por el Instagram final del 2026-10-30 (docs/marketing/instagram-perfil/final).', updated_at: new Date().toISOString() }),
  });
}
console.log(`lanzamiento anterior bloqueado: ${viejos.length}`);
