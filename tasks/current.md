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

### Service worker — error en consola al cargar

`An unknown error occurred when fetching the script`, y `getRegistrations()` devuelve
vacío: el registro de `sw.js` está fallando. **Detectado el 16 ago, no diagnosticado.** No
lo causó la reestructuración —`sw.js` no se tocó— y no rompe la app, pero la PWA no está
funcionando como debería.

### Modal del día — distinguir el ítem tumbado del nunca marcado

Hoy un ítem del checklist que un error tumbó se ve **igual** que uno que nunca se marcó.
`_checklistDia` ya expone `roto`; falta solo el render ("marcado, pero el diagnóstico lo
desmiente").

### Coach IA — inyectar el catálogo de recomendaciones en el prompt

Última pieza de la Fase 4B. Sin ella, la IA inventa nombres de recomendación en vez de
reutilizar los del catálogo, y se duplican.

### Rendimiento

El modal del día carga lento. Sin diagnosticar aún — medir antes de tocar.
