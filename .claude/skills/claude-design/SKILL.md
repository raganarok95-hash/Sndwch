---
name: claude-design
description: Cómo el equipo de marketing de SND//WCH arma maquetas y piezas visuales (posts 4:5, historias 9:16, anuncios, bolsa) en Claude Design, el lienzo de artboards de claude.ai, respetando el estilo y la marca. Úsala para bocetar o maquetar una pieza antes de producirla.
user-invocable: true
---

# Claude Design para SND//WCH

Dueño (2026-11-04): «dale la skill de claudedesign». Claude Design es el tipo de Artifact «Design» de claude.ai:
un lienzo con artboards vivos, para posts, historias, anuncios y maquetas.

## Cuándo se usa
- **Puerta 1 de `/pieza`**: la maqueta de cada concepto para que el dueño elija, en vez de describirla en texto.
- Variantes de una pieza ya elegida (4:5 y 9:16 a la vez) y la bolsa, el sticker o un volante.
- No reemplaza la foto de producto (`producir-piezas`: Figma, fiel a la receta) ni a los hermanos (solo Flow).

## Cómo se abre
1. `Artifact` con `action: "quickstart"`, `intent: "design"`. Hoy devuelve el tipo «Design»
   (`https://claude.ai/artifact/QKN21svewxgyPb6SYRqWnd`). La cuenta no tiene sistema de diseño cargado.
2. Publicar con ese `type_url`, un `title` como «SND//WCH · <pieza>» y `auto_open: "after_first_write"`, y seguir
   las instrucciones que trae el resultado.
3. Un artboard por formato: **1080×1350** (feed 4:5) y **1080×1920** (historia o Reel 9:16). En 9:16, libre el 14%
   de arriba y el 35% de abajo.
4. Este pedido del dueño es el permiso para usar Artifacts **solo para maquetas en Claude Design**. Los archivos
   finales van sueltos a `/mnt/project-files/` como siempre.

## Las reglas de la marca (no se negocian en el lienzo)
- Todo `estilo-sndwch`: la foto pone el color; encima, solo tinta `#1E2B22` y papel `#EFE6D4`; tres voces
  (**Anton** mayúsculas para el momento, **Instrument Serif** itálica para la verdad del producto, **IBM Plex Mono**
  para los datos); nada de franjas sueltas, salvo la del sistema del feed aprobado.
- El `//`: dos barras idénticas y paralelas, la izquierda `#CBA258`, la derecha `#8CC8EC`, planas, `skewX(-16deg)`.
  En el contenido se usa donde sume, no como muletilla.
- Nombres de producto en MAYÚSCULAS. Precios, premios y horarios **salen del código** (`docs/hechos/`): nunca se
  escriben a mano.
- Fotos: las reales de `img/` o las generadas fieles a la receta. Cada pieza estrena imagen (regla 7).
- SANDO y WICHO no se dibujan en el lienzo: se usa su archivo de `img/`, en su propio mundo, nunca pegado sobre comida.

## Antes de mostrarlo al dueño
- `por-que-vende`: por qué vendería, con su fuente, o «sin evidencia».
- Calidad: `verdad-y-ley` (nada que prometa más de lo que llega).
- Nada se publica, se imprime ni se paga desde el lienzo: el dueño elige y después se produce.
