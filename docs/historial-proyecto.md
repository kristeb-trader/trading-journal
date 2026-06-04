# Trading Journal NQ Futures — Historial Completo del Proyecto

**Última actualización:** 4 Junio 2026 (Fase 12 Premercado · Fase 13 limpieza errores/experimentos · modal del día rediseñado + filtro de cuenta)
**Repositorio:** `https://github.com/kristeb-trader/trading-journal` (privado)
**Rama principal:** `main`
**Working directory local:** `C:\Users\Asus\Claro drive\Trading Journal`
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
│   ├── coach.js                      ← Coach IA — flujo 3 etapas (FASE 5+)
│   └── app.js                        ← Boot, navegación SPA, modales, lightbox
├── NinjaTrader/
│   └── SupabaseAutoExport.cs         ← Indicador C# para NT8
├── TelegramBot/
│   ├── worker.js                     ← Cloudflare Worker del bot
│   └── wrangler.toml                 ← Config KV binding
└── docs/
    ├── historial-proyecto.md         ← Este archivo
    ├── arquitectura-funcional.md
    ├── arquitectura-tecnica.md
    ├── manual-tecnico.md
    └── manual-usuario.md
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
-- Checklist pre-sesión (siempre visible)
chk_noticias, chk_zonas,
-- Checklist operativo (solo cuando sí se operó)
chk_orden, chk_5velas, chk_consecucion, chk_estructura,
analisis_trader, resumen_ia, imagen_url,
no_opero (BOOLEAN), motivo_no_opero,
-- Fuente única de estado emocional y confianza (Fase 2A)
estado_emocional_id (FK → catalogo_emociones),
nivel_confianza (INTEGER 1-5),
-- Setup no tomado
setup_valido_no_tomado (BOOLEAN DEFAULT FALSE),
motivo_no_entrada (TEXT),
setup_observado (TEXT),
-- Premercado / contexto técnico (Fase 12)
precio_cierre_ayer, precio_apertura, precio_max_pre, precio_min_pre (NUMERIC),
soportes_naranja (JSONB), resistencias_naranja (JSONB),  -- hasta 5 líneas naranjas c/u
noticias (TEXT),
se_conecto (BOOLEAN DEFAULT true),  -- distingue los 2 "no operé"
created_at, updated_at
```

> **Fase 2A:** `estado_emocional_id` y `nivel_confianza` son la **fuente única** de emoción/confianza. Las columnas duplicadas en `diagnosticos_diarios` fueron eliminadas.
> **Fase 4D:** `zona_naranja_habia`, `zona_naranja_reaccion`, `zona_naranja_nota` fueron eliminadas y migradas a `diagnostico_experimentos`.
> **Fase 12:** premercado para enriquecer el análisis IA. `se_conecto` distingue: no operé sin conectarme (caso 1, mínimo) vs me conecté sin setup válido (caso 2, sí pide premercado + análisis). Los puntos del rango premercado se calculan (max−min), no se almacenan.

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
  created_at          TIMESTAMPTZ DEFAULT now()
);
```

> Registro unificado de errores (manual + IA). El modal del calendario muestra chips compactos (nombre corto) con detalle desplegable al clic. Función alias `casuistica:error` mantiene compatibilidad con código existente.

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
-- Fechas cargadas: 2025-2026
```

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

---

## Checklist — Separación pre-sesión / operativo

### Checklist Pre-Sesión (siempre visible)

| Campo DB | Descripción |
|---|---|
| `chk_noticias` | Calendario económico verificado (sin noticia roja) |
| `chk_zonas` | Zonas vigentes verificadas |

### Checklist Operativo (solo cuando sí se operó)

| Campo DB | Descripción |
|---|---|
| `chk_orden` | Orden precolocada a tiempo |
| `chk_5velas` | Máx 5 velas en corrida (auto-invalida si `velas_corrida > 5`) |
| `chk_consecucion` | Zona marcada con rompimiento + consecución + retroceso |
| `chk_estructura` | Estructura IRI fluida |

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

**Dashboard web (11 secciones):**
- Calendario, Métricas, Trades, Registrar Sesión, Análisis, Galería/Imágenes, Resumen Anual, Historial, Coach IA, Estrategia, Datos/Catálogos

**Coach IA:**
- Flujo en 3 etapas (Análisis Técnico → Chat opcional → Diagnóstico)
- 2 llamadas a Claude por sesión completa
- Lista de confirmación de errores con nombre corto + detalle + T/S
- Auto-crea entradas en el catálogo de errores para nombres nuevos
- Dedup automático contra errores manuales del día
- Restaura conversación guardada al cargar fechas pasadas

**Métricas cuantitativas:**
- P&L · Tasa de Acierto · Disciplina de Proceso · Tasa de Errores
- Cumplimiento de Reglas · Días Limpios · Dejé de Ganar · Experimentos
- Racha · Mejor/Peor día · Max Drawdown · Profit Factor · Avg Win/Loss

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
- 🌅 **Premercado web — verificar guardado (pendiente):** el bot guarda premercado OK, pero falta confirmar que el Worker `/api/session` (no versionado) pase los campos nuevos al guardar desde la **web**. Registrar una sesión con premercado en el sitio real y verificar en BD.
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

## Cómo continuar en un nuevo chat

1. Leer este archivo (`docs/historial-proyecto.md`) para contexto completo
2. El código fuente está en GitHub: `https://github.com/kristeb-trader/trading-journal`
3. Working directory local: `C:\Users\Asus\Claro drive\Trading Journal`
4. Para cambios en la BD: SQL Editor de Supabase → `https://jothoslozctflfrnysrx.supabase.co`
5. **Regla operativa:** cada cambio en cualquier archivo debe hacerse **commit y push inmediatamente**
6. **Flujo de trabajo con IA:** analizar → presentar diagnóstico → esperar aprobación → implementar → commit
