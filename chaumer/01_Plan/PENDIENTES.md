# PENDIENTES

Reglas sin cerrar y decisiones aplazadas.

> Actualizado: 2026-09-23 · 🏁 fase 1 cerrada · 🔴 **test ciego EN MARCHA** — **40 reglas** · 24 términos · 13 desviaciones · **37 pendientes abiertos o cerrados** · numeración libre a partir de `P-38`
>
> 🚨 **Los cuatro huecos declarados del cierre:** ~~`P-29` test ciego no ejecutado~~ → **arrancó el 14/09/2026, primera jornada marcada: 10/09** · `P-21` sin regla de parada · falta la capa de contextualización · `P-27` las cifras del backtesting no miden la estrategia.

---

## Abiertos

### 🔧 P-34 · El motor no registra los rompimientos de las zonas de premercado — NUEVO 14/09/2026
- **Qué pasa:** en `lector.py`, el rompimiento de una zona solo se anota dentro del bloque de continuación, que exige que la zona venga de una corrida. Las zonas de premercado no vienen de ninguna, así que **su rompimiento no se anota nunca** y, como el reingreso nace de un rompimiento que falla, **el motor no puede ver jamás un reingreso sobre una zona de premercado**.
- **Contradice a `R-15`**, que dice que la zona de premercado se comporta *exactamente igual* que cualquier otra.
- **Detectado el 11/09/2026:** el reingreso de las 9:01 lo encontré a mano; el motor no lo ve.
- **Hermano del mismo fallo:** en día de FOMC pasa lo mismo por otra vía — el bloque de continuación se salta entero, así que tampoco se anotan rompimientos y **el motor no puede ver ningún reingreso en día de FOMC**, que es justo el único setup permitido esos días. Arreglarlo hace aparecer una operación el **8 de julio**, sesión ya validada como NO OPERA, así que **no se toca sin decidirlo con el operador**.
- **Estado:** ⏳ pendiente. No bloquea operar — bloquea el backtesting.


### 🚨 P-21 · No existe regla de parada — HUECO DECLARADO
- **Estado:** el operador confirma el 24/08/2026 que **no tiene ninguna regla de parada**, y decide dejarlo abierto a propósito para decidirlo con datos reales.
- **Lo que NO existe en el plan:** límite de pérdida semanal · límite mensual · corte tras racha de pérdidas · reducción de tamaño en drawdown.
- **Aritmética, con `STOP_MAX` = $160 fijos sobre $3.000:**

  | Días malos seguidos | Pérdida | Capital | Caída | Para recuperar |
  |---|---|---|---|---|
  | 4 | $640 | $2.360 | −21 % | +27 % |
  | 6 | $960 | $2.040 | −32 % | +47 % |
  | 10 | $1.600 | $1.400 | **−53 %** | **+114 %** |
  | 15 | $2.400 | $600 | −80 % | +400 % |

- **Lo esencial:** **ninguna regla del plan se rompe en esa tabla.** Cada día fue un setup válido, con su stop correcto, ejecutado como está escrito. El plan permite ese recorrido sin emitir una sola señal de alarma.
- **Frecuencia esperada:** con win rate 50 % y una operación al día, una racha de **6 pérdidas seguidas aparece en ~5 meses de operativa con probabilidad cercana al 50 %**. No es un caso extremo: es lo normal.
- **Tres factores que lo agravan en este plan concreto:**
  1. `R-28` — **una operación al día**: la recuperación es lenta por diseño.
  2. `RATIO_TARGET` **1:1** — hace falta >50 % de aciertos solo para no perder (`P-12`).
  3. `R-04` + `STOP_MAX` fijo — **el riesgo porcentual CRECE cuando la cuenta cae.** Con $1.400 restantes, $160 dejan de ser el 5 % y pasan a ser el **11 %**.
- **Moldes ofrecidos y no adoptados** *(el auditor no propuso cifras)*: parada por rachas (*N días perdedores seguidos → parar*) o por capital (*caída de X % desde máximo → parar y revisar*).
- **Acción pendiente:** decidir con datos reales del registro.
- **Sub-fase:** F1.10, o antes si el operador quiere cerrarlo.

### ✅ P-20 · Dónde termina "la apertura" — **CERRADO 23/09/2026**
- ✅ **CERRADO 23/09/2026 por decisión del operador.** La etiqueta Apertura desaparece: el setup es **Continuación**, alcista o bajista. No queda nada que clasificar.
- **Origen:** `IRI Apertura` vs `IRI Continuación` (24/08/2026).
- **Situación:** las dos tienen **la misma mecánica**. La etiqueta no cambia ninguna condición de entrada, stop ni target.
- **Lo que falta:** el número de velas o la hora en que deja de ser "apertura".
- **Por qué NO bloquea:** solo afecta a cómo se **clasifica** una operación ya ejecutada, para estadística.
- **Sub-fase:** F1.9 o F1.10

### P-01 · Mín/máx de premercado eliminado como filtro de target
- **Origen:** `Guia_Sesion_Chaumer_NQ_v4.pdf`, filtro de no-entrada #5 y Error 2 (lunes 27/04/2026).
- **Decisión del operador (21/08/2026):** se elimina. Motivo dado: *"solo me pasó 1 o 2 veces, de resto no me pasó más"*.
- **Base de la decisión:** recuerdo del operador. **No hay registro ni conteo.**
- **Riesgo asumido:** se retira una regla que el propio operador escribió tras una pérdida documentada, sin datos que la contradigan.
- **Acción pendiente:** revalidar con datos reales. Contar sobre N sesiones cuántas veces el mín/máx de premercado frenó el precio antes del target.
- **Sub-fase:** F1.10 (o Fase 3, backtesting)

### P-03 · Reglas externas de la cuenta Apex (evaluación 50k)
- **Situación:** el plan se escribe para una cuenta propia de **$3.000 USD** que aún no existe. Mientras tanto el operador ejecuta una **evaluación de fondeo Apex de $50.000**.
- **Problema:** dos regímenes de riesgo distintos, y hoy se ejecuta en el segundo. Un plan correcto para $3.000 puede reventar la evaluación de Apex por reglas externas no documentadas.
- **Datos que faltan:** drawdown máximo total, pérdida máxima diaria, si el drawdown es estático o trailing, número máximo de contratos, regla de consistencia, horarios prohibidos, hora de cierre forzoso.
- **Acción pendiente:** anexo de reglas Apex y decisión sobre qué régimen gobierna la ejecución actual.
- **Sub-fase:** F1.7

### P-07 · Sesión sin hora de cierre garantizada
- **Situación:** R-30 permite que una posición abierta a las 11:29 ET corra sin límite horario hasta stop o target.
- **Acción pendiente:** confirmar compatibilidad con la disponibilidad real del operador frente a la pantalla. Si no lo es, definir un corte por tiempo.
- **Nota:** interactúa con `P-03` — algunas prop firms fuerzan el cierre de posiciones a una hora determinada.
- **Sub-fase:** F1.6

### P-08 · Riesgo por operación vs capital — ACTUALIZADO 24/08/2026
- **Valor real, confirmado por el operador:** **`STOP_MAX` = 80 puntos = 320 ticks = $160** en MNQ.
- **Corrección:** este pendiente decía **$120 = 4,0 %**, cifra que el auditor había heredado de la guía v4. **El tope real del operador siempre fue 80 puntos.** Ver la nota de corrección del ATM en el plan.
- **Sobre la cuenta objetivo de $3.000:**

  | | |
  |---|---|
  | Riesgo por operación | **$160** |
  | Porcentaje del capital | **5,3 %** |
  | Pérdida máxima diaria (`R-28`: 1 operación) | **5,3 %** |
  | Cuatro sesiones perdedoras seguidas | **−21 %** |

- **Estado:** **aceptado explícitamente por el operador el 24/08/2026**, con el número delante.
- **Lo que sigue faltando:** no existe **límite de pérdida semanal**, ni **regla de corte tras racha**, ni escalado del tamaño con el capital.
- **Sub-fase:** F1.7

### P-09 · Ventana de exposición manual tras el llenado — RIESGO ACEPTADO
- **Situación:** entre el llenado de la orden y el ajuste manual del stop, la posición corre con el stop por defecto de la ATM: **`ATM_DEFECTO` = 320 ticks = 80 pts = $160**.
- **Estado:** **aceptado explícitamente por el operador** (21/08/2026). Está acotado al tope de riesgo, nunca por encima.
- **Alternativa descartada:** fijar los ticks exactos en la ATM antes de enviar la orden. El dato es calculable al cierre de la vela de rompimiento (`entrada − mínimo del retroceso`), pero el operador prefiere el ajuste manual posterior.
- **Mejora del 24/08/2026:** con `ATM_DEFECTO` = `STOP_MAX`, el stop provisional ya **nunca es más ajustado que el estructural**. Desaparece el riesgo de salir de una operación viva durante esta ventana; solo queda el riesgo de perder más de lo estructural si el precio va en contra muy rápido.
- **Señal de alarma a vigilar en el registro:** stops de exactamente **$160** en setups cuyo stop estructural era menor. Si aparecen, esta ventana está costando dinero y hay que reabrir el punto.
- **Sub-fase:** F1.6 / revisión continua

### P-10 · Nombre de la conexión de datos
- **Falta:** el proveedor concreto seleccionado en el menú de conexión de NT8 (Rithmic / Tradovate / Continuum / Kinetick).
- **Por qué importa:** el umbral de ≥2.000 contratos es un número absoluto. Aunque el volumen de futuros lo reporta el CME y es prácticamente idéntico entre feeds, queda documentado para reproducibilidad.
- **Sub-fase:** F1.0 (rellenar cuando el operador lo tenga a mano)

### P-12 · El retroceso se queda sin tamaño mínimo — coste no cuantificado
- **Decisión del operador (21/08/2026):** el retroceso **no tiene tamaño mínimo**. Esto anula el suelo del rango `$40–$120` de `Guia_Sesion_Chaumer_NQ_v4.pdf`; solo sobrevive el techo `STOP_MAX` = **80 puntos = 320 ticks = $160** (`R-31`, `PARAMETROS.md`).
- **Consecuencia aritmética:** con R:R 1:1 la comisión es un coste fijo y la ganancia no. Cuanto menor el retroceso, mayor el peaje proporcional. Win rate necesario **solo para no perder dinero**, asumiendo ~$1,50 ida y vuelta por MNQ y **sin slippage**:

  | Retroceso | Ticks | Riesgo | Win rate de equilibrio |
  |---|---|---|---|
  | 5 pts | 20 | $10 | **57,5 %** |
  | 10 pts | 40 | $20 | 53,8 % |
  | 20 pts *(antiguo suelo de la guía)* | 80 | $40 | 51,9 % |
  | 40 pts | 160 | $80 | 50,9 % |
  | 60 pts | 240 | $120 | 50,6 % |
  | **80 pts** *(`STOP_MAX`)* | 320 | **$160** | **50,5 %** |

  Fórmula: `win_rate_equilibrio = 0,5 + comisión / (2 × riesgo)`
- **Observación:** el `$40` de la guía v4 cae justo donde el peaje baja del 52 %. Puede que no fuera un número arbitrario.
- **Riesgo añadido:** la entrada es **Stop Market** (`R-24`). 1 tick de slippage = $0,50, otro 5 % sobre un target de $10.
- **Suelo porcentual descartado:** el curso propone 23,60% de Fibonacci como mínimo y 76,40% como máximo. El operador lo omite → `D-01`.
- **Acción pendiente:** el operador debe aportar su **comisión real ida y vuelta por contrato MNQ**. Con esa cifra se recalcula la tabla.
- **Sub-fase:** F1.5 / F1.7

---

## DESVIACIONES CONSCIENTES respecto al material del curso

> Este plan **no es "Chaumer como se enseña"**. Es **"Chaumer como lo opera Christian"**. Lo siguiente aparece en `00_Guias\Parámetros Chaumer.pdf` y el operador ha decidido **no aplicarlo**. Queda registrado para que ninguna sesión futura lo reintroduzca por su cuenta.

### D-01 · Retroceso medido con Fibonacci — DESCARTADO
- **El curso dice**, en cuatro diapositivas (Reingreso, Giro, Patrón de apertura): *"El retroceso mínimo debe ser del **23,60% de Fibonacci**"* y *"si el retroceso sobrepasa el **76,40%** de Fibonacci, la entrada se anula"*.
- **El operador:** no usa Fibonacci, por lo tanto no lo tiene en cuenta. Instrucción expresa de omitirlo.
- **Consecuencia:** el retroceso no tiene tamaño mínimo ni máximo porcentual. Solo el techo absoluto de 320 ticks (`R-31`). Ver `R-06` y `P-12`.
- **Efecto colateral:** `R-03` (gráfico limpio, solo Volume Up Down) se mantiene sin cambios — no hace falta la herramienta Fibonacci.

### D-03 · Punto de control (POC) como filtro de target — DESCARTADO
- **El curso dice**, en Giro y Reingreso: *"Nuestro target no debe sobrepasar un punto de control"*.
- **El operador:** no usa POC.
- **Consecuencia:** el filtro de target queda con **zona vigente** (`R-21`) y, solo en Reingreso, **punto de referencia** (`R-26`).

### D-04 · Zona crítica — DESCARTADA
- **El curso dice**, diapositiva "Apertura / Inicio de sesión": *"Cuando el precio comienza con la primera vela genera un mínimo o máximo que… marcamos como una **zona crítica** con una línea. Por lo tanto la contemplamos y **no entramos en esa zona si el target necesita superarla**."* Añade el **inicio del impulso** y los **máximos/mínimos de la sesión europea** como zonas críticas equivalentes.
- **El operador:** no usa **ninguna** de las tres.
- **Consecuencia:** el término "zona crítica" **queda fuera del glosario** y su filtro de target desaparece.
- **Nota:** el propio curso marca esa diapositiva con *"(Evaluar bien esto y modificarlo si es necesario)"*.

### D-13 · El Giro como tipo de entrada — DESCARTADO
- **El curso lo enseña** con regla propia: *"entre el break a favor y el break en contra deben haber 4 velas, siendo el giro la 5ª"*.
- **El operador (24/08/2026):** *"Giro fuera del plan"*. Solo opera **IRI** y **Reingreso** *(desde el 23/09/2026 el setup IRI se llama **Continuación**)*.
- **Corrección del auditor:** yo tenía inventariados **4 tipos de entrada** (Continuación, Reingreso, Giro, Patrón de Apertura). Son **2 familias y 2 mecánicas**. El "Patrón de Apertura" no era una familia aparte: es `IRI Apertura`.
- **Riesgo:** ninguno. Es una entrada que no ejecuta.

### D-12 · Sesión europea — DESCARTADA
- **El curso la usa** para marcar zonas críticas en sus máximos y mínimos (`D-04`).
- **El operador (24/08/2026):** *"borrar"*. No la mira para nada.
- **Coherente con `D-04`:** las zonas críticas ya estaban descartadas; su fuente europea cae con ellas.
- **Consecuencia operativa:** el plan solo mira **premercado** (`R-15`, desde Tokio) y **ventana americana** (`R-02`). Ninguna sesión intermedia genera nada.

### D-11 · Fractal y manipulación — TÉRMINOS DESCARTADOS
- **El curso los usa.** El operador (24/08/2026): *"no uso esos términos"*.
- **Efecto:** salen del glosario. Con esto son **seis** elementos del curso fuera del plan: Fibonacci (`D-01`), POC (`D-03`), zona crítica (`D-04`), alto/bajo de sesión (`D-05`), zona de desequilibrio (`D-10`), fractal y manipulación (`D-11`).
- **Riesgo:** ninguno identificado. Vocabulario, no mecánica.

### D-05 · Alto y bajo de la sesión como filtro de target — DESCARTADO
- **El curso dice**, sección "Parámetros operativos": *"Evitar entradas cuyo target sobrepase el alto o bajo de la sesión… tienden a ser zonas de fuerte rechazo"*. Y la guía v4 lo lista como filtro de no-entrada #4.
- **El operador:** no lo usa.

---

## 🚨 CONSECUENCIA ACUMULADA · el plan se queda con UN SOLO filtro de target

Entre `P-01`, `D-03`, `D-04` y `D-05`, la lista de filtros de target del material original ha pasado de **cinco a uno**:

| Filtro de target | Origen | Estado |
|---|---|---|
| El target penetra o toca una **zona vigente** | Guía v4 + curso | ✅ **Único superviviente** — `R-21` |
| El target supera el **mín/máx del premercado** | Guía v4, filtro #5 (nacido del Error 2 del 27/04) | ❌ `P-01` |
| El target sobrepasa un **punto de control (POC)** | Curso, Giro y Reingreso | ❌ `D-03` |
| El target necesita superar la **zona crítica** | Curso, Apertura | ❌ `D-04` |
| El target supera el **alto o bajo de la sesión** | Guía v4 filtro #4 + curso | ❌ `D-05` |

**Ninguna de las cuatro eliminaciones se apoya en datos.** Todas son decisiones por criterio del operador.

**Por qué queda registrado así de visible:** el target es la mitad del R:R en una estrategia 1:1. Si en el futuro aparece el patrón *"llego cerca del target y el precio se da la vuelta"*, **esta tabla es el primer sitio donde mirar**. No es un reproche — es una traza.

**Sin auditar todavía:** el curso añade en Reingreso *"buscamos que el target llegue al 50%, 60% máximo"* y *"nunca la entrada debe igualar el último high o el último low si va en sentido contrario, que llegue al 70% como máximo"*. → F1.5.

### D-06 · Zonas entre zonas — sin límite de cantidad
> *(El criterio del 50 % quedó fijado el 24/08 sobre el **movimiento**, no sobre el rectángulo, gracias a un contraejemplo real del operador: `02_Assets\invalidos\R-12_invalido_01.png`.)*
- **El curso dice**, diapositiva: *"Luego de marcar una zona que no supera el 50%, **ya no seguimos marcando zonas**."*
- **Y Chaumer en vivo es aún más restrictivo** — 18/08 [00:46]: *"…ya creo que lo accede, así que **ya no marcaría zonas entre zonas en toda esta área, en toda la sesión**."* Repetido el 17/08 y el 20/08.
- **El operador:** se pueden marcar **todas** las zonas intermedias que aparezcan, siempre que cada una respete su propio 50 % recalculado contra sus vecinas inmediatas.
- **Atenuante geométrico:** cada zona intermedia parte el hueco en dos, así que el siguiente candidato se mide contra un hueco la mitad de grande. La regla se estrangula sola; no produce el gráfico saturado que se temía.
- **Recogido en:** `R-12`.

### P-15 · Vela sin cuerpo (apertura = cierre)
- **Origen:** 21/08 [00:23] — *"…**esta vela no tiene cuerpo** porque la apertura y el cierre fue en el mismo sitio… **yo lo voy a marcar en función de la vela anterior**… otras personas deciden marcar en función de toda la vela, **es válido**."*
- **Situación:** `R-09` resuelve el caso inverso (vela **sin mecha** → línea). El caso "vela sin cuerpo" **no está cubierto**: la zona iría del cuerpo a la mecha, pero el cuerpo no existe.
- **Dos tratamientos posibles:** anclar en la **vela anterior** (lo que hace Chaumer) o usar **toda la vela** (que él reconoce como igualmente válido).
- **Sub-fase:** F1.1

### D-07 · Las zonas NO envejecen — binario, no gradual
- **Chaumer dice**, 18/08 [04:59]: *"a medida que el punto de reacción es **más reciente, es más importante aún**; cuando ya pasa mucho rato de los puntos de reacción, bueno yo **le resto un poco de importancia**."* Una escala **gradual** de importancia.
- **El operador:** *"Cuando se crea una zona, esta queda en estado **activa** y se tiene en cuenta para la operativa. Cuando es traspasada por ambos lados, ya no se tiene en cuenta, queda como **inactiva**, pero visualmente se deja marcada con un contraste menor para saber que hubo una zona. Esa ya no afecta nada en la operativa."*
- **Resultado: dos estados y nada más.** Sin escala, sin antigüedad, sin importancia parcial.
- **Nota:** esta es una desviación que **mejora la mecanicidad del plan**. Una escala gradual de importancia no es programable sin un número; el operador la elimina de raíz. `R-21` queda completamente binaria.
- **Cierra `P-16`.**

### D-08 · Superposición de zonas — se unen, no se recortan
- **El curso dice:** *"zona b se superpone a zona a → zona b se construye solo con la parte que no se superpone, quedando así una zona más pequeña."* Resultado: **dos zonas**, una entera y otra recortada.
- **El operador:** *"yo no creo una zona nueva si es encima, simplemente la alargo o estiro."* Resultado: **una sola zona**, más grande.
- **Por qué no es un matiz de dibujo:** cada zona lleva su propia cuenta de rompimientos y consecuciones para `R-21`. Con dos zonas hay **dos contadores de vigencia**; con una, **uno**. La zona unida puede quedar invalidada por un traspaso que, con el criterio del curso, solo habría invalidado una de las dos.
- **Recogido en:** `R-13`.

### D-09 · Volumen de premercado — se marcan todas las velas, no solo los extremos
- **El curso dice:** *"estructura abc con más de dos velas de +2.000 → solo marcamos los extremos"* (`Parámetros Chaumer.pdf`).
- **El operador (24/08/2026):** *"se marcan todas"*.
- **Por qué no muerde tanto como parece:** `R-13` fusiona automáticamente las candidatas que se tocan, y velas consecutivas de alto volumen suelen tener mechas solapadas. Cada vela sobre el umbral genera una *candidata*; `R-13` decide cuántas sobreviven como zonas separadas.
- **Riesgo residual real:** velas de alto volumen **no consecutivas y separadas en precio** sí generan zonas independientes que el criterio del curso habría descartado. Más zonas vigentes = más filtros de target `R-21` = menos operaciones. **No cuantificado.**
- **Acción pendiente:** medir en `F1.10` cuántas zonas de premercado sobreviven por sesión.
- **Recogido en:** `R-15`.

### D-10 · Zona de desequilibrio — término descartado
- **El curso lo usa.** El operador (24/08/2026): *"no uso ese término"*.
- **Efecto:** sale del glosario. Cuarto elemento del curso que no entra en el plan, tras el POC (`D-03`), la zona crítica (`D-04`) y el alto/bajo de sesión (`D-05`).
- **Riesgo:** ninguno identificado. No bloqueaba ni habilitaba nada; era vocabulario.

---

## Cerrados

### ⚠️ P-19 · Dos relojes sobre la orden pendiente — **REABIERTO Y VUELTO A CERRAR AL REVÉS · 27/08/2026**

> 🔴 **La conclusión de 24/08 era EXACTAMENTE LA CONTRARIA de la correcta.** Se cerró diciendo que un **retroceso nuevo** cancelaba la orden y que **el paso de 5 velas no**. Es al revés: **cancelan las 5 velas sin consecución** y la vuelta al punto del stop; **un retroceso nuevo no toca la orden**. Ver `R-29` reescrita. Caso que lo demuestra: 9/07/2026, orden puesta en la vela 8:43, cancelada por error en la 8:45, que con la regla correcta sigue viva y **se llena en la 8:46**. Además, la caducidad se comprueba **antes** del llenado.

*(Texto original de 24/08 conservado abajo como registro de lo que se creía entonces.)*

### ~~P-19 · versión de 24/08/2026~~
**Los dos relojes no compiten: gobiernan cosas distintas.**

| Reloj | Qué gobierna |
|---|---|
| `R-20` — 5 velas | el destino de la **ZONA** (`R-10` extensión / `R-11` apéndice) |
| `R-29` — retroceso nuevo · invalidación · 11:29 ET | la vida de la **ORDEN** |

**El paso de 5 velas NO cancela la orden.** La orden muere cuando aparece un **retroceso nuevo**, cuando el precio invalida, o a las 11:29 — lo primero que llegue.

**Hallazgo estructural:** el retroceso nuevo es **el mismo evento** que dispara `R-14`. Marca zona nueva **y** mata la orden pendiente. Un evento, dos consecuencias — el plan gana coherencia en vez de perderla.

**Efecto sobre `R-35`:** la reentrada tras T+5 queda válida. Si en la ventana de noticia no apareció retroceso nuevo, el setup sigue vivo aunque hayan pasado 11 velas.

**⚠️ Residual sin resolver (F1.4):** si a la vela 6 la zona se extendió por `R-10` hasta cubrir el nivel de la orden, un llenado posterior entraría **dentro** de la zona extendida. No se ha preguntado si eso ocurre en la práctica ni si importa.

### ✅ P-17 · Orden pendiente ante noticia roja — CERRADO 24/08/2026
**Se cancela** al entrar la ventana T−5. Recogido en `R-35`. Por `R-29` la cancelación **no consume el cupo** de `R-28`.

### ✅ P-18 · ¿Todo retroceso genera zona? — CERRADO 24/08/2026
**No hay filtro oculto.** El único retroceso que no genera zona es el bloqueado por `R-12` (entre soporte y resistencia, cruzando el 50 %). Con espacio libre, todo retroceso genera zona.
**Consecuencia encadenada:** en ese caso **no hay estructura nueva** → `R-14` no dispara → el reloj de 5 velas sigue hacia `R-10`/`R-11`.

### ✅ P-06 · Umbral de volumen — CERRADO 24/08/2026

**Resuelto en `R-15`:** en premercado, toda vela con **MNQ > 6.000** contratos genera zona *(hasta el 06/09/2026 el umbral se leía en NQ, > 2.000 — ver `P-32`)*. **Vela alcista → resistencia** (mecha superior); **vela bajista → soporte** (mecha inferior). Una vez marcada, se comporta **exactamente igual** que cualquier otra zona: `R-21` a `R-14` aplican sin excepción.

**Corregida la errata de la guía v4:** decía *"≥2.000 en MNQ ó ≥6.000 en NQ"* — los números estaban **invertidos**. Confirmado por Chaumer en vivo (18/08): *"ninguno llega a los 2000 contratos, por eso yo no identifico ningún tipo de zona"*, hablando del gráfico de NQ.

**Discrepancia menor que se deja anotada sin resolver:** `Parámetros Chaumer.pdf` dice que *"2000 en nq son aprox 3200 en mnq"*, mientras que el operador usa **6.000** para MNQ — casi el doble, luego los dos umbrales **no son equivalentes**. 🔴 **Desde el 06/09/2026 esto sí muerde:** el NQ salió del plan y el único umbral que queda es el de MNQ, así que la discrepancia dejó de ser teórica. Reabierto como **`P-32`**.

**Los dos flecos que quedaban se cerraron el 24/08/2026:**

1. **Hora de inicio del escaneo** → **19:00 hora Colombia del día anterior** (apertura de Tokio, 09:00 JST). Fija todo el año.
2. **Velas múltiples sobre el umbral** → **se marcan todas**. Contradice a `Parámetros` (*"solo marcamos los extremos"*) → registrado como **`D-09`**.

**Además se cerró un vacío que no estaba inventariado:** la regla del volumen **se apaga en la apertura americana**. Dentro de sesión solo se marcan zonas por estructura (`R-09`), sin importar el volumen. Sin ese corte la regla habría sido inaplicable: 2.000 contratos en una vela de 1 min del NQ es un evento raro en premercado y volumen corriente en sesión.

**`P-06` queda completamente cerrado.**


### ✅ P-14 y P-15 — CERRADOS 24/08/2026

**`P-14` · Extensión sin esperar las 5 velas.** Resuelto en `R-14`: el plazo de 5 velas es un **tope, no una espera obligatoria**. Si aparece una nueva estructura —un nuevo retroceso— se marca zona de inmediato. El curso lo llama *"extender la zona"* y el operador *"crear una zona nueva"*; con `R-13` (superposición) es el mismo resultado descrito desde los dos extremos. No hubo que definir "estructura fallida": **nueva estructura = nuevo retroceso**, que ya está definido en `R-06`.

**`P-15` · Vela sin cuerpo.** Resuelto sin escribir nada nuevo: si apertura = cierre, el cuerpo **mide cero** pero sigue existiendo como línea de precio, así que `R-09` funciona tal cual — la zona va de ese precio a la punta de la mecha. `R-09` cubre ahora la anatomía completa: vela normal, vela **sin mecha** (→ línea) y vela **sin cuerpo**.


### ✅ P-13 · "Punto de reacción" — CERRADO 24/08/2026 · no era un término nuevo

**Resolución del operador:** *"El punto de reacción **es la zona**, las zonas grises activas que se marcan. Esos son los puntos de reacción. No se mira nada más."*

**Consecuencia:** no hay término que añadir al glosario ni filtro que añadir al plan. "Punto de reacción" es simplemente **como Chaumer nombra a la zona vigente** — ya cubierto por `R-09` (marcado) y `R-21` (vigencia).

**Efecto sobre la alarma del filtro único de target:** se atenúa. El plan tiene un solo filtro de target, pero ese filtro —*el target no penetra una zona vigente*— **es exactamente el que Chaumer aplica a diario**, y es la razón por la que no operó 2 de las 4 sesiones grabadas. Las eliminaciones de `P-01`, `D-03`, `D-04` y `D-05` siguen sin apoyarse en datos, pero lo que queda no es un resto: es el filtro principal de la metodología.

**Abre un matiz nuevo** → `P-16`.


### ✅ P-11 y D-02 · "Sobreextendido" — CERRADOS 24/08/2026 · resueltos por el autor de la metodología

**Cómo se resolvió:** Chaumer respondió por nota de voz (transcripción en `03_Materia_Prima\transcripciones\2026-08-24_audio_chaumer.md`):

> *"Eso **no es para nada un parámetro operativo, eso forma parte de la contextualización**. Yo no tengo un parámetro que diga 'si el movimiento es muy extendido, no planteo la entrada', no. […] Depende de la volatilidad del momento, del desarrollo operativo, de la proporción de la vela."*

**Consecuencias aplicadas:**
- El filtro *"impulso de más de 5 velas → sobreextendido"* de la guía v4 era una **simplificación propia del operador**, no del método. Eliminado.
- El tope provisional de **10 velas** sale de `R-05`. **La corrida no tiene tamaño máximo.**
- `D-02` deja de ser una desviación: no había regla de la que desviarse.
- Nace la capa **`CONTEXTUALIZACION.md`** con la taxonomía de Chaumer. La sobreextensión queda allí como `C-01`.

**Dos parámetros que Chaumer ofreció y el operador descartó** (registrados en `C-01` por si se reconsideran): **A** — la entrada llega tras el tercer impulso; **B** — el movimiento lleva más de 10 velas sin retroceder.

**Estado del registro de campo** `03_Materia_Prima\registro_sobreextension.csv`: **en pausa.** Su objetivo original —derivar un umbral— ya no aplica. Se conserva por si algún día se quiere alimentar la capa de contextualización con datos propios.


### ✅ P-02 · Huso horario del gráfico NT8 — cerrado 21/08/2026
- **Decisión:** **opción B** — se mantiene el gráfico en **hora Colombia** (UTC−5 fijo). Motivo del operador: manejar dos husos en vivo le genera confusión.
- **Contrapartida documentada en R-02:** el número en pantalla se desplaza una hora en cada cambio de horario de NY. **Próximo cambio: domingo 1 de noviembre de 2026**; desde el lunes 2 de noviembre la ventana en pantalla pasa a **09:30–11:30**.
- **Mitigación obligatoria:** entra en el checklist de pre-sesión de **F1.9** como verificación fija — *"¿la primera vela que estoy viendo es la de la apertura americana?"*

### ✅ P-04 · Tipo de orden en NT8 — cerrado 21/08/2026
- **Sospecha inicial:** el operador creía usar *Buy Limit por encima del precio*, que en NT8 es marketable y se ejecuta al instante. Habría implicado entrar antes de cumplirse la condición de consecución.
- **Resultado de la verificación:** **descartado.** El operador usa **Buy Stop Market** (long) y **Sell Stop Market** (short), que es la orden correcta. Queda formalizado en **R-24**.

### ✅ P-05 · Plantilla y herramientas de NT8 — cerrado 21/08/2026
- **Resultado:** único indicador **Volume Up Down** sobre el gráfico de NQ. Sin medias, osciladores, VWAP ni perfil de volumen. ATM `K1`, 1 contrato, sin BE ni trailing. Formalizado en **R-31** y **R-03**.
- **Resto:** solo queda el nombre del feed → `P-10`.

---

## `P-22` · ¿Qué retroceso fija el stop? — ABIERTO 2026-08-26

`R-31` dice *"nivel de entrada ↔ mínimo/máximo **del retroceso**"*. **No dice cuál**, y cuando entre la zona y la entrada ha pasado más de un retroceso, hay dos candidatos distintos:

| Candidato | Argumento |
|---|---|
| **El retroceso que generó la zona** | Es el que define la estructura que se está operando |
| **El último retroceso antes de la entrada** | Es el nivel cuya perforación demuestra que el movimiento no aguantó, y el que el operador tiene delante en el momento de entrar |

**Cómo apareció.** El 06/07/2026 la Continuación se completó a las 8:47 con entrada en 29.959,75. Los dos candidatos daban:

- mín retroceso 2 (8:43) = 29.845,75 → **114,00 pts**
- mín retroceso 1 (8:37) = 29.786,00 → **173,75 pts**

**59,75 puntos de diferencia.** Ese día no mordió porque **los dos superaban `STOP_MAX`** y el setup se descartó igual. El 10/07/2026 tampoco mordió porque coincidían.

**Riesgo si no se cierra:** el stop, el target (ratio 1:1) y el propio filtro de `R-31` dependen de este número. Es el mismo tipo de hueco que `P-12` cerró para el "mínimo del retroceso" dentro de un solo retroceso.

**Estado:** ⏳ pendiente de respuesta del operador.

---

## `P-23` · Vela de apertura sin cuerpo — ABIERTO 2026-08-26

`R-07` declara la dirección del día por el cuerpo de la **08:31**: cierre por encima de la apertura → alcista; por debajo → bajista. **No cubre el empate**: cierre exactamente igual a la apertura.

**Frecuencia:** por medir sobre las 39 sesiones. Probablemente muy raro en la vela de apertura, que suele tener cuerpo grande.

**Estado:** ⏳ pendiente.

---

## `P-24` · ¿Sobra `R-08`? — ABIERTO 2026-08-26

`R-08` se escribió para *"vela que hace máximo mayor y mínimo menor **cuando no hay corrida viva**"*, y decía que no declara dirección: la da la siguiente vela.

**Dos cosas la dejan en el aire el mismo día en que se escribió:**

1. **`R-07` reescrita** hace que en la apertura **siempre haya corrida viva desde la 08:31**. Y a partir de ahí el mercado está siempre o en corrida o en retroceso — nunca en un hueco. Si eso es cierto, **el supuesto de `R-08` no ocurre nunca**.
2. **El operador describió el caso al revés** el 26/08/2026: *"hace rompimiento tanto arriba como abajo, funcionaría como rompimiento y como retroceso"* — es decir, **hace las dos cosas**, no ninguna.

**Lectura probable:** la frase del operador describe el caso **con corrida viva**, que `R-05` + `R-09` ya resuelven (mata la corrida, es la primera vela del retroceso, y si es la más alta marca la zona — la 8:36 del 10/07). En ese caso `R-08` no contradice nada: simplemente cubre un hueco vacío y **se borra**.

**Riesgo si no se cierra:** una regla confirmada que describe un caso inexistente, o peor, que contradice al operador en el caso que sí existe.

⚠️ **No tocar `R-08` sin respuesta del operador** (regla permanente 6 del proyecto).

**Estado:** ⏳ pendiente.


---

# 🟢 Cerrados el 27/08/2026

## ✅ `P-22` · ¿Qué retroceso fija el stop? — **CERRADO 27/08/2026**

**Respuesta del operador:** ninguno de los dos candidatos. El stop es **el punto más extremo que haya hecho el mercado desde que nació la zona hasta la vela de rompimiento**. Todo lo que pase en medio cuenta, haya pasado un retroceso o cinco.

**Caso que lo cierra — 7/07/2026:** el soporte de la vela 9:27 se rompe con la vela 9:36. El retroceso que lo originó (9:28–9:30) tenía techo en 29.313,00; la vela 9:32 subió a **29.327,75**. Con la regla correcta el riesgo pasa de 71,50 a 86,25 pts y **la entrada se descarta por `STOP_MAX`**.

**Recogido en:** `R-32` · `PARAMETROS.md` → `ORIGEN_DEL_STOP`.

---

# 🔴 Abiertos nuevos · 27/08/2026

## ✅ `P-25` · ¿Sirve para entrar una zona ESTIRADA? — **CERRADO 08/09/2026**

**La pregunta estaba mal planteada.** Se preguntaba si una zona *estirada* sirve para entrar. Al llevarle el caso al operador con un gráfico, la respuesta fue que **ahí no se dibuja nada en absoluto** — ni zona nueva, ni estiramiento:

> *"ahí no se debe dibujar nada, ninguna zona, porque ya existe una zona de resistencia; para generar una nueva zona de resistencia el precio debe sobrepasar la que ya existe, con rompimiento y consecución."*

Y a continuación dio la secuencia completa:

> *"el precio cuando abre, lo primero que hace es generar una primera zona, y luego la segunda que es el retroceso. Entre esas dos zonas solo se puede crear una zona, solo si ese retroceso que genera esa zona no supera el 50 %; de lo contrario, entre ese rango no se genera ninguna zona. Las únicas zonas que se pueden dibujar es cuando el precio supere alguna de las zonas de los extremos (resistencia o soporte), con rompimiento y consecución; si se puede generar otra zona, de lo contrario no."*

Confirmado además que **el traspaso abre banda nueva, con turno propio, y ese turno vale para toda la jornada**.

### Qué cambia

**Ninguna regla.** Siguen **38**. La secuencia ya estaba repartida entre `R-16`, `R-12`, `R-17` y `R-18`; lo que faltaba era **leerlas juntas y en orden**. Queda escrita como sección propia al principio del capítulo de zonas del plan: *“Cómo se marca una jornada”*.

### El error del auditor que esto corrige

Se estaba tratando el estiramiento como algo que puede pasar **dentro** de una banda ya cerrada. No puede. El estiramiento (`R-10`) y la apéndice (`R-11`) nacen de un **rompimiento sin consecución** cuando el plazo se resuelve — no de una corrida cualquiera que termina donde ya había zona.

**Consecuencia abierta:** hay que comprobar que el motor de auditoría marca así → `P-33`.

**Estado:** ✅ **cerrado.**

---

## `P-33` · El motor no está verificado contra la secuencia de banda y turno — ABIERTO 2026-09-08

Con `P-25` cerrado queda escrita, por primera vez y en un solo sitio, la secuencia de marcado de la jornada: **dos zonas de apertura = la banda · una zona como máximo dentro de ella en toda la jornada · nada más dentro · zona nueva solo por traspaso de un extremo · el traspaso abre banda nueva con turno propio para toda la jornada**.

**Lo que no sabemos:** si `05_Backtesting\lector.py` marca exactamente así. Nunca se comprobó contra esa lectura, porque la lectura no existía escrita.

**Qué hay que hacer:** revisar el marcado del motor contra la secuencia y volver a pasar las **11 sesiones validadas** para ver si alguna zona aparece o desaparece del marcado.

**Qué no se espera que cambie:** las 9 operaciones validadas. Pero hay que comprobarlo.

**Estado:** ⏳ pendiente. **Bloquea el backtesting de un año** — junto con `P-31`, `P-32` y `P-27`.

---

## `P-26` · ¿El FOMC bloquea toda la sesión o solo el anuncio? — ABIERTO 2026-08-27

`R-36` dice **día entero**. No está verificado contra el criterio real del operador ni contra su bitácora. Y falta saber **si hubo FOMC en agosto de 2026** — julio está confirmado (8 y 29).

**Estado:** ⏳ pendiente.

---

## `P-27` · Calendario de noticias rojas — ABIERTO 2026-08-27

El motor de backtesting **no tiene filtro de noticias rojas** (`R-35`). Todos los resultados del backtesting día por día están calculados **sin** ese filtro. Hace falta el calendario, o al menos las fechas y horas de la bitácora del operador.

**Estado:** ⏳ pendiente. **Bloquea la validez de cualquier cifra agregada del backtesting.**

---

## `P-28` · Separación mínima entre zonas del mismo tipo — ABIERTO 2026-08-27

Cuando dos zonas del mismo tipo quedan **cerca pero sin tocarse**, `R-13` no dice nada: no se estira una sobre otra, quedan dos. Caso observado: 8/07/2026, zonas de las velas 9:16 y 9:21, separadas 1,25 puntos.

**Estado:** ⏳ pendiente.

---

# 🚨 Abierto al cerrar la fase 1 · 01/09/2026

## `P-29` · El test ciego NO se ejecutó — HUECO DECLARADO

La fase 1 se cierra **sin ejecutar `F1.11`**, por decisión explícita del operador el 01/09/2026.

**Qué era:** diez gráficos que el auditor no haya visto etiquetados · aplicar el plan tal como está escrito · comparar con lo que hizo el operador · exigir **9 de 10** coincidencias.

**Qué se pierde al no hacerlo:** es la única prueba de que el documento es **auto-suficiente**. Todo lo validado se validó con el operador delante, corrigiendo. Eso demuestra que las reglas describen lo que él hace; **no** demuestra que un tercero llegue a lo mismo leyendo solo el texto.

**Por qué importa especialmente aquí:** durante la fase 1, **siete** lecturas razonables del material resultaron ser lo contrario de la verdad (rompimiento por cierre, cancelación por retroceso nuevo, plazo en el traspaso, origen del stop, ventana del reingreso, sesgo de la apertura, zonas entre zonas). Ese historial es la razón de fondo para no dar el plan por probado.

**Argumento a favor de cerrar igual, registrado:** el plan dejó de moverse. De 2-3 reglas tocadas por día al principio, a **cero** los días 15 y 20 de julio. En el 20 de julio la duda del operador se resolvió aplicando reglas ya escritas.

**Cómo se puede cerrar más adelante:** ejecutar el test **contra el portal** de la fase 2 — dar diez gráficos sin etiquetar a alguien que solo tenga el portal delante. Sería a la vez la validación del plan y la del portal.

**Estado:** 🚨 abierto · **hueco declarado, no olvido**.

---

# 🔵 Abiertos con la precisión del plazo · 01/09/2026

## ✅ `P-30` · ¿La resolución anticipada aplica también al ESTIRAMIENTO? — **CERRADO 07/09/2026**

**Sí aplica igual.** Confirmado por el operador el 07/09/2026, con estas palabras: *"Si aplica igual"*.

### Qué se preguntaba
La regla del plazo como tope (`R-14`) se precisó el 01/09/2026 sobre el caso de la **zona apéndice** —rompimiento **con cuerpo**—. Quedó sin confirmar si el otro camino —rompimiento **con mecha**, que **estira** la zona en vez de crear una apéndice— también se resuelve de forma anticipada al armarse la estructura contraria, o si ése esperaba siempre a la quinta vela.

Se había escrito como si aplicara a los dos, **por simetría**, y quedó marcado como extrapolación del auditor para no darlo por bueno sin preguntar.

### Qué queda escrito
`R-14` gobierna **los dos caminos, sin excepción**:

| Cómo rompe | Qué pasa cuando el plazo se resuelve |
|---|---|
| con **mecha** | la zona **se estira** hasta la punta de esa mecha (`R-10`) |
| con **cuerpo** | nace una **zona apéndice** (`R-11`) |

En ambos, **el plazo de 5 velas es un tope, no una espera**: si antes se arma una estructura completa en sentido contrario, la geometría se resuelve en ese momento. **Actúa lo que llegue primero.**

La condición medible es la misma en los dos, leída en el sentido que corresponda: la vela del retroceso tiene que superar el extremo de la vela anterior **sin pasar del extremo de la vela de rompimiento** — si lo pasa, eso es **consecución** y no hay ni estiramiento ni apéndice: la zona queda superada.

### Por qué importa
Cambia **cuándo** nace el borde nuevo, y de ahí cuelga dónde va el stop. Con la resolución anticipada, en el diagrama de la lámina del portal la zona se estira en la vela 11; sin ella, habría que esperar a la 13.

**Consecuencia abierta:** el motor de auditoría sigue sin implementarlo — ver `P-31`, que ahora cubre **los dos casos**.

**Estado:** ✅ **cerrado.** Lámina `04_Web\public\conceptos\24-estructura-antes.png` rehecha el 07/09/2026 con este caso.

---

## `P-31` · El motor todavía no aplica la resolución anticipada — ABIERTO 2026-09-01

`05_Backtesting\lector.py` resuelve el plazo **solo por vencimiento de las 5 velas**. No detecta la estructura contraria.

> 🔴 **Ampliado el 07/09/2026:** con `P-30` cerrado, esto afecta a **los dos caminos** —estiramiento y apéndice—, no solo a la apéndice.

**Qué hay que hacer:** implementarlo y volver a pasar las 11 sesiones validadas, para ver si alguna zona cambia su fecha de nacimiento. Días con eventos de plazo vencido: **7, 13, 16, 17 y 20 de julio**.

**Qué NO cambia:** ninguna de las 9 operaciones validadas depende de la fecha de nacimiento de esas zonas. Pero conviene comprobarlo antes de dar los gráficos por definitivos.

**Estado:** ⏳ pendiente.

---

# 🟠 Abierto al salir el NQ del plan · 06/09/2026

## `P-32` · El umbral de volumen de premercado cambió de instrumento, y la equivalencia no está verificada

Con el NQ fuera del plan, el umbral de premercado pasa a ser **> 6.000 contratos en MNQ**. Antes se leía sobre NQ, **> 2.000**.

**Lo que no sabemos:** si las dos cifras marcan **las mismas velas**. Nunca se comprobó con datos.

**Por qué importa:** la zona de premercado es la única que nace del volumen, y hace de **borde de banda** (`R-17`). Si el umbral nuevo marca velas distintas, cambian las bandas y con ellas qué zonas se marcan dentro. El 14 de julio, sin ir más lejos, la jornada entera se decidió por una banda cuyo borde superior era una zona de premercado.

**El desajuste que queda declarado:**

| | |
|---|---|
| Las 11 sesiones validadas | se marcaron con **NQ > 2.000**, sobre datos de NQ |
| Lo que dice el plan desde hoy | **MNQ > 6.000** |
| Datos de MNQ para comprobarlo | **no los tenemos** |
| El motor de backtesting | sigue leyendo NQ, porque es el dato que hay — y así se queda |

**Cómo se cierra:** exportar de NinjaTrader el premercado de MNQ de esos mismos 11 días y comprobar si las velas que superan 6.000 en MNQ son las mismas que superaban 2.000 en NQ. Si no coinciden, hay que decidir el umbral bueno **antes** del backtesting de un año.

**Estado:** ⏳ pendiente. **No bloquea operar**, pero sí bloquea dar por buena cualquier cifra agregada de premercado.

---

# ✅ Cerrados el 14/09/2026 por la unificación del punto de referencia

## ✅ `P-36` · El punto de referencia y el punto de control se solapaban — CERRADO

**Estaban duplicados y el operador lo zanjó el mismo día en que se detectó:** *"punto de control y punto de referencia es lo mismo, podemos unificar esos conceptos, dejemos uno solo: Punto de Referencia."*

Los dos eran el extremo de un retroceso, los dos tapaban el objetivo del reingreso y los dos iban en la misma dirección. Se diferenciaban solo en dos detalles, y en los dos ganó la versión nueva:

| | Se queda |
|---|---|
| **Qué nivel** | el de **cualquier** retroceso vivo entre la entrada y el objetivo, no solo el que originó la zona |
| **Caducidad** | **muere cuando una vela cierra más allá** (antes el de referencia no caducaba nunca) |

**Resuelto en `R-41`**, que pasa a llamarse *punto de referencia*. El término *punto de control* desaparece del plan. **Probado antes de unificar:** no cambia ninguna de las 11 sesiones de julio (−91,00 pts en 9 operaciones), ni el 10/09, ni el 11/09.

## ✅ `P-35` · El reingreso sobre zona de premercado no tenía punto de referencia — CERRADO de rebote

**El problema era:** el filtro propio del reingreso exigía que el objetivo cupiera dentro del extremo del retroceso que originó la zona, y una zona de premercado **no nace de ningún retroceso** — nace del volumen. No había contra qué medir.

**Lo cierra la unificación sin tocar nada más:** desde el 14/09/2026 vale el nivel de referencia de **cualquier** retroceso vivo que quede entre la entrada y el objetivo. Ya no hace falta que la zona venga de uno. **Una zona de premercado puede dar reingreso con normalidad.**

**Origen:** 11/09/2026, reingreso de las 9:01 sobre la zona de premercado de las 8:29.

> ⚠️ **Sigue abierto `P-34`**, que es cosa distinta: el motor no anota los rompimientos de las zonas de premercado, así que **no puede ver** ese reingreso aunque la regla ya lo permita.

## ✅ `P-37` · Con qué criterio se cambia el umbral de volumen — CERRADO 14/09/2026, sin criterio medible y a propósito

**La pregunta era:** qué volatilidad se mide, cuándo, y qué número lleva a qué umbral.

**La respuesta del operador (14/09/2026):** *"dejemos que quede paramétrico, hoy lo vamos a dejar de 8.000"*. **No va a haber criterio medible: el umbral lo fija él.**

No es un hueco, es una decisión — y el plan ya tiene otra igual: `R-37`, no operar si no se está bien, también es criterio libre y está aceptada así a propósito.

**La condición que lo hace seguro, y que sí es medible:**

> 🔴 **El umbral NUNCA se cambia con la sesión empezada.** Cada cambio se anota con su fecha en `PARAMETROS.md`.

Sin esa línea, el umbral se podría mover **después** de ver el día, y ése es el único movimiento que convertiría el backtesting en un ejercicio de ajuste a posteriori. Con la sesión ya abierta, el número es el que es.

**Historial del parámetro:** > 2.000 en NQ hasta el 06/09/2026 · > 6.000 en MNQ del 06/09 al 14/09 · **> 8.000 en MNQ desde el 14/09/2026**.

> ⚠️ **`P-32` sigue abierto** y es cosa distinta: nadie ha verificado con datos si el umbral de MNQ marca las mismas velas que marcaba el viejo de NQ.

---

> 🔢 **Nota de numeración, 14/09/2026.** El pendiente del umbral de volumen se abrió ese día como `P-33`, pero ese número ya estaba ocupado desde el 08/09 por *"el motor no está verificado contra la secuencia de banda y turno"*. Se corrigió el mismo día: **el del umbral es `P-37`**. El `P-33` original sigue abierto y no se ha tocado. **El próximo pendiente que se abra es `P-38`.**
