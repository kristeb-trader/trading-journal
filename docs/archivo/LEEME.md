# Archivo — documentación de sistemas anteriores

⚠️ **Nada de esta carpeta es vigente.** Describe el Trading Journal anterior a agosto de
2026, cuando Sesión, Coach IA e Historial eran tres secciones separadas.

Se conserva por valor histórico. **No usarla como referencia para implementar.**

Para el estado real: `CLAUDE.md` (raíz) y `docs/historial-proyecto.md`.

## Qué hay aquí y en qué miente

| Archivo | Líneas | Por qué no sirve hoy |
|---|---|---|
| `manual-tecnico.md` | 982 | Modelo de 3 secciones. Dice `claude-haiku-4-5` en unos sitios y `claude-sonnet-5` en otros; el real es **sonnet-5**. Afirma "RLS deshabilitado" cuando **está activo en las 18 tablas** desde jun 2026 |
| `manual-usuario.md` | 764 | Modelo de 3 secciones. Menciona modelos de IA de mayo |
| `arquitectura-tecnica.md` | 631 | Modelo de 3 secciones. "RLS deshabilitado en trades/sesiones" es **falso** |
| `arquitectura-funcional.md` | 522 | Modelo de 3 secciones |
| `plan-seguridad-rls.md` | 110 | Plan **ejecutado** (jun 2026). Describe el estado *anterior* al blindaje |
| `plan-unificacion-reglas.md` | 112 | Plan **ejecutado**: dio lugar a `catalogo_reglas` |
| `plan-disciplina-fases.md` | 79 | Plan **ejecutado**: disciplina por 3 fases |
| `plan-rediseno-checklist-disciplina.md` | 426 | Plan **ejecutado** (3 ago). `docs/Disciplina.md` lo cita como el porqué del rediseño — por eso se archiva en vez de borrarse |

Archivado el 2026-08-16. Motivo y criterio:
`docs/disenos/2026-08-16-reestructuracion.md` §2.2.

## `chaumer/` — los dos buzones de Cowork

| Archivo | Por qué no sirve hoy |
|---|---|
| `chaumer/PROPUESTAS_AL_PLAN.md` | Lo que el portal no podía corregir en el plan, para que lo hiciera Cowork. Desde D-028 el plan se cambia desde Claude Code con el sí de Kris; lo pendiente pasó a `tasks/current.md` |
| `chaumer/PENDIENTE_PORTAL.md` | El buzón entre Cowork y Claude Code para el portal. Tareas hechas; lo vivo pasó a `tasks/current.md` y a `chaumer/04_Web/CLAUDE.md` |

Archivados el 2026-09-25. Motivo: D-028 en `docs/decisiones.md`.
