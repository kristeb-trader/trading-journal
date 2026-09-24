# ELEMENTOS DE CONTEXTUALIZACIÓN

> **Creado:** 2026-08-24 · **actualizado:** 2026-09-06
> **Estado:** 🔵 **Registro abierto — fase posterior, sin auditar** · **10 elementos**
> 🚨 **Ninguno de estos elementos es una regla, y ninguno debe convertirse en una.** Es el tercero de los cuatro huecos declarados del cierre de la fase 1.
> **Origen:** taxonomía del propio Alfredo Chaumer, nota de voz del 24/08/2026.

---

## Qué es esto y por qué existe

Chaumer distingue explícitamente dos categorías, y el plan las adopta:

> *"Existen **parámetros operativos** y existen **elementos para contextualizar**. […] Me ayudan a tomar decisiones, **mas no es un parámetro operativo**."*
> — Nota de voz, 24/08/2026 · transcripción en `03_Materia_Prima\transcripciones\2026-08-24_audio_chaumer.md`

| | Dónde vive | Naturaleza |
|---|---|---|
| **Parámetro operativo** | `TRADING_PLAN_CHAUMER.md`, `reglas.json` | Criterio fijo y medible. Se cumple o no se cumple. **Un operador sin criterio propio puede ejecutarlo** |
| **Elemento de contextualización** | **este archivo** | Ayuda a decidir. **No tiene número y no debe tenerlo.** Depende del momento |

---

## ⚠️ Lo que hay que tener presente al usar esta capa

Esta capa **es, por definición, decidir a ojo**. Y este proyecto nació de una frase del operador:

> *"Mi ejecución falla porque hay reglas que no están escritas y decisiones que tomo a ojo."*

Dos consecuencias que conviene no olvidar:

1. **El test ciego de `F1.11` solo puede validar los parámetros.** Si la contextualización es lo que decide operar o no —y en Chaumer lo es: en las 4 sesiones grabadas no operó 2 días por contexto— las divergencias en esas capturas no significarán que el plan esté mal escrito.
2. **Es la puerta por la que vuelven los Errores 1 y 5** de `Guia_Sesion_Chaumer_NQ_v4.pdf`. Los dos fueron decisiones de contexto tomadas en caliente.

La capa está separada y con nombre precisamente para eso: **para que el operador sepa en todo momento en qué modo está decidiendo.**

---

## Elementos registrados

### C-01 · Sobreextensión del movimiento

> *"Yo no tengo un parámetro que diga 'si el movimiento es muy extendido, no planteo la entrada', no. Eso para mí forma parte del contexto, porque **depende de la volatilidad del momento, del desarrollo operativo, por ejemplo de la proporción de la vela**."* — Chaumer, 24/08/2026

- **De qué depende, según él:** volatilidad del momento · desarrollo operativo de la sesión · proporción de la vela.
- **Decisión del operador (24/08/2026):** se saca de las reglas. **No hay tope de velas en `R-05`.**
- **Historial:** la guía v4 del operador tenía el filtro *"impulso de más de 5 velas → sobreextendido"*. Era una simplificación propia, no del método. Eliminado.

#### Dos parámetros que Chaumer menciona y el operador DESCARTÓ

Se registran por si algún día se reconsideran. Chaumer: *"si tú quieres incluirlo como un parámetro operativo, porque tengo alumnos que lo incluyen"*.

| | Criterio | Estado |
|---|---|---|
| **A · Tercer impulso** | La entrada llega tras `impulso → retroceso → impulso → retroceso → impulso → retroceso` | ❌ Descartado por el operador |
| **B · 10 minutos sin retroceso** | El movimiento lleva **más de 10 velas de 1 min** sin retroceder | ❌ Descartado por el operador |

> 📌 La candidata **A** coincide exactamente con la que el auditor había deducido del registro de errores del operador: los **Errores 1 (28/04) y 5 (30/04)** de la guía v4 documentan "sobreextendido" y en **ambos casos era la tercera corrida**. Dos caminos independientes al mismo sitio.

### C-02 · El volumen en un movimiento extendido

Citado por Chaumer como elemento de contextualización. Sin desarrollar. **Caso particular de `C-08`.**

### C-08 · El volumen dentro de la ventana operativa

> *"En la ventana operativa el volumen sí sirve como contexto, pero en reglas operativas, no."* — Operador, 24/08/2026

**Esto cierra el bloque de volumen del plan entero.** Consecuencias, escritas para que no se relean como opinión:

| | |
|---|---|
| **Reglas de volumen en el plan** | **Una sola: `R-15`** — y solo vive en premercado |
| **Reglas de volumen dentro de la sesión** | **Ninguna** |
| **Alcance real de `R-03`** | El indicador Volume Up Down está en pantalla toda la sesión, pero **alimenta una única regla, que termina antes de que abra el mercado** |
| **Términos que ya no recibirán número** | máximo volumen de sesión · volumen climático · volumen de parada |

> 🔴 **Lo que esto significa para `F1.3` y `F1.4`.** Toda decisión de entrada dentro de la ventana operativa será **estructura de precio pura**: corrida, retroceso, zona, rompimiento, consecución. El volumen no entra en el gatillo. Si al llegar a `F1.3` aparece una condición de entrada que menciona volumen, **contradice esto** y hay que resolver la contradicción antes de escribirla.

**Sin desarrollar** como elemento de contexto: no hay definición de qué mira el operador en el volumen ni cuándo le hace cambiar de decisión.

### C-03 · La lateralización  *(= rango = congestión)*

> **Los tres términos son el mismo elemento.** El operador (24/08/2026), sobre rango y congestión: *"eso está en contextualización"*. No tienen número y no deben tenerlo.

Citada por Chaumer como elemento de contextualización. Aparece constantemente en sus sesiones en vivo: *"el mercado se mantiene lateralizado"*, *"mercado totalmente en rango"* — y es lo que le hace no operar días enteros. Sin desarrollar.

### C-04 · El alejamiento respecto de la zona

> *"…a medida que más se aleja [el precio de la zona], fíjense que **el recorrido es mayor**… considero que la entrada es arriesgada."* — Chaumer, 18/08/2026

Citado por él explícitamente como contextualización. Sin desarrollar.

### C-05 · Fluidez del movimiento

Aparece en el material del curso (*"estructura abc fluida (ideal)"* frente a *"estructura no fluida"*) y en las sesiones en vivo (*"no es el movimiento más fluido posible"*, *"el precio no logró tener un movimiento fluido"*). Nunca se define con número en ninguna fuente. Sin desarrollar.

### C-06 · Longitud del recorrido

> *"No nos gustan los largos recorridos del precio."* — `Parámetros Chaumer.pdf`

El propio material se contradice a continuación, describiendo un impulso largo con retroceso pequeño como entrada *"super válida"*, y concluye: *"lo de los recorridos largos hay que contextualizar"*. **El propio curso lo clasifica como contexto.** Sin desarrollar.

### C-09 · En qué vela llega la consecución

> *"Casi siempre la da en la primera o segunda con un movimiento fluido y normal, pero se pasa a la 3 o 4 en la mayoría de casos significa que el precio no tiene fuerza y no hace la continuación normal fluida que uno espera de la entrada."* — Operador, 24/08/2026

**No es regla y no puede serlo**, por dos motivos:

1. **No hay número que ejecutar.** "Fluido", "sin fuerza" son adjetivos.
2. **Operativamente llega tarde.** La orden ya está en reposo desde el cierre de la vela de rompimiento (`R-24`) y se llena sola. Cuando el operador ve que va por la 4ª vela, o cancela a mano o ya entró.

`R-25` mantiene el plazo de **5 velas** de `R-20`. Esta observación de calidad queda registrada aquí y **no altera la regla**.

### C-07 · Tamaño de la estructura

*"Estructura pequeña"*, *"menor estructura"*. Chaumer las usa a diario (*"estaba esperando ver si llegábamos a tener quizás una menor estructura"*) y el curso las menciona sin definirlas. Sin desarrollar.

---

## Resuelto y NO pertenece a esta capa

| Elemento | Resolución |
|---|---|
| **Punto de reacción** (`P-13`) | **Es la zona vigente.** Así la llama Chaumer en sus sesiones. Parámetro operativo puro, ya cubierto por `R-09` y `R-21`. Cerrado 24/08/2026 |
| **Antigüedad de la zona** (`P-16`) | **Descartada.** El operador no la usa: las zonas son binarias, activa o inactiva. Ver `D-07`. Cerrado 24/08/2026 |

### C-10 · Corrida "sana y fluida" — requisito para entrar en continuación

> *"No es corrida alcista fluida porque el retroceso fue menor al nivel mínimo de la corrida, es decir, no es un movimiento alcista fluido con mínimos y máximos más altos. A pesar de que la primera vela fue alcista, genera retroceso y genera zona de resistencia, no fue una corrida alcista sana y fluida."*
> — Operador, 26/08/2026, sobre la sesión del 07/07/2026

> *"Tener muy en cuenta y es muy importante que la idea de entrar en continuaciones en una dirección es que la corrida sea fluida y que tenga gran probabilidad de continuar la dirección, por eso se entra en un IRI de continuación."*

**Por qué está aquí y no en las reglas:** el operador lo clasificó explícitamente como contexto y aplazó su desarrollo — *"más adelante en otra fase vamos a mirar muy bien el contexto; en esta fase es dejar claros los parámetros operativos"*.

> 🔑 **Pero la razón que dio ES medible, y conviene no perderla.** *"El retroceso fue menor al nivel mínimo de la corrida"* se traduce a: **mínimo del retroceso < mínimo de la vela origen de la corrida**. En el 07/07/2026: retroceso a **29.503,75** contra mínimo de la vela origen (8:31) en **29.569,25** → lo perfora por **65,50 puntos**. Cuando llegue la fase de contexto, esta condición ya tiene número y es candidata a parámetro operativo.

**Relación con `C-05` (fluidez)** — es la misma familia, pero `C-05` nunca tuvo criterio y esta sí trae uno.

## Pendiente de clasificar

*(vacío)*


---

## 🆕 C-08 · La favorabilidad del sentido de la apertura — añadido 27/08/2026

**Qué es:** la dirección de la vela de las 08:31 (`R-07`) **no es un sesgo** —se opera en los dos sentidos, `R-27`— pero según el operador **sí da mayor grado de favorabilidad** a una entrada de continuación en ese sentido, sobre todo en la apertura.

**Palabras del operador (27/08/2026):** *"solo da el mayor grado de favorabilidad a un trade IRI en la apertura, pero no quiere decir que se sesgue y no pueda operar un trade IRI en dirección contraria. Esa parte lo debemos ampliar mejor en la fase de contextualización."*

**Lo que falta medir:** cuánto pesa esa favorabilidad. ¿Cambia la decisión de operar o no? ¿Cambia el tamaño? ¿Cambia solo el orden de preferencia cuando hay dos setups posibles?

**Por qué está aquí y no en el plan:** ayuda a decidir, no es un parámetro ejecutable. Sigue la taxonomía del propio Chaumer.

**Caso de referencia:** 9/07/2026 — vela base bajista, mercado sube 190 puntos, y el trade que el operador tomó fue **largo**, en contra del sentido de la apertura.

**Estado:** 🟠 abierto, para la fase de contextualización.

---

## 🆕 C-09 · La lateralidad puede que ya esté cubierta — observación del 27/08/2026

**Hallazgo del backtesting del 8/07/2026:** en el tramo **8:51–9:12** el motor no marcó **ninguna zona** — ocho candidatas seguidas bloqueadas por la regla del 50 % (`R-12`/`R-17`). El operador lo dio por bueno: es exactamente lo que él hace en un lateral.

**La hipótesis, sin confirmar:** puede que **no haga falta una regla de lateralidad** aparte. La regla del 50 % entre zonas ya deja de marcar sola cuando el precio se mete en un rango estrecho, que es lo que define un lateral.

**Qué haría falta para confirmarlo:** comparar, en varios días, los tramos donde el motor deja de marcar contra los tramos que el operador califica de laterales en su bitácora.

**Estado:** 🟠 abierto, para la fase de contextualización.
