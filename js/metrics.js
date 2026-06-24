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
  // Colores semánticos por tipo: color = punto/barra (sólido), text = etiqueta (claro)
  const TIPO_META = {
    psicologico: { label: 'Psicológico',    color: '#7F77DD', text: '#afa9ec', icon: 'ti-brain'           },
    analitico:   { label: 'Analítico',      color: '#378ADD', text: '#85b7eb', icon: 'ti-ruler-measure'   },
    operativo:   { label: 'Operativo',      color: '#D85A30', text: '#f0997b', icon: 'ti-settings'        },
    marcado:     { label: 'Marcado',        color: '#BA7517', text: '#ef9f27', icon: 'ti-map-2'           },
    sintipo:     { label: 'Sin clasificar', color: '#888780', text: '#b4b2a9', icon: 'ti-help-circle'     },
  }

  // Fija el título del modal compartido (icono Tabler + texto)
  function setModalTitle(icon, text) {
    const h = document.getElementById('disciplineModalTitle')
    if (h) h.innerHTML = `<i class="ti ${icon}"></i> ${text}`
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
      return clavesActivas().every(k => s[k]) && !casByDate[s.sesion_date]
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

  // Rango del período inmediatamente anterior (para tendencias)
  function getPrevRange(period) {
    if (period === 'all') return null
    if (period === 'month') {
      let y = calYear(), m = calMonth() - 1
      if (m === 0) { m = 12; y-- }
      const from = `${y}-${String(m).padStart(2, '0')}-01`
      const to = `${y}-${String(m).padStart(2, '0')}-${String(new Date(y, m, 0).getDate()).padStart(2, '0')}`
      return { from, to, label: 'mes anterior' }
    }
    // week: lunes a domingo de la semana pasada
    const mon = new Date()
    mon.setDate(mon.getDate() - mon.getDay() + 1)
    const prevMon = new Date(mon); prevMon.setDate(mon.getDate() - 7)
    const prevSun = new Date(mon); prevSun.setDate(mon.getDate() - 1)
    return { from: prevMon.toISOString().slice(0, 10), to: prevSun.toISOString().slice(0, 10), label: 'semana anterior' }
  }

  // Chip de tendencia: compara % actual vs anterior; goodWhenUp indica si subir es bueno
  function trendChip(curr, prev, goodWhenUp, label) {
    if (prev == null || curr == null) return ''
    const delta = curr - prev
    if (delta === 0) return `<span class="trend-chip neutral">= sin cambio vs ${label}</span>`
    const up = delta > 0
    const good = up === goodWhenUp
    return `<span class="trend-chip ${good ? 'good' : 'bad'}">${up ? '▲' : '▼'} ${up ? '+' : '−'}${Math.abs(delta)} pts vs ${label}</span>`
  }

  const DAYS = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']

  // Factores del checklist — se cargan dinámicamente del catálogo en init().
  // Cada factor: { key: <clave>, label: <texto>, fase }. Fallback al default de DB.
  let DISC_FACTORS = []
  function buildDiscFactors(items) {
    const src = (items && items.length) ? items : DB.checklistClaves().map(c => ({ clave: c, texto: c, fase: 1 }))
    DISC_FACTORS = src
      .filter(i => i.activo !== false)
      .map(i => ({ key: i.clave, label: i.texto, fase: i.fase || 1 }))
  }
  // Claves activas del checklist (para conteos de disciplina)
  function clavesActivas() {
    return DISC_FACTORS.length ? DISC_FACTORS.map(f => f.key) : DB.checklistClaves()
  }

  // ¿La sesión se "conectó" ese día? (operó, o no operó pero sí se conectó a analizar)
  function seConecto(s) { return !s.no_opero || s.se_conecto !== false }

  // ¿Aplica un factor a una sesión? Fase 1 (Pre-sesión) en todo día conectado;
  // Fases 2/3 solo en días operados. (El 18 jun "sin entradas" suma su Fase 1.)
  function factorAplica(f, s) {
    if (!seConecto(s)) return false
    return f.fase === 1 ? true : !s.no_opero
  }

  // Disciplina de un conjunto de sesiones: { total, ok, pct } sobre factores aplicables
  function calcDisciplina(sesiones) {
    let total = 0, ok = 0
    sesiones.forEach(s => DISC_FACTORS.forEach(f => {
      if (!factorAplica(f, s)) return
      total++
      if (s[f.key]) ok++
    }))
    return { total, ok, pct: total > 0 ? Math.round(ok / total * 100) : 0 }
  }

  const FASES = {
    1: { label: 'Fase 1 · Pre-sesión',      color: 'var(--accent)' },
    2: { label: 'Fase 2 · Lectura del setup', color: 'var(--warning)' },
    3: { label: 'Fase 3 · Ejecución',       color: '#5b94c9' },
  }

  // Modal "Disciplina de Proceso" — solo adherencia al checklist
  function openDisciplineDetailModal(activeSesiones) {
    setModalTitle('ti-checkup-list', 'Análisis de Disciplina')
    const operatedSesiones  = activeSesiones.filter(s => !s.no_opero)
    const conectadoSesiones = activeSesiones.filter(seConecto)  // operó o se conectó a analizar

    if (conectadoSesiones.length === 0) {
      document.getElementById('disciplineModalContent').innerHTML =
        '<p style="padding:20px;color:var(--text3)">Sin días con actividad en el período.</p>'
      document.getElementById('disciplineModal').classList.remove('hidden')
      return
    }

    const CHECKLIST_FACTORS = DISC_FACTORS.filter(f => f.key !== '_noErrors')

    const fmtChip = d => {
      const [, m, day] = d.split('-')
      const dow = DAYS[new Date(d + 'T12:00:00').getDay()]
      return `${dow} ${parseInt(day)}/${m}`
    }

    // Cumplimiento por fase: % de la fase + sus ítems con incumplimientos.
    // Cada ítem con fallos es clickable y despliega los días con ese fallo.
    const phaseStats = [1, 2, 3].map(fase => {
      const facs = CHECKLIST_FACTORS.filter(f => f.fase === fase)
      // Fase 1 se evalúa en días conectados; Fases 2/3 solo en días operados
      const dias = fase === 1 ? conectadoSesiones : operatedSesiones
      const total = facs.length * dias.length
      const ok = dias.reduce((sum, s) => sum + facs.filter(f => s[f.key]).length, 0)
      const factores = facs.map(f => ({
        key: f.key,
        label: f.label,
        fails: dias.filter(s => !s[f.key]).map(s => s.sesion_date).sort((a, b) => a.localeCompare(b)),
      }))
      return { fase, pct: total > 0 ? Math.round(ok / total * 100) : null, factores, ...FASES[fase] }
    }).filter(p => p.factores.length > 0)

    // Color brillante de cada fase para el rediseño (menta / ámbar / azul)
    const DISP_COLOR = { 1: '#3FE0A6', 2: '#E0A33B', 3: '#6FA8DC' }

    const phaseHtml = phaseStats.map(p => {
      const factoresHtml = p.factores.map(fc => {
        const n  = fc.fails.length
        const ok = n === 0
        const daysHtml = fc.fails.map(d =>
          `<span class="disc-fail-day disc2-day" data-date="${d}">${fmtChip(d)}</span>`).join('')
        const right = ok
          ? `<span class="disc2-ok"><i class="ti ti-check"></i></span>`
          : `<span class="disc2-warn">${n} <i class="ti ti-chevron-right"></i></span>`
        return `
          <div class="disc-factor-row disc2-row ${ok ? '' : 'disc-clickable'}" ${ok ? '' : `data-key="${fc.key}"`}>
            <span class="disc2-left">
              <span class="disc2-dot ${ok ? 'ok' : 'warn'}"></span>
              <span class="disc-factor-label disc2-lab">${fc.label}</span>
            </span>
            ${right}
          </div>
          ${ok ? '' : `<div class="disc-factor-days disc2-days hidden" data-for="${fc.key}">${daysHtml}</div>`}`
      }).join('')
      // Color de barra/% según el nivel de cumplimiento (verde menta alto, ámbar medio, rojo bajo)
      const col  = p.pct == null ? '#3FE0A6' : p.pct >= 85 ? '#3FE0A6' : p.pct >= 60 ? '#E0A33B' : '#E24B4A'
      const fill = col === '#3FE0A6' ? 'linear-gradient(90deg,#1D9E75,#3FE0A6)' : col
      return `
        <div class="disc2-phase">
          <div class="disc2-phead">
            <span class="disc2-pname" style="color:${DISP_COLOR[p.fase] || p.color}">${p.label}</span>
            <div class="disc2-ptrack"><div class="disc2-pfill" style="width:${p.pct ?? 0}%;background:${fill}"></div></div>
            <span class="disc2-ppct" style="color:${col}">${p.pct == null ? '—' : p.pct + '%'}</span>
          </div>
          <div class="disc2-rows">${factoresHtml}</div>
        </div>`
    }).join('')

    // Racha de disciplina (Bloque 4): días operados consecutivos (desde el más
    // reciente) con el checklist 100% completo.
    const opOrd = [...operatedSesiones].sort((a, b) => b.sesion_date.localeCompare(a.sesion_date))
    let rachaDisc = 0
    for (const s of opOrd) { if (CHECKLIST_FACTORS.every(f => s[f.key])) rachaDisc++; else break }
    const rachaHtml = rachaDisc > 0
      ? `<div class="disc2-streak">
           <span class="disc2-streak-badge"><i class="ti ti-target-arrow"></i></span>
           <div class="disc2-streak-body">
             <span class="disc2-streak-num">${rachaDisc}</span>
             <span class="disc2-streak-lbl">día${rachaDisc !== 1 ? 's' : ''} operado${rachaDisc !== 1 ? 's' : ''} con checklist <b>100% seguido${rachaDisc !== 1 ? 's' : ''}</b></span>
           </div>
         </div>`
      : `<div class="disc2-streak disc2-streak-off">
           <span class="disc2-streak-badge off"><i class="ti ti-alert-triangle"></i></span>
           <span class="disc2-streak-lbl">Sin racha de checklist 100% — el último día operado tuvo algún ítem sin marcar.</span>
         </div>`

    document.getElementById('disciplineModalContent').innerHTML = `
      <div class="disc2">
        ${rachaHtml}
        <p class="disc2-sec-t">Cumplimiento por fase del proceso</p>
        <p class="disc2-hint">Toca un ítem con incumplimientos para ver los días.</p>
        ${phaseHtml}
      </div>`

    document.getElementById('disciplineModal').classList.remove('hidden')
  }

  // Modal "Tasa de Errores" — desglose por tipo/origen/nombre con drill-down
  // Navegación: raíz → errores de un tipo → fechas de un error → imagen del día
  function openDisciplineModal(casuisticas, trades, tipoMap = {}, tipoCount = {}, origenCount = {}, extras = {}) {
    const total    = casuisticas.length
    const contentEl = document.getElementById('disciplineModalContent')
    const getTipo  = c => c.tipo || tipoMap[c.casuistica] || 'sintipo'

    // P&L por fecha (para mostrar el costo del día en el drill-down)
    const pnlByDate = {}
    ;(trades || []).forEach(t => {
      if (!t.trade_date) return
      pnlByDate[t.trade_date] = (pnlByDate[t.trade_date] || 0) + (parseFloat(t.profit) || 0)
    })
    const fmt$ = v => `${v < 0 ? '-' : '+'}$${Math.abs(v).toFixed(0)}`

    // Barra reutilizable
    const barRow = (label, count, max, color, cls, data) => `
      <div class="disc-item ${data ? 'disc-clickable' : ''}" ${data || ''}>
        <span class="disc-item-label">${label}</span>
        <div class="disc-bar-wrap">
          <div class="disc-bar-fill ${cls || ''}" style="width:${(count / max * 100).toFixed(0)}%${color ? `;background:${color}` : ''}"></div>
        </div>
        <span class="disc-count">${count}</span>
        ${data ? '<i class="ti ti-chevron-right disc-chevron"></i>' : ''}
      </div>`

    // ── Vista raíz: rediseño dark ────────────────────────────────────────
    function renderRoot() {
      setModalTitle('ti-alert-triangle', 'Análisis de Errores')
      const fmtChip = d => {
        const [, , day] = d.split('-')
        return `${DAYS[new Date(d + 'T12:00:00').getDay()].toLowerCase()} ${day}`
      }

      // ── Días sin errores + días con errores (asc) ──
      const dl = extras.diasLimpios
      let cleanHtml = ''
      if (dl) {
        const chips = [...dl.fechasConError].sort((a, b) => a.localeCompare(b))
          .map(d => `<span class="err-day-chip"><i class="ti ti-calendar-event"></i>${fmtChip(d)}</span>`).join('')
        cleanHtml = `
          <div class="err-clean-card">
            ${dl.racha > 0 ? `<p class="err-racha"><i class="ti ti-flame"></i> Racha: ${dl.racha} día${dl.racha !== 1 ? 's' : ''} limpio${dl.racha !== 1 ? 's' : ''} seguido${dl.racha !== 1 ? 's' : ''}</p>` : ''}
            <div class="err-clean-head">
              <div><div class="err-clean-lbl">Días sin errores</div><div class="err-clean-sub">${dl.total} de ${dl.totalSesiones} días operados</div></div>
              <div class="err-clean-pct">${dl.pct}%</div>
            </div>
            <div class="err-track"><div class="err-track-fill" style="width:${dl.pct}%;background:var(--accent)"></div></div>
          </div>
          <p class="disc-section-title">Días con errores en el período</p>
          <div class="err-day-chips">${chips || '<span style="color:var(--accent);font-size:0.82rem">¡Sin días con errores!</span>'}</div>`
      }

      // ── Errores por tipo y nombre (tarjeta por tipo, nombres anidados) ──
      const tipoEntries = Object.entries(tipoCount).sort((a, b) => b[1] - a[1])
      const tipoHtml = tipoEntries.length > 0
        ? tipoEntries.map(([tipo, count]) => {
            const meta = TIPO_META[tipo] || TIPO_META.sintipo
            const cMap = {}
            casuisticas.filter(c => getTipo(c) === tipo).forEach(c => { cMap[c.casuistica] = (cMap[c.casuistica] || 0) + 1 })
            const names = Object.entries(cMap).map(([label, n]) => ({ label, n })).sort((a, b) => b.n - a.n)
            const maxName = names[0]?.n || 1
            const rows = names.map(({ label, n }) => `
              <div class="err-name-row" data-nombre="${encodeURIComponent(label)}" data-tipo="${tipo}">
                <span class="err-name-lbl">${label}</span>
                <div class="err-name-track"><div style="width:${Math.round(n / maxName * 100)}%;height:100%;background:${meta.color}"></div></div>
                <span class="err-name-count">${n}</span>
              </div>`).join('')
            return `
              <div class="err-type-card">
                <div class="err-type-head">
                  <span class="err-type-dot" style="background:${meta.color}"></span>
                  <span class="err-type-lbl" style="color:${meta.text}">${meta.label}</span>
                  <span class="err-type-count">${count}</span>
                </div>
                ${rows}
              </div>`
          }).join('')
        : '<p style="color:var(--text3);font-size:0.85rem">Sin errores en el período</p>'

      // ── Errores por fase del proceso (timeline) ──
      const faseCount = { 1: 0, 2: 0, 3: 0, sin: 0 }
      casuisticas.forEach(c => { const f = c.fase; (f === 1 || f === 2 || f === 3) ? faseCount[f]++ : faseCount.sin++ })
      const faseShort = { 1: 'Pre-sesión', 2: 'Lectura', 3: 'Ejecución' }
      const node = f => {
        const col = FASES[f].color
        return `<div class="err-fase-node">
            <div class="err-fase-circle" style="border:1px solid ${col};color:${col}">${faseCount[f]}</div>
            <div class="err-fase-name">${faseShort[f]}</div><div class="err-fase-sub">Fase ${f}</div>
          </div>`
      }
      const faseHtml = `
        <p class="disc-section-title">Errores por fase del proceso</p>
        <div class="err-fase-timeline">${node(1)}<div class="err-fase-conn"></div>${node(2)}<div class="err-fase-conn"></div>${node(3)}</div>
        ${faseCount.sin > 0 ? `<p style="color:var(--text3);font-size:0.76rem;margin:-14px 0 22px">+ ${faseCount.sin} sin fase asignada</p>` : ''}`

      // ── Impulsividad vs análisis ──
      const impulsiva = casuisticas.filter(c => c.regla_vista === true).length
      const analitica = casuisticas.filter(c => c.regla_vista === false).length
      const behavHtml = (impulsiva + analitica) > 0 ? `
        <p class="disc-section-title">Reglas: impulsividad vs análisis</p>
        <div class="err-behav-grid">
          <div class="err-behav-card" style="border-color:rgba(226,75,74,0.3)">
            <div class="err-behav-top"><i class="ti ti-bolt" style="color:var(--red)"></i> Impulsividad</div>
            <div class="err-behav-num">${impulsiva}</div>
            <div class="err-behav-sub">Vio la regla y la violó · disciplina</div>
          </div>
          <div class="err-behav-card" style="border-color:rgba(91,148,201,0.3)">
            <div class="err-behav-top"><i class="ti ti-eye-off" style="color:#5b94c9"></i> Falla analítica</div>
            <div class="err-behav-num">${analitica}</div>
            <div class="err-behav-sub">No la vio a tiempo · habilidad</div>
          </div>
        </div>` : ''

      // ── Recurrentes ──
      const rec = extras.recurrentes || []
      const recHtml = rec.length ? `
        <div class="disc-recurrente">🔁 <b>Recurrente:</b> ${rec.map(r => `${r.nombre} (${r.semanas}/4 sem)`).join(' · ')}</div>` : ''

      // ── Impacto financiero (card destacada, al final) ──
      const imp = extras.impacto
      const badge = (lbl, val, pos) => `
        <div class="err-impact-badge" style="background:${pos ? 'rgba(29,158,117,0.10)' : 'rgba(226,75,74,0.10)'};border:1px solid ${pos ? 'rgba(29,158,117,0.25)' : 'rgba(226,75,74,0.25)'}">
          <div class="lbl">${lbl}</div>
          <div class="val" style="color:${pos ? '#5dcaa5' : '#f09595'}">${val}</div>
        </div>`
      const impactoHtml = imp && (imp.diasError > 0 || imp.diasLimpios > 0) ? `
        <div class="err-impact">
          <div class="err-impact-head">
            <i class="ti ti-currency-dollar" style="color:var(--red);font-size:1.1rem"></i>
            <span style="font-size:0.82rem;color:var(--text2)">Tus errores te costaron en stops</span>
            <span class="err-impact-num">${imp.costoErrores > 0 ? '−$' + imp.costoErrores.toFixed(0) : '—'}</span>
          </div>
          <div class="err-impact-grid">
            ${badge('P&L medio · día limpio',    imp.avgPnlLimpio != null ? fmt$(imp.avgPnlLimpio) : '—', (imp.avgPnlLimpio ?? 0) >= 0)}
            ${badge('P&L medio · día con error', imp.avgPnlConErr != null ? fmt$(imp.avgPnlConErr) : '—', (imp.avgPnlConErr ?? 0) >= 0)}
          </div>
        </div>` : ''

      contentEl.innerHTML = `
        <div style="padding:16px 20px 20px">
          ${cleanHtml}
          <p class="disc-section-title" style="margin-top:18px">Errores por tipo y nombre (${total} registros) <span class="disc-hint">· toca un error para ver sus fechas</span></p>
          ${tipoHtml}
          ${faseHtml}
          ${behavHtml}
          ${recHtml}
          ${impactoHtml}
        </div>`
    }

    // ── Vista de un error: fechas (clickable → imagen del día) ────────────
    function renderPorNombre(nombre, tipo) {
      setModalTitle('ti-alert-triangle', nombre)
      let items = casuisticas.filter(c => c.casuistica === nombre)
      if (tipo) items = items.filter(c => getTipo(c) === tipo)
      const dates = items
        .map(c => ({ date: c.sesion_date, resultado: c.resultado }))
        .sort((a, b) => a.date.localeCompare(b.date))

      const backTarget = 'root'
      const daysHtml = dates.map(d => {
        const dow = DAYS[new Date(d.date + 'T12:00:00').getDay()]
        const pnl = pnlByDate[d.date]
        const pnlHtml = pnl != null
          ? `<span class="disc-date-pnl ${pnl > 0 ? 'pos' : pnl < 0 ? 'neg' : 'neutral'}" style="font-size:0.78rem;margin-left:auto">${fmt$(pnl)}</span>` : ''
        const res = (d.resultado === 'T' || d.resultado === 'S')
          ? `<span class="disc-fail-count" style="${pnl != null ? 'margin-left:8px' : ''}"><b class="${d.resultado === 'T' ? 'res-t' : 'res-s'}">${d.resultado}</b></span>` : ''
        return `
          <div class="disc-fail-day" data-date="${d.date}">
            <div class="disc-fail-day-header">
              <span class="disc-date-dow">${dow}</span>
              <span class="disc-date-val">${d.date}</span>
              ${pnlHtml}
              ${res}
              <i class="ti ti-photo disc-chevron" style="margin-left:${(res || pnlHtml) ? '6px' : 'auto'}"></i>
            </div>
          </div>`
      }).join('')

      contentEl.innerHTML = `
        <div style="padding:16px 20px 20px">
          <button class="disc-back" data-back="${backTarget}"><i class="ti ti-arrow-left"></i> Volver</button>
          <p class="disc-section-title" style="margin-top:10px">${nombre} — ${dates.length} ${dates.length === 1 ? 'día' : 'días'}</p>
          <p class="disc-hint" style="display:block;margin-bottom:6px">Toca una fecha para ver la imagen del día</p>
          ${daysHtml}
        </div>`
    }

    // Navegación interna (los clics en fechas los maneja el listener global)
    contentEl.onclick = e => {
      const backBtn = e.target.closest('.disc-back')
      if (backBtn) { renderRoot(); return }
      if (e.target.closest('.disc-fail-day')) return  // → listener global (imagen)
      const nombreEl = e.target.closest('[data-nombre]')
      if (nombreEl) {
        renderPorNombre(decodeURIComponent(nombreEl.dataset.nombre), nombreEl.dataset.tipo || null)
        return
      }
    }

    renderRoot()
    document.getElementById('disciplineModal').classList.remove('hidden')
  }

  // Modal "Dejé de ganar"
  function openDejeGanarModal(s) {
    setModalTitle('ti-mood-sad', 'Dejé de ganar')
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
  function openExperimentosModal(stats, minMuestras, baseWinRate = null) {
    setModalTitle('ti-flask', 'Experimentos')
    if (!stats.length) {
      document.getElementById('disciplineModalContent').innerHTML =
        '<p style="padding:20px;color:var(--text3)">Sin registros de experimentos aún. Márcalos en el formulario de sesión.</p>'
      document.getElementById('disciplineModal').classList.remove('hidden')
      return
    }
    const base = baseWinRate != null ? Math.round(baseWinRate) : null
    const bloques = stats.map(e => {
      const barW = e.conRes > 0 ? (e.targets / e.conRes * 100).toFixed(0) : 0
      const pendientes = Math.max(0, minMuestras - e.conRes)
      const progW = Math.min(100, (e.conRes / minMuestras * 100)).toFixed(0)

      // Comparación vs tasa de acierto base del período
      let baseHtml = ''
      if (e.pctT != null && base != null) {
        const delta = e.pctT - base
        const col = delta > 0 ? 'var(--accent)' : delta < 0 ? 'var(--red)' : 'var(--text3)'
        baseHtml = `<p style="font-size:0.78rem;color:var(--text2);margin:2px 0 4px">
          ${e.pctT}% target con el experimento vs <b>${base}%</b> tasa base
          <span style="color:${col};font-weight:600">(${delta > 0 ? '+' : ''}${delta} pts)</span>
        </p>`
      }

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
            <span style="font-size:0.78rem;color:var(--text3)">${e.total} registros · ${e.conRes} con resultado${e.pnlPropio != null ? ` · <b style="color:${e.pnlPropio >= 0 ? 'var(--accent)' : 'var(--red)'}">${e.pnlPropio >= 0 ? '+' : '−'}$${Math.abs(e.pnlPropio).toFixed(0)}</b>` : ''}</span>
          </div>
          ${e.conRes > 0 ? `
            <div class="disc-item" style="margin-bottom:4px">
              <span class="disc-item-label">% Target</span>
              <div class="disc-bar-wrap">
                <div class="disc-bar-fill" style="width:${barW}%;background:rgba(29,158,117,0.5)"></div>
              </div>
              <span class="disc-count" style="color:var(--accent)">${e.targets}T · ${e.stops}S</span>
            </div>` : ''}
          ${baseHtml}
          ${pendientes > 0 ? `
            <div class="disc-item" style="margin-bottom:4px">
              <span class="disc-item-label">Progreso a ${minMuestras} casos</span>
              <div class="disc-bar-wrap">
                <div class="disc-bar-fill" style="width:${progW}%;background:rgba(124,108,243,0.55)"></div>
              </div>
              <span class="disc-count">${e.conRes}/${minMuestras}</span>
            </div>
            <p style="color:var(--text3);font-size:0.78rem;margin:4px 0">Faltan ${pendientes} casos con resultado para emitir sugerencia</p>`
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

  const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

  function render(period = 'all') {
    const heroEl = document.getElementById('calHeroTitle')
    if (heroEl) heroEl.textContent = `Estadísticas — ${MESES[calMonth() - 1]} ${calYear()}`

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

    // ── Disciplina de Proceso: % de ítems de checklist cumplidos ──
    // Fase 1 (Pre-sesión) cuenta en días conectados (operados o no); Fases 2/3
    // solo en días operados. Así un "sin entradas" conectado suma su Fase 1.
    const disc = calcDisciplina(activeSesiones)
    const chkItemsTotal = disc.total
    const chkItemsOk    = disc.ok
    const disciplinaProceso = disc.pct

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

    // ── Dejé de ganar (setups que NO tomaste: solo días no operados) ──────
    // Restringido a días con no_opero o setup_valido_no_tomado; en días operados
    // el T/S de un error mezcla conceptos (sí entraste), así que no cuentan aquí.
    const noOperoDates = new Set(
      activeSesiones.filter(s => s.no_opero || s.setup_valido_no_tomado).map(s => s.sesion_date)
    )
    const dgCas    = periodCasuisticas.filter(c => noOperoDates.has(c.sesion_date))
    const perdidas = dgCas.filter(c => c.resultado === 'T')
    const ganadas  = dgCas.filter(c => c.resultado === 'S')
    const dejeGanarStat = {
      total: perdidas.length + ganadas.length,
      targets: perdidas.length,
      stops: ganadas.length,
      items: dgCas
        .filter(c => c.resultado === 'T' || c.resultado === 'S')
        .sort((a, b) => b.sesion_date.localeCompare(a.sesion_date)),
    }

    // ── Impacto $ de errores: P&L medio día limpio vs con error + costo en stops ──
    const pnlDia = d => (tradesByDate[d] || []).reduce((s, t) => s + (parseFloat(t.profit) || 0), 0)
    const diasOpConError = Object.keys(tradesByDate).filter(d => fechasConError.has(d))
    const diasOpLimpios  = Object.keys(tradesByDate).filter(d => !fechasConError.has(d))
    const avgDe = arr => arr.length ? arr.reduce((s, d) => s + pnlDia(d), 0) / arr.length : null
    const fechasErrorS = new Set(periodCasuisticas.filter(c => c.resultado === 'S').map(c => c.sesion_date))
    const costoErrores = trades
      .filter(t => t.resultado === 'stop' && fechasErrorS.has(t.trade_date))
      .reduce((s, t) => s + Math.abs(parseFloat(t.profit) || 0), 0)
    const impactoErrores = {
      avgPnlLimpio: avgDe(diasOpLimpios),
      avgPnlConErr: avgDe(diasOpConError),
      costoErrores,
      diasLimpios: diasOpLimpios.length,
      diasError: diasOpConError.length,
    }

    // ── Errores recurrentes: presentes en ≥3 de las últimas 4 semanas (global) ──
    const _hoy = new Date()
    const _wkByName = {}
    allCasuisticas.forEach(c => {
      const diff = Math.floor((_hoy - new Date(c.sesion_date + 'T12:00:00')) / 86400000)
      if (diff < 0 || diff >= 28) return
      const wk = Math.floor(diff / 7)
      if (!_wkByName[c.casuistica]) _wkByName[c.casuistica] = new Set()
      _wkByName[c.casuistica].add(wk)
    })
    const erroresRecurrentes = Object.entries(_wkByName)
      .filter(([, wks]) => wks.size >= 3)
      .map(([nombre, wks]) => ({ nombre, semanas: wks.size }))
      .sort((a, b) => b.semanas - a.semanas)

    // ── Tendencias vs período anterior (disciplina, errores, días limpios) ──
    const prevRange = getPrevRange(period)
    let trendDisc = '', trendErr = '', trendLimpios = ''
    if (prevRange) {
      const pSes  = allSesiones.filter(s => s.sesion_date >= prevRange.from && s.sesion_date <= prevRange.to)
      const pCas  = allCasuisticas.filter(c => c.sesion_date >= prevRange.from && c.sesion_date <= prevRange.to)
      const pDiscStat = calcDisciplina(pSes)
      const pDisc     = pDiscStat.total > 0 ? pDiscStat.pct : null
      const pDiasErr  = new Set(pCas.map(c => c.sesion_date)).size
      const pTasa     = pSes.length > 0 ? Math.round(pDiasErr / pSes.length * 100) : null
      const pLimpios  = pSes.length > 0 ? Math.round((pSes.length - pDiasErr) / pSes.length * 100) : null
      if (chkItemsTotal > 0) trendDisc    = trendChip(disciplinaProceso, pDisc, true, prevRange.label)
      if (totalDiasReg > 0)  trendErr     = trendChip(tasaErrorPct, pTasa, false, prevRange.label)
      if (totalDiasReg > 0)  trendLimpios = trendChip(diasLimpiosStat.pct, pLimpios, true, prevRange.label)
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
      // P&L propio del experimento (valores registrados, no P&L del día)
      const conValor  = regs.filter(r => r.valor != null)
      const pnlPropio = conValor.length ? conValor.reduce((s, r) => s + parseFloat(r.valor), 0) : null
      return { id: exp.id, nombre: exp.nombre, total, targets, stops, conRes, pctT, pnlPropio, regs }
    }).filter(e => e.total > 0)
    const MIN_MUESTRAS = 20
    const expConSugerencia = expStats.filter(e => e.conRes >= MIN_MUESTRAS)

    const cards = [
      { label: 'P&L Neto', value: `${netPnl >= 0 ? '+' : ''}$${netPnl.toFixed(0)}`, icon: 'ti-currency-dollar', color: netPnl >= 0 ? 'green' : 'red', sub: `Promedio: ${avgPnl >= 0 ? '+' : ''}$${avgPnl.toFixed(0)}/día` },
      { label: 'Acierto', value: `${winRate}%`, icon: 'ti-target', color: parseFloat(winRate) >= 50 ? 'green' : 'red', sub: `${targets} targets / ${stops} stops` },
      { label: 'Disciplina', value: `${disciplinaProceso}%`, icon: 'ti-checkup-list', color: disciplinaProceso >= 80 ? 'green' : disciplinaProceso >= 50 ? 'warning' : 'red', sub: chkItemsTotal > 0 ? `${chkItemsOk}/${chkItemsTotal} ítems de checklist${trendDisc}` : 'Sin días operados', clickable: true, action: 'disc-detail' },
      { label: 'Errores', value: `${tasaErrorPct}%`, icon: 'ti-alert-triangle', color: tasaErrorPct <= 20 ? 'green' : tasaErrorPct <= 50 ? 'warning' : 'red', sub: totalDiasReg > 0 ? `${periodCasuisticas.length} errores · ${diasConError}/${totalDiasReg} días${costoErrores > 0 ? ` · ≈ <span style="color:var(--red)">-$${costoErrores.toFixed(0)}</span>` : ''}${trendErr}` : 'Sin sesiones', clickable: true, action: 'disc-errors' },
      { label: 'Dejé de ganar', value: dejeGanarStat.targets > 0 ? `${dejeGanarStat.targets} ⚠️` : '0 ✅', icon: 'ti-mood-sad', color: dejeGanarStat.targets === 0 ? 'green' : dejeGanarStat.targets <= 2 ? 'warning' : 'red', sub: dejeGanarStat.total > 0 ? `${dejeGanarStat.targets}T · ${dejeGanarStat.stops}S dejados pasar` : 'Sin setups perdidos', clickable: dejeGanarStat.total > 0, action: 'deje-ganar' },
      {
        label: 'T · S · Sin',
        value: `<span style="color:var(--accent)">${targets}</span> · <span style="color:var(--red)">${stops}</span> · ${noOperoCount}`,
        icon: 'ti-chart-bar',
        color: 'neutral',
        sub: `Ratio T/S: ${stops > 0 ? (targets / stops).toFixed(2) : targets > 0 ? '∞' : '—'}`,
      },
    ]

    document.getElementById('metricsGrid').innerHTML = cards.map(c => `
      <div class="metric-card${c.clickable ? ' clickable' : ''}" ${c.action ? `data-action="${c.action}"` : ''}>
        <div class="metric-top">
          <span class="metric-dot color-${c.color}"></span>
          <span class="metric-label">${c.label}</span>
          ${c.clickable ? '<i class="ti ti-chevron-right metric-ch"></i>' : ''}
        </div>
        <div class="metric-value color-${c.color}">${c.value}</div>
      </div>`).join('')

    document.querySelector('[data-action="disc-detail"]')?.addEventListener('click', () => {
      openDisciplineDetailModal(activeSesiones)
    })
    document.querySelector('[data-action="disc-errors"]')?.addEventListener('click', () => {
      openDisciplineModal(periodCasuisticas, trades, tipoMap, tipoCount, origenCount,
        { impacto: impactoErrores, recurrentes: erroresRecurrentes, diasLimpios: diasLimpiosStat })
    })
    document.querySelector('[data-action="deje-ganar"]')?.addEventListener('click', () => {
      openDejeGanarModal(dejeGanarStat)
    })
    document.querySelector('[data-action="experimentos"]')?.addEventListener('click', () => {
      openExperimentosModal(expStats, MIN_MUESTRAS, nonBETrades.length > 0 ? parseFloat(winRate) : null)
    })

    renderCalEquity(trades)
  }

  // Curva de equity del mes seleccionado (sección Calendario)
  let calEquityInst = null
  function renderCalEquity(trades) {
    const ctx = document.getElementById('calEquityChart')
    if (!ctx || typeof Chart === 'undefined') return
    if (calEquityInst) { calEquityInst.destroy(); calEquityInst = null }
    const byDate = {}
    trades.forEach(t => { if (t.trade_date) byDate[t.trade_date] = (byDate[t.trade_date] || 0) + (parseFloat(t.profit) || 0) })
    const dates = Object.keys(byDate).sort()
    let cum = 0
    const data = dates.map(d => { cum += byDate[d]; return parseFloat(cum.toFixed(2)) })
    const UP = '#1D9E75', DOWN = '#E24B4A'
    // Glow sutil bajo la línea (estética premium)
    const eqGlow = {
      id: 'eqGlow',
      beforeDatasetsDraw(ch) { ch.ctx.save(); ch.ctx.shadowColor = 'rgba(29,158,117,0.45)'; ch.ctx.shadowBlur = 10 },
      afterDatasetsDraw(ch) { ch.ctx.restore() },
    }
    calEquityInst = new Chart(ctx, {
      type: 'line',
      plugins: [eqGlow],
      data: { labels: dates.map(d => d.slice(5)), datasets: [{
        label: 'P&L Acumulado', data,
        borderColor: UP,
        // Verde por encima de 0, rojo por debajo: relleno partido en y=0 y
        // segmentos de línea coloreados según el signo del tramo.
        fill: { target: { value: 0 }, above: 'rgba(29,158,117,0.18)', below: 'rgba(226,75,74,0.18)' },
        segment: { borderColor: c => (c.p0.parsed.y < 0 || c.p1.parsed.y < 0) ? DOWN : UP },
        borderWidth: 3, pointRadius: dates.length > 25 ? 2 : 4, pointHoverRadius: 7,
        pointBackgroundColor: data.map(v => v < 0 ? DOWN : UP),
        pointBorderColor: data.map(v => v < 0 ? DOWN : UP),
        tension: 0.3,
      }]},
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false },
          tooltip: { backgroundColor:'#2a2a28', titleColor:'#F4F3EF', bodyColor:'#9B9B8E',
            callbacks: { label: c => ` P&L acumulado: ${c.raw>=0?'+':''}$${c.raw}` } } },
        scales: {
          x: {
            ticks: { color:'#7d7d74', maxRotation:0, autoSkip:true, maxTicksLimit:8, font:{ size:11 } },
            grid: { display:false }, border: { display:false },
          },
          y: {
            ticks: { color:'#7d7d74', callback:v=>`$${v}`, font:{ size:11 } },
            grid: { color:'rgba(255,255,255,0.05)' }, border: { display:false },
          },
        },
      },
    })
  }

  async function init() {
    let checklistItems
    ;[allTrades, allSesiones, allCasuisticas, allCatalogo, allObjetivos, allExpCatalogo, allExpRegistros, checklistItems] = await Promise.all([
      DB.getTrades(), DB.getSesiones(), DB.getAllCasuisticas(), DB.getCatalogoCasuisticas(), DB.getObjetivos(), DB.getCatalogoExperimentos(), DB.getAllExperimentoRegistros(),
      DB.getChecklistItems({ soloActivos: true }).catch(() => null)
    ])
    buildDiscFactors(checklistItems)
    render('month')

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

    // Clics dentro del modal de Disciplina:
    //  - día → abre el detalle del día
    //  - ítem con incumplimientos → despliega/oculta sus días
    document.getElementById('disciplineModalContent').addEventListener('click', async e => {
      const dayEl = e.target.closest('.disc-fail-day[data-date]')
      if (dayEl) {
        const date = dayEl.dataset.date
        document.getElementById('disciplineModal').classList.add('hidden')
        const [trades, sesion] = await Promise.all([
          DB.getTradesByDate(date),
          DB.getSesionByDate(date),
        ])
        await Modal.openDay(date, trades, sesion)
        return
      }
      const row = e.target.closest('.disc-factor-row[data-key]')
      if (row) {
        const panel = document.querySelector(`.disc-factor-days[data-for="${row.dataset.key}"]`)
        if (panel) { panel.classList.toggle('hidden'); row.classList.toggle('open') }
      }
    })
  }

  function rerender() {
    render('month')
  }

  function setObjetivos(obj) {
    allObjetivos = obj
    rerender()
  }

  return { init, reload: init, rerender, setObjetivos }
})()
