-- chaumer_operativas.hora_entrada pasa de ET a hora de Colombia (17 sep 2026)
--
-- Hasta hoy la columna se documentaba en ET, pero Kris la rellenaba a veces en ET y
-- a veces en hora Colombia. Desde hoy se guarda y se muestra en hora Colombia, igual
-- que `trades.entry_time`, y se comparan sin convertir.
--
-- Solo se corrigen las 5 filas en las que la hora era ET SIN DUDA: mismo setup que
-- Kris y exactamente 1 h por delante de su entrada, o un IRI de apertura a las 9:3x
-- (en Colombia serían las 10:3x, fuera de la apertura). En esas fechas (ago–sep) ET
-- va 1 h por delante de Colombia.
--
-- Las dudosas (25 ago, 27 ago, 31 ago, 1 sep, 16 sep) y la errónea (28 ago, 21:52)
-- se quedan como están, tratadas como hora Colombia: decisión de Kris.

CREATE TABLE IF NOT EXISTS _bak_20260917_chaumer_horas AS
  SELECT id, fecha, hora_entrada FROM chaumer_operativas;
ALTER TABLE _bak_20260917_chaumer_horas ENABLE ROW LEVEL SECURITY;

UPDATE chaumer_operativas
   SET hora_entrada = hora_entrada - interval '1 hour',
       updated_at   = now()
 WHERE (fecha, hora_entrada) IN (
   ('2026-08-18'::date, '10:58'::time),
   ('2026-08-21'::date, '09:37'::time),
   ('2026-08-24'::date, '09:39'::time),
   ('2026-09-10'::date, '09:39'::time),
   ('2026-09-14'::date, '09:56'::time)
 );

COMMENT ON COLUMN chaumer_operativas.hora_entrada IS
  'Hora de entrada de Chaumer en hora de COLOMBIA (UTC-5), como trades.entry_time. Hasta el 17 sep 2026 era ET.';
