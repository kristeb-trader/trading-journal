# Cuatro calendarios — una pantalla principal antes del calendario

**Versión:** v1.1 · **Estado:** ✅ **CERRADO el 29/09/2026.** Las 5 fases implementadas y verificadas; D-032.
**Escrito:** 29/09/2026. **Alcance:** la sección Calendario de la app (no el portal).

| Versión | Fecha | Qué cambió |
|---|---|---|
| v1 | 29/09/2026 | Primera versión, con las tres decisiones de Kris del §2 |
| v1.1 | 29/09/2026 | **Implementado.** §10 con lo que cambió al construirlo |

---

## 1. Qué pide Kris

Que el botón **Calendario** abra primero una pantalla dividida en cuatro, con un calendario en cada
cuarto:

1. **Mío** — el que ya existe.
2. **Chaumer** — lo que operó Alfredo.
3. **Claude** — lo que marcó el motor, que se sube solo después de cada jornada.
4. **Backtesting manual** — la bitácora de Otros → Backtesting.

Cada uno lleva un botón que abre **su calendario completo**, con la misma forma que el de hoy
(tarjetas, cuadrícula, curva) y sus propios datos.

## 2. Decisiones tomadas (Kris, 29/09)

| Pregunta | Decisión |
|---|---|
| ¿Qué mes muestran los cuatro? | **El mismo mes para todos**, con unas únicas flechas. |
| ¿En qué unidad? | **Todo en puntos**, y el **P&L se calcula solo** a partir de los puntos. |
| ¿Curva comparada? | **Sí**, debajo de los cuatro cuadros. |

## 3. Las cuatro fuentes y cómo se convierte un día

Cada fuente se traduce a un mismo formato de día. Así la pantalla principal, la vista completa y la
curva comparada no necesitan saber de dónde viene el dato.

```
{ fecha, estado, puntos, pnl, pnlCalculado, ops, setup, hora, direccion, nota }
estado: target · stop · be · sin-entradas · no-opero · bloqueado
```

| Fuente | Tabla | Puntos | P&L |
|---|---|---|---|
| **Mío** | `trades` + `sesiones` | Por **precio**, trade a trade: Short `entrada − salida`, Long `salida − entrada`, sumados en el día | El **real**: `trades.profit` (neto) |
| **Chaumer** | `chaumer_operativas` | `puntos` (ya lleva signo) | **Calculado** (§3.1) |
| **Claude** | `motor_fichas` → `ficha.operacion` | `ficha.operacion.puntos` (con signo) | **Calculado** (§3.1) |
| **Manual** | `bt_jornadas` + `bt_operaciones` | `puntos` es siempre positivo: el signo lo pone `resultado` | El **guardado** (`pnl`, neto y congelado) |

### 3.1 El P&L calculado

Chaumer y el motor solo registran puntos. Su P&L se calcula con los **datos de inicio del
backtesting** (`bt_cabecera`), que ya existen y se editan en Otros → Backtesting:

```
pnl = puntos × valor_punto × contratos − comisión × contratos
    = puntos × $2 × 1 − $1,02          (valores de hoy: MNQ, 1 contrato)
```

Un target de +30 puntos sale en **+$58,98**; un stop de −41,25, en **−$83,52**. Si Kris cambia
los datos de inicio, cambian los P&L calculados. El manual **no** se recalcula: su P&L está
congelado por diseño (una jornada corregida conserva sus valores).

### 3.2 Lo que dicen los puntos que el dinero no dice

Septiembre de 2026 (hasta el 29):

| | Operaciones | T / S | Puntos | P&L |
|---|---|---|---|---|
| Mío | 17 | 9 / 8 | **−14,50** | **+$43,88** (real) |
| Chaumer | 15 | 7 / 8 | −65,00 | −$145,30 (calculado) |
| Claude | 10 | 5 / 5 | −37,50 | −$85,20 (calculado) |

Mi P&L es **positivo con puntos negativos**. No es un error: los puntos se miden por trade, sin
multiplicar por contratos (es la unidad de riesgo del proyecto, D-005), y los trades ganadores
llevaron más contratos que los perdedores. Por eso en **Mío** los puntos van grandes y el P&L real
debajo, siempre a la vista: los dos cuentan cosas distintas y verdaderas.

Estas cifras son las de control para verificar las fases 3 y 4.

### 3.3 El candado del motor

`motor_fichas` solo deja leer la ficha de un día **ya registrado** (D-026). Es a propósito: que el
resultado del motor no condicione el registro de Kris. El calendario de Claude **lo respeta**:

- La ficha se lee con la política de siempre. **No se toca la política.**
- Para saber qué días tienen ficha pero están cerrados, una función nueva,
  **`motor_estados(p_desde, p_hasta)`**, que devuelve `(fecha, estado)` del rango. Es la misma
  lógica que `motor_estado(fecha)`, que ya existe, pero para un mes en una sola llamada. Solo dice
  el estado, **nunca** los puntos ni la operación.
- Un día cerrado se pinta **🔒 "Registra tu día"**, sin resultado. Al registrarlo, se abre solo.

## 4. La pantalla principal

### 4.1 Escritorio

```
┌ Calendario · Septiembre 2026 ‹ › ─────────────────────────────────────────────┐
│ ┌── ● Mío ──────────────── [Abrir →] ┐ ┌── ● Chaumer ──────────── [Abrir →] ┐  │
│ │ −14,5 pts   +$43,88     9T / 8S    │ │ −65 pts   −$145,30      7T / 8S     │  │
│ │  L   M   X   J   V                 │ │  L   M   X   J   V                  │  │
│ │ [■] [■] [■] [■] [■]                │ │ [■] [■] [·] [■] [■]                 │  │
│ │ [■] [■] [·] [■] [■]   ← cada celda │ │ ...                                 │  │
│ │ ...                   con sus pts  │ │                                     │  │
│ └────────────────────────────────────┘ └─────────────────────────────────────┘  │
│ ┌── ● Claude ───────────── [Abrir →] ┐ ┌── ● Backtesting manual ─ [Abrir →] ┐  │
│ │ −37,5 pts   −$85,20     5T / 5S    │ │   Sin jornadas en septiembre 2026   │  │
│ │ [🔒] = día sin registrar           │ │   Última: enero 2026 →              │  │
│ └────────────────────────────────────┘ └─────────────────────────────────────┘  │
│ ┌── Puntos acumulados del mes ──────────────────────────────────────────────┐   │
│ │  — Mío  — Chaumer  — Claude  — Manual (solo las que tengan datos)         │   │
│ └───────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**Cada cuadro:**

- **Cabecera:** punto de color, nombre y botón **Abrir →**. Clicar en cualquier parte del cuadro
  hace lo mismo.
- **Cifras:**
  - los **puntos** del mes, en grande y con el color de su signo;
  - el **P&L**, pequeño (en Chaumer y Claude con la marca *calc.*);
  - **T / S**, cada cifra con el color de su resultado, como la tarjeta de hoy.
- **Mini calendario:**
  - solo lunes a viernes, sin la columna de semana;
  - cada celda con el color del día (target, stop, sin entradas, no operó, 🔒) y sus puntos en
    pequeño;
  - sin iconos ni badges: es un vistazo, el detalle está al abrirlo.
- **Vacío:** "Sin jornadas en {mes}" y, si la fuente tiene datos en otro mes, un enlace a su
  último mes con datos, que mueve el mes de los cuatro. Es el caso del manual en 2026.

**Color de cada fuente** (tokens, sin hex nuevos):

| Fuente | Color |
|---|---|
| Mío | `accent` |
| Chaumer | `blue`, el mismo de su tarjeta en Otros |
| Claude | `violet` |
| Manual | neutro, como su tarjeta en Otros |

**Curva comparada:**

- Puntos acumulados día a día del mes, **una línea por fuente**, cada una en su color. Solo se
  dibujan las que tienen datos ese mes.
- Tooltip del día con las cuatro cifras.
- Mismo estilo que la curva de hoy (Chart.js, línea fina, último punto marcado), pero **sin**
  relleno verde/rojo: con varias líneas, el relleno lo ensucia.

### 4.2 Celular

Cuatro calendarios a ese ancho no se leen. Por debajo de 768 px, cada cuadro va a **ancho completo,
uno debajo de otro**, y el mini calendario pasa a una **tira de un color por día**. Las cifras de la
cabecera se quedan igual. Después viene la curva comparada.

## 5. La vista completa de cada calendario

### 5.1 Mío

**Es la pantalla de hoy**, con un solo cambio: **pasa a puntos**.

| Dónde | Hoy | Después |
|---|---|---|
| Celda del día | `+$58` | **`+29,5`** en grande y `+$58` pequeño debajo |
| Resumen de semana | `$` | puntos, con el `$` debajo |
| Total del mes | `$` | puntos, con el `$` al lado |
| Tarjeta 1 | *P&L Neto* `$` | **Puntos netos**, con el P&L real y el promedio por día debajo |
| Curva de equity | `$` acumulados | **puntos** acumulados. El tooltip muestra los dos, y la etiqueta final va en puntos |
| Recuadro al pasar el ratón | ya muestra puntos | añade el P&L del día |

Todo lo demás se queda igual: el orden de las tarjetas, Disciplina, Errores, Acierto, T/S, Días
conectados, el desglose, el filtro de cuentas, la vista del día al clicar y el recuadro al pasar el
ratón.

### 5.2 Chaumer, Claude y Manual — una sola vista para los tres

Los tres comparten **un mismo render**, construido con las mismas piezas que Mío: la clase
`.cal-cell` de las celdas, las tarjetas `.metric-card` con su filete superior, la curva y el
recuadro al pasar el ratón. **No se copia la pantalla de Mío**: está atada a sesiones, disciplina y
errores, que estas fuentes no tienen. Lo que se comparte son los componentes. Mejorar una celda o
la curva mejora las dos pantallas.

**Tarjetas** (4, en este orden):

| Tarjeta | Valor | Debajo |
|---|---|---|
| Puntos netos | pts | P&L (*calc.* en Chaumer y Claude) · promedio por operación |
| Acierto | % | "sobre N operaciones" |
| Targets / Stops | `T / S`, cada cifra en su color | Ratio T/S |
| Días operados | N | de M días hábiles |

**Sin** Disciplina, Errores ni desglose de días: ninguna de estas fuentes los tiene.

**Cuadrícula:** la de hoy (lunes a viernes, resumen semanal, total del mes), en puntos y con el P&L
debajo. Badges propios de cada fuente:

| Fuente | Badges |
|---|---|
| Chaumer | *No operó* (el motivo va en el recuadro) |
| Claude | *Sin operación* y **🔒 Registra tu día** |
| Manual | *Sin operación* (la jornada existe pero no tiene operación) |

Además, los festivos y FOMC de `catalogo_fechas`, igual que en Mío.

**Recuadro al pasar el ratón:**

| Fuente | Qué muestra |
|---|---|
| Chaumer | Fecha · Setup y hora · Puntos y P&L *calc.* · o el **motivo** si no operó |
| Claude | Fecha · Setup y hora · Puntos y P&L *calc.* · o "El motor no encontró operación" · o 🔒 |
| Manual | Fecha · Setup, dirección y hora · Puntos y P&L · observaciones, si hay |

**Clic en un día:**

- **En el celular**, muestra ese mismo recuadro, porque ahí no hay "pasar el ratón".
- **En Claude**, el recuadro lleva además **"Ver gráfico"**, que abre `grafico_url` en otra pestaña.
- **No abre la vista del día a pantalla completa**: esa es la de Kris, con su diario.

## 6. Navegación

- El botón **Calendario** abre siempre la **pantalla principal**, como pidió Kris. Es un clic más
  para llegar a Mío: asumido.
- **Dentro de una vista completa:**
  - la barra superior dice **"Calendario"**, y en el contexto **"Chaumer · Septiembre 2026"**;
  - aparece el chevron **‹** de la barra, que vuelve a la pantalla principal (el mismo que ya usan
    las subsecciones de Otros).
- **Las flechas de mes son una sola** para las cinco pantallas (la principal y las cuatro vistas):
  cambiar de mes en Chaumer y volver deja la principal en ese mes.
- **El filtro de cuentas** solo se ve en **Mío** y en la principal, y solo afecta a Mío.
- **Sigue habiendo 6 botones en el menú.** Nada nuevo en `Nav.PADRE`: todo vive dentro de
  `section-calendar`.

Para el chevron hace falta un gancho pequeño en `Nav`: `Nav.setVolver(fn)` muestra el chevron con
esa acción, y `Nav.setVolver(null)` lo quita. Hoy el chevron solo sabe volver a `PADRE`.

## 7. Archivos

```
ANTES                                   DESPUÉS
index.html     section-calendar         section-calendar = #calHub + #calMio (lo de hoy) + #calFuente
js/calendar.js celdas en $              celdas en puntos (§5.1); el mes lo pone Calendarios
js/metrics.js  P&L Neto $, curva $      Puntos netos, curva en puntos; la curva se vuelve reutilizable
                                          (serie + unidad) para la vista genérica
js/db.js       —                        getChaumerRango · getMotorRango · motorEstados ·
                                          (getBacktesting ya existe)
js/app.js      navBack solo a PADRE     + Nav.setVolver(fn); el boot sigue entrando por 'calendar'
—              —                        js/calendarios.js  NUEVO: mes compartido, las 4 fuentes
                                          traducidas al formato del §3, la pantalla principal, la
                                          vista genérica y la curva comparada
css/styles.css —                        .cal-hub · .hub-card · .hub-mini · vista genérica (con tokens)
sw.js          CACHE v9                 + js/calendarios.js en APP_SHELL, CACHE v10
docs/migrations/  —                     2026-09-29-motor-estados-rango.sql (función, sin tocar datos
                                          ni políticas)
js/dev.local.js   —                     fixtures de Chaumer, motor y backtesting (gitignoreado)
```

**No se borra nada.** Chaumer y Backtesting siguen en Otros, igual que hoy. Estos calendarios son
**otra forma de leer** los mismos datos, no su sustituto.

**Documentación al cerrar:**

- **D-032** en `docs/decisiones.md`: el calendario se lee en puntos, y el P&L de Chaumer y Claude se
  calcula con `bt_cabecera`.
- `CLAUDE.md`: `calendarios.js` en el mapa del código.
- `docs/migrations/INDICE.md`.
- El checkpoint del historial.

## 8. Plan por fases

Cada fase se verifica por separado y va en su commit.

| Fase | Qué | Cómo se verifica |
|---|---|---|
| **1 · Datos** | Migración `motor_estados`; `db.js` (3 funciones); fixtures del modo local | `SELECT motor_estados('2026-09-01','2026-09-30')`: 14 días. Cuántos devuelve `ok` y cuántos `bloqueada`, según qué días estén registrados. `node --check` |
| **2 · Pantalla principal** | Markup, `calendarios.js` (fuentes, mes compartido, cuadros, curva comparada), CSS, `Nav.setVolver`, navegación | Preview en escritorio y a 375 px, consola limpia. Los totales de septiembre de cada cuadro coinciden con el §3.2 |
| **3 · Vista de Chaumer, Claude y Manual** | Render genérico: tarjetas, cuadrícula, curva y recuadro | Totales de las tarjetas contra el `SELECT` del §3.2. Un mes de 2025 en el manual contra `bt_jornadas`. Un día 🔒 simulado |
| **4 · Mío en puntos** | Celdas, semana, total, tarjeta 1, curva y recuadro (§5.1) | Septiembre: −14,50 pts y +$43,88. El mismo número en la tarjeta, en el total del mes y en el cuadro de la principal |
| **5 · Cierre** | D-032, `CLAUDE.md`, INDICE, historial, `sw.js` | Commit y push |

Estimación: fases 2 y 3 de unas 20 llamadas cada una; 1 y 4 de unas 10.

## 9. Fuera de alcance

- **Julio y agosto del motor.** Los 11 días de julio (del 6 al 20) solo están como archivos en
  `chaumer/05_Backtesting/claude/`, y del 21-jul al 25-ago no los ha pasado el motor, aunque hay
  velas. Rellenarlos es pasar el motor por esos días y subir sus fichas con `subir_dia.py`: otro
  trabajo, con su propia decisión. Hasta entonces, el calendario de Claude empieza el **10-sep**.
- **Los 116 gráficos del backtesting manual de 2025** que no están en `bt_jornadas`: la bitácora
  tiene 115 jornadas, y el calendario muestra lo que haya en la bitácora.
- Comparar día a día con veredicto: ya lo hace Chaumer → *Diferencias*.

## 10. Lo que cambió al construirlo

Nada del diseño se descartó. Lo añadido, todo menor:

- **`fmtPuntos` y `puntosDeTrade` pasan a `db.js`**, junto a `fmtMiles` y `fmtDinero`: el calendario,
  los cuadros y las tarjetas suman y formatean los puntos con la misma función.
- **Las tarjetas compactas llevan una segunda línea visible** (`.metric-sec`) con el P&L: el `sub` de
  siempre está oculto en esa rejilla.
- **La curva comparada usa interpolación monótona**: con la curva suavizada normal, entre dos días la
  línea inventaba picos que no existieron.
- **Dos defectos que salieron al construirlo:**
  - La curva de "Mío" se pinta ahora con su contenedor oculto: con alto 0, el corte en cero daba NaN y
    reventaba la carga de la sección. Además, al abrir "Mío" se vuelve a pintar ya visible.
  - La rejilla del calendario se salía por la derecha en el móvil con textos largos: las columnas pasan a
    `minmax(0, 1fr)` y la leyenda a varias líneas. Vale también para "Mío".
- **El contexto de la barra** dice "Mío · Septiembre 2026" también en Mío. En el celular solo el mes,
  porque no cabe.

Las cifras de control del §3.2 coincidieron en la pantalla, en los cuadros y en la curva.
