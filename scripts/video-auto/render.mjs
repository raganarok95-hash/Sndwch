// SND//WCH — video-auto/render: dibuja la plantilla cuadro por cuadro y la codifica a MP4 vertical.
// Uso: node scripts/video-auto/render.mjs datos.json salida.mp4  (FFMPEG=ruta si no está en PATH)
import { chromium } from '@playwright/test';
import { readFileSync, mkdirSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';

const [datosPath, salida = 'video.mp4'] = process.argv.slice(2);
const datos = JSON.parse(readFileSync(datosPath, 'utf8'));
const FPS = 30, DURA = 12;
const dir = join(tmpdir(), 'sndwch-video-' + Date.now());
mkdirSync(dir, { recursive: true });
const b = await chromium.launch(process.env.PLAYWRIGHT_CHROMIUM_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH } : {});
const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
await p.addInitScript((d) => { window.DATOS = d; }, datos);
await p.goto('file://' + resolve('scripts/video-auto/plantilla.html'));
if (process.env.FUENTES_CSS) await p.addStyleTag({ content: readFileSync(process.env.FUENTES_CSS, 'utf8') });
await p.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].map((i) => i.decode().catch(() => 0))); });
for (let i = 0; i < FPS * DURA; i++) {
  await p.evaluate((t) => window.render(t), i / FPS);
  await p.screenshot({ path: join(dir, String(i).padStart(4, '0') + '.jpg'), type: 'jpeg', quality: 90 });
}
await b.close();
// Pista de audio en silencio: algunas redes rechazan un video sin audio.
execFileSync(process.env.FFMPEG || 'ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', join(dir, '%04d.jpg'),
  '-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=stereo', '-shortest',
  '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20', '-preset', 'medium', '-c:a', 'aac', '-movflags', '+faststart', salida]);
rmSync(dir, { recursive: true, force: true });
console.log('✓ ' + salida);
