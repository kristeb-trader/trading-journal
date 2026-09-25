# Fase 6 — El Coach con el plan completo

**Versión:** v1 · **Estado:** 🟢 **APROBADO por Kris el 24/09/2026.** 6a cerrada; en curso: 6b.
**Escrito:** 24/09/2026. Sub-diseño de la fase 6 de `docs/disenos/2026-09-24-unificacion-chaumer.md`.

| Versión | Fecha | Qué cambió |
|---|---|---|
| v1 | 24/09/2026 | Primera versión, tras el diagnóstico y las dos decisiones de Kris |

> Toca invariantes del Coach (`.claude/rules/coach.md`: caché por prefijo, formato en dos sitios, historial
> cortado a la fecha). No se implementa nada hasta el sí de Kris.

---

## 1 · Lo decidido

| Decisión | Quién |
|---|---|
| El Coach es solo para Kris; no inventa reglas; no usa códigos de regla con Kris; `CONTEXTUALIZACION.md` entra marcado como *no son reglas* | Diseño general (24/09) |
| **Modelo: Claude Opus 5.5** (`claude-opus-5-5`) | Kris, 24/09 |
| **Sin cuaderno nuevo:** la memoria sigue siendo la de hoy (resúmenes de 60 días y errores repetidos, que Kris revisa) | Kris, 24/09 |

**Descartado del diseño de Chaumer** (`chaumer/04_Web/DISENO_COACH.md`, pensado para el portal): el Coach en el
portal, la base D1, las herramientas (`bitacora`, `dia`, `velas`…), el cuaderno con bandeja y el tope de gasto
en código (la clave es de Kris y vive en su navegador). El **candado del test ciego** se aplaza a la fase 7: hoy
el Coach no ve fichas ni velas del motor.

---

## 2 · Diagnóstico (del código)

| # | Hallazgo | Dónde |
|---|---|---|
| 1 | Desde la 5c, un día de la etapa 2 recibe las 40 reglas y el checklist, pero **solo el enunciado de cada regla**: ni condiciones (umbrales, velas, ticks), ni parámetros, ni glosario | `js/coach.js` `reglasDeEtapa`, `fmtReglaLinea` |
| 2 | El plan **no está al alcance de la app**: `chaumer/` no se publica | fase 1 |
| 3 | El proxy `broad-hall-c53f` (`/api/claude`, `/api/session`) **no está en ningún repositorio** (hallazgo 7). Este equipo no puede descargarlo: wrangler solo tiene permiso de lectura de la cuenta | `wrangler whoami` del 24/09 |
| 4 | El Coach llama con `thinking: adaptive`, `effort: low`, `max_tokens: 8000`, sin herramientas, sin streaming (el proxy no lo hace), caché de 1 h en el system y en el último turno | `js/coach.js:4-16`, `:678`, `:727-745` |
| 5 | Solo guarda **el texto** de las respuestas en el historial; el razonamiento no se reenvía | `llamarClaude` |
| 6 | El consumo de tokens solo se ve en la consola del navegador: **no hay forma de medir el coste** desde aquí | `llamarClaude` |

**Opus 5.5 frente a Sonnet 5**, lo que afecta al Coach:
- el razonamiento no se puede apagar (el Coach ya usa `adaptive`: nada que cambiar) y **cuenta dentro de
  `max_tokens`** → subir a 16.000;
- su esfuerzo por defecto es `medium`: el Coach fija `low` explícito, se queda;
- no admite forzar herramientas (el Coach no usa) ni reenviar razonamiento editado (el Coach no lo reenvía);
- puede **negarse** a responder (`stop_reason: "refusal"`): hay que enseñarlo en vez de pintar un vacío;
- precio: 4 USD / 20 USD por millón de tokens (entrada / salida); lectura de caché 0,20.

---

## 3 · Cómo queda

### 3.1 · El plan, en Supabase

Tabla nueva **`plan_documentos`** (`nombre` PK, `contenido`, `huella`, `actualizado`), RLS `auth_all`, sin `anon`.
La rellena **`scripts/plan/sincronizar.mjs`**, la misma sincronización de la fase 5, con cinco documentos:

| Documento | De dónde | Cómo entra |
|---|---|---|
| `reglas` | `reglas.json` | Renderizado: por regla, categoría, enunciado, **condiciones** (variable · operador · valor), acción, excepciones y estado |
| `parametros` | `PARAMETROS.md` | Tal cual |
| `glosario` | `GLOSARIO.md` | Tal cual |
| `checklist` | `CHECKLIST_DIARIA.md` | Tal cual |
| `contextualizacion` | `CONTEXTUALIZACION.md` | Tal cual, con la cabecera **«Recordatorios de criterio. NO son reglas»** |

**No entran:** `TRADING_PLAN_CHAUMER.md` (el porqué; 148 KB, lo cubre `reglas.json`), `PENDIENTES.md`,
`ESTADO.md` y `CIERRE_FASE_1.md` (norma del proyecto Chaumer: el Coach no recibe estos dos últimos).
Estimado: **45.000–50.000 tokens**; se mide con la primera llamada.

La sincronización se aplica por el MCP, como en la fase 5. Cuando Cowork cambie el plan, se vuelve a correr.

### 3.2 · El prompt del Coach

El system prompt pasa de un bloque a **dos**, en este orden (la caché es por prefijo):

| Bloque | Contenido | Cambia | Caché |
|---|---|---|---|
| **A · El plan** (solo en días de la etapa 2) | Instrucciones fijas del plan (§3.3) + los cinco documentos | Solo cuando Cowork cambia el plan | 1 h |
| **B · El día** | Lo de hoy: reglas de la etapa, checklist, trades, historial y patrones cortados a la fecha, formato de salida | Cada fecha | 1 h |

Un día de la **etapa 1** se sigue analizando exactamente como hasta ahora (sin bloque A).

### 3.3 · Las instrucciones fijas del plan

- **El plan es la única fuente de reglas.** Si no cubre un caso, dilo con esas palabras («el plan no cubre este
  caso») y sugiere llevarlo a Cowork. **Nunca** rellenes con análisis técnico genérico ni con reglas propias.
- **Sin códigos de regla** al hablar con Kris (`R-40`, `P-22`, `G-12`): se nombran por lo que dicen («la corrida
  fluida»). Los códigos internos del checklist (`p2_…`) solo en la línea técnica de errores, como hoy.
- `CONTEXTUALIZACION` son **recordatorios de criterio, no reglas**: nunca se juzga un incumplimiento con ellos.
- **Vigilante en el código**: antes de pintar y de guardar, se quitan los códigos `R-/P-/G-/D-` que se hayan
  colado entre paréntesis, y se registra cuántos (para ver si la instrucción basta).

### 3.4 · El modelo y la llamada

- `MODEL = 'claude-opus-5-5'`, `EFFORT = 'low'` (se sube a `medium` solo si el análisis se queda corto),
  `MAX_TOKENS = 16000`.
- `stop_reason: "refusal"` → mensaje claro («El modelo no ha querido responder a esto; prueba a reformular») en
  vez de un análisis vacío.

### 3.5 · Medir: `coach_uso`

Tabla nueva **`coach_uso`** (`fecha_analizada`, `etapa`, `modelo`, `entrada`, `cache_escrita`, `cache_leida`,
`salida`, `coste_usd`, `creado`), RLS `auth_all`. `llamarClaude` escribe una fila por llamada con el `usage` de
la respuesta. Sirve para: comprobar que la caché funciona (lecturas > 0 desde el 2º turno), medir el tamaño real
del plan y **saber lo que cuesta al mes** con un `SELECT`. No guarda texto de la conversación.

### 3.6 · El proxy, al repositorio

- **Kris, a mano** (paso a paso en el chat cuando toque): copiar el código del Worker `broad-hall-c53f` desde el
  panel de Cloudflare y pegarlo.
- Claude lo guarda en `workers/proxy-ia/worker.js` **después de revisarlo**: el repositorio es público (D-022),
  así que si hubiera alguna clave escrita en el código, **no se sube**: se avisa a Kris, se pasa a secreto de
  Cloudflare y se cambia la clave.
- Se comprueba que el proxy **no filtra el modelo ni `max_tokens`**; si lo hiciera, se adapta antes del cambio de
  modelo. **No se automatiza su despliegue** en esta fase: solo se guarda.

---

## 4 · Coste estimado (se mide con `coach_uso`)

Opus 5.5: entrada 4 USD/MTok · salida 20 · escritura de caché 1 h 8 · lectura 0,20.

| | Por sesión de coaching (~6 llamadas) | Al mes (21 días) |
|---|---|---|
| El plan (1 escritura + 5 lecturas de ~50.000 tokens) | ~0,45 USD | ~9 USD |
| El resto (el día, historial, respuestas con razonamiento en `low`) | ~0,40–0,60 USD | ~8–13 USD |
| **Total** | **~0,85–1,05 USD** | **~18–22 USD** |

Hoy, con Sonnet 5 y sin el plan, rondaría 0,25–0,35 USD por sesión.

---

## 5 · Fases

### 6a · El proxy al repositorio (~6) ✅ CERRADA el 24/09/2026

*Resultado:* Kris copió el código del panel. **Sin claves escritas** (lee `DASHBOARD_SECRET`, `SUPABASE_URL` y
`SUPABASE_SERVICE_KEY` de los secretos de Cloudflare): subido tal cual a `workers/proxy-ia/worker.js`, con
`README.md`. **No filtra modelo ni `max_tokens`** (reenvía el cuerpo sin tocarlo): el cambio a Opus 5.5 no necesita
tocar el proxy. Visto de paso: **no reenvía `anthropic-beta`**, así que ninguna función beta llega por él; esta fase
no usa ninguna.

*Lo que se diseñó:*
- Kris pega el código; revisión de claves; `workers/proxy-ia/worker.js` + nota de qué hace cada ruta.
- **Verificado cuando:** el archivo está en el repo sin ninguna clave y se sabe si filtra modelo o tokens.

### 6b · El plan en Supabase y el Coach con Opus 5.5 (~22)
- Migración `plan_documentos` + `coach_uso`; `sincronizar.mjs` genera los documentos; aplicar por el MCP.
- `coach.js`: bloque A del plan en días de la etapa 2, instrucciones fijas, vigilante de códigos, modelo,
  `max_tokens`, `refusal`, fila en `coach_uso`.
- **Verificado cuando:**
  - un `SELECT` confirma los cinco documentos y sus tamaños;
  - en el preview, el prompt de un día de la etapa 2 lleva el bloque A y el de un día de la etapa 1 no
    (comprobado sin llamar a la IA);
  - **Kris analiza el 24/09 con el Coach** y en `coach_uso` aparecen la escritura de caché y, desde el 2º turno,
    las lecturas; el análisis nombra las reglas por su nombre, sin códigos, y juzga la corrida fluida con las
    condiciones del plan.

### 6c · Documentos (~4)
- `.claude/rules/coach.md` (dos bloques de system, el vigilante, `coach_uso`), `CLAUDE.md` (modelo), D-025.

---

## 6 · Riesgos

| Riesgo | Qué lo evita |
|---|---|
| El bloque A rompe la caché | Va primero, idéntico entre turnos; `coach_uso` enseña si las lecturas son 0 |
| El proxy tiene claves escritas | Revisión antes de subir; si las hay, no se sube y se rotan |
| El proxy filtra el modelo | Se mira en 6a, antes de cambiar nada |
| Coste mayor de lo estimado | `coach_uso` lo mide desde el primer día; el esfuerzo sigue en `low` |
| El plan cambia y el Coach usa uno viejo | La misma sincronización de la fase 5 lo actualiza todo a la vez |
| El Coach usa el plan en un día de la etapa 1 | El bloque A solo entra en días de la etapa 2 (se comprueba en el preview) |
