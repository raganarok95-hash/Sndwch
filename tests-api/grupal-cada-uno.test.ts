// Pruebas del reparto del pedido grupal («Cerrar y pagar» = cada uno paga lo suyo).
//
// POR QUÉ EXISTE. Cada parte es un pedido Yape que alguien paga de su bolsillo. Si el envío
// se reparte mal, o la suma de las partes no da la tarifa, nada revienta: el motorizado cobra
// de menos, o un amigo paga el sándwich de otro. Y el sándwich gratis del organizador no
// puede terminar descontándose de la parte de un invitado. El modo de fallo es el silencio.
//
// Correr con: npm run test:api
function assertEquals<T>(actual: T, expected: T, msg?: string) {
  if (!Object.is(actual, expected)) {
    throw new Error(msg ?? `esperaba ${JSON.stringify(expected)}, recibí ${JSON.stringify(actual)}`);
  }
}
import { repartirGrupo } from "../supabase/functions/api/actions/group.ts";
import { deriveCart } from "../supabase/functions/api/catalog.ts";
import { unSignature, unaBebida } from "./carta.ts";

// Productos de la carta, preguntados a la carta: la regla no depende de qué haya este mes.
const UNA_BEBIDA = unaBebida();

// Un Signature vigente cualquiera: la prueba no depende de qué sándwich haya en la carta.
const UN_SIGNATURE = unSignature();

const sig15 = () => ({ type: "sig", sigId: UN_SIGNATURE, size: "15", qty: 1 });
const bebida = (code: string) => ({ type: "side", code, qty: 1 });
const c = (x: number) => Math.round(x * 100);

Deno.test("el envío se parte en céntimos y la suma da EXACTAMENTE la tarifa", () => {
  const partes = repartirGrupo(
    [{ name: "Ana", items: [sig15()] }, { name: "Beto", items: [sig15()] }, { name: "Caro", items: [sig15()] }],
    7, "Ana", false,
  );
  assertEquals(partes.reduce((s, p) => s + c(p.envio), 0), 700);
  // 700 / 3 = 233 y sobra 1: el céntimo va al organizador.
  assertEquals(c(partes[0].envio), 234);
  assertEquals(c(partes[1].envio), 233);
});

Deno.test("cada parte es su comida (con su combo) más su envío", () => {
  const partes = repartirGrupo(
    [{ name: "Ana", items: [sig15(), bebida(UNA_BEBIDA)] }, { name: "Beto", items: [sig15()] }],
    8, "Ana", false,
  );
  const comidaAna = deriveCart([sig15(), bebida(UNA_BEBIDA)], null, null, false).expectedTotal;
  assertEquals(c(partes[0].food), c(comidaAna));
  assertEquals(c(partes[0].total), c(comidaAna) + 400);
  const totalGrupo = partes.reduce((s, p) => s + c(p.total), 0);
  const comidaTotal = partes.reduce((s, p) => s + c(p.food), 0);
  assertEquals(totalGrupo, comidaTotal + 800);
});

Deno.test("el sándwich gratis del organizador sale de SU parte, nunca de la de otro", () => {
  const conGratis = repartirGrupo(
    [{ name: "Beto", items: [sig15()] }, { name: "Ana", items: [sig15()] }],
    6, "Ana", true,
  );
  const sinGratis = repartirGrupo(
    [{ name: "Beto", items: [sig15()] }, { name: "Ana", items: [sig15()] }],
    6, "Ana", false,
  );
  const beto = (ps: any[]) => ps.find((p) => p.name === "Beto");
  const ana = (ps: any[]) => ps.find((p) => p.name === "Ana");
  assertEquals(c(beto(conGratis).total), c(beto(sinGratis).total));
  assertEquals(c(ana(conGratis).food) < c(ana(sinGratis).food), true);
});

Deno.test("un grupo vacío no se reparte", () => {
  let fallo = false;
  try { repartirGrupo([], 7, "Ana", false); } catch { fallo = true; }
  assertEquals(fallo, true);
});
