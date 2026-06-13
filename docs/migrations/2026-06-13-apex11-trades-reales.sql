-- ─────────────────────────────────────────────────────────────────────────
-- Carga de trades reales de Apex-11 desde el CSV de NinjaTrader
-- (16 fills agrupados por día). Reemplaza el snapshot inicial de prueba.
-- Threshold = 48000 todo el tramo: la cuenta nunca superó los 50K, el trail
-- intradía no subió. Verificado: P&L acumulado = -677.00 (= Cum. net profit).
-- Correr en Supabase SQL Editor.
-- ─────────────────────────────────────────────────────────────────────────

do $$
declare
  cta_id bigint;
begin
  select id into cta_id from apex_cuentas where nombre = 'Apex-11';
  if cta_id is null then
    raise exception 'No existe la cuenta Apex-11';
  end if;

  -- Limpiar registros previos de esta cuenta (incluye el snapshot inicial)
  delete from apex_registros where cuenta_id = cta_id;

  -- Insertar los 5 días reales
  insert into apex_registros (cuenta_id, fecha, pnl_dia, balance, threshold, contratos, nota) values
    (cta_id, '2026-06-03', -1600.00, 48400.00, 48000, 1, 'Stop inicial — NQ full size'),
    (cta_id, '2026-06-04',   255.50, 48655.50, 48000, 3, '10 fills MNQ — recuperación'),
    (cta_id, '2026-06-05',   236.00, 48891.50, 48000, 2, 'Short MNQ a target'),
    (cta_id, '2026-06-10',   219.50, 49111.00, 48000, 1, '2 longs MNQ a target'),
    (cta_id, '2026-06-12',   212.00, 49323.00, 48000, 1, '2 longs MNQ a target');
end $$;
