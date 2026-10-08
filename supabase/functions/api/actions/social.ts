// SND//WCH — api / actions/social
// Publicación real en Instagram/Facebook vía Meta Graph API — la única pieza del sistema
// de marketing que de verdad sale de la app sin copiar/pegar a mano. Todo lo demás
// (marketingContent()) sigue siendo "nada se publica solo" a propósito; esto es la
// excepción, y solo para los canales instagram/facebook de una entrada del calendario
// que ya tiene foto o video subido.
//
// Reels/video (2026-07-30): el dueño sube clips crudos una vez por semana
// (actAdminUploadRawVideo, cola en content_uploads) y una sesión programada aparte los
// procesa (recorte de formato/combinación vía Adobe, caption on-brand) y crea entradas
// de marketing_calendar con media_type='video' y status='scheduled' (mismo estado que ya
// usaba el flujo manual para "programado, no publicado todavía") — esta función no hace
// ese procesamiento, solo publica lo que ya llega listo. El cron auto-publish-calendar
// (cron.job en Supabase, cada 15 min) publica solas las entradas 'scheduled' cuya fecha
// ya llegó, sin que nadie toque "Publicar ahora" a mano.
import { sbGet, sbUpdate, sbInsert, storageUpload, leer, rpc } from "../db.ts";
import { ApiError } from "../types.ts";
import { requireAdmin, verifyCronSecret } from "../session.ts";
import { logAdminAction } from "../logging.ts";
import { SB_URL, META_PAGE_ACCESS_TOKEN, META_PAGE_ID, META_IG_USER_ID, META_GRAPH_VERSION, META_AD_ACCOUNT_ID, META_ADS_TOKEN } from "../env.ts";
import type { Entrada, Salida } from "../../_shared/contrato.ts";
import { fechaLima } from "../franja.ts";

const IMAGE_MAX_BYTES = 4 * 1024 * 1024;
const IMAGE_MIME_EXT: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
// Bucket público — Meta lo descarga directo desde sus servidores (image_url/video_url),
// así que tanto las fotos como el video ya procesado y listo para publicar viven acá.
const MARKETING_IMAGES_BUCKET = "marketing-images";
const RAW_VIDEO_MAX_BYTES = 20 * 1024 * 1024;
const VIDEO_MIME_EXT: Record<string, string> = { "video/mp4": "mp4", "video/quicktime": "mov" };
// Bucket PRIVADO — a diferencia de marketing-images, esto es material sin procesar
// todavía que nunca llega directo a Meta; solo lo lee la sesión de procesamiento semanal.
const RAW_UPLOADS_BUCKET = "content-uploads-raw";

export async function actAdminCalendarUploadImage(b: Entrada<"admin-calendar-upload-image"> & { _ip?: string }) {
  const s = await requireAdmin(b.token);
  const id = String(b.id || "").trim();
  const mime = String(b.mime || "");
  const imageBase64 = String(b.imageBase64 || "");
  if (!id || !imageBase64) throw new ApiError("Faltan datos de la imagen.", 400);
  const ext = IMAGE_MIME_EXT[mime];
  if (!ext) throw new ApiError("Formato de imagen no soportado — usa JPG, PNG o WEBP.", 400);

  const existing = await sbGet("marketing_calendar", `id=eq.${encodeURIComponent(id)}&select=id,title`);
  if (!existing.length) throw new ApiError("Entrada de calendario no encontrada.", 404);

  let bytes: Uint8Array;
  try {
    const bin = atob(imageBase64);
    bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  } catch {
    throw new ApiError("Imagen inválida.", 400);
  }
  if (!bytes.length || bytes.length > IMAGE_MAX_BYTES) throw new ApiError("La imagen debe pesar menos de 4MB.", 400);

  // Nombre de archivo único por subida (no solo por entrada) — así una foto reemplazada
  // no queda cacheada bajo la misma URL en el CDN/navegador del que la vaya a publicar.
  const path = `${id}-${Date.now()}.${ext}`;
  await storageUpload(MARKETING_IMAGES_BUCKET, path, bytes, mime);
  // Bucket público (ver migración add_social_publish_support_to_marketing_calendar) — esta
  // URL tiene que ser alcanzable sin autenticación porque Meta Graph API la va a buscar
  // ella misma desde sus servidores, no desde el navegador del admin.
  const imageUrl = `${SB_URL}/storage/v1/object/public/${MARKETING_IMAGES_BUCKET}/${path}`;
  const rows = await sbUpdate("marketing_calendar", `id=eq.${encodeURIComponent(id)}`, { image_url: imageUrl, updated_at: new Date().toISOString() });
  await logAdminAction(s.phone, "calendar-image-upload", existing[0].title, { id });
  return { success: true, entry: rows[0] };
}

const SOCIAL_CHANNELS = new Set(["instagram", "facebook"]);

async function metaGraphPost(path: string, params: Record<string, string>): Promise<any> {
  const body = new URLSearchParams(params);
  const r = await fetch(`https://graph.facebook.com/${META_GRAPH_VERSION}/${path}`, { method: "POST", body });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    const msg = data?.error?.message || "Meta rechazó la publicación.";
    throw new ApiError("Meta: " + msg, 502);
  }
  return data;
}
async function metaGraphGet(path: string, params: Record<string, string>): Promise<any> {
  const qs = new URLSearchParams(params);
  const r = await fetch(`https://graph.facebook.com/${META_GRAPH_VERSION}/${path}?${qs}`);
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new ApiError("Meta: " + (data?.error?.message || "Error consultando estado."), 502);
  return data;
}
// Los contenedores de video de Instagram procesan de forma asíncrona (a diferencia de
// foto, que queda lista al toque) — hay que sondear status_code hasta FINISHED antes de
// poder publicar. 40 intentos cada 3s = 2 minutos de margen, suficiente para un Reel
// corto; si no termina en ese tiempo, se corta con un error claro en vez de colgar la
// función indefinidamente (los edge functions tienen un límite de tiempo real).
async function waitForIgContainerReady(creationId: string, token: string): Promise<void> {
  for (let i = 0; i < 40; i++) {
    const status = await metaGraphGet(creationId, { fields: "status_code", access_token: token });
    if (status.status_code === "FINISHED") return;
    if (status.status_code === "ERROR") throw new ApiError("Meta no pudo procesar el video (status ERROR).", 502);
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }
  throw new ApiError("El video de Instagram sigue procesándose después de 2 minutos — reintenta la publicación en unos minutos.", 504);
}

// La página y su token, a partir del ÚNICO secret META_PAGE_ACCESS_TOKEN (2026-10-08). Sirve con
// los dos tipos de token: el de PÁGINA (entonces `me` es la página) y el permanente de un
// USUARIO DEL SISTEMA del Business Manager (entonces `me/accounts` da la página y su token). Sin
// esto, con un token de usuario del sistema se publicaba en `me`, que es el usuario y no la página.
let paginaResuelta: { id: string; token: string } | null = null;
async function paginaDelToken(): Promise<{ id: string; token: string }> {
  if (paginaResuelta) return paginaResuelta;
  const token = META_PAGE_ACCESS_TOKEN!;
  if (META_PAGE_ID) return (paginaResuelta = { id: META_PAGE_ID, token });
  try {
    const d = await metaGraphGet("me/accounts", { fields: "id,name,access_token", access_token: token });
    const paginas: any[] = Array.isArray(d?.data) ? d.data : [];
    const p = paginas.find((x) => /snd/i.test(String(x.name || ""))) || paginas[0];
    if (p?.id && p?.access_token) return (paginaResuelta = { id: String(p.id), token: String(p.access_token) });
  } catch (_e) {
    // Un token de página no puede pedir `me/accounts`: es el caso normal, se sigue abajo.
  }
  return (paginaResuelta = { id: "me", token });
}

// El Instagram vinculado a la página, si no se puso META_IG_USER_ID (2026-10-07): así el dueño
// pega UN secret (el token) y no tres. Se pide una vez por instancia.
let igDescubierto: string | null = null;
async function instagramDeLaPagina(pagina: { id: string; token: string }): Promise<string> {
  if (META_IG_USER_ID) return META_IG_USER_ID;
  if (igDescubierto) return igDescubierto;
  const d = await metaGraphGet(pagina.id, { fields: "instagram_business_account", access_token: pagina.token });
  const id = String(d?.instagram_business_account?.id || "");
  if (!id) throw new ApiError("La página de Facebook no tiene un Instagram profesional vinculado.", 503);
  return (igDescubierto = id);
}

// Prueba REAL del token de la página, sin publicar nada (2026-10-08): que encuentre la página, que
// la página tenga su Instagram profesional y que el token pueda publicar en él. El límite de
// publicación de Instagram solo responde si el token trae `instagram_content_publish`: leerlo
// prueba el permiso sin crear ningún contenedor. La usa verificar-meta (Estado para abrir).
export type VerificacionPublicacion = { token: boolean; pagina: string | null; instagram: string | null; puedePublicar: boolean | null; detalle: string | null };
export async function verificarPublicacion(): Promise<VerificacionPublicacion> {
  const v: VerificacionPublicacion = { token: !!META_PAGE_ACCESS_TOKEN, pagina: null, instagram: null, puedePublicar: null, detalle: null };
  if (!v.token) return v;
  try {
    const pagina = await paginaDelToken();
    if (pagina.id === "me") { v.puedePublicar = false; v.detalle = "el token no ve ninguna página (¿le asignaste «Snd//wch» al usuario del sistema?)"; return v; }
    const p = await metaGraphGet(pagina.id, { fields: "name,instagram_business_account{username}", access_token: pagina.token });
    v.pagina = `${p?.name || "?"} (${pagina.id})`;
    const ig = p?.instagram_business_account;
    if (!ig?.id) { v.puedePublicar = false; v.detalle = "la página no tiene un Instagram profesional vinculado"; return v; }
    v.instagram = `@${ig.username || "?"} (${ig.id})`;
    await metaGraphGet(`${ig.id}/content_publishing_limit`, { fields: "quota_usage", access_token: pagina.token });
    v.puedePublicar = true;
  } catch (e: any) {
    v.puedePublicar = false;
    v.detalle = String(e?.message || e).slice(0, 220);
  }
  return v;
}

// Qué contenedores pide Instagram para una entrada: un Reel, una imagen o un CARRUSEL. El carrusel
// (2026-10-07, lanzamiento del perfil) llega con sus láminas en `datos.laminas`, en orden; cada
// lámina es un contenedor hijo y el padre las junta con el texto. Si una lámina se pierde o se
// desordena, nada falla: sale publicado mal. Por eso es una función aparte y probada
// (tests-api/carrusel-de-instagram.test.ts).
export function contenedoresDeInstagram(entry: any, caption: string): { hijos: Record<string, string>[]; padre: Record<string, string> } {
  // Historia: un cuadro por fila, sin texto (las historias no llevan caption) y sin stickers (la
  // API no los publica: ENTORNO.md). El texto ya va dentro de la imagen.
  if (entry.formato === "historia") {
    return { hijos: [], padre: entry.media_type === "video" ? { video_url: String(entry.video_url), media_type: "STORIES" } : { image_url: String(entry.image_url), media_type: "STORIES" } };
  }
  if (entry.media_type === "video") return { hijos: [], padre: { video_url: String(entry.video_url), media_type: "REELS", caption } };
  const laminas: string[] = Array.isArray(entry.datos?.laminas) ? entry.datos.laminas.map(String).filter(Boolean) : [];
  if (laminas.length > 10) throw new ApiError("Instagram acepta hasta 10 láminas por carrusel.", 400);
  if (laminas.length >= 2) {
    return { hijos: laminas.map((u) => ({ image_url: u, is_carousel_item: "true" })), padre: { media_type: "CAROUSEL", caption } };
  }
  return { hijos: [], padre: { image_url: String(laminas[0] || entry.image_url), caption } };
}

// Publica una entrada del calendario en Instagram o Facebook — requiere que ya tenga
// image_url o video_url (ver actAdminCalendarUploadImage/actAdminUploadRawVideo) y que
// los 3 secretos de Meta estén configurados (ver env.ts). Compartida entre el botón
// manual "Publicar ahora" (actAdminPublishSocial) y el cron de auto-publicación
// (actAutoPublishCalendar) — la única diferencia es quién la llama.
async function publishCalendarEntry(entry: any): Promise<string> {
  if (!SOCIAL_CHANNELS.has(entry.channel)) {
    throw new ApiError("Este canal no se publica automáticamente — cópialo a mano igual que WhatsApp/otros.", 400);
  }
  const isVideo = entry.media_type === "video";
  const mediaUrl = isVideo ? entry.video_url : entry.image_url;
  if (!mediaUrl) throw new ApiError(`Sube ${isVideo ? "un video" : "una foto"} antes de publicar.`, 400);
  if (!META_PAGE_ACCESS_TOKEN) {
    throw new ApiError("Publicación de Meta sin configurar — falta el secret META_PAGE_ACCESS_TOKEN (docs/PENDIENTE_DEL_DUENO.md, P33).", 503);
  }
  const pagina = await paginaDelToken();
  const pageId = pagina.id;
  const tok = pagina.token;
  const caption = String(entry.caption_text || entry.title || "");

  let publishedRef: string;
  if (entry.channel === "facebook" && entry.formato === "historia") {
    throw new ApiError("Las historias se publican solo en Instagram.", 400);
  }
  if (entry.channel === "facebook") {
    const data = isVideo
      ? await metaGraphPost(`${pageId}/videos`, { file_url: mediaUrl, description: caption, access_token: tok })
      : await metaGraphPost(`${pageId}/photos`, { url: mediaUrl, caption, access_token: tok });
    publishedRef = String(data.post_id || data.id || "");
  } else {
    const igUserId = await instagramDeLaPagina(pagina);
    const plan = contenedoresDeInstagram(entry, caption);
    // Carrusel: un contenedor por lámina, en orden, y después el padre que las junta.
    if (plan.hijos.length) {
      const ids: string[] = [];
      for (const h of plan.hijos) ids.push(String((await metaGraphPost(`${igUserId}/media`, { ...h, access_token: tok })).id || ""));
      if (ids.some((x) => !x)) throw new ApiError("Meta no devolvió un contenedor válido para una lámina del carrusel.", 502);
      plan.padre.children = ids.join(",");
    }
    const container = await metaGraphPost(`${igUserId}/media`, { ...plan.padre, access_token: tok });
    const creationId = String(container.id || "");
    if (!creationId) throw new ApiError("Meta no devolvió un contenedor de media válido.", 502);
    if (isVideo) await waitForIgContainerReady(creationId, tok);
    const published = await metaGraphPost(`${igUserId}/media_publish`, {
      creation_id: creationId,
      access_token: tok,
    });
    publishedRef = String(published.id || "");
  }
  return publishedRef;
}

// Reclama una fila atómicamente (status=eq.scheduled&status=eq.draft varía por caller —
// ver abajo) ANTES de llamar a Meta — sin esto, el botón manual y el cron (cada 15 min)
// podían leer la misma fila en 'scheduled' y publicarla dos veces: ninguno sabía que el
// otro ya la había tomado (hallazgo de auditoría de código, ALTO). El UPDATE solo tiene
// éxito si la fila SIGUE en el estado esperado; 0 filas devueltas = alguien más ya la
// reclamó, así que el caller debe abortar sin publicar de nuevo.
async function claimCalendarEntry(id: string, fromStatus: string): Promise<any | null> {
  const rows = await sbUpdate(
    "marketing_calendar",
    `id=eq.${encodeURIComponent(id)}&status=eq.${fromStatus}&select=*`,
    { status: "publishing", updated_at: new Date().toISOString() },
  );
  return rows[0] || null;
}
// Si Meta rechaza o falla el publish tras haber reclamado la fila, la devuelve a
// 'scheduled' para que el cron (o un reintento manual) la vuelva a intentar — dejarla
// en 'publishing' para siempre la escondería de ambos caminos sin ningún aviso.
async function releaseClaim(id: string): Promise<void> {
  await sbUpdate("marketing_calendar", `id=eq.${encodeURIComponent(id)}`, {
    status: "scheduled",
    updated_at: new Date().toISOString(),
  });
}

export async function actAdminPublishSocial(b: Entrada<"admin-publish-social"> & { _ip?: string }) {
  const s = await requireAdmin(b.token);
  const id = String(b.id || "").trim();
  if (!id) throw new ApiError("Falta el id.", 400);
  const rows = await sbGet("marketing_calendar", `id=eq.${encodeURIComponent(id)}&select=*`);
  const entry = rows[0];
  if (!entry) throw new ApiError("Entrada de calendario no encontrada.", 404);
  // El botón manual puede tocar una entrada en 'draft' o 'scheduled' (el cron solo toca
  // 'scheduled') — se reclama contra el estado real que tenga en ese momento.
  const claimed = await claimCalendarEntry(id, entry.status);
  if (!claimed) throw new ApiError("Esta entrada ya se está publicando (o ya se publicó) — espera un momento y recarga.", 409);
  let publishedRef: string;
  try {
    publishedRef = await publishCalendarEntry(entry);
  } catch (e) {
    await releaseClaim(id);
    throw e;
  }
  const updated = await sbUpdate("marketing_calendar", `id=eq.${encodeURIComponent(id)}`, {
    status: "posted",
    posted_at: new Date().toISOString(),
    published_ref: publishedRef,
    updated_at: new Date().toISOString(),
  });
  await logAdminAction(s.phone, "social-publish", entry.title, { id, channel: entry.channel, publishedRef });
  return { success: true, entry: updated[0], publishedRef };
}

// Cron (cada 15 min, ver migración add_video_reels_and_content_upload_queue): publica
// solas las entradas ya programadas (status='scheduled', con foto o video ya subido —
// puestas ahí por la sesión de procesamiento semanal o por el propio admin) cuya fecha
// programada ya llegó — sin esperar a que nadie toque "Publicar ahora". Un error en una
// entrada no bloquea las demás; cada fallo queda en debug_logs vía el catch de nivel
// superior del handler.
// Qué publica solo el cron. `revision=neq.bloqueada` (2026-10-07): lo que el Revisor del equipo
// de marketing bloqueó no sale nunca, aunque algo lo deje en 'scheduled' por error. Lo pendiente
// del Productor no llega acá: entra como 'draft' y solo el Revisor lo programa
// (scripts/video-auto/diario.mjs).
export function loQueSaleSolo(today: string, ahora: string = new Date().toISOString()): string {
  // En orden de fecha, de hora y de creación: el lanzamiento del perfil se carga en el orden en
  // que tiene que aparecer, y los cuadros de una historia salen uno tras otro en la misma corrida.
  // `publicar_desde`: la hora exacta (2026-10-08). GitHub atrasa sus horarios de 5 a 9 horas, así
  // que la hora de publicar la decide este cron (puntual), no el momento en que algo se aprobó.
  return `status=eq.scheduled&revision=neq.bloqueada&scheduled_date=lte.${today}` +
    `&or=(publicar_desde.is.null,publicar_desde.lte.${ahora})` +
    `&channel=in.(instagram,facebook)&select=*&order=scheduled_date.asc,publicar_desde.asc.nullsfirst,created_at.asc&limit=500`;
}

/** Si la pieza vende un Signature que AHORA está agotado (él o su proteína), el motivo; si no, null.
 *  Se mira al publicar porque la pieza se aprueba un día antes, cuando el inventario de hoy todavía
 *  no existe (tests-api/publicar-solo-lo-revisado.test.ts). */
export function agotadoAlPublicar(entry: any, inventario: { product_code: string; in_stock: boolean | null }[]): string | null {
  const codigos = [entry?.datos?.sig, entry?.datos?.prot].filter(Boolean).map(String);
  const sinStock = codigos.find((c) => inventario.some((r) => String(r.product_code) === c && r.in_stock === false));
  return sinStock ? `stock: ${sinStock} está agotado al publicar` : null;
}

export async function actAutoPublishCalendar(b: Entrada<"auto-publish-calendar"> & { _ip?: string }) {
  if (!(await verifyCronSecret(b.cronSecret))) throw new ApiError("No autorizado.", 401);
  // El día de LIMA, no el de UTC: con la fecha UTC, desde las 19:00 de Lima salía lo programado
  // para el día siguiente (2026-10-08).
  const today = fechaLima(Date.now());
  const due = await sbGet("marketing_calendar", loQueSaleSolo(today));
  const results: { id: string; ok: boolean; error?: string }[] = [];
  const inventario = due.some((e: any) => e?.datos?.sig)
    ? await sbGet("inventory", "select=product_code,in_stock&limit=500").catch(() => [])
    : [];
  for (const entry of due) {
    const agotado = agotadoAlPublicar(entry, inventario);
    if (agotado) {
      await sbUpdate("marketing_calendar", `id=eq.${entry.id}&status=eq.scheduled`, { revision: "bloqueada", motivo_revision: agotado, updated_at: new Date().toISOString() });
      results.push({ id: entry.id, ok: false, error: agotado });
      continue;
    }
    // Reclama antes de publicar — si el admin ya la publicó a mano (o una corrida
    // anterior del cron sigue en curso, ver waitForIgContainerReady) entre el sbGet de
    // arriba y este punto, el claim devuelve null y esta entrada se salta sin duplicar.
    const claimed = await claimCalendarEntry(entry.id, "scheduled");
    if (!claimed) { results.push({ id: entry.id, ok: false, error: "ya reclamada por otro proceso" }); continue; }
    try {
      const publishedRef = await publishCalendarEntry(entry);
      await sbUpdate("marketing_calendar", `id=eq.${entry.id}`, {
        status: "posted",
        posted_at: new Date().toISOString(),
        published_ref: publishedRef,
        updated_at: new Date().toISOString(),
      });
      await logAdminAction("cron", "social-publish", entry.title, { id: entry.id, channel: entry.channel, publishedRef, auto: true });
      results.push({ id: entry.id, ok: true });
    } catch (e: any) {
      await releaseClaim(entry.id);
      results.push({ id: entry.id, ok: false, error: e?.message || String(e) });
    }
  }
  return { success: true, processed: results.length, results };
}

// Sube un clip crudo a la cola (content_uploads) — el dueño lo hace una vez por semana
// desde el panel; una sesión programada aparte (no esta función) lo procesa y crea la
// entrada de calendario correspondiente. 20MB de tope: un Reel corto bien comprimido
// entra sin problema; algo más pesado hay que recomprimirlo antes de subir (el body de
// una función edge no está pensado para archivos grandes en base64).
export async function actAdminUploadRawVideo(b: Entrada<"admin-upload-raw-video"> & { _ip?: string }) {
  const s = await requireAdmin(b.token);
  const mime = String(b.mime || "");
  const videoBase64 = String(b.videoBase64 || "");
  const notes = b.notes ? String(b.notes).slice(0, 300) : null;
  if (!videoBase64) throw new ApiError("Falta el video.", 400);
  const ext = VIDEO_MIME_EXT[mime];
  if (!ext) throw new ApiError("Formato de video no soportado — usa MP4 o MOV.", 400);

  let bytes: Uint8Array;
  try {
    const bin = atob(videoBase64);
    bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  } catch {
    throw new ApiError("Video inválido.", 400);
  }
  if (!bytes.length || bytes.length > RAW_VIDEO_MAX_BYTES) throw new ApiError("El video debe pesar menos de 20MB — comprímelo antes de subir.", 400);

  const path = `${crypto.randomUUID()}.${ext}`;
  await storageUpload(RAW_UPLOADS_BUCKET, path, bytes, mime);
  const row = await sbInsert("content_uploads", { storage_path: path, mime, notes });
  await logAdminAction(s.phone, "raw-video-upload", path, { bytes: bytes.length });
  return { success: true, upload: row[0] };
}

export async function actAdminListRawUploads(b: Entrada<"admin-list-raw-uploads"> & { _ip?: string }) {
  await requireAdmin(b.token);
  const rows = await sbGet("content_uploads", "status=eq.pending&order=uploaded_at.desc&select=*&limit=500");
  return { uploads: rows };
}

// ── EL BOTÓN DE LOS ANUNCIOS (2026-10-01) ──────────────────────────────────────────────────
// Apagar pausa TODAS las campañas activas de la cuenta y anota cuáles pausó. Prender reactiva
// SOLO esas: una campaña que el dueño había pausado a mano en Meta no se prende por accidente.
// Lo anotado vive en app_settings (no en el log de auditoría, que traga sus errores): si no se
// pudiera guardar, «Prender» no sabría qué reactivar y fallaría en silencio.
async function campanasDeLaCuenta(): Promise<{ id: string; nombre: string; estado: string; activa: boolean }[]> {
  const data = await metaGraphGet(`act_${META_AD_ACCOUNT_ID}/campaigns`, {
    access_token: META_ADS_TOKEN!, fields: "id,name,status,effective_status", limit: "100",
  });
  return (data?.data || []).map((c: any) => ({
    id: String(c.id), nombre: String(c.name || ""), estado: String(c.effective_status || c.status || ""),
    activa: c.status === "ACTIVE",
  }));
}
// La decisión, sin red: qué campañas cambian y qué queda anotado. Separada para poder probar
// la promesa que importa (Prender NUNCA toca una campaña que el botón no apagó).
export function planDeAnuncios(
  que: "apagar" | "prender",
  campanas: { id: string; activa: boolean }[],
  pausadasAntes: string[],
): { cambiar: { id: string; status: "PAUSED" | "ACTIVE" }[]; pausadasDespues: string[] } {
  if (que === "apagar") {
    const activas = campanas.filter((c) => c.activa).map((c) => c.id);
    // Se suman a las ya anotadas: dos «Apagar» seguidos no pueden olvidar las primeras.
    return { cambiar: activas.map((id) => ({ id, status: "PAUSED" })), pausadasDespues: Array.from(new Set([...pausadasAntes, ...activas])) };
  }
  return { cambiar: pausadasAntes.map((id) => ({ id, status: "ACTIVE" })), pausadasDespues: [] };
}
export async function actAdminMetaAds(b: Entrada<"admin-meta-ads">): Promise<Salida<"admin-meta-ads">> {
  const admin = await requireAdmin(b.token);
  if (!META_ADS_TOKEN) throw new ApiError("Falta el token de Meta en el servidor (META_ADS_TOKEN o META_PAGE_ACCESS_TOKEN).", 503);
  if (!["ver", "apagar", "prender"].includes(b.que)) throw new ApiError("No sé qué hacer con los anuncios.", 400);
  const [ajustes] = await leer("app_settings", ["meta_ads_pausadas", "meta_ads_pausadas_at"], "id=eq.true");
  let pausadas: string[] = ajustes?.meta_ads_pausadas || [];
  let pausadasAt: string | null = ajustes?.meta_ads_pausadas_at || null;
  if (b.que === "apagar" || b.que === "prender") {
    const plan = planDeAnuncios(b.que, b.que === "apagar" ? await campanasDeLaCuenta() : [], pausadas);
    for (const c of plan.cambiar) await metaGraphPost(c.id, { access_token: META_ADS_TOKEN, status: c.status });
    pausadas = plan.pausadasDespues;
    pausadasAt = pausadas.length ? new Date().toISOString() : null;
    await sbUpdate("app_settings", "id=eq.true", { meta_ads_pausadas: pausadas, meta_ads_pausadas_at: pausadasAt, updated_at: new Date().toISOString() });
    await logAdminAction(admin?.phone || "?", "meta-ads-" + b.que, undefined, { campanas: plan.cambiar.map((c) => c.id) });
  }
  return { cuenta: META_AD_ACCOUNT_ID, campanas: await campanasDeLaCuenta(), pausadasPorBoton: pausadas, pausadasAt };
}

// Una visita a la app, contada por su origen (?src=) y por día, sin datos personales (equipo de
// marketing, 2026-10-07: sin esto no se sabe cuánta gente entra y no compra). El cliente la manda
// una vez por sesión; el tope por IP evita que alguien infle los números a mano. Nunca falla
// hacia el cliente: una visita no contada no puede romper la carga de la app.
export async function actRegistrarVisita(b: Entrada<"registrar-visita"> & { _ip?: string }) {
  try {
    const permitido = await rpc("check_rate_limit", { p_key: `visita:${b._ip || "?"}`, p_limit: 20, p_window_minutes: 60 });
    if (permitido) await rpc("registrar_visita", { p_src: String(b.src || "").trim() || "directo" });
  } catch (e) {
    console.error("registrar-visita:", e);
  }
  return { success: true };
}
