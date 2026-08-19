-- Whole-table dashboard numbers computed in SQL instead of being derived from a
-- JS in-memory reduce over a limit=1000/200 fetch, which would silently undercount
-- once the business grows past those row caps.
create or replace function dashboard_aggregates(p_week_start timestamptz, p_month_start timestamptz)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  result json;
begin
  select json_build_object(
    'allTime', (
      select json_build_object('revenue', coalesce(sum(total), 0), 'count', count(*))
      from orders where payment_status = 'paid'
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
        and payment_method not in ('cod', 'yape', 'plin')
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
        'VIP', count(*) filter (where coalesce(points, 0) >= 400),
        'FREQUENT', count(*) filter (where coalesce(points, 0) >= 200 and coalesce(points, 0) < 400),
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
    'ratingsCount', (select count(*) from ratings)
  ) into result;
  return result;
end;
$$;
