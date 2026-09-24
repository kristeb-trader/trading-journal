# ESTADO — índice de trabajo compacto

> **Archivo de arranque.** Léelo primero cada sesión. Detalle completo en `TRADING_PLAN_CHAUMER.md` y `GLOSARIO.md`.

**v3.13** · 2026-09-23 · **40 reglas** · **26 términos** · 🏁 FASE 1 CERRADA · 🔴 **TEST CIEGO EN MARCHA** · 🚧 FASE 2 en curso: portal web en `04_Web\`

> 🔴 **El test ciego arrancó el 14/09/2026.** Primera jornada: **10/09/2026** — largo, entrada 29.145,75 a las 8:40, riesgo 40,50 → objetivo en 8:41, **+40,50 pts**. Protocolo en `05_Backtesting\test_ciego\LEEME_BACK_DIARIO.md`; diferencias en `DISCREPANCIAS.md`. Con esto **se cierra el primero de los cuatro huecos declarados**; siguen abiertos los otros tres. Ver `CIERRE_FASE_1.md`.
> 📅 **Tercera jornada: lunes 14/09/2026 — NO OPERA.** De ella sale la reescritura de **`R-40`** y el término **corrida fluida**. 🔴 **Obligó a corregir una sesión ya validada:** el 16/07/2026 deja de tener operación, y julio pasa de **−91,00 pts en 9** a **−77,75 en 5**.
> 📅 **Segunda jornada: viernes 11/09/2026 — NO OPERA**, coincidiendo con el operador. El día abre dentro del tramo del premercado (29.317,00 ↔ 29.443,00), el primer movimiento cruza el medio y **la sesión entera se queda sin marcar una sola zona**. De ahí sale **`R-41`**, el punto de control. Dos asuntos abiertos del reingreso sobre zona de premercado.
> 🆕 Del primer día salieron **`R-40`** y el paso de `UMBRAL_VOL` a **parámetro ajustable, hoy > 8.000 en MNQ** — con `P-37` por el criterio de ajuste. ✅ **Julio ya está repasado** con las reglas nuevas.
> 📝 **15/09/2026 — `R-11`, la zona apéndice, reescrita.** Queda **calcada de `R-10`**: sale la frase *"si el plazo se resuelve"* y entran los dos finales completos —cinco velas, o estructura completa al contrario, lo que llegue primero—. Lo único que separa las dos reglas es **dónde cierra la vela de rompimiento**. Cambio de redacción: **no se mueve el motor ni ninguna jornada**.
> 🧭 **19/09/2026 — la banda gastada no se reabre, y el motor ya lo aplica.** La regla estaba escrita desde el 27/08 pero el motor contaba el turno solo con las zonas **vivas**, y la frase de que una zona inválida *"no cuenta para nada"* empujaba al revés. Ahora: **deja de valer como zona; no deja de ocupar el sitio.** Se caen 3 zonas en 18 sesiones y **ningún resultado cambia**.
> 🧭 **21/09/2026 — ROMPIMIENTO DIRECTO.** Cuando se pierde la fluidez **se acaban las entradas en el sentido del día**, no solo en esa zona. El rompimiento que llega después **no se opera nunca**; se vuelve a entrar con un IRI nuevo entero más allá. Alcanza a las zonas de premercado. Se puede volver a perder.
> 🏷️ **23/09/2026 — el setup IRI pasa a llamarse CONTINUACIÓN.** Solo el nombre: `R-25` no cambia. **IRI** queda como la **estructura** (corrida que deja zona, retroceso, corrida que la rompe). Cuatro nombres: Continuación alcista/bajista · Reingreso alcista/bajista. Desaparece la etiqueta «Apertura» y se cierra `P-20`.
> 🕯️ **23/09/2026 — el orden de la vela vale también para las órdenes.** Si una misma vela toca la orden y el stop: azul, primero el mínimo; blanca, primero el máximo. Llega antes a la orden → se llena, y el stop puede saltar en esa vela. Llega antes al stop → se cancela.
> 🔢 Numeración nueva desde el 06/09/2026 — traducción en `_Historia\EQUIVALENCIA_NUMERACION.md`.

## Las 40 reglas confirmadas, por categoría

### 1 · Perímetro operativo (4)

| ID | En una línea |
|---|---|
| `R-01` | Analiza, marca y ejecuta **todo en MNQ**. Un solo gráfico de 1 minuto |
| `R-02` | Ventana 08:31–10:30 hora Colombia (120 min desde la apertura americana) |
| `R-03` | Gráfico limpio: velas de 1 min y **Volume Up Down**. Nada más |
| `R-04` | **1 contrato MNQ siempre.** No escala con el capital. Revisión anual |

### 2 · Estructura del precio (4)

| ID | En una línea |
|---|---|
| `R-05` | Corrida = 2+ velas superando cada una el extremo de la anterior |
| `R-06` | Retroceso = movimiento contrario; sin tamaño mínimo; se mide en puntos |
| `R-07` | La **08:31 declara la dirección del día con su propio cuerpo** · es la vela origen · puede sostener zona |
| `R-08` | **Vela envolvente** (máx mayor + mín menor) **sin corrida viva** → no declara dirección, la da la siguiente |

### 3 · Zonas (14)

| ID | En una línea |
|---|---|
| | **── MARCADO ──** |
| `R-09` | Zona = la mecha de la vela extrema, del borde del cuerpo a la punta |
| `R-10` | Rompe con **mecha** + plazo resuelto sin consecución → **se extiende** la zona |
| `R-11` | Rompe con **cuerpo** + plazo resuelto sin consecución → nace **zona apéndice** |
| `R-12` | Zona entre zonas solo si el movimiento no cruza el **50 %** (bordes internos) |
| `R-13` | Zonas del mismo tipo que se tocan → **se estira una**, no se crean dos |
| `R-14` | Las **5 velas son un tope, no una espera**: una estructura completa al contrario resuelve antes · **vale para el estiramiento y para la apéndice** |
| `R-15` | Premercado (19:00 Col → apertura): **MNQ > 6.000** marca zona. Se apaga al abrir |
| `R-16` | Corrida → zona al **aparecer** el retroceso · retroceso → línea provisional, zona al **confirmarse** |
| `R-17` | **Una sola zona por banda y por jornada**: la del primer retroceso |
| `R-18` | Salir de una zona o de una banda es **rompimiento + consecución**, no geometría |
| | *(`R-16` + `R-12` + `R-17` + `R-18`, leídas en orden, son la secuencia del día — ver “Cómo se marca una jornada” al principio del capítulo de zonas del plan)* |
| `R-19` | Seis precisiones de dibujo — la propia es **no solapar zonas de tipo distinto** |
| | **── VIGENCIA ──** |
| `R-20` | Rompimiento ≥1 tick **por mecha** · consecución = pasar el extremo de la vela que rompió, **sin plazo** |
| `R-21` | Vigencia binaria: activa / inactiva (traspasada). **Las zonas no envejecen** |
| `R-22` | La vela que confirma un traspaso **no abre a la vez** el rompimiento del lado contrario |

### 4 · Setup y entrada (7)

| ID | En una línea |
|---|---|
| `R-23` | **Primer setup válido**, sin comparar |
| `R-24` | Stop Market a 1 tick de la vela de rompimiento, al cierre de esa vela |
| `R-25` | **Continuación**: un IRI (corrida→retroceso→zona→rompimiento) + consecución = entrada · plazo 5 velas · filtro: zona vigente |
| `R-26` | **Reingreso**: rompimiento falla→precio atraviesa la zona entera→consecución = entrada · **inmediato o no es** |
| `R-27` | La vela de apertura **no sesga la jornada**: se opera en los dos sentidos |
| `R-40` | **Corrida fluida:** solo se opera el rompimiento de una corrida limpia — la corrida deja su zona, el retroceso **no se pasa**, y la siguiente **rompe**. Si falla, se espera otro IRI con zona nueva **entera** más allá. Solo continuación |
| `R-41` | **Punto de referencia:** el objetivo de un **reingreso** no pasa del nivel de referencia de **cualquier** retroceso vivo que quede en medio. Se rompe **por cierre**, no por mecha. Solo reingreso |

### 5 · Riesgo, orden y gestión (7)

| ID | En una línea |
|---|---|
| `R-28` | Máx **1 operación llenada** por sesión |
| `R-29` | La orden caduca por retroceso nuevo, invalidación, **volver al punto del stop** o fin de ventana |
| `R-30` | Fin de ventana **prohíbe abrir, no obliga a cerrar** |
| `R-31` | ATM `K1`, 1 contrato, `ATM_DEFECTO` = 320 ticks · filtro previo: stop ≤ `STOP_MAX` = 80 pts |
| `R-32` | **Stop y target**: el stop es el extremo alcanzado **desde que nació la zona** · target 1:1 · 3 filtros, y si falla uno NO se opera |
| `R-33` | **NO se gestiona, jamás.** Ni breakeven, ni cierre manual, ni parcial. Solo stop o target |
| `R-34` | Al llenarse la orden **termina el análisis del día**. No más zonas, no más setups. Bitácora y cerrar NT8 |

### 6 · Filtros de no-operar (3)

| ID | En una línea |
|---|---|
| `R-35` | Noticia roja Forex Factory: no operar ±5 min; la orden pendiente se cancela |
| `R-36` | **Día FOMC** (Forex Factory en rojo): Continuación prohibida todo el día, solo Reingreso |
| `R-37` | Enfermo o mentalmente mal → no operar · **criterio libre, sin número** |

### 7 · Proceso diario (1)

| ID | En una línea |
|---|---|
| `R-38` | **Checklist diaria** + registro de TODAS las sesiones, se opere o no |
## Fuera de las reglas

- **Checklist** (`CHECKLIST_DIARIA.md`): la secuencia del día en 4 bloques
- **Galería** (`GALERIA.md`): **21 casos** etiquetados, incluidas las **11 sesiones completas al tick** (6 → 20 de julio de 2026) · imágenes en `02_Assets\galeria\`
- **Parámetros** (`PARAMETROS.md`): `STOP_MAX`=80 pts · `ATM_DEFECTO`=320 ticks · `RATIO_TARGET`=1:1 · `CONTRATOS`=1 MNQ · `PLAZO_CONSECUCION`=5 velas · `UMBRAL_VOL`>6.000 MNQ
- **Contextualización** (`CONTEXTUALIZACION.md`): 10 elementos que **NO son reglas y no deben convertirse en reglas** — C-01 sobreextensión · C-02 volumen en extendido · C-03 lateralización · C-04 alejamiento · C-05 fluidez · C-06 recorrido · C-07 tamaño de estructura · C-08 volumen en sesión · C-09 vela de la consecución
- **Desviaciones** (`PENDIENTES.md`): D-01 a D-13. Descartados del curso: Fibonacci, POC, zona crítica, alto/bajo de sesión, zona de desequilibrio, fractal, manipulación, sesión europea, Giro
- **Historia** (`_Historia\`): la bitácora de la fase 1, la equivalencia de numeración vieja→nueva y el cuaderno de limpieza de reglas. Fuera del camino, no del disco

## Pendientes abiertos

**Los cuatro huecos declarados del cierre:** 🚨 `P-29` el **test ciego nunca se ejecutó** · 🚨 `P-21` **no hay regla de parada** · 🚨 falta toda la **capa de contextualización** · 🚨 `P-27` las cifras del backtesting **no miden la estrategia**.

**Dudas de método abiertas:** `P-23` vela de apertura sin cuerpo · `P-24` ¿sobra `R-08`? · `P-26` ¿el FOMC bloquea toda la sesión? · `P-28` separación mínima entre zonas del mismo tipo.

**Lo que bloquea el backtesting de un año — los cuatro:** `P-27` no hay calendario de noticias rojas · `P-31` el motor no aplica la resolución anticipada, ni en el estiramiento ni en la apéndice · 🟠 `P-32` el umbral de premercado cambió de NQ a MNQ y la equivalencia no está verificada · 🆕 `P-33` el motor no está verificado contra la secuencia de banda y turno.

**Menores, sin bloquear:** `P-01` mín/máx premercado sin datos · `P-03` reglas Apex · `P-07` sin fin garantizado de sesión · `P-08` riesgo sin tope semanal · `P-09` ventana de exposición manual (aceptado) · `P-10` nombre del data feed · `P-12` comisión real MNQ.

## Siguiente

🏁 **Fase 1 cerrada el 01/09/2026.** Las 12 sub-fases están cerradas; el detalle de cada una vive en los anexos de `TRADING_PLAN_CHAUMER.md` y el acta en `CIERRE_FASE_1.md`.

🚧 **Fase 2 en curso — el portal web**, en `04_Web\`, construido desde Claude Code contra `reglas.json`. Instrucciones en `CLAUDE.md` (raíz) y `04_Web\CLAUDE.md`. Lo que le toca hacer a Claude Code está en `04_Web\PENDIENTE_PORTAL.md`.

🆕 **08/09/2026 — queda escrita la secuencia de marcado de la jornada.** El operador corrigió dos veces un gráfico de la duda de la zona estirada y, al hacerlo, dictó de principio a fin cómo se marca un día: la apertura deja dos zonas y ésas son la banda · dentro de esa banda se marca **una zona como máximo en toda la jornada** (la del primer retroceso, y solo si el movimiento no cruza la mitad) · después, dentro de esa banda no se dibuja nada más · la **única** forma de que aparezca una zona nueva es superar un extremo con rompimiento y consecución · y ese traspaso abre **banda nueva con turno propio, para toda la jornada**. **Ninguna regla nueva ni modificada: siguen 38.** Estaba repartido entre `R-16`, `R-12`, `R-17` y `R-18`; faltaba leerlo junto. Va como sección propia al principio del capítulo de zonas del plan (v3.3). Cierra `P-25`, abre `P-33`.

**Aplazado, con fecha por decidir:** la capa de contextualización · el backtesting de un año · el bot de NinjaTrader · el test ciego, que puede ejecutarse **contra el portal**.

**Decisión sobre la mesa:** las cuatro fusiones que llevarían el plan de **38 a 33 reglas** — unir las tres de *una operación por sesión*, las dos de *solo hay dos salidas*, las dos de la *vela de apertura*, y disolver el cajón de las seis precisiones de dibujo. El detalle, en `_Historia\PROPUESTA_LIMPIEZA_REGLAS.md`. **Hasta que el operador decida, son 38.**

## Reglas permanentes del proyecto

1. El auditor no conoce el método. Todo sale de las respuestas del operador.
2. Ningún adjetivo se acepta como regla. Sin número → `PENDIENTE`.
3. Coach estricto: parar contradicciones e intuiciones disfrazadas de regla.
4. No se escribe código.
5. Entrevista: máx **2 preguntas** por turno → ficha → `confirmado` → escritura.
6. Nada se escribe en `01_Plan\` sin confirmación.

---

## Dónde está el historial

Este archivo se partió el **07/09/2026**. Antes tenía 951 líneas y mezclaba el estado de hoy
con el registro de todo lo que pasó desde agosto: era el archivo que más se leía y el que más
caro salía de leer.

**Aquí queda solo el estado de hoy.** Todo el registro cronológico —las 11 sesiones revisadas
vela a vela, el cierre de la fase 1, las correcciones de reglas y las decisiones fechadas—
vive ahora en **`_Historia\BITACORA.md`**.

> No hace falta abrirlo para trabajar. Solo para saber **por qué** una regla dice lo que dice
> —y para eso suele bastar con la sección de esa regla en `TRADING_PLAN_CHAUMER.md`.
