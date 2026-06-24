-- ─────────────────────────────────────────────────────────────────────────
-- ROLLBACK de la Fase 2 — volver a RLS APAGADO (botón de pánico).
--
-- Úsalo si tras activar RLS algo deja de funcionar (web, bot o indicadores) y
-- necesitas restaurar el acceso inmediatamente mientras se diagnostica.
--
-- Desactiva RLS en todas las tablas public. Las políticas `auth_all` se quedan
-- creadas pero inertes (con RLS off no se evalúan); no estorban y se reactivan
-- al volver a correr la migración de Fase 2.
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
