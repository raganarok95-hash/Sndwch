// LO QUE LAS PRUEBAS NECESITAN DE LA CARTA, PREGUNTADO A LA CARTA (2026-09-24).
//
// Una prueba de dinero necesita «un Signature que se pueda pedir» o «una proteína del armador»,
// no «The Original». Escribir el código de un producto concreto ata la prueba a una carta que
// cambia: el 2026-09-24 la carta v4 retiró The Original, The Smoke y The Teriyaki, y 29 pruebas
// del backend reventaron sin que ninguna regla de dinero hubiera cambiado. Con estas funciones
// la próxima carta no rompe nada que no esté roto de verdad.
//
// Todo sale de la semilla de catalog.ts (SIG_DATA/SIG_CONTENT/PROT_PRICE y sus conjuntos), que
// es lo que el servidor usa cuando no hay base: las pruebas del backend no cargan la base.
import {
  NO_DOUBLE_30_PROTS,
  NO_DOUBLE_PROTS,
  PROT_PRICE,
  RESERVE_SIGS,
  SIG_CONTENT,
  SIG_DATA,
  SIG_ONLY_PROTS,
  SIG_ONLY_SAUCES,
  VALID_SAUCES,
  VAULT_ONLY_PROTS,
  VAULT_ONLY_SAUCES,
} from "../supabase/functions/api/catalog.ts";

function hay<T>(lista: T[], que: string): T[] {
  if (!lista.length) throw new Error(`La carta no tiene ${que}: la prueba no puede armarse.`);
  return lista;
}

/** Los Signatures que hoy se pueden pedir (sin el menú secreto, que tiene reglas propias). */
export function signaturesVigentes(): string[] {
  return hay(
    Object.keys(SIG_DATA).filter((id) => !RESERVE_SIGS.has(id) && SIG_CONTENT[id]?.active !== false),
    "ningún Signature vigente",
  );
}

/** Uno cualquiera de los vigentes; el filtro sirve para pedir, por ejemplo, uno sin queso fijo. */
export function unSignature(filtro: (d: (typeof SIG_DATA)[string]) => boolean = () => true): string {
  return hay(signaturesVigentes().filter((id) => filtro(SIG_DATA[id]!)), "un Signature con esa condición")[0]!;
}

/** Los que salieron de la carta: su receta sigue guardada, pero no se pueden pedir. */
export function signaturesRetirados(): string[] {
  return Object.keys(SIG_CONTENT).filter((id) => SIG_CONTENT[id]!.active === false);
}

/** Las proteínas que se pueden elegir en ARMA EL TUYO. */
export function proteinasDelArmador(): string[] {
  return hay(
    Object.keys(PROT_PRICE).filter((p) => !SIG_ONLY_PROTS.has(p) && !VAULT_ONLY_PROTS.has(p)),
    "ninguna proteína en el armador",
  );
}

export function unaProteinaDelArmador(): string {
  return proteinasDelArmador()[0]!;
}

/** Las del armador que admiten doble en los dos tamaños. */
export function proteinasConDoble(): string[] {
  return proteinasDelArmador().filter((p) => !NO_DOUBLE_PROTS.has(p) && !NO_DOUBLE_30_PROTS.has(p));
}

/** Las que existen en el catálogo pero solo dentro de un Signature. */
export function proteinasSoloDeSignature(): string[] {
  return [...SIG_ONLY_PROTS];
}

/** Una salsa que se puede elegir en ARMA EL TUYO. */
export function unaSalsaDelArmador(): string {
  return hay(
    [...VALID_SAUCES].filter((s) => !VAULT_ONLY_SAUCES.has(s) && !SIG_ONLY_SAUCES.has(s)),
    "ninguna salsa en el armador",
  )[0]!;
}

// ── Lo que sale directo de la carta compartida (_shared/carta.ts) ─────────────────────────
import { CARTA, recompensaDeTipo, type TipoRecompensa } from "../supabase/functions/_shared/carta.ts";

/** Un pan que no suma recargo y uno que sí (la prueba del recargo necesita los dos). */
export function panSinRecargo(): string {
  return hay(CARTA.panes.filter((p) => !p.recargo), "un pan sin recargo")[0]!.id;
}
export function panConRecargo(): string {
  return hay(CARTA.panes.filter((p) => p.recargo), "un pan con recargo")[0]!.id;
}

/** Las bebidas de la carta, en su orden. `unaBebida(1)` es otra distinta de `unaBebida(0)`. */
export function unaBebida(i = 0): string {
  const l = hay(CARTA.bebidas, "bebidas");
  return l[i % l.length]!.id;
}

/** El id de la recompensa que hace tal cosa (la bebida gratis, el 15CM gratis…). */
export function recompensa(tipo: TipoRecompensa): string {
  const r = recompensaDeTipo(tipo);
  if (!r) throw new Error(`La carta no tiene una recompensa de tipo «${tipo}»: la prueba no puede armarse.`);
  return r.id;
}

/** Un elemento cualquiera de cada sección de la carta, para cuando el código solo es una llave
 *  (un insumo del inventario, una línea de un plan de tanda). `i` da otro distinto. */
const deLaSeccion = (l: { id: string }[], que: string) => (i = 0) => hay(l, que)[i % l.length]!.id;
export const unaProteina = deLaSeccion(CARTA.proteinas, "proteínas");
export const unaSalsa = deLaSeccion(CARTA.salsas, "salsas");
export const unVegetal = deLaSeccion(CARTA.vegetales, "vegetales");
export const unPan = deLaSeccion(CARTA.panes, "panes");
