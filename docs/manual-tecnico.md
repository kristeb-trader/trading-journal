# Manual Técnico — Trading Journal NQ Futures

> **Este documento es editable — actualizalo ante cualquier cambio en el sistema.**

**Versión:** 3.0 | **Fecha:** 2026-05-26 | **Audiencia:** Desarrollador / DevOps

---

## Tabla de Contenidos

1. [Descripción y Principios de Diseño](#1-descripción-y-principios-de-diseño)
2. [Arquitectura General](#2-arquitectura-general)
3. [Stack Tecnológico](#3-stack-tecnológico)
4. [Estructura del Repositorio](#4-estructura-del-repositorio)
5. [Configuración Inicial Completa](#5-configuración-inicial-completa)
   - 5a. [Supabase](#5a-supabase)
   - 5b. [GitHub Pages](#5b-github-pages)
   - 5c. [Cloudflare Worker #1 — Proxy Claude](#5c-cloudflare-worker-1--proxy-claude)
   - 5d. [Cloudflare Worker #2 — Bot Telegram](#5d-cloudflare-worker-2--bot-telegram)
   - 5e. [NinjaTrader 8](#5e-ninjatrader-8)
   - 5f. [Cloudinary](#5f-cloudinary)
6. [Esquema de Base de Datos](#6-esquema-de-base-de-datos)
7. [Variables de Entorno y Credenciales](#7-variables-de-entorno-y-credenciales)
8. [Guía de Cambios Comunes](#8-guía-de-cambios-comunes)
9. [Troubleshooting](#9-troubleshooting)
10. [Costos Operativos](#10-costos-operativos)
11. [Historial de Versiones](#11-historial-de-versiones)

---

## 1. Descripción y Principios de Diseño

**Trading Journal NQ Futures** es un diario de trading personal para futuros NQ/MNQ (timeframe 1 minuto), 100% serverless y cloud-native con costo operativo aproximado de $0/mes dentro de los límites de los planes gratuitos. Incluye PWA instalable en dispositivos móviles con actualizaciones automáticas vía estrategia network-first.

### Principios fundamentales

| Principio | Implementación |
|---|---|
| **Cero infraestructura propia** | No hay servidores, contenedores ni VMs. Todo corre en plataformas PaaS/FaaS. |
| **3 canales de entrada de datos** | NinjaTrader 8 (automático), Dashboard web (manual), Telegram Bot (móvil). |
| **Single user** | Sin autenticación multi-usuario. RLS deshabilitado en trades/sesiones. `ALLOWED_CHAT_ID` en el bot. |
| **Separación de secretos** | `config.js` no versionado públicamente. API keys en variables de entorno de CF Workers. |
| **Costo ~$0/mes** | Supabase Free, GitHub Pages gratis, Cloudflare Workers free tier, Cloudinary free tier. |

---

## 2. Arquitectura General

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENTES                                │
│                                                                 │
│  NinjaTrader 8 (C#)   Dashboard Web (Browser/PWA)  Telegram App │
│  SupabaseAutoExport   index.html + JS Vanilla    Mobile/Desktop │
└──────────┬───────────────────┬──────────────────────┬──────────┘
           │ HTTP POST          │ REST API             │ HTTPS
           │ (fusión ATM 3s)   │                      │
           ▼                   ▼                      ▼
┌──────────────────┐  ┌───────────────────┐  ┌──────────────────────┐
│  Supabase        │  │ CF Worker #1      │  │ CF Worker #2         │
│  PostgreSQL 15   │  │ "broad-hall-c53f" │  │ "trading-journal-bot"│
│  REST API        │◄─│ Proxy Claude API  │  │ Telegram Webhook     │
│  (PostgREST)     │  │ CORS bypass       │  │ State Machine (KV)   │
│                  │  └────────┬──────────┘  └──────────┬───────────┘
│  Table: trades   │           │                        │
│  Table: sesiones │  ┌────────▼──────────┐            │
│  Table: fomc_    │  │  Anthropic API    │   ┌────────▼──────────┐
│        dates     │◄─│  claude-haiku-4-5 │   │ Cloudflare KV     │
│  Table: catalogo │  │  -20251001        │   │ Session state     │
│  _casuisticas    │  └───────────────────┘   │ TTL: 3600s        │
│                  │                          └───────────────────┘
│  Trigger:        │
│  cum_net_profit  │
└──────────────────┘
         ▲
         │ Upload URL
┌────────┴───────────┐
│  Cloudinary        │
│  Image Upload+CDN  │
└────────────────────┘
         ▲
         │ Upload from browser + SW v3 (network-first)
┌────────┴───────────┐
│  GitHub Pages      │
│  (Static hosting)  │
│  index.html + JS   │
│  + manifest.json   │
│  + sw.js (PWA)     │
└────────────────────┘
```

**Flujo de datos — trade automático (NT8):**
1. NT8 detecta cierre de posición via `Account.ExecutionUpdate`
2. C# acumula durante 3 segundos (ventana de fusión ATM) si hay múltiples contratos
3. C# calcula profit, MAE, MFE, bars, commission (leída de `ex.Commission`)
4. HTTP POST directo a `https://jothoslozctflfrnysrx.supabase.co/rest/v1/trades`
5. Trigger PostgreSQL calcula `cum_net_profit` antes del INSERT
6. El Worker #2 (bot) envía notificación Telegram con botón inline "📝 Registrar sesión del día"

**Flujo de datos — sesión diaria (Telegram v3.0):**
1. Usuario presiona botón inline desde notificación de trade (o escribe `/sesion`)
2. CF Worker #2 gestiona state machine en KV (`s:{chatId}`)
3. Flujo: OPERO → CONTEXTO (lista) → CORRIDA → VELAS → ZONAS_CONTRA → SETUP (lista) → CHECKLIST → REFLEXION
4. Al completar, upsert en `sesiones` vía Supabase REST API + resumen completo al usuario

**Flujo de datos — resumen IA (v3.0 enriquecido):**
1. `form.js` ejecuta 5 fetches en paralelo (trades hoy, casuísticas hoy, trades del mes, todas las sesiones, todas las casuísticas)
2. Construye prompt con contexto mensual completo + sesión de hoy
3. POST al CF Worker #1 con `model: 'claude-haiku-4-5-20251001'` y `max_tokens: 400`
4. Recibe análisis en 4 secciones estructuradas
5. Guarda `resumen_ia` en la sesión de Supabase

---

## 3. Stack Tecnológico

| Componente | Tecnología | Versión / Plan | Rol |
|---|---|---|---|
| Base de datos | Supabase (PostgreSQL) | PostgreSQL 15, Free tier | Almacenamiento persistente |
| Frontend | HTML + JS Vanilla | ES2022, sin bundler | Dashboard web SPA + PWA |
| PWA | `sw.js` (nqjournal-v3) | Service Worker API | Network-first para app shell, cache-first para CDN |
| Hosting web | GitHub Pages | Gratis (repo privado con Pages) | Sirve el frontend estático |
| Proxy IA | Cloudflare Worker #1 | Workers Free (100k req/día) | Bypass CORS para llamadas a Anthropic |
| Bot Telegram | Cloudflare Worker #2 | Workers Free | Webhook Telegram + state machine |
| KV Sessions | Cloudflare KV | Free (100k reads/día) | Estado de sesión del bot (TTL 3600s) |
| IA / Resúmenes | Anthropic Claude | claude-haiku-4-5-20251001 | Coach estricto con contexto mensual completo |
| Imágenes | Cloudinary | Free tier | Upload + CDN de capturas de pantalla |
| Indicador | C# .NET 4.8 | NinjaTrader 8 (8.1.7.0) | Exportación automática de trades a Supabase |

---

## 4. Estructura del Repositorio

```
trading-journal/
├── index.html                  ← Punto de entrada SPA + sección-annual
├── favicon.svg
├── manifest.json               ← PWA manifest (nombre, iconos, theme color)
├── sw.js                       ← Service Worker v3 (nqjournal-v3)
│                                  network-first: app shell
│                                  cache-first: CDN (Tabler, Supabase JS, Chart.js)
│                                  network-only: supabase.co, cloudinary.com, workers.dev
├── icons/                      ← Iconos PWA
│   ├── icon-192.png
│   └── icon-512.png
├── css/
│   └── styles.css              ← Estilos globales + annual dashboard
├── js/
│   ├── config.js               ← SECRETOS (no versionado públicamente)
│   ├── db.js                   ← Capa de datos: queries a Supabase REST
│   │                              Incluye: getCatalogoCasuisticas(), updateCasuisticaOrden()
│   ├── calendar.js             ← Vista de calendario mensual
│   ├── metrics.js              ← Cálculo de métricas y KPIs
│   ├── table.js                ← Tabla de trades con filtros
│   ├── form.js                 ← Formulario + coach IA (contexto mensual, 4 secciones)
│   ├── charts.js               ← 6 gráficas Chart.js
│   ├── gallery.js              ← Galería de imágenes por semana con lightbox
│   ├── data.js                 ← Casuísticas: catálogo con drag-and-drop para reordenar
│   ├── annual.js               ← NUEVO: Dashboard anual (KPI strip, charts, tabla mensual)
│   └── app.js                  ← Orquestador principal, router (7 secciones)
├── NinjaTrader/
│   └── SupabaseAutoExport.cs   ← Indicador C# para NT8
├── TelegramBot/
│   ├── worker.js               ← CF Worker #2 (bot Telegram sin RETROCESO)
│   └── wrangler.toml           ← Config Wrangler (KV binding, name, TIMEZONE)
└── docs/
    ├── manual-tecnico.md       ← Este archivo
    ├── manual-usuario.md
    ├── arquitectura-tecnica.md
    └── arquitectura-funcional.md
```

> `config.js` debe estar en `.gitignore`. Contiene credenciales de Supabase y Cloudinary.

---

## 5. Configuración Inicial Completa

### 5a. Supabase

**Crear proyecto:**
1. Ir a [supabase.com](https://supabase.com) → New Project
2. Nombre: `trading-journal` | Region: `South America (São Paulo)` | Password: (guardar)
3. Project URL: `https://jothoslozctflfrnysrx.supabase.co`

**Crear tablas — SQL Editor:**

```sql
-- Tabla de trades (exportados desde NT8)
CREATE TABLE trades (
  id              bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  instrument      text,
  account         text,
  market_pos      text,            -- 'Long' | 'Short'
  qty             integer,
  entry_price     numeric,
  exit_price      numeric,
  entry_time      timestamptz,
  exit_time       timestamptz,
  entry_name      text,
  exit_name       text,
  profit          numeric,
  commission      numeric DEFAULT 0,
  mae             numeric,
  mfe             numeric,
  bars            integer,
  trade_date      date,
  resultado       text,            -- 'target' | 'stop' | 'be' | 'otro'
  cum_net_profit  numeric
);

-- Tabla de sesiones diarias
CREATE TABLE sesiones (
  id                  bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  sesion_date         date UNIQUE,
  no_opero            boolean DEFAULT false,
  motivo_no_opero     text,
  contexto            text,
  num_corrida         integer,
  velas_corrida       integer,
  puntos_retroceso    numeric,     -- Mantenido por compatibilidad; ya no lo solicita el bot
  zonas_contra        boolean,
  setup               text,
  chk_zonas           boolean DEFAULT false,
  chk_orden           boolean DEFAULT false,
  chk_5velas          boolean DEFAULT false,
  chk_noticias        boolean DEFAULT false,
  chk_consecucion     boolean DEFAULT false,
  chk_estructura      boolean DEFAULT false,
  analisis_trader     text,
  resumen_ia          text,
  imagen_url          text,
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);

-- Tabla de fechas FOMC
CREATE TABLE fomc_dates (
  date        DATE PRIMARY KEY,
  description TEXT DEFAULT 'FOMC Meeting'
);

-- Catálogo de casuísticas con orden para drag-and-drop (NUEVO v3.0)
CREATE TABLE catalogo_casuisticas (
  id     bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre text NOT NULL,
  orden  integer DEFAULT 0
);
```

**Trigger cum_net_profit:**

```sql
CREATE OR REPLACE FUNCTION calc_cum_net_profit()
RETURNS TRIGGER AS $$
BEGIN
  NEW.cum_net_profit := (
    SELECT COALESCE(SUM(profit), 0)
    FROM trades
    WHERE entry_time < NEW.entry_time
  ) + NEW.profit;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_cum_net_profit
BEFORE INSERT ON trades
FOR EACH ROW EXECUTE FUNCTION calc_cum_net_profit();
```

**Permisos:**

```sql
-- Deshabilitar RLS en trades y sesiones (proyecto personal)
ALTER TABLE trades DISABLE ROW LEVEL SECURITY;
ALTER TABLE sesiones DISABLE ROW LEVEL SECURITY;

-- Habilitar RLS en fomc_dates (read-only público)
ALTER TABLE fomc_dates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fomc_dates_read_public" ON fomc_dates
  FOR SELECT TO anon USING (true);

-- Habilitar RLS en catalogo_casuisticas (read + update orden)
ALTER TABLE catalogo_casuisticas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "casuisticas_read" ON catalogo_casuisticas
  FOR SELECT TO anon USING (true);
CREATE POLICY "casuisticas_update" ON catalogo_casuisticas
  FOR UPDATE TO anon USING (true);

-- Permisos para el rol anon
GRANT INSERT, SELECT, UPDATE ON trades, sesiones TO anon;
GRANT USAGE, SELECT ON SEQUENCE trades_id_seq, sesiones_id_seq TO anon;
GRANT SELECT ON fomc_dates TO anon;
GRANT SELECT, UPDATE ON catalogo_casuisticas TO anon;
```

**Pre-poblar fomc_dates (2025-2026):**

```sql
INSERT INTO fomc_dates (date, description) VALUES
  ('2025-01-29', 'FOMC Meeting'),
  ('2025-03-19', 'FOMC Meeting'),
  ('2025-05-07', 'FOMC Meeting'),
  ('2025-06-18', 'FOMC Meeting'),
  ('2025-07-30', 'FOMC Meeting'),
  ('2025-09-17', 'FOMC Meeting'),
  ('2025-10-29', 'FOMC Meeting'),
  ('2025-12-10', 'FOMC Meeting'),
  ('2026-01-28', 'FOMC Meeting'),
  ('2026-03-18', 'FOMC Meeting'),
  ('2026-04-29', 'FOMC Meeting'),
  ('2026-06-17', 'FOMC Meeting'),
  ('2026-07-29', 'FOMC Meeting'),
  ('2026-09-16', 'FOMC Meeting'),
  ('2026-10-28', 'FOMC Meeting'),
  ('2026-12-09', 'FOMC Meeting');
```

**Recargar schema PostgREST tras cambios DDL:**

```sql
NOTIFY pgrst, 'reload schema';
```

---

### 5b. GitHub Pages

**Setup del repositorio:**

```bash
git init trading-journal
cd trading-journal
git remote add origin https://github.com/<user>/trading-journal.git
git push -u origin main
```

**Activar GitHub Pages:**
- Settings → Pages → Source: `Deploy from a branch` → Branch: `main` / `/ (root)`

**Estructura de `js/config.js` (NO versionado):**

```javascript
// js/config.js — NO incluir en git (agregar a .gitignore)
const CONFIG = {
  SUPABASE_URL: 'https://jothoslozctflfrnysrx.supabase.co',
  SUPABASE_ANON_KEY: '<anon-key-de-supabase>',
  CLOUDINARY_CLOUD_NAME: '<cloud-name>',
  CLOUDINARY_UPLOAD_PRESET: '<upload-preset-unsigned>'
};
```

**`.gitignore` mínimo:**

```
js/config.js
*.env
.env.local
```

**Despliegue:**

```bash
git add .
git commit -m "feat: descripcion del cambio"
git push origin main
# GitHub Pages auto-despliega en ~1 minuto
# PWA se actualiza automáticamente en el próximo acceso (network-first SW)
```

**Forzar actualización de PWA en iPhone (solo cuando el SW cambia):**
1. Abrir Safari → navegar a la URL
2. Forzar reload (mantener el botón de reload)
3. Volver al ícono en pantalla de inicio

---

### 5c. Cloudflare Worker #1 — Proxy Claude

**Propósito:** El browser no puede llamar a `api.anthropic.com` directamente por CORS. Este Worker recibe la petición del frontend y la reenvía a Anthropic con la API key.

**Nombre del Worker:** `broad-hall-c53f`

**Código esencial del Worker (`worker.js`):**

```javascript
export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      });
    }

    const body = await request.json();

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      }
    });
  }
};
```

**Variables de entorno (Cloudflare Dashboard → Worker → Settings → Variables):**

| Variable | Valor |
|---|---|
| `ANTHROPIC_API_KEY` | `sk-ant-...` (secret) |

**URL del Worker:** `https://broad-hall-c53f.<account>.workers.dev`

**Uso desde `form.js` (v3.0):**

```javascript
const res = await fetch(CLAUDE_PROXY_URL, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 400,
    messages: [{ role: 'user', content: promptConContextoMensual }]
  })
});
```

---

### 5d. Cloudflare Worker #2 — Bot Telegram

**Nombre del Worker:** `trading-journal-bot`

**`wrangler.toml`:**

```toml
name = "trading-journal-bot"
main = "worker.js"
compatibility_date = "2024-01-01"

[[kv_namespaces]]
binding = "KV"
id = "3dd631773a6041c1a97a8e9a8f861067"

[vars]
TIMEZONE = "America/Bogota"
```

**Secrets:**

| Secret | Valor |
|---|---|
| `BOT_TOKEN` | Token de @BotFather |
| `SUPABASE_URL` | `https://jothoslozctflfrnysrx.supabase.co` |
| `SUPABASE_KEY` | Anon key de Supabase |
| `ALLOWED_CHAT_ID` | `372127764` |

**State Machine v3.0 (sin paso RETROCESO):**

```
Botón inline de notificación (callback 'iniciar_sesion')
  OR  /sesion  OR  /start
    │
    ▼
OPERO (¿Operaste hoy? Sí/No)
    ├─ No → MOTIVO → [upsert sesión con no_opero=true] → FIN
    └─ Sí →
         CONTEXTO (lista botones: Alcista fuerte | Alcista | Mixto | Bajista | Bajista fuerte)
             → CORRIDA (1ª / 2ª / 3ª corrida)
             → VELAS (número — texto libre)
             → ZONAS_CONTRA (Sí / No)
             → SETUP (lista botones 6 setups, 2 por fila)
             → CHECKLIST (6 checkboxes)
             → REFLEXION ("Análisis del día" — texto libre)
             → [upsert sesión completa] → resumen completo → FIN
```

**Pasos eliminados vs v2.1:** `RETROCESO` (puntos de retroceso).

**Función `startSesionFlow(chatId, token, kv, env)`:**
Función reutilizable que inicia el flujo tanto para `/sesion` como para el callback de la notificación. Garantiza que funciona incluso sin estado KV previo.

**Setups disponibles:**
```javascript
const SETUPS = [
  'IRI Apertura Alcista', 'IRI Apertura Bajista',
  'IRI Continuación Alcista', 'IRI Continuación Bajista',
  'Reingreso Alcista', 'Reingreso Bajista'
]
```

**Botón inline en notificación de trade (handleNotify):**
```javascript
reply_markup: {
  inline_keyboard: [[
    { text: '📝 Registrar sesión del día', callback_data: 'iniciar_sesion' }
  ]]
}
```

**handleCallback:** procesa `'iniciar_sesion'` antes de cualquier verificación de estado KV, para que funcione sin sesión previa.

**Patrón KV para estado de sesión:**

```javascript
await env.KV.put(`s:${chatId}`, JSON.stringify({ step, data }), { expirationTtl: 3600 });
const raw = await env.KV.get(`s:${chatId}`);
const session = raw ? JSON.parse(raw) : { step: 'OPERO', data: {} };
await env.KV.delete(`s:${chatId}`);
```

**Upsert a Supabase (merge-duplicates por sesion_date):**

```javascript
const res = await fetch(`${env.SUPABASE_URL}/rest/v1/sesiones`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': env.SUPABASE_KEY,
    'Authorization': `Bearer ${env.SUPABASE_KEY}`,
    'Prefer': 'resolution=merge-duplicates'
  },
  body: JSON.stringify({ sesion_date: today, ...sessionData })
});
```

**Registrar webhook de Telegram:**

```bash
curl -X POST "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://trading-journal-bot.<account>.workers.dev"}'
```

**Despliegue:** Desde Cloudflare Dashboard → Worker → Quick Edit (pegar código) → Save & Deploy.
> Si Wrangler no está disponible localmente, usar siempre Cloudflare Dashboard.

---

### 5e. NinjaTrader 8

**Instalación del indicador:**

1. Copiar `NinjaTrader/SupabaseAutoExport.cs` a:
   ```
   %USERPROFILE%\Documents\NinjaTrader 8\bin\Custom\Indicators\
   ```
2. En NT8: Tools → Edit NinjaScript → Compile (o F5 en el editor)
3. Agregar al chart: Indicators → `SupabaseAutoExport`

**Credenciales hardcodeadas en el indicador:**

```csharp
private const string SUPABASE_ENDPOINT =
    "https://jothoslozctflfrnysrx.supabase.co/rest/v1/trades";
private const string SUPABASE_KEY = "<anon-key-de-supabase>";
```

**Ventana de fusión ATM (3 segundos) — lógica central:**

```csharp
private bool hasPending = false;
private object mergeLock = new object();
private System.Threading.Timer mergeTimer;
private double pendingCommission = 0;
private List<TradeData> pendingTrades = new List<TradeData>();

private void OnExecutionUpdate(object sender, ExecutionEventArgs e) {
    lock (mergeLock) {
        double commission = e.Execution.Commission;
        if (!hasPending) {
            hasPending = true;
            pendingTrades.Add(BuildTradeData(e, commission));
            mergeTimer = new System.Threading.Timer(_ => {
                lock (mergeLock) {
                    PublishMergedTrade(pendingTrades);
                    hasPending = false;
                    pendingTrades.Clear();
                }
            }, null, 3000, System.Threading.Timeout.Infinite);
        } else {
            pendingTrades.Add(BuildTradeData(e, commission));
        }
    }
}
```

---

### 5f. Cloudinary

1. Registro en [cloudinary.com](https://cloudinary.com) (Free tier)
2. Dashboard → Settings → Upload → Add upload preset
   - Signing mode: **Unsigned**
   - Folder: `trading-journal/`

---

## 6. Esquema de Base de Datos

### Tabla `trades`

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | bigint PK | Auto generado |
| `instrument` | text | Ej: `NQ 03-25`, `MNQ 03-25` |
| `account` | text | Nombre de cuenta en NT8 |
| `market_pos` | text | `Long` o `Short` |
| `qty` | integer | Contratos operados |
| `entry_price` / `exit_price` | numeric | Precios (promedio ponderado en ATM) |
| `entry_time` / `exit_time` | timestamptz | Timestamps con timezone |
| `entry_name` / `exit_name` | text | Nombres de órdenes NT8 |
| `profit` | numeric | P&L en USD (suma en ATM) |
| `commission` | numeric | Comisión real de NT8 `ex.Commission` |
| `mae` / `mfe` | numeric | Max Adverse/Favorable Excursion |
| `bars` | integer | Duración en minutos |
| `trade_date` | date | Para joins con sesiones |
| `resultado` | text | `target`, `stop`, `be` (±$6), `otro` |
| `cum_net_profit` | numeric | Calculado por trigger BEFORE INSERT |

### Tabla `sesiones`

| Columna | Tipo | Descripción |
|---|---|---|
| `sesion_date` | date UNIQUE | Clave natural (una sesión por día) |
| `no_opero` | boolean | Marcador de día sin operaciones |
| `motivo_no_opero` | text | Motivo si `no_opero = true` |
| `contexto` | text | Contexto de mercado del día |
| `num_corrida` | integer | 1, 2 o 3 |
| `velas_corrida` | integer | Velas de la corrida principal |
| `puntos_retroceso` | numeric | Mantenido por compatibilidad histórica |
| `zonas_contra` | boolean | ¿Había zonas en contra? |
| `setup` | text | Setup del día (ej: "IRI Apertura Alcista") |
| `chk_zonas` … `chk_estructura` | boolean | 6 ítems del checklist |
| `analisis_trader` | text | Análisis libre del trader |
| `resumen_ia` | text | Resumen generado por Claude (4 secciones) |
| `imagen_url` | text | URL HTTPS de Cloudinary |

### Tabla `fomc_dates`

| Columna | Tipo | Descripción |
|---|---|---|
| `date` | date PK | Fecha de la reunión FOMC |
| `description` | text | `'FOMC Meeting'` |

RLS habilitado — solo lectura pública.

### Tabla `catalogo_casuisticas` (NUEVA v3.0)

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | bigint PK | Auto generado |
| `nombre` | text | Nombre del error tipificable |
| `orden` | integer | Posición en el listado (drag-and-drop) |

RLS habilitado — lectura y actualización de `orden` vía anon.

### Funciones en `db.js`

| Función | Descripción |
|---|---|
| `getFomcDates(year, month)` | Fechas FOMC del mes/año |
| `getSessionsWithImages()` | Sesiones con `imagen_url` no null (galería) |
| `getCasuisticasByMonth(year, month)` | Casuísticas del mes |
| `getAllCasuisticas()` | Todas las casuísticas con `casuistica` y `sesion_date` |
| `getCatalogoCasuisticas()` | Catálogo ordenado por `orden ASC` |
| `updateCasuisticaOrden(id, orden)` | Actualiza el orden de una casuística (drag-and-drop) |

---

## 7. Variables de Entorno y Credenciales

| Variable | Componente | Tipo | Valor / Ubicación |
|---|---|---|---|
| `SUPABASE_URL` | Frontend, Bot, C# | URL | `https://jothoslozctflfrnysrx.supabase.co` |
| `SUPABASE_ANON_KEY` | Frontend (`config.js`) | Secret | Supabase Dashboard → Settings → API |
| `SUPABASE_KEY` | Bot (CF Worker #2 secret) | Secret | Mismo valor que anon key |
| `SUPABASE_KEY` | C# indicador (hardcoded) | Secret | Mismo valor que anon key |
| `ANTHROPIC_API_KEY` | CF Worker #1 (secret) | Secret | console.anthropic.com |
| `CLOUDINARY_CLOUD_NAME` | Frontend (`config.js`) | Config | Cloudinary Dashboard |
| `CLOUDINARY_UPLOAD_PRESET` | Frontend (`config.js`) | Config | Cloudinary Dashboard → Upload presets |
| `BOT_TOKEN` | CF Worker #2 (secret) | Secret | @BotFather en Telegram |
| `ALLOWED_CHAT_ID` | CF Worker #2 (secret) | Config | `372127764` |
| `TIMEZONE` | CF Worker #2 (`wrangler.toml` var) | Config | `America/Bogota` |
| KV Namespace ID | CF Worker #2 (`wrangler.toml`) | Config | `3dd631773a6041c1a97a8e9a8f861067` |

---

## 8. Guía de Cambios Comunes

### Añadir una nueva columna a `trades` o `sesiones`

```sql
ALTER TABLE trades ADD COLUMN nueva_columna text;
NOTIFY pgrst, 'reload schema';
```

Luego actualizar: `db.js`, `SupabaseAutoExport.cs` (recompilar), `TelegramBot/worker.js`.

### Cambiar el modelo de IA

En `form.js`, buscar y modificar:
```javascript
model: 'claude-haiku-4-5-20251001'
```
No hay cambios en CF Worker #1 (es proxy genérico).

### Modificar el prompt del coach IA

En `form.js`, función `generateAI()`. El prompt incluye:
- Instrucción inicial (coach estricto)
- Bloque `═══ CONTEXTO DEL MES ═══`
- Bloque `═══ SESIÓN DE HOY ═══`
- Bloque `═══ INSTRUCCIONES ═══` (4 secciones fijas, máx 120 palabras)

### Agregar un setup al bot Telegram

En `TelegramBot/worker.js`, modificar el array `SETUPS`:
```javascript
const SETUPS = [
  'IRI Apertura Alcista', 'IRI Apertura Bajista',
  // ... agregar aquí ...
]
```
Redesplegar desde Cloudflare Dashboard.

### Agregar un paso al flujo del bot Telegram

En `TelegramBot/worker.js`:
1. Agregar el nuevo `step` al objeto `STEPS`
2. Añadir el `case` correspondiente en el handler
3. Actualizar la transición del paso anterior
4. Redesplegar desde Cloudflare Dashboard

### Actualizar la estrategia del Service Worker

En `sw.js`:
1. Incrementar la versión de caché: `const CACHE = 'nqjournal-v4'`
2. Agregar/quitar URLs en `APP_SHELL` o `CDN_SHELL` según corresponda
3. Los hosts en `NETWORK_ONLY_HOSTS` nunca se interceptan

> Al cambiar la versión, el `activate` elimina automáticamente cachés anteriores.

### Agregar fechas FOMC

```sql
INSERT INTO fomc_dates (date, description) VALUES
  ('2027-01-27', 'FOMC Meeting');
NOTIFY pgrst, 'reload schema';
```

### Rotar la clave de Supabase

1. Supabase Dashboard → Settings → API → Rotate keys
2. Actualizar en: `js/config.js`, CF Worker #2 secret, `SupabaseAutoExport.cs` (recompilar)

### Resetear el estado de una sesión de bot atascada

```bash
wrangler kv:key delete --namespace-id 3dd631773a6041c1a97a8e9a8f861067 "s:372127764"
```
O desde Cloudflare Dashboard → KV → buscar key `s:372127764` → Delete.

---

## 9. Troubleshooting

### El indicador NT8 no exporta trades

| Síntoma | Causa probable | Solución |
|---|---|---|
| No aparece nada en Output Window | Indicador no está en el chart correcto | Verificar que esté en el chart del instrumento activo |
| Error 401 en Output Window | `SUPABASE_KEY` incorrecto | Verificar constante en .cs y recompilar |
| Trades duplicados con ATM | Indicador pre-v2.1 | Actualizar al indicador v2.1+ con fusión de 3s |
| `commission` siempre es 0 | Indicador pre-v2.1 | Actualizar a v2.1 que lee `ex.Commission` |

### El bot de Telegram no responde

| Síntoma | Causa probable | Solución |
|---|---|---|
| Bot no responde a ningún mensaje | Webhook no registrado o URL incorrecta | Re-ejecutar `setWebhook` con la URL correcta del Worker |
| Responde "Unauthorized" | `ALLOWED_CHAT_ID` no coincide | Verificar chat ID con @userinfobot |
| Botón de notificación no aparece | Worker no desplegado con el nuevo código | Redesplegar desde Cloudflare Dashboard |
| Bot queda sin responder tras un crash | Estado KV corrupto | Borrar key `s:{chatId}` en KV |
| Fecha incorrecta en sesiones | Timezone mal configurado | Verificar `TIMEZONE=America/Bogota` en wrangler.toml |

### El frontend no carga datos

| Síntoma | Causa probable | Solución |
|---|---|---|
| Error 401 desde Supabase | `SUPABASE_ANON_KEY` incorrecto | Copiar key correcta desde Supabase Dashboard |
| Datos vacíos (0 trades) | RLS habilitado por accidente | `ALTER TABLE trades DISABLE ROW LEVEL SECURITY;` |
| Sección Anual no aparece | `annual.js` no cargado | Verificar `<script src="js/annual.js">` antes de `app.js` en index.html |
| Sección Anual no muestra datos | Cuenta no coincide | Verificar que la cuenta en el filtro coincida con trades registrados |
| Rentabilidad muestra "—" | Capital inicial no configurado | Ingresar valor en el campo capital del header del dashboard anual |

### Claude proxy no funciona

| Síntoma | Causa probable | Solución |
|---|---|---|
| Error 403 desde el Worker | `ANTHROPIC_API_KEY` inválida | Rotar en console.anthropic.com y actualizar en CF Worker #1 |
| Timeout | Prompt muy extenso o modelo saturado | El prompt de v3.0 es más largo (contexto mensual); verificar max_tokens=400 |

### PWA no se actualiza en iPhone

| Síntoma | Causa probable | Solución |
|---|---|---|
| App muestra versión vieja | Service Worker cacheó la app anterior | Abrir Safari → navegar a la URL → forzar reload → volver al ícono |
| Nunca recibe actualizaciones | Estrategia cache-first (versión antigua) | Verificar que `sw.js` use network-first para APP_SHELL y la versión sea `nqjournal-v3` |

---

## 10. Costos Operativos

| Servicio | Plan | Límite gratuito | Uso estimado/mes | Costo |
|---|---|---|---|---|
| Supabase | Free | 500 MB DB, 5 GB transfer | <10 MB | $0 |
| GitHub Pages | Free | 1 GB repo, 100 GB transfer | Negligible | $0 |
| Cloudflare Workers | Free | 100,000 req/día | ~300 req/día | $0 |
| Cloudflare KV | Free | 100,000 reads/día | ~100 reads/día | $0 |
| Anthropic API | Pay-per-use | — | ~20 sesiones × $0.0008 | ~$0.016 |
| Cloudinary | Free | 25 GB storage, 25 GB BW | <100 MB | $0 |
| **TOTAL** | | | | **~$0.02/mes** |

**Modelo de IA:** `claude-haiku-4-5-20251001`
- Input: $0.80 / MTok
- Output: $4.00 / MTok
- Costo por resumen v3.0 (~2000 tokens in + ~400 tokens out): ~$0.0008

> El costo por resumen duplicó respecto a v2.1 porque el prompt v3.0 incluye contexto mensual completo. Sigue siendo despreciable (~$0.02/mes con 20 sesiones).

---

## 11. Historial de Versiones

| Versión | Fecha | Autor | Descripción |
|---|---|---|---|
| 1.0 | 2026-05-15 | kristeb-trader | Versión inicial del manual técnico |
| 2.1 | 2026-05-20 | kristeb-trader | Galería de imágenes (`gallery.js`); tabla `fomc_dates`; festivos CME automáticos; disciplina 7 factores clickable; error frecuente desde casuísticas; pestaña Imagen primera en modal; motivo "Festivo" en formulario; fusión ATM 3s; comisión real `ex.Commission`; nuevas funciones `db.js` |
| 3.0 | 2026-05-26 | kristeb-trader | **Dashboard Anual** (`annual.js`): KPI strip 8 métricas, equity curve, barras P&L mensual, tabla mensual con account filter (PA-APEX default), capital inicial en localStorage, totals row coloreados. **Bot Telegram**: botón automático desde notificación de trade, contexto como lista de 5 opciones, paso RETROCESO eliminado, setup como lista de 6 opciones (2 por fila), resumen completo tras guardar, "Análisis del día" (renombrado de "Reflexión"). **Coach IA**: prompt enriquecido con contexto mensual (5 fetches paralelos), coach estricto y directo, salida estructurada 4 secciones fijas (máx 120 palabras), max_tokens=400, modelo `claude-haiku-4-5-20251001`. **PWA**: `sw.js` v3 (nqjournal-v3) con network-first para app shell — updates automáticos en iPhone. **Casuísticas**: tabla `catalogo_casuisticas` con columna `orden` para drag-and-drop; `data.js` simplificado; `db.js` con `updateCasuisticaOrden()`. **Break Even**: clasificación ±$6 como `resultado = 'be'`. |

---

*Manual Técnico — Trading Journal NQ Futures | Versión 3.0 | 2026-05-26*
