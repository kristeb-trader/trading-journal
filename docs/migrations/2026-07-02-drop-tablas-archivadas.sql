-- 2026-07-02 — Drop definitivo de las tablas archivadas del rulebook + checklist_items
--
-- El rulebook unificado `reglas` lleva 5+ semanas en producción (web, bot, Coach,
-- indicadores NT8) y su contenido ya incluye lo que había en estas tablas.
-- Ningún código las lee. El AddOn NT8 ChecklistChaumer ya está recompilado y lee de
-- `reglas` (es_checklist), así que checklist_items también se retira.
--
-- Respaldo histórico: el modelo de reglas está versionado en
-- docs/migrations/2026-06-26-reglas-*.sql.

drop table if exists estrategia_chaumer_archivada;
drop table if exists setup_reglas_archivada;
drop table if exists reglas_legacy_backup;
-- checklist_items pudo haberse renombrado a checklist_items_archivada; cubrimos ambos.
drop table if exists checklist_items;
drop table if exists checklist_items_archivada;

notify pgrst, 'reload schema';
