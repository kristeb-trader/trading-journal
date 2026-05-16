// Calendar component
const Calendar = (() => {
  let currentYear = new Date().getFullYear()
  let currentMonth = new Date().getMonth() + 1 // 1-based
  let tradesCache = {}   // date → [trades]
  let sesionesCache = {} // date → sesion

  const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
    'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
  const DAYS_ES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Semana']

  function dayResult(trades, sesion) {
    if (sesion?.no_opero) return 'no-trade'
    if (!trades || trades.length === 0) return 'empty'
    const targets = trades.filter(t => t.resultado === 'target').length
    const stops = trades.filter(t => t.resultado === 'stop').length
    if (targets > 0 && stops === 0) return 'target'
    if (stops > 0 && targets === 0) return 'stop'
    if (targets > 0 && stops > 0) return 'mixed'
    return 'other'
  }

  function dayPnl(trades) {
    if (!trades || trades.length === 0) return null
    return trades.reduce((sum, t) => sum + (parseFloat(t.profit) || 0), 0)
  }

  async function load() {
    const [trades, sesiones] = await Promise.all([
      DB.getTradesByMonth(currentYear, currentMonth),
      DB.getSesiones(),
    ])

    tradesCache = {}
    trades.forEach(t => {
      const d = t.trade_date || t.entry_time?.slice(0, 10)
      if (!d) return
      if (!tradesCache[d]) tradesCache[d] = []
      tradesCache[d].push(t)
    })

    sesionesCache = {}
    sesiones.forEach(s => { sesionesCache[s.sesion_date] = s })

    render()
  }

  function render() {
    const grid = document.getElementById('calendarGrid')
    const title = document.getElementById('calendarTitle')
    title.textContent = `${MONTHS_ES[currentMonth - 1]} ${currentYear}`

    // Headers: Lun–Vie + Semana
    let html = DAYS_ES.map((d, i) =>
      `<div class="cal-header${i === 5 ? ' cal-header-week' : ''}">${d}</div>`
    ).join('')

    const today = new Date().toISOString().slice(0, 10)
    const lastDate = new Date(currentYear, currentMonth, 0) // último día del mes

    // Encontrar el lunes de la primera semana que contenga días del mes
    let ptr = new Date(currentYear, currentMonth - 1, 1)
    let dow = ptr.getDay()
    if (dow === 0) dow = 7 // Dom=7
    ptr.setDate(ptr.getDate() - (dow - 1)) // retroceder al lunes

    while (ptr <= lastDate) {
      const weekDays = []
      let weekPnl = 0
      let weekTrades = 0

      for (let d = 0; d < 5; d++) {
        const dateStr = `${ptr.getFullYear()}-${String(ptr.getMonth()+1).padStart(2,'0')}-${String(ptr.getDate()).padStart(2,'0')}`
        const inMonth = ptr.getMonth() === currentMonth - 1 && ptr.getFullYear() === currentYear
        weekDays.push({ dateStr, inMonth })
        if (inMonth) {
          const trades = tradesCache[dateStr] || []
          weekPnl += trades.reduce((s, t) => s + (parseFloat(t.profit) || 0), 0)
          weekTrades += trades.length
        }
        ptr.setDate(ptr.getDate() + 1)
      }
      ptr.setDate(ptr.getDate() + 2) // saltar sábado y domingo

      // Celdas de los 5 días
      for (const { dateStr, inMonth } of weekDays) {
        if (!inMonth) { html += `<div class="cal-cell empty-cell"></div>`; continue }

        const trades = tradesCache[dateStr] || []
        const sesion = sesionesCache[dateStr]
        const isFuture = dateStr > today
        const isToday = dateStr === today

        let cellClass = 'cal-cell'
        if (isFuture) cellClass += ' future'
        else cellClass += ` day-${dayResult(trades, sesion)}`
        if (isToday) cellClass += ' today'

        const pnl = dayPnl(trades)
        const pnlHtml = pnl !== null
          ? `<div class="cal-pnl ${pnl >= 0 ? 'positive' : 'negative'}">${pnl >= 0 ? '+' : ''}$${pnl.toFixed(0)}</div>`
          : ''
        const tradeCount = trades.length > 0
          ? `<div class="cal-count">${trades.length}t</div>` : ''
        const clickable = !isFuture ? `data-date="${dateStr}" style="cursor:pointer"` : ''

        html += `
          <div class="${cellClass}" ${clickable}>
            <div class="cal-day-num">${parseInt(dateStr.slice(8))}</div>
            ${pnlHtml}
            ${tradeCount}
          </div>`
      }

      // Celda resumen semanal
      const hasMonthDays = weekDays.some(d => d.inMonth)
      if (hasMonthDays) {
        if (weekTrades > 0) {
          html += `
            <div class="cal-cell cal-week-summary ${weekPnl >= 0 ? 'week-positive' : 'week-negative'}">
              <div class="week-label">Sem.</div>
              <div class="week-pnl ${weekPnl >= 0 ? 'positive' : 'negative'}">${weekPnl >= 0 ? '+' : ''}$${weekPnl.toFixed(0)}</div>
              <div class="week-trades">${weekTrades}t</div>
            </div>`
        } else {
          html += `
            <div class="cal-cell cal-week-summary week-empty">
              <div class="week-label">Sem.</div>
              <div class="week-pnl" style="color:var(--text3)">—</div>
            </div>`
        }
      } else {
        html += `<div class="cal-cell empty-cell"></div>`
      }
    }

    grid.innerHTML = html
    renderMonthlySummary()
    grid.querySelectorAll('[data-date]').forEach(cell => {
      cell.addEventListener('click', () => openDayModal(cell.dataset.date))
    })
  }

  function renderMonthlySummary() {
    const allTrades = Object.values(tradesCache).flat()
    const tradingDays = Object.keys(tradesCache).length
    const totalPnl = allTrades.reduce((s, t) => s + (parseFloat(t.profit) || 0), 0)
    const targets = allTrades.filter(t => t.resultado === 'target').length
    const stops = allTrades.filter(t => t.resultado === 'stop').length
    const winRate = allTrades.length > 0 ? (targets / allTrades.length * 100).toFixed(0) : 0

    // Sesiones del mes actual (solo días operados)
    const monthPrefix = `${currentYear}-${String(currentMonth).padStart(2, '0')}`
    const monthSesiones = Object.values(sesionesCache)
      .filter(s => s.sesion_date?.startsWith(monthPrefix) && !s.no_opero)

    // Disciplina mensual
    let disciplineHtml = ''
    if (monthSesiones.length > 0) {
      const avg = monthSesiones.reduce((sum, s) => {
        return sum + [s.chk_zonas, s.chk_orden, s.chk_5velas, s.chk_noticias, s.chk_consecucion, s.chk_estructura]
          .filter(Boolean).length / 6
      }, 0) / monthSesiones.length
      const pct = Math.round(avg * 100)
      const color = pct >= 80 ? 'text-green' : pct >= 50 ? '' : 'text-red'
      disciplineHtml = `
        <div class="summary-stat">
          <span class="stat-label">Disciplina</span>
          <span class="stat-val ${color}">${pct}%</span>
          <span class="stat-sub">${monthSesiones.length} sesiones</span>
        </div>`
    }

    // Error más frecuente del mes
    let errorHtml = ''
    if (monthSesiones.length > 0) {
      const keys   = ['chk_zonas','chk_orden','chk_5velas','chk_noticias','chk_consecucion','chk_estructura']
      const labels = ['Zonas','Orden','5 Velas','Noticias','Consecución','Estructura']
      const counts = {}
      labels.forEach(l => counts[l] = 0)
      monthSesiones.forEach(s => keys.forEach((k, i) => { if (!s[k]) counts[labels[i]]++ }))
      const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]
      if (top[1] > 0) {
        errorHtml = `
          <div class="summary-stat">
            <span class="stat-label">Error frecuente</span>
            <span class="stat-val stat-error">${top[0]}</span>
            <span class="stat-sub">${top[1]}x incumplido</span>
          </div>`
      }
    }

    document.getElementById('monthlySummary').innerHTML = `
      <div class="summary-title">Month Summary</div>
      <div class="summary-stats-grid">
        <div class="summary-stat">
          <span class="stat-label">P&amp;L del mes</span>
          <span class="stat-val stat-pnl ${totalPnl >= 0 ? 'text-green' : 'text-red'}">${totalPnl >= 0 ? '+' : ''}$${totalPnl.toFixed(2)}</span>
        </div>
        <div class="summary-stat">
          <span class="stat-label">Win Rate</span>
          <span class="stat-val ${parseFloat(winRate) >= 50 ? 'text-green' : 'text-red'}">${winRate}%</span>
        </div>
        <div class="summary-stat">
          <span class="stat-label">Trades</span>
          <span class="stat-val">${allTrades.length}</span>
        </div>
        <div class="summary-stat">
          <span class="stat-label">Días operados</span>
          <span class="stat-val">${tradingDays}</span>
        </div>
        <div class="summary-stat">
          <span class="stat-label">Targets / Stops</span>
          <span class="stat-val"><span class="text-green">${targets}</span> / <span class="text-red">${stops}</span></span>
        </div>
        ${disciplineHtml}
        ${errorHtml}
      </div>`
  }

  async function openDayModal(dateStr) {
    const [trades, sesion] = await Promise.all([
      DB.getTradesByDate(dateStr),
      DB.getSesionByDate(dateStr),
    ])
    Modal.openDay(dateStr, trades, sesion)
  }

  function navigate(delta) {
    currentMonth += delta
    if (currentMonth > 12) { currentMonth = 1; currentYear++ }
    if (currentMonth < 1) { currentMonth = 12; currentYear-- }
    load()
  }

  function init() {
    document.getElementById('prevMonth').addEventListener('click', () => navigate(-1))
    document.getElementById('nextMonth').addEventListener('click', () => navigate(1))
    load()
  }

  return { init, load }
})()
