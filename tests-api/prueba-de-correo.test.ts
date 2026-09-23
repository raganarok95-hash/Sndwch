// La PRUEBA DE CORREO no se puede presentar como una sesión, y al revés tampoco.
//
// POR QUÉ ESTE ARCHIVO. Al construir "entrar con correo y código de 6 dígitos" hubo que
// llevar un dato del servidor al servidor: "este correo ya se verificó", desde
// verify-login-code hasta register. Se firma con el MISMO HMAC que la sesión, porque
// inventar un segundo secreto es una llave más que rotar y otra que se puede olvidar.
//
// Ahí aparece el defecto que esta prueba fija: `verifyToken` parsea cualquier payload que
// venga bien firmado. Una prueba de correo está bien firmada. Sin un corte explícito,
// presentarla como token de sesión NO falla — entra, y `payload.phone` queda `undefined`,
// que es mucho peor que un rechazo porque sigue de largo en silencio. Es exactamente el
// modo de fallo que el repo persigue: nada revienta, solo deja de proteger.
//
// El corte es la línea `if (payload.k) return null` de verifyToken. Esta prueba existe para
// que nadie la borre por "no hacer nada".
function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg);
}
function assertEquals<T>(actual: T, expected: T, msg?: string) {
  if (!Object.is(actual, expected)) {
    throw new Error(msg ?? `esperaba ${JSON.stringify(expected)}, recibí ${JSON.stringify(actual)}`);
  }
}

// El secreto tiene que existir ANTES de importar session.ts: env.ts lo lee al cargarse.
Deno.env.set("SESSION_SECRET", "secreto-de-prueba-no-usar-en-produccion");
const { signToken, verifyToken, signEmailProof, verifyEmailProof } = await import(
  "../supabase/functions/api/session.ts"
);

Deno.test("una prueba de correo NO pasa como token de sesión", async () => {
  const proof = await signEmailProof("ana@ejemplo.com");
  assertEquals(
    await verifyToken(proof),
    null,
    "verifyToken aceptó una prueba de correo — sin ese corte, `phone` llega undefined y la petición sigue de largo",
  );
});

Deno.test("un token de sesión NO pasa como prueba de correo", async () => {
  const token = await signToken({ phone: "999888777", isAdmin: true, exp: Date.now() / 1000 + 600, v: 1 });
  assertEquals(await verifyEmailProof(token), null, "verifyEmailProof aceptó un token de sesión");
});

Deno.test("la prueba de correo devuelve el correo, normalizado", async () => {
  const proof = await signEmailProof("  ANA@Ejemplo.COM  ");
  assertEquals(await verifyEmailProof(proof), "ana@ejemplo.com");
});

Deno.test("una prueba de correo manipulada no vale", async () => {
  const proof = await signEmailProof("ana@ejemplo.com");
  const [payload, firma] = proof.split(".");
  // Mismo payload, un byte cambiado en la firma.
  const rota = payload + "." + (firma.slice(0, -1) + (firma.slice(-1) === "A" ? "B" : "A"));
  assertEquals(await verifyEmailProof(rota), null, "aceptó una firma alterada");
  // Y al revés: payload cambiado (otro correo), firma original.
  const otro = btoa(JSON.stringify({ k: "email", email: "otro@ejemplo.com", exp: Date.now() / 1000 + 600 }))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  assertEquals(await verifyEmailProof(otro + "." + firma), null, "aceptó un correo cambiado con la firma de otro");
});

Deno.test("una prueba de correo vencida no vale", async () => {
  const { signEmailProof: _s } = await import("../supabase/functions/api/session.ts");
  // Se arma a mano con exp en el pasado: firmarla de verdad es el punto — lo que tiene que
  // rechazarla es la fecha, no la firma.
  const payload = { k: "email", email: "ana@ejemplo.com", exp: Date.now() / 1000 - 1 };
  const p = btoa(JSON.stringify(payload)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode("secreto-de-prueba-no-usar-en-produccion"),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(p)));
  let bin = ""; sig.forEach((b) => (bin += String.fromCharCode(b)));
  const s = btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  assert(_s !== undefined, "signEmailProof tiene que seguir exportada");
  assertEquals(await verifyEmailProof(`${p}.${s}`), null, "aceptó una prueba vencida");
});
