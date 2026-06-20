-- ─────────────────────────────────────────────────────────────────────────
-- Bloque 1: alerta de riesgo proactiva. Cuando el retroceso del día supera el
-- stop máximo configurado (objetivos.stop_max_usd), el formulario alerta y
-- pregunta "¿Viste que el retroceso superaba tu límite antes de entrar?".
--   true  = lo vio y entró igual  → impulsividad (psicológico)
--   false = no lo vio a tiempo     → falla analítica (proceso)
--   null  = no hubo exceso / no aplica
-- Correr en el SQL Editor de Supabase.
-- ─────────────────────────────────────────────────────────────────────────

alter table sesiones add column if not exists alerta_riesgo_vista boolean;
