---
name: SND//WCH
description: Sandwichería online — Prada Caffè disciplina plana sobre verde bosque profundo, con dorado como único acento.
colors:
  gold: "#CBA258"
  gold-bright: "#E9C98A"
  forest-bg: "#1E3932"
  forest-card: "#2D5246"
  forest-card-deep: "#1A3028"
  forest-border: "#3A6B58"
  border-soft-black: "#1c1c1c"
  text-primary: "#FFFFFF"
  text-body: "#F2F0EB"
  text-muted: "#A8C8B0"
  text-muted-2: "#8BAF9A"
  text-muted-3: "#3A4A44"
  status-received: "#ffa500"
  status-preparing: "#3A86FF"
  status-enroute: "#9b6fff"
  status-delivered: "#25D366"
  status-cancelled: "#A5A5A5"
  status-error: "#ff8888"
  admin-light-bg: "#F3EEE1"
  admin-light-card: "#FFFFFF"
  admin-light-accent: "#8A5000"
  admin-dark-bg: "#000000"
  admin-dark-card: "#161616"
  admin-dark-accent: "#FFB020"
typography:
  display:
    fontFamily: "Bodoni Moda, serif"
    fontSize: "16-42px (contextual)"
    fontWeight: 640
    lineHeight: 1
    letterSpacing: "0.02em"
  headline:
    fontFamily: "Bodoni Moda, serif"
    fontSize: "14-24px"
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: "0.03em"
  label:
    fontFamily: "EB Garamond, serif"
    fontSize: "9-11px"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.1-0.2em"
  body:
    fontFamily: "EB Garamond, serif"
    fontSize: "12-14px"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  wordmark:
    fontFamily: "Fraunces, serif"
    fontSize: "16-64px (contextual)"
    fontWeight: 620
    lineHeight: 1
    letterSpacing: "0.02em"
rounded:
  xs: "4px"
  sm: "8px"
  md: "10px"
  lg: "12px"
  xl: "14px"
  full: "50%"
spacing:
  xs: "6px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  xxl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.gold}"
    textColor: "#241a08"
    typography: "{typography.headline}"
    rounded: "{rounded.md}"
    padding: "14px"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.text-muted}"
    typography: "{typography.headline}"
    rounded: "{rounded.md}"
    padding: "14px"
  input-field:
    backgroundColor: "{colors.forest-card}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.md}"
    padding: "14px 16px"
  card-selection:
    backgroundColor: "{colors.forest-card}"
    rounded: "{rounded.md}"
    padding: "14px 16px"
  card-selection-active:
    backgroundColor: "{colors.forest-card-deep}"
    rounded: "{rounded.md}"
    padding: "14px 16px"
---

# Design System: SND//WCH

## Overview

**Creative North Star: "The Prada Caffè Discipline"**

El nombre viene literal del código: dos comentarios del propio `src/app.ts` invocan "dirección Prada Caffè" al justificar por qué se retiró un sistema anterior de sombras/degradados/textura. La disciplina es esa — un verde bosque profundo casi negro (`#1E3932`) como fondo constante, tarjetas planas apenas un tono más claras, y un único acento dorado (`#CBA258`) que nunca compite consigo mismo. Nada brilla que no deba brillar. La app entera es de una sola columna (max 480px), pensada para leerse como una carta de restaurante editorial servida en un celular, no como un panel de e-commerce genérico.

La tipografía hace casi todo el trabajo de jerarquía: Bodoni Moda (display, con `font-optical-sizing:auto`, pesos 600-640) para todo lo que el ojo debe encontrar primero — nombres de producto, precios, títulos de pantalla — y EB Garamond (itálica en eyebrows/labels, regular en cuerpo) para todo lo demás, incluyendo microcopy en mayúsculas espaciadas (`letter-spacing:.1-.2em`) que reemplaza lo que en otro sistema serían chips o badges. El resultado se lee más "menú impreso de restaurante caro" que "app de delivery".

El panel admin es un mundo aparte deliberado: mismo esqueleto de componentes, pero fondo neutro cálido/negro puro (nunca el verde del cliente) y acento ámbar en vez de dorado — la separación de paleta es la señal de "estás en la cocina, no pidiendo". Ver Colors → Admin Scope.

**Key Characteristics:**
- Fondo verde bosque casi negro (`#1E3932`) constante en todo el flujo de cliente — nunca blanco, nunca gris neutro.
- Un solo acento (dorado `#CBA258`) usado con moderación real — colores de estado (naranja/azul/morado/verde) existen aparte y nunca se confunden con el acento de marca.
- Planitud deliberada: sombras solo `0 2px 6px rgba(0,0,0,.22)` como máximo, nunca glow ni degradado decorativo (el sistema anterior de "profundidad" fue retirado a propósito).
- Bodoni Moda para todo lo que pesa, EB Garamond para todo lo que acompaña — sin una tercera familia de cuerpo.
- El "//" no es solo texto: tiene su propio componente (`.wm-mark`, dos barras doradas sesgadas) reservado para el wordmark; en cualquier otro lugar del copy es `.cut-sep`, mucho más liviano.

## Colors

Paleta de una sola nota de acento sobre un fondo oscuro casi monocromático — los colores de estado (semáforo de pedidos) viven deliberadamente afuera de esta paleta de marca, nunca se los trata como variantes del dorado.

### Primary
- **Dorado SND//WCH** (`#CBA258`): el único acento de marca — precios, bordes de selección activa, iconografía por defecto, CTAs primarios (fondo sólido). Su rareza es el punto: en la mayoría de pantallas aparece en menos del 15% de la superficie.
- **Dorado claro** (`#E9C98A`): solo en el degradado del wordmark (`.wm-mark i`, de `#E9C98A` a `#CBA258`, 180deg) — nunca suelto en otro contexto.

### Neutral
- **Verde bosque profundo** (`#1E3932`): el `--sw-bg` — fondo base de toda pantalla de cliente, y color de fondo de `body`/`#app` en el shell. Es la superficie de reposo, no una tarjeta.
- **Verde tarjeta** (`#2D5246`): `--sw-card` — superficie de tarjetas, inputs, botones secundarios. Un paso de luminosidad sobre el fondo.
- **Verde tarjeta profunda** (`#1A3028`): `--sw-card2` — estado "seleccionado" o superficie secundaria dentro de una tarjeta ya elevada (nunca ambos a la vez con `--sw-card`).
- **Borde verde** (`#3A6B58`): `--sw-border` — divisores y bordes por defecto sobre fondo verde.
- **Borde negro suave** (`#1c1c1c`): `--sw-border-soft` — usado en tarjetas más planas/densas (ej. filas de lista) donde un borde verde se vería demasiado presente.
- **Blanco** (`#FFFFFF`): `--sw-text` — texto de mayor peso (nombres, títulos, precios).
- **Hueso** (`#F2F0EB`): `--sw-text-body` — cuerpo de texto largo, ligeramente cálido frente al blanco puro.
- **Salvia apagada** (`#A8C8B0`): `--sw-text-muted` — el color de texto secundario más usado de toda la app (240+ ocurrencias) — labels, timestamps, subtítulos.
- **Salvia más apagada** (`#8BAF9A` / `#3A4A44`): variantes de `--sw-text-muted` para jerarquías terciarias/footnotes.

### Named Rules (optional, powerful)
**The One Accent Rule.** El dorado es el único acento de marca en toda la app — los colores de estado del pedido (naranja/azul/morado/verde/gris) son semántica de operación, no expresión de marca, y nunca deben mezclarse ni sustituirse por dorado.

**The No-Glow Rule.** Ninguna tarjeta seleccionada usa sombra dorada, glow, ni degradado como señal de "elegido" — la señal es siempre un borde de 1px en `#CBA258` (o el fondo `--sw-card2`). `SHADOW_GOLD` existe en el código solo como alias legado de `SHADOW_SM`, nunca una sombra realmente distinta.

### Admin Scope (paleta paralela)
El panel admin reemplaza toda la paleta de fondo/tarjeta por una de dos variantes, nunca el verde del cliente:
- **Modo oscuro admin**: fondo `#000000` puro, tarjetas `#161616`/`#0D0D0D`, acento ámbar `#FFB020`.
- **Modo claro admin**: fondo cálido `#F3EEE1`, tarjetas blancas `#FFFFFF`, acento ámbar oscuro `#8A5000` (ajustado para contraste AA sobre fondo claro).

**The Kitchen Signal Rule.** El cambio de paleta (verde↔negro/crema, dorado↔ámbar) es la única señal de "estás en el panel admin, no pidiendo" — ningún otro elemento estructural (tipografía, radios, iconografía) cambia entre cliente y admin.

## Typography

**Display/Headline Font:** Bodoni Moda (con `font-optical-sizing:auto`, pesos 600-640, itálica disponible), fallback `serif`.
**Body/Label Font:** EB Garamond (pesos 400-700, itálica muy usada para eyebrows/labels), fallback `serif`.
**Wordmark Font:** Fraunces (peso 620, `font-optical-sizing:auto`), solo para el logotipo "SND//WCH", nunca para otro texto.

**Character:** Un serif de alto contraste (Bodoni Moda) para todo lo que debe leerse como "carta de restaurante" — nombres, precios, títulos — emparejado con un serif clásico más suave (EB Garamond) que hace de voz de acompañamiento, casi siempre en labels itálicas de tracking abierto que reemplazan lo que en un sistema sans-serif serían mayúsculas de UI.

### Hierarchy
- **Display** (Bodoni Moda, 640, 22-42px, line-height 1): nombres de Signature en tarjetas grandes, totales de pedido, headers de pantalla clave.
- **Headline** (Bodoni Moda, 600, 14-19px, line-height 1.1-1.2): títulos de sección, nombres de producto en listas, botones (`BTN()`).
- **Label** (EB Garamond, 600, 9-11px, letter-spacing 0.1-0.2em, a menudo mayúsculas): eyebrows ("Pedidos activos //"), badges de estado, microcopy de apoyo — el sustituto de "chip de UI" en este sistema.
- **Body** (EB Garamond, 400, 12-14px, line-height 1.5): descripciones, mensajes, texto largo.
- **Body itálica** (EB Garamond, 400 itálico): la variante más usada para subtítulos/hints — comunica "nota aparte", no error ni advertencia.

### Named Rules (optional)
**The Two-Family Rule.** Solo dos familias sirven todo el contenido de UI (Bodoni Moda + EB Garamond); Fraunces está reservada exclusivamente al wordmark. Nunca se introduce una tercera familia para un componente nuevo.

**The "//" Separator Rule.** El glifo `//` (vía `.cut-sep`, sin estilo propio más allá del color heredado, casi siempre `GOLD`) reemplaza el punto, el guion o el "·" como separador de marca dentro de titulares compuestos (ej. "Panel // Operador", "Total //") — es tipografía funcionando como firma de marca.

## Layout

Contenedor único de una sola columna, `max-width:480px`, centrado (`margin:0 auto`), pensado mobile-first sin breakpoints de escritorio reales — en pantallas anchas simplemente queda una columna angosta centrada sobre el fondo. Padding de pantalla estándar `20px` horizontal, `24px` o `20px` superior según si hay header. Ritmo vertical por bloques de tarjeta con `margin-bottom` de `8-16px` entre tarjetas del mismo tipo, `18-28px` entre secciones. Header persistente (`H()`) de `padding:20px 20px 16px` con borde inferior sutil; navegación inferior fija (`NAV()`) de altura fija sobre fondo casi negro semitransparente, con `max-width` espejado al contenedor.

## Elevation & Depth

Sistema deliberadamente plano — no hay jerarquía de elevación por capas de sombra. La única sombra en uso normal es `SHADOW_SM` (`0 2px 6px rgba(0,0,0,.22)`), aplicada de forma uniforme a tarjetas de selección y campos de formulario, nunca escalada para comunicar "más importante". `SHADOW_MD` (`0 4px 14px rgba(0,0,0,.28)`) existe para overlays/modales (fondos que de verdad flotan sobre contenido). La profundidad real se comunica con color de superficie (`--sw-card` vs `--sw-card2`) y borde, no con sombra.

### Shadow Vocabulary (if applicable)
- **Ambiente** (`box-shadow: 0 2px 6px rgba(0,0,0,.22)`): tarjetas de selección, inputs — presente casi siempre, no es un estado especial.
- **Overlay** (`box-shadow: 0 4px 14px rgba(0,0,0,.28)`): modales, hojas inferiores, elementos flotantes sobre el resto de la UI.
- **Publicación admin** (`box-shadow: 0 -6px 20px rgba(0,0,0,.25)`): barra de acción fija al fondo del viewport en "modo foco" — la única sombra que crece con intención (separar la acción principal del contenido que scrollea detrás).

### Named Rules (optional)
**The Flat-By-Default Rule.** Ninguna superficie usa sombra para simular "flotar" en reposo — solo overlays reales (modales, barras fijas) reciben una sombra más fuerte que el ambiente estándar.

## Shapes

Radios consistentemente generosos pero nunca extremos: `8px` y `10px` dominan (botones, inputs, tarjetas de selección — 178 usos combinados), `12px` para tarjetas hero/contenedores más grandes, `14-16px` solo en hojas inferiores (bottom sheets) y modales, `4-6px` en elementos chicos (badges de estado, chips). Círculos completos (`50%`) para avatares, iconos en medallón y el botón de instalar PWA. Sin bordes duros ni esquinas cuadradas en ningún componente interactivo — el único elemento verdaderamente anguloso es el wordmark (`.wm-mark i`, `skewX(-16deg)`, sin radio salvo `1px` de suavizado).

## Components

### Buttons
- **Shape:** radio `10px`, `padding:14px`, ancho completo por defecto (`display:block;width:100%`).
- **Primary (`BTN()`):** fondo sólido dorado (`#CBA258`), texto `#241a08` (marrón casi negro, no blanco — necesario para contraste AA sobre dorado), Bodoni Moda 600 14px, `letter-spacing:.05em`.
- **Outline (`BTN(l,fn,true)`):** fondo transparente, borde `1px solid #A8C8B0`, texto `#A8C8B0` — mismo tipo/tamaño que el primario.
- **Estado admin (semáforo):** cuando el fondo del botón es un color de estado vívido (naranja/azul/morado/verde), el texto SIEMPRE es negro (`#000`), nunca blanco — hallazgo de contraste corregido en auditorías previas.

### Cards / Containers
- **Corner Style:** `10px` (selección estándar), `12px` (hero/resúmenes).
- **Background:** `--sw-card` en reposo; `--sw-card2` cuando la tarjeta representa un estado "activo/seleccionado" o secundario dentro de otra tarjeta.
- **Shadow Strategy:** `SHADOW_SM` uniforme, ver Elevation.
- **Border:** `1px solid var(--sw-border)` por defecto; cambia a `1px solid #CBA258` cuando la tarjeta está seleccionada — el borde dorado ES la señal de selección, no un color de fondo distinto.
- **Internal Padding:** `14-16px` vertical/horizontal estándar; `18-24px` en tarjetas hero o formularios.

### Inputs / Fields (`INP()`)
- **Style:** fondo `--sw-card`, borde `1px solid var(--sw-border-soft)`, radio `10px`, `font-size:16px` (evita zoom automático en iOS), `caret-color` dorado.
- **Icon slot:** ícono opcional a la izquierda (`padding-left:44px` cuando hay ícono, `16px` cuando no), posicionado absoluto, opacidad `.55`.
- **Focus:** sin anillo de foco custom explícito más allá del caret dorado — se apoya en el estilo nativo del navegador sobre el borde ya visible.

### Status Badge (`stBadge()`)
- **Style:** EB Garamond 600 9px, fondo del color de estado al ~9% de opacidad (`color+'18'` en hex), borde al ~27% (`color+'44'`), radio `4px`, padding `3px 9px`, `letter-spacing:.1em`.
- **Colors:** naranja `#ffa500` (Recibido), azul `#3A86FF` (Preparando), morado `#9b6fff` (En camino), verde `#25D366` (Entregado), gris `#A5A5A5` (Cancelado).

### Wordmark (signature component)
- **Qué es:** el logotipo "SND//WCH" — nunca texto plano con `//` literal. El `//` se reemplaza por `.wm-mark`: dos barras (`<i>`) de `width:.15em;height:.82em`, `transform:skewX(-16deg)`, fondo `linear-gradient(180deg,#E9C98A,#CBA258)`, radio `1px`.
- **Por qué:** el glifo `//` literal en Bodoni Moda casi no se distingue a tamaños chicos — las 2 barras sesgadas con degradado dorado sí, y funcionan como marca registrable incluso sola (favicon, splash).
- **Variante admin:** el mismo componente cambia su degradado a ámbar (`#FFC966→#FFB020` oscuro, `#8A5000→#6B3E00` claro) vía `.admin-dark .wm-mark i` / `.admin-light .wm-mark i` — nunca se edita el componente base.

### Navigation
- **Bottom nav (`NAV()`):** fijo, `max-width:480px` centrado, fondo `rgba(11,11,11,.97)` casi opaco, borde superior sutil, 2 tabs (Pedido/Puntos) de igual ancho.
- **Header (`H()`):** flecha de retroceso opcional a la izquierda, wordmark centrado/alineado a la izquierda según contexto, ícono de carrito + toggle claro/oscuro (solo admin) a la derecha, borde inferior `1px solid var(--sw-border-soft)`.

## Do's and Don'ts

### Do:
- **Do** usar dorado (`#CBA258`) solo para: acento de marca, borde de selección, CTA primario, precios — nunca como color de fondo de pantalla completo.
- **Do** mantener los 5 colores de estado del pedido (naranja/azul/morado/verde/gris) completamente separados de la paleta de marca — son semántica operativa, no expresión visual.
- **Do** usar texto negro (`#000`/`#241a08`) sobre cualquier fondo de color vívido (dorado, naranja, verde semáforo) para pasar contraste AA — nunca blanco sobre esos fondos.
- **Do** usar `.wm-mark` para cualquier aparición del logotipo/wordmark; usar `.cut-sep` (glifo simple) para cualquier otro `//` decorativo en copy.
- **Do** mantener `max-width:480px` en cualquier pantalla nueva — el sistema entero asume una sola columna angosta, incluso en desktop.

### Don't:
- **Don't** agregar sombra, glow o degradado decorativo a una tarjeta para comunicar jerarquía — la dirección "Prada Caffè" retiró ese sistema explícitamente por sentirse "con brillos que no debería tener".
- **Don't** introducir una tercera familia tipográfica de cuerpo — Bodoni Moda y EB Garamond cubren toda la jerarquía existente.
- **Don't** usar el verde bosque del cliente (`--sw-bg`/`--sw-card`) en ninguna pantalla admin, ni el ámbar admin en ninguna pantalla de cliente — son paletas mutuamente excluyentes por diseño (ver Kitchen Signal Rule).
- **Don't** usar radios por debajo de `8px` en componentes interactivos grandes (botones, tarjetas, inputs) — esos valores están reservados para chips/badges pequeños.
