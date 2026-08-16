# Cómo se calculan las métricas de Disciplina

> Documento de referencia. Explica **exactamente** qué mide cada número que ves en la
> card del Calendario y en el Dashboard de Disciplina, con el ejemplo real de **Julio
> 2026** (los números de este documento están verificados contra la base de datos).
>
> El cálculo vive en `js/db.js` (fuente única). Lo consumen `metrics.js` (card del
> calendario), `disciplina.js` (dashboard), `charts.js` (Análisis) y `app.js` (modal del día).
>
> **Incluye el rediseño del 3 de agosto de 2026**: reglas verificadas por datos,
> condicionalidad por contexto del día y el GO dentro de la Fase 2. Plan y motivos en
> `docs/archivo/plan-rediseno-checklist-disciplina.md`.

---

## Resumen rápido

| Métrica | Qué mide | Fórmula |
|---|---|---|
| **Disciplina %** | Adherencia a las reglas del checklist | ítems cumplidos ÷ ítems que aplicaban |
| **Errores %** | Frecuencia de días con fallos | días con ≥1 error ÷ días conectados |
| **Días limpios %** | Lo contrario de Errores % | días sin errores ÷ días conectados |
| **Fase más débil** | Dónde se te escapa el proceso | la fase (1, 2 o 3) con menor % |
| **Racha** | Días operados seguidos sin fallar | contando hacia atrás desde el más reciente |

**Dos claves para no confundirse:**

1. La **Disciplina** cuenta *ítems* (casillas de reglas). Los **Errores** y **Días
   limpios** cuentan *días*. Son escalas distintas, por eso un mes puede tener 99% de
   disciplina y 6% de errores a la vez.
2. **No todas las reglas las respondes tú.** Tres se verifican con los datos del día
   (⚙️) y el resto son declaradas (✋). Ver *Paso 2b*.

---

## Paso 1 — Qué días entran en el cálculo

Antes de calcular nada, se descartan días. Tres filtros, en este orden:

### 1.1 Solo días hábiles

**Sábados y domingos nunca cuentan**, para nada. Ni disciplina, ni errores, ni P&L.

> ¿Por qué existe este filtro? El AddOn de NinjaTrader crea la fila de la sesión al abrir
> la plataforma (la necesita por la estructura de la base de datos). Si abrías NT8 un
> sábado, quedaba una sesión fantasma que el sistema contaba como día operado.

### 1.2 Solo días en que te conectaste

Un día cuenta si **operaste**, o si **no operaste pero te conectaste a analizar**.

Si no te conectaste (`no_opero = true` + `se_conecto = false`), ese día **desaparece de
todas las estadísticas**. No es un día bueno ni malo: no existe.

### 1.3 ¿Hubo operativa real?

Esto no descarta el día, pero decide **cuántas casillas se te evalúan**.

Un día cuenta como "operado" si tiene **trades registrados** o **setup declarado**.

> ⚠️ **Importante:** el campo `no_opero = false` **no** significa que operaste — es el
> valor por defecto de la columna. Una sesión creada por el AddOn al abrir NinjaTrader
> nace así aunque nunca dieras GO. Por eso se exige una señal real.
>
> Sin esto, un día en que hiciste la pre-sesión y no llegaste a operar se te evaluaban
> las reglas de lectura y ejecución de una operación que nunca existió.

---

## Paso 2 — Qué casillas se evalúan cada día

Las reglas del checklist están repartidas en 3 fases:

| Fase | Cuándo ocurre | ¿Cuándo se evalúa? |
|---|---|---|
| **Fase 1 — Pre-sesión** | Antes de que exista ningún setup | **Todo día conectado** |
| **Fase 2 — Lectura del setup** | El análisis antes de entrar | **Solo si hubo operativa real** |
| **Fase 3 — Ejecución** | El momento de apretar el botón | **Solo si hubo operativa real** |

### Reglas comunes vs. reglas por setup

Algunas reglas aplican siempre; otras solo a una familia de setup (IRI o Reingreso).

- Regla **sin setup asignado** → aplica siempre.
- Regla **de IRI** → solo en días cuyo setup fue de la familia IRI.
- Regla **de Reingreso** → solo en días de Reingreso.

Por eso, en un día de IRI las 4 reglas de Reingreso **ni suman ni restan**: simplemente
no aplican. En la base de datos verás sus filas en `false`, pero se descartan.

> Esto explica una confusión típica: ver "13 de 17 casillas" en la base de datos y creer
> que fallaste 4. Esas 4 son del otro setup.

### Reglas condicionales por contexto del día

*(Rediseño de agosto 2026.)* Además de la fase y del setup, una regla puede depender del
**contexto del día**:

| Regla | Solo cuenta si… |
|---|---|
| **Día FOMC: solo reingresos** | ese día era FOMC |
| **No entrar en ventana de noticia roja** | ese día había noticia roja registrada |

Es lo que hace que el número signifique algo. Si "en día FOMC solo reingresos" contara
como cumplida los ~250 días que no son FOMC, saldría al 99% siempre y no diría nada.
**Una regla solo se evalúa cuando había algo que cumplir.**

### Casillas sin registrar = N/A

Si una regla es nueva y no existía cuando registraste una sesión vieja, **no cuenta**.
No suma ni resta. Así, crear una regla hoy no te hunde el histórico.

---

## Paso 2b — Quién responde cada regla

*(Rediseño de agosto 2026.)* No todas las reglas se responden igual. El campo
`evidencia` de `catalogo_reglas` decide quién contesta:

| Tipo | Quién responde | Se puede maquillar |
|---|---|---|
| ✋ **Declarada** | Tú, marcando la casilla | Sí |
| ⚙️ **Automática** | El sistema, con los datos del día | No |

Las tres automáticas de hoy:

| Regla | Cómo se verifica |
|---|---|
| **Stop máximo 80 puntos** | MAE del trade ÷ ($ por punto × contratos) |
| **No entrar en ventana de noticia roja** | Hora de entrada contra cada ventana de ±5 min |
| **Día FOMC: solo reingresos** | Fecha marcada como FOMC + familia del setup operado |

> ⚠️ **El $ por punto depende del contrato: MNQ = $2, NQ = $20.** Normalizar mal esto
> infla el MAE ×10 en los trades de NQ, y ya llevó una vez a una conclusión falsa.

Una regla automática tiene **tres** resultados posibles: cumplida, incumplida y **sin
evidencia**. Sin evidencia (no hay MAE, no hubo trades, no había noticia) no cuenta ni a
favor ni en contra — igual que una casilla sin registrar.

**Por qué importa:** el checklist es auto-reportado y se marca antes de saber cómo acaba
el día. Cuando el dato puede responder, responde el dato.

### El GO no va al final del checklist

El campo `bloquea_go` separa las reglas que se pueden responder **antes** de entrar de
las que describen hechos **posteriores**. Solo las primeras bloquean el GO en el AddOn
(8 de 13). Antes había que marcarlo todo, incluidos hechos que aún no habían ocurrido:
o marcabas en falso, o perdías el trade llenando casillas.

---

## Paso 3 — Disciplina %

> **Disciplina % = ítems cumplidos ÷ ítems que aplicaban × 100**

### La casilla no es la última palabra

El checklist lo marcas **tú, antes o durante** la operación. Es auto-reportado: puede no
coincidir con lo que pasó después. Hay **dos mecanismos** que lo corrigen:

**1. La verificación automática.** Si la regla es ⚙️, manda el dato y la casilla ni se
mira.

**2. El vínculo error → regla.** Si el diagnóstico registró un error que contradice una
regla **declarada**, esa regla cuenta como incumplida aunque marcaras la casilla.

**Caso real — 8 de julio de 2026:** operaste un IRI tendencial en día FOMC, sabiendo que
la regla lo prohíbe. Tu checklist estaba marcado entero. La regla
**"Día FOMC: solo reingresos"** lo detecta sola, cruzando la fecha del calendario con el
setup que operaste — sin depender de que nadie lo confesara.

Resultado: **12 de 13**.

**No todos los errores tocan la Disciplina.** Solo los que contradicen una regla del
checklist. Los psicológicos —Miedo, Duda, Rabia, Ansiedad, FOMO— no corresponden a
ninguna casilla, así que **no bajan la Disciplina**: aparecen solo en Errores.

### Ejemplo completo — Julio 2026

Julio tuvo **22 días hábiles con sesión**. De esos:
- **6 días** no te conectaste → fuera del cálculo (17, 20, 28, 29, 30 y 31 de julio)
- **16 días conectados** → entran

De los 16 conectados: **9 operados** y **7 conectados sin operar**.

| Día | ¿Operó? | Setup | Casillas evaluadas | Cumplidas |
|---|---|---|---|---|
| 01, 02, 07, 13, 14, 15, 21 | No | — | 3 *(solo Fase 1)* | 3 |
| 06, 09 | Sí | IRI | 12 | 12 |
| **08** | Sí | IRI | 13 | **12** ← día FOMC operado tendencial |
| 10, 16, 22, 23, 27 | Sí | IRI | 11 | 11 |
| 24 | Sí | Reingreso | 11 | 11 |

```
Total julio: 123 de 124  →  99 %
```

**Por qué el número de casillas cambia de un día a otro.** Porque cada regla solo se
evalúa cuando hay algo que cumplir:

- **11** es el día normal: 3 de Fase 1 + 5 de Fase 2 + 1 de Fase 3 declaradas, más
  *Stop máximo* y *Rompimiento + consecución*.
- **12** cuando además había **noticia roja** registrada y se operó (entra
  *No entrar en ventana*): días 6 y 9.
- **13** cuando además era **día FOMC**: el día 8.
- **3** en los días que te conectaste sin operar: solo la Fase 1.

---

## Paso 4 — Errores %

> **Errores % = días con al menos un error ÷ días conectados × 100**

Cuenta **días**, no errores. Un día con 3 errores cuenta igual que un día con 1: como
**un día con errores**.

**Julio 2026:** 1 día con errores (el 8) ÷ 16 días conectados = **6,25% → 6%**

Aquí entran **todos** los errores, incluidos los psicológicos que no tocan la Disciplina.

---

## Paso 5 — Días limpios %

> **Días limpios % = días conectados sin ningún error ÷ días conectados × 100**

Es exactamente **el complemento de Errores %**. Los dos suman 100%.

**Julio 2026:** 15 días limpios ÷ 16 conectados = **93,75% → 94%**

```
Errores 6 %  +  Días limpios 94 %  =  100 %
```

Si te sale 6% y 94%, no son dos datos distintos: es el mismo dato visto por sus dos caras.

La card también muestra una **racha de días limpios**: días consecutivos sin errores
contando hacia atrás desde el más reciente.

---

## Paso 6 — Fase más débil

Se calcula el % de cada fase por separado y se muestra **la más baja**. Sirve para saber
dónde está la fuga: ¿en la preparación, en la lectura o en la ejecución?

**Julio 2026:**

| Fase | Casillas | Cumplidas | % |
|---|---|---|---|
| Fase 1 — Pre-sesión | 48 | 48 | 100% |
| **Fase 2 — Lectura del setup** | 55 | 54 | **98%** ← la más débil |
| Fase 3 — Ejecución | 21 | 21 | 100% |

De dónde salen: **Fase 1** = 16 días conectados × 3 reglas. **Fase 2** = 9 días operados
× 6 reglas, más la de FOMC el día que aplicó. **Fase 3** = 9 × 2 declaradas, más las
automáticas evaluables.

La Fase 2 es la más débil por **un solo ítem**: el "Día FOMC: solo reingresos" del 8 de
julio. Con 55 casillas en juego, un fallo pesa 1,8%.

> Que la fase más débil marque 98% no significa que la disciplina sea 98%. Son cosas
> distintas: 99% es el total de las 124 casillas; 98% es solo el bloque de Fase 2.

---

## Paso 7 — Racha de disciplina

Días **operados** consecutivos, contando hacia atrás desde el más reciente, con **todas**
las casillas aplicables cumplidas. Se corta en el primer día con algún fallo.

En julio la racha es de **7 días** (27, 24, 23, 22, 16, 10 y 9 de julio); se corta en el
8 de julio por operar tendencial en día FOMC.

Ojo con dos cosas:
- Solo cuenta **días operados**. Un día en que te conectaste y no operaste no suma ni
  rompe la racha: se ignora.
- Depende del **período seleccionado**. En "Mes" la racha arranca desde el último día
  operado de ese mes, no desde hoy.

---

## Otros elementos del Dashboard

| Elemento | Qué muestra |
|---|---|
| **Distribución por tipo** | Errores agrupados en 🧠 psicológico · 📐 analítico · ⚙️ operativo · 🗺️ marcado. Clic en una barra → los días de esos errores |
| **Causa raíz** | Los 6 nombres de error más repetidos del período. Clic en una fila → los días |
| **Historial de racha** | Últimas 12 sesiones operadas como semáforo: 🟩 perfecta · 🟨 un fallo · 🟥 error, violación de noticia o más de un fallo |
| **Registro de sesiones** | Un renglón por día conectado, con su resultado, casillas y errores |
| **Violaciones de noticia** | Días en que la hora de entrada de un trade cayó dentro de la ventana ±5 min de la noticia roja registrada. Se detecta solo, cruzando `hora_noticia_roja` con la hora de los trades |

---

## Detalles finos

**La Disciplina no depende del filtro de cuentas.** Aunque cambies el filtro, el
porcentaje no se mueve: la disciplina es de **tu proceso**, no de una cuenta. (El P&L y
la tasa de acierto sí responden al filtro.)

**El histórico de febrero–mayo está inflado, por decisión consciente.** Seis reglas
nacieron con el rulebook de junio, y sus filas de feb–may quedaron rellenas en `true`
(288 ítems). Limpiarlas bajaría la disciplina global de 81,5% a 75,1% y rompería la
comparabilidad con lo que ya venías mirando. Se dejaron como están — léelo con esa
salvedad.

**Disciplina por mes (tras el rediseño del 3 de agosto de 2026):**

| Mes | Ítems | Disciplina |
|---|---|---|
| Febrero | 137 | 79% |
| Marzo | 180 | 67% |
| Abril | 188 | 71% |
| Mayo | 156 | 93% |
| Junio | 154 | 95% |
| Julio | 124 | 99% |
| **Global** | **951** | **83%** |

> El rediseño **subió** el global de 81% a 83%, en contra de lo esperado. Motivo: las
> reglas condicionales dejaron de contar los ~120 días sin riesgo, y el stop máximo —al
> verificarse por dato— sale 82 cumplidos / 1 fallo, donde antes se leía una casilla que
> estaba en `true` siempre. Al medir solo cuando hay algo que cumplir desaparecen tanto
> los aprobados gratis como los suspensos gratis.

**Errores en días no conectados.** El numerador de Errores % cuenta las fechas con error
del período; el denominador solo los días conectados. Si algún día llegara a tener un
error registrado sin estar conectado, el porcentaje quedaría ligeramente alto. Hoy no
ocurre en ningún mes.

**Errores vinculados a una regla.** De los 46 errores registrados, **21 están vinculados**
(3 ago 2026) y por tanto tumban su casilla:

| Regla | Errores que la contradicen |
|---|---|
| Rompimiento de zona + consecución | Error de Marcación (7) · Trade sin Consecución (2) |
| No mover Target/Stop | Mover Stop (3) |
| Día FOMC: solo reingresos | FOMC (2) — *la regla ya lo detecta sola; el vínculo queda por trazabilidad* |
| Estructura I-R-I fluida | IRIs Poco Claros (2) |
| Target sin zonas en contra | Contra Soporte (2) |
| Orden precolocada a tiempo | Entrada Tardía (1) |
| Cuenta PA activa verificada | Entré en Sim y no Real (1) |
| Stop máximo de 80 puntos | Target Largo (1) |

Los **25 restantes se dejan sin vínculo a propósito**, en tres grupos:

- **Psicológicos (16)** — Miedo, Duda, Rabia, Ansiedad, Baja Confianza, FOMO,
  Sobreconfianza, Sobre-Apalancamiento, Dos trades, Confundir Reglas. No hay casilla que
  prevenga sentir miedo: cuentan solo en la tasa de errores.
- **Condiciones de mercado (4)** — 3ª Corrida, Contra Máximo Histórico, Contra Máximo y
  Mínimo Premercado. Viven en el **Laboratorio de Experimentos**, que es donde se decide
  si merecen convertirse en regla; vincularlas ahora adelantaría esa decisión.
- **Ya contados o sin regla equivalente (5)** — *Checklist Incompleto* (el error ES que
  había casillas en ✗ → restaría dos veces), *Entrada con Filtros en Rojo* ×2 (no dice
  qué filtro, y la del 17-jun ya la cubre el error FOMC de ese día), *Descartar Setup
  Válido* ×2 (no existe una regla que obligue a tomar todo setup válido).

De aquí en adelante el Coach IA rellena el vínculo solo, al analizar cada día nuevo.

> **Ojo con el alcance de cada regla.** Una regla de Fase 2 o 3 solo cuenta en días con
> operativa real, y una regla por setup solo en días de esa familia. Por eso "Error de
> Marcación" → *Rompimiento de zona + consecución* (que es exclusiva de IRI) solo surte
> efecto en 2 de sus 7 días: en los otros el día no fue operado, o la casilla ya estaba
> en ✗. El vínculo queda documentado igual, pero no penaliza dos veces.

---

## Dónde vive el cálculo

Todo en `js/db.js`, como fuente única:

| Función | Qué hace |
|---|---|
| `discContexto({...})` | Construye el contexto del cálculo (trades, errores, FOMC, stop máx) |
| `discAplicaContexto(f, s, ctx)` | ¿El contexto del día activa esta regla? (`dia_fomc`, `hay_noticia`) |
| `reglaAutoResultado(cod, s, ctx)` | Resuelve una regla ⚙️ → true / false / null |
| `maeEnPuntos(t)` | MAE a puntos, con $/punto según contrato (MNQ $2, NQ $20) |
| `esDiaHabil(fecha)` | Descarta sábados y domingos |
| `fechasConTrades(trades)` | Qué días tuvieron trades |
| `sesionOpero(s, conTrades)` | ¿Hubo operativa real ese día? |
| `discFactorAplica(f, s, conTrades)` | ¿Esta casilla aplica a este día? |
| `reglasRotasPorDia(errores)` | Qué reglas contradice un error, por día |
| `reglaCumplida(s, key, rotas)` | ¿Se cumplió de verdad, o el error la desmiente? |
| `calcDisciplinaStats(sesiones, items, opts)` | El cálculo completo → `{ total, ok, pct }` |

Quien lo consume: `metrics.js` (card del calendario), `disciplina.js` (dashboard),
`charts.js` (Análisis) y `app.js` (modal del día). **Los cuatro dan el mismo número.**

> Si hay que cambiar el criterio, se cambia en `db.js` y los demás lo heredan. Estuvo
> duplicado en 4 sitios y se desincronizó; por eso ahora vive en un solo lugar.

---

*Última actualización: 3 de agosto de 2026 · Cifras verificadas contra la base de datos.*
