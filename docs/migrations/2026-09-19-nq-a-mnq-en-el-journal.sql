-- El único trade en NQ del journal pasa a MNQ, respetando el valor del punto
--
-- `trades` tiene un solo trade fuera de MNQ: el 24-jun-2026 (trade_number 86),
-- que venía de la PA-03. Al ser NQ, cada punto vale **$20** en vez de los $2 del
-- micro, y por eso 32,5 puntos en contra se convirtieron en −$653,80 con un solo
-- contrato — imposible de regularizar bajando contratos (ver D-020).
--
-- La conversión mantiene TODO lo que ocurrió de verdad —dirección, precios,
-- contratos y, sobre todo, los −32,5 PUNTOS— y solo cambia el multiplicador:
--
--   puntos      = 29695,75 − 29728,25 = −32,50   (Long, 1 contrato)
--   bruto NQ    = −32,50 × $20 × 1 = −$650,00  → profit −$653,80
--   bruto MNQ   = −32,50 × $2  × 1 =  −$65,00  → profit  −$66,30
--
--   mae 525 → 26,25 puntos → $52,50 en MNQ
--   mfe  70 →  3,50 puntos →  $7,00 en MNQ
--   etd = mfe − profit = 7,00 − (−66,30) = $73,30
--
-- Comisión: $1,30 round-trip, que es la que llevan los demás MNQ 09-26 de 1
-- contrato de esas mismas fechas (15–25 jun, importados de la PA). Los de $1,02
-- son posteriores y vienen del indicador.
--
-- ⚠️ `apex_trades` NO se toca. Ahí hay 17 trades en NQ que son operativa real de
--    las cuentas de evaluación: el NQ consumió drawdown de verdad a $20/punto, y
--    el drawdown es lo que decide si una cuenta se quema. Journal regularizado,
--    Apex real — la misma separación de D-019.
--
-- Efecto: P&L del journal −$2.488,58 → −$1.901,08. Con esto solo queda UN trade
-- fuera de ±160: el 6-feb (−$194,30), que no es tamaño sino un stop que se dejó
-- correr 96,5 puntos por encima del límite de 80.
--
-- El respaldo de este trade ya existe intacto en
-- `_bak_20260919_trades_regularizacion` (la regularización no lo tocó).
--
-- Reversión:
--   update trades t set instrument = b.instrument, profit = b.profit,
--          commission = b.commission, mae = b.mae, mfe = b.mfe, etd = b.etd
--   from _bak_20260919_trades_regularizacion b
--   where b.trade_number = t.trade_number and t.trade_number = 86;

update trades
set instrument = 'MNQ 09-26',
    profit     = -66.30,
    commission = 1.30,
    mae        = 52.50,
    mfe        = 7.00,
    etd        = 73.30
where trade_number = 86
  and instrument = 'NQ 09-26';
