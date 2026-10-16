---
name: medir-por-pedidos
description: Cómo mide SND//WCH el marketing por pedidos reales y no por «me gusta» (origen de cada pedido, visitas por enlace, costo por cliente de cada pieza, momentos, recompra). Úsala para escribir el DATOS.md de la semana, leer un anuncio o decidir con números.
user-invocable: false
---

# Medir por pedidos

**La única pregunta**: ¿qué trajo pedidos pagados de gente nueva, y a qué costo? Lo demás (vistas,
«me gusta», seguidores) es contexto, nunca el resultado.

## De dónde salen los números
- **La base** (Supabase, solo lectura: `execute_sql` con `select`; nunca `insert`, `update`,
  migraciones ni funciones):
  - `orders`: `created_at` (UTC; Lima = UTC−5), `total`, `payment_status` (`'paid'` = pagado),
    `status` (`'CANCELADO'` no cuenta; `'ENTREGADO'` = entregado), `origen` (el `?src=` con que
    llegó: `meta-philly`, `ig-dm`, `wa`, `emb-<código>`…; vacío = directo), `customer_phone`,
    `group_code` (pedido en grupo), `recurring_id` (pedido fijo).
  - `visitas_por_origen` (`dia`, `src`, `visitas`): una por sesión y por enlace.
  - Cliente nuevo = su **primer** pedido pagado (agrupar por los últimos 9 dígitos del teléfono).
- **Meta** (solo lectura): gasto, impresiones, clics y CTR por anuncio, de la campaña de
  `docs/marketing/PAUTA_BARATA.md`.
- **Rappi y PedidosYa**: sus paneles no tienen API; los números los pega el dueño. Si no están, se
  dice «sin dato».
- **Antes del 20-oct todo es data de prueba**: se informa como prueba y no se saca ninguna
  conclusión.

## Lo que se calcula cada semana
| número | cómo |
|---|---|
| pedidos pagados por origen | `origen` agrupado; `directo` = sin origen |
| conversión por enlace | pedidos pagados ÷ visitas del mismo `src` |
| **costo por cliente nuevo de cada pieza** | gasto del anuncio ÷ clientes nuevos con `origen = meta-<pieza>` |
| pedidos por hora y por momento | la hora de Lima contra los momentos de `docs/marketing/AGENCIA.md` §2.2 |
| ticket promedio | `total` de pagados no cancelados |
| recompra | clientes con 2.º pedido dentro de 14 días del 1.º |
| grupo y pedido fijo | pedidos con `group_code`; con `recurring_id` |

## Cómo se lee (sin engañarse)
- **Con menos de 30 pedidos en un grupo, no hay conclusión**: se escribe «todavía no se sabe».
- Un origen que sube no prueba que la pieza funcionó (pudo ser el día, el clima, el feriado):
  se dice qué más cambió esa semana.
- Se compara contra la semana anterior y contra la meta (`docs/META_6000.md`), nunca contra nada.
- Las reglas de corte de la pauta son del Media buyer (`pauta-medible`); el Analista entrega el
  número, no la decisión.

## La entrega: `docs/marketing/semanas/<lunes>/DATOS.md`
1. La semana en tres líneas (pedidos, clientes nuevos, ingreso) y contra la anterior.
2. La tabla por origen (visitas, pedidos, conversión, clientes nuevos, gasto, costo por cliente).
3. Por momento y por hora: dónde se concentra.
4. **Lo que aprendimos** (máximo tres, con su número) y **lo que no sabemos todavía**.
5. Al final, lo aprendido se agrega a `docs/marketing/equipo/aprendizajes/analista.md`.
