-- Etapas de la disciplina. Fase 5a de docs/disenos/2026-09-24-etapa-plan-chaumer.md.
--
-- Por qué: la disciplina contaba las reglas ACTIVAS de hoy sobre TODA la historia, así
-- que desactivar una regla la borraba de los días pasados (le pasó a rr_1a1: 135
-- casillas que dejaron de contar). Desde aquí cada regla pertenece a una etapa, y la
-- disciplina de un día cuenta las reglas DE SU ETAPA, estén activas o no. `activa`
-- solo decide qué se ve para marcar (Diario, NinjaTrader).
--
-- 5a crea solo la etapa 1, sin fechas: cubre todos los días, con las mismas 17 casillas
-- que cuentan hoy. La disciplina no puede moverse ni una décima. La etapa 2 (plan de
-- Chaumer, desde el 24/09) y sus reglas llegan en 5b.

create table if not exists disciplina_etapas (
  id          smallint primary key,
  nombre      text not null,
  desde       date,                      -- NULL = desde siempre
  hasta       date,                      -- NULL = sigue abierta
  descripcion text,
  created_at  timestamptz not null default now(),
  check (desde is null or hasta is null or desde <= hasta)
);

comment on table disciplina_etapas is
  'Etapas de la disciplina. Un día pertenece a la etapa que contiene su fecha, entero. La disciplina de un día cuenta las reglas de catalogo_reglas con esa etapa.';

insert into disciplina_etapas (id, nombre, desde, hasta, descripcion) values
  (1, 'Rulebook propio', null, null,
   'Las 17 casillas del checklist del Journal hasta la llegada del plan de Chaumer.')
on conflict (id) do nothing;

alter table disciplina_etapas enable row level security;
drop policy if exists auth_all on disciplina_etapas;
create policy auth_all on disciplina_etapas for all to authenticated using (true) with check (true);
grant select, insert, update, delete on disciplina_etapas to authenticated, service_role;

-- ── catalogo_reglas ───────────────────────────────────────────────────────
alter table catalogo_reglas
  add column if not exists etapa       smallint references disciplina_etapas(id),
  add column if not exists plan_reglas text[],
  add column if not exists origen      text not null default 'journal',
  add column if not exists plan_tipo   text;

alter table catalogo_reglas drop constraint if exists catalogo_reglas_origen_check;
alter table catalogo_reglas add constraint catalogo_reglas_origen_check
  check (origen in ('journal', 'plan_linea', 'plan_regla'));
alter table catalogo_reglas drop constraint if exists catalogo_reglas_plan_tipo_check;
alter table catalogo_reglas add constraint catalogo_reglas_plan_tipo_check
  check (plan_tipo is null or plan_tipo in ('casilla', 'auto', 'guia'));

comment on column catalogo_reglas.etapa is
  'Etapa de la disciplina a la que pertenece. La disciplina cuenta las reglas de la etapa del día, ESTÉN ACTIVAS O NO. NULL = no cuenta en ninguna.';
comment on column catalogo_reglas.activa is
  'Solo decide si se ve para marcarla (Diario, NinjaTrader). NO decide si cuenta en la disciplina: eso es `etapa`.';

-- La etapa 1 son exactamente las casillas que cuentan hoy: checklist y activas (17).
-- rr_1a1 y rei_entrada, inactivas, se quedan en NULL: hoy ya no cuentan, y así sigue.
update catalogo_reglas set etapa = 1
 where es_checklist = true and activa = true and etapa is null;

notify pgrst, 'reload schema';
