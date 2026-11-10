// SND//WCH — scripts/hoy-hay
// QUÉ HAY HOY, leído de producción, para la historia «hoy hay» de las 11:00 (entrega de Automatizaciones a
// App, 2026-11-10; dueño: «Todo debe funcionar en automático»).
//
// Uso: `node scripts/hoy-hay.mjs > hoy-hay.json` (en GitHub: el proxy de las sesiones bloquea la API).
// Lee lo mismo que ve un cliente: `get-catalog` (Signatures activos + inventario que el dueño carga en el
// panel) y `get-store-hours` (si hoy se abre). No necesita secretos ni escribe nada.
//
// Promesa: un Signature sale en «hay» solo si está activo en la carta Y su proteína tiene stock (no marcada
// agotada y, si el dueño cargó cuántas quedan, más de 0). Modo de fallo: la historia promete algo que ya se
// acabó (o que nunca se cargó). Por eso, si no se pudo leer el inventario, `ok` sale en false y la historia
// no debe publicarse con esta lista.
const BASE = process.env.API_URL || 'https://rjosezuoyngiadunfzyn.supabase.co/functions/v1/api';

async function llamar(action) {
  const r = await fetch(BASE, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action }) });
  if (!r.ok) throw new Error(`${action} respondió ${r.status}`);
  return r.json();
}

// Lógica pura (se prueba con `node scripts/hoy-hay.mjs --probar`).
export function queHayHoy(catalogo, horario, ahora = new Date()) {
  const inv = catalogo.inventory || {};
  const hayProteina = (p) => { const i = inv[p]; return !i || (i.inStock !== false && i.qty !== 0); };
  const hay = [], agotado = [];
  for (const [id, s] of Object.entries(catalogo.sigItems || {})) {
    if (!s.active) continue;
    const fila = { id, nombre: s.n, proteina: s.prot, quedan: inv[s.prot]?.qty ?? null };
    (hayProteina(s.prot) ? hay : agotado).push(fila);
  }
  const lima = new Date(ahora.toLocaleString('en-US', { timeZone: 'America/Lima' }));
  const dia = (horario.hours || [])[lima.getDay()] || {};
  return {
    ok: Object.keys(inv).length > 0,
    motivo: Object.keys(inv).length > 0 ? '' : 'no hay inventario cargado: no se sabe qué hay',
    fecha: lima.toISOString().slice(0, 10),
    abreHoy: horario.businessLaunched === true && !dia.closed,
    horario: dia.closed ? null : { abre: dia.open, cierra: dia.close },
    hay, agotado,
  };
}

if (process.argv.includes('--probar')) {
  const cat = { sigItems: { A: { n: 'Uno', prot: 'P1', active: true }, B: { n: 'Dos', prot: 'P2', active: true }, C: { n: 'Tres', prot: 'P3', active: true }, D: { n: 'Off', prot: 'P1', active: false } },
    inventory: { P1: { inStock: true, qty: 3 }, P2: { inStock: false, qty: 5 }, P3: { inStock: true, qty: 0 } } };
  const r = queHayHoy(cat, { businessLaunched: true, hours: Array(7).fill({ open: 11, close: 22, closed: false }) });
  const ids = (l) => l.map((x) => x.id).join(',');
  const bien = r.ok && ids(r.hay) === 'A' && ids(r.agotado) === 'B,C' && r.abreHoy && !queHayHoy({ sigItems: cat.sigItems }, {}).ok;
  console.log(bien ? '✓ hoy-hay: la lista separa lo que hay de lo agotado' : '✗ hoy-hay: ' + JSON.stringify(r));
  process.exit(bien ? 0 : 1);
} else if (import.meta.url === `file://${process.argv[1]}`) {
  const [catalogo, horario] = await Promise.all([llamar('get-catalog'), llamar('get-store-hours')]);
  console.log(JSON.stringify(queHayHoy(catalogo, horario), null, 2));
}
