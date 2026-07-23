# Trading Journal NQ Futures — Historial Completo del Proyecto

**Última actualización:** 7 Julio 2026 (ver *Checkpoint Jul 2026* al final: disciplina unificada · métricas coherentes · ventana de noticia roja · Reglas y Estrategia · NT8 DailyLevels/ChecklistChaumer). Historial base — Fases 14-22: Errores renombrado · Laboratorio de Experimentos · Apex Tracker · Análisis unificado · indicadores NT8 routing + DailyLevels · Coach futuro continuo · calendario hero · Disciplina por 3 fases (Bloques 1-5) · Registrar en cards + modo lectura/editar)
**Repositorio:** `https://github.com/kristeb-trader/trading-journal` (privado)
**Rama principal:** `main`
**Working directory local:** `E:\Proyectos\Trading Journal` (migrado desde `C:\Users\Asus\Claro drive\Trading Journal` el 6 jul 2026)
**URL producción:** `https://kristeb-trader.github.io/trading-journal`

---

## Descripción general

Dashboard semi-profesional para registro, análisis y visualización de operativa diaria en NQ/MNQ Futures (temporalidad 1 minuto), siguiendo la **Metodología Chaumer**. Combina captura automática de trades desde NinjaTrader 8, registro manual de contexto vía web y Telegram, análisis con IA (Claude Sonnet), e imágenes del día en Cloudinary. Arquitectura 100% serverless, costo ~$0.40/mes.

---

## Servicios y credenciales

| Servicio | Identificador / URL clave | Credencial |
|---|---|---|
| Supabase | `https://jothoslozctflfrnysrx.supabase.co` | Anon key en `js/config.js` y en `SupabaseAutoExport.cs` |
| GitHub Pages | `kristeb-trader.github.io/trading-journal` | Token GitHub del usuario |
| Cloudflare Worker #1 (proxy IA) | `broad-hall-c53f.kristerock.workers.dev` | Claude API key como variable de entorno |
| Cloudflare Worker #2 (bot) | `trading-journal-bot.kristerock.workers.dev` | Variables de entorno en el Worker |
| Cloudflare KV | Namespace: `trading-journal-bot-kv` / ID: `3dd631773a6041c1a97a8e9a8f861067` | Sin credenciales propias |
| Cloudflare Account | ID: `03b9d27f14f490d9a295bf4c924c7326` | — |
| Cloudinary | Cloud name: `dq4n7bjta` / Preset: `trading-journal` (Unsigned) | En `js/config.js` |
| Claude API | Modelo: `claude-sonnet-4-6` | En `localStorage` del browser y en Worker #1 |
| Telegram Bot | Chat ID autorizado: `372127764` | Token en variable `BOT_TOKEN` del Worker #2 |

> **Nota de seguridad:** La API key de Claude se guarda en `localStorage` del navegador, no en el código fuente. El repositorio es privado pero se sigue esta práctica por seguridad.

---

## Stack tecnológico

| Componente | Tecnología |
|---|---|
| Base de datos | Supabase (PostgreSQL) |
| Frontend / Dashboard | HTML + JS vanilla (sin frameworks) |
| Hosting | GitHub Pages (rama `main`) |
| Proxy IA | Cloudflare Worker #1 |
| Análisis IA | Claude API — `claude-sonnet-4-6` — ~$0.02/diagnóstico, ~$0.40/mes |
| Almacenamiento imágenes | Cloudinary |
| Exportación automática NT8 | Indicador C# — `SupabaseAutoExport.cs` |
| Registro alternativo | Telegram Bot vía Cloudflare Worker #2 + KV |

**Paleta visual:**
- Background dark: `#1a1a18`
- Accent verde trading: `#1D9E75`
- Stop/error: `#E24B4A`
- Warning: `#BA7517`
- Tipografía: Segoe UI / system-ui
- Componentes: cards con border-radius 10px, sombras suaves, transiciones 150ms
- Iconos: Tabler Icons (CDN)
- Gráficas: Chart.js (CDN)

---

## Estructura de carpetas del repositorio

```
trading-journal/
├── index.html                        ← Shell SPA + modales
├── favicon.svg                       ← Icono velas japonesas verde/rojo
├── css/
│   └── styles.css                    ← Dark mode completo
├── js/
│   ├── config.js                     ← Credenciales (NO exponer públicamente)
│   ├── db.js                         ← Capa de datos Supabase (todas las queries)
│   ├── calendar.js                   ← Calendario mensual interactivo
│   ├── metrics.js                    ← KPIs y métricas generales
│   ├── table.js                      ← Tabla de trades paginada
│   ├── form.js                       ← Formulario de sesión diaria + experimentos
│   ├── charts.js                     ← 6 gráficas con Chart.js
│   ├── gallery.js                    ← Galería de imágenes con slots vacíos
│   ├── data.js                       ← Gestor de catálogos (errores, emociones, experimentos)
│   ├── estrategia.js                 ← Reglas por setup + estrategia general Chaumer (FASE 10)
│   ├── experimentos.js               ← Laboratorio de Experimentos: veredictos + matriz (FASE 15)
│   ├── apex.js                       ← Apex Tracker: cuentas de fondeo + auto-carga NT8 (FASE 16)
│   ├── coach.js                      ← Coach IA — flujo 3 etapas (FASE 5+)
│   └── app.js                        ← Boot, navegación SPA, modales, lightbox
├── NinjaTrader/
│   ├── SupabaseAutoExport.cs         ← Indicador C# de trades (routing por cuenta, FASE 18)
│   └── SupabaseDailyLevels.cs        ← Indicador C# de niveles diarios OHLC/overnight (FASE 18)
├── TelegramBot/
│   ├── worker.js                     ← Cloudflare Worker del bot
│   └── wrangler.toml                 ← Config KV binding
└── docs/
    ├── historial-proyecto.md         ← Este archivo
    ├── plan-disciplina-fases.md      ← Plan de Disciplina/Reglas/Errores por fases (Bloques 1-5)
    ├── arquitectura-funcional.md
    ├── arquitectura-tecnica.md
    ├── manual-tecnico.md
    ├── manual-usuario.md
    └── migrations/                   ← SQL por correr en Supabase (1 archivo por cambio de BD)
```

---

## Base de datos — Esquema final (Mayo 2026)

### Tabla `trades`

```sql
CREATE TABLE trades (
  trade_number   BIGSERIAL PRIMARY KEY,
  account        TEXT,
  instrument     TEXT,
  trade_date     DATE,
  entry_time     TIME,
  exit_time      TIME,
  entry_price    NUMERIC,
  exit_price     NUMERIC,
  strategy       TEXT,
  qty            INTEGER,
  market_pos     TEXT,
  exit_name      TEXT,
  resultado      TEXT,               -- "target" / "stop" / "otro"
  profit         NUMERIC,
  cum_net_profit NUMERIC,            -- calculado por trigger
  commission     NUMERIC DEFAULT 0,
  mae            NUMERIC,
  mfe            NUMERIC,
  etd            NUMERIC,
  bars           INTEGER
);
```

> **Nota P&L (normalizado — Jun 2026):** convención única **NETO**. `profit` = neto (comisión round-trip descontada) en todo el histórico y en el live. `commission` = round-trip (suma de todas las patas). El script C# v2.2 (2026-06-02) acumula la comisión de entrada + salida + scaling y envía profit neto. Los 7 trades "era live" previos se normalizaron por SQL (`docs/migrations/2026-06-02-normalizar-pnl-live.sql`).

### Tabla `sesiones`

```sql
id, sesion_date (DATE UNIQUE),
contexto, num_corrida, velas_corrida, puntos_retroceso,
zonas_contra (BOOLEAN), setup,
-- Checklist Fase 1 — Pre-sesión (siempre visible)
chk_cuenta_pa (BOOLEAN DEFAULT false), chk_noticias, chk_zonas,
-- Checklist Fase 2 — Lectura del setup (solo cuando sí se operó)
chk_5velas, chk_consecucion, chk_estructura,
-- Checklist Fase 3 — Ejecución (solo cuando sí se operó)
chk_orden,
analisis_trader, resumen_ia, imagen_url,
no_opero (BOOLEAN), motivo_no_opero,
-- Fuente única de estado emocional y confianza (Fase 2A)
estado_emocional_id (FK → catalogo_emociones),
nivel_confianza (INTEGER 1-5),
-- Setup no tomado
setup_valido_no_tomado (BOOLEAN DEFAULT FALSE),
motivo_no_entrada (TEXT),
setup_observado (TEXT),
-- Premercado / contexto técnico (Fase 12 + niveles de ayer Fase 18)
precio_apertura_ayer, precio_max_ayer, precio_min_ayer, precio_cierre_ayer (NUMERIC),  -- PDO/PDH/PDL/PDC
precio_apertura, precio_max_pre, precio_min_pre (NUMERIC),
soportes_naranja (JSONB), resistencias_naranja (JSONB),  -- hasta 5 líneas naranjas c/u
noticias (TEXT),
se_conecto (BOOLEAN DEFAULT true),  -- distingue los 2 "no operé"
-- Disciplina por fases (Fase 21 — Bloque 1)
alerta_riesgo_vista (BOOLEAN),  -- true=impulsividad, false=falla analítica, null=sin exceso
created_at, updated_at
```

> **Fase 2A:** `estado_emocional_id` y `nivel_confianza` son la **fuente única** de emoción/confianza. Las columnas duplicadas en `diagnosticos_diarios` fueron eliminadas.
> **Fase 4D:** `zona_naranja_habia`, `zona_naranja_reaccion`, `zona_naranja_nota` fueron eliminadas y migradas a `diagnostico_experimentos`.
> **Fase 12:** premercado para enriquecer el análisis IA. `se_conecto` distingue: no operé sin conectarme (caso 1, mínimo) vs me conecté sin setup válido (caso 2, sí pide premercado + análisis). Los puntos del rango premercado se calculan (max−min), no se almacenan.
> **Fase 18:** `precio_apertura_ayer`/`precio_max_ayer`/`precio_min_ayer` (PDO/PDH/PDL) completan el OHLC de ayer. Los **escribe el indicador `SupabaseDailyLevels`** en NT8, no el formulario web ni el bot.
> **Fase 21:** `chk_cuenta_pa` es el 7º ítem del checklist (Fase 1). `alerta_riesgo_vista` registra si el trader vio que el retroceso superaba su stop máximo antes de entrar (impulsividad vs falla analítica). El checklist se reorganizó en 3 fases del proceso (la fase es metadata de código, no columna).

### Tabla `diagnosticos_diarios`

```sql
CREATE TABLE diagnosticos_diarios (
  id                      BIGSERIAL PRIMARY KEY,
  sesion_date             DATE UNIQUE NOT NULL,
  -- Etapa 1 (Análisis Técnico)
  sec_contexto            TEXT,
  sec_desarrollo          TEXT,
  sec_validacion          TEXT,
  -- Etapa 3 (Diagnóstico Final)
  sec_veredicto           TEXT,      -- columna dedicada (Fase 1 Coach)
  sec_errores             TEXT,
  sec_aprendizaje         TEXT,
  sec_resumen_compacto    TEXT,      -- alimenta el historial de 60 días al Coach
  -- Estructurado
  setups_json             JSONB DEFAULT '[]',
  -- Estado emocional de cierre (solo en diagnosticos — Fase 2A)
  estado_emocional_fin_id BIGINT REFERENCES catalogo_emociones(id),
  -- Patrones
  patron_detectado        BOOLEAN DEFAULT false,
  patron_descripcion      TEXT,
  -- Chat
  chat_messages           JSONB DEFAULT '[]',
  modelo_usado            TEXT,
  created_at              TIMESTAMPTZ DEFAULT now(),
  updated_at              TIMESTAMPTZ DEFAULT now()
);
```

> **Fase 2A:** Se eliminaron `estado_emocional_id` y `nivel_confianza` (ahora solo en `sesiones`). Se conserva `estado_emocional_fin_id` (emoción de cierre pertenece al diagnóstico).

### Tabla `catalogo_errores` (antes `catalogo_casuisticas`)

```sql
CREATE TABLE catalogo_errores (
  id      BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre  TEXT NOT NULL,           -- nombre breve del error (1-4 palabras)
  tipo    TEXT,                    -- psicologico | analitico | operativo | marcado
  activa  BOOLEAN DEFAULT true,
  orden   INTEGER DEFAULT 0
);
```

### Tabla `diagnostico_errores` (antes `errores_sesion`)

```sql
CREATE TABLE diagnostico_errores (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  sesion_date DATE NOT NULL,
  error       TEXT NOT NULL,        -- nombre corto (del catálogo o libre)
  tipo        TEXT,
  resultado   TEXT,                 -- T | S (para días no operados)
  origen      TEXT DEFAULT 'manual',-- manual | ia | ambos
  descripcion TEXT,                 -- detalle largo del error ese día
  catalogo_id         BIGINT REFERENCES catalogo_errores(id),
  recomendacion_id    BIGINT REFERENCES catalogo_recomendaciones(id),
  recomendacion_ia    TEXT,          -- recomendación generada por la IA ese día
  recomendacion_manual TEXT,         -- nota/ajuste del trader
  fase                SMALLINT,      -- 1 Pre-sesión | 2 Lectura | 3 Ejecución (Fase 21 — Bloque 3)
  regla_vista         BOOLEAN,       -- true=impulsividad, false=falla analítica, null=N/A (Fase 21)
  created_at          TIMESTAMPTZ DEFAULT now()
);
```

> Registro unificado de errores (manual + IA). El modal del calendario muestra chips compactos (nombre corto) con detalle desplegable al clic. Función alias `casuistica:error` mantiene compatibilidad con código existente.
> **Fase 21 (Bloque 3):** `fase` y `regla_vista` conectan cada error con la fase del proceso y con la distinción psicológica impulsividad (vio la regla y la violó) vs falla analítica (no la vio a tiempo). El Coach IA los asigna automáticamente (formato de error del prompt pasa de 6 a 8 partes); el parser es retro-compatible con las líneas viejas de 6 partes.

### Tabla `catalogo_emociones`

```sql
id, nombre, emoji, orden, activa (BOOLEAN DEFAULT true)
```

### Tabla `estrategia_chaumer`

```sql
id, seccion, titulo, contenido, orden, activa (BOOLEAN DEFAULT true), updated_at
-- Secciones: antes_sesion, premercado, apertura, mecanica_entrada,
--            gestion_zona, filtros, volumen, regla_de_oro, configuracion_visual
```

### Tabla `setup_reglas` (Fase 10)

```sql
CREATE TABLE setup_reglas (
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
-- SQL + seed del Reingreso: docs/migrations/2026-06-01-setup-reglas.sql
```

> 3 setups × 3 direcciones (común/alcista/bajista) = hasta 9 filas. El upsert usa `onConflict: 'setup,direccion'`. El Coach IA lee esta tabla en su system prompt para validar entradas contra las reglas escritas del trader.

### Tabla `objetivos` (Fase 3B)

```sql
CREATE TABLE objetivos (
  id                 SMALLINT PRIMARY KEY DEFAULT 1,
  stop_max_usd       NUMERIC DEFAULT 120,
  max_trades_dia     INTEGER DEFAULT 2,
  pnl_objetivo_dia   NUMERIC,
  limite_perdida_dia NUMERIC,
  updated_at         TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT objetivos_single_row CHECK (id = 1)
);
```

### Tabla `catalogo_recomendaciones` (Fase 4B)

```sql
CREATE TABLE catalogo_recomendaciones (
  id      bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre  text NOT NULL,           -- nombre breve (1-4 palabras)
  tipo    text,                    -- psicologico | analitico | operativo | marcado
  activa  boolean DEFAULT true,
  orden   integer DEFAULT 0
);
```

### Tabla `catalogo_experimentos` (Fase 4D)

```sql
CREATE TABLE catalogo_experimentos (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre      TEXT NOT NULL,
  descripcion TEXT,
  activo      BOOLEAN DEFAULT true,
  orden       INTEGER DEFAULT 0
);
-- Primer experimento: "Zona naranja" (migrado desde zona_naranja_* de sesiones)
```

### Tabla `diagnostico_experimentos` (Fase 4D · renombrada en Fase 13)

```sql
-- Antes: experimento_registros. Renombrada a diagnostico_experimentos (Fase 13)
-- por consistencia con diagnostico_errores.
CREATE TABLE diagnostico_experimentos (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  sesion_date     DATE NOT NULL,
  experimento_id  BIGINT NOT NULL REFERENCES catalogo_experimentos(id),
  presente        BOOLEAN DEFAULT false,  -- ¿la condición apareció ese día?
  resultado       TEXT,              -- T | S
  valor           NUMERIC,           -- $ propio del experimento (T +, S −) — Fase 15
  nota            TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE (sesion_date, experimento_id)
);
```

> Estadística de decisión: con ≥ 20 casos con resultado → sugerencia automática (adoptar / descartar / neutro). Sin umbral mínimo, los datos no son concluyentes.
> **Fase 13:** la tabla legado `sesion_casuisticas` (errores viejos, duplicados en `diagnostico_errores`) fue **eliminada**. Las condiciones de mercado que estaban registradas como errores (Contra Resistencia, Contra Máximo Premercado, 3ª Corrida, etc.) se **migraron a experimentos** con su T/S.

### Tabla `fomc_dates`

```sql
CREATE TABLE fomc_dates (
  date        DATE PRIMARY KEY,
  description TEXT DEFAULT 'FOMC Meeting'
);
-- Fechas cargadas: 2025-2026 (migraciones 2026-06-17-fomc-dates-*.sql)
```

### Tablas Apex Tracker (Fase 16)

```sql
-- Cuentas de evaluación / PA de Apex
CREATE TABLE apex_cuentas (
  id, nombre, numero_cuenta,
  tamano, balance_inicial, drawdown_max, profit_target,
  safety_net_balance, piso_congelado,   -- safety net: congela el threshold tras tocarlo
  min_dias, contratos_max,
  estado,            -- evaluacion | recuperacion | critico | safety_net | aprobada | pa | quemada
  fecha_inicio, activa, notas, created_at,
  plan_perfil DEFAULT 'moderado',       -- conservador | moderado | agresivo  (Fase 16, plan dinámico)
  plan_ritmo  DEFAULT 'equilibrado'     -- config del plan persistida en BD (sincroniza dispositivos)
);

-- Registro diario MANUAL por cuenta (cuentas sin auto-export)
CREATE TABLE apex_registros (
  id, cuenta_id (FK → apex_cuentas ON DELETE CASCADE),
  fecha, pnl_dia, balance, threshold, contratos, nota, created_at,
  UNIQUE (cuenta_id, fecha)
);

-- Trades individuales auto-exportados de NT8 (cuentas de evaluación)
CREATE TABLE apex_trades (
  id, account, instrument, market_pos, qty,
  entry_price, exit_price, entry_time, exit_time, exit_name,
  profit (NETO), commission, mae, mfe, etd, bars,
  trade_date, resultado, created_at
);
-- Tabla SEPARADA de `trades` para no mezclar dinero real (PA) con evaluación.
```

> **Apex Tracker (Fase 16):** `apex_cuentas` define los parámetros de cada prueba (drawdown, target, safety net). Los días de cada cuenta se obtienen de **dos fuentes combinadas**: registro manual (`apex_registros`) y/o derivados de trades (`apex_trades` para evaluación; tabla `trades` para la PA real fondeada). El indicador NT8 hace **routing automático por nombre de cuenta**: cuentas `PA-*` → `trades` + Telegram; cuentas de evaluación Apex → `apex_trades` sin notificar.

---

## Historial de cambios a la tabla `trades`

| Tipo | Detalle |
|---|---|
| 🔄 Tabla recreada | `DROP TABLE trades` → `CREATE TABLE trades` nuevo esquema |
| ✏️ Renombrado | `id` → `trade_number` |
| 🔀 Separación | `entry_time TIMESTAMPTZ` → `trade_date DATE` + `entry_time TIME` + `exit_time TIME` |
| 🆕 Columnas nuevas | `strategy`, `etd` |
| 🗑️ Columnas eliminadas | `entry_name`, `created_at` |
| 🔧 Trigger actualizado | `WHERE (trade_date, entry_time) < (NEW.trade_date, NEW.entry_time)` |
| 📦 Datos cargados | 64 trades históricos desde `Trades_2026_V2.csv` |

**Datos históricos:**
- 64 trades | Cuenta: `PA-APEX-232411-03` | Fechas: 03/02/2026 – 08/05/2026
- Instrumentos: `MNQ 03-26` y `MNQ 06-26`

---

## FASE 1 — Infraestructura base y base de datos

- Proyecto Supabase creado, tablas `trades`, `sesiones`, `reglas`
- 64 trades históricos importados vía CSV
- Repositorio GitHub creado, GitHub Pages habilitado sobre rama `main`
- RLS deshabilitado en tablas principales (proyecto personal)

---

## FASE 2 — Dashboard web completo

### Módulos JS

| Archivo | Rol |
|---|---|
| `js/config.js` | Credenciales Supabase y Cloudinary |
| `js/db.js` | Capa de datos: todas las queries a Supabase |
| `js/calendar.js` | Calendario mensual con navegación, colores, festivos CME, FOMC |
| `js/metrics.js` | KPIs, disciplina, métricas cuantitativas |
| `js/table.js` | Tabla de trades paginada, filtrable |
| `js/form.js` | Formulario sesión diaria + experimentos dinámicos |
| `js/charts.js` | 6 gráficas Chart.js |
| `js/gallery.js` | Galería de imágenes por mes con lightbox |
| `js/data.js` | Gestor de catálogos (errores, emociones, experimentos) |
| `js/coach.js` | Coach IA — flujo 3 etapas |
| `js/app.js` | Boot, navegación SPA, modales, lightbox |

### Colores del calendario

| Estado | Color | Badge |
|--------|-------|-------|
| Target | 🟢 Verde | — |
| Stop | 🔴 Rojo | — |
| Break Even | ⬜ Gris | B.E. |
| No operé | ⬜ Gris oscuro | No operé |
| Sin entradas | 🟣 Violeta | Sin entradas |
| Setup válido no tomado | 🟣 Violeta | ⚠️ Setup válido — no entré |
| Festivo | 🔵 Azul | Festivo |
| FOMC | 🟡 Ámbar | FOMC |

---

## FASE 3 — Indicador C# para NinjaTrader 8

`NinjaTrader/SupabaseAutoExport.cs` — exporta trades cerrados automáticamente a Supabase.

- `State.DataLoaded`: suscribe a `ExecutionUpdate` de la cuenta configurada
- Fusión ATM: ventana 3 segundos para acumular ejecuciones múltiples
- **Endpoint:** `POST https://jothoslozctflfrnysrx.supabase.co/rest/v1/trades`
- `commission` v2.2 (2026-06-02): `tradeCommission` acumula `ex.Commission` de **todas las patas** (entrada + salida + scaling + cierres parciales) → round-trip real. `profit` se envía **neto** (bruto − comisión). Antes (v2.1) solo leía la pata de salida → guardaba medio valor. El cambio se gatilló porque NT 8.1.7.0 empezó a reportar $0.65/pata (antes devolvía 0).

---

## FASE 4 — Bot de Telegram (v4.0)

**Flujo:** Telegram → Webhook → Cloudflare Worker #2 → KV → Supabase

**Máquina de estados v4.0:**
```
OPERO → (no) MOTIVO → fin
      → (sí) EMOCION → CONFIANZA → CONTEXTO → CORRIDA → VELAS → ZONAS_CONTRA
              → SETUP → CHECKLIST → REFLEXION
```

---

## FASE 5 — Coach IA (Análisis Chaumer)

### Flujo en 3 etapas (rediseño completo)

El Coach IA opera en un flujo secuencial de 3 etapas, con el **chat de coaching como paso opcional**:

```
┌─ ETAPA 1 ─────────────────────────────────────┐
│  [ Análisis Técnico ]                          │
│   → 🌍 Contexto                               │
│   → 📈 Desarrollo de sesión                   │
│   → ✅ Validación de setups (sin veredicto)   │
└────────────────────────────────────────────────┘
              ↓ se desbloquea
┌─ ETAPA 2 ─────────────────────────────────────┐
│  💬 Chat de coaching (OPCIONAL)               │
│   [ Cerrar sesión ] → notifica Etapa 3        │
└────────────────────────────────────────────────┘
              ↓ habilitado desde Etapa 1
┌─ ETAPA 3 ─────────────────────────────────────┐
│  [ Generar Diagnóstico ]  ← 2ª llamada IA    │
│   → 🎯 Veredicto de setup (VÁLIDA/INVÁLIDA)  │
│   → ⚠️ Errores detectados                    │
│   → 🎓 Aprendizaje del día                   │
│   → 📋 Resumen para diario                   │
│  [ Lista de confirmación de errores ]         │
└────────────────────────────────────────────────┘
[ Guardar ] — siempre visible
```

**El chat es opcional:** el Diagnóstico se habilita directamente tras el Análisis Técnico. Si se usa el chat, el diagnóstico integra todo lo conversado.

### Modelo y configuración

| Parámetro | Valor |
|---|---|
| Modelo | `claude-sonnet-4-6` |
| Max tokens | 3000 |
| Proxy | `broad-hall-c53f.kristerock.workers.dev/api/claude` |
| Etapas | 2 llamadas IA por sesión completa |

### Errores detectados por la IA — formato estructurado

La IA devuelve cada error en formato `NombreCorto | tipo | resultado | detalle`:

```
Miedo | psicologico | T | No tomé la entrada; el precio llegó al target.
Error de Marcación | marcado | ninguno | Marqué la zona 10 pts arriba del nivel correcto.
```

- **NombreCorto:** si coincide con el catálogo de errores → usa ese nombre exacto. Si es nuevo → lo crea en `catalogo_errores`.
- **resultado:** T/S solo para días no operados (¿qué habría pasado?). `ninguno` para días operados.

### Lista de confirmación de errores

Tras generar el diagnóstico, aparece una lista pre-marcada con los errores detectados:
- ✅ Checkbox para confirmar/desmarcar
- Selector de tipo (🧠/📐/⚙️/🗺️) editable
- Badge T/S clickable (toggle) para errores de días no operados
- Badge "nuevo" si el nombre no está en el catálogo
- Badge "ya registrado" si ya existe ese día
- Botón ▾ para ver el detalle largo
- Al guardar, solo los marcados entran al registro

### Sistema prompt — datos incluidos

| Fuente | Contenido |
|---|---|
| `estrategia_chaumer` | Estrategia Chaumer completa (8+ secciones) |
| `setup_reglas` | Reglas documentadas por setup (valida entradas contra reglas escritas) |
| `diagnosticos_diarios` (60 días) | Historial compacto de resúmenes |
| `diagnostico_errores` histórico | Patrones repetidos (≥2 = ⚠️, ≥3 = 🚨) |
| `sesiones` del día | Emoción inicio, confianza, contexto, setup, checklist |
| `trades` del día | P&L, targets, stops, BEs |
| `diagnostico_errores` del día | Errores manuales registrados |
| `experimento_registros` | Experimentos presentes ese día y su resultado |
| `catalogo_errores` | Vocabulario controlado para naming de errores |

### Guardar diagnóstico — tabla `diagnosticos_diarios`

Upsert por `sesion_date` con:
- Secciones de Etapa 1: `sec_contexto`, `sec_desarrollo`, `sec_validacion`
- Secciones de Etapa 3: `sec_veredicto`, `sec_errores`, `sec_aprendizaje`, `sec_resumen_compacto`
- `setups_json`, `estado_emocional_fin_id`, `patron_detectado`
- `chat_messages` (conversación completa)

Adicionalmente: errores confirmados → `diagnostico_errores` con `origen='ia'` y dedup contra manuales del día.

### Historial de conversaciones

Al cargar una fecha pasada con diagnóstico guardado, el chat restaura la conversación completa con separador visual `── Conversación del DD/MMM/YYYY ──`.

---

## FASE 6 — Mejoras UX (Mayo 2026)

### Formulario de sesión

**Checklist separado:**

| Grupo | Ítems | Visibilidad |
|---|---|---|
| Pre-Sesión | Calendario económico · Zonas vigentes | Siempre |
| Operativo | Orden · 5 Velas · Consecución · Estructura | Solo cuando sí se operó |

**Renombrado de etiquetas:**

| Antes | Después |
|---|---|
| "Estado emocional" | "¿Cómo llegué?" |
| "Confianza" | "Confianza pre-sesión" |
| Nuevo campo | "¿Cómo terminé?" (emoción de cierre) |

**Setup válido no tomado:** bloque adicional con setup observado, motivo de no entrada (Duda/Miedo/Zona naranja/Desconfianza/Otro).

### Correcciones Coach IA

| Corrección | Detalle |
|---|---|
| Modelo correcto | `claude-sonnet-4-6` |
| Secciones vacías | Fallback: texto completo en CONTEXTO si parseo falla |
| Reset al navegar | `Coach.refresh()` limpia el panel |
| Botón guardar | Aparece arriba y abajo del chat |
| Auto-carga imagen | `autoCargarImagen(url)` desde `sesion.imagen_url` |

---

## FASE 7 — Limpieza del modelo de datos (Fase 2 del rediseño)

### 2A — Fuente única de emoción/confianza

- `estado_emocional_id` + `nivel_confianza` → **solo en `sesiones`** (momento operativo)
- `estado_emocional_fin_id` → **solo en `diagnosticos_diarios`** (reflexión de cierre)
- Eliminadas las columnas redundantes de `diagnosticos_diarios`

### 2B — Taxonomía de errores unificada

- Columna `tipo` agregada a `catalogo_errores`
- Tipos: `psicologico` | `analitico` | `operativo` | `marcado`
- Selector de tipo inline en el gestor de catálogo (se guarda automáticamente al cambiar)

### 2C — Tabla estructurada de errores

- `diagnostico_errores`: el Coach escribe una fila por error (con tipo) en lugar de `errores_json` frágil
- `detectarPatrones()` y el historial leen de la tabla estructurada
- **Bug corregido:** `patron_detectado` (siempre `false`) ahora compara con el histórico real

---

## FASE 8 — Métricas cuantitativas (Fase 3 del rediseño)

### 3A — Disciplina dividida en 2 métricas

| Métrica | Qué mide | Fuente |
|---|---|---|
| **Disciplina de Proceso** | % de ítems de checklist cumplidos (días operados) | `sesiones.chk_*` |
| **Tasa de Errores** | % días con al menos un error · desglose por tipo | `diagnostico_errores` |

**Modal Tasa de Errores:** barras por tipo (🧠/📐/⚙️/🗺️) + chips de origen (manual/IA/ambos) + barras por nombre.

### 3B — Objetivos y cumplimiento de reglas

**Panel de configuración:** ⚙ Ajustes → "Objetivos y reglas" → 4 campos guardados en BD (`objetivos`):
- Stop máximo por trade ($)
- Máximo de trades por día
- Objetivo de P&L diario ($)
- Límite de pérdida diario ($)

**Card "Cumplimiento de Reglas %":**
- Calcula: `(reglas cumplidas) / (3 × días operados) × 100`
- 3 reglas evaluadas: stops dentro del límite · días dentro del máx de trades · días sin romper límite de pérdida
- Stop respetado: medido por proxy del profit realizado en trades con stop (Opción A)
- Click → modal con desglose: stops dentro del límite, días sin sobre-operar, días sin romper límite, días que lograron el objetivo (informativo, no cuenta para disciplina)

---

## FASE 9 — Errores tipificados + Estadísticas nuevas + Experimentos (Fase 4 del rediseño)

### 4A — Registro unificado de errores

**Modelo final: `catalogo_errores` + `diagnostico_errores`**

- `catalogo_errores`: maestro de nombres breves + tipo (renombrado de `catalogo_casuisticas`)
- `diagnostico_errores`: ocurrencias con nombre corto + `descripcion` larga + `resultado` T/S + `origen` + `catalogo_id` (renombrado de `errores_sesion`)
- Tabla legado `diagnostico_errores` anterior (solo IA, texto plano) eliminada

**Display compacto en modal del calendario:**
- Chips: `emoji-tipo NombreCorto · 🤖/🤝 origen · T/S`
- Clic en chip → despliega el detalle completo de ese día

**IA auto-tipifica y crea catálogo:**
- Formato: `NombreCorto | tipo | resultado | detalle`
- Si el nombre ya está en el catálogo → usa ese nombre exacto (sin duplicar)
- Si es nuevo → badge "nuevo" en la confirmación → al guardar se crea en `catalogo_errores`
- Dedup: si IA detecta lo mismo que ya registraste manualmente → marca `origen='ambos'`, no duplica

### 4B — Catálogo de recomendaciones

**Modelo:** `catalogo_recomendaciones` (maestro) + columnas `recomendacion_id`, `recomendacion_ia`, `recomendacion_manual` en `diagnostico_errores`.

**Formato IA extendido a 6 partes por error:**
```
NombreError | tipo | resultado | detalleError | NombreRec | textoRec
```
- `NombreRec`: si existe en el catálogo → enlaza. Si es nuevo → badge "nueva" → se crea al confirmar.
- `textoRec`: acción concreta específica para ese día.

**Lista de confirmación (Coach):** muestra recomendación IA debajo de cada error (en verde) + campo editable para la nota manual del trader. Al guardar: `recomendacion_ia` + `recomendacion_manual` se persisten en `diagnostico_errores`.

**Modal del calendario:** el detalle desplegable del error incluye la recomendación IA y la nota manual.

**Ajustes → Recomendaciones:** gestiona el catálogo (agregar, activar/desactivar, tipo inline editable).

### 4C — Estadísticas nuevas

**Card "Días limpios":**
- Valor: racha actual de días consecutivos sin errores
- Sub: X/Y días sin errores en el período
- Modal: barra visual %, lista de días con errores

**Card "Dejé de ganar":**
- Valor: targets dejados pasar (errores con `resultado='T'` en días no operados)
- Sub: XT · YS dejados pasar
- Modal: lista por día (error + resultado)
- La IA llena `resultado` T/S automáticamente para días no operados; el trader lo confirma/corrige en la lista

### 4D — Experimentos (reglas en prueba)

**Sistema dinámico** que reemplaza los campos `zona_naranja_*` hardcodeados:

**Formulario de sesión → sección "🧪 Experimentos activos":**
- Lista dinámica de experimentos activos del catálogo
- Por cada uno: toggle "¿Se presentó?" → si sí: botones T/S + nota libre
- **Se guarda automáticamente** al cambiar (no requiere botón guardar)

**Ajustes → "Catálogo de Experimentos":**
- Agregar / activar / desactivar experimentos
- Primer experimento: "Zona naranja" (migrado desde `zona_naranja_*`)

**Card "Experimentos" en Métricas:**
- Muestra cuántos experimentos tienen datos suficientes para decidir
- Modal con % target por experimento y conteo de muestras
- Sugerencia automática con ≥ 20 casos:
  - ≥ 60% target → ✅ "Candidato a regla: considera adoptarlo"
  - ≤ 35% target → ❌ "Descartar: no aporta como filtro"
  - Entre 35%-60% → ⚖️ "Neutro: sin evidencia suficiente"

---

## FASE 10 — Módulo de Reglas por Setup

**Motivación:** El Coach IA diagnosticó (2026-06-01) que operar un setup sin reglas escritas es una fuente de error, no de ventaja. Esta fase cierra esa brecha de forma estructural.

### Nueva sección principal "Estrategia"

- "Estrategia" sale de ser una **pestaña del Coach IA** y pasa a ser **sección principal** del menú lateral (entre *Registrar* y *Datos*, ícono 📖 `ti-book-2`).
- Módulo nuevo `js/estrategia.js`. Lazy-init en `Nav.go('estrategia')`.
- La sección contiene **dos bloques**:
  1. **Reglas por Setup** (módulo nuevo)
  2. **Estrategia general Chaumer** (editor movido tal cual desde el Coach)
- La pestaña "Estrategia" del Coach fue **eliminada** (`renderEstrategia` removida de `coach.js`).

### Reglas por Setup

**3 setups** (tarjetas), cada uno con **toggle de dirección** Común / Alcista / Bajista:

| Setup | Key | Descripción |
|---|---|---|
| IRI en Apertura | `iri_apertura` | Primer impulso tras rompimiento del rango de premercado |
| IRI en Continuación | `iri_continuacion` | Continuación clásica Impulso·Retroceso·Impulso desde zona |
| Reingreso | `reingreso` | Reentrada tras consecución fallida + reversión + rompimiento del retroceso |

**7 campos estructurados por setup+dirección:** activación/contexto, secuencia/estructura, entrada, stop, gestión/target, invalidación/filtros, notas.

- Persisten en `setup_reglas` vía `DB.saveSetupRegla` (upsert por `setup,direccion`).
- **Memoria por dirección:** al cambiar de toggle, los cambios sin guardar de la dirección anterior se conservan en memoria.
- Guardado explícito por tarjeta (botón "Guardar reglas").
- **Caso base pre-cargado:** Reingreso (Común) con la secuencia capturada por el Coach el 2026-06-01 (reingreso alcista 09:08 → TARGET en simulación).

### Coach IA — integración

- `buildSystemPrompt` agrega un bloque **"REGLAS DE SETUPS DOCUMENTADAS POR EL TRADER"** (`cargarReglasSetup`).
- El Coach valida cada entrada contra estas reglas y **advierte si un setup no tiene reglas escritas** (no operar en real sin reglas documentadas y testeadas).
- `Coach.clearCache()` expuesto para invalidar la caché de estrategia al editar reglas/secciones desde la nueva sección.

---

## FASE 11 — Historial como sección propia

**Continuación de la limpieza del Coach IA** (tras sacar Estrategia en Fase 10).

- "Historial" sale de ser **pestaña del Coach IA** y pasa a **sección principal** del menú (entre *Anual* y *Coach IA*, ícono 🕐 `ti-history`).
- El Coach IA **ya no tiene barra de tabs**: es un flujo único de análisis (Estrategia e Historial ahora son secciones propias).

### Acoplamiento — render se queda en `coach.js`

A diferencia de Estrategia (módulo independiente), el render del Historial **permanece en `coach.js`** porque está acoplado al Coach: al hacer clic en un día carga ese diagnóstico en el panel de análisis. Se expone `Coach.renderHistorial()` para que `Nav.go('historial')` lo invoque (y se re-renderiza en cada visita para reflejar diagnósticos nuevos).

### Flujo Historial → Coach (sin doble carga)

- Clic en un día → `verDiagnostico(date)` setea `pendingDate` y llama `Nav.go('coach')`.
- `init()` y `refresh()` honran `pendingDate` (cargan esa fecha; si no, hoy/coachDate) y lo limpian. Evita la condición de carrera de cargar dos fechas a la vez.
- `cargarFecha()` sincroniza el `coachDatePicker` con la fecha cargada.
- Eliminados: `switchTab`, listeners de tabs, CSS muerto de `.coach-tabs` / `.coach-tab-btn`.

---

## FASE Extra — UX Coach IA + Skill de trabajo (3 Jun 2026)

- **Coach IA — navegación día a día:** botones `‹ ›` junto al date picker para ir al día anterior/siguiente. `shiftWeekday()` **salta sábados y domingos**. El botón "adelante" se deshabilita si el próximo día hábil sería futuro. El picker se conserva para saltar a cualquier fecha.
- **Coach IA — diagnóstico duplicado (fix):** (A) regla en el prompt para que la IA no emita el diagnóstico estructurado durante el chat; (B) al restaurar el chat de una fecha, se filtran los mensajes de orquestación (instrucción + respuesta de análisis/diagnóstico) para que no se dupliquen con sus paneles.
- **Resumen del diario:** se quitan los backticks con que la IA envuelve la línea (`limpiarResumen`).
- **Skill global `flujo-desarrollo`** (en `~/.claude/skills/`): captura el flujo de trabajo (analizar→aprobar→implementar→verificar→commit, español, conventional commits, verificación real, UI moderna). Reutilizable en los 3 proyectos (Trading Journal, app IA, finanzas).

---

## FASE 12 — Premercado / contexto técnico

Captura el contexto técnico del premercado para enriquecer el análisis de la IA. **Web + Telegram + IA.**

- **Campos** (en `sesiones`): cierre ayer, apertura, máx/mín premercado (+ rango auto-calculado), hasta 5 líneas naranjas de soporte y 5 de resistencia (progresivas), noticias.
- **Dos "no operé"** (`se_conecto`): caso 1 (no me conecté → mínimo) vs caso 2 (me conecté sin setup → pide premercado + análisis).
- **Web:** sección "🌅 Premercado" en Registrar Sesión (`form.js`), líneas naranjas que se revelan una a una al llenarse.
- **Telegram (`worker.js`):** flujo de premercado tras "¿Operaste?"; líneas naranjas por comas; `/skip` en cada paso; pregunta "¿Te conectaste a analizar?" para el caso 2.
- **IA:** bloque "PREMERCADO / CONTEXTO TÉCNICO" en el system prompt del Coach.
- **Fix de despliegue del bot:** `wrangler deploy` borraba las Variables del dashboard (quedaba `SUPABASE_URL` undefined → no leía emociones ni guardaba sesiones). Se definieron en `wrangler.toml` `[vars]` para que persistan. `BOT_TOKEN` queda como Secret.

> **Pendiente:** verificar que el Worker `/api/session` (no versionado) pase los campos de premercado al guardar desde la **web** (el bot ya guarda OK).

---

## FASE 13 — Limpieza del modelo de errores / experimentos

- **Modal del día rediseñado** (3 pestañas: 🖼 Gráfica · 📌 Resumen · 📊 Operativa). El Resumen es visual "de un vistazo": estado, P&L, emoción in→cierre, confianza, veredicto, ✅Bien/⚠️A mejorar, 💡Para la próxima, y botón "Ver diagnóstico completo" → Coach. Usa `diagnosticos_diarios` (antes no se cargaba). Arregla el bug de días `no_opero` con diagnóstico que no mostraban resumen.
- **Limpieza `diagnostico_errores`:** 5 fechas viejas (abr–may) tenían el texto del diagnóstico partido en ~60 fragmentos en el campo `error`. Se reconstruyeron a filas limpias (error = nombre de catálogo, descripción = texto completo), creando ~9 entradas de catálogo nuevas (Rabia, FOMO, Ansiedad, Sobreconfianza, etc.).
- **Tabla `sesion_casuisticas` eliminada** (legado de errores, 100% duplicada en `diagnostico_errores`).
- **`experimento_registros` → `diagnostico_experimentos`** (rename por consistencia).
- **Condiciones de mercado migradas a experimentos:** ~18 ocurrencias que estaban como errores (Contra Resistencia, Contra Máximo Premercado, 3ª Corrida, Contra Máximo de la Apertura, etc.) se movieron a experimentos con su T/S, creando los experimentos faltantes. Verificado: 0 pérdida de datos.
- **Fix filtro de cuenta (modal del calendario):** `openDayModal` ahora filtra los trades por la cuenta seleccionada en el dropdown (`accountFilterCalendar`) antes de abrir el modal — antes el Resumen y Operativa sumaban todas las cuentas. Además, fix pre-existente: "Todas las cuentas" no persistía (la restauración no reconocía `'all'` porque `allAccountsList` solo tiene cuentas reales) → revertía a PA-APEX al recargar/navegar. Ahora `'all'` persiste.
- **Fix puntos de retroceso (4 Jun):** se calculaba como `|P&L de TODAS las cuentas / 2|` (mezclaba Apex + Sim). Ahora el modal lo deriva de los trades ya filtrados por cuenta (`|P&L cuenta / 2|`), y `updateRetroceso` (form) filtra por la cuenta persistida antes de calcular. Corregido el dato del 2026-06-04 en BD (74 → 47).

---

## FASE 14 — Errores (renombrado) + métricas de costo y tendencias (5-10 Jun)

- **Renombrado global "Casuísticas" → "Errores"** en toda la UI (5266a5c... `533765a`). El concepto pasa a llamarse explícitamente *errores* (la función alias `casuistica:error` se mantiene por compatibilidad de código).
- **Experimentos en Registrar — rediseño:** dropdown + botones T/S en lugar de lista hardcodeada; sección "Tipificación" renombrada.
- **Experimentos en días no operados con conexión:** si me conecté a analizar (aunque no operé) ya puedo registrar el resultado T/S de los experimentos del día.
- **Checklist Pre-Sesión movido** antes del bloque de "motivo de no operación".
- **Métricas (drill-down):** modal de Errores con desglose navegable y títulos dinámicos; **costo $ de errores**, tendencias, experimentos vs base (tasa de acierto base del período) y recurrencia.
- **Fixes:** color/signo de "Peor Día" según el P&L real; nav inferior mobile scrollable horizontal; filtro de cuenta carga PA-APEX por defecto en la primera visita; `CLAUDE.md` agregado como contexto automático.
- **Coach:** auto-aplica el diagnóstico cuando la IA lo genera dentro del chat.

---

## FASE 15 — Laboratorio de Experimentos (sección propia, 12 Jun)

Los experimentos salen de ser solo unas cards en Métricas y pasan a **sección principal** (`js/experimentos.js`).

- **Dashboard de decisión:** tarjetas de veredicto por experimento (adoptar / descartar / neutro) con umbrales `MIN_MUESTRAS=20`, `UMBRAL_ADOPTAR=60%`, `UMBRAL_DESCARTAR=35%`.
- **Matriz cronológica** tipo Excel (fechas × experimentos) para ver el patrón en el tiempo.
- **Clic en tarjeta** → modal con todas las fechas de ese experimento; permite **editar el valor de registros históricos** desde el modal.
- **Valor propio en $** por experimento (`diagnostico_experimentos.valor`): target/stop de la prueba, independiente del P&L del día (T → +, S → −). Migración `2026-06-12-valor-experimentos.sql`.

---

## FASE 16 — Apex Tracker (12-16 Jun)

Nueva sección **Apex Tracker** (`js/apex.js`) para seguir las pruebas de fondeo Apex sin mezclarlas con la operativa real.

- **Tablas nuevas:** `apex_cuentas` (parámetros de cada prueba: drawdown, target, safety net, piso congelado, contratos máx, estado), `apex_registros` (registro diario manual) y `apex_trades` (trades individuales auto-exportados de NT8 para cuentas de evaluación). Migraciones `2026-06-12-apex-tracker.sql`, `2026-06-13-apex-trades.sql`.
- **Cards por cuenta** con rediseño moderno: balance / threshold / espacio al drawdown, progreso al target, hitos, estado (Evaluación, En recuperación, Crítico, Safety net, Aprobada, PA, **Quemada** en rojo).
- **Dos zonas:** PA (fondeada) vs cuentas de evaluación.
- **Vista de detalle por cuenta** con gráfica y análisis de riesgo.
- **Auto-carga de trades desde NinjaTrader (fase 2):** la app deriva los días (P&L, balance, threshold) desde `apex_trades`; comisiones por lado en el indicador.
- **Plan dinámico para pasar la prueba:** perfil de riesgo + ritmo (`plan_perfil`, `plan_ritmo`) persistidos **en BD** para sincronizar entre dispositivos (antes en localStorage); alerta de contratos máximos. Migración `2026-06-13-apex-plan-config.sql`.
- **La PA real** (`PA-APEX-232411-03`) deriva sus días recientes de la tabla `trades` (journal), no de `apex_trades`. Historial reconstruido desde el Excel oficial de Apex.

---

## FASE 17 — Análisis unificado (Análisis + Anual, 13 Jun)

`js/charts.js` se reescribe: las antiguas secciones "Análisis" y "Resumen Anual" se **fusionan en una sola sección adaptativa** con selector de período **Mes / Trimestre / Anual**.

- Selectores directos de mes/trimestre/año en el navegador; layout tipo Anual.
- Gráficas adaptativas según el período; el **capital inicial** se gestiona en la sección Datos (`annual_capital_inicial` en localStorage).
- **Rediseño UX de gráficas:** donut con leyenda legible, P&L por hora (franja horaria local), curva de equity con puntos coloreados por signo, export PDF/imagen, barras sin corte. Fix: las gráficas se adaptan al ancho con `minmax(0, …)`.

---

## FASE 18 — Indicadores NT8: routing por cuenta + SupabaseDailyLevels (16-18 Jun)

- **Routing automático por nombre de cuenta** en `SupabaseAutoExport.cs`: cuentas `PA-*` → tabla `trades` + notificación a Telegram; cuentas de evaluación Apex → `apex_trades` **sin** notificar. Una sola instancia captura **varias cuentas** con selección (v3.0); el dropdown lista solo cuentas activas.
- **Nuevo indicador `SupabaseDailyLevels.cs`:** sube automáticamente el OHLC de ayer (PDO/PDH/PDL/PDC) y la apertura, escribiendo en las columnas `precio_*_ayer` de `sesiones`. v2.0 calcula **RTH vs overnight** clasificando cada vela por su hora ET (ONH/ONL overnight). Migraciones `2026-06-17-sesiones-apertura-ayer.sql`, `2026-06-17-sesiones-max-min-ayer.sql`.
- **Telegram:** el bot **ya no pide ni guarda** premercado/cierre/apertura — esos niveles los pone el indicador. Esto evita duplicación y errores manuales.

---

## FASE 19 — Coach IA: futuro continuo + niveles de referencia (15-17 Jun)

- **Futuro continuo:** el Coach trata NQ/MNQ como un único futuro continuo (no distingue contratos 03-26/06-26 al analizar la serie).
- **Niveles PDH/PDL en premercado** y **datos de referencia ordenados** (PDO/PDH/PDL/PDC/PDR) en el bloque de contexto del system prompt.
- **Analizar únicamente la cuenta PA real** (`PA-APEX-232411-03`): el Coach no mezcla trades de evaluación/sim en su análisis.

---

## FASE 20 — Calendario rediseñado (15-18 Jun)

- **Título hero central** + métricas compactas tipo **chips** arriba, en una sola fila; se quita el selector de período y la card de Experimentos del calendario.
- **Equity del mes** y **P&L Neto Total** del calendario (totales sin decimales, con color por signo).
- Ajustes de espaciado (título→métricas→leyenda) y se quita el mes redundante entre las flechas (ya sale en el título).
- **Días FOMC:** los automáticos se ven igual que el FOMC manual; un día FOMC operado conserva el fondo FOMC con borde del color del resultado.

---

## FASE 21 — Disciplina / Reglas / Errores por 3 fases (Bloques 1-5, 19-21 Jun)

Reestructuración para conectar **Disciplina, Reglas y Errores** bajo un eje común: las **3 fases del proceso**. Plan completo en `docs/plan-disciplina-fases.md`.

**Eje — 3 fases:** Fase 1 Pre-sesión · Fase 2 Lectura del setup (la más débil) · Fase 3 Ejecución.
**Mapeo del checklist (7 ítems):** F1 = `chk_cuenta_pa`, `chk_noticias`, `chk_zonas`; F2 = `chk_5velas`, `chk_estructura`, `chk_consecucion`; F3 = `chk_orden`.

- **Bloque 1 — Alerta de riesgo proactiva:** si `puntos_retroceso × 2` (riesgo en $) supera `objetivos.stop_max_usd`, el formulario alerta **antes de guardar** y pregunta "¿la viste?". Campo `alerta_riesgo_vista` → `true` impulsividad (psicológico) / `false` falla analítica (proceso). El Coach distingue ambos casos. Migración `2026-06-19-sesiones-alerta-riesgo.sql`.
- **Bloque 2 — Checklist por 3 fases:** formulario reorganizado en Fase 1/2/3; nuevo ítem `chk_cuenta_pa` (7º). Métrica "**Cumplimiento por fase**" en el modal de Disciplina (dónde está la fuga del proceso). Migración `2026-06-19-sesiones-chk-cuenta-pa.sql`.
- **Bloque 3 — Modelo de error unificado:** columnas `fase` + `regla_vista` en `diagnostico_errores`. Parte A: selector de fase manual + badge de fase en la lista + "Errores por fase" en el modal. Parte B: el Coach IA asigna fase + regla_vista (formato de error pasa de 6 a 8 partes; parser retro-compatible). Migración `2026-06-19-errores-fase-regla.sql`.
- **Bloque 4 — Métricas conectadas:** banner de **racha de disciplina** (días operados consecutivos con checklist 100%) en el modal de Disciplina; bloque "**Reglas: impulsividad vs análisis**" en el modal de Errores. Solo `metrics.js` + `db.js`.
- **Bloque 5 — Registrar por fases (UX):** cada fase del checklist es columna vertebral con acento de color y **badge de progreso en vivo** (0/3 → 3/3, verde al completar).

---

## FASE 22 — Registrar: cards + modo lectura/editar (19-21 Jun)

- **Formulario en secciones** (cards): cada bloque del Registrar en su propia tarjeta para un diseño más moderno; ítem "Cuenta PA" y campos overnight/rangos.
- **Modo lectura por defecto:** al abrir una sesión existente (desde el calendario o la tabla de Trades) el formulario se abre **bloqueado** (envuelto en un `<fieldset>` deshabilitado, que cubre también los controles dinámicos). El botón del modal del calendario ahora dice **"Ver sesión"**.
- **Nuevo botón "Editar sesión"** en el encabezado de la sección: desbloquea el formulario y muestra Guardar / Limpiar. Un día **sin** sesión abre directamente en modo edición para crear.

---

## Checklist — Por 3 fases del proceso (Fase 21)

### Fase 1 — Pre-sesión (siempre visible)

| Campo DB | Descripción |
|---|---|
| `chk_cuenta_pa` | Cuenta PA correcta/activa verificada |
| `chk_noticias` | Calendario económico verificado (sin noticia roja) |
| `chk_zonas` | Zonas vigentes verificadas |

### Fase 2 — Lectura del setup (solo cuando sí se operó)

| Campo DB | Descripción |
|---|---|
| `chk_5velas` | Máx 5 velas en corrida (auto-invalida si `velas_corrida > 5`) |
| `chk_consecucion` | Zona marcada con rompimiento + consecución + retroceso |
| `chk_estructura` | Estructura IRI fluida |

### Fase 3 — Ejecución (solo cuando sí se operó)

| Campo DB | Descripción |
|---|---|
| `chk_orden` | Orden precolocada a tiempo |

---

## Mapa visual del gráfico (en `estrategia_chaumer`)

| Color | Elemento |
|---|---|
| Gris | Zonas S/R — ÚNICAS zonas válidas de la estrategia |
| Rojo (línea) | Mínimo de premercado |
| Verde (línea) | Máximo de premercado |
| Naranja (zonas/flechas) | Puntos de referencia experimentales — NO son reglas |
| Blanco (líneas) | Referencias temporalidad superior (5 min) |
| Azul punteado (volumen) | Velas premercado con volumen alto |
| Herramienta R/R | Anchor gris · Risk salmón · Reward verde lima — NO son zonas de mercado |

---

## Notas sobre la Metodología Chaumer

- **Regla de las 5 velas:** máximo 5 velas en el impulso. Sin excepciones.
- **Marcación de zonas:** solo con rompimiento + consecución + retroceso confirmado.
- **Zonas vigentes en target:** ninguna zona vigente entre entrada y target.
- **Orden precolocada:** lista antes del cierre de la vela de rompimiento.
- **FOMC / Noticias rojas:** no operar en días Fed. No entrar 5 min antes de noticias rojas.
- **Stop máximo:** 60 puntos / $120 por trade.
- **Ratio mínimo:** 1:1.
- **Temporalidad principal:** 1 minuto en NQ/MNQ Futures.
- **Zona naranja:** experimento activo en prueba. Con ≥ 20 casos el sistema emitirá sugerencia automática de adoptar o descartar.

---

## Estado actual del proyecto

### ✅ Funcionando

**Dashboard web (secciones):**
- Calendario + Métricas, Trades, Registrar Sesión (cards + modo lectura/editar), Análisis (unificado Mes/Trimestre/Anual), Experimentos (Laboratorio), Apex Tracker, Galería/Imágenes, Historial, Coach IA, Estrategia, Datos/Catálogos

**Coach IA:**
- Flujo en 3 etapas (Análisis Técnico → Chat opcional → Diagnóstico)
- 2 llamadas a Claude por sesión completa
- Lista de confirmación de errores con nombre corto + detalle + T/S
- Auto-crea entradas en el catálogo de errores para nombres nuevos
- Dedup automático contra errores manuales del día
- Restaura conversación guardada al cargar fechas pasadas

**Métricas cuantitativas:**
- P&L · Tasa de Acierto · Disciplina de Proceso (7 ítems, **cumplimiento por fase**) · Tasa de Errores
- Cumplimiento de Reglas · Días Limpios · Dejé de Ganar · costo $ de errores
- **Racha de disciplina** · impulsividad vs falla analítica · errores por fase
- Mejor/Peor día · Max Drawdown · Profit Factor · Avg Win/Loss

**Apex Tracker (Fase 16):**
- Cuentas de fondeo con parámetros (drawdown, target, safety net, piso congelado, estado)
- Días derivados de auto-export NT8 (`apex_trades`) + registro manual (`apex_registros`)
- PA real deriva de `trades`; plan dinámico (perfil + ritmo) sincronizado en BD

**Indicadores NT8:**
- `SupabaseAutoExport.cs` — routing por nombre de cuenta (PA→`trades`+Telegram, eval→`apex_trades`); multi-cuenta v3.0
- `SupabaseDailyLevels.cs` — niveles diarios OHLC + overnight (RTH vs ON por hora ET) a `sesiones`

**Experimentos (`diagnostico_experimentos` + `catalogo_experimentos`):**
- ~16 condiciones bajo prueba: Zona naranja/blanca, Contra Resistencia/Soporte/Máx/Mín Premercado/Apertura/Histórico, 3ª Corrida, Reingreso, Mercado/Rompimiento Extendido, Target Largo, etc.
- Cada una acumula T/S; con ≥ 20 casos sugiere adoptar/descartar
- `presente` marca si la condición apareció ese día (solo presentes cuentan)

**Reglas por Setup (Fase 10):**
- Sección Estrategia con reglas estructuradas por setup + dirección
- Coach IA valida entradas contra las reglas escritas
- Reingreso documentado como caso base; IRI Apertura/Continuación listos para llenar

### ⚠️ Pendiente / A tener en cuenta

- ✅ **P&L y comisiones (RESUELTO Jun 2026):** convención NETO unificada. Script v2.2 envía profit neto + comisión round-trip; los 7 trades live previos normalizados por SQL.
- ✅ **Migraciones 2026-06-19 (RESUELTO Jul 2026):** `2026-06-19-sesiones-chk-cuenta-pa.sql` y `2026-06-19-sesiones-alerta-riesgo.sql` ya corridas. Tras cualquier `ALTER TABLE` ejecutar `NOTIFY pgrst, 'reload schema';`.
- ✅ **Worker web `/api/session` (RESUELTO Jul 2026):** guarda OK los campos nuevos (`chk_cuenta_pa`, `alerta_riesgo_vista`, premercado y `hora_noticia_roja`) al registrar desde la web.
- 🤖 **Recomendaciones tipificadas en Coach IA (Fase 4B):** pendiente de implementar.
- 🔒 **Seguridad RLS (pendiente):** las tablas tienen RLS deshabilitado ("UNRESTRICTED"). Es intencional para proyecto personal, pero la `anon key` viaja en el JS público de GitHub Pages → con RLS off da acceso total. Pendiente endurecer con RLS + políticas si se comparte la URL o crece el proyecto.
- El bot de Telegram no genera análisis IA ni soporta imágenes.
- `trade_number` y `etd` quedan NULL en trades auto-exportados desde NT8.
- **Recomendaciones en Coach IA (Fase 4B):** columnas de recomendaciones tipificadas y catálogo — pendiente de implementar.

### 🔜 Próximas mejoras planificadas

- 🔒 Endurecer seguridad con RLS + políticas (ver Pendiente arriba)
- Estadísticas de "dejé de ganar" en dólares (requiere campo de target planeado)
- Resumen IA en bot de Telegram
- Backup periódico BD (Supabase scheduled exports)

---

## Checkpoint Jun 2026 — hitos completados (movidos desde CLAUDE.md)

> Estos ítems estaban en la sección "Pendientes" de CLAUDE.md pero ya están COMPLETADOS.
> Se conservan aquí como registro; el detalle vive en los planes/migraciones citados.

- **📕 Unificación del Rulebook — COMPLETADO (2026-06-26).** 4 tablas (`setup_reglas`,
  `estrategia_chaumer`, `checklist_items` + la muerta `reglas`) unificadas en la canónica
  **`reglas`**. Plan: `docs/plan-unificacion-reglas.md`. Migraciones:
  `2026-06-26-reglas-unificacion-fase1.sql`, `...-fase4-archivar.sql`, `...-modelo-final.sql`.
  Modelo: 3 capas (filosofia/proceso/riesgo); `setup` (iri/reingreso) etiqueta en proceso
  Fase 2; `tipo` dura/blanda; checklist = `es_checklist`+`fase`. Stop en PUNTOS
  (`objetivos.stop_max_puntos`, default 80). Reglas DURAS: stop≤80, R:R 1:1 (nunca mover
  stop/target), target sin zonas en contra.
- **🤖 Coach IA — análisis rediseñado (2026-06-26).** Las 3 secciones (Contexto/Desarrollo/
  Validación) se renderizan en tarjetas (chip de sesgo, línea de tiempo, checklist de setup);
  prompt breve, sin volcar datos crudos, con bloque "NO ADIVINES precios".
- **⚙️ Bot Telegram — auto-deploy activo (2026-06-26):** GitHub Action despliega el bot en
  cada push a `TelegramBot/**` (secret `CLOUDFLARE_API_TOKEN`).
- **🔒 Blindaje de seguridad (RLS + Auth) — COMPLETADO (2026-06-24).** RLS activo en todas
  las tablas; web vía login Supabase Auth (`authenticated`); bot, Worker `/api/session` e
  indicadores NT8 con `service_role`. `anon` bloqueada. Plan: `docs/plan-seguridad-rls.md`.
  **NO usar "Resolve issue" de Supabase** (rompe las políticas). Tablas nuevas: activar RLS
  + política `auth_all`. Export NT8 verificado (2026-06-25); grants service_role en
  `docs/migrations/2026-06-25-grants-service-role.sql`. Routing: cuentas sin prefijo `PA-`
  → `apex_trades` sin Telegram; `PA-*` → `trades` + Telegram.
- **Reestructuración Disciplina/Reglas/Errores por fases — COMPLETA (Bloques 1-5,
  2026-06-19).** Ver `docs/plan-disciplina-fases.md`.

---

## Checkpoint Jul 2026 — disciplina, métricas coherentes y ventana de noticia roja

- **📊 Coherencia de métricas (COMPLETADO).** Clasificador global `tradeOutcome`
  (`db.js`): un trade no-BE sin `resultado` target/stop (p. ej. cerrado `close`) se
  clasifica por el **signo del P&L** → coherente con el color del día. Aplicado en
  acierto/target/stop de todas las vistas. El conteo de "trades" es no-BE (reales) e
  idéntico en calendario y análisis.
- **📅 Calendario (COMPLETADO).** Color del día por P&L cuando no hay `resultado`;
  día FOMC **operado** toma el color del resultado (la marca FOMC queda solo en el
  badge), FOMC sin operar mantiene el ámbar; "días con actividad" = operados ∪
  conectados/analizados. Eliminado el código muerto `renderMonthlySummary`.
- **🎯 Disciplina unificada (COMPLETADO).** Cálculo canónico único
  (`calcDisciplinaStats` en `db.js`) usado por calendario, análisis y dashboard →
  mismo % en las tres. Consciente de fase y **no penaliza ítems sin registrar**
  (reglas nuevas en días previos = N/A). Cobertura por ítem en el dashboard.
- **🖥️ Dashboard de Disciplina (COMPLETADO).** Sección propia + ítem de nav
  "Disciplina"; estructura tipo semáforo por fase, racha, errores por tipo/causa raíz;
  selector de período (Mes/Trimestre/Todo) + navegación de mes. Las tarjetas
  "Disciplina" y "Errores" del calendario abren el dashboard (se retiraron los modales).
- **🚫 Ventana de noticia roja (COMPLETADO).** La hora se registra **por día** en
  `sesiones.hora_noticia_roja` (Registrar sesión web + AddOn NT `ChecklistChaumer`, que
  muestra alerta en vivo "NO OPERAR" ±5 min, bloquea GO y auto-marca `chk_noticias`).
  **Verificación automática** en la web: cruza la hora con `entry_time` de los trades
  para detectar si se operó en la ventana (modal del día + stat en el dashboard). Regla
  movida a Fase 1; columna vieja `reglas.hora_noticia` eliminada.
- **📕 Reglas y Estrategia (COMPLETADO).** Rediseño con pestañas por capa; "Proceso"
  renombrada a **"Reglas"** con filtro por fase; Fase 2 separada en subgrupos
  **IRI / Reingreso**; reordenamiento por flechas; `stop_max_puntos` movido a Fase 2.
- **📝 Registrar sesión (COMPLETADO).** Checklist por fases en **tarjetas** con títulos
  grandes; Fase 2/3 se ocultan cuando "No operé Hoy" (aplican solo si hubo operación).
- **🖧 NinjaTrader (COMPLETADO).** `SupabaseDailyLevels` corregido: el envío estaba
  atado a `State==Realtime` en una transición que ocurre en histórico → ahora guarda el
  nivel pendiente y lo envía al entrar a tiempo real, con logging del resultado.
- **🎨 UX.** Scrollbars más gruesas y visibles en toda la app.
- Migraciones: `2026-06-30-reglas-hora-noticia.sql`,
  `2026-07-01-reglas-mover-fase-hora-sesion.sql`,
  `2026-07-02-drop-reglas-hora-noticia.sql`, + carga manual de un trade de Apex 13.
- **🖧 AddOn `ChecklistChaumer` — checklist por setup (7 Jul).** Selector **IRI |
  Reingreso** (persistido en el config local) que filtra la Fase 2: ítems comunes +
  los del setup elegido (Fase 1 y 3 comunes, incl. reglas de riesgo). Cada fase en
  **tarjeta** con barra de acento de color y badge de progreso `n/m`. El GO exige el
  100% de los ítems *visibles*; cambiar de setup no borra marcas (estado en
  `Item.Checked`, se escriben todas las claves al JSONB). Migración
  `2026-07-07-checklist-setup-orden.sql`: `chk_contexto` pasa a común (aplica a ambos
  setups), orden canónico del checklist (AddOn = web) y título de consecución
  "= entrada".

---

## Checkpoint Jul 2026 (2) — checklist normalizado en `sesion_checklist`

Rediseño del modelo de datos del checklist: de un JSONB por sesión a una tabla
relacional. Motivado por preferencia del usuario (BD 100% normalizada, sin JSON).

- **`reglas` → `catalogo_reglas`.** El catálogo único de reglas (por capas/fases;
  `es_checklist=true` = checklist) se renombra por coherencia con los demás
  `catalogo_*`. 8 queries en `db.js`, el AddOn y coach/estrategia actualizados.
- **Nueva tabla `sesion_checklist`** (1 fila = sesión × regla de checklist). FK a
  `sesiones(sesion_date)` (CASCADE) y a `catalogo_reglas(codigo)`. Reemplaza al JSONB
  `sesiones.checklist` y a las columnas `chk_*` (que se dropean aparte).
- **Triggers "todo true por defecto"** (no dañar disciplina): sesión nueva materializa
  las reglas de checklist en `true`; regla nueva se backfillea en todas las sesiones en
  `true`. La migración pobló las 108 sesiones × 15 reglas = 1620 filas (valor del JSONB,
  o `true` si faltaba).
- **`db.js` absorbe el cambio:** `hydrateChecklist` reconstruye `s.checklist = {codigo:
  bool}` en memoria desde el embedding `sesion_checklist(regla_codigo,cumplido)`, así
  metrics/calendar/charts/coach/disciplina **no cambian**. `upsertSesion` persiste el
  checklist como filas (upsert por `sesion_date+regla_codigo`).
- **Soft-delete de reglas:** `deleteRegla`/`deleteChecklistItem` pasan a `activa=false`
  (hay historial en `sesion_checklist`, no se borra físico). `estrategia.js` carga solo
  activas.
- **AddOn `ChecklistChaumer`:** lee por embedding y escribe filas en `sesion_checklist`
  (asegura la fila de `sesiones` antes, por la FK). `checklist_go_at`/`hora_noticia_roja`
  siguen en `sesiones`.
- **UI:** "Checklist" → **"Checklist Reglas"** en Registrar.
- Verificado contra la BD real (service_role): triggers, upsert, embedding y CASCADE.
- Migraciones: `2026-07-08-normalizar-checklist-catalogo-reglas.sql` (constructiva) +
  `2026-07-08-drop-sesiones-checklist-jsonb.sql` (drop del modelo viejo, tras verificar).

---

## Checkpoint Jul 2026 (3) — Fechas especiales (`catalogo_fechas`) + reorden del menú

- **Nueva tabla `catalogo_fechas`** (`tipo`: fomc/festivo/vacaciones/otro; fecha, nombre,
  emoji, notas, activa). Unifica y reemplaza a `fomc_dates` (migrada) y al cálculo de
  festivos que vivía en el código. Se cargaron los festivos CME 2025-2027. RLS + grants
  como el resto. `fomc_dates` queda **obsoleta** (pendiente de drop).
- **Sección nueva "Fechas Especiales"** (`js/fechas.js`): selector de año, lista agrupada
  por tipo, alta/edición/borrado y botón "Generar festivos" del año (reusa
  `Calendar.calcCMEHolidays`, sin duplicar).
- **`calendar.js`** lee FOMC y festivos de `catalogo_fechas` (año completo); pinta
  vacaciones (verde) y otras fechas con su badge; el modal del día muestra el nombre del
  evento. Un día FOMC operado conserva el color del resultado + badge FOMC.
- **Menú reordenado:** Disciplina · Análisis · Calendario · Apex · Experimentos · Trades ·
  Sesión · Historial · Coach IA · Imágenes · Estrategia · Datos · Fechas Especiales.
  "Registrar" renombrado a **"Sesión"**.
- Migración: `2026-07-08-catalogo-fechas.sql`.

---

## Checkpoint Jul 2026 (2b) — Coach IA: datos operativos + análisis desplegable

- **Coach ya no pide precios que están en la BD:** el prompt incluye el detalle por-trade
  (hora, dirección, entrada→salida, puntos, resultado, P&L), no solo el agregado.
- **Análisis Técnico rediseñado:** 3 secciones (Contexto/Desarrollo/Validación) con bloques
  de datos colapsables (`<details>`, cerrados por defecto): premercado+checklist en
  Contexto, tabla de operativa en Desarrollo. Parser de secciones robusto al formato del
  encabezado (`##` o `**`, con/sin emoji) — antes todo caía en Contexto.

---

## Checkpoint Jul 2026 (4) — Modal del día rediseñado (Resumen + Operativa)

- **Resumen "el día en 5 segundos":** hero con P&L grande + badge resultado + chip del
  setup + metadatos (trades, emociones, confianza) en una línea; bloque **Proceso** con
  UNA barra del checklist real del día (dinámico desde `catalogo_reglas`, solo ítems
  aplicables por fase/setup — reemplaza el "X/6" hardcodeado que mentía) listando solo
  los ✗; errores como chips; **UNA** recomendación ("Siguiente paso"). Se eliminó el
  muro de chips Bien/A-mejorar.
- **Operativa:** tabla de trades estilo Coach (hora · dir · entrada→salida · puntos ·
  resultado · P&L, con 🚫 si entró en ventana de noticia); checklist por fases (F1/F2/F3,
  dinámico, solo aplicables); Retroceso prefiere el dato registrado en la sesión (el
  derivado |P&L/2| queda de fallback con "≈"). **Estados vacíos inteligentes:** distingue
  filtro de cuenta ocultando trades ("Hay N trades de otras cuentas") vs sesión operada
  sin export de NT8 vs no operó.
- **Gráfica:** las recomendaciones de cada error ahora son visibles directamente (antes
  ocultas tras el chevron); la descripción larga sigue colapsable.

---

## Checkpoint Jul 2026 (5) — Cuenta principal configurable

Motivación: el usuario quemó la PA `PA-APEX-232411-03` y compró una evaluación nueva
`APEX-232411-14`, que quiere llevar como cuenta principal del journal.

- **Fase A — configurable:** `objetivos.cuenta_principal` (BD, sincroniza dispositivos);
  selector "Cuenta principal" en Datos; el Coach analiza esa cuenta en vez del hardcode
  `PA-APEX-232411-03`; `db.js` cachea la principal (`cuentaPrincipal`/`fetchCuentaPrincipal`,
  fallback histórico). El filtro del calendario la usa como default.
- **Fase B — routing NT8:** `SupabaseAutoExport` enruta a `trades`+Telegram las cuentas
  `PA-*` **y** la cuenta principal (aunque sea evaluación sin prefijo). Lee
  `objetivos.cuenta_principal` de la BD al iniciar (fire-and-forget), así al cambiarla en
  Datos el routing se actualiza sin recompilar. Requiere recompilar el indicador **una vez**.
- **Fase C — Apex Tracker:** sin cambios de código. `apex.js` ya deriva los trades de cada
  cuenta de `[...apex_trades, ...trades]` por `numero_cuenta`, y `esPACuenta` depende del
  `estado` (no del nombre). El usuario solo agrega la `-14` como cuenta de evaluación.
- Migración: `2026-07-21-objetivos-cuenta-principal.sql` (aplicada vía MCP).

---

## Checkpoint Jul 2026 (6) — Zona horaria, Coach más claro y UI consistente

### 🕐 Zona horaria (causó 2 bugs; regla de oro del proyecto)
**NinjaTrader está configurado en hora de Colombia (UTC-5)**, así que TODO lo que
exporta (velas y `entry_time`/`exit_time` de los trades) viene en hora Colombia,
NO en ET. Colombia no tiene DST y Nueva York sí → en verano (EDT) ET va 1 h
adelante (09:30 ET = **08:30 Colombia**); en invierno coinciden.
- **`SupabaseDailyLevels`:** convertía las velas asumiendo la zona del template del
  CME (Central) → el RTH se detectaba 1 h antes. Ahora usa Colombia
  (`SA Pacific Standard Time`) como zona de origen. Además, sus parámetros
  **RTH abre/cierra van en hora de NUEVA YORK: 930 / 1600** (poner 830 hacía que
  tomara la vela de las 7:30 Colombia). Con eso funciona todo el año.
- **Coach IA:** leía las horas de los trades como si fueran ET y llamaba
  "premercado" a un trade de las 08:36 (= 09:36 ET, en pleno RTH). Ahora el código
  las **convierte a ET** antes del prompt (mostrando la local entre paréntesis) y
  hay una sección "HORAS Y SESIÓN" que fija RTH = 09:30–16:00 ET.

### 🤖 Coach IA
- **Relación de apertura calculada por código** (apertura vs ONH/ONL y vs PDH/PDL:
  encima / dentro / debajo, con distancia en pts) e inyectada en el prompt: el
  modelo la usa tal cual en vez de comparar precios "a ojo" (afirmó "abrió sobre el
  ONH" cuando estaba 187 pts por debajo).
- **Validación de setups agrupada por fase** (F1/F2/F3, con barra de color y
  contador n/m) y **títulos descriptivos de regla** en vez de códigos internos
  (`rr_1a1` → "R:R siempre 1:1"); `_limpiaCodigos()` traduce en el render lo que
  la IA cuele.
- Parser de las 3 secciones robusto al formato del encabezado (`##` o `**`).

### 🎨 UI
- **Títulos hero centrados** en todas las secciones (estilo Análisis); los controles
  bajan a una fila `.section-actions`.
- **Disciplina:** clic en una barra de "Distribución por tipo" o en una fila de
  "Causa raíz" abre el modal con los días de esos errores (y clic en el día abre su
  detalle).
- **Calendario:** el chip pasa a **T · S · Sin · No · F** calculado POR DÍA (misma
  prioridad que el color del calendario) → su suma cuadra con el total de días del
  mes. Antes duplicaba días con trade + sesión `no_opero` y contaba días sin conexión.

---

## Cómo continuar en un nuevo chat

1. Leer este archivo (`docs/historial-proyecto.md`) para contexto completo
2. El código fuente está en GitHub: `https://github.com/kristeb-trader/trading-journal`
3. Working directory local: `E:\Proyectos\Trading Journal`
4. Para cambios en la BD: SQL Editor de Supabase → `https://jothoslozctflfrnysrx.supabase.co`
5. **Regla operativa:** cada cambio en cualquier archivo debe hacerse **commit y push inmediatamente**
6. **Flujo de trabajo con IA:** analizar → presentar diagnóstico → esperar aprobación → implementar → commit
