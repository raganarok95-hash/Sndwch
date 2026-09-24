// LLAMAR AL SERVIDOR CON EL CONTRATO (2026-09-24).
//
// `llamar('recurring-skip', { id, deshacer })` se comprueba contra el mismo contrato que valida
// el servidor (supabase/functions/_shared/contrato.ts): una acción que no existe, un campo que
// falta o uno de otro tipo no compila, y la respuesta vuelve con su tipo. El token lo pone esta
// función; nadie lo pasa a mano.
//
// Por debajo sigue usando el `api()` viejo (reintentos, sesión vencida, sin conexión): eso se
// muda acá cuando migre el resto de las llamadas.
import type { Accion, Entrada, Salida } from '../../supabase/functions/_shared/contrato.ts';
import { legado } from './legado';

export function llamar<A extends Accion>(accion: A, entrada: Omit<Entrada<A>, 'token'>): Promise<Salida<A>> {
  return legado.api<Salida<A>>(accion, { ...entrada, token: legado.token });
}
