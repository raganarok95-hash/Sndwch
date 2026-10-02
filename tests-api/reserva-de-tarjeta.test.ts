// La reserva de un pago con tarjeta (prepare-order → pending_charges), 2026-10-02.
//
// POR QUÉ EXISTE. Se esparció en la fila la atribución de Meta (fbp, fbc, clientUserAgent,
// groupCode), que no son columnas. PostgREST rechazaba la fila y TODO pago con tarjeta terminaba
// en «Error interno del servidor» antes de abrir Culqi, dos días, sin una prueba que lo viera.
// Modo de fallo: el cliente no puede pagar con tarjeta y se va.
//
// Correr con: npm run test:api
const { filaDeReserva } = await import("../supabase/functions/api/actions/orders.ts");

function assert(cond: unknown, msg: string) { if (!cond) throw new Error(msg); }

const esquema = await Deno.readTextFile(new URL("../supabase/esquema-actual.sql", import.meta.url));
const tabla = esquema.slice(esquema.indexOf("create table public.pending_charges ("));
const cuerpo = tabla.slice(0, tabla.indexOf("\n);"));
const columnas = new Set([...cuerpo.matchAll(/^\s+([a-z_]+)\s+[a-z]/gm)].map((m) => m[1]));

Deno.test("la fila de la reserva solo lleva columnas que existen en pending_charges", () => {
  assert(columnas.has("expected_total") && columnas.has("lat"), "no se leyó el esquema de pending_charges");
  // Lo que el checkout manda de verdad: coordenadas Y la atribución de Meta.
  const cuerpoDelCliente = { lat: -8.1, lon: -79.0, fbp: "fb.1", fbc: "fb.2", ua: "Mozilla", groupCode: "ABC" };
  const fila = filaDeReserva({ ref: "R" }, cuerpoDelCliente);
  const sobran = Object.keys(fila).filter((k) => !columnas.has(k));
  assert(sobran.length === 0, "columnas que no existen: " + sobran.join(", "));
});

Deno.test("los campos que arma prepare-order para la reserva existen todos", async () => {
  const codigo = await Deno.readTextFile(new URL("../supabase/functions/api/actions/orders.ts", import.meta.url));
  const i = codigo.indexOf('sbInsert("pending_charges", filaDeReserva({');
  assert(i > 0, "prepare-order ya no arma la reserva con filaDeReserva");
  const literal = codigo.slice(i, codigo.indexOf("}, b))", i));
  const claves = [...literal.matchAll(/^\s+([a-z_]+)(?::|,)/gm)].map((m) => m[1]);
  assert(claves.length > 10, "no se leyeron las claves de la reserva");
  const sobran = claves.filter((k) => !columnas.has(k));
  assert(sobran.length === 0, "columnas que no existen: " + sobran.join(", "));
});
