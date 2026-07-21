-- ═══════════════════════════════════════════════════════════════════════════
-- Cuenta principal configurable
-- 2026-07-21
--
-- Agrega objetivos.cuenta_principal: el nombre de la cuenta que el journal usa
-- como principal (P&L del calendario/análisis, Coach IA, default del filtro).
-- Reemplaza el hardcode 'PA-APEX-232411-03' que estaba en coach.js.
-- Se setea a la cuenta activa actual (APEX-232411-14, la nueva de evaluación).
-- ═══════════════════════════════════════════════════════════════════════════

alter table objetivos add column if not exists cuenta_principal text;

update objetivos set cuenta_principal = 'APEX-232411-14' where id = 1;

notify pgrst, 'reload schema';
