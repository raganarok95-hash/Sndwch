// Cobro del delivery por DISTANCIA REAL (2026-09-02; tarifario por tramos desde el 2026-11-20),
// sobre el código real del servidor.
//
// POR QUÉ EXISTE. Esto decide cuánto se le cobra a cada cliente por el envío, y el envío es
// PASS-THROUGH: el negocio no gana nada con él, solo lo cobra para pagarle al motorizado. Un
// error acá no reduce el margen — lo destruye, porque la diferencia sale del bolsillo del
// dueño al pagar el viaje, y no aparece en ningún estado de resultados como "error".
//
// El defecto que reemplaza era peor: la app cobraba un monto plano por ZONA que el propio
// cliente elegía de un desplegable, con "media" por defecto. El cliente elegía su propio
// precio de envío y elegir el más barato no le costaba nada.
//
// Correr con: npm run test:api
function assertEquals<T>(actual: T, expected: T, msg?: string) {
  if (!Object.is(actual, expected)) {
    throw new Error(msg ?? `esperaba ${JSON.stringify(expected)}, recibí ${JSON.stringify(actual)}`);
  }
}
import { haversineKm, billableKm, deliveryFeeForKm, resolveDeliveryFee } from "../supabase/functions/api/actions/orders.ts";
import {
  DELIVERY_ROAD_FACTOR, DELIVERY_MIN_FEE, DELIVERY_MAX_KM,
  STORE_LAT, STORE_LON,
} from "../supabase/functions/api/env.ts";
import { TARIFA_ENVIO } from "../supabase/functions/_shared/reglas.ts";

Deno.test("la distancia al propio local es cero", () => {
  assertEquals(Math.round(haversineKm(STORE_LAT, STORE_LON, STORE_LAT, STORE_LON) * 1000), 0);
});

Deno.test("un grado de latitud son ~111 km", () => {
  // Contraste de sanidad de la fórmula contra un hecho geográfico, no contra sí misma.
  const km = haversineKm(0, 0, 1, 0);
  assertEquals(km > 110 && km < 112, true, `dio ${km}`);
});

Deno.test("los km cobrables aplican el factor de ruta, no la línea recta pelada", () => {
  // La ruta en moto siempre es más larga que la recta: calles, sentidos, óvalos. Cobrar la
  // recta pelada dejaría al dueño pagando la diferencia en cada viaje.
  const p = 0.02;   // ~2.2 km al norte del local
  const recta = haversineKm(STORE_LAT + p, STORE_LON, STORE_LAT, STORE_LON);
  const cobrable = billableKm(STORE_LAT + p, STORE_LON);
  assertEquals(cobrable !== null, true);
  assertEquals(Math.abs((cobrable as number) - recta * DELIVERY_ROAD_FACTOR) < 0.02, true);
  assertEquals((cobrable as number) > recta, true, "el km cobrable nunca puede ser menor que la recta");
});

Deno.test("coordenadas imposibles devuelven null, nunca 0", () => {
  // Es la distinción que más importa: `null` significa "no se puede medir" y hace caer al
  // respaldo por zona. Un 0 silencioso le cobraría el mínimo a alguien que vive a 10 km.
  assertEquals(billableKm(null, null), null);
  assertEquals(billableKm(undefined, undefined), null);
  assertEquals(billableKm("hola", "chau"), null);
  assertEquals(billableKm(NaN, NaN), null);
  assertEquals(billableKm(999, 999), null);
  assertEquals(billableKm(-91, 0), null);
  // 0,0 es el "null island" que deja un GPS roto: está en el Atlántico, no en Trujillo.
  assertEquals(billableKm(0, 0), null);
});

Deno.test("cada distancia hasta el último tramo tiene tarifa, y la tarifa nunca baja", () => {
  // Modo de fallo: un hueco entre tramos (1.55 km) que devuelva null le negaría el pedido a
  // alguien cerca; uno que devuelva menos que el tramo anterior le cobraría de menos.
  let previa = -1;
  for (let km = 0; km <= DELIVERY_MAX_KM + 1e-9; km += 0.01) {
    const fee = deliveryFeeForKm(km);
    assertEquals(fee !== null, true, `a ${km.toFixed(2)} km no hay tarifa`);
    assertEquals((fee as number) >= previa, true, `a ${km.toFixed(2)} km la tarifa BAJÓ de ${previa} a ${fee}`);
    previa = fee as number;
  }
  assertEquals(deliveryFeeForKm(0), DELIVERY_MIN_FEE);
  assertEquals(DELIVERY_MAX_KM, TARIFA_ENVIO[TARIFA_ENVIO.length - 1]!.hastaKm);
});

Deno.test("pasado el último tramo no hay tarifa y el pedido se rechaza antes de cobrar", () => {
  // Modo de fallo: cobrar un envío inventado (o S/0) a alguien a 10 km, y que el dueño ponga
  // la diferencia al pagarle al motorizado.
  assertEquals(deliveryFeeForKm(DELIVERY_MAX_KM + 0.01), null);
  // ~0.08° al norte son ~9 km en recta, ~11.6 km cobrables.
  let motivo = "";
  try {
    resolveDeliveryFee(STORE_LAT + 0.08, STORE_LON, "");
  } catch (e) {
    motivo = (e as Error).message;
  }
  assertEquals(motivo.includes(`${DELIVERY_MAX_KM} km`), true, `no rechazó la dirección lejana (dijo: «${motivo}»)`);
  // Y una dirección cerca sí pasa, con su km.
  const cerca = resolveDeliveryFee(STORE_LAT + 0.005, STORE_LON, "");
  assertEquals(cerca.km !== null && cerca.fee >= DELIVERY_MIN_FEE, true);
});

// ── PARIDAD DE LA FÓRMULA, NO SOLO DE LAS CONSTANTES (2026-09-10) ───────────────────────
//
// La revisión de arquitectura encontró el hueco: `npm run parity` compara los VALORES
// duplicados entre cliente y servidor —DELIVERY_MIN_FEE, el factor de
// ruta— pero ninguna de sus 93 comprobaciones mira la FÓRMULA que los combina. Si un lado
// empezara a redondear al medio sol más cercano en vez de hacia arriba, parity seguiría en
// verde y el cliente mostraría un monto mientras el servidor cobra otro: exactamente el
// defecto que parity existe para evitar.
//
// Esta prueba y `tests/paridad-envio.spec.ts` leen LA MISMA tabla. Ésta la corre contra el
// Deno del servidor; la otra contra el JavaScript real del navegador. Si una fórmula cambia
// y la otra no, una de las dos falla.
const TABLA = JSON.parse(Deno.readTextFileSync(new URL("../tests/fixtures/tarifa-envio.json", import.meta.url)));

Deno.test("el servidor cobra lo que dice la tabla compartida con el cliente", () => {
  for (const c of TABLA.casos as Array<{ km: number; fee: number | null; nota: string }>) {
    assertEquals(
      deliveryFeeForKm(c.km),
      c.fee,
      `${c.km} km debía cobrar S/${c.fee} (${c.nota}), cobró S/${deliveryFeeForKm(c.km)}`,
    );
  }
});
