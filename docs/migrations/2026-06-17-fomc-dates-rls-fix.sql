-- ─────────────────────────────────────────────────────────────────────────
-- Fix: la app no veía las fechas FOMC aunque se insertaran.
-- Causa: `fomc_dates` era la única tabla con RLS habilitado y sin policy de
-- lectura para `anon`, así que la app (clave anon) las leía como vacías.
-- Esto era inconsistente con el resto del proyecto (RLS deshabilitado).
--
-- Solución: apagar RLS en fomc_dates para alinearla con las demás tablas, y
-- reasegurar las filas 2026 por si el insert anterior tampoco quedó.
-- Idempotente: seguro re-correrla. Correr en el SQL Editor de Supabase.
-- ─────────────────────────────────────────────────────────────────────────

alter table fomc_dates disable row level security;

insert into fomc_dates (date, description) values
  ('2026-01-28', 'FOMC Meeting'),
  ('2026-03-18', 'FOMC Meeting'),
  ('2026-04-29', 'FOMC Meeting'),
  ('2026-06-17', 'FOMC Meeting'),
  ('2026-07-29', 'FOMC Meeting'),
  ('2026-09-16', 'FOMC Meeting'),
  ('2026-10-28', 'FOMC Meeting'),
  ('2026-12-09', 'FOMC Meeting')
on conflict (date) do nothing;
