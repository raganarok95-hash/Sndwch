// EL CARRUSEL SALE COMPLETO Y EN ORDEN (2026-10-07).
//
// El perfil de Instagram arranca vacío y sus primeras publicaciones son carruseles («cómo se pide»,
// «la carta»). Modo de fallo: SILENCIO — si se pierde una lámina, se cambia el orden o el carrusel
// sale como una sola imagen, Meta no se queja: queda publicado mal, delante de cada cliente nuevo.
//
// Correr con: npm run test:api
import { contenedoresDeInstagram, loQueSaleSolo } from "../supabase/functions/api/actions/social.ts";

function assertEquals<T>(actual: T, expected: T, msg?: string) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error(msg ?? `esperaba ${JSON.stringify(expected)}, recibí ${JSON.stringify(actual)}`);
}
const URLS = ["https://x/1.jpg", "https://x/2.jpg", "https://x/3.jpg"];

Deno.test("un carrusel pide una lámina por contenedor, en el orden dado, y el padre lleva el texto", () => {
  const plan = contenedoresDeInstagram({ media_type: "image", image_url: URLS[0], datos: { laminas: URLS } }, "texto");
  assertEquals(plan.hijos.map((h) => h.image_url), URLS, "se perdió o se desordenó una lámina");
  assertEquals(plan.hijos.every((h) => h.is_carousel_item === "true"), true);
  assertEquals([plan.padre.media_type, plan.padre.caption], ["CAROUSEL", "texto"]);
});

Deno.test("una imagen sola sigue saliendo como imagen, y un video como Reel", () => {
  assertEquals(contenedoresDeInstagram({ media_type: "image", image_url: URLS[0] }, "t"), { hijos: [], padre: { image_url: URLS[0], caption: "t" } });
  assertEquals(contenedoresDeInstagram({ media_type: "video", video_url: "v.mp4" }, "t").padre.media_type, "REELS");
});

Deno.test("las piezas salen en el orden en que se cargaron", () => {
  assertEquals(new URLSearchParams(loQueSaleSolo("2026-10-12")).get("order"), "scheduled_date.asc,publicar_desde.asc.nullsfirst,created_at.asc");
});

// Una historia sale como historia: sin texto y sin hijos. Modo de fallo: SILENCIO — si sale como
// post, queda en el feed para siempre, delante de cada cliente nuevo.
Deno.test("una historia sale como STORIES, sin texto", () => {
  assertEquals(contenedoresDeInstagram({ formato: "historia", media_type: "image", image_url: URLS[0] }, "t"), { hijos: [], padre: { image_url: URLS[0], media_type: "STORIES" } });
  assertEquals(contenedoresDeInstagram({ formato: "historia", media_type: "video", video_url: "v.mp4" }, "t").padre.media_type, "STORIES");
});
