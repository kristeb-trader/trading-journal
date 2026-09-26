# PENDIENTES

Lo que el plan tiene abierto y las desviaciones conscientes respecto al curso. **Los pendientes cerrados, con su
resolución, están en `HISTORIAL.md`**: aquí solo queda lo que sigue abierto.

> Actualizado: 2026-09-26 · 🏁 fase 1 cerrada · 🔴 **test ciego EN MARCHA** — **40 reglas** · **18 pendientes abiertos** · **12 desviaciones** · numeración libre a partir de `P-38`
>
> 🚨 **Los cuatro huecos declarados del cierre:** ~~`P-29` test ciego no ejecutado~~ → **arrancó el 14/09/2026, primera jornada marcada: 10/09** · `P-21` sin regla de parada · falta la capa de contextualización · `P-27` las cifras del backtesting no miden la estrategia.

---

## 🚨 Abiertos · los cuatro huecos declarados

### `P-29` · El test ciego NO se ejecutó — HUECO DECLARADO

La fase 1 se cierra **sin ejecutar `F1.11`**, por decisión explícita del operador el 01/09/2026.

**Qué era:** diez gráficos que el auditor no haya visto etiquetados · aplicar el plan tal como está escrito · comparar con lo que hizo el operador · exigir **9 de 10** coincidencias.

**Qué se pierde al no hacerlo:** es la única prueba de que el documento es **auto-suficiente**. Todo lo validado se validó con el operador delante, corrigiendo. Eso demuestra que las reglas describen lo que él hace; **no** demuestra que un tercero llegue a lo mismo leyendo solo el texto.

**Por qué importa especialmente aquí:** durante la fase 1, **siete** lecturas razonables del material resultaron ser lo contrario de la verdad (rompimiento por cierre, cancelación por retroceso nuevo, plazo en el traspaso, origen del stop, ventana del reingreso, sesgo de la apertura, zonas entre zonas). Ese historial es la razón de fondo para no dar el plan por probado.

**Argumento a favor de cerrar igual, registrado:** el plan dejó de moverse. De 2-3 reglas tocadas por día al principio, a **cero** los días 15 y 20 de julio. En el 20 de julio la duda del operador se resolvió aplicando reglas ya escritas.

**Cómo se puede cerrar más adelante:** ejecutar el test **contra el portal** de la fase 2 — dar diez gráficos sin etiquetar a alguien que solo tenga el portal delante. Sería a la vez la validación del plan y la del portal.

**Estado:** 🚨 abierto · **hueco declarado, no olvido**.

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

### `P-27` · Calendario de noticias rojas — ABIERTO 2026-08-27

El motor de backtesting **no tiene filtro de noticias rojas** (`R-35`). Todos los resultados del backtesting día por día están calculados **sin** ese filtro. Hace falta el calendario, o al menos las fechas y horas de la bitácora del operador.

**Estado:** ⏳ pendiente. **Bloquea la validez de cualquier cifra agregada del backtesting.**

---

## Abiertos · dudas de método

### `P-23` · Vela de apertura sin cuerpo — ABIERTO 2026-08-26

`R-07` declara la dirección del día por el cuerpo de la **08:31**: cierre por encima de la apertura → alcista; por debajo → bajista. **No cubre el empate**: cierre exactamente igual a la apertura.

**Frecuencia:** por medir sobre las 39 sesiones. Probablemente muy raro en la vela de apertura, que suele tener cuerpo grande.

**Estado:** ⏳ pendiente.

### `P-24` · ¿Sobra `R-08`? — ABIERTO 2026-08-26

`R-08` se escribió para *"vela que hace máximo mayor y mínimo menor **cuando no hay corrida viva**"*, y decía que no declara dirección: la da la siguiente vela.

**Dos cosas la dejan en el aire el mismo día en que se escribió:**

1. **`R-07` reescrita** hace que en la apertura **siempre haya corrida viva desde la 08:31**. Y a partir de ahí el mercado está siempre o en corrida o en retroceso — nunca en un hueco. Si eso es cierto, **el supuesto de `R-08` no ocurre nunca**.
2. **El operador describió el caso al revés** el 26/08/2026: *"hace rompimiento tanto arriba como abajo, funcionaría como rompimiento y como retroceso"* — es decir, **hace las dos cosas**, no ninguna.

**Lectura probable:** la frase del operador describe el caso **con corrida viva**, que `R-05` + `R-09` ya resuelven (mata la corrida, es la primera vela del retroceso, y si es la más alta marca la zona — la 8:36 del 10/07). En ese caso `R-08` no contradice nada: simplemente cubre un hueco vacío y **se borra**.

**Riesgo si no se cierra:** una regla confirmada que describe un caso inexistente, o peor, que contradice al operador en el caso que sí existe.

⚠️ **No tocar `R-08` sin respuesta del operador** (regla permanente 6 del proyecto).

**Estado:** ⏳ pendiente.

### `P-26` · ¿El FOMC bloquea toda la sesión o solo el anuncio? — ABIERTO 2026-08-27

`R-36` dice **día entero**. No está verificado contra el criterio real del operador ni contra su bitácora. Y falta saber **si hubo FOMC en agosto de 2026** — julio está confirmado (8 y 29).

**Estado:** ⏳ pendiente.

### `P-28` · Separación mínima entre zonas del mismo tipo — ABIERTO 2026-08-27

Cuando dos zonas del mismo tipo quedan **cerca pero sin tocarse**, `R-13` no dice nada: no se estira una sobre otra, quedan dos. Caso observado: 8/07/2026, zonas de las velas 9:16 y 9:21, separadas 1,25 puntos.

**Estado:** ⏳ pendiente.

---

## Abiertos · el motor y el backtesting

### `P-31` · El motor todavía no aplica la resolución anticipada — ABIERTO 2026-09-01

`05_Backtesting\lector.py` resuelve el plazo **solo por vencimiento de las 5 velas**. No detecta la estructura contraria.

> 🔴 **Ampliado el 07/09/2026:** con `P-30` cerrado, esto afecta a **los dos caminos** —estiramiento y apéndice—, no solo a la apéndice.

**Qué hay que hacer:** implementarlo y volver a pasar las 11 sesiones validadas, para ver si alguna zona cambia su fecha de nacimiento. Días con eventos de plazo vencido: **7, 13, 16, 17 y 20 de julio**.

**Qué NO cambia:** ninguna de las 9 operaciones validadas depende de la fecha de nacimiento de esas zonas. Pero conviene comprobarlo antes de dar los gráficos por definitivos.

**Estado:** ⏳ pendiente.

### `P-32` · El umbral de volumen de premercado cambió de instrumento, y la equivalencia no está verificada

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

### `P-33` · El motor no está verificado contra la secuencia de banda y turno — ABIERTO 2026-09-08

Con `P-25` cerrado queda escrita, por primera vez y en un solo sitio, la secuencia de marcado de la jornada: **dos zonas de apertura = la banda · una zona como máximo dentro de ella en toda la jornada · nada más dentro · zona nueva solo por traspaso de un extremo · el traspaso abre banda nueva con turno propio para toda la jornada**.

**Lo que no sabemos:** si `05_Backtesting\lector.py` marca exactamente así. Nunca se comprobó contra esa lectura, porque la lectura no existía escrita.

**Qué hay que hacer:** revisar el marcado del motor contra la secuencia y volver a pasar las **11 sesiones validadas** para ver si alguna zona aparece o desaparece del marcado.

**Qué no se espera que cambie:** las 9 operaciones validadas. Pero hay que comprobarlo.

**Estado:** ⏳ pendiente. **Bloquea el backtesting de un año** — junto con `P-31`, `P-32` y `P-27`.

### 🔧 P-34 · El motor no registra los rompimientos de las zonas de premercado — NUEVO 14/09/2026
- **Qué pasa:** en `lector.py`, el rompimiento de una zona solo se anota dentro del bloque de continuación, que exige que la zona venga de una corrida. Las zonas de premercado no vienen de ninguna, así que **su rompimiento no se anota nunca** y, como el reingreso nace de un rompimiento que falla, **el motor no puede ver jamás un reingreso sobre una zona de premercado**.
- **Contradice a `R-15`**, que dice que la zona de premercado se comporta *exactamente igual* que cualquier otra.
- **Detectado el 11/09/2026:** el reingreso de las 9:01 lo encontré a mano; el motor no lo ve.
- **Hermano del mismo fallo:** en día de FOMC pasa lo mismo por otra vía — el bloque de continuación se salta entero, así que tampoco se anotan rompimientos y **el motor no puede ver ningún reingreso en día de FOMC**, que es justo el único setup permitido esos días. Arreglarlo hace aparecer una operación el **8 de julio**, sesión ya validada como NO OPERA, así que **no se toca sin decidirlo con el operador**.
- **Estado:** ⏳ pendiente. No bloquea operar — bloquea el backtesting.

---

## Abiertos · riesgo, cuenta y ejecución

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

## Abiertos · términos y preguntas del curso sin resolver

*Vienen del glosario (la agenda de términos de la F1.1 y las preguntas que dejó abiertas `Parámetros Chaumer.pdf`). No tienen código: ninguna regla depende de ellas.*

**Términos del curso todavía sin definición medible:**

| Término | Estado |
|---|---|
| Cambio de estructura | PENDIENTE |
| Consecución inmediata | PENDIENTE |
| Ingreso | PENDIENTE |
| Entrada tendencial | PENDIENTE |
| Invalidación total | PENDIENTE — falta ficha propia |

**Preguntas que el propio material del curso deja sin resolver:**

1. **Vela de ruptura:** el curso responde en diapositiva — *"vela de ruptura sin intención"* (rompe con mecha) frente a *"vela de ruptura **con intención (con cuerpo)**"*; la tímida *"no deja de ser válida"*. Ya recogido en `R-20`. Falta si el operador exige intención para entrar.
2. **Vela de confirmación / continuación:** ¿cuál es el ideal?
3. **Preoperatoria:** cómo se marcan los volúmenes en americana vs europea, y por qué el umbral cambia de instrumento entre una y otra.
7. **Extensión de zona:** si una zona se marca inicialmente como resistencia, ¿solo puede extenderse en ese sentido, o si una mecha la rompe como soporte también se extiende hacia abajo?
8. **Marcado en tendencia:** cuando hay tendencia y se dan múltiples entradas, ¿cuáles zonas se marcan y cuáles no?

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

### D-05 · Alto y bajo de la sesión como filtro de target — DESCARTADO
- **El curso dice**, sección "Parámetros operativos": *"Evitar entradas cuyo target sobrepase el alto o bajo de la sesión… tienden a ser zonas de fuerte rechazo"*. Y la guía v4 lo lista como filtro de no-entrada #4.
- **El operador:** no lo usa.

### D-06 · Zonas entre zonas — sin límite de cantidad
> *(El criterio del 50 % quedó fijado el 24/08 sobre el **movimiento**, no sobre el rectángulo, gracias a un contraejemplo real del operador: `02_Assets\invalidos\R-12_invalido_01.png`.)*
- **El curso dice**, diapositiva: *"Luego de marcar una zona que no supera el 50%, **ya no seguimos marcando zonas**."*
- **Y Chaumer en vivo es aún más restrictivo** — 18/08 [00:46]: *"…ya creo que lo accede, así que **ya no marcaría zonas entre zonas en toda esta área, en toda la sesión**."* Repetido el 17/08 y el 20/08.
- **El operador:** se pueden marcar **todas** las zonas intermedias que aparezcan, siempre que cada una respete su propio 50 % recalculado contra sus vecinas inmediatas.
- **Atenuante geométrico:** cada zona intermedia parte el hueco en dos, así que el siguiente candidato se mide contra un hueco la mitad de grande. La regla se estrangula sola; no produce el gráfico saturado que se temía.
- **Recogido en:** `R-12`.

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

### D-11 · Fractal y manipulación — TÉRMINOS DESCARTADOS
- **El curso los usa.** El operador (24/08/2026): *"no uso esos términos"*.
- **Efecto:** salen del glosario. Con esto son **seis** elementos del curso fuera del plan: Fibonacci (`D-01`), POC (`D-03`), zona crítica (`D-04`), alto/bajo de sesión (`D-05`), zona de desequilibrio (`D-10`), fractal y manipulación (`D-11`).
- **Riesgo:** ninguno identificado. Vocabulario, no mecánica.

### D-12 · Sesión europea — DESCARTADA
- **El curso la usa** para marcar zonas críticas en sus máximos y mínimos (`D-04`).
- **El operador (24/08/2026):** *"borrar"*. No la mira para nada.
- **Coherente con `D-04`:** las zonas críticas ya estaban descartadas; su fuente europea cae con ellas.
- **Consecuencia operativa:** el plan solo mira **premercado** (`R-15`, desde Tokio) y **ventana americana** (`R-02`). Ninguna sesión intermedia genera nada.

### D-13 · El Giro como tipo de entrada — DESCARTADO
- **El curso lo enseña** con regla propia: *"entre el break a favor y el break en contra deben haber 4 velas, siendo el giro la 5ª"*.
- **El operador (24/08/2026):** *"Giro fuera del plan"*. Solo opera **IRI** y **Reingreso** *(desde el 23/09/2026 el setup IRI se llama **Continuación**)*.
- **Corrección del auditor:** yo tenía inventariados **4 tipos de entrada** (Continuación, Reingreso, Giro, Patrón de Apertura). Son **2 familias y 2 mecánicas**. El "Patrón de Apertura" no era una familia aparte: es `IRI Apertura`.
- **Riesgo:** ninguno. Es una entrada que no ejecuta.

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
