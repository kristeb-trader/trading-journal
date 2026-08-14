-- 2026-08-14 · Mover el trade del 14-ago de la Apex-15 a `trades`  [APLICADO vía MCP]
--
-- CONTEXTO. `SupabaseAutoExport` enruta por nombre de cuenta: `PA-*` y la CUENTA
-- PRINCIPAL van a `trades` (+ Telegram); el resto a `apex_trades` sin notificar.
-- El indicador lee `objetivos.cuenta_principal` UNA SOLA VEZ, al arrancar.
--
-- Qué pasó el 14-ago:
--   09:28  se opera con APEX-232411-15 → en ese momento la principal era la -14,
--          así que el trade se enrutó a `apex_trades` (correcto para esa config).
--   13:12  se cambia `objetivos.cuenta_principal` a APEX-232411-15.
-- El trade quedó en la tabla equivocada y la cuenta no aparecía en el calendario:
-- el selector de cuentas se construye desde las cuentas presentes en `trades`.
--
-- Se mueve SOLO el trade del 14. Los del 12 y 13 se quedan en `apex_trades` porque
-- esos días se replicó la operativa en la -14 y el mismo trade ya está en `trades`
-- bajo esa cuenta: moverlos contaría la pérdida dos veces en el journal.
--
-- ⚠️ NO duplicar en ambas tablas. `apex.js` hace
--      [...apex_trades, ...trades].filter(t => t.account === cta.numero_cuenta)
--    asumiendo que cada cuenta vive en UNA sola tabla. Duplicar haría que el Apex
--    Tracker contase el trade dos veces e inflase el drawdown consumido — el número
--    que decide si la cuenta se quema. Con el trade solo en `trades` se ve igual en
--    las dos vistas, que es justo el caso de la Apex-14.

INSERT INTO trades (account, instrument, trade_date, entry_time, exit_time, entry_price, exit_price,
                    qty, market_pos, exit_name, resultado, profit, commission, mae, mfe, etd, bars)
SELECT account, instrument, trade_date, entry_time::time, exit_time::time, entry_price, exit_price,
       qty, market_pos, exit_name, resultado, profit, commission, mae, mfe, etd, bars
FROM apex_trades
WHERE account = 'APEX-232411-15' AND trade_date = '2026-08-14' AND tipo = 'trade'
  AND NOT EXISTS (SELECT 1 FROM trades t
                   WHERE t.account = 'APEX-232411-15'
                     AND t.trade_date = '2026-08-14'
                     AND t.entry_time = '09:28:11'::time);

DELETE FROM apex_trades
 WHERE account = 'APEX-232411-15' AND trade_date = '2026-08-14' AND tipo = 'trade';

-- Verificación: journal 1 trade (−434,14) · Apex Tracker 3 trades (−1.222,38) · 0 duplicados
SELECT 'Calendario (trades)' AS vista, count(*) AS trades, round(sum(profit)::numeric,2) AS pnl
  FROM trades WHERE account = 'APEX-232411-15'
UNION ALL
SELECT 'Apex Tracker (apex_trades + trades)', count(*), round(sum(profit)::numeric,2)
  FROM (SELECT profit FROM apex_trades WHERE account='APEX-232411-15' AND tipo='trade'
        UNION ALL
        SELECT profit FROM trades      WHERE account='APEX-232411-15') u
UNION ALL
SELECT 'DUPLICADOS (debe ser 0)', count(*), NULL
  FROM trades t JOIN apex_trades a
    ON a.account = t.account AND a.trade_date = t.trade_date AND a.entry_time::time = t.entry_time
 WHERE t.account = 'APEX-232411-15';
