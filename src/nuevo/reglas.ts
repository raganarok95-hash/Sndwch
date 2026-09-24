// LAS REGLAS DEL CLIENTE SON LAS DEL SERVIDOR (2026-09-24).
//
// Envío, tienda, horario, rangos, referidos, retos, cola y plazos salen de
// `supabase/functions/_shared/reglas.ts`, lo mismo que usa el servidor. Esto solo las entrega con
// los nombres y la forma que el código viejo (`src/app/*`) ya usa. Se entrega una COPIA: el código
// viejo pisa algunas en runtime (el horario, con lo que manda la base) y no debe tocar el módulo.
import * as R from '../../supabase/functions/_shared/reglas.ts';

const mayuscula = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function reglasViejas() {
  const r = structuredClone({ ...R });
  return {
    ...r,
    DELIVERY_PRICE_ZONES: r.ZONAS_DE_ENVIO.map((z) => ({ id: z.id, l: z.nombre, fee: z.precio })),
    // En pantalla la etiqueta del escalón empieza con mayúscula; en el servidor va dentro de una frase.
    REFERRAL_MILESTONES: r.REFERRAL_MILESTONES.map((m) => ({ ...m, label: mayuscula(m.label) })),
  };
}
