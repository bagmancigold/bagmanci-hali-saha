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
alter table public.site_settings add column if not exists bank_name text not null default '';
alter table public.site_settings add column if not exists iban text not null default '';
alter table public.site_settings add column if not exists iban_holder text not null default '';

create table if not exists public.booking_requests (
  id uuid primary key default gen_random_uuid(),
  payment_token uuid not null default gen_random_uuid(),
  customer_name text not null,
  phone text not null,
  booking_date date not null,
  booking_time text not null,
  duration_hours numeric(3,1) not null default 1,
  package_name text not null,
  total_amount numeric(10,2) not null default 0,
  deposit_amount numeric(10,2) not null default 600,
  paid_amount numeric(10,2) not null default 0,
  payment_choice text not null default 'deposit' check (payment_choice in ('deposit', 'full')),
  payment_status text not null default 'pending' check (payment_status in ('pending', 'proof_submitted', 'paid', 'approved', 'rejected')),
  notes text not null default '',
  created_at timestamptz not null default now()
);

alter table public.booking_requests add column if not exists paid_amount numeric(10,2) not null default 0;
alter table public.booking_requests add column if not exists duration_hours numeric(3,1) not null default 1;
alter table public.booking_requests drop constraint if exists booking_requests_phone_format;
alter table public.booking_requests add constraint booking_requests_phone_format check (phone ~ '^0[0-9]{10}$') not valid;

create table if not exists public.subscription_requests (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  phone text not null,
  subscription_day text not null,
  subscription_time text not null,
  amount numeric(10,2) not null default 0,
  status text not null default 'pending' check (status in ('pending', 'paid', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);
alter table public.subscription_requests enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    or (auth.jwt() ->> 'email') = 'bagmanciabdullah93@gmail.com',
    false
  );
$$;

drop policy if exists "public can create subscription requests" on public.subscription_requests;
drop policy if exists "admins manage subscription requests" on public.subscription_requests;
create policy "public can create subscription requests" on public.subscription_requests for insert to anon, authenticated with check (true);
create policy "admins manage subscription requests" on public.subscription_requests for all to authenticated using (public.is_admin()) with check (public.is_admin());

alter table public.booking_requests enable row level security;
drop policy if exists "public can create booking requests" on public.booking_requests;
drop policy if exists "admins manage booking requests" on public.booking_requests;
create policy "public can create booking requests" on public.booking_requests for insert to anon, authenticated with check (true);
create policy "admins manage booking requests" on public.booking_requests for all to authenticated using (public.is_admin()) with check (public.is_admin());

create or replace function public.choose_booking_payment(p_booking_id uuid, p_payment_token uuid, p_payment_choice text)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if p_payment_choice not in ('deposit', 'full') then raise exception 'Geçersiz ödeme seçimi'; end if;
  update public.booking_requests set payment_choice = p_payment_choice where id = p_booking_id and payment_token = p_payment_token;
  return found;
end;
$$;

alter table public.site_settings enable row level security;

alter table public.profiles enable row level security;

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


create table if not exists public.match_records (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  match_date date not null,
  field_name text not null,
  duration text not null,
  video_url text not null,
  thumbnail_url text not null,
  created_at timestamptz not null default now()
);

alter table public.match_records enable row level security;
drop policy if exists "public can read match records" on public.match_records;
drop policy if exists "admins manage match records" on public.match_records;
create policy "public can read match records" on public.match_records for select to anon, authenticated using (true);
create policy "admins manage match records" on public.match_records for all to authenticated using (public.is_admin()) with check (public.is_admin());
