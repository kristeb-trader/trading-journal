# Trading Journal NQ Futures — Historial Completo del Proyecto

**Última actualización:** 27 Mayo 2026
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
│   ├── form.js                       ← Formulario de sesión diaria
│   ├── charts.js                     ← 6 gráficas con Chart.js
│   ├── gallery.js                    ← Galería de imágenes con slots vacíos
│   ├── coach.js                      ← Coach IA — análisis Chaumer (FASE 5)
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

## Base de datos — Esquema final

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
  resultado      TEXT,                    -- "target" / "stop" / "otro"
  profit         NUMERIC,
  cum_net_profit NUMERIC,                 -- calculado por trigger
  commission     NUMERIC DEFAULT 0,
  mae            NUMERIC,
  mfe            NUMERIC,
  etd            NUMERIC,
  bars           INTEGER
);
```

### Tabla `sesiones`

```sql
-- Columnas completas (incluyendo todas las agregadas progresivamente)
id, sesion_date (DATE UNIQUE),
contexto, num_corrida, velas_corrida, puntos_retroceso,
zonas_contra (BOOLEAN), setup,
-- Checklist pre-sesión (siempre visible, incluso en "No operé")
chk_noticias,   -- Calendario económico verificado (sin noticia roja)
chk_zonas,      -- Zonas vigentes verificadas
-- Checklist operativo (solo cuando sí se operó)
chk_orden, chk_5velas, chk_consecucion, chk_estructura,
analisis_trader, resumen_ia, imagen_url,
no_opero (BOOLEAN), motivo_no_opero,
-- Agregadas en FASE 5 (Coach IA)
estado_emocional_id (FK → catalogo_emociones),
nivel_confianza (INTEGER 1-5),
-- Agregadas en FASE 6 (análisis sesión 27-05-26)
zona_naranja_habia (BOOLEAN),
zona_naranja_reaccion (TEXT),   -- RESPETO / IGNORO / PARCIAL
zona_naranja_nota (TEXT),
setup_valido_no_tomado (BOOLEAN DEFAULT FALSE),
motivo_no_entrada (TEXT),       -- Duda / Miedo / Zona naranja / Desconfianza / Otro
setup_observado (TEXT),
created_at, updated_at
```

**Motivos de no operación válidos:**
`FOMC` | `Sin setup` | `Festivo` | `Noticia roja` | `Personal` | `Setup válido no tomado` | `Otro`

### Tabla `catalogo_emociones`

```sql
CREATE TABLE catalogo_emociones (
  id         SERIAL PRIMARY KEY,
  nombre     TEXT NOT NULL,
  emoji      TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
-- RLS habilitado, lectura pública con anon key
```

### Tabla `estrategia_chaumer`

```sql
CREATE TABLE estrategia_chaumer (
  id         SERIAL PRIMARY KEY,
  seccion    TEXT UNIQUE NOT NULL,
  titulo     TEXT NOT NULL,
  contenido  TEXT,
  orden      INTEGER DEFAULT 0,
  activa     BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT now()
);
-- Secciones pre-cargadas (orden 1-9):
-- antes_sesion, premercado, apertura, mecanica_entrada,
-- gestion_zona, filtros, volumen, regla_de_oro, configuracion_visual
```

### Tabla `diagnosticos_diarios`

```sql
CREATE TABLE diagnosticos_diarios (
  id                      SERIAL PRIMARY KEY,
  sesion_date             DATE UNIQUE NOT NULL,
  sec_contexto            TEXT,
  sec_desarrollo          TEXT,
  sec_validacion          TEXT,
  sec_errores             TEXT,
  sec_aprendizaje         TEXT,
  sec_resumen_compacto    TEXT,
  errores_json            JSONB DEFAULT '[]',
  setups_json             JSONB DEFAULT '[]',
  estado_emocional_id     INTEGER REFERENCES catalogo_emociones(id),
  estado_emocional_fin_id INTEGER REFERENCES catalogo_emociones(id),
  nivel_confianza         INTEGER,
  patron_detectado        BOOLEAN DEFAULT false,
  patron_descripcion      TEXT,
  chat_messages           JSONB DEFAULT '[]',
  modelo_usado            TEXT,
  tokens_usados           INTEGER,
  created_at              TIMESTAMPTZ DEFAULT now(),
  updated_at              TIMESTAMPTZ DEFAULT now()
);
```

### Tabla `sesion_casuisticas`

```sql
id, sesion_date (DATE), casuistica (TEXT), resultado (TEXT), created_at
```

### Tabla `catalogo_casuisticas`

```sql
id, nombre (TEXT), activa (BOOLEAN DEFAULT true), orden (INTEGER)
```

### Tabla `fomc_dates`

```sql
CREATE TABLE IF NOT EXISTS fomc_dates (
  date        DATE PRIMARY KEY,
  description TEXT DEFAULT 'FOMC Meeting'
);
-- RLS habilitado. Lectura pública con anon key.
```

**Fechas cargadas (2025-2026):**
- 2025: Jan 28-29, Mar 18-19, May 6-7, Jun 17-18, Jul 29-30, Sep 16-17, Oct 28-29, Dec 9-10
- 2026: Jan 27-28, Mar 17-18, Apr 28-29, Jun 9-10, Jul 28-29, Sep 15-16, Oct 27-28, Dec 8-9

### Permisos Supabase (acumulados)

```sql
-- RLS deshabilitado en trades, sesiones, reglas (proyecto personal)
GRANT INSERT, SELECT, UPDATE ON trades, sesiones, reglas TO anon;
GRANT USAGE ON SEQUENCE sesiones_id_seq TO anon;
GRANT USAGE, SELECT ON SEQUENCE trades_trade_number_seq TO anon;
-- catalogo_emociones, estrategia_chaumer, diagnosticos_diarios:
-- RLS habilitado con política de lectura pública
NOTIFY pgrst, 'reload schema';
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

### Objetivo
Crear la estructura de datos en Supabase, cargar el historial de trades y dejar la base lista para el desarrollo del dashboard.

### Qué se hizo
- Proyecto Supabase creado
- Tres tablas creadas: `trades`, `sesiones`, `reglas`
- 60 trades históricos importados vía CSV
- Repositorio GitHub creado (`trading-journal`, privado), GitHub Pages habilitado sobre rama `main`
- RLS deshabilitado en las 3 tablas iniciales
- Permisos GRANT configurados para el rol `anon`

---

## FASE 2 — Dashboard web completo

### Objetivo
Construir el dashboard web como SPA en HTML + JS vanilla, con las 6 secciones funcionales y todas las integraciones externas.

### Módulos JS

| Archivo | Rol |
|---|---|
| `js/config.js` | Credenciales Supabase y Cloudinary |
| `js/db.js` | Capa de datos: todas las queries a Supabase via REST |
| `js/calendar.js` | Calendario mensual con navegación, colores por resultado, festivos CME, FOMC |
| `js/metrics.js` | KPIs: P&L, win rate, racha, mejor/peor día, disciplina (7 factores), error frecuente |
| `js/table.js` | Tabla de trades paginada (20/página), búsqueda, filtro por resultado |
| `js/form.js` | Formulario sesión diaria, upload Cloudinary |
| `js/charts.js` | 6 gráficas: equity curve, win rate semanal, P&L por día, MAE vs MFE, distribución, disciplina |
| `js/gallery.js` | Galería de imágenes por mes con slots vacíos |
| `js/app.js` | Boot, navegación SPA, modales, toasts, lightbox |

### Secciones del dashboard

**Sección 1 — Calendario:**
- Vista mensual con navegación ← →
- Filtro de cuenta (default: PA-APEX, persiste en `localStorage`)
- Colores por resultado del día:

| Estado | Color | Badge |
|--------|-------|-------|
| Target | 🟢 Verde | — |
| Stop | 🔴 Rojo | — |
| Break Even | ⬜ Gris | B.E. |
| No operé | ⬜ Gris oscuro | No operé |
| Sin entradas | 🟣 Violeta | Sin entradas |
| **Setup válido no tomado** | **🟣 Violeta** | **⚠️ Setup válido — no entré** |
| Festivo | 🔵 Azul | Festivo |
| FOMC | 🟡 Ámbar | FOMC |

- Festivos CME calculados en JS (sin BD)
- Fechas FOMC desde tabla `fomc_dates`
- Clic en día → modal de detalle (4 tabs)

**Sección 2 — Métricas:** P&L, win rate, racha, disciplina 7 factores, error frecuente

**Sección 3 — Tabla de trades:** Paginada, filtrable, clic → modal del día

**Sección 4 — Registrar sesión** (detallado en sección separada)

**Sección 5 — Análisis:** 6 gráficas Chart.js

**Sección 6 — Galería:** Thumbnails por mes, lightbox con navegación prev/next

**Sección 7 — Imágenes (gallery)**

**Sección 8 — Coach IA** (FASE 5)

### Decisiones técnicas

| Decisión | Motivo |
|---|---|
| Vanilla JS sin frameworks | Simplicidad, GitHub Pages |
| Claude API via Cloudflare Worker | CORS bloqueado desde browser |
| API key en localStorage | Repositorio privado, seguridad extra |
| RLS deshabilitado en tablas principales | Proyecto personal |
| Festivos CME en JS | Sin dependencia externa |
| FOMC en tabla Supabase | Fechas cambian anualmente |

---

## FASE 3 — Indicador C# para NinjaTrader 8

### Archivo
`NinjaTrader/SupabaseAutoExport.cs`

**Ruta:** `Documentos\NinjaTrader 8\bin\Custom\Indicators\SupabaseAutoExport.cs`

> Después de cada recompilación hay que quitar y volver a agregar el indicador al gráfico.

### Diseño
- `State.DataLoaded`: suscribe a `ExecutionUpdate` de la cuenta configurada
- `OnAccountExecutionUpdate`: suma/resta `netQty`. `0→N` = trade abierto. `N→0` = trade cerrado (POST async)
- Fusión ATM: ventana de 3 segundos para acumular ejecuciones múltiples en un trade
- `lock(syncLock)` sincroniza hilos NT8 y Account events
- **Endpoint:** `POST https://jothoslozctflfrnysrx.supabase.co/rest/v1/trades`

### Notas
- `trade_number` y `etd` quedan NULL (solo disponibles desde `StrategyBase`, no `IndicatorBase`)
- `ex.Commission` puede ser 0 en versiones NT8 anteriores a 8.x

---

## FASE 4 — Bot de Telegram para registro de sesiones (v4.0)

### Archivos
- `TelegramBot/worker.js`
- `TelegramBot/wrangler.toml`

### Flujo

```
Trader (Telegram) → Telegram Servers → Webhook POST
→ Cloudflare Worker #2
→ Cloudflare KV (estado, TTL: 3600s)
→ POST /rest/v1/sesiones → Supabase
```

### Variables de entorno

| Variable | Valor |
|---|---|
| `BOT_TOKEN` | Token del bot |
| `SUPABASE_URL` | `https://jothoslozctflfrnysrx.supabase.co` |
| `SUPABASE_KEY` | Anon key |
| `ALLOWED_CHAT_ID` | `372127764` |
| `TIMEZONE` | `America/Bogota` |

### Máquina de estados v4.0

```
OPERO
  ↓ (no operó) → MOTIVO → fin
  ↓ (sí operó)
EMOCION → CONFIANZA → CONTEXTO → CORRIDA → VELAS → ZONAS_CONTRA → SETUP → CHECKLIST → REFLEXION
```

> **v4.0:** Se agregaron los pasos `EMOCION` (estado emocional pre-sesión del catálogo) y `CONFIANZA` (nivel 1-5) al inicio del flujo operativo. Ambos se guardan en `sesiones.estado_emocional_id` y `sesiones.nivel_confianza`.

**Fecha automática:** `Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' })` — evita desfase UTC vs Colombia.

> **Limitación:** El bot no genera análisis IA ni soporta subida de imágenes — esas funciones solo existen en el dashboard web.

---

## FASE 5 — Coach IA (Análisis Chaumer con Claude Sonnet)

### Objetivo
Módulo de análisis diario profesional basado en la estrategia Chaumer completa. Análisis estructurado en 6 secciones, chat multi-turn de seguimiento, historial acumulado de 60 días, y detección automática de patrones de errores.

### Archivo
`js/coach.js`

### Modelo y configuración

| Parámetro | Valor |
|---|---|
| Modelo | `claude-sonnet-4-6` |
| Max tokens | 3000 |
| Proxy | `broad-hall-c53f.kristerock.workers.dev/api/claude` |
| Costo estimado | ~$0.02/diagnóstico · ~$0.40/mes |

### Estructura del módulo

**Constantes:**
```javascript
const CLAUDE_URL = 'https://broad-hall-c53f.kristerock.workers.dev/api/claude'
const MODEL      = 'claude-sonnet-4-6'
const MAX_TOKENS = 3000
```

**Estado interno:**
- `chatHistory[]` — conversación multi-turn en memoria
- `systemPromptCache` — se construye una vez por sesión abierta
- `diagnosticoActual` — 6 secciones parseadas del último análisis
- `estrategiaCache` — contenido de `estrategia_chaumer` (1 carga por init)
- `emocionesCache` — catálogo de emociones
- `coachDate` — fecha activa en el coach
- `imagenBase64` — chart subido (si existe)

### System Prompt — Datos incluidos

El system prompt se construye dinámicamente en `buildSystemPrompt(date)` con:

| Fuente | Contenido |
|---|---|
| `estrategia_chaumer` (activa=true) | 8+ secciones de la estrategia Chaumer completa |
| `diagnosticos_diarios` (últimos 60) | Historial compacto de resúmenes anteriores |
| `diagnosticos_diarios.errores_json` | Patrones de errores repetidos (≥2x = ⚠️ alerta, ≥3x = 🚨 crítica) |
| `sesiones` del día | Estado emocional inicio/cierre, confianza pre-sesión, contexto, setup, checklist |
| `trades` del día | P&L, targets, stops, BEs |
| `sesion_casuisticas` | Casuísticas tipificadas del día |
| UI en tiempo real | `coachEmocionSelect` y `coachEmocionFinSelect` (precedencia sobre BD) |
| Zona naranja | `zona_naranja_habia`, `zona_naranja_reaccion`, `zona_naranja_nota` |
| Setup no tomado | `setup_valido_no_tomado`, `motivo_no_entrada` |

### Análisis — 6 secciones

```
**1. 🌍 CONTEXTO**
**2. 📈 DESARROLLO DE SESIÓN**
**3. ✅ VALIDACIÓN DE SETUPS**
**4. ⚠️ ERRORES DETECTADOS**
**5. 🎓 APRENDIZAJE DEL DÍA**
**6. 📋 RESUMEN PARA DIARIO**
```

**Parsing:** `parsearSecciones(texto)` — regex que extrae cada sección por su encabezado.
**Fallback:** si el parseo no captura ninguna sección, el texto completo se muestra en la sección CONTEXTO.

### Tabs del módulo

| Tab | Contenido |
|---|---|
| Análisis de Hoy | Selector de fecha, estado emocional inicio/fin, confianza, imagen, botón analizar, 6 secciones, chat |
| Historial | Últimos 30 diagnósticos guardados con delta emocional (😊 → 😤) |
| Estrategia | Editor de las secciones de `estrategia_chaumer` |

### UI — Controles de la sesión

- **¿Cómo llegué?** — select del `catalogo_emociones`
- **¿Cómo terminé?** — select del `catalogo_emociones` (campo `estado_emocional_fin_id`)
- **Confianza pre-sesión** — 5 estrellas (1-5) → `nivel_confianza`
- **Gráfica del día** — upload manual O auto-carga desde `sesion.imagen_url`
- **Botón Guardar** — aparece en la parte superior e inferior del chat

### Auto-carga de imagen

Al cargar una fecha en Coach IA, si `sesion.imagen_url` existe, se hace `fetch()` automático, se convierte a base64 y se muestra en el preview. Si falla (CORS, URL caída), el área de upload manual queda disponible como fallback.

### Guardar diagnóstico — tabla `diagnosticos_diarios`

El botón "Guardar diagnóstico" hace upsert (por `sesion_date`) con:
- Las 6 secciones parseadas
- `errores_json` y `setups_json` extraídos del texto
- `estado_emocional_id`, `estado_emocional_fin_id`, `nivel_confianza`
- `chat_messages` (historial completo de la conversación)
- `modelo_usado`, `patron_detectado`

### Navegación SPA

`Coach.init()` se llama solo la primera vez (lazy init). Las visitas siguientes llaman `Coach.refresh()` que ejecuta `cargarFecha(today())` — limpia el panel y carga el diagnóstico del día si existe, sin duplicar event listeners.

---

## FASE 6 — Mejoras UX y correcciones (Mayo 2026)

### Cambios al formulario de sesión (`form.js` + `index.html`)

**Separación del checklist:**
Los ítems del checklist se dividieron en dos grupos:

| Grupo | Ítems | Visibilidad |
|---|---|---|
| Checklist Pre-Sesión | Calendario económico verificado · Zonas vigentes | Siempre (incluso con "No operé") |
| Checklist Operativa | Orden · 5 Velas · Consecución · Estructura | Solo cuando sí se operó |

**Motivo:** cuando el trader marca "No operé" pero sí realizó el proceso pre-sesión (revisó calendario, zonas), antes no podía marcar esos ítems. Ahora siempre están visibles.

**Nuevo motivo de no operación: "Setup válido no tomado"**
Cuando se selecciona, aparece un bloque adicional con:
- Setup que identificaste (select)
- Motivo de no entrada (Duda / Miedo / Zona naranja / Desconfianza / Otro)
- Testeo de zona naranja (¿había? → reacción del precio)

**Zona naranja — testeo experimental:**
Sección en el formulario (tanto para sesiones con trade como para "setup no tomado"):
- ¿Había zona naranja en el camino al target? (Sí/No)
- Si Sí: ¿El precio la respetó o ignoró? (RESPETO / IGNORO / PARCIAL)
- Nota libre de contexto

> **Regla provisional desde 2026-05-27:** Las zonas naranjas NO afectan la decisión de entrada. Solo se registran para acumular estadística (Opción A). Objetivo: 30 casos antes de concluir.

### Renombrado de etiquetas

| Antes | Después |
|---|---|
| "Estado emocional" | "¿Cómo llegué?" |
| "Confianza" | "Confianza pre-sesión" |
| "Sin noticia roja activa" | "Calendario económico verificado (sin noticia roja)" |

### Mapa visual del gráfico (en `estrategia_chaumer`)

Sección `configuracion_visual` insertada en la estrategia para que el Coach no cometa errores al interpretar los colores del gráfico:

| Color | Elemento |
|---|---|
| Gris | Zonas S/R — ÚNICAS zonas válidas de la estrategia |
| Rojo (línea) | Mínimo de premercado |
| Verde (línea) | Máximo de premercado |
| Naranja (zonas/flechas) | Puntos de referencia experimentales — NO son reglas |
| Blanco (líneas) | Referencias temporalidad superior (5 min) |
| Azul punteado (volumen) | Velas premercado con volumen alto (NQ ≥ 2,000 / MNQ ≥ 6,000) |
| Velas blancas | Bajistas |
| Velas azules | Alcistas |
| Herramienta R/R (Anchor gris · Risk salmón · Reward verde lima) | NO interpretar como zonas de mercado |

### Correcciones en Coach IA

| Corrección | Detalle |
|---|---|
| Error 404 modelo | `claude-sonnet-4-5-20251001` → `claude-sonnet-4-6` |
| Secciones vacías | Mensaje de usuario ahora incluye los 6 encabezados obligatorios + fallback si parseo falla |
| Reset al volver | `Coach.refresh()` limpia el panel al navegar de vuelta a la sección |
| Botón guardar duplicado | Aparece arriba (junto a Analizar) y abajo (al pie del chat) |
| Auto-carga imagen | `autoCargarImagen(url)` carga `sesion.imagen_url` automáticamente |

---

## Estado actual del proyecto

### ✅ Todo funcionando

**Dashboard web:**
- 8 secciones: Calendario, Métricas, Trades, Registrar Sesión, Análisis, Galería, Imágenes, Coach IA
- Calendario con colores para todos los estados incluyendo "Setup válido no tomado"
- Festivos CME automáticos + FOMC desde BD
- Filtro de cuenta con persistencia
- Métricas con disciplina 7 factores y modal de detalle
- Galería con lightbox navegable

**Formulario de sesión:**
- Checklist pre-sesión siempre visible (noticias + zonas)
- Checklist operativo solo cuando se operó
- Testeo de zonas naranjas con 3 opciones de reacción
- "Setup válido no tomado" con campos de motivo y setup observado
- Carga de imagen a Cloudinary

**Coach IA:**
- Análisis en 6 secciones con Claude Sonnet
- Chat multi-turn de seguimiento
- System prompt dinámico con estrategia completa + historial 60 días + patrones
- Estado emocional inicio → cierre (delta emocional)
- Confianza pre-sesión con estrellas
- Auto-carga de imagen desde sesión guardada
- Historial de diagnósticos con delta emocional visual
- Editor de estrategia Chaumer en vivo
- Guardado en `diagnosticos_diarios` con upsert

**Integraciones:**
- NinjaTrader → Supabase (automático por indicador C#)
- Telegram bot → Supabase (flujo 11 pasos con estado emocional)
- Claude API via Cloudflare Worker proxy

### ⚠️ A tener en cuenta

- El indicador C# fue probado con `Sim101`. En operativa real con `PA-APEX-232411-03`, verificar nombre exacto en dropdown NT8.
- `trade_number` y `etd` quedan NULL en trades auto-exportados desde NT8.
- `ex.Commission` puede ser 0 en NT8 anterior a 8.x.
- El bot de Telegram no genera análisis IA ni soporta subida de imágenes.
- La zona naranja está en testeo experimental — necesita 30 casos antes de concluir.

### 🔜 Posibles mejoras futuras

- Estadísticas de testeo zona naranja (% respeta vs ignora, por dirección)
- Estadísticas de trades válidos no tomados (P&L potencial perdido)
- Resumen IA en bot de Telegram (llamada Worker #2 → Worker #1)
- Soporte imagen desde Telegram (upload Cloudinary desde Worker)
- Backup periódico BD (Supabase scheduled exports)
- Agregar campo `strategy` al POST del indicador C#
- Botón "Agregar sección" en el editor de estrategia Coach IA

---

## Checklist — Separación pre-sesión / operativo

### Checklist Pre-Sesión (siempre visible)

| Campo DB | Descripción |
|---|---|
| `chk_noticias` | Calendario económico verificado (sin noticia roja) |
| `chk_zonas` | Zonas vigentes verificadas — ninguna zona vigente entre entrada y target |

### Checklist Operativo (solo cuando sí se operó)

| Campo DB | Descripción |
|---|---|
| `chk_orden` | Orden precolocada a tiempo — lista antes del cierre de la vela de rompimiento |
| `chk_5velas` | Máx 5 velas en corrida (auto-invalida si `velas_corrida > 5`) |
| `chk_consecucion` | Zona marcada con rompimiento + consecución + retroceso confirmado |
| `chk_estructura` | Estructura de Impulso + Retroceso + Impulso, fluida |

---

## Notas sobre la Metodología Chaumer

- **Regla de las 5 velas:** máximo 5 velas en el impulso. Sin excepciones.
- **Marcación de zonas:** solo con rompimiento + consecución + retroceso confirmado.
- **Zonas vigentes en target:** ninguna zona vigente entre entrada y target.
- **Orden precolocada:** lista antes del cierre de la vela de rompimiento.
- **Vela extensa:** señal de fuerza, no de invalidación.
- **FOMC / Noticias rojas:** no operar en días Fed. No entrar 5 min antes de noticias rojas.
- **Stop máximo:** 60 puntos / $120 por trade.
- **Ratio mínimo:** 1:1.
- **Temporalidad principal:** 1 minuto en NQ/MNQ Futures.
- **Zonas naranjas:** puntos de referencia experimentales en testeo desde 2026-05-27. Regla provisional: NO afectan la entrada (Opción A). Se registran para estadística.

---

## Cómo continuar en un nuevo chat

1. Leer este archivo (`docs/historial-proyecto.md`) para contexto completo del proyecto
2. Revisar también `docs/arquitectura-funcional.md` y `docs/arquitectura-tecnica.md` para detalles técnicos actualizados
3. El código fuente está en GitHub: `https://github.com/kristeb-trader/trading-journal`
4. Working directory local: `C:\Users\Asus\Claro drive\Trading Journal`
5. Para cambios en la BD, usar el SQL Editor de Supabase: `https://jothoslozctflfrnysrx.supabase.co`
6. **Regla operativa:** cada cambio en cualquier archivo debe hacerse commit y push inmediatamente a git
7. **Flujo de trabajo con IA:** analizar → presentar diagnóstico → esperar aprobación → implementar → commit
