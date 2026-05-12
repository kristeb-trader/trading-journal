# Trading Journal NQ Futures — Estado del Proyecto

## Resumen ejecutivo
Dashboard semi-profesional para registro, análisis y visualización de operativa diaria en NQ/MNQ Futures (temporalidad 1 minuto). Combina datos automáticos de NinjaTrader con datos complementarios ingresados manualmente, análisis con IA (Claude), e imágenes del día (Cloudinary).

---

## Stack tecnológico

| Componente | Tecnología | Estado |
|---|---|---|
| Base de datos | Supabase (PostgreSQL) | ✅ Activo |
| Frontend / Dashboard | HTML + JS vanilla | ✅ Publicado |
| Hosting | GitHub Pages | ✅ Activo |
| Proxy IA | Cloudflare Worker | ✅ Activo |
| Análisis IA | Claude API (claude-haiku-4-5-20251001) | ✅ Activo |
| Almacenamiento imágenes | Cloudinary | ✅ Activo |
| Exportación automática | Indicador C# en NinjaTrader 8 | ❌ Pendiente |
| Formulario alternativo | Telegram Bot | ❌ Pendiente |

---

## Credenciales y configuración

### Supabase
- **Project URL:** `https://jothoslozctflfrnysrx.supabase.co`
- **Anon key:** en `js/config.js`
- **REST API:** `https://jothoslozctflfrnysrx.supabase.co/rest/v1/`
- **Permisos configurados:** RLS deshabilitado en las 3 tablas + GRANT anon en trades, sesiones, reglas + GRANT USAGE en sesiones_id_seq

### GitHub
- **Usuario:** `kristeb-trader`
- **Repositorio:** `trading-journal` (privado)
- **URL producción:** `https://kristeb-trader.github.io/trading-journal`

### Cloudflare Worker (proxy Claude API)
- **URL:** `https://broad-hall-c53f.kristerock.workers.dev`
- **Función:** recibe peticiones del browser y las reenvía a Anthropic API evitando bloqueo CORS

### Claude API
- **Key:** guardada en `localStorage` del navegador (no en código)
- **Acceso:** dashboard → ⚙ Ajustes → pegar key
- **Modelo:** `claude-haiku-4-5-20251001`
- **Cuenta:** `console.anthropic.com` — créditos cargados ($5)

### Cloudinary
- **Cloud name:** `dq4n7bjta`
- **Upload preset:** `trading-journal` (Unsigned)
- **Credenciales en:** `js/config.js`

---

## Base de datos — Tablas en Supabase

### Tabla: `trades`
Datos de NinjaTrader (automáticos o importados via CSV).
- 60 trades históricos cargados (03/02/2026 – 08/05/2026)
- Instrumentos: MNQ 03-26 y MNQ 06-26
- Cuenta: PA-APEX-232411-03 (Apex Trader Funding)

Columnas principales: `id, trade_number, instrument, account, strategy, market_pos, qty, entry_price, exit_price, entry_time, exit_time, entry_name, exit_name, profit, cum_net_profit, commission, mae, mfe, etd, bars, trade_date, resultado, created_at`

### Tabla: `sesiones`
Datos complementarios ingresados manualmente por el trader.

Columnas: `id, sesion_date (UNIQUE), contexto, num_corrida, velas_corrida, puntos_retroceso, zonas_contra, setup, chk_zonas, chk_orden, chk_5velas, chk_noticias, chk_consecucion, chk_estructura (AGREGADA), analisis_trader, resumen_ia, imagen_url, no_opero, motivo_no_opero, created_at, updated_at`

> **Nota:** `chk_estructura` fue agregada manualmente con:
> `ALTER TABLE sesiones ADD COLUMN IF NOT EXISTS chk_estructura BOOLEAN DEFAULT false;`

### Tabla: `reglas`
Existe en Supabase pero **no se usa actualmente** — el checklist está hardcodeado en el frontend. Decisión tomada: mantenerlo hardcodeado por simplicidad.

---

## Estructura de archivos del proyecto

```
Trading Journal/
├── index.html              ← Shell principal + navegación + modales
├── favicon.svg             ← Icono de velas japonesas (verde/rojo)
├── css/
│   └── styles.css          ← Diseño dark mode completo
├── js/
│   ├── config.js           ← Credenciales Supabase y Cloudinary
│   ├── db.js               ← Capa de datos (todas las queries a Supabase)
│   ├── calendar.js         ← Calendario mensual interactivo
│   ├── metrics.js          ← KPIs y métricas generales
│   ├── table.js            ← Tabla de trades con paginación y filtros
│   ├── form.js             ← Formulario de sesión diaria
│   ├── charts.js           ← 6 gráficas con Chart.js
│   └── app.js              ← Navegación, modales, toasts, lightbox, boot
├── PROGRESS.md             ← Este archivo
└── TRADING_JOURNAL_PROJECT.md ← Especificación original del proyecto
```

---

## Funcionalidades implementadas

### Sección 1 — Calendario
- Vista mensual con navegación ← →
- Colores por resultado: 🟢 Target | 🔴 Stop | 🟡 Mixto | ⚫ Sin operar
- P&L del día visible en cada celda
- Resumen mensual: días operados, trades, win rate, P&L total
- Clic en día → modal de detalle

### Modal de detalle (4 tabs)
- **Resumen:** lista de trades del día con P&L total
- **Checklist:** 6 reglas con ✅/❌ y score de disciplina (X/6)
- **Análisis:** contexto, corrida, setup, reflexión trader, resumen IA
- **Imagen:** captura del día con lightbox al hacer clic

### Sección 2 — Métricas
- P&L neto total y promedio por día
- Tasa de acierto (targets/stops)
- Total trades y días operados
- Racha actual (wins/losses consecutivos)
- Mejor y peor día
- Sesiones limpias (6/6 checklist)
- Error más frecuente
- Filtros: Todo / Este mes / Esta semana

### Sección 3 — Tabla de trades
- Todas las columnas de NinjaTrader
- Búsqueda por texto y filtro por resultado
- Paginación (20 trades por página)
- Clic en fila → abre modal de detalle del día

### Sección 4 — Registrar sesión
- Fecha (auto: hoy)
- Toggle "No operé hoy" + motivo
- Contexto de mercado (5 opciones)
- Número de corrida (1ª/2ª/3ª) — botones
- Velas en corrida (1-20) — auto-invalida chk_5velas si > 5
- Puntos de retroceso
- Zonas en contra (Sí/No) — botones
- Setup (texto libre)
- Checklist 6 reglas con auto-invalidación
- Reflexión / análisis (textarea)
- Botón "Generar resumen" → Claude API via Cloudflare Worker
- Subida de imagen → Cloudinary
- Al guardar: vuelve al calendario y recarga datos

### Sección 5 — Análisis
- Curva de equity (P&L acumulado)
- Win rate semanal
- P&L promedio por día de semana
- MAE vs MFE scatter plot
- Distribución de resultados (donut)
- Disciplina por sesión (%)

### Otras funcionalidades
- ⚙ Ajustes: API key de Claude guardada en localStorage
- Lightbox: imagen del día a pantalla completa (Esc para cerrar)
- Toasts de notificación (éxito/error/warning)
- Botón "Editar sesión" en modal → precarga formulario con datos existentes
- Conexión a Supabase verificada al arrancar

---

## Checklist de 6 reglas (hardcodeado)

| Campo DB | Descripción |
|---|---|
| `chk_zonas` | Zonas vigentes verificadas |
| `chk_orden` | Orden precolocada a tiempo |
| `chk_5velas` | Máx 5 velas en corrida (auto-invalida si velas > 5) |
| `chk_noticias` | Sin noticia roja activa |
| `chk_consecucion` | Zona marcada con rompimiento + consecución + retroceso confirmado |
| `chk_estructura` | Estructura de Impulso + Retroceso + Impulso, Fluida |

---

## Pendiente

### Fase 3 — Indicador C# para NinjaTrader 8 (PRIORITARIO)
Indicador que se ejecuta al cierre de cada trade y hace POST automático a Supabase.

Datos a capturar: `instrument, market_pos, qty, entry_price, exit_price, entry_time, exit_time, entry_name, exit_name, profit, commission, mae, mfe, bars`

Endpoint Supabase:
```
POST https://jothoslozctflfrnysrx.supabase.co/rest/v1/trades
Headers:
  apikey: {anon_key}
  Authorization: Bearer {anon_key}
  Content-Type: application/json
  Prefer: return=minimal
```

Requisitos del indicador:
- Ejecutarse al cierre de cada trade (OnExecutionUpdate)
- Calcular: trade_date (fecha local), resultado (target/stop/otro según exit_name)
- Manejar errores silenciosamente (no interrumpir el trading)
- Compatible con NinjaTrader 8 / .NET / C#

### Fase 4 — Telegram Bot (opcional)
Bot para registrar sesiones vía Telegram como alternativa al formulario web.
- Comando `/sesion` inicia el flujo
- Preguntas secuenciales con botones inline
- Guarda en tabla `sesiones` de Supabase

---

## Decisiones técnicas tomadas

| Decisión | Motivo |
|---|---|
| Checklist hardcodeado (no dinámico desde tabla `reglas`) | Reglas estables, menos complejidad |
| Claude API via Cloudflare Worker | Anthropic bloquea llamadas CORS directas desde browser |
| API key en localStorage (no en código) | Repo público — evitar exponer credenciales |
| RLS deshabilitado en Supabase | Proyecto personal, un solo usuario, sin riesgo |
| Vanilla JS (sin frameworks) | Simplicidad, compatibilidad con GitHub Pages |
| `claude-haiku-4-5-20251001` para resúmenes | Económico — ~$0.0004 por resumen |

---

## Cómo continuar en un nuevo chat

1. Leer este archivo (`PROGRESS.md`) y el archivo original (`TRADING_JOURNAL_PROJECT.md`)
2. El código fuente está en GitHub: `https://github.com/kristeb-trader/trading-journal`
3. La prioridad pendiente es la **Fase 3: Indicador C# para NinjaTrader 8**
4. Usar el working directory: `C:\Users\Asus\Claro drive\Trading Journal`
