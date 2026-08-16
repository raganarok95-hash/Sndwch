# Migraciones

Las 109 migraciones de este proyecto viven **solo en Supabase** (tabla
`supabase_migrations.schema_migrations`), no en git. Se aplican con
`mcp__Supabase__apply_migration` desde una sesión de trabajo.

Eso es un riesgo real y conocido: no se puede revisar el SQL en un PR, no se puede
reproducir el schema en un proyecto nuevo, y si algo se rompe no hay historial que
bisecar. Es el mismo tipo de divergencia que ya costó tres semanas con `catalog_prices`
(ver la advertencia en `CLAUDE.md`).

## Cómo traerlas a git (una sola vez, desde tu laptop)

El volcado completo NO conviene hacerlo desde una sesión de Claude: el SQL de las 109
migraciones tendría que pasar entero por el contexto del modelo, lo que cuesta muchísimo y
es propenso a truncarse. La herramienta correcta es la CLI de Supabase, que lo hace en un
comando y gratis:

```bash
npm i -g supabase          # o brew install supabase/tap/supabase
supabase login
supabase link --project-ref rjosezuoyngiadunfzyn
supabase db pull           # escribe supabase/migrations/*.sql con el schema real
```

Después basta con commitear los `.sql` que aparezcan. A partir de ahí, cada migración
nueva puede seguir aplicándose desde una sesión (con `apply_migration`) y luego traerse
con `supabase db pull` para que quede versionada.

## Índice actual

`INDEX.txt` (en esta carpeta) lista las 109 migraciones con su versión y nombre, tal como
están en Supabase al 2026-08-15. Sirve para saber qué existe y en qué orden, aunque el SQL
todavía no esté acá. Regenerarlo con:

```sql
select string_agg(version || '  ' || coalesce(name,'(sin nombre)'), E'\n' order by version)
from supabase_migrations.schema_migrations;
```
