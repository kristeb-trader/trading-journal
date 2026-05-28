// Coach IA — Módulo de análisis diario profesional (Estrategia Chaumer)
const Coach = (() => {

  const CLAUDE_URL = 'https://broad-hall-c53f.kristerock.workers.dev/api/claude'
  const MODEL      = 'claude-sonnet-4-6'
  const MAX_TOKENS = 3000

  // ── Estado interno ─────────────────────────────────────────────────────
  let chatHistory       = []   // conversación del día en memoria
  let systemPromptCache = null // se construye una vez por sesión abierta
  let diagnosticoActual = {}   // secciones parseadas del último análisis
  let estrategiaCache   = null // se recarga 1x por init
  let emocionesCache    = []   // catálogo de emociones
  let coachDate         = null // fecha activa en el coach
  let imagenBase64      = null // chart subido (si existe)
  let diagnosticoGuardado = false

  // ── Helpers ────────────────────────────────────────────────────────────

  function today() {
    return new Date().toISOString().slice(0, 10)
  }

  function fmtDate(d) {
    if (!d) return ''
    const [y, m, day] = d.split('-')
    const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
    return `${parseInt(day)} ${months[parseInt(m)-1]} ${y}`
  }

  function fmtPnl(v) {
    const n = parseFloat(v) || 0
    return `${n >= 0 ? '+' : ''}$${n.toFixed(2)}`
  }

  // ── Construcción del System Prompt ────────────────────────────────────

  async function buildSystemPrompt(date) {
    const [estrategia, historial, patrones, sesion, trades, casuisticas, emociones] = await Promise.all([
      cargarEstrategia(),
      cargarHistorialCompacto(),
      detectarPatrones(),
      DB.getSesionByDate(date),
      DB.getTradesByDate(date),
      DB.getCasuisticasByDate(date),
      DB.getCatalogoEmociones()
    ])

    // Emoción inicio (UI tiene precedencia para capturar lo recién seleccionado)
    const emocionInicioId = parseInt(document.getElementById('coachEmocionSelect')?.value) || sesion?.estado_emocional_id
    const emocionInicio = emocionInicioId
      ? (emociones.find(e => e.id === emocionInicioId)?.nombre || 'No indicado')
      : 'No indicado'

    // Emoción cierre
    const emocionFinId = parseInt(document.getElementById('coachEmocionFinSelect')?.value) || null
    const emocionFin = emocionFinId
      ? (emociones.find(e => e.id === emocionFinId)?.nombre || 'No indicado')
      : 'No indicado'

    const confianza = sesion?.nivel_confianza
      ? `${sesion.nivel_confianza}/5`
      : 'No indicado'

    // Trades de hoy
    const pnlHoy      = trades.reduce((s, t) => s + (parseFloat(t.profit) || 0), 0)
    const targetsHoy  = trades.filter(t => t.resultado === 'target').length
    const stopsHoy    = trades.filter(t => t.resultado === 'stop').length
    const besHoy      = trades.filter(t => t.resultado === 'be').length
    const tradesStr   = trades.length > 0
      ? `${trades.length} trades (Targets: ${targetsHoy} | Stops: ${stopsHoy} | BEs: ${besHoy}) — P&L: ${fmtPnl(pnlHoy)}`
      : 'Sin trades registrados'

    // Checklist
    const chkLabels = [
      ['chk_zonas',      'Zonas vigentes verificadas'],
      ['chk_orden',      'Orden precolocada a tiempo'],
      ['chk_5velas',     'Máx 5 velas en corrida'],
      ['chk_noticias',   'Calendario económico verificado (sin noticia roja)'],
      ['chk_consecucion','Zona con rompimiento + consecución'],
      ['chk_estructura', 'Estructura IRI fluida'],
    ]
    const checklistStr = sesion
      ? chkLabels.map(([k, l]) => `${sesion[k] ? '✓' : '✗'} ${l}`).join('\n  ')
      : 'Sin datos de checklist'

    // Casuísticas
    const casStr = casuisticas.length
      ? casuisticas.map(c => `  - ${c.resultado === 'T' ? 'Target' : 'Stop'}: ${c.casuistica}`).join('\n')
      : '  Ninguna'

    // Setup válido no tomado
    let setupNoTomadoStr = ''
    if (sesion?.setup_valido_no_tomado) {
      setupNoTomadoStr = `\nSETUP VÁLIDO NO TOMADO: ${sesion.setup_observado || 'No especificado'}
Motivo de no entrada: ${sesion.motivo_no_entrada || 'No especificado'}`
    }

    // Zona naranja testeo
    let zonaNaranjaStr = 'No registrado'
    if (sesion?.zona_naranja_habia === true) {
      zonaNaranjaStr = `SÍ había zona naranja en el camino al target
  Reacción del precio: ${sesion.zona_naranja_reaccion || 'No registrado'}${sesion.zona_naranja_nota ? `\n  Nota: ${sesion.zona_naranja_nota}` : ''}`
    } else if (sesion?.zona_naranja_habia === false) {
      zonaNaranjaStr = 'NO había zona naranja'
    }

    // Análisis del trader
    const analisisTrader = sesion?.analisis_trader || 'No registrado'

    return `Eres un analista experto en la estrategia de trading de Chaumer (trader_sociologist), especializado en futuros MNQ/NQ en gráfico de 1 minuto con NinjaTrader. Tu rol es analizar la sesión diaria, validar setups según las reglas exactas de la estrategia, y acumular aprendizaje sesión a sesión para dar recomendaciones cada vez más precisas.

Responde SIEMPRE en español. Sé estricto y directo — si el trader cometió errores, señálalos sin suavizarlos. No des falsas motivaciones cuando los datos muestran mal desempeño. Si algo no está claro, pregunta antes de dar veredicto. Nunca recomendar entrar si algún filtro falla. Veredictos: VÁLIDO o INVÁLIDO, con la razón exacta.

---

## ESTRATEGIA CHAUMER COMPLETA (v4)

${estrategia}

---

## PATRONES CRÍTICOS DEL TRADER

${patrones}

---

## HISTORIAL DE SESIONES (últimos 60 días)

${historial}

---

## SESIÓN DE HOY — ${date}

Estado emocional al inicio: ${emocionInicio}
Estado emocional al cierre: ${emocionFin}
Confianza pre-sesión: ${confianza}
Contexto de mercado: ${sesion?.contexto || 'No indicado'}
Setup del día: ${sesion?.setup || 'No indicado'}

Trades:
  ${tradesStr}

Checklist:
  ${checklistStr}

Casuísticas:
${casStr}

Análisis del trader:
  "${analisisTrader}"
${setupNoTomadoStr}
Zonas naranjas (testeo experimental):
  ${zonaNaranjaStr}

---

## INSTRUCCIÓN INICIAL

Al recibir el primer mensaje (o la imagen del gráfico), analiza la sesión en exactamente 6 secciones con este orden y formato:

**1. 🌍 CONTEXTO**
[Lectura del gráfico de 5 min, tendencia del día anterior, niveles clave, dirección probable, noticias relevantes]

**2. 📈 DESARROLLO DE SESIÓN**
[Descripción cronológica: corridas, retrocesos, rompimientos, consecuciones identificadas]

**3. ✅ VALIDACIÓN DE SETUPS**
[Para cada setup potencial: ✅ o ❌ en cada filtro, stop en puntos y dólares, obstáculos en target]
[Veredicto final: ENTRADA VÁLIDA / ENTRADA INVÁLIDA + razón exacta]

**4. ⚠️ ERRORES DETECTADOS**
[Clasificar: 🧠 Psicológico / 📐 Analítico / ⚙️ Operativo / 🗺️ Marcado]
[Comparar con historial — alertar si el error se repite 3+ veces]

**5. 🎓 APRENDIZAJE DEL DÍA**
[Qué confirmó la estrategia | Qué fue nuevo o atípico | Recomendación para mañana]

**6. 📋 RESUMEN PARA DIARIO**
[Una sola línea: [FECHA] · [DIRECCIÓN] · [SETUP] · [RESULTADO] · [APRENDIZAJE CLAVE]]

Tras el análisis inicial, responde preguntas de seguimiento del trader con el mismo nivel de rigor.`
  }

  // ── Carga de datos ─────────────────────────────────────────────────────

  async function cargarEstrategia() {
    if (estrategiaCache) return estrategiaCache
    const secciones = await DB.getEstrategiaSecciones()
    estrategiaCache = secciones.map(s => `### ${s.titulo}\n${s.contenido}`).join('\n\n')
    return estrategiaCache
  }

  async function cargarHistorialCompacto() {
    const historial = await DB.getHistorialCompacto(60)
    if (!historial.length) return 'Sin historial previo registrado.'
    return historial
      .slice()
      .reverse()
      .map(d => d.sec_resumen_compacto)
      .filter(Boolean)
      .join('\n')
  }

  async function detectarPatrones() {
    const erroresData = await DB.getErroresHistoricos()
    if (!erroresData.length) return 'Sin patrones identificados aún.'

    // Contar errores por tipo y descripción
    const conteo = {}
    erroresData.forEach(d => {
      const errores = d.errores_json || []
      errores.forEach(e => {
        const key = `${e.tipo}||${e.descripcion}`
        if (!conteo[key]) conteo[key] = { tipo: e.tipo, descripcion: e.descripcion, veces: 0, fechas: [] }
        conteo[key].veces++
        conteo[key].fechas.push(d.sesion_date)
      })
    })

    const alertas = Object.values(conteo)
      .filter(e => e.veces >= 2)
      .sort((a, b) => b.veces - a.veces)

    if (!alertas.length) return 'Sin patrones repetidos aún.'

    return alertas.map(e => {
      const nivel = e.veces >= 3 ? '🚨 ALERTA CRÍTICA' : '⚠️ ALERTA MEDIA'
      const tipoEmoji = { psicologico: '🧠', analitico: '📐', operativo: '⚙️', marcado: '🗺️' }[e.tipo] || '⚠️'
      return `${nivel} — ${tipoEmoji} ${e.tipo}: "${e.descripcion}" (${e.veces}× — última vez: ${e.fechas[0]})`
    }).join('\n')
  }

  // ── Llamada a Claude ───────────────────────────────────────────────────

  async function llamarClaude(userContent, isFirst = false) {
    const apiKey = localStorage.getItem('claude_api_key')
    if (!apiKey) throw new Error('Configura tu API Key de Claude en ⚙ Ajustes')

    if (isFirst) {
      systemPromptCache = await buildSystemPrompt(coachDate)
      chatHistory = []
    }

    // Agregar mensaje al historial
    chatHistory.push({ role: 'user', content: userContent })

    const res = await fetch(CLAUDE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'X-Dashboard-Token': localStorage.getItem('dashboard_secret') || '',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: systemPromptCache,
        messages: chatHistory,
      })
    })

    if (!res.ok) {
      const txt = await res.text()
      throw new Error(`Error ${res.status}: ${txt}`)
    }

    const data = await res.json()
    const texto = data?.content?.[0]?.text || ''
    if (!texto) throw new Error('Respuesta vacía de Claude')

    chatHistory.push({ role: 'assistant', content: texto })
    return texto
  }

  // ── Parsear secciones del análisis ────────────────────────────────────

  function parsearSecciones(texto) {
    const secciones = {
      contexto: '', desarrollo: '', validacion: '',
      errores: '', aprendizaje: '', resumen: ''
    }
    const patrones = [
      { key: 'contexto',   re: /\*\*1[.\s]*🌍\s*CONTEXTO\*\*([\s\S]*?)(?=\*\*2[.\s]*📈|\*\*2[.\s]*DESARROLLO|$)/i },
      { key: 'desarrollo', re: /\*\*2[.\s]*📈\s*DESARROLLO[^*]*\*\*([\s\S]*?)(?=\*\*3[.\s]*✅|\*\*3[.\s]*VALIDACIÓN|$)/i },
      { key: 'validacion', re: /\*\*3[.\s]*✅\s*VALIDACIÓN[^*]*\*\*([\s\S]*?)(?=\*\*4[.\s]*⚠️|\*\*4[.\s]*ERRORES|$)/i },
      { key: 'errores',    re: /\*\*4[.\s]*⚠️\s*ERRORES[^*]*\*\*([\s\S]*?)(?=\*\*5[.\s]*🎓|\*\*5[.\s]*APRENDIZAJE|$)/i },
      { key: 'aprendizaje',re: /\*\*5[.\s]*🎓\s*APRENDIZAJE[^*]*\*\*([\s\S]*?)(?=\*\*6[.\s]*📋|\*\*6[.\s]*RESUMEN|$)/i },
      { key: 'resumen',    re: /\*\*6[.\s]*📋\s*RESUMEN[^*]*\*\*([\s\S]*?)$/i },
    ]
    patrones.forEach(({ key, re }) => {
      const match = texto.match(re)
      if (match) secciones[key] = match[1].trim()
    })
    return secciones
  }

  function parsearErroresJson(textoErrores) {
    if (!textoErrores || textoErrores.trim() === 'Ninguno detectado.') return []
    const tipos = ['psicologico', 'analitico', 'operativo', 'marcado']
    const errores = []
    const lines = textoErrores.split('\n').filter(l => l.trim())
    lines.forEach(line => {
      const tipo = tipos.find(t => line.toLowerCase().includes(t)) || 'otro'
      const desc = line.replace(/^[-*•🧠📐⚙️🗺️\s]+/, '').trim()
      if (desc) errores.push({ tipo, descripcion: desc })
    })
    return errores
  }

  function parsearSetupsJson(textoValidacion) {
    if (!textoValidacion) return []
    const setups = []
    const bloques = textoValidacion.split(/(?=setup|entrada)/i)
    bloques.forEach(bloque => {
      const valido   = /ENTRADA VÁLIDA/i.test(bloque)
      const invalido = /ENTRADA INVÁLIDA/i.test(bloque)
      if (!valido && !invalido) return
      setups.push({
        descripcion: bloque.slice(0, 100).trim(),
        valido: valido && !invalido
      })
    })
    return setups
  }

  // ── Render del análisis estructurado ──────────────────────────────────

  function renderAnalisis(secciones) {
    const container = document.getElementById('coachAnalisisContent')
    if (!container) return

    const md = text => text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/✅/g, '<span class="coach-valid">✅</span>')
      .replace(/❌/g, '<span class="coach-invalid">❌</span>')
      .replace(/🚨/g, '<span class="coach-alert-critical">🚨</span>')
      .replace(/⚠️/g, '<span class="coach-alert-warn">⚠️</span>')
      .replace(/\n/g, '<br>')

    container.innerHTML = `
      <div class="coach-section" id="cs-contexto">
        <div class="coach-section-header"><span class="cs-icon">🌍</span><span>CONTEXTO</span></div>
        <div class="coach-section-body">${md(secciones.contexto || '—')}</div>
      </div>
      <div class="coach-section" id="cs-desarrollo">
        <div class="coach-section-header"><span class="cs-icon">📈</span><span>DESARROLLO DE SESIÓN</span></div>
        <div class="coach-section-body">${md(secciones.desarrollo || '—')}</div>
      </div>
      <div class="coach-section" id="cs-validacion">
        <div class="coach-section-header"><span class="cs-icon">✅</span><span>VALIDACIÓN DE SETUPS</span></div>
        <div class="coach-section-body">${md(secciones.validacion || '—')}</div>
      </div>
      <div class="coach-section ${secciones.errores && secciones.errores.length > 10 ? 'cs-has-errors' : ''}" id="cs-errores">
        <div class="coach-section-header"><span class="cs-icon">⚠️</span><span>ERRORES DETECTADOS</span></div>
        <div class="coach-section-body">${md(secciones.errores || 'Ninguno detectado.')}</div>
      </div>
      <div class="coach-section" id="cs-aprendizaje">
        <div class="coach-section-header"><span class="cs-icon">🎓</span><span>APRENDIZAJE DEL DÍA</span></div>
        <div class="coach-section-body">${md(secciones.aprendizaje || '—')}</div>
      </div>
      <div class="coach-section cs-resumen" id="cs-resumen">
        <div class="coach-section-header"><span class="cs-icon">📋</span><span>RESUMEN PARA DIARIO</span></div>
        <div class="coach-section-body">${md(secciones.resumen || '—')}</div>
      </div>
    `
  }

  // ── Render del chat ────────────────────────────────────────────────────

  function renderMensaje(role, texto) {
    const chat = document.getElementById('coachChatMessages')
    if (!chat) return
    const div = document.createElement('div')
    div.className = `chat-msg chat-msg-${role}`
    const md = text => text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>')
    div.innerHTML = `
      <div class="chat-bubble">
        ${role === 'assistant' ? '<span class="chat-avatar">🤖</span>' : ''}
        <div class="chat-text">${md(texto)}</div>
        ${role === 'user' ? '<span class="chat-avatar">👤</span>' : ''}
      </div>`
    chat.appendChild(div)
    chat.scrollTop = chat.scrollHeight
  }

  function renderTyping(show) {
    const chat = document.getElementById('coachChatMessages')
    if (!chat) return
    const existing = document.getElementById('chat-typing')
    if (existing) existing.remove()
    if (!show) return
    const div = document.createElement('div')
    div.id = 'chat-typing'
    div.className = 'chat-msg chat-msg-assistant'
    div.innerHTML = `<div class="chat-bubble"><span class="chat-avatar">🤖</span><div class="chat-typing-dots"><span></span><span></span><span></span></div></div>`
    chat.appendChild(div)
    chat.scrollTop = chat.scrollHeight
  }

  // ── Iniciar análisis ──────────────────────────────────────────────────

  async function iniciarAnalisis() {
    const btn = document.getElementById('coachAnalyzeBtn')
    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="ti ti-loader-2 spin"></i> Analizando...' }

    // Limpiar estado previo
    chatHistory = []
    diagnosticoActual = {}
    diagnosticoGuardado = false
    systemPromptCache = null
    const chatEl = document.getElementById('coachChatMessages')
    if (chatEl) chatEl.innerHTML = ''
    const analisisEl = document.getElementById('coachAnalisisContent')
    if (analisisEl) analisisEl.innerHTML = '<div class="coach-loading"><i class="ti ti-loader-2 spin"></i> Construyendo análisis...</div>'
    ocultarGuardar()

    try {
      // Construir el contenido del usuario (texto + imagen si existe)
      const instruccionFormato = `Realiza el análisis completo en exactamente 6 secciones. USA OBLIGATORIAMENTE estos encabezados con este formato exacto (negrita + número + emoji):

**1. 🌍 CONTEXTO**
**2. 📈 DESARROLLO DE SESIÓN**
**3. ✅ VALIDACIÓN DE SETUPS**
**4. ⚠️ ERRORES DETECTADOS**
**5. 🎓 APRENDIZAJE DEL DÍA**
**6. 📋 RESUMEN PARA DIARIO**

Si no hay datos de sesión registrados, igual completa las 6 secciones basándote en lo disponible e indicando la falta de información donde corresponda.`

      let userContent
      if (imagenBase64) {
        userContent = [
          { type: 'image', source: { type: 'base64', media_type: imagenBase64.mediaType, data: imagenBase64.data } },
          { type: 'text', text: `Analiza esta gráfica de la sesión. ${instruccionFormato}` }
        ]
      } else {
        userContent = `No tengo imagen disponible, usa los datos numéricos del sistema de contexto. ${instruccionFormato}`
      }

      const respuesta = await llamarClaude(userContent, true)
      diagnosticoActual = parsearSecciones(respuesta)

      // Fallback: si el parseo no capturó ninguna sección, mostrar respuesta completa en "contexto"
      const hayContenido = Object.values(diagnosticoActual).some(v => v && v.trim().length > 20)
      if (!hayContenido) {
        diagnosticoActual.contexto = respuesta
      }

      renderAnalisis(diagnosticoActual)

      // Mostrar mensaje inicial en el chat
      renderMensaje('assistant', '✅ Análisis completado. ¿Tienes alguna pregunta sobre la sesión de hoy? Puedes preguntarme sobre cualquier setup, error o aspecto de tu operativa.')
      mostrarGuardar()

    } catch (err) {
      if (analisisEl) analisisEl.innerHTML = `<div class="coach-error"><i class="ti ti-alert-triangle"></i> Error: ${err.message}</div>`
      Toast.show('Error al analizar: ' + err.message, 'error')
    } finally {
      if (btn) { btn.disabled = false; btn.innerHTML = '<i class="ti ti-robot"></i> Analizar sesión' }
    }
  }

  // ── Enviar mensaje del chat ────────────────────────────────────────────

  async function enviarMensaje() {
    const input = document.getElementById('coachChatInput')
    const texto = input?.value?.trim()
    if (!texto) return
    if (!systemPromptCache) { Toast.show('Primero haz el análisis inicial', 'warning'); return }

    input.value = ''
    renderMensaje('user', texto)
    renderTyping(true)

    const sendBtn = document.getElementById('coachSendBtn')
    if (sendBtn) sendBtn.disabled = true

    try {
      const respuesta = await llamarClaude(texto, false)
      renderTyping(false)
      renderMensaje('assistant', respuesta)
    } catch (err) {
      renderTyping(false)
      renderMensaje('assistant', `❌ Error: ${err.message}`)
    } finally {
      if (sendBtn) sendBtn.disabled = false
      input?.focus()
    }
  }

  // ── Guardar diagnóstico ───────────────────────────────────────────────

  function mostrarGuardar() {
    document.querySelectorAll('.coach-save-btn').forEach(btn => btn.classList.remove('hidden'))
  }

  function ocultarGuardar() {
    document.querySelectorAll('.coach-save-btn').forEach(btn => btn.classList.add('hidden'))
  }

  async function guardarDiagnostico() {
    if (diagnosticoGuardado) { Toast.show('Ya guardado', 'info'); return }
    if (!diagnosticoActual.resumen && !diagnosticoActual.contexto) { Toast.show('Primero genera el análisis', 'warning'); return }

    const btns = document.querySelectorAll('.coach-save-btn')
    btns.forEach(btn => { btn.disabled = true; btn.innerHTML = '<i class="ti ti-loader-2 spin"></i> Guardando...' })

    try {
      const emocionId    = document.getElementById('coachEmocionSelect')?.value
        ? parseInt(document.getElementById('coachEmocionSelect').value) : null
      const emocionFinId = document.getElementById('coachEmocionFinSelect')?.value
        ? parseInt(document.getElementById('coachEmocionFinSelect').value) : null
      const confianza    = document.getElementById('coachConfianzaVal')?.value
        ? parseInt(document.getElementById('coachConfianzaVal').value) : null

      const erroresJson  = parsearErroresJson(diagnosticoActual.errores)
      const setuosJson   = parsearSetupsJson(diagnosticoActual.validacion)
      const patronesDetectados = erroresJson.filter(e => e.repetido)

      const payload = {
        sesion_date:          coachDate,
        sec_contexto:         diagnosticoActual.contexto,
        sec_desarrollo:       diagnosticoActual.desarrollo,
        sec_validacion:       diagnosticoActual.validacion,
        sec_errores:          diagnosticoActual.errores,
        sec_aprendizaje:      diagnosticoActual.aprendizaje,
        sec_resumen_compacto: diagnosticoActual.resumen,
        errores_json:         erroresJson,
        setups_json:          setuosJson,
        estado_emocional_id:     emocionId,
        estado_emocional_fin_id: emocionFinId,
        nivel_confianza:         confianza,
        patron_detectado:     patronesDetectados.length > 0,
        patron_descripcion:   patronesDetectados.map(e => e.descripcion).join('; ') || null,
        chat_messages:        chatHistory,
        modelo_usado:         MODEL,
        updated_at:           new Date().toISOString(),
      }

      await DB.saveDiagnostico(payload)

      // Actualizar también la sesión con emoción y confianza
      if (emocionId || confianza) {
        const sesion = await DB.getSesionByDate(coachDate)
        if (sesion) {
          await DB.upsertSesion({
            sesion_date: coachDate,
            estado_emocional_id: emocionId,
            nivel_confianza: confianza,
          })
        }
      }

      diagnosticoGuardado = true
      Toast.show('Diagnóstico guardado correctamente', 'success')
      btns.forEach(btn => { btn.innerHTML = '<i class="ti ti-circle-check"></i> Guardado' })

      // Refrescar historial
      await renderHistorial()

    } catch (err) {
      Toast.show('Error al guardar: ' + err.message, 'error')
      btns.forEach(btn => { btn.disabled = false; btn.innerHTML = '<i class="ti ti-device-floppy"></i> Guardar diagnóstico' })
    }
  }

  // ── Sección historial ──────────────────────────────────────────────────

  async function renderHistorial() {
    const container = document.getElementById('coachHistorialList')
    if (!container) return

    container.innerHTML = '<div class="coach-loading"><i class="ti ti-loader-2 spin"></i></div>'

    try {
      const historial = await DB.getHistorialCompacto(30)
      const emociones = emocionesCache.length ? emocionesCache : await DB.getCatalogoEmociones()
      emocionesCache = emociones

      if (!historial.length) {
        container.innerHTML = '<p class="coach-empty">Sin diagnósticos guardados aún.</p>'
        return
      }

      container.innerHTML = historial.map(d => {
        const emocion    = emociones.find(e => e.id === d.estado_emocional_id)
        const emocionFin = emociones.find(e => e.id === d.estado_emocional_fin_id)
        const errores  = d.errores_json || []
        const tieneAlerta = d.patron_detectado || errores.some(e => e.repetido)
        const resultado = d.sec_resumen_compacto?.includes('TARGET ✅') ? 'target'
          : d.sec_resumen_compacto?.includes('STOP ❌') ? 'stop' : 'be'

        return `
          <div class="hist-item hist-item-${resultado}" data-date="${d.sesion_date}">
            <div class="hist-header">
              <span class="hist-date">${fmtDate(d.sesion_date)}</span>
              ${emocion ? `<span class="hist-emocion">${emocion.emoji} ${emocion.nombre}${emocionFin ? ` → ${emocionFin.emoji} ${emocionFin.nombre}` : ''}</span>` : ''}
              ${tieneAlerta ? '<span class="hist-alert">⚠️</span>' : ''}
            </div>
            <div class="hist-resumen">${d.sec_resumen_compacto || '—'}</div>
            ${errores.length ? `<div class="hist-errores">${errores.map(e => `<span class="hist-error-tag">${e.descripcion}</span>`).join('')}</div>` : ''}
          </div>`
      }).join('')

      // Click para expandir diagnóstico
      container.querySelectorAll('.hist-item').forEach(item => {
        item.addEventListener('click', () => verDiagnostico(item.dataset.date))
      })

    } catch (err) {
      container.innerHTML = `<p class="coach-error">Error: ${err.message}</p>`
    }
  }

  async function verDiagnostico(date) {
    const diag = await DB.getDiagnosticoByDate(date)
    if (!diag) { Toast.show('Sin diagnóstico para ese día', 'info'); return }

    // Cambiar a pestaña análisis y mostrar el diagnóstico del día seleccionado
    switchTab('analisis')
    renderAnalisis({
      contexto:    diag.sec_contexto,
      desarrollo:  diag.sec_desarrollo,
      validacion:  diag.sec_validacion,
      errores:     diag.sec_errores,
      aprendizaje: diag.sec_aprendizaje,
      resumen:     diag.sec_resumen_compacto,
    })
    Toast.show(`Mostrando diagnóstico del ${fmtDate(date)}`, 'info')
  }

  // ── Sección estrategia ────────────────────────────────────────────────

  async function renderEstrategia() {
    const container = document.getElementById('coachEstrategiaList')
    if (!container) return
    container.innerHTML = '<div class="coach-loading"><i class="ti ti-loader-2 spin"></i></div>'

    try {
      const secciones = await DB.getEstrategiaSecciones()
      estrategiaCache = null // forzar recarga en próximo análisis

      container.innerHTML = secciones.map(s => `
        <div class="estrat-item" data-id="${s.id}">
          <div class="estrat-header">
            <span class="estrat-titulo">${s.titulo}</span>
            <span class="estrat-updated">actualizado: ${s.updated_at?.slice(0,10) || '—'}</span>
            <button class="estrat-edit-btn btn-icon" data-id="${s.id}" title="Editar"><i class="ti ti-pencil"></i></button>
          </div>
          <pre class="estrat-contenido" id="estrat-content-${s.id}">${s.contenido}</pre>
          <div class="estrat-editor hidden" id="estrat-editor-${s.id}">
            <textarea class="estrat-textarea" id="estrat-ta-${s.id}" rows="10">${s.contenido}</textarea>
            <div class="estrat-actions">
              <button class="btn-sm btn-primary estrat-save-btn" data-id="${s.id}"><i class="ti ti-device-floppy"></i> Guardar</button>
              <button class="btn-sm btn-ghost estrat-cancel-btn" data-id="${s.id}">Cancelar</button>
            </div>
          </div>
        </div>`).join('')

      // Eventos editar / guardar / cancelar
      container.querySelectorAll('.estrat-edit-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.dataset.id
          document.getElementById(`estrat-content-${id}`).classList.add('hidden')
          document.getElementById(`estrat-editor-${id}`).classList.remove('hidden')
          btn.classList.add('hidden')
        })
      })

      container.querySelectorAll('.estrat-save-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = parseInt(btn.dataset.id)
          const contenido = document.getElementById(`estrat-ta-${id}`).value.trim()
          try {
            await DB.updateEstrategiaSeccion(id, contenido)
            document.getElementById(`estrat-content-${id}`).textContent = contenido
            document.getElementById(`estrat-content-${id}`).classList.remove('hidden')
            document.getElementById(`estrat-editor-${id}`).classList.add('hidden')
            container.querySelector(`.estrat-edit-btn[data-id="${id}"]`).classList.remove('hidden')
            estrategiaCache = null
            Toast.show('Sección actualizada', 'success')
          } catch (e) {
            Toast.show('Error al guardar: ' + e.message, 'error')
          }
        })
      })

      container.querySelectorAll('.estrat-cancel-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.dataset.id
          document.getElementById(`estrat-content-${id}`).classList.remove('hidden')
          document.getElementById(`estrat-editor-${id}`).classList.add('hidden')
          container.querySelector(`.estrat-edit-btn[data-id="${id}"]`).classList.remove('hidden')
        })
      })

    } catch (err) {
      container.innerHTML = `<p class="coach-error">Error: ${err.message}</p>`
    }
  }

  // ── Tabs ───────────────────────────────────────────────────────────────

  function switchTab(tabId) {
    document.querySelectorAll('.coach-tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tabId))
    document.querySelectorAll('.coach-tab-panel').forEach(p => p.classList.toggle('active', p.id === `coach-panel-${tabId}`))
    if (tabId === 'historial') renderHistorial()
    if (tabId === 'estrategia') renderEstrategia()
  }

  // ── Imagen del chart ──────────────────────────────────────────────────

  function setupImagenCoach() {
    const area   = document.getElementById('coachUploadArea')
    const input  = document.getElementById('coachImageInput')
    const preview = document.getElementById('coachImagePreview')
    const previewImg = document.getElementById('coachPreviewImg')
    const removeBtn  = document.getElementById('coachRemoveImg')

    if (!area) return

    area.addEventListener('click', () => input.click())
    area.addEventListener('dragover', e => { e.preventDefault(); area.classList.add('drag-over') })
    area.addEventListener('dragleave', () => area.classList.remove('drag-over'))
    area.addEventListener('drop', e => {
      e.preventDefault()
      area.classList.remove('drag-over')
      if (e.dataTransfer.files[0]) procesarImagen(e.dataTransfer.files[0])
    })
    input.addEventListener('change', () => { if (input.files[0]) procesarImagen(input.files[0]) })
    removeBtn?.addEventListener('click', () => {
      imagenBase64 = null
      previewImg.src = ''
      preview.classList.add('hidden')
      area.classList.remove('hidden')
    })
  }

  function procesarImagen(file) {
    const reader = new FileReader()
    reader.onload = e => {
      const dataUrl = e.target.result
      const base64  = dataUrl.split(',')[1]
      const mediaType = file.type || 'image/png'
      imagenBase64 = { data: base64, mediaType }

      document.getElementById('coachPreviewImg').src = dataUrl
      document.getElementById('coachUploadArea').classList.add('hidden')
      document.getElementById('coachImagePreview').classList.remove('hidden')
    }
    reader.readAsDataURL(file)
  }

  async function autoCargarImagen(url) {
    try {
      const res = await fetch(url)
      if (!res.ok) return
      const blob = await res.blob()
      const reader = new FileReader()
      reader.onload = e => {
        const dataUrl = e.target.result
        imagenBase64 = { data: dataUrl.split(',')[1], mediaType: blob.type || 'image/jpeg' }
        document.getElementById('coachPreviewImg').src = dataUrl
        document.getElementById('coachUploadArea').classList.add('hidden')
        document.getElementById('coachImagePreview').classList.remove('hidden')
      }
      reader.readAsDataURL(blob)
    } catch (_) {
      // URL inaccesible o CORS — deja el área de upload manual visible
    }
  }

  // ── Selector de emoción y confianza ──────────────────────────────────

  async function setupEmocionConfianza(date) {
    const select     = document.getElementById('coachEmocionSelect')
    const confianza  = document.getElementById('coachConfianzaVal')
    const starsEl    = document.getElementById('coachConfianzaStars')
    if (!select) return

    // Cargar emociones
    const emociones = await DB.getCatalogoEmociones()
    emocionesCache = emociones
    const optionsHtml = emociones.map(e => `<option value="${e.id}">${e.emoji} ${e.nombre}</option>`).join('')
    select.innerHTML = '<option value="">Estado al inicio</option>' + optionsHtml

    // También poblar el select de emoción al cierre
    const selectFin = document.getElementById('coachEmocionFinSelect')
    if (selectFin) selectFin.innerHTML = '<option value="">Estado al cierre</option>' + optionsHtml

    // Pre-llenar si ya hay diagnóstico o sesión guardada
    const [sesion, diagExistente] = await Promise.all([
      DB.getSesionByDate(date),
      DB.getDiagnosticoByDate(date)
    ])
    const emocionGuardada    = diagExistente?.estado_emocional_id    || sesion?.estado_emocional_id
    const emocionFinGuardada = diagExistente?.estado_emocional_fin_id
    const confianzaGuardada  = diagExistente?.nivel_confianza        || sesion?.nivel_confianza
    if (emocionGuardada)              select.value    = emocionGuardada
    if (emocionFinGuardada && selectFin) selectFin.value = emocionFinGuardada
    if (confianzaGuardada && confianza)  confianza.value = confianzaGuardada

    // Auto-cargar imagen del día desde la sesión si existe
    if (sesion?.imagen_url) autoCargarImagen(sesion.imagen_url)

    // Estrellas de confianza
    renderStars(confianzaGuardada || 0)
    starsEl?.querySelectorAll('.coach-star').forEach(star => {
      star.addEventListener('click', () => {
        const val = parseInt(star.dataset.val)
        if (confianza) confianza.value = val
        renderStars(val)
      })
    })
  }

  function renderStars(val) {
    document.querySelectorAll('.coach-star').forEach(s => {
      s.classList.toggle('active', parseInt(s.dataset.val) <= val)
    })
  }

  // ── Cambio de fecha ───────────────────────────────────────────────────

  function resetPanel() {
    chatHistory        = []
    diagnosticoActual  = {}
    diagnosticoGuardado = false
    systemPromptCache  = null
    imagenBase64       = null

    const chatEl = document.getElementById('coachChatMessages')
    if (chatEl) chatEl.innerHTML = ''

    const analisisEl = document.getElementById('coachAnalisisContent')
    if (analisisEl) analisisEl.innerHTML = `
      <div class="coach-placeholder">
        <i class="ti ti-robot"></i>
        <p>Haz clic en <strong>Analizar sesión</strong> para que el Coach evalúe esta sesión.</p>
        <p class="coach-placeholder-hint">Sube la gráfica del día para un análisis más preciso.</p>
      </div>`

    ocultarGuardar()

    // Reset imagen
    imagenBase64 = null
    const preview = document.getElementById('coachImagePreview')
    const area    = document.getElementById('coachUploadArea')
    const img     = document.getElementById('coachPreviewImg')
    if (preview) preview.classList.add('hidden')
    if (area)    area.classList.remove('hidden')
    if (img)     img.src = ''
  }

  async function cargarFecha(date) {
    coachDate = date

    // Hint: hoy / ayer / hace N días
    const hintEl = document.getElementById('coachDateHint')
    if (hintEl) {
      const hoy    = today()
      const diffMs = new Date(hoy) - new Date(date)
      const dias   = Math.round(diffMs / 86400000)
      hintEl.textContent = dias === 0 ? '— hoy' : dias === 1 ? '— ayer' : dias > 1 ? `— hace ${dias} días` : ''
      hintEl.className   = `coach-date-hint ${dias === 0 ? 'hint-today' : dias <= 5 ? 'hint-recent' : 'hint-old'}`
    }

    resetPanel()
    await setupEmocionConfianza(date)

    // Si ya existe diagnóstico para esa fecha, mostrarlo directamente
    const diag = await DB.getDiagnosticoByDate(date)
    if (diag?.sec_contexto) {
      renderAnalisis({
        contexto:    diag.sec_contexto,
        desarrollo:  diag.sec_desarrollo,
        validacion:  diag.sec_validacion,
        errores:     diag.sec_errores,
        aprendizaje: diag.sec_aprendizaje,
        resumen:     diag.sec_resumen_compacto,
      })

      // Restaurar conversación guardada en el chat
      if (diag.chat_messages?.length) {
        chatHistory = diag.chat_messages
        const chatEl = document.getElementById('coachChatMessages')
        if (chatEl) {
          const sep = document.createElement('div')
          sep.className = 'chat-separator'
          sep.innerHTML = `<span>── Conversación del ${fmtDate(date)} ──</span>`
          chatEl.appendChild(sep)
          diag.chat_messages.forEach(msg => {
            // content puede ser string (texto) o array (imagen + texto)
            const texto = Array.isArray(msg.content)
              ? (msg.content.find(c => c.type === 'text')?.text || '')
              : (msg.content || '')
            if (texto.trim()) renderMensaje(msg.role, texto)
          })
        }
      }

      diagnosticoGuardado = true
      document.querySelectorAll('.coach-save-btn').forEach(btn => {
        btn.innerHTML = '<i class="ti ti-circle-check"></i> Ya guardado'
        btn.classList.remove('hidden')
      })
      Toast.show(`Diagnóstico del ${fmtDate(date)} cargado`, 'info')
    }
  }

  // ── init ──────────────────────────────────────────────────────────────

  async function init() {
    // Tabs
    document.querySelectorAll('.coach-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => switchTab(btn.dataset.tab))
    })

    // Botón analizar
    document.getElementById('coachAnalyzeBtn')?.addEventListener('click', iniciarAnalisis)

    // Chat
    document.getElementById('coachSendBtn')?.addEventListener('click', enviarMensaje)
    document.getElementById('coachChatInput')?.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviarMensaje() }
    })

    // Guardar (ambos botones: arriba y abajo del chat)
    document.querySelectorAll('.coach-save-btn').forEach(btn => btn.addEventListener('click', guardarDiagnostico))

    // Imagen
    setupImagenCoach()

    // Selector de fecha
    const datePicker = document.getElementById('coachDatePicker')
    if (datePicker) {
      datePicker.value = today()
      datePicker.addEventListener('change', () => {
        if (datePicker.value) cargarFecha(datePicker.value)
      })
    }

    // Cargar con la fecha de hoy
    await cargarFecha(today())
  }

  function refresh() {
    cargarFecha(coachDate || today())
  }

  return { init, refresh }
})()
