# Imágenes y video gratis: qué sirve de verdad (2026-10-07)

Dueño: «Sería mejor que primero veamos una forma gratis de crear imágenes y video, porque la
necesitaremos para ser más creativos».

## Lo probado y lo investigado

| opción | imágenes | video | con SANDO y WICHO | desde dónde | veredicto |
|---|---|---|---|---|---|
| **Google Flow** | **gratis** (Nano Banana e Imagen 4 no gastan créditos) | **50 créditos gratis al día** ≈ 5 clips de Veo 3.1 Lite (10 créditos c/u) | **sí: ya están creados en tu Flow** | tu laptop (MCP que maneja el navegador con tu cuenta) | **el motor principal** |
| Canva (`generate-image`) | dentro de los créditos de IA de tu plan | no | sí, con imagen de referencia (probado) | la nube | respaldo; bajar en tamaño completo exige exportar un diseño |
| Pollinations sin cuenta | baja resolución (686×858), marca de agua | — | **no**: con referencia responde error 500 (probado desde GitHub) | la nube | no sirve |
| Gemini (app) | ~10–20 al día gratis | no | sí, subiendo la referencia | a mano | para una urgencia |
| Kling / Hailuo / PixVerse | — | créditos diarios gratis, cambian seguido | imagen a video | a mano | para probar, no para depender |
| Video por código (`scripts/video-auto/`) | — | gratis e ilimitado | con las poses que ya hay | GitHub | para montaje, subtítulos, precio y cierre |

Fuentes: [Google Flow, precios y créditos](https://costgoat.com/pricing/google-flow) ·
[Flow, plan gratis probado](https://note.com/samuraijuku_biz/n/nfdd2be4f0b20?hl=en) ·
[Pollinations](https://www.tooljunction.io/ai-tools/pollinations) ·
[APIs gratis de imagen 2026](https://apiframe.ai/blog/free-ai-image-generation-api-2026) ·
[video gratis 2026](https://pixverse.ai/en/blog/best-ai-video-generators).

## La decisión

**Flow genera; GitHub monta.** Flow hace las imágenes y los clips con los personajes que ya tienes
(gratis), y el código une todo con subtítulos, el precio de la carta y el cierre (gratis). Lo
único que falta es conectar Flow, y eso se hace en tu laptop porque Flow no tiene API.

## El MCP que se instala (en tu laptop, no en el celular)

Requisitos: Claude Code instalado en la laptop, Node.js 22.13 o más (`node -v`), Chrome.

```
claude mcp add --scope user google-flow -- npx -y google-flow-browser-mcp
```

Es [`hitjcl/google-flow-mcp`](https://github.com/hitjcl/google-flow-mcp): un comando, abre un
perfil de Chrome propio (no toca el tuyo), inicias sesión en Google una vez y **pide confirmación
antes de gastar créditos**. Es de la comunidad, no de Google: maneja la página de Flow como lo
harías tú. Si más adelante las voces de los personajes deben sonar siempre igual, el otro es
[`felipedamacenoteodoro/mcp-google-flow`](https://github.com/felipedamacenoteodoro/mcp-google-flow)
(biblioteca de voces, topes de gasto).

Después: abres Claude Code en la carpeta del repo y le pides lo de `FLOW_LANZAMIENTO.md`.
