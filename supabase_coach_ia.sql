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

  -- 6 secciones del análisis
  sec_contexto          text,
  sec_desarrollo        text,
  sec_validacion        text,
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
