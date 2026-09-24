# GLOSARIO OPERATIVO

Cada término con su definición medible.

> Actualizado: 2026-09-23 · Sub-fase **F1.1 ✅ CERRADA** · **26 términos con sección propia** · 8 descartados · 4 movidos a contextualización
>
> 🏷️ **23/09/2026 — el setup IRI pasa a llamarse `CONTINUACIÓN`.** `IRI` se queda como nombre de la **estructura** (impulso–retroceso–impulso) sobre la que se construye.
> 🆕 **`CORRIDA FLUIDA`** añadida el 14/09/2026 — el término que decide si un rompimiento se opera.
> 🔗 **`PUNTO DE CONTROL` y `PUNTO DE REFERENCIA` unificados el 14/09/2026** en un solo término: **punto de referencia**, con la mecánica nueva.

---

## Regla del glosario

Ningún término entra a este archivo con adjetivos. *"Fuerte"*, *"claro"*, *"buen retroceso"*, *"cerca de"*, *"limpio"*, *"sano"*, *"fluido"*, *"tímido"*, *"extenso"* se traducen siempre a un criterio medible: ticks, puntos, porcentaje, número de velas, hora exacta, ratio o condición booleana. Si no hay número, el término se marca `PENDIENTE` y pasa a `PENDIENTES.md`.

---

## ⚠️ Colores de las velas — convención del operador

**El NT8 del operador NO usa la paleta estándar verde/rojo.**

| En sus gráficos | Significa |
|---|---|
| 🔵 **Vela AZUL** | **alcista** (cierre > apertura) |
| ⬜ **Vela BLANCA** | **bajista** (cierre < apertura) |

Todo el plan habla de velas **alcistas** y **bajistas**, nunca de verdes y rojas. Confirmado por el operador el 24/08/2026.

> 📌 **Recordatorio de `R-05` y `R-06`:** el color es **irrelevante** para definir corrida y retroceso — solo cuenta la relación entre máximos y mínimos. El color sí decide en `R-09` (qué borde del cuerpo es el límite) y en `R-15` (soporte o resistencia).

---

# TÉRMINOS DEFINIDOS

## CORRIDA  *(= impulso)*

> **Terminología:** "corrida" e "impulso" son **sinónimos**. El plan usa **solo "corrida"**. La palabra "impulso" queda retirada del vocabulario para no duplicar términos.

**Definición:** secuencia de velas que arranca cuando una vela supera el extremo de la anterior, y termina en la primera vela que retrocede al menos 1 tick contra ella.

### Corrida ALCISTA

| Momento | Condición medible |
|---|---|
| **Nace** | `máximo[n] > máximo[n−1]` — la corrida la forman la vela `n−1` (**origen**) y la vela `n` |
| **Tamaño mínimo** | **2 velas** (origen + la que supera) |
| **Tamaño máximo** | **ninguno** — la sobreextensión NO es un parámetro operativo · ver `CONTEXTUALIZACION.md`, `C-01` |
| **Vive mientras** | `mínimo[n] ≥ mínimo[n−1]` |
| **Empate** | `mínimo[n] = mínimo[n−1]` → **NO corta**, la corrida sigue |
| **Muere** | `mínimo[n] ≤ mínimo[n−1] − 0,25 pts (1 tick)` — esa vela es ya **la primera del retroceso** |

### Corrida BAJISTA — espejo exacto

| Momento | Condición medible |
|---|---|
| **Nace** | `mínimo[n] < mínimo[n−1]` |
| **Vive mientras** | `máximo[n] ≤ máximo[n−1]` |
| **Empate** | `máximo[n] = máximo[n−1]` → **NO corta** |
| **Muere** | `máximo[n] ≥ máximo[n−1] + 0,25 pts (1 tick)` |

### Lo que NO importa

- ❌ **El color de la vela es irrelevante.** Una vela **bajista** dentro de una corrida alcista no la corta, siempre que su mínimo no baje del mínimo anterior.
- ❌ **No se exige que cada vela haga máximos más altos.** Una **vela interior** (máximo más bajo + mínimo más alto) **no corta** la corrida.

### Nota clave

La corrida **nace mirando máximos** y **muere mirando mínimos**. Son dos criterios distintos y es intencionado.

**Diagrama:** `../02_Assets/diagramas/R-05_corrida.png`
**Regla asociada:** `R-05` en `reglas.json`
**Estado:** ✅ Confirmada 21/08/2026

---

## RETROCESO

**Definición:** secuencia de velas que arranca en la vela que mata la corrida y termina cuando nace la siguiente corrida.

### Retroceso tras corrida ALCISTA *(el retroceso va hacia abajo)*

| Momento | Condición medible |
|---|---|
| **Empieza** | primera vela con `mínimo[n] ≤ mínimo[n−1] − 0,25 pts (1 tick)` — la que mata la corrida (`R-05`) |
| **Termina** | primera vela con `máximo[n] > máximo[n−1]` — nace la siguiente corrida (`R-05`) |
| **Nº de velas** | sin mínimo ni máximo · **irrelevante** |
| **Tamaño mínimo** | **ninguno** |
| **Tamaño máximo** | `entrada − mínimo del retroceso ≤ 320 ticks` (`R-31`) |

### 🎯 "El mínimo del retroceso"

> **Es el mínimo MÁS BAJO de todas las velas del retroceso.** No el de la primera vela, no el de la última.

Este nivel es el que usan:
- **`R-31`** — dónde se arrastra el stop, y el filtro de los 320 ticks
- **`R-29`** — dónde se produce la invalidación total

### Retroceso tras corrida BAJISTA — espejo exacto

| Momento | Condición medible |
|---|---|
| **Empieza** | `máximo[n] ≥ máximo[n−1] + 0,25 pts (1 tick)` |
| **Termina** | `mínimo[n] < mínimo[n−1]` |
| **Nivel de referencia** | **el máximo MÁS ALTO** de todas las velas del retroceso |

### Lo que NO importa

- ❌ **El color de la vela es irrelevante.** Una vela **alcista** dentro de un retroceso bajista **no lo termina**, siempre que no haga un máximo más alto. Es el espejo exacto de la vela bajista dentro de una corrida.
- ❌ **El número de velas es irrelevante.** Solo cuenta la distancia en puntos.

**Diagrama:** `../02_Assets/diagramas/R-06_retroceso.png`
**Regla asociada:** `R-06` en `reglas.json`
**Estado:** ✅ Confirmada 21/08/2026

---

## ZONA  *(zona gris)*

> ### 🔑 REGLA ÚNICA DE MARCADO
> **Una zona es siempre la mecha de una vela: desde el borde del cuerpo hasta el extremo de la mecha.**
> Lo único que cambia entre un tipo de zona y otro es **qué vela se designa** y **qué mecha**.

### Qué vela se designa en cada caso

| Tipo de zona | Vela designada | Mecha | Resultado |
|---|---|---|---|
| **Zona normal** tras corrida alcista | La de **máximo más alto**, incluida la vela del retroceso | Superior | **Resistencia** |
| **Zona normal** tras corrida bajista | La de **mínimo más bajo**, incluida la vela del retroceso | Inferior | **Soporte** |
| **Zona apéndice** | La **vela de rompimiento** | La del lado por el que rompió | Ver `R-11` |

### Marcado de la zona normal · corrida ALCISTA

| Elemento | Condición medible |
|---|---|
| **Vela designada** | la vela de **máximo más alto** desde el origen de la corrida **hasta la vela que dispara el retroceso, incluida** |
| **Cuándo se marca** | al aparecer el retroceso (`R-06`). Antes no: hasta entonces la corrida sigue viva y la vela más alta puede cambiar |
| **Límite inferior** | borde superior del **cuerpo** — el **cierre** si la vela es alcista, la **apertura** si es bajista |
| **Límite superior** | el **máximo** de la vela (extremo de la mecha) |
| **Color de la vela** | **irrelevante** |
| **Sin mecha** (`máximo = borde del cuerpo`) | la zona es una **línea** en el extremo de la vela |
| **Sin cuerpo** (`apertura = cierre`) | el cuerpo mide cero: la zona va **desde ese precio hasta la punta de la mecha**. No hace falta caso especial |
| **Extensión temporal** | hacia la **derecha**, a lo largo del gráfico |

**Corrida BAJISTA → zona de SOPORTE:** espejo exacto. Vela de **mínimo más bajo**, del borde inferior del cuerpo hasta el **mínimo**.

### 🆕 El RETROCESO también marca zona — confirmado 26/08/2026

> *"Siempre se marca una zona de resistencia en corrida alcista siempre que haga retroceso, **y se marca zona de soporte en el retroceso**, siempre y cuando no exista zonas entre zonas y se pueda dibujar."* — Operador

| Movimiento | Zona que marca |
|---|---|
| **Corrida alcista** | RESISTENCIA en su vela más alta |
| **Su retroceso** | **SOPORTE** en la vela más baja del retroceso |
| **Corrida bajista** | SOPORTE en su vela más baja |
| **Su retroceso** | **RESISTENCIA** en la vela más alta del retroceso |

🔴 **Sujeto a `R-12`.** Si hay zona arriba y zona abajo y el movimiento que genera la candidata **cruza el 50 %** entre bordes internos, **no se marca**. **Frontera exacta (26/08/2026):** llegar **justo al 50 %** todavía marca; hace falta **superarlo por ≥1 tick** para anularla.

**Caso real verificado — 10/07/2026:**

```
Zona arriba (resistencia nueva) borde interno   29.903,50
Zona abajo  (premercado)        borde interno   29.878,75
                                        50 %  = 29.891,125
El retroceso baja hasta 29.880,50  →  CRUZA  →  NO se marca soporte
```

El operador decidió no marcarlo. `R-12` da la misma respuesta sobre datos exactos.

### ⚠️ CORREGIDA el 26/08/2026 — qué velas entran en la búsqueda

**La vela más alta se busca INCLUYENDO la vela que dispara el retroceso.**

| Versión | Rango de búsqueda | |
|---|---|---|
| ❌ **Antes** | solo las velas de la corrida | *"la vela **de la corrida** con el máximo más alto"* |
| ✅ **Ahora** | desde el origen de la corrida **hasta la vela que dispara el retroceso, ambas incluidas** | |

**Por qué importa:** una vela puede hacer **máximo mayor Y mínimo menor** a la vez. Esa vela **dispara el retroceso** (gana el mínimo) y aun así puede ser **la más alta de todo el movimiento**. Con la redacción antigua quedaba fuera de la búsqueda, y la zona se marcaba en el sitio equivocado.

**Caso real que lo destapó — 10/07/2026, primera zona de la sesión:**

| Col | máximo | mínimo | |
|---|---|---|---|
| 8:34 | 29.921,25 | 29.893,50 | la más alta **de la corrida** |
| 8:35 | 29.914,75 | 29.897,25 | |
| **8:36** | **29.926,00** | **29.896,75** | **dispara el retroceso Y es la más alta** |

| | Zona resultante | |
|---|---|---|
| Redacción antigua → vela 8:34 | 29.912,75 – 29.921,25 | 8,5 pts ❌ |
| **Redacción corregida → vela 8:36** | **29.903,50 – 29.926,00** | **22,5 pts ✅ la que marca el operador** |

> 🔑 **En palabras del operador:** *"la vela de las 08:34, a pesar de que es de color blanco, aún no hay retroceso… el mínimo de la vela de las 08:36 es menor a la anterior, por lo tanto ya hay retroceso, y se crea la zona en la vela más alta, que casualmente es la misma vela de las 08:36."*

**Diagrama:** `../02_Assets/galeria/F1_zona1_10jul.png`



**Diagrama:** `../02_Assets/diagramas/R-09_zona.png`
**Regla asociada:** `R-09` · **Estado:** ✅ Confirmada 24/08/2026

---

## ROMPIMIENTO Y CONSECUCIÓN  *(el motor)*

Este par es el mecanismo central de la estrategia. **Sirve para dos cosas a la vez:** matar una zona y entrar al mercado. La consecución al alza **es** la entrada de `R-24`.

| Término | Condición medible |
|---|---|
| **Rompimiento** | el precio supera por **≥1 tick (0,25 pts)** el borde de la zona por el que va. **El cierre de la vela no importa** |
| **Vela de rompimiento** | la vela en la que ocurre el rompimiento |
| **Rompimiento con CUERPO** | el **cierre** de esa vela queda más allá del borde traspasado |
| **Rompimiento con MECHA** | el cierre **no** queda más allá; solo la mecha superó el borde |
| **Consecución** | el precio supera por **≥1 tick** el **máximo** (al alza) o el **mínimo** (a la baja) **de la vela de rompimiento** |
| **Vela de consecución** | la vela en la que ocurre la consecución |
| **Plazo de las 5 velas** | la consecución debe darse dentro de las **5 velas** contadas desde la vela **siguiente** a la de rompimiento — 🔴 **pero solo para la GEOMETRÍA de la zona (`R-10`/`R-11`) y para la vida de la ORDEN (`R-29`)** |
| 🔴 **Consecución que traspasa la zona** | **NO tiene plazo.** El rompimiento queda pendiente indefinidamente y, cuando llegue la consecución —aunque sea 25 velas después— la zona queda traspasada en ese sentido. Las dos cosas ocurren sobre el **mismo** rompimiento: primero nace la apéndice o se estira, y más tarde el traspaso se confirma igual *(27/08/2026)* |
| 🔴 **La vela que confirma** | no abre a la vez el rompimiento del lado contrario: ese se busca desde la vela **siguiente** (`R-22`) |

**Reglas asociadas:** `R-20`, `R-22` · **Estado:** ✅ Confirmada 24/08/2026 · **ampliada 27/08/2026**

---

## VIGENCIA DE LA ZONA

> **Dos estados y nada más.** No existe importancia parcial ni antigüedad: una zona está **activa** o está **inactiva**. Ver `D-07`.

| Estado | Condición medible | Efecto |
|---|---|---|
| **Vigente** | por defecto, desde que se marca | Bloquea el target · sirve para entrar |
| **Superada en una dirección** | hubo **rompimiento Y consecución** en ese sentido | Sigue vigente para el otro sentido |
| **Solo rompimiento, sin consecución** | — | **Sigue vigente** |
| **Inválida ("menos importante")** | superada en **las dos direcciones**, cada una con **su rompimiento y su consecución** | 🔴 **Ninguno COMO ZONA** — ni bloquea el target, ni sirve para entrar, ni cuenta para medir el 50 %. 🔵 **Pero sigue ocupando su sitio:** la banda que ya gastó su zona no se reabre porque la zona muera. **Deja de valer como zona; no deja de ocupar el sitio** *(precisado 27/08/2026 · matizado 18/09/2026)* |

> 📌 **"Punto de reacción" = zona vigente.** Es como Chaumer nombra a este mismo concepto en sus sesiones en vivo. No es un término aparte. *(`P-13`, cerrado 24/08/2026.)*

**Tratamiento visual de la zona inválida:** se **conserva** en el gráfico con tonalidad muy tenue, contraste mínimo. Es solo un recuerdo visual de que allí hubo una zona válida — **no tiene ningún efecto operativo**.

**Diagrama:** `../02_Assets/diagramas/R-20_vigencia.png`
**Regla asociada:** `R-21` · **Estado:** ✅ Confirmada 24/08/2026

---

## EXTENSIÓN DE ZONA  *(rompimiento con MECHA)*

| Elemento | Condición medible |
|---|---|
| **Disparador** | rompimiento **con mecha** + **5 velas sin consecución** |
| **Acción** | la zona original **crece** hasta la **punta de la mecha** de la vela de rompimiento |
| **Borde opuesto** | **no se mueve** |
| **Resultado** | **una sola zona**, más grande. No nace ninguna zona nueva |

> 🔴 **El rompimiento NO se cae al vencer el plazo** *(27/08/2026)*. Vencido el plazo se resuelve la **geometría** (aquí, el estiramiento), pero el rompimiento **sigue esperando su consecución**: si algún día llega, la zona queda traspasada igual.

**Diagrama:** `../02_Assets/diagramas/R-10_extension_apendice.png`
**Regla asociada:** `R-10` · **Estado:** ✅ Confirmada 24/08/2026 · **precisada 27/08/2026**

---

## ZONA APÉNDICE  *(rompimiento con CUERPO)*

| Elemento | Condición medible |
|---|---|
| **Disparador** | rompimiento **con cuerpo** —el cierre queda fuera— y la consecución no llega. Se acaba con **lo que llegue primero**: o pasan **cinco velas** desde la siguiente a la del rompimiento, o antes de eso el mercado **arma una estructura completa en sentido contrario** y la apéndice nace en la **tercera** vela *(`R-14`)* |
| **Acción** | se marca una **zona nueva**, llamada **zona apéndice** |
| **Zona original** | **no se toca** |
| **Límites de la apéndice** | del **borde del cuerpo** de la vela de rompimiento al **extremo de su mecha** — es decir, **solo esa mecha** |
| **Resultado** | **dos zonas**: la original y su apéndice |

> **Origen del término:** `Parámetros Chaumer.pdf`, diapositiva "ZONA APÉNDICE (pág 1)" — *"Marcamos una nueva zona no por acción del precio sino porque es un movimiento sin consecución. Es una zona apéndice de la otra."*

**Reglas de entrada asociadas — PENDIENTES para F1.3:** el curso añade *"la zona apéndice alta solo sirve para largo"* y *"no se puede entrar entre zonas apéndices"*. Son reglas de entrada, no de marcado. Sin auditar.

> 🔴 **Igual que en la extensión:** el rompimiento que da lugar a la apéndice **sigue pendiente** de su consecución. Nacen las dos zonas y, más tarde, la original puede quedar traspasada cuando la consecución llegue *(27/08/2026)*.

**Caso real 7/07/2026:** la vela **8:39** rompe con cuerpo el soporte de la 8:36 (cierra en 29.502,75, bajo el piso 29.503,75) y ninguna de las 5 velas siguientes baja de 29.491,25 → en la vela de las **8:44** nace la apéndice **29.491,25 – 29.502,75**.

> ### 🔵 El plazo es un TOPE, no una espera — *operador, 01/09/2026*
>
> No hay que esperar a la quinta vela si el mercado ya dijo lo que tenía que decir. Sobre un **soporte roto hacia abajo**:
>
> | Vela | Qué hace | Condición medible |
> |---|---|---|
> | 1ª | no da consecución y **sube** | su mínimo no pasa del extremo de la vela de rompimiento |
> | 2ª | **retroceso** | su mínimo es **MENOR** que el de la vela anterior **y NO pasa** del extremo de la vela de rompimiento |
> | 3ª | **no sigue bajando: vuelve a subir** | aquí queda armada la estructura → **aquí se marca la zona** |
>
> 🔴 Si el mínimo de la 2ª vela **pasara** del extremo de la vela de rompimiento, eso **no es un retroceso: es la consecución**. No hay apéndice: la zona queda traspasada.
>
> **Subir no basta.** Hace falta la estructura completa. Contraejemplo real **20/07/2026**: tras romper en la 8:40 el precio subió cuatro velas seguidas sin retroceso en el medio → no armó estructura y la apéndice nació por plazo vencido, en la 8:45.
>
> Aplica igual al revés, con una resistencia rota hacia arriba.

**Cómo se dibuja:** la apéndice es **del mismo gris que cualquier otra zona** y se dibuja **desde la vela de rompimiento**, que es su vela origen — aunque no quede marcada hasta ese momento.

> 🔗 **Es la misma regla que la extensión, con un solo cambio.** Las dos arrancan igual y se acaban con los mismos dos finales. Lo único que las separa es **dónde cierra la vela de rompimiento**: dentro, la zona **se estira** y sigue siendo una *(`R-10`)*; fuera, la original queda intacta y **nace la apéndice** *(`R-11`)*. *Reescritas las dos con este texto — `R-10` el 14/09/2026, `R-11` el 15/09/2026.*

**Diagramas:** `../02_Assets/diagramas/apendice_caso1_plazo.png` (por plazo) y `../02_Assets/diagramas/apendice_caso2_estructura.png` (por estructura contraria) · también `R-10_extension_apendice.png`
**Reglas asociadas:** `R-11` y `R-14` · **Estado:** ✅ Confirmada 24/08/2026 · precisada 27/08/2026 · ampliada 01/09/2026 · **reescrita 15/09/2026 (fuera la palabra "plazo")**

---

## ZONAS ENTRE ZONAS  *(la regla del 50 %)*

> **Léela como lo que es: una PROHIBICIÓN con una excepción rara.** El operador: *"pasa poco, pero sí pasa."*

> ## 🔴 UNA SOLA ZONA POR BANDA Y POR JORNADA — *Alfredo Chaumer, 27/08/2026*
>
> La prohibición es más fuerte de lo que decía este plan. Dentro de una banda **solo se marca una zona en toda la jornada**, y el turno es **del primer retroceso** que aparezca dentro.
>
> | # | Paso |
> |---|---|
> | 1 | La **banda** va del borde interno de la zona de abajo al borde interno de la de arriba |
> | 2 | El **primer retroceso** dentro de esa banda la resuelve |
> | 3 | Si respeta el 50 % **se marca**; si no lo respeta **no se marca** |
> | 4 | **En los dos casos la banda queda cerrada** para el resto de la jornada |
> | 5 | La banda **no se vuelve a abrir** aunque se mueran las zonas que la formaron |
> | 6 | Solo se marcan las zonas que **salgan fuera** de la banda — y salir fuera es rompimiento + consecución, no geometría |
> | 7 | Una **zona de premercado** cuenta como borde de banda igual que cualquier otra *(operador, 01/09/2026)* |
>
> **Caso real 8/07/2026:** banda entre el techo del soporte de la vela 8:36 (29.303,50) y el piso de la resistencia de la vela 8:42 (29.374,25); mitad en 29.338,88. El primer retroceso dentro es el de la vela **8:43**, que baja a 29.329,75 → no cumple → no se marca **y la banda se cierra**. El retroceso de la vela **9:09** sí cumpliría el 50 %, pero ya no se marca. En ese día se pasa de 13 zonas a 11.
>
> **Caso real 14/07/2026 — la banda con un borde de premercado:** abajo el soporte de la vela 8:36 (29.685,00–29.693,00), arriba la resistencia de premercado de las 19:31 (29.901,25–29.908,25). Banda de 208,25 pts, mitad en **29.797,13**. El primer retroceso dentro es el de la vela **8:39**, que sube a **29.798,00** y se pasa de la mitad por **3½ ticks** → no se marca, la banda se cierra, y de las 8:41 a las 9:10 no se marca nada en toda esa franja.
>
> **Regla asociada:** `R-17`

**Cuándo aplica:** existe una zona **por arriba** y otra **por abajo**, y entre ellas el precio genera un movimiento que produciría una zona nueva.

### 🔑 El criterio se mira sobre el MOVIMIENTO, no sobre la caja

> **La zona nueva solo se marca si el movimiento que la genera queda entero dentro de la mitad en la que empezó.**
> Si en algún punto ese movimiento **cruza el 50 %**, **no hay zona** — aunque el rectángulo resultante quede entero a un lado de la línea.

| Elemento | Condición medible |
|---|---|
| **El 50 %** | punto medio entre el **borde interno** de la zona de arriba y el **borde interno** de la de abajo |
| **Qué se mide** | el **recorrido del precio**, desde dónde arrancó el movimiento hasta su extremo |
| **Criterio** | el movimiento no cruza el 50 % en ningún punto |
| **Cuántas** | **sin límite** — cada zona intermedia se evalúa igual, contra su propio 50 % |
| **Recálculo** | el 50 % se mide contra la zona **más cercana por arriba** y la **más cercana por abajo** en ese momento |

### Por qué no basta mirar el rectángulo

Contraejemplo real del operador (`../02_Assets/invalidos/R-12_invalido_01.png`), anotado por él como **"Error, no se debe marcar"**:

| | Precio aprox. |
|---|---|
| Borde interno de la resistencia | 29.360 |
| Borde interno del soporte | 29.285 |
| **50 %** | **29.322,5** |
| Zona marcada por error | 29.329 – 29.336 |

El rectángulo queda **entero por encima** del 50 %. Si el criterio fuera la caja, sería válido. Pero **el movimiento** arrancó abajo, junto al soporte (~29.265), y subió hasta 29.336: **cruzó el 50 % por el camino**. Por eso no se marca.

Coincide con Chaumer en vivo — 17/08, 18/08 y 20/08: *"ya no marcamos zonas entre zonas porque **este retroceso accede a la mitad** que hay entre estas dos zonas"*.

### Por qué no hace falta un tope de "una y basta"

Cada zona intermedia que sí llega a marcarse **parte el hueco en dos**. El siguiente candidato se mide contra un hueco la mitad de grande. **La regla se estrangula sola.**

> ⚠️ **Desviación `D-06`.** El curso dice *"luego de marcar una zona que no supera el 50%, ya no seguimos marcando zonas"*, y Chaumer en vivo cierra el marcado *"en toda esta área, en toda la sesión"*. El operador mantiene: sin límite de cantidad.

**Diagrama:** `../02_Assets/diagramas/R-12_zonas_entre_zonas.png`
**Contraejemplo real:** `../02_Assets/invalidos/R-12_invalido_01.png`
**Regla asociada:** `R-12` · **Estado:** ✅ Confirmada 24/08/2026

---

## SUPERPOSICIÓN DE ZONAS

**Regla:** si la zona que ibas a marcar toca una que ya existe, **no se crea zona nueva: se estira la existente**.

| Elemento | Condición medible |
|---|---|
| **Disparador** | el rectángulo de la zona candidata **toca en cualquier punto** el de una zona ya marcada — **el contacto de bordes cuenta**, no hace falta que se pisen |
| **Acción** | **no se crea zona nueva.** La zona existente se extiende hasta el **extremo más lejano** de la candidata |
| **Resultado** | **una sola zona**, más grande, que **conserva su historial** de rompimientos y consecuciones para `R-21` |
| **Caso límite** | si la candidata queda **entera dentro** de la existente, no hay nada que extender: **la zona se queda igual** |

> ⚠️ **Desviación `D-08`.** El curso dice *"zona b se construye solo con la parte que no se superpone, quedando así una zona más pequeña"* → dos zonas, una entera y otra recortada. El operador une en una sola. No es un matiz de dibujo: cambia **cuántos contadores de vigencia** hay en el gráfico.

**Regla asociada:** `R-13` · **Estado:** ✅ Confirmada 24/08/2026

---

## NUEVA ESTRUCTURA ANTES DE LAS 5 VELAS

**El reloj de 5 velas es un TOPE, no una espera obligatoria.** Tras un rompimiento se actúa con lo que llegue primero:

| Lo que llega primero | Qué se hace |
|---|---|
| **Una nueva estructura** — es decir, un **nuevo retroceso** | Se marca zona **ya**, sin esperar |
| **5 velas sin consecución** | `R-10` si rompió con mecha · `R-11` si rompió con cuerpo |

### Por qué el curso y el operador dicen cosas distintas y significan lo mismo

> **El curso:** *"Extensión de zona sin que pasen las 5 velas. **Extendemos** la zona debido a un nuevo retroceso…"*
> **El operador:** *"Si se da una nueva estructura, **se crea una nueva zona**, así no hayan pasado 5 velas."*

Si esa zona nueva **toca** a la existente, `R-13` la convierte automáticamente en una **extensión**. Mismo resultado, descrito desde los dos extremos.

**Regla asociada:** `R-14` · **Estado:** ✅ Confirmada 24/08/2026

---

## ZONA DE PREMERCADO  *(nace del volumen, no de la estructura)*

Es la **segunda forma** —y única— en que puede nacer una zona sin que haya corrida ni retroceso.

| Elemento | Condición medible |
|---|---|
| **Inicio del ESCANEO** | **19:00 hora Colombia** — apertura de Tokio (09:00 JST) |
| **Fin de la ventana** | **apertura del mercado americano** (= inicio de `R-02`) |
| **Umbral** | **MNQ > 6.000 contratos** · Volume Up Down, vela de 1 minuto · *el umbral de NQ (>2.000) se retiró el 06/09/2026 junto con el NQ; la equivalencia entre ambos **no está verificada** — ver `P-32`* |
| **Cuántas se marcan** | **todas** las velas que superen el umbral, sin seleccionar |
| **Dirección** | vela **alcista** → **RESISTENCIA** en la mecha **superior** · vela **bajista** → **SOPORTE** en la mecha **inferior** |
| **Límites** | del borde del cuerpo al extremo de la mecha — igual que `R-09` |
| **Comportamiento posterior** | **idéntico al de cualquier otra zona** — incluido **hacer de borde de banda** para la regla de una-sola-zona-por-banda *(confirmado 01/09/2026)* |

### ⚠️ Dos ventanas distintas — no confundirlas

En el NT8 del operador conviven dos cosas que **no son lo mismo**:

| | Qué es | Desde | Para qué |
|---|---|---|---|
| **Sombreado gris** *(indicador `Premercado.1`)* | marca visual · TimeRegion gris al 10 % | **15:00 Col del día anterior** | **solo ver** dónde acaba la sesión anterior y dónde empieza la operativa |
| **Escaneo de `R-15`** | búsqueda de velas > umbral | **19:00 Col (Tokio)** | **marcar zonas** |

> 🔴 **El sombreado NO define dónde se buscan zonas.** Empieza 4 horas antes, a propósito.
>
> **Verificado con datos (10/07/2026):** escaneando desde las 15:00 aparecen **3** velas sobre el umbral; escaneando desde las 19:00 aparece **1** — la que el operador marcó. Las dos extra son de las 15:00 y 15:01 Col, con volúmenes de 8.993 y 3.387: **es la subasta de cierre del efectivo del día anterior (16:00 ET)**, no premercado.

### La ventana de escaneo: por qué 19:00 y por qué cambia de largo

**19:00 hora Colombia es fijo las 52 semanas del año.** Japón no tiene horario de verano y Colombia tampoco: es **el único ancla temporal del plan inmune al DST**. `R-02` sí se mueve.

Como el inicio es fijo y el fin se mueve, **la ventana cambia de duración dos veces al año**:

| Época | Ventana (hora Colombia) | Duración | Velas de 1 min |
|---|---|---|---|
| Verano EEUU | 19:00 → 08:30 | 13 h 30 | ~810 |
| Invierno EEUU *(desde 2 nov 2026)* | 19:00 → 09:30 | 14 h 30 | ~870 |

*Sin hueco de cobertura:* Globex reabre a las 17:00 Col (verano) / 16:00 Col (invierno), siempre **antes** de las 19:00. El mercado ya está abierto cuando empieza el escaneo.

### 🔴 La regla se APAGA en la apertura americana

**El umbral de volumen solo existe en premercado.** Confirmado por el operador el 24/08/2026.

| Momento | Vela por encima del umbral de volumen |
|---|---|
| **Antes** de la apertura americana | → **marca zona** por `R-15` |
| **Después** de la apertura americana | → **no marca nada.** Dentro de sesión solo se marcan zonas por estructura (`R-09`) |

> 📌 **Por qué el corte no es arbitrario.** El mismo número significa cosas distintas a cada lado de la apertura: en premercado ese volumen en una vela de 1 minuto es un evento raro; en sesión es volumen corriente. Sin el corte, el gráfico se llenaría de zonas.

### Una vez marcada, es una zona normal

Se le aplican **todas** las reglas sin excepción:

| | |
|---|---|
| `R-21` Vigencia | ✅ se invalida al ser traspasada por ambos lados |
| `R-10` Extensión | ✅ |
| `R-11` Zona apéndice | ✅ |
| `R-12` Zonas entre zonas | ✅ |
| `R-13` Superposición | ✅ |
| `R-14` Nueva estructura | ✅ |

> ⚠️ **El color manda aquí, y en `R-09` no.** En la zona por estructura el color de la vela es **irrelevante** — decide la estructura. En la zona de premercado el color **decide si es soporte o resistencia**. Dos criterios distintos conviviendo; conviene no mezclarlos.

### Marcado múltiple — y por qué no satura el gráfico

Se marcan **todas** las velas que superen el umbral. No se elige la mayor del grupo.

> ⚠️ **Desviación `D-09`.** `Parámetros Chaumer.pdf` dice *"solo marcamos los extremos"*. El operador marca todas.

**`R-13` amortigua la desviación por sí solo.** Velas consecutivas de alto volumen suelen tener mechas que se tocan, y la superposición **no apila zonas: estira una sola**. Cada vela sobre el umbral genera una *candidata*; `R-13` decide después cuántas sobreviven como zonas separadas.

**Regla asociada:** `R-15` · **Estado:** ✅ Confirmada 24/08/2026 · Ventana y marcado múltiple confirmados 24/08/2026

---

## ESTRUCTURA

**Regla:** hay una estructura nueva cuando **aparece un retroceso nuevo y ese retroceso genera zona**.

| Elemento | Condición medible |
|---|---|
| **Disparador** | un **retroceso nuevo** (`R-06`) |
| **Requisito** | que ese retroceso **genere zona** (`R-09`) |
| **Uso** | es el disparador de `R-14`: con estructura nueva se marca zona **ya**, sin agotar las 5 velas |

### El único retroceso que NO genera zona

**Es el caso de `R-12`**, y no hay ningún otro. No existe filtro adicional oculto.

| Situación del retroceso | ¿Genera zona? | ¿Hay estructura nueva? |
|---|---|---|
| Con **espacio libre** | ✅ sí | ✅ sí |
| **Entre** una zona de soporte y una de resistencia, **cruzando el 50 %** | ❌ no (`R-12`) | ❌ **no** |

> 🔗 **Consecuencia encadenada en `R-14`.** Si el retroceso nuevo cae en el caso bloqueado por `R-12`, **no hay estructura nueva**: `R-14` no dispara, el reloj de las 5 velas **sigue corriendo**, y el desenlace vuelve a `R-10` (rompió con mecha) o `R-11` (rompió con cuerpo). Es el único punto del plan donde `R-12` decide indirectamente sobre el reloj de `R-20`.

**Regla asociada:** `R-14` · **Estado:** ✅ Confirmada 24/08/2026 · Cierra `P-18`

---

## NOTICIA ROJA

**Regla:** no se opera en los **11 minutos** que rodean una noticia roja.

| Elemento | Condición medible |
|---|---|
| **Fuente** | **Forex Factory**, única. Investing / "3 toros" **no se usa** |
| **Nivel** | solo **rojo**. Naranja y amarillo **no bloquean** |
| **Ventana** | **T−5 min → T+5 min**, ambos inclusive, sobre la hora publicada |
| **Acción** | no colocar orden dentro de la ventana |

> 📌 **Fuente única a propósito.** Dos calendarios no siempre marcan lo mismo; con uno solo no hay criterio que decidir en caliente.

### Orden ya colocada cuando llega la noticia

**Se cancela** al entrar la ventana T−5. No se deja correr.

Por `R-29`, una orden cancelada **no consume el cupo** de `R-28`.

**Pasado T+5**, si el setup sigue vivo, **se vuelve a colocar la orden**.

> 🚨 **`P-19` abierto.** Esa reentrada choca con el reloj de 5 velas de `R-20`. Ver `PENDIENTES.md`.

**Regla asociada:** `R-35` · **Estado:** ✅ Confirmada 24/08/2026

---

## CORRIDA FLUIDA

**Definición:** una corrida es fluida cuando la secuencia sale bien **tres veces seguidas**:

| | |
|---|---|
| **1** | la **corrida** deja su zona al terminar |
| **2** | el **retroceso no se pasa**: mide menos que su corrida (empate cuenta como que no se pasa) |
| **3** | la **corrida siguiente rompe** esa zona |

**Para qué sirve:** **solo se entra en el rompimiento de la zona de una corrida fluida.** Es la traducción medible de *"no es fluida"* y *"el mercado está lateral"*.

**Cómo se emparejan:** la vela de apertura declara el sentido. Desde ahí el mercado alterna corrida en ese sentido y retroceso en contra. **Cada corrida se empareja con el retroceso que viene justo después de ella, y las parejas no se solapan.**

**Las dos formas de fallar:**

- **El retroceso se pasa** — mide más que su corrida. Caen **las dos zonas** de esa pareja: la de la corrida y la que deja el propio retroceso pasado.
- **La corrida siguiente no rompe** — llega a la zona, no puede con ella y se devuelve.

**Cómo se recupera:** en los dos casos, dos pasos en este orden: **primero** la zona queda rota con su consecución —ese es el **rompimiento directo**, y no se opera—; **después** el mercado arma **otro IRI que deje una zona nueva entera más allá de la bloqueada** — por encima para largo, por debajo para corto. Ese IRI nuevo se juzga desde cero con las mismas tres condiciones, y **la fluidez se puede volver a perder**.

**🧭 El bloqueo es del SENTIDO, no de la zona** *(21/09/2026)*. Perdida la fluidez, **no se opera ningún rompimiento en el sentido del día**, sea cual sea la zona — incluidas las de **premercado**, que no tienen corrida detrás. No toca el sentido contrario.

**Palabras del operador (14/09/2026):** *"una corrida alcista fluida, un retroceso normal, y la siguiente corrida que sería la entrada"*. Y sobre el fallo: *"si la siguiente corrida no rompe la zona y se devuelve, uno ya dice que como no fue capaz de romper, el mercado va a estar lateral, entonces toca esperar que haga otro IRI encima de esa zona"*.

> 🔑 **Una zona bloqueada no se muere.** Sigue vigente para todo lo demás: se dibuja, tapa objetivos, hace de borde de banda y se rompe e invalida como cualquier otra. Lo único que se descarta es **entrar en su rompimiento**.

> ⚠️ **No confundir con el tamaño.** Una corrida no es fluida por ser grande. El 14/09/2026 la subida que no valía medía 53,25 puntos contra una bajada de 43,50 — era **más grande** que lo anterior y aun así no servía.

**Regla asociada:** **`R-40`** · Solo afecta a continuaciones; el Reingreso no se toca · **Estado:** ✅ Confirmada 14/09/2026 · **ampliada 21/09/2026**

---

## ROMPIMIENTO DIRECTO

**Definición:** el rompimiento de una zona **mientras el sentido del día está bloqueado** porque se perdió la fluidez. Por parámetros cumple —pasa el tick, llega la consecución—, pero el mercado está lateral y **por contexto pierde probabilidad**.

**Qué se hace:** **no se opera nunca.** Es solo el primer paso para que vuelvan las entradas: después hay que esperar un IRI nuevo entero más allá de la zona, y se entra en ése.

**Palabras del operador (18/09/2026):** *"operativamente por regla cumple, sin embargo no es una corrida limpia porque el mercado está lateral… hay que esperar que el mercado rompa esa zona, haga otro IRI, y se ingresa en ese otro"*.

**Casos reales:** 18/09/2026 a las 8:49 · 21/09/2026 a las 8:37 y a las 8:52.

**Regla asociada:** `R-40` · **Estado:** ✅ Confirmado 21/09/2026

---

## PUNTO DE REFERENCIA  *(no confundir con punto de reacción)*

**Definición:** el **nivel de referencia de un retroceso** — el mínimo más bajo si el retroceso baja, el máximo más alto si sube. **Todos los retrocesos dejan uno**, se dibujen o no.

**Para qué sirve:** **tapa el objetivo de un reingreso.** Si entre la entrada y el objetivo queda vivo un punto de referencia y el objetivo lo pasa, el reingreso no se opera. Si el objetivo cae **justo encima**, se opera. A las entradas de continuación **no** les afecta.

**Cuándo deja de contar:** cuando **una vela cierra más allá** del nivel. Un pinchazo de mecha no lo rompe.

> 🔴 **Es lo único del plan que se rompe por CIERRE.** Todo lo demás —zonas incluidas— se rompe con que la mecha lo pase por un tick. Confirmado por el operador el 14/09/2026.

### 🔗 Unificado el 14/09/2026

Hasta esa fecha había **dos** términos para la misma idea:

| | Qué decía antes | |
|---|---|---|
| **Punto de referencia** | el extremo del retroceso que originó **esa** zona · no caducaba | ⬇️ |
| **Punto de control** | el extremo de **cualquier** retroceso vivo · muere por cierre | ⬇️ |
| **Unificado** | **el nivel de referencia de cualquier retroceso vivo · muere cuando una vela cierra más allá** | |

**Decisión del operador:** *"punto de control y punto de referencia es lo mismo, podemos unificar esos conceptos, dejemos uno solo: Punto de Referencia."* Queda el **nombre viejo** con la **mecánica nueva**. El término *punto de control* desaparece del plan.

Y las dos frases con las que lo explicó, con tres semanas de diferencia, son el mismo razonamiento:

- 24/08/2026 — *"pueden defender ese nivel y el trade le quita probabilidad, por lo tanto para un reingreso debe tener camino libre para el target"*
- 14/09/2026 — *"un punto de control es un retroceso que dice que en ese punto se puede volver a presentar como una zona que el precio lo puedan defender para evitar que lo rompan"*

**Lo que cierra de paso:** ya no hace falta que la zona venga de un retroceso, así que **una zona de premercado también puede dar reingreso**.

### Los dos "puntos" que quedan

| | Punto de **reacción** | Punto de **referencia** |
|---|---|---|
| **Qué es** | la **zona vigente** | el nivel de referencia de **cualquier retroceso vivo** |
| **Forma** | un rectángulo | una línea |
| **Cuántos hay** | los que haya | uno por retroceso |
| **Se rompe** | mecha, 1 tick | **cierre de vela** |
| **Tapa el target de** | **todo** el plan (`R-21`) | **solo** el reingreso (`R-41`) |

> ⚠️ **Los nombres se parecen y las cosas no.** Dos términos distintos, dos figuras distintas, dos alcances distintos.

**Cómo se lee según la dirección del reingreso:**

| Reingreso | Zona rota | Qué tapa | Condición del target |
|---|---|---|---|
| **Alcista** | soporte roto hacia abajo | el **máximo** de un retroceso vivo | el target debe quedar **por debajo** de él |
| **Bajista** | resistencia rota hacia arriba | el **mínimo** de un retroceso vivo | el target debe quedar **por encima** de él |

**Dibujo:** no se dibujan todos — *"la idea es tener el gráfico lo más limpio posible"*. Se dibuja **solo cuando aparece un reingreso**, para comprobar si el objetivo está libre. Flecha punteada, **naranja oscuro `#FF9A3C`**, contraste bajo, extendida hacia la derecha. Al romperse: contraste más leve y se corta **una vela después** de la que lo rompió.

**Caso de origen de la mecánica nueva · 11/09/2026:** Reingreso bajista a las 9:01, entrada 29.440,25, objetivo 29.405,50. El punto de referencia de la vela de **8:58**, en **29.423,00**, queda en medio. Descartado.

**Reglas asociadas:** `R-41` (definición y filtro) · `R-26` (el setup que lo usa) · **Diagrama:** `../02_Assets/diagramas/R-26_reingreso.png` · **Estado:** ✅ Confirmada 24/08/2026 · 🔗 unificada 14/09/2026

---

## CONTINUACIÓN

Uno de los **dos únicos setups** del plan. **Opera el rompimiento que funciona.** Hasta el 23/09/2026 se llamaba **IRI**.

Es **autocontenido**: el propio setup crea la zona que después rompe. Se construye sobre un **IRI** —la estructura, ver abajo— que tiene que ser **fluido** (`R-40`):

`R-05` corrida → `R-06` retroceso → `R-09` zona → `R-20` rompimiento → **consecución = entrada**

**Direcciones:** **Continuación alcista** (compra) · **Continuación bajista** (venta).

**Plazo:** 5 velas. Lo habitual es la 1ª o la 2ª.

> El operador observa que una consecución en la vela 3 o 4 *"significa que el precio no tiene fuerza"*. **No es regla** — no hay número que ejecutar y la orden ya está en reposo. Va a `CONTEXTUALIZACION.md`.

**Regla asociada:** `R-25` · **Estado:** ✅ Confirmada 24/08/2026 · renombrada 23/09/2026

---

## IRI  *(Impulso–Retroceso–Impulso)*

**La estructura, no el setup.** Una corrida deja su zona, el precio retrocede, y la corrida siguiente rompe esa zona. No se opera por sí sola: es lo que tiene que pasar para que exista una **Continuación**, que es este IRI más su consecución.

Para que sea operable tiene que ser **fluido** (`R-40`): el retroceso no se pasa.

**Estado:** término redefinido por el operador el 23/09/2026. Antes era el nombre del setup.

---

## REINGRESO

El otro setup. **Opera el rompimiento que falló.**

| # | Paso |
|---|---|
| 1 | Sobre una zona hay **rompimiento + consecución** |
| 2 | El precio **no continúa** |
| 3 | El precio **atraviesa la zona entera y sobrepasa el borde contrario** → **vela de reingreso** |
| 4 | **Consecución** ≥1 tick más allá de esa vela ← **entrada** |
| 5 | El **target debe caber dentro del punto de referencia** |

> 🔑 **No basta con tocar la zona.** Un reingreso alcista exige superar el **borde superior** del soporte; uno bajista, el **borde inferior** de la resistencia. Esa vela hace de vela de rompimiento.

> 🔴 **EL REINGRESO ES INMEDIATO O NO ES** *(27/08/2026)*. La ventana se abre con la vela de consecución y **se cierra en cuanto el precio supera el extremo de esa vela**. Si el precio sigue de largo en el sentido del rompimiento, aunque sea un tick, el rompimiento quedó bueno y **ya no hay reingreso posible sobre esa zona** — por mucho que el precio vuelva a pasar por ella más tarde.

| Caso | Qué pasó | ¿Reingreso? |
|---|---|---|
| **6/07/2026** · zona `R` 29.926,50–29.939,25 | rompe la 8:46; la **8:47** da la consecución subiendo a 29.967,25 y **esa misma vela** se desploma a 29.908,75 | ✅ **SÍ** — `G-12` |
| **13/07/2026** · zona `R` 29.652,25–29.666,75 | rompe la 9:25 (máx 29.677,25), consecución la **9:27** (máx 29.681,00) y el precio **sigue subiendo** hasta 29.724,00 | ❌ **NO** — lo de la 9:41 llega 14 velas tarde |

La orden, una vez enviada, muere por `R-29`.

**Regla asociada:** `R-26` · **Diagrama:** `../02_Assets/diagramas/R-26_reingreso.png` · **Estado:** ✅ Confirmada 24/08/2026 · **plazo añadido 27/08/2026**

---

## INVERSIÓN DE PAPEL  *(la zona superada cambia de nombre)*

**Definición:** cuando una zona es superada en un sentido —rompimiento **y** consecución— **cambia de papel** para el sentido contrario.

| Zona | Al ser superada | Papel nuevo |
|---|---|---|
| **Resistencia** superada **hacia arriba** | el precio queda por encima | pasa a actuar como **soporte** |
| **Soporte** superado **hacia abajo** | el precio queda por debajo | pasa a actuar como **resistencia** |

> 🔑 **No es una regla nueva: es `R-21` dicha con otras palabras.** `R-21` establece que una zona superada en un sentido *"sigue vigente para el otro sentido"*. El operador lo formula desde el otro lado — *"se convierte en soporte al ser superada"* — y significa exactamente lo mismo.

**Lo que NO cambia:** los límites del rectángulo, su historial, ni su estado. Sigue siendo **la misma zona**. Si después es superada también en el sentido contrario, queda **inactiva** por `R-21`.

**Casos reales:** `GALERIA.md` → `G-03` (resistencia → soporte) y `G-04` (soporte → resistencia).

**Regla asociada:** `R-21` · **Estado:** ✅ Confirmada 24/08/2026

---


## VELA BASE

La **primera vela de la ventana operativa: la 08:31** hora Colombia.

No se compara con ninguna anterior — la 08:30 es premercado y no sirve como `n−1`. **Declara ella misma la dirección del día con su propio cuerpo:** cierre por encima de su apertura → el día inicia alcista; por debajo → inicia bajista. Y es la vela origen de la primera corrida.

La corrida se mide **desde su extremo**: el mínimo si es alcista, el máximo si es bajista. Y **puede sostener zona** como cualquier otra vela.

**Regla asociada:** `R-07` · **Estado:** ✅ Confirmada 2026-08-26

## VELA QUE HACE MÁXIMO MAYOR Y MÍNIMO MENOR

> ⚠️ **Nota de vocabulario (26/08/2026).** El auditor la había bautizado *"vela envolvente"*. **Ese término NO es del operador ni del método** y queda retirado. Se describe solo por su condición.

Cubre el rango completo de la vela anterior. Palabras del operador: *"hace rompimiento tanto arriba como abajo, funcionaría como rompimiento y como retroceso"*.

Tiene dos comportamientos según el estado, y esa distinción es lo que la hace manejable:

| Estado | Qué pasa | Quién manda |
|---|---|---|
| **Con corrida viva** | El mínimo menor **mata la corrida**. Es ya la primera vela del retroceso. Sin ambigüedad | `R-05` |
| **Sin corrida viva** | **No declara dirección.** Pasa a ser la nueva vela origen y decide la siguiente. Si esa también es envolvente, se repite | `R-08` |

**Medido en 39 sesiones:** 763 casos en ventana operativa — 384 con corrida viva, **379 sin corrida viva** (~10 por sesión).

**Regla asociada:** `R-08` · **Estado:** ⚠️ **En revisión** — ver `P-24`

## LÍNEA PROVISIONAL

Marca de nivel, **no zona**, que se dibuja en el mínimo (o máximo) más bajo alcanzado por un retroceso **todavía vivo**. Se mueve con cada vela que hunda más el extremo.

**No opera:** no admite rompimiento, ni consecución, ni reingreso. Solo dice *"aquí hay un nivel"*.

Se convierte en **zona** cuando el retroceso queda confirmado — al aparecer una vela con máximo mayor (tras corrida alcista) — y siempre que `R-12` no la bloquee.

> ⚠️ **Asimetría deliberada.** La zona de la **corrida** nace al **aparecer** el retroceso, en vivo. La zona del **retroceso** nace cuando el retroceso **termina**. Y la orden pendiente muere en el primer momento, no en el segundo.

**Regla asociada:** `R-16` · **Estado:** ✅ Confirmada 2026-08-26

---

## VELA QUE NO HACE NADA

La que hace **máximo menor Y mínimo mayor** que la anterior: cabe entera dentro de ella.

> ⚠️ **Nota de vocabulario (26/08/2026).** El auditor la llamaba *"vela interior"*. Término retirado. Palabras del operador: *"esa vela que está entre la mitad de la vela anterior **no hace nada**, hay que esperar la siguiente vela para tomar una decisión"*.

**Qué hace y qué no:**

| | |
|---|---|
| **No declara dirección** | ni arriba ni abajo |
| **No mueve el nivel vivo** | si la corrida es alcista, el máximo a batir sigue siendo el de la vela alta anterior. Una vela posterior que supere a la "que no hace nada" pero **no** al nivel vivo, **tampoco hace nada por arriba** |
| **PERO no se salta** | la corrida sigue muriendo comparando el mínimo contra la vela **inmediatamente anterior**, sea cual sea. Esto vale también con corrida viva (`R-05`, *"la vela interior no corta"*) |

**Caso real:** 07/07/2026. La 8:32 no hace nada. La 8:33 supera el máximo de la 8:32 pero no el nivel vivo de la 8:31, así que por arriba no cuenta — y su mínimo **sí** es menor que el de la 8:32, así que **hace retroceso**. El auditor se saltó las dos velas y lo detectó el operador.

**Regla asociada:** `R-05`, `R-07` · **Estado:** ✅ Confirmada 2026-08-26

---

# AGENDA DE TÉRMINOS PENDIENTES — F1.1

### Estructura de precio
| Término | Estado |
|---|---|
| ~~Impulso~~ | ✅ Retirado — sinónimo de corrida |
| Corrida | ✅ **Definida** |
| Retroceso | ✅ **Definido** |
| ~~Punto de reacción~~ | ✅ **= zona vigente** — no es un término aparte · `R-21` |

| Estructura | ✅ **Definida** — retroceso nuevo que genera zona (todos salvo el bloqueado por `R-12`) |
| Estructura pequeña / chica | PENDIENTE |
| Fluidez · movimiento fluido | PENDIENTE |
| ~~Sobreextendido~~ | 🔵 **No es un término del glosario** — es contextualización · `C-01` |
| Cambio de estructura | PENDIENTE |
| ~~Fractal~~ | ❌ **Descartado** — no usa el término · `D-11` |
| Rango · congestión | PENDIENTE |
| ~~Manipulación~~ | ❌ **Descartada** — no usa el término · `D-11` |

### Zonas
| Término | Estado |
|---|---|
| Zona (zona gris) | ✅ **Definida** |
| Zona vigente | ✅ **Definida** |
| ~~Zona crítica~~ | ❌ **Descartada** — ver `D-04` |
| Zona apéndice | ✅ **Definida** |
| ~~Zona de desequilibrio~~ | ❌ **Descartada** — el operador no usa el término · `D-10` |
| Zona "menos importante" (traspasada en ambas direcciones) | ✅ **Definida** — sin efecto operativo |
| Zonas entre zonas · regla del 50 % | ✅ **Definida** |
| Superposición de zonas | ✅ **Definida** |
| Extensión de zona | ✅ **Definida** |

### Secuencia de entrada
| Término | Estado |
|---|---|
| Rompimiento | ✅ **Definido** |
| Vela de rompimiento | ✅ **Definida** — con cuerpo / con mecha |
| Consecución | ✅ **Definida** |
| Vela de consecución | ✅ **Definida** |
| Consecución inmediata | PENDIENTE |
| Ingreso | PENDIENTE |
| Reingreso | PENDIENTE |
| Entrada tendencial | PENDIENTE |
| Invalidación total | Parcial — usada en `R-29`, falta ficha propia |
| Plazo de las 5 velas | ✅ **Definido** — desde la vela siguiente al rompimiento |

### Volumen
| Término | Estado |
|---|---|
| Volumen relevante (**> 6.000 MNQ**) | ✅ **Definido** — `R-15`, **solo premercado** |
| ~~Máximo volumen de sesión~~ | 🔵 **Fuera de reglas** — contextualización `C-08` |
| ~~Volumen climático~~ | 🔵 **Fuera de reglas** — contextualización `C-08` |
| ~~Volumen de parada~~ | 🔵 **Fuera de reglas** — contextualización `C-08` |
| ~~POC (punto de control)~~ | ❌ **Descartado** — ver `D-03` |

> 🔴 **El bloque de volumen queda cerrado.** Existe **una sola regla de volumen en todo el plan** —`R-15`— y **se apaga en la apertura americana**. Dentro de la ventana operativa el volumen es contextualización, nunca parámetro (`C-08`). Por eso los tres términos de arriba salen de la agenda de F1.1: no van a recibir número.

### Sesiones y contexto
| Término | Estado |
|---|---|
| Premercado | ✅ **Definido** — `R-15`: 19:00 Col del día anterior → apertura americana |
| ~~Sesión europea / Londres~~ | ❌ **Descartada** — no se mira · `D-12` |
| Apertura americana | ✅ Definida en **R-02** — 09:30:00 ET |
| Noticia roja | ✅ **Definida** — `R-35`: Forex Factory, solo rojas, ±5 min |
| ~~Noticia naranja~~ | ❌ **No bloquea** — `R-35` |
| Día Fed / FOMC / Powell | 🔵 Cubierto por `R-35` si figura en rojo en Forex Factory |

---

---

## SALIDA DE UNA ZONA  *(qué significa "el precio está fuera")*

**Definición:** el mercado **no** está fuera de una zona por geometría. Está fuera cuando ha hecho **rompimiento + consecución** sobre ella.

| Elemento | Condición medible |
|---|---|
| **Prohibición** | mientras el rompimiento de una zona viva **espere su consecución**, **no se marca ninguna zona al otro lado de esa zona** |
| **Qué se mide** | el **extremo del movimiento**, no el rectángulo de la zona candidata. Si el extremo pasa el borde de la zona pendiente, no se marca — aunque los rectángulos se solapen |
| **Cuándo se levanta** | cuando llega la consecución. Entonces la zona nueva se marca sobre la vela del **nuevo extremo**, no sobre la que rompió |

**Palabras del operador (27/08/2026):** *"Salir fuera de la banda es que el mercado haga rompimiento + consecución. Ahí está fuera de la banda, fuera de la zona."*

**Casos reales 8/07/2026:**

| Vela | Qué hace | Resultado |
|---|---|---|
| **9:13** | solo rompe el soporte de la vela 8:39 | **no marca nada**; la consecución llega en la 9:16 y el soporte nace entonces sobre la **vela 9:16**, en 29.235,25 – 29.252,50 |
| **9:44** | rompe el soporte de la vela 9:16 | **no marca nada**; la consecución llega en la 9:47 |

**Caso real 7/07/2026:** la vela **8:52** rompe la apéndice de la 8:39 y la **8:54** hace la consecución **dentro** del plazo — rompimiento exitoso, así que en la 8:53 **no se marca soporte** pese a que hubo retroceso.

**Regla asociada:** `R-18` · **Estado:** ✅ Confirmada 27/08/2026

---

## SESGO DE LA APERTURA  *(lo que NO es)*

**Definición:** la dirección de la vela de las 08:31 (`R-07`) dice **por dónde empieza** el día. **No es un sesgo**: no obliga a operar en ese sentido durante toda la sesión.

| | |
|---|---|
| **Qué sí hace** | da **mayor grado de favorabilidad** a una entrada de continuación en ese sentido, en la apertura |
| **Qué NO hace** | prohibir entradas en sentido contrario |
| **Cómo se opera** | en **los dos sentidos**. Cada tramo, suba o baje, deja su zona al terminar, y esa zona se opera **a favor de ese tramo** |

**Palabras del operador (27/08/2026):** *"la dirección de la vela de apertura no quiere decir que toda la jornada va a ser en esa dirección, solo da el mayor grado de favorabilidad a un trade IRI en la apertura, pero no quiere decir que se sesgue y no pueda operar un trade IRI en dirección contraria."*

**Caso real 9/07/2026:** la vela 8:31 es bajista, pero el mercado sube 190 puntos desde la 8:33. Con sesgo el día no daba nada; sin sesgo aparece el largo del rompimiento de la vela 8:43, que el operador **sí tomó**.

**🟠 Pendiente para contextualización:** cuánto pesa esa *"mayor favorabilidad"*.

**Regla asociada:** `R-27` · **Estado:** ✅ Confirmada 27/08/2026

---

## Preguntas abiertas heredadas de `Parámetros Chaumer.pdf`

El propio material del curso deja estas sin resolver. Entran a F1.1 como preguntas directas al operador:

1. **Vela de ruptura:** el curso responde en diapositiva — *"vela de ruptura sin intención"* (rompe con mecha) frente a *"vela de ruptura **con intención (con cuerpo)**"*; la tímida *"no deja de ser válida"*. Ya recogido en `R-20`. Falta si el operador exige intención para entrar.
2. **Vela de confirmación / continuación:** ¿cuál es el ideal?
3. **Preoperatoria:** cómo se marcan los volúmenes en americana vs europea, y por qué el umbral cambia de instrumento entre una y otra.
4. **Zonas entre zonas:** ¿cuál es la distancia? → El curso responde en diapositiva: *"El límite para marcar una zona entre zonas es el **50%**, mas no."* Pendiente de auditar con el operador.
5. ~~**POC:** por qué es importante marcarlo y cómo se marca.~~ → ❌ Descartado por el operador, `D-03`.
6. **Colocación de la orden:** un tick arriba o abajo del nivel de rompimiento. → ✅ Resuelto en `R-01` y `R-24`.
7. **Extensión de zona:** si una zona se marca inicialmente como resistencia, ¿solo puede extenderse en ese sentido, o si una mecha la rompe como soporte también se extiende hacia abajo?
8. **Marcado en tendencia:** cuando hay tendencia y se dan múltiples entradas, ¿cuáles zonas se marcan y cuáles no?
