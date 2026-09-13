// FRENO POR TECHO DE CAC — pruebas del cálculo real del servidor.
//
// POR QUÉ EXISTE. Este veredicto decide si el dueño sigue gastando o corta. Se equivoca en
// silencio en las dos direcciones, y las dos cuestan plata:
//   · decir "sano" cuando el CAC ya pasó el techo → se sigue comprando a pérdida;
//   · decir "sobre el techo" con cuatro conversiones de arranque → se apaga una campaña
//     JUSTO antes de que Meta salga de la fase de aprendizaje, que es cuando empieza a
//     funcionar. Ese error es el más caro de los dos porque además parece prudencia.
//
// Nada de esto lanza una excepción, así que ni el typecheck ni un catch lo ven.
//
// Correr con: npm run test:api
function assertEquals<T>(actual: T, expected: T, msg?: string) {
  if (!Object.is(actual, expected)) {
    throw new Error(msg ?? `esperaba ${JSON.stringify(expected)}, recibí ${JSON.stringify(actual)}`);
  }
}
function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

import { cacFreno } from "../supabase/functions/api/actions/admin.ts";
import { CAC_TECHO, cacTechoPrimerPedido } from "../supabase/functions/api/env.ts";

const TECHO = cacTechoPrimerPedido();

Deno.test("el techo vale lo que dice la fórmula", () => {
  assertEquals(TECHO, Math.round((CAC_TECHO.contribPedido - CAC_TECHO.overheadPedido) * 100) / 100);
  assert(TECHO > 0, "el techo tiene que ser positivo");
});

Deno.test("el techo se DERIVA — la función no puede devolver un número escrito a mano", async () => {
  // ⚠ ESTA PRUEBA MIRA EL CÓDIGO FUENTE, y no es rebuscado: es el ÚNICO ángulo desde el que
  // el defecto se ve. La prueba de arriba compara la función contra la misma fórmula que la
  // produce, así que `return 13.63;` la pasa entera mientras ese número coincida con el
  // cálculo de hoy — y deja de coincidir en silencio el día que el modelo mueva la
  // contribución. Verificado inyectando exactamente ese literal: las 328 pruebas seguían en
  // verde.
  //
  // Es el mismo defecto que este repo ya documentó en `check:fotos` ("comparaba el recorte
  // contra la misma constante que lo produce, así que cambiar RATIO pasaba sin protestar").
  // Un chequeo que se mide contra sí mismo no protege nada.
  const fuente = await Deno.readTextFile(new URL("../supabase/functions/api/env.ts", import.meta.url));
  const cuerpo = fuente.match(/export function cacTechoPrimerPedido\(\): number \{([\s\S]*?)\n\}/);
  assert(cuerpo !== null, "no se encontró cacTechoPrimerPedido en env.ts — esta prueba quedó ciega");
  const codigo = (cuerpo as RegExpMatchArray)[1];
  assert(
    codigo.includes("CAC_TECHO.contribPedido") && codigo.includes("CAC_TECHO.overheadPedido"),
    "el techo dejó de leer las constantes del modelo: alguien lo reemplazó por un valor fijo",
  );
  // El único número admitido es el 100 del redondeo a céntimos.
  const numeros = (codigo.match(/\b\d+(?:\.\d+)?\b/g) || []).filter((n) => n !== "100");
  assertEquals(numeros.length, 0, `hay ${numeros.length} número(s) suelto(s) en el techo: ${numeros.join(", ")}`);
});

Deno.test("el dato que obliga a que este freno exista: el CAC medio de Meta PASA el techo", () => {
  // CAC = CPM / (1000 · CTR · CVR) · (1+IGV), con el CPM medio de S/8.50 → S/17.87.
  // Contra un techo de S/13.63. No es una hipótesis: es aritmética con las tasas de agencia
  // que el modelo ya usa. Si algún día el techo sube por encima del CAC medio, esta prueba
  // falla y hay que releer la conclusión del modelo, no borrarla.
  const cacMedio = (8.5 / (1000 * 0.0297 * 0.0189)) * 1.18;
  assert(cacMedio > TECHO, `el CAC medio (${cacMedio.toFixed(2)}) ya no pasa el techo (${TECHO})`);
});

Deno.test("sin gasto NO devuelve 0: devuelve null y lo dice", () => {
  const r = cacFreno({ dias: 7, gasto: 0, nuevosPagados: 10, nuevosReferidos: 2 });
  assertEquals(r.cac, null);
  assertEquals(r.veredicto, "sin-gasto");
  // Un 0 acá se leería como "medimos y salió gratis" — el mismo defecto que la pantalla de
  // las tres palancas ya evita poniendo un guion donde no hay dato.
  assert(r.motivo !== null, "sin gasto tiene que explicar por qué no hay número");
});

Deno.test("gastar y no captar a NADIE no es 'sin datos': es el peor caso y tiene veredicto propio", () => {
  const r = cacFreno({ dias: 7, gasto: 400, nuevosPagados: 0, nuevosReferidos: 3 });
  assertEquals(r.veredicto, "sin-conversiones");
  assertEquals(r.cac, null, "gasto/0 daría Infinity o NaN; ninguno se pinta bien");
  // Y NO se marca como poco fiable: que no entrara nadie con S/400 gastados es información
  // dura, no ausencia de información. Marcarla dudosa la haría ignorable.
  assertEquals(r.fiable, true);
});

Deno.test("por encima del techo el veredicto es 'sobre-el-techo'", () => {
  // 60 conversiones para pasar el mínimo de aprendizaje de 7 días (50).
  const caro = (TECHO + 5) * 60;
  const r = cacFreno({ dias: 7, gasto: caro, nuevosPagados: 60, nuevosReferidos: 0 });
  assertEquals(r.veredicto, "sobre-el-techo");
  assertEquals(r.fiable, true);
  assert(r.cac !== null && r.cac > r.techo, "el CAC tiene que quedar por encima del techo");
});

Deno.test("justo POR DEBAJO del techo es 'sano' — el borde no se cae del lado equivocado", () => {
  const barato = (TECHO - 0.5) * 60;
  const r = cacFreno({ dias: 7, gasto: barato, nuevosPagados: 60, nuevosReferidos: 0 });
  assertEquals(r.veredicto, "sano");
});

Deno.test("exactamente EN el techo todavía es sano: solo pasa el que lo SUPERA", () => {
  // El techo es "lo que deja el primer pedido". Pagar exactamente eso empata, no pierde.
  const r = cacFreno({ dias: 7, gasto: TECHO * 60, nuevosPagados: 60, nuevosReferidos: 0 });
  assertEquals(r.veredicto, "sano");
});

Deno.test("⚠ el umbral de aprendizaje de Meta NO puede ser la salvaguarda — dejaría el freno mudo", () => {
  // Meta pide ~50 conversiones cada 7 días; a 28 días son 200. Con S/40/día y un CAC de S/15
  // entran ~75 clientes en 28 días, así que exigir 200 marcaría "no fiable" SIEMPRE y la
  // alerta nunca sonaría. La primera versión de este cálculo hacía exactamente eso.
  // S/675 en 28 días con 75 clientes → CAC S/9, margen ±11.5%, o sea entre S/7.96 y S/10.04.
  // El intervalo entero queda debajo del techo (S/13.63), así que se puede actuar.
  const real = cacFreno({ dias: 28, gasto: 675, nuevosPagados: 75, nuevosReferidos: 5 });
  assertEquals(real.cac, 9);
  assertEquals(real.minAprendizajeMeta, 200);
  assertEquals(real.salioDeAprendizaje, false, "a este presupuesto nunca se sale de aprendizaje");
  // Y aun así el veredicto TIENE que poder ser accionable.
  assertEquals(real.fiable, true, "el freno quedó mudo: la salvaguarda volvió a colgar de Meta");
  assertEquals(real.veredicto, "sano");
});

Deno.test("la fiabilidad sale del INTERVALO de confianza, no de un umbral inventado", () => {
  // Error relativo de un conteo = 1/√n (Poisson). Con 25 conversiones es ±20%.
  const r = cacFreno({ dias: 14, gasto: 25 * 30, nuevosPagados: 25, nuevosReferidos: 0 });
  assertEquals(r.cac, 30);
  assertEquals(r.margenPct, 20);
  assertEquals(r.cacMin, 24);
  assertEquals(r.cacMax, 36);
  // S/24 ya está por encima del techo: el intervalo entero cae de un lado, así que se puede
  // actuar aunque sean "solo" 25 conversiones.
  assertEquals(r.fiable, true);
  assertEquals(r.veredicto, "sobre-el-techo");
});

Deno.test("si el techo cae DENTRO del intervalo, no se puede decidir — y lo dice con números", () => {
  // CAC medido justo en el techo con pocas conversiones: el intervalo lo abraza.
  const r = cacFreno({ dias: 14, gasto: TECHO * 9, nuevosPagados: 9, nuevosReferidos: 0 });
  assertEquals(r.fiable, false);
  assert(r.cacMin !== null && r.cacMax !== null, "tiene que reportar los extremos");
  assert((r.cacMin as number) <= TECHO && TECHO <= (r.cacMax as number), "el techo cae dentro");
  assert(r.cac !== null, "el número se muestra igual — esconderlo sería peor que acompañarlo");
  // El motivo trae los DOS extremos, no un "confía menos" genérico: sin los números el aviso
  // no dice cuánto falta para poder decidir.
  assert((r.motivo || "").includes("margen de error"), "el motivo tiene que nombrar el margen");
  assert((r.motivo || "").includes(String((r.cacMax as number).toFixed(2))), "el motivo tiene que traer el extremo alto");
});

Deno.test("más conversiones estrechan el intervalo — el margen NO es una constante", () => {
  const pocas = cacFreno({ dias: 28, gasto: 100 * 10, nuevosPagados: 10, nuevosReferidos: 0 });
  const muchas = cacFreno({ dias: 28, gasto: 100 * 100, nuevosPagados: 100, nuevosReferidos: 0 });
  assertEquals(pocas.margenPct, 31.6);
  assertEquals(muchas.margenPct, 10);
  assert((muchas.margenPct as number) < (pocas.margenPct as number), "el margen tiene que encogerse");
});

Deno.test("el referido se reporta al lado, porque es el canal contra el que hay que comparar", () => {
  const r = cacFreno({ dias: 30, gasto: 1000, nuevosPagados: 50, nuevosReferidos: 12 });
  assertEquals(r.nuevosReferidos, 12);
  assertEquals(r.costoReferido, CAC_TECHO.costoReferido);
  // Un referido cuesta S/7.65 y el CAC pagado más bajo medido es S/10.51: el referido SIEMPRE
  // sale más barato. La pantalla tiene que poder decirlo sin recalcular nada.
  assert(r.costoReferido < r.techo, "si el referido costara más que el techo, el canal entero cambiaría");
});
