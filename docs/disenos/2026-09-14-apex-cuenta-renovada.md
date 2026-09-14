# Diseño — Apex Tracker: una cuenta renovada con el mismo número

| | |
|---|---|
| **Versión** | v1 |
| **Fecha** | 2026-09-14 |
| **Estado** | 🔵 **APROBADO** (14 sep) — en implementación: fase 1 ✅ |
| **Origen** | Kris (14 sep): quemó la `APEX-232411-15` el 8-sep, la renovó el viernes 11-sep con el mismo número y quiere una tarjeta nueva con las estadísticas desde cero, empezando por los 2 trades de hoy |
| **Alcance** | `js/apex.js` + una fila nueva en `apex_cuentas`. **Cero cambios de esquema** |

## 1. El problema

El Tracker asigna trades y días manuales a cada tarjeta **solo por número de cuenta**:

- `js/apex.js:258` — `[...trades, ...mainTrades].filter(t => t.account === cta.numero_cuenta)`
- `js/apex.js:271` — `registros.filter(r => r.account === cta.numero_cuenta)`

`apex_cuentas.fecha_inicio` se guarda desde el formulario pero **no se usa para filtrar**. Y
`apex_cuentas` no tiene restricción de unicidad sobre `numero_cuenta`, así que dos tarjetas
con el mismo número se guardan sin error y **las dos cogen todos los trades**: la nueva
nacería quemada con −2.299 y la vieja sumaría los de hoy.

Datos a 14-sep (verificado con `SELECT`):

| | Apex-15 (quemada) | Apex-15 · 2ª |
|---|---|---|
| Periodo | 12-ago → 8-sep | 11-sep → |
| Trades | 21 (15 en `apex_trades`, 6 en `trades`) | 2 en `apex_trades` (14-sep) |
| P&L | −2.194,94 → balance **47.805,06** | −104,04 → balance **49.895,96** |

## 2. La regla nueva: cada tarjeta es un periodo

Una tarjeta coge los trades y días manuales de su número de cuenta **dentro de su periodo**:

- **Desde** su `fecha_inicio` (inclusive). Sin `fecha_inicio` → sin límite inferior
  (comportamiento de hoy).
- **Hasta** el día anterior a la `fecha_inicio` más temprana de **otra tarjeta con el mismo
  número que empiece después**. Si no la hay → sin límite superior.

El límite superior **no se guarda**: se deduce de las tarjetas hermanas. Así no hay
columna nueva, no hay migración de esquema, y la próxima renovación es solo crear otra
tarjeta.

**Comprobado antes de proponerlo:** ninguna de las 6 cuentas tiene trades ni días manuales
anteriores a su `fecha_inicio`. El filtro desde-inicio **no cambia ningún número** de las
tarjetas existentes; el único efecto real es partir la Apex-15 en dos.

## 3. Cambios

### 3.1 `js/apex.js`

- Función nueva `periodoDe(cta)` → `{ desde, hasta }` (ISO `YYYY-MM-DD` o `null`) con la
  regla del §2, calculada sobre `cuentas`.
- `buildSeries()` (l. 258 y 271): al filtro por `numero_cuenta` se añade
  `enPeriodo(fecha, periodo)` sobre `t.trade_date` / `r.trade_date`. Comparación de
  cadenas ISO; nada de `Date` ni `toISOString`.
- `guardarCuenta()` (l. ~820): si otra tarjeta tiene el mismo `numero_cuenta` y esta no trae
  `fecha_inicio`, se rechaza con un toast: «Hay otra cuenta con este número: indica la
  fecha de inicio para separarlas». Sin fecha no hay forma de repartir los trades.

Todo lo demás (`calc`, detalle, Trading History, plan, registrar día) lee de
`seriesPorCuenta` / `tradesPorCuenta`, así que hereda el reparto sin tocarse. Un día
manual registrado desde la tarjeta nueva se guarda con el mismo `account` y cae en la
tarjeta correcta por su fecha.

### 3.2 Datos — `docs/migrations/2026-09-14-apex15-renovada.sql`

`INSERT` en `apex_cuentas` con los parámetros de la Apex-15 (id 6):

| Campo | Valor |
|---|---|
| `nombre` | `Apex-15 · 2ª` |
| `numero_cuenta` | `APEX-232411-15` |
| `tamano` / `balance_inicial` | 50000 |
| `drawdown_max` / `profit_target` | 2000 / 3000 |
| `safety_net_balance` / `piso_congelado` | 52100 / 50100 |
| `min_dias` / `contratos_max` | 7 / NULL |
| `estado` / `activa` | `evaluacion` / `true` |
| `fecha_inicio` | `2026-09-11` |
| `plan_perfil` / `plan_ritmo` | `moderado` / `equilibrado` |

La tarjeta vieja (id 6) **no se toca**.

## 4. Fuera de alcance (anotado, no se hace)

- **Filtro de cuentas de Calendario / Trades / Análisis:** filtra por nombre de cuenta NT8,
  no por tarjeta, así que "APEX-15" seguirá mostrando las dos etapas juntas. Pasa a
  `tasks/backlog.md`.
- `numero_cuenta` sin unicidad: se deja así a propósito — es lo que permite las renovaciones.

## 5. Plan de implementación

| Fase | Qué | Verificación |
|---|---|---|
| **1** | `periodoDe` + filtro en `buildSeries` + validación en `guardarCuenta` | `node --check js/apex.js`; preview de Apex con consola limpia; las 6 tarjetas con los mismos balances que antes |
| **2** | Migración de datos aplicada por MCP + fila en `INDICE.md` | `SELECT` de la fila; preview: «Apex-15 · 2ª» en 49.895,96 con 2 trades, y la Apex-15 quemada en 47.805,06 |
| **3** | Cierre: estado de este diseño, checkpoint en `historial-proyecto.md`, backlog | — |

Commit + push al cerrar cada fase.

## Registro de versiones

- **v1** (14 sep) — propuesta inicial. Parámetros y nombre confirmados por Kris.
