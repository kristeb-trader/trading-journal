# Fase 5 — Una sola lista de reglas: la etapa del plan de Chaumer

**Versión:** v1 · **Estado:** 🟡 **PROPUESTO, pendiente de aprobar por Kris.**
**Escrito:** 24/09/2026. Es el sub-diseño de la fase 5 de `docs/disenos/2026-09-24-unificacion-chaumer.md`.

| Versión | Fecha | Qué cambió |
|---|---|---|
| v1 | 24/09/2026 | Primera versión, tras el diagnóstico y las dos decisiones de Kris |

> El diseño aprobado manda sobre la implementación. Toca invariantes del Journal (disciplina en `db.js`,
> `sesion_checklist`, soft-delete de reglas): **no se implementa nada hasta el sí de Kris.**

---

## 1 · Lo decidido

| Fecha | Decisión | Quién |
|---|---|---|
| 24/09 | La historia no se toca: las reglas de hoy y sus casillas quedan como **etapa anterior** | Kris (diseño general) |
| 24/09 | La etapa nueva usa el plan de Chaumer; el texto se edita **solo** en el plan (Cowork) | Kris (diseño general) |
| 24/09 | La disciplina se calcula **por etapa**, con selector; por defecto, la actual | Kris (diseño general) |
| 24/09 | **Las casillas salen de la checklist diaria del plan** (`chaumer/01_Plan/CHECKLIST_DIARIA.md`), con filtro: cada línea es *casilla*, *automática* o *guía* | Kris |
| 24/09 | **La etapa nueva empieza hoy, 24/09/2026**, y el trade de hoy es el **piloto** | Kris |

---

## 2 · Lo que el código obliga a resolver (diagnóstico)

| # | Hallazgo | Dónde | Consecuencia |
|---|---|---|---|
| 1 | **La disciplina usa las reglas ACTIVAS de hoy sobre TODA la historia.** Desactivar una regla la borra de la disciplina de los días pasados | `js/disciplina.js:604`, `js/metrics.js:903` (`soloActivos: true`), `js/db.js:401` (`activo !== false`) | Ya pasó: `rr_1a1`, desactivada con 135 casillas (feb → 14 ago), dejó de contar sin que nadie lo notara. **La etapa nueva no se puede hacer desactivando las 17 casillas de hoy**: la anterior se quedaría sin reglas. Hace falta que cada regla **pertenezca a una etapa** |
| 2 | El plan tiene **40 reglas**, pero la mitad son definiciones de dibujo (zonas, estructura) que no se «cumplen» un día. Su **checklist diaria** son **48 líneas** y cada una cita sus reglas | `01_Plan/reglas.json`, `01_Plan/CHECKLIST_DIARIA.md` | Las casillas salen de las líneas, no de las reglas (decisión de Kris) |
| 3 | Siete líneas o reglas **se pueden comprobar con los datos** (trades, noticias, FOMC) | `trades.instrument`, `qty`, `entry_time`; `sesion_noticias`; `catalogo_fechas` | 3 automáticas ya existen (stop, noticia, FOMC); **4 nuevas** |
| 4 | `trades.qty` de agosto–septiembre está **regularizado** a ±$160 (2 y 3 contratos, D-020). Desde que la principal es Sim101 es real (hoy: 1) | consulta del 24/09 | «1 contrato» automático solo es fiable **desde la etapa nueva**. Si algún día se vuelve a regularizar, daría falsos |
| 5 | **El bot de Telegram no toca el checklist** | `TelegramBot/worker.js:69`, `:220` | Se corrige el diseño general: no hay que adaptarlo |
| 6 | El indicador de NinjaTrader lee `es_checklist=true & activa=true`, con `fase`, `setup`, `bloquea_go` y `evidencia` | `NinjaTrader/ChecklistChaumer.cs:929` | Si la etapa nueva se activa con esas mismas columnas, **puede que no haga falta tocar el `.cs`**. Se confirma en 5c |
| 7 | Hoy (24/09) ya tiene sus **17 casillas viejas** marcadas y 1 trade | `sesion_checklist` | Al pasar a la etapa nueva, esas 17 filas **se quedan en la base** pero **no cuentan** en ninguna etapa. Es el precio del piloto: la etapa anterior pierde un día |
| 8 | «Contexto / tendencia a favor» es casilla aquí y **no es regla del plan** | `catalogo_reglas.chk_contexto` | Se queda solo en la etapa anterior |

---

## 3 · El modelo

### 3.1 · Etapas

Tabla nueva **`disciplina_etapas`**:

| id | nombre | desde | hasta |
|---|---|---|---|
| 1 | Rulebook propio | — | 2026-09-23 |
| 2 | Plan de Chaumer | 2026-09-24 | — |

La etapa de un día es la que contiene su fecha. **Un día pertenece a una sola etapa, entero.**

### 3.2 · `catalogo_reglas` gana tres columnas

| Columna | Qué es |
|---|---|
| `etapa smallint` | a qué etapa pertenece. **La disciplina cuenta las reglas de la etapa del día, estén activas o no** |
| `plan_reglas text[]` | las reglas del plan que cita (`{R-32,R-21}`); vacío en la etapa anterior |
| `origen text` | `journal` (etapa anterior) · `plan_linea` (una línea de la checklist diaria) · `plan_regla` (una de las 40 reglas) |

**`activa` cambia de significado, y es el arreglo del hallazgo 1:**
- **antes:** «cuenta en la disciplina y se ve en el checklist»;
- **ahora:** solo «se ve en el checklist para marcarla» (Diario, NinjaTrader).

La disciplina ya no mira `activa`, así que desactivar una regla nunca vuelve a borrar el pasado.

**Etapa anterior** = exactamente las **17 casillas activas de hoy**. `rr_1a1` y `rei_entrada` (inactivas) quedan con `etapa = NULL`: hoy **ya no cuentan**, y así se mantiene. **El 81,5 % (y cualquier cifra de feb–23 sep) no se mueve.** Es lo primero que se verifica.

### 3.3 · Las 40 reglas del plan en el Journal

Se copian a `catalogo_reglas` como `origen = plan_regla`, `etapa = 2`, `es_checklist = false`, `capa = 'plan'`, con `codigo` = su id (`R-01`…), `enunciado` literal y `titulo` = su enunciado. Se ven en **Estrategia**, de solo lectura, agrupadas por la categoría del plan. No son casillas: son el texto de referencia.

---

## 4 · Las casillas de la etapa nueva, línea por línea

Las 48 líneas de `CHECKLIST_DIARIA.md` (versión 3.12). **El texto guardado es el literal de la línea**, sin
negritas ni el prefijo «(solo Continuación)»: el setup lo marca la columna.

**Tipos:** ✋ **casilla** (la marca Kris) · ⚙️ **automática** (la calcula el Journal) · 📖 **guía** (se ve en
Estrategia, no se puntúa).
**Fase:** 1 = antes y premercado · 2 = lectura del setup (hasta el GO) · 3 = ejecución.
**GO** = hay que marcarla para dar GO (`bloquea_go`). Las de fase 3 no lo bloquean: son hechos posteriores
a la entrada (invariante 7 de la disciplina).
**Criterio usado, sin inventar condiciones:** es ✋ o ⚙️ si el plan dice «si falla → no se opera / se para»
o si es un paso de ejecución verificable ese día; es 📖 si describe cómo dibujar, medir o una aclaración.

### 🅰 Antes de abrir NinjaTrader

| # | Línea (resumen) | Tipo | Fase | Setup | GO | Aplica | Reglas |
|---|---|---|---|---|---|---|---|
| 2 | ¿Estoy bien, física y mentalmente? | ✋ | 1 | — | ✔ | siempre | R-37 |
| 3 | Forex Factory: ¿evento de la Fed en rojo hoy? | ✋ | 1 | — | ✔ | siempre | R-36 |
| 4 | Forex Factory: anotar la hora de cada noticia roja | ✋ | 1 | — | ✔ | siempre | R-35 |
| 5 | Calcular las ventanas T−5 → T+5 | 📖 | | | | | R-35 · *el Journal ya las calcula de `sesion_noticias`* |

### 🅱 Premercado

| # | Línea | Tipo | Fase | Setup | GO | Aplica | Reglas |
|---|---|---|---|---|---|---|---|
| 7 | Gráfico: MNQ, 1 minuto, único indicador Volume Up Down | ✋ | 1 | — | ✔ | siempre | R-03, R-01 |
| 8 | Escanear desde 19:00 Col hasta la apertura | 📖 | | | | | R-15 |
| 9 | Toda vela que supere el umbral de volumen → marcar zona | ✋ | 1 | — | ✔ | siempre | R-15 |
| 10 | Mirar el umbral vigente en PARAMETROS.md | 📖 | | | | | R-15 |
| 11 | Se marcan todas las que superen el umbral | 📖 | | | | | R-15 |
| 12 | Límites: del borde del cuerpo a la punta de la mecha | 📖 | | | | | R-09 |
| 13 | Zona que toca otra → estirar la existente | 📖 | | | | | R-13 |
| 14 | Zona entre dos zonas: solo si no cruza el 50 % | 📖 | | | | | R-12 |

### 🅲 Ventana operativa

| # | Línea | Tipo | Fase | Setup | GO | Aplica | Reglas |
|---|---|---|---|---|---|---|---|
| 16 | Primer setup válido; no se espera uno mejor | ✋ | 2 | — | ✔ | siempre | R-23 |
| 17 | ¿Es Continuación o Reingreso? | 📖 | | | | | *es el selector de setup del Diario* |
| 18 | ¿La corrida es FLUIDA? (las tres condiciones) | ✋ | 2 | continuación | ✔ | siempre | R-40 |
| 20 | Stop de Continuación: extremo del retroceso | ✋ | 2 | continuación | ✔ | siempre | R-32 |
| 21 | Stop de Reingreso: extremo de la corrida fallida | ✋ | 2 | reingreso | ✔ | siempre | R-32 |
| 22 | Target = misma distancia, al otro lado. 1:1 | ✋ | 2 | — | ✔ | siempre | R-32 |
| 24 | Stop ≤ 80 puntos | ⚙️ | 2 | — | — | siempre | R-31 · *mismo cálculo que hoy (MAE en puntos)* |
| 25 | Target 1:1 libre de zonas vigentes | ✋ | 2 | — | ✔ | siempre | R-32, R-21 |
| 26 | Target sin pasar del punto de referencia | ✋ | 2 | reingreso | ✔ | siempre | R-41, R-26 |
| 27 | ¿La corrida es fluida? (como filtro) | 📖 | | | | | R-40 · *la misma pregunta que la 18* |
| 28 | ¿Día de FOMC y el setup es Continuación? | ⚙️ | 2 | — | — | día FOMC | R-36 · *mismo cálculo que hoy* |
| 30 | ¿Dentro de ventana de noticia? → no colocar | ⚙️ | 3 | — | — | hay noticia | R-35 · *mismo cálculo que hoy (±5 min)* |
| 31 | Stop Market al cierre de la vela, 1 tick más allá | ✋ | 3 | — | — | siempre | R-24 |
| 32 | La orden sobre el gráfico de MNQ | ⚙️ | 3 | — | — | siempre | R-01 · **nueva**: `trades.instrument` empieza por `MNQ` |
| 33 | No se persigue el precio: nada de orden a mercado ni límite | ✋ | 3 | — | — | siempre | R-24 |
| 35–39 | Vigilar la orden pendiente (5 velas, vuelta al stop, 11:29 ET, retroceso no cancela, noticia) | 📖 | | | | | R-29, R-35 · *solo aplican si la orden no se llenó, y no hay dato para saberlo* |

### 🅳 Tras el llenado

| # | Línea | Tipo | Fase | Setup | GO | Aplica | Reglas |
|---|---|---|---|---|---|---|---|
| 41 | 1º mover el stop a su nivel estructural | ✋ | 3 | — | — | siempre | R-31 |
| 42 | 2º mover el target a distancia 1:1 | ✋ | 3 | — | — | siempre | R-31, R-32 |
| 43 | NO SE TOCA NADA MÁS. JAMÁS | ✋ | 3 | — | — | siempre | R-33 · *el tipo de salida (Stop1/Target1) no ve si se movió el stop: declarada* |
| 44 | Solo dos salidas: stop o target | 📖 | | | | | R-33 · *la misma que la 43* |
| 45 | Cupo consumido: no más órdenes hoy | ⚙️ | 3 | — | — | siempre | R-28 · **nueva**: ≤ 1 trade ese día |
| 46 | El fin de ventana no obliga a cerrar | 📖 | | | | | R-30 |

### 🔴 Añadidos del 27/08

| # | Línea | Tipo | Fase | Setup | GO | Aplica | Reglas |
|---|---|---|---|---|---|---|---|
| 48–54 | Siete precisiones de marcado de zonas | 📖 | | | | | R-10, R-11, R-17–R-22 |
| 56 | El stop es el extremo desde que nació la zona | 📖 | | | | | R-32 · *precisa las líneas 20–21* |
| 57 | Reingreso: ¿el precio ya superó el extremo de la vela de consecución? → no hay reingreso | ✋ | 2 | reingreso | ✔ | siempre | R-26 |
| 58 | Entradas en los dos sentidos | 📖 | | | | | R-27 |

### Dos automáticas que salen de reglas, no de líneas

| Regla | Qué se comprueba | Fase | Aplica |
|---|---|---|---|
| R-02 | La entrada cae entre **09:30 y 11:30 ET** (hora de `trades.entry_time`, Colombia, convertida con `horaEt()`) | 3 | siempre |
| R-04 | Todos los trades del día con **qty = 1** | 3 | siempre |

### En números

| | Etapa anterior | Etapa nueva |
|---|---|---|
| Casillas que marca Kris | 14 declaradas | **18** (5 de fase 1 · 8 de fase 2 · 5 de fase 3) |
| Automáticas | 3 | **7** (3 de siempre + 4 nuevas) |
| En un día operado de Continuación | 17 ítems | 15 declaradas (5 + 5 + 5) + las automáticas que apliquen |
| Guía, sin puntuar | — | 25 líneas |

Las automáticas devuelven `null` si no hay trade (no cuentan), como hoy.

---

## 5 · La sincronización (plan → Journal, un solo sentido)

- **`scripts/plan/mapa-casillas.json`** (en el Journal, no en el plan): una entrada por casilla o automática,
  con su `codigo` estable (`p2_bienestar`, `p2_corrida_fluida`, `p2_una_operacion`…), la **línea literal**
  del plan que la identifica, y tipo, fase, setup, GO y aplica de la tabla del §4. Es lo único que decide Kris.
- **`scripts/plan/sincronizar.mjs`** lee `CHECKLIST_DIARIA.md` y `reglas.json` (**solo lectura**) y el mapa, y
  genera el SQL de `catalogo_reglas` (40 reglas + 25 casillas y automáticas). **Claude lo aplica por el MCP**,
  como las migraciones: no hace falta ninguna clave nueva.
- **Si Cowork cambia una línea**, el script no la encuentra en el mapa y **lo dice**, sin tocar esa casilla. El
  resto se sincroniza. Nunca borra: una casilla que desaparece del plan pasa a `activa = false`, y su historial
  sigue contando.
- Cuándo se corre: al cerrar la fase, y después cada vez que Cowork cambie la checklist o las reglas
  (`chaumer/01_Plan/ESTADO.md` lo dice).

---

## 6 · La disciplina por etapa

- **Cálculo** (`js/db.js`, único sitio): cada sesión se evalúa con las reglas **de su etapa**, no con las
  activas. Nada más cambia: aplicabilidad por fase, setup, `aplica_si`, automáticas, errores que tumban una
  casilla y días sin conexión, igual que hoy.
- **Qué va por etapa:** disciplina %, fase más débil y desglose por regla. **Qué no:** errores %, días limpios
  y racha, que cuentan días y no reglas.
- **Selector de etapa** en la barra superior (`Nav.HERRAMIENTAS`) de **Disciplina**, **Calendario** (la card)
  y **Análisis**. Por defecto, la actual. Un período que cruza el 24/09 solo cuenta los días de la etapa
  elegida: septiembre, en la etapa nueva, es del 24 al 30.
- El Coach y el modal del día usan las reglas de la etapa **de la fecha** que miran.

---

## 7 · Lo que arrastra

| Sitio | Cambio |
|---|---|
| **Diario** (`js/form.js`) | Enseña las casillas activas: las nuevas desde 5b. Las ⚙️ se ven como hoy (calculadas, no se marcan) |
| **NinjaTrader** `ChecklistChaumer` | Lee las activas con las mismas columnas. **Se prueba en 5c**; si hay que tocar el `.cs`, **Kris recompila en NT8** |
| **Coach** (`js/coach.js`) | Lista de reglas y errores vinculables de la etapa de la fecha |
| **Estrategia** (`js/estrategia.js`) | Pestaña **Plan de Chaumer**: las 40 reglas y la checklist de 48 líneas con su tipo, **de solo lectura**. Lo anterior, marcado «Etapa anterior» y también de solo lectura |
| **Docs** | `docs/metodologia-chaumer.md` apunta al plan; `docs/Disciplina.md` y `.claude/rules/disciplina.md` ganan la etapa; `CLAUDE.md`, el invariante nuevo; D-024 |
| Bot de Telegram | Nada |

**Invariante nuevo** (va al `CLAUDE.md`): *la disciplina cuenta las reglas de la etapa del día; `activa` solo
decide qué se ve para marcar. Desactivar una regla nunca cambia el pasado.*

---

## 8 · Hoy, el piloto

1. Tras 5b, el Diario de hoy enseña el checklist nuevo. **Kris rellena las casillas del trade de hoy**
   (08:47, 1 MNQ, stop).
2. Se comprueba con un `SELECT` que las filas son de la etapa 2 y que la disciplina de hoy sale del cálculo
   a mano.
3. Las **17 casillas viejas de hoy se quedan en la base** y no cuentan (hallazgo 7).

---

## 9 · Fases

Cada una se verifica por separado. Estimación en llamadas.

### 5a · Etapas y disciplina por etapa, sin reglas nuevas (~20)

- Migración: `disciplina_etapas` (solo la **etapa 1** por ahora, sin fechas), columnas `etapa`, `plan_reglas`,
  `origen`; `etapa = 1` en las 17 casillas activas.
- `db.js`: la etapa de una fecha y el cálculo con las reglas de la etapa. Selector en las tres pantallas.
- **Verificado cuando:** con la copia local, **la disciplina de feb–sep sale idéntica antes y después**
  (card, dashboard, Análisis); un `SELECT` confirma que las 17 tienen `etapa = 1` y las 2 inactivas `NULL`;
  consola limpia; móvil.

### 5b · Las reglas del plan y la etapa nueva (~25)

- `mapa-casillas.json` + `sincronizar.mjs`; aplicar: 40 reglas + 25 filas de la etapa 2.
- Las 4 automáticas nuevas en `reglaAutoResultado`.
- Etapa 2 desde el 24/09; las 17 viejas pasan a `activa = false` (siguen contando en la etapa 1).
- **Verificado cuando:** el Diario enseña el checklist nuevo; Kris rellena el piloto; un `SELECT` confirma las
  filas y la disciplina de hoy cuadra con la cuenta a mano; **la etapa anterior sigue en su cifra**.

### 5c · Coach, Estrategia, NinjaTrader y documentos (~20)

- Coach por etapa de la fecha; Estrategia de solo lectura; docs e invariante.
- NinjaTrader: Kris abre el indicador y mira si sale la lista nueva. Si hay que tocar el `.cs`, se toca y se le
  avisa para **recompilar**.
- **Verificado cuando:** el Coach de una fecha vieja cita reglas viejas y el de hoy las nuevas; Estrategia
  enseña las 40 reglas y las 48 líneas; NinjaTrader marca y la casilla llega a `sesion_checklist`.

---

## 10 · Riesgos

| Riesgo | Qué lo evita |
|---|---|
| La cifra de la etapa anterior cambia | 5a solo se da por buena si sale **idéntica**, antes y después |
| Cowork cambia el formato de la checklist | el script avisa y no toca lo que no reconoce |
| Se mezclan etapas en un mes | un día es de una sola etapa; el selector filtra por días |
| «1 contrato» da falsos si se vuelve a regularizar `trades` | anotado aquí y en D-024; la regularización fue solo de fechas anteriores |
| El stop ≤ 80 se mide con el MAE, no con el stop colocado | igual que hoy; se hereda, no se introduce |
| La etapa nueva tiene pocos días al principio | el selector enseña cuántos días lleva cada etapa |

---

## 11 · Lo que decide Kris al aprobar

1. **La tabla del §4**, línea por línea: si alguna ✋ debería ser 📖 o al revés, o cambiar el GO.
2. Las **dos automáticas que no salen de una línea** (ventana 09:30–11:30 ET y 1 contrato): ¿entran?
