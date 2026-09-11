# SND//WCH — revisión estética de la app (2026-09-10)

Medida sobre **14 pantallas renderizadas**, no mirada por encima. Cada número de abajo salió
de recorrer el DOM real con el navegador.

---

## 1 · Lo que está bien y no hay que tocar

**La dirección visual está aplicada.** Las 27 pantallas del cliente comparten wordmark,
tipografía (EB Garamond + Bodoni Moda) y paleta. No hay ninguna pantalla "de la versión
anterior" — eso se creyó durante un tiempo y era falso.

**El recibo tipo ETIQUETA** (Plan Semanal, confirmación de pedido, detalle) es el mejor
tratamiento de la app: monoespaciada, borde troquelado, jerarquía clara. Es el único sitio
donde la tercera familia tipográfica (`ui-monospace`) aparece, y está bien justificada.

**Los estados vacíos con los hermanos** funcionan: Mis Pedidos, Favoritos, Pedido Fijo y
Direcciones tienen personaje, texto y salida. No son pantallas mudas.

---

## 2 · Lo que hay que MEJORAR — con los números

### El sistema no es un sistema: es una acumulación

> ✅ **RESUELTO el 2026-09-11.** Los dos primeros, consolidados. Se deja la medición
> original porque explica de dónde venía el problema.

| qué | antes | ahora |
|---|---|---|
| **Tamaños de letra** | **34** | **11** (8 de texto + 3 de display) |
| **Radios de borde** | **13** | **6** |
| **Colores de texto** | **24** | sin tocar — ver abajo |

Los tamaños incluyen **20, 21 y 22 px a la vez**: nadie distingue 21 de 22, así que no
comunican jerarquía — solo la enturbian. Y hay un `6.6px`, que casi seguro es un `em`
heredado y no una decisión.

Los radios incluyen 4, 5, 6, 14 y 16 con **uno a seis usos cada uno**: ruido puro al lado de
los tres que sí cargan el peso (10, 12 y el círculo).

Entre los colores de texto conviven `#999999` y `#888888` — **grises neutros puros, sin
sesgo hacia la paleta**. Tienen justificación de contraste documentada (`#666` daba 3.4:1,
bajo el mínimo AA), así que **no son descuido**: lo que les falta es sesgo. Un gris con una
pizca de verde cumple el mismo contraste y se lee como elegido en vez de heredado.

**Cómo se hizo, porque el método importa más que el resultado:** la escala se construyó
sobre el **uso real** (los valores con cientos de usos son anclas y arrastran a sus vecinos),
y **en empate el valor sube, nunca baja** — la primera versión bajaba el cuerpo de 12 a 11px,
o sea consistencia a cambio de legibilidad en una app que se usa en un celular. Con la regla
correcta, 415 usos suben y solo 74 bajan.

Se verificó **capturando las 20 pantallas antes y después** y comparándolas píxel a píxel:
ninguna creció más de 80px, ninguna se rompió. Un refactor de tipografía sin esa comparación
es fe, no verificación.

**Los 24 colores de texto siguen sin tocar**, a propósito: los grises neutros tienen
justificación de contraste documentada (`#666` daba 3.4:1, bajo el mínimo AA) y cambiarlos
exige recalcular contraste caso por caso, no un mapeo mecánico. Es el siguiente paso, no
este.

### El azul y el verde no explican por qué

El fondo cambia entre verde (`#1E3932`) y azul (`#102430`) según el "lado": SANDO es verde,
WICHO azul. La idea es buena. El problema es que **el criterio no se lee**: la tarjeta de
regalo es azul y el Plan Semanal verde, y las dos son de saldo. Un cliente no percibe una
identidad, percibe que la app cambia de color sin motivo.

### El mismo WICHO, dos veces

Favoritos y Pedido Fijo usan **la misma pose del mismo hermano**. Al navegar entre las dos se
lee como que la pantalla no cambió.

---

## 3 · Lo que hay que AGREGAR

**Los estados de espera y de rechazo.** Los vacíos ya están; faltan los otros cuatro, que son
los momentos más tensos de la app: pedido en camino, tienda cerrada, dirección fuera de
cobertura, menú secreto bloqueado. Hoy son texto solo. **Dependen de las poses** — cada una
tiene su sitio ya elegido en `docs/PROMPTS_PERSONAJES.md`.

**Fotos de Signature con los píxeles que la pantalla pide.** La tarjeta ocupa 1050 px reales
y las fotos tienen 640: se estiran 1.64x. El tratamiento común ya está aplicado y el script
cierra el encuadre solo cuando la fuente lo aguante.

---

## 4 · Lo que hay que AUTOMATIZAR

Todo lo de esta lista comparte modo de fallo: **no rompe nada, solo se degrada**.

| # | qué | por qué no alcanza con mirar |
|---|---|---|
| 1 | **Congelar el sistema visual** | Hecho — `check:sistema`. Y la consolidación también: de 34 tamaños a 11 y de 13 radios a 6 |
| 2 | **Que ningún texto al cliente prometa un mecanismo apagado** | Ya cazó un caso real: el brief prometía la hora valle, retirada hace semanas. Hecho — `tests-api/ocasiones-del-brief.test.ts` |
| 3 | **Que las fotos servidas tengan los píxeles que su contenedor pide** | Hecho — `check:fotos` avisa foto por foto cuánto le falta |
| 4 | **Que ningún personaje se corte dentro de su contenedor** | Fue un defecto real (SANDO sin cabeza) y no dio ningún error: la app se veía "rara" y nada más |
| 5 | **Que dos pantallas contiguas no usen la misma pose** | El caso de Favoritos y Pedido Fijo |

**Los cinco existen ya.** El 1 era el que más valía y además destrabó la consolidación: con el
chequeo puesto, migrar 522 usos deja de ser un riesgo que se revierte solo en unos meses.

---

## 5 · Lo que NO es un problema aunque lo parezca

- **El botón flotante de WhatsApp sobre el contenido.** Es comportamiento normal de un botón
  flotante. Se revisó si tapaba algo al final del scroll y no se pudo demostrar.
- **El pedido grupal "vacío".** Sin datos muestra su esqueleto de carga, que es correcto.
- **Los dos hermanos con estilos distintos.** Es el concepto, no un descuido — decisión del
  dueño, documentada en `CLAUDE.md`.

---

## 6 · Lo que apareció y NO es estético

**La tarjeta de regalo es una elección dominada.** Regalar el mínimo (S/10) cuesta **400
puntos** — exactamente lo mismo que R06, el sándwich de S/20.90 gratis para uno mismo. Por el
mismo esfuerzo, el cliente racional se lleva el doble de valor sin regalar nada. Y llegar a
esos 400 puntos toma **19 pedidos**.

La pantalla ya lo dice con honestidad (avisa cuánto falta y en cuántos pedidos), pero
**la tasa es decisión del dueño**: hoy la función existe y casi nadie va a poder usarla.
