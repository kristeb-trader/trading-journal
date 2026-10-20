# Operativa diaria en el portal

**Versión:** v1 · **Estado:** 🟢 aprobado (20/10/2026), en implementación · **Fecha:** 20/10/2026

| Versión | Qué cambió |
|---|---|
| v1 | Primera propuesta, con las cuatro respuestas del operador del 20/10/2026 |

---

## 1. Qué se pide

Una entrada nueva en el menú del portal, **«Operativa diaria»**, encima de «Backtesting». Muestra
lo mismo que Backtesting —tarjetas, curva, filtros, meses plegables, tabla—, pero con los **trades
de la cuenta principal del Journal** en lugar de la bitácora de backtesting.

### Decisiones del operador (20/10/2026)

| Pregunta | Respuesta |
|---|---|
| ¿Se enseña todo, observaciones incluidas, en un portal sin contraseña? | **Sí, todo** |
| ¿Desde cuándo? | **Solo desde el plan de Chaumer, y desde el 21/10/2026**: lo anterior no sale |
| ¿Valor inicial? | **No hay. La curva arranca en $0** (P&L acumulado) |

Hoy, 20/10, la página sale vacía («Todavía no hay operaciones»). Se llena sola a partir del primer
trade del 21/10.

---

## 2. De dónde sale cada dato

La cuenta principal es la de `objetivos.cuenta_principal` (hoy `Sim101`). **No se escribe en ningún
sitio a mano**: si mañana cambia de cuenta, el portal la sigue sin tocar nada.

| Columna del portal | Origen | Nota |
|---|---|---|
| Fecha | `trades.trade_date` | |
| Hora | `trades.entry_time` | Hora Colombia, tal cual (como en Backtesting) |
| Dirección | `trades.market_pos` | `Long` → Largo · `Short` → Corto |
| Setup | `sesiones.setup_codigo` de ese día | `continuacion_*` → Continuación · `reingreso_*` → Reingreso · sin sesión o sin setup → «—» |
| Puntos | `abs(exit_price − entry_price)` | Siempre positivo; el signo lo da el resultado, igual que en `bt_*` |
| P&L | `trades.profit` | **Neto** (D-002) |
| Resultado | `trades.resultado` | `target` · `stop` · **`otro`, nuevo** (pastilla neutra) |
| Observaciones | `sesiones.analisis_trader` de ese día | Es **del día**, no del trade: va en la primera fila del día, como el gráfico |
| Gráfico | `sesiones.imagen_url` de ese día | La lupa de siempre |

**Un día sin trades** con la sesión guardada y `no_opero = true` sale como en Backtesting: una
fila «Sin operación» con el motivo (`motivo_no_opero`) en observaciones. Así se ve que ese día se
miró y no se entró.

---

## 3. Las tarjetas

Backtesting tiene seis, y tres dependen del valor inicial (Valor inicial, Saldo, Rentabilidad).
Aquí no hay, así que quedan **cuatro, en una fila** (dos por fila en móvil):

| P&L neto | Efectividad | Puntos netos | Caída máxima |
|---|---|---|---|
| suma de `profit`, en verde o rojo | targets / operaciones, con «N target · N stop» debajo | ± según resultado | la peor caída desde un máximo de la curva, en $ |

La **curva** es la misma, empezando en **$0** con la línea punteada en cero.

**Filtros:** los mismos seis que en Backtesting (Todas · Continuación · Reingreso · Target · Stop ·
Con observación). Sin botón **Exportar**: los trades ya están en el Journal.

---

## 4. Arquitectura

```
Supabase                         Cloudflare (portal)                  Navegador
─────────────────                ─────────────────────                ─────────────────
trades + sesiones + objetivos
        │
        ▼
portal_op_jornadas  (vista) ──►  /api/operativa  (función) ───────►   /operativa
  solo la cuenta principal         misma llave que Backtesting          la misma tabla que
  solo desde el 21/10/2026         (SUPABASE_PORTAL_KEY,                Backtesting, con
  revoke anon/authenticated        rol portal_lector)                   otras tarjetas
```

- **La vista tiene la misma forma que `portal_bt_jornadas`**: una fila por día y sus operaciones en
  un `jsonb`. Así la página reutiliza el código de Backtesting en vez de duplicarlo.
- **Misma llave, ningún secreto nuevo.** `portal_lector` recibe `select` sobre la vista nueva y nada
  más. Las tablas siguen fuera de su alcance (la vista corre con los permisos de su dueño, como las
  de Backtesting).
- **El 21/10/2026 vive en la vista**, con su comentario. No es un número del plan, es el arranque de
  esta página.

---

## 5. Archivos

```
ANTES                                          DESPUÉS
docs/migrations/                               + 2026-10-20-portal-operativa.sql
                                                   (vista portal_op_jornadas + permisos)
chaumer/04_Web/functions/api/                  + operativa/index.js   (solo GET; el resto 405)
  backtesting/_comun.js                          backtesting/_comun.js  exporta `vista()` para reusarla
chaumer/04_Web/src/pages/backtesting.astro     → la tabla, la curva, los filtros y los meses pasan a
                                                 src/componentes/Bitacora.astro (sin cambiar nada
                                                 de lo que se ve)
                                               backtesting.astro      usa <Bitacora> con sus 6 tarjetas
                                               + operativa.astro      usa <Bitacora> con 4 tarjetas
chaumer/04_Web/src/componentes/Marco.astro     + «Operativa diaria» encima de «Backtesting»
chaumer/04_Web/DESPLIEGUE.md                   la llave también lee portal_op_jornadas
docs/decisiones.md                             + D-041: el portal enseña la operativa real
docs/migrations/INDICE.md                      + la migración
```

No se borra ni se archiva nada.

---

## 6. Fases

| Fase | Qué | Se verifica con |
|---|---|---|
| **1 · Datos** | Migración: la vista y sus permisos | `SELECT` como `portal_lector`: ve la vista, **no** ve `trades`; hoy devuelve 0 filas. Con la fecha de arranque movida a mano a un día con trades (en una consulta, no en la vista), cuadran P&L y número de trades contra `trades` |
| **2 · Página compartida** | `Bitacora.astro` saliendo de `backtesting.astro` | Backtesting se ve **idéntico** antes y después (captura con los mismos datos de prueba) |
| **3 · Operativa diaria** | La ruta, la página y el menú | Página con datos de prueba (target, stop, otro, día sin operación, día con nota y gráfico): tarjetas, curva desde $0, filtros, meses plegables; y vacía con el mensaje. `npm run verificar` sin fallos |
| **4 · Cierre** | D-041, DESPLIEGUE, INDICE, commit y push | Tras publicar, `/api/operativa` en el portal real responde 200 |

---

## 7. Lo que no se hace

- **No se leen `apex_trades`** ni otras cuentas: solo la principal (D-019).
- **No se escribe nada** desde el portal: solo lectura, como Backtesting.
- **No se muestra nada anterior al 21/10/2026**, ni siquiera en la curva.
- **No se toca el Journal**: la página solo lee lo que el Journal ya guarda.
