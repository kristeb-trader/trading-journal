-- MAE / MFE de los trades que abrieron y cerraron dentro del mismo minuto (23/10/2026).
--
-- SupabaseAutoExport medía el peor y el mejor precio en OnBarUpdate con
-- Calculate.OnBarClose, es decir, solo al CERRAR cada vela de 1 minuto. Un trade que
-- abría y cerraba dentro de la misma vela nunca veía un cierre y se guardaba con
-- MAE = MFE = 0 (el 20/10: −$168 con 0 «en contra»). El indicador ya se arregló
-- (OnMarketData); esto corrige los 9 que quedaron guardados:
--   · salida por stop    → MAE exacto (el peor precio fue el de salida); MFE sin dato
--   · salida por objetivo → MFE exacto (el mejor precio fue el de salida); MAE sin dato
--   · salida a mano      → los dos sin dato
-- «Sin dato» es NULL, no 0: db.js lee NULL como «sin evidencia» y 0 como «0 puntos en
-- contra», que aprobaba el stop máximo y el riesgo. etd = mfe − profit, o NULL.
-- $ por punto: MNQ = 2, NQ = 20 (D-005). Respaldo en _bak_20261023_mae_*.

create table if not exists _bak_20261023_mae_trades as
  select * from trades
  where mae = 0 and mfe = 0 and entry_time is not null and abs(profit) > 6;
alter table _bak_20261023_mae_trades enable row level security;

create table if not exists _bak_20261023_mae_apex as
  select * from apex_trades
  where mae = 0 and mfe = 0 and entry_time is not null and abs(profit) > 6;
alter table _bak_20261023_mae_apex enable row level security;

update trades t set
  mae = case when t.exit_name ilike 'stop%' then
          round(abs(t.entry_price - t.exit_price) * (case when t.instrument ilike 'MNQ%' then 2 else 20 end) * t.qty, 2) end,
  mfe = case when t.exit_name ilike 'target%' then
          round(abs(t.exit_price - t.entry_price) * (case when t.instrument ilike 'MNQ%' then 2 else 20 end) * t.qty, 2) end,
  etd = case when t.exit_name ilike 'target%' then
          round(abs(t.exit_price - t.entry_price) * (case when t.instrument ilike 'MNQ%' then 2 else 20 end) * t.qty - t.profit, 2) end
where t.mae = 0 and t.mfe = 0 and t.entry_time is not null and abs(t.profit) > 6;

update apex_trades t set
  mae = case when t.exit_name ilike 'stop%' then
          round(abs(t.entry_price - t.exit_price) * (case when t.instrument ilike 'MNQ%' then 2 else 20 end) * t.qty, 2) end,
  mfe = case when t.exit_name ilike 'target%' then
          round(abs(t.exit_price - t.entry_price) * (case when t.instrument ilike 'MNQ%' then 2 else 20 end) * t.qty, 2) end,
  etd = case when t.exit_name ilike 'target%' then
          round(abs(t.exit_price - t.entry_price) * (case when t.instrument ilike 'MNQ%' then 2 else 20 end) * t.qty - t.profit, 2) end
where t.mae = 0 and t.mfe = 0 and t.entry_time is not null and abs(t.profit) > 6;
