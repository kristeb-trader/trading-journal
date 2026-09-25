# En marcha

> Lo que se está haciendo y lo siguiente. Cuando algo se cierra, se resume en
> `docs/historial-proyecto.md` y se borra de aquí. Las ideas sin fecha viven en
> `backlog.md`.

## Ahora

### 🟢 Unificación Chaumer → Journal (24 sep)

Diseño aprobado: `docs/disenos/2026-09-24-unificacion-chaumer.md` (v1.5). **Una fase por
sesión**, con `/clear` entre una y otra.

- [x] **Fase 1** — GitHub Pages publica solo la aplicación (`publicar-journal.yml`).
  `CLAUDE.md`, `docs/` y `NinjaTrader/` ya dan 404. Kris la confirmó en el móvil (24 sep)
- [x] **Fase 2** — Lo pendiente de Cowork, guardado en `Trading_Plan` (`8983073`)
- [x] **Fase 3** — Chaumer traído con su historia a `chaumer/` (`git subtree`). El portal se
  publica solo desde el Journal (56 páginas idénticas). La carpeta vieja está en
  `E:\Proyectos\Otros Claude\Chaumer_ARCHIVADO` y `Trading_Plan`, archivado
- [x] **Fase 4a** — La bitácora, en Supabase (85 jornadas, 73 operaciones, P&L 1.233,04,
  idénticas a D1) y los gráficos en Cloudinary. El portal la lee con la llave de
  `portal_lector` (secreto `SUPABASE_PORTAL_KEY` en Cloudflare) y ya no acepta escrituras.
  Verificado en vivo (24 sep)
- [x] **Fase 4b** — Se registra desde el Journal: **Otros › Backtesting** (registrar,
  corregir, borrar, gráfico y datos de inicio). Verificado de punta a punta con el portal
- [x] **Kris:** primera jornada real registrada desde el Journal (01/12/2025) y vista en el portal
- [x] **Fase 5a** — Etapas de la disciplina: cada regla es de una etapa y cuenta aunque se
  desactive. La disciplina histórica, **idéntica** (813/916 = 89 %, mes a mes), comprobado con
  los datos reales. Diseño: `docs/disenos/2026-09-24-etapa-plan-chaumer.md` (v2.1)
- [x] **Fase 5b** — Etapa 2 (Plan de Chaumer) activa desde el 24/09: 2 casillas + 7
  automáticas; el plan entero en `catalogo_reglas`. Piloto hecho por Kris: 6/6
- [ ] **Con cada commit `plan:`** (checklist, reglas, parámetros, glosario o contextualización; D-028):
  `node scripts/plan/sincronizar.mjs` y aplicar por el MCP **los dos** SQL — `salida.sql`
  (`catalogo_reglas`) y `salida-documentos.sql` (`plan_documentos`, lo que lee el Coach) —, y
  comprobar las huellas (lo hace Claude)
- [x] **Fase 5c** — Coach y Diario por etapa de la fecha; Estrategia de solo lectura; docs y D-024
- [ ] **Kris:** al abrir NinjaTrader, mirar que el indicador `ChecklistChaumer` enseña la casilla
  nueva (no hay que recompilar: el `.cs` no cambió)
- [x] **Fase 6** — El Coach con el plan completo y Claude Opus 5.5; consumo en `coach_uso`.
  Prueba real de Kris (24/09): caché desde el 2º turno, **0,92 USD** la sesión, sin códigos.
  Diseño: `docs/disenos/2026-09-24-coach-plan-completo.md` · D-025
- [x] **Fase 7** — La cadena diaria: el AddOn `CadenaDiaria` exporta el día a las 10:32, el motor lo
  marca y la ficha llega al Coach, con candado hasta que Kris registra. **Kris ya no exporta a mano**
  (25/09). Verificado: 6 de 6 días idénticos a la exportación manual. Diseño:
  `docs/disenos/2026-09-24-cadena-diaria.md` · D-026
- [ ] **Cadena diaria, comprobaciones con fecha** (las hace Claude):
  - el primer Coach de un día **con ficha**: la sección del motor entra y la caché del bloque A se sigue
    leyendo (`coach_uso.cache_leida` > 0 desde el 2º turno)
  - **28/10** (Fed): la ficha sale con `dia_fed` y el motor ve reingresos
  - **2/11** (invierno): vela base 9:31, el AddOn exporta a las 11:32 (registro del AddOn)
  - **≈10/12** (cambio de contrato): el AddOn pasa solo a `MNQ 03-27` (`AAAA-MM-DD.meta.json`)
- [x] **Fase 8** (reducida, D-027) — el portal suelta R2; las observaciones de Alfredo se quedan en D1 (había
  0). La copia local de D1 ya tiene su tabla. **La unificación Chaumer está completa**
- [x] Aparte, vistos en la 4a: `_bak_20260919_trades_regularizacion` cerrado (`a8abbb5`); la copia local de
  D1 del portal ya tiene la tabla `observaciones` (fase 8)
- [ ] **Repositorio público de momento (D-022).** Cuando haya presupuesto: GitHub Pro y
  pasarlo a privado, u otra solución. Aparte: proteger el portal (Cloudflare Access) y ver
  qué devuelve `/api/backtesting/export`, que responde 200 sin sesión

> ℹ️ **Un archivo nuevo que necesite la app** (fuera de `js/`, `css/` o `icons/`) hay que
> añadirlo al `cp` de `.github/workflows/publicar-journal.yml`. Si no, dará 404 en producción.

### 🟡 El plan de Chaumer: lo que estaba «pendiente de Cowork» (25 sep, D-028)

Cowork ya no existe: el plan se cambia desde aquí. **Todo lo que toque `chaumer/01_Plan/` necesita el sí de
Kris**, erratas incluidas, y va en su propio commit `plan: …`, con la versión subida y sincronizado (ver
arriba). Venían de los dos buzones archivados en `docs/archivo/chaumer/`, donde está el detalle.

- [ ] **Antes del 2/11** — `test_ciego/LEEME_BACK_DIARIO.md` solo da la ventana de verano (08:31–10:30 Col =
  13:31–15:30 UTC). Añadir la de invierno: desde el 2/11, 09:31–11:30 Col = 14:31–16:30 UTC. No es del plan,
  pero sin esto el test ciego marca mal la hora
- [ ] **Plan** · `CHECKLIST_DIARIA.md`: la nota de debajo de los filtros dice «los cuatro filtros» y son cinco.
  Propuesta (22/09): quitar el número, como ya hace el portal, o poner cinco
- [ ] **Plan** · `CHECKLIST_DIARIA.md`, línea 70: «IRI descartado» → «Continuación descartada». Resto del cambio
  del 23/09; sale publicada en la checklist del portal
- [ ] **Plan** · `ESTADO.md`, línea 120: remite a `04_Web\PENDIENTE_PORTAL.md`, que está archivado
- [ ] **Kris** · revalidar el **8/07** vela a vela. El motor arreglado da un Reingreso bajista a las 8:38 con
  −64,75; el día estaba validado como NO OPERA. La duda es de un reingreso de una sola vela (la convención
  intravela). Si se confirma, julio cambia en −64,75 puntos
- [ ] **Diagramas**, revisados por Kris uno a uno: `09-zona-volumen.png` (y su copia
  `02_Assets/diagramas/R-15_premercado_volumen.png`) lleva dibujado el umbral de 2.000; el vigente es más
  de 8.000 en MNQ (pendiente desde el 08/09). Y los **siete diagramas de reglas de agosto**, que se van del
  portal cuando estén rehechos; después, unificar las carpetas de imágenes

### 🟢 Empezar a cargar las operativas de Chaumer (19 ago)

El comparador está **terminado y verificado** — las 4 fases. Lo que falta no es código: son
datos. Kris ya cargó los dos primeros días (18 y 19 de agosto) el mismo día que se entregó;
el dashboard de Diferencias irá diciendo más a medida que se acumulen.

Se registra desde **Otros › Chaumer › Registrar**, un día a la vez: setup, hora **en hora
Colombia** (desde el 17 sep; D-017), resultado,
puntos y la captura. Los días en que él **no operó** también cuentan — son los que permiten
medir «entré donde él no veía nada».

> ✅ **El signo de los puntos ya se pone solo** (19 ago): `stop` fuerza negativo, `target`
> positivo, y `be`/`parcial` respetan lo que escribas. La fila del 18 se corrigió de
> `+20,50` a `−20,50`. Detalle: `docs/disenos/2026-08-19-chaumer-vs-yo.md` §5.6.

> ⚠️ **El módulo vive de la constancia.** Con el 30 % de los días cargados, el dashboard no
> dice dónde fallas: dice dónde te acordaste de apuntar. Por eso la cobertura va arriba del
> todo y se pone en rojo por debajo del 60 %. Si el alta resulta pesada, decirlo y se
> recorta antes de que se llene de huecos.

**Una cosa a decidir con datos reales:** un día con mismo setup, mismo resultado y entrada
a la vez, pero la mitad de sus puntos, hoy sale como **«Igual»** con un chip que avisa.
Puede que Kris prefiera que cuente como «Ejecución» — es una condición en `veredicto()`
(`js/chaumer.js`).

> ℹ️ **Las horas las revisa Kris a mano** en Registrar si ve diferencias (17 sep). La del
> 28 ago (21:52) está entre ellas.

Diseño y lo medido en cada fase: `docs/disenos/2026-08-19-chaumer-vs-yo.md` (v8).

### 🔵 Probar Datos con la sesión iniciada (19 ago)

El rediseño está implementado y verificado en lo que se puede medir sin contraseña
(anchos, desbordes, degradación, y los números contrastados con un `SELECT`). Lo que
**no** se pudo probar es todo lo que exige estar autenticado — sin login las lecturas
devuelven 401:

- ✅ **Los 6 contadores de Otros** llegando solos — comprobado el 19 ago con la sesión de
  Kris ya iniciada en el preview: 99 · 127 · 19 · 28 · 87 · 26, los reales.
- ⬜ **En cada pestaña de Datos:** agregar, renombrar, borrar, activar/desactivar y
  **arrastrar para reordenar**. No se probó para no tocar datos de producción sin permiso.
- ⬜ Que el **orden** que se guarda al arrastrar sea `1, 2, 3…` y no múltiplos de 6 — había
  un bug ahí desde antes, arreglado en la Fase 1.

Diseño y detalle de lo medido: `docs/disenos/2026-08-19-otros-y-datos.md` (v2) § 6.1.

### 👀 Revisar a ojo la UI del 16 ago

Dos cambios que **no se pudieron medir** (la pantalla de login altera el shell y el panel
del navegador no compone frames para capturar):

- **Controles en la barra superior** — el alto que se gana sobre el calendario y cómo queda
  en móvil: si el filtro de cuentas aprieta o las flechas quedan raras junto al mes.
- **Vista del día** — el alto de la imagen fija (`46vh` en escritorio, `34vh` en móvil).
  Si come demasiado espacio de texto, o al contrario, es una línea de CSS.

### ✅ Navegación de 6 botones (16 ago) — cerrado

Diseño: `docs/disenos/2026-08-16-navegacion-6-botones.md` (v2). Las 4 fases dentro y
verificadas. Resumen en `docs/historial-proyecto.md` § Checkpoint 2026-08-16c.

**Lo único que queda por probar, y le toca a Kris:** el **cambio de contraseña real**. Se
probaron las dos validaciones y el modal entero, pero no se ejecutó el cambio para no
cambiarle la clave. Igual con **Cerrar sesión**: el botón está y es alcanzable en móvil,
pero no se pulsó.

### Reestructuración documental (16 ago)

Diseño aprobado: `docs/disenos/2026-08-16-reestructuracion.md` (v3).

- [x] **Fase 1** — Configuración: `.gitignore`, permisos por patrones, config versionada
- [x] **Fase 2** — `CLAUDE.md` de 259 a 149 líneas + `.claude/rules/` con carga bajo demanda
- [x] **Fase 3** — Memoria: 11 archivos → 2, seis contradicciones eliminadas
- [x] **Fase 4** — `docs/` y `tasks/`: archivar, borrar, decisiones, índice, checkpoints
- [x] **Fase 5** — Los 4 skills genéricos en `~/.claude/skills/`
- [x] **Fase 6** — Tokens CSS: 19 → 26 tokens, 140 → 45 literales, 95 sustituciones

> Los skills viven fuera del repo (`~/.claude/skills/`), así que no aparecen en estos
> commits: `flujo-desarrollo` (reescrito), `lenguaje-visual`, `base-de-datos` y
> `documentacion` (+ `references/contrato.md`). Este repo es la **primera implementación
> del contrato** y sirve de plantilla para KrisKapital.

## Siguiente

### Trigger para cuando la cuenta real sea la principal

Desde el 18-sep, `apex.js` **no lee `trades`** (D-019). Si un día la cuenta principal es una
cuenta **dada de alta en `apex_cuentas`**, NinjaTrader mandará sus trades a `trades` y el
Apex Tracker no los verá.

Hacerlo **antes** de ese cambio: un trigger `after insert` en `trades` que replique la fila a
`apex_trades` cuando `account` esté en `apex_cuentas`, guarde el nombre real en
`cuenta_origen` y deje la etiqueta del journal. Sin recompilar NinjaTrader. Mientras la
principal sea `Sim101` no hace falta. Detalle: Fase 4 de
`docs/disenos/2026-09-18-cuenta-unica-en-trades.md`.

### Cerrar la deuda del doble lenguaje visual

El lenguaje nuevo (16 ago) solo está en la pestaña **Diario**. Faltan **Coach IA**, **Días
anteriores** y el resto de la app (calendario, disciplina, análisis).

Ya hay a qué ceñirse: la Fase 6 dejó los tokens declarados en `CLAUDE.md` §Lenguaje visual.
Migrar **por pantalla completa**, nunca a medias — media pantalla migrada se ve peor que
ninguna.

**Quedan 44 literales de color** sin tokenizar (eran 140). Casi todos son variantes
casi-idénticas de los mismos colores (`#e87c7b` junto a `#f2706f`, `#a99cff` junto a
`#afa9ec`, `#60a5fa` y `#6fa8dc` junto a `#5b94c9`). Unificarlos **cambiaría píxeles**, así
que no se tocan en bloque: se consolidan al migrar cada pantalla, que es cuando el cambio
visual está justificado y se puede revisar.

### ~~Service worker — error en consola~~ → FALSA ALARMA (16 ago)

**No hay tal error.** Lo reporté al verificar la Fase 6 y era un artefacto del navegador
embebido en el que probé (`Claude/… Electron/42.7.0`), que **bloquea el registro de
service workers**.

La prueba de control es concluyente: registrar `./manifest.json` como service worker da
**exactamente el mismo mensaje** ("An unknown error occurred when fetching the script").
Un JSON debería fallar por MIME type, no por "unknown error" — el navegador ni siquiera
llega a descargar el archivo. Y `sw.js` se sirve con 200, `application/javascript` y
sintaxis válida.

En un navegador normal la PWA funciona. Si quieres confirmarlo: abre la app en Chrome y
mira **DevTools → Application → Service Workers**.

### ✅ Service worker — `APP_SHELL` arreglado (16 ago)

Lo que sí era real: `APP_SHELL` se declaraba en `sw.js` y **no se usaba en ningún sitio**
(`install` solo precacheaba `CDN_SHELL`), listaba `js/annual.js` —que ya no existe— y le
faltaban 6 archivos que sí. La PWA no abría sin conexión en la primera visita.

Arreglado: `install` ahora precachea los 25 recursos propios + los 3 del CDN, y `CACHE`
sube a `nqjournal-v5` para forzar la reinstalación.

**Al añadir un `<script>` a `index.html`, añadirlo también a `APP_SHELL`.** Si no, ese
archivo no está en la primera visita sin conexión. Hay un comentario en `sw.js` que lo
recuerda.

**✅ Verificado por Kris en Chrome (16 ago):** Cache Storage → `nqjournal-v5` con las **28
entradas**. El precacheo funciona end-to-end.

### Modal del día — distinguir el ítem tumbado del nunca marcado

Hoy un ítem del checklist que un error tumbó se ve **igual** que uno que nunca se marcó.
`_checklistDia` ya expone `roto`; falta solo el render ("marcado, pero el diagnóstico lo
desmiente").

### Coach IA — inyectar el catálogo de recomendaciones en el prompt

Última pieza de la Fase 4B. Sin ella, la IA inventa nombres de recomendación en vez de
reutilizar los del catálogo, y se duplican.

### Rendimiento

El modal del día carga lento. Sin diagnosticar aún — medir antes de tocar.
