# Trading Journal NQ Futures — Especificación del Proyecto

## Resumen ejecutivo
Portal semi-profesional para registro, análisis y visualización de operativa diaria en NQ/MNQ Futures usando la Metodología Chaumer en NinjaTrader 8 (temporalidad 1 minuto). El sistema combina datos automáticos de NinjaTrader con datos complementarios ingresados manualmente, análisis con IA (Claude), y visualización en un dashboard moderno.

---

## Stack tecnológico definido

| Componente | Tecnología | Estado |
|---|---|---|
| Base de datos | Supabase (PostgreSQL) | ✅ Creado |
| Frontend / Dashboard | HTML + JS vanilla → GitHub Pages | ✅ Repositorio creado |
| Exportación automática | Indicador C# en NinjaTrader 8 | 🔲 Pendiente |
| Formulario complementario | Web form o Telegram Bot | 🔲 Pendiente |
| Almacenamiento imágenes | Cloudinary (gratis) | 🔲 Pendiente |
| Análisis IA | Claude API (claude-sonnet-4-20250514) | 🔲 Pendiente |

---

## Credenciales y configuración

### Supabase
- **Project URL:** `https://jothoslozctflfrnysrx.supabase.co`
- **Anon public key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvdGhvc2xvemN0Zmxmcm55c3J4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzODQ1MTMsImV4cCI6MjA5Mzk2MDUxM30.8perbSMHaE2K73aRU2NjfrUsWgbwmm2lL2dA-e2CG18`
- **REST API base:** `https://jothoslozctflfrnysrx.supabase.co/rest/v1/`

### GitHub
- **Usuario:** `kristeb-trader`
- **Repositorio:** `trading-journal`
- **URL producción:** `https://kristeb-trader.github.io/trading-journal`

---

## Base de datos — Tablas creadas en Supabase

### Tabla: `trades`
Datos provenientes de NinjaTrader (automáticos o importados via CSV).

| Columna | Tipo | Descripción |
|---|---|---|
| id | BIGSERIAL PK | Auto incremental |
| trade_number | INTEGER | Número de trade en NinjaTrader |
| instrument | TEXT | MNQ 03-26, MNQ 06-26, etc. |
| account | TEXT | Cuenta de trading |
| strategy | TEXT | Estrategia en NinjaTrader |
| market_pos | TEXT | Long / Short |
| qty | INTEGER | Número de contratos |
| entry_price | NUMERIC | Precio de entrada |
| exit_price | NUMERIC | Precio de salida |
| entry_time | TIMESTAMPTZ | Fecha y hora de entrada |
| exit_time | TIMESTAMPTZ | Fecha y hora de salida |
| entry_name | TEXT | Nombre de la orden de entrada |
| exit_name | TEXT | Target1 / Stop1 / Close |
| profit | NUMERIC | P&L neto del trade en USD |
| cum_net_profit | NUMERIC | P&L acumulado |
| commission | NUMERIC | Comisión pagada |
| mae | NUMERIC | Maximum Adverse Excursion |
| mfe | NUMERIC | Maximum Favorable Excursion |
| etd | NUMERIC | Entry to Exit Drawdown |
| bars | INTEGER | Velas en el trade |
| trade_date | DATE | Fecha del trade (calculado) |
| resultado | TEXT | target / stop / otro (calculado) |
| created_at | TIMESTAMPTZ | Timestamp de inserción |

### Tabla: `sesiones`
Datos complementarios ingresados manualmente por el trader.

| Columna | Tipo | Descripción |
|---|---|---|
| id | BIGSERIAL PK | Auto incremental |
| sesion_date | DATE UNIQUE | Fecha de la sesión |
| contexto | TEXT | Alcista / Bajista / Mixto / Alcista fuerte / Bajista fuerte |
| num_corrida | INTEGER | Número de corrida tomada (1, 2 o 3) |
| velas_corrida | INTEGER | Velas en el impulso de la corrida |
| puntos_retroceso | NUMERIC | Puntos del retroceso antes de entrar |
| zonas_contra | BOOLEAN | ¿Había zonas vigentes en contra? |
| setup | TEXT | Descripción breve del setup |
| chk_zonas | BOOLEAN | ✅ Zonas vigentes verificadas |
| chk_orden | BOOLEAN | ✅ Orden precolocada a tiempo |
| chk_5velas | BOOLEAN | ✅ Máx 5 velas en corrida |
| chk_noticias | BOOLEAN | ✅ Sin noticia roja activa |
| chk_consecucion | BOOLEAN | ✅ Zona marcada con consecución |
| analisis_trader | TEXT | Reflexión escrita por el trader |
| resumen_ia | TEXT | Resumen generado por Claude API |
| imagen_url | TEXT | URL de la imagen del día (Cloudinary) |
| no_opero | BOOLEAN | ¿No operó ese día? |
| motivo_no_opero | TEXT | FOMC / Sin setup / Noticia roja / etc. |
| created_at | TIMESTAMPTZ | Timestamp de creación |
| updated_at | TIMESTAMPTZ | Timestamp de última actualización |

### Tabla: `reglas`
Reglas de la metodología — permite agregar/desactivar sin tocar código.

| Columna | Tipo | Descripción |
|---|---|---|
| id | BIGSERIAL PK | Auto incremental |
| nombre | TEXT | Nombre corto de la regla |
| descripcion | TEXT | Descripción detallada |
| activa | BOOLEAN | ¿Está activa en el checklist? |
| orden | INTEGER | Orden de visualización |

**Reglas iniciales insertadas:**
1. Zonas vigentes verificadas
2. Orden precolocada a tiempo
3. Máx 5 velas en corrida
4. Sin noticia roja activa
5. Zona marcada con consecución

---

## Datos históricos
- **60 trades** desde 03/02/2026 hasta 08/05/2026 ya insertados en Supabase
- Instrumentos: MNQ 03-26 y MNQ 06-26
- Cuenta: PA-APEX-232411-03 (Apex Trader Funding)

---

## Requerimientos del dashboard

### Estructura de navegación
```
/ (index.html)
├── 📅 Calendario del mes       ← PRIMERA SECCIÓN (nueva)
├── 📊 Dashboard / Métricas
├── 📋 Tabla de trades
├── ➕ Registrar sesión          ← Formulario complementario
└── 📈 Análisis                  ← Gráficos y estadísticas
```

### Sección 1 — Calendario del mes (PRIORITARIA)
- Vista mensual moderna y visual
- Cada día muestra:
  - 🟢 Verde si el resultado fue **Target**
  - 🔴 Rojo si el resultado fue **Stop**
  - ⚪ Gris si no operó
  - 📅 Sin color si es día futuro o fin de semana
- Dentro de cada día mostrar el **P&L del día** en USD
- Al hacer clic en un día → abre modal con detalle completo
- Navegación entre meses (← →)
- Diseño: moderno, glassmorphism o dark mode elegante

### Sección 2 — Métricas generales
- Total trades ejecutados
- Tasa de acierto (%) con targets vs stops
- P&L neto total acumulado
- Mejor día / Peor día
- Racha actual (wins/losses consecutivos)
- Sesiones limpias (checklist 100% cumplido)
- Error más frecuente

### Sección 3 — Tabla de trades
Columnas visibles:
- Fecha | Ticker | Dirección | Contratos | Entrada | Salida | P&L | Resultado | Disciplina | Acciones

Acciones por fila:
- 👁 Ver detalle completo (modal)
- 📷 Ver/subir imagen del día

Modal de detalle con tabs:
- **Resumen:** datos del trade de NinjaTrader
- **Checklist:** 5 reglas marcadas ✅/❌
- **Análisis:** setup, contexto, reflexión trader, resumen IA
- **Imagen:** captura de pantalla del día

### Sección 4 — Registrar sesión (formulario)
Campos del formulario complementario (lo que NO provee NinjaTrader):
- Fecha (auto: hoy)
- Contexto de mercado (select)
- # Corrida (1/2/3)
- Velas en corrida
- Puntos de retroceso
- Zonas en contra (sí/no)
- Setup (texto)
- Checklist de reglas (checkboxes)
- ¿No operé hoy? (toggle) + motivo
- Análisis / reflexión (textarea)
- Botón: **"Generar resumen con IA"** → llama Claude API
- Resumen IA (editable antes de guardar)
- Imagen del día (upload → Cloudinary)

### Sección 5 — Gráficos y análisis
- Curva de equity (P&L acumulado por día)
- Distribución de errores (barras)
- Curva de disciplina por sesión
- Win rate por semana/mes
- P&L por día de la semana
- MAE vs MFE scatter plot

---

## Flujo de datos diario

```
NinjaTrader 8
    ↓ (automático via indicador C#)
Supabase tabla: trades
    ↓
Dashboard lee trades de Supabase
    ↓
Trader abre formulario → completa datos complementarios
    ↓ (se guarda en tabla: sesiones)
Trader escribe reflexión → clic "Generar con IA"
    ↓ (Claude API genera resumen)
Trader aprueba/edita → Guardar
    ↓
Trader sube imagen del día → Cloudinary → URL guardada en sesiones
    ↓
Dashboard se actualiza con toda la información del día
```

---

## Fase 3 — Indicador NinjaTrader (C#)

El indicador debe:
1. Ejecutarse al cierre de cada trade
2. Capturar: instrument, market_pos, qty, entry_price, exit_price, entry_time, exit_time, entry_name, exit_name, profit, commission, mae, mfe, bars
3. Hacer un HTTP POST a Supabase REST API
4. Autenticarse con el anon key en el header
5. Manejar errores silenciosamente (no interrumpir el trading)

**Endpoint Supabase para insertar:**
```
POST https://jothoslozctflfrnysrx.supabase.co/rest/v1/trades
Headers:
  apikey: {anon_key}
  Authorization: Bearer {anon_key}
  Content-Type: application/json
  Prefer: return=minimal
```

---

## Fase 4 — Telegram Bot (formulario complementario alternativo)

El bot debe:
1. Iniciar con `/sesion` o `/registro`
2. Hacer preguntas secuenciales con botones inline:
   - ¿Cómo fue el contexto? [Alcista] [Bajista] [Mixto] [Alcista fuerte] [Bajista fuerte]
   - ¿Qué corrida tomaste? [1ª] [2ª] [3ª] [No operé]
   - ¿Cuántas velas en la corrida? (número)
   - ¿Puntos de retroceso? (número)
   - ¿Zonas en contra? [Sí] [No]
   - Checklist: 5 preguntas con [✅ Sí] [❌ No]
   - ¿Alguna reflexión del día? (texto libre)
3. Al final → guardar en Supabase tabla `sesiones`
4. Confirmar con resumen del registro

---

## Diseño visual

- **Estilo:** Moderno, profesional, dark mode opcional
- **Paleta principal:**
  - Background: `#F4F3EF` (light) / `#1a1a18` (dark)
  - Accent: `#1D9E75` (verde trading)
  - Error/Stop: `#E24B4A`
  - Warning: `#BA7517`
  - Primary text: `#1a1a18`
- **Tipografía:** Segoe UI / system-ui
- **Componentes:** Cards con border-radius 10px, sombras suaves, transiciones 150ms
- **Iconos:** Tabler Icons (CDN)
- **Charts:** Chart.js

---

## Flexibilidad y escalabilidad

- Las reglas del checklist se leen de la tabla `reglas` en Supabase → agregar regla nueva sin tocar código
- Los campos de `sesiones` son extensibles via ALTER TABLE
- El dashboard debe leer la estructura de columnas dinámicamente donde sea posible
- Preparado para múltiples instrumentos (NQ, MNQ, ES, etc.)
- Preparado para múltiples cuentas

---

## Pendiente por definir

- [ ] Token de Claude API para el resumen IA
- [ ] Cuenta Cloudinary para imágenes
- [ ] Token del Bot de Telegram
- [ ] Decidir: ¿formulario web o Telegram bot como input principal?
- [ ] Implementar indicador C# en NinjaTrader

---

## Notas importantes sobre la metodología Chaumer

- **Regla de las 5 velas:** máximo 5 velas en el impulso. Sin excepciones.
- **Marcación de zonas:** solo con rompimiento + consecución + retroceso confirmado.
- **Zonas vigentes en target:** ninguna zona vigente entre entrada y target.
- **Orden precolocada:** lista antes del cierre de la vela de rompimiento.
- **Vela extensa:** señal de fuerza, no de invalidación.
- **FOMC / Noticias rojas:** no operar en días Fed. No entrar 5 min antes de noticias rojas.
- **Stop máximo:** 60 puntos / $120 por trade.
- **Ratio:** 1:1 mínimo.