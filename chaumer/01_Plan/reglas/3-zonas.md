# 3 · Zonas

> todo lo que tiene que ver con una zona

> 🔑 **Regla única de marcado.** Una zona es siempre la mecha de una vela: desde el borde del cuerpo hasta el extremo de la mecha. Lo único que cambia es **qué vela se designa** y **qué mecha**.

#### Cómo se marca una jornada — la secuencia, de principio a fin

No es una regla nueva: es la **secuencia** que forman `R-16`, `R-12`, `R-17` y `R-18` cuando se leen juntas y en orden. Estaban las cuatro escritas por separado, y en ningún sitio estaba dicho el recorrido completo; el operador lo dictó el 08/09/2026.

**1 · La jornada abre con dos zonas, y ésas son la banda.**
La primera corrida deja su zona. El retroceso que la mata deja la otra. Entre las dos queda **la banda del día**.

**2 · Dentro de esa banda se marca UNA zona como máximo, en toda la jornada.**
La del **primer retroceso** que aparezca dentro, y **solo si su movimiento no cruza la mitad** de la banda *(`R-12`)*. Si la cruza, **no se marca ninguna** — y la banda queda cerrada igual, para el resto del día *(`R-17`)*.

**3 · Después de eso, dentro de esa banda no se dibuja NADA más.**
Ni aunque aparezcan corridas nuevas, ni aunque sus zonas candidatas toquen a las de los bordes. **Una zona viva ocupa su franja de precio**, y mientras esté ahí no nace nada por debajo ni por encima de ella dentro de la banda.

**4 · La ÚNICA forma de que aparezca una zona nueva es superar un extremo.**
Que el precio **traspase** la resistencia de arriba o el soporte de abajo — **rompimiento + consecución**, no basta con asomarse *(`R-18`)*. Ahí se abre terreno nuevo.

**5 · Y ese traspaso forma una banda nueva, con su propio turno.**
La zona nueva de fuera y la que se acaba de superar forman **otra banda**, y esa banda **estrena su propia regla de una-sola-zona**, también para el resto del día.

> 🔴 **Lo que esto NO es.** Esto no habla del **estiramiento** ni de la **zona apéndice**. Esos dos son otra cosa: nacen de un **rompimiento sin consecución** cuando el plazo se resuelve — con mecha la zona se estira *(`R-10`)*, con cuerpo nace la apéndice *(`R-11`)*. No se confundan con el marcado de una corrida nueva.

> 💡 **Por qué el gráfico no se llena de rectángulos.** No es por un tope de zonas ni por un criterio de limpieza: es porque **el precio tiene que ganarse el terreno**. Mientras siga dentro de la misma banda, el marcado está cerrado.

## R-09 · Marcar una zona

> Marca la zona sobre la vela designada, desde el borde de su cuerpo hasta el extremo de su mecha, y extiéndela hacia la derecha.

| | |
|---|---|
| Aplica a | Continuación · Reingreso |
| Parámetros | — |
| Relacionadas | R-06 · R-12 · R-16 · R-19 · R-21 |
| Casos | G-01 · G-02 · G-03 · G-11 · G-12 |
| Apartado | Marcado |

### Cómo se aplica

- **La vela designada:** la de **máximo más alto** (corrida alcista) o **mínimo más bajo** (corrida bajista), contando desde el origen de la corrida **hasta la vela que dispara el retroceso, ambas incluidas**.
- **Cuándo:** al aparecer el retroceso (`R-06`), no antes.
- **Los límites:** del borde del cuerpo al extremo de la mecha. En una resistencia, el límite inferior es el borde superior del cuerpo —el cierre si la vela es verde, la apertura si es roja— y el superior, el máximo de la vela.
- **Vela sin mecha:** la zona es una línea en el extremo de la vela.
- **Vela sin cuerpo** (apertura = cierre): el cuerpo mide cero; la zona va de ese precio a la punta de la mecha.
- **El retroceso también marca zona:** el retroceso de una corrida alcista marca **soporte**, y el de una corrida bajista, **resistencia**. Sujeto a `R-12`: si el movimiento cruza el 50 % entre las zonas vecinas, no se marca.
- **Se extiende hacia la derecha** a lo largo del gráfico.

### Por qué

La búsqueda de la vela extrema **incluye la vela que dispara el retroceso**: una vela puede hacer máximo mayor y mínimo menor a la vez —dispara el retroceso— y aun así ser la más alta del movimiento. Caso real: 10/07/2026, vela 8:36.

La definición de *zona* está en `GLOSARIO.md`.

Diagramas: `../02_Assets/diagramas/R-09_zona.png` · `R-20_vigencia.png` · `R-10_extension_apendice.png`

## R-10 · Estirar la zona · rompimiento con mecha sin consecución

> El precio rompe una zona **con mecha** —el cierre se queda dentro— y la consecución no llega. La zona se extiende hasta la punta de esa mecha: si es una **resistencia** se estira solo por arriba; si es un **soporte**, solo por abajo.

| | |
|---|---|
| Aplica a | Continuación · Reingreso |
| Parámetros | `PLAZO_CONSECUCION` |
| Relacionadas | R-11 · R-14 · R-19 · R-21 |
| Casos | — |
| Apartado | Marcado |

### Cómo se aplica

El rompimiento con mecha sin consecución se acaba de dos maneras, y vale **la que llegue primero** — el disparador es el plazo **resuelto**, no el plazo vencido:

**Una ·** pasa el `PLAZO_CONSECUCION`, contado desde la vela siguiente a la del rompimiento, y la consecución no ha llegado.

**Otra ·** antes de que se cumpla ese plazo, el mercado arma una **estructura completa en sentido contrario**: una vela que no da la consecución y se va en contra, otra que hace retroceso, y una tercera que no sigue ese retroceso y vuelve en el sentido de la primera. **La zona se estira en esa tercera vela**, sin esperar más (`R-14`).

En cualquiera de los dos casos, la zona se extiende hasta la punta de la mecha que la rompió. **Qué borde se mueve lo decide el tipo de zona, no el lado del rompimiento:** una resistencia se estira solo por arriba; un soporte, solo por abajo. El otro borde no se mueve. Sigue habiendo **una sola zona**, más grande, y conserva su historial de rompimientos y consecuciones. No se crea ninguna zona nueva.

> 🔴 **Un soporte nunca se estira hacia arriba, ni una resistencia hacia abajo.** Si el precio cruza la zona por el lado contrario —el cruce de vuelta, cuando ya la traspasó una vez—, **no hay nada que estirar**: ese cruce no la toca, solo la mata cuando llegue su consecución (`R-21`).

### Por qué

**Caso de origen, 14/09/2026.** El soporte de la vela de 9:10 (29.062,00 – 29.064,75) queda traspasado hacia abajo a las 9:18. A las 10:07 el precio vuelve y lo cruza hacia arriba sin consecución. Estirarlo por el lado del rompimiento lo llevaba hasta 29.079,75 — dentro de la resistencia viva de 9:09 (29.071,00 – 29.088,50) —, y las dos zonas quedaban **pisándose** entre 29.071,00 y 29.079,75, contra la prohibición de solapar zonas de tipo distinto. Por eso el borde lo decide el tipo de zona.

El texto de esta regla lo redactó el operador.

Diagramas: `../04_Web/public/conceptos/05-sin-confirmar.png` (un soporte que crece hacia abajo) · `../04_Web/public/conceptos/24-estructura-antes.png` (una resistencia que crece hacia arriba)

## R-11 · Zona apéndice · rompimiento con cuerpo sin consecución

> El precio rompe una zona **con cuerpo** —el cierre queda fuera— y la consecución no llega. La zona original no se toca y nace una **segunda zona** sobre la mecha de la vela de rompimiento: un borde es el borde del cuerpo de esa vela, el otro es la punta de su mecha.

| | |
|---|---|
| Aplica a | Continuación · Reingreso |
| Parámetros | `PLAZO_CONSECUCION` |
| Relacionadas | R-10 · R-14 · R-19 |
| Casos | G-15 |
| Apartado | Marcado |
| Pendiente | dos reglas de entrada asociadas, anotadas desde F1.3 y nunca confirmadas: «la zona apéndice alta solo sirve para largo» y «no se puede entrar entre zonas apéndices». Hoy el motor no las aplica |

### Cómo se aplica

El rompimiento con cuerpo sin consecución se acaba de dos maneras, y vale **la que llegue primero** — el disparador es el plazo **resuelto**, no el plazo vencido (`R-14`):

**Una ·** pasa el `PLAZO_CONSECUCION`, contado desde la vela siguiente a la del rompimiento, y la consecución no ha llegado.

**Otra ·** antes de que se cumpla ese plazo, el mercado arma una **estructura completa en sentido contrario**: una vela que no da la consecución y se va en contra, otra que hace retroceso, y una tercera que no sigue ese retroceso y vuelve en el sentido de la primera. **La apéndice nace en esa tercera vela**, sin esperar más.

En cualquiera de los dos casos **la zona original no se toca** y nace una **segunda zona** sobre la mecha de la vela de rompimiento: un borde es el **borde del cuerpo** de esa vela, el otro es la **punta de su mecha**. Quedan **dos zonas**, la original y su apéndice.

La apéndice se dibuja **desde la vela de rompimiento**, su vela origen, aunque no quede marcada hasta ese momento. Es del **mismo gris** que cualquier otra zona (`R-19`, precisión 3).

### Por qué

> 🔑 **La apéndice no nace por acción del precio sobre ella** — es el rastro de un rompimiento que se quedó sin terminar.

**Es la misma regla que `R-10`, con un solo cambio.** Las dos arrancan igual —rompimiento sin consecución— y las dos se acaban con los mismos dos finales. Lo único que las separa es **dónde cierra la vela de rompimiento**: si el cierre se queda dentro, la zona **se estira** y sigue siendo una; si el cierre queda fuera, la original queda intacta y **nace la apéndice**. Por eso el texto es calcado. **Palabras del operador:** *"la zona apéndice es básicamente igual que lo que pasa con una zona que se estira cuando hay rompimiento sin consecución. La diferencia es que en este caso el rompimiento no es con mecha, sino con cuerpo por fuera. Los casos son los mismos 2"*.

Diagramas: `../02_Assets/diagramas/apendice_caso1_plazo.png` *(por plazo)* y `../02_Assets/diagramas/apendice_caso2_estructura.png` *(por estructura contraria)*

## R-12 · Zonas entre zonas — la regla del 50 %

> Marca una zona entre dos zonas solo si el movimiento que la genera queda entero dentro de la mitad en la que empezó.

| | |
|---|---|
| Aplica a | Continuación · Reingreso |
| Parámetros | `UMBRAL_50` |
| Relacionadas | R-13 · R-16 · R-17 · R-18 |
| Casos | G-11 · G-12 |
| Apartado | Marcado |

### Cómo se aplica

- **Cuándo aplica:** hay una zona por arriba y otra por abajo.
- **La referencia del 50 %** (`UMBRAL_50`): el punto medio entre el borde interno de la zona superior y el borde interno de la inferior, **recalculado** contra la zona más cercana por arriba y la más cercana por abajo en ese momento.
- **Se mide el recorrido del precio —el movimiento—, NO el rectángulo de la zona.** Si el movimiento cruza el 50 % en algún punto, no se marca zona, aunque el rectángulo quede entero a un lado.
- **Quedar exactamente EN el 50 % sí marca;** hace falta superarlo por **≥1 tick** para anularla.
- **Una sola zona por banda y por jornada, y es la del primer retroceso** (`R-17`, Alfredo, 27/08/2026).
- Es una **prohibición con excepción rara** — el operador: *"pasa poco, pero sí pasa"*.

### Por qué

Contraejemplo real, anotado por el operador: `../02_Assets/invalidos/R-12_invalido_01.png`.

Desviación consciente `D-06`: el curso cierra el marcado tras la primera zona; el operador no pone límite de cantidad de zonas intermedias — el límite lo pone la banda (`R-17`).

## R-13 · Superposición de zonas — se estira, no se duplica

> Si la zona que ibas a marcar toca una existente, no marques una nueva: estira la existente.

| | |
|---|---|
| Aplica a | Continuación · Reingreso |
| Parámetros | — |
| Relacionadas | R-10 · R-19 · R-21 |
| Casos | G-13 |
| Apartado | Marcado |

### Cómo se aplica

- **El disparador:** la zona candidata toca en cualquier punto una zona ya marcada **del mismo tipo**; el contacto de bordes cuenta.
- **Crear una zona nueva está prohibido:** se estira la existente hasta el extremo más lejano de la candidata. Queda **una** zona.
- **Se estira SOLO hacia el nuevo extremo;** el otro borde no se mueve. No se engloba.
- **La zona estirada conserva su historial** de rompimientos y consecuciones (`R-21`).
- **Candidata dentro de la existente:** sin cambios; no hay nada que extender.
- **No se solapan zonas de tipo distinto** mientras una esté vigente: una zona viva ocupa su franja de precio.

### Por qué

Desviación consciente `D-08`: el curso recorta la zona nueva y deja dos zonas; el operador las une en una sola.

## R-14 · El plazo de consecución es un tope, no una espera

> El plazo de consecución (`PLAZO_CONSECUCION`) es un **tope, no una espera obligatoria**: si antes de que se cumpla el mercado **arma una estructura completa en sentido contrario al rompimiento**, la geometría se resuelve **en ese momento**, sin esperar a que se agote el plazo.

| | |
|---|---|
| Aplica a | Continuación · Reingreso |
| Parámetros | `PLAZO_CONSECUCION` |
| Relacionadas | R-10 · R-11 · R-12 · R-13 · R-19 |
| Casos | — |
| Apartado | Marcado |
| Fuente | operador |
| Pendiente | `P-31`: el motor de auditoría todavía resuelve el plazo solo por vencimiento y no detecta la estructura contraria, en los dos caminos |

### Cómo se aplica

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

### Excepciones

- Si el precio simplemente se va en sentido contrario **sin hacer retroceso en el medio**, no hay estructura: se espera al plazo. **Caso real 20/07/2026 — el contraejemplo que la delimita:** la vela 8:40 rompe el soporte de la 8:37 con cuerpo. Después el precio sube **cuatro velas seguidas** (8:42, 8:43, 8:44, 8:45) **sin hacer retroceso en el medio**, así que nunca llega a armar la estructura contraria. La apéndice nace por plazo vencido, en la **8:45**. Subir no basta: hace falta la estructura completa.

### Por qué

El plazo existe para decidir cuándo un rompimiento sin consecución deja de estar en el aire. Si el mercado ya armó estructura al otro lado, eso ya está decidido y no hay nada que esperar. **No es un detalle de forma:** cambia **cuándo** nace el borde nuevo, y de ahí cuelga dónde va el stop.

> 🔴 **La condición de la segunda vela es la que hace mecánica la regla.** Sin ella, cualquier vuelta del precio parecería una estructura.

**Estructura** = retroceso nuevo que **sí** genera zona. El único retroceso que no genera zona es el bloqueado por `R-12`.

Diagramas: `../02_Assets/diagramas/apendice_caso1_plazo.png` y `../02_Assets/diagramas/apendice_caso2_estructura.png` *(rompimiento con cuerpo)* · `../04_Web/public/conceptos/24-estructura-antes.png` *(rompimiento con mecha — el caso del estiramiento)*

## R-15 · Zona de premercado — la única que nace del volumen

> En la ventana de premercado (`PREMERCADO_INICIO` del día anterior hasta la apertura americana), marca zona sobre **toda** vela cuyo volumen supere el umbral (`UMBRAL_VOL`). Fuera de esa ventana la regla no aplica.

| | |
|---|---|
| Aplica a | Continuación · Reingreso |
| Parámetros | `PREMERCADO_INICIO` · `UMBRAL_VOL` |
| Relacionadas | R-02 · R-03 · R-09 · R-13 · R-17 · R-21 |
| Casos | G-11 · G-12 |
| Apartado | Marcado |

### Cómo se aplica

- **La ventana de escaneo:** desde `PREMERCADO_INICIO` (19:00 hora Colombia, 09:00 JST, la apertura de Tokio; fija todo el año) hasta la apertura del mercado americano, el inicio de `R-02`: 08:30 Col en verano de EE. UU., 09:30 Col en invierno. Son 13 h 30 en verano (~810 velas) y 14 h 30 en invierno (~870 velas).
- **No confundir con el sombreado gris** del indicador Premercado.1, que empieza a las 15:00 Col del día anterior y llega a las 08:30 Col: es **solo visual** y no define dónde se buscan zonas.
- **El umbral:** `UMBRAL_VOL`, sobre la barra del indicador Volume Up Down (`R-03`). Es un **parámetro ajustable**, no un número fijo del método: lo fija el operador y **no se cambia con la sesión empezada**.
- **Se marcan TODAS las velas que superen el umbral,** sin seleccionar. No solo el extremo del grupo; `R-13` fusiona las que se tocan.
- **El color decide el tipo:** vela alcista → **resistencia** sobre la mecha superior; vela bajista → **soporte** sobre la mecha inferior.
- **Los límites:** del borde del cuerpo al extremo de la mecha, igual que `R-09`.
- **Después se comporta como cualquier zona:** `R-21`, `R-10`, `R-11`, `R-12`, `R-13` y `R-14` aplican sin excepción. También hace de **borde de banda** para `R-17`.

### Excepciones

- **Tras la apertura del mercado americano la regla del volumen se APAGA:** dentro de la sesión solo se marcan zonas por estructura (`R-09`), sin importar el volumen de la vela.

### Por qué

Es la **única forma de que nazca una zona sin corrida ni retroceso**. A diferencia de `R-09`, aquí el **color** de la vela decide si es soporte o resistencia. El corte en la apertura no es arbitrario: ese volumen en un minuto es raro en premercado y corriente en sesión.

**Por qué desde las 19:00 y no antes.** Verificado con datos el 10/07/2026: escaneando desde las 15:00 salen 3 velas sobre el umbral; desde las 19:00 sale 1, la que el operador marcó. Las 2 de más son la subasta de cierre del efectivo del día anterior.

Desviación consciente `D-09`: *Parámetros Chaumer* dice *"solo marcamos los extremos"*; el operador marca todas, y `R-13` fusiona las que se tocan.

> 🔵 **El umbral es un parámetro, no un número del método.** Decisión del operador, con sus palabras: *"vamos a dejar en reglas que el umbral del volumen del premercado va a ser paramétrico, porque eso depende de la volatilidad del momento"*. El valor vive en `PARAMETROS.md` y la regla cita el nombre, no la cifra.
>
> 🔴 **No es un ajuste fino, es un interruptor:** en la primera jornada del test ciego (10/09/2026), dos umbrales distintos dan dos días distintos. Por eso lo fija el operador sin criterio medible, a propósito (`P-37`), y **nunca con la sesión empezada**: sin esa línea, el umbral se podría mover *después* de ver el día, y eso convertiría el backtesting en ajuste a posteriori.
>
> ⚠️ La equivalencia entre el umbral de MNQ y el antiguo de NQ **no está verificada** con datos, y las 11 sesiones validadas se marcaron con el umbral de NQ sobre datos de NQ — ver `P-32`.

## R-16 · Cuándo se dibuja cada zona

> Las dos zonas que genera una estructura **no se dibujan en el mismo momento**. La zona de la corrida se marca al aparecer el retroceso. La zona del retroceso solo se dibuja cuando el retroceso queda **confirmado**; hasta entonces se marca una **línea provisional** de nivel.

| | |
|---|---|
| Aplica a | Continuación · Reingreso |
| Parámetros | — |
| Relacionadas | R-09 · R-12 · R-14 · R-29 |
| Casos | G-12 |
| Apartado | Marcado |

### Cómo se aplica

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

### Por qué

**Caso real, 6 de julio de 2026:** línea provisional en 29.882,75 (8:36), baja a 29.786,00 (8:37), y en la 8:40 se confirma y se dibuja el soporte **29.786,00 – 29.827,50**.

**Caso real, 10 de julio de 2026:** al confirmarse, el movimiento había cruzado el 50 % — la línea no llegó a ser zona y se borró.

## R-17 · Una sola zona entre zonas, por banda y por jornada

> Dentro de una banda entre dos zonas se marca **como máximo una** zona en toda la jornada, y el turno es **del primer retroceso** que aparezca dentro.

| | |
|---|---|
| Aplica a | Continuación · Reingreso |
| Parámetros | `UMBRAL_50` |
| Relacionadas | R-12 · R-15 · R-16 · R-18 · R-21 |
| Casos | G-13 · G-17 |
| Apartado | Marcado |
| Fuente | Alfredo Chaumer, vía el operador (27/08/2026). El punto 7 lo confirma el operador el 01/09/2026 sobre el 14/07/2026 |

### Cómo se aplica

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

### Por qué

**Caso real 8/07/2026:** banda entre el techo del soporte de la vela 8:36 (29.303,50) y el piso de la resistencia de la vela 8:42 (29.374,25); mitad en 29.338,88. El primer retroceso dentro es el de la vela 8:43, que baja a 29.329,75 → no cumple → no se marca y la banda se cierra. Más tarde, el retroceso de la vela 9:09 **sí** cumpliría el 50 %, pero **ya no se marca**: la banda se gastó a las 8:45.

**Caso real 14/07/2026 — la banda con borde de premercado:** el soporte de la vela 8:36 (29.685,00–29.693,00) por abajo y la resistencia de premercado de la vela de las 19:31 (29.901,25–29.908,25) por arriba forman una banda de 208,25 puntos con mitad en **29.797,13**. El primer retroceso dentro es el de la vela **8:39**, que sube a **29.798,00** — se pasa de la mitad por **0,875 puntos (3½ ticks)** → no se marca y la banda queda cerrada. Entre las 8:41 y las 9:10 no se marca **nada**. El operador confirma el marcado idéntico.

**Caso real 18/09/2026 — el punto 8, y por qué hizo falta escribirlo.** La zona de premercado (29.796,75 – 29.808,75) queda **inválida a las 8:50**. A las 8:54 el auditor marcó una resistencia de 29.804,75 – 29.805,75 justo encima de ella, dentro de la banda que va del soporte de la vela 8:52 (techo 29.791,75) al piso de la apéndice (29.840,75). **El punto 5 ya lo prohibía**, pero el motor no lo veía: contaba el turno solo con las zonas **activas** y solo cuando evaluaba una candidata con vecinas vivas a los dos lados. Palabras del operador: *"una zona inválida ya no cuenta como zona, pero acuérdate de la regla de zonas entre zonas… igual cuando esas zonas ya son inválidas, no se marcan más zonas entre ese espacio"*. Y sobre el alcance, preguntado con el gráfico delante: **se cierra la banda entera**, no solo el rectángulo de la zona muerta.

## R-18 · Salir de una zona es rompimiento + consecución

> Salir de una zona o de una banda es rompimiento más consecución, no geometría.

| | |
|---|---|
| Aplica a | Continuación · Reingreso |
| Parámetros | — |
| Relacionadas | R-12 · R-16 · R-17 · R-20 |
| Casos | G-13 · G-15 |
| Apartado | Marcado |
| Fuente | operador, casos 8/07 y 7/07 |

### Cómo se aplica

- **No se marca ninguna zona al otro lado de una zona viva cuyo rompimiento esté todavía esperando su consecución.**
- **Decide el extremo del movimiento, no el rectángulo** de la zona candidata: si el extremo pasa el borde de esa zona, no se marca — aunque el rectángulo de la zona nueva se solape con el de la vieja.

### Por qué

El mercado no está «fuera» de una zona ni de una banda por geometría, sino cuando ha **roto** la zona del borde **y ha conseguido la consecución**. **Palabras del operador (27/08/2026):** *"Salir fuera de la banda es que el mercado haga rompimiento + consecución. Ahí está fuera de la banda, fuera de la zona."*

**Casos reales 8/07/2026:**
- La vela **9:13** no marca nada: solo rompe el soporte de la vela 8:39, y la consecución llega en la **9:16**. El soporte nace entonces sobre la vela 9:16, en 29.235,25–29.252,50.
- La vela **9:44** no marca nada: rompe el soporte de la vela 9:16 y la consecución llega en la **9:47**.

**Caso real 7/07/2026:** la vela **8:52** rompe la zona apéndice de la vela 8:39 y la **8:54** hace la consecución dentro del plazo — rompimiento exitoso, así que en la 8:53 **no se marca soporte** pese a que hubo retroceso.

## R-19 · Cómo se dibuja una zona — seis precisiones

> Seis detalles de dibujo que el operador corrigió al auditor sobre casos reales del 8 de julio.

| | |
|---|---|
| Aplica a | Continuación · Reingreso |
| Parámetros | — |
| Relacionadas | R-08 · R-09 · R-13 · R-16 · R-20 · R-21 |
| Casos | G-13 |
| Apartado | Marcado |
| Fuente | operador, casos 8/07 y 10/07 |

### Cómo se aplica

| # | Precisión | Caso que la fija |
|---|---|---|
| 1 | **El rompimiento se lee por la MECHA, no por el cierre.** Basta pasar 1 tick del borde | 8/07 vela 8:37: cierra dentro de la zona, pero su mínimo baja de 29.277,50 → rompe |
| 2 | Una zona **no queda invalidada por el rompimiento solo**: hace falta la vela de consecución | ver `R-20` |
| 3 | El **rectángulo se dibuja desde la vela origen**, no desde la vela que confirma | 8/07: la resistencia de la vela 8:33 arranca en la 8:33, no en la 8:36 |
| 4 | Se estira **solo hacia el nuevo extremo**; el otro borde no se mueve | ver `R-13` |
| 5 | **No se solapan zonas de tipo distinto** mientras una esté vigente. Una resistencia superada **cambia de papel a soporte** y sigue ocupando su franja | 8/07 vela 8:43: no se puede dibujar soporte donde ya vive la zona de la 8:37 |
| 6 | Cuando una vela hace máximo mayor **y** mínimo menor, **el orden de lo que hace por dentro decide** qué vela sostiene la zona | 8/07 vela 8:36 (primero baja) vs 10/07 vela 8:36 (primero sube) |

## R-20 · Rompimiento y consecución

> Rompimiento es superar el borde de la zona por al menos un tick; consecución es superar por un tick el extremo de la vela de rompimiento. La consecución que **traspasa** una zona no tiene plazo.

| | |
|---|---|
| Aplica a | Continuación · Reingreso |
| Parámetros | `TICK` · `PLAZO_CONSECUCION` |
| Relacionadas | R-10 · R-11 · R-14 · R-21 · R-24 · R-29 |
| Casos | G-01 · G-02 · G-03 · G-04 · G-05 · G-06 · G-11 · G-12 · G-13 · G-16 |
| Apartado | Vigencia |

### Cómo se aplica

- **Rompimiento:** un `TICK` más allá del borde de la zona. El cierre de la vela de rompimiento es irrelevante para que haya rompimiento — **la mecha basta**.
- **Con cuerpo o con mecha:** el rompimiento es **con cuerpo** si el cierre queda más allá del borde traspasado; **con mecha**, si no.
- **Consecución al alza:** máximo de la vela de rompimiento + 1 `TICK`. **A la baja:** mínimo de la vela de rompimiento − 1 `TICK`.
- **El traspaso de la zona NO tiene plazo:** el rompimiento queda pendiente indefinidamente y la consecución lo confirma cuando llegue, aunque sea muchas velas después.
- **El `PLAZO_CONSECUCION`**, contado desde la vela siguiente a la de rompimiento, gobierna solo **la geometría de la zona** (`R-10`, `R-11`, `R-14`) y **la vida de la orden** (`R-29`), no el traspaso. Las dos cosas ocurren sobre el **mismo** rompimiento: primero nace la apéndice o se estira la zona, y más tarde el traspaso se confirma igual.

### Por qué

**La consecución al alza ES la entrada de `R-24`.** El mismo motor sirve para matar una zona y para entrar al mercado.

Caso real 13/07/2026: la consecución que traspasa la zona llega **25 velas** después del rompimiento.

## R-21 · Vigencia e invalidación de una zona

> Una zona deja de tener efecto cuando ha sido superada en las dos direcciones.

| | |
|---|---|
| Aplica a | Continuación · Reingreso |
| Parámetros | — |
| Relacionadas | R-12 · R-13 · R-17 · R-20 |
| Casos | G-03 · G-04 · G-05 |
| Apartado | Vigencia |

### Cómo se aplica

- **Dos estados, sin grises.** **Activa** = cuenta para la operativa. **Inactiva** = superada en las dos direcciones.
- **Superada en una dirección** = rompimiento **y** consecución en ese sentido. Solo rompimiento, sin consecución → la zona sigue vigente.
- **Una zona inválida no cuenta para nada como zona:** ni bloquea el objetivo, ni sirve para entrar, ni cuenta para medir el 50 % entre zonas. Se retira del cálculo de los filtros.
- **Pero sigue ocupando su sitio:** la banda que ya gastó su zona no se reabre porque la zona muera (`R-17`, punto 8). **Deja de valer como zona; no deja de ocupar el sitio.**
- **Se conserva dibujada** en tono muy tenue, solo como recuerdo visual.
- **Las zonas no envejecen** (`D-07`): una zona es activa o inactiva, sin grados.

## R-22 · La vela que confirma un traspaso no abre el rompimiento contrario

> La vela que da la consecución de un traspaso **no cuenta a la vez** como rompimiento del lado contrario. El rompimiento contrario se busca **a partir de la vela siguiente**.

| | |
|---|---|
| Aplica a | Continuación · Reingreso |
| Parámetros | — |
| Relacionadas | R-20 · R-21 |
| Casos | G-16 |
| Apartado | Vigencia |
| Fuente | operador, caso 13/07/2026 |

### Cómo se aplica

- Tras la vela de consecución de un traspaso, el rompimiento del lado contrario se busca **desde la vela siguiente**, aunque la mecha de la propia vela de consecución toque el otro borde.

### Por qué

Si no, la propia mecha de la vela de consecución —que suele ser grande y tocar los dos lados— dispara el rompimiento contrario, y las fechas de invalidación se adelantan sin motivo.

**Caso real 13/07/2026:** el soporte de la vela 8:43 recibe su consecución bajista en la vela 8:52. Esa misma vela tiene un máximo de 29.573,50, por encima del techo de la zona. Con la regla, el rompimiento alcista se busca desde la 8:53 y aparece en la **8:58**, con consecución en la **8:59** → la zona queda inválida a las 8:59, que es lo que lee el operador.
