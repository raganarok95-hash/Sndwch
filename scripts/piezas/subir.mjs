// SND//WCH — piezas/subir: sube las piezas del lanzamiento al bucket público y las carga en
// `marketing_calendar` en el orden de publicación, como BORRADORES pendientes de que el dueño las
// apruebe (rol 'lanzamiento'; el Revisor del video del día no las toca). Al aprobarlas se pasan a
// 'scheduled' y el cron auto-publish-calendar las publica una tras otra, en ese orden.
// Corre en GitHub (.github/workflows/subir-lanzamiento.yml). Es idempotente: lo ya cargado (mismo
// `src`) no se duplica: el borrador se actualiza; lo aprobado no se toca. Las imágenes se reemplazan.
import { readFileSync } from 'node:fs';
import { SB, BUCKET, conectar } from '../video-auto/produccion.mjs';

const DIR = 'docs/marketing/lanzamiento';
const { pedir } = await conectar();
const pubs = JSON.parse(readFileSync(`${DIR}/publicaciones.json`, 'utf8'));
const urlDe = (f) => `${SB}/storage/v1/object/public/${BUCKET}/lanzamiento/${f}`;

for (const [i, p] of pubs.entries()) {
  for (const f of p.laminas) {
    await pedir(`${SB}/storage/v1/object/${BUCKET}/lanzamiento/${f}`, { method: 'POST', headers: { 'Content-Type': 'image/jpeg', 'x-upsert': 'true' }, body: readFileSync(`${DIR}/${f}`) });
  }
  const ya = await pedir(`${SB}/rest/v1/marketing_calendar?src=eq.${p.src}&select=id,status`);
  if (ya.length) {
    // Un borrador todavía no aprobado se actualiza con la versión nueva; lo aprobado o publicado no se toca.
    if (ya[0].status === 'draft') {
      await pedir(`${SB}/rest/v1/marketing_calendar?id=eq.${ya[0].id}&status=eq.draft`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json', Prefer: 'return=minimal' },
        body: JSON.stringify({ caption_text: p.texto, image_url: urlDe(p.laminas[0]), datos: { pieza: p.pieza, orden: i + 1, laminas: p.laminas.map(urlDe), fijar: p.fijar }, revision: 'pendiente', updated_at: new Date().toISOString() }),
      });
      console.log(`${i + 1}. ${p.pieza}: borrador actualizado`);
    } else console.log(`${i + 1}. ${p.pieza}: ya está ${ya[0].status}, no se toca`);
    continue;
  }
  await pedir(`${SB}/rest/v1/marketing_calendar`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify({
      scheduled_date: '2026-10-12', channel: 'instagram', status: 'draft', title: `Lanzamiento · ${p.pieza}`,
      caption_text: p.texto, media_type: 'image', image_url: urlDe(p.laminas[0]), created_by: 'lanzamiento',
      plantilla: 'lanzamiento', src: p.src, rol: 'lanzamiento', revision: 'pendiente',
      datos: { pieza: p.pieza, orden: i + 1, laminas: p.laminas.map(urlDe), fijar: p.fijar },
    }),
  });
  console.log(`${i + 1}. ${p.pieza}: cargada (${p.laminas.length} lámina${p.laminas.length > 1 ? 's' : ''})`);
  // Un segundo entre filas: el cron publica por created_at, y así el orden no depende de milisegundos.
  await new Promise((r) => setTimeout(r, 1000));
}
