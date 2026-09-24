-- MA Luxury Apartments
-- Production-oriented Supabase Auth + RLS layer for the current App.jsx.
-- Run this AFTER supabase_schema.sql.
--
-- Admin access is controlled by Supabase Auth + app_metadata.role = 'admin'.
-- app_metadata is preferred over user_metadata because users cannot safely
-- promote themselves by editing user metadata from the browser.

create or replace function public.is_ma_admin()
returns boolean
language sql
stable
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false);
$$;

-- ============================= CATALOG ================================

alter table public.apartment_catalog enable row level security;

drop policy if exists "catalog public read" on public.apartment_catalog;
drop policy if exists "catalog public write dev" on public.apartment_catalog;
drop policy if exists "catalog admin write" on public.apartment_catalog;

create policy "catalog public read"
on public.apartment_catalog
for select
using (true);

create policy "catalog admin write"
on public.apartment_catalog
for all
to authenticated
using (public.is_ma_admin())
with check (public.is_ma_admin());

-- ============================ RESERVATIONS =============================

alter table public.reservations enable row level security;

drop policy if exists "reservations public read dev" on public.reservations;
drop policy if exists "reservations public write dev" on public.reservations;
drop policy if exists "reservations guest insert" on public.reservations;
drop policy if exists "reservations admin read" on public.reservations;
drop policy if exists "reservations admin update" on public.reservations;
drop policy if exists "reservations admin delete" on public.reservations;

-- Guests can create a reservation, but cannot read or modify reservations.
create policy "reservations guest insert"
on public.reservations
for insert
to anon, authenticated
with check (
  length(trim(guest_name)) between 2 and 120
  and length(trim(email)) between 5 and 180
  and length(trim(phone)) between 5 and 40
  and checkout > checkin
  and guests between 1 and 50
  and status in ('Confirmed', 'Pending')
);

create policy "reservations admin read"
on public.reservations
for select
to authenticated
using (public.is_ma_admin());

create policy "reservations admin update"
on public.reservations
for update
to authenticated
using (public.is_ma_admin())
with check (public.is_ma_admin());

create policy "reservations admin delete"
on public.reservations
for delete
to authenticated
using (public.is_ma_admin());

-- ========================== MAINTENANCE ================================

alter table public.maintenance_blocks enable row level security;

drop policy if exists "blocks public read dev" on public.maintenance_blocks;
drop policy if exists "blocks public write dev" on public.maintenance_blocks;
drop policy if exists "blocks public read" on public.maintenance_blocks;
drop policy if exists "blocks admin write" on public.maintenance_blocks;

create policy "blocks public read"
on public.maintenance_blocks
for select
using (true);

create policy "blocks admin write"
on public.maintenance_blocks
for all
to authenticated
using (public.is_ma_admin())
with check (public.is_ma_admin());

-- ============================== SETTINGS ===============================

alter table public.app_settings enable row level security;

drop policy if exists "settings public read dev" on public.app_settings;
drop policy if exists "settings public write dev" on public.app_settings;
drop policy if exists "settings public read" on public.app_settings;
drop policy if exists "settings admin write" on public.app_settings;

-- Public settings are intentionally readable because the guest UI needs
-- WhatsApp/payment presentation settings.
create policy "settings public read"
on public.app_settings
for select
using (true);

create policy "settings admin write"
on public.app_settings
for all
to authenticated
using (public.is_ma_admin())
with check (public.is_ma_admin());

-- ============================== STORAGE ================================

insert into storage.buckets (id, name, public)
values ('ma-luxury-gallery', 'ma-luxury-gallery', true)
on conflict (id) do update set public = true;

drop policy if exists "gallery public read dev" on storage.objects;
drop policy if exists "gallery public write dev" on storage.objects;
drop policy if exists "gallery public read" on storage.objects;
drop policy if exists "gallery admin insert" on storage.objects;
drop policy if exists "gallery admin update" on storage.objects;
drop policy if exists "gallery admin delete" on storage.objects;

create policy "gallery public read"
on storage.objects
for select
using (bucket_id = 'ma-luxury-gallery');

create policy "gallery admin insert"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'ma-luxury-gallery' and public.is_ma_admin());

create policy "gallery admin update"
on storage.objects
for update
to authenticated
using (bucket_id = 'ma-luxury-gallery' and public.is_ma_admin())
with check (bucket_id = 'ma-luxury-gallery' and public.is_ma_admin());

create policy "gallery admin delete"
on storage.objects
for delete
to authenticated
using (bucket_id = 'ma-luxury-gallery' and public.is_ma_admin());

-- ======================= CREATE YOUR FIRST ADMIN =======================
-- 1. Create the admin user in Supabase Dashboard > Authentication > Users.
-- 2. Replace the email below with that exact account email.
-- 3. Run the UPDATE once.
--
-- UPDATE auth.users
-- SET raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
-- WHERE email = 'YOUR-ADMIN-EMAIL@example.com';
--
-- Verify it:
-- SELECT email, raw_app_meta_data FROM auth.users WHERE email = 'YOUR-ADMIN-EMAIL@example.com';
