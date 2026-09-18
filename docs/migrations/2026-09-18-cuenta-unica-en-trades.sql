-- Una sola cuenta en `trades`, todas las de Apex en `apex_trades`
-- Diseño: docs/disenos/2026-09-18-cuenta-unica-en-trades.md
--
-- `trades` pasa a ser el journal de la CUENTA PRINCIPAL bajo una sola etiqueta
-- (hoy Sim101), y `apex_trades` la contabilidad de TODAS las cuentas de Apex.
-- Así Calendario y Análisis muestran el año entero seguido, y el Apex Tracker
-- deja de depender de `trades` para las tres cuentas que un día fueron principal.
--
-- Estado antes de aplicar (para revertir):
--   apex_trades.max(id) = 156
--   trades           = 109 filas · −$4.526,50 · 4 cuentas
--   apex_trades      =  34 filas (tipo 'trade') · −$2.572,94
--
-- Reversión:
--   update trades set account = cuenta_origen where cuenta_origen is not null;
--   delete from apex_trades where id > 156;

begin;

-- 1 · Trazabilidad: de qué cuenta venía cada trade antes de unificar la etiqueta.
--     Es la red para revertir y para saber dónde se operó de verdad.
alter table trades add column if not exists cuenta_origen text;

update trades set cuenta_origen = account where cuenta_origen is null;

-- 2 · Copiar a `apex_trades` las filas de cuentas de Apex (98: 80 PA-03, 12 -14, 6 -15).
--     `entry_time`/`exit_time` son `time` en trades y `text` en apex_trades.
--     `id` es identity BY DEFAULT: se genera solo.
--     `strategy` y `cum_net_profit` no existen en apex_trades y no se copian
--     (strategy solo está informada en 3 de las 98 filas; el original queda en trades).
insert into apex_trades (account, instrument, market_pos, qty, entry_price, exit_price,
                         entry_time, exit_time, exit_name, profit, commission,
                         mae, mfe, etd, bars, trade_date, resultado, tipo)
select t.account, t.instrument, t.market_pos, t.qty, t.entry_price, t.exit_price,
       t.entry_time::text, t.exit_time::text, t.exit_name, t.profit, t.commission,
       t.mae, t.mfe, t.etd, t.bars, t.trade_date, t.resultado, 'trade'
from trades t
where t.cuenta_origen <> 'Sim101'
  -- Guarda anti-duplicado: hoy no hay ni un solapamiento por (cuenta, fecha, hora),
  -- pero si la migración se reaplicara no debe volver a insertar.
  and not exists (
    select 1 from apex_trades a
    where a.account = t.account
      and a.trade_date = t.trade_date
      and a.entry_time = t.entry_time::text
      and a.tipo = 'trade'
  );

-- 3 · Unificar la etiqueta del journal.
update trades set account = 'Sim101';

commit;

-- PostgREST tiene que ver la columna nueva.
notify pgrst, 'reload schema';
