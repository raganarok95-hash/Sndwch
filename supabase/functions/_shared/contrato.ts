// SND//WCH — EL CONTRATO DE LA API (2026-09-24)
//
// Cada acción declara acá qué recibe y qué devuelve. Lo leen los dos lados:
//   · el servidor valida la entrada con el esquema ANTES de llamar a la acción (api/entrada.ts),
//     y la tabla ACTIONS exige que cada acción de acá tenga un manejador con estos tipos;
//   · el cliente nuevo llama `llamar('recurring-skip', {...})` (src/nuevo/api.ts): un nombre de
//     acción mal escrito, un campo que falta o uno de otro tipo NO COMPILA.
//
// Lo que antes los ataba era un texto repetido en dos lados — `api('recurring-skip')` en el
// cliente y `"recurring-skip": actRecurringSkip` en el servidor— que nadie comparaba.
//
// Las acciones entran acá a medida que se migran; las que faltan siguen con `any` en la tabla,
// a la vista. La lista de las que ya están es la de este objeto.
import * as e from './esquema.ts';
import type { Direccion, FijoDelCliente, FijoSugerido, ItemCarrito } from './dominio.ts';

/** El token de sesión. No se rechaza acá: sin él, `requireSession` responde 401, que es lo que
 *  el cliente necesita para mandar a iniciar sesión (un 400 de validación no lo haría). */
const token: e.Esquema<string> = { leer: (v) => (typeof v === 'string' ? v : '') };

/** Los ítems se aceptan como vienen y los valida `priceCartItem`, que conoce la carta. */
const items = e.lista(e.sinRevisar() as e.Esquema<ItemCarrito>, {
  min: 1,
  max: 30,
  mensaje: 'Tu carrito está vacío — arma el pedido antes de dejarlo fijo.',
});

function accion<S>() {
  return <E extends e.Esquema<unknown>>(entrada: E) => ({ entrada, salida: undefined as unknown as S });
}

export const CONTRATO = {
  'addresses-list': accion<{ addresses: Direccion[] }>()(e.objeto({ token })),

  'recurring-list': accion<{
    recurring: FijoDelCliente[];
    sugerido: FijoSugerido | null;
    desdeConfirmados: number;
    sueltaMin: number;
  }>()(e.objeto({ token })),

  'recurring-add': accion<{ success: true }>()(
    e.objeto({
      token,
      items,
      weekday: e.entero({ min: 0, max: 6, mensaje: 'Elige un día de la semana.' }),
      slot: e.texto({ min: 1, max: 5, mensaje: 'Elige una hora válida.' }),
      addressId: e.nulable(e.idNumerico('Esa dirección no es válida.')),
    }),
  ),

  'recurring-delete': accion<{ success: true }>()(
    e.objeto({ token, id: e.uuid('Falta el pedido fijo.') }),
  ),

  // El aviso de puntos de la 06A, cuando quien pagó sin entrar YA tenía cuenta (ver
  // vincularPedidoDeInvitado en api/actions/auth.ts). `customer` sale solo si se acreditó.
  'reclamar-pedido': accion<{ acreditado: boolean; customer: Record<string, unknown> | null }>()(
    e.objeto({ token, ref: e.texto({ min: 1, max: 40, mensaje: 'Falta el pedido.' }) }),
  ),

  'recurring-skip': accion<{ success: true; skipOn: string | null }>()(
    e.objeto({ token, id: e.uuid('Falta el pedido fijo.'), deshacer: e.bandera() }),
  ),
};

export type Contrato = typeof CONTRATO;
export type Accion = keyof Contrato;
export type Entrada<A extends Accion> = e.Tipo<Contrato[A]['entrada']>;
export type Salida<A extends Accion> = Contrato[A]['salida'];
