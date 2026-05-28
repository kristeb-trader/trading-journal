// Chart.js visualizations — con filtros, KPI strip y soporte B.E.
const Charts = (() => {
  let allTrades      = []
  let allSesiones    = []
  let allCasuisticas = []
  const instances    = {}

  // ── Estado del filtro de mes (independiente del Calendario) ──────────────
  let analysisYear  = new Date().getFullYear()
  let analysisMonth = new Date().getMonth() + 1
  let activePeriod  = 'month'

  // ── Textos de ayuda ───────────────────────────────────────────────────────
  const HELP_TEXTS = {
    kpiPnl:     { title: 'P&L Neto',
      text: 'Suma total de ganancias y pérdidas en el período seleccionado, incluyendo las operaciones Break Even (±$6).' },
    kpiTrades:  { title: 'Trades',
      text: 'Total de operaciones ejecutadas. Los B.E. (Break Even, ±$6) se muestran aparte porque no cuentan para el Win Rate ni el Profit Factor.' },
    kpiWinRate: { title: 'Win Rate',
      text: 'Porcentaje de trades con resultado Target sobre el total de trades (excluyendo B.E.). Un 50% o más es el objetivo mínimo de consistencia.' },
    kpiPf:      { title: 'Profit Factor',
      text: 'Relación entre la suma de ganancias brutas y la suma de pérdidas brutas. Mayor de 1.5 es excelente, mayor de 1.0 es rentable, menor de 1.0 significa pérdida neta.' },
    kpiAvgWin:  { title: 'Avg Win',
      text: 'Ganancia promedio de los trades ganadores. Compárala con Avg Loss para verificar que el ratio riesgo/recompensa es favorable.' },
    kpiAvgLoss: { title: 'Avg Loss',
      text: 'Pérdida promedio de los trades perdedores en valor absoluto. Idealmente debe ser menor que Avg Win para mantener una ventaja estadística.' },
    kpiEtd:     { title: 'ETD Medio',
      text: 'Efficiency To Destination: cuánto dinero dejaste sobre la mesa en promedio (MFE − Profit). Un ETD alto indica que saliste demasiado pronto de los trades ganadores.' },
    equity:     { title: 'Curva de Equity',
      text: 'Evolución del P&L acumulado día a día. La banda roja inferior muestra el drawdown: cuánto estás por debajo del pico histórico. Una curva ascendente y constante indica consistencia. Pasa el mouse por los puntos para ver el valor exacto.' },
    winRate:    { title: 'Win Rate Semanal',
      text: 'Porcentaje de trades ganadores (Target) por semana calendario, excluyendo las operaciones Break Even. Las barras verdes indican semanas con 50% o más de acierto; las rojas, semanas por debajo. El número dentro de cada barra muestra el porcentaje exacto.' },
    pnlByDay:   { title: 'P&L por Día de Semana',
      text: 'P&L promedio de todos los trades agrupados por día de la semana (Lun–Vie). Identifica en qué días eres más rentable y en cuáles deberías ser más conservador o reducir el tamaño de posición.' },
    pnlByHour:  { title: 'P&L por Hora (ET)',
      text: 'P&L promedio de los trades agrupados en franjas de 30 minutos, desde las 9:30 hasta las 15:00 hora ET (RTH del NQ). Los slots con mejor rendimiento son los horarios óptimos para operar.' },
    maeMfe:     { title: 'MAE vs MFE',
      text: 'MAE (Maximum Adverse Excursion): cuánto fue el trade en tu contra antes de cerrar. MFE (Maximum Favorable Excursion): cuánto llegó a ir a tu favor. Cada punto es un trade. Ayuda a calibrar entradas, gestión de stops y tamaño de objetivo.' },
    pnlHist:    { title: 'Distribución de P&L',
      text: 'Histograma que muestra cuántos trades cayeron en cada rango de $15. Un sesgo positivo (barras verdes más altas y más hacia la derecha) indica una estrategia con ventaja estadística.' },
    results:    { title: 'Distribución de Resultados',
      text: 'Proporción de Targets, Stops, Break Even y Otros sobre el total de trades en el período. Muestra de forma visual el balance de resultados.' },
    discipline: { title: 'Disciplina por Sesión',
      text: 'Puntuación de disciplina (0–100%) calculada con el modelo de 7 factores: 6 ítems del checklist operativo + ausencia de casuísticas/errores. Una sesión con todo el checklist cumplido y sin errores = 100%.' },
    discPnl:    { title: 'Disciplina vs P&L',
      text: 'Scatter plot donde cada punto es una sesión. El eje X muestra la disciplina (%) y el eje Y el P&L del día. Un patrón positivo (puntos verdes arriba a la derecha) confirma que seguir las reglas genera rentabilidad.' },
    errorsTime: { title: 'Errores en el Tiempo',
      text: 'Frecuencia de cada tipo de casuística/error agrupada por semana. Las barras apiladas muestran qué errores se repiten más y si están aumentando o disminuyendo con el tiempo.' },
  }

  const COLORS = {
    accent:  '#1D9E75',
    red:     '#E24B4A',
    warning: '#BA7517',
    dim:     '#4a4a45',
    grid:    'rgba(255,255,255,0.06)',
    text:    '#9B9B8E',
  }

  const baseOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: COLORS.text, font: { size: 12 } } },
      tooltip: { backgroundColor: '#2a2a28', titleColor: '#F4F3EF', bodyColor: '#9B9B8E', borderColor: COLORS.grid, borderWidth: 1 },
    },
    scales: {
      x: { ticks: { color: COLORS.text, maxRotation: 45 }, grid: { color: COLORS.grid } },
      y: { ticks: { color: COLORS.text }, grid: { color: COLORS.grid } },
    },
  }

  function destroy(id) {
    if (instances[id]) { instances[id].destroy(); delete instances[id] }
  }

  function abbreviateAccount(account) {
    if (!account) return '—'
    const parts = account.split('-')
    return parts.length > 2 ? parts.slice(0, 2).join('-') : account
  }

  function isBreakEven(t) {
    return Math.abs(parseFloat(t.profit) || 0) <= 6
  }

  // ── Filtrado por período (usa mes propio del módulo cuando period='month') ─

  function filterByPeriod(trades, sesiones, period) {
    if (period === 'all') return { trades, sesiones }
    if (period === 'month') {
      const y = analysisYear, m = analysisMonth
      const from = `${y}-${String(m).padStart(2,'0')}-01`
      const to   = `${y}-${String(m).padStart(2,'0')}-${String(new Date(y,m,0).getDate()).padStart(2,'0')}`
      return {
        trades:   trades.filter(t => (t.trade_date||'') >= from && (t.trade_date||'') <= to),
        sesiones: sesiones.filter(s => s.sesion_date >= from && s.sesion_date <= to),
      }
    }
    // week
    const d = new Date(); d.setDate(d.getDate() - d.getDay() + 1)
    const from = d.toISOString().slice(0,10)
    return {
      trades:   trades.filter(t => (t.trade_date||'') >= from),
      sesiones: sesiones.filter(s => s.sesion_date >= from),
    }
  }

  function filterCasuisticasByPeriod(casuisticas, period) {
    if (period === 'all') return casuisticas
    if (period === 'month') {
      const y = analysisYear, m = analysisMonth
      const from = `${y}-${String(m).padStart(2,'0')}-01`
      const to   = `${y}-${String(m).padStart(2,'0')}-${String(new Date(y,m,0).getDate()).padStart(2,'0')}`
      return casuisticas.filter(c => c.sesion_date >= from && c.sesion_date <= to)
    }
    const d = new Date(); d.setDate(d.getDate() - d.getDay() + 1)
    return casuisticas.filter(c => c.sesion_date >= d.toISOString().slice(0,10))
  }

  function buildAccountFilter() {
    const accounts = {}
    allTrades.forEach(t => { if (t.account) accounts[abbreviateAccount(t.account)] = true })
    const sel  = document.getElementById('accountFilterAnalysis')
    const prev = sel.value
    sel.innerHTML = '<option value="all">Todas las cuentas</option>' +
      Object.keys(accounts).sort().map(a => `<option value="${a}">${a}</option>`).join('')
    const paApex = Object.keys(accounts).find(a => a.startsWith('PA-APEX'))
    if (prev && prev !== 'all' && accounts[prev]) sel.value = prev
    else if (paApex) sel.value = paApex
  }

  // ── Navegador de mes ──────────────────────────────────────────────────────

  function updateMonthLabel() {
    const el = document.getElementById('analysisMonthLabel')
    if (el) el.textContent = `${I18n.months()[analysisMonth - 1]} ${analysisYear}`
  }

  function showHideMonthNav(period) {
    const nav = document.getElementById('analysisMonthNav')
    if (!nav) return
    nav.style.display = period === 'month' ? 'flex' : 'none'
  }

  // ── KPI Strip ─────────────────────────────────────────────────────────────

  function renderKpiStrip(trades) {
    const nonBE  = trades.filter(t => !isBreakEven(t))
    const beCount = trades.filter(t => isBreakEven(t)).length
    const targets = nonBE.filter(t => t.resultado === 'target').length
    const netPnl  = trades.reduce((s,t) => s + (parseFloat(t.profit)||0), 0)
    const winRate = nonBE.length > 0 ? (targets / nonBE.length * 100).toFixed(1) : '0.0'

    const grossWin  = nonBE.filter(t => (parseFloat(t.profit)||0) > 0)
      .reduce((s,t) => s + parseFloat(t.profit), 0)
    const grossLoss = Math.abs(nonBE.filter(t => (parseFloat(t.profit)||0) < 0)
      .reduce((s,t) => s + parseFloat(t.profit), 0))
    const pf = grossLoss > 0 ? (grossWin/grossLoss).toFixed(2) : grossWin > 0 ? '∞' : '—'
    const pfColor = pf==='—' ? 'kpi-neutral' : pf==='∞' || parseFloat(pf)>=1.5 ? 'kpi-green'
      : parseFloat(pf)>=1 ? 'kpi-neutral' : 'kpi-red'

    const wins   = nonBE.filter(t => (parseFloat(t.profit)||0) > 0)
    const losses = nonBE.filter(t => (parseFloat(t.profit)||0) < 0)
    const avgWin  = wins.length   > 0 ? (wins.reduce((s,t)   => s+parseFloat(t.profit),0)/wins.length).toFixed(0) : '0'
    const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((s,t)=>s+parseFloat(t.profit),0)/losses.length).toFixed(0) : '0'

    const etdTrades = trades.filter(t => t.mfe != null && t.profit != null)
    const avgEtd = etdTrades.length > 0
      ? (etdTrades.reduce((s,t) => s + (parseFloat(t.mfe) - parseFloat(t.profit)), 0) / etdTrades.length).toFixed(0)
      : null

    const chip = (label, val, cls='kpi-neutral', helpKey='') => `
      <div class="analysis-kpi">
        <span class="analysis-kpi-label">
          ${label}
          ${helpKey ? `<button class="help-btn-sm" data-help="${helpKey}" title="¿Qué es esto?"><i class="ti ti-help-circle"></i></button>` : ''}
        </span>
        <span class="analysis-kpi-value ${cls}">${val}</span>
      </div>`

    document.getElementById('analysisKpiStrip').innerHTML = `
      <div class="analysis-kpi-row">
        ${chip(I18n.t('kpi.net_pnl'), `${netPnl>=0?'+':''}$${netPnl.toFixed(0)}`, netPnl>=0?'kpi-green':'kpi-red', 'kpiPnl')}
        ${chip(I18n.t('kpi.trades'), `${nonBE.length}${beCount>0?` <small style="color:var(--text3);font-weight:400">+${beCount} B.E.</small>`:''}`, 'kpi-neutral', 'kpiTrades')}
        ${chip(I18n.t('kpi.win_rate'), `${winRate}%`, parseFloat(winRate)>=50?'kpi-green':'kpi-red', 'kpiWinRate')}
        ${chip(I18n.t('kpi.profit_factor'), pf, pfColor, 'kpiPf')}
        ${chip(I18n.t('kpi.avg_win'), `$${avgWin}`, 'kpi-green', 'kpiAvgWin')}
        ${chip(I18n.t('kpi.avg_loss'), `$${avgLoss}`, 'kpi-red', 'kpiAvgLoss')}
        ${avgEtd !== null ? chip(I18n.t('kpi.etd'), `$${avgEtd}`, parseFloat(avgEtd)<=15?'kpi-neutral':'kpi-red', 'kpiEtd') : ''}
      </div>`
  }

  // ── Equity Curve ──────────────────────────────────────────────────────────

  function renderEquity(trades) {
    destroy('equity')
    const byDate = {}
    trades.forEach(t => {
      if (!t.trade_date) return
      byDate[t.trade_date] = (byDate[t.trade_date]||0) + (parseFloat(t.profit)||0)
    })
    const dates = Object.keys(byDate).sort()
    let cum = 0
    const equityData = dates.map(d => { cum += byDate[d]; return parseFloat(cum.toFixed(2)) })
    const lastVal = equityData[equityData.length-1] || 0

    // Banda de drawdown
    let peak = -Infinity
    const drawdownData = equityData.map(v => {
      if (v > peak) peak = v
      return parseFloat((v - peak).toFixed(2))
    })

    const ctx  = document.getElementById('equityChart').getContext('2d')
    const grad = ctx.createLinearGradient(0,0,0,300)
    grad.addColorStop(0, 'rgba(29,158,117,0.3)')
    grad.addColorStop(1, 'rgba(29,158,117,0)')
    instances.equity = new Chart(ctx, {
      type: 'line',
      data: {
        labels: dates,
        datasets: [
          {
            label: I18n.t('chart.equity_label'),
            data: equityData,
            borderColor: lastVal>=0 ? COLORS.accent : COLORS.red,
            backgroundColor: lastVal>=0 ? grad : 'rgba(226,75,74,0.1)',
            borderWidth: 2,
            pointRadius: dates.length > 30 ? 2 : 4,
            pointHoverRadius: 7,
            tension: 0.3,
            fill: true,
            order: 1,
          },
          {
            label: I18n.t('chart.drawdown_label'),
            data: drawdownData,
            borderColor: 'rgba(226,75,74,0.5)',
            backgroundColor: 'rgba(226,75,74,0.15)',
            borderWidth: 1,
            pointRadius: 0,
            pointHoverRadius: 0,
            tension: 0.3,
            fill: 'origin',
            order: 2,
          },
        ]
      },
      options: {
        ...baseOptions,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          ...baseOptions.plugins,
          legend: { display: true, labels: { color:COLORS.text, font:{ size:11 }, boxWidth:14 } },
          tooltip: {
            ...baseOptions.plugins.tooltip,
            callbacks: {
              label: ctx => {
                if (ctx.datasetIndex === 0)
                  return ` P&L acumulado: ${ctx.raw >= 0 ? '+' : ''}$${ctx.raw}`
                if (ctx.datasetIndex === 1 && ctx.raw < 0)
                  return ` Drawdown: $${ctx.raw}`
                return null
              }
            }
          }
        },
      },
    })
  }

  // ── Win Rate por semana (excluye B.E.) ────────────────────────────────────

  function getWeekKey(dateStr) {
    const d = new Date(dateStr + 'T12:00:00')
    const day = d.getDay() || 7
    d.setDate(d.getDate() - day + 1)
    return d.toISOString().slice(0,10)
  }

  // Plugin inline: muestra el % dentro de cada barra
  const winRateLabelPlugin = {
    id: 'winRateLabels',
    afterDatasetsDraw(chart) {
      const { ctx, data } = chart
      const meta = chart.getDatasetMeta(0)
      meta.data.forEach((bar, i) => {
        const value = data.datasets[0].data[i]
        if (value === null || value === undefined) return
        const barHeight = Math.abs(bar.base - bar.y)
        if (barHeight < 16) return  // barra demasiado corta
        ctx.save()
        ctx.fillStyle = 'rgba(255,255,255,0.88)'
        ctx.font = 'bold 11px system-ui, sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(`${value}%`, bar.x, bar.y + barHeight / 2)
        ctx.restore()
      })
    }
  }

  function renderWinRate(trades) {
    destroy('winRate')
    const nonBE = trades.filter(t => !isBreakEven(t))
    const weeks = {}
    nonBE.forEach(t => {
      if (!t.trade_date) return
      const wk = getWeekKey(t.trade_date)
      if (!weeks[wk]) weeks[wk] = { win: 0, total: 0 }
      weeks[wk].total++
      if (t.resultado === 'target') weeks[wk].win++
    })
    const sorted = Object.keys(weeks).sort()
    instances.winRate = new Chart(document.getElementById('winRateChart'), {
      type: 'bar',
      data: {
        labels: sorted.map(w => w.slice(5)),
        datasets: [{
          label: 'Win Rate %',
          data: sorted.map(w => parseFloat((weeks[w].win/weeks[w].total*100).toFixed(1))),
          backgroundColor: sorted.map(w => weeks[w].win/weeks[w].total>=0.5
            ? 'rgba(29,158,117,0.7)' : 'rgba(226,75,74,0.7)'),
          borderRadius: 4,
        }]
      },
      options: { ...baseOptions, scales: { ...baseOptions.scales,
        y: { ...baseOptions.scales.y, max:100, ticks:{ color:COLORS.text, callback:v=>v+'%' } } } },
      plugins: [winRateLabelPlugin],
    })
  }

  // ── P&L promedio por día de semana ────────────────────────────────────────

  function renderPnlByDay(trades) {
    destroy('pnlByDay')
    const calDays = I18n.calendarDays()
    const DAYS = calDays.slice(0, 5)
    const buckets = {1:[],2:[],3:[],4:[],5:[]}
    trades.forEach(t => {
      if (!t.trade_date) return
      const dow = new Date(t.trade_date+'T12:00:00').getDay()
      if (dow>=1 && dow<=5) buckets[dow].push(parseFloat(t.profit)||0)
    })
    const avgs = [1,2,3,4,5].map(d => {
      const v = buckets[d]
      return v.length>0 ? parseFloat((v.reduce((a,b)=>a+b,0)/v.length).toFixed(2)) : 0
    })
    instances.pnlByDay = new Chart(document.getElementById('pnlByDayChart'), {
      type: 'bar',
      data: {
        labels: DAYS,
        datasets: [{ label: I18n.t('chart.pnl_avg_label'), data:avgs,
          backgroundColor: avgs.map(v=>v>=0?'rgba(29,158,117,0.7)':'rgba(226,75,74,0.7)'),
          borderRadius:4 }]
      },
      options: baseOptions,
    })
  }

  // ── P&L promedio por hora del día ─────────────────────────────────────────

  function renderPnlByHour(trades) {
    destroy('pnlByHour')
    const slots = {}
    for (let h=9; h<=14; h++) {
      for (let min=0; min<60; min+=30) {
        if (h===9 && min<30) continue
        const key = `${String(h).padStart(2,'0')}:${min===0?'00':'30'}`
        slots[key] = []
      }
    }
    slots['15:00'] = []

    trades.forEach(t => {
      if (!t.entry_time) return
      const [h,m] = t.entry_time.split(':').map(Number)
      if (h<9 || h>15) return
      const slotMin = m < 30 ? 0 : 30
      const slotH   = h
      if (slotH===9 && slotMin<30) return
      if (slotH>15 || (slotH===15 && slotMin>0)) return
      const key = `${String(slotH).padStart(2,'0')}:${slotMin===0?'00':'30'}`
      if (slots[key] !== undefined) slots[key].push(parseFloat(t.profit)||0)
    })

    const labels = Object.keys(slots)
    const avgs   = labels.map(k => {
      const v = slots[k]
      return v.length>0 ? parseFloat((v.reduce((a,b)=>a+b,0)/v.length).toFixed(2)) : null
    })

    instances.pnlByHour = new Chart(document.getElementById('pnlByHourChart'), {
      type: 'bar',
      data: {
        labels,
        datasets: [{ label: I18n.t('chart.pnl_avg_trade_label'), data:avgs,
          backgroundColor: avgs.map(v=>v===null?'rgba(255,255,255,0.05)':v>=0?'rgba(29,158,117,0.7)':'rgba(226,75,74,0.7)'),
          borderRadius: 4 }]
      },
      options: { ...baseOptions,
        plugins: { ...baseOptions.plugins,
          tooltip: { ...baseOptions.plugins.tooltip,
            callbacks: { label: ctx => ctx.raw===null ? 'Sin trades' : `$${ctx.raw}` } } },
        scales: { ...baseOptions.scales,
          y: { ...baseOptions.scales.y,
            ticks: { color:COLORS.text, callback: v=>`$${v}` } } } },
    })
  }

  // ── MAE vs MFE Scatter ────────────────────────────────────────────────────

  function renderMaeMfe(trades) {
    destroy('maeMfe')
    const targets = trades.filter(t => t.resultado==='target' && t.mae!=null && t.mfe!=null)
    const stops   = trades.filter(t => t.resultado==='stop'   && t.mae!=null && t.mfe!=null)
    instances.maeMfe = new Chart(document.getElementById('maeMfeChart'), {
      type: 'scatter',
      data: {
        datasets: [
          { label:'Target', data:targets.map(t=>({x:parseFloat(t.mae),y:parseFloat(t.mfe)})),
            backgroundColor:'rgba(29,158,117,0.6)', pointRadius:5 },
          { label:'Stop',   data:stops.map(t=>({x:parseFloat(t.mae),y:parseFloat(t.mfe)})),
            backgroundColor:'rgba(226,75,74,0.6)',  pointRadius:5 },
        ]
      },
      options: { ...baseOptions, scales: {
        x: { ...baseOptions.scales.x, title:{ display:true, text:'MAE ($)', color:COLORS.text } },
        y: { ...baseOptions.scales.y, title:{ display:true, text:'MFE ($)', color:COLORS.text } },
      }},
    })
  }

  // ── Distribución de resultados (con B.E.) ─────────────────────────────────

  function renderResults(trades) {
    destroy('results')
    const targets = trades.filter(t => !isBreakEven(t) && t.resultado==='target').length
    const stops   = trades.filter(t => !isBreakEven(t) && t.resultado==='stop').length
    const bes     = trades.filter(t => isBreakEven(t)).length
    const otros   = trades.filter(t => !isBreakEven(t) && t.resultado!=='target' && t.resultado!=='stop').length
    instances.results = new Chart(document.getElementById('resultsChart'), {
      type: 'doughnut',
      data: {
        labels: ['Target','Stop','B.E.','Otro'],
        datasets: [{ data:[targets,stops,bes,otros],
          backgroundColor:['rgba(29,158,117,0.8)','rgba(226,75,74,0.8)','rgba(155,155,142,0.6)','rgba(74,74,69,0.8)'],
          borderWidth:0 }]
      },
      options: { ...baseOptions, scales:{} },
    })
  }

  // ── Histograma de distribución de P&L ────────────────────────────────────

  function renderPnlHistogram(trades) {
    destroy('pnlHist')
    if (trades.length === 0) return
    const profits = trades.map(t => parseFloat(t.profit) || 0)
    const BUCKET  = 15
    const minB = Math.floor(Math.min(...profits) / BUCKET) * BUCKET
    const maxB = Math.ceil( Math.max(...profits) / BUCKET) * BUCKET
    const buckets = {}
    for (let v = minB; v <= maxB; v += BUCKET) buckets[v] = 0
    profits.forEach(p => {
      const b = Math.floor(p / BUCKET) * BUCKET
      buckets[b] = (buckets[b] || 0) + 1
    })
    const labels = Object.keys(buckets).map(Number).sort((a,b) => a-b)
    const data   = labels.map(k => buckets[k])
    instances.pnlHist = new Chart(document.getElementById('pnlHistChart'), {
      type: 'bar',
      data: {
        labels: labels.map(v => `$${v}`),
        datasets: [{
          label: 'Trades',
          data,
          backgroundColor: labels.map(v => v >= 0 ? 'rgba(29,158,117,0.7)' : 'rgba(226,75,74,0.7)'),
          borderRadius: 3,
          barPercentage: 0.95,
          categoryPercentage: 1.0,
        }]
      },
      options: { ...baseOptions,
        plugins: { ...baseOptions.plugins, legend:{ display:false } },
        scales: {
          x: { ...baseOptions.scales.x,
            title:{ display:true, text: I18n.t('chart.pnl_x_label'), color:COLORS.text } },
          y: { ...baseOptions.scales.y,
            title:{ display:true, text: I18n.t('chart.frequency_label'), color:COLORS.text },
            ticks:{ color:COLORS.text, stepSize:1 } },
        }},
    })
  }

  // ── Disciplina por sesión — modelo 7 factores ─────────────────────────────

  function renderDiscipline(sesiones, casuisticas) {
    destroy('discipline')
    const casByDate = {}
    casuisticas.forEach(c => { casByDate[c.sesion_date] = true })
    const active = sesiones.filter(s => !s.no_opero).slice().reverse()
    const labels = active.map(s => s.sesion_date?.slice(5))
    const scores = active.map(s => {
      const checks  = [s.chk_zonas,s.chk_orden,s.chk_5velas,s.chk_noticias,s.chk_consecucion,s.chk_estructura]
      const chkScore = checks.filter(Boolean).length
      const noErrors = casByDate[s.sesion_date] ? 0 : 1
      return Math.round((chkScore + noErrors) / 7 * 100)
    })
    instances.discipline = new Chart(document.getElementById('disciplineChart'), {
      type: 'line',
      data: { labels, datasets: [{
        label: I18n.t('chart.discipline_label'), data:scores,
        borderColor:COLORS.accent, backgroundColor:'rgba(29,158,117,0.1)',
        borderWidth:2, pointRadius:3, tension:0.2, fill:true,
      }]},
      options: { ...baseOptions, scales: { ...baseOptions.scales,
        y:{ ...baseOptions.scales.y, min:0, max:100, ticks:{ color:COLORS.text, callback:v=>v+'%' } } } },
    })
  }

  // ── Disciplina vs P&L (scatter) ──────────────────────────────────────────

  function renderDisciplinePnl(trades, sesiones) {
    destroy('disciplinePnl')
    const pnlByDate = {}
    trades.forEach(t => {
      if (!t.trade_date) return
      pnlByDate[t.trade_date] = (pnlByDate[t.trade_date]||0) + (parseFloat(t.profit)||0)
    })
    const points = sesiones
      .filter(s => !s.no_opero && pnlByDate[s.sesion_date] !== undefined)
      .map(s => {
        const checks = [s.chk_zonas,s.chk_orden,s.chk_5velas,s.chk_noticias,s.chk_consecucion,s.chk_estructura]
        return {
          x: Math.round(checks.filter(Boolean).length / 6 * 100),
          y: parseFloat(pnlByDate[s.sesion_date].toFixed(2)),
          date: s.sesion_date,
        }
      })
    if (points.length === 0) { destroy('disciplinePnl'); return }
    const pos = points.filter(p => p.y >= 0)
    const neg = points.filter(p => p.y  < 0)
    instances.disciplinePnl = new Chart(document.getElementById('disciplinePnlChart'), {
      type: 'scatter',
      data: { datasets: [
        { label: I18n.t('chart.winning_day'), data:pos, backgroundColor:'rgba(29,158,117,0.65)', pointRadius:6 },
        { label: I18n.t('chart.losing_day'),  data:neg, backgroundColor:'rgba(226,75,74,0.65)',  pointRadius:6 },
      ]},
      options: { ...baseOptions,
        plugins: { ...baseOptions.plugins,
          tooltip: { ...baseOptions.plugins.tooltip, callbacks: {
            label: ctx => `${ctx.raw.date} — disc: ${ctx.raw.x}%  P&L: ${ctx.raw.y>=0?'+':''}$${ctx.raw.y}`
          }}},
        scales: {
          x: { ...baseOptions.scales.x, min:0, max:100,
            title:{ display:true, text: I18n.t('chart.discipline_x'), color:COLORS.text },
            ticks:{ color:COLORS.text, callback:v=>v+'%' } },
          y: { ...baseOptions.scales.y,
            title:{ display:true, text: I18n.t('chart.pnl_y'), color:COLORS.text },
            ticks:{ color:COLORS.text, callback:v=>`$${v}` } },
        }},
    })
  }

  // ── Errores en el tiempo (barras apiladas por semana) ─────────────────────

  function renderErrorsOverTime(casuisticas) {
    destroy('errorsTime')
    if (casuisticas.length === 0) return

    const typeCount = {}
    casuisticas.forEach(c => { typeCount[c.casuistica] = (typeCount[c.casuistica]||0) + 1 })
    const errorTypes = Object.keys(typeCount).sort((a,b) => typeCount[b] - typeCount[a])

    const weekMap = {}
    casuisticas.forEach(c => {
      const wk = getWeekKey(c.sesion_date)
      if (!weekMap[wk]) weekMap[wk] = {}
      weekMap[wk][c.casuistica] = (weekMap[wk][c.casuistica]||0) + 1
    })
    const weeks = Object.keys(weekMap).sort()

    const palette = [
      'rgba(226,75,74,0.8)',
      'rgba(186,117,23,0.8)',
      'rgba(99,102,241,0.8)',
      'rgba(20,184,166,0.8)',
      'rgba(249,115,22,0.8)',
      'rgba(168,85,247,0.8)',
      'rgba(59,130,246,0.8)',
      'rgba(236,72,153,0.8)',
    ]

    instances.errorsTime = new Chart(document.getElementById('errorsTimeChart'), {
      type: 'bar',
      data: {
        labels: weeks.map(w => w.slice(5)),
        datasets: errorTypes.map((type, i) => ({
          label: type,
          data: weeks.map(wk => weekMap[wk][type] || 0),
          backgroundColor: palette[i % palette.length],
          borderRadius: 3,
          stack: 'errors',
        })),
      },
      options: { ...baseOptions,
        plugins: { ...baseOptions.plugins,
          legend: { labels: { color:COLORS.text, font:{ size:10 }, boxWidth:12, padding:8 } },
          tooltip: { ...baseOptions.plugins.tooltip, mode:'index', intersect:false } },
        scales: {
          x: { ...baseOptions.scales.x, stacked:true },
          y: { ...baseOptions.scales.y, stacked:true, ticks:{ color:COLORS.text, stepSize:1 } },
        }},
    })
  }

  // ── Render principal ──────────────────────────────────────────────────────

  function render(period = 'month') {
    activePeriod = period
    showHideMonthNav(period)

    const accountVal = document.getElementById('accountFilterAnalysis')?.value || 'all'
    const accountFiltered = accountVal==='all'
      ? allTrades
      : allTrades.filter(t => abbreviateAccount(t.account)===accountVal)
    const { trades, sesiones } = filterByPeriod(accountFiltered, allSesiones, period)
    const casuisticas = filterCasuisticasByPeriod(allCasuisticas, period)

    renderKpiStrip(trades)
    renderEquity(trades)
    renderWinRate(trades)
    renderPnlByDay(trades)
    renderPnlByHour(trades)
    renderMaeMfe(trades)
    renderPnlHistogram(trades)
    renderResults(trades)
    renderDiscipline(sesiones, casuisticas)
    renderDisciplinePnl(trades, sesiones)
    renderErrorsOverTime(casuisticas)
  }

  async function init() {
    ;[allTrades, allSesiones, allCasuisticas] = await Promise.all([
      DB.getTrades(), DB.getSesiones(), DB.getAllCasuisticas()
    ])
    buildAccountFilter()

    // Inicializar mes al mes actual
    analysisYear  = new Date().getFullYear()
    analysisMonth = new Date().getMonth() + 1
    updateMonthLabel()

    render('month')

    // ── Período ──────────────────────────────────────────────────────────
    document.querySelectorAll('#section-analysis .period-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#section-analysis .period-btn').forEach(b => b.classList.remove('active'))
        btn.classList.add('active')
        render(btn.dataset.period)
      })
    })

    // ── Navegador de mes ─────────────────────────────────────────────────
    document.getElementById('analysisPrevMonth').addEventListener('click', () => {
      analysisMonth--
      if (analysisMonth < 1) { analysisMonth = 12; analysisYear-- }
      updateMonthLabel()
      render(activePeriod)
    })
    document.getElementById('analysisNextMonth').addEventListener('click', () => {
      analysisMonth++
      if (analysisMonth > 12) { analysisMonth = 1; analysisYear++ }
      updateMonthLabel()
      render(activePeriod)
    })

    // ── Cuenta ───────────────────────────────────────────────────────────
    document.getElementById('accountFilterAnalysis').addEventListener('change', () => {
      render(activePeriod)
    })

    // ── Modal de ayuda ───────────────────────────────────────────────────
    document.addEventListener('click', e => {
      const btn = e.target.closest('[data-help]')
      if (!btn) return
      const key  = btn.dataset.help
      const info = HELP_TEXTS[key]
      if (!info) return
      document.getElementById('analysisHelpTitle').innerHTML =
        `<i class="ti ti-help-circle" style="color:var(--accent)"></i> ${info.title}`
      document.getElementById('analysisHelpText').textContent = info.text
      document.getElementById('analysisHelpModal').classList.remove('hidden')
    })
    document.getElementById('closeAnalysisHelp').addEventListener('click', () => {
      document.getElementById('analysisHelpModal').classList.add('hidden')
    })
    document.getElementById('analysisHelpModal').addEventListener('click', e => {
      if (e.target === document.getElementById('analysisHelpModal'))
        document.getElementById('analysisHelpModal').classList.add('hidden')
    })
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape')
        document.getElementById('analysisHelpModal')?.classList.add('hidden')
    })
  }

  function rerender() {
    updateMonthLabel()
    render(activePeriod)
  }

  return { init, rerender }
})()
