-- #38 — Precio de insumo por compra.
--
-- Hoy TODO el costeo del menú corre sobre literales escritos a mano en markdown
-- (MENU_FINANCIAL_ANALYSIS.md, RECETARIO.md), y el propio recetario marca cuáles están
-- investigados y cuáles son estimados sin cotizar. Ninguno se actualiza solo cuando sube la
-- carne, así que el margen que dice el análisis y el margen real se separan en silencio.
--
-- Cada compra es un HECHO con fecha: la tabla es un registro de eventos, no un catálogo de
-- precios que se sobrescribe. Así el precio vigente se deriva (la última compra, o el
-- promedio ponderado de las últimas) y de paso queda la serie para ver que el pollo subió.
create table if not exists public.ingredient_purchases (
  id bigserial primary key,
  -- El mismo código del catálogo/inventario/recetas (P01, B01, T03...). Es lo que permite
  -- cruzar una compra con la receta que la usa sin ninguna tabla de traducción.
  product_code text not null,
  supplier text,
  -- Cantidad y unidad TAL COMO SE COMPRÓ (6 kg, 20 unidades). El costo unitario se deriva;
  -- guardarlo también sería una segunda fuente para el mismo número.
  qty numeric not null check (qty > 0),
  unit text not null,
  -- Lo que se pagó en total por esa cantidad. Es el dato que el dueño tiene en la mano
  -- (la boleta), no un precio unitario que tendría que calcular él.
  total_paid numeric not null check (total_paid >= 0),
  purchased_at date not null default (now() at time zone 'America/Lima')::date,
  notes text,
  created_by text,
  created_at timestamptz not null default now()
);

create index if not exists ingredient_purchases_code_idx
  on public.ingredient_purchases (product_code, purchased_at desc, id desc);

-- RLS activado sin políticas = solo service_role, el patrón de todo este proyecto.
alter table public.ingredient_purchases enable row level security;
