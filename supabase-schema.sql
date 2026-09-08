create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  phone text not null default '',
  subscriber boolean not null default false,
  created_at timestamptz not null default now()
);

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

create policy "customers read own profile" on public.profiles
for select to authenticated using (id = auth.uid() or public.is_admin());

create policy "customers create own profile" on public.profiles
for insert to authenticated with check (id = auth.uid());

create policy "customers update own profile" on public.profiles
for update to authenticated using (id = auth.uid() or public.is_admin())
with check (id = auth.uid() or public.is_admin());

-- Run this once for your admin user after replacing the email.
-- update auth.users set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb where email = 'bagmanciabdullah93@gmail.com';
