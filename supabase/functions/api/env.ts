// SND//WCH — api / env
// Todas las variables de entorno y constantes de negocio del backend, centralizadas en
// un solo lugar en vez de estar dispersas (y a veces repetidas) por todo index.ts.

export const SB_URL = Deno.env.get("SUPABASE_URL")!;
export const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
export const CULQI_SECRET_KEY = Deno.env.get("CULQI_SECRET_KEY");
// Client ID de Google Cloud Console (OAuth 2.0), usado para verificar que un id_token de
// Google Identity Services fue emitido para ESTA app (campo `aud`) y no para otra. NO es
// secreto (viaja también al cliente, ver GOOGLE_CLIENT_ID en shell.html) — configúralo
// con: supabase secrets set GOOGLE_CLIENT_ID=... Sin él, "Continuar con Google" queda
// deshabilitado (ver actGoogleAuth) y el resto de la app sigue funcionando con normalidad,
// igual que el resto de integraciones opcionales de este archivo.
export const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID");
// Firma HMAC de las sesiones (clientes y admin) — DEBE venir de una variable de entorno,
// nunca vivir en el código fuente: quien lea este archivo (repo, backup, historial git)
// podría forjar un token válido para cualquier cuenta si estuviera hardcodeada aquí.
// Configúrala con: supabase secrets set SESSION_SECRET=...
// A propósito NO se lanza un throw aquí a nivel de módulo: un throw en este punto tumba
// TODA la función (incluido el manejo de OPTIONS/CORS) para TODAS las acciones, no solo
// las que usan sesión — un solo secreto faltante dejaría sin servicio hasta el catálogo
// público. El chequeo real vive en hmac() (session.ts), donde solo revienta la acción
// que de verdad necesita firmar/verificar un token.
export const SESSION_SECRET = Deno.env.get("SESSION_SECRET");
export const TOKEN_TTL_SECONDS = 30 * 24 * 3600;
export const MAX_LOGIN_ATTEMPTS = 5;
export const LOCKOUT_MINUTES = 15;
// Lo que recibe EL INVITADO al pagar su primer pedido. Subido de 50 a 120 puntos
// (decisión del dueño 2026-08-20): 50 puntos son S/1.25 de valor percibido — nada para
// alguien que todavía no ha pedido nunca, y es justo el lado que tiene que decidir
// comprar. 120 puntos = una bebida gratis (R05), un premio concreto y nombrable ("tu
// primera bebida va por cuenta de quien te invitó"). Cuesta ~S/1.20 de insumo real contra
// un cliente que deja ~S/24 de contribución en 90 días: con que suba la conversión de la
// invitación un 2.7% ya se paga. DEBE coincidir con REFERRAL_BONUS_POINTS en src/app.ts.
export const REFERRAL_BONUS_POINTS = 120;
// Lo que recibe QUIEN INVITA cuando su referido paga su primer pedido (decisión del dueño
// 2026-08-15). Antes ambos lados recibían los mismos 50 puntos — unos S/1.25 de valor, el
// 5% del ticket, muy por debajo del 10-25% que mueve la aguja en esta categoría. Ahora el
// que invita se lleva el equivalente a un SÁNDWICH 15CM GRATIS: 400 puntos, que es
// exactamente el precio de R06 en REWARDS (catalog.ts). Se entrega como puntos y no como
// un cupón aparte a propósito — reusa entero el flujo de canje que ya existe y ya está
// probado, sin inventar un mecanismo nuevo que haya que auditar.
//
// Costo real: el 15CM más barato del catálogo con 45% de insumos ≈ S/6.7-8 por referido
// que de verdad llega a comprar, contra un techo pagable estimado de ~S/9.3. Si REWARDS.R06
// cambia de precio, este número debe seguirlo.
export const REFERRER_REWARD_POINTS = 400;

// #55 — REFERIDOS ESCALONADOS. Premio EXTRA al 3.º, 5.º y 10.º referido convertido, encima
// de los 400 puntos planos de arriba que se siguen pagando por CADA uno.
//
// Por qué escalonado y no plano: el esfuerzo de invitar SUBE con cada referido (los amigos
// fáciles ya están dentro) mientras el premio plano se queda igual, así que casi nadie pasa
// del segundo. Los escalones le ponen una meta concreta al que ya demostró que invita.
//
// Cada escalón vale exactamente una recompensa NOMBRABLE del catálogo (REWARDS en
// catalog.ts), no un número suelto: 120 = R05 (bebida), 400 = R06 (sándwich 15CM), 800 =
// dos 15CM. Un premio que no se puede nombrar no se puede prometer en una notificación.
//
// LO QUE CUESTA, con los números que ya están en este archivo. Un referidor que llega a 10
// conversiones cobra 10×400 + (120+400+800) = 5320 puntos. A la tasa de R06 (400 pts ≈ un
// 15CM ≈ S/6.7-8 de insumo real), son ~S/98, o sea **~S/9.8 por cliente adquirido**.
// Eso queda ~5% POR ENCIMA del techo pagable de ~S/9.3 que estima el comentario de
// REFERRER_REWARD_POINTS, y es deliberado: ese techo se calculó para el referido PROMEDIO,
// y quien trae 10 clientes que pagan no es el promedio. Sigue siendo más barato que el
// CAC medido más bajo de Meta Ads en Perú para restaurantes (S/10.51; techo S/25.23, ver
// modelo/FUENTES.md), que es el único otro canal de adquisición que este negocio tiene.
// En los escalones 3 y 5 —donde estará casi todo el mundo— el costo por cliente ni siquiera
// llega a rozar el techo: S/8.0 y S/8.3.
//
// DEBE coincidir con REFERRAL_MILESTONES en src/app.ts (lo verifica `npm run parity`).
export const REFERRAL_MILESTONES: { count: number; points: number; label: string }[] = [
  { count: 3, points: 120, label: "una bebida de la casa gratis" },
  { count: 5, points: 400, label: "otro sándwich 15CM gratis" },
  { count: 10, points: 800, label: "dos sándwiches 15CM gratis" },
];
// Antes solo un registro CON código de referido recibía puntos al crear cuenta — cualquier
// otro registro nuevo empezaba en 0 sin ningún incentivo de bienvenida.
// Subido de 20 a 40 (hallazgo de auditoría, CRÍTICO): 20 pts no alcanzaba para NINGUNA
// recompensa (la más barata, R02, cuesta 40 — ver REWARDS en catalog.ts), así que todo
// cliente nuevo veía su checkout del primer pedido sin nada canjeable, justo el momento
// de mayor intención de compra. DEBE coincidir con el texto en sPAuth() en src/app.ts.
export const WELCOME_BONUS_POINTS = 40;
export const STALE_MANUAL_PAYMENT_HOURS = 3;

// Rangos por antigüedad (total_orders) — puramente de reconocimiento/pertenencia, NUNCA
// un multiplicador de puntos ni un precio distinto (VIP se retiró como tier justamente
// por eso). DEBE coincidir con RANKS en src/app.ts (ese lado solo lo usa para mostrar el
// chip en el perfil; este es el que de verdad queda guardado en cada pedido —
// customer_rank— y el que exige sigGateError/catalog.ts para el menú secreto).
export const RANKS: { name: string; minOrders: number }[] = [
  { name: "NUEVO", minOrders: 0 },
  { name: "REGULAR", minOrders: 1 },
  { name: "INICIADO", minOrders: 5 },
  { name: "CÍRCULO INTERNO", minOrders: 15 },
  { name: "MESA FUNDADORA", minOrders: 30 },
];
export function computeRankName(totalOrders: number): string {
  let name = RANKS[0].name;
  for (const r of RANKS) if (totalOrders >= r.minOrders) name = r.name;
  return name;
}

// Par de llaves VAPID para Web Push. La pública NO es secreta — vive tal cual en el
// cliente (index.html) para pushManager.subscribe(); debe ser SIEMPRE el mismo par que
// la privada de abajo. La privada sí es un secreto real y se lee de una variable de
// entorno (configúrala con: supabase secrets set VAPID_PRIVATE_KEY=... — nunca la
// pongas directamente en este archivo). Sin ella, el envío de push queda deshabilitado
// mas el resto de la API sigue funcionando con normalidad.
// ⚠️ Reemplaza VAPID_SUBJECT por un mailto: o https: real del negocio antes de
// publicar (los servicios de push lo usan solo para contactarte en caso de abuso).
export const VAPID_PUBLIC_KEY = "BKTQjrOAOBVbt-wG_vUol13SrlwS0FrWppXxgu0velMopQOsIzxHF0hu3BDMSItRVHlan23RQZA6dF3wpbU1rA0";
export const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY");
export const VAPID_SUBJECT = "mailto:contacto@sndwch.com";

// Para mandar el PIN nuevo de recuperación de cuenta por correo en vez de devolverlo
// directo en la respuesta (ver actRecover). Comparte el mismo secreto de proyecto que
// usa la función send-order-email — configúralo con: supabase secrets set RESEND_API_KEY=...
export const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
export const FROM_EMAIL = Deno.env.get("FROM_EMAIL") || "SND//WCH <pedidos@sndwch.app>";

// Publicación real en Instagram/Facebook (Meta Graph API) — ver actAdminPublishSocial en
// actions/social.ts. Los 3 vienen de tu Business Manager de Meta una vez que tengas la
// app de developers.facebook.com con los permisos pages_manage_posts +
// instagram_business_content_publish concedidos a tu propia Página/cuenta (no
// necesariamente requiere App Review si el token se genera con tu propio login como
// admin de esos activos — App Review solo es obligatorio para publicar en Páginas/
// cuentas que NO son tuyas). Configúralos con:
//   supabase secrets set META_PAGE_ACCESS_TOKEN=... META_PAGE_ID=... META_IG_USER_ID=...
// Sin ellos, actAdminPublishSocial devuelve un error claro (no hay throw a nivel de
// módulo, mismo criterio que el resto de integraciones opcionales de este archivo) — el
// calendario de contenido y el resto de la app funcionan igual sin esto configurado.
export const META_PAGE_ACCESS_TOKEN = Deno.env.get("META_PAGE_ACCESS_TOKEN");
export const META_PAGE_ID = Deno.env.get("META_PAGE_ID");
export const META_IG_USER_ID = Deno.env.get("META_IG_USER_ID");
export const META_GRAPH_VERSION = "v21.0";
// Píxel de Meta + Conversions API (medición de campañas). Opcionales e independientes de
// la publicación en redes de arriba: mientras no existan, la app no carga ningún píxel y
// el servidor no manda ningún evento — no hay medición, pero nada se rompe.
//   supabase secrets set META_PIXEL_ID=... META_CAPI_TOKEN=...
// META_PIXEL_ID además viaja al cliente por get-store-hours (es público por diseño: el
// píxel se ve en el HTML de cualquier sitio que lo use). META_CAPI_TOKEN NUNCA sale del
// servidor.
export const META_PIXEL_ID = Deno.env.get("META_PIXEL_ID");
export const META_CAPI_TOKEN = Deno.env.get("META_CAPI_TOKEN");

// Identidad legal del negocio — persona natural con negocio (RUC 10). Usada en el
// Libro de Reclamaciones (obligatorio por el Código de Protección y Defensa del
// Consumidor / INDECOPI) y en el correo de notificación de reclamos al negocio.
export const BUSINESS_LEGAL_NAME = "Ezra Kemish Vertiz Labarrera";
export const BUSINESS_RUC = "10736044523";
export const BUSINESS_CITY = "Trujillo, Perú";
export const CONTACT_EMAIL = "contacto@sndwch.com";

// Horario de atención — debe reflejar EXACTAMENTE el mismo horario que STORE_HOURS en
// index.html (usado ahí solo para el badge visual; aquí se usa para rechazar pedidos
// programados fuera de horario, que el cliente podría forzar sin este chequeo).
export const STORE_HOURS: Array<[number, number] | null> = [
  [11, 22], null, [11, 22], [11, 22], [11, 22], [11, 22], [11, 22],
];
// Zonas de Trujillo que hoy NO se cubren con delivery — el checkout las rechaza si el
// texto de la dirección las menciona (comparación por substring, sin acentos/mayúsculas;
// ver assertAddressAllowed en orders.ts). No hay geocerca real: depende de que el
// cliente escriba el nombre del distrito/zona. DEBE coincidir con
// DELIVERY_EXCLUDED_ZONES en src/app.ts.
export const DELIVERY_EXCLUDED_ZONES = ["el milagro", "el porvenir"];
// El delivery se cobra ahora dentro del mismo pago del pedido (antes se coordinaba aparte,
// pagado directo al motorizado sin ningún monto fijo) — el cliente elige su zona
// aproximada en el checkout (por defecto "media", sin exigir GPS) y esto se suma al total
// que de verdad se cobra (Culqi/Yape/Plin/crédito). El dueño sigue pagando al motorizado
// por fuera de la app, igual que siempre — esto solo asegura que el cliente vea y pague
// un monto real, no un rango. DEBE coincidir con DELIVERY_PRICE_ZONES en src/app.ts.
export const DELIVERY_ZONE_FEES: Record<string, number> = {
  cerca: 6,
  media: 8,
  lejos: 12,
  muy_lejos: 15,
};
// ── COBRO DEL DELIVERY POR DISTANCIA REAL (2026-09-02) ────────────────────────────────
//
// POR QUÉ CAMBIÓ. El motorizado —un tercero con 50+ repartidores, coordinado por WhatsApp—
// cobra S/2 POR KILÓMETRO. La app cobraba un monto plano por ZONA que elegía el cliente en
// un desplegable, con "media" por defecto. O sea: el cliente elegía su propio precio de
// envío, y elegir el más barato no le costaba nada. El pin del mapa existía pero solo
// AVISABA del desajuste; el cobro seguía saliendo de la zona elegida.
//
// El dueño creía que la app ya cobraba por distancia. No lo hacía. Ahora sí.
export const DELIVERY_KM_RATE = 2;      // [MEDIDO] dueño 2026-09-02: S/2 por km del tercero
// La distancia que se puede calcular sin depender de nadie es la de LÍNEA RECTA entre el
// punto de despacho y el pin del cliente. La ruta real en moto siempre es más larga (calles,
// sentidos, óvalos). 1.3 es el factor de corrección de ciudad acordado con el dueño
// [DECISIÓN 2026-09-02] — se prefirió sobre una API de ruteo real porque esa tiene costo por
// consulta y una cuenta que contratar, y porque un factor editable se calibra contra lo que
// los motorizados cobran de verdad.
export const DELIVERY_ROAD_FACTOR = 1.3;
// Piso de la tarifa. A S/2/km, alguien a 800 m pagaría S/1.60 y ningún motorizado toma ese
// viaje. [MEDIDO] dueño 2026-09-02: el mínimo que le cobra su grupo por un viaje corto es
// S/5. Por debajo de 2.5 km, entonces, la tarifa la fija este piso y no los kilómetros.
export const DELIVERY_MIN_FEE = 5;
// Punto de despacho — mismas coordenadas que STORE_LAT/STORE_LON en el cliente, que ya se
// usaban para el banner "estás cerca". `npm run parity` compara los dos lados.
export const STORE_LAT = -8.139599;
export const STORE_LON = -79.039458;
// Techo de cobertura. Más allá de esto no se entrega: sin un tope, un pin mal puesto (o una
// dirección en otra ciudad) generaría una tarifa absurda que el cliente vería en el checkout.
export const DELIVERY_MAX_KM = 12;
// El delivery es pass-through puro (arriba): el negocio no gana nada con él, solo lo
// cobra para pagarle exacto al motorizado. Pero cuando se paga con TARJETA, Culqi
// descuenta su comisión (~4-5.5%, confirmado por el dueño) del cargo COMPLETO, incluido
// este monto — el negocio terminaba recibiendo menos de lo que igual le pagaba al
// motorizado por fuera (hallazgo de auditoría financiera). Se usa el extremo alto del
// rango confirmado (5.5%) para el "gross-up" en vez del promedio, así el pass-through
// queda cubierto incluso en el peor caso real de comisión — ver deliveryFeeForZoneCard
// en actions/orders.ts (SOLO se aplica en el flujo de tarjeta/actPrepareOrder; Yape/Plin/
// crédito no pagan esta comisión y siguen cobrando el fee real sin ajustar). DEBE
// coincidir con CULQI_FEE_RATE en src/app.ts (ese lado solo estima el total antes de
// pagar; este es el que de verdad determina cuánto se cobra).
export const CULQI_FEE_RATE = 0.055;

// Tope de pedidos por hora de entrega. Vivía en actions/orders.ts, pero desde que
// `get-store-hours` le dice al cliente qué franjas están llenas (#23) hacen falta los dos
// lados, y hours.ts no puede importar de orders.ts sin crear un ciclo. Debe coincidir con
// MAX_ORDERS_PER_HOUR en src/app/ — lo verifica `npm run parity`.
//
// Subido de 6 a 10 (2026-08-15) al conocer el método de trabajo real: la cocción se hace
// por TANDAS 1-2 veces por semana y en hora de servicio cada pedido es solo ARMAR el
// sándwich (~4-5 min con todo en mise en place), no cocinar desde cero. Además el dueño
// NUNCA reparte: el motorizado es aparte, así que armar no compite con salir a entregar.
// El 6 anterior suponía un ciclo cocinar+repartir que no es el de este negocio, y con la
// meta de ~20 pedidos/día concentrados en dos ventanas habría empezado a rechazar pedidos
// reales un viernes por la noche.
export const MAX_ORDERS_PER_HOUR = 10;

// Cuánto suma al estimado de entrega cada pedido que ya está en cola por delante (#16).
// Sale del mismo dato que el tope de arriba: armar un sándwich con el mise en place hecho
// toma ~4-5 minutos, así que cada pedido delante corre la entrega unos 5.
//
// El estimado que se ve ANTES de pagar era un rango fijo (25-40 min) que no miraba la
// cola: con 8 pedidos por delante prometía lo mismo que con la cocina vacía. Un ETA que
// miente es la causa directa de una calificación de 1 estrella, y la calificación baja
// cuesta más que la venta que se pierde por avisar que hoy hay demora.
export const QUEUE_MINUTES_PER_ORDER = 5;

// #30 — Palabras que convierten una nota del cliente en un asunto de SEGURIDAD, no de
// preferencia. El campo de notas es texto libre y se usa sobre todo para referencias de
// dirección ("portón azul", "3er piso"): una alergia escrita ahí se pinta igual que el
// portón y se pierde entre lo demás, justo mientras se arma el pedido con las manos
// ocupadas.
//
// La lista es DELIBERADAMENTE corta y de lenguaje de restricción, no de ingredientes. Meter
// cada alérgeno ("maní", "huevo", "leche") haría saltar la alerta con "sin cebolla" y con
// cualquier receta que los nombre — y una alarma que salta siempre deja de mirarse, que es
// exactamente lo que esto viene a evitar. Un "sin cebolla" sigue mostrándose como nota
// normal: es una preferencia, no un riesgo.
//
// DEBE coincidir con NOTE_ALERT_WORDS en src/app/ — lo verifica `npm run parity`.
// Tope de notificaciones push por corrida de cron. Vivía en actions/customer.ts, pero desde
// que el recordatorio de pedido programado al cliente (#27) también manda push desde
// orders.ts hacen falta los dos lados — y son el mismo tope, no dos.
//
// Existe porque los crons leían hasta 20 000 clientes y enviaban en serie dentro de una sola
// invocación: con varios cientos, la función se cortaba a mitad por tiempo y la cola no
// recibía nada ese día, en silencio. Lo que sobra se atiende en la corrida siguiente (las
// ventanas de elegibilidad son de varios días) y llegar al tope queda en debug_logs.
export const MAX_PUSH_PER_RUN = 200;

export const NOTE_ALERT_WORDS = ["alergi", "alérgi", "intoleran", "celiac", "celíac", "gluten", "lactosa", "diabet"];

// Compara sin acentos ni mayúsculas: quien escribe "ALERGICO" desde el teclado del celular
// no debería recibir menos cuidado que quien escribe "alérgico".
export function noteNeedsAttention(notes: string | null | undefined): boolean {
  const n = String(notes || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return NOTE_ALERT_WORDS.some((w) => n.includes(w.normalize("NFD").replace(/[\u0300-\u036f]/g, "")));
}
// d.getHours()/getDay()/getFullYear() usan la zona horaria del SERVIDOR (Deno Deploy
// corre en UTC), no la de Perú (UTC-5) — así fue como "cierra a las 22:00" se aplicaba
// como si cerrara a las 17:00 hora Perú (hallazgo en vivo tras activar Culqi: el cobro
// pasaba en Culqi y recién el servidor rechazaba el pedido después). Este helper
// centraliza la conversión a America/Lima para que cualquier decisión de negocio basada
// en fecha/hora (horario de atención, mes del reto de recurrencia, etc.) la use en vez
// de reinventar la conversión — y así no se repita el mismo bug en otro lugar.
function limaFields(d: Date): { year: number; month: number; day: number; weekday: number; hour: number; minute: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Lima",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    weekday: "short",
    hour: "numeric",
    minute: "numeric",
    hourCycle: "h23",
  }).formatToParts(d);
  const get = (type: string) => parts.find((p) => p.type === type)!.value;
  const WEEKDAY_INDEX: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return {
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
    weekday: WEEKDAY_INDEX[get("weekday")],
    hour: Number(get("hour")),
    minute: Number(get("minute")),
  };
}

export function isWithinStoreHours(d: Date): boolean {
  const f = limaFields(d);
  const range = STORE_HOURS[f.weekday];
  if (!range) return false;
  const h = f.hour + f.minute / 60;
  return h >= range[0] && h < range[1];
}

// "YYYY-MM" del mes en curso en hora de Lima — usado por el reto mensual
// (actClaimChallenge) para no repetir el mismo bug de zona horaria que tenía
// isWithinStoreHours (el mes servidor-UTC puede ir 5h adelantado del mes real en Lima
// cerca de fin de mes).
export function limaMonthKey(d: Date): string {
  const f = limaFields(d);
  return f.year + "-" + String(f.month).padStart(2, "0");
}
// Instante UTC real que corresponde a la medianoche del día 1 del mes (hora Lima) —
// Lima es UTC-5 sin horario de verano, así que medianoche Lima = 05:00 UTC.
export function limaMonthStartIso(d: Date): string {
  const f = limaFields(d);
  return new Date(Date.UTC(f.year, f.month - 1, 1, 5, 0, 0)).toISOString();
}
// Igual que limaMonthStartIso pero para el inicio del día actual (hora Lima) — usado por
// el recordatorio de hora pico para no volver a avisarle a quien ya pidió hoy.
export function limaDayStartIso(d: Date): string {
  const f = limaFields(d);
  return new Date(Date.UTC(f.year, f.month - 1, f.day, 5, 0, 0)).toISOString();
}

// #65 — El MES PASADO completo, en hora Lima, más su clave AAAAMM.
//
// Existe separado de limaMonthStartIso porque el resumen mensual habla del mes que YA
// terminó, no del que corre: se manda los primeros días del mes siguiente, cuando el mes
// del que habla ya está cerrado y sus números no van a cambiar. Calcularlo con
// `getMonth()-1` a mano se rompe en enero (mes -1) y desfasa cinco horas en cada frontera
// de mes, que es justo cuando este cron corre.
export function limaPrevMonthRange(d: Date): { startIso: string; endIso: string; ym: number } {
  const f = limaFields(d);
  const year = f.month === 1 ? f.year - 1 : f.year;
  const month = f.month === 1 ? 12 : f.month - 1;
  return {
    // Medianoche Lima del día 1 del mes pasado = 05:00 UTC de ese día.
    startIso: new Date(Date.UTC(year, month - 1, 1, 5, 0, 0)).toISOString(),
    // Fin exclusivo: medianoche Lima del día 1 del mes en curso.
    endIso: new Date(Date.UTC(f.year, f.month - 1, 1, 5, 0, 0)).toISOString(),
    ym: year * 100 + month,
  };
}

// Igual que loadCatalogPrices (catalog.ts) — una tabla (store_hours) sobreescribe estos
// valores hardcodeados EN EL MISMO ARRAY (nunca reasignando el binding `const`), así que
// cambiar el horario desde el panel admin ya no exige editar código y redesplegar. Si la
// tabla está vacía o falla la lectura, el horario hardcodeado de arriba sigue de respaldo.
export async function loadStoreHours(): Promise<void> {
  try {
    const { sbGet } = await import("./db.ts");
    const rows = await sbGet("store_hours", "select=weekday,open_hour,close_hour,closed");
    for (const row of rows) {
      const idx = Number(row.weekday);
      if (!Number.isInteger(idx) || idx < 0 || idx > 6) continue;
      STORE_HOURS[idx] = row.closed ? null : [Number(row.open_hour), Number(row.close_hour)];
    }
  } catch (e) {
    console.error("loadStoreHours failed:", e);
  }
}
