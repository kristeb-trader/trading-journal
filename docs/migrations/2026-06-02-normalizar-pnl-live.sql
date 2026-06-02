-- ════════════════════════════════════════════════════════════════════════
-- Normalización P&L — trades de la "era live" del script (mayo 2026)
-- Convención: profit = NETO (comisión descontada) · commission = round-trip
-- Ejecutar en el SQL Editor de Supabase: https://jothoslozctflfrnysrx.supabase.co
--
-- Contexto: el script enviaba profit BRUTO y comisión de una sola pata (o 0).
-- Los datos históricos (CSV) ya están netos, así que alineamos estos a neto.
-- Todos los trades afectados son qty 1 → comisión round-trip = $1.30.
-- ════════════════════════════════════════════════════════════════════════

-- Verificación previa: revisar los trades ANTES de tocar nada
-- SELECT trade_number, trade_date, entry_time, qty, profit, commission, resultado
-- FROM trades
-- WHERE trade_date BETWEEN '2026-05-17' AND '2026-06-02'
-- ORDER BY trade_date, entry_time;

-- ── Corrección uno a uno (identificados por fecha + hora de entrada) ────────
-- profit_nuevo = profit_bruto - 1.30 ; commission = 1.30

UPDATE trades SET profit = 92.20,  commission = 1.30
  WHERE trade_date = '2026-06-02' AND entry_time = '08:33:26';   -- era 93.5 / 0.65

UPDATE trades SET profit = 89.20,  commission = 1.30
  WHERE trade_date = '2026-05-28' AND entry_time = '08:40:00';   -- era 90.5 / 0.65

UPDATE trades SET profit = 65.20,  commission = 1.30
  WHERE trade_date = '2026-05-26' AND entry_time = '09:19:12';   -- era 66.5 / 0.65

UPDATE trades SET profit = -132.30, commission = 1.30
  WHERE trade_date = '2026-05-22' AND entry_time = '08:37:05';   -- era -131 / 0.65

UPDATE trades SET profit = 119.70, commission = 1.30
  WHERE trade_date = '2026-05-19' AND entry_time = '08:36:04';   -- era 121 / 1.30 (bruto)

UPDATE trades SET profit = -35.30, commission = 1.30
  WHERE trade_date = '2026-05-17' AND entry_time = '20:24:16';   -- era -34 / 0

UPDATE trades SET profit = -14.80, commission = 1.30
  WHERE trade_date = '2026-05-17' AND entry_time = '19:53:12';   -- era -13.5 / 0

-- ── Verificación posterior ─────────────────────────────────────────────────
-- SELECT trade_number, trade_date, entry_time, qty, profit, commission
-- FROM trades
-- WHERE trade_date BETWEEN '2026-05-17' AND '2026-06-02'
-- ORDER BY trade_date, entry_time;

-- ════════════════════════════════════════════════════════════════════════
-- ⚠️ ANOMALÍAS — NO incluidas arriba. Revisar manualmente antes de decidir:
--
--   2026-05-19  profit = 1190  commission = 0   (entry_time ~08:36:03)
--     → 595 puntos en un MNQ qty 1 es imposible. Parece error de captura.
--       Si confirmas el valor real, lo corregimos aparte.
--
--   2026-02-09  profit = -520  commission = 19.5  qty 5  (CSV histórico)
--     → comisión luce inflada (round-trip qty 5 ≈ $6.50). Dato viejo;
--       revisar si el -520 ya es neto correcto.
-- ════════════════════════════════════════════════════════════════════════
