# Las reglas del plan de Chaumer — diagnóstico y propuesta

| | |
|---|---|
| **Versión** | v1.2 · 26/09/2026 |
| **Estado** | ✅ **Diseño v1.1 aprobado por Kris** (26/09/2026) · ✅ F0 · ✅ F1 · ⏳ F2 |
| **Alcance** | `chaumer/01_Plan` (las reglas y los documentos que las rodean), sus consumidores (portal, Journal, Coach, NinjaTrader, motor, test ciego) y cómo se ven en el portal |
| **Regla que manda** | D-028: nada de `01_Plan` cambia sin el sí de Kris, cambio a cambio. Este documento no cambia nada |

## Registro

- **v0.1 · 25/09/2026** — Diagnóstico medido sobre el repositorio, la base de datos y el portal compilado.
- **v0.2 · 26/09/2026** — Kris descarta «un archivo por regla» (40 archivos). La fuente pasa a ser **un archivo
  por grupo** (7, los mismos grupos del plan y del portal), con una plantilla fija por regla (§4.2). Cambian
  con ello §4.1 (punto 4), §4.3, §4.4, la F2 de §4.6 y §6.
- **v1 · 26/09/2026** — Diseño completo. Kris aprueba los siete archivos por grupo y decide hacer las fusiones
  en esta misma reestructuración (§4.4, F3). §4 pasa de propuesta a diseño: archivos antes → después, la
  plantilla exacta, el lector y el vigilante, los consumidores, la ficha del portal y cinco fases.
- **v1.1 · 26/09/2026** — Kris aprueba el diseño («Si, aprobado y empecemos»). **F0 hecha:** las 40 fichas del
  portal enseñan su «Por qué» entero (R-40 pasa de 368 a 8.285 caracteres, con sus 7 subtítulos; R-32
  recupera «Dónde va el stop»); una tabla que se queda sin filas al quitar las cifras del backtesting se
  quita entera (pasaba en R-40; 0 tablas vacías en las 56 páginas); `scripts/plan/vigilar.mjs` en modo
  informe da **13 hallazgos en 6 de los 7 apartados** — la lista de trabajo de la F1 y la F2. Los títulos
  de los subapartados arrastran historia («corregido 27/08/2026») hasta la F2.
- **v1.2 · 26/09/2026** — **F1 hecha**, con el sí de Kris (plan 3.14). La checklist, el catálogo del Journal
  (`p2_g_3891b80b` → `p2_g_6e7362a5`) y el documento del Coach ya dicen el stop bueno; C-08/C-09 repetidos →
  C-11/C-12; P-22 cerrado; versiones 3.14 en los tres documentos; `ESTADO.md` con el umbral (8.000, decía
  6.000), la galería (24 casos, decía 21) y la contextualización (11 elementos) al día. `lector.py` lee el
  umbral de `PARAMETROS.md` (regresión: todo cuadra). El LEEME del test ciego, con la ventana de invierno.
  Las cinco huellas del Coach cuadran; `catalogo_reglas` sigue con 90 activas y las mismas 9 casillas y
  automáticas. El vigilante baja de 13 a **9 hallazgos**, todos de la F2.

---

## 1 · En una frase

**El contenido de las reglas es bueno; lo que falla es dónde y cómo está escrito.** Cada regla vive en
seis o siete sitios a la vez, mezclada con su historia, y eso ya produce contradicciones, hace que el
portal enseñe reglas a medias y que el Coach pague por leer fechas. La mejora no es de metodología: es
**una sola fuente por regla, limpia, y todo lo demás generado desde ella**.

---

## 2 · El mapa: dónde vive una regla y quién la lee

| Dónde está escrita | Qué lleva | Quién lo lee |
|---|---|---|
| `01_Plan/reglas.json` (90 KB) | enunciado, 260 condiciones, acción, excepciones, nota, estado | portal (índice y fichas), `sincronizar.mjs` → `catalogo_reglas` y el Coach, `generar_ficha.py` → test ciego |
| `01_Plan/TRADING_PLAN_CHAUMER.md` (144 KB) | la explicación de cada regla + anexos y cambios | portal («Por qué dice esto») |
| `01_Plan/GLOSARIO.md` (53 KB) | 26 términos; ~18 de ellos son, por título, el mismo tema que una regla (corrida = R-05, retroceso = R-06, zona apéndice = R-11, punto de referencia = R-41…) | Coach, portal |
| `01_Plan/CHECKLIST_DIARIA.md` (9 KB) | la secuencia del día, línea a línea con su regla | `sincronizar.mjs` (casillas y automáticas por fragmento de texto), Coach, portal |
| `01_Plan/ESTADO.md` | la lista de las 40 | personas |
| `05_Backtesting/test_ciego/FICHA_MARCADO.md` | generada desde `reglas.json` ✅ | el test ciego |
| `04_Web/textos/*.md` (7.150 palabras) | la versión redactada para Alfredo, a mano | las 8 páginas de módulo del portal |
| `05_Backtesting/lector.py` | la regla hecha código (auditoría) | la cadena diaria → `motor_fichas` |

**En la base de datos** (`catalogo_reglas`, etapa 2): 90 filas — las 40 reglas, las 48 líneas de la
checklist (2 casillas, 5 automáticas, 41 de guía) y 2 automáticas que salen de una regla. `sesion_checklist`
tiene 1 marca de la etapa 2 (24/09). El Journal y NinjaTrader (`ChecklistChaumer`) leen de aquí, **no** del plan.

---

## 3 · Diagnóstico, por lo que duele

### 🔴 A · Información incorrecta o incompleta, hoy

**A1 · El portal enseña las reglas a medias.** La ficha de cada regla corta su explicación en el primer
subtítulo (`parsers.mjs`, `seccionesDeReglas`, parte por encabezados de nivel 2 **y 3**). Medido sobre el plan:

| Regla | Lo que llega a «Por qué dice esto» |
|---|---|
| R-40 · corrida fluida | **4 %** (368 de 8.868 caracteres): solo la categoría y el enunciado |
| R-32 · stop y target | **19 %**: se pierde entera «Dónde va el stop» |
| R-14 · el plazo es un tope | 21 % |
| R-41 · punto de referencia | 28 % |
| R-33 · no se gestiona | 30 % |
| R-09 · marcado de zonas | 46 % |

**24.193 caracteres del porqué no llegan a Alfredo ni a Kris.** Es un fallo del portal, no del plan: se
arregla sin tocar `01_Plan`.

**A2 · La checklist se contradice con la regla del stop.** La tabla «Medir» dice que el stop de una
Continuación va en el **extremo del retroceso**; la regla (`R-32` en `reglas.json`), `PARAMETROS.md`
(`ORIGEN_DEL_STOP`) y el bloque añadido al final de la propia checklist dicen **el extremo alcanzado desde
que nació la zona hasta el rompimiento**. Es la misma contradicción que la limpieza del 04/09 corrigió en
cuatro reglas, y que en la checklist sobrevivió. El Coach lee esta checklist entera.

**A3 · `PARAMETROS.md` promete algo que no se cumple.** Dice *«las reglas citan el nombre del parámetro, no
el valor. Se cambia aquí y se propaga a todo el plan»*. Medido en `reglas.json`:
- **11 de los 15 parámetros no aparecen ni una vez por su nombre** (`PLAZO_CONSECUCION`, `TICK`,
  `VENTANA_OPERATIVA`, `VENTANA_NOTICIA`, `CANCELACION_FINAL`…).
- Los valores van escritos a mano: «5 velas» **15 veces**, «80 puntos» 3, «8.000» 2. Hasta `R-32` dice
  `STOP_MAX = 80 puntos`, nombre y valor juntos.
- `lector.py` lleva su propio `UMBRAL_VOL = 8000`. La cadena diaria lo pisa leyendo `PARAMETROS.md`; el
  test ciego, que corre el motor a mano, usa el 8000 escrito.

Si mañana cambia el plazo o el tope de stop, el portal (que sí resuelve nombres) diría una cifra y las
reglas otra.

**A4 · Códigos repetidos.** En `CONTEXTUALIZACION.md` hay **dos C-08 y dos C-09** distintos (el volumen en la
ventana operativa / la favorabilidad del sentido de la apertura…), y el glosario cita «C-08» tres veces
sin que se pueda saber cuál. En `PENDIENTES.md`, `P-22` figura a la vez como abierto y como cerrado.

### 🟠 B · Estructura: lo que cuesta tiempo, dinero y errores

**B1 · La misma regla en seis o siete sitios, propagada a mano.** Es la causa de A2 y de las cinco
contradicciones vivas de septiembre. Con D-028 el plan se edita desde aquí: cada cambio de una regla
obliga hoy a tocar `reglas.json`, su sección del documento maestro, el término del glosario, la línea de la
checklist, `ESTADO.md` y, a veces, `textos/` del portal — y nada comprueba que digan lo mismo.

**B2 · La historia está mezclada con la norma.**

| Documento | Lo que no es regla |
|---|---|
| `TRADING_PLAN_CHAUMER.md` | **37 %** son anexos y notas de construcción (53.700 caracteres); solo la sesión del 27/08 (`F1.12`) son 45.000. Las siete categorías de reglas son el 57 % |
| `reglas.json` | **126 fechas**; «estado» es texto libre con historial (*«confirmada 14/09 · reescrita 14/09 · bloqueo de SENTIDO… 21/09»*); las notas llevan «Palabras del operador», «MOTOR:», «REGRESIÓN», separadas por `||` |
| `GLOSARIO.md` | 7.200 caracteres de «agenda de términos pendientes» y «preguntas abiertas heredadas del PDF»; marcas «CORREGIDA el 26/08» dentro de las definiciones |
| `CHECKLIST_DIARIA.md` | dos bloques «🔴 Añadido 27/08» pegados al final en vez de en su paso; «CORREGIDO 27/08 — antes decía lo contrario» |
| `PENDIENTES.md` (46 KB) | abiertos, cerrados y desviaciones (`D-xx`) mezclados y fuera de orden |

**Lo que cuesta:** el Coach lee **135 KB** de plan en cada sesión (reglas 58 + glosario 52 + el resto), unos
**88.000 tokens**, 0,92 USD por sesión (medido el 24/09). Una buena parte es historia que el Coach no
necesita para juzgar un día. *Estimación, a medir en el diseño:* limpio, rondaría la mitad.

**B3 · `reglas.json` parece datos, pero es prosa.** 260 condiciones con 239 nombres de variable distintos
(solo 16 se repiten), el 100 % de los valores son texto, 86 de más de 80 caracteres, y el operador «=» aparece
245 veces delante de frases. **Ningún programa calcula con esas condiciones**: el motor tiene su propia
lógica, y el portal, el Coach y la ficha del test ciego las pintan como texto. El formato no da nada y
cuesta legibilidad: en el portal sale una tabla con `condicion_2_el_retroceso_no_se_pasa | <= | …`.

**B4 · Sin tildes.** `reglas.json` tiene 48 letras con tilde en 90 KB, frente a 193 apariciones de «grafico»,
«sesion», «continuacion», «mas alla»… Esas frases salen tal cual en el portal (índice y fichas), en
Estrategia del Journal y en el Coach. Los `.md` sí las llevan.

**B5 · Numeración y orden.** `R-39` no existe (se fusionó el 04/09); `R-40` y `R-41` van al final de «Setup
y entrada» aunque una es el filtro de la Continuación y la otra el tope del objetivo del Reingreso.
«Prioridad» (1, 2 o 3) sale en el portal y en el Coach y **no está definida en ningún documento**.

**B6 · Cuentas y versiones que no cuadran.** `chaumer/CLAUDE.md` dice «40 reglas» arriba y «38 reglas» en
la tabla de fuentes; `ESTADO.md` habla de «10 elementos» de contextualización (hay 12 cabeceras); la
checklist va por la versión 3.12 y el plan por la 3.13; el portal comenta «las 38» en su código.

**B7 · Cuatro fusiones pendientes desde el 04/09** (40 → 35, con la cuenta de aquella propuesta): las tres de «una operación y se acabó el día»
(`R-23`, `R-28`, `R-34`), las dos de «solo hay dos salidas» (`R-30`, `R-33`), las dos de la vela de
apertura (`R-07`, `R-27`) y `R-19`, que es un cajón: cinco de sus seis puntos ya están en otra regla. La
propuesta está en `chaumer/_Historia/PROPUESTA_LIMPIEZA_REGLAS.md` — **fuera de git**.

### 🟡 C · El portal

**C1 · Las 8 páginas de módulo están bien.** Didácticas, con diagramas y texto para Alfredo (`/setups`,
`/zonas`…). No son el problema.

**C2 · La ficha de regla es un volcado técnico.** 21.173 palabras en las 40 fichas; mediana 2.200 px de alto;
`R-15` son 1.439 palabras y 4.010 px; `R-40` en móvil, unos 8.000 px. La misma regla se dice cuatro veces
(enunciado, «por qué» cortado, acción, nota) y encima va la tabla de condiciones. Bajo el título, el
historial («confirmada 14/09 · reescrita 14/09…») y «prioridad 1», sin significado. La nota es un muro
con `||`.

**C3 · Detalles:** la cabecera dice «Trading Plan de Futuros **NQ**» y el plan opera solo MNQ desde el 06/09;
`textos/` es otra copia a mano que se puede desalinear del plan.

### ✅ Lo que funciona y no se toca

- El contenido y la disciplina de redacción: sin adjetivos, con ticks, velas y horas.
- `sincronizar.mjs` y sus huellas; la etapa 2 del Journal; los códigos `p2_*`, estables.
- `FICHA_MARCADO.md` generada, no escrita.
- Los vigilantes del portal (parámetros, referencias, vista) — el modelo a copiar para el plan.
- Los módulos del portal.

---

## 4 · Diseño

### 4.1 · El principio

> **Cada cosa se escribe una vez. Lo demás se genera y se comprueba.**

1. **Una regla, una fuente**, con una plantilla fija (§4.3). **Sin historia.**
2. **La historia, aparte**, en `HISTORIAL.md` + el `git log` de los commits `plan:`. El Coach y el portal no la leen.
3. **Los números, solo por nombre** (`PLAZO_CONSECUCION`, `STOP_MAX`…), y el motor lee `PARAMETROS.md`.
4. **Los identificadores no se renumeran nunca.** `R-40` sigue siendo `R-40`: lo usan `catalogo_reglas`, la
   galería, el Coach y el historial. El orden de lectura lo da la posición de la regla en su archivo. Una regla
   fusionada no se borra: su código **lleva a la regla que la absorbió**.
5. **Un lector y un vigilante** (§4.5): el lector convierte los archivos en datos para todos; el vigilante
   cierra cada commit `plan:` y falla si algo no cuadra.

### 4.2 · Archivos: antes → después

```
01_Plan/  HOY (12)                              01_Plan/  DESPUÉS (16)
  TRADING_PLAN_CHAUMER.md  144 KB  ─────┐         reglas/
  reglas.json               90 KB  ─────┼──────►    1-perimetro.md
                                        │           2-estructura.md
                                        │           3-zonas.md          (marcado y vigencia)
                                        │           4-setup-entrada.md
                                        │           5-riesgo-gestion.md
                                        │           6-filtros.md
                                        │           7-proceso.md
                                        └──────►  HISTORIAL.md          (nuevo: toda la historia)
  subfases/ (2)  ───────────────────────────────► HISTORIAL.md
  reglas.json                                     reglas.json           GENERADO desde reglas/
  GLOSARIO.md        53 KB                        GLOSARIO.md           solo definiciones (~15–20 KB)
  CHECKLIST_DIARIA.md                             CHECKLIST_DIARIA.md   integrada, sin historia
  PENDIENTES.md      46 KB                        PENDIENTES.md         abiertos + desviaciones
  CONTEXTUALIZACION.md                            CONTEXTUALIZACION.md  sin códigos repetidos
  ESTADO.md                                       ESTADO.md             cabecera + advertencia + índice
  PARAMETROS.md · GALERIA.md · CIERRE_FASE_1.md   (se quedan)
```

`TRADING_PLAN_CHAUMER.md` **desaparece**: la explicación de cada regla pasa a su «Por qué»; la secuencia de
marcado de la jornada, al principio de `3-zonas.md`; la advertencia de uso, a `ESTADO.md`; los anexos `F1.x`
y la tabla de versiones, a `HISTORIAL.md`. Sigue en el historial de git.

Tamaño estimado de los siete archivos, ya limpios: de ~2 KB (proceso) a ~35–40 KB (zonas).

**Fuera de `01_Plan`:**

```
scripts/plan/leer-reglas.mjs     NUEVO  el lector: reglas/*.md → datos → reglas.json
scripts/plan/vigilar.mjs         NUEVO  el vigilante
scripts/plan/sincronizar.mjs     usa el lector; el documento del Coach son los 7 archivos
scripts/plan/mapa-casillas.json  fragmentos y reglas al día con la checklist nueva
chaumer/05_Backtesting/lector.py             lee UMBRAL_VOL de PARAMETROS.md
chaumer/05_Backtesting/test_ciego/generar_ficha.py   lee el reglas.json nuevo
chaumer/04_Web/src/lib/parsers.mjs           esquema nuevo; el «Por qué» sale de la regla
chaumer/04_Web/src/pages/reglas/[id].astro   la ficha nueva (§4.7) + redirección de las fusionadas
chaumer/CLAUDE.md · chaumer/04_Web/CLAUDE.md · test_ciego/LEEME_BACK_DIARIO.md · CLAUDE.md
```

### 4.3 · La plantilla de una regla

Cada archivo empieza por su grupo y, si lo tiene, un texto de entrada. Luego van las reglas, en orden de
lectura, **todas con la misma forma**:

```markdown
# 4 · Setup y entrada
> cuándo se opera

## R-40 · Corrida fluida

> Solo se entra en el rompimiento de la zona de una corrida **fluida**: la corrida deja su zona, el
> retroceso no se pasa y la corrida siguiente rompe esa zona.

| | |
|---|---|
| Aplica a | Continuación |
| Parámetros | — |
| Relacionadas | R-25 · R-09 · R-06 |
| Casos | G-22 · G-24 |

### Cómo se aplica
1. La corrida dejó su zona al terminar (R-09).
2. El retroceso mide **menos** que su corrida, los dos sobre el zigzag. Empate = no se pasa.
3. La corrida siguiente **rompe** esa zona.

### Si no se cumple
No se opera ese rompimiento. La zona sigue viva: se dibuja, tapa objetivos y hace de borde de banda.
Se espera a un IRI nuevo entero más allá de ella.

### Por qué
…
```

| Parte | Obligatoria | De dónde sale hoy |
|---|---|---|
| `## R-xx · Nombre corto` | sí | el id + un nombre corto nuevo (hoy solo lo tienen las secciones del documento maestro) |
| `> la regla` (1–3 frases) | sí | `enunciado` de `reglas.json`, con tildes y parámetros por nombre |
| Tabla: Aplica a · Parámetros · Relacionadas · Casos | sí (con «—» si no hay) | nueva; «Casos» sale de la galería |
| Filas opcionales: Apartado (solo zonas: Marcado / Vigencia) · Fuente · Pendiente · Absorbe | si aplica | `subcategoria`, `fuente`, `pendiente`; «Absorbe» lista las reglas fusionadas en ésta |
| `### Cómo se aplica` | sí | `condiciones` + `accion`, en frases (sin nombres de variable ni «=») |
| `### Si no se cumple` | si aplica | la parte de `accion` o de las condiciones que dice qué pasa al fallar |
| `### Excepciones` | si hay | `excepciones` |
| `### Por qué` | sí | la sección del documento maestro + la parte explicativa de `nota` |
| — | — | **al historial**: `estado` con sus fechas, y de `nota`, la historia («Palabras del operador», «MOTOR:», «REGRESIÓN», «ampliada el…») |
| — | — | **se retira**: `prioridad` (no está definida en ningún documento) y los campos `categoria_*` (los da el archivo) |

**El `reglas.json` generado** (lo único que leen las máquinas):
`id · nombre · grupo · grupo_nombre · grupo_orden · apartado · orden · aplica_a · regla · como_se_aplica[] ·
si_no_se_cumple · excepciones[] · porque · parametros[] · relacionadas[] · casos[] · pendiente · fuente ·
absorbe[]`, y aparte un mapa `fusionadas` (`R-23 → R-28`…).

### 4.4 · Las fusiones: 40 → 35

Decididas por Kris el 26/09 («fusionemos eso de una»). **No cambian lo que se hace en el mercado**: juntan
ideas que ya eran una.

| Juntas | Se queda | Dice | Grupo |
|---|---|---|---|
| una operación por sesión · se toma el primer setup válido · al llenarse termina el análisis | **R-28** (absorbe R-23 y R-34) | *Una operación, la primera que se llene, y ahí termina el día* | Riesgo y gestión |
| la posición sigue aunque acabe la ventana · no se gestiona | **R-33** (absorbe R-30) | *Solo hay dos salidas: stop u objetivo* | Riesgo y gestión |
| la vela de apertura es el origen · no da el sesgo del día | **R-07** (absorbe R-27) | *La vela de apertura: origen sí, sesgo no* | Estructura |
| las «seis precisiones de dibujo» | se reparte: cada precisión a su regla (R-20, R-21, R-09, R-13, R-08); la única propia —no se solapan zonas de tipo distinto— va a **R-13** (superposición) | — | Zonas |

Resultado: **35 reglas** — Perímetro 4 · Estructura 4 · Zonas 13 · Setup y entrada 5 · Riesgo y gestión 5 ·
Filtros 3 · Proceso 1. *(La cuenta la comprueba el lector; el vigilante comprueba que ninguna idea se pierde:
cada condición de una regla absorbida tiene que aparecer en la que la absorbe).*

**Lo que arrastran:**
- `catalogo_reglas`: las 5 absorbidas pasan a `activa = false` (nunca se borran). No son casillas: la
  disciplina no se mueve.
- La checklist cita R-23 en «Primer setup válido» → pasa a citar R-28 (y el mapa, igual).
- El portal: `/reglas/R-23` y las demás **llevan a la regla que las absorbió**.
- La galería y el historial siguen citando los códigos viejos: son historia, y el vigilante los acepta porque
  están en el mapa de fusionadas.

### 4.5 · El lector y el vigilante

**`leer-reglas.mjs`** — lee los siete archivos, comprueba la plantilla y escribe `reglas.json`. Es la única
pieza que entiende el formato: el resto lee el JSON.

**`vigilar.mjs`** — falla (y el commit `plan:` no se da por cerrado) si:

| Comprueba | Por qué (del diagnóstico) |
|---|---|
| una regla se sale de la plantilla | que el formato siga siendo «datos» |
| `reglas.json` no coincide con los archivos | nadie lo edita a mano |
| un código (R, P, G, C, D) está definido dos veces | A4 |
| se cita una regla que no existe (y no está en `fusionadas`) | referencias rotas |
| una regla o la checklist lleva escrito el valor de un parámetro («80 puntos», «5 velas», «8.000») | A3 |
| un parámetro citado no existe en `PARAMETROS.md` | igual que el vigilante del portal |
| la versión o las cuentas no coinciden entre `ESTADO.md`, la checklist y el lector | B6 |
| aparecen fechas o marcas de historia en una regla | B2 |

### 4.6 · Los consumidores

| Quién | Qué cambia | Qué no |
|---|---|---|
| **Coach** | el documento «reglas» son los siete archivos seguidos, tal cual; glosario y checklist limpios. La caché se reescribe una vez | la estructura del system (bloque A + bloque B) |
| **Journal** (`catalogo_reglas`) | las 40 filas de regla: título = nombre corto, enunciado con tildes; 5 pasan a inactivas | los códigos `p2_*`, las casillas, las automáticas y la disciplina |
| **NinjaTrader** (`ChecklistChaumer`) | nada | lee casillas de `catalogo_reglas`, que no cambian |
| **Test ciego** | `FICHA_MARCADO.md` se regenera desde el JSON nuevo | lo que marca |
| **Motor** (`lector.py`) | lee el umbral de `PARAMETROS.md` (F1) | la lógica |
| **Portal** | parsers al esquema nuevo; ficha nueva (§4.7); redirecciones | las 8 páginas de módulo |

### 4.7 · La ficha del portal

1. **Cabecera:** el nombre («Corrida fluida») y el grupo; el código, pequeño.
2. **La regla**, con los parámetros como pastilla con su valor.
3. **Cómo se aplica** · 4. **Si no se cumple** · 5. **Excepciones**, si hay.
6. **Por qué**, entero, plegado si es largo.
7. **En el gráfico:** diagramas y casos reales · 8. **Relacionadas**.

**Fuera:** «prioridad», el estado con fechas, la nota con `||` y la tabla `variable | op | valor | marco`.
El índice enseña el nombre corto y la regla con tildes. Se revisa en móvil.

### 4.8 · Las fases

**Cinco fases.** Cada una se verifica por separado y termina en commit y push. Desde la F1, lo que toca
`01_Plan` va con el sí de Kris (D-028).

| Fase | Qué | Toca el plan | Qué hace Kris | Cómo se verifica |
|---|---|---|---|---|
| **F0 · Arreglos del portal** ✅ | el «Por qué» cortado (A1), los comentarios de «38», el vigilante en **modo informe** (enseña todo lo que falla, sin bloquear) | No | mirar una ficha, p. ej. R-40 | `npm run verificar`; las 40 fichas con su sección entera |
| **F1 · Correcciones** ✅ | el stop de la checklist (A2), C-08/C-09 → C-11/C-12 y P-22 (A4), cuentas y versiones (B6), los pendientes de Cowork (los cuatro filtros, la línea de IRI, `ESTADO.md:120`), P-20 fuera de los campos de registro, `lector.py` lee `PARAMETROS.md`, la ventana de invierno del LEEME | Sí | el sí a la lista de cambios | vigilante en verde en esos puntos · `sincronizar.mjs` · regresión del motor |
| **F2 · La estructura nueva** | en 4 pasos: **2a** el lector y el vigilante completo · **2b** los siete archivos con **las 40 reglas, mismo contenido**, historia a `HISTORIAL.md`, tildes y parámetros por nombre · **2c** los consumidores (Coach, Journal, test ciego, portal con los parsers nuevos) y las instrucciones (`CLAUDE.md`) · **2d** glosario, checklist, pendientes y estado | Sí | revisar los siete archivos (uno por grupo) y dar el sí | **nada se pierde**: un script compara cada frase de hoy con dónde quedó · las huellas · la ficha del test ciego · `SELECT` de `catalogo_reglas` antes y después · tokens del Coach en `coach_uso` |
| **F3 · Las fusiones** | 40 → 35 (§4.4), un commit `plan:` por fusión | Sí | el sí al texto de cada regla fusionada | el vigilante: ninguna condición de una absorbida se queda fuera · redirecciones del portal · `catalogo_reglas` |
| **F4 · La ficha del portal** | ficha nueva, índice, móvil | No | mirarla | capturas antes/después · `vista.mjs` |

**Por qué las fusiones van después de la estructura y no a la vez:** la F2 se verifica comparando las 40
reglas de hoy con las 40 nuevas, frase a frase. Si a la vez se juntaran reglas, esa comparación ya no
demostraría que no se ha perdido nada. Con la estructura hecha, cada fusión es un cambio pequeño dentro de un
solo archivo.

**Tamaño:** F0, F1, F3 y F4, una sesión cada una. La F2 es la grande: dos o tres sesiones, una por paso si
hace falta.

**Riesgos y cómo se cubren:**
- **El test ciego está en marcha:** la F2 se aplica entre dos jornadas, y la ficha del test ciego se compara
  antes y después.
- **Las referencias por texto:** `mapa-casillas.json` localiza las casillas por un fragmento literal de la
  checklist; se actualiza en el mismo commit, y `sincronizar.mjs` ya avisa si no las encuentra.
- **Las tildes cambian el texto en `catalogo_reglas`:** los códigos no cambian, así que la disciplina
  histórica no se mueve. `SELECT` antes y después.
- **Alfredo ve el portal:** lo que cambia es cómo se lee una regla; su contenido, solo en las fusiones.

---

## 5 · Lo que no se hace

- **Cambiar lo que dice ninguna regla.** Solo dónde y cómo está escrita, y juntar las que ya decían lo mismo.
- **Renumerar.** Los huecos (`R-39`, y los de las fusionadas) se quedan.
- **Convertir las condiciones en datos que un programa ejecute.** Solo tendría sentido si el motor leyera las
  reglas, y el motor es de auditoría (regla 4 del proyecto).
- **Tocar las 8 páginas de módulo del portal**, salvo lo que arrastre el cambio de fuente.
- **Un archivo por regla** (v0.1): descartado por Kris el 26/09.

---

## 6 · Pendiente de Kris

1. **Aprobar este diseño** para empezar por la F0.
2. *(Menor, se puede decidir en la F4)* La cabecera del portal dice «Trading Plan de Futuros **NQ**» y el plan
   opera solo MNQ desde el 06/09: ¿se cambia a MNQ?
