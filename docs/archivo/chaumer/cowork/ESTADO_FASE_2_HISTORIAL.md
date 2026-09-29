# HISTORIAL DE LA FASE 2 — el portal

Registro cronológico del trabajo en `04_Web/`, de lo más nuevo a lo más viejo.

Salió de `ESTADO_FASE_2.md` el 07/09/2026: era el 80 % de aquel archivo, que
se lee al empezar cada chat. **Esto no se lee entero.** Se busca por fecha o
por palabra y se abre solo el trozo que haga falta.

## Historial

### 2026-09-07 · el titular de la portada y las paradas descuadradas

Dos arreglos pequeños pedidos por el operador.

**La portada.** El titular va ahora centrado, y «Alfredo Chaumer» se pinta
aparte en el azul claro del portal (`--acento-vivo`, `#6AA0FF`), lo justo
para que resalte sin salirse de la paleta. `BannerTerminal` acepta una
propiedad `destacado` ademas del `titulo`; la cinta y la fila de cuatro
datos no se tocan.

**Las paradas de los modulos.** En la ruta de apartados, un titulo de dos
renglones salia con el primero centrado y el segundo corrido a la
izquierda. El operador lo vio en zonas, en «Rompimiento y consecucion» y
«Cuando quitar una zona», que son los dos que mas parten.

No era el ancho de la columna ni el recorte a tres lineas, que ya se
habian tocado antes por este mismo sintoma. La parada es un `<li>`, y la
regla comun de justificado de `base.css` le deja `text-align-last: left`.
**Esa propiedad se hereda, y el `text-align: center` de la parada no la
toca:** manda solo sobre las lineas que no son la ultima. Se anade
`text-align-last: center` junto al centrado que ya estaba.

Medido palabra a palabra en las siete paradas a 1280px: antes, la ultima
linea se iba entre 16 y 36px a la izquierda; despues, 0 en las siete.
Afecta a los ocho modulos, no solo a zonas.

**Lo que ningun vigilante vio.** `npm run verificar` pasaba limpio antes y
despues: el de maquetacion solo mira `text-align` en el codigo, y el de
vista no comparaba la alineacion de las lineas de un mismo bloque. Era el
segundo defecto de tipografia que encontraba el operador y no la revision
automatica.

**Asi que el vigilante aprendio a verlo.** `scripts/vista.mjs` pasa de
cuatro comprobaciones a cinco: **centrado roto**. En cada pagina recorre
las cajas de texto centradas, mide donde cae cada renglon respecto al eje
de su caja y falla si alguno se desvia mas de 3px —el margen que deja un
espacio al final de linea—. Se probo al reves, que es la unica prueba que
vale para un vigilante: revertido el arreglo, canta las dos paradas de
zonas, «Rompimiento y consecucion» a 28px del eje y «Cuando quitar una
zona» a 51px; restaurado, las 53 paginas pasan limpias. De paso, la logica
de agrupar renglones por solapamiento vertical, que ya usaba la
comprobacion de la pared invisible, queda en una sola funcion compartida.


### 2026-09-07 · la foto del escritorio en premercado

El operador paso una foto ancha del puesto de trabajo —seis pantallas, el
teclado y la libreta, todo apagado— y pidio que ocupe media pagina en
«Como estoy hoy», con el texto en la otra mitad.

La imagen no llegaba como archivo, solo en el chat; estaba en sus descargas
como `Pre.jfif`. Convertida a JPEG progresivo y guardada en
`public/screenshots/premercado/escritorio.jpg` (1440x720, 185 KB).

**El reparto.** `.ap-dividido` tenia la columna derecha en **14rem fijos** —
cabia una captura vertical y poco mas—. Ahora es
`repeat(auto-fit, minmax(22rem, 1fr))`: dos mitades de verdad cuando cada una
respira, y una sola columna cuando no. Con un punto de ruptura fijo, entre
700 y 1000px salian dos columnas de cuatro palabras por linea.

La captura anterior de la nota manuscrita (`como-estoy-hoy.jpg`) se queda en
el repositorio, sin usar, por si se quiere recuperar.


### 2026-09-06 · portada nueva, menu con color y las reglas en lista

El operador puso de referencia **krea.ai**: menu con iconos de color, banner
con movimiento arriba y poco mas en la portada. «Los nuestros parecen una
pagina muerta.»

#### La portada

Se le enseñaron **tres propuestas** montadas y funcionando —«El mercado en
vivo» con velas dibujandose, «Terminal» con cinta de cotizacion y «Aurora»
con manchas de luz— y eligio **Terminal**.

Queda: banner con la cinta corriendo, malla de pantalla encendida y los
cuatro datos de la operativa (MNQ · 1 min · 08:31→10:30 · 1 orden), y debajo
**tres puertas** en filas anchas: el plan operativo, las reglas y los casos
reales, con su cifra al lado. Nada mas. Fuera la portada densa anterior.

> 🔴 La cinta lleva simbolos reales pero **numeros de muestra**, y lo dice en
> la propia cinta. El portal no se conecta a mercado.

#### Los iconos del menu

Los ocho modulos salian de una rampa cian→azul y no se distinguian entre si.
Ahora **cada uno tiene su color** y se reconoce antes por el color que por el
texto. Fuera de la paleta quedan **el rojo y el oro**: el rojo esta reservado
a un dato negativo real y el oro al aviso de «no probado», y gastarlos de
adorno les quita el significado donde importa.

#### El menu de reglas

- **Se pliega.** Va dentro de un `<details>`: un clic abre, otro cierra, sin
  una linea de JavaScript.
- **Caja propia**, con su cabecera «por grupo», fondo y borde, en vez de una
  lista suelta colgando del menu.
- **Punto de color por grupo**, el mismo que usa la pagina de reglas.
- **Marca el grupo en el que estas.** Estando en una regla de zonas se marcaba
  «Las reglas» a secas; ahora se marca *Zonas* y, si toca, *Marcado*. Se
  resuelve en el servidor, asi que sale bien ya en la primera pintura.

#### Las reglas, en lista

Fuera las tarjetas. Lista por categoria, con cabecera de grupo, color, cuenta
y descripcion; Zonas parte ademas en marcado y vigencia. Cada fila: codigo,
enunciado y sus cifras. Elegir un grupo en el menu deja solo ese.

#### La ficha de una regla, reordenada

Lo pidio asi: **primero la explicacion y el texto, luego el diagrama, y la
tabla de condiciones medibles al final** — «es muy tecnico y ni lo veo».

Orden nuevo: por que dice esto · accion · excepciones · nota · casos reales ·
diagrama · condiciones medibles.

Ademas: **«anterior» arriba a la izquierda** —ocupa el sitio del enlace a
todas las reglas, que se retira— y **«siguiente» arriba a la derecha**. El
boton de comentar deja de flotar arriba y se coloca al final.


### 2026-09-06 · la renumeracion de las reglas, aplicada al portal

El 06/09/2026 las 38 reglas se renumeraron en `01_Plan` para que corran
seguidas dentro de las siete categorias. El portal **no se entero**.

#### El fallo, y por que ningun comprobador lo veia

Los ocho modulos escriben los codigos **a mano** en el titulo de cada
apartado. Se escribieron con la numeracion anterior. Tras la renumeracion
seguian existiendo —`R-10` existe—, solo que **ya no era esa regla**:

| Donde | Decia | Llevaba a | Tenia que llevar a |
|---|---|---|---|
| Zonas · Corrida y retroceso | `R-10 · R-11` | «se estira la zona» y «nace la apendice» | `R-05 · R-06` corrida y retroceso |
| Premercado · Como estoy hoy | `R-28` | «una operacion por sesion» | `R-37` no operar enfermo |
| Zonas · Rompimiento y consecucion | `R-37` | «no operar enfermo» | `R-20` rompimiento y consecucion |

**47 de las referencias apuntaban a otra regla.** `scripts/enlaces.mjs` las
daba por buenas porque el destino existia: solo comprueba que la pagina este
ahi, no que sea la que toca.

#### Lo aplicado

Traducidas las 48 referencias con la tabla de `EQUIVALENCIA_NUMERACION.md`
—las 47 de los modulos mas el enlace cruzado de `parsers.mjs`, que pasa de
`R-13` a `R-20`—. Repasadas **una por una** contra el titulo de su apartado:
todas cuadran.

Verificado ademas que el orden y las categorias se leen del archivo: 38
reglas de `R-01` a `R-38` en orden ascendente, los siete grupos en su orden
de uso, y los contadores del submenu cuadrando (4 + 4 + 14 con sus 11 + 3 +
5 + 7 + 3 + 1).

#### Para que no se repita

Nuevo `scripts/referencias.mjs`, encadenado en `npm run verificar`. Guarda una
huella de **que enunciado tiene cada codigo escrito a mano**
(`referencias.lock.json`) y **falla si alguno cambia**, diciendo cual era y
cual es ahora. No sabe si una referencia es la correcta —eso hay que leerlo—
pero obliga a releerlas justo cuando la numeracion se mueve, que es cuando se
rompen. Tras revisarlas se sella con `node scripts/referencias.mjs --sellar`.


### 2026-09-06 · el texto, justificado y sin paredes — de una vez

Sexta vez que el operador pedia lo mismo. **Esta vez se midio antes de tocar
nada**, cargando las 53 paginas y comprobando cada bloque de texto.

**Lo que salio de la medicion:**

| | |
|---|---|
| Bloques alineados a la izquierda | **1.186** |
| Bloques justificados | **26** |
| Paginas con tope de ancho vivo | 9 |

Es decir: **el justificado estaba puesto en el 2 % del portal**. Solo en los
parrafos de los apartados de modulo, que fue donde se aplico la primera vez,
en agosto. Nunca se extendio al resto.

**Por que fallaron las cinco veces anteriores:**

1. **Se arreglo por sintoma, nunca por inventario.** Cada vez se miraba la
   pagina que el señalaba, se quitaba el tope que hubiera ahi y se daba por
   hecho. Nunca se midio el conjunto.
2. **El ancho venia de sitios independientes** — el token `--medida`, reglas
   por pagina, reglas por componente y limites en `ch` dentro de cada uno—,
   asi que no habia una sola cosa que arreglar y se fueron quitando en el
   orden en que el los notaba.
3. **La alineacion nunca se toco fuera de los modulos.** Se leyeron sus
   avisos como si fueran solo sobre las paredes.

**Lo aplicado:** una unica regla en `base.css` que gobierna la alineacion y
el ancho de TODO el texto — justificado, ultima linea sin estirar, partido
por silabas y sin tope de ancho—. Se quitaron los dos topes que quedaban (los
subtitulos de modulo y de reglas), el `text-align: left` de las tablas y el de
los titulos de apartado.

**Resultado medido sobre las 53 paginas: 3.378 bloques justificados, 256
centrados a proposito, 0 a la izquierda, 0 paredes.**

#### Para que no se repita

Nuevo `scripts/maquetacion.mjs`, encadenado en `npm run verificar`. **Falla**
si alguien vuelve a meter en el codigo un tope de ancho fijo sobre texto o un
`text-align: left`, y falla tambien si desaparece la regla comun de
`base.css`. Las excepciones legitimas existen, pero hay que declararlas en la
misma linea con su motivo:

    max-width: 20rem;   /* ancho-ok: columna de imagen en movil */
    text-align: left;   /* alineacion-ok: columna de etiquetas */

Hoy hay tres declaradas. Ya no es una promesa: es una comprobacion que corre
antes de publicar.


### 2026-09-06 · un solo portal

Se acaba la doble modalidad. Ya no hay «modo tecnico» ni interruptor, asi que
tampoco hace falta encenderlo para ver nada.

**Fuera del menu:** portada tecnica, el plan completo, vocabulario,
pendientes, contextualizacion y acta de cierre. Las seis paginas se borraron,
no solo se ocultaron. **Queda:** inicio, los ocho modulos, las reglas, los
casos reales, los parametros, la checklist diaria y las observaciones — la
checklist justo antes de las observaciones, que es el orden en que se usan al
cerrar la jornada.

**Fuera tambien:** el buscador de la cabecera con su paleta, la tuerca del pie
del rail, el rastro de «modo tecnico encendido» y todo el plegado del lateral.
Con ellos se fueron unas 190 lineas de codigo y estilo.

**Los codigos de regla se ven siempre.** Estaban detras de la clase
`solo-tecnico`, que ya no existe. En los titulos de los ocho modulos son
enlaces a su ficha.

#### Un comprobador de enlaces, y lo que encontro

Nuevo `scripts/enlaces.mjs`: recorre `dist/` y verifica que cada enlace
interno apunte a una pagina, un archivo o un ancla que exista. Se ejecuta con
`npm run verificar` (compila y comprueba) y **sale con error si algo esta
roto**, para que no se publique sin querer.

En la primera pasada: **388 enlaces rotos**. Lo que habia:

- **Las 38 fichas de regla enlazaban a `/plan#R-xx`**, y esa pagina solo tiene
  anclas de sub-fase. El enlace caia al principio del documento. Ahora la
  explicacion del documento maestro se **muestra dentro de la propia ficha**,
  que ademas era donde tenia que estar desde que «el plan completo» salio del
  menu.
- **Se enlazaban reglas y casos que ya no existen.** Los documentos citan
  codigos de versiones anteriores —`R-39` se elimino y el 06/09/2026 se
  renumero todo—, y el enriquecido los convertia en fichas inexistentes. Ahora
  solo se enlaza lo que existe hoy, en los dos enriquecedores y en las tres
  listas que pintan codigos a mano (galeria, parametros y el plan).

Segunda pasada: **0 rotos de 2.504**.


### 2026-09-05 · la pared invisible, y marcha atras en el cajon

El operador, con razon: **el texto se cortaba contra una pared invisible y lo
habia pedido cinco veces**. Estaba arreglando sintomas, no la causa.

#### La causa, por fin

`tokens.css` tenia **`--medida: 62ch`**, y `base.css` lo aplicaba como
`max-width` a **todos** los parrafos y listas del portal. Encima habia otros
dos topes: `.mod` a 48rem y `.contenido.texto` a 52rem. Un parrafo media 768px
dentro de un contenedor de 1152: **384px vacios a la derecha en cada pagina**.

Ahora `--medida` es `100%` y los dos topes de contenedor se fueron. Quien
limita el ancho es el contenedor de la pagina, y nada mas. De paso salieron
los topes de los encabezados (`.cab`) de ocho paginas, que producian el mismo
efecto en el titulo y su entradilla, y el del titular de la ficha de regla.

#### Marcha atras en el cajon lateral

Se retira. Al entrar en una regla se va a su ficha, como siempre. La ficha ya
existia, esta completa y a el le gustaba.

#### Los grupos, al lateral

Fuera la barra de pastillas: se filtraba en dos sitios y sobraba uno. Los
siete grupos cuelgan ahora de «Las reglas» en el menu de la izquierda, con
guia vertical, contadores y los dos apartados de Zonas anidados. Solo se
despliegan estando en esa seccion. El grupo viaja en el ancla
(`#g=zonas.marcado`), asi que funciona con el boton de atras y se puede
enlazar.

El titulo pasa a **REGLAS TRADING PLAN**, centrado y en mayuscula, con el
mismo tratamiento que el titulo de un modulo.

#### Los codigos de regla ya llevan a la regla

En los ocho modulos eran texto muerto desde el primer dia — nunca fueron
enlaces, aunque el operador recordaba que si. Ahora hay un componente `Refs`
que los pinta como enlaces a su ficha, con el enunciado en el titulo al pasar
por encima. Siguen viendose solo en modo tecnico.


### 2026-09-04 · la pantalla de reglas, rehecha

**Lo que estaba mal**, en palabras del operador: texto que se corta, tarjetas
todas iguales sin jerarquía, y una lista lateral que repite lo que ya hacen los
filtros de arriba.

**Nada se corta.** La tarjeta enseña el enunciado **entero**, sin recorte ni
alto fijo: manda el texto y la fila crece. El detalle largo —condiciones,
excepciones, casos, diagrama— se lee en un **cajón lateral** que se desliza
desde la derecha, sin salir de la lista ni perder el filtro puesto. Se navega
con ← →, se cierra con Esc, y al cerrarlo la página vuelve donde estaba.

**Las categorías viven en un solo sitio.** El lateral es la navegación del
portal y no compite con los filtros. Para dejar sitio a la rejilla, **ahora se
pliega a iconos** y lo recuerda entre visitas — botón arriba del todo. Se aplica
a todo el portal, y solo en escritorio: por debajo de 900px el lateral ya es una
tira horizontal y ahí el texto tiene que verse.

**El color del grupo dice el orden del día.** Los siete van del cian al azul,
igual que los ocho módulos del recorrido: el tono es una posición, no un adorno,
y se calcula, no se escribe. El grupo se reconoce por el punto de la pastilla,
por la etiqueta de la tarjeta y por el filo de color de arriba.

> 🔴 **Verde y rojo no se usan aquí**, aunque el encargo los pedía para las
> reglas de riesgo. El rojo está reservado a un dato negativo real y el oro a
> los avisos: es lo que dice el estándar y romperlo aquí lo rompe en todo el
> portal. Los avisos del cajón —las notas— sí van en oro.

**Rejilla** de 1 columna en móvil, 2 en tablet y 3 en escritorio.
**Buscador** con `Ctrl/Cmd + K`; además, escribir con el foco fuera lleva al
campo. Contador de resultados y «quitar filtros» cuando hay alguno puesto.

#### Tres errores encontrados por el camino

- 🔴 **La ficha individual seguía con el mapa de las doce categorías viejas.**
  Se me pasó al cambiar solo el índice: mostraba `setup_entrada` y
  `riesgo_gestion` en crudo. Ya no hay ningún nombre de categoría escrito a
  mano en el portal.
- **El cajón arrastraba la página al fondo al abrirse.** Era el foco: sin
  `preventScroll`, el navegador lleva la página hasta el elemento enfocado.
- **`overflow: hidden` en el body no sirve para bloquear el scroll.** El
  viewport hereda ese overflow y la página pega un salto. Se congela con
  `position: fixed` y un desplazamiento negativo, y al cerrar se devuelve.

**Sobre la petición de React + Tailwind:** no se ha introducido ninguna de las
dos. El portal es Astro estático con estilos de componente y tokens, y meter dos
sistemas nuevos por una pantalla dejaría el resto del sitio hablando otro
idioma. El propio encargo admitía «JavaScript funcional», que es lo que hay:
sin dependencias en el navegador y sin librería de iconos —los de Phosphor se
incrustan al compilar—.


### 2026-09-04 · el plan pasa a v2.3: siete grupos y el stop corregido

Releído `01_Plan\` entero. **38 reglas, siete categorías, ninguna `R-39`** — nunca
llegó al portal, así que no hubo nada que quitar.

**Lo que estaba mal y ya no.**

- **El portal servía las categorías viejas.** No lee `01_Plan\` directamente:
  `sync.mjs` deja una copia en `src/content/`, y esa copia tenía todavía las
  doce categorías (`contexto`, `marcado_zonas`, `vigencia_zonas`…). Se refresca
  al compilar, pero hasta entonces se veía lo anterior.
- **`categorias()` ordenaba por tamaño.** Con siete grupos eso ponía Zonas
  primera y Proceso última, que no es el orden de la jornada. Ahora usa
  `categoria_nombre`, `categoria_descripcion` y `categoria_orden` tal como
  vienen en el archivo, y devuelve además los apartados de Zonas.
- **La definición del stop, en tres sitios.** Decían *«el extremo del
  retroceso»*, que es la definición anterior al 27/08/2026. La buena es **el
  extremo alcanzado desde que nació la zona hasta la vela de rompimiento**.
  Corregido en mecánica de entrada, en setups y en el filtro de cancelación de
  la orden. La galería ya lo decía bien.

  > ⚠️ No confundir con el **punto de referencia** del Reingreso, que **sí** es
  > el extremo del retroceso que originó la zona. Esa frase de setups es
  > correcta y no se toca.

**Zonas, como pidió la propuesta:** una sola categoría con dos apartados dentro
—marcado (11) y vigencia (3)—. Los apartados solo aparecen al elegir Zonas, y
se reinician al cambiar de grupo. La regla del rompimiento y la consecución
vive en Zonas·Vigencia pero **también sale al filtrar por Setup y entrada**, que
pasa de 5 a 6; en su ficha se lee «también en Setup y entrada». Está declarado
en `ENLACES_CRUZADOS`, en `parsers.mjs`, porque el archivo de reglas no lo dice.

**Las reglas suben al menú principal**, justo encima de Casos reales. Salen del
bloque de detalle técnico: el operador las quiere a la vista desde la portada.

**Anotado y no tocado:** en la regla del retroceso quedó una medida con la
definición vieja del stop. Va en `PROPUESTAS_AL_PLAN.md`, pendiente de que él
lo decida. `01_Plan\` no se modifica desde aquí.


### 2026-09-03 · zonas, segunda vuelta: el repaso del operador

Corrigió `textos/02-zonas.md` a mano y volvió a pasarlo. Aplicado entero al
portal, más **ocho gráficos rehechos y tres nuevos** a partir de sus notas.

#### Lo que cambió en el texto

- Apartado 1 reescrito: «el mercado solo tiene dos fases». Fuera la frase de la
  vela que mata la corrida.
- Apartado 2 pasa a llamarse **«Generación de zonas»**; la lista de pasos va
  ahora **antes** del gráfico, y se dice «la vela de la zona», no «la vela
  designada».
- Apartado 3: las dos fichas suben por delante del gráfico del traspaso. Fuera
  el párrafo del plazo.
- Apartado 4 y 5: añadido *«o si aparece una estructura nueva antes de las cinco
  velas, también se marca»*, cada uno con gráfico propio.
- Apartado 6 pasa a llamarse **«Zonas entre zonas»** y baja de tres reglas a dos.
- **Fuera el apartado 8** («El recorrido completo»). El módulo queda en siete.

#### Los gráficos, uno por nota suya

| Gráfico | Qué pidió |
|---|---|
| 02 y 16 | flechas de corrida y retroceso en vez de llaves |
| 03 | pasa a **bajista**: corrida a la baja, retroceso al alza, zona de soporte |
| 05 | más simple, y que enseñe **la zona estirada**, no solo que nadie la superó |
| 14 | rótulos a la izquierda, que se solapaban con las velas |
| 17 | más simple y **alcista de verdad**: cuatro velas de subida y un retroceso corto |
| 20 | marcadas **las cinco velas**, y recortado a seis velas tras el rompimiento |
| 22 | estaba mal: solo enseñaba el caso que sí se marca |
| **26** *(nuevo)* | el caso que **no** se marca, como en su propia imagen anotada |
| **24 y 25** *(nuevos)* | la estructura nueva llegando antes que las cinco velas |

Ninguna sesión del archivo tiene los dos casos de «zonas entre zonas» en la
misma banda y lo bastante separados como para leerse juntos, así que van en dos
gráficos, uno por caso.

También, en el motor de dibujo: flechas de recorrido, rótulos con lado
elegible, y fondo propio bajo la etiqueta de cada zona — se montaban sobre las
velas del borde derecho.

#### 🟠 Cuatro cosas que quitó, y que están pendientes de su respuesta

**Se aplicaron sus cambios tal cual.** Esto queda anotado porque toca reglas
confirmadas, no por discutirlo.

1. **«Si se tocan, se funden» ya no se explica en ningún sitio.** Era una regla
   confirmada, y además es de lo que depende que su propia frase nueva —«también
   se estira la zona»— sea cierta: una zona solo se estira si la nueva la toca.
2. **De «se busca la vela de la zona» desapareció «esa incluida».** Es una
   corrección fechada del plan (26/08/2026), con caso real: la vela que dispara
   el retroceso puede ser ella misma la del extremo.
3. **De «entre dos zonas» desapareció «se mide el recorrido del precio, no el
   rectángulo».** Es el núcleo de la regla, y es justo el error que él mismo
   anotó en `02_Assets/invalidos/R-17_invalido_01.png`.
4. **Ya no se muestra que las entradas sobre zona apéndice están pendientes.**

Y una duda de fondo, del apartado 5: su texto dice que si llega la estructura
nueva antes del plazo «también se genera la nueva zona apéndice». Por las reglas
lo que se marca es **la zona de esa estructura nueva**; la apéndice es lo que
pasa si el plazo se cumple sin consecución. El gráfico 25 enseña lo segundo.


### 2026-09-03 · marcación de zonas, reescrito en ocho apartados

**Lo que pidió el operador:** rehacer el análisis de cómo se marcan las zonas y
de sus casuísticas, mirar las imágenes de `00_Guias\Parámetros Chaumer.pdf`
para ver *cómo* explican ellos el flujo, y montar el nuestro con **imágenes
propias generadas de mercado real**. Una imagen en **cada** apartado, porque la
sección tiene demasiados casos para explicarlos solo con prosa.

**Vocabulario, decidido por él:**

- se dice **movimiento**, no *tramo* — aplicado en **todo el portal**, no solo
  aquí;
- después del rompimiento se dice **consecución**, no *confirmación* — es el
  término del glosario. También aplicado en todo el portal.

**Los ocho apartados** (antes eran seis):

| | Apartado | Imagen |
|---|---|---|
| 1 | Corrida y retroceso | movimiento alcista **y** bajista |
| 2 | De dónde sale la zona | la vela designada y sus dos bordes, y la zona ya extendida |
| 3 | Rompimiento y consecución | el traspaso entero · rompe con mecha · rompe con cuerpo |
| 4 | Cuando no llega la consecución | la zona que se estira |
| 5 | La zona apéndice | cómo nace, y un segundo caso real |
| 6 | Varias zonas a la vez | dos que se funden · la mitad entre zonas |
| 7 | Cuándo deja de contar | traspasada en los dos sentidos |
| 8 | El recorrido completo | diagrama del flujo, con la bifurcación de la consecución |

**Ocho gráficos nuevos** (16 a 23) generados con `scripts/graficos_conceptos.py`
sobre `NQ 09-26.Last.txt`. Antes de generarlos se sondearon las 48 sesiones del
archivo para comprobar que **cada casuística tiene ejemplos reales**: los tiene
todas, así que **no hay ni un gráfico inventado**.

**Solo reglas confirmadas.** Del PDF se tomó la *forma* de explicar, no
contenido: lo que allí aparece y no está en `01_Plan\` se quedó fuera. Lo que sí
se dice, porque el plan lo dice, es que **las reglas de entrada sobre una zona
apéndice están pendientes**.

#### Dos arreglos que salieron por el camino

- **El riel de apartados cortaba los títulos.** Con ocho paradas la columna es
  más estrecha y a dos líneas se perdían palabras enteras. Ahora admite tres
  líneas y parte por sílabas.
- 🔴 **Astro pegaba palabras en todo el portal.** Con `compressHTML` (activado
  por defecto) desaparecía el salto de línea que hay antes de un `<strong>` o de
  un `{parámetro}`, y salían cosas como «lo hizocon el cuerpo», «pasan5 velas» o
  «19:00PremercadoEmpiezan a marcarse zonas». Estaba en la portada, premercado,
  setups, jornada, filtros, dentro, riesgo y contextualización. Se apagó
  `compressHTML` en `astro.config.mjs`; el peso de más no se nota y el texto
  vuelve a leerse.



Correcciones del operador sobre la tanda anterior.

| Qué pidió | Qué se hizo |
|---|---|
| «esas velas de arriba se ven horribles» | **fuera la textura de velas.** En su sitio, un foco de luz azul muy suave. No se sustituyó por otro dibujo: fingir un gráfico que no existe fue el error |
| el texto a la izquierda y la imagen a la derecha | el hero **vuelve a dos columnas**, y los dos bloques de abajo **dejan el zigzag**: los tres tienen ahora el texto a la izquierda |
| «que no tenga que dar scroll» | la portada pasa de **1947 a 1343 px de alto**. El titular y el gráfico entran juntos en la primera pantalla |
| el copyright centrado | el pie pasa de extremos a **centrado** |
| apagar el modo técnico debe llevar al inicio | el enlace «apagar» pasa de  a ****. Apagar es «vuelvo a ver lo que ve Alfredo», y eso empieza en el inicio — no en la página de auditoría donde estabas |

Con el titular a 58px la columna del texto necesita algo más de ancho que la
del gráfico (1,06 contra 0,94): al revés se partía en «La metodología / de /
Alfredo Chaumer,» y dejaba un «de» colgando. Ahora son tres líneas limpias.

> ⏳ **Pendiente: la imagen del banner.** El operador quiere una imagen de
> internet. No se puso ninguna: hace falta que él decida la fuente y la
> licencia, porque el portal se comparte con un tercero.

**El tropiezo de Vite, otra vez.** Los cambios no se veían aunque el código
estaba bien. Es el mismo caso ya anotado: parar el servidor y borrar
 y . **Si algo no se refleja, empieza por ahí.**

### 2026-09-02 · la portada, rematada: fuera los módulos repetidos

Tres cosas que vio el operador sobre la portada nueva, y las tres eran ciertas.

**1 · Los ocho módulos salían dos veces.** Estaban en el menú de la izquierda
y otra vez en el centro de la portada. Es exactamente el defecto que se le
criticó a la portada anterior, y se coló de nuevo.

**Lo que ocupa su sitio: la jornada en horas.** Una banda horizontal debajo de
las dos columnas, alineada con el eje de horas del gráfico de arriba:

| | | |
|---|---|---|
| `19:00` | Premercado | empiezan las zonas por volumen, desde la apertura de Tokio |
| `08:30` | Abre el mercado americano | arranca la única ventana del día |
| `08:31` | La primera vela | declara la dirección y es el origen del primer tramo |
| `10:29` | Última orden | pasado ese minuto no se coloca nada |
| `10:30` | Cierra la ventana | prohíbe abrir, no obliga a cerrar |

Ninguna hora está inventada: salen de `PARAMETROS.md` y de los módulos de
premercado y jornada. La banda lleva al pie la salvedad de siempre — son horas
de pantalla en verano de Nueva York, y **el ancla es la apertura americana, no
el número del reloj**.

**2 · Las dos columnas no acababan al mismo nivel.** Medido: **261 px de
desfase**. Culpa de un `align-items: start` que puse para tapar un hueco vacío
en el panel — y que era justo lo que las mantenía alineadas. Ahora vuelven a
estirarse igual y el desfase es **0**, con el pie del panel empujado al fondo
(`margin-top: auto`), así que tampoco queda hueco muerto.

**3 · «La imagen se ve pixelada».** Medido: **no se amplía**. Se pinta al 34 %
de su tamaño real, igual que en la propuesta, y el recorte quita exactamente
215 px y ni uno más. Lo que había pasado es que el panel se quedó pequeño
(679×287) y una franja tan baja parece un recorte de miniatura. Al alinear las
columnas y estrechar la del texto, el gráfico pasa a **695×294** y recupera
presencia.

> ⚠️ **Si algo no se ve reflejado, es Vite.** Volvió a pasar dos veces en esta
> tanda: el CSS con ámbito se queda cacheado y la página se sirve con estilos
> viejos. **Parar el servidor y borrar `node_modules/.vite` y `.astro`** antes
> de tocar nada más. Ya van tres veces.

**Un detalle de rejilla que costó un rato:** la nota del titular usa
`display: grid` con dos columnas, y la rejilla reparte **un hijo por celda**.
Sin envolver el texto en un `span`, el `<strong>` se iba a su propia celda y
partía la frase por la mitad en móvil.

**Comprobado:** pies alineados al píxel, cero hueco en el panel, la imagen sin
ampliar, cinco paradas en la banda, sin desbordes a 375 ni 1440, ningún
objetivo táctil bajo 44 px y el detector sin hallazgos.

### 2026-09-02 · portada nueva: la propuesta «Terminal»

El operador rechazó el diseño de la portada. En vez de seguir parcheando se
montaron **tres propuestas completas** —Editorial, Terminal y Bento— en sus
propias direcciones, con contenido real y sin tocar la portada de entonces.
Las direcciones salieron de la skill **ui-ux-pro-max** que él mismo instaló,
consultada con tres ajustes distintos de variación y densidad.

**Eligió la 2, «Terminal».** Las otras dos y el selector **se borraron**: no
se dejan páginas muertas en el portal.

**Cómo es la portada ahora**

| | |
|---|---|
| Arriba | franja de estado en monoespaciada: instrumento, marco, ventana horaria, reglas, casos y términos. Es la firma del formato — se lee como la barra de una plataforma |
| Izquierda | el titular y los ocho módulos en una lista compacta con filete entre filas |
| Derecha | el gráfico en un panel con borde, y debajo los dos botones **centrados** |
| Forma | radio corto (`--radio-1`) y bordes visibles en todo. Es deliberado: es lo que da el aire de consola |

**Correcciones del operador sobre la propuesta elegida**

- **Nada de «Trading Plan NQ» como titular.** Ya está en el banner de la
  cabecera y salía dos veces. Vuelve el titular de siempre: «La metodología de
  Alfredo Chaumer, explicada.»
- **Fuera la banda de titulares del gráfico**: la fecha, el recuento de zonas
  y la línea verde de la operación que el PNG trae impresa.
- Los dos botones, centrados.

> **Cómo se quitó la banda del gráfico, y por qué así.** No se tocó el
> archivo: se recorta por proporción en CSS (`aspect-ratio: 2000 / 845` más
> `object-fit: cover` anclado abajo). El original de `02_Assets` queda intacto
> y **la galería lo sigue mostrando entero**, con la fecha y los datos de la
> operación, que allí sí hacen falta. Si se recortara el PNG se perdería esa
> información para siempre.

**Comprobado:** panel y lista a la misma altura (366 y 386 px, sin hueco
muerto), la portada entera en 1051 px contra una ventana de 980 — casi una
sola pantalla, sin desbordes a 375 ni 1440, ningún objetivo táctil por debajo
de 44 px, y el detector sin hallazgos.

### 2026-09-02 · vuelta al texto a la izquierda, y fuera las velas del banner

Correcciones del operador sobre la tanda anterior.

| Qué pidió | Qué se hizo |
|---|---|
| «esas velas de arriba se ven horribles» | **fuera la textura de velas.** En su sitio, un foco de luz azul muy suave. No se sustituyó por otro dibujo: fingir un gráfico que no existe fue el error de fondo |
| el texto a la izquierda y la imagen a la derecha | el hero **vuelve a dos columnas**, y los dos bloques de abajo **dejan el zigzag**: los tres tienen ahora el texto a la izquierda y la imagen a la derecha |
| «que no tenga que dar scroll» | la portada pasa de **1947 a 1343 px de alto**. El titular y el gráfico entran juntos en la primera pantalla |
| el copyright centrado | el pie pasa de extremos a **centrado** |
| apagar el modo técnico debe llevar al inicio | el enlace «apagar» pasa de `?tecnico=0` a **`/?tecnico=0`**. Apagar es «vuelvo a ver lo que ve Alfredo», y eso empieza en el inicio, no en la página de auditoría donde estabas |

Con el titular a 58 px la columna del texto necesita algo más de ancho que la
del gráfico (1,06 contra 0,94): al revés se partía en «La metodología / de /
Alfredo Chaumer,» y dejaba un «de» colgando. Ahora son tres líneas limpias.

> ⏳ **Pendiente: la imagen del banner.** El operador quiere una imagen de
> internet. No se puso ninguna: la fuente y la licencia las tiene que decidir
> él, porque el portal se comparte con un tercero.

**El tropiezo de Vite, otra vez.** Los cambios no se veían aunque el código
estaba bien. Es el mismo caso ya anotado más abajo: parar el servidor y borrar
`node_modules/.vite` y `.astro`. **Si algo no se refleja en pantalla, empieza
por ahí antes de tocar el CSS.**

### 2026-09-02 · el banner, el menú con relieve y la portada sin botones

Cuarto cambio del día. El operador: *«el título más grande, centrado… que se
vea 3D»*, *«esa barra de menú se puede mejorar, más 3D, que los iconos no se
vean tan muertos»*.

**El banner**

| | Antes | Ahora |
|---|---|---|
| Nombre | «Plan Chaumer» | **«Trading Plan de Futuros · NQ»**, también en la pestaña |
| Sitio | pegado a la izquierda | **centrado** en la cabecera, con el buscador a su izquierda |
| Tamaño | 15 px | 28 px, con el icono a 48 px |
| Relieve | plano | tres capas: degradado en el azulejo, sombra desplazada debajo, y el texto con luz de arriba abajo más una sombra oscura de 1 px |

**Lo de «una imagen del Nasdaq».** No se puso ninguna foto ni la marca Nasdaq:
es una marca registrada y el portal no tiene nada que ver con ellos, y una foto
de archivo de una sala de trading es justo lo que hace que una página parezca
de plantilla. En su lugar la cabecera lleva **una fila de velas azules y
blancas al 10 %**, desvanecida a los lados — el lenguaje del propio plan. **No
es una gráfica:** no representa ningún dato, así que no le aplica el estándar
de gráficas, que manda solo donde se dibuja mercado real. Si el operador quiere
una imagen de verdad, la tiene que dar él.

**El menú**

Cada icono deja de ser un glifo suelto y pasa a ser un objeto: azulejo teñido,
borde de luz arriba, sombra abajo, y se levanta al pasar el ratón. El activo se
enciende del todo.

**El tono avanza del cian al azul a lo largo de los ocho módulos.** No codifica
nada nuevo: acompaña al número, que ya dice el orden. Los dos colores salen del
estándar; no se inventó ninguno, y **no se usaron ni el rojo ni el oro**, que
están reservados.

**La portada**

Fuera los dos botones del titular. «Ver los casos reales» ya estaba abajo en
«Ver cómo se aplica», y «Empezar por el principio» en «Recorrer el método» —
donde además se explica a dónde llevan. El titular pasa de 48 a 58 px.

Sin botones y con el titular más grande, **el hero pasa a una sola columna**: a
dos columnas se partía en «La metodología / de / Alfredo Chaumer,» dejando un
«de» suelto. A todo el ancho son dos líneas limpias, y **el gráfico gana 1039 px
de ancho**, que era la otra queja de la primera auditoría: se lee de verdad.

**Dos cosas que se rompieron y se arreglaron por el camino**

| Qué | Por qué |
|---|---|
| La textura no se veía | iba con `z-index: -1`, o sea **por detrás del fondo** de la cabecera |
| En móvil con modo técnico la página **se desbordaba 24 px** | el buscador se partía en tres líneas y empujaba la marca fuera. Ahora la cabecera se apila: banner arriba, buscador debajo a todo el ancho |

**Comprobado:** banner centrado al píxel, sin desbordes a 375 ni 1440 con el
modo técnico encendido y apagado, contraste de los iconos del menú entre 4,49 y
7,99 *(el mínimo para un icono es 3)*, el titular en dos líneas a 1440 y tres a
375, y el alto de la cabecera propagándose solo al menú lateral.

> El detector avisa de «exceso de guiones largos» en `Marco.astro`. Es falso
> positivo: cuenta los de los comentarios del código, no los de ningún texto
> que vea nadie.

### 2026-09-02 · dos gráficos nuevos, y la lista de los que faltan

El operador pidió generar gráficos nuevos. Se ampliaron **13 → 15** conceptos.
`scripts/graficos_conceptos.py` sigue sin tocar `05_Backtesting`: solo importa
su motor.

| Nuevo | Dónde | Qué muestra |
|---|---|---|
| `14-traspaso.png` | Zonas · **Romper y confirmar** | la vela que pasa el borde y la que después pasa de su extremo. Mismo patrón que el número 4 pero **buscado en otra sesión**, para no repetir imagen dentro del mismo recorrido |
| `15-sesion.png` | Jornada · **Cómo avanza la sesión** | la ventana entera con el zigzag que une los extremos de cada tramo |

> ⚠️ **El 15 se dibujó primero con sus 44 zonas y quedó ilegible**: una mancha
> gris tapando las velas. Además el plan dice que en pantalla va **una sola
> zona por banda y por jornada**, no las 44 en crudo — y decidir cuál sobrevive
> en cada banda es metodología, no dibujo. Se dejó solo el zigzag, que es
> exactamente de lo que habla ese apartado.

**Estado: 15 apartados con imagen, 22 sin ella.** El triaje de esos 22:

**Grupo 1 — el motor los encuentra solo, se pueden generar cuando el operador dé el visto bueno**

| Apartado | Qué mostraría |
|---|---|
| Zonas · Varias zonas a la vez | una ventana con varias zonas vivas y la que manda en cada banda |
| Zonas · Cuándo deja de contar | una zona que caduca y deja de servir |
| Setups · Uno al lado del otro | IRI y Reingreso en dos paneles de la misma imagen |
| Filtros · Lo que cancela la orden | una orden en espera que se cancela antes de llenarse *(sirve también para «La orden esperando»)* |
| Dentro · Solo hay dos salidas | dos paneles: una operación al stop y otra al objetivo |

**Grupo 2 — hacen falta datos o una decisión del operador**

| Apartado | Qué falta |
|---|---|
| Premercado · El calendario | marcar la ventana de once minutos de una noticia roja. **Las horas de las noticias no están en los datos** |
| Premercado · Los dos gráficos | NQ y MNQ el mismo minuto con la diferencia de hasta 3 ticks. **No hay datos de MNQ**, solo de NQ |
| Jornada · Por dónde empieza el día | hay una regla que quitó el sesgo de dirección; qué enseñar sin contradecirla lo decide el operador |
| Filtros · Descartado no es vacío | tras un descarte la zona sigue contando. Hay varias formas de enseñarlo |

**Grupo 3 — no son gráfico, y ponerles uno sería decorar**

Cómo estoy hoy · La ATM · Solo hay dos · El registro · Antes de enviar · No
abrir el día · Las noticias *(filtros)* · No se toca nada · Al cerrar · Cuántas
veces · Con cuántos contratos · No hay regla de parada.

Son estado del operador, configuración de la plataforma, cuentas y
prohibiciones: nada de eso pasa en un gráfico de precio. Lo que sí admiten —la
ATM y el registro— son **capturas de la pantalla del operador**, y las tiene
que dar él.

### 2026-09-02 · un apartado por pantalla, con ruta numerada

**Tercer cambio del día, en los ocho módulos.** El operador: *«cuando doy clic
en Cómo estoy hoy, solo me salga lo de ese submódulo»*, y *«esa página está muy
muerta, parece de una funeraria»*.

**Un apartado a la vez.** Cada módulo deja de ser una página larga: se ve un
apartado y se pasa al siguiente. La ruta de arriba es ahora un recorrido
numerado con la línea que une las paradas — porque los apartados **están en el
orden en que se hacen las cosas**, no son pestañas intercambiables. La parada
hecha se marca con un visto, la actual va rellena y con halo.

**El pie encadena.** Dentro del módulo mueve de apartado; en el último, el
botón «siguiente» pasa a ser **el módulo siguiente**, en azul. Los ocho módulos
y sus 37 apartados se recorren enteros sin volver nunca al menú.

**Sin JavaScript** se ven todos los apartados seguidos, como antes: el HTML
lleva el contenido completo y ocultar es cosa del navegador.

**Lo visual**

| Qué | Antes | Ahora |
|---|---|---|
| Gráficos | imagen suelta con un filete de 1 px | pieza de cristal con halo azul y el pie dentro del mismo marco |
| Avisos y prohibiciones | barra de color de 2 px a la izquierda | **icono**, panel teñido y borde entero. Esa barra es la marca de fábrica de las interfaces generadas — el detector la señala en otras páginas — y además el color iba solo |
| Tarjetas | superficie plana | cristal con brillo y sombra |
| Cabecera del módulo | número suelto | icono del módulo en azulejo + «02 de 08» |

**Imágenes que faltaban**

| Dónde | Qué |
|---|---|
| Marcación de zonas · «Cuando no se confirma» | `05-sin-confirmar.png` **estaba generado y sin usar en ninguna página**. Es el otro desenlace del apartado: la vela cruza, ninguna la supera, la zona sigue viva |
| Riesgo y tamaño · «Cuánto se arriesga» | era **el único módulo sin una sola imagen**. Ahora lleva el gráfico de la distancia al stop repetida al otro lado, y el del setup descartado por pasarse del tope |

Los dos gráficos de riesgo **ya existían y ya estaban en el portal**: aquí
ilustran el tope, en su módulo ilustraban la mecánica y el filtro. Ninguno es
nuevo y ninguno dice nada que no dijera ya.

> 🔵 **Sigue faltando material gráfico.** Hay 13 gráficos de concepto y los 21
> casos de la galería, pero **10 de esos 21 no siguen el estándar visual** que
> el operador validó, así que no se pueden meter en los módulos tal cual.
> Generar gráficos nuevos es posible —**Python ya está instalado en el equipo**,
> al contrario de lo que decía `CLAUDE.md` el 01/09— pero elegir qué sesión real
> ilustra qué concepto es una decisión de metodología: la toma el operador.

**Un rato perdido que conviene no repetir:** la ruta salía sin estilos, como una
lista numerada suelta. No era el CSS: **Vite servía al navegador una versión
vieja del módulo** mientras el HTML llevaba la nueva. Se arregla parando el
servidor y borrando `node_modules/.vite` y `.astro`.

**Comprobado:** un apartado visible a la vez en los ocho módulos, la ruta
marcando hechas y actual, el contador, el pie encadenando dentro del módulo y
saltando al siguiente en la última parada, el botón «atrás» del navegador, sin
desbordes a 375 ni 1440, y el HTML sirviendo los apartados sin ocultar para
quien no tenga JavaScript. Detector limpio en `Modulo.astro`.

### 2026-09-02 · arriba, los apartados del módulo — no otra vez el menú

**Segundo cambio del día, en los ocho módulos a la vez.**

Arriba de cada módulo estaban **otra vez los ocho módulos**, que ya están en el
menú de la izquierda. Y los apartados del módulo vivían en **una columna a la
derecha que desaparecía por debajo de 1200 px**. Resultado: en pantallas
normales no había forma de saltar de apartado a apartado y tocaba bajar a mano.

Ahora arriba van **los apartados de ese módulo**, en una barra que **se queda
pegada** al hacer scroll, y la columna de la derecha se ha quitado — el
contenido gana todo ese ancho.

| Ancho | Cómo se comporta la barra |
|---|---|
| 1440 | los seis apartados del módulo más largo caben en una línea |
| 1000 | se parte en dos líneas; **ninguno queda escondido** |
| 375 | una sola línea que se desliza, con el icono del módulo delante, y el apartado activo se trae solo a la vista |

El nombre del módulo solo sale en la barra **por debajo de 900 px**: por encima,
el menú de la izquierda también queda pegado y ya marca el módulo activo.

**Lo que no se pierde al quitar la barra de los ocho:** la cabecera de cada
módulo ahora dice **«03 de 08»**, y el pie sigue llevando al anterior y al
siguiente.

**Dos detalles que costaron su rato:**

- El apartado marcado iba **uno por detrás** del que se estaba leyendo. Era
  «el primero que se ve»; tenía que ser **«el último cuyo título ya pasó por
  debajo de la barra»**. Los apartados son largos y dos se ven a la vez.
- Al **pulsar** un apartado se marcaba el anterior **por un píxel**: el título
  aterrizaba en 141 px y el corte estaba en 140. Ahora el corte lleva holgura.

**De paso:** `--alto-cabecera` estaba escrito a mano como 3,75 rem cuando la
cabecera mide 69 px, así que el menú lateral se metía 9 px por debajo al hacer
scroll. Ahora se calcula solo desde el relleno y el nuevo `--alto-control`
(44 px, el objetivo táctil), que además retira seis valores sueltos.

**Comprobado:** los ocho módulos con su barra, todos los enlaces apuntando a un
apartado que existe, marcado correcto al pulsar y al hacer scroll libre en seis
posiciones, sin desbordes a 375 / 1000 / 1440, contraste de 5,69 y 11,29, y
chips de 40 px en móvil. El detector no encuentra nada en `Modulo.astro`.

### 2026-09-02 · la portada, revisada — y el portal partido en dos

**Primera tanda de la revisión por partes.** Se auditó la portada con dos
análisis independientes: uno de diseño y otro de medición en el navegador.
Puntuación de partida: **20 sobre 36**.

**Lo que decidió el operador**

El portal pasa a tener **dos portadas**:

| | La de Alfredo (`/`) | La técnica (`/tecnico`) |
|---|---|---|
| Menú | inicio, los ocho módulos, casos reales, observaciones | todo lo anterior + «Todo el detalle» |
| Buscador | **no existe**, ni con `Ctrl+K` | sí |
| Vocabulario, parámetros, las 38 fichas, checklist, pendientes, contextualización, acta de cierre | no | sí |
| «Plan no probado» y los cuatro huecos | no | **sí, enteros** |

Se entra a la técnica por un **icono pequeño y apagado al pie del menú**, que
de paso enciende el modo técnico.

> 🔴 **Cambio de una regla escrita.** `CLAUDE.md` decía que los huecos
> declarados los muestra *el portal*. Ahora los muestra la portada técnica.
> Razón del operador: lo que no está probado es **la transcripción del método,
> no el método de Alfredo**. Queda anotado en `CLAUDE.md`.

**Cambios de la portada**

| | |
|---|---|
| Marca | «Plan Chaumer · NQ, MNQ, NinjaTrader 8» pasa a **«Trading Plan Nasdaq»** con icono propio y favicon. El icono es el **zigzag de corrida y retroceso**: sale del vocabulario del método, no de un catálogo |
| Fuera de la portada | la píldora «Escrito y contrastado. No probado.», el «NO PROBADO» de la cabecera, los contadores 38/11/23, la frase «Portal de revisión…», el bloque «Antes de juzgarlo» y el buscador |
| Subtítulo | ahora: «traducido a reglas que se pueden **medir, seguir y operar**» |
| Menú | **icono por elemento**, «Inicio» arriba con su casita, el número del módulo pasa detrás. Vocabulario se va a la parte técnica |
| Pie | «© Christian Buitrago · kristeb@hotmail.com» y «Versión 1.0» |

**Defectos corregidos de paso** *(los encontró la auditoría, no estaban en la lista)*

| Qué | Por qué importaba |
|---|---|
| El menú perdía los nombres en el móvil | a 375 px las once etiquetas medían **0 px**: quedaba «01 02 03…» sin un solo nombre |
| El marco de foco del botón azul era **azul sobre azul** | invisible en el botón más importante. Ahora se pinta en claro |
| El sello de versión salía **dos veces** | uno debajo del otro al final de la página |
| El gráfico del hero iba **girado en 3D y al 25 %** | ilegible, y contra el estándar de gráficas que el operador validó: «cuanto más limpio, mejor». Ahora va de frente |
| El titular partía **«Alfredo / Chaumer»** entre dos líneas | el nombre del cliente roto dentro de su propio titular |
| El degradado partía «ex» blanco y «plicada.» azul | ahora el énfasis es de color sólido |
| La portada rompía a 1000 px y el marco a 900 | entre esos dos anchos la página se veía rota. Un solo punto de ruptura: **900** |
| Colores escritos a mano | `#06121F`, `#6AA0FF` y una copia literal de un token que ya existía. Ahora son tokens |

**Comprobado, no supuesto:** contraste de cada texto sobre su fondo real (todo
por encima del mínimo), sin desbordamiento horizontal a 375, 900 ni 1440,
objetivos táctiles de 44 px, un solo `h1` sin saltos de nivel, y que con el
modo técnico apagado **el buscador no existe ni con `Ctrl+K`**. Detector de
anti-patrones: cero hallazgos en los archivos tocados.

> ⚠️ **Excepción consciente:** el icono de la puerta técnica queda por debajo
> del contraste normal (2,6:1). Es lo que el operador pidió — «muy pequeño,
> escondido» — y se aclara al pasar por encima o al tabular.


### 2026-08-31 · la decisión que define el portal

El operador redefine qué es el portal: **no es una herramienta de operación**,
es donde Alfredo revisa y deja observaciones. Dos puntos del encargo original
quedan derogados: deja de ser cien por cien estático *(las observaciones
necesitan guardarse)* y se publica ya.

### 2026-09-01 · todo lo demás

Una sola jornada de trabajo, 28 commits.

| Bloque | Qué pasó |
|---|---|
| **Arranque** | se restauran las tildes de `reglas.json` (168 textos). Se dejan sin tildes `categoria` e `id` a propósito: el portal filtra por ellos |
| **Repositorio** | se detecta que **estaba público**. El operador lo pone privado antes de subir nada |
| **Diseño** | seis iteraciones. El operador rechaza cuatro por «muy simple, muy plana» y pide expresamente estética moderna, ignorando las prohibiciones del brief. Se instalan tres skills de diseño y se rehace |
| **Contenido** | las 38 fichas de regla, parámetros, vocabulario, los 21 casos, checklist, pendientes, contextualización y acta de cierre |
| **Publicación** | Cloudflare Pages + D1. Se descarta Supabase. Dirección elegida por el operador: `plan-operativo-nq` |
| **Entrada libre** | se retira la puerta: Alfredo entra solo con la dirección |
| **Simplificación** | el operador: *«está súper largo y muy técnico, no quiero ver nada de si supera la R-xx»*. Se separan dos capas: una de entendimiento sin un solo código, y el detalle completo detrás del modo técnico. Los documentos de `01_Plan\` **no se tocan** — son la base del futuro bot |
| **Portada** | se cambia el redirigir al inicio por una portada de bienvenida |
| **Ocho módulos** | la explicación pasa de una sola página larga a ocho módulos navegables, en el orden real de la jornada |

### Errores encontrados y corregidos

Se dejan escritos porque cuestan tiempo si se repiten.

| Qué | Cómo se vio |
|---|---|
| **La página se veía partida por la mitad** con el modo técnico encendido | el botón del rail y la clase que enciende el modo se llamaban igual, y el estilo del botón caía sobre la página entera. **Lo encontró el operador** |
| **Un reingreso de ejemplo que no se habría operado** | el precio continuaba 140 puntos antes de darse la vuelta: el stop no cabía en el tope. Se ató la búsqueda al tope de riesgo |
| **El generador de gráficos abría la ventana una vela antes** | las velas van marcadas **al cierre**, así que la de la apertura es la `1331`, no la `1330`. Se ve en el volumen: 641 contratos y de golpe 4.333. `lector.py` ya lo hacía bien; el fallo era solo del generador |
| Un gráfico con el stop en 105,75 puntos | por encima del tope: ese setup no se opera. Se rehízo con uno dentro del tope |
| «REABIERTO Y VUELTO A CERRAR» contaba como abierto | faltaban límites de palabra en la búsqueda. 17 pendientes abiertos pasaron a ser 16 |

---

