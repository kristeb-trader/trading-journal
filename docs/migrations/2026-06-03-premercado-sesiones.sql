-- ════════════════════════════════════════════════════════════════════════
-- Campos de premercado / contexto técnico en la tabla sesiones
-- Para enriquecer el análisis del Coach IA.
-- Ejecutar en el SQL Editor de Supabase: https://jothoslozctflfrnysrx.supabase.co
-- ════════════════════════════════════════════════════════════════════════

ALTER TABLE sesiones
  ADD COLUMN IF NOT EXISTS precio_cierre_ayer   NUMERIC,   -- cierre del día anterior
  ADD COLUMN IF NOT EXISTS precio_apertura      NUMERIC,   -- precio de apertura
  ADD COLUMN IF NOT EXISTS precio_max_pre       NUMERIC,   -- máximo de premercado
  ADD COLUMN IF NOT EXISTS precio_min_pre       NUMERIC,   -- mínimo de premercado
  ADD COLUMN IF NOT EXISTS soportes_naranja     JSONB DEFAULT '[]',  -- hasta 5 líneas naranjas de soporte
  ADD COLUMN IF NOT EXISTS resistencias_naranja JSONB DEFAULT '[]',  -- hasta 5 líneas naranjas de resistencia
  ADD COLUMN IF NOT EXISTS noticias             TEXT,      -- ej: "9:00am → ISM Services PMI"
  ADD COLUMN IF NOT EXISTS se_conecto           BOOLEAN DEFAULT true; -- distingue los 2 "no operé"

-- Nota: los puntos entre mínimo y máximo de premercado NO se almacenan;
-- se calculan en la app (precio_max_pre - precio_min_pre).

-- se_conecto:
--   true  = el trader estuvo presente analizando (operó, o no operó pero se conectó sin setup)
--   false = no se conectó a operar ese día (registro mínimo)
