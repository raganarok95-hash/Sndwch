// Pruebas de las recetas de producción (#9 escalado, #3 temporizador, #4 etiquetas), sobre
// el código real del servidor.
//
// POR QUÉ EXISTE. El escalado es aritmética simple, y por eso es exactamente el tipo de
// cálculo que nadie prueba — pero se equivoca hacia el lado caro: un factor mal aplicado
// hace comprar 12 kg de carne en vez de 6, y eso son ~S/120 parados en un refri con fecha de
// vencimiento. El temporizador y las etiquetas fallan hacia el otro lado: una etapa sin
// tiempo acumulado no dice a qué hora termina la tanda, y una etiqueta con la fecha límite
// mal calculada hace tirar comida buena o —peor— servir comida vencida.
//
// Correr con: npm run test:api
function assertEquals<T>(actual: T, expected: T, msg?: string) {
  if (!Object.is(actual, expected)) {
    throw new Error(msg ?? `esperaba ${JSON.stringify(expected)}, recibí ${JSON.stringify(actual)}`);
  }
}
import { scaleRecipe, recipeTimeline, batchLabels } from "../supabase/functions/api/actions/admin.ts";

// La receta real de P01 tal como quedó sembrada: 6 kg de punta de pecho → 38 porciones.
const P01 = [
  { item: "Punta de pecho (brisket)", qty: 6000, unit: "g" },
  { item: "Sal", qty: 72, unit: "g" },
  { item: "Cebolla en juliana", qty: 2, unit: "unidades" },
];

// ── #9: escalado ───────────────────────────────────────────────────────────────────────

Deno.test("pedir el mismo rendimiento no cambia ninguna cantidad", () => {
  const r = scaleRecipe(P01, 38, 38);
  assertEquals(r.map((x) => x.scaledQty).join(","), "6000,72,2");
});

Deno.test("el doble de porciones es el doble de todo", () => {
  const r = scaleRecipe(P01, 38, 76);
  assertEquals(r.map((x) => x.scaledQty).join(","), "12000,144,4");
});

Deno.test("una tanda a la mitad escala hacia abajo, no redondea a la receta entera", () => {
  const r = scaleRecipe(P01, 38, 19);
  assertEquals(r.map((x) => x.scaledQty).join(","), "3000,36,1");
});

Deno.test("un objetivo que no es múltiplo da cantidades reales, no un salto de tanda", () => {
  // 40 porciones sobre una base de 38. Redondear a "una tanda y media" haría comprar 3 kg de
  // más para dos sándwiches.
  const r = scaleRecipe(P01, 38, 40);
  assertEquals(r[0].scaledQty, 6315.8);
  assertEquals(r[1].scaledQty, 75.8);
});

Deno.test("se redondea a un decimal, no a entero", () => {
  // Media cucharada de sal en 2 kg sí cambia el resultado, y redondear 0.4 huevos a 0 deja la
  // receta sin huevo.
  const r = scaleRecipe([{ item: "Huevo", qty: 2, unit: "unidades" }], 30, 6);
  assertEquals(r[0].scaledQty, 0.4);
});

Deno.test("la cantidad original se conserva al lado de la escalada", () => {
  // La pantalla muestra las dos: sin la original no hay forma de notar que el factor está mal.
  const r = scaleRecipe(P01, 38, 76);
  assertEquals(r[0].qty, 6000);
  assertEquals(r[0].scaledQty, 12000);
});

Deno.test("un rendimiento base inválido no produce cantidades infinitas", () => {
  // Dividir entre cero daría Infinity y la lista de compras diría "Infinity g de carne".
  assertEquals(scaleRecipe(P01, 0, 40).length, 0);
  assertEquals(scaleRecipe(P01, -5, 40).length, 0);
  assertEquals(scaleRecipe(P01, NaN, 40).length, 0);
});

Deno.test("un objetivo inválido devuelve nada en vez de una receta absurda", () => {
  assertEquals(scaleRecipe(P01, 38, 0).length, 0);
  assertEquals(scaleRecipe(P01, 38, -10).length, 0);
  assertEquals(scaleRecipe(P01, 38, NaN).length, 0);
});

Deno.test("un ingrediente sin cantidad numérica se descarta, no se multiplica por NaN", () => {
  // Una fila con "al gusto" en vez de un número saldría como "NaN g" en la lista de compras.
  const r = scaleRecipe([
    { item: "Sal", qty: 72, unit: "g" },
    { item: "Pimienta", qty: "al gusto" as never, unit: "" },
  ], 38, 76);
  assertEquals(r.length, 1);
  assertEquals(r[0].item, "Sal");
});

Deno.test("una lista de ingredientes rota no revienta la pantalla", () => {
  assertEquals(scaleRecipe([], 38, 40).length, 0);
  assertEquals(scaleRecipe(null as never, 38, 40).length, 0);
});

// ── #3: temporizador ───────────────────────────────────────────────────────────────────

Deno.test("los tiempos se acumulan: el total es lo que decide si la tanda entra hoy", () => {
  const t = recipeTimeline([
    { label: "Limpiar", minutes: 20 },
    { label: "Sellar", minutes: 15 },
    { label: "Brasear", minutes: 55 },
  ]);
  assertEquals(t.totalMinutes, 90);
  assertEquals(t.steps.map((s) => s.startsAtMinute).join(","), "0,20,35");
});

Deno.test("una etapa sin minutos se conserva, pero sin cronómetro inventado", () => {
  // Inventarle una duración sería peor que no tenerla: el dueño planificaría contra un
  // número que nadie midió.
  const t = recipeTimeline([
    { label: "Sellar", minutes: 15 },
    { label: "Salar al gusto", minutes: null },
    { label: "Brasear", minutes: 55 },
  ]);
  assertEquals(t.steps.length, 3);
  assertEquals(t.steps[1].minutes, null);
  // Y no corre el reloj: la etapa siguiente arranca donde terminó la anterior con tiempo.
  assertEquals(t.steps[2].startsAtMinute, 15);
  assertEquals(t.totalMinutes, 70);
});

Deno.test("minutos negativos o basura se tratan como 'sin tiempo', no restan del total", () => {
  const t = recipeTimeline([
    { label: "A", minutes: 10 },
    { label: "B", minutes: -30 },
    { label: "C", minutes: "un rato" as never },
  ]);
  assertEquals(t.totalMinutes, 10);
});

Deno.test("una etapa sin nombre no aparece como paso vacío", () => {
  const t = recipeTimeline([{ label: "", minutes: 10 }, { label: "Sellar", minutes: 15 }]);
  assertEquals(t.steps.length, 1);
  assertEquals(t.steps[0].label, "Sellar");
});

Deno.test("una receta sin etapas da un total de cero, no una excepción", () => {
  assertEquals(recipeTimeline([]).totalMinutes, 0);
  assertEquals(recipeTimeline(null as never).totalMinutes, 0);
});

// ── #4: etiquetas ──────────────────────────────────────────────────────────────────────

const RECETA = { recipe_code: "P01", name: "Res asada mechada", portion_grams: 85 };

Deno.test("la etiqueta lleva la fecha límite calculada desde la vida útil real", () => {
  const l = batchLabels(RECETA, "2026-09-10T12:00:00Z", 3);
  assertEquals(l.cookedAt, "2026-09-10T12:00:00.000Z");
  assertEquals(l.useBy, "2026-09-13T12:00:00.000Z");
});

Deno.test("sin vida útil configurada la etiqueta sale igual, sin fecha límite", () => {
  // Una etiqueta con fecha de producción y sin límite todavía permite rotar. Una con una
  // fecha inventada hace tirar comida buena, o servir comida vencida.
  const l = batchLabels(RECETA, "2026-09-10T12:00:00Z", null);
  assertEquals(l.useBy, null);
  assertEquals(l.cookedAt, "2026-09-10T12:00:00.000Z");
});

Deno.test("una vida útil de cero o negativa no genera una fecha límite en el pasado", () => {
  assertEquals(batchLabels(RECETA, "2026-09-10T12:00:00Z", 0).useBy, null);
  assertEquals(batchLabels(RECETA, "2026-09-10T12:00:00Z", -2).useBy, null);
});

Deno.test("la etiqueta lleva el código y el gramaje: es lo que la hace distinguible en el refri", () => {
  // "Sin fecha no hay rotación" dice el recetario; sin código ni gramaje, dos bolsas del
  // mismo día tampoco se distinguen.
  const l = batchLabels(RECETA, "2026-09-10T12:00:00Z", 3);
  assertEquals(l.code, "P01");
  assertEquals(l.portionGrams, 85);
});

Deno.test("una fecha de producción inválida no produce una etiqueta con 'Invalid Date'", () => {
  const l = batchLabels(RECETA, "ayer", 3);
  assertEquals(l.cookedAt, "");
  assertEquals(l.useBy, null);
});
