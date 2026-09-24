-- La comisión del bróker. Pedida por el operador el 09/09/2026: 1,02 USD.
--
-- Va en los datos de inicio, como el valor inicial y los contratos, y sigue
-- el mismo criterio que ellos: la cabecera es la PROPUESTA para la próxima
-- jornada, y cada jornada congela la que se le aplicó. Cambiar la comisión
-- de hoy no reescribe lo de ayer.
--
-- Desde aquí el P&L guardado es NETO: lo que de verdad entra o sale de la
-- cuenta. Un día sin operación no paga comisión, porque no hubo operación.

-- La tarifa vigente, la que se propone al registrar.
ALTER TABLE bt_cabecera   ADD COLUMN comision REAL NOT NULL DEFAULT 0;

-- La tarifa con la que se calculó esta jornada. Congelada.
ALTER TABLE bt_jornadas   ADD COLUMN comision REAL NOT NULL DEFAULT 0;

-- Lo que se cobró en esta operación: tarifa x contratos. Se guarda el importe
-- y no solo la tarifa, para que la fila se explique sola sin ir a buscar nada.
ALTER TABLE bt_operaciones ADD COLUMN comision REAL NOT NULL DEFAULT 0;
