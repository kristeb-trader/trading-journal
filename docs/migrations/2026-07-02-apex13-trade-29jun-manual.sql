-- Carga manual de un trade de Apex 13 (APEX-232411-13) del 2026-06-29 que no se
-- registró porque el indicador SupabaseAutoExport no estaba activo.
--
-- El CSV traía 2 patas (qty 2 y qty 1) de la MISMA posición short (misma entrada
-- 9:07:01 y salida 9:07:39). El indicador las fusiona en un solo trade de 3
-- contratos (promedio ponderado de precios, suma de profit/MAE/MFE) → así se
-- inserta aquí, para quedar idéntico a como lo habría guardado en vivo.
--
-- ⚠️ IMPORTANTE: `account` debe ser EXACTAMENTE el "número de cuenta" de Apex 13
--    tal como está guardado en la app (Apex Tracker → tarjeta de la cuenta).
--    Si no es 'APEX-232411-13', reemplázalo abajo antes de ejecutar.

insert into apex_trades
  (account, instrument, market_pos, qty, entry_price, exit_price,
   entry_time, exit_time, exit_name, profit, commission, mae, mfe, etd, bars,
   trade_date, resultado, tipo)
values
  ('APEX-232411-13', 'NQ 09-26', 'Short', 3, 29494.92, 29522.83,
   '09:07:01', '09:07:39', 'External', -1675, 0, 2345, 415, 2090, 0,
   '2026-06-29', 'otro', 'trade');
