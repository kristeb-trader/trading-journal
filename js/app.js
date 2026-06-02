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
    const title = document.getElementById('modalDateTitle')

    const fmtDate = d => {
      if (!d) return '—'
      const [y, m, day] = d.split('-')
      const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
      return `${parseInt(day)} ${months[parseInt(m)-1]} ${y}`
    }
    title.textContent = dateStr ? fmtDate(dateStr) : 'Detalle'

    // ── Resumen tab ──
    const pnl = trades.reduce((s, t) => s + (parseFloat(t.profit) || 0), 0)
    const targets = trades.filter(t => t.resultado === 'target').length
    const stops = trades.filter(t => t.resultado === 'stop').length

    let resumenHtml = ''
    if (sesion?.no_opero) {
      resumenHtml = `<div class="modal-no-trade"><i class="ti ti-coffee"></i><p>Sin operación este día</p><p class="text-dim">${sesion.motivo_no_opero || ''}</p></div>`
    } else if (trades.length === 0) {
      resumenHtml = `<div class="modal-no-trade"><i class="ti ti-chart-off"></i><p>Sin trades registrados</p></div>`
    } else {
      resumenHtml = `
        <div class="modal-summary-bar">
          <div class="ms-stat"><span>${trades.length}</span><small>Trades</small></div>
          <div class="ms-stat green"><span>+${targets}</span><small>Targets</small></div>
          <div class="ms-stat red"><span>${stops}</span><small>Stops</small></div>
          <div class="ms-stat ${pnl >= 0 ? 'green' : 'red'}"><span>${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}</span><small>P&L Total</small></div>
        </div>
        <div class="modal-trades-list">
          ${trades.map(t => `
            <div class="modal-trade-row">
              <span class="badge ${Math.abs(parseFloat(t.profit)||0) <= 6 ? 'badge-be' : t.resultado === 'target' ? 'badge-target' : t.resultado === 'stop' ? 'badge-stop' : 'badge-other'}">${Math.abs(parseFloat(t.profit)||0) <= 6 ? 'B.E.' : (t.resultado || '—')}</span>
              <span>${t.market_pos === 'Long' ? '▲' : '▼'} ${t.market_pos}</span>
              <span>${t.qty} contratos</span>
              <span class="${parseFloat(t.profit) >= 0 ? 'text-green' : 'text-red'} fw-bold">${parseFloat(t.profit) >= 0 ? '+' : ''}$${parseFloat(t.profit).toFixed(2)}</span>
              ${t.mae != null ? `<span class="text-dim">MAE: ${t.mae} | MFE: ${t.mfe}</span>` : ''}
            </div>`).join('')}
        </div>`
    }
    document.getElementById('modalResumen').innerHTML = resumenHtml

    // ── Checklist tab ──
    const checks = [
      { key: 'chk_zonas', label: 'Zonas vigentes verificadas' },
      { key: 'chk_orden', label: 'Orden precolocada a tiempo' },
      { key: 'chk_5velas', label: 'Máx 5 velas en corrida' },
      { key: 'chk_noticias', label: 'Calendario económico verificado' },
      { key: 'chk_consecucion', label: 'Zona marcada con consecución' },
      { key: 'chk_estructura', label: 'Estructura de Impulso + Retroceso + Impulso, Fluida' },
    ]
    document.getElementById('modalChecklist').innerHTML = sesion
      ? `<div class="modal-checklist">${checks.map(c => `
          <div class="modal-check-item ${sesion[c.key] ? 'check-ok' : 'check-fail'}">
            <i class="ti ${sesion[c.key] ? 'ti-circle-check' : 'ti-circle-x'}"></i>
            <span>${c.label}</span>
          </div>`).join('')}
          <div class="checklist-score">Disciplina: ${checks.filter(c => sesion[c.key]).length}/${checks.length} (${(checks.filter(c => sesion[c.key]).length / checks.length * 100).toFixed(0)}%)</div>
        </div>`
      : '<p class="text-dim">Sin datos de sesión para este día.</p>'

    // ── Análisis tab ──
    document.getElementById('modalAnalisis').innerHTML = sesion ? `
      <div class="modal-analisis">
        ${sesion.contexto ? `<div class="field-row"><label>Contexto</label><span>${sesion.contexto}</span></div>` : ''}
        ${sesion.num_corrida ? `<div class="field-row"><label>Corrida</label><span>${sesion.num_corrida}ª</span></div>` : ''}
        ${sesion.velas_corrida ? `<div class="field-row"><label>Velas en corrida</label><span>${sesion.velas_corrida}</span></div>` : ''}
        ${sesion.puntos_retroceso ? `<div class="field-row"><label>Puntos retroceso</label><span>${sesion.puntos_retroceso}</span></div>` : ''}
        ${sesion.setup ? `<div class="field-row"><label>Setup</label><span>${sesion.setup}</span></div>` : ''}
        ${sesion.analisis_trader ? `<div class="field-block"><label>Reflexión</label><p>${sesion.analisis_trader}</p></div>` : ''}
        ${sesion.resumen_ia ? `<div class="field-block ia-block"><label><i class="ti ti-sparkles"></i> Resumen IA</label><p>${sesion.resumen_ia}</p></div>` : ''}
      </div>` : '<p class="text-dim">Sin datos de análisis para este día.</p>'

    // ── Imagen tab (imagen + tipificación + sugerencias) ──
    const casuisticas = dateStr ? await DB.getCasuisticasByDate(dateStr) : []

    const imgHtml = sesion?.imagen_url
      ? `<div class="modal-image-wrap"><img src="${sesion.imagen_url}" alt="Captura del día" loading="lazy" style="cursor:zoom-in" title="Clic para ver en tamaño completo"></div>`
      : '<div class="modal-no-trade"><i class="ti ti-photo-off"></i><p>Sin imagen para este día</p></div>'

    const TIPO_EMO = { psicologico: '🧠', analitico: '📐', operativo: '⚙️', marcado: '🗺️' }
    const erroresHtml = `
      <div class="modal-section-title"><span style="font-size:0.95rem">⚠️</span> Errores</div>
      ${casuisticas.length > 0
        ? casuisticas.map((c, i) => {
            const emo = TIPO_EMO[c.tipo] || '•'
            const res = (c.resultado === 'T' || c.resultado === 'S')
              ? `<span class="${c.resultado === 'T' ? 'cas-badge-t' : 'cas-badge-s'}">${c.resultado}</span>` : ''
            const origenTag = c.origen && c.origen !== 'manual'
              ? `<span class="cas-origen" title="${c.origen}">${c.origen === 'ia' ? '🤖' : '🤝'}</span>` : ''
            const recHtml = (c.recomendacion_ia || c.recomendacion_manual)
              ? `<div class="modal-rec-wrap">💡 <strong>${c.recomendacion?.nombre || 'Recomendación'}</strong>${c.recomendacion_ia ? `<br><span class="modal-rec-ia">${c.recomendacion_ia}</span>` : ''}${c.recomendacion_manual ? `<br><span class="modal-rec-manual">✍️ ${c.recomendacion_manual}</span>` : ''}</div>` : ''
            const detalle = (c.descripcion || recHtml)
              ? `<div class="modal-cas-detalle hidden" id="modal-cas-det-${i}">${c.descripcion || ''}${recHtml}</div>` : ''
            return `
              <div class="modal-cas-item">
                <div class="modal-cas-row modal-cas-row-error ${c.descripcion ? 'has-detail' : ''}" ${c.descripcion ? `data-det="${i}"` : ''}>
                  <span>${emo} ${c.casuistica}</span>
                  <span class="modal-cas-right">${origenTag}${res}${c.descripcion ? '<i class="ti ti-chevron-down cas-chevron"></i>' : ''}</span>
                </div>
                ${detalle}
              </div>`
          }).join('')
        : '<p class="modal-empty-sub">✅ Sin errores registrados</p>'}`

    const sugerenciasHtml = `
      <div class="modal-section-title" style="margin-top:16px"><i class="ti ti-bulb"></i> Sugerencias</div>
      <p class="modal-empty-sub">Próximamente...</p>`

    document.getElementById('modalImagen').innerHTML = imgHtml + erroresHtml + sugerenciasHtml

    // Lightbox al hacer clic en la imagen + toggle de detalle de errores
    setTimeout(() => {
      const img = document.querySelector('#modalImagen img')
      if (img) img.addEventListener('click', () => Lightbox.open(img.src))
      document.querySelectorAll('#modalImagen .modal-cas-row.has-detail').forEach(row => {
        row.addEventListener('click', () => {
          const det = document.getElementById(`modal-cas-det-${row.dataset.det}`)
          if (det) det.classList.toggle('hidden')
          row.classList.toggle('open')
        })
      })
    }, 50)

    // Reset to first tab
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'))
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'))
    document.querySelector('.tab-btn[data-tab="imagen"]').classList.add('active')
    document.getElementById('tab-imagen').classList.add('active')

    modal.classList.remove('hidden')
    document.body.classList.add('modal-open')
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
        if (sectionId === 'data') await DataManager.init()
      } catch (err) {
        Toast.show('Error cargando sección: ' + err.message, 'error')
      }
    } else if (sectionId === 'coach') {
      Coach.refresh()
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
