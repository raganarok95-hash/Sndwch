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
import { sbGet, sbUpdate, sbInsert, storageUpload } from "../db.ts";
import { ApiError } from "../types.ts";
import { requireAdmin, verifyCronSecret } from "../session.ts";
import { logAdminAction } from "../logging.ts";
import { SB_URL, META_PAGE_ACCESS_TOKEN, META_PAGE_ID, META_IG_USER_ID, META_GRAPH_VERSION } from "../env.ts";

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

export async function actAdminCalendarUploadImage(b: any) {
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
async function waitForIgContainerReady(creationId: string): Promise<void> {
  for (let i = 0; i < 40; i++) {
    const status = await metaGraphGet(creationId, { fields: "status_code", access_token: META_PAGE_ACCESS_TOKEN! });
    if (status.status_code === "FINISHED") return;
    if (status.status_code === "ERROR") throw new ApiError("Meta no pudo procesar el video (status ERROR).", 502);
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }
  throw new ApiError("El video de Instagram sigue procesándose después de 2 minutos — reintenta la publicación en unos minutos.", 504);
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
  if (!META_PAGE_ACCESS_TOKEN || !META_PAGE_ID) {
    throw new ApiError(
      "Publicación de Meta sin configurar — falta ejecutar: supabase secrets set META_PAGE_ACCESS_TOKEN=... META_PAGE_ID=...",
      503,
    );
  }
  const caption = String(entry.caption_text || entry.title || "");

  let publishedRef: string;
  if (entry.channel === "facebook") {
    const data = isVideo
      ? await metaGraphPost(`${META_PAGE_ID}/videos`, { file_url: mediaUrl, description: caption, access_token: META_PAGE_ACCESS_TOKEN })
      : await metaGraphPost(`${META_PAGE_ID}/photos`, { url: mediaUrl, caption, access_token: META_PAGE_ACCESS_TOKEN });
    publishedRef = String(data.post_id || data.id || "");
  } else {
    if (!META_IG_USER_ID) {
      throw new ApiError("Publicación de Instagram sin configurar — falta ejecutar: supabase secrets set META_IG_USER_ID=...", 503);
    }
    const containerParams: Record<string, string> = isVideo
      ? { video_url: mediaUrl, media_type: "REELS", caption, access_token: META_PAGE_ACCESS_TOKEN }
      : { image_url: mediaUrl, caption, access_token: META_PAGE_ACCESS_TOKEN };
    const container = await metaGraphPost(`${META_IG_USER_ID}/media`, containerParams);
    const creationId = String(container.id || "");
    if (!creationId) throw new ApiError("Meta no devolvió un contenedor de media válido.", 502);
    if (isVideo) await waitForIgContainerReady(creationId);
    const published = await metaGraphPost(`${META_IG_USER_ID}/media_publish`, {
      creation_id: creationId,
      access_token: META_PAGE_ACCESS_TOKEN,
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

export async function actAdminPublishSocial(b: any) {
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
export async function actAutoPublishCalendar(b: any) {
  if (!(await verifyCronSecret(b.cronSecret))) throw new ApiError("No autorizado.", 401);
  const today = new Date().toISOString().slice(0, 10);
  const due = await sbGet(
    "marketing_calendar",
    `status=eq.scheduled&scheduled_date=lte.${today}&channel=in.(instagram,facebook)&select=*&limit=500`,
  );
  const results: { id: string; ok: boolean; error?: string }[] = [];
  for (const entry of due) {
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
export async function actAdminUploadRawVideo(b: any) {
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

export async function actAdminListRawUploads(b: any) {
  await requireAdmin(b.token);
  const rows = await sbGet("content_uploads", "status=eq.pending&order=uploaded_at.desc&select=*&limit=500");
  return { uploads: rows };
}
