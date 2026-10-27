-- Restaura la operación del bot del 13/10/2026 (SimBot), que un reinicio de la estrategia borró.
--
-- El bot operó: Continuación alcista, orden a las 8:49, llenada 1 × 30795.25 a las 8:50, STOP a las 8:53
-- (−47,50 pts, −$95,00). A las 9:11 se reinició la estrategia; al rearmarse a las 9:12, el candado «ya operó
-- hoy» llamaba a NoArmado, que guardaba una fila NUEVA y vacía con merge-duplicates: pisó todas las columnas
-- con NULL y dejó «NO ARMADO». Arreglado en BotChaumer.cs (YaOperado: no toca la fila).
--
-- Los datos salen de Documentos\NinjaTrader 8\bot-chaumer\registro.txt (las líneas del 13/10) y siguen el
-- formato de las filas vecinas: las horas, la de la vela de NinjaTrader (14/10: STOP a las 8:33:27 → 8:34);
-- la salida, el stop (orden stop en simulación); sin comisión (SimBot no cobra). Los eventos del motor de ese
-- día no quedaron en el registro: se ponen las líneas de registro.txt y se dice.
--
-- Respaldo de la fila tal como estaba: _bak_20261027_bot_13_10 (RLS sin políticas, como los otros _bak).

create table if not exists _bak_20261027_bot_13_10 as
  select * from bot_operaciones where fecha = '2026-10-13' and cuenta = 'SimBot';
alter table _bak_20261027_bot_13_10 enable row level security;

update bot_operaciones set
  resultado = 'STOP', motivo = null, go = false,
  setup = 'Continuación', direccion = 1, hora_orden = '8:49',
  entrada = 30795.25, stop = 30747.75, objetivo = 30842.75, riesgo = 47.5, contratos = 1,
  hora_llenado = '8:50', precio_llenado = 30795.25, deslizamiento_ticks = 0,
  hora_salida = '8:53', precio_salida = 30747.75,
  puntos = -47.5, comision = 0, pnl_neto = -95.0,
  eventos = jsonb_build_array(
    '8:41  orden Reingreso bajista · 2 × entrada 30745.25 · stop 30772.00 · objetivo 30718.50 (no se llenó)',
    '8:49  orden Continuación alcista · 1 × entrada 30795.25 · stop 30747.75 · objetivo 30842.75',
    '8:50  llenada 1 × 30795.25',
    '8:53  STOP · −47,50 pts · neto −$95,00',
    'Fila restaurada el 27/10/2026 desde registro.txt: el reinicio de las 9:11 la había borrado. Lo que vio el motor ese día no quedó guardado.'
  ),
  actualizada_en = now()
where fecha = '2026-10-13' and cuenta = 'SimBot' and resultado = 'NO ARMADO';
