# GLOSARIO OPERATIVO

> **Qué significa cada palabra del plan.** Solo definiciones: cómo se aplica cada una está en su regla
> (`reglas/`, citada al final de cada término), y los números, en `PARAMETROS.md`. La historia de cada término
> —cuándo se definió, qué decía antes— está en `HISTORIAL.md`.

---

## Regla del glosario

Ningún término entra a este archivo con adjetivos. *"Fuerte"*, *"claro"*, *"buen retroceso"*, *"cerca de"*, *"limpio"*, *"sano"*, *"fluido"*, *"tímido"*, *"extenso"* se traducen siempre a un criterio medible: ticks, puntos, porcentaje, número de velas, hora exacta, ratio o condición booleana. Si no hay número, el término se marca `PENDIENTE` y pasa a `PENDIENTES.md`.

## Colores de las velas

**El NT8 del operador NO usa la paleta estándar verde/rojo.**

| En sus gráficos | Significa |
|---|---|
| 🔵 **Vela AZUL** | **alcista** (cierre > apertura) |
| ⬜ **Vela BLANCA** | **bajista** (cierre < apertura) |

Todo el plan habla de velas **alcistas** y **bajistas**, nunca de verdes y rojas.

> 📌 El color es **irrelevante** para definir corrida y retroceso — solo cuenta la relación entre máximos y mínimos (`R-05`, `R-06`). El color sí decide en `R-09` (qué borde del cuerpo es el límite) y en `R-15` (soporte o resistencia).

---

# ESTRUCTURA DEL PRECIO

## CORRIDA  *(= impulso)*

**Definición:** secuencia de velas que arranca cuando una vela supera el extremo de la anterior, y termina en la primera vela que retrocede al menos 1 tick contra ella.

| | Alcista | Bajista (espejo exacto) |
|---|---|---|
| **Nace** | `máximo[n] > máximo[n−1]` — la forman la vela `n−1` (**origen**) y la vela `n` | `mínimo[n] < mínimo[n−1]` |
| **Vive mientras** | `mínimo[n] ≥ mínimo[n−1]` — el empate **no corta** | `máximo[n] ≤ máximo[n−1]` |
| **Muere** | `mínimo[n] ≤ mínimo[n−1] − 1 TICK` — esa vela es ya **la primera del retroceso** | `máximo[n] ≥ máximo[n−1] + 1 TICK` |

**Tamaño:** mínimo **2 velas** (origen + la que supera); máximo **ninguno** — la sobreextensión no es un parámetro operativo, es contextualización (`C-01`).

**Lo que NO importa:** el **color** de la vela, y que cada vela haga máximos más altos — una vela que cabe dentro de la anterior **no corta** la corrida.

La corrida **nace mirando máximos** y **muere mirando mínimos**. Son dos criterios distintos y es intencionado.

> **Terminología:** "corrida" e "impulso" son **sinónimos**. El plan usa **solo "corrida"**. La palabra "impulso" queda retirada del vocabulario para no duplicar términos.

**Regla:** `R-05` · **Diagrama:** `../02_Assets/diagramas/R-05_corrida.png`

---

## RETROCESO

**Definición:** secuencia de velas que arranca en la vela que mata la corrida y termina cuando nace la siguiente corrida.

| | Tras corrida alcista *(va hacia abajo)* | Tras corrida bajista *(espejo exacto)* |
|---|---|---|
| **Empieza** | primera vela con `mínimo[n] ≤ mínimo[n−1] − 1 TICK` — la que mata la corrida | `máximo[n] ≥ máximo[n−1] + 1 TICK` |
| **Termina** | primera vela con `máximo[n] > máximo[n−1]` — nace la siguiente corrida | `mínimo[n] < mínimo[n−1]` |
| **Nivel de referencia** | **el mínimo MÁS BAJO** de todas las velas del retroceso | **el máximo MÁS ALTO** de todas las velas del retroceso |

> 🎯 **"El mínimo del retroceso" es el mínimo MÁS BAJO de todas sus velas.** No el de la primera vela, no el de la última.

**Nº de velas:** sin mínimo ni máximo · **irrelevante**. **Tamaño:** sin mínimo; como máximo, `STOP_MAX` (`R-31`). El color es irrelevante: una vela **alcista** dentro de un retroceso bajista **no lo termina**, siempre que no haga un máximo más alto.

**Regla:** `R-06` · el stop no se mide aquí, sino con `R-32` · **Diagrama:** `../02_Assets/diagramas/R-06_retroceso.png`

---

## VELA BASE

La **primera vela de la ventana operativa: la 08:31** hora Colombia.

No se compara con ninguna anterior — la 08:30 es premercado y no sirve como `n−1`. **Declara ella misma la dirección del día con su propio cuerpo:** cierre por encima de su apertura → el día inicia alcista; por debajo → inicia bajista. Y es la vela origen de la primera corrida.

La corrida se mide **desde su extremo**: el mínimo si es alcista, el máximo si es bajista. Y **puede sostener zona** como cualquier otra vela.

**Regla:** `R-07`

---

## VELA QUE HACE MÁXIMO MAYOR Y MÍNIMO MENOR

Cubre el rango completo de la vela anterior. Palabras del operador: *"hace rompimiento tanto arriba como abajo, funcionaría como rompimiento y como retroceso"*.

| Estado | Qué pasa | Quién manda |
|---|---|---|
| **Con corrida viva** | El mínimo menor **mata la corrida**. Es ya la primera vela del retroceso. Sin ambigüedad | `R-05` |
| **Sin corrida viva** | **No declara dirección.** Pasa a ser la nueva vela origen y decide la siguiente. Si esa también la cubre entera, se repite | `R-08` |

> ⚠️ **Nota de vocabulario.** El auditor la había bautizado *"vela envolvente"*. **Ese término NO es del operador ni del método** y queda retirado. Se describe solo por su condición.

**Regla:** `R-08` · ⚠️ **En revisión** — ver `P-24`

---

## VELA QUE NO HACE NADA

La que hace **máximo menor Y mínimo mayor** que la anterior: cabe entera dentro de ella.

> ⚠️ **Nota de vocabulario.** El auditor la llamaba *"vela interior"*. Término retirado. Palabras del operador: *"esa vela que está entre la mitad de la vela anterior **no hace nada**, hay que esperar la siguiente vela para tomar una decisión"*.

| | |
|---|---|
| **No declara dirección** | ni arriba ni abajo |
| **No mueve el nivel vivo** | si la corrida es alcista, el máximo a batir sigue siendo el de la vela alta anterior. Una vela posterior que supere a la "que no hace nada" pero **no** al nivel vivo, **tampoco hace nada por arriba** |
| **PERO no se salta** | la corrida sigue muriendo comparando el mínimo contra la vela **inmediatamente anterior**, sea cual sea. Esto vale también con corrida viva |

**Caso real:** 07/07/2026. La 8:32 no hace nada. La 8:33 supera el máximo de la 8:32 pero no el nivel vivo de la 8:31, así que por arriba no cuenta — y su mínimo **sí** es menor que el de la 8:32, así que **hace retroceso**.

**Reglas:** `R-05`, `R-07`

---

## ESTRUCTURA

Hay una estructura nueva cuando **aparece un retroceso nuevo** (`R-06`) **y ese retroceso genera zona** (`R-09`). Es el disparador de `R-14`: con estructura nueva se marca zona **ya**, sin agotar el `PLAZO_CONSECUCION`.

**El único retroceso que NO genera zona es el de `R-12`**, y no hay ningún otro. No existe filtro adicional oculto.

| Situación del retroceso | ¿Genera zona? | ¿Hay estructura nueva? |
|---|---|---|
| Con **espacio libre** | ✅ sí | ✅ sí |
| **Entre** una zona de soporte y una de resistencia, **cruzando el 50 %** | ❌ no (`R-12`) | ❌ **no** |

> 🔗 **Consecuencia encadenada en `R-14`.** Si el retroceso nuevo cae en el caso bloqueado por `R-12`, **no hay estructura nueva**: `R-14` no dispara, el reloj del `PLAZO_CONSECUCION` **sigue corriendo**, y el desenlace vuelve a `R-10` (rompió con mecha) o `R-11` (rompió con cuerpo). Es el único punto del plan donde `R-12` decide indirectamente sobre el reloj de `R-20`.

**Regla:** `R-14`

---

## IRI  *(Impulso–Retroceso–Impulso)*

**La estructura, no el setup.** Una corrida deja su zona, el precio retrocede, y la corrida siguiente rompe esa zona. No se opera por sí sola: es lo que tiene que pasar para que exista una **Continuación**, que es este IRI más su consecución. Para que sea operable tiene que ser **fluido** (`R-40`).

**Reglas:** `R-25`, `R-40`

---

## CORRIDA FLUIDA

Una corrida es fluida cuando la secuencia sale bien **tres veces seguidas**: la **corrida** deja su zona al terminar · el **retroceso no se pasa** (mide menos que su corrida; el empate cuenta como que no se pasa) · la **corrida siguiente rompe** esa zona. **Solo se entra en el rompimiento de la zona de una corrida fluida.** Es la traducción medible de *"no es fluida"* y *"el mercado está lateral"*.

> ⚠️ **No confundir con el tamaño.** Una corrida no es fluida por ser grande: se mide contra su retroceso.

**Regla:** `R-40` · solo afecta a continuaciones

---

## ROMPIMIENTO DIRECTO

El rompimiento de una zona **mientras el sentido del día está bloqueado** porque se perdió la fluidez. Por parámetros cumple —pasa el tick, llega la consecución—, pero el mercado está lateral y **por contexto pierde probabilidad**. **No se opera nunca:** es solo el primer paso para que vuelvan las entradas.

**Regla:** `R-40`

---

# ZONAS

## ZONA  *(zona gris)*

> 🔑 **Una zona es siempre la mecha de una vela: desde el borde del cuerpo hasta el extremo de la mecha.** Lo único que cambia entre un tipo de zona y otro es **qué vela se designa** y **qué mecha**.

| Tipo de zona | Vela designada | Mecha | Resultado |
|---|---|---|---|
| **Zona normal** tras corrida alcista | La de **máximo más alto**, incluida la vela que dispara el retroceso | Superior | **Resistencia** |
| **Zona normal** tras corrida bajista | La de **mínimo más bajo**, incluida la vela que dispara el retroceso | Inferior | **Soporte** |
| **Zona del retroceso** | La de **mínimo más bajo** del retroceso de una corrida alcista · la de **máximo más alto** del de una bajista | Inferior · superior | **Soporte** · **resistencia** |
| **Zona apéndice** | La **vela de rompimiento** | La del lado por el que rompió | Ver `R-11` |
| **Zona de premercado** | Toda vela sobre el umbral de volumen | La del lado de su color | Ver `R-15` |

**Límites:** el borde del **cuerpo** (el **cierre** si la vela es alcista, la **apertura** si es bajista, en una resistencia) y el **extremo de la mecha**. **Sin mecha** → la zona es una **línea** en el extremo de la vela. **Sin cuerpo** (`apertura = cierre`) → va **desde ese precio hasta la punta de la mecha**. Se extiende hacia la **derecha**.

**Regla:** `R-09` · **Diagrama:** `../02_Assets/diagramas/R-09_zona.png`

---

## ZONA DE PREMERCADO  *(nace del volumen, no de la estructura)*

La **única** forma en que puede nacer una zona sin que haya corrida ni retroceso: toda vela del premercado cuyo volumen supere `UMBRAL_VOL` (Volume Up Down, vela de 1 minuto).

| Elemento | Condición medible |
|---|---|
| **Ventana** | desde `PREMERCADO_INICIO` (la apertura de Tokio, 09:00 JST) hasta la **apertura del mercado americano** (= inicio de `R-02`). Fuera de ella **no marca nada** |
| **Cuántas** | **todas** las velas que superen el umbral, sin seleccionar |
| **Dirección** | vela **alcista** → **RESISTENCIA** en la mecha **superior** · vela **bajista** → **SOPORTE** en la mecha **inferior** |
| **Después** | **idéntica a cualquier otra zona**, incluido hacer de **borde de banda** |

> ⚠️ **El color manda aquí, y en `R-09` no.** En la zona por estructura el color de la vela es **irrelevante** — decide la estructura. En la zona de premercado el color **decide si es soporte o resistencia**.

> ⚠️ **Dos ventanas distintas — no confundirlas.** El **sombreado gris** del indicador `Premercado.1` empieza a las **15:00 Col del día anterior** y es **solo visual**. El escaneo de `R-15` empieza en `PREMERCADO_INICIO`. **El sombreado NO define dónde se buscan zonas.**

**Regla:** `R-15`

---

## ZONA APÉNDICE  *(rompimiento con CUERPO)*

La **segunda zona** que nace cuando una zona se rompe **con cuerpo** —el cierre queda fuera— y la consecución no llega. Va del **borde del cuerpo** de la vela de rompimiento al **extremo de su mecha**: **solo esa mecha**. La zona original **no se toca**: quedan **dos zonas**.

> **Origen del término:** `Parámetros Chaumer.pdf`, diapositiva "ZONA APÉNDICE (pág 1)" — *"Marcamos una nueva zona no por acción del precio sino porque es un movimiento sin consecución. Es una zona apéndice de la otra."*

**Reglas:** `R-11`, `R-14` · **Diagramas:** `../02_Assets/diagramas/apendice_caso1_plazo.png` (por plazo) y `../02_Assets/diagramas/apendice_caso2_estructura.png` (por estructura contraria)

---

## EXTENSIÓN DE ZONA  *(rompimiento con MECHA)*

Lo que le pasa a una zona rota **con mecha** —el cierre se queda dentro— cuando la consecución no llega: **crece** hasta la **punta de la mecha** de la vela de rompimiento. El **borde opuesto no se mueve**. Sigue habiendo **una sola zona**, más grande. No nace ninguna zona nueva.

> 🔗 **La extensión y la apéndice son la misma regla con un solo cambio:** dónde cierra la vela de rompimiento. Dentro, la zona **se estira** (`R-10`); fuera, la original queda intacta y **nace la apéndice** (`R-11`).

**Regla:** `R-10` · **Diagrama:** `../02_Assets/diagramas/R-10_extension_apendice.png`

---

## LÍNEA PROVISIONAL

Marca de nivel, **no zona**, que se dibuja en el mínimo (o máximo) más bajo alcanzado por un retroceso **todavía vivo**. Se mueve con cada vela que hunda más el extremo.

**No opera:** no admite rompimiento, ni consecución, ni reingreso. Solo dice *"aquí hay un nivel"*. Se convierte en **zona** cuando el retroceso queda confirmado — al aparecer una vela con máximo mayor (tras corrida alcista) — y siempre que `R-12` no la bloquee.

> ⚠️ **Asimetría deliberada.** La zona de la **corrida** nace al **aparecer** el retroceso, en vivo. La zona del **retroceso** nace cuando el retroceso **termina**.

**Regla:** `R-16`

---

## BANDA · ZONAS ENTRE ZONAS  *(la regla del 50 %)*

**Banda:** el tramo de precio entre el **borde interno** de una zona por abajo y el **borde interno** de una zona por arriba. Una **zona de premercado** cuenta como borde de banda igual que cualquier otra.

**El 50 %:** el punto medio entre esos dos bordes internos, recalculado contra la zona **más cercana por arriba** y la **más cercana por abajo** en ese momento.

> 🔑 **El criterio se mira sobre el MOVIMIENTO, no sobre la caja.** Una zona nueva entre dos zonas solo se marca si el movimiento que la genera queda entero dentro de la mitad en la que empezó. Si en algún punto **cruza el 50 %** —por ≥1 tick—, **no hay zona**, aunque el rectángulo resultante quede entero a un lado de la línea.

**Una sola zona por banda y por jornada:** el turno es **del primer retroceso** que aparezca dentro, y la banda queda cerrada para el resto del día se marque o no.

**Reglas:** `R-12`, `R-17` · **Diagrama:** `../02_Assets/diagramas/R-12_zonas_entre_zonas.png` · **Contraejemplo real:** `../02_Assets/invalidos/R-12_invalido_01.png`

---

## SUPERPOSICIÓN DE ZONAS

Cuando el rectángulo de la zona candidata **toca en cualquier punto** el de una zona ya marcada —**el contacto de bordes cuenta**, no hace falta que se pisen—, **no se crea zona nueva: se estira la existente** hasta el extremo más lejano de la candidata. Queda **una sola zona**, más grande, que **conserva su historial** de rompimientos y consecuciones. Si la candidata queda **entera dentro** de la existente, **la zona se queda igual**.

**Regla:** `R-13`

---

## SALIDA DE UNA ZONA  *(qué significa "el precio está fuera")*

El mercado **no** está fuera de una zona ni de una banda por geometría. Está fuera cuando ha hecho **rompimiento + consecución** sobre ella. Mientras el rompimiento de una zona viva **espere su consecución**, **no se marca ninguna zona al otro lado de esa zona** — y decide el **extremo del movimiento**, no el rectángulo de la zona candidata. La prohibición se levanta cuando llega la consecución: entonces la zona nueva se marca sobre la vela del **nuevo extremo**, no sobre la que rompió.

**Regla:** `R-18`

---

## VIGENCIA DE LA ZONA

> **Dos estados y nada más.** No existe importancia parcial ni antigüedad: una zona está **activa** o está **inactiva**. Ver `D-07`.

| Estado | Condición medible | Efecto |
|---|---|---|
| **Vigente** | por defecto, desde que se marca | Bloquea el target · sirve para entrar |
| **Superada en una dirección** | hubo **rompimiento Y consecución** en ese sentido | Sigue vigente para el otro sentido |
| **Solo rompimiento, sin consecución** | — | **Sigue vigente** |
| **Inválida ("menos importante")** | superada en **las dos direcciones**, cada una con **su rompimiento y su consecución** | 🔴 **Ninguno COMO ZONA** — ni bloquea el target, ni sirve para entrar, ni cuenta para medir el 50 %. 🔵 **Pero sigue ocupando su sitio:** la banda que ya gastó su zona no se reabre porque la zona muera. **Deja de valer como zona; no deja de ocupar el sitio** |

> 📌 **"Punto de reacción" = zona vigente.** Es como Chaumer nombra a este mismo concepto en sus sesiones en vivo. No es un término aparte (`P-13`).

**Tratamiento visual de la zona inválida:** se **conserva** en el gráfico con tonalidad muy tenue, contraste mínimo. Es solo un recuerdo visual — **no tiene ningún efecto operativo**.

**Regla:** `R-21` · **Diagrama:** `../02_Assets/diagramas/R-20_vigencia.png`

---

## INVERSIÓN DE PAPEL  *(la zona superada cambia de nombre)*

Cuando una zona es superada en un sentido —rompimiento **y** consecución— **cambia de papel** para el sentido contrario.

| Zona | Al ser superada | Papel nuevo |
|---|---|---|
| **Resistencia** superada **hacia arriba** | el precio queda por encima | pasa a actuar como **soporte** |
| **Soporte** superado **hacia abajo** | el precio queda por debajo | pasa a actuar como **resistencia** |

> 🔑 **No es una regla nueva: es `R-21` dicha con otras palabras.** `R-21` establece que una zona superada en un sentido *"sigue vigente para el otro sentido"*. El operador lo formula desde el otro lado — *"se convierte en soporte al ser superada"* — y significa exactamente lo mismo.

**Lo que NO cambia:** los límites del rectángulo, su historial, ni su estado. Sigue siendo **la misma zona**. Si después es superada también en el sentido contrario, queda **inactiva** por `R-21`.

**Casos reales:** `GALERIA.md` → `G-03` (resistencia → soporte) y `G-04` (soporte → resistencia).

---

# ROMPIMIENTO Y ENTRADA

## ROMPIMIENTO Y CONSECUCIÓN  *(el motor)*

Este par es el mecanismo central de la estrategia. **Sirve para dos cosas a la vez:** matar una zona y entrar al mercado. La consecución **es** la entrada de `R-24`.

| Término | Condición medible |
|---|---|
| **Rompimiento** | el precio supera por **≥1 `TICK`** el borde de la zona por el que va. **El cierre de la vela no importa**: la mecha basta |
| **Vela de rompimiento** | la vela en la que ocurre el rompimiento |
| **Rompimiento con CUERPO** | el **cierre** de esa vela queda más allá del borde traspasado |
| **Rompimiento con MECHA** | el cierre **no** queda más allá; solo la mecha superó el borde |
| **Consecución** | el precio supera por **≥1 `TICK`** el **máximo** (al alza) o el **mínimo** (a la baja) **de la vela de rompimiento** |
| **Vela de consecución** | la vela en la que ocurre la consecución |
| **Traspaso** | rompimiento **+** consecución: la zona queda superada en ese sentido. **No tiene plazo** |
| **Plazo de consecución** | `PLAZO_CONSECUCION`, contado desde la vela **siguiente** a la de rompimiento. Es un **tope, no una espera** (`R-14`), y gobierna solo la **geometría** de la zona (`R-10`, `R-11`) y la vida de la **orden** (`R-29`) |

**Regla:** `R-20`

---

## CONTINUACIÓN

Uno de los **dos únicos setups** del plan. **Opera el rompimiento que funciona.** Es **autocontenido**: el propio setup crea la zona que después rompe. Es un **IRI fluido** más su consecución:

`R-05` corrida → `R-06` retroceso → `R-09` zona → `R-20` rompimiento → **consecución = entrada**

**Direcciones:** **Continuación alcista** (compra) · **Continuación bajista** (venta). Se llamaba **IRI** hasta el 23/09/2026.

**Regla:** `R-25`

---

## REINGRESO

El otro setup. **Opera el rompimiento que falló:** sobre una zona hay rompimiento + consecución, el precio **no continúa**, **atraviesa la zona entera y sobrepasa el borde contrario** —esa es la **vela de reingreso**, que hace de vela de rompimiento— y la consecución de esa vela es la entrada. **No basta con tocar la zona.**

> 🔴 **EL REINGRESO ES INMEDIATO O NO ES.** La ventana se abre con la vela de consecución y **se cierra en cuanto el precio supera el extremo de esa vela**. Si el precio sigue de largo en el sentido del rompimiento, aunque sea un tick, **ya no hay reingreso posible sobre esa zona**.

**Direcciones:** **Reingreso alcista** · **Reingreso bajista**, contraria al rompimiento fallido.

**Regla:** `R-26` · **Diagrama:** `../02_Assets/diagramas/R-26_reingreso.png`

---

## PUNTO DE REFERENCIA  *(no confundir con punto de reacción)*

**Definición:** el **nivel de referencia de un retroceso** — el mínimo más bajo si el retroceso baja, el máximo más alto si sube. **Todos los retrocesos dejan uno**, se dibujen o no.

**Para qué sirve:** **tapa el objetivo de un reingreso.** A las entradas de continuación **no** les afecta.

**Cuándo deja de contar:** cuando **una vela cierra más allá** del nivel. Un pinchazo de mecha no lo rompe.

> 🔴 **Es lo único del plan que se rompe por CIERRE.** Todo lo demás —zonas incluidas— se rompe con que la mecha lo pase por un tick.

### Los dos "puntos"

| | Punto de **reacción** | Punto de **referencia** |
|---|---|---|
| **Qué es** | la **zona vigente** | el nivel de referencia de **cualquier retroceso vivo** |
| **Forma** | un rectángulo | una línea |
| **Cuántos hay** | los que haya | uno por retroceso |
| **Se rompe** | mecha, 1 tick | **cierre de vela** |
| **Tapa el target de** | **todo** el plan (`R-21`) | **solo** el reingreso (`R-41`) |

> ⚠️ **Los nombres se parecen y las cosas no.** Dos términos distintos, dos figuras distintas, dos alcances distintos.

| Reingreso | Zona rota | Qué tapa | Condición del target |
|---|---|---|---|
| **Alcista** | soporte roto hacia abajo | el **máximo** de un retroceso vivo | el target debe quedar **por debajo** de él |
| **Bajista** | resistencia rota hacia arriba | el **mínimo** de un retroceso vivo | el target debe quedar **por encima** de él |

> 🔗 **"Punto de control"** era un segundo nombre para esta misma idea. El operador unificó los dos el 14/09/2026 y el término *punto de control* desaparece del plan.

**Reglas:** `R-41` (definición y filtro) · `R-26` (el setup que lo usa)

---

## SESGO DE LA APERTURA  *(lo que NO es)*

La dirección de la vela base (`R-07`) dice **por dónde empieza** el día. **No es un sesgo**: da **mayor grado de favorabilidad** a una Continuación en ese sentido, en la apertura, pero **no prohíbe** entradas en sentido contrario. Se opera en **los dos sentidos**: cada tramo, suba o baje, deja su zona al terminar, y esa zona se opera **a favor de ese tramo**. Cuánto pesa esa favorabilidad es contextualización (`C-11`).

**Regla:** `R-27`

---

# FILTROS

## NOTICIA ROJA

Noticia marcada en **rojo** en **Forex Factory**, fuente única (Investing / "3 toros" **no se usa**). Naranja y amarillo **no bloquean**. Alrededor de ella hay una ventana de `VENTANA_NOTICIA` —de **T−5 a T+5**, ambos inclusive, sobre la hora publicada: **11 minutos**— en la que no se coloca orden.

> 📌 **Fuente única a propósito.** Dos calendarios no siempre marcan lo mismo; con uno solo no hay criterio que decidir en caliente.

**Regla:** `R-35`

---

# FUERA DEL VOCABULARIO

Términos del curso o del auditor que **no** se usan en el plan, y por qué.

| Término | Qué pasa con él |
|---|---|
| Impulso | sinónimo de **corrida**; el plan usa solo «corrida» |
| Punto de control | unificado en **punto de referencia** (14/09/2026) |
| Vela envolvente · vela interior | nombres del auditor, retirados: se describen por su condición (arriba) |
| Punto de reacción | = **zona vigente**, no es un término aparte (`P-13`) |
| Sobreextendido | contextualización, no regla (`C-01`) |
| Máximo volumen de sesión · volumen climático · volumen de parada | contextualización, no regla (`C-08`) |
| Día de Fed · FOMC · Powell | cubierto por `R-35` y `R-36` si figura en rojo en Forex Factory |
| Noticia naranja | **no bloquea** (`R-35`) |
| POC (punto de control del volumen) | ❌ descartado (`D-03`) |
| Zona crítica | ❌ descartada (`D-04`) |
| Zona de desequilibrio | ❌ descartada (`D-10`) |
| Fractal · manipulación | ❌ descartados (`D-11`) |
| Sesión europea / Londres | ❌ descartada (`D-12`) |

> 🔴 **Hay una sola regla de volumen en todo el plan** —`R-15`— y **se apaga en la apertura americana**. Dentro de la ventana operativa el volumen es contextualización, nunca parámetro (`C-08`).

Los términos del curso que **todavía no tienen definición** están en `PENDIENTES.md`.
