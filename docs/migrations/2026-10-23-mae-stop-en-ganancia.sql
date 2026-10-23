-- Corrige 2026-10-23-mae-trades-mismo-minuto.sql en una fila (23/10/2026).
--
-- Aquella daba a toda salida por stop el MAE = |entrada − salida|. Vale cuando el stop
-- se salta en pérdida (el peor precio fue el de salida), NO cuando el stop estaba movido
-- a ganancia: el 23/06 (APEX-232411-11, +$6,96) esa distancia fue A FAVOR, y quedó como
-- 2,25 puntos en contra. Con el stop en ganancia el MAE no se puede saber: NULL.
-- La fila está respaldada en _bak_20261023_mae_apex.

update apex_trades a set mae = null
from _bak_20261023_mae_apex b
where a.id = b.id and a.exit_name ilike 'stop%' and a.profit + coalesce(a.commission, 0) > 0;

update trades t set mae = null
from _bak_20261023_mae_trades b
where t.trade_date = b.trade_date and t.account = b.account and t.entry_time = b.entry_time
  and t.exit_name ilike 'stop%' and t.profit + coalesce(t.commission, 0) > 0;
