# Trading Journal NQ Futures
## Arquitectura Técnica del Sistema

**Versión:** 2.0 | **Fecha:** Mayo 2026 | **Autor:** kristeb-trader

---

## 1. Visión General

Sistema distribuido de registro, análisis y visualización de operativa en futuros NQ/MNQ (temporalidad 1 minuto). Arquitectura 100% serverless y cloud-native, con tres canales de entrada de datos y un dashboard web como capa de presentación unificada.

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
| Frontend | HTML + JS Vanilla (ES2022) | Dashboard web SPA |
| Hosting web | GitHub Pages | CDN estático global |
| Proxy IA | Cloudflare Worker #1 | Bypass CORS → Anthropic API |
| Bot Telegram | Cloudflare Worker #2 | Flujo conversacional de sesiones |
| Estado conversación | Cloudflare KV | Sesiones temporales del bot (TTL 1h) |
| Análisis IA | Anthropic Claude API (`claude-haiku-4-5`) | Resúmenes automáticos de sesión |
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
║  (PC trader) ║   (Browser)           ║   (Móvil)                    ║
║              ║                       ║                               ║
║  C# Indicator║   GitHub Pages SPA    ║   Bot: @trading_journal_bot  ║
║  .NET 4.8    ║   JS Vanilla          ║                               ║
╚══════╤═══════╩═══════════╤═══════════╩═══════════════╤═══════════════╝
       │                   │                           │
       │ POST /trades      │ fetch() REST              │ Webhook POST
       │                   │                           │
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
║  reglas      ║           ╔═══════════════════════════════════════════╗
║              ║           ║  Dashboard Web — GitHub Pages             ║
║  Trigger:    ║           ║                                           ║
║  cum_net     ║           ║  calendar.js  │ metrics.js  │ charts.js   ║
║  _profit     ║           ║  table.js     │ form.js     │ app.js      ║
╚══════════════╝           ║                                           ║
                           ║  "Generar resumen" →                      ║
                           ╚══════════════╤════════════════════════════╝
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
                           ║  claude-haiku-4-5        ║
                           ║  ~$0.0004 / resumen      ║
                           ╚══════════════════════════╝
```

---

## 4. Componentes Detallados

### 4.1 Indicador C# — `SupabaseAutoExport`
**Archivo:** `NinjaTrader/SupabaseAutoExport.cs`
**Patrón:** Event-driven | Account.ExecutionUpdate

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
               ├─ MAE    = máx excursión adversa (de OnBarUpdate)
               ├─ MFE    = máx excursión favorable (de OnBarUpdate)
               ├─ bars   = Δminutos entry→exit
               └─ Task.Run → POST JSON → Supabase /trades

OnBarUpdate (OnBarClose)
        │
        └─ Si inTrade: maeExtreme / mfeExtreme con High[0] / Low[0]
```

**TypeConverter personalizado (`AccountNameConverter`):**
Lee `Account.All` en tiempo de ejecución y genera un dropdown en la UI de NinjaTrader para seleccionar la cuenta a monitorear.

---

### 4.2 Frontend SPA — Dashboard Web

| Módulo | Responsabilidad |
|---|---|
| `config.js` | Credenciales Supabase + Cloudinary |
| `db.js` | Capa de datos — todas las queries REST |
| `calendar.js` | Vista mensual, agrupación P&L por día, color por resultado |
| `metrics.js` | KPIs: win rate, equity, racha, error frecuente |
| `charts.js` | 6 gráficas Chart.js: equity curve, scatter MAE/MFE, donut, etc. |
| `table.js` | Tabla paginada de trades con filtros y búsqueda |
| `form.js` | Formulario de sesión + integración Claude via Worker |
| `app.js` | Bootstrap, modales, toasts, lightbox, navegación |

**Flujo de resumen IA:**
```
form.js → fetch(Worker #1) → Anthropic API → resumen_ia → Supabase sesiones
```
**API key Claude:** guardada en `localStorage`. El usuario la ingresa una vez en ⚙ Ajustes.

---

### 4.3 Telegram Bot — Cloudflare Worker #2

**Archivo:** `TelegramBot/worker.js`
**Patrón:** Webhook + State Machine

**Máquina de estados:**
```
/sesion
   │
   ├─ [No operé] → MOTIVO → saveSession() → FIN
   │
   └─ [Sí operé] → CONTEXTO → CORRIDA → VELAS → RETROCESO
                                                      │
                              FIN ← REFLEXION ← CHECKLIST ← SETUP ← ZONAS_CONTRA
```

**Estado en KV:**
```json
Key:   "s:{chatId}"
Value: { "step": "VELAS", "data": { "sesion_date": "2026-05-15", "contexto": "Lateral", ... } }
TTL:   3600s
```

**Upsert a Supabase:**
```
POST /rest/v1/sesiones
Prefer: resolution=merge-duplicates   ← idempotente por UNIQUE(sesion_date)
```

**Zona horaria:** `env.TIMEZONE` → `Intl.DateTimeFormat` → fecha local correcta.

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
| `commission` | numeric | 0 (no disponible en Indicator) |
| `mae` / `mfe` | numeric | C# via High/Low barras |
| `bars` | integer | C# Δminutos |
| `trade_date` | date | C# |
| `resultado` | text | `target` / `stop` / `otro` |
| `cum_net_profit` | numeric | **Trigger PostgreSQL** |

**Trigger `trg_cum_net_profit`:**
```sql
BEFORE INSERT → NEW.cum_net_profit = SUM(profit WHERE entry_time < NEW.entry_time) + NEW.profit
```

### Tabla `sesiones` — Datos manuales del trader

Campos clave: `sesion_date UNIQUE`, `contexto`, `num_corrida`, `velas_corrida`,
`puntos_retroceso`, `zonas_contra`, `setup`, `chk_zonas/orden/5velas/noticias/consecucion/estructura`,
`analisis_trader`, `resumen_ia`, `imagen_url`, `no_opero`, `motivo_no_opero`

### Permisos
```sql
RLS:   DISABLED  (proyecto personal, un solo usuario)
GRANT: INSERT / SELECT / UPDATE ON trades, sesiones TO anon
GRANT: USAGE, SELECT ON SEQUENCE trades_id_seq, sesiones_id_seq TO anon
```

---

## 6. Seguridad

| Vector | Mitigación |
|---|---|
| Anon key Supabase en browser | Repo privado + cargada desde `config.js` (no versionado público) |
| API key Claude | `localStorage` del browser, nunca en código fuente |
| Anon key en C# binary | Compilado localmente, no en repo público |
| Telegram bot | `ALLOWED_CHAT_ID` hardcodeado — bot ignora cualquier otro chat |
| Cloudflare Workers | HTTPS forzado, variables como secrets cifrados |
| RLS deshabilitado | Aceptable — proyecto personal, sin múltiples usuarios |

---

## 7. Despliegue

| Componente | Mecanismo | Trigger |
|---|---|---|
| Dashboard web | `git push → main` | GitHub Pages auto-deploy |
| Cloudflare Worker #1 (proxy) | Cloudflare Dashboard / Wrangler | Manual |
| Cloudflare Worker #2 (bot) | Cloudflare Dashboard / Wrangler | Manual |
| Indicador NT8 | Copiar `.cs` → compilar en NinjaScript Editor | Manual |
| Base de datos | Migraciones SQL manuales en Supabase SQL Editor | Manual |

---

## 8. Estructura del Repositorio

```
trading-journal/
├── index.html                  ← Shell SPA
├── favicon.svg
├── css/
│   └── styles.css              ← Dark mode completo
├── js/
│   ├── config.js               ← Credenciales (no público)
│   ├── db.js                   ← Capa de datos
│   ├── calendar.js
│   ├── metrics.js
│   ├── table.js
│   ├── form.js
│   ├── charts.js
│   └── app.js
├── NinjaTrader/
│   └── SupabaseAutoExport.cs   ← Indicador C#
├── TelegramBot/
│   ├── worker.js               ← Cloudflare Worker bot
│   └── wrangler.toml           ← Config KV binding
├── docs/
│   ├── arquitectura-tecnica.md
│   └── arquitectura-funcional.md
├── PROGRESS.md                 ← Estado del proyecto
└── TRADING_JOURNAL_PROJECT.md  ← Especificación original
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
| Anthropic Claude | Pay-per-use | — | ~10 resúmenes/mes | ~$0.004 |
| **Total mensual** | | | | **< $0.01** |
