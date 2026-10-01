// La llave para quitar un ítem de un pedido grupal (2026-10-01).
//
// POR QUÉ EXISTE. Los ids de los ítems los ve todo el grupo (get-group-order). Si la llave no
// dependiera del secreto, o fuera la misma para dos ítems, cualquiera del enlace podría borrar lo
// que pidió otro. No revienta nada: un sándwich desaparece del pedido. El modo de fallo es el silencio.
//
// Correr con: npm run test:api
Deno.env.set("SESSION_SECRET", Deno.env.get("SESSION_SECRET") || "secreto-de-prueba-de-al-menos-32-caracteres!!");
const { llaveDeItemDeGrupo } = await import("../supabase/functions/api/session.ts");

function assert(cond: unknown, msg: string) { if (!cond) throw new Error(msg); }

Deno.test("la llave de un ítem es estable y distinta a la de otro ítem", async () => {
  const a = "11111111-2222-3333-4444-555555555555";
  const b = "11111111-2222-3333-4444-555555555556";
  const la1 = await llaveDeItemDeGrupo(a), la2 = await llaveDeItemDeGrupo(a), lb = await llaveDeItemDeGrupo(b);
  assert(la1 === la2, "la misma llave tiene que salir dos veces para el mismo ítem");
  assert(la1 !== lb, "dos ítems distintos no pueden compartir llave");
  assert(la1.length >= 32, "la llave es demasiado corta para no poder adivinarse");
  assert(!la1.includes(a), "la llave no puede contener el id: se podría deducir");
});
