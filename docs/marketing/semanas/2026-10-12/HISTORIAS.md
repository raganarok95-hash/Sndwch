# Historias · semana del 12 de octubre (propuesta para aprobar)

Hechas por la agencia nueva desde `BRIEF.md`. **Cada cuadro es una imagen nueva de Flow**; mientras
no existe, el tablero muestra el esquema de la escena encargada. **El tablero de un vistazo:**
`historias/tablero.png`. Los datos están en `historias.json` y el montaje lo hace
`scripts/piezas/historias.mjs`.

| día y hora | historia | momento | cuadros | sticker (lo pones tú) |
|---|---|---|---|---|
| lun 12 · 19:00 | **Mañana** | antes de abrir | WICHO «¿Mañana?» → SANDO «Mañana.» → la puerta con luz: «Martes, desde las 11:00.» | **cuenta regresiva** «Abrimos», 13 oct 11:00 |
| mar 13 · 10:50 | **La puerta** | apertura (hero) | WICHO «Ya casi.» → SANDO mira el reloj: «11:00.» → la puerta abierta: «Abierto.» | **enlace** «PIDE» |
| mar 13 · 12:00 | **¿La de quién?** | almuerzo de oficina | SANDO «Hay dos maneras de pedir bien.» → WICHO «La de SANDO, o la tuya.» | **encuesta** «¿Cuál pides?»: La de SANDO / La mía |
| mié 14 · 11:30 | **La lista** | almuerzo de oficina | WICHO con la lista hasta el piso: «¿Y la oficina?» → los celulares: «Cada uno elige lo suyo desde su celular.» → «Con 5, el más barato va gratis.» | **enlace** «PEDIR EN GRUPO» (abre un grupo nuevo) |
| jue 15 · 19:30 | **Ya lo pensé yo** | noche sin cocinar | SANDO en la mesa: «No pienses.» → «Ya lo pensé yo.» | **enlace** «LA CARTA» |
| vie 16 · 16:30 | **Arma el tuyo** | el antojo de la tarde | WICHO arma en el aire: «Tamaño. Pan. Proteína. Queso. Vegetales. Salsas.» → «Tú decides cada capa.» → «Ármalo.» | **pregunta** «¿Qué le pondrías tú?» y **enlace** «ARMA EL TUYO» |
| dom 18 · 20:00 | **Mañana descansamos** | domingo | SANDO limpia su tabla: «Mañana descansamos.» → «Hoy, hasta las 22:00.» | **enlace** «PIDE» |

Las cifras y horas **no están escritas**: salen del horario de la base, de
`REGLAS.organizadorDesde` y de los pasos del armador. Si cambian, se vuelve a montar.

## Por qué así (contra el brief)

- **Una sola idea toda la semana**: «hay dos maneras de pedir bien». SANDO lleva la noche y la
  carta; WICHO, el almuerzo, el grupo y el armador.
- **Nombre y cara juntos**: cada cuadro con personaje lleva su nombre arriba. Así la gente une
  la cara al nombre, que es lo que hace funcionar un activo de marca (Romaniuk).
- **Ningún precio**: a quien no nos conoce se le habla del momento, no del precio (Schwartz).
- **Cada sticker hace algo**: el recordatorio trae gente el martes sin pauta; la encuesta y la
  pregunta le dan a la agencia el dato de la semana siguiente; los enlaces llevan `?src=ig-hist`
  para medir lo que traen.

## Cómo salen (hay un límite de Instagram)

**La API de Instagram publica historias, pero sin stickers**: ni enlace, ni encuesta, ni cuenta
regresiva ([Meta](https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-user/media)).
Y aquí el sticker es la mitad de la historia. Por eso:

1. Cuando estén aprobadas y con las imágenes de Flow, te llegan los cuadros **sin el sticker
   dibujado** (los `*-con-sticker.png` son solo para que veas dónde va).
2. Las subes tú desde el celular a su hora, y en el último cuadro agregas el sticker de la tabla.
   Son unos 30 segundos por historia.
3. Si quieres hacerlo todo de una vez el lunes, prueba programarlas en Meta Business Suite. Si no
   te deja poner el sticker de enlace, súbelas a su hora desde el celular.

## Lo que falta para que estén terminadas

1. **Tu aprobación** (o cambios), cuadro por cuadro si hace falta.
2. **Las 18 imágenes de Flow**, una por cuadro, todas nuevas: los encargos ya están en
   `../../estudio/encargos/`. Basta con que le digas **«Estudio»** al Claude Code de tu laptop.
   Son imágenes: no gastan créditos.
3. Vuelvo a montar con esas imágenes y te mando los cuadros finales.
