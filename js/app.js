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

    // Datos extra: diagnóstico del Coach + errores + emociones + checklist dinámico
    // (catalogo_reglas) + total de trades del día SIN filtro de cuenta (para avisar
    // cuando el filtro está ocultando trades).
    const [diag, casuisticas, emociones, chkItems, allDayTrades] = await Promise.all([
      dateStr ? DB.getDiagnosticoByDate(dateStr) : null,
      dateStr ? DB.getCasuisticasByDate(dateStr) : [],
      DB.getCatalogoEmociones().catch(() => []),
      DB.getChecklistItems({ soloActivos: true }).catch(() => []),
      dateStr ? DB.getTradesByDate(dateStr).catch(() => []) : [],
    ])
    const ctx = { dateStr, trades, sesion, diag, casuisticas, emociones, chkItems, allDayTrades }

    document.getElementById('modalResumen').innerHTML   = this._renderResumen(ctx)
    document.getElementById('modalOperativa').innerHTML = this._renderOperativa(ctx)
    document.getElementById('modalGrafica').innerHTML   = this._renderGrafica(ctx)

    // Footer: Editar vs Registrar según exista la sesión
    const editBtn = document.getElementById('editSessionBtn')
    if (editBtn) editBtn.innerHTML = sesion
      ? '<i class="ti ti-eye"></i> Ver sesión'
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

  // Checklist aplicable al día (mismo criterio que discFactorAplica en db.js):
  // Fase 1 en días conectados; Fases 2/3 solo si operó; ítems por setup solo si
  // el setup del día es de esa familia. Solo ítems con valor registrado.
  _checklistDia(chkItems, sesion) {
    if (!sesion) return []
    const conectado = !sesion.no_opero || sesion.se_conecto !== false
    if (!conectado) return []
    const v = (sesion.setup || '').toLowerCase()
    const fam = v.startsWith('iri') ? 'iri' : v.startsWith('reingreso') ? 'reingreso' : null
    return (chkItems || []).filter(i => {
      if ((i.fase || 1) !== 1 && sesion.no_opero) return false
      if (i.setup && i.setup !== fam) return false
      const val = sesion.checklist?.[i.clave] ?? sesion[i.clave]
      if (val === undefined) return false
      return true
    }).map(i => ({ ...i, ok: !!(sesion.checklist?.[i.clave] ?? sesion[i.clave]) }))
  },

  // Pestaña 1 — Resumen: el día en 5 segundos (hero + proceso + errores + siguiente paso)
  _renderResumen({ trades, sesion, diag, casuisticas, emociones, chkItems }) {
    if (!sesion && !diag && !trades.length) {
      return '<div class="modal-no-trade"><i class="ti ti-calendar-off"></i><p>Sin registro para este día</p></div>'
    }

    const st = this._dayState(trades, sesion)
    const pnl = trades.reduce((s, t) => s + (parseFloat(t.profit) || 0), 0)
    const emoIni = emociones.find(e => e.id === sesion?.estado_emocional_id)
    const emoFin = emociones.find(e => e.id === diag?.estado_emocional_fin_id)
    const conf = sesion?.nivel_confianza

    // ── Hero: P&L grande (o el estado del día) + badge + setup ──
    const heroMain = trades.length
      ? `<div class="md2-pnl ${pnl >= 0 ? 'pos' : 'neg'}">${pnl >= 0 ? '+' : '−'}$${Math.abs(pnl).toFixed(2)}</div>`
      : `<div class="md2-pnl none">${st.icon}</div>`
    const setupChip = sesion?.setup ? `<span class="md2-setup">${sesion.setup}</span>` : ''
    const meta = []
    if (trades.length) meta.push(`${trades.length} trade${trades.length !== 1 ? 's' : ''}`)
    if (emoIni) meta.push(`${emoIni.emoji}${emoFin ? ` → ${emoFin.emoji}` : ''} ${emoIni.nombre}${emoFin ? ` → ${emoFin.nombre}` : ''}`)
    if (conf) meta.push(`<span class="md2-stars" title="Confianza ${conf}/5">${'★'.repeat(conf)}${'☆'.repeat(5 - conf)}</span>`)
    const hero = `
      <div class="md2-hero ${st.cls}">
        <div class="md2-hero-l">
          ${heroMain}
          ${meta.length ? `<div class="md2-meta">${meta.join('<span class="md2-dot">·</span>')}</div>` : ''}
        </div>
        <div class="md2-hero-r">
          <span class="md2-badge ${st.cls}">${st.icon} ${st.label}</span>
          ${setupChip}
        </div>
      </div>`

    const setupObs = sesion?.setup_valido_no_tomado && sesion.setup_observado
      ? `<div class="mr-setupobs"><i class="ti ti-eye"></i> Setup observado: <b>${sesion.setup_observado}</b>${sesion.motivo_no_entrada ? ` · no entré por <b>${sesion.motivo_no_entrada}</b>` : ''}</div>`
      : ''

    // ── Proceso: UNA barra con el checklist real del día; solo se listan los ✗ ──
    const items = this._checklistDia(chkItems, sesion)
    let procesoHtml = ''
    if (items.length) {
      const ok = items.filter(i => i.ok).length
      const pct = Math.round(ok / items.length * 100)
      const cls = pct === 100 ? 'ok' : pct >= 70 ? 'warn' : 'bad'
      const fails = items.filter(i => !i.ok)
      const failsHtml = fails.slice(0, 4).map(i => `<div class="md2-fail">✗ ${i.texto}</div>`).join('')
        + (fails.length > 4 ? `<div class="md2-fail more">+${fails.length - 4} más</div>` : '')
      procesoHtml = `
        <div class="md2-block">
          <div class="md2-block-head"><span class="md2-block-title">Proceso</span><span class="md2-proc-n ${cls}">${ok}/${items.length} · ${pct}%</span></div>
          <div class="md2-proc-track"><div class="md2-proc-fill ${cls}" style="width:${pct}%"></div></div>
          ${failsHtml}
        </div>`
    }

    // ── Errores: chips solo si hay (el detalle vive en la pestaña Gráfica) ──
    const errHtml = casuisticas.length ? `
      <div class="md2-block">
        <div class="md2-block-head"><span class="md2-block-title">⚠️ Errores</span><span class="md2-proc-n bad">${casuisticas.length}</span></div>
        <div class="md2-errs">${casuisticas.map(c => {
          const emo = this._TIPO_EMO[c.tipo] || '•'
          const res = (c.resultado === 'T' || c.resultado === 'S') ? ` <b class="${c.resultado === 'T' ? 'res-t' : 'res-s'}">${c.resultado}</b>` : ''
          return `<span class="mr-chip err">${emo} ${c.casuistica}${res}</span>`
        }).join('')}</div>
      </div>`
      : (sesion || diag ? '<div class="md2-clean">✅ Día sin errores registrados</div>' : '')

    // ── Siguiente paso: UNA recomendación (IA > manual > aprendizaje) ──
    let rec = null
    for (const c of casuisticas) {
      if (c.recomendacion_ia) { rec = { txt: c.recomendacion_ia, tag: c.recomendacion?.nombre } ; break }
      if (c.recomendacion_manual && !rec) rec = { txt: c.recomendacion_manual, tag: '✍️ Nota propia' }
    }
    if (!rec && diag?.sec_aprendizaje) rec = { txt: this._truncate(this._mdStrip(diag.sec_aprendizaje), 200), tag: 'Aprendizaje' }
    const recHtml = rec ? `
      <div class="md2-block md2-next">
        <div class="md2-block-head"><span class="md2-block-title">💡 Siguiente paso</span>${rec.tag ? `<span class="md2-rec-tag">${rec.tag}</span>` : ''}</div>
        <p class="md2-rec-txt">${rec.txt}</p>
      </div>` : ''

    const verBtn = diag
      ? `<div class="mr-actions"><button class="btn-primary btn-sm" id="modalVerCompleto"><i class="ti ti-file-search"></i> Ver diagnóstico completo</button></div>`
      : ''

    return hero + setupObs + procesoHtml + errHtml + recHtml + verBtn
  },

  // Pestaña 2 — Operativa (tabla de trades estilo Coach + campos + checklist por fases)
  _renderOperativa({ trades, sesion, chkItems, allDayTrades }) {
    const pnl = trades.reduce((s, t) => s + (parseFloat(t.profit) || 0), 0)
    const targets = trades.filter(isWinTrade).length
    const stops = trades.filter(isLossTrade).length

    // Verificación automática: trades dentro de la ventana ±5 min de la noticia roja
    const enVentana = tradesEnVentanaNoticia(trades, sesion)
    const enVentanaSet = new Set(enVentana.map(t => t.id))
    const noticiaWarn = enVentana.length
      ? `<div class="modal-noticia-warn"><i class="ti ti-alert-triangle"></i> Operaste dentro de la ventana de la noticia roja (${sesion.hora_noticia_roja} ±5 min): ${enVentana.length} trade${enVentana.length !== 1 ? 's' : ''}.</div>`
      : ''

    let tradesHtml
    if (!trades.length) {
      // Estados vacíos inteligentes: distinguir filtro de cuenta / sin export / no operó
      const ocultos = (allDayTrades || []).length
      if (ocultos > 0) {
        tradesHtml = `<div class="modal-no-trade"><i class="ti ti-filter"></i><p>Hay ${ocultos} trade${ocultos !== 1 ? 's' : ''} de otras cuentas este día</p><p class="text-dim">Cambia el filtro de cuenta del calendario para verlos</p></div>`
      } else if (sesion?.no_opero) {
        tradesHtml = `<div class="modal-no-trade"><i class="ti ti-coffee"></i><p>Sin operación este día</p><p class="text-dim">${sesion.motivo_no_opero || ''}</p></div>`
      } else if (sesion) {
        tradesHtml = `<div class="modal-no-trade"><i class="ti ti-plug-x"></i><p>Sesión operada, pero sin trades exportados</p><p class="text-dim">Revisa que el indicador de NinjaTrader haya exportado el trade</p></div>`
      } else {
        tradesHtml = '<div class="modal-no-trade"><i class="ti ti-chart-off"></i><p>Sin trades registrados</p></div>'
      }
    } else {
      // Tabla estilo Coach: hora · dirección · entrada→salida · puntos · resultado · P&L
      const rows = trades.map(t => {
        const dir = /short|sell/i.test(t.market_pos || '') ? 'SHORT' : 'LONG'
        const e = parseFloat(t.entry_price), x = parseFloat(t.exit_price)
        const hasPx = isFinite(e) && isFinite(x)
        const pts = hasPx ? (dir === 'SHORT' ? e - x : x - e) : null
        const be = Math.abs(parseFloat(t.profit) || 0) <= 6
        const res = be ? 'B.E.' : t.resultado === 'target' ? 'TARGET' : t.resultado === 'stop' ? 'STOP' : (parseFloat(t.profit) > 0 ? 'TARGET' : 'STOP')
        const rescls = be ? 'r-o' : res === 'TARGET' ? 'r-t' : 'r-s'
        const p = parseFloat(t.profit) || 0
        const flag = enVentanaSet.has(t.id) ? '<span title="Entró en la ventana de la noticia roja">🚫 </span>' : ''
        return `<tr${enVentanaSet.has(t.id) ? ' class="trade-en-ventana"' : ''}>
          <td>${flag}${[t.entry_time, t.exit_time].filter(Boolean).map(h => (h || '').slice(0, 5)).join(' → ') || '—'}</td>
          <td>${dir === 'LONG' ? '▲' : '▼'} ${dir}</td>
          <td>${hasPx ? `${e} → ${x}` : '—'}</td>
          <td class="${pts != null && pts < 0 ? 'neg' : 'pos'}">${pts != null ? (pts >= 0 ? '+' : '') + pts.toFixed(2) : '—'}</td>
          <td><span class="cz-rb ${rescls}">${res}</span></td>
          <td class="${p < 0 ? 'neg' : 'pos'}">${p >= 0 ? '+' : '−'}$${Math.abs(p).toFixed(2)}</td>
        </tr>`
      }).join('')
      tradesHtml = `
        <div class="modal-summary-bar">
          <div class="ms-stat"><span>${trades.length}</span><small>Trades</small></div>
          <div class="ms-stat green"><span>${targets}</span><small>Targets</small></div>
          <div class="ms-stat red"><span>${stops}</span><small>Stops</small></div>
          <div class="ms-stat ${pnl >= 0 ? 'green' : 'red'}"><span>${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}</span><small>P&L</small></div>
        </div>
        <div class="cz-optable-wrap"><table class="cz-optable"><thead><tr>
          <th>Hora</th><th>Dir</th><th>Entrada → Salida</th><th>Puntos</th><th>Resultado</th><th>P&amp;L</th>
        </tr></thead><tbody>${rows}</tbody></table></div>`
    }

    const campos = []
    if (sesion?.contexto) campos.push(['Contexto', sesion.contexto])
    if (sesion?.num_corrida) campos.push(['Corrida', `${sesion.num_corrida}ª`])
    if (sesion?.velas_corrida) campos.push(['Velas', sesion.velas_corrida])
    // Retroceso: primero el registrado en la sesión (dato del trader); el derivado
    // |P&L/2| solo como fallback (no cuadra cuando qty ≠ 2 contratos MNQ).
    if (sesion?.puntos_retroceso) campos.push(['Retroceso', `${sesion.puntos_retroceso} pts`])
    else if (trades.length) campos.push(['Retroceso', `≈${Math.abs(pnl / 2).toFixed(2)} pts`])
    if (sesion?.setup) campos.push(['Setup', sesion.setup])
    if (sesion?.hora_noticia_roja) campos.push(['Noticia roja', sesion.hora_noticia_roja.slice(0, 5)])
    const camposHtml = campos.length
      ? `<div class="modal-fields">${campos.map(([l, v]) => `<div class="mf-item"><label>${l}</label><span>${v}</span></div>`).join('')}</div>`
      : ''

    // Checklist por fases (dinámico desde catalogo_reglas; solo ítems aplicables al día)
    const items = this._checklistDia(chkItems, sesion)
    let chkHtml = ''
    if (items.length) {
      const FASES = { 1: 'Fase 1 · Pre-sesión', 2: 'Fase 2 · Lectura del setup', 3: 'Fase 3 · Ejecución' }
      const ok = items.filter(i => i.ok).length
      let groups = ''
      ;[1, 2, 3].forEach(f => {
        const ofF = items.filter(i => (i.fase || 1) === f)
        if (!ofF.length) return
        groups += `<div class="cz-dgroup"><div class="cz-dgt">${FASES[f]}</div>` +
          ofF.map(i => `<div class="cz-chk ${i.ok ? 'ok' : 'no'}"><span class="cz-cic">${i.ok ? '✓' : '✗'}</span><span>${i.texto}</span></div>`).join('') +
          `</div>`
      })
      chkHtml = `
        <div class="modal-section-title" style="margin-top:16px"><i class="ti ti-checklist"></i> Checklist Reglas (${ok}/${items.length})</div>
        ${groups}`
    }

    return noticiaWarn + tradesHtml + camposHtml + chkHtml
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
    register: 'Sesión',
    analysis: 'Análisis',
    disciplina: 'Disciplina',
    experimentos: 'Experimentos',
    apex: 'Apex Tracker',
    historial: 'Historial',
    estrategia: 'Estrategia',
    data: 'Datos',
    fechas: 'Fechas Especiales',
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
        if (sectionId === 'register') { SessionForm.init(); SessionForm.onShow() }
        if (sectionId === 'gallery') await Gallery.init()
        if (sectionId === 'analysis') await Charts.init()
        if (sectionId === 'disciplina') await Disciplina.init()
        if (sectionId === 'experimentos') await Experimentos.init()
        if (sectionId === 'apex') await Apex.init()
        if (sectionId === 'coach') await Coach.init()
        if (sectionId === 'estrategia') await Estrategia.init()
        if (sectionId === 'historial') await Coach.renderHistorial()
        if (sectionId === 'data') await DataManager.init()
        if (sectionId === 'fechas') await Fechas.init()
      } catch (err) {
        Toast.show('Error cargando sección: ' + err.message, 'error')
      }
    } else if (sectionId === 'coach') {
      Coach.refresh()
    } else if (sectionId === 'historial') {
      Coach.renderHistorial()
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
  document.getElementById('logoutBtn')?.addEventListener('click', async () => {
    await DB.signOut(); location.reload()
  })

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
