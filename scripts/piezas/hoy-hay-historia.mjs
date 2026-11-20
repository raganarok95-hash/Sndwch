// SND//WCH — piezas/hoy-hay-historia: la historia «hoy hay» de las 11:00, armada sola (entrega
// docs/entregas/marketing/2026-11-10-historia-hoy-hay.md; Ezra, 2026-11-10: «Todo debe funcionar en automático»).
//
// Corre en GitHub (.github/workflows/hoy-hay.yml) cada mañana. Lee QUÉ HAY de producción con
// scripts/hoy-hay.mjs (la misma carta e inventario que ve un cliente), arma un cuadro 9:16 con esa lista y lo
// programa en marketing_calendar para las 11:00 de Lima. El cron de Supabase la publica a esa hora.
//
// Promesa: la historia solo nombra lo que hay hoy, y solo sale si (1) hoy se abre, (2) el inventario se pudo
// leer (`ok`) y (3) Ezra aprobó la semana en docs/marketing/hoy-hay/APROBADO.md (una línea `- AAAA-MM-DD`
// con el lunes de la semana, o `- desde AAAA-MM-DD` para todas las semanas desde ese lunes). Modo de fallo que evita: una historia que promete algo agotado, o que sale sin
// el sí del dueño. Repetible: si el src del día ya está, no se vuelve a subir.
//
// Uso: node scripts/piezas/hoy-hay-historia.mjs            (en GitHub, con SUPABASE_ACCESS_TOKEN)
//      node scripts/piezas/hoy-hay-historia.mjs --muestra <salida.png>   (solo arma el cuadro con datos de prueba)
//      node scripts/piezas/hoy-hay-historia.mjs --probar-semana   (no --probar: ese lo toma hoy-hay.mjs al importarse)
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { queHayHoy } from '../hoy-hay.mjs';

const HORA = '11:00';

export function lunesDe(fecha) {
  const d = new Date(`${fecha}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
}
export function semanaAprobada(fecha, texto) {
  const lunes = lunesDe(fecha);
  return texto.split('\n').some((l) => { const t = l.trim(); const d = t.match(/^- desde (\d{4}-\d{2}-\d{2})/); return t === `- ${lunes}` || (d && lunes >= d[1]); });
}
const hh = (h) => `${Math.floor(h)}:${String(Math.round((h % 1) * 60)).padStart(2, '0')}`;

export function html(r) {
  const nombres = r.hay.map((x) => `<div class="it">${x.nombre.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</div>`).join('');
  const tam = r.hay.length > 5 ? 74 : 92;
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><style>
*{box-sizing:border-box;margin:0;padding:0}html,body{width:1080px;height:1920px;overflow:hidden;background:#EFE6D4}
.disp{font-family:"Anton",sans-serif;text-transform:uppercase;color:#1E2B22;line-height:1}
.voz{font-family:"Instrument Serif",serif;font-style:italic;color:#1E2B22}
.mono{font-family:"IBM Plex Mono",monospace;font-weight:600;letter-spacing:.06em;color:#1E2B22}
.wm{font:800 44px/1 "Archivo",sans-serif;display:inline-flex;align-items:center;color:#1E2B22}
.mk{display:inline-flex;gap:.16em;margin:0 .1em}.mk i{width:.10em;height:.88em;transform:skewX(-16deg);border-radius:1px;display:block}
.mk i:first-child{background:#CBA258}.mk i:last-child{background:#8CC8EC}
.it{font-family:"Anton",sans-serif;text-transform:uppercase;font-size:${tam}px;line-height:1.12;color:#1E2B22;border-bottom:3px solid #1E2B22;padding:18px 0}
</style></head><body>
<div class="mono" style="position:absolute;left:84px;top:250px;font-size:28px">${r.fecha.split('-').reverse().join('/')}</div>
<div class="disp" style="position:absolute;left:80px;top:300px;font-size:220px">Hoy hay</div>
<div style="position:absolute;left:84px;right:84px;top:600px">${nombres}</div>
<div class="voz" style="position:absolute;left:84px;bottom:330px;font-size:64px">Pídelo en sndwch.app</div>
<div class="mono" style="position:absolute;left:84px;bottom:280px;font-size:26px">DE ${hh(r.horario.abre)} A ${hh(r.horario.cierra)}</div>
<div class="wm" style="position:absolute;left:84px;bottom:190px">SND<span class="mk"><i></i><i></i></span>WCH</div>
</body></html>`;
}

function renderizar(r, salida) {
  const tmp = '/tmp/hoy-hay.html';
  writeFileSync(tmp, html(r));
  const css = execFileSync('bash', ['scripts/piezas/fuentes-locales.sh'], { encoding: 'utf8' }).trim();
  execFileSync('node', ['scripts/piezas/maqueta.mjs', tmp, salida, '1080', '1920'], { env: { ...process.env, FUENTES_CSS: css }, stdio: 'inherit' });
}

if (process.argv[2] === '--muestra') {
  renderizar({ fecha: '2026-11-20', horario: { abre: 11, cierra: 22 }, hay: [{ nombre: 'Muestra uno' }, { nombre: 'Muestra dos' }, { nombre: 'Muestra tres' }, { nombre: 'Muestra cuatro' }, { nombre: 'Muestra cinco' }] }, process.argv[3] || '/tmp/hoy-hay.png');
} else if (process.argv[2] === '--probar-semana') {
  const ok = lunesDe('2026-11-20') === '2026-11-16' && lunesDe('2026-11-16') === '2026-11-16' && lunesDe('2026-11-22') === '2026-11-16'
    && semanaAprobada('2026-11-20', '# x\n- 2026-11-16\n') && !semanaAprobada('2026-11-24', '- 2026-11-16')
    && semanaAprobada('2026-12-02', '- desde 2026-11-23 · x') && !semanaAprobada('2026-11-20', '- desde 2026-11-23 · x');
  console.log(ok ? '✓ hoy-hay-historia: la semana aprobada se lee bien' : '✗ hoy-hay-historia: lunesDe/semanaAprobada');
  process.exit(ok ? 0 : 1);
} else {
  const { SB, BUCKET, conectar } = await import('../video-auto/produccion.mjs');
  const { pedir, accion } = await conectar();
  const r = queHayHoy(await accion('get-catalog'), await accion('get-store-hours'));
  const aprobado = existsSync('docs/marketing/hoy-hay/APROBADO.md') ? readFileSync('docs/marketing/hoy-hay/APROBADO.md', 'utf8') : '';
  const no = !r.abreHoy ? 'hoy no se abre' : !r.ok ? r.motivo : !r.hay.length ? 'no hay ningún sándwich con stock'
    : !semanaAprobada(r.fecha, aprobado) ? `Ezra no aprobó la semana del ${lunesDe(r.fecha)} (docs/marketing/hoy-hay/APROBADO.md)` : '';
  if (no) { console.log(`· «hoy hay» no sale: ${no}`); process.exit(0); }
  const publicarDesde = new Date(`${r.fecha}T${HORA}:00-05:00`).toISOString();
  if (Date.parse(publicarDesde) < Date.now()) { console.log('· «hoy hay»: las 11:00 ya pasaron, no sale tarde'); process.exit(0); }
  const src = `h-hoy-hay-${r.fecha.replace(/-/g, '')}`;
  if ((await pedir(`${SB}/rest/v1/marketing_calendar?src=eq.${src}&select=id`)).length) { console.log(`· ${src} ya estaba programada`); process.exit(0); }
  renderizar(r, '/tmp/hoy-hay.png');
  const ruta = `historias/${src}.png`;
  await pedir(`${SB}/storage/v1/object/${BUCKET}/${ruta}`, { method: 'POST', headers: { 'Content-Type': 'image/png', 'x-upsert': 'true' }, body: readFileSync('/tmp/hoy-hay.png') });
  await pedir(`${SB}/rest/v1/marketing_calendar`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify({ scheduled_date: r.fecha, publicar_desde: publicarDesde, channel: 'instagram', status: 'scheduled', revision: 'aprobada',
      formato: 'historia', media_type: 'image', image_url: `${SB}/storage/v1/object/public/${BUCKET}/${ruta}`,
      title: `Hoy hay — ${r.hay.map((x) => x.nombre).join(', ')}`, created_by: 'agencia', rol: 'historias', plantilla: 'historia', src,
      datos: { hay: r.hay.map((x) => x.id), agotado: r.agotado.map((x) => x.id) } }),
  });
  console.log(`✓ ${src} → sale ${publicarDesde} con ${r.hay.length} sándwiches`);
}
