# 5 · Riesgo, orden y gestión

> cuánto y hasta dónde

## R-28 · Una operación, la primera que se llene, y ahí termina el día

> Opera el **primer setup válido** cuya orden se llene, y solo ése: como máximo `OPS_POR_SESION`. Al llenarse la orden **termina el día**: la operativa y el análisis.

| | |
|---|---|
| Aplica a | Continuación · Reingreso |
| Parámetros | `OPS_POR_SESION` |
| Relacionadas | R-29 · R-31 · R-33 |
| Casos | G-11 · G-12 · G-22 |
| Absorbe | R-23 · R-34 |

### Cómo se aplica

- **El primero, sin comparar:** en orden cronológico, se opera el primer setup que cumpla todas las condiciones. **Prohibido** compararlo con setups posteriores o esperar uno mejor.
- **El cupo:** órdenes llenadas por sesión ≤ `OPS_POR_SESION`. Se consume **al llenarse** la orden, acabe en objetivo o en stop. **Una orden colocada y no llenada NO consume el cupo.**
- **Al llenarse:** se ajustan stop y objetivo (`R-31`) y se cierra el análisis. Solo queda esperar el resultado.
- **Prohibido después del llenado:** colocar otra orden —aunque aparezcan setups válidos—, marcar zonas nuevas y buscar setups. El resto de la sesión se ignora.
- **Al cerrar la operación:** bitácora, observaciones, pantallazo, y **cerrar NinjaTrader**.

### Excepciones

- Un setup válido cuya orden caduque sin llenarse (`R-29`) **no consume el cupo ni bloquea los siguientes**: se puede esperar otro setup dentro de la ventana.

### Por qué

Palabras del operador (26/08/2026): *"ya no marco más zonas, no hago más análisis, no hago nada más"*. La regla va más allá de no abrir otra orden y de no tocar la posición (`R-33`): **prohíbe seguir analizando**. Sin ella, el operador podría seguir marcando zonas mientras ve acercarse su stop, que es el estado mental donde se rompen los planes.

## R-29 · Caducidad de la orden pendiente

> Mantén la orden pendiente hasta que se llene, hasta que se agote el plazo de consecución, hasta que el precio vuelva al punto del stop, o hasta el fin de la ventana.

| | |
|---|---|
| Aplica a | Continuación · Reingreso |
| Parámetros | `PLAZO_CONSECUCION` · `CANCELACION_FINAL` |
| Relacionadas | R-02 · R-09 · R-20 · R-28 · R-32 |
| Casos | G-14 |

### Cómo se aplica

- **Se cancela al ocurrir lo PRIMERO de estas tres causas:**
  1. **Pasa el `PLAZO_CONSECUCION` desde el rompimiento sin que llegue la consecución** — es decir, sin que el precio alcance el nivel de la orden.
  2. **El precio vuelve al punto del stop**, tal como lo define `R-32`: el extremo alcanzado **desde que nació la zona** hasta la vela de rompimiento — no solo el extremo del retroceso que la originó. **Salvo la orden que salió de un retroceso nuevo** (`R-32`, plan 3.64): si el precio pasa su stop, el retroceso sigue y el stop va con él; se cancela solo si con el stop nuevo ya no se cumplen las reglas.
  3. Es la hora de `CANCELACION_FINAL`.
- **NO cancela:** ⚠️ **la aparición de un retroceso nuevo.** Un retroceso nuevo deja la orden intacta. Si el stop del rompimiento ya cabía, el del retroceso nuevo también vale: el operador elige cuál toma (plan 3.64); el bot se queda con la orden que ya puso.
- **🔑 La caducidad se comprueba ANTES del llenado.** Pasado el plazo la orden ya no existe y no puede llenarse, aunque el precio toque el nivel en esa misma vela.
- **🕯️ Cuando una misma vela toca el nivel de la orden y el stop,** se aplica el orden de la vela —el mismo que decide qué vela sostiene la zona (`R-09`)—: **vela azul, primero el mínimo; vela blanca, primero el máximo**. **Si llega antes al nivel de la orden, se llena**, y el stop puede saltar en esa misma vela. **Si llega antes al stop, la orden se cancela** sin llenarse.
- **Al cancelar:** se descarta el setup. **El cupo de `R-28` no se consume**: se puede esperar un setup nuevo dentro de la ventana de `R-02`.

### Por qué

**La vuelta al stop.** Las palabras del operador el 27/08/2026 fueron *"llega al mismo punto del retroceso, que sería el mismo punto del stop"* — entonces coincidían. Desde que `R-32` se corrigió pueden **no** coincidir, y **manda el punto del stop**.

**Un retroceso nuevo no cancela, caso real 9/07/2026:** orden puesta en la vela 8:43; cancelarla en la 8:45 por el retroceso nuevo era un error: con la regla correcta sigue viva y **se llena en la 8:46**, dentro del plazo.

**El orden de la vela, caso de origen 23/09/2026:** vela azul de 8:36 — baja a 30.922,00 y llena el corto en 30.925,75, después sube a 30.957,00 y salta el stop en 30.954,00. Palabras del operador: *"fue un stop válido, la vela primero bajó, hizo consecución y la misma vela después subió al stop"*. Leída al revés, la orden se habría cancelado y el día habría sido otro: **75,75 puntos** de diferencia.

## R-31 · Configuración de ejecución (ATM `K1`)

> Ejecuta con la ATM `K1` al valor de `ATM_DEFECTO` y ajusta stop y target a mano tras el llenado, en ese orden.

| | |
|---|---|
| Aplica a | Continuación · Reingreso |
| Parámetros | `ATM_DEFECTO` · `STOP_MAX` · `RIESGO_MAX` |
| Relacionadas | R-04 · R-32 · R-33 |
| Casos | G-02 · G-07 · G-11 · G-12 |

### Cómo se aplica

- **La ATM:** **`K1`** · los contratos de `R-04` · Auto Breakeven **OFF** · Auto Trail **OFF** · stop y objetivo provisionales en `ATM_DEFECTO`, que depende de los contratos: **cantidad y stop provisional se ponen antes de enviar la orden**.
- **Filtro antes de enviar:** el stop estructural debe ser **≤ `STOP_MAX`**. La distancia se mide entre la **entrada** y el stop estructural de `R-32`: en la Continuación, el extremo alcanzado **desde que nació la zona** hasta la vela de rompimiento; en el Reingreso, el extremo del **último retroceso** antes del rompimiento (plan 3.62). Si lo supera **aunque sea por 1 tick, no se opera** — en esa vela: dentro del plazo de consecución puede llegar un **retroceso nuevo** con un stop que sí quepa (`R-32`, plan 3.64).
- **Tras el llenado:** 1º el stop a su referencia estructural · 2º el objetivo a 1:1 (`R-32`).
- **Una vez ajustados, stop y objetivo no se vuelven a mover** (`R-33`).

| | Qué es | Cuándo actúa |
|---|---|---|
| **`ATM_DEFECTO`** | stop provisional hasta el ajuste manual | **después** del llenado |
| **`STOP_MAX`** | filtro de entrada | **antes** de enviar |

### Por qué

🔑 **`ATM_DEFECTO` = `STOP_MAX` ÷ contratos, a propósito.** Cumple dos cosas a la vez. El stop provisional **nunca es más ajustado que el estructural** —si lo fuera, el mercado podría sacar al operador de una operación todavía viva antes de que moviera el stop a mano—: como los contratos se redondean hacia abajo (`R-04`), el stop estructural siempre cabe dentro. Y **nunca arriesga más de `RIESGO_MAX`**, ni siquiera antes del ajuste. Decisión del operador (05/10/2026): con varios contratos, un stop provisional de `STOP_MAX` habría arriesgado $160 por cada uno hasta ajustarlo. Si un día cambia `STOP_MAX`, hay que cambiar `ATM_DEFECTO` con él (`PARAMETROS.md`).

Riesgo residual aceptado: la ventana de exposición manual tras el llenado, hasta que se ajustan stop y objetivo (`P-09`).

## R-32 · Stop y target

> Ancla la regla en el nivel de entrada, mide el stop hasta su referencia estructural y pon el target a esa misma distancia.

| | |
|---|---|
| Aplica a | Continuación · Reingreso |
| Parámetros | `RATIO_TARGET` · `STOP_MAX` · `ORIGEN_DEL_STOP` |
| Relacionadas | R-21 · R-26 · R-31 · R-41 |
| Casos | G-01 · G-02 · G-03 · G-04 · G-05 · G-06 · G-07 · G-08 · G-09 · G-10 · G-12 · G-15 |

### Cómo se aplica

| Paso | |
|---|---|
| **1** | La regla se ancla en el **nivel de entrada** (la consecución) |
| **2** | Se mide el stop hasta su referencia estructural |
| **3** | El objetivo recorre **esa misma distancia** al otro lado — `RATIO_TARGET` |

**Dónde va el stop** (`ORIGEN_DEL_STOP`):

| Setup | Alcista (compra) | Bajista (venta) |
|---|---|---|
| **Continuación** | punto **más bajo alcanzado desde que nació la zona hasta el rompimiento** | punto **más alto alcanzado desde que nació la zona hasta el rompimiento** |
| **Reingreso** (formas a, b y c) | **mínimo del último retroceso** antes del rompimiento | **máximo del último retroceso** antes del rompimiento |

> 🔄 **Reingreso, desde la 3.62 (16/11/2026):** *"el extremo del último retroceso, para todos los reingresos"*. Hasta la 3.61 iba en el extremo de la corrida fallida (forma a) o en el de la Continuación (forma b). Si el precio fue más allá después de ese retroceso, el stop va con él.

> 🔴 **No es solo el extremo del retroceso que originó la zona.** Cuenta **todo** lo que el precio haya hecho mientras la zona estuvo viva, hasta la vela de rompimiento. Si la zona aguanta muchas velas y el precio se aleja más que en su retroceso original, el stop se va con él.

**Los cuatro filtros que pueden anular la operación:**

| # | Comprobación | Aplica a |
|---|---|---|
| 1 | stop estructural ≤ `STOP_MAX` (`R-31`) | los dos setups |
| 2 | el objetivo 1:1 **libre de zonas vigentes** (`R-21`): camino de recorrido sin nada en contra | los dos setups |
| 3 | el objetivo 1:1 cabe dentro del **punto de referencia** (`R-41`) | solo Reingreso |
| 4 | hay una **zona activa más allá del objetivo**, en la dirección de la operación: una zona a la que ir a testear (`R-26`, plan 3.47) | solo Reingreso |

- Si **cualquiera** de los tres falla, **la entrada queda invalidada y no se opera**.

**🔁 El retroceso nuevo trae un stop nuevo** *(plan 3.64, 18/11/2026)*. Vale para la Continuación y para el Reingreso.

| Paso | |
|---|---|
| **1** | Hay rompimiento, pero el stop **pasa de `STOP_MAX`**: en esa vela no se opera |
| **2** | Dentro del `PLAZO_CONSECUCION`, contado desde la vela de rompimiento, una vela **no hace la consecución y hace un retroceso nuevo** (`R-06`): alcista, su mínimo baja del de la vela anterior; bajista, su máximo sube del de la anterior |
| **3** | El **extremo de ese retroceso es el stop nuevo**. La **entrada no cambia**: la consecución de la vela de rompimiento |
| **4** | Si con el stop nuevo se cumplen **todas las reglas del setup** —`STOP_MAX`, objetivo 1:1 libre de zonas y, en el Reingreso, punto de referencia y zona a la que ir—, la orden se pone al cierre de esa vela. Lo que decide el setup sigue siendo a dónde va el objetivo (`R-26`) |

- **El retroceso puede durar varias velas**: el stop va con él, a su extremo, mientras siga dentro del plazo y cumpla las reglas. Si la orden ya está puesta y el precio pasa su stop sin llenarla, el stop se mueve con el retroceso; si con el stop nuevo ya no cumple, se cancela (`R-29`).
- **Pasado el plazo, la entrada se invalida.** Y si la consecución llega antes de que el stop cumpla, ese rompimiento ya no da entrada.
- **Si el primer stop ya cabía**, el del retroceso nuevo también vale: el operador elige el que considere menos arriesgado. El bot se queda con la orden que ya puso.

Caso de origen, 18/11/2026: la resistencia de la 9:40 (27.104,75 – 27.129,00); la 9:55 la rompe hacia arriba (máx 27.148,25) y arriba queda la resistencia de la 9:32, ya cotizada: Reingreso alcista. Con el stop en el último retroceso (la 9:51, 26.951,75) el riesgo es de 196,75. La 9:56 hace un retroceso nuevo hasta 27.061,00; la 9:57 da la consecución: entrada 27.148,50, stop 27.061,00, riesgo 87,50, objetivo 27.236,00 → TARGET a las 9:59. Palabras del operador: *"si después de un rompimiento hace un nuevo retroceso que favorece mi riesgo yo puedo usar ese nuevo riesgo para el stop y la entrada sigue siendo la misma"*; sobre varias velas: *"no pasa nada, mientras esté dentro del rango de [`PLAZO_CONSECUCION`], porque de lo contrario la entrada ya se invalida"*; y si el primer stop ya cabía: *"cualquiera de los dos es válido"*. Medido en los 95 días con datos, revisado por el operador: con el tope de 80 cambian dos operaciones —12/11 (Continuación +27,75 → Reingreso bajista 10:07, −57,50) y 29/07 (Reingreso −46,75 → Reingreso 9:06, −39,25)—; con el de 100 de su operativa, además el 18/11 (+87,50), el 5/11 (+50,25 → +88,50) y el 31/07 (+61,25 → −89,75).

> 🔴 **El objetivo NUNCA se acorta para que quepa.** No existe media entrada ni ratio reducido.

### Por qué

**Caso real 7/07/2026:** el soporte de la vela 9:27 se rompe con la vela 9:36. El retroceso que lo originó (9:28–9:30) tenía su techo en 29.313,00, pero la vela 9:32 subió hasta **29.327,75**. Midiendo solo el retroceso, el riesgo habría sido de 71,50 pts; con todo lo que hizo el precio mientras la zona estuvo viva, es de **86,25 pts**, y **la entrada queda descartada por `STOP_MAX`**.

**Geometría:** hasta la 3.61, el stop del Reingreso medía contra la corrida que rompió la zona y falló —al **otro lado** de la zona, con el ancho de la zona entera—, y `STOP_MAX` lo descartaba a menudo. Desde la 3.62 va en el último retroceso: el 16/11 el stop desde el rompimiento fallido habría sido de unos 200 puntos, y en el último retroceso fue de 68,50.

Palabras del operador: *"siempre el target debe estar libre de zonas o debe siempre tener espacio de recorrido sin nada en contra"*.

## R-33 · Tres salidas: stop, objetivo o cierre por hora

> Una vez ajustados stop y target, **no se gestiona la posición. Nunca.** Solo la cierran el stop o el objetivo, **aunque termine la ventana operativa**, y si a la hora de `CIERRE_POR_HORA` sigue abierta, el cierre por hora.

| | |
|---|---|
| Aplica a | Continuación · Reingreso |
| Parámetros | `VENTANA_OPERATIVA` · `CIERRE_POR_HORA` |
| Relacionadas | R-02 · R-28 · R-31 |
| Casos | G-11 · G-12 |
| Absorbe | R-30 |

### Cómo se aplica

| Queda prohibido, sin excepción | |
|---|---|
| Mover el **stop** | ❌ en cualquier dirección |
| Mover el **objetivo** | ❌ en cualquier dirección |
| **Breakeven** manual | ❌ |
| **Cerrar a mano** | ❌ también si el precio no se mueve o va en contra |
| **Cierre parcial** | ❌ aunque haya varios contratos (`R-04`): entran y salen todos juntos |
| **Añadir** contratos | ❌ |

- **El fin de la `VENTANA_OPERATIVA` prohíbe abrir; no obliga a cerrar.** Una operación abierta sigue hasta stop u objetivo aunque la ventana haya terminado.
- **Si a la hora de `CIERRE_POR_HORA` sigue abierta, se cierra a mercado al terminar esa vela** *(09/10/2026)*. Es la tercera salida y la única que no es un nivel: no la decide nadie, la decide el reloj. Se apunta como **CIERRE POR HORA**, con los puntos que haya —ganando o perdiendo—, medidos con el cierre de esa vela. Si el stop o el objetivo se tocan dentro de esa misma vela, mandan ellos.
- **Solo hay tres salidas: stop, objetivo o cierre por hora.** No hay una cuarta. Hasta esa hora, se deja que el mercado defina el resultado.

### Por qué

> *"Después de una entrada, y después de ajustar stop y target a sus respectivos niveles, no se toca nada, jamás. Se deja que el mercado haga lo suyo y defina su respectivo resultado. Repito, jamás se gestiona."*
> — Operador, 24/08/2026

🔑 **Es la única regla del plan enunciada como prohibición absoluta**, sin excepciones. Y tiene un efecto que va más allá de la disciplina: convierte cada operación en un **experimento limpio**. Cuando se midan los resultados, medirán el setup — no la gestión. Sin esta regla, un plan mecánico no sería medible.

**El cierre por hora, 09/10/2026.** Palabras del operador: *"si algún día se presenta un trade que siga abierto, se debe cerrar 10 minutos antes del cierre"* — el cierre de la sesión de futuros del CME, a las 17:00 de Nueva York. Caso de origen: la Continuación bajista del 09/10 se llenó a las 8:45 y siguió abierta hasta las 13:24 hora Colombia. Sin hora límite, una operación podía cruzar el cierre de la sesión y seguir de un día para otro. El experimento sigue limpio: el cierre es mecánico, a una hora fija, sin que nadie decida nada. Cierra el pendiente de la sesión sin hora de cierre garantizada (`P-07`).
