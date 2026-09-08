create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  phone text not null default '',
  subscriber boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.site_settings (
  id text primary key,
  hero_image text not null default '',
  match_image text not null default '',
  updated_at timestamptz not null default now()
);

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
