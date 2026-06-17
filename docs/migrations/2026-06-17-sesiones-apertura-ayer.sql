-- ─────────────────────────────────────────────────────────────────────────
-- Añade la apertura de la sesión de ayer (PDO — Previous Day Open) al registro
-- diario. Completa el OHLC de ayer junto con PDH/PDL/PDC ya existentes.
-- Nullable. Correr en el SQL Editor de Supabase.
-- ─────────────────────────────────────────────────────────────────────────

alter table sesiones add column if not exists precio_apertura_ayer numeric;
