-- Los setups se reducen a dos: Continuación y Reingreso (18 sep 2026)
--
-- Antes: familias `iri` + `reingreso` y 6 variantes (IRI Apertura Alcista/Bajista,
-- IRI Continuación Alcista/Bajista, Reingreso Alcista/Bajista).
-- Después: familias `continuacion` + `reingreso` y 4 variantes.
--
-- Mapeo pedido por Kris:
--   IRI Apertura Alcista     → Continuación Alcista
--   IRI Apertura Bajista     → Continuación Bajista
--   IRI Continuación Alcista → Continuación Alcista
--   IRI Continuación Bajista → Continuación Bajista
--   Reingreso *              → igual
--
-- La apertura deja de distinguirse en el histórico: es lo que se pide. Respaldo
-- completo en las tablas `_bak_20260918_*` por si hubiera que reconstruirla.
--
-- Los textos de las reglas siguen diciendo IRI: describen la mecánica
-- Impulso-Retroceso-Impulso, no el nombre del setup (decisión de Kris).

-- ── Respaldos ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS _bak_20260918_setups AS
  SELECT * FROM catalogo_setups;
CREATE TABLE IF NOT EXISTS _bak_20260918_setup_variantes AS
  SELECT * FROM catalogo_setup_variantes;
CREATE TABLE IF NOT EXISTS _bak_20260918_sesiones_setup AS
  SELECT sesion_date, setup, setup_codigo, setup_observado FROM sesiones;
CREATE TABLE IF NOT EXISTS _bak_20260918_chaumer_setup AS
  SELECT id, fecha, setup_codigo FROM chaumer_operativas;
CREATE TABLE IF NOT EXISTS _bak_20260918_reglas_setup AS
  SELECT codigo, setup FROM catalogo_reglas;
ALTER TABLE _bak_20260918_setups           ENABLE ROW LEVEL SECURITY;
ALTER TABLE _bak_20260918_setup_variantes  ENABLE ROW LEVEL SECURITY;
ALTER TABLE _bak_20260918_sesiones_setup   ENABLE ROW LEVEL SECURITY;
ALTER TABLE _bak_20260918_chaumer_setup    ENABLE ROW LEVEL SECURITY;
ALTER TABLE _bak_20260918_reglas_setup     ENABLE ROW LEVEL SECURITY;

-- ── 1. La familia `iri` pasa a ser `continuacion` ───────────────────────────
-- catalogo_setup_variantes.setup_codigo tiene ON UPDATE CASCADE: se propaga solo.
UPDATE catalogo_setups
   SET codigo = 'continuacion', nombre = 'Continuación', orden = 1
 WHERE codigo = 'iri';
UPDATE catalogo_setups SET orden = 2 WHERE codigo = 'reingreso';

-- Las reglas apuntan a la familia por texto, sin FK: hay que moverlas a mano.
UPDATE catalogo_reglas SET setup = 'continuacion', updated_at = now()
 WHERE setup = 'iri';

-- ── 2. Las variantes de continuación se renombran ───────────────────────────
-- sesiones.setup_codigo y chaumer_operativas.setup_codigo también son
-- ON UPDATE CASCADE, así que las filas históricas siguen el renombrado.
UPDATE catalogo_setup_variantes
   SET codigo = 'continuacion_alcista', nombre = 'Continuación Alcista', subtipo = NULL, orden = 1
 WHERE codigo = 'iri_continuacion_alcista';
UPDATE catalogo_setup_variantes
   SET codigo = 'continuacion_bajista', nombre = 'Continuación Bajista', subtipo = NULL, orden = 2
 WHERE codigo = 'iri_continuacion_bajista';
UPDATE catalogo_setup_variantes SET orden = 3 WHERE codigo = 'reingreso_alcista';
UPDATE catalogo_setup_variantes SET orden = 4 WHERE codigo = 'reingreso_bajista';

-- ── 3. Las aperturas se funden en continuación ──────────────────────────────
UPDATE sesiones SET setup_codigo = 'continuacion_alcista'
 WHERE setup_codigo = 'iri_apertura_alcista';
UPDATE sesiones SET setup_codigo = 'continuacion_bajista'
 WHERE setup_codigo = 'iri_apertura_bajista';
UPDATE chaumer_operativas SET setup_codigo = 'continuacion_alcista', updated_at = now()
 WHERE setup_codigo = 'iri_apertura_alcista';
UPDATE chaumer_operativas SET setup_codigo = 'continuacion_bajista', updated_at = now()
 WHERE setup_codigo = 'iri_apertura_bajista';

-- ── 4. Fuera las variantes viejas ───────────────────────────────────────────
DELETE FROM catalogo_setup_variantes
 WHERE codigo IN ('iri_apertura_alcista', 'iri_apertura_bajista');

-- ── 5. Los textos ───────────────────────────────────────────────────────────
-- `sesiones.setup` lo sincroniza el trigger fn_sync_setup_codigo cuando cambia
-- el código, pero no en las filas que solo se movieron por CASCADE: se fuerza.
-- De paso arregla 2 filas viejas que decían "IRI Alcista".
UPDATE sesiones s
   SET setup = v.nombre
  FROM catalogo_setup_variantes v
 WHERE v.codigo = s.setup_codigo
   AND s.setup IS DISTINCT FROM v.nombre;

-- `setup_observado` es texto libre (el setup que vio y no tomó): no tiene FK.
UPDATE sesiones SET setup_observado = 'Continuación Alcista'
 WHERE setup_observado IN ('IRI Apertura Alcista', 'IRI Continuación Alcista', 'IRI Alcista');
UPDATE sesiones SET setup_observado = 'Continuación Bajista'
 WHERE setup_observado IN ('IRI Apertura Bajista', 'IRI Continuación Bajista', 'IRI Bajista');

-- `diagnosticos_diarios.setups_json` NO se toca: es lo que el Coach escribió ese
-- día, en prosa. Reescribirlo sería falsear un histórico de análisis.

NOTIFY pgrst, 'reload schema';
