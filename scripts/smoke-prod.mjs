// SND//WCH — scripts/smoke-prod
// Golpea la función `api` YA DESPLEGADA y comprueba que producción contesta cosas con
// sentido. Corre al final de `.github/workflows/deploy-api.yml`, después del deploy.
//
// POR QUÉ EXISTE. El CI verifica ANTES de desplegar: `deno check`, las pruebas de dinero,
// y recién entonces `supabase functions deploy`. Después del deploy no verificaba nadie.
// Todo lo que puede romperse justo ahí queda invisible hasta que lo reporta un cliente: un
// secret que no está puesto en producción aunque el código compile, una migración que no se
// aplicó y deja al código nuevo consultando una columna que no existe, un deploy que
// devolvió éxito y dejó la versión anterior corriendo. Esta sesión ya vio ese patrón: el
// dead-man switch de crons existe porque pg_cron marcaba "succeeded" por haber ENCOLADO la
// petición, no por que la función hubiera hecho su trabajo.
//
// NO NECESITA NINGÚN SECRET. La función se despliega con `--no-verify-jwt` y el cliente le
// habla sin cabecera de autorización, así que esto usa exactamente el mismo camino que un
// cliente real — que es justo lo que se quiere probar.
//
// COMPRUEBA CONTENIDO, NO SOLO EL 200. Un `get-catalog` que responde 200 con `sigItems: []`
// es una app sin menú: para el cliente es una caída total, y para un chequeo que solo mire
// el código de estado, un éxito.
const BASE = process.env.SMOKE_URL || 'https://rjosezuoyngiadunfzyn.supabase.co/functions/v1/api';
const TIMEOUT_MS = Number(process.env.SMOKE_TIMEOUT_MS || 15000);

const problemas = [];
const notas = [];

async function llamar(action, extra = {}) {
  const t0 = Date.now();
  const ctrl = new AbortController();
  const reloj = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...extra }),
      signal: ctrl.signal,
    });
    const texto = await res.text();
    let cuerpo = null;
    try {
      cuerpo = JSON.parse(texto);
    } catch {}
    return { status: res.status, cuerpo, texto, ms: Date.now() - t0 };
  } finally {
    clearTimeout(reloj);
  }
}

// ── 1. ¿Está viva y con los secretos puestos? ───────────────────────────────────────────
{
  const r = await llamar('ping');
  if (r.status !== 200) {
    problemas.push(`ping devolvió ${r.status}: ${r.texto.slice(0, 300)}`);
  } else {
    const c = r.cuerpo?.checks || {};
    if (!c.db) problemas.push('ping dice que la base NO responde desde la edge function.');
    if (!c.sessionSecret) problemas.push('ping dice que falta SESSION_SECRET en producción: nadie puede iniciar sesión.');
    // Los demás no tumban el deploy —el negocio sigue operando sin ellos— pero tienen que
    // verse, porque cada uno apaga una función entera en silencio.
    for (const [clave, que] of [
      ['culqiKey', 'pagos con tarjeta'],
      ['resendKey', 'correos'],
      ['vapidKey', 'notificaciones push'],
      ['googleClientId', 'Google Sign-In'],
    ]) {
      if (!c[clave]) notas.push(`${clave} no está configurado en producción: ${que} apagado.`);
    }
  }
  notas.push(`ping respondió en ${r.ms} ms`);
}

// ── 2. ¿Hay menú? ───────────────────────────────────────────────────────────────────────
{
  const r = await llamar('get-catalog');
  if (r.status !== 200) {
    problemas.push(`get-catalog devolvió ${r.status}: ${r.texto.slice(0, 300)}`);
  } else {
    const b = r.cuerpo || {};
    // `sigItems` es un objeto indexado por código (SIG01…), no una lista.
    const activos = Object.entries(b.sigItems || {}).filter(([, i]) => i && i.active !== false);
    if (!activos.length) {
      problemas.push('get-catalog no devolvió ningún Signature activo: la app abriría sin menú.');
    }
    for (const [code, it] of activos) {
      const p15 = Number(it.p15);
      const p30 = Number(it.p30);
      // Un precio en 0 o ausente no da error en ninguna parte: se cobra 0 y se descubre
      // contando la caja. Es exactamente la clase de fallo que este chequeo busca.
      if (!(p15 > 0)) problemas.push(`${code} (${it.n}): precio de 15CM inválido (${it.p15}).`);
      if (!(p30 > 0)) problemas.push(`${code} (${it.n}): precio de 30CM inválido (${it.p30}).`);
      if (p15 > 0 && p30 > 0 && p30 < p15) {
        problemas.push(`${code} (${it.n}): el 30CM (S/${p30}) cuesta menos que el 15CM (S/${p15}).`);
      }
      if (!it.n) problemas.push(`${code}: se quedó sin nombre.`);
    }
    if (!b.proteins || !Object.keys(b.proteins).length) {
      problemas.push('get-catalog no devolvió proteínas: ARMA EL TUYO quedaría vacío.');
    }
    if (!b.sides || !Object.keys(b.sides).length) {
      problemas.push('get-catalog no devolvió bebidas.');
    }
    if (!b.rewardPts || !Object.keys(b.rewardPts).length) {
      problemas.push('get-catalog no devolvió los puntos de las recompensas: el programa de fidelidad quedaría sin precios.');
    }
    notas.push(`catálogo: ${activos.length} Signatures activos, ${Object.keys(b.proteins || {}).length} proteínas, ${r.ms} ms`);
  }
}

// ── 3. ¿Sabe cuándo abre? ───────────────────────────────────────────────────────────────
{
  const r = await llamar('get-store-hours');
  if (r.status !== 200) {
    problemas.push(`get-store-hours devolvió ${r.status}: ${r.texto.slice(0, 300)}`);
  } else {
    const h = r.cuerpo?.hours;
    if (!Array.isArray(h) || h.length !== 7) {
      problemas.push(`get-store-hours devolvió ${Array.isArray(h) ? h.length : 'nada'} días en vez de 7.`);
    } else if (h.every((d) => d.closed)) {
      problemas.push('get-store-hours dice que la tienda está cerrada los 7 días: nadie podría pedir.');
    }
  }
}

// ── 4. ¿Los errores siguen siendo errores? ──────────────────────────────────────────────
// Si una acción inexistente devolviera 200, significaría que el despacho de acciones se
// rompió y cualquier petición mal formada estaría pasando como válida.
{
  const r = await llamar('accion-que-no-existe-' + Date.now());
  if (r.status === 200) {
    problemas.push('una acción inexistente devolvió 200: el despacho de acciones no está rechazando nada.');
  } else if (r.status >= 500) {
    problemas.push(`una acción inexistente devolvió ${r.status} (error del servidor) en vez de un 4xx: el manejo de errores está roto.`);
  }
}

for (const n of notas) console.log('  · ' + n);
if (problemas.length) {
  console.error(`\n✗ Humo en producción: ${problemas.length} problema(s) DESPUÉS del deploy\n`);
  for (const p of problemas) console.error('  • ' + p);
  process.exit(1);
}
console.log('\n✓ Producción responde: ping, catálogo con precios válidos, horario y manejo de errores.');
