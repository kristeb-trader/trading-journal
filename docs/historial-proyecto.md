# Trading Journal NQ Futures — Historial Completo del Proyecto

**Última actualización:** Mayo 2026
**Repositorio:** `https://github.com/kristeb-trader/trading-journal` (privado)
**Rama principal:** `main`
**Working directory local:** `C:\Users\Asus\Claro drive\Trading Journal`
**URL producción:** `https://kristeb-trader.github.io/trading-journal`

---

## Descripción general

Dashboard semi-profesional para registro, análisis y visualización de operativa diaria en NQ/MNQ Futures (temporalidad 1 minuto), siguiendo la **Metodología Chaumer**. Combina captura automática de trades desde NinjaTrader 8, registro manual de contexto vía web y Telegram, análisis con IA (Claude), e imágenes del día en Cloudinary. Arquitectura 100% serverless, costo ~$0/mes.

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
| Claude API | Modelo: `claude-haiku-4-5-20251001` | En `localStorage` del browser y en Worker #1 |
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
| Análisis IA | Claude API — `claude-haiku-4-5-20251001` |
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
  trade_number   BIGSERIAL PRIMARY KEY,   -- era "id" en el esquema original
  account        TEXT,
  instrument     TEXT,
  trade_date     DATE,                    -- separado de entry_time en rediseño
  entry_time     TIME,                    -- solo hora (era TIMESTAMPTZ completo)
  exit_time      TIME,                    -- solo hora (era TIMESTAMPTZ completo)
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
  etd            NUMERIC,                 -- MFE − Profit
  bars           INTEGER
);
```

**Trigger `trg_cum_net_profit`:**
```sql
CREATE OR REPLACE FUNCTION calc_cum_net_profit()
RETURNS TRIGGER AS $$
BEGIN
  NEW.cum_net_profit := (
    SELECT COALESCE(SUM(profit), 0)
    FROM trades
    WHERE (trade_date, entry_time) < (NEW.trade_date, NEW.entry_time)
  ) + NEW.profit;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_cum_net_profit
BEFORE INSERT ON trades
FOR EACH ROW EXECUTE FUNCTION calc_cum_net_profit();
```

### Tabla `sesiones`

```sql
-- Columnas actuales (incluyendo las agregadas progresivamente)
id, sesion_date (DATE UNIQUE), contexto, num_corrida, velas_corrida,
puntos_retroceso, zonas_contra (BOOLEAN), setup,
chk_zonas, chk_orden, chk_5velas, chk_noticias, chk_consecucion,
chk_estructura,      -- agregada en Fase 2 posterior
analisis_trader, resumen_ia, imagen_url,
no_opero (BOOLEAN), motivo_no_opero,
created_at, updated_at
```

> `chk_estructura` fue agregada con: `ALTER TABLE sesiones ADD COLUMN IF NOT EXISTS chk_estructura BOOLEAN DEFAULT false;`

**Motivos de no operación válidos:** `FOMC`, `Sin setup`, `Festivo`, `Noticia roja`, otros texto libre.

### Tabla `reglas`
Existe en Supabase con 5 reglas iniciales. **No se usa activamente** — el checklist está hardcodeado en el frontend por simplicidad.

### Tabla `sesion_casuisticas`
Registro de casuísticas por sesión (errores de ejecución observados).

```sql
id, sesion_date (DATE), casuistica (TEXT), resultado (TEXT), created_at
```

### Tabla `catalogo_casuisticas`
Catálogo de casuísticas definidas por el trader.

```sql
id, nombre (TEXT), activa (BOOLEAN DEFAULT true), orden (INTEGER)
```

### Tabla `catalogo_reglas`
Catálogo de reglas dinámico (para posible migración futura desde el hardcodeado).

```sql
id, nombre (TEXT), activa (BOOLEAN DEFAULT true), orden (INTEGER)
```

### Tabla `fomc_dates`
Fechas de reuniones FOMC almacenadas para marcado automático en el calendario.

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
-- RLS deshabilitado en trades, sesiones, reglas (proyecto personal, sin riesgo)
GRANT INSERT, SELECT, UPDATE ON trades, sesiones, reglas TO anon;
GRANT USAGE ON SEQUENCE sesiones_id_seq TO anon;            -- Fase 2
GRANT USAGE, SELECT ON SEQUENCE trades_trade_number_seq TO anon;  -- Fase 3
NOTIFY pgrst, 'reload schema';                              -- Recargar caché PostgREST
```

---

## Historial de cambios a la tabla `trades`

La tabla fue **recreada desde cero** en una sesión posterior porque PostgreSQL no permite reordenar columnas con `ALTER TABLE`. Todos los datos se preservaron.

| Tipo | Detalle |
|---|---|
| 🔄 Tabla recreada | `DROP TABLE trades` → `CREATE TABLE trades` nuevo esquema |
| ✏️ Renombrado | `id` → `trade_number` |
| 🔀 Separación | `entry_time TIMESTAMPTZ` → `trade_date DATE` + `entry_time TIME` + `exit_time TIME` |
| 🆕 Columnas nuevas | `strategy`, `etd` |
| 🗑️ Columnas eliminadas | `entry_name`, `created_at` |
| 🔧 Trigger actualizado | `WHERE entry_time < NEW.entry_time` → `WHERE (trade_date, entry_time) < (NEW.trade_date, NEW.entry_time)` |
| 📦 Datos cargados | 64 trades históricos desde `Trades_2026_V2.csv` |

**Datos históricos cargados:**
- 64 trades | Cuenta: `PA-APEX-232411-03` | Fechas: 03/02/2026 – 08/05/2026
- Instrumentos: `MNQ 03-26` y `MNQ 06-26`
- Secuencia reiniciada: `SELECT setval(pg_get_serial_sequence('trades','trade_number'), 64);`

---

## FASE 1 — Infraestructura base y base de datos

### Objetivo
Crear la estructura de datos en Supabase, cargar el historial de trades y dejar la base lista para el desarrollo del dashboard.

### Qué se hizo
- Proyecto Supabase creado en `https://jothoslozctflfrnysrx.supabase.co`
- Tres tablas creadas: `trades`, `sesiones`, `reglas`
- 60 trades históricos importados vía CSV
- Repositorio GitHub creado (`trading-journal`, privado), GitHub Pages habilitado sobre rama `main`
- RLS deshabilitado en las 3 tablas iniciales
- Permisos GRANT configurados para el rol `anon`

### Resultado
Base de datos operativa con historial cargado. Repositorio GitHub configurado y publicado en GitHub Pages.

---

## FASE 2 — Dashboard web completo

### Objetivo
Construir el dashboard web como SPA en HTML + JS vanilla, con las 5 secciones funcionales y todas las integraciones externas.

### Arquitectura del frontend
SPA de una sola página (`index.html`) con navegación entre secciones sin recarga. Dark mode completo. Sin frameworks — vanilla JS puro por simplicidad y compatibilidad con GitHub Pages.

### Módulos JS

| Archivo | Rol |
|---|---|
| `js/config.js` | Credenciales Supabase y Cloudinary |
| `js/db.js` | Capa de datos: todas las queries a Supabase via REST |
| `js/calendar.js` | Calendario mensual con navegación, colores por resultado, festivos CME, FOMC |
| `js/metrics.js` | KPIs: P&L, win rate, racha, mejor/peor día, disciplina (7 factores), error frecuente |
| `js/table.js` | Tabla de trades paginada (20/página), búsqueda, filtro por resultado |
| `js/form.js` | Formulario sesión diaria, integración Claude via Worker proxy, upload Cloudinary |
| `js/charts.js` | 6 gráficas: equity curve, win rate semanal, P&L por día, MAE vs MFE, distribución, disciplina |
| `js/gallery.js` | Galería de imágenes por mes con slots vacíos para días sin imagen |
| `js/app.js` | Boot, navegación SPA, modales, toasts, lightbox con navegación prev/next |

### Secciones del dashboard

**Sección 1 — Calendario:**
- Vista mensual con navegación ← →
- Filtro de cuenta (por defecto: PA-APEX, persiste en `localStorage`)
- Colores por resultado: 🟢 Target | 🔴 Stop | 🟡 Mixto | ⚫ Sin operar | 🔵 Festivo | 🟤 FOMC
- Festivos CME calculados automáticamente en JS (10 feriados US): New Year, MLK Day, Presidents Day, Good Friday, Memorial Day, Juneteenth, Independence Day, Labor Day, Thanksgiving, Christmas
- Fechas FOMC consultadas desde tabla `fomc_dates` en Supabase
- P&L del día visible en cada celda
- Resumen mensual: días operados, trades, win rate, P&L total
- Leyenda de colores visible arriba del calendario
- Clic en día → modal de detalle con 4 tabs

**Modal de detalle (4 tabs):**
- **Resumen:** lista de trades del día con P&L total
- **Checklist:** 6 reglas con ✅/❌ y score de disciplina
- **Análisis:** contexto, corrida, setup, reflexión trader, resumen IA
- **Imagen:** captura del día con lightbox al hacer clic

**Sección 2 — Métricas generales:**
- P&L neto total y promedio por día
- Tasa de acierto (targets/stops)
- Total trades y días operados
- Racha actual (wins/losses consecutivos)
- Mejor y peor día
- Disciplina: promedio de 7 factores sobre sesiones activas (clickable → modal de detalle por factor)
- Error más frecuente en checklist (clickable → modal con historial de errores)
- Filtros: Todo / Este mes / Esta semana

**Sección 3 — Tabla de trades:**
- Todas las columnas de NinjaTrader
- Búsqueda por texto y filtro por resultado
- Paginación (20 trades por página)
- Clic en fila → abre modal de detalle del día

**Sección 4 — Registrar sesión:**
- Fecha (auto: hoy)
- Toggle "No operé hoy" + motivo (FOMC / Sin setup / Festivo / Noticia roja / texto libre)
- Contexto de mercado (5 opciones)
- Número de corrida (1ª/2ª/3ª) — botones
- Velas en corrida (1-20) — auto-invalida `chk_5velas` si > 5
- Puntos de retroceso
- Zonas en contra (Sí/No) — botones
- Setup (texto libre)
- Checklist 6 reglas con auto-invalidación
- Reflexión / análisis (textarea)
- Botón "Generar resumen" → Claude API via Cloudflare Worker
- Subida de imagen → Cloudinary
- Al guardar: vuelve al calendario y recarga datos

**Sección 5 — Análisis (gráficas):**
- Curva de equity (P&L acumulado)
- Win rate semanal
- P&L promedio por día de semana
- MAE vs MFE scatter plot
- Distribución de resultados (donut)
- Disciplina por sesión (%)

**Sección 6 — Galería:**
- Vista por mes o "todas"
- Thumbnails con slots vacíos (días hábiles sin imagen mostrados con borde punteado)
- Días futuros con opacidad reducida
- Click en imagen → lightbox con navegación prev/next y contador (ej. "3 / 12")
- Navegación lightbox: botones ← →, teclas ArrowLeft/ArrowRight, Esc para cerrar

### Integración Cloudflare Worker #1 — Proxy Claude API
- **URL:** `https://broad-hall-c53f.kristerock.workers.dev`
- **Motivo:** Anthropic bloquea llamadas CORS directas desde el browser
- **Flujo:** `form.js → fetch(Worker) → Anthropic API → respuesta → form.js → guarda resumen_ia en Supabase`
- El Worker también gestiona el endpoint `/api/session` con autenticación por token (`X-Dashboard-Token`)

### Integración Cloudinary
- Cloud name: `dq4n7bjta` | Upload preset: `trading-journal` (Unsigned)
- Las URLs resultantes se guardan en `sesiones.imagen_url`

### Disciplina — 7 factores
La métrica de disciplina se calcula sobre **sesiones activas** (sesiones donde operó o donde `motivo_no_opero = 'Sin setup'`):

| Factor | Campo |
|---|---|
| Zonas vigentes verificadas | `chk_zonas` |
| Orden precolocada a tiempo | `chk_orden` |
| Máx 5 velas en corrida | `chk_5velas` |
| Sin noticia roja activa | `chk_noticias` |
| Zona con consecución | `chk_consecucion` |
| Estructura I+R+I fluida | `chk_estructura` |
| Sin errores de ejecución | (sin casuísticas registradas ese día) |

- **Colores:** ≥80% verde | 50-79% amarillo | <50% rojo
- **Sub-texto:** "X/N sesiones con fallos"
- **Modal de detalle:** barras por factor ordenadas por fallos + lista de días fallidos con etiquetas de factores incumplidos

### Decisiones técnicas de la fase

| Decisión | Motivo |
|---|---|
| Checklist hardcodeado (no dinámico desde tabla `reglas`) | Reglas estables, menos complejidad |
| Claude API via Cloudflare Worker | CORS bloqueado por Anthropic desde el browser |
| API key Claude en localStorage | Repositorio privado pero como práctica de seguridad |
| RLS deshabilitado en tablas principales | Proyecto personal, un solo usuario, sin riesgo |
| Vanilla JS sin frameworks | Simplicidad, compatibilidad directa con GitHub Pages |
| `claude-haiku-4-5-20251001` | Económico — ~$0.0004 por resumen. El plan inicial era Sonnet; se cambió a Haiku, los $5 cargados alcanzan para ~12,500 resúmenes |
| Festivos CME calculados en JS | Sin dependencia de API externa, sin tabla adicional, siempre actualizados |
| FOMC en tabla Supabase | Las fechas cambian cada año; más fácil insertarlas manualmente que mantener lógica compleja |
| Cuenta filtro persistida en localStorage | El usuario siempre opera con PA-APEX; evita seleccionar manualmente en cada carga |

### Resultado
Dashboard web completo publicado en `https://kristeb-trader.github.io/trading-journal`. Todas las secciones funcionales. Integraciones con Supabase, Claude API y Cloudinary operativas.

---

## FASE 3 — Indicador C# para NinjaTrader 8

### Objetivo
Crear un indicador que detecte automáticamente el cierre de cada trade en NinjaTrader 8 y haga un POST a Supabase, sin intervención del trader.

### Archivo
`NinjaTrader/SupabaseAutoExport.cs`

**Ruta de instalación:**
`Documentos\NinjaTrader 8\bin\Custom\Indicators\SupabaseAutoExport.cs`

> **Nota:** Después de cada recompilación hay que quitar y volver a agregar el indicador al gráfico.

### Problemas resueltos durante el desarrollo

**CS0120: `SystemPerformance` no disponible en `Indicator`**
`SystemPerformance` es propiedad de `StrategyBase`, no de `IndicatorBase`.
→ Eliminado. Reemplazado por suscripción a `Account.ExecutionUpdate`.

**CS0120: `Position.MarketPosition` no disponible en `Indicator`**
`Position` también pertenece a `StrategyBase`.
→ Se rastrea posición con variable `netQty` (int: >0 long, <0 short, 0 flat).

**CS0115: `OnExecutionUpdate` override no válido en `Indicator`**
El método no existe como virtual en `IndicatorBase`.
→ Se usa `monitoredAccount.ExecutionUpdate += OnAccountExecutionUpdate`.

### Diseño final del indicador

**Clase principal:** `SupabaseAutoExport : Indicator`
**Clase auxiliar:** `AccountNameConverter : TypeConverter` — dropdown en UI de NT8 leyendo `Account.All`

**Flujo:**
- `State.DataLoaded`: itera `Account.All`, encuentra la cuenta configurada, suscribe a `ExecutionUpdate`
- `OnAccountExecutionUpdate`: suma/resta `netQty` por `OrderAction`. `0→N` = trade abierto (captura entry). `N→0` = trade cerrado (calcula métricas, dispara POST async)
- `OnBarUpdate` (OnBarClose): actualiza `maeExtreme` / `mfeExtreme` con `High[0]` / `Low[0]`
- `State.Terminated`: desuscribe evento, dispone `HttpClient`

**Fusión ATM multi-contrato:**
Ventana de 3 segundos: si llegan múltiples ejecuciones del mismo instrumento/dirección dentro de ese intervalo, se acumulan en un único trade (suma de qty, profit, commission; promedio de precios ponderados).

**Cálculo de profit:** `profitPoints × Instrument.MasterInstrument.PointValue × qty` redondeado a 2 decimales

**Comisión:** `ex.Commission` leído directamente desde NinjaTrader 8.x (puede ser 0 en versiones antiguas). Antes estaba hardcodeado en 0.

**Clasificación resultado:** exitName contiene "Target" → `"target"`, contiene "Stop" → `"stop"`, otro → `"otro"`

**Sincronización:** `lock(syncLock)` protege variables compartidas entre hilo NT8 y hilo de Account events

**Endpoint:** `POST https://jothoslozctflfrnysrx.supabase.co/rest/v1/trades`

### Configuraciones Supabase ejecutadas para la Fase 3

```sql
ALTER TABLE trades ADD COLUMN IF NOT EXISTS account TEXT;
NOTIFY pgrst, 'reload schema';                          -- error PGRST204
GRANT USAGE, SELECT ON SEQUENCE trades_id_seq TO anon; -- error 42501
-- Trigger trg_cum_net_profit (ver sección de BD arriba)
```

### Campos NULL en exports automáticos
`trade_number` y `etd` quedan NULL — métricas internas accesibles solo desde `SystemPerformance` de Strategy, no desde un Indicator. No afectan el dashboard.

### Compatibilidad con NinjaTrader 8.1.7.0
El indicador es compatible. El campo `ex.Commission` puede retornar 0 en versiones anteriores a 8.x; desde 8.1.x retorna el valor real. El código lee el valor directamente sin fallback.

### Resultado
Indicador compilando sin errores. POST exitoso (201 Created). Probado con cuenta `Sim101`. Listo para usar con cuenta `PA-APEX-232411-03`.

---

## FASE 4 — Bot de Telegram para registro de sesiones

### Objetivo
Canal alternativo al formulario web para registrar sesiones directamente desde Telegram con flujo conversacional e inline keyboards.

### Archivos
- `TelegramBot/worker.js`
- `TelegramBot/wrangler.toml` (binding KV ID: `3dd631773a6041c1a97a8e9a8f861067`)

### Flujo de servicios

```
Trader (Telegram) → Telegram Servers → Webhook POST
→ Cloudflare Worker #2 (trading-journal-bot.kristerock.workers.dev)
→ Lee / escribe estado en Cloudflare KV (key: s:{chatId}, TTL: 3600s)
→ POST /rest/v1/sesiones → Supabase
```

**Webhook:**
`https://api.telegram.org/bot{BOT_TOKEN}/setWebhook?url=https://trading-journal-bot.kristerock.workers.dev`

### Variables de entorno del Worker

| Variable | Valor / Descripción |
|---|---|
| `BOT_TOKEN` | Token del bot de @BotFather |
| `SUPABASE_URL` | `https://jothoslozctflfrnysrx.supabase.co` |
| `SUPABASE_KEY` | Anon key de Supabase |
| `ALLOWED_CHAT_ID` | `372127764` — único chat autorizado |
| `TIMEZONE` | `America/Bogota` — UTC-5, sin horario de verano |

**KV Binding:** nombre `KV` → namespace `trading-journal-bot-kv`

### Diseño del bot

**Patrón:** State Machine + persistencia en KV
**Comandos:** `/sesion` inicia flujo | `/cancelar` abandona y limpia estado KV

**Máquina de estados:**
```
OPERO → MOTIVO (si no operó, termina guardando)
OPERO → CONTEXTO → CORRIDA → VELAS → RETROCESO → ZONAS_CONTRA → SETUP → CHECKLIST → REFLEXION
```

**Estado KV:** key `s:{chatId}` → `{ step, data: { campos acumulados } }` con TTL 3600s

**Checklist interactivo:** único mensaje con 6 botones toggle. Usa `editMessageText` para actualizar en lugar de enviar nuevos mensajes.

**Upsert idempotente:** `Prefer: resolution=merge-duplicates` aprovecha `UNIQUE(sesion_date)`

**Auto-invalidación:** si `velas_corrida > 5`, `chk_5velas` se fuerza a `false`

### Problema resuelto: fecha UTC vs local

Cloudflare Workers corre en UTC. El trader está en Medellín, Colombia (UTC-5).

**Solución:** `new Intl.DateTimeFormat('en-CA', { timeZone: env.TIMEZONE }).format(new Date())`

### Despliegue manual (Cloudflare Dashboard)
1. Storage & Databases → Workers KV → Create Instance → `trading-journal-bot-kv`
2. Workers & Pages → Create → Hello World → nombre: `trading-journal-bot` → Deploy
3. Edit code → pegar `TelegramBot/worker.js` → Deploy
4. Settings → Variables and Secrets → agregar las 5 variables
5. Bindings → Add binding → KV Namespace → variable `KV` → namespace `trading-journal-bot-kv`
6. Registrar webhook desde el navegador

### Resultado
Bot funcional. Flujo completo de 9 pasos con checklist interactivo. Fecha correcta en zona Colombia. Guardado exitoso en `sesiones`. Protegido por `ALLOWED_CHAT_ID`.

> **Limitación:** El bot de Telegram no genera resumen IA ni soporta subida de imágenes — esas funciones solo existen en el formulario web.

---

## Estado actual del proyecto

### ✅ Todo funcionando
- Dashboard web con 6 secciones: calendario, métricas, tabla, formulario de sesión, gráficas, galería
- Calendario con colores para Target/Stop/Mixto/Sin operar/Festivo/FOMC y leyenda
- Festivos CME calculados automáticamente en JS (sin tabla en BD)
- Fechas FOMC en tabla `fomc_dates` consultadas cada mes
- Filtro de cuenta con persistencia en `localStorage` (default: PA-APEX)
- Métricas con disciplina de 7 factores + modal de detalle por factor
- Error más frecuente con modal de detalle
- Galería de imágenes con slots vacíos para días sin imagen
- Lightbox con navegación prev/next y teclado (←→ Esc)
- Integración Claude API via Worker proxy para resúmenes de sesión
- Upload de imágenes a Cloudinary desde el formulario web
- Edición de sesiones existentes desde el dashboard
- Indicador C# NT8 exportando trades automáticamente a Supabase
- Comisión capturada desde `ex.Commission` (NT8 8.x+)
- Trigger calculando `cum_net_profit` en cada INSERT
- Bot de Telegram registrando sesiones con flujo completo de 9 pasos
- Documentación completa en `docs/`

### ⚠️ A tener en cuenta
- El indicador C# fue probado con cuenta `Sim101`. En operativa real con `PA-APEX-232411-03`, verificar que el nombre exacto de la cuenta coincide con el dropdown de NT8.
- `trade_number` y `etd` quedan NULL en trades auto-exportados desde NinjaTrader — son internos de NT8, no afectan el dashboard.
- `ex.Commission` puede retornar 0 si la versión de NT8 es anterior a 8.x.

### 🔜 Posibles mejoras futuras
- Agregar resumen IA al bot (llamada desde Worker #2 al Worker #1 proxy de Claude)
- Soporte para subir imagen desde Telegram (upload a Cloudinary desde el Worker)
- Backup periódico de la BD (Supabase scheduled exports)
- Agregar campo `strategy` al POST del indicador C# (actualmente NULL)
- Notificación automática por Telegram al cierre de cada trade
- Soporte multi-instrumento o multi-cuenta en el dashboard

---

## Checklist de 6 reglas de la metodología (hardcodeado en frontend)

| Campo DB | Descripción |
|---|---|
| `chk_zonas` | Zonas vigentes verificadas — ninguna zona vigente entre entrada y target |
| `chk_orden` | Orden precolocada a tiempo — lista antes del cierre de la vela de rompimiento |
| `chk_5velas` | Máx 5 velas en corrida (auto-invalida si `velas_corrida > 5`) |
| `chk_noticias` | Sin noticia roja activa — no entrar 5 min antes de noticias rojas |
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

---

## Cómo continuar en un nuevo chat

1. Leer este archivo (`docs/historial-proyecto.md`) para contexto completo del proyecto
2. Revisar también `docs/arquitectura-funcional.md` y `docs/arquitectura-tecnica.md` para detalles técnicos actualizados
3. El código fuente está en GitHub: `https://github.com/kristeb-trader/trading-journal`
4. Working directory local: `C:\Users\Asus\Claro drive\Trading Journal`
5. Para cambios en la BD, usar el SQL Editor de Supabase: `https://jothoslozctflfrnysrx.supabase.co`
