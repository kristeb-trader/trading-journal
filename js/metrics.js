// Metrics / KPI calculations and rendering
const Metrics = (() => {
  let allTrades = []
  let allSesiones = []
  let allCasuisticas = []

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

  // Sesión limpia: días operados → 7 factores al 100%; días no_opero → sin casuísticas
  function cleanSessions(activeSesiones, casByDate) {
    return activeSesiones.filter(s => {
      if (s.no_opero) return !casByDate[s.sesion_date]
      return s.chk_zonas && s.chk_orden && s.chk_5velas && s.chk_noticias &&
        s.chk_consecucion && s.chk_estructura && !casByDate[s.sesion_date]
    }).length
  }

  function casuisticaFrequency(casuisticas) {
    const counts = {}
    casuisticas.forEach(c => {
      counts[c.casuistica] = (counts[c.casuistica] || 0) + 1
    })
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1])
    return sorted.length > 0 && sorted[0][1] > 0 ? sorted[0] : null
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

  function calMonth() {
    if (typeof Calendar !== 'undefined') return Calendar.getMonth()
    return new Date().getMonth() + 1
  }
  function calYear() {
    if (typeof Calendar !== 'undefined') return Calendar.getYear()
    return new Date().getFullYear()
  }

  function filterByPeriod(trades, sesiones, period) {
    if (period === 'all') return { trades, sesiones }
    if (period === 'month') {
      const y = calYear(), m = calMonth()
      const from = `${y}-${String(m).padStart(2, '0')}-01`
      const lastDay = new Date(y, m, 0).getDate()
      const to = `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
      return {
        trades: trades.filter(t => (t.trade_date || '') >= from && (t.trade_date || '') <= to),
        sesiones: sesiones.filter(s => s.sesion_date >= from && s.sesion_date <= to),
      }
    }
    // week
    const d = new Date()
    d.setDate(d.getDate() - d.getDay() + 1)
    const from = d.toISOString().slice(0, 10)
    return {
      trades: trades.filter(t => (t.trade_date || '') >= from),
      sesiones: sesiones.filter(s => s.sesion_date >= from),
    }
  }

  function filterCasuisticasByPeriod(casuisticas, period) {
    if (period === 'all') return casuisticas
    if (period === 'month') {
      const y = calYear(), m = calMonth()
      const from = `${y}-${String(m).padStart(2, '0')}-01`
      const lastDay = new Date(y, m, 0).getDate()
      const to = `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
      return casuisticas.filter(c => c.sesion_date >= from && c.sesion_date <= to)
    }
    // week
    const d = new Date()
    d.setDate(d.getDate() - d.getDay() + 1)
    const from = d.toISOString().slice(0, 10)
    return casuisticas.filter(c => c.sesion_date >= from)
  }

  const CHECKLIST_KEYS = [
    { key: 'chk_zonas',       label: 'Zonas vigentes'       },
    { key: 'chk_orden',       label: 'Orden a tiempo'       },
    { key: 'chk_5velas',      label: 'Máx 5 velas'          },
    { key: 'chk_noticias',    label: 'Sin noticias rojas'   },
    { key: 'chk_consecucion', label: 'Rompimiento + Consecución' },
    { key: 'chk_estructura',  label: 'Estructura IRI'       },
  ]

  const DAYS = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']

  const DISC_FACTORS = [
    { key: 'chk_zonas',       label: 'Zonas vigentes verificadas'       },
    { key: 'chk_orden',       label: 'Orden precolocada a tiempo'       },
    { key: 'chk_5velas',      label: 'Máx 5 velas en corrida'           },
    { key: 'chk_noticias',    label: 'Sin noticia roja activa'          },
    { key: 'chk_consecucion', label: 'Zona con consecución'             },
    { key: 'chk_estructura',  label: 'Estructura IRI fluida'            },
    { key: '_noErrors',       label: 'Sin errores de tipificación'      },
  ]

  function openDisciplineDetailModal(activeSesiones, casByDate, periodCasuisticas) {
    const total = activeSesiones.length

    if (total === 0) {
      document.getElementById('disciplineModalContent').innerHTML =
        '<p style="padding:20px;color:var(--text3)">Sin sesiones en el período.</p>'
      document.getElementById('disciplineModal').classList.remove('hidden')
      return
    }

    // Checklist: 6 factores sobre días operados
    const operatedSesiones = activeSesiones.filter(s => !s.no_opero)
    const CHECKLIST_FACTORS = DISC_FACTORS.filter(f => f.key !== '_noErrors')
    const checklistStats = CHECKLIST_FACTORS.map(f => {
      const fails = operatedSesiones.filter(s => !s[f.key])
      const denominator = operatedSesiones.length || 1
      return { label: f.label, count: fails.length, pct: fails.length / denominator * 100 }
    }).sort((a, b) => b.count - a.count)

    // Casuísticas: contar por tipo exacto
    const casCountMap = {}
    periodCasuisticas.forEach(c => { casCountMap[c.casuistica] = (casCountMap[c.casuistica] || 0) + 1 })
    const casStats = Object.entries(casCountMap)
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count)

    const maxChk = checklistStats[0]?.count || 1
    const maxCas = casStats[0]?.count || 1

    const chkBarsHtml = checklistStats.map(f => {
      const cls = f.pct >= 50 ? 'level-high' : f.pct >= 25 ? 'level-mid' : 'level-low'
      const barW = (f.count / maxChk * 100).toFixed(0)
      return `
        <div class="disc-item">
          <span class="disc-item-label">${f.label}</span>
          <div class="disc-bar-wrap">
            ${f.count > 0
              ? `<div class="disc-bar-fill ${cls}" style="width:${barW}%"></div>`
              : `<div class="disc-bar-fill" style="width:100%;background:rgba(29,158,117,0.3)"></div>`}
          </div>
          <span class="disc-count" style="${f.count === 0 ? 'color:var(--accent)' : ''}">${f.count === 0 ? '✓' : f.count}</span>
        </div>`
    }).join('')

    const casBarsHtml = casStats.length > 0
      ? casStats.map(f => {
          const barW = (f.count / maxCas * 100).toFixed(0)
          return `
            <div class="disc-item">
              <span class="disc-item-label">${f.label}</span>
              <div class="disc-bar-wrap">
                <div class="disc-bar-fill level-high" style="width:${barW}%;background:var(--warning)"></div>
              </div>
              <span class="disc-count">${f.count}</span>
            </div>`
        }).join('')
      : '<p style="color:var(--accent);font-size:0.85rem;padding:4px 0">✓ Sin errores de ejecución</p>'

    // Agrupar casuísticas por fecha (sin duplicar tipo en el mismo día)
    const casByDateDetail = {}
    periodCasuisticas.forEach(c => {
      if (!casByDateDetail[c.sesion_date]) casByDateDetail[c.sesion_date] = []
      if (!casByDateDetail[c.sesion_date].includes(c.casuistica))
        casByDateDetail[c.sesion_date].push(c.casuistica)
    })

    // Días con fallos: no_opero → solo casuísticas; operados → checklist + casuísticas
    const failedDays = activeSesiones
      .map(s => {
        const chkFails = s.no_opero ? [] : CHECKLIST_FACTORS.filter(f => !s[f.key])
        const casFails = casByDateDetail[s.sesion_date] || []
        return { date: s.sesion_date, noOpero: s.no_opero, chkFails, casFails }
      })
      .filter(d => d.chkFails.length > 0 || d.casFails.length > 0)
      .sort((a, b) => b.date.localeCompare(a.date))

    const daysHtml = failedDays.length > 0
      ? failedDays.map(d => {
          const dow = DAYS[new Date(d.date + 'T12:00:00').getDay()]
          const totalFails = d.chkFails.length + d.casFails.length
          const noOpBadge = d.noOpero
            ? '<span style="font-size:0.7rem;color:var(--text3);background:rgba(255,255,255,0.06);padding:1px 6px;border-radius:3px;margin-left:6px">sin operar</span>'
            : ''
          const chkTags = d.chkFails.map(f =>
            `<span class="disc-fail-tag">${f.label}</span>`
          ).join('')
          const casTags = d.casFails.map(c =>
            `<span class="disc-fail-tag" style="background:rgba(186,117,23,0.18);color:var(--warning);border-color:rgba(186,117,23,0.3)">${c}</span>`
          ).join('')
          return `
            <div class="disc-fail-day">
              <div class="disc-fail-day-header">
                <span class="disc-date-dow">${dow}</span>
                <span class="disc-date-val">${d.date}${noOpBadge}</span>
                <span class="disc-fail-count">${totalFails} fallo${totalFails !== 1 ? 's' : ''}</span>
              </div>
              <div class="disc-fail-tags">${chkTags}${casTags}</div>
            </div>`
        }).join('')
      : '<p style="color:var(--accent);font-size:0.85rem;padding:8px 0">¡Disciplina perfecta en el período! 🎯</p>'

    document.getElementById('disciplineModalContent').innerHTML = `
      <div style="padding:16px 20px 20px">
        <p class="disc-section-title">Reglas del checklist (${operatedSesiones.length} días operados · ${total - operatedSesiones.length} sin operar)</p>
        ${chkBarsHtml}
        <p class="disc-section-title" style="margin-top:16px">Errores de ejecución</p>
        ${casBarsHtml}
        <div class="disc-dates" style="margin-top:12px">
          <p class="disc-section-title">Días con fallos</p>
          ${daysHtml}
        </div>
      </div>`

    document.getElementById('disciplineModal').classList.remove('hidden')
  }

  function openDisciplineModal(casuisticas, trades) {
    // Agrupar casuísticas por nombre y contar
    const countMap = {}
    casuisticas.forEach(c => {
      countMap[c.casuistica] = (countMap[c.casuistica] || 0) + 1
    })
    const counts = Object.entries(countMap)
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count)
    const maxCount = counts[0]?.count || 1
    const total = casuisticas.length

    // P&L por fecha para mostrar junto a las fechas del error top
    const pnlByDate = {}
    trades.forEach(t => {
      if (!t.trade_date) return
      pnlByDate[t.trade_date] = (pnlByDate[t.trade_date] || 0) + (parseFloat(t.profit) || 0)
    })

    // Fechas donde ocurrió el error más frecuente
    const topLabel = counts[0]?.label
    const failDates = topLabel
      ? [...new Set(casuisticas.filter(c => c.casuistica === topLabel).map(c => c.sesion_date))]
          .sort((a, b) => b.localeCompare(a))
      : []

    const barsHtml = counts.length > 0
      ? counts.map(({ label, count }) => {
          const pct = total > 0 ? (count / total * 100) : 0
          const cls  = pct >= 40 ? 'level-high' : pct >= 20 ? 'level-mid' : 'level-low'
          return `
            <div class="disc-item">
              <span class="disc-item-label">${label}</span>
              <div class="disc-bar-wrap">
                <div class="disc-bar-fill ${cls}" style="width:${(count/maxCount*100).toFixed(0)}%"></div>
              </div>
              <span class="disc-count">${count}</span>
            </div>`
        }).join('')
      : '<p style="color:var(--text3);font-size:0.85rem">Sin errores registrados</p>'

    const datesHtml = failDates.map(date => {
      const pnl = pnlByDate[date]
      const dow  = DAYS[new Date(date + 'T12:00:00').getDay()]
      const pnlHtml = pnl != null
        ? `<span class="disc-date-pnl ${pnl >= 0 ? 'pos' : 'neg'}">${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}</span>`
        : `<span class="disc-date-pnl neutral">Sin trades</span>`
      return `
        <div class="disc-date-row">
          <span class="disc-date-dow">${dow}</span>
          <span class="disc-date-val">${date}</span>
          ${pnlHtml}
        </div>`
    }).join('')

    document.getElementById('disciplineModalContent').innerHTML = `
      <div style="padding:16px 20px 20px">
        <p class="disc-section-title">Errores de tipificación (${total} registros)</p>
        ${barsHtml}
        ${topLabel && failDates.length > 0 ? `
          <div class="disc-dates">
            <p class="disc-section-title" style="margin-top:8px">Días con "${topLabel}"</p>
            ${datesHtml}
          </div>` : ''}
      </div>`

    document.getElementById('disciplineModal').classList.remove('hidden')
  }

  function abbreviateAccount(account) {
    if (!account) return '—'
    const parts = account.split('-')
    return parts.length > 2 ? parts.slice(0, 2).join('-') : account
  }

  function render(period = 'all') {
    const accountVal = document.getElementById('accountFilterCalendar')?.value || 'all'
    const accountFiltered = accountVal === 'all'
      ? allTrades
      : allTrades.filter(t => abbreviateAccount(t.account) === accountVal)
    const { trades, sesiones } = filterByPeriod(accountFiltered, allSesiones, period)

    const totalTrades = trades.length
    const targets = trades.filter(t => t.resultado === 'target').length
    const stops = trades.filter(t => t.resultado === 'stop').length
    const winRate = totalTrades > 0 ? (targets / totalTrades * 100).toFixed(1) : 0
    const netPnl = trades.reduce((s, t) => s + (parseFloat(t.profit) || 0), 0)
    const streak = calcStreak(trades)
    const { best, worst } = bestWorstDay(trades)
    const sinSetupDates = sesiones
      .filter(s => s.no_opero && s.motivo_no_opero === 'Sin setup')
      .map(s => s.sesion_date)
    const tradingDays = new Set([...trades.map(t => t.trade_date), ...sinSetupDates]).size
    const avgPnl = tradingDays > 0 ? (netPnl / tradingDays) : 0
    const pf = calcProfitFactor(trades)
    const { avgWin, avgLoss } = calcAvgWinLoss(trades)
    const maxDD = calcMaxDrawdown(trades)
    // "Sin setup" days count: trader was present pero no hubo setup válido
    const activeSesiones = sesiones

    // Casuísticas filtradas por el mismo período
    const periodCasuisticas = filterCasuisticasByPeriod(allCasuisticas, period)
    const casByDate = {}
    periodCasuisticas.forEach(c => { casByDate[c.sesion_date] = true })

    // clean usa los 7 factores (checklist + sin errores) sobre activeSesiones
    const clean = cleanSessions(activeSesiones, casByDate)
    const failedCount = activeSesiones.length - clean

    // Disciplina: días operados → 7 factores; días no_opero → solo casuística (1 factor)
    const disciplinePct = activeSesiones.length > 0
      ? Math.round(activeSesiones.reduce((sum, s) => {
          if (s.no_opero) return sum + (casByDate[s.sesion_date] ? 0 : 1)
          const chkScore = [s.chk_zonas, s.chk_orden, s.chk_5velas, s.chk_noticias, s.chk_consecucion, s.chk_estructura]
            .filter(Boolean).length
          const noErrors = casByDate[s.sesion_date] ? 0 : 1
          return sum + (chkScore + noErrors) / 7
        }, 0) / activeSesiones.length * 100)
      : 0

    const topError = casuisticaFrequency(periodCasuisticas)

    const cards = [
      { label: 'P&L Neto Total', value: `${netPnl >= 0 ? '+' : ''}$${netPnl.toFixed(2)}`, icon: 'ti-currency-dollar', color: netPnl >= 0 ? 'green' : 'red', sub: `Promedio: ${avgPnl >= 0 ? '+' : ''}$${avgPnl.toFixed(0)}/día` },
      { label: 'Tasa de Acierto', value: `${winRate}%`, icon: 'ti-target', color: parseFloat(winRate) >= 50 ? 'green' : 'red', sub: `${targets} targets / ${stops} stops` },
      { label: 'Total Trades', value: totalTrades, icon: 'ti-list-numbers', color: 'neutral', sub: `${tradingDays} días operados` },
      { label: 'Racha actual', value: streak.count > 0 ? `${streak.count} ${streak.type === 'win' ? '🟢' : '🔴'}` : '—', icon: 'ti-flame', color: streak.type === 'win' ? 'green' : 'red', sub: streak.type === 'win' ? 'victorias seguidas' : streak.type === 'loss' ? 'pérdidas seguidas' : '' },
      { label: 'Mejor día', value: best ? `+$${best[1].toFixed(0)}` : '—', icon: 'ti-trending-up', color: 'green', sub: best ? best[0] : '' },
      { label: 'Peor día', value: worst ? `$${worst[1].toFixed(0)}` : '—', icon: 'ti-trending-down', color: 'red', sub: worst ? worst[0] : '' },
      { label: 'Disciplina', value: `${disciplinePct}%`, icon: 'ti-checkup-list', color: disciplinePct >= 80 ? 'green' : disciplinePct >= 50 ? 'warning' : 'red', sub: activeSesiones.length > 0 ? `${failedCount}/${activeSesiones.length} sesiones con fallos` : 'Sin sesiones', clickable: true, action: 'disc-detail' },
      { label: 'Error más frecuente', value: topError ? topError[0] : '—', icon: 'ti-alert-triangle', color: 'warning', sub: topError ? `${topError[1]} ${topError[1] === 1 ? 'Error' : 'Errores'}` : 'Sin errores registrados', clickable: true, action: 'disc-errors' },
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
      <div class="metric-card${c.clickable ? ' clickable' : ''}" ${c.action ? `data-action="${c.action}"` : ''}>
        <div class="metric-icon color-${c.color}">
          <i class="ti ${c.icon}"></i>
        </div>
        <div class="metric-body">
          <div class="metric-label">${c.label} ${c.clickable ? '<i class="ti ti-chevron-right" style="font-size:0.75rem;opacity:0.5"></i>' : ''}</div>
          <div class="metric-value color-${c.color}">${c.value}</div>
          ${c.sub ? `<div class="metric-sub">${c.sub}</div>` : ''}
        </div>
      </div>`).join('')

    document.querySelector('[data-action="disc-detail"]')?.addEventListener('click', () => {
      openDisciplineDetailModal(activeSesiones, casByDate, periodCasuisticas)
    })
    document.querySelector('[data-action="disc-errors"]')?.addEventListener('click', () => {
      openDisciplineModal(periodCasuisticas, trades)
    })
  }

  async function init() {
    ;[allTrades, allSesiones, allCasuisticas] = await Promise.all([DB.getTrades(), DB.getSesiones(), DB.getAllCasuisticas()])
    render('month')

    document.querySelectorAll('.period-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'))
        btn.classList.add('active')
        render(btn.dataset.period)
      })
    })

    document.getElementById('closeDisciplineModal').addEventListener('click', () => {
      document.getElementById('disciplineModal').classList.add('hidden')
    })
    document.getElementById('disciplineModal').addEventListener('click', e => {
      if (e.target === e.currentTarget) e.currentTarget.classList.add('hidden')
    })
  }

  function rerender() {
    const active = document.querySelector('.period-btn.active')
    render(active?.dataset.period || 'month')
  }

  return { init, reload: init, rerender }
})()
