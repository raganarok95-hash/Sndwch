// A un embajador se le paga solo por un cliente NUEVO que llegó con su enlace y recibió su pedido.
//
// POR QUÉ ESTE ARCHIVO. Dueño, 2026-10-16: «Sí, amé los embajadores» (docs/META_Y_PRESENCIAL.md).
// Gente de Trujillo con su propio enlace (`?src=emb-<codigo>`): S/5 cuando su invitado nuevo
// recibe el primer pedido y S/5 más cuando hace el segundo. El panel le dice al dueño cuánto
// pagarle a cada uno por Yape. El modo de fallo que cuesta es SILENCIOSO: pagarle a alguien por
// un cliente que ya existía, por pedirse a sí mismo, por un pedido sin pagar o cancelado, o
// pagarle dos veces lo mismo. Nadie lo nota: es plata que sale cada semana.
//
// La promesa: un teléfono cuenta para un embajador solo si su PRIMER pedido pagado y no cancelado
// llegó con el enlace de ese embajador; se paga el primero cuando se entrega y el segundo cuando
// se entrega; nada más. El teléfono del propio embajador nunca cuenta. Lo ya pagado se resta.
function assertEquals<T>(actual: T, expected: T, msg?: string) {
  if (!Object.is(actual, expected)) {
    throw new Error(msg ?? `esperaba ${JSON.stringify(expected)}, recibí ${JSON.stringify(actual)}`);
  }
}

const { comisionesDeEmbajadores, REGLAS } = await import("../supabase/functions/_shared/dinero.ts");

const P1 = REGLAS.embajadorPorPrimero;
const P2 = REGLAS.embajadorPorSegundo;
const ANA = { id: 1, codigo: "ana", telefono: "911111111" };
const LUIS = { id: 2, codigo: "luis", telefono: "922222222" };

type P = { telefono: string | null; origen: string | null; creado: string; pagado: boolean; entregado: boolean; cancelado: boolean };
const pedido = (telefono: string, dia: number, extra: Partial<P> = {}): P => ({
  telefono, origen: null, creado: `2026-10-${String(dia).padStart(2, "0")}T18:00:00.000Z`,
  pagado: true, entregado: true, cancelado: false, ...extra,
});
const de = (r: ReturnType<typeof comisionesDeEmbajadores>, id: number) =>
  r.find((x) => x.embajadorId === id) ?? { invitados: 0, primeros: 0, segundos: 0, ganado: 0, debe: 0 };

Deno.test("invitado nuevo con el enlace: primer pedido entregado paga el primero; el segundo, el segundo; el tercero nada", () => {
  const r = comisionesDeEmbajadores([
    pedido("933333333", 20, { origen: "emb-ana" }),
    pedido("933333333", 22),
    pedido("933333333", 25, { origen: "emb-ana" }),
  ], [ANA], []);
  assertEquals(de(r, 1).invitados, 1);
  assertEquals(de(r, 1).primeros, 1);
  assertEquals(de(r, 1).segundos, 1);
  assertEquals(de(r, 1).ganado, P1 + P2, "el tercer pedido no se paga");
});

Deno.test("un cliente que ya había pedido sin el enlace no es invitado de nadie", () => {
  const r = comisionesDeEmbajadores([
    pedido("933333333", 20),
    pedido("933333333", 21, { origen: "emb-ana" }),
    pedido("933333333", 22, { origen: "emb-ana" }),
  ], [ANA], []);
  assertEquals(de(r, 1).ganado, 0);
  assertEquals(de(r, 1).invitados, 0);
});

Deno.test("el embajador pidiéndose a sí mismo con su enlace no cobra", () => {
  const r = comisionesDeEmbajadores([
    pedido(ANA.telefono, 20, { origen: "emb-ana" }),
    pedido(ANA.telefono, 21, { origen: "emb-ana" }),
  ], [ANA], []);
  assertEquals(de(r, 1).ganado, 0);
});

Deno.test("sin pagar o cancelado no cuenta; pagado pero sin entregar todavía no se paga", () => {
  const sinPagar = comisionesDeEmbajadores([pedido("933333333", 20, { origen: "emb-ana", pagado: false })], [ANA], []);
  assertEquals(de(sinPagar, 1).ganado, 0, "pedido sin pagar");
  const cancelado = comisionesDeEmbajadores([pedido("933333333", 20, { origen: "emb-ana", cancelado: true })], [ANA], []);
  assertEquals(de(cancelado, 1).ganado, 0, "pedido cancelado");
  const enCamino = comisionesDeEmbajadores([pedido("933333333", 20, { origen: "emb-ana", entregado: false })], [ANA], []);
  assertEquals(de(enCamino, 1).invitados, 1, "ya es su invitado");
  assertEquals(de(enCamino, 1).ganado, 0, "pero se paga al entregar");
});

Deno.test("cada invitado es de quien trajo su primer pedido, aunque después use otro enlace", () => {
  const r = comisionesDeEmbajadores([
    pedido("933333333", 20, { origen: "EMB-ANA" }),
    pedido("933333333", 21, { origen: "emb-luis" }),
    pedido("944444444", 20, { origen: "emb-luis" }),
  ], [ANA, LUIS], []);
  assertEquals(de(r, 1).ganado, P1 + P2, "Ana: su invitado y su segundo pedido");
  assertEquals(de(r, 2).ganado, P1, "Luis: solo el suyo");
});

Deno.test("lo ya pagado se resta de lo que se debe", () => {
  const r = comisionesDeEmbajadores([
    pedido("933333333", 20, { origen: "emb-ana" }),
    pedido("933333333", 22),
  ], [ANA], [{ embajadorId: 1, monto: P1 }]);
  assertEquals(de(r, 1).ganado, P1 + P2);
  assertEquals(de(r, 1).debe, P2);
});

Deno.test("el mismo teléfono escrito con +51 o espacios es el mismo cliente", () => {
  const r = comisionesDeEmbajadores([
    pedido("+51 933 333 333", 20),
    pedido("933333333", 21, { origen: "emb-ana" }),
  ], [ANA], []);
  assertEquals(de(r, 1).ganado, 0);
});
