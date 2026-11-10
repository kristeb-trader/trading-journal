-- «No estoy de acuerdo» con el juicio del motor (10/11/2026, D-052,
-- docs/disenos/2026-11-10-disciplina-reglas.md §5).
--
-- Un día por fila. `abierta`: ese día no cuenta en la disciplina hasta revisarlo. Se cierra con
-- `motor` (el motor tenía razón: vuelve a contar como diga el juicio) o `plan` (Kris tenía razón:
-- se corrige el plan; el día no cuenta). La escriben la web (authenticated) y el bot de Telegram
-- (service_role).

create table if not exists disciplina_discusiones (
  fecha       date primary key,
  nota        text,
  estado      text not null default 'abierta' check (estado in ('abierta', 'motor', 'plan')),
  creada_at   timestamptz not null default now(),
  cerrada_at  timestamptz
);

alter table disciplina_discusiones enable row level security;
drop policy if exists auth_all on disciplina_discusiones;
create policy auth_all on disciplina_discusiones for all to authenticated using (true) with check (true);
grant select, insert, update, delete on disciplina_discusiones to authenticated, service_role;

notify pgrst, 'reload schema';
