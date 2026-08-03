-- 2026-08-03 · Rediseño del checklist — FASE 1 (BD)   [APLICADA vía MCP]
-- Plan completo: docs/plan-rediseno-checklist-disciplina.md
--
-- Resumen: 17 reglas → 13 por día · GO de 13 clics → 8 · 3 reglas pasan a
-- verificarse solas · 0 reglas obligan a marcar hechos que aún no ocurrieron.
--
-- ⚠️ Esta fase solo toca la BD. El JS todavía no interpreta `aplica_si` ni
-- `evidencia`, así que las 3 reglas "auto" se siguen leyendo de sesion_checklist
-- hasta la Fase 2. El único efecto inmediato en la métrica es la salida de
-- `rr_1a1` del checklist.

-- ═══ 1. ESTRUCTURA ════════════════════════════════════════════════════════

-- bloquea_go: si true, la casilla debe estar marcada para poder dar GO. Las
--   reglas que describen hechos posteriores a la entrada (consecución, stop
--   real, gestión) van en false: antes obligaban a marcar lo que aún no había
--   ocurrido, forzando a elegir entre disciplina y no perder el trade.
-- aplica_si: tercer eje de aplicabilidad. Hoy una regla se filtra por FASE y
--   por FAMILIA DE SETUP; faltaba el CONTEXTO DEL DÍA.
ALTER TABLE catalogo_reglas
  ADD COLUMN IF NOT EXISTS bloquea_go boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS aplica_si  text    NOT NULL DEFAULT 'siempre';

ALTER TABLE catalogo_reglas DROP CONSTRAINT IF EXISTS catalogo_reglas_aplica_si_chk;
ALTER TABLE catalogo_reglas ADD CONSTRAINT catalogo_reglas_aplica_si_chk
  CHECK (aplica_si IN ('siempre','dia_fomc','hay_noticia'));

COMMENT ON COLUMN catalogo_reglas.bloquea_go IS
  'true = hay que marcarla para dar GO. false = se resuelve después de entrar.';
COMMENT ON COLUMN catalogo_reglas.aplica_si IS
  'Condición de contexto del día: siempre | dia_fomc | hay_noticia.';
COMMENT ON COLUMN catalogo_reglas.evidencia IS
  'Cómo se responde la regla: auto (la calcula el sistema) | declarada (la marca el trader).';
COMMENT ON COLUMN catalogo_reglas.campo IS
  'Qué dato la verifica cuando evidencia = auto.';

-- Tabla de noticias rojas: varias por día, con hora y nombre. Reemplaza al texto
-- suelto `sesiones.hora_noticia_roja`, que en la práctica solo admitía una y cuyo
-- NULL significaba a la vez "no había noticias" y "no lo revisé".
CREATE TABLE IF NOT EXISTS sesion_noticias (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  sesion_date date NOT NULL REFERENCES sesiones(sesion_date) ON UPDATE CASCADE ON DELETE CASCADE,
  hora        time NOT NULL,
  nombre      text,
  created_at  timestamptz DEFAULT now(),
  UNIQUE (sesion_date, hora)
);
CREATE INDEX IF NOT EXISTS idx_sesion_noticias_fecha ON sesion_noticias (sesion_date);

COMMENT ON TABLE sesion_noticias IS
  'Noticias rojas del día (hora + nombre). La ventana de bloqueo es ±5 min sobre la ENTRADA del trade; estar ya dentro de una posición es válido.';

ALTER TABLE sesion_noticias ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS auth_all ON sesion_noticias;
CREATE POLICY auth_all ON sesion_noticias FOR ALL TO authenticated USING (true) WITH CHECK (true);
GRANT ALL ON sesion_noticias TO service_role;
GRANT ALL ON sesion_noticias TO authenticated;

-- ═══ 2. SINCRONÍA sesion_noticias ⇄ sesiones.hora_noticia_roja ════════════
-- El Worker `/api/session` NO está versionado y sigue escribiendo la columna de
-- texto. Se sincronizan en ambos sentidos para no romperlo en silencio.
-- LECCIÓN de `fn_sync_setup_codigo` (jul 2026): comparar SIEMPRE contra OLD, o
-- un lado gana siempre y revierte los cambios del otro. La recursión se corta
-- con pg_trigger_depth().

CREATE OR REPLACE FUNCTION fn_sync_noticias_a_texto() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_fecha date := COALESCE(NEW.sesion_date, OLD.sesion_date);
  v_txt   text;
BEGIN
  SELECT nullif(string_agg(to_char(hora,'HH24:MI'), ',' ORDER BY hora), '')
    INTO v_txt FROM sesion_noticias WHERE sesion_date = v_fecha;
  UPDATE sesiones SET hora_noticia_roja = v_txt
   WHERE sesion_date = v_fecha AND hora_noticia_roja IS DISTINCT FROM v_txt;
  RETURN NULL;
END $$;

DROP TRIGGER IF EXISTS trg_sync_noticias_a_texto ON sesion_noticias;
CREATE TRIGGER trg_sync_noticias_a_texto
  AFTER INSERT OR UPDATE OR DELETE ON sesion_noticias
  FOR EACH ROW EXECUTE FUNCTION fn_sync_noticias_a_texto();

CREATE OR REPLACE FUNCTION fn_sync_texto_a_noticias() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE h text; t time;
BEGIN
  IF pg_trigger_depth() > 1 THEN RETURN NEW; END IF;   -- viene del trigger A
  IF TG_OP = 'UPDATE' AND NEW.hora_noticia_roja IS NOT DISTINCT FROM OLD.hora_noticia_roja THEN
    RETURN NEW;                                        -- el cliente no lo tocó
  END IF;
  DELETE FROM sesion_noticias WHERE sesion_date = NEW.sesion_date;
  IF NEW.hora_noticia_roja IS NOT NULL AND btrim(NEW.hora_noticia_roja) <> '' THEN
    FOREACH h IN ARRAY string_to_array(NEW.hora_noticia_roja, ',') LOOP
      BEGIN
        t := btrim(h)::time;
        INSERT INTO sesion_noticias (sesion_date, hora) VALUES (NEW.sesion_date, t)
          ON CONFLICT (sesion_date, hora) DO NOTHING;
      EXCEPTION WHEN others THEN NULL;   -- hora inválida: se ignora, no rompe el guardado
      END;
    END LOOP;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_sync_texto_a_noticias ON sesiones;
CREATE TRIGGER trg_sync_texto_a_noticias
  AFTER INSERT OR UPDATE OF hora_noticia_roja ON sesiones
  FOR EACH ROW EXECUTE FUNCTION fn_sync_texto_a_noticias();

-- Migrar las horas ya existentes (8 sesiones)
INSERT INTO sesion_noticias (sesion_date, hora)
SELECT s.sesion_date, btrim(h)::time
  FROM sesiones s, unnest(string_to_array(s.hora_noticia_roja, ',')) h
 WHERE s.hora_noticia_roja IS NOT NULL AND btrim(s.hora_noticia_roja) <> ''
ON CONFLICT (sesion_date, hora) DO NOTHING;

-- ═══ 3. REGLAS ════════════════════════════════════════════════════════════

-- 3.1 Las dos de noticias tenían los enunciados INTERCAMBIADOS
UPDATE catalogo_reglas SET
  titulo    = 'Calendario económico revisado',
  enunciado = 'Revisar Forex Factory y registrar las noticias rojas del día con su hora. Si no hay ninguna, se marca igual: la casilla declara que SÍ se revisó.',
  fase = 1, orden = 1, bloquea_go = true, aplica_si = 'siempre',
  evidencia = 'declarada', campo = null
WHERE codigo = 'chk_calendario';

UPDATE catalogo_reglas SET
  titulo    = 'No entrar en ventana de noticia roja',
  enunciado = 'No abrir posición en los ±5 minutos alrededor de una noticia roja. Estar YA dentro de una posición cuando sale la noticia es válido: la regla es sobre la entrada.',
  fase = 3, orden = 3, bloquea_go = false, aplica_si = 'hay_noticia',
  evidencia = 'auto', campo = 'trades.entry_time vs sesion_noticias.hora ±5min'
WHERE codigo = 'chk_noticias';

-- 3.2 Resto de Fase 1
UPDATE catalogo_reglas SET fase=1, orden=2, bloquea_go=true, aplica_si='siempre', evidencia='declarada' WHERE codigo='chk_zonas';
UPDATE catalogo_reglas SET fase=1, orden=3, bloquea_go=true, aplica_si='siempre', evidencia='declarada' WHERE codigo='chk_cuenta_pa';

-- 3.3 Fase 2 — antes del GO
UPDATE catalogo_reglas SET fase=2, orden=1, bloquea_go=true, evidencia='declarada' WHERE codigo='chk_contexto';
UPDATE catalogo_reglas SET fase=2, orden=2, bloquea_go=true, evidencia='declarada',
  titulo='Impulso no sobreextendido'   -- el (<5 velas) contradecía a su propio enunciado
WHERE codigo='chk_5velas';
UPDATE catalogo_reglas SET fase=2, orden=3, bloquea_go=true, evidencia='declarada',
  enunciado='Impulso 1 → Retroceso → Impulso 2, con estructura fluida y proporcionada. Incluye haber esperado al menos una corrida completa antes de evaluar la entrada.'
WHERE codigo='chk_estructura';
UPDATE catalogo_reglas SET fase=2, orden=4, bloquea_go=true, evidencia='declarada' WHERE codigo='target_sin_zonas';
UPDATE catalogo_reglas SET fase=2, orden=5, bloquea_go=true, evidencia='declarada',
  enunciado='Orden precolocada a tiempo, 1 tick sobre la vela de rompimiento (1 tick bajo el mínimo si es bajista), lista antes de que se dé la consecución.'
WHERE codigo='chk_orden';   -- SUBE de Fase 3 a Fase 2

UPDATE catalogo_reglas SET fase=2, orden=1, bloquea_go=true, evidencia='declarada',
  enunciado='El precio llega por 2ª vez a una zona importante.'   -- describía el setup entero
WHERE codigo='rei_zona';
UPDATE catalogo_reglas SET fase=2, orden=2, bloquea_go=true, evidencia='declarada' WHERE codigo='rei_consecucion_fallida';
UPDATE catalogo_reglas SET fase=2, orden=3, bloquea_go=true, evidencia='declarada' WHERE codigo='rei_vela_reingreso';

-- 3.4 Fase 2b — después del GO
UPDATE catalogo_reglas SET fase=2, orden=6, bloquea_go=false, evidencia='declarada',
  enunciado='Tras el retroceso, el precio rompe la zona (alto/bajo del impulso 1). Se confirma después de la entrada.'
WHERE codigo='chk_consecucion';
UPDATE catalogo_reglas SET fase=2, orden=4, bloquea_go=false, evidencia='declarada' WHERE codigo='rei_vela_consecucion';

-- 3.5 Fase 3 — gestión
UPDATE catalogo_reglas SET fase=3, orden=1, bloquea_go=false, evidencia='auto',
  campo='trades.mae / ($punto x contratos)'
WHERE codigo='stop_max_puntos';
UPDATE catalogo_reglas SET fase=3, orden=2, bloquea_go=false, evidencia='declarada',
  enunciado='Una vez colocada la orden, no se mueve el stop ni el target, pase lo que pase.'
WHERE codigo='chk_no_mover';

-- 3.6 Regla NUEVA: estaba escrita en fil_1 pero nunca se preguntaba.
-- Detecta 3 violaciones históricas (18-mar, 17-jun, 8-jul), las tres con pérdida: -$653.
INSERT INTO catalogo_reglas
  (codigo, titulo, enunciado, capa, tipo, fase, setup, es_checklist, estado, orden,
   peso, activa, bloquea_go, aplica_si, evidencia, campo)
VALUES
  ('fomc_solo_reingreso', 'Día FOMC: solo reingresos',
   'En días de FOMC no se toman entradas tendenciales. Solo se permite el setup de Reingreso. Aplica a cualquier fecha marcada como FOMC en el calendario, sin importar el tipo de evento (Day 1, Day 2 o actas).',
   'riesgo', 'dura', 2, null, true, 'vigente', 7,
   1, true, false, 'dia_fomc', 'auto', 'catalogo_fechas.tipo=fomc + familia del setup')
ON CONFLICT (codigo) DO UPDATE SET
  titulo=excluded.titulo, enunciado=excluded.enunciado, capa=excluded.capa, tipo=excluded.tipo,
  fase=excluded.fase, es_checklist=excluded.es_checklist, orden=excluded.orden,
  activa=excluded.activa, bloquea_go=excluded.bloquea_go, aplica_si=excluded.aplica_si,
  evidencia=excluded.evidencia, campo=excluded.campo;

-- 3.7 Salen del checklist (soft-delete: hay historial en sesion_checklist)
UPDATE catalogo_reglas SET activa=false WHERE codigo='rr_1a1';    -- ya está en fil_4 "Mecánica de Entrada"
UPDATE catalogo_reglas SET activa=false WHERE codigo='no_fomc';   -- contradecía a fomc_solo_reingreso

-- 3.8 El máximo de trades/día pasa a Filosofía (no es regla de checklist)
UPDATE catalogo_reglas
   SET enunciado = enunciado || E'\n- Máximo 1 operación por día (configurable en Objetivos)'
 WHERE codigo = 'fil_1' AND enunciado NOT LIKE '%Máximo 1 operación por día%';

NOTIFY pgrst, 'reload schema';

-- ═══ VERIFICACIÓN ═════════════════════════════════════════════════════════
-- 17 filas de checklist activas = 13 por día (las de IRI y Reingreso se excluyen
-- mutuamente según el setup del día).
SELECT codigo, fase, orden, setup, bloquea_go, aplica_si, evidencia, titulo
  FROM catalogo_reglas WHERE es_checklist AND activa
 ORDER BY fase, orden, setup NULLS FIRST;

-- Disciplina antes → después de esta fase (solo cambia por la salida de rr_1a1):
--   feb 75,0→73,9 | mar 64,2→62,8 | abr 70,2→69,1 | may 89,9→93,5
--   jun 95,1→94,5 | jul 99,3→99,2 | GLOBAL 81,0→80,8   (ítems 1145→1028)
