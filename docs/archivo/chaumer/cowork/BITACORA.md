# BITÁCORA DE LA FASE 1 — registro cronológico

> 📎 **Archivo de historia.** Se separó de `01_Plan\ESTADO.md` el **07/09/2026**, donde ocupaba
> el 80 % del documento. Aquí está **cómo se llegó** al plan: las sesiones revisadas vela a vela,
> las correcciones, las contradicciones que se mataron y las decisiones con su fecha.
>
> **No es fuente de verdad.** Las reglas vigentes están en `01_Plan\reglas.json`; el estado de
> hoy, en `01_Plan\ESTADO.md`. Aquí puede haber códigos de la numeración anterior al 06/09/2026
> y conclusiones que después se corrigieron —cuando eso pasa, la entrada lo dice.

---

## PAUSA — 27 de agosto de 2026

### Objetivo final del proyecto (declarado por el operador)
Todo el trabajo de reglas es el insumo para construir después, en Claude Code,
un **portal web** con la metodología completa. Los documentos de `01_Plan\` son
el contenido del portal; `05_Backtesting\lector.py` es el motor.

### Dónde quedamos exactamente
- Validación día por día: **6, 7 y 10 de julio cuadran vela por vela**.
- **8 de julio validado hasta la vela de las 09:18** (7 zonas). Falta 09:19 → cierre.
- Siguiente paso al retomar: `python3 zonas.py 20260708 1030` y revisar desde 09:19.

### Preguntas abiertas al operador (sin responder)
1. El tramo 08:51–09:12 del 8 de julio quedó sin ninguna zona marcada (el filtro
   del 50% bloqueó 8 candidatas seguidas). ¿Coincide con lo que él marcaría?
2. La resistencia 29.269,75–29.299,25 se solapa con el soporte 29.277,50–29.303,50
   que sigue marcado. ¿Debe seguir viva la zona vieja?
3. ¿Cuánta separación entre zonas del mismo tipo sigue contando como una sola zona?
   (caso 09:16 vs 09:21, 1,25 puntos, sin tocarse)
4. ¿La prohibición de FOMC cubre toda la sesión o solo el anuncio?
5. ¿Hubo FOMC en agosto de 2026?
6. Fechas y horas de noticias rojas (de su bitácora).

### Reglas confirmadas pendientes de escribir en el plan
- La zona se estira solo hacia el nuevo extremo; el otro borde no se mueve.
- El rompimiento con mecha no mata la zona; se cuenta el cierre.
- No se solapan zonas de tipo distinto mientras una esté vigente.
- Una resistencia superada cambia de papel a soporte y sigue ocupando la banda.
- El rectángulo de la zona se dibuja desde la vela origen, no desde la de confirmación.
- El orden de lo que hace la vela por dentro decide qué vela sostiene la zona.

### Nota
Los resultados de 39 sesiones (+21,75 pts) son **anteriores** a estas correcciones
de zonas. Hay que volver a correrlos cuando cierre la validación.

---

## Reglas nuevas confirmadas — 27 de agosto de 2026 (sesión larga)

1. **El rompimiento se lee por la MECHA, no por el cierre.** Basta pasar 1 tick del
   borde de la zona. (Caso: la vela 08:37 del 8/7 cierra dentro de la zona pero su
   mínimo baja de 29.277,50 → rompe.)
2. **Una zona no queda invalidada por el rompimiento solo: hace falta la vela de
   consecución.** La vela de consecución es la que dice que la zona fue realmente
   traspasada. Sin consecución dentro del plazo, la zona sigue intacta.
3. **Traspasada por los dos lados = zona INVÁLIDA.** Inválida es inválida: no cuenta
   para nada — ni para frenar un objetivo, ni para medir la mitad entre zonas.
   (Caso 8/7: soporte de la 08:36 → rompe 08:37, consecución 08:38 hacia abajo;
   reingreso 08:40, consecución 08:41 hacia arriba → inválida en la 08:41.)
4. **Una sola zona entre zonas por banda y por jornada (regla de Alfredo).** La banda
   va del borde interno de la zona de abajo al borde interno de la de arriba. El
   PRIMER RETROCESO que aparezca dentro la resuelve: si respeta el 50 % se marca, si
   no lo respeta no se marca — y en los dos casos la banda queda cerrada para el
   resto de la jornada.
5. **La banda no se vuelve a abrir** aunque se mueran las zonas que la formaron.
6. **Salir de la banda no es geometría: es rompimiento + consecución.** Solo cuando
   el mercado rompe la zona del borde Y consigue la consecución está fuera.
7. **Generalización confirmada:** no se marca zona al otro lado de ninguna zona viva
   cuyo rompimiento esté esperando consecución. (Casos 8/7: la vela 09:13 no marca
   nada porque solo rompe el soporte de la 08:39 — la consecución llega en la 09:16;
   la vela 09:44 no marca nada porque rompe el soporte de la 09:16 y la consecución
   solo llega en la 09:47.)

### Preferencias de gráfica (nuevas)
- Todas las zonas del **mismo color gris**, resistencias y soportes.
- **Línea blanca** uniendo el extremo de cada corrida con el extremo de cada
  retroceso (zigzag). Confirmada como correcta por el operador.
- Sin cuadrícula, pero **sí** la línea horizontal encima de las horas y la vertical
  al lado de los precios.

### Estado del 8 de julio
Validado **de la apertura al cierre de la ventana**. 9 zonas en la jornada.
Sin diferencias pendientes con el operador. Siguiente: martes 7 ya estaba, faltan
los demás días — hay que **re-verificar 6, 7 y 10 de julio** con estas reglas nuevas.

---

## FORMATO ESTÁNDAR DE LAS GRÁFICAS DE BACKTESTING (operador, 27/08/2026)

Toda gráfica de backtesting lleva:
1. **Marcación de zonas** — todas del mismo gris, vigentes con trazo grueso,
   inválidas apagadas.
2. **Zigzag blanco** de corridas y retrocesos (une el extremo de cada corrida con
   el extremo de cada retroceso).
3. **El gráfico se CORTA en la vela donde la operación da su resultado.** No se
   sigue marcando ni graficando después del primer setup válido: solo se lleva
   hasta que la entrada dé stop o target.
4. **Solo se llega hasta las 10:30** cuando la jornada NO dio ningún setup válido.

Script: `05_Backtesting\dia.py`  →  `python3 dia.py AAAAMMDD salida.png`

## 10 de julio de 2026 (VIERNES) — validado
Zona de premercado válida: vela de las 7:14 pm, volumen 2.290 (>2.000),
resistencia 29.872,00 – 29.878,75. Única del premercado ese día.
Zonas de sesión hasta el corte: resistencia 29.903,50 – 29.926,00 (vela 8:36) y
resistencia 29.922,50 – 29.936,75 (vela 8:38).
**Operación:** IRI largo. Rompimiento con la vela 8:37, orden un tick sobre su
máximo en 29.934,00; consecución y llenado con la vela 8:38. Stop en el mínimo del
retroceso que originó la zona (mínimo de la 8:37) = 29.880,50 → riesgo 53,50 pts.
Objetivo 1:1 = 29.987,50, libre de zonas. **STOP en la vela de las 8:40.
−53,50 pts = −107,00 USD con 1 MNQ.** Validado por el operador.

---

## Reglas confirmadas — 9 de julio (sesión del 27/08/2026)

### La dirección de la vela de apertura NO sesga la jornada
Verbatim del operador: *"la dirección de la vela de apertura no quiere decir que toda
la jornada va a ser en esa dirección, solo da el mayor grado de favorabilidad a un
trade IRI en la apertura, pero no quiere decir que se sesgue y no pueda operar un
trade IRI en dirección contraria."*
→ Se buscan entradas de continuación en LOS DOS SENTIDOS. Cada tramo, suba o baje,
deja su zona, y esa zona sirve para entrar a favor de ese tramo.
→ **PENDIENTE PARA LA FASE DE CONTEXTUALIZACIÓN:** cuánto pesa esa "mayor
favorabilidad" del sentido de la apertura. El operador pidió dejarlo documentado
para validarlo después.

### Cancelación de una orden pendiente (reemplaza la regla anterior)
Un retroceso nuevo **NO** cancela la orden. Solo se cancela por dos motivos:
1. **Pasan 5 velas desde el rompimiento sin que llegue la consecución.**
2. **El precio vuelve al extremo del retroceso**, que es el mismo punto del stop.
(Y por fin de ventana, que ya estaba.)

### 9 de julio de 2026 (JUEVES) — validado
Vela base 8:31 bajista; la caída muere en la 8:33 y el mercado sube 190 puntos.
Resistencia de la vela 8:39 = 29.847,75 – 29.863,00. La vela 8:43 la rompe
(máximo 29.871,25, a UN TICK de la entrada). Orden en 29.871,50, stop en el fondo
del retroceso 29.811,75, riesgo 59,75 pts, objetivo 29.931,25.
La 8:44 y la 8:45 no llegan; **la 8:46 hace la consecución y llena la orden**, todavía
dentro del plazo de 5 velas. **STOP en la vela de las 8:50. −59,75 pts = −119,50 USD.**
Operación confirmada como válida por el operador.

### Días que hay que volver a mirar
El **7 de julio** cambió al quitar el sesgo de dirección: ahora sale un IRI corto a las
8:54 que antes no salía. El 6 y el 10 siguen igual que como se validaron.

---

## Rompimiento sin consecución al vencer el plazo (operador, 27/08/2026)

Si se rompe una zona y pasan **5 velas sin consecución**:
- **Rompimiento con MECHA** (la vela no cerró fuera de la zona) → **la zona SE ESTIRA**
  hasta el extremo de esa mecha.
- **Rompimiento con CUERPO** (la vela cerró fuera) → **nace una ZONA APÉNDICE**, desde el
  cuerpo de la vela hasta donde termina su mecha. **Quedan vigentes las DOS zonas**: la que
  se intentó romper y la apéndice. Cuando las dos sean superadas por ambos lados, quedan
  inválidas.

Caso real 7/7: la vela 8:39 rompe con cuerpo el soporte de la 8:36 (cierra en 29.502,75,
bajo el piso 29.503,75) y ninguna de las 5 velas siguientes baja de 29.491,25 → en la vela
de las **8:44** nace la apéndice **29.491,25 – 29.502,75**.

### Corrección al filtro de "salida sin consecución"
Lo que decide es el **EXTREMO del movimiento**, no el rectángulo de la zona candidata.
Si el extremo pasa el borde de una zona viva cuyo rompimiento espera consecución, no se
marca nada — aunque el rectángulo de la zona nueva se solape con la vieja.
Caso real 7/7: la vela 8:52 rompe la apéndice (mínimo 29.477,25) y la **8:54 hace la
consecución dentro del plazo** → el rompimiento fue exitoso, así que en la 8:53 NO se
marca soporte pese a que hubo retroceso.

### 7 de julio de 2026 (MARTES) — recalculado
11 zonas. **IRI corto a las 9:37**, entrada 29.241,50, stop 29.313,00, objetivo 29.170,00,
riesgo 71,50 pts → **STOP en la vela de las 9:54. −71,50 pts = −143,00 USD.**

## Marcador de los 5 días validados
6/7 Reingreso corto STOP −58,75 · 7/7 IRI corto STOP −71,50 · 8/7 FOMC NO OPERA ·
9/7 IRI largo STOP −59,75 · 10/7 IRI largo STOP −53,50. **Total −243,50 pts.**
Sin significado estadístico (4 trades) y sin la capa de contexto.

---

## El STOP de una entrada de continuación (operador, 27/08/2026) — CORRIGE la regla anterior

El stop **NO** es solo el techo (o suelo) del retroceso que originó la zona.
Es **el punto más extremo que haya hecho el mercado desde que nació la zona hasta el
rompimiento**. Todo lo que pase en medio cuenta.

Caso real 7/7: el soporte de la vela 9:27 se rompe con la vela 9:36. El retroceso que
lo originó (9:28–9:30) tiene su techo en 29.313,00 — ese era mi stop viejo. Pero la vela
de las 9:32 subió hasta **29.327,75**, casi 15 puntos por encima. Con la regla correcta el
stop es 29.327,75, el riesgo sube a 86,25 pts y **el trade queda descartado** por pasarse
del tope de 80.

### 7 de julio de 2026 (MARTES) — recalculado otra vez
El primer setup válido pasa a ser el **IRI corto de las 9:43**: entrada 29.226,00,
stop 29.282,50, objetivo 29.169,50, riesgo 56,50 pts → **STOP en la vela de las 9:48.
−56,50 pts = −113,00 USD.**

## Marcador actualizado de los 5 días
6/7 −58,75 · 7/7 −56,50 · 8/7 NO OPERA (FOMC) · 9/7 −59,75 · 10/7 −53,50
**Total −228,50 pts.** Sin significado estadístico y sin capa de contexto.

---

## La CONSECUCIÓN no tiene plazo (operador, 27/08/2026, caso 13 de julio)

Hay que separar dos cosas que yo tenía mezcladas:

1. **El plazo de 5 velas SOLO decide qué pasa con la geometría de la zona.**
   Vencido el plazo sin consecución: mecha → se estira; cuerpo → nace la apéndice.
2. **El traspaso de la zona NO tiene plazo.** El rompimiento queda pendiente
   indefinidamente y, cuando llegue la consecución — aunque sea 25 velas después —
   la zona queda traspasada en ese sentido. Las dos cosas ocurren sobre el MISMO
   rompimiento: primero nace la apéndice, y más tarde el traspaso se confirma igual.

### La vela que confirma un traspaso no abre el rompimiento del otro lado
El rompimiento en sentido contrario se busca a partir de la vela SIGUIENTE.
Si no, la mecha de la propia vela de consecución cuenta como rompimiento contrario
y las fechas se adelantan.

### Verificación en el 13 de julio (todo cuadra al tick con el operador)
- **Soporte de la vela 8:43** (29.552,25 – 29.571,25): rompimiento 8:46, consecución 8:52
  → roto como soporte, pasa a resistencia. Rompimiento 8:58, consecución 8:59
  → **inválida a las 8:59.**
- **Apéndice de la vela 8:46** (29.535,75 – 29.544,75): rompimiento 8:52, consecución 9:17
  → roto como soporte. Rompimiento 9:18, consecución 9:20 → **inválida a las 9:20.**
- **Apéndice de la vela 8:52** (29.518,00 – 29.521,75): rompimiento 9:17 con mecha, sin
  consecución en 5 velas → **se estira a 29.488,50 – 29.521,75.** Sigue vigente.
- La "apéndice de la vela 8:57" que yo dibujaba **no existe** (era consecuencia de no
  invalidar a tiempo la zona de la 8:43).

### 13 de julio de 2026 (LUNES)
6 zonas. **Reingreso corto a las 9:42**, entrada 29.644,75, stop 29.724,00,
objetivo 29.565,50, riesgo 79,25 pts → **STOP en la vela de las 10:01.
−79,25 pts = −158,50 USD.**

## Marcador de los 6 días
6/7 −58,75 · 7/7 −56,50 · 8/7 NO OPERA · 9/7 −59,75 · 10/7 −53,50 · 13/7 −79,25
**Total −307,75 pts.** 0 de 5. Sin capa de contexto y sin significado estadístico.

---

## EL REINGRESO ES INMEDIATO (operador, 27/08/2026 — corrige el entendimiento anterior)

Un reingreso NO es "el precio vuelve a la zona en cualquier momento". Es un
**rompimiento cuya consecución falla en el acto**:

1. La zona se rompe.
2. Llega la consecución.
3. Si el precio **se devuelve enseguida y vuelve a entrar en la zona**, esa consecución
   fue falsa → **eso es el reingreso**, y se entra en el sentido de la vuelta.
4. Si el precio **pasa del extremo de la vela de consecución**, el rompimiento quedó
   bueno y **la ventana de reingreso se cierra para siempre**. Aunque el precio vuelva
   a pasar por la zona media hora después, ya no hay reingreso.

### Los dos casos que fijan la regla
- **6 de julio (SÍ):** zona R 29.926,50 – 29.939,25. Rompe la vela 8:46; la 8:47 hace la
  consecución subiendo a 29.967,25 y **esa misma vela** se desploma a 29.908,75, otra vez
  bajo la zona → reingreso. Trade validado por el operador.
- **13 de julio (NO):** zona R 29.652,25 – 29.666,75. Rompe la vela 9:25 (máx 29.677,25),
  consecución la vela **9:27** (máx 29.681,00), y el precio sigue subiendo hasta 29.724,00.
  Rompimiento bueno → lo de la vela 9:41 NO es reingreso.

### 13 de julio de 2026 (LUNES) — versión final
7 zonas. **Reingreso corto a las 10:04**: rompe la resistencia 29.725,75 – 29.737,25 con la
vela 10:01, consecución 10:02, y la 10:03 se devuelve y la cruza → entrada 29.724,00,
stop 29.752,50, riesgo 28,50 pts → **TARGET en la vela de las 10:09. +28,50 pts = +57,00 USD.**

## Marcador de los 6 días
6/7 −58,75 · 7/7 −56,50 · 8/7 NO OPERA · 9/7 −59,75 · 10/7 −53,50 · 13/7 **+28,50**
**Total −200,00 pts.** 1 de 5.

---

## Formato de gráfica — ajustes del 27/08/2026 (ya aplicados en dia.py)
- **Regla de la operación en la zona de la entrada**: fondo rojo tenue entre la entrada y
  el stop, fondo verde tenue entre la entrada y el objetivo. Solo sobre el tramo de la
  operación, NO en todo el ancho de la ventana.
- En la leyenda **no** se escribe dónde se corta el gráfico (se sobreentiende).
- Se escribe **"Operación"** completo, no "OPERA".
- El **título de la fecha va centrado**.

## PAUSA — fin de la sesión del 27 de agosto de 2026
Días cerrados y validados por el operador: **6, 7, 8, 9, 10 y 13 de julio.**
Siguiente día a revisar: **martes 14 de julio de 2026.**

### Lo que cambió hoy en el motor (todo confirmado por el operador)
1. La dirección de la vela de apertura no sesga la jornada: se opera en los dos sentidos.
2. Cancelación de orden: solo por 5 velas sin consecución o por volver al punto del stop.
   Un retroceso nuevo NO cancela. La caducidad se mira ANTES del llenado.
3. El stop es el extremo alcanzado desde que nació la zona hasta el rompimiento.
4. Rompimiento sin consecución al vencer el plazo: mecha → estira; cuerpo → zona apéndice.
5. La consecución que confirma el traspaso de una zona NO tiene plazo.
6. La vela que confirma un traspaso no abre a la vez el rompimiento del otro lado.
7. El reingreso es inmediato: si el precio pasa del extremo de la vela de consecución,
   la ventana se cierra para siempre.

---

## ✅ DOCUMENTACIÓN PUESTA AL DÍA — 27/08/2026, cierre de sesión

Hasta este punto todo lo de las sesiones del 26 y el 27 vivía **solo en este ESTADO.md**.
Ya está volcado a los documentos de trabajo. Resumen de lo que cambió en cada uno:

| Documento | Qué se hizo |
|---|---|
| **TRADING_PLAN_CHAUMER.md** | v1.12 → **v1.16**. Nueva sub-fase **F1.12** con `R-27` a `R-19`. Corregidas `R-29` (reescrita al revés), `R-20`, `R-21`, `R-12`, `R-13`, `R-26`, `R-32` y la nota de `R-16` sobre `R-29`. Historial ampliado. **38 reglas** |
| **reglas.json** | 30 → **38 reglas**. Añadidas `R-07`, `R-08`, `R-16` (faltaban desde el 26) y `R-27` a `R-19`. Actualizadas `R-29`, `R-20`, `R-21`, `R-13`, `R-26`, `R-32` |
| **GLOSARIO.md** | Corregidos ROMPIMIENTO Y CONSECUCIÓN, VIGENCIA, EXTENSIÓN, ZONA APÉNDICE, REINGRESO y ZONAS ENTRE ZONAS. Tres entradas nuevas: **SALIDA DE UNA ZONA**, **SESGO DE LA APERTURA** y el bloque de una-sola-zona-por-banda |
| **PARAMETROS.md** | `PLAZO_CONSECUCION` precisado; nuevos **`VENTANA_REINGRESO`** y **`ORIGEN_DEL_STOP`** |
| **CHECKLIST_DIARIA.md** | Corregido el bloque de cancelación de la orden (decía lo contrario). Dos bloques nuevos: comprobaciones de marcado y comprobaciones antes de enviar |
| **GALERIA.md** | Cuatro casos nuevos: **G-13** (8 jul, el día que reescribió el marcado), **G-14** (9 jul, el sesgo), **G-15** (7 jul, apéndice y stop), **G-16** (13 jul, los dos reingresos). Más el resumen del backtesting |
| **PENDIENTES.md** | **`P-19` reabierto y cerrado al revés.** **`P-22` cerrado.** Cuatro nuevos: `P-25` (zona estirada), `P-26` (alcance del FOMC), `P-27` (calendario de noticias rojas), `P-28` (separación entre zonas del mismo tipo) |
| **CONTEXTUALIZACION.md** | Dos elementos nuevos: **C-08** (favorabilidad del sentido de la apertura) y **C-09** (la lateralidad puede que ya esté cubierta por la regla del 50 %) |

### La contradicción que había que matar
El plan decía que una orden pendiente **se cancela por un retroceso nuevo** y que **no se cancela**
por pasar 5 velas sin consecución. Es exactamente al revés. Estaba en `R-29`, en la
`CHECKLIST_DIARIA`, en `reglas.json`, en la nota de `R-16` y en el cierre de `P-19`.
**Corregido en los cinco sitios**, con la entrada vieja del historial marcada como superada.


---

# SESIÓN 01/09/2026 — MARTES 14 DE JULIO

## Resultado del día
**NO HAY OPERACIÓN.** 5 zonas marcadas, 3 vigentes al llegar a las 10:30.
El operador confirma el marcado: *"la marcación está bien, yo la tengo idéntica."*

## Lo nuevo que se confirmó
**La zona de premercado cuenta como borde de banda**, igual que cualquier otra zona,
para la regla de una-sola-zona-por-banda. Palabras del operador:
*"la zona de premercado también se tiene en cuenta como borde de banda."*

Escrito en:

| Documento | Qué se escribió |
|---|---|
| **TRADING_PLAN_CHAUMER.md** | `R-17` gana el punto 7 de su tabla y el caso real del 14/07. `R-15` remata su fila con la referencia cruzada |
| **reglas.json** | `R-17` gana la condición `bordes_de_la_banda` y su nota con el caso; `R-15` amplía `comportamiento_posterior` |
| **GLOSARIO.md** | Punto 7 en el bloque de una-sola-zona-por-banda, el caso del 14/07, y la fila de comportamiento posterior de ZONA DE PREMERCADO |
| **GALERIA.md** | Nuevo caso **G-17** y el 14 jul en la tabla resumen |

## El día, al tick
- Vela de apertura **bajista**. La caída muere en la **8:36** → soporte **29.685,00 – 29.693,00**.
- Arriba, dos zonas de premercado: **29.901,25 – 29.908,25** (19:31) y **29.905,50 – 29.921,75** (19:32).
- Banda de **208,25 pts**, mitad en **29.797,13**.
- Primer retroceso dentro: vela **8:39**, sube a **29.798,00** → se pasa por **0,875 pts = 3½ ticks**.
  No se marca. **La banda queda cerrada.**
- **De 8:41 a 9:10 no se marca nada.** Las zonas reaparecen al salir por debajo del soporte
  de la 8:36: velas **9:11** y **9:20**.
- Dos cortos generados y descartados por `STOP_MAX`: el de las **9:06** con 157,75 pts de riesgo
  y el de las **9:16** con 84,00 pts.

> ⚠️ Un día entero decidido por **tres ticks y medio**. Queda registrado tal cual: la regla es
> mecánica y no admite tolerancia, pero el caso conviene tenerlo a la vista si más adelante
> aparece la pregunta de si el 50 % necesita un margen.

## Estado del backtesting
Siete días validados: **6, 7, 8, 9, 10, 13 y 14 de julio**. Cinco operaciones, **−200,00 pts**.
Sigue sin valor estadístico y sigue faltando la capa de contextualización.

**Siguiente:** miércoles 15 de julio.


---

# SESIÓN 01/09/2026 — MIÉRCOLES 15 DE JULIO

## Resultado del día
🟢 **IRI corto · +56,25 pts = +112,50 USD.** Primera operación ganadora del backtesting
y primer IRI que llega a target. El operador confirma: *"perfecto, estamos igual."*

## El día, al tick
- Apertura bajista: de **29.977,50** (8:31) a **29.912,50** (8:34).
- La **8:35** confirma el retroceso → **soporte 29.912,50 – 29.931,25** sobre la vela 8:34.
- La **8:36** hace dos cosas en el mismo minuto: sube a **29.966,50** y deja la
  **resistencia 29.953,25 – 29.966,50**, y con su mínimo de **29.910,50 rompe el soporte**.
- Orden corta en **29.910,25** (un tick bajo el mínimo de la vela de rompimiento).
  Stop en el punto más alto desde que nació la zona: **29.966,50**. Riesgo **56,25 pts**.
  Objetivo **29.854,00**, libre de zonas.
- La **8:37** se queda a **4 ticks** de llenar (mínimo 29.911,25).
- La **8:38** llena y se desploma. La **8:39** baja a **29.852,00** → **TARGET**.
- Sin zonas de premercado: ninguna vela superó el umbral de volumen esa madrugada.

## Lo que se confirmó
**Una misma vela puede marcar una zona por un lado y romper otra por el otro en el mismo
minuto**, y la zona se marca ahí, sin esperar a la vela siguiente. Caso: la vela 8:36.
No hace falta regla nueva — es coherente con lo ya escrito; queda como caso testigo en `G-18`.

## Cambio en la gráfica de backtesting (petición del operador)
**Se quitan las tres líneas horizontales** de entrada, stop y objetivo, con sus etiquetas.
La regla de color —franja roja de la entrada al stop, franja verde de la entrada al
objetivo— ya dice dónde está cada nivel. Palabras del operador:
*"entre más limpio sea el gráfico, mucho mejor."* Aplicado en `05_Backtesting\dia.py`.

## Estado del backtesting
Ocho días validados: **6, 7, 8, 9, 10, 13, 14 y 15 de julio**.
Seis operaciones · **−143,75 pts**. Sigue sin valor estadístico y sigue faltando contexto.

**Siguiente:** jueves 16 de julio.


---

# SESIÓN 01/09/2026 — JUEVES 16 DE JULIO

## Resultado del día
🟢 **IRI corto · +75,50 pts = +151,00 USD.** Segunda ganadora seguida.
El operador confirma el día y las dos preguntas con un **sí** a cada una.

## El día, al tick
- Apertura alcista que se agota en la propia vela **8:31**: sube a **29.532,00**
  → **resistencia 29.504,75 – 29.532,00**.
- Caída limpia hasta **29.399,75** (vela 8:36). Las **8:37 y 8:38** rebotan y confirman
  el retroceso → **soporte 29.399,75 – 29.417,25** sobre la vela 8:36.
  El rebote llega a **29.471,00**.
- La **8:39 rompe** el soporte (mínimo 29.395,75). Orden corta en **29.395,50**.
  Stop en 29.471,00 → **riesgo 75,50 pts**. Objetivo **29.320,00**, libre de zonas.
- La **8:40 llena**. La **8:41 sube a 29.434,50** — 39 pts en contra — y no toca el stop.
- La **8:45 baja a 29.308,50** → **TARGET**.

## Lo que se confirmó
1. **El máximo de stop es una línea dura.** 75,50 pts es el **94 %** del tope y la operación
   se toma igual. **No hay margen de seguridad por debajo del límite.** Escrito en `PARAMETROS.md`.
2. **Después de llenar se aguanta**, aunque la operación se ponga fea. Aplicación literal
   de que la posición no se gestiona: solo stop u objetivo.

Ninguna de las dos es regla nueva — las dos son precisiones sobre reglas ya escritas.
Caso testigo: `G-19`.

## Estado del backtesting
Nueve días validados: **6, 7, 8, 9, 10, 13, 14, 15 y 16 de julio**.
Siete operaciones · **−68,25 pts**. Dos ganadoras seguidas al cierre.

**Siguiente:** viernes 17 de julio.


---

# SESIÓN 01/09/2026 — VIERNES 17 DE JULIO

## Resultado del día
🔴 **IRI corto · −77,25 pts = −154,50 USD.** Se corta la racha de dos ganadoras.
El operador confirma el día y la corrección de marcado.

## El día, al tick
- Apertura sube a **28.686,00** (vela 8:33) → resistencia 28.680,00 – 28.686,00.
- **Ocho velas bajistas seguidas** hasta **28.456,00** en la vela **8:41**, que se da la vuelta
  y cierra alcista → **soporte 28.456,00 – 28.463,00** (otra vez una sola vela hace mínimo y giro).
- El rebote 8:41–8:42 llega a **28.512,00** → resistencia 28.478,25 – 28.512,00.
- La **8:43 rompe** el soporte (mínimo 28.435,00). Orden corta en **28.434,75**,
  stop 28.512,00 → **riesgo 77,25 pts = 97 % del tope**. Objetivo 28.357,50.
- La **8:44 llena**. El precio no vuelve a bajar: lo más bajo fue 28.408,25.
- La **8:49 sube a 28.517,50** → **STOP**.

## Lo que se corrigió
🔧 **El marcado de zonas se detiene en la vela del LLENADO.** En el gráfico aparecía un
soporte nacido con la vela 8:45, ya con la orden llena. El operador confirma que al llenarse
la orden **termina el análisis del día**. Aplicado en `05_Backtesting\dia.py`: las zonas se
dibujan hasta la vela del llenado; después solo siguen las velas hasta el resultado.
Afectaba también al gráfico del 16 de julio, ya regenerado.

## Nota sobre el tope de stop
Tercera operación seguida con el stop pegado al máximo: **75,50 · 77,25 pts**.
Dos ganaron, ésta perdió. El filtro no discrimina dentro del rango permitido — solo corta
lo que se pasa.

## Estado del backtesting
Diez días validados: **6, 7, 8, 9, 10, 13, 14, 15, 16 y 17 de julio**.
Ocho operaciones · **−145,50 pts**.

**Siguiente:** lunes 20 de julio.


---

# SESIÓN 01/09/2026 — LUNES 20 DE JULIO

## Resultado del día
🟢 **IRI corto · +54,50 pts = +109,00 USD.**
🏁 **Primer día que NO cambia ni corrige ninguna regla.** Todo salió de lo ya escrito.

## Lo importante del día: tres órdenes, dos canceladas
| # | Orden | Riesgo | Qué pasó |
|---|---|---|---|
| 1 | IRI largo 8:38 · 29.167,50 · stop 29.126,25 | 41,25 | cancelada 8:40 — el precio volvió al punto del stop |
| 2 | IRI corto 8:40 · 29.119,25 · stop 29.167,25 | 48,00 | cancelada 8:44 — el precio volvió al punto del stop |
| 3 | IRI corto 8:57 · 29.018,25 · stop 29.072,75 | 54,50 | **llenada 8:58 → TARGET 9:02** |

Primera validación en datos de la **cancelación reescrita**: las dos se cayeron por volver al
punto del stop, ninguna por plazo. Cuatro minutos separan una orden larga de una corta.

## La duda que resolvió el operador
Preguntó por qué había dos soportes casi pegados. La respuesta: **la vela 8:40 solo rompe**.
Rompe el soporte de la 8:37 **con el cuerpo** (cierra en 29.125,00, bajo el piso) y su mecha
llega a 29.119,50. No llega consecución en 5 velas → al vencer el plazo, y por ser rompimiento
de cuerpo, nace la **zona apéndice 29.119,50 – 29.125,00**. El marcado directo estaba
bloqueado: en el retroceso de la 8:42 el candidato fue rechazado por rompimiento pendiente.
El operador acepta la explicación. **Sin cambios en las reglas.**

## Estado del backtesting
Once días validados: **6, 7, 8, 9, 10, 13, 14, 15, 16, 17 y 20 de julio**.
Nueve operaciones · **−91,00 pts**.

### Reglas tocadas por día — la señal de cierre de la fase 1
`6/7: 1 · 7/7: 3 · 8/7: 3 · 9/7: 2 · 10/7: 2 · 13/7: 3 · 14/7: 1 · 15/7: 0 · 16/7: 2 · 17/7: 1 · 20/7: 0`

La fase 1 se cierra cuando pasen **tres o cuatro días seguidos en cero**, no al llegar al día 20.

**Siguiente:** martes 21 de julio. Hay datos hasta el 24 de agosto (39 jornadas completas).


---

# 🏁 CIERRE DE LA FASE 1 — 01/09/2026

**Decisión del operador:** cerrar la fase 1 y pasar a la fase 2, la construcción del portal
web en Claude Code.

## Con qué se cierra
**38 reglas · 12 sub-fases · 11 sesiones validadas al tick · 21 casos · 24 términos medibles.**
El plan dejó de moverse: de 2-3 reglas tocadas por día al principio, a cero los días 15 y 20
de julio.

## Con qué NO se cierra — cuatro huecos declarados
1. **El test ciego no se ejecutó.** Nuevo `P-29`. Es lo único que demuestra que el documento
   se sostiene solo, sin el operador corrigiendo al lado.
2. **No hay regla de parada** (`P-21`).
3. **Falta la capa de contextualización** — decidió 2 de 4 días de "no operar" en las sesiones
   grabadas de Chaumer.
4. **Las cifras del backtesting no miden la estrategia** (`P-27`): 9 operaciones, reglas que
   cambiaron durante la propia revisión, sin filtro de noticias rojas, sin contexto.

## Documentos escritos en este cierre
| Documento | Qué es |
|---|---|
| `01_Plan\CIERRE_FASE_1.md` | el acta de cierre: qué está probado y qué no, con las siete correcciones que reescribieron el plan |
| `..\CLAUDE.md` | instrucciones para Claude Code en la fase 2: fuentes de verdad, reglas del proyecto, estándar visual, vocabulario y cómo hablarle al operador |
| `..\04_Web\BRIEF_PORTAL.md` | qué tiene que resolver el portal, qué NO puede hacer, y las cinco decisiones que el operador aún no ha tomado |

## Documentos actualizados
`TRADING_PLAN_CHAUMER.md` → **v2.0**, `F1.10` cerrada y `F1.11` marcada como hueco declarado,
advertencia de uso reescrita. `PENDIENTES.md` → nuevo `P-29`.

## Estado del backtesting al cerrar
Once días: **6, 7, 8, 9, 10, 13, 14, 15, 16, 17 y 20 de julio de 2026**.
Nueve operaciones · **−91,00 pts**. Sin valor estadístico, por los cuatro motivos de arriba.

---

# ▶️ FASE 2 — PORTAL WEB

**Dónde:** `04_Web\` (vacía a esta fecha).
**Cómo se arranca:** abrir Claude Code en `E:\Proyectos\Chaumer`. `CLAUDE.md` se carga solo.
**Qué leer primero:** `01_Plan\CIERRE_FASE_1.md` → `04_Web\BRIEF_PORTAL.md`.
**Fuente de verdad del portal:** `01_Plan\reglas.json`.

**Primera conversación pendiente con el operador:** las cinco decisiones del brief — portal
local o accesible desde fuera · si lo consulta mientras opera · dónde vive la bitácora · si
lee datos de NinjaTrader · si genera gráficas o solo las muestra.


---

# 🔵 01/09/2026 — REGLA NUEVA DESPUÉS DEL CIERRE: `R-39`

Salió dibujando los diagramas didácticos de la zona apéndice para el portal.

## Lo que dijo el operador
**El plazo de 5 velas es un TOPE, no una espera obligatoria.** Si antes de cumplirse el mercado
arma una **estructura completa en sentido contrario** al rompimiento, la geometría se resuelve
ahí mismo: se estira la zona o nace la apéndice, sin esperar.

### La estructura al contrario — tres velas (ejemplo: soporte roto hacia abajo)
| Vela | Qué hace | Condición medible |
|---|---|---|
| 1ª | no da consecución y **sube** | su mínimo no pasa del extremo de la vela de rompimiento |
| 2ª | **retroceso** | su mínimo es **MENOR** que el de la vela anterior **y NO pasa** del extremo de la vela de rompimiento |
| 3ª | **no sigue bajando: vuelve a subir** | aquí queda armada → **aquí se marca la zona** |

🔴 Si el mínimo de la 2ª vela pasara del extremo de la vela de rompimiento, **eso es la
consecución**, no un retroceso: no hay apéndice, la zona queda traspasada.

Aplica igual al revés, con una resistencia rota hacia arriba. Confirmado por el operador.

## El contraejemplo que la delimita
**20/07/2026.** Tras romper en la 8:40 el precio subió **cuatro velas seguidas** (8:42 a 8:45)
**sin hacer retroceso en el medio** → nunca armó estructura → la apéndice nació por plazo
vencido, en la 8:45. **Subir no basta.** Por eso ese día sigue marcado igual.

## Precisiones de dibujo
- La apéndice es **del mismo gris que cualquier zona**.
- Se dibuja **desde la vela de rompimiento**, su vela origen, aunque no esté marcada hasta que
  el plazo se resuelve.

## Escrito en
`TRADING_PLAN_CHAUMER.md` → **v2.1**, nueva `R-39`, **39 reglas** · `reglas.json` → 39 ·
`GLOSARIO.md` → entrada ZONA APÉNDICE ampliada · `PARAMETROS.md` → el plazo es un tope ·
`CIERRE_FASE_1.md` → sección nueva sobre una regla que llegó después del cierre ·
`PENDIENTES.md` → **`P-30`** y **`P-31`** · `CLAUDE.md`, `BRIEF_PORTAL.md` y `PROMPT_FASE_2.md`
actualizados a 39 reglas.

**Diagramas nuevos:** `02_Assets\diagramas\apendice_caso1_plazo.png` y
`apendice_caso2_estructura.png`.

## Lo que queda abierto por esto
- **`P-30`** — la regla se confirmó sobre la **apéndice**. Que aplique también al
  **estiramiento** (rompimiento con mecha) es **extrapolación del auditor**, no confirmación.
- **`P-31`** — el motor todavía resuelve el plazo solo por vencimiento. Hay que implementarlo y
  volver a pasar las 11 sesiones. Días con eventos de plazo: **7, 13, 16, 17 y 20 de julio**.
  Ninguna de las 9 operaciones validadas depende de esto, pero conviene comprobarlo.

> 🔑 **Anotado sin dramatizarlo:** el plan llevaba dos días en cero reglas movidas y aun así una
> conversación de dibujo destapó una precisión que no estaba escrita. No contradice nada — amplía —
> pero es justo el tipo de hallazgo que el test ciego habría buscado a propósito.


---

# 🔧 04/09/2026 — REVISIÓN COMPLETA DE LAS REGLAS

## Lo aplicado: se elimina `R-39`, era `R-14` otra vez
El auditor escribió `R-39` el 01/09 sin buscar antes. **`R-14`, confirmada el 24/08, ya decía
lo mismo con esas palabras:** *"el plazo de 5 velas es un tope, no una espera"*.

- `R-39` eliminada de `reglas.json` y de todos los documentos.
- Su aportación real —la **definición medible de las tres velas** de la estructura contraria—
  vive ahora dentro de `R-14`.
- `R-14` gana **sección propia** en el plan. Hasta hoy existía solo como una fila de tabla,
  **y ésa es la causa de raíz por la que se pudo duplicar**.
- Plan **v2.2 · 38 reglas**.

## Lo encontrado al revisar las 38 una por una — `PROPUESTA_LIMPIEZA_REGLAS.md`

### 🔴 Cinco contradicciones vivas (más graves que el duplicado)
Reglas confirmadas que siguen diciendo lo que decían **antes** de que el operador las corrigiera:

1. **El stop, en CUATRO sitios con la definición vieja** — `R-32` en `reglas.json`, `R-06`,
   `R-31` y `R-29` siguen diciendo *"el extremo del retroceso"* en vez de *"el extremo desde
   que nació la zona"*, corregido el 27/08.
   ⚠️ **La de `reglas.json` es la peligrosa: el portal se construye contra ese archivo**, así
   que hoy el portal mostraría la definición vieja del stop.
2. **`R-20`** sigue diciendo que la consecución es *"dentro de las 5 velas siguientes"*, cuando
   el 27/08 se confirmó que **la consecución que traspasa una zona no tiene plazo**.

### 🟡 Cuatro fusiones propuestas — 38 → 33
- `R-28` + `R-23` + `R-34` → *"una operación por sesión, la primera que se llene, y ahí termina el día"*
- `R-30` + `R-33` → *"solo hay dos salidas: stop o target"*
- `R-07` + `R-27` → *"la vela de apertura: origen sí, sesgo no"*
- `R-19` disuelta: cinco de sus seis precisiones ya viven en otra regla; solo la de no solapar
  zonas de tipo distinto es propia.

### 🟢 Ocho grupos propuestos, verificados
Perímetro (4) · Estructura (4) · **Marcado de zonas (11)** · Vigencia (3) · Setup y entrada (5) ·
Riesgo, orden y gestión (7) · Filtros de no-operar (3) · Proceso (1). **Las 38 entran, ninguna
se repite, ninguna se queda fuera.**

Hoy las categorías del archivo de reglas están desordenadas: doce reglas en un cajón llamado
`contexto`, y once del mismo tema —marcado de zonas— repartidas en cinco categorías distintas.
El buscador del portal se construye sobre eso.

## Nada más está aplicado
Todo lo de arriba salvo la eliminación del duplicado **es propuesta y espera visto bueno**.


---

# ✅ 04/09/2026 — CINCO CORRECCIONES Y LA NUEVA CATEGORIZACIÓN

## Las cinco definiciones superadas, corregidas
La corrección del stop del **27/08** —*el extremo alcanzado desde que nació la zona*, no solo el
del retroceso— se escribió en el texto de `R-32` y **nunca se propagó**. Seguía la versión vieja en:

| Dónde | Ya corregido |
|---|---|
| `R-32` en `reglas.json` | ⚠️ **la peligrosa** — es el archivo contra el que se construye el portal |
| `R-06` | decía que el stop iba en el extremo del retroceso |
| `R-31` | el filtro del tope medía contra el extremo del retroceso |
| `R-29` | la cancelación se medía contra el extremo del retroceso |
| `R-20` | el enunciado decía que la consecución es *"dentro de las 5 velas siguientes"* |

**Sobre `R-29`, una precisión que no es menor.** Las palabras del operador el 27/08 fueron
*"llega al mismo punto del retroceso, que sería el mismo punto del stop"*. Entonces coincidían.
Desde que `R-32` se corrigió **pueden no coincidir**, y manda **el punto del stop**.
No es interpretación del auditor: se comprobó en `lector.py` que es exactamente lo que hizo el
motor en las **11 sesiones validadas**.

## La nueva categorización, aplicada
Siete grupos, con **Zonas** como una sola categoría de 14 reglas y dos apartados dentro:

`perímetro 4 · estructura 4 · ZONAS 14 (marcado 11 + vigencia 3) · setup y entrada 5 ·
riesgo, orden y gestión 7 · filtros de no-operar 3 · proceso 1`

`reglas.json` gana cuatro campos —`categoria_nombre`, `categoria_descripcion`, `categoria_orden`
y `subcategoria`— y **queda ordenado por grupo**, para que el portal no tenga que inventar nada.

`R-20` queda en zonas · vigencia, pero define también la entrada: **debe enlazarse desde Setup y
entrada**.

## Estado
Plan **v2.3 · 38 reglas · cero contradicciones vivas**.
Pendiente: **las cuatro fusiones** de `PROPUESTA_LIMPIEZA_REGLAS.md` — llevarían el plan a 33.

---

# 🔵 06/09/2026 — SALE EL NQ, Y SE RENUMERAN LAS 38 REGLAS

## 1 · El NQ sale del plan
Decisión del operador: **todo se analiza, se marca y se ejecuta en MNQ, con un solo gráfico**.

| Antes | Desde hoy |
|---|---|
| dos gráficos: análisis y volumen en NQ, ejecución en MNQ | **un gráfico: MNQ** |
| desfase NQ↔MNQ de hasta 3 ticks | **desaparece** |
| umbral de premercado: NQ > 2.000 · MNQ > 6.000 | **solo MNQ > 6.000** |

**El backtesting histórico NO se rehace.** Se hizo con datos de NQ, el operador lo acepta
explícitamente, y las reglas son las mismas.

### 🟠 Lo que esto abre — `P-32`
La equivalencia entre **NQ > 2.000** y **MNQ > 6.000** **nunca se verificó con datos**, y no
tenemos datos de MNQ para hacerlo. Las 11 sesiones validadas se marcaron con el umbral de NQ.
Importa porque la zona de premercado hace de **borde de banda**: el 14 de julio la jornada
entera se decidió por una banda cuyo borde superior era una zona de premercado.

## 2 · Las 38 reglas, renumeradas
Ahora corren seguidas dentro del orden de las siete categorías. Antes los números venían del
orden en que se fueron descubriendo — por eso *Estructura del precio* saltaba de la 11 a la 31.

**1.127 referencias cruzadas remapeadas en 18 archivos**, incluidos el historial de versiones,
este registro cronológico y los nombres de los diagramas. **No conviven dos numeraciones.**

Nuevo documento: **`EQUIVALENCIA_NUMERACION.md`**, con la tabla vieja→nueva.
Nuevo en el plan: **índice de las 38 reglas por categoría**.

Los diagramas de `02_Assets\diagramas\` se copiaron con los nombres nuevos; **las copias
viejas siguen ahí y se pueden borrar** (están listadas en el documento de equivalencia).

### ✅ El desajuste que quedaba, resuelto el mismo día
Quedó declarado que `TRADING_PLAN_CHAUMER.md` seguía organizado **por sub-fases** y que con
la numeración nueva sus secciones ya no iban en orden: `R-01`, `R-02`, `R-28`, `R-29`…
El operador decidió reorganizarlo — *"no importa que en el portal queden mal, eso lo hago
en Claude Code"*. Ver la entrada siguiente.

## Estado
Plan **v3.0 · 38 reglas**.

---

# 📕 06/09/2026 (b) — EL DOCUMENTO MAESTRO SE REORGANIZA POR CATEGORÍAS

## Qué se hizo
`TRADING_PLAN_CHAUMER.md` pasa de **v3.0 a v3.1**. Hasta hoy seguía el orden en que se
construyó el plan —las sub-fases `F1.x`—, así que para leer las cuatro reglas de perímetro
había que saltar entre cinco sitios del documento.

Ahora el cuerpo son **las siete categorías en su orden de uso durante el día**, y dentro de
cada una las reglas por número. **Zonas** va partida en `── MARCADO ──` y `── VIGENCIA ──`,
igual que en `reglas.json`.

Todo el material de construcción **se conserva íntegro**: la narrativa de cada sub-fase, los
diagramas, las 13 desviaciones respecto al curso y las correcciones del auditor se movieron
a **`📎 ANEXOS Y NOTAS DE CONSTRUCCIÓN`**, al final, en su orden original.

## Siete reglas ganan sección propia
`R-12`, `R-13`, `R-15`, `R-20`, `R-21`, `R-34` y `R-35` vivían **solo como fila de tabla**.
Cada una tiene ahora su sección, generada desde `reglas.json`. **Ése es exactamente el hueco
que permitió el duplicado del 01/09** (`R-39` repitiendo a `R-14` sin que nadie lo viera).
Ya no queda ninguna regla sin sección: **38 de 38**.

## Ninguna regla cambia
Se reordenó y se completó el documento. **Cero reglas nuevas, cero reglas modificadas.**

## Barrido de documentación del mismo día
- Sale el `NQ` de todo lo que se leía como regla vigente: cabecera del plan, ficha de la zona
  de premercado, `GLOSARIO.md`, `PARAMETROS.md`, `PENDIENTES.md`, `GALERIA.md` y el archivo
  de sub-fase `F1.0_Perimetro.md`, cuyo bloque de `R-01` estaba a medio corregir. Lo que
  queda con NQ es **historia fechada**, marcada como tal, más el nombre del PDF original y el
  archivo de datos del backtesting.
- Cabeceras que llevaban meses desfasadas, puestas al día: `ESTADO.md` decía *v1.15 · 33
  reglas · F1.10 abierta*; `CHECKLIST_DIARIA.md`, *v1.8-F1.9*; `PENDIENTES.md`, *24 reglas*;
  `GALERIA.md`, *11 casos* cuando son 21.
- El recuento de términos del glosario no cuadraba —26 en su cabecera, 24 en el acta de
  cierre—. **Contados uno a uno: 23 con sección propia.** Corregido en los tres sitios.
- `ESTADO.md` estrena cabecera: **las 38 reglas en una línea cada una, agrupadas por
  categoría**. Es el archivo de arranque, y ahora arranca con el plan entero a la vista.
- Los dos archivos de `01_Plan\subfases\` llevan aviso de **archivo de construcción**: no son
  fuente de verdad y pueden traer códigos de la numeración vieja.

## Lo que sigue abierto
🟡 Las **cuatro fusiones** de `PROPUESTA_LIMPIEZA_REGLAS.md` (38 → 33 reglas) siguen **sin
decidir**. Hasta que el operador diga, el plan tiene 38.

## Estado
Plan **v3.1 · 38 reglas · 7 categorías**. Siguiente paso: que Claude Code reorganice el
portal contra `reglas.json`.

---

# ✅ 07/09/2026 — `P-30` CERRADO: LA RESOLUCIÓN ANTICIPADA VALE PARA LOS DOS CAMINOS

## La duda que estaba abierta
La regla del plazo como tope —si antes de la quinta vela el mercado arma una estructura
completa al contrario, la geometría se resuelve ahí— se precisó el 01/09 hablando **solo de
la zona apéndice**, es decir del rompimiento **con cuerpo**.

Que valiera también para el otro camino —rompimiento **con mecha**, que **estira** la zona—
estaba escrito **por simetría**: una extrapolación del auditor, marcada como `P-30`
precisamente para no darla por buena sin preguntar.

## Lo confirmado
El operador: **"Si aplica igual"**. `R-14` gobierna los dos caminos, sin excepción.

| Cómo rompe | Qué pasa cuando el plazo se resuelve |
|---|---|
| con **mecha** | la zona **se estira** hasta la punta de esa mecha (`R-10`) |
| con **cuerpo** | nace la **zona apéndice** (`R-11`) |

**Actúa lo que llegue primero:** las 5 velas, o la estructura contraria completa.

## Por qué importa
Cambia **cuándo** nace el borde nuevo, y de ahí cuelga dónde va el stop.

## Qué se tocó
- `reglas.json`: los disparadores de `R-10` y `R-11` decían *"pasan 5 velas sin consecución"*.
  Ahora dicen **plazo resuelto**, no plazo vencido. `R-14` registra el alcance confirmado.
- `TRADING_PLAN_CHAUMER.md` → **v3.2**, con la confirmación escrita en la sección de `R-14`.
- `PENDIENTES.md`: `P-30` cerrado. **`P-31` ampliado**: el motor de auditoría sigue resolviendo
  el plazo solo por vencimiento, y eso ahora afecta a **los dos caminos**.
- Nueva lámina del portal: `04_Web\public\conceptos\24-estructura-antes.png`, *"Sin Consecución,
  Nueva Estructura"*, con el caso del rompimiento con mecha.

## Estado
Plan **v3.2 · 38 reglas · 7 categorías**. **Ninguna regla nueva, ninguna modificada** — se cerró
una duda de alcance que llevaba abierta desde el cierre de la fase 1.
