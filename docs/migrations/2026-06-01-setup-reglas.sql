-- ════════════════════════════════════════════════════════════════════════
-- Módulo "Reglas por Setup" — tabla setup_reglas
-- Ejecutar en el SQL Editor de Supabase:
-- https://jothoslozctflfrnysrx.supabase.co
-- ════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS setup_reglas (
  id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  setup        TEXT NOT NULL,                 -- iri_apertura | iri_continuacion | reingreso
  direccion    TEXT NOT NULL DEFAULT 'ambas', -- alcista | bajista | ambas
  activacion   TEXT,   -- contexto: cuándo aparece este setup
  secuencia    TEXT,   -- estructura de velas (IRI, consecución, reingreso…)
  entrada      TEXT,   -- gatillo y nivel exacto de entrada
  stop         TEXT,   -- ubicación y tamaño del stop
  gestion      TEXT,   -- target, R:R mínimo, gestión de zona
  invalidacion TEXT,   -- filtros / qué invalida el setup
  notas        TEXT,   -- observaciones que evolucionan
  activa       BOOLEAN DEFAULT true,
  orden        INTEGER DEFAULT 0,
  updated_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE (setup, direccion)
);

-- Proyecto personal: sin RLS (igual que el resto de catálogos)
ALTER TABLE setup_reglas DISABLE ROW LEVEL SECURITY;

-- Otorgar privilegios al rol anon (API key del navegador) y authenticated.
-- Necesario: las tablas nuevas no siempre heredan estos grants automáticamente.
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.setup_reglas TO anon, authenticated;

-- ── Seed: Reingreso (Común) — caso base capturado por el Coach el 2026-06-01 ──
INSERT INTO setup_reglas (setup, direccion, orden, activacion, secuencia, entrada, stop, gestion, invalidacion, notas)
VALUES (
  'reingreso', 'ambas', 30,
  'Tras una consecución que falla en una zona S/R y el precio revierte. Aparece cuando el primer intento direccional no prospera y el mercado ofrece una segunda oportunidad en sentido contrario.',
  'Consecución fallida → reversión → rompimiento del retroceso → consecución confirmada = entrada. (Estructura observada el 2026-06-01 en reingreso alcista 09:08 → TARGET).',
  'Orden precolocada antes del cierre de la vela que rompe el retroceso, en dirección de la nueva consecución. (Nivel exacto pendiente de afinar con más casos).',
  'Por definir con backtesting. Respetar el stop máximo de 60 pts / $120 por trade.',
  'Ratio mínimo 1:1. Sin zonas vigentes entre la entrada y el target.',
  'Regla de las 5 velas en la consecución. No operar con noticia roja ni en día FOMC. Si hay zona en contra antes del target, no entrar.',
  'Setup en formalización. Primer caso documentado: 2026-06-01, reingreso alcista 09:08, resultado TARGET (simulación). Testear en simulación ≥ 3 casos antes de operar en real.'
)
ON CONFLICT (setup, direccion) DO NOTHING;
