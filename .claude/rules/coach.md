---
paths:
  - "js/coach.js"
  - "TelegramBot/worker.js"
---

# Coach IA — invariantes

> **Romperlas no da error, da silencio.**

## El flujo

1. **Análisis Técnico** → 1ª llamada IA → 3 secciones (Contexto / Desarrollo / Validación)
2. **Chat** (opcional) → si la IA genera el diagnóstico estructurado, se auto-aplica al paso 3
3. **Diagnóstico Final** → 2ª llamada IA → 4 secciones (Veredicto / Errores / Aprendizaje /
   Resumen)

## Invariantes

- **El prompt lleva `cache_control`** (cada bloque del system + último turno de usuario). Es un match de
  PREFIJO byte a byte: cualquier cosa que varíe el system prompt o la serialización de un
  mensaje entre turnos mata el caché sin avisar. `llamarClaude` loguea escritos/leídos: si
  "leídos" sale 0 turno tras turno, se rompió el prefijo.
- **La gráfica NO se persiste** en `chat_messages` (se sustituye por un marcador de texto;
  vive en Cloudinary, `sesiones.imagen_url`). `chatSinImagenes` al guardar,
  `restaurarImagenEnChat` al retomar. La tabla llegó a pesar 42 MB por esto.
- **Historial y patrones del prompt están cortados a la fecha analizada** (`antesDe`): al
  analizar un día pasado, el Coach NO debe ver lo que vino después.
- **`saveErroresIA` BORRA los errores IA del día antes de reinsertar.** Solo se llama si la
  sesión revisó la lista (`erroresRevisados`); si no, guardar los eliminaría.
- **`sesiones.nivel_confianza` = confianza EN LA ENTRADA** desde el 11 ago (antes era
  "pre-sesión", que no discriminaba). Los valores previos significan lo viejo.
- **El Coach NO escribe emoción ni confianza** (16 ago): las registra el Diario. Volver a
  mandarlas desde aquí enviaría `null` —sus selectores ya no existen— y borraría lo que puso
  el Diario. Para el prompt se leen del dato guardado.
- **El Coach no tiene selector de fecha propio**: la manda la cabecera de Sesión Operativa
  vía `Coach.setFecha(date)`.

## El plan de Chaumer (fase 6, 24 sep)

Modelo **`claude-opus-5-5`**, `max_tokens` 16.000, `thinking: adaptive`, `effort: low`. En Opus 5.5 el
razonamiento **no se puede apagar** (`disabled` / `enabled` dan 400) y cuenta dentro de `max_tokens`.

- **El system son DOS bloques, en este orden:** A = el plan (`construirBloquePlan`: instrucciones fijas + los
  5 documentos de `plan_documentos`), **solo en días de la etapa 2**; B = el día (`buildSystemPrompt`). A va
  primero porque es igual para todos los días de la etapa: la caché lo relee entre turnos y entre días. Un
  día de la etapa 1 va sin A, como siempre. Meter algo de la fecha en A rompe la caché de todos los días.
- **`plan_documentos` lo escribe solo `scripts/plan/sincronizar.mjs`** (genera `salida-documentos.sql`, se
  aplica por el MCP y se comprueba con la huella sha256). Nunca a mano ni desde la app. Si Cowork cambia el
  plan, se vuelve a sincronizar: el Coach lo cachea en memoria (`DB.getPlanDocumentos`) hasta recargar.
- **Vigilante** (`quitarCodigosPlan`, solo con el bloque A): quita los códigos `R-/P-/G-/D-/C-` que el modelo
  cuele **entre paréntesis** antes de pintar y de guardar; los de fuera solo se avisan en la consola. Si
  `coach_uso.codigos_quitados` empieza a salir > 0, la instrucción ya no basta.
- **`stop_reason: "refusal"`**: se retira el turno de Kris del historial y se enseña «El modelo no ha querido
  responder a esto; prueba a reformular.».
- **`coach_uso`: una fila por llamada** (`registrarUso`) con tokens, coste y `stop_reason`, sin texto. Los
  precios viven en `PRECIO` (`coach.js`); si cambia el modelo, cambian ahí. Medido el 24/09: prefijo de
  ~88.000 tokens, sesión completa 0,92 USD, lecturas de caché desde el 2º turno.

```sql
-- ¿funciona la caché y cuánto cuesta el mes?
select date_trunc('month', creado) mes, count(*) llamadas, sum(cache_leida) leidos, sum(coste_usd) usd
from coach_uso group by 1 order by 1;
```

## Cómo lee el contexto de premercado

NQ/MNQ es un **futuro continuo** (~23 h), así que la diferencia entre el cierre de ayer y la
apertura es **deriva overnight, NO un gap tradeable**. La IA no debe abrir el análisis con
"hay un gap" (antes lo hacía cada día); debe leer la relación de apertura (dentro/fuera del
rango de ayer y del overnight) y usar PDH/PDL y ONH/ONL como niveles de referencia.

Orden fijo del bloque de contexto:
1. **Datos de referencia** — PDO, PDH, PDL, cierre RTH/PDC, y **PDR** (Previous Day Range,
   = PDH − PDL, calculado).
2. **Contexto adicional** — deriva overnight, soporte/resistencia naranja.

## Horas

El Coach convierte las horas a **ET** antes del prompt (muestra la local entre paréntesis) y
fija RTH = 09:30–16:00 ET en la sección "HORAS Y SESIÓN". Ver
`.claude/rules/ninjatrader.md` — leía `entry_time` como si fuera ET y llamaba "premercado" a
un trade de plena apertura.

## Recomendaciones tipificadas (Fase 4B)

Implementado salvo **inyectar el catálogo de recomendaciones en el prompt**, para que
reutilice nombres en vez de duplicarlos. Ver `tasks/current.md`.

## ⚠️ El formato de salida se define en DOS sitios

`buildSystemPrompt` (system prompt) **y** `instruccionFormato` dentro de `analisisTecnico`
(mensaje del turno del usuario). El segundo **pesa más**: va en el turno del usuario, más
cerca de la atención del modelo.

Cambiar solo el system prompt NO funciona — pasó el 16 ago con los resúmenes "En corto:":
el modelo siguió el mensaje de instrucción, que aún tenía el formato viejo, y la única
sección que salió bien fue Aprendizaje, cuyo formato vive solo en el system prompt.

**Y el render nunca debe depender de que el modelo obedezca:** si falta la marca
`En corto:`, `resumenDerivado()` saca el resumen del propio texto y el detalle se pliega
igual. El muro técnico no se muestra jamás.
