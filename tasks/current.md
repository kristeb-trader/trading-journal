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
- [ ] **Fase 5** — Los 4 skills genéricos en `~/.claude/skills/`
- [ ] **Fase 6** — Tokens CSS (aprobada, va al final y aparte porque toca `styles.css`)

## Siguiente

### Cerrar la deuda del doble lenguaje visual

El lenguaje nuevo (16 ago) solo está en la pestaña **Diario**. Faltan **Coach IA**, **Días
anteriores** y el resto de la app (calendario, disciplina, análisis).

Depende de la Fase 6: sin tokens declarados no hay a qué ceñirse. Migrar **por pantalla
completa**, nunca a medias.

### Modal del día — distinguir el ítem tumbado del nunca marcado

Hoy un ítem del checklist que un error tumbó se ve **igual** que uno que nunca se marcó.
`_checklistDia` ya expone `roto`; falta solo el render ("marcado, pero el diagnóstico lo
desmiente").

### Coach IA — inyectar el catálogo de recomendaciones en el prompt

Última pieza de la Fase 4B. Sin ella, la IA inventa nombres de recomendación en vez de
reutilizar los del catálogo, y se duplican.

### Rendimiento

El modal del día carga lento. Sin diagnosticar aún — medir antes de tocar.
