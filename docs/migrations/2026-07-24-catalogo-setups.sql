-- ═══════════════════════════════════════════════════════════════════════════
-- catalogo_setups + catalogo_setup_variantes — setups paramétricos (Fase A)
-- 2026-07-24
--
-- PROBLEMA QUE RESUELVE
-- El nombre del setup ("IRI Continuación Alcista") era texto libre hardcodeado
-- en 6 sitios (2 dropdowns del index.html, worker.js del bot, ChecklistChaumer,
-- estrategia.js) y la FAMILIA se deducía con `startsWith('iri')` replicado en
-- 5 archivos JS. Crear un setup nuevo obligaba a editar código y recompilar el
-- indicador de NinjaTrader.
--
-- MODELO
--   catalogo_setups           → la FAMILIA operativa (iri, reingreso, futuros…)
--   catalogo_setup_variantes  → las variantes concretas (6 hoy)
--   sesiones.setup_codigo     → FK a la variante; la familia sale del JOIN
--
-- `catalogo_reglas.setup` ya apuntaba a la familia ('iri'/'reingreso'/null) —
-- ahora esa columna queda respaldada por catalogo_setups en vez de ser texto
-- suelto. Crear un 3er setup pasa a ser insertar filas, sin tocar código.
--
-- Aplicada vía MCP el 2026-07-24.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. Familias de setup ───────────────────────────────────────────────────
create table if not exists catalogo_setups (
  id          bigint generated always as identity primary key,
  codigo      text    not null unique,        -- 'iri' | 'reingreso'
  nombre      text    not null,               -- etiqueta visible
  descripcion text,
  orden       integer not null default 0,
  activo      boolean not null default true,
  created_at  timestamptz default now()
);

alter table catalogo_setups enable row level security;
drop policy if exists auth_all on catalogo_setups;
create policy auth_all on catalogo_setups for all to authenticated using (true) with check (true);
grant select, insert, update, delete on catalogo_setups to authenticated, service_role;

insert into catalogo_setups (codigo, nombre, descripcion, orden) values
  ('iri',       'IRI',       'Impulso · Retroceso · Impulso. Entrada a favor de la corrida tras rompimiento de zona con consecución.', 1),
  ('reingreso', 'Reingreso', 'Segundo intento a una zona importante: la consecución falla, el precio revierte y reingresa a la zona.', 2)
on conflict (codigo) do nothing;

-- ── 2. Variantes operativas ────────────────────────────────────────────────
create table if not exists catalogo_setup_variantes (
  id           bigint generated always as identity primary key,
  codigo       text    not null unique,       -- 'iri_continuacion_alcista'
  setup_codigo text    not null references catalogo_setups(codigo) on update cascade,
  nombre       text    not null,              -- 'IRI Continuación Alcista'
  subtipo      text,                          -- 'apertura' | 'continuacion' | null
  direccion    text    not null default 'ambas' check (direccion in ('alcista','bajista','ambas')),
  orden        integer not null default 0,
  activo       boolean not null default true,
  created_at   timestamptz default now()
);
create index if not exists idx_setup_variantes_setup on catalogo_setup_variantes (setup_codigo);

alter table catalogo_setup_variantes enable row level security;
drop policy if exists auth_all on catalogo_setup_variantes;
create policy auth_all on catalogo_setup_variantes for all to authenticated using (true) with check (true);
grant select, insert, update, delete on catalogo_setup_variantes to authenticated, service_role;

-- `nombre` debe coincidir EXACTO con el texto histórico de sesiones.setup
-- (de ahí sale el backfill del paso 3).
insert into catalogo_setup_variantes (codigo, setup_codigo, nombre, subtipo, direccion, orden) values
  ('iri_apertura_alcista',      'iri',       'IRI Apertura Alcista',      'apertura',     'alcista', 1),
  ('iri_apertura_bajista',      'iri',       'IRI Apertura Bajista',      'apertura',     'bajista', 2),
  ('iri_continuacion_alcista',  'iri',       'IRI Continuación Alcista',  'continuacion', 'alcista', 3),
  ('iri_continuacion_bajista',  'iri',       'IRI Continuación Bajista',  'continuacion', 'bajista', 4),
  ('reingreso_alcista',         'reingreso', 'Reingreso Alcista',         null,           'alcista', 5),
  ('reingreso_bajista',         'reingreso', 'Reingreso Bajista',         null,           'bajista', 6)
on conflict (codigo) do nothing;

-- ── 3. sesiones.setup_codigo (FK) + backfill del histórico ─────────────────
-- Se CONSERVA sesiones.setup (texto) por compatibilidad: la Fase B migra las
-- lecturas a setup_codigo. No se dropea aquí.
alter table sesiones add column if not exists setup_codigo text
  references catalogo_setup_variantes(codigo) on update cascade;
create index if not exists idx_sesiones_setup_codigo on sesiones (setup_codigo);

update sesiones s
   set setup_codigo = v.codigo
  from catalogo_setup_variantes v
 where s.setup_codigo is null
   and s.setup is not null
   and lower(trim(s.setup)) = lower(v.nombre);

-- Legacy: 2 sesiones (13 y 14-may-2026) con el nombre corto "IRI Alcista".
-- Decisión de Kris (2026-07-24): mapean a IRI Continuación Alcista.
update sesiones
   set setup_codigo = 'iri_continuacion_alcista'
 where setup_codigo is null
   and trim(setup) = 'IRI Alcista';

-- ── 4. Reglas: mapa aprobado por Kris (2026-07-24) ─────────────────────────
-- El trigger fn_backfill_regla_checklist materializa las reglas NUEVAS en TODAS
-- las sesiones con cumplido=true (diseño "no dañar disciplina": una regla que no
-- existía no puede penalizar días pasados). Las reglas de un setup no se evalúan
-- en días del otro setup — el filtro por familia lo aplican metrics/disciplina.

-- 4.1 chk_contexto pasa de común a exclusiva de IRI
update catalogo_reglas set setup = 'iri', orden = 1 where codigo = 'chk_contexto';

-- 4.2 Fase 2 · IRI — orden canónico
update catalogo_reglas set orden = 2 where codigo = 'chk_5velas';
update catalogo_reglas set orden = 3 where codigo = 'chk_estructura';
update catalogo_reglas set orden = 4 where codigo = 'chk_consecucion';

-- 4.3 Fase 2 · Reingreso — título más corto + 3 reglas nuevas
update catalogo_reglas
   set titulo = '2º intento a zona importante', orden = 1
 where codigo = 'rei_zona';

insert into catalogo_reglas (codigo, titulo, enunciado, capa, tipo, fase, setup, direccion, es_checklist, orden, activa, estado) values
  ('rei_consecucion_fallida', 'Rompimiento de zona + consecución Fallida',
   'El precio rompe la zona e intenta la consecución, pero falla: es la condición que habilita el reingreso.',
   'proceso', 'dura', 2, 'reingreso', 'ambas', true, 2, true, 'vigente'),
  ('rei_vela_reingreso', 'Vela de Reingreso a Zona',
   'Tras la consecución fallida, el precio revierte y una vela reingresa a la zona.',
   'proceso', 'dura', 2, 'reingreso', 'ambas', true, 3, true, 'vigente'),
  ('rei_vela_consecucion', 'Vela de consecución hacia reingreso',
   'Confirmación: la vela de consecución acompaña el reingreso y valida la entrada.',
   'proceso', 'dura', 2, 'reingreso', 'ambas', true, 4, true, 'vigente')
on conflict (codigo) do nothing;

-- rei_entrada: reemplazada por las 3 anteriores. Soft-delete (hay historial en
-- sesion_checklist; el FK es ON DELETE RESTRICT, no se borra físico).
update catalogo_reglas
   set activa = false, es_checklist = false, estado = 'archivada'
 where codigo = 'rei_entrada';

-- 4.4 Fase 2 · común — target sin zonas queda al final del bloque
update catalogo_reglas set orden = 5 where codigo = 'target_sin_zonas';

-- 4.5 Fase 3 — el stop máximo baja de Fase 2 a Fase 3
update catalogo_reglas set fase = 3, orden = 1 where codigo = 'stop_max_puntos';
update catalogo_reglas set orden = 2 where codigo = 'chk_orden';
update catalogo_reglas set orden = 3 where codigo = 'chk_mqzpxeub';
update catalogo_reglas set orden = 4 where codigo = 'rr_1a1';

-- 4.6 Código legible para "No mover Target/Stop" (era autogenerado).
-- El FK sesion_checklist.regla_codigo es ON UPDATE CASCADE → propaga solo.
update catalogo_reglas set codigo = 'chk_no_mover' where codigo = 'chk_mqzpxeub';

notify pgrst, 'reload schema';

-- ── Verificación ───────────────────────────────────────────────────────────
--  select s.nombre, v.codigo, v.nombre from catalogo_setup_variantes v
--    join catalogo_setups s on s.codigo = v.setup_codigo order by v.orden;
--  select setup, setup_codigo, count(*) from sesiones where setup is not null
--    group by 1,2 order by 1;                      -- 0 filas con setup_codigo null
--  select fase, coalesce(setup,'(común)') setup, orden, codigo, titulo
--    from catalogo_reglas where es_checklist and activa
--    order by fase, coalesce(setup,'0'), orden;
