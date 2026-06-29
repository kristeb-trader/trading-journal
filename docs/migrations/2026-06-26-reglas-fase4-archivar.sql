-- ─────────────────────────────────────────────────────────────────────────
-- UNIFICACIÓN DEL RULEBOOK — FASE 4: archivar tablas viejas.
--
-- NO destructivo: renombra las tablas a *_archivada (reversible). Los datos se
-- conservan; cuando estés 100% seguro, podrás hacer `drop table` de las
-- *_archivada más adelante.
--
-- Estas tablas ya NO las lee ningún código (web, bot ni Coach usan `reglas`):
--   - estrategia_chaumer  → reemplazada por reglas (capa 'filosofia')
--   - setup_reglas        → reemplazada por reglas (capa 'setup')
--   - reglas_legacy_backup→ tabla muerta (ya apartada en Fase 1)
--
-- Es re-ejecutable (rename guardado con `if exists`).
-- Correr en el SQL Editor de Supabase.
-- ─────────────────────────────────────────────────────────────────────────

alter table if exists estrategia_chaumer rename to estrategia_chaumer_archivada;
alter table if exists setup_reglas        rename to setup_reglas_archivada;
-- reglas_legacy_backup ya quedó archivada en la Fase 1; se deja como está.

notify pgrst, 'reload schema';

-- ─────────────────────────────────────────────────────────────────────────
-- checklist_items: el indicador NT8 `ChecklistChaumer` la lee hasta que
-- recompiles la versión nueva (que ahora lee de `reglas`). Por eso NO se
-- archiva aquí todavía.
--
-- Corre esta línea SOLO DESPUÉS de recompilar el ChecklistChaumer en NinjaTrader
-- (y confirmar que el panel sigue mostrando el checklist):
--
--   alter table if exists checklist_items rename to checklist_items_archivada;
--   notify pgrst, 'reload schema';
-- ─────────────────────────────────────────────────────────────────────────
