-- ─────────────────────────────────────────────────────────────────────────
-- Valor propio del experimento (target/stop en $ de la prueba,
-- independiente del P&L del día). Signo: T → positivo, S → negativo.
-- Correr en Supabase SQL Editor
-- ─────────────────────────────────────────────────────────────────────────

alter table diagnostico_experimentos
  add column if not exists valor numeric;

comment on column diagnostico_experimentos.valor is
  'Resultado en $ del experimento (T positivo, S negativo). Null en registros antiguos.';
