-- ═══════════════════════════════════════════════════════════════════════════
-- DROP de las 7 columnas chk_* de `sesiones` (obsoletas)
-- 2026-07-08
--
-- El checklist vive 100% en sesiones.checklist (JSONB). Verificado el 2026-07-08:
-- las 7 columnas están replicadas en el JSONB en las 107 filas (0 pérdidas,
-- 0 discrepancias). La lectura se hidrata del JSONB (hydrateChecklist en db.js).
-- El dual-write del cliente se quitó en form.js; el bot no las escribía.
--
-- ⚠️ NO CORRER a ciegas. El Worker web /api/session NO está versionado. Si ese
--    Worker inyecta columnas chk_* por su cuenta, el DROP hará que el guardado
--    web falle (PGRST204 "column ... does not exist").
--
-- PROTOCOLO DE VERIFICACIÓN (hazlo ANTES del DROP, con form.js ya desplegado):
--   1. Abre la web de producción, entra a "Registrar" y guarda cualquier sesión.
--   2. Debe guardar sin error (toast verde), no un error 4xx.
--   3. (Opcional, confirmación fuerte) En el SQL Editor, revisa que las columnas
--      chk_* NO se pusieron en false solas para esa fecha:
--        select sesion_date, checklist, chk_zonas, chk_noticias, chk_cuenta_pa
--        from sesiones where sesion_date = 'YYYY-MM-DD';
--      Si chk_* conserva su valor previo y el JSONB tiene las claves → el Worker
--      NO inyecta las columnas → DROP seguro.
--   Si el guardado FALLA por columna inexistente, el Worker sí las inyecta:
--   NO corras el DROP; primero hay que quitarlas del Worker /api/session.
--
-- Reversible: si algo sale mal, las columnas se recrean vacías al instante
-- (el dato real está en el JSONB, no se pierde nada).
-- ═══════════════════════════════════════════════════════════════════════════

alter table sesiones
  drop column if exists chk_cuenta_pa,
  drop column if exists chk_noticias,
  drop column if exists chk_zonas,
  drop column if exists chk_5velas,
  drop column if exists chk_consecucion,
  drop column if exists chk_estructura,
  drop column if exists chk_orden;

notify pgrst, 'reload schema';
