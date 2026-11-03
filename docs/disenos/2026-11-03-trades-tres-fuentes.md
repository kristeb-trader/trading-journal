# Trades: los míos, los de Alfredo y los del bot, con filtros múltiples y por fechas

| Versión | Fecha | Estado |
|---|---|---|
| v1.0 | 03/11/2026 | Kris eligió la OPCIÓN A del boceto (lista mezclada) |
| v1.1 | 03/11/2026 | **Aprobado e implementado** · checkpoint 2026-11-03 del historial |

## La pregunta

¿Qué operaciones hicimos Alfredo, el bot y yo con un setup, un resultado y unas fechas
dados? Por ejemplo, todos los reingresos (alcistas **y** bajistas) de octubre, de los tres.

## Hoy (Otros › Trades, `js/table.js`)

- Solo `trades` (los de Kris) y los días de `sesiones` con `no_opero`.
- Un desplegable de resultado y uno de setup: **una opción cada uno**.
- Sin fechas: búsqueda de texto y páginas de 20.

## Después

Una sola lista mezclada, del más nuevo al más viejo, con separador por mes (como hoy). Cada
fila dice **de quién es**.

### Fuentes (solo lectura, sin cambios en la BD)

| Quién | Tabla | Fila | Setup | Dirección | Puntos | P&L |
|---|---|---|---|---|---|---|
| **Mío** | `trades` (+ `sesiones` con `no_opero`) | un trade | el de la sesión de su fecha (`setup_codigo`) | `market_pos` | salida − entrada, con el signo de la dirección | `profit` (neto) |
| **Alfredo** | `chaumer_operativas` | un día | `setup_codigo` | la del setup (alcista / bajista) | `puntos` | — (no hay) |
| **Bot** | `bot_operaciones` | un día y cuenta | `setup` + `direccion` → `continuacion_alcista`… | `direccion` (1 / −1) | `puntos` | `pnl_neto` |

Los días sin operación entran como **No operó**: los de Kris (`no_opero`, con su motivo), los
de Alfredo (`opero = false`) y los `NO OPERA` / `NO ARMADO` del bot (con su motivo).

### Columnas

**Quién** (etiqueta: Mío verde · Alfredo azul · Bot violeta) · Día · Fecha · Hora · **Setup** ·
Dirección · Resultado · **Puntos** · P&L · Error · acción.

- **Salen Instrumento y Contratos** de la tabla (siguen en el detalle del trade): entran Setup
  y Puntos sin que la tabla se ensanche.
- **Error** y el ojo (abrir el día) solo para los míos, como hoy. Alfredo y bot, sin acción.
- B.E. se mantiene para los míos (|P&L| ≤ $6, como hoy).

### Filtros (sustituyen a los dos desplegables)

Etiquetas que se marcan y desmarcan; **varias a la vez** dentro de cada grupo; un grupo sin
nada marcado = sin filtrar.

| Grupo | Opciones |
|---|---|
| Quién | Mío · Alfredo · Bot |
| Setup | Cont. alcista · Cont. bajista · Reing. alcista · Reing. bajista · Sin setup |
| Resultado | Target · Stop · B.E. · No operó |
| Fechas | Desde · Hasta, y atajos: Esta semana · Este mes · Mes pasado · Todo |

- Se mantienen la **búsqueda** de texto y el **filtro de cuentas** de la barra superior (este,
  solo para los míos: Alfredo y el bot no tienen cuenta del journal).
- Botón **Limpiar** que deja todo sin filtrar.
- La selección se recuerda en este navegador (`localStorage`, con `try/catch`).
- Encima de la tabla, una línea con el **resumen de lo filtrado**: operaciones, T · S y
  efectividad (los No operó no cuentan).
- Por defecto: los tres marcados en Quién, el resto sin filtrar, fechas Todo.

## Archivos

| Archivo | Cambio |
|---|---|
| `js/table.js` | Cargar las 3 fuentes, normalizar a una fila común, filtros múltiples, fechas, resumen |
| `index.html` | Barra de filtros (etiquetas + fechas) en lugar de los dos `<select>`; cabecera de la tabla |
| `css/styles.css` | Etiquetas de filtro y de Quién, con tokens |
| `js/db.js` | Nada: se reutilizan `getTrades`, `getSesiones`, `getChaumerOperativas`, `getBotOperaciones` |
| `docs/historial-proyecto.md` | Checkpoint |

No se toca la BD ni el portal. `trades`, `chaumer_operativas` y `bot_operaciones` solo se leen y
**no se mezclan en ningún cálculo**: es una vista.

## Plan por fases

1. **Las tres fuentes en la lista**: carga, fila común, columna Quién, Setup y Puntos.
   Verificación: los recuentos por fuente cuadran con un `SELECT` (135 · 54 · 20 al 03/11).
2. **Filtros múltiples y fechas**, con resumen y memoria. Verificación: los reingresos
   alcistas + bajistas de octubre de los tres, contra un `SELECT`.
3. **Cierre**: preview en ordenador y móvil sin errores, historial, commit y push.
