# La disciplina mide el plan — el motor responde «¿era ese el trade?»

**Versión:** v3 · **Estado:** ✅ APROBADO por Kris (23/10/2026), **OPCIÓN A** · ✅ IMPLEMENTADO (23/10/2026) · D-047 ·
Relacionado: D-004 y D-024 (el criterio de disciplina), D-034 (`medir.py`, «el motor mide, el Coach juzga»),
`docs/Disciplina.md`, `.claude/rules/disciplina.md`. Boceto: OPCIÓN A / OPCIÓN B (imagen enviada el 23/10/2026).

---

## 1 · El problema (23/10/2026)

En la etapa 2 la disciplina son 9 reglas: 7 automáticas (MNQ, ventana, una operación, noticia, FOMC, stop ≤ 80,
riesgo ≤ $160) y 2 casillas (corrida fluida · punto de referencia). **Ninguna pregunta si el trade era el del plan.**

Octubre (01/10 → 23/10), con los datos de la BD:

| | La medida de hoy | Lo que pasó |
|---|---|---|
| Disciplina | **98 %** (92 de 94 ítems) | **10 de 16** días hiciste lo que decía el plan |
| Casillas | 13 de 15 en ✓ | coincidieron con el motor en **7 de 15** |
| Riesgo ≤ $160 | 0 fallos (se mide con el MAE) | 3 días con más contratos de los que cabían (08, 14, 21) |

Causas, de la que más pesa a la que menos:

1. Las automáticas son el perímetro: se cumplen aunque se opere fuera del plan (99 de 100 desde el 24/09).
2. Las casillas las marca Kris en directo y fallan en la mitad de los días. El 07/10 y el 15/10 marcó ✓ el punto de
   referencia y el motor descartó ese mismo trade por el punto de referencia.
3. El riesgo se mide con el MAE (lo que fue en contra), no con el stop × contratos. El 20/10 el trade tiene MAE 0
   con −$168: un dato sucio aprueba cualquier regla.
4. Errores y días limpios casi no tienen datos (2 errores en octubre).

Lo que lo hace posible ahora: cada día registrado tiene su ficha del motor, y `ficha.tu_operacion`
(`scripts/cadena/medir.py`) ya dice, por cada trade de Kris, si **coincide** con la operación del motor (mismo
sentido y llenado a ±2 velas), sus diferencias de precio y el riesgo deducido.

## 2 · Decisiones de Kris (23/10/2026)

- **Los días en que el plan operaba y Kris no son un AVISO**: se enseñan, no bajan el porcentaje.
- **La medida nueva arranca el 01/10/2026.** Del 24/09 al 30/09 se queda la medida de las 9 reglas.
- **La disciplina no mira el resultado.** El 07/10 y el 15/10 ganó saltándose el plan; medida en dinero, esos días
  contarían como buenos.

## 3 · La medida nueva

### 3.1 · El veredicto del día (el número principal)

Cada día hábil conectado desde el 01/10, con la ficha del motor y `tu_operacion`:

| Veredicto | Cuándo | Cuenta |
|---|---|---|
| `igual` | todos los trades de Kris `coincide = true` | ✅ sí |
| `bien` | el motor no operó y Kris tampoco | ✅ sí |
| `fuera` | Kris operó y el motor no operaba | ❌ sí |
| `otro` | los dos operaron, pero algún trade de Kris no coincide | ❌ sí |
| `aviso` | el motor operó y Kris no | ⚠️ no (se enseña) |
| `pendiente` | sin ficha `ok` (día sin registrar, el candado de D-026, o error del motor) | no |

**Disciplina % = días `igual` + `bien` ÷ días `igual` + `bien` + `fuera` + `otro`.** Octubre: 10 de 16 = **63 %**.

- Un segundo trade que el motor no tenía hace el día `otro`: la «una operación» queda dentro del veredicto.
- Si se corrige el motor, las fichas se rehacen y `medir_pendientes` rehace `tu_operacion`: el veredicto se
  recalcula solo. Nada se guarda: **se calcula**, como el veredicto de `chaumer_operativas`.
- Un día `pendiente` no se puede inventar: el candado de `motor_fichas` vive en la BD y no se toca.

### 3.2 · La ejecución (solo en los días `igual`)

| Comprobación | Cómo | Tolerancia |
|---|---|---|
| Precio de entrada | `diferencias.entrada` de `tu_operacion` (el precio real, no deducido) | ±5 puntos |
| Contratos | `trades.qty` ≤ `floor(160 / (riesgo del motor × $2))` | ninguna: son enteros |

El stop y el objetivo de Kris **no** se comparan: `medir.py` los deduce de la salida (1:1), no son los que puso.
Con el stop del plan para los contratos, el deslizamiento no cuela falsos fallos (el 20/10: 2 contratos, cabían 2).

Octubre: **6 de 9** — 08/10 (4 contratos, cabían 2), 21/10 (3, cabían 2), 16/10 (entrada a 20 puntos del plan).

### 3.3 · Las alarmas (todos los días operados)

Las automáticas de la etapa 2 se quedan como **alarmas**: se cuentan y se enseñan, pero **no forman el porcentaje**.

| Alarma | Cálculo | Cambia |
|---|---|---|
| MNQ · ventana 09:30–11:30 ET · noticia ±5 min · FOMC | `reglaAutoResultado`, igual que hoy | no |
| Stop ≤ 80 | el riesgo de `tu_operacion` (stop deducido) en vez del MAE | **sí**, desde el 01/10 |
| Riesgo ≤ $160 | solo en trades `fuera`/`otro` (los `igual` los mira la ejecución): `qty` ≤ `floor(160 / (riesgo × 2))` con el riesgo de Kris | **sí**, desde el 01/10 |

Sin `tu_operacion` (día pendiente), las dos que cambian vuelven al MAE: mejor un dato aproximado que ninguno.
Octubre: **1** — 14/10, 3 contratos con un stop de 27,5 puntos (cabían 2).

«Una operación» desaparece de las alarmas desde el 01/10: ya la cubre el veredicto.

### 3.4 · La lectura (informativa, no puntúa)

La casilla del setup (corrida fluida · punto de referencia) **se sigue marcando** antes de entrar —es el
compromiso de Kris—, pero desde el 01/10 no cuenta en la disciplina. Se compara con el motor:

- **Coincidió:** casilla ✓ y día `igual`, o casilla ✗ y el trade no era del plan.
- Octubre: **7 de 15**. Marcó ✓ y no era del plan: 01, 02, 06, 07, 14, 15. Marcó ✗ y sí lo era: 21, 22.

Separa «creí que era válido y no lo era» de «sabía que no y entré igual». Es material para el Coach.

### 3.5 · Lo que no cambia

- Del 24/09 al 30/09 y la etapa 1: la medida de siempre, con sus números. D-007 intacto.
- Errores por tipo, causa raíz, vínculo error → regla (sigue tumbando una casilla en la etapa 1 y en septiembre).
- El criterio vive **solo** en `js/db.js`; las pantallas delegan.
- Sábados y domingos, días sin conexión, `no_opero` por defecto: las invariantes 1–3 de `disciplina.md`.

## 4 · Un período, una medida

Igual que con las etapas: **un período se mide con la medida de su día más reciente** y los días de la otra no
entran. Octubre → la nueva; septiembre → la vieja (del 24 al 30, como hoy); «Todo» o el trimestre de
oct–dic → la nueva, solo desde el 01/10. No se mezclan ítems con días.

No es una etapa 3: el Coach y el catálogo preguntan por `etapa === 2` en varios sitios y las reglas de la etapa 2
solo las escribe `sincronizar.mjs`. Es una fecha dentro de la etapa 2, como `RIESGO_MAX_DESDE`:
`PLAN_MOTOR_DESDE = '2026-10-01'` en `db.js`.

## 5 · Dónde se ve

| Sitio | Hoy | Después (días desde el 01/10) |
|---|---|---|
| Disciplina (`disciplina.js`) | tira de 6 cifras, checklist por fase, racha, errores | **OPCIÓN A o B** (boceto) + errores como hoy |
| Tarjeta del calendario (`metrics.js`) | «Disciplina %» de ítems | el % de días; el subtítulo «10 de 16 días» |
| Análisis (`charts.js`) | KPI «Disciplina» | el mismo número; el texto de ayuda cambia |
| Vista del día (`app.js`) | checklist con ✓/✗ | el veredicto del día en una línea + ejecución + alarmas |
| Coach (`coach.js`) | el checklist del día con ✓/✗ | el veredicto y la ejecución como **hechos**, como ya hace con `tu_operacion` |
| Racha | días operados con checklist 100 % | días seguidos `igual`/`bien` (los avisos y los pendientes ni suman ni cortan) |

**OPCIÓN A:** un cuadrito por día (verde, rojo, ámbar), las cuatro cifras arriba, y debajo ejecución, alarmas y
lectura en tarjetas. **OPCIÓN B:** las mismas cuatro cifras y una fila por día con el plan al lado de Kris, el
veredicto y la ejecución. En las dos, clic en un día → la vista del día.

## 6 · Datos

- **Sin migración.** Todo sale de `motor_fichas` (ya con RLS `candado`), `trades` y `sesion_checklist`.
- `DB.getMotorRango` añade `tu:ficha->tu_operacion` al `select` (unos cientos de bytes por día; sigue sin `velas`).
- `discContexto({ …, motor })`: `motor` = Map fecha → `{ estado, operacion, tu }` (`DB.getMotorDisciplina()`).
  **Sin `motor`** (quien llama no lo cargó) todo sigue con la medida de las reglas, igual que sin etapas cargadas: así
  cada pantalla pasa a la medida nueva cuando se le pasa el motor, y un fallo de lectura no cambia ninguna cifra.
  **Con `motor` pero sin ficha** de un día, ese día sale `pendiente`.
- **Modo local** (`js/dev.local.js`): la copia necesita fichas de octubre con `tu_operacion` para que el preview
  enseñe la pantalla. Se amplía la foto.

## 7 · Plan por fases

Cada fase se verifica por separado (CLAUDE.md, «Verificación») y va en su commit.

| Fase | Qué | Verificación |
|---|---|---|
| **1 · El cálculo** | `db.js`: `PLAN_MOTOR_DESDE`, `veredictoDia`, `ejecucionDia`, `lecturaDia`, alarmas con el riesgo de `medir`, `calcDisciplinaStats` con la medida por período; `getMotorRango` con `tu` | `node --check`; un `SELECT` sobre octubre que dé 10/16, 6/9, 1 alarma, 1 aviso, lectura 7/15 |
| **2 · Las pantallas que solo enseñan el número** | `metrics.js`, `charts.js`, la vista del día en `app.js` | preview: el calendario de octubre dice 63 %, septiembre sigue igual; consola limpia |
| **3 · Disciplina** | `disciplina.js` con la opción elegida; `styles.css` con tokens | preview de octubre y de septiembre, escritorio y móvil |
| **4 · El Coach** | el veredicto y la ejecución en el bloque B (nunca en el A: rompería la caché) | un día de octubre en el Coach; `coach_uso` con caché leída |
| **5 · Documentación** | `docs/Disciplina.md` (sección nueva con octubre), `.claude/rules/disciplina.md`, D-046 en `decisiones.md`, este diseño a APROBADO | — |

## 8 · Fuera de este diseño (anotado aparte)

- ~~El 20/10 el trade tiene **MAE 0** con −$168~~ — **resuelto el 23/10**: el indicador medía al cerrar cada vela y los
  trades de un minuto quedaban en 0. Arreglado en `SupabaseAutoExport.cs` y corregidos los 9 guardados (`2026-10-23-mae-*`).
- ~~El Diario (`index.html`) aún pide las **velas de la corrida**~~ — **resuelto el 27/10**: ni el Diario ni Telegram
  piden ya la corrida (número ni velas); nadie la leía. Las columnas y lo registrado se quedan en `sesiones`.
- ~~Telegram también pregunta contexto y zonas en contra, del sistema viejo~~ — **resuelto el 27/10**: fuera de
  Telegram y del Diario, y el Coach no recibe el contexto en los días del plan.

## Registro

- **v3 (23/10/2026):** implementado en 5 fases (`fbfc179`, `92e047e`, `d4d8630`, `221f55d` y la documentación). Desvíos del
  boceto, anotados: la tira lleva una quinta cifra, la **racha** (§5 ya la cambiaba); «sin fallos» en alarmas solo nombra
  las que se comprobaron algún día (sin día FOMC no se dice que se cumplió); la vista del día pone el veredicto en un bloque
  «Disciplina · el plan y tú» al principio. La copia local (`dev.local.js`) lleva la foto de octubre.

- **v2 (23/10/2026):** Kris elige la **OPCIÓN A** («soy más visual: estilo dashboard antes que líneas de texto») y no
  objeta los ±5 puntos. Corregido en §6: sin `motor` en el contexto se usa la medida de las reglas (no «—»), para que
  cada fase se pueda publicar sola. Fase 1 verificada con `db.js` sobre los datos reales: octubre 10/16 = 63 %,
  ejecución 6/9, alarmas 1 (14/10), aviso 1 (23/10), lectura 7/15; septiembre sigue en 96 %.

- **v1 (23/10/2026):** primera versión, con las dos decisiones de Kris (avisos y desde el 01/10).
