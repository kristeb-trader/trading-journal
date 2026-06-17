-- ─────────────────────────────────────────────────────────────────────────
-- El indicador SupabaseDailyLevels hace UPSERT a `sesiones` por sesion_date,
-- lo que requiere una restricción UNIQUE (o PK) sobre esa columna.
-- Esta migración la añade solo si no existe ya. Si la tabla tuviera fechas
-- duplicadas, fallaría: en ese caso, limpiar duplicados antes.
-- Correr en el SQL Editor de Supabase.
-- ─────────────────────────────────────────────────────────────────────────

do $$
begin
  if not exists (
    select 1
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    where t.relname = 'sesiones'
      and c.contype in ('p', 'u')
      and c.conkey = array[
        (select attnum from pg_attribute
          where attrelid = t.oid and attname = 'sesion_date')
      ]
  ) then
    alter table sesiones add constraint sesiones_sesion_date_key unique (sesion_date);
  end if;
end $$;
