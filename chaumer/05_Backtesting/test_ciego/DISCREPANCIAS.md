# DISCREPANCIAS — test ciego diario

Una entrada por día en que Claude y el operador no marcaron igual.
Los días en que coincidieron **no se escriben aquí**: se anotan en el registro y ya.

Cada diferencia es una de tres:

- **Marcamos distinto** → uno de los dos aplicó mal una regla escrita. Se dice cuál y por qué.
- 🟡 **Las reglas no cubren el caso** → esto es lo valioso. Se describe el caso con hora y precio,
  y se abre un pendiente en `01_Plan\PENDIENTES.md`.
- **Fue el motor** → la lectura a mano y el motor discreparon. Se anota para arreglarlo.

> ⚠️ Desde aquí **no se cambia ninguna regla**. Se anota y se decide con el operador aparte.

---

## Jueves 10 de septiembre de 2026

**Noticias rojas:** precios al productor, general y subyacente, 7:30. Sin evento de la Fed.
**Resultado acordado:** largo, entrada 29.145,75 a las 8:40, stop 29.105,25,
objetivo 29.186,25, riesgo 40,50 → objetivo en 8:41. **+40,50 pts (+81,00 USD).**
Gráfico: `Back_claude\2026-09-10.png`.

### 1 · Umbral de volumen del premercado — **marcamos distinto**

Marqué con el umbral vigente ese día (más de 6.000 contratos en MNQ) y salieron cuatro
soportes de premercado, todos de la reacción al dato de las 7:30: 29.195,25–29.205,50 (7:31) ·
29.153,50–29.157,50 (7:33) · 29.120,25–29.127,75 (7:35) · 29.108,50–29.110,50 (7:37).
El operador no tenía ninguno.

Uno de ellos, el de 29.120,25–29.127,75, tapaba la resistencia que deja la vela de 8:32, y por
eso no la marqué: una zona viva ocupa su franja y no admite encima otra de tipo contrario.
Todo el marcado de la mañana se desvió a partir de ahí.

La vela más fuerte de la noche fue la de 7:35 con **7.799** contratos. Con el umbral por encima
de eso, el premercado no deja ninguna zona.

**Decidido el 14/09/2026:** el umbral pasa a ser **parámetro ajustable** y se fija en
**más de 8.000 contratos en MNQ**. Queda pendiente con qué criterio medible se cambia.

### 2 · 🟡 Entrada de 8:36 — **las reglas no cubren el caso**

Con el umbral en 8.000, la resistencia de 8:32 (29.118,00–29.123,50) sí se marca, la vela de
8:36 la rompe y la de 8:37 da la consecución. El plan escrito manda tomar esa entrada:
**29.133,00, stop 29.057,75, riesgo 75,25, objetivo 29.208,25** → habría llegado a objetivo
a las 9:25, +75,25.

El operador **no la toma**. Su motivo, en sus palabras: el mercado venía lateral y esa corrida
no era fluida — no hay estructura limpia de impulso, retroceso, impulso.

Traducido a número, y confirmado por él: la corrida de 8:31 a 8:32 sube **49,50** puntos
(de 29.074,00 a 29.123,50) y el retroceso que la sigue baja **65,75** (hasta 29.057,75).
El retroceso es mayor que la corrida — es lo mismo que decir que pasó por debajo de donde
arrancó la corrida, porque los dos se miden desde el mismo extremo.

La estructura siguiente sí cumple: corrida de 8:34 a 8:37, **79,75** puntos, contra un
retroceso de **32,25** hasta 29.105,25. Su resistencia (29.125,75–29.137,50) rompe en 8:39
y se entra en 8:40. Esa es la entrada del día.

**Regla acordada el 14/09/2026 — pendiente de escribir en `01_Plan\`:** una zona cuyo retroceso
fue mayor que la corrida que la creó **sigue activa**, pero **no se entra en ese rompimiento**.
El veto es solo para esa entrada, no para la zona ni para el resto de la jornada. Se espera a la
estructura siguiente y se entra en el rompimiento de su zona. Solo aplica a continuaciones;
el reingreso no se toca.

### 3 · Motor y lectura a mano — **coinciden**

Único rompimiento sin consecución de la jornada: el de 9:25 hacia arriba. La estructura
contraria se arma en la vela de 9:30, que es la misma en que vencían las cinco velas. Los dos
caminos dan lo mismo.

La secuencia de marcado también la conté a mano: entre 8:45 y 9:19 el precio se queda dentro
del mismo tramo y no se marca nada, que es lo correcto.

### 4 · Repaso de las once sesiones de julio con la regla nueva — **no cambia ninguna**

Hecho el 14/09/2026, con el umbral viejo (>2.000 en NQ) para no mezclar los dos cambios.

| | |
|---|---|
| Registrado en el plan | **−91,00 pts en 9 operaciones** |
| Motor con la regla nueva puesta | **−91,00 pts en 9 operaciones** |

**Las once salen idénticas, día a día.** La regla vetó cuatro rompimientos —uno el 7/07, uno el
13/07, uno el 20/07 y dos más el 7/07— pero **ninguno de ellos era la operación del día**: todos
habrían quedado descartados de todas formas por el tope de riesgo o por chocar el objetivo con
una zona. El historial del plan no se toca.

### 5 · 🟡 Lo que destapó el repaso — **las reglas no cubren el caso**

Al quitar la entrada de 8:36 del 10/09, el motor se quedó sin orden en ese minuto y afloró un
**reingreso corto en la vela de 8:37** sobre esa misma resistencia: orden en 29.109,00, stop en
29.137,50. El operador **no lo tomó** — él se esperó al largo de 8:40.

Hay dos motivos por los que ese reingreso no debería existir, y **ninguno de los dos está
resuelto en el plan**:

1. **La vela de 8:37 es la vela de la consecución.** El plan dice que la vela que confirma un
   traspaso no abre a la vez el movimiento contrario, y la vela de reingreso hace de vela de
   rompimiento del reingreso. Si eso se aplica, el reingreso no puede nacer ahí. ⚠️ Pero
   aplicarlo cambia el **6 de julio** de −58,75 a −20,50, y esa sesión está validada.

2. **El orden dentro de la vela de 8:38.** Esa vela toca el nivel de la orden (29.105,25) y el
   punto del stop (29.137,50) en el mismo minuto. Es blanca, y el plan ya tiene escrito para las
   zonas que en una vela blanca el máximo llega primero. Si eso vale también para la orden, el
   precio vuelve al punto del stop **antes** de llenar y la orden se cancela. Entonces el día es
   el largo de 8:40, que es justo lo que marcó el operador.

**Lo aplicado de forma provisional en `lector.py`, marcado como PROPUESTA SIN CONFIRMAR:** el
punto 2. Es el único que reproduce a la vez las once sesiones de julio (−91,00) y el marcado
acordado del 10/09 (+40,50). El punto 1 **no** se ha aplicado.

**El mismo caso aparece el 8 de julio**, en la vela de 8:48 —blanca, toca orden y stop en el
mismo minuto—, y ahí el punto 2 es lo que sostiene el **NO OPERA** ya validado.

🔴 **Pendiente de decidir con el operador.** Hasta entonces el motor lleva una regla que él no ha
confirmado.

> ⚠️ Además, encontrado y **no arreglado**: en día de FOMC el motor no registra los rompimientos,
> y como el reingreso nace de un rompimiento que falla, **el motor no puede ver ningún reingreso
> en día de FOMC** — que es justo el único setup permitido esos días. Arreglarlo hace aparecer
> una operación el 8 de julio, así que tampoco se toca sin decidirlo.

---

## Viernes 11 de septiembre de 2026

**Noticias rojas:** inflación al consumidor, general y subyacente, 7:30. Sin evento de la Fed.
Caen antes de que abra la ventana, así que no bloquean nada.
**Umbral de volumen usado:** > 8.000 en MNQ, el vigente ese día.
**Resultado acordado: NO OPERA.** Coinciden operador y marcado.
Gráfico: `Back_claude\2026-09-11.png`.

### 1 · El día se resuelve en la primera vela — **coincidimos**

El mercado abre dentro del tramo que deja el premercado: suelo en **29.317,00**, techo en
**29.443,00**, medio en **29.380,00**. El primer movimiento de la jornada —la bajada de la
apertura hasta 29.347,25 en la vela de 8:32— arranca por encima del medio y termina por debajo.
Lo cruza, y con eso el tramo queda cerrado para el resto del día.

**En toda la sesión no se marca ni una zona.** 26 candidatas, 26 descartadas. Sin zona no hay
entrada. Es el mismo mecanismo del 14/07/2026, pero llevado a la jornada entera.

Zonas de premercado con el umbral en 8.000: 29.285,75–29.317,00 (3:25) · 29.204,50–29.246,25
(7:31, la del dato, 12.518 contratos) · 29.296,50–29.309,00 (7:32) · 29.488,25–29.500,75 (8:01) ·
29.443,00–29.452,50 (8:29).

### 2 · Motor y lectura a mano — **coinciden**

Único rompimiento que tardó en resolverse: el de las 8:47, que rompió por arriba la resistencia
de 8:29 con la mecha. La estructura contraria se arma en la vela de **8:52**, que es la misma en
la que vencían las cinco velas. Los dos caminos dan lo mismo: la zona se estira hasta 29.472,50.

### 3 · 🟡 El reingreso de las 9:01 — **regla nueva `R-41`**

A mano encontré un reingreso corto sobre la zona de premercado de 8:29: la rompió por arriba,
consiguió continuación a las 9:00, y la vela de 9:01 se la comió entera de arriba abajo.
Entrada **29.440,25**, stop **29.475,00**, riesgo 34,75, objetivo **29.405,50** → habría llegado
a objetivo a las 9:05, **+34,75 pts**.

**El operador no lo tomó, y su motivo es el que faltaba en el plan:** *"había un punto de control
en contra"*. El nivel: el mínimo de la vela de **8:58**, en **29.423,00**, que queda entre la
entrada y el objetivo.

**Regla escrita el 14/09/2026 — `R-41`:** el nivel de referencia de un retroceso es un **punto de
control**; el objetivo de un **reingreso** no puede pasar del punto de control vivo más cercano
que quede entre la entrada y el objetivo. **Solo reingresos.** Se rompe cuando una vela **CIERRA**
más allá — lo único del plan que no se lee por la mecha. Se dibuja solo cuando aparece un
reingreso, en naranja punteado y contraste bajo.

**Regresión hecha antes de escribirla:** las 11 sesiones de julio siguen en **−91,00 pts en 9
operaciones**, y **dos de esas nueve son reingresos** (6 y 13 de julio), así que el filtro se probó
donde muerde. El 10/09 tampoco cambia.

### 4 · 🔧 Dos cosas que este día deja abiertas

**`P-34` · el motor no ve reingresos sobre zonas de premercado.** No anota sus rompimientos, y el
reingreso nace de un rompimiento que falla. El de las 9:01 lo encontré a mano; el motor no lo ve
—y por eso el gráfico del día no dibuja ningún punto de control, aunque la regla ya esté puesta.
Hermano del mismo fallo: en día de FOMC tampoco puede ver reingresos, que es el único setup
permitido esos días.

**`P-35` · el reingreso sobre zona de premercado no tiene punto de referencia.** Su filtro propio
dice que el objetivo debe caber dentro del extremo del retroceso que originó la zona, y una zona
de premercado no nace de ningún retroceso. Hoy no bloqueó porque `R-41` ya lo descartó, pero
volverá.

**`P-36` · el punto de referencia y el punto de control se solapan.** Los dos son el extremo de un
retroceso y los dos tapan el objetivo del reingreso. Nadie ha decidido si uno sobra.

---

## Lunes 14 de septiembre de 2026

**Sin noticias rojas. Sin Fed.** Premercado sin una sola zona: la vela más fuerte de la noche hizo
4.407 contratos, muy por debajo del umbral de 8.000.
**Resultado acordado: NO OPERA.** Coinciden operador y marcado.
Gráfico: `Back_claude\2026-09-14.png`.

### 1 · Lo que marqué primero, y por qué estaba mal

La apertura declara bajista: de 28.905,75 a 28.885,75. Marqué dos zonas —el soporte de 8:32 y la
resistencia de 8:34— y di por buena la entrada larga del rompimiento de la resistencia a las 8:45,
en 28.945,00, riesgo 64,50, objetivo alcanzado a las 8:49. **+64,50 pts.**

**El operador dijo que no**, y tenía razón: *"la vela al nacer bajista, uno esperaría un IRI
bajista, pero cuando el retroceso fue mayor que la corrida bajista, se genera zona de resistencia,
y no se debería ingresar en un rompimiento directo; se debe esperar otro IRI superando esa
resistencia."*

Mi error fue de **emparejamiento**, no de cálculo. La regla escrita comparaba cada corrida con el
movimiento que venía **después**. Para la resistencia de 8:34 eso daba **53,25 contra 53,25** — un
empate exacto al tick, y la entrada pasaba el filtro por un pelo. La lectura buena compara el
retroceso con **la corrida que viene justo antes**: **53,25 contra 43,50**. Se pasa, y esa
resistencia no se opera.

🔑 Sin ese empate al tick, el fallo de emparejamiento habría seguido escondido.

### 2 · 🔴 Obligó a corregir una sesión ya validada

Al arreglar el emparejamiento, **cinco de las once sesiones de julio cambian de marcado**, y una de
ellas estaba dada por buena desde el 01/09: el **16 de julio**, un corto que ganaba 75,50 puntos.

Se lo enseñé con el gráfico completo delante y lo revisó: *"efectivamente está mal esa entrada,
porque no fue un IRI bajista fluido; primero empezó alcista, y luego fue bajista. Esa primera
entrada fue arriesgada, se debe esperar que genere otro IRI bajista."*

| | Antes | Después |
|---|---|---|
| Julio, 11 sesiones | −91,00 pts en **9** operaciones | **−77,75 pts en 5** |

Se caen el 7, el 9, el 16 y el 20; el 17 cambia de operación. Quedan intactos el 6, el 10, el 13 y
el 15. La tabla vieja se conserva entera en `GALERIA.md`, debajo de la nueva.

> ⚠️ **El total mejora poco y de casualidad.** La regla quita dos perdedoras grandes, pero también
> las dos ganadoras más grandes de julio. Lo que hace de verdad es **operar casi la mitad de días**.

### 3 · La regla que salió: CORRIDA FLUIDA

Reescrita entera ese día, con el término que puso el operador. Una corrida es fluida cuando la
secuencia sale bien **tres veces seguidas**: la corrida deja su zona · el retroceso **no se pasa**
· y la corrida siguiente **rompe** esa zona. Dos formas de fallar —el retroceso se pasa, o la
siguiente no es capaz de romper— y una sola recuperación: **esperar otro IRI que deje una zona
nueva entera más allá de la bloqueada.**

Comprobado contra los cuatro días sobre los que el operador ha decidido —10, 11 y 14 de septiembre
y 16 de julio—: los cuatro salen solos, sin excepciones.

### 4 · Motor y lectura a mano — coinciden

Un único rompimiento hasta donde habría estado el llenado, el de 8:44, con continuación en la vela
siguiente. Nada que resolver por el plazo de las cinco velas.

---

# Martes 15 de septiembre de 2026 — coincidimos en la entrada · una zona de más

**Sin noticias rojas. No es día de reunión de la Fed.**

**Veredicto del día: IRI corto, −23,25 pts = −46,50 USD.** El operador y el marcado a ciegas dan
**la misma operación**, con los mismos cuatro números.

| | |
|---|---|
| Dirección de la vela de apertura | **bajista** (8:31, abre 29.421,00 · cierra 29.414,00) |
| Premercado | **sin zonas** — la vela más fuerte del barrido hizo 5.629, por debajo del umbral de 8.000 |
| Entrada | corto, orden colocada tras la vela de 9:14 · se llena en la de **9:15** en **29.340,00** |
| Stop | **29.363,25** — el máximo del último retroceso |
| Objetivo | **29.316,75** · riesgo **23,25 pts** |
| Resultado | **STOP a las 9:19** · −23,25 pts |

Antes de esa entrada el día descartó tres cosas, todas bien: una orden de corto a las 8:35 que se
canceló a las 8:37 sin llenarse, y **dos rompimientos de resistencia, a las 8:37 y a las 8:46, que
no se operaron** — el día nació bajista, así que esas resistencias vienen de retrocesos y no de una
corrida limpia.

> Estuvo a medio punto de salvarse: en la vela de 9:17 el máximo llegó a 29.362,75 y el stop estaba
> en 29.363,25.

---

## 🔧 La diferencia: FUE EL MOTOR

**La zona apéndice nunca pasaba por el filtro de la banda.**

El operador lo vio en el gráfico: *"porque se graficó la resistencia que deja la vela de las 9:09,
si una de las reglas es que entre zonas solo se puede generar una sola zona. Entre el soporte
estirado que dejó la vela de las 08:35 y la resistencia estirada de la vela de las 08:46 ya no
pueden graficarse zonas, porque entre esas dos zonas había una zona que pasó a ser inactiva."*

La banda es **29.379,25 ↔ 29.432,00** —del techo del soporte al piso de la resistencia— y su turno
ya estaba gastado por la resistencia que quedó inválida. La apéndice 29.384,75 – 29.388,00 cae
dentro. No se dibuja.

### El motor se contradecía a sí mismo

Lo que quedó en el registro de la jornada, sobre **el mismo rectángulo**:

```
9:10  confirma retroceso → zona R 29384.75-29388.00 sobre 9:09   [rango_usado]
9:14  plazo vencido      → ZONA APÉNDICE R 29384.75-29388.00 sobre 9:09
```

Rechazada como zona por banda gastada, y dibujada cuatro velas después como apéndice. La causa:
la apéndice se añadía **directamente**, saltándose la función que aplica el filtro de la banda.
Todas las demás zonas sí pasan por ahí.

### No era un caso aislado

La misma contradicción —mismo rectángulo rechazado y luego dibujado— aparece en **las tres jornadas
anteriores del test ciego**:

| Jornada | apéndices que dibujaba | que sobreviven al arreglo |
|---|---|---|
| 10 de septiembre | 2 | **0** |
| 14 de septiembre | 1 | **0** |
| 15 de septiembre | 2 | **1** |

La única que sobrevive es la del soporte de 9:13 roto hacia abajo: esa cae **fuera** de la banda,
que es el único sitio donde una apéndice puede nacer.

### Lo que se arregló

`lector.py` · la apéndice pasa ahora por el mismo filtro de banda que cualquier otra zona.

> ✅ **Regresión limpia. No cambia ningún resultado.** Julio sigue en **−77,75 pts en 5
> operaciones** y las cuatro jornadas de septiembre dan la misma entrada y el mismo desenlace.
> Solo desaparecen zonas del dibujo.

### Y cierra de paso una duda que estaba abierta

Quedaba sin decidir si un **cruce de vuelta** —el precio traspasa una zona, vuelve y la cruza por el
otro lado— puede hacer nacer una apéndice. Se habían encontrado seis casos. **Todos caían dentro de
bandas ya resueltas**, así que la regla de la banda los mata sin necesidad de decidir nada sobre el
cruce. La duda se queda sin objeto.

---

## Los otros dos agujeros conocidos, revisados a mano

**El plazo resuelto antes de tiempo.** El motor espera siempre a la quinta vela. El estiramiento del
soporte de 8:32 debió ocurrir en la vela de **8:39** y no en la de 8:40: el mercado ya había armado
la estructura al contrario —8:36 sube, 8:38 retrocede sin pasarse, 8:39 vuelve a subir—. **La zona
queda exactamente igual**, 29.371,75 – 29.379,25, así que no cambia nada del día. El agujero sigue
abierto.

**La secuencia de la jornada.** Comprobada a mano: la apertura deja la banda 29.379,25 ↔ 29.432,00
con una sola zona dentro; el techo se traspasa a las 8:40 con rompimiento y consecución, lo que abre
la banda de arriba; y de ahí sale el escalón bajista de la mañana. Con el arreglo de la apéndice, el
marcado del día respeta la secuencia entera.

---

# Miércoles 16 de septiembre de 2026 — coincidimos: NO OPERA · día de Fed

**Reunión de la Fed. Noticias a la 1:00 de la tarde** —tipos, proyecciones, comunicado y rueda de
prensa—, casi tres horas después de que cierre la ventana. **No tocan la sesión.**

**Veredicto: NO OPERA.** Coincidimos con el operador.

| | |
|---|---|
| Dirección de la vela de apertura | **alcista** (8:31, abre 29.386,75 · cierra 29.415,00) |
| Premercado | **sin zonas** — la vela más fuerte hizo 6.963 |
| Zonas | 7 · resistencias en 29.415,00–29.421,75 · 29.467,50–29.477,75 · 29.479,25–29.482,75 · 29.511,00–29.514,50 · 29.529,00–29.536,25 · soportes en 29.373,00–29.386,25 y 29.453,25–29.466,75 |

**Hubo tres reingresos, y los tres se descartan:**

| Hora | Entrada | Objetivo | Por qué se cae |
|---|---|---|---|
| 8:46 | 29.400,75 | 29.366,75 | el soporte 29.373,00–29.386,25 está en medio |
| 9:00 | 29.462,50 | 29.443,50 | el soporte 29.453,25–29.466,75 está en medio |
| 10:09 | 29.508,50 | 29.487,50 | el objetivo se pasa del punto de referencia 29.491,75 |

> 🔵 **La regla de la Fed se ganó el sueldo.** Sin ella, a las 8:56 salía un largo en 29.480,00 con
> stop en 29.453,25, se llenaba a las 9:00 y moría en stop a las 9:03: **−26,75 puntos**.

---

## 🔧 FUE EL MOTOR · el motor está ciego los días de Fed

**Corrido tal cual, el motor devuelve CERO setups.** No porque no los hubiera —había tres— sino
porque **no puede verlos**.

La causa: el motor solo anota un rompimiento cuando está evaluando entradas de continuación. En día
de Fed esas entradas están apagadas, así que **no anota ningún rompimiento**, y sin rompimiento
anotado no existe ningún reingreso que evaluar.

Los tres reingresos de la tabla salieron con una variante de auditoría que anota los rompimientos
pero nunca manda orden de continuación — que es exactamente lo que debería hacer el motor en día de
Fed.

> 🔴 **Es el agujero que ya estaba declarado, y ésta es la primera jornada que depende ENTERA de él.**
> Hasta hoy solo afectaba a las zonas de premercado. No se ha tocado: arreglarlo hace aparecer una
> operación en el **8 de julio**, una sesión validada como NO OPERA, así que hay que decidirlo aparte.

## 🟡 LAS REGLAS NO CUBREN EL CASO · el reingreso de una sola vela

**Los tres reingresos de hoy son "de una sola vela":** la consecución y la vuelta al interior de la
zona caen en la **misma** vela, y las tres son velas azules.

Con la convención intravela que el plan ya usa para las zonas —vela azul, mínimo primero—, en las
tres la vuelta ocurrió **antes** que la consecución. Si esa convención vale también aquí, los tres
se caen antes incluso de mirar el objetivo.

Hoy da lo mismo porque los tres estaban descartados por otro lado. **El día que uno de esos sea el
único setup de la jornada, hay que tener decidido si se opera o no.** Sin decidir.

---

# Jueves 17 de septiembre de 2026 — coincidimos · el día entero cuelga de un tick

**Sin noticias rojas. No es día de Fed.**

**Veredicto: IRI corto, −33,75 pts = −67,50 USD.** Coincidimos con el operador, con los mismos
cuatro números.

| | |
|---|---|
| Dirección de la vela de apertura | **bajista** (8:31, abre 29.717,75 · cierra 29.717,50) |
| Premercado | **sin zonas** — la vela más fuerte hizo 6.459 |
| Zonas | soporte **29.641,00 – 29.641,50** (vela 8:35) · resistencia **29.654,75 – 29.667,50** (vela 8:37) |
| Entrada | corto · orden tras la vela de 8:37 · se llena en la de **8:38** en **29.633,75** |
| Stop | **29.667,50** · Objetivo **29.600,00** · riesgo **33,75 pts** |
| Resultado | **STOP a las 8:48** · −33,75 pts |

El mercado abre cayendo **96,75 puntos** hasta las 8:35 y rebota solo **26,50** — corrida limpia,
retroceso corto—, y la vela de 8:37 vuelve a romper el suelo. Entrada de continuación de manual.

> ⚠️ **Cruel por los dos lados.** En la vela de 8:39 el precio bajó a 29.605,75 y se quedó a **5,75
> puntos** del objetivo. Luego se dio la vuelta y a las 8:48 subió a 29.669,50, **2,00 puntos** por
> encima del stop.

---

## 🟡 LAS REGLAS NO CUBREN EL CASO · la jornada la decide un tick

**La vela de apertura tiene un cuerpo de UN TICK.** Abre en 29.717,75, cierra en 29.717,50, con
16.049 contratos. Eso es lo único que declara la jornada bajista — y de esa declaración sale todo
lo demás: con el día bajista, la caída de la apertura es una **corrida** y su rebote un
**retroceso**, la corrida sale limpia, y la entrada es válida.

Probado al revés, cambiando solo el cierre de esa vela:

| La vela de 8:31 cierra… | El día |
|---|---|
| **un tick por debajo** *(lo que pasó)* | **corto, −33,75 pts** |
| **exactamente igual** | el plan se detiene — vela base sin cuerpo |
| **un tick por encima** | **NO OPERA** |

Con el día alcista la caída de la apertura pasa a ser un retroceso, romper ese soporte pasa a ser un
rompimiento directo contra la estructura y el filtro de corrida fluida lo tumba. Los dos reingresos
que aparecen en su lugar se caen los dos por objetivo tapado.

**Tres ticks de diferencia en la vela de apertura separan tres jornadas distintas.** No es que la
regla esté mal: es que hoy cayó justo en el filo, y conviene saber si eso se acepta tal cual o si la
vela base necesita un cuerpo mínimo para declarar dirección. Sin decidir.

---

## Tareas de mantenimiento despachadas el 17/09/2026

- **La fecha de la reunión de la Fed del 16/09 queda grabada** en el motor. Hasta hoy estaba puesta a
  mano solo para marcar: quien volviese a correr ese día habría visto el largo de las 9:00 con su
  pérdida.
- **Regenerados los gráficos del 10 y del 14** en `Back_claude`. Estaban dibujados con el motor viejo
  y mostraban zonas apéndice que el filtro de la banda ya no permite.
- ✅ Regresión tras las dos cosas: julio sigue en **−77,75 pts en 5 operaciones** y las jornadas de
  septiembre no se mueven.

---

# Viernes 18 de septiembre de 2026 — marcamos distinto, y de tres maneras

**Sin noticias rojas. No es día de Fed.**

**Veredicto final: IRI corto, +31,00 pts = +62,00 USD.** El operador y el auditor acaban en la misma
operación, pero el auditor llegó dando tres rodeos y hubo que deshacerlos uno a uno.

| | |
|---|---|
| Dirección de la vela de apertura | **bajista** (8:31, abre 29.814,75 · cierra 29.813,75) |
| Premercado | **una zona** — la vela de las 07:29 hizo **8.658** contratos, alcista → resistencia **29.796,75 – 29.808,75** |
| Entrada | corto · rompe la vela de 8:55 · se llena en la de **8:56** en **29.774,75** |
| Stop | **29.805,75** · Objetivo **29.743,75** · riesgo **31,00 pts** |
| Resultado | **TARGET a las 9:03** · +31,00 pts |

---

## 1 · 🔧 FUE EL MOTOR · el rompimiento de la zona de premercado se vio 19 velas tarde

La zona de premercado se rompió **con cuerpo en la vela de 8:30** y tuvo su consecución en la de
**8:31**. Las dos ocurren **antes de que abra la ventana**.

El motor solo recorre velas desde las 8:31, así que no vio el rompimiento y lo situó en la vela de
**8:32**, con la consecución en la de **8:41** — diecinueve velas después de lo que pasó de verdad.
El auditor arrastró ese error a la conversación.

## 2 · Marcamos distinto · lo de las 8:49 no es reingreso ni continuación operable

Con la corrección de arriba, el auditor propuso un **reingreso corto** a las 8:50, entrada 29.793,50,
stop 29.845,25, riesgo 51,75 → objetivo alcanzado, +51,75 pts.

El operador lo corrigió en dos pasos:

**Primero, la etiqueta.** No es reingreso. La zona nació resistencia, quedó traspasada hacia arriba
antes de abrir, y **desde ahí trabaja como soporte** — que es lo que el glosario ya recoge con sus
propias palabras: *"se convierte en soporte al ser superada"*. Romperla hacia abajo es romper un
soporte. *(Los cuatro números salían iguales por los dos caminos: el stop del reingreso —techo del
rompimiento fallido— y el de la continuación —extremo alcanzado desde que nació la zona— son el mismo
punto, 29.845,25.)*

**Y después, lo de fondo: ese rompimiento no se opera.** Palabras del operador: *"operativamente por
regla cumple, sin embargo no es una corrida limpia porque el mercado está lateral; ese soporte ya se
había tratado de romper antes, pero no fue capaz. Hay que esperar que el mercado rompa esa zona, haga
otro IRI, y se ingresa en ese otro."*

### 🟡 El paso a paso que dio el operador — pendiente de redactar como regla

1. La vela de apertura declara el sentido. Se espera corrida, retroceso normal, y la corrida
   siguiente rompiendo la zona.
2. **El retroceso se pasa de la corrida → se pierde la fluidez y se acaban las entradas EN ESE
   SENTIDO.** No en esa zona: en el sentido. Aquí pasa en la vela de **8:32** — corrida de 29,00
   contra retroceso de 38,00.
3. Se espera a que la zona se rompa **con consecución**. Aquí, 8:49 y 8:50. **Ese rompimiento no se
   opera nunca** — es el *rompimiento directo*.
4. Desde ahí se cuenta un **IRI nuevo entero por debajo**: corrida que deja zona, retroceso que la
   confirma, rompimiento y consecución. **Se entra en ése** — la entrada de las 8:56.

> 🔵 **Dos respuestas más del operador, el 19/09:** la fluidez **se puede volver a perder** si el
> siguiente IRI tampoco es fluido —hay que esperar otro—, y el bloqueo es **solo del sentido del
> día**, no toca el contrario.

**Lo que falta:** la regla de la corrida fluida está escrita **zona por zona**, y hay que reescribirla
como bloqueo **de sentido**. Y hay que decir qué pasa con las zonas que **no tienen corrida detrás**
—las de premercado—, que hoy se quedan fuera del filtro y por eso se operaban. Texto pendiente de
redactar y confirmar.

> ⚠️ **El auditor se fue por el camino equivocado buscando un número que no hacía falta.** Propuso
> medir *cuántas veces* el precio visita el borde sin romperlo. Sobra: el bloqueo no empieza cuando el
> mercado ya lleva un rato lateral, empieza en la **segunda vela de la sesión**, y eso ya es medible
> con lo que hay escrito.

## 3 · 🔧 FUE EL MOTOR · la resistencia de 8:54, dentro de una banda ya gastada

El auditor marcó una resistencia de **29.804,75 – 29.805,75** sobre la vela de 8:54. No debía
marcarse: cae dentro de la banda que ya había gastado su turno con la zona de premercado.

`R-17` ya lo decía en su punto 5 desde el 27/08. Lo que fallaba era el motor —contaba el turno solo
sobre las zonas **vivas**— y la frase de `R-21`, *"inválida es inválida, no cuenta para NADA"*, que
empujaba en sentido contrario.

**Corregido el 19/09/2026:** punto 8 nuevo en `R-17` y `R-21` matizada — *deja de valer como zona; no
deja de ocupar el sitio*. Alcance confirmado por el operador con gráfico delante: **se cierra la
banda entera**, no solo el rectángulo de la zona muerta.

✅ **Regresión:** se caen **3 zonas** en las 18 sesiones marcadas —10/07 a las 8:56, 10/09 a las 9:07 y
18/09 a las 8:54— y **ningún resultado cambia**. Julio sigue en −77,75 pts en 5 operaciones.

---

## Lo que deja la jornada

- ✅ **Escrito:** la banda gastada no se reabre (`R-17` punto 8 · `R-21` matizada · motor ajustado).
- ✅ **Escrito el 21/09/2026:** la regla del **rompimiento directo** y la fluidez como bloqueo **de
  sentido**, con los cuatro pasos de arriba (`R-40` ampliada · término nuevo en el glosario).
- 🔴 **Sigue abierto** el agujero del premercado en el motor: no anota los rompimientos de esas zonas,
  y encima los que ve los sitúa mal porque no mira las velas anteriores a la apertura.

