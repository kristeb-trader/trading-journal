-- ─────────────────────────────────────────────────────────────────────────
-- FASE 2 — Activar RLS (cutover final del blindaje de seguridad).
--
-- Qué hace:
--   1. Activa RLS en TODAS las tablas del esquema public.
--   2. Crea en cada tabla la política `auth_all` que permite TODO
--      (select/insert/update/delete) SOLO al rol `authenticated` (la web logueada).
--   3. `anon` queda SIN políticas → RLS lo bloquea por completo (no lee, no
--      escribe, no borra). La anon key pública de GitHub Pages queda inservible.
--
-- Por qué es seguro ahora:
--   · Web → consulta como `authenticated` (login Fase 1) → la política la deja pasar.
--   · Bot Telegram + Worker /api/session → usan `service_role`, que IGNORA RLS
--     (Fase 3, verificado).
--   · Indicadores NT8 → usan `service_role` desde archivo local, que IGNORA RLS
--     (Fase 4). OJO: a la fecha el export de trades aún no estaba verificado
--     (problema de lectura de la key local). Activar RLS no lo empeora: ya no
--     escribía; al corregir el archivo de la key funcionará igual con RLS on.
--
-- Es idempotente: se puede correr varias veces sin error (DROP POLICY IF EXISTS).
-- Correr en el SQL Editor de Supabase.
-- Rollback: 2026-06-24-fase2-rollback-rls.sql
-- ─────────────────────────────────────────────────────────────────────────

do $$
declare r record;
begin
  for r in select tablename from pg_tables where schemaname = 'public'
  loop
    execute format('alter table public.%I enable row level security', r.tablename);
    execute format('drop policy if exists auth_all on public.%I', r.tablename);
    execute format(
      'create policy auth_all on public.%I for all to authenticated using (true) with check (true)',
      r.tablename);
  end loop;
end $$;

notify pgrst, 'reload schema';

-- Verificación (opcional):
--   Todas en rowsecurity = true:
--     select tablename, rowsecurity from pg_tables where schemaname='public' order by tablename;
--   Cada tabla con su política para authenticated:
--     select tablename, policyname, roles from pg_policies where schemaname='public' order by tablename;
