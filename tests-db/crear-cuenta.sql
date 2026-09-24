-- crear_cuenta (2026-09-24): la cuenta y su bono de bienvenida se crean juntos, o nada.
do $$
declare v customers; n int;
begin
  -- 1. Con bono: la cuenta nace con esos puntos y el historial los explica.
  v := crear_cuenta('{"phone":"930000101","name":"Ana","pin":"x","dni":"70000101","referral_code":"930000101"}', 40);
  if v.points <> 40 or (select coalesce(sum(points), 0) from transactions where customer_phone = '930000101') <> 40 then
    raise exception '1 puntos % e historial no cuadran', v.points;
  end if;
  -- 2. Sin bono (ya lo recibió antes): sin puntos y sin fila de historial.
  v := crear_cuenta('{"phone":"930000102","name":"Beto","pin":"x","dni":"70000102","referral_code":"930000102"}', 0);
  select count(*) into n from transactions where customer_phone = '930000102';
  if v.points <> 0 or n <> 0 then raise exception '2 sin bono: % pts, % filas', v.points, n; end if;
  -- 3. Los valores por defecto se respetan (lo que el registro no fija).
  if v.session_version <> 1 or v.notif_prefs is null or v.credit_balance <> 0 then raise exception '3 no tomó los defectos'; end if;
  -- 4. Una cuenta repetida falla entera: ni la cuenta ni el bono.
  begin
    perform crear_cuenta('{"phone":"930000101","name":"Otra","pin":"x","dni":"70000999","referral_code":"x"}', 40);
    raise exception '4 creó una cuenta repetida';
  exception when unique_violation then null;
  end;
  if (select coalesce(sum(points), 0) from transactions where customer_phone = '930000101') <> 40 then raise exception '4 anotó un bono de más'; end if;
  -- 5. La clave pública no la puede llamar.
  if has_function_privilege('anon', 'public.crear_cuenta(jsonb,integer)', 'execute') then raise exception '5 anon puede ejecutar'; end if;
end $$;
