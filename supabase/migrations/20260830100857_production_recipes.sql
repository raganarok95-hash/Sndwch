-- #9 / #3 / #4 — Las recetas de producción dejan de vivir solo en RECETARIO.md.
--
-- Ese documento sigue siendo la explicación (por qué punta de pecho y no lomo, por qué la
-- panade, qué pasa si sobrecargas la sartén) y ahí se queda. Lo que se mueve acá es SOLO lo
-- que la app necesita calcular: cuánto de cada cosa, cuántas porciones rinde, y cuántos
-- minutos dura cada etapa. Markdown no se puede escalar a 40 porciones ni disparar un
-- temporizador.
--
-- APPEND-ONLY, igual que catalog_items y secret_signature: publicar inserta una fila nueva
-- y la de mayor id por recipe_code es la vigente. Sale gratis el historial de "qué hice la
-- vez que salió bien", que en una receta es justamente lo que uno quiere mirar.
--
-- ⚠ NO LLEVA shelf_life_days A PROPÓSITO. La vida útil ya vive en `inventory.shelf_life_days`
-- (automatización #5, editable desde el panel de Inventario) y es lo que usa la alerta de
-- caducidad. Repetirla acá crearía dos números para la misma cosa y uno ganaría en silencio
-- — el defecto que en este proyecto ya costó tres semanas de precios fantasma. Las etiquetas
-- de tanda (#4) leen la vida útil del inventario, no de la receta.
create table if not exists public.production_recipes (
  id bigserial primary key,
  -- El mismo código del catálogo/inventario (P01, P02, S05...). Es lo que permite cruzar una
  -- receta con su stock y con la demanda del plan de tanda sin ninguna tabla de traducción.
  recipe_code text not null,
  name text not null,
  -- Cuántas porciones rinde la receta TAL COMO está escrita. Es el divisor de todo el
  -- escalado: sin él, "quiero 40 porciones" no se puede responder.
  yield_portions integer not null check (yield_portions > 0),
  portion_grams integer,
  -- [{ "item": "Punta de pecho", "qty": 6000, "unit": "g" }] — qty numérico SIEMPRE, para
  -- poder multiplicarlo. Una cantidad escrita como "2 cdas" no se puede escalar.
  ingredients jsonb not null default '[]'::jsonb,
  -- [{ "label": "Sellar", "minutes": 15 }] — los minutos son lo que hace posible el
  -- temporizador por etapa (#3). Una etapa sin minutos se muestra igual, solo que sin
  -- cronómetro: es preferible a inventarle una duración.
  steps jsonb not null default '[]'::jsonb,
  notes text,
  active boolean not null default true,
  created_by text,
  created_at timestamptz not null default now()
);

create index if not exists production_recipes_code_idx
  on public.production_recipes (recipe_code, id desc);

-- RLS activado sin políticas = solo service_role, el patrón de todo este proyecto. Una
-- receta no es secreta, pero tampoco tiene por qué ser pública ni editable con la anon key.
alter table public.production_recipes enable row level security;
