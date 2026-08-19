# Diseño — Chaumer vs yo: comparador de operativas

| | |
|---|---|
| **Versión** | v2 |
| **Fecha** | 2026-08-19 |
| **Estado** | 🟢 **APROBADO** (19 ago) — **Fases 1, 2 y 3 implementadas y verificadas**. Fase 4 pendiente |
| **Origen** | Petición de Kris (19 ago): «entré a su curso y tengo acceso a sus operativas; quiero un módulo donde almacene las suyas vs las mías, la pantalla partida en dos, y un dashboard de diferencias con filtro por mes/trimestre/año/todo, para ver si estoy fallando en algún punto» |
| **Alcance** | Tabla nueva `chaumer_operativas` (1 migración), `index.html`, `css/styles.css`, `js/app.js`, `js/chaumer.js` (nuevo), `js/db.js`, `js/coach.js` (mueve un helper). **No toca** `sesiones` ni `trades` salvo un valor nuevo de vocabulario |

> **Cómo se usa este documento.** Es la fuente de verdad de la implementación. Si algo se
> implementa distinto a lo que dice aquí, o se corrige aquí primero, o está mal
> implementado. Cada iteración es este documento **completo** actualizado (v2, v3…).

---

## 0. Decisiones cerradas con Kris (19 ago)

| # | Decisión | Consecuencia |
|---|---|---|
| 1 | **Una operativa suya por día como máximo** | `chaumer_operativas.fecha` es `UNIQUE`. Una fila = un día |
| 2 | **Se registran todos los días, incluidos los que él no operó** | Columna `opero boolean`. Permite medir «entré donde él no veía nada», que si no sería invisible |
| 3 | **Se empieza desde hoy, sin histórico** | No hay carga en lote. Solo el formulario de alta |
| 4 | **La sección se llama «Chaumer»**, no «Sociologist» | Coherente con `docs/metodologia-chaumer.md`, `catalogo_setups` y las reglas. Un solo nombre para la misma persona |

---

## 1. Diagnóstico

### 1.1 Lo que ya existe y NO se duplica

**Tu lado del comparador ya está montado.** `sesiones` (setup, imagen, análisis, emoción,
confianza) + `trades` (hora de entrada, resultado, MAE/MFE). El módulo **lee de ahí**. Si
copiásemos tu operativa a una tabla nueva tendríamos el mismo problema que el `CLAUDE.md`
ya documenta con la disciplina duplicada en 4 sitios: dos copias que se desincronizan.

**El «por qué no entré» también existe ya.** `sesiones.setup_valido_no_tomado`,
`setup_observado` y `motivo_no_entrada`, con vocabulario cerrado —
Duda · Miedo · Zona naranja · Desconfianza · Otro ([index.html:424](../../index.html)). Se
rellena hoy desde el Diario. El módulo **escribe en esos campos**, no crea unos paralelos.

**El selector Mes/Trimestre/Año/Todo con flechas** está resuelto en
[disciplina.js:93](../../js/disciplina.js). Se reutiliza tal cual.

**Las pestañas** reutilizan `.so-tabs` / `.so-panel`, como ya hace Datos.

### 1.2 Lo genuinamente nuevo

Una tabla, una vista partida, un dashboard. Poco más.

### 1.3 Dos trampas detectadas antes de diseñar

**① Las horas no son comparables tal cual.** `trades.entry_time` viene de NinjaTrader en
**hora de Colombia** (invariante documentado; ya causó 2 bugs). Las operativas de Chaumer
las verás en **ET**. Restar una de otra da un error de 60 minutos en verano — justo la
magnitud que haría parecer que entras tardísimo cuando entras a la vez.

**Las dos horas se guardan y se muestran en ET.** Ya existe el conversor correcto,
`horaEt()` en [coach.js:26](../../js/coach.js), que trata el dato como `America/Bogota` y
lo pasa a `America/New_York` (el DST lo resuelve solo). **Se mueve a `db.js`** para que
Coach y Chaumer usen una única implementación.

**② Comparar resultados en dólares no significa nada.** No operáis el mismo tamaño ni la
misma cuenta. «Él hizo $600 y tú $77» no dice si lo hiciste bien. El invariante del
proyecto ya lo resuelve para el riesgo: **se compara en PUNTOS**. El dinero se queda como
dato secundario de tu lado, nunca como eje de comparación.

### 1.4 El riesgo real del módulo

**Solo funciona si los datos entran casi todos los días.** Un dashboard con el 30 % de los
días cargados no dice dónde fallas: dice dónde te acordaste de apuntar. Por eso el alta se
diseña para costar **menos de un minuto**, y el dashboard muestra siempre su propia
cobertura (§4.1) para que nunca se lea un porcentaje sin saber sobre cuántos días va.

---

## 2. Modelo de datos

### 2.1 Tabla nueva — `chaumer_operativas`

```sql
create table public.chaumer_operativas (
  id              bigint generated always as identity primary key,
  fecha           date        not null unique,
  opero           boolean     not null default true,
  setup_codigo    text        references catalogo_setup_variantes(codigo),
  hora_entrada    time,                 -- EN ET. Ver §1.3
  resultado       text        check (resultado in ('target','stop','be','parcial')),
  puntos          numeric(8,2),         -- +/- en PUNTOS, nunca dólares
  contexto        text        check (contexto in ('Alcista','Bajista','Mixto')),
  imagen_url      text,                 -- Cloudinary, mismo preset que el resto
  notas           text,                 -- "la operativa": lo que explicó
  motivo_no_opero text,                 -- solo cuando opero = false
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);
```

- `fecha UNIQUE` → decisión 1. Un día, una fila.
- `opero = false` → decisión 2. `setup_codigo`, `hora_entrada`, `resultado` y `puntos`
  quedan `NULL`; se rellena `motivo_no_opero`.
- `setup_codigo` apunta al **mismo catálogo que tus setups**. Es lo que permite comparar
  «mismo setup» sin cotejar cadenas de texto.
- **RLS activo** + política `auth_all` para `authenticated` + grants a `service_role`,
  como las otras 18 tablas. Migración `2026-08-19-chaumer-operativas.sql`, aplicada con
  `apply_migration` del MCP.
- **Dos `CHECK` de coherencia**, añadidos al implementar: un día con `opero = false` no
  puede traer setup, hora, resultado ni puntos, y uno con `opero = true` no puede traer
  motivo. Sin ellos, un día editado dos veces podría contar como «operó» en el cálculo del
  veredicto arrastrando datos viejos.

**Nada de tu operativa se guarda aquí.** Ni una columna.

### 2.2 Un valor nuevo de vocabulario

`motivo_no_entrada` tiene hoy: Duda · Miedo · Zona naranja · Desconfianza · Otro. Falta el
caso más importante para este módulo: **«No lo vi»** — él operó algo que tú ni detectaste.
Es una categoría distinta de la duda y del miedo, y probablemente la más accionable.

Se añade como sexto botón en el Diario y en el comparador. Es un `<button>` más en
`#motivoNoEntradaGroup`; la columna es texto libre, así que **no hace falta migración**.

---

## 3. La comparación — se calcula, no se guarda

Un día puede estar en uno de seis estados. Se derivan de `chaumer_operativas` + `sesiones` +
`trades`, así que **nunca se desincronizan** y no hay que mantenerlos a mano.

| Estado | Condición | Color |
|---|---|---|
| ✅ **Igual** | Ambos operaron · mismo `setup_codigo` · mismo resultado · Δhora ≤ 5 min | `--accent-txt` |
| **Ejecución** | Mismo setup, pero distinto resultado o Δhora > 5 min | `--violet-txt` |
| **Otra lectura** | Ambos operaron, **distinto** setup | `--text2` (neutro) |
| **Fuga** | Él operó, tú no | `--red-txt` |
| **De más** | Tú operaste, él no | `--red-txt` sobre fondo tenue, icono distinto |
| **Ambos fuera** | Ninguno operó | `--text3` |

Cuatro tonos para seis estados, no seis. La paleta tiene 5 colores semánticos y forzar uno
por estado obliga a inventar tonos que no existen. Los dos pares se distinguen por **icono
y etiqueta**, no por matiz:

- **Otra lectura va en gris a propósito.** El §7 de este mismo diseño dice que no es un
  error por definición y que no cuenta como fallo; pintarla de color la haría parecer una
  alarma.
- **«De más» comparte el rojo con «Fuga».** Son hermanas: las dos son desviaciones que
  cuestan dinero, una por defecto y otra por exceso. Se diferencian por icono.

**Fuga** es el estado caro y el que justifica el módulo. En esos días el comparador pide el
motivo y lo escribe **en `sesiones`** (`setup_valido_no_tomado = true`,
`setup_observado = <su setup>`, `motivo_no_entrada = <motivo>`), no en una tabla nueva. Así
el Coach IA y el dashboard de Disciplina, que ya leen esos campos, se enteran solos.

---

## 4. Pantallas

Sección `chaumer` (`section-chaumer`), a la que se llega desde una **tarjeta nueva en Otros**,
grupo «Consultar» — que pasa de 3 a 4 tarjetas. `Otros.ITEMS` gana una entrada y `Nav.PADRE`
otra: **la barra sigue con 6 botones**, el invariante se respeta.

### 4.0 Identidad de color (decidido con Kris, 19 ago)

**Chaumer va en azul `--blue-txt`; tú, en verde `--accent-txt`.** El azul se lee como
«referencia», que es lo que él es aquí. El dorado `--warning-txt` **queda fuera del módulo**:
a Kris no le convence como color de texto.

⚠️ **No se toca el token `--warning-txt` en el `:root`.** Lo usan Disciplina, los chips y
las estrellas de confianza, y cambiarlo repintaría pantallas que están bien. Lo que cambia
es qué token usa este módulo.

**Efecto colateral en Otros:** la tarjeta de Experimentos ya es azul desde el rediseño del
19 ago, y dos tarjetas azules seguidas en el grupo «Consultar» se leen como un error.
**Experimentos pasa a `warning`** y Chaumer se queda el azul. Es un valor en `Otros.ITEMS`,
y deja los cuatro colores del grupo distintos entre sí:

| Grupo | Tarjetas y color |
|---|---|
| Consultar | Trades `accent` · Imágenes `violet` · Experimentos `warning` · **Chaumer `blue`** |
| Configurar | Estrategia `warning` · Datos neutro · Fechas `red` |

`warning` sale una vez por grupo, separados por su rótulo; dentro de un grupo no se repite
ningún color. Hay que actualizar la nota de `.claude/rules/estilos.md` sobre a qué tarjeta
pertenece cada color.

Dos pestañas, reutilizando `.so-tabs`:

### 4.1 Pestaña «Día» — la vista partida

Cabecera con la fecha, flechas ‹ › para moverse, y el **veredicto del día** como chip.
Debajo, dos columnas simétricas: **Chaumer** | **Yo**. Misma altura de imagen, mismos
rótulos y mismo orden en las dos, para que la diferencia salte sin leer.

Cada lado muestra: imagen, setup, resultado + puntos, hora de entrada (ET), contexto y las
notas. El lado tuyo añade confianza y P&L en dinero (solo informativo).

Debajo, una **franja de diferencias** que enumera en texto qué difiere: setup, hora,
resultado, puntos. Y en los días de **Fuga**, el bloque para declarar el motivo.

Si el día no tiene operativa suya cargada, esa mitad es un **estado vacío con un botón para
registrarla** — el alta vive ahí mismo, no en otra pantalla.

### 4.2 Pestaña «Diferencias» — el dashboard

Filtro Mes / Trimestre / Año / Todo en la barra superior (`Nav.HERRAMIENTAS`), igual que
Disciplina.

**Primero, la cobertura**, siempre visible: «34 de 41 días hábiles cargados (83 %)». Sin
esto, cualquier porcentaje de abajo es un número sin denominador.

**Cuatro KPIs:**

| KPI | Qué responde |
|---|---|
| **Coincidencia** | De los días en que él operó, ¿en cuántos hiciste lo mismo? |
| **Fugas** | Días que él operó y tú no · **y los puntos que dejaste pasar** |
| **De más** | Días que entraste y él no · y qué te dieron |
| **Δ puntos** | Sus puntos vs los tuyos en el período |

**Cuatro gráficas:**

1. **Barras apiladas por semana** — Igual · Ejecución · Otra lectura · Fuga · De más.
   Muestra si mejoras con el tiempo, que es la pregunta de fondo.
2. **Motivos de no entrada** — ranking desde `sesiones.motivo_no_entrada`. Responde
   «¿fallo por miedo, por no verlo, o por desconfianza?».
3. **Por setup** — en qué setups coincides y en cuáles te pierdes. Si el 80 % de tus fugas
   son Reingresos, el problema tiene nombre.
4. **Δ hora de entrada** — media de minutos que entras después (o antes) que él. Un sesgo
   sistemático de +4 min es un hallazgo accionable.

---

## 5. Plan de implementación — 4 fases

| Fase | Qué | Archivos | Cómo se verifica |
|---|---|---|---|
| **1** ✅ | **BD y capa de datos**: migración con RLS, `DB.getChaumer*` / `upsertChaumer`, y `horaEt` movido de `coach.js` a `db.js` | migración, `js/db.js`, `js/coach.js` | ✅ **Hecho** — medido, ver §5.1 |
| **2** ✅ | **Sección + pestaña «Día»**: navegación, vista partida, alta/edición de su operativa, bloque de motivo en las Fugas | `index.html`, `js/chaumer.js`, `js/app.js`, `js/db.js`, `js/form.js`, `css/styles.css` | ✅ **Hecho** — medido, ver §5.2 |
| **3** ✅ | **Pestaña «Diferencias»**: cobertura, 4 KPIs y 4 gráficas | `js/chaumer.js`, `js/db.js`, `js/disciplina.js`, `index.html`, `js/app.js`, `css/styles.css` | ✅ **Hecho** — medido, ver §5.3 |
| **4** | **«No lo vi»** en el vocabulario + documentación | `index.html`, `js/form.js`, `CLAUDE.md`, `docs/` | El botón guarda y recarga bien; docs actualizadas |

Las fases 1 y 2 ya dan valor por sí solas: con ellas puedes cargar días y ver la comparación,
aunque el dashboard llegue después.

### 5.1 Fase 1 — lo medido (19 ago)

Migración `2026-08-19-chaumer-operativas` aplicada con `apply_migration`; consta en
`supabase_migrations.schema_migrations` como `20260819151243`.

| Qué | Resultado |
|---|---|
| Tabla y tipos | ✅ 13 columnas; `fecha date not null unique`, `puntos numeric`, `hora_entrada time` |
| RLS | ✅ Activo. Política `auth_all` para `authenticated`, `ALL` |
| Grants | ✅ `authenticated` y `service_role` con SELECT/INSERT/UPDATE/DELETE. **`anon` sin acceso a datos** — solo REFERENCES/TRIGGER/TRUNCATE, igual que `catalogo_setups` y `catalogo_fechas` |
| FK | ✅ `setup_codigo → catalogo_setup_variantes(codigo)` |
| CHECK `chaumer_no_opero_vacio` | ✅ **Probado**: insertar `opero=false` con setup y puntos es rechazado con `23514` |
| Alta, lectura, rango, borrado | ✅ Viaje completo contra la BD real desde el navegador |
| Filtro anti-PGRST204 | ✅ Una clave que no es columna se descarta en vez de reventar el guardado |
| Paso a «no operó» | ✅ Limpia setup, hora, resultado y puntos; conserva el motivo |

**La conversión horaria, que era la trampa nº 1:**

| Entrada | Salida | Correcto |
|---|---|---|
| `horaEt('08:36', '2026-08-18')` — verano, EDT | **09:36 ET** | +1 h ✅ |
| `horaEt('08:36', '2026-01-15')` — invierno, EST | **08:36 ET** | +0 h ✅ |

El DST lo resuelve solo, sin tabla de fechas. `difMinutos('10:55','10:58')` → `3`.

`horaEt` queda **solo en `db.js`** (`db.js:158`); `coach.js` la consume como global y
`db.js` se carga antes ([index.html:1464](../../index.html) vs 1477).

**Añadido no previsto:** los cuatro métodos y las operativas de ejemplo se replicaron en
`js/dev.local.js`, para que la Fase 2 se pueda verificar también sin sesión.

**Se dejó la tabla vacía** (0 filas): las pruebas usaron `2999-01-01` y se borraron.

### 5.2 Fase 2 — lo medido (19 ago)

Probado **con datos reales**, con la sesión de Kris iniciada en el preview.

**Los siete estados, uno a uno:**

| Estado | Cómo se provocó | Salió |
|---|---|---|
| Sin cargar | Día sin fila suya | ✅ Estado vacío con botón de registrar |
| Igual | 18 ago: mismo setup, ambos Target, Δ3 min | ✅ «Igual» |
| Ejecución | Mismo día, él a Stop | ✅ «Mismo setup · ejecución» |
| Otra lectura | 13 ago: él Reingreso Bajista, yo IRI Apertura Alcista | ✅ «Otra lectura» |
| Fuga | 17 ago: él operó, yo no | ✅ «Fuga · él operó, tú no» |
| De más | 14 ago: yo operé, él no | ✅ «De más · tú operaste, él no» |
| Ambos fuera | 19 ago: ninguno operó | ✅ «Ninguno operó» |

**Los dos cálculos que podían mentir, contra un trade real (nº 107, 18 ago):**

| Qué | Resultado |
|---|---|
| Puntos de mi lado | **+20 pts** — Short 29.546,5 → 29.526,5. Cuadra con el `profit` neto: 20 × 2 contratos × $2 − $2,04 = **$77,96** |
| Hora en ET | `entry_time` 09:58:41 Colombia → **10:58 ET**. Contra sus 10:55 ET, **+3 min** |

Si las horas se hubieran restado sin convertir, ese día habría salido «−57 min».

**El flujo de Fuga escribe donde debe.** Pulsar «No lo vi» dejó en `sesiones` del 17 ago:
`setup_valido_no_tomado = true`, `setup_observado = 'Reingreso Alcista'`,
`motivo_no_entrada = 'No lo vi'`. Comprobado con `SELECT`, y **revertido después** a sus
valores originales (`false` / `null` / `null`).

**Navegación:** la tarjeta sale en «Consultar» con `--c: #8FBDE8`, Experimentos pasó a
`#E0A33B`, los 4 colores del grupo son distintos, el botón de Otros sigue encendido y el
título dice «Chaumer · miércoles, 19 de agosto».

**Móvil (375 px):** sin desbordes, sin scroll horizontal de página, las dos columnas se
apilan a 359 px cada una, cero errores de JS.

**La tabla quedó vacía** (0 filas). Todas las operativas de prueba se borraron.

#### Desviaciones respecto al diseño

| # | Qué | Por qué |
|---|---|---|
| 1 | **Séptimo estado: «Sin cargar»** | El diseño listaba 6, pero la ausencia de fila no es «ninguno operó»: es que aún no lo has metido. Confundirlos haría que un día sin cargar contase como día sin operativa y sesgara el dashboard de la Fase 3 |
| 2 | **«No lo vi» se adelanta de la Fase 4** | El comparador ya lo ofrece; dejar el Diario con otro vocabulario habría partido en dos el mismo campo |
| 3 | `subirACloudinary` se sube a `db.js` y `form.js` pasa a usarla | Igual que con `horaEt`: una sola implementación. `form.js` conserva su envoltorio de DOM y avisos |
| 4 | `marcarSetupNoTomado` **no pasa por el Worker** `/api/session` | `upsertSesion` manda el payload completo y escribe cada clave como columna; para tocar tres campos, un upsert dirigido de PostgREST solo altera esos tres y no puede vaciar el resto de la fila |
| 5 | La tarjeta muestra **«N días cargados»**, no «% coincidencia» | El porcentaje necesita el cálculo del dashboard, que es la Fase 3. Se sube a coincidencia entonces |

#### Una cosa a decidir cuando lo uses

Un día con **mismo setup, mismo resultado y entrada a la vez, pero la mitad de sus puntos**
sale hoy como **«Igual»** — con un chip que avisa de los puntos. Es lo que dice el diseño
(§3), pero puede que quieras que eso cuente como «Ejecución». Se ve en cuanto tengas
días reales cargados; es una condición en `veredicto()`.

### 5.3 Fase 3 — lo medido (19 ago)

Se cargaron **6 días de agosto** cubriendo los seis estados y se comprobó **cada número
contra un cálculo a mano** sobre los trades reales. No uno de muestra: todos.

| KPI | En pantalla | A mano | |
|---|---|---|---|
| Coincidencia | 25 % (1 de 4) | Días suyos con setup: 12, 13, 17, 18 → 4. «Igual» solo el 18 | ✅ |
| Fugas | 1 · **+28,5 pts** | El 17: él operó, yo no. Sus puntos, 28,5 | ✅ |
| De más | 1 · **−30,5 pts** | El 14: yo operé, él no. Short 30.142 → 30.172,5 = −30,5 | ✅ |
| Δ puntos | **−211,5** (él +134,5 · tú −77) | Él 40+28,5+31+35 = 134,5. Yo 20−30,5−24,25−42,25 = −77 | ✅ |
| Δ hora | **−12,7 min** | (+3 −25 −16)/3 = −12,67. Las tres con `entry_time` convertido a ET | ✅ |
| Cobertura | 6 de **13** días hábiles (46 %) | Agosto hasta hoy: 3,4,5,6,7,10,11,12,13,14,17,18,19 = 13 | ✅ |

**La cobertura se acota a lo ya vivido.** En «Mes» el denominador llega al 19, no al 31: si
contara el mes entero, hoy marcaría 19 % y parecería un abandono en vez de un mes a medias.

| Período | Contexto | Cobertura |
|---|---|---|
| Mes | Agosto 2026 | 6 / 13 (46 %) |
| Trimestre | Trimestre · Julio–Septiembre 2026 | 6 / 35 (17 %) |
| Año | Año 2026 | — |
| Todo | Todo el histórico | 6 / 138 (4 %) · **flechas ocultas** |

**Aviso de cobertura floja:** por debajo del 60 % la banda pasa a rojo y añade «con esta
cobertura los porcentajes de abajo dicen poco». Se comprobó activo al 46 %.

**Las herramientas de la barra son por pestaña, no por sección.** En «Día» el período y las
flechas se esconden (manda el selector de fecha del panel); en «Diferencias» reaparecen.
Comprobado en los dos sentidos.

**Un mes sin datos** (julio) da un estado vacío que dice qué hacer, no un dashboard de ceros.

**Móvil (375 px):** sin desbordes, sin scroll horizontal, KPIs en 2×2 y las 4 tarjetas
apiladas. Cero errores de JS.

**La tabla quedó vacía.** Los 6 días de prueba se borraron.

#### Reutilización, no copia

`rangoPeriodo(period, y, m)` **sube a `db.js`** y **Disciplina pasa a usarla**: la cuenta de
trimestres estaba a punto de existir por duplicado. Verificado que Disciplina sigue
etiquetando igual — «Agosto 2026» y «Trimestre · Julio–Septiembre 2026» — y sigue pintando.

#### Desviaciones respecto al diseño

| # | Qué | Por qué |
|---|---|---|
| 1 | Las gráficas son **CSS, no Chart.js** | Son 5 series en pocas columnas y dos rankings horizontales. Chart.js añadía un `<canvas>` opaco para lectores de pantalla y peso, sin ganar nada |
| 2 | «Por qué no entraste» incluye una fila **«Sin declarar»** | Las fugas sin motivo son la mayoría al principio. Ocultarlas haría creer que el ranking está completo |
| 3 | El caché del dashboard **se invalida** al guardar, borrar o declarar un motivo | Si no, editar un día en «Día» dejaba el dashboard mostrando lo anterior sin avisar |

---

## 6. Lo que este diseño NO toca

- El criterio de disciplina, el P&L neto, el riesgo en puntos, las fechas locales.
- `trades` y `sesiones`: **ni una columna nueva**. Solo se escribe en campos que ya existen.
- El menú de 6 botones. La sección entra por Otros, como Datos o Fechas.
- El Coach IA, más allá de mover `horaEt` a `db.js` sin cambiar su comportamiento.
- Los datos de Chaumer no alimentan tu disciplina ni tus métricas: son una referencia, no
  una fuente de verdad sobre tu operativa.

---

## 7. Riesgos

| Riesgo | Mitigación |
|---|---|
| **Días sin cargar sesgan el dashboard** | La cobertura va arriba del todo y siempre visible. Un período con menos del 60 % cargado se marca en ámbar |
| **Comparar horas de zonas distintas** | Las dos en ET vía `horaEt()`, con la hora Colombia entre paréntesis como referencia (§1.3) |
| **Comparar dinero en vez de puntos** | El eje es puntos. El dinero solo aparece en tu lado y como dato secundario |
| **Que el alta dé pereza y el módulo muera** | Formulario corto, en la misma pantalla, con el setup desde catálogo y la imagen por el flujo de Cloudinary que ya existe |
| **Sobreajuste: copiarle sin entender** | El módulo mide diferencias, no dicta. «Otra lectura» no es un error por definición y no se cuenta como fallo |

---

## 8. Registro de versiones

| Versión | Fecha | Qué cambió |
|---|---|---|
| v1 | 2026-08-19 | Documento inicial. Recoge las 4 decisiones de Kris |
| v2 | 2026-08-19 | **Chaumer pasa de dorado a azul** y tú al verde: a Kris no le convencía el dorado como texto. Se corrigen dos choques que salieron de ahí — «Ejecución» y «Otra lectura» compartían violeta, y el azul ya lo usaba la tarjeta de Experimentos en Otros. Detalle en §3 y §4.0 |
