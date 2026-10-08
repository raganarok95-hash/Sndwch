// SND//WCH — piezas/subir-historias: programa en Instagram las historias que ya tienen TODAS sus
// imágenes de Flow (docs/marketing/AGENCIA.md, sin pasos a mano). Corre en GitHub
// (.github/workflows/historias.yml) cuando el Estudio sube imágenes, y una vez al día.
//
// Por cada historia completa de cada semana (scripts/piezas/historias.mjs --final): sube cada
// cuadro al bucket y lo anota en marketing_calendar como historia programada, con
// `publicar_desde` = su día y su hora de Lima. El cron de Supabase la publica a esa hora (cuadros en
// orden de creación). Una historia cuya hora ya pasó no se sube: salir tarde es peor que no salir.
// Repetible: un cuadro que ya está (por su src) no se vuelve a subir.
import { readFileSync, readdirSync, existsSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { SB, BUCKET, conectar, hoyEnLima } from '../video-auto/produccion.mjs';

const { pedir, accion } = await conectar();
const hoy = hoyEnLima();
const horario = await accion('get-store-hours');
const abierto = (horario.hours || []).find((d) => d && !d.closed && d.open != null);
if (!abierto) throw new Error('El horario de la base no tiene ningún día abierto.');
const HORARIO = `${abierto.open}-${abierto.close}`;
writeFileSync('/tmp/datos.json', execFileSync('node_modules/.bin/deno', ['run', '--allow-read', '--no-check', 'scripts/piezas/datos.ts'], { encoding: 'utf8' }));

let subidos = 0;
for (const semana of readdirSync('docs/marketing/semanas').sort()) {
  const dir = `docs/marketing/semanas/${semana}`;
  if (!existsSync(`${dir}/historias.json`)) continue;
  execFileSync('node', ['scripts/piezas/historias.mjs', semana, '/tmp/datos.json', '--final'], { env: { ...process.env, HORARIO }, stdio: 'inherit' });
  const manifiesto = JSON.parse(readFileSync(`${dir}/historias/manifiesto.json`, 'utf8'));
  for (const h of manifiesto) {
    const publicarDesde = new Date(`${h.dia}T${h.hora}:00-05:00`).toISOString();
    if (h.dia < hoy || Date.parse(publicarDesde) < Date.now()) { console.log(`· ${h.dia} ${h.id}: su hora ya pasó, no sale`); continue; }
    for (const [i, archivo] of h.archivos.entries()) {
      const src = `h-${h.id}-${i + 1}-${h.dia.replace(/-/g, '')}`;
      const ya = await pedir(`${SB}/rest/v1/marketing_calendar?src=eq.${src}&select=id`);
      if (ya.length) continue;
      const ruta = `historias/${src}.png`;
      await pedir(`${SB}/storage/v1/object/${BUCKET}/${ruta}`, { method: 'POST', headers: { 'Content-Type': 'image/png', 'x-upsert': 'true' }, body: readFileSync(archivo) });
      await pedir(`${SB}/rest/v1/marketing_calendar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Prefer: 'return=minimal' },
        body: JSON.stringify({
          scheduled_date: h.dia, publicar_desde: publicarDesde, channel: 'instagram', status: 'scheduled', revision: 'aprobada',
          formato: 'historia', media_type: 'image', image_url: `${SB}/storage/v1/object/public/${BUCKET}/${ruta}`,
          title: `${h.titulo} — historia ${i + 1}/${h.archivos.length}`, created_by: 'agencia', rol: 'historias', plantilla: 'historia', src,
          datos: { semana, historia: h.id, cuadro: i + 1 },
        }),
      });
      subidos++;
      console.log(`✓ ${src} → sale ${publicarDesde}`);
    }
  }
}
console.log(`✓ ${subidos} cuadros nuevos programados.`);
