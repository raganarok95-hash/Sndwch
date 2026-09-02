-- #55 — Referidos escalonados.
--
-- Hasta hoy invitar pagaba SIEMPRE lo mismo: 400 puntos (un 15CM gratis) por cada referido
-- que hace su primer pedido pagado, sin importar si era el primero o el décimo. Un premio
-- plano no le da a nadie una razón para pasar del segundo: el esfuerzo de invitar SUBE
-- (los amigos fáciles ya están dentro) mientras el premio se queda igual.
--
-- Ahora hay un premio EXTRA al 3.º, 5.º y 10.º referido convertido. Los montos NO viven en
-- este SQL: llegan como parámetro desde REFERRAL_MILESTONES (env.ts), que es el único
-- sitio donde se editan. Escribirlos también acá crearía dos fuentes para el mismo número,
-- que es exactamente el defecto que en este proyecto ya costó tres semanas de precios
-- fantasma.

alter table public.customers
  add column if not exists referral_milestone_granted integer not null default 0;

comment on column public.customers.referral_milestone_granted is
  'Escalon de referidos mas alto ya pagado (0 = ninguno). MONOTONICO: nunca baja, ni siquiera si total_referrals baja por una cancelacion. Quitar un premio ya otorgado puede dejar el saldo en negativo (los puntos pueden estar canjeados), y lo que de verdad importa es que no se vuelva a pagar el mismo escalon al recuperar el conteo.';

create or replace function public.grant_referral_milestone(
  p_phone text,
  p_tiers integer[],
  p_points integer[]
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_count int;
  v_done int;
  v_tier int;
  v_points int;
begin
  if p_phone is null or p_tiers is null or p_points is null then
    return null;
  end if;

  select coalesce(total_referrals, 0), coalesce(referral_milestone_granted, 0)
    into v_count, v_done
  from public.customers
  where phone = p_phone;
  if not found then
    return null;
  end if;

  -- El escalon MAS ALTO alcanzado y todavia no pagado, no "el siguiente". Si por lo que
  -- sea se salto uno (un fallo de red en la llamada anterior, dos referidos convertidos
  -- casi a la vez), el cliente igual cobra el que le corresponde por su conteo real en vez
  -- de quedarse trabado para siempre en el escalon que se perdio.
  select t.tier, t.pts into v_tier, v_points
  from unnest(p_tiers, p_points) as t(tier, pts)
  where t.tier <= v_count
    and t.tier > v_done
  order by t.tier desc
  limit 1;

  if v_tier is null then
    return null;
  end if;

  -- `referral_milestone_granted < v_tier` en el WHERE es lo que hace esto seguro ante dos
  -- llamadas simultaneas: la segunda no encuentra fila y no paga nada. Sin esa condicion,
  -- dos referidos convertidos en el mismo segundo pagarian el escalon dos veces.
  update public.customers
  set points = coalesce(points, 0) + coalesce(v_points, 0),
      referral_milestone_granted = v_tier
  where phone = p_phone
    and coalesce(referral_milestone_granted, 0) < v_tier;

  if not found then
    return null;
  end if;

  return jsonb_build_object('tier', v_tier, 'points', coalesce(v_points, 0));
end;
$function$;

-- Sexto caso del mismo defecto en este repo: una RPC `security definer` sin este revoke
-- queda llamable con la anon key, o sea que cualquiera podria regalarse puntos.
revoke execute on function public.grant_referral_milestone(text, integer[], integer[]) from public, anon, authenticated;
grant execute on function public.grant_referral_milestone(text, integer[], integer[]) to service_role;
