-- Los parámetros, en un solo sitio y con su historial (17/11/2026, fase 1; diseño aprobado en el chat,
-- checkpoint 2026-11-17 de docs/historial-proyecto.md).
--
-- Hasta hoy los números vivían repartidos: PARAMETROS.md → reglas.json (el motor y el bot), objetivos
-- (stop_max_puntos, stop_max_usd), la casilla de Estrategia y textos con 80 y $160 escritos a mano.
-- Kris (17/11): «unos parámetros únicamente para el bot, y otros para la estrategia y medir la
-- disciplina… parámetros por cuenta».
--
--   parametros_claves   el catálogo: qué parámetros hay, si son de cada perfil o comunes, y si se editan.
--   parametros_perfiles los perfiles («Mi operativa», «Bot»).
--   parametros_cuentas  qué perfil usa cada cuenta. Una cuenta sin fila usa el perfil predeterminado.
--   parametros_valores  cada valor con su fecha de inicio (`desde`). Nunca se pisa: un cambio es una fila
--                       nueva, así cada día se juzga con el valor que tenía ese día.
--
-- Riesgo y gestión van por perfil (perfil NOT NULL); la lectura del mercado es común (perfil NULL):
-- el motor lee el día una vez, y el juicio de Kris y el del bot salen de las mismas zonas.
-- ATM_DEFECTO no se guarda: es STOP_MAX en ticks (PARAMETROS.md: «si cambia STOP_MAX, hay que cambiar
-- ATM_DEFECTO con él»), y lo calcula parametros_vigentes.

create table if not exists parametros_claves (
  clave     text primary key,
  ambito    text not null check (ambito in ('perfil', 'comun')),
  grupo     text not null check (grupo in ('riesgo', 'mercado', 'tecnico')),
  etiqueta  text not null,
  unidad    text,
  editable  boolean not null default true,
  calculado boolean not null default false,
  orden     int not null default 0
);

create table if not exists parametros_perfiles (
  codigo         text primary key,
  nombre         text not null,
  descripcion    text,
  predeterminado boolean not null default false,
  creado_at      timestamptz not null default now()
);
create unique index if not exists parametros_perfiles_un_predeterminado
  on parametros_perfiles (predeterminado) where predeterminado;

create table if not exists parametros_cuentas (
  cuenta         text primary key,
  perfil         text not null references parametros_perfiles (codigo),
  actualizada_at timestamptz not null default now()
);

create table if not exists parametros_valores (
  id        bigserial primary key,
  clave     text not null references parametros_claves (clave),
  perfil    text references parametros_perfiles (codigo),
  numero    numeric,
  texto     text,
  desde     date not null,
  nota      text,
  creado_at timestamptz not null default now(),
  check (numero is not null or texto is not null)
);
-- Un valor por clave, perfil y fecha (perfil NULL = común).
create unique index if not exists parametros_valores_unico
  on parametros_valores (clave, coalesce(perfil, ''), desde);

-- Que una clave de perfil lleve perfil y una común no lo lleve.
create or replace function fn_parametros_valores_ambito() returns trigger
language plpgsql as $$
declare a text;
begin
  select ambito into a from parametros_claves where clave = new.clave;
  if a = 'perfil' and new.perfil is null then
    raise exception 'El parámetro % es de cada perfil: falta el perfil', new.clave;
  elsif a = 'comun' and new.perfil is not null then
    raise exception 'El parámetro % es común a todos los perfiles: no lleva perfil', new.clave;
  end if;
  if (select calculado from parametros_claves where clave = new.clave) then
    raise exception 'El parámetro % se calcula: no se guarda', new.clave;
  end if;
  return new;
end $$;
drop trigger if exists trg_parametros_valores_ambito on parametros_valores;
create trigger trg_parametros_valores_ambito before insert or update on parametros_valores
  for each row execute function fn_parametros_valores_ambito();

-- Los valores vigentes en una fecha para un perfil: los comunes + los del perfil, con la forma de la clave
-- `parametros` de reglas.json ({CLAVE: {numero, texto}}), más `desde`. Lo leerán el bot, el motor y la web.
create or replace function parametros_vigentes(p_fecha date, p_perfil text)
returns jsonb language sql stable as $$
  with v as (
    select distinct on (pv.clave) pv.clave, pv.numero, pv.texto, pv.desde
    from parametros_valores pv
    where pv.desde <= p_fecha and (pv.perfil is null or pv.perfil = p_perfil)
    order by pv.clave, pv.desde desc
  ), base as (
    select coalesce(jsonb_object_agg(clave, jsonb_build_object('numero', numero, 'texto', texto, 'desde', desde)), '{}'::jsonb) j
    from v
  )
  select case
    when (select numero from v where clave = 'STOP_MAX') is not null
     and (select numero from v where clave = 'TICK') is not null
    then j || jsonb_build_object('ATM_DEFECTO', jsonb_build_object(
           'numero', ((select numero from v where clave = 'STOP_MAX') / (select numero from v where clave = 'TICK'))::int,
           'texto', ((select numero from v where clave = 'STOP_MAX') / (select numero from v where clave = 'TICK'))::int || ' ticks ÷ contratos',
           'desde', (select desde from v where clave = 'STOP_MAX')))
    else j end
  from base
$$;

-- Lo mismo para una cuenta: su perfil, o el predeterminado si no tiene.
create or replace function parametros_de_cuenta(p_fecha date, p_cuenta text)
returns jsonb language sql stable as $$
  select parametros_vigentes(p_fecha, coalesce(
    (select perfil from parametros_cuentas where cuenta = p_cuenta),
    (select codigo from parametros_perfiles where predeterminado)))
$$;

alter table parametros_claves   enable row level security;
alter table parametros_perfiles enable row level security;
alter table parametros_cuentas  enable row level security;
alter table parametros_valores  enable row level security;
drop policy if exists auth_all on parametros_claves;
drop policy if exists auth_all on parametros_perfiles;
drop policy if exists auth_all on parametros_cuentas;
drop policy if exists auth_all on parametros_valores;
create policy auth_all on parametros_claves   for all to authenticated using (true) with check (true);
create policy auth_all on parametros_perfiles for all to authenticated using (true) with check (true);
create policy auth_all on parametros_cuentas  for all to authenticated using (true) with check (true);
create policy auth_all on parametros_valores  for all to authenticated using (true) with check (true);
grant select, insert, update, delete on parametros_claves, parametros_perfiles, parametros_cuentas, parametros_valores
  to authenticated, service_role;
grant usage, select on sequence parametros_valores_id_seq to authenticated, service_role;
revoke execute on function parametros_vigentes(date, text), parametros_de_cuenta(date, text) from public, anon;
grant execute on function parametros_vigentes(date, text), parametros_de_cuenta(date, text) to authenticated, service_role;

notify pgrst, 'reload schema';
