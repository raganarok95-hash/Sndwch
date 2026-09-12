// El doble de proteína, ejecutando el código real del servidor.
//
// POR QUÉ EXISTE. El doble de atún estuvo APAGADO casi un mes por dos motivos escritos en
// un comentario, y uno de los dos murió al día siguiente sin que nadie volviera a mirar:
//
//   · MARGEN: «en 30CM se cobraban S/9 por 170 g de atún que cuestan S/11.39». Las dos
//     mitades cambiaron — `pDbl` se partió en pDbl/pDbl30 el 2026-08-22 (el día después de
//     apagarlo) y el atún se cotizó el 2026-09-04 a S/43.96/kg en vez de S/67. Hoy el doble
//     deja ~70% en los dos tamaños.
//   · FÍSICO: «170 g de ensalada de atún en un pan de 30CM es un sándwich que se desarma».
//     Ese sigue vivo, y ninguna cotización lo arregla.
//
// De ahí las DOS listas. Su modo de fallo es distinto y por eso las dos necesitan prueba:
// dejar pasar el 30CM entrega un sándwich que llega deshecho, y bloquear el 15CM apaga en
// silencio uno de los upsells más rentables del catálogo — nada revienta, solo deja de
// entrar plata.
//
// Correr con: npm run test:api
import { assertDoubleAllowed, NO_DOUBLE_PROTS, NO_DOUBLE_30_PROTS, PROT_PRICE, dblFee } from "../supabase/functions/api/catalog.ts";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}
function rechaza(fn: () => void, msg: string) {
  try {
    fn();
  } catch {
    return;
  }
  throw new Error(msg);
}
function acepta(fn: () => void, msg: string) {
  try {
    fn();
  } catch (e) {
    throw new Error(`${msg} — lanzó: ${(e as Error).message}`);
  }
}

Deno.test("el doble de atún SE PUEDE pedir en 15CM", () => {
  acepta(() => assertDoubleAllowed(true, "P04", "15"), "el 15CM de atún tiene que admitir doble");
});

Deno.test("el doble de atún también se puede pedir en 30CM", () => {
  // Aprobado por el dueño el 2026-09-12 tras revisar el motivo FÍSICO, que era el único que
  // seguía vivo. El de margen había caducado tres semanas antes.
  acepta(() => assertDoubleAllowed(true, "P04", "30"), "el 30CM de atún tiene que admitir doble");
});

Deno.test("el mecanismo por tamaño sigue funcionando aunque hoy no lo use nadie", () => {
  // Las dos listas están vacías. Eso NO las vuelve inútiles: el día que una proteína necesite
  // apagarse solo en 30CM, el corte tiene que seguir ahí. Esta prueba lo ejercita con una
  // lista poblada a mano, porque un mecanismo sin usuarios es el que se rompe sin que nadie
  // se entere y se descubre recién cuando hace falta.
  NO_DOUBLE_30_PROTS.add("P99");
  try {
    acepta(() => assertDoubleAllowed(true, "P99", "15"), "P99 tiene que seguir admitiendo doble en 15CM");
    rechaza(() => assertDoubleAllowed(true, "P99", "30"), "P99 tiene que quedar bloqueado en 30CM");
    try {
      assertDoubleAllowed(true, "P99", "30");
    } catch (e) {
      const m = (e as Error).message;
      // Un «esa proteína no admite doble» sobre un 30CM, cuando el 15CM sí lo admite, manda a
      // buscar el problema al lugar equivocado.
      assert(m.includes("30CM"), `el mensaje tiene que nombrar el tamaño: "${m}"`);
      assert(m.includes("15CM"), `el mensaje tiene que ofrecer la salida: "${m}"`);
    }
  } finally {
    NO_DOUBLE_30_PROTS.delete("P99");
  }
});

Deno.test("sin doble pedido, nunca rechaza", () => {
  // assertDoubleAllowed corre en las DOS rutas de tasación, incluso cuando el cliente no
  // pidió doble. Si llegara a rechazar con doubleProt=false, ningún pedido se podría pagar.
  acepta(() => assertDoubleAllowed(false, "P04", "30"), "sin doble no puede rechazar nada");
});

Deno.test("el resto de proteínas admite doble en los dos tamaños", () => {
  for (const prot of ["P02", "P06", "P08"]) {
    for (const size of ["15", "30"]) {
      acepta(() => assertDoubleAllowed(true, prot, size), `${prot} ${size}CM tiene que admitir doble`);
    }
  }
});

Deno.test("las dos listas no se pisan", () => {
  // Una proteína en las DOS sería una contradicción silenciosa: la primera gana y la
  // segunda no dice nada, así que el motivo real del bloqueo deja de ser legible.
  for (const p of NO_DOUBLE_30_PROTS) {
    assert(!NO_DOUBLE_PROTS.has(p), `${p} está en las dos listas — la de 30CM no aporta nada`);
  }
});

Deno.test("el recargo de atún cubre su costo con margen, que es lo que destrabó prenderlo", () => {
  // Los costos vienen de la cotización real del dueño (2026-09-04): la porción de 85 g de
  // ensalada cuesta S/3.25 y la de 170 g, S/6.50. El techo acordado es 45%.
  const costo15 = 3.25, costo30 = 6.50;
  const p = PROT_PRICE.P04;
  const cobra15 = dblFee(p, "15"), cobra30 = dblFee(p, "30");
  const pct15 = 100 * costo15 / cobra15, pct30 = 100 * costo30 / cobra30;
  assert(pct15 <= 45, `el doble de atún 15CM está en ${pct15.toFixed(1)}% de costo, sobre el techo de 45%`);
  assert(pct30 <= 45, `el doble de atún 30CM está en ${pct30.toFixed(1)}% de costo, sobre el techo de 45%`);
  // Y el recargo de 30CM tiene que ser MAYOR que el de 15CM: el defecto original fue
  // justamente cobrar lo mismo por una porción que escala con el tamaño.
  assert(cobra30 > cobra15, `pDbl30 (${cobra30}) tiene que ser mayor que pDbl (${cobra15}) — es lo que lo rompió la primera vez`);
});
