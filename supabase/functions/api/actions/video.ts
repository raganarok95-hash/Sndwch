// SND//WCH — api / actions/video
// Generación automática de video publicitario: guion → prompt → video → calendario.
//
// POR QUÉ NO ES "MANDARLO A FLOW": Google Flow (la herramienta que el dueño usa a mano)
// NO tiene API pública — es exclusivamente una interfaz web sobre créditos de suscripción.
// Lo único que existe para "automatizar Flow" son extensiones de navegador de terceros que
// scriptean el DOM, lo cual contradice sus términos y arriesga la cuenta de Google del
// dueño. No es una vía aceptable.
//
// Flow por dentro usa Veo, y VEO SÍ TIENE API. Así que la automatización real es: mismo
// modelo, misma calidad, sin pasar por la interfaz. La diferencia es que Flow además trae
// timeline y encadenado de escenas; la API devuelve un clip crudo por llamada. Para videos
// publicitarios cortos (8s, formato vertical de redes) eso es exactamente lo que se
// necesita.
//
// Dos acciones separadas a propósito:
//   1. `admin-video-script` — genera guion + prompt. NO cuesta nada, no depende de nada
//      externo, funciona hoy mismo. Es la parte creativa, que era el trabajo manual real.
//   2. `admin-video-generate` — llama a Veo y devuelve el MP4. Requiere GEMINI_API_KEY y
//      cuesta dinero real (~$0.03-0.15 por segundo). Sin la key responde 503 con
//      instrucciones, igual que hace la publicación a redes con los secrets de Meta.
import { ApiError } from "../types.ts";
import { requireAdmin } from "../session.ts";
import { logAdminAction } from "../logging.ts";
import { sbInsert } from "../db.ts";
import { loadCatalogPrices, SIG_DATA, SIG_LABEL, PROT_LABEL, TOP_LABEL, SAUCE_LABEL, BASE_LABEL } from "../catalog.ts";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") || "";
// veo-3.1-fast: ~$0.10-0.15/segundo con audio nativo, contra ~$0.40 del modelo de calidad
// completa. Para clips de producto de 8 segundos en redes la diferencia no se nota y el
// costo mensual baja de ~$38 a ~$10-14 con 12 videos/mes.
const VEO_MODEL = Deno.env.get("VEO_MODEL") || "veo-3.1-fast-generate-preview";
const VEO_MAX_SECONDS = 8;   // tope duro del modelo, no una decisión nuestra

// Reglas de marca que TODO prompt debe respetar, vengan de donde vengan los ingredientes.
// La primera no es estética sino factual: el producto real es un sub alargado, y los
// nombres de los panes ("CLASSIC // WHITE", "FOCACCIA // ARTESANAL") describen sabor y
// textura de la masa, NO su forma. Un modelo de video que lea "focaccia" sin esta
// instrucción devuelve un pan plano cuadrado, que no es lo que se vende.
const BREAD_RULE =
  "The sandwich is ALWAYS a long sub/hoagie roll (Subway-style elongated bread), " +
  "never sliced loaf bread, never flatbread, never a square focaccia slab";
const BRAND_RULE =
  "Deep forest green (#1E3932) and warm gold (#CBA258) color grading, matte finish, " +
  "no glossy plastic look, no text or logos rendered in frame";

type VideoAngle = {
  key: string;
  label: string;
  shot: string;
  beat: string;
};

// Ángulos de cámara/relato distintos para que 12 videos al mes no salgan todos iguales.
// Cada uno es un tratamiento completo, no una variación de color.
const ANGLES: VideoAngle[] = [
  { key: "macro", label: "Macro del corte",
    shot: "extreme macro lens, shallow depth of field, slow push-in on the cross-section",
    beat: "the knife finishes the cut and the two halves separate, revealing the layers" },
  { key: "steam", label: "Vapor y calor",
    shot: "side angle, backlit so steam is visible against a dark background, slow motion",
    beat: "steam rises off the hot filling as the sandwich is set down on kraft paper" },
  { key: "build", label: "Armado por capas",
    shot: "top-down overhead, locked-off camera, stop-motion feel",
    beat: "each ingredient lands in sequence on the open roll, ending with the top half closing" },
  { key: "pull", label: "Estirado de queso",
    shot: "close-up at 45 degrees, slow motion at 120fps",
    beat: "the sandwich halves pull apart and the melted cheese stretches between them" },
  { key: "hands", label: "Primer bocado",
    shot: "handheld, natural window light, intimate framing, hands only, no faces",
    beat: "hands lift the sandwich toward camera and take the first bite" },
  { key: "delivery", label: "Llegada del pedido",
    shot: "medium shot, warm evening light, doorway setting",
    beat: "a kraft paper bag is handed over and opened, revealing the wrapped sandwich" },
];

function ingredientsOf(sigId: string): { protein: string; tops: string[]; sauces: string[]; bread: string } {
  const sig = SIG_DATA[sigId];
  if (!sig) throw new ApiError("Signature inválida.", 400);
  return {
    protein: PROT_LABEL[sig.prot] || sig.prot,
    tops: (sig.tops || []).map((t: string) => TOP_LABEL[t] || t),
    sauces: (sig.sauces || []).map((s: string) => SAUCE_LABEL[s] || s),
    bread: BASE_LABEL[sig.base] || sig.base,
  };
}

// Construye el prompt para Veo a partir de datos REALES del catálogo, no de una
// descripción escrita a mano que se desactualiza cuando cambia una receta.
function buildVeoPrompt(sigId: string, angle: VideoAngle): string {
  const ing = ingredientsOf(sigId);
  const name = (SIG_LABEL[sigId] || sigId).split("//")[0].trim();
  const fillings = [ing.protein, ...ing.tops].join(", ").toLowerCase();
  const sauces = ing.sauces.join(" and ").toLowerCase();
  return [
    `8-second vertical (9:16) food commercial for an artisan sandwich called ${name}.`,
    `${BREAD_RULE}.`,
    `Filling: ${fillings}${sauces ? `, finished with ${sauces}` : ""}.`,
    `Camera: ${angle.shot}.`,
    `Action: ${angle.beat}.`,
    `${BRAND_RULE}.`,
    "Photorealistic, appetizing, restaurant-quality food styling. No people's faces.",
    "Ambient kitchen sound only, no music, no voiceover.",
  ].join(" ");
}

// Guion en español para el dueño (lo que verá y podrá ajustar) + el prompt en inglés para
// el modelo (los modelos de video responden bastante mejor en inglés).
export async function actAdminVideoScript(b: any) {
  const s = await requireAdmin(b.token);
  await loadCatalogPrices();
  const sigId = String(b.sigId || "").trim();
  if (!SIG_DATA[sigId]) throw new ApiError("Elige un Signature del menú.", 400);
  const angleKey = String(b.angle || "").trim();
  const angle = ANGLES.find((a) => a.key === angleKey) || ANGLES[Math.floor(Math.random() * ANGLES.length)];

  const ing = ingredientsOf(sigId);
  const name = (SIG_LABEL[sigId] || sigId).split("//")[0].trim();
  const sig = SIG_DATA[sigId];
  const price = sig.p15;

  // Pie de publicación listo para pegar, con la marca y un llamado a la acción real.
  const caption = [
    `${name} //`,
    "",
    `${ing.protein} en pan ${ing.bread.toLowerCase()}${ing.tops.length ? `, con ${ing.tops.join(", ").toLowerCase()}` : ""}.`,
    ing.sauces.length ? `Sellado con ${ing.sauces.join(" y ").toLowerCase()}.` : "",
    "",
    `Desde S/${price}. Delivery en Trujillo.`,
    "Pide por el link de la bio.",
  ].filter(Boolean).join("\n");

  return {
    success: true,
    sigId,
    name,
    angle: { key: angle.key, label: angle.label },
    // Guion legible, para que el dueño entienda qué va a generar antes de gastar
    guion: {
      duracion: `${VEO_MAX_SECONDS} segundos`,
      formato: "Vertical 9:16 (Reels / TikTok / Stories)",
      plano: angle.shot,
      accion: angle.beat,
      ingredientes: [ing.protein, ...ing.tops, ...ing.sauces].join(" · "),
      pan: ing.bread,
    },
    veoPrompt: buildVeoPrompt(sigId, angle),
    caption,
    hashtags: "#sndwch #trujillo #delivery #sanguches #comidatrujillo",
    angles: ANGLES.map((a) => ({ key: a.key, label: a.label })),
    _nota: GEMINI_API_KEY
      ? "Listo para generar el video con admin-video-generate."
      : "Falta GEMINI_API_KEY para generar el video automáticamente. El prompt de arriba igual sirve para pegarlo a mano en Flow.",
  };
}

// Llama a Veo por la API de Gemini. Operación de larga duración: se dispara, se consulta
// cada pocos segundos, y al terminar devuelve el enlace del MP4. Se guarda en
// content_uploads para que quede registro de qué se generó y cuánto costó.
export async function actAdminVideoGenerate(b: any) {
  const s = await requireAdmin(b.token);
  if (!GEMINI_API_KEY) {
    throw new ApiError(
      "Generación de video sin configurar — falta ejecutar: supabase secrets set GEMINI_API_KEY=... " +
      "(se saca de Google AI Studio; cuesta ~$0.10-0.15 por segundo de video con veo-3.1-fast).",
      503,
    );
  }
  const prompt = String(b.prompt || "").trim();
  if (!prompt) throw new ApiError("Falta el prompt del video (genéralo primero con admin-video-script).", 400);
  const seconds = Math.min(VEO_MAX_SECONDS, Math.max(4, Number(b.seconds) || VEO_MAX_SECONDS));

  const base = "https://generativelanguage.googleapis.com/v1beta";
  const start = await fetch(`${base}/models/${VEO_MODEL}:predictLongRunning?key=${encodeURIComponent(GEMINI_API_KEY)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      instances: [{ prompt }],
      parameters: { aspectRatio: "9:16", durationSeconds: seconds, personGeneration: "dont_allow" },
    }),
  });
  if (!start.ok) {
    const text = await start.text();
    console.error("veo predictLongRunning failed:", text);
    throw new ApiError("Google rechazó la generación del video. Revisa el prompt o la cuota de tu cuenta.", 502);
  }
  const op = await start.json();
  const opName = String(op?.name || "");
  if (!opName) throw new ApiError("Google no devolvió una operación válida.", 502);

  // Poll acotado: la latencia real va de ~11s a varios minutos. Una edge function no puede
  // esperar indefinidamente, así que si no termina dentro del presupuesto se devuelve el
  // identificador de la operación para consultarla después, en vez de fallar.
  const deadline = Date.now() + 110000;
  let videoUri = "";
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 8000));
    const poll = await fetch(`${base}/${opName}?key=${encodeURIComponent(GEMINI_API_KEY)}`);
    if (!poll.ok) continue;
    const st = await poll.json();
    if (st?.done) {
      if (st?.error) {
        console.error("veo operation error:", JSON.stringify(st.error));
        throw new ApiError("La generación falló del lado de Google: " + String(st.error?.message || ""), 502);
      }
      videoUri = String(
        st?.response?.generateVideoResponse?.generatedSamples?.[0]?.video?.uri ||
        st?.response?.generatedVideos?.[0]?.video?.uri || "",
      );
      break;
    }
  }

  await logAdminAction(s.phone, "video-generate", undefined, { model: VEO_MODEL, seconds, done: !!videoUri });
  if (!videoUri) {
    return {
      success: true, pending: true, operation: opName,
      mensaje: "El video sigue generándose. Vuelve a consultar en un momento con este identificador de operación.",
    };
  }
  // El archivo vive solo ~2 días en los servidores de Google: hay que descargarlo o
  // republicarlo antes de eso. Queda registrado para no perderle el rastro.
  try {
    await sbInsert("content_uploads", {
      storage_path: videoUri,
      mime: "video/mp4",
      status: "generated",
      notes: `veo:${VEO_MODEL} ${seconds}s — el enlace de Google expira en ~48h, descargar`,
    });
  } catch (e) {
    console.error("content_uploads insert failed for generated video:", e);
  }
  return {
    success: true, pending: false, videoUri, seconds, model: VEO_MODEL,
    aviso: "Google guarda este archivo solo ~48 horas. Descárgalo o publícalo antes de que expire.",
  };
}
