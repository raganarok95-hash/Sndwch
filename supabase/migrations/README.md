# Migraciones

Las **109 migraciones** aplicadas al proyecto Supabase `rjosezuoyngiadunfzyn` están acá,
una por archivo, con el nombre `<version>_<nombre>.sql` — el mismo formato que usa la CLI
de Supabase. Hasta el 2026-08-19 vivían **solo** dentro de Supabase
(`supabase_migrations.schema_migrations`) y no había ninguna copia en git: no se podía
revisar el SQL en un PR, ni reproducir el schema en un proyecto nuevo, ni bisecar cuando
algo se rompía.

El contenido se extrajo de la propia tabla y se verificó **archivo por archivo con md5
contra la base**: las 109 son idénticas al SQL realmente aplicado, salvo las redacciones
de abajo. No es una reconstrucción de memoria.

## Secretos redactados

Tres migraciones de julio traían el secreto de cron como literal en el cuerpo del cron
job, y `migrate_cron_secret_to_vault` trae el valor que hoy está **vigente** en Vault (la
llamada `vault.create_secret(...)` lo lleva en texto plano, irónicamente en la misma
migración cuyo comentario dice que a partir de ahí ya se puede commitear sin riesgo). En
los archivos de esta carpeta ese valor está reemplazado por `<CRON_SECRET_REDACTADO>`.

Consecuencia práctica: **estos archivos documentan y reproducen el schema, pero
`migrate_cron_secret_to_vault` no se puede replayar tal cual** — hay que crear el secreto
con un valor nuevo. Eso es deliberado; un secreto real nunca debería entrar a git.

El valor sigue en texto plano dentro del historial de migraciones **en Supabase** (visible
para cualquiera con acceso de administrador al proyecto). Rotarlo es tarea pendiente del
dueño: crear un valor nuevo en Vault con el mismo nombre `sndwch_cron_secret` — los 26
cron jobs lo leen por nombre desde `vault.decrypted_secrets`, así que ninguno necesita
reescribirse.

## Mantener esto al día

Cada migración nueva se sigue aplicando con `mcp__Supabase__apply_migration` desde una
sesión. Para que quede versionada, lo más barato es escribir el mismo SQL en un archivo
nuevo de esta carpeta en la misma sesión. Desde una laptop con la CLI también sirve:

```bash
npm i -g supabase          # o brew install supabase/tap/supabase
supabase login
supabase link --project-ref rjosezuoyngiadunfzyn
supabase db pull           # regenera supabase/migrations/*.sql desde el proyecto real
```

Ojo: `supabase db pull` traería de vuelta el secreto sin redactar en
`migrate_cron_secret_to_vault`. Si se usa, revisar ese archivo antes de commitear.

## Verificar que la carpeta sigue coincidiendo con la base

```sql
select md5(rtrim(array_to_string(statements, E';\n\n'), E'\n')) || '  ' || version || '_' || name
from supabase_migrations.schema_migrations order by version;
```

Comparar contra `md5sum` de cada archivo (sin el salto de línea final). Las 4 migraciones
con secreto redactado van a diferir a propósito.

## Índice

`INDEX.txt` lista las 160 con versión y nombre en orden. Regenerarlo con:

```sql
select string_agg(version || '  ' || coalesce(name,'(sin nombre)'), E'\n' order by version)
from supabase_migrations.schema_migrations;
```
