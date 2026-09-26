# 5 · Riesgo, orden y gestión

> cuánto y hasta dónde

## R-28 · Máximo de operaciones por sesión

> Ejecuta como máximo una operación por sesión.

| | |
|---|---|
| Aplica a | Continuación · Reingreso |
| Parámetros | `OPS_POR_SESION` |
| Relacionadas | R-23 · R-29 · R-34 |
| Casos | — |

### Cómo se aplica

- **Órdenes llenadas por sesión ≤ `OPS_POR_SESION`.** El cupo se consume al llenarse la orden, acabe en objetivo o en stop.
- **Una orden colocada y no llenada NO consume el cupo.**
- Tras la primera orden llenada, **no se coloca ninguna orden más** esa sesión, aunque aparezcan setups válidos.

## R-29 · Caducidad de la orden pendiente

> Mantén la orden pendiente hasta que se llene, hasta que se agote el plazo de consecución, hasta que el precio vuelva al punto del stop, o hasta el fin de la ventana.

| | |
|---|---|
| Aplica a | Continuación · Reingreso |
| Parámetros | `PLAZO_CONSECUCION` · `CANCELACION_FINAL` |
| Relacionadas | R-02 · R-19 · R-20 · R-28 · R-32 |
| Casos | G-14 |

### Cómo se aplica

- **Se cancela al ocurrir lo PRIMERO de estas tres causas:**
  1. **Pasa el `PLAZO_CONSECUCION` desde el rompimiento sin que llegue la consecución** — es decir, sin que el precio alcance el nivel de la orden.
  2. **El precio vuelve al punto del stop**, tal como lo define `R-32`: el extremo alcanzado **desde que nació la zona** hasta la vela de rompimiento — no solo el extremo del retroceso que la originó.
  3. Es la hora de `CANCELACION_FINAL`.
- **NO cancela:** ⚠️ **la aparición de un retroceso nuevo.** Un retroceso nuevo deja la orden intacta.
- **🔑 La caducidad se comprueba ANTES del llenado.** Pasado el plazo la orden ya no existe y no puede llenarse, aunque el precio toque el nivel en esa misma vela.
- **🕯️ Cuando una misma vela toca el nivel de la orden y el stop,** se aplica el orden de la vela —el mismo de `R-19`, punto 6—: **vela azul, primero el mínimo; vela blanca, primero el máximo**. **Si llega antes al nivel de la orden, se llena**, y el stop puede saltar en esa misma vela. **Si llega antes al stop, la orden se cancela** sin llenarse.
- **Al cancelar:** se descarta el setup. **El cupo de `R-28` no se consume**: se puede esperar un setup nuevo dentro de la ventana de `R-02`.

### Por qué

**La vuelta al stop.** Las palabras del operador el 27/08/2026 fueron *"llega al mismo punto del retroceso, que sería el mismo punto del stop"* — entonces coincidían. Desde que `R-32` se corrigió pueden **no** coincidir, y **manda el punto del stop**.

**Un retroceso nuevo no cancela, caso real 9/07/2026:** orden puesta en la vela 8:43; cancelarla en la 8:45 por el retroceso nuevo era un error: con la regla correcta sigue viva y **se llena en la 8:46**, dentro del plazo.

**El orden de la vela, caso de origen 23/09/2026:** vela azul de 8:36 — baja a 30.922,00 y llena el corto en 30.925,75, después sube a 30.957,00 y salta el stop en 30.954,00. Palabras del operador: *"fue un stop válido, la vela primero bajó, hizo consecución y la misma vela después subió al stop"*. Leída al revés, la orden se habría cancelado y el día habría sido otro: **75,75 puntos** de diferencia.

## R-30 · Fin de ventana con posición abierta

> Una operación abierta se gestiona hasta stop o target, aunque termine la ventana operativa.

| | |
|---|---|
| Aplica a | Continuación · Reingreso |
| Parámetros | `VENTANA_OPERATIVA` |
| Relacionadas | R-02 · R-33 |
| Casos | — |

### Cómo se aplica

- **El fin de la `VENTANA_OPERATIVA` prohíbe abrir; no obliga a cerrar.** No existe cierre por tiempo.
- **Ninguna acción por hora:** solo el stop o el objetivo cierran la posición.

### Por qué

Consecuencia abierta: la sesión no tiene hora de cierre garantizada (`P-07`).

## R-31 · Configuración de ejecución (ATM `K1`)

> Ejecuta con la ATM `K1` al valor de `ATM_DEFECTO` y ajusta stop y target a mano tras el llenado, en ese orden.

| | |
|---|---|
| Aplica a | Continuación · Reingreso |
| Parámetros | `ATM_DEFECTO` · `STOP_MAX` · `CONTRATOS` |
| Relacionadas | R-04 · R-32 · R-33 |
| Casos | G-02 · G-07 · G-11 · G-12 |

### Cómo se aplica

- **La ATM:** **`K1`** · `CONTRATOS` · Auto Breakeven **OFF** · Auto Trail **OFF** · stop y objetivo provisionales en `ATM_DEFECTO`.
- **Filtro antes de enviar:** el stop estructural debe ser **≤ `STOP_MAX`**. La distancia se mide entre la **entrada** y el stop estructural de `R-32`: en la Continuación, el extremo alcanzado **desde que nació la zona** hasta la vela de rompimiento; en el Reingreso, el extremo de la **corrida fallida**. Si lo supera **aunque sea por 1 tick, no se opera**.
- **Tras el llenado:** 1º el stop a su referencia estructural · 2º el objetivo a 1:1 (`R-32`).
- **Una vez ajustados, stop y objetivo no se vuelven a mover** (`R-33`).

| | Qué es | Cuándo actúa |
|---|---|---|
| **`ATM_DEFECTO`** | stop provisional hasta el ajuste manual | **después** del llenado |
| **`STOP_MAX`** | filtro de entrada | **antes** de enviar |

### Por qué

🔑 **`ATM_DEFECTO` = `STOP_MAX` a propósito.** El stop provisional nunca debe ser más ajustado que el estructural: si lo fuera, el mercado podría sacar al operador de una operación todavía viva antes de que moviera el stop a mano. Si un día cambia `STOP_MAX`, hay que cambiar `ATM_DEFECTO` con él (`PARAMETROS.md`).

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
| **Reingreso** | punto **más bajo de la corrida fallida** (la que rompió la zona y no continuó) | punto **más alto de la corrida fallida** |

> 🔴 **No es solo el extremo del retroceso que originó la zona.** Cuenta **todo** lo que el precio haya hecho mientras la zona estuvo viva, hasta la vela de rompimiento. Si la zona aguanta muchas velas y el precio se aleja más que en su retroceso original, el stop se va con él.

**Los tres filtros que pueden anular la operación:**

| # | Comprobación | Aplica a |
|---|---|---|
| 1 | stop estructural ≤ `STOP_MAX` (`R-31`) | los dos setups |
| 2 | el objetivo 1:1 **libre de zonas vigentes** (`R-21`): camino de recorrido sin nada en contra | los dos setups |
| 3 | el objetivo 1:1 cabe dentro del **punto de referencia** (`R-41`) | solo Reingreso |

- Si **cualquiera** de los tres falla, **la entrada queda invalidada y no se opera**.

> 🔴 **El objetivo NUNCA se acorta para que quepa.** No existe media entrada ni ratio reducido.

### Por qué

**Caso real 7/07/2026:** el soporte de la vela 9:27 se rompe con la vela 9:36. El retroceso que lo originó (9:28–9:30) tenía su techo en 29.313,00, pero la vela 9:32 subió hasta **29.327,75**. Midiendo solo el retroceso, el riesgo habría sido de 71,50 pts; con todo lo que hizo el precio mientras la zona estuvo viva, es de **86,25 pts**, y **la entrada queda descartada por `STOP_MAX`**.

**Geometría:** el stop del Reingreso mide contra la corrida que rompió la zona y falló — al **otro lado** de la zona. Incluye el ancho de la zona entera, así que **tiende a ser mayor** que el de una Continuación: el filtro de `STOP_MAX` muerde más en Reingreso.

Palabras del operador: *"siempre el target debe estar libre de zonas o debe siempre tener espacio de recorrido sin nada en contra"*.

## R-33 · No se gestiona

> Una vez ajustados stop y target, **no se gestiona la posición. Nunca.**

| | |
|---|---|
| Aplica a | Continuación · Reingreso |
| Parámetros | — |
| Relacionadas | R-30 · R-31 · R-34 |
| Casos | G-11 · G-12 |

### Cómo se aplica

| Queda prohibido, sin excepción | |
|---|---|
| Mover el **stop** | ❌ en cualquier dirección |
| Mover el **objetivo** | ❌ en cualquier dirección |
| **Breakeven** manual | ❌ |
| **Cerrar a mano** | ❌ también si el precio no se mueve o va en contra |
| **Cierre parcial** | ❌ `R-31` fija `CONTRATOS`: no hay nada que partir |
| **Añadir** contratos | ❌ |
| **Cerrar por hora** | ❌ no existe · `R-30` |

**Solo hay dos salidas: stop u objetivo.** No hay una tercera. Se deja que el mercado defina el resultado.

### Por qué

> *"Después de una entrada, y después de ajustar stop y target a sus respectivos niveles, no se toca nada, jamás. Se deja que el mercado haga lo suyo y defina su respectivo resultado. Repito, jamás se gestiona."*
> — Operador, 24/08/2026

🔑 **Es la única regla del plan enunciada como prohibición absoluta**, sin excepciones. Y tiene un efecto que va más allá de la disciplina: convierte cada operación en un **experimento limpio**. Cuando se midan los resultados, medirán el setup — no la gestión. Sin esta regla, un plan mecánico no sería medible.

## R-34 · Al llenarse la orden termina el análisis del día

> Al llenarse la orden termina el **análisis** del día, no solo la operativa.

| | |
|---|---|
| Aplica a | Continuación · Reingreso |
| Parámetros | — |
| Relacionadas | R-28 · R-31 · R-33 |
| Casos | G-11 · G-12 |

### Cómo se aplica

- **Al llenarse:** se ajustan stop y objetivo (`R-31`) y se cierra el análisis. Solo queda esperar el resultado.
- **Prohibido después del llenado:** marcar zonas nuevas y buscar setups.
- **Al cerrar la operación:** bitácora, observaciones, pantallazo, y **cerrar NinjaTrader**.

### Por qué

Palabras del operador (26/08/2026): *"ya no marco más zonas, no hago más análisis, no hago nada más"*. Va más allá de `R-28` (no más órdenes) y de `R-33` (no tocar la posición): **prohíbe seguir analizando**. Sin esta regla, el operador podría seguir marcando zonas mientras ve acercarse su stop, que es el estado mental donde se rompen los planes.
