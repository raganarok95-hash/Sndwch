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

  // Quitar lo que uno agregó a un pedido grupal (2026-10-01). La llave la da add-group-item.
  'remove-group-item': accion<{ success: true }>()(
    e.objeto({
      token,
      code: e.texto({ min: 4, max: 12, mensaje: 'Falta el código del grupo.' }),
      id: e.uuid('Falta qué quitar.'),
      llave: e.texto({ max: 200 }),
    }),
  ),

  // El botón de los anuncios de Meta (dueño, 2026-10-01: «que yo pueda desactivar manualmente
  // con un botón los anuncios de meta»). `que`: 'ver' | 'apagar' | 'prender'.
  'admin-meta-ads': accion<{
    cuenta: string;
    campanas: { id: string; nombre: string; estado: string; activa: boolean }[];
    pausadasPorBoton: string[];
    pausadasAt: string | null;
  }>()(
    e.objeto({ token, que: e.texto({ min: 3, max: 8, mensaje: 'Falta qué hacer con los anuncios.' }) }),
  ),

  // ── ACCESO (2026-10-01): las cinco acciones con que se entra y se sale de una cuenta. ──
  'google-auth': accion<Record<string, unknown>>()(
    e.objeto({ token, idToken: e.texto({ min: 20, max: 4096, mensaje: 'Google no mandó la credencial.' }) }),
  ),
  'request-login-code': accion<Record<string, unknown>>()(
    e.objeto({ token, email: e.texto({ min: 3, max: 254, mensaje: 'Escribe tu correo.' }) }),
  ),
  'verify-login-code': accion<Record<string, unknown>>()(
    e.objeto({
      token,
      email: e.texto({ min: 3, max: 254, mensaje: 'Escribe tu correo.' }),
      code: e.texto({ min: 6, max: 6, mensaje: 'El código son 6 dígitos.' }),
    }),
  ),
  'session-check': accion<Record<string, unknown>>()(e.objeto({ token })),
  // El PIN es opcional: las cuentas que entran con correo o con Google no tienen.
  'delete-account': accion<Record<string, unknown>>()(
    e.objeto({ token, pin: { leer: (v: unknown) => (typeof v === 'string' ? v.trim().slice(0, 12) : '') } as e.Esquema<string> }),
  ),

  // ── DINERO, las simples (2026-10-01). Cada acción sigue validando adentro lo que ya validaba;
  // el contrato asegura la FORMA y que no entre nada que no se declaró. lat/lon pasan sin tocar:
  // como número opcional, un dato ausente llegaría como null y Number(null) es 0 —una coordenada
  // válida en el mar—, cuando hoy llega NaN y la acción lo rechaza.
  'my-orders': accion<Record<string, unknown>>()(e.objeto({ token, ref: e.textoOpcional(40) })),
  'credit-gift': accion<Record<string, unknown>>()(
    e.objeto({ token, toPhone: e.textoOpcional(20), amount: e.numero({ min: 0, max: 10_000, opcional: true, mensaje: 'El monto no es válido.' }) }),
  ),
  'credit-lookup': accion<Record<string, unknown>>()(e.objeto({ token, toPhone: e.textoOpcional(20) })),
  'cancel-my-order': accion<Record<string, unknown>>()(
    e.objeto({ token, orderId: e.textoOpcional(64), ref: e.textoOpcional(40) }),
  ),
  'report-order-problem': accion<Record<string, unknown>>()(
    e.objeto({ token, ref: e.textoOpcional(40), motivo: e.textoOpcional(60), detalle: e.textoOpcional(1000) }),
  ),
  'my-order-problems': accion<Record<string, unknown>>()(e.objeto({ token })),
  'create-group-order': accion<Record<string, unknown>>()(e.objeto({ token })),
  'get-group-order': accion<Record<string, unknown>>()(e.objeto({ token, code: e.textoOpcional(12) })),
  'add-group-item': accion<Record<string, unknown>>()(
    e.objeto({ token, code: e.textoOpcional(12), contributorName: e.textoOpcional(40), item: e.sinRevisar() }),
  ),
  'cancel-group-order': accion<Record<string, unknown>>()(e.objeto({ token, code: e.textoOpcional(12) })),
  'close-group-order': accion<Record<string, unknown>>()(e.objeto({ token, code: e.textoOpcional(12) })),
  'split-group-order': accion<Record<string, unknown>>()(
    e.objeto({ token, code: e.textoOpcional(12), address: e.textoOpcional(300), contactPhone: e.textoOpcional(20), lat: e.sinRevisar(), lon: e.sinRevisar() }),
  ),
  'export-orders': accion<Record<string, unknown>>()(e.objeto({ token })),

  'recurring-skip': accion<{ success: true; skipOn: string | null }>()(
    e.objeto({ token, id: e.uuid('Falta el pedido fijo.'), deshacer: e.bandera() }),
  ),
};

export type Contrato = typeof CONTRATO;
export type Accion = keyof Contrato;
export type Entrada<A extends Accion> = e.Tipo<Contrato[A]['entrada']>;
export type Salida<A extends Accion> = Contrato[A]['salida'];
