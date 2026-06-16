-- ─────────────────────────────────────────────────────────────────────────
-- Pieza 3 de la solución de routing: el trade de la PA real del 2026-06-16
-- (+115.98) se exportó por error a `apex_trades` (id=2) porque la cuenta
-- estaba mal marcada en NinjaTrader ese día. Lo movemos a la tabla `trades`
-- (journal) y lo borramos de apex_trades.
--
-- A partir de ahora el routing es automático por nombre de cuenta en el
-- indicador (v2.5): toda cuenta "PA-..." va a `trades` + Telegram, así que
-- esto no debería volver a pasar.
--
-- profit = NETO (115.98). cum_net_profit continúa la cadena cronológica de
-- la PA: trade 81 (06-15) tenía 3354.50 → 3354.50 + 115.98 = 3470.48.
-- (cum_net_profit es solo archivo; la app recalcula la curva desde profit.)
-- Correr en el SQL Editor de Supabase.
-- ─────────────────────────────────────────────────────────────────────────

insert into trades
  (trade_number, account, instrument, trade_date, entry_time, exit_time,
   entry_price, exit_price, strategy, qty, market_pos, exit_name, resultado,
   profit, cum_net_profit, commission, mae, mfe, etd, bars)
values
  (82, 'PA-APEX-232411-03', 'MNQ 09-26', '2026-06-16', '09:22:31', '09:30:18',
   30712.50, 30654.00, null, 1, 'Short', 'Target1', 'target',
   115.98, 3470.48, 1.02, 80.00, 81.00, -34.98, 8);

delete from apex_trades where id = 2;
