-- ─────────────────────────────────────────────────────────────────────────
-- Checklist dinámico: el checklist de disciplina deja de ser columnas fijas
-- (chk_*) y pasa a un CATÁLOGO editable (checklist_items) + una columna JSONB
-- en sesiones (checklist) con las respuestas por día, keyed por la `clave`.
--
-- Modelo:
--   checklist_items  → la "lista maestra" (1 fila por ítem; editable desde la app)
--   sesiones.checklist (JSONB) → { "<clave>": true/false } por sesión
--
-- Las columnas chk_* se CONSERVAN (compatibilidad con el bot de Telegram y como
-- red de seguridad). Se backfillean al JSONB. Se podrán eliminar más adelante.
-- Correr en el SQL Editor de Supabase.
-- ─────────────────────────────────────────────────────────────────────────

-- 1. Catálogo de ítems del checklist
create table if not exists checklist_items (
  id           bigint generated always as identity primary key,
  clave        text unique not null,           -- estable; para los 7 actuales = nombre de la columna chk_*
  fase         smallint not null default 1,    -- 1 Pre-sesión | 2 Lectura del setup | 3 Ejecución
  texto        text not null,
  orden        int default 0,
  activo       boolean default true,
  obligatorio  boolean default false,          -- reservado para medición futura (hard-rule)
  peso         numeric default 1,              -- reservado para medición futura (cumplimiento ponderado)
  created_at   timestamptz default now()
);

alter table checklist_items disable row level security;
grant select, insert, update, delete on checklist_items to anon;
grant usage, select on all sequences in schema public to anon;

-- 2. Respuestas por día (JSONB) en sesiones
alter table sesiones add column if not exists checklist jsonb default '{}'::jsonb;

-- 3. Seed: los 7 ítems actuales (clave = nombre de la columna chk_* para backfill directo)
insert into checklist_items (clave, fase, texto, orden) values
  ('chk_cuenta_pa',   1, 'Cuenta PA activa — verificada visualmente en la plataforma', 1),
  ('chk_noticias',    1, 'Calendario económico verificado (sin noticia roja)',         2),
  ('chk_zonas',       1, 'Zonas vigentes verificadas',                                 3),
  ('chk_5velas',      2, 'Máx 5 velas en el impulso de la corrida',                    1),
  ('chk_consecucion', 2, 'Zona marcada con rompimiento + consecución + retroceso',     2),
  ('chk_estructura',  2, 'Estructura de Impulso + Retroceso + Impulso, fluida',        3),
  ('chk_orden',       3, 'Orden precolocada a tiempo',                                 1)
on conflict (clave) do nothing;

-- 4. Backfill: vuelca las columnas chk_* de cada sesión al JSONB (false si NULL)
update sesiones set checklist = jsonb_build_object(
  'chk_cuenta_pa',   coalesce(chk_cuenta_pa,   false),
  'chk_noticias',    coalesce(chk_noticias,    false),
  'chk_zonas',       coalesce(chk_zonas,       false),
  'chk_5velas',      coalesce(chk_5velas,      false),
  'chk_consecucion', coalesce(chk_consecucion, false),
  'chk_estructura',  coalesce(chk_estructura,  false),
  'chk_orden',       coalesce(chk_orden,       false)
)
where checklist is null or checklist = '{}'::jsonb;

-- 5. Tabla legacy `reglas` (no se usa en el código actual; reemplazada por
--    setup_reglas + estrategia_chaumer). Verifica que esté vacía y elimínala:
--      select count(*) from reglas;   -- si da 0, descomenta la línea de abajo
-- drop table if exists reglas;

notify pgrst, 'reload schema';
