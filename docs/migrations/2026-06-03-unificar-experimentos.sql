-- ════════════════════════════════════════════════════════════════════════
-- Limpieza del modelo de experimentos / casuísticas
-- Ejecutar en el SQL Editor de Supabase: https://jothoslozctflfrnysrx.supabase.co
--
-- 1) sesion_casuisticas: tabla LEGADO (errores viejos), no la usa la app.
--    Sus 34 filas YA están todas en diagnostico_errores → 0 pérdida. Se borra.
-- 2) experimento_registros → diagnostico_experimentos: rename por consistencia
--    con diagnostico_errores. El rename conserva columnas, constraints (UNIQUE
--    sesion_date+experimento_id) y la FK a catalogo_experimentos.
-- ════════════════════════════════════════════════════════════════════════

-- Verificación previa opcional (debe dar 34 filas, todas duplicadas en diagnostico_errores):
-- SELECT count(*) FROM sesion_casuisticas;

-- 1) Borrar la tabla legado
DROP TABLE IF EXISTS sesion_casuisticas;

-- 2) Renombrar la tabla de registros de experimentos
ALTER TABLE experimento_registros RENAME TO diagnostico_experimentos;

-- Verificación posterior:
-- SELECT * FROM diagnostico_experimentos LIMIT 5;
