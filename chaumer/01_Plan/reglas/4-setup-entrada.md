# 4 · Setup y entrada

> cuándo se opera

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

> Un IRI —corrida, retroceso, zona y rompimiento de esa zona— y su consecución, **hacia un espacio nuevo**: más allá del objetivo no hay ninguna zona activa nacida desde la apertura. La consecución es la entrada.

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

**Lo que decide el setup es a dónde va el objetivo** *(plan 3.52, 29/10/2026)*. La Continuación sigue la tendencia **hacia un espacio nuevo**, donde el mercado no ha cotizado en el día: más allá del objetivo, en esa dirección, **no hay ninguna zona activa nacida desde la apertura** de Nueva York (las de premercado no cuentan). Si la hay, ese mismo rompimiento con consecución **no es Continuación sino Reingreso** (`R-26`, forma b), y se juzga con sus filtros. Palabras del operador: *"una continuación es un rompimiento de una zona, y el objetivo es un espacio nuevo, inexplorado en el día, es decir, que en el mercado abierto no hay nada cotizado"*.

**IRI** *(Impulso–Retroceso–Impulso)* es **la estructura**: una corrida deja su zona, el precio retrocede y la corrida siguiente rompe esa zona. **La Continuación es un IRI fluido (`R-40`) más su consecución**, que es la entrada.

## R-26 · Setup Reingreso

> Se opera hacia **una zona ya cotizada en el día**: una zona activa nacida desde la apertura de Nueva York, más allá del objetivo, a la que el precio puede ir a testear, con el camino libre hasta el objetivo. Nace de dos maneras: **(a)** un rompimiento con consecución que falla, y el precio atraviesa la zona entera en sentido contrario; o **(b)** el mercado frena, cambia de tendencia y rompe con consecución la zona contraria hacia esa zona ya cotizada.

| | |
|---|---|
| Aplica a | Reingreso |
| Parámetros | `TICK` · `PLAZO_CONSECUCION` |
| Relacionadas | R-09 · R-20 · R-24 · R-25 · R-29 · R-41 |
| Casos | G-05 · G-06 · G-08 · G-09 · G-12 · G-16 |

### Cómo se aplica

| # | Paso |
|---|---|
| 1 | Sobre una zona hay **rompimiento + consecución** (`R-20`) |
| 2 | 🔴 **La consecución falla**: el precio no continúa en esa dirección y vuelve a la zona — **sin plazo de velas** mientras la zona esté viva, ver abajo |
| 3 | El precio **atraviesa la zona entera y SOBREPASA el borde contrario** → **vela de reingreso**. Alcista: supera el **borde superior** del soporte. Bajista: supera el **borde inferior** de la resistencia. **No basta con tocar la zona.** Esta vela hace de vela de rompimiento |
| 4 | **Consecución** ≥1 `TICK` más allá de la vela de reingreso ← **ENTRADA** (`R-24`) |
| 5 | 🔴 El **objetivo debe caber dentro del punto de referencia** (`R-41`) |
| 6 | 🔴 **Tiene que haber una zona a la que ir a testear:** una zona **activa** (`R-21`) en la dirección del reingreso, **entera más allá del objetivo**. Bajista: por debajo del objetivo. Alcista: por encima. **Cualquier zona activa nacida desde la apertura** de Nueva York, soporte o resistencia, **a cualquier distancia**; **una zona de premercado no cuenta** (plan 3.52): ir hacia ella es Continuación. El objetivo sigue siendo 1:1 (`R-32`): **no tiene que llegar a esa zona, basta con que exista.** Sin esa zona **no hay reingreso** |

- **🔴 El reingreso no tiene plazo de velas** *(plan 3.51, 22/10/2026)*. **Mientras la zona esté viva**, la vela de reingreso puede llegar en cualquier vela después de la consecución —también después de que el precio haya pasado del extremo de la vela de consecución—, **siempre que tenga espacio de recorrido**: el riesgo dentro de `STOP_MAX` (`R-31`), ninguna zona activa entre la entrada y el objetivo (`R-32`), ningún punto de referencia vivo en contra (`R-41`) y una zona a la que ir más allá del objetivo (paso 6). Hasta la 3.50 decía *«el reingreso es inmediato o no es»*: la ventana se cerraba en cuanto el precio pasaba del extremo de la vela de consecución (27/08/2026).
- **El `PLAZO_CONSECUCION` de `R-20` no limita cuándo llega la vela de reingreso:** su límite es la vida de la zona. Sí limita la vida de la orden (`R-29`), como en cualquier setup.
- **🔀 Forma b — el cambio de tendencia** *(plan 3.52, 29/10/2026)*. El mercado frena y deja una zona que no rompe; deja después la zona contraria, la rompe con consecución, y **más allá del objetivo hay una zona activa nacida desde la apertura** (ya cotizada). Ese rompimiento **no es una Continuación sino un Reingreso**: lo que busca es volver a esa zona. Se opera como la Continuación —entrada en la consecución, stop en el extremo que hizo el mercado desde que nació la zona hasta el rompimiento, objetivo 1:1— pero con los filtros del Reingreso: riesgo dentro de `STOP_MAX`, ninguna zona activa ni punto de referencia vivo entre la entrada y el objetivo. **No pide la fluidez de la Continuación** (`R-40`): pide un cambio de tendencia. Y como es Reingreso, **se opera también en día de Fed** (`R-36`).
- **🔑 La misma vela puede cerrar el rompimiento fallido y abrir el reingreso.** Si la vela que da la **consecución** del rompimiento se da la vuelta dentro del mismo minuto, atraviesa la zona entera y sale por el borde contrario, **esa misma vela es a la vez consecución y vela de reingreso**. No se exige una vela posterior.
- **🕯️ Pero solo si la consecución llegó primero.** Solo se piensa en reingreso **después** de que llega la consecución. Cuando la consecución y la vuelta a través de la zona caen en la misma vela, el orden lo dice su color —el mismo criterio que para las zonas (`R-09`) y para la orden (`R-29`)—: **vela blanca, primero el máximo; vela azul, primero el mínimo**. Un reingreso **bajista** de una sola vela necesita vela **blanca** (primero la consecución arriba, después la vuelta abajo); uno **alcista**, vela **azul**. Si el color dice lo contrario, el precio atravesó la zona **antes** de la consecución: no es un rompimiento que falla, y **en esa vela no hay reingreso**.
- **Vela de consecución sin cuerpo** (apertura = cierre): la consecución **cuenta** —el precio pasó del extremo de la vela de rompimiento, sea cual sea el color—, pero sin color no se sabe qué llegó primero, así que **esa vela no es vela de reingreso**: se mira lo que hace el precio después.
- **🔴 Sin zona a la que ir, no hay reingreso.** Si en la dirección del reingreso no queda ninguna zona activa más allá del objetivo, el precio tiene **camino libre**, y el camino libre es terreno de la Continuación, no del Reingreso: ese rompimiento fallido no se opera. Se suma a los otros dos filtros del objetivo, no los sustituye: entre la entrada y el objetivo sigue sin poder haber ninguna zona activa (`R-32`) ni ningún punto de referencia vivo (`R-41`).
- **Cuándo se mira:** al poner la orden, con las zonas activas de ese momento, como los demás filtros; y otra vez si la orden se vuelve a poner tras una noticia roja (`R-35`). Con la orden puesta no hace falta vigilarla: la zona está más allá del objetivo y el objetivo más allá de la entrada, así que el precio no puede llegar a ella sin llenar antes la orden.
- **Dirección:** en la forma a, contraria al rompimiento fallido; en la forma b, la del rompimiento, hacia la zona ya cotizada.
- **Filtro propio — el punto de referencia (`R-41`):** el objetivo tiene que quedar del lado de dentro del nivel de referencia de **cualquier retroceso vivo** que quede entre la entrada y el objetivo; ese nivel muere cuando una vela **cierra** más allá. Si el objetivo lo pasa, **el reingreso es inválido y no se opera**.
- **La orden:** Stop Market al cierre de la vela de reingreso, en el nivel de consecución. **Se comprueba el punto de referencia antes de enviarla.**

### Por qué

> 🔑 **Es la contraria de la Continuación:** la Continuación opera el rompimiento que **funciona**; el Reingreso, el que **falló**. Es el único setup del plan con un segundo filtro de objetivo, y su orden muere solo por `R-29`.

**Caso que SÍ es reingreso — 6/07/2026:** zona `R` 29.926,50–29.939,25. Rompe la vela 8:46; la 8:47 da la consecución subiendo a 29.967,25 y **esa misma vela** se desploma a 29.908,75, otra vez bajo la zona → reingreso válido, y la misma vela es consecución y vela de reingreso (`G-12`).

**Por qué hace falta una zona a la que ir** (14/10/2026, plan 3.47). Palabras del operador: *"lo que buscamos con el reingreso es una probabilidad en esa dirección. No significa que deba ir hasta la otra zona, sino que tiene posibilidad de ir a testear esa otra zona, que no haya puntos de referencia en contra, y ahí aplica el reingreso"*. Y sobre el camino libre: *"esa es la filosofía de una continuación"*.

**Forma b — caso de origen, 28/10/2026** (día de Fed, plan 3.52). La bajada termina a las 8:50 y deja el soporte 29.770,25 – 29.777,00, que no se rompe. La subida deja la resistencia de la 8:52 (29.801,75 – 29.812,50); la 8:54 la rompe y la 8:55 da la consecución. Arriba quedan los soportes de la 8:31 y la 8:39, nacidos esa mañana: **Reingreso alcista** en 29.816,75, stop 29.783,50, objetivo 29.850,00 → TARGET a las 8:59, +33,25. Palabras del operador: *"el mercado frena, genera zona, no la rompe, genera su zona contraria, la rompe, hace consecución, por lo tanto se piensa en una entrada. Ahora no es continuación, porque el camino no está libre, es decir, es una zona ya cotizada y puede ir hacia la otra zona"*; *"en un reingreso necesitamos es un cambio de tendencia"*. Y sobre el premercado: *"una zona que se haya creado después de la apertura del mercado N.Y, mas no zona de premercado, porque en ese caso no sería un reingreso, sino una continuación"*. Medido en los 81 días con datos (junto con aplicar `BLOQUE_DESDE` a todos): cambian cuatro operaciones, revisadas por el operador — 28/10 (+33,25), 8/10 (Continuación +30,25 → Reingreso −19,75), 8/09 (sin operación: con el bloque, el soporte de la 8:38 nace aparte y el reingreso de la 8:51 desaparece) y 31/07 (+72,00 → +61,25).

**Caso que NO lo es, sin zona a la que ir — 14/10/2026:** la resistencia de premercado de la 7:42 (30.557,00 – 30.572,75) se rompe con la vela 8:31; la 8:32 da la consecución y, en la misma vela blanca, se desploma bajo la zona entera. La mecánica del reingreso se cumple, pero por debajo **no había ninguna zona activa**: camino libre, no hay trade. El motor lo había operado: STOP, −65,50.

**Por qué no tiene plazo — caso de origen, 22/10/2026** (plan 3.51). Resistencia de la 8:35 (29.543,25 – 29.562,75): rompe la vela 8:58 (máx 29.566), consecución la 8:59 (máx 29.567). La 9:00 sube primero a 29.569,50 —pasa del extremo de la consecución— y después atraviesa la zona entera hasta 29.540,50: vela de reingreso. La 9:01 da la consecución, la entrada: corto en 29.540,25, stop 29.569,50. Con la regla anterior no había reingreso, porque el precio había pasado del extremo de la consecución. Palabras del operador: *"un reingreso no necesariamente es inmediato, un reingreso es cuando el precio reingresa a una zona, tiene posibilidad de ir a otra zona donde el precio ya cotizó, y no tiene puntos de referencia en contra"*; y sobre el plazo: *"mientras la zona esté viva, sin límite de velas, siempre y cuando tenga espacio de recorrido, es decir, no supere el límite de puntos, no supere una zona activa, y no supere un punto de referencia"*. Al aplicarlo a los 76 días con datos cambian cuatro, los cuatro revisados por el operador: 22/10 (Continuación −53,25 → Reingreso −29,25), 20/08 (Reingreso +46,50), 29/07 (Reingreso −54,50) y 9/07 (el reingreso de la 8:54 no llega a su consecución, pero su orden va primero y la Continuación entra una vela después: −29,75 → −35,00).

**Caso que NO lo es — 13/07/2026:** zona `R` 29.652,25–29.666,75. Rompe la vela 9:25 (máx 29.677,25), consecución la vela 9:27 (máx 29.681,00) y el precio **sigue subiendo** hasta 29.724,00. La vela 9:41, catorce velas después, vuelve a atravesar la zona: desde la 3.51 el plazo ya no la descarta, pero **el objetivo (29.565,50) pasa del punto de referencia 29.570,00**: no hay espacio de recorrido y **no es un reingreso**. Hasta la 3.50 se descartaba por llegar tarde.

**Caso que NO lo es, en una sola vela — 16/09/2026, tres veces:** 8:46, 9:00 y 10:09. Las tres velas son azules: bajan primero bajo la zona y después suben y dan la consecución. Palabras del operador: *"para pensar en un reingreso es solo después de que falla una consecución"*. Las tres tenían además el camino tapado: una zona pegada y el punto de referencia de la 8:59 en la de 9:00, y el de la 10:07 en la de 10:09. Y sobre la vela sin cuerpo, 28/09/2026: *"independientemente del color, si el precio sube por encima de la vela de rompimiento, pues sí hubo consecución; toca revisar qué hace después para saber qué hacer"*.

Diagrama: `02_Assets\diagramas\R-26_reingreso.png`

## R-40 · Corrida fluida

> **Solo se entra en el rompimiento de la zona de una corrida FLUIDA.** Una corrida es fluida cuando la secuencia sale bien **tres veces seguidas**: la corrida deja su zona · el retroceso no se pasa · y la corrida siguiente rompe esa zona.

| | |
|---|---|
| Aplica a | Continuación |
| Parámetros | `STOP_MAX` |
| Relacionadas | R-06 · R-07 · R-09 · R-10 · R-15 · R-25 |
| Casos | G-22 · G-24 |

### Cómo se aplica

**Cómo se emparejan corrida y retroceso.** La vela de apertura dice cómo **empieza el primer movimiento**, no la dirección del día (`R-07`). **Cada tramo se juzga en su propio sentido:** una corrida alcista con el retroceso que viene justo después de ella, y una corrida bajista con el suyo.

**Las tres condiciones**, sobre la zona que se va a romper, antes de colocar la orden:

| | Condición |
|---|---|
| **1** | la **corrida** deja su zona al terminar (`R-09`) |
| **2** | el **retroceso no se pasa**: mide menos que su corrida. Empate cuenta como que no se pasa |
| **3** | la **corrida siguiente rompe** esa zona. Vale aunque la rompa la misma vela que hace el retroceso: primero va en contra y después rompe |

Cumplidas las tres, ese rompimiento es la entrada — el cuarto paso de la Continuación (`R-25`). Los dos primeros se miden sobre el zigzag: la corrida, de su punto de arranque a su extremo; el retroceso, de ese mismo extremo a su nivel de referencia (`R-06`).

**Las cuatro formas de fallar**, y basta una:
- **A · El retroceso se pasa.** Mide más que su corrida: la zona de esa corrida ya no da entrada. **La zona que deja ese retroceso no cae con ella:** se juzga en su propio sentido, como primer o segundo IRI.
- **B · La corrida siguiente no rompe.** Llega a la zona y no la pasa, **o la rompe sin consecución y se devuelve**. Esa zona ya no da entrada, aunque el precio la vuelva a romper más tarde.
- **C · Es el primer IRI después de un movimiento contrario.** Aunque cumpla las tres condiciones, no es fluido. Se espera un **segundo IRI** en ese sentido, con su zona nueva **entera más allá** de la del primero, y se entra en la consecución del rompimiento de esa zona.
  - **Un retroceso del movimiento contrario no es un IRI** *(plan 3.53, 29/10/2026)*. Si después de una corrida el movimiento contrario **vuelve a tocar el punto donde arrancó esa corrida** —sin pasarlo—, esa corrida era el **retroceso del movimiento contrario**: romper su zona **no cuenta como primer IRI**, y el primer IRI en ese sentido **sigue pendiente**. Si el movimiento contrario lo **pasa**, manda la forma A, como siempre.
- **D · Mercado mixto.** Cuando un tramo llega más allá del **punto donde empezó** el IRI anterior, no se opera en ningún sentido hasta que se arme un IRI por fuera de **los extremos: la resistencia más alta y el soporte más bajo**. Después se espera el segundo IRI, como en C.

**El bloqueo es del sentido que perdió la fluidez**, no de esa zona ni del día. Perdida la fluidez, **no se opera ningún rompimiento en ese sentido**, sea cual sea la zona — incluidas las **zonas de premercado** (`R-15`), que no tienen corrida detrás y a las que por eso no se les puede mirar si su corrida fue limpia: el bloqueo las alcanza igual. **El otro sentido lleva su propia cuenta.**

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

#### Cada tramo en su sentido, el segundo IRI y el mercado mixto (29/09/2026)

Sobre la jornada del **1/09/2026**, la primera del backtesting hacia atrás. Hasta aquí la regla decía que la vela de apertura declaraba **el sentido del día**, al revés que `R-07`. El operador: *"la dirección de la vela de apertura no declara la dirección del día, declara cómo inicia el primer movimiento de la apertura"*. La apertura baja (tramo 1); la bajada siguiente (3) no rompe el soporte de 8:32: se pierde la fluidez bajista. **2-3-4 es un IRI normal, hacia arriba**, pero *"el movimiento antecesor de ese (1) fue bajista, por lo tanto le quita fluidez al IRI 2-3-4, y lo que yo haría sería esperar otro IRI arriba, un segundo IRI alcista para pensar en largos"* (forma C). El tramo 5 baja hasta 29.040,00, más allá de donde empezó el 2 (29.062,75): *"el mercado está mixto, entonces debo esperar un IRI sobre los extremos"*, que son *"la resistencia más alta y el soporte más bajo"* (forma D). La resistencia de 9:17 se rompe a las 9:23 sin consecución y se devuelve; a las 9:31 se rompe otra vez, y no se opera: *"la 9:23 ya falló"* (forma B). La entrada del día la da la resistencia de 9:42: la vela de **9:43** primero baja —hace el retroceso— y después la rompe; *"la entrada de las 09:44 es válida"*. Largo en 29.224,50, **+15,75 pts**.

**La zona del retroceso que se pasa no cae** (30/09/2026). Al pasar el motor a esta redacción cambiaron cuatro días de julio, y el operador los revisó uno a uno. En el **20/07/2026** la apertura sube; el soporte de 8:37 se rompe a las 8:40 y es el primer IRI hacia abajo, que no se opera; la bajada de 8:46 a 8:54 (165,00) se pasa de la subida anterior (73,00) y deja el soporte 29.027,50 – 29.052,00. Hasta aquí la regla decía que esa zona caía junto con la de la corrida. El operador: *"sí, la ruptura de las 8:57 es entrada"* — es el segundo IRI hacia abajo, con la zona entera por debajo del primero. Corto en 29.018,25, **+54,50 pts**. En el **16/07/2026** el segundo IRI (soporte de 8:41) cumple y se descarta por `STOP_MAX` (88,00 pts); el tercero (soporte de 8:44) se opera: corto en 29.308,25, **−66,75 pts**. El **7/07** da el corto de 9:43 (**−56,50**) y el **9/07** el largo de 8:55 (**−29,75**).

**Un retroceso del movimiento contrario no es un IRI — 29/10/2026** (plan 3.53). La apertura baja de la 8:31 a la 8:36 (29.407,50); la subida de la 8:36 a la 8:37 (29.480,50) deja la resistencia de la 8:37, y la bajada de la 8:39 vuelve **exactamente** a 29.407,50. La 8:42 rompe la resistencia de la 8:37: el motor lo contaba como el primer IRI al alza, y el de la 8:46 —la subida de la 8:39 a la 8:45 y la vela de la 8:46, que retrocede y rompe— como el segundo, y entraba: STOP, −51,75. Palabras del operador: *"para mí eso no fue un IRI, para mí tu 2 IRI fue mi primer IRI, y por eso yo no ingresé"*; la subida de la 8:36 a la 8:37 *"era el retroceso de la bajada"*. Con la regla, la 8:46 es el primer IRI y el día queda sin operación. Si la bajada hubiese pasado del mínimo, seguiría mandando la forma A: el operador lo confirmó sobre el 11/08 (Continuación alcista de la 9:09, que se queda como estaba). Medido en los 81 días con datos: solo cambia el 29/10.

**Origen:** sesiones de septiembre — jornadas del 10, 11 y 14 de septiembre de 2026, y la revisión del 16/07. Ver `05_Backtesting\claude\protocolo\DISCREPANCIAS.md`.

## R-41 · Punto de referencia

> **El objetivo de un reingreso no puede pasar del nivel de referencia de un retroceso anterior que siga vivo.** Solo aplica al reingreso.

| | |
|---|---|
| Aplica a | Reingreso |
| Parámetros | — |
| Relacionadas | R-06 · R-20 · R-21 · R-26 |
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

> 🔴 **Ojo: aquí el rompimiento se lee por el CIERRE.** Es la única cosa del plan que **no** se rompe por la mecha. Una zona se rompe con que la mecha la pase por un tick (`R-20`); un punto de referencia **necesita que una vela cierre más allá**. Si algún día esto se olvida, el filtro deja de funcionar: casi todos los puntos de referencia acaban pinchados por una mecha en algún momento.

### Por qué

**Palabras del operador, 14/09/2026:** *"Un punto de control es un retroceso que dice que en ese punto se puede volver a presentar como una zona que el precio lo puedan defender para evitar que lo rompan."* Y el 24/08/2026, con el mismo razonamiento: *"pueden defender ese nivel y el trade le quita probabilidad, por lo tanto para un reingreso debe tener camino libre para el target"*.

No es un nivel nuevo que haya que buscar: **es un vértice del zigzag de corridas y retrocesos que el plan ya dibuja**. Lo único que añade esta regla es que ese vértice, además de estar ahí, **tapa el objetivo de un reingreso**. Del dibujo, el operador: *"la idea es tener el gráfico lo más limpio posible"*.

**Caso de origen · viernes 11/09/2026.** Reingreso bajista a las **9:01** sobre la zona de premercado de 8:29: entrada **29.440,25**, stop **29.475,00**, objetivo **29.405,50**, riesgo 34,75. El punto de referencia de la vela de **8:58**, en **29.423,00**, queda en medio — y el objetivo lo pasa. **Descartado.** El operador tampoco lo tomó. Sin esta regla el día habría dado +34,75 pts; con ella, la jornada es **NO OPERA**.

**Origen:** sesiones de septiembre, el 14/09/2026 sobre la jornada del 11/09 — ver `05_Backtesting\claude\protocolo\DISCREPANCIAS.md`.
