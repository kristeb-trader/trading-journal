# Trading Journal NQ Futures
## Arquitectura Técnica del Sistema

**Versión:** 4.0 | **Fecha:** Mayo 2026 | **Autor:** kristeb-trader

---

## 1. Visión General

Sistema distribuido de registro, análisis y visualización de operativa en futuros NQ/MNQ (temporalidad 1 minuto). Arquitectura 100% serverless y cloud-native, con tres canales de entrada de datos y un dashboard web como capa de presentación unificada. Incluye PWA (Progressive Web App) instalable en iPhone y Android con estrategia de caché network-first para actualizaciones automáticas.

**Principios de diseño:**
- Zero-ops: sin servidores propios que mantener
- Costo ~$0/mes operando en free tiers
- Separación clara entre captura de datos, procesamiento y presentación
- Credenciales nunca expuestas en source code público

---

## 2. Stack Tecnológico

| Capa | Tecnología | Rol en el sistema |
|---|---|---|
| Base de datos | Supabase (PostgreSQL 15) | Persistencia, API REST, triggers |
| Frontend | HTML + JS Vanilla (ES2022) | Dashboard web SPA + PWA instalable |
| Hosting web | GitHub Pages | CDN estático global |
| Service Worker | `sw.js` (nqjournal-v4) | PWA: network-first app shell, cache-first CDN |
| Proxy IA | Cloudflare Worker #1 | Bypass CORS → Anthropic API |
| Bot Telegram | Cloudflare Worker #2 | Flujo conversacional de sesiones |
| Estado conversación | Cloudflare KV | Sesiones temporales del bot (TTL 1h) |
| Análisis IA | Anthropic Claude API (`claude-sonnet-4-5-20251001`) | Coach IA · análisis Chaumer · multi-turn · visión de imagen |
| Imágenes | Cloudinary | Upload, almacenamiento y CDN |
| Captura automática | C# Indicator (.NET 4.8 / NinjaTrader 8) | Exportación de trades en tiempo real |

---

## 3. Diagrama de Arquitectura General

```
╔══════════════════════════════════════════════════════════════════════╗
║                      CANALES DE ENTRADA                             ║
╠══════════════╦═══════════════════════╦═══════════════════════════════╣
║              ║                       ║                               ║
║  NinjaTrader ║   Dashboard Web       ║   Telegram App               ║
║  (PC trader) ║   (Browser / PWA)     ║   (Móvil)                    ║
║              ║                       ║                               ║
║  C# Indicator║   GitHub Pages SPA    ║   Bot: @trading_journal_bot  ║
║  .NET 4.8    ║   JS Vanilla + SW v3  ║                               ║
╚══════╤═══════╩═══════════╤═══════════╩═══════════════╤═══════════════╝
       │                   │                           │
       │ POST /trades      │ fetch() REST              │ Webhook POST
       │ (fusión ATM 3s)   │                           │
       ▼                   │                           ▼
╔══════════════╗           │           ╔═══════════════════════════════╗
║              ║           │           ║  Cloudflare Worker #2         ║
║  Supabase    ║◄──────────┘           ║  trading-journal-bot          ║
║  REST API    ║                       ║                               ║
║  (PostgREST) ║◄──────────────────────║  POST /sesiones               ║
║              ║                       ╠═══════════════════════════════╣
╠══════════════╣                       ║  Cloudflare KV                ║
║  PostgreSQL  ║                       ║  Estado conversación          ║
║              ║                       ║  TTL: 3600s                   ║
║  trades      ║                       ╚═══════════════════════════════╝
║  sesiones    ║
║  fomc_dates  ║           ╔═══════════════════════════════════════════╗
║  catalogo_   ║           ║  Dashboard Web — GitHub Pages             ║
║  casuisticas ║           ║                                           ║
║  catalogo_   ║           ║  calendar.js  │ metrics.js  │ charts.js   ║
║  emociones   ║           ║  table.js     │ form.js     │ app.js      ║
║  estrategia_ ║           ║  gallery.js   │ data.js     │ annual.js   ║
║  chaumer     ║           ║  coach.js ← NUEVO                         ║
║  diagnosticos║           ║                                           ║
║  _diarios    ║           ║  "Coach IA" →                             ║
║              ║           ╚══════════════╤════════════════════════════╝
║  Trigger:    ║
║  cum_net     ║
║  _profit     ║
╚══════════════╝
                                          │
                                          │ fetch()
                                          ▼
                           ╔══════════════════════════╗
                           ║  Cloudflare Worker #1    ║
                           ║  broad-hall-c53f         ║
                           ║  (Proxy CORS)            ║
                           ╚══════════════╤═══════════╝
                                          │
                                          ▼
                           ╔══════════════════════════╗
                           ║  Anthropic Claude API    ║
                           ║  claude-sonnet-4-5       ║
                           ║  -20251001               ║
                           ║  ~$0.02 / diagnóstico    ║
                           ╚══════════════════════════╝
```

---

## 4. Componentes Detallados

### 4.1 Indicador C# — `SupabaseAutoExport`
**Archivo:** `NinjaTrader/SupabaseAutoExport.cs`
**Patrón:** Event-driven | Account.ExecutionUpdate

**Flujo sin fusión (1 contrato):**
```
[Trade cierra en NT8]
        │
        ▼
Account.ExecutionUpdate
        │
        ├─ Filtrar por Instrument.FullName
        ├─ netQty += delta según OrderAction
        │
        ├─ netQty 0 → N : capturar entry (precio, hora, nombre)
        │
        └─ netQty N → 0 : calcular y publicar
               │
               ├─ profit = Δprecio × PointValue × qty
               ├─ commission = ex.Commission (leída de NT8)
               ├─ MAE    = máx excursión adversa (de OnBarUpdate)
               ├─ MFE    = máx excursión favorable (de OnBarUpdate)
               ├─ bars   = Δminutos entry→exit
               └─ Task.Run → POST JSON → Supabase /trades
```

**Ventana de fusión ATM (3 segundos):**
Cuando se operan 2+ contratos con ATM, cada contrato genera un `ExecutionUpdate` separado. El indicador acumula los cierres del mismo instrumento/dirección/cuenta durante 3 segundos y publica un único trade consolidado con precios promedio ponderados y profit/MAE/MFE/comisión sumados.

```
[Cierre contrato 1] → hasPending = true → mergeTimer = 3s
[Cierre contrato 2] → se acumula en pendingData durante los 3s
        │
        └─ Timer vence → publicar trade consolidado
               ├─ entry_price = promedio ponderado por qty
               ├─ exit_price  = promedio ponderado por qty
               ├─ profit      = suma de profits individuales
               ├─ commission  = suma de comisiones individuales
               ├─ MAE/MFE     = suma de excursiones
               └─ POST único → Supabase /trades
```

**Campos internos de fusión:** `pendingCommission`, `mergeTimer`, `mergeLock`, `hasPending`.

**Comisión real:** Lee `ex.Commission` de NT8. Se acumula correctamente en fusiones. Se envía a Supabase en el campo `commission`.

**Compatible con:** NT8 8.1.7.0 (APIs usadas son estables).

**TypeConverter personalizado (`AccountNameConverter`):**
Lee `Account.All` en tiempo de ejecución y genera un dropdown en la UI de NinjaTrader para seleccionar la cuenta a monitorear.

**Tracking MAE/MFE en `OnBarUpdate`:**
```
OnBarUpdate (OnBarClose)
        │
        └─ Si inTrade: maeExtreme / mfeExtreme con High[0] / Low[0]
```

---

### 4.2 Frontend SPA — Dashboard Web

| Módulo | Responsabilidad |
|---|---|
| `config.js` | Credenciales Supabase + Cloudinary |
| `db.js` | Capa de datos — todas las queries REST |
| `calendar.js` | Vista mensual, agrupación P&L, festivos CME, días FOMC, iconos por celda, filtro de cuenta |
| `metrics.js` | KPIs: win rate, equity, racha, disciplina (7 factores, clickable), error frecuente (casuísticas) |
| `charts.js` | 6 gráficas Chart.js: equity curve, scatter MAE/MFE, donut, etc. |
| `table.js` | Tabla paginada de trades con filtros y búsqueda |
| `form.js` | Formulario de sesión (sin IA — solo notas adicionales) |
| `gallery.js` | Galería de imágenes agrupadas por semana, lightbox con teclado |
| `data.js` | Gestión de casuísticas y emociones (catálogos con drag-and-drop, toggle activa) |
| `annual.js` | Dashboard anual: KPI strip, equity curve, barras P&L mensual, tabla mensual |
| `coach.js` | **NUEVO** Coach IA: diagnóstico multi-sección, chat multi-turn, historial, estrategia editable |
| `app.js` | Bootstrap, modales, toasts, lightbox, navegación (8 secciones) |

**Secciones de navegación:**
1. `calendar` — Calendario mensual
2. `metrics` — Métricas
3. `gallery` — Galería de imágenes
4. `table` — Tabla de trades
5. `form` — Registrar sesión
6. `charts` — Análisis / Gráficas
7. `annual` — Resumen Anual
8. `coach` — **NUEVO** Coach IA

**Flujo Coach IA (v4.0 — módulo dedicado):**
```
coach.js (sección-coach)
  → cargarFecha(date)
      ├─ setupEmocionConfianza(date)  ← carga emoción/confianza del día
      └─ DB.getDiagnosticoByDate(date) ← muestra diagnóstico existente si lo hay

  → [Btn "Analizar sesión"]
      → buildSystemPrompt()
           ├─ DB.getEstrategiaSection()        ← 6 secciones de estrategia Chaumer
           ├─ DB.getSesionesForContext(60 días) ← historial + patrones
           └─ DB.getSessionForCoach(date)      ← sesión del día (trades, checklist, etc.)
      → fetch(Worker #1) con claude-sonnet-4-5-20251001, max_tokens=3000
      → renderAnalisis() — 6 tarjetas: Contexto│Desarrollo│Validación│Errores│Aprendizaje│Resumen
      → [Btn "Guardar"] → DB.saveDiagnostico() → diagnosticos_diarios

  → Chat multi-turn
      → chatHistory[] + systemPromptCache
      → imagen opcional (base64, Claude Vision)
      → fetch(Worker #1) → respuesta en burbuja

  → Historial → DB.getHistorialDiagnosticos() → lista por fecha
  → Estrategia → DB.upsertEstrategiaSection() → edición in-place
```

**Prompt del Coach IA — estructura (v4.0 — 6 secciones):**
```
Eres un Coach IA de trading especializado en NQ/MNQ Futures (1 min).
Metodología Alfredo Chaumer. Idioma: español. Tono: estricto y directo.

═══ ESTRATEGIA CHAUMER (del trader) ═══
[6 secciones editables: Fundamentos, Setups, Gestión, Psicología, Checklist, Reglas]

═══ HISTORIAL 60 DÍAS ═══
Rendimiento: Win Rate, P&L, Disciplina promedio
Patrones detectados: errores recurrentes, días con mejor/peor desempeño

═══ SESIÓN DEL DÍA — {fecha} ═══
Emoción: {emoji nombre} | Confianza: ★★★☆☆
Trades: N (T: X | S: Y | BE: Z) — P&L: $N
Checklist: [6 ítems ✅/❌] | Disciplina: N%
Casuísticas: [lista] | Notas: ...

═══ INSTRUCCIONES ═══
Genera exactamente 6 secciones:
1. **Contexto** — Situación del día en el histórico.
2. **Desarrollo** — Cómo evolucionó la sesión.
3. **Validación** — Qué salió bien y por qué.
4. **Errores** — Qué falló con referencias a la estrategia.
5. **Aprendizaje** — Lección concreta y acción para mañana.
6. **Resumen** — Síntesis de 2-3 frases.
```

**Break Even:** `Math.abs(profit) <= 6` → resultado `'be'` (±$6).

**Disciplina (7 factores):** `(chk_zonas + chk_orden + chk_5velas + chk_noticias + chk_consecucion + chk_estructura + sinCasuisticas) / 7 × 100`

**Abreviación de cuenta:** `PA-APEX-23411-03` → `PA-APEX` (primeras 2 partes separadas por `-`).

**API key Claude:** guardada en `localStorage`. El usuario la ingresa una vez en ⚙ Ajustes.

**Sincronización calendario ↔ métricas:**
- Las métricas siguen el mes y la cuenta del calendario.
- La navegación de mes llama `Metrics.rerender()` automáticamente.
- El filtro de cuenta persiste en `localStorage`.

---

### 4.3 Dashboard Anual — `annual.js` (NUEVO v3.0)

**Módulo IIFE:** `Annual = (() => { ... })()`

**Flujo de datos:**
```
Annual.init()
  → loadAndRender()
  → fetch trades (cuenta filtrada, año seleccionado)
  → fetch sesiones (año seleccionado)
  → agrupar por mes
  → calcular métricas por mes (P&L, win rate, disciplina, max drawdown, profit factor)
  → renderKpis()   — 8 chips: P&L, Trades, Win Rate, Profit Factor,
                              Max Drawdown, Disciplina, Mejor Mes, Peor Mes
  → renderCharts() — Chart.js: equity curve (line) + P&L barras (bar)
  → renderMonthTable() — tabla mensual con totales coloreados
```

**Filtro de cuenta:**
- Dropdown precargado con cuentas únicas desde todos los trades
- Default: primera cuenta que contenga `PA-APEX`, o la guardada en `localStorage('annualAccount')`
- Al cambiar cuenta → `loadAndRender()` se re-ejecuta

**Capital inicial:**
- Input persistido en `localStorage('annual_capital_inicial')`
- El usuario lo configura una vez. Cuando no está definido, la columna Rentabilidad muestra `—`.
- Rentabilidad mensual = `(P&L_mes / capital_inicial) × 100`

**Navegación de año:**
- Botones `◀ ▶` para cambiar `annualYear`
- Por defecto: año actual

**Colores en totals row:**
- `.annual-totals-pos` — verde (P&L ≥0, efectividad ≥50%, disciplina ≥80%)
- `.annual-totals-neg` — rojo (P&L <0, efectividad <40%)
- `.annual-totals-warn` — amarillo (efectividad 40-49%, disciplina 55-79%)
- `.annual-totals-neutral` — neutro (campos sin color semántico)

**Color de efectividad por fila:**
- `.annual-pos` (verde): ≥50%
- `.annual-warn` (amarillo): ≥40%
- `.annual-neg` (rojo): <40%

---

### 4.4 Telegram Bot — Cloudflare Worker #2

**Archivo:** `TelegramBot/worker.js`
**Patrón:** Webhook + State Machine

**Máquina de estados (v4.0 — con EMOCION y CONFIANZA):**
```
Notificación de trade → botón inline "📝 Registrar sesión del día"
                                    ↓
/sesion  o  callback 'iniciar_sesion'
   │
   ├─ [No operé] → MOTIVO → saveSession() → FIN
   │
   └─ [Sí operé] → EMOCION (catálogo dinámico desde catalogo_emociones, 2 por fila + ⏭ Omitir)
                       → CONFIANZA (★☆☆☆☆ … ★★★★★ + ⏭ Omitir)
                       → CONTEXTO (lista 5 opciones)
                       → CORRIDA (1/2/3ª corrida)
                       → VELAS (número de velas)
                       → ZONAS_CONTRA (Sí/No)
                       → SETUP (lista 6 setups, 2 por fila)
                       → CHECKLIST (6 checkboxes)
                       → REFLEXION ("Análisis del día")
                       → saveSession() → resumen completo → FIN
```

**Nuevos pasos vs v3.0:** `EMOCION` (estado_emocional_id desde catálogo dinámico) y `CONFIANZA` (nivel 1-5 o skip).

**Payload de sesión ahora incluye:**
```javascript
estado_emocional_id: data.estado_emocional_id ?? null,
nivel_confianza:     data.nivel_confianza ?? null,
```

**Opciones de contexto (lista con botones):**
```
📈 Alcista fuerte | ↗ Alcista | ↔ Mixto | ↘ Bajista | 📉 Bajista fuerte
```

**Setups disponibles (lista con botones, 2 por fila):**
```
IRI Apertura Alcista      | IRI Apertura Bajista
IRI Continuación Alcista  | IRI Continuación Bajista
Reingreso Alcista         | Reingreso Bajista
```

**Notificación automática de trade:**
Cuando NT8 registra un trade, el bot envía la notificación con un botón inline:
```
[ 📝 Registrar sesión del día ]
```
Al presionarlo, inicia el flujo `startSesionFlow()` directamente sin necesidad de `/sesion`.

**Resumen completo tras guardar:**
El bot muestra todos los campos registrados incluyendo el checklist ítem por ítem y las casuísticas si las hay.

**Estado en KV:**
```json
Key:   "s:{chatId}"
Value: { "step": "VELAS", "data": { "sesion_date": "2026-05-15", "contexto": "Alcista fuerte", ... } }
TTL:   3600s
```

**Upsert a Supabase:**
```
POST /rest/v1/sesiones
Prefer: resolution=merge-duplicates   ← idempotente por UNIQUE(sesion_date)
```

**Zona horaria:** `TIMEZONE=America/Bogota` → `Intl.DateTimeFormat` → fecha local correcta.

---

### 4.5 Service Worker — `sw.js` (v4.0)

**Versión de caché:** `nqjournal-v4`

**Estrategia por tipo de recurso:**

| Tipo | Estrategia | Recursos |
|---|---|---|
| App shell (JS/CSS/HTML propios) | **Network-first** | `index.html`, `css/styles.css`, todos los `js/*.js` (incl. `coach.js`), `favicon.svg`, `manifest.json` |
| CDN (librerías externas) | **Cache-first** + background update | Tabler Icons, Supabase JS, Chart.js |
| APIs externas | **Network-only** (sin intercepción) | `supabase.co`, `cloudinary.com`, `anthropic.com`, `telegram.org`, `workers.dev` |

**Network-first para app shell:**
```
fetch(request)
  → si ok: guardar en caché + retornar respuesta
  → si offline: retornar desde caché
```
Garantiza que los usuarios siempre reciben la versión más reciente al cargar con conexión. Fallback a caché solo cuando no hay red (modo offline).

**Instalación:** pre-cachea los recursos CDN.
**Activación:** elimina cachés viejos (≠ `nqjournal-v4`) + `clients.claim()` inmediato.

**Actualización en iPhone PWA:**
Al hacer `git push` el cambio se sirve automáticamente en el próximo acceso con conexión (estrategia network-first). No requiere reinstalar la PWA.

---

## 5. Base de Datos

### Tabla `trades` — Operaciones automáticas NT8

| Columna | Tipo | Origen |
|---|---|---|
| `id` | bigint PK | Secuencia auto |
| `instrument` | text | NT8 |
| `account` | text | NT8 |
| `market_pos` | text | NT8 (`Long` / `Short`) |
| `qty` | integer | NT8 |
| `entry_price` / `exit_price` | numeric | NT8 |
| `entry_time` / `exit_time` | timestamptz | NT8 |
| `entry_name` / `exit_name` | text | NT8 |
| `profit` | numeric | C# calculado |
| `commission` | numeric | `ex.Commission` leído de NT8 |
| `mae` / `mfe` | numeric | C# via High/Low barras |
| `bars` | integer | C# Δminutos |
| `trade_date` | date | C# |
| `resultado` | text | `target` / `stop` / `be` / `otro` |
| `cum_net_profit` | numeric | **Trigger PostgreSQL** |

**Break Even:** `resultado = 'be'` cuando `abs(profit) <= 6`.

**Trigger `trg_cum_net_profit`:**
```sql
BEFORE INSERT → NEW.cum_net_profit = SUM(profit WHERE entry_time < NEW.entry_time) + NEW.profit
```

### Tabla `sesiones` — Datos manuales del trader

Campos clave: `sesion_date UNIQUE`, `contexto`, `num_corrida`, `velas_corrida`,
`zonas_contra`, `setup`, `chk_zonas/orden/5velas/noticias/consecucion/estructura`,
`analisis_trader`, `resumen_ia`, `imagen_url`, `no_opero`, `motivo_no_opero`,
`estado_emocional_id` (FK → catalogo_emociones), `nivel_confianza` (int 1-5)

> **Nota v3.0:** `puntos_retroceso` sigue en la tabla por compatibilidad histórica, pero el bot ya no lo solicita.

### Tabla `fomc_dates` — Fechas de reuniones FOMC

```sql
CREATE TABLE fomc_dates (
  date        DATE PRIMARY KEY,
  description TEXT DEFAULT 'FOMC Meeting'
);
```

Con RLS habilitado (read-only público). Pre-poblada con fechas 2025 y 2026.

### Tabla `catalogo_casuisticas` — Catálogo de errores tipificados (v3.0)

```sql
CREATE TABLE catalogo_casuisticas (
  id       bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre   text NOT NULL,
  activa   boolean DEFAULT true,
  orden    integer DEFAULT 0
);
```

### Tabla `catalogo_emociones` — Catálogo de estados emocionales (NUEVO v4.0)

```sql
CREATE TABLE catalogo_emociones (
  id     bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre text NOT NULL,
  emoji  text DEFAULT '😐',
  activa boolean DEFAULT true,
  orden  integer DEFAULT 0
);
```

Poblada con emociones pre-definidas. Orden y toggle manejados desde `data.js`.
El bot la consulta dinámicamente al paso EMOCION para construir el teclado inline.

### Tabla `estrategia_chaumer` — Secciones de la estrategia editable (NUEVO v4.0)

```sql
CREATE TABLE estrategia_chaumer (
  id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  seccion    text UNIQUE NOT NULL,  -- 'fundamentos', 'setups', 'gestion', etc.
  contenido  text DEFAULT ''
);
```

Usada por `coach.js` para construir el system prompt. El trader edita el contenido directamente desde la pestaña "Estrategia" del Coach IA.

### Tabla `diagnosticos_diarios` — Diagnósticos persistidos del Coach IA (NUEVO v4.0)

```sql
CREATE TABLE diagnosticos_diarios (
  id             bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  diagnostico_date date UNIQUE NOT NULL,
  sec_contexto   text,
  sec_desarrollo text,
  sec_validacion text,
  sec_errores    text,
  sec_aprendizaje text,
  sec_resumen    text,
  sesion_data    jsonb,  -- snapshot de la sesión analizada
  created_at     timestamptz DEFAULT now()
);
```

### Permisos
```sql
RLS:   DISABLED en trades y sesiones (proyecto personal, un solo usuario)
RLS:   ENABLED en fomc_dates (read-only público)
RLS:   ENABLED en catalogo_casuisticas (read + update)
RLS:   ENABLED en catalogo_emociones (read + update)
RLS:   ENABLED en estrategia_chaumer (read + upsert)
RLS:   ENABLED en diagnosticos_diarios (read + insert/update)
GRANT: INSERT, SELECT, UPDATE ON trades, sesiones TO anon
GRANT: SELECT ON fomc_dates TO anon
GRANT: SELECT, UPDATE ON catalogo_casuisticas, catalogo_emociones TO anon
GRANT: SELECT, INSERT, UPDATE ON estrategia_chaumer, diagnosticos_diarios TO anon
GRANT: USAGE, SELECT ON SEQUENCE trades_id_seq, sesiones_id_seq TO anon
```

### Funciones `db.js` (acumulado)

| Función | Descripción |
|---|---|
| `getFomcDates(year, month)` | Fechas FOMC del mes/año |
| `getSessionsWithImages()` | Sesiones con `imagen_url` no null (galería) |
| `getCasuisticasByMonth(year, month)` | Casuísticas del mes |
| `getAllCasuisticas()` | Todas las casuísticas con `casuistica` y `sesion_date` |
| `getCatalogoCasuisticas()` | Catálogo ordenado por `orden ASC` |
| `addCatalogoCasuistica(nombre)` | Agrega casuística al catálogo |
| `toggleCatalogoCasuistica(id, activa)` | Activa/desactiva casuística |
| `renameCatalogoCasuistica(id, nombre)` | Renombra casuística |
| `deleteCatalogoCasuistica(id)` | Elimina casuística |
| `updateCasuisticaOrden(id, orden)` | Actualiza orden (drag-and-drop) |
| `getCatalogoEmociones()` | Emociones activas ordenadas |
| `addCatalogoEmocion(nombre, emoji)` | Agrega emoción al catálogo |
| `toggleCatalogoEmocion(id, activa)` | Activa/desactiva emoción |
| `renameCatalogoEmocion(id, nombre, emoji)` | Edita nombre y emoji |
| `deleteCatalogoEmocion(id)` | Elimina emoción |
| `updateEmocionOrden(id, orden)` | Actualiza orden (drag-and-drop) |
| `getEstrategiaSection(seccion)` | Obtiene sección de estrategia Chaumer |
| `upsertEstrategiaSection(seccion, contenido)` | Guarda sección de estrategia |
| `getDiagnosticoByDate(date)` | Diagnóstico guardado de una fecha |
| `saveDiagnostico(date, secciones, sesionData)` | Persiste diagnóstico en `diagnosticos_diarios` |
| `getHistorialDiagnosticos(limit)` | Últimos N diagnósticos para el historial |
| `getSessionForCoach(date)` | Datos de sesión + trades para el análisis |
| `getSesionesForContext(days)` | Historial de sesiones para el system prompt |
| `upsertEmocionConfianza(date, emocionId, confianza)` | Guarda emoción y confianza del día |

---

## 6. Seguridad

| Vector | Mitigación |
|---|---|
| Anon key Supabase en browser | Repo privado + cargada desde `config.js` (no versionado público) |
| API key Claude | `localStorage` del browser, nunca en código fuente |
| Anon key en C# binary | Compilado localmente, no en repo público |
| Telegram bot | `ALLOWED_CHAT_ID` hardcodeado — bot ignora cualquier otro chat |
| Cloudflare Workers | HTTPS forzado, variables como secrets cifrados |
| RLS deshabilitado en trades/sesiones | Aceptable — proyecto personal, sin múltiples usuarios |
| fomc_dates | RLS habilitado — solo lectura pública |
| catalogo_casuisticas | RLS habilitado — lectura y actualización de orden vía anon |

---

## 7. Despliegue

| Componente | Mecanismo | Trigger |
|---|---|---|
| Dashboard web | `git push → main` | GitHub Pages auto-deploy |
| PWA en iPhone | network-first SW | Automático al recargar con conexión |
| Cloudflare Worker #1 (proxy) | Cloudflare Dashboard / Wrangler | Manual |
| Cloudflare Worker #2 (bot) | Cloudflare Dashboard / Wrangler | Manual |
| Indicador NT8 | Copiar `.cs` → compilar en NinjaScript Editor | Manual |
| Base de datos | Migraciones SQL manuales en Supabase SQL Editor | Manual |

---

## 8. Estructura del Repositorio

```
trading-journal/
├── index.html                  ← Shell SPA + sección-annual
├── favicon.svg
├── manifest.json               ← PWA manifest
├── sw.js                       ← Service Worker v4 (nqjournal-v4, network-first)
├── icons/                      ← Iconos PWA (192x192, 512x512)
├── css/
│   └── styles.css              ← Dark mode completo + estilos annual
├── js/
│   ├── config.js               ← Credenciales (no público)
│   ├── db.js                   ← Capa de datos (incluye catalogo_casuisticas)
│   ├── calendar.js
│   ├── metrics.js
│   ├── table.js
│   ├── form.js                 ← Formulario de sesión (sin IA)
│   ├── charts.js
│   ├── data.js                 ← Casuísticas + Emociones con drag-and-drop
│   ├── gallery.js              ← Galería de imágenes con lightbox
│   ├── annual.js               ← Dashboard anual
│   ├── coach.js                ← NUEVO: Coach IA (diagnóstico, chat, historial, estrategia)
│   └── app.js                  ← 8 secciones de navegación
├── NinjaTrader/
│   └── SupabaseAutoExport.cs   ← Indicador C#
├── TelegramBot/
│   ├── worker.js               ← Cloudflare Worker bot (sin RETROCESO)
│   └── wrangler.toml           ← Config KV binding
├── docs/
│   ├── arquitectura-tecnica.md
│   ├── arquitectura-funcional.md
│   ├── manual-tecnico.md
│   └── manual-usuario.md
├── PROGRESS.md
└── TRADING_JOURNAL_PROJECT.md
```

---

## 9. Costos Operativos

| Servicio | Plan | Límite free | Uso estimado | Costo |
|---|---|---|---|---|
| Supabase | Free | 500MB / 50k req/mes | < 5MB / < 1k req | $0 |
| GitHub Pages | Free | Ilimitado | Estático | $0 |
| Cloudflare Workers | Free | 100k req/día | < 100 req/día | $0 |
| Cloudflare KV | Free | 100k reads/día | < 50 reads/día | $0 |
| Cloudinary | Free | 25GB | < 1GB/año | $0 |
| Anthropic Claude | Pay-per-use | — | ~20 diagnósticos/mes | ~$0.40 |
| **Total mensual** | | | | **< $0.50** |

> El costo aumentó con v4.0 porque se usa `claude-sonnet-4-5-20251001` (más potente que haiku) con max_tokens=3000 y un system prompt rico (~4000 tokens). Costo estimado por diagnóstico: ~$0.02. Para 20 sesiones/mes el costo total es ~$0.40/mes — sigue siendo despreciable.
