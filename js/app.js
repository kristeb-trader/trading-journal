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

  openDay(dateStr, trades, sesion) {
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
              <span class="badge ${t.resultado === 'target' ? 'badge-target' : t.resultado === 'stop' ? 'badge-stop' : 'badge-other'}">${t.resultado || '—'}</span>
              <span>${t.market_pos === 'Long' ? '▲' : '▼'} ${t.market_pos}</span>
              <span>${t.qty} contratos</span>
              <span>${parseFloat(t.entry_price).toFixed(2)} → ${parseFloat(t.exit_price).toFixed(2)}</span>
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
      { key: 'chk_noticias', label: 'Sin noticia roja activa' },
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

    // ── Imagen tab ──
    document.getElementById('modalImagen').innerHTML = sesion?.imagen_url
      ? `<div class="modal-image-wrap"><img src="${sesion.imagen_url}" alt="Captura del día" loading="lazy" style="cursor:zoom-in" title="Clic para ver en tamaño completo"></div>`
      : '<div class="modal-no-trade"><i class="ti ti-photo-off"></i><p>Sin imagen para este día</p></div>'

    // Lightbox al hacer clic en la imagen
    setTimeout(() => {
      const img = document.querySelector('#modalImagen img')
      if (img) img.addEventListener('click', () => Lightbox.open(img.src))
    }, 50)

    // Reset to first tab
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'))
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'))
    document.querySelector('.tab-btn[data-tab="resumen"]').classList.add('active')
    document.getElementById('tab-resumen').classList.add('active')

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
    metrics: 'Métricas',
    trades: 'Trades',
    register: 'Registrar Sesión',
    analysis: 'Análisis',
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
        if (sectionId === 'calendar') await Calendar.init()
        if (sectionId === 'metrics') await Metrics.init()
        if (sectionId === 'trades') await TradesTable.init()
        if (sectionId === 'register') SessionForm.init()
        if (sectionId === 'analysis') await Charts.init()
      } catch (err) {
        Toast.show('Error cargando sección: ' + err.message, 'error')
      }
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
    const { error } = await supa.from('trades').select('id').limit(1)
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

  openSettings.addEventListener('click', () => {
    inputClaudeKey.value = localStorage.getItem('claude_api_key') || ''
    settingsModal.classList.remove('hidden')
  })
  closeSettings.addEventListener('click', () => settingsModal.classList.add('hidden'))
  settingsModal.addEventListener('click', e => { if (e.target === settingsModal) settingsModal.classList.add('hidden') })

  toggleKeyVisibility.addEventListener('click', () => {
    const isPassword = inputClaudeKey.type === 'password'
    inputClaudeKey.type = isPassword ? 'text' : 'password'
    toggleKeyVisibility.innerHTML = isPassword ? '<i class="ti ti-eye-off"></i>' : '<i class="ti ti-eye"></i>'
  })

  document.getElementById('saveSettings').addEventListener('click', () => {
    const key = inputClaudeKey.value.trim()
    if (key) {
      localStorage.setItem('claude_api_key', key)
      Toast.show('API Key guardada en el navegador', 'success')
    } else {
      localStorage.removeItem('claude_api_key')
      Toast.show('API Key eliminada', 'info')
    }
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
  open(src) {
    const lb = document.createElement('div')
    lb.id = 'lightbox'
    lb.innerHTML = `
      <div class="lb-overlay">
        <button class="lb-close" title="Cerrar (Esc)"><i class="ti ti-x"></i></button>
        <img src="${src}" alt="Imagen completa">
      </div>`
    document.body.appendChild(lb)
    document.body.classList.add('modal-open')
    requestAnimationFrame(() => lb.querySelector('.lb-overlay').classList.add('visible'))
    lb.addEventListener('click', e => { if (e.target === lb || e.target.closest('.lb-close')) this.close() })
    document.addEventListener('keydown', this._esc = e => { if (e.key === 'Escape') this.close() })
  },
  close() {
    document.getElementById('lightbox')?.remove()
    document.body.classList.remove('modal-open')
    document.removeEventListener('keydown', this._esc)
  }
}

document.addEventListener('DOMContentLoaded', boot)
