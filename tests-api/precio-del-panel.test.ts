// Un precio editado en el panel (admin-catalog-set-price, 2026-10-02).
//
// POR QUÉ EXISTE. El panel manda Number(campo): un campo vacío llega como 0 y el servidor lo
// aceptaba, así que el producto quedaba GRATIS. Un tipeo como 2290 por 22.90 también se guardaba.
// Nada revienta: el cliente paga 0 o se espanta con un precio absurdo. El modo de fallo es el silencio.
//
// Correr con: npm run test:api
const { valoresDePrecio, PRECIO_MAX } = await import("../supabase/functions/api/actions/catalog.ts");
const { PROT_PRICE, SIDE_PRICE, REWARDS } = await import("../supabase/functions/api/catalog.ts");

function assert(cond: unknown, msg: string) { if (!cond) throw new Error(msg); }
function rechaza(f: () => unknown, msg: string) { let ok = false; try { f(); } catch { ok = true; } assert(ok, msg); }

const prot = Object.keys(PROT_PRICE)[0];
const bebida = Object.keys(SIDE_PRICE)[0];
const vigente = PROT_PRICE[prot];

Deno.test("un precio en 0 (campo vacío en el panel) se rechaza, no deja el producto gratis", () => {
  rechaza(() => valoresDePrecio("side", bebida, { price: 0 }), "bebida a S/0 aceptada");
  rechaza(() => valoresDePrecio("protein", prot, { ...vigente, p15: 0 }), "proteína a S/0 aceptada");
});

Deno.test("un tipeo de más (2290 por 22.90) o un salto de más de 3 veces se rechaza", () => {
  rechaza(() => valoresDePrecio("side", bebida, { price: PRECIO_MAX + 1 }), "pasó el tope");
  rechaza(() => valoresDePrecio("protein", prot, { ...vigente, p30: vigente.p30 * 4 }), "salto x4 aceptado");
});

Deno.test("un cambio normal se guarda con dos decimales y SOLO los campos de la categoría", () => {
  const v = valoresDePrecio("protein", prot, { ...vigente, p15: vigente.p15 + 1.004, extra: 9 });
  assert(Object.keys(v).sort().join(",") === "p15,p30,pDbl,pDbl30", "se coló un campo de más");
  assert(v.p15 === Math.round((vigente.p15 + 1.004) * 100) / 100, "no redondeó a dos decimales");
});

Deno.test("los puntos de una recompensa son un entero positivo", () => {
  const rw = Object.keys(REWARDS)[0];
  rechaza(() => valoresDePrecio("reward", rw, { pts: 0 }), "recompensa a 0 puntos aceptada");
  rechaza(() => valoresDePrecio("reward", rw, { pts: 12.5 }), "puntos con decimales aceptados");
  assert(valoresDePrecio("reward", rw, { pts: 160 }).pts === 160, "un valor normal no pasó");
});
