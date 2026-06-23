-- ─────────────────────────────────────────────────────────────────────────
-- Trade manual de Apex-11 (NQ) del 2026-06-23.
-- Se operó sin el indicador SupabaseAutoExport corriendo, así que se inserta a
-- mano en apex_trades (cuenta de evaluación). Convención del proyecto:
--   profit = NETO  ·  commission = round-trip
-- El CSV reportó Commission $0 pero Cum.net = $1.200 vs Profit bruto $1.210,
-- así que el neto real es $1.200 y la comisión/fees ≈ $10.
-- Correr UNA sola vez en el SQL Editor de Supabase.
-- ─────────────────────────────────────────────────────────────────────────

insert into apex_trades
  (account, instrument, market_pos, qty, entry_price, exit_price,
   entry_time, exit_time, exit_name, profit, commission, mae, mfe, etd, bars,
   trade_date, resultado)
values
  ('APEX-232411-11', 'NQ 09-26', 'Long', 1, 29925, 29985.5,
   '08:59:20', '09:01:26', 'Target1', 1200, 10, 295, 1210, 0, 0,
   '2026-06-23', 'target');

notify pgrst, 'reload schema';
