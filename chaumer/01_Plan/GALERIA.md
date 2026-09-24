# GALERÍA DE CASOS — F1.10

> **Capturas reales del NT8 del operador.** Cada caso etiquetado con las reglas que lo explican.
> **Imágenes:** `02_Assets\galeria\`

**Abierta:** 2026-08-24 · **24 casos documentados** · gráficos NQ y MNQ 09-26, 1 minuto
>
> 🔴 **`G-22` en adelante son del TEST CIEGO** — marcados sin ver lo que hizo el operador, y contrastados después. Son los únicos casos que no se construyeron mirando la respuesta. Gráficos en `05_Backtesting\test_ciego\Back_claude\`.

---

## Cómo leer los importes de estas capturas

Las medidas están tomadas sobre el gráfico de **NQ** ($20 por punto). El operador ejecuta en **MNQ** ($2 por punto). Para comparar contra `STOP_MAX` = **80 puntos**, hay que convertir:

`puntos = $NQ ÷ 20` · `riesgo real MNQ = puntos × $2`

| Caso | Setup | $ NQ | Puntos | Riesgo MNQ | % de `STOP_MAX` |
|---|---|---|---|---|---|
| **G-01** | Continuación alcista | 995 | 49,75 | $99,50 | 62 % |
| **G-02** | Continuación bajista | 1.535 | **76,75** | **$153,50** | 🔴 **96 %** |
| **G-03** | Continuación alcista | 885 | 44,25 | $88,50 | 55 % |
| **G-04** | Continuación bajista | 400 | **20** | $40 | 25 % |
| **G-05** | Reingreso alcista | 1.095 | 54,75 | $109,50 | 68 % |
| **G-06** | Reingreso bajista | 850 | 42,50 | $85 | 53 % |

**Los seis pasan el filtro de `STOP_MAX`.** Pero los extremos enseñan cosas distintas — ver `G-02` y `G-04`.

---

# CASOS

## G-01 · CONTINUACIÓN ALCISTA

**Archivo:** `G-01_Continuacion_alcista.png` · **Reglas:** `R-25`, `R-09`, `R-20`, `R-32`

| Elemento en la captura | Regla |
|---|---|
| Zona **Resistencia** marcada arriba de la corrida | `R-09` |
| **Vela de rompimiento** — supera la resistencia | `R-20` |
| **Vela de consecución** — 1 tick por encima ← **entrada** | `R-20`, `R-24` |
| **Stop** en el nivel del **Soporte** = mínimo del retroceso | `R-32` |
| **Target** a la misma distancia, arriba | `R-32` |

✅ **Caso limpio de libro.** La consecución llega en la vela inmediatamente siguiente al rompimiento — el caso normal descrito en `C-09`.

---

## G-02 · CONTINUACIÓN BAJISTA 🔴 *el caso al límite*

**Archivo:** `G-02_Continuacion_bajista.png` · **Reglas:** `R-25`, `R-32`, `R-31`, `P-20`

| Elemento | Regla |
|---|---|
| Zona **Soporte** rota hacia abajo | `R-09`, `R-20` |
| Vela de rompimiento y vela de consecución ← **entrada** | `R-20` |
| **Nivel de Stop** en la **Resistencia** = máximo del retroceso | `R-32` |
| Target 1:1 abajo | `R-32` |

> 🔴 **Este es el caso que hay que tener presente.** El stop mide **76,75 puntos**: el **96 %** de `STOP_MAX`. Le sobraron **3,25 puntos**. Un movimiento un poco más amplio y este setup se descarta por `R-31`.
>
> **Lección para la checklist:** el filtro de los 80 puntos **no es teórico**. Este trade real pasó por poco.

📌 El propio operador lo etiquetó entonces **"IRI Apertura"**. Esa etiqueta desapareció el 23/09/2026 y `P-20` se cerró con ella.

---

## G-03 · CONTINUACIÓN ALCISTA · la zona superada cambia de papel

**Archivo:** `G-03_Continuacion_alcista_zona_invertida.png` · **Reglas:** `R-25`, `R-21`, `R-32`

| Elemento | Regla |
|---|---|
| Dos zonas previas: **Resistencia** arriba, **Soporte** abajo | `R-09` |
| Anotación del operador: *"Se convierte en Soporte al ser superada"* | `R-21` |
| Rompimiento de la resistencia superior y consecución ← **entrada** | `R-20` |
| Stop en la zona que acaba de convertirse en soporte | `R-32` |

> 🔑 **Vocabulario que el plan no tenía y ahora sí.** `R-21` dice que una zona superada en un sentido *"sigue vigente para el otro sentido"*. El operador lo dice más corto: **se convierte en soporte**. **Es lo mismo**, descrito desde el otro lado.
>
> Añadido al glosario como **INVERSIÓN DE PAPEL**.

---

## G-04 · CONTINUACIÓN BAJISTA · zona invertida, y el stop más pequeño

**Archivo:** `G-04_Continuacion_bajista_zona_invertida.png` · **Reglas:** `R-25`, `R-21`, `R-32`, `P-12`

| Elemento | Regla |
|---|---|
| Anotación: *"Soporte → Se vuelve Resistencia"* | `R-21` — espejo de `G-03` |
| Rompimiento y consecución hacia abajo ← **entrada** | `R-20` |
| Stop en la zona invertida · Target 1:1 abajo | `R-32` |

> ⚠️ **El stop más pequeño de los seis: 20 puntos = $40 en MNQ.** Y ahí muerde `P-12`:
>
> | Riesgo | Win rate solo para no perder dinero |
> |---|---|
> | $40 | **51,9 %** |
> | $153,50 *(`G-02`)* | **50,5 %** |
>
> Con ratio 1:1 la comisión es fija y la ganancia no: **cuanto más pequeño el stop, más caro sale el peaje.** No es motivo para descartar el trade — el plan no tiene mínimo (`D-01`) — pero conviene saber que un stop de 20 puntos necesita acertar más.

---

## G-05 · REINGRESO ALCISTA

**Archivo:** `G-05_Reingreso_alcista.png` · **Reglas:** `R-26`, `R-32`

| # | Elemento en la captura | Regla |
|---|---|---|
| 1 | **Rompimiento** de la zona hacia abajo | `R-20` |
| 2 | **Consecución** bajista → la zona queda superada hacia abajo | `R-20`, `R-21` |
| 3 | El precio **no continúa** y **reingresa** | `R-26` |
| 4 | **Consecución del reingreso** ← **entrada larga** | `R-26` |
| 5 | **Stop = "Nivel más bajo"** — el extremo de la corrida fallida | `R-32` |
| 6 | Target 1:1 arriba, **por debajo de la zona gris superior** | `R-26`, `R-32` |

✅ **Confirma `R-32` para Reingreso:** el stop mide contra la corrida fallida, no contra el retroceso. El operador lo etiqueta literalmente *"Nivel mas bajo"*.

---

## G-06 · REINGRESO BAJISTA

**Archivo:** `G-06_Reingreso_bajista.png` · **Reglas:** `R-26`, `R-32`

| # | Elemento | Regla |
|---|---|---|
| 1 | **Rompimiento** de la zona hacia arriba | `R-20` |
| 2 | **Consecución** alcista | `R-20` |
| 3 | **Stop = "Nivel más alto"** — extremo de la corrida fallida | `R-32` |
| 4 | **Vela de reingreso** — atraviesa la zona de vuelta | `R-26` |
| 5 | **Consecución de reingreso** ← **entrada corta** | `R-26` |
| 6 | Target 1:1 abajo | `R-32` |

✅ **Espejo exacto de `G-05`.** Los dos reingresos usan la misma etiqueta para el stop —*"nivel más alto/más bajo"*— y confirman que el plan lo recogió bien.

---

## G-07 · 🔴 DESCARTE POR `STOP_MAX` — el filtro en acción

**Archivo:** `G-07_descarte_STOP_MAX.png` · **Reglas:** `R-31`, `R-32`, `PARAMETROS.md`

> Anotación del operador: **"Stop, sobrepasa los 80 Puntos — Se descarta Setup"**

| Elemento | |
|---|---|
| Rompimiento y consecución | ✅ **presentes y correctos** |
| Stop medido | **111,75 puntos** |
| `STOP_MAX` | **80 puntos** |
| Exceso | **+31,75 puntos** — un **40 % por encima** del tope |
| **Decisión** | 🔴 **NO SE OPERA** |

> 🔑 **Este es el caso más importante de la galería.** El setup **existe**: hay zona, rompimiento y consecución. `R-25` se cumple entero. **Y aun así no se opera**, porque `R-32` filtro 1 lo veta.
>
> **Es la prueba de que los filtros son independientes del setup.** Una Continuación perfecta con el stop demasiado grande **no es una operación**.

📊 **Contrasta con `G-02`**, que pasó al 96 % del tope. Entre los dos delimitan la frontera desde ambos lados: 76,75 pasa, 111,75 no.

---

## G-08 · 🔴 DESCARTE POR PUNTO DE REFERENCIA — el filtro exclusivo del Reingreso

**Archivo:** `G-08_descarte_punto_referencia.png` · **Reglas:** `R-26`, `R-32`

> Anotación del operador: **"Target Sobrepasa punto de referencia"**

| Elemento | |
|---|---|
| Setup | Reingreso |
| Stop medido | **30,50 puntos** — muy holgado, **38 %** de `STOP_MAX` |
| Filtro 1 (`STOP_MAX`) | ✅ **pasa de sobra** |
| Filtro 3 (punto de referencia) | ❌ **el target 1:1 lo sobrepasa** |
| **Decisión** | 🔴 **NO SE OPERA** |

> 🔑 **El caso que demuestra que los filtros no se pueden mezclar.** El riesgo era pequeño — 30,50 puntos, de los más cómodos de toda la galería. **Y el trade se descarta igual**, porque el target no tiene camino libre.
>
> **Un stop pequeño no compensa un target bloqueado.** Los tres filtros de `R-32` son condiciones **independientes**: basta que falle una.

📌 Es también el **primer caso real del punto de referencia**, el término que nació el 24/08/2026. Confirma `R-26` sobre gráfico: la línea naranja discontinua marca el nivel y el target verde queda más allá.

---

## G-09 · DÍA SIN OPERAR — y por qué es el caso más sutil de la galería

**Archivo:** `G-09_dia_sin_operar_20ago.png` · **Fecha:** jueves 20 de agosto de 2026 · **MNQ 09-26**

Sesión completa marcada con zonas y un punto de referencia (flecha naranja). **Ninguna operación. P&L $0,00.**

> **Motivo dado por el operador:** *"El mercado estuvo muy lateral y no setups operativos para entrar ni nada que cumpliera las reglas."*

### 🔑 Ese motivo contiene DOS razones distintas, de capas distintas

| Lo que dijo | Qué capa es | ¿El plan lo cubre? |
|---|---|---|
| *"el mercado estuvo muy lateral"* | 🔵 **Contextualización** — `C-03` | ❌ **No.** No tiene número y no debe tenerlo |
| *"nada que cumpliera las reglas"* | ⚙️ **Parámetro operativo** — `R-25`, `R-26`, `R-32` | ✅ **Sí, entero** |

**Por qué importa la distinción, y mucho:**

- Si el motivo real fue **el segundo**, este día es **perfectamente mecánico**: cualquier tercero con el plan en la mano habría llegado a la misma conclusión, y `F1.11` puede validarlo.
- Si el motivo real fue **el primero**, el día lo decidió la contextualización — y `F1.11` **no puede evaluarlo**, por definición (ver `CONTEXTUALIZACION.md`).

📌 **Los dos motivos suelen coincidir**: un mercado lateral produce pocas corridas limpias, así que la falta de setups es *consecuencia* de la lateralidad. Pero **no son lo mismo**, y conviene anotarlos por separado en el journal. *"No hubo setup"* es un hecho verificable; *"estuvo lateral"* es una lectura.

> 💡 **Sugerencia para el registro (`R-38`):** en los días sin operar, separar dos campos — **"¿se formó algún setup?"** (sí/no) y, si sí, **"¿qué filtro lo descartó?"**. Con eso, los días sin operar dejan de ser una nota y pasan a ser datos.

---

## G-10 · Operación de PRUEBA — 13 de agosto

**Archivo:** `G-10_operacion_13ago.png` · **Fecha:** jueves 13 de agosto de 2026 · **MNQ 09-26**

Stop y target marcados a **43 puntos** cada uno — **1:1 correcto** (`R-32`) y muy dentro de `STOP_MAX` (54 %).

> ⚠️ **El P&L de esta captura NO es válido.** El operador confirma que era una **operación de prueba**. La cifra que aparece en pantalla se ignora por completo y **no cuenta como caso con pérdida**.

**Lo que sí vale de esta captura:** la geometría del 1:1 sobre gráfico de MNQ.

📌 Las capturas `G-09` y `G-10` son de la **cuenta Apex de evaluación**, no de la cuenta objetivo de $3.000. Ver `P-03`: dos regímenes de riesgo distintos.

---

## G-11 · 🔴 LA SESIÓN COMPLETA · 10 JULIO 2026 · primer caso con PÉRDIDA REAL

**Archivo:** `../05_Backtesting/G-11_10jul_operacion.png` · **Reglas:** todas las del ciclo operativo

> **Único caso de la galería reconstruido al tick desde datos exactos de NinjaTrader**, vela a vela y en directo con el operador.

### La secuencia

| Hora Col | Qué pasó | Regla |
|---|---|---|
| **7:14** | vela de premercado, vol **2.290** > 2.000, alcista → **RESISTENCIA 29.872,00–29.878,75** | `R-15` |
| **8:30** | apertura · empieza el marcado de estructura | `R-02` |
| 8:31–8:33 | corrida alcista, tres velas | `R-05` |
| **8:34** | **bajista de color pero la corrida sigue** — su mínimo (29.893,50) es mayor que el anterior | `R-05` |
| 8:35 | máximo menor, pero mínimo aún mayor → corrida viva | `R-05` |
| **8:36** | **máximo mayor (29.926,00) Y mínimo menor (29.896,75)** → muere la corrida, nace el retroceso. Y es **la vela más alta** → **RESISTENCIA 29.903,50–29.926,00** | `R-06`, `R-09` |
| **8:37** | mín 29.880,50 profundiza el retroceso → **nivel de stop**. Máx 29.933,75 **rompe la zona** → **vela de rompimiento**. No se marca soporte: el movimiento cruza el 50 % | `R-20`, `R-12` |
| **8:38** | máx 29.936,75 supera la vela de rompimiento por **12 ticks** → **CONSECUCIÓN, orden llenada** | `R-20`, `R-24` |
| — | se ajustan stop y target · **termina el análisis del día** | `R-31`, `R-34` |
| **8:40** | mínimo 29.856,75 → **STOP** | `R-33` |

### Los números

| | |
|---|---|
| Entrada | **29.934,00** *(29.933,75 + 1 tick)* |
| Stop | **29.880,50** *(nivel de retroceso)* |
| Target 1:1 | **29.987,50** — no alcanzado |
| Riesgo | **53,50 pts** · **67 %** de `STOP_MAX` ✅ |
| Duración | **3 velas** |
| **Resultado** | 🔴 **−53,50 pts = −$107,00** en MNQ, 1 contrato |

> 🔑 **Por qué este caso vale más que los seis ganadores juntos.**
>
> El setup era **válido**. Los cuatro filtros **pasaban**. La ejecución fue **correcta**. **Y perdió.**
>
> Eso es exactamente lo que `R-33` protege: entró, no tocó nada, el mercado decidió. Una pérdida ejecutada bien **no es un error** — es el coste normal de un plan con ratio 1:1. El error sería haberla gestionado.

### Lo que este caso aportó al plan

| Hallazgo | Efecto |
|---|---|
| La vela que dispara el retroceso **puede ser la más alta** | 🔧 **`R-09` corregida** |
| El **retroceso también marca zona** | 🔧 `R-09` ampliada |
| `R-12` acertó sobre datos exactos | ✅ la regla más difícil, **validada** |
| Tras el llenado **se acaba el análisis** | 🆕 **`R-34`** |
| Sombreado de premercado ≠ ventana de escaneo | 🔧 **`R-15` corregida** |

---

# LO QUE ESTA GALERÍA VALIDA

| | |
|---|---|
| `R-20` rompimiento + consecución | ✅ los **6 casos** |
| `R-25` Continuación | ✅ 4 casos, 2 alcistas y 2 bajistas |
| `R-26` Reingreso | ✅ 2 casos, uno de cada dirección |
| `R-32` stop y target 1:1 | ✅ los **6 casos**, con las dos referencias distintas |
| `R-21` vigencia y cambio de papel | ✅ `G-03` y `G-04` |
| `R-31` `STOP_MAX` | ✅ `G-01` a `G-06` pasan · `G-02` al **96 %** · 🔴 `G-07` **descartado a 111,75 pts** |
| `R-32` filtro 3 · punto de referencia | 🔴 `G-08` **descartado** — primer caso real |
| **Independencia de los filtros** | ✅ `G-07` y `G-08`: **el setup se cumple y aun así no se opera** |

# LO QUE ESTA GALERÍA NO TIENE TODAVÍA

| Falta | Por qué importa |
|---|---|
| ✅ ~~Setup descartado por `STOP_MAX`~~ | **`G-07`** |
| ✅ ~~Reingreso anulado por punto de referencia~~ | **`G-08`** |
| ❌ **Un target bloqueado por zona vigente** | `R-21`, el filtro principal — el único de los tres sin caso real |
| ❌ **Una zona de premercado por volumen** | `R-15` no aparece en ninguna captura |
| ❌ **Una Continuación en día de FOMC** *(descartada por `R-36`)* | la prohibición más reciente |
| ✅ ~~Día sin operar con su motivo~~ | **`G-09`** — y destapó que el motivo mezclaba dos capas |
| ✅ ~~Un caso con pérdida real~~ | **`G-11`** — 10/07/2026, −53,50 pts |

> 🔑 **Con `G-07` y `G-08` la galería cambia de naturaleza.** Ya no es un álbum de aciertos: documenta **los dos motivos por los que un setup válido no se opera**. Eso es lo que un plan mecánico necesita enseñar.

---

## Caso inválido ya archivado

| | |
|---|---|
| `02_Assets\invalidos\R-12_invalido_01.png` | Zona entre zonas marcada por error. Anotada por el propio operador: *"Error, no se debe marcar"*. Resolvió `R-12` |

---

## G-12 · 🔴 LA SESIÓN COMPLETA · 6 JULIO 2026 · una Continuación rechazada y un Reingreso operado sobre la MISMA zona

**Archivo:** `../02_Assets/galeria/L6_sesion_completa.png` · **Reglas:** `R-15`, `R-07`, `R-08`, `R-05`, `R-06`, `R-09`, `R-16`, `R-12`, `R-20`, `R-31`, `R-26`, `R-32`, `R-34`

> **Segunda sesión reconstruida al tick desde datos exactos de NinjaTrader**, vela a vela con el operador. Es el caso que la galería no tenía: **dos setups sobre la misma zona en un intervalo de un minuto — uno se descarta, el otro se opera.**

### La secuencia

| Hora Col | Qué pasó | Regla |
|---|---|---|
| — | premercado desde las 19:00: **0 velas por encima de 2.000** (máx 750) → **sin zonas de premercado** | `R-15` |
| **8:31** | **vela base.** No se compara con la 8:30. Es la vela origen de la primera corrida | `R-07` |
| 8:32 | máximo mayor → **nace corrida alcista**, medida desde el mínimo de la 8:31 (**29.776,25**) | `R-05`, `R-07` |
| 8:34 | **vela interior** — máximo menor pero mínimo mayor → **no corta** | `R-05` |
| **8:36** | mínimo menor → muere la corrida. Vela más alta = la 8:35 → **RESISTENCIA 29.926,50 – 29.939,25** | `R-06`, `R-09` |
| 8:36 → 8:39 | **el retroceso dura 4 velas.** Línea provisional que baja hasta **29.786,00** (vela 8:37) | `R-06`, `R-16` |
| **8:40** | máximo mayor → retroceso confirmado → se dibuja el **SOPORTE 29.786,00 – 29.827,50** | `R-16`, `R-09` |
| 8:40 → 8:44 | segunda estructura completa. **Sus dos zonas candidatas se bloquean**: los dos movimientos cruzan el 50 % entre bordes internos (29.877,00) | `R-12` |
| **8:46** | rompe la resistencia **con cuerpo** (máx 29.959,50 · cierre 29.953,75) | `R-20` |
| **8:47** | **consecución de la Continuación** (29.967,25) → pero el stop estructural queda a **114 pts**. `STOP_MAX` = 80 → **la orden NO se envía** | `R-31` |
| **8:47** | **la misma vela se da la vuelta**: baja a 29.908,75, atraviesa la resistencia entera y sale por el borde inferior → **VELA DE REINGRESO** | `R-26` |
| **8:48** | mínimo 29.896,00 → **consecución, se llena el corto** · **termina el análisis del día** | `R-26`, `R-34` |
| **8:51** | máximo 29.984,00 → **STOP** | `R-33` |

### Los números

| | |
|---|---|
| Entrada (corta) | **29.908,50** *(1 tick bajo el mínimo de la vela de reingreso)* |
| Stop | **29.967,25** *(máximo de la corrida fallida)* |
| Target 1:1 | **29.849,75** — no alcanzado |
| Riesgo | **58,75 pts** · **73 %** de `STOP_MAX` ✅ |
| Resultado | **−58,75 pts = −$117,50** con 1 MNQ |

### Los tres filtros de `R-32`, uno por uno

| Filtro | Comprobación | |
|---|---|---|
| `STOP_MAX` | 58,75 ≤ 80 | ✅ |
| Target libre de zonas | 29.849,75 queda **por encima** del soporte (borde superior 29.827,50) | ✅ |
| Punto de referencia | extremo del retroceso que originó la zona = **29.786,00**; el target queda por encima | ✅ |

> 🔑 **Lo que este caso aporta y `G-11` no tenía.**
>
> 1. **`STOP_MAX` no mata la sesión, la redirige.** La Continuación se cae por 34 puntos de exceso y **un minuto después** la misma zona entrega un Reingreso que sí cabe. El filtro que rechaza un setup puede estar preparando el siguiente.
> 2. **El stop del Reingreso salió MENOR que el de la Continuación** — 58,75 contra 114 — pese a la advertencia de `R-32` de que el Reingreso *"tiende a ser mayor"*. Aquí no lo fue, porque la Continuación arrastraba un retroceso muy profundo y el Reingreso mide contra una corrida corta.
> 3. **Una vela puede cerrar un setup y abrir el contrario.** La 8:47 da la consecución de la Continuación y es la vela de reingreso. Ver la ampliación de `R-26`.
> 4. **Primer caso documentado de `R-12` bloqueando zonas** con datos exactos: 2 candidatas descartadas en la segunda estructura.

> ⚠️ **`P-22` nació aquí.** El plan no dice **cuál** retroceso fija el stop de la Continuación cuando ha pasado más de uno. Los dos candidatos daban 114,00 y 173,75 pts — **59,75 de diferencia**. Ese día no mordió porque los dos superaban `STOP_MAX`.


---

## G-13 · 🔴 SESIÓN COMPLETA · 8 JULIO 2026 · el día que reescribió el marcado de zonas

**FOMC.** Solo se permiten Reingresos (`R-36`) y no hubo ninguno válido → **NO OPERA**.

El valor de este día no está en la operativa sino en el marcado. El operador corrigió al auditor **seis veces**, vela por vela, y de ahí salió `R-19` entera y buena parte de `R-18`.

| Vela | Lo que el auditor hacía mal | Lo correcto |
|---|---|---|
| **8:33** | dibujaba el rectángulo desde la 8:36 | nace en la **vela origen**, la 8:33 |
| **8:37** | leía el rompimiento por el **cierre** → no rompía | se lee por la **mecha**: su mínimo baja de 29.277,50 → rompe. La 8:38 da la consecución |
| **8:40 / 8:41** | — | reingreso a la zona y consecución al alza → la zona de la 8:36 queda **inválida en la 8:41** |
| **8:43** | dibujaba soporte donde ya vivía la zona de la 8:37 | **no se solapan zonas de tipo distinto**; la superada cambia de papel |
| **9:13** | marcaba soporte | **no marca nada**: solo rompe el soporte de la 8:39. La consecución llega en la **9:16** y el soporte nace sobre la vela 9:16 en **29.235,25 – 29.252,50** |
| **9:44** | marcaba soporte | **no marca nada**: rompe el soporte de la 9:16 y la consecución llega en la **9:47** |

> 🔑 **El hallazgo estructural del día.** El tramo 8:51–9:12 se queda **sin ninguna zona marcada** — ocho candidatas seguidas bloqueadas por la regla del 50 %. El operador lo dio por bueno: es exactamente lo que él hace en un lateral, **sin necesidad de ninguna regla de lateralidad**.

**Reglas que nacieron o se corrigieron aquí:** `R-17`, `R-18`, `R-19`, `R-20`, `R-13`.

---

## G-14 · 🔴 SESIÓN COMPLETA · 9 JULIO 2026 · el día que quitó el sesgo de dirección

**Operación:** Continuación alcista · entrada **29.871,50** · stop **29.811,75** · objetivo 29.931,25 · riesgo **59,75 pts** → **STOP** en la vela de las 8:50 · **−59,75 pts = −119,50 USD**

| | |
|---|---|
| **Vela base 8:31** | **bajista** — el día empieza a la baja |
| **Lo que hizo el mercado** | la caída muere en la 8:33 y **sube 190 puntos** hasta la 8:39 |
| **La zona** | resistencia de la vela 8:39: **29.847,75 – 29.863,00** |
| **Rompimiento** | vela **8:43**, máximo 29.871,25 — **a UN TICK de la entrada** |
| **8:44 y 8:45** | no llegan a la entrada. El auditor **cancelaba la orden aquí** por retroceso nuevo |
| **Consecución** | vela **8:46**, máximo 29.885,50 → **llena la orden**, todavía dentro del plazo |
| **Salida** | vela 8:50, stop |

> 🔑 **Dos reglas salieron de aquí.** `R-27`: la vela de apertura **no sesga** la jornada — con el sesgo puesto el motor solo buscaba cortos y este largo no existía, y el operador **sí lo tomó**. Y `R-29` **reescrita**: un retroceso nuevo no cancela; solo cancelan las 5 velas sin consecución o la vuelta al punto del stop.

---

## G-15 · 🔴 SESIÓN COMPLETA · 7 JULIO 2026 · la zona apéndice y el stop que descarta la entrada

**Operación:** Continuación bajista · entrada **29.226,00** · stop **29.282,50** · objetivo 29.169,50 · riesgo **56,50 pts** → **STOP** en la vela de las 9:48 · **−56,50 pts = −113,00 USD**

**Dos casos de manual en el mismo día:**

**1 · La zona apéndice (`R-11`).** La vela **8:39** rompe **con cuerpo** el soporte de la 8:36 —cierra en 29.502,75, bajo el piso 29.503,75— y ninguna de las 5 velas siguientes baja de 29.491,25. Al vencer el plazo, en la vela de las **8:44**, nace la apéndice **29.491,25 – 29.502,75**. La original no se toca.

**2 · El stop que mata la entrada (`R-32`).** El soporte de la vela 9:27 se rompe con la vela **9:36**. El retroceso que lo originó (9:28–9:30) tenía su techo en **29.313,00**, y con esa medida el riesgo era 71,50 pts → entrada válida. Pero la vela **9:32** había subido hasta **29.327,75**. Con el stop bien medido —el extremo alcanzado **desde que nació la zona**— el riesgo sube a **86,25 pts** y **la entrada queda descartada por `STOP_MAX`**.

> 🔑 También aquí se fija `R-18` en su versión fina: la vela **8:52** rompe la apéndice y la **8:54** hace la consecución **dentro** del plazo → rompimiento exitoso, así que en la 8:53 **no se marca soporte** pese a que hubo retroceso.

---

## G-16 · 🟢 SESIÓN COMPLETA · 13 JULIO 2026 · el reingreso bueno, y el que no lo era

**Operación:** Reingreso bajista · entrada **29.724,00** · stop **29.752,50** · objetivo 29.695,50 · riesgo **28,50 pts** → **TARGET** en la vela de las 10:09 · **+28,50 pts = +57,00 USD**

**El reingreso bueno.** La resistencia **29.725,75 – 29.737,25** (vela 8:33) se rompe con la vela **10:01**, la **10:02** hace la consecución y la **10:03** se da la vuelta **enseguida** y cruza la zona hacia abajo. Consecución fallida en el acto → reingreso. Riesgo de solo 28,50 pts.

**El que no lo era.** Sobre la zona **29.652,25 – 29.666,75** (vela 8:39): rompe la vela 9:25 (máx 29.677,25), consecución la vela **9:27** (máx 29.681,00), y el precio **sigue subiendo** hasta 29.724,00. La vuelta de la vela 9:41, catorce velas más tarde, **no es un reingreso**. De aquí sale el plazo de `R-26`.

**La vida completa de tres zonas, al tick** — el caso que fija `R-20` sin plazo y `R-22`:

| Zona | Rompe | Consecución | Rompe al revés | Consecución | Inválida |
|---|---|---|---|---|---|
| soporte vela **8:43** · 29.552,25–29.571,25 | 8:46 | **8:52** | 8:58 | 8:59 | **8:59** |
| apéndice vela **8:46** · 29.535,75–29.544,75 | 8:52 | **9:17** | 9:18 | 9:20 | **9:20** |
| apéndice vela **8:52** · 29.518,00–29.521,75 | 9:17 (mecha) | — | — | — | **viva, estirada a 29.488,50 – 29.521,75** |

> 🔑 **Entre la primera y su consecución pasan 6 velas; en la segunda, 25.** Ese es el caso que demuestra que **la consecución que traspasa una zona no tiene plazo**. El plazo de 5 velas solo decidió la geometría: por eso en la 8:51 nació una apéndice y en la 8:57 otra.

---

## G-17 · ⚪ SESIÓN COMPLETA · 14 JULIO 2026 · el día que se decidió por tres ticks y medio

**Operación:** ninguna. **NO HAY OPERACIÓN en toda la ventana.** 5 zonas marcadas · 3 vigentes al cierre de las 10:30.

**Cómo quedó el día.** La vela de apertura es bajista. La caída muere en la vela **8:36**, que deja el soporte **29.685,00 – 29.693,00**. Por arriba quedan dos zonas de premercado: **29.901,25 – 29.908,25** (vela de las 19:31) y **29.905,50 – 29.921,75** (vela de las 19:32).

**La banda que lo decidió todo.** Del techo del soporte al piso de la resistencia de premercado hay **208,25 puntos**, con la mitad en **29.797,13**. El primer retroceso dentro de esa banda es el de la vela **8:39**, que sube hasta **29.798,00**: se pasa de la mitad por **0,875 puntos — tres ticks y medio**. No se marca, y con eso la banda queda cerrada para el resto de la jornada. Entre las **8:41 y las 9:10 no se marca nada**. Las zonas vuelven a aparecer solo cuando el precio sale por debajo del soporte de la 8:36: velas **9:11** y **9:20**.

**Los dos descartes.** El día generó dos cortos y los dos se cayeron por `STOP_MAX`:

| Setup | Riesgo | Motivo |
|---|---|---|
| corto 9:06 | **157,75 pts** | pasa `STOP_MAX` (80) en un 97 % |
| corto 9:16 | **84,00 pts** | pasa `STOP_MAX` por 4 pts |

> 🔑 **Lo que confirma este día:** la **zona de premercado hace de borde de banda** igual que cualquier otra zona (`R-17`, punto 7). Y confirma que la regla de una-sola-zona-por-banda **puede dejar media hora del gráfico completamente en blanco** — no es un efecto raro de borde, es el funcionamiento normal.

**Validación:** el operador confirma el marcado — *"la marcación está bien, yo la tengo idéntica"* (01/09/2026).

---

## G-18 · 🟢 SESIÓN COMPLETA · 15 JULIO 2026 · la primera Continuación ganadora, y una vela que hace dos cosas a la vez

**Operación:** Continuación bajista · entrada **29.910,25** · stop **29.966,50** · objetivo 29.854,00 · riesgo **56,25 pts** → **TARGET** en la vela de las 8:39 · **+56,25 pts = +112,50 USD**

**Cómo se formó.** La apertura es bajista y cae de 29.977,50 (vela 8:31) a **29.912,50** (vela 8:34). La vela **8:35** sube y confirma el retroceso → **soporte 29.912,50 – 29.931,25**, apoyado en la vela 8:34.

**La vela de las 8:36 hace dos cosas en el mismo minuto.** Abre en 29.953,25, sube hasta **29.966,50**, se da la vuelta y cierra en 29.916,25 tras marcar un mínimo de **29.910,50**. Con su máximo deja la **resistencia 29.953,25 – 29.966,50**; con su mínimo **rompe el soporte** por abajo. El operador confirma que la resistencia se marca ahí mismo, sin esperar la vela siguiente.

| Paso | Vela | Precio |
|---|---|---|
| rompimiento del soporte | **8:36** | mínimo 29.910,50 |
| orden colocada | 8:36 | 29.910,25 (un tick por debajo) |
| stop — punto más alto desde que nació la zona | 8:36 | **29.966,50** |
| llenado | **8:38** | 29.910,25 |
| **TARGET** | **8:39** | mínimo 29.852,00 ≤ 29.854,00 |

La vela **8:37** se queda a **cuatro ticks** de llenar (mínimo 29.911,25). El riesgo, 56,25 pts, entra cómodo bajo el máximo, y el objetivo estaba **libre de zonas**: no había nada marcado por debajo del soporte.

> 🔑 **Primera operación ganadora del backtesting, y la primera Continuación que llega a target.** También el primer día sin ninguna zona de premercado: ninguna vela superó el umbral de volumen entre las 19:00 y la apertura, así que no hubo bandas que resolver.

**Validación:** el operador confirma — *"perfecto, estamos igual"* (01/09/2026).

---

## G-19 · 🟢 SESIÓN COMPLETA · 16 JULIO 2026 · segunda ganadora, con el stop al 94 % del máximo

> 🔴 **RETIRADA EL 14/09/2026.** Esta operación **ya no existe** con las reglas de hoy. La apertura sube 71,75 puntos y el retroceso baja **132,25**: el retroceso se pasa, así que el soporte que deja no se opera en rompimiento directo. El corto de 8:40 era exactamente eso.
>
> Palabras del operador al revisarla: *"efectivamente está mal esa entrada, porque no fue un IRI bajista fluido; primero empezó alcista, y luego fue bajista. Esa primera entrada fue arriesgada, se debe esperar que genere otro IRI bajista."*
>
> **El caso se conserva entero** porque de él salieron dos precisiones que siguen en pie: que el tope de riesgo es una línea dura sin margen, y que después del llenado se aguanta. Lo que ya no vale es la entrada. **16 de julio pasa a NO OPERA.**

**Operación:** Continuación bajista · entrada **29.395,50** · stop **29.471,00** · objetivo 29.320,00 · riesgo **75,50 pts** → **TARGET** en la vela de las 8:45 · **+75,50 pts = +151,00 USD**

**Cómo se formó.** La apertura es alcista y se agota en la propia vela de las **8:31**, que sube a **29.532,00** → **resistencia 29.504,75 – 29.532,00**. Desde ahí el precio cae sin pausa hasta **29.399,75** (vela 8:36). Las velas 8:37 y 8:38 rebotan y confirman el retroceso → **soporte 29.399,75 – 29.417,25** sobre la vela 8:36. Ese rebote llega a **29.471,00**, que es lo que fija el stop.

| Paso | Vela | Precio |
|---|---|---|
| rompimiento del soporte | **8:39** | mínimo 29.395,75 |
| orden colocada | 8:39 | 29.395,50 |
| stop — punto más alto desde que nació la zona | 8:38 | **29.471,00** |
| llenado | **8:40** | 29.395,50 |
| **TARGET** | **8:45** | mínimo 29.308,50 ≤ 29.320,00 |

### Dos cosas que este día deja claras

**1 · El máximo de stop es una línea dura, no una zona de aviso.** El riesgo fue **75,50 pts — el 94 % del máximo permitido**. El operador confirma que la toma igual: **no hay margen de seguridad por debajo del tope**. Si cabe, se opera; si no cabe, no se opera. No existe un "está muy cerca del límite, mejor la dejo".

**2 · Después de llenar se aguanta, aunque la operación se ponga fea.** La vela de las **8:41** sube hasta **29.434,50** — 39 puntos en contra, con el stop a 75,50. El operador aguantó. Es la aplicación literal de que la posición no se gestiona: solo hay dos salidas, stop u objetivo.

**Validación:** el operador confirma ambas cosas (01/09/2026).

---

## G-20 · 🔴 SESIÓN COMPLETA · 17 JULIO 2026 · la que rompe la racha, y el corte del marcado en el llenado

**Operación:** Continuación bajista · entrada **28.434,75** · stop **28.512,00** · objetivo 28.357,50 · riesgo **77,25 pts** → **STOP** en la vela de las 8:49 · **−77,25 pts = −154,50 USD**

**Cómo se formó.** La apertura sube a **28.686,00** (vela 8:33) y deja ahí resistencia. Después, **ocho velas bajistas seguidas** hasta **28.456,00** en la vela de las **8:41**. Esa misma vela se da la vuelta y cierra alcista: deja el **soporte 28.456,00 – 28.463,00** sin necesidad de la vela siguiente. El rebote de las 8:41 y 8:42 llega a **28.512,00** → resistencia 28.478,25 – 28.512,00, y ese techo es el que fija el stop.

| Paso | Vela | Precio |
|---|---|---|
| rompimiento del soporte | **8:43** | mínimo 28.435,00 |
| orden colocada | 8:43 | 28.434,75 |
| stop — punto más alto desde que nació la zona | 8:42 | **28.512,00** |
| llenado | **8:44** | 28.434,75 |
| **STOP** | **8:49** | máximo 28.517,50 |

Tras el llenado el precio **no vuelve a bajar**: rebota cinco velas seguidas y la de las 8:49 se lleva el stop por cinco puntos. El objetivo, 28.357,50, nunca estuvo cerca — lo más bajo fue 28.408,25.

> 🔑 **Riesgo de 77,25 pts = 97 % del tope.** Tercera operación seguida con el stop pegado al máximo (75,50 · 77,25). Dos ganaron, ésta perdió. Confirma que el filtro deja pasar operaciones muy caras, y que su valor está en lo que rechaza, no en lo que admite.

### Lo que este día corrigió en el marcado

Aparecía dibujado un soporte nacido con la vela de las **8:45** — **después de que la orden ya estaba llena**. El operador confirma que **al llenarse la orden termina el análisis del día y no se marca nada más**. Corregido en la gráfica estándar: las zonas se dibujan hasta la vela del llenado; a partir de ahí solo siguen las velas, hasta el resultado.

**Validación:** el operador confirma el día y la corrección (01/09/2026).

---

## G-21 · 🟢 SESIÓN COMPLETA · 20 JULIO 2026 · dos órdenes canceladas antes de la buena

**Operación:** Continuación bajista · entrada **29.018,25** · stop **29.072,75** · objetivo 28.963,75 · riesgo **54,50 pts** → **TARGET** en la vela de las 9:02 · **+54,50 pts = +109,00 USD**

**Primer día con la regla de cancelación funcionando — y funcionó dos veces en cuatro minutos.**

| # | Orden | Riesgo | Qué pasó |
|---|---|---|---|
| 1 | **Continuación alcista 8:38** · entrada 29.167,50 · stop 29.126,25 | 41,25 pts | **cancelada a las 8:40**: el precio volvió al punto del stop (mínimo 29.119,50) sin haberse llenado |
| 2 | **Continuación bajista 8:40** · entrada 29.119,25 · stop 29.167,25 | 48,00 pts | **cancelada a las 8:44**: el precio volvió al punto del stop (máximo 29.181,75) sin haberse llenado |
| 3 | **Continuación bajista 8:57** · entrada 29.018,25 · stop 29.072,75 | 54,50 pts | **llenada a las 8:58 → TARGET a las 9:02** |

Las dos primeras se cancelaron por la **misma** causa: el precio vuelve al punto del stop antes de llenar. Ninguna se canceló por plazo. Es la primera validación en datos de la cancelación reescrita.

**La operación buena.** Tras el máximo de 29.192,50 (vela 8:46) el precio baja todo el tramo hasta **29.027,50** (vela 8:54). La **8:55 rebota** y deja el **soporte 29.027,50 – 29.052,00**, con techo de rebote en **29.072,75**. La **8:57 rompe** (mínimo 29.018,50) → orden en 29.018,25, riesgo **54,50 pts**, esta vez holgado. La **8:58 llena** y la **9:02 baja a 28.961,00** → objetivo.

### La duda del operador: por qué hay dos soportes casi pegados

El soporte de la vela **8:37** (29.126,25 – 29.130,25) lo **rompe la vela 8:40 con el cuerpo** — cierra en 29.125,00, bajo el piso — y su mecha llega a 29.119,50. **La consecución no llega**: pasan 8:41, 8:42, 8:43, 8:44 y 8:45 sin que nadie baje de 29.119,50. Al vencer el plazo, y por ser rompimiento **de cuerpo**, nace la **zona apéndice 29.119,50 – 29.125,00**.

> 🔑 **La zona apéndice no la marca la vela de rompimiento.** La vela 8:40 solo rompe. Lo que crea la zona es el **plazo vencido**. Prueba de que el marcado directo estaba bloqueado: en el retroceso de la vela 8:42 el candidato a soporte fue **rechazado** por haber un rompimiento pendiente de consecución.

**Validación:** el operador confirma la entrada y acepta la explicación de la apéndice (01/09/2026).

---

## G-22 · 🟢 TEST CIEGO · JUEVES 10 SEPTIEMBRE 2026 · la entrada que llega antes no siempre es la buena

**Operación:** Continuación alcista · entrada **29.145,75** a las 8:40 · stop **29.105,25** · objetivo 29.186,25 · riesgo **40,50 pts** → **TARGET** en la vela siguiente · **+40,50 pts = +81,00 USD**
**Gráfico:** `05_Backtesting\test_ciego\Back_claude\2026-09-10.png` · **Noticias:** precios al productor 7:30, fuera de la ventana · **Sin Fed**

**Primera jornada del test ciego, y la que trajo dos reglas.**

El día abre alcista: la 8:31 va de 29.089,50 a 29.118,25. La corrida muere en la 8:33 y deja la **resistencia de 8:32 en 29.118,00 – 29.123,50**. La 8:36 la rompe y la 8:37 da la consecución: el plan, tal como estaba escrito, mandaba entrar en **29.133,00** con stop en **29.057,75** — riesgo **75,25 pts**, el 94 % del tope.

**El operador no la tomó.** Su motivo, traducido a número: la corrida de 8:31 a 8:32 sube **49,50 puntos** y el retroceso que la sigue baja **65,75**. El retroceso es mayor que la corrida — o dicho igual, se hunde por debajo de donde arrancó todo. No hay impulso–retroceso–impulso: hay impulso y vuelta atrás. **Nace `R-40`.**

La estructura siguiente sí cumple: corrida de 8:34 a 8:37 de **79,75 pts** contra un retroceso de **32,25**. Su resistencia (29.125,75 – 29.137,50) rompe en la 8:39, la orden se llena en la 8:40 y el objetivo llega en la 8:41.

| | Entrada de 8:36 | Entrada de 8:39 |
|---|---|---|
| Corrida que crea la zona | 49,50 pts | 79,75 pts |
| Retroceso siguiente | **65,75 pts** | 32,25 pts |
| Riesgo | 75,25 (94 % del tope) | **40,50** |
| Resultado | +75,25 a las 9:25 | **+40,50 en una vela** |

> 🔑 **La entrada cronológicamente primera no es la buena si su estructura está deshecha.** `R-23` sigue mandando —se toma el primer setup válido— pero `R-40` decide antes cuál es válido.

**Segunda cosa del día:** con el umbral de volumen en 6.000 el premercado dejaba cuatro soportes de la reacción al dato de las 7:30, y uno tapaba la resistencia de 8:32 — el marcado de toda la mañana se desviaba. La vela más fuerte de la noche hizo 7.799 contratos. **El umbral pasa a ser parámetro ajustable** y sube a **8.000**. Ver `P-37`.

**Validación:** *"la gráfica está perfecta, esa es la entrada del día"* (operador, 14/09/2026).

---

## G-23 · ⚪ TEST CIEGO · VIERNES 11 SEPTIEMBRE 2026 · el día que se decidió en la primera vela

**Resultado: NO OPERA.** Coinciden operador y marcado.
**Gráfico:** `05_Backtesting\test_ciego\Back_claude\2026-09-11.png` · **Noticias:** inflación al consumidor 7:30, fuera de la ventana · **Sin Fed**

**Cero zonas marcadas en toda la sesión. 26 candidatas, 26 descartadas.**

El mercado abre metido dentro del tramo que deja el premercado: suelo en **29.317,00**, techo en **29.443,00**, medio en **29.380,00**. El primer movimiento de la jornada —la bajada de la apertura hasta 29.347,25 en la vela de 8:32— arranca por encima del medio y termina por debajo. Lo cruza, y con eso ese tramo queda cerrado para el resto del día. Las dos horas siguientes el precio se quedó dando vueltas dentro.

> 🔑 **Es `G-17` llevado al extremo.** El 14/07 la banda cerrada dejó media hora sin zonas; aquí dejó **la jornada entera**.

**El caso que trajo la regla.** A las 9:01 había un Reingreso bajista sobre la zona de premercado de las 8:29: entrada 29.440,25, stop 29.475,00, riesgo 34,75, objetivo 29.405,50 — que habría llegado a las 9:05. **+34,75 pts que no se tomaron.**

El motivo del operador: *"había un punto de control en contra"*. El mínimo de la vela de **8:58**, en **29.423,00**, queda entre la entrada y el objetivo. **Nace `R-41`**, y ese mismo día se unifica con el punto de referencia que ya existía desde agosto: son la misma idea dicha dos veces.

> 🔴 **El punto de referencia es lo único del plan que se rompe por CIERRE**, no por mecha. Si se olvida, el filtro deja de funcionar: casi todos acaban pinchados por una mecha en algún momento.

**Lo que este día dejó abierto:** `P-34` — el motor no anota los rompimientos de las zonas de premercado, así que **no puede ver** ese reingreso. El de las 9:01 se encontró a mano.

---

## G-24 · ⚪ TEST CIEGO · LUNES 14 SEPTIEMBRE 2026 · el día que reescribió la regla

**Resultado: NO OPERA.** El operador tampoco operó.
**Gráfico:** `05_Backtesting\\test_ciego\\Back_claude\\2026-09-14.png` · **Sin noticias rojas · Sin Fed** · Premercado sin una sola zona: la vela más fuerte de la noche hizo 4.407 contratos.

**El día se resuelve en las cuatro primeras velas.** La apertura baja de 28.924,00 a 28.880,50 — **43,50 puntos**. Y el retroceso sube hasta 28.933,75 — **53,25**. El retroceso se pasa.

Con la regla como estaba escrita esa mañana, el marcado daba un **largo a las 8:45 en 28.945,00, riesgo 64,50, objetivo alcanzado a las 8:49: +64,50 pts.** El operador dijo que no.

### La regla estaba mal emparejada, y este día lo destapó

La primera redacción de `R-40` comparaba cada corrida **con el movimiento que venía después**. Para la resistencia de 8:34 eso daba 53,25 contra 53,25 — empate exacto, y la entrada pasaba el filtro por un pelo.

La lectura buena compara el retroceso **con la corrida que viene justo antes de él**: 53,25 contra 43,50. Se pasa, y la resistencia que deja no se opera.

> 🔑 **Un empate exacto al tick fue lo que dejó ver el error.** Si el retroceso hubiera medido cualquier otra cosa, el fallo de emparejamiento habría seguido escondido.

### Lo que arrastró

Corregir el emparejamiento **cambió el marcado de cinco de las once sesiones de julio**, incluida una que ya estaba validada — el 16 de julio, `G-19`. El operador la revisó con el gráfico delante y la dio por mal marcada. Julio pasa de **−91,00 pts en 9 operaciones** a **−77,75 en 5**.

De aquí sale además el término **corrida fluida**, que es el que gobierna ahora todas las continuaciones.

---

## Resumen del backtesting día por día — remarcado el 14/09/2026 (11 días)

> 🔴 **Esta tabla se rehízo el 14/09/2026** al reescribirse la regla de la corrida fluida. Cuatro días pierden su operación y uno la cambia. Lo que decía antes está justo debajo, para no perder el rastro.

| Día | Setup | Resultado | Puntos |
|---|---|---|---|
| **6 jul** | Reingreso bajista 8:48 | STOP 8:51 | **−58,75** |
| **7 jul** | *(retirado el 14/09 — corrida no fluida)* | NO OPERA | — |
| **8 jul** | — FOMC | NO OPERA | — |
| **9 jul** | *(retirado el 14/09 — corrida no fluida)* | NO OPERA | — |
| **10 jul** | Continuación alcista 8:38 | STOP 8:40 | **−53,50** |
| **13 jul** | Reingreso bajista 10:04 | **TARGET 10:09** | **+28,50** |
| **14 jul** | dos entradas bajistas descartadas por `STOP_MAX` | NO OPERA | — |
| **15 jul** | **Continuación bajista 8:38** | **TARGET 8:39** | **+56,25** |
| **16 jul** | *(la bajista de 8:40 se retira el 14/09 — la corrida no era fluida)* | NO OPERA | — |
| **17 jul** | Continuación alcista 9:04 *(la bajista de 8:44 se retira el 14/09)* | STOP 9:05 | **−50,25** |
| **20 jul** | *(la bajista de 8:58 se retira el 14/09 — corrida no fluida)* | NO OPERA | — |
| | | **Total** | **−77,75 pts en 5 operaciones** |

## Test ciego — día por día

| Día | Setup | Resultado | Puntos |
|---|---|---|---|
| **10 sep** | **Continuación alcista 8:40** | **TARGET 8:41** | **+40,50** |
| **11 sep** | ninguna zona marcada en toda la sesión | NO OPERA | — |
| **14 sep** | la apertura baja 43,50 y el retroceso sube 53,25 — se pasa | NO OPERA | — |

> 🔵 **Estos días sí cuentan distinto.** Los once de julio se marcaron con el operador delante, corrigiendo vela a vela. Éstos se marcaron **a ciegas** y se contrastaron después. Siguen sin tener valor estadístico —son dos— pero son los primeros que prueban el plan en vez de construirlo.

### Lo que decía esta tabla antes del 14/09/2026

| Día | Setup | Resultado | Puntos |
|---|---|---|---|
| 6 jul | Reingreso bajista 8:48 | STOP 8:51 | −58,75 |
| 7 jul | Continuación bajista 9:43 | STOP 9:48 | −56,50 |
| 8 jul | — FOMC | NO OPERA | — |
| 9 jul | Continuación alcista 8:46 | STOP 8:50 | −59,75 |
| 10 jul | Continuación alcista 8:38 | STOP 8:40 | −53,50 |
| 13 jul | Reingreso bajista 10:04 | TARGET 10:09 | +28,50 |
| 14 jul | dos entradas bajistas descartadas por `STOP_MAX` | NO OPERA | — |
| 15 jul | Continuación bajista 8:38 | TARGET 8:39 | +56,25 |
| 16 jul | Continuación bajista 8:40 | TARGET 8:45 | +75,50 |
| 17 jul | Continuación bajista 8:44 | STOP 8:49 | −77,25 |
| 20 jul | Continuación bajista 8:58 | TARGET 9:02 | +54,50 |
| | | **Total** | **−91,00 pts en 9 operaciones** |

> 🔵 **Por qué se conserva.** Esas once sesiones se marcaron **con el operador delante, corrigiendo vela a vela**, y de ellas salieron la mitad de las reglas del plan. El marcado cambió porque cambió una regla, no porque aquel trabajo estuviera mal hecho. La cifra buena hoy es **−77,75 en 5**; ésta queda como historia.

> ⚠️ **Sin valor estadístico.** Cinco operaciones no dicen nada, las reglas cambiaron varias veces durante la propia revisión, y **falta toda la capa de contextualización** — que es justamente la que hace no operar varios de estos días.
