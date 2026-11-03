// EL TOKEN DE INSTAGRAM SE RENUEVA SOLO (dueño, 2026-11-02: «Apruebo los tres cambios»).
//
// Promesa: cada domingo se cambia el token de 60 días por uno nuevo y se guarda; publicar usa el
// guardado. Modo de fallo: silencio. Si la renovación no guardara el token nuevo, o publicar
// siguiera usando el viejo, a los 60 días Instagram dejaría de publicar sin que nadie se entere.
import { renovarTokenDeInstagram } from "../supabase/functions/api/actions/social.ts";

function assertEquals<T>(actual: T, expected: T, msg?: string) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error(msg ?? `esperaba ${JSON.stringify(expected)}, recibí ${JSON.stringify(actual)}`);
}

Deno.test("la renovación pide ig_refresh_token con el token vigente y devuelve el nuevo con su vencimiento", async () => {
  let pedida = "";
  const original = globalThis.fetch;
  globalThis.fetch = (async (input: string | URL | Request) => {
    pedida = String(input);
    return new Response(JSON.stringify({ access_token: "tok_nuevo", token_type: "bearer", expires_in: 5184000 }), { status: 200 });
  }) as typeof fetch;
  try {
    const antes = Date.now();
    const r = await renovarTokenDeInstagram("tok_viejo");
    const u = new URL(pedida);
    assertEquals(u.origin + u.pathname, "https://graph.instagram.com/refresh_access_token");
    assertEquals(u.searchParams.get("grant_type"), "ig_refresh_token");
    assertEquals(u.searchParams.get("access_token"), "tok_viejo");
    assertEquals(r.token, "tok_nuevo");
    const dias = (Date.parse(r.expires_at!) - antes) / 86400000;
    assertEquals(dias > 59.9 && dias < 60.1, true, `vence en ${dias} días, esperaba 60`);
  } finally {
    globalThis.fetch = original;
  }
});

Deno.test("si Instagram no devuelve token, la renovación falla en voz alta", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = (async () => new Response(JSON.stringify({ error: { message: "Session has expired" } }), { status: 400 })) as typeof fetch;
  try {
    let fallo = false;
    try { await renovarTokenDeInstagram("tok_vencido"); } catch (_) { fallo = true; }
    assertEquals(fallo, true, "una renovación rechazada no puede pasar como buena");
  } finally {
    globalThis.fetch = original;
  }
});

// Promesa: si el token de Instagram quedó guardado como META_PAGE_ACCESS_TOKEN, igual se usa.
// Modo de fallo: silencio, con el token puesto y la app diciendo que no hay.
import { tokenDeInstagramEnElEntorno } from "../supabase/functions/api/env.ts";
Deno.test("un token de Instagram guardado en el secret de la página se reconoce por su forma", () => {
  assertEquals(tokenDeInstagramEnElEntorno(undefined, " IGAAxyz "), "IGAAxyz");
  assertEquals(tokenDeInstagramEnElEntorno(undefined, "EAAxyz"), undefined, "un token de página de Facebook no es de Instagram");
  assertEquals(tokenDeInstagramEnElEntorno("IGAAuno", "IGAAdos"), "IGAAuno", "el secret con su nombre manda");
});
