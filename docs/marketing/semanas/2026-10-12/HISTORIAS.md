# Historias · semana del 12 de octubre (propuesta para aprobar)

Hechas por la agencia nueva desde `BRIEF.md`. **Cada cuadro es una imagen nueva de Flow**; mientras
no existe, el tablero muestra el esquema de la escena encargada. **El tablero de un vistazo:**
`historias/tablero.png`. Los datos están en `historias.json` y el montaje lo hace
`scripts/piezas/historias.mjs`.

| día y hora | historia | momento | cuadros |
|---|---|---|---|
| lun 12 · 19:00 | **Mañana** | antes de abrir | WICHO «¿Mañana?» → SANDO «Mañana.» → la puerta con luz: «Martes, desde las 11:00.» |
| mar 13 · 10:50 | **La puerta** | apertura (hero) | WICHO «Ya casi.» → SANDO mira el reloj: «11:00.» → la puerta abierta: «Abierto.» |
| mar 13 · 12:00 | **¿La de quién?** | almuerzo de oficina | SANDO «Hay dos maneras de pedir bien.» → WICHO «La de SANDO, o la tuya.» |
| mié 14 · 11:30 | **La lista** | almuerzo de oficina | WICHO con la lista hasta el piso: «¿Y la oficina?» → los celulares: «Cada uno elige lo suyo desde su celular.» → «Con 5, el más barato va gratis.» |
| jue 15 · 19:30 | **Ya lo pensé yo** | noche sin cocinar | SANDO en la mesa: «No pienses.» → «Ya lo pensé yo.» |
| vie 16 · 16:30 | **Arma el tuyo** | el antojo de la tarde | WICHO arma en el aire: «Tamaño. Pan. Proteína. Queso. Vegetales. Salsas.» → «Tú decides cada capa.» → «Ármalo.» |
| dom 18 · 20:00 | **Mañana descansamos** | domingo | SANDO limpia su tabla: «Mañana descansamos.» → «Hoy, hasta las 22:00.» |

**El último cuadro de cada historia** lleva el pie «sndwch.app · enlace en el perfil». Las cifras y
horas **no están escritas**: salen del horario de la base, de `REGLAS.organizadorDesde` y de los
pasos del armador. Si cambian, se vuelve a montar.

## Por qué así (contra el brief)

- **Una sola idea toda la semana**: «hay dos maneras de pedir bien». SANDO lleva la noche y la
  carta; WICHO, el almuerzo, el grupo y el armador.
- **Nombre y cara juntos**: cada cuadro con personaje lleva su nombre arriba. Así la gente une
  la cara al nombre, que es lo que hace funcionar un activo de marca (Romaniuk).
- **Ningún precio**: a quien no nos conoce se le habla del momento, no del precio (Schwartz).
- **Cada sticker hace algo**: el recordatorio trae gente el martes sin pauta; la encuesta y la
  pregunta le dan a la agencia el dato de la semana siguiente; los enlaces llevan `?src=ig-hist`
  para medir lo que traen.

## Cómo salen: solas (dueño, 2026-10-08: «si yo lo hago por los stickers, pierde el ser automático»)

La API de Instagram publica historias pero **no stickers**. Por eso no llevan: el pie del último
cuadro hace el trabajo del enlace. El camino, sin pasos a mano:

1. Tu laptop genera en Flow los 18 cuadros (`../../estudio/encargos/`) y los sube.
2. GitHub (`historias.yml`) monta cada historia **completa** y la programa con su día y su hora.
   Una historia a la que le falta una imagen no sale; un boceto nunca se publica.
3. El cron de Supabase la publica a su hora, cuadro por cuadro, en orden.

Para que salgan hace falta **el token de la página** (P33) y **el enlace del perfil** con
`https://sndwch.app/?src=ig-bio`, para medir lo que traen.
