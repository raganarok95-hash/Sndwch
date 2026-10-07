// SND//WCH — piezas/datos: todo lo que dicen las publicaciones, sacado del código (nunca a mano).
// Uso: deno run --allow-read scripts/piezas/datos.ts > datos.json
// La carta es la semilla; el 2026-10-07 se comparó contra `catalog_items` vigente (la fila más
// reciente de cada Signature, igual que loadCatalogItems): nombres y precios coinciden.
import { CARTA } from "../../supabase/functions/_shared/carta.ts";
import { REGLAS } from "../../supabase/functions/_shared/dinero.ts";
import { DELIVERY_MIN_FEE, DELIVERY_KM_RATE } from "../../supabase/functions/_shared/reglas.ts";

const nombre = (lista: any[], id?: string) => lista.find((x: any) => x.id === id);
const sigs = CARTA.signatures.filter((s: any) => !s.secreto).sort((a: any, b: any) => a.orden - b.orden).map((s: any) => ({
  id: s.id, nombre: s.nombre, p15: s.p15, p30: s.p30, pitch: s.pitch, foto: s.foto, estrella: !!s.estrella,
  pan: nombre(CARTA.panes, s.pan)?.nombre,
  ingredientes: [
    nombre(CARTA.proteinas, s.prot)?.nombre,
    ...s.vegetales.map((v: string) => nombre(CARTA.vegetales, v)?.nombre),
    s.queso ? nombre(CARTA.quesos, s.queso)?.nombre : null,
    ...s.salsas.map((x: string) => nombre(CARTA.salsas, x)?.nombre),
  ].filter(Boolean),
}));
// Los pasos del armador, tal como los muestra la app (BYO_STEP_LABELS es su orden real).
const app = Deno.readTextFileSync(new URL("../../src/app/04-armado-de-pedido.ts", import.meta.url));
const pasos = JSON.parse(app.match(/var BYO_STEP_LABELS=(\[[^\]]*\])/)![1].replace(/'/g, '"'));
console.log(JSON.stringify({
  sigs, pasos,
  cuenta: { panes: CARTA.panes.length, proteinas: CARTA.proteinas.filter((p: any) => !p.soloSecreto).length, quesos: CARTA.quesos.length, vegetales: CARTA.vegetales.filter((v: any) => !v.soloSecreto).length, salsas: CARTA.salsas.filter((v: any) => !v.soloSecreto).length },
  bebidas: CARTA.bebidas.map((b: any) => ({ nombre: b.nombre, sabor: b.sabor })),
  organizadorDesde: REGLAS.organizadorDesde, envioMinimo: DELIVERY_MIN_FEE, envioPorKm: DELIVERY_KM_RATE,
}));
