-- ═══════════════════════════════════════════════════════════════════════════
-- Normalización del checklist diario (Modelo 2 relacional)
-- 2026-07-08  ·  Fase A del rediseño
--
-- QUÉ HACE:
--   1. Renombra `reglas` → `catalogo_reglas` (catálogo único de reglas por capas
--      y fases; las es_checklist=true son el "Checklist de Reglas").
--   2. Crea `sesion_checklist`: 1 fila por (sesión × regla de checklist).
--      Reemplaza al JSONB `sesiones.checklist` y a las columnas `chk_*`.
--   3. Dos triggers que garantizan "todo true por defecto" sin dañar disciplina:
--        · sesión nueva  → materializa las reglas de checklist en true.
--        · regla nueva   → la backfillea en TODAS las sesiones en true.
--   4. Migra el JSONB actual a filas (valor del JSONB, o true si falta).
--   5. RLS + grants sobre la tabla nueva.
--
-- ⚠️ ESTE SCRIPT ROMPE LA WEB/ADDON VIEJOS (el rename quita `reglas`). Córrelo
--    junto con el deploy de la web nueva (Fase B) y recompila el AddOn (Fase C).
--    NO borra el JSONB todavía: queda como red de seguridad. El drop va en el
--    archivo 2026-07-08-drop-sesiones-checklist-jsonb.sql, tras verificar.
--
-- Idempotente donde se puede (if not exists / or replace). El rename NO es
-- idempotente: si ya corriste el paso 1, sáltalo.
-- Correr en el SQL Editor de Supabase.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. Rename del catálogo + clave única para la FK ──────────────────────────
alter table reglas rename to catalogo_reglas;

-- `codigo` debe ser único para ser destino de FK (idempotente vía índice único).
create unique index if not exists catalogo_reglas_codigo_key on catalogo_reglas (codigo);

-- ── 2. Tabla del "hecho" diario: sesion_checklist ───────────────────────────
create table if not exists sesion_checklist (
  sesion_date  date        not null references sesiones(sesion_date) on delete cascade,
  regla_codigo text        not null references catalogo_reglas(codigo) on update cascade on delete restrict,
  cumplido     boolean     not null default true,
  updated_at   timestamptz not null default now(),
  primary key (sesion_date, regla_codigo)
);
create index if not exists idx_sesion_checklist_regla on sesion_checklist (regla_codigo);

-- ── 3. RLS + grants (patrón del proyecto: authenticated vía política, service_role vía grant) ──
alter table sesion_checklist enable row level security;
drop policy if exists auth_all on sesion_checklist;
create policy auth_all on sesion_checklist for all to authenticated using (true) with check (true);
grant select, insert, update, delete on sesion_checklist to authenticated, service_role;

-- ── 4. Triggers que mantienen "todo true por defecto" ───────────────────────
-- 4a. Al crear una sesión → materializa todas las reglas de checklist en true.
--     (El form/AddOn luego hacen UPSERT de las que el trader marque distinto.)
create or replace function fn_materializar_checklist_sesion() returns trigger
language plpgsql as $$
begin
  insert into sesion_checklist (sesion_date, regla_codigo, cumplido)
  select new.sesion_date, r.codigo, true
    from catalogo_reglas r
   where r.es_checklist = true
  on conflict (sesion_date, regla_codigo) do nothing;
  return new;
end $$;

drop trigger if exists trg_materializar_checklist on sesiones;
create trigger trg_materializar_checklist
  after insert on sesiones
  for each row execute function fn_materializar_checklist_sesion();

-- 4b. Al crear (o marcar es_checklist=true) una regla → backfill en TODAS las
--     sesiones en true, sin pisar valores ya existentes (no daña disciplina).
create or replace function fn_backfill_regla_checklist() returns trigger
language plpgsql as $$
begin
  if new.es_checklist = true then
    insert into sesion_checklist (sesion_date, regla_codigo, cumplido)
    select s.sesion_date, new.codigo, true
      from sesiones s
    on conflict (sesion_date, regla_codigo) do nothing;
  end if;
  return new;
end $$;

drop trigger if exists trg_backfill_regla on catalogo_reglas;
create trigger trg_backfill_regla
  after insert or update of es_checklist on catalogo_reglas
  for each row execute function fn_backfill_regla_checklist();

-- ── 5. Migración de datos: JSONB actual → filas ─────────────────────────────
-- Para cada (sesión × regla de checklist): usa el valor del JSONB si existe;
-- si falta (regla más nueva que la sesión, o dato inexistente) → true.
insert into sesion_checklist (sesion_date, regla_codigo, cumplido)
select s.sesion_date, r.codigo,
       coalesce((s.checklist ->> r.codigo)::boolean, true)
  from sesiones s
  cross join catalogo_reglas r
 where r.es_checklist = true
on conflict (sesion_date, regla_codigo) do nothing;

notify pgrst, 'reload schema';

-- ── Verificación (opcional) ─────────────────────────────────────────────────
--   Filas creadas (esperado ≈ nº sesiones × nº reglas checklist):
--     select count(*) from sesion_checklist;
--   Cuadre por sesión (cada día debe tener tantas filas como reglas checklist):
--     select sesion_date, count(*) from sesion_checklist group by 1 order by 1;
--   Que el valor migrado coincide con el JSONB en una fecha concreta:
--     select regla_codigo, cumplido from sesion_checklist
--     where sesion_date = 'YYYY-MM-DD' order by regla_codigo;
