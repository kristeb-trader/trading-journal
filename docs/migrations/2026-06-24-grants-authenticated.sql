-- ─────────────────────────────────────────────────────────────────────────
-- Grants para el rol `authenticated` (tras agregar login con Supabase Auth).
--
-- Con login, la web consulta como rol `authenticated`, no `anon`. Las tablas
-- tenían permisos solo para `anon`, así que un usuario logueado recibía
-- "permission denied". Aquí otorgamos los mismos permisos a `authenticated`.
--
-- RLS sigue OFF (el candado real llega en la Fase 2). `anon` se CONSERVA porque
-- lo usan el bot de Telegram y los indicadores NT8 hasta las Fases 3-4.
-- Correr en el SQL Editor de Supabase.
-- ─────────────────────────────────────────────────────────────────────────

grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;

-- Para que las tablas/secuencias futuras también queden cubiertas
alter default privileges in schema public grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public grant usage, select on sequences to authenticated;

notify pgrst, 'reload schema';
