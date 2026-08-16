# Plan — Unificación del Rulebook (reglas canónicas)

> Estado: **COMPLETADO** (2026-06-26). Variante A (rulebook atómico + narrativa
> delgada). Las 4 fases ejecutadas y verificadas. Tablas viejas archivadas como
> `*_archivada` (drop definitivo más adelante).

## Objetivo
Unificar `setup_reglas`, `checklist_items` y las reglas atómicas de
`estrategia_chaumer` en **una sola tabla canónica `reglas`** (1 fila = 1 regla
verificable), eliminar la tabla muerta `reglas` legacy, y conectar reglas ↔
checklist ↔ errores con una fuente única de verdad. De paso, mejorar el prompt
del Coach IA con reglas estructuradas (DURAS vs blandas).

## Diagnóstico (resumen)
- `estrategia_chaumer` = narrativa/filosofía (prosa).
- `setup_reglas` = reglas por setup × dirección (7 campos de texto).
- `checklist_items` = checks atómicos por fase.
- `reglas` (legacy) = **muerta**, reemplazada por las anteriores.
- Problema real: la misma regla se duplica en las 3 capas, sin enlace ni fuente
  única; el Coach recibe prosa no estructurada; los errores no se anclan a la
  regla rota.

## Modelo final — tabla `reglas`
```
reglas — rulebook canónico (1 fila = 1 regla atómica)
──────────────────────────────────────────────────────────────
id            bigint PK
codigo        text UNIQUE     -- slug estable: max_5_velas, stop_max_120, no_fomc…
titulo        text NOT NULL   -- "Máx 5 velas en la corrida"
enunciado     text            -- la regla completa (qué dice y por qué)
capa          text NOT NULL   -- filosofia | setup | proceso | riesgo
tipo          text NOT NULL   -- dura (no negociable) | blanda | experimental
fase          smallint NULL   -- 1 pre-sesión | 2 lectura | 3 ejecución (capa proceso)
setup         text NULL       -- iri_apertura | iri_continuacion | reingreso | NULL = todas
direccion     text            -- ambas | alcista | bajista
campo         text NULL       -- activacion|secuencia|entrada|stop|gestion|invalidacion|notas
es_checklist  boolean         -- ¿aparece como check diario?
estado        text            -- vigente | en_prueba | archivada
orden         int
peso          numeric         -- cumplimiento ponderado (futuro)
activa        boolean
evidencia     text NULL       -- casos base / notas que evolucionan
created_at / updated_at
```

### Capas (`capa`) — sustituyen a las 4 tablas
- `filosofia` ← `estrategia_chaumer` (principios narrativos, `enunciado` largo)
- `setup`     ← `setup_reglas` (con `setup`, `direccion`, `campo`)
- `proceso`   ← `checklist_items` (con `fase`, `es_checklist=true`)
- `riesgo`    ← reglas duras transversales (stop máx, no FOMC, no noticia roja)

### Vistas derivadas (todo sale de `reglas`)
- Checklist diario: `where activa and es_checklist order by fase, orden`
- Reglas de un setup: `where capa='setup' and (setup=:s or setup is null)`
- Reglas DURAS: `where tipo='dura'`
- Filosofía: `where capa='filosofia'`
- En prueba: `where estado='en_prueba'` (se conecta con el Lab de Experimentos)

### Convención de `codigo`
- proceso (checklist): se conserva la `clave` actual (`chk_5velas`, …) → backfill directo del JSONB de `sesiones.checklist`.
- setup: `<setup>_<direccion>_<campo>` (ej. `reingreso_ambas_entrada`).
- filosofia: `fil_<id_estrategia>` (provisional; se pueden renombrar a slugs).
- riesgo: slugs explícitos (`stop_max_120`, `no_fomc`, `no_noticia_roja`).

## Trazabilidad reglas ↔ errores
`diagnostico_errores` gana `regla_codigo` (FK lógica → `reglas.codigo`). Cada
error queda ligado a la regla exacta rota. El Coach devuelve el `codigo`. Si la
regla es `dura`, el veredicto es INVÁLIDO por definición.

## Decisiones del trader (2026-06-26) — clasificación dura/blanda
- **DURAS (no negociables):** los 7 ítems del checklist (`chk_cuenta_pa`,
  `chk_noticias`, `chk_zonas`, `chk_5velas`, `chk_consecucion`, `chk_estructura`,
  `chk_orden`) + `stop_max_puntos`.
- **BLANDAS:** `no_fomc` (preferencia, a criterio), reglas de setup (entrada/stop/
  gestión…) y filosofía.
- **Regla "5 velas" reestructurada** → `chk_5velas` mide **sobreextensión**, no el
  conteo exacto. ~5 velas es promedio; una corrida de más velas vale si NO está
  sobreextendida (3 condiciones); 3-4 velas largas/volátiles/sobreextendidas no
  cumplen. Principio no negociable; el conteo es guía.
- **Stop en PUNTOS, no en dólares** → `stop_max_puntos`. Default **80 puntos**,
  **parametrizable** en `objetivos.stop_max_puntos` (editable cuando el trader
  quiera). Con varios contratos el $ escala pero la validez la define el stop en
  puntos. `objetivos.stop_max_usd` queda como histórico.
- **Pendiente Fase 2 (código):** la alerta de riesgo del formulario (hoy en $,
  `stop_max_usd=120`) debe pasar a **puntos** (≥ `stop_max_puntos` dispara alerta).

## Fases
- [x] **Fase 1 — BD aditiva (no rompe nada)** (HECHO 2026-06-26). `reglas` creada
      y verificada: 9 filosofía, 8 proceso (7 duras + `chk_contexto` blanda),
      2 riesgo (`stop_max_puntos` dura, `no_fomc` blanda), setup `reingreso`
      explotado. `objetivos.stop_max_puntos`=80. `diagnostico_errores.regla_codigo`
      añadida. Tablas viejas intactas.
      → `docs/migrations/2026-06-26-reglas-unificacion-fase1.sql`
- [ ] **Fase 2 — Código web**: `db.js` (queries → `reglas`), sección Estrategia
      (editor unificado por capa/setup/fase), `form.js` (checklist lee de `reglas`),
      bot fallback. Verificar paridad con lo actual.
- [ ] **Fase 3 — Prompt del Coach**: reconstruir el system prompt con reglas
      estructuradas (bloque DURAS, reglas del setup del día, filosofía) y pedir el
      `codigo` de la regla rota en el diagnóstico.
- [x] **Fase 4 — Retiro** (HECHO 2026-06-26). Código: quitadas las funciones
      muertas de `db.js` (getEstrategiaSecciones/updateEstrategiaSeccion/
      getSetupReglas/saveSetupRegla); el indicador NT8 `ChecklistChaumer` ahora lee
      de `reglas` (es_checklist) — requiere recompilar en NT8. SQL no destructivo
      `2026-06-26-reglas-fase4-archivar.sql` renombra `estrategia_chaumer` y
      `setup_reglas` a `*_archivada`. `checklist_items` se archiva DESPUÉS de
      recompilar el ChecklistChaumer (línea gated en el SQL). `reglas_legacy_backup`
      ya estaba apartada. Drop definitivo de las `*_archivada`: más adelante, cuando
      haya plena confianza.

## Notas de seguridad (RLS activo)
La nueva tabla necesita: `enable row level security` + política `auth_all` (para
`authenticated`) + grants a `authenticated` y `service_role` (bot/worker/NT8).
