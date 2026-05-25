// Chart.js visualizations — con filtros, KPI strip y soporte B.E.
const Charts = (() => {
  let allTrades   = []
  let allSesiones = []
  const instances = {}

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

  function filterByPeriod(trades, sesiones, period) {
    if (period === 'all') return { trades, sesiones }
    const y = typeof Calendar !== 'undefined' ? Calendar.getYear() : new Date().getFullYear()
    const m = typeof Calendar !== 'undefined' ? Calendar.getMonth() : new Date().getMonth() + 1
    if (period === 'month') {
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

  // ── KPI Strip ─────────────────────────────────────────────────────────────

  function renderKpiStrip(trades) {
    const nonBE  = trades.filter(t => !isBreakEven(t))
    const beCount = trades.filter(t => isBreakEven(t)).length
    const targets = nonBE.filter(t => t.resultado === 'target').length
    const stops   = nonBE.filter(t => t.resultado === 'stop').length
    const winRate = nonBE.length > 0 ? (targets / nonBE.length * 100).toFixed(1) : '0.0'
    const netPnl  = trades.reduce((s,t) => s + (parseFloat(t.profit)||0), 0)

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

    const chip = (label, val, cls='kpi-neutral') => `
      <div class="analysis-kpi">
        <span class="analysis-kpi-label">${label}</span>
        <span class="analysis-kpi-value ${cls}">${val}</span>
      </div>`

    document.getElementById('analysisKpiStrip').innerHTML = `
      <div class="analysis-kpi-row">
        ${chip('P&L Neto', `${netPnl>=0?'+':''}$${netPnl.toFixed(0)}`, netPnl>=0?'kpi-green':'kpi-red')}
        ${chip('Trades', `${nonBE.length}${beCount>0?` <small style="color:var(--text3);font-weight:400">+${beCount} B.E.</small>`:''}`, 'kpi-neutral')}
        ${chip('Win Rate', `${winRate}%`, parseFloat(winRate)>=50?'kpi-green':'kpi-red')}
        ${chip('Profit Factor', pf, pfColor)}
        ${chip('Avg Win', `$${avgWin}`, 'kpi-green')}
        ${chip('Avg Loss', `$${avgLoss}`, 'kpi-red')}
        ${avgEtd !== null ? chip('ETD medio', `$${avgEtd}`, parseFloat(avgEtd)<=15?'kpi-neutral':'kpi-red') : ''}
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
    const data = dates.map(d => { cum += byDate[d]; return parseFloat(cum.toFixed(2)) })
    const lastVal = data[data.length-1] || 0
    const ctx  = document.getElementById('equityChart').getContext('2d')
    const grad = ctx.createLinearGradient(0,0,0,300)
    grad.addColorStop(0, 'rgba(29,158,117,0.3)')
    grad.addColorStop(1, 'rgba(29,158,117,0)')
    instances.equity = new Chart(ctx, {
      type: 'line',
      data: {
        labels: dates,
        datasets: [{
          label: 'P&L Acumulado',
          data,
          borderColor: lastVal>=0 ? COLORS.accent : COLORS.red,
          backgroundColor: lastVal>=0 ? grad : 'rgba(226,75,74,0.1)',
          borderWidth: 2,
          pointRadius: dates.length > 30 ? 0 : 3,
          tension: 0.3,
          fill: true,
        }]
      },
      options: { ...baseOptions, plugins: { ...baseOptions.plugins, legend: { display: false } } },
    })
  }

  // ── Win Rate por semana (excluye B.E.) ────────────────────────────────────

  function getWeekKey(dateStr) {
    const d = new Date(dateStr + 'T12:00:00')
    const day = d.getDay() || 7
    d.setDate(d.getDate() - day + 1)
    return d.toISOString().slice(0,10)
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
          label: 'Win Rate % (ex-B.E.)',
          data: sorted.map(w => parseFloat((weeks[w].win/weeks[w].total*100).toFixed(1))),
          backgroundColor: sorted.map(w => weeks[w].win/weeks[w].total>=0.5
            ? 'rgba(29,158,117,0.7)' : 'rgba(226,75,74,0.7)'),
          borderRadius: 4,
        }]
      },
      options: { ...baseOptions, scales: { ...baseOptions.scales,
        y: { ...baseOptions.scales.y, max:100, ticks:{ color:COLORS.text, callback:v=>v+'%' } } } },
    })
  }

  // ── P&L promedio por día de semana ────────────────────────────────────────

  function renderPnlByDay(trades) {
    destroy('pnlByDay')
    const DAYS = ['Lun','Mar','Mié','Jue','Vie']
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
        datasets: [{ label:'P&L promedio', data:avgs,
          backgroundColor: avgs.map(v=>v>=0?'rgba(29,158,117,0.7)':'rgba(226,75,74,0.7)'),
          borderRadius:4 }]
      },
      options: baseOptions,
    })
  }

  // ── P&L promedio por hora del día (nuevo) ─────────────────────────────────

  function renderPnlByHour(trades) {
    destroy('pnlByHour')
    // Slots de 30 min desde 09:30 hasta 15:00 hora ET (UTC-5 en Colombia = mismo offset RTH)
    const slots = {}
    for (let h=9; h<=14; h++) {
      for (let min=0; min<60; min+=30) {
        if (h===9 && min<30) continue  // RTH abre 9:30
        const key = `${String(h).padStart(2,'0')}:${min===0?'00':'30'}`
        slots[key] = []
      }
    }
    slots['15:00'] = []

    trades.forEach(t => {
      if (!t.entry_time) return
      const [h,m] = t.entry_time.split(':').map(Number)
      if (h<9 || h>15) return
      // Redondear al slot de 30 min más cercano hacia abajo
      const slotMin  = m < 30 ? 0 : 30
      const slotH    = h
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
        datasets: [{ label:'P&L promedio/trade', data:avgs,
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

  // ── Disciplina por sesión ─────────────────────────────────────────────────

  function renderDiscipline(sesiones) {
    destroy('discipline')
    const active = sesiones.filter(s => !s.no_opero).slice().reverse()
    const labels = active.map(s => s.sesion_date?.slice(5))
    const scores = active.map(s => {
      const checks = [s.chk_zonas,s.chk_orden,s.chk_5velas,s.chk_noticias,s.chk_consecucion,s.chk_estructura]
      return Math.round(checks.filter(Boolean).length/6*100)
    })
    instances.discipline = new Chart(document.getElementById('disciplineChart'), {
      type: 'line',
      data: { labels, datasets: [{
        label:'Disciplina %', data:scores,
        borderColor:COLORS.accent, backgroundColor:'rgba(29,158,117,0.1)',
        borderWidth:2, pointRadius:3, tension:0.2, fill:true,
      }]},
      options: { ...baseOptions, scales: { ...baseOptions.scales,
        y:{ ...baseOptions.scales.y, min:0, max:100, ticks:{ color:COLORS.text, callback:v=>v+'%' } } } },
    })
  }

  // ── Render principal ──────────────────────────────────────────────────────

  function render(period = 'month') {
    const accountVal = document.getElementById('accountFilterAnalysis')?.value || 'all'
    const accountFiltered = accountVal==='all'
      ? allTrades
      : allTrades.filter(t => abbreviateAccount(t.account)===accountVal)
    const { trades, sesiones } = filterByPeriod(accountFiltered, allSesiones, period)

    renderKpiStrip(trades)
    renderEquity(trades)
    renderWinRate(trades)
    renderPnlByDay(trades)
    renderPnlByHour(trades)
    renderMaeMfe(trades)
    renderResults(trades)
    renderDiscipline(sesiones)
  }

  async function init() {
    ;[allTrades, allSesiones] = await Promise.all([DB.getTrades(), DB.getSesiones()])
    buildAccountFilter()
    render('month')

    document.querySelectorAll('#section-analysis .period-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#section-analysis .period-btn').forEach(b => b.classList.remove('active'))
        btn.classList.add('active')
        render(btn.dataset.period)
      })
    })
    document.getElementById('accountFilterAnalysis').addEventListener('change', () => {
      const active = document.querySelector('#section-analysis .period-btn.active')
      render(active?.dataset.period || 'month')
    })
  }

  return { init }
})()
