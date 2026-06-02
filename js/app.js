// Main app — navigation, modal, toasts, initialization

// ── Toast notifications ───────────────────────────────────────────────────

const Toast = {
  show(msg, type = 'info', duration = 3500) {
    const container = document.getElementById('toastContainer')
    const t = document.createElement('div')
    t.className = `toast toast-${type}`
    const icons = { success: 'ti-circle-check', error: 'ti-circle-x', warning: 'ti-alert-triangle', info: 'ti-info-circle' }
    t.innerHTML = `<i class="ti ${icons[type] || icons.info}"></i><span>${msg}</span>`
    container.appendChild(t)
    requestAnimationFrame(() => t.classList.add('visible'))
    setTimeout(() => {
      t.classList.remove('visible')
      setTimeout(() => t.remove(), 300)
    }, duration)
  }
}

// ── Day / Trade modal ─────────────────────────────────────────────────────

const Modal = {
  currentSesion: null,
  currentDate: null,

  async openDay(dateStr, trades, sesion) {
    this.currentSesion = sesion
    this.currentDate = dateStr
    const modal = document.getElementById('dayModal')

    const fmtDate = d => {
      if (!d) return 'Detalle'
      const [y, m, day] = d.split('-')
      const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
      const dows = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']
      const dow = dows[new Date(d + 'T12:00:00').getDay()]
      return `${dow} ${parseInt(day)} ${months[parseInt(m)-1]} ${y}`
    }
    document.getElementById('modalDateTitle').textContent = fmtDate(dateStr)

    // Datos extra: diagnóstico del Coach + errores + emociones
    const [diag, casuisticas, emociones] = await Promise.all([
      dateStr ? DB.getDiagnosticoByDate(dateStr) : null,
      dateStr ? DB.getCasuisticasByDate(dateStr) : [],
      DB.getCatalogoEmociones().catch(() => []),
    ])
    const ctx = { dateStr, trades, sesion, diag, casuisticas, emociones }

    document.getElementById('modalResumen').innerHTML   = this._renderResumen(ctx)
    document.getElementById('modalOperativa').innerHTML = this._renderOperativa(ctx)
    document.getElementById('modalGrafica').innerHTML   = this._renderGrafica(ctx)

    // Footer: Editar vs Registrar según exista la sesión
    const editBtn = document.getElementById('editSessionBtn')
    if (editBtn) editBtn.innerHTML = sesion
      ? '<i class="ti ti-edit"></i> Editar sesión'
      : '<i class="ti ti-square-rounded-plus"></i> Registrar sesión'

    // Eventos: lightbox, toggles de errores, ver completo
    setTimeout(() => {
      const img = modal.querySelector('#modalGrafica img')
      if (img) img.addEventListener('click', () => Lightbox.open(img.src))
      modal.querySelectorAll('.modal-cas-row.has-detail').forEach(row => {
        row.addEventListener('click', () => {
          const det = document.getElementById(`modal-cas-det-${row.dataset.det}`)
          if (det) det.classList.toggle('hidden')
          row.classList.toggle('open')
        })
      })
      const verBtn = document.getElementById('modalVerCompleto')
      if (verBtn) verBtn.addEventListener('click', () => {
        this.close()
        if (typeof Coach !== 'undefined' && Coach.abrirFecha) Coach.abrirFecha(dateStr)
      })
    }, 50)

    // Reset a la pestaña Gráfica (primera)
    modal.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'))
    modal.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'))
    modal.querySelector('.tab-btn[data-tab="grafica"]').classList.add('active')
    document.getElementById('tab-grafica').classList.add('active')

    modal.classList.remove('hidden')
    document.body.classList.add('modal-open')
  },

  // ── Helpers de render del modal ─────────────────────────────────────────
  _TIPO_EMO: { psicologico: '🧠', analitico: '📐', operativo: '⚙️', marcado: '🗺️' },

  _stripBT(s) { return (s || '').replace(/`/g, '').trim() },
  _mdStrip(s) { return (s || '').replace(/\*\*/g, '').replace(/`/g, '').replace(/\s+/g, ' ').trim() },
  _truncate(s, n) { return s && s.length > n ? s.slice(0, n).trim() + '…' : (s || '') },

  _dayState(trades, sesion) {
    if (sesion?.setup_valido_no_tomado) return { label: 'Setup válido — no entré', cls: 'mst-violet', icon: '⚠️' }
    if (sesion?.no_opero) {
      if ((sesion.motivo_no_opero || '').toLowerCase().includes('sin setup'))
        return { label: 'Sin entradas válidas', cls: 'mst-violet', icon: '🟣' }
      return { label: 'No operé', cls: 'mst-gray', icon: '⚪' }
    }
    if (!trades.length) return { label: 'Sin trades', cls: 'mst-gray', icon: '⚪' }
    const allBE = trades.every(t => Math.abs(parseFloat(t.profit) || 0) <= 6)
    if (allBE) return { label: 'Break Even', cls: 'mst-gray', icon: '⚪' }
    const pnl = trades.reduce((s, t) => s + (parseFloat(t.profit) || 0), 0)
    return pnl >= 0
      ? { label: 'TARGET', cls: 'mst-green', icon: '🟢' }
      : { label: 'STOP', cls: 'mst-red', icon: '🔴' }
  },

  // Pestaña 1 — Resumen visual (de un vistazo)
  _renderResumen({ trades, sesion, diag, casuisticas, emociones }) {
    if (!sesion && !diag && !trades.length) {
      return '<div class="modal-no-trade"><i class="ti ti-calendar-off"></i><p>Sin registro para este día</p></div>'
    }

    const st = this._dayState(trades, sesion)
    const pnl = trades.reduce((s, t) => s + (parseFloat(t.profit) || 0), 0)
    const emoIni = emociones.find(e => e.id === sesion?.estado_emocional_id)
    const emoFin = emociones.find(e => e.id === diag?.estado_emocional_fin_id)
    const conf = sesion?.nivel_confianza

    const chips = []
    if (trades.length) chips.push(`<span class="mr-pnl ${pnl >= 0 ? 'pos' : 'neg'}">${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}</span>`)
    if (emoIni) chips.push(`<span class="mr-emo">${emoIni.emoji} ${emoIni.nombre}${emoFin ? ` <i class="ti ti-arrow-narrow-right"></i> ${emoFin.emoji} ${emoFin.nombre}` : ''}</span>`)
    if (conf) chips.push(`<span class="mr-stars" title="Confianza ${conf}/5">${'★'.repeat(conf)}${'☆'.repeat(5 - conf)}</span>`)
    const franja = `
      <div class="mr-status ${st.cls}">
        <span class="mr-badge">${st.icon} ${st.label}</span>
        <div class="mr-meta">${chips.join('')}</div>
      </div>`

    const setupObs = sesion?.setup_valido_no_tomado && sesion.setup_observado
      ? `<div class="mr-setupobs"><i class="ti ti-eye"></i> Setup observado: <b>${sesion.setup_observado}</b>${sesion.motivo_no_entrada ? ` · no entré por <b>${sesion.motivo_no_entrada}</b>` : ''}</div>`
      : ''

    const resumen = this._stripBT(diag?.sec_resumen_compacto)
    const banner = resumen ? `<div class="mr-veredicto"><i class="ti ti-quote"></i><p>${resumen}</p></div>` : ''

    const CHK = [
      ['chk_zonas','Zonas'], ['chk_orden','Orden'], ['chk_5velas','5 velas'],
      ['chk_noticias','Calendario'], ['chk_consecucion','Consecución'], ['chk_estructura','Estructura IRI'],
    ]
    const opero = sesion && !sesion.no_opero
    const passed = opero ? CHK.filter(([k]) => sesion[k]) : []
    const failed = opero ? CHK.filter(([k]) => !sesion[k]) : []

    const bien = []
    if (opero) bien.push(`<span class="mr-chip ok">Checklist ${passed.length}/6</span>`)
    passed.forEach(([, l]) => bien.push(`<span class="mr-chip ok">✓ ${l}</span>`))
    if (!casuisticas.length && (opero || diag)) bien.push('<span class="mr-chip ok">✓ Sin errores</span>')
    const bienHtml = bien.length ? bien.join('') : '<span class="mr-empty">—</span>'

    const mal = []
    failed.forEach(([, l]) => mal.push(`<span class="mr-chip warn">✗ ${l}</span>`))
    casuisticas.forEach(c => {
      const emo = this._TIPO_EMO[c.tipo] || '•'
      const res = (c.resultado === 'T' || c.resultado === 'S') ? ` <b class="${c.resultado === 'T' ? 'res-t' : 'res-s'}">${c.resultado}</b>` : ''
      mal.push(`<span class="mr-chip err">${emo} ${c.casuistica}${res}</span>`)
    })
    const malHtml = mal.length ? mal.join('') : '<span class="mr-empty">Nada que destacar</span>'

    const recs = []
    casuisticas.forEach(c => {
      const nombre = c.recomendacion?.nombre
      if (c.recomendacion_ia) recs.push(`<li>${nombre ? `<b>${nombre}:</b> ` : ''}${c.recomendacion_ia}</li>`)
      if (c.recomendacion_manual) recs.push(`<li><span class="rec-manual">✍️ ${c.recomendacion_manual}</span></li>`)
    })
    const recHtml = recs.length
      ? `<ul class="mr-recs">${recs.join('')}</ul>`
      : (diag?.sec_aprendizaje ? `<p class="mr-aprend">${this._truncate(this._mdStrip(diag.sec_aprendizaje), 260)}</p>` : '<p class="mr-empty">—</p>')

    const verBtn = diag
      ? `<div class="mr-actions"><button class="btn-primary btn-sm" id="modalVerCompleto"><i class="ti ti-file-search"></i> Ver diagnóstico completo</button></div>`
      : ''

    return `
      ${franja}
      ${setupObs}
      ${banner}
      <div class="mr-cols">
        <div class="mr-col mr-bien">
          <div class="mr-col-title">✅ Bien</div>
          <div class="mr-chips">${bienHtml}</div>
        </div>
        <div class="mr-col mr-mal">
          <div class="mr-col-title">⚠️ A mejorar</div>
          <div class="mr-chips">${malHtml}</div>
        </div>
      </div>
      <div class="mr-prox">
        <div class="mr-col-title">💡 Para la próxima</div>
        ${recHtml}
      </div>
      ${verBtn}`
  },

  // Pestaña 2 — Operativa (trades + campos + checklist)
  _renderOperativa({ trades, sesion }) {
    const pnl = trades.reduce((s, t) => s + (parseFloat(t.profit) || 0), 0)
    const targets = trades.filter(t => t.resultado === 'target').length
    const stops = trades.filter(t => t.resultado === 'stop').length

    let tradesHtml
    if (sesion?.no_opero && !trades.length) {
      tradesHtml = `<div class="modal-no-trade"><i class="ti ti-coffee"></i><p>Sin operación este día</p><p class="text-dim">${sesion.motivo_no_opero || ''}</p></div>`
    } else if (!trades.length) {
      tradesHtml = '<div class="modal-no-trade"><i class="ti ti-chart-off"></i><p>Sin trades registrados</p></div>'
    } else {
      tradesHtml = `
        <div class="modal-summary-bar">
          <div class="ms-stat"><span>${trades.length}</span><small>Trades</small></div>
          <div class="ms-stat green"><span>${targets}</span><small>Targets</small></div>
          <div class="ms-stat red"><span>${stops}</span><small>Stops</small></div>
          <div class="ms-stat ${pnl >= 0 ? 'green' : 'red'}"><span>${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}</span><small>P&L</small></div>
        </div>
        <div class="modal-trades-list">
          ${trades.map(t => `
            <div class="modal-trade-row">
              <span class="badge ${Math.abs(parseFloat(t.profit)||0) <= 6 ? 'badge-be' : t.resultado === 'target' ? 'badge-target' : t.resultado === 'stop' ? 'badge-stop' : 'badge-other'}">${Math.abs(parseFloat(t.profit)||0) <= 6 ? 'B.E.' : (t.resultado || '—')}</span>
              <span>${t.market_pos === 'Long' ? '▲' : '▼'} ${t.market_pos}</span>
              <span>${t.qty} cont.</span>
              <span class="${parseFloat(t.profit) >= 0 ? 'text-green' : 'text-red'} fw-bold">${parseFloat(t.profit) >= 0 ? '+' : ''}$${parseFloat(t.profit).toFixed(2)}</span>
              ${t.mae != null ? `<span class="text-dim">MAE ${t.mae} · MFE ${t.mfe}</span>` : ''}
            </div>`).join('')}
        </div>`
    }

    const campos = []
    if (sesion?.contexto) campos.push(['Contexto', sesion.contexto])
    if (sesion?.num_corrida) campos.push(['Corrida', `${sesion.num_corrida}ª`])
    if (sesion?.velas_corrida) campos.push(['Velas', sesion.velas_corrida])
    if (sesion?.puntos_retroceso) campos.push(['Retroceso', `${sesion.puntos_retroceso} pts`])
    if (sesion?.setup) campos.push(['Setup', sesion.setup])
    const camposHtml = campos.length
      ? `<div class="modal-fields">${campos.map(([l, v]) => `<div class="mf-item"><label>${l}</label><span>${v}</span></div>`).join('')}</div>`
      : ''

    const CHK = [
      ['chk_zonas','Zonas vigentes'], ['chk_orden','Orden a tiempo'], ['chk_5velas','Máx 5 velas'],
      ['chk_noticias','Calendario verificado'], ['chk_consecucion','Rompimiento + consecución'], ['chk_estructura','Estructura IRI'],
    ]
    const score = sesion ? CHK.filter(([k]) => sesion[k]).length : 0
    const chkHtml = sesion && !sesion.no_opero
      ? `<div class="modal-section-title" style="margin-top:14px"><i class="ti ti-checklist"></i> Checklist (${score}/6)</div>
         <div class="modal-checklist">${CHK.map(([k, l]) => `
           <div class="modal-check-item ${sesion[k] ? 'check-ok' : 'check-fail'}">
             <i class="ti ${sesion[k] ? 'ti-circle-check' : 'ti-circle-x'}"></i><span>${l}</span>
           </div>`).join('')}</div>`
      : ''

    return tradesHtml + camposHtml + chkHtml
  },

  // Pestaña 3 — Gráfica (imagen + errores con detalle)
  _renderGrafica({ sesion, casuisticas }) {
    const imgHtml = sesion?.imagen_url
      ? `<div class="modal-image-wrap"><img src="${sesion.imagen_url}" alt="Captura del día" loading="lazy" style="cursor:zoom-in" title="Clic para ampliar"></div>`
      : '<div class="modal-no-trade"><i class="ti ti-photo-off"></i><p>Sin imagen para este día</p></div>'

    const erroresHtml = `
      <div class="modal-section-title"><span style="font-size:0.95rem">⚠️</span> Errores</div>
      ${casuisticas.length > 0
        ? casuisticas.map((c, i) => {
            const emo = this._TIPO_EMO[c.tipo] || '•'
            const res = (c.resultado === 'T' || c.resultado === 'S')
              ? `<span class="${c.resultado === 'T' ? 'cas-badge-t' : 'cas-badge-s'}">${c.resultado}</span>` : ''
            const origenTag = c.origen && c.origen !== 'manual'
              ? `<span class="cas-origen" title="${c.origen}">${c.origen === 'ia' ? '🤖' : '🤝'}</span>` : ''
            const recHtml = (c.recomendacion_ia || c.recomendacion_manual)
              ? `<div class="modal-rec-wrap">💡 <strong>${c.recomendacion?.nombre || 'Recomendación'}</strong>${c.recomendacion_ia ? `<br><span class="modal-rec-ia">${c.recomendacion_ia}</span>` : ''}${c.recomendacion_manual ? `<br><span class="modal-rec-manual">✍️ ${c.recomendacion_manual}</span>` : ''}</div>` : ''
            const hasDet = c.descripcion || recHtml
            const detalle = hasDet
              ? `<div class="modal-cas-detalle hidden" id="modal-cas-det-${i}">${c.descripcion || ''}${recHtml}</div>` : ''
            return `
              <div class="modal-cas-item">
                <div class="modal-cas-row modal-cas-row-error ${hasDet ? 'has-detail' : ''}" ${hasDet ? `data-det="${i}"` : ''}>
                  <span>${emo} ${c.casuistica}</span>
                  <span class="modal-cas-right">${origenTag}${res}${hasDet ? '<i class="ti ti-chevron-down cas-chevron"></i>' : ''}</span>
                </div>
                ${detalle}
              </div>`
          }).join('')
        : '<p class="modal-empty-sub">✅ Sin errores registrados</p>'}`

    return imgHtml + erroresHtml
  },

  close() {
    document.getElementById('dayModal').classList.add('hidden')
    document.body.classList.remove('modal-open')
  },

  initTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'))
        document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'))
        btn.classList.add('active')
        document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active')
      })
    })
  },
}

// ── Navigation ────────────────────────────────────────────────────────────

const Nav = {
  sections: {
    calendar: 'Calendario',
    trades: 'Trades',
    gallery: 'Imágenes',
    coach: 'Coach IA',
    register: 'Registrar Sesión',
    analysis: 'Análisis',
    annual: 'Resumen Anual',
    historial: 'Historial',
    estrategia: 'Estrategia',
    data: 'Datos',
  },
  initialized: new Set(),

  async go(sectionId) {
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.section === sectionId)
    })
    document.querySelectorAll('.section').forEach(sec => {
      sec.classList.toggle('active', sec.id === `section-${sectionId}`)
    })
    document.getElementById('currentSectionTitle').textContent = this.sections[sectionId] || ''

    // Lazy init sections
    if (!this.initialized.has(sectionId)) {
      this.initialized.add(sectionId)
      try {
        if (sectionId === 'calendar') { await Calendar.init(); await Metrics.init() }
        if (sectionId === 'trades') await TradesTable.init()
        if (sectionId === 'register') SessionForm.init()
        if (sectionId === 'gallery') await Gallery.init()
        if (sectionId === 'analysis') await Charts.init()
        if (sectionId === 'annual') await Annual.init()
        if (sectionId === 'coach') await Coach.init()
        if (sectionId === 'estrategia') await Estrategia.init()
        if (sectionId === 'historial') await Coach.renderHistorial()
        if (sectionId === 'data') await DataManager.init()
      } catch (err) {
        Toast.show('Error cargando sección: ' + err.message, 'error')
      }
    } else if (sectionId === 'coach') {
      Coach.refresh()
    } else if (sectionId === 'historial') {
      Coach.renderHistorial()
    }
  },

  init() {
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', () => this.go(item.dataset.section))
    })
    document.getElementById('menuToggle').addEventListener('click', () => {
      document.getElementById('sidebar').classList.toggle('collapsed')
    })
  }
}

// ── Bootstrap ─────────────────────────────────────────────────────────────

async function boot() {
  // Check Supabase connectivity
  try {
    const { error } = await supa.from('trades').select('trade_number').limit(1)
    if (error) throw error
    document.getElementById('connectionStatus').innerHTML = '<i class="ti ti-circle-filled"></i> Conectado'
    document.getElementById('connectionStatus').classList.add('connected')
  } catch (err) {
    document.getElementById('connectionStatus').innerHTML = '<i class="ti ti-circle-filled"></i> Sin conexión'
    document.getElementById('connectionStatus').classList.add('disconnected')
    console.error('Supabase error:', err)
    Toast.show('Sin conexión a Supabase: ' + (err.message || err), 'error')
  }

  // Settings modal
  const openSettings = document.getElementById('openSettings')
  const settingsModal = document.getElementById('settingsModal')
  const closeSettings = document.getElementById('closeSettings')
  const inputClaudeKey = document.getElementById('inputClaudeKey')
  const toggleKeyVisibility = document.getElementById('toggleKeyVisibility')
  const inputDashboardSecret = document.getElementById('inputDashboardSecret')
  const toggleSecretVisibility = document.getElementById('toggleSecretVisibility')

  openSettings.addEventListener('click', async () => {
    inputClaudeKey.value = localStorage.getItem('claude_api_key') || ''
    inputDashboardSecret.value = localStorage.getItem('dashboard_secret') || ''
    settingsModal.classList.remove('hidden')
    // Cargar objetivos desde BD
    try {
      const obj = await DB.getObjetivos()
      document.getElementById('objStopMax').value       = obj?.stop_max_usd ?? ''
      document.getElementById('objMaxTrades').value     = obj?.max_trades_dia ?? ''
      document.getElementById('objPnlObjetivo').value   = obj?.pnl_objetivo_dia ?? ''
      document.getElementById('objLimitePerdida').value = obj?.limite_perdida_dia ?? ''
    } catch (_) { /* sin conexión: campos quedan como estén */ }
  })
  closeSettings.addEventListener('click', () => settingsModal.classList.add('hidden'))
  settingsModal.addEventListener('click', e => { if (e.target === settingsModal) settingsModal.classList.add('hidden') })

  toggleKeyVisibility.addEventListener('click', () => {
    const isPassword = inputClaudeKey.type === 'password'
    inputClaudeKey.type = isPassword ? 'text' : 'password'
    toggleKeyVisibility.innerHTML = isPassword ? '<i class="ti ti-eye-off"></i>' : '<i class="ti ti-eye"></i>'
  })

  toggleSecretVisibility.addEventListener('click', () => {
    const isPassword = inputDashboardSecret.type === 'password'
    inputDashboardSecret.type = isPassword ? 'text' : 'password'
    toggleSecretVisibility.innerHTML = isPassword ? '<i class="ti ti-eye-off"></i>' : '<i class="ti ti-eye"></i>'
  })

  document.getElementById('saveSettings').addEventListener('click', async () => {
    const key = inputClaudeKey.value.trim()
    if (key) {
      localStorage.setItem('claude_api_key', key)
    } else {
      localStorage.removeItem('claude_api_key')
    }

    const secret = inputDashboardSecret.value.trim()
    if (secret) {
      localStorage.setItem('dashboard_secret', secret)
    } else {
      localStorage.removeItem('dashboard_secret')
    }

    // Guardar objetivos en BD
    const num = id => {
      const v = document.getElementById(id).value
      return v === '' ? null : parseFloat(v)
    }
    const objetivosPayload = {
      stop_max_usd:       num('objStopMax'),
      max_trades_dia:     num('objMaxTrades'),
      pnl_objetivo_dia:   num('objPnlObjetivo'),
      limite_perdida_dia: num('objLimitePerdida'),
    }
    try {
      await DB.saveObjetivos(objetivosPayload)
      if (typeof Metrics !== 'undefined' && Metrics.setObjetivos) Metrics.setObjetivos(objetivosPayload)
    } catch (e) {
      Toast.show('Error al guardar objetivos: ' + e.message, 'error')
      return
    }

    Toast.show('Ajustes guardados', 'success')
    settingsModal.classList.add('hidden')
  })

  // Modal events
  Modal.initTabs()
  document.getElementById('closeModal').addEventListener('click', () => Modal.close())
  document.getElementById('dayModal').addEventListener('click', e => {
    if (e.target === document.getElementById('dayModal')) Modal.close()
  })
  document.getElementById('editSessionBtn').addEventListener('click', () => {
    const date = Modal.currentDate
    const sesion = Modal.currentSesion
    Modal.close()
    SessionForm.prefill(sesion, date)
  })
  document.addEventListener('keydown', e => { if (e.key === 'Escape') Modal.close() })

  // Navigation
  Nav.init()

  // Start on calendar
  Nav.go('calendar')
}

// ── Lightbox ──────────────────────────────────────────────────────────────

const Lightbox = {
  _urls: [],
  _idx: 0,
  _handleKey: null,

  // src: URL to open. urls: optional array for prev/next navigation. idx: current index in urls.
  open(src, urls, idx) {
    this._urls = (urls && urls.length > 0) ? urls : [src]
    this._idx  = (idx != null && idx >= 0) ? idx : 0
    this._show()
  },

  _show() {
    document.getElementById('lightbox')?.remove()
    document.removeEventListener('keydown', this._handleKey)

    const src     = this._urls[this._idx]
    const hasPrev = this._idx > 0
    const hasNext = this._idx < this._urls.length - 1
    const total   = this._urls.length

    const lb = document.createElement('div')
    lb.id = 'lightbox'
    lb.innerHTML = `
      <div class="lb-overlay">
        <button class="lb-close" title="Cerrar (Esc)"><i class="ti ti-x"></i></button>
        ${hasPrev ? `<button class="lb-arrow lb-prev" title="Anterior (←)"><i class="ti ti-chevron-left"></i></button>` : ''}
        <img src="${src}" alt="Imagen completa">
        ${hasNext ? `<button class="lb-arrow lb-next" title="Siguiente (→)"><i class="ti ti-chevron-right"></i></button>` : ''}
        ${total > 1 ? `<div class="lb-counter">${this._idx + 1} / ${total}</div>` : ''}
      </div>`
    document.body.appendChild(lb)
    document.body.classList.add('modal-open')
    requestAnimationFrame(() => lb.querySelector('.lb-overlay').classList.add('visible'))

    lb.addEventListener('click', e => {
      if (e.target === lb || e.target.closest('.lb-close')) this.close()
      else if (e.target.closest('.lb-prev'))  this._prev()
      else if (e.target.closest('.lb-next'))  this._next()
    })

    this._handleKey = e => {
      if (e.key === 'Escape')      this.close()
      if (e.key === 'ArrowLeft')   this._prev()
      if (e.key === 'ArrowRight')  this._next()
    }
    document.addEventListener('keydown', this._handleKey)
  },

  _prev() { if (this._idx > 0) { this._idx--; this._show() } },
  _next() { if (this._idx < this._urls.length - 1) { this._idx++; this._show() } },

  close() {
    document.getElementById('lightbox')?.remove()
    document.body.classList.remove('modal-open')
    document.removeEventListener('keydown', this._handleKey)
    this._handleKey = null
  }
}

document.addEventListener('DOMContentLoaded', boot)
