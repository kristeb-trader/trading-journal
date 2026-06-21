-- ─────────────────────────────────────────────────────────────────────────
-- Bloque 3: modelo de error unificado. Cada error gana 2 dimensiones nuevas
-- para conectarlo con las fases del proceso y la psicología:
--   fase        smallint  → 1 (Pre-sesión) / 2 (Lectura) / 3 (Ejecución)
--   regla_vista boolean   → true: vio la regla y la violó (impulsividad);
--                           false: no la vio a tiempo (falla analítica);
--                           null: no aplica.
-- Correr en el SQL Editor de Supabase.
-- ─────────────────────────────────────────────────────────────────────────

alter table diagnostico_errores add column if not exists fase smallint;
alter table diagnostico_errores add column if not exists regla_vista boolean;
