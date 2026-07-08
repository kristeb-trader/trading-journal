-- ═══════════════════════════════════════════════════════════════════════════
-- catalogo_fechas — días especiales del calendario (FOMC, festivos, vacaciones…)
-- 2026-07-08
--
-- Unifica en una tabla editable desde el Journal:
--   · FOMC     (migrado de fomc_dates)
--   · festivo  (antes calculado en el código; se cargan 2025-2027)
--   · vacaciones / otro (nuevos, los registra el usuario)
--
-- 1 fila por (fecha × tipo). Permite rangos de vacaciones (una fila por día) y
-- que un día sea de más de un tipo. `fomc_dates` queda obsoleta tras verificar.
-- Correr en el SQL Editor de Supabase.
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists catalogo_fechas (
  id         bigint generated always as identity primary key,
  fecha      date    not null,
  tipo       text    not null check (tipo in ('fomc','festivo','vacaciones','otro')),
  nombre     text,
  emoji      text,
  notas      text,
  activa     boolean not null default true,
  created_at timestamptz default now()
);
create index if not exists idx_catalogo_fechas_fecha on catalogo_fechas (fecha);
create unique index if not exists uq_catalogo_fechas_fecha_tipo on catalogo_fechas (fecha, tipo);

-- RLS + grants (patrón del proyecto)
alter table catalogo_fechas enable row level security;
drop policy if exists auth_all on catalogo_fechas;
create policy auth_all on catalogo_fechas for all to authenticated using (true) with check (true);
grant select, insert, update, delete on catalogo_fechas to authenticated, service_role;

-- ── Migración FOMC (de fomc_dates) ──────────────────────────────────────────
insert into catalogo_fechas (fecha, tipo, nombre, emoji)
select date, 'fomc', coalesce(nullif(description,''), 'FOMC'), '🏛️'
  from fomc_dates
on conflict (fecha, tipo) do nothing;

-- ── Festivos CME 2025-2027 (generados con la fórmula del código) ────────────
insert into catalogo_fechas (fecha, tipo, nombre, emoji) values
  ('2025-01-01', 'festivo', 'Año Nuevo', '🎊'),
  ('2025-01-20', 'festivo', 'Día de Martin Luther King Jr.', '✊'),
  ('2025-02-17', 'festivo', 'Día de los Presidentes', '🦅'),
  ('2025-04-18', 'festivo', 'Viernes Santo', '✝️'),
  ('2025-05-26', 'festivo', 'Día de los Caídos', '🪖'),
  ('2025-06-19', 'festivo', 'Juneteenth', '🎉'),
  ('2025-07-04', 'festivo', 'Día de la Independencia', '🎆'),
  ('2025-09-01', 'festivo', 'Día del Trabajo', '👷'),
  ('2025-11-27', 'festivo', 'Día de Acción de Gracias', '🦃'),
  ('2025-12-25', 'festivo', 'Navidad', '🎄'),
  ('2026-01-01', 'festivo', 'Año Nuevo', '🎊'),
  ('2026-01-19', 'festivo', 'Día de Martin Luther King Jr.', '✊'),
  ('2026-02-16', 'festivo', 'Día de los Presidentes', '🦅'),
  ('2026-04-03', 'festivo', 'Viernes Santo', '✝️'),
  ('2026-05-25', 'festivo', 'Día de los Caídos', '🪖'),
  ('2026-06-19', 'festivo', 'Juneteenth', '🎉'),
  ('2026-07-03', 'festivo', 'Día de la Independencia', '🎆'),
  ('2026-09-07', 'festivo', 'Día del Trabajo', '👷'),
  ('2026-11-26', 'festivo', 'Día de Acción de Gracias', '🦃'),
  ('2026-12-25', 'festivo', 'Navidad', '🎄'),
  ('2027-01-01', 'festivo', 'Año Nuevo', '🎊'),
  ('2027-01-18', 'festivo', 'Día de Martin Luther King Jr.', '✊'),
  ('2027-02-15', 'festivo', 'Día de los Presidentes', '🦅'),
  ('2027-03-26', 'festivo', 'Viernes Santo', '✝️'),
  ('2027-05-31', 'festivo', 'Día de los Caídos', '🪖'),
  ('2027-06-18', 'festivo', 'Juneteenth', '🎉'),
  ('2027-07-05', 'festivo', 'Día de la Independencia', '🎆'),
  ('2027-09-06', 'festivo', 'Día del Trabajo', '👷'),
  ('2027-11-25', 'festivo', 'Día de Acción de Gracias', '🦃'),
  ('2027-12-24', 'festivo', 'Navidad', '🎄')
on conflict (fecha, tipo) do nothing;

notify pgrst, 'reload schema';

-- Verificación:
--   select tipo, count(*) from catalogo_fechas group by tipo order by tipo;
--   select extract(year from fecha) yr, tipo, count(*) from catalogo_fechas group by 1,2 order by 1,2;
