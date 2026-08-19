create or replace function public.release_promo_redemption(p_promo_id uuid, p_phone text, p_order_ref text)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_deleted integer;
begin
  if p_promo_id is null then
    return;
  end if;
  delete from promo_code_redemptions
  where promo_code_id = p_promo_id and phone = p_phone and order_ref = p_order_ref;
  get diagnostics v_deleted = row_count;
  if v_deleted > 0 then
    update promo_codes set uses_count = greatest(uses_count - v_deleted, 0) where id = p_promo_id;
  end if;
end;
$$;
