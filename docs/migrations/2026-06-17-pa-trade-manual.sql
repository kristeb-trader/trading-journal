-- ─────────────────────────────────────────────────────────────────────────
-- Trade de la PA real (PA-APEX-232411-03) del 2026-06-17 que no se exportó
-- automáticamente: la instancia del indicador de la PA no se disparó hoy
-- (tras recompilar a v2.5). El Apex eval sí exportó; el routing/código están
-- bien — fue la instancia de NinjaTrader la que no capturó el trade.
--
-- Datos del CSV oficial de NinjaTrader (Trade Performance grid).
-- profit = NETO (-146.80 = bruto -145.50 menos comisión 1.30).
-- cum_net_profit continúa la cadena PA: #82 (06-16) 3470.48 - 146.80 = 3323.68.
-- Correr en el SQL Editor de Supabase.
-- ─────────────────────────────────────────────────────────────────────────

insert into trades
  (trade_number, account, instrument, trade_date, entry_time, exit_time,
   entry_price, exit_price, strategy, qty, market_pos, exit_name, resultado,
   profit, cum_net_profit, commission, mae, mfe, etd, bars)
values
  (83, 'PA-APEX-232411-03', 'MNQ 09-26', '2026-06-17', '08:39:40', '08:41:52',
   30401.00, 30473.75, 'K1', 1, 'Short', 'Stop1', 'stop',
   -146.80, 3323.68, 1.30, 145.50, 6.00, 152.80, 0);
