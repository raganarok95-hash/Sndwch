# El equipo de marketing: qué hay, qué falla y cómo mejorarlo (2026-11-02)

Dueño: «¿Qué datos tienes sobre el equipo de marketing? Busca cómo funciona ahora y cómo mejorarlo, tal vez en su propio
chat con sus propias skills, y tú coordinas todo para automatizar procesos».

Es un diagnóstico y una propuesta. No se cambió ninguna tarea programada, no se publicó nada y la pauta sigue en pausa.

## 1 · Lo que existe hoy

**El equipo (13 especialistas, `.claude/agents/`).** Estratega, Creativo, Redactor, Director de arte, Calidad, Productor,
Editor de video, Media buyer, Analista, Investigador, Comunidad, Growth y Apps. Cada uno tiene su archivo de aprendizajes en
`docs/marketing/equipo/aprendizajes/`.

**Los manuales (skills).** `agencia-semana` (el lunes: datos, brief, 30 ideas, 7 que pasan, textos, arte, calidad,
historias y encargos a Flow, pauta, resumen), `pieza` (una pieza suelta con tres puertas: concepto, arte y calidad),
`producir-piezas`, `revisar-lo-producido`, `pauta-medible`, `revisar-pauta`, `medir-por-pedidos`, `crecer-sin-pauta`, y
los de estilo: `estilo-sndwch`, `voz-sndwch`, `verdad-y-ley`, `brief-sndwch`, `video-sndwch`.

**Lo que corre solo (GitHub, sin gastar uso de Claude).**

| qué | cuándo | qué hace hoy |
|---|---|---|
| Datos de la semana | domingo 23:15 | escribe `DATOS-base.json` de la semana. Funciona |
| Video del día | todos los días 5:47 | genera un video. Funciona, pero queda **retenido** por la preapertura |
| Revisar y programar el video | todos los días 11:15 | lo revisa y lo deja «en espera» hasta que haya día de apertura |
| Historias | todos los días | une la rama `estudio` y programa las historias que ya tienen imagen. Ayer: **0 nuevas** |
| Mirar Instagram, Estudio de mercado, Subir perfil | a mano | listos para usarse |

**Lo que corre con Claude.**
- `Revisar lo producido` (todos los días a las 20:10): activa. Casi siempre termina en «nada que revisar».
- `Buenos días` y `Domingo`: **apagadas** desde el 16 de octubre.
- **El lunes de la agencia corre en tu laptop** (`scripts/estudio/`), no en la nube.

## 2 · Lo que falla

1. **El lunes depende de que la laptop esté prendida.** De cuatro lunes, la agencia corrió uno completo (el 26 de
   octubre, que planificó esta semana). Las semanas del 12 y del 26 de octubre no tienen plan. La de la semana que viene
   (9 de noviembre) todavía no existe.
2. **Esta semana se planificó y no se produjo.** Hay 6 historias y 14 encargos a Flow (del 3 al 8 de noviembre), pero
   Flow no generó ninguna imagen desde el 19 de octubre. Sin imagen, «Historias» programa 0 y el trabajo de la semana se
   pierde **sin que nadie avise**.
3. **El equipo trabaja en lo que no es la prioridad.** Tú dijiste «primero llenar el feed». La agencia produce historias
   con los hermanos para Flow, y las 9 publicaciones del feed se hicieron a mano en el chat, fuera del equipo.
4. **Tus respuestas se quedan colgadas.** El resumen de esta semana te pregunta dos cosas («Abrimos este mes» o «Falta
   poco», y si ya hay día). Vive en un archivo del repo que no te llega al celular, así que nadie las contestó.
5. **No se puede aprender de lo publicado.** La semana del 19 dejó 105 visitas sin origen. Sin el `src=` en cada enlace y
   sin leer Instagram cada semana, el Analista no sabe qué funcionó.
6. **Aprendizajes desparejos.** Redactor y Director de arte tienen buen registro, pero Apps, Growth, Investigador y
   Editor de video siguen vacíos.
7. **Pauta y comunidad, bloqueadas fuera del equipo.** Falta unir @snd__wch a la página de Meta (sin eso no hay
   anuncio con el Instagram ni bandeja de mensajes). Además, la laptop no tiene acceso a Meta, así que «Pauta» siempre sale vacía.

## 3 · La propuesta: este hilo es el chat de Marketing

**A · El lunes, en la nube y en este chat.** Una tarea programada (lunes 8:00, Lima) corre `/agencia-semana` sin la
laptop y deja aquí el plan de la semana en una pantalla, con una tarjeta de decisión para que digas sí con un toque. Si no
respondes antes del martes a las 9:00, se produce solo lo que no toca plata, ley ni marca (la regla de siempre).
*Necesita tu sí: crear la tarea.*

**B · El feed primero, hecho en la nube.** Mientras no abramos, la semana entrega **3 publicaciones del feed en 4:5** con
su texto, más las historias. Las imágenes salen de las fotos aprobadas y de plantillas de la marca, que se generan en la
nube. Flow se usa solo para video, cuando la laptop esté prendida. Así ninguna semana depende de una sola máquina.

**C · Alarma en vez de silencio.** Una revisión de GitHub, que no gasta uso, mira cada martes si los encargos de la semana
tienen imagen. Si no la tienen, lo avisa aquí y propone la versión sin Flow.

**D · Tú publicas, yo te dejo todo listo.** Cada día que toque, te mando aquí el archivo exacto (4:5), el texto y la hora.
Nada se publica solo hasta que tú lo digas.

**E · Medir desde ya.** Cada enlace lleva su `src=`, y el domingo se lee Instagram (alcance, seguidores, visitas al
perfil) para que el lunes se decida con datos.

**F · Lo que digas aquí, el equipo lo aprende.** Cada opinión tuya sobre una pieza va el mismo día al archivo de
aprendizajes del rol, con tus palabras y la fecha.

**Cómo se coordina.** La gerencia (el chat del proyecto) ve todo y reparte. Este hilo es solo de Marketing. Pauta, App y
Finanzas siguen en sus propios hilos.

## 4 · Lo que necesita tu sí

1. Crear la tarea del lunes en la nube (A), para que este chat reciba el plan.
2. Las dos preguntas que siguen abiertas en el resumen de esta semana: ¿«Abrimos este mes» o «Falta poco»? ¿Ya hay día de
   apertura?
