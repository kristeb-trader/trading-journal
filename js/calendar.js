// Calendar component
const Calendar = (() => {
  let currentYear = new Date().getFullYear()
  let currentMonth = new Date().getMonth() + 1 // 1-based
  let tradesCache = {}      // date → [trades]
  let sesionesCache = {}    // date → sesion
  let casuisticasCache = {} // date → true (has errors)
  let allTradesRaw = []     // sin filtrar por cuenta
  let allAccountsList = []  // lista completa de cuentas (cargada una sola vez)
  let cmeHolidays   = new Set() // fechas ISO de festivos CME del mes actual
  let fomcDates     = new Set() // fechas ISO de reuniones FOMC del mes actual

  const ACCOUNT_STORAGE_KEY = 'calendarAccount'

  function abbreviateAccount(account) {
    if (!account) return '—'
    const parts = account.split('-')
    return parts.length > 2 ? parts.slice(0, 2).join('-') : account
  }

  // Reconstruye el dropdown conservando la selección actual (o restaurando desde localStorage)
  function buildAccountFilterCalendar() {
    const sel = document.getElementById('accountFilterCalendar')
    const prev = sel.value

    sel.innerHTML = '<option value="all">Todas las cuentas</option>' +
      allAccountsList.map(a => `<option value="${a}">${a}</option>`).join('')

    // Prioridad: 1) preferencia guardada  2) selección anterior  3) PA-APEX  4) 'all'
    const saved  = localStorage.getItem(ACCOUNT_STORAGE_KEY)
    const paApex = allAccountsList.find(a => a.startsWith('PA-APEX'))

    if (saved && allAccountsList.includes(saved))           sel.value = saved
    else if (prev && prev !== 'all' && allAccountsList.includes(prev)) sel.value = prev
    else if (paApex)                                        sel.value = paApex
  }

  // ── Festivos CME (calculados algorítmicamente) ────────────────────────────
  function calcCMEHolidays(year) {
    const result = new Set()
    const iso = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`

    // Ajuste weekend → día hábil observado (Sáb→Vie, Dom→Lun)
    const observed = d => {
      const r = new Date(d)
      if (r.getDay() === 6) r.setDate(r.getDate() - 1)
      if (r.getDay() === 0) r.setDate(r.getDate() + 1)
      return r
    }
    // N-ésimo weekday del mes (weekday: 0=Dom,1=Lun,...,6=Sáb)
    const nth = (yr, mo, weekday, n) => {
      const d = new Date(yr, mo - 1, 1); let count = 0
      while (true) { if (d.getDay() === weekday && ++count === n) return new Date(d); d.setDate(d.getDate() + 1) }
    }
    // Último weekday del mes
    const last = (yr, mo, weekday) => {
      const d = new Date(yr, mo, 0)
      while (d.getDay() !== weekday) d.setDate(d.getDate() - 1)
      return new Date(d)
    }
    // Pascua (algoritmo de Computus)
    const easter = yr => {
      const a=yr%19, b=Math.floor(yr/100), c=yr%100, d=Math.floor(b/4), e=b%4
      const f=Math.floor((b+8)/25), g=Math.floor((b-f+1)/3)
      const h=(19*a+b-d-g+15)%30, i=Math.floor(c/4), k=c%4
      const l=(32+2*e+2*i-h-k)%7, m=Math.floor((a+11*h+22*l)/451)
      const mo=Math.floor((h+l-7*m+114)/31), dy=((h+l-7*m+114)%31)+1
      return new Date(yr, mo-1, dy)
    }

    result.add(iso(observed(new Date(year, 0, 1))))   // New Year's Day
    result.add(iso(nth(year, 1, 1, 3)))               // MLK Day (3er Lunes Ene)
    result.add(iso(nth(year, 2, 1, 3)))               // Presidents' Day (3er Lunes Feb)
    const gf = new Date(easter(year)); gf.setDate(gf.getDate() - 2)
    result.add(iso(gf))                               // Good Friday
    result.add(iso(last(year, 5, 1)))                 // Memorial Day (último Lunes May)
    result.add(iso(observed(new Date(year, 5, 19))))  // Juneteenth
    result.add(iso(observed(new Date(year, 6, 4))))   // Independence Day
    result.add(iso(nth(year, 9, 1, 1)))               // Labor Day (1er Lunes Sep)
    result.add(iso(nth(year, 11, 4, 4)))              // Thanksgiving (4to Jueves Nov)
    result.add(iso(observed(new Date(year, 11, 25)))) // Christmas
    return result
  }

  const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
    'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
  const DAYS_ES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Semana']

  function dayResult(trades, sesion, dateStr) {
    if (sesion?.no_opero) {
      if (sesion.motivo_no_opero === 'FOMC')    return 'fomc'
      if (sesion.motivo_no_opero === 'Festivo') return 'festivo'
      if (sesion.motivo_no_opero === 'Sin setup') return 'sin-setup'
      return 'no-trade'
    }
    if (!trades || trades.length === 0) {
      if (cmeHolidays.has(dateStr)) return 'festivo'  // festivo automático
      return 'empty'
    }
    const targets = trades.filter(t => t.resultado === 'target').length
    const stops   = trades.filter(t => t.resultado === 'stop').length
    if (targets > 0 && stops === 0) return 'target'
    if (stops > 0 && targets === 0) return 'stop'
    if (targets > 0 && stops > 0)   return 'mixed'
    return 'other'
  }

  function dayPnl(trades) {
    if (!trades || trades.length === 0) return null
    return trades.reduce((sum, t) => sum + (parseFloat(t.profit) || 0), 0)
  }

  async function load() {
    const [trades, sesiones, casuisticas, fomcList] = await Promise.all([
      DB.getTradesByMonth(currentYear, currentMonth),
      DB.getSesiones(),
      DB.getCasuisticasByMonth(currentYear, currentMonth),
      DB.getFomcDates(currentYear, currentMonth).catch(() => []),
    ])

    // Festivos CME calculados para el año actual
    cmeHolidays = calcCMEHolidays(currentYear)

    // FOMC del mes actual
    fomcDates = new Set(fomcList)

    casuisticasCache = {}
    casuisticas.forEach(c => { casuisticasCache[c.sesion_date] = true })

    allTradesRaw = trades
    buildAccountFilterCalendar()

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
        const isFuture  = dateStr > today
        const isToday   = dateStr === today
        const isHoliday = !isFuture && cmeHolidays.has(dateStr)
        const isFomc    = !isFuture && fomcDates.has(dateStr)

        let cellClass = 'cal-cell'
        if (isFuture) cellClass += ' future'
        else cellClass += ` day-${dayResult(trades, sesion, dateStr)}`
        if (isToday) cellClass += ' today'

        const pnl = dayPnl(trades)
        const pnlHtml = pnl !== null
          ? `<div class="cal-pnl ${pnl >= 0 ? 'positive' : 'negative'}">${pnl >= 0 ? '+' : ''}$${pnl.toFixed(0)}</div>`
          : ''
        const tradeCount = trades.length > 0
          ? `<div class="cal-count">${trades.length} trade${trades.length !== 1 ? 's' : ''}</div>` : ''
        const clickable = !isFuture ? `data-date="${dateStr}" style="cursor:pointer"` : ''

        let statusBadge = ''
        if (!isFuture) {
          if (sesion?.no_opero) {
            if (sesion.motivo_no_opero === 'Sin setup') {
              statusBadge = `<div class="cal-status-badge badge-sinsetup"><i class="ti ti-eye-off"></i> Sin entradas</div>`
            } else if (sesion.motivo_no_opero === 'FOMC') {
              statusBadge = `<div class="cal-status-badge badge-fomc"><i class="ti ti-chart-candle"></i> FOMC</div>`
            } else if (sesion.motivo_no_opero === 'Festivo') {
              statusBadge = `<div class="cal-status-badge badge-festivo"><i class="ti ti-building-bank"></i> Festivo</div>`
            } else {
              statusBadge = `<div class="cal-status-badge badge-noopero"><i class="ti ti-user-off"></i> No operé</div>`
            }
          } else if (isHoliday && !trades.length) {
            // Festivo automático (sin sesión registrada)
            statusBadge = `<div class="cal-status-badge badge-festivo"><i class="ti ti-building-bank"></i> Festivo</div>`
          }
        }

        // Indicador FOMC superior izquierda (visible aunque haya operado)
        const fomcIcon = isFomc
          ? `<div class="cal-icon-fomc" title="Día de reunión FOMC"><i class="ti ti-podium"></i></div>`
          : ''

        // Icono error (superior derecha)
        const errorIcon = !isFuture && casuisticasCache[dateStr]
          ? `<div class="cal-icon-error" title="Errores registrados"><i class="ti ti-alert-triangle"></i></div>`
          : ''

        // Icono dirección (inferior derecha)
        let dirIcon = ''
        if (!isFuture && trades.length > 0) {
          const longs  = trades.filter(t => t.market_pos?.toLowerCase() === 'long').length
          const shorts = trades.filter(t => t.market_pos?.toLowerCase() === 'short').length
          if (longs > 0 && shorts === 0)      dirIcon = `<div class="cal-icon-dir dir-long"  title="Long"><i class="ti ti-trending-up"></i></div>`
          else if (shorts > 0 && longs === 0) dirIcon = `<div class="cal-icon-dir dir-short" title="Short"><i class="ti ti-trending-down"></i></div>`
          else if (longs > 0 && shorts > 0)   dirIcon = `<div class="cal-icon-dir dir-mixed" title="Long + Short"><i class="ti ti-arrows-split-2"></i></div>`
        }

        html += `
          <div class="${cellClass}" ${clickable}>
            <div class="cal-day-num">${parseInt(dateStr.slice(8))}</div>
            ${fomcIcon}
            ${errorIcon}
            ${pnlHtml}
            ${tradeCount}
            ${statusBadge}
            ${dirIcon}
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
    if (typeof Metrics !== 'undefined') Metrics.rerender()
  }

  async function init() {
    document.getElementById('prevMonth').addEventListener('click', () => navigate(-1))
    document.getElementById('nextMonth').addEventListener('click', () => navigate(1))
    document.getElementById('accountFilterCalendar').addEventListener('change', () => {
      // Persistir la selección para que sobreviva navegación y recargas
      const val = document.getElementById('accountFilterCalendar').value
      localStorage.setItem(ACCOUNT_STORAGE_KEY, val)
      load()
      if (typeof Metrics !== 'undefined') Metrics.rerender()
    })

    // Cargar la lista completa de cuentas una sola vez (independiente del mes)
    const allTrades = await DB.getTrades()
    const accountsMap = {}
    allTrades.forEach(t => {
      if (!t.account) return
      const abbr = abbreviateAccount(t.account)
      accountsMap[abbr] = true
    })
    allAccountsList = Object.keys(accountsMap).sort()

    await load()
  }

  return { init, load, getYear: () => currentYear, getMonth: () => currentMonth }
})()
