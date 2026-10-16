---
name: producir-piezas
description: Cómo se producen las imágenes y las piezas de SND//WCH (fotos de producto fieles a la receta con IA, imágenes de los hermanos en Flow, anuncios e historias montados con los scripts de scripts/piezas). Úsala para generar una imagen, montar un anuncio o una historia, o rehacer una pieza devuelta por arte.
user-invocable: false
---

# Producir piezas

El Productor ejecuta lo que ya aprobó la **Puerta 1** (concepto + maqueta). No inventa conceptos:
si algo del encargo no se puede hacer, lo dice y propone el cambio más chico.

## 1 · Las imágenes: de dónde salen

| qué | con qué | dónde corre | notas |
|---|---|---|---|
| **Foto de producto** (anuncios, carta) | Figma `generate_image` (modelo `gemini-3.1-flash-image`, créditos de IA del plan de Figma del dueño) | sesión de la nube o aquí | el contenedor **no llega a figma.com**: la URL que devuelve se baja con el workflow `traer-imagenes.yml` (entrada `imagenes`: `[{"nombre":"x.png","url":"…"}]`) y queda en la rama `imagenes-generadas` (`git fetch origin imagenes-generadas`) |
| **Los hermanos y sus escenas** (historias, serie) | **Flow**, con la referencia de cada personaje | la laptop del dueño (`scripts/estudio/FLOW_EN_CHROME.md`) | se encarga con un archivo en `docs/marketing/estudio/encargos/<id>.md` (formato en `docs/marketing/estudio/README.md`); vuelve en `estudio/hecho/<id>/` |
| **Fotos de la app** | las reales de `img/` | — | no se reemplazan con IA (`check:fotos`) |
| **Stock** | Adobe Stock **solo `pricing:"free"`** | — | una foto con precio es gasto: requiere el sí del dueño |

**Nunca** generes a SANDO o a WICHO fuera de Flow con su referencia, ni los recortes para pegarlos
sobre una foto (dueño, 2026-10-16: se abandonó el recorte sobre fondo azul).

## 2 · El prompt de una foto de producto fiel

Se escribe en inglés, desde la receta de `docs/hechos/CARTA.md`, con este orden:
1. El pan y el tamaño: `15 cm soft white sub roll` (el pan de la receta).
2. **Cada ingrediente de la receta**, con su forma real («thinly sliced beef sautéed», «thin folded
   roasted turkey slices»).
3. **Lo que NO lleva**, en negativo explícito: `no cheese`, `no cucumber`, `no mayonnaise`, `no
   herbs`. La IA agrega lo típico del plato si no se lo prohíbes.
4. La porción: `moderate portion (~85 g of protein), single layer, not overstuffed`.
5. El lugar y la hora del momento (`estilo-sndwch`): `brown kraft paper on a desk next to a laptop,
   midday window light` o `kraft paper, warm evening lamp light`.
6. El encuadre: `three-quarter angle, sandwich facing the viewer, ready to eat, shallow depth of
   field`.
7. Lo prohibido siempre: `no people, no hands, no logos, no text, no alcohol, no other food`.

Pide **2 variantes** por foto y guarda el prompt exacto junto a la imagen: el Director de arte y
Calidad lo necesitan para revisar. Los prompts aprobados viven en
`docs/marketing/anuncios/README.md`.

## 3 · Montar la pieza

Todo número sale de los datos vivos:
```
node_modules/.bin/deno run --allow-read --no-check scripts/piezas/datos.ts > /tmp/datos.json
```
Las fuentes en la nube (el Chromium no carga Google Fonts; curl sí):
```
FUENTES_CSS=$(bash scripts/piezas/fuentes-locales.sh)  # + PLAYWRIGHT_CHROMIUM_PATH=/opt/pw-browsers/chromium
```
| pieza | script |
|---|---|
| anuncio (4:5 feed + 9:16 historias y reels) | `scripts/piezas/anuncios.mjs` |
| historias de la semana | `scripts/piezas/historias.mjs <semana> /tmp/datos.json` |
| lanzamiento, bolsa, stickers | `lanzamiento.mjs`, `bolsa.mjs`, `stickers.mjs` |

Los scripts **fallan a propósito** si falta una fuente o un producto ya no está en la carta: no los
fuerces, arregla la causa.

## 4 · Antes de entregar
- Mira cada salida tú mismo (abre el JPG/PNG): texto cortado, letra de respaldo, texto sobre la
  comida, zonas de Instagram.
- Entrega en la carpeta de la pieza (`docs/marketing/piezas/<id>/`): las imágenes finales, la
  maqueta si cambió, y en `PRODUCCION.md` el prompt exacto, la variante y lo que cambiaste.
- No publiques ni subas nada a Meta: eso es del Media buyer, en pausa, y lo prende el dueño.
