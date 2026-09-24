-- MA Luxury Apartments
-- Supabase starter schema for the current App.jsx integration.
-- IMPORTANT: the current React app still uses its existing client-side PIN.
-- These policies are intentionally permissive for development/testing only.
-- Before production, move admin writes behind Supabase Auth + RLS policies.

create extension if not exists pgcrypto;

create table if not exists public.apartment_catalog (
  apartment_name text primary key,
  category text not null,
  price numeric not null default 0,
  currency text not null default 'NGN',
  description text default '',
  images jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.reservations (
  id text primary key,
  guest_name text not null,
  phone text not null,
  email text not null,
  apartment text not null,
  checkin date not null,
  checkout date not null,
  nights integer not null default 1,
  guests integer not null default 1,
  status text not null default 'Confirmed',
  notes text default '',
  created_at timestamptz not null default now()
);

create table if not exists public.maintenance_blocks (
  id text primary key,
  apartment text not null,
  start date not null,
  "end" date not null,
  reason text default '',
  created_at timestamptz not null default now()
);

create table if not exists public.app_settings (
  id integer primary key,
  settings jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.apartment_catalog enable row level security;
alter table public.reservations enable row level security;
alter table public.maintenance_blocks enable row level security;
alter table public.app_settings enable row level security;

-- Development policies for the current client-side application.
-- Replace these with authenticated admin policies before launch.
drop policy if exists "catalog public read" on public.apartment_catalog;
create policy "catalog public read" on public.apartment_catalog for select using (true);
drop policy if exists "catalog public write dev" on public.apartment_catalog;
create policy "catalog public write dev" on public.apartment_catalog for all using (true) with check (true);

drop policy if exists "reservations public read dev" on public.reservations;
create policy "reservations public read dev" on public.reservations for select using (true);
drop policy if exists "reservations public write dev" on public.reservations;
create policy "reservations public write dev" on public.reservations for all using (true) with check (true);

drop policy if exists "blocks public read dev" on public.maintenance_blocks;
create policy "blocks public read dev" on public.maintenance_blocks for select using (true);
drop policy if exists "blocks public write dev" on public.maintenance_blocks;
create policy "blocks public write dev" on public.maintenance_blocks for all using (true) with check (true);

drop policy if exists "settings public read dev" on public.app_settings;
create policy "settings public read dev" on public.app_settings for select using (true);
drop policy if exists "settings public write dev" on public.app_settings;
create policy "settings public write dev" on public.app_settings for all using (true) with check (true);

-- Storage bucket used by Property Studio.
insert into storage.buckets (id, name, public)
values ('ma-luxury-gallery', 'ma-luxury-gallery', true)
on conflict (id) do update set public = true;

-- Development storage policy. Lock this down with authenticated admin policies before production.
drop policy if exists "gallery public read dev" on storage.objects;
create policy "gallery public read dev" on storage.objects for select using (bucket_id = 'ma-luxury-gallery');
drop policy if exists "gallery public write dev" on storage.objects;
create policy "gallery public write dev" on storage.objects for all using (bucket_id = 'ma-luxury-gallery') with check (bucket_id = 'ma-luxury-gallery');
