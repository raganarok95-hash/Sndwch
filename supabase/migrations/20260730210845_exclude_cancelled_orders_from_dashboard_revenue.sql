-- Auditoría de análisis de negocio (2026-07-30): dashboard_aggregates contaba pedidos
-- CANCELADO (payment_status sigue 'paid' porque el reembolso se coordina manualmente
-- fuera del sistema, ver needsManualRefund en orders.ts) como ingreso real en allTime/
-- weekPrev/monthPrev/referrals.revenue/peakHours/peakDays. Confirmado con los 5 pedidos
-- de prueba: 2 CANCELADO+paid se contaban junto al único pedido realmente entregado
-- (sobreestimación de ~59% en ese set). pendingPayment/codPending ya excluían CANCELADO
-- correctamente — se aplica el mismo criterio a todos los agregados de ingreso.
CREATE OR REPLACE FUNCTION public.dashboard_aggregates(p_week_start timestamp with time zone, p_month_start timestamp with time zone)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  result json;
  v_prev_week_start timestamptz := p_week_start - interval '7 days';
  v_prev_month_start timestamptz := p_month_start - interval '1 month';
begin
  select json_build_object(
    'allTime', (
      select json_build_object('revenue', coalesce(sum(total), 0), 'count', count(*))
      from orders where payment_status = 'paid' and status is distinct from 'CANCELADO'
    ),
    'statusCounts', (
      select coalesce(json_object_agg(status, cnt), '{}'::json)
      from (
        select coalesce(status, 'RECIBIDO') as status, count(*) as cnt
        from orders group by 1
      ) s
    ),
    'pendingPayment', (
      select count(*) from orders
      where payment_status is distinct from 'paid'
        and status is distinct from 'CANCELADO'
        and (payment_method is null or payment_method not in ('cod', 'yape', 'plin'))
    ),
    'codPending', (
      select json_build_object('count', count(*), 'total', coalesce(sum(total), 0))
      from orders
      where payment_method in ('cod', 'yape', 'plin')
        and payment_status is distinct from 'paid'
        and status is distinct from 'CANCELADO'
    ),
    'avgEtaMinutes', (
      select round(avg(eta_minutes)) from orders where eta_minutes is not null
    ),
    'customersTotal', (select count(*) from customers),
    'newThisWeek', (select count(*) from customers where created_at >= p_week_start),
    'newThisMonth', (select count(*) from customers where created_at >= p_month_start),
    'returning', (select count(*) from customers where coalesce(total_orders, 0) > 1),
    'tierCounts', (
      select json_build_object(
        'FREQUENT', count(*) filter (where coalesce(points, 0) >= 200),
        'REGULAR', count(*) filter (where coalesce(points, 0) >= 80 and coalesce(points, 0) < 200),
        'MEMBER', count(*) filter (where coalesce(points, 0) < 80)
      )
      from customers
    ),
    'pointsIssued', (
      select coalesce(sum(points), 0) from transactions where type = 'earn_confirmed'
    ),
    'pointsRedeemed', (
      select coalesce(sum(abs(points)), 0) from transactions where type = 'redeem'
    ),
    'ratingsAvg', (select round(avg(stars)::numeric, 1) from ratings),
    'ratingsCount', (select count(*) from ratings),
    'referrals', (
      select json_build_object(
        'referredCustomers', count(*),
        'revenue', coalesce((
          select sum(o.total) from orders o
          where o.payment_status = 'paid' and o.status is distinct from 'CANCELADO'
            and o.customer_phone in (select phone from customers where referred_by is not null)
        ), 0)
      )
      from customers where referred_by is not null
    ),
    'weekPrev', (
      select json_build_object('revenue', coalesce(sum(total), 0), 'count', count(*))
      from orders where payment_status = 'paid' and status is distinct from 'CANCELADO'
        and created_at >= v_prev_week_start and created_at < p_week_start
    ),
    'monthPrev', (
      select json_build_object('revenue', coalesce(sum(total), 0), 'count', count(*))
      from orders where payment_status = 'paid' and status is distinct from 'CANCELADO'
        and created_at >= v_prev_month_start and created_at < p_month_start
    ),
    'peakHours', (
      select coalesce(json_agg(json_build_object('hour', hr, 'count', cnt) order by hr), '[]'::json)
      from (
        select extract(hour from created_at at time zone 'America/Lima')::int as hr, count(*) as cnt
        from orders
        where payment_status = 'paid' and status is distinct from 'CANCELADO' and created_at >= now() - interval '90 days'
        group by 1
      ) h
    ),
    'peakDays', (
      select coalesce(json_agg(json_build_object('dow', dw, 'count', cnt) order by dw), '[]'::json)
      from (
        select extract(dow from created_at at time zone 'America/Lima')::int as dw, count(*) as cnt
        from orders
        where payment_status = 'paid' and status is distinct from 'CANCELADO' and created_at >= now() - interval '90 days'
        group by 1
      ) d
    )
  ) into result;
  return result;
end;
$function$;
