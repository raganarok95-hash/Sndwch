# Los equipos de SND//WCH: el negocio entero con agentes (2026-10-16)

Dueño: «Quiero que organices un equipo formal con subagentes con skills especializadas para cada
uno de esos procesos… cuándo se activan, cómo trabajan» · «Revísalo, necesitamos pulirlo al
máximo. También crear para todos los procesos mientras podamos mejorar con agentes, organizamos o
automatizaciones nuevas, todo lo que sume a ganar más».

Marketing tiene su plan propio (`docs/marketing/equipo/PLAN.md`). Este archivo es el resto del
negocio y cómo se juntan los equipos. Esquema en una imagen: `esquema.png`.

## 1 · Cómo suma cada equipo a la meta

La meta es **S/6,000 líquidos al mes** antes del sueldo del dueño (`docs/META_6000.md`). Es una
cuenta con cinco perillas, y cada equipo mueve una:

```
líquido = pedidos × (ticket − costo por pedido − comisión) − fijos − pauta
```

| perilla | quién la mueve | cómo |
|---|---|---|
| **pedidos nuevos** | Marketing (13 especialistas), Apps | anuncios medidos por pedidos, la vitrina de Rappi |
| **pedidos que no se pierden** | **Conversión**, **Guardián**, **Operación** | el embudo de la app; que la app cobre; que no se agote la estrella |
| **pedidos que vuelven** | Growth, **Servicio** | embajadores, referidos, pedido fijo; un reclamo bien atendido |
| **ticket** | **Carta** | qué se muestra primero, bebida, 30CM, doble, sin cambiar precios |
| **costo, comisión y pauta** | **Finanzas**, **Operación**, Media buyer | compras contra el modelo, merma, canal que más deja, costo por cliente |
| **el tiempo del dueño** | **Gerencia** | una pantalla por mañana con lo que decide hoy, en orden de plata |

En **negrita**, lo nuevo de hoy.

## 2 · El organigrama

| equipo | subagentes (`.claude/agents/`) | su manual (`.claude/skills/`) | modelo |
|---|---|---|---|
| **Gerencia** (el orquestador, en la sesión principal) | — | `/buenos-dias`, `/domingo`, `/mes` | el de la sesión |
| **Marketing** | analista, investigador, estratega, creativo, redactor, director-de-arte, productor, editor-video, calidad, media-buyer, apps, comunidad, growth | `/agencia-semana`, `/pieza`, `/revisar-pauta`, `/revisar-lo-producido` + una skill por oficio | Opus para estrategia, creatividad, arte y pauta; Sonnet y Haiku para lo demás |
| **Operación** | `operacion` | `cocina-y-stock` | Sonnet |
| **Finanzas** | `finanzas` | `cuentas-claras` | Sonnet |
| **Carta** | `carta` | `ingenieria-de-carta` | Opus |
| **Conversión** | `conversion` | `embudo-de-la-app` | Sonnet |
| **Servicio** | `servicio` | `servicio-y-reclamos` | Sonnet |
| **Tecnología** | `guardian` | `salud-de-la-app` | Sonnet |

Todos llevan `reglas-sndwch` (idioma, cifras, verdad de la carta, marca, plata y datos) y **no
cargan el `CLAUDE.md` entero**: cada uno lee solo lo de su oficio. Cada rol tiene su archivo de
aprendizajes (`docs/equipo/aprendizajes/`, `docs/marketing/equipo/aprendizajes/`): lo lee antes de
trabajar y lo que el dueño dice entra con sus palabras.

**Reglas que valen para todos**: ninguno prende un anuncio, gasta, responde a un cliente, cambia un
precio, toca la app o la base, ni despliega. Leen, juntan, proponen; **el dueño decide**. Los
especialistas no se llaman entre ellos: el orquestador los llama y ve todo el recorrido.

## 3 · Código y agentes: quién hace qué

**El código mide y avisa; los agentes leen junto, explican y proponen; el dueño decide.** Lo que ya
corre solo no se rehace con un agente (más caro y menos confiable):

| ya corre en código | qué hace |
|---|---|
| `vigia-api.yml` (cada 30 min, 10:00–23:30) · `recorrido-real.yml` (diario) · `backup-db.yml` (diario, con restauración) | que la app responda, que un cliente pueda pedir, que haya respaldo |
| `daily-summary` y `weekly-summary` (correo al dueño) | ventas del día, pedidos abiertos, stock; semana contra semana y reposición |
| alertas del panel | pedidos parados, insumos por acabarse, reclamos cerca del plazo legal, crons |
| recordatorios al cliente | carrito y pago abandonados, cumpleaños, volver a los 30 días |
| freno por costo por cliente y apagado de promociones | que la pauta no pase su techo |
| `video-diario.yml` + `revisar-marketing.yml` | el video del día, revisado por reglas |
| **`datos-semana.yml` (nuevo, domingo 23:15)** | **la semana en números para el equipo** (`DATOS-base.json`: pedidos por origen, nuevos y que vuelven, conversión, horas, gasto y costo por cliente, sin ventas totales ni datos de clientes) |

## 4 · Cuándo se activa cada cosa

| cuándo (Lima) | dónde | qué | estado |
|---|---|---|---|
| todos los días, 8:10 y 20:10 | nube (tarea programada) | `/revisar-lo-producido`: Director de arte + Calidad sobre lo que volvió de Flow y las piezas producidas | **corre** (la tarea de arte, ampliada hoy) |
| todos los días, ~8:15 | nube | `/buenos-dias`: Guardián ‖ Servicio ‖ Operación → lo que decides hoy, al celular | **por crear** (§6) |
| domingo 23:15 | GitHub | `datos-semana.yml` | **corre** desde hoy |
| domingo ~23:40 | nube | `/domingo`: Finanzas ‖ Analista ‖ Operación ‖ Servicio ‖ Conversión ‖ Growth → tres decisiones | **por crear** (§6) |
| primer domingo del mes | nube | `/mes`: Carta + Finanzas + el Analista revisa lo aprendido contra los datos | dentro de `/domingo` |
| lunes, antes de las 12:00 | tu laptop | `/agencia-semana` (el ciclo de marketing con los subagentes) | **corre** (cambiado hoy) |
| 7:30 y 19:30 | tu laptop | Flow genera lo encargado | corre |
| a pedido | aquí o cualquier sesión | `/pieza` (un anuncio o pieza nueva), `/revisar-pauta`, `/buenos-dias`, `/domingo`; pegar comentarios y pedir «respóndelos» (Comunidad) | listo |

## 5 · Datos y plata: el repo es público

- En el repo van conteos, porcentajes, tiempos, ticket promedio, gasto de pauta, costo por cliente,
  decisiones y lo aprendido. **Ventas, utilidad y caja en soles no se commitean**, ni nada de un
  cliente: van en la respuesta de la sesión al dueño.
- La base y Meta se leen con consultas de solo lectura.
- Un agente sin acceso a una fuente lo dice y sigue: nunca inventa.

## 6 · Lo que decide el dueño

1. **Las dos tareas programadas nuevas** (`/buenos-dias` cada mañana y `/domingo` cada semana):
   para que valgan, necesitan **leer la base y Meta** (acceso de solo lectura, que se le da a la
   tarea al crearla). Sin eso, el Guardián y la parte de marketing funcionan y lo demás dice «sin
   acceso». Mi recomendación: crearlas con acceso de lectura.
2. **¿Las cifras en soles, solo en la sesión?** Es lo que dejé por defecto (el repo es público).
   La alternativa es volver el repo privado (la página se sirve en Vercel, así que seguiría
   funcionando), pero tiene costo: GitHub Actions deja de ser ilimitado en un repo privado (los
   vigías corren cada 30 minutos) y las imágenes de los anuncios ya no se le podrían pasar a Meta
   por su URL pública. Por eso lo dejé público y sin cifras.

## 7 · Costo (medido el 2026-10-16)

Cada especialista empieza de cero y lee su oficio y sus archivos. **Medido en la primera corrida**:
un especialista gasta entre 120 mil y 235 mil tokens por encargo (Estratega 123 mil, Creativo 234
mil, Redactor 192 mil, Guardián 174 mil, Operación 200 mil). El recorrido de los tres anuncios hasta
las maquetas, con tres Directores de arte en paralelo, **tocó el límite de uso de la sesión** (se
reinició a las pocas horas y siguieron donde estaban).

Lo que eso deja como regla:
- **Pocos a la vez**: máximo 2 o 3 especialistas en paralelo; el resto, en fila.
- **Las tareas programadas, cortas**: `/buenos-dias` con 3 especialistas en Sonnet; las revisiones
  de arte terminan en un minuto si no hay nada que revisar.
- **Opus solo donde decide**: estrategia, creatividad, arte, pauta y carta.
- A la semana, lo programado: 14 revisiones de arte (casi siempre vacías), 7 mañanas, 1 domingo y
  1 lunes, más las piezas que pidas.

## 8 · Lo que sigue (ideas que suman, para decidir con datos)

Las sacarán los equipos de sus primeras semanas; hoy no hay datos reales para elegir:
- **Conversión**: el primer experimento sale de dónde se pierden más pagos (`pending_charges`).
- **Carta**: la primera matriz después del primer mes (con menos de 100 sándwiches es preliminar).
- **Operación**: el plan del día reemplaza el «Abro con N porciones» a ojo apenas haya 2 semanas
  de historia.
- **Servicio + Marketing**: los comentarios con permiso de testimonio (`ratings.testimonial_consent`)
  son la prueba social real que hoy no tienen los anuncios.
