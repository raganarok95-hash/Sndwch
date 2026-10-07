# Rutina diaria: el Revisor (control de calidad + publicador)

Se corre cada día a las **11:15 de Lima**, como sesión programada de Claude (Routine). El
workflow «Video del día» ya dejó su borrador a las 5:47. El Revisor es el único que pasa una pieza
del Productor a `scheduled`, y el cron `auto-publish-calendar` la publica en los 15 minutos
siguientes: por eso la hora de esta rutina **es** la hora de publicación, al arrancar el almuerzo.

Una sesión nueva no sabe nada: **este archivo es toda la instrucción**. No leer más que esto,
`CLAUDE.md` (que ya se inyecta) y lo que pidan los pasos. Ahorrar créditos.

## 0 · Antes de empezar
- Proyecto Supabase `rjosezuoyngiadunfzyn`, por el MCP (`mcp__Supabase__execute_sql`, con
  `ToolSearch` si no está cargada). El proxy bloquea `supabase.co` por HTTP: solo MCP.
- **Fecha de apertura: 2026-10-13.** Antes de esa fecha **no se aprueba nada** (el video dice
  «Pídelo hoy»): se deja pendiente y se termina.
- **Los lunes la tienda cierra: no se aprueba nada** (lo pendiente se revisa el martes). No se
  programa para «mañana»: el cron compara fechas en UTC y publicaría a las 7 p.m. del lunes.

## 1 · Qué revisar
```sql
select id, scheduled_date, title, caption_text, video_url, src, datos, created_at
from marketing_calendar
where rol = 'productor' and status = 'draft' and revision = 'pendiente'
order by created_at;
```

## 2 · Las reglas (una que falla = se bloquea, con motivo)
1. **Precio**: `datos.p15` y `datos.p30` coinciden con la base:
   `select "values" from catalog_prices where code = datos->>'sig';` (si no hay fila, con
   `get-catalog`, que es lo que ve el cliente). Si no coinciden → `bloqueada`, motivo «precio».
2. **Disponible hoy**: el Signature no está agotado (`inventory` por su código y su proteína).
3. **El video existe**: `video_url` apunta a `marketing-images/videos/<src>.mp4` (se comprueba
   con `select name from storage.objects where bucket_id='marketing-images' and name = 'videos/'||src||'.mp4'`).
4. **El texto**: el `caption_text` no nombra un mecanismo apagado ni el menú secreto, no inventa
   datos legales, no tiene voseo, y el enlace lleva su propio `?src=`.
5. **Repetición**: no hay otra pieza del mismo Signature programada para los próximos 2 días.

## 3 · Aprobar o bloquear
- Aprobada:
  ```sql
  update marketing_calendar set revision='aprobada', status='scheduled',
    scheduled_date = current_date, updated_at = now()
  where id = '<id>' and revision = 'pendiente';
  ```
- Bloqueada (nunca se corrige a ojo: el Productor la rehace mañana):
  ```sql
  update marketing_calendar set revision='bloqueada', motivo_revision='<regla: detalle>', updated_at=now()
  where id = '<id>' and revision = 'pendiente';
  ```
- **Una por día**: si hay varias pendientes (las de antes de abrir, la del lunes), se aprueba
  solo la más reciente que pase las reglas; las demás se bloquean con motivo «acumulada».

## 4 · Cerrar
Una línea por pieza en el resumen final de la sesión: `src → aprobada | bloqueada (motivo)`.
No se escribe al dueño: el Analista le resume la semana el domingo. No se toca código, no se
commitea, no se gasta plata.
