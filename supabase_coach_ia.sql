-- ============================================================
-- COACH IA — Script de migración Supabase
-- Ejecutar completo en: Supabase → SQL Editor
-- ============================================================

-- ── 1. catalogo_emociones ────────────────────────────────────
CREATE TABLE IF NOT EXISTS catalogo_emociones (
  id      bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre  text NOT NULL,
  emoji   text,
  orden   integer DEFAULT 0,
  activa  boolean DEFAULT true
);

ALTER TABLE catalogo_emociones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "emociones_select" ON catalogo_emociones FOR SELECT TO anon USING (true);
CREATE POLICY "emociones_insert" ON catalogo_emociones FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "emociones_update" ON catalogo_emociones FOR UPDATE TO anon USING (true);
CREATE POLICY "emociones_delete" ON catalogo_emociones FOR DELETE TO anon USING (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON catalogo_emociones TO anon;
GRANT USAGE, SELECT ON SEQUENCE catalogo_emociones_id_seq TO anon;

INSERT INTO catalogo_emociones (nombre, emoji, orden) VALUES
  ('En zona',       '🟢', 1),
  ('Tranquilo',     '😌', 2),
  ('Confiado',      '💪', 3),
  ('Neutral',       '😐', 4),
  ('Ansioso',       '😰', 5),
  ('Presionado',    '😤', 6),
  ('Cansado',       '😴', 7),
  ('Sobreconfiado', '🚫', 8);


-- ── 2. estrategia_chaumer ────────────────────────────────────
CREATE TABLE IF NOT EXISTS estrategia_chaumer (
  id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  seccion    text NOT NULL,
  titulo     text NOT NULL,
  contenido  text NOT NULL,
  orden      integer DEFAULT 0,
  activa     boolean DEFAULT true,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE estrategia_chaumer ENABLE ROW LEVEL SECURITY;

CREATE POLICY "estrategia_select" ON estrategia_chaumer FOR SELECT TO anon USING (true);
CREATE POLICY "estrategia_insert" ON estrategia_chaumer FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "estrategia_update" ON estrategia_chaumer FOR UPDATE TO anon USING (true);

GRANT SELECT, INSERT, UPDATE ON estrategia_chaumer TO anon;
GRANT USAGE, SELECT ON SEQUENCE estrategia_chaumer_id_seq TO anon;

INSERT INTO estrategia_chaumer (seccion, titulo, contenido, orden) VALUES
('antes_sesion', 'Antes de la Sesión', '- Verificar noticias en Forex Factory e Investing.com
- Día Fed/Powell/FOMC → solo reingresos, NUNCA entrada tendencial
- Noticia roja ★★★ → no entrar en los 5 minutos previos a la hora
- Revisar contexto del día anterior: ¿tendencia o rango?
- Definir dirección probable del día sin forzarla
- Stop máximo por operación: $120 (60 puntos en MNQ) · Target: mismo recorrido 1:1
- Quitar zonas naranjas del gráfico — generan ruido, no son reglas', 1),

('premercado', 'Premercado — Qué Marcar', '- Buscar velas con volumen ≥ 2.000 contratos (MNQ) ó ≥ 6.000 (NQ)
  - Vela alcista → zona de resistencia en la mecha superior
  - Vela bajista → zona de soporte en la mecha inferior
- Extender esas zonas hacia la izquierda como referencia
- Marcar mínimo y máximo del premercado con líneas (rojo=mínimo / verde=máximo)', 2),

('apertura', 'Apertura Americana (9:30 ET)', '- Marcar máximo o mínimo de la primera vela como zona crítica
- NO entrar si el target necesita superar esa zona crítica
- Esperar al menos UNA corrida completa antes de evaluar entrada', 3),

('mecanica_entrada', 'Mecánica de Entrada — Paso a Paso', '1. El precio hace una corrida + retroceso
2. Marcar zona gris en la mecha del retroceso
3. Esperar que el precio rompa esa zona por UN tick → rompimiento
4. Dejar que la vela de rompimiento cierre COMPLETAMENTE
5. En la siguiente vela: entrar SOLO si supera por un tick la vela de rompimiento → VELA DE CONSECUCIÓN
6. Stop = mínimo (o máximo) del retroceso · Target = mismo recorrido 1:1
7. Verificar que entre entrada y target NO haya zona vigente ni mín/máx premercado', 4),

('gestion_zona', 'Gestión de Zona Después del Rompimiento', 'ESCENARIO 1 — Consecución inmediata
Vela siguiente al rompimiento supera por un tick → entrada válida · zona sigue vigente

ESCENARIO 2 — Retroceso después del rompimiento SIN nueva consecución
El precio retrocede pero NO supera el retroceso original → entrada sigue válida
NO se marca zona nueva · Se espera consecución dentro de las 5 velas

ESCENARIO 3 — Pasan 5 velas sin consecución
- Rompimiento con MECHA → extender zona original
- Rompimiento con CUERPO → marcar zona nueva

INVALIDACIÓN TOTAL
El precio supera el retroceso original (mínimo/máximo de la zona gris) → entrada cancelada

REGLA CLAVE DE MARCADO
Solo marcar zona nueva si se cumplió: rompimiento + consecución + nuevo retroceso
NUNCA marcar zona solo por rompimiento sin consecución confirmada', 5),

('filtros', 'Filtros — Cuándo NO Entrar', '✗ Impulso con más de 5 velas → sobreextendido
✗ Stop resultante supera $120 (60 puntos en MNQ)
✗ Target penetra o toca una zona vigente marcada
✗ Target supera mínimo o máximo del premercado
✗ Target supera el alto o bajo de la sesión
✗ Vela de consecución NO supera por un tick la vela de rompimiento
✗ Hay zona vigente entre el mínimo del retroceso y la zona marcada
✗ Pico de volumen máximo de sesión → no entrar en esa dirección
✗ Día Fed/FOMC/Powell con setup tendencial
✗ Faltan menos de 5 minutos para noticia roja ★★★', 6),

('volumen', 'Lectura de Volumen', '- Impulso: volumen creciente y alto → confirma la corrida ✅
- Retroceso: volumen decreciente y bajo → corrección sana ✅
- Volumen parejo y bajo en toda la zona → precaución, mayor ruido ⚠️', 7),

('regla_de_oro', 'Regla de Oro — Antes de Cada Entrada', 'Visualizar SIEMPRE dos escenarios:
(1) ¿Por qué continuaría el movimiento en mi dirección?
(2) ¿Por qué haría una manipulación y se devolvería?

Si no puedes responder ambas con claridad → NO hay entrada', 8);


-- ── 3. diagnosticos_diarios ──────────────────────────────────
CREATE TABLE IF NOT EXISTS diagnosticos_diarios (
  id                    bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  sesion_date           date UNIQUE NOT NULL,

  -- Secciones del análisis
  sec_contexto          text,
  sec_desarrollo        text,
  sec_validacion        text,
  sec_veredicto         text,   -- veredicto de setup (VÁLIDA/INVÁLIDA), Etapa 3
  sec_errores           text,
  sec_aprendizaje       text,
  sec_resumen_compacto  text,

  -- Metadatos estructurados
  errores_json          jsonb DEFAULT '[]'::jsonb,
  setups_json           jsonb DEFAULT '[]'::jsonb,

  -- Estado emocional
  estado_emocional_id   bigint REFERENCES catalogo_emociones(id),
  nivel_confianza       integer CHECK (nivel_confianza BETWEEN 1 AND 5),

  -- Detección de patrones
  patron_detectado      boolean DEFAULT false,
  patron_descripcion    text,

  -- Chat completo (guardado pero no inyectado en prompts)
  chat_messages         jsonb DEFAULT '[]'::jsonb,

  -- Metadatos técnicos
  modelo_usado          text DEFAULT 'claude-sonnet-4-5-20251001',
  tokens_usados         integer,
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now()
);

ALTER TABLE diagnosticos_diarios DISABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON diagnosticos_diarios TO anon;
GRANT USAGE, SELECT ON SEQUENCE diagnosticos_diarios_id_seq TO anon;


-- ── 4. Nuevas columnas en sesiones ───────────────────────────
ALTER TABLE sesiones
  ADD COLUMN IF NOT EXISTS estado_emocional_id bigint REFERENCES catalogo_emociones(id),
  ADD COLUMN IF NOT EXISTS nivel_confianza integer CHECK (nivel_confianza BETWEEN 1 AND 5);


-- ── 5. Recargar schema PostgREST ─────────────────────────────
NOTIFY pgrst, 'reload schema';


-- ============================================================
-- FASE 2 — Limpieza del modelo de datos (mayo 2026)
-- ============================================================

-- ── 2A. Emoción/confianza: fuente única en `sesiones` ─────────
-- Respaldar valores que solo estuvieran en diagnosticos → sesiones.
-- Idempotente: solo corre el backfill si las columnas aún existen en diagnosticos.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'diagnosticos_diarios' AND column_name = 'estado_emocional_id'
  ) THEN
    UPDATE sesiones s
    SET estado_emocional_id = COALESCE(s.estado_emocional_id, d.estado_emocional_id),
        nivel_confianza     = COALESCE(s.nivel_confianza, d.nivel_confianza)
    FROM diagnosticos_diarios d
    WHERE d.sesion_date = s.sesion_date;
  END IF;
END $$;

-- Eliminar columnas redundantes de diagnosticos (se quedan en sesiones).
-- estado_emocional_fin_id PERMANECE en diagnosticos (emoción de cierre).
ALTER TABLE diagnosticos_diarios
  DROP COLUMN IF EXISTS estado_emocional_id,
  DROP COLUMN IF EXISTS nivel_confianza;

-- ── 2B. Taxonomía de error en el catálogo ─────────────────────
ALTER TABLE catalogo_casuisticas
  ADD COLUMN IF NOT EXISTS tipo text;  -- psicologico | analitico | operativo | marcado

-- ── 2C. Tabla estructurada de errores ─────────────────────────
CREATE TABLE IF NOT EXISTS diagnostico_errores (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  sesion_date date NOT NULL,
  tipo        text,                  -- psicologico/analitico/operativo/marcado
  descripcion text NOT NULL,
  origen      text DEFAULT 'ia',     -- 'ia' | 'manual'
  created_at  timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_diag_errores_fecha ON diagnostico_errores(sesion_date);

ALTER TABLE diagnostico_errores DISABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON diagnostico_errores TO anon;
GRANT USAGE, SELECT ON SEQUENCE diagnostico_errores_id_seq TO anon;

-- Migración (opcional) de los errores históricos jsonb → filas estructuradas
INSERT INTO diagnostico_errores (sesion_date, tipo, descripcion, origen)
SELECT d.sesion_date,
       e->>'tipo'         AS tipo,
       e->>'descripcion'  AS descripcion,
       'ia'               AS origen
FROM diagnosticos_diarios d,
     jsonb_array_elements(COALESCE(d.errores_json, '[]'::jsonb)) AS e
WHERE e->>'descripcion' IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM diagnostico_errores x
    WHERE x.sesion_date = d.sesion_date
      AND x.descripcion = e->>'descripcion'
  );

NOTIFY pgrst, 'reload schema';


-- ============================================================
-- FASE 3 — Registro UNIFICADO de errores (manual + IA)
-- ============================================================
-- Una sola tabla para todos los errores, con `origen` que distingue
-- la procedencia. Sustituye conceptualmente a sesion_casuisticas (manual)
-- y diagnostico_errores (IA). Las tablas viejas se conservan por seguridad.

CREATE TABLE IF NOT EXISTS errores_sesion (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  sesion_date date NOT NULL,
  error       text NOT NULL,            -- nombre del catálogo o descripción libre
  tipo        text,                     -- psicologico/analitico/operativo/marcado
  resultado   text,                     -- 'T' | 'S' (manual) | null (IA)
  origen      text DEFAULT 'manual',    -- 'manual' | 'ia' | 'ambos'
  created_at  timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_errores_sesion_fecha ON errores_sesion(sesion_date);

ALTER TABLE errores_sesion DISABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON errores_sesion TO anon;
GRANT USAGE, SELECT ON SEQUENCE errores_sesion_id_seq TO anon;

-- Migrar errores MANUALES (con su tipo desde el catálogo)
INSERT INTO errores_sesion (sesion_date, error, tipo, resultado, origen, created_at)
SELECT sc.sesion_date, sc.casuistica, cc.tipo, sc.resultado, 'manual', sc.created_at
FROM sesion_casuisticas sc
LEFT JOIN catalogo_casuisticas cc ON cc.nombre = sc.casuistica
WHERE NOT EXISTS (
  SELECT 1 FROM errores_sesion e
  WHERE e.sesion_date = sc.sesion_date
    AND lower(e.error) = lower(sc.casuistica)
    AND e.origen IN ('manual','ambos')
);

-- Migrar errores de la IA (dedup: si ya existe manual ese día con el mismo
-- nombre, se marca 'ambos' abajo en vez de duplicar)
INSERT INTO errores_sesion (sesion_date, error, tipo, origen, created_at)
SELECT de.sesion_date, de.descripcion, de.tipo, 'ia', de.created_at
FROM diagnostico_errores de
WHERE NOT EXISTS (
  SELECT 1 FROM errores_sesion e
  WHERE e.sesion_date = de.sesion_date AND lower(e.error) = lower(de.descripcion)
);

UPDATE errores_sesion e
SET origen = 'ambos'
WHERE e.origen = 'manual'
  AND EXISTS (
    SELECT 1 FROM diagnostico_errores de
    WHERE de.sesion_date = e.sesion_date AND lower(de.descripcion) = lower(e.error)
  );

NOTIFY pgrst, 'reload schema';


-- ============================================================
-- FASE 3B — Objetivos y cumplimiento de reglas
-- ============================================================
-- Configuración de una sola fila con los límites del trader.
CREATE TABLE IF NOT EXISTS objetivos (
  id                 smallint PRIMARY KEY DEFAULT 1,
  stop_max_usd       numeric  DEFAULT 120,   -- stop máximo por trade ($)
  max_trades_dia     integer  DEFAULT 2,     -- máximo de trades por día
  pnl_objetivo_dia   numeric,                -- meta de P&L diaria ($)
  limite_perdida_dia numeric,                -- pérdida máxima diaria ($, valor positivo)
  updated_at         timestamptz DEFAULT now(),
  CONSTRAINT objetivos_single_row CHECK (id = 1)
);

ALTER TABLE objetivos DISABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON objetivos TO anon;

INSERT INTO objetivos (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

NOTIFY pgrst, 'reload schema';


-- ============================================================
-- FASE 4A — Errores tipificados (catálogo vs ocurrencias)
-- ============================================================
-- Modelo final:
--   catalogo_errores      = maestro (nombre breve + tipo)
--   diagnostico_errores   = ocurrencias (error corto + detalle + resultado + origen)

-- 1. Renombrar el catálogo
ALTER TABLE IF EXISTS catalogo_casuisticas RENAME TO catalogo_errores;

-- 2. Consolidar ocurrencias: eliminar la tabla legado y renombrar la unificada
DROP TABLE IF EXISTS diagnostico_errores;          -- legado (ya migrado a errores_sesion)
ALTER TABLE IF EXISTS errores_sesion RENAME TO diagnostico_errores;

-- 3. Columnas nuevas: link al catálogo + descripción larga
ALTER TABLE diagnostico_errores
  ADD COLUMN IF NOT EXISTS catalogo_id bigint REFERENCES catalogo_errores(id),
  ADD COLUMN IF NOT EXISTS descripcion text;

-- 4. Backfill catalogo_id emparejando por nombre
UPDATE diagnostico_errores d
SET catalogo_id = c.id
FROM catalogo_errores c
WHERE lower(c.nombre) = lower(d.error) AND d.catalogo_id IS NULL;

NOTIFY pgrst, 'reload schema';
