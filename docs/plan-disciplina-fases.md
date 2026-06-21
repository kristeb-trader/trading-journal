# Plan — Reestructuración Disciplina / Reglas / Errores por FASES

> Objetivo: conectar Disciplina, Reglas y Errores bajo un eje común (las 3 fases
> del proceso) para registrar, medir y analizar mejor, con foco psicotrading.
> Iniciado: 2026-06-19. Aprobado arrancar por **Bloques 1 y 2**.

## Eje unificador — 3 FASES
- **Fase 1 — Pre-sesión**: antes de que exista setup.
- **Fase 2 — Lectura del setup**: análisis antes de entrar (la fase más débil del trader).
- **Fase 3 — Ejecución**: colocar y gestionar la orden.

## Mapeo del checklist actual a fases (7 ítems, sin agregar nuevos)
- **Fase 1**: `chk_cuenta_pa`, `chk_noticias` (calendario), `chk_zonas`.
- **Fase 2**: `chk_5velas`, `chk_estructura`, `chk_consecucion`.
- **Fase 3**: `chk_orden`.

## Bloques del plan (orden por impacto)

### Bloque 1 — Alerta de riesgo proactiva + "¿la viste?"  [APROBADO]
- `puntos_retroceso` ya se calcula solo como `|P&L día / 2|` (pts, $2/pt MNQ).
- Comparar `puntos_retroceso * 2` (riesgo en $) contra `objetivos.stop_max_usd`.
- Si lo excede → alerta inline en el formulario (Fase 2) ANTES de guardar.
- Campo nuevo **`alerta_riesgo_vista`** (boolean, nullable): "¿Viste que el retroceso
  superaba tu límite antes de entrar? Sí/No". Solo se pregunta si hay exceso.
  - `true` → impulsividad confirmada (error psicológico, el más grave).
  - `false` → falla analítica (no la vio a tiempo, problema de proceso).
- El Coach IA lee `alerta_riesgo_vista` y distingue impulsividad vs falla analítica.
- Archivos: `js/form.js`, `js/coach.js`. BD: `alter table sesiones add column alerta_riesgo_vista boolean`.

### Bloque 2 — Checklist por 3 fases  [APROBADO]
- Reorganizar el checklist del formulario en Fase 1 / Fase 2 / Fase 3 (visual + metadata).
- Separar `chk_orden` (Fase 3) de los ítems de lectura (Fase 2).
- Métrica nueva: **% de cumplimiento por fase** (dónde está la fuga del proceso).
- Archivos: `index.html`, `js/form.js`, `js/metrics.js`. BD: ninguna (la fase se define en código).

### Bloque 3 — Modelo de error unificado  [PENDIENTE]
- Cada error: fase (1/2/3) + tipo (psic/anal/oper/marcado) + "regla vista vs no vista".
- BD: 1-2 campos en `diagnostico_errores`.

### Bloque 4 — Métricas conectadas  [PENDIENTE]
- Racha de disciplina como métrica #1, % cumplimiento por fase, errores por fase/causa,
  contador impulsividad vs falla analítica.

### Bloque 5 — Rediseño del Registrar por fases (UX)  [PENDIENTE]
- Formulario con las 3 fases como columna vertebral + mini-progreso por fase.

## Descartado / fuera de alcance por ahora
- El dashboard HTML separado que sugirió otro chat (el integrado actual es mejor).
- Efectividad por corrida / por tipo de setup (necesita más volumen de datos).

## Estado
- [x] Bloque 1 — alerta de riesgo + "¿la viste?" (2026-06-19). Campo `alerta_riesgo_vista`,
      evalRiesgo en form.js (retroceso×2 vs stop_max), botón Sí/No, Coach distingue
      impulsividad vs falla analítica. Migración: 2026-06-19-sesiones-alerta-riesgo.sql.
- [x] Bloque 2 — checklist por 3 fases (2026-06-19). Form reorganizado en Fase 1/2/3,
      métrica "Cumplimiento por fase" en el modal de Disciplina. Sin migración.
- [~] Bloque 3 — modelo de error unificado. PARTE A hecha (2026-06-19): columnas
      `fase` y `regla_vista` en diagnostico_errores; selector de fase manual al
      registrar un error; badge de fase en la lista; "Errores por fase" en el modal
      de errores. Migración: 2026-06-19-errores-fase-regla.sql.
      PARTE B PENDIENTE: que el Coach IA asigne fase + regla_vista (extender el
      formato de error de 6 a 7-8 partes y su parser) — se dejó aparte por riesgo.
- [ ] Bloque 4 — métricas conectadas (racha #1, fuga por fase, impulsividad vs analítica)
- [ ] Bloque 5 — rediseño del Registrar por fases (UX)
