# 2 · Estructura del precio

> el vocabulario

## R-05 · Corrida (= impulso)

> Una corrida (= impulso) es la secuencia de velas que arranca cuando una vela supera el extremo de la anterior y termina en la primera vela que retrocede al menos 1 tick contra ella.

| | |
|---|---|
| Aplica a | Continuación · Reingreso |
| Parámetros | `TICK` |
| Relacionadas | R-06 · R-07 |
| Casos | G-11 · G-12 |

### Cómo se aplica

- **Corrida alcista:**
  - **Nace:** `máximo[n] > máximo[n−1]`. La forman la vela `n−1` (**origen**) y la vela `n`.
  - **Tamaño mínimo:** **2 velas**. **Tamaño máximo:** **ninguno** — la sobreextensión no es un parámetro operativo, es contextualización (`C-01`).
  - **Vive mientras:** `mínimo[n] ≥ mínimo[n−1]`. El **color de la vela es irrelevante**.
  - **No se exige** que cada vela haga máximos más altos. Una **vela interior no corta**.
  - **Empate:** `mínimo[n] = mínimo[n−1]` → **no corta**.
  - **Muere:** `mínimo[n] ≤ mínimo[n−1] − 1 TICK`. Esa vela es ya **la primera del retroceso**.
- **Corrida bajista (espejo):** nace con `mínimo[n] < mínimo[n−1]` · vive mientras `máximo[n] ≤ máximo[n−1]` · muere con `máximo[n] ≥ máximo[n−1] + 1 TICK`.
- **Primero la corrida:** se identifican su inicio y su fin antes de evaluar el retroceso.
- **En NinjaTrader:** a ojo sobre el gráfico de 1 minuto de MNQ, comparando extremos de velas consecutivas. Sin indicadores.
- **Terminología:** «corrida» e «impulso» son sinónimos. **El plan usa solo «corrida».**

### Por qué

> **Nace mirando máximos, muere mirando mínimos.** Dos criterios distintos, intencionadamente.

#### Casos frontera resueltos

| Caso | Resolución |
|---|---|
| Vela roja dentro de corrida alcista | **No corta** — el color es irrelevante |
| Vela interior (máximo más bajo + mínimo más alto) | **No corta** — todavía no hay retroceso |
| Mínimos exactamente idénticos | **No corta** — hace falta ≥1 tick por debajo |

No existe tope de velas: el propio Chaumer (nota de voz del 24/08/2026) confirma que la sobreextensión no es un parámetro operativo sino un elemento de contextualización.

Diagrama: `../02_Assets/diagramas/R-05_corrida.png`

## R-06 · Retroceso

> El retroceso es la secuencia de velas que arranca en la vela que mata la corrida y termina cuando nace la siguiente corrida.

| | |
|---|---|
| Aplica a | Continuación · Reingreso |
| Parámetros | `TICK` · `STOP_MAX` |
| Relacionadas | R-05 · R-31 · R-32 · R-41 |
| Casos | G-11 · G-12 |

### Cómo se aplica

- **Tras una corrida alcista:**
  - **Empieza:** primera vela con `mínimo[n] ≤ mínimo[n−1] − 1 TICK`. **Termina:** primera vela con `máximo[n] > máximo[n−1]`.
  - **🎯 Su nivel de referencia = el mínimo MÁS BAJO de todas las velas del retroceso.** No el de la primera, no el de la última.
  - **Color irrelevante:** una vela verde dentro del retroceso no lo termina si no hace máximo más alto.
- **Tras una corrida bajista (espejo):** empieza con `máximo[n] ≥ máximo[n−1] + 1 TICK` · termina con `mínimo[n] < mínimo[n−1]` · su nivel de referencia es el **máximo más alto**.
- **Número de velas:** irrelevante, sin mínimo ni máximo. **Tamaño mínimo:** ninguno (`P-12`). **Tamaño máximo:** ≤ `STOP_MAX` (`R-31`).
- **El nivel de referencia define el retroceso, no el stop.** El stop se mide con `R-32`: el extremo alcanzado **desde que nació la zona** hasta la vela de rompimiento — no solo el extremo del retroceso que la originó.

### Por qué

> **El suelo de $40 de la guía v4 desaparece.** Solo sobrevive el techo. Coste cuantificado en `P-12`: con R:R 1:1, un retroceso de 5 pts exige **57,5 %** de aciertos para no perder; uno de 60 pts, **50,6 %**.

Diagrama: `../02_Assets/diagramas/R-06_retroceso.png`

## R-07 · La vela de apertura: origen sí, sesgo no

> La primera vela de la ventana operativa —la **08:31** hora Colombia en el horario de verano de EE. UU., la **09:31** en el de invierno— **declara la dirección inicial de la sesión con su propio cuerpo**, y es la vela origen. Cierre por encima de su apertura → el mercado **inicia alcista**. Cierre por debajo → **inicia bajista**. Esa dirección dice por dónde empieza el día, pero **no obliga a operar en ese sentido durante toda la sesión**.

| | |
|---|---|
| Aplica a | Continuación · Reingreso |
| Parámetros | `VENTANA_OPERATIVA` |
| Relacionadas | R-05 · R-06 · R-40 |
| Casos | G-12 · G-14 |
| Fuente | el sesgo: operador, caso 9/07/2026 |
| Pendiente | cuánto pesa la «mayor favorabilidad» del sentido de la apertura: el operador pidió dejarlo para la fase de contexto (`C-11`) |
| Absorbe | R-27 · R-08 |

### Cómo se aplica

- **Las velas anteriores a la ventana son premercado** —la 08:30 y anteriores en verano; la 09:30 y anteriores en invierno—. No sirven como `n−1` para `R-05` ni para `R-06`, ni para nada.
- **La dirección NO la declara la vela siguiente.** La declara la propia vela de apertura, por la posición de su cierre respecto de su apertura — salvo si la vela de apertura no tiene cuerpo:
- **Vela de apertura sin cuerpo** (cierra donde abrió): no declara dirección. La declara **la primera vela siguiente que pase de su máximo o de su mínimo**: si pasa del **máximo**, el día inicia **alcista**; si pasa del **mínimo**, **bajista**. Las velas que se quedan dentro de su rango no dicen nada.
- **Si esa vela pasa de los dos**, manda lo que hizo **primero**, según su color, igual que en el resto del plan: vela **azul**, primero el mínimo → **bajista**; vela **blanca**, primero el máximo → **alcista**.
- **La vela de apertura sigue siendo la vela origen** también sin cuerpo: la corrida se mide desde su **máximo** si el día inicia bajista, o desde su **mínimo** si inicia alcista.
- **Es la vela origen.** La corrida se mide desde su **mínimo** si es alcista, desde su **máximo** si es bajista.
- Desde la vela siguiente en adelante manda `R-05` con normalidad, comparando **siempre contra la vela inmediatamente anterior**.
- **Puede sostener zona** como cualquier otra vela.
- **No sesga la jornada: se buscan entradas de continuación en los dos sentidos.** Cada tramo, suba o baje, deja su zona al terminar, y esa zona sirve para entrar **a favor de ese tramo**: una zona nacida al final de una subida se opera larga cuando se rompe hacia arriba; una nacida al final de una bajada, corta cuando se rompe hacia abajo.

### Por qué

**Casos reales:** 06/07, 07/07 y 10/07 de 2026 — las tres sesiones abren con la 08:31 alcista, y las zonas ya validadas por el operador salen idénticas con esta redacción.

**Origen sí, sesgo no.** Palabras del operador (27/08/2026): *"la dirección de la vela de apertura no quiere decir que toda la jornada va a ser en esa dirección, solo da el mayor grado de favorabilidad a un trade IRI en la apertura, pero no quiere decir que se sesgue y no pueda operar un trade IRI en dirección contraria."*

**Sin cuerpo** (28/09/2026, cierra `P-23`). En las 60 jornadas con datos no ha pasado ninguna vez; lo más cerca, el 17/09, con un tick de cuerpo. Decidido por el operador sobre dos ejemplos dibujados: *"la dirección la da la vela siguiente"*, comparándose con la vela de apertura, y la corrida se mide desde la vela de apertura. Si la siguiente pasa de los dos extremos: *"sería bajista, porque en la vela de las 08:32 lo primero que hizo fue bajar, entonces el precio inicia bajista y luego sube"* (vela azul). Si se queda dentro: *"la segunda vela no dice nada, pero la tercera fue alcista, entonces el precio inicia alcista"* — alcista porque **pasó del máximo** de la vela de apertura, no por su color.

**Absorbe a la antigua regla de la vela envolvente sin corrida viva** (28/09/2026, plan 3.30, cierra `P-24`). Decía que una vela con máximo mayor y mínimo menor que la anterior, **sin corrida viva**, no declara dirección y pasa a ser la nueva vela origen. Con esta regla, desde la vela de apertura siempre hay corrida o retroceso: el único momento sin corrida viva es la vela de apertura **sin cuerpo**, y ahí el operador decidió otra cosa —la vela de apertura sigue siendo el origen y, si la siguiente pasa de los dos extremos, manda su color—. Con corrida viva, el caso lo resuelven `R-05` y el orden de la vela (`R-09`). Retirada con el sí del operador sobre un ejemplo dibujado; su texto, en `HISTORIAL.md`.

**Caso real 9/07/2026:** la vela 8:31 es bajista, pero el mercado sube 190 puntos desde la 8:33. Con el sesgo puesto el día no daba nada; sin sesgo aparece el largo del rompimiento de la vela 8:43, que el operador **sí tomó**.
