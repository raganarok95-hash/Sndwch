// SND//WCH — scripts/vigia-automaticas
// Dueño (2026-11-10): «Todo debe funcionar en automático» · «Y sí dale luz verde a todo».
// El recorrido real estuvo 9 días en rojo (25-oct al 2-nov) sin que nadie se enterara: ninguna automática
// avisaba. Esto mira, una vez al día antes del correo de cierre de las 22:30:
//   1. las automáticas programadas (.github/workflows con `schedule:`) cuyas DOS últimas corridas fallaron;
//   2. las preguntas abiertas a Ezra (docs/entregas/ezra/PREGUNTAS.md);
//   3. las entregas entre hilos abiertas hace más de 24 h (docs/entregas/<hilo>/*.md).
// Lo deja en app_settings.avisos_del_sistema (el correo daily-summary lo muestra en «EL SISTEMA //»).
// Sale con error si hay una automática en rojo, para que GitHub también avise.
//
//   GITHUB_TOKEN=… SUPABASE_ACCESS_TOKEN=… node scripts/vigia-automaticas.mjs
//   node scripts/vigia-automaticas.mjs --seco      → solo imprime, no escribe en la base
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const REPO = process.env.GITHUB_REPOSITORY || 'raganarok95-hash/Sndwch';
const REF = 'rjosezuoyngiadunfzyn';
const SECO = process.argv.includes('--seco');
const HOY = new Date();
const DELIM = '$' + 'avisos' + '$';

export function automaticasProgramadas(dir = '.github/workflows') {
  return readdirSync(dir).filter((f) => /\.ya?ml$/.test(f)).flatMap((f) => {
    const s = readFileSync(join(dir, f), 'utf8');
    if (!/^\s*schedule:/m.test(s)) return [];
    const nombre = (s.match(/^name:\s*(.+)$/m)?.[1] || f).trim().replace(/^['"]|['"]$/g, '');
    return [{ archivo: f, nombre }];
  });
}

// Conclusiones de las últimas corridas programadas, de la más nueva a la más vieja: en rojo si las dos
// últimas que terminaron fallaron. Una falla suelta no alarma (GitHub a veces se cae un rato).
export function enRojo(conclusiones) {
  const hechas = conclusiones.filter((c) => c && c !== 'cancelled' && c !== 'skipped');
  return hechas.length >= 2 && hechas[0] === 'failure' && hechas[1] === 'failure';
}

export function preguntasAbiertas(md) {
  return md.split('\n').filter((l) => /^\|\s*Q\d+\s*\|/.test(l)).map((l) => l.split('|').map((c) => c.trim()))
    .map((c) => ({ id: c[1], desde: c[2], hilo: c[3], pregunta: c[4], estado: c[5] }))
    .filter((p) => p.estado === 'abierta');
}

export function cabecera(md) {
  const [cab] = md.split(/^---\s*$/m);
  return Object.fromEntries(cab.split('\n').map((l) => l.match(/^([a-z-]+):\s*(.*)$/)).filter(Boolean)
    .map((m) => [m[1], m[2].replace(/\s+←.*$/, '').trim()]));
}

export function entregasAtascadas(raiz = 'docs/entregas', ahora = HOY) {
  if (!existsSync(raiz)) return [];
  return readdirSync(raiz, { withFileTypes: true }).filter((d) => d.isDirectory() && d.name !== 'ezra').flatMap((d) =>
    readdirSync(join(raiz, d.name)).filter((f) => /^\d{4}-\d{2}-\d{2}-.+\.md$/.test(f)).flatMap((f) => {
      const c = cabecera(readFileSync(join(raiz, d.name, f), 'utf8'));
      const desde = f.slice(0, 10);
      const horas = (ahora.getTime() - new Date(desde + 'T12:00:00-05:00').getTime()) / 36e5;
      return c.estado === 'abierta' && horas > 24 ? [{ hilo: d.name, archivo: f, de: c.de || '?', desde }] : [];
    }));
}

async function gh(path) {
  const r = await fetch(`https://api.github.com/repos/${REPO}/${path}`, {
    headers: { ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}), Accept: "application/vnd.github+json" },
  });
  if (!r.ok) throw new Error(`GitHub ${path}: ${r.status}`);
  return r.json();
}

async function main() {
  const rojas = [];
  for (const w of automaticasProgramadas()) {
    const { workflow_runs: runs } = await gh(`actions/workflows/${w.archivo}/runs?event=schedule&per_page=4`);
    const c = runs.map((r) => r.conclusion);
    const roja = enRojo(c);
    if (roja) rojas.push({ ...w, ultima: runs[0]?.created_at?.slice(0, 10) });
    console.log(`${roja ? '✗' : '✓'} ${w.nombre} (${w.archivo}): ${c.join(', ') || 'sin corridas'}`);
  }
  const preguntas = preguntasAbiertas(readFileSync('docs/entregas/ezra/PREGUNTAS.md', 'utf8'));
  const atascadas = entregasAtascadas();
  console.log(`${preguntas.length} pregunta(s) abierta(s) a Ezra · ${atascadas.length} entrega(s) atascada(s)`);
  for (const a of atascadas) console.log(`  · ${a.hilo}/${a.archivo} (de ${a.de}, desde ${a.desde})`);

  const avisos = { generado: HOY.toISOString(), automaticas_en_rojo: rojas, preguntas_abiertas: preguntas, entregas_atascadas: atascadas };
  if (!SECO) {
    const json = JSON.stringify(avisos);
    if (json.includes(DELIM)) throw new Error('el JSON trae el delimitador');
    const r = await fetch(`https://api.supabase.com/v1/projects/${REF}/database/query`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.SUPABASE_ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: `update public.app_settings set avisos_del_sistema = ${DELIM}${json}${DELIM}::jsonb, avisos_del_sistema_at = now() where id` }),
    });
    if (!r.ok) throw new Error(`Supabase: ${r.status} ${await r.text()}`);
    console.log('✓ Guardado en app_settings.avisos_del_sistema');
  }
  if (rojas.length) {
    console.log(`::error::${rojas.length} automática(s) fallaron dos veces seguidas: ${rojas.map((r) => r.nombre).join(', ')}`);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) await main();
