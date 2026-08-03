# Cómo se calculan las métricas de Disciplina

> Documento de referencia. Explica **exactamente** qué mide cada número que ves en la
> card del Calendario y en el Dashboard de Disciplina, con el ejemplo real de **Julio
> 2026** (los números de este documento están verificados contra la base de datos).
>
> El cálculo vive en `js/db.js` (fuente única). Lo consumen `metrics.js` (card del
> calendario), `disciplina.js` (dashboard), `charts.js` (Análisis) y `app.js` (modal del día).

---

## Resumen rápido

| Métrica | Qué mide | Fórmula |
|---|---|---|
| **Disciplina %** | Adherencia a las reglas del checklist | ítems cumplidos ÷ ítems que aplicaban |
| **Errores %** | Frecuencia de días con fallos | días con ≥1 error ÷ días conectados |
| **Días limpios %** | Lo contrario de Errores % | días sin errores ÷ días conectados |
| **Fase más débil** | Dónde se te escapa el proceso | la fase (1, 2 o 3) con menor % |
| **Racha** | Días operados seguidos sin fallar | contando hacia atrás desde el más reciente |

**Clave para no confundirse:** la **Disciplina** cuenta *ítems* (casillas de reglas).
Los **Errores** y **Días limpios** cuentan *días*. Son escalas distintas, por eso un mes
puede tener 99% de disciplina y 6% de errores a la vez.

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

### Casillas sin registrar = N/A

Si una regla es nueva y no existía cuando registraste una sesión vieja, **no cuenta**.
No suma ni resta. Así, crear una regla hoy no te hunde el histórico.

---

## Paso 3 — Disciplina %

> **Disciplina % = ítems cumplidos ÷ ítems que aplicaban × 100**

### La casilla no es la última palabra

El checklist lo marcas **tú, antes o durante** la operación. Es auto-reportado: puede no
coincidir con lo que pasó después.

Por eso, **si el diagnóstico del día registró un error que contradice una regla concreta,
esa regla cuenta como incumplida aunque tú hayas marcado la casilla.**

**Caso real — 8 de julio de 2026:**

| Fuente | Qué decía |
|---|---|
| Tu checklist | ✅ "No operar con noticia roja activa" — marcada como cumplida |
| El diagnóstico | ⚠️ Error **"FOMC"**: operaste un IRI tendencial en día FOMC, sabiendo que la regla lo prohíbe |

Resultado: esa casilla cuenta como **incumplida**. El 8 de julio pasó de 13/13 (100%) a
**12/13 (92%)**.

**No todos los errores tocan la Disciplina.** Solo los que contradicen una regla del
checklist. Los psicológicos —Miedo, Duda, Rabia, Ansiedad, FOMO— no corresponden a
ninguna casilla, así que **no bajan la Disciplina**: aparecen solo en Errores.

### Ejemplo completo — Julio 2026

Julio tuvo **22 días hábiles con sesión**. De esos:
- **6 días** no te conectaste → fuera del cálculo (17, 20, 28, 29, 30 y 31 de julio)
- **16 días conectados** → entran

De los 16 conectados: **9 operados** y **7 conectados sin operar**.

| Día | ¿Operó? | Setup | Casillas que aplican | Cumplidas |
|---|---|---|---|---|
| 01, 02, 07, 13, 14, 15, 21 jul | No | — | 4 c/u *(solo Fase 1)* | 4 c/u |
| 06 jul | Sí | IRI | 13 | 13 |
| **08 jul** | Sí | IRI | 13 | **12** ← error FOMC |
| 09, 10, 16 jul | Sí | IRI | 13 c/u | 13 c/u |
| 22, 23, 27 jul | Sí | IRI | 13 c/u | 13 c/u |
| 24 jul | Sí | Reingreso | 13 | 13 |

**Las cuentas:**

```
Días conectados sin operar:  7 días × 4 casillas  =  28
Días operados:               9 días × 13 casillas = 117
                                            TOTAL = 145 casillas

Cumplidas: 144    Fallidas: 1  (chk_noticias del 8-jul)

Disciplina = 144 ÷ 145 = 99,3 %  →  se muestra 99 %
```

**Por qué un día operado suma 13 casillas:**

```
Fase 1 (comunes)                  4
Fase 2 común                      1
Fase 2 de la familia del setup    4   (las 4 de IRI, o las 4 de Reingreso)
Fase 3 (comunes)                  4
                          TOTAL  13
```

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
| **Fase 1 — Pre-sesión** | 64 | 63 | **98%** ← la más débil |
| Fase 2 — Lectura del setup | 45 | 45 | 100% |
| Fase 3 — Ejecución | 36 | 36 | 100% |

De dónde salen esas casillas:
- **Fase 1:** 16 días conectados × 4 reglas = 64
- **Fase 2:** 9 días operados × 5 reglas (1 común + 4 del setup) = 45
- **Fase 3:** 9 días operados × 4 reglas = 36

La Fase 1 es la más débil por **un solo ítem**: el `chk_noticias` del 8 de julio. Con 64
casillas en juego, un fallo pesa 1,6%.

> Que la fase más débil marque 98% no significa que la disciplina sea 98%. Son cosas
> distintas: 99% es el total de las 145 casillas; 98% es solo el bloque de Fase 1.

---

## Paso 7 — Racha de disciplina

Días **operados** consecutivos, contando hacia atrás desde el más reciente, con **todas**
las casillas aplicables cumplidas. Se corta en el primer día con algún fallo.

En julio la racha es de **7 días** (27, 24, 23, 22, 16, 10 y 9 de julio); se corta en el
8 de julio por el error FOMC.

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

**Errores en días no conectados.** El numerador de Errores % cuenta las fechas con error
del período; el denominador solo los días conectados. Si algún día llegara a tener un
error registrado sin estar conectado, el porcentaje quedaría ligeramente alto. Hoy no
ocurre en ningún mes.

**Errores históricos sin vínculo.** De los 47 errores registrados, solo 8 están
vinculados a una regla (FOMC, Mover Stop, Trade sin Consecución, Entrada Tardía). Los
otros 39 no bajan la Disciplina. El Coach IA los va tipificando a medida que analiza días
nuevos.

---

## Dónde vive el cálculo

Todo en `js/db.js`, como fuente única:

| Función | Qué hace |
|---|---|
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
