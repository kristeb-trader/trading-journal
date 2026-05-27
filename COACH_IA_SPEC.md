# COACH IA — Especificación Completa del Módulo
## Trading Journal NQ Futures

**Versión:** 1.0  
**Fecha:** Mayo 2026  
**Estado:** ✅ Diseño aprobado — pendiente implementación  
**Sesión de diseño:** Completada (todas las decisiones confirmadas por el usuario)

---

## Contexto

Este documento captura el diseño completo del módulo **Coach IA** acordado en sesión de diseño. Si la sesión se interrumpe, este archivo es el punto de partida para continuar la implementación.

**Referencia:** El prompt base para el coach está en:  
`C:\Users\Asus\Downloads\Guia de prompt_chaumer.md`

---

## Resumen Ejecutivo

Reemplazar el actual botón "Generar resumen" (que produce análisis genérico y superficial con `claude-haiku`, max 400 tokens) por un **módulo completo de análisis diario profesional** basado en la estrategia Alfredo Chaumer, con chat multi-turno, memoria acumulativa, análisis de imagen (Vision), y diagnóstico técnico + emocional.

---

## Decisiones de Diseño Confirmadas

| # | Decisión | Confirmado |
|---|---|---|
| 1 | Estructura de 6 secciones (Chaumer) | ✅ |
| 2 | Estados emocionales como tabla en Supabase | ✅ |
| 3 | Reemplazar "Generar resumen" — solo queda Coach IA | ✅ |
| 4 | Guardar diagnóstico final + chat completo; coach lee solo el final | ✅ |

---

## 1. Cambios en el Sistema Actual

### Lo que desaparece
- Botón **"Generar resumen"** en el formulario de sesión (`form.js`)
- Función `generateAI()` en su forma actual (se reemplaza completamente)
- Sección de análisis one-shot con 4 secciones genéricas

### Lo que se reemplaza con
- Nueva **sección "Coach IA"** (sección 8 del dashboard)
- Chat multi-turno con análisis estructurado
- Diagnóstico profesional en 6 secciones

---

## 2. Estructura del Análisis — 6 Secciones (orden fijo)

```
CONTEXTO → DESARROLLO → VALIDACIÓN → ERRORES → APRENDIZAJE → RESUMEN
```

### Sección 1 — 🌍 CONTEXTO
- Lectura del gráfico de 5 minutos
- Tendencia del día anterior
- Niveles clave marcados (líneas rojas, verdes)
- Dirección probable del día
- Noticias relevantes (FOMC, noticias rojas ★★★)

### Sección 2 — 📈 DESARROLLO DE SESIÓN
- Descripción cronológica de lo ocurrido
- Identifica corridas, retrocesos, rompimientos y consecuciones
- Señala las zonas grises marcadas
- Sin juicio — solo describe los hechos

### Sección 3 — ✅ VALIDACIÓN DE SETUPS
- Para **cada setup** del día: ✅ o ❌ en cada filtro Chaumer
- Calcula stop en puntos y dólares
- Verifica obstáculos en el target
- Veredicto final: **ENTRADA VÁLIDA / ENTRADA INVÁLIDA + razón exacta**

### Sección 4 — ⚠️ ERRORES DETECTADOS
- Clasificación por categoría:
  - 🧠 **Psicológico** — duda, miedo, avaricia, impulsividad
  - 📐 **Analítico** — lectura incorrecta del contexto o zonas
  - ⚙️ **Operativo** — ejecución tardía, orden mal colocada
  - 🗺️ **Marcado** — zona marcada prematuramente o mal
- Comparación con errores históricos del trader
- **🚨 ALERTA CRÍTICA** si el mismo error aparece 3+ veces

### Sección 5 — 🎓 APRENDIZAJE DEL DÍA
- Qué confirmó la estrategia
- Qué fue atípico o nuevo
- Recomendación concreta para la **próxima sesión**

### Sección 6 — 📋 RESUMEN PARA DIARIO
Línea compacta que va al historial dinámico:
```
[2026-05-20] · Alcista · IRI Continuación · TARGET ✅ · Entrada a tiempo, corrida de 4 velas
```
Este resumen es la "memoria" que el coach lee cada día nuevo.

---

## 3. El Prompt del Coach

### Base
El prompt se construye desde la guía Chaumer (`Guia de prompt_chaumer.md`). El 80% se reutiliza tal cual.

### Secciones del system prompt (en orden)

```
[1] ROL Y COMPORTAMIENTO
    Eres un analista experto en estrategia Chaumer...
    Estricto, directo, VÁLIDO/INVÁLIDO sin excepciones.
    Responder siempre en español.

[2] ESTRATEGIA CHAUMER COMPLETA
    → Se carga dinámicamente desde la tabla `estrategia_chaumer` en Supabase
    → Siempre actualizada — si se edita la BD, el prompt refleja el cambio inmediatamente

[3] ERRORES HISTÓRICOS PERSONALES DEL TRADER
    → Se construye dinámicamente desde `diagnosticos_diarios`
    → Listado de errores documentados con fechas y repeticiones
    → Si el mismo error aparece 3+ veces → marcado como PATRÓN CRÍTICO

[4] HISTORIAL DINÁMICO (últimos 60 días)
    → resumen_compacto de cada sesión: [FECHA] · [DIR] · [SETUP] · [RESULTADO] · [APRENDIZAJE]
    → ~60 líneas, ~3KB — manejable en contexto

[5] CONTEXTO DE HOY
    → Trades del día (desde Supabase)
    → Checklist marcado
    → Casuísticas del día
    → Estado emocional seleccionado
    → Nivel de confianza
    → Imagen del chart (Vision — enviada como base64)

[6] INSTRUCCIÓN DE RESPUESTA
    → Responder siempre en las 6 secciones en ese orden exacto
    → No saltarse secciones aunque estén vacías
```

### Cambios técnicos vs prompt actual

| Aspecto | Actual | Nuevo |
|---|---|---|
| Modelo | `claude-haiku-4-5-20251001` | `claude-sonnet-4-5-20251001` |
| Max tokens | 400 | 3.000 |
| Temperatura | — | 0.3 (análisis técnico consistente) |
| Vision (imagen) | ❌ | ✅ — analiza el chart visual |
| Secciones | 4 genéricas | 6 técnicas Chaumer |
| Historial | Mes actual básico | 60 días de diagnósticos compactos |
| Estrategia | Hardcodeada en prompt | Desde BD, editable |
| Emociones | ❌ | ✅ — incluidas en contexto |
| Interacción | Un solo disparo | Chat multi-turno |

---

## 4. Base de Datos — Nuevas Tablas

### 4.1 `catalogo_emociones` ← NUEVA

```sql
CREATE TABLE catalogo_emociones (
  id      bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre  text NOT NULL,
  emoji   text,
  orden   integer DEFAULT 0,
  activa  boolean DEFAULT true
);

-- Permisos
ALTER TABLE catalogo_emociones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "emociones_read" ON catalogo_emociones FOR SELECT TO anon USING (true);
CREATE POLICY "emociones_update" ON catalogo_emociones FOR UPDATE TO anon USING (true);
GRANT SELECT, UPDATE ON catalogo_emociones TO anon;
```

**Datos iniciales:**
```sql
INSERT INTO catalogo_emociones (nombre, emoji, orden) VALUES
  ('En zona',       '🟢', 1),
  ('Tranquilo',     '😌', 2),
  ('Confiado',      '💪', 3),
  ('Neutral',       '😐', 4),
  ('Ansioso',       '😰', 5),
  ('Presionado',    '😤', 6),
  ('Cansado',       '😴', 7),
  ('Sobreconfiado', '🚫', 8);
```

**Editable desde:** Sección "Datos" del dashboard (igual que casuísticas, con drag-and-drop)

**Uso analítico:** cruzar estado emocional con win rate, disciplina y resultado del día.

---

### 4.2 `estrategia_chaumer` ← NUEVA

```sql
CREATE TABLE estrategia_chaumer (
  id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  seccion    text NOT NULL,  -- 'premercado', 'apertura', 'mecanica_entrada', etc.
  titulo     text NOT NULL,
  contenido  text NOT NULL,  -- Detalle completo de la sección en markdown
  orden      integer DEFAULT 0,
  activa     boolean DEFAULT true,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE estrategia_chaumer ENABLE ROW LEVEL SECURITY;
CREATE POLICY "estrategia_read"   ON estrategia_chaumer FOR SELECT TO anon USING (true);
CREATE POLICY "estrategia_update" ON estrategia_chaumer FOR UPDATE TO anon USING (true);
CREATE POLICY "estrategia_insert" ON estrategia_chaumer FOR INSERT TO anon WITH CHECK (true);
GRANT SELECT, UPDATE, INSERT ON estrategia_chaumer TO anon;
GRANT USAGE, SELECT ON SEQUENCE estrategia_chaumer_id_seq TO anon;
```

**Secciones a cargar inicialmente:**
```
1. premercado          — Noticias, volumen, zonas del premarket
2. apertura            — Primera vela, zona crítica
3. mecanica_entrada    — 7 pasos exactos de entrada
4. gestion_zona        — 3 escenarios + invalidación total
5. filtros             — 9 filtros de NO entrada
6. volumen             — Lectura de volumen
7. regla_de_oro        — Visualizar 2 escenarios antes de entrar
8. errores_historicos  — Errores documentados del trader (dinámico)
```

**Fuente de datos iniciales:** `C:\Users\Asus\Downloads\Guia de prompt_chaumer.md`

**Editable desde:** Nueva subsección "Estrategia Chaumer" dentro de la sección Coach IA (o en Datos)

---

### 4.3 `diagnosticos_diarios` ← NUEVA

```sql
CREATE TABLE diagnosticos_diarios (
  id                    bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  sesion_date           date UNIQUE,

  -- 6 secciones del análisis (texto completo)
  sec_contexto          text,
  sec_desarrollo        text,
  sec_validacion        text,
  sec_errores           text,
  sec_aprendizaje       text,
  sec_resumen_compacto  text,  -- "[FECHA] · [DIR] · [SETUP] · [RESULT] · [KEY]"

  -- Metadatos estructurados (para búsqueda y estadísticas)
  errores_json          jsonb,
  -- Formato: [{ "tipo": "psicologico", "descripcion": "...", "repetido": true, "veces": 4 }]

  setups_json           jsonb,
  -- Formato: [{ "setup": "IRI Apertura Alcista", "valido": true, "resultado": "target" }]

  -- Estado emocional del día (referencia a catalogo_emociones)
  estado_emocional_id   bigint REFERENCES catalogo_emociones(id),
  nivel_confianza       integer CHECK (nivel_confianza BETWEEN 1 AND 5),

  -- Detección de patrones
  patron_detectado      boolean DEFAULT false,
  patron_descripcion    text,

  -- Chat completo del día (guardado pero NO inyectado en prompts futuros)
  chat_messages         jsonb,
  -- Formato: [{ "role": "user"|"assistant", "content": "...", "timestamp": "..." }]

  -- Metadatos técnicos
  modelo_usado          text DEFAULT 'claude-sonnet-4-5-20251001',
  tokens_usados         integer,
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now()
);

ALTER TABLE diagnosticos_diarios DISABLE ROW LEVEL SECURITY;
GRANT INSERT, SELECT, UPDATE ON diagnosticos_diarios TO anon;
GRANT USAGE, SELECT ON SEQUENCE diagnosticos_diarios_id_seq TO anon;
```

---

### 4.4 Cambios en tabla existente `sesiones`

```sql
ALTER TABLE sesiones ADD COLUMN estado_emocional_id bigint REFERENCES catalogo_emociones(id);
ALTER TABLE sesiones ADD COLUMN nivel_confianza integer CHECK (nivel_confianza BETWEEN 1 AND 5);
```

---

## 5. Cambios en el Dashboard

### 5.1 Nueva sección: `coach` — "Coach IA"

**Posición en navegación:** sección 8 (después de Anual)
```html
<li class="nav-item" data-section="coach" title="Coach IA">
  <i class="ti ti-robot"></i>
  <span>Coach</span>
</li>
```

**Layout de la sección:**

```
┌─────────────────────────────────────────────────────────────────┐
│  🤖 COACH IA — Miércoles 20 de mayo, 2026                      │
│                                                                 │
│  Estado emocional: [En zona ▼]   Confianza: [●●●●○]           │
│  Chart del día:    [📎 Subir imagen] ← reutiliza Cloudinary    │
│                                                                 │
├──────────────────────────────┬──────────────────────────────────┤
│  ANÁLISIS ESTRUCTURADO       │  CHAT DE PROFUNDIZACIÓN         │
│  (se genera al hacer clic    │                                  │
│  en "Analizar sesión")       │  [Aquí aparece el chat          │
│                              │   multi-turno después           │
│  1. 🌍 CONTEXTO ──────────   │   del análisis inicial]         │
│  [texto del análisis]        │                                  │
│                              │  Coach: "..."                   │
│  2. 📈 DESARROLLO ─────────  │  Tú: "..."                      │
│  [texto del análisis]        │                                  │
│                              │  [───────────────────────]      │
│  3. ✅ VALIDACIÓN ─────────  │  Escribe tu pregunta...  [▶]   │
│  Setup 1: ✅ VÁLIDO          │                                  │
│  Setup 2: ❌ INVÁLIDO        │                                  │
│    → razón exacta            │                                  │
│                              │                                  │
│  4. ⚠️ ERRORES ────────────  │                                  │
│  5. 🎓 APRENDIZAJE ────────  │                                  │
│  6. 📋 RESUMEN ────────────  │                                  │
│                              │                                  │
│  [💾 Guardar diagnóstico]    │                                  │
└──────────────────────────────┴──────────────────────────────────┘
```

**Botón "Analizar sesión":** construye el contexto completo y envía al coach.  
**Botón "Guardar diagnóstico":** guarda en `diagnosticos_diarios`. Aparece activo solo después del análisis.

---

### 5.2 Nueva subsección dentro de Coach IA: Historial

Pestaña o scroll dentro de la sección Coach:
```
[📊 Análisis de Hoy]  [📅 Historial]  [📖 Estrategia]
                              ↓
  [2026-05-20] ✅ TARGET · IRI Cont. Alc. · En zona 🟢
  [2026-05-19] ❌ STOP   · IRI Apertura  · Presionado 😤 ⚠️ Psicológico
  [2026-05-15] ❌ STOP   · Reingreso     · Ansioso 😰
```
- Click en una fila → abre el diagnóstico completo de ese día
- Filtro por resultado (✅/❌) y tipo de error

---

### 5.3 Nueva subsección: Estrategia Chaumer

Pestaña dentro de Coach IA:
```
[📊 Análisis de Hoy]  [📅 Historial]  [📖 Estrategia]
                                              ↓
  ESTRATEGIA CHAUMER v4 — última actualización: 2026-05-20

  [premercado] [apertura] [mecánica entrada] [gestión zona]
  [filtros] [volumen] [regla de oro] [errores históricos]

  ┌────────────────────────────────────────────────────────┐
  │  MECÁNICA DE ENTRADA — PASO A PASO                     │
  │                                                        │
  │  1. El precio hace una corrida + retroceso             │
  │  2. Marcar zona gris en la mecha del retroceso        │
  │  [... texto editable ...]                              │
  │                                                        │
  │  [✏️ Editar]  [💾 Guardar]                            │
  └────────────────────────────────────────────────────────┘
```

---

### 5.4 Cambios en sección Métricas (existente)

Agregar panel de **errores por categoría**:

```
ERRORES POR CATEGORÍA — Mayo 2026
🧠 Psicológicos:  4  ████████░░  (↑ tendencia)
📐 Analíticos:    2  ████░░░░░░  (→ estable)
⚙️ Operativos:   1  ██░░░░░░░░  (↓ mejorando)
🗺️ Marcado:       3  ██████░░░░  (↑ tendencia)
```

Agregar panel de **emoción vs resultado** (cuando haya suficientes datos):
```
WIN RATE POR ESTADO EMOCIONAL
🟢 En zona:      72%
😌 Tranquilo:    65%
😐 Neutral:      61%
😤 Presionado:   33%  ← alerta
```

---

### 5.5 Cambios en sección Datos (existente)

Agregar nueva subsección **"Estados emocionales"** junto a Casuísticas:
- Drag-and-drop para reordenar (igual que casuísticas)
- Toggle activo/inactivo
- Botón "Agregar estado"
- Editar nombre y emoji

---

## 6. Cambios en el Bot de Telegram

Agregar 2 pasos nuevos al flujo (después de OPERO, antes de CONTEXTO):

### Nuevo paso: EMOCION
```
Bot: 😌 ¿Cómo llegas hoy a la sesión?
     [ 🟢 En zona ]  [ 😌 Tranquilo ]
     [ 💪 Confiado ]  [ 😐 Neutral ]
     [ 😰 Ansioso ]  [ 😤 Presionado ]
     [ 😴 Cansado ]  [ 🚫 Sobreconfiado ]
```
*La lista se carga desde `catalogo_emociones` — si el usuario agrega nuevos estados, aparecen en el bot automáticamente.*

### Nuevo paso: CONFIANZA
```
Bot: ¿Cuál es tu nivel de confianza hoy? (1 bajo → 5 alto)
     [ 1 ]  [ 2 ]  [ 3 ]  [ 4 ]  [ 5 ]
```

**Posición en la máquina de estados:**
```
OPERO → EMOCION → CONFIANZA → CONTEXTO → CORRIDA → VELAS → ...
```

---

## 7. Archivos a Crear / Modificar

### Archivos NUEVOS
| Archivo | Descripción |
|---|---|
| `js/coach.js` | Módulo completo del Coach IA (IIFE, como annual.js) |

### Archivos a MODIFICAR
| Archivo | Cambio |
|---|---|
| `js/app.js` | Agregar `coach` a `Nav.sections` + lazy init `Coach.init()` |
| `js/db.js` | Funciones para las 3 nuevas tablas |
| `js/form.js` | Eliminar botón "Generar resumen" y función `generateAI()` |
| `js/data.js` | Agregar sección de estados emocionales (junto a casuísticas) |
| `index.html` | Nav item Coach + section-coach HTML |
| `css/styles.css` | Estilos del coach: chat, análisis, historial, estrategia |
| `TelegramBot/worker.js` | Agregar pasos EMOCION y CONFIANZA |
| `sw.js` | Agregar `./js/coach.js` al APP_SHELL + bump CACHE a `nqjournal-v4` |

### NO se modifica
| Archivo | Razón |
|---|---|
| `Cloudflare Worker #1` (proxy) | Ya es proxy genérico, soporta conversaciones multi-turno |
| `NinjaTrader/SupabaseAutoExport.cs` | Sin cambios |
| `calendar.js`, `metrics.js`, `charts.js`, `gallery.js`, `table.js`, `annual.js` | Sin cambios directos |

---

## 8. Nuevas Funciones en `db.js`

```javascript
// Catálogo de emociones
getCatalogoEmociones()           // SELECT * ORDER BY orden ASC WHERE activa = true
updateEmocionOrden(id, orden)    // PATCH orden

// Estrategia Chaumer
getEstrategiaSecciones()         // SELECT * ORDER BY orden ASC WHERE activa = true
updateEstrategiaSeccion(id, contenido)  // PATCH contenido + updated_at

// Diagnósticos diarios
getDiagnosticoByDate(date)       // SELECT WHERE sesion_date = date
saveDiagnostico(data)            // POST con resolution=merge-duplicates
getHistorialCompacto(limit=60)   // SELECT sec_resumen_compacto ORDER BY sesion_date DESC LIMIT 60
getErroresHistoricos()           // SELECT errores_json para construir patrones
```

---

## 9. Lógica del Coach — `coach.js`

### Estructura del módulo (IIFE)
```javascript
const Coach = (() => {
  // Estado interno
  let chatHistory = []        // Conversación del día en memoria
  let diagnosticoActual = {}  // Análisis en curso
  let estrategiaCache = null  // Cache de la estrategia (se recarga 1x por sesión)

  // Funciones principales
  async function init()              // Inicializar sección, cargar datos
  async function buildSystemPrompt() // Construir prompt con todos los datos
  async function iniciarAnalisis()   // Primer análisis automático (6 secciones)
  async function enviarMensaje(msg)  // Chat multi-turno
  async function guardarDiagnostico() // Guardar en diagnosticos_diarios

  // Funciones de contexto
  async function cargarHistorialCompacto()  // últimos 60 días
  async function cargarEstrategiaCompleta() // desde estrategia_chaumer
  async function cargarContextoHoy()        // trades + checklist + casuísticas de hoy
  async function detectarPatrones()         // errores repetidos → alertas

  // UI
  function renderAnalisis(sections)  // Renderizar las 6 secciones
  function renderChatMessage(msg)    // Agregar mensaje al chat
  function renderHistorial(data)     // Lista de diagnósticos pasados
  function renderEstrategia(data)    // Editor de estrategia

  return { init }
})()
```

### Construcción del system prompt

```javascript
async function buildSystemPrompt() {
  const estrategia = await cargarEstrategiaCompleta()   // desde BD
  const historial  = await cargarHistorialCompacto()    // últimos 60 días
  const patrones   = await detectarPatrones()           // errores recurrentes
  const hoy        = await cargarContextoHoy()          // trades, checklist, emoción

  return `
Eres un analista experto en la estrategia de trading de Chaumer...
[REGLAS DE COMPORTAMIENTO]

## ESTRATEGIA CHAUMER COMPLETA
${estrategia}

## ERRORES HISTÓRICOS DEL TRADER
${patrones}

## HISTORIAL DE SESIONES (últimos 60 días)
${historial}

## SESIÓN DE HOY — ${hoy.fecha}
Estado emocional: ${hoy.emocion} | Confianza: ${hoy.confianza}/5
Trades: ${hoy.trades}
Checklist: ${hoy.checklist}
Casuísticas: ${hoy.casuisticas}

## INSTRUCCIÓN DE RESPUESTA
Analiza la sesión en exactamente 6 secciones en este orden:
1. CONTEXTO | 2. DESARROLLO | 3. VALIDACIÓN | 4. ERRORES | 5. APRENDIZAJE | 6. RESUMEN
`
}
```

### Análisis con imagen (Vision)

```javascript
async function iniciarAnalisis(imagenBase64 = null) {
  const systemPrompt = await buildSystemPrompt()
  const userContent  = imagenBase64
    ? [
        { type: 'image', source: { type: 'base64', media_type: 'image/png', data: imagenBase64 } },
        { type: 'text', text: 'Analiza esta gráfica y realiza el análisis completo de la sesión.' }
      ]
    : 'Realiza el análisis completo de la sesión de hoy sin imagen de referencia.'

  const response = await fetch(CLAUDE_PROXY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5-20251001',
      max_tokens: 3000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userContent }]
    })
  })
  // ...
}
```

### Chat multi-turno

```javascript
async function enviarMensaje(textoUsuario) {
  chatHistory.push({ role: 'user', content: textoUsuario })

  const response = await fetch(CLAUDE_PROXY_URL, {
    method: 'POST',
    body: JSON.stringify({
      model: 'claude-sonnet-4-5-20251001',
      max_tokens: 1500,
      system: systemPromptCacheado,   // mismo system prompt del análisis inicial
      messages: chatHistory            // historial completo del día
    })
  })

  const respuesta = await response.json()
  chatHistory.push({ role: 'assistant', content: respuesta.content[0].text })
  renderChatMessage(respuesta.content[0].text)
}
```

---

## 10. Guardado del Diagnóstico

Al hacer clic en "Guardar diagnóstico":

```javascript
async function guardarDiagnostico() {
  const data = {
    sesion_date:          hoy,
    sec_contexto:         diagnosticoActual.contexto,
    sec_desarrollo:       diagnosticoActual.desarrollo,
    sec_validacion:       diagnosticoActual.validacion,
    sec_errores:          diagnosticoActual.errores,
    sec_aprendizaje:      diagnosticoActual.aprendizaje,
    sec_resumen_compacto: diagnosticoActual.resumen,
    errores_json:         parsearErrores(diagnosticoActual.errores),
    setups_json:          parsearSetups(diagnosticoActual.validacion),
    estado_emocional_id:  emocionSeleccionada,
    nivel_confianza:      confianzaSeleccionada,
    patron_detectado:     patronesDetectados.length > 0,
    patron_descripcion:   patronesDetectados.join('; '),
    chat_messages:        chatHistory,         // chat completo guardado
    modelo_usado:         'claude-sonnet-4-5-20251001'
  }

  await db.saveDiagnostico(data)
  // También actualizar sesiones.estado_emocional_id y sesiones.nivel_confianza
}
```

---

## 11. Flujo Diario — Cómo Queda el Uso

```
1. NinjaTrader cierra trade → Supabase recibe datos → Telegram notifica

2. Trader abre Dashboard → sección "Coach IA"
   - Selecciona estado emocional y nivel de confianza
   - Sube imagen del chart (opcional pero recomendado)
   - Clic en "Analizar sesión"

3. Coach construye contexto (~2-3 segundos)
   - Estrategia Chaumer completa (desde BD)
   - Historial de 60 días (resúmenes compactos)
   - Patrones de error del trader
   - Trades + checklist + casuísticas de hoy
   - Imagen del chart (Vision)

4. Coach responde en 6 secciones (15-30 segundos)
   - Contexto → Desarrollo → Validación → Errores → Aprendizaje → Resumen

5. Trader chatea para profundizar (opcional)
   - "¿Por qué era inválido el segundo setup?"
   - "¿Qué debo mejorar esta semana?"
   - "¿Cómo manejo el miedo después de 2 stops seguidos?"

6. Clic en "Guardar diagnóstico"
   - Se almacena en diagnosticos_diarios
   - El resumen compacto entra al historial del próximo día
   - Los errores categorizados actualizan las métricas
```

---

## 12. Costo Estimado

| Componente | Tokens aprox. | Costo aprox. |
|---|---|---|
| System prompt (estrategia + historial) | ~4.000 input | — |
| Contexto de hoy | ~800 input | — |
| Imagen del chart (si se sube) | ~2.000 input | — |
| Respuesta análisis inicial | ~2.500 output | — |
| **Total por análisis inicial** | **~9.300 tokens** | **~$0.017** |
| Chat de profundización (3-5 turnos) | ~3.000 tokens | ~$0.006 |
| **Total por sesión completa** | **~12.300 tokens** | **~$0.023** |

**Costo mensual estimado (20 sesiones):** ~$0.46  
Comparado con el sistema actual: ~$0.016/mes  
**Diferencia:** ~$0.45/mes adicionales por un análisis profesional completo.

---

## 13. Resumen de Cambios en la Base de Datos

| Tabla | Tipo | Descripción |
|---|---|---|
| `catalogo_emociones` | ✅ Nueva | 8 estados emocionales editables, drag-and-drop |
| `estrategia_chaumer` | ✅ Nueva | Estrategia completa por secciones, editable desde dashboard |
| `diagnosticos_diarios` | ✅ Nueva | 6 secciones + metadatos JSON + chat completo |
| `sesiones` | 🔧 Modificar | +2 columnas: `estado_emocional_id`, `nivel_confianza` |

---

## 14. Resumen de Cambios en el Dashboard

| Sección | Tipo | Descripción |
|---|---|---|
| `coach` | ✅ Nueva (sección 8) | Chat + análisis + historial + editor de estrategia |
| `metrics` | 🔧 Mejorar | +errores por categoría + win rate por emoción |
| `data` | 🔧 Mejorar | +estados emocionales (junto a casuísticas) |
| `form` | 🔧 Modificar | Eliminar botón "Generar resumen" |

---

## 15. Estado de Implementación

- [x] Diseño aprobado por el usuario
- [ ] Crear tablas en Supabase (`catalogo_emociones`, `estrategia_chaumer`, `diagnosticos_diarios`)
- [ ] Agregar columnas a `sesiones`
- [ ] Cargar estrategia Chaumer inicial en BD (desde `Guia de prompt_chaumer.md`)
- [ ] Cargar emociones iniciales en BD (8 estados)
- [ ] Crear `js/coach.js`
- [ ] Modificar `js/app.js` (nueva sección)
- [ ] Modificar `js/db.js` (nuevas funciones)
- [ ] Modificar `js/form.js` (eliminar generateAI)
- [ ] Modificar `js/data.js` (agregar emociones)
- [ ] Modificar `index.html` (nav + section HTML)
- [ ] Modificar `css/styles.css` (estilos coach)
- [ ] Modificar `TelegramBot/worker.js` (pasos EMOCION y CONFIANZA)
- [ ] Modificar `sw.js` (agregar coach.js, bump a nqjournal-v4)
- [ ] Probar flujo completo

---

*COACH_IA_SPEC.md — Trading Journal NQ Futures | v1.0 | Mayo 2026*
