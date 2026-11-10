// SND//WCH — _shared/sistema
// Dueño (2026-11-10): «Todo debe funcionar en automático». Lo que el vigía de las automáticas
// (scripts/vigia-automaticas.mjs, 22:13 de Lima) dejó en app_settings.avisos_del_sistema, en las líneas
// que muestra el correo de cierre en «EL SISTEMA //». El modo de fallo que importa es el silencio: si el
// vigía no escribió en las últimas 26 h, eso también es un aviso.

export type AvisosDelSistema = {
  generado?: string;
  automaticas_en_rojo?: { nombre: string; archivo: string; ultima?: string }[];
  preguntas_abiertas?: { id: string; hilo: string; pregunta: string; desde?: string }[];
  entregas_atascadas?: { hilo: string; archivo: string; de: string; desde: string }[];
};

export function lineasDelSistema(avisos: AvisosDelSistema | null | undefined, at: string | null | undefined, ahora = new Date()): string[] {
  const horas = at ? (ahora.getTime() - new Date(at).getTime()) / 36e5 : Infinity;
  if (!avisos || horas > 26) return ["El vigía de las automáticas no corrió en el último día: nadie está mirando si algo falló."];
  const l: string[] = [];
  for (const a of avisos.automaticas_en_rojo ?? []) l.push(`Automática en rojo (falló dos veces seguidas): ${a.nombre}`);
  for (const e of avisos.entregas_atascadas ?? []) l.push(`Entrega atascada desde el ${e.desde}: de ${e.de} para ${e.hilo}`);
  const p = avisos.preguntas_abiertas ?? [];
  if (p.length) l.push(`${p.length} pregunta(s) esperan tu respuesta: ${p.slice(0, 5).map((q) => q.pregunta).join(" · ")}${p.length > 5 ? " · …" : ""}`);
  return l;
}
