-- Los valores de partida de los parámetros (17/11/2026, fase 1). Tablas en 2026-11-17-parametros.sql.
--
-- Comunes y perfil «Bot»: los de chaumer/01_Plan/PARAMETROS.md (plan 3.62), con la fecha de su fila
-- «Desde» o la de su versión en HISTORIAL.md. Lo que no tiene fecha escrita va desde el inicio del plan
-- (21/08/2026) con esa nota.
-- Perfil «Mi operativa»: 80 pts / $160 hasta el 30/09 y 100 pts / $200 desde el 01/10/2026 (Kris, 17/11:
-- «sí, perfiles por cuenta», «desde el 01/10»). El bot se queda en 80 / $160.
-- Idempotente: on conflict do nothing.

insert into parametros_claves (clave, ambito, grupo, etiqueta, unidad, editable, calculado, orden) values
  ('STOP_MAX',            'perfil', 'riesgo',  'Stop máximo',                       'pts',       true,  false, 10),
  ('RIESGO_MAX',          'perfil', 'riesgo',  'Riesgo máximo por operación',       'USD',       true,  false, 20),
  ('ATM_DEFECTO',         'perfil', 'riesgo',  'Stop por defecto de la orden (ATM)', 'ticks',    false, true,  30),
  ('OPS_POR_SESION',      'perfil', 'riesgo',  'Operaciones por día',               null,        true,  false, 40),
  ('RATIO_TARGET',        'perfil', 'riesgo',  'Objetivo (ratio)',                  ': 1',       true,  false, 50),
  ('UMBRAL_VOL',          'comun',  'mercado', 'Umbral de volumen de premercado',   'contratos', true,  false, 110),
  ('VENTANA_NOTICIA',     'comun',  'mercado', 'Ventana de la noticia roja',        '± min',     true,  false, 120),
  ('PLAZO_CONSECUCION',   'comun',  'mercado', 'Plazo de la consecución',           'velas',     true,  false, 130),
  ('VENTANA_OPERATIVA',   'comun',  'mercado', 'Ventana operativa',                 null,        true,  false, 140),
  ('CANCELACION_FINAL',   'comun',  'mercado', 'Cancelación final',                 null,        true,  false, 150),
  ('CIERRE_POR_HORA',     'comun',  'mercado', 'Cierre por hora',                   null,        true,  false, 160),
  ('PREMERCADO_INICIO',   'comun',  'mercado', 'Inicio del premercado',             null,        true,  false, 170),
  ('TICK',                'comun',  'tecnico', 'Tick',                              'pts',       false, false, 210),
  ('UMBRAL_50',           'comun',  'tecnico', 'Umbral de la zona entre zonas',     '%',         false, false, 220),
  ('VENTANA_REINGRESO',   'comun',  'tecnico', 'Ventana del reingreso',             null,        false, false, 230),
  ('ORIGEN_DEL_STOP',     'comun',  'tecnico', 'Origen del stop',                   null,        false, false, 240),
  ('VUELTA_EN_VELA_DESDE','comun',  'tecnico', 'Vuelta dentro de la vela, desde',   'fecha',     false, false, 250),
  ('BLOQUE_DESDE',        'comun',  'tecnico', 'Apéndice en bloque, desde',         'fecha',     false, false, 260)
on conflict (clave) do nothing;

insert into parametros_perfiles (codigo, nombre, descripcion, predeterminado) values
  ('operativa', 'Mi operativa', 'Lo que opera Kris: la estrategia y la disciplina', true),
  ('bot',       'Bot',          'Lo que opera BotChaumer: el plan de Chaumer',       false)
on conflict (codigo) do nothing;

insert into parametros_cuentas (cuenta, perfil) values
  ('Sim101',         'operativa'),
  ('APEX-232411-15', 'operativa'),
  ('SimBot',         'bot')
on conflict (cuenta) do nothing;

insert into parametros_valores (clave, perfil, numero, texto, desde, nota) values
  -- Bot = el plan
  ('STOP_MAX',       'bot', 80,  '80 puntos',          '2026-08-24', 'plan 1.4'),
  ('RIESGO_MAX',     'bot', 160, '$160 por operación', '2026-10-05', 'plan 3.44: el tope pasa a ser de dinero'),
  ('OPS_POR_SESION', 'bot', 1,   '1 llenada',          '2026-08-21', null),
  ('RATIO_TARGET',   'bot', 1,   '1:1',                '2026-08-21', null),
  -- Mi operativa
  ('STOP_MAX',       'operativa', 80,  '80 puntos',          '2026-08-24', 'el del plan'),
  ('STOP_MAX',       'operativa', 100, '100 puntos',         '2026-10-01', 'Kris, 17/11/2026: holgura sobre los 80 del plan'),
  ('RIESGO_MAX',     'operativa', 160, '$160 por operación', '2026-08-24', 'el del plan'),
  ('RIESGO_MAX',     'operativa', 200, '$200 por operación', '2026-10-01', 'Kris, 17/11/2026: 100 pts con 1 MNQ'),
  ('OPS_POR_SESION', 'operativa', 1,   '1 llenada',          '2026-08-21', null),
  ('RATIO_TARGET',   'operativa', 1,   '1:1',                '2026-08-21', null),
  -- Comunes
  ('UMBRAL_VOL',        null, 6000, '> 6.000 contratos en MNQ', '2026-09-06', 'antes, > 2.000 en NQ'),
  ('UMBRAL_VOL',        null, 8000, '> 8.000 contratos en MNQ', '2026-09-14', 'plan 3.4'),
  ('VENTANA_NOTICIA',   null, 5,    '±5 minutos',               '2026-08-21', 'desde el inicio del plan'),
  ('PLAZO_CONSECUCION', null, 5,    '5 velas',                  '2026-08-21', 'desde el inicio del plan'),
  ('VENTANA_OPERATIVA', null, null, '09:30–11:30 ET',           '2026-08-21', 'desde el inicio del plan'),
  ('CANCELACION_FINAL', null, null, '11:29 ET',                 '2026-08-21', 'desde el inicio del plan'),
  ('CIERRE_POR_HORA',   null, null, '16:50 ET',                 '2026-10-09', 'plan 3.46'),
  ('PREMERCADO_INICIO', null, null, '19:00 hora Colombia (apertura de Tokio)', '2026-08-21', 'desde el inicio del plan'),
  ('TICK',              null, 0.25, '0,25 puntos',              '2026-08-21', null),
  ('UMBRAL_50',         null, 50,   '50 %',                     '2026-08-21', 'desde el inicio del plan'),
  ('VENTANA_REINGRESO', null, null, 'mientras la zona esté viva', '2026-10-22', 'plan 3.51'),
  ('ORIGEN_DEL_STOP',   null, null, 'desde que nació la zona hasta la vela de rompimiento', '2026-08-27', null),
  ('VUELTA_EN_VELA_DESDE', null, 20261021, '20261021 (21/10/2026)',    '2026-10-21', 'plan 3.49'),
  ('BLOQUE_DESDE',      null, 20000101, '20000101 (todos los días)',  '2026-10-29', 'extendido a todos los días')
on conflict do nothing;
