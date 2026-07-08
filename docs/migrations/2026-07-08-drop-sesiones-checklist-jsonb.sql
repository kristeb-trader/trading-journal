-- ═══════════════════════════════════════════════════════════════════════════
-- DROP del checklist viejo en `sesiones` (JSONB + columnas chk_*)
-- 2026-07-08  ·  paso destructivo final del rediseño del checklist
--
-- El checklist vive ahora en `sesion_checklist` (relacional). Este script elimina
-- las representaciones viejas de `sesiones`.
--
-- ⚠️ CORRER SOLO CUANDO:
--   1. Ya corriste 2026-07-08-normalizar-checklist-catalogo-reglas.sql.
--   2. La web nueva (Fase B) está desplegada y verificaste que guarda/lee el
--      checklist desde sesion_checklist (marca, recarga, y la disciplina cuadra).
--   3. El AddOn NT nuevo (Fase C) está recompilado y escribe en sesion_checklist.
--
-- Hasta entonces, el JSONB/columnas quedan como red de seguridad (nadie los lee
-- en el código nuevo, pero permiten revertir si algo falla en B o C).
-- Reversible en datos: los valores viven en sesion_checklist; esto solo limpia
-- las columnas muertas de `sesiones`.
-- Correr en el SQL Editor de Supabase.
-- ═══════════════════════════════════════════════════════════════════════════

alter table sesiones
  drop column if exists checklist,
  drop column if exists chk_cuenta_pa,
  drop column if exists chk_noticias,
  drop column if exists chk_zonas,
  drop column if exists chk_5velas,
  drop column if exists chk_consecucion,
  drop column if exists chk_estructura,
  drop column if exists chk_orden;

notify pgrst, 'reload schema';
