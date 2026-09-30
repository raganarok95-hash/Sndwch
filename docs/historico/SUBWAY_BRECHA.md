# SND//WCH — Qué le falta al menú para igualar a Subway Perú

**2026-09-04, revisado el 2026-09-06.** Comparado contra **Subway Perú**, no contra el de
Estados Unidos: el menú cambia por país y el peruano es más corto.

> **Ya cerrado desde la primera versión:** el **PAVO**, que era la proteína de Subway que no
> teníamos en ningún formato. Entró el 2026-09-06 como P08 a S/15.90 / S/28.90 y devolvió ARMA
> EL TUYO a cuatro proteínas. Lo hizo posible que **es fiambre y no tiene merma de cocción** —
> ver `RECETARIO.md` P08 y la sección de proteínas en `CLAUDE.md`.

Un dato que vale la pena notar antes de la lista: **Subway Perú vende en 15 y 30 cm**, los
mismos dos tamaños que nosotros. La estructura del producto ya coincide.

---

## 1. Vegetales — nos faltan tres

| vegetal | Subway 6" | nosotros | |
|---|---|---|---|
| Tomate | 35 g | 35 g | ✅ |
| Lechuga | 21 g | 21 g | ✅ |
| **Pepino** | **17 g** | — | ❌ **falta** |
| Pepinillo | 12 g | 12 g | ✅ |
| Cebolla | 7 g | 7 g | ✅ |
| Pimiento verde | 7 g | 7 g | ✅ |
| **Espinaca** | **7 g** | — | ❌ **falta** |
| **Ají banana** | **4 g** | — | ❌ **falta** |
| Aceituna negra | 3 g | 3 g | ✅ |
| Jalapeño | sí | **solo menú secreto** | ⚠ |
| Apio | no lo tiene | 7 g | *(nuestro, en THE FRESH)* |

**Los tres juntos son 28 g = S/0.112 por sándwich de 15CM.**

**El que más importa es el pepino.** Son 17 g —el tercero en volumen después de tomate y
lechuga— y aporta lo que hoy nadie aporta en ARMA EL TUYO desde que salió el apio: **crujido
fresco y agua fría**. Es además de los más baratos por gramo.

La espinaca y el ají banana son de segundo orden: la espinaca es la señal "saludable" del
mostrador y el ají banana es un acento ácido-picante barato.

⚠ **El jalapeño está en el catálogo pero es exclusivo del menú secreto.** En Subway Perú es
un vegetal normal. Liberarlo a ARMA EL TUYO no cuesta nada (ya está costeado y en inventario)
— pero le quita exclusividad al menú secreto, y eso es una decisión de producto.

---

## 2. Panes — 2 contra 4

**Subway Perú:** Blanco, Integral, Avena, Orégano/Parmesano.
**Nosotros:** Classic White, Focaccia Artesanal.

Nos falta un **integral o de avena** — la opción "sana", que es la que no tenemos en ningún
eje del menú.

**El de orégano/parmesano ya existió acá**: era `B02 HERBS//CHEESE`, retirado por decisión
tuya. Volver a ponerlo es reactivar una fila, no diseñar nada.

⚠ Cada pan es un SKU más del panadero, con su mínimo de pedido y su merma. **Esta es la
brecha donde "igualar a Subway" tiene un costo operativo real**, no como los vegetales.

---

## 3. Quesos — 3 contra ~7

**Nosotros:** Mozzarella, Cheddar, Edam.
**Subway:** American, Pepper Jack, Provolone, Mozzarella rallada, Mozzarella fresca,
Parmesano, Monterey Cheddar.

La brecha real no es el número sino que **no tenemos ningún queso con carácter**: los tres
nuestros son suaves. Falta uno picante o intenso tipo pepper jack o provolone.

---

## 4. Salsas — donde ya somos distintos a propósito

**Nosotros tenemos 8 públicas** (Aioli, BBQ, Honey Mustard, SNDWCH Special, Oil & Vinegar,
Teriyaki, Chimichurri de piña y ají, Dijon) más 2 exclusivas del menú secreto.
**Subway tiene ~12.**

Lo que nos falta en concepto: **mayonesa sola**, **ranch** (existió y la retiraste),
**chipotle** y **sriracha**.

⚠ Pero hay una diferencia estructural más importante que la lista: **Subway no cobra las
salsas. Son gratis e ilimitadas.** Nosotros incluimos 3 y cobramos la 4ta a S/2 — o sea que
**ya somos más restrictivos que Subway en el eje donde ellos son más generosos.**

---

## 4b. LA OPCIÓN "¿LO QUIERES TOSTADO?" — la brecha más grande, y no es un ingrediente

**Es lo único de esta lista que no cuesta un solo céntimo de insumo, y probablemente sea lo que
más se nota.** Es el ritual más reconocible de Subway: no está en ninguna tabla de ingredientes
y aun así es lo que la gente recuerda del mostrador. Nosotros no lo ofrecemos en ningún lado.

Costo de insumo: **S/0**. Costo real: **tiempo por pedido** (~90 segundos en horno de tostado) y
un equipo que hoy no está en la lista de `RECETARIO.md` PARTE 6.

⚠ **Y hay una objeción de fondo que hay que resolver antes, no después: nosotros somos delivery,
Subway es mostrador.** Un sándwich tostado que viaja 30 minutos en una moto llega blando y
tibio — o sea, llega peor que uno frío que nunca prometió estar caliente. Es la misma clase de
problema que el hielo en las bebidas, y tiene la misma forma de solución: **o se resuelve el
empaque, o no se ofrece.**

Tres caminos, en orden de honestidad:

1. **No ofrecerlo y decir por qué.** "No tostamos porque a 30 minutos de viaje el tostado llega
   blando" es una razón que el cliente entiende y que además diferencia.
2. **Ofrecerlo solo para retiro en local**, si alguna vez existe ese canal.
3. **Ofrecerlo con empaque que respire** (papel perforado o rejilla) y medirlo. Es el más caro y
   el único que puede fallar en silencio: nadie reclama un sándwich blando, simplemente no vuelve.

**No es una decisión de código: es de operación y de empaque.** Pero mientras no se tome, sigue
siendo la brecha más visible con Subway que tenemos.

---

## 4c. Extras cobrados — Subway monetiza el armado, nosotros casi no

Subway Perú cobra por **palta, tocino, extra queso y doble carne**. Nosotros solo cobramos dos
cosas encima del sándwich: **doble proteína** y **salsa extra (la 4ta, S/2)**.

El **extra de queso** es el hueco más obvio, y es gratis de implementar porque el ingrediente ya
está en inventario: el queso es **gratis** en SND//WCH (decisión del dueño 2026-09-04) y cuesta
S/0.39 en 15CM / S/0.77 en 30CM. Una **porción adicional** cobrada a S/2 sería ~20% de costo — de
lo más rentable del catálogo, sin comprar nada nuevo y sin tocar la promesa de que el primero va
incluido.

La **palta** es el otro, y es el que más sube el ticket percibido en Perú (ver punto 5). Pero
tiene una trampa operativa que ningún otro ingrediente tiene: **se oxida en horas**, y el dueño
cocina por tandas 1-2 veces por semana. O se corta al momento por pedido, o no se ofrece.

**Tocino** exige insumo nuevo + cocción + tanda propia: es el de peor relación esfuerzo/retorno
de los cuatro.

---

## 5. Lo que Subway Perú tiene y nosotros no, fuera de las listas

- **Palta.** Es el extra latino por excelencia y aparece en su menú peruano. No la tenemos en
  ningún formato.
- **Pan del día horneado en local.** No es replicable por una persona sola, y ya está decidido
  comprar el pan.
- **Ensaladas** (el mismo relleno sin pan) y **wraps**. Quitan el costo del pan (S/1-2) pero
  exigen un envase nuevo que hoy no existe: el empaque está resuelto para papel + bolsa, no para
  bowl. Es agregar un SKU de empaque para un producto sin demanda demostrada.
- **Acompañamientos de comida** (papas, galletas, nachos). **Ya está descartado** por decisión
  del dueño 2026-08-15 — la palanca equivalente acá es la bebida, que además tiene mejor margen
  (19-32% de costo). No volver a proponerlo.

---

## 6. Qué haría, en orden

*(Reordenado el 2026-09-06, con el pavo ya cerrado.)*

1. **Extra de queso cobrado, S/2.** Cuesta S/0.39 y no exige comprar nada nuevo: el ingrediente
   ya está en inventario y ya es gratis en la primera porción. Es la única de la lista que
   **sube el margen en vez de gastarlo**, y es un cambio de código chico.
2. **Pepino.** 17 g, S/0.068. Devuelve el crujido que perdió ARMA EL TUYO al salir el apio, y es
   la brecha de ingrediente más barata y más notoria en boca. *(Ojo: es lo que más agua suelta
   después del tomate — va arriba de las salsas si el viaje pasa de 20 min, misma regla que la
   lechuga.)*
3. **Decidir el TOSTADO** (sección 4b). No es implementarlo: es decidir si se ofrece, si se
   declina explicando por qué, o si se resuelve el empaque primero. Mientras no se decida, es la
   brecha más visible que tenemos.
4. **Espinaca y ají banana.** S/0.044 los dos. Completan el set estándar de vegetales.
5. **Palta como extra cobrado**, si se consigue a precio estable Y se corta al momento. El
   ingrediente que más sube el ticket percibido en Perú, con la peor vida útil del catálogo.
6. **Un pan integral o de avena.** La única brecha con costo operativo real — decide si el
   panadero puede sin subir el mínimo.
7. **Un queso con carácter.** Reemplazo o cuarta opción, no urgente.

**Lo que NO haría:** perseguir el conteo. Subway tiene 12 salsas porque tiene una cadena de
suministro global; nosotros tenemos 8 y **cuatro son de receta propia**, que es una ventaja,
no una carencia. Igualar la lista no es el objetivo — igualar **lo que el cliente ve en el
mostrador y siente en el bocado** sí.

---

*Fuentes: información nutricional oficial de Subway y las bases que la publican; menú de
Subway Perú vía Rappi y el sitio regional de Subway. Los gramajes son del 6-inch.*
