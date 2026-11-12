# Entregas entre hilos — cómo se pasan trabajo

Dueño (2026-11-10): «también debemos mejorar la intercomunicación de equipos» · «Todo debe funcionar en
automático» · «Y sí dale luz verde a todo». Lo armó el hilo Automatizaciones.

## Las cinco reglas

1. **Cada dato tiene un hilo dueño.** Antes de preguntarle algo a Ezra, se le pregunta al dueño del dato.

   | dato | hilo dueño | carpeta |
   |---|---|---|
   | recetas, gramos, ingredientes, técnicas | RECETAS | `recetas/` |
   | compras, cotizaciones, proveedores, stock, frascos | Operativo | `operativo/` |
   | la app, el panel, las fotos de la app | App | `app/` |
   | piezas, reels, historias, plan de contenido | Equipo de marketing | `marketing/` |
   | latas, stickers, etiquetas, diseños nuevos | Diseños e ideas | `disenos/` |
   | plata, costos, comisiones | Finanzas | `finanzas/` |
   | reclamos y respuestas a clientes | Preparar el servicio al cliente | `servicio/` |
   | datos de afuera (competencia, formatos, referentes) | Investigación | `investigacion/` |
   | automáticas, entregas atascadas, este sistema | Automatizaciones | `automatizaciones/` |

2. **Una entrega es un archivo en la carpeta del hilo que la recibe**, `docs/entregas/<hilo>/AAAA-MM-DD-<tema>.md`,
   con esta cabecera (la lee `scripts/vigia-automaticas.mjs`):

   ```
   de: operativo
   para: recetas
   estado: abierta        ← abierta | hecha
   para-cuando: 2026-11-14
   ---
   Qué necesito, en una o dos líneas, y dónde está lo que hace falta.
   ```

   El repo es público: **montos, ventas y fórmulas de bebidas** van en la carpeta del proyecto,
   `/mnt/project-files/entregas/<hilo>/`, con la misma cabecera, y en el repo solo una línea que apunte ahí.
3. **El que entrega avisa directo** al otro hilo (mensaje de hilo a hilo), sin pasar por el coordinador.
   Quien recibe la cierra cambiando `estado: hecha` y una línea de qué hizo.
4. **Cada hilo lee su carpeta antes de empezar cualquier trabajo.**
5. **Las preguntas a Ezra van a una sola lista**, [`ezra/PREGUNTAS.md`](ezra/PREGUNTAS.md). Antes de preguntarle
   algo, se busca ahí: si ya respondió, no se vuelve a preguntar. Cuando responde, el hilo copia sus palabras
   y la fecha en la fila y la pasa a `respondida`.

## Lo que corre solo

- **Vigía de las automáticas** (`.github/workflows/vigia-automaticas.yml`, todos los días 22:13 de Lima):
  mira las automáticas programadas, las preguntas abiertas a Ezra y las entregas abiertas cuyo «para-cuando» ya pasó (o, sin esa fecha, abiertas hace más de 24 h), y
  lo deja en la base (`app_settings.avisos_del_sistema`). El correo de cierre de las 22:30 lo muestra en
  «EL SISTEMA //». Si una automática falló dos veces seguidas, el vigía además queda en rojo.
- **Cambio de carta** (`.github/workflows/cambio-de-carta.yml`, en cada push a main que toque
  `modelo/carta.json`): por cada producto que cambió de receta, nombre, foto o descripción, deja entregas a App
  (foto), Marketing (piezas que lo muestran), Operativo (lista de compras) y Finanzas (costo).
- **Automatizaciones** pasa cada mañana: lee lo que dejó el vigía y le avisa a cada hilo lo que tiene atascado.
