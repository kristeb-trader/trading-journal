-- ─────────────────────────────────────────────────────────────────────────
-- Carga de fechas FOMC 2026 en la tabla `fomc_dates` (estaba vacía).
-- El calendario marca automáticamente con ícono de podio cada día que
-- coincida, operes o no. Solo se cargan los DÍAS DE DECISIÓN (segundo día
-- de cada reunión, anuncio ~2pm ET), que es el día de alta volatilidad.
--
-- Fuente: calendario oficial de la Reserva Federal. Verificar contra
-- federalreserve.gov/monetarypolicy/fomccalendars.htm ante cualquier duda.
-- Correr en el SQL Editor de Supabase.
-- ─────────────────────────────────────────────────────────────────────────

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
