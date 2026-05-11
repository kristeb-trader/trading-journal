// Calendar component
const Calendar = (() => {
  let currentYear = new Date().getFullYear()
  let currentMonth = new Date().getMonth() + 1 // 1-based
  let tradesCache = {}   // date → [trades]
  let sesionesCache = {} // date → sesion

  const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
    'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
  const DAYS_ES = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom']

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

    // Day headers
    let html = DAYS_ES.map(d => `<div class="cal-header">${d}</div>`).join('')

    // First day of month (0=Sun, adjust to Mon=0)
    const firstDate = new Date(currentYear, currentMonth - 1, 1)
    let startOffset = firstDate.getDay() - 1
    if (startOffset < 0) startOffset = 6 // Sunday → offset 6

    for (let i = 0; i < startOffset; i++) html += `<div class="cal-cell empty-cell"></div>`

    const totalDays = new Date(currentYear, currentMonth, 0).getDate()
    const today = new Date().toISOString().slice(0, 10)

    for (let day = 1; day <= totalDays; day++) {
      const dateStr = `${currentYear}-${String(currentMonth).padStart(2,'0')}-${String(day).padStart(2,'0')}`
      const trades = tradesCache[dateStr] || []
      const sesion = sesionesCache[dateStr]
      const dow = new Date(dateStr + 'T12:00:00').getDay() // 0=Sun,6=Sat
      const isWeekend = dow === 0 || dow === 6
      const isFuture = dateStr > today
      const isToday = dateStr === today

      let cellClass = 'cal-cell'
      if (isWeekend) cellClass += ' weekend'
      else if (isFuture) cellClass += ' future'
      else {
        const result = dayResult(trades, sesion)
        cellClass += ` day-${result}`
      }
      if (isToday) cellClass += ' today'

      const pnl = dayPnl(trades)
      const pnlHtml = pnl !== null
        ? `<div class="cal-pnl ${pnl >= 0 ? 'positive' : 'negative'}">${pnl >= 0 ? '+' : ''}$${pnl.toFixed(0)}</div>`
        : ''

      const tradeCount = trades.length > 0 ? `<div class="cal-count">${trades.length} trade${trades.length > 1 ? 's' : ''}</div>` : ''

      const clickable = !isWeekend && !isFuture ? `data-date="${dateStr}" style="cursor:pointer"` : ''

      html += `
        <div class="${cellClass}" ${clickable}>
          <div class="cal-day-num">${day}</div>
          ${pnlHtml}
          ${tradeCount}
        </div>`
    }

    grid.innerHTML = html

    // Monthly summary
    renderMonthlySummary()

    // Click handlers
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

    document.getElementById('monthlySummary').innerHTML = `
      <div class="summary-stat">
        <span class="stat-label">Días operados</span>
        <span class="stat-val">${tradingDays}</span>
      </div>
      <div class="summary-stat">
        <span class="stat-label">Trades</span>
        <span class="stat-val">${allTrades.length}</span>
      </div>
      <div class="summary-stat">
        <span class="stat-label">Win rate</span>
        <span class="stat-val">${winRate}%</span>
      </div>
      <div class="summary-stat">
        <span class="stat-label">P&L del mes</span>
        <span class="stat-val ${totalPnl >= 0 ? 'text-green' : 'text-red'}">${totalPnl >= 0 ? '+' : ''}$${totalPnl.toFixed(2)}</span>
      </div>
      <div class="summary-stat">
        <span class="stat-label">Targets / Stops</span>
        <span class="stat-val"><span class="text-green">${targets}</span> / <span class="text-red">${stops}</span></span>
      </div>
    `
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
