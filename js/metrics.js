// Metrics / KPI calculations and rendering
const Metrics = (() => {
  let allTrades = []
  let allSesiones = []
  let allCasuisticas = []
  let allCatalogo = []
  let allObjetivos     = null
  let allExpCatalogo   = []
  let allExpRegistros  = []
  // Fechas especiales por tipo: { festivo: Set(fechas), fomc: Set(fechas), … }
  // Las usa el desglose de días para separar festivos y FOMC de los "no conectados".
  let fechasEspByDate  = {}

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

  // Rango [from, to] del período — mismo criterio que filterByPeriod, extraído para
  // poder recorrer el calendario día a día en el desglose.
  function periodBounds(period) {
    if (period === 'month') {
      const y = calYear(), m = calMonth()
      const lastDay = new Date(y, m, 0).getDate()
      return {
        from: `${y}-${String(m).padStart(2, '0')}-01`,
        to:   `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`,
      }
    }
    if (period === 'week') {
      const d = new Date(); d.setDate(d.getDate() - d.getDay() + 1)
      return { from: d.toISOString().slice(0, 10), to: '9999-12-31' }
    }
    return { from: '0000-01-01', to: '9999-12-31' }
  }

  // Fechas ISO de los días hábiles (Lun–Vie) entre dos fechas, ambas incluidas.
  function diasHabilesEntre(from, to) {
    const out = []
    if (!from || !to || from > to) return out
    const d = new Date(`${from}T12:00:00`), end = new Date(`${to}T12:00:00`)
    while (d <= end) {
      const dow = d.getDay()
      if (dow >= 1 && dow <= 5) {
        out.push(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`)
      }
      d.setDate(d.getDate() + 1)
    }
    return out
  }

  // Filtra al período pedido. Sábados y domingos quedan SIEMPRE fuera: el mercado no
  // se opera en fin de semana y pueden colarse filas creadas por el AddOn de NT8.
  function filterByPeriod(trades, sesiones, period) {
    trades   = (trades   || []).filter(t => esDiaHabil(t.trade_date))
    sesiones = (sesiones || []).filter(s => esDiaHabil(s.sesion_date))
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
      .map(i => ({ key: i.clave, label: i.texto, fase: i.fase || 1, setup: i.setup || null }))
  }

  // Claves activas del checklist (para conteos de disciplina)
  function clavesActivas() {
    return DISC_FACTORS.length ? DISC_FACTORS.map(f => f.key) : DB.checklistClaves()
  }

  // ¿La sesión se "conectó" ese día? (operó, o no operó pero sí se conectó a analizar)
  function seConecto(s) { return !s.no_opero || s.se_conecto !== false }

  // Disciplina de un conjunto de sesiones: { total, ok, pct } sobre factores aplicables.
  // Delegado al cálculo canónico global (db.js) para que el número coincida en
  // calendario, análisis y dashboard.
  function calcDisciplina(sesiones, opts) {
    const r = calcDisciplinaStats(sesiones, null, opts)
    return { total: r.total, ok: r.ok, pct: r.pct ?? 0 }
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

  const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

  function render(period = 'all') {
    const heroEl = document.getElementById('calHeroTitle')
    if (heroEl) heroEl.textContent = `Estadísticas — ${MESES[calMonth() - 1]} ${calYear()}`

    // Comparte la selección de cuentas del Calendario (mismo filtro)
    const accountFiltered = AccountFilter.filter('calendar', allTrades)
    const { trades, sesiones } = filterByPeriod(accountFiltered, allSesiones, period)

    const totalTrades = trades.length
    const isBreakEven = t => Math.abs(parseFloat(t.profit) || 0) <= 6
    const nonBETrades = trades.filter(t => !isBreakEven(t))
    const targets = nonBETrades.filter(isWinTrade).length
    const stops   = nonBETrades.filter(isLossTrade).length
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
    // Sesiones que cuentan para estadísticas: solo los días en que el trader se
    // conectó (operó, o no operó pero sí se conectó a analizar). Un día sin conexión
    // no entra en disciplina, tasa de errores, días limpios ni "dejé de ganar".
    const activeSesiones = sesiones.filter(seConecto)

    // ── Desglose de días del período ─────────────────────────────────────────
    // Universo: TODOS los días hábiles del período (hasta hoy; los futuros no
    // cuentan). Se parte en dos ramas que suman el total, sin solapamiento:
    //
    //   Días de trabajo (= conectados)      Días sin operar
    //     ├─ Targets                          ├─ Festivos
    //     ├─ Stops                            ├─ FOMC   (solo si NO se operó)
    //     └─ Sin resultado                    ├─ No conectados
    //        (no entré, o cerró en B.E.)      └─ Sin registro
    //
    // Un día FOMC en el que SÍ se operó es un día de trabajo, no un "FOMC".
    // Prioridad en la rama derecha: festivo > FOMC > no conectado > sin registro.
    const sesionesByDate = {}
    sesiones.forEach(s => { sesionesByDate[s.sesion_date] = s })
    const conectadasSet = new Set(activeSesiones.map(s => s.sesion_date))

    const desglose = {
      trabajo: 0, targets: 0, stops: 0, sinResultado: 0,
      sinOperar: 0, festivos: 0, fomc: 0, noConectados: 0, sinRegistro: 0,
      totalHabiles: 0,
    }
    const hoyISO = new Date().toISOString().slice(0, 10)
    const { from, to } = periodBounds(period)
    for (const fecha of diasHabilesEntre(from, to > hoyISO ? hoyISO : to)) {
      desglose.totalHabiles++
      if (conectadasSet.has(fecha)) {
        // ── Día de trabajo: se conectó (haya operado o no) ──
        desglose.trabajo++
        const nonBE = (tradesByDate[fecha] || []).filter(t => !isBreakEven(t))
        const tg = nonBE.filter(isWinTrade).length
        const sl = nonBE.filter(isLossTrade).length
        const net = nonBE.reduce((a, t) => a + (parseFloat(t.profit) || 0), 0)
        if      (tg > 0 && sl === 0) desglose.targets++
        else if (sl > 0 && tg === 0) desglose.stops++
        else if (net > 6)            desglose.targets++
        else if (net < -6)           desglose.stops++
        else                         desglose.sinResultado++  // no entré, o B.E.
      } else {
        // ── Día sin operar ──
        desglose.sinOperar++
        if      (fechasEspByDate.festivo?.has(fecha)) desglose.festivos++
        else if (fechasEspByDate.fomc?.has(fecha))    desglose.fomc++
        else if (sesionesByDate[fecha])               desglose.noConectados++
        else                                          desglose.sinRegistro++
      }
    }
    const diasActividadTotal = desglose.trabajo

    // Casuísticas filtradas por el mismo período
    const periodCasuisticas = filterCasuisticasByPeriod(allCasuisticas, period)

    // ── Disciplina de Proceso: % de ítems de checklist cumplidos ──
    // Fase 1 (Pre-sesión) cuenta en días conectados (operados o no); Fases 2/3 solo
    // si hubo operativa real ese día (trades o setup declarado). Así un día en que
    // se hizo la pre-sesión y no se llegó a operar suma su Fase 1 y nada más.
    // OJO: `allTrades` (sin el filtro de cuenta) — la disciplina es del proceso del
    // trader, no de una cuenta. Con los trades filtrados, un día operado en otra
    // cuenta parecería "no operado" y sus Fases 2/3 desaparecerían del cálculo.
    // `rotas`: un error que contradice una regla la cuenta como incumplida aunque
    // la casilla del checklist esté marcada.
    const disc = calcDisciplina(activeSesiones, {
      conTrades: fechasConTrades(allTrades),
      rotas: reglasRotasPorDia(periodCasuisticas),
    })
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
        label: 'Días de trabajo',
        value: `${desglose.trabajo}`,
        icon: 'ti-calendar-check',
        color: 'neutral',
        sub: `Ratio T/S: ${desglose.stops > 0 ? (desglose.targets / desglose.stops).toFixed(2) : desglose.targets > 0 ? '∞' : '—'}`,
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

    // Disciplina y Errores ahora abren el Dashboard de Disciplina (sección propia)
    document.querySelector('[data-action="disc-detail"]')?.addEventListener('click', () => {
      if (typeof Nav !== 'undefined') Nav.go('disciplina')
    })
    document.querySelector('[data-action="disc-errors"]')?.addEventListener('click', () => {
      if (typeof Nav !== 'undefined') Nav.go('disciplina')
    })
    document.querySelector('[data-action="deje-ganar"]')?.addEventListener('click', () => {
      openDejeGanarModal(dejeGanarStat)
    })
    document.querySelector('[data-action="experimentos"]')?.addEventListener('click', () => {
      openExperimentosModal(expStats, MIN_MUESTRAS, nonBETrades.length > 0 ? parseFloat(winRate) : null)
    })

    renderCalEquity(trades)
    renderDesgloseDias(desglose)
  }

  // ── Desglose de días (bloque bajo la curva de equity) ──────────────────────
  // Dos ramas que suman el total de días hábiles del período: los de trabajo
  // (conectado, haya operado o no) y los que no se operó.
  function renderDesgloseDias(d) {
    const cont = document.getElementById('diasDesglose')
    if (!cont) return
    const per = document.getElementById('ddPeriodo')
    if (per) per.textContent = `${MESES[calMonth() - 1]} ${calYear()} · ${d.totalHabiles} día${d.totalHabiles !== 1 ? 's' : ''} hábiles`

    // fila: [icono, etiqueta, valor, clase de color, tooltip]
    const fila = (icon, label, val, cls, hint) => {
      const pct = d.totalHabiles > 0 ? (val / d.totalHabiles * 100) : 0
      return `
        <div class="dd-row${val === 0 ? ' is-zero' : ''}"${hint ? ` title="${hint}"` : ''}>
          <span class="dd-dot ${cls}"><i class="ti ${icon}"></i></span>
          <span class="dd-label">${label}</span>
          <span class="dd-bar"><span class="dd-bar-fill ${cls}" style="width:${pct.toFixed(1)}%"></span></span>
          <span class="dd-val">${val}</span>
        </div>`
    }

    const pctTrabajo = d.totalHabiles > 0 ? Math.round(d.trabajo / d.totalHabiles * 100) : 0
    const pctSin     = d.totalHabiles > 0 ? Math.round(d.sinOperar / d.totalHabiles * 100) : 0

    cont.innerHTML = `
      <div class="dd-col">
        <div class="dd-head">
          <div class="dd-head-txt">
            <span class="dd-head-label">Días de trabajo</span>
            <span class="dd-head-sub">Te conectaste al mercado</span>
          </div>
          <div class="dd-head-num">
            <span class="dd-total accent">${d.trabajo}</span>
            <span class="dd-pct">${pctTrabajo}%</span>
          </div>
        </div>
        ${fila('ti-trending-up',   'Targets',       d.targets,      'c-target', 'Días que cerraron en positivo')}
        ${fila('ti-trending-down', 'Stops',         d.stops,        'c-stop',   'Días que cerraron en negativo')}
        ${fila('ti-minus',         'Sin resultado', d.sinResultado, 'c-flat',   'Te conectaste pero el día no acabó en target ni en stop: analizaste y no entraste, o cerró en break even')}
      </div>

      <div class="dd-col">
        <div class="dd-head">
          <div class="dd-head-txt">
            <span class="dd-head-label">Días sin operar</span>
            <span class="dd-head-sub">No hubo sesión de trading</span>
          </div>
          <div class="dd-head-num">
            <span class="dd-total muted">${d.sinOperar}</span>
            <span class="dd-pct">${pctSin}%</span>
          </div>
        </div>
        ${fila('ti-user-off',       'No conectados', d.noConectados, 'c-off',     'No abriste la plataforma ese día')}
        ${fila('ti-building-bank',  'Festivos',      d.festivos,     'c-holiday', 'Mercado cerrado')}
        ${fila('ti-chart-candle',   'FOMC',          d.fomc,         'c-fomc',    'Días FOMC en los que NO operaste (si operaste, cuenta como día de trabajo)')}
        ${d.sinRegistro > 0 ? fila('ti-help-circle', 'Sin registro', d.sinRegistro, 'c-none', 'Días hábiles sin sesión registrada y sin fecha especial') : ''}
      </div>`
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
    calEquityInst = new Chart(ctx, {
      type: 'line',
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
          x: { ticks:{ color:'#9B9B8E', maxRotation:45 }, grid:{ color:'rgba(255,255,255,0.06)' } },
          y: { ticks:{ color:'#9B9B8E', callback:v=>`$${v}` }, grid:{ color:'rgba(255,255,255,0.06)' } },
        },
      },
    })
  }

  async function init() {
    let checklistItems, fechasEsp
    ;[allTrades, allSesiones, allCasuisticas, allCatalogo, allObjetivos, allExpCatalogo, allExpRegistros, checklistItems, fechasEsp] = await Promise.all([
      DB.getTrades(), DB.getSesiones(), DB.getAllCasuisticas(), DB.getCatalogoCasuisticas(), DB.getObjetivos(), DB.getCatalogoExperimentos(), DB.getAllExperimentoRegistros(),
      DB.getChecklistItems({ soloActivos: true }).catch(() => null),
      DB.getFechasEspeciales().catch(() => []),
    ])
    buildDiscFactors(checklistItems)
    // Índice por tipo → Set de fechas (festivos y FOMC del desglose de días)
    fechasEspByDate = {}
    ;(fechasEsp || []).forEach(f => {
      if (!f.tipo || !f.fecha) return
      if (!fechasEspByDate[f.tipo]) fechasEspByDate[f.tipo] = new Set()
      fechasEspByDate[f.tipo].add(f.fecha)
    })
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

    // Clic en una fecha dentro de un modal de disciplina (p. ej. "Dejé de ganar")
    // → abre el detalle del día.
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
    render('month')
  }

  function setObjetivos(obj) {
    allObjetivos = obj
    rerender()
  }

  return { init, reload: init, rerender, setObjetivos }
})()
