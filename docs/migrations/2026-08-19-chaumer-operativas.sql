-- ═══════════════════════════════════════════════════════════════════════════
-- chaumer_operativas — las operativas de Chaumer, para compararlas con las mías
-- 2026-08-19
--
-- QUÉ RESUELVE
-- Kris entró al curso de Chaumer y tiene acceso a sus operativas. Quiere ver día
-- a día lo que hizo él frente a lo que hizo Kris, y un dashboard de diferencias
-- que responda "¿en qué estoy fallando?".
--
-- MODELO — lo que NO está aquí importa tanto como lo que sí
-- Esta tabla guarda SOLO el lado de Chaumer. El lado de Kris ya existe en
-- `sesiones` + `trades` y se lee de ahí: duplicarlo daría dos copias que se
-- desincronizan, que es exactamente el problema que ya hubo con la disciplina
-- replicada en 4 sitios.
--
-- El veredicto de cada día (Igual / Ejecución / Otra lectura / Fuga / De más /
-- Ambos fuera) tampoco se guarda: se calcula cruzando esta tabla con `sesiones`
-- y `trades`, así que no puede quedar obsoleto.
--
-- Y el "por qué no entré" se escribe en `sesiones.motivo_no_entrada`, el campo
-- que ya existe y que rellena el Diario — no en una columna nueva de aquí.
--
-- DOS CONVENCIONES QUE EL ESQUEMA NO CUENTA
--   · `hora_entrada` va en HORA DE NUEVA YORK (ET). Es la única columna de hora
--     del proyecto que NO viene de NinjaTrader: `trades.entry_time` está en hora
--     de Colombia y hay que convertirlo con `horaEt()` antes de compararlos.
--     Restarlas a pelo da 60 min de error en verano.
--   · `puntos` va en PUNTOS, con signo, nunca en dólares. Kris y Chaumer no
--     operan el mismo tamaño, así que comparar dinero no significa nada.
--
-- Diseño: docs/disenos/2026-08-19-chaumer-vs-yo.md (v2), Fase 1 de 4.
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists chaumer_operativas (
  id              bigint generated always as identity primary key,
  fecha           date    not null unique,          -- 1 fila = 1 día (decisión de Kris)
  opero           boolean not null default true,    -- false = ese día se quedó fuera
  setup_codigo    text    references catalogo_setup_variantes(codigo) on update cascade,
  hora_entrada    time,                             -- ET, ver cabecera
  resultado       text    check (resultado in ('target','stop','be','parcial')),
  puntos          numeric(8,2),                     -- +/- en PUNTOS, ver cabecera
  contexto        text    check (contexto in ('Alcista','Bajista','Mixto')),
  imagen_url      text,                             -- Cloudinary, mismo preset del resto
  notas           text,                             -- "la operativa": lo que explicó
  motivo_no_opero text,                             -- solo cuando opero = false
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  -- Un día sin operativa no puede traer setup, hora, resultado ni puntos: si los
  -- trajera, el cálculo del veredicto contaría como "operó" un día que no operó.
  constraint chaumer_no_opero_vacio check (
    opero or (setup_codigo is null and hora_entrada is null
              and resultado is null and puntos is null)
  ),
  -- Y al revés: un día operado no lleva motivo de no haber operado.
  constraint chaumer_opero_sin_motivo check (
    not opero or motivo_no_opero is null
  )
);

comment on table chaumer_operativas is
  'Operativas de Chaumer, una por día. Solo su lado: el de Kris se lee de sesiones+trades. hora_entrada en ET; puntos en PUNTOS, no dólares.';

-- ── RLS ────────────────────────────────────────────────────────────────────
-- Misma política que las otras 18 tablas: `anon` sin políticas (la clave
-- anónima viaja en el JS), `authenticated` todo, `service_role` ignora RLS.
alter table chaumer_operativas enable row level security;
drop policy if exists auth_all on chaumer_operativas;
create policy auth_all on chaumer_operativas
  for all to authenticated using (true) with check (true);
grant select, insert, update, delete on chaumer_operativas to authenticated, service_role;

-- Sin esto PostgREST sigue sirviendo el esquema viejo y la app falla con un
-- error que no apunta a la causa.
notify pgrst, 'reload schema';
