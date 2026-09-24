-- SND//WCH — EL ESQUEMA COMPLETO DE LA BASE, TAL COMO ESTÁ. GENERADO, NO SE EDITA A MANO.
--
-- Sale de scripts/pg-local/foto-del-esquema.sql corrida contra la base real. Existe porque las
-- migraciones NO reconstruyen la base (las tablas originales nacieron fuera del historial): con
-- este archivo sí. Restaurar = cargar este archivo y después los datos del respaldo.
--
-- foto-tomada-tras-migracion: 20260924212333

create sequence if not exists public.ingredient_purchases_id_seq as bigint increment 1 minvalue 1 maxvalue 9223372036854775807 start 1;

create sequence if not exists public.production_recipes_id_seq as bigint increment 1 minvalue 1 maxvalue 9223372036854775807 start 1;

create sequence if not exists public.saved_addresses_id_seq as bigint increment 1 minvalue 1 maxvalue 9223372036854775807 start 1;

create table public.ad_spend (
  id bigint generated always as identity not null,
  spend_date date not null,
  platform text default 'meta'::text not null,
  amount numeric(10,2) not null,
  note text,
  created_by text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

create table public.admin_accounts (
  phone text not null,
  name text not null,
  role text default 'admin'::text,
  created_at timestamp with time zone default now(),
  last_login_at timestamp with time zone
);

create table public.admin_action_log (
  id bigint generated always as identity not null,
  actor_phone text not null,
  action text not null,
  target text,
  detail jsonb,
  created_at timestamp with time zone default now() not null
);

create table public.app_settings (
  id boolean default true not null,
  business_launched boolean default false not null,
  updated_at timestamp with time zone default now() not null,
  paused_until timestamp with time zone,
  promos_killed_at timestamp with time zone,
  promos_killed_by text
);

create table public.cart_snapshots (
  customer_phone text not null,
  items jsonb default '[]'::jsonb not null,
  updated_at timestamp with time zone default now() not null,
  reminded_at timestamp with time zone
);

create table public.catalog_items (
  id bigint generated always as identity not null,
  item_id text not null,
  name text not null,
  subtitle text default 'Signature'::text not null,
  badge text,
  pitch text default ''::text not null,
  base text not null,
  protein_id text not null,
  tops jsonb default '[]'::jsonb not null,
  sauces jsonb default '[]'::jsonb not null,
  price_15 numeric(10,2) not null,
  price_30 numeric(10,2) not null,
  fixed_cheese text,
  cheese_optional boolean default false not null,
  image_path text,
  active boolean default true not null,
  created_by text,
  created_at timestamp with time zone default now() not null
);

create table public.catalog_prices (
  code text not null,
  category text not null,
  "values" jsonb not null,
  updated_at timestamp with time zone default now() not null
);

create table public.complaints (
  id bigint generated always as identity not null,
  claim_code text not null,
  created_at timestamp with time zone default now() not null,
  kind text not null,
  consumer_name text not null,
  consumer_dni text not null,
  consumer_address text not null,
  consumer_phone text not null,
  consumer_email text not null,
  is_minor boolean default false not null,
  guardian_name text,
  order_ref text,
  claimed_amount numeric(10,2),
  detail text not null,
  consumer_request text not null,
  status text default 'pendiente'::text not null,
  provider_response text,
  responded_at timestamp with time zone,
  responded_by text,
  alerted_deadline boolean default false not null,
  alerted_deadline_final boolean default false not null
);

create table public.content_uploads (
  id uuid default gen_random_uuid() not null,
  storage_path text not null,
  mime text not null,
  uploaded_at timestamp with time zone default now() not null,
  status text default 'pending'::text not null,
  notes text,
  error_message text,
  linked_calendar_id uuid,
  updated_at timestamp with time zone default now() not null
);

create table public.credit_ledger (
  id bigint generated always as identity not null,
  customer_phone text not null,
  delta numeric(10,2) not null,
  reason text not null,
  related_phone text,
  created_at timestamp with time zone default now() not null
);

create table public.cron_heartbeats (
  action text not null,
  last_ok_at timestamp with time zone,
  last_error_at timestamp with time zone,
  last_error text,
  ok_runs bigint default 0 not null,
  error_runs bigint default 0 not null,
  alerted_at timestamp with time zone
);

create table public.customers (
  phone text not null,
  name text not null,
  pin text not null,
  points integer default 0,
  pending_points integer default 0,
  total_orders integer default 0,
  total_redeemed integer default 0,
  created_at timestamp with time zone default now(),
  birthday text,
  birthday_pts_year integer default 0,
  referral_code text,
  referred_by text,
  total_referrals integer default 0,
  last_address text,
  address_count integer default 0,
  email text,
  dni text,
  reset_token text,
  reset_token_expires timestamp with time zone,
  failed_login_count integer default 0 not null,
  locked_until timestamp with time zone,
  session_version integer default 1 not null,
  last_winback_sent timestamp with time zone,
  credit_balance numeric(10,2) default 0 not null,
  challenge_claimed_month text,
  discovery_claimed_month text,
  acquisition_source text,
  google_id text,
  referral_bonus_granted boolean default false not null,
  referral_milestone_granted integer default 0 not null,
  monthly_recap_ym integer default 0 not null,
  ad_tracking_opt_out boolean default false not null,
  preferred_payment text,
  notif_prefs jsonb default '{"promo": true, "pedido": true}'::jsonb not null
);

create table public.debug_logs (
  id bigint generated always as identity not null,
  source text,
  detail jsonb,
  created_at timestamp with time zone default now()
);

create table public.deleted_account_identities (
  phone text not null,
  dni text,
  deleted_at timestamp with time zone default now() not null
);

create table public.favorites (
  id bigint generated always as identity not null,
  customer_phone text not null,
  name text not null,
  build jsonb not null,
  created_at timestamp with time zone default now() not null,
  items jsonb
);

create table public.group_order_items (
  id uuid default gen_random_uuid() not null,
  group_order_id uuid not null,
  contributor_name text not null,
  item jsonb not null,
  created_at timestamp with time zone default now() not null
);

create table public.group_orders (
  id uuid default gen_random_uuid() not null,
  code text not null,
  organizer_phone text not null,
  organizer_name text not null,
  status text default 'open'::text not null,
  created_at timestamp with time zone default now() not null,
  expires_at timestamp with time zone not null,
  split_deadline timestamp with time zone
);

create table public.ingredient_purchases (
  id bigint default nextval('ingredient_purchases_id_seq'::regclass) not null,
  product_code text not null,
  supplier text,
  qty numeric not null,
  unit text not null,
  total_paid numeric not null,
  purchased_at date default ((now() AT TIME ZONE 'America/Lima'::text))::date not null,
  notes text,
  created_by text,
  created_at timestamp with time zone default now() not null
);

create table public.inventory (
  product_code text not null,
  product_name text,
  in_stock boolean default true not null,
  updated_at text,
  stock_qty integer,
  low_stock_threshold integer default 5 not null,
  batch_cooked_at timestamp with time zone,
  shelf_life_days integer default 3 not null
);

create table public.login_attempts (
  phone text not null,
  failed_count integer default 0 not null,
  locked_until timestamp with time zone,
  updated_at timestamp with time zone default now() not null
);

create table public.login_codes (
  email text not null,
  code_hash text not null,
  expires_at timestamp with time zone not null,
  attempts integer default 0 not null,
  sent_at timestamp with time zone default now() not null
);

create table public.marketing_calendar (
  id uuid default gen_random_uuid() not null,
  scheduled_date date not null,
  channel text not null,
  status text default 'draft'::text not null,
  title text not null,
  caption_text text,
  whatsapp_text text,
  photo_idea text,
  campaign_tag text,
  created_by text,
  posted_at timestamp with time zone,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  image_url text,
  published_ref text,
  media_type text default 'image'::text not null,
  video_url text,
  video_idea text
);

create table public.marketing_touches (
  id bigint generated always as identity not null,
  customer_phone text not null,
  campaign_type text not null,
  channel text default 'push'::text not null,
  sent_at timestamp with time zone default now() not null
);

create table public.order_problems (
  id bigint generated always as identity not null,
  order_id text not null,
  ref text not null,
  customer_phone text not null,
  motivo text not null,
  detalle text,
  respond_by timestamp with time zone not null,
  alerted boolean default false not null,
  resolved_at timestamp with time zone,
  resolution text,
  resolution_note text,
  resolved_by text,
  created_at timestamp with time zone default now() not null
);

create table public.orders (
  id text default (gen_random_uuid())::text not null,
  ref text not null,
  customer_phone text,
  customer_name text not null,
  customer_address text not null,
  summary text,
  total numeric(10,2) not null,
  status text default 'RECIBIDO'::text,
  date text default to_char(now(), 'DD/MM/YYYY'::text),
  created_at timestamp with time zone default now() not null,
  notes text,
  delivery_time timestamp with time zone,
  lat double precision,
  lon double precision,
  payment_status text default 'pending'::text,
  payment_id text,
  payment_method text,
  customer_email text,
  eta_minutes integer,
  redeemed_reward text,
  items jsonb default '[]'::jsonb not null,
  contact_phone text,
  alerted_stuck boolean default false not null,
  alerted_scheduled_reminder boolean default false not null,
  customer_rank text,
  delivered_at timestamp with time zone,
  cancel_reason text,
  redeemed_reward_pts integer,
  receipt_path text,
  delivery_fee numeric(10,2) default 0 not null,
  delivery_zone text,
  group_code text,
  alerted_stuck_progress boolean default false not null,
  status_changed_at timestamp with time zone,
  alerted_eta_missed boolean default false not null,
  reminded_customer_scheduled boolean default false not null,
  receipt_hash text,
  delivery_token text,
  receipt_ocr jsonb,
  receipt_op_number text,
  delivery_km numeric,
  promised_from timestamp with time zone,
  promised_to timestamp with time zone,
  recurring_id uuid
);

create table public.pending_charges (
  id uuid default gen_random_uuid() not null,
  ref text not null,
  customer_phone text,
  contact_phone text not null,
  customer_name text not null,
  customer_email text,
  customer_address text not null,
  notes text,
  summary text,
  expected_total numeric(10,2) not null,
  reserved_codes text[] default '{}'::text[] not null,
  reserved_qtys integer[] default '{}'::integer[] not null,
  sanitized_items jsonb not null,
  reward_id text,
  scheduled_for timestamp with time zone,
  status text default 'pending'::text not null,
  created_at timestamp with time zone default now() not null,
  expires_at timestamp with time zone not null,
  delivery_fee numeric(10,2) default 0 not null,
  delivery_zone text,
  promo_code_id uuid,
  promo_discount numeric(10,2) default 0 not null,
  lat double precision,
  lon double precision,
  declined_at timestamp with time zone,
  decline_reason text,
  delivery_km numeric,
  charge_id text,
  charged_at timestamp with time zone,
  alerted_orphan_charge boolean default false not null,
  recurring_id uuid
);

create table public.pending_weekly_plans (
  id uuid default gen_random_uuid() not null,
  ref text not null,
  buyer_phone text not null,
  buyer_name text not null,
  amount_paid numeric(10,2) not null,
  credit_amount numeric(10,2) not null,
  status text default 'pending'::text not null,
  created_at timestamp with time zone default now() not null,
  expires_at timestamp with time zone not null,
  declined_at timestamp with time zone,
  decline_reason text,
  charge_id text,
  charged_at timestamp with time zone
);

create table public.production_recipes (
  id bigint default nextval('production_recipes_id_seq'::regclass) not null,
  recipe_code text not null,
  name text not null,
  yield_portions integer not null,
  portion_grams integer,
  ingredients jsonb default '[]'::jsonb not null,
  steps jsonb default '[]'::jsonb not null,
  notes text,
  active boolean default true not null,
  created_by text,
  created_at timestamp with time zone default now() not null
);

create table public.promo_code_redemptions (
  id bigint generated always as identity not null,
  promo_code_id uuid not null,
  code text not null,
  order_ref text not null,
  phone text not null,
  discount_applied numeric(10,2) not null,
  created_at timestamp with time zone default now() not null
);

create table public.promo_codes (
  id uuid default gen_random_uuid() not null,
  code text not null,
  discount_type text not null,
  value numeric(10,2) not null,
  max_discount numeric(10,2),
  max_uses integer,
  uses_count integer default 0 not null,
  min_order_total numeric(10,2) default 0 not null,
  active boolean default true not null,
  valid_from timestamp with time zone,
  valid_until timestamp with time zone,
  campaign_tag text,
  created_by text,
  created_at timestamp with time zone default now() not null
);

create table public.push_subscriptions (
  id uuid default gen_random_uuid() not null,
  customer_phone text not null,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  created_at timestamp with time zone default now() not null
);

create table public.rate_limits (
  key text not null,
  count integer default 0 not null,
  window_start timestamp with time zone default now() not null
);

create table public.ratings (
  id bigint generated always as identity not null,
  order_ref text not null,
  customer_phone text,
  stars smallint not null,
  comment text,
  created_at timestamp with time zone default now() not null,
  testimonial_consent boolean default false not null
);

create table public.recurring_orders (
  id uuid default gen_random_uuid() not null,
  customer_phone text not null,
  items jsonb not null,
  weekday smallint not null,
  slot text not null,
  label text,
  active boolean default true not null,
  last_notified_at timestamp with time zone,
  created_at timestamp with time zone default now() not null,
  skip_on date,
  address_id bigint
);

create table public.restock_notify_requests (
  id uuid default gen_random_uuid() not null,
  customer_phone text not null,
  sig_id text not null,
  created_at timestamp with time zone default now() not null
);

create table public.saved_addresses (
  id bigint default nextval('saved_addresses_id_seq'::regclass) not null,
  customer_phone text,
  label text,
  address text not null,
  lat double precision,
  lon double precision,
  created_at timestamp with time zone default now(),
  reference text
);

create table public.secret_signature (
  id bigint generated always as identity not null,
  name text not null,
  base text not null,
  protein_id text not null,
  tops jsonb default '[]'::jsonb not null,
  sauces jsonb default '[]'::jsonb not null,
  price_15 numeric(10,2) not null,
  price_30 numeric(10,2) not null,
  vault_only_ids jsonb default '[]'::jsonb not null,
  min_orders integer default 5 not null,
  image_path text,
  created_by text,
  created_at timestamp with time zone default now() not null,
  ends_at timestamp with time zone,
  hints jsonb default '[]'::jsonb not null,
  blurb text
);

create table public.store_hours (
  weekday integer not null,
  open_hour numeric,
  close_hour numeric,
  closed boolean default false not null,
  updated_at timestamp with time zone default now() not null
);

create table public.transactions (
  id text default (gen_random_uuid())::text not null,
  customer_phone text not null,
  type text not null,
  points integer not null,
  description text,
  order_ref text,
  confirmed boolean default false,
  date text default to_char(now(), 'DD/MM/YYYY'::text),
  created_at timestamp with time zone default now()
);

create table public.waitlist_signups (
  id uuid default gen_random_uuid() not null,
  phone text not null,
  name text,
  source text,
  created_at timestamp with time zone default now() not null
);

create table public.zone_waitlist (
  id bigint generated always as identity not null,
  customer_phone text not null,
  district text not null,
  lat double precision,
  lon double precision,
  created_at timestamp with time zone default now() not null,
  notified_at timestamp with time zone
);

alter sequence public.ingredient_purchases_id_seq owned by public.ingredient_purchases.id;

alter sequence public.production_recipes_id_seq owned by public.production_recipes.id;

alter sequence public.saved_addresses_id_seq owned by public.saved_addresses.id;

alter table public.ad_spend add constraint ad_spend_amount_check CHECK ((amount >= (0)::numeric));

alter table public.ad_spend add constraint ad_spend_pkey PRIMARY KEY (id);

alter table public.ad_spend add constraint ad_spend_spend_date_platform_key UNIQUE (spend_date, platform);

alter table public.admin_accounts add constraint admin_accounts_pkey PRIMARY KEY (phone);

alter table public.admin_action_log add constraint admin_action_log_pkey PRIMARY KEY (id);

alter table public.app_settings add constraint app_settings_pkey PRIMARY KEY (id);

alter table public.app_settings add constraint app_settings_singleton CHECK (id);

alter table public.cart_snapshots add constraint cart_snapshots_pkey PRIMARY KEY (customer_phone);

alter table public.catalog_items add constraint catalog_items_pkey PRIMARY KEY (id);

alter table public.catalog_prices add constraint catalog_prices_category_check CHECK ((category = ANY (ARRAY['protein'::text, 'sig'::text, 'side'::text, 'reward'::text])));

alter table public.catalog_prices add constraint catalog_prices_pkey PRIMARY KEY (code);

alter table public.complaints add constraint complaints_claim_code_key UNIQUE (claim_code);

alter table public.complaints add constraint complaints_kind_check CHECK ((kind = ANY (ARRAY['reclamo'::text, 'queja'::text])));

alter table public.complaints add constraint complaints_pkey PRIMARY KEY (id);

alter table public.complaints add constraint complaints_status_check CHECK ((status = ANY (ARRAY['pendiente'::text, 'atendido'::text])));

alter table public.content_uploads add constraint content_uploads_pkey PRIMARY KEY (id);

alter table public.content_uploads add constraint content_uploads_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'processed'::text, 'error'::text])));

alter table public.credit_ledger add constraint credit_ledger_pkey PRIMARY KEY (id);

alter table public.cron_heartbeats add constraint cron_heartbeats_pkey PRIMARY KEY (action);

alter table public.customers add constraint customers_dni_key UNIQUE (dni);

alter table public.customers add constraint customers_dni_o_google CHECK (((dni IS NOT NULL) OR (google_id IS NOT NULL)));

alter table public.customers add constraint customers_pkey PRIMARY KEY (phone);

alter table public.customers add constraint customers_preferred_payment_check CHECK ((preferred_payment = ANY (ARRAY['yape'::text, 'culqi'::text])));

alter table public.customers add constraint customers_referral_code_key UNIQUE (referral_code);

alter table public.debug_logs add constraint debug_logs_pkey PRIMARY KEY (id);

alter table public.deleted_account_identities add constraint deleted_account_identities_pkey PRIMARY KEY (phone);

alter table public.favorites add constraint favorites_pkey PRIMARY KEY (id);

alter table public.group_order_items add constraint group_order_items_pkey PRIMARY KEY (id);

alter table public.group_orders add constraint group_orders_code_key UNIQUE (code);

alter table public.group_orders add constraint group_orders_pkey PRIMARY KEY (id);

alter table public.ingredient_purchases add constraint ingredient_purchases_pkey PRIMARY KEY (id);

alter table public.ingredient_purchases add constraint ingredient_purchases_qty_check CHECK ((qty > (0)::numeric));

alter table public.ingredient_purchases add constraint ingredient_purchases_total_paid_check CHECK ((total_paid >= (0)::numeric));

alter table public.inventory add constraint inventory_pkey PRIMARY KEY (product_code);

alter table public.inventory add constraint inventory_shelf_life_days_positivo CHECK ((shelf_life_days > 0));

alter table public.login_attempts add constraint login_attempts_pkey PRIMARY KEY (phone);

alter table public.login_codes add constraint login_codes_pkey PRIMARY KEY (email);

alter table public.marketing_calendar add constraint marketing_calendar_media_type_check CHECK ((media_type = ANY (ARRAY['image'::text, 'video'::text])));

alter table public.marketing_calendar add constraint marketing_calendar_pkey PRIMARY KEY (id);

alter table public.marketing_touches add constraint marketing_touches_pkey PRIMARY KEY (id);

alter table public.order_problems add constraint order_problems_motivo_check CHECK ((motivo = ANY (ARRAY['falto'::text, 'frio'::text, 'distinto'::text, 'otro'::text])));

alter table public.order_problems add constraint order_problems_pkey PRIMARY KEY (id);

alter table public.order_problems add constraint order_problems_resolution_check CHECK ((resolution = ANY (ARRAY['reposicion'::text, 'credito'::text, 'reembolso'::text])));

alter table public.orders add constraint orders_id_es_uuid CHECK ((id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'::text));

alter table public.orders add constraint orders_items_es_lista CHECK ((jsonb_typeof(items) = 'array'::text));

alter table public.orders add constraint orders_pkey PRIMARY KEY (id);

alter table public.orders add constraint orders_ref_key UNIQUE (ref);

alter table public.pending_charges add constraint pending_charges_pkey PRIMARY KEY (id);

alter table public.pending_charges add constraint pending_charges_ref_key UNIQUE (ref);

alter table public.pending_charges add constraint pending_charges_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'charging'::text, 'charged'::text, 'consumed'::text, 'expired'::text, 'cancelled'::text])));

alter table public.pending_weekly_plans add constraint pending_weekly_plans_pkey PRIMARY KEY (id);

alter table public.pending_weekly_plans add constraint pending_weekly_plans_ref_key UNIQUE (ref);

alter table public.production_recipes add constraint production_recipes_pkey PRIMARY KEY (id);

alter table public.production_recipes add constraint production_recipes_yield_portions_check CHECK ((yield_portions > 0));

alter table public.promo_code_redemptions add constraint promo_code_redemptions_order_ref_key UNIQUE (order_ref);

alter table public.promo_code_redemptions add constraint promo_code_redemptions_pkey PRIMARY KEY (id);

alter table public.promo_codes add constraint promo_codes_code_key UNIQUE (code);

alter table public.promo_codes add constraint promo_codes_discount_type_check CHECK ((discount_type = ANY (ARRAY['percent'::text, 'fixed'::text])));

alter table public.promo_codes add constraint promo_codes_pkey PRIMARY KEY (id);

alter table public.promo_codes add constraint promo_codes_value_check CHECK ((value > (0)::numeric));

alter table public.push_subscriptions add constraint push_subscriptions_endpoint_key UNIQUE (endpoint);

alter table public.push_subscriptions add constraint push_subscriptions_pkey PRIMARY KEY (id);

alter table public.rate_limits add constraint rate_limits_pkey PRIMARY KEY (key);

alter table public.ratings add constraint ratings_order_ref_unique UNIQUE (order_ref);

alter table public.ratings add constraint ratings_pkey PRIMARY KEY (id);

alter table public.ratings add constraint ratings_stars_check CHECK (((stars >= 1) AND (stars <= 5)));

alter table public.recurring_orders add constraint recurring_orders_pkey PRIMARY KEY (id);

alter table public.recurring_orders add constraint recurring_orders_slot_valido CHECK ((slot ~ '^[0-2][0-9]:[0-5][0-9]$'::text));

alter table public.recurring_orders add constraint recurring_orders_weekday_valido CHECK (((weekday >= 0) AND (weekday <= 6)));

alter table public.restock_notify_requests add constraint restock_notify_requests_customer_phone_sig_id_key UNIQUE (customer_phone, sig_id);

alter table public.restock_notify_requests add constraint restock_notify_requests_pkey PRIMARY KEY (id);

alter table public.saved_addresses add constraint saved_addresses_pkey PRIMARY KEY (id);

alter table public.secret_signature add constraint secret_signature_pkey PRIMARY KEY (id);

alter table public.store_hours add constraint store_hours_pkey PRIMARY KEY (weekday);

alter table public.store_hours add constraint store_hours_weekday_check CHECK (((weekday >= 0) AND (weekday <= 6)));

alter table public.transactions add constraint transactions_pkey PRIMARY KEY (id);

alter table public.waitlist_signups add constraint waitlist_signups_pkey PRIMARY KEY (id);

alter table public.zone_waitlist add constraint zone_waitlist_pkey PRIMARY KEY (id);

alter table public.content_uploads add constraint content_uploads_linked_calendar_id_fkey FOREIGN KEY (linked_calendar_id) REFERENCES marketing_calendar(id);

alter table public.credit_ledger add constraint credit_ledger_customer_phone_fkey FOREIGN KEY (customer_phone) REFERENCES customers(phone);

alter table public.favorites add constraint favorites_customer_phone_fkey FOREIGN KEY (customer_phone) REFERENCES customers(phone);

alter table public.group_order_items add constraint group_order_items_group_order_id_fkey FOREIGN KEY (group_order_id) REFERENCES group_orders(id) ON DELETE CASCADE;

alter table public.order_problems add constraint order_problems_order_id_fkey FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;

alter table public.orders add constraint orders_customer_phone_fkey FOREIGN KEY (customer_phone) REFERENCES customers(phone);

alter table public.orders add constraint orders_recurring_id_fkey FOREIGN KEY (recurring_id) REFERENCES recurring_orders(id) ON DELETE SET NULL;

alter table public.promo_code_redemptions add constraint promo_code_redemptions_promo_code_id_fkey FOREIGN KEY (promo_code_id) REFERENCES promo_codes(id);

alter table public.ratings add constraint ratings_customer_phone_fkey FOREIGN KEY (customer_phone) REFERENCES customers(phone);

alter table public.recurring_orders add constraint recurring_orders_address_id_fkey FOREIGN KEY (address_id) REFERENCES saved_addresses(id) ON DELETE SET NULL;

alter table public.saved_addresses add constraint saved_addresses_customer_phone_fkey FOREIGN KEY (customer_phone) REFERENCES customers(phone);

alter table public.transactions add constraint transactions_customer_phone_fkey FOREIGN KEY (customer_phone) REFERENCES customers(phone);

CREATE INDEX ad_spend_fecha_idx ON public.ad_spend USING btree (spend_date DESC);

CREATE INDEX catalog_items_vigente_idx ON public.catalog_items USING btree (item_id, id DESC);

CREATE INDEX complaints_status_idx ON public.complaints USING btree (status, created_at DESC);

CREATE UNIQUE INDEX customers_email_unico ON public.customers USING btree (lower(btrim(email))) WHERE ((email IS NOT NULL) AND (btrim(email) <> ''::text));

CREATE UNIQUE INDEX customers_google_id_idx ON public.customers USING btree (google_id) WHERE (google_id IS NOT NULL);

CREATE INDEX customers_monthly_recap_ym_idx ON public.customers USING btree (monthly_recap_ym);

CREATE INDEX deleted_account_identities_dni_idx ON public.deleted_account_identities USING btree (dni);

CREATE INDEX group_order_items_group_order_id_idx ON public.group_order_items USING btree (group_order_id);

CREATE INDEX idx_admin_action_log_actor ON public.admin_action_log USING btree (actor_phone);

CREATE INDEX idx_admin_action_log_created_at ON public.admin_action_log USING btree (created_at);

CREATE INDEX idx_credit_ledger_customer_phone ON public.credit_ledger USING btree (customer_phone);

CREATE INDEX idx_customers_dni ON public.customers USING btree (dni);

CREATE INDEX idx_customers_email ON public.customers USING btree (email);

CREATE INDEX idx_favorites_customer_phone ON public.favorites USING btree (customer_phone);

CREATE INDEX idx_group_orders_splitting ON public.group_orders USING btree (split_deadline) WHERE (status = 'splitting'::text);

CREATE INDEX idx_marketing_touches_campaign_sent ON public.marketing_touches USING btree (campaign_type, sent_at);

CREATE INDEX idx_marketing_touches_phone ON public.marketing_touches USING btree (customer_phone);

CREATE INDEX idx_order_problems_cliente ON public.order_problems USING btree (customer_phone);

CREATE INDEX idx_order_problems_pendientes ON public.order_problems USING btree (respond_by) WHERE (resolved_at IS NULL);

CREATE INDEX idx_orders_created_at ON public.orders USING btree (created_at);

CREATE INDEX idx_orders_customer_phone ON public.orders USING btree (customer_phone);

CREATE INDEX idx_orders_status ON public.orders USING btree (status);

CREATE INDEX idx_push_subscriptions_phone ON public.push_subscriptions USING btree (customer_phone);

CREATE INDEX idx_ratings_customer_phone ON public.ratings USING btree (customer_phone);

CREATE INDEX idx_saved_addresses_customer_phone ON public.saved_addresses USING btree (customer_phone);

CREATE INDEX idx_transactions_customer_phone ON public.transactions USING btree (customer_phone);

CREATE INDEX idx_zone_waitlist_district ON public.zone_waitlist USING btree (district) WHERE (notified_at IS NULL);

CREATE INDEX ingredient_purchases_code_idx ON public.ingredient_purchases USING btree (product_code, purchased_at DESC, id DESC);

CREATE INDEX login_codes_expires_idx ON public.login_codes USING btree (expires_at);

CREATE INDEX marketing_calendar_scheduled_date_idx ON public.marketing_calendar USING btree (scheduled_date);

CREATE INDEX marketing_calendar_status_idx ON public.marketing_calendar USING btree (status);

CREATE INDEX orders_delivery_time_idx ON public.orders USING btree (delivery_time) WHERE (delivery_time IS NOT NULL);

CREATE UNIQUE INDEX orders_delivery_token_idx ON public.orders USING btree (delivery_token) WHERE (delivery_token IS NOT NULL);

CREATE INDEX orders_group_code_idx ON public.orders USING btree (group_code) WHERE (group_code IS NOT NULL);

CREATE UNIQUE INDEX orders_payment_id_unique ON public.orders USING btree (payment_id) WHERE (payment_id IS NOT NULL);

CREATE INDEX orders_receipt_hash_idx ON public.orders USING btree (receipt_hash) WHERE (receipt_hash IS NOT NULL);

CREATE INDEX orders_receipt_op_number_idx ON public.orders USING btree (receipt_op_number) WHERE (receipt_op_number IS NOT NULL);

CREATE INDEX orders_recurring_id_idx ON public.orders USING btree (recurring_id) WHERE (recurring_id IS NOT NULL);

CREATE INDEX orders_status_changed_at_idx ON public.orders USING btree (status, status_changed_at);

CREATE INDEX pending_charges_contact_phone_pending_idx ON public.pending_charges USING btree (contact_phone) WHERE (status = 'pending'::text);

CREATE INDEX pending_charges_phone_pending_idx ON public.pending_charges USING btree (customer_phone) WHERE (status = 'pending'::text);

CREATE INDEX pending_charges_status_expires_idx ON public.pending_charges USING btree (status, expires_at);

CREATE INDEX pending_weekly_plans_buyer_status_idx ON public.pending_weekly_plans USING btree (buyer_phone, status);

CREATE INDEX production_recipes_code_idx ON public.production_recipes USING btree (recipe_code, id DESC);

CREATE INDEX promo_code_redemptions_code_idx ON public.promo_code_redemptions USING btree (code);

CREATE UNIQUE INDEX promo_code_redemptions_promo_phone_key ON public.promo_code_redemptions USING btree (promo_code_id, phone);

CREATE INDEX recurring_orders_activas ON public.recurring_orders USING btree (weekday, slot) WHERE active;

CREATE UNIQUE INDEX recurring_orders_unica ON public.recurring_orders USING btree (customer_phone, weekday, slot) WHERE active;

CREATE INDEX restock_notify_requests_sig_idx ON public.restock_notify_requests USING btree (sig_id);

CREATE UNIQUE INDEX uq_order_problems_abierto ON public.order_problems USING btree (order_id) WHERE (resolved_at IS NULL);

CREATE UNIQUE INDEX uq_zone_waitlist_pendiente ON public.zone_waitlist USING btree (customer_phone, district) WHERE (notified_at IS NULL);

CREATE UNIQUE INDEX waitlist_signups_phone_key ON public.waitlist_signups USING btree (phone);

CREATE OR REPLACE FUNCTION public.add_gifted_credit(p_to_phone text, p_amount numeric)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_to numeric;
begin
  update public.customers set credit_balance = coalesce(credit_balance, 0) + p_amount
    where phone = p_to_phone
    returning credit_balance into v_to;
  if v_to is null then
    raise exception 'customer_not_found';
  end if;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.adjust_credit_balance(p_phone text, p_delta numeric)
 RETURNS numeric
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_new numeric;
begin
  update public.customers set credit_balance = credit_balance + p_delta
  where phone = p_phone and credit_balance + p_delta >= 0
  returning credit_balance into v_new;
  if v_new is null then
    raise exception 'insufficient_balance';
  end if;
  insert into public.credit_ledger (customer_phone, delta, reason, related_phone)
  values (p_phone, p_delta, 'admin_adjust', null);
  return v_new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.admin_adjust_credit(p_phone text, p_delta numeric)
 RETURNS customers
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_row customers;
begin
  update public.customers
  set credit_balance = coalesce(credit_balance, 0) + p_delta
  where phone = p_phone
    and coalesce(credit_balance, 0) + p_delta >= 0
  returning * into v_row;

  if v_row is null then
    if not exists (select 1 from public.customers where phone = p_phone) then
      raise exception 'customer_not_found';
    else
      raise exception 'insufficient_balance';
    end if;
  end if;

  return v_row;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.aplicar_pedido_a_la_cuenta(p_cuenta jsonb, p_ref text, p_rangos jsonb DEFAULT '[]'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_antes customers;
  v_cli customers;
  v_bono boolean := false;
  v_rango text;
  v_phone text := p_cuenta->>'phone';
  v_credito numeric := coalesce((p_cuenta->>'credit_delta')::numeric, 0);
  v_invita text := nullif(p_cuenta->>'referrer_phone', '');
begin
  select * into v_antes from public.customers where phone = v_phone for update;
  if not found then
    raise exception 'customer_not_found';
  end if;
  -- Quien invitó puede haber borrado su cuenta: sin ella no hay a quién darle el bono, y
  -- anotarlo rompería la clave foránea del historial y con ella el pedido entero.
  if v_invita is not null and not exists (select 1 from public.customers where phone = v_invita) then
    v_invita := null;
  end if;
  v_cli := public.finalize_order_customer_update(
    v_phone,
    coalesce((p_cuenta->>'points_delta')::int, 0),
    v_credito,
    1,
    p_cuenta->>'last_address',
    coalesce((p_cuenta->>'redeemed_delta')::int, 0),
    v_invita,
    case when v_invita is null then 0 else coalesce((p_cuenta->>'referral_bonus')::int, 0) end,
    case when v_invita is null then 0 else (p_cuenta->>'referrer_bonus')::int end
  );
  v_bono := coalesce(v_cli.referral_bonus_granted, false) and not coalesce(v_antes.referral_bonus_granted, false);
  select r->>'name' into v_rango
    from jsonb_array_elements(p_rangos) r
   where (r->>'min')::int <= v_cli.total_orders
   order by (r->>'min')::int desc
   limit 1;

  insert into public.transactions (customer_phone, type, points, description, order_ref, confirmed)
  values (v_phone, 'earn_confirmed', coalesce((p_cuenta->>'base_points')::int, 0), p_cuenta->>'descripcion', p_ref, true);

  if v_credito <> 0 then
    insert into public.credit_ledger (customer_phone, delta, reason)
    values (v_phone, v_credito, 'Pedido pagado con crédito (' || p_ref || ')');
  end if;

  if p_cuenta->>'reward_label' is not null then
    insert into public.transactions (customer_phone, type, points, description, order_ref, confirmed)
    values (v_phone, 'redeem', -(p_cuenta->>'reward_pts')::int,
            (p_cuenta->>'reward_label') || ' canjeado en pedido ' || p_ref, p_ref, true);
  end if;

  if v_bono then
    insert into public.transactions (customer_phone, type, points, description, confirmed)
    values (v_phone, 'earn_confirmed', (p_cuenta->>'referral_bonus')::int, 'Bono por referido', true);
    insert into public.transactions (customer_phone, type, points, description, confirmed)
    values (v_invita, 'earn_confirmed',
            coalesce((p_cuenta->>'referrer_bonus')::int, (p_cuenta->>'referral_bonus')::int),
            'Sándwich gratis por invitar a ' || coalesce(p_cuenta->>'nombre', ''), true);
  end if;

  return jsonb_build_object('customer', to_jsonb(v_cli), 'bono_referido', v_bono,
                            'pedidos_antes', v_antes.total_orders, 'rango', v_rango);
end;
$function$
;

CREATE OR REPLACE FUNCTION public.check_rate_limit(p_key text, p_limit integer, p_window_minutes integer)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_count int; v_window_start timestamptz;
begin
  insert into public.rate_limits (key, count, window_start)
  values (p_key, 1, now())
  on conflict (key) do update
    set count = case when rate_limits.window_start <= now() - (p_window_minutes || ' minutes')::interval
                      then 1
                      else rate_limits.count + 1 end,
        window_start = case when rate_limits.window_start <= now() - (p_window_minutes || ' minutes')::interval
                             then now()
                             else rate_limits.window_start end
  returning count into v_count;

  return v_count <= p_limit;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.claim_discovery_challenge(p_phone text, p_month text, p_bonus integer)
 RETURNS SETOF customers
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  return query
  update public.customers
  set discovery_claimed_month = p_month, points = points + p_bonus
  where phone = p_phone and (discovery_claimed_month is distinct from p_month)
  returning *;

  if not found then
    raise exception 'already_claimed';
  end if;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.claim_monthly_challenge(p_phone text, p_month text, p_bonus integer)
 RETURNS SETOF customers
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  return query
  update public.customers
  set challenge_claimed_month = p_month, points = points + p_bonus
  where phone = p_phone and (challenge_claimed_month is distinct from p_month)
  returning *;

  if not found then
    raise exception 'already_claimed';
  end if;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits()
 RETURNS void
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  delete from public.rate_limits where window_start < now() - interval '1 day';
$function$
;

CREATE OR REPLACE FUNCTION public.confirm_weekly_plan_credit(p_plan_id uuid)
 RETURNS pending_weekly_plans
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_plan pending_weekly_plans;
begin
  update public.pending_weekly_plans
  set status = 'consumed'
  where id = p_plan_id and status in ('pending', 'charging', 'charged')
  returning * into v_plan;

  if v_plan is null then
    raise exception 'already_processed';
  end if;

  update public.customers
  set credit_balance = coalesce(credit_balance, 0) + v_plan.credit_amount
  where phone = v_plan.buyer_phone;

  if not found then
    raise exception 'customer_not_found';
  end if;

  insert into public.credit_ledger (customer_phone, delta, reason)
  values (v_plan.buyer_phone, v_plan.credit_amount, 'Plan Semanal (pagó S/' || v_plan.amount_paid || ')');

  return v_plan;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.confirmar_pago_manual(p_order_id text, p_cuenta jsonb DEFAULT NULL::jsonb, p_rangos jsonb DEFAULT '[]'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_pedido orders;
  v_cuenta jsonb;
begin
  update public.orders set payment_status = 'paid'
   where id = p_order_id and payment_status is distinct from 'paid' and status is distinct from 'CANCELADO'
  returning * into v_pedido;
  if v_pedido is null then
    return jsonb_build_object('ya_estaba', true);
  end if;
  if p_cuenta is not null and exists (select 1 from public.customers where phone = p_cuenta->>'phone') then
    v_cuenta := public.aplicar_pedido_a_la_cuenta(p_cuenta, v_pedido.ref, p_rangos);
  end if;
  return jsonb_build_object(
    'ya_estaba', false,
    'order', to_jsonb(v_pedido),
    'customer', v_cuenta->'customer',
    'bono_referido', coalesce((v_cuenta->>'bono_referido')::boolean, false)
  );
end;
$function$
;

CREATE OR REPLACE FUNCTION public.crear_pedido(p_pedido jsonb, p_cuenta jsonb DEFAULT NULL::jsonb, p_rangos jsonb DEFAULT '[]'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_cuenta jsonb;
  v_pedido orders;
begin
  if p_cuenta is not null then
    v_cuenta := public.aplicar_pedido_a_la_cuenta(p_cuenta, p_pedido->>'ref', p_rangos);
  end if;

  insert into public.orders (
    promised_from, promised_to, ref, customer_phone, contact_phone, customer_name, customer_email,
    customer_address, lat, lon, group_code, recurring_id, summary, notes, total, delivery_fee,
    delivery_km, delivery_zone, status, payment_status, payment_id, payment_method, items,
    delivery_time, redeemed_reward, redeemed_reward_pts, customer_rank
  )
  select
    x.promised_from, x.promised_to, x.ref, x.customer_phone, x.contact_phone, x.customer_name, x.customer_email,
    x.customer_address, x.lat, x.lon, x.group_code, x.recurring_id, x.summary, x.notes, x.total, x.delivery_fee,
    x.delivery_km, x.delivery_zone, 'RECIBIDO', x.payment_status, x.payment_id, x.payment_method, x.items,
    x.delivery_time, x.redeemed_reward, x.redeemed_reward_pts, v_cuenta->>'rango'
  from jsonb_populate_record(null::public.orders, p_pedido) x
  returning * into v_pedido;

  return jsonb_build_object(
    'order', to_jsonb(v_pedido),
    'customer', v_cuenta->'customer',
    'bono_referido', coalesce((v_cuenta->>'bono_referido')::boolean, false),
    'pedidos_antes', (v_cuenta->>'pedidos_antes')::int
  );
end;
$function$
;

CREATE OR REPLACE FUNCTION public.dashboard_aggregates(p_week_start timestamp with time zone, p_month_start timestamp with time zone)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  result json;
  v_prev_week_start timestamptz := p_week_start - interval '7 days';
  v_prev_month_start timestamptz := p_month_start - interval '1 month';
begin
  select json_build_object(
    'allTime', (
      select json_build_object('revenue', coalesce(sum(total), 0), 'count', count(*))
      from orders where payment_status = 'paid' and status is distinct from 'CANCELADO'
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
        and (payment_method is null or payment_method not in ('cod', 'yape', 'plin'))
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
        'FREQUENT', count(*) filter (where coalesce(points, 0) >= 200),
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
    'ratingsCount', (select count(*) from ratings),
    'referrals', (
      select json_build_object(
        'referredCustomers', count(*),
        'revenue', coalesce((
          select sum(o.total) from orders o
          where o.payment_status = 'paid' and o.status is distinct from 'CANCELADO'
            and o.customer_phone in (select phone from customers where referred_by is not null)
        ), 0)
      )
      from customers where referred_by is not null
    ),
    'weekPrev', (
      select json_build_object('revenue', coalesce(sum(total), 0), 'count', count(*))
      from orders where payment_status = 'paid' and status is distinct from 'CANCELADO'
        and created_at >= v_prev_week_start and created_at < p_week_start
    ),
    'monthPrev', (
      select json_build_object('revenue', coalesce(sum(total), 0), 'count', count(*))
      from orders where payment_status = 'paid' and status is distinct from 'CANCELADO'
        and created_at >= v_prev_month_start and created_at < p_month_start
    ),
    'peakHours', (
      select coalesce(json_agg(json_build_object('hour', hr, 'count', cnt) order by hr), '[]'::json)
      from (
        select extract(hour from created_at at time zone 'America/Lima')::int as hr, count(*) as cnt
        from orders
        where payment_status = 'paid' and status is distinct from 'CANCELADO' and created_at >= now() - interval '90 days'
        group by 1
      ) h
    ),
    'peakDays', (
      select coalesce(json_agg(json_build_object('dow', dw, 'count', cnt) order by dw), '[]'::json)
      from (
        select extract(dow from created_at at time zone 'America/Lima')::int as dw, count(*) as cnt
        from orders
        where payment_status = 'paid' and status is distinct from 'CANCELADO' and created_at >= now() - interval '90 days'
        group by 1
      ) d
    )
  ) into result;
  return result;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.db_size_bytes()
 RETURNS bigint
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$ select pg_database_size(current_database()) $function$
;

CREATE OR REPLACE FUNCTION public.dead_cron_jobs(p_min_misses integer DEFAULT 3)
 RETURNS TABLE(jobname text, action text, last_ok_at timestamp with time zone, fired_since bigint, last_error text, alerted_at timestamp with time zone)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public', 'cron'
AS $function$
  with jobs as (
    select
      j.jobid,
      j.jobname::text as jobname,
      substring(j.command from '''action''\s*,\s*''([a-z0-9-]+)''') as action
    from cron.job j
    where j.active
  )
  select
    jb.jobname,
    jb.action,
    h.last_ok_at,
    count(d.*) filter (where d.status = 'succeeded') as fired_since,
    h.last_error,
    h.alerted_at
  from jobs jb
  left join public.cron_heartbeats h on h.action = jb.action
  left join cron.job_run_details d
    on d.jobid = jb.jobid
   and d.start_time > coalesce(h.last_ok_at, now() - interval '2 days')
  where jb.action is not null
  group by jb.jobname, jb.action, h.last_ok_at, h.last_error, h.alerted_at
  having count(d.*) filter (where d.status = 'succeeded') >= p_min_misses;
$function$
;

CREATE OR REPLACE FUNCTION public.error_spike(p_min_errors integer DEFAULT 10, p_factor numeric DEFAULT 4)
 RETURNS TABLE(last_hour bigint, baseline_per_hour numeric)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  with h as (
    select count(*)::bigint as n from public.debug_logs where created_at > now() - interval '1 hour'
  ), b as (
    select count(*)::numeric / (24 * 7) as per_hour
    from public.debug_logs
    where created_at > now() - interval '7 days' and created_at <= now() - interval '1 hour'
  )
  select h.n, round(b.per_hour, 2)
  from h, b
  where h.n >= p_min_errors and h.n >= greatest(b.per_hour * p_factor, p_min_errors);
$function$
;

CREATE OR REPLACE FUNCTION public.finalize_order_customer_update(p_phone text, p_points_delta integer, p_credit_delta numeric, p_total_orders_delta integer, p_last_address text, p_total_redeemed_delta integer, p_referrer_phone text DEFAULT NULL::text, p_referral_bonus integer DEFAULT 0, p_referrer_bonus integer DEFAULT NULL::integer)
 RETURNS customers
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_row customers;
  v_already_granted boolean;
  v_bonus_if_referral int;
  v_referrer_bonus int;
begin
  select referral_bonus_granted into v_already_granted from public.customers where phone = p_phone for update;
  if not found then
    raise exception 'customer_not_found';
  end if;

  -- Antes el gate era "total_orders previo = 0" (proxy de "primer pedido") — se
  -- reemplaza por un flag monotónico que nunca se revierte, para que una
  -- autocancelación (que sí resta total_orders) no vuelva a habilitar el bono.
  v_bonus_if_referral := case when p_referrer_phone is not null and not coalesce(v_already_granted, false) then p_referral_bonus else 0 end;
  -- Sin p_referrer_bonus explícito, se comporta igual que antes (mismo monto a ambos).
  v_referrer_bonus := coalesce(p_referrer_bonus, p_referral_bonus);

  update public.customers
  set points = points + p_points_delta + v_bonus_if_referral,
      credit_balance = coalesce(credit_balance, 0) + p_credit_delta,
      total_orders = total_orders + p_total_orders_delta,
      last_address = coalesce(p_last_address, last_address),
      total_redeemed = total_redeemed + p_total_redeemed_delta,
      referral_bonus_granted = referral_bonus_granted or (v_bonus_if_referral > 0)
  where phone = p_phone
    and points + p_points_delta + v_bonus_if_referral >= 0
    and coalesce(credit_balance, 0) + p_credit_delta >= 0
  returning * into v_row;

  if v_row is null then
    raise exception 'insufficient_balance';
  end if;

  if v_bonus_if_referral > 0 then
    update public.customers
    set points = points + v_referrer_bonus, total_referrals = total_referrals + 1
    where phone = p_referrer_phone;
  end if;

  return v_row;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.forbid_update_delete()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  raise exception 'La tabla % es append-only: publica una fila nueva en vez de modificar la existente.', tg_table_name;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.gift_credit(p_from text, p_to text, p_amount numeric)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  update public.customers set credit_balance = credit_balance - p_amount
  where phone = p_from and credit_balance >= p_amount;
  if not found then
    raise exception 'insufficient_balance';
  end if;
  update public.customers set credit_balance = credit_balance + p_amount where phone = p_to;
  insert into public.credit_ledger (customer_phone, delta, reason, related_phone)
  values (p_from, -p_amount, 'Regalo enviado', p_to),
         (p_to, p_amount, 'Regalo recibido', p_from);
end;
$function$
;

CREATE OR REPLACE FUNCTION public.grant_referral_milestone(p_phone text, p_tier integer, p_points integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.hash_pin(plain text)
 RETURNS text
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
  select extensions.crypt(plain, extensions.gen_salt('bf'));
$function$
;

CREATE OR REPLACE FUNCTION public.increment_customer_points(p_phone text, p_delta integer)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_points int;
begin
  update public.customers
  set points = points + p_delta
  where phone = p_phone and points + p_delta >= 0
  returning points into v_points;
  if v_points is null then
    if exists (select 1 from public.customers where phone = p_phone) then
      raise exception 'insufficient_points';
    else
      raise exception 'customer_not_found';
    end if;
  end if;
  return v_points;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.issue_login_code(p_email text, p_code text, p_ttl_minutes integer, p_cooldown_seconds integer)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
declare v_email text := lower(btrim(p_email)); v_last timestamptz;
begin
  select sent_at into v_last from public.login_codes where email = v_email;
  if v_last is not null and v_last > now() - make_interval(secs => p_cooldown_seconds) then
    return false;
  end if;
  insert into public.login_codes (email, code_hash, expires_at, attempts, sent_at)
  values (v_email, extensions.crypt(p_code, extensions.gen_salt('bf')),
          now() + make_interval(mins => p_ttl_minutes), 0, now())
  on conflict (email) do update
    set code_hash  = excluded.code_hash,
        expires_at = excluded.expires_at,
        attempts   = 0,
        sent_at    = now();
  return true;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.login_lockout_remaining_minutes(p_phone text)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_locked_until timestamptz;
begin
  select locked_until into v_locked_until from public.login_attempts where phone = p_phone;
  if v_locked_until is null or v_locked_until <= now() then
    return null;
  end if;
  return ceil(extract(epoch from (v_locked_until - now())) / 60);
end;
$function$
;

CREATE OR REPLACE FUNCTION public.mark_cron_alerted(p_action text)
 RETURNS void
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  insert into public.cron_heartbeats (action, alerted_at)
  values (p_action, now())
  on conflict (action) do update set alerted_at = now();
$function$
;

CREATE OR REPLACE FUNCTION public.record_cron_heartbeat(p_action text, p_ok boolean, p_error text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  insert into public.cron_heartbeats as h (action, last_ok_at, last_error_at, last_error, ok_runs, error_runs)
  values (
    p_action,
    case when p_ok then now() end,
    case when p_ok then null else now() end,
    case when p_ok then null else left(p_error, 400) end,
    case when p_ok then 1 else 0 end,
    case when p_ok then 0 else 1 end
  )
  on conflict (action) do update set
    last_ok_at    = case when p_ok then now()           else h.last_ok_at end,
    last_error_at = case when p_ok then h.last_error_at else now() end,
    last_error    = case when p_ok then h.last_error    else left(p_error, 400) end,
    ok_runs       = h.ok_runs    + case when p_ok then 1 else 0 end,
    error_runs    = h.error_runs + case when p_ok then 0 else 1 end,
    alerted_at    = case when p_ok then null else h.alerted_at end;
$function$
;

CREATE OR REPLACE FUNCTION public.redeem_points_for_gift_credit(p_from text, p_to text, p_points integer, p_credit_amount numeric)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  update public.customers set points = points - p_points
  where phone = p_from and points >= p_points;
  if not found then
    raise exception 'insufficient_points';
  end if;
  update public.customers set credit_balance = credit_balance + p_credit_amount where phone = p_to;
  insert into public.credit_ledger (customer_phone, delta, reason, related_phone)
  values (p_to, p_credit_amount, 'Tarjeta de regalo recibida', p_from);
end;
$function$
;

CREATE OR REPLACE FUNCTION public.redeem_promo_code(p_promo_id uuid, p_phone text, p_order_ref text, p_discount numeric)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_max_uses integer;
  v_uses_count integer;
  v_code text;
begin
  select max_uses, uses_count, code into v_max_uses, v_uses_count, v_code
  from promo_codes
  where id = p_promo_id
  for update;

  if not found then
    raise exception 'promo_code_not_found';
  end if;

  if v_max_uses is not null and v_uses_count >= v_max_uses then
    raise exception 'promo_code_exhausted';
  end if;

  update promo_codes set uses_count = uses_count + 1 where id = p_promo_id;

  insert into promo_code_redemptions (promo_code_id, code, order_ref, phone, discount_applied)
  values (p_promo_id, v_code, p_order_ref, p_phone, p_discount);
end;
$function$
;

CREATE OR REPLACE FUNCTION public.register_login_failure(p_phone text, p_max_attempts integer, p_lockout_minutes integer)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_count int;
begin
  insert into public.login_attempts (phone, failed_count, updated_at)
  values (p_phone, 1, now())
  on conflict (phone) do update
    set failed_count = login_attempts.failed_count + 1,
        updated_at = now()
  returning failed_count into v_count;

  if v_count >= p_max_attempts then
    update public.login_attempts
    set locked_until = now() + (p_lockout_minutes || ' minutes')::interval,
        failed_count = 0
    where phone = p_phone;
  end if;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.release_promo_redemption(p_promo_id uuid, p_phone text, p_order_ref text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.reponer_tanda(p_items jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  it jsonb;
  v_code text;
  v_add int;
  v_to int;
  out jsonb := '[]'::jsonb;
begin
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'reponer_tanda: no hay insumos';
  end if;
  for it in select * from jsonb_array_elements(p_items) loop
    v_code := nullif(trim(it->>'code'), '');
    v_add := (it->>'add')::int;
    if v_code is null then raise exception 'reponer_tanda: falta el código de un insumo'; end if;
    -- Solo suma: bajar un número es la edición normal de stock, que fija el valor exacto.
    if v_add is null or v_add <= 0 then raise exception 'reponer_tanda: la cantidad de % debe ser mayor a 0', v_code; end if;
    insert into public.inventory as inv (product_code, product_name, stock_qty, in_stock, batch_cooked_at)
    values (v_code, nullif(trim(it->>'name'), ''), v_add, true, now())
    on conflict (product_code) do update
      set stock_qty = coalesce(inv.stock_qty, 0) + v_add,
          in_stock = true,
          batch_cooked_at = now()
    returning inv.stock_qty into v_to;
    out := out || jsonb_build_array(jsonb_build_object('code', v_code, 'from', v_to - v_add, 'to', v_to));
  end loop;
  return out;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.reserve_inventory(p_codes text[], p_qtys integer[])
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  i int;
  v_stock int;
  v_in_stock boolean;
begin
  if p_codes is null or array_length(p_codes, 1) is null then
    return;
  end if;
  for i in 1..array_length(p_codes, 1) loop
    select stock_qty, in_stock into v_stock, v_in_stock
    from public.inventory where product_code = p_codes[i] for update;
    -- Un "no" explícito del dueño manda sobre cualquier cantidad.
    if v_in_stock is false then
      raise exception 'out_of_stock: %', p_codes[i];
    end if;
    if v_stock is not null and v_stock < p_qtys[i] then
      raise exception 'out_of_stock: %', p_codes[i];
    end if;
  end loop;
  for i in 1..array_length(p_codes, 1) loop
    update public.inventory
    set stock_qty = stock_qty - p_qtys[i],
        in_stock = (stock_qty - p_qtys[i]) > 0
    where product_code = p_codes[i] and stock_qty is not null;
  end loop;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.reset_login_attempts(p_phone text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  delete from public.login_attempts where phone = p_phone;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.restock_inventory(p_codes text[], p_qtys integer[])
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare i int;
begin
  if p_codes is null or array_length(p_codes, 1) is null then
    return;
  end if;
  for i in 1..array_length(p_codes, 1) loop
    update public.inventory
    set stock_qty = stock_qty + p_qtys[i],
        in_stock = ((stock_qty + p_qtys[i]) > 0 and (in_stock or stock_qty <= 0))
    where product_code = p_codes[i] and stock_qty is not null;
  end loop;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.retention_report(p_cohort_months integer DEFAULT 6, p_ingredient_cost_pct numeric DEFAULT 0.45, p_card_fee_pct numeric DEFAULT 0.05)
 RETURNS jsonb
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
with paid as (
  select customer_phone, created_at, coalesce(total, 0) as total,
         coalesce(items, '[]'::jsonb) as items, payment_method
  from orders
  where payment_status = 'paid'
    and status is distinct from 'CANCELADO'
    and customer_phone is not null
),
seqd as (
  select p.*, row_number() over (partition by customer_phone order by created_at) as seq
  from paid p
),
cust as (
  select customer_phone,
         min(created_at) as first_at,
         max(created_at) as last_at,
         count(*)::int as orders,
         sum(total) as revenue
  from paid
  group by customer_phone
),
gap2 as (
  select extract(epoch from (s.created_at - c.first_at)) / 86400.0 as days
  from seqd s join cust c on c.customer_phone = s.customer_phone
  where s.seq = 2
),
cohorts as (
  select to_char(date_trunc('month', c.first_at at time zone 'America/Lima'), 'YYYY-MM') as month,
         count(*)::int as customers,
         count(*) filter (where c.orders >= 2)::int as with_second,
         count(*) filter (where c.orders >= 3)::int as with_third,
         round(avg(c.orders)::numeric, 2) as avg_orders,
         round(sum(c.revenue)::numeric, 2) as revenue
  from cust c
  where c.first_at >= date_trunc('month', (now() at time zone 'America/Lima') - make_interval(months => greatest(p_cohort_months - 1, 0)))
  group by 1
),
active30 as (
  select distinct customer_phone from paid where created_at >= now() - interval '30 days'
),
recent as (
  select count(*)::int as orders,
         coalesce(sum(total), 0) as revenue,
         coalesce(sum(total) filter (where payment_method in ('culqi', 'card', 'tarjeta')), 0) as card_revenue,
         count(*) filter (where exists (
           select 1 from jsonb_array_elements(items) e where e->>'type' = 'side'))::int as with_drink,
         count(*) filter (where exists (
           select 1 from jsonb_array_elements(items) e where e->>'size' = '30'))::int as with_30cm,
         count(*) filter (where exists (
           select 1 from jsonb_array_elements(items) e where (e->>'doubleProt')::boolean))::int as with_double,
         count(*) filter (where exists (
           select 1 from jsonb_array_elements(items) e where (e->>'extraSauce')::boolean))::int as with_extra_sauce,
         coalesce(avg((select coalesce(sum((e->>'qty')::numeric), 0)
                       from jsonb_array_elements(items) e)), 0) as avg_units,
         -- LAS TRES PALANCAS DEL MODELO, MEDIDAS.
         -- Se cuentan UNIDADES y no pedidos: la mezcla que el modelo usa es "qué fracción
         -- de los SÁNDWICHES se armó", y un pedido puede llevar uno de cada tipo. Contarlo
         -- por pedido daría un número parecido y silenciosamente distinto.
         coalesce((select sum((e->>'qty')::numeric) from paid p2,
                   jsonb_array_elements(p2.items) e
                   where p2.created_at >= now() - interval '90 days'
                     and e->>'type' = 'byo'), 0) as byo_units,
         coalesce((select sum((e->>'qty')::numeric) from paid p2,
                   jsonb_array_elements(p2.items) e
                   where p2.created_at >= now() - interval '90 days'
                     and e->>'type' = 'sig'), 0) as sig_units
  from paid
  where created_at >= now() - interval '90 days'
),
-- Clientes CAPTADOS POR REFERIDO en la misma ventana. El modelo llama `viral` a "referidos
-- que trae cada pedido servido", así que el denominador son los pedidos, no los clientes:
-- es lo que hace comparable el número medido contra el supuesto del modelo.
referidos_recientes as (
  select count(*)::int as n
  from customers
  where referred_by is not null
    and created_at >= now() - interval '90 days'
)
select jsonb_build_object(
  'cohorts', coalesce((
    select jsonb_agg(jsonb_build_object(
      'month', month, 'customers', customers, 'withSecond', with_second, 'withThird', with_third,
      'secondPct', case when customers > 0 then round(with_second * 100.0 / customers, 1) else 0 end,
      'avgOrders', avg_orders, 'revenue', revenue
    ) order by month) from cohorts), '[]'::jsonb),
  'overall', (
    select jsonb_build_object(
      'customers', count(*)::int,
      'withSecond', count(*) filter (where orders >= 2)::int,
      -- r(1): la probabilidad real de que alguien que compró una vez vuelva a comprar.
      'repeatRatePct', case when count(*) > 0
        then round(count(*) filter (where orders >= 2) * 100.0 / count(*), 1) else 0 end,
      'avgOrders', coalesce(round(avg(orders)::numeric, 2), 0),
      'avgLifetimeRevenue', coalesce(round(avg(revenue)::numeric, 2), 0),
      -- Solo entre quienes SÍ volvieron: el número que dice cuánto vale de verdad
      -- convertir a alguien al segundo pedido.
      'avgOrdersIfReturned', coalesce((select round(avg(orders)::numeric, 2) from cust where orders >= 2), 0),
      'avgRevenueIfReturned', coalesce((select round(avg(revenue)::numeric, 2) from cust where orders >= 2), 0)
    ) from cust),
  -- Mediana (no promedio) de días entre 1er y 2do pedido: calibra la ventana real del
  -- recordatorio de bounce-back. Un promedio se dispara con un solo cliente que volvió
  -- a los 6 meses; la mediana no.
  'daysToSecond', (
    select jsonb_build_object(
      'median', coalesce(round(percentile_cont(0.5) within group (order by days)::numeric, 1), 0),
      'p75', coalesce(round(percentile_cont(0.75) within group (order by days)::numeric, 1), 0),
      'n', count(*)::int
    ) from gap2),
  'rolling30', (
    select jsonb_build_object(
      'active', (select count(*)::int from active30),
      'returning', (select count(*)::int from active30 a
                    join cust c on c.customer_phone = a.customer_phone
                    where c.first_at < now() - interval '30 days'),
      'returningPct', case when (select count(*) from active30) > 0
        then round((select count(*) from active30 a join cust c on c.customer_phone = a.customer_phone
                    where c.first_at < now() - interval '30 days') * 100.0
                   / (select count(*) from active30), 1)
        else 0 end)),
  'segments', (
    select jsonb_build_object(
      'activos', count(*) filter (where last_at >= now() - interval '30 days')::int,
      'enRiesgo', count(*) filter (where last_at < now() - interval '30 days' and last_at >= now() - interval '60 days')::int,
      'dormidos', count(*) filter (where last_at < now() - interval '60 days' and last_at >= now() - interval '90 days')::int,
      'perdidos', count(*) filter (where last_at < now() - interval '90 days')::int,
      'unaSolaCompra', count(*) filter (where orders = 1)::int
    ) from cust),
  -- Margen de contribución de los últimos 90 días. No es utilidad neta (no descuenta
  -- alquiler, servicios, publicidad ni el tiempo del dueño) — es lo que queda del ingreso
  -- después de insumos+empaque y comisión de pasarela, que es lo único atribuible pedido
  -- a pedido.
  'margin', (
    select jsonb_build_object(
      'orders', orders,
      'revenue', round(revenue, 2),
      'ingredientCost', round(revenue * p_ingredient_cost_pct, 2),
      'paymentFees', round(card_revenue * p_card_fee_pct, 2),
      'contribution', round(revenue * (1 - p_ingredient_cost_pct) - card_revenue * p_card_fee_pct, 2),
      'contributionPct', case when revenue > 0
        then round(((revenue * (1 - p_ingredient_cost_pct) - card_revenue * p_card_fee_pct) / revenue * 100)::numeric, 1)
        else 0 end,
      'perOrder', case when orders > 0
        then round((revenue * (1 - p_ingredient_cost_pct) - card_revenue * p_card_fee_pct) / orders, 2)
        else 0 end,
      'cardSharePct', case when revenue > 0 then round(card_revenue * 100.0 / revenue, 1) else 0 end
    ) from recent),
  -- Tasas de attach/upgrade: el modelo dice que el ticket no está por debajo del mercado
  -- por precio unitario sino por ÍTEMS POR PEDIDO. Estas 4 cifras son las palancas
  -- directas de ese número.
  'attach', (
    select jsonb_build_object(
      'orders', orders,
      'avgUnits', round(avg_units, 2),
      'drinkPct', case when orders > 0 then round(with_drink * 100.0 / orders, 1) else 0 end,
      'size30Pct', case when orders > 0 then round(with_30cm * 100.0 / orders, 1) else 0 end,
      'doubleProtPct', case when orders > 0 then round(with_double * 100.0 / orders, 1) else 0 end,
      'extraSaucePct', case when orders > 0 then round(with_extra_sauce * 100.0 / orders, 1) else 0 end
    ) from recent),
  -- LAS TRES PALANCAS DEL MODELO FINANCIERO, MEDIDAS CONTRA LA REALIDAD.
  --
  -- POR QUÉ EXISTE ESTE BLOQUE. `PREDICCION_V12.md` concluye que la meta de S/5,000
  -- sostenidos se decide por tres números: la mezcla Signature/ARMA EL TUYO, el attach de
  -- bebida, y los referidos por pedido. Ninguno de los tres estaba medido — el modelo los
  -- ASUME (50% / 25% / 6 por 100) y mover cualquiera unos puntos cambia la conclusión.
  --
  -- Empujar una palanca sin medirla es el defecto que este repo ya documenta en otros
  -- lados: dentro de tres meses nadie sabría cuál de los tres empujones funcionó.
  --
  -- `reliable` es la misma salvaguarda del plan de tanda y del reporte de cohortes: con
  -- pocos pedidos estos porcentajes son ruido con forma de medición. Va ARRIBA de las
  -- cifras en la pantalla, no al pie — al pie se lee después de haberles creído.
  'palancas', (
    select jsonb_build_object(
      'orders', r.orders,
      'reliable', r.orders >= 20,
      -- Mezcla: qué fracción de los sándwiches se armó en ARMA EL TUYO. Es el FRAC_BYO del
      -- modelo. Null (no 0) cuando no hay ni un sándwich: un 0 se leería como "todos son
      -- Signature", que es justo la conclusión contraria a "no hay dato".
      'byoPct', case when (r.byo_units + r.sig_units) > 0
        then round(r.byo_units * 100.0 / (r.byo_units + r.sig_units), 1) else null end,
      'sigUnits', r.sig_units,
      'byoUnits', r.byo_units,
      -- Attach de bebida: ya se calculaba en `attach`, se repite acá para que las tres
      -- palancas se lean juntas. Es la misma cifra, no una segunda fuente.
      'drinkPct', case when r.orders > 0
        then round(r.with_drink * 100.0 / r.orders, 1) else null end,
      -- Viralidad: clientes captados por referido, por cada 100 pedidos servidos. Es el
      -- `viral` del modelo multiplicado por 100.
      'referralsPer100', case when r.orders > 0
        then round(rr.n * 100.0 / r.orders, 1) else null end,
      'referredCustomers', rr.n
    ) from recent r, referidos_recientes rr),
  'params', jsonb_build_object(
    'cohortMonths', p_cohort_months,
    'ingredientCostPct', p_ingredient_cost_pct,
    'cardFeePct', p_card_fee_pct)
);
$function$
;

CREATE OR REPLACE FUNCTION public.reverse_referral_bonus(p_referred_phone text, p_referrer_phone text, p_bonus integer, p_referrer_bonus integer DEFAULT NULL::integer)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_referred_ok boolean := false;
  v_referrer_ok boolean := false;
  v_referrer_amount integer := coalesce(p_referrer_bonus, p_bonus);
begin
  -- `points >= p_bonus` en el WHERE: si no alcanza, la fila no se toca y v_referred_ok
  -- queda en false, así que el flag NO se repone.
  update public.customers
  set points = points - p_bonus
  where phone = p_referred_phone and points >= p_bonus;
  v_referred_ok := found;

  update public.customers
  set points = points - v_referrer_amount,
      total_referrals = greatest(0, total_referrals - 1)
  where phone = p_referrer_phone and points >= v_referrer_amount;
  v_referrer_ok := found;

  -- Si a alguno no le alcanzaba, igual hay que descontar lo que se pueda (el pedido se
  -- canceló de verdad), pero SIN reabrir la puerta.
  if not v_referred_ok then
    update public.customers set points = greatest(0, points - p_bonus)
    where phone = p_referred_phone;
  end if;
  if not v_referrer_ok then
    update public.customers
    set points = greatest(0, points - v_referrer_amount),
        total_referrals = greatest(0, total_referrals - 1)
    where phone = p_referrer_phone;
  end if;

  if v_referred_ok and v_referrer_ok then
    update public.customers set referral_bonus_granted = false
    where phone = p_referred_phone;
  end if;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.table_sizes(p_limit integer DEFAULT 10)
 RETURNS TABLE(table_name text, total_bytes bigint, row_estimate bigint)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select c.relname::text,
         pg_total_relation_size(c.oid)::bigint,
         c.reltuples::bigint
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'r'
  order by pg_total_relation_size(c.oid) desc
  limit greatest(1, least(coalesce(p_limit, 10), 50))
$function$
;

CREATE OR REPLACE FUNCTION public.verify_cron_secret(p_secret text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public, vault, extensions'
AS $function$
declare
  v_expected text;
begin
  select decrypted_secret into v_expected
  from vault.decrypted_secrets where name = 'sndwch_cron_secret';
  if v_expected is null or p_secret is null then
    return false;
  end if;
  -- Comparar los digest de longitud fija en vez de los textos: mismo costo siempre.
  return extensions.digest(p_secret, 'sha256') = extensions.digest(v_expected, 'sha256');
end;
$function$
;

CREATE OR REPLACE FUNCTION public.verify_login_code(p_email text, p_code text, p_max_attempts integer)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
declare v_email text := lower(btrim(p_email)); v_row public.login_codes%rowtype;
begin
  select * into v_row from public.login_codes where email = v_email for update;
  if not found then return false; end if;
  if v_row.expires_at < now() or v_row.attempts >= p_max_attempts then
    delete from public.login_codes where email = v_email;
    return false;
  end if;
  if v_row.code_hash = extensions.crypt(p_code, v_row.code_hash) then
    delete from public.login_codes where email = v_email;
    return true;
  end if;
  update public.login_codes set attempts = attempts + 1 where email = v_email;
  return false;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.verify_pin(p_phone text, plain text)
 RETURNS boolean
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
  select exists(
    select 1 from public.customers
    where phone = p_phone and pin = extensions.crypt(plain, pin)
  );
$function$
;

CREATE OR REPLACE FUNCTION public.vincular_pedido_de_invitado(p_ref text, p_phone text, p_cuenta jsonb, p_rangos jsonb DEFAULT '[]'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_ord public.orders;
begin
  -- El filtro `customer_phone is null` es el reclamo: dos registros a la vez contra el mismo
  -- pedido, y solo el primero afecta una fila.
  update public.orders set customer_phone = p_phone
   where ref = p_ref and customer_phone is null
  returning * into v_ord;
  if not found then
    return jsonb_build_object('vinculado', false);
  end if;
  -- Solo lo que ya se cobró da puntos. Un Yape pendiente queda vinculado y los gana cuando el
  -- dueño lo confirme (confirmar_pago_manual ya sabe a qué cuenta va).
  if v_ord.payment_status = 'paid' and v_ord.status <> 'CANCELADO' and p_cuenta is not null then
    return public.aplicar_pedido_a_la_cuenta(p_cuenta || jsonb_build_object('phone', p_phone), v_ord.ref, p_rangos)
           || jsonb_build_object('vinculado', true, 'acreditado', true);
  end if;
  return jsonb_build_object('vinculado', true, 'acreditado', false);
end;
$function$
;

revoke all on function public.add_gifted_credit(p_to_phone text, p_amount numeric) from public; grant execute on function public.add_gifted_credit(p_to_phone text, p_amount numeric) to postgres; grant execute on function public.add_gifted_credit(p_to_phone text, p_amount numeric) to service_role;

revoke all on function public.adjust_credit_balance(p_phone text, p_delta numeric) from public; grant execute on function public.adjust_credit_balance(p_phone text, p_delta numeric) to postgres; grant execute on function public.adjust_credit_balance(p_phone text, p_delta numeric) to service_role;

revoke all on function public.admin_adjust_credit(p_phone text, p_delta numeric) from public; grant execute on function public.admin_adjust_credit(p_phone text, p_delta numeric) to postgres; grant execute on function public.admin_adjust_credit(p_phone text, p_delta numeric) to service_role;

revoke all on function public.aplicar_pedido_a_la_cuenta(p_cuenta jsonb, p_ref text, p_rangos jsonb) from public; grant execute on function public.aplicar_pedido_a_la_cuenta(p_cuenta jsonb, p_ref text, p_rangos jsonb) to postgres; grant execute on function public.aplicar_pedido_a_la_cuenta(p_cuenta jsonb, p_ref text, p_rangos jsonb) to service_role;

revoke all on function public.check_rate_limit(p_key text, p_limit integer, p_window_minutes integer) from public; grant execute on function public.check_rate_limit(p_key text, p_limit integer, p_window_minutes integer) to postgres; grant execute on function public.check_rate_limit(p_key text, p_limit integer, p_window_minutes integer) to service_role;

revoke all on function public.claim_discovery_challenge(p_phone text, p_month text, p_bonus integer) from public; grant execute on function public.claim_discovery_challenge(p_phone text, p_month text, p_bonus integer) to postgres; grant execute on function public.claim_discovery_challenge(p_phone text, p_month text, p_bonus integer) to service_role;

revoke all on function public.claim_monthly_challenge(p_phone text, p_month text, p_bonus integer) from public; grant execute on function public.claim_monthly_challenge(p_phone text, p_month text, p_bonus integer) to postgres; grant execute on function public.claim_monthly_challenge(p_phone text, p_month text, p_bonus integer) to service_role;

revoke all on function public.cleanup_old_rate_limits() from public; grant execute on function public.cleanup_old_rate_limits() to postgres; grant execute on function public.cleanup_old_rate_limits() to service_role;

revoke all on function public.confirm_weekly_plan_credit(p_plan_id uuid) from public; grant execute on function public.confirm_weekly_plan_credit(p_plan_id uuid) to postgres; grant execute on function public.confirm_weekly_plan_credit(p_plan_id uuid) to service_role;

revoke all on function public.confirmar_pago_manual(p_order_id text, p_cuenta jsonb, p_rangos jsonb) from public; grant execute on function public.confirmar_pago_manual(p_order_id text, p_cuenta jsonb, p_rangos jsonb) to postgres; grant execute on function public.confirmar_pago_manual(p_order_id text, p_cuenta jsonb, p_rangos jsonb) to service_role;

revoke all on function public.crear_pedido(p_pedido jsonb, p_cuenta jsonb, p_rangos jsonb) from public; grant execute on function public.crear_pedido(p_pedido jsonb, p_cuenta jsonb, p_rangos jsonb) to postgres; grant execute on function public.crear_pedido(p_pedido jsonb, p_cuenta jsonb, p_rangos jsonb) to service_role;

revoke all on function public.dashboard_aggregates(p_week_start timestamp with time zone, p_month_start timestamp with time zone) from public; grant execute on function public.dashboard_aggregates(p_week_start timestamp with time zone, p_month_start timestamp with time zone) to postgres; grant execute on function public.dashboard_aggregates(p_week_start timestamp with time zone, p_month_start timestamp with time zone) to service_role;

revoke all on function public.db_size_bytes() from public; grant execute on function public.db_size_bytes() to postgres; grant execute on function public.db_size_bytes() to service_role;

revoke all on function public.dead_cron_jobs(p_min_misses integer) from public; grant execute on function public.dead_cron_jobs(p_min_misses integer) to postgres; grant execute on function public.dead_cron_jobs(p_min_misses integer) to service_role;

revoke all on function public.error_spike(p_min_errors integer, p_factor numeric) from public; grant execute on function public.error_spike(p_min_errors integer, p_factor numeric) to postgres; grant execute on function public.error_spike(p_min_errors integer, p_factor numeric) to service_role;

revoke all on function public.finalize_order_customer_update(p_phone text, p_points_delta integer, p_credit_delta numeric, p_total_orders_delta integer, p_last_address text, p_total_redeemed_delta integer, p_referrer_phone text, p_referral_bonus integer, p_referrer_bonus integer) from public; grant execute on function public.finalize_order_customer_update(p_phone text, p_points_delta integer, p_credit_delta numeric, p_total_orders_delta integer, p_last_address text, p_total_redeemed_delta integer, p_referrer_phone text, p_referral_bonus integer, p_referrer_bonus integer) to postgres; grant execute on function public.finalize_order_customer_update(p_phone text, p_points_delta integer, p_credit_delta numeric, p_total_orders_delta integer, p_last_address text, p_total_redeemed_delta integer, p_referrer_phone text, p_referral_bonus integer, p_referrer_bonus integer) to service_role;

revoke all on function public.forbid_update_delete() from public; grant execute on function public.forbid_update_delete() to postgres; grant execute on function public.forbid_update_delete() to service_role;

revoke all on function public.gift_credit(p_from text, p_to text, p_amount numeric) from public; grant execute on function public.gift_credit(p_from text, p_to text, p_amount numeric) to postgres; grant execute on function public.gift_credit(p_from text, p_to text, p_amount numeric) to service_role;

revoke all on function public.grant_referral_milestone(p_phone text, p_tier integer, p_points integer) from public; grant execute on function public.grant_referral_milestone(p_phone text, p_tier integer, p_points integer) to postgres; grant execute on function public.grant_referral_milestone(p_phone text, p_tier integer, p_points integer) to service_role;

revoke all on function public.hash_pin(plain text) from public; grant execute on function public.hash_pin(plain text) to postgres; grant execute on function public.hash_pin(plain text) to service_role;

revoke all on function public.increment_customer_points(p_phone text, p_delta integer) from public; grant execute on function public.increment_customer_points(p_phone text, p_delta integer) to postgres; grant execute on function public.increment_customer_points(p_phone text, p_delta integer) to service_role;

revoke all on function public.issue_login_code(p_email text, p_code text, p_ttl_minutes integer, p_cooldown_seconds integer) from public; grant execute on function public.issue_login_code(p_email text, p_code text, p_ttl_minutes integer, p_cooldown_seconds integer) to postgres; grant execute on function public.issue_login_code(p_email text, p_code text, p_ttl_minutes integer, p_cooldown_seconds integer) to service_role;

revoke all on function public.login_lockout_remaining_minutes(p_phone text) from public; grant execute on function public.login_lockout_remaining_minutes(p_phone text) to postgres; grant execute on function public.login_lockout_remaining_minutes(p_phone text) to service_role;

revoke all on function public.mark_cron_alerted(p_action text) from public; grant execute on function public.mark_cron_alerted(p_action text) to postgres; grant execute on function public.mark_cron_alerted(p_action text) to service_role;

revoke all on function public.record_cron_heartbeat(p_action text, p_ok boolean, p_error text) from public; grant execute on function public.record_cron_heartbeat(p_action text, p_ok boolean, p_error text) to postgres; grant execute on function public.record_cron_heartbeat(p_action text, p_ok boolean, p_error text) to service_role;

revoke all on function public.redeem_points_for_gift_credit(p_from text, p_to text, p_points integer, p_credit_amount numeric) from public; grant execute on function public.redeem_points_for_gift_credit(p_from text, p_to text, p_points integer, p_credit_amount numeric) to postgres; grant execute on function public.redeem_points_for_gift_credit(p_from text, p_to text, p_points integer, p_credit_amount numeric) to service_role;

revoke all on function public.redeem_promo_code(p_promo_id uuid, p_phone text, p_order_ref text, p_discount numeric) from public; grant execute on function public.redeem_promo_code(p_promo_id uuid, p_phone text, p_order_ref text, p_discount numeric) to postgres; grant execute on function public.redeem_promo_code(p_promo_id uuid, p_phone text, p_order_ref text, p_discount numeric) to service_role;

revoke all on function public.register_login_failure(p_phone text, p_max_attempts integer, p_lockout_minutes integer) from public; grant execute on function public.register_login_failure(p_phone text, p_max_attempts integer, p_lockout_minutes integer) to postgres; grant execute on function public.register_login_failure(p_phone text, p_max_attempts integer, p_lockout_minutes integer) to service_role;

revoke all on function public.release_promo_redemption(p_promo_id uuid, p_phone text, p_order_ref text) from public; grant execute on function public.release_promo_redemption(p_promo_id uuid, p_phone text, p_order_ref text) to postgres; grant execute on function public.release_promo_redemption(p_promo_id uuid, p_phone text, p_order_ref text) to service_role;

revoke all on function public.reponer_tanda(p_items jsonb) from public; grant execute on function public.reponer_tanda(p_items jsonb) to postgres; grant execute on function public.reponer_tanda(p_items jsonb) to service_role;

revoke all on function public.reserve_inventory(p_codes text[], p_qtys integer[]) from public; grant execute on function public.reserve_inventory(p_codes text[], p_qtys integer[]) to postgres; grant execute on function public.reserve_inventory(p_codes text[], p_qtys integer[]) to service_role;

revoke all on function public.reset_login_attempts(p_phone text) from public; grant execute on function public.reset_login_attempts(p_phone text) to postgres; grant execute on function public.reset_login_attempts(p_phone text) to service_role;

revoke all on function public.restock_inventory(p_codes text[], p_qtys integer[]) from public; grant execute on function public.restock_inventory(p_codes text[], p_qtys integer[]) to postgres; grant execute on function public.restock_inventory(p_codes text[], p_qtys integer[]) to service_role;

revoke all on function public.retention_report(p_cohort_months integer, p_ingredient_cost_pct numeric, p_card_fee_pct numeric) from public; grant execute on function public.retention_report(p_cohort_months integer, p_ingredient_cost_pct numeric, p_card_fee_pct numeric) to postgres; grant execute on function public.retention_report(p_cohort_months integer, p_ingredient_cost_pct numeric, p_card_fee_pct numeric) to service_role;

revoke all on function public.reverse_referral_bonus(p_referred_phone text, p_referrer_phone text, p_bonus integer, p_referrer_bonus integer) from public; grant execute on function public.reverse_referral_bonus(p_referred_phone text, p_referrer_phone text, p_bonus integer, p_referrer_bonus integer) to postgres; grant execute on function public.reverse_referral_bonus(p_referred_phone text, p_referrer_phone text, p_bonus integer, p_referrer_bonus integer) to service_role;

revoke all on function public.table_sizes(p_limit integer) from public; grant execute on function public.table_sizes(p_limit integer) to postgres; grant execute on function public.table_sizes(p_limit integer) to service_role;

revoke all on function public.verify_cron_secret(p_secret text) from public; grant execute on function public.verify_cron_secret(p_secret text) to postgres; grant execute on function public.verify_cron_secret(p_secret text) to service_role;

revoke all on function public.verify_login_code(p_email text, p_code text, p_max_attempts integer) from public; grant execute on function public.verify_login_code(p_email text, p_code text, p_max_attempts integer) to postgres; grant execute on function public.verify_login_code(p_email text, p_code text, p_max_attempts integer) to service_role;

revoke all on function public.verify_pin(p_phone text, plain text) from public; grant execute on function public.verify_pin(p_phone text, plain text) to postgres; grant execute on function public.verify_pin(p_phone text, plain text) to service_role;

revoke all on function public.vincular_pedido_de_invitado(p_ref text, p_phone text, p_cuenta jsonb, p_rangos jsonb) from public; grant execute on function public.vincular_pedido_de_invitado(p_ref text, p_phone text, p_cuenta jsonb, p_rangos jsonb) to postgres; grant execute on function public.vincular_pedido_de_invitado(p_ref text, p_phone text, p_cuenta jsonb, p_rangos jsonb) to service_role;

CREATE TRIGGER catalog_items_append_only BEFORE DELETE OR UPDATE ON public.catalog_items FOR EACH ROW EXECUTE FUNCTION forbid_update_delete();

CREATE TRIGGER secret_signature_append_only BEFORE DELETE OR UPDATE ON public.secret_signature FOR EACH ROW EXECUTE FUNCTION forbid_update_delete();

alter table public.ad_spend enable row level security;

alter table public.admin_accounts enable row level security;

alter table public.admin_action_log enable row level security;

alter table public.app_settings enable row level security;

alter table public.cart_snapshots enable row level security;

alter table public.catalog_items enable row level security;

alter table public.catalog_prices enable row level security;

alter table public.complaints enable row level security;

alter table public.content_uploads enable row level security;

alter table public.credit_ledger enable row level security;

alter table public.cron_heartbeats enable row level security;

alter table public.customers enable row level security;

alter table public.debug_logs enable row level security;

alter table public.deleted_account_identities enable row level security;

alter table public.favorites enable row level security;

alter table public.group_order_items enable row level security;

alter table public.group_orders enable row level security;

alter table public.ingredient_purchases enable row level security;

alter table public.inventory enable row level security;

alter table public.login_attempts enable row level security;

alter table public.login_codes enable row level security;

alter table public.marketing_calendar enable row level security;

alter table public.marketing_touches enable row level security;

alter table public.order_problems enable row level security;

alter table public.orders enable row level security;

alter table public.pending_charges enable row level security;

alter table public.pending_weekly_plans enable row level security;

alter table public.production_recipes enable row level security;

alter table public.promo_code_redemptions enable row level security;

alter table public.promo_codes enable row level security;

alter table public.push_subscriptions enable row level security;

alter table public.rate_limits enable row level security;

alter table public.ratings enable row level security;

alter table public.recurring_orders enable row level security;

alter table public.restock_notify_requests enable row level security;

alter table public.saved_addresses enable row level security;

alter table public.secret_signature enable row level security;

alter table public.store_hours enable row level security;

alter table public.transactions enable row level security;

alter table public.waitlist_signups enable row level security;

alter table public.zone_waitlist enable row level security;

grant DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.ad_spend to service_role;

grant DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.admin_accounts to service_role;

grant DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.admin_action_log to service_role;

grant DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.app_settings to service_role;

grant DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.cart_snapshots to service_role;

grant DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.catalog_items to service_role;

grant DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.catalog_prices to service_role;

grant DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.complaints to service_role;

grant DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.content_uploads to service_role;

grant DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.credit_ledger to service_role;

grant DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.cron_heartbeats to service_role;

grant DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.customers to service_role;

grant DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.debug_logs to service_role;

grant DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.deleted_account_identities to service_role;

grant DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.favorites to service_role;

grant DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.group_order_items to service_role;

grant DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.group_orders to service_role;

grant DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.ingredient_purchases to service_role;

grant DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.inventory to service_role;

grant DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.login_attempts to service_role;

grant DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.login_codes to service_role;

grant DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.marketing_calendar to service_role;

grant DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.marketing_touches to service_role;

grant DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.order_problems to service_role;

grant DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.orders to service_role;

grant DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.pending_charges to service_role;

grant DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.pending_weekly_plans to service_role;

grant DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.production_recipes to service_role;

grant DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.promo_code_redemptions to service_role;

grant DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.promo_codes to service_role;

grant DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.push_subscriptions to service_role;

grant DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.rate_limits to service_role;

grant DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.ratings to service_role;

grant DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.recurring_orders to service_role;

grant DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.restock_notify_requests to service_role;

grant DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.saved_addresses to service_role;

grant DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.secret_signature to service_role;

grant DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.store_hours to service_role;

grant DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.transactions to service_role;

grant DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.waitlist_signups to service_role;

grant DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.zone_waitlist to service_role;
