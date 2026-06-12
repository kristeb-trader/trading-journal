// ── Experimentos — laboratorio de seguimiento T/S ───────────────────────────
// Dashboard de decisión: tarjetas de veredicto + matriz cronológica (vista Excel)
const Experimentos = (() => {
  let catalogo  = []
  let registros = []   // diagnostico_experimentos con presente=true (todas las fechas)
  let allTrades = []   // para calcular la tasa de acierto base del período
  let currentPeriod = 'all'

  const MIN_MUESTRAS     = 20
  const UMBRAL_ADOPTAR   = 60
  const UMBRAL_DESCARTAR = 35
  const DAYS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb']

  function periodFrom(period) {
    const today = new Date()
    if (period === 'month') {
      return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`
    }
    if (period === '3m') {
      const d = new Date(); d.setDate(d.getDate() - 90)
      return d.toISOString().slice(0, 10)
    }
    return null
  }

  function computeStats(period) {
    const from = periodFrom(period)
    const regs = from ? registros.filter(r => r.sesion_date >= from) : registros

    // Tasa base: % target de los trades (sin break-even) del mismo período
    const tradesP = from ? allTrades.filter(t => (t.trade_date || '') >= from) : allTrades
    const nonBE = tradesP.filter(t => Math.abs(parseFloat(t.profit) || 0) > 6)
    const baseT = nonBE.filter(t => t.resultado === 'target').length
    const baseS = nonBE.filter(t => t.resultado === 'stop').length
    const base = (baseT + baseS) > 0 ? Math.round(baseT / (baseT + baseS) * 100) : null

    const stats = catalogo.map(exp => {
      const r = regs
        .filter(x => x.experimento_id === exp.id)
        .sort((a, b) => a.sesion_date.localeCompare(b.sesion_date))
      const targets = r.filter(x => x.resultado === 'T').length
      const stops   = r.filter(x => x.resultado === 'S').length
      const conRes  = targets + stops
      const pctT    = conRes > 0 ? Math.round(targets / conRes * 100) : null

      let estado, estadoLabel
      if (conRes >= MIN_MUESTRAS) {
        if (pctT >= UMBRAL_ADOPTAR)        { estado = 'candidato'; estadoLabel = 'Candidato a regla' }
        else if (pctT <= UMBRAL_DESCARTAR) { estado = 'descartar'; estadoLabel = 'Descartar' }
        else                               { estado = 'neutro';    estadoLabel = 'Neutro' }
      } else if (conRes === 0) {
        estado = 'prueba'; estadoLabel = 'En prueba · sin resultados'
      } else if (base != null) {
        estado = 'prueba'; estadoLabel = pctT >= base ? 'En prueba · va bien' : 'En prueba · va mal'
      } else {
        estado = 'prueba'; estadoLabel = 'En prueba'
      }

      return {
        id: exp.id, nombre: exp.nombre, activo: exp.activo,
        regs: r, total: r.length, targets, stops, conRes, pctT,
        estado, estadoLabel,
        ultima: r.length ? r[r.length - 1].sesion_date : null,
      }
    }).filter(e => e.total > 0)

    // Decididos arriba (candidato → descartar → neutro), luego en prueba por muestra
    const orden = { candidato: 0, descartar: 1, neutro: 2, prueba: 3 }
    stats.sort((a, b) => orden[a.estado] - orden[b.estado] || b.conRes - a.conRes || b.total - a.total)

    return { stats, base, regs }
  }

  function fmtFecha(d) {
    const [, m, day] = d.split('-')
    return `${day}/${m}`
  }

  function renderKpis(stats, regs) {
    const enPrueba   = stats.filter(e => e.estado === 'prueba' || e.estado === 'neutro').length
    const candidatos = stats.filter(e => e.estado === 'candidato').length
    const descartar  = stats.filter(e => e.estado === 'descartar').length
    const kpis = [
      { label: 'En prueba',         value: enPrueba,    color: 'var(--text)' },
      { label: 'Candidatos a regla', value: candidatos, color: candidatos > 0 ? 'var(--accent)' : 'var(--text3)' },
      { label: 'Para descartar',    value: descartar,   color: descartar > 0 ? 'var(--red)' : 'var(--text3)' },
      { label: 'Registros totales', value: regs.length, color: 'var(--text)' },
    ]
    document.getElementById('expdKpis').innerHTML = kpis.map(k => `
      <div class="expd-kpi">
        <div class="expd-kpi-label">${k.label}</div>
        <div class="expd-kpi-value" style="color:${k.color}">${k.value}</div>
      </div>`).join('')
  }

  function renderCards(stats, base) {
    const wrap = document.getElementById('expdCards')
    if (!stats.length) {
      wrap.innerHTML = '<p class="expd-empty">Sin registros de experimentos en el período. Márcalos en Registrar Sesión.</p>'
      return
    }

    wrap.innerHTML = stats.map(e => {
      const badgeClass = { candidato: 'b-candidato', descartar: 'b-descartar', neutro: 'b-neutro', prueba: 'b-prueba' }[e.estado]

      // % grande + delta vs base
      const pctColor = e.estado === 'candidato' ? 'var(--accent)'
                     : e.estado === 'descartar' ? 'var(--red)' : 'var(--text)'
      let deltaHtml = ''
      if (e.pctT != null && base != null) {
        const delta = e.pctT - base
        const col = delta > 0 ? 'var(--accent)' : delta < 0 ? 'var(--red)' : 'var(--text3)'
        deltaHtml = `<span class="expd-delta" style="color:${col}">${delta > 0 ? '+' : ''}${delta} pts vs base ${base}%</span>`
      }

      // Barra segmentada T/S
      const barHtml = e.conRes > 0 ? `
        <div class="expd-seg">
          <div style="width:${(e.targets / e.conRes * 100).toFixed(0)}%;background:var(--accent)"></div>
          <div style="flex:1;background:var(--red)"></div>
        </div>` : ''

      // Pie: muestra completa (puntos recientes) o progreso a 20
      let footHtml
      if (e.conRes >= MIN_MUESTRAS) {
        const dots = e.regs.filter(r => r.resultado === 'T' || r.resultado === 'S').slice(-5)
          .map(r => `<span class="expd-dot" style="background:${r.resultado === 'T' ? 'var(--accent)' : 'var(--red)'}" title="${r.sesion_date} ${r.resultado}"></span>`).join('')
        footHtml = `
          <div class="expd-foot">
            <span>${e.targets}T · ${e.stops}S — muestra completa <i class="ti ti-circle-check" style="color:var(--accent)"></i> ${e.conRes}/${MIN_MUESTRAS}</span>
            <span class="expd-dots" title="Últimos 5 resultados">${dots}</span>
          </div>`
      } else {
        const progW = Math.min(100, e.conRes / MIN_MUESTRAS * 100).toFixed(0)
        footHtml = `
          <div class="expd-foot">
            <span style="white-space:nowrap">${e.targets}T · ${e.stops}S</span>
            <div class="expd-prog"><div style="width:${progW}%"></div></div>
            <span style="white-space:nowrap">${e.conRes}/${MIN_MUESTRAS} · faltan ${MIN_MUESTRAS - e.conRes}</span>
          </div>`
      }

      const ultimaHtml = e.ultima
        ? `<div class="expd-ultima">Última aparición: ${e.ultima}${e.activo ? '' : ' · <span style="color:var(--text3)">inactivo</span>'}</div>` : ''

      return `
        <div class="expd-card estado-${e.estado}" data-exp-id="${e.id}" title="Ver fechas de ${e.nombre}">
          <div class="expd-card-head">
            <span class="expd-nombre">${e.nombre}</span>
            <span class="expd-badge ${badgeClass}">${e.estadoLabel}</span>
          </div>
          <div class="expd-big">
            <span class="expd-pct" style="color:${pctColor}">${e.pctT != null ? e.pctT + '%' : '—'}</span>
            <span class="expd-pct-sub">target</span>
            ${deltaHtml}
          </div>
          ${barHtml}
          ${footHtml}
          ${ultimaHtml}
        </div>`
    }).join('')

    // Clic en tarjeta → modal con las fechas del experimento
    wrap.querySelectorAll('.expd-card[data-exp-id]').forEach(card => {
      card.addEventListener('click', () => {
        const stat = stats.find(s => s.id === parseInt(card.dataset.expId))
        if (stat) openExpModal(stat, base)
      })
    })
  }

  // Modal con la lista de fechas de un experimento (reusa el overlay compartido)
  function openExpModal(e, base) {
    const titleEl = document.getElementById('disciplineModalTitle')
    if (titleEl) titleEl.innerHTML = `<i class="ti ti-flask"></i> ${e.nombre}`

    // P&L por fecha (para mostrar el resultado del día junto a cada registro)
    const pnlByDate = {}
    allTrades.forEach(t => {
      if (!t.trade_date) return
      pnlByDate[t.trade_date] = (pnlByDate[t.trade_date] || 0) + (parseFloat(t.profit) || 0)
    })
    const fmt$ = v => `${v < 0 ? '-' : '+'}$${Math.abs(v).toFixed(0)}`

    let deltaStr = ''
    if (e.pctT != null && base != null) {
      const d = e.pctT - base
      deltaStr = ` · <span style="color:${d > 0 ? 'var(--accent)' : d < 0 ? 'var(--red)' : 'var(--text3)'}">${d > 0 ? '+' : ''}${d} pts vs base</span>`
    }

    const rows = [...e.regs].sort((a, b) => b.sesion_date.localeCompare(a.sesion_date)).map(r => {
      const dow = DAYS[new Date(r.sesion_date + 'T12:00:00').getDay()]
      const pnl = pnlByDate[r.sesion_date]
      const pnlHtml = pnl != null
        ? `<span class="disc-date-pnl ${pnl > 0 ? 'pos' : pnl < 0 ? 'neg' : 'neutral'}" style="font-size:0.78rem;margin-left:auto">${fmt$(pnl)}</span>` : ''
      const res = (r.resultado === 'T' || r.resultado === 'S')
        ? `<span style="${pnl != null ? 'margin-left:8px' : 'margin-left:auto'}"><b class="${r.resultado === 'T' ? 'res-t' : 'res-s'}">${r.resultado}</b></span>`
        : `<span style="color:var(--text3);font-size:0.75rem;${pnl != null ? 'margin-left:8px' : 'margin-left:auto'}">sin resultado</span>`
      const nota = r.nota ? `<div class="expd-modal-nota">${r.nota}</div>` : ''
      return `
        <div class="disc-fail-day" data-date="${r.sesion_date}">
          <div class="disc-fail-day-header">
            <span class="disc-date-dow">${dow}</span>
            <span class="disc-date-val">${r.sesion_date}</span>
            ${pnlHtml}
            ${res}
            <i class="ti ti-photo disc-chevron" style="margin-left:6px"></i>
          </div>
          ${nota}
        </div>`
    }).join('')

    document.getElementById('disciplineModalContent').innerHTML = `
      <div style="padding:16px 20px 20px">
        <p class="disc-section-title">${e.targets}T · ${e.stops}S — ${e.pctT != null ? e.pctT + '% target' : 'sin resultados'}${deltaStr}</p>
        <p class="disc-hint" style="display:block;margin-bottom:6px">Toca una fecha para ver el detalle del día</p>
        ${rows}
      </div>`
    document.getElementById('disciplineModal').classList.remove('hidden')
  }

  function renderMatrix(stats, regs) {
    const cont = document.getElementById('expdMatrix')
    if (!stats.length) { cont.innerHTML = ''; return }

    // Solo fechas con al menos un registro, ascendente (recientes a la derecha)
    const fechas = [...new Set(regs.map(r => r.sesion_date))].sort()

    // Mapa experimento → fecha → resultado
    const mapa = {}
    regs.forEach(r => {
      if (!mapa[r.experimento_id]) mapa[r.experimento_id] = {}
      mapa[r.experimento_id][r.sesion_date] = r.resultado || '·'
    })

    const headHtml = fechas.map(f => {
      const dow = DAYS[new Date(f + 'T12:00:00').getDay()]
      return `<th><div>${fmtFecha(f)}</div><div class="expd-dow">${dow}</div></th>`
    }).join('')

    const rowsHtml = stats.map(e => {
      const cells = fechas.map(f => {
        const res = mapa[e.id]?.[f]
        if (!res) return '<td></td>'
        const cls = res === 'T' ? 'mx-t' : res === 'S' ? 'mx-s' : 'mx-n'
        return `<td class="${cls}" title="${e.nombre} — ${f}">${res}</td>`
      }).join('')
      return `
        <tr>
          <td class="expd-sticky">${e.nombre}</td>
          <td class="expd-tot expd-tot-t mx-t">${e.targets}</td>
          <td class="expd-tot expd-tot-s mx-s">${e.stops}</td>
          ${cells}
        </tr>`
    }).join('')

    cont.innerHTML = `
      <table class="expd-matrix">
        <thead>
          <tr>
            <th class="expd-sticky">Experimento</th>
            <th class="expd-tot expd-tot-t">T</th>
            <th class="expd-tot expd-tot-s">S</th>
            ${headHtml}
          </tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
      </table>`

    // Arrancar desplazado al extremo derecho (fechas recientes)
    cont.scrollLeft = cont.scrollWidth
  }

  function render(period = currentPeriod) {
    currentPeriod = period
    const { stats, base, regs } = computeStats(period)
    document.getElementById('expdBaseInfo').innerHTML = base != null
      ? `Tasa base del período: <b>${base}%</b> target`
      : 'Sin trades en el período para calcular tasa base'
    renderKpis(stats, regs)
    renderCards(stats, base)
    renderMatrix(stats, regs)
  }

  async function loadData() {
    ;[catalogo, registros, allTrades] = await Promise.all([
      DB.getCatalogoExperimentos(),
      DB.getAllExperimentoRegistros(),
      DB.getTrades(),
    ])
  }

  async function init() {
    await loadData()
    render('all')
    document.querySelectorAll('#expdPeriodSelector .period-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#expdPeriodSelector .period-btn').forEach(b => b.classList.remove('active'))
        btn.classList.add('active')
        render(btn.dataset.period)
      })
    })
  }

  // Refresco al volver a la sección (por si se registraron experimentos nuevos)
  async function reload() {
    await loadData()
    render(currentPeriod)
  }

  return { init, reload }
})()
