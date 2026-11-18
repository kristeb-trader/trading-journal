-- Las tres funciones de los parámetros (2026-11-17-parametros.sql) con el search_path fijo: el asesor de
-- seguridad de Supabase avisa de las que no lo llevan (function_search_path_mutable).
alter function fn_parametros_valores_ambito() set search_path = public;
alter function parametros_vigentes(date, text) set search_path = public;
alter function parametros_de_cuenta(date, text) set search_path = public;
