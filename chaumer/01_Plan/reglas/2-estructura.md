# 2 · Estructura del precio

> el vocabulario

## R-05 · Corrida (= impulso)

> Una corrida (= impulso) es la secuencia de velas que arranca cuando una vela supera el extremo de la anterior y termina en la primera vela que retrocede al menos 1 tick contra ella.

| | |
|---|---|
| Aplica a | Continuación · Reingreso |
| Parámetros | `TICK` |
| Relacionadas | R-06 · R-08 |
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

## R-07 · Vela base de la ventana operativa

> La primera vela de la ventana operativa (**08:31** hora Colombia) **declara la dirección inicial de la sesión con su propio cuerpo**, y es la vela origen. Cierre por encima de su apertura → el mercado **inicia alcista**. Cierre por debajo → **inicia bajista**.

| | |
|---|---|
| Aplica a | Continuación · Reingreso |
| Parámetros | — |
| Relacionadas | R-05 · R-06 · R-08 · R-27 |
| Casos | G-12 |
| Pendiente | P-23: cierre exactamente igual a la apertura |

### Cómo se aplica

- **Las velas de las 08:30 y anteriores son premercado.** No sirven como `n−1` para `R-05` ni para `R-06`, ni para nada.
- **La dirección NO la declara la 08:32.** La declara la propia **08:31**, por la posición de su cierre respecto de su apertura.
- **Es la vela origen.** La corrida se mide desde su **mínimo** si es alcista, desde su **máximo** si es bajista.
- Desde la **08:32** en adelante manda `R-05` con normalidad, comparando **siempre contra la vela inmediatamente anterior**.
- **Puede sostener zona** como cualquier otra vela.

### Por qué

**Casos reales:** 06/07, 07/07 y 10/07 de 2026 — las tres sesiones abren con la 08:31 alcista, y las zonas ya validadas por el operador salen idénticas con esta redacción.

> ⚠️ **Consecuencia sobre `R-08`.** `R-08` se escribió para *"cuando no hay corrida viva"*. Con `R-07` así, en la apertura **siempre hay corrida viva desde la 08:31**, y a partir de ahí el mercado está siempre o en corrida o en retroceso. **El supuesto de `R-08` puede no ocurrir nunca** → `P-24`, pendiente de resolver con el operador antes de tocar `R-08`.

## R-08 · Vela envolvente sin corrida viva

> Una **vela envolvente** es la que hace **máximo mayor Y mínimo menor** que la anterior. Cuando aparece **sin corrida viva**, no declara dirección: pasa a ser la nueva vela origen y la dirección la da la vela siguiente.

| | |
|---|---|
| Aplica a | Continuación · Reingreso |
| Parámetros | — |
| Relacionadas | R-05 · R-07 |
| Casos | G-12 |
| Pendiente | P-24: con R-07 puede no ocurrir nunca |

### Cómo se aplica

- Sin corrida viva, si `máximo[n] > máximo[n−1]` **y** `mínimo[n] < mínimo[n−1]` → la vela `n` es el **nuevo origen**. Se evalúa `n+1` contra `n`.
- Si `n+1` **también** es envolvente, se repite: `n+1` pasa a origen y decide `n+2`. Sin límite de repeticiones.
- La corrida se mide desde el extremo de la **última** vela origen.
- **NO aplica con corrida viva.** Ahí manda `R-05`: mínimo menor **mata** la corrida, sea envolvente o no.

### Por qué

Caso real: la vela 8:36 del 10/07/2026 era envolvente dentro de una corrida viva y no generó ninguna duda.

**Frecuencia medida** (39 sesiones, ventana operativa): **763 velas envolventes**, de las cuales **384 caen dentro de corrida viva** (`R-05` ya resuelve) y **379 caen donde nacería la corrida** — unas 10 por sesión. Son estas últimas las que `R-08` resuelve.
