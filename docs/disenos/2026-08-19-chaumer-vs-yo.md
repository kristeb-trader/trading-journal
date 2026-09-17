# Diseño — Chaumer vs yo: comparador de operativas

| | |
|---|---|
| **Versión** | v8 |
| **Fecha** | 2026-08-19 |
| **Estado** | ✅ **IMPLEMENTADO** (19 ago) · v7 y v8 implementadas el 17 sep (§5.8, §5.9) |
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

> ⚠️ **Sustituido el 17 sep (v7, §5.8):** las dos horas van ahora en **hora Colombia** y
> se comparan sin convertir. Lo que sigue es el razonamiento original.

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
| **4** ✅ | **«No lo vi»** en el vocabulario + documentación | `index.html`, `CLAUDE.md`, `.claude/rules/`, `docs/` | ✅ **Hecho** — ver §5.4 |

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

### 5.4 Fase 4 — lo hecho (19 ago)

**El vocabulario ya estaba** — «No lo vi» se adelantó en la Fase 2. Lo que quedaba era
comprobarlo en el Diario y cerrar la documentación.

| Qué | Resultado |
|---|---|
| «No lo vi» en el Diario | ✅ Los 6 botones presentes; al pulsarlo escribe `No lo vi` en el hidden y se marca activo; al elegir otro, queda **uno solo** activo. `setupBtnGroupHidden` es genérico, así que no hizo falta tocar `form.js` |

**Dónde fue cada cosa** (criterio del skill `documentacion`):

| Qué | Dónde | Por qué ahí |
|---|---|---|
| Qué no dice el esquema de `chaumer_operativas` (solo su lado · hora en ET · puntos) | `CLAUDE.md` § Datos, una fila | Se consulta a menudo y sigue siendo verdad mañana |
| El porqué de puntos-no-dinero y de no duplicar | `docs/decisiones.md` **D-011** y **D-012** | Se busca por la decisión, no buceando en el historial |
| Qué pasó el 19 de agosto | `docs/historial-proyecto.md` § Checkpoint 2026-08-19 | Ya pasó |
| El reparto de colores de las tarjetas de Otros | `.claude/rules/estilos.md` | Cambia con el CSS: carga solo al abrir `css/**` |
| El modo local | `.claude/rules/modo-local.md` (nuevo) | Estaba inflando el `CLAUDE.md`; ahora una línea allí y el detalle bajo demanda |

**`CLAUDE.md` volvió a caber:** estaba en **210 líneas**, por encima del límite de 200 que
se carga entera en cada sesión. Comprimiendo el bloque del modo local a un puntero quedó en
**191**, con el módulo nuevo ya documentado dentro.

**Una contradicción resuelta.** `docs/disenos/2026-08-19-otros-y-datos.md` seguía diciendo
que la tarjeta de Experimentos es azul. No se reescribió —es un diseño ya implementado—
sino que se le añadió el aviso de que quedó superado el mismo día, con el puntero al
reparto vigente.

#### Lo que se encontró al cerrar

**Kris ya está usando el módulo.** La tabla tenía 2 filas suyas (18 y 19 de agosto, con
imagen), cargadas mientras se documentaba. No se tocaron.

Y con ellas apareció algo que solo se ve con uso real: el día 18 quedó un **stop con
`+20,50` puntos**. La columna va con signo, así que un stop debería ser negativo; tal como
está, infla los puntos de Chaumer en el KPI de Δ. **El formulario no lo impide** — queda
anotado en `tasks/current.md` para decidir si el signo se pone automático según el
resultado o solo se avisa.

---

### 5.5 Ajustes tras el primer uso (19 ago)

Dos peticiones de Kris nada más empezar a cargar días:

| Qué pidió | Qué se hizo |
|---|---|
| «Los días sin setup también deben mostrar la imagen» | El gráfico es el **del día**, no el de la operación: existe igual cuando no hubo setup, y son justo los días en que verlo explica por qué no lo hubo. Ahora se pinta en los dos lados aunque no se operara |
| «La fecha al lado derecho de las pestañas, para dar más espacio» | La fecha sube a la misma fila que las pestañas. El contenido arranca a **65 px** del inicio de la sección en vez de ~125 px |

**Medido** con la sesión real, en el 19 de agosto (día en que ni Chaumer ni Kris operaron):
las dos imágenes se pintan (`<img>` de 150 px por lado), la fecha queda a la derecha y en la
misma fila, se oculta al pasar a *Diferencias* —donde manda el selector de período— y vuelve
al volver a *Día*. En móvil (375 px) baja a su propia línea a ancho completo, sin desbordes
ni scroll horizontal, y sin errores de consola.

**De propina:** el lado de Kris muestra ahora el motivo del día junto a «No operé»
(«No operé · FOMC»), que sale de `sesiones.motivo_no_opero`. En un día sin operación era lo
único que faltaba para que el gráfico se entendiera solo.

### 5.6 El signo de los puntos se deriva del resultado (19 ago)

El primer día de uso real dejó un **stop cargado como `+20,50`**. `puntos` va con signo, así
que eso sumaba a favor de Chaumer: el KPI decía **él +20,5 · tú +20 → Δ −0,5**, cuando ese
día Kris le había sacado 40 puntos. Un número creíble y falso, que es lo peor que puede dar
un dashboard.

**El signo lo pone ahora el resultado**, en `signoPuntos()`:

| Resultado | Qué hace |
|---|---|
| `stop` | Fuerza negativo |
| `target` | Fuerza positivo |
| `be` · `parcial` | **Respeta lo escrito** — un parcial puede cerrar arriba o abajo y un break-even puede dejar residuo de cualquier signo |

Se aplica en dos sitios a propósito: al **cambiar el resultado o salir del campo**, para que
el signo se vea antes de guardar; y otra vez **al guardar**, porque un pegado directo seguido
de «Guardar» no dispara ningún evento de campo.

⚠️ **El signo sale de SU resultado (`#chOpResultado`), no del de Kris.** Todo ese formulario
es la operativa de Chaumer; el lado de Kris no se escribe ahí, se calcula desde `trades` con
`puntosTrade()`. Para que no quede duda al rellenarlo, los rótulos del modal pasan a decir
**«Su setup»**, «Su hora de entrada», «Su resultado», «Sus puntos», «Su contexto».

**Medido:** `stop` con 20,5 y con −20,5 dan −20,5; `target` con 40 y con −40 dan 40; `be` −2
y `parcial` −7,5 se respetan. Guardar con el signo mal escrito y sin disparar eventos lo
corrige igual, **sin tocar ningún otro campo de la fila**. Y el KPI pasa a leer
**él −20,5 · tú +20 → Δ +40,5**.

**Dato corregido:** la fila del 18 de agosto pasó de `+20,50` a `−20,50`
(`update … where resultado = 'stop' and puntos > 0`, 1 fila). Era la única incoherente.

---

### 5.7 «Diferencias», rehecho para que se entienda (31 ago)

Kris: *«no me dice mucho, no entiendo nada de lo que muestra esa ventana; quiero ver dónde
están las diferencias entre él y yo»*. Con 9 días cargados, así que **no era falta de
datos**: era el panel.

**Los tres motivos, y qué se hizo con cada uno:**

| Problema | Arreglo |
|---|---|
| Daba métricas sueltas y dejaba la conclusión al lector | **La brecha en puntos, arriba y grande**, y debajo una **frase generada desde los datos** que dice qué significa |
| Cuatro KPIs sin jerarquía no respondían «¿dónde pierdo más?» | Se retiran. En su lugar, **«De dónde sale la brecha»**: barras divergentes por causa, en puntos, **ordenadas por lo que cuestan** |
| «Cómo evoluciona, por semana» no puede decir nada con 2 semanas | **Se oculta hasta que haya 6 semanas.** Vuelve sola |
| El vocabulario era mío, no suyo | «Fuga», «De más» y «Otra lectura» **desaparecen de la pantalla**: ahora dice «Él entró, tú no», «Tú entraste, él no», «Cada uno vio un setup». Los nombres internos siguen en el código |

**Dos añadidos que salieron del propio análisis:**

- **«Los días que más pesaron»** — los 5 días que explican la brecha, **pulsables** para
  abrirlos en la pestaña Día. El agregado no convence; el día con su fecha, sí.
- **«Por qué no entraste» pasa a ordenarse por puntos perdidos**, no por número de veces.
  Con los datos de Kris el cambio importa: dudó **una sola vez** y le costó 60 puntos, más
  que ninguna otra causa.

#### Verificado contra sus datos reales

Se inyectaron sus 10 filas de agosto (traídas por el MCP) y se comparó con el cálculo hecho
a mano desde SQL. **Coincide en todo:**

| | Esperado | En pantalla |
|---|---|---|
| Brecha | −74,75 | **−74,75** |
| Suyos / míos | +195 / +120,25 | **+195 / +120,25** |
| Él entró, yo no | 3 días, −95 | **3 días, −95** |
| Cada uno vio un setup | 1 día, −37,25 | **1 día, −37,25** |
| Misma operativa | 2 días, +17 | **2 días, +17** |
| Mismo setup, distinta salida | 1 día, +40,5 | **1 día, +40,5** |
| Entrando a su mismo setup | +57,5 en 3 días | **+57,5 en 3 días** |

Y el hallazgo que el panel viejo escondía: **cuando Kris entra al mismo setup que Chaumer,
le gana**. Toda su desventaja sale de los días que no entra.

**Un caso que apareció al verificar:** el 31 de agosto tiene la operativa suya cargada como
*target* pero **sin puntos**. Cuenta como 0 en la brecha —lo único honesto con un dato que
falta—, así que ahora **se avisa arriba**: «1 día suyo sin puntos rellenados… la diferencia
real puede ser mayor». Sin ese aviso, un día que costó puntos pasaría por un día que no
costó nada.

**Móvil (375 px):** sin desbordes ni scroll horizontal, 5 tarjetas apiladas, consola limpia.

### 5.8 v7 — La lista día a día y la hora Colombia (17 sep)

**Petición de Kris:** «aún no me es claro las diferencias». Quiere Diferencias como pestaña
principal, un dashboard arriba y abajo **una lista con fecha, mi resultado y el suyo**
(Target / Stop / Sin operativa); al pulsar una fila, un modal grande con **las dos
gráficas**, que se cierra con Esc. Y todas las horas en **hora Colombia**: «su hora está
adelantada».

**Pestañas.** `Diferencias` (por defecto) · `Registrar` (la antigua «Día», intacta; su
`data-tab` interno sigue siendo `dia`). Registrar se deja cargada en el último día hábil.

**Dashboard.** 5 KPIs — la brecha · Yo (puntos, T/S/sin operar) · Chaumer (ídem) · mismo
setup que él (días / días en que operaron los dos, con su Δ) · hora de entrada (Δ medio) —,
la frase de conclusión y 3 tarjetas: de dónde sale la brecha, por qué no entraste, sus
setups que se te escapan. **Fuera** los «días clave» (la lista los sustituye) y la gráfica
semanal.

**La lista.** Una fila por día con dato en cualquiera de los dos lados, del más reciente al
más antiguo: fecha · mi resultado (+ hora y puntos) · el suyo · Δ puntos y el veredicto en
corto. Borde rojo si ese día me restó, verde si me sumó. Un día en que operé sin su fila
cargada sale como **«Sin cargar»**, no se esconde. En móvil la fila pasa a dos líneas.

**El modal.** Casi pantalla completa; yo a la izquierda, él a la derecha (en móvil, uno
encima de otro); las imágenes sin recortar. Cabecera con fecha, veredicto y Δ; **← →**
cambian de día, **Esc** / X / clic fuera cierran. Si el Lightbox está abierto encima, Esc
cierra solo el Lightbox. «Editar su operativa» y el lápiz llevan a Registrar en ese día (el
lápiz abre además el formulario).

**La vista partida de Registrar también pasa a Yo | Chaumer**, para que las dos pantallas
tengan el mismo orden.

**Hora Colombia.** Diagnóstico: la columna se documentaba en ET, pero Kris la rellenaba a
veces en ET y a veces en hora Colombia. Se unifica en **hora Colombia** (D-017):

| Filas | Qué se hizo |
|---|---|
| 18 ago, 21 ago, 24 ago, 10 sep, 14 sep — en ET sin duda (mismo setup y +1 h exacta, o IRI de apertura a las 9:3x) | −1 h. Migración `2026-09-17-chaumer-hora-colombia`, respaldo en `_bak_20260917_chaumer_horas` |
| 2, 3, 4, 8 y 17 sep — ya en hora Colombia (en ET serían antes de la apertura) | Nada |
| 25 ago, 27 ago, 31 ago, 1 sep, 16 sep — dudosas | Se quedan: Kris decidió tratarlas como hora Colombia |
| 28 ago, 21:52 — imposible en las dos | Se queda; pendiente de que Kris la corrija |

En el código: `horaEt()` ya no se usa en `chaumer.js`; las dos horas se muestran como
`hh:mm` sin sufijo y el formulario dice «(hora Colombia)». **El Δ de hora solo se calcula en
días con el mismo setup**: con setups distintos restaba dos operaciones que no son la misma
y dio «+14 min» en septiembre cuando los tres días comparables eran de 0 min.

**Verificado** con las 12 filas reales de septiembre inyectadas en el preview (modo local),
contra el cálculo a mano:

| Qué | Pantalla | A mano |
|---|---|---|
| La brecha | **−17,5** | (−79,5) − (−62) ✅ |
| Yo / Chaumer | −79,5 · 4 T 6 S 2 sin operar / −62 · 4 T 5 S 3 sin operar | ✅ |
| Mismo setup | 3 / 8 · −5,75 | 10 sep −5,5 · 14 sep −0,25 · 17 sep 0 ✅ |
| Causas | yo entré, él no −53 (2) · él entró, yo no −24 (1) · misma operativa −5,75 (3) · cada uno un setup +65,25 (5) | ✅ suman −17,5 |
| Hora | 0 min en 3 días | 08:39/08:39 · 08:56/08:56 · 08:37/08:37 ✅ |
| Lista | 12 filas, 17 sep arriba | ✅ |

Modal: ← → recorren 14 → 11 → 15 sep; Esc con el Lightbox abierto cierra solo el Lightbox;
«Editar» deja Registrar en el 10 sep con la hora 08:39 en el formulario. Móvil 375 px sin
scroll horizontal, consola sin errores.

### 5.9 v8 — La lista, rehecha como tabla (17 sep)

**Petición de Kris:** la lista «se ve todo muy pequeño»; título «Día a día» más grande, en
mayúscula y centrado; títulos de columna centrados y en mayúscula; fechas en orden
**ascendente**; hora y puntos **en columnas**, no como leyenda; una **fila de totales** con
targets, stops, % de efectividad y puntos de cada uno; y la franja de color con un único
significado: **verde = mismo setup, rojo = setup distinto**.

**La tabla** (`tablaDias()` en `chaumer.js`):

| Fecha | YO: Resultado · Hora · Puntos | CHAUMER: Resultado · Hora · Puntos | Δ Puntos | Qué pasó |
|---|---|---|---|---|

- Cabecera a dos niveles: «YO» (verde) y «CHAUMER» (azul) agrupan sus tres columnas; cada
  grupo lleva un tinte suave en todas sus celdas y un separador a la izquierda.
- Letra a 0,95 rem (antes 0,74–0,82), filas de ~56 px, resultado en píldora de 104 px.
- Puntos coloreados por signo; Δ en una pastilla verde / roja / gris.
- **Franja de la fecha:** verde si los dos operaron el mismo setup, roja si operaron setups
  distintos, **ninguna** si alguno no operó (no hay dos setups que comparar). El setup de
  cada uno sale al pasar el ratón por la fila. Leyenda al pie.
- **Totales** (`totalesLista()`): por lado, `T · S`, **efectividad = T / (T + S)** —
  break-even y parciales no entran— y la suma de puntos; en Δ, la brecha.
- Orden ascendente; las flechas del modal siguen ese orden (← anterior, → siguiente).
  Las filas son enfocables y se abren también con Enter.
- **Móvil / pantallas estrechas:** la tabla (mín. 900 px) se desplaza en horizontal dentro
  de su caja con la columna Fecha fija; la página no se ensancha.
- El título es un `div`, no un `h2`: el único título de pantalla es el de la barra.

**Las horas las revisa Kris a mano** si ve alguna diferencia; el código no toca más filas.

**Verificado** con las 12 filas reales de septiembre:

| Qué | Pantalla | Esperado |
|---|---|---|
| Orden | 1 sep → 17 sep | ✅ |
| Franja verde | 10, 14, 17 sep | mismo setup ✅ |
| Franja roja | 1, 2, 3, 4, 8 sep | setup distinto ✅ |
| Sin franja | 9, 11, 15, 16 sep | alguno no operó ✅ |
| Total yo | 4 T · 6 S · **40 %** · −79,5 | 4/10 ✅ |
| Total Chaumer | 4 T · 5 S · **44 %** · −62 | 4/9 = 44,4 ✅ |
| Total Δ | −17,5 | = brecha ✅ |

Modal: desde el 1 sep «anterior» está desactivado y → lleva al 2; Enter sobre el 17 lo
abre con «siguiente» desactivado. 660 px y 375 px sin desbordar la página; consola limpia.

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
| **Comparar horas de zonas distintas** | Desde v7, las dos en **hora Colombia**, sin convertir: su hora se escribe así y la tuya llega así de NinjaTrader (§5.8) |
| **Comparar dinero en vez de puntos** | El eje es puntos. El dinero solo aparece en tu lado y como dato secundario |
| **Que el alta dé pereza y el módulo muera** | Formulario corto, en la misma pantalla, con el setup desde catálogo y la imagen por el flujo de Cloudinary que ya existe |
| **Sobreajuste: copiarle sin entender** | El módulo mide diferencias, no dicta. «Otra lectura» no es un error por definición y no se cuenta como fallo |

---

## 8. Registro de versiones

| Versión | Fecha | Qué cambió |
|---|---|---|
| v1 | 2026-08-19 | Documento inicial. Recoge las 4 decisiones de Kris |
| v8 | 2026-09-17 | La lista «Día a día» pasa a ser una tabla: columnas para resultado, hora y puntos de cada lado, orden ascendente, fila de totales con efectividad, y la franja solo dice mismo setup / setup distinto. Detalle en §5.9 |
| v7 | 2026-09-17 | Diferencias pasa a ser la pestaña principal: dashboard arriba y la **lista día a día** abajo, con un modal de las dos gráficas. «Día» pasa a llamarse **Registrar**. Todas las horas en **hora Colombia**. Detalle en §5.8 |
| v6 | 2026-08-31 | «Diferencias» rehecho: la brecha en puntos arriba, el desglose por causa ordenado por lo que cuesta, los días clave pulsables, y fuera la jerga y la gráfica semanal. Detalle en §5.7 |
| v5 | 2026-08-19 | El signo de los puntos se deriva del resultado de Chaumer, y el modal deja claro que todo lo suyo es suyo. Corregida la fila del 18. Detalle en §5.6 |
| v4 | 2026-08-19 | Ajustes tras el primer uso: la imagen se muestra también en los días sin setup, y la fecha sube a la fila de las pestañas. Detalle en §5.5 |
| v3 | 2026-08-19 | Fases 3 y 4 cerradas. Se añaden §5.3 y §5.4 con lo medido, y el hallazgo del signo de los puntos que salió del uso real |
| v2 | 2026-08-19 | **Chaumer pasa de dorado a azul** y tú al verde: a Kris no le convencía el dorado como texto. Se corrigen dos choques que salieron de ahí — «Ejecución» y «Otra lectura» compartían violeta, y el azul ya lo usaba la tarjeta de Experimentos en Otros. Detalle en §3 y §4.0 |
