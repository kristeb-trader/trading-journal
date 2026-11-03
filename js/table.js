// Otros › Trades: los míos, los de Alfredo y los del bot en una sola lista, con
// filtros de varias opciones a la vez y por fechas.
// Diseño: docs/disenos/2026-11-03-trades-tres-fuentes.md
//
// Reglas que no se rompen aquí:
//   · Es una VISTA. `trades`, `chaumer_operativas` y `bot_operaciones` solo se
//     leen y no se mezclan en ningún cálculo (D-019, D-038).
//   · Un trade mío NO guarda su setup: es el de la SESIÓN de su fecha
//     (`sesiones.setup_codigo`). Dos trades del mismo día comparten setup.
//   · El filtro de cuentas de la barra superior solo aplica a los míos.
const TradesTable = (() => {
  let allTrades      = []
  let allSesiones    = []
  let allCasuisticas = []
  let allRows        = []  // fila común de las tres fuentes
  let casByDate      = {}  // { 'YYYY-MM-DD': ['Error A', 'Error B'] }
  let setupPorFecha  = {}  // { 'YYYY-MM-DD': 'continuacion_alcista' }
  let variantes      = []  // catalogo_setup_variantes, solo para los nombres
  let avisos         = []  // fuentes que no se pudieron leer
  let filtered    = []
  let page = 0
  let wired = false
  const PAGE_SIZE = 20
  const COLS = 11

  const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
    'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
  const DAYS = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']

  // ── Filtros ───────────────────────────────────────────────────────────────
  // Un grupo sin nada marcado = sin filtrar. Se recuerdan en este navegador.
  const GRUPOS = [
    { id: 'quien', nombre: 'Quién', opciones: [['mio', 'Mío'], ['alfredo', 'Alfredo'], ['bot', 'Bot']] },
    { id: 'setup', nombre: 'Setup', opciones: [
      ['continuacion_alcista', 'Cont. alcista'], ['continuacion_bajista', 'Cont. bajista'],
      ['reingreso_alcista', 'Reing. alcista'], ['reingreso_bajista', 'Reing. bajista'], ['__sin', 'Sin setup']] },
    { id: 'res', nombre: 'Resultado', opciones: [['target', 'Target'], ['stop', 'Stop'], ['be', 'B.E.'], ['no', 'No operó']] },
  ]
  const CLAVE = 'tradesFiltros'
  const vacio = () => ({ quien: ['mio', 'alfredo', 'bot'], setup: [], res: [], desde: '', hasta: '' })
  let filtros = vacio()

  function leerFiltros() {
    try {
      const f = JSON.parse(localStorage.getItem(CLAVE) || 'null')
      if (f && typeof f === 'object') filtros = { ...vacio(), ...f }
    } catch { /* sin almacenamiento: los de por defecto */ }
  }
  function guardarFiltros() {
    try { localStorage.setItem(CLAVE, JSON.stringify(filtros)) } catch { /* no pasa nada */ }
  }

  // ── Formato ───────────────────────────────────────────────────────────────
  function dayOfWeek(dateStr) {
    if (!dateStr) return '—'
    return DAYS[new Date(dateStr + 'T12:00:00').getDay()]
  }

  // '8:47' y '08:47:00' → '08:47'
  function fmtHora(h) {
    if (!h) return '—'
    const [hh, mm] = String(h).split(':')
    return mm == null ? '—' : `${hh.padStart(2, '0')}:${mm.slice(0, 2)}`
  }

  const fmtPts = n => (n == null ? '—'
    : (n > 0 ? '+' : n < 0 ? '−' : '') + String(Math.round(Math.abs(n) * 100) / 100).replace('.', ','))

  const fmtPnl = n => (n == null ? '—' : fmtDinero(n))

  const tono = n => (n > 0 ? 'text-green' : n < 0 ? 'text-red' : '')

  const isBreakEven = profit => Math.abs(parseFloat(profit) || 0) <= 6

  function nombreSetup(c) {
    if (!c) return '—'
    const [base, dir] = c.split('_')
    const corto = { continuacion: 'Cont.', reingreso: 'Reing.' }[base]
    return corto && dir ? `${corto} ${dir}` : (variantes.find(v => v.codigo === c)?.nombre || c)
  }

  const QUIEN = { mio: 'Mío', alfredo: 'Alfredo', bot: 'Bot' }

  function resultBadge(row) {
    if (row.res === 'no') {
      const sinSetup = row.motivo === 'Sin setup'
      const label = sinSetup ? 'Sin entradas válidas' : (row.quien === 'mio' ? (row.motivo || 'No operé') : 'No operó')
      const cls = sinSetup ? 'badge-sinsetup' : 'badge-noopero'
      const icon = sinSetup ? 'ti-eye-off' : 'ti-user-off'
      return `<span class="badge ${cls}" title="${esc(row.motivo || '')}"><i class="ti ${icon}"></i> ${esc(label)}</span>`
    }
    if (row.res === 'be') return '<span class="badge badge-be">B.E.</span>'
    if (row.res === 'target') return '<span class="badge badge-target">target</span>'
    if (row.res === 'stop') return '<span class="badge badge-stop">stop</span>'
    return '<span class="badge badge-other">—</span>'
  }

  function dirBadge(dir) {
    if (dir === 'long') return '<span class="badge badge-long">▲ Long</span>'
    if (dir === 'short') return '<span class="badge badge-short">▼ Short</span>'
    return '—'
  }

  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))

  function buildCasByDate() {
    casByDate = {}
    allCasuisticas.forEach(c => {
      if (!casByDate[c.sesion_date]) casByDate[c.sesion_date] = []
      if (!casByDate[c.sesion_date].includes(c.casuistica))
        casByDate[c.sesion_date].push(c.casuistica)
    })
  }

  function errorCell(row) {
    if (row.quien !== 'mio') return '<span class="tf-nada">—</span>'
    const errors = casByDate[row.date] || []
    if (errors.length === 0)
      return '<span style="color:var(--accent);font-size:0.78rem">Sin Errores</span>'
    return `<span style="color:rgba(226,75,74,0.85);font-size:0.78rem">${errors.join(' · ')}</span>`
  }

  function buildSetupPorFecha() {
    setupPorFecha = {}
    allSesiones.forEach(s => {
      if (s.setup_codigo) setupPorFecha[s.sesion_date] = s.setup_codigo
    })
  }

  // ── La fila común de las tres fuentes ────────────────────────────────────
  // { quien, date, hora, setup, dir ('long'|'short'|null), res ('target'|'stop'|'be'|'no'),
  //   pts, pnl, motivo, cuenta, data, sortKey }
  function filaMia(t) {
    const long = (t.market_pos || '').toLowerCase() === 'long'
    const pts = t.entry_price != null && t.exit_price != null
      ? (long ? 1 : -1) * (Number(t.exit_price) - Number(t.entry_price)) : null
    return {
      quien: 'mio', tipo: 'trade', date: t.trade_date || '', hora: fmtHora(t.entry_time),
      setup: setupPorFecha[t.trade_date] || null,
      dir: t.market_pos ? (long ? 'long' : 'short') : null,
      res: isBreakEven(t.profit) ? 'be' : (t.resultado || null),
      pts, pnl: parseFloat(t.profit) || 0, cuenta: t.account, data: t,
    }
  }

  function filaMiaSinOperar(s) {
    return {
      quien: 'mio', tipo: 'session', date: s.sesion_date, hora: '—',
      setup: setupPorFecha[s.sesion_date] || null, dir: null, res: 'no',
      pts: null, pnl: null, motivo: s.motivo_no_opero, data: s,
    }
  }

  function filaAlfredo(c) {
    if (!c.opero) {
      return { quien: 'alfredo', date: c.fecha, hora: '—', setup: null, dir: null, res: 'no',
               pts: null, pnl: null, motivo: c.motivo_no_opero, data: c }
    }
    const dirTxt = (c.setup_codigo || '').split('_')[1]
    return {
      quien: 'alfredo', date: c.fecha, hora: fmtHora(c.hora_entrada), setup: c.setup_codigo || null,
      dir: dirTxt === 'alcista' ? 'long' : dirTxt === 'bajista' ? 'short' : null,
      res: c.resultado || null, pts: c.puntos != null ? Number(c.puntos) : null, pnl: null, data: c,
    }
  }

  // El bot guarda el setup como «Continuación» / «Reingreso» y la dirección como 1 / −1.
  function filaBot(b) {
    const res = (b.resultado || '').toUpperCase()
    if (res !== 'TARGET' && res !== 'STOP') {
      return { quien: 'bot', date: b.fecha, hora: '—', setup: null, dir: null, res: 'no',
               pts: null, pnl: null, motivo: b.motivo || res, cuenta: b.cuenta, data: b }
    }
    const base = (b.setup || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    const dir = Number(b.direccion) === 1 ? 'long' : Number(b.direccion) === -1 ? 'short' : null
    const setup = base && dir ? `${base}_${dir === 'long' ? 'alcista' : 'bajista'}` : null
    return {
      quien: 'bot', date: b.fecha, hora: fmtHora(b.hora_llenado || b.hora_orden), setup, dir,
      res: res.toLowerCase(), pts: b.puntos != null ? Number(b.puntos) : null,
      pnl: b.pnl_neto != null ? Number(b.pnl_neto) : null, cuenta: b.cuenta, data: b,
    }
  }

  function buildRows(chaumer, bot) {
    const orden = { mio: 0, alfredo: 1, bot: 2 }
    allRows = [
      ...allTrades.map(filaMia),
      ...allSesiones.filter(s => s.no_opero).map(filaMiaSinOperar),
      ...chaumer.map(filaAlfredo),
      ...bot.map(filaBot),
    ]
    allRows.forEach(r => { r.sortKey = `${r.date} ${r.hora === '—' ? '99:99' : r.hora} ${orden[r.quien]}` })
    allRows.sort((a, b) => b.sortKey.localeCompare(a.sortKey))
  }

  function buildAccountFilter() {
    return AccountFilter.setAccounts('trades', allTrades.map(t => t.account))
  }

  // ── Barra de filtros ──────────────────────────────────────────────────────
  function pintarFiltros() {
    const el = document.getElementById('tradeFiltros')
    if (!el) return
    el.innerHTML = GRUPOS.map(g => `
      <div class="tf-grupo">
        <span class="tf-nombre">${g.nombre}</span>
        ${g.opciones.map(([v, txt]) => `
          <button type="button" class="tf-chip${filtros[g.id].includes(v) ? ' on' : ''}${g.id === 'quien' ? ` tf-q-${v}` : ''}"
            data-grupo="${g.id}" data-valor="${v}" aria-pressed="${filtros[g.id].includes(v)}">${txt}</button>`).join('')}
      </div>`).join('') + `
      <div class="tf-grupo">
        <span class="tf-nombre">Fechas</span>
        <input type="date" class="tf-fecha" id="tfDesde" value="${filtros.desde}" aria-label="Desde">
        <span class="tf-flecha">→</span>
        <input type="date" class="tf-fecha" id="tfHasta" value="${filtros.hasta}" aria-label="Hasta">
        <button type="button" class="tf-chip tf-atajo" data-atajo="semana">Esta semana</button>
        <button type="button" class="tf-chip tf-atajo" data-atajo="mes">Este mes</button>
        <button type="button" class="tf-chip tf-atajo" data-atajo="pasado">Mes pasado</button>
        <button type="button" class="tf-chip tf-atajo" data-atajo="todo">Todo</button>
        <button type="button" class="tf-limpiar" id="tfLimpiar"><i class="ti ti-filter-off"></i> Limpiar</button>
      </div>`
  }

  // Los atajos, en fechas locales (hoyISO / isoLocal, nunca toISOString).
  function atajo(tipo) {
    const hoy = new Date(hoyISO() + 'T12:00:00')
    if (tipo === 'todo') return ['', '']
    if (tipo === 'semana') {
      const lunes = new Date(hoy); lunes.setDate(hoy.getDate() - ((hoy.getDay() + 6) % 7))
      return [isoLocal(lunes), hoyISO()]
    }
    if (tipo === 'mes') return [isoLocal(new Date(hoy.getFullYear(), hoy.getMonth(), 1, 12)), hoyISO()]
    const ini = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1, 12)
    const fin = new Date(hoy.getFullYear(), hoy.getMonth(), 0, 12)
    return [isoLocal(ini), isoLocal(fin)]
  }

  function wireFiltros() {
    const el = document.getElementById('tradeFiltros')
    el?.addEventListener('click', e => {
      const chip = e.target.closest('[data-grupo]')
      if (chip) {
        const lista = filtros[chip.dataset.grupo]
        const i = lista.indexOf(chip.dataset.valor)
        i >= 0 ? lista.splice(i, 1) : lista.push(chip.dataset.valor)
      } else if (e.target.closest('[data-atajo]')) {
        ;[filtros.desde, filtros.hasta] = atajo(e.target.closest('[data-atajo]').dataset.atajo)
      } else if (e.target.closest('#tfLimpiar')) {
        filtros = { ...vacio(), quien: [] }
      } else return
      guardarFiltros(); pintarFiltros(); applyFilter()
    })
    el?.addEventListener('change', e => {
      if (e.target.id === 'tfDesde') filtros.desde = e.target.value
      else if (e.target.id === 'tfHasta') filtros.hasta = e.target.value
      else return
      guardarFiltros(); applyFilter()
    })
  }

  function applyFilter() {
    const search = (document.getElementById('tradeSearch')?.value || '').toLowerCase()
    const { quien, setup, res, desde, hasta } = filtros

    filtered = allRows.filter(r => {
      if (quien.length && !quien.includes(r.quien)) return false
      if (setup.length && !setup.includes(r.setup || '__sin')) return false
      if (res.length && !res.includes(r.res)) return false
      if (desde && r.date < desde) return false
      if (hasta && r.date > hasta) return false
      if (r.quien === 'mio' && r.tipo === 'trade' && !AccountFilter.matches('trades', r.cuenta)) return false
      if (!search) return true
      return [QUIEN[r.quien], r.date, nombreSetup(r.setup), r.motivo, r.data.instrument, r.data.exit_name, r.cuenta]
        .some(v => v && String(v).toLowerCase().includes(search))
    })
    page = 0
    renderResumen()
    renderTable()
    renderPagination()
  }

  // Lo filtrado, de un vistazo. Los No operó no cuentan como operación.
  function renderResumen() {
    const el = document.getElementById('tradeResumen')
    if (!el) return
    const ops = filtered.filter(r => r.res && r.res !== 'no')
    const t = ops.filter(r => r.res === 'target').length
    const s = ops.filter(r => r.res === 'stop').length
    const be = ops.filter(r => r.res === 'be').length
    const efec = ops.length ? `${Math.round(t / ops.length * 100)}%` : '—'
    el.innerHTML = `
      <span><b>${ops.length}</b> ${ops.length === 1 ? 'operación' : 'operaciones'}</span>
      <span class="text-green"><b>${t}</b> T</span>
      <span class="text-red"><b>${s}</b> S</span>
      ${be ? `<span><b>${be}</b> B.E.</span>` : ''}
      <span>efectividad <b>${efec}</b></span>
      ${avisos.length ? `<span class="tf-aviso"><i class="ti ti-alert-triangle"></i> No se pudieron leer: ${avisos.join(', ')}</span>` : ''}`
  }

  function renderTable() {
    const slice = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
    const tbody = document.getElementById('tradesTableBody')

    if (slice.length === 0) {
      tbody.innerHTML = `<tr><td colspan="${COLS}" class="empty-row">Sin resultados con estos filtros</td></tr>`
      return
    }

    let currentMonth = null
    let html = ''

    slice.forEach(row => {
      const month = row.date?.slice(0, 7)
      if (month && month !== currentMonth) {
        currentMonth = month
        const [year, mon] = month.split('-')
        html += `<tr class="month-separator">
          <td colspan="${COLS}"><i class="ti ti-calendar-month"></i> ${MONTHS[parseInt(mon) - 1]} ${year}</td>
        </tr>`
      }

      let accion = ''
      if (row.quien === 'mio' && row.tipo === 'trade') {
        accion = `<button class="btn-row" data-action="detail" data-id="${row.data.trade_number}" title="Ver detalle">
            <i class="ti ti-eye"></i></button>`
      } else if (row.quien === 'mio') {
        accion = `<button class="btn-row" data-action="edit-session" data-date="${row.date}" title="Editar sesión">
            <i class="ti ti-pencil"></i></button>`
      }

      html += `
        <tr class="${row.res === 'no' ? 'row-noopero' : ''}">
          <td><span class="tf-quien tf-q-${row.quien}" title="${esc(row.cuenta || '')}">${QUIEN[row.quien]}</span></td>
          <td class="col-dow">${dayOfWeek(row.date)}</td>
          <td>${row.date || '—'}</td>
          <td>${row.hora}</td>
          <td class="tf-setup">${nombreSetup(row.setup)}</td>
          <td>${dirBadge(row.dir)}</td>
          <td>${resultBadge(row)}</td>
          <td class="num ${tono(row.pts)}">${fmtPts(row.pts)}</td>
          <td class="num fw-bold ${tono(row.pnl)}">${fmtPnl(row.pnl)}</td>
          <td>${errorCell(row)}</td>
          <td>${accion}</td>
        </tr>`
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

  // Alfredo y el bot no tumban la pantalla si fallan: se avisa y se sigue.
  const opcional = (p, nombre) => p.catch(e => { console.warn(`[Trades] ${nombre}:`, e); avisos.push(nombre); return [] })

  async function init() {
    avisos = []
    let chaumer, bot
    ;[allTrades, allSesiones, allCasuisticas, variantes, chaumer, bot] = await Promise.all([
      DB.getTrades(), DB.getSesiones(), DB.getAllCasuisticas(),
      DB.getSetupVariantes({ soloActivos: false }).catch(() => []),
      opcional(DB.getChaumerOperativas(), 'Alfredo'),
      opcional(DB.getBotOperaciones(), 'el bot'),
    ])
    buildCasByDate()
    buildSetupPorFecha()
    buildRows(chaumer, bot)

    AccountFilter.create('trades', {
      mountId: 'accountFilterTrades',
      storageKey: 'tradesAccounts',
      onChange: applyFilter,
    })
    await buildAccountFilter()

    if (!wired) {
      leerFiltros()
      pintarFiltros()
      wireFiltros()
      document.getElementById('tradeSearch')?.addEventListener('input', applyFilter)
      wired = true
    }
    applyFilter()
  }

  return { init, reload: init }
})()
