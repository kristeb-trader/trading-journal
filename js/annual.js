// Annual dashboard — resumen anual de trading
const Annual = (() => {
  let annualYear     = new Date().getFullYear()
  let capitalInicial = 0
  let equityChartInst  = null
  let pnlBarChartInst  = null
  let allAccountsList  = []

  const ACCOUNT_KEY = 'annualAccount'

  function abbreviateAccount(account) {
    if (!account) return '—'
    const parts = account.split('-')
    return parts.length > 2 ? parts.slice(0, 2).join('-') : account
  }

  function buildAccountFilter(allTrades) {
    const map = {}
    allTrades.forEach(t => {
      if (!t.account) return
      const abbr = abbreviateAccount(t.account)
      map[abbr] = true
    })
    allAccountsList = Object.keys(map).sort()

    const sel = document.getElementById('accountFilterAnnual')
    sel.innerHTML = '<option value="all">Todas las cuentas</option>' +
      allAccountsList.map(a => `<option value="${a}">${a}</option>`).join('')

    // Prioridad: 1) guardado en localStorage  2) PA-APEX  3) 'all'
    const saved  = localStorage.getItem(ACCOUNT_KEY)
    const paApex = allAccountsList.find(a => a.startsWith('PA-APEX'))
    if (saved && allAccountsList.includes(saved)) sel.value = saved
    else if (paApex)                               sel.value = paApex
  }

  const MONTH_NAMES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                       'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
  const MONTH_SHORT = ['Ene','Feb','Mar','Abr','May','Jun',
                       'Jul','Ago','Sep','Oct','Nov','Dic']

  const BE = t => Math.abs(parseFloat(t.profit) || 0) <= 6

  // ── Cálculos reutilizables ──────────────────────────────────────────────
  function calcDiscipline(sesiones, casByDate) {
    if (!sesiones.length) return null
    const sum = sesiones.reduce((acc, s) => {
      if (s.no_opero) return acc + (casByDate[s.sesion_date] ? 0 : 1)
      const chk = [s.chk_zonas, s.chk_orden, s.chk_5velas,
                   s.chk_noticias, s.chk_consecucion, s.chk_estructura]
        .filter(Boolean).length
      return acc + (chk + (casByDate[s.sesion_date] ? 0 : 1)) / 7
    }, 0)
    return Math.round((sum / sesiones.length) * 100)
  }

  function calcMaxDrawdown(trades) {
    if (!trades.length) return 0
    const sorted = [...trades].sort((a, b) =>
      (`${a.trade_date}${a.entry_time || ''}`).localeCompare(`${b.trade_date}${b.entry_time || ''}`)
    )
    let peak = 0, cum = 0, dd = 0
    for (const t of sorted) {
      cum += parseFloat(t.profit) || 0
      if (cum > peak) peak = cum
      if ((peak - cum) > dd) dd = peak - cum
    }
    return dd
  }

  function calcProfitFactor(trades) {
    const win  = trades.filter(t => (parseFloat(t.profit) || 0) > 0)
                       .reduce((s, t) => s + parseFloat(t.profit), 0)
    const loss = Math.abs(trades.filter(t => (parseFloat(t.profit) || 0) < 0)
                          .reduce((s, t) => s + parseFloat(t.profit), 0))
    return loss === 0 ? null : win / loss
  }

  function monthRange(year, m) {
    const p = n => String(n).padStart(2, '0')
    return {
      from: `${year}-${p(m)}-01`,
      to:   `${year}-${p(m)}-${String(new Date(year, m, 0).getDate()).padStart(2, '0')}`,
    }
  }

  // ── Carga y render principal ────────────────────────────────────────────
  async function loadAndRender() {
    document.getElementById('annualYearLabel').textContent = annualYear
    document.getElementById('annualLoadingState').classList.remove('hidden')
    document.getElementById('annualContent').classList.add('hidden')

    try {
      const [allTrades, allSes, allCas] = await Promise.all([
        DB.getTrades(), DB.getSesiones(), DB.getAllCasuisticas()
      ])

      // Poblar dropdown de cuentas (solo la primera vez que carga datos reales)
      buildAccountFilter(allTrades)

      const accountVal = document.getElementById('accountFilterAnnual').value
      const tradesFiltered = accountVal === 'all'
        ? allTrades
        : allTrades.filter(t => abbreviateAccount(t.account) === accountVal)

      const from = `${annualYear}-01-01`
      const to   = `${annualYear}-12-31`

      const trades      = tradesFiltered.filter(t => t.trade_date >= from && t.trade_date <= to)
      const sesiones    = allSes.filter(s   => s.sesion_date   >= from && s.sesion_date   <= to)
      const casuisticas = allCas.filter(c   => c.sesion_date   >= from && c.sesion_date   <= to)

      const casByDate = {}
      casuisticas.forEach(c => { casByDate[c.sesion_date] = true })

      // ── Per-month stats ─────────────────────────────────────────────────
      let cumPnl = 0
      const monthData = MONTH_NAMES.map((name, i) => {
        const m = i + 1
        const { from: mFrom, to: mTo } = monthRange(annualYear, m)

        const mTrades = trades.filter(t => t.trade_date   >= mFrom && t.trade_date   <= mTo)
        const mSes    = sesiones.filter(s => s.sesion_date >= mFrom && s.sesion_date <= mTo)
        const mCas    = casuisticas.filter(c => c.sesion_date >= mFrom && c.sesion_date <= mTo)

        const mCasByDate = {}
        mCas.forEach(c => { mCasByDate[c.sesion_date] = true })

        const nonBE   = mTrades.filter(t => !BE(t))
        const targets = nonBE.filter(t => t.resultado === 'target').length
        const stops   = nonBE.filter(t => t.resultado === 'stop').length
        const pnl     = mTrades.reduce((s, t) => s + (parseFloat(t.profit) || 0), 0)
        cumPnl += pnl

        return {
          idx: i, name, short: MONTH_SHORT[i],
          trades: mTrades.length, targets, stops, pnl,
          cumPnl: parseFloat(cumPnl.toFixed(2)),
          winRate:    nonBE.length > 0 ? targets / nonBE.length * 100 : null,
          discipline: calcDiscipline(mSes, mCasByDate),
          hasData:    mTrades.length > 0 || mSes.filter(s => !s.no_opero).length > 0,
        }
      })

      // ── Annual totals ───────────────────────────────────────────────────
      const allNonBE = trades.filter(t => !BE(t))
      const annTargets = allNonBE.filter(t => t.resultado === 'target').length
      const annStops   = allNonBE.filter(t => t.resultado === 'stop').length
      const totalPnl   = parseFloat(trades.reduce((s, t) => s + (parseFloat(t.profit) || 0), 0).toFixed(2))

      const activeMonths   = monthData.filter(m => m.hasData)
      const profitMonths   = activeMonths.filter(m => m.pnl > 0)
      const lossMonths     = activeMonths.filter(m => m.pnl < 0)
      const sortedByPnl    = [...activeMonths].sort((a, b) => b.pnl - a.pnl)
      const bestMonth      = sortedByPnl[0]  || null
      const worstMonth     = sortedByPnl[sortedByPnl.length - 1] || null

      const pf   = calcProfitFactor(trades)
      const maxDD = calcMaxDrawdown(trades)
      const avgDisc = calcDiscipline(sesiones, casByDate)

      const annualStats = {
        totalPnl, totalTrades: trades.length,
        targets: annTargets, stops: annStops,
        winRate:     allNonBE.length > 0 ? annTargets / allNonBE.length * 100 : 0,
        pf, maxDD, avgDisc,
        profitMonths: profitMonths.length,
        lossMonths:   lossMonths.length,
        consistency:  activeMonths.length > 0
          ? Math.round(profitMonths.length / activeMonths.length * 100)
          : 0,
        bestMonth, worstMonth,
      }

      renderKpis(annualStats)
      renderMonthTable(monthData, annualStats)
      renderCharts(monthData)

      document.getElementById('annualLoadingState').classList.add('hidden')
      document.getElementById('annualContent').classList.remove('hidden')
    } catch (e) {
      document.getElementById('annualLoadingState').classList.add('hidden')
      document.getElementById('annualContent').classList.remove('hidden')
      Toast.show('Error cargando datos anuales: ' + e.message, 'error')
    }
  }

  // ── KPI strip ───────────────────────────────────────────────────────────
  function renderKpis(s) {
    const rentab  = capitalInicial > 0
      ? `${(s.totalPnl / capitalInicial * 100).toFixed(2)}%`
      : '—'
    const pfLabel = s.pf == null ? 'Sin pérdidas' :
                    s.pf >= 1.5  ? 'Sistema sólido' :
                    s.pf >= 1.0  ? 'Sistema marginal' : 'Sistema negativo'
    const pfColor = s.pf == null ? 'neutral' : s.pf >= 1.5 ? 'green' : s.pf >= 1.0 ? 'warning' : 'red'

    const chips = [
      {
        label: 'P&L Anual',
        value: `${s.totalPnl >= 0 ? '+' : ''}$${s.totalPnl.toFixed(2)}`,
        sub:   `Rentabilidad: ${rentab}`,
        color: s.totalPnl >= 0 ? 'green' : 'red',
        icon:  'ti-currency-dollar',
      },
      {
        label: 'Win Rate',
        value: `${s.winRate.toFixed(1)}%`,
        sub:   `${s.targets}T · ${s.stops}S · ${s.totalTrades} trades`,
        color: s.winRate >= 50 ? 'green' : s.winRate >= 40 ? 'warning' : 'red',
        icon:  'ti-target',
      },
      {
        label: 'Profit Factor',
        value: s.pf != null ? s.pf.toFixed(2) : '—',
        sub:   pfLabel,
        color: pfColor,
        icon:  'ti-math-function',
      },
      {
        label: 'Max Drawdown',
        value: s.maxDD > 0 ? `-$${s.maxDD.toFixed(2)}` : '$0',
        sub:   'Máxima caída desde pico',
        color: s.maxDD === 0 ? 'green' : s.maxDD < 300 ? 'warning' : 'red',
        icon:  'ti-chart-arrows-vertical',
      },
      {
        label: 'Disciplina Prom.',
        value: s.avgDisc != null ? `${s.avgDisc}%` : '—',
        sub:   'Checklist + sin errores',
        color: s.avgDisc == null ? 'neutral' : s.avgDisc >= 80 ? 'green' : s.avgDisc >= 55 ? 'warning' : 'red',
        icon:  'ti-checkup-list',
      },
      {
        label: 'Consistencia',
        value: `${s.profitMonths}/${s.profitMonths + s.lossMonths}`,
        sub:   `${s.consistency}% meses positivos`,
        color: s.consistency >= 60 ? 'green' : s.consistency >= 40 ? 'warning' : 'red',
        icon:  'ti-calendar-check',
      },
      {
        label: 'Mejor mes',
        value: s.bestMonth ? `${s.bestMonth.pnl >= 0 ? '+' : ''}$${s.bestMonth.pnl.toFixed(0)}` : '—',
        sub:   s.bestMonth?.name || 'Sin datos',
        color: 'green',
        icon:  'ti-trending-up',
      },
      {
        label: 'Peor mes',
        value: s.worstMonth ? `${s.worstMonth.pnl >= 0 ? '+' : ''}$${s.worstMonth.pnl.toFixed(0)}` : '—',
        sub:   s.worstMonth?.name || 'Sin datos',
        color: 'red',
        icon:  'ti-trending-down',
      },
    ]

    document.getElementById('annualKpiStrip').innerHTML = chips.map(c => `
      <div class="annual-kpi-chip">
        <div class="annual-kpi-icon color-${c.color}"><i class="ti ${c.icon}"></i></div>
        <div class="annual-kpi-body">
          <div class="annual-kpi-label">${c.label}</div>
          <div class="annual-kpi-value color-${c.color}">${c.value}</div>
          ${c.sub ? `<div class="annual-kpi-sub">${c.sub}</div>` : ''}
        </div>
      </div>`).join('')
  }

  // ── Monthly table ───────────────────────────────────────────────────────
  function renderMonthTable(monthData, s) {
    const cap = capitalInicial

    const rows = monthData.map(m => {
      if (!m.hasData && m.pnl === 0) {
        return `
          <tr class="annual-row-empty">
            <td class="annual-month-name">${m.name}</td>
            <td colspan="7" class="annual-empty-cell">— sin actividad —</td>
          </tr>`
      }

      const pSign = m.pnl >= 0 ? '+' : ''
      const cSign = m.cumPnl >= 0 ? '+' : ''
      const rentab  = cap > 0 ? `${(m.pnl / cap * 100).toFixed(2)}%` : '—'
      const winStr  = m.winRate != null ? `${m.winRate.toFixed(1)}%` : '—'
      const winCls  = m.winRate == null ? '' : m.winRate >= 50 ? 'annual-pos' : m.winRate >= 40 ? 'annual-warn' : 'annual-neg'
      const discStr = m.discipline != null ? `${m.discipline}%` : '—'
      const discCls = m.discipline == null ? '' :
                      m.discipline >= 80 ? 'annual-pos' :
                      m.discipline >= 55 ? 'annual-warn' : 'annual-neg'
      const estado  = m.pnl > 0
        ? '<span class="annual-badge annual-badge-pos">▲ Positivo</span>'
        : m.pnl < 0
        ? '<span class="annual-badge annual-badge-neg">▼ Negativo</span>'
        : '<span class="annual-badge annual-badge-be">— Neutro</span>'

      return `
        <tr class="annual-row${m.pnl > 0 ? ' annual-row-pos' : m.pnl < 0 ? ' annual-row-neg' : ''}">
          <td class="annual-month-name">${m.name}</td>
          <td class="${m.pnl > 0 ? 'annual-pos' : m.pnl < 0 ? 'annual-neg' : ''} fw-600">
            ${pSign}$${m.pnl.toFixed(2)}</td>
          <td class="${m.cumPnl >= 0 ? 'annual-pos' : 'annual-neg'}">
            ${cSign}$${m.cumPnl.toFixed(2)}</td>
          <td>${rentab}</td>
          <td class="${winCls}">${winStr}</td>
          <td class="${discCls}">${discStr}</td>
          <td>${m.trades || '—'}</td>
          <td>${estado}</td>
        </tr>`
    }).join('')

    const tSign   = s.totalPnl >= 0 ? '+' : ''
    const tRentab = cap > 0 ? `${(s.totalPnl / cap * 100).toFixed(2)}%` : '—'

    const discColor = s.avgDisc == null ? '' : s.avgDisc >= 80 ? 'annual-pos' : s.avgDisc >= 55 ? 'annual-warn' : 'annual-neg'

    document.getElementById('annualMonthTableBody').innerHTML = rows
    document.getElementById('annualMonthTableFoot').innerHTML = `
      <tr class="annual-totals-row">
        <td class="annual-totals-label">Resumen Anual</td>
        <td class="${s.totalPnl >= 0 ? 'annual-totals-pos' : 'annual-totals-neg'}">
          ${tSign}$${s.totalPnl.toFixed(2)}</td>
        <td class="annual-totals-neutral">—</td>
        <td class="annual-totals-neutral">${tRentab}</td>
        <td class="${s.winRate >= 50 ? 'annual-totals-pos' : s.winRate >= 40 ? 'annual-totals-warn' : 'annual-totals-neg'}">
          ${s.winRate.toFixed(1)}%</td>
        <td class="${s.avgDisc == null ? 'annual-totals-neutral' : s.avgDisc >= 80 ? 'annual-totals-pos' : s.avgDisc >= 55 ? 'annual-totals-warn' : 'annual-totals-neg'}">
          ${s.avgDisc != null ? s.avgDisc + '%' : '—'}</td>
        <td class="annual-totals-neutral">${s.totalTrades}</td>
        <td></td>
      </tr>`
  }

  // ── Charts ──────────────────────────────────────────────────────────────
  function renderCharts(monthData) {
    const labels = monthData.map(m => m.short)
    const equity = monthData.map(m => m.cumPnl)
    const bars   = monthData.map(m => m.pnl)
    const lastVal = equity[equity.length - 1] || 0

    const axisStyle = {
      grid:  { color: 'rgba(255,255,255,0.05)' },
      ticks: { color: '#888', font: { size: 11 }, callback: v => `$${v.toFixed(0)}` },
    }
    const xAxisStyle = {
      grid:  { color: 'rgba(255,255,255,0.05)' },
      ticks: { color: '#888', font: { size: 11 } },
    }

    // Equity curve
    const equityCtx = document.getElementById('annualEquityChart')
    if (equityChartInst) equityChartInst.destroy()
    const eColor = lastVal >= 0 ? 'rgba(29,158,117,1)' : 'rgba(226,75,74,1)'
    const eFill  = lastVal >= 0 ? 'rgba(29,158,117,0.1)' : 'rgba(226,75,74,0.1)'
    equityChartInst = new Chart(equityCtx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'P&L Acumulado',
          data: equity,
          borderColor: eColor,
          backgroundColor: eFill,
          fill: true,
          tension: 0.35,
          pointRadius: 4,
          pointHoverRadius: 7,
          borderWidth: 2.5,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: true,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: ctx => ` Acumulado: ${ctx.parsed.y >= 0 ? '+' : ''}$${ctx.parsed.y.toFixed(2)}`
            }
          },
        },
        scales: { x: xAxisStyle, y: axisStyle },
      },
    })

    // Monthly P&L bars
    const barCtx = document.getElementById('annualPnlBarChart')
    if (pnlBarChartInst) pnlBarChartInst.destroy()
    pnlBarChartInst = new Chart(barCtx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'P&L Mensual',
          data: bars,
          backgroundColor: bars.map(v => v >= 0 ? 'rgba(29,158,117,0.65)' : 'rgba(226,75,74,0.65)'),
          borderColor:     bars.map(v => v >= 0 ? 'rgba(29,158,117,1)'    : 'rgba(226,75,74,1)'),
          borderWidth: 1,
          borderRadius: 4,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: true,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: ctx => ` P&L: ${ctx.parsed.y >= 0 ? '+' : ''}$${ctx.parsed.y.toFixed(2)}`
            }
          },
        },
        scales: { x: xAxisStyle, y: axisStyle },
      },
    })
  }

  // ── Init ────────────────────────────────────────────────────────────────
  async function init() {
    annualYear     = new Date().getFullYear()
    capitalInicial = parseFloat(localStorage.getItem('annual_capital_inicial') || '0')

    const input = document.getElementById('annualCapitalInicial')
    if (capitalInicial > 0) input.value = capitalInicial

    input.addEventListener('change', () => {
      capitalInicial = parseFloat(input.value) || 0
      localStorage.setItem('annual_capital_inicial', String(capitalInicial))
      loadAndRender()
    })

    document.getElementById('accountFilterAnnual').addEventListener('change', () => {
      localStorage.setItem(ACCOUNT_KEY, document.getElementById('accountFilterAnnual').value)
      loadAndRender()
    })

    document.getElementById('annualPrevYear').addEventListener('click', () => {
      annualYear--
      loadAndRender()
    })
    document.getElementById('annualNextYear').addEventListener('click', () => {
      annualYear++
      loadAndRender()
    })

    await loadAndRender()
  }

  return { init }
})()
