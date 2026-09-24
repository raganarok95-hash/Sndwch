// SND//WCH — EL DOMINIO (2026-09-24)
//
// Los nombres del negocio, con su forma, en un solo sitio que importan el servidor y el
// cliente. Lo que sale de una tabla se DERIVA de los tipos generados (base.ts): si la columna
// cambia en la base, esto cambia solo al regenerar, y lo que la usaba mal deja de compilar.
import type { Database } from './base.ts';

type Publico = Database['public'];
export type Tabla = keyof Publico['Tables'];
export type Fila<T extends Tabla> = Publico['Tables'][T]['Row'];
export type Columna<T extends Tabla> = keyof Fila<T> & string;

/** Una dirección guardada, tal como está en `saved_addresses`. El id es SIEMPRE número. */
export type Direccion = Fila<'saved_addresses'>;

/** Un ítem del carrito. Su forma real la valida `priceCartItem` en el servidor; se tipa entera
 *  en el paso 3, cuando el cálculo del dinero pase a este mismo directorio. */
export type ItemCarrito = {
  type?: string;
  sigId?: string;
  prot?: string;
  code?: string;
  size?: string;
  qty: number;
  [k: string]: unknown;
};

/** En qué está el lugar de la próxima vez de un pedido fijo (servidor: franja.ts). */
export type EstadoDeFranja =
  | 'apartada'
  | 'faltan-confirmaciones'
  | 'aun-no-toca'
  | 'soltada'
  | 'saltada'
  | 'usada'
  | 'cerrado'
  | 'inactivo';

/** Un pedido fijo como lo ve el cliente: la fila más lo que el servidor calcula de ella. */
export type FijoDelCliente = {
  id: string;
  items: ItemCarrito[];
  weekday: number;
  slot: string;
  addressId: number | null;
  label: string;
  /** false si algún ítem ya salió de la carta: no se puede volver a pedir tal cual. */
  valido: boolean;
  /** La comida a precio de hoy, sin envío. null si ya no se puede tasar. */
  precio: number | null;
  veces: number;
  horaHabitual: string | null;
  vez: string | null;
  estado: EstadoDeFranja;
  apartada: boolean;
  sueltaA: string | null;
  confirmados: number;
};

/** Lo que más pide quien todavía no tiene un fijo. */
export type FijoSugerido = {
  items: ItemCarrito[];
  label: string;
  precio: number | null;
  veces: number;
  horaHabitual: string | null;
  weekday: number | null;
  slot: string | null;
};

/** Un pedido como lo ve su dueño en «Tus pedidos» (my-orders). Solo lo que la pantalla usa; con
 *  referencia de invitado el servidor manda menos columnas, y `items` puede no venir. */
export type PedidoDelCliente = Pick<
  Fila<'orders'>,
  'id' | 'ref' | 'summary' | 'total' | 'status' | 'payment_status' | 'created_at' | 'delivered_at'
> & { items?: ItemCarrito[] | null };
