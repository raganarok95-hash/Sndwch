CREATE TABLE IF NOT EXISTS push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  customer_phone text not null,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_phone ON push_subscriptions(customer_phone);
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
