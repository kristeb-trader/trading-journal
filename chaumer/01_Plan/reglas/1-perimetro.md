# 1 · Perímetro operativo

> qué, cuándo y con qué

## R-01 · Instrumento, gráfico y timeframe

> Analiza, marca zonas y ejecuta **todo sobre MNQ**. Un solo gráfico.

| | |
|---|---|
| Aplica a | Continuación · Reingreso |
| Parámetros | `TICK` |
| Relacionadas | R-03 |
| Casos | — |

### Cómo se aplica

- **Un solo gráfico:** MNQ en velas japonesas de **1 minuto**. Es el único timeframe que decide.
- **Todo sobre ese gráfico:** se marcan las zonas, se lee el volumen, se leen los niveles de entrada, stop y objetivo, y se envía la orden.
- **Los niveles salen del gráfico de MNQ:** se lee el máximo (largo) o el mínimo (corto) real de la vela y se le aplica el desplazamiento de un `TICK`.
- **Valores de MNQ:** $2,00 por punto · un `TICK` = $0,50.

### Por qué

Antes se analizaba y se leía el volumen en NQ y se ejecutaba en MNQ, con dos gráficos y un desfase de hasta 3 ticks entre ambos. Con todo en MNQ, ese desfase deja de existir.

El backtesting histórico se hizo con datos de NQ y **no se rehace**: las reglas son las mismas, y el operador lo acepta explícitamente.

## R-02 · Ventana operativa

> Opera únicamente durante los 120 minutos siguientes a la apertura de la sesión americana.

| | |
|---|---|
| Aplica a | Continuación · Reingreso |
| Parámetros | `VENTANA_OPERATIVA` |
| Relacionadas | R-15 · R-29 |
| Casos | G-11 |

### Cómo se aplica

- **La ventana:** `VENTANA_OPERATIVA`, en hora de Nueva York. Fuera de ella no se coloca ninguna orden: ni antes del inicio ni después del fin.
- **En pantalla:** el gráfico de NinjaTrader está en **hora Colombia (UTC−5 fijo; `P-02`, opción B)**, así que la ventana se ve a las **08:30–10:30** en el horario de verano de Nueva York y a las **09:30–11:30** en el de invierno. Próximo cambio: **1 de noviembre de 2026**.
- **El ancla es la apertura americana**, nunca el número del reloj en pantalla.

#### Horarios de mercado en hora Colombia

Colombia es **UTC−5 fijo**: no aplica horario de verano. Todo lo demás se mueve alrededor.

| Época | Chicago (CT) | Nueva York (ET) |
|---|---|---|
| **Verano EE. UU.** *(mar–oct)* | = hora Colombia | Colombia **+1** |
| **Invierno EE. UU.** *(nov–mar)* | Colombia **−1** | = hora Colombia |

**Futuros CME Globex — NQ / MNQ**

| Evento | CT | Col — verano | Col — invierno |
|---|---|---|---|
| Apertura semanal (domingo) | 17:00 | 17:00 dom | 16:00 dom |
| Pausa diaria de mantenimiento | 16:00–17:00 | 16:00–17:00 | 15:00–16:00 |
| Cierre semanal (viernes) | 16:00 | 16:00 | 15:00 |

**Sesiones de efectivo**

| Mercado | Hora local | Col — verano | Col — invierno |
|---|---|---|---|
| Sídney (ASX) | 10:00–16:00 | 19:00–01:00 | 18:00–00:00 |
| **Tokio (TSE)** | 09:00–15:30 JST | **19:00–01:30** | **19:00–01:30** |
| Londres (LSE) | 08:00–16:30 | 02:00–10:30 | 03:00–11:30 |
| Fráncfort (Xetra) | 09:00–17:30 | 02:00–10:30 | 03:00–11:30 |
| NY — premercado acciones | 04:00 ET | 03:00 | 04:00 |
| **NY — apertura efectivo** | 09:30 ET | **08:30** | **09:30** |
| **Ventana operativa** | 09:30–11:30 ET | **08:30–10:30** | **09:30–11:30** |
| NY — cierre efectivo | 16:00 ET | 15:00 | 16:00 |

> 📌 **Tokio no se mueve nunca.** Japón no tiene horario de verano y Colombia tampoco: **19:00 Col es fijo las 52 semanas**. Por eso el inicio de la ventana de premercado (`R-15`) es el único ancla temporal del plan inmune al cambio de hora.

> ⚠️ **La semana de descuadre (`P-02`).** Europa cambia el **25 oct 2026**; EE. UU. el **1 nov 2026**. En esa semana Londres ya está en invierno y Nueva York todavía en verano: Londres abre a las 03:00 Col mientras NY sigue abriendo a las 08:30 Col. Es la única semana del año en que las dos columnas se mezclan.

**Fuentes:** [CME Group — Holiday and Trading Hours](https://www.cmegroup.com/trading-hours.html) · [CME Trading Hours 2026 (CrossTrade)](https://crosstrade.io/blog/cme-trading-hours-2026)

## R-03 · Plantilla de gráfico

> Opera con un gráfico limpio: velas de 1 minuto y volumen, nada más.

| | |
|---|---|
| Aplica a | Continuación · Reingreso |
| Parámetros | — |
| Relacionadas | R-01 · R-15 |
| Casos | — |

### Cómo se aplica

- **Único indicador:** **Volume Up Down** (NinjaTrader), sobre el gráfico de MNQ (`R-01`). El umbral de volumen del premercado se lee sobre esa barra, en la vela de 1 minuto.
- **Prohibido:** medias, osciladores, VWAP y perfil de volumen.
- **No se añade ninguna herramienta** al gráfico sin revisar antes este plan.

## R-04 · Tamaño de posición

> Opera siempre con `CONTRATOS`. El tamaño no cambia por capital, racha ni convicción.

| | |
|---|---|
| Aplica a | Continuación · Reingreso |
| Parámetros | `CONTRATOS` |
| Relacionadas | — |
| Casos | — |

### Cómo se aplica

- **Siempre `CONTRATOS`.** No sube aunque la cuenta crezca; no baja aunque la cuenta caiga.
- **Revisión anual:** es el único momento en que se evalúa cambiar el número de contratos.

### Por qué

Queda una consecuencia aritmética sin resolver: con tamaño fijo, el riesgo **porcentual** crece a medida que la cuenta cae. Ver `P-21`.
