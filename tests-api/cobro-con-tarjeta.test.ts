// Un cobro hecho en Culqi nunca puede volver a cobrarse ni quedarse sin pedido.
//
// POR QUÉ ESTE ARCHIVO. Tras cobrar, create-charge devolvía la reserva de 'charging' a
// 'pending' — el mismo estado que significa "todavía no pagó". Eso tenía dos salidas malas,
// ninguna con una excepción a la vista:
//   · si la respuesta del cobro se perdía en la red, el cliente veía "Error de conexión.
//     Intenta de nuevo", reintentaba, la reserva estaba otra vez 'pending'... y se le
//     cobraba DOS veces;
//   · si el PATCH de vuelta a 'pending' fallaba (su error se tragaba), la reserva quedaba
//     'charging' con el dinero cobrado: la confirmación decía "ya fue procesado" y el cron
//     la expiraba como si nadie hubiera pagado.
// Y la confirmación miraba el vencimiento ANTES de verificar el cargo: un pago hecho en el
// último segundo recibía "Tu reserva expiró. Vuelve a intentar tu pedido".
//
// Es el mismo defecto que tuvo el pedido grupal: un guard escrito para UN estado deja afuera
// a otro camino legítimo que llega con un estado distinto.
function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg);
}
function assertEquals<T>(actual: T, expected: T, msg?: string) {
  if (!Object.is(actual, expected)) {
    throw new Error(msg ?? `esperaba ${JSON.stringify(expected)}, recibí ${JSON.stringify(actual)}`);
  }
}

const { claimAndChargeCulqi } = await import("../supabase/functions/_shared/culqi-claim.ts");
const { destinoDeReservaCobrada, RESERVA_CONFIRMABLE } = await import("../supabase/functions/api/actions/orders.ts");

// ── Qué se hace con una reserva cuando Culqi YA certificó el cobro ─────────────────────

Deno.test("una reserva cobrada se confirma aunque esté 'charging' o 'charged', no solo 'pending'", () => {
  for (const s of ["pending", "charging", "charged"]) {
    assertEquals(destinoDeReservaCobrada(s), "crear", `'${s}' con el cargo certificado tiene que crear el pedido`);
  }
});

Deno.test("una reserva ya consumida devuelve el pedido existente, no un error", () => {
  assertEquals(destinoDeReservaCobrada("consumed"), "ya-existe");
});

Deno.test("una reserva vencida o cancelada con cobro real es un cobro sin pedido, no un 'vuelve a intentar'", () => {
  assertEquals(destinoDeReservaCobrada("expired"), "cobro-sin-pedido");
  assertEquals(destinoDeReservaCobrada("cancelled"), "cobro-sin-pedido");
});

Deno.test("la lista de estados confirmables es la que usa el reclamo atómico", () => {
  assertEquals(RESERVA_CONFIRMABLE.join(","), "pending,charging,charged");
});

// ── El cobro compartido, con Supabase y Culqi simulados ────────────────────────────────

type Llamada = { url: string; method: string; body: any };

// Simula PostgREST + Culqi. `reserva` es la fila tal como está en la base; los PATCH la
// modifican de verdad respetando el filtro de estado de la URL, igual que la base.
function simular(reserva: Record<string, unknown>, opts: { culqiOk?: boolean; marcarFalla?: boolean } = {}) {
  const llamadas: Llamada[] = [];
  const original = globalThis.fetch;
  globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method || "GET";
    const body = init?.body ? JSON.parse(String(init.body)) : null;
    llamadas.push({ url, method, body });
    const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status });

    if (url.includes("api.culqi.com")) {
      return opts.culqiOk === false
        ? json({ user_message: "Tarjeta rechazada" }, 402)
        : json({ id: "chr_nuevo", outcome: { type: "venta_exitosa" } });
    }
    if (url.includes("/debug_logs")) return json([], 201);

    const filtro = decodeURIComponent(url);
    const estadoOk = (() => {
      const eq = filtro.match(/status=eq\.([a-z]+)/);
      if (eq) return reserva.status === eq[1];
      const inn = filtro.match(/status=in\.\(([a-z,]+)\)/);
      if (inn) return inn[1].split(",").includes(String(reserva.status));
      return true;
    })();
    if (method === "GET") return json(estadoOk ? [{ ...reserva }] : []);
    if (method === "PATCH") {
      if (body?.status === "charged" && opts.marcarFalla) return json({ message: "caído" }, 503);
      if (!estadoOk) return json([]);
      Object.assign(reserva, body);
      return json([{ ...reserva }]);
    }
    return json([]);
  }) as typeof fetch;
  return { llamadas, restaurar: () => (globalThis.fetch = original) };
}

const cfg = {
  sbUrl: "https://sb.test",
  serviceKey: "k",
  culqiSecretKey: "sk",
  table: "pending_charges",
  amountField: "expected_total",
  refValue: "SW-1",
  amountCents: 2590,
  email: "a@b.pe",
  token: "tkn",
  description: "d",
  metadataKey: "order_ref",
  source: "create-charge",
  notFoundMsg: "no encontrada",
  expiredMsg: "venció",
  mismatchMsg: "monto",
  conflictMsg: "en curso",
};
const enDiezMinutos = () => new Date(Date.now() + 600000).toISOString();

Deno.test("tras cobrar, la reserva queda 'charged' con el id del cargo — NO vuelve a 'pending'", async () => {
  const reserva = { id: "r1", status: "pending", expected_total: 25.9, expires_at: enDiezMinutos(), charge_id: null };
  const sim = simular(reserva);
  try {
    const r = await claimAndChargeCulqi(cfg);
    assert(r.ok, "el cobro debía salir bien");
    assertEquals(reserva.status, "charged", "si vuelve a 'pending', un reintento cobra otra vez");
    assertEquals(reserva.charge_id, "chr_nuevo", "sin el id del cargo, nadie puede crear el pedido después");
  } finally {
    sim.restaurar();
  }
});

Deno.test("un reintento sobre una reserva ya cobrada devuelve ESE cargo y no llama a Culqi", async () => {
  const reserva = { id: "r1", status: "charged", expected_total: 25.9, expires_at: enDiezMinutos(), charge_id: "chr_viejo" };
  const sim = simular(reserva);
  try {
    const r = await claimAndChargeCulqi(cfg);
    assert(r.ok && r.chargeId === "chr_viejo", `debía devolver el cargo existente, devolvió ${JSON.stringify(r)}`);
    const aCulqi = sim.llamadas.filter((l) => l.url.includes("api.culqi.com"));
    assertEquals(aCulqi.length, 0, "llamar a Culqi acá es cobrarle dos veces al mismo cliente");
  } finally {
    sim.restaurar();
  }
});

Deno.test("una reserva cobrada no 'vence' para el reintento: se devuelve el cargo aunque haya pasado la hora", async () => {
  const hace = new Date(Date.now() - 60000).toISOString();
  const reserva = { id: "r1", status: "charged", expected_total: 25.9, expires_at: hace, charge_id: "chr_viejo" };
  const sim = simular(reserva);
  try {
    const r = await claimAndChargeCulqi(cfg);
    assert(r.ok, "responder 'venció' a quien ya pagó es invitarlo a pagar de nuevo");
  } finally {
    sim.restaurar();
  }
});

Deno.test("si anotar el cobro falla, igual se responde éxito — el cobro es real — y queda rastro", async () => {
  const reserva = { id: "r1", status: "pending", expected_total: 25.9, expires_at: enDiezMinutos(), charge_id: null };
  const sim = simular(reserva, { marcarFalla: true });
  try {
    const r = await claimAndChargeCulqi(cfg);
    assert(r.ok && r.chargeId === "chr_nuevo", "decirle 'falló' a quien ya pagó lo manda a pagar de nuevo");
    assertEquals(reserva.status, "charging", "la reserva queda 'charging', que la confirmación también acepta");
    const rastro = sim.llamadas.some((l) => l.url.includes("/debug_logs") && l.body?.detail?.event === "mark-charged-failed");
    assert(rastro, "un fallo al anotar un cobro real no puede pasar en silencio");
  } finally {
    sim.restaurar();
  }
});

Deno.test("si Culqi rechaza, la reserva se libera para otro intento — no se cobró nada", async () => {
  const reserva = { id: "r1", status: "pending", expected_total: 25.9, expires_at: enDiezMinutos(), charge_id: null };
  const sim = simular(reserva, { culqiOk: false });
  try {
    const r = await claimAndChargeCulqi(cfg);
    assert(!r.ok, "un rechazo no es un éxito");
    assertEquals(reserva.status, "pending");
    assertEquals(reserva.charge_id, null);
  } finally {
    sim.restaurar();
  }
});
