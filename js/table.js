// Trades table with pagination, search, filter
const TradesTable = (() => {
  let allTrades      = []
  let allSesiones    = []
  let allCasuisticas = []
  let allRows        = []  // unified: trades + no-opero sessions
  let casByDate      = {}  // { 'YYYY-MM-DD': ['Error A', 'Error B'] }
  let filtered    = []
  let page = 0
  const PAGE_SIZE = 20

  const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
    'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
  const DAYS = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']

  function abbreviateAccount(account) {
    if (!account) return '—'
    const parts = account.split('-')
    return parts.length > 2 ? parts.slice(0, 2).join('-') : account
  }

  function dayOfWeek(dateStr) {
    if (!dateStr) return '—'
    return DAYS[new Date(dateStr + 'T12:00:00').getDay()]
  }

  function fmt(val, decimals = 2) {
    return val != null ? parseFloat(val).toFixed(decimals) : '—'
  }

  function fmtTime(ts) {
    if (!ts) return '—'
    return ts.slice(0, 5)
  }

  function resultBadge(resultado) {
    if (!resultado) return '<span class="badge badge-other">—</span>'
    const map = { target: 'badge-target', stop: 'badge-stop' }
    return `<span class="badge ${map[resultado] || 'badge-other'}">${resultado}</span>`
  }

  function dirBadge(pos) {
    if (!pos) return '—'
    return pos.toLowerCase() === 'long'
      ? '<span class="badge badge-long">▲ Long</span>'
      : '<span class="badge badge-short">▼ Short</span>'
  }

  function buildCasByDate() {
    casByDate = {}
    allCasuisticas.forEach(c => {
      if (!casByDate[c.sesion_date]) casByDate[c.sesion_date] = []
      if (!casByDate[c.sesion_date].includes(c.casuistica))
        casByDate[c.sesion_date].push(c.casuistica)
    })
  }

  function errorCell(date) {
    const errors = casByDate[date] || []
    if (errors.length === 0)
      return '<span style="color:var(--accent);font-size:0.78rem">Sin Errores</span>'
    return `<span style="color:rgba(226,75,74,0.85);font-size:0.78rem">${errors.join(' · ')}</span>`
  }

  function buildRows() {
    allRows = []
    allTrades.forEach(t => {
      allRows.push({
        type: 'trade',
        date: t.trade_date || '',
        sortKey: `${t.trade_date || ''} ${t.entry_time || '99:99'}`,
        data: t,
      })
    })
    allSesiones.filter(s => s.no_opero).forEach(s => {
      allRows.push({
        type: 'session',
        date: s.sesion_date,
        sortKey: `${s.sesion_date} 00:00`,
        data: s,
      })
    })
    allRows.sort((a, b) => b.sortKey.localeCompare(a.sortKey))
  }

  function buildAccountFilter() {
    const accounts = {}
    allTrades.forEach(t => {
      if (!t.account) return
      const abbr = abbreviateAccount(t.account)
      accounts[abbr] = true
    })
    const sel = document.getElementById('accountFilterTrades')
    const prev = sel.value
    sel.innerHTML = '<option value="all">Todas las cuentas</option>' +
      Object.keys(accounts).sort().map(a => `<option value="${a}">${a}</option>`).join('')
    const paApex = Object.keys(accounts).find(a => a.startsWith('PA-APEX'))
    if (prev && prev !== 'all') sel.value = prev
    else if (paApex) sel.value = paApex
  }

  function applyFilter() {
    const search    = document.getElementById('tradeSearch').value.toLowerCase()
    const filterVal = document.getElementById('tradeFilter').value
    const accountVal = document.getElementById('accountFilterTrades').value

    filtered = allRows.filter(row => {
      if (row.type === 'session') {
        const isSinSetup = row.data.motivo_no_opero === 'Sin setup'
        if (filterVal === 'sin_setup') return isSinSetup
        if (filterVal !== 'all') return false
        if (!search) return true
        return row.date.includes(search) ||
          (row.data.motivo_no_opero || '').toLowerCase().includes(search)
      }
      if (filterVal === 'sin_setup') return false
      const t = row.data
      const matchAccount = accountVal === 'all' || abbreviateAccount(t.account) === accountVal
      const matchFilter = filterVal === 'all' || t.resultado === filterVal
      const matchSearch = !search || [t.instrument, t.market_pos, t.exit_name, t.trade_date]
        .some(v => v?.toLowerCase().includes(search))
      return matchAccount && matchFilter && matchSearch
    })
    page = 0
    renderTable()
    renderPagination()
  }

  function renderTable() {
    const slice = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
    const tbody = document.getElementById('tradesTableBody')

    if (slice.length === 0) {
      tbody.innerHTML = `<tr><td colspan="10" class="empty-row">Sin resultados</td></tr>`
      return
    }

    let currentMonth = null
    let html = ''

    slice.forEach(row => {
      const month = row.date?.slice(0, 7)
      if (month && month !== currentMonth) {
        currentMonth = month
        const [year, mon] = month.split('-')
        const monthName = MONTHS[parseInt(mon) - 1]
        html += `<tr class="month-separator">
          <td colspan="10"><i class="ti ti-calendar-month"></i> ${monthName} ${year}</td>
        </tr>`
      }

      if (row.type === 'trade') {
        const t   = row.data
        const pnl = parseFloat(t.profit) || 0
        html += `
          <tr>
            <td class="col-dow">${dayOfWeek(t.trade_date)}</td>
            <td>${t.trade_date || '—'}</td>
            <td>${fmtTime(t.entry_time)}</td>
            <td>${t.instrument?.split(' ')[0] || '—'}</td>
            <td>${dirBadge(t.market_pos)}</td>
            <td class="text-center">${t.qty ?? '—'}</td>
            <td>${resultBadge(t.resultado)}</td>
            <td class="${pnl >= 0 ? 'text-green' : 'text-red'} fw-bold">${pnl >= 0 ? '+' : ''}$${fmt(pnl)}</td>
            <td>${errorCell(t.trade_date)}</td>
            <td>
              <button class="btn-row" data-action="detail" data-id="${t.trade_number}" title="Ver detalle">
                <i class="ti ti-eye"></i>
              </button>
            </td>
          </tr>`
      } else {
        const s          = row.data
        const isSinSetup = s.motivo_no_opero === 'Sin setup'
        const label      = isSinSetup ? 'Sin entradas válidas' : (s.motivo_no_opero || 'No operé')
        const icon       = isSinSetup ? 'ti-eye-off' : 'ti-user-off'
        const badgeCls   = isSinSetup ? 'badge-sinsetup' : 'badge-noopero'
        html += `
          <tr class="row-noopero">
            <td class="col-dow">${dayOfWeek(s.sesion_date)}</td>
            <td>${s.sesion_date}</td>
            <td>—</td>
            <td>—</td>
            <td>—</td>
            <td>—</td>
            <td><span class="badge ${badgeCls}"><i class="ti ${icon}"></i> ${label}</span></td>
            <td>—</td>
            <td>${errorCell(s.sesion_date)}</td>
            <td>
              <button class="btn-row" data-action="edit-session" data-date="${s.sesion_date}" title="Editar sesión">
                <i class="ti ti-pencil"></i>
              </button>
            </td>
          </tr>`
      }
    })

    tbody.innerHTML = html

    tbody.querySelectorAll('[data-action="detail"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const trade = allTrades.find(t => t.trade_number === parseInt(btn.dataset.id))
        if (trade) openTradeModal(trade)
      })
    })

    tbody.querySelectorAll('[data-action="edit-session"]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const sesion = allSesiones.find(s => s.sesion_date === btn.dataset.date) || null
        SessionForm.prefill(sesion, btn.dataset.date)
      })
    })
  }

  function renderPagination() {
    const total = Math.ceil(filtered.length / PAGE_SIZE)
    const pg    = document.getElementById('tradesPagination')
    if (total <= 1) { pg.innerHTML = ''; return }
    let html = `<span class="page-info">${filtered.length} registros</span>`
    html += `<button class="btn-page" ${page === 0 ? 'disabled' : ''} id="pgPrev">‹ Anterior</button>`
    html += `<span class="page-num">Página ${page + 1} / ${total}</span>`
    html += `<button class="btn-page" ${page >= total - 1 ? 'disabled' : ''} id="pgNext">Siguiente ›</button>`
    pg.innerHTML = html
    pg.querySelector('#pgPrev')?.addEventListener('click', () => { page--; renderTable(); renderPagination() })
    pg.querySelector('#pgNext')?.addEventListener('click', () => { page++; renderTable(); renderPagination() })
  }

  async function openTradeModal(trade) {
    const date   = trade.trade_date
    const sesion = date ? await DB.getSesionByDate(date) : null
    Modal.openDay(date, [trade], sesion)
  }

  async function init() {
    ;[allTrades, allSesiones, allCasuisticas] = await Promise.all([DB.getTrades(), DB.getSesiones(), DB.getAllCasuisticas()])
    buildRows()
    buildCasByDate()
    buildAccountFilter()
    applyFilter()

    buildAccountFilter()
    document.getElementById('tradeSearch').addEventListener('input', applyFilter)
    document.getElementById('tradeFilter').addEventListener('change', applyFilter)
    document.getElementById('accountFilterTrades').addEventListener('change', applyFilter)
  }

  return { init, reload: init }
})()
