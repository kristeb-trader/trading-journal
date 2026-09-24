# PARÁMETROS DEL PLAN

> **Un solo sitio para los números que pueden cambiar.**
> Las reglas citan el **nombre** del parámetro, no el valor. Se cambia aquí y se propaga a todo el plan.

**Actualizado:** 2026-09-14 (b)

---

## Riesgo y ejecución

| Parámetro | Valor actual | Equivalencias | Dónde actúa | Desde |
|---|---|---|---|---|
| **`STOP_MAX`** | **80 puntos** | 320 ticks · **$160** en MNQ | **Filtro de entrada** (`R-31`, `R-32`): si el stop estructural lo supera **aunque sea por 1 tick**, no se opera | 24/08/2026 |
| **`ATM_DEFECTO`** | **320 ticks** | 80 puntos · $160 | Stop y target provisionales de la ATM `K1` hasta el ajuste manual (`R-31`) | 24/08/2026 |
| **`RATIO_TARGET`** | **1:1** | — | El target recorre la misma distancia que el stop (`R-32`) | 21/08/2026 |
| **`CONTRATOS`** | **1** MNQ | — | Tamaño de posición (`R-31`) | 21/08/2026 |
| **`OPS_POR_SESION`** | **1** llenada | — | `R-28` | 21/08/2026 |

> 🔴 **`STOP_MAX` es una línea dura, no una zona de aviso.** No hay margen de seguridad por debajo del tope: un stop de 79,75 pts se opera exactamente igual que uno de 30. No existe *"está muy cerca del límite, mejor la dejo"*. Confirmado por el operador el **01/09/2026** sobre el caso del 16/07 (75,50 pts = **94 %** del tope, operación tomada y ganada).

> 🔑 **`ATM_DEFECTO` = `STOP_MAX` a propósito.** El stop provisional **nunca** debe ser más ajustado que el estructural: si lo fuera, el mercado podría sacarte de una operación todavía viva antes de que muevas el stop a mano. Si un día cambia `STOP_MAX`, **hay que cambiar `ATM_DEFECTO` con él**.

## Estructura

| Parámetro | Valor actual | Dónde actúa |
|---|---|---|
| **`TICK`** | 0,25 puntos | umbral de rompimiento y consecución (`R-20`) |
| **`PLAZO_CONSECUCION`** | **5 velas — es un TOPE, no una espera obligatoria** *(`R-14`, precisada 01/09/2026)* | `R-20`, `R-25`, `R-10`, `R-11` y **`R-29`** (vida de la orden). 🔴 **Gobierna la geometría de la zona y la vida de la orden, NO el traspaso de la zona:** la consecución que invalida una zona **no tiene plazo** *(27/08/2026)*. 🔵 **Y se resuelve antes si el mercado arma una estructura completa en sentido contrario** — `R-14` *(01/09/2026)* |
| **`VENTANA_REINGRESO`** | **hasta que el precio supere el extremo de la vela de consecución** | `R-26`. El reingreso es **inmediato o no es**: en cuanto el precio sigue de largo, la ventana se cierra para siempre *(27/08/2026)* |
| **`UMBRAL_50`** | 50 % | zonas entre zonas (`R-12`) |

## Volumen y sesión

> 🔵 **`UMBRAL_VOL` es el único parámetro que el operador cambia a mano durante la vida del plan.** El resto se fijaron una vez. Éste depende de la volatilidad del momento, y por eso vive aquí y no dentro de la regla. **`P-37` cerrado el 14/09/2026 sin criterio medible, a propósito:** *"dejemos que quede paramétrico"*. Lo fija el operador, igual que `R-37` es criterio libre. 🔴 **La condición que lo hace seguro: el umbral NUNCA se cambia con la sesión empezada**, y cada cambio se anota con su fecha en la fila de abajo. Sin eso, el umbral se podría mover *después* de ver el día.
>
> El cambio del **14/09/2026** salió del test ciego: el 10/09 la vela más fuerte del premercado hizo **7.799** contratos. Con el umbral en 6.000 nacían cuatro soportes que desviaban todo el marcado de la mañana; con 8.000 el premercado no deja ninguna zona y el día se lee limpio.

| Parámetro | Valor actual | Dónde actúa |
|---|---|---|
| **`UMBRAL_VOL`** | **> 8.000 contratos en MNQ** *(desde 14/09/2026)* | `R-15` — solo premercado. **Parámetro ajustable, no un número fijo del método.** Historial: >2.000 en NQ hasta el 06/09/2026 · >6.000 en MNQ del 06/09 al 14/09/2026 · **>8.000 en MNQ desde el 14/09/2026**. Lo fija el operador, sin criterio medible y a propósito — ver `P-37`. **No se cambia con la sesión empezada.** La equivalencia entre umbrales **no está verificada** — ver `P-32` |
| **`PREMERCADO_INICIO`** | 19:00 hora Colombia (apertura de Tokio) | `R-15` |
| **`VENTANA_OPERATIVA`** | 09:30–11:30 ET | `R-02` |
| **`CANCELACION_FINAL`** | 11:29 ET | `R-29` |
| **`ORIGEN_DEL_STOP`** | desde que **nació la zona** hasta la vela de rompimiento | `R-32` — el stop es el extremo alcanzado en todo ese tramo, no solo el del retroceso que originó la zona *(27/08/2026)* |
| **`VENTANA_NOTICIA`** | ±5 minutos | `R-35` |

---

## Consecuencias de riesgo de `STOP_MAX = 80`

Sobre la cuenta objetivo de **$3.000**:

| | |
|---|---|
| Riesgo por operación | **$160** |
| Porcentaje del capital | **5,3 %** |
| Pérdida máxima diaria (`R-28`: 1 operación) | **5,3 %** |
| Cuatro sesiones perdedoras seguidas | **−21 %** |

**Aceptado explícitamente por el operador el 24/08/2026.** Ver `P-08`.

> Con `RATIO_TARGET` = 1:1, el win rate de equilibrio depende del tamaño del stop, no de este tope. Ver `P-12`.
