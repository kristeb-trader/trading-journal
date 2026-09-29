# Trading Journal NQ Futures — Historial del proyecto

**Última actualización:** 2026-09-29

> **Qué es este archivo:** la narrativa de qué pasó y cuándo, del más reciente al más antiguo. Para el
> estado actual, `CLAUDE.md`. Para el **porqué** de una decisión, `docs/decisiones.md`. Para lo que falta,
> `tasks/current.md`.
>
> Lo anterior al 16/08/2026 —la foto del sistema de mayo, las fases 1–22 y los checkpoints de junio al
> 11/08— está en `docs/archivo/historial-hasta-2026-08-15.md`.

| Fecha | Checkpoint |
|---|---|
| 2026-09-29b | La raíz en orden: el historial, partido en el 16/08 |
| 2026-09-29 | Sesiones en vez de test ciego, dos carpetas de backtesting, y `chaumer/` en orden |
| 2026-09-28 | Las reglas de Chaumer, cerradas: se pasa al backtesting |
| 2026-09-25c | Cowork deja de existir: el plan se trabaja desde Claude Code |
| 2026-09-25b | Fase 8: el portal suelta R2, y la unificación termina |
| 2026-09-25 | Fase 7: la cadena diaria |
| 2026-09-24b | Fase 6: el Coach con el plan de Chaumer y Claude Opus 5.5 |
| 2026-09-24 | Unificación Chaumer: fases 1–3 y el repositorio público |
| 2026-09-23 | Curva de equity verde/roja y tooltip del día |
| 2026-09-19 | El journal: una sola cuenta, regularizado a ±$160 |
| 2026-09-18 | Dos setups: Continuación y Reingreso |
| 2026-09-17 | Chaumer: la lista día a día y la hora Colombia |
| 2026-09-14 | Apex-15 renovada: dos tarjetas con el mismo número |
| 2026-08-31b | Motivos sin cubrir, FOMC del desglose y P&L de la celda |
| 2026-08-31 | El checklist dejó de marcarse solo · zonas naranjas al AddOn · RR en puntos |
| 2026-08-23 | Tarjetas KPI y curva de equity del Calendario |
| 2026-08-19 | Otros y Datos rediseñados, modo local, y el comparador de Chaumer |
| 2026-08-18 | Trades fantasma: el replay de ejecuciones de NinjaTrader |
| 2026-08-16d | Cuenta Apex-15, formato de importes y vista del día |
| 2026-08-16c | Navegación: 6 botones y la pantalla "Otros" |
| 2026-08-16b | Reestructuración documental |
| 2026-08-16 | Sesión Operativa: tres pantallas en una |

---

## Checkpoint 2026-09-29b — La raíz en orden: el historial, partido en el 16/08

**Qué se cerró** (diseño `2026-09-29-orden-raiz.md`, el criterio de D-030 fuera de `chaumer/`):

- **El historial, partido.** Lo anterior al 16/08 —la foto del sistema de mayo (Coach con Sonnet 4.6, «repositorio
  privado», el esquema de mayo), las fases 1–22 y los checkpoints hasta el 11/08— pasa a
  `docs/archivo/historial-hasta-2026-08-15.md`. Este archivo baja de 169 KB a 61 KB, del más reciente al más
  antiguo, con un índice que lista todos sus checkpoints (dos renombrados con sufijo: `2026-08-31b`, `2026-09-24b`;
  el de «Ago 2026 (3)» es `2026-08-06`, ya en el archivo).
- **La raíz:** `README.md` reescrito (decía «repositorio privado»); `desktop.ini` e `icons/TJ.ico` fuera de git,
  en disco; `create-icons.html` borrado; `Otros/` a `docs/archivo/inicio-journal/`, en disco y fuera de git.
- **Scripts:** borrados `TelegramBot/deploy.bat` y los tres `comparar-*.py` del 26/09; `medir-tokens.js` a
  `scripts/herramientas/`; el prompt de la reestructuración de agosto, al archivo.
- **Cifras al día:** el índice de migraciones (86 archivos), el mapa del código del `CLAUDE.md` y el backlog.

**Verificado:** ninguna línea del historial se pierde (comprobado línea a línea contra el original); ninguna ruta
viva apunta a un archivo movido o borrado; lo que sale de git, ignorado **antes** de moverlo; el Journal publicado
sigue sirviendo la app y los iconos, y `TJ.ico` ya da 404; `medir-tokens.js` corre desde su sitio nuevo.

---

## Checkpoint 2026-09-29 — Sesiones en vez de test ciego, dos carpetas de backtesting, y `chaumer/` en orden

**Qué se cerró** (diseños `2026-09-28-sesiones-y-carpetas.md` y `2026-09-28-orden-chaumer.md`; D-029 y D-030):

- **Sesiones.** «Test ciego» y «Sesiones de julio» son una sola cosa: una pestaña en el portal, con la misma
  tarjeta (fecha, gráfico, resultado con sus puntos, setup). Plan 3.34: el término sale del plan; `P-29` sigue
  abierto como «las sesiones de validación». Los 21 gráficos de julio y septiembre, redibujados con el motor de hoy:
  21 de 21 iguales a las tablas del plan.
- **`05_Backtesting/` = `kris/` + `claude/`** (sesiones, `protocolo/`, `motor/` con los datos). El motor dibuja el
  gráfico del día ahí, y **lo publica solo si el día ya está registrado** (el candado del motor); no sube nada si
  GitHub va por delante o hay commits locales sin subir.
- **`chaumer/` en orden:** 6 documentos y `_Historia/` al archivo (con un `LEEME` de en qué miente cada uno),
  `DESPLIEGUE` reescrito, 53 archivos borrados que no usaba nadie, y una regla: en `chaumer/` no nacen documentos.
  Plan 3.35: dos rutas al día.
- **`CLAUDE.md` de la raíz, de 237 a 167 líneas (17,3 → 12,0 KB)**: invariantes en una línea con su puntero,
  la sección `chaumer/` reducida a lo transversal (el resto lo carga `chaumer/CLAUDE.md`), la tabla de datos sin la
  historia de cada fila. Corregidas dos cosas que mentían: las cifras de la deuda visual (contradecían a
  `estilos.md`) y la fila de la metodología, que apuntaba al rulebook de la etapa 1.

**Verificado:** la regresión del motor antes y después de la mudanza (48 de 48); `npm run verificar` sin fallos
tras cada fase; los documentos del Coach, con su huella sha256 comprobada en la BD; la publicación automática,
contra un repositorio de prueba.

**Pendiente:** la primera publicación automática lanzada por NinjaTrader (29/09, 10:32) y recompilar
`CadenaDiaria` en NT8 — `tasks/current.md`.

---

## Checkpoint 2026-09-28 — Las reglas de Chaumer, cerradas: se pasa al backtesting

Diseño: `docs/disenos/2026-09-25-reglas-chaumer.md` (v1.6). **La reestructuración está terminada:** las reglas
viven en siete archivos por grupo con una plantilla fija, `reglas.json` se genera y el vigilante pasa en modo
estricto. Cinco fases: F0 (el «Por qué» entero en el portal) · F1 (correcciones) · F2 (los siete archivos y
sus consumidores) · F3 (fusiones, 40 → 35) · F4 (la ficha nueva del portal). Después, con Kris uno a uno, los
pendientes de método (planes 3.26–3.33): reingreso de una sola vela, el papel de la zona de premercado lo da la
apertura, vela de apertura sin cuerpo, la Fed la sesión entera, una regla retirada (**34 reglas**), el 8/07
revalidado (julio **−142,50 en 6**) y la orden tras la noticia roja.

El motor, el 28/09: lee los días de Fed de Fechas Especiales (completada hacia atrás con el calendario oficial),
aplica las noticias rojas y anota los rompimientos de las zonas de premercado. Ninguno cambió una operación
validada, y cada uno pasó su regresión (`scripts/cadena/prueba_motor.py`).

**Decisión de Kris:** no se abre otra lista de pendientes antes de empezar. Se hace el backtesting y cada duda
se resuelve cuando aparezca en un día concreto. Las dudas ya vistas quedan en `tasks/current.md` como
referencia. El mismo día `tasks/current.md` se dejó en lo mínimo: lo terminado, aquí; ideas y
comprobaciones sueltas, a `backlog.md`.

**Dudas ya vistas, para reconocerlas cuando salgan en el backtesting** (no son tareas; el registro del
método sigue en `chaumer/01_Plan/PENDIENTES.md`, donde los huecos declarados no se borran):

- **Plazo de la consecución del reingreso.** El motor le pone tope de 5 velas; el plan dice que el traspaso
  no tiene plazo. Caso: 11/09, reingreso de las 9:01 (consecución en la 13.ª vela; sin tope sale tal cual se
  vio a mano, descartado por el punto de referencia 29.423,00). Sin tope cambia el 24/07: Reingreso alcista
  9:21, +38,00
- **¿Una zona de premercado da Continuación?** `R-25` dice que no; `R-15` («Aplica a: Continuación ·
  Reingreso») y `R-40` lo dejan abierto. El motor dice que no. Tampoco anota como rompimiento la salida de
  una zona que abrió con la ventana dentro (ningún día hasta hoy)
- **Resolución anticipada del plazo** (`P-31`) y **marcado por banda y turno** (`P-33`): el motor no está
  comprobado en esos dos puntos. **Umbral MNQ frente a NQ** (`P-32`): julio se marcó con el de NQ
- **Tres operaciones que cambió el motor el 28/09** (días no validados, reingreso de una sola vela): 23/07
  (Reingreso −17,00 → Continuación bajista +32,25), 03/08 (+11,25 → NO OPERA), 24/09 (+21,50 → NO OPERA)
- **Test ciego:** sin decidir si las 10 jornadas (10 → 23/09) cierran el criterio de 9 de 10
- **Textos del plan desfasados** (con el sí de Kris): `R-09` dice «verde/roja» por azul/blanca; `R-36` nombra
  los discursos de Powell y se decidió no contarlos; `PENDIENTES.md` da por no hechos el filtro de noticias
  del motor (`P-27`) y los rompimientos de premercado (`P-34`)
- **Diagramas por rehacer:** el del volumen de premercado (dibuja 2.000; vale más de 8.000 en MNQ) y los
  siete de agosto; después, unificar las carpetas de imágenes
- **Se cierran con los números del backtesting:** regla de parada, mín/máx de premercado, retroceso mínimo
  (falta la comisión real por contrato MNQ). **No bloquean:** Apex, sesión sin hora de cierre, nombre de la
  conexión, términos del curso

---

## Checkpoint 2026-09-25c — Cowork deja de existir: el plan se trabaja desde Claude Code

Kris decidió que el plan de Chaumer, el test ciego, el motor y los diagramas se trabajen desde aquí. `01_Plan`
deja de ser de solo lectura: cada cambio necesita el sí de Kris (erratas incluidas), va en su propio commit
`plan:` y se cierra sincronizado. Se reescribieron las instrucciones que asignaban cosas a Cowork (`CLAUDE.md`,
los dos de `chaumer/`, la regla del Coach, `sincronizar.mjs`, el texto del Coach y el de Estrategia, el LEEME
del test ciego —que gana una regla de ceguera para Claude Code— y varios comentarios) y el comentario de
`plan_documentos` en la BD. Los dos buzones, `PROPUESTAS_AL_PLAN.md` y `PENDIENTE_PORTAL.md`, se archivaron
en `docs/archivo/chaumer/`, y lo que tenían abierto pasó a `tasks/current.md`. D-028.

---

## Checkpoint 2026-09-25b — Fase 8: el portal suelta R2, y la unificación termina

La fase iba a mudar las observaciones de Alfredo a Supabase y apagar D1 y R2. La revisión contra el código lo
cambió: en D1 había **0 observaciones** y **ninguna línea** usaba R2 desde la fase 4. Kris decidió dejar las
observaciones en D1 (mudarlas obligaba a que la llave del portal escribiera en Supabase, contra D-023). El portal
suelta R2 (el bucket sigue en Cloudflare, sin borrar) y la copia local de D1 gana la tabla que le faltaba.
D-027. Con esto, **las 8 fases de la unificación Chaumer están cerradas**.

---

## Checkpoint 2026-09-25 — Fase 7: la cadena diaria

Diseño: `docs/disenos/2026-09-24-cadena-diaria.md` (v1.8) · D-026. **Kris deja de exportar a mano:** cada
día a las 10:32 un AddOn de NinjaTrader exporta las velas, el motor de Chaumer marca el día y la ficha
llega al Coach, que no la enseña hasta que Kris registra su lectura.

- **7a · el motor.** `lector.py` sigue a Nueva York (desde el 2/11 habría tomado una vela de premercado
  como vela base) y en día de Fed ve reingresos. Regresión: 46 días no Fed idénticos. El 8/07 da ahora un
  Reingreso −64,75 y se llevó a Cowork.
- **7b · la BD.** `sesiones.registrada_at` (congelada por trigger) y `diario_editado_at`; `motor_fichas`
  con el candado del test ciego: la única tabla con RLS que no es `auth_all`, a propósito.
- **7c · el puente.** `scripts/cadena/subir_dia.py` importa el motor sin copiarlo, sube el gráfico a
  Cloudinary y la ficha a Supabase. 10 fichas del 10 al 23/09.
- **7d · el Journal.** Tarjeta "Lo que marcó el motor" en el Coach y la sección en su contexto, sin
  códigos del plan y presentada como auditoría.
- **7e · el AddOn.** `CadenaDiaria.cs`, escrito en C# 5 para compilarlo fuera de NinjaTrader. La primera
  noche recuperó solo 5 días; el 25/09 exportó a las 10:32:42. **6 de 6 días idénticos** a la
  exportación manual, línea a línea.

**Lo que enseñó:** el diseño viejo (10:45 fijo y una tarea de Windows) se rompía el 2/11; y un candado en
JavaScript no protege nada si la app lee con `auth_all`.

---

## Checkpoint 2026-09-24b — Fase 6: el Coach con el plan de Chaumer y Claude Opus 5.5

- **6a** — El Worker `broad-hall-c53f` al repositorio (`workers/proxy-ia/`), sin claves escritas. Pasa
  el cuerpo tal cual: el cambio de modelo no necesitó tocarlo. No reenvía `anthropic-beta`.
- **6b** — `plan_documentos` (los 5 documentos, 138 K caracteres) y `coach_uso`. Se cargaron por el
  MCP con el SQL del sincronizador, en trozos, comprobando cada trozo con su sha256: un salto de línea
  perdido en el glosario lo cazó la huella. El Coach manda el plan como primer bloque del system en
  días de la etapa 2, con Opus 5.5, un vigilante de códigos y el aviso de negativa.
- **Prueba real (24/09):** 88.235 tokens escritos en caché en el análisis y leídos en el chat y el
  diagnóstico; 0,92 USD la sesión. El análisis juzgó con el plan: stop 11 puntos más corto que el que
  marca el plan (desde que nace la zona) → entrada inválida.
- **6c** — Documentos (`.claude/rules/coach.md`, `CLAUDE.md`, D-025) y un arreglo visto de paso:
  `parsearSetupsJson` cortaba el resumen del veredicto en la palabra «setup» y guardaba los `**`.

Commits: `272b5ea` · `57006aa` · `804a1dc` y el de la 6c.

---

## Checkpoint 2026-09-24 — Unificación Chaumer: fases 1–3 y el repositorio público

Diseño: `docs/disenos/2026-09-24-unificacion-chaumer.md` (v1.4). **Un solo proyecto por
debajo, dos webs por encima:** el proyecto Chaumer entra en el Journal y el portal queda como
la pantalla de Alfredo.

### Fase 1 · GitHub Pages publica solo la aplicación

Pages servía la rama `main` entera: `CLAUDE.md`, `docs/`, `NinjaTrader/` daban 200.
`publicar-journal.yml` monta una carpeta con `index.html`, `js/`, `css/`, `icons/`,
`favicon.svg`, `manifest.json` y `sw.js`, y solo publica eso. Kris cambió *Source* a
**GitHub Actions** antes del push. Lo privado da 404; la app carga en escritorio y en móvil.

### Fase 3 · `chaumer/` con sus 115 commits

`git subtree add` desde `Trading_Plan`. `01_Plan`, `02_Assets` y `05_Backtesting`, idénticos
byte a byte a la carpeta vieja. El portal se publica solo con `publicar-portal.yml`
(secretos propios `PORTAL_CLOUDFLARE_*`; la misma cuenta que el bot) y las 56 páginas salieron
idénticas a las de antes. Dos cosas que solo aparecieron al mudar:

- **El espacio de "Trading Journal".** Cinco scripts del portal sacaban su carpeta con
  `URL.pathname`, que deja `%20`: `npm run verificar` fallaba. Ahora `fileURLToPath`.
- **CRLF.** Git en Windows sacaba `chaumer/` con CRLF, la huella de los diagramas cambiaba y se
  redibujaban. `.gitattributes`: `chaumer/** text=auto eol=lf`.

### El repositorio era público (D-022)

`CLAUDE.md` decía "privado"; no lo era desde su creación. Al subir `chaumer/`, el plan de
Alfredo quedó legible en GitHub. Pasarlo a privado **tumbó el Journal** (Pages no publica
privados con la cuenta gratuita) y lo **desactivó**. Kris lo dejó público hasta tener
presupuesto para GitHub Pro; hubo que reactivar Pages y relanzar la publicación. El portal ya
enseñaba sin contraseña casi todo el plan (con `noindex`).

Commits: `f20786d` · `21b82c0` · `221379d` · `29496d7` · `3bbaffa` · `fb32a92` · `b984823` ·
`dffd562` · `31133c0`.

---

## Checkpoint 2026-09-23 — Curva de equity verde/roja y tooltip del día

### La curva cambia de color en el cero

Verde por encima de cero y rojo por debajo, **exactamente donde la cruza**. Colorear tramo a
tramo no sirve: un tramo que cruza el cero sale entero de un color. Se usa un degradado
vertical con un **corte duro en el píxel del cero**, recalculado en cada pintada porque
depende del alto real del área.

- **Relleno** entre la curva y el cero, más intenso lejos del cero y apagado al tocarlo.
- **El cero siempre visible** (`beginAtZero`): es la frontera entre los dos colores.
- **Fechas** "3 ago" en vez de "08-03"; el tooltip de Chart.js da el acumulado (en su
  color) y el resultado **del día**.
- **Colores leídos de los tokens** con `getComputedStyle` (`--accent-txt`, `--red-txt`,
  `--bg3`…): Chart.js pinta en canvas y no lee CSS, pero así no hay hex sueltos.

### La etiqueta del acumulado

Primero se puso **dentro del área**, encima del último punto, y se montaba sobre la propia
línea y el relleno: casi no se leía. Pasó al **margen derecho**, a la altura del último punto,
como la etiqueta de precio de una plataforma de trading: pestaña sólida en el color del
resultado, texto en el color del fondo y una guía punteada desde el punto. El margen se
reserva **midiendo el texto real** antes de crear la gráfica, para no robar ancho en móvil.

### Tooltip del día

Al pasar el ratón por un día del calendario: **setup** declarado, **puntos** del día y
**errores** — solo el nombre, sin la descripción; si no hay, **"Sin errores"**. Los repetidos
salen con "×2".

- Los **puntos salen del precio**, no del P&L: es la medida de riesgo del proyecto y no
  depende de los contratos (tampoco de la regularización del 19-sep).
- `getCasuisticasByMonth` trae ahora el nombre del error (`casuistica:error`); solo lo usa el
  calendario. La caché pasó de `true` a la lista de nombres por día, y los iconos de error de
  la rejilla siguen funcionando.
- **Solo con ratón** (`hover: hover` + `pointer: fine`). En táctil no se monta, y el toque
  sigue abriendo la vista del día.
- `position: fixed` con las coordenadas de la celda y `pointer-events: none`, para que no lo
  recorte ningún `overflow` ni parpadee al entrar y salir. Se oculta con cualquier scroll.

### Verificación

**Por píxel, con `getImageData`**, porque el panel del navegador deja de componer fotogramas
a ratos y las capturas salían en blanco o con fundidos a medias. En agosto: la línea en el
punto de +$73 da `#3FE0A6` exacto y en los negativos `#F2706F`; la pestaña del acumulado es
`#F2706F` sólido y empieza en x=653 con el área acabando en 645. Tooltip del 6-ago con los 4
errores reales de la BD; en móvil no se crea. Consola limpia.

Commits: `539b64d` · `99d3786`.

---

## Checkpoint 2026-09-19 — El journal: una sola cuenta, regularizado a ±$160

### Una sola cuenta en `trades`, todas las de Apex en `apex_trades` (D-019)

El histórico de `trades` estaba partido en **cuatro cuentas que se sucedieron** porque cada
una fue la principal durante un tramo, y el Calendario y Análisis lo mostraban troceado:

| Cuenta | Desde → hasta | Trades | P&L |
|---|---|---|---|
| `PA-APEX-232411-03` | 3 feb → 16 jul | 80 | −$2.729,10 |
| `APEX-232411-14` | 22 jul → 13 ago | 12 | −$1.257,66 |
| `APEX-232411-15` | 14 ago → 31 ago | 6 | −$382,32 |
| `Sim101` | 1 sep → 18 sep | 11 | −$157,42 |

Cada tabla pasa a tener **un rol**: `trades` es el journal de la cuenta principal bajo una
sola etiqueta (`Sim101`), con la cuenta real en la columna nueva `cuenta_origen`; y
`apex_trades` tiene **todas** las cuentas de Apex con su nombre real. Las 98 filas de cuentas
Apex se copiaron a `apex_trades` (0 solapamientos por cuenta+fecha+hora), y **`apex.js` dejó
de leer `trades`**.

Eso **sustituye** el invariante "un trade vive en UNA tabla". Existía porque `apex.js`
concatenaba las dos; al dejar de hacerlo, nace la regla nueva: *si `apex.js` vuelve a leer
`trades`, el drawdown consumido se infla*. Escrito en `apex.js`, `CLAUDE.md` y D-019.

**No se copió nada de `apex_trades` hacia `trades`.** Era lo que parecía pedir el caso, y
habría sido un error: de sus 21 días, **20 ya estaban en `trades`** — la misma operativa
replicada en dos cuentas con distinto número de contratos (18-sep: +$86,96 en `trades`
frente a +$1.067,96 en `apex_trades`). Se habrían contado dos veces.

Verificado por SQL replicando el reparto por periodo del front: las **7 tarjetas** de Apex
conservan exactamente sus trades y su P&L (Apex-15 primera: 13 propios + 6 que venían de
`trades` = 19).

### La simulación a un contrato

Antes de regularizar, se simuló el año con `profit ÷ qty` (exacto en bruto y comisión):
**la mitad de la pérdida era tamaño, no criterio** (−$4.527 real frente a −$2.261). Agosto,
−$2.160, habría sido −$131. Y el tamaño subía justo al perder: **1,82 contratos de media en
los ganadores, 2,10 en los perdedores**, con el máximo en 5 frente a 10.

### Regularización a ±$160 por trade (D-020)

Los **20 trades** que pasaban de ±$160 por tamaño bajaron de contratos hasta entrar en rango.
Se recalcularon `qty`, `profit`, `commission`, `mae`, `mfe` y `etd`; **los precios no se
tocaron**. Journal: **−$4.526,50 → −$2.488,58**.

**La disciplina no se movió**: `mae` y `qty` se escalan juntos, así que el MAE en **puntos**
—lo que evalúa el stop máximo— da idéntico. Verificado en los 20: 0 con MAE o MFE en puntos
distinto, 0 cambios de signo. Respaldo en `_bak_20260919_trades_regularizacion`.

> ⚠️ **El journal deja de ser fiel a lo que se ejecutó**, a sabiendas. `apex_trades` conserva
> los contratos reales, así que el Apex Tracker sigue mostrando el drawdown verdadero: las
> dos tablas divergen **a propósito**.

### El NQ del journal pasa a MNQ (D-021)

El único NQ de `trades` (24-jun, 1 contrato) no se podía bajar de tamaño: con $20/punto,
32,5 puntos ya eran −$653,80. Se convirtió a MNQ **manteniendo los −32,5 puntos**, solo con el
multiplicador: **−$653,80 → −$66,30**. Journal: **−$1.901,08**.

Los **17 NQ de `apex_trades` no se tocaron**: ahí consumieron drawdown real, que es lo que
decidió que esas cuentas se quemaran.

Solo queda **un** trade fuera de ±160, y a propósito: el **6-feb** (−$194,30 con un contrato).
No es tamaño ni instrumento: es un stop que se dejó correr **96,5 puntos** con el límite en 80.

> Al documentar apareció una **colisión de IDs**: otra sesión había creado un D-018 ("Dos
> setups") el mismo día. La decisión de la cuenta única quedó como **D-019** (el commit
> `ebd7e5d` cita "D-018"; la buena es la D-019).

**Pendiente (Fase 4 del diseño):** cuando la cuenta real sea la principal y esté en
`apex_cuentas`, sus trades irán a `trades` y el Tracker no los verá. Se resuelve con un
trigger en Postgres, sin recompilar NinjaTrader.

Diseño: `docs/disenos/2026-09-18-cuenta-unica-en-trades.md` · Migraciones:
`2026-09-18-cuenta-unica-en-trades`, `2026-09-19-regularizar-trades-a-160`,
`2026-09-19-nq-a-mnq-en-el-journal` · Commits: `ebd7e5d` · `0ac02f0` · `befe509`.

---

## Checkpoint 2026-09-18 — Dos setups: Continuación y Reingreso

- **De 6 setups a 4** (D-018). Las dos variantes de apertura se funden en las de
  continuación y la familia `iri` pasa a `continuacion`. Migración
  `2026-09-18-setups-continuacion-reingreso`, respaldos en `_bak_20260918_*`.
- Migrado: 86 sesiones (50 Continuación Alcista + 36 Bajista), 6 operativas de Chaumer,
  3 `setup_observado`, 4 reglas de Fase 2. La apertura ya no se distingue en el histórico.
- Código: fallback por prefijo en `db.js`, lista de respaldo del bot y del AddOn
  `ChecklistChaumer` (recompilado en NT8 el 21 sep), y comentarios en 6 archivos.
- El despliegue del bot falló por token de Cloudflare inválido (`code: 10000`): Kris lo
  regeneró, y el workflow pasó a Wrangler 4 (`bcedaf5`). Desplegado en verde.
- `SupabaseAutoExport` recompilado en NT8 el 21 sep: quedan activos el anti-replay y la
  exclusión de simulación/playback. Comprobado: 0 trades con `exit_time < entry_time` en
  `trades` y `apex_trades`.
- Verificado en el preview: selector del Diario, checklist de Fase 2, Disciplina
  (agrupa bajo «Continuación»), Datos › Catálogos, filtro de Trades y Chaumer.
- De paso, arreglada la copia local (`dev.local.js`): anulaba `setupFamily`,
  `setupLabel` y `setupsSync` por empezar por "set", y la Fase 2 mostraba
  «[object Promise]».

---

## Checkpoint 2026-09-17 — Chaumer: la lista día a día y la hora Colombia

- **Diferencias pasa a ser la pestaña principal** del comparador; «Día» se renombra
  **Registrar**. Dashboard de 5 KPIs + 3 tarjetas arriba, y abajo la **lista día a día**
  (fecha · mi resultado · el suyo · Δ puntos). Cada fila abre un **modal con las dos
  gráficas** (Esc para salir, ← → para cambiar de día).
- **Horas en hora Colombia** (D-017). Las filas estaban mezcladas ET / Colombia: 5 seguras
  en ET corregidas con `2026-09-17-chaumer-hora-colombia` (respaldo
  `_bak_20260917_chaumer_horas`); las dudosas se quedan por decisión de Kris. El Δ de hora
  pasa a medirse solo en días con el mismo setup.
- Verificado con las 12 filas reales de septiembre: brecha −17,5 = (−79,5) − (−62).
  Detalle: `docs/disenos/2026-08-19-chaumer-vs-yo.md` §5.8.
- **v8, mismo día:** la lista pasa a ser una tabla con columnas (resultado · hora · puntos
  por lado), orden ascendente, fila de totales con % de efectividad, y la franja solo
  distingue mismo setup (verde) / setup distinto (rojo). §5.9.
- Las horas dudosas y la del 28 ago (21:52) las revisa Kris a mano.

---

## Checkpoint 2026-09-14 — Apex-15 renovada: dos tarjetas con el mismo número

La `APEX-232411-15` se quemó el 8-sep (−1.324,08 ese día, balance 47.805,06 bajo el piso
de 48.000). Kris la renovó el viernes 11-sep y **Apex conserva el número de cuenta**, así
que NT8 exporta las dos etapas con el mismo `AccountName`.

El Tracker asignaba trades a cada tarjeta **solo por número**: una segunda tarjeta habría
cogido los 21 trades y nacido quemada. Ahora **cada tarjeta es un periodo**: desde su
`fecha_inicio` hasta el día antes de que empiece otra con el mismo número (`periodoDe` en
`js/apex.js`). El límite se deduce, no se guarda: cero cambios de esquema, y la próxima
renovación es solo crear otra tarjeta. El formulario exige fecha de inicio si el número ya
lo usa otra tarjeta.

| Tarjeta | Periodo | Trades | Balance |
|---|---|---|---|
| Apex-15 (quemada, id 6) | 12-ago → 10-sep | 19 | 47.805,06 |
| Apex-15 · 2ª (id 7) | 11-sep → | 2 | 49.895,96 |

Verificado con `SELECT` y en el preview (copia local ampliada con la Apex-15). Ninguna otra
cuenta tenía trades anteriores a su `fecha_inicio`, así que las demás tarjetas no cambian.
Migración `2026-09-14-apex15-renovada.sql`. Diseño:
`docs/disenos/2026-09-14-apex-cuenta-renovada.md`.

> ⚠️ Queda al backlog: el filtro de cuentas de Calendario/Trades/Análisis sigue mezclando
> las dos etapas, porque filtra por nombre de NT8 y no por tarjeta.

---

## Checkpoint 2026-08-31b — Motivos sin cubrir, FOMC del desglose y P&L de la celda

### Tres motivos que se pintaban como "no me conecté"

El selector de `motivo_no_opero` ofrece **7 opciones** y `calendar.js` solo contemplaba 4:
`Noticia roja`, `Personal` y `Otro` caían en el `else` final y se pintaban con
`badge-noopero` y el icono de usuario tachado — el de **no haberse conectado**. Kris lo vio
en el 25-ago, que tiene motivo `Otro`.

Ahora el color lo decide **`se_conecto`**, no una lista de motivos:

```js
if (sesion.motivo_no_opero === 'FOMC')    return 'fomc'
if (sesion.motivo_no_opero === 'Festivo') return 'festivo'
if (sesion.se_conecto !== false) return 'sin-setup'   // conectado y sin operar
return 'no-trade'
```

Así un motivo nuevo no vuelve a romperlo. El badge **"No operé" pasó a "No me conecté"** y
queda reservado a `se_conecto === false`: antes la misma etiqueta valía para las dos cosas.

### "Sin entradas" cubre también el setup válido no tomado

Por petición de Kris, `Setup válido no tomado` deja de tener badge propio
("⚠️ Setup válido — no entré") y muestra **"Sin entradas"**, igual que `Sin setup`.

Y **la bandera `setup_valido_no_tomado` manda sobre el motivo**, porque pueden estar
desalineados: el 25-ago tenía `motivo_no_opero = 'Otro'` con `setup_valido_no_tomado = true`
y `setup_observado = 'IRI Continuación Bajista'` rellenos. El dato específico gana.

> El matiz no se pierde donde importa: `setup_valido_no_tomado` y `setup_observado` siguen
> en la BD y la disciplina los sigue usando. Lo que se unificó es la **etiqueta del
> calendario**.

### El contador de FOMC marcaba 0 con dos FOMC en el mes

Agosto tuvo dos (19, *FOMC Minutes*; 28, *Jackson Hole*) y la fila decía 0. La fila contaba
los días FOMC **de la rama "sin operar"**, que solo recoge días **no conectados** — y Kris
siguió los dos conectado, así que caían en "días conectados" y nunca llegaban al contador.

La fila **se queda donde estaba** (Kris pidió no moverla) pero ahora muestra `fomcMes`: los
días FOMC del mes, se conectara o no. Los FOMC sin conexión caen en `noConectados`, que es
lo que de verdad fueron. El tooltip avisa de cuántos ya cuentan en la columna de la
izquierda, para que no parezca doble conteo.

> Se probó antes sacar la fila a una nota a pie del bloque. **Se descartó**: Kris la quiere
> donde estaba.

### El P&L de la celda

Toma el hueco libre con `flex: 1` y se centra en él — `1.15rem` en escritorio, `0.95` en
tablet, `0.8` en móvil, frente a `0.88 / 0.72 / 0.65`. **La celda no cambia de alto**: solo
se reparte mejor el espacio que ya tenía. Colores a las variantes `-txt`.

### "Sin resultado" pasa a "Sin entradas" en el desglose

La fila de la columna "Días conectados" usa ya la misma etiqueta que la celda del
calendario. Cubre dos casos —conectado sin entrar, y entrada que cerró en break-even— y el
tooltip lo dice; Kris prefirió no separarlos (`a65579a`).

### Verificación

Inyectando en la copia local los casos reales de la BD: `Otro` + bandera, `Setup válido no
tomado`, `Sin setup` y `Noticia roja` dan todos día conectado; solo `se_conecto = false` da
"No me conecté". Consola limpia.

> ⚠️ Estos cambios entraron en el commit `ae4746d` de **otra sesión** que hizo `git add -A`
> mientras se trabajaba en el mismo directorio, así que su mensaje solo habla de `RR.cs`.
> Dos agentes sobre el mismo árbol: commitear por archivo, no con `-A`.

---

## Checkpoint 2026-08-31 — El checklist dejó de marcarse solo · zonas naranjas al AddOn · RR en puntos

Tres cosas, todas en la frontera entre NinjaTrader y la BD. La primera se arregló el 16 de
agosto y se quedó sin documentar; se recoge aquí.

### 1. El checklist se marcaba solo al abrir el mercado (16 ago)

**El síntoma.** El AddOn aparecía con **todas** las casillas marcadas justo al abrir el
mercado, sin haber tocado nada.

**La cadena**, reconstruida con datos reales del 14 de agosto:

1. `SupabaseDailyLevels` hace UPSERT a `sesiones` al detectar la apertura del RTH
   (09:31 ET). Si la fila del día no existía, es un **INSERT**.
2. El trigger `trg_materializar_checklist` insertaba las 18 reglas con `cumplido = true`.
3. El AddOn hace poll cada 5 s y copia BD → casillas: se marcaban solas. Y el siguiente
   guardado las persistía **como si las hubiera marcado el trader** → disciplina inflada al
   100 % en los días que no se corrigieran a mano.

**La huella que lo delató.** `rr_1a1` es la única regla con `activa = false`, así que ni el
AddOn ni la web la escriben — pero el trigger no filtraba por `activa`. Su `updated_at` del
14 ago quedó sellado a las **08:31:00.247 hora Colombia = 09:31 ET**, el instante de la
apertura, junto a la fila de `sesiones` con su `precio_apertura`. Mismo sello el 5 y el 10
de agosto, ambos cerrados 18/18 en `true`.

**El arreglo.** Migración `2026-08-16-checklist-sin-materializar-en-true.sql`: fuera
`trg_materializar_checklist` y `trg_backfill_regla`. **Sin fila = N/A**, que es como ya lo
leían `calcDisciplinaStats` (`db.js`) y `_checklistDia` (`app.js`). En el AddOn, el reset de
sesión dejó de guardar: escribía las 18 reglas en `false` sin haber tocado nada. Ninguna
fila existente se tocó — el histórico se conserva por decisión expresa de Kris. Porqué
completo: **D-013**.

**Verificado.** Ningún trigger de materialización vivo; una sesión insertada a mano (fecha
ficticia, borrada después) crea **0 filas** de checklist; 2068 filas de histórico intactas.
Y en vivo el 31 de agosto: la sesión del día tiene **17 filas, no 18** — falta justo
`rr_1a1` —, escritas de una vez cuando Kris marcó.

### 2. Las zonas naranjas se escriben en el AddOn, no en Telegram (31 ago)

Dos casillas nuevas en `ChecklistChaumer` ("Sop." y "Res."), debajo de las noticias rojas:
precios separados por comas, el mismo formato que pedía el bot. Se escriben en premercado,
al marcarlas en el gráfico, junto a la regla `chk_zonas` que ya vivía en la Fase 1.

Mismo mecanismo ya probado con las noticias: debounce de 900 ms, guarda anti-pisado de 3 s
frente al poll de 5 s, cajas vacías en sesión nueva, y bloqueo en fin de semana. Se parsea
en **cultura invariante**: la coma es el separador de la lista, así que los decimales van
con punto.

**Lo que no era opcional.** El bot mandaba `soportes_naranja: data.soportes_naranja ?? []`
en cada guardado. Quitarle las preguntas sin quitarle esas dos claves habría hecho que el
registro de la noche **borrara** las zonas escritas por la mañana — el mismo motivo por el
que el bot ya no manda los niveles de precio. Porqué completo: **D-014**.

De paso caen `parseNumList`, `PREMKT_PROMPTS` y `premktResumen`, sin uso. **Ojo:** el primer
intento de esa limpieza se llevó por delante `escHtml`, `CONTEXTOS` y `SETUPS_FALLBACK`, que
sí se usan; `node --check` no lo vio porque seguía siendo sintaxis válida. Se cazó revisando
el diff. Lección: en una limpieza de código muerto, **revisar qué se borró**, no solo que
compile.

**Verificado end-to-end el 31 ago.** Kris escribió las zonas en el AddOn (`[29384]` /
`[29486]`), registró la sesión completa por el bot (setup, emoción, confianza, análisis) y
las zonas **siguieron intactas**. Los niveles de `SupabaseDailyLevels` tampoco se tocaron.

### 3. RR — herramienta de dibujo que mide el riesgo en PUNTOS (25 y 31 ago)

El Risk Reward de NinjaTrader mide en precio, porcentaje, ticks, dinero o pips. **En puntos
no**, que es la unidad en la que está escrito todo este proyecto. `RR.cs` es un clon suyo
con enum propio (`RRUnit`), solo dos unidades —Puntos, por defecto siempre, y Valor— y los
colores de Kris de fábrica. Por qué un clon y no una modificación: **D-015**.

Los puntos se formatean con la **misma fórmula que usa NinjaTrader** para su propia unidad
`Points` (`@NetChangeDisplay.cs:123`), así que los decimales los decide el tick del
instrumento y funciona igual en NQ que en MNQ.

El 31 de agosto se le añadió el **sombreado de las zonas de stop y target**, cada una con el
color de su línea y opacidad configurable (`AreaOpacity`, 20 por defecto, 0 lo apaga). Se
pinta antes de las líneas para que queden encima, y **no** durante el hit test — mismo
criterio que las figuras de NinjaTrader: así el área no se traga los clics de lo que haya
debajo.

**Verificado.** `RR.cs` compila con `csc.exe` contra las DLL reales de NinjaTrader con **0
errores**, igual que los otros tres archivos de `NinjaTrader/`. El diff contra el original
está acotado a los cambios pactados.

### Pendiente

- **Recompilar `RR` en NT8** para ver el sombreado (el AddOn ya está recompilado).

---

## Checkpoint 2026-08-23 — Tarjetas KPI y curva de equity del Calendario

Dos cambios de forma, ninguno de cálculo.

### Las tarjetas KPI

Etiqueta y valor **centrados**, número de `1.05rem` a **`1.6rem`**, y el valor pasa a las
variantes **`-txt`** de cada familia: en esta rejilla es texto sobre fondo oscuro y la base
se veía apagada — el error típico que avisa `.claude/rules/estilos.md`.

Y se adopta el **mismo componente visual que los KPI de Análisis** (`.an-kpi`, 19 ago):
fondo plano `--card`, radio 14 px y un **filete de 2 px arriba** con el color del resultado,
servido por una variable local `--c`. El tono va en `data-tono` sobre la tarjeta, separado
del color del valor: Targets/Stops no tiene un color de valor único —cada cifra lleva el
suyo— pero su filete sí debe decir quién manda. Se replicó el patrón en vez de reutilizar la
clase porque estas son `.metric-card` y las de Análisis se generan aparte; si algún día se
unifican, el bloque de `.metrics-grid-compact` es lo que se borra.

**Targets / Stops lleva un color por cifra**, no uno por tarjeta: `<span class="ts-t">` en
verde y `<span class="ts-s">` en rojo, con la barra en `--text3`. Pintar la tarjeta entera
de un color decía "vas bien o mal", que es justo lo que ya dice Acierto; aquí lo que
importa es el reparto.

### La curva de equity

Era una línea de 3 px que cambiaba de color tramo a tramo, con un punto de 4 px en **cada**
día y rejilla completa en los dos ejes. Ahora:

- **2 px, un solo color** — el del resultado con el que cierra el mes.
- **Un único punto visible, el último**, que es el dato que se busca al mirar.
- **Relleno en degradado** hacia transparente, recalculado en cada pintada porque depende
  del alto real del área de dibujo (`chartArea`), que no existe hasta que Chart.js la mide.
- **Sin rejilla vertical ni bordes de eje.** En la Y solo se marca el **cero**; el resto de
  líneas quedan casi invisibles. Las cifras usan `fmtMiles` (`−$2.000`, no `-2000`).
- **Guía vertical punteada al pasar por encima** (plugin `guiaVertical`) + tooltip sin
  cuadro de color.

> Un mes sin trades **sigue pintando los ejes vacíos**. La primera versión salía antes de
> crear la gráfica y dejaba el lienzo en blanco bajo un título, que parece que algo se
> rompió. Detectado al verificar julio en la copia local.

Verificado en la copia local con los 10 trades de agosto: acumulado correcto
(−292,60 → −2.133,60), `pointRadius` `[0,0,0,0,0,0,0,0,0,4]`, ticks `−$3.000 … $1.000`,
consola limpia. La banda clara que parecía haber a la derecha del gráfico **no existe**:
los perfiles de opacidad al 60 %, 90 % y 97 % son iguales y el relleno solo baja más donde
la curva está más abajo — era aliasing de la captura reducida.

---

## Checkpoint 2026-08-19 — Otros y Datos rediseñados, modo local, y el comparador de Chaumer

Tres cosas en un día, encadenadas: Kris dijo que **Otros parecía una pantalla de los 90** y
que **Datos se salía de la ventana**; de arreglarlo salió el **modo local** que quita el
login del medio para verificar; y encima se construyó el **comparador Chaumer vs yo**.

### 1. Datos ya no se desborda ni se descuadra

Los selects de Tipo y Fase se salían de la tarjeta de Errores. La causa eran dos reglas
juntas: `.catalog-add` era un flex **sin `flex-wrap`**, y `.catalog-tipo-select` llevaba
`flex-shrink: 0` con el ancho mínimo marcado por la opción «Fase 1 · Pre-sesión» (~150 px).
Con dos selects y un botón, ~330 px rígidos en una columna de ~340 px: nada podía ceder.

Y la rejilla usaba `repeat(2, 1fr)` en vez de `minmax(0, 1fr)`, así que la columna que no
encogía **crecía por encima de 1fr** y descuadraba el resto. Medido a 1024 px, las cuatro
tarjetas pasan de **441/306/441/306** a **363 las cuatro**.

Además, Datos se reorganizó en **pestañas**: cada catálogo ocupa el ancho completo
(de 491 px a 1.012 px medidos a 1280), que es lo que impide de raíz que el desbordamiento
vuelva.

**Bug preexistente que salió por el camino:** `setupDragDrop` construía la lista de orden
con `querySelectorAll('[data-id]')`, que recoge también el checkbox, los selects y los
botones de cada fila — 6 entradas por fila, y el `orden` guardado salían múltiplos. Se
sostenía por accidente porque todas las filas aportaban el mismo número de nodos. Ahora es
`':scope > [data-id]'`.

### 2. Otros deja de ser un menú de sistema

Dos grupos (*Consultar* / *Configurar*), color e icono propios por tarjeta, y **cada una
con su número real**: trades, imágenes, experimentos, reglas activas, ítems de catálogo y
fechas del año. Los contadores salen de `DB.getResumenOtros()`, que hace los conteos con
`head: true` — Supabase devuelve el total y **cero filas** — en paralelo y cacheados 5 min.
Si una consulta falla, esa tarjeta pinta `—` y sigue navegando.

### 3. Modo local: se acabó pedir la contraseña

Kris pidió «una solución definitiva» para no tener que iniciar sesión cada vez. El `.env`
que había propuesto antes no podía funcionar —el journal es un sitio estático sin build,
nadie inyectaría ese archivo, y lo que falta no es configuración sino una **sesión**— pero
el objetivo sí era alcanzable: `js/dev.local.js`, gitignoreado, arranca la app en localhost
con una copia de datos reales. **La sesión real manda sobre el fixture**, así que en cuanto
Kris entra una vez se ven datos en vivo, y si caduca se cae al modo local en vez de
bloquearse. Detalle: `.claude/rules/modo-local.md`.

### 4. Comparador Chaumer vs yo

Kris entró a su curso y tiene acceso a sus operativas. Nueva sección con dos pestañas:
**Día** (la vista partida, su operativa contra la de Kris) y **Diferencias** (cobertura,
4 KPIs y 4 gráficas, con filtro Mes/Trimestre/Año/Todo).

Dos trampas se detectaron **antes** de escribir código, y las dos habrían dado números
creíbles y falsos:

- **Las horas no eran comparables.** `trades.entry_time` viene de NinjaTrader en hora de
  Colombia; las operativas de Chaumer se ven en ET. Restarlas a pelo da 60 min de error en
  verano. `horaEt()` subió de `coach.js` a `db.js` y las dos horas se comparan en ET.
- **El dinero no dice nada.** No operan el mismo tamaño. El eje son los **puntos**.

El porqué de las decisiones de modelo está en `docs/decisiones.md` (D-011 y D-012); el
diseño completo con lo medido en cada fase, en
`docs/disenos/2026-08-19-chaumer-vs-yo.md`.

---

## Checkpoint 2026-08-18 — Trades fantasma: el replay de ejecuciones de NinjaTrader

Kris vio dos trades el 18-ago donde solo hubo uno: el segundo, "malo y repetido", con
entrada a las 10:01 y **salida a las 09:58**.

### El síntoma

| # | Dir | Entrada | Salida | Precio ent. | Precio sal. | exit_name | MAE | MFE | P&L |
|---|-----|---------|--------|---|---|---|---|---|---|
| 107 | Short | 09:58:41 | 10:01:35 | 29546,5 | 29526,5 | Target1 | 57 | 51 | +77,96 |
| 108 | Long | 10:01:35 | 09:58:41 | 29526,5 | 29546,5 | External | 0 | 0 | +77,96 |

El 108 es el **espejo exacto** del 107: precios y horas intercambiados, dirección invertida.
Por eso el P&L salía idéntico — invertir a la vez la dirección y los precios se cancela.

### La causa

`SupabaseAutoExport` no reconstruye trades desde una lista: lleva una **máquina de estados**
por cuenta (`NetQty`). Cuando el indicador **se resuscribe** —recompilar, reconectar,
recargar el gráfico— NinjaTrader le vuelve a entregar las ejecuciones de la sesión, y las
entrega **de la más reciente a la más antigua**. Con `states` recién reiniciado en 0:

1. Llega la compra de salida → `NetQty = +2` → abre un Long fantasma.
2. Llega la venta de entrada → `NetQty = 0` → lo cierra y lo publica.

El handler procesaba **toda** notificación de ejecución: no miraba `e.Operation` ni llevaba
registro de qué `ExecutionId` ya había visto.

**Las tres huellas de un fantasma**, que sirven para detectarlos en la BD:
`exit_time < entry_time` · `mae = mfe = 0` (`OnBarUpdate` nunca lo siguió) ·
`exit_name` con el nombre de la orden de **entrada** ("External" si fue manual).

### El fantasma de junio, que nadie había visto

La consulta `where exit_time < entry_time` sacó otro en `apex_trades`: el **id 125** del
24-jun, espejo del id 123, en la cuenta `APEX-232411-11`, por **−$1.593,80**. El
`created_at` cierra el caso: el trade real se creó a las 14:21 UTC y el fantasma a las
**16:54 UTC**, dos horas y media después — el momento de la resuscripción. Ese importe
estuvo inflando el drawdown consumido de esa evaluación.

### El arreglo

`SupabaseAutoExport.cs`, tres candados en `OnAccountExecutionUpdate`:

1. `if (e.Operation != Cbi.Operation.Add) return;` — `Update` y `Remove` re-notifican un
   fill ya visto. (El enum es `Add`, **no** `Insert`: verificado por reflexión sobre
   `NinjaTrader.Core.dll` y contra el propio `@TradedContracts.cs` de NT8.)
2. `if (ex.Time < subscribedAt) return;` — `subscribedAt` se sella en `State.DataLoaded`
   con 30 s de holgura para el desfase de reloj. Mata el replay de raíz.
3. Un `HashSet` de `ExecutionId` ya procesados, por si un replay llegara como `Add` y con
   hora reciente.

**Verificación sin NT8 delante:** el `csc` del sistema es C# 5 y se atraganta con los `=>`
y `?.` que NT8 sí acepta, así que se compiló **la versión de HEAD y la parcheada** y se
compararon los errores: 14 idénticos en ambas → el parche no añade ni un problema de
sintaxis. Los dos identificadores nuevos se confirmaron por reflexión sobre
`NinjaTrader.Core.dll`: `Cbi.Operation = {Add, Update, Remove}` y
`Execution.ExecutionId : String`.


### Sim101 fuera del auto-export

`RegistrarTodas` en ON registraba también la cuenta de simulación. `EsCuentaSimulada(acc)`
mira `acc.Connection.Options.Provider` (`Cbi.Provider = {…, Simulator, Playback}`,
verificado por reflexión), con respaldo por nombre, y el bucle de suscripción hace
`if (RegistrarTodas && EsCuentaSimulada(acc)) continue;`. Ponerla a mano en un slot
`Cuenta N` la sigue registrando: ahí la intención es explícita.

> ⚠️ **Corrección de diagnóstico.** Dije que Sim101 salía en el Apex Tracker "como una
> evaluación más". **No es cierto**, y lo di por hecho desde el invariante de CLAUDE.md sin
> abrir `apex.js`. El tracker empareja los trades contra las cuentas de `apex_cuentas`
> (`t.account === cta.numero_cuenta`) y Sim101 no está dada de alta ahí. Sus filas eran
> **huérfanas**: guardadas en `apex_trades` e invisibles en toda la app. El motivo real de
> excluirlas es no acumular basura, no un número inflado.

Se borraron las tres filas fantasma/huérfanas: `trades` #108, `apex_trades` #125 (−1.593,80)
y `apex_trades` #140 (Sim101, 18-ago, NQ Long 29620,75 → 29671,75, +1.017,96).

### El filtro de cuentas decía "ntas 3" en móvil

Kris lo vio en el calendario del celular. El culpable era una línea de CSS puesta con buena
intención: el botón del filtro es estrecho y lo que distingue una cuenta es su **final**
(`…-14` vs `…-15`), así que se recortaba por delante con
`direction: rtl; text-align: right`.

Pero `direction: rtl` **no mueve solo los puntos suspensivos**: cambia la dirección del
párrafo y el algoritmo bidireccional reordena los tramos. En `"3 cuentas"` el `3` es un
número europeo y `cuentas` un tramo latino; el espacio entre ambos resuelve a la dirección
del párrafo (RTL), y el resultado se reordena a **`"cuentas 3"`** — que recortado da
`"ntas 3"`. Los nombres de cuenta, al ser un único tramo latino, no se reordenaban: por eso
solo fallaba la etiqueta del plural.

Comprobado en navegador antes de tocar nada, con una maqueta a 375 px que medía carácter a
carácter qué queda dentro de la caja visible.

**Arreglo:** se acorta el texto en JS en vez de recortarlo en CSS. `labelBtn()` de
`account-filter.js` deja el primer y el último segmento —`APEX-232411-15` → `APEX-15`,
`PA-APEX-232411-03` → `PA-03`— y `Todas las cuentas` → `Todas`. Así cabe entero y no hay
nada que recortar. El nombre completo sigue en el desplegable y en el `title` del botón, y
`AccountFilter.label()` sigue devolviendo el largo.

Dos guardas: si dos cuentas colapsaran en la misma forma corta se muestran **enteras**
(distinguirlas importa más que el ancho), y un nombre de menos de tres segmentos (`Sim101`)
se deja como está. Verificado con el componente real: `APEX-15` · `3 cuentas` · `Todas` ·
colisión → `APEX-999999-15` · `Sim101`.

---

### Tarjetas del Calendario: fuera "Dejé de ganar", entran Targets/Stops

Orden nuevo de `#metricsGrid`: **P&L Neto · Disciplina · Errores · Acierto · Targets /
Stops · Días conectados**.

- **Fuera "Dejé de ganar"** — con la tarjeta se fue todo lo que colgaba de ella y quedaba
  inalcanzable: `openDejeGanarModal()` (36 líneas), el cálculo de `dejeGanarStat` sobre
  `setup_valido_no_tomado` (18 líneas) y su handler de clic.
- **Nueva "Targets / Stops"** — valor `T / S` sobre los trades del período sin break-even,
  color según cuál domina, `sub` con el ratio.
- **`Acierto`** ya no repite `12 targets / 5 stops` en su `sub` (ahora es una tarjeta): pasa
  a decir el tamaño de la muestra, que es lo que le falta a un porcentaje suelto.
- **`Días conectados`** ya no lleva un `Ratio T/S` calculado sobre **días** —dos ratios
  distintos con el mismo nombre en la misma fila— sino `de N días hábiles`.

> **Ojo:** esta rejilla es `metrics-grid-compact`, que oculta `.metric-icon` y `.metric-sub`
> **en todos los anchos**. Así que en Calendario solo se ven etiqueta y valor: los `sub` de
> arriba están en el DOM pero no se pintan, y el icono de una tarjeta nueva da igual cuál
> sea. Verificado en la copia local: las 6 tarjetas en orden, consola limpia.

---

## Checkpoint 2026-08-16d — Cuenta Apex-15, formato de importes y vista del día

### 🔀 La Apex-15 no salía en el calendario

Kris configuró `APEX-232411-15` como cuenta principal y no aparecía en el selector.

**Causa doble.** `SupabaseAutoExport` enruta por nombre de cuenta (`PA-*` y la principal
→ `trades`; el resto → `apex_trades`) y leía `objetivos.cuenta_principal` **una sola vez,
al arrancar**. El 14-ago se operó la -15 a las 09:28, cuando la principal era todavía la
-14, así que el trade fue a `apex_trades`; el cambio de configuración llegó a las 13:12.
Y el selector de cuentas se construye desde las cuentas presentes en `trades`, así que una
cuenta sin trades **no existe como opción** — ni siquiera para ser el default.

- **Datos:** se movió el trade del 14-ago a `trades`. Los del 12 y 13 se quedaron en
  `apex_trades` porque esos días la operativa se replicó en la -14 y el mismo trade ya
  estaba en `trades` bajo esa cuenta: moverlos habría contado la pérdida dos veces.
- **`account-filter.js`:** la cuenta principal **siempre** está en la lista, aunque no
  tenga trades. Arregla Calendario, Análisis y Trades de una vez.
- **`SupabaseAutoExport.cs`:** la cuenta principal se **refresca cada 5 min**. Informa en
  el log solo en la primera lectura y en cada cambio; el timer se libera en
  `State.Terminated`. ⚠️ **Requiere recompilar.**

> ⚠️ **NO duplicar un trade en `trades` y `apex_trades`.** `apex.js` hace
> `[...apex_trades, ...trades].filter(t => t.account === cta.numero_cuenta)` asumiendo que
> cada cuenta vive en UNA sola tabla. Duplicar haría que el Apex Tracker contase el trade
> dos veces e inflase el **drawdown consumido** — el número que decide si la cuenta se
> quema. Con el trade solo en `trades` se ve igual en las dos vistas, que es exactamente
> el caso de la Apex-14.

### 💰 Importes con separador de miles

Helpers **`fmtMiles`** y **`fmtDinero`** en `db.js`, aplicados a los importes del
calendario (día, semana, total del mes), la card P&L Neto, el KPI y la tabla de Análisis
con sus totales, el coste de errores y el P&L de experimentos.

> La agrupación se hace **a mano, no con `toLocaleString('es-ES')`**: en español el
> estándar CLDR no agrupa los números de 4 dígitos, así que 2212 salía `"2212"` y solo
> agrupaba desde `"10.000"`. Se detectó al verificar.
> Ahora: `2212 → +$2.212` · `-1257,66 → −$1.258` · `1234567 → +$1.234.567`

### 🧭 El filtro de cuentas y las flechas de mes suben a la barra superior

`.calendar-header` **desaparece**: el título ya estaba arriba y esa fila solo sostenía esos
dos controles, así que se recupera su alto completo sobre el calendario. También se
quitaron de Análisis y Trades.

- Las flechas `‹ ›` van pegadas al contexto: navegan el dato que se está mirando.
- Los 3 filtros conviven en el header (cada sección tiene su selección persistida) y
  **`Nav.HERRAMIENTAS` + `_pintaHerramientas`** muestran el de la sección activa. Añadir
  una sección es una línea, no lógica nueva.
- En ≤560 px se oculta el nombre de cuenta y queda el icono de cartera.

### 🖼️ Vista del día — 7 ajustes

| Antes | Ahora |
|---|---|
| Dos botones "Volver al calendario" | **Uno**: el pie entero se elimina |
| El de arriba con leyenda | Solo icono (texto en `title`/`aria-label`) |
| Leyenda "Esc para salir" | Fuera — Esc sigue cerrando |
| Fecha en gris, sin estilo de título | **`--accent-txt`, mayúsculas**, como el resto de títulos |
| Recuadro Puntos/Resultado/P&L/Setup a la izquierda | **Centrado** en la pantalla |
| Botón "Ver sesión" | Fuera (iba en el pie) |
| Imagen dentro del scroll | **Fija** bajo la cabecera, a todo el ancho; solo scrollea el texto |
| Análisis del Coach completo y abierto | **Resumen** arriba + "Ver análisis completo" plegado |

- La imagen sale de `.dv-scroll`; `.modal-full` pasa a columna flex y solo el texto
  desborda. Cada día abre con el scroll arriba (antes heredaba el del día anterior).
- El plegado usa el mismo `<details class="cz-det">` que la pestaña del Coach
  (`_bloquePlegable`), así que se ve y se comporta igual.

> ⚠️ **`.modal-header` se declara más abajo con `display:flex`** y ganaba por orden sobre
> `.dv-header`, dejando el recuadro pegado a la izquierda (413 px desviado). Hace falta la
> doble clase **`.modal-header.dv-header`**.

> ⚠️ **Lección de verificación:** la primera prueba de "imagen fija" no valía — el
> contenido era corto, no había scroll y la imagen no se movía trivialmente. Hubo que
> repetirla con contenido largo y un scroll real de 500 px.

Migración: `2026-08-14-mover-trade-apex15-a-trades.sql` (aplicada vía MCP).
Commits: `d3e31ef` · `de45a1b` · `4794a77` · `3e97402`.

---

## Checkpoint 2026-08-16c — Navegación: 6 botones y la pantalla "Otros"

Diseño aprobado y persistido en `docs/disenos/2026-08-16-navegacion-6-botones.md` (v2),
4 fases. Kris lo pidió desde el móvil: no le cabían los botones y tenía que deslizar.

### El diagnóstico

| Qué | El número |
|---|---|
| Botones en la barra | 11 × 60 px = **660 px** de barra contra ~390 px de pantalla |
| Visibles sin deslizar | 6,5 — y la barra de scroll está oculta a propósito, así que nada indicaba que hubiera más |
| Títulos por pantalla | **2**: el de la barra (blanco) y el `.analysis-hero-title` de cada sección (verde, 2,1 rem) |
| Formas de cerrar sesión desde el móvil | **0** — el botón vivía en el pie del sidebar, y ese pie está `display:none` en móvil |

Y el badge "Cuenta Fondeo" del pie era texto fijo escrito a mano que ningún JS actualizaba.

### Lo que se hizo

- **Barra de 6:** Disciplina · Análisis · Calendario · Sesión · Apex · Otros. 360 px, entra
  sin deslizar. Las otras 6 secciones **no se movieron ni perdieron sus ids**: solo cambia
  por dónde se llega. `Nav.PADRE` mantiene "Otros" encendido dentro de ellas y un chevron
  en la barra devuelve — en móvil es la única salida.
- **Un solo título**, el de la barra, en `--accent-txt` y mayúsculas. Fuera los 11 heroes y
  su CSS. El dato variable (mes del Calendario, filtro de Imágenes, rango de Disciplina) va
  a `Nav.setContexto`, que lo guarda **por sección**: `go()` no re-renderiza el Calendario
  al volver, así que limpiarlo dejaba la barra sin el mes.
- **Ajustes dentro de Otros:** claves y objetivos (abre el modal de siempre, sin tocarlo),
  tema (fila inerte, ver D-010), seguridad (cambiar contraseña vía `supa.auth.updateUser`)
  y cerrar sesión — que así **vuelve a existir en el móvil**, con el email de la sesión
  debajo en lugar del badge que mentía.
- **"NQ Journal" → "Trading Journal"** en los 6 sitios; `CACHE` a v6 para que el service
  worker no siga sirviendo el HTML viejo.

### Verificación

Las 12 secciones abren y ninguna tiene ya título duplicado. A 390 px: barra sin scroll
(contenido 390 = visible 390), sin scroll horizontal de página, filas de Ajustes de 59-60 px
(mínimo táctil 44). Contexto probado navegando meses en Calendario —incluido **volver desde
otra sección y encontrarlo intacto**—, filtrando en Imágenes y cambiando período en
Disciplina. Validaciones del cambio de contraseña probadas; **el cambio real no**, porque
habría cambiado la contraseña de verdad.

### Lo que NO entró

El tema claro (D-010) y convertir "Cuenta Fondeo" en un dato real: se borró en vez de
arreglarlo, y mostrar la cuenta principal de Apex sigue siendo otro encargo.

---

## Checkpoint 2026-08-16b — Reestructuración documental

Cambio de **orden**, no de funcionalidad: la app no se toco. Diseno aprobado y
persistido en `docs/disenos/2026-08-16-reestructuracion.md` (v4), 6 fases.

### El diagnostico

El `CLAUDE.md` habia crecido a 259 lineas mezclando cinco cosas —referencia,
invariantes, post-mortems, changelog y flujo de trabajo— y se cargaba entero en cada
sesion. La memoria automatica describia el proyecto por su cuenta y se habia quedado en
julio: **seis datos tenian dos o tres respuestas distintas** segun donde miraras.

| Dato | Decia | La verdad |
|---|---|---|
| Modelo de IA | sonnet-5 / haiku-4-5 / sonnet-4-6 | `claude-sonnet-5` |
| Seguridad BD | "RLS activado" y "RLS deshabilitado" | activo en las 18 tablas |
| `fomc_dates`, `apex_registros`, `estrategia_chaumer` | documentadas como vivas | borradas |
| Triggers del checklist | descritos funcionando | eliminados el 16 ago |
| Stop maximo | 60 puntos y 80 puntos | 80 puntos |
| Nº de tablas | 17 | 18 |

Ademas: 3.627 lineas de manuales describiendo la app de tres secciones, dos checkpoints
titulados igual, 122 permisos literales (uno con la clave anon dentro) y los disenos
aprobados viviendo solo en el chat.

### Lo que se hizo

- **`CLAUDE.md` 259 -> 149 lineas.** Adopta 5 secciones con nombre estable
  (Invariantes / Verificacion / Diseno / Datos / Lenguaje visual) que son el **contrato**
  que leen los skills genericos.
- **`.claude/rules/`** con `paths:`: las 7 reglas de oro de la disciplina y las
  invariantes del Coach, de Sesion Operativa y de NinjaTrader cargan **solo al abrir el
  archivo al que afectan**. No se pierden; dejan de pagarse siempre.
- **Memoria de 11 archivos a 2.** Guarda al usuario, no al proyecto: lo que describe el
  proyecto se fue al repo, que cambia en el mismo commit que el codigo.
- **`docs/decisiones.md`**: 9 decisiones con su porque, que antes habia que deducir.
- **`tasks/`**: los pendientes salen del `CLAUDE.md`, porque cambian cada semana.
- **4 skills genericos** en `~/.claude/skills/`, sin una sola mencion a este proyecto.
- **Tokens CSS**: 19 -> 26, 140 -> 45 literales. Ni un color cambio.

### Lo que NO se toco

El comportamiento de la app, el criterio de disciplina, el P&L neto, la zona horaria, las
invariantes del Coach, `upsertSesion`, y la decision cerrada del 24 jul sobre las 6
reglas de feb-may. Y la estructura de `js/` / `index.html` / `styles.css`, que se
analizo y se aplazo con su propio diseno (ver `tasks/backlog.md`).

### Falsa alarma y un bug real (16 ago)

Al verificar la Fase 6 reporte que el registro del **service worker** fallaba. Era falso:
lo bloqueaba el navegador embebido de la prueba. La prueba de control fue registrar
`manifest.json` como SW y obtener el mismo error — un JSON deberia fallar por MIME type.

Pero el analisis destapo un bug real: **`APP_SHELL` en `sw.js` era codigo muerto**. Se
declaraba y no se usaba en ningun sitio (`install` solo precacheaba el CDN), listaba
`js/annual.js` —que ya no existe— y le faltaban 6 archivos que si. La PWA no abria sin
conexion en la primera visita. Arreglado: `install` precachea 28 entradas y `CACHE`
sube a `nqjournal-v5`. **Verificado por Kris en Chrome: 28 entradas en Cache Storage.**

---

## Checkpoint 2026-08-16 — Sesión Operativa: tres pantallas en una

Para entender un día había que recorrer **cuatro** pantallas (Calendario, Sesión,
Historial y Coach IA) y varios datos se pedían dos veces. Ahora son **dos**.

### Sesión Operativa (`section-register`, menú "Sesión")

Absorbe lo que eran tres entradas de menú. Cabecera común (fecha + el recuadro de
resultado **Resultado · Puntos · P&L · Setup**) y **tres pestañas**:

| Pestaña | Qué es |
|---|---|
| **Diario** | El formulario de registro de siempre |
| **Coach IA** | Las 3 etapas del Coach |
| **Días anteriores** | El índice del diario (era la sección Historial) |

- **Una sola fecha** manda sobre las tres. Antes Sesión y Coach llevaban cada uno
  la suya y no se hablaban. `SesionOperativa` (en `app.js`) controla pestañas y
  cabecera; `Coach.setFecha(date)` recibe la fecha desde el Diario.
- `Nav.go('coach')` y `Nav.go('historial')` **siguen valiendo**: son alias que
  abren esta sección y su pestaña (`Nav.TAB_ALIAS`). No romper esto.
- El markup del Coach se movió **conservando todos sus ids**, así que `coach.js`
  no se enteró del cambio.
- El Coach se inicializa la primera vez que se abre su pestaña, no al arrancar.

### Vista del día (antes modal del calendario)

El modal de 3 pestañas (Gráfica/Resumen/Operativa) pasa a **pantalla completa**,
un solo scroll, sin pestañas: gráfico → *Tu reflexión* → *Análisis del Coach* →
Veredicto → Errores → Aprendizaje → Notas. Se cierra con `Esc` o los botones.
Se eliminaron `_renderResumen` y `_renderOperativa` (191 líneas muertas).

### Datos que cambiaron de sitio

- **Emoción (llegada y cierre) y confianza** se registran en el **Diario**, no en
  el Coach. Llegada y confianza → `sesiones`; la de cierre → `diagnosticos_diarios`.
  ⚠️ El Coach **ya no manda esos campos** al guardar: con sus selectores retirados
  enviaría `null` y borraría lo que puso el Diario.
- **Noticias**: se retira el textarea libre `sesiones.noticias`. Todo vive en
  `sesion_noticias` (varias por día). El texto viejo se migró
  (`2026-08-16-migrar-noticias-texto.sql`) y la columna **no se borró**.
  El 14 y 15 de julio pasaron de una hora a dos: la ventana de ±5 min de la
  publicación de la mañana no se estaba vigilando.

### Reglas de oro que salieron de los bugs de esta sesión

- **NO filtrar por `cuenta_principal` al mostrar días.** La cuenta de Apex rota
  (la -14 pasó a la -15); filtrar por la de hoy vacía todo el histórico anterior.
  `trades` ya contiene solo la operativa del journal.
- **`preloadCatalogos` trae la cuenta principal.** Sin eso, `cuentaPrincipal()`
  devuelve el fallback histórico y el Coach analiza la cuenta equivocada.
- **Nada interactivo dentro de `#sessionFieldset` funciona en modo lectura**: el
  fieldset se deshabilita entero. Los desplegables de fase del checklist son
  `role="button"`, no `<button>`, por esto.
- **Ojo con los `;` al insertar código**: `updateCierreMeta()` seguido de un array
  literal se leyó como `updateCierreMeta()['expSNTList']` y reventaba al guardar.
  `node --check` NO lo detecta: es sintaxis válida con otro significado.
- **En lectura no se dibujan campos vacíos** (`marcarVacios` + `.vacio-en-lectura`).
  Al ocultar grupos de botones sin opción elegida, comprobar que no arrastren
  listas: los T/S de errores y experimentos se llevaban por delante sus listas.

### Diseño

La maqueta aprobada está en el artefacto de la propuesta. **Es la fuente de
verdad**: en esta sesión se implementó otra cosa y hubo que rehacerlo. Claves:
título de tarjeta verde en mayúsculas y sin icono, barra de cumplimiento gruesa
con rótulo centrado, fases como filas con acento de color, y "La operación" con
recuadros `CONTEXTO · CORRIDA · RETROCESO · ZONAS EN CONTRA` + tabla de trades.

### Pendiente

- Llevar el mismo lenguaje visual a las pestañas **Coach IA** y **Días anteriores**
  y al resto de la app (calendario, disciplina, análisis) — siguen con el estilo viejo.
- Los manuales (`manual-tecnico.md`, `manual-usuario.md`, `arquitectura-*.md`)
  describen el modelo viejo de 3 secciones separadas.
