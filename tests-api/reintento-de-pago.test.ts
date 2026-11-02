// Volver de Culqi sin pagar y reintentar (dueño, 2026-11-02: «Ya abrió Culqi, ahora antes de culminar
// volví a la pantalla anterior manualmente, le di pagar y dejó de abrir culqi otra vez»).
//
// Promesa: el segundo intento libera la reserva del primero si esta NO cobró ('pending'), y se
// bloquea si hay un cobro en vuelo ('charging'). Modo de fallo: el cliente se quedaba 15 minutos sin
// poder pagar («Ya tienes un pedido en proceso de pago»), o —el caro— se liberaba una reserva que
// estaba cobrando y había dos cargos.
function assertEquals<T>(actual: T, expected: T, msg?: string) {
  if (!Object.is(actual, expected)) throw new Error(msg ?? `esperaba ${JSON.stringify(expected)}, recibí ${JSON.stringify(actual)}`);
}
Deno.env.set("SUPABASE_URL", "https://base.prueba");
Deno.env.set("SUPABASE_SERVICE_ROLE_KEY", "llave-de-prueba");
const { reintentoDePago, liberarReservaSinCobrar } = await import("../supabase/functions/api/actions/orders.ts");

Deno.test("reintentar con una reserva que no cobró la libera; con una cobrando, se bloquea", () => {
  assertEquals(reintentoDePago([]), "seguir");
  assertEquals(reintentoDePago([{ status: "pending" }]), "liberar");
  assertEquals(reintentoDePago([{ status: "pending" }, { status: "charging" }]), "bloquear");
  assertEquals(reintentoDePago([{ status: "charging" }]), "bloquear");
});

function simular(reserva: Record<string, unknown>) {
  const llamadas: { url: string; method: string }[] = [];
  const original = globalThis.fetch;
  globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
    const url = decodeURIComponent(String(input));
    const method = init?.method || "GET";
    llamadas.push({ url, method });
    const json = (b: unknown) => new Response(JSON.stringify(b), { status: 200 });
    if (url.includes("/pending_charges") && method === "PATCH") {
      const m = url.match(/status=eq\.([a-z]+)/);
      if (m && reserva.status !== m[1]) return json([]);
      reserva.status = JSON.parse(String(init!.body)).status;
      return json([reserva]);
    }
    return json([]);
  }) as typeof fetch;
  return { llamadas, restaurar: () => { globalThis.fetch = original; } };
}

Deno.test("liberar una reserva 'pending' la vence y devuelve el inventario y el código", async () => {
  const fila = { id: "r1", status: "pending", reserved_codes: ["P91"], reserved_qtys: [1], promo_code_id: "pc1", contact_phone: "987654321", ref: "ORD-1" };
  const s = simular(fila);
  try {
    assertEquals(await liberarReservaSinCobrar({ ...fila }), true);
    assertEquals(fila.status, "expired");
    assertEquals(s.llamadas.some((l) => l.url.includes("/rpc/restock_inventory")), true, "no devolvió el inventario");
    assertEquals(s.llamadas.some((l) => l.url.includes("/rpc/release_promo_redemption")), true, "no soltó el código");
  } finally { s.restaurar(); }
});

Deno.test("si la reserva empezó a cobrar entre la lectura y el reclamo, no se libera ni se repone", async () => {
  const fila = { id: "r1", status: "charging", reserved_codes: ["P91"], reserved_qtys: [1], ref: "ORD-1" };
  const s = simular(fila);
  try {
    assertEquals(await liberarReservaSinCobrar({ ...fila, status: "pending" }), false);
    assertEquals(fila.status, "charging");
    assertEquals(s.llamadas.some((l) => l.url.includes("/rpc/restock_inventory")), false, "repuso inventario de una reserva que cobraba");
  } finally { s.restaurar(); }
});
