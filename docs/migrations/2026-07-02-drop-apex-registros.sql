-- 2026-07-02 — Eliminar la tabla vieja apex_registros
--
-- Los días manuales se unificaron en apex_trades (tipo='dia') con la migración
-- 2026-06-23-apex-unificar-tablas.sql. Verificado: hay 113 filas tipo='dia'.
-- El código ya no lee apex_registros (se quitó DB.getApexRegistros y la rama de
-- fallback en apex.js). Seguro dropear.

drop table if exists apex_registros;

notify pgrst, 'reload schema';
