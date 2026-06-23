// Análisis unificado — filtros Mes / Trimestre / Anual, gráficas adaptativas
const Charts = (() => {
  let allTrades   = []
  let allSesiones = []
  let allCas      = []
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
    kpiTrades:  { title: 'Total Trades', text: 'Operaciones del período (los B.E. se muestran aparte).' },
    kpiRent:    { title: 'Rentabilidad', text: 'P&L del período sobre el capital inicial configurado.' },
    kpiEfec:    { title: 'Efectividad', text: 'Tasa de acierto pura: Targets ÷ (Targets + Stops).' },
    kpiDisc:    { title: 'Disciplina Total', text: 'Promedio de disciplina (checklist de 6 ítems + ausencia de errores, modelo de 7 factores).' },
    kpiCons:    { title: 'Consistencia', text: 'Sub-períodos positivos: en Mes cuenta semanas, en Trimestre/Año cuenta meses.' },
    kpiPf:      { title: 'Profit Factor', text: 'Ganancia bruta ÷ pérdida bruta. >1.5 sólido, >1 rentable, <1 negativo.' },
    equity:     { title: 'Curva de Equity', text: 'P&L acumulado a lo largo del período (por día en Mes/Trimestre, por mes en Anual). La banda roja es el drawdown desde el pico.' },
    pnlBars:    { title: 'P&L por sub-período', text: 'P&L de cada semana (Mes) o mes (Trimestre/Anual).' },
    pnlByDay:   { title: 'P&L por día de semana', text: 'P&L promedio agrupado por día (Lun–Vie).' },
    pnlByHour:  { title: 'P&L por hora (ET)', text: 'P&L promedio por franjas de 30 min, 9:30–15:00 ET.' },
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
  const barValueLabels = {
    id: 'barValueLabels',
    afterDatasetsDraw(chart) {
      const { ctx } = chart
      const meta = chart.getDatasetMeta(0)
      const data = chart.data.datasets[0].data
      ctx.save()
      ctx.font = '600 11px system-ui, sans-serif'
      ctx.textAlign = 'center'
      meta.data.forEach((bar, i) => {
        const v = data[i]
        if (v === null || v === undefined) return
        ctx.fillStyle = v >= 0 ? COLORS.accent : COLORS.red
        ctx.textBaseline = v >= 0 ? 'bottom' : 'top'
        ctx.fillText(`${v >= 0 ? '+' : ''}$${Math.round(v)}`, bar.x, bar.y + (v >= 0 ? -6 : 6))
      })
      ctx.restore()
    },
  }

  const BE = t => Math.abs(parseFloat(t.profit) || 0) <= 6
  const p2 = n => String(n).padStart(2, '0')
  function destroy(id) { if (instances[id]) { instances[id].destroy(); delete instances[id] } }

  function abbreviateAccount(a) {
    if (!a) return '—'
    const parts = a.split('-')
    return parts.length > 2 ? parts.slice(0, 2).join('-') : a
  }

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

  function periodLabel() {
    if (period === 'month')   return `${MONTHS[curMonth - 1]} ${curYear}`
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
  function renderPicker() {
    const el = document.getElementById('analysisPeriodPicker')
    if (!el) return
    const yearOpts = yearsRange().map(y => `<option value="${y}" ${y === curYear ? 'selected' : ''}>${y}</option>`).join('')
    if (period === 'month') {
      const mOpts = MONTHS.map((m, i) => `<option value="${i + 1}" ${i + 1 === curMonth ? 'selected' : ''}>${m}</option>`).join('')
      el.innerHTML = `<select id="pickMonth" class="period-pick">${mOpts}</select><select id="pickYear" class="period-pick">${yearOpts}</select>`
    } else if (period === 'quarter') {
      const qOpts = [1,2,3,4].map(q => `<option value="${q}" ${q === curQ ? 'selected' : ''}>Q${q} (${MONTH_S[(q-1)*3]}–${MONTH_S[(q-1)*3+2]})</option>`).join('')
      el.innerHTML = `<select id="pickQ" class="period-pick">${qOpts}</select><select id="pickYear" class="period-pick">${yearOpts}</select>`
    } else {
      el.innerHTML = `<select id="pickYear" class="period-pick">${yearOpts}</select>`
    }
    document.getElementById('pickYear')?.addEventListener('change', e => { curYear = parseInt(e.target.value); render() })
    document.getElementById('pickMonth')?.addEventListener('change', e => { curMonth = parseInt(e.target.value); render() })
    document.getElementById('pickQ')?.addEventListener('change', e => { curQ = parseInt(e.target.value); render() })
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
  function calcDiscipline(sesiones, casByDate) {
    if (!sesiones.length) return null
    const claves = DB.checklistClaves()
    const denom  = claves.length + 1   // ítems del checklist + factor "sin errores"
    const sum = sesiones.reduce((acc, s) => {
      if (s.no_opero) return acc + (casByDate[s.sesion_date] ? 0 : 1)
      const chk = claves.filter(k => s[k]).length
      return acc + (chk + (casByDate[s.sesion_date] ? 0 : 1)) / denom
    }, 0)
    return Math.round(sum / sesiones.length * 100)
  }

  function statsOf(trades) {
    const nonBE   = trades.filter(t => !BE(t))
    const beCount = trades.length - nonBE.length
    const targets = nonBE.filter(t => t.resultado === 'target').length
    const stops   = nonBE.filter(t => t.resultado === 'stop').length
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
    const disc = calcDiscipline(sesiones, casByDate)

    // Consistencia: sub-períodos positivos
    let posSub = 0, activeSub = 0
    subs.forEach(sp => {
      const tt = trades.filter(t => (t.trade_date || '') >= sp.from && (t.trade_date || '') <= sp.to)
      const pnl = tt.reduce((a, t) => a + (parseFloat(t.profit) || 0), 0)
      if (tt.length) { activeSub++; if (pnl > 0) posSub++ }
    })
    const consPct = activeSub ? Math.round(posSub / activeSub * 100) : 0
    const rent = capital > 0 ? `${(s.pnl / capital * 100).toFixed(2)}%` : '—'

    const pfStr = s.pf == null ? '—' : s.pf === Infinity ? '∞' : s.pf.toFixed(2)
    const pfCls = s.pf == null ? 'kpi-neutral' : (s.pf === Infinity || s.pf >= 1.5) ? 'kpi-green' : s.pf >= 1 ? 'kpi-neutral' : 'kpi-red'
    const winV = s.winRate != null ? s.winRate.toFixed(1) : '0.0'
    const efecV = s.efec != null ? s.efec.toFixed(1) : '—'

    const chip = (label, val, cls, key) => `
      <div class="analysis-kpi">
        <span class="analysis-kpi-label">${label}
          ${key ? `<button class="help-btn-sm" data-help="${key}" title="¿Qué es esto?"><i class="ti ti-help-circle"></i></button>` : ''}
        </span>
        <span class="analysis-kpi-value ${cls}">${val}</span>
      </div>`

    document.getElementById('analysisKpiStrip').innerHTML = `
      <div class="analysis-kpi-row">
        ${chip('P&L Neto', `${s.pnl>=0?'+':''}$${s.pnl.toFixed(0)}`, s.pnl>=0?'kpi-green':'kpi-red', 'kpiPnl')}
        ${chip('Win Rate', `${winV}%`, parseFloat(winV)>=50?'kpi-green':'kpi-red', 'kpiWin')}
        ${chip('Rentabilidad', rent, capital>0 ? (s.pnl>=0?'kpi-green':'kpi-red') : 'kpi-neutral', 'kpiRent')}
        ${chip('Disciplina', disc!=null?`${disc}%`:'—', disc==null?'kpi-neutral':disc>=80?'kpi-green':disc>=55?'kpi-neutral':'kpi-red', 'kpiDisc')}
        ${chip('Consistencia', activeSub?`${posSub}/${activeSub} · ${consPct}%`:'—', consPct>=60?'kpi-green':consPct>=40?'kpi-neutral':'kpi-red', 'kpiCons')}
        ${chip('Profit Factor', pfStr, pfCls, 'kpiPf')}
        ${chip('Total Trades', `${s.total}`, 'kpi-neutral', 'kpiTrades')}
      </div>`
  }

  // ── Equity adaptativa ───────────────────────────────────────────────────
  function renderEquity(trades) {
    destroy('equity')
    // Granularidad: día en Mes/Trimestre, mes en Anual
    const byKey = {}
    const keyOf = d => period === 'year' ? d.slice(0, 7) : d
    trades.forEach(t => { if (t.trade_date) byKey[keyOf(t.trade_date)] = (byKey[keyOf(t.trade_date)] || 0) + (parseFloat(t.profit) || 0) })
    const keys = Object.keys(byKey).sort()
    let cum = 0
    const equity = keys.map(k => { cum += byKey[k]; return parseFloat(cum.toFixed(2)) })
    const labels = keys.map(k => period === 'year' ? MONTH_S[parseInt(k.slice(5, 7)) - 1] : k.slice(5))
    const last = equity[equity.length - 1] || 0

    const ctx = document.getElementById('equityChart').getContext('2d')
    // Color por signo: verde sobre cero, rojo bajo cero (por segmento y relleno)
    const segColor = c => (c.p0.parsed.y < 0 || c.p1.parsed.y < 0) ? COLORS.red : COLORS.accent
    instances.equity = new Chart(ctx, {
      type: 'line',
      data: { labels, datasets: [
        { label:'P&L Acumulado', data:equity, borderColor: last>=0?COLORS.accent:COLORS.red, borderWidth:3,
          segment: { borderColor: segColor },
          pointRadius:keys.length>30?2:4, pointHoverRadius:7, pointBorderWidth:2,
          pointBackgroundColor: equity.map(v => v < 0 ? COLORS.red : COLORS.accent),
          pointBorderColor:     equity.map(v => v < 0 ? COLORS.red : COLORS.accent),
          tension:0.3, fill:true,
          backgroundColor: c => {
            const { chart } = c
            const { ctx: cx, chartArea } = chart
            if (!chartArea) return 'rgba(29,158,117,0.15)'
            // Gradiente que parte del cero: verde arriba, rojo abajo
            const yScale = chart.scales.y
            const zeroY = yScale.getPixelForValue(0)
            const top = chartArea.top, bottom = chartArea.bottom
            const g = cx.createLinearGradient(0, top, 0, bottom)
            const zeroStop = Math.max(0, Math.min(1, (zeroY - top) / (bottom - top)))
            g.addColorStop(0, 'rgba(29,158,117,0.5)')
            g.addColorStop(Math.max(0, zeroStop - 0.001), 'rgba(29,158,117,0.04)')
            g.addColorStop(Math.min(1, zeroStop + 0.001), 'rgba(226,75,74,0.04)')
            g.addColorStop(1, 'rgba(226,75,74,0.45)')
            return g
          },
        },
      ]},
      options: { ...baseOptions, interaction:{ mode:'index', intersect:false },
        layout: { padding: { left: 12, right: 12, top: 8, bottom: 2 } },
        plugins: { ...baseOptions.plugins,
          legend:{ display:false },
          tooltip:{ ...baseOptions.plugins.tooltip, callbacks:{ label: c => ` P&L acumulado: ${c.raw>=0?'+':''}$${c.raw}` } } } },
    })
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
      data: { labels: subs.map(s => s.label), datasets: [{ label:'P&L',
        data, backgroundColor: data.map(v => v>=0?'rgba(29,158,117,0.65)':'rgba(226,75,74,0.65)'),
        borderColor: data.map(v => v>=0?'rgba(29,158,117,1)':'rgba(226,75,74,1)'), borderWidth:1, borderRadius:4,
        maxBarThickness: 64, categoryPercentage: 0.8, barPercentage: 0.9 }] },
      options: { ...baseOptions, layout: { padding: { right: 18, left: 2 } },
        plugins: { ...baseOptions.plugins, legend:{ display:false },
        tooltip:{ ...baseOptions.plugins.tooltip, callbacks:{ label: c => ` P&L: ${c.parsed.y>=0?'+':''}$${c.parsed.y.toFixed(2)}` } } },
        scales: { ...baseOptions.scales,
          x:{ ...baseOptions.scales.x, ticks:{ color:COLORS.text, maxRotation:0, autoSkip:false } },
          y:{ ...baseOptions.scales.y, ticks:{ color:COLORS.text, callback:v=>`$${v}` } } } },
    })
  }

  // ── P&L por hora (hora local) ───────────────────────────────────────────
  function renderPnlByHour(trades) {
    destroy('pnlByHour')
    // Primeras 2 horas de la apertura de NY en hora local (08:30 a 10:30)
    const slots = { '08:30':[], '09:00':[], '09:30':[], '10:00':[], '10:30':[] }
    trades.forEach(t => {
      if (!t.entry_time) return
      const [h,m] = t.entry_time.split(':').map(Number)
      const sm = m<30?0:30
      const key = `${p2(h)}:${sm===0?'00':'30'}`
      if (slots[key] !== undefined) slots[key].push(parseFloat(t.profit) || 0)
    })
    const labels = Object.keys(slots)
    const avgs = labels.map(k => slots[k].length ? parseFloat((slots[k].reduce((a,b)=>a+b,0)/slots[k].length).toFixed(2)) : null)
    instances.pnlByHour = new Chart(document.getElementById('pnlByHourChart'), {
      type: 'bar',
      data: { labels, datasets:[{ label:'P&L promedio/trade', data:avgs,
        backgroundColor: avgs.map(v=>v===null?'rgba(255,255,255,0.05)':v>=0?COLORS.accent:COLORS.red),
        borderRadius:6, borderSkipped:false, maxBarThickness:40, categoryPercentage:0.7, barPercentage:0.85 }] },
      options: { ...baseOptions, layout:{ padding:{ top:22, bottom:2 } },
        plugins: { ...baseOptions.plugins, legend:{ display:false },
          tooltip:{ ...baseOptions.plugins.tooltip, callbacks:{ label: c => c.raw===null?'Sin trades':` ${c.raw>=0?'+':''}$${c.raw}` } } },
        scales: { ...baseOptions.scales,
          x:{ ...baseOptions.scales.x, grid:{ display:false }, ticks:{ color:COLORS.text, maxRotation:0 } },
          y:{ ...baseOptions.scales.y, ticks:{ color:COLORS.text, callback:v=>`$${v}` } } } },
      plugins: [ barValueLabels ],
    })
  }

  // ── Distribución de resultados ──────────────────────────────────────────
  function renderResults(trades) {
    destroy('results')
    const targets = trades.filter(t => !BE(t) && t.resultado==='target').length
    const stops   = trades.filter(t => !BE(t) && t.resultado==='stop').length
    const tot = targets + stops
    const winRate = tot ? Math.round(targets / tot * 100) : 0
    instances.results = new Chart(document.getElementById('resultsChart'), {
      type: 'doughnut',
      data: { labels:['Target','Stop'], datasets:[{ data:[targets,stops],
        backgroundColor:[COLORS.accent, COLORS.red], borderWidth:0,
        spacing:3, borderRadius:6, hoverOffset:8 }] },
      options: { ...baseOptions, cutout:'70%', scales:{}, layout:{ padding:6 },
        plugins: { ...baseOptions.plugins,
          legend:{ display:true, position:'bottom',
            labels:{ color:'#F4F3EF', usePointStyle:true, pointStyle:'circle', padding:18, font:{ size:13 },
              generateLabels: chart => {
                const ds = chart.data.datasets[0]
                return chart.data.labels.map((l, i) => ({
                  text: `${l}  ·  ${ds.data[i]} (${tot ? Math.round(ds.data[i] / tot * 100) : 0}%)`,
                  fillStyle: ds.backgroundColor[i], strokeStyle: 'transparent', pointStyle: 'circle',
                  fontColor: '#F4F3EF', index: i,
                }))
              } } },
          tooltip:{ ...baseOptions.plugins.tooltip, callbacks:{ label: c => {
            const pct = tot ? Math.round(c.parsed / tot * 100) : 0
            return ` ${c.label}: ${c.parsed} (${pct}%)`
          } } } } },
      plugins: [{
        id: 'resultsCenter',
        afterDraw(chart) {
          const { ctx } = chart
          const meta = chart.getDatasetMeta(0)
          if (!meta.data.length) return
          const { x, y } = meta.data[0]   // centro del doughnut
          ctx.save()
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
          ctx.fillStyle = tot ? (winRate >= 50 ? COLORS.accent : COLORS.red) : COLORS.text
          ctx.font = '700 28px system-ui, sans-serif'
          ctx.fillText(tot ? `${winRate}%` : '—', x, y - 9)
          ctx.fillStyle = COLORS.text
          ctx.font = '500 11px system-ui, sans-serif'
          ctx.fillText('Acierto', x, y + 13)
          if (tot) ctx.fillText(`${tot} trades`, x, y + 28)
          ctx.restore()
        }
      }],
    })
  }

  // ── Tabla resumen adaptativa ────────────────────────────────────────────
  function renderTabla(trades, sesiones, casByDate, subs) {
    document.getElementById('analysisTablaTitle').textContent =
      period === 'month'   ? 'Resumen por semana del mes'
      : period === 'quarter' ? 'Resumen por mes del trimestre'
      : 'Resumen por mes del año'
    document.getElementById('analysisTablaCol1').textContent = period === 'month' ? 'Semana' : 'Mes'

    let cum = 0
    const rows = subs.map(sp => {
      const tt = trades.filter(t => (t.trade_date || '') >= sp.from && (t.trade_date || '') <= sp.to)
      const ss = sesiones.filter(s => s.sesion_date >= sp.from && s.sesion_date <= sp.to)
      const st = statsOf(tt)
      cum += st.pnl
      const disc = calcDiscipline(ss, casByDate)
      const hasData = tt.length > 0 || ss.filter(s => !s.no_opero).length > 0
      if (!hasData) {
        return `<tr class="annual-row-empty"><td class="annual-month-name">${sp.label}</td><td colspan="7" class="annual-empty-cell">— sin actividad —</td></tr>`
      }
      const rent = capital > 0 ? `${(st.pnl / capital * 100).toFixed(2)}%` : '—'
      const efec = st.efec != null ? `${st.efec.toFixed(1)}%` : '—'
      const efecCls = st.efec == null ? '' : st.efec >= 50 ? 'annual-pos' : st.efec >= 40 ? 'annual-warn' : 'annual-neg'
      const discStr = disc != null ? `${disc}%` : '—'
      const discCls = disc == null ? '' : disc >= 80 ? 'annual-pos' : disc >= 55 ? 'annual-warn' : 'annual-neg'
      const estado = st.pnl > 0 ? '<span class="annual-badge annual-badge-pos">▲ Positivo</span>'
        : st.pnl < 0 ? '<span class="annual-badge annual-badge-neg">▼ Negativo</span>'
        : '<span class="annual-badge annual-badge-be">— Neutro</span>'
      return `
        <tr class="annual-row${st.pnl>0?' annual-row-pos':st.pnl<0?' annual-row-neg':''}">
          <td class="annual-month-name">${sp.label}</td>
          <td class="${st.pnl>0?'annual-pos':st.pnl<0?'annual-neg':''} fw-600">${st.pnl>=0?'+':''}$${st.pnl.toFixed(2)}</td>
          <td class="${cum>=0?'annual-pos':'annual-neg'}">${cum>=0?'+':''}$${cum.toFixed(2)}</td>
          <td>${rent}</td>
          <td class="${efecCls}">${efec}</td>
          <td class="${discCls}">${discStr}</td>
          <td>${st.total || '—'}</td>
          <td>${estado}</td>
        </tr>`
    }).join('')

    const tot = statsOf(trades)
    const totDisc = calcDiscipline(sesiones, casByDate)
    const totRent = capital > 0 ? `${(tot.pnl / capital * 100).toFixed(2)}%` : '—'
    const totEfec = tot.efec != null ? `${tot.efec.toFixed(1)}%` : '—'

    const totEstado = tot.pnl > 0 ? '<span class="annual-badge annual-badge-pos">▲ Positivo</span>'
      : tot.pnl < 0 ? '<span class="annual-badge annual-badge-neg">▼ Negativo</span>'
      : '<span class="annual-badge annual-badge-be">— Neutro</span>'

    document.getElementById('analysisTablaBody').innerHTML = rows
    document.getElementById('analysisTablaFoot').innerHTML = `
      <tr class="annual-totals-row">
        <td class="annual-totals-label">Total ${periodLabel()}</td>
        <td class="${tot.pnl>=0?'annual-totals-pos':'annual-totals-neg'}">${tot.pnl>=0?'+':''}$${tot.pnl.toFixed(2)}</td>
        <td class="${tot.pnl>=0?'annual-totals-pos':'annual-totals-neg'}">${tot.pnl>=0?'+':''}$${tot.pnl.toFixed(2)}</td>
        <td class="${capital<=0?'annual-totals-neutral':tot.pnl>=0?'annual-totals-pos':'annual-totals-neg'}">${totRent}</td>
        <td class="${tot.efec==null?'annual-totals-neutral':tot.efec>=50?'annual-totals-pos':tot.efec>=40?'annual-totals-warn':'annual-totals-neg'}">${totEfec}</td>
        <td class="${totDisc==null?'annual-totals-neutral':totDisc>=80?'annual-totals-pos':totDisc>=55?'annual-totals-warn':'annual-totals-neg'}">${totDisc!=null?totDisc+'%':'—'}</td>
        <td class="annual-totals-neutral">${tot.total}</td>
        <td>${totEstado}</td>
      </tr>`
  }

  // ── Render principal ────────────────────────────────────────────────────
  function render() {
    renderPicker()

    const accountVal = document.getElementById('accountFilterAnalysis')?.value || 'all'
    const filtered = accountVal === 'all' ? allTrades : allTrades.filter(t => abbreviateAccount(t.account) === accountVal)
    const { from, to } = periodRange()
    const trades   = filtered.filter(t => (t.trade_date || '') >= from && (t.trade_date || '') <= to)
    const sesiones = allSesiones.filter(s => s.sesion_date >= from && s.sesion_date <= to)
    const cas      = allCas.filter(c => c.sesion_date >= from && c.sesion_date <= to)
    const casByDate = {}; cas.forEach(c => { casByDate[c.sesion_date] = true })
    const subs = subPeriods()

    renderKpis(trades, sesiones, casByDate, subs)
    renderEquity(trades)
    renderPnlBars(trades, subs)
    renderPnlByHour(trades)
    renderResults(trades)
    renderTabla(trades, sesiones, casByDate, subs)
  }

  function buildAccountFilter() {
    const accounts = {}
    allTrades.forEach(t => { if (t.account) accounts[abbreviateAccount(t.account)] = true })
    const sel = document.getElementById('accountFilterAnalysis')
    sel.innerHTML = '<option value="all">Todas las cuentas</option>' +
      Object.keys(accounts).sort().map(a => `<option value="${a}">${a}</option>`).join('')
    const paApex = Object.keys(accounts).find(a => a.startsWith('PA-APEX'))
    const saved = localStorage.getItem('annualAccount')
    if (saved && accounts[saved]) sel.value = saved
    else if (paApex) sel.value = paApex
  }

  async function init() {
    ;[allTrades, allSesiones, allCas] = await Promise.all([DB.getTrades(), DB.getSesiones(), DB.getAllCasuisticas()])
    buildAccountFilter()
    render()

    document.querySelectorAll('#analysisPeriodSel .period-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#analysisPeriodSel .period-btn').forEach(b => b.classList.remove('active'))
        btn.classList.add('active')
        period = btn.dataset.period
        render()
      })
    })

    document.getElementById('analysisPrevPeriod').addEventListener('click', () => { shift(-1); render() })
    document.getElementById('analysisNextPeriod').addEventListener('click', () => { shift(1);  render() })

    document.getElementById('accountFilterAnalysis').addEventListener('change', e => {
      localStorage.setItem('annualAccount', e.target.value)
      render()
    })

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
    const acct = document.getElementById('accountFilterAnalysis')?.value || 'cuenta'
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

  // Re-lee el capital (configurado en Datos) y re-renderiza
  function refresh() {
    if (!allTrades.length) return
    capital = parseFloat(localStorage.getItem('annual_capital_inicial') || '0')
    render()
  }

  return { init, refresh }
})()
