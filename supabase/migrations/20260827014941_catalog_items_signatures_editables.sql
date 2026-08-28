-- Catálogo de Signatures editable desde el panel admin, sin desplegar código.
--
-- Mismo patrón, probado, que `secret_signature`: APPEND-ONLY. Publicar inserta una fila
-- nueva y la de MAYOR id para cada item_id es la vigente. Así el historial de cada versión
-- del menú queda gratis y se puede auditar qué se cobraba en qué fecha.
--
-- Los literales SIGS (src/app.ts) y SIG_DATA/SIG_LABEL (catalog.ts) pasan a ser SEMILLA:
-- sirven para el primer render y como respaldo si la base no responde, pero en runtime
-- loadCatalogItems() los sobreescribe con lo de esta tabla.
--
-- SIG05 NO va acá: el menú secreto ya tiene su propia tabla (`secret_signature`) con su
-- propio ciclo de rotación mensual y su propio panel.
--
-- RLS activo y SIN políticas, igual que secret_signature y catalog_prices: solo la service
-- role de las edge functions entra. El cliente nunca lee esta tabla directo — recibe el
-- catálogo ya resuelto por la acción pública `get-catalog`.
create table if not exists catalog_items (
  id              bigint generated always as identity primary key,
  item_id         text        not null,
  name            text        not null,
  subtitle        text        not null default 'Signature',
  badge           text,
  pitch           text        not null default '',
  base            text        not null,
  protein_id      text        not null,
  tops            jsonb       not null default '[]'::jsonb,
  sauces          jsonb       not null default '[]'::jsonb,
  price_15        numeric     not null,
  price_30        numeric     not null,
  fixed_cheese    text,
  cheese_optional boolean     not null default false,
  image_path      text,
  -- Retirar un Signature del menú (como pasó con THE CHICAGO) deja de ser un cambio de
  -- código: se publica una fila con active=false y desaparece de la carta, conservando
  -- toda su receta para cuando vuelva.
  active          boolean     not null default true,
  created_by      text,
  created_at      timestamptz not null default now()
);

-- La consulta caliente es "la fila vigente de cada ítem" y corre en cada loadCatalogPrices.
create index if not exists catalog_items_vigente_idx on catalog_items (item_id, id desc);

alter table catalog_items enable row level security;

-- Semilla con el menú EXACTO que hoy está en código, para que el día 1 no cambie nada.
-- Verificado antes de sembrar: estos precios coinciden uno a uno con las filas de
-- categoría 'sig' que ya tenía `catalog_prices`, así que ningún precio real se mueve.
insert into catalog_items
  (item_id, name, subtitle, badge, pitch, base, protein_id, tops, sauces, price_15, price_30, fixed_cheese, cheese_optional, image_path, created_by)
values
  ('SIG01','The Original','Signature','Clásico',
   'El primero de la carta y el que manda la receta: res mechada jugosa de cocción lenta, con el equilibrio justo entre fresco y dulce. Empieza por acá.',
   'B01','P01','["T01","T02","T03"]','["S01","S04"]',20.9,26.9,null,false,'img/sig01.jpg','migracion-2026-08-27'),
  ('SIG02','The Marinara','Signature','Italiano',
   'Albóndigas caseras bañadas en marinara, con mozzarella derretida hasta el borde y aceituna negra sobre una vinagreta al estilo italiano. El clásico de toda la vida, hecho como se debe: con queso de verdad.',
   'B01','P06','["T01","T03","T05"]','["S06"]',21.9,28.9,'C01',false,'img/sig02.jpg','migracion-2026-08-27'),
  ('SIG03','The Smoke','Signature','Ahumado',
   'Fiambres italianos ahumados y cheddar derretido sobre focaccia artesanal, con un glaseado dulce-ahumado que se queda contigo. Nuestro build más premium, bocado a bocado.',
   'B03','P05','["T03","T02","T01"]','["S03"]',23.9,34.9,'C02',false,'img/sig03.jpg','migracion-2026-08-27'),
  ('SIG04','The Fresh','Signature','Cítrico',
   'Atún premium con mayonesa clásica, con el crocante fresco del apio y un chorrito de limón que corta la cremosidad, y el carácter justo de la mostaza dijon. Fresco en cada bocado — ideal para cualquier hora del día.',
   'B01','P04','["T01","T02","T08"]','["S11"]',20.9,34.9,null,false,'img/sig04.jpg','migracion-2026-08-27'),
  ('SIG06','The Teriyaki','Signature','Asiático',
   'Pollo teriyaki caramelizado con salsa satay de maní y nuestra salsa de la casa — dulce, tostado, con la firma SND//WCH en cada bocado. El sabor asiático que le faltaba al menú.',
   'B01','P02','["T01","T06"]','["S10","S05"]',19.9,25.9,null,false,'img/sig06.jpg','migracion-2026-08-27');

-- Las filas 'sig' de `catalog_prices` quedan MUERTAS a partir de acá: loadCatalogItems()
-- corre después de loadCatalogPrices() y sobreescribe esos mismos precios. Dejarlas sería
-- reintroducir exactamente el problema que esta migración viene a eliminar — dos fuentes
-- para el mismo número, y una ganando en silencio. Se borran, y el editor viejo de precios
-- ahora rechaza la categoría 'sig' apuntando al panel nuevo (ver actions/catalog.ts).
delete from catalog_prices where category = 'sig';
