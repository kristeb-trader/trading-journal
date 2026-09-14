-- 2026-09-14 · Tarjeta nueva para la Apex-15 renovada  [APLICADO vía MCP]
--
-- CONTEXTO. La APEX-232411-15 se quemó el 8-sep (balance 47.805,06 < piso 48.000).
-- Kris la renovó el viernes 11-sep y Apex conserva el MISMO número de cuenta, así
-- que NT8 exporta los trades de las dos etapas con el mismo AccountName.
--
-- El Tracker reparte los trades entre tarjetas con el mismo número POR PERIODO
-- (`periodoDe` en js/apex.js): cada una desde su fecha_inicio hasta el día antes de
-- que empiece la siguiente. Por eso la tarjeta vieja (id 6, fecha_inicio 12-ago)
-- no se toca: su periodo se cierra solo el 10-sep al existir esta.
--
-- Mismos parámetros que la id 6 (confirmado por Kris).
-- Diseño: docs/disenos/2026-09-14-apex-cuenta-renovada.md

insert into apex_cuentas
  (nombre, numero_cuenta, tamano, balance_inicial, drawdown_max, profit_target,
   safety_net_balance, piso_congelado, min_dias, contratos_max, estado, fecha_inicio,
   activa, notas, plan_perfil, plan_ritmo)
values
  ('Apex-15 · 2ª', 'APEX-232411-15', 50000, 50000, 2000, 3000,
   52100, 50100, 7, null, 'evaluacion', '2026-09-11',
   true, 'Renovación de la Apex-15 (quemada el 8-sep). Mismo número de cuenta.', 'moderado', 'equilibrado');
