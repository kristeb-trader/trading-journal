-- ─────────────────────────────────────────────────────────────────────────
-- Config del plan para pasar (perfil de riesgo + ritmo) persistida por cuenta,
-- para que sincronice entre dispositivos. Reemplaza el guardado en localStorage.
-- Correr en Supabase SQL Editor.
-- ─────────────────────────────────────────────────────────────────────────

alter table apex_cuentas
  add column if not exists plan_perfil text default 'moderado',
  add column if not exists plan_ritmo  text default 'equilibrado';
