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

import { cacFreno, gastoDesactualizado, GASTO_DIAS_TOLERADOS } from "../supabase/functions/api/actions/admin.ts";
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

// ── LÍNEA BASE ORGÁNICA ───────────────────────────────────────────────────────────────────
//
// El defecto que cierran estas pruebas NO lanza nada: sin restar la base, el CAC le acredita a
// la publicidad al cliente que iba a llegar igual, sale más barato de lo que es, y el freno se
// queda en verde mientras el negocio compra a pérdida. Es la dirección peligrosa, y es la que
// Gordon, Zettelmeyer, Bhargava y Chapsky midieron en Facebook: la atribución observacional
// exagera el efecto de la publicidad.

Deno.test("sin línea base, el CAC es exactamente el de antes — el piso y el titular coinciden", () => {
  const r = cacFreno({ dias: 28, gasto: 300, nuevosPagados: 20, nuevosReferidos: 3 });
  assertEquals(r.baseFiable, false);
  assertEquals(r.atribuibles, null);
  assertEquals(r.cac, 15);
  // El piso existe SIEMPRE que haya CAC, aunque no haya base: es el mismo número, y que la
  // pantalla pueda leerlo sin condicionales es lo que evita que muestre un hueco.
  assertEquals(r.cacPiso, 15);
});

Deno.test("⚠ con base fiable el CAC SUBE — restar los que venían solos es el punto entero", () => {
  // 30 clientes en 28 días, pero antes de gastar ya entraban 0.5/día = 14 en el mismo periodo.
  const r = cacFreno({
    dias: 28, gasto: 300, nuevosPagados: 30, nuevosReferidos: 0,
    baseOrganicaDia: 0.5, baseDias: 28, baseNuevos: 14,
  });
  assertEquals(r.baseFiable, true);
  assertEquals(r.atribuibles, 16);
  assertEquals(r.cac, 18.75);
  assertEquals(r.cacPiso, 10);
  assert((r.cac as number) > (r.cacPiso as number), "el ajustado NUNCA puede salir más barato que el piso");

  // ⚠ ESTE ES EL CASO QUE JUSTIFICA TODO: el piso (S/10) está CÓMODO bajo el techo y habría
  // pintado la pantalla de verde con el veredicto "sano"; el real (S/18.75) lo pasa y además
  // con el intervalo entero por encima, o sea accionable. Sin restar la base, el freno no solo
  // no suena: dice explícitamente que se puede escalar.
  assert((r.cacPiso as number) < r.techo, "el piso de este caso tiene que quedar bajo el techo");
  assertEquals(r.veredicto, "sobre-el-techo");
  assertEquals(r.fiable, true);
});

Deno.test("una base corta NO se resta: 6 días o 4 clientes es ruido, y restar ruido ensucia", () => {
  const pocosDias = cacFreno({
    dias: 28, gasto: 300, nuevosPagados: 20, nuevosReferidos: 0,
    baseOrganicaDia: 0.5, baseDias: 6, baseNuevos: 3,
  });
  assertEquals(pocosDias.baseFiable, false);
  assertEquals(pocosDias.atribuibles, null);
  assertEquals(pocosDias.cac, 15, "con base no fiable el CAC tiene que quedar igual que sin base");

  const pocosClientes = cacFreno({
    dias: 28, gasto: 300, nuevosPagados: 20, nuevosReferidos: 0,
    baseOrganicaDia: 0.2, baseDias: 30, baseNuevos: 6,
  });
  assertEquals(pocosClientes.baseFiable, false);
  assertEquals(pocosClientes.cac, 15);

  // Pero el número SÍ se reporta aunque no sea fiable: la pantalla tiene que poder decir
  // cuánto falta para que sirva. Esconderlo dejaría la ventana pasando sin que nadie lo vea.
  assertEquals(pocosDias.baseDias, 6);
  assertEquals(pocosDias.baseNuevos, 3);
});

Deno.test("gastar y no traer a NADIE por encima de la base tiene veredicto propio y es fiable", () => {
  const r = cacFreno({
    dias: 28, gasto: 400, nuevosPagados: 10, nuevosReferidos: 0,
    baseOrganicaDia: 0.5, baseDias: 28, baseNuevos: 14,
  });
  assertEquals(r.atribuibles, 0);
  assertEquals(r.veredicto, "sin-incrementales");
  // No es "sin datos": es el resultado. Si pidiera fiabilidad estadística no sonaría nunca.
  assertEquals(r.fiable, true);
  // Y NO es lo mismo que "no entró nadie" — el negocio sí sumó 10 clientes.
  assertEquals(r.nuevosPagados, 10);
  // `gasto/0` daría Infinity: el CAC tiene que ser null, nunca un número inventado.
  assertEquals(r.cac, null);
  // El piso sí existe, y es justo el número que habría pintado esto de verde.
  assertEquals(r.cacPiso, 40);
});

Deno.test("⚠ el margen se calcula sobre los ATRIBUIBLES, no sobre el total", () => {
  const r = cacFreno({
    dias: 28, gasto: 300, nuevosPagados: 100, nuevosReferidos: 0,
    baseOrganicaDia: 3, baseDias: 28, baseNuevos: 84,
  });
  assertEquals(r.atribuibles, 16);
  // 1/√16 = 25%. Si se calculara sobre los 100 daría 10%, o sea que se restaría la base y
  // después se reclamaría la precisión del número grande: lo bueno de las dos cuentas.
  assertEquals(r.margenPct, 25);
  assert(r.margenPct !== 10, "el margen no puede salir del conteo sin descontar");
});

Deno.test("los atribuibles se redondean hacia ABAJO — el error nunca acredita de más", () => {
  // 0.34/día × 28 = 9.52 esperados. 20 − 9.52 = 10.48 → 10, no 11.
  const r = cacFreno({
    dias: 28, gasto: 300, nuevosPagados: 20, nuevosReferidos: 0,
    baseOrganicaDia: 0.34, baseDias: 28, baseNuevos: 10,
  });
  assertEquals(r.atribuibles, 10);
});

Deno.test("sin gasto, el estado dice que la ventana se está midiendo y no se puede reconstruir", () => {
  const r = cacFreno({ dias: 28, gasto: 0, nuevosPagados: 12, nuevosReferidos: 2 });
  assertEquals(r.veredicto, "sin-gasto");
  assertEquals(r.cac, null);
  // Sin esta frase el periodo más valioso de medición pasa como si fuera una pantalla vacía.
  assert((r.motivo || "").includes("línea base"), "tiene que nombrar la línea base");
  assert((r.motivo || "").includes("no se puede reconstruir"), "tiene que decir que es irrepetible");
});

// ── EL GASTO SE CARGA A MANO ──────────────────────────────────────────────────────────────
//
// Todo el freno divide gasto ÷ clientes, y el gasto lo transcribe una persona del panel de
// Meta. Olvidarse unos días deja el numerador corto mientras el denominador sigue creciendo:
// el CAC sale MÁS BARATO de lo que es y el freno se queda en verde. Es la dirección peligrosa
// y no produce ningún error — la pantalla se ve perfecta.

Deno.test("sin ninguna carga NO está desactualizado: está sin empezar, que es otro estado", () => {
  const r = gastoDesactualizado({ fechas: [], hoyDia: "2026-11-20" });
  assertEquals(r.ultimoDia, null);
  assertEquals(r.diasSinCargar, null);
  // Si confundiera los dos, la alarma sonaría todos los días desde antes de la primera campaña
  // — y una alarma que suena sin motivo se apaga antes del día que importa.
  assertEquals(r.desactualizado, false);
});

Deno.test("cargar ayer está al día; tres días sin cargar ya no", () => {
  assertEquals(gastoDesactualizado({ fechas: ["2026-11-19"], hoyDia: "2026-11-20" }).desactualizado, false);
  assertEquals(gastoDesactualizado({ fechas: ["2026-11-18"], hoyDia: "2026-11-20" }).desactualizado, false);
  const tres = gastoDesactualizado({ fechas: ["2026-11-17"], hoyDia: "2026-11-20" });
  assertEquals(tres.diasSinCargar, 3);
  assertEquals(tres.desactualizado, true);
  assertEquals(tres.ultimoDia, "2026-11-17");
});

Deno.test("lo que manda es el día MÁS RECIENTE, aunque las filas vengan desordenadas", () => {
  const r = gastoDesactualizado({ fechas: ["2026-11-02", "2026-11-19", "2026-11-08"], hoyDia: "2026-11-20" });
  assertEquals(r.ultimoDia, "2026-11-19");
  assertEquals(r.desactualizado, false);
});

Deno.test("una fecha corrupta se ignora en vez de tumbar el cron o inventar un hueco", () => {
  const r = gastoDesactualizado({ fechas: ["no-es-fecha", "2026-11-19", ""], hoyDia: "2026-11-20" });
  assertEquals(r.ultimoDia, "2026-11-19");
  assertEquals(r.diasSinCargar, 1);
});

Deno.test("el umbral es una constante exportada, no un número suelto en el cuerpo", () => {
  assertEquals(GASTO_DIAS_TOLERADOS, 3);
  const justo = gastoDesactualizado({ fechas: ["2026-11-20"], hoyDia: "2026-11-20" });
  assertEquals(justo.diasSinCargar, 0);
  assertEquals(justo.desactualizado, false);
});
