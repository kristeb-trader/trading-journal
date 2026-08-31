// Análisis unificado — filtros Mes / Trimestre / Anual, gráficas adaptativas
const Charts = (() => {
  let allTrades   = []
  let allSesiones = []
  let allCas      = []
  let allFechasEsp = []   // para el contexto de disciplina (regla FOMC)
  const instances = {}

  let period   = 'month'                       // month | quarter | year
  let curYear  = new Date().getFullYear()
  let curMonth = new Date().getMonth() + 1     // 1-12 (para period=month)
  let curQ     = Math.floor(new Date().getMonth() / 3) + 1  // 1-4 (para period=quarter)
  let capital  = parseFloat(localStorage.getItem('annual_capital_inicial') || '0')

  const MONTHS  = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
  const MONTH_S = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

  const HELP_TEXTS = {
    kpiPnl:     { title: 'P&L Neto', text: 'Suma de ganancias y pérdidas del período (incluye Break Even ±$6).' },
    kpiWin:     { title: 'Win Rate', text: 'Trades Target sobre el total de trades sin Break Even.' },
    kpiTrades:  { title: 'Total Trades', text: 'Trades reales del período (sin break-even). Mismo criterio que el calendario.' },
    kpiRent:    { title: 'Rentabilidad', text: 'P&L del período sobre el capital inicial configurado.' },
    kpiEfec:    { title: 'Efectividad', text: 'Tasa de acierto pura: Targets ÷ (Targets + Stops).' },
    kpiDisc:    { title: 'Disciplina Total', text: 'Adherencia al checklist por fase (% de ítems cumplidos). No penaliza reglas sin registrar. Mismo cálculo que el calendario y el dashboard.' },
    kpiCons:    { title: 'Consistencia', text: 'Sub-períodos positivos: en Mes cuenta semanas, en Trimestre/Año cuenta meses.' },
    equity:     { title: 'Curva de Equity', text: 'P&L acumulado a lo largo del período (por día en Mes/Trimestre, por mes en Anual). El relleno se tiñe de verde sobre cero y de rojo bajo cero. En la cabecera, "máx. caída" es el mayor retroceso desde un pico anterior.' },
    pnlBars:    { title: 'P&L por sub-período', text: 'P&L de cada semana (Mes) o mes (Trimestre/Anual).' },
    results:    { title: 'Distribución de resultados', text: 'Proporción de Target / Stop / Break Even / Otro.' },
  }

  const COLORS = { accent:'#1D9E75', red:'#E24B4A', text:'#9B9B8E', grid:'rgba(255,255,255,0.06)' }
  const baseOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: COLORS.text, font: { size: 12 } } },
      tooltip: { backgroundColor:'#2a2a28', titleColor:'#F4F3EF', bodyColor:'#9B9B8E', borderColor:COLORS.grid, borderWidth:1 },
    },
    scales: {
      x: { ticks: { color: COLORS.text, maxRotation: 45 }, grid: { color: COLORS.grid } },
      y: { ticks: { color: COLORS.text }, grid: { color: COLORS.grid } },
    },
  }

  // Plugin: etiqueta de valor ($) encima/debajo de cada barra
  // Etiquetas SELECTIVAS: solo el mejor y el peor sub-período. Un número sobre
  // cada barra convierte el gráfico en un muro de cifras que nadie lee y que se
  // pisan entre sí con 12 meses — era lo que hacía que se viera desordenado.
  // El resto de valores los cargan el eje y el tooltip.
  // El texto va en tinta, nunca en el color de la serie: el color ya lo lleva la
  // barra que hay debajo.
  const barValueLabels = {
    id: 'barValueLabels',
    afterDatasetsDraw(chart) {
      const { ctx } = chart
      const meta = chart.getDatasetMeta(0)
      const data = chart.data.datasets[0].data
      const reales = data.map((v, i) => ({ v, i })).filter(x => typeof x.v === 'number' && x.v !== 0)
      if (!reales.length) return
      const destacar = new Set()
      destacar.add(reales.reduce((a, b) => (b.v > a.v ? b : a)).i)
      destacar.add(reales.reduce((a, b) => (b.v < a.v ? b : a)).i)
      ctx.save()
      ctx.font = '700 11px system-ui, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillStyle = '#F4F3EF'   // --text; el canvas no resuelve variables CSS
      const { top, bottom } = chart.chartArea
      meta.data.forEach((bar, i) => {
        const v = data[i]
        if (v == null || !destacar.has(i)) return
        // La etiqueta se sujeta DENTRO del área de dibujo. La barra más negativa
        // llega al fondo de la escala, así que su etiqueta caía sobre las
        // etiquetas del eje X ("-$1.454" encima de "Sem 3"). El `grace` de la
        // escala reserva el aire; esto es el cinturón por si aun así no cabe.
        ctx.textBaseline = v >= 0 ? 'bottom' : 'top'
        const y = v >= 0
          ? Math.max(top + 11, bar.y - 7)
          : Math.min(bottom - 13, bar.y + 7)
        ctx.fillText(fmtDinero(v), bar.x, y)
      })
      ctx.restore()
    },
  }

  const BE = t => Math.abs(parseFloat(t.profit) || 0) <= 6
  const p2 = n => String(n).padStart(2, '0')
  function destroy(id) { if (instances[id]) { instances[id].destroy(); delete instances[id] } }

  function getWeekKey(dateStr) {
    const d = new Date(dateStr + 'T12:00:00')
    const day = d.getDay() || 7
    d.setDate(d.getDate() - day + 1)
    return d.toISOString().slice(0, 10)
  }

  // ── Rango de fechas y etiqueta del período actual ─────────────────────────
  function periodRange() {
    if (period === 'month') {
      const last = new Date(curYear, curMonth, 0).getDate()
      return { from: `${curYear}-${p2(curMonth)}-01`, to: `${curYear}-${p2(curMonth)}-${p2(last)}` }
    }
    if (period === 'quarter') {
      const m1 = (curQ - 1) * 3 + 1, m3 = m1 + 2
      const last = new Date(curYear, m3, 0).getDate()
      return { from: `${curYear}-${p2(m1)}-01`, to: `${curYear}-${p2(m3)}-${p2(last)}` }
    }
    return { from: `${curYear}-01-01`, to: `${curYear}-12-31` }
  }

  // `corto` abrevia el mes (Ago en vez de Agosto) para la barra superior en móvil.
  // Trimestre y año ya son cortos de por sí.
  function periodLabel(corto = false) {
    if (period === 'month')   return `${(corto ? MONTH_S : MONTHS)[curMonth - 1]} ${curYear}`
    if (period === 'quarter') return `Q${curQ} ${curYear}`
    return `${curYear}`
  }

  // Años disponibles para el selector (los de los trades + el actual)
  function yearsRange() {
    const ys = new Set([new Date().getFullYear(), curYear])
    allTrades.forEach(t => { if (t.trade_date) ys.add(parseInt(t.trade_date.slice(0, 4))) })
    return [...ys].sort((a, b) => a - b)
  }

  // Selectores directos de mes / trimestre / año según el período
  // ── Controles en la barra superior (ago 2026) ────────────────────────────
  // Antes Análisis tenía una fila propia dentro de la sección con las píldoras de
  // período, las flechas y el picker. Todo eso vive ahora en la barra, como en
  // Calendario y Disciplina: el período va a #sectionContext junto al título y el
  // selector es un desplegable .per-filter.
  const TIPOS = [
    { k: 'month',   label: 'Mes' },
    { k: 'quarter', label: 'Trimestre' },
    { k: 'year',    label: 'Anual' },
  ]
  const tipoInfo = () => TIPOS.find(t => t.k === period) || TIPOS[0]

  // El panel lleva los 3 tipos y, bajo un separador, el salto directo a un
  // mes/trimestre/año concreto (si no, ir de agosto a marzo serían 5 clics).
  function renderPeriodPicker() {
    const el = document.getElementById('analysisPeriod')
    if (!el) return
    const abierto = !!el.querySelector('.per-filter-panel:not(.hidden)')
    const opts = TIPOS.map(t => `
      <button type="button" class="per-filter-opt ${period === t.k ? 'on' : ''}" data-ptype="${t.k}">
        <i class="ti ${period === t.k ? 'ti-check' : ''}"></i>${t.label}
      </button>`).join('')

    const yearOpts = yearsRange().map(y => `<option value="${y}" ${y === curYear ? 'selected' : ''}>${y}</option>`).join('')
    let salto = ''
    if (period === 'month') {
      const mOpts = MONTHS.map((m, i) => `<option value="${i + 1}" ${i + 1 === curMonth ? 'selected' : ''}>${m}</option>`).join('')
      salto = `<select id="pickMonth" class="period-pick">${mOpts}</select><select id="pickYear" class="period-pick">${yearOpts}</select>`
    } else if (period === 'quarter') {
      const qOpts = [1,2,3,4].map(q => `<option value="${q}" ${q === curQ ? 'selected' : ''}>Q${q} (${MONTH_S[(q-1)*3]}–${MONTH_S[(q-1)*3+2]})</option>`).join('')
      salto = `<select id="pickQ" class="period-pick">${qOpts}</select><select id="pickYear" class="period-pick">${yearOpts}</select>`
    } else {
      salto = `<select id="pickYear" class="period-pick">${yearOpts}</select>`
    }

    el.innerHTML = `
      <button type="button" class="per-filter-btn" id="analysisPeriodBtn" title="Período del análisis: ${tipoInfo().label}">
        <i class="ti ti-calendar-month"></i>
        <span class="per-filter-text">${tipoInfo().label}</span>
        <i class="ti ti-chevron-down"></i>
      </button>
      <div class="per-filter-panel ${abierto ? '' : 'hidden'}">
        ${opts}
        <div class="per-filter-sep"></div>
        <div class="per-filter-jump">${salto}</div>
      </div>`
  }

  function togglePeriodPanel(abrir) {
    const p = document.querySelector('#analysisPeriod .per-filter-panel')
    if (p) p.classList.toggle('hidden', abrir === undefined ? !p.classList.contains('hidden') : !abrir)
  }

  // Las flechas de la barra son compartidas: aquí solo se ajusta el rótulo.
  function updateMonthNav() {
    const txt = period === 'year' ? 'Año' : period === 'quarter' ? 'Trimestre' : 'Mes'
    ;['prevMonth', 'nextMonth'].forEach((id, i) => {
      const b = document.getElementById(id)
      if (b) b.title = `${txt} ${i ? 'siguiente' : 'anterior'}`
    })
  }

  // El período va al contexto de la barra superior (título único por pantalla).
  // En móvil la barra lleva título + período + selector + cuenta, y en 375 px no
  // caben con el mes entero: se abrevia, igual que el Calendario en metrics.js.
  // Abreviado sigue siendo exacto; recortado con puntos suspensivos, no.
  function refreshTitle() {
    if (typeof Nav === 'undefined') return
    const estrecho = window.matchMedia('(max-width: 768px)').matches
    Nav.setContexto('analysis', periodLabel(estrecho))
  }

  // ── Sub-períodos para barras y tabla (Mes→semanas, Trim/Año→meses) ────────
  function subPeriods() {
    const { from, to } = periodRange()
    if (period === 'month') {
      // Semanas (lunes) que tocan el mes
      const keys = new Set()
      for (let d = new Date(from + 'T12:00:00'); d <= new Date(to + 'T12:00:00'); d.setDate(d.getDate() + 1)) {
        keys.add(getWeekKey(d.toISOString().slice(0, 10)))
      }
      return [...keys].sort().map((wk, i) => {
        const mon = new Date(wk + 'T12:00:00'); const sun = new Date(mon); sun.setDate(mon.getDate() + 6)
        return { label: `Sem ${i + 1}`, from: wk, to: sun.toISOString().slice(0, 10) }
      })
    }
    // meses del trimestre o del año
    const months = period === 'quarter'
      ? [(curQ - 1) * 3 + 1, (curQ - 1) * 3 + 2, (curQ - 1) * 3 + 3]
      : [1,2,3,4,5,6,7,8,9,10,11,12]
    return months.map(m => {
      const last = new Date(curYear, m, 0).getDate()
      return { label: MONTH_S[m - 1], from: `${curYear}-${p2(m)}-01`, to: `${curYear}-${p2(m)}-${p2(last)}` }
    })
  }

  // ── Cálculos ──────────────────────────────────────────────────────────────
  // Disciplina canónica (misma que calendario y dashboard): adherencia al checklist,
  // consciente de fase y sin penalizar ítems no registrados. casByDate ya no se usa.
  // Usa SIEMPRE los datos del módulo sin filtrar (ni por cuenta ni por período): la
  // disciplina es del proceso del trader, no de una cuenta, y el contexto del día
  // (trades, errores, FOMC) es "qué pasó", no una métrica del período.
  function calcDiscipline(sesiones) {
    if (!sesiones || !sesiones.length) return null
    return calcDisciplinaStats(sesiones, null, discContexto({
      trades: allTrades, errores: allCas, fechasEsp: allFechasEsp,
    })).pct
  }

  function statsOf(trades) {
    const nonBE   = trades.filter(t => !BE(t))
    const beCount = trades.length - nonBE.length
    const targets = nonBE.filter(isWinTrade).length
    const stops   = nonBE.filter(isLossTrade).length
    const pnl     = trades.reduce((s, t) => s + (parseFloat(t.profit) || 0), 0)
    const grossWin  = nonBE.filter(t => parseFloat(t.profit) > 0).reduce((s, t) => s + parseFloat(t.profit), 0)
    const grossLoss = Math.abs(nonBE.filter(t => parseFloat(t.profit) < 0).reduce((s, t) => s + parseFloat(t.profit), 0))
    return {
      pnl, total: trades.length, nonBE: nonBE.length, beCount, targets, stops,
      winRate:  nonBE.length ? targets / nonBE.length * 100 : null,
      efec:     (targets + stops) ? targets / (targets + stops) * 100 : null,
      pf:       grossLoss > 0 ? grossWin / grossLoss : (grossWin > 0 ? Infinity : null),
    }
  }


  // ── KPIs ──────────────────────────────────────────────────────────────────
  function renderKpis(trades, sesiones, casByDate, subs) {
    const s = statsOf(trades)
    // `allTrades` sin filtro de cuenta: la disciplina es del proceso, no de la cuenta.
    const disc = calcDiscipline(sesiones)

    // Consistencia: sub-períodos positivos
    let posSub = 0, activeSub = 0
    subs.forEach(sp => {
      const tt = trades.filter(t => (t.trade_date || '') >= sp.from && (t.trade_date || '') <= sp.to)
      const pnl = tt.reduce((a, t) => a + (parseFloat(t.profit) || 0), 0)
      if (tt.length) { activeSub++; if (pnl > 0) posSub++ }
    })
    const consPct = activeSub ? Math.round(posSub / activeSub * 100) : 0
    const rent = capital > 0 ? `${(s.pnl / capital * 100).toFixed(2)}%` : '—'

    const winV = s.winRate != null ? s.winRate.toFixed(1) : '0.0'

    // Sin línea de contexto bajo el número (Kris, 19 ago): la etiqueta y el valor
    // ya lo dicen todo, y siete pies de texto convertían la fila en un párrafo.
    // El "por qué" de cada métrica sigue disponible en el `?` de su etiqueta.
    const kpi = (label, val, tono, key) => `
      <div class="an-kpi an-kpi-${tono}">
        <span class="an-kpi-label">${label}${key ? `<button class="help-btn-sm" data-help="${key}" title="¿Qué es esto?"><i class="ti ti-help-circle"></i></button>` : ''}</span>
        <span class="an-kpi-value">${val}</span>
      </div>`

    const tono = (v, bueno, malo) => v == null ? 'flat' : v >= bueno ? 'up' : v < malo ? 'down' : 'flat'

    document.getElementById('analysisKpiStrip').className = 'an-kpis'
    document.getElementById('analysisKpiStrip').innerHTML = [
      kpi('P&L Neto', fmtDinero(s.pnl), s.pnl > 0 ? 'up' : s.pnl < 0 ? 'down' : 'flat', 'kpiPnl'),
      kpi('Win Rate', `${winV}%`, tono(s.winRate, 50, 50), 'kpiWin'),
      kpi('Rentabilidad', rent, capital > 0 ? (s.pnl >= 0 ? 'up' : 'down') : 'flat', 'kpiRent'),
      kpi('Disciplina', disc != null ? `${disc}%` : '—', tono(disc, 80, 55), 'kpiDisc'),
      kpi('Consistencia', activeSub ? `${consPct}%` : '—', tono(consPct, 60, 40), 'kpiCons'),
      kpi('Total Trades', `${s.nonBE}`, 'flat', 'kpiTrades'),
    ].join('')
  }

  // ── Equity a ancho completo ─────────────────────────────────────────────
  function renderEquity(trades) {
    destroy('equity')
    // Granularidad: día en Mes/Trimestre, mes en Anual
    const byKey = {}
    const keyOf = d => period === 'year' ? d.slice(0, 7) : d
    trades.forEach(t => { if (t.trade_date) byKey[keyOf(t.trade_date)] = (byKey[keyOf(t.trade_date)] || 0) + (parseFloat(t.profit) || 0) })
    const keys = Object.keys(byKey).sort()
    let cum = 0
    const equity = keys.map(k => { cum += byKey[k]; return parseFloat(cum.toFixed(2)) })
    const diario = keys.map(k => parseFloat(byKey[k].toFixed(2)))
    const labels = keys.map(k => period === 'year' ? MONTH_S[parseInt(k.slice(5, 7)) - 1] : k.slice(5))
    const last = equity[equity.length - 1] || 0

    // En Anual cada punto es un MES, no un día: la unidad tiene que decirlo o el
    // aviso de muestra corta miente sobre qué se está contando.
    const uni = n => period === 'year' ? (n === 1 ? 'mes' : 'meses') : (n === 1 ? 'día' : 'días')

    const nota = document.getElementById('equityNota')
    if (nota) {
      nota.className = 'an-note'
      nota.innerHTML = keys.length === 0
        ? '<i class="ti ti-info-circle"></i> Sin operaciones en el período.'
        : keys.length < 3
          ? `<i class="ti ti-alert-triangle"></i> Solo ${keys.length} ${uni(keys.length)} con operaciones: la curva no describe una tendencia todavía.`
          : ''
      if (keys.length < 3 && keys.length > 0) nota.classList.add('an-note-warn')
    }
    if (!keys.length) return

    const ctx = document.getElementById('equityChart').getContext('2d')
    const segColor = c => (c.p0.parsed.y < 0 || c.p1.parsed.y < 0) ? COLORS.red : COLORS.accent

    instances.equity = new Chart(ctx, {
      type: 'line',
      data: { labels, datasets: [{
        label: 'P&L Acumulado', data: equity,
        borderColor: last >= 0 ? COLORS.accent : COLORS.red, borderWidth: 2.5,
        segment: { borderColor: segColor },
        // Solo el último punto visible: los intermedios ensucian y el tooltip ya
        // los alcanza por índice.
        pointRadius: c => c.dataIndex === equity.length - 1 ? 5 : 0,
        pointHoverRadius: 6,
        pointBackgroundColor: last >= 0 ? COLORS.accent : COLORS.red,
        pointBorderColor: '#1a1a18', pointBorderWidth: 2.5,
        tension: 0.35, fill: true, clip: 8,
        backgroundColor: c => {
          const { chart } = c
          const { ctx: cx, chartArea } = chart
          if (!chartArea) return 'rgba(29,158,117,0.15)'
          const zeroY = chart.scales.y.getPixelForValue(0)
          const top = chartArea.top, bottom = chartArea.bottom
          // Si el lienzo aún no tiene alto (render con la sección oculta), la escala
          // devuelve NaN y `addColorStop` lanza. Se cae al relleno plano.
          if (!Number.isFinite(zeroY) || bottom - top <= 0) return 'rgba(29,158,117,0.15)'
          const g = cx.createLinearGradient(0, top, 0, bottom)
          const z = Math.max(0, Math.min(1, (zeroY - top) / (bottom - top)))
          g.addColorStop(0, 'rgba(29,158,117,0.42)')
          g.addColorStop(Math.max(0, z - 0.001), 'rgba(29,158,117,0.02)')
          g.addColorStop(Math.min(1, z + 0.001), 'rgba(226,75,74,0.02)')
          g.addColorStop(1, 'rgba(226,75,74,0.38)')
          return g
        },
      }] },
      options: {
        ...baseOptions,
        interaction: { mode: 'index', intersect: false },
        layout: { padding: { left: 4, right: 12, top: 12, bottom: 2 } },
        plugins: {
          ...baseOptions.plugins,
          legend: { display: false },
          tooltip: { enabled: false, external: tipEquity(labels, diario, equity) },
        },
        scales: {
          x: { ...baseOptions.scales.x, grid: { display: false },
               ticks: { color: COLORS.text, maxRotation: 0, autoSkip: true, maxTicksLimit: 10, font: { size: 11 } } },
          // Importes completos con separador de miles ($1.500), no abreviados a
          // "1,5k": el eje carga los valores que no llevan etiqueta directa, así
          // que tiene que poder leerse sin traducir.
          y: { ...baseOptions.scales.y, border: { display: false },
               grid: { color: 'rgba(255,255,255,0.04)' },
               ticks: { color: COLORS.text, font: { size: 11 }, maxTicksLimit: 6,
                        callback: v => fmtDinero(v, { masEnPositivo: false }) } },
        },
      },
      plugins: [lineaCero],
    })
  }

  // Tooltip HTML propio: el de Chart.js no permite esta jerarquía (fecha arriba,
  // el P&L del día grande y el acumulado debajo).
  function tipEquity(labels, diario, equity) {
    return ctx => {
      const { chart, tooltip } = ctx
      let el = chart.canvas.parentNode.querySelector('.an-tip')
      if (!el) {
        el = document.createElement('div')
        el.className = 'an-tip'
        chart.canvas.parentNode.appendChild(el)
      }
      if (tooltip.opacity === 0) { el.style.opacity = 0; return }
      const i = tooltip.dataPoints?.[0]?.dataIndex
      if (i == null) return
      const d = diario[i], acc = equity[i]
      el.innerHTML = `
        <div class="an-tip-fecha">${labels[i]}</div>
        <div class="an-tip-row ${d >= 0 ? 'an-tip-pos' : 'an-tip-neg'}"><span>Del día</span><b>${fmtDinero(d)}</b></div>
        <div class="an-tip-row"><span>Acumulado</span><b style="color:var(--text)">${fmtDinero(acc)}</b></div>`
      // Se ancla dentro del contenedor y se voltea si se sale por la derecha.
      const w = el.offsetWidth
      const x = tooltip.caretX + w + 16 > chart.width ? tooltip.caretX - w - 12 : tooltip.caretX + 12
      el.style.opacity = 1
      el.style.left = `${Math.max(0, x)}px`
      el.style.top = `${Math.max(0, tooltip.caretY - 10)}px`
    }
  }

  // Línea del cero: sin ella no se ve de un vistazo si la curva está en positivo.
  const lineaCero = {
    id: 'lineaCero',
    beforeDatasetsDraw(chart) {
      const y = chart.scales.y
      if (!y || y.min > 0 || y.max < 0) return
      const { ctx, chartArea } = chart
      const py = y.getPixelForValue(0)
      // Sólida y de un pelo, no punteada: el punteado añade ruido visual y se
      // lee como "dato provisional" cuando solo es una referencia.
      ctx.save()
      ctx.beginPath(); ctx.lineWidth = 1
      ctx.strokeStyle = 'rgba(255,255,255,0.16)'
      ctx.moveTo(chartArea.left, py); ctx.lineTo(chartArea.right, py); ctx.stroke()
      ctx.restore()
    },
  }

  // ── Barras P&L por sub-período ──────────────────────────────────────────
  function renderPnlBars(trades, subs) {
    destroy('pnlBars')
    document.getElementById('pnlBarsTitle').textContent =
      period === 'month'   ? 'P&L por semana del mes'
      : period === 'quarter' ? 'P&L por mes del trimestre'
      : 'P&L por mes del año'
    const data = subs.map(sp => parseFloat(trades
      .filter(t => (t.trade_date || '') >= sp.from && (t.trade_date || '') <= sp.to)
      .reduce((a, t) => a + (parseFloat(t.profit) || 0), 0).toFixed(2)))

    instances.pnlBars = new Chart(document.getElementById('pnlBarsChart'), {
      type: 'bar',
      // Marcas finas y sin borde: el borde añade tinta que no es dato, y los
      // bloques gruesos saturados son lo que hacía que el gráfico se leyera
      // tosco. La separación entre barras la hace el aire de la banda, no un
      // trazo. Extremo redondeado 4px, escuadrado contra la línea base.
      data: { labels: subs.map(s => s.label), datasets: [{
        label: 'P&L', data,
        backgroundColor: data.map(v => v >= 0 ? COLORS.accent : COLORS.red),
        hoverBackgroundColor: data.map(v => v >= 0 ? '#25C08F' : '#EE6463'),
        borderWidth: 0,
        borderRadius: 4, borderSkipped: 'middle',
        maxBarThickness: 22, categoryPercentage: 0.72, barPercentage: 0.82,
      }] },
      options: {
        ...baseOptions, layout: { padding: { top: 22, right: 8, left: 2 } },
        plugins: { ...baseOptions.plugins, legend: { display: false },
          tooltip: { ...baseOptions.plugins.tooltip, displayColors: false,
            callbacks: { label: c => ` ${fmtDinero(c.parsed.y)}` } } },
        scales: {
          x: { ...baseOptions.scales.x, grid: { display: false },
               ticks: { color: COLORS.text, maxRotation: 0, autoSkip: false, font: { size: 11 } } },
          y: { ...baseOptions.scales.y, border: { display: false }, grace: '18%',
               grid: { color: 'rgba(255,255,255,0.04)' },
               ticks: { color: COLORS.text, font: { size: 11 }, maxTicksLimit: 5, callback: v => fmtDinero(v, { masEnPositivo: false }) } },
        },
      },
      plugins: [barValueLabels, lineaCero],
    })
  }

  // ── Distribución de resultados ──────────────────────────────────────────
  // NO es una dona. El catálogo de anti-patrones de visualización es explícito:
  // "un pastel de 2 porciones → usa una tarjeta de dato: el número ES el gráfico",
  // y "una dona para comparar valores cercanos → una barra, o los números".
  // Además obligaba a escribir el % DENTRO del color, que es ilegible (y el texto
  // nunca debe vestir el color de la serie: la identidad la da la marca de al lado).
  //
  // Forma elegida: cifra protagonista (acierto) + medidor part-to-whole + el
  // recuento explícito de ganadores y perdedores, que es lo que pidió Kris.
  function renderResults(trades) {
    destroy('results')
    const panel = document.getElementById('resultsPanel')
    if (!panel) return

    const targets = trades.filter(isWinTrade).length
    const stops   = trades.filter(isLossTrade).length
    const be      = trades.filter(t => BE(t)).length
    const tot     = targets + stops + be

    if (!tot) {
      panel.innerHTML = '<div class="an-dist-vacio">Sin operaciones en el período.</div>'
      return
    }

    const decisivos = targets + stops          // el acierto se mide sin break-even
    const acierto   = decisivos ? Math.round(targets / decisivos * 100) : null
    const pct = n => tot ? Math.round(n / tot * 100) : 0

    const fila = (cls, label, n) => n ? `
      <div class="an-dist-row">
        <span class="an-dist-dot an-dist-seg-${cls}"></span>
        <span class="an-dist-lbl">${label}</span>
        <span class="an-dist-n an-dist-n-${cls}">${n}</span>
        <span class="an-dist-pct">${pct(n)}%</span>
      </div>` : ''

    // El medidor reparte sobre el TOTAL (incluye break-even si lo hubo), así que
    // los tramos suman el 100% de lo que se ve en las filas de abajo.
    const seg = (cls, n) => n ? `<span class="an-dist-seg an-dist-seg-${cls}" style="flex:${n}"></span>` : ''

    panel.innerHTML = `
      <div class="an-dist">
        <div class="an-dist-hero">
          <span class="an-dist-big">${acierto != null ? acierto + '%' : '—'}</span>
          <span class="an-dist-sub">de acierto${decisivos ? ` · ${decisivos} decisivos` : ''}</span>
        </div>
        <div class="an-dist-bar">
          ${seg('pos', targets)}${seg('neg', stops)}${seg('be', be)}
        </div>
        <div class="an-dist-rows">
          ${fila('pos', 'Ganadores', targets)}
          ${fila('neg', 'Perdedores', stops)}
          ${fila('be',  'Break-even', be)}
        </div>
      </div>`
  }

  // ── Tabla resumen ───────────────────────────────────────────────────────
  function renderTabla(trades, sesiones, casByDate, subs) {
    document.getElementById('analysisTablaTitle').textContent =
      period === 'month'   ? 'Resumen por semana del mes'
      : period === 'quarter' ? 'Resumen por mes del trimestre'
      : 'Resumen por mes del año'
    document.getElementById('analysisTablaCol1').textContent = period === 'month' ? 'Semana' : 'Mes'

    // Los sub-períodos sin actividad se agrupan en UNA fila. En vista Anual eran
    // 5 filas de "— sin actividad —" (Ene y Sep–Dic) ocupando 215px para no decir
    // nada; agrupadas dicen lo mismo en 40.
    const vacios = []
    let cum = 0
    const rows = subs.map(sp => {
      const tt = trades.filter(t => (t.trade_date || '') >= sp.from && (t.trade_date || '') <= sp.to)
      const ss = sesiones.filter(s => s.sesion_date >= sp.from && s.sesion_date <= sp.to)
      const st = statsOf(tt)
      cum += st.pnl
      const disc = calcDiscipline(ss)
      const hasData = tt.length > 0 || ss.filter(s => !s.no_opero).length > 0
      if (!hasData) {
        vacios.push(sp.label)
        return ''
      }
      const rent = capital > 0 ? `${(st.pnl / capital * 100).toFixed(2)}%` : '—'
      const efec = st.efec != null ? `${st.efec.toFixed(1)}%` : '—'
      // Semáforo de 3 tramos: bien / regular / mal. El tramo del medio va en
      // ámbar y no en gris, que se confundía con "sin dato".
      const efecCls = st.efec == null ? 'an-t-neutral' : st.efec >= 50 ? 'an-t-pos' : st.efec >= 40 ? 'an-t-warn' : 'an-t-neg'
      const discStr = disc != null ? `${disc}%` : '—'
      const discCls = disc == null ? 'an-t-neutral' : disc >= 80 ? 'an-t-pos' : disc >= 55 ? 'an-t-warn' : 'an-t-neg'
      const estado = st.pnl > 0 ? '<span class="an-pill an-pill-pos"><i class="ti ti-trending-up"></i>Positivo</span>'
        : st.pnl < 0 ? '<span class="an-pill an-pill-neg"><i class="ti ti-trending-down"></i>Negativo</span>'
        : '<span class="an-pill an-pill-be"><i class="ti ti-minus"></i>Neutro</span>'
      return `
        <tr>
          <td class="an-t-name">${sp.label}</td>
          <td class="num an-t-pnl ${st.pnl > 0 ? 'an-t-pos' : st.pnl < 0 ? 'an-t-neg' : ''}">${fmtDinero(st.pnl)}</td>
          <td class="num">${fmtDinero(cum)}</td>
          <td class="num">${rent}</td>
          <td class="num ${efecCls}">${efec}</td>
          <td class="num ${discCls}">${discStr}</td>
          <td class="num">${st.total || '—'}</td>
          <td>${estado}</td>
        </tr>`
    }).join('')

    const tot = statsOf(trades)
    const totDisc = calcDiscipline(sesiones)
    const totRent = capital > 0 ? `${(tot.pnl / capital * 100).toFixed(2)}%` : '—'
    const totEfec = tot.efec != null ? `${tot.efec.toFixed(1)}%` : '—'
    const totEstado = tot.pnl > 0 ? '<span class="an-pill an-pill-pos"><i class="ti ti-trending-up"></i>Positivo</span>'
      : tot.pnl < 0 ? '<span class="an-pill an-pill-neg"><i class="ti ti-trending-down"></i>Negativo</span>'
      : '<span class="an-pill an-pill-be"><i class="ti ti-minus"></i>Neutro</span>'

    const nEl = document.getElementById('analysisTablaN')
    if (nEl) nEl.textContent = `${tot.total} trade${tot.total === 1 ? '' : 's'}`

    // La fila de totales lleva los MISMOS colores que las filas: es lo primero que
    // busca quien audita sus números, y en gris no se distingue de una fila más.
    const totEfecCls = tot.efec == null ? 'an-t-neutral' : tot.efec >= 50 ? 'an-t-pos' : tot.efec >= 40 ? 'an-t-warn' : 'an-t-neg'
    const totDiscCls = totDisc == null ? 'an-t-neutral' : totDisc >= 80 ? 'an-t-pos' : totDisc >= 55 ? 'an-t-warn' : 'an-t-neg'

    const filaVacios = vacios.length
      ? `<tr class="an-t-vacia"><td class="an-t-name">${vacios.join(' · ')}</td><td colspan="7">— sin actividad —</td></tr>`
      : ''

    document.getElementById('analysisTablaBody').innerHTML = rows + filaVacios
    document.getElementById('analysisTablaFoot').innerHTML = `
      <tr>
        <td class="an-t-name">Total ${periodLabel()}</td>
        <td class="num an-t-pnl ${tot.pnl >= 0 ? 'an-t-pos' : 'an-t-neg'}">${fmtDinero(tot.pnl)}</td>
        <td class="num">${fmtDinero(tot.pnl)}</td>
        <td class="num">${totRent}</td>
        <td class="num ${totEfecCls}">${totEfec}</td>
        <td class="num ${totDiscCls}">${totDisc != null ? totDisc + '%' : '—'}</td>
        <td class="num">${tot.total}</td>
        <td>${totEstado}</td>
      </tr>`
  }

  // ── Render principal ────────────────────────────────────────────────────
  function render() {
    refreshTitle()

    const filtered = AccountFilter.filter('analysis', allTrades)
    const { from, to } = periodRange()
    // Sábados y domingos quedan fuera de toda estadística (no se opera en fin de semana)
    const trades   = filtered.filter(t => (t.trade_date || '') >= from && (t.trade_date || '') <= to && esDiaHabil(t.trade_date))
    const sesiones = allSesiones.filter(s => s.sesion_date >= from && s.sesion_date <= to && esDiaHabil(s.sesion_date))
    const cas      = allCas.filter(c => c.sesion_date >= from && c.sesion_date <= to && esDiaHabil(c.sesion_date))
    const casByDate = {}; cas.forEach(c => { casByDate[c.sesion_date] = true })
    const subs = subPeriods()

    renderKpis(trades, sesiones, casByDate, subs)
    renderEquity(trades)
    renderPnlBars(trades, subs)
    renderResults(trades)
    renderTabla(trades, sesiones, casByDate, subs)
  }

  async function init() {
    ;[allTrades, allSesiones, allCas, allFechasEsp] = await Promise.all([DB.getTrades(), DB.getSesiones(), DB.getAllCasuisticas(), DB.getFechasEspeciales().catch(() => [])])

    AccountFilter.create('analysis', {
      mountId: 'accountFilterAnalysis',
      storageKey: 'analysisAccounts',
      legacyKey: 'annualAccount',
      onChange: () => render(),
    })
    await AccountFilter.setAccounts('analysis', allTrades.map(t => t.account))
    renderPeriodPicker(); updateMonthNav(); render()

    // Desplegable de período: tipo (Mes/Trimestre/Anual) + salto directo.
    // La marca `_enPeriodo` la lee el manejador de "clic fuera": al elegir un tipo
    // se re-pinta el panel, y para cuando el evento llega a `document` el nodo
    // pulsado ya está desconectado del DOM → su `closest()` daría null y el panel
    // se cerraría solo, justo cuando toca elegir el mes concreto debajo.
    document.getElementById('analysisPeriod')?.addEventListener('click', e => {
      e._enPeriodo = true
      if (e.target.closest('.per-filter-btn')) { togglePeriodPanel(); return }
      const b = e.target.closest('[data-ptype]'); if (!b) return
      period = b.dataset.ptype
      renderPeriodPicker(); updateMonthNav(); render()
    })
    // Los `select` del salto directo emiten `change`, no `click`. No se re-pinta el
    // panel: hacerlo lo cerraría en mitad de la interacción.
    document.getElementById('analysisPeriod')?.addEventListener('change', e => {
      const t = e.target
      if (t.id === 'pickYear')  curYear  = parseInt(t.value)
      else if (t.id === 'pickMonth') curMonth = parseInt(t.value)
      else if (t.id === 'pickQ')     curQ     = parseInt(t.value)
      else return
      render()
    })
    // Clic fuera → se cierra.
    document.addEventListener('click', e => {
      if (e._enPeriodo || e.target.closest('#analysisPeriod')) return
      togglePeriodPanel(false)
    })

    // Flechas de la barra superior, compartidas con Calendario y Disciplina.
    const aqui = () => typeof Nav === 'undefined' || Nav.actual() === 'analysis'
    document.getElementById('prevMonth')?.addEventListener('click', () => { if (aqui()) { shift(-1); renderPeriodPicker(); render() } })
    document.getElementById('nextMonth')?.addEventListener('click', () => { if (aqui()) { shift(1);  renderPeriodPicker(); render() } })

    document.getElementById('analysisExportPdf')?.addEventListener('click', () => exportAnalysis('pdf'))
    document.getElementById('analysisExportImg')?.addEventListener('click', () => exportAnalysis('img'))

    document.addEventListener('click', e => {
      const btn = e.target.closest('[data-help]')
      if (!btn || !document.getElementById('section-analysis').classList.contains('active')) return
      const info = HELP_TEXTS[btn.dataset.help]
      if (!info) return
      document.getElementById('analysisHelpTitle').innerHTML = `<i class="ti ti-help-circle" style="color:var(--accent)"></i> ${info.title}`
      document.getElementById('analysisHelpText').textContent = info.text
      document.getElementById('analysisHelpModal').classList.remove('hidden')
    })
    document.getElementById('closeAnalysisHelp').addEventListener('click', () =>
      document.getElementById('analysisHelpModal').classList.add('hidden'))
    document.getElementById('analysisHelpModal').addEventListener('click', e => {
      if (e.target === e.currentTarget) e.currentTarget.classList.add('hidden')
    })
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') document.getElementById('analysisHelpModal')?.classList.add('hidden')
    })
  }

  function shift(dir) {
    if (period === 'month') {
      curMonth += dir
      if (curMonth < 1)  { curMonth = 12; curYear-- }
      if (curMonth > 12) { curMonth = 1;  curYear++ }
    } else if (period === 'quarter') {
      curQ += dir
      if (curQ < 1) { curQ = 4; curYear-- }
      if (curQ > 4) { curQ = 1; curYear++ }
    } else {
      curYear += dir
    }
  }

  // Exporta el análisis a PDF o imagen (captura el área #analysisExportArea)
  async function exportAnalysis(fmt) {
    const area = document.getElementById('analysisExportArea')
    if (!area || typeof html2canvas === 'undefined') { Toast.show('No se pudo cargar la herramienta de exportación', 'error'); return }
    const acct = AccountFilter.slug('analysis')
    const name = `analisis_${periodLabel().replace(/\s+/g, '-')}_${acct}`
    try {
      Toast.show('Generando exportación…', 'info')
      const canvas = await html2canvas(area, { backgroundColor: '#1a1a18', scale: 2, useCORS: true })
      if (fmt === 'img') {
        const a = document.createElement('a')
        a.href = canvas.toDataURL('image/png'); a.download = `${name}.png`; a.click()
      } else {
        const { jsPDF } = window.jspdf
        const imgW = 280, imgH = canvas.height * imgW / canvas.width
        const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
        pdf.setFillColor(26, 26, 24); pdf.rect(0, 0, 297, 210, 'F')
        let y = 8
        // Si es muy alto, escalar para caber en la página
        const maxH = 194
        const w = imgH > maxH ? imgW * maxH / imgH : imgW
        const h = imgH > maxH ? maxH : imgH
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', (297 - w) / 2, y, w, h)
        pdf.save(`${name}.pdf`)
      }
      Toast.show('Exportación lista', 'success')
    } catch (e) {
      Toast.show('Error al exportar: ' + e.message, 'error')
    }
  }

  // Re-lee el capital (configurado en Datos) y re-renderiza. Las flechas de la
  // barra son compartidas, así que al volver hay que reclamar su rótulo: puede
  // haberlo dejado escrito Calendario o Disciplina.
  function refresh() {
    if (!allTrades.length) return
    capital = parseFloat(localStorage.getItem('annual_capital_inicial') || '0')
    updateMonthNav()
    render()
  }

  return { init, refresh }
})()
