-- Reporte de retención y cohortes para el dashboard admin.
-- Hasta ahora el dashboard media INGRESOS (hoy/semana/mes/tendencia) pero no media
-- RETENCIÓN de forma agregada: no había ninguna cifra de "de los clientes que compraron
-- una vez, cuántos volvieron". En un negocio donde el modelo dice que solo ~30% hace un
-- segundo pedido pero quien llega al segundo hace ~7 en total, esa es LA métrica que
-- decide si el negocio funciona — medirla es más importante que medir el ingreso del día.
--
-- Todo se calcula en SQL sobre la tabla completa (sin el limit de ventana que usa
-- dashboard_aggregates para las métricas de período), porque una cohorte incompleta da
-- un número silenciosamente equivocado en vez de un número faltante.
--
-- p_cohort_months: cuántos meses hacia atrás incluir en la tabla de cohortes.
-- p_ingredient_cost_pct: costo de insumos+empaque como fracción del precio de venta
--   (0.45 = la base conservadora acordada con el dueño, ver CLAUDE.md). Es un parámetro y
--   no una constante para poder recalcularlo el día que haya costos reales de proveedor.
-- p_card_fee_pct: comisión efectiva de Culqi sobre pagos con tarjeta (Yape/Plin no paga).
create or replace function public.retention_report(
  p_cohort_months int default 6,
  p_ingredient_cost_pct numeric default 0.45,
  p_card_fee_pct numeric default 0.05
)
returns jsonb
language sql
security definer
set search_path = public
as $$
with paid as (
  select customer_phone, created_at, coalesce(total, 0) as total,
         coalesce(items, '[]'::jsonb) as items, payment_method
  from orders
  where payment_status = 'paid'
    and status is distinct from 'CANCELADO'
    and customer_phone is not null
),
seqd as (
  select p.*, row_number() over (partition by customer_phone order by created_at) as seq
  from paid p
),
cust as (
  select customer_phone,
         min(created_at) as first_at,
         max(created_at) as last_at,
         count(*)::int as orders,
         sum(total) as revenue
  from paid
  group by customer_phone
),
gap2 as (
  select extract(epoch from (s.created_at - c.first_at)) / 86400.0 as days
  from seqd s join cust c on c.customer_phone = s.customer_phone
  where s.seq = 2
),
cohorts as (
  select to_char(date_trunc('month', c.first_at at time zone 'America/Lima'), 'YYYY-MM') as month,
         count(*)::int as customers,
         count(*) filter (where c.orders >= 2)::int as with_second,
         count(*) filter (where c.orders >= 3)::int as with_third,
         round(avg(c.orders)::numeric, 2) as avg_orders,
         round(sum(c.revenue)::numeric, 2) as revenue
  from cust c
  where c.first_at >= date_trunc('month', (now() at time zone 'America/Lima') - make_interval(months => greatest(p_cohort_months - 1, 0)))
  group by 1
),
active30 as (
  select distinct customer_phone from paid where created_at >= now() - interval '30 days'
),
recent as (
  select count(*)::int as orders,
         coalesce(sum(total), 0) as revenue,
         coalesce(sum(total) filter (where payment_method in ('culqi', 'card', 'tarjeta')), 0) as card_revenue,
         count(*) filter (where exists (
           select 1 from jsonb_array_elements(items) e where e->>'type' = 'side'))::int as with_drink,
         count(*) filter (where exists (
           select 1 from jsonb_array_elements(items) e where e->>'size' = '30'))::int as with_30cm,
         count(*) filter (where exists (
           select 1 from jsonb_array_elements(items) e where (e->>'doubleProt')::boolean))::int as with_double,
         count(*) filter (where exists (
           select 1 from jsonb_array_elements(items) e where (e->>'extraSauce')::boolean))::int as with_extra_sauce,
         coalesce(avg((select coalesce(sum((e->>'qty')::numeric), 0)
                       from jsonb_array_elements(items) e)), 0) as avg_units
  from paid
  where created_at >= now() - interval '90 days'
)
select jsonb_build_object(
  'cohorts', coalesce((
    select jsonb_agg(jsonb_build_object(
      'month', month, 'customers', customers, 'withSecond', with_second, 'withThird', with_third,
      'secondPct', case when customers > 0 then round(with_second * 100.0 / customers, 1) else 0 end,
      'avgOrders', avg_orders, 'revenue', revenue
    ) order by month) from cohorts), '[]'::jsonb),
  'overall', (
    select jsonb_build_object(
      'customers', count(*)::int,
      'withSecond', count(*) filter (where orders >= 2)::int,
      -- r(1): la probabilidad real de que alguien que compró una vez vuelva a comprar.
      'repeatRatePct', case when count(*) > 0
        then round(count(*) filter (where orders >= 2) * 100.0 / count(*), 1) else 0 end,
      'avgOrders', coalesce(round(avg(orders)::numeric, 2), 0),
      'avgLifetimeRevenue', coalesce(round(avg(revenue)::numeric, 2), 0),
      -- Solo entre quienes SÍ volvieron: el número que dice cuánto vale de verdad
      -- convertir a alguien al segundo pedido.
      'avgOrdersIfReturned', coalesce((select round(avg(orders)::numeric, 2) from cust where orders >= 2), 0),
      'avgRevenueIfReturned', coalesce((select round(avg(revenue)::numeric, 2) from cust where orders >= 2), 0)
    ) from cust),
  -- Mediana (no promedio) de días entre 1er y 2do pedido: calibra la ventana real del
  -- recordatorio de bounce-back. Un promedio se dispara con un solo cliente que volvió
  -- a los 6 meses; la mediana no.
  'daysToSecond', (
    select jsonb_build_object(
      'median', coalesce(round(percentile_cont(0.5) within group (order by days)::numeric, 1), 0),
      'p75', coalesce(round(percentile_cont(0.75) within group (order by days)::numeric, 1), 0),
      'n', count(*)::int
    ) from gap2),
  'rolling30', (
    select jsonb_build_object(
      'active', (select count(*)::int from active30),
      'returning', (select count(*)::int from active30 a
                    join cust c on c.customer_phone = a.customer_phone
                    where c.first_at < now() - interval '30 days'),
      'returningPct', case when (select count(*) from active30) > 0
        then round((select count(*) from active30 a join cust c on c.customer_phone = a.customer_phone
                    where c.first_at < now() - interval '30 days') * 100.0
                   / (select count(*) from active30), 1)
        else 0 end)),
  'segments', (
    select jsonb_build_object(
      'activos', count(*) filter (where last_at >= now() - interval '30 days')::int,
      'enRiesgo', count(*) filter (where last_at < now() - interval '30 days' and last_at >= now() - interval '60 days')::int,
      'dormidos', count(*) filter (where last_at < now() - interval '60 days' and last_at >= now() - interval '90 days')::int,
      'perdidos', count(*) filter (where last_at < now() - interval '90 days')::int,
      'unaSolaCompra', count(*) filter (where orders = 1)::int
    ) from cust),
  -- Margen de contribución de los últimos 90 días. No es utilidad neta (no descuenta
  -- alquiler, servicios, publicidad ni el tiempo del dueño) — es lo que queda del ingreso
  -- después de insumos+empaque y comisión de pasarela, que es lo único atribuible pedido
  -- a pedido.
  'margin', (
    select jsonb_build_object(
      'orders', orders,
      'revenue', round(revenue, 2),
      'ingredientCost', round(revenue * p_ingredient_cost_pct, 2),
      'paymentFees', round(card_revenue * p_card_fee_pct, 2),
      'contribution', round(revenue * (1 - p_ingredient_cost_pct) - card_revenue * p_card_fee_pct, 2),
      'contributionPct', case when revenue > 0
        then round(((revenue * (1 - p_ingredient_cost_pct) - card_revenue * p_card_fee_pct) / revenue * 100)::numeric, 1)
        else 0 end,
      'perOrder', case when orders > 0
        then round((revenue * (1 - p_ingredient_cost_pct) - card_revenue * p_card_fee_pct) / orders, 2)
        else 0 end,
      'cardSharePct', case when revenue > 0 then round(card_revenue * 100.0 / revenue, 1) else 0 end
    ) from recent),
  -- Tasas de attach/upgrade: el modelo dice que el ticket no está por debajo del mercado
  -- por precio unitario sino por ÍTEMS POR PEDIDO. Estas 4 cifras son las palancas
  -- directas de ese número.
  'attach', (
    select jsonb_build_object(
      'orders', orders,
      'avgUnits', round(avg_units, 2),
      'drinkPct', case when orders > 0 then round(with_drink * 100.0 / orders, 1) else 0 end,
      'size30Pct', case when orders > 0 then round(with_30cm * 100.0 / orders, 1) else 0 end,
      'doubleProtPct', case when orders > 0 then round(with_double * 100.0 / orders, 1) else 0 end,
      'extraSaucePct', case when orders > 0 then round(with_extra_sauce * 100.0 / orders, 1) else 0 end
    ) from recent),
  'params', jsonb_build_object(
    'cohortMonths', p_cohort_months,
    'ingredientCostPct', p_ingredient_cost_pct,
    'cardFeePct', p_card_fee_pct)
);
$$;

-- Mismo criterio que el resto de RPCs sensibles: solo la service_role (o sea, solo la
-- edge function `api` detrás de requireAdmin) puede llamarla. Sin esto, cualquiera con la
-- anon key podría leer las cohortes completas del negocio desde el navegador.
revoke all on function public.retention_report(int, numeric, numeric) from public, anon, authenticated;
grant execute on function public.retention_report(int, numeric, numeric) to service_role;
