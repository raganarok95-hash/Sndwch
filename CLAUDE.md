# SND//WCH — guía para trabajar en este repo

Sandwichería con pedidos online. Cliente de una sola página + backend en un edge
function de Supabase.

## Estructura

- **Cliente**: `src/app.ts` (lógica, tipado) + `src/shell.html` (el resto del HTML, con
  el placeholder `__APP_JS__`). `npm run build` compila y regenera `index.html` en la
  raíz — ese archivo es el único artefacto servido; nunca lo edites a mano, siempre
  edita `src/app.ts`/`src/shell.html` y recompila.
- **Backend**: `supabase/functions/api/*.ts` — un solo edge function (`api`), un action
  por operación. Se despliega con `mcp__Supabase__deploy_edge_function`.
- **Tests**: `tests/*.spec.ts` (Playwright) — mockean el endpoint `api` por `action` en
  vez de depender de red real.

## Checklist antes de dar por terminado un cambio en el cliente

1. `npm run typecheck` — cero errores.
2. `npm run build` — regenera `index.html` desde `src/`.
3. `npm test` (o `npm run verify`, que encadena las tres) — deben pasar los 8 tests.
4. Si el cambio toca un flujo cubierto por `tests/` (checkout, pedido programado, cola
   admin, borrar cuenta, reclamos), revisa que el test siga representando el flujo real
   antes de asumir que "pasa" = "funciona".
5. Commit + push a la rama de trabajo, merge `--no-ff` a `main`, push `main`.

## Checklist antes de desplegar el backend (`api`)

1. `mcp__Supabase__deploy_edge_function` exige **los 17 archivos completos** de
   `supabase/functions/api/` en cada llamada — el bundler de Deno resuelve el grafo de
   imports completo y falla con `Module not found` si falta uno. No hay despliegue
   incremental.
2. Usa el contenido **tal cual está en disco** (léelo de nuevo si no estás seguro de que
   sigue igual) — nunca reconstruyas un archivo de memoria o abreviado. Ya pasó dos
   veces en esta sesión que un despliegue terminó con comentarios recortados/contenido
   divergente del repo por reconstruir un archivo en vez de leerlo fresco.
3. Después de desplegar, si tienes dudas, compara con
   `mcp__Supabase__get_edge_function` contra el contenido real de git antes de confiar
   en que coinciden.
4. Cualquier migración de base de datos nueva (`mcp__Supabase__apply_migration`) va
   antes del deploy si el código nuevo depende de ella (columnas, RPCs, cron jobs).

## Contexto de negocio (mantener actualizado — afecta toda decisión de precio/margen)

- **El negocio aún NO ha abierto** — el plan del dueño es lanzar en ~2 meses desde julio
  2026 (aprox. septiembre 2026). Todo lo que hay hoy en `orders`/`customers` en Supabase
  es data de prueba (unos 10 pedidos, 2 clientes) — NO representa ventas reales. Cualquier
  proyección financiera hecha antes del lanzamiento es una SIMULACIÓN basada en
  referencias/benchmarks, nunca un pronóstico con historial real — debe reconstruirse con
  datos reales apenas el negocio esté operando y haya volumen real que medir.
- **Margen de insumos+empaque**: base de trabajo acordada con el dueño de 45% del precio
  de venta — deliberadamente conservador/alto a propósito. Un cálculo directo con precios
  reales de Perú investigados dio ~26-36% según el producto; el dueño pidió trabajar con
  45% dejando margen extra reservado para mejorar el empaque más adelante. Mano de obra =
  S/0 en los cálculos (el dueño arma los pedidos él mismo, sin planilla, mientras el
  volumen lo permita — esto deja de ser válido si el volumen crece lo suficiente como
  para necesitar contratar).
- **Precios de insumos investigados (Perú, julio 2026)**: res ~S/20/kg, pollo ~S/17/kg,
  atún en lata ~S/38/kg, embutido premium (jamón/paté/cabanossi) ~S/38/kg, carne molida
  ~S/10/kg, queso ~S/35/kg, pan ~S/9-13/kg según tipo. Las bebidas caseras (infusiones)
  tienen margen bruto real 61-84%, mucho mejor que los sándwiches — no conviene agregar
  gaseosas embotelladas de reventa (peor margen a precios de delivery creíbles, además de
  diluir la diferenciación de marca que ya se buscó al retirar D01-D05 del catálogo).
- **Comisión de pago (Culqi/tarjeta)**: nunca se restaba del margen antes de esta sesión
  de análisis — estimar ~4-5.5% efectivo sobre pagos con tarjeta en cualquier cálculo de
  rentabilidad. Yape/Plin manual no paga esta comisión — es ahorro real, no solo
  preferencia operativa.
- **Programa de puntos**: recompensas (R02-R06 en `catalog.ts`) recalibradas para que el
  costo real de honrar cada canje sea consistente con el 45% de insumos de arriba — si
  ese % cambia de nuevo (ej. con datos reales de proveedor), estos puntos deberían
  revisarse también.

## Restricciones permanentes (no negociables sin pedido explícito del usuario)

- **Nunca modifiques el texto legal** de Términos/Política de Privacidad/Cambios y
  Devoluciones (incluida la sección de CANCELACIONES) sin que el usuario lo pida
  explícitamente.
- **El DNI es obligatorio en el registro** — nunca lo vuelvas opcional ni lo quites.
- **Nunca inventes datos legales del negocio** (RUC, razón social, dirección) ni fotos
  de producto reales — si falta un dato real, pregunta antes de rellenarlo.
- **Operaciones git destructivas** (force-push, reset --hard, eliminar ramas) requieren
  confirmación explícita del usuario, incluso si el resto del flujo se hace "de manera
  directa".
