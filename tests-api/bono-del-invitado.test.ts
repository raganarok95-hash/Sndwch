// El bono del invitado y la BEBIDA que la app le promete, sobre el código real del servidor.
//
// POR QUÉ EXISTE, y no es hipotético: estuvo ROTO OCHO DÍAS y nadie se enteró.
// El 2026-09-05 la recalibración de puntos subió R05 (BEBIDA // GRATIS) de 120 a 160, y
// `REFERRAL_BONUS_POINTS` se quedó en 120. Durante esos ocho días el perfil, el mensaje que
// se comparte por WhatsApp y el texto de marketing que el dueño copia a Instagram le
// prometieron al invitado una bebida que su bono NO alcanzaba a pagar. Peor todavía: 120
// caía en tierra de nadie —por encima de la salsa extra (20) y por debajo de todo lo demás
// (160)— así que el invitado no podía canjear NADA de lo que se le dijo. Y es justo el lado
// del referido que tiene que decidir comprar sin haber pedido nunca.
//
// MODO DE FALLO: silencio puro. Nada revienta, nada tira un error, el pedido se cobra igual
// y la pantalla se ve perfecta. Solo deja de ser verdad. El comentario de
// `REFERRER_REWARD_POINTS` en env.ts describe este defecto EXACTO para el otro lado del
// referido desde hace semanas — y ese sí estaba protegido por `npm run parity`. Este no.
//
// Hay dos huecos distintos y hacen falta las dos defensas:
//   · el del CÓDIGO (alguien recalibra REWARDS y olvida el bono) lo cierra `npm run parity`,
//     que ata REFERRAL_BONUS_POINTS a R05;
//   · el del PANEL (el dueño repricea R05 desde `catalog_prices`, que loadCatalogPrices()
//     vuelca encima de REWARDS en runtime) NO lo puede ver parity, porque parity compara la
//     semilla. Lo cierra `loQueGanaElInvitado()`, que DERIVA la frase en vez de afirmarla —
//     el mismo criterio que `offpeakActiva()` ya usa para la hora valle retirada.
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
import { REWARDS, bonoCubreBebida, loQueGanaElInvitado } from "../supabase/functions/api/catalog.ts";
import { REFERRAL_BONUS_POINTS } from "../supabase/functions/api/env.ts";
import { marketingContent } from "../supabase/functions/api/actions/admin.ts";

Deno.test("hoy el bono del invitado alcanza para la bebida que se le promete", () => {
  // Si esta falla, la app está mintiendo en cuatro sitios a la vez. Es la comprobación que
  // habría gritado el 2026-09-05.
  assert(
    REFERRAL_BONUS_POINTS >= REWARDS[R_BEBIDA]!.pts,
    `el bono del invitado (${REFERRAL_BONUS_POINTS}) no cubre la bebida gratis (${REWARDS[R_BEBIDA]!.pts}): ` +
    `la app le promete una bebida que no puede canjear`,
  );
  assertEquals(bonoCubreBebida(), true);
});

Deno.test("el bono no queda en tierra de nadie: alcanza para alguna recompensa real", () => {
  // Con 120 contra la tabla de hoy, lo único canjeable era la salsa extra (20). Un bono que
  // no llega a nada es peor que uno chico: el invitado abre PUNTOS, no puede canjear nada y
  // el mecanismo entero queda desacreditado en su primer contacto con el programa.
  const alcanzables = Object.keys(REWARDS).filter((c) => REFERRAL_BONUS_POINTS >= REWARDS[c].pts);
  assert(
    alcanzables.length >= 2,
    `con ${REFERRAL_BONUS_POINTS} puntos el invitado solo alcanza ${alcanzables.join(", ") || "nada"}`,
  );
});

Deno.test("si la bebida gratis sube por encima del bono, la frase DEJA de nombrar la bebida", () => {
  // Esto es lo que el panel puede provocar sin tocar código: `catalog_prices` categoría
  // `reward` repricea R05 en runtime. La frase tiene que seguirlo sola.
  const antes = REWARDS[R_BEBIDA]!.pts;
  try {
    REWARDS[R_BEBIDA]!.pts = REFERRAL_BONUS_POINTS + 1;
    assertEquals(bonoCubreBebida(), false);
    assert(
      !loQueGanaElInvitado().includes("bebida"),
      `con la bebida gratis por encima del bono el texto sigue prometiendo la bebida: "${loQueGanaElInvitado()}"`,
    );
    // Lo que NO puede desaparecer son los puntos: eso sigue siendo cierto siempre.
    assert(
      loQueGanaElInvitado().includes(String(REFERRAL_BONUS_POINTS)),
      "el texto dejó de decir cuántos puntos recibe el invitado",
    );
  } finally {
    REWARDS[R_BEBIDA]!.pts = antes;
  }
});

Deno.test("ningún texto de marketing promete la bebida cuando el bono no la cubre", () => {
  // El dueño copia estos textos a Instagram y WhatsApp: son promesas públicas. Es la misma
  // comprobación que `ocasiones-del-brief.test.ts` hace con la hora valle retirada, aplicada
  // al bono — no basta con interpolar la cifra, tampoco se puede nombrar lo que no alcanza.
  const antes = REWARDS[R_BEBIDA]!.pts;
  try {
    REWARDS[R_BEBIDA]!.pts = REFERRAL_BONUS_POINTS + 1;
    for (const t of marketingContent()) {
      for (const [campo, txt] of Object.entries({
        whatsapp: t.whatsapp, caption: t.caption, videoIdea: t.videoIdea,
      })) {
        assert(
          !/bebida (de la casa|de regalo|gratis)/i.test(txt) || !/invita|refer|amigo/i.test(txt),
          `el texto ${t.theme}.${campo} promete una bebida por referir que el bono ya no cubre`,
        );
      }
    }
  } finally {
    REWARDS[R_BEBIDA]!.pts = antes;
  }
});

Deno.test("con el bono cubriendo la bebida gratis, la frase SÍ nombra la bebida", () => {
  // El espejo de la prueba anterior: una salvaguarda que apaga la frase para siempre sería
  // igual de mala — el premio concreto y nombrable es justamente lo que hace funcionar la
  // invitación. Tiene que volver sola, igual que `offpeakActiva()`.
  assert(
    loQueGanaElInvitado().includes("bebida"),
    `el bono cubre la bebida gratis pero el texto no nombra la bebida: "${loQueGanaElInvitado()}"`,
  );
});

// ── LA ESCALERA DE REFERIDOS TENÍA EL MISMO DEFECTO, DEL MISMO DÍA ──────────────────────
// El escalón de 3 amigos pagaba 120 puntos con la etiqueta «una bebida de la casa gratis»,
// y la bebida costaba 160 desde la misma recalibración del 2026-09-05. Pasaba `npm run
// parity` porque el chequeo de entonces solo exigía que los puntos fueran múltiplo de
// ALGUNA recompensa — y 120 es múltiplo de la salsa extra (20), así que el escalón se
// validaba como "seis salsas" mientras prometía una bebida.
import { REFERRAL_MILESTONES } from "../supabase/functions/api/env.ts";
import { etiquetaDeEscalon } from "../supabase/functions/api/catalog.ts";

Deno.test("cada escalón alcanza para la recompensa que su etiqueta nombra", () => {
  for (const h of REFERRAL_MILESTONES) {
    const r = REWARDS[h.covers];
    assert(!!r, `el escalón de ${h.count} amigos dice cubrir ${h.covers}, que no existe`);
    assert(
      h.points >= h.veces * r.pts,
      `el escalón de ${h.count} amigos da ${h.points} pts y promete ${h.veces}× ${h.covers} ` +
      `(${h.veces * r.pts} pts): "${h.label}" es una promesa que no puede pagar`,
    );
  }
});

Deno.test("si el panel repricea la recompensa, el escalón deja de nombrarla", () => {
  // El hueco que parity no puede ver: `catalog_prices` categoría `reward` mueve REWARDS en
  // runtime, y parity compara la semilla.
  const h = REFERRAL_MILESTONES[0];
  const antes = REWARDS[h.covers].pts;
  try {
    assertEquals(etiquetaDeEscalon(h), h.label);
    REWARDS[h.covers].pts = h.points + 1;
    assert(
      etiquetaDeEscalon(h) !== h.label && etiquetaDeEscalon(h).includes(String(h.points)),
      `el escalón sigue prometiendo "${h.label}" con la recompensa por encima de sus puntos`,
    );
  } finally {
    REWARDS[h.covers].pts = antes;
  }
});

// ── Y EL LADO DE QUIEN INVITA, POR SIMETRÍA ────────────────────────────────────────────
// `REFERRER_REWARD_POINTS` sí estaba atado a R06 por `npm run parity` — pero eso cubre la
// SEMILLA, y R06 también se repricea desde el panel. Arreglar un solo lado de un defecto
// simétrico deja el otro esperando su turno.
import { loQueGanaQuienInvita } from "../supabase/functions/api/catalog.ts";
import { REFERRER_REWARD_POINTS } from "../supabase/functions/api/env.ts";
import { recompensa } from "./carta.ts";

const R_BEBIDA = recompensa("bebida");
const R_SANDWICH = recompensa("sandwich");

Deno.test("quien invita: si el panel repricea el 15CM gratis, el aviso deja de nombrar el sándwich", () => {
  const antes = REWARDS[R_SANDWICH]!.pts;
  try {
    assert(
      loQueGanaQuienInvita().includes("15CM gratis"),
      `hoy el premio cubre el 15CM gratis pero el aviso no lo nombra: "${loQueGanaQuienInvita()}"`,
    );
    REWARDS[R_SANDWICH]!.pts = REFERRER_REWARD_POINTS + 1;
    assert(
      !loQueGanaQuienInvita().includes("gratis"),
      `el aviso sigue prometiendo un sándwich gratis que los ${REFERRER_REWARD_POINTS} pts ya no pagan`,
    );
  } finally {
    REWARDS[R_SANDWICH]!.pts = antes;
  }
});
