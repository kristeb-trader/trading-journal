# En marcha

> Lo que se está haciendo y lo siguiente. Cuando algo se cierra, se resume en
> `docs/historial-proyecto.md` y se borra de aquí. Las ideas sin fecha viven en
> `backlog.md`.

## Ahora

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

### Cerrar la deuda del doble lenguaje visual

El lenguaje nuevo (16 ago) solo está en la pestaña **Diario**. Faltan **Coach IA**, **Días
anteriores** y el resto de la app (calendario, disciplina, análisis).

Ya hay a qué ceñirse: la Fase 6 dejó los tokens declarados en `CLAUDE.md` §Lenguaje visual.
Migrar **por pantalla completa**, nunca a medias — media pantalla migrada se ve peor que
ninguna.

**Quedan 45 literales de color** sin tokenizar (eran 140). Casi todos son variantes
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

**Pendiente de comprobación tuya:** no pude registrar el service worker en el navegador de
pruebas (lo bloquea). Verificado que las 28 entradas responden 200 y que `APP_SHELL`
coincide exactamente con los `<script>` de `index.html`, pero **el precacheo real no se ha
visto ejecutar**. Para confirmarlo: Chrome → DevTools → Application → Cache Storage →
`nqjournal-v5` debe tener 28 entradas.

### Modal del día — distinguir el ítem tumbado del nunca marcado

Hoy un ítem del checklist que un error tumbó se ve **igual** que uno que nunca se marcó.
`_checklistDia` ya expone `roto`; falta solo el render ("marcado, pero el diagnóstico lo
desmiente").

### Coach IA — inyectar el catálogo de recomendaciones en el prompt

Última pieza de la Fase 4B. Sin ella, la IA inventa nombres de recomendación en vez de
reutilizar los del catálogo, y se duplican.

### Rendimiento

El modal del día carga lento. Sin diagnosticar aún — medir antes de tocar.
