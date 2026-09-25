# Decisiones del proyecto

> Por qué las cosas son como son. Cuando dentro de seis meses te preguntes "¿por qué
> hicimos esto así?", la respuesta está aquí y no hay que deducirla del código ni bucear
> en 1.900 líneas de historial.
>
> **Formato:** decisión · motivo · alternativas descartadas · fecha. Una entrada por
> decisión, la más reciente arriba. No se reescriben: si una decisión se revierte, se
> añade una entrada nueva que la sustituye y se marca la vieja como *Sustituida*.

---

## D-028 — El plan de Chaumer se trabaja desde Claude Code; Cowork deja de existir

**Decisión (Kris, 25/09/2026).** El plan (`chaumer/01_Plan`), el test ciego, `lector.py`/`dia.py` y los
diagramas del método se trabajan desde Claude Code. `01_Plan` deja de ser de solo lectura y pasa a ser
**de escritura con aprobación**:
- Un cambio del plan solo entra con el **sí de Kris, cambio a cambio — erratas incluidas**.
- Va en su propio commit `plan: …`, nunca mezclado con portal o Journal, y sube la versión (`ESTADO.md` y
  la tabla de versiones de `TRADING_PLAN_CHAUMER.md`).
- No está cerrado hasta sincronizarlo: `sincronizar.mjs`, los dos SQL con sus huellas, `npm run verificar`
  del portal y, si tocó `lector.py`, la regresión del motor.
- **`PROPUESTAS_AL_PLAN.md` y `PENDIENTE_PORTAL.md` se archivan** (`docs/archivo/chaumer/`). Lo que se vea
  del plan trabajando en otra cosa se le dice a Kris en el momento o va a `tasks/current.md`: no se corrige
  de paso.
- Los diagramas los genera Claude Code en una sesión del plan y Kris los revisa uno a uno antes de
  colocarlos.
- El test ciego se hace en una sesión nueva que no lee `mio/` ni ninguna tabla de Kris de ese día hasta
  haber entregado (`test_ciego/LEEME_BACK_DIARIO.md`).

**Motivo.** Una sola herramienta en vez de dos. Un cambio del plan llega al Coach y al portal en la misma
sesión, en vez de quedarse «pendiente de Cowork»: el 25/09 había cinco así, uno desde el 08/09.

**Consecuencias asumidas.**
- La separación entre quien escribe el plan y quien escribe el código deja de ser de herramienta y pasa a
  ser de procedimiento: el sí de Kris y el commit `plan:`. `git log -- chaumer/01_Plan` es ahora el registro
  de los cambios aprobados.
- La ceguera del test ciego depende de instrucciones, no de un candado: Claude Code tiene a mano el MCP de
  Supabase y `mio/`, que Cowork no veía.
- El texto del Coach (`INSTRUCCIONES_PLAN`) cambió: la caché del bloque A se reescribe una vez.
- El comentario de `plan_documentos` se actualizó (`2026-09-25-plan-sin-cowork.sql`).

**Descartado.** Mantener la bandeja de propuestas, en `04_Web/` o subida a `chaumer/` (Kris: se archiva, «ya
que estamos haciendo otra reestructuración»). Que la aprobación la compartiera Alfredo en los cambios de
metodología. Que Claude corrigiera la redacción sin preguntar: el cambio de metodología que se coló una
vez entró justo así.

**Sustituye** a la parte de D-024, D-025 y D-026 —y a la regla 4 del diseño de unificación— que asignaba el
plan y el motor a Cowork.

**Fecha.** 2026-09-25

---

## D-027 — Las observaciones de Alfredo se quedan en D1; el portal suelta R2

**Decisión (Kris, 25/09/2026, fase 8 de la unificación Chaumer).**
- Las observaciones que Alfredo deja en el portal (y las respuestas del operador) **siguen en Cloudflare D1**.
  No se mudan a Supabase.
- El portal deja de estar conectado a **R2**. El bucket `chaumer-bitacora` y las tablas `bt_*` de D1 siguen en
  Cloudflare, sin usar: no se borró nada.

**Motivo.**
- En D1 hay **0 observaciones** (la API del portal, 25/09): no hay datos que mudar, y Kris no las considera
  relevantes para el Journal.
- Mudarlas obligaba a que la llave del portal **escribiera** en Supabase, contra D-023 (`portal_lector` solo lee),
  o a una segunda llave que Kris tendría que poner a mano en Cloudflare. No compensa para una tabla vacía.
- R2 no lo usaba ninguna línea de código desde la fase 4: los 83 gráficos están en Cloudinary (idénticos byte a
  byte) y en disco.

**Consecuencias asumidas.** El portal sigue dependiendo de D1 para una sola cosa. La copia de D1 y R2 a disco
que pedía el diseño no se hizo: este PC no tiene permiso en esa cuenta de Cloudflare, D1 está vacía y R2 está
duplicado en Cloudinary; además, nada se borró allí.

**Descartado.** Pasar las observaciones a Supabase con funciones de escritura para la llave del portal (opción
A) o con una segunda llave (B); quitar las observaciones del portal (D).

**Fecha.** 2026-09-25 · Diseño: `docs/disenos/2026-09-24-unificacion-chaumer.md` (fase 8)

---

## D-026 — El candado del test ciego vive en la base de datos, y el motor de Cowork se tocó

*Parcialmente sustituida por D-028 (25/09/2026): el plan y el motor ya no son de Cowork.*

**Decisión (Kris, 24/09/2026, fase 7 de la unificación Chaumer).**
- `motor_fichas` (lo que marcó el motor cada día) tiene RLS con una política **propia**, `candado`, y
  **no** `auth_all`: `authenticated` solo lee la ficha de un día **registrado** (`sesiones.registrada_at`,
  o una jornada de ese día en `bt_jornadas`). Sin políticas de escritura: solo `service_role` (el puente).
  `motor_estado(fecha)` dice si hay ficha y si está bloqueada **sin enseñarla**.
- `registrada_at` la pone el primer guardado del Diario o del bot, y un trigger la congela.
- `chaumer/05_Backtesting/lector.py` (el motor, de Cowork) se tocó en dos sitios y en nada más: la
  apertura sigue a Nueva York (vela base 9:31 Col en invierno) y los días de Fed anota los rompimientos y
  ve los reingresos.

**Motivo.**
- El test ciego: la lectura de Kris se escribe **antes** de ver lo que marcó el motor, o deja de medir su
  lectura. La app lee con `authenticated`: con `auth_all`, un candado en JavaScript sería de adorno (una
  consulta desde la consola lo salta).
- En `sesiones` hay fila **antes** de registrar (niveles, zonas naranjas, el GO del checklist): "existe la
  fila" no sirve para saber si Kris registró.
- Sin tocar el motor, desde el 2/11 habría tomado una vela de premercado como vela base, y los días de Fed
  no veía ningún reingreso. El 8/07 (validado NO OPERA) da con el motor arreglado un Reingreso con −64,75:
  llevado a Cowork (`chaumer/04_Web/PROPUESTAS_AL_PLAN.md`).

**Consecuencias asumidas.**
- `motor_fichas` es la **única** tabla del Journal con RLS que no es `auth_all`. Un Claude futuro que
  "normalice" la política abre el candado **sin ningún error**: por eso consta en `CLAUDE.md`.
- Cada cambio de `lector.py` se pasa por la regresión (`scripts/cadena/prueba_motor.py`): los días no Fed
  tienen que dar idéntico.

**Descartado** (de `chaumer/04_Web/DISENO_COACH.md`): la hora fija 10:45 y una tarea de Windows (se
rompía el 2/11 y dependía de que el PC estuviera encendido a esa hora; ahora lo lanza un AddOn de
NinjaTrader que además recupera los días que falten); R2 para el gráfico (va a Cloudinary, como la
bitácora); el candado en JavaScript; las herramientas `dia`/`velas` del Coach (la ficha va en su contexto).

**Fecha.** 2026-09-24 · Diseño: `docs/disenos/2026-09-24-cadena-diaria.md`

---

## D-025 — El Coach lee el plan de Chaumer entero y pasa a Claude Opus 5.5

*Parcialmente sustituida por D-028 (25/09/2026): el plan y el motor ya no son de Cowork.*

**Decisión (Kris, 24/09/2026, fase 6 de la unificación Chaumer).**
- En los días de la etapa 2, el Coach recibe los cinco documentos del plan (reglas con sus
  condiciones, parámetros, glosario, checklist y contextualización) como **primer bloque** del
  system, con caché de 1 h. Los días de la etapa 1 se analizan como antes.
- **Modelo: Claude Opus 5.5** (`claude-opus-5-5`), esfuerzo `low`, 16.000 tokens.
- **Sin cuaderno nuevo:** la memoria sigue siendo la de siempre (resúmenes de 60 días y errores
  repetidos).
- El plan es la única fuente de reglas; sin códigos de regla con Kris (y un vigilante que los
  quita); la contextualización no juzga incumplimientos.

**Motivo.**
- Desde la 5c el Coach solo veía el enunciado de cada regla: no podía juzgar una corrida fluida ni
  un stop con los números del plan. Con el plan entero lo hace — la primera prueba real (24/09)
  detectó un stop 11 puntos más corto de lo que marca el plan.
- `chaumer/` no se publica, así que el plan tiene que estar en Supabase para que la app lo lea.

**Consecuencias asumidas.**
- Coste medido el 24/09: **0,92 USD por sesión** (análisis + chat + diagnóstico), ≈ 19 USD al mes
  si se analizan los 21 días. Antes, con Sonnet 5 y sin el plan, rondaba 0,25–0,35. El prefijo
  son ~88.000 tokens (plan + día), casi el doble de lo estimado; lo compensa la lectura de caché.
- Cada vez que Cowork cambie el plan hay que sincronizar también `plan_documentos`.

**Descartado.** El Coach en el portal con base D1 y herramientas (`DISENO_COACH.md`, pensado para
otra cosa); el cuaderno de aprendizajes con bandeja de aprobación (Kris: la memoria de hoy basta);
seguir con Sonnet 5. El **candado del test ciego** no se descarta: se aplaza a la fase 7, porque hoy
el Coach no ve fichas ni velas del motor.

---

## D-024 — La disciplina se mide por etapas, y la etapa del plan de Chaumer empieza el 24/09

*Parcialmente sustituida por D-028 (25/09/2026): el plan y el motor ya no son de Cowork.*

**Decisión (Kris, 24/09/2026, fase 5 de la unificación Chaumer).**
- Cada regla pertenece a una **etapa** y cada día a la que contiene su fecha. Un día cuenta las
  reglas **de su etapa, activas o no**; `activa` solo decide qué se ve para marcar.
- **Etapa 2 = el plan de Chaumer, desde el 24/09/2026**, con el trade de ese día como piloto.
  Checklist **simple**, decidido línea por línea: **2 casillas** (corrida fluida en
  Continuación; punto de referencia en Reingreso) y **7 automáticas**. El resto de la
  checklist del plan, como guía. Las noticias se anotan como siempre.
- El texto se edita **solo en el plan** (Cowork); el Journal lo trae con un sincronizador de un
  solo sentido y lo enseña en Estrategia **de solo lectura**.

**Motivo.**
- La disciplina contaba las reglas activas de hoy sobre toda la historia: desactivar una regla
  la borraba del pasado. Le pasó a `rr_1a1` (135 casillas) sin que nadie lo notara. Montar la
  etapa nueva desactivando las 17 casillas de entonces habría borrado la historia entera.
  Comprobado con los datos reales: con etapas, la etapa 1 sale **idéntica** (813/916 = 89 %,
  mes a mes).
- Kris quiere un checklist que se use de verdad: 2 casillas que miden lo que el plan dice que
  más se falla, y lo demás comprobado por los datos, que no pueden «mentir».

**Consecuencias asumidas.**
- La disciplina de la etapa 2 es casi toda automática, y un día sin operar no tiene disciplina.
- «1 contrato» se comprueba con `trades.qty`, que solo es fiable desde que la principal es
  Sim101: la regularización de D-020 fue de fechas anteriores. Si se repitiera, daría falsos.
- El 24/09 guarda también sus 17 casillas viejas, que no cuentan en ninguna etapa.

**Descartado.** Una casilla por cada una de las 40 reglas (la mitad son definiciones de
dibujo, no se «cumplen» un día); las 18 casillas de la primera propuesta (Kris: «lo vamos a
dejar más simple»); empezar la etapa cuando NinjaTrader tuviera el checklist nuevo (Kris
prefirió hoy, como piloto).

---

## D-023 — El portal lee Supabase con un rol propio, y los gráficos van a Cloudinary

**Decisión (Kris, 24/09/2026, fase 4a de la unificación Chaumer).** La bitácora de
backtesting pasa de D1/R2 a Supabase. El portal la lee **desde su servidor** con un JWT de
rol **`portal_lector`**, que solo puede leer las vistas `portal_bt_cabecera` y
`portal_bt_jornadas`. Los 83 gráficos van a **Cloudinary** (carpeta `backtesting/`).

**Motivo.**
- **El mínimo permiso posible.** La `service_role` abre la base entera; si se filtrara desde
  Cloudflare, se llevaría trades, cuentas y sesiones. La llave de `portal_lector` solo lee
  lo que el portal ya enseña sin contraseña. Comprobado: lee las dos vistas y **no** lee
  `trades`, `bt_jornadas` ni escribe.
- **Las vistas corren con los permisos de su dueño** (no `security_invoker`): así el rol no
  necesita permiso sobre las tablas. Por eso se les quitan a mano los permisos por defecto
  de `anon` y `authenticated`, que Supabase da a todo objeto nuevo de `public`: si no, la
  clave anónima del Journal —pública en el repositorio— las leería.
- **Cloudinary** es donde el Journal ya guarda sus gráficos, y sube desde el navegador sin
  servidor. Las imágenes quedan públicas, como ya lo eran en el portal.

**Cómo se revoca la llave** sin tocar nada más: `revoke portal_lector from authenticator`.
Caduca a los 10 años. La firma el *Legacy JWT Secret*; si Supabase lo retira, hay que
volver a firmarla (`chaumer/04_Web/scripts/llave-portal.mjs`).

**Descartado.** `service_role` en Cloudflare (todo el poder para leer dos vistas); dar
permiso a `anon` sobre las vistas (la lectura sería desde el navegador, y el diseño lo
prohíbe); Supabase Storage (bucket privado = URLs firmadas y más código en el portal).

---

## D-022 — El repositorio `trading-journal` es público, de momento

**Decisión.** El repositorio sigue **público** en GitHub, `chaumer/` incluido, hasta que
haya presupuesto para GitHub Pro (unos 4 US$/mes) o se busque otra solución.

**Motivo.** Con la cuenta gratuita de GitHub, **Pages no publica repositorios privados**.
El 24/09 se puso privado tras subir `chaumer/` (fase 3 de la unificación) y el Journal cayó
entero, en la web y en el móvil (404 desde las 10:43). Kris eligió volver a público antes
que pagar.

**Qué queda a la vista, y lo sabe Kris:**
- **La metodología de Alfredo, más de lo que enseña el portal:** el plan fuente completo,
  el motor de backtesting, `FASES.md`, los diseños internos y la historia. El portal
  (`plan-operativo-nq.pages.dev`) ya enseñaba sin contraseña reglas, plan, glosario,
  parámetros, galería, backtesting y test ciego, pero con `noindex`; GitHub sí se indexa y
  se copia.
- **Del Journal:** el email, los números de las cuentas de Apex, cifras de resultados y
  disciplina en `docs/`, y el mapa de la arquitectura. **Ninguna clave secreta** (solo la
  pública de Supabase, protegida por RLS).

**Alternativas descartadas por ahora.** GitHub Pro (coste). Cloudflare Pages para el
Journal (cambia la dirección, hay que reinstalar la app del móvil y revisar los Workers).
Sacar `chaumer/` de la historia (push forzado prohibido, y deshace la fase 3).

**Lo que corrige.** `CLAUDE.md` decía "privado" y no lo era: el repositorio es público
desde su creación (10/05/2026). La revisión de la fase 3 se fió de eso y no lo comprobó.

**Se revisa** cuando haya presupuesto. Pendiente aparte: proteger el portal con Cloudflare
Access, y ver qué devuelve `/api/backtesting/export`, que responde 200 sin sesión (fase 4).

**Fecha.** 24/09/2026

---

## D-021 — El NQ del journal pasa a MNQ; en `apex_trades` se queda

**Decisión.** El único trade en NQ de `trades` (24-jun-2026, `trade_number` 86) se convierte
a **MNQ** respetando el valor del punto: los **−32,5 puntos** que se movió el precio no
cambian, solo el multiplicador ($20 → $2). Pasa de **−$653,80 a −$66,30**.

**Sustituye** la parte de [D-020] que dejaba ese trade sin regularizar por ser irreducible.
El otro irreducible, el **6-feb** (−$194,30 con 1 contrato), sigue como estaba: ahí el
problema no es el instrumento ni el tamaño, sino un stop que se dejó correr **96,5 puntos**
por encima del límite de 80. Es la única fila del journal fuera de ±160, y se queda así a
propósito.

**Motivo.** Con un solo contrato de NQ no había forma de entrar en el rango de ±$160 bajando
tamaño: el micro es el contrato más pequeño que existe. Convertirlo es la única vía, y es
coherente con el resto del journal, que es 100 % MNQ.

**Qué se recalculó.** `instrument`, `profit`, `commission` ($1,30 round-trip, la de los demás
MNQ 09-26 de 1 contrato de esas fechas), `mae` ($525 → $52,50), `mfe` ($70 → $7,00) y `etd`.
Dirección, precios y contratos **no se tocan**.

**`apex_trades` no se toca, y esto importa.** Ahí hay **17 trades en NQ** de las cuentas de
evaluación. En esas cuentas el NQ se operó de verdad y consumió drawdown a $20/punto — y el
drawdown es lo que decide si una cuenta se quema. Convertirlos daría un Apex Tracker que
miente sobre por qué se quemó cada cuenta. Journal regularizado, Apex real: la misma
separación de D-019.

**Verificado.** Puntos: −32,50 antes y después. **MAE en puntos: 26,25 antes y después**, así
que la disciplina da idéntico. P&L del journal: −$2.488,58 → **−$1.901,08**.

**Fecha.** 19 sep 2026 · Migración: `docs/migrations/2026-09-19-nq-a-mnq-en-el-journal.sql`

---

## D-020 — El journal se regulariza a ±$160 por trade; `apex_trades` guarda la verdad

**Decisión.** El 19 de septiembre de 2026, los **20 trades de `trades` que superaban ±$160
por haber operado con más contratos** se ajustaron bajando el número de contratos hasta
entrar en rango. Se recalcularon `qty`, `profit`, `commission`, `mae`, `mfe` y `etd`; los
precios de entrada y salida **no se tocaron**, porque los puntos que se movió el precio son
los que son. P&L del journal: **−$4.526,50 → −$2.488,58**.

**Motivo.** Kris quiere un histórico que refleje la operativa con el tamaño que considera
correcto, para leer su criterio sin que lo tape el tamaño. La simulación previa mostró que
**la mitad de la pérdida del año venía del tamaño, no del criterio**, y que agosto —−$2.160
reales— habría sido −$131 con un contrato.

**Lo que esto cuesta, y se asume a sabiendas.** El journal **deja de ser fiel a lo que
realmente se ejecutó**. No es una corrección de datos falsos (como los trades fantasma del
18-ago): el dato era verdadero y pasa a no serlo. Se acepta porque:

- **`apex_trades` conserva la verdad.** Las copias de esos mismos trades siguen con sus
  contratos reales, así que el Apex Tracker sigue mostrando el drawdown que de verdad se
  consumió. Las dos tablas divergen **a propósito**: journal regularizado, Apex real. Es la
  continuación natural de la D-019.
- **Hay respaldo completo** en `_bak_20260919_trades_regularizacion`, y la reversión es un
  `UPDATE ... FROM` por `trade_number`.
- **La disciplina no se mueve.** `mae` y `qty` se escalan a la vez, así que el **MAE en
  puntos** —lo que evalúa la regla del stop máximo— da idéntico. Verificado: 0 de 20 con el
  MAE o el MFE en puntos distinto, 0 cambios de signo.

> ⚠️ **Parcialmente sustituida por D-021 (19 sep):** el NQ del 24-jun acabó convertido a
> MNQ, así que el journal queda en −$1.901,08 y solo el 6-feb sigue fuera de ±160.

**Los dos que no se tocaron.** Ya estaban en **un solo contrato** y aun así pasaban de 160;
bajar contratos no era posible y Kris eligió dejarlos:

- **2026-02-06** · MNQ · 1 contrato · −$194,30 · **−96,5 puntos**. No es un problema de
  tamaño: es un stop que se dejó correr por encima del límite de 80 puntos. Regularizarlo
  habría borrado precisamente la señal que hace útil ese trade.
- **2026-06-24** · **NQ** · 1 contrato · −$653,80 · −32,5 puntos. Único NQ del histórico:
  $20/punto en vez de $2.

**Alternativas descartadas.** Convertir el NQ a un micro (falsea el instrumento, no solo el
tamaño) y recortar el P&L a −160 sin tocar contratos (dejaría la fila incoherente: el
profit no cuadraría con precios × contratos).

**Fecha.** 19 sep 2026 · Migración: `docs/migrations/2026-09-19-regularizar-trades-a-160.sql`

---

## D-019 — `trades` es el journal de UNA cuenta; `apex_trades` tiene todas las de Apex

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
