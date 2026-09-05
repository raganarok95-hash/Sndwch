// Cobro del delivery por DISTANCIA REAL (2026-09-02), sobre el código real del servidor.
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
import { haversineKm, billableKm, deliveryFeeForKm } from "../supabase/functions/api/actions/orders.ts";
import {
  DELIVERY_KM_RATE, DELIVERY_ROAD_FACTOR, DELIVERY_MIN_FEE, DELIVERY_MAX_KM,
  STORE_LAT, STORE_LON,
} from "../supabase/functions/api/env.ts";

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

Deno.test("por debajo del mínimo se cobra el mínimo", () => {
  // A S/2/km, alguien a 800 m pagaría S/1.60 y ningún motorizado toma ese viaje.
  assertEquals(deliveryFeeForKm(0), DELIVERY_MIN_FEE);
  assertEquals(deliveryFeeForKm(0.8), DELIVERY_MIN_FEE);
  assertEquals(deliveryFeeForKm(DELIVERY_MIN_FEE / DELIVERY_KM_RATE), DELIVERY_MIN_FEE);
});

Deno.test("por encima del mínimo se cobran los kilómetros", () => {
  assertEquals(deliveryFeeForKm(5), 10);
  assertEquals(deliveryFeeForKm(7), 14);
  assertEquals(deliveryFeeForKm(10), 20);
});

Deno.test("el redondeo va hacia ARRIBA al medio sol, nunca hacia abajo", () => {
  // Redondear al más cercano dejaría la mitad de los viajes cobrando de menos, y esa
  // diferencia sale del bolsillo del dueño: el delivery no tiene margen del que salga.
  assertEquals(deliveryFeeForKm(3.6), 7.5);   // 7.20 -> 7.50
  assertEquals(deliveryFeeForKm(3.55), 7.5);  // 7.10 -> 7.50
  assertEquals(deliveryFeeForKm(4.0), 8);     // exacto, no se infla
  assertEquals(deliveryFeeForKm(4.1), 8.5);   // 8.20 -> 8.50
  for (const km of [3.1, 4.4, 5.7, 6.3, 8.9]) {
    const fee = deliveryFeeForKm(km);
    assertEquals(fee >= km * DELIVERY_KM_RATE, true, `${km} km: cobra ${fee}, cuesta ${km * DELIVERY_KM_RATE}`);
    assertEquals(Math.round(fee * 2) === fee * 2, true, `${fee} no es múltiplo de 0.5`);
  }
});

Deno.test("la tarifa nunca queda por debajo de lo que cuesta el viaje", () => {
  // La única forma en que este cálculo NO se puede equivocar: cobrar menos de lo que hay que
  // pagarle al motorizado. Se barre todo el rango de cobertura.
  for (let km = 0; km <= DELIVERY_MAX_KM; km += 0.1) {
    const fee = deliveryFeeForKm(km);
    assertEquals(fee >= km * DELIVERY_KM_RATE, true, `a ${km.toFixed(1)} km cobra ${fee} y cuesta ${(km * DELIVERY_KM_RATE).toFixed(2)}`);
  }
});

Deno.test("la tarifa crece con la distancia, sin saltos hacia atrás", () => {
  let previa = -1;
  for (let km = 0; km <= DELIVERY_MAX_KM; km += 0.05) {
    const fee = deliveryFeeForKm(km);
    assertEquals(fee >= previa, true, `a ${km.toFixed(2)} km la tarifa BAJÓ de ${previa} a ${fee}`);
    previa = fee;
  }
});

Deno.test("el mínimo es el que cobra el motorizado por un viaje corto", () => {
  // S/5, confirmado por el dueño el 2026-09-02. Por debajo de 2.5 km la tarifa la fija este
  // piso y no los kilómetros — que es justo el tramo que el cálculo por km solo no podía
  // cubrir sin generar viajes que nadie acepta.
  assertEquals(DELIVERY_MIN_FEE, 5);
  assertEquals(deliveryFeeForKm(2.4), 5);
  assertEquals(deliveryFeeForKm(2.6), 5.5);
  // Y tiene que seguir cubriendo su propia distancia equivalente.
  assertEquals(deliveryFeeForKm(DELIVERY_MIN_FEE / DELIVERY_KM_RATE) >= DELIVERY_MIN_FEE, true);
});
