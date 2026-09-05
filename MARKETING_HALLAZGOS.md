# SND//WCH — Marketing: lo que la investigación dice, y lo que hay que cambiar

**2026-09-04.** Diez investigaciones paralelas sobre fuentes externas, más una auditoría propia
del código. Cada hallazgo lleva su nivel de respaldo.

`[ESTUDIO]` investigación con método publicada · `[PLATAFORMA]` dato oficial de Meta/TikTok ·
`[AGENCIA]` blog de quien vende el servicio · `[SIN FUENTE]` circula sin respaldo

---

## 0. Lo que cambia decisiones, en orden

### ⚠ 1. Tu presupuesto no alcanza para que Meta aprenda

Regla oficial de Meta: un conjunto de anuncios necesita **50 conversiones cada 7 días** para
salir de la fase de aprendizaje. Con tu CAC de S/10–25 eso es **S/75–180 al día**.

| presupuesto | por día | ¿sale de aprendizaje? |
|---|---|---|
| S/2,000/mes | S/66 | **No.** Nunca. |
| S/4,000/mes | S/133 | Justo, con un solo conjunto |
| S/6,000/mes | S/200 | Sí, **un** conjunto. No dos. |

**Esto explica el hallazgo del modelo financiero** que ya teníamos y no sabíamos por qué:
*pasado cierto punto, más presupuesto empeora el neto*. Repartir el dinero en varios conjuntos
es peor que concentrarlo — cinco conjuntos de S/40/día generan cinco aprendizajes que **nunca
se completan**.

**Consecuencia:** una campaña, un conjunto, todo el presupuesto ahí. Y como no alcanza para
comprar volumen, **lo orgánico y el referido dejan de ser complemento y pasan a ser el plan**.

### ⚠ 2. El CAC del que cuelga todo el negocio se apoya en un blog de agencia

`modelo/FUENTES.md` declara CTR 2.97% y CVR 1.89% citando get-ryze.ai y Two Minute Reports,
y el CPM S/5–12 de Perú viene de ibo.pe. **Ninguna de las tres es una medición auditada** — son
agencias que venden el servicio. No encontré ninguna fuente que respalde CTR/CVR de Perú-comida
con esa granularidad.

No significa que estén mal. Significa que **el número del que cuelga todo el plan tiene el mismo
respaldo que un anuncio**, y que medir el CAC real la primera semana no es una mejora: es la
única forma de saber si el negocio existe.

### ⚠ 3. El menú secreto está demasiado lejos, y hay un arreglo mejor que bajarlo

`[ESTUDIO]` **50.3% de las segundas compras ocurren dentro de 30 días; 76.4% dentro de 90; pasado
el día 100 la probabilidad cae debajo del 10%.** Es un acantilado, no una pendiente.

El menú secreto se desbloquea al 3.º pedido. Para la mayoría eso queda del otro lado del
acantilado.

**Pero bajar el umbral no es la mejor jugada.** Nunes & Drèze (*Journal of Consumer Research*,
2006) hicieron el experimento: una tarjeta de **10 sellos con 2 ya regalados** se completó en
**34%** de los casos, contra **19%** de una tarjeta de **8 sellos vacía**. Mismo esfuerzo real,
casi el doble de canje. Se llama **progreso dotado**.

**Traducción:** deja el umbral en 3 y **regala 1 pedido de avance al registrarse**. El cliente ve
"vas 1 de 3" en vez de "te faltan 3". Es más barato que bajar el umbral y funciona mejor.

### ⚠ 4. Los rangos podrían no estar haciendo nada

`[ESTUDIO]` Leenheer, van Heerde, Bijmolt & Smidts (*IJRM* 2007): de la diferencia entre miembros
y no miembros de un programa de fidelidad, **solo ~14% es influencia real del programa**. El resto
es autoselección — los que ya iban a volver son los que se inscriben.

Y un meta-análisis de 2026 en *Journal of Retailing* reporta que **el reconocimiento no tiene
efecto** medible; pesan más los beneficios sociales y de exploración.

Los RANGOS de SND//WCH son puramente de reconocimiento, por diseño. **Puede que no estén
retiniendo a nadie.** No propongo quitarlos —cuestan poco— pero sí dejar de contarlos como
palanca de retención en cualquier modelo.

### ⚠ 5. Diez recordatorios automáticos pueden ser demasiados

`[ESTUDIO]` Wohllebe (*Innovative Marketing* 2021), 17,500 usuarios, 5 frecuencias, 7 semanas:
más notificaciones **no personalizadas** producen más desinstalaciones y menos aperturas.

SND//WCH tiene **diez automatizaciones de push al cliente**. Cada una tiene su tope
(`MAX_PUSH_PER_RUN`), pero **nadie mide el techo POR CLIENTE**: alguien puede recibir carrito
abandonado + segundo pedido + crédito sin usar + hora pico en la misma semana.

**Falta un tope por persona, no por campaña.** Es un cambio chico con riesgo real si no se hace.

---

## 1. Los personajes: la evidencia más fuerte a favor

`[ESTUDIO]` **System1**, sobre la base de campañas del IPA: las campañas con personaje propio
recurrente son **+37% más probables de ganar cuota**, **+27% de ganar clientes** y **+30% de
ganar beneficio**. Con eye-tracking (System1 + Lumen): **+50% de tiempo de atención** y **+25% de
recuerdo espontáneo de marca** contra el **mismo anuncio sin el personaje**.

Y su uso cayó del 41% de las campañas (1992) al ~12%. **Es una ventaja que casi nadie usa.**

`[ESTUDIO]` **Kevin the Carrot (Aldi)**: 6 años, +54% de cuota de valor, £618M de ingreso
incremental, ROMI 241%. Lo que hizo bien: **el mismo personaje, todos los años, historia nueva
cada vez.**

**Lo más importante para ti:** el formato de dos personajes opuestos funciona cuando **cada uno
encarna un beneficio del producto**, no cuando son decoración. "Get a Mac" (Grand Effie 2007)
funcionó por eso. Tus hermanos ya lo cumplen: el calmado *es* la receta cerrada, el alocado *es*
que tú eliges. **Esa es la parte más fuerte de todo tu concepto y no hay que tocarla.**

### Los tres riesgos, con nombre

| riesgo | evidencia | mitigación |
|---|---|---|
| **Efecto vampiro** — el personaje se roba el recuerdo de la marca | `[ESTUDIO]` *IJRM*, 4,970 sujetos: ocurre con baja congruencia | El "//" y el sándwich **en el mismo plano que la cara**, siempre |
| **Raro sin ser querible** | Quiznos (30,000 quejas en una semana), el rey de Burger King (retirado por perturbador) | El alocado es caótico, **nunca inquietante**. Sonríe, no acecha |
| **Inconsistencia visual** | Ehrenberg-Bass: la inconsistencia es "el enemigo" de un activo de marca | Ficha de personaje congelada, nunca regenerada |

Y un dato incómodo: `[ESTUDIO]` **el humor baja el recuerdo de marca** en varios estudios. Los
hermanos pueden ser graciosos, pero el sándwich y el "//" tienen que estar en pantalla.

---

## 2. Producción con Flow: tres cosas que hay que resolver antes

**a) La marca de agua.** La marca visible "veo" solo se quita en **Google AI Ultra (~US$100/mes)**.
El plan Pro de US$19.99 la deja. Un anuncio pagado con marca de agua de la herramienta se lee
como amateur. *(No confirmado en fuente oficial de Google — verifícalo antes de pagar.)*

**b) Declarar la IA no es opcional.** `[PLATAFORMA]` Meta exige declarar contenido generado con
IA desde marzo 2026, y **no declararlo es la 3.ª causa de rechazo de anuncios (14%)**. Marcar la
casilla **no penaliza el alcance**; ocultarlo sí. TikTok detecta el origen vía C2PA aunque no lo
declares.

**c) Tus dos hermanos son el caso donde la herramienta falla.** Se reporta degradación de
identidad **cuando dos personajes comparten primer plano o se tocan** — exactamente tu escena.

> **Antes de comprometer meses de campaña: genera 5 clips con los dos hermanos en el mismo
> encuadre y mira si se mantienen.** Si no, el sistema de abajo lo evita por diseño.

---

## 3. Viralidad: qué está probado y qué no

**Lo más fuerte del lote entero** — `[ESTUDIO]` Luca (Harvard Business School), con diseño causal:
**una estrella más en Google/Yelp = +5 a +9% de ingresos, y SOLO en restaurantes independientes**,
no en cadenas. Es causal, no correlacional. Y tú eres exactamente un independiente.

`[ESTUDIO]` Berger & Schwartz (*JMR* 2011, experimento de campo, ~300 productos): los productos
"interesantes" generan **más boca a boca inmediato pero NO más sostenido**. Lo que sostiene la
conversación son los **disparadores recurrentes** y que el consumo sea **visible**.

> Traducción incómoda: **el menú secreto dará un pico y se apagará.** Lo que dura es la bolsa
> visible en la oficina a la hora de almuerzo. El QR en el empaque vale más que el secreto.

`[ESTUDIO]` **La comida que se ve TÍPICA genera más engagement que la rara** (*JBR* 2022, visión
computacional sobre Instagram de restaurantes) — fluidez de procesamiento. Un sándwich que se lee
al instante como sándwich rinde más que uno "creativo". **Esto contradice el instinto de mostrar
lo más llamativo.**

`[ESTUDIO]` Referidos: Schmitt, Skiera & Van den Bulte (*Journal of Marketing* 2011, ~10,000
clientes, 3 años): un cliente referido vale **16–25% más** y se va menos. Valida la escalera.

**Documentado como inútil:** sorteos por seguidores (inflan seguidores que se van al anunciar el
ganador y atraen cazadores de premios).

### Referidos: dos correcciones a lo que yo mismo te recomendé antes

**a) El "momento de deleite" no tiene estudio detrás.** Te propuse antes pedir el referido en el
momento de la calificación de 4-5 estrellas. Sigue siendo razonable, pero **es consenso de
industria sin investigación publicada** — y un proveedor (Talkable) sostiene lo contrario, que
post-compra estanca y el mejor momento es la recompra. **Pruébalo tú con A/B**: tienes
`delivered_at` y la calificación, y el experimento es gratis.

**b) Tu proporción 3.3:1 no tiene respaldo, y Rappi Perú hace lo contrario.** Tú das 400 puntos a
quien invita y 120 al invitado. **Rappi Perú da S/150 en créditos al invitado y S/3–30 al
referidor** — asimetría invertida. Lo que sí está probado `[ESTUDIO]` (Jin & Huang, 4 experimentos):
**la recompensa en producto genera más referidos que la monetaria**, porque pedir plata por
recomendar ensucia la recomendación. Tu diseño ya está del lado correcto en eso.

**c) El escalón del 10.º referido probablemente está muerto.** Con tasas reales de 5–15% de gente
que comparte, casi nadie llega. Y está documentado el **post-reward reset**: un escalón inalcanzable
desmotiva. Ya muestras el progreso ("vas X de Y"), que es lo correcto — pero considera mover el
10.º más cerca.

---

## 4. Perú y Trujillo

`[ESTUDIO]` DataReportal 2026: **Facebook es la red más grande de Perú** — 24.7 M de alcance
publicitario, **71.3% de la población**. No es la red "vieja" acá; es donde está la gente.

**Google Business Profile sirve aunque no tengas local visitable**: un negocio solo-delivery debe
ocultar la dirección y declarar áreas de servicio. Es gratis y trae el botón de "Pedir" en Maps.
Cuánto convierte en Perú: **nadie lo publica**.

**Rappi/PedidosYa cobran 18–30% de comisión** (efectivo 25–34% con fees). Con tu costo de insumos
al 45%, eso deja el pedido **en pérdida**. Su valor no es rentabilidad: es descubrimiento pagado
por pedido. Solo tendría sentido con precios diferenciados.

⚠ **Ley 29733**: exige consentimiento explícito antes de mensajes de marketing. La app ya pide
permiso para push del navegador y tiene consentimiento separado para usar reseñas como testimonio
— pero conviene revisar que los diez recordatorios automáticos estén cubiertos por ese permiso.

**Horarios de pedido en Perú:** picos 12:00–16:00 (~30%) y 18:00–20:00 (~40%). *(Fuente secundaria,
probablemente sesgada a Lima.)*

**No encontré ni un solo caso de sandwichería o delivery en Trujillo con datos públicos.** Es un
hueco real, no una falla de búsqueda.

---

## 5. Lo que ninguna de las diez investigaciones pudo verificar

Vale la pena tenerlo escrito, porque es donde un plan se vuelve fantasía:

- CPM, CPC, CTR y CVR **medidos** de Perú por rubro comida. Todo lo que hay es de agencias.
- Cualquier diferencia numérica entre Trujillo y Lima.
- Un solo experimento sobre menús secretos.
- Comparación limpia de **personaje animado vs persona real** en adultos.
- Cuántas exposiciones hacen falta para que un personaje se ancle a la marca.
- Tasa de canje de un inserto físico en la bolsa.
- Datos de retención de Perú o LatAm (todo es EE.UU./Europa).

---

*Diez investigaciones paralelas + auditoría del código, 2026-09-04. El sistema operativo de video
está en `FLUJO_VIDEO_ANUNCIOS.md`.*
