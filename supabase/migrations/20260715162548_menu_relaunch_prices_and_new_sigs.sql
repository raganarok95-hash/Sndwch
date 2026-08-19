
update catalog_prices set values = '{"p15":13,"p30":21,"pDbl":6}'::jsonb, updated_at = now() where code = 'P03';
update catalog_prices set values = '{"p15":14,"p30":22,"pDbl":5}'::jsonb, updated_at = now() where code = 'P04';

insert into catalog_prices (code, category, values) values
  ('SIG06', 'sig', '{"p15":17,"p30":22}'::jsonb),
  ('SIG07', 'sig', '{"p15":25,"p30":25}'::jsonb)
on conflict (code) do nothing;
