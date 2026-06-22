-- ─────────────────────────────────────────────────────────────────────────
-- Fase por defecto en el catálogo de errores.
--
-- Cada error del catálogo (catalogo_errores) puede tener una FASE del proceso
-- asociada (1 Pre-sesión | 2 Lectura | 3 Ejecución). Al registrar ese error en
-- una sesión, el formulario toma esa fase automáticamente (con override manual).
-- Correr en el SQL Editor de Supabase.
-- ─────────────────────────────────────────────────────────────────────────

alter table catalogo_errores add column if not exists fase smallint;

notify pgrst, 'reload schema';
