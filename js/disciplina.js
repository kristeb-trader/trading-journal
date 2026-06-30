// Dashboard de Disciplina — registro de proceso (checklist por fase, racha,
// errores por tipo y registro de sesiones). Lee de Supabase (sesiones, checklist
// del rulebook, diagnostico_errores, trades). Estilo coherente con la app.
const Disciplina = (() => {
  let trades = [], sesiones = [], casuisticas = [], catalogo = []
  let DISC_FACTORS = []
  let period = 'month'
  let loaded = false, wired = false

  const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
  const DOW = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']
  const esc = s => (s || '').replace(/[&<>"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]))
  const isBE = p => Math.abs(parseFloat(p) || 0) <= 6

  const FASES = {
    1: { label: 'Fase 1 — Pre-sesión',        when: 'antes de que exista cualquier setup', color: '#3FE0A6' },
    2: { label: 'Fase 2 — Lectura del setup', when: 'análisis antes de entrar',            color: '#E0A33B' },
    3: { label: 'Fase 3 — Ejecución',         when: 'el momento de apretar el botón',      color: '#6FA8DC' },
  }
  const TIPO = {
    psicologico: { label: 'Psicológico', cls: 'psych',    emoji: '🧠' },
    analitico:   { label: 'Analítico',   cls: 'analytic', emoji: '📐' },
    operativo:   { label: 'Operativo',   cls: 'op',       emoji: '⚙️' },
    marcado:     { label: 'Marcado',     cls: 'mark',     emoji: '🎯' },
  }

  // ── Helpers de disciplina (alineados con metrics.js) ──────────────────────
  const seConecto = s => !s.no_opero || s.se_conecto !== false
  function setupFamilyOf(s) {
    const v = (s.setup || '').toLowerCase()
    if (v.startsWith('iri')) return 'iri'
    if (v.startsWith('reingreso')) return 'reingreso'
    return null
  }
  // Fase 1 aplica en todo día conectado; Fases 2/3 solo en días operados.
  function factorAplica(f, s) {
    if (!seConecto(s)) return false
    const base = f.fase === 1 ? true : !s.no_opero
    if (!base) return false
    if (f.setup) return setupFamilyOf(s) === f.setup
    return true
  }
  function buildFactors(items) {
    const src = (items && items.length) ? items : DB.checklistClaves().map(c => ({ clave: c, texto: c, fase: 1 }))
    DISC_FACTORS = src.filter(i => i.activo !== false)
      .map(i => ({ key: i.clave, label: i.texto, fase: i.fase || 1, setup: i.setup || null }))
  }

  // ── Período (Mes / Trimestre / Todo) ──────────────────────────────────────
  function calMonthYear() {
    const m = (typeof Calendar !== 'undefined' && Calendar.getMonth) ? Calendar.getMonth() : new Date().getMonth() + 1
    const y = (typeof Calendar !== 'undefined' && Calendar.getYear) ? Calendar.getYear() : new Date().getFullYear()
    return { m, y }
  }
  function range() {
    const { m, y } = calMonthYear()
    if (period === 'all') return { from: '0000-00-00', to: '9999-99-99', label: 'Todo el histórico' }
    if (period === 'quarter') {
      const qStart = Math.floor((m - 1) / 3) * 3 + 1
      const from = `${y}-${String(qStart).padStart(2,'0')}-01`
      const endM = qStart + 2
      const to = `${y}-${String(endM).padStart(2,'0')}-${String(new Date(y, endM, 0).getDate()).padStart(2,'0')}`
      return { from, to, label: `Trimestre · ${MESES[qStart-1]}–${MESES[endM-1]} ${y}` }
    }
    const from = `${y}-${String(m).padStart(2,'0')}-01`
    const to = `${y}-${String(m).padStart(2,'0')}-${String(new Date(y, m, 0).getDate()).padStart(2,'0')}`
    return { from, to, label: `${MESES[m-1]} ${y}` }
  }
  const inR = (d, r) => d >= r.from && d <= r.to

  // ── Cálculo ───────────────────────────────────────────────────────────────
  function compute() {
    const r = range()
    const ses = sesiones.filter(s => s.sesion_date && inR(s.sesion_date, r))
    const cas = casuisticas.filter(c => c.sesion_date && inR(c.sesion_date, r))
    const trd = trades.filter(t => t.trade_date && inR(t.trade_date, r))

    const conectadas = ses.filter(seConecto)
    const operadas   = ses.filter(s => !s.no_opero)

    // Trades por fecha
    const trByDate = {}
    trd.forEach(t => { (trByDate[t.trade_date] = trByDate[t.trade_date] || []).push(t) })

    // Disciplina total — solo cuentan los ítems con valor registrado en la sesión
    // (un ítem sin registrar, p. ej. una regla nueva en días previos, es N/A).
    let dTotal = 0, dOk = 0
    ses.forEach(s => DISC_FACTORS.forEach(f => {
      if (!factorAplica(f, s)) return
      if (s[f.key] === undefined) return
      dTotal++; if (s[f.key]) dOk++
    }))
    const disciplinaPct = dTotal > 0 ? Math.round(dOk / dTotal * 100) : null

    // Cumplimiento por fase (con ítems, días fallidos y cobertura de datos)
    const phases = [1, 2, 3].map(fase => {
      const facs = DISC_FACTORS.filter(f => f.fase === fase)
      const baseDias = fase === 1 ? conectadas : operadas
      const factores = facs.map(f => {
        const aplicables = baseDias.filter(s => factorAplica(f, s))
        const registradas = aplicables.filter(s => s[f.key] !== undefined)
        const fails = registradas.filter(s => !s[f.key]).map(s => s.sesion_date).sort()
        return {
          key: f.key, label: f.label,
          aplica: registradas.length, ok: registradas.length - fails.length, fails,
          cobertura: registradas.length, aplicablesTotal: aplicables.length,
        }
      })
      const total = factores.reduce((a, fc) => a + fc.aplica, 0)
      const ok = factores.reduce((a, fc) => a + fc.ok, 0)
      return { fase, ...FASES[fase], pct: total > 0 ? Math.round(ok / total * 100) : null, factores, total }
    }).filter(p => p.factores.length > 0)

    // Fase más débil (con datos)
    const conPct = phases.filter(p => p.pct != null)
    const faseDebil = conPct.length ? conPct.reduce((a, b) => b.pct < a.pct ? b : a) : null

    // Racha: días operados consecutivos (desde el más reciente) con checklist
    // aplicable 100% completo.
    const opOrd = [...operadas].sort((a, b) => b.sesion_date.localeCompare(a.sesion_date))
    let racha = 0
    for (const s of opOrd) {
      const registrados = DISC_FACTORS.filter(f => factorAplica(f, s) && s[f.key] !== undefined)
      if (registrados.length && registrados.every(f => s[f.key])) racha++
      else break
    }

    // Errores por tipo
    const tipoCount = {}
    cas.forEach(c => {
      const t = c.tipo || 'sintipo'
      tipoCount[t] = (tipoCount[t] || 0) + 1
    })
    const erroresPsico = tipoCount.psicologico || 0

    // Causa raíz: nombres de error más frecuentes
    const nameCount = {}
    cas.forEach(c => {
      const n = c.casuistica || c.descripcion || 'Error'
      if (!nameCount[n]) nameCount[n] = { n, count: 0, tipo: c.tipo || 'sintipo' }
      nameCount[n].count++
    })
    const causaRaiz = Object.values(nameCount).sort((a, b) => b.count - a.count).slice(0, 6)

    // Días limpios (conectados sin error)
    const fechasError = new Set(cas.map(c => c.sesion_date))
    const diasLimpios = conectadas.filter(s => !fechasError.has(s.sesion_date)).length
    const diasLimpiosPct = conectadas.length ? Math.round(diasLimpios / conectadas.length * 100) : null

    // Errores por fecha (para el log)
    const casByDate = {}
    cas.forEach(c => { (casByDate[c.sesion_date] = casByDate[c.sesion_date] || []).push(c) })

    // Registro de sesiones (días con actividad), más reciente primero
    const log = conectadas
      .slice()
      .sort((a, b) => b.sesion_date.localeCompare(a.sesion_date))
      .map(s => buildLogRow(s, trByDate[s.sesion_date] || [], casByDate[s.sesion_date] || []))

    // Historial de racha (últimas 12 sesiones operadas)
    const hist = [...operadas].sort((a, b) => a.sesion_date.localeCompare(b.sesion_date)).slice(-12).map(s => {
      const registrados = DISC_FACTORS.filter(f => factorAplica(f, s) && s[f.key] !== undefined)
      const fails = registrados.filter(f => !s[f.key]).length
      const tieneError = (casByDate[s.sesion_date] || []).length > 0
      if (!registrados.length) return 'empty'
      if (fails === 0 && !tieneError) return 'full'
      if (tieneError || fails > 1) return 'broken'
      return 'partial'
    })

    return {
      r, totalConectadas: conectadas.length, totalOperadas: operadas.length,
      disciplinaPct, dOk, dTotal, phases, faseDebil, racha, hist,
      tipoCount, erroresTotal: cas.length, erroresPsico, causaRaiz,
      diasLimpios, diasLimpiosPct, log,
    }
  }

  function dayTag(dateTrades, sesion) {
    if (sesion?.no_opero) {
      if (sesion.motivo_no_opero === 'Setup válido no tomado' || sesion.setup_valido_no_tomado) return { t: 'No entró', cls: 'noop' }
      if (sesion.motivo_no_opero === 'FOMC') return { t: 'FOMC', cls: 'noop' }
      return { t: 'No operó', cls: 'noop' }
    }
    const nonBE = dateTrades.filter(t => !isBE(t.profit))
    if (!dateTrades.length) return { t: '—', cls: 'noop' }
    if (!nonBE.length) return { t: 'B.E.', cls: 'noop' }
    const tg = nonBE.filter(isWinTrade).length
    const sl = nonBE.filter(isLossTrade).length
    if (tg > 0 && sl === 0) return { t: 'TG', cls: 'tg' }
    if (sl > 0 && tg === 0) return { t: 'SL', cls: 'sl' }
    if (tg > 0 && sl > 0) return { t: 'Mixto', cls: 'mix' }
    const net = nonBE.reduce((a, t) => a + (parseFloat(t.profit) || 0), 0)
    return net >= 0 ? { t: 'TG', cls: 'tg' } : { t: 'SL', cls: 'sl' }
  }

  function buildLogRow(s, dTrades, dCas) {
    const tag = dayTag(dTrades, s)
    const fases = [...new Set(dCas.map(c => c.fase).filter(Boolean))].sort()
    const faseTxt = fases.length ? 'Fase ' + fases.join(', ') : '—'
    let detalle, tipoTxt = '—'
    if (dCas.length) {
      detalle = dCas.map(c => esc(c.casuistica || c.descripcion || 'Error')).join(' · ')
      const tipos = [...new Set(dCas.map(c => c.tipo).filter(Boolean))]
      tipoTxt = tipos.map(t => (TIPO[t]?.label) || t).join(', ')
    } else {
      detalle = '<span class="dd-ok-pill">✓ Sesión limpia · sin errores</span>'
    }
    return { date: s.sesion_date, tag, faseTxt, detalle, tipoTxt, dCas }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  function fmtDateShort(d) {
    const [, m, day] = d.split('-')
    return `${parseInt(day)} ${MESES[parseInt(m)-1].slice(0,3).toLowerCase()}`
  }
  function statValueClass(pct, goodHigh = true) {
    if (pct == null) return ''
    const good = goodHigh ? pct >= 80 : pct <= 20
    const bad = goodHigh ? pct < 55 : pct > 50
    return good ? 'pos' : bad ? 'neg' : ''
  }

  function render() {
    const cont = document.getElementById('disciplinaContent')
    if (!cont) return
    if (!DISC_FACTORS.length) {
      cont.innerHTML = '<p class="dd-empty">No hay ítems de checklist configurados. Defínelos en Reglas y Estrategia.</p>'
      return
    }
    const d = compute()

    if (d.totalConectadas === 0) {
      cont.innerHTML = `<p class="dd-empty">Sin días con actividad en el período (${esc(d.r.label)}).</p>`
      return
    }

    // ── Stat strip ──
    const stats = [
      { label: 'Racha de disciplina', value: `${d.racha}<span class="dd-unit">d</span>`, sub: 'días operados con checklist 100%' },
      { label: 'Disciplina total', value: d.disciplinaPct == null ? '—' : `${d.disciplinaPct}%`, sub: `${d.dOk}/${d.dTotal} ítems aplicables`, cls: statValueClass(d.disciplinaPct) },
      { label: 'Fase más débil', value: d.faseDebil ? `${d.faseDebil.pct}%` : '—', sub: d.faseDebil ? d.faseDebil.label.replace('—','·') : 'sin datos', cls: d.faseDebil ? statValueClass(d.faseDebil.pct) : '' },
      { label: 'Errores', value: `${d.erroresTotal}`, sub: `${d.erroresPsico} psicológicos · ${d.totalConectadas} sesiones`, cls: d.erroresTotal === 0 ? 'pos' : d.erroresPsico > 0 ? 'neg' : '' },
      { label: 'Días limpios', value: d.diasLimpiosPct == null ? '—' : `${d.diasLimpiosPct}%`, sub: `${d.diasLimpios}/${d.totalConectadas} sin errores`, cls: statValueClass(d.diasLimpiosPct) },
    ]
    const stripHtml = stats.map(s => `
      <div class="dd-stat">
        <div class="dd-stat-label">${s.label}</div>
        <div class="dd-stat-value ${s.cls || ''}">${s.value}</div>
        <div class="dd-stat-sub">${s.sub}</div>
      </div>`).join('')

    // ── Phase board ──
    const phaseHtml = d.phases.map(p => {
      const col = p.pct == null ? p.color : p.pct >= 85 ? '#3FE0A6' : p.pct >= 60 ? '#E0A33B' : '#E24B4A'
      const rows = p.factores.map(fc => {
        const noData = fc.cobertura === 0
        const ok = !noData && fc.fails.length === 0
        const dotCls = noData ? 'na' : ok ? 'ok' : 'fail'
        const cov = (!noData && fc.aplicablesTotal > fc.cobertura)
          ? `<span class="dd-cov" title="Sesiones con dato registrado / sesiones aplicables">datos ${fc.cobertura}/${fc.aplicablesTotal}</span>`
          : ''
        const rate = noData ? `<span class="dd-nodata">sin datos</span>` : `${fc.ok}/${fc.aplica}`
        return `
          <div class="dd-check-row">
            <span class="dd-dot ${dotCls}"></span>
            <span class="dd-check-label">${esc(fc.label)}${cov ? ' ' + cov : ''}</span>
            <span class="dd-check-rate">${rate}</span>
          </div>`
      }).join('')
      return `
        <div class="dd-phase">
          <div class="dd-phase-head">
            <div>
              <div class="dd-phase-name" style="color:${p.color}">${p.label}</div>
              <div class="dd-phase-when">${p.when}</div>
            </div>
            <div class="dd-phase-score" style="color:${col}">${p.pct == null ? '—' : p.pct + '%'}</div>
          </div>
          <div class="dd-phase-list">${rows}</div>
        </div>`
    }).join('')

    // ── Streak banner ──
    const histHtml = d.hist.map(h => `<div class="dd-hist-cell ${h}"></div>`).join('')
    const streakMsg = d.racha > 0
      ? `Llevas <b>${d.racha}</b> día${d.racha !== 1 ? 's' : ''} operado${d.racha !== 1 ? 's' : ''} cumpliendo el checklist al 100%. Mantener el proceso es el objetivo principal — por encima del P&L.`
      : `El último día operado tuvo algún ítem del checklist sin cumplir. Recupera la racha respetando el proceso completo.`
    const streakHtml = `
      <div class="dd-streak">
        <div class="dd-streak-left">
          <div class="dd-streak-num">${d.racha}</div>
          <div>
            <div class="dd-streak-label">Racha actual</div>
            <div class="dd-streak-main">${streakMsg}</div>
          </div>
        </div>
        ${d.hist.length ? `<div class="dd-streak-hist" title="Últimas ${d.hist.length} sesiones operadas — verde: checklist 100%, ámbar: incumplimiento menor, rojo: error o varios incumplimientos">${histHtml}</div>` : ''}
      </div>`

    // ── Errores por tipo + causa raíz ──
    const tipoOrder = ['psicologico', 'analitico', 'operativo', 'marcado']
    const maxTipo = Math.max(1, ...tipoOrder.map(t => d.tipoCount[t] || 0))
    const barsHtml = tipoOrder.filter(t => (d.tipoCount[t] || 0) > 0).map(t => {
      const n = d.tipoCount[t] || 0
      const info = TIPO[t]
      return `
        <div class="dd-bar-row">
          <div class="dd-bar-top"><span>${info.emoji} ${info.label}</span><b>${n}</b></div>
          <div class="dd-bar-track"><div class="dd-bar-fill ${info.cls}" style="width:${Math.round(n / maxTipo * 100)}%"></div></div>
        </div>`
    }).join('') || '<p class="dd-soft">Sin errores registrados en el período.</p>'

    const causaHtml = d.causaRaiz.length ? d.causaRaiz.map(c => {
      const info = TIPO[c.tipo] || { label: '—', cls: 'op' }
      return `
        <div class="dd-cause-row">
          <span class="dd-cause-name"><span class="dd-tag ${info.cls}">${info.label.slice(0,5)}</span>${esc(c.n)}</span>
          <span class="dd-cause-count">${c.count}</span>
        </div>`
    }).join('') : '<p class="dd-soft">Sin causas registradas.</p>'

    // ── Registro de sesiones ──
    const logHtml = d.log.map(row => {
      const dow = DOW[new Date(row.date + 'T12:00:00').getDay()]
      return `
        <tr data-date="${row.date}">
          <td class="dd-td-date">${dow} ${fmtDateShort(row.date)}</td>
          <td><span class="dd-res ${row.tag.cls}">${row.tag.t}</span></td>
          <td>${row.faseTxt}</td>
          <td class="dd-td-detail">${row.detalle}</td>
          <td>${row.tipoTxt === '—' ? '—' : row.tipoTxt.split(', ').map(tp => `<span class="dd-type-txt">${tp}</span>`).join(' ')}</td>
        </tr>`
    }).join('')

    cont.innerHTML = `
      <div class="dd-strip">${stripHtml}</div>

      <div class="dd-sec-head"><span class="dd-sec-num">01</span><span class="dd-sec-title">Checklist por fase del proceso</span><div class="dd-sec-line"></div></div>
      <div class="dd-phase-board">${phaseHtml}</div>
      ${streakHtml}

      <div class="dd-sec-head"><span class="dd-sec-num">02</span><span class="dd-sec-title">Errores por tipo y causa raíz</span><div class="dd-sec-line"></div></div>
      <div class="dd-error-grid">
        <div class="dd-panel"><div class="dd-panel-title">Distribución por tipo (${d.totalConectadas} sesiones)</div>${barsHtml}</div>
        <div class="dd-panel"><div class="dd-panel-title">Causa raíz más frecuente</div><div class="dd-cause-list">${causaHtml}</div></div>
      </div>

      <div class="dd-sec-head"><span class="dd-sec-num">03</span><span class="dd-sec-title">Registro de sesiones</span><div class="dd-sec-line"></div></div>
      <div class="dd-panel dd-panel-table">
        <table class="dd-log">
          <thead><tr><th>Fecha</th><th>Resultado</th><th>Fase</th><th>Detalle</th><th>Tipo</th></tr></thead>
          <tbody>${logHtml}</tbody>
        </table>
      </div>`

    cont.querySelectorAll('.dd-log tr[data-date]').forEach(tr => {
      tr.addEventListener('click', () => openDay(tr.dataset.date))
    })
  }

  async function openDay(date) {
    try {
      const [t, s] = await Promise.all([DB.getTradesByDate(date), DB.getSesionByDate(date)])
      if (typeof Modal !== 'undefined' && Modal.openDay) await Modal.openDay(date, t, s)
    } catch (e) { Toast.show('No se pudo abrir el día: ' + e.message, 'error') }
  }

  function renderPeriodPills() {
    const el = document.getElementById('disciplinaPeriod')
    if (!el) return
    const opt = (k, l) => `<button class="dd-period ${period === k ? 'on' : ''}" data-period="${k}">${l}</button>`
    el.innerHTML = opt('month', 'Mes') + opt('quarter', 'Trimestre') + opt('all', 'Todo')
  }

  function refreshTitle() {
    const el = document.getElementById('disciplinaHeroSub')
    if (el) el.textContent = range().label
  }

  async function load() {
    const cont = document.getElementById('disciplinaContent')
    try {
      const [t, s, c, cat, items] = await Promise.all([
        DB.getTrades(),
        DB.getSesiones(),
        DB.getAllCasuisticas(),
        DB.getCatalogoCasuisticas().catch(() => []),
        DB.getChecklistItems({ soloActivos: true }).catch(() => null),
      ])
      trades = t || []; sesiones = s || []; casuisticas = c || []; catalogo = cat || []
      buildFactors(items)
      loaded = true
    } catch (e) {
      if (cont) cont.innerHTML = `<p class="coach-error">Error al cargar disciplina: ${esc(e.message)}</p>`
      return
    }
    renderPeriodPills(); refreshTitle(); render()
  }

  function wire() {
    document.getElementById('disciplinaPeriod')?.addEventListener('click', e => {
      const b = e.target.closest('[data-period]'); if (!b) return
      period = b.dataset.period
      renderPeriodPills(); refreshTitle(); render()
    })
  }

  async function init() {
    if (!wired) { wire(); wired = true }
    // Por defecto, el mes que se ve en el calendario.
    if (!loaded) period = 'month'
    await load()
  }

  // Al volver a la sección: refrescar datos y reflejar el mes actual del calendario
  async function reload() { await load() }

  return { init, reload }
})()
