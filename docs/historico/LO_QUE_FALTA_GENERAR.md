# SND//WCH — todo lo que falta generar, en orden

> **Esto es la LISTA y el ORDEN. Los prompts viven en `docs/PROMPTS_PERSONAJES.md`** y este
> archivo apunta a la sección exacta de cada uno. No se copian acá: dos sitios con el mismo
> prompt terminan en que uno se actualiza y el otro no, que es el defecto que este repo más
> castiga.

---

## Antes de generar nada: 9 imágenes ya hechas están muertas

En `img/` hay **13 PNG de personaje** y **9 no se usan en ninguna pantalla**:

```
sando_grita  sando_mira  sando_piensa  sando_saluda  sando_serio
wicho_grita  wicho_rie   wicho_saluda  wicho_cuerpo
```

La app solo usa hoy `sando_sonrie` (en el checkout) y los `_cuerpo` en la home. **Parte de lo
que "falta" no es generar: es usar lo que ya existe.** Eso es trabajo de código, no del dueño, y
está anotado como tarea aparte.

---

## Orden recomendado

El criterio no es la dificultad, es **cuánto cambia lo que el cliente ve**.

| orden | qué | por qué va ahí |
|---|---|---|
| 1 | **El corte** — los dos hermanos y el `//` | no existe y es la imagen de marca |
| 2 | Las 5 fotos de Signature | es lo que se ve mal HOY en la app y en el reel |
| 3 | Los 6 escenarios de Flow | destraban el video |
| 4 | Las 3 poses que le faltan a WICHO | destraban los estados de espera y error |
| 5 | MAFE definitiva | el personaje nuevo |
| 6 | Regenerar las 13 existentes a 2048 px | mejora lo que ya funciona |

---

## 1 · EL CORTE — la imagen que no existe

**Prompt: `PROMPTS_PERSONAJES.md` § 4.1.**

Los dos hermanos sosteniendo el mismo sándwich partido en dos, y **el hueco entre las mitades es
el `//`**. Hoy el logo y los personajes son dos cosas que conviven en la misma pantalla sin
tocarse; esta imagen los vuelve una sola cosa.

Destino: hero de la home, Instagram, y la tarjeta del QR de la bolsa.

⚠ **Cada hermano conserva SU propio estilo en esta imagen.** Es el único sitio donde los dos
aparecen juntos, y la gracia es que se note que están dibujados por dos manos distintas.

---

## 2 · LAS FOTOS DE PRODUCTO

**Prompts: `PROMPTS_PERSONAJES.md` § 5.**

**El párrafo de montaje es FIJO y se copia palabra por palabra en las cinco.** Solo cambia el
bloque del relleno. Si se reescribe "mejorándolo" en cada foto, vuelve el problema que estas
fotos vienen a resolver.

- [ ] THE ORIGINAL
- [ ] THE MARINARA
- [ ] THE SMOKE
- [ ] THE FRESH
- [ ] THE TERIYAKI
- [ ] Las 3 bebidas, a contraluz
- [ ] El corte del pan, primerísimo plano, vertical 9:16

**Mínimo 1600 px de ancho.** Las de hoy son de 640 y la tarjeta ocupa 1050 px reales.

**SIG05 no se fotografía nunca** — su composición no se le revela al cliente, ese es el
mecanismo entero del menú secreto.

**Verifica la receta contra el panel antes de pedir cada foto**: la composición vigente vive en
`catalog_items`, no en el código.

Al terminar van a **`img/fuente/`**, no a `img/`. `scripts/tratar_fotos.py` lee de ahí y escribe
en `img/` — esa dirección es lo que lo hace idempotente.

---

## 3 · LOS SEIS ESCENARIOS

**Prompts: `PROMPTS_PERSONAJES.md` § 4.2.** Se piden vacíos, sin personajes ni manos.

- [ ] La cocina
- [ ] La tabla de SANDO
- [ ] El mostrador de WICHO
- [ ] La barra de MAFE
- [ ] La bolsa
- [ ] La mesa del cliente

---

## 4 · LAS POSES DE WICHO

**Prompts: `PROMPTS_PERSONAJES.md` § 4.3.**

- [ ] `wicho_mira`
- [ ] `wicho_piensa`
- [ ] `wicho_serio`

SANDO ya tiene las tres; WICHO ninguna. Son las que la app necesita para los estados de espera,
de error y de vacío.

---

## 5 · MAFE

**Prompt: `PROMPTS_PERSONAJES.md` § 3.3.**

- [ ] Generar variantes y elegir una
- [ ] Guardarla como `img/mafe_ref.png`
- [ ] Crearla como personaje en Flow con esa referencia
- [ ] Sus poses, una vez fijada

---

## 6 · REGENERAR LO QUE YA EXISTE

Las 13 imágenes de personaje de hoy tienen **tres defectos a la vez**:

1. **640 px** cuando la tarjeta pide 1050 y el reel 1080.
2. **Halo de recorte** — se recortaron contra fondo claro y se ve sobre verde, azul y negro.
3. **Elipse de sombra de piso** en las de cuerpo entero, que **no se puede quitar por software**:
   está medido que la sombra y la suela de la zapatilla son el mismo color.

Antes de aceptar cualquier reemplazo: `python3 scripts/check_personaje.py <archivo.png>`. Compone
el PNG sobre los cuatro fondos reales de la app y mide los tres defectos. **Mirarlo sobre blanco
no sirve** — el halo es blanco, así que sobre blanco es invisible, y por eso llegó a producción.

---

## Lo que NO es generar imágenes

- **Los dos secrets de Meta** (`docs/CONFIGURAR_META.md`). Sigue siendo el bloqueo número uno del
  negocio: sin ellos no hay CAC medido y todo el modelo cuelga de un número que sale de blogs.
- **Instalar el MCP de Flow** (`docs/FLOW_EN_TU_LAPTOP.md`) — hecho.
- **Instalar OpenMontage** (`docs/OPENMONTAGE_EN_TU_LAPTOP.md`) — pendiente.
- **Decidir el ciruela `#2B1B2A`** como fondo de la sección de bebidas, si MAFE entra a la app.
- **Decidir si se aplica el defringe** a los PNG actuales mientras llegan los buenos.
