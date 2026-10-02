// Dar y quitar acceso al panel (admin-accounts-add/delete) y fijar stock, 2026-10-02.
//
// POR QUÉ EXISTE. El teléfono se usaba tal cual se escribía: al QUITAR el acceso con
// «930 957 640» no se borraba nada y el panel decía «listo» — la persona seguía entrando. Y un
// stock escrito mal («abc») se volvía 0 y marcaba el producto AGOTADO. Modo de fallo: silencio.
//
// Correr con: npm run test:api
import { assertEquals, assertThrows } from "jsr:@std/assert@1";
import { validarEntrada } from "../supabase/functions/api/entrada.ts";
const { telefonoDeAdmin } = await import("../supabase/functions/api/actions/admin.ts");

Deno.test("el teléfono de un admin se normaliza: espacios, guiones y +51 dan el mismo número", () => {
  for (const v of ["930957640", "930 957 640", "930-957-640", "+51 930 957 640", "51930957640"]) {
    assertEquals(telefonoDeAdmin(v), "930957640", `«${v}»`);
  }
});

Deno.test("un teléfono que no es celular peruano se rechaza, no se guarda ni se «borra»", () => {
  for (const v of ["", "12345", "830957640", "9309576401", null]) assertThrows(() => telefonoDeAdmin(v));
});

Deno.test("un stock escrito mal se rechaza; vacío es «sin control», no cero", () => {
  assertThrows(() => validarEntrada("admin-inventory-set-stock", { token: "t", code: "P99", qty: "abc" }, "x"));
  assertThrows(() => validarEntrada("admin-inventory-set-stock", { token: "t", code: "P99", qty: -2 }, "x"));
  assertEquals(validarEntrada("admin-inventory-set-stock", { token: "t", code: "P99", qty: "" }, "x").qty, null);
  assertEquals(validarEntrada("admin-inventory-set-stock", { token: "t", code: "P99", qty: "12" }, "x").qty, 12);
});
