// SND//WCH — api / env
// Todas las variables de entorno y constantes de negocio del backend, centralizadas en
// un solo lugar en vez de estar dispersas (y a veces repetidas) por todo index.ts.
import { REGLAS } from "../_shared/dinero.ts";

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
// Entrar con correo y código de 6 dígitos (2026-09-23). Los cuatro números salen de lo que
// la pantalla promete y de lo que un código de 6 dígitos aguanta:
//   · 10 min de vida — largo para buscar el correo, corto para que un código viejo no sirva.
//   · 5 intentos — 5 de 10^6 es ruido; el sexto mata el código y hay que pedir otro.
//   · 60 s entre envíos — sin esto el botón es un generador gratuito de correos a cualquiera.
//   · 15 min de prueba de correo — lo que dura la pantalla de "completa tu cuenta".
// ── DOS PRODUCTOS APAGADOS PARA LA APERTURA (dueño, 2026-09-23) ─────────────────────
// Los dos por el MISMO motivo: le piden al cliente plata o puntos POR ADELANTADO antes de
// que conozca el negocio, y eso convierte pésimo en un local que todavía no abre.
//
//   · PLAN SEMANAL — «no es útil aún». Además el 5% de bonificación se paga por un flote de
//     semanas, y el cron `remind-unused-credit` existe justamente porque ese crédito se
//     queda durmiendo. Un prepago al que hay que recordarle a la gente que lo gaste no está
//     reteniendo a nadie.
//   · TARJETA DE REGALO — cuesta PUNTOS (S/50 = 2 000 puntos, cinco sándwiches gratis de por
//     medio) y exige que el destinatario YA tenga cuenta. Hoy es inalcanzable para un
//     cliente nuevo, que es justo a quien la pantalla se la ofrece.
//
// NO SE BORRA NADA. Las acciones, las tablas y `create-credit-charge` siguen enteras: los
// dos vuelven cuando haya clientes que repitan y tengan puntos. Apagar es reversible;
// borrar, no. El apagado va en el SERVIDOR y no solo en el cliente — una pantalla oculta
// sigue siendo una acción llamable.
//
// ⚠ Si algún día se vuelven a prender, hay que prender TAMBIÉN su gemelo en
// `src/app/01-catalogo-y-estado.ts`, o la pantalla ofrece algo que el servidor rechaza.
export const PLAN_SEMANAL_ACTIVO = false;
export const TARJETA_REGALO_ACTIVA = false;

export const LOGIN_CODE_TTL_MINUTES = 10;
export const LOGIN_CODE_MAX_ATTEMPTS = 5;
export const LOGIN_CODE_COOLDOWN_SECONDS = 60;
export const EMAIL_PROOF_TTL_SECONDS = 15 * 60;
// Lo que recibe EL INVITADO al pagar su primer pedido: exactamente lo que cuesta una
// BEBIDA GRATIS (R05 en catalog.ts), que es la decisión real del dueño del 2026-08-20 —
// 120 puntos entonces, porque entonces R05 costaba 120. El número es la implementación;
// la decisión es "su primera bebida va por cuenta de quien lo invitó".
//
// ⚠ ESTUVO OCHO DÍAS ROTO Y NADIE SE ENTERÓ. El 2026-09-05 la recalibración de puntos
// subió R05 de 120 a 160 y este literal se quedó en 120, así que el invitado recibía un
// bono que NO alcanzaba para la bebida que la app, el perfil y el texto de WhatsApp que
// el dueño copia a Instagram le prometían los tres. Peor que desactualizado: 120 caía en
// tierra de nadie — por encima de la salsa extra (20) y por debajo de todo lo demás
// (160), o sea que el invitado no podía canjear NADA de lo que se le dijo. Y ese lado es
// justo el que tiene que decidir comprar sin haber pedido nunca.
//
// El comentario de REFERRER_REWARD_POINTS acá abajo describe este defecto exacto, palabra
// por palabra, para el otro lado del referido — y ese sí estaba protegido por
// `npm run parity`. Este no. Ahora sí: hay una comprobación que lo ata a R05.
//
// Costo real: honrar R05 cuesta ~S/2.34 de insumo contra un cliente que deja ~S/24 de
// contribución en 90 días. Subirlo de 120 a 160 NO cuesta más — el premio siempre fue la
// misma bebida; lo que cambió fue su etiqueta de precio en puntos.
// DEBE coincidir con REFERRAL_BONUS_POINTS en src/app/01-*.
export const REFERRAL_BONUS_POINTS = 160;
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
//
// ⚠ `covers`/`veces` NO son decoración: dicen QUÉ recompensa nombra cada etiqueta, y son lo
// que permite comprobar que el escalón alcanza para pagarla. El chequeo anterior de
// `npm run parity` solo exigía que los puntos fueran múltiplo de ALGUNA recompensa — y
// `120 % 20 === 0`, así que el primer escalón pasaba como "seis salsas extra" mientras su
// etiqueta prometía una bebida que costaba 160. Es el mismo defecto que tuvo
// `REFERRAL_BONUS_POINTS` y viene del mismo día: la recalibración del 2026-09-05 subió R05 de
// 120 a 160 y estos dos números se quedaron atrás. Un chequeo que acepta cualquier múltiplo
// no verifica la promesa, verifica la aritmética.
export const REFERRAL_MILESTONES: { count: number; points: number; label: string; covers: string; veces: number }[] = [
  { count: 3, points: 160, label: "una bebida de la casa gratis", covers: "R05", veces: 1 },
  { count: 5, points: 400, label: "otro sándwich 15CM gratis", covers: "R06", veces: 1 },
  { count: 10, points: 800, label: "dos sándwiches 15CM gratis", covers: "R06", veces: 2 },
];
// Antes solo un registro CON código de referido recibía puntos al crear cuenta — cualquier
// otro registro nuevo empezaba en 0 sin ningún incentivo de bienvenida.
// Subido de 20 a 40 (hallazgo de auditoría, CRÍTICO): 20 pts no alcanzaba para NINGUNA
// recompensa (la más barata entonces, R02, costaba 40 — hoy cuesta 20 tras la
// recalibración del 2026-09-05; ver REWARDS en catalog.ts), así que todo
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

// Clave de Google Maps (Places + Geocoding + mapa) para el buscador de dirección del
// checkout. Viaja al cliente por get-store-hours igual que META_PIXEL_ID, y por la misma
// razón: es una clave de NAVEGADOR, pública por diseño — quien abra la app la ve en el
// código. Lo que la protege no es el secreto sino la RESTRICCIÓN POR REFERRER que hay que
// configurar en Google Cloud Console (solo https://sndwch.app/*): sin eso, cualquiera
// puede usarla y el consumo lo paga el dueño.
//
// Mandarla desde el servidor y no escribirla en el cliente permite además prenderla y
// apagarla sin redesplegar el cliente. **Si no está, el mapa cae solo a OpenStreetMap** —
// que es gratis, menos preciso y sigue funcionando. Un checkout roto por una clave vencida
// sería mucho peor que un geocodificador mediocre.
export const GOOGLE_MAPS_KEY = Deno.env.get("GOOGLE_MAPS_KEY");
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
// ── RECARGO POR PAN DE FOCACCIA (2026-09-03) ──────────────────────────────────────────
//
// El tipo de pan era una elección GRATUITA del cliente, y la focaccia cuesta más que el pan
// sub. Hasta hoy ese sobrecosto salía entero del margen sin que el cliente pagara nada por
// elegirla, y no se podía ni medir porque faltaba el rendimiento de la focaccia.
//
// [MEDIDO] dueño 2026-09-03: de una focaccia de S/13 salen 10 sándwiches de 15CM o 5 de
// 30CM. O sea S/1.30 y S/2.60 por sándwich, contra S/1.00 y S/2.00 del pan sub:
// **+S/0.30 en 15CM y +S/0.60 en 30CM** de sobrecosto real.
//
// [DECISIÓN] dueño 2026-09-03: se cobra S/0.50 y S/1.00. Cubre el sobrecosto con holgura y
// deja la focaccia como lo que es —una opción premium— en vez de una fuga silenciosa.
//
// Solo B03 lleva recargo; B01 (Classic) es el pan sub y no cambia. El valor vive en UN solo
// sitio, el módulo de dinero que comparten el cliente y el servidor (_shared/dinero.ts).
export const BASE_SURCHARGE = REGLAS.recargoPan;

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

// La hora de llegada que se PROMETE al pagar (pantallas 30 G2, 31, 06 y el «prometimos» del
// detalle). Antes solo existía cuando el pedido salía EN CAMINO: el cliente pagaba sin ver
// ninguna hora y el detalle no tenía contra qué comparar «llegó dentro». Ahora se fija al
// crear el pedido y se guarda (`promised_from`/`promised_to`), así lo prometido queda escrito
// y no se recalcula después con otra cola.
//
// Pedido para ya: ahora + el rango de siempre + lo que suma la cola. Programado: la hora que
// eligió, con el mismo ancho de ventana. DEBE coincidir con ESTIMATED_DELIVERY_RANGE en
// src/app/01-* — lo verifica `npm run parity`.
export const ESTIMATED_DELIVERY_RANGE = [25, 40];

export function ventanaPrometida(
  ahoraMs: number,
  colaDelante: number,
  programadoPara?: string | null,
): { desde: string; hasta: string } {
  const MIN = 60000;
  const ancho = ESTIMATED_DELIVERY_RANGE[1] - ESTIMATED_DELIVERY_RANGE[0];
  const prog = programadoPara ? Date.parse(programadoPara) : NaN;
  if (Number.isFinite(prog)) {
    return { desde: new Date(prog).toISOString(), hasta: new Date(prog + ancho * MIN).toISOString() };
  }
  const extra = Math.max(0, Math.floor(Number(colaDelante) || 0)) * QUEUE_MINUTES_PER_ORDER;
  return {
    desde: new Date(ahoraMs + (ESTIMATED_DELIVERY_RANGE[0] + extra) * MIN).toISOString(),
    hasta: new Date(ahoraMs + (ESTIMATED_DELIVERY_RANGE[1] + extra) * MIN).toISOString(),
  };
}

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
export function limaFields(d: Date): { year: number; month: number; day: number; weekday: number; hour: number; minute: number } {
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

// ── LOS SUPUESTOS DEL MODELO FINANCIERO, EN UN SOLO SITIO (2026-09-06) ─────────────────
//
// `PREDICCION_V12.md` concluye que la meta de S/5,000 netos sostenidos se decide por TRES
// números, y que ninguno estaba medido. Ahora `retention_report` los mide (ver la migración
// `retention_report_mide_las_tres_palancas_del_modelo`), y estos son los valores que el
// modelo ASUME — lo que la pantalla necesita para poder decir "vas mejor" o "vas peor" en
// vez de solo enseñar un porcentaje suelto.
//
// ⚠ VIVEN ACÁ Y NO EN EL CLIENTE A PROPÓSITO. Un número escrito a mano en la pantalla se
// desincroniza del modelo el día que el modelo cambie, sin que nada falle — que es
// exactamente el defecto que este repo ya documenta para los textos de marketing. La
// pantalla los recibe del servidor y nunca los escribe.
//
// ⚠ DEBEN COINCIDIR CON EL PYTHON: `FRAC_BYO` y `DRINK_ATTACH` en
// `modelo/comparativa_menu.py`, y `VIRAL` en `modelo/modelo_v11_metas.py`. Lo verifica
// `npm run parity`, que es la única defensa contra que estas dos copias se separen.
export const MODELO_SUPUESTOS = {
  // Fracción de sándwiches armados en ARMA EL TUYO. Un armado deja ~S/5.50 menos que un
  // Signature, así que mover esto 15 puntos mueve la contribución casi un sol.
  byoPct: 50,
  // Fracción de pedidos que llevan bebida. Es la palanca más barata de las tres: no exige
  // adquirir a nadie y las bebidas están al 19-32% de costo.
  drinkPct: 25,
  // Clientes captados por referido, por cada 100 pedidos servidos. Es la palanca que
  // convierte "no llega nunca" en "sostiene desde feb-27": el referido cuesta S/7.65
  // contra S/17.87 del CAC pagado.
  referralsPer100: 6,
};

// ⚠ LO QUE EL MODELO ASUME NO ES LO QUE EL PLAN NECESITA, y confundirlos es el defecto que
// esto cierra (2026-09-13). La pantalla comparaba la medición SOLO contra `MODELO_SUPUESTOS`,
// que es el punto de partida del modelo — así que ver "8 referidos por 100" contra un supuesto
// de 6 se lee como *vamos bien*, cuando el plan que llega a S/3,000 netos en el mes 3 necesita
// **25**. Un tablero que da por bueno el punto de partida no empuja a ningún lado.
//
// Son dos números distintos y los dos son ciertos: uno es de dónde parte el modelo, el otro es
// a dónde hay que llegar. Se muestran juntos por el mismo criterio que los dos techos de CAC —
// colapsarlos escondería cuál se contestó.
//
// [DECISIÓN] Valores de `PREDICCION_V14.md`, escenario que alcanza 80% de probabilidad.
export const MODELO_OBJETIVOS = {
  byoPct: 35,          // 65/35 hacia Signature
  drinkPct: 40,        // +15 puntos de attach valen ~S/0.48 por pedido
  referralsPer100: 25, // la palanca que convierte "no llega" en "llega"
};

// ── EL TECHO DE CAC — hasta cuánto se puede pagar por un cliente ───────────────────────
//
// POR QUÉ EXISTE. `PREDICCION_V12.md` concluye que la meta NO se alcanza con más publicidad,
// y todo eso cuelga de un CAC que **nadie midió**: sale de tasas de agencia (CPM S/5-12,
// CTR 2.97%, CVR 1.89%) que dan un rango de S/10.51 a S/25.23. Esa horquilla es la distancia
// entre "la publicidad sostiene el negocio" y "lo desangra", así que gastar sin medirla es
// apostar, no invertir.
//
// ⚠ EL DATO QUE OBLIGA A QUE ESTO EXISTA: con el CPM medio el CAC es **S/17.87** y la
// contribución del primer pedido es **S/13.63**. O sea que al CPM medio un cliente comprado
// NO se paga a sí mismo con su primer pedido — se recupera recién si vuelve. Eso puede estar
// bien (casi todo el delivery funciona así) pero solo si la repetición existe DE VERDAD, y
// hoy no está medida. El freno no dice "no hagas publicidad": dice cuánto estás apostando a
// una repetición que todavía no viste.
//
// Los cuatro números salen de `modelo/modelo_v11.py` y **`npm run parity` los verifica
// corriendo el Python**, no comparando contra una copia. Es el segundo chequeo del script que
// cruza lenguajes, por el mismo motivo que el primero: la pantalla no puede medir contra una
// meta que el modelo ya movió.
export const CAC_TECHO = {
  // [DERIVADO] `CONTRIB_PEDIDO` — contribución por pedido con la mezcla que el modelo asume
  // (mitad ARMA EL TUYO). NO es el 16.42 de los Signatures solos.
  contribPedido: 14.13,
  // [MÉTODO] `OVERHEAD_POR_PEDIDO` — gas, frío y coordinación, aparte del insumo.
  overheadPedido: 0.5,
  // [MEDIDO] `COSTO_REFERIDO` — el insumo del 15CM de R06 + la bebida de R05. Es el canal
  // alternativo, y el número contra el que hay que comparar cualquier CAC pagado.
  costoReferido: 7.65,
  // [PLATAFORMA] Regla oficial de Meta: un conjunto de anuncios necesita ~50 conversiones
  // cada 7 días para salir de la fase de aprendizaje. Por debajo de eso el CAC medido es
  // ruido caro, no una medición — y avisarlo importa tanto como el techo mismo.
  convAprendizaje7d: 50,

  // ── CUÁNTAS VECES PIDE UN CLIENTE CAPTADO (2026-09-13) ────────────────────────────────
  // [FUENTE] Genesys, delivery de comida: solo el **45%** de los clientes nuevos vuelve a
  // pedir (la "brecha del segundo pedido"); de los que hacen un 2.º, **~85%** hace un 3.º;
  // pasado el 3.º, **60%** sigue. La cadena da 2.41 pedidos por cliente.
  //
  // Es una cadena explícita a propósito: se puede discutir número por número. El modelo del
  // repo llegaba a 2.20 por un ajuste sBG sobre OTRAS fuentes — dos derivaciones
  // independientes dentro del 10%, que es lo más cerca de una validación a la que se puede
  // llegar sin datos propios.
  reordena2do: 0.45,
  reordena3ro: 0.85,
  reordenaSiguiente: 0.60,

  // [DECISIÓN] dueño 2026-09-13. Cuánto de ese valor de vida se acepta como techo. NO es 1
  // porque la repetición de ESTE negocio no está medida: 2.41 sale de industria. Con 0.75 se
  // exige que tres cuartos del dato prestado se cumplan antes de gastar contra él.
  confianzaValorVida: 0.75,
};

// El techo duro: lo que deja un cliente en su PRIMER pedido. Se deriva, nunca se escribe.
//
// Se eligió el primer pedido y no el valor de vida a propósito. Un techo con repetición
// exige asumir cuántas veces vuelve un cliente, y ese número hoy NO está medido — asumirlo
// daría un techo generoso construido sobre fe, que es exactamente la clase de dato con
// aspecto de medición que este repo evita. Por encima de este techo el negocio está
// apostando a la repetición; por debajo, el cliente ya se pagó solo.
export function cacTechoPrimerPedido(): number {
  return Math.round((CAC_TECHO.contribPedido - CAC_TECHO.overheadPedido) * 100) / 100;
}

/** [DERIVADO] Cuántos pedidos hace un cliente captado, sumando la cadena de reórdenes.
 *  1 + 0.45 + 0.45·0.85 + esa cola geométrica al 60%. Da 2.41. */
export function pedidosPorCliente(): number {
  const { reordena2do: p2, reordena3ro: p3, reordenaSiguiente: pn } = CAC_TECHO;
  const tercero = p2 * p3;
  // La cola después del 3.º es geométrica de razón `pn`; su suma cerrada evita truncarla a
  // un número de pedidos elegido a ojo.
  return Math.round((1 + p2 + tercero / (1 - pn)) * 100) / 100;
}

/** ⚠ EL TECHO CON EL QUE DECIDE EL FRENO DESDE EL 2026-09-13 — corrección del dueño.
 *
 *  El techo del PRIMER pedido (S/13.63) era correcto mientras la publicidad se juzgara como
 *  un gasto que tiene que pagarse solo de inmediato. Pero la decisión del dueño es tratarla
 *  como **reinversión**, y contra ese criterio el techo de un pedido apaga la publicidad
 *  SIEMPRE: el CAC de Meta arranca por encima de S/13.63 en todo el rango, así que el freno
 *  cortaba el único canal de adquisición que existe y el negocio se quedaba clavado.
 *
 *  El techo correcto para reinvertir es lo que deja el cliente COMPLETO: 2.41 pedidos ×
 *  S/13.63 ≈ S/33, recortado por `confianzaValorVida` porque la repetición de este negocio
 *  todavía no está medida. A 0.75 da ~S/25.
 *
 *  Los DOS se siguen calculando y la pantalla muestra los dos: el del primer pedido dice
 *  "este cliente ya se pagó hoy" y el del valor de vida dice "se paga si vuelve como vuelve
 *  la industria". Son preguntas distintas y colapsarlas en una escondería cuál se contestó.
 */
export function cacTechoValorVida(): number {
  return Math.round(
    pedidosPorCliente() * (CAC_TECHO.contribPedido - CAC_TECHO.overheadPedido)
    * CAC_TECHO.confianzaValorVida * 100,
  ) / 100;
}
