-- Bitácora del backtesting operativo.
--
-- Christian hace el backtesting VISUAL a mano sobre el mercado pasado. Estas
-- tablas guardan lo que él ya decidió: no leen mercado, no aplican reglas.
--
-- SQL corriente a propósito: nada de datetime('now') ni de funciones propias
-- de SQLite. Las marcas de tiempo las genera el código, en ISO. Así estas
-- tablas se traducen a PostgreSQL sin tocar el esquema el día que haga falta.
--
-- El prefijo bt_ las separa de las observaciones, que viven en la misma base.

-- Los datos de inicio. Una sola fila, id = 1. Es la PROPUESTA para la próxima
-- jornada, no la verdad del pasado: cada jornada congela lo suyo.
CREATE TABLE IF NOT EXISTS bt_cabecera (
  id             INTEGER PRIMARY KEY CHECK (id = 1),
  valor_inicial  REAL NOT NULL DEFAULT 0,
  contratos      INTEGER NOT NULL DEFAULT 1,
  instrumento    TEXT NOT NULL DEFAULT 'MNQ',
  actualizada_en TEXT NOT NULL
);

-- Una jornada. Puede no tener ninguna operación: un día en el que no se
-- entró es un dato, y se registra igual con su nota.
CREATE TABLE IF NOT EXISTS bt_jornadas (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  fecha        TEXT NOT NULL UNIQUE,        -- yyyy-mm-dd

  -- Congelados al guardar. Si mañana cambian los datos de inicio, esta
  -- jornada NO se mueve: su P&L se calculó con estos tres números.
  instrumento  TEXT NOT NULL,
  contratos    INTEGER NOT NULL,
  valor_punto  REAL NOT NULL,               -- USD por punto, sale de reglas.json

  imagen       TEXT,                        -- clave en R2, o NULL
  notas        TEXT,

  creada_en      TEXT NOT NULL,
  actualizada_en TEXT NOT NULL
);

-- Una operación. Cuelga de su jornada y se va con ella.
CREATE TABLE IF NOT EXISTS bt_operaciones (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  jornada_id  INTEGER NOT NULL REFERENCES bt_jornadas(id) ON DELETE CASCADE,
  orden       INTEGER NOT NULL DEFAULT 0,   -- por si un día hay más de una

  hora        TEXT NOT NULL,                -- hh:mm, hora Colombia
  direccion   TEXT NOT NULL CHECK (direccion IN ('largo','corto')),
  setup       TEXT NOT NULL CHECK (setup IN ('continuacion','reingreso')),

  -- SIEMPRE en positivo. El signo lo pone el resultado, y así «40 en stop»
  -- no se puede confundir nunca con «-40 en stop», que daría ganancia.
  puntos      REAL NOT NULL CHECK (puntos >= 0),
  resultado   TEXT NOT NULL CHECK (resultado IN ('target','stop')),

  -- Calculado AL GUARDAR: puntos x valor_punto x contratos, negativo si stop.
  -- Se guarda porque el operador lo quiere en la tabla; se calcula al escribir
  -- y no al mostrar para que corregir los contratos no reescriba el pasado.
  pnl         REAL NOT NULL,

  observaciones TEXT
);

-- La pantalla pide las jornadas por fecha descendente, y las operaciones de
-- cada jornada en su orden. Son las dos únicas consultas que hay.
CREATE INDEX IF NOT EXISTS idx_bt_jornadas_fecha ON bt_jornadas (fecha DESC);
CREATE INDEX IF NOT EXISTS idx_bt_ops_jornada    ON bt_operaciones (jornada_id, orden);
