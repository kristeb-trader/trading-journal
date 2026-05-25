// Session registration form
const SessionForm = (() => {
  let editingDate = null // set when editing an existing session
  let retrocesoCancelId = 0

  function setToday() {
    const today = new Date().toISOString().slice(0, 10)
    document.getElementById('sesionDate').value = today
  }

  function setupBtnGroups() {
    document.querySelectorAll('.btn-group').forEach(group => {
      group.querySelectorAll('.btn-option').forEach(btn => {
        btn.addEventListener('click', () => {
          group.querySelectorAll('.btn-option').forEach(b => b.classList.remove('active'))
          btn.classList.add('active')
          // write value to associated hidden input
          const hiddenId = group.id === 'corrida' ? 'numCorrida' : 'zonasContraVal'
          const hidden = document.getElementById(hiddenId)
          if (hidden) hidden.value = btn.dataset.value
        })
      })
    })
  }

  function setupNoOperoToggle() {
    const toggle = document.getElementById('noOpero')
    const motivoGroup = document.getElementById('motivoGroup')
    const tradingFields = document.getElementById('tradingFields')
    toggle.addEventListener('change', () => {
      if (toggle.checked) {
        motivoGroup.classList.remove('hidden')
        tradingFields.classList.add('hidden')
      } else {
        motivoGroup.classList.add('hidden')
        tradingFields.classList.remove('hidden')
      }
    })
  }

  function setupImageUpload() {
    const area = document.getElementById('uploadArea')
    const input = document.getElementById('imageUpload')
    const preview = document.getElementById('imagePreview')
    const previewImg = document.getElementById('previewImg')
    const removeBtn = document.getElementById('removeImage')

    area.addEventListener('click', () => input.click())
    area.addEventListener('dragover', e => { e.preventDefault(); area.classList.add('drag-over') })
    area.addEventListener('dragleave', () => area.classList.remove('drag-over'))
    area.addEventListener('drop', e => {
      e.preventDefault()
      area.classList.remove('drag-over')
      if (e.dataTransfer.files[0]) handleImageFile(e.dataTransfer.files[0])
    })
    input.addEventListener('change', () => { if (input.files[0]) handleImageFile(input.files[0]) })
    removeBtn.addEventListener('click', () => {
      previewImg.src = ''
      document.getElementById('imagenUrl').value = ''
      preview.classList.add('hidden')
      area.classList.remove('hidden')
    })
  }

  function handleImageFile(file) {
    // Show local preview immediately
    const reader = new FileReader()
    reader.onload = e => {
      document.getElementById('previewImg').src = e.target.result
      document.getElementById('uploadArea').classList.add('hidden')
      document.getElementById('imagePreview').classList.remove('hidden')
    }
    reader.readAsDataURL(file)

    // Upload to Cloudinary if configured
    if (CLOUDINARY_CLOUD_NAME && CLOUDINARY_UPLOAD_PRESET) {
      uploadToCloudinary(file)
    } else {
      Toast.show('Cloudinary no configurado — imagen solo visible localmente', 'warning')
    }
  }

  async function uploadToCloudinary(file) {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('upload_preset', CLOUDINARY_UPLOAD_PRESET)
    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
        method: 'POST', body: fd
      })
      const json = await res.json()
      document.getElementById('imagenUrl').value = json.secure_url
      Toast.show('Imagen subida correctamente', 'success')
    } catch {
      Toast.show('Error al subir imagen a Cloudinary', 'error')
    }
  }

  async function updateRetroceso(date) {
    const myId = ++retrocesoCancelId
    const display = document.getElementById('puntosRetrocesoDisplay')
    const hidden = document.getElementById('puntosRetroceso')
    display.textContent = '— pts'
    hidden.value = ''
    if (!date) return
    const trades = await DB.getTradesByDate(date)
    if (myId !== retrocesoCancelId) return
    if (trades.length > 0) {
      const netPnl = trades.reduce((s, t) => s + (parseFloat(t.profit) || 0), 0)
      const pts = Math.abs(netPnl / 2).toFixed(2)
      display.textContent = `${pts} pts`
      hidden.value = pts
    }
  }

  async function generateAI() {
    const analysis = document.getElementById('analisisTrader').value
    if (!analysis.trim()) { Toast.show('Escribe tu análisis primero', 'warning'); return }
    const apiKey = localStorage.getItem('claude_api_key') || CLAUDE_API_KEY
    if (!apiKey) { Toast.show('Configura tu API Key de Claude en ⚙ Ajustes', 'warning'); return }

    const btn = document.getElementById('generateAI')
    btn.disabled = true
    btn.innerHTML = '<i class="ti ti-loader-2 spin"></i> Generando...'

    try {
      const sesionDate = document.getElementById('sesionDate').value
      const contexto = document.getElementById('contexto').value

      // ── Datos de hoy ────────────────────────────────────────────────────
      const [tradesToday, casHoy] = await Promise.all([
        sesionDate ? DB.getTradesByDate(sesionDate) : Promise.resolve([]),
        sesionDate ? DB.getCasuisticasByDate(sesionDate) : Promise.resolve([])
      ])

      const pnlHoy = tradesToday.reduce((s, t) => s + (parseFloat(t.profit) || 0), 0)
      const targetsHoy = tradesToday.filter(t => t.resultado === 'target').length
      const stopsHoy   = tradesToday.filter(t => t.resultado === 'stop').length

      // Checklist de hoy desde el DOM
      const chkIds    = ['chkZonas','chkOrden','chk5Velas','chkNoticias','chkConsecucion','chkEstructura']
      const chkLabels = ['Zonas clave','Orden mercado','Máx 5 velas','Sin noticias','Consecución','Estructura']
      const chkValues = chkIds.map(id => document.getElementById(id)?.checked || false)
      const chkAprobados = chkValues.filter(Boolean).length
      const discHoy   = Math.round(((chkAprobados + (casHoy.length === 0 ? 1 : 0)) / 7) * 100)
      const checklistStr = chkLabels.map((lbl, i) => `${chkValues[i] ? '✓' : '✗'} ${lbl}`).join(' | ')
      const casHoyStr = casHoy.length
        ? casHoy.map(c => `${c.resultado === 'T' ? 'Target' : 'Stop'}: ${c.casuistica}`).join(', ')
        : 'Ninguna'

      // ── Contexto del mes ─────────────────────────────────────────────────
      const d = sesionDate ? new Date(sesionDate + 'T12:00:00') : new Date()
      const y = d.getFullYear()
      const m = d.getMonth() + 1
      const monthName = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'][m - 1]
      const fromStr = `${y}-${String(m).padStart(2,'0')}-01`
      const toStr   = `${y}-${String(m).padStart(2,'0')}-${new Date(y, m, 0).getDate()}`

      const [tradesMonth, sesionesAll, casAll] = await Promise.all([
        DB.getTradesByMonth(y, m),
        DB.getSesiones(),
        DB.getAllCasuisticas()
      ])

      // Trades del mes excluyendo hoy
      const tradesMonthPrev = tradesMonth.filter(t => t.trade_date !== sesionDate)
      const targetsMonth = tradesMonthPrev.filter(t => t.resultado === 'target').length
      const stopsMonth   = tradesMonthPrev.filter(t => t.resultado === 'stop').length
      const totalMonth   = targetsMonth + stopsMonth
      const winRateMonth = totalMonth > 0 ? Math.round((targetsMonth / totalMonth) * 100) : 0
      const pnlMonth     = tradesMonthPrev.reduce((s, t) => s + (parseFloat(t.profit) || 0), 0)

      // Disciplina promedio del mes (sesiones previas)
      const sesionesMonth = sesionesAll.filter(s =>
        s.sesion_date >= fromStr && s.sesion_date <= toStr && s.sesion_date !== sesionDate && !s.no_opero
      )
      const discValues = sesionesMonth.map(s => {
        const chkSum = [s.chk_zonas, s.chk_orden, s.chk_5velas, s.chk_noticias, s.chk_consecucion, s.chk_estructura]
          .filter(Boolean).length
        return Math.round((chkSum / 7) * 100)
      })
      const avgDisc = discValues.length
        ? Math.round(discValues.reduce((a, b) => a + b, 0) / discValues.length)
        : 0

      // Top 3 errores recurrentes del mes (casuísticas Stop, sin contar hoy)
      const casMonth = casAll.filter(c =>
        c.sesion_date >= fromStr && c.sesion_date <= toStr &&
        c.sesion_date !== sesionDate && c.resultado === 'S'
      )
      const errorCount = {}
      casMonth.forEach(c => { errorCount[c.casuistica] = (errorCount[c.casuistica] || 0) + 1 })
      const topErrors = Object.entries(errorCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([name, count]) => `${name} (${count}×)`)
        .join(', ') || 'Sin errores registrados'

      // Evolución semanal del mes
      const pnlByWeek = {}
      tradesMonthPrev.forEach(t => {
        const key = `Sem ${Math.ceil(new Date(t.trade_date + 'T12:00:00').getDate() / 7)}`
        pnlByWeek[key] = (pnlByWeek[key] || 0) + (parseFloat(t.profit) || 0)
      })
      const weekStr = Object.entries(pnlByWeek)
        .map(([w, p]) => `${w}: ${p >= 0 ? '+' : ''}$${p.toFixed(0)}`)
        .join(' | ') || 'Sin datos anteriores'

      // ── Prompt enriquecido ───────────────────────────────────────────────
      const prompt = `Eres un coach de trading especializado en NQ/MNQ Futures (1 minuto). Metodología Alfredo Chaumer. Responde SIEMPRE en español. Sé estricto y directo — si el trader cometió errores, señálalos sin suavizarlos. No des falsas motivaciones cuando los datos muestran mal desempeño.

═══ CONTEXTO DEL MES — ${monthName} ${y} ═══
Trades previos: ${totalMonth} (Targets: ${targetsMonth} | Stops: ${stopsMonth})
Win Rate mensual: ${winRateMonth}%
P&L acumulado (sin hoy): ${pnlMonth >= 0 ? '+' : ''}$${pnlMonth.toFixed(2)}
Evolución semanal: ${weekStr}
Disciplina promedio (checklist): ${avgDisc}%
Top errores recurrentes (casuísticas Stop): ${topErrors}

═══ SESIÓN DE HOY — ${sesionDate} ═══
Contexto de mercado: ${contexto || 'No indicado'}
Trades: ${tradesToday.length > 0 ? `${targetsHoy} targets, ${stopsHoy} stops, P&L: ${pnlHoy >= 0 ? '+' : ''}$${pnlHoy.toFixed(2)}` : 'Sin trades registrados'}
Checklist: ${checklistStr}
Disciplina de hoy: ${discHoy}%
Casuísticas: ${casHoyStr}
Reflexión del trader: ${analysis}

═══ INSTRUCCIONES ═══
Genera un análisis estructurado en exactamente 4 secciones (máx. 120 palabras en total):
1. **Evaluación**: Lo más relevante de hoy comparado con el patrón del mes.
2. **Patrón detectado**: Fortaleza o debilidad que se repite en el mes.
3. **Acción concreta**: Una sola acción específica y medible para mañana.
4. **Cierre motivacional**: 1 frase corta de aliento basada en los datos.`

      const dashboardSecret = localStorage.getItem('dashboard_secret') || ''
      const res = await fetch('https://broad-hall-c53f.kristerock.workers.dev/api/claude', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'X-Dashboard-Token': dashboardSecret,
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 400,
          messages: [{ role: 'user', content: prompt }]
        })
      })
      const rawText = await res.text()
      const data = JSON.parse(rawText)
      const texto = data?.content?.[0]?.text || data?.completion || ''
      const ta = document.getElementById('resumenIA')
      ta.value = texto
      ta.style.height = 'auto'
      ta.style.height = ta.scrollHeight + 'px'
      if (texto) {
        Toast.show('Resumen generado con IA', 'success')
      } else {
        Toast.show('Respuesta vacía — revisa la consola (F12)', 'warning')
      }
    } catch (e) {
      Toast.show('Error al llamar a Claude API', 'error')
    } finally {
      btn.disabled = false
      btn.innerHTML = '<i class="ti ti-sparkles"></i> Generar con IA'
    }
  }

  function collectFormData() {
    const sesionDate = document.getElementById('sesionDate').value
    const noOpero = document.getElementById('noOpero').checked

    const payload = {
      sesion_date: sesionDate,
      no_opero: noOpero,
    }

    if (noOpero) {
      payload.motivo_no_opero = document.getElementById('motivoNoOpero').value || null
    } else {
      payload.contexto = document.getElementById('contexto').value || null
      payload.num_corrida = parseInt(document.getElementById('numCorrida').value) || null
      payload.velas_corrida = parseInt(document.getElementById('velasCorrida').value) || null
      payload.puntos_retroceso = parseFloat(document.getElementById('puntosRetroceso').value) || null
      const zonasVal = document.getElementById('zonasContraVal').value
      payload.zonas_contra = zonasVal === 'true' ? true : zonasVal === 'false' ? false : null
      payload.setup = document.getElementById('setup').value || null
      payload.chk_zonas = document.getElementById('chkZonas').checked
      payload.chk_orden = document.getElementById('chkOrden').checked
      payload.chk_5velas = document.getElementById('chk5Velas').checked
      payload.chk_noticias = document.getElementById('chkNoticias').checked
      payload.chk_consecucion = document.getElementById('chkConsecucion').checked
      payload.chk_estructura = document.getElementById('chkEstructura').checked
    }

    payload.analisis_trader = document.getElementById('analisisTrader').value || null
    payload.resumen_ia = document.getElementById('resumenIA').value || null
    payload.imagen_url = document.getElementById('imagenUrl').value || null

    return payload
  }

  function clearForm() {
    document.getElementById('sessionForm').reset()
    document.querySelectorAll('.btn-option').forEach(b => b.classList.remove('active'))
    document.getElementById('motivoGroup').classList.add('hidden')
    document.getElementById('tradingFields').classList.remove('hidden')
    document.getElementById('imagePreview').classList.add('hidden')
    document.getElementById('uploadArea').classList.remove('hidden')
    document.getElementById('imagenUrl').value = ''
    updateRetroceso(document.getElementById('sesionDate').value)
    casPendientes = []
    renderCasList()
    editingDate = null
    setToday()
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const sesionDate = document.getElementById('sesionDate').value
    if (!sesionDate) { Toast.show('Selecciona una fecha', 'warning'); return }

    const payload = collectFormData()
    const btn = document.getElementById('saveSession')
    btn.disabled = true
    btn.innerHTML = '<i class="ti ti-loader-2 spin"></i> Guardando...'

    try {
      await DB.upsertSesion(payload)
      Toast.show('Sesión guardada correctamente', 'success')
      clearForm()
      setTimeout(() => {
        Nav.go('calendar')
        Calendar.load()
      }, 500)
    } catch (err) {
      Toast.show('Error al guardar: ' + err.message, 'error')
    } finally {
      btn.disabled = false
      btn.innerHTML = '<i class="ti ti-device-floppy"></i> Guardar sesión'
    }
  }

  function prefill(sesion, date) {
    clearForm()
    // Navegar primero: si es la primera vez, init() llama setToday() aquí.
    // Los valores correctos se asignan DESPUÉS para pisarlo.
    document.querySelector('[data-section="register"]').click()

    if (!sesion) {
      if (date) {
        document.getElementById('sesionDate').value = date
        updateRetroceso(date)
      }
      return
    }

    editingDate = sesion.sesion_date
    document.getElementById('sesionDate').value = sesion.sesion_date
    loadCasuisticasForDate(sesion.sesion_date)
    updateRetroceso(sesion.sesion_date)
    document.getElementById('noOpero').checked = sesion.no_opero || false
    document.getElementById('noOpero').dispatchEvent(new Event('change'))

    if (!sesion.no_opero) {
      document.getElementById('contexto').value = sesion.contexto || ''
      document.getElementById('velasCorrida').value = sesion.velas_corrida || ''
      document.getElementById('setup').value = sesion.setup || ''
      document.getElementById('chkZonas').checked = sesion.chk_zonas || false
      document.getElementById('chkOrden').checked = sesion.chk_orden || false
      document.getElementById('chk5Velas').checked = sesion.chk_5velas || false
      document.getElementById('chkNoticias').checked = sesion.chk_noticias || false
      document.getElementById('chkConsecucion').checked = sesion.chk_consecucion || false
      document.getElementById('chkEstructura').checked = sesion.chk_estructura || false

      if (sesion.num_corrida) {
        document.getElementById('numCorrida').value = sesion.num_corrida
        document.querySelector(`#corrida [data-value="${sesion.num_corrida}"]`)?.classList.add('active')
      }
      if (sesion.zonas_contra != null) {
        const v = String(sesion.zonas_contra)
        document.getElementById('zonasContraVal').value = v
        document.querySelector(`#zonasContra [data-value="${v}"]`)?.classList.add('active')
      }
    } else {
      document.getElementById('motivoNoOpero').value = sesion.motivo_no_opero || ''
    }

    document.getElementById('analisisTrader').value = sesion.analisis_trader || ''
    const taIA = document.getElementById('resumenIA')
    taIA.value = sesion.resumen_ia || ''
    taIA.style.height = 'auto'
    taIA.style.height = taIA.scrollHeight + 'px'
    if (sesion.imagen_url) {
      document.getElementById('imagenUrl').value = sesion.imagen_url
      document.getElementById('previewImg').src = sesion.imagen_url
      document.getElementById('imagePreview').classList.remove('hidden')
      document.getElementById('uploadArea').classList.add('hidden')
    }
  }

  // ── Casuísticas ──────────────────────────────────────────────────────────
  let casResultado = null
  let casPendientes = [] // { casuistica, resultado } — sin guardar aún

  async function loadCasuisticasDropdown() {
    const items = await DB.getCatalogoCasuisticas()
    const select = document.getElementById('casCasuistica')
    const active = items.filter(i => i.activa)
    select.innerHTML = '<option value="">Seleccionar situación...</option>' +
      active.map(i => `<option value="${i.nombre}">${i.nombre}</option>`).join('')
  }

  function setupCasuisticas() {
    // Botones T / S
    document.querySelectorAll('#casResultadoGroup .btn-option').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#casResultadoGroup .btn-option').forEach(b => b.classList.remove('active'))
        btn.classList.add('active')
        casResultado = btn.dataset.value
      })
    })

    document.getElementById('casAgregar').addEventListener('click', async () => {
      const casuistica = document.getElementById('casCasuistica').value
      if (!casuistica) { Toast.show('Selecciona una situación', 'warning'); return }
      if (!casResultado) { Toast.show('Selecciona T o S', 'warning'); return }
      const sesionDate = document.getElementById('sesionDate').value
      if (!sesionDate) { Toast.show('Selecciona la fecha primero', 'warning'); return }

      try {
        const saved = await DB.saveCasuistica(sesionDate, casuistica, casResultado)
        casPendientes.push(saved)
        renderCasList()
        document.getElementById('casCasuistica').value = ''
        document.querySelectorAll('#casResultadoGroup .btn-option').forEach(b => b.classList.remove('active'))
        casResultado = null
      } catch (e) {
        Toast.show('Error al guardar: ' + e.message, 'error')
      }
    })
  }

  function renderCasList() {
    const list = document.getElementById('casList')
    if (!casPendientes.length) { list.innerHTML = ''; return }
    list.innerHTML = casPendientes.map((c, i) => `
      <div class="cas-tag">
        <div class="cas-tag-left">
          <span class="${c.resultado === 'T' ? 'cas-badge-t' : 'cas-badge-s'}">${c.resultado}</span>
          <span>${c.casuistica}</span>
        </div>
        <button type="button" class="cas-del" data-idx="${i}" data-id="${c.id}" title="Eliminar">
          <i class="ti ti-x"></i>
        </button>
      </div>`).join('')

    list.querySelectorAll('.cas-del').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = parseInt(btn.dataset.id)
        const idx = parseInt(btn.dataset.idx)
        try {
          await DB.deleteCasuistica(id)
          casPendientes.splice(idx, 1)
          renderCasList()
        } catch (e) {
          Toast.show('Error al eliminar', 'error')
        }
      })
    })
  }

  async function loadCasuisticasForDate(date) {
    casPendientes = date ? await DB.getCasuisticasByDate(date) : []
    renderCasList()
  }

  function init() {
    setToday()
    updateRetroceso(document.getElementById('sesionDate').value)
    setupBtnGroups()
    setupNoOperoToggle()
    setupImageUpload()
    setupCasuisticas()
    loadCasuisticasDropdown()
    document.getElementById('resumenIA').addEventListener('input', function() {
      this.style.height = 'auto'
      this.style.height = this.scrollHeight + 'px'
    })
    document.getElementById('sessionForm').addEventListener('submit', handleSubmit)
    document.getElementById('generateAI').addEventListener('click', generateAI)
    document.getElementById('clearForm').addEventListener('click', clearForm)

    // Cargar casuísticas y auto-calcular retroceso al cambiar fecha
    document.getElementById('sesionDate').addEventListener('change', () => {
      const date = document.getElementById('sesionDate').value
      loadCasuisticasForDate(date)
      updateRetroceso(date)
    })

    // Auto-invalidar checklist de 5 velas si velas > 5
    document.getElementById('velasCorrida').addEventListener('input', () => {
      const velas = parseInt(document.getElementById('velasCorrida').value) || 0
      const chk = document.getElementById('chk5Velas')
      const item = chk.closest('.check-item')
      if (velas > 5) {
        chk.checked = false
        chk.disabled = true
        item.style.opacity = '0.5'
        item.title = `Invalidado: ${velas} velas superan el máximo de 5`
      } else {
        chk.disabled = false
        item.style.opacity = '1'
        item.title = ''
      }
    })
  }

  return { init, prefill }
})()
