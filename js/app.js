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
    const [diag, casuisticas, emociones, chkItems, allDayTrades, fechasEsp, fichaMotor] = await Promise.all([
      dateStr ? DB.getDiagnosticoByDate(dateStr) : null,
      dateStr ? DB.getCasuisticasByDate(dateStr) : [],
      DB.getCatalogoEmociones().catch(() => []),
      // Las reglas de la ETAPA de ese día, activas o no (un día viejo se ve con las suyas).
      DB.getChecklistItems().then(() => DB.checklistDeEtapa(etapaDeFecha(dateStr))).catch(() => []),
      dateStr ? DB.getTradesByDate(dateStr).catch(() => []) : [],
      DB.getFechasEspeciales().catch(() => []),   // la regla FOMC necesita saber si lo era
      // La medida del plan (desde el 01/10): la ficha del motor, tras su candado.
      dateStr && medidaDeFecha(dateStr) === 'plan' ? DB.getFichaMotor(dateStr).catch(() => null) : null,
    ])
    const ctx = { dateStr, trades, sesion, diag, casuisticas, emociones, chkItems, allDayTrades, fechasEsp, fichaMotor }

    // La imagen va fuera del contenedor con scroll (queda fija); el texto dentro.
    document.getElementById('modalDiaImg').innerHTML = this._renderImagenDia(ctx)
    document.getElementById('modalDia').innerHTML = this._renderVistaDia(ctx)
    // Cada día arranca arriba: si no, hereda el scroll del día anterior.
    document.querySelector('#dayModal .dv-scroll')?.scrollTo({ top: 0 })

    // Eventos: lightbox, toggles de errores, ver completo
    setTimeout(() => {
      const img = modal.querySelector('#modalDiaImg img')
      if (img) img.addEventListener('click', () => this._ampliar('mio', dateStr, img.src))
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

  // La misma vista del día, para un día que NO es del journal: Chaumer, Claude o
  // el backtesting manual (calendarios.js). Misma cabecera, misma imagen fija con
  // ampliación y mismo cuerpo con bloques; el contenido lo trae quien llama, ya
  // escapado. No toca currentSesion: aquí no hay diario que abrir.
  openFuente({ fecha = null, fuente = null, titulo, stats = '', imagen = null, cuerpo = '' }) {
    this.currentSesion = null
    this.currentDate = fecha   // para el botón "3 gráficas"
    const modal = document.getElementById('dayModal')
    document.getElementById('modalDateTitle').textContent = titulo
    document.getElementById('modalHeadStats').innerHTML = stats
    const img = document.getElementById('modalDiaImg')
    img.innerHTML = imagen
      ? '<img alt="Gráfico del día" loading="lazy" style="cursor:zoom-in" title="Clic para ampliar">'
      : '<div class="dv-sin-img"><i class="ti ti-photo-off"></i> Sin gráfico para este día</div>'
    const el = img.querySelector('img')
    if (el) { el.src = imagen; el.addEventListener('click', () => this._ampliar(fuente, fecha, el.src)) }
    document.getElementById('modalDia').innerHTML = cuerpo
    modal.querySelector('.dv-scroll')?.scrollTo({ top: 0 })
    modal.classList.remove('hidden')
    document.body.classList.add('modal-open')
  },

  // El gráfico ampliado: la lupa, que pasa de un día a otro de ese calendario (Calendarios.lupa).
  // Sin calendario o sin fecha, la imagen sola, como antes.
  _ampliar(fuente, fecha, src) {
    if (fuente && fecha && typeof Calendarios !== 'undefined') Calendarios.lupa(fuente, fecha, src)
    else Lightbox.open(src)
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

  // La disciplina del día con la medida del plan (desde el 01/10): el veredicto, la
  // ejecución y las alarmas. Mismo cálculo que el dashboard (db.js). Los trades, sin
  // filtro de cuenta: la disciplina es del proceso, no de una cuenta.
  // Diseño: docs/disenos/2026-10-23-disciplina-plan.md.
  _bloquePlan({ dateStr, sesion, allDayTrades, fechasEsp, chkItems, fichaMotor }) {
    if (!sesion || !dateStr || medidaDeFecha(dateStr) !== 'plan') return ''
    const motor = new Map(fichaMotor ? [[dateStr, { estado: fichaMotor.estado,
      operacion: fichaMotor.ficha?.operacion || null, tu: fichaMotor.ficha?.tu_operacion || null }]] : [])
    const dctx = discContexto({ trades: allDayTrades, fechasEsp, motor })
    const v = veredictoDia(sesion, dctx)
    if (!v || v === 'pendiente') return ''
    const info = VEREDICTO_TXT[v]
    const opPlan = fichaMotor?.ficha?.operacion
    const lineas = [`**${info.largo}**` + (opPlan && (v === 'otro' || v === 'aviso') ? ` — el plan: ${fmtOpPlan(opPlan)}` : '')]
    const ej = ejecucionDia(sesion, dctx)
    if (ej) lineas.push(ej.ok ? 'Ejecución igual al plan.' : `Ejecución: ${ej.fallos.map(textoFalloEjecucion).join(' · ')}.`)
    const al = alarmasDia(sesion, DB.checklistTodos(), dctx)
    if (al.length) lineas.push(`Alarmas: ${al.map(textoAlarma).join(' · ')}.`)
    const tono = info.tono === 'r' ? 'red' : info.tono === 'a' ? 'amb' : ''
    return this._bloque('Disciplina · el plan y tú', lineas.join('\n'), tono)
  },

  _renderVistaDia(ctx) {
    const { sesion, diag } = ctx

    // Lo primero que se lee es el RESUMEN del Coach (la línea que escribe para el
    // diario). Todo el análisis largo —contexto, desarrollo, validación— queda
    // detrás de "Ver detalle", como en la pestaña del Coach.
    const detalleCoach = [diag?.sec_contexto, diag?.sec_desarrollo, diag?.sec_validacion]
      .filter(s => s && s.trim()).join('\n\n')

    const cuerpo = [
      this._bloquePlan(ctx),
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

// `grupo` separa lo que se CONSULTA de lo que se CONFIGURA: antes las seis
// tarjetas pesaban igual y la pantalla se leía como un menú de sistema.
// `color` elige el par --c/--c-dim de la tarjeta (ver .oc-* en styles.css);
// sin él, la tarjeta es neutra. `unidad` es el rótulo bajo el contador.
const Otros = {
  ITEMS: [
    { id: 'trades',       grupo: 'Consultar',  color: 'accent',  icon: 'ti-list-details',  name: 'Trades',            desc: 'Todas tus operaciones, una a una',  unidad: 'operaciones' },
    { id: 'gallery',      grupo: 'Consultar',  color: 'violet',  icon: 'ti-photo',         name: 'Imágenes',          desc: 'Los gráficos de cada día',          unidad: 'gráficos' },
    // Experimentos era azul; cedió el azul a Chaumer el 19 ago, porque dos
    // tarjetas azules seguidas en el mismo grupo se leen como un error.
    { id: 'experimentos', grupo: 'Consultar',  color: 'warning', icon: 'ti-flask',         name: 'Experimentos',      desc: 'Qué estás probando y si funciona',  unidad: 'en prueba' },
    { id: 'chaumer',      grupo: 'Consultar',  color: 'blue',    icon: 'ti-arrows-diff',   name: 'Chaumer',           desc: 'Sus operativas frente a las tuyas', unidad: 'días cargados' },
    // Neutra: en Consultar ya no queda color libre que no sea el rojo, y el rojo
    // es stop/error. Entró el 24 sep (fase 4b de la unificación Chaumer).
    { id: 'backtesting',  grupo: 'Consultar',  color: '',        icon: 'ti-history',       name: 'Backtesting',       desc: 'Tu bitácora de días pasados',       unidad: 'jornadas' },
    { id: 'estrategia',   grupo: 'Configurar', color: 'warning', icon: 'ti-book-2',        name: 'Estrategia',        desc: 'El plan de Chaumer y tu checklist', unidad: 'reglas del plan' },
    { id: 'data',         grupo: 'Configurar', color: '',        icon: 'ti-database',      name: 'Datos',             desc: 'Cuentas, catálogos e importación',  unidad: 'ítems en catálogo' },
    { id: 'fechas',       grupo: 'Configurar', color: 'red',     icon: 'ti-calendar-star', name: 'Fechas Especiales', desc: 'Festivos, FOMC y días marcados',    unidad: 'este año' },
  ],

  // Línea inferior de la tarjeta. Solo la tienen cuatro; en las demás el bloque
  // ni se pinta, para no dejar un separador colgando de nada.
  META: {
    trades: d => (d.ultimo  ? `última · ${Otros._fecha(d.ultimo)}` : ''),
    data:   d => (d.cuenta  ? `principal · ${AccountFilter.corto(d.cuenta)}` : ''),
    fechas: d => (d.proxima ? `próxima · ${Otros._fecha(d.proxima)}` : ''),
    backtesting: d => (d.ultimo ? `última · ${Otros._fecha(d.ultimo)}` : ''),
  },

  // Ancla al mediodía a propósito: sobre una fecha YA anclada, pasar por Date es
  // seguro. Lo que rompe es sacar el día del instante actual, que se va a UTC.
  _fecha(iso) {
    return new Date(`${iso}T12:00:00`).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
  },

  _card(it) {
    return `
      <button type="button" class="otros-card ${it.color ? 'oc-' + it.color : ''}" data-goto="${it.id}">
        <span class="otros-card-top">
          <span class="otros-card-ico"><i class="ti ${it.icon}"></i></span>
          <i class="ti ti-chevron-right otros-card-go"></i>
        </span>
        <span class="otros-card-n cargando" data-n="${it.id}">··</span>
        <span class="otros-card-u">${it.unidad}</span>
        <span class="otros-card-name">${it.name}</span>
        <span class="otros-card-desc">${it.desc}</span>
        <span class="otros-card-meta hidden" data-meta="${it.id}"></span>
      </button>`
  },

  init() {
    const cont = document.getElementById('otrosGrid')
    if (!cont) return
    const grupos = [...new Set(this.ITEMS.map(it => it.grupo))]
    cont.innerHTML = grupos.map(g => `
      <p class="otros-eyebrow">${g}</p>
      <div class="otros-grid">
        ${this.ITEMS.filter(it => it.grupo === g).map(it => this._card(it)).join('')}
      </div>`).join('')
    cont.addEventListener('click', e => {
      const card = e.target.closest('.otros-card')
      if (card) Nav.go(card.dataset.goto)
    })
    this.cargarResumen()   // sin await: la rejilla se pinta ya, los números llegan después
  },

  // Rellena los contadores. Cada tarjeta se resuelve por su cuenta: si su dato
  // vino `null` (esa consulta falló) pinta "—" y sigue siendo navegable.
  async cargarResumen() {
    let datos = null
    try { datos = await DB.getResumenOtros() } catch { datos = null }

    this.ITEMS.forEach(it => {
      const d = datos && datos[it.id]
      const n = d && d.n != null ? d.n : null

      const nEl = document.querySelector(`[data-n="${it.id}"]`)
      if (nEl) {
        nEl.textContent = n == null ? '—' : fmtMiles(n)
        nEl.classList.toggle('cargando', n == null)
      }

      const metaEl = document.querySelector(`[data-meta="${it.id}"]`)
      if (metaEl) {
        const txt = d && this.META[it.id] ? this.META[it.id](d) : ''
        metaEl.textContent = txt
        metaEl.classList.toggle('hidden', !txt)
      }
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
    chaumer: 'Chaumer',
    backtesting: 'Backtesting',
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
    chaumer: 'otros', backtesting: 'otros',
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
  //   filtro    → id (o array de ids) de los controles de esa sección en la barra
  //   navMes    → mostrar las flechas ‹ › junto al mes
  // Análisis lleva DOS: el período y el filtro de cuentas. Por eso `filtro` admite
  // array — el orden aquí no manda, manda el orden del DOM en .header-actions.
  HERRAMIENTAS: {
    calendar:   { filtro: 'accountFilterCalendar', navMes: true },
    analysis:   { filtro: ['analysisPeriod', 'accountFilterAnalysis'], navMes: true },
    trades:     { filtro: 'accountFilterTrades' },
    disciplina: { filtro: 'disciplinaPeriod', navMes: true },
    // El período y las flechas solo tienen sentido en la pestaña "Diferencias";
    // en "Día" manda su propio selector de fecha. Chaumer.showTab los muestra
    // y los esconde según la pestaña abierta.
    chaumer:    { filtro: 'chaumerPeriod', navMes: true },
    otros:      { conexion: true },
  },

  // Sección visible ahora mismo. Las flechas de mes de la barra las comparten
  // Calendario y Disciplina, así que cada uno atiende solo cuando le toca.
  actual() { return this._actual },

  _pintaHerramientas(sectionId) {
    const cfg = this.HERRAMIENTAS[sectionId] || {}
    // La barra sabe qué sección muestra: el CSS lo necesita para apretar el
    // espacio en móvil solo donde hace falta (Análisis lleva DOS controles).
    document.querySelector('.top-bar')?.setAttribute('data-seccion', sectionId)
    // Cada filtro tiene su propia selección persistida, así que todos conviven en el
    // DOM y solo se muestran los de la sección activa.
    const visibles = cfg.filtro == null ? [] : [].concat(cfg.filtro)
    document.querySelectorAll('.header-actions .hdr-tool').forEach(el => {
      el.classList.toggle('hidden', !visibles.includes(el.id))
    })
    document.querySelectorAll('.header-info .hdr-nav').forEach(el => {
      el.classList.toggle('hidden', !cfg.navMes)
    })
    // El estado de la conexión solo se muestra en Otros, que es donde vive todo lo
    // que es "sobre la app" y no sobre la operativa. Si falla, el toast del arranque
    // avisa igualmente estés donde estés.
    document.getElementById('connectionStatus')?.classList.toggle('hidden', !cfg.conexion)
  },

  // Un "volver" DENTRO de una sección, sin cambiar de sección: el Calendario lo usa
  // para ir de la vista completa de un calendario a la pantalla de los cuatro.
  // El chevron de la barra es el mismo que el de las subsecciones de Otros; esto
  // solo le da otra acción. `go()` lo limpia al cambiar de sección.
  setVolver(fn) {
    this._volver = fn || null
    document.getElementById('navBack')?.classList.toggle('hidden', !this._volver && !this._padreActual)
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
    this._volver = null
    this._actual = sectionId
    this._pintaContexto(sectionId)
    this._pintaHerramientas(sectionId)

    // Lazy init sections
    if (!this.initialized.has(sectionId)) {
      this.initialized.add(sectionId)
      try {
        if (sectionId === 'calendar') {
          // En paralelo, no en cadena: lo primero que se ve es la pantalla de los
          // cuatro calendarios, y antes esperaba a que terminaran "Mío" y sus
          // métricas, que están ocultos. Calendar.init crea el filtro de cuentas en
          // su parte síncrona, así que ya existe cuando los otros dos lo leen.
          await Promise.all([Calendar.init(), Metrics.init(), Calendarios.init()])
          // El filtro nace en "todas" y fija su selección guardada al final de
          // Calendar.init: si no es "todas", lo pintado antes se repinta con ella.
          if (!AccountFilter.isAll('calendar')) { Metrics.rerender(); Calendarios.alCambiarMes() }
        }
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
        if (sectionId === 'chaumer') await Chaumer.init()
        if (sectionId === 'backtesting') await Backtesting.init()
        if (sectionId === 'otros') Otros.init()
      } catch (err) {
        Toast.show('Error cargando sección: ' + err.message, 'error')
      }
    } else if (sectionId === 'calendar') {
      // El botón Calendario abre siempre la pantalla de los cuatro (diseño §6).
      Calendarios.alEntrar()
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
    } else if (sectionId === 'chaumer') {
      Chaumer.reload()
    } else if (sectionId === 'backtesting') {
      Backtesting.reload()
    } else if (sectionId === 'otros') {
      // Refresca los contadores al volver. El TTL de 5 min de getResumenOtros
      // evita que entrar y salir dispare consultas cada vez.
      Otros.cargarResumen()
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
      if (this._volver) this._volver()
      else if (this._padreActual) this.go(this._padreActual)
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

// ── Modo local de desarrollo ────────────────────────────────────────────────
// Carga `js/dev.local.js` (gitignoreado) para poder abrir la app en localhost
// SIN sesión de Supabase, con datos de prueba. Sirve para verificar pantallas
// sin que nadie tenga que escribir una contraseña.
//
// Dos cierres, no uno: el archivo no está en el repo —así que en producción no
// existe— y además el `hostname` corta la rama antes de intentar cargarlo. En
// kristeb-trader.github.io esto es código muerto.
async function cargarModoLocal() {
  if (!['localhost', '127.0.0.1', '[::1]'].includes(location.hostname)) return null
  try {
    await import(new URL('js/dev.local.js', document.baseURI).href)
    return window.__DEV_LOCAL__ || null
  } catch (_) {
    return null   // no existe → arranque normal, con su login
  }
}

async function boot() {
  // ── Gate de autenticación: sin sesión → solo login, no arranca la app ──
  //
  // El orden importa: la sesión REAL manda siempre. El modo local solo entra si
  // no hay ninguna, así que en cuanto alguien inicia sesión en este navegador
  // los fixtures quedan dormidos y se ven los datos de verdad. Si la sesión
  // caduca, en vez de quedarse bloqueado se cae al modo local.
  //
  // `?login` fuerza la pantalla de login aunque haya modo local disponible —
  // sin esto no habría forma de llegar a ella para iniciar sesión la primera vez.
  let session = null
  let modoLocal = null
  try { session = await DB.getSession() } catch (_) {}

  if (!session) {
    const forzarLogin = new URLSearchParams(location.search).has('login')
    modoLocal = forzarLogin ? null : await cargarModoLocal()
    if (!modoLocal) { showLoginGate(); return }
    session = { user: { email: modoLocal.email } }
    // El valor es la fecha de la copia: la banda de aviso lo lee con attr().
    document.body.dataset.modoLocal = modoLocal.tomadoEl || 'sin fecha'
  }
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

  if (modoLocal) {
    // En modo local no se sondea nada: no hay sesión y la sonda daría 401. El
    // punto se pone en ámbar para que NUNCA se confunda un dato de prueba con
    // uno real — es la única señal en pantalla de que no estás mirando Supabase.
    dot.innerHTML = '<i class="ti ti-circle-filled"></i>'
    dot.classList.remove('connected', 'disconnected')
    dot.classList.add('modo-local')
    dot.title = `Copia local del ${modoLocal.tomadoEl} — no es Supabase en vivo`
    dot.setAttribute('aria-label', dot.title)
    dot._detalle = dot.title
    dot._ok = false
  } else try {
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

  openSettings.addEventListener('click', async () => {
    inputClaudeKey.value = localStorage.getItem('claude_api_key') || ''
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

  document.getElementById('saveSettings').addEventListener('click', async () => {
    const key = inputClaudeKey.value.trim()
    if (key) {
      localStorage.setItem('claude_api_key', key)
    } else {
      localStorage.removeItem('claude_api_key')
    }

    // El Dashboard Secret se retiró el 12/10/2026: el Worker ya valida el login de
    // Supabase. Se limpia el valor viejo para no dejarlo tirado en el localStorage.
    localStorage.removeItem('dashboard_secret')

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
  // Las 3 gráficas del día que se está viendo (la mía, Claude y Chaumer).
  document.getElementById('modalTresGraficas')?.addEventListener('click', () => {
    if (Modal.currentDate) TresGraficas.open(Modal.currentDate)
  })
  // Y desde la pantalla de los 4 calendarios: el último día hábil (hoy, si lo es).
  document.getElementById('hubTresGraficas')?.addEventListener('click', () => {
    const d = new Date(`${hoyISO()}T12:00:00`)
    while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() - 1)
    TresGraficas.open(isoLocal(d))
  })

  // Navigation
  SesionOperativa.init()
  Nav.init()

  // Precargar el catálogo del checklist (claves dinámicas para calendario/charts/métricas)
  // y las etapas de la disciplina: sin ellas, todo cuenta con el criterio viejo.
  await Promise.all([DB.getChecklistItems().catch(() => {}), DB.getEtapas().catch(() => {})])

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

// ── La lupa del día ────────────────────────────────────────────────────────
// El gráfico de un día a pantalla completa, como la lupa de la bitácora del portal (Bitacora.astro),
// pedido por Kris el 26/10: arriba la placa con la fecha, en medio el gráfico con una flecha a cada
// lado para pasar de día (también ← / → y deslizar), y abajo la ficha: una fila por operación con
// setup, resultado, puntos, contratos y P&L. Los días —los que tienen gráfico en ese calendario— y la
// ficha los pone Calendarios.lupa. Esc la cierra y deja la vista del día debajo, como estaba.
const LupaDia = {
  _el: null,
  _dias: [],      // [{ fecha, url }], del más viejo al más nuevo
  _i: 0,
  _ficha: null,   // fecha → Promise<html>
  _token: 0,

  open({ dias, idx, quien, color, ficha }) {
    this._dias = dias
    this._i = Math.max(0, idx)
    this._ficha = ficha
    if (!this._el) this._montar()
    this._el.style.setProperty('--c', color === 'neutro' ? 'var(--text2)' : `var(--${color}-txt)`)
    this._el.querySelector('.ld-quien').textContent = quien
    this._el.classList.remove('hidden')
    document.body.classList.add('modal-open')
    this._pintar()
  },

  close() {
    this._el?.classList.add('hidden')
    // La vista del día sigue abierta debajo: solo se suelta el scroll si no queda nada encima.
    if (document.getElementById('dayModal')?.classList.contains('hidden')) document.body.classList.remove('modal-open')
  },

  _montar() {
    const el = document.createElement('div')
    el.className = 'ld hidden'
    el.setAttribute('role', 'dialog')
    el.setAttribute('aria-modal', 'true')
    el.setAttribute('aria-label', 'Gráfico del día')
    el.innerHTML = `
      <header class="ld-placa ld-arriba">
        <div class="ld-titulo"><span class="ld-quien"></span><h2 class="ld-fecha"></h2></div>
        <div class="ld-der">
          <span class="ld-cuenta"></span>
          <button class="ld-cerrar" type="button" title="Cerrar (Esc)" aria-label="Cerrar"><i class="ti ti-x"></i></button>
        </div>
      </header>
      <div class="ld-marco">
        <button class="ld-paso ld-ant" type="button" title="Día anterior (←)" aria-label="Día anterior"><i class="ti ti-chevron-left"></i></button>
        <img class="ld-img" alt="">
        <button class="ld-paso ld-sig" type="button" title="Día siguiente (→)" aria-label="Día siguiente"><i class="ti ti-chevron-right"></i></button>
      </div>
      <footer class="ld-placa ld-abajo"></footer>`
    document.body.appendChild(el)

    el.addEventListener('click', e => {
      if (e.target === el || e.target.closest('.ld-cerrar')) this.close()
      else if (e.target.closest('.ld-ant')) this._mover(-1)
      else if (e.target.closest('.ld-sig')) this._mover(1)
    })
    // En el celular, deslizar: a la izquierda, el día siguiente.
    let x0 = null, y0 = null
    el.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY }, { passive: true })
    el.addEventListener('touchend', e => {
      if (x0 == null) return
      const dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0
      x0 = null
      if (Math.abs(dx) > 60 && Math.abs(dx) > 1.5 * Math.abs(dy)) this._mover(dx < 0 ? 1 : -1)
    })
    // En captura y cortando: si no, el Esc de la vista del día la cerraría también.
    window.addEventListener('keydown', e => {
      if (el.classList.contains('hidden')) return
      const tecla = { Escape: () => this.close(), ArrowLeft: () => this._mover(-1), ArrowRight: () => this._mover(1) }[e.key]
      if (!tecla) return
      e.stopImmediatePropagation()
      e.preventDefault()
      tecla()
    }, true)
    this._el = el
  },

  _mover(d) {
    const n = this._i + d
    if (n < 0 || n >= this._dias.length) return
    this._i = n
    this._pintar()
  },

  // Las placas entran con un giro corto, como en el portal, y lo repiten al pasar de día.
  _entra(nodo) {
    nodo.classList.remove('entra')
    void nodo.offsetWidth
    nodo.classList.add('entra')
  },

  async _pintar() {
    const el = this._el, dia = this._dias[this._i], token = ++this._token
    const largo = new Date(`${dia.fecha}T12:00:00`).toLocaleDateString('es-CO',
      { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    el.querySelector('.ld-fecha').textContent = largo.charAt(0).toUpperCase() + largo.slice(1)
    el.querySelector('.ld-cuenta').textContent = `${this._i + 1} de ${this._dias.length}`
    el.querySelector('.ld-ant').disabled = this._i === 0
    el.querySelector('.ld-sig').disabled = this._i === this._dias.length - 1
    const img = el.querySelector('.ld-img')
    img.src = dia.url
    img.alt = `Gráfico del ${largo}`
    this._entra(el.querySelector('.ld-arriba'))
    this._entra(img)

    const pie = el.querySelector('.ld-abajo')
    pie.classList.add('cargando')
    let html
    try { html = await this._ficha(dia.fecha) }
    catch (err) { console.warn('[lupa]', err); html = '<div class="ld-vacia">No se pudo leer la operación de este día</div>' }
    if (token !== this._token) return   // ya se pasó a otro día
    pie.innerHTML = html
    pie.classList.remove('cargando')
    this._entra(pie)
  },
}

// ── Las 3 gráficas del día ─────────────────────────────────────────────────
// Pantalla completa con las tres gráficas de un día, en este orden (Kris, 12 oct):
// la mía, la de Claude (el motor) y la de Chaumer.
//   · En horizontal, los DÍAS: ← / →, las flechas a los lados de las gráficas o deslizar.
//   · Clic en una gráfica: se ve sola (modo foco). En vertical, las GRÁFICAS:
//     ↑ / ↓, las flechas ▲ ▼ o deslizar (desde Claude, ↑ la mía y ↓ la de Chaumer).
//     En el foco, ← / → cambian de día sin soltar la gráfica.
//   · Esc vuelve del foco a las tres; otro Esc cierra y deja la vista del día donde estaba.
// La de Claude respeta el candado del motor (D-026): sin el día registrado no se
// pide ni se enseña.
const TresGraficas = {
  _el: null,
  _fecha: null,
  _token: 0,
  _paneles: null,   // los 3 del día pintado: { nombre, color, url, vacio, titulo }
  _foco: null,      // índice de la gráfica que se ve sola; null = las tres

  open(fecha) {
    this._fecha = fecha
    this._foco = null
    if (!this._el) this._montar()
    this._el.classList.remove('hidden')
    document.body.classList.add('modal-open')
    this._pintar()
  },

  close() {
    this._el?.classList.add('hidden')
    // La vista del día sigue abierta debajo: ella decide el scroll del body.
    if (document.getElementById('dayModal')?.classList.contains('hidden')) document.body.classList.remove('modal-open')
  },

  abierta() { return !!this._el && !this._el.classList.contains('hidden') },

  _montar() {
    const el = this._el = document.createElement('div')
    el.className = 'tg hidden'
    el.setAttribute('role', 'dialog')
    el.setAttribute('aria-modal', 'true')
    el.innerHTML = `
      <div class="tg-cab">
        <button type="button" class="btn-icon tg-cerrar" title="Cerrar (Esc)" aria-label="Cerrar"><i class="ti ti-x"></i></button>
        <button type="button" class="btn-icon tg-ant" title="Día anterior (←)" aria-label="Día anterior"><i class="ti ti-chevron-left"></i></button>
        <h3 class="tg-fecha"></h3>
        <button type="button" class="btn-icon tg-sig" title="Día siguiente (→)" aria-label="Día siguiente"><i class="ti ti-chevron-right"></i></button>
      </div>
      <div class="tg-cuerpo"></div>
      <button type="button" class="tg-dia tg-dia-ant" title="Día anterior (←)" aria-label="Día anterior"><i class="ti ti-chevron-left"></i></button>
      <button type="button" class="tg-dia tg-dia-sig" title="Día siguiente (→)" aria-label="Día siguiente"><i class="ti ti-chevron-right"></i></button>`
    document.body.appendChild(el)
    el.querySelector('.tg-cerrar').addEventListener('click', () => this.close())
    el.querySelector('.tg-ant').addEventListener('click', () => this._mover(-1))
    el.querySelector('.tg-sig').addEventListener('click', () => this._mover(1))
    el.querySelector('.tg-dia-ant').addEventListener('click', () => this._mover(-1))
    el.querySelector('.tg-dia-sig').addEventListener('click', () => this._mover(1))
    const cuerpo = el.querySelector('.tg-cuerpo')
    cuerpo.addEventListener('click', e => {
      if (e.target.closest('.tg-arriba')) return this._enfocar(this._foco - 1)
      if (e.target.closest('.tg-abajo'))  return this._enfocar(this._foco + 1)
      if (e.target.closest('.tg-volver')) return this._enfocar(null)
      const panel = e.target.closest('.tg-panel')
      if (panel && this._foco == null && e.target.closest('.tg-img')) this._enfocar(Number(panel.dataset.i))
    })
    // Deslizar en el celular: horizontal = día; vertical, solo en el foco = la otra gráfica
    let toque = null
    cuerpo.addEventListener('touchstart', e => { const t = e.touches[0]; toque = { x: t.clientX, y: t.clientY } }, { passive: true })
    cuerpo.addEventListener('touchend', e => {
      if (!toque) return
      const t = e.changedTouches[0], dx = t.clientX - toque.x, dy = t.clientY - toque.y
      toque = null
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) this._mover(dx < 0 ? 1 : -1)
      else if (this._foco != null && Math.abs(dy) > 60 && Math.abs(dy) > Math.abs(dx) * 1.5) this._enfocar(this._foco + (dy < 0 ? 1 : -1))
    }, { passive: true })
    // En captura y antes que nadie: el Esc de la vista del día la cerraría por debajo.
    window.addEventListener('keydown', e => {
      if (!this.abierta()) return
      const tecla = {
        Escape:     () => this._foco != null ? this._enfocar(null) : this.close(),
        ArrowLeft:  () => this._mover(-1),
        ArrowRight: () => this._mover(1),
        ArrowUp:    () => this._foco != null && this._enfocar(this._foco - 1),
        ArrowDown:  () => this._foco != null && this._enfocar(this._foco + 1),
      }[e.key]
      if (!tecla) return
      e.stopImmediatePropagation()
      e.preventDefault()   // ↑ / ↓ no hacen scroll de la página de debajo
      tecla()
    }, true)
  },

  // i = la gráfica que se ve sola (0 mía · 1 Claude · 2 Chaumer); null = volver a las tres.
  // Sin vuelta: desde la mía no se sube, desde la de Chaumer no se baja.
  _enfocar(i) {
    if (i != null && (i < 0 || i > 2)) return
    this._foco = i
    this._render()
  },

  // Día hábil anterior / siguiente; nunca más allá de hoy.
  _mover(delta) {
    const d = new Date(`${this._fecha}T12:00:00`)
    do { d.setDate(d.getDate() + delta) } while (d.getDay() === 0 || d.getDay() === 6)
    const f = isoLocal(d)
    if (f > hoyISO()) return
    this._fecha = f
    this._pintar()
  },

  async _pintar() {
    const f = this._fecha, tok = ++this._token, el = this._el
    const d = new Date(`${f}T12:00:00`)
    const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
    const MES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
    el.querySelector('.tg-fecha').textContent = `${DIAS[d.getDay()]} ${d.getDate()} ${MES[d.getMonth()]} ${d.getFullYear()} · Las 3 gráficas`
    el.querySelector('.tg-sig').disabled = el.querySelector('.tg-dia-sig').disabled = f >= hoyISO()
    const cuerpo = el.querySelector('.tg-cuerpo')
    cuerpo.classList.remove('foco')
    this._paneles = null   // mientras carga, ↑ / ↓ no repintan el día anterior
    cuerpo.innerHTML = '<div class="tg-cargando"><i class="ti ti-loader-2"></i> Cargando…</div>'

    const [ses, estado, ficha, ch] = await Promise.all([
      DB.getSesionByDate(f).catch(() => null),
      DB.motorEstado(f).catch(() => 'sin_ficha'),
      DB.getFichaMotor(f).catch(() => null),
      DB.getChaumerOperativa(f).catch(() => null),
    ])
    if (tok !== this._token) return   // se cambió de día mientras cargaba

    const paneles = [
      { id: 'mio', nombre: 'Mía', color: 'accent', url: ses?.imagen_url, vacio: 'No subiste gráfico este día' },
      { id: 'claude', nombre: 'Claude', color: 'violet', url: ficha?.grafico_url,
        vacio: estado === 'bloqueada' ? '<i class="ti ti-lock"></i> Registra tu día para ver lo que marcó el motor'
                                       : 'El motor no tiene gráfico de este día' },
      { id: 'chaumer', nombre: 'Chaumer', color: 'blue', url: ch?.imagen_url, vacio: 'Chaumer no tiene gráfico de este día' },
    ]
    // Resultado y setup de cada uno: los mismos adaptadores que los calendarios (Calendarios.resumenDia)
    const resumenes = await Promise.all(paneles.map(p =>
      Calendarios.resumenDia(p.id, f).catch(err => { console.warn('[3 gráficas]', p.id, err); return null })))
    if (tok !== this._token) return
    // El título: tres pastillas en relieve — quién, resultado (con su color) y setup
    paneles.forEach((p, i) => {
      const r = resumenes[i]
      p.titulo = `<span class="tg-chip tg-quien">${p.nombre}</span>`
        + (r ? `<span class="tg-chip tg-res-${r.tono}">${r.res}</span>` : '')
        + (r?.setup ? `<span class="tg-chip tg-setup">${r.setup}</span>` : '')
    })
    this._paneles = paneles
    this._render()
  },

  // Las tres, o solo la del foco con ▲ / ▼ hacia la de arriba y la de abajo.
  _render() {
    const cuerpo = this._el.querySelector('.tg-cuerpo'), P = this._paneles
    if (!P) return
    const panel = (p, i, extra = '') => `
      <section class="tg-panel hc-${p.color}" data-i="${i}">
        <div class="tg-panel-cab">${p.titulo}${extra}</div>
        ${p.url
          ? `<img class="tg-img" alt="Gráfico de ${p.nombre}"${this._foco == null ? ' title="Clic para verla sola"' : ''}>`
          : `<div class="tg-vacio">${p.vacio}</div>`}
      </section>`
    const f = this._foco
    cuerpo.classList.toggle('foco', f != null)
    if (f == null) cuerpo.innerHTML = P.map((p, i) => panel(p, i)).join('')
    else {
      const vert = (cls, icono, j) => P[j]
        ? `<button type="button" class="tg-vert ${cls} hc-${P[j].color}" title="${P[j].nombre} (${cls === 'tg-arriba' ? '↑' : '↓'})">
             <i class="ti ${icono}"></i><span class="hub-dot"></span>${P[j].nombre}</button>`
        : ''
      cuerpo.innerHTML = vert('tg-arriba', 'ti-chevron-up', f - 1)
        + panel(P[f], f, `<button type="button" class="btn-icon tg-volver" title="Volver a las 3 (Esc)" aria-label="Volver a las 3"><i class="ti ti-layout-rows"></i></button>`)
        + vert('tg-abajo', 'ti-chevron-down', f + 1)
    }
    // La URL por propiedad, no en el HTML: viene de la BD.
    cuerpo.querySelectorAll('.tg-panel').forEach(s => {
      const img = s.querySelector('.tg-img')
      if (img) img.src = P[s.dataset.i].url
    })
  },
}

document.addEventListener('DOMContentLoaded', boot)
