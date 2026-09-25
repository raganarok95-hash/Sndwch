// LA CARTA PARA LAS PRUEBAS DE PLAYWRIGHT, PREGUNTADA A LA CARTA (2026-09-25).
//
// Gemelo de `tests-api/carta.ts`. Sirve para lo que se arma ANTES de abrir la página —los
// datos que devuelve el backend simulado, un carrito guardado, un pedido de la cola— y por eso
// no puede esperar a `cartaDeLaApp(page)`. Lee la misma carta que usan la app y el servidor
// (`_shared/carta.ts`), así que la próxima carta no rompe ninguna prueba que no esté rota.
//
// Una prueba necesita «un Signature que se pueda pedir», «un pan con recargo», «la recompensa
// que regala una bebida». Nunca «The Original»: la v4 lo retiró y con él cayeron pruebas que
// no tenían nada roto.
import { CARTA, ID_SECRETO, recompensaDeTipo, signaturesDeLaCarta, type TipoRecompensa } from '../supabase/functions/_shared/carta.ts';

function hay<T>(lista: T[], que: string): T[] {
  if (!lista.length) throw new Error(`La carta no tiene ${que}: la prueba no puede armarse.`);
  return lista;
}
const vuelta = <T extends { id: string }>(l: T[], que: string) => (i = 0): string => hay(l, que)[i % l.length]!.id;

/** Los Signatures que se pueden pedir, en el orden de la carta (sin el menú secreto). */
export const unSignature = vuelta(signaturesDeLaCarta(), 'Signatures vigentes');
/** El id del menú secreto. */
export const SECRETO: string = ID_SECRETO;

export const unPanSinRecargo = vuelta(CARTA.panes.filter((p) => !p.recargo), 'un pan sin recargo');
export const unPanConRecargo = vuelta(CARTA.panes.filter((p) => p.recargo), 'un pan con recargo');

const delArmador = (x: { soloEnSignature?: boolean; soloSecreto?: boolean }) => !x.soloEnSignature && !x.soloSecreto;
/** Proteína, vegetal y salsa que el cliente puede elegir en ARMA EL TUYO. */
export const unaProteinaDelArmador = vuelta(CARTA.proteinas.filter(delArmador), 'proteínas del armador');
export const unVegetalDelArmador = vuelta(CARTA.vegetales.filter(delArmador), 'vegetales del armador');
export const unaSalsaDelArmador = vuelta(CARTA.salsas.filter(delArmador), 'salsas del armador');
/** Una proteína cualquiera, para cuando el código solo es una llave (inventario, recetas). */
export const unaProteina = vuelta(CARTA.proteinas, 'proteínas');
/** Una proteína exclusiva del menú secreto. */
export const unaProteinaDelSecreto = vuelta(CARTA.proteinas.filter((p) => p.soloSecreto), 'proteínas del secreto');
/** Un vegetal que solo va dentro de un Signature. */
export const unVegetalDeSignature = vuelta(CARTA.vegetales.filter((v) => v.soloEnSignature), 'vegetales exclusivos de Signature');

export const unaBebida = vuelta(CARTA.bebidas, 'bebidas');

/** El id de la recompensa que hace tal cosa (la bebida gratis, el 15CM gratis…). */
export function recompensa(tipo: TipoRecompensa): string {
  const r = recompensaDeTipo(tipo);
  if (!r) throw new Error(`La carta no tiene una recompensa de tipo «${tipo}»: la prueba no puede armarse.`);
  return r.id;
}

/** Nombre y etiqueta de un producto como los escribe la carta, para datos simulados creíbles. */
export function nombreDe(id: string): string {
  const todo = [...CARTA.signatures, ...CARTA.proteinas, ...CARTA.bebidas, ...CARTA.panes, ...CARTA.vegetales, ...CARTA.salsas] as { id: string; nombre: string }[];
  const x = todo.find((y) => y.id === id);
  if (!x) throw new Error(`La carta no tiene «${id}».`);
  return x.nombre;
}
