-- ─────────────────────────────────────────────────────────────────────────
-- Grants para el rol `service_role` (bot, Worker /api/session, indicadores NT8).
--
-- Síntoma: el indicador SupabaseAutoExport falla al exportar a `apex_trades`:
--   HTTP 403 · code 42501 · "permission denied for table apex_trades"
--   hint: GRANT INSERT ON public.apex_trades TO service_role
--
-- Causa: `service_role` IGNORA RLS, pero igual necesita permisos GRANT a nivel
-- de tabla. Al blindar la BD se otorgaron grants a `anon` (histórico) y
-- `authenticated` (Fase 1), pero a `service_role` le faltaban en algunas tablas
-- (p. ej. `apex_trades`). El bot sí escribía en `sesiones`/`trades` porque ahí
-- sí tenía permisos; en `apex_trades` no.
--
-- Solución: otorgar a `service_role` CRUD en TODAS las tablas de public + en las
-- futuras (default privileges), para que bot/worker/indicadores nunca vuelvan a
-- toparse con esto. service_role es el rol de backend (secreto), no es público.
-- Correr en el SQL Editor de Supabase.
-- ─────────────────────────────────────────────────────────────────────────

grant usage on schema public to service_role;
grant select, insert, update, delete on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;

-- Para que las tablas/secuencias futuras también queden cubiertas
alter default privileges in schema public grant select, insert, update, delete on tables to service_role;
alter default privileges in schema public grant usage, select on sequences to service_role;

notify pgrst, 'reload schema';

-- Verificación (opcional): privilegios de service_role sobre apex_trades
--   select grantee, privilege_type from information_schema.role_table_grants
--   where table_schema='public' and table_name='apex_trades' and grantee='service_role';
