-- ─────────────────────────────────────────────────────────────────────────
-- Trade de la PA real (PA-APEX-232411-03) del 2026-06-15 que no se exportó
-- automáticamente (cuenta mal marcada en NinjaTrader ese día).
-- profit = NETO (-96.30 = bruto -95.00 menos comisión 1.30). Acumulado PA
-- previo = 1170.80 → nuevo cum 1074.50. Correr en Supabase SQL Editor.
-- ─────────────────────────────────────────────────────────────────────────

insert into trades
  (trade_number, account, instrument, trade_date, entry_time, exit_time,
   entry_price, exit_price, strategy, qty, market_pos, exit_name, resultado,
   profit, cum_net_profit, commission, mae, mfe, etd, bars)
values
  (81, 'PA-APEX-232411-03', 'MNQ 09-26', '2026-06-15', '08:35:21', '08:40:31',
   30698.50, 30651.00, 'K1', 1, 'Long', 'Stop1', 'stop',
   -96.30, 1074.50, 1.30, 95.00, 41.00, 137.30, 0);
