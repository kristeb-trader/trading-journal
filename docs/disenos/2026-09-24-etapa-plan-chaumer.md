# Fase 5 — Una sola lista de reglas: la etapa del plan de Chaumer

**Versión:** v2.3 · **Estado:** ✅ **CERRADO el 24/09/2026.** Fase 5 completa (5a, 5b y 5c).
**Escrito:** 24/09/2026. Es el sub-diseño de la fase 5 de `docs/disenos/2026-09-24-unificacion-chaumer.md`.

| Versión | Fecha | Qué cambió |
|---|---|---|
| v1 | 24/09/2026 | Primera versión, tras el diagnóstico y las dos decisiones de Kris |
| v2 | 24/09/2026 | **Checklist simple, decidido por Kris línea por línea:** 2 casillas (corrida fluida · punto de referencia) y las 7 automáticas. Las noticias se siguen anotando como hoy. El resto de la checklist del plan, como guía |
| v2.1 | 24/09/2026 | 5a cerrada. **Desvío de §6:** el selector de etapa va solo en Disciplina, dentro del desplegable de período; Calendario y Análisis usan la etapa del período, sin selector |
| v2.2 | 24/09/2026 | 5b cerrada: la etapa 2 activa desde el 24/09, el plan en `catalogo_reglas` y el piloto de hoy hecho por Kris (6/6) |
| v2.3 | 24/09/2026 | 5c cerrada: Coach y Diario por etapa de la fecha, Estrategia de solo lectura, `plan_linea`, documentos. NinjaTrader no necesitó cambios |

> El diseño aprobado manda sobre la implementación. Toca invariantes del Journal (disciplina en `db.js`,
> `sesion_checklist`, soft-delete de reglas): **no se implementa nada hasta el sí de Kris.**

---

## 1 · Lo decidido

| Fecha | Decisión | Quién |
|---|---|---|
| 24/09 | La historia no se toca: las reglas de hoy y sus casillas quedan como **etapa anterior** | Kris (diseño general) |
| 24/09 | La etapa nueva usa el plan de Chaumer; el texto se edita **solo** en el plan (Cowork) | Kris (diseño general) |
| 24/09 | La disciplina se calcula **por etapa**, con selector; por defecto, la actual | Kris (diseño general) |
| 24/09 | Las casillas salen de la checklist diaria del plan (`chaumer/01_Plan/CHECKLIST_DIARIA.md`): cada línea es *casilla*, *automática* o *guía* | Kris |
| 24/09 | **La etapa nueva empieza hoy, 24/09/2026**, y el trade de hoy es el **piloto** | Kris |
| 24/09 | **Checklist simple: solo 2 casillas** — «la corrida es fluida» (Continuación) y «el target no pasa del punto de referencia» (Reingreso). Las otras 16 propuestas, **no** | Kris, línea por línea |
| 24/09 | **Las 7 automáticas, sí** — las 3 de hoy y las 4 nuevas (una operación, MNQ, 1 contrato, entrada 09:30–11:30 ET) | Kris |
| 24/09 | **Las noticias rojas se siguen anotando como hoy** (noticia y hora). Sin casilla nueva para eso | Kris |

---

## 2 · Lo que el código obliga a resolver (diagnóstico)

| # | Hallazgo | Dónde | Consecuencia |
|---|---|---|---|
| 1 | **La disciplina usa las reglas ACTIVAS de hoy sobre TODA la historia.** Desactivar una regla la borra de la disciplina de los días pasados | `js/disciplina.js:604`, `js/metrics.js:903` (`soloActivos: true`), `js/db.js:401` (`activo !== false`) | Ya pasó: `rr_1a1`, desactivada con 135 casillas (feb → 14 ago), dejó de contar sin que nadie lo notara. **La etapa nueva no se puede hacer desactivando las 17 casillas de hoy**: la anterior se quedaría sin reglas. Hace falta que cada regla **pertenezca a una etapa** |
| 2 | El plan tiene **40 reglas**, y la mitad son definiciones de dibujo (zonas, estructura). Su **checklist diaria** son **48 líneas** y cada una cita sus reglas | `01_Plan/reglas.json`, `01_Plan/CHECKLIST_DIARIA.md` | Las casillas salen de las líneas (decisión de Kris) |
| 3 | Siete comprobaciones **se pueden hacer con los datos** (trades, noticias, FOMC) | `trades.instrument`, `qty`, `entry_time`; `sesion_noticias`; `catalogo_fechas` | 3 automáticas ya existen (stop, noticia, FOMC); **4 nuevas** |
| 4 | `trades.qty` de agosto–septiembre está **regularizado** a ±$160 (2 y 3 contratos, D-020). Desde que la principal es Sim101 es real (hoy: 1) | consulta del 24/09 | «1 contrato» automático solo es fiable **desde la etapa nueva**. Si algún día se vuelve a regularizar, daría falsos |
| 5 | **El bot de Telegram no toca el checklist** | `TelegramBot/worker.js:69`, `:220` | Se corrige el diseño general: no hay que adaptarlo |
| 6 | El indicador de NinjaTrader lee `es_checklist=true & activa=true`, con `fase`, `setup`, `bloquea_go` y `evidencia`, y es también donde se anotan las noticias | `NinjaTrader/ChecklistChaumer.cs:929`, `:812`–`:829` | Si la etapa nueva usa esas mismas columnas, **puede que no haga falta tocar el `.cs`**. Las noticias no cambian. Se confirma en 5c |
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

### 3.2 · `catalogo_reglas` gana cuatro columnas

| Columna | Qué es |
|---|---|
| `etapa smallint` | a qué etapa pertenece. **La disciplina cuenta las reglas de la etapa del día, estén activas o no** |
| `plan_reglas text[]` | las reglas del plan que cita (`{R-41,R-26}`); vacío en la etapa anterior |
| `origen text` | `journal` (etapa anterior) · `plan_linea` (una línea de la checklist diaria) · `plan_regla` (una de las 40 reglas) |
| `plan_tipo text` | solo en `plan_linea`: `casilla` · `auto` · `guia` |

**`activa` cambia de significado, y es el arreglo del hallazgo 1:**
- **antes:** «cuenta en la disciplina y se ve en el checklist»;
- **ahora:** solo «se ve en el checklist para marcarla» (Diario, NinjaTrader).

La disciplina ya no mira `activa`, así que desactivar una regla nunca vuelve a borrar el pasado.

**Etapa anterior** = exactamente las **17 casillas activas de hoy**. `rr_1a1` y `rei_entrada` (inactivas) quedan con `etapa = NULL`: hoy **ya no cuentan**, y así se mantiene. **El 81,5 % (y cualquier cifra de feb–23 sep) no se mueve.** Es lo primero que se verifica.

### 3.3 · El plan entero, en el Journal y de solo lectura

- Las **40 reglas** se copian como `origen = plan_regla`, `etapa = 2`, `es_checklist = false`, `capa = 'plan'`,
  `codigo` = su id (`R-01`…), `titulo` y `enunciado` literales.
- Las **48 líneas** de la checklist diaria se copian como `origen = plan_linea`, cada una con su `plan_tipo`.
  Solo las `casilla` y `auto` tienen `es_checklist = true`; las 41 `guia`, `es_checklist = false`.
- Todo se ve en **Estrategia**, de solo lectura.

---

## 4 · El checklist de la etapa nueva

**Tipos:** ✋ **casilla** (la marca Kris) · ⚙️ **automática** (la calcula el Journal) · 📖 **guía** (se lee en
Estrategia; no se marca ni se puntúa).
**Fase:** 2 = lectura del setup (hasta el GO) · 3 = ejecución. **No hay nada en la fase 1.**
**GO** = hay que marcarla para dar GO (`bloquea_go`).
**El texto guardado es el literal de la línea del plan**, sin negritas ni el prefijo «(solo …)»: el setup lo
marca la columna.

### ✋ Las 2 casillas

| Línea | Qué dice | Fase | Setup | GO | Reglas |
|---|---|---|---|---|---|
| 18 | ¿La corrida es FLUIDA? Tres cosas seguidas: la corrida dejó su zona · el retroceso no se pasó · y ésta es la corrida siguiente, que la rompe | 2 | continuación | ✔ | R-40 |
| 26 | Target sin pasar del punto de referencia vivo más cercano entre la entrada y el objetivo | 2 | reingreso | ✔ | R-41, R-26 |

### ⚙️ Las 7 automáticas

| Origen | Qué comprueba | Cómo | Fase | Aplica |
|---|---|---|---|---|
| Línea 24 | Stop ≤ 80 puntos | mismo cálculo que hoy (MAE en puntos) | 2 | siempre |
| Línea 28 | En día FOMC, solo Reingreso | mismo cálculo que hoy | 2 | día FOMC |
| Línea 30 | No entrar en la ventana de una noticia roja (±5 min) | mismo cálculo que hoy, con las noticias que Kris anota como siempre | 3 | hay noticia |
| Línea 45 | Una sola operación ese día | **nueva:** ≤ 1 trade en `trades` ese día | 3 | siempre |
| Línea 32 | La orden, en MNQ | **nueva:** `trades.instrument` empieza por `MNQ` | 3 | siempre |
| Regla R-04 | 1 contrato | **nueva:** todos los trades del día con `qty = 1` | 3 | siempre |
| Regla R-02 | Entrada dentro de la ventana 09:30–11:30 ET | **nueva:** `entry_time` (Colombia) convertida con `horaEt()` | 3 | siempre |

Las automáticas devuelven `null` si no hay trade: ese día no cuentan, como hoy.

### 📖 Todo lo demás, como guía

Las otras **41 líneas** de la checklist del plan (Kris dijo NO a 16 propuestas como casilla; las demás ya eran
guía): antes de abrir NinjaTrader, premercado, medir stop y target, enviar, vigilar la orden, tras el llenado
y las precisiones de zonas. Se leen en Estrategia con su bloque y sus reglas.

### En números

| | Etapa anterior | Etapa nueva |
|---|---|---|
| Casillas que marca Kris | 14 | **2** (una por setup: **1 al día**) |
| Automáticas | 3 | **7** |
| Un día operado | 17 ítems | **1 casilla + 5 automáticas** (+ noticia si la hay, + FOMC si lo es) |
| Un día **sin operar** | fase 1 (3 casillas) | **nada: no tiene disciplina** |

> ⚠️ **Consecuencia que conoce Kris:** la disciplina de la etapa nueva mide sobre todo lo que dicen los datos
> (5 de cada 6 ítems en un día normal). Los días sin operar no suman ni restan.

---

## 5 · La sincronización (plan → Journal, un solo sentido)

- **`scripts/plan/mapa-casillas.json`** (en el Journal, no en el plan): las 2 casillas y las 7 automáticas,
  cada una con su `codigo` estable (`p2_corrida_fluida`, `p2_punto_referencia`, `p2_stop_max`,
  `p2_fomc_continuacion`, `p2_noticia`, `p2_una_operacion`, `p2_instrumento`, `p2_un_contrato`,
  `p2_ventana_horaria`), la **línea literal** del plan que la identifica, y fase, setup, GO y aplica del §4.
  Toda línea que no esté en el mapa es **guía**.
- **`scripts/plan/sincronizar.mjs`** lee `CHECKLIST_DIARIA.md` y `reglas.json` (**solo lectura**) y el mapa, y
  genera el SQL de `catalogo_reglas` (40 reglas + 48 líneas + 2 automáticas que salen de reglas). **Claude lo
  aplica por el MCP**, como las migraciones: no hace falta ninguna clave nueva.
- **Si Cowork cambia una línea que es casilla o automática**, el script no la encuentra y **lo dice**, sin tocar
  esa fila. Las guías se actualizan solas. Nunca borra: lo que desaparece del plan pasa a `activa = false`, y su
  historial sigue contando.
- Cuándo se corre: al cerrar la 5b, y después cada vez que Cowork cambie la checklist o las reglas.

---

## 6 · La disciplina por etapa

- **Cálculo** (`js/db.js`, único sitio): cada sesión se evalúa con las reglas **de su etapa**, no con las
  activas. Nada más cambia: aplicabilidad por fase, setup, `aplica_si`, automáticas, errores que tumban una
  casilla y días sin conexión, igual que hoy.
- **Qué va por etapa:** disciplina %, fase más débil y desglose por regla. **Qué no:** errores %, días limpios
  y racha, que cuentan días y no reglas.
- **Qué etapa se mide** *(v2.1, al implementar 5a)*: por defecto, **la del período**, que es la del día hábil
  más reciente que contiene. Un período que cruza el 24/09 solo cuenta los días de esa etapa: septiembre,
  en la etapa nueva, es del 24 al 30. Agosto se mide con la anterior sin tocar nada.
- **Selector de etapa** solo en **Disciplina**, como segundo grupo del **desplegable de período** («La del
  período» · cada etapa), y solo cuando hay más de una. Con dos etapas, su nombre va junto al período en la
  barra. *Desvío del diseño:* decía selector en Disciplina, Calendario y Análisis; Análisis ya lleva dos
  controles en la barra y un tercero no cabe a 375 px. Calendario y Análisis usan siempre la del período.
- El Coach y el modal del día usan las reglas de la etapa **de la fecha** que miran.

---

## 7 · Lo que arrastra

| Sitio | Cambio |
|---|---|
| **Diario** (`js/form.js`) | Enseña las casillas activas: desde 5b, la del setup elegido y las automáticas (calculadas, no se marcan). Las noticias, igual que hoy |
| **NinjaTrader** `ChecklistChaumer` | Lee las activas con las mismas columnas; la fase 1 queda vacía. Las noticias, igual. **Se prueba en 5c**; si hay que tocar el `.cs`, **Kris recompila en NT8** |
| **Coach** (`js/coach.js`) | Lista de reglas y errores vinculables de la etapa de la fecha |
| **Estrategia** (`js/estrategia.js`) | Pestaña **Plan de Chaumer**: las 40 reglas y la checklist de 48 líneas con su tipo, **de solo lectura**. Lo anterior, marcado «Etapa anterior», también de solo lectura |
| **Docs** | `docs/metodologia-chaumer.md` apunta al plan; `docs/Disciplina.md` y `.claude/rules/disciplina.md` ganan la etapa; `CLAUDE.md`, el invariante nuevo; D-024 |
| Bot de Telegram | Nada |

**Invariante nuevo** (va al `CLAUDE.md`): *la disciplina cuenta las reglas de la etapa del día; `activa` solo
decide qué se ve para marcar. Desactivar una regla nunca cambia el pasado.*

---

## 8 · Hoy, el piloto

1. Tras 5b, el Diario de hoy enseña el checklist nuevo. **Kris elige el setup del trade de hoy** (08:47, 1 MNQ,
   stop) y marca su casilla.
2. Las automáticas de hoy se calculan solas: stop, una operación, MNQ, 1 contrato, entrada en ventana.
3. Se comprueba con un `SELECT` que las filas son de la etapa 2 y que la disciplina de hoy sale igual que la
   cuenta a mano.
4. Las **17 casillas viejas de hoy se quedan en la base** y no cuentan (hallazgo 7).

---

## 9 · Fases

Cada una se verifica por separado. Estimación en llamadas.

### 5a · Etapas y disciplina por etapa, sin reglas nuevas (~20) ✅ CERRADA el 24/09/2026

*Resultado:*
- Migración `2026-09-24-disciplina-etapas`: tabla `disciplina_etapas` (solo la etapa 1, sin fechas), columnas
  `etapa`, `plan_reglas`, `origen`, `plan_tipo`. **Las 17 casillas activas → `etapa = 1`**; `rr_1a1` y las
  11 de filosofía y archivadas, `NULL`. Comprobado con un `SELECT`.
- `db.js`: `etapaDeFecha`, `reglaEnEtapa`, `etapaDelPeriodo`; `calcDisciplinaStats` cuenta las reglas de la
  etapa del día, **activas o no**; `DB.getEtapas`, `checklistTodos`, `checklistDeEtapa`, `etapaVista`. Si no
  se pueden leer las etapas, vuelve al criterio viejo (activas).
- Dashboard de Disciplina (disciplina y fases por etapa; racha e historial con las reglas de cada día),
  card del Calendario, Análisis y el modal del día (las reglas de la etapa de ESE día).
- **Verificado, con los datos reales** (164 sesiones, 113 trades, 30 errores con regla, exportados por el MCP
  y pasados por el `db.js` de antes y el de después): **813/916 = 89 %, idéntico**, y los 8 meses idénticos
  (feb 77 · mar 75 · abr 80 · may 93 · jun 95 · jul 100 · ago 97 · sep 100); la lista del Dashboard, las
  mismas 17; y sin etapas cargadas, también idéntico. Simulada la 5b, la etapa 1 deja fuera solo el 24/09.
- En el preview: Calendario, Disciplina, Análisis y el modal del día, sin errores; el selector, simulado con
  dos etapas, a 375 px.
- **Desvíos:** el del selector (§6); y `setEtapaVista` pasó a `elegirEtapaVista`, porque el modo local anula
  los métodos que empiezan por `set` (los toma por escrituras en la BD).

*Lo que se diseñó:*

- Migración: `disciplina_etapas` (solo la **etapa 1** por ahora, sin fechas); columnas `etapa`, `plan_reglas`,
  `origen`, `plan_tipo`; `etapa = 1` en las 17 casillas activas.
- `db.js`: la etapa de una fecha y el cálculo con las reglas de la etapa. Selector en las tres pantallas.
- **Verificado cuando:** con la copia local, **la disciplina de feb–sep sale idéntica antes y después**
  (card, dashboard, Análisis); un `SELECT` confirma que las 17 tienen `etapa = 1` y las 2 inactivas `NULL`;
  consola limpia; móvil. **Kris no nota nada.**

### 5b · Las reglas del plan y la etapa nueva (~25) ✅ CERRADA el 24/09/2026

*Resultado:*
- `scripts/plan/mapa-casillas.json` (las 9 decisiones de Kris) y `scripts/plan/sincronizar.mjs`: casa el mapa
  con el plan y genera el SQL. Primera sincronización: **40 reglas + 48 líneas (2 casillas, 5 automáticas,
  41 guía) + 2 automáticas de regla = 90 filas**, todo el mapa casado.
- `db.js`: `AUTO_ALIAS` (stop, FOMC y noticia reutilizan su cálculo de siempre) y las 4 automáticas nuevas
  (`p2_una_operacion`, `p2_instrumento`, `p2_un_contrato`, `p2_ventana_horaria`, esta con `horaEt()`). El
  Dashboard explica cada una cuando falla.
- Migración `2026-09-24-etapa-plan-chaumer`: `plan_bloque`; etapa 1 hasta el 23/09 y etapa 2 desde el 24/09;
  las 90 filas; las 17 casillas viejas a `activa = false`. **Orden:** primero se publicó el código y después
  se aplicó la migración, para que la app nunca viera reglas que no sabía calcular.
- **Verificado:**
  - `SELECT`: 2 etapas con sus fechas; visibles para marcar, exactamente las 9 de la etapa 2; las 17 viejas
    en la etapa 1 e inactivas;
  - con los datos reales y el `db.js` nuevo: la etapa 1 da **806/909** (la de siempre sin el 24/09), agosto
    sigue en 115/119; la ventana horaria acierta en verano (10:31 Col = 11:31 ET → fuera) y en invierno
    (09:35 Col = 09:35 ET → dentro);
  - el Diario en el preview: sin fase 1, la casilla «¿La corrida es FLUIDA?» en la fase 2 al elegir
    Continuación, y el separador del GO debajo;
  - **el piloto:** Kris marcó la casilla en el Diario (18:16). En la base, `p2_corrida_fluida = true` en la
    etapa 2, y las 17 filas viejas del día intactas. Hoy: casilla ✔ · stop 27,25 pts ✔ · MNQ ✔ · una
    operación ✔ · 1 contrato ✔ · entrada 08:47 Col = 09:47 ET ✔ → **6/6, 100 %**. Noticia y FOMC no
    aplican (no hubo).
- **Desvíos:**
  - dos líneas de guía acababan en «— —» (la columna «Si falla» del plan con un guion): el sincronizador ya
    descarta esas celdas;
  - al aplicar la primera vez se omitió el `update … not in (…)` de la etapa 2, porque no había nada que
    desactivar. El archivo lo conserva para las sincronizaciones siguientes.

*Lo que se diseñó:*

- `mapa-casillas.json` + `sincronizar.mjs`; aplicar: 40 reglas + 48 líneas + 2 automáticas de regla.
- Las 4 automáticas nuevas en `reglaAutoResultado`.
- Etapa 2 desde el 24/09; las 17 viejas pasan a `activa = false` (siguen contando en la etapa 1).
- **Verificado cuando:** el Diario enseña el checklist nuevo; Kris hace el piloto; un `SELECT` confirma las
  filas y la disciplina de hoy cuadra con la cuenta a mano; **la etapa anterior sigue en su cifra**.

### 5c · Coach, Estrategia, NinjaTrader y documentos (~20) ✅ CERRADA el 24/09/2026

*Resultado:*
- **Coach:** analiza cada fecha con el reglamento de su etapa. Antes del 24/09, las mismas **28** reglas
  de siempre (17 casillas + 11 de filosofía); desde el 24/09, las **49** del plan (40 reglas + 9 del
  checklist, sin las guías). Comprobado con un `SELECT`. El vínculo error → regla acepta los códigos de
  cualquier etapa.
- **Estrategia**, reescrita de solo lectura: pestaña «Plan de Chaumer» (Tu checklist · Checklist diaria en
  el orden del documento · Reglas por categoría) y «Etapa anterior» (su checklist y la filosofía). Lo
  único editable, el límite del stop. Sin «Nueva regla». La tarjeta de Otros cuenta las reglas del plan.
- **Columna `plan_linea`** (migración `2026-09-24-plan-linea`): la posición de cada línea en el documento,
  para ordenarlas en Estrategia. `orden` no servía: decide el orden del checklist, con la casilla antes del GO.
- **Desvío, no previsto en el diseño:** el **Diario** también enseñaba las activas. Ahora pinta las casillas
  de la **etapa del día que se edita**: corregir un día anterior al 24/09 vuelve a enseñar sus 17 de
  entonces. Y se arregló que, al abrir un día sin sesión, el checklist se pintaba con la fecha anterior.
- **NinjaTrader:** el indicador ya hacía lo necesario (lee las activas; salta la fase vacía; no deja marcar
  ni exige para el GO las automáticas). **No se tocó el `.cs`: no hay que recompilar.** Falta que Kris lo
  mire abierto.
- Documentos: `docs/metodologia-chaumer.md` apunta al plan; `docs/Disciplina.md` gana las etapas;
  `CLAUDE.md`; D-024.
- **Verificado:** `node --check`; en el preview (etapas simuladas en la pestaña), el Diario cambia de
  checklist con la fecha (20/08 viejo · 24/09 nuevo · 18/08 viejo) y Estrategia enseña sus vistas sin errores,
  también a 375 px (las etiquetas se partían: ahora pasan enteras a la línea siguiente).

*Lo que se diseñó:*

- Coach por etapa de la fecha; Estrategia de solo lectura; docs e invariante.
- NinjaTrader: Kris abre el indicador y mira si sale la lista nueva y si sigue anotando noticias. Si hay que
  tocar el `.cs`, se toca y se le avisa para **recompilar**.
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
| La disciplina nueva es casi toda automática | decisión de Kris (§1); los datos no pueden «mentir» |
| La etapa nueva tiene pocos días al principio | el selector enseña cuántos días lleva cada etapa |

---

## 11 · Para aprobar

Todo lo que decidía Kris está decidido (§1). Solo falta su **«apruebo»** para empezar la **5a**, que no cambia
nada de lo que ve.
