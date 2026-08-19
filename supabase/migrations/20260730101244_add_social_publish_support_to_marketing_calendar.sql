
alter table marketing_calendar add column if not exists image_url text;
alter table marketing_calendar add column if not exists published_ref text;

insert into storage.buckets (id, name, public)
values ('marketing-images', 'marketing-images', true)
on conflict (id) do nothing;
