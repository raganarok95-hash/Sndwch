// SND//WCH — api / actions/social
// Publicación real en Instagram/Facebook vía Meta Graph API — la única pieza del sistema
// de marketing que de verdad sale de la app sin copiar/pegar a mano. Todo lo demás
// (MARKETING_CONTENT, marketing_calendar) sigue siendo "nada se publica solo" a propósito;
// esto es la excepción, y solo para los canales instagram/facebook de una entrada del
// calendario que ya tiene una foto subida.
import { sbGet, sbUpdate, storageUpload } from "../db.ts";
import { ApiError } from "../types.ts";
import { requireAdmin } from "../session.ts";
import { logAdminAction } from "../logging.ts";
import { SB_URL, META_PAGE_ACCESS_TOKEN, META_PAGE_ID, META_IG_USER_ID, META_GRAPH_VERSION } from "../env.ts";

const IMAGE_MAX_BYTES = 4 * 1024 * 1024;
const IMAGE_MIME_EXT: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const MARKETING_IMAGES_BUCKET = "marketing-images";

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

// Publica una entrada del calendario en Instagram o Facebook — requiere que ya tenga
// image_url (ver actAdminCalendarUploadImage) y que los 3 secretos de Meta estén
// configurados (ver env.ts). No hay reintento automático ni cola: si falla, el admin ve
// el error de Meta tal cual y puede reintentar a mano desde el calendario.
export async function actAdminPublishSocial(b: any) {
  const s = await requireAdmin(b.token);
  const id = String(b.id || "").trim();
  if (!id) throw new ApiError("Falta el id.", 400);
  const rows = await sbGet("marketing_calendar", `id=eq.${encodeURIComponent(id)}&select=*`);
  const entry = rows[0];
  if (!entry) throw new ApiError("Entrada de calendario no encontrada.", 404);
  if (!SOCIAL_CHANNELS.has(entry.channel)) {
    throw new ApiError("Este canal no se publica automáticamente — cópialo a mano igual que WhatsApp/otros.", 400);
  }
  if (!entry.image_url) throw new ApiError("Sube una foto antes de publicar.", 400);
  if (!META_PAGE_ACCESS_TOKEN || !META_PAGE_ID) {
    throw new ApiError(
      "Publicación de Meta sin configurar — falta ejecutar: supabase secrets set META_PAGE_ACCESS_TOKEN=... META_PAGE_ID=...",
      503,
    );
  }
  const caption = String(entry.caption_text || entry.title || "");

  let publishedRef: string;
  if (entry.channel === "facebook") {
    const data = await metaGraphPost(`${META_PAGE_ID}/photos`, {
      url: entry.image_url,
      caption,
      access_token: META_PAGE_ACCESS_TOKEN,
    });
    publishedRef = String(data.post_id || data.id || "");
  } else {
    if (!META_IG_USER_ID) {
      throw new ApiError("Publicación de Instagram sin configurar — falta ejecutar: supabase secrets set META_IG_USER_ID=...", 503);
    }
    const container = await metaGraphPost(`${META_IG_USER_ID}/media`, {
      image_url: entry.image_url,
      caption,
      access_token: META_PAGE_ACCESS_TOKEN,
    });
    const creationId = String(container.id || "");
    if (!creationId) throw new ApiError("Meta no devolvió un contenedor de media válido.", 502);
    const published = await metaGraphPost(`${META_IG_USER_ID}/media_publish`, {
      creation_id: creationId,
      access_token: META_PAGE_ACCESS_TOKEN,
    });
    publishedRef = String(published.id || "");
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
