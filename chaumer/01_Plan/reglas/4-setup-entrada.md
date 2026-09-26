# 4 · Setup y entrada

> cuándo se opera

## R-23 · Selección de setup

> Toma el primer setup válido cuya orden se llene.

| | |
|---|---|
| Aplica a | Continuación · Reingreso |
| Parámetros | — |
| Relacionadas | R-28 · R-29 · R-34 |
| Casos | G-22 |

### Cómo se aplica

- **Orden cronológico:** el primer setup que cumpla todas las condiciones necesarias se opera.
- **Prohibido** compararlo con setups posteriores o esperar uno mejor.
- Una vez llenada la orden, se ignora el resto de la sesión.

### Excepciones

- Un setup válido cuya orden caduque sin llenarse (`R-29`) no consume el cupo ni bloquea los siguientes.

## R-24 · Tipo de orden y momento de colocación

> Entra siempre con orden stop en reposo colocada al cierre de la vela de rompimiento.

| | |
|---|---|
| Aplica a | Continuación · Reingreso |
| Parámetros | `TICK` |
| Relacionadas | R-01 · R-20 · R-25 · R-26 |
| Casos | G-01 · G-11 |

### Cómo se aplica

- **Largo → Buy Stop Market** por encima del precio: máximo de la **vela de rompimiento** + 1 `TICK`.
- **Corto → Sell Stop Market** por debajo: mínimo de la vela de rompimiento − 1 `TICK`.
- **El nivel se lee en el gráfico de MNQ** y la orden va **al cierre de la vela de rompimiento**, en el Chart Trader de ese gráfico, tipo `Stop Market`.
- **Colocar y esperar. No se persigue el precio a mano.** Orden a mercado y orden límite: prohibidas.

## R-25 · Setup Continuación

> Un IRI —corrida, retroceso, zona y rompimiento de esa zona— y su consecución. La consecución es la entrada.

| | |
|---|---|
| Aplica a | Continuación |
| Parámetros | `TICK` · `PLAZO_CONSECUCION` |
| Relacionadas | R-05 · R-06 · R-09 · R-20 · R-24 · R-40 |
| Casos | G-01 · G-02 · G-03 · G-04 · G-07 · G-09 |

### Cómo se aplica

| # | Paso | Regla |
|---|---|---|
| 1 | **Corrida** | `R-05` |
| 2 | **Retroceso** | `R-06` |
| 3 | Se marca la **zona** en la vela extrema de la corrida. Alcista → RESISTENCIA · Bajista → SOPORTE | `R-09` |
| 4 | **Rompimiento** de esa zona por **≥1 `TICK`**, en el sentido de la corrida — y solo si la corrida es fluida (`R-40`) | `R-20` |
| 5 | **Consecución** ≥1 `TICK` más allá del extremo de la vela de rompimiento ← **ENTRADA** | `R-20` + `R-24` |

- **Direcciones:** **Continuación alcista** (compra) · **Continuación bajista** (venta), espejo exacto.
- **Plazo de la consecución:** `PLAZO_CONSECUCION`, desde la vela siguiente a la de rompimiento. Lo habitual es que llegue en la 1ª o la 2ª (`C-09`).
- **Zona requerida:** sí — y la genera el propio impulso del paso 1. **No existe Continuación sin zona.**
- **Filtro de objetivo:** solo **zona vigente** (`R-21`). El punto de referencia **no** aplica a la Continuación (`R-41`).
- **La orden:** Stop Market al cierre de la vela de rompimiento, en el nivel de consecución (`R-24`).

### Excepciones

- Si se agota el `PLAZO_CONSECUCION` sin consecución, la **entrada** queda invalidada. El destino de la **zona** lo deciden `R-10` y `R-11`.

### Por qué

> 🔑 **La Continuación es autocontenida:** el propio setup crea la zona que después rompe.

**IRI** *(Impulso–Retroceso–Impulso)* es **la estructura**: una corrida deja su zona, el precio retrocede y la corrida siguiente rompe esa zona. **La Continuación es un IRI fluido (`R-40`) más su consecución**, que es la entrada.

## R-26 · Setup Reingreso

> Tras un rompimiento con consecución que falla, el precio recupera la zona entera y se opera en sentido contrario.

| | |
|---|---|
| Aplica a | Reingreso |
| Parámetros | `TICK` · `PLAZO_CONSECUCION` |
| Relacionadas | R-20 · R-24 · R-25 · R-29 · R-41 |
| Casos | G-05 · G-06 · G-08 · G-09 · G-12 · G-16 |

### Cómo se aplica

| # | Paso |
|---|---|
| 1 | Sobre una zona hay **rompimiento + consecución** (`R-20`) |
| 2 | 🔴 **La consecución falla EN EL ACTO**: el precio no continúa en esa dirección — ver el plazo, abajo |
| 3 | El precio **atraviesa la zona entera y SOBREPASA el borde contrario** → **vela de reingreso**. Alcista: supera el **borde superior** del soporte. Bajista: supera el **borde inferior** de la resistencia. **No basta con tocar la zona.** Esta vela hace de vela de rompimiento |
| 4 | **Consecución** ≥1 `TICK` más allá de la vela de reingreso ← **ENTRADA** (`R-24`) |
| 5 | 🔴 El **objetivo debe caber dentro del punto de referencia** (`R-41`) |

- **🔴 El reingreso es inmediato o no es.** La ventana de reingreso se abre con la vela de consecución y **se cierra en cuanto el precio supera el extremo de esa vela de consecución**. Si el precio sigue de largo en el sentido del rompimiento, aunque sea un tick, **el rompimiento quedó bueno y ya no hay reingreso posible sobre esa zona** — por mucho que el precio vuelva a pasar por ella más tarde.
- **El `PLAZO_CONSECUCION` de `R-20` no aplica al reingreso:** su límite es la ventana inmediata de arriba.
- **🔑 La misma vela puede cerrar el rompimiento fallido y abrir el reingreso.** Si la vela que da la **consecución** del rompimiento se da la vuelta dentro del mismo minuto, atraviesa la zona entera y sale por el borde contrario, **esa misma vela es a la vez consecución y vela de reingreso**. No se exige una vela posterior.
- **Dirección:** contraria al rompimiento fallido.
- **Filtro propio — el punto de referencia (`R-41`):** el objetivo tiene que quedar del lado de dentro del nivel de referencia de **cualquier retroceso vivo** que quede entre la entrada y el objetivo; ese nivel muere cuando una vela **cierra** más allá. Si el objetivo lo pasa, **el reingreso es inválido y no se opera**.
- **La orden:** Stop Market al cierre de la vela de reingreso, en el nivel de consecución. **Se comprueba el punto de referencia antes de enviarla.**

### Por qué

> 🔑 **Es la contraria de la Continuación:** la Continuación opera el rompimiento que **funciona**; el Reingreso, el que **falló**. Es el único setup del plan con un segundo filtro de objetivo, y su orden muere solo por `R-29`.

**Caso que SÍ es reingreso — 6/07/2026:** zona `R` 29.926,50–29.939,25. Rompe la vela 8:46; la 8:47 da la consecución subiendo a 29.967,25 y **esa misma vela** se desploma a 29.908,75, otra vez bajo la zona → reingreso válido, y la misma vela es consecución y vela de reingreso (`G-12`).

**Caso que NO lo es — 13/07/2026:** zona `R` 29.652,25–29.666,75. Rompe la vela 9:25 (máx 29.677,25), consecución la vela 9:27 (máx 29.681,00) y el precio **sigue subiendo** hasta 29.724,00. Lo que hace la vela 9:41, catorce velas después, **no es un reingreso**.

Diagrama: `02_Assets\diagramas\R-26_reingreso.png`

## R-27 · La vela de apertura no sesga la jornada

> La dirección de la vela de las 08:31 marca por dónde empieza el día, pero **no obliga a operar en ese sentido durante toda la sesión**.

| | |
|---|---|
| Aplica a | Continuación · Reingreso |
| Parámetros | — |
| Relacionadas | R-07 · R-40 |
| Casos | G-14 |
| Fuente | operador, caso 9/07/2026 |
| Pendiente | cuánto pesa la «mayor favorabilidad» del sentido de la apertura: el operador pidió dejarlo para la fase de contexto (`C-11`) |

### Cómo se aplica

- **Se buscan entradas de continuación en los dos sentidos.** Cada tramo, suba o baje, deja su zona al terminar, y esa zona sirve para entrar **a favor de ese tramo**: una zona nacida al final de una subida se opera larga cuando se rompe hacia arriba; una nacida al final de una bajada, corta cuando se rompe hacia abajo.

### Por qué

**Palabras del operador (27/08/2026):** *"la dirección de la vela de apertura no quiere decir que toda la jornada va a ser en esa dirección, solo da el mayor grado de favorabilidad a un trade IRI en la apertura, pero no quiere decir que se sesgue y no pueda operar un trade IRI en dirección contraria."*

**Caso real 9/07/2026:** la vela 8:31 es bajista, pero el mercado sube 190 puntos desde la 8:33. Con el sesgo puesto el día no daba nada; sin sesgo aparece el largo del rompimiento de la vela 8:43, que el operador **sí tomó**.

## R-40 · Corrida fluida

> **Solo se entra en el rompimiento de la zona de una corrida FLUIDA.** Una corrida es fluida cuando la secuencia sale bien **tres veces seguidas**: la corrida deja su zona · el retroceso no se pasa · y la corrida siguiente rompe esa zona.

| | |
|---|---|
| Aplica a | Continuación |
| Parámetros | `STOP_MAX` |
| Relacionadas | R-06 · R-07 · R-09 · R-10 · R-15 · R-25 |
| Casos | G-22 · G-24 |

### Cómo se aplica

**Cómo se emparejan corrida y retroceso.** La vela de apertura declara el sentido (`R-07`). Desde ahí el mercado va alternando: una corrida en ese sentido, su retroceso en contra, otra corrida, otro retroceso. **Cada corrida se empareja con el retroceso que viene justo después de ella, y las parejas no se solapan.** Tras una pareja rota, la cuenta vuelve a empezar con la corrida siguiente.

**Las tres condiciones**, sobre la zona que se va a romper, antes de colocar la orden:

| | Condición |
|---|---|
| **1** | la **corrida** deja su zona al terminar (`R-09`) |
| **2** | el **retroceso no se pasa**: mide menos que su corrida. Empate cuenta como que no se pasa |
| **3** | la **corrida siguiente rompe** esa zona |

Cumplidas las tres, ese rompimiento es la entrada — el cuarto paso de la Continuación (`R-25`). Los dos primeros se miden sobre el zigzag: la corrida, de su punto de arranque a su extremo; el retroceso, de ese mismo extremo a su nivel de referencia (`R-06`).

**Las dos formas de fallar**, y basta una:
- **A · El retroceso se pasa.** Mide más que su corrida. Entonces caen **las dos zonas** de esa pareja: la de la corrida **y la que deja el propio retroceso pasado**.
- **B · La corrida siguiente no rompe.** Llega a la zona, no es capaz de pasarla y se devuelve: esa zona queda bloqueada.

**El bloqueo es del SENTIDO, no de esa zona.** El sentido del día lo declara la vela de apertura: si cierra por debajo de donde abrió, el día es bajista y se buscan cortos; si cierra por encima, alcista y largos. Perdida la fluidez, **no se opera ningún rompimiento en el sentido del día**, sea cual sea la zona — incluidas las **zonas de premercado** (`R-15`), que no tienen corrida detrás y a las que por eso no se les puede mirar si su corrida fue limpia: el bloqueo las alcanza igual. **Solo el sentido del día:** el bloqueo no toca el sentido contrario.

**El rompimiento directo** (término del operador). Con el sentido bloqueado, el mercado acabará rompiendo la zona. **Ese rompimiento no se opera nunca:** por parámetros cumple, pero el mercado está lateral y por contexto pierde probabilidad. Sirve solo como primer paso de la recuperación.

**Cómo vuelven las entradas**, en este orden:
1. **Primero**, que la zona quede **rota con su consecución** — el rompimiento directo, que no se opera.
2. **Después**, que el mercado arme un **IRI nuevo entero más allá**: una corrida que deje su zona, un retroceso que la confirme, y el rompimiento de esa zona con su consecución. La zona nueva tiene que quedar **entera más allá** de la bloqueada —por encima si se busca largo, por debajo si se busca corto—; no basta con que la entrada la supere. **Se entra en ese rompimiento, no antes.**

**Se puede volver a perder.** Ese IRI nuevo **se juzga desde cero** con estas mismas tres condiciones. El desbloqueo no vale para toda la jornada: si el IRI siguiente tampoco es fluido, el sentido se vuelve a bloquear y hay que esperar otro.

> 🔑 **La zona bloqueada no se muere.** Sigue vigente: se dibuja, tapa objetivos (`R-32`), hace de borde de banda (`R-17`) y se rompe e invalida como cualquier otra (`R-20`, `R-21`). Lo único que se descarta es **entrar en su rompimiento**.

> 🔴 **No es un filtro de riesgo disfrazado.** Es independiente de `STOP_MAX`: una entrada puede caber de sobra en el tope y quedar fuera igual. Y solo afecta a las **continuaciones** (`R-25`); el Reingreso (`R-26`) no se toca.

### Por qué

Es la traducción medible de «no es fluida» y «está lateral». Palabras del operador, 14/09/2026: *"una corrida alcista fluida, un retroceso normal, y la siguiente corrida que sería la entrada"*; *"cuando el retroceso fue mayor que la corrida bajista, se genera zona de resistencia, y no se debería ingresar en un rompimiento directo"*; *"como no fue capaz de romper, el mercado va a estar lateral"*.

**Por qué el segundo paso arrastra al primero.** Si el rompimiento fue con mecha y la consecución no llegó, `R-10` estira la zona hasta la punta de esa mecha. Para que el IRI nuevo quede entero más allá, el precio tiene que pasar de esa punta — y eso **es** la consecución. Se dejan escritos los dos pasos porque así lo explica el operador.

#### Los cuatro casos que la definieron

**10/09/2026 — falla y se recupera.** La apertura sube 49,50 y el retroceso baja **65,75**: se pasa. Caen la resistencia de 8:32 y el soporte de 8:34. Después llega la secuencia entera —corrida de 79,75, retroceso de solo 32,25, y rompimiento— y su resistencia (29.125,75 – 29.137,50) queda **entera por encima** de la bloqueada (29.118,00 – 29.123,50). Ésa da la entrada del día: largo en 29.145,75, **+40,50 pts**.

**14/09/2026 — falla y no se recupera.** La apertura baja 43,50 y el retroceso sube **53,25**: se pasa. La resistencia de 8:34 no se opera, y en toda la sesión no aparece otro IRI por encima de ella. **NO OPERA.**

**16/07/2026 — la sesión que hubo que corregir.** La apertura sube 71,75 y el retroceso baja **132,25**: se pasa. El corto de 8:40 era el rompimiento directo del soporte que dejó ese retroceso. 🔴 **Esa sesión estaba validada con ese corto (+75,50 pts) desde el 01/09/2026.** El operador la revisó el 14/09 y la dio por mal marcada: *"efectivamente está mal esa entrada, porque no fue un IRI bajista fluido; primero empezó alcista, y luego fue bajista. Esa primera entrada fue arriesgada, se debe esperar que genere otro IRI bajista."*

**11/09/2026** no llega a plantearse: la sesión entera se quedó sin marcar una sola zona.

#### El bloqueo de sentido, sobre casos reales

**Caso de origen · 18/09/2026.** Abre bajista. La vela de **8:32** deja un retroceso de 38,00 contra una corrida de 29,00 → se acaban los cortos. Las velas de **8:49 y 8:50** rompen la zona de premercado con consecución → **rompimiento directo, no se opera**. La corrida de 8:52 deja el soporte 29.781,50 – 29.791,75, entero por debajo del terreno bloqueado; la de 8:55 lo rompe → **entrada en la de 8:56**, +31,00 pts. Palabras del operador: *"ya no hay fluidez bajista, por lo tanto ya no pienso en cortos; espero que se rompa la zona de soporte, que haga otro IRI, y ahí sí entro"*.

**Primera jornada que lo ejercita entero · 21/09/2026.** Abre alcista. Se pierde a las **8:34** (retroceso de 44,25 contra corrida de 38,75) · rompimiento directo a las **8:37** · se recupera con un largo a las 8:49 que **se cancela antes de llenar** · se **vuelve a perder** a las **8:51** (20,00 contra 16,25) · segundo rompimiento directo a las **8:52** · se recupera con la entrada de las **8:59**, +23,75 pts.

**Origen:** test ciego — jornadas del 10, 11 y 14 de septiembre de 2026, y la revisión del 16/07. Ver `05_Backtesting\test_ciego\DISCREPANCIAS.md`.

## R-41 · Punto de referencia

> **El objetivo de un reingreso no puede pasar del nivel de referencia de un retroceso anterior que siga vivo.** Solo aplica al reingreso.

| | |
|---|---|
| Aplica a | Reingreso |
| Parámetros | — |
| Relacionadas | R-06 · R-19 · R-21 · R-26 |
| Casos | G-23 |

### Cómo se aplica

- **Qué es un punto de referencia:** el **nivel de referencia de un retroceso** (`R-06`) — el mínimo más bajo si el retroceso baja, el máximo más alto si sube. Es el mismo vértice que ya dibuja el zigzag de corridas y retrocesos; no es un nivel nuevo.
- **Cuántos hay:** **todos** los retrocesos dejan uno, se dibujen o no — el operador: *"normalmente todos los retrocesos serían puntos de control"*.
- **Cuál manda:** el punto de referencia **vivo más cercano a la entrada** que quede **entre la entrada y el objetivo**. Los de fuera de ese tramo no estorban. No se limita al retroceso que originó la zona: vale cualquiera — por eso **una zona de premercado también puede dar reingreso**.
- **Criterio de descarte:** si el objetivo **pasa** de ese nivel, el reingreso no se opera. Si cae **justo encima**, se opera: solo descarta pasarlo.
- **Cuándo se rompe:** cuando una vela **CIERRA** más allá del nivel. El pinchazo de mecha **no** lo rompe. Roto, deja de contar y no estorba ningún objetivo a partir de ahí.
- **Alcance:** **solo reingresos** (`R-26`). Las continuaciones (`R-25`) no lo miran.
- **Con los otros filtros:** va junto al de **zonas vigentes** (`R-21`). Los dos tienen que pasar.
- **Dibujo:** no se dibujan todos — el gráfico se llenaría. Se dibuja **solo cuando aparece un reingreso**, para comprobar si el objetivo está libre:

| | |
|---|---|
| Vivo | flecha punteada, **naranja oscuro `#FF9A3C`**, contraste bajo, extendida hacia la derecha |
| Roto | contraste más leve y **se corta una vela después** de la que lo rompió |

> 🔴 **Ojo: aquí el rompimiento se lee por el CIERRE.** Es la única cosa del plan que **no** se rompe por la mecha. Una zona se rompe con que la mecha la pase por un tick (`R-19`, punto 1); un punto de referencia **necesita que una vela cierre más allá**. Si algún día esto se olvida, el filtro deja de funcionar: casi todos los puntos de referencia acaban pinchados por una mecha en algún momento.

### Por qué

**Palabras del operador, 14/09/2026:** *"Un punto de control es un retroceso que dice que en ese punto se puede volver a presentar como una zona que el precio lo puedan defender para evitar que lo rompan."* Y el 24/08/2026, con el mismo razonamiento: *"pueden defender ese nivel y el trade le quita probabilidad, por lo tanto para un reingreso debe tener camino libre para el target"*.

No es un nivel nuevo que haya que buscar: **es un vértice del zigzag de corridas y retrocesos que el plan ya dibuja**. Lo único que añade esta regla es que ese vértice, además de estar ahí, **tapa el objetivo de un reingreso**. Del dibujo, el operador: *"la idea es tener el gráfico lo más limpio posible"*.

**Caso de origen · viernes 11/09/2026.** Reingreso bajista a las **9:01** sobre la zona de premercado de 8:29: entrada **29.440,25**, stop **29.475,00**, objetivo **29.405,50**, riesgo 34,75. El punto de referencia de la vela de **8:58**, en **29.423,00**, queda en medio — y el objetivo lo pasa. **Descartado.** El operador tampoco lo tomó. Sin esta regla el día habría dado +34,75 pts; con ella, la jornada es **NO OPERA**.

**Origen:** test ciego del 14/09/2026 sobre la jornada del 11/09 — ver `05_Backtesting\test_ciego\DISCREPANCIAS.md`.
