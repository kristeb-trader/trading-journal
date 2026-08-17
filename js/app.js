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
    const headStats = document.getElementById('modalHeadStats')
    if (headStats) headStats.innerHTML = this._headStats(trades, sesion)

    // Datos extra: diagnóstico del Coach + errores + emociones + checklist dinámico
    // (catalogo_reglas) + total de trades del día SIN filtro de cuenta (para avisar
    // cuando el filtro está ocultando trades).
    const [diag, casuisticas, emociones, chkItems, allDayTrades, fechasEsp] = await Promise.all([
      dateStr ? DB.getDiagnosticoByDate(dateStr) : null,
      dateStr ? DB.getCasuisticasByDate(dateStr) : [],
      DB.getCatalogoEmociones().catch(() => []),
      DB.getChecklistItems({ soloActivos: true }).catch(() => []),
      dateStr ? DB.getTradesByDate(dateStr).catch(() => []) : [],
      DB.getFechasEspeciales().catch(() => []),   // la regla FOMC necesita saber si lo era
    ])
    const ctx = { dateStr, trades, sesion, diag, casuisticas, emociones, chkItems, allDayTrades, fechasEsp }

    // La imagen va fuera del contenedor con scroll (queda fija); el texto dentro.
    document.getElementById('modalDiaImg').innerHTML = this._renderImagenDia(ctx)
    document.getElementById('modalDia').innerHTML = this._renderVistaDia(ctx)
    // Cada día arranca arriba: si no, hereda el scroll del día anterior.
    document.querySelector('#dayModal .dv-scroll')?.scrollTo({ top: 0 })

    // Eventos: lightbox, toggles de errores, ver completo
    setTimeout(() => {
      const img = modal.querySelector('#modalDiaImg img')
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

    modal.querySelector('.modal-content').scrollTop = 0   // abrir siempre arriba
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

  // Puntos del día: mismo cálculo que la tabla de Operativa (SHORT = e−x).
  _puntosDia(trades) {
    let pts = null
    for (const t of trades) {
      const e = parseFloat(t.entry_price), x = parseFloat(t.exit_price)
      if (!isFinite(e) || !isFinite(x)) continue
      const short = /short|sell/i.test(t.market_pos || '')
      pts = (pts || 0) + (short ? e - x : x - e)
    }
    return pts
  },

  // Cabecera del modal: Puntos · Resultado · P&L · Setup, en un recuadro con relieve
  // y color según el resultado del día.
  _headStats(trades, sesion) {
    trades = trades || []
    if (!trades.length && !sesion) return ''
    const st = this._dayState(trades, sesion)
    const badgeCls = st.cls === 'mst-green' ? 'r-t' : st.cls === 'mst-red' ? 'r-s' : 'r-o'
    // Tono del recuadro: verde en target, rojo en stop, neutro en el resto
    const boxTone = st.cls === 'mst-green' ? 'tone-t' : st.cls === 'mst-red' ? 'tone-s' : 'tone-o'
    // Orden pedido: Resultado · Puntos · P&L · Setup
    const cells = []
    const CORTO = {
      'Setup válido — no entré': 'NO ENTRÉ',
      'Sin entradas válidas': 'SIN ENTRADAS',
      'No operé': 'NO OPERÉ',
      'Sin trades': 'SIN TRADES',
      'Break Even': 'B.E.',
    }
    cells.push(`<div class="mh-stat"><label>Resultado</label><span class="cz-rb ${badgeCls}" title="${st.label}">${CORTO[st.label] || st.label}</span></div>`)
    if (trades.length) {
      const pts = this._puntosDia(trades)
      if (pts != null) cells.push(`<div class="mh-stat"><label>Puntos</label><span class="mh-val ${pts < 0 ? 'neg' : 'pos'}">${pts >= 0 ? '+' : ''}${pts.toFixed(2)}</span></div>`)
      const pnl = trades.reduce((s, t) => s + (parseFloat(t.profit) || 0), 0)
      cells.push(`<div class="mh-stat"><label>P&amp;L</label><span class="mh-val ${pnl < 0 ? 'neg' : 'pos'}">${pnl >= 0 ? '+' : '−'}$${Math.abs(pnl).toFixed(2)}</span></div>`)
    }
    // Setup operado (a la derecha). Solo si el día tiene uno declarado.
    const setup = (sesion?.setup || '').trim()
    if (setup) {
      const esc = setup.replace(/[&<>"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]))
      cells.push(`<div class="mh-stat mh-stat-setup"><label>Setup</label><span class="mh-setup" title="${esc}">${esc}</span></div>`)
    }
    return `<div class="mh-box ${boxTone}">${cells.join('')}</div>`
  },

  // Checklist aplicable al día. Delega el criterio en db.js (fuente única) para que
  // el modal muestre exactamente los mismos ítems que cuenta la disciplina.
  // Cada ítem sale con:
  //   ok    — se cumplió
  //   roto  — la casilla decía sí pero un error del día la desmiente
  //   auto  — la resolvió el dato, no el trader (no es marcable)
  _checklistDia(chkItems, sesion, trades, casuisticas, fechasEsp) {
    if (!sesion) return []
    const ctx = discContexto({ trades, errores: casuisticas, fechasEsp })
    return (chkItems || []).filter(i => {
      const f = { fase: i.fase || 1, setup: i.setup || null, aplica_si: i.aplica_si || 'siempre' }
      if (!discFactorAplica(f, sesion, ctx)) return false
      if ((i.evidencia || 'declarada') === 'auto') {
        return reglaAutoResultado(i.clave, sesion, ctx) !== null   // sin dato → no se muestra
      }
      return (sesion.checklist?.[i.clave] ?? sesion[i.clave]) !== undefined
    }).map(i => {
      if ((i.evidencia || 'declarada') === 'auto') {
        return { ...i, ok: reglaAutoResultado(i.clave, sesion, ctx) === true, roto: false, auto: true }
      }
      const marcado = !!(sesion.checklist?.[i.clave] ?? sesion[i.clave])
      const roto = ctx.rotas.get(sesion.sesion_date)?.has(i.clave) || false
      return { ...i, ok: marcado && !roto, roto: marcado && roto, auto: false }
    })
  },

  // ── Vista del día (pantalla completa) ────────────────────────────────────
  // Un solo scroll: gráfico → lo que escribió el trader → lo que dijo el Coach.
  // Sustituye a las 3 pestañas; el P&L ya vive en la cabecera, así que aquí NO
  // se repite (el banner grande del antiguo Resumen era ese duplicado).

  // Markdown mínimo: **negrita**, `código` y saltos de línea. Las secciones del
  // Coach vienen en markdown ligero y sin esto se leen con los asteriscos.
  _md(s) {
    const esc = (s || '').replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]))
    return esc
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/`(.+?)`/g, '$1')
      .replace(/^\s*[-*]\s+/gm, '• ')
      .replace(/\n{2,}/g, '</p><p>')
      .replace(/\n/g, '<br>')
  },

  _bloque(lbl, contenido, tono = '') {
    if (!contenido || !String(contenido).trim()) return ''
    return `<div class="dv-block ${tono}">
      <div class="dv-lbl">${lbl}</div>
      <div class="dv-txt"><p>${this._md(contenido)}</p></div>
    </div>`
  },

  // El gráfico va aparte: se monta en un contenedor FIJO fuera del scroll, para que
  // al bajar solo se mueva el texto y la imagen siga a la vista.
  _renderImagenDia({ sesion }) {
    return sesion?.imagen_url
      ? `<img src="${sesion.imagen_url}" alt="Gráfico del día" loading="lazy" style="cursor:zoom-in" title="Clic para ampliar">`
      : '<div class="dv-sin-img"><i class="ti ti-photo-off"></i> Sin gráfico para este día</div>'
  },

  // Un bloque con resumen visible y detalle plegado, igual que las secciones del
  // Coach (`czSeccion`): arriba lo legible, el desarrollo tras "Ver detalle".
  _bloquePlegable(lbl, resumen, detalle, tono = '', verDetalle = 'Ver detalle') {
    const hayRes = resumen && String(resumen).trim()
    const hayDet = detalle && String(detalle).trim()
    if (!hayRes && !hayDet) return ''
    return `<div class="dv-block ${tono}">
      <div class="dv-lbl">${lbl}</div>
      ${hayRes ? `<div class="dv-txt"><p>${this._md(resumen)}</p></div>` : ''}
      ${hayDet ? `<details class="cz-det"><summary>${verDetalle}</summary>
        <div class="cz-det-body dv-txt"><p>${this._md(detalle)}</p></div></details>` : ''}
    </div>`
  },

  _renderVistaDia(ctx) {
    const { sesion, diag } = ctx

    // Lo primero que se lee es el RESUMEN del Coach (la línea que escribe para el
    // diario). Todo el análisis largo —contexto, desarrollo, validación— queda
    // detrás de "Ver detalle", como en la pestaña del Coach.
    const detalleCoach = [diag?.sec_contexto, diag?.sec_desarrollo, diag?.sec_validacion]
      .filter(s => s && s.trim()).join('\n\n')

    const cuerpo = [
      this._bloquePlegable('Resumen del Coach', diag?.sec_resumen_compacto, detalleCoach,
                           '', 'Ver análisis completo'),
      this._bloque('Tu reflexión', sesion?.analisis_trader, 'gry'),
      this._bloque('Veredicto', diag?.sec_veredicto, 'blu'),
      this._bloque('Errores', diag?.sec_errores, 'red'),
      this._bloque('Aprendizaje', diag?.sec_aprendizaje, 'amb'),
      this._bloque('Notas adicionales', sesion?.resumen_ia, 'gry'),
    ].join('')

    const vacio = !cuerpo
      ? `<p class="modal-empty-sub">Este día aún no tiene análisis ni diagnóstico.</p>` : ''

    // Los errores registrados (con su tipo, origen y recomendación) siguen
    // saliendo con el mismo bloque de siempre: es el detalle accionable.
    return cuerpo + vacio + this._renderErroresLista(ctx)
  },

  // Lista de errores registrados del día (tipo, origen, T/S, detalle y
  // recomendación). El gráfico ya lo pinta _renderVistaDia.
  _renderErroresLista({ casuisticas }) {
    const erroresHtml = `
      <div class="modal-section-title"><span style="font-size:0.95rem">⚠️</span> Errores</div>
      ${casuisticas.length > 0
        ? casuisticas.map((c, i) => {
            const emo = this._TIPO_EMO[c.tipo] || '•'
            const res = (c.resultado === 'T' || c.resultado === 'S')
              ? `<span class="${c.resultado === 'T' ? 'cas-badge-t' : 'cas-badge-s'}">${c.resultado}</span>` : ''
            const origenTag = c.origen && c.origen !== 'manual'
              ? `<span class="cas-origen" title="${c.origen}">${c.origen === 'ia' ? '🤖' : '🤝'}</span>` : ''
            // Recomendación SIEMPRE visible (antes estaba oculta tras el chevron);
            // solo la descripción larga del error queda colapsable.
            const recHtml = (c.recomendacion_ia || c.recomendacion_manual)
              ? `<div class="modal-rec-wrap">💡 <strong>${c.recomendacion?.nombre || 'Recomendación'}</strong>${c.recomendacion_ia ? `<br><span class="modal-rec-ia">${c.recomendacion_ia}</span>` : ''}${c.recomendacion_manual ? `<br><span class="modal-rec-manual">✍️ ${c.recomendacion_manual}</span>` : ''}</div>` : ''
            const hasDet = !!c.descripcion
            const detalle = hasDet
              ? `<div class="modal-cas-detalle hidden" id="modal-cas-det-${i}">${c.descripcion}</div>` : ''
            return `
              <div class="modal-cas-item">
                <div class="modal-cas-row modal-cas-row-error ${hasDet ? 'has-detail' : ''}" ${hasDet ? `data-det="${i}"` : ''}>
                  <span>${emo} ${c.casuistica}</span>
                  <span class="modal-cas-right">${origenTag}${res}${hasDet ? '<i class="ti ti-chevron-down cas-chevron"></i>' : ''}</span>
                </div>
                ${detalle}
                ${recHtml}
              </div>`
          }).join('')
        : '<p class="modal-empty-sub">✅ Sin errores registrados</p>'}`

    return erroresHtml
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

// ── Sesión Operativa: pestañas Diario / Coach IA / Días anteriores ────────
// Funde lo que eran tres secciones. Cada módulo conserva su markup y sus ids,
// así que form.js y coach.js siguen funcionando sin enterarse del cambio.

const SesionOperativa = {
  tab: 'diario',
  coachIniciado: false,

  init() {
    document.getElementById('soTabs')?.addEventListener('click', e => {
      const btn = e.target.closest('.so-tab')
      if (btn) this.showTab(btn.dataset.tab)
    })
  },

  async showTab(tab) {
    this.tab = tab
    document.querySelectorAll('#soTabs .so-tab').forEach(b =>
      b.classList.toggle('active', b.dataset.tab === tab))
    document.querySelectorAll('#section-register .so-panel').forEach(p =>
      p.classList.toggle('active', p.id === `so-panel-${tab}`))

    try {
      if (tab === 'coach') {
        // El Coach se inicializa la primera vez; después solo se refresca.
        if (!this.coachIniciado) { this.coachIniciado = true; await Coach.init() }
        else Coach.refresh()
      } else if (tab === 'dias') {
        await Coach.renderHistorial()
      }
    } catch (err) {
      Toast.show('Error al abrir la pestaña: ' + err.message, 'error')
    }
  },

  // Recuadro de resultado del día activo, encima de las pestañas. Reutiliza el
  // mismo render que la vista del día para que un día se lea igual en todas
  // partes.
  //
  // OJO: NO se filtra por la cuenta principal. La cuenta de Apex rota (la -14
  // pasó a ser la -15), así que filtrar por la principal de HOY dejaba en blanco
  // todos los días operados con una cuenta anterior — que es casi todo el
  // histórico. `trades` ya contiene solo la operativa del journal, así que los
  // trades del día son los del día, con la cuenta que fuera.
  async syncHead(date) {
    const el = document.getElementById('soHeadStats')
    if (!el) return
    if (!date) { el.innerHTML = ''; return }
    try {
      const [trades, sesion] = await Promise.all([
        DB.getTradesByDate(date).catch(() => []),
        DB.getSesionByDate(date).catch(() => null),
      ])
      el.innerHTML = Modal._headStats(trades || [], sesion)
    } catch { el.innerHTML = '' }
  },
}

// ── Otros: índice de las secciones que salieron del menú ─────────────────
// La barra del móvil solo aguanta 6 botones (60px cada uno contra ~390px de
// pantalla). Estas 6 secciones siguen existiendo igual: solo cambia por dónde
// se llega a ellas. Añadir una opción nueva = una entrada más en este array.

const Otros = {
  ITEMS: [
    { id: 'experimentos', icon: 'ti-flask',          name: 'Experimentos',      desc: 'Qué estás probando y si funciona' },
    { id: 'trades',       icon: 'ti-list-details',   name: 'Trades',            desc: 'Todas tus operaciones, una a una' },
    { id: 'gallery',      icon: 'ti-photo',          name: 'Imágenes',          desc: 'Los gráficos de cada día' },
    { id: 'estrategia',   icon: 'ti-book-2',         name: 'Estrategia',        desc: 'Tus reglas y setups' },
    { id: 'data',         icon: 'ti-database',       name: 'Datos',             desc: 'Cuentas, catálogos e importación' },
    { id: 'fechas',       icon: 'ti-calendar-star',  name: 'Fechas Especiales', desc: 'Festivos, FOMC y días marcados' },
  ],

  init() {
    const grid = document.getElementById('otrosGrid')
    if (!grid) return
    grid.innerHTML = this.ITEMS.map(it => `
      <button type="button" class="otros-card" data-goto="${it.id}">
        <i class="ti ${it.icon}"></i>
        <span class="otros-card-name">${it.name}</span>
        <span class="otros-card-desc">${it.desc}</span>
      </button>`).join('')
    grid.addEventListener('click', e => {
      const card = e.target.closest('.otros-card')
      if (card) Nav.go(card.dataset.goto)
    })
  },
}

// ── Navigation ────────────────────────────────────────────────────────────

const Nav = {
  sections: {
    calendar: 'Calendario',
    trades: 'Trades',
    gallery: 'Imágenes',
    register: 'Sesión Operativa',
    analysis: 'Análisis',
    disciplina: 'Disciplina',
    experimentos: 'Experimentos',
    apex: 'Apex Tracker',
    estrategia: 'Estrategia',
    data: 'Datos',
    fechas: 'Fechas Especiales',
    otros: 'Otros',
  },
  // `coach` e `historial` ya no son secciones: son pestañas de Sesión Operativa.
  // Se mantienen como alias para no romper a quien navega a ellas (el modal del
  // día, Coach.abrirFecha, enlaces internos…).
  TAB_ALIAS: { coach: 'coach', historial: 'dias' },
  // Secciones sin botón propio: iluminan el de "Otros", que es de donde se llega.
  // Sin esto la barra se quedaría entera apagada al entrar en cualquiera de ellas,
  // porque `go()` enciende el .nav-item cuyo data-section coincide.
  PADRE: {
    experimentos: 'otros', trades: 'otros', gallery: 'otros',
    estrategia: 'otros', data: 'otros', fechas: 'otros',
  },
  initialized: new Set(),

  // Dato variable que acompaña al título en la barra superior: el mes del
  // Calendario, el filtro de Imágenes, el rango de Disciplina. Se guarda POR
  // SECCIÓN y no se borra al salir: al volver a una sección ya inicializada
  // nadie vuelve a escribirlo (`go()` no re-renderiza el Calendario), así que
  // limpiarlo dejaría la barra sin el mes.
  CONTEXTO: {},

  // Controles que viven en la barra superior y pertenecen a UNA sección (ago 2026).
  // Antes cada sección tenía su propia fila con el filtro de cuentas y las flechas de
  // mes; al subirlos aquí se recupera ese alto en las tres pantallas.
  //   filtro    → id del contenedor del filtro de cuentas de esa sección
  //   navMes    → mostrar las flechas ‹ › junto al mes
  HERRAMIENTAS: {
    calendar: { navMes: true },
    otros:    { conexion: true },
  },

  _pintaHerramientas(sectionId) {
    const cfg = this.HERRAMIENTAS[sectionId] || {}
    document.querySelectorAll('.header-info .hdr-nav').forEach(el => {
      el.classList.toggle('hidden', !cfg.navMes)
    })
    // El estado de la conexión solo se muestra en Otros, que es donde vive todo lo
    // que es "sobre la app" y no sobre la operativa. Si falla, el toast del arranque
    // avisa igualmente estés donde estés.
    document.getElementById('connectionStatus')?.classList.toggle('hidden', !cfg.conexion)
  },

  setContexto(sectionId, txt) {
    this.CONTEXTO[sectionId] = txt || ''
    if (this._actual === sectionId) this._pintaContexto(sectionId)
  },

  _pintaContexto(sectionId) {
    const el = document.getElementById('sectionContext')
    if (el) el.textContent = this.CONTEXTO[sectionId] || ''
  },

  async go(sectionId) {
    const tabPedida = this.TAB_ALIAS[sectionId]
    if (tabPedida) sectionId = 'register'
    const padre = this.PADRE[sectionId] || null
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.section === (padre || sectionId))
    })
    document.querySelectorAll('.section').forEach(sec => {
      sec.classList.toggle('active', sec.id === `section-${sectionId}`)
    })
    document.getElementById('currentSectionTitle').textContent = this.sections[sectionId] || ''
    // El chevron de volver solo tiene sentido dentro de una subsección.
    document.getElementById('navBack')?.classList.toggle('hidden', !padre)
    this._padreActual = padre
    this._actual = sectionId
    this._pintaContexto(sectionId)
    this._pintaHerramientas(sectionId)

    // Lazy init sections
    if (!this.initialized.has(sectionId)) {
      this.initialized.add(sectionId)
      try {
        if (sectionId === 'calendar') { await Calendar.init(); await Metrics.init() }
        if (sectionId === 'trades') await TradesTable.init()
        if (sectionId === 'register') { SessionForm.init(); SessionForm.onShow() }
        if (sectionId === 'gallery') await Gallery.init()
        if (sectionId === 'analysis') await Charts.init()
        if (sectionId === 'disciplina') await Disciplina.init()
        if (sectionId === 'experimentos') await Experimentos.init()
        if (sectionId === 'apex') await Apex.init()
        if (sectionId === 'estrategia') await Estrategia.init()
        if (sectionId === 'data') await DataManager.init()
        if (sectionId === 'fechas') await Fechas.init()
        if (sectionId === 'otros') Otros.init()
      } catch (err) {
        Toast.show('Error cargando sección: ' + err.message, 'error')
      }
    } else if (sectionId === 'experimentos') {
      Experimentos.reload()
    } else if (sectionId === 'apex') {
      Apex.reload()
    } else if (sectionId === 'analysis') {
      Charts.refresh()
    } else if (sectionId === 'disciplina') {
      Disciplina.reload()
    } else if (sectionId === 'register') {
      SessionForm.onShow()
    } else if (sectionId === 'fechas') {
      Fechas.reload()
    }

    // Si se pidió una pestaña concreta (alias coach/historial), se abre; si no,
    // al entrar a la sección se vuelve al Diario.
    if (sectionId === 'register') {
      await SesionOperativa.showTab(tabPedida || 'diario')
      SesionOperativa.syncHead(document.getElementById('sesionDate')?.value)
    }
  },

  init() {
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', () => this.go(item.dataset.section))
    })
    document.getElementById('menuToggle').addEventListener('click', () => {
      document.getElementById('sidebar').classList.toggle('collapsed')
    })
    document.getElementById('navBack')?.addEventListener('click', () => {
      if (this._padreActual) this.go(this._padreActual)
    })
  }
}

// ── Bootstrap ─────────────────────────────────────────────────────────────

// Pantalla de login: se muestra si no hay sesión. Al entrar, recarga la app.
function showLoginGate() {
  const gate = document.getElementById('loginGate')
  const form = document.getElementById('loginForm')
  const err  = document.getElementById('loginError')
  const btn  = document.getElementById('loginBtn')
  gate.classList.remove('hidden')
  form.addEventListener('submit', async e => {
    e.preventDefault()
    err.classList.add('hidden')
    btn.disabled = true; btn.textContent = 'Entrando…'
    try {
      await DB.signIn(document.getElementById('loginEmail').value.trim(), document.getElementById('loginPassword').value)
      location.reload()
    } catch (_) {
      err.textContent = 'Email o contraseña incorrectos.'
      err.classList.remove('hidden')
      btn.disabled = false; btn.textContent = 'Entrar'
    }
  })
}

async function boot() {
  // ── Gate de autenticación: sin sesión → solo login, no arranca la app ──
  let session = null
  try { session = await DB.getSession() } catch (_) {}
  if (!session) { showLoginGate(); return }
  // El logout vive en Otros › Ajustes desde que se retiró el pie del sidebar,
  // que estaba oculto en móvil y dejaba al journal sin forma de cerrar sesión.
  document.getElementById('logoutBtn')?.addEventListener('click', async () => {
    await DB.signOut(); location.reload()
  })
  // Bajo "Cerrar sesión", con qué cuenta se está dentro. Sustituye al badge
  // "Cuenta Fondeo", que era texto fijo que nadie actualizaba.
  const cuentaEl = document.getElementById('ajustesCuenta')
  if (cuentaEl) cuentaEl.textContent = session.user?.email || ''

  // Check Supabase connectivity. La barra solo muestra el punto de color: el
  // texto decía lo mismo que el color y ocupaba sitio. El detalle sale al pulsarlo.
  const dot = document.getElementById('connectionStatus')
  const setDot = (ok, detalle) => {
    dot.innerHTML = '<i class="ti ti-circle-filled"></i>'
    dot.classList.remove('connected', 'disconnected')
    dot.classList.add(ok ? 'connected' : 'disconnected')
    dot.title = ok ? 'Conectado' : 'Sin conexión'
    dot.setAttribute('aria-label', dot.title)
    dot._detalle = detalle || dot.title
    dot._ok = ok
  }
  dot.addEventListener('click', () => Toast.show(dot._detalle, dot._ok ? 'success' : 'error'))

  try {
    const { error } = await supa.from('trades').select('trade_number').limit(1)
    if (error) throw error
    setDot(true, 'Conectado a Supabase')
  } catch (err) {
    setDot(false, 'Sin conexión a Supabase: ' + (err.message || err))
    console.error('Supabase error:', err)
    Toast.show('Sin conexión a Supabase: ' + (err.message || err), 'error')
  }

  // Catálogos que varios módulos consultan de forma sincrónica (setups + checklist).
  // Se precargan una vez para que la familia del setup salga del catálogo y no
  // del fallback por prefijo.
  await DB.preloadCatalogos()

  // Settings modal. Lo dispara ahora la fila "Claves y objetivos" de Otros ›
  // Ajustes, en vez de la tuerca de la barra superior. El modal en sí no cambia.
  const openSettings = document.getElementById('ajustesClaves')
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

  // ── Seguridad: cambiar contraseña ───────────────────────────────────────
  const secModal = document.getElementById('securityModal')
  const secP1 = document.getElementById('secPass1')
  const secP2 = document.getElementById('secPass2')
  const secErr = document.getElementById('secError')
  const secBtn = document.getElementById('secGuardar')

  const secCerrar = () => {
    secModal.classList.add('hidden')
    secP1.value = ''; secP2.value = ''
    secErr.classList.add('hidden')
  }
  document.getElementById('ajustesSeguridad')?.addEventListener('click', () => {
    secCerrar(); secModal.classList.remove('hidden'); secP1.focus()
  })
  document.getElementById('closeSecurity').addEventListener('click', secCerrar)
  secModal.addEventListener('click', e => { if (e.target === secModal) secCerrar() })

  document.getElementById('secToggle').addEventListener('click', () => {
    const oculta = secP1.type === 'password'
    secP1.type = secP2.type = oculta ? 'text' : 'password'
    document.getElementById('secToggle').innerHTML = oculta
      ? '<i class="ti ti-eye-off"></i>' : '<i class="ti ti-eye"></i>'
  })

  secBtn.addEventListener('click', async () => {
    const p1 = secP1.value, p2 = secP2.value
    const fallo = p1.length < 8
      ? 'La contraseña necesita al menos 8 caracteres.'
      : p1 !== p2 ? 'Las dos contraseñas no coinciden.' : null
    if (fallo) {
      secErr.textContent = fallo; secErr.classList.remove('hidden')
      return
    }
    secErr.classList.add('hidden')
    secBtn.disabled = true
    secBtn.innerHTML = '<i class="ti ti-loader-2 spin"></i> Cambiando…'
    try {
      await DB.changePassword(p1)
      secCerrar()
      Toast.show('Contraseña actualizada', 'success')
    } catch (e) {
      secErr.textContent = e.message || 'No se pudo cambiar la contraseña.'
      secErr.classList.remove('hidden')
    } finally {
      secBtn.disabled = false
      secBtn.innerHTML = '<i class="ti ti-device-floppy"></i> Cambiar contraseña'
    }
  })

  // Modal events
  // La vista del día ya no tiene pestañas (es un solo scroll); initTabs se
  // conserva por si otra sección usa `.tab-btn`, pero aquí no aplica.
  Modal.initTabs()
  document.getElementById('closeModal').addEventListener('click', () => Modal.close())
  // El pie de la vista del día se eliminó (ago 2026): repetía el "volver" de la
  // cabecera y el botón "Ver sesión". A la sesión se llega desde el menú Sesión.
  document.getElementById('dayModal').addEventListener('click', e => {
    if (e.target === document.getElementById('dayModal')) Modal.close()
  })
  // Esc sigue cerrando aunque ya no se anuncie con una leyenda en la cabecera.
  document.addEventListener('keydown', e => { if (e.key === 'Escape') Modal.close() })

  // Navigation
  SesionOperativa.init()
  Nav.init()

  // Precargar el catálogo del checklist (claves dinámicas para calendario/charts/métricas)
  await DB.getChecklistItems().catch(() => {})

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
