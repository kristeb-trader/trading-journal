-- ─────────────────────────────────────────────────────────────────────────
-- Añade máximo y mínimo de la sesión de ayer (PDH/PDL) al registro diario.
-- Son los niveles de referencia más operables del día; complementan el cierre
-- de ayer que ya se guardaba. Nullable. Correr en el SQL Editor de Supabase.
-- ─────────────────────────────────────────────────────────────────────────

alter table sesiones add column if not exists precio_max_ayer numeric;
alter table sesiones add column if not exists precio_min_ayer numeric;
