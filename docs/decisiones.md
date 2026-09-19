# Decisiones del proyecto

> Por qué las cosas son como son. Cuando dentro de seis meses te preguntes "¿por qué
> hicimos esto así?", la respuesta está aquí y no hay que deducirla del código ni bucear
> en 1.900 líneas de historial.
>
> **Formato:** decisión · motivo · alternativas descartadas · fecha. Una entrada por
> decisión, la más reciente arriba. No se reescriben: si una decisión se revierte, se
> añade una entrada nueva que la sustituye y se marca la vieja como *Sustituida*.

---

## D-018 — `trades` es el journal de UNA cuenta; `apex_trades` tiene todas las de Apex

**Decisión.** Desde el 18 de septiembre de 2026, `trades` guarda **solo la operativa de la
cuenta principal** bajo una única etiqueta (`Sim101`), con la cuenta real conservada en la
columna nueva `cuenta_origen`; y `apex_trades` guarda **todas** las cuentas de Apex con su
nombre real. **`apex.js` deja de leer `trades`.**

**Sustituye** al invariante anterior *"un trade vive en UNA tabla, nunca en las dos"*. Ese
invariante existía porque `apex.js` concatenaba ambas tablas y filtraba por cuenta, así que
una fila repetida se contaba dos veces. Al dejar de concatenar, la razón desaparece — pero
nace una regla nueva: **si `apex.js` vuelve a leer `trades`, el drawdown consumido se
infla**, que es lo que decide si una cuenta se quema.

**Motivo.** El histórico estaba partido en cuatro cuentas que se sucedieron en el tiempo
(PA-03 → Apex-14 → Apex-15 → Sim101), porque cada una fue la principal durante un tramo. No
se solapan: es una línea continua de operativa a la que solo le cambiaba la etiqueta, pero
Calendario y Análisis la mostraban troceada y había que ir eligiendo cuenta en el filtro
para ver el año entero. Con una sola etiqueta, el año se lee seguido.

**Alternativas descartadas.**

- **Copiar `apex_trades` → `trades`** para "ver todo junto". Es lo que parecía pedir el
  caso, y habría sido un error: de los 21 días de `apex_trades`, **20 ya existían en
  `trades`** — la misma operativa replicada en dos cuentas con distinto número de contratos
  (18-sep: +$86,96 en `trades` frente a +$1.067,96 en `apex_trades`). Habría contado esos
  días dos veces mezclando tamaños.
- **Renombrar en `trades` sin copiar a `apex_trades`.** Dejaba vacías las tarjetas PA-03
  (80 trades), Apex-14 (12) y Apex-15 (6), que leían su operativa de `trades`.
- **Dejarlo todo igual y usar "Todas las cuentas"** en el filtro. Funciona, pero el default
  es la cuenta principal y hay que cambiarlo en cada visita.

**Coste asumido.** El mismo trade existe en las dos tablas cuando se operó en una cuenta de
Apex que era la principal. Es deliberado: son dos contabilidades distintas, no una copia por
descuido. La integridad depende de que `apex.js` no vuelva a leer `trades`, y eso está
escrito en el propio `apex.js`, en `CLAUDE.md` y aquí.

**Pendiente.** Cuando la cuenta real sea la principal **y** esté dada de alta en
`apex_cuentas`, sus trades irán a `trades` por el routing de NT8 y el Apex Tracker no los
verá. Se resuelve con un trigger `after insert` en `trades`, sin recompilar NinjaTrader.
Mientras la principal sea `Sim101` —que no es cuenta de Apex— no hace falta.

**Fecha.** 18 sep 2026 · Diseño: `docs/disenos/2026-09-18-cuenta-unica-en-trades.md`

---

## D-018 — Dos setups: Continuación y Reingreso; la apertura deja de distinguirse

**Decisión.** Desde el 18 de septiembre de 2026 la estrategia tiene **dos familias**
—`continuacion` y `reingreso`— y **cuatro variantes** (cada una en sus dos direcciones).
Los cuatro setups IRI se funden así: *IRI Apertura Alcista* y *IRI Continuación Alcista* →
**Continuación Alcista**; lo mismo en bajista. Los reingresos no cambian.

**Motivo.** Petición de Kris: simplificar. Apertura y continuación **compartían las cuatro
reglas de Fase 2**; lo único que las separaba era el momento de la sesión, que no cambiaba
ni la lectura ni la ejecución. Dos etiquetas para la misma operativa solo repartían el
histórico en dos montones más pequeños y hacían más difícil ver un patrón.

**Alcance.** Migración `2026-09-18-setups-continuacion-reingreso`: renombra la familia
`iri` → `continuacion` y sus dos variantes de continuación (las claves foráneas son
`ON UPDATE CASCADE`), mueve las 23 filas de apertura (19 sesiones + 4 operativas de
Chaumer), borra las dos variantes de apertura y pasa las 4 reglas de Fase 2 a la familia
nueva. Respaldos en `_bak_20260918_*`. En código: el fallback por prefijo de `db.js`, la
lista de respaldo del bot de Telegram y la del AddOn `ChecklistChaumer` de NT8.

**Coste asumido.** En el histórico ya **no se puede separar** una apertura de una
continuación: 19 sesiones y 4 operativas de Chaumer quedaron fundidas. Kris lo aceptó
sabiéndolo; la vuelta atrás solo es posible desde los respaldos.

**Lo que NO se tocó.** Los textos de las reglas siguen diciendo *IRI* y *estructura I-R-I*:
describen la mecánica Impulso-Retroceso-Impulso, no el nombre del setup. Tampoco
`diagnosticos_diarios.setups_json`, que es la prosa que el Coach escribió cada día.
*(18 sep 2026)*

---

## D-017 — Las horas del comparador de Chaumer van en hora Colombia, no en ET

**Decisión.** Desde el 17 de septiembre de 2026, `chaumer_operativas.hora_entrada` se guarda
y se muestra en **hora de Colombia**, igual que `trades.entry_time`, y las dos se restan
sin convertir. **Sustituye** la parte de horas del diseño del comparador (§1.3), que las
llevaba a ET con `horaEt()`.

**Motivo.** Kris registra su operativa en hora Colombia y la de Chaumer la veía
«adelantada». Al revisar las 22 filas estaban **mezcladas**: 5 en ET, 5 en hora Colombia y 5
que podían ser cualquiera de las dos. Pedirle que convierta cada vez a ET es justo lo que
falló; escribir la hora que ve en su reloj no falla.

**Alternativa descartada.** Mantener ET y convertir la hora de Kris al mostrarla. Es lo que
había, y es lo que produjo los datos mezclados: el formulario decía «(ET)» y aun así la
mitad de las filas llegaron en hora local.

**Coste asumido.** 5 filas dudosas se quedan como hora Colombia sin poder confirmarlo
(decisión de Kris), y la del 28 ago (21:52) es errónea en cualquiera de las dos zonas. Las 5
seguras se corrigieron con la migración `2026-09-17-chaumer-hora-colombia` (respaldo en
`_bak_20260917_chaumer_horas`). *(17 sep 2026)*

---

## D-016 — La cuenta principal pasa a ser Sim101; las Apex solo alimentan el Tracker

**Decisión.** Desde el 2 de septiembre de 2026, `objetivos.cuenta_principal = 'Sim101'`. El
Journal —P&L, Análisis, Coach y las notificaciones de Telegram— se alimenta de la operativa
en simulador. Las cuentas de evaluación Apex que no sean la principal van solo a
`apex_trades` y se ven en el Apex Tracker, con su balance y su drawdown. Se opera **en
espejo**: el mismo trade se ejecuta en las dos cuentas.

**Motivo.** Kris va a operar unos **3 meses en Sim101** mientras abre una cuenta real. Sigue
operando Apex en paralelo, pero lo que quiere medir como proceso —disciplina, setups,
diagnóstico del Coach— es la operativa completa, y la evaluación Apex ya tiene su propio
tablero donde lo que importa es el drawdown consumido.

**Consecuencia asumida.** El P&L del Journal pasa a ser **dinero simulado**. Mientras el
tamaño de las dos cuentas coincida las cifras son equivalentes, pero si divergen, el número
que se ve al abrir el dashboard deja de ser el dinero real; el real solo estará en el
Tracker. El filtro de cuentas permite separarlos, pero el valor por defecto y el Coach ya no
distinguen.

**Alternativa descartada.** Dejar la Apex como principal y registrar los días de Sim a mano,
como se hizo el 1 de septiembre. Funciona pero depende de acordarse cada día, y el Coach
seguiría analizando una cuenta que ya no es donde se está trabajando el proceso.

**Nota operativa — no basta con cambiar la cuenta principal.** El indicador
`SupabaseAutoExport` excluye las cuentas de simulación cuando **"Registrar todas las cuentas
conectadas" está ON** (`if (RegistrarTodas && EsCuentaSimulada(acc)) continue;`), y esa
decisión se toma **al suscribirse a las cuentas**, antes incluso de haber leído cuál es la
principal —esa lectura es asíncrona—. Para que Sim101 se registre hay que dejar esa casilla
**OFF** y ponerla en un slot `Cuenta N`: ahí la intención es explícita y el indicador sí la
monitoriza. Cambiar la casilla **no requiere recompilar**: NinjaTrader recarga el indicador
al tocar una propiedad.

**Revisar** cuando se abra la cuenta real: probablemente esta decisión se sustituya por otra
que devuelva la principal a una cuenta con dinero.

**Fecha.** 2026-09-02.

---

## D-015 — Las zonas naranjas se capturan en el AddOn, y el bot deja de mandarlas

**Decisión.** Los soportes y resistencias naranjas se escriben en el AddOn
`ChecklistChaumer`, en premercado. El bot de Telegram deja de preguntarlos **y deja de
enviar `soportes_naranja` / `resistencias_naranja` en su payload**. La web los conserva.

**Motivo.** Las zonas se marcan en el gráfico antes de la apertura; escribirlas ahí mismo,
con el gráfico delante, es más fiable que reconstruirlas de memoria por la noche. Y llegan
mejores al Coach IA, que las cruza con PDH/PDL y el premercado.

Lo segundo no es cosmético: el bot enviaba `data.soportes_naranja ?? []` en **cada**
guardado. Quitarle las preguntas sin quitarle las claves habría convertido el registro
nocturno en un borrado silencioso de lo escrito por la mañana. Es el mismo motivo por el
que el bot ya no manda los niveles de precio, y por el que la web sí puede seguir
mandándolos: la web **carga** la sesión antes de guardar (`form.js`), así que hace ida y
vuelta; el bot construye el payload desde cero.

**Alternativa descartada.** Dejar las dos vías abiertas "por si acaso". Garantiza el
borrado silencioso: el dato correcto existe, se guarda por otra vía, y desaparece sin
ningún error.

**Fecha.** 2026-08-31.

---

## D-014 — RR es un clon de la herramienta de NinjaTrader, no una modificación

**Decisión.** La herramienta que mide el riesgo en puntos es un archivo **nuevo**
(`NinjaTrader/RR.cs`) con su propia clase, su propio enum y sus propios métodos `Draw`.
`@RiskReward.cs` no se toca ni una línea.

**Motivo.** Dos razones independientes, cada una suficiente:

1. NinjaTrader **sobrescribe** los archivos que empiezan por `@` en cada actualización. Un
   cambio ahí no es que sea arriesgado: es que se pierde solo.
2. La propiedad de unidades es de tipo `ValueUnit`, un enum **compilado dentro de las DLL de
   NinjaTrader** (Price · Percent · Ticks · Currency · Pips). No admite un valor nuevo, así
   que "añadir Points" no era una opción ni tocando el original. `RR` declara `RRUnit`, con
   solo las dos unidades que se usan.

**Alternativas descartadas.** Modificar el original (se pierde en la siguiente
actualización). Usar `Cbi.PerformanceUnit`, que sí incluye `Points`: obligaría a mostrar
también Percent, Pips y Ticks en el desplegable, justo lo que se quería quitar. Y el
`AdvancedRiskRewardBrunoMezaV3` que ya estaba instalado: se distribuye solo compilado, con
licencia, y no mide en puntos (0 apariciones de "puntos" en el DLL).

**Fecha.** 2026-08-25. Sombreado de las zonas de stop y target: 2026-08-31.

---

## D-013 — La sesión nace con el checklist vacío: sin fila = N/A

**Decisión.** Se eliminan los dos triggers que materializaban el checklist
(`trg_materializar_checklist` y `trg_backfill_regla`). Una sesión nueva no crea ninguna
fila en `sesion_checklist`: las filas aparecen cuando el trader marca. Una casilla que no
se marca **no se da por cumplida**. El histórico ya escrito no se toca.

**Motivo.** El diseño "todo `true` por defecto" (jul 2026) tenía un efecto que no se vio
venir: `SupabaseDailyLevels` crea la fila de `sesiones` al abrir el RTH, el trigger
materializaba las 18 reglas en `true`, y el AddOn —que hace poll cada 5 s— **aparecía con
todo marcado al abrir el mercado** y luego lo persistía como si lo hubiera marcado el
trader. La disciplina de esos días salía al 100 % sin que nadie tocara una casilla.

"Sin fila = N/A" no es un invento nuevo: es como ya leían el checklist
`calcDisciplinaStats` y `_checklistDia`. Los triggers estaban peleados con el resto del
sistema.

**Alternativas descartadas.** Parchear solo el AddOn para que "reclamase" la sesión antes de
que llegara el indicador: deja la causa viva para cualquier otro escritor (bot, web) y
depende de quién gane la carrera. Cambiar el default del trigger a `false`: convertiría en
incumplido un día que simplemente no se registró, que es la otra forma de mentir.

**Nota.** No contradice la decisión del 24 de julio sobre feb–may: aquella habla de filas de
relleno **ya escritas**, que siguen intactas. Esta habla de las que se crean a partir de
ahora.

**Fecha.** 2026-08-16.

---

## D-012 — El comparador de Chaumer mide en PUNTOS, no en dinero

**Decisión.** El eje de comparación entre las operativas de Chaumer y las de Kris son los
**puntos**. El dinero aparece solo del lado de Kris y como dato secundario; nunca se
comparan importes.

**Motivo.** No operan el mismo tamaño ni la misma cuenta. «Él hizo $600 y tú $77» no dice
si Kris lo hizo bien: dice que llevaba menos contratos. La misma operativa da importes
distintos según el número de contratos y el multiplicador, mientras que los puntos son la
misma unidad para los dos. El proyecto ya tenía este criterio para el riesgo (el stop se
mide en puntos, invariante del `CLAUDE.md`); esto lo extiende al resultado.

Los puntos de un trade se calculan en `puntosTrade()` (`db.js`) desde `entry_price` /
`exit_price` según la dirección. Comprobado contra el trade 107: 20 puntos × 2 contratos
MNQ × $2 − $2,04 de comisión = $77,96, exactamente el `profit` neto guardado.

**Alternativa descartada.** Normalizar el dinero a «por contrato». Sigue dependiendo del
multiplicador de cada cuenta y añade una división que hay que explicar cada vez.

**Fecha.** 2026-08-19.

---

## D-011 — Del comparador solo se guarda el lado de Chaumer; el veredicto se calcula

**Decisión.** `chaumer_operativas` guarda **únicamente** las operativas de Chaumer. El lado
de Kris se lee de `sesiones` + `trades`. Y el veredicto de cada día
(Igual / Ejecución / Otra lectura / Fuga / De más / Ambos fuera / Sin cargar) **no se
persiste**: se recalcula al pintar. El «por qué no entré» se escribe en
`sesiones.motivo_no_entrada`, el campo que ya rellena el Diario.

**Motivo.** Duplicar la operativa de Kris habría creado dos copias del mismo hecho que se
desincronizan — el problema que este proyecto ya sufrió con el criterio de disciplina
replicado en cuatro sitios. Y un veredicto guardado se queda obsoleto en cuanto cambia
cualquiera de sus tres fuentes, sin dar ningún error: seguiría diciendo «Igual» sobre un
día que ya no lo es.

**Alternativas descartadas.**
- *Guardar el veredicto* para ahorrar cálculo. El cálculo es trivial y el coste de un
  número silenciosamente falso es alto.
- *Un campo propio para el motivo de no entrada*. Habría partido en dos el mismo dato y
  dejado al Coach y a Disciplina leyendo solo la mitad.

**Fecha.** 2026-08-19.

---

## D-010 — El tema claro se aplaza; en Ajustes solo queda la fila, marcada "Pendiente"

**Decisión.** No se construye el tema claro. La fila **Tema** existe en Otros › Ajustes
pero es **inerte**: sin interruptor, sin `[data-theme]`, sin `localStorage`, y `styles.css`
no gana ni una regla de tema. Es un recordatorio visible, no una función a medias.

**Motivo.** Se midió el CSS antes de decidir, y el sistema de color no gobierna lo
suficiente como para soportar un segundo tema:

| Fuera del `:root` | Cuántos | Qué pasaría en claro |
|---|---|---|
| `rgba(255,255,255,…)` | **82** | Bordes, hovers y separadores blancos **sobre fondo blanco: invisibles** |
| Colores hex a mano | **44** | Pensados para fondo oscuro: chillones o lavados |
| Estilos incrustados en el HTML | **66** | No responden a tokens en absoluto |
| Colores de gráficas | 5 en `charts.js` + 4 en `disciplina.js` | Chart.js pintaría igual que hoy |

Calendario, Disciplina, Análisis y el Coach se verían a trozos. Y **media pantalla migrada
se ve peor que ninguna**: parece un error, no una transición.

**Alternativas descartadas.** *Poner el interruptor igualmente* — Kris lo pidió así al
principio y se implementó como fila inerte tras ver los números; un tema roto a trozos
habría parecido un bug, no un trabajo en curso. *No poner nada* — se pierde la señal de que
está pedido y pendiente.

**Para retomarlo:** primero consolidar esos 82 blancos y 44 hex en tokens, después migrar
**pantalla completa por pantalla completa**, y solo al final encender el interruptor. Orden
en `.claude/rules/estilos.md`; números vivos en `tasks/backlog.md`.

**Fecha.** 2026-08-16 · Detalle: `docs/disenos/2026-08-16-navegacion-6-botones.md` §7

---

## D-009 — Los skills son genéricos y de usuario, no duplicados por proyecto

**Decisión.** Los skills de proceso (`flujo-desarrollo`, `lenguaje-visual`,
`base-de-datos`, `documentacion`) viven en `~/.claude/skills/` y sirven en cualquier
proyecto. Cuando necesitan un dato del proyecto, lo leen del `CLAUDE.md` vía un contrato
de 5 secciones con nombre estable.

**Motivo.** Kris tiene tres proyectos. Cuatro skills × tres proyectos = doce archivos a
sincronizar, que es el mismo problema de verdad duplicada que la reestructuración vino a
eliminar. Y un dato del proyecto guardado en `~/.claude/` queda fuera del repo: la paleta
se desincroniza del CSS que describe en cuanto cambia un color, sin que nada avise.

**Alternativas descartadas.** Duplicar los skills por proyecto (descartada explícitamente).
Meter los datos del proyecto dentro del skill (mismo problema de desincronización).

**La costura:** si el contenido cambia al cambiar de proyecto, es un DATO y va al repo. Si
no cambia, es PROCESO y va al skill.

**Fecha.** 2026-08-16 · Detalle: `docs/disenos/2026-08-16-reestructuracion.md`

---

## D-008 — El checklist nace limpio, no marcado en `true`

**Decisión.** Eliminados los triggers `trg_materializar_checklist` y `trg_backfill_regla`.
Una sesión nueva no crea filas en `sesion_checklist`, y una regla nueva no se autorrellena
en el histórico. **Sin fila = N/A**: `calcDisciplinaStats` ignora los ítems no registrados.

**Motivo.** El trigger metía las 18 reglas en `true` al nacer la fila de `sesiones`. Como
`SupabaseDailyLevels` crea esa fila al abrir el RTH, **el AddOn se auto-marcaba solo en la
apertura** (poll de 5 s) y luego persistía esos `true`. La disciplina medía un checklist
que nadie había respondido.

**Alternativas descartadas.** Materializar en `false` — habría contado como incumplidas
reglas que simplemente no se registraron.

**Fecha.** 2026-08-16 · Migración: `docs/migrations/2026-08-16-checklist-sin-materializar-en-true.sql`

---

## D-007 — Las 6 reglas de feb–may se quedan como están

**Decisión.** `rei_zona`, `chk_contexto`, `chk_no_mover`, `rr_1a1`, `stop_max_puntos` y
`target_sin_zonas` nacieron con el rulebook de junio, así que sus filas de **feb–may son
relleno en `true`** (288 ítems). **No se limpian.**

**Motivo.** Limpiarlas bajaría la disciplina global de **81,5% a 75,1%** y rompería la
comparabilidad con el histórico que Kris ya venía mirando. La disciplina de feb–may está
inflada **por diseño aceptado**; se lee con esa salvedad.

**Alternativas descartadas.** Borrar las filas (rompe la serie). Marcarlas `false` (miente
en el otro sentido).

**Fecha.** 2026-07-24 · **CERRADO — no volver a proponerlo.**

---

## D-006 — La cuenta principal es configurable, no está fija en el código

**Decisión.** `objetivos.cuenta_principal` guarda la cuenta que alimenta P&L, Análisis,
Disciplina y Coach. Se elige en Datos. El indicador `SupabaseAutoExport` la lee de Supabase
al arrancar y rutea hacia `trades` tanto las cuentas `PA-*` como esa, aunque sea una
evaluación sin prefijo.

**Motivo.** Estaba hardcodeada como `PA-APEX-232411-03` en `coach.js`. Kris quemó esa
cuenta y compró otra: las cuentas de fondeo **rotan**, y cada rotación exigía tocar código.
Ahora basta elegirla en Datos y reiniciar NinjaTrader — sin recompilar.

**Consecuencia importante:** por eso **NO se filtra por cuenta principal al mostrar los
trades de un día**. Filtrar por la de hoy vaciaría todo el histórico anterior.

**Fecha.** 2026-07-21 · Migración: `docs/migrations/2026-07-21-objetivos-cuenta-principal.sql`

---

## D-005 — El riesgo se mide en PUNTOS, no en dólares

**Decisión.** El límite de stop es `objetivos.stop_max_puntos` (80). `limite_perdida_dia`
($150) queda **obsoleto** como regla de proceso: es control de capital de Apex.

**Motivo.** Con varios contratos el dólar escala y el mismo error de proceso da una cifra
distinta. El punto es invariante. Además **$ por punto depende del contrato: MNQ = $2,
NQ = $20** — normalizar mal el MAE lo infla ×10 en NQ, y ya llevó a una conclusión falsa.

**Fecha.** Jun 2026 (el stop pasó de 60 pts/$120 a 80 pts)

---

## D-004 — La disciplina se calcula en un solo sitio: `js/db.js`

**Decisión.** Todo el criterio (`discContexto`, `esDiaHabil`, `sesionOpero`,
`discFactorAplica`, `reglaAutoResultado`, `maeEnPuntos`, `reglaCumplida`,
`calcDisciplinaStats`…) vive en `db.js`. `metrics`, `charts`, `calendar`, `disciplina`,
`app` y `coach` **delegan**.

**Motivo.** Estuvo duplicado en 4 sitios y se desincronizó: la misma métrica daba números
distintos según la pantalla desde la que la miraras.

**Fecha.** Ago 2026 · Detalle: `.claude/rules/disciplina.md` · `docs/Disciplina.md`

---

## D-003 — RLS activo + `service_role` para bot, Worker e indicadores

**Decisión.** RLS activado en todas las tablas de `public`, con una política única
`auth_all` para el rol `authenticated`. `anon` sin políticas → la clave pública que viaja
en el JS no lee ni escribe nada. Bot, Worker `/api/session` e indicadores NT8 usan
`service_role`.

**Motivo.** La `anon key` viaja en el JavaScript público de GitHub Pages. Sin RLS,
cualquiera con esa clave podía leer y escribir toda la base de datos.

**Alternativas descartadas.** Dejarlo abierto por ser un proyecto personal — el repo es
privado, pero la clave publicada no.

**Fecha.** 2026-06-24 · Plan: `docs/archivo/plan-seguridad-rls.md`

---

## D-002 — `profit` es NETO y `commission` es el round-trip

**Decisión.** `trades.profit` lleva la comisión round-trip **ya descontada**.
`trades.commission` guarda ese round-trip completo.

**Motivo.** Convivían las dos convenciones según el origen del dato, y los totales no
cuadraban entre pantallas.

**Fecha.** Jun 2026

---

## D-001 — Supabase + JS vanilla + GitHub Pages, sin frameworks

**Decisión.** Frontend HTML/JS vanilla servido por GitHub Pages, Supabase como base de
datos, Cloudflare Workers para lo que necesita servidor. **Sin frameworks ni bundler.**

**Motivo.** Arquitectura 100% serverless por ~$0,40/mes, deploy con un `git push` y sin
paso de build que pueda romperse. Compatibilidad directa con GitHub Pages.

**Alternativas descartadas.** React/Vue + bundler (añade build, dependencias y
mantenimiento a un proyecto de un solo desarrollador). Backend propio (coste y servidor
que mantener).

**Coste asumido:** sin módulos, el acoplamiento va por ids del DOM y los archivos crecen
(`coach.js` 2.136 líneas). Es el precio conocido de la decisión, no un descuido.

**Fecha.** Mayo 2026
