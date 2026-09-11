# OpenMontage en tu laptop — el montaje, no la generación

> Compañero de `docs/FLOW_EN_TU_LAPTOP.md`. **No compiten: se reparten el trabajo.**
> Flow te da **clips de 8 segundos**. OpenMontage arma con ellos **el reel terminado** —
> narración, subtítulos quemados palabra por palabra, música, cortes, render y verificación.
> Eso es justo lo que hoy haces a mano o no haces.

---

## Qué es, para que no te sorprenda

**No es un MCP y no se registra con `claude mcp add`.** Es un proyecto de Python + FFmpeg +
Node que **abres en Claude Code como si fuera un repo tuyo**, y le hablas en español. Su
`AGENT_GUIDE.md` es el contrato: el agente lee el manifiesto del pipeline, corre un preflight
para ver qué herramientas tienes, y ejecuta etapa por etapa con **puntos de aprobación tuyos**
entre cada una.

Su regla central (la llama *Rule Zero*) es que **toda producción pasa por un pipeline**. Hay 13
en `pipeline_defs/`; el tuyo es **`hybrid`**, que existe exactamente para esto: metraje de
origen más material de apoyo diseñado o generado.

---

## ⚠ DÓNDE CLONARLO — esto importa antes que nada

**NUNCA dentro de `Sndwch/`.** El primer renglón de su `CLAUDE.md` dice, textual:

> *"MANDATORY: Read AGENT_GUIDE.md before responding to ANY user message."*

Si queda dentro del repo de SND//WCH, ese archivo compite con el tuyo en **cada sesión futura**
de este proyecto. Clónalo en una carpeta hermana:

```
~/proyectos/
  Sndwch/            ← este repo
  openmontage/       ← aquí, al lado, nunca adentro
```

Y se abre como **su propia sesión de Claude Code**, no como una subcarpeta de la de SND//WCH.

---

## Instalación

Necesitas **Python 3.10+**, **FFmpeg** y **Node 18+**.

```bash
git clone https://github.com/calesthio/OpenMontage.git
cd OpenMontage
make setup
```

`make setup` hace cinco cosas: crea el entorno virtual, instala las dependencias de Python,
instala el compositor de Remotion con `npm`, instala **Piper** (TTS local, sin cuenta y sin
costo) y crea el `.env` a partir del ejemplo.

---

## Pruébalo GRATIS antes de poner una sola key

```bash
make demo
```

Renderiza videos de demostración **sin ninguna API key** — solo componentes de Remotion. Es la
forma de comprobar que tu FFmpeg, tu Node y tu Python están bien antes de meter nada más.

Para ver qué herramientas tienes disponibles según tus keys:

```bash
make preflight
```

---

## El camino de S/0, que alcanza para lo que necesitas

Su propia guía de proveedores ordena el arranque de gratis a pago. **Los cuatro primeros
escalones no cuestan nada**, y con ellos el pipeline está completo:

| | qué te da | costo |
|---|---|---|
| **Piper** | TTS local, **sin cuenta y sin red** — ya lo instaló `make setup` | S/0, siempre |
| **Pexels + Pixabay** | fotos y video de stock, y **música libre** | S/0, solo sacar la key |
| **Google API key** | TTS con 700+ voces, **1M de caracteres al mes gratis** | S/0 hasta ese tope |
| **ElevenLabs** | TTS premium + música + efectos | S/0 hasta 10K caracteres/mes |

Para dimensionarlo: la narración de un reel son ~300 caracteres. **El millón mensual gratis de
Google te da unos 3,000 reels al mes.** No vas a llegar.

**Todo lo caro es opcional y apagable** — FLUX, Kling, Runway, Sora, Veo. El sistema funciona
sin una sola key de pago, y en esas está justamente lo que no necesitas, porque **los clips los
hace Flow**.

---

## Cómo encajan Flow y OpenMontage

```
Flow  ──►  clips de 8 s, con tus personajes ya creados
              │
              ▼
OpenMontage ──►  reel terminado: cortes, narración, subtítulos, música, render
```

Flow genera; OpenMontage monta. **La pieza que faltaba era la segunda**, y es la que decide si
un reel se ve en mudo — que es como se ve el 85% de Instagram. Los subtítulos quemados palabra
por palabra son lo que más mueve eso, y a mano no los vas a hacer nunca.

Además tiene una entrada que te conviene conocer: **le puedes dar la URL de un Reel o un Short
como referencia** y él lo analiza de verdad —ritmo, estructura, por qué funciona— en vez de
adivinar, y después te propone 2-3 conceptos propios. No copia: analiza.

---

## Lo que hay que saber antes

- **Licencia AGPLv3.** Mientras viva **fuera** del repo, como herramienta que produce archivos de
  video, no contagia nada: los videos que salen no son obra derivada. El día que alguien meta su
  código dentro de `api` y lo sirva por red, la AGPL obliga a publicar todo el servicio. Como
  técnicamente **no puede correr en una edge function de Deno** —necesita FFmpeg y procesos— el
  límite se cuida solo. No lo fuerces.
- **Ocupa ~160 MB** el repo, más el entorno virtual y el caché de npm.
- **No lo conectes al panel todavía.** Eso era la opción C de la propuesta original: que el
  borrador semanal salga con el plan de reel completo (guion cronometrado, textos de subtítulo,
  qué foto va en cada corte) para que tú solo corras el montaje. Sigue disponible, pero conviene
  usar el proceso a mano unas semanas primero — si automatizamos antes de saber cómo lo usas de
  verdad, automatizamos la versión equivocada.
- **Y yo no lo voy a manejar desde acá.** Corre en tu máquina, con tu FFmpeg y tus keys. Lo que
  sí puedo darte es el guion, los prompts y el plan de cortes.

---

## Qué pedirle la primera vez

Abres la carpeta de OpenMontage en Claude Code y le dices, en español, algo así:

```
Quiero un reel vertical de 15 segundos para Instagram, de una sandwichería
de delivery. Tengo clips generados aparte y fotos de producto.
Usa el pipeline hybrid. Antes de empezar corre el preflight y dime qué
tengo disponible sin poner ninguna key de pago.
No uses ningún proveedor que cobre sin preguntarme antes.
```

Esa última línea no es paranoia: el sistema tiene presupuesto por pipeline (`budget_default_usd`
en cada manifiesto) y conviene dejarlo claro desde el primer mensaje.
