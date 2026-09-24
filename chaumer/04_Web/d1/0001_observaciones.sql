-- Observaciones de la revisión del plan.
--
-- El portal es de entrada libre: no hay identidad verificada. El autor se
-- guarda tal como lo declara el navegador (nombre precargado en el enlace
-- que recibe el revisor), y por eso se guarda también la IP en forma de
-- huella, solo para poder frenar el ruido y limpiar si hiciera falta.
--
-- Una observación NO modifica el plan. El plan solo cambia si el operador
-- cambia 01_Plan/. Esta tabla deja constancia; no toca la fuente.

CREATE TABLE IF NOT EXISTS observaciones (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,

  -- A qué está anclada. 'general' es una observación sobre el plan entero.
  ancla_tipo    TEXT NOT NULL
                CHECK (ancla_tipo IN ('regla','termino','caso','parametro',
                                      'pendiente','subfase','general')),
  ancla_id      TEXT,               -- R-08, CORRIDA, G-11, STOP_MAX, P-21…
  ancla_titulo  TEXT,               -- para leer la lista sin resolver nada

  -- El trozo de texto que el revisor tenía seleccionado, si lo había.
  cita          TEXT,

  texto         TEXT NOT NULL,
  autor         TEXT NOT NULL DEFAULT 'anónimo',

  estado        TEXT NOT NULL DEFAULT 'nueva'
                CHECK (estado IN ('nueva','revisada','aplicada','descartada')),
  respuesta     TEXT,
  respondida_en TEXT,

  huella        TEXT,               -- hash de IP, solo para frenar el ruido
  creada_en     TEXT NOT NULL DEFAULT (datetime('now')),
  actualizada_en TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Buscar las observaciones de un elemento concreto es la consulta más común:
-- cada regla pide las suyas al abrirse.
CREATE INDEX IF NOT EXISTS idx_obs_ancla  ON observaciones (ancla_tipo, ancla_id);

-- La pantalla del operador ordena por estado y por fecha.
CREATE INDEX IF NOT EXISTS idx_obs_estado ON observaciones (estado, creada_en DESC);

-- El freno al ruido cuenta cuántas ha escrito la misma huella en la última hora.
CREATE INDEX IF NOT EXISTS idx_obs_huella ON observaciones (huella, creada_en);
