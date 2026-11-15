# Rediseño visual «Cristal» y navegación nueva

**Versión:** v1.3 · **Estado:** ✅ APROBADO por Kris (15/11/2026; la maqueta 8 y la isla, el 16/11) · Fase 0 hecha (16/11); sigue la fase 1.
**Copia de seguridad del diseño anterior:** etiqueta de git `diseno-anterior-2026-11-13` (commit `a5feff0`), subida a GitHub.
**Maqueta de referencia:** `design-mockups/mockup-8.html` (en lo visual manda la maqueta sobre este texto).
**Alcance:** solo aspecto y navegación. No cambia datos, cálculos ni base de datos. Lo que no es visual queda para
la fase «back» (§9).

---

## 1 · De dónde sale (12–13/11/2026)

Kris pidió rediseñar el Journal: se veía anticuado y «muy simple». Se le enseñaron cinco direcciones
(maquetas 1 a 5, borradas el 13/11): descartó cuatro y de la 1 dijo que era igual a lo que ya tiene. Trajo como
referencia el perfil de Instagram **code.xr** (reel «Admin Dashboard V7» y otros cinco): cristal esmerilado sobre un
fondo verde bosque con un resplandor ámbar. De ahí salieron la maqueta 6 (el aspecto) y la 7 (el aspecto más la
navegación), que es la aprobada como guía. Solo se conserva la 7.

El análisis del chat «Navegación principal» (10/11) ya había diagnosticado por qué se ve anticuado: sin profundidad
(fondo y tarjetas son dos grises casi iguales), tipografía del sistema sin escala (83 tamaños de letra, 33 radios y
38 sombras distintos), sin movimiento, y todo con el mismo peso. Este diseño responde a esos cuatro puntos.

## 2 · Decisiones de Kris

| # | Decisión | Cuándo |
|---|---|---|
| 1 | **Cristal claro y cristal oscuro, los dos**, con un botón para cambiar. Se recuerda en el dispositivo | 13/11 | |
| 2 | **Escritorio: barra lateral con todas las pantallas a la vista**, por grupos, y plegable a iconos | 13/11 | |
| 3 | **Celular: barra de abajo con muesca central y botón flotante «+»** (registrar la sesión), solo iconos, el activo en verde con una raya que se desliza | 13/11 | |
| 4 | **La meta del mes no es dinero: es cumplir las reglas al máximo.** El medidor enseña la disciplina del mes; la meta es el 100 % | 13/11 | |
| 5 | **El buscador encuentra un día, un setup, un error o una observación** | 13/11 | |
| 6 | **Primero todo lo visual; después, en otra fase, la revisión del «back»** | 13/11 | |
| 7 | **De los dos temas, el que más le gusta es el oscuro**: es el que se abre por defecto | 15/11 | |
| 8 | **La barra del celular: translúcida, con efectos e iconos propios** (§4) | 15/11 |
| 9 | **Antes de tocar nada, copia de seguridad del diseño anterior** (hecha: la etiqueta de arriba) | 15/11 |

## 2b · Qué es «moderno» para Kris — la vara con la que se mide cada fase

Kris (15/11): *«interactiva y dinámica, envolvente, fluida y sobre todo vanguardista, de última generación»*. Los
colores de la maqueta le gustan; lo que quiere **ver en la app** es esto, y no vale con que la maqueta lo tenga:

| Palabra de Kris | En la app significa |
|---|---|
| **Interactiva y dinámica** | Todo lo que se toca responde al instante (menos de 0,1 s): onda, escala, y vibración corta en el celular. El menú cambia antes de que llegue la pantalla. Las cifras cuentan, las barras crecen, el medidor gira |
| **Envolvente** | Profundidad en capas: fondo vivo y fijo, cristal encima, luz que sigue a lo activo. Nada aparece de golpe: entra, se desliza o crece. Un día se abre desde su casilla y vuelve a ella. Mientras carga, esqueletos con brillo, no una pantalla vacía |
| **Fluida, sin trabas** | Condición, no adorno: solo se anima posición y opacidad; 60 imágenes por segundo en el celular de Kris. **Una animación que trabe se quita.** Con «reducir movimiento» del sistema, nada se anima |
| **Vanguardista** | Transiciones entre pantallas del navegador (View Transitions) donde existan, cristal real, iconos propios, tipografía con escala. Se revisa contra referencias actuales, no contra la app de antes |

**Al final de cada fase hay una revisión de esto**: Kris la prueba en su celular antes de pasar a la siguiente, y
si una pantalla se queda en «bonita pero quieta», se rehace. Él mismo lo pidió: *«si hay que hacer otra revisión,
lo volvemos a hacer»*.

### Revisión del 15/11: ¿la maqueta 7 cumplía los cuatro puntos?

Kris pidió revisarlo antes de empezar. No los cumplía, y se reestructuró en la **maqueta 8**:

| Punto | Maqueta 7 | Qué se cambió en la 8 |
|---|---|---|
| **Vanguardista** (el pilar) | A medias: cristal y una pantalla bien compuesta, pero quieta. Nada que no hiciera un panel de 2022 | Fondo vivo · luz que sigue al cursor · tarjetas que se inclinan · el día sale de su casilla y vuelve a ella (transición del navegador, View Transitions) · «isla» con el estado en vivo · esqueletos con brillo |
| **Interactiva y dinámica** | A medias: contadores, filtros y buscador; las gráficas se redibujaban enteras | Recorrer la curva cambia la cifra grande · USD/Puntos se anima en vez de redibujar · el día se pasa al anterior y al siguiente · la hoja del celular se cierra arrastrándola |
| **Envolvente** | No: fondo fijo, sin profundidad real | Tres luces que derivan despacio y se desplazan con el cursor, con grano fino · **el fondo acompaña el resultado**: ámbar si el tramo va a favor, rojo si va en contra · cada pieza entra al llegar a la pantalla, no todas a la vez |
| **Fluida** | **No.** Medido con celular lento simulado (CPU ×4): **15 imágenes por segundo al cambiar de pantalla**, con un tirón de 333 ms, y 14 capas de desenfoque a la vista | **62 imágenes por segundo** al cambiar de pantalla y 113 al bajar, con **1 capa de desenfoque**. Cómo: el desenfoque queda solo en lo que flota sobre contenido (la barra del celular, hojas); barras y medidor se mueven, no cambian de tamaño; las gráficas pesadas esperan a que la pantalla haya entrado |

La medición es en un navegador sin pantalla: sirve para comparar las dos maquetas, no como cifra del celular de
Kris. La medida de verdad se toma en su celular al final de la fase 1.

## 3 · Lenguaje visual

- **Fondo:** fijo, verde bosque casi negro con tres luces (verde arriba a la izquierda, azul verdoso al centro, ámbar a
  la derecha). Es el mismo en los dos temas.
- **Fondo vivo:** tres luces grandes (verde, ámbar, azul verdoso) que derivan muy despacio y se desplazan un poco con
  el cursor, con un grano fino encima. La luz ámbar pasa a roja cuando lo que se mira va en contra.
- **Cristal:** translúcido con un filo claro arriba. **El desenfoque de verdad solo va en lo que flota sobre
  contenido que se mueve** (la barra del celular y las hojas): el fondo ya es difuso, así que el resto no lo necesita
  y la app va fluida.
- **Luz:** en cada tarjeta, un foco suave sigue al cursor; los indicadores se inclinan hacia él.
- **Tarjetas:** en claro, cristal lechoso con tinta oscura; en oscuro, cristal ahumado con tinta clara. Radio 24;
  las piezas de dentro («tiles»), radio 14; botones y etiquetas, píldora.
- **Color con significado:** verde = a favor, rojo = en contra, ámbar = pendiente o aviso, azul = informativo. Cada
  uno sigue teniendo su valor de fondo y su valor de texto, y ahora uno por tema. **El token, nunca el hex**, igual
  que hoy.
- **Tipografía:** Manrope, con una sola escala (11 · 12,5 · 13,5 · 15 · 17 · 30 · 60) y números tabulares.
- **Jerarquía:** en cada pantalla hay un dato que manda (en Calendario, el P&L del mes y su curva) y lo demás es más
  pequeño.
- **Movimiento:** cada pantalla entra desenfocada y se asienta (0,8 s, escalonado); la opción activa del menú se
  desliza; barras, medidor y cifras crecen al entrar. Con «reducir movimiento» del sistema, nada se anima.
- **Botón principal:** píldora negra (blanca en oscuro). Uno por pantalla.

Los tokens de `css/styles.css` (`:root`) se redefinen con estos valores y se añade el bloque del tema oscuro. Los
44 literales de color y las dos estéticas que hoy conviven (`.claude/rules/estilos.md`, «Deuda») se cierran al
migrar cada pantalla: este rediseño **es** esa migración.

## 4 · Navegación

| Dónde | Cómo queda |
|---|---|
| **Escritorio** | Barra lateral flotante con cuatro grupos: Operativa (Calendario, Análisis, Sesión), Seguimiento (Disciplina, Apex, Comparador), Consultar (Trades, Imágenes, Experimentos, Chaumer, Backtesting), Configurar (Estrategia, Datos, Fechas). Se pliega a una tira de iconos con el nombre al pasar el cursor; recuerda cómo se dejó. Ya no hace falta la flecha de volver |
| **Celular** | Barra de cristal **translúcido** con muesca: Calendario · Análisis · **+** · Sesión · Otros. Iconos propios (trazo fino; el activo se rellena, brilla y da un salto). Una luz y una raya se deslizan hasta el activo, un barrido de brillo cruza la barra al cambiar, cada toque deja una onda y vibra, el «+» late con un halo, y al bajar por la pantalla la barra se recoge un poco. «Otros» no es una pantalla: sube una hoja con sus accesos. La cabecera lleva el avatar y tres botones redondos (buscar, tema, avisos) |
| **Buscador** | Ctrl K o la lupa. Va a cualquier pantalla y busca en días, setups, errores y observaciones |
| **Entre pantallas** | El menú cambia al instante; la pantalla que sale se desvanece y la que entra llega pieza a pieza |
| **Un día** | Sale de su casilla del calendario y se agranda hasta ser su ficha; desde ahí se pasa al anterior o al siguiente, y al cerrar vuelve a su casilla. Es la puerta al visor del día de hoy |
| **La isla** | Al bajar por una pantalla aparece arriba una píldora con lo esencial (mes, P&L, disciplina). Al tocarla se abre con el estado en vivo: el bot, el motor y los pasos del día |

La lista de pantallas sigue saliendo de **`Otros.ITEMS`** y `Nav.PADRE`: la barra lateral y la hoja del celular se
generan de ahí, así que una sección nueva se sigue dando de alta en un solo sitio. El invariante de `CLAUDE.md`
(«4 botones») se reescribe al implementar la fase 1: en el celular siguen siendo cuatro, más el botón central.

## 5 · La pantalla principal (Calendario)

De arriba abajo, como en la maqueta: saludo con el resumen del mes en una frase · tarjeta del P&L con la curva de
capital (USD / puntos) y cuatro cifras · **medidor de la meta del mes (disciplina)** · cuatro indicadores con mini
barras · calendario con el total de cada semana · últimas operaciones.

El medidor usa la medida de disciplina que ya existe (`resumenDisciplina`, `js/db.js`): no se inventa un cálculo.

**Pendiente, como guía si en el celular resulta incómoda (Kris, 13/11: «por ahora la dejamos todas»).** En el
celular es larga (unas 4,5 pantallas) y el calendario llega en la tercera. Si hay que reordenar, solo en el celular:

1. Saludo y P&L del mes con su curva (sin las cuatro cifras de abajo).
2. Calendario del mes.
3. Esta semana.
4. Meta del mes, compacta: el medidor más pequeño, con el porcentaje al lado.
5. Los cuatro indicadores en una fila que se desliza de lado.
6. Lo que destaca.
7. Últimas operaciones.

## 5b · Análisis: el consolidado

Kris (13/11): Análisis es el consolidado y tiene que seguir enseñando todo lo de hoy. De arriba abajo:

1. **Período** Mes · Trimestre · Año, con flechas (como hoy), y debajo **etiquetas** que filtran TODA la pantalla
   (Todas, Continuación, Reingreso, Largos, Cortos), cada una con su número de trades.
2. **Seis indicadores** (los de hoy): P&L neto, win rate, rentabilidad, disciplina, consistencia, trades.
3. **Curva de equity** a todo el ancho, con el drawdown máximo.
4. **Resumen por semana del mes / por mes del trimestre / por mes del año**: la misma tabla de hoy (P&L, acumulado,
   rentabilidad, efectividad, disciplina, trades, estado) con el total abajo. En el celular se desliza de lado.
5. **P&L por semana / por mes** y **distribución de resultados** (targets frente a stops, target y stop medios).
6. **Nuevo — «Dónde ganas y dónde no»:** por setup, por franja horaria y por día de la semana.
7. Exportar a PDF e imagen, al final, como hoy.

## 6 · Piezas nuevas

**Aprobadas por Kris (13/11/2026): «Lo que destaca», «Esta semana» y el día por pasos.** Van en escritorio y en
celular (en el celular, una debajo de otra). La variación de cada indicador sigue abierta.

| Pieza | Qué es | Coste |
|---|---|---|
| **«Lo que destaca»** | Mejor día, mejor setup, mejor franja horaria, setup a vigilar. Se calcula con lo que ya se carga | Pequeño |
| **«Esta semana»** | Una columna por día con su resultado | Pequeño |
| **El día por pasos** (en Sesión) | Niveles → Noticias → Operación → Diario → Coach, con el pendiente resaltado | Mediano: hay que leer el estado de cada paso |
| **Variación de cada indicador** («+6 pts») | Contra el mes anterior | Pequeño, si se aprueba contra qué se compara |
| **La isla con el estado en vivo** (maqueta 8; **aprobada por Kris el 16/11**) | Bot armado o no, qué marcó el motor, pasos del día | Mediano: lee `bot_operaciones` y `motor_estado` de hoy |

## 7 · Riesgos

1. **El cristal pesa en el celular.** Resuelto en el diseño desde la maqueta 8 (§2b): tarjetas con color translúcido
   y desenfoque solo en lo que flota. Aun así se mide en la fase 1 en el celular de Kris; si el fondo vivo trabara,
   se deja quieto en el celular.
2. **Legibilidad.** Texto sobre cristal: se comprueba el contraste en los dos temas, sobre todo los grises secundarios.
3. **Estado intermedio.** Mientras dure la migración conviven pantallas nuevas y viejas. Por eso la fase 1 restila
   también las piezas compartidas (tarjeta, botón, campo, etiqueta): con eso el interior de casi todas las pantallas
   cambia de golpe y ninguna queda rota.
4. **Gráficas.** Chart.js toma sus colores de los tokens al pintarse; al cambiar de tema se repintan.
5. **Lo que va por encima** (visor del día, las 3 gráficas, Lightbox): conservan su fondo oscuro; solo cambian sus
   placas y botones.

## 8 · Fases

Cada fase termina con la app usable, verificada en el preview (escritorio y celular, los dos temas), con su
checkpoint en el historial, commit y push, **y con la revisión de §2b**.

**Dónde se trabaja:** en la rama `rediseno-cristal`. Producción (`main`) sigue con el diseño de siempre hasta que
Kris dé por bueno el marco y el Calendario. Para que pueda probarlo en su celular con sus datos, la rama se publica
en una dirección aparte del mismo sitio (`…/trading-journal/nuevo/`); se monta en la fase 0.

**Al fundir la rama en `main`** (cuando Kris dé por bueno el rediseño) hay que deshacer lo que solo sirve a la
versión de prueba: en `publicar-journal.yml`, los dos pasos de `/nuevo/`; borrar `.github/workflows/avisar-nuevo.yml`;
en `sw.js`, el nombre de la caché (`nqjournal-vN`) y el filtro de `activate`; en `manifest.json`, el nombre y el
`scope`; y la banda «DISEÑO NUEVO · EN PRUEBAS» (`html[data-nuevo]` en `styles.css` y su línea en `index.html`).

| Fase | Qué | Notas | Estado |
|---|---|---|---|
| 0 | **Preparación:** la rama y su dirección de prueba (`/nuevo/`), tokens nuevos (claro y oscuro), Manrope, fondo. Añadir `js/visor.js` a `APP_SHELL` de `sw.js` (falta desde el 03/11) | Sin cambio visible salvo el fondo | ✅ 16/11 |
| 1 | **El marco:** barra lateral plegable, barra de arriba, botón de tema, barra del celular con muesca, «Otros» en hoja, transición entre pantallas, y las piezas compartidas (tarjeta, botón, campo, etiqueta) | Aquí se mide el rendimiento en el celular | |
| 2 | **Calendario** completo según la maqueta, con el medidor de la meta | Lo abierto de §6 que Kris apruebe | |
| 3 | **Análisis y Disciplina** | Etiquetas de filtro con contador | |
| 4 | **Sesión** (Diario, Coach, Días anteriores) | Usa el ancho en escritorio (hoy deja el 40 % vacío) | |
| 5 | **El resto:** Trades, Imágenes, Apex (las cuentas quemadas, agrupadas), Comparador, Chaumer, Backtesting, Experimentos, Estrategia, Datos, Fechas, el visor del día, el login, y los 11 avisos nativos del navegador («¿Eliminar?») como diálogos de cristal | En el calendario del celular, el número del día en cada casilla | |
| 6 | **Buscador** (días, setups, errores, observaciones) | Función nueva: lee lo que ya se carga | |
| 7 | **Cierre:** borrar el CSS que ya no se usa, actualizar `.claude/rules/estilos.md` y `CLAUDE.md`, decidir si la maqueta 7 se queda en el repositorio | | |

## 9 · Fuera de este diseño: la fase «back»

Del análisis del chat «Navegación principal» (10/11/2026). No se toca hasta cerrar lo visual.

- **Bot:** aviso por Telegram si no está armado a su hora y cuando entra o sale · investigar por qué se recarga el
  gráfico tras la primera vela (desde el 23/10) · proteger la posición si el stop o el objetivo son rechazados · quitar
  Sim101 de la lista blanca · reintentar si Supabase rechaza un trade.
- **Velocidad:** la fuente de iconos pesa 865 KB para 112 iconos · las librerías de PDF se cargan siempre y solo las
  usa un botón · las 14 pantallas se cargan a la vez.
- **Código repetido:** la función de escapar texto (17 copias), los formatos de puntos y break-even, 9 funciones de
  base de datos sin uso, ~368 clases de CSS sin uso (estas caen en la fase 7).
- **Base de datos y seguridad:** 10 tablas `_bak_` · la clave de Claude vive en cada navegador (puede guardarla el
  Worker) · 2 funciones que se pueden llamar sin sesión · un índice duplicado.
- **Sueltos:** Ajustes aún pide «Límite de pérdida diario» (obsoleto) · Disciplina en un mes sin días no ofrece ir al
  último mes con datos.

Ya hecho de esa lista: Disciplina y Apex en Otros (10/11) y el secreto del aviso de Telegram fuera del repositorio
(10/11).
