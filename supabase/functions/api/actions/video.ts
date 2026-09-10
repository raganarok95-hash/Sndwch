// SND//WCH — VIDEO PARA REDES
//
// Una sola acción: `admin-video-script`. Arma el guion y el PROMPT LISTO PARA GOOGLE FLOW,
// que es la herramienta con la que el dueño genera sus videos desde antes de que esto
// existiera. No genera el video: se lo entrega escrito para que lo pegue.
//
// ⚠ AQUÍ VIVIÓ `admin-video-generate`, que llamaba a Veo por API y devolvía el MP4. Se
// retiró el 2026-09-10 por decisión del dueño, y las tres razones importan porque cualquiera
// de ellas bastaba:
//
//   1. COSTABA PLATA REAL — US$0.10-0.15 por segundo. Un negocio que todavía no abre.
//   2. NUNCA SE CONFIGURÓ su `GEMINI_API_KEY`, así que jamás generó un solo video: llevaba
//      desde que se escribió respondiendo 503.
//   3. DUPLICABA UN PROCESO QUE YA EXISTE. El dueño genera sus videos en Google Flow, con
//      sus propios archivos de referencia de los hermanos. Un segundo camino que hace lo
//      mismo peor y cobrando no es una opción, es código que se mantiene para no usarse.
//
// Lo que sí se automatiza es lo que él SÍ usa: el prompt de Flow ahora viaja dentro del
// borrador semanal del calendario, para que no tenga ni que abrir esta pantalla.
import { ApiError } from "../types.ts";
import { requireAdmin } from "../session.ts";
import { loadCatalogPrices, SIG_DATA, SIG_GATES, SIG_LABEL, PROT_LABEL, TOP_LABEL, SAUCE_LABEL, BASE_LABEL } from "../catalog.ts";

// Los 8 segundos son el tope duro de Veo en Flow, no una decisión nuestra: el guion se
// escribe para ese largo porque es el que el dueño va a poder generar.
const VEO_MAX_SECONDS = 8;

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
  "no glossy plastic look";

// ── LA FICHA DE PERSONAJE, CONGELADA (2026-09-07) ─────────────────────────────────────
//
// POR QUÉ ESTO ESTABA MAL Y AHORA NO. Hasta hoy este generador producía prompts de comida
// SIN NADIE: literalmente terminaban en "No people's faces". Pero el dueño ya tiene a los
// dos hermanos creados en Flow y son el eje de toda la publicidad (`marca/LOS_HERMANOS.md`),
// y el calendario semanal —`marketingContent()` en actions/admin.ts— YA escribe sus guiones
// con los cinco formatos de los hermanos. O sea que había DOS generadores de guion que no se
// conocían: uno decía "EL PLEITO, los dos hermanos discuten" y el otro producía un macro sin
// cara. Dos fuentes de verdad para "qué hay que grabar esta semana".
//
// ⚠ EL ANCLA VA AL PRINCIPIO DEL PROMPT, LARGA Y SIN AMBIGÜEDAD. No es estilo: Flow pesa más
// lo que aparece primero, así que si la escena va antes que el personaje, la escena moldea al
// personaje y la identidad deriva (`FLUJO_VIDEO_ANUNCIOS.md` §1). Cada descriptor que se
// omita es un grado de libertad para que se desvíe del personaje que el dueño ya congeló.
//
// Los ocho archivos de referencia (frente, tres cuartos, perfil y cuerpo entero de cada uno)
// son la verdad y NO se regeneran nunca. Este texto los describe para que el prompt coincida
// con ellos; no los reemplaza.
const CALMADO =
  "THE CALM BROTHER: matte moss-green skin tone, heavy drooping eyelid, gaze cast downward, " +
  "straight mouth almost smiling, deliberate and slow — he measures before he moves";
const ALOCADO =
  "THE WILD BROTHER: sky-blue skin tone, one spiral eye wide open, open grin with teeth showing, " +
  "immediate and impulsive — he throws himself at it";

// Los hermanos son UNA SOLA CARA PARTIDA, no dos personajes que se encuentran. Y casi nunca
// comparten plano cerrado: está reportado que la identidad se degrada en Flow cuando dos
// personajes comparten primer plano o se tocan (FLUJO_VIDEO_ANUNCIOS.md §1).
const HERMANOS_RULE =
  "Consistent recurring characters, always the same two. Keep them in SEPARATE framings or a " +
  "split screen — they must not share a tight close-up and must not touch each other. " +
  "The calm brother stands for the SIGNATURES (closed recipes); the wild brother stands for " +
  "BUILD-YOUR-OWN (you choose). Neither is the punchline and neither is stupid.";

type VideoFormato = {
  key: string;
  letra: string;
  label: string;
  beats: string;
  muestraProducto: boolean;
  nota: string;
};

// ── LOS CINCO FORMATOS ────────────────────────────────────────────────────────────────
//
// Son los MISMOS cinco (A-E) que ya usa `marketingContent()` para el calendario semanal, con
// las mismas letras a propósito: así el borrador del lunes y el prompt que se pega en Flow
// hablan el mismo idioma en vez de proponer dos videos distintos.
//
// El formato no cambia; la historia sí. Es lo que hizo funcionar a Kevin the Carrot seis años.
export const FORMATOS: VideoFormato[] = [
  { key: "pleito", letra: "A", label: "EL PLEITO (principal)", muestraProducto: true,
    beats: "Split screen. LEFT: the calm brother adds ONE sauce, carefully. RIGHT: the wild brother " +
      "dumps five at once. No music, only the sound of the sauces. Then both finished sandwiches sit " +
      "side by side in the centre of frame — both look good, neither is a joke.",
    nota: "Es literalmente la estructura del menú: cada hermano encarna un modo de pedir. Por eso es el principal." },
  { key: "reto", letra: "B", label: "EL RETO DEL ALOCADO", muestraProducto: true,
    beats: "The wild brother is already mid-action, stacking far too much onto the roll. The calm " +
      "brother watches without saying a word. The finished sandwich is excessive but still clearly a sandwich.",
    nota: "⚠ Excesivo pero RECONOCIBLE: la comida que se ve típica genera más engagement que la rara." },
  { key: "receta", letra: "C", label: "LA RECETA DEL CALMADO", muestraProducto: true,
    beats: "Almost no dialogue. The calm brother builds the sandwich in order, tight on his hands, with " +
      "the real sound of bread and knife. The wild brother leans into frame at the very end and touches nothing.",
    nota: "El formato de textura y producto. Un Signature distinto cada vez que lo uses." },
  { key: "secreto", letra: "D", label: "EL SECRETO", muestraProducto: false,
    beats: "Dark. The wild brother leans toward camera about to reveal something; the calm brother covers " +
      "his mouth. Silence. THE PRODUCT IS NEVER SHOWN — it cannot be.",
    nota: "⚠ Úsalo POCO: lo \"interesante\" da un pico de conversación y no lo sostiene." },
  { key: "mesa", letra: "E", label: "LA MESA LARGA", muestraProducto: true,
    beats: "The only format where they collaborate. Different hands entering frame from both sides; the " +
      "brothers hand out different sandwiches without fighting. Overhead shot of the full table.",
    nota: "Para el pedido grupal y el QR de la bolsa." },
];

// Tratamientos de cámara. Antes eran los SEIS \"ángulos\" y eran el eje del prompt; ahora son
// un modificador del formato, porque quien manda es el personaje. Se conservan enteros: un
// macro del corte sigue siendo válido DENTRO de LA RECETA DEL CALMADO, que es el formato de
// textura.
type VideoAngle = {
  key: string;
  label: string;
  shot: string;
};
export const ANGLES: VideoAngle[] = [
  { key: "macro", label: "Macro del corte",
    shot: "extreme macro lens, shallow depth of field, slow push-in on the cross-section as the two halves separate" },
  { key: "steam", label: "Vapor y calor",
    shot: "side angle, backlit so steam is visible against a dark background, slow motion" },
  { key: "build", label: "Armado por capas",
    shot: "top-down overhead, locked-off camera, stop-motion feel as each ingredient lands in sequence" },
  { key: "pull", label: "Estirado de queso",
    shot: "close-up at 45 degrees, slow motion at 120fps, melted cheese stretching between the halves" },
  { key: "manos", label: "Plano de manos",
    shot: "handheld, natural window light, intimate framing, tight on the hands" },
  { key: "entrega", label: "Llegada del pedido",
    shot: "medium shot, warm evening light, doorway setting, a kraft paper bag handed over and opened" },
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

// Construye el prompt para FLOW a partir de datos REALES del catálogo, no de una descripción
// escrita a mano que se desactualiza cuando cambia una receta.
//
// EL ORDEN DE LAS LÍNEAS ES LA PARTE QUE IMPORTA: primero los personajes, después la escena.
// Flow pesa más lo que aparece primero; invertirlo hace que la escena moldee al personaje.
export function buildFlowPrompt(sigId: string, fmt: VideoFormato, angle: VideoAngle): string {
  const ing = ingredientsOf(sigId);
  const name = (SIG_LABEL[sigId] || sigId).split("//")[0].trim();
  const fillings = [ing.protein, ...ing.tops].join(", ").toLowerCase();
  const sauces = ing.sauces.join(" and ").toLowerCase();
  const partes = [
    // 1 · EL ANCLA. Va primero, completa, siempre.
    `${CALMADO}. ${ALOCADO}. ${HERMANOS_RULE}`,
    // 2 · El encargo.
    `Vertical 9:16 short ad, ${VEO_MAX_SECONDS} seconds, for an artisan sandwich shop.`,
    // 3 · La escena del formato elegido.
    `Scene: ${fmt.beats}`,
  ];
  // EL SECRETO no muestra el producto — y por eso tampoco recibe sus ingredientes: mandarlos
  // al modelo es la forma más fácil de que aparezcan en cuadro y quemen el menú secreto.
  if (fmt.muestraProducto) {
    partes.push(`The sandwich is ${name}: ${fillings}${sauces ? `, finished with ${sauces}` : ""}.`);
    partes.push(`${BREAD_RULE}.`);
    partes.push(`Camera treatment: ${angle.shot}.`);
  } else {
    partes.push("The product is never revealed on camera. Keep it out of frame entirely.");
  }
  partes.push(`${BRAND_RULE}.`);
  // El "//" en el mismo plano que la cara es la mitigación medida del efecto vampiro: que el
  // personaje se robe el recuerdo de la marca.
  partes.push('End frame: the "//" mark (two identical parallel slashes) in shot together with the characters.');
  partes.push("Ambient sound only, no music, no voiceover.");
  return partes.join(" ");
}

// Guion en español para el dueño (lo que verá y podrá ajustar) + el prompt en inglés para
// el modelo (los modelos de video responden bastante mejor en inglés).
// ── EL PROMPT DE FLOW, SIN QUE NADIE ABRA ESTA PANTALLA ───────────────────────────────
// El borrador semanal del calendario ya traía un `videoIdea` que es un guion RODABLE — con
// su formato, su duración y qué pasa en cada segundo. Lo que NO traía es lo único que hace
// falta para grabarlo: el prompt técnico que se pega en Google Flow, con las reglas de marca
// que impiden que el modelo dibuje una focaccia plana o unos hermanos que no son los suyos.
//
// Sin esto, el dueño tenía que abrir Admin // Video, elegir Signature y formato a mano, y
// copiar. Con esto, el prompt ya está escrito en el borrador de esa semana.
//
// ⚠ EL FORMATO NO SE ELIGE DOS VECES. Se LEE de la letra con la que ya empieza el guion
// ("A · EL PLEITO", "D · EL SECRETO"). Elegirlo aparte sería la forma de que el prompt diga
// un formato y el guion de al lado diga otro — dos fuentes para el mismo dato, el defecto
// que este repo ya pagó tres semanas con los precios.
//
// Y el Signature ROTA con la semana, salvo en EL SECRETO: ese formato no muestra el producto
// a propósito, así que le corresponde el menú secreto y ningún otro.
export function flowPromptSemanal(videoIdea: string, semana: number): string {
  const letra = (String(videoIdea || "").trim()[0] || "").toUpperCase();
  const fmt = FORMATOS.find((f) => f.letra === letra) || FORMATOS[0];
  const publicos = Object.keys(SIG_DATA).filter((id) => id !== "SIG05" && !SIG_GATES[id]);
  if (!publicos.length) return "";
  const n = Math.floor(Number(semana) || 0);
  const sigId = fmt.key === "secreto"
    ? (SIG_DATA["SIG05"] ? "SIG05" : publicos[0])
    : publicos[((n % publicos.length) + publicos.length) % publicos.length];
  const angle = ANGLES[((n % ANGLES.length) + ANGLES.length) % ANGLES.length];
  return buildFlowPrompt(sigId, fmt, angle);
}

export async function actAdminVideoScript(b: any) {
  const s = await requireAdmin(b.token);
  await loadCatalogPrices();
  const sigId = String(b.sigId || "").trim();
  if (!SIG_DATA[sigId]) throw new ApiError("Elige un Signature del menú.", 400);
  const angleKey = String(b.angle || "").trim();
  const angle = ANGLES.find((a) => a.key === angleKey) || ANGLES[Math.floor(Math.random() * ANGLES.length)];
  // El FORMATO es lo que manda ahora (quién actúa), y el ángulo pasó a ser cómo se filma
  // dentro de él. Por defecto EL PLEITO: es el principal a propósito — es literalmente la
  // estructura del menú, un hermano por cada modo de pedir.
  const fmtKey = String(b.formato || "").trim();
  const fmt = FORMATOS.find((f) => f.key === fmtKey) || FORMATOS[0];

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
    formato: { key: fmt.key, letra: fmt.letra, label: fmt.label },
    // Guion legible, para que el dueño sepa qué va a grabar antes de abrir Flow.
    guion: {
      duracion: `${VEO_MAX_SECONDS} segundos`,
      encuadre: "Vertical 9:16 (Reels / TikTok / Stories)",
      formato: `${fmt.letra} · ${fmt.label}`,
      personajes: "El calmado (Signatures) y el alocado (ARMA EL TUYO) — los dos de tu ficha congelada en Flow",
      accion: fmt.beats,
      // EL SECRETO no muestra el producto, así que enseñar sus ingredientes en el guion
      // invita a que se cuelen en cuadro. Un guion que se contradice a sí mismo se rompe
      // en la mesa de edición, no acá.
      plano: fmt.muestraProducto ? angle.shot : "No se muestra el producto — no se puede.",
      ingredientes: fmt.muestraProducto ? [ing.protein, ...ing.tops, ...ing.sauces].join(" · ") : "—",
      pan: fmt.muestraProducto ? ing.bread : "—",
      nota: fmt.nota,
    },
    flowPrompt: buildFlowPrompt(sigId, fmt, angle),
    caption,
    hashtags: "#sndwch #trujillo #delivery #sanguches #comidatrujillo",
    formatos: FORMATOS.map((f) => ({ key: f.key, letra: f.letra, label: f.label })),
    angles: ANGLES.map((a) => ({ key: a.key, label: a.label })),
    // El prompt sirve tal cual para Flow, que es lo que el dueño usa (decisión 2026-09-07).
    // `admin-video-generate` (Veo por API) sigue existiendo y sigue apagado sin la key.
    _nota: "Pega el prompt en Google Flow junto a tus 8 archivos de referencia de los hermanos. "
      + "El ancla de personaje va al principio a propósito: Flow pesa más lo que aparece primero.",
  };
}

