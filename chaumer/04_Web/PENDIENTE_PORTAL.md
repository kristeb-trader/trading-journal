# PENDIENTE DEL PORTAL

**El buzón entre Cowork y Claude Code.** Aquí queda escrito lo que hay que hacer en el portal.

---

# ✅ DIAGNÓSTICO APROBADO — puedes ejecutar

El informe (`DIAGNOSTICO_PORTAL.md`) está leído. **Buen trabajo, y gracias por parar donde tenías que parar.**

Abajo está lo aprobado, **en orden**. Lo que no aparece aquí, no se hace todavía.

**Cómo trabajar esto:** una tarea por sesión, `/clear` entre una y otra. Al terminar cada una, márcala `[x]` y anota debajo qué archivos tocaste. **No adelantes tareas de más abajo.**

---

## 1 · [x] El umbral de volumen y el número del NQ retirado 🔴

`src\pages\premercado.astro`, líneas 156, 157, 176 y 178.

Apunta al nombre real del parámetro del plan y **quita de la pantalla la fila del NQ**: ese umbral se retiró el 06/09/2026 y el portal lo sigue enseñando como si fuera vigente. Es el fallo más grave del informe.

Mientras estás ahí: la línea 168 (`19:00 hora Colombia`) y la 108 (el valor del tick) también son números a mano de la misma página.

---

## 2 · [x] El vigilante de parámetros que no existen

Que la compilación **falle** si una página pide un parámetro que no está en el plan. Hoy el fallo es silencioso: se pinta el texto de reserva y nadie se entera. Es lo que dejó pasar el punto 1 durante días.

Y de paso: **quita las reservas escritas a mano** de los 16 usos. Que la página falle al compilar es más honesto que enseñar un número viejo.

---

## 3 · [x] El vigilante de texto aprobado contra página

Compara los títulos de cada archivo de `textos\` con los de su página y falla si falta alguno.

Es el que más rinde de todo el informe: es el único que habría encontrado solo la sección de riesgo escrita y no dibujada. **Ejecútalo sobre los ocho módulos y dime qué más aparece** — es muy posible que ésa no sea la única.

---

## 4 · [x] La sección de la regla de parada: se BORRA

**Decisión del operador, 07/09/2026.** Esa sección no va al portal.

- Quita la tabla de rachas y sus estilos de `src\pages\riesgo.astro` (línea 24 y líneas 118-134). Es código muerto.
- **Y quítala también de `textos\08-riesgo.md`**, a partir de la línea 64, para que el texto aprobado y la página digan lo mismo.

Con eso desaparecen solos los dólares y porcentajes de la línea 109 que el informe listaba como números a mano.

---

## 5 · [x] Las 12 apariciones de «5 velas», a parámetro

Ocho en `zonas.astro`, cuatro en `setups.astro`. Y de paso la ventana horaria de `jornada.astro` (líneas 42, 44, 46, 61), el tick de `entrada.astro` (43, 45), el tope de stop de `dentro.astro` (44) y las equivalencias de `riesgo.astro` (42).

Los tres de `filtros.astro` línea 86 y `riesgo.astro` 56-57 (`79,75`, `30`, `80,25`) **se quedan**: son ejemplos que ilustran que el tope es una línea dura, no valores del plan.

---

## 6 · [x] El índice ligero de reglas

Un archivo al lado de `reglas.json` con una línea por regla: número, grupo y enunciado. Que lo genere el copiador.

Es tu propia petición del informe y tiene razón: hoy no hay forma de leer una sola regla sin cargar las 38.

---

## 7 · [x] La regla de la vela origen, ausente del recorrido

La de la vela que hace máximo mayor y mínimo menor sin corrida viva. Una frase en el módulo de zonas, donde se explica la vela designada.

---

## 8 · [x] Los nombres de grupo escritos a mano en la portada

`src\componentes\TarjetasInicio.astro`, línea 36. Que salgan de `reglas.json`.

---

## 9 · [x] Limpiar lo huérfano

- Los lectores del glosario, del backtesting y del acta de cierre en `src\lib\parsers.mjs`: **ya se pueden borrar**, las dos decisiones están tomadas.
- La página del plan completo, sub-fase por sub-fase: **antes de borrarla, arregla el enlace** que le llega desde observaciones.
- `scripts\graficos_conceptos.py`: **no lo borres.** Ponle una nota en la cabecera diciendo que no se ejecuta desde aquí — los diagramas del método se hacen en Cowork.
- Ignora los `.jfif` de `textos\` en las búsquedas.

---

## 🖼️ PARA COWORK — un diagrama dice lo contrario que el texto que tiene encima

**Encontrado el 08/09/2026, al mirar la página en el navegador después de arreglar la tarea 1.** Yo no lo toco: los diagramas se hacen en Cowork.

**Archivo:** `public\conceptos\09-zona-volumen.png` — el diagrama de las zonas por volumen del premercado.

**Qué le pasa:** **lleva el umbral del NQ dibujado dentro**, el que se retiró el 06/09. En la imagen se lee, con estas palabras:

- el subtítulo: *«Toda vela por encima de 2.000 contratos deja zona»*
- la línea de puntos del panel de volumen, rotulada **`umbral 2.000`**
- la vela destacada: **`2.290 contratos en un minuto`** — que supera 2.000, pero **no llega a 6.000**, así que con el umbral vigente **esa vela no dejaría zona**

**Por qué importa.** El texto de esa misma pantalla ya dice, correctamente, el umbral vigente — **desde el 14/09/2026 son `> 8.000 contratos en MNQ`**, y sale solo del parámetro. **El dibujo que va justo debajo enseña lo contrario, y con un ejemplo que hoy sería inválido.** Arreglar el texto sin arreglar la imagen deja la contradicción más a la vista que antes, no menos.

**Ojo, no es solo esta.** Ese archivo es **byte a byte el mismo** que `..\02_Assets\diagramas\R-15_premercado_volumen.png`, que sí está en el grupo de los siete de agosto que se van. **Cuando se rehaga, hay que reponer las dos copias**, o esta seguirá viva en el recorrido aunque la otra desaparezca.

**Ningún vigilante ve esto** — la imagen existe y el enlace funciona. Solo se ve mirándola.

---

## 🛑 NO se hace todavía

**Unificar las carpetas de imágenes.** Se aplaza, y no por el riesgo que tú señalaste.

Al revisar los diagramas de reglas uno por uno —mirándolos, que es lo que tú no puedes hacer— **los siete de agosto se van del portal**. Cuatro son hojas de preguntas que usé para entrevistar al operador, con preguntas sin responder impresas en la imagen. Dos enseñan reglas que él corrigió después. Todos están en los colores viejos.

**Mover archivos que hay que borrar es trabajo tirado.** Cuando estén rehechos, volvemos a esto.

Mientras tanto: **no toques `..\02_Assets\diagramas\` ni el manifiesto que asigna diagramas a reglas.** Se te avisará por aquí.

---

## Recordatorios

- **No apliques las cuatro fusiones de reglas** (38 → 33). Sin decidir. **Hoy son 38.**
- **`..\01_Plan\` es de solo lectura.** Las contradicciones van a `PROPUESTAS_AL_PLAN.md`.
- **No generes los diagramas del método.**
- La regla de las instrucciones que contradecía la decisión de los huecos **ya está reescrita**. No hace falta que la toques.

---

## Hecho

### Casos reales: índice y visor — 22/09/2026

Pedido del operador: «ya tiene muchas gráficas y es difícil hacer scroll». Diagnóstico medido: la página
tenía **46 pantallas** de alto (41.500 px), con las 30 gráficas y los 30 textos abiertos a la vez, y
cargaba 8 MB de imágenes. Propuesta aprobada completa, con el texto al lado de la gráfica.

- **Tres pestañas** (Test ciego · Sesiones · Ejemplos) con su cuenta, y en cada una una **rejilla de
  miniaturas**: gráfica, fecha o título, resultado y setup. La página mide ahora **1,6 pantallas** en
  escritorio y unas 2 en el móvil, donde la tarjeta es una fila.
- **El visor:** al pulsar una tarjeta se abre casi a pantalla completa, con la gráfica a la izquierda y
  el texto al lado con su propio scroll. Flechas en pantalla y del teclado, deslizar en el móvil, tira de
  miniaturas abajo y «Ampliar gráfica» para verla sola. `Esc`, el aspa y el «atrás» del navegador lo
  cierran igual.
- **Los enlaces siguen iguales:** `/galeria#G-xx` y `/galeria#AAAA-MM-DD` abren el visor en ese caso;
  `/galeria#sesiones` abre la pestaña.
- **El filtro por regla** pasa a un desplegable con el enunciado de cada regla. Cada pestaña cuenta lo
  que queda.
- **Miniaturas:** `scripts/miniaturas.mjs` (con `sharp`) las genera en cada compilación en `public/min/`,
  unos 450 KB en total. Solo rehace las que cambiaron de contenido. La gráfica grande solo se descarga
  al abrir el visor.
- **Se quitan del texto** las rutas de archivo del plan («Archivo: …png» y «Gráfico: 05_Backtesting\…»):
  eran para quien escribe el plan, y la ruta sin espacios abría huecos en el justificado. Solo en el
  portal: `GALERIA.md` no se toca.
- **Comentar sobre una selección** sigue funcionando dentro del visor: el globo se muda al diálogo.

### Casos reales y test ciego, una sola página — 22/09/2026

Pedido del operador, fuera de la lista: «son lo mismo, casos de backtesting hechos desde Claude».

- **`/galeria`** tiene ahora tres bloques, con el test ciego primero: **Test ciego** (9 jornadas, la más
  reciente arriba), **Sesiones de julio** (11) y **Ejemplos del método** (10). **30 tarjetas, sin
  duplicados.** Las jornadas del 10, 11 y 14/09 tienen caso en la galería y salen una sola vez, con el
  texto del caso dentro. El reparto lo hace `P.casosReales()` leyendo el título que da el plan.
- **Las anclas no cambian:** `/galeria#G-xx` para un caso y `/galeria#AAAA-MM-DD` para una jornada.
- **`/test-ciego`** es ahora solo una redirección al bloque; con fecha, a su jornada.
- **El menú** pierde «Test ciego», y «Casos reales» cuenta 30. **La tarjeta de la portada** dice 30 y
  enseña los tres bloques en vez de «IRI · Reingreso · Descartes», que estaban escritos a mano.

**Un fallo que ya estaba publicado y salió al revisar:** las dos tablas de `GALERIA.md` sobre la
galería entera —«Lo que esta galería valida» y «Lo que no tiene todavía»— son secciones de primer nivel,
y el lector las pegaba al final de **G-11**. Además, G-11 heredaba sus reglas y el filtro lo sacaba con
reglas que no trata. Ahora el texto de un caso termina donde empieza una sección de primer nivel.


> ✅ **Las nueve tareas de la lista aprobada, cerradas el 22/09/2026.**

### 9 · Limpiar lo huérfano — 22/09/2026

- **Lectores borrados** de `src/lib/parsers.mjs`: glosario, backtesting y acta de cierre, y los dos de
  sub-fases, que solo usaba la página que se borró. 86 líneas. `scripts/contar-fuentes.mjs` ya no los
  cuenta.
- **La página del plan por sub-fases, borrada** (`src/pages/plan.astro`). Antes se arregló el único
  enlace que le llegaba: un comentario de Observaciones atado a una sub-fase lleva ahora a la portada,
  como ya hacían los de términos y pendientes. El portal pasa de 57 a 56 páginas, sin enlaces rotos.
- **`scripts/graficos_conceptos.py`**: no se borró. Lleva una nota arriba: no se ejecuta desde el
  portal, los diagramas se hacen en Cowork.
- **Los `.jfif` de `textos/`**: nada que hacer. Los vigilantes solo leen los `.md`.

**Un resto que se va solo:** la dirección `/plan/` quedó guardada en la caché de Cloudflare de antes de
borrarla —la copia enseña el test ciego como hueco declarado; la cifra de julio, no—. Nada enlaza a
ella, solo se ve escribiéndola a mano, y caduca sola en siete días como mucho. En `pages.dev` no se
puede vaciar la caché desde aquí.


### 8 · Los grupos de la portada, del plan — 22/09/2026

La tarjeta «Las reglas» enseñaba **4 de los 7 grupos**, escritos a mano y elegidos sin criterio: faltaban
«Setup y entrada» —justo donde están la corrida fluida y el punto de referencia—, «Filtros» y «Proceso».

Ahora salen de `reglas.json`, **los siete, en su orden y con la primera palabra de su nombre**
(opción A del operador): *Perímetro · Estructura · Zonas · Setup · Riesgo · Filtros · Proceso*. Quedan en
dos líneas, como la tarjeta de al lado; mirado en escritorio y en móvil. Publicado.

**Archivo:** `src/componentes/TarjetasInicio.astro`.


### 7 · La vela que abarca a la anterior, de vuelta en el recorrido — 22/09/2026

**En Jornada, no en Zonas** — decisión del operador, que cambia la del mismo día de dejar Jornada como
estaba. Vuelve a su sitio de antes del 07/09: dentro de «La primera vela», justo antes de «Por dónde
empieza el día». El texto es el de entonces, que coincide con su regla del plan.

`textos/04-jornada.md` regenerado (recoge también la fila del horario del plan de la tarea 5). Referencia
sellada. Publicado.


### 6 · El índice ligero de reglas — 22/09/2026

El copiador genera **`src/content/reglas_indice.md`** en cada sincronización, al lado de
`reglas.json`: una línea por regla con **número · grupo · enunciado** (en zonas, con su
subgrupo, marcado o vigencia). **6 KB frente a los 88 KB** de `reglas.json`, con las 40 reglas.

Como se regenera siempre, no se puede quedar atrás. Y como vive en `src/content/`, no va a git: se
genera, como el resto de esa carpeta.

`04_Web/CLAUDE.md` lo dice ya en la tabla de qué abrir: primero el índice, después **esa** regla en
`reglas.json`.

**Archivos:** `scripts/sync.mjs` y `CLAUDE.md`. No cambia nada en pantalla; no hace falta publicar.


### 5 · Los números a mano, a parámetro — 22/09/2026

Antes, por decisión del operador: **fuera el párrafo de Riesgo** sobre el porcentaje que crece cuando la
cuenta cae (los `$160`, `$3.000`, `$1.400`, `5 %`, `11 %`). No estaba en la sección que borró la tarea 4.

| Qué | Cómo |
|---|---|
| **«5 velas»**: las 10 que quedaban en cifra (el recuento bajó de 12 al reescribir hoy las secciones de estirar y apéndice) | salen de `PLAZO_CONSECUCION` |
| La **ventana** de jornada: la duración, «2 horas» y las horas de verano e invierno | salen de `VENTANA_OPERATIVA`. El plan la da en hora de Nueva York; la conversión a hora Colombia es calendario, no método, y está explicada en el código. Nueva fila «En el plan: 09:30–11:30 ET» |
| El **tick** de entrada | «+ 1 tick (0,25 puntos)», del parámetro |
| Las **equivalencias** del tope en dentro, riesgo y —no estaba en la lista— premercado | de la columna «Equivalencias» de la fila del parámetro |
| La **cuenta objetivo** `$3.000` y el `5,3 %` de riesgo (no estaban en la lista) | del bloque «Consecuencias de riesgo» de `PARAMETROS.md` |

**Una trampa que se evitó:** el valor del plazo en el plan es *«5 velas — es un TOPE, no una espera
obligatoria»*. El lector separa ahora el valor de la explicación que va tras la raya; la página de
parámetros las enseña las dos. **Filtros llevaba publicada esa frase rota**: *«Pasan 5 velas — es un
TOPE, no una espera obligatoria desde el rompimiento…»*. Arreglada.

**Lo que se queda a mano, y por qué:**
- **«08:31»**, la primera vela, en jornada: lo dice la propia regla de la primera vela, pero no es
  un parámetro. Si se quiere sacar del plan, hay que añadirlo a `PARAMETROS.md` primero.
- **«cinco velas», en letra**, en los pies y textos alternativos de cuatro gráficos de zonas: describen
  el dibujo, que tiene las cinco velas pintadas.
- Los ejemplos `79,75`, `30` y `80,25`, como pedía la tarea.

Los vigilantes piden ahora **31** valores al plan. Comparado con lo publicado: los números salen
idénticos; solo cambian la frase rota de filtros, la fila nueva de jornada y el valor del tick. Publicado.


### 4 · La sección de la regla de parada, borrada — 22/09/2026

- **Página** (`src/pages/riesgo.astro`): fuera la tabla de rachas y todos sus estilos, que ya eran
  código muerto — el HTML de la sección se había quitado antes. La cabecera del archivo, que seguía
  presentando la página como «el único hueco que se ve desde dentro», dice ahora qué se borró y por qué.
- **Texto aprobado** (`textos/08-riesgo.md`): fuera la sección entera.
- **El vigilante de textos entra en `npm run verificar`**: con esto ya no falla por nada.

**Una frase rota que salió de paso:** la página decía *«Siempre 1 MNQ contrato de MNQ»*. El parámetro
vale «1 MNQ» y la frase le añadía «contrato de MNQ» detrás. Ahora dice *«Siempre 1 MNQ.»*

Comparado con lo publicado antes: solo cambian esos estilos muertos y esa frase. Publicado.

**Lo que NO desapareció, contra lo que decía la tarea:** los dólares y porcentajes que el informe
listaba en la línea 109 (`$160`, `$3.000`, `$1.400`, `5 %`, `11 %`). No estaban en la sección borrada,
sino en «Con cuántos contratos», que se queda. Pendiente de que el operador decida si ese párrafo se va
también o se queda.


### 3 · El vigilante de texto aprobado contra página — 22/09/2026

**`scripts\aprobados.mjs`** (`npm run aprobados`). Compara los títulos de cada archivo de `textos\`
con los de su página ya compilada: **falla** si un título aprobado no está en la página, y **avisa**
si la página tiene uno que el texto no tiene (el archivo se quedó atrás). Ignora los códigos de regla
y la sección «Anotaciones que seguían abiertas». Lee la lista de páginas del propio exportador.

**Resultado sobre los nueve archivos** — y además una pasada única párrafo a párrafo, para no quedarse
solo en los títulos:

| Archivo | Qué hay | Qué es |
|---|---|---|
| `08-riesgo.md` | «No hay regla de parada», 16 líneas que la página no tiene | **Lo único aprobado y nunca dibujado.** Lo resuelve la tarea 4 |
| `04-jornada.md` | «Las dos horas» y la sección de **la vela que abarca a la anterior** | **No es texto sin dibujar: es texto viejo.** El operador reescribió la página el 07/09 («Cambios varios»): renombró a «Ventana Operativa», y **quitó esa sección**. El texto aprobado se quedó con la versión anterior |
| `00-portada.md`, `01-premercado.md` | el banner viejo, 38 reglas y 21 casos, y el umbral de 6.000 y del NQ | Texto atrasado respecto a la página. **Regenerados**: no tenían nada propio |
| los otros cinco | nada | idénticos a su página |

**Conclusión: no aparece nada más aparte de riesgo.** La sospecha era que hubiera más secciones
escritas y no dibujadas; no las hay.

**Decisión del operador, 22/09/2026:** Jornada **se queda como está**, sin la sección de la vela que
abarca a la anterior. `04-jornada.md` se regeneró para que diga lo mismo que la página; la redacción
vieja queda en el historial de git. Las dos notas de `03-setups.md` **se dejan**.
Con eso el vigilante solo falla ya por riesgo.

**Queda fuera de `npm run verificar` a propósito:** hoy fallaría por los tres títulos de arriba y
bloquearía la publicación. Entra cuando se cierre la tarea 4 y se decida qué hacer con
`04-jornada.md`.

**Relación con la tarea 7:** la regla de la vela que abarca a la anterior no está hoy en ninguna página.
Estuvo en jornada hasta el 07/09. Si vuelve —la tarea 7 la pone en zonas—, el texto viejo de jornada
tiene la redacción.

**Una nota del operador que quizá ya sobra:** `03-setups.md` guarda dos notas pidiendo un gráfico más
sencillo para el IRI y otro para el Reingreso. Las dos láminas nuevas de «Solo hay dos» parecen
cumplirlas. No se borran sin su sí.


### 2 · El vigilante de parámetros que no existen — 22/09/2026

**Una sola puerta.** Las páginas ya no leen la tabla de parámetros: piden el valor con
`P.parametro('X')`, que **tira la compilación** si `X` no existe en `PARAMETROS.md` o viene vacío,
con el nombre y la lista de los que sí existen en el mensaje.

**Las 11 reservas escritas a mano, fuera** (las otras 5 ya las había quitado la tarea 1). Tres páginas
—jornada, setups y zonas— definían el atajo sin usarlo: se les quitó, con su import.

**Vigilante nuevo, `scripts\parametros.mjs`**, dentro de `npm run verificar`. Sin compilar, comprueba
los 16 usos contra el plan y caza las tres formas de volver a una reserva: `v('X', '…')`,
`?.valor ?? '…'` y `parametros().get(…)`.

**Probado al revés:** con un nombre mal escrito y una reserva metidos a propósito, el vigilante dio
los tres fallos con archivo y línea, y la compilación se cayó con el nombre del parámetro.

**No cambia nada en pantalla:** las ocho páginas salen idénticas, letra por letra, a las publicadas.

**Archivos:** `src\lib\parsers.mjs`, `scripts\parametros.mjs`, `package.json`, y `dentro`, `entrada`,
`filtros`, `jornada`, `premercado`, `riesgo`, `setups`, `zonas` en `src\pages\`.

**Aparte:** el operador dio por buenos el 22/09/2026 los textos nuevos de corrida fluida y punto de
referencia.


### Actualización del plan del 14–21/09 y el test ciego — 22/09/2026

Pedido directo del operador, fuera de la lista numerada: diagnóstico primero, y el sí a todo con dos
decisiones suyas — **la cifra del backtesting se quita** de la pantalla, y **el test ciego va en una
sección nueva** con las nueve jornadas. Las tareas 2 a 9 **siguen pendientes**, en su orden.

| Qué | Dónde |
|---|---|
| **La cifra del backtesting, fuera.** Las notas de las dos reglas nuevas, la galería y la historia del plan citaban `−91,00 en 9` y `−77,75 en 5`. El lector de fuentes quita la **frase** que la contiene (o la nota de regresión entera, o la fila de tabla); el plan no se toca. Un vigilante nuevo lo comprueba sobre lo compilado | `src\lib\fuentes.mjs`, `scripts\cifras.mjs`, `package.json` (entra en `verificar`) |
| **Corrida fluida** — nueva parada en Setups, entre IRI y Reingreso: las tres condiciones, cuándo falla, el bloqueo del sentido del día, el rompimiento directo y cómo se recupera | `src\pages\setups.astro` |
| **Punto de referencia** unificado: cualquier retroceso vivo, el más cercano entre entrada y objetivo, y muere por **cierre**, no por mecha | `setups.astro`, `filtros.astro` |
| **Filtros: de cuatro a cinco** (entra la corrida fluida, solo IRI). El ancla sigue siendo `#cuatro` para no romper enlaces | `filtros.astro` |
| **Estirar la zona y la apéndice**, con el texto que ya estaba en `PROPUESTAS_AL_PLAN.md`: los dos finales del mismo rango, la estructura de tres velas, el borde lo decide el tipo de zona | `zonas.astro` — y se sellaron las referencias de esas dos reglas |
| **Test ciego**: página nueva `/test-ciego` y entrada en el menú. El copiador trae los gráficos de `Back_claude\` en solo lectura. El veredicto en texto sale **solo** de la tabla del test ciego de `GALERIA.md`; si una jornada aún no está ahí, sale solo su gráfico. **Sin totales** | `scripts\sync.mjs`, `src\lib\parsers.mjs`, `src\pages	est-ciego.astro`, `Marco.astro` |
| Los casos **G-22, G-23 y G-24** de la galería llevan ya su gráfico: el de su jornada del test ciego, por la fecha del título | `parsers.mjs` |
| **Umbral de volumen**: el parámetro traía la anotación `*(desde 14/09/2026)*` pegada y salía con los asteriscos a la vista. El lector la separa; parámetros la enseña aparte. El conversor de títulos aprendió además la cursiva | `parsers.mjs`, `parametros.astro` |
| Textos aprobados regenerados **solo** de zonas, setups y filtros. Los demás no se tocaron: llevan diferencias con su página que son justo lo que mide la tarea 3 | `textos`, `03`, `06` |

**Lo que se publicó de paso:** la tarea 1 (el umbral de premercado), que seguía sin publicar. El sitio
enseñaba todavía `> 2.000 en NQ` y `> 6.000`.

**Para Cowork:** `09-zona-volumen.png` sigue con el umbral viejo dibujado — ahora el vigente es **8.000**.
Y en `PROPUESTAS_AL_PLAN.md` hay una nota nueva sobre la checklist, que cuenta cuatro filtros y
enumera cinco.


### 1 · El umbral de volumen y el número del NQ retirado — 08/09/2026

**Archivo tocado: uno solo.** `src\pages\premercado.astro`.

| Qué | Antes | Ahora |
|---|---|---|
| El umbral, en el texto del apartado | pedía un parámetro inexistente → pintaba `> 6.000 contratos` a mano, y `> 2.000 en NQ` al lado | sale del parámetro real del plan |
| El umbral, en la ficha de datos | lo mismo, en dos filas | una sola fila, del parámetro |
| **La fila del NQ** | `Umbral en NQ · > 2.000 contratos` | **quitada de la pantalla** |
| El inicio del premercado (línea 168) | `19:00 hora Colombia` a mano | del parámetro — y trae además «(apertura de Tokio)», que estaba duplicado en la frase; se quitó el duplicado |
| El valor del tick (línea 108) | `0,25` a mano | del parámetro |

**Se quitaron los textos de reserva** de los cuatro sitios que toqué. Si mañana falta uno de esos parámetros, la página lo enseñará vacío en vez de pintar un número viejo. Es medio paso de la tarea 2, hecho aquí solo porque dejar una reserva escrita a mano en la línea que venía a arreglar era contradictorio.

**Comprobado de tres formas:** los cuatro vigilantes en verde (53 páginas, 2.532 enlaces, 0 fallos); el HTML compilado no contiene ya ni `2.000` ni `en NQ` en esa página; y **abierto en el navegador**, apartado por apartado, leyendo lo que sale en pantalla.

**Lo que NO se arregló, y por qué:** en la ficha del gráfico siguen escritos a mano **`$2,00` el punto** y **`$0,50` el tick**. No son parámetros del plan — no están en `PARAMETROS.md`— y **no los deduje dividiendo el tope de stop**, que sería inventar un número. Quedan escritos, con el motivo, en el comentario de cabecera de la página. Si el operador quiere que salgan del plan, hay que añadirlos allí primero.

**Y una cosa más, que está arriba en su propio apartado:** al mirar la página en el navegador se vio que **el diagrama de esa misma sección lleva el umbral viejo del NQ dibujado dentro**. Es para Cowork.

**Sin commit todavía** — pendiente del visto bueno.
