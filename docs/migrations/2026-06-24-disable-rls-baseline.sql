-- ─────────────────────────────────────────────────────────────────────────
-- Restaurar estado base de la Fase 1: RLS APAGADO en todas las tablas public.
--
-- Síntoma: tras agregar login, el usuario autenticado veía 0 filas (anon sí
-- veía datos) → RLS quedó activado en las tablas (con política solo para anon).
-- Como aún NO estamos listos para el cutover de RLS (bot e indicadores siguen
-- usando anon), volvemos a RLS off para que la app logueada funcione.
--
-- En la Fase 2 se activará RLS de forma coordinada y con políticas correctas.
-- Correr en el SQL Editor de Supabase.
-- ─────────────────────────────────────────────────────────────────────────

do $$
declare r record;
begin
  for r in select tablename from pg_tables where schemaname = 'public'
  loop
    execute format('alter table public.%I disable row level security', r.tablename);
  end loop;
end $$;

notify pgrst, 'reload schema';

-- Verificación (opcional): todas deben quedar en rowsecurity = false
--   select tablename, rowsecurity from pg_tables where schemaname='public' order by tablename;
