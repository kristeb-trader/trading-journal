# Manual Técnico — Trading Journal NQ Futures

> **Este documento es editable — actualizalo ante cualquier cambio en el sistema.**

**Versión:** 2.1 | **Fecha:** 2026-05-20 | **Audiencia:** Desarrollador / DevOps

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

**Trading Journal NQ Futures** es un diario de trading personal para futuros NQ/MNQ (timeframe 1 minuto), 100% serverless y cloud-native con costo operativo aproximado de $0/mes dentro de los límites de los planes gratuitos.

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
│  NinjaTrader 8 (C#)   Dashboard Web (Browser)   Telegram App   │
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
│                  │  └───────────────────┘   │ Session state     │
│  Trigger:        │                          │ TTL: 3600s        │
│  cum_net_profit  │                          └───────────────────┘
└──────────────────┘
         ▲
         │ Upload URL
┌────────┴───────────┐
│  Cloudinary        │
│  Image Upload+CDN  │
└────────────────────┘
         ▲
         │ Upload from browser
┌────────┴───────────┐
│  GitHub Pages      │
│  (Static hosting)  │
│  index.html + JS   │
└────────────────────┘
```

**Flujo de datos — trade automático (NT8):**
1. NT8 detecta cierre de posición via `Account.ExecutionUpdate`
2. C# acumula durante 3 segundos (ventana de fusión ATM) si hay múltiples contratos
3. C# calcula profit, MAE, MFE, bars, commission (leída de `ex.Commission`)
4. HTTP POST directo a `https://jothoslozctflfrnysrx.supabase.co/rest/v1/trades`
5. Trigger PostgreSQL calcula `cum_net_profit` antes del INSERT

**Flujo de datos — sesión diaria (Telegram):**
1. Usuario envía `/start` o `/sesion` al bot
2. CF Worker #2 gestiona state machine en KV (`s:{chatId}`)
3. Al completar el flujo, upsert en `sesiones` vía Supabase REST API

---

## 3. Stack Tecnológico

| Componente | Tecnología | Versión / Plan | Rol |
|---|---|---|---|
| Base de datos | Supabase (PostgreSQL) | PostgreSQL 15, Free tier | Almacenamiento persistente de trades, sesiones y fechas FOMC |
| Frontend | HTML + JS Vanilla | ES2022, sin bundler | Dashboard web de análisis y visualización |
| Hosting web | GitHub Pages | Gratis (repo privado con Pages) | Sirve el frontend estático |
| Proxy IA | Cloudflare Worker #1 | Workers Free (100k req/día) | Bypass CORS para llamadas a Anthropic desde browser |
| Bot Telegram | Cloudflare Worker #2 | Workers Free | Webhook Telegram + state machine para registro móvil |
| KV Sessions | Cloudflare KV | Free (100k reads/día) | Estado de sesión del bot (TTL 3600s) |
| IA / Resúmenes | Anthropic Claude | claude-haiku-4-5 | Genera resúmenes de sesiones (~$0.0004 c/u) |
| Imágenes | Cloudinary | Free tier | Upload + CDN de capturas de pantalla |
| Indicador | C# .NET 4.8 | NinjaTrader 8 (8.1.7.0) | Exportación automática de trades a Supabase (con fusión ATM) |

---

## 4. Estructura del Repositorio

```
trading-journal/
├── index.html                  ← Punto de entrada, SPA single-page
├── favicon.svg
├── css/
│   └── styles.css              ← Estilos globales
├── js/
│   ├── config.js               ← SECRETOS (no versionado públicamente)
│   ├── db.js                   ← Capa de datos: queries a Supabase REST
│   ├── calendar.js             ← Vista de calendario mensual (festivos CME, FOMC, iconos)
│   ├── metrics.js              ← Cálculo de métricas y KPIs (disciplina 7 factores)
│   ├── table.js                ← Tabla de trades con filtros
│   ├── form.js                 ← Formulario de sesión diaria
│   ├── charts.js               ← Gráficas (equity curve, distribuciones)
│   ├── gallery.js              ← NUEVO: galería de imágenes por semana con lightbox
│   └── app.js                  ← Orquestador principal, router
├── NinjaTrader/
│   └── SupabaseAutoExport.cs   ← Indicador C# para NT8 (fusión ATM, comisión real)
├── TelegramBot/
│   ├── worker.js               ← Código del CF Worker #2
│   └── wrangler.toml           ← Config Wrangler (KV binding, name)
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
  commission      numeric DEFAULT 0,  -- Leída de ex.Commission en NT8 (v2.1+)
  mae             numeric,         -- Maximum Adverse Excursion
  mfe             numeric,         -- Maximum Favorable Excursion
  bars            integer,         -- Duración en minutos (delta entry→exit)
  trade_date      date,
  resultado       text,            -- 'target' | 'stop' | 'otro'
  cum_net_profit  numeric          -- Calculado por trigger
);

-- Tabla de sesiones diarias
CREATE TABLE sesiones (
  id                  bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  sesion_date         date UNIQUE,
  no_opero            boolean DEFAULT false,
  motivo_no_opero     text,
  contexto            text,        -- Tendencia alcista/bajista/Lateral/Volátil/Sin contexto claro
  num_corrida         integer,     -- 1 | 2 | 3
  velas_corrida       integer,
  puntos_retroceso    numeric,
  zonas_contra        boolean,
  setup               text,
  chk_zonas           boolean DEFAULT false,
  chk_orden           boolean DEFAULT false,
  chk_5velas          boolean DEFAULT false,
  chk_noticias        boolean DEFAULT false,
  chk_consecucion     boolean DEFAULT false,
  chk_estructura      boolean DEFAULT false,
  analisis_trader     text,
  resumen_ia          text,        -- Generado por Claude Haiku
  imagen_url          text,        -- URL de Cloudinary
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);

-- Tabla de fechas FOMC (NUEVA en v2.1)
CREATE TABLE fomc_dates (
  date        DATE PRIMARY KEY,
  description TEXT DEFAULT 'FOMC Meeting'
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

-- Permisos para el rol anon
GRANT INSERT, SELECT, UPDATE ON trades, sesiones TO anon;
GRANT USAGE, SELECT ON SEQUENCE trades_id_seq, sesiones_id_seq TO anon;
GRANT SELECT ON fomc_dates TO anon;
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

**Obtener credenciales:**
- Dashboard → Settings → API
  - `Project URL`: `https://jothoslozctflfrnysrx.supabase.co`
  - `anon/public key`: clave para el frontend y el bot

---

### 5b. GitHub Pages

**Setup del repositorio:**

```bash
git init trading-journal
cd trading-journal
# ... agregar archivos ...
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
# GitHub Actions / Pages auto-despliega en ~1 minuto
```

---

### 5c. Cloudflare Worker #1 — Proxy Claude

**Propósito:** El browser no puede llamar a `api.anthropic.com` directamente por CORS. Este Worker recibe la petición del frontend y la reenvía a Anthropic con la API key.

**Nombre del Worker:** `broad-hall-c53f`

**Código esencial del Worker (`worker.js`):**

```javascript
export default {
  async fetch(request, env) {
    // CORS preflight
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

**Despliegue:**

```bash
# Desde el directorio del worker
wrangler deploy
# o directamente desde Cloudflare Dashboard → Quick Edit
```

**URL del Worker:** `https://broad-hall-c53f.<account>.workers.dev`

**Uso desde el frontend (`db.js` o similar):**

```javascript
const CLAUDE_PROXY_URL = 'https://broad-hall-c53f.<account>.workers.dev';

async function generarResumenIA(textoSesion) {
  const res = await fetch(CLAUDE_PROXY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-haiku-4-5',
      max_tokens: 512,
      messages: [{ role: 'user', content: textoSesion }]
    })
  });
  const data = await res.json();
  return data.content[0].text;
}
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

**Secrets (añadir con Wrangler o Dashboard):**

```bash
wrangler secret put BOT_TOKEN
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_KEY
wrangler secret put ALLOWED_CHAT_ID
```

| Secret | Valor |
|---|---|
| `BOT_TOKEN` | Token de @BotFather |
| `SUPABASE_URL` | `https://jothoslozctflfrnysrx.supabase.co` |
| `SUPABASE_KEY` | Anon key de Supabase |
| `ALLOWED_CHAT_ID` | `372127764` |
| `TIMEZONE` | `America/Bogota` (variable, no secret) |

**State Machine — pasos del flujo:**

```
/start o /sesion
    │
    ▼
OPERO (¿Operaste hoy? Sí/No)
    ├─ No → MOTIVO → [upsert sesión con no_opero=true] → FIN
    └─ Sí →
         CONTEXTO (Tendencia alcista/bajista/Lateral/Volátil/Sin contexto claro)
             → CORRIDA (¿Cuántas corridas? 1/2/3)
             → VELAS (¿Cuántas velas tuvo la corrida?)
             → RETROCESO (¿Puntos de retroceso?)
             → ZONAS_CONTRA (¿Había zonas en contra? Sí/No)
             → SETUP (Descripción del setup)
             → CHECKLIST (6 checkboxes: zonas/orden/5velas/noticias/consecucion/estructura)
             → REFLEXION (Análisis libre del trader)
             → [upsert sesión completa] → FIN
```

**Patrón KV para estado de sesión:**

```javascript
// Guardar estado
await env.KV.put(`s:${chatId}`, JSON.stringify({ step, data }), { expirationTtl: 3600 });

// Leer estado
const raw = await env.KV.get(`s:${chatId}`);
const session = raw ? JSON.parse(raw) : { step: 'OPERO', data: {} };

// Borrar al finalizar
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
  body: JSON.stringify({
    sesion_date: today,   // formato 'YYYY-MM-DD'
    ...sessionData
  })
});
```

**Obtener fecha en zona horaria correcta:**

```javascript
function getTodayBogota(timezone) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(new Date()); // Retorna 'YYYY-MM-DD'
}
```

**Registrar webhook de Telegram:**

```bash
# Reemplazar TOKEN y URL del worker
curl -X POST "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://trading-journal-bot.<account>.workers.dev"}'

# Verificar webhook
curl "https://api.telegram.org/bot<BOT_TOKEN>/getWebhookInfo"
```

**Despliegue:**

```bash
cd TelegramBot/
wrangler deploy
```

---

### 5e. NinjaTrader 8

**Instalación del indicador:**

1. Copiar `NinjaTrader/SupabaseAutoExport.cs` a:
   ```
   %USERPROFILE%\Documents\NinjaTrader 8\bin\Custom\Indicators\
   ```
2. En NT8: Tools → Edit NinjaScript → Compile (o F5 en el editor)
3. Agregar al chart: Indicators → `SupabaseAutoExport`

**Credenciales hardcodeadas en el indicador (`SupabaseAutoExport.cs`):**

```csharp
private const string SUPABASE_ENDPOINT =
    "https://jothoslozctflfrnysrx.supabase.co/rest/v1/trades";
private const string SUPABASE_KEY =
    "<anon-key-de-supabase>";
```

> Para cambiar credenciales, editar las constantes y recompilar en NT8.

**Lógica de captura de trades — suscripción al evento:**

```csharp
protected override void OnStateChange() {
    if (State == State.DataLoaded) {
        Account.ExecutionUpdate += OnExecutionUpdate;
    }
    if (State == State.Terminated) {
        Account.ExecutionUpdate -= OnExecutionUpdate;
    }
}
```

**Ventana de fusión ATM (3 segundos) — lógica central:**

```csharp
// Campos de fusión
private bool hasPending = false;
private object mergeLock = new object();
private System.Threading.Timer mergeTimer;
private double pendingCommission = 0;
private List<TradeData> pendingTrades = new List<TradeData>();

private void OnExecutionUpdate(object sender, ExecutionEventArgs e) {
    lock (mergeLock) {
        double commission = e.Execution.Commission; // ← Leída de NT8

        if (!hasPending) {
            // Primer cierre: iniciar ventana de fusión
            hasPending = true;
            pendingTrades.Add(BuildTradeData(e, commission));
            pendingCommission = commission;

            // Timer de 3 segundos
            mergeTimer = new System.Threading.Timer(_ => {
                lock (mergeLock) {
                    PublishMergedTrade(pendingTrades);
                    hasPending = false;
                    pendingTrades.Clear();
                    pendingCommission = 0;
                }
            }, null, 3000, System.Threading.Timeout.Infinite);
        } else {
            // Cierre adicional dentro de la ventana: acumular
            pendingTrades.Add(BuildTradeData(e, commission));
            pendingCommission += commission;
        }
    }
}

private void PublishMergedTrade(List<TradeData> trades) {
    // Calcular promedios ponderados y sumas
    double totalQty    = trades.Sum(t => t.qty);
    double entryPrice  = trades.Sum(t => t.entry_price * t.qty) / totalQty;
    double exitPrice   = trades.Sum(t => t.exit_price  * t.qty) / totalQty;
    double profit      = trades.Sum(t => t.profit);
    double commission  = trades.Sum(t => t.commission);
    double mae         = trades.Sum(t => t.mae);
    double mfe         = trades.Sum(t => t.mfe);

    // POST único a Supabase
    Task.Run(() => PostTradeToSupabase(new TradeData {
        entry_price = entryPrice,
        exit_price  = exitPrice,
        profit      = profit,
        commission  = commission,
        mae         = mae,
        mfe         = mfe,
        qty         = (int)totalQty,
        // ... resto de campos del primer trade
    }));
}
```

**Tracking MAE/MFE en `OnBarUpdate`:**

```csharp
protected override void OnBarUpdate() {
    if (BarsInProgress != 0 || CurrentBar < 1) return;
    if (!inTrade) return;

    lock (syncLock) {
        if (currentMarketPos == MarketPosition.Long) {
            mfe = Math.Max(mfe, High[0] - entryPrice);
            mae = Math.Min(mae, Low[0]  - entryPrice);
        } else {
            mfe = Math.Max(mfe, entryPrice - Low[0]);
            mae = Math.Min(mae, entryPrice - High[0]);
        }
    }
}
```

**POST a Supabase desde C#:**

```csharp
private async Task PostTradeToSupabase(TradeData trade) {
    using var client = new HttpClient();
    client.DefaultRequestHeaders.Add("apikey", SUPABASE_KEY);
    client.DefaultRequestHeaders.Add("Authorization", $"Bearer {SUPABASE_KEY}");
    client.DefaultRequestHeaders.Add("Prefer", "return=minimal");

    var json = JsonConvert.SerializeObject(trade);
    var content = new StringContent(json, Encoding.UTF8, "application/json");
    var response = await client.PostAsync(SUPABASE_ENDPOINT, content);
    // Log response.StatusCode en Output window de NT8
}
```

**Verificar en NT8:** Tools → Output Window → buscar logs del indicador.

---

### 5f. Cloudinary

**Crear cuenta y configurar:**

1. Registro en [cloudinary.com](https://cloudinary.com) (Free tier: 25 GB storage, 25 GB bandwidth/mes)
2. Dashboard → Settings → Upload → Add upload preset
   - Preset name: `trading_journal` (o el que se use en config.js)
   - Signing mode: **Unsigned** (para upload directo desde browser sin backend)
   - Folder: `trading-journal/` (opcional)

**Credenciales necesarias:**

| Credencial | Dónde encontrarla | Dónde se usa |
|---|---|---|
| `Cloud name` | Dashboard → Settings → Account | `config.js` → `CLOUDINARY_CLOUD_NAME` |
| `Upload preset` | Dashboard → Settings → Upload | `config.js` → `CLOUDINARY_UPLOAD_PRESET` |

**Upload desde el frontend:**

```javascript
async function uploadImage(file) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CONFIG.CLOUDINARY_UPLOAD_PRESET);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CONFIG.CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: 'POST', body: formData }
  );
  const data = await res.json();
  return data.secure_url; // URL HTTPS del CDN
}
```

---

## 6. Esquema de Base de Datos

### Tabla `trades`

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | bigint | PK, auto | ID generado automáticamente |
| `instrument` | text | | Ej: `NQ 03-25`, `MNQ 03-25` |
| `account` | text | | Nombre de la cuenta en NT8 |
| `market_pos` | text | | `Long` o `Short` |
| `qty` | integer | | Contratos operados |
| `entry_price` | numeric | | Precio de entrada (promedio ponderado en fusiones ATM) |
| `exit_price` | numeric | | Precio de salida (promedio ponderado en fusiones ATM) |
| `entry_time` | timestamptz | | Timestamp de entrada (con timezone) |
| `exit_time` | timestamptz | | Timestamp de salida |
| `entry_name` | text | | Nombre de la orden de entrada (NT8) |
| `exit_name` | text | | Nombre de la orden de salida (NT8) |
| `profit` | numeric | | P&L del trade en USD (suma en fusiones ATM) |
| `commission` | numeric | DEFAULT 0 | Comisión real leída de `ex.Commission` en NT8 (suma en fusiones ATM) |
| `mae` | numeric | | Max Adverse Excursion en puntos (suma en fusiones ATM) |
| `mfe` | numeric | | Max Favorable Excursion en puntos (suma en fusiones ATM) |
| `bars` | integer | | Duración del trade en minutos (delta entry→exit) |
| `trade_date` | date | | Fecha del trade (para joins con sesiones) |
| `resultado` | text | | `target`, `stop`, o `otro` (basado en `exit_name`) |
| `cum_net_profit` | numeric | Calculado por trigger | P&L acumulado hasta este trade |

**Derivación de `resultado`:**
```
exit_name contiene "Target" → resultado = 'target'
exit_name contiene "Stop"   → resultado = 'stop'
otro caso                   → resultado = 'otro'
```

### Tabla `sesiones`

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | bigint | PK, auto | |
| `sesion_date` | date | UNIQUE | Clave natural (una sesión por día) |
| `no_opero` | boolean | DEFAULT false | Marcador de día sin operaciones |
| `motivo_no_opero` | text | | Solo si `no_opero = true` |
| `contexto` | text | | Contexto de mercado del día |
| `num_corrida` | integer | | 1, 2 o 3 corridas identificadas |
| `velas_corrida` | integer | | Velas de la corrida principal |
| `puntos_retroceso` | numeric | | Puntos de retroceso de la corrida |
| `zonas_contra` | boolean | | ¿Había zonas de oferta/demanda en contra? |
| `setup` | text | | Descripción del setup operado |
| `chk_zonas` | boolean | DEFAULT false | Checklist: zonas identificadas |
| `chk_orden` | boolean | DEFAULT false | Checklist: orden del mercado |
| `chk_5velas` | boolean | DEFAULT false | Checklist: patrón de 5 velas |
| `chk_noticias` | boolean | DEFAULT false | Checklist: noticias revisadas |
| `chk_consecucion` | boolean | DEFAULT false | Checklist: consecución del plan |
| `chk_estructura` | boolean | DEFAULT false | Checklist: estructura del mercado |
| `analisis_trader` | text | | Reflexión libre del trader |
| `resumen_ia` | text | | Resumen generado por Claude Haiku |
| `imagen_url` | text | | URL HTTPS de Cloudinary |
| `created_at` | timestamptz | DEFAULT now() | |
| `updated_at` | timestamptz | DEFAULT now() | |

### Tabla `fomc_dates` (nueva en v2.1)

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `date` | date | PRIMARY KEY | Fecha de la reunión FOMC |
| `description` | text | DEFAULT 'FOMC Meeting' | Descripción del evento |

RLS habilitado — solo lectura pública para rol `anon`.

### Trigger

```sql
-- Se ejecuta BEFORE INSERT en trades
-- Suma todos los profits anteriores (entry_time < NEW.entry_time) + profit del nuevo trade
CREATE TRIGGER trg_cum_net_profit
BEFORE INSERT ON trades
FOR EACH ROW EXECUTE FUNCTION calc_cum_net_profit();
```

> Si se necesita recalcular `cum_net_profit` para todos los registros existentes (ej: tras editar un profit manualmente), hay que re-insertar o ejecutar un UPDATE masivo con función window `SUM() OVER (ORDER BY entry_time)`.

### Nuevas funciones en `db.js` (v2.1)

| Función | Descripción |
|---|---|
| `getFomcDates(year, month)` | Fechas FOMC del mes/año especificado |
| `getSessionsWithImages()` | Sesiones con `imagen_url` no null (para galería) |
| `getCasuisticasByMonth(year, month)` | Casuísticas del mes (solo `sesion_date`) |
| `getAllCasuisticas()` | Todas las casuísticas con `casuistica` y `sesion_date` |

---

## 7. Variables de Entorno y Credenciales

### Resumen completo

| Variable | Componente | Tipo | Valor / Ubicación |
|---|---|---|---|
| `SUPABASE_URL` | Frontend, Bot, C# | URL | `https://jothoslozctflfrnysrx.supabase.co` |
| `SUPABASE_ANON_KEY` | Frontend (`config.js`) | Secret | Supabase Dashboard → Settings → API |
| `SUPABASE_KEY` (= anon key) | Bot (CF Worker #2 secret) | Secret | Mismo valor que anon key |
| `SUPABASE_KEY` | C# indicador (hardcoded const) | Secret | Mismo valor que anon key |
| `ANTHROPIC_API_KEY` | CF Worker #1 (secret) | Secret | console.anthropic.com |
| `CLOUDINARY_CLOUD_NAME` | Frontend (`config.js`) | Config | Cloudinary Dashboard |
| `CLOUDINARY_UPLOAD_PRESET` | Frontend (`config.js`) | Config | Cloudinary Dashboard → Upload presets |
| `BOT_TOKEN` | CF Worker #2 (secret) | Secret | @BotFather en Telegram |
| `ALLOWED_CHAT_ID` | CF Worker #2 (secret) | Config | `372127764` |
| `TIMEZONE` | CF Worker #2 (`wrangler.toml` var) | Config | `America/Bogota` |
| KV Namespace ID | CF Worker #2 (`wrangler.toml`) | Config | `3dd631773a6041c1a97a8e9a8f861067` |

### Dónde se configura cada una

**`js/config.js` (frontend — no versionado):**
```javascript
const CONFIG = {
  SUPABASE_URL: '...',
  SUPABASE_ANON_KEY: '...',
  CLOUDINARY_CLOUD_NAME: '...',
  CLOUDINARY_UPLOAD_PRESET: '...'
};
```

**CF Worker #1 — Cloudflare Dashboard → Worker → Settings → Variables:**
```
ANTHROPIC_API_KEY = sk-ant-... (encrypt)
```

**CF Worker #2 — `wrangler.toml` + secrets:**
```toml
[vars]
TIMEZONE = "America/Bogota"
```
```bash
wrangler secret put BOT_TOKEN       # Token de Telegram
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_KEY
wrangler secret put ALLOWED_CHAT_ID # 372127764
```

**C# Indicador — constantes en código fuente:**
```csharp
private const string SUPABASE_ENDPOINT = "https://jothoslozctflfrnysrx.supabase.co/rest/v1/trades";
private const string SUPABASE_KEY = "<anon-key>";
```

---

## 8. Guía de Cambios Comunes

### Añadir una nueva columna a `trades` o `sesiones`

```sql
-- 1. Agregar columna en Supabase SQL Editor
ALTER TABLE trades ADD COLUMN nueva_columna text;

-- 2. Recargar schema de PostgREST
NOTIFY pgrst, 'reload schema';
```

Luego actualizar:
- `js/db.js`: añadir campo en queries/inserts
- `NinjaTrader/SupabaseAutoExport.cs`: añadir campo en el JSON de POST (recompilar)
- `TelegramBot/worker.js`: añadir paso en state machine si es un campo de sesión

### Cambiar el modelo de IA

En el frontend (`db.js` o donde se construya el request al proxy):
```javascript
model: 'claude-haiku-4-5'  // cambiar aquí
```
No hay cambios necesarios en CF Worker #1 (es un proxy genérico).

### Agregar un paso al flujo del bot Telegram

En `TelegramBot/worker.js`:
1. Agregar el nuevo `step` al enum/constante de pasos
2. Añadir el `case` correspondiente en el switch del handler
3. Actualizar la transición del paso anterior para apuntar al nuevo paso
4. Incluir el dato en el objeto final antes del upsert

```bash
wrangler deploy  # redesplegar
```

### Agregar fechas FOMC a la tabla

```sql
INSERT INTO fomc_dates (date, description) VALUES
  ('2027-01-27', 'FOMC Meeting'),
  ('2027-03-17', 'FOMC Meeting');
-- Recargar schema si es necesario
NOTIFY pgrst, 'reload schema';
```

### Rotar la clave de Supabase (anon key)

1. Supabase Dashboard → Settings → API → Rotate keys
2. Actualizar en todos los sitios:
   - `js/config.js` (frontend)
   - CF Worker #2: `wrangler secret put SUPABASE_KEY`
   - `NinjaTrader/SupabaseAutoExport.cs` (constante + recompilar)

### Cambiar la zona horaria del bot

```toml
# wrangler.toml
[vars]
TIMEZONE = "America/New_York"  # cambiar aquí
```
```bash
wrangler deploy
```

### Resetear el estado de una sesión de bot atascada

Si el bot queda en un paso intermedio sin responder:
```bash
# Usando Wrangler CLI
wrangler kv:key delete --namespace-id 3dd631773a6041c1a97a8e9a8f861067 "s:372127764"
```
O directamente desde Cloudflare Dashboard → KV → buscar key `s:372127764` → Delete.

### Actualizar GitHub Pages

```bash
git add <archivos modificados>
git commit -m "descripcion del cambio"
git push origin main
# Auto-despliega en ~60 segundos
```

---

## 9. Troubleshooting

### El indicador NT8 no exporta trades

| Síntoma | Causa probable | Solución |
|---|---|---|
| No aparece nada en Output Window | El indicador no está agregado al chart correcto | Verificar que esté en el chart del instrumento activo |
| Error 401 en Output Window | `SUPABASE_KEY` incorrecto | Verificar la constante en el .cs y recompilar |
| Error 404 | `SUPABASE_ENDPOINT` mal escrito | Verificar URL del endpoint |
| Los datos llegan pero `cum_net_profit` es NULL | Trigger no creado | Ejecutar el SQL del trigger en Supabase |
| El trade se registra pero MAE/MFE = 0 | `OnBarUpdate` no está corriendo (timeframe incorrecto) | Verificar que el chart sea de 1 minuto y `BarsInProgress == 0` |
| Trades duplicados con ATM | Ventana de fusión no activa | Verificar que el indicador sea v2.1+ con los campos `hasPending`/`mergeTimer` |
| `commission` siempre es 0 | Indicador pre-v2.1 | Actualizar a v2.1 que lee `ex.Commission` de NT8 |

### El bot de Telegram no responde

| Síntoma | Causa probable | Solución |
|---|---|---|
| Bot no responde a ningún mensaje | Webhook no registrado o URL incorrecta | Re-ejecutar `setWebhook` con la URL correcta del Worker |
| Responde "Unauthorized" | `ALLOWED_CHAT_ID` no coincide con tu chat ID | Verificar tu chat ID con @userinfobot en Telegram |
| Error al guardar sesión | `SUPABASE_KEY` o `SUPABASE_URL` incorrectos | `wrangler secret list` y verificar valores |
| Bot queda sin responder tras un crash | Estado KV corrupto | Borrar la key `s:{chatId}` en KV (ver sección anterior) |
| Fecha incorrecta en sesiones | Timezone mal configurado | Verificar `TIMEZONE=America/Bogota` en wrangler.toml |

### El frontend no carga datos

| Síntoma | Causa probable | Solución |
|---|---|---|
| Error CORS en consola del browser | `config.js` cargado antes del DOM o variables undefined | Verificar orden de scripts en `index.html` |
| Error 401 desde Supabase | `SUPABASE_ANON_KEY` incorrecto en `config.js` | Copiar la key correcta desde Supabase Dashboard |
| Datos vacíos (0 trades) | RLS habilitado por accidente | `ALTER TABLE trades DISABLE ROW LEVEL SECURITY;` |
| Upload de imagen falla | Upload preset no es "unsigned" | Cloudinary Dashboard → Edit preset → Signing mode: Unsigned |
| Galería no muestra imágenes | `getSessionsWithImages()` falla | Verificar permisos de SELECT en sesiones |
| Festivos no aparecen | Bug en cálculo de fecha en JS | Revisar `calendar.js` función de festivos para el año actual |
| Días FOMC no aparecen | Tabla `fomc_dates` vacía o sin permisos | Verificar datos en tabla y `GRANT SELECT ON fomc_dates TO anon` |

### Claude proxy no funciona

| Síntoma | Causa probable | Solución |
|---|---|---|
| Error 403 desde el Worker | `ANTHROPIC_API_KEY` inválida o expirada | Rotar en console.anthropic.com y actualizar en CF Worker #1 |
| CORS error al llamar al proxy | Worker no retorna headers CORS | Verificar que el Worker incluye `Access-Control-Allow-Origin: *` |
| Timeout | Claude tardando > 30s (límite de Workers Free) | Reducir `max_tokens` o usar plan pago |

### Supabase — PostgREST no refleja cambios DDL

```sql
-- Ejecutar siempre después de ALTER TABLE, CREATE TABLE, etc.
NOTIFY pgrst, 'reload schema';
```

---

## 10. Costos Operativos

| Servicio | Plan | Límite gratuito | Uso estimado/mes | Costo |
|---|---|---|---|---|
| Supabase | Free | 500 MB DB, 5 GB transfer | <10 MB | $0 |
| GitHub Pages | Free | 1 GB repo, 100 GB transfer | Negligible | $0 |
| Cloudflare Workers | Free | 100,000 req/día | ~300 req/día | $0 |
| Cloudflare KV | Free | 100,000 reads/día | ~100 reads/día | $0 |
| Anthropic API | Pay-per-use | — | ~60 sesiones × $0.0004 | ~$0.024 |
| Cloudinary | Free | 25 GB storage, 25 GB BW | <100 MB | $0 |
| **TOTAL** | | | | **~$0.03/mes** |

**Modelo de IA utilizado:** `claude-haiku-4-5`
- Input: $0.80 / MTok
- Output: $4.00 / MTok
- Costo por resumen (~500 tokens): ~$0.0004

---

## 11. Historial de Versiones

| Versión | Fecha | Autor | Descripción |
|---|---|---|---|
| 1.0 | 2026-05-15 | kristeb-trader | Versión inicial del manual técnico |
| 2.1 | 2026-05-20 | kristeb-trader | Galería de imágenes (`gallery.js`); tabla `fomc_dates`; festivos CME automáticos en calendario; disciplina 7 factores clickable; error frecuente desde casuísticas; pestaña Imagen primera en modal; motivo "Festivo" en formulario; fusión ATM 3s en indicador C#; comisión real desde `ex.Commission`; nuevas funciones en `db.js` |

---

*Manual generado el 2026-05-20. Actualizar esta tabla con cada cambio significativo en el sistema.*
