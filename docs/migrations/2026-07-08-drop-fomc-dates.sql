-- ═══════════════════════════════════════════════════════════════════════════
-- DROP de fomc_dates (obsoleta)
-- 2026-07-08
--
-- Las fechas FOMC viven ahora en catalogo_fechas (tipo='fomc'), migradas por
-- 2026-07-08-catalogo-fechas.sql. Nadie lee ya fomc_dates: la web (calendar.js)
-- lee de catalogo_fechas. Seguro de borrar tras verificar que el calendario y la
-- sección "Fechas Especiales" funcionan.
-- Correr en el SQL Editor de Supabase.
-- ═══════════════════════════════════════════════════════════════════════════

drop table if exists fomc_dates;

notify pgrst, 'reload schema';
