// Trades table with pagination, search, filter
const TradesTable = (() => {
  let allTrades = []
  let filtered = []
  let page = 0
  const PAGE_SIZE = 20

  function fmt(val, decimals = 2) {
    return val != null ? parseFloat(val).toFixed(decimals) : '—'
  }

  function fmtDate(dateStr) {
    if (!dateStr) return '—'
    return dateStr.length > 10 ? dateStr.slice(0, 10) : dateStr
  }

  function fmtTime(ts) {
    if (!ts) return '—'
    return new Date(ts).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
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

  function applyFilter() {
    const search = document.getElementById('tradeSearch').value.toLowerCase()
    const filterVal = document.getElementById('tradeFilter').value
    filtered = allTrades.filter(t => {
      const matchFilter = filterVal === 'all' || t.resultado === filterVal
      const matchSearch = !search || [
        t.instrument, t.market_pos, t.entry_name, t.exit_name, t.trade_date
      ].some(v => v?.toLowerCase().includes(search))
      return matchFilter && matchSearch
    })
    page = 0
    renderTable()
    renderPagination()
  }

  function renderTable() {
    const slice = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
    const tbody = document.getElementById('tradesTableBody')
    if (slice.length === 0) {
      tbody.innerHTML = `<tr><td colspan="9" class="empty-row">Sin resultados</td></tr>`
      return
    }
    tbody.innerHTML = slice.map(t => {
      const pnl = parseFloat(t.profit) || 0
      const date = t.trade_date || fmtDate(t.entry_time)
      return `
        <tr>
          <td>${date}<br><small class="text-dim">${fmtTime(t.entry_time)}</small></td>
          <td>${t.instrument || '—'}</td>
          <td>${dirBadge(t.market_pos)}</td>
          <td class="text-center">${t.qty ?? '—'}</td>
          <td>${fmt(t.entry_price)}</td>
          <td>${fmt(t.exit_price)}</td>
          <td class="${pnl >= 0 ? 'text-green' : 'text-red'} fw-bold">${pnl >= 0 ? '+' : ''}$${fmt(pnl)}</td>
          <td>${resultBadge(t.resultado)}</td>
          <td>
            <button class="btn-row" data-action="detail" data-id="${t.id}" title="Ver detalle">
              <i class="ti ti-eye"></i>
            </button>
          </td>
        </tr>`
    }).join('')

    tbody.querySelectorAll('[data-action="detail"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const trade = allTrades.find(t => t.id === parseInt(btn.dataset.id))
        if (trade) openTradeModal(trade)
      })
    })
  }

  function renderPagination() {
    const total = Math.ceil(filtered.length / PAGE_SIZE)
    const pg = document.getElementById('tradesPagination')
    if (total <= 1) { pg.innerHTML = ''; return }
    let html = `<span class="page-info">${filtered.length} trades</span>`
    html += `<button class="btn-page" ${page === 0 ? 'disabled' : ''} id="pgPrev">‹ Anterior</button>`
    html += `<span class="page-num">Página ${page + 1} / ${total}</span>`
    html += `<button class="btn-page" ${page >= total - 1 ? 'disabled' : ''} id="pgNext">Siguiente ›</button>`
    pg.innerHTML = html
    pg.querySelector('#pgPrev')?.addEventListener('click', () => { page--; renderTable(); renderPagination() })
    pg.querySelector('#pgNext')?.addEventListener('click', () => { page++; renderTable(); renderPagination() })
  }

  async function openTradeModal(trade) {
    const date = trade.trade_date || trade.entry_time?.slice(0, 10)
    const sesion = date ? await DB.getSesionByDate(date) : null
    Modal.openDay(date, [trade], sesion)
  }

  async function init() {
    allTrades = await DB.getTrades()
    filtered = [...allTrades]
    renderTable()
    renderPagination()

    document.getElementById('tradeSearch').addEventListener('input', applyFilter)
    document.getElementById('tradeFilter').addEventListener('change', applyFilter)
  }

  return { init, reload: init }
})()
