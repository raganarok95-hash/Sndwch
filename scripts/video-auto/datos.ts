// SND//WCH — video-auto/datos: lo que dice un video, sacado de la CARTA (nunca escrito a mano).
// Uso: deno run --allow-read scripts/video-auto/datos.ts SIG09 [real.json] > datos.json
//
// `real.json` (opcional) es la entrada de ese Signature tal como la manda `get-catalog` en
// producción (`sigItems[id]`): nombre, pitch, receta y PRECIO REALES. La carta es la semilla; el
// precio que cobra la app vive en `catalog_prices` y lo editado desde el panel en `catalog_items`.
// Un video con el precio de la semilla le promete al cliente un número que la app no cobra.
import { CARTA } from "../../supabase/functions/_shared/carta.ts";

const id = Deno.args[0] || CARTA.signatures.find((s: any) => s.estrella)?.id;
const semilla: any = CARTA.signatures.find((x: any) => x.id === id);
if (!semilla) throw new Error("No existe el Signature " + id);
const real: any = Deno.args[1] ? JSON.parse(Deno.readTextFileSync(Deno.args[1])) : null;
const s: any = real
  ? {
    ...semilla, nombre: real.n || semilla.nombre, pitch: real.pitch || semilla.pitch, prot: real.prot || semilla.prot,
    vegetales: real.tops || semilla.vegetales, salsas: real.sauces || semilla.salsas,
    queso: real.fixedCheese ?? semilla.queso, p15: Number(real.p15), p30: Number(real.p30),
  }
  : semilla;
if (!(s.p15 > 0)) throw new Error("Sin precio para " + id);
const de = (lista: any[], ids: string[] = []) => ids.map((i) => lista.find((x: any) => x.id === i)).filter(Boolean);
const prot: any = CARTA.proteinas.find((p: any) => p.id === s.prot);
const ingredientes = [
  prot ? `${prot.nombre} ${prot.sabor || ""}`.trim() : null,
  ...de(CARTA.vegetales, s.vegetales).map((v: any) => `${v.nombre} ${v.sabor || ""}`.trim()),
  ...de(CARTA.quesos, s.queso ? [s.queso] : []).map((q: any) => q.nombre),
  ...de(CARTA.salsas, s.salsas).map((x: any) => x.nombre),
].filter(Boolean);
// La primera frase del pitch, cortada en la coma o los dos puntos: el gancho del video.
const gancho = String(s.pitch || "").split(/[.:]/)[0].trim();
console.log(JSON.stringify({ id: s.id, nombre: s.nombre, p15: s.p15, p30: s.p30, ingredientes, gancho, foto: (s.foto || "").replace(/\.jpg$/, "_v.webp") }));
