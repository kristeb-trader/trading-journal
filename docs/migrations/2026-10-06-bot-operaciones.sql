-- bot_operaciones: lo que hizo BotChaumer cada día en cada cuenta. Fase 3 de
-- docs/disenos/2026-10-06-bot-chaumer.md (§7) · D-038.
--
-- Por qué una tabla propia: los trades de SimBot no van a `trades` (el journal de la cuenta principal) ni a
-- `apex_trades` (las evaluaciones): una tabla, un rol (D-019), y SupabaseAutoExport ya ignora las cuentas de
-- simulación. Aquí va UNA fila por día y cuenta, también los días sin operación ("NO OPERA") y los días en que
-- un candado no dejó armarse ("NO ARMADO"): sin esa fila no se distingue "no operó" de "no estaba encendido".
--
-- La escribe el bot (service_role) con upsert sobre (fecha, cuenta). `coincide_motor` y `diferencia` los
-- rellenará la cadena diaria (fase 5) comparando con la ficha del motor. Los resultados del Strategy Analyzer
-- NO vienen aquí (van a un CSV local).
-- Horas: en hora Colombia y con el formato del motor ("8:38"), para compararlas con la ficha tal cual.
-- Precios y riesgo en PUNTOS (D-005); pnl_neto y comision en dólares, neto como `trades.profit` (D-002).

create table if not exists bot_operaciones (
  id                  bigint generated always as identity primary key,
  fecha               date not null,
  cuenta              text not null,
  modo                text not null check (modo in ('alerta', 'automatico')),
  sello_motor         text not null,
  go                  boolean,                       -- ¿había GO del checklist? NULL = no se pudo leer
  setup               text check (setup is null or setup in ('Continuación', 'Reingreso')),
  direccion           smallint check (direccion is null or direccion in (-1, 1)),
  hora_orden          text,
  entrada             numeric,
  stop                numeric,
  objetivo            numeric,
  riesgo              numeric,                       -- puntos, entrada → stop estructural
  contratos           integer,
  hora_llenado        text,
  precio_llenado      numeric,
  deslizamiento_ticks numeric,                       -- (llenado − entrada) en contra, en ticks
  hora_salida         text,
  precio_salida       numeric,
  resultado           text not null default 'EN CURSO'
                      check (resultado in ('EN CURSO', 'TARGET', 'STOP', 'ABIERTO', 'NO OPERA', 'NO ARMADO')),
  puntos              numeric,                       -- por contrato, con los precios reales, con signo
  comision            numeric,
  pnl_neto            numeric,
  motivo              text,                          -- por qué NO ARMADO, o una nota del bot
  eventos             jsonb not null default '[]'::jsonb,
  coincide_motor      boolean,
  diferencia          text,
  creada_en           timestamptz not null default now(),
  actualizada_en      timestamptz not null default now(),
  unique (fecha, cuenta)
);

comment on table bot_operaciones is
  'BotChaumer (D-038): una fila por día y cuenta, también sin operación. La escribe el bot con service_role. No se mezcla con trades ni apex_trades.';
comment on column bot_operaciones.sello_motor is
  'El SELLO de MotorChaumer.cs con el que operó: solo se compara con la ficha del motor si es el mismo motor.';
comment on column bot_operaciones.coincide_motor is
  'Lo rellena la cadena diaria (fase 5) al comparar con motor_fichas. NULL = sin comparar.';

alter table bot_operaciones enable row level security;
drop policy if exists auth_all on bot_operaciones;
create policy auth_all on bot_operaciones for all to authenticated using (true) with check (true);
grant select, insert, update, delete on bot_operaciones to authenticated, service_role;

notify pgrst, 'reload schema';
