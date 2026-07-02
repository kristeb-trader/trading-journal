// Calendar component
const Calendar = (() => {
  let currentYear = new Date().getFullYear()
  let currentMonth = new Date().getMonth() + 1 // 1-based
  let tradesCache = {}      // date → [trades]
  let sesionesCache = {}    // date → sesion
  let casuisticasCache = {} // date → true (has errors)
  let allTradesRaw = []     // sin filtrar por cuenta
  let allAccountsList = []  // lista completa de cuentas (cargada una sola vez)
  let cmeHolidays   = {}        // date → { name, emoji } para festivos CME
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

    // Prioridad: 1) preferencia guardada  2) selección anterior (solo si es cuenta real)  3) PA-APEX  4) 'all'
    // Nota: prev='all' es el default del browser cuando no hay nada guardado — no se usa como fallback
    // para no bloquear el default a PA-APEX en la primera carga.
    const saved  = localStorage.getItem(ACCOUNT_STORAGE_KEY)
    const paApex = allAccountsList.find(a => a.startsWith('PA-APEX'))

    if (saved === 'all' || (saved && allAccountsList.includes(saved))) sel.value = saved
    else if (prev && prev !== 'all' && allAccountsList.includes(prev)) sel.value = prev
    else if (paApex)                                                    sel.value = paApex
  }

  // ── Festivos CME (calculados algorítmicamente) ────────────────────────────
  function calcCMEHolidays(year) {
    const result = {}  // date → { name, emoji }
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

    const add = (d, name, emoji) => { result[iso(d)] = { name, emoji } }

    add(observed(new Date(year, 0, 1)),  'Año Nuevo',                    '🎊')
    add(nth(year, 1, 1, 3),              'Día de Martin Luther King Jr.', '✊')
    add(nth(year, 2, 1, 3),              'Día de los Presidentes',        '🦅')
    const gf = new Date(easter(year)); gf.setDate(gf.getDate() - 2)
    add(gf,                              'Viernes Santo',                 '✝️')
    add(last(year, 5, 1),               'Día de los Caídos',             '🪖')
    add(observed(new Date(year, 5, 19)), 'Juneteenth',                    '🎉')
    add(observed(new Date(year, 6, 4)),  'Día de la Independencia',       '🎆')
    add(nth(year, 9, 1, 1),             'Día del Trabajo',               '👷')
    add(nth(year, 11, 4, 4),            'Día de Acción de Gracias',      '🦃')
    add(observed(new Date(year, 11, 25)),'Navidad',                       '🎄')
    return result
  }

  const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
    'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
  const DAYS_ES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Semana']

  function isBreakEven(profit) {
    return Math.abs(parseFloat(profit) || 0) <= 6
  }

  function dayResult(trades, sesion, dateStr) {
    if (sesion?.no_opero) {
      if (sesion.motivo_no_opero === 'FOMC')      return 'fomc'
      if (sesion.motivo_no_opero === 'Festivo')   return 'festivo'
      if (sesion.motivo_no_opero === 'Sin setup')             return 'sin-setup'
      if (sesion.motivo_no_opero === 'Setup válido no tomado') return 'sin-setup'
      return 'no-trade'
    }
    if (!trades || trades.length === 0) {
      if (dateStr in cmeHolidays) return 'festivo'
      return 'empty'
    }
    const nonBE = trades.filter(t => !isBreakEven(t.profit))
    if (nonBE.length === 0) return 'be'  // todos los trades del día son B.E.
    const targets = nonBE.filter(isWinTrade).length
    const stops   = nonBE.filter(isLossTrade).length
    if (targets > 0 && stops === 0) return 'target'
    if (stops > 0 && targets === 0) return 'stop'
    if (targets > 0 && stops > 0)   return 'mixed'
    // Sin clasificación por `resultado`: colorear por el signo del P&L neto del día
    // (evita que un día claramente ganador/perdedor salga gris como 'other').
    const net = nonBE.reduce((s, t) => s + (parseFloat(t.profit) || 0), 0)
    if (net > 6)  return 'target'
    if (net < -6) return 'stop'
    return 'other'
  }

  function dayPnl(trades) {
    if (!trades || trades.length === 0) return null
    return trades.reduce((sum, t) => sum + (parseFloat(t.profit) || 0), 0)
  }

  // ¿La sesión cuenta como día con actividad? Operó, o no operó pero sí se conectó
  // a analizar (se_conecto). Se omiten solo los días sin operar y sin conexión.
  function seConecto(s) { return !s.no_opero || s.se_conecto !== false }

  // Días con actividad del mes actual = días operados ∪ días conectados/analizados
  // (incluye "sin entradas" conectado; excluye festivos/FOMC sin conexión).
  function diasConActividad() {
    const monthPrefix = `${currentYear}-${String(currentMonth).padStart(2, '0')}`
    const set = new Set()
    Object.keys(tradesCache).forEach(d => { if (tradesCache[d]?.length) set.add(d) })
    Object.values(sesionesCache).forEach(s => {
      if (s.sesion_date?.startsWith(monthPrefix) && seConecto(s)) set.add(s.sesion_date)
    })
    return set.size
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
    if (title) title.textContent = `${MONTHS_ES[currentMonth - 1]} ${currentYear}`

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
        const isHoliday = !isFuture && (dateStr in cmeHolidays)
        const isFomc    = !isFuture && fomcDates.has(dateStr)

        let result = isFuture ? null : dayResult(trades, sesion, dateStr)
        // Día FOMC automático (en fomc_dates) sin operar: mismo look que el FOMC manual
        if (!isFuture && isFomc && !sesion?.no_opero && trades.length === 0) result = 'fomc'
        // Día FOMC en el que SÍ se operó: color normal según el resultado (la marca
        // FOMC se conserva solo en la leyenda/badge, no en el color de la celda).
        let cellClass = 'cal-cell'
        if (isFuture) cellClass += ' future'
        else cellClass += ` day-${result}`
        if (isToday) cellClass += ' today'

        const pnl = dayPnl(trades)
        const pnlHtml = pnl !== null
          ? `<div class="cal-pnl ${pnl >= 0 ? 'positive' : 'negative'}">${pnl >= 0 ? '+' : ''}$${pnl.toFixed(0)}</div>`
          : ''
        const clickable = !isFuture ? `data-date="${dateStr}" style="cursor:pointer"` : ''

        let statusBadge = ''
        if (!isFuture) {
          if (sesion?.no_opero) {
            if (sesion.motivo_no_opero === 'Setup válido no tomado') {
              statusBadge = `<div class="cal-status-badge badge-sinsetup">⚠️ Setup válido — no entré</div>`
            } else if (sesion.motivo_no_opero === 'Sin setup') {
              statusBadge = `<div class="cal-status-badge badge-sinsetup"><i class="ti ti-eye-off"></i> Sin entradas</div>`
            } else if (sesion.motivo_no_opero === 'FOMC') {
              statusBadge = `<div class="cal-status-badge badge-fomc"><i class="ti ti-chart-candle"></i> FOMC</div>`
            } else if (sesion.motivo_no_opero === 'Festivo') {
              statusBadge = `<div class="cal-status-badge badge-festivo"><i class="ti ti-building-bank"></i> Festivo</div>`
            } else {
              statusBadge = `<div class="cal-status-badge badge-noopero"><i class="ti ti-user-off"></i> No operé</div>`
            }
          } else if (trades.length > 0 && trades.every(t => isBreakEven(t.profit))) {
            statusBadge = `<div class="cal-status-badge badge-be"><i class="ti ti-scale"></i> B.E.</div>`
          } else if (isHoliday && !trades.length) {
            // Festivo automático (sin sesión registrada)
            statusBadge = `<div class="cal-status-badge badge-festivo"><i class="ti ti-building-bank"></i> Festivo</div>`
          }
          // FOMC (en fomc_dates): badge aunque se haya operado, para no perder la marca
          if (!statusBadge && isFomc) {
            statusBadge = `<div class="cal-status-badge badge-fomc"><i class="ti ti-chart-candle"></i> FOMC</div>`
          }
        }

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
            ${errorIcon}
            ${pnlHtml}
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

    // Total mensual — widget de ancho completo al pie del grid
    const totalPnl = Object.values(tradesCache).flat()
      .reduce((s, t) => s + (parseFloat(t.profit) || 0), 0)
    const monthName = MONTHS_ES[currentMonth - 1]
    // Trade real = target o stop, excluyendo B.E. (no cuenta días sin entradas)
    const esTradeReal = t => tradeOutcome(t) !== null
    const totalTrades = Object.values(tradesCache).flat().filter(esTradeReal).length
    // Días con actividad = días operados ∪ días conectados/analizados (incluye los
    // "sin entradas"; omite solo los días sin operar y sin conexión).
    const diasActividad = diasConActividad()
    html += `
      <div class="cal-month-total-widget ${totalPnl >= 0 ? 'positive' : 'negative'}">
        <span class="cmt-label">TOTAL ${monthName.toUpperCase()} ${currentYear}</span>
        <span class="cmt-sub">${diasActividad} día${diasActividad !== 1 ? 's' : ''} · ${totalTrades} trade${totalTrades !== 1 ? 's' : ''}</span>
        <span class="cmt-amount ${totalPnl >= 0 ? 'positive' : 'negative'}">${totalPnl >= 0 ? '+' : ''}$${totalPnl.toFixed(0)}</span>
      </div>`

    grid.innerHTML = html
    grid.querySelectorAll('[data-date]').forEach(cell => {
      cell.addEventListener('click', () => openDayModal(cell.dataset.date))
    })
  }

  function fmtDateEs(d) {
    if (!d) return '—'
    const [y, m, day] = d.split('-')
    const months = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                    'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
    return `${parseInt(day)} de ${months[parseInt(m)-1]} de ${y}`
  }

  function openHolidayModal(dateStr, name, emoji) {
    document.getElementById('holidayEmoji').textContent = emoji
    document.getElementById('holidayName').textContent  = name
    document.getElementById('holidayDate').textContent  = fmtDateEs(dateStr)
    document.getElementById('holidayModal').classList.remove('hidden')
    document.body.classList.add('modal-open')
  }

  async function openDayModal(dateStr) {
    // Festivo CME → modal especial con nombre y emoji del feriado
    const holiday = cmeHolidays[dateStr]
    if (holiday) {
      openHolidayModal(dateStr, holiday.name, holiday.emoji)
      return
    }

    const [trades, sesion] = await Promise.all([
      DB.getTradesByDate(dateStr),
      DB.getSesionByDate(dateStr),
    ])

    // Festivo registrado manualmente → también modal especial
    if (sesion?.no_opero && sesion?.motivo_no_opero === 'Festivo') {
      openHolidayModal(dateStr, 'Día Festivo', '🏛')
      return
    }

    // Filtrar por la cuenta seleccionada (igual que el calendario)
    const accountVal = document.getElementById('accountFilterCalendar')?.value || 'all'
    const tradesCuenta = accountVal === 'all'
      ? trades
      : trades.filter(t => abbreviateAccount(t.account) === accountVal)

    Modal.openDay(dateStr, tradesCuenta, sesion)
  }

  function navigate(delta) {
    currentMonth += delta
    if (currentMonth > 12) { currentMonth = 1; currentYear++ }
    if (currentMonth < 1) { currentMonth = 12; currentYear-- }
    load()
    if (typeof Metrics !== 'undefined') Metrics.rerender()
  }

  async function init() {
    // Cerrar modal festivo
    const closeHoliday = () => {
      document.getElementById('holidayModal').classList.add('hidden')
      document.body.classList.remove('modal-open')
    }
    document.getElementById('closeHolidayModal').addEventListener('click', closeHoliday)
    document.getElementById('holidayModal').addEventListener('click', e => {
      if (e.target === document.getElementById('holidayModal')) closeHoliday()
    })
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeHoliday()
    })

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
