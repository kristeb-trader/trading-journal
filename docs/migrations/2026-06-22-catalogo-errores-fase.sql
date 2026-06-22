-- ─────────────────────────────────────────────────────────────────────────
-- Fase por defecto en el catálogo de errores.
--
-- Cada error del catálogo (catalogo_errores) tiene una FASE del proceso
-- asociada (1 Pre-sesión | 2 Lectura | 3 Ejecución). Al registrar ese error en
-- una sesión, el formulario toma esa fase automáticamente (con override manual).
-- Correr en el SQL Editor de Supabase.
-- ─────────────────────────────────────────────────────────────────────────

alter table catalogo_errores add column if not exists fase smallint;

-- ── Fase 1 · Pre-sesión (filtros y estado previos al setup) ──
update catalogo_errores set fase = 1 where id in (
  11,  -- FOMC
  36,  -- Checklist Incompleto
  39,  -- Entré en Sim y no Real
  37,  -- Ansiedad
  30,  -- Ansiedad persistente
  38   -- Baja Confianza
);

-- ── Fase 2 · Lectura del setup (validez / análisis antes de entrar) ──
update catalogo_errores set fase = 2 where id in (
  10,  -- 3ª Corrida
  12,  -- Contra Máximo de la Apertura
  20,  -- Contra Máximo Histórico
  5,   -- Contra Máximo Premercado
  4,   -- Contra Mínimo Premercado
  2,   -- Contra Resistencia
  3,   -- Contra Soporte
  16,  -- Corrida no fluida - Solo 1 vela
  9,   -- IRIs Poco Claros
  17,  -- Mercado Extendido
  7,   -- Target Largo
  6,   -- Volumen Mayor
  14,  -- Error de Marcación
  19,  -- Trade sin Consecución
  35,  -- Confundir Reglas con Entrada Válida
  33   -- Entrada con Filtros en Rojo
);

-- ── Fase 3 · Ejecución (gatillo, timing, gestión, sizing, impulsos) ──
update catalogo_errores set fase = 3 where id in (
  31,  -- Descartar Setup Válido
  40,  -- Entrada Tardía
  8,   -- Rompimiento Extendido
  22,  -- Mover Stop
  21,  -- Dos trades
  18,  -- Sobre-Apalancamiento
  15,  -- Duda
  23,  -- Miedo
  28,  -- FOMO
  34,  -- Rabia
  32,  -- Sobreconfianza
  29   -- Sobreconfianza selectiva
);

-- Verificación (opcional): no debería quedar ningún error activo sin fase
--   select id, nombre, tipo from catalogo_errores where fase is null and activa order by nombre;

notify pgrst, 'reload schema';
