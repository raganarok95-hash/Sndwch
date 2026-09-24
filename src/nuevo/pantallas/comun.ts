// Lo que comparten las pantallas de la base nueva. Una sola copia: si dos pantallas lo
// escribieran cada una a su modo, el mismo pedido saldría con otra foto o el mismo día con otro
// plural según desde dónde se mire.
import type { Direccion, ItemCarrito } from '../../../supabase/functions/_shared/dominio.ts';
import { legado } from '../legado';

export function diaMinuscula(w: number): string {
  return (legado.diasSemana[w] || '').toLowerCase();
}
export function diasPlural(w: number): string {
  const d = diaMinuscula(w);
  return /s$/.test(d) ? d : d + 's';
}

/** La foto de un pedido: la del primer Signature, o la de la proteína del primer armado. */
export function imagenDe(items: ItemCarrito[]): string {
  for (const it of items) {
    if (it.sigId) {
      const img = legado.imagenSignature(it.sigId);
      if (img) return img;
    }
    if (it.type !== 'side' && it.prot) {
      const img = legado.imagenProteina(it.prot);
      if (img) return img;
    }
  }
  return '';
}

/** La primera dirección marcada en el mapa: la única a la que se le puede calcular el envío. */
export function direccionConMapa(): Direccion | null {
  return legado.direcciones.find((d) => typeof d.lat === 'number' && typeof d.lon === 'number') || null;
}
