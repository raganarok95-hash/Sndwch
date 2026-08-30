-- Corrección de la migración de hace unos minutos (referral_milestones), en la misma
-- sesión y antes de que llegara a producción.
--
-- La primera versión recibía la escalera entera (`p_tiers`/`p_points`) y ELEGÍA dentro del
-- SQL qué escalón pagar. Funciona, pero deja una decisión de DINERO en un sitio que
-- `npm run test:api` no puede ejecutar: esas pruebas corren el código real del backend en
-- Deno, no el plpgsql. Y la regla de este repo es explícita — el cálculo puro se extrae de
-- la acción que toca la base, justamente para poder probarlo (así salieron
-- `cancellationDeltas` y `batchExpiryStatus`).
--
-- Ahora `nextReferralMilestone()` (actions/orders.ts) decide el escalón y esta función solo
-- hace la parte que SOLO la base puede hacer: escribirlo una única vez. La condición
-- `referral_milestone_granted < p_tier` en el WHERE es lo que lo vuelve idempotente y
-- seguro ante dos referidos convertidos en el mismo segundo — la segunda llamada no
-- encuentra fila y no paga nada.

drop function if exists public.grant_referral_milestone(text, integer[], integer[]);

create or replace function public.grant_referral_milestone(
  p_phone text,
  p_tier integer,
  p_points integer
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_points int;
begin
  if p_phone is null or p_tier is null or p_tier <= 0 or coalesce(p_points, 0) <= 0 then
    return null;
  end if;

  update public.customers
  set points = coalesce(points, 0) + p_points,
      referral_milestone_granted = p_tier
  where phone = p_phone
    and coalesce(referral_milestone_granted, 0) < p_tier
  returning points into v_points;

  if not found then
    return null;
  end if;

  return jsonb_build_object('tier', p_tier, 'points', p_points, 'balance', v_points);
end;
$function$;

-- Sexto caso del mismo defecto en este repo: una RPC `security definer` sin este revoke
-- queda llamable con la anon key, o sea que cualquiera podría regalarse puntos.
revoke execute on function public.grant_referral_milestone(text, integer, integer) from public, anon, authenticated;
grant execute on function public.grant_referral_milestone(text, integer, integer) to service_role;
