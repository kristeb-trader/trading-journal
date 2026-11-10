# La disciplina pregunta «¿tu trade cumplía las reglas?», no «¿hiciste lo mismo que el bot?»

**Versión:** v1 · **Estado:** ✅ APROBADO por Kris (10/11/2026) · en implementación · Sustituye la medida de D-047
(`docs/disenos/2026-10-23-disciplina-plan.md`) · Relacionado: D-034 (`medir.py`), D-026 (el candado), D-049 (el Coach).
Boceto: `boceto-disciplina-v2.png` (enviado el 10/11/2026).

---

## 1 · El problema (10/11/2026)

Kris: *«no lo estoy mirando, no me aporta nada… no operar lo mismo del bot no significa que no cumpla la disciplina»*.
Tiene razón en las dos cosas:

1. **La medida de D-047 confunde «distinto al bot» con «indisciplina».** El bot elige UN trade (el primero válido);
   otro trade puede cumplir las mismas reglas. El 06/10 Kris entró a las 8:41 en un setup que el motor daba por bueno
   (el bot operó a las 10:07): hoy sale «otro», en rojo.
2. **La pantalla dice *que* te saliste, no *qué regla* rompiste.** «Otro» o «fuera» no dicen qué corregir. Y Kris no
   abre la pantalla: una pantalla que no se mira no corrige nada.

Pero el motor ya sabe, en la vela de cada entrada, si ese setup era válido y, si no, por qué (`ficha.tu_operacion.
eventos_motor`, que guarda `medir.py`). Probado sobre los 23 trades desde el 01/10 (script de prototipo):

| | Octubre | Noviembre (al 09/11) |
|---|---|---|
| Dentro de las reglas | **10 de 18** (el 06/10, sin ser el trade del bot) | **0 de 5** |
| Reglas rotas | contratos ×3 · punto de referencia ×3 · objetivo con zona ×1 · sin setup ×1 | **stop > 80 ×3** (04, 05, 06) · sin setup ×1 · primer IRI ×1 |

La fuga de noviembre es una sola y clara, y las notas de Kris la explican: «sobreextendido», «posible movimiento
extendido». Eso es lo que la pantalla tiene que poner delante.

## 2 · Decisiones de Kris (10/11/2026)

Aprobó las cuatro recomendaciones («todo»): la pregunta nueva, el botón «no estoy de acuerdo», el aviso en Telegram y
la pantalla mínima con la fuga.

## 3 · El juicio de cada trade

Lo calcula **`medir.py`** con lo que ya mide (no añade reglas: usa las del motor y sus motivos) y lo guarda en cada
operación de `tu_operacion` como `juicio = { cumple, regla, texto }`. Orden (la primera que salte manda):

| # | Comprobación | `regla` | Texto (ejemplo real) |
|---|---|---|---|
| 1 | Segundo trade del día | `una_operacion` | «segunda operación del día» |
| 2 | Tu stop > 80 pts (`riesgo` deducido) | `stop_max` | «stop de 89 pts (el máximo son 80)» (06/11) |
| 3 | Entrada fuera de la ventana | `ventana` | «fuera de la ventana 09:30–11:30 ET» |
| 4 | Entrada en la ventana de una noticia | `noticia` | «en la ventana de la noticia de las 7:30» |
| 5 | Tu objetivo choca con una zona viva | `objetivo_zona` | «el objetivo chocaba con una zona» (02/10) |
| 6 | Más contratos de los que caben en $160 — con el stop **del plan** si es el trade del plan; si no, con el tuyo | `contratos` | «4 contratos (cabían 2)» (08/10) |
| 7 | Es el trade del plan (`coincide`) | — cumple | «el trade del plan» |
| 8 | El motor, entre 2 velas antes y la del llenado, en tu sentido: **✓ orden enviada** | — cumple | «setup válido del plan» (06/10) |
| 9 | …o **✗ descartado / no se opera**, con su motivo | según el motivo | «el objetivo pasaba del punto de referencia» (27/10) · «primer IRI tras un movimiento contrario» (09/11) · «con el stop del plan (130 pts) pasaba de 80» (05/11) |
| 10 | El motor no veía ningún setup a esa hora | `sin_setup` | «el motor no veía ningún setup a esa hora» (02/11) |

Motivos del motor → `regla`: `riesgo … pts` → `stop_max` · `pasa del punto de referencia` → `punto_referencia` ·
`choca con` → `objetivo_zona` · `primer IRI` → `primer_iri` · `sin consecución` → `consecucion` · `retroceso se pasó` /
`no la rompió` / `no es fluida` / `rompimiento directo` → `fluidez` · `día de Fed` → `fed` · `zona de premercado` →
`premercado` · otro → `otra`, con el texto del motor. **Si `lector.py` cambia sus frases, esta tabla se revisa**: un
motivo que no case cae en `otra` con su texto, no se pierde.

- **No es una regla nueva del plan**: es leer lo que el motor ya decidió. El motor sigue siendo auditoría, no verdad:
  para eso está el botón (§5).
- `medir.py` añade `MEDIR_VERSION` a la huella de `tu_operacion`: al cambiar, `medir_pendientes` vuelve a medir.
  Se rehace una vez desde el 01/10 (solo la medición: sin redibujar ni publicar).
- Los selects de trades de `subir_dia.py` añaden `qty` (lo necesita la regla 6).

## 4 · La medida

- **Disciplina % = trades dentro de las reglas ÷ trades juzgados.** Cuentan trades, no días.
- **No operar nunca es un fallo** y no entra en el %. Si ese día el plan operó, se dice en el visor como dato («el plan
  operó a las 9:47»), sin color de fallo.
- No cuentan: los trades **en discusión** (§5, abiertos) y los **pendientes** (sin ficha: el candado).
- **Desde el 01/10**, como la medida de D-047, que sustituye. Del 24 al 30/09, la de las reglas; un período se mide con
  la medida de su día más reciente (igual que hoy).
- **Racha** = trades seguidos dentro de las reglas, desde el más reciente.
- **La fuga** = la `regla` más rota del período (empate: la más reciente), con sus días y las notas de Kris de esos días
  (`sesiones.analisis_trader`, recortadas). Una frase fija por regla dice qué pide el plan («el plan no opera si el
  stop pasa de 80, por bueno que sea el setup»).
- **El criterio**: el juicio de cada trade lo da `medir.py` (el motor); `db.js` lo agrega (`juicioDia`, el %, la racha,
  la fuga). Ninguna pantalla recalcula nada.
- **Desaparecen**: la ejecución (entrada ±5 pts), las alarmas, la lectura y los «igual / otro / fuera / bien / aviso».
  `veredictoDia` se queda solo para decir qué hizo el bot («el bot entró a las 10:21»).

## 5 · «No estoy de acuerdo»

- Tabla nueva **`disciplina_discusiones`**: `fecha` (PK), `nota` (una frase de Kris), `estado` (`abierta` · `motor` = el
  motor tenía razón · `plan` = se corrige el plan), `creada_at`, `cerrada_at`. RLS + `auth_all` + grants a
  `service_role` (Telegram la escribe).
- **Abierta** → ese día no cuenta y sale azul. **`motor`** → vuelve a contar como diga el juicio. **`plan`** → se
  corrige el plan y el motor (con el sí de Kris, como siempre), las fichas se rehacen y el juicio cambia solo.
- Se abre desde el visor o desde Telegram; se cierra desde la pantalla de Disciplina (lista «En discusión»).

## 6 · Dónde se ve

| Sitio | Qué |
|---|---|
| **Telegram** | Al cerrar el registro del día (`cerrarSesion`), si la ficha ya tiene juicio, el mensaje «🎯 Disciplina» con el veredicto, la regla y lo que hizo el bot, y el botón «🤔 No estoy de acuerdo» (pide la frase y abre la discusión). Si registraste antes de que el motor termine, lo manda la cadena cuando mide: `subir_dia.py` llama a un `/disciplina` nuevo del Worker con la fecha (el Worker lee la ficha él mismo y **solo envía si el día está registrado**: el candado). Una sola vez por día: `sesiones.disciplina_avisada_at`. Días sin trade: no manda nada |
| **Disciplina** (en Otros) | La del boceto: la fuga arriba; dentro de las reglas · racha · en discusión; un cuadrito por día con su regla; la lista «En discusión» con sus botones; los errores anotados. Clic en un día → el visor |
| **Visor del día** | El bloque «Disciplina» sustituye a «Disciplina · el plan y tú»: la frase del juicio y «No estoy de acuerdo» (o «En discusión: tu nota») |
| **Calendario y Análisis** | El mismo %: «x de y trades dentro de las reglas» |
| **Coach** | El foco (D-049) parte del juicio: dentro de las reglas → corto, aunque no sea el trade del bot (y lo dice); regla rota → esa regla y por qué; sin trade → muy corto |

## 7 · Datos

- Migración `2026-11-10-disciplina-discusiones.sql`: la tabla de §5.
- Migración `2026-11-10-sesiones-disciplina-avisada.sql`: `sesiones.disciplina_avisada_at timestamptz` + `NOTIFY pgrst`.
  Ni la web ni el bot la mandan en su payload: no la pisan.
- `motor_fichas` la sigue escribiendo **solo** `subir_dia.py` (el juicio va dentro de `tu_operacion`).

## 8 · Plan por fases

| Fase | Qué | Verificación |
|---|---|---|
| **1 · El juicio** | `medir.py` (juicio + `MEDIR_VERSION`), `subir_dia.py` (`qty`); rehacer la medición desde el 01/10 | `SELECT` del juicio de los 23 trades: octubre 10/18, noviembre 0/5, los motivos de la tabla de §3 |
| **2 · El cálculo y los datos** | `db.js` (`juicioDia`, %, racha, fuga, discusiones); las dos migraciones | El cálculo de `db.js` sobre la BD da lo mismo que la fase 1; las tablas con RLS |
| **3 · Las pantallas** | Disciplina (boceto), visor, calendario, Análisis | Preview: noviembre y octubre, escritorio y 390 px, consola limpia; abrir y cerrar una discusión |
| **4 · Telegram** | Worker: mensaje al cerrar, `/disciplina`, el botón y su frase; la cadena llama a `/disciplina` | El mensaje de un día real (Kris lo ve en Telegram); que un día sin registrar no se envíe |
| **5 · Coach y documentación** | Foco por juicio; D-052 (sustituye la medida de D-047), `docs/Disciplina.md`, reglas, historial | Un día de noviembre en el Coach con la petición cortada en la página |

## 9 · Fuera de este diseño (anotado)

- `NOTIFY_SECRET` está escrito en `SupabaseAutoExport.cs` y el repositorio es público: cualquiera puede mandar
  mensajes a tu Telegram por `/notify`. `/disciplina` no envía nada que no esté ya en la BD y solo una vez por día, pero
  conviene mover el secreto a un archivo local, como la `service_role`.

## Registro

- **v1 (10/11/2026):** primera versión, con el «todo» de Kris y el prototipo sobre los 23 trades desde el 01/10.
