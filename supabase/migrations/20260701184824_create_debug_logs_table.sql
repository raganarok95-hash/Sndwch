create table if not exists debug_logs (
  id bigint generated always as identity primary key,
  source text,
  detail jsonb,
  created_at timestamptz default now()
);
alter table debug_logs enable row level security;
create policy "allow anon insert debug_logs" on debug_logs for insert with check (true);
create policy "allow anon read debug_logs" on debug_logs for select using (true);
