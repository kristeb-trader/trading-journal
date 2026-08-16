---
paths:
  - "js/db.js"
  - "js/metrics.js"
  - "js/charts.js"
  - "js/calendar.js"
  - "js/disciplina.js"
  - "js/app.js"
  - "js/coach.js"
---

# Reglas de oro de la disciplina

> El criterio vive **solo** en `js/db.js`. Estuvo duplicado en 4 sitios y se
> desincronizó. Al tocar disciplina se cambia **ahí**, y `metrics` / `charts` /
> `calendar` / `disciplina` / `app` / `coach` delegan.
>
> Paso a paso con el ejemplo real de julio: `docs/Disciplina.md` — **leerlo antes de
> tocar cualquier métrica de disciplina.**

Funciones canónicas: `discContexto` · `esDiaHabil` · `sesionOpero` · `discFactorAplica` ·
`discAplicaContexto` · `reglaAutoResultado` · `maeEnPuntos` · `reglasRotasPorDia` ·
`reglaCumplida` · `calcDisciplinaStats`.

**Construye el contexto con `discContexto()` y pásale trades y errores COMPLETOS** — sin
filtro de cuenta ni de período. Son índices de "qué pasó ese día", no métricas.

## Las siete invariantes

1. **Sábados y domingos no cuentan en NADA.** El AddOn crea filas de `sesiones` al abrir
   NT8; sin este filtro entraban como días operados.
2. **`no_opero = false` NO significa que operó** — es el default de la columna. Las Fases
   2/3 solo aplican si hubo **operativa real** (trades ese día o setup declarado).
3. **Los días sin conexión** (`no_opero=true` + `se_conecto=false`) quedan fuera de toda
   estadística, no solo de la disciplina.
4. **El checklist es auto-reportado y puede mentir.** Un error con `regla_codigo` tumba esa
   regla aunque la casilla esté en `true`.
5. **Hay reglas que NO se marcan: se calculan** (`evidencia='auto'`) — stop máximo, ventana
   de noticia y día FOMC. Devuelven true/false/**null**; `null` = sin evidencia y NO cuenta.
   Cuando el dato puede responder, responde el dato.
6. **Tercer eje de aplicabilidad: `aplica_si`** (`siempre` · `dia_fomc` · `hay_noticia`).
   Una regla solo se evalúa cuando había algo que cumplir; si no, su % se diluye en cientos
   de días sin riesgo y deja de significar nada.
   > ⚠️ La condición se comprueba **dentro de `reglaAutoResultado`**, no solo en
   > `discFactorAplica`: el Coach pide el resultado suelto y sin esa guarda reportaba
   > "violaste la regla del FOMC" en días que no eran FOMC (bug real, 3 ago).
7. **`bloquea_go`**: el GO cae DENTRO de la Fase 2, no al final del checklist. Las reglas
   que describen hechos posteriores a la entrada no lo bloquean — exigirlas obligaba a
   marcar lo que aún no había pasado o a perder el trade.

## El riesgo se mide en PUNTOS, no en dólares

**$ por punto según contrato: MNQ = $2, NQ = $20.** Normalizar mal el MAE lo infla ×10 en
los trades de NQ, y ya llevó a una conclusión falsa.

`objetivos.limite_perdida_dia` ($150) quedó **obsoleto**: es control de capital de Apex, no
una regla de proceso. El límite vivo es `objetivos.stop_max_puntos` (80).

## Efecto lateral asumido (3 ago)

La **tasa de errores** y los **días limpios** tienen un denominador menor desde que salieron
los días sin conexión, así que sus porcentajes son más altos que los que Kris venía viendo.
Es lo pedido, no un bug.

## Cerrado y no se reabre (24 jul)

Seis reglas (`rei_zona`, `chk_contexto`, `chk_no_mover`, `rr_1a1`, `stop_max_puntos`,
`target_sin_zonas`) nacieron con el rulebook de junio, así que sus filas de **feb–may son
relleno en `true`** (288 ítems). Se quedan como están: limpiarlas bajaría la disciplina
global de 81,5% a 75,1% y rompería la comparabilidad con el histórico. La disciplina de
feb–may está inflada **por diseño aceptado**; leerla con esa salvedad. Ver
`docs/decisiones.md`.
