// Dashboard de Disciplina — registro de proceso (checklist por fase, racha,
// errores por tipo y registro de sesiones). Lee de Supabase (sesiones, checklist
// del rulebook, diagnostico_errores, trades). Estilo coherente con la app.
const Disciplina = (() => {
  let trades = [], sesiones = [], casuisticas = [], catalogo = []
  let fechasEsp = [], stopMax = 80   // contexto de disciplina (regla FOMC, stop máx)
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

  // ── Helpers de disciplina ─────────────────────────────────────────────────
  // El criterio vive en db.js (fuente única compartida con calendario y análisis).
  // `ctx` se reconstruye en cada compute() con los datos COMPLETOS (sin filtrar).
  const seConecto = s => !s.no_opero || s.se_conecto !== false
  let ctx = {}
  const factorAplica = (f, s) => discFactorAplica(f, s, ctx)
  // ¿La regla se cumplió de verdad? Si es automática la resuelve el dato; si es
  // declarada vale la casilla, salvo que un error la contradiga. `null` = no
  // evaluable (no cuenta ni a favor ni en contra).
  function cumple(s, key, f) {
    if (f && f.evidencia === 'auto') return reglaAutoResultado(key, s, ctx)
    return reglaCumplida(s, key, ctx.rotas)
  }
  // ¿El ítem tiene con qué evaluarse ese día?
  function evaluable(s, f) {
    if (f.evidencia === 'auto') return reglaAutoResultado(f.key, s, ctx) !== null
    return s[f.key] !== undefined
  }
  function buildFactors(items) {
    const src = (items && items.length) ? items : DB.checklistClaves().map(c => ({ clave: c, texto: c, fase: 1 }))
    DISC_FACTORS = src.filter(i => i.activo !== false)
      .map(i => ({ key: i.clave, label: i.texto, enunciado: i.enunciado || '',
                   fase: i.fase || 1, setup: i.setup || null, bloqueaGo: i.bloquea_go !== false,
                   evidencia: i.evidencia || 'declarada', aplica_si: i.aplica_si || 'siempre' }))
  }

  // ── Por qué falló una regla un día concreto ───────────────────────────────
  // Tres motivos distintos que el tablero mostraba idénticos: la casilla sin
  // marcar, la casilla marcada que un error del diagnóstico desmiente (regla de
  // oro nº 4) y la regla `auto` que resolvió el dato en contra.
  const MOTIVOS = {
    sin_marcar: { badge: '🔲 Sin marcar',       cls: 'plain' },
    roto:       { badge: '⚠️ Desmentida',       cls: 'broken' },
    auto:       { badge: '⚙ Verificado por dato', cls: 'auto' },
  }
  function evidenciaAuto(f, s) {
    const trs = (ctx.tradesPorDia && ctx.tradesPorDia.get(s.sesion_date)) || []
    if (f.key === 'stop_max_puntos') {
      const pts = trs.map(maeEnPuntos).filter(p => p != null)
      if (!pts.length) return 'Verificado por dato.'
      return `El peor movimiento en contra fue de <b>${Math.max(...pts).toFixed(1)} pts</b>, por encima del stop máximo de ${ctx.stopMaxPuntos} pts.`
    }
    if (f.key === 'chk_noticias') {
      const en = tradesEnVentanaNoticia(trs, s)
      if (!en.length) return 'Verificado por dato.'
      return `${en.length} entrada${en.length !== 1 ? 's' : ''} dentro de la ventana ±5 min de la noticia roja de las <b>${esc(String(s.hora_noticia_roja).slice(0,5))}</b>.`
    }
    if (f.key === 'fomc_solo_reingreso') {
      return `Día FOMC operado con <b>${esc(s.setup || 'setup sin declarar')}</b>. En día FOMC solo se permiten reingresos.`
    }
    return 'El dato del día resolvió la regla en contra.'
  }
  function motivoFallo(f, s, dCas) {
    if (f.evidencia === 'auto') return { tipo: 'auto', texto: evidenciaAuto(f, s), errores: [] }
    if (!s[f.key]) return { tipo: 'sin_marcar', texto: 'La casilla quedó sin marcar: incumplimiento declarado por ti.', errores: [] }
    return {
      tipo: 'roto',
      texto: 'Marcaste la casilla como cumplida, pero el diagnóstico del día registró un error que contradice esta regla.',
      errores: (dCas || []).filter(c => c.regla_codigo === f.key),
    }
  }

  // ── Período (Mes / Trimestre / Todo) + navegación de mes ──────────────────
  let navY = null, navM = null   // mes/año que muestra el dashboard
  function ensureNav() {
    if (navM != null) return
    navM = (typeof Calendar !== 'undefined' && Calendar.getMonth) ? Calendar.getMonth() : new Date().getMonth() + 1
    navY = (typeof Calendar !== 'undefined' && Calendar.getYear) ? Calendar.getYear() : new Date().getFullYear()
  }
  function navMonth(delta) {
    ensureNav()
    navM += delta
    if (navM > 12) { navM = 1; navY++ }
    if (navM < 1) { navM = 12; navY-- }
    updateMonthNav(); refreshTitle(); render()
  }
  function range() {
    ensureNav()
    const m = navM, y = navY
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
    // Sábados y domingos quedan fuera de toda estadística (no se opera en fin de
    // semana; pueden existir filas creadas por el AddOn de NT8).
    const ses = sesiones.filter(s => s.sesion_date && inR(s.sesion_date, r) && esDiaHabil(s.sesion_date))
    const cas = casuisticas.filter(c => c.sesion_date && inR(c.sesion_date, r) && esDiaHabil(c.sesion_date))
    const trd = trades.filter(t => t.trade_date && inR(t.trade_date, r) && esDiaHabil(t.trade_date))

    // Índices por día: se construyen con TODO el histórico (no con el rango ni con
    // el filtro de cuenta) — son "qué pasó ese día", no métricas del período.
    ctx = discContexto({ trades, errores: casuisticas, fechasEsp, stopMaxPuntos: stopMax })
    const conectadas = ses.filter(seConecto)
    // "Operadas" = con operativa real (trades o setup declarado). `no_opero=false` no
    // basta: es el default de la columna y una sesión creada al abrir NT8 nace así.
    const operadas   = ses.filter(s => sesionOpero(s, ctx.conTrades))

    // Trades y errores por fecha
    const trByDate = {}
    trd.forEach(t => { (trByDate[t.trade_date] = trByDate[t.trade_date] || []).push(t) })
    const casByDate = {}
    cas.forEach(c => { (casByDate[c.sesion_date] = casByDate[c.sesion_date] || []).push(c) })

    // Disciplina total — solo cuentan los ítems con valor registrado en la sesión
    // (un ítem sin registrar, p. ej. una regla nueva en días previos, es N/A).
    let dTotal = 0, dOk = 0
    ses.forEach(s => DISC_FACTORS.forEach(f => {
      if (!factorAplica(f, s)) return
      if (!evaluable(s, f)) return
      dTotal++; if (cumple(s, f.key, f)) dOk++
    }))
    const disciplinaPct = dTotal > 0 ? Math.round(dOk / dTotal * 100) : null

    // Cumplimiento por fase (con ítems, días fallidos y cobertura de datos)
    const phases = [1, 2, 3].map(fase => {
      const facs = DISC_FACTORS.filter(f => f.fase === fase)
      const baseDias = fase === 1 ? conectadas : operadas
      const factores = facs.map(f => {
        const aplicables = baseDias.filter(s => factorAplica(f, s))
        const registradas = aplicables.filter(s => evaluable(s, f))
        const fallidas = registradas.filter(s => !cumple(s, f.key, f))
          .sort((a, b) => b.sesion_date.localeCompare(a.sesion_date))
        // Cada fallo lleva su porqué, para poder abrirlo desde el tablero.
        const failsInfo = fallidas.map(s => ({
          date: s.sesion_date,
          ...motivoFallo(f, s, casByDate[s.sesion_date] || []),
        }))
        return {
          key: f.key, label: f.label, enunciado: f.enunciado, fase: f.fase,
          evidencia: f.evidencia, aplica_si: f.aplica_si, bloqueaGo: f.bloqueaGo,
          aplica: registradas.length, ok: registradas.length - fallidas.length,
          fails: fallidas.map(s => s.sesion_date), failsInfo,
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
      const registrados = DISC_FACTORS.filter(f => factorAplica(f, s) && evaluable(s, f))
      if (registrados.length && registrados.every(f => cumple(s, f.key, f))) racha++
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

    // Registro de sesiones (días con actividad), más reciente primero
    const log = conectadas
      .slice()
      .sort((a, b) => b.sesion_date.localeCompare(a.sesion_date))
      .map(s => buildLogRow(s, trByDate[s.sesion_date] || [], casByDate[s.sesion_date] || []))

    // Historial de racha (últimas 12 sesiones operadas)
    const hist = [...operadas].sort((a, b) => a.sesion_date.localeCompare(b.sesion_date)).slice(-12).map(s => {
      const registrados = DISC_FACTORS.filter(f => factorAplica(f, s) && evaluable(s, f))
      const fails = registrados.filter(f => !cumple(s, f.key, f)).length
      const tieneError = (casByDate[s.sesion_date] || []).length > 0
      const enVentana = tradesEnVentanaNoticia(trByDate[s.sesion_date] || [], s).length > 0
      if (!registrados.length) return 'empty'
      if (fails === 0 && !tieneError && !enVentana) return 'full'
      if (tieneError || enVentana || fails > 1) return 'broken'
      return 'partial'
    })

    // Verificación automática: días que operaron dentro de la ventana de noticia roja
    const violacionesNoticia = log.filter(r => r.enVentana).length

    return {
      r, totalConectadas: conectadas.length, totalOperadas: operadas.length,
      disciplinaPct, dOk, dTotal, phases, faseDebil, racha, hist,
      tipoCount, erroresTotal: cas.length, erroresPsico, causaRaiz,
      diasLimpios, diasLimpiosPct, log, violacionesNoticia,
      cas,   // ocurrencias del período (para los modales de detalle por día)
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
    // Verificación automática: ¿operó dentro de la ventana de la noticia roja?
    const enVentana = tradesEnVentanaNoticia(dTrades, s)
    if (enVentana.length) {
      detalle += ` <span class="dd-noticia-pill" title="Entró en la ventana ±5 min de la noticia roja">🚫 Operó en ventana de noticia</span>`
    }
    return { date: s.sesion_date, tag, faseTxt, detalle, tipoTxt, dCas, enVentana: enVentana.length }
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
      { label: 'En ventana noticia', value: `${d.violacionesNoticia}`, sub: 'días operando en ±5 min', cls: d.violacionesNoticia === 0 ? 'pos' : 'neg' },
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
        // Solo se abre lo que tiene algo que mostrar: los días en que falló.
        const clic = fc.fails.length > 0
        return `
          <div class="dd-check-row${clic ? ' dd-clickable' : ''}"${clic ? ` data-fail-key="${fc.key}" title="Ver ${fc.fails.length} día${fc.fails.length !== 1 ? 's' : ''} en que falló"` : ''}>
            <span class="dd-dot ${dotCls}"></span>
            <span class="dd-check-label">${esc(fc.label)}${cov ? ' ' + cov : ''}</span>
            <span class="dd-check-rate">${rate}</span>
            ${clic ? '<i class="ti ti-chevron-right dd-chev"></i>' : ''}
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
        <div class="dd-bar-row dd-clickable" data-err-tipo="${t}" title="Ver los días con errores de este tipo">
          <div class="dd-bar-top"><span>${info.emoji} ${info.label}</span><b>${n}</b></div>
          <div class="dd-bar-track"><div class="dd-bar-fill ${info.cls}" style="width:${Math.round(n / maxTipo * 100)}%"></div></div>
        </div>`
    }).join('') || '<p class="dd-soft">Sin errores registrados en el período.</p>'

    const causaHtml = d.causaRaiz.length ? d.causaRaiz.map(c => {
      const info = TIPO[c.tipo] || { label: '—', cls: 'op' }
      return `
        <div class="dd-cause-row dd-clickable" data-err-causa="${esc(c.n)}" title="Ver los días con este error">
          <span class="dd-cause-name"><span class="dd-tag ${info.cls}">${info.label.slice(0,5)}</span>${esc(c.n)}</span>
          <span class="dd-cause-count">${c.count}</span>
        </div>`
    }).join('') : '<p class="dd-soft">Sin causas registradas.</p>'

    cont.innerHTML = `
      <div class="dd-strip">${stripHtml}</div>

      <div class="dd-sec-head"><span class="dd-sec-num">01</span><span class="dd-sec-title">Checklist por fase del proceso</span><div class="dd-sec-line"></div></div>
      <div class="dd-phase-board">${phaseHtml}</div>
      ${streakHtml}

      <div class="dd-sec-head"><span class="dd-sec-num">02</span><span class="dd-sec-title">Errores por tipo y causa raíz</span><div class="dd-sec-line"></div></div>
      <div class="dd-error-grid">
        <div class="dd-panel"><div class="dd-panel-title">Distribución por tipo (${d.totalConectadas} sesiones)</div>${barsHtml}</div>
        <div class="dd-panel"><div class="dd-panel-title">Causa raíz más frecuente</div><div class="dd-cause-list">${causaHtml}</div></div>
      </div>`

    // Clic en un tipo o una causa → modal con los días de esos errores
    lastData = d
    cont.querySelectorAll('[data-err-tipo]').forEach(el =>
      el.addEventListener('click', () => openErrorsModal({ tipo: el.dataset.errTipo })))
    cont.querySelectorAll('[data-err-causa]').forEach(el =>
      el.addEventListener('click', () => openErrorsModal({ causa: el.dataset.errCausa })))
    cont.querySelectorAll('[data-fail-key]').forEach(el =>
      el.addEventListener('click', () => openFactorModal(el.dataset.failKey)))
  }

  // ── Modal: días en que falló una regla del checklist ──────────────────────
  // Muestra el enunciado completo (no visible en el tablero) y, por día, POR QUÉ
  // falló. Cada día es clicable → modal del día (delegación en metrics.js).
  function openFactorModal(key) {
    if (!lastData) return
    let fc = null
    lastData.phases.forEach(p => p.factores.forEach(f => { if (f.key === key) fc = f }))
    if (!fc) return

    const meta = [
      `Fase ${fc.fase}`,
      fc.evidencia === 'auto' ? '⚙ verificada por datos' : 'declarada por ti',
      fc.bloqueaGo ? 'bloquea el GO' : 'no bloquea el GO',
      fc.aplica_si === 'dia_fomc' ? 'solo días FOMC'
        : fc.aplica_si === 'hay_noticia' ? 'solo con noticia roja' : 'aplica siempre',
    ].map(m => `<span class="dd-rule-meta-item">${esc(m)}</span>`).join('')

    const dias = fc.failsInfo.map(fi => {
      const mo = MOTIVOS[fi.tipo] || MOTIVOS.sin_marcar
      const dow = DOW[new Date(fi.date + 'T00:00:00').getDay()]
      const tags = (fi.errores || []).map(c =>
        `<span class="disc-fail-tag">${(TIPO[c.tipo]?.emoji) || '❔'} ${esc(c.casuistica || 'Error')}</span>`).join('')
      const desc = (fi.errores || []).filter(c => c.descripcion)
        .map(c => `<div class="dd-fail-desc">${esc(c.descripcion)}</div>`).join('')
      return `
        <div class="disc-fail-day" data-date="${fi.date}" style="cursor:pointer" title="Ver el detalle del día">
          <div class="disc-fail-day-header">
            <span class="disc-date-dow">${dow}</span>
            <span class="disc-date-val">${fi.date}</span>
            <span class="dd-fail-badge ${mo.cls}">${mo.badge}</span>
          </div>
          <div class="dd-fail-why">${fi.texto}</div>
          ${tags ? `<div class="disc-fail-tags">${tags}</div>` : ''}
          ${desc}
        </div>`
    }).join('') || '<p style="color:var(--text3);padding:8px 0">Sin fallos en el período.</p>'

    const h = document.getElementById('disciplineModalTitle')
    if (h) h.innerHTML = `<i class="ti ti-checkup-list"></i> ${esc(fc.label)}`
    document.getElementById('disciplineModalContent').innerHTML = `
      <div style="padding:16px 20px 20px">
        ${fc.enunciado ? `<div class="dd-rule-enunciado">${esc(fc.enunciado)}</div>` : ''}
        <div class="dd-rule-meta">${meta}</div>
        <p class="disc-section-title">${fc.failsInfo.length} día${fc.failsInfo.length !== 1 ? 's' : ''} sin cumplirla de ${fc.aplica} evaluado${fc.aplica !== 1 ? 's' : ''} — ${esc(lastData.r.label)}</p>
        ${dias}
      </div>`
    document.getElementById('disciplineModal').classList.remove('hidden')
  }

  // ── Modal: días con errores (por tipo o por causa/nombre) ────────────────
  let lastData = null
  function openErrorsModal(filtro) {
    if (!lastData) return
    const nombreDe = c => c.casuistica || c.descripcion || 'Error'
    const lista = lastData.cas.filter(c => filtro.tipo
      ? (c.tipo || 'sintipo') === filtro.tipo
      : nombreDe(c) === filtro.causa)

    const info = filtro.tipo ? TIPO[filtro.tipo] : null
    const titulo = filtro.tipo
      ? `Errores ${info ? info.label.toLowerCase() + 's' : 'sin tipo'}`
      : filtro.causa

    // Agrupar por fecha (más reciente primero)
    const porDia = {}
    lista.forEach(c => { (porDia[c.sesion_date] = porDia[c.sesion_date] || []).push(c) })
    const fechas = Object.keys(porDia).sort((a, b) => b.localeCompare(a))

    const rows = fechas.map(fecha => {
      const dow = DOW[new Date(fecha + 'T00:00:00').getDay()]
      const tags = porDia[fecha].map(c => {
        const ti = TIPO[c.tipo] || { emoji: '❔' }
        return `<span class="disc-fail-tag">${ti.emoji} ${esc(nombreDe(c))}</span>`
      }).join('')
      return `
        <div class="disc-fail-day" data-date="${fecha}" style="cursor:pointer" title="Ver el detalle del día">
          <div class="disc-fail-day-header">
            <span class="disc-date-dow">${dow}</span>
            <span class="disc-date-val">${fecha}</span>
          </div>
          <div class="disc-fail-tags">${tags}</div>
        </div>`
    }).join('') || '<p style="color:var(--text3);padding:8px 0">Sin ocurrencias en el período.</p>'

    const h = document.getElementById('disciplineModalTitle')
    if (h) h.innerHTML = `<i class="ti ti-alert-triangle"></i> ${info ? info.emoji + ' ' : ''}${esc(titulo)}`
    document.getElementById('disciplineModalContent').innerHTML = `
      <div style="padding:16px 20px 20px">
        <p class="disc-section-title">${lista.length} ocurrencia${lista.length !== 1 ? 's' : ''} en ${fechas.length} día${fechas.length !== 1 ? 's' : ''} — ${esc(lastData.r.label)}</p>
        ${rows}
      </div>`
    document.getElementById('disciplineModal').classList.remove('hidden')
  }

  function renderPeriodPills() {
    const el = document.getElementById('disciplinaPeriod')
    if (!el) return
    const opt = (k, l) => `<button class="dd-period ${period === k ? 'on' : ''}" data-period="${k}">${l}</button>`
    el.innerHTML = opt('month', 'Mes') + opt('quarter', 'Trimestre') + opt('all', 'Todo')
  }

  // Los botones de mes solo aplican en Mes/Trimestre (no en "Todo").
  function updateMonthNav() {
    const el = document.getElementById('disciplinaMonthNav')
    if (el) el.classList.toggle('hidden', period === 'all')
  }

  function refreshTitle() {
    const el = document.getElementById('disciplinaHeroSub')
    if (el) el.textContent = range().label
  }

  async function load() {
    const cont = document.getElementById('disciplinaContent')
    try {
      const [t, s, c, cat, items, fe, obj] = await Promise.all([
        DB.getTrades(),
        DB.getSesiones(),
        DB.getAllCasuisticas(),
        DB.getCatalogoCasuisticas().catch(() => []),
        DB.getChecklistItems({ soloActivos: true }).catch(() => null),
        DB.getFechasEspeciales().catch(() => []),
        DB.getObjetivos().catch(() => null),
      ])
      trades = t || []; sesiones = s || []; casuisticas = c || []; catalogo = cat || []
      fechasEsp = fe || []; stopMax = obj?.stop_max_puntos || 80
      buildFactors(items)
      loaded = true
    } catch (e) {
      if (cont) cont.innerHTML = `<p class="coach-error">Error al cargar disciplina: ${esc(e.message)}</p>`
      return
    }
    renderPeriodPills(); updateMonthNav(); refreshTitle(); render()
  }

  function wire() {
    document.getElementById('disciplinaPeriod')?.addEventListener('click', e => {
      const b = e.target.closest('[data-period]'); if (!b) return
      period = b.dataset.period
      renderPeriodPills(); updateMonthNav(); refreshTitle(); render()
    })
    document.getElementById('disciplinaPrev')?.addEventListener('click', () => navMonth(-1))
    document.getElementById('disciplinaNext')?.addEventListener('click', () => navMonth(1))
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
