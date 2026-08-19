-- Estadísticas públicas (prueba social) para mostrar en el home a clientes sin
-- iniciar sesión — deliberadamente NO expone nada de negocio (ingresos, clientes,
-- etc.), solo rating promedio/conteo y pedidos entregados.
create or replace function public_stats()
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  result json;
begin
  select json_build_object(
    'ratingsAvg', (select round(avg(stars)::numeric, 1) from ratings),
    'ratingsCount', (select count(*) from ratings),
    'ordersDelivered', (select count(*) from orders where status = 'ENTREGADO')
  ) into result;
  return result;
end;
$$;
