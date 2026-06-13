-- ─────────────────────────────────────────────────────────────────────────
-- Carga de trades reales de Apex-12 desde el CSV de NinjaTrader
-- (4 trades agrupados por día). Reemplaza el snapshot inicial.
-- La cuenta se quemó el 12/06: balance 49169.50 < threshold 49192.
-- Threshold reconstruido desde picos intradía (MFE); verificar con Rithmic.
-- P&L acumulado = -830.50 (= Cum. net profit del CSV). Correr en SQL Editor.
-- ─────────────────────────────────────────────────────────────────────────

do $$
declare
  cta_id bigint;
begin
  select id into cta_id from apex_cuentas where nombre = 'Apex-12';
  if cta_id is null then
    raise exception 'No existe la cuenta Apex-12';
  end if;

  -- Limpiar registros previos de esta cuenta (incluye el snapshot inicial)
  delete from apex_registros where cuenta_id = cta_id;

  -- Insertar los 3 días reales
  insert into apex_registros (cuenta_id, fecha, pnl_dia, balance, threshold, contratos, nota) values
    (cta_id, '2026-06-10',  1100.00, 51100.00, 49115, 1, 'Long NQ a target — día verde'),
    (cta_id, '2026-06-11', -1225.50, 49874.50, 49192, 1, 'Stop fuerte en NQ (-1230)'),
    (cta_id, '2026-06-12',  -705.00, 49169.50, 49192, 1, 'Breach — balance bajo el piso, cuenta quemada');

  -- Marcar la cuenta como quemada e inactiva
  update apex_cuentas
    set estado = 'quemada', activa = false,
        notas = 'Quemada el 12/06/2026: balance 49169.50 < threshold 49192 (trailing intradía)'
    where id = cta_id;
end $$;
