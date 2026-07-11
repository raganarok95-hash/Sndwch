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
