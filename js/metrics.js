// Metrics / KPI calculations and rendering
const Metrics = (() => {
  let allTrades = []
  let allSesiones = []

  function calcStreak(trades) {
    // Group by date, determine daily result (overall win/loss)
    const byDate = {}
    trades.forEach(t => {
      const d = t.trade_date
      if (!d) return
      if (!byDate[d]) byDate[d] = []
      byDate[d].push(t)
    })
    const dates = Object.keys(byDate).sort()
    if (dates.length === 0) return { count: 0, type: 'none' }

    const results = dates.map(d => {
      const ts = byDate[d]
      const pnl = ts.reduce((s, t) => s + (parseFloat(t.profit) || 0), 0)
      return pnl >= 0 ? 'win' : 'loss'
    })

    const last = results[results.length - 1]
    let count = 0
    for (let i = results.length - 1; i >= 0; i--) {
      if (results[i] === last) count++
      else break
    }
    return { count, type: last }
  }

  function bestWorstDay(trades) {
    const byDate = {}
    trades.forEach(t => {
      const d = t.trade_date
      if (!d) return
      byDate[d] = (byDate[d] || 0) + (parseFloat(t.profit) || 0)
    })
    const entries = Object.entries(byDate)
    if (entries.length === 0) return { best: null, worst: null }
    entries.sort((a, b) => b[1] - a[1])
    return { best: entries[0], worst: entries[entries.length - 1] }
  }

  function cleanSessions(sesiones) {
    return sesiones.filter(s =>
      s.chk_zonas && s.chk_orden && s.chk_5velas && s.chk_noticias && s.chk_consecucion && s.chk_estructura
    ).length
  }

  function errorFrequency(sesiones) {
    const counts = {
      'Zonas': 0, 'Orden': 0, '5 Velas': 0, 'Noticias': 0, 'Consecución': 0, 'Estructura': 0
    }
    sesiones.forEach(s => {
      if (!s.chk_zonas) counts['Zonas']++
      if (!s.chk_orden) counts['Orden']++
      if (!s.chk_5velas) counts['5 Velas']++
      if (!s.chk_noticias) counts['Noticias']++
      if (!s.chk_consecucion) counts['Consecución']++
      if (!s.chk_estructura) counts['Estructura']++
    })
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1])
    return sorted[0][1] > 0 ? sorted[0] : null
  }

  function calcProfitFactor(trades) {
    const grossWin = trades.filter(t => (parseFloat(t.profit) || 0) > 0)
      .reduce((s, t) => s + parseFloat(t.profit), 0)
    const grossLoss = Math.abs(trades.filter(t => (parseFloat(t.profit) || 0) < 0)
      .reduce((s, t) => s + parseFloat(t.profit), 0))
    if (grossLoss === 0) return grossWin > 0 ? null : null
    return grossWin / grossLoss
  }

  function calcAvgWinLoss(trades) {
    const wins = trades.filter(t => (parseFloat(t.profit) || 0) > 0)
    const losses = trades.filter(t => (parseFloat(t.profit) || 0) < 0)
    const avgWin = wins.length > 0
      ? wins.reduce((s, t) => s + parseFloat(t.profit), 0) / wins.length : null
    const avgLoss = losses.length > 0
      ? Math.abs(losses.reduce((s, t) => s + parseFloat(t.profit), 0) / losses.length) : null
    return { avgWin, avgLoss }
  }

  function calcMaxDrawdown(trades) {
    if (trades.length === 0) return 0
    const sorted = [...trades].sort((a, b) => {
      const ka = `${a.trade_date || ''} ${a.entry_time || ''}`
      const kb = `${b.trade_date || ''} ${b.entry_time || ''}`
      return ka.localeCompare(kb)
    })
    let peak = 0, cumPnl = 0, maxDD = 0
    sorted.forEach(t => {
      cumPnl += parseFloat(t.profit) || 0
      if (cumPnl > peak) peak = cumPnl
      const dd = peak - cumPnl
      if (dd > maxDD) maxDD = dd
    })
    return maxDD
  }

  function filterByPeriod(trades, sesiones, period) {
    if (period === 'all') return { trades, sesiones }
    const now = new Date()
    let from
    if (period === 'month') {
      from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
    } else { // week
      const d = new Date(now)
      d.setDate(d.getDate() - d.getDay() + 1) // Monday
      from = d.toISOString().slice(0, 10)
    }
    return {
      trades: trades.filter(t => (t.trade_date || '') >= from),
      sesiones: sesiones.filter(s => s.sesion_date >= from),
    }
  }

  function render(period = 'all') {
    const { trades, sesiones } = filterByPeriod(allTrades, allSesiones, period)

    const totalTrades = trades.length
    const targets = trades.filter(t => t.resultado === 'target').length
    const stops = trades.filter(t => t.resultado === 'stop').length
    const winRate = totalTrades > 0 ? (targets / totalTrades * 100).toFixed(1) : 0
    const netPnl = trades.reduce((s, t) => s + (parseFloat(t.profit) || 0), 0)
    const streak = calcStreak(trades)
    const { best, worst } = bestWorstDay(trades)
    const clean = cleanSessions(sesiones)
    const topError = errorFrequency(sesiones)
    const tradingDays = new Set(trades.map(t => t.trade_date)).size
    const avgPnl = tradingDays > 0 ? (netPnl / tradingDays) : 0
    const pf = calcProfitFactor(trades)
    const { avgWin, avgLoss } = calcAvgWinLoss(trades)
    const maxDD = calcMaxDrawdown(trades)
    const activeSesiones = sesiones.filter(s => !s.no_opero)
    const disciplinePct = activeSesiones.length > 0
      ? Math.round(activeSesiones.reduce((sum, s) => {
          return sum + [s.chk_zonas, s.chk_orden, s.chk_5velas, s.chk_noticias, s.chk_consecucion, s.chk_estructura]
            .filter(Boolean).length / 6
        }, 0) / activeSesiones.length * 100)
      : 0

    const cards = [
      { label: 'P&L Neto Total', value: `${netPnl >= 0 ? '+' : ''}$${netPnl.toFixed(2)}`, icon: 'ti-currency-dollar', color: netPnl >= 0 ? 'green' : 'red', sub: `Promedio: ${avgPnl >= 0 ? '+' : ''}$${avgPnl.toFixed(0)}/día` },
      { label: 'Tasa de Acierto', value: `${winRate}%`, icon: 'ti-target', color: parseFloat(winRate) >= 50 ? 'green' : 'red', sub: `${targets} targets / ${stops} stops` },
      { label: 'Total Trades', value: totalTrades, icon: 'ti-list-numbers', color: 'neutral', sub: `${tradingDays} días operados` },
      { label: 'Racha actual', value: streak.count > 0 ? `${streak.count} ${streak.type === 'win' ? '🟢' : '🔴'}` : '—', icon: 'ti-flame', color: streak.type === 'win' ? 'green' : 'red', sub: streak.type === 'win' ? 'victorias seguidas' : streak.type === 'loss' ? 'pérdidas seguidas' : '' },
      { label: 'Mejor día', value: best ? `+$${best[1].toFixed(0)}` : '—', icon: 'ti-trending-up', color: 'green', sub: best ? best[0] : '' },
      { label: 'Peor día', value: worst ? `$${worst[1].toFixed(0)}` : '—', icon: 'ti-trending-down', color: 'red', sub: worst ? worst[0] : '' },
      { label: 'Disciplina', value: `${disciplinePct}%`, icon: 'ti-checkup-list', color: disciplinePct >= 80 ? 'green' : disciplinePct >= 50 ? 'neutral' : 'red', sub: `${clean}/${activeSesiones.length} sesiones limpias` },
      { label: 'Error más frecuente', value: topError ? topError[0] : '—', icon: 'ti-alert-triangle', color: 'warning', sub: topError ? `${topError[1]} veces incumplido` : 'Sin datos' },
      {
        label: 'Profit Factor',
        value: pf != null ? pf.toFixed(2) : '—',
        icon: 'ti-math-function',
        color: pf == null ? 'neutral' : pf >= 2 ? 'green' : pf >= 1 ? 'neutral' : 'red',
        sub: pf != null ? (pf >= 2 ? 'Sistema sólido' : pf >= 1 ? 'Sistema marginal' : 'Sistema negativo') : 'Sin pérdidas en el período',
      },
      {
        label: 'Avg Win / Avg Loss',
        value: avgWin != null && avgLoss != null ? `$${avgWin.toFixed(0)} / $${avgLoss.toFixed(0)}` : avgWin != null ? `$${avgWin.toFixed(0)} / —` : '—',
        icon: 'ti-arrows-diff',
        color: avgWin != null && avgLoss != null && avgWin >= avgLoss ? 'green' : 'neutral',
        sub: avgWin != null && avgLoss != null ? `Ratio: ${(avgWin / avgLoss).toFixed(2)}x` : 'Sin datos suficientes',
      },
      {
        label: 'Max Drawdown',
        value: maxDD > 0 ? `-$${maxDD.toFixed(2)}` : '$0',
        icon: 'ti-chart-arrows-vertical',
        color: maxDD === 0 ? 'green' : maxDD < 200 ? 'neutral' : 'red',
        sub: 'Máxima caída desde pico',
      },
    ]

    document.getElementById('metricsGrid').innerHTML = cards.map(c => `
      <div class="metric-card">
        <div class="metric-icon color-${c.color}">
          <i class="ti ${c.icon}"></i>
        </div>
        <div class="metric-body">
          <div class="metric-label">${c.label}</div>
          <div class="metric-value color-${c.color}">${c.value}</div>
          ${c.sub ? `<div class="metric-sub">${c.sub}</div>` : ''}
        </div>
      </div>`).join('')
  }

  async function init() {
    [allTrades, allSesiones] = await Promise.all([DB.getTrades(), DB.getSesiones()])
    render('month')

    document.querySelectorAll('.period-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'))
        btn.classList.add('active')
        render(btn.dataset.period)
      })
    })
  }

  return { init, reload: init }
})()
