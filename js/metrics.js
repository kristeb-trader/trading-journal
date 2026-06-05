// Metrics / KPI calculations and rendering
const Metrics = (() => {
  let allTrades = []
  let allSesiones = []
  let allCasuisticas = []
  let allCatalogo = []
  let allObjetivos     = null
  let allExpCatalogo   = []
  let allExpRegistros  = []

  // Taxonomía de errores (debe coincidir con el catálogo)
  const TIPO_META = {
    psicologico: { label: '🧠 Psicológico', color: 'rgba(226,75,74,0.55)'  },
    analitico:   { label: '📐 Analítico',   color: 'rgba(63,138,255,0.55)' },
    operativo:   { label: '⚙️ Operativo',   color: 'rgba(186,117,23,0.55)' },
    marcado:     { label: '🗺️ Marcado',     color: 'rgba(124,108,243,0.55)'},
    sintipo:     { label: '❔ Sin clasificar', color: 'rgba(150,150,150,0.4)' },
  }

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
    { key: 'chk_noticias',    label: 'Calendario verificado' },
    { key: 'chk_consecucion', label: 'Rompimiento + Consecución' },
    { key: 'chk_estructura',  label: 'Estructura IRI'       },
  ]

  const DAYS = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']

  const DISC_FACTORS = [
    { key: 'chk_zonas',       label: 'Zonas vigentes verificadas'       },
    { key: 'chk_orden',       label: 'Orden precolocada a tiempo'       },
    { key: 'chk_5velas',      label: 'Máx 5 velas en corrida'           },
    { key: 'chk_noticias',    label: 'Calendario económico verificado'  },
    { key: 'chk_consecucion', label: 'Zona con consecución'             },
    { key: 'chk_estructura',  label: 'Estructura IRI fluida'            },
    { key: '_noErrors',       label: 'Sin errores de tipificación'      },
  ]

  // Modal "Disciplina de Proceso" — solo adherencia al checklist
  function openDisciplineDetailModal(activeSesiones) {
    const operatedSesiones = activeSesiones.filter(s => !s.no_opero)

    if (operatedSesiones.length === 0) {
      document.getElementById('disciplineModalContent').innerHTML =
        '<p style="padding:20px;color:var(--text3)">Sin días operados en el período.</p>'
      document.getElementById('disciplineModal').classList.remove('hidden')
      return
    }

    const CHECKLIST_FACTORS = DISC_FACTORS.filter(f => f.key !== '_noErrors')
    const checklistStats = CHECKLIST_FACTORS.map(f => {
      const fails = operatedSesiones.filter(s => !s[f.key])
      return { label: f.label, count: fails.length, pct: fails.length / operatedSesiones.length * 100 }
    }).sort((a, b) => b.count - a.count)

    const maxChk = checklistStats[0]?.count || 1

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

    // Días con fallos de checklist (solo días operados)
    const failedDays = operatedSesiones
      .map(s => ({ date: s.sesion_date, chkFails: CHECKLIST_FACTORS.filter(f => !s[f.key]) }))
      .filter(d => d.chkFails.length > 0)
      .sort((a, b) => b.date.localeCompare(a.date))

    const daysHtml = failedDays.length > 0
      ? failedDays.map(d => {
          const dow = DAYS[new Date(d.date + 'T12:00:00').getDay()]
          const amberTag = t => `<span class="disc-fail-tag" style="background:rgba(186,117,23,0.18);color:var(--warning);border-color:rgba(186,117,23,0.3)">${t}</span>`
          const chkTags = d.chkFails.map(f => amberTag(f.label)).join('')
          return `
            <div class="disc-fail-day" data-date="${d.date}">
              <div class="disc-fail-day-header">
                <span class="disc-date-dow">${dow}</span>
                <span class="disc-date-val">${d.date}</span>
                <span class="disc-fail-count">${d.chkFails.length} fallo${d.chkFails.length !== 1 ? 's' : ''}</span>
              </div>
              <div class="disc-fail-tags">${chkTags}</div>
            </div>`
        }).join('')
      : '<p style="color:var(--accent);font-size:0.85rem;padding:8px 0">¡Checklist perfecto en el período! 🎯</p>'

    document.getElementById('disciplineModalContent').innerHTML = `
      <div style="padding:16px 20px 20px">
        <p class="disc-section-title">Incumplimientos del checklist por factor</p>
        ${chkBarsHtml}
        <div class="disc-dates" style="margin-top:12px">
          <p class="disc-section-title">Días con fallos de checklist</p>
          ${daysHtml}
        </div>
      </div>`

    document.getElementById('disciplineModal').classList.remove('hidden')
  }

  // Modal "Tasa de Errores" — desglose por tipo, por origen y por nombre
  function openDisciplineModal(casuisticas, trades, tipoMap = {}, tipoCount = {}, origenCount = {}) {
    const total = casuisticas.length

    // Por nombre
    const countMap = {}
    casuisticas.forEach(c => { countMap[c.casuistica] = (countMap[c.casuistica] || 0) + 1 })
    const counts = Object.entries(countMap)
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count)
    const maxCount = counts[0]?.count || 1

    // Por tipo (taxonomía)
    const tipoEntries = Object.entries(tipoCount).sort((a, b) => b[1] - a[1])
    const maxTipo = tipoEntries[0]?.[1] || 1
    const tipoBarsHtml = tipoEntries.length > 0
      ? tipoEntries.map(([tipo, count]) => {
          const meta = TIPO_META[tipo] || TIPO_META.sintipo
          return `
            <div class="disc-item">
              <span class="disc-item-label">${meta.label}</span>
              <div class="disc-bar-wrap">
                <div class="disc-bar-fill" style="width:${(count / maxTipo * 100).toFixed(0)}%;background:${meta.color}"></div>
              </div>
              <span class="disc-count">${count}</span>
            </div>`
        }).join('')
      : '<p style="color:var(--text3);font-size:0.85rem">Sin errores en el período</p>'

    // Por origen (manual / IA / ambos)
    const origenLabels = { manual: '✍️ Manual', ia: '🤖 IA', ambos: '🤝 Ambos' }
    const origenHtml = Object.entries(origenLabels).map(([k, lbl]) => {
      const n = origenCount[k] || 0
      return `<span class="disc-origen-chip">${lbl}: <b>${n}</b></span>`
    }).join('')

    // Por nombre
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

    document.getElementById('disciplineModalContent').innerHTML = `
      <div style="padding:16px 20px 20px">
        <p class="disc-section-title">Errores por tipo</p>
        ${tipoBarsHtml}
        <div class="disc-origen-row">${origenHtml}</div>
        <p class="disc-section-title" style="margin-top:14px">Errores por nombre (${total} registros)</p>
        ${barsHtml}
      </div>`

    document.getElementById('disciplineModal').classList.remove('hidden')
  }

  // Modal "Cumplimiento de Reglas" — desglose de objetivos
  function openObjetivosModal(s) {
    const fmtCfg = (v, suffix = '') => v != null ? `${v}${suffix}` : '<span style="color:var(--text3)">sin definir</span>'
    const row = (label, value, ok) => `
      <div class="disc-item" style="align-items:center">
        <span class="disc-item-label">${label}</span>
        <span class="disc-count" style="${ok === true ? 'color:var(--accent)' : ok === false ? 'color:var(--red)' : ''}">${value}</span>
      </div>`

    const stopRow = s.stopMax != null
      ? row(`Stops dentro del límite ($${s.stopMax})`, `${s.stopsTotal - s.stopsExcedidos}/${s.stopsTotal}`, s.stopsExcedidos === 0)
      : ''
    const tradesRow = s.maxTrades != null
      ? row(`Días dentro del máx. de trades (${s.maxTrades})`, `${s.diasOperados - s.diasSobreoperados}/${s.diasOperados}`, s.diasSobreoperados === 0)
      : ''
    const limiteRow = s.limPerd != null
      ? row(`Días sin romper límite de pérdida ($${s.limPerd})`, `${s.diasOperados - s.diasRompioLimite}/${s.diasOperados}`, s.diasRompioLimite === 0)
      : ''
    const objetivoRow = s.pnlObj != null
      ? row(`Días que alcanzaron el objetivo ($${s.pnlObj})`, `${s.diasLogroObjetivo}/${s.diasOperados}`, null)
      : ''

    document.getElementById('disciplineModalContent').innerHTML = `
      <div style="padding:16px 20px 20px">
        <p class="disc-section-title">Cumplimiento global: <strong>${s.cumplimientoPct != null ? s.cumplimientoPct + '%' : '—'}</strong></p>
        ${stopRow}${tradesRow}${limiteRow}
        ${s.pnlObj != null ? `<p class="disc-section-title" style="margin-top:14px">Logro de objetivo (no es regla de disciplina)</p>${objetivoRow}` : ''}
        <p style="color:var(--text3);font-size:0.78rem;margin-top:14px">
          Configuración: stop máx ${fmtCfg(s.stopMax, '$')} · máx trades/día ${fmtCfg(s.maxTrades)} ·
          objetivo ${fmtCfg(s.pnlObj, '$')} · límite pérdida ${fmtCfg(s.limPerd, '$')}.
          Edítalos en Ajustes ⚙.
        </p>
      </div>`
    document.getElementById('disciplineModal').classList.remove('hidden')
  }

  // Modal "Días limpios"
  function openDiasLimpiosModal(s) {
    const barW = s.totalSesiones > 0 ? (s.total / s.totalSesiones * 100).toFixed(0) : 0
    const rachaMsg = s.racha > 0
      ? `<p style="color:var(--accent);font-size:0.9rem;font-weight:600;margin-bottom:12px">🏆 Racha actual: ${s.racha} día${s.racha !== 1 ? 's' : ''} limpio${s.racha !== 1 ? 's' : ''} consecutivo${s.racha !== 1 ? 's' : ''}</p>`
      : `<p style="color:var(--text3);font-size:0.85rem;margin-bottom:12px">Sin racha activa — el último día registrado tuvo errores.</p>`

    const daysHtml = s.fechasConError.length > 0
      ? [...s.fechasConError].sort((a,b) => b.localeCompare(a)).map(d => {
          const dow = DAYS[new Date(d + 'T12:00:00').getDay()]
          return `<div class="disc-date-row"><span class="disc-date-dow">${dow}</span><span class="disc-date-val">${d}</span><span style="color:var(--red);font-size:0.78rem">con errores</span></div>`
        }).join('')
      : '<p style="color:var(--accent);font-size:0.85rem">¡Todos los días del período fueron limpios!</p>'

    document.getElementById('disciplineModalContent').innerHTML = `
      <div style="padding:16px 20px 20px">
        ${rachaMsg}
        <div class="disc-item" style="margin-bottom:14px">
          <span class="disc-item-label">Días sin errores</span>
          <div class="disc-bar-wrap">
            <div class="disc-bar-fill" style="width:${barW}%;background:rgba(29,158,117,0.5)"></div>
          </div>
          <span class="disc-count" style="color:var(--accent)">${s.total}/${s.totalSesiones} (${s.pct}%)</span>
        </div>
        <p class="disc-section-title">Días con errores en el período</p>
        ${daysHtml}
      </div>`
    document.getElementById('disciplineModal').classList.remove('hidden')
  }

  // Modal "Dejé de ganar"
  function openDejeGanarModal(s) {
    if (!s.total) {
      document.getElementById('disciplineModalContent').innerHTML =
        '<p style="padding:20px;color:var(--accent)">✅ Sin setups perdidos en el período.</p>'
      document.getElementById('disciplineModal').classList.remove('hidden')
      return
    }
    const rows = s.items.map(c => {
      const dow = DAYS[new Date(c.sesion_date + 'T12:00:00').getDay()]
      const resClass = c.resultado === 'T' ? 'cas-badge-t' : 'cas-badge-s'
      const tipo = { psicologico:'🧠', analitico:'📐', operativo:'⚙️', marcado:'🗺️' }[c.tipo] || '•'
      return `
        <div class="disc-fail-day">
          <div class="disc-fail-day-header">
            <span class="disc-date-dow">${dow}</span>
            <span class="disc-date-val">${c.sesion_date}</span>
            <span class="${resClass}">${c.resultado}</span>
          </div>
          <div class="disc-fail-tags">
            <span class="disc-fail-tag">${tipo} ${c.casuistica}</span>
          </div>
        </div>`
    }).join('')

    document.getElementById('disciplineModalContent').innerHTML = `
      <div style="padding:16px 20px 20px">
        <div style="display:flex;gap:16px;margin-bottom:14px">
          <span style="color:var(--accent);font-size:0.85rem"><strong>${s.targets}</strong> targets dejados pasar</span>
          <span style="color:var(--red);font-size:0.85rem"><strong>${s.stops}</strong> stops evitados</span>
        </div>
        <p class="disc-section-title">Detalle por día</p>
        ${rows}
      </div>`
    document.getElementById('disciplineModal').classList.remove('hidden')
  }

  // Modal "Experimentos"
  function openExperimentosModal(stats, minMuestras) {
    if (!stats.length) {
      document.getElementById('disciplineModalContent').innerHTML =
        '<p style="padding:20px;color:var(--text3)">Sin registros de experimentos aún. Márcalos en el formulario de sesión.</p>'
      document.getElementById('disciplineModal').classList.remove('hidden')
      return
    }
    const bloques = stats.map(e => {
      const barW = e.conRes > 0 ? (e.targets / e.conRes * 100).toFixed(0) : 0
      const pendientes = Math.max(0, minMuestras - e.conRes)
      let sugerencia = ''
      if (e.conRes >= minMuestras) {
        if (e.pctT >= 60)       sugerencia = `<span style="color:var(--accent);font-size:0.78rem">✅ Candidato a regla: se presentó a favor ${e.pctT}% de los casos → considera adoptarlo</span>`
        else if (e.pctT <= 35)  sugerencia = `<span style="color:var(--red);font-size:0.78rem">❌ Descartar: solo ${e.pctT}% target en ${e.conRes} casos → no aporta como filtro</span>`
        else                    sugerencia = `<span style="color:var(--warning);font-size:0.78rem">⚖️ Neutro (${e.pctT}% target) — sin evidencia suficiente para decidir</span>`
      }
      return `
        <div style="margin-bottom:16px">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
            <strong style="font-size:0.88rem">🧪 ${e.nombre}</strong>
            <span style="font-size:0.78rem;color:var(--text3)">${e.total} registros · ${e.conRes} con resultado</span>
          </div>
          ${e.conRes > 0 ? `
            <div class="disc-item" style="margin-bottom:4px">
              <span class="disc-item-label">% Target</span>
              <div class="disc-bar-wrap">
                <div class="disc-bar-fill" style="width:${barW}%;background:rgba(29,158,117,0.5)"></div>
              </div>
              <span class="disc-count" style="color:var(--accent)">${e.targets}T · ${e.stops}S</span>
            </div>` : ''}
          ${pendientes > 0
            ? `<p style="color:var(--text3);font-size:0.78rem;margin:4px 0">Faltan ${pendientes} casos con resultado para emitir sugerencia</p>`
            : sugerencia}
        </div>`
    }).join('<hr style="border:none;border-top:1px solid var(--border);margin:12px 0">')

    document.getElementById('disciplineModalContent').innerHTML = `
      <div style="padding:16px 20px 20px">
        <p class="disc-section-title">Resultados por experimento (mín. ${minMuestras} casos para decidir)</p>
        ${bloques}
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
    const isBreakEven = t => Math.abs(parseFloat(t.profit) || 0) <= 6
    const nonBETrades = trades.filter(t => !isBreakEven(t))
    const targets = nonBETrades.filter(t => t.resultado === 'target').length
    const stops   = nonBETrades.filter(t => t.resultado === 'stop').length
    const winRate = nonBETrades.length > 0 ? (targets / nonBETrades.length * 100).toFixed(1) : 0
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
    // Días B.E.: todos los trades del día tienen |profit| <= 6
    const tradesByDate = {}
    trades.forEach(t => {
      if (!t.trade_date) return
      if (!tradesByDate[t.trade_date]) tradesByDate[t.trade_date] = []
      tradesByDate[t.trade_date].push(t)
    })
    const beDaysCount = Object.values(tradesByDate)
      .filter(dayTrades => dayTrades.every(t => isBreakEven(t))).length
    const noOperoCount = sesiones.filter(s => s.no_opero).length + beDaysCount
    // "Sin setup" days count: trader was present pero no hubo setup válido
    const activeSesiones = sesiones

    // Casuísticas filtradas por el mismo período
    const periodCasuisticas = filterCasuisticasByPeriod(allCasuisticas, period)

    // ── Disciplina de Proceso: % de ítems de checklist cumplidos (días operados) ──
    const operatedSes  = activeSesiones.filter(s => !s.no_opero)
    const chkItemsTotal = operatedSes.length * 6
    const chkItemsOk    = operatedSes.reduce((sum, s) =>
      sum + [s.chk_zonas, s.chk_orden, s.chk_5velas, s.chk_noticias, s.chk_consecucion, s.chk_estructura]
        .filter(Boolean).length, 0)
    const disciplinaProceso = chkItemsTotal > 0 ? Math.round(chkItemsOk / chkItemsTotal * 100) : 0

    // ── Tasa de Errores: % de días registrados con al menos un error ──
    const diasConError = new Set(periodCasuisticas.map(c => c.sesion_date)).size
    const totalDiasReg = activeSesiones.length
    const tasaErrorPct = totalDiasReg > 0 ? Math.round(diasConError / totalDiasReg * 100) : 0

    // ── Tipo (preferir el de la fila; fallback al catálogo) y conteos ──
    const tipoMap = {}
    allCatalogo.forEach(c => { tipoMap[c.nombre] = c.tipo || 'sintipo' })
    const tipoCount = {}
    const origenCount = { manual: 0, ia: 0, ambos: 0 }
    periodCasuisticas.forEach(c => {
      const t = c.tipo || tipoMap[c.casuistica] || 'sintipo'
      tipoCount[t] = (tipoCount[t] || 0) + 1
      const o = c.origen || 'manual'
      origenCount[o] = (origenCount[o] || 0) + 1
    })

    // ── Cumplimiento de reglas (objetivos) ──
    const obj = allObjetivos || {}
    const stopMax   = obj.stop_max_usd   != null ? parseFloat(obj.stop_max_usd)   : null
    const maxTrades = obj.max_trades_dia != null ? parseInt(obj.max_trades_dia)   : null
    const limPerd   = obj.limite_perdida_dia != null ? Math.abs(parseFloat(obj.limite_perdida_dia)) : null
    const pnlObj    = obj.pnl_objetivo_dia   != null ? parseFloat(obj.pnl_objetivo_dia) : null

    // Agregados por día operado (fechas con trades)
    const pnlPorDia = {}, stopMaxPorDia = {}
    Object.entries(tradesByDate).forEach(([d, ts]) => {
      pnlPorDia[d] = ts.reduce((s, t) => s + (parseFloat(t.profit) || 0), 0)
      const stopsDia = ts.filter(t => t.resultado === 'stop').map(t => Math.abs(parseFloat(t.profit) || 0))
      stopMaxPorDia[d] = stopsDia.length ? Math.max(...stopsDia) : 0
    })
    const fechasOperadas = Object.keys(tradesByDate)

    let stopsExcedidos = 0, stopsTotal = 0
    trades.forEach(t => {
      if (t.resultado !== 'stop') return
      stopsTotal++
      if (stopMax != null && Math.abs(parseFloat(t.profit) || 0) > stopMax) stopsExcedidos++
    })
    let diasSobreoperados = 0, diasRompioLimite = 0, diasLogroObjetivo = 0
    let checks = 0, passed = 0
    fechasOperadas.forEach(d => {
      const n = tradesByDate[d].length
      if (maxTrades != null) { checks++; (n <= maxTrades) ? passed++ : diasSobreoperados++ }
      if (stopMax != null)   { checks++; (stopMaxPorDia[d] <= stopMax) ? passed++ : null }
      if (limPerd != null)   { checks++; (pnlPorDia[d] >= -limPerd) ? passed++ : diasRompioLimite++ }
      if (pnlObj != null && pnlPorDia[d] >= pnlObj) diasLogroObjetivo++
    })
    const cumplimientoPct = checks > 0 ? Math.round(passed / checks * 100) : null
    const objStats = {
      configurado: stopMax != null || maxTrades != null || limPerd != null,
      stopMax, maxTrades, limPerd, pnlObj,
      stopsExcedidos, stopsTotal, diasSobreoperados, diasRompioLimite,
      diasLogroObjetivo, diasOperados: fechasOperadas.length, cumplimientoPct,
    }

    // ── Días limpios (sin errores en el período) ──────────────────────────
    const fechasConError = new Set(periodCasuisticas.map(c => c.sesion_date))
    const diasConSesion  = activeSesiones.map(s => s.sesion_date)
    const diasLimpios    = diasConSesion.filter(d => !fechasConError.has(d))
    const totalSesiones  = diasConSesion.length

    // Racha actual de días limpios (contando desde hoy hacia atrás)
    const sesionesOrd = [...activeSesiones].sort((a, b) => b.sesion_date.localeCompare(a.sesion_date))
    let rachaLimpia = 0
    for (const s of sesionesOrd) {
      if (!fechasConError.has(s.sesion_date)) rachaLimpia++
      else break
    }
    const diasLimpiosStat = {
      total: diasLimpios.length,
      totalSesiones,
      pct: totalSesiones > 0 ? Math.round(diasLimpios.length / totalSesiones * 100) : 0,
      racha: rachaLimpia,
      fechasLimpias: diasLimpios,
      fechasConError: [...fechasConError],
    }

    // ── Dejé de ganar (errores con resultado=T en días no operados) ──────
    const perdidas = periodCasuisticas.filter(c => c.resultado === 'T')
    const ganadas  = periodCasuisticas.filter(c => c.resultado === 'S')
    const dejeGanarStat = {
      total: perdidas.length + ganadas.length,
      targets: perdidas.length,
      stops: ganadas.length,
      items: periodCasuisticas
        .filter(c => c.resultado === 'T' || c.resultado === 'S')
        .sort((a, b) => b.sesion_date.localeCompare(a.sesion_date)),
    }

    // ── Experimentos (filtrar por período) ────────────────────────────────
    const periodFrom = period === 'all' ? null
      : period === 'month' ? `${calYear()}-${String(calMonth()).padStart(2,'0')}-01`
      : (() => { const d = new Date(); d.setDate(d.getDate()-d.getDay()+1); return d.toISOString().slice(0,10) })()
    const expRegistrosPeriodo = allExpRegistros.filter(r =>
      !periodFrom || r.sesion_date >= periodFrom)
    const expStats = allExpCatalogo.filter(e => e.activo).map(exp => {
      const regs = expRegistrosPeriodo.filter(r => r.experimento_id === exp.id)
      const total = regs.length
      const targets = regs.filter(r => r.resultado === 'T').length
      const stops   = regs.filter(r => r.resultado === 'S').length
      const conRes  = targets + stops
      const pctT = conRes > 0 ? Math.round(targets / conRes * 100) : null
      return { id: exp.id, nombre: exp.nombre, total, targets, stops, conRes, pctT, regs }
    }).filter(e => e.total > 0)
    const MIN_MUESTRAS = 20
    const expConSugerencia = expStats.filter(e => e.conRes >= MIN_MUESTRAS)

    const cards = [
      { label: 'P&L Neto Total', value: `${netPnl >= 0 ? '+' : ''}$${netPnl.toFixed(2)}`, icon: 'ti-currency-dollar', color: netPnl >= 0 ? 'green' : 'red', sub: `Promedio: ${avgPnl >= 0 ? '+' : ''}$${avgPnl.toFixed(0)}/día` },
      { label: 'Tasa de Acierto', value: `${winRate}%`, icon: 'ti-target', color: parseFloat(winRate) >= 50 ? 'green' : 'red', sub: `${targets} targets / ${stops} stops` },
      { label: 'Disciplina de Proceso', value: `${disciplinaProceso}%`, icon: 'ti-checkup-list', color: disciplinaProceso >= 80 ? 'green' : disciplinaProceso >= 50 ? 'warning' : 'red', sub: chkItemsTotal > 0 ? `${chkItemsOk}/${chkItemsTotal} ítems de checklist` : 'Sin días operados', clickable: true, action: 'disc-detail' },
      { label: 'Tasa de Errores', value: `${tasaErrorPct}%`, icon: 'ti-alert-triangle', color: tasaErrorPct <= 20 ? 'green' : tasaErrorPct <= 50 ? 'warning' : 'red', sub: totalDiasReg > 0 ? `${periodCasuisticas.length} errores · ${diasConError}/${totalDiasReg} días` : 'Sin sesiones', clickable: true, action: 'disc-errors' },
      { label: 'Cumplimiento de Reglas', value: cumplimientoPct != null ? `${cumplimientoPct}%` : '—', icon: 'ti-shield-check', color: cumplimientoPct == null ? 'neutral' : cumplimientoPct >= 90 ? 'green' : cumplimientoPct >= 70 ? 'warning' : 'red', sub: objStats.configurado ? `${objStats.diasOperados} días evaluados` : 'Configura objetivos en Ajustes', clickable: objStats.configurado, action: 'objetivos-detail' },
      { label: 'Días limpios', value: rachaLimpia > 0 ? `${rachaLimpia} 🏆` : '0', icon: 'ti-circle-check', color: diasLimpiosStat.pct >= 70 ? 'green' : diasLimpiosStat.pct >= 40 ? 'warning' : 'red', sub: `${diasLimpiosStat.total}/${diasLimpiosStat.totalSesiones} días sin errores`, clickable: diasLimpiosStat.totalSesiones > 0, action: 'dias-limpios' },
      { label: 'Dejé de ganar', value: dejeGanarStat.targets > 0 ? `${dejeGanarStat.targets} ⚠️` : '0 ✅', icon: 'ti-mood-sad', color: dejeGanarStat.targets === 0 ? 'green' : dejeGanarStat.targets <= 2 ? 'warning' : 'red', sub: dejeGanarStat.total > 0 ? `${dejeGanarStat.targets}T · ${dejeGanarStat.stops}S dejados pasar` : 'Sin setups perdidos', clickable: dejeGanarStat.total > 0, action: 'deje-ganar' },
      { label: 'Experimentos', value: expConSugerencia.length > 0 ? `${expConSugerencia.length} 🔬` : expStats.length > 0 ? `${expStats.length} en curso` : '—', icon: 'ti-flask', color: expConSugerencia.length > 0 ? 'warning' : 'neutral', sub: expStats.length > 0 ? `${expStats.length} activos · ${MIN_MUESTRAS} casos para decidir` : 'Sin registros aún', clickable: expStats.length > 0, action: 'experimentos' },
      {
        label: 'Targets · Stops · Sin entrada',
        value: `<span style="color:var(--accent)">${targets}</span> · <span style="color:var(--red)">${stops}</span> · ${noOperoCount}`,
        icon: 'ti-chart-bar',
        color: 'neutral',
        sub: `Ratio T/S: ${stops > 0 ? (targets / stops).toFixed(2) : targets > 0 ? '∞' : '—'}`,
      },
      { label: 'Racha actual', value: streak.count > 0 ? `${streak.count} ${streak.type === 'win' ? '🟢' : '🔴'}` : '—', icon: 'ti-flame', color: streak.type === 'win' ? 'green' : 'red', sub: streak.type === 'win' ? 'victorias seguidas' : streak.type === 'loss' ? 'pérdidas seguidas' : '' },
      { label: 'Mejor día', value: best ? `+$${best[1].toFixed(0)}` : '—', icon: 'ti-trending-up', color: 'green', sub: best ? best[0] : '' },
      { label: 'Peor día', value: worst ? `${worst[1] >= 0 ? '+' : ''}$${worst[1].toFixed(0)}` : '—', icon: 'ti-trending-down', color: worst ? (worst[1] >= 0 ? 'green' : 'red') : 'neutral', sub: worst ? worst[0] : '' },
      {
        label: 'Max Drawdown',
        value: maxDD > 0 ? `-$${maxDD.toFixed(2)}` : '$0',
        icon: 'ti-chart-arrows-vertical',
        color: maxDD === 0 ? 'green' : maxDD < 200 ? 'neutral' : 'red',
        sub: 'Máxima caída desde pico',
      },
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
      { label: 'Total Trades', value: totalTrades, icon: 'ti-list-numbers', color: 'neutral', sub: `${tradingDays} días operados` },
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
      openDisciplineDetailModal(activeSesiones)
    })
    document.querySelector('[data-action="disc-errors"]')?.addEventListener('click', () => {
      openDisciplineModal(periodCasuisticas, trades, tipoMap, tipoCount, origenCount)
    })
    document.querySelector('[data-action="objetivos-detail"]')?.addEventListener('click', () => {
      openObjetivosModal(objStats)
    })
    document.querySelector('[data-action="dias-limpios"]')?.addEventListener('click', () => {
      openDiasLimpiosModal(diasLimpiosStat)
    })
    document.querySelector('[data-action="deje-ganar"]')?.addEventListener('click', () => {
      openDejeGanarModal(dejeGanarStat)
    })
    document.querySelector('[data-action="experimentos"]')?.addEventListener('click', () => {
      openExperimentosModal(expStats, MIN_MUESTRAS)
    })
  }

  async function init() {
    ;[allTrades, allSesiones, allCasuisticas, allCatalogo, allObjetivos, allExpCatalogo, allExpRegistros] = await Promise.all([
      DB.getTrades(), DB.getSesiones(), DB.getAllCasuisticas(), DB.getCatalogoCasuisticas(), DB.getObjetivos(), DB.getCatalogoExperimentos(), DB.getAllExperimentoRegistros()
    ])
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
    document.addEventListener('keydown', e => {
      if (e.key !== 'Escape') return
      const dm = document.getElementById('disciplineModal')
      if (!dm.classList.contains('hidden')) dm.classList.add('hidden')
    })

    // Días con fallos → abrir modal de detalle del día
    document.getElementById('disciplineModalContent').addEventListener('click', async e => {
      const dayEl = e.target.closest('.disc-fail-day[data-date]')
      if (!dayEl) return
      const date = dayEl.dataset.date
      document.getElementById('disciplineModal').classList.add('hidden')
      const [trades, sesion] = await Promise.all([
        DB.getTradesByDate(date),
        DB.getSesionByDate(date),
      ])
      await Modal.openDay(date, trades, sesion)
    })
  }

  function rerender() {
    const active = document.querySelector('.period-btn.active')
    render(active?.dataset.period || 'month')
  }

  function setObjetivos(obj) {
    allObjetivos = obj
    rerender()
  }

  return { init, reload: init, rerender, setObjetivos }
})()
