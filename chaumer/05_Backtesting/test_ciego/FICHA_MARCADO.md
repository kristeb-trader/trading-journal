# FICHA DE MARCADO — generada automáticamente

> ⚙️ **No editar a mano.** Generada desde `01_Plan/reglas.json` el 2026-09-26 con `generar_ficha.py`.
> Si algo aquí contradice a las reglas (`01_Plan/reglas/`), mandan las reglas — y se vuelve a generar la ficha.
> Los nombres en `MAYÚSCULAS_CON_GUION` son parámetros: su valor está al final, en `PARAMETROS.md`.

**40 reglas.** Aquí van sin el porqué ni los ejemplos: solo lo que hay que aplicar.

---

## Perímetro operativo  (4)

#### `R-01` · Instrumento, gráfico y timeframe

Analiza, marca zonas y ejecuta **todo sobre MNQ**. Un solo gráfico.

**Cómo se aplica**

- **Un solo gráfico:** MNQ en velas japonesas de **1 minuto**. Es el único timeframe que decide.
- **Todo sobre ese gráfico:** se marcan las zonas, se lee el volumen, se leen los niveles de entrada, stop y objetivo, y se envía la orden.
- **Los niveles salen del gráfico de MNQ:** se lee el máximo (largo) o el mínimo (corto) real de la vela y se le aplica el desplazamiento de un `TICK`.
- **Valores de MNQ:** $2,00 por punto · un `TICK` = $0,50.

#### `R-02` · Ventana operativa

Opera únicamente durante los 120 minutos siguientes a la apertura de la sesión americana.

**Cómo se aplica**

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

#### `R-03` · Plantilla de gráfico

Opera con un gráfico limpio: velas de 1 minuto y volumen, nada más.

**Cómo se aplica**

- **Único indicador:** **Volume Up Down** (NinjaTrader), sobre el gráfico de MNQ (`R-01`). El umbral de volumen del premercado se lee sobre esa barra, en la vela de 1 minuto.
- **Prohibido:** medias, osciladores, VWAP y perfil de volumen.
- **No se añade ninguna herramienta** al gráfico sin revisar antes este plan.

#### `R-04` · Tamaño de posición

Opera siempre con `CONTRATOS`. El tamaño no cambia por capital, racha ni convicción.

**Cómo se aplica**

- **Siempre `CONTRATOS`.** No sube aunque la cuenta crezca; no baja aunque la cuenta caiga.
- **Revisión anual:** es el único momento en que se evalúa cambiar el número de contratos.

---

## Estructura del precio  (4)

#### `R-05` · Corrida (= impulso)

Una corrida (= impulso) es la secuencia de velas que arranca cuando una vela supera el extremo de la anterior y termina en la primera vela que retrocede al menos 1 tick contra ella.

**Cómo se aplica**

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

#### `R-06` · Retroceso

El retroceso es la secuencia de velas que arranca en la vela que mata la corrida y termina cuando nace la siguiente corrida.

**Cómo se aplica**

- **Tras una corrida alcista:**
  - **Empieza:** primera vela con `mínimo[n] ≤ mínimo[n−1] − 1 TICK`. **Termina:** primera vela con `máximo[n] > máximo[n−1]`.
  - **🎯 Su nivel de referencia = el mínimo MÁS BAJO de todas las velas del retroceso.** No el de la primera, no el de la última.
  - **Color irrelevante:** una vela verde dentro del retroceso no lo termina si no hace máximo más alto.
- **Tras una corrida bajista (espejo):** empieza con `máximo[n] ≥ máximo[n−1] + 1 TICK` · termina con `mínimo[n] < mínimo[n−1]` · su nivel de referencia es el **máximo más alto**.
- **Número de velas:** irrelevante, sin mínimo ni máximo. **Tamaño mínimo:** ninguno (`P-12`). **Tamaño máximo:** ≤ `STOP_MAX` (`R-31`).
- **El nivel de referencia define el retroceso, no el stop.** El stop se mide con `R-32`: el extremo alcanzado **desde que nació la zona** hasta la vela de rompimiento — no solo el extremo del retroceso que la originó.

#### `R-07` · Vela base de la ventana operativa

La primera vela de la ventana operativa (**08:31** hora Colombia) **declara la dirección inicial de la sesión con su propio cuerpo**, y es la vela origen. Cierre por encima de su apertura → el mercado **inicia alcista**. Cierre por debajo → **inicia bajista**.

**Cómo se aplica**

- **Las velas de las 08:30 y anteriores son premercado.** No sirven como `n−1` para `R-05` ni para `R-06`, ni para nada.
- **La dirección NO la declara la 08:32.** La declara la propia **08:31**, por la posición de su cierre respecto de su apertura.
- **Es la vela origen.** La corrida se mide desde su **mínimo** si es alcista, desde su **máximo** si es bajista.
- Desde la **08:32** en adelante manda `R-05` con normalidad, comparando **siempre contra la vela inmediatamente anterior**.
- **Puede sostener zona** como cualquier otra vela.

#### `R-08` · Vela envolvente sin corrida viva

Una **vela envolvente** es la que hace **máximo mayor Y mínimo menor** que la anterior. Cuando aparece **sin corrida viva**, no declara dirección: pasa a ser la nueva vela origen y la dirección la da la vela siguiente.

**Cómo se aplica**

- Sin corrida viva, si `máximo[n] > máximo[n−1]` **y** `mínimo[n] < mínimo[n−1]` → la vela `n` es el **nuevo origen**. Se evalúa `n+1` contra `n`.
- Si `n+1` **también** es envolvente, se repite: `n+1` pasa a origen y decide `n+2`. Sin límite de repeticiones.
- La corrida se mide desde el extremo de la **última** vela origen.
- **NO aplica con corrida viva.** Ahí manda `R-05`: mínimo menor **mata** la corrida, sea envolvente o no.

---

## Zonas  (14)

### — marcado —

#### `R-09` · Marcar una zona

Marca la zona sobre la vela designada, desde el borde de su cuerpo hasta el extremo de su mecha, y extiéndela hacia la derecha.

**Cómo se aplica**

- **La vela designada:** la de **máximo más alto** (corrida alcista) o **mínimo más bajo** (corrida bajista), contando desde el origen de la corrida **hasta la vela que dispara el retroceso, ambas incluidas**.
- **Cuándo:** al aparecer el retroceso (`R-06`), no antes.
- **Los límites:** del borde del cuerpo al extremo de la mecha. En una resistencia, el límite inferior es el borde superior del cuerpo —el cierre si la vela es verde, la apertura si es roja— y el superior, el máximo de la vela.
- **Vela sin mecha:** la zona es una línea en el extremo de la vela.
- **Vela sin cuerpo** (apertura = cierre): el cuerpo mide cero; la zona va de ese precio a la punta de la mecha.
- **El retroceso también marca zona:** el retroceso de una corrida alcista marca **soporte**, y el de una corrida bajista, **resistencia**. Sujeto a `R-12`: si el movimiento cruza el 50 % entre las zonas vecinas, no se marca.
- **Se extiende hacia la derecha** a lo largo del gráfico.

#### `R-10` · Estirar la zona · rompimiento con mecha sin consecución

El precio rompe una zona **con mecha** —el cierre se queda dentro— y la consecución no llega. La zona se extiende hasta la punta de esa mecha: si es una **resistencia** se estira solo por arriba; si es un **soporte**, solo por abajo.

**Cómo se aplica**

El rompimiento con mecha sin consecución se acaba de dos maneras, y vale **la que llegue primero** — el disparador es el plazo **resuelto**, no el plazo vencido:

**Una ·** pasa el `PLAZO_CONSECUCION`, contado desde la vela siguiente a la del rompimiento, y la consecución no ha llegado.

**Otra ·** antes de que se cumpla ese plazo, el mercado arma una **estructura completa en sentido contrario**: una vela que no da la consecución y se va en contra, otra que hace retroceso, y una tercera que no sigue ese retroceso y vuelve en el sentido de la primera. **La zona se estira en esa tercera vela**, sin esperar más (`R-14`).

En cualquiera de los dos casos, la zona se extiende hasta la punta de la mecha que la rompió. **Qué borde se mueve lo decide el tipo de zona, no el lado del rompimiento:** una resistencia se estira solo por arriba; un soporte, solo por abajo. El otro borde no se mueve. Sigue habiendo **una sola zona**, más grande, y conserva su historial de rompimientos y consecuciones. No se crea ninguna zona nueva.

> 🔴 **Un soporte nunca se estira hacia arriba, ni una resistencia hacia abajo.** Si el precio cruza la zona por el lado contrario —el cruce de vuelta, cuando ya la traspasó una vez—, **no hay nada que estirar**: ese cruce no la toca, solo la mata cuando llegue su consecución (`R-21`).

#### `R-11` · Zona apéndice · rompimiento con cuerpo sin consecución

El precio rompe una zona **con cuerpo** —el cierre queda fuera— y la consecución no llega. La zona original no se toca y nace una **segunda zona** sobre la mecha de la vela de rompimiento: un borde es el borde del cuerpo de esa vela, el otro es la punta de su mecha.

**Cómo se aplica**

El rompimiento con cuerpo sin consecución se acaba de dos maneras, y vale **la que llegue primero** — el disparador es el plazo **resuelto**, no el plazo vencido (`R-14`):

**Una ·** pasa el `PLAZO_CONSECUCION`, contado desde la vela siguiente a la del rompimiento, y la consecución no ha llegado.

**Otra ·** antes de que se cumpla ese plazo, el mercado arma una **estructura completa en sentido contrario**: una vela que no da la consecución y se va en contra, otra que hace retroceso, y una tercera que no sigue ese retroceso y vuelve en el sentido de la primera. **La apéndice nace en esa tercera vela**, sin esperar más.

En cualquiera de los dos casos **la zona original no se toca** y nace una **segunda zona** sobre la mecha de la vela de rompimiento: un borde es el **borde del cuerpo** de esa vela, el otro es la **punta de su mecha**. Quedan **dos zonas**, la original y su apéndice.

La apéndice se dibuja **desde la vela de rompimiento**, su vela origen, aunque no quede marcada hasta ese momento. Es del **mismo gris** que cualquier otra zona (`R-19`, precisión 3).

#### `R-12` · Zonas entre zonas — la regla del 50 %

Marca una zona entre dos zonas solo si el movimiento que la genera queda entero dentro de la mitad en la que empezó.

**Cómo se aplica**

- **Cuándo aplica:** hay una zona por arriba y otra por abajo.
- **La referencia del 50 %** (`UMBRAL_50`): el punto medio entre el borde interno de la zona superior y el borde interno de la inferior, **recalculado** contra la zona más cercana por arriba y la más cercana por abajo en ese momento.
- **Se mide el recorrido del precio —el movimiento—, NO el rectángulo de la zona.** Si el movimiento cruza el 50 % en algún punto, no se marca zona, aunque el rectángulo quede entero a un lado.
- **Quedar exactamente EN el 50 % sí marca;** hace falta superarlo por **≥1 tick** para anularla.
- **Una sola zona por banda y por jornada, y es la del primer retroceso** (`R-17`, Alfredo, 27/08/2026).
- Es una **prohibición con excepción rara** — el operador: *"pasa poco, pero sí pasa"*.

#### `R-13` · Superposición de zonas — se estira, no se duplica

Si la zona que ibas a marcar toca una existente, no marques una nueva: estira la existente.

**Cómo se aplica**

- **El disparador:** la zona candidata toca en cualquier punto una zona ya marcada **del mismo tipo**; el contacto de bordes cuenta.
- **Crear una zona nueva está prohibido:** se estira la existente hasta el extremo más lejano de la candidata. Queda **una** zona.
- **Se estira SOLO hacia el nuevo extremo;** el otro borde no se mueve. No se engloba.
- **La zona estirada conserva su historial** de rompimientos y consecuciones (`R-21`).
- **Candidata dentro de la existente:** sin cambios; no hay nada que extender.
- **No se solapan zonas de tipo distinto** mientras una esté vigente: una zona viva ocupa su franja de precio.

#### `R-14` · El plazo de consecución es un tope, no una espera

El plazo de consecución (`PLAZO_CONSECUCION`) es un **tope, no una espera obligatoria**: si antes de que se cumpla el mercado **arma una estructura completa en sentido contrario al rompimiento**, la geometría se resuelve **en ese momento**, sin esperar a que se agote el plazo.

**Cómo se aplica**

**Qué cuenta como «estructura completa al contrario» — tres velas.** Tomando como ejemplo un **soporte roto hacia abajo** (al revés para una resistencia rota hacia arriba):

| Vela | Qué tiene que hacer | Condición medible |
|---|---|---|
| **1ª** | **no da la consecución y sube** | su mínimo **no pasa** del extremo de la vela de rompimiento |
| **2ª** | **hace retroceso** | su mínimo es **MENOR** que el de la vela anterior **y NO pasa** del extremo de la vela de rompimiento |
| **3ª** | **no sigue bajando: vuelve a subir** | aquí queda armada la estructura → **aquí se marca la zona** |

- **Si el retroceso de la segunda vela pasa del extremo** de la vela de rompimiento, **ya no es un retroceso: es la consecución**. No hay apéndice ni estiramiento; la zona queda traspasada.
- **Qué se marca:** exactamente lo mismo que al vencer el plazo — **solo cambia el momento**. Rompimiento con **mecha** → la zona original **se estira** hasta esa mecha (`R-10`). Rompimiento con **cuerpo** → nace la **zona apéndice**, del cuerpo de la vela de rompimiento hasta el final de su mecha (`R-11`). **Aplica igual a los dos caminos, sin excepción.**
- **Dibujo:** la apéndice es **del mismo gris que cualquier otra zona** y se dibuja **desde la vela de rompimiento**, que es su vela origen — aunque **no esté marcada** hasta el momento en que la estructura queda armada (`R-19`, precisión 3).
- **Simetría:** aplica igual hacia arriba. Resistencia rota **con cuerpo hacia arriba** + estructura **bajista** completa antes del plazo → la apéndice nace ahí mismo.
- **Si no hay estructura contraria:** se espera al `PLAZO_CONSECUCION` y se aplica `R-10` o `R-11`.
- **Si la zona nueva toca la existente,** `R-13` la convierte en extensión.

**⚠️ Excepciones**

- Si el precio simplemente se va en sentido contrario **sin hacer retroceso en el medio**, no hay estructura: se espera al plazo. **Caso real 20/07/2026 — el contraejemplo que la delimita:** la vela 8:40 rompe el soporte de la 8:37 con cuerpo. Después el precio sube **cuatro velas seguidas** (8:42, 8:43, 8:44, 8:45) **sin hacer retroceso en el medio**, así que nunca llega a armar la estructura contraria. La apéndice nace por plazo vencido, en la **8:45**. Subir no basta: hace falta la estructura completa.

#### `R-15` · Zona de premercado — la única que nace del volumen

En la ventana de premercado —desde las `PREMERCADO_INICIO` del día anterior hasta la apertura americana—, marca zona sobre **toda** vela cuyo volumen supere el umbral: `UMBRAL_VOL`. Fuera de esa ventana la regla no aplica.

**Cómo se aplica**

- **La ventana de escaneo:** desde `PREMERCADO_INICIO` (19:00 hora Colombia, 09:00 JST, la apertura de Tokio; fija todo el año) hasta la apertura del mercado americano, el inicio de `R-02`: 08:30 Col en verano de EE. UU., 09:30 Col en invierno. Son 13 h 30 en verano (~810 velas) y 14 h 30 en invierno (~870 velas).
- **No confundir con el sombreado gris** del indicador Premercado.1, que empieza a las 15:00 Col del día anterior y llega a las 08:30 Col: es **solo visual** y no define dónde se buscan zonas.
- **El umbral:** `UMBRAL_VOL`, sobre la barra del indicador Volume Up Down (`R-03`). Es un **parámetro ajustable**, no un número fijo del método: lo fija el operador y **no se cambia con la sesión empezada**.
- **Se marcan TODAS las velas que superen el umbral,** sin seleccionar. No solo el extremo del grupo; `R-13` fusiona las que se tocan.
- **El color decide el tipo:** vela alcista → **resistencia** sobre la mecha superior; vela bajista → **soporte** sobre la mecha inferior.
- **Los límites:** del borde del cuerpo al extremo de la mecha, igual que `R-09`.
- **Después se comporta como cualquier zona:** `R-21`, `R-10`, `R-11`, `R-12`, `R-13` y `R-14` aplican sin excepción. También hace de **borde de banda** para `R-17`.

**⚠️ Excepciones**

- **Tras la apertura del mercado americano la regla del volumen se APAGA:** dentro de la sesión solo se marcan zonas por estructura (`R-09`), sin importar el volumen de la vela.

#### `R-16` · Cuándo se dibuja cada zona

Las dos zonas que genera una estructura **no se dibujan en el mismo momento**. La zona de la corrida se marca al aparecer el retroceso. La zona del retroceso solo se dibuja cuando el retroceso queda **confirmado**; hasta entonces se marca una **línea provisional** de nivel.

**Cómo se aplica**

Tras una corrida **alcista**:

| | Cuándo | Qué se dibuja |
|---|---|---|
| **Zona de la corrida** (RESISTENCIA) | En la **primera vela del retroceso**, en vivo | **Zona** completa y ya definitiva (`R-09`, `R-14`) |
| **Zona del retroceso** (SOPORTE) | Mientras el retroceso sigue vivo | **Línea provisional** en el mínimo más bajo alcanzado hasta ese momento. Se **baja** con cada vela que hunda más el mínimo |
| | Al aparecer una vela con **máximo mayor** → retroceso confirmado | La línea se convierte en **zona** sobre la vela del mínimo más bajo, aplicando `R-09` |

- **Espejo bajista:** la corrida marca **soporte** en vivo; el retroceso lleva la línea provisional en el **máximo más alto** hasta que una vela hace **mínimo menor**.
- **La línea provisional no opera.** No es zona: no admite rompimiento, ni consecución, ni reingreso. Solo señala el nivel.
- **Sigue sujeta a `R-12`.** Al confirmarse, si el movimiento cruzó el 50 % entre bordes internos, la línea **no llega a ser zona** y se borra.
- **Consecuencia sobre `R-14`:** un retroceso nuevo **marca la zona de la corrida** en su **primera vela, al aparecer**; pero **su propia zona no existe hasta que termina**. Y un retroceso nuevo **NO mata la orden pendiente** (`R-29`).

#### `R-17` · Una sola zona entre zonas, por banda y por jornada

Dentro de una banda entre dos zonas se marca **como máximo una** zona en toda la jornada, y el turno es **del primer retroceso** que aparezca dentro.

**Cómo se aplica**

| # | Paso |
|---|---|
| 1 | La **banda** va del borde interno de la zona de abajo al borde interno de la de arriba |
| 2 | El **primer retroceso** que aparezca dentro de esa banda la resuelve |
| 3 | Si respeta el 50 % (`R-12`) **se marca**; si no lo respeta **no se marca** |
| 4 | **En los dos casos la banda queda cerrada** para el resto de la jornada operativa |
| 5 | La banda **no se vuelve a abrir** aunque se mueran las zonas que la formaron: ni la resistencia de arriba, ni el soporte de abajo, ni la propia zona de dentro devuelven el turno al quedar traspasadas por los dos lados |
| 6 | Solo se marcan zonas que **salgan fuera** de esa banda — y salir fuera es `R-18`, no geometría |
| 7 | Una **zona de premercado** (`R-15`) cuenta como **borde de banda** igual que cualquier otra zona viva |
| 8 | 🔴 **Una zona inválida sigue ocupando su sitio.** El turno se cuenta sobre **todas** las zonas —activas e inválidas— y también sobre las que se marcaron **antes de que la banda existiera**. Deja de valer como zona; **no deja de ocupar el sitio**. Lo que queda cerrado es **la banda entera**, no solo el rectángulo de la zona muerta |

#### `R-18` · Salir de una zona es rompimiento + consecución

Salir de una zona o de una banda es rompimiento más consecución, no geometría.

**Cómo se aplica**

- **No se marca ninguna zona al otro lado de una zona viva cuyo rompimiento esté todavía esperando su consecución.**
- **Decide el extremo del movimiento, no el rectángulo** de la zona candidata: si el extremo pasa el borde de esa zona, no se marca — aunque el rectángulo de la zona nueva se solape con el de la vieja.

#### `R-19` · Cómo se dibuja una zona — seis precisiones

Seis detalles de dibujo que el operador corrigió al auditor sobre casos reales del 8 de julio.

**Cómo se aplica**

| # | Precisión | Caso que la fija |
|---|---|---|
| 1 | **El rompimiento se lee por la MECHA, no por el cierre.** Basta pasar 1 tick del borde | 8/07 vela 8:37: cierra dentro de la zona, pero su mínimo baja de 29.277,50 → rompe |
| 2 | Una zona **no queda invalidada por el rompimiento solo**: hace falta la vela de consecución | ver `R-20` |
| 3 | El **rectángulo se dibuja desde la vela origen**, no desde la vela que confirma | 8/07: la resistencia de la vela 8:33 arranca en la 8:33, no en la 8:36 |
| 4 | Se estira **solo hacia el nuevo extremo**; el otro borde no se mueve | ver `R-13` |
| 5 | **No se solapan zonas de tipo distinto** mientras una esté vigente. Una resistencia superada **cambia de papel a soporte** y sigue ocupando su franja | 8/07 vela 8:43: no se puede dibujar soporte donde ya vive la zona de la 8:37 |
| 6 | Cuando una vela hace máximo mayor **y** mínimo menor, **el orden de lo que hace por dentro decide** qué vela sostiene la zona | 8/07 vela 8:36 (primero baja) vs 10/07 vela 8:36 (primero sube) |

### — vigencia —

#### `R-20` · Rompimiento y consecución

Rompimiento es superar el borde de la zona por al menos un tick; consecución es superar por un tick el extremo de la vela de rompimiento. La consecución que **traspasa** una zona no tiene plazo.

**Cómo se aplica**

- **Rompimiento:** un `TICK` más allá del borde de la zona. El cierre de la vela de rompimiento es irrelevante para que haya rompimiento — **la mecha basta**.
- **Con cuerpo o con mecha:** el rompimiento es **con cuerpo** si el cierre queda más allá del borde traspasado; **con mecha**, si no.
- **Consecución al alza:** máximo de la vela de rompimiento + 1 `TICK`. **A la baja:** mínimo de la vela de rompimiento − 1 `TICK`.
- **El traspaso de la zona NO tiene plazo:** el rompimiento queda pendiente indefinidamente y la consecución lo confirma cuando llegue, aunque sea muchas velas después.
- **El `PLAZO_CONSECUCION`**, contado desde la vela siguiente a la de rompimiento, gobierna solo **la geometría de la zona** (`R-10`, `R-11`, `R-14`) y **la vida de la orden** (`R-29`), no el traspaso. Las dos cosas ocurren sobre el **mismo** rompimiento: primero nace la apéndice o se estira la zona, y más tarde el traspaso se confirma igual.

#### `R-21` · Vigencia e invalidación de una zona

Una zona deja de tener efecto cuando ha sido superada en las dos direcciones.

**Cómo se aplica**

- **Dos estados, sin grises.** **Activa** = cuenta para la operativa. **Inactiva** = superada en las dos direcciones.
- **Superada en una dirección** = rompimiento **y** consecución en ese sentido. Solo rompimiento, sin consecución → la zona sigue vigente.
- **Una zona inválida no cuenta para nada como zona:** ni bloquea el objetivo, ni sirve para entrar, ni cuenta para medir el 50 % entre zonas. Se retira del cálculo de los filtros.
- **Pero sigue ocupando su sitio:** la banda que ya gastó su zona no se reabre porque la zona muera (`R-17`, punto 8). **Deja de valer como zona; no deja de ocupar el sitio.**
- **Se conserva dibujada** en tono muy tenue, solo como recuerdo visual.
- **Las zonas no envejecen** (`D-07`): una zona es activa o inactiva, sin grados.

#### `R-22` · La vela que confirma un traspaso no abre el rompimiento contrario

La vela que da la consecución de un traspaso **no cuenta a la vez** como rompimiento del lado contrario. El rompimiento contrario se busca **a partir de la vela siguiente**.

**Cómo se aplica**

- Tras la vela de consecución de un traspaso, el rompimiento del lado contrario se busca **desde la vela siguiente**, aunque la mecha de la propia vela de consecución toque el otro borde.

---

## Setup y entrada  (7)

#### `R-23` · Selección de setup

Toma el primer setup válido cuya orden se llene.

**Cómo se aplica**

- **Orden cronológico:** el primer setup que cumpla todas las condiciones necesarias se opera.
- **Prohibido** compararlo con setups posteriores o esperar uno mejor.
- Una vez llenada la orden, se ignora el resto de la sesión.

**⚠️ Excepciones**

- Un setup válido cuya orden caduque sin llenarse (`R-29`) no consume el cupo ni bloquea los siguientes.

#### `R-24` · Tipo de orden y momento de colocación

Entra siempre con orden stop en reposo colocada al cierre de la vela de rompimiento.

**Cómo se aplica**

- **Largo → Buy Stop Market** por encima del precio: máximo de la **vela de rompimiento** + 1 `TICK`.
- **Corto → Sell Stop Market** por debajo: mínimo de la vela de rompimiento − 1 `TICK`.
- **El nivel se lee en el gráfico de MNQ** y la orden va **al cierre de la vela de rompimiento**, en el Chart Trader de ese gráfico, tipo `Stop Market`.
- **Colocar y esperar. No se persigue el precio a mano.** Orden a mercado y orden límite: prohibidas.

#### `R-25` · Setup Continuación

Un IRI —corrida, retroceso, zona y rompimiento de esa zona— y su consecución. La consecución es la entrada.

**Cómo se aplica**

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

**⚠️ Excepciones**

- Si se agota el `PLAZO_CONSECUCION` sin consecución, la **entrada** queda invalidada. El destino de la **zona** lo deciden `R-10` y `R-11`.

#### `R-26` · Setup Reingreso

Tras un rompimiento con consecución que falla, el precio recupera la zona entera y se opera en sentido contrario.

**Cómo se aplica**

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

#### `R-27` · La vela de apertura no sesga la jornada

La dirección de la vela de las 08:31 marca por dónde empieza el día, pero **no obliga a operar en ese sentido durante toda la sesión**.

**Cómo se aplica**

- **Se buscan entradas de continuación en los dos sentidos.** Cada tramo, suba o baje, deja su zona al terminar, y esa zona sirve para entrar **a favor de ese tramo**: una zona nacida al final de una subida se opera larga cuando se rompe hacia arriba; una nacida al final de una bajada, corta cuando se rompe hacia abajo.

#### `R-40` · Corrida fluida

**Solo se entra en el rompimiento de la zona de una corrida FLUIDA.** Una corrida es fluida cuando la secuencia sale bien **tres veces seguidas**: la corrida deja su zona · el retroceso no se pasa · y la corrida siguiente rompe esa zona.

**Cómo se aplica**

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

#### `R-41` · Punto de referencia

**El objetivo de un reingreso no puede pasar del nivel de referencia de un retroceso anterior que siga vivo.** Solo aplica al reingreso.

**Cómo se aplica**

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

---

## Riesgo, orden y gestión  (7)

#### `R-28` · Máximo de operaciones por sesión

Ejecuta como máximo una operación por sesión.

**Cómo se aplica**

- **Órdenes llenadas por sesión ≤ `OPS_POR_SESION`.** El cupo se consume al llenarse la orden, acabe en objetivo o en stop.
- **Una orden colocada y no llenada NO consume el cupo.**
- Tras la primera orden llenada, **no se coloca ninguna orden más** esa sesión, aunque aparezcan setups válidos.

#### `R-29` · Caducidad de la orden pendiente

Mantén la orden pendiente hasta que se llene, hasta que se agote el plazo de consecución, hasta que el precio vuelva al punto del stop, o hasta el fin de la ventana.

**Cómo se aplica**

- **Se cancela al ocurrir lo PRIMERO de estas tres causas:**
  1. **Pasa el `PLAZO_CONSECUCION` desde el rompimiento sin que llegue la consecución** — es decir, sin que el precio alcance el nivel de la orden.
  2. **El precio vuelve al punto del stop**, tal como lo define `R-32`: el extremo alcanzado **desde que nació la zona** hasta la vela de rompimiento — no solo el extremo del retroceso que la originó.
  3. Es la hora de `CANCELACION_FINAL`.
- **NO cancela:** ⚠️ **la aparición de un retroceso nuevo.** Un retroceso nuevo deja la orden intacta.
- **🔑 La caducidad se comprueba ANTES del llenado.** Pasado el plazo la orden ya no existe y no puede llenarse, aunque el precio toque el nivel en esa misma vela.
- **🕯️ Cuando una misma vela toca el nivel de la orden y el stop,** se aplica el orden de la vela —el mismo de `R-19`, punto 6—: **vela azul, primero el mínimo; vela blanca, primero el máximo**. **Si llega antes al nivel de la orden, se llena**, y el stop puede saltar en esa misma vela. **Si llega antes al stop, la orden se cancela** sin llenarse.
- **Al cancelar:** se descarta el setup. **El cupo de `R-28` no se consume**: se puede esperar un setup nuevo dentro de la ventana de `R-02`.

#### `R-30` · Fin de ventana con posición abierta

Una operación abierta se gestiona hasta stop o target, aunque termine la ventana operativa.

**Cómo se aplica**

- **El fin de la `VENTANA_OPERATIVA` prohíbe abrir; no obliga a cerrar.** No existe cierre por tiempo.
- **Ninguna acción por hora:** solo el stop o el objetivo cierran la posición.

#### `R-31` · Configuración de ejecución (ATM `K1`)

Ejecuta con la ATM `K1` al valor de `ATM_DEFECTO` y ajusta stop y target a mano tras el llenado, en ese orden.

**Cómo se aplica**

- **La ATM:** **`K1`** · `CONTRATOS` · Auto Breakeven **OFF** · Auto Trail **OFF** · stop y objetivo provisionales en `ATM_DEFECTO`.
- **Filtro antes de enviar:** el stop estructural debe ser **≤ `STOP_MAX`**. La distancia se mide entre la **entrada** y el stop estructural de `R-32`: en la Continuación, el extremo alcanzado **desde que nació la zona** hasta la vela de rompimiento; en el Reingreso, el extremo de la **corrida fallida**. Si lo supera **aunque sea por 1 tick, no se opera**.
- **Tras el llenado:** 1º el stop a su referencia estructural · 2º el objetivo a 1:1 (`R-32`).
- **Una vez ajustados, stop y objetivo no se vuelven a mover** (`R-33`).

| | Qué es | Cuándo actúa |
|---|---|---|
| **`ATM_DEFECTO`** | stop provisional hasta el ajuste manual | **después** del llenado |
| **`STOP_MAX`** | filtro de entrada | **antes** de enviar |

#### `R-32` · Stop y target

Ancla la regla en el nivel de entrada, mide el stop hasta su referencia estructural y pon el target a esa misma distancia.

**Cómo se aplica**

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

#### `R-33` · No se gestiona

Una vez ajustados stop y target, **no se gestiona la posición. Nunca.**

**Cómo se aplica**

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

#### `R-34` · Al llenarse la orden termina el análisis del día

Al llenarse la orden termina el **análisis** del día, no solo la operativa.

**Cómo se aplica**

- **Al llenarse:** se ajustan stop y objetivo (`R-31`) y se cierra el análisis. Solo queda esperar el resultado.
- **Prohibido después del llenado:** marcar zonas nuevas y buscar setups.
- **Al cerrar la operación:** bitácora, observaciones, pantallazo, y **cerrar NinjaTrader**.

---

## Filtros de no-operar  (3)

#### `R-35` · Noticia roja

No operes en la ventana de `VENTANA_NOTICIA` alrededor de una noticia roja de Forex Factory.

**Cómo se aplica**

- **Fuente única: Forex Factory.** Investing y los «3 toros» no se usan.
- **Solo el impacto ROJO.** Naranja y amarillo no bloquean. El nivel lo da el icono de Forex Factory, no un criterio propio.
- **La ventana:** `VENTANA_NOTICIA` alrededor de la hora publicada — de T−5 a T+5, ambos inclusive: 11 minutos.
- **Dentro de la ventana no se coloca ninguna orden.** Si ya hay una pendiente sin llenar, **se cancela al entrar T−5**, y no consume el cupo de `R-28` (`R-29`).
- **Pasado T+5**, si el setup sigue vivo, se vuelve a colocar la orden.

#### `R-36` · Día de FOMC

En día de FOMC **no se opera Continuación. Solo se permite Reingreso.**

**Cómo se aplica**

| | |
|---|---|
| **Qué es un día de FOMC** | cualquier día en que **Forex Factory** marque en **rojo** un evento de la Fed — decisión de tipos, actas o discursos de Powell |
| **Fuente** | Forex Factory, **la misma única fuente de `R-35`** |
| **Alcance** | el **día entero**, no solo la hora del anuncio |
| **Continuación** (`R-25`) | ❌ **prohibida** |
| **Reingreso** (`R-26`) | ✅ **permitido**, con todas sus condiciones normales |

- Ese día solo se busca Reingreso. **Una Continuación válida se deja pasar aunque cumpla todo.**

#### `R-37` · Estado del operador

**No se opera estando enfermo o sin encontrarse bien mentalmente.**

**Cómo se aplica**

- **Criterio libre:** juicio del operador, sin condición medible. Decisión consciente del operador (24/08/2026).
- Si no está bien, **no se abre operativa ese día**. Se contesta antes de abrir la plataforma (`R-38`, bloque A).

---

## Proceso diario  (1)

#### `R-38` · Checklist diaria y registro

Ejecuta la sesión siguiendo la checklist diaria **en orden**, y registra **todas** las sesiones, incluidas aquellas en que no se operó.

**Cómo se aplica**

- **Se sigue `CHECKLIST_DIARIA.md` de arriba abajo, sin alterar el orden de sus bloques:**

| Bloque | Cuándo | Contiene |
|---|---|---|
| **A** | **antes de abrir NinjaTrader** | `R-37` estado · `R-36` FOMC · `R-35` noticias |
| **B** | premercado, desde `PREMERCADO_INICIO` | `R-03` · `R-15` · `R-09` · `R-12` · `R-13` |
| **C** | ventana operativa | `R-23` · `R-25`/`R-26` · `R-32` filtros · `R-24` envío · `R-29` cancelación |
| **D** | tras el llenado | `R-31` ajuste · `R-33` no tocar · `R-28` cupo |

- **El bloque A se contesta antes de abrir la plataforma.** Con el gráfico delante, `R-37` ya no es la misma pregunta.
- **Registro automático** (indicador de NinjaTrader): entrada · salida · niveles · hora · resultado.
- **Registro manual:** setup · imagen · errores · observaciones · **y el motivo los días en que no se operó**.
- **Se registran TODOS los días, se opere o no.** El journal se rellena al cierre de la sesión.

---

## Parámetros (copiados de `PARAMETROS.md`)

```
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
```
