create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null default '',
  full_name text not null default '',
  phone text not null default '',
  subscriber boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles add column if not exists username text not null default '';
create unique index if not exists profiles_username_unique on public.profiles (lower(username)) where username <> '';

create table if not exists public.site_settings (
  id text primary key,
  hero_image text not null default '',
  match_image text not null default '',
  background_image text not null default '',
  updated_at timestamptz not null default now()
);

alter table public.site_settings add column if not exists background_image text not null default '';

alter table public.site_settings enable row level security;

alter table public.profiles enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false);
$$;

insert into storage.buckets (id, name, public)
values ('site-assets', 'site-assets', true)
on conflict (id) do update set public = true;

drop policy if exists "public can read site assets" on storage.objects;
drop policy if exists "admins upload site assets" on storage.objects;
drop policy if exists "admins update site assets" on storage.objects;
drop policy if exists "admins delete site assets" on storage.objects;

create policy "public can read site assets" on storage.objects
for select to anon, authenticated using (bucket_id = 'site-assets');

create policy "admins upload site assets" on storage.objects
for insert to authenticated with check (bucket_id = 'site-assets' and public.is_admin());

create policy "admins update site assets" on storage.objects
for update to authenticated using (bucket_id = 'site-assets' and public.is_admin())
with check (bucket_id = 'site-assets' and public.is_admin());

create policy "admins delete site assets" on storage.objects
for delete to authenticated using (bucket_id = 'site-assets' and public.is_admin());

do $$
declare
  policy_record record;
begin
  for policy_record in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in ('profiles', 'site_settings')
  loop
    execute format('drop policy if exists %I on %I.%I', policy_record.policyname, policy_record.schemaname, policy_record.tablename);
  end loop;
end
$$;

create policy "public can read site settings" on public.site_settings
for select to anon, authenticated using (true);

create policy "admins manage site settings" on public.site_settings
for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "customers read own profile" on public.profiles
for select to authenticated using (id = auth.uid() or public.is_admin());

create policy "customers create own profile" on public.profiles
for insert to authenticated with check (id = auth.uid());

create policy "customers update own profile" on public.profiles
for update to authenticated using (id = auth.uid() or public.is_admin())
with check (id = auth.uid() or public.is_admin());

-- Run this once for your admin user after replacing the email.
-- update auth.users set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb where email = 'bagmanciabdullah93@gmail.com';
