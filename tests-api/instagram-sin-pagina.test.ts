// INSTAGRAM SIN PÁGINA DE FACEBOOK (dueño, 2026-11-02: «He intentado todo para instagram y no funciona, busca formas»).
//
// Promesa: con INSTAGRAM_LOGIN_TOKEN, Instagram se publica por graph.instagram.com (la puerta que no pide
// página vinculada): cuenta del token, contenedor y publicación, todo por ahí. Modo de fallo: silencio —
// si alguna llamada se fuera a graph.facebook.com, volvería el «la página no tiene un Instagram
// vinculado» y no saldría ningún post.
import { publicarConInstagramLogin } from "../supabase/functions/api/actions/social.ts";

function assertEquals<T>(actual: T, expected: T, msg?: string) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error(msg ?? `esperaba ${JSON.stringify(expected)}, recibí ${JSON.stringify(actual)}`);
}

Deno.test("con el token de Instagram, una foto se publica entera por graph.instagram.com", async () => {
  const llamadas: string[] = [];
  const original = globalThis.fetch;
  globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);
    llamadas.push(`${init?.method || "GET"} ${url.split("?")[0]}`);
    const json = (b: unknown) => new Response(JSON.stringify(b), { status: 200 });
    if (url.includes("/me?")) return json({ user_id: "1784", username: "snd__wch" });
    if (url.endsWith("/media_publish")) return json({ id: "post_1" });
    if (url.endsWith("/media")) return json({ id: "cont_1" });
    return json({});
  }) as typeof fetch;
  try {
    const id = await publicarConInstagramLogin({ channel: "instagram", media_type: "image", image_url: "https://x/1.jpg" }, "texto", false, "tok_prueba");
    assertEquals(id, "post_1");
    assertEquals(llamadas.every((l) => l.includes("https://graph.instagram.com/")), true, "alguna llamada no fue por graph.instagram.com: " + llamadas.join(" | "));
    assertEquals(llamadas.some((l) => l.startsWith("POST") && l.endsWith("/1784/media")), true, "no creó el contenedor en la cuenta del token");
    assertEquals(llamadas.some((l) => l.startsWith("POST") && l.endsWith("/1784/media_publish")), true, "no publicó");
  } finally {
    globalThis.fetch = original;
  }
});
