-- Regularizar el journal a un máximo de ±$160 por trade
--
-- Kris pidió que los trades que se pasaron de ±160 **por haber operado con más
-- contratos** queden dentro de ese rango, bajando el número de contratos y
-- dejando el resto de campos coherentes. Los PUNTOS que se movió el precio no
-- se tocan: entry_price y exit_price se quedan como están.
--
-- ⚠️ Esto REESCRIBE operaciones reales. No es una corrección de datos falsos:
--    el journal deja de reflejar lo que de verdad se operó. `apex_trades`
--    conserva las copias con los contratos reales, así que el Apex Tracker
--    sigue mostrando el drawdown verdadero. Las dos tablas divergen a propósito.
--
-- Alcance: 22 trades fuera de ±160, de los cuales se ajustan 20.
--   Los otros 2 YA están en 1 contrato y no se pueden bajar más (decisión de
--   Kris el 19-sep: se quedan como están):
--     · 2026-02-06 · MNQ · 1 contrato · −$194,30 · −96,5 puntos (rompió el stop de 80)
--     · 2026-06-24 · NQ  · 1 contrato · −$653,80 · −32,5 puntos ($20/punto)
--
-- Efecto: P&L del journal −$4.526,50 → −$2.488,58
--
-- La DISCIPLINA no cambia: `mae` y `qty` se escalan a la vez, así que el MAE en
-- puntos —que es lo que evalúa la regla del stop máximo— da idéntico.
--
-- Reversión:
--   update trades t set qty = b.qty, profit = b.profit, commission = b.commission,
--          mae = b.mae, mfe = b.mfe, etd = b.etd, cum_net_profit = b.cum_net_profit
--   from _bak_20260919_trades_regularizacion b where b.trade_number = t.trade_number;

begin;

-- 1 · Respaldo completo antes de tocar nada.
create table if not exists _bak_20260919_trades_regularizacion as
select * from trades;

-- 2 · Ajuste.
with calc as (
  select trade_number,
         qty,
         profit / qty                      as ppc,   -- profit por contrato (neto)
         commission / qty                  as cpc,   -- comisión por contrato (round-trip)
         floor(160 / abs(profit / qty))::int as qty_new
  from trades
  where abs(profit) > 160
    and floor(160 / abs(profit / qty)) >= 1          -- deja fuera los irreducibles
)
update trades t
set qty        = c.qty_new,
    profit     = round((c.qty_new * c.ppc)::numeric, 2),
    commission = round((c.qty_new * c.cpc)::numeric, 2),
    mae        = round((t.mae * c.qty_new::numeric / c.qty)::numeric, 2),
    mfe        = round((t.mfe * c.qty_new::numeric / c.qty)::numeric, 2),
    -- etd = mfe − profit, la misma fórmula que usa el indicador al exportar.
    etd        = round((t.mfe * c.qty_new::numeric / c.qty - c.qty_new * c.ppc)::numeric, 2),
    -- El acumulado venía de NinjaTrader y ya no cuadra con nada. No se usa en la
    -- app; dejarlo sería un número mentiroso.
    cum_net_profit = null
from calc c
where c.trade_number = t.trade_number;

commit;
