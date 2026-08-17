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

- **El prompt lleva `cache_control`** (system + último turno de usuario). Es un match de
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
