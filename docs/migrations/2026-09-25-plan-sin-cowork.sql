-- 2026-09-25 · plan_documentos: el comentario deja de decir que el plan lo edita Cowork.
--
-- D-028: Cowork deja de existir. El plan (chaumer/01_Plan) se edita desde Claude Code,
-- con el sí de Kris cambio a cambio. Solo cambia el texto del comentario de la tabla:
-- ni columnas, ni datos, ni políticas.

comment on table public.plan_documentos is
  'Documentos del plan de Chaumer para el Coach. Los escribe solo scripts/plan/sincronizar.mjs; el texto se edita en chaumer/01_Plan, con el sí de Kris (D-028).';
