// Un aviso al dueño (pedido nuevo, Yape por confirmar, pedido trabado) nunca se pierde en silencio.
//
// POR QUÉ ESTE ARCHIVO. El 2026-10-15, a cinco días de abrir, la base tenía 0 suscripciones push
// del dueño. sendPushToAdmins buscaba sus celulares, no encontraba ninguno y terminaba sin hacer
// nada: ni un error ni un registro. El panel solo suena si está abierto y en primer plano, así
// que con el celular bloqueado un pedido podía esperar sin que nadie se enterara. Es el modo de
// fallo que más cuesta: plata (el pedido se enfría o se cancela) y sin nada a la vista.
//
// La promesa: sin un celular suscrito (o sin la llave VAPID), el aviso va al correo de las
// cuentas admin; con un celular suscrito, solo push; y si no hay ningún canal, queda escrito en
// debug_logs.
function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg);
}
function assertEquals<T>(actual: T, expected: T, msg?: string) {
  if (!Object.is(actual, expected)) {
    throw new Error(msg ?? `esperaba ${JSON.stringify(expected)}, recibí ${JSON.stringify(actual)}`);
  }
}

// env.ts lee las variables al cargarse: tienen que existir ANTES de importar push.ts.
Deno.env.set("RESEND_API_KEY", "re_prueba");
Deno.env.set("VAPID_PRIVATE_KEY", "A".repeat(43)); // 32 bytes en base64url: formato válido, llave falsa
const { canalDelAvisoAlDueno, sendPushToAdmins } = await import("../supabase/functions/api/push.ts");

Deno.test("el canal: push solo con un celular suscrito Y la llave VAPID; si no, correo", () => {
  assertEquals(canalDelAvisoAlDueno(1, true), "push");
  assertEquals(canalDelAvisoAlDueno(0, true), "correo", "sin celular suscrito el aviso no puede quedarse en push");
  assertEquals(canalDelAvisoAlDueno(2, false), "correo", "sin llave VAPID el push no sale: tiene que ir por correo");
  assertEquals(canalDelAvisoAlDueno(0, false), "correo");
});

type Llamada = { url: string; method: string; body: any };
// Simula PostgREST y Resend. `subs` son las suscripciones push del admin; `correo` el de su cuenta.
function simular(opts: { subs: unknown[]; correo: string | null }) {
  const llamadas: Llamada[] = [];
  const original = globalThis.fetch;
  globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method || "GET";
    const body = init?.body ? JSON.parse(String(init.body)) : null;
    llamadas.push({ url, method, body });
    const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status });
    if (url.includes("api.resend.com")) return json({ id: "correo-1" });
    if (url.includes("/admin_accounts")) return json([{ phone: "999888777" }]);
    if (url.includes("/push_subscriptions")) return json(opts.subs);
    if (url.includes("/customers")) return json(opts.correo ? [{ email: opts.correo }] : [{ email: null }]);
    if (url.includes("/debug_logs")) return json([], 201);
    return json([]);
  }) as typeof fetch;
  return { llamadas, restaurar: () => (globalThis.fetch = original) };
}
const aviso = { title: "Nuevo pedido SW-1 🥪", body: "Ana — S/25.90", tag: "sndwch-new-order-SW-1" };

Deno.test("sin celular suscrito, el pedido nuevo le llega al dueño por correo", async () => {
  const s = simular({ subs: [], correo: "dueno@ejemplo.com" });
  try {
    await sendPushToAdmins(aviso);
  } finally {
    s.restaurar();
  }
  const correos = s.llamadas.filter((l) => l.url.includes("api.resend.com"));
  assertEquals(correos.length, 1, "no salió el correo: el aviso se perdió en silencio");
  assertEquals(correos[0].body.to.join(","), "dueno@ejemplo.com");
  assertEquals(correos[0].body.subject, aviso.title, "el asunto tiene que ser el mismo título del aviso");
});

Deno.test("sin celular suscrito y sin correo, queda escrito en debug_logs (nunca silencio)", async () => {
  const s = simular({ subs: [], correo: null });
  try {
    await sendPushToAdmins(aviso);
  } finally {
    s.restaurar();
  }
  const registro = s.llamadas.find((l) => l.url.includes("/debug_logs") && l.method === "POST");
  assert(registro, "sin ningún canal el aviso no dejó rastro");
  assert(String(JSON.stringify(registro!.body)).includes("sin canal"), "el registro no dice que el aviso se quedó sin canal");
});

Deno.test("con un celular suscrito va solo por push: ningún correo por pedido", async () => {
  const s = simular({ subs: [{ id: 1, endpoint: "https://push.ejemplo/abc", p256dh: "x", auth: "y" }], correo: "dueno@ejemplo.com" });
  try {
    await sendPushToAdmins(aviso);
  } finally {
    s.restaurar();
  }
  assertEquals(s.llamadas.filter((l) => l.url.includes("api.resend.com")).length, 0, "mandó correo aunque hay un celular suscrito");
});
