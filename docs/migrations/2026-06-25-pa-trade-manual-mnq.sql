-- ─────────────────────────────────────────────────────────────────────────
-- Trade de la PA real (PA-APEX-232411-03) del 2026-06-25 que no se exportó
-- automáticamente (el indicador NT8 falló por permisos de service_role / RLS;
-- corregido en 2026-06-25-grants-service-role.sql, pero el mercado ya cerró).
--
-- En el CSV de NinjaTrader salen 2 filas (2 fills de 2 contratos), pero es UNA
-- sola operación de 4 contratos. Aquí se fusionan:
--   profit (NETO) = 262.40 + 262.40 = 524.80   (bruto 530.00 − comisión 5.20)
--   commission (round-trip total) = 2.60 + 2.60 = 5.20
--   mae = 50.00, mfe = 530.00  (doble del fill de 2 → escala con contratos)
--   etd = mfe − profit = 530.00 − 524.80 = 5.20
--
-- trade_number y cum_net_profit se calculan con subconsultas para no depender
-- del estado del secuencial ni de saber el último acumulado (evita colisiones).
-- Correr en el SQL Editor de Supabase.
-- ─────────────────────────────────────────────────────────────────────────

insert into trades
  (trade_number, account, instrument, trade_date, entry_time, exit_time,
   entry_price, exit_price, strategy, qty, market_pos, exit_name, resultado,
   profit, cum_net_profit, commission, mae, mfe, etd, bars)
values
  ((select coalesce(max(trade_number), 0) + 1 from trades),
   'PA-APEX-232411-03', 'MNQ 09-26', '2026-06-25', '08:38:03', '08:40:43',
   30025.50, 29959.25, 'K1', 4, 'Short', 'Target1', 'target',
   524.80,
   (select coalesce(sum(profit), 0) from trades) + 524.80,
   5.20, 50.00, 530.00, 5.20, 0);
