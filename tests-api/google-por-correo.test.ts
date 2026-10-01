// «CONTINUAR CON GOOGLE» RECONOCE LA CUENTA POR SU CORREO VERIFICADO (dueño, 2026-10-01: «no
// veo que se ingrese en automático con el proceso de Google»). La cuenta del dueño tenía
// teléfono y PIN, sin google_id: Google lo mandaba a «completa tu cuenta», donde el teléfono ya
// estaba tomado, y se quedaba afuera. Ahora una cuenta con ESE correo se vincula la primera vez.
// Modo de fallo: SILENCIO hacia los dos lados — no vincular deja a alguien afuera sin error, y
// vincular con un correo NO verificado le daría a cualquiera la cuenta de otro.
function assertEquals(actual: unknown, expected: unknown, msg?: string) {
  const a = JSON.stringify(actual), e = JSON.stringify(expected);
  if (a !== e) throw new Error(msg ?? `esperaba ${e}, recibí ${a}`);
}
Deno.env.set("SESSION_SECRET", "secreto-de-prueba-no-usar-en-produccion");
Deno.env.set("GOOGLE_CLIENT_ID", "cliente-de-prueba");
Deno.env.set("SUPABASE_URL", "https://base.prueba");
Deno.env.set("SUPABASE_SERVICE_ROLE_KEY", "llave-de-prueba");
const { actGoogleAuth } = await import("../supabase/functions/api/actions/auth.ts");

type Fila = Record<string, unknown>;
function simular(google: Fila, filas: Fila[]) {
  const parches: { url: string; body: Fila }[] = [];
  const original = globalThis.fetch;
  globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input instanceof Request ? input.url : input);
    if (url.includes("tokeninfo")) return new Response(JSON.stringify({ aud: "cliente-de-prueba", ...google }), { status: 200 });
    if (url.includes("/rest/v1/customers")) {
      if ((init?.method || "GET") === "PATCH") { parches.push({ url, body: JSON.parse(String(init!.body)) }); return new Response("[]", { status: 200 }); }
      const u = decodeURIComponent(url);
      const m = u.match(/google_id=eq\.([^&]+)/), e = u.match(/email=eq\.([^&]+)/), sinG = u.includes("google_id=is.null");
      const r = filas.filter((f) => (!m || f.google_id === m[1]) && (!e || f.email === e[1]) && (!sinG || !f.google_id));
      return new Response(JSON.stringify(r), { status: 200 });
    }
    if (url.includes("/rest/v1/admin_accounts")) return new Response(JSON.stringify(filas.filter((f) => f.admin).map((f) => ({ phone: f.phone }))), { status: 200 });
    return new Response("[]", { status: 200 });
  }) as typeof fetch;
  return { parches, restaurar: () => { globalThis.fetch = original; } };
}
const DUENO = { phone: "900000001", name: "Dueño", email: "dueno@ejemplo.com", google_id: null, admin: true, session_version: 1 };

Deno.test("correo verificado de una cuenta sin Google: entra directo, como admin, y queda vinculada", async () => {
  const s = simular({ sub: "g-123", email: "dueno@ejemplo.com", email_verified: "true" }, [DUENO]);
  try {
    const r: any = await actGoogleAuth({ idToken: "tok" });
    assertEquals(r.needsRegistration, undefined, "lo mandó a registrarse");
    assertEquals(r.isAdmin, true);
    assertEquals(typeof r.token, "string");
    assertEquals(s.parches.length, 1, "no vinculó el google_id");
    assertEquals(s.parches[0].body, { google_id: "g-123" });
  } finally { s.restaurar(); }
});

Deno.test("correo NO verificado por Google: no se vincula a nada", async () => {
  const s = simular({ sub: "g-999", email: "dueno@ejemplo.com", email_verified: "false" }, [DUENO]);
  try {
    const r: any = await actGoogleAuth({ idToken: "tok" });
    assertEquals(r.needsRegistration, true);
    assertEquals(s.parches.length, 0, "vinculó con un correo sin verificar");
  } finally { s.restaurar(); }
});

Deno.test("una cuenta que ya tiene OTRA cuenta de Google no se toma por el correo", async () => {
  const s = simular({ sub: "g-otro", email: "dueno@ejemplo.com", email_verified: true }, [{ ...DUENO, google_id: "g-123" }]);
  try {
    const r: any = await actGoogleAuth({ idToken: "tok" });
    assertEquals(r.needsRegistration, true);
    assertEquals(s.parches.length, 0);
  } finally { s.restaurar(); }
});

Deno.test("sin cuenta con ese correo: sigue a completar la cuenta, como antes", async () => {
  const s = simular({ sub: "g-new", email: "nueva@ejemplo.com", email_verified: true, name: "Nueva" }, [DUENO]);
  try {
    const r: any = await actGoogleAuth({ idToken: "tok" });
    assertEquals(r.needsRegistration, true);
    assertEquals(r.prefill.email, "nueva@ejemplo.com");
  } finally { s.restaurar(); }
});
