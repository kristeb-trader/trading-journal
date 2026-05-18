// Calendar component
const Calendar = (() => {
  let currentYear = new Date().getFullYear()
  let currentMonth = new Date().getMonth() + 1 // 1-based
  let tradesCache = {}   // date → [trades]
  let sesionesCache = {} // date → sesion
  let allTradesRaw = []  // sin filtrar por cuenta

  function abbreviateAccount(account) {
    if (!account) return '—'
    const parts = account.split('-')
    return parts.length > 2 ? parts.slice(0, 2).join('-') : account
  }

  function buildAccountFilterCalendar(trades) {
    const accounts = {}
    trades.forEach(t => {
      if (!t.account) return
      const abbr = abbreviateAccount(t.account)
      accounts[abbr] = true
    })
    const sel = document.getElementById('accountFilterCalendar')
    const prev = sel.value
    sel.innerHTML = '<option value="all">Todas las cuentas</option>' +
      Object.keys(accounts).sort().map(a => `<option value="${a}">${a}</option>`).join('')
    const paApex = Object.keys(accounts).find(a => a.startsWith('PA-APEX'))
    if (prev && prev !== 'all') sel.value = prev
    else if (paApex) sel.value = paApex
  }

  const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
    'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
  const DAYS_ES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Semana']

  function dayResult(trades, sesion) {
    if (sesion?.no_opero) {
      return sesion.motivo_no_opero === 'Sin setup' ? 'sin-setup' : 'no-trade'
    }
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

    allTradesRaw = trades
    buildAccountFilterCalendar(trades)

    const accountVal = document.getElementById('accountFilterCalendar').value
    const filteredTrades = accountVal === 'all'
      ? trades
      : trades.filter(t => abbreviateAccount(t.account) === accountVal)

    tradesCache = {}
    filteredTrades.forEach(t => {
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

    let weekNum = 0
    while (ptr <= lastDate) {
      weekNum++
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
          ? `<div class="cal-count">${trades.length} trade${trades.length !== 1 ? 's' : ''}</div>` : ''
        const clickable = !isFuture ? `data-date="${dateStr}" style="cursor:pointer"` : ''

        let statusBadge = ''
        if (!isFuture && sesion?.no_opero) {
          if (sesion.motivo_no_opero === 'Sin setup') {
            statusBadge = `<div class="cal-status-badge badge-sinsetup"><i class="ti ti-eye-off"></i> Sin entradas</div>`
          } else {
            statusBadge = `<div class="cal-status-badge badge-noopero"><i class="ti ti-user-off"></i> No operé</div>`
          }
        }

        html += `
          <div class="${cellClass}" ${clickable}>
            <div class="cal-day-num">${parseInt(dateStr.slice(8))}</div>
            ${pnlHtml}
            ${tradeCount}
            ${statusBadge}
          </div>`
      }

      // Celda resumen semanal
      const hasMonthDays = weekDays.some(d => d.inMonth)
      if (hasMonthDays) {
        if (weekTrades > 0) {
          html += `
            <div class="cal-cell cal-week-summary ${weekPnl >= 0 ? 'week-positive' : 'week-negative'}">
              <div class="week-label">Semana ${weekNum}</div>
              <div class="week-pnl ${weekPnl >= 0 ? 'positive' : 'negative'}">${weekPnl >= 0 ? '+' : ''}$${weekPnl.toFixed(0)}</div>
              <div class="week-trades">${weekTrades} trade${weekTrades !== 1 ? 's' : ''}</div>
            </div>`
        } else {
          html += `
            <div class="cal-cell cal-week-summary week-empty">
              <div class="week-label">Semana ${weekNum}</div>
              <div class="week-pnl" style="color:var(--text3)">—</div>
            </div>`
        }
      } else {
        html += `<div class="cal-cell empty-cell"></div>`
      }
    }

    // Total mensual en columna Semana (fila extra al final del grid)
    const totalPnl = Object.values(tradesCache).flat()
      .reduce((s, t) => s + (parseFloat(t.profit) || 0), 0)
    const monthName = MONTHS_ES[currentMonth - 1]
    for (let i = 0; i < 5; i++) html += `<div class="cal-cell empty-cell"></div>`
    html += `
      <div class="cal-cell cal-week-summary cal-month-total ${totalPnl >= 0 ? 'week-positive' : 'week-negative'}">
        <div class="cal-totalpnl-icon ${totalPnl >= 0 ? '' : 'negative'}">
          <i class="ti ti-currency-dollar"></i>
        </div>
        <div class="week-label">P&amp;L Neto</div>
        <div class="week-pnl ${totalPnl >= 0 ? 'positive' : 'negative'} month-total-amount">${totalPnl >= 0 ? '+' : ''}$${totalPnl.toFixed(2)}</div>
        <div class="week-trades">${monthName} ${currentYear}</div>
      </div>`

    grid.innerHTML = html
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
    let disciplineChip = ''
    if (monthSesiones.length > 0) {
      const avg = monthSesiones.reduce((sum, s) => {
        return sum + [s.chk_zonas, s.chk_orden, s.chk_5velas, s.chk_noticias, s.chk_consecucion, s.chk_estructura]
          .filter(Boolean).length / 6
      }, 0) / monthSesiones.length
      const pct = Math.round(avg * 100)
      const cls = pct >= 80 ? 'chip-green' : pct >= 50 ? '' : 'chip-red'
      disciplineChip = `<span class="ms-chip ${cls}"><i class="ti ti-checkup-list"></i> ${pct}% Disciplina</span>`
    }

    // Error más frecuente del mes
    let errorChip = ''
    if (monthSesiones.length > 0) {
      const keys   = ['chk_zonas','chk_orden','chk_5velas','chk_noticias','chk_consecucion','chk_estructura']
      const labels = ['Zonas','Orden','5 Velas','Noticias','Consecución','Estructura']
      const counts = {}
      labels.forEach(l => counts[l] = 0)
      monthSesiones.forEach(s => keys.forEach((k, i) => { if (!s[k]) counts[labels[i]]++ }))
      const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]
      if (top[1] > 0) {
        errorChip = `<span class="ms-chip chip-warning"><i class="ti ti-alert-triangle"></i> ${top[0]} (${top[1]}x)</span>`
      }
    }

    document.getElementById('monthlySummary').innerHTML = `
      <div class="ms-left">
        <div class="ms-title"><i class="ti ti-chart-bar"></i> Month Summary</div>
        <div class="ms-chips">
          <span class="ms-chip ${parseFloat(winRate) >= 50 ? 'chip-green' : 'chip-red'}">
            <i class="ti ti-target"></i> ${winRate}% Win Rate
          </span>
          <span class="ms-chip">
            <i class="ti ti-list-numbers"></i> ${allTrades.length} trades · ${tradingDays} días
          </span>
          <span class="ms-chip">
            <i class="ti ti-arrows-split-2"></i>
            <span class="text-green">${targets}T</span>&nbsp;/&nbsp;<span class="text-red">${stops}S</span>
          </span>
          ${disciplineChip}
          ${errorChip}
        </div>
      </div>
      <div class="ms-right">
        <div class="ms-label">NET P&amp;L</div>
        <div class="ms-pnl ${totalPnl >= 0 ? 'positive' : 'negative'}">${totalPnl >= 0 ? '+' : ''}$${totalPnl.toFixed(2)}</div>
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
    document.getElementById('accountFilterCalendar').addEventListener('change', () => load())
    load()
  }

  return { init, load }
})()
