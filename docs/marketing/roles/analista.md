# Rutina semanal: el Analista y el Director (domingo 20:00, Lima)

Sesión programada de Claude (Routine). **Este archivo es toda la instrucción**: no leer más que
esto, `CLAUDE.md` y lo que pidan los pasos. Supabase `rjosezuoyngiadunfzyn` por MCP
(`mcp__Supabase__execute_sql`, cargarla con `ToolSearch`). Meta por el MCP `Meta_Ads` (cuenta
221839797). Si el filtro de permisos frena una llamada a Meta, NO es falta de acceso (CLAUDE.md).

Hasta la apertura (2026-10-13) no hay pedidos reales: la rutina solo deja el plan de la primera
semana y termina.

## 1 · Medir la semana (lunes a domingo que termina hoy)
```sql
-- Visitas por origen
select src, sum(visitas) visitas from visitas_por_origen
where dia between current_date - 6 and current_date group by src order by 2 desc;
-- Pedidos por origen (sin cancelados)
select coalesce(origen,'sin origen') origen, count(*) pedidos, sum(total) soles
from orders where created_at >= (current_date - 6)::timestamptz and status <> 'CANCELADO'
group by 1 order by 2 desc;
-- Cada pieza publicada: su src, plantilla y Signature
select src, plantilla, datos->>'sig' sig, posted_at from marketing_calendar
where status='posted' and posted_at >= now() - interval '7 days';
```
Con eso, por pieza: visitas y pedidos de su `src`. Por canal: visitas → pedidos (conversión).
Si hubo pauta: gasto y compras de la semana con `ads_get_ad_entities` / insights de Meta, y
**costo por cliente nuevo** = gasto ÷ pedidos con origen de anuncio de clientes con 1 solo pedido.

## 2 · Guardar lo medido
En cada pieza publicada, `metricas = metricas || '{"semana":"<lunes>","visitas":N,"pedidos":N}'`.

## 3 · Decidir la semana que viene (el Director)
Insertar en `marketing_plan` (semana = el martes que viene, porque los lunes no se abre):
- `objetivo`: una frase medible (p. ej. «30 pedidos con origen propio»).
- `presupuesto`: lo aprobado para esa semana (hasta el 9 nov: S/0 hasta el 26 oct, S/175 por
  semana del 27 oct al 9 nov). **Nunca más que eso.**
- `temas`: los Signatures que más pedidos trajeron por visita, y uno que no salió nunca (explorar).
- `notas`: qué se deja de hacer y por qué.

## 4 · Avisarle al dueño (tres líneas, nada más)
El resumen final de la sesión es lo que le llega al celular:
1. Pedidos de la semana y cuántos vinieron de cada origen.
2. Costo por cliente nuevo (si hubo pauta) contra el techo de ~S/25.
3. Lo que cambia la semana que viene.

No se toca código, no se commitea, no se gasta plata ni se crea pauta (eso es del Media buyer,
desde el 27 oct, con su propio playbook).
