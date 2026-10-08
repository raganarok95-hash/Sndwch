// SND//WCH — video-auto/produccion: lo que comparten el Productor (diario.mjs) y el Revisor
// (revisar.mjs) para hablar con producción desde GitHub. Con el SUPABASE_ACCESS_TOKEN del
// despliegue se saca la llave de servicio (como scripts/capturas-reales.mjs); el proxy de las
// sesiones de Claude bloquea supabase.co, por eso esto corre solo en GitHub.
export const REF = 'rjosezuoyngiadunfzyn';
export const SB = `https://${REF}.supabase.co`;
export const BUCKET = 'marketing-images';

export async function conectar() {
  const tok = process.env.SUPABASE_ACCESS_TOKEN;
  if (!tok) throw new Error('Falta SUPABASE_ACCESS_TOKEN');
  const keys = await (await fetch(`https://api.supabase.com/v1/projects/${REF}/api-keys?reveal=true`, { headers: { Authorization: `Bearer ${tok}` } })).json();
  const servicio = (keys.find((k) => k.name === 'service_role') || {}).api_key;
  if (!servicio) throw new Error('No se obtuvo la llave de servicio');
  console.log(`::add-mask::${servicio}`);
  const h = { apikey: servicio, Authorization: `Bearer ${servicio}` };
  const pedir = async (url, init = {}) => {
    const r = await fetch(url, { ...init, headers: { ...h, ...(init.headers || {}) } });
    if (!r.ok) throw new Error(`${init.method || 'GET'} ${url.replace(SB, '')} → ${r.status} ${await r.text()}`);
    const t = await r.text();
    return t ? JSON.parse(t) : null;
  };
  // La misma respuesta que recibe el celular del cliente.
  const accion = (action, body = {}) => pedir(`${SB}/functions/v1/api`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, ...body }) });
  return { pedir, accion };
}

// Qué secrets de publicación existen en las edge functions (solo NOMBRES; la API no da valores
// legibles). Sin el token, el cron auto-publish-calendar no puede publicar nada y fallaría en
// silencio cada 15 min: el Revisor lo dice en voz alta. La página y el Instagram los deduce el
// servidor del token (`instagramDeLaPagina()` en api/actions/social.ts).
export const SECRETOS_PARA_PUBLICAR = ['META_PAGE_ACCESS_TOKEN'];
export async function faltanParaPublicar() {
  const r = await fetch(`https://api.supabase.com/v1/projects/${REF}/secrets`, { headers: { Authorization: `Bearer ${process.env.SUPABASE_ACCESS_TOKEN}` } });
  if (!r.ok) throw new Error(`No pude listar los secrets (${r.status})`);
  const hay = new Set((await r.json()).map((x) => x.name));
  return SECRETOS_PARA_PUBLICAR.filter((n) => !hay.has(n));
}

// Lima es UTC-5 todo el año.
export const ahoraEnLima = () => new Date(Date.now() - 5 * 3600e3);
export const hoyEnLima = () => ahoraEnLima().toISOString().slice(0, 10);
export const mananaEnLima = () => new Date(ahoraEnLima().getTime() + 86400e3).toISOString().slice(0, 10);

export const precio = (n) => 'S/' + (Number.isInteger(n) ? n : Number(n).toFixed(2));
