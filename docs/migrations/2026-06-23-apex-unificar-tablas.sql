-- ─────────────────────────────────────────────────────────────────────────
-- Unificación de tablas Apex: apex_registros + apex_trades → una sola tabla.
--
-- apex_trades pasa a ser la ÚNICA tabla. Cada fila es:
--   tipo='trade' → un trade individual (detalle completo: instrumento, hora, qty…)
--   tipo='dia'   → un día manual/agregado (solo fecha + P&L + balance/piso + nota)
--
-- Los días manuales CONSERVAN su balance/piso guardados (verdad ajustada a
-- Rithmic, sobre todo los 105 días reconstruidos de PA-03). La app respeta esos
-- valores y no los recalcula.
--
-- IMPORTANTE: este script NO borra apex_registros todavía. Corre el script,
-- verifica en la app que todas las cuentas muestran lo mismo, y SOLO ENTONCES
-- ejecuta el drop comentado al final.
-- Correr en el SQL Editor de Supabase.
-- ─────────────────────────────────────────────────────────────────────────

-- 1. Columnas nuevas en apex_trades para soportar filas de día
alter table apex_trades
  add column if not exists tipo      text default 'trade',
  add column if not exists balance   numeric,
  add column if not exists threshold numeric,
  add column if not exists contratos int,
  add column if not exists nota      text;

-- Asegura que las filas existentes (trades) queden marcadas como 'trade'
update apex_trades set tipo = 'trade' where tipo is null;

-- 2. Migrar los días manuales de apex_registros → apex_trades como tipo='dia'
--    (account = número de cuenta; los días no tienen detalle de trade)
insert into apex_trades (account, trade_date, profit, balance, threshold, contratos, nota, tipo, created_at)
select c.numero_cuenta, r.fecha, r.pnl_dia, r.balance, r.threshold, r.contratos, r.nota, 'dia', r.created_at
from apex_registros r
join apex_cuentas c on c.id = r.cuenta_id
where c.numero_cuenta is not null;

notify pgrst, 'reload schema';

-- 3. Verificación (opcional) — debe coincidir con lo que tenías:
--    select account, tipo, count(*) from apex_trades group by account, tipo order by account, tipo;

-- 4. SOLO tras verificar en la app que todo cuadra, elimina la tabla vieja:
--    drop table apex_registros;
