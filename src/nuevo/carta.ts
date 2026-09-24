// LA CARTA DEL CLIENTE ES LA DEL SERVIDOR (2026-09-24).
//
// El cliente viejo (`src/app/01-*`) tenía su propia copia de la carta —PROTS, SIGS, TOPS…— que
// `parity.mjs` comparaba con la del servidor por expresiones regulares. Ahora las dos salen de
// `supabase/functions/_shared/carta.ts`. Este archivo solo la traduce a la forma y los nombres
// de campo que el código viejo ya usa (`l`, `s`, `pDbl`, `sigOnly`…), para no tocar cada
// pantalla; a medida que las pantallas migren a la base nueva leerán `CARTA` directamente y
// esta traducción se achicará hasta desaparecer.
import { CARTA, esSecreto, type Carta } from '../../supabase/functions/_shared/carta.ts';

export function cartaVieja(c: Carta = CARTA) {
  const foto = <T extends { id: string; foto?: string }>(xs: T[]) =>
    Object.fromEntries(xs.filter((x) => x.foto).map((x) => [x.id, x.foto as string]));
  return {
    BASES: c.panes.map((x) => ({ id: x.id, l: x.nombre, s: x.sabor, d: x.desc })),
    PROTS: c.proteinas.map((x) => ({
      id: x.id, l: x.nombre, s: x.sabor, d: x.desc, p15: x.p15, p30: x.p30, pDbl: x.dbl15, pDbl30: x.dbl30,
      ...(x.soloSecreto ? { vaultOnly: true } : {}),
      ...(x.soloEnSignature ? { sigOnly: true } : {}),
      ...(x.sinDoble ? { noDouble: true } : {}),
      ...(x.sinDoble30 ? { noDouble30: true } : {}),
    })),
    TOPS: c.vegetales.map((x) => ({
      id: x.id, l: x.nombre, s: x.sabor, d: x.desc,
      ...(x.soloSecreto ? { vaultOnly: true } : {}),
      ...(x.soloEnSignature ? { sigOnly: true } : {}),
      ...(x.picante ? { spicy: true } : {}),
    })),
    CHEESE: c.quesos.map((x) => ({ id: x.id, l: x.nombre, s: '', d: x.desc })),
    SAUCES: c.salsas.map((x) => ({
      id: x.id, l: x.nombre, s: x.sabor, d: x.desc,
      ...(x.picante ? { spicy: true } : {}),
      ...(x.soloSecreto ? { vaultOnly: true } : {}),
      ...(x.soloEnSignature ? { sigOnly: true } : {}),
    })),
    // En el orden de la carta: el resto del código recorre SIGS tal cual viene.
    SIGS: [...c.signatures].sort((a, b) => a.orden - b.orden).map((x) => ({
      id: x.id, n: x.nombre, s: x.tipo, badge: x.secreto ? 'Secreto' : '', base: x.pan, prot: x.prot,
      tops: [...x.vegetales], sauces: [...x.salsas], p15: x.p15, p30: x.p30, pitch: x.pitch,
      ...(x.estrella ? { recommended: true } : {}),
      ...(x.queso ? { fixedCheese: x.queso } : {}),
      ...(x.quesoOpcional ? { cheeseOptional: true } : {}),
      ...(x.secreto ? { secret: true, minOrders: x.secreto.minPedidos } : {}),
    })),
    SIDES: c.bebidas.map((x) => ({ id: x.id, l: x.nombre, s: x.sabor, p: x.precio, d: x.desc, icon: x.icono })),
    SIG_IMG: foto(c.signatures),
    PROT_IMG: foto(c.proteinas),
    DRINK_IMG: foto(c.bebidas),
    /** Posición de cada Signature en la carta, para ordenar lo que llega de la base. */
    ORDEN: Object.fromEntries(c.signatures.map((x) => [x.id, x.orden])) as Record<string, number>,
    esSecreto: (id: string) => esSecreto(id, c),
  };
}
