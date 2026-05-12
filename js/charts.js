// Chart.js visualizations
const Charts = (() => {
  const instances = {}

  const COLORS = {
    accent: '#1D9E75',
    red: '#E24B4A',
    warning: '#BA7517',
    dim: '#4a4a45',
    grid: 'rgba(255,255,255,0.06)',
    text: '#9B9B8E',
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

  // ── Equity Curve ─────────────────────────────────────────────────────────

  function buildEquity(trades) {
    const byDate = {}
    trades.forEach(t => {
      const d = t.trade_date || t.entry_time?.slice(0, 10)
      if (!d) return
      byDate[d] = (byDate[d] || 0) + (parseFloat(t.profit) || 0)
    })
    const dates = Object.keys(byDate).sort()
    let cum = 0
    const labels = dates
    const data = dates.map(d => { cum += byDate[d]; return parseFloat(cum.toFixed(2)) })
    return { labels, data }
  }

  function renderEquity(trades) {
    destroy('equity')
    const { labels, data } = buildEquity(trades)
    const lastVal = data[data.length - 1] || 0
    const ctx = document.getElementById('equityChart').getContext('2d')
    const grad = ctx.createLinearGradient(0, 0, 0, 300)
    grad.addColorStop(0, 'rgba(29,158,117,0.3)')
    grad.addColorStop(1, 'rgba(29,158,117,0)')
    instances.equity = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'P&L Acumulado',
          data,
          borderColor: lastVal >= 0 ? COLORS.accent : COLORS.red,
          backgroundColor: lastVal >= 0 ? grad : 'rgba(226,75,74,0.1)',
          borderWidth: 2,
          pointRadius: labels.length > 30 ? 0 : 3,
          tension: 0.3,
          fill: true,
        }]
      },
      options: { ...baseOptions, plugins: { ...baseOptions.plugins, legend: { display: false } } },
    })
  }

  // ── Win Rate por semana ───────────────────────────────────────────────────

  function getWeekKey(dateStr) {
    const d = new Date(dateStr + 'T12:00:00')
    const day = d.getDay() || 7
    d.setDate(d.getDate() - day + 1)
    return d.toISOString().slice(0, 10)
  }

  function renderWinRate(trades) {
    destroy('winRate')
    const weeks = {}
    trades.forEach(t => {
      const d = t.trade_date || t.entry_time?.slice(0, 10)
      if (!d) return
      const wk = getWeekKey(d)
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
          label: 'Win rate %',
          data: sorted.map(w => parseFloat((weeks[w].win / weeks[w].total * 100).toFixed(1))),
          backgroundColor: sorted.map(w => weeks[w].win / weeks[w].total >= 0.5 ? 'rgba(29,158,117,0.7)' : 'rgba(226,75,74,0.7)'),
          borderRadius: 4,
        }]
      },
      options: { ...baseOptions, scales: { ...baseOptions.scales, y: { ...baseOptions.scales.y, max: 100, ticks: { color: COLORS.text, callback: v => v + '%' } } } },
    })
  }

  // ── P&L por día de la semana ──────────────────────────────────────────────

  function renderPnlByDay(trades) {
    destroy('pnlByDay')
    const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie']
    const buckets = { 1: [], 2: [], 3: [], 4: [], 5: [] }
    trades.forEach(t => {
      const d = t.trade_date || t.entry_time?.slice(0, 10)
      if (!d) return
      const dow = new Date(d + 'T12:00:00').getDay()
      if (dow >= 1 && dow <= 5) buckets[dow].push(parseFloat(t.profit) || 0)
    })
    const avgs = [1, 2, 3, 4, 5].map(d => {
      const vals = buckets[d]
      return vals.length > 0 ? parseFloat((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2)) : 0
    })
    instances.pnlByDay = new Chart(document.getElementById('pnlByDayChart'), {
      type: 'bar',
      data: {
        labels: DAYS,
        datasets: [{
          label: 'P&L promedio',
          data: avgs,
          backgroundColor: avgs.map(v => v >= 0 ? 'rgba(29,158,117,0.7)' : 'rgba(226,75,74,0.7)'),
          borderRadius: 4,
        }]
      },
      options: baseOptions,
    })
  }

  // ── MAE vs MFE Scatter ────────────────────────────────────────────────────

  function renderMaeMfe(trades) {
    destroy('maeMfe')
    const targets = trades.filter(t => t.resultado === 'target' && t.mae != null && t.mfe != null)
    const stops = trades.filter(t => t.resultado === 'stop' && t.mae != null && t.mfe != null)
    instances.maeMfe = new Chart(document.getElementById('maeMfeChart'), {
      type: 'scatter',
      data: {
        datasets: [
          { label: 'Target', data: targets.map(t => ({ x: parseFloat(t.mae), y: parseFloat(t.mfe) })), backgroundColor: 'rgba(29,158,117,0.6)', pointRadius: 5 },
          { label: 'Stop', data: stops.map(t => ({ x: parseFloat(t.mae), y: parseFloat(t.mfe) })), backgroundColor: 'rgba(226,75,74,0.6)', pointRadius: 5 },
        ]
      },
      options: {
        ...baseOptions,
        scales: {
          x: { ...baseOptions.scales.x, title: { display: true, text: 'MAE (pts adversos)', color: COLORS.text } },
          y: { ...baseOptions.scales.y, title: { display: true, text: 'MFE (pts favorables)', color: COLORS.text } },
        },
      },
    })
  }

  // ── Distribución de resultados ────────────────────────────────────────────

  function renderResults(trades) {
    destroy('results')
    const targets = trades.filter(t => t.resultado === 'target').length
    const stops = trades.filter(t => t.resultado === 'stop').length
    const otros = trades.filter(t => t.resultado !== 'target' && t.resultado !== 'stop').length
    instances.results = new Chart(document.getElementById('resultsChart'), {
      type: 'doughnut',
      data: {
        labels: ['Target', 'Stop', 'Otro'],
        datasets: [{ data: [targets, stops, otros], backgroundColor: ['rgba(29,158,117,0.8)', 'rgba(226,75,74,0.8)', 'rgba(74,74,69,0.8)'], borderWidth: 0 }]
      },
      options: { ...baseOptions, scales: {} },
    })
  }

  // ── Disciplina por sesión ─────────────────────────────────────────────────

  function renderDiscipline(sesiones) {
    destroy('discipline')
    const active = sesiones.filter(s => !s.no_opero).slice().reverse()
    const labels = active.map(s => s.sesion_date?.slice(5))
    const scores = active.map(s => {
      const checks = [s.chk_zonas, s.chk_orden, s.chk_5velas, s.chk_noticias, s.chk_consecucion, s.chk_estructura]
      return Math.round(checks.filter(Boolean).length / 6 * 100)
    })
    instances.discipline = new Chart(document.getElementById('disciplineChart'), {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Disciplina %',
          data: scores,
          borderColor: COLORS.accent,
          backgroundColor: 'rgba(29,158,117,0.1)',
          borderWidth: 2,
          pointRadius: 3,
          tension: 0.2,
          fill: true,
        }]
      },
      options: { ...baseOptions, scales: { ...baseOptions.scales, y: { ...baseOptions.scales.y, min: 0, max: 100, ticks: { color: COLORS.text, callback: v => v + '%' } } } },
    })
  }

  async function init() {
    const [trades, sesiones] = await Promise.all([DB.getTrades(), DB.getSesiones()])
    renderEquity(trades)
    renderWinRate(trades)
    renderPnlByDay(trades)
    renderMaeMfe(trades)
    renderResults(trades)
    renderDiscipline(sesiones)
  }

  return { init }
})()
