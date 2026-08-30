// Pruebas de las tres señales de dirección de la cola (#21 ambigua, #22 duplicada,
// #17 cercanía), sobre el código real del servidor.
//
// POR QUÉ EXISTE. Las tres se equivocan hacia el lado caro sin producir ningún error.
// Un falso positivo enseña a ignorar el aviso —y entonces el día que la dirección de verdad
// está incompleta tampoco se mira—; un falso negativo manda al motorizado a dar vueltas o
// paga dos viajes a la misma puerta. Y la comparación de direcciones es texto libre escrito
// por gente con prisa: "Av. España 123" y "av espana 123" son la misma puerta.
//
// Correr con: npm run test:api
function assertEquals<T>(actual: T, expected: T, msg?: string) {
  if (!Object.is(actual, expected)) {
    throw new Error(msg ?? `esperaba ${JSON.stringify(expected)}, recibí ${JSON.stringify(actual)}`);
  }
}
import { normalizeAddress, addressIssues, queueAddressFlags } from "../supabase/functions/api/actions/orders.ts";

// ── #22: la misma puerta escrita de dos formas ─────────────────────────────────────────

Deno.test("la misma dirección escrita distinto se reconoce igual", () => {
  assertEquals(normalizeAddress("Av. España 123"), normalizeAddress("AVENIDA ESPAÑA 123"));
  assertEquals(normalizeAddress("Jr. Pizarro 456"), normalizeAddress("jiron pizarro 456"));
  assertEquals(normalizeAddress("Ca. Bolívar  789 "), normalizeAddress("calle bolivar 789"));
  assertEquals(normalizeAddress("Av. Larco Nro 100"), normalizeAddress("avenida larco 100"));
});

Deno.test("dos direcciones distintas NO se confunden", () => {
  // El falso positivo acá haría juntar dos pedidos de personas distintas en un solo viaje.
  const a = normalizeAddress("Av. España 123");
  assertEquals(a === normalizeAddress("Av. España 124"), false);
  assertEquals(a === normalizeAddress("Jr. España 123"), false);
});

Deno.test("detecta dos pedidos a la misma puerta aunque estén escritos distinto", () => {
  const f = queueAddressFlags([
    { ref: "A", customer_address: "Av. España 123, dpto 4", delivery_zone: "cerca", created_at: "2026-09-10T18:00:00Z" },
    { ref: "B", customer_address: "AVENIDA ESPAÑA 123, DPTO 4", delivery_zone: "cerca", created_at: "2026-09-10T18:05:00Z" },
    { ref: "C", customer_address: "Jr. Pizarro 900, frente al parque", delivery_zone: "media", created_at: "2026-09-10T18:07:00Z" },
  ], 45);
  assertEquals(f.duplicates.length, 1);
  assertEquals(f.duplicates[0].refs.join(","), "A,B");
});

Deno.test("un solo pedido por dirección no es un duplicado", () => {
  const f = queueAddressFlags([
    { ref: "A", customer_address: "Av. España 123, dpto 4", delivery_zone: "cerca", created_at: "2026-09-10T18:00:00Z" },
  ], 45);
  assertEquals(f.duplicates.length, 0);
});

// ── #21: dirección que el motorizado no va a encontrar ─────────────────────────────────

Deno.test("una dirección sin número de puerta se marca", () => {
  assertEquals(addressIssues("Avenida Larco, Trujillo", false).includes("sin número de puerta"), true);
});

Deno.test("una dirección con número y referencia NO se marca", () => {
  // El falso positivo es lo que mata este aviso: si salta en direcciones buenas, deja de
  // mirarse antes del día que salta en una mala.
  assertEquals(addressIssues("Av. España 123, frente al colegio, casa azul", false).length, 0);
});

Deno.test("con el pin del mapa no se exige referencia", () => {
  // El cliente ya dio coordenadas exactas: pedirle una referencia además es fricción por
  // un problema que ya no existe.
  assertEquals(addressIssues("Av. Larco 450", true).length, 0);
  assertEquals(addressIssues("Av. Larco 450", false).includes("sin referencia"), true);
});

Deno.test("una dirección de dos palabras se marca como demasiado corta", () => {
  const r = addressIssues("Mi casa", false);
  assertEquals(r.includes("demasiado corta"), true);
});

Deno.test("un nombre de calle con número no cuenta como número de puerta", () => {
  // "Av. 28 de Julio" tiene dígitos pero no dice en qué casa. Contarlo como número de
  // puerta es el falso negativo que manda al motorizado a recorrer la avenida entera.
  assertEquals(addressIssues("Avenida 28 de Julio, Trujillo", false).includes("sin número de puerta"), true);
});

Deno.test("los motivos se devuelven por separado, no como un sí/no", () => {
  // "Sin número" y "sin referencia" se arreglan con preguntas distintas al cliente.
  const r = addressIssues("Por Larco", false);
  assertEquals(r.length > 1, true);
});

Deno.test("una dirección vacía no revienta el cálculo de toda la cola", () => {
  assertEquals(Array.isArray(addressIssues("", false)), true);
  assertEquals(Array.isArray(addressIssues(null as never, false)), true);
});

// ── #17: dos pedidos que salen en un viaje ─────────────────────────────────────────────

Deno.test("misma zona y misma ventana: se sugiere un solo viaje", () => {
  const f = queueAddressFlags([
    { ref: "A", customer_address: "Av. España 123, ref colegio", delivery_zone: "cerca", created_at: "2026-09-10T18:00:00Z" },
    { ref: "B", customer_address: "Jr. Pizarro 456, ref parque", delivery_zone: "cerca", created_at: "2026-09-10T18:20:00Z" },
  ], 45);
  assertEquals(f.nearby.length, 1);
  assertEquals(f.nearby[0].refs.join(","), "A,B");
});

Deno.test("misma zona pero separados en el tiempo NO se agrupan", () => {
  // Sugerir juntarlos haría esperar tres horas al primero. La cercanía sin la ventana de
  // tiempo es exactamente el consejo que hace llegar tarde.
  const f = queueAddressFlags([
    { ref: "A", customer_address: "Av. España 123, ref colegio", delivery_zone: "cerca", created_at: "2026-09-10T18:00:00Z" },
    { ref: "B", customer_address: "Jr. Pizarro 456, ref parque", delivery_zone: "cerca", created_at: "2026-09-10T21:00:00Z" },
  ], 45);
  assertEquals(f.nearby.length, 0);
});

Deno.test("zonas distintas no se agrupan aunque sean simultáneos", () => {
  const f = queueAddressFlags([
    { ref: "A", customer_address: "Av. España 123, ref colegio", delivery_zone: "cerca", created_at: "2026-09-10T18:00:00Z" },
    { ref: "B", customer_address: "Jr. Pizarro 456, ref parque", delivery_zone: "muy lejos", created_at: "2026-09-10T18:01:00Z" },
  ], 45);
  assertEquals(f.nearby.length, 0);
});

Deno.test("tres pedidos seguidos en la misma zona salen como un solo grupo", () => {
  const f = queueAddressFlags([
    { ref: "A", customer_address: "Av. España 1, ref colegio", delivery_zone: "cerca", created_at: "2026-09-10T18:00:00Z" },
    { ref: "B", customer_address: "Av. España 2, ref colegio", delivery_zone: "cerca", created_at: "2026-09-10T18:10:00Z" },
    { ref: "C", customer_address: "Av. España 3, ref colegio", delivery_zone: "cerca", created_at: "2026-09-10T18:20:00Z" },
  ], 45);
  assertEquals(f.nearby.length, 1);
  assertEquals(f.nearby[0].refs.join(","), "A,B,C");
});

Deno.test("un pedido sin zona no rompe la agrupación de los demás", () => {
  const f = queueAddressFlags([
    { ref: "SINZONA", customer_address: "Av. España 1, ref colegio", delivery_zone: null, created_at: "2026-09-10T18:00:00Z" },
    { ref: "A", customer_address: "Av. España 2, ref colegio", delivery_zone: "cerca", created_at: "2026-09-10T18:01:00Z" },
    { ref: "B", customer_address: "Av. España 3, ref colegio", delivery_zone: "cerca", created_at: "2026-09-10T18:02:00Z" },
  ], 45);
  assertEquals(f.nearby[0].refs.join(","), "A,B");
});

Deno.test("una cola vacía o rota devuelve tres listas vacías, no una excepción", () => {
  const f = queueAddressFlags([], 45);
  assertEquals(f.duplicates.length + f.ambiguous.length + f.nearby.length, 0);
  const g = queueAddressFlags(null as never, 45);
  assertEquals(g.duplicates.length + g.ambiguous.length + g.nearby.length, 0);
});
