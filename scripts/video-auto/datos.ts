// SND//WCH — video-auto/datos: lo que dice un video, sacado de la CARTA (nunca escrito a mano).
// Uso: deno run --allow-read scripts/video-auto/datos.ts SIG09 > datos.json
import { CARTA } from "../../supabase/functions/_shared/carta.ts";

const id = Deno.args[0] || CARTA.signatures.find((s: any) => s.estrella)?.id;
const s: any = CARTA.signatures.find((x: any) => x.id === id);
if (!s) throw new Error("No existe el Signature " + id);
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
