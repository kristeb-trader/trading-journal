# En marcha

> Solo lo que está en curso. Lo terminado va a `docs/historial-proyecto.md`; las ideas y lo que
> está por comprobar, a `backlog.md`.

## El bot: BotChaumer en NinjaTrader (D-038)

Aprobado el 06/10. Diseño: `docs/disenos/2026-10-06-bot-chaumer.md`. Se valida en `SimBot` en vivo y con el Strategy
Analyzer y el Market Replay sobre el pasado. **Todo cambio de regla aprobado llega a la vez al motor y al bot** (§5).

- [x] **Fase 1 · los números en un sitio** (06/10): `parametros` en `reglas.json`; `lector.py` los lee de ahí;
  `minimo` y `decidir()` para correrlo vela a vela
- [x] **Fase 2 · el motor en C# y la sincronía** (06/10): `MotorChaumer.cs`, el arnés, `scripts/bot/sincronia.py`, el
  sello y el hook. 64 de 64 días idénticos, vela a vela incluida
- [x] **Kris:** `MotorChaumer.cs` y `MarcacionChaumer.cs` copiados y compilados (06/10). Mirar que la línea blanca sale igual
- [ ] **En cada clon del repo:** `git config core.hooksPath scripts/hooks` (este PC ya lo tiene)
- [ ] **Fase 3 · el bot**: código, tabla `bot_operaciones` y cuenta `SimBot` hechos. **Strategy Analyzer 17/17 iguales
  al motor** (07/10, MNQ 12-26, 13/09 → 06/10). Falta el **Market Replay** de dos días (Kris): 23/09 y 02/10
- [x] **§12 D0** (07/10): `MarcacionChaumer` restaurado tal cual e independiente del bot; la sincronía lo vigila sin tocarlo
- [x] **Kris:** `MarcacionChaumer.cs` y `MotorChaumer.cs` copiados y compilados (07/10)
- [x] **§12 D1** (07/10): `ChaumerNT.cs`; el Analyzer vuelve a dar 17/17, CSV idéntico al anterior
- [x] **Plan 3.45** (07/10, Kris): al estirarse la zona, el rompimiento que la estiró se cierra. Plan (`d580983`), los dos
  motores con sello nuevo (`cc233a1`), fichas de sep–oct rehechas y publicadas. 18 días cambian zonas; 07/10 y 01/07
  pasan a no operar
- [x] **Kris:** `MotorChaumer.cs` con el sello `L:bf7669a4…` compilado; el Analyzer con el motor nuevo da **18/18** (07/10)
- [ ] **Abiertas del 07/10 (Kris):** ¿cierra también el rompimiento la **zona apéndice** (R-11)? ¿Y el estiramiento por
  **superposición** (R-13, que dice que la zona conserva su historial)? Hoy los dos siguen como estaban
- [x] **Bot:** distingue «encendido tarde» de una diferencia (07/10). Compilado por Kris el 07/10
- [x] **08/10 — primer día del bot en SimBot:** **COINCIDE** con el motor. Continuación alcista, orden 9:23, 2 × 31316.50
  (stop 31286.25, objetivo 31346.75), llena 9:24 sin deslizamiento, TARGET 9:29, +30.25 pts, **+$118.40 neto**.
  Sello correcto. Detalle menor: en los eventos del bot la S de las 8:56 acaba en 31169.75 y en el motor en 31169.50
  (un tick; no afectó a la operación) — mirar si se repite. **Supongo** que es la vela construida en vivo frente a la
  del histórico del servidor: se comprueba comparando esa vela en las dos fuentes
- [x] **09/10 — SimBot:** Continuación bajista 8:44, llena 8:45 (1 × 31053, sin deslizamiento), **STOP a las 13:24**,
  −76 pts, −$153,30 neto. Misma entrada que el motor; su ficha quedó ABIERTA hasta la ampliación de las 15:02 → de ahí
  el calendario «abierta» y la cadena cada 30 min (`2429faa`)
- [ ] **Kris:** copiar `CadenaDiaria.cs` a `Custom\AddOns\` y F5, fuera de la ventana
- [ ] **§12 D2** `VistaMotorChaumer`: código hecho (07/10). **Kris:** copiar a `Custom/Indicators`, F5 y el Market Replay del 23/09 y el 02/10 con el bot y la vista
- [ ] **Fase 4 · el pasado entero**: velas desde el 12/06/2025, Strategy Analyzer, Market Replay, informe
- [ ] **Fase 5 · SimBot en vivo**, con la comparación diaria en la cadena

## Coach + motor: «el motor mide, el Coach juzga» (D-034)

Ruta acordada con Kris el 02/10: **B → A → C**, E cuando se quiera, D descartada. Hechos B (noticias y velas al
Coach) y A (`scripts/cadena/medir.py`: la operación de Kris medida con el motor, en `ficha.tu_operacion`).

- [ ] **La prueba real, al final (Kris, 03/10), con un día sin analizar** (28/09 → 2/10): Opus en la pestaña
  normal (se guarda) y Sonnet 5.5 con `?modelo=sonnet` (no guarda), lado a lado. Mirar: que no pregunte precios,
  que use la medición del motor, el Contexto según el plan; y en `coach_uso`, el coste de cada uno y los `toque`
- [ ] **C** (que la IA deje de releer el plan entero) solo tras semanas de A con motor y Coach coincidiendo
- [ ] **E:** que el puente no escriba dentro del repo (`noticias_rojas.txt`, `dias_fed.txt`) ni publique desde la
  copia de trabajo
- [ ] Pregunta abierta a Kris: ¿un solo botón para análisis + diagnóstico? (El contexto viejo ya se decidió: fuera, D-035)

## Backtesting de Chaumer

Las reglas están cerradas. **Cada duda se resuelve cuando aparezca en un día concreto**, con ese día
delante: nada de listas previas (decisión de Kris, 28/09). Si cambia el motor, su regresión
(`python scripts/cadena/prueba_motor.py`); si cambia el plan, el sí de Kris y su commit `plan:`.

**Objetivo (Kris, 28/09):** poder hacer el backtesting completo **de cualquier fecha**, no de un tramo fijo.
El motor corre sobre cualquier día del que haya velas de 1 minuto; lo que limita es qué velas hay.

- **Cómo va:** Kris pide el día; Claude lo marca a ciegas con el motor (corrida fluida 3.38), lo revisa a mano y
  entrega; se compara. **Si Kris dice «sí» o «perfecto» es que coincide, y va a la galería sin volver a preguntar**
  (30/09); un cambio de regla o un día que no coincide sí se le pregunta. **Al cerrar cada día se pasa el puente**
  (`python scripts/cadena/subir_dia.py AAAA-MM-DD`) para que el Journal —calendario «Claude» y Coach— tenga su ficha
  y su gráfico, igual que el portal (Kris, 30/09). Hechos: 1/09 (+15,75), 2/09 (+29,00), 3/09 (+24,00), 4/09 (+16,75), 8/09 (no opera) y 9/09 (+67,25)
- **Arreglado (30/09):** los dos huecos del motor que salieron el 4/09 y el 8/09 — la corrida de la apertura se juzga
  siempre, deje o no zona de corrida; y la zona de premercado sin papel mira los dos lados. Ninguna operación cambia
- **Velas:** NinjaTrader las tiene guardadas desde el 12/06/2025 (MNQ 09-25, 12-25, 03-26, 06-26, 09-26, 12-26):
  se exportan por **contrato** (el de ese vencimiento, no el siguiente). El backtesting a mano de 2025 (116 gráficos,
  01/08/2025 → 16/01/2026) queda cubierto. Septiembre, en `datos/dia/Septiembre.txt` (MNQ 09-26, 31/08 → 18/09)

Dudas que ya salieron, para reconocerlas si vuelven: `docs/historial-proyecto.md`, checkpoints del 28/09 y del 30/09.

**Las Sesiones (D-029, 28/09):** `chaumer/05_Backtesting/` es `kris/` (el backtesting a mano) y `claude/`
(un gráfico por día + su `.json`; el protocolo del chat «Backtesting» en `claude/protocolo/LEEME.md`).
La publicación automática funciona desde el 29/09: el AddOn exportó a las 10:32 en `claude\motor\datos\dia\` y
el puente subió el día solo (`6461e1a`).

## El mapa del método — implementado, queda una decisión

`/mapa`: el método como mapa navegable (núcleo, las 7 piezas en corona y las reglas de cada una
con sus relaciones), enlazado desde la portada. Las 5 fases dentro y verificadas el 29/09: 20/20
comprobaciones en modo normal y con movimiento reducido, `npm run verificar` limpio (57 páginas),
y sin JavaScript queda la lista de las 34 reglas. Diseño: `docs/disenos/2026-09-29-mapa-del-metodo.md`.

- [ ] **Decidir el color dentro de una pieza** — **Kris**. Hoy las 13 reglas de Zonas comparten el
  tono del grupo y se ve monótono. La recomendación es variar la intensidad por **número de
  relaciones**: es el único eje con datos en las siete piezas (el apartado solo existe en Zonas y
  `aplica_a` casi no varía). El §11 del diseño lo compara.
- [ ] **El móvil**, sin mirar de verdad: solo la reordenación básica del menú. Un mapa de este
  tamaño en un teléfono merece su propia decisión.

## Portal de Alfredo

Rescatados de `chaumer/04_Web/ESTADO_FASE_2.md` al archivarlo (28/09, D-030). Estaban ahí desde el 24/09.

- [ ] **Crear la clave del operador** para ver y borrar las observaciones desde fuera del portal:
  `npx wrangler pages secret put CLAVE_OPERADOR --project-name=plan-operativo-nq` — **Kris** (`chaumer/04_Web/DESPLIEGUE.md`)
- [ ] **Alfredo no puede dejar observaciones en los ocho módulos** (premercado, zonas, setups, jornada, entrada,
  filtros, dentro y riesgo): solo en casos reales y vocabulario, y `/observaciones` es de solo lectura. Es la razón
  de ser del portal
- [ ] Simplificar la prosa de los casos reales, que todavía suena a auditoría
- [ ] Pasarle la dirección a Alfredo — **Kris**, cuando termine su revisión del portal

## Con fecha (las hace Claude)

- **28/10** (Fed): la ficha sale con `dia_fed` y el motor ve reingresos
- **2/11** (invierno): vela base 9:31; el AddOn exporta a las 11:32
- **≈10/12** (cambio de contrato): el AddOn pasa solo a `MNQ 03-27`
