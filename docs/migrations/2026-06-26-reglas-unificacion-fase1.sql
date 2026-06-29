-- ─────────────────────────────────────────────────────────────────────────
-- UNIFICACIÓN DEL RULEBOOK — FASE 1 (BD aditiva, NO rompe nada).
--
-- Crea la tabla canónica `reglas` (1 fila = 1 regla atómica) y migra los datos
-- de `checklist_items`, `setup_reglas` y `estrategia_chaumer`. Las 3 tablas
-- viejas se CONSERVAN intactas (el código sigue usándolas hasta la Fase 2).
-- Reclama el nombre `reglas` apartando la tabla muerta como reglas_legacy_backup.
--
-- Es re-ejecutable sin duplicar (rename guardado + on conflict do nothing).
-- Correr en el SQL Editor de Supabase. Ver docs/plan-unificacion-reglas.md.
-- ─────────────────────────────────────────────────────────────────────────

-- 0. Apartar la tabla legacy `reglas` (vacía/muerta) para reciclar el nombre.
--    Solo renombra si existe y NO tiene la columna `codigo` (= es la legacy).
do $$
begin
  if exists (select 1 from information_schema.tables
             where table_schema='public' and table_name='reglas')
     and not exists (select 1 from information_schema.columns
             where table_schema='public' and table_name='reglas' and column_name='codigo')
  then
    execute 'alter table reglas rename to reglas_legacy_backup';
  end if;
end $$;

-- 1. Rulebook canónico
create table if not exists reglas (
  id           bigint generated always as identity primary key,
  codigo       text unique not null,
  titulo       text not null,
  enunciado    text,
  capa         text not null default 'proceso',  -- filosofia | setup | proceso | riesgo
  tipo         text not null default 'blanda',   -- dura | blanda | experimental
  fase         smallint,                         -- 1 | 2 | 3 (capa proceso)
  setup        text,                             -- iri_apertura | iri_continuacion | reingreso | NULL
  direccion    text not null default 'ambas',    -- ambas | alcista | bajista
  campo        text,                             -- activacion|secuencia|entrada|stop|gestion|invalidacion|notas
  es_checklist boolean not null default false,
  estado       text not null default 'vigente',  -- vigente | en_prueba | archivada
  orden        int default 0,
  peso         numeric default 1,
  activa       boolean not null default true,
  evidencia    text,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- 2. Seguridad (RLS activo en el proyecto)
alter table reglas enable row level security;
drop policy if exists auth_all on reglas;
create policy auth_all on reglas for all to authenticated using (true) with check (true);
grant select, insert, update, delete on reglas to authenticated, service_role;
grant usage, select on all sequences in schema public to authenticated, service_role;

-- 3. Migrar checklist_items → capa 'proceso' (es_checklist=true). codigo = clave.
insert into reglas (codigo, titulo, enunciado, capa, tipo, fase, direccion, es_checklist, estado, orden, peso, activa)
select clave, texto, texto, 'proceso', 'blanda', fase, 'ambas', true, 'vigente',
       coalesce(orden,0), coalesce(peso,1), coalesce(activo,true)
from checklist_items
on conflict (codigo) do nothing;

-- 4. Migrar setup_reglas → capa 'setup' (explotar los 7 campos en filas).
insert into reglas (codigo, titulo, enunciado, capa, tipo, setup, direccion, campo, es_checklist, estado, orden, activa)
select sr.setup || '_' || sr.direccion || '_' || c.campo,
       c.campo || ' · ' || sr.setup || ' (' || sr.direccion || ')',
       c.val, 'setup', 'blanda', sr.setup, sr.direccion, c.campo, false, 'vigente',
       coalesce(sr.orden,0), coalesce(sr.activa,true)
from setup_reglas sr
cross join lateral (values
  ('activacion',   sr.activacion),
  ('secuencia',    sr.secuencia),
  ('entrada',      sr.entrada),
  ('stop',         sr.stop),
  ('gestion',      sr.gestion),
  ('invalidacion', sr.invalidacion),
  ('notas',        sr.notas)
) as c(campo, val)
where c.val is not null and btrim(c.val) <> ''
on conflict (codigo) do nothing;

-- 5. Migrar estrategia_chaumer → capa 'filosofia' (narrativa). codigo = fil_<id>.
insert into reglas (codigo, titulo, enunciado, capa, tipo, direccion, es_checklist, estado, orden, activa)
select 'fil_' || id, titulo, contenido, 'filosofia', 'blanda', 'ambas', false, 'vigente',
       coalesce(orden,0), coalesce(activa,true)
from estrategia_chaumer
on conflict (codigo) do nothing;

-- 6. Marcar reglas DURAS (no negociables) según criterio del trader. Los 7 ítems
--    del checklist son duros; ajustables luego en la UI.
update reglas set tipo='dura'
where codigo in ('chk_cuenta_pa','chk_noticias','chk_zonas','chk_5velas','chk_consecucion','chk_estructura','chk_orden');

-- 6b. Reestructurar la regla de "5 velas": mide SOBREEXTENSIÓN, no el conteo exacto.
update reglas set
  titulo = 'Corrida no sobreextendida (referencia ~5 velas)',
  enunciado = 'No se mide el número exacto de velas, sino que la corrida del impulso NO esté sobreextendida. ~5 velas es el promedio de una corrida operable. Una corrida de MÁS de 5 velas sigue siendo VÁLIDA si NO está sobreextendida, cumpliendo las 3: (1) las últimas 2-3 velas desaceleran (notoriamente más pequeñas que las del impulso inicial); (2) el recorrido total no supera el rango promedio de las corridas recientes del día; (3) el precio no choca con una zona vigente / nivel clave antes del target. Inversamente, 3-4 velas largas, volátiles y sobreextendidas NO cumplen. El principio (nunca operar sobreextendido) es no negociable; el conteo de velas es solo una guía.'
where codigo = 'chk_5velas';

-- 7. Reglas de riesgo transversales que no eran un check explícito.
insert into reglas (codigo, titulo, enunciado, capa, tipo, direccion, es_checklist, estado, orden, activa) values
  ('stop_max_puntos', 'Stop máximo en PUNTOS (parametrizable)',
   'El stop se mide en PUNTOS, no en dólares. Con varios contratos el riesgo en dólares escala, pero lo que define la validez es el stop en puntos. Límite por defecto: 80 puntos (parametrizable en objetivos.stop_max_puntos; ajustable, p. ej. en mercado volátil). Si el stop supera el límite en puntos, la entrada es INVÁLIDA, sin importar cuántos contratos. Ej.: 70 pts × 3 contratos ($420) CUMPLE (<=80 pts); 50 pts × 4 contratos CUMPLE; 85 pts × 1 contrato NO cumple.',
   'riesgo', 'dura', 'ambas', false, 'vigente', 1, true),
  ('no_fomc', 'No operar en día FOMC',
   'Preferencia: no operar en días de reunión FOMC. Regla blanda, a criterio del trader.', 'riesgo', 'blanda', 'ambas', false, 'vigente', 2, true)
on conflict (codigo) do nothing;

-- 8. Trazabilidad: enlazar errores con la regla rota (FASE 1 solo añade la columna).
alter table diagnostico_errores add column if not exists regla_codigo text;

-- 8b. Umbral de stop en PUNTOS, parametrizable por el trader (default 80).
--     Reemplaza la medición en dólares (objetivos.stop_max_usd queda como histórico).
alter table objetivos add column if not exists stop_max_puntos numeric default 80;
update objetivos set stop_max_puntos = 80 where stop_max_puntos is null;

notify pgrst, 'reload schema';

-- Verificación (opcional):
--   select capa, count(*) from reglas group by capa order by capa;
--   select codigo, capa, tipo, es_checklist, fase from reglas order by capa, orden;
