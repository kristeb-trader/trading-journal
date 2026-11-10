// Dashboard de Disciplina — registro de proceso (checklist por fase, racha,
// errores por tipo y registro de sesiones). Lee de Supabase (sesiones, checklist
// del rulebook, diagnostico_errores, trades). Estilo coherente con la app.
const Disciplina = (() => {
  let trades = [], sesiones = [], casuisticas = [], catalogo = [], setupsCat = []
  let fechasEsp = [], stopMax = 80   // contexto de disciplina (regla FOMC, stop máx)
  let motor                          // la medida del plan (desde el 01/10); undefined = no cargó
  let discusiones = []               // «no estoy de acuerdo» (D-052)
  let DISC_FACTORS = []
  let period = 'month'
  let loaded = false, wired = false

  const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
  const DOW = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']
  const esc = s => (s || '').replace(/[&<>"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]))
  const isBE = p => Math.abs(parseFloat(p) || 0) <= 6

  const FASES = {
    1: { label: 'Fase 1 — Pre-sesión',        when: 'antes de que exista cualquier setup', color: '#3FE0A6' },
    2: { label: 'Fase 2 — Lectura del setup', when: 'análisis antes de entrar',            color: '#E0A33B' },
    3: { label: 'Fase 3 — Ejecución',         when: 'el momento de apretar el botón',      color: '#6FA8DC' },
  }
  const TIPO = {
    psicologico: { label: 'Psicológico', cls: 'psych',    emoji: '🧠' },
    analitico:   { label: 'Analítico',   cls: 'analytic', emoji: '📐' },
    operativo:   { label: 'Operativo',   cls: 'op',       emoji: '⚙️' },
    marcado:     { label: 'Marcado',     cls: 'mark',     emoji: '🎯' },
  }

  // ── Helpers de disciplina ─────────────────────────────────────────────────
  // El criterio vive en db.js (fuente única compartida con calendario y análisis).
  // `ctx` se reconstruye en cada compute() con los datos COMPLETOS (sin filtrar).
  const seConecto = s => !s.no_opero || s.se_conecto !== false
  let ctx = {}
  const factorAplica = (f, s) => discFactorAplica(f, s, ctx)
  // ¿La regla se cumplió de verdad? Si es automática la resuelve el dato; si es
  // declarada vale la casilla, salvo que un error la contradiga. `null` = no
  // evaluable (no cuenta ni a favor ni en contra).
  function cumple(s, key, f) {
    if (f && f.evidencia === 'auto') return reglaAutoResultado(key, s, ctx)
    return reglaCumplida(s, key, ctx.rotas)
  }
  // ¿El ítem tiene con qué evaluarse ese día?
  function evaluable(s, f) {
    if (f.evidencia === 'auto') return reglaAutoResultado(f.key, s, ctx) !== null
    return s[f.key] !== undefined
  }
  // Las reglas llegan YA filtradas por etapa (DB.checklistDeEtapa): activas o no,
  // cuentan todas las de la etapa. Ver docs/disenos/2026-09-24-etapa-plan-chaumer.md.
  function mapFactors(items) {
    return items.map(i => ({ key: i.clave, label: i.texto, enunciado: i.enunciado || '',
                   fase: i.fase || 1, setup: i.setup || null, bloqueaGo: i.bloquea_go !== false,
                   evidencia: i.evidencia || 'declarada', aplica_si: i.aplica_si || 'siempre' }))
  }
  function buildFactors(items) {
    const src = (items && items.length) ? items : DB.checklistClaves().map(c => ({ clave: c, texto: c, fase: 1 }))
    DISC_FACTORS = mapFactors(src)
  }
  // Las reglas de UN día: las de su etapa. La racha y el historial recorren días que
  // pueden ser de otra etapa que la elegida.
  let etapaActual = undefined
  const factoresCache = new Map()
  function factoresDe(s) {
    const e = etapaDeFecha(s.sesion_date)
    if (e === etapaActual) return DISC_FACTORS
    if (!factoresCache.has(e)) factoresCache.set(e, mapFactors(DB.checklistDeEtapa(e)))
    return factoresCache.get(e)
  }

  // ── Por qué falló una regla un día concreto ───────────────────────────────
  // Tres motivos distintos que el tablero mostraba idénticos: la casilla sin
  // marcar, la casilla marcada que un error del diagnóstico desmiente (regla de
  // oro nº 4) y la regla `auto` que resolvió el dato en contra.
  const MOTIVOS = {
    sin_marcar: { badge: '🔲 Sin marcar',       cls: 'plain' },
    roto:       { badge: '⚠️ Desmentida',       cls: 'broken' },
    auto:       { badge: '⚙ Verificado por dato', cls: 'auto' },
  }
  function evidenciaAuto(f, s) {
    const trs = (ctx.tradesPorDia && ctx.tradesPorDia.get(s.sesion_date)) || []
    const key = AUTO_ALIAS[f.key] || f.key
    if (key === 'p2_una_operacion') return `<b>${trs.length} operaciones</b> ese día. El plan permite una por sesión.`
    if (key === 'p2_instrumento') {
      const otros = [...new Set(trs.map(t => t.instrument).filter(i => !/^MNQ\b/i.test(String(i || ''))))]
      return `Operado en <b>${esc(otros.join(', ') || 'otro instrumento')}</b>. El plan opera solo MNQ.`
    }
    if (key === 'p2_un_contrato') {
      if (s.sesion_date < RIESGO_MAX_DESDE) {
        const q = [...new Set(trs.map(t => Number(t.qty)).filter(n => n !== 1))]
        return `Operado con <b>${q.join(', ')} contratos</b>. Hasta el 27/09 el plan operaba siempre 1.`
      }
      const peor = Math.max(...trs.filter(t => t.mae != null).map(t => Math.abs(parseFloat(t.mae) || 0)))
      return `El peor movimiento en contra fue de <b>${fmtDinero(peor, { masEnPositivo: false })}</b>, por encima del riesgo máximo de ${fmtDinero(RIESGO_MAX_USD, { masEnPositivo: false })}.`
    }
    if (key === 'p2_ventana_horaria') {
      const fuera = trs.map(t => horaEt(t.entry_time, s.sesion_date)).filter(h => h && (h < VENTANA_ET.desde || h >= VENTANA_ET.hasta))
      return `Entrada a las <b>${esc(fuera.join(', '))} ET</b>, fuera de la ventana ${VENTANA_ET.desde}–${VENTANA_ET.hasta} ET.`
    }
    if (key === 'stop_max_puntos') {
      const pts = trs.map(maeEnPuntos).filter(p => p != null)
      if (!pts.length) return 'Verificado por dato.'
      return `El peor movimiento en contra fue de <b>${Math.max(...pts).toFixed(1)} pts</b>, por encima del stop máximo de ${ctx.stopMaxPuntos} pts.`
    }
    if (key === 'chk_noticias') {
      const en = tradesEnVentanaNoticia(trs, s)
      if (!en.length) return 'Verificado por dato.'
      return `${en.length} entrada${en.length !== 1 ? 's' : ''} dentro de la ventana ±5 min de la noticia roja de las <b>${esc(String(s.hora_noticia_roja).slice(0,5))}</b>.`
    }
    if (key === 'fomc_solo_reingreso') {
      return `Día FOMC operado con <b>${esc(s.setup || 'setup sin declarar')}</b>. En día FOMC solo se permiten reingresos.`
    }
    return 'El dato del día resolvió la regla en contra.'
  }
  function motivoFallo(f, s, dCas) {
    if (f.evidencia === 'auto') return { tipo: 'auto', texto: evidenciaAuto(f, s), errores: [] }
    if (!s[f.key]) return { tipo: 'sin_marcar', texto: 'La casilla quedó sin marcar: incumplimiento declarado por ti.', errores: [] }
    return {
      tipo: 'roto',
      texto: 'Marcaste la casilla como cumplida, pero el diagnóstico del día registró un error que contradice esta regla.',
      errores: (dCas || []).filter(c => c.regla_codigo === f.key),
    }
  }

  // ── Período (Mes / Trimestre / Año / Todo) + navegación ───────────────────
  // Las flechas avanzan UNA unidad del período que se está mirando: en trimestre
  // saltaban de mes en mes y el rango cambiaba a medias.
  const PERIODOS = [
    { k: 'month',   label: 'Mes',       corto: 'Mes',  paso: 1 },
    { k: 'quarter', label: 'Trimestre', corto: 'Trim', paso: 3 },
    { k: 'year',    label: 'Año',       corto: 'Año',  paso: 12 },
    { k: 'all',     label: 'Todo',      corto: 'Todo', paso: 0 },
  ]
  const periodoInfo = () => PERIODOS.find(p => p.k === period) || PERIODOS[0]

  let navY = null, navM = null   // mes/año que muestra el dashboard
  function ensureNav() {
    if (navM != null) return
    navM = (typeof Calendar !== 'undefined' && Calendar.getMonth) ? Calendar.getMonth() : new Date().getMonth() + 1
    navY = (typeof Calendar !== 'undefined' && Calendar.getYear) ? Calendar.getYear() : new Date().getFullYear()
  }
  function navPeriodo(delta) {
    const paso = periodoInfo().paso
    if (!paso) return
    ensureNav()
    // Se navega en meses y se normaliza: 12 meses = 1 año, 3 = 1 trimestre.
    const idx = (navY * 12 + (navM - 1)) + delta * paso
    navY = Math.floor(idx / 12)
    navM = (idx % 12) + 1
    updateMonthNav(); refreshTitle(); render()
  }
  // La aritmética del rango vive en `rangoPeriodo` (db.js) desde el 19 ago: el
  // comparador de Chaumer usa la misma, y dos copias de la misma cuenta de
  // trimestres es como acaban significando cosas distintas en cada pantalla.
  function range() {
    ensureNav()
    return rangoPeriodo(period, navY, navM)
  }
  const inR = (d, r) => d >= r.from && d <= r.to

  // ── Cálculo ───────────────────────────────────────────────────────────────
  function compute() {
    const r = range()
    // Sábados y domingos quedan fuera de toda estadística (no se opera en fin de
    // semana; pueden existir filas creadas por el AddOn de NT8).
    const ses = sesiones.filter(s => s.sesion_date && inR(s.sesion_date, r) && esDiaHabil(s.sesion_date))
    // Etapa: la del selector o, en 'auto', la del día más reciente del período. La
    // disciplina y las fases cuentan SOLO los días de esa etapa, con sus reglas; los
    // errores y los días limpios cuentan días, no reglas, y no se filtran.
    etapaActual = etapaDelPeriodo(ses, DB.etapaVista())
    factoresCache.clear()
    buildFactors(DB.checklistDeEtapa(etapaActual))
    const enEtapa = s => etapaActual === undefined || etapaDeFecha(s.sesion_date) === etapaActual
    const cas = casuisticas.filter(c => c.sesion_date && inR(c.sesion_date, r) && esDiaHabil(c.sesion_date))
    const trd = trades.filter(t => t.trade_date && inR(t.trade_date, r) && esDiaHabil(t.trade_date))

    // Índices por día: se construyen con TODO el histórico (no con el rango ni con
    // el filtro de cuenta) — son "qué pasó ese día", no métricas del período.
    ctx = discContexto({ trades, errores: casuisticas, fechasEsp, stopMaxPuntos: stopMax, motor, discusiones })
    const conectadas = ses.filter(seConecto)
    // "Operadas" = con operativa real (trades o setup declarado). `no_opero=false` no
    // basta: es el default de la columna y una sesión creada al abrir NT8 nace así.
    const operadas   = ses.filter(s => sesionOpero(s, ctx.conTrades))

    // Trades y errores por fecha
    const trByDate = {}
    trd.forEach(t => { (trByDate[t.trade_date] = trByDate[t.trade_date] || []).push(t) })
    const casByDate = {}
    cas.forEach(c => { (casByDate[c.sesion_date] = casByDate[c.sesion_date] || []).push(c) })

    // Disciplina total — solo cuentan los ítems con valor registrado en la sesión
    // (un ítem sin registrar, p. ej. una regla nueva en días previos, es N/A).
    let dTotal = 0, dOk = 0
    ses.filter(enEtapa).forEach(s => DISC_FACTORS.forEach(f => {
      if (!factorAplica(f, s)) return
      if (!evaluable(s, f)) return
      dTotal++; if (cumple(s, f.key, f)) dOk++
    }))
    const disciplinaPct = dTotal > 0 ? Math.round(dOk / dTotal * 100) : null

    // Cumplimiento por fase (con ítems, días fallidos y cobertura de datos)
    const phases = [1, 2, 3].map(fase => {
      const facs = DISC_FACTORS.filter(f => f.fase === fase)
      const baseDias = (fase === 1 ? conectadas : operadas).filter(enEtapa)
      const factores = facs.map(f => {
        const aplicables = baseDias.filter(s => factorAplica(f, s))
        const registradas = aplicables.filter(s => evaluable(s, f))
        const fallidas = registradas.filter(s => !cumple(s, f.key, f))
          .sort((a, b) => b.sesion_date.localeCompare(a.sesion_date))
        // Cada fallo lleva su porqué, para poder abrirlo desde el tablero.
        const failsInfo = fallidas.map(s => ({
          date: s.sesion_date,
          ...motivoFallo(f, s, casByDate[s.sesion_date] || []),
        }))
        return {
          key: f.key, label: f.label, enunciado: f.enunciado, fase: f.fase, setup: f.setup,
          evidencia: f.evidencia, aplica_si: f.aplica_si, bloqueaGo: f.bloqueaGo,
          aplica: registradas.length, ok: registradas.length - fallidas.length,
          fails: fallidas.map(s => s.sesion_date), failsInfo,
          cobertura: registradas.length, aplicablesTotal: aplicables.length,
        }
      })
      const total = factores.reduce((a, fc) => a + fc.aplica, 0)
      const ok = factores.reduce((a, fc) => a + fc.ok, 0)
      return { fase, ...FASES[fase], pct: total > 0 ? Math.round(ok / total * 100) : null, factores, total }
    }).filter(p => p.factores.length > 0)

    // Fase más débil (con datos)
    const conPct = phases.filter(p => p.pct != null)
    const faseDebil = conPct.length ? conPct.reduce((a, b) => b.pct < a.pct ? b : a) : null

    // Racha: días operados consecutivos (desde el más reciente) con checklist
    // aplicable 100% completo.
    const opOrd = [...operadas].sort((a, b) => b.sesion_date.localeCompare(a.sesion_date))
    let racha = 0
    for (const s of opOrd) {
      const registrados = factoresDe(s).filter(f => factorAplica(f, s) && evaluable(s, f))
      if (registrados.length && registrados.every(f => cumple(s, f.key, f))) racha++
      else break
    }

    // Errores por tipo
    const tipoCount = {}
    cas.forEach(c => {
      const t = c.tipo || 'sintipo'
      tipoCount[t] = (tipoCount[t] || 0) + 1
    })
    const erroresPsico = tipoCount.psicologico || 0

    // Causa raíz: nombres de error más frecuentes
    const nameCount = {}
    cas.forEach(c => {
      const n = c.casuistica || c.descripcion || 'Error'
      if (!nameCount[n]) nameCount[n] = { n, count: 0, tipo: c.tipo || 'sintipo' }
      nameCount[n].count++
    })
    const causaRaiz = Object.values(nameCount).sort((a, b) => b.count - a.count).slice(0, 6)

    // Días limpios (conectados sin error)
    const fechasError = new Set(cas.map(c => c.sesion_date))
    const diasLimpios = conectadas.filter(s => !fechasError.has(s.sesion_date)).length
    const diasLimpiosPct = conectadas.length ? Math.round(diasLimpios / conectadas.length * 100) : null

    // Registro de sesiones (días con actividad), más reciente primero
    const log = conectadas
      .slice()
      .sort((a, b) => b.sesion_date.localeCompare(a.sesion_date))
      .map(s => buildLogRow(s, trByDate[s.sesion_date] || [], casByDate[s.sesion_date] || []))

    // Historial de racha (últimas 12 sesiones operadas)
    const hist = [...operadas].sort((a, b) => a.sesion_date.localeCompare(b.sesion_date)).slice(-12).map(s => {
      const registrados = factoresDe(s).filter(f => factorAplica(f, s) && evaluable(s, f))
      const fails = registrados.filter(f => !cumple(s, f.key, f)).length
      const tieneError = (casByDate[s.sesion_date] || []).length > 0
      const enVentana = tradesEnVentanaNoticia(trByDate[s.sesion_date] || [], s).length > 0
      if (!registrados.length) return 'empty'
      if (fails === 0 && !tieneError && !enVentana) return 'full'
      if (tieneError || enVentana || fails > 1) return 'broken'
      return 'partial'
    })

    // Verificación automática: días que operaron dentro de la ventana de noticia roja
    const violacionesNoticia = log.filter(r => r.enVentana).length

    // Desde el 01/10 el período puede medirse con el plan: días por su veredicto.
    const medida = medidaDelPeriodo(ses, etapaActual, ctx)

    return {
      r, totalConectadas: conectadas.length, totalOperadas: operadas.length,
      disciplinaPct, dOk, dTotal, phases, faseDebil, racha, hist,
      tipoCount, erroresTotal: cas.length, erroresPsico, causaRaiz,
      diasLimpios, diasLimpiosPct, log, violacionesNoticia,
      cas,   // ocurrencias del período (para los modales de detalle por día)
      medida, plan: medida === 'plan' ? computePlan(ses) : null,
    }
  }

  // ── La medida del plan: ¿tu trade cumplía las reglas? (D-052, 10/11/2026) ──
  // El juicio de cada trade lo da medir.py; db.js lo suma (resumenDisciplina). Aquí solo se pinta.
  // Es el mismo número que dan el calendario y Análisis: sale de calcDisciplinaStats.
  // Diseño: docs/disenos/2026-11-10-disciplina-reglas.md.
  function computePlan(ses) {
    return calcDisciplinaStats(ses, DB.checklistTodos(), ctx).resumen
  }

  function dayTag(dateTrades, sesion) {
    if (sesion?.no_opero) {
      if (sesion.motivo_no_opero === 'Setup válido no tomado' || sesion.setup_valido_no_tomado) return { t: 'No entró', cls: 'noop' }
      if (sesion.motivo_no_opero === 'FOMC') return { t: 'FOMC', cls: 'noop' }
      return { t: 'No operó', cls: 'noop' }
    }
    const nonBE = dateTrades.filter(t => !isBE(t.profit))
    if (!dateTrades.length) return { t: '—', cls: 'noop' }
    if (!nonBE.length) return { t: 'B.E.', cls: 'noop' }
    const tg = nonBE.filter(isWinTrade).length
    const sl = nonBE.filter(isLossTrade).length
    if (tg > 0 && sl === 0) return { t: 'TG', cls: 'tg' }
    if (sl > 0 && tg === 0) return { t: 'SL', cls: 'sl' }
    if (tg > 0 && sl > 0) return { t: 'Mixto', cls: 'mix' }
    const net = nonBE.reduce((a, t) => a + (parseFloat(t.profit) || 0), 0)
    return net >= 0 ? { t: 'TG', cls: 'tg' } : { t: 'SL', cls: 'sl' }
  }

  function buildLogRow(s, dTrades, dCas) {
    const tag = dayTag(dTrades, s)
    const fases = [...new Set(dCas.map(c => c.fase).filter(Boolean))].sort()
    const faseTxt = fases.length ? 'Fase ' + fases.join(', ') : '—'
    let detalle, tipoTxt = '—'
    if (dCas.length) {
      detalle = dCas.map(c => esc(c.casuistica || c.descripcion || 'Error')).join(' · ')
      const tipos = [...new Set(dCas.map(c => c.tipo).filter(Boolean))]
      tipoTxt = tipos.map(t => (TIPO[t]?.label) || t).join(', ')
    } else {
      detalle = '<span class="dd-ok-pill">✓ Sesión limpia · sin errores</span>'
    }
    // Verificación automática: ¿operó dentro de la ventana de la noticia roja?
    const enVentana = tradesEnVentanaNoticia(dTrades, s)
    if (enVentana.length) {
      detalle += ` <span class="dd-noticia-pill" title="Entró en la ventana ±5 min de la noticia roja">🚫 Operó en ventana de noticia</span>`
    }
    return { date: s.sesion_date, tag, faseTxt, detalle, tipoTxt, dCas, enVentana: enVentana.length }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  function fmtDateShort(d) {
    const [, m, day] = d.split('-')
    return `${parseInt(day)} ${MESES[parseInt(m)-1].slice(0,3).toLowerCase()}`
  }
  function statValueClass(pct, goodHigh = true) {
    if (pct == null) return ''
    const good = goodHigh ? pct >= 80 : pct <= 20
    const bad = goodHigh ? pct < 55 : pct > 50
    return good ? 'pos' : bad ? 'neg' : ''
  }

  function render() {
    const cont = document.getElementById('disciplinaContent')
    if (!cont) return
    if (!DISC_FACTORS.length) {
      cont.innerHTML = '<p class="dd-empty">No hay ítems de checklist configurados. Defínelos en Reglas y Estrategia.</p>'
      return
    }
    const d = compute()

    if (d.totalConectadas === 0) {
      cont.innerHTML = `<p class="dd-empty">Sin días con actividad en el período (${esc(d.r.label)}).</p>`
      return
    }
    if (d.medida === 'plan') { renderPlan(cont, d); return }

    // ── Stat strip ──
    const stats = [
      { label: 'Racha de disciplina', value: `${d.racha}<span class="dd-unit">d</span>`, sub: 'días operados con checklist 100%' },
      { label: 'Disciplina total', value: d.disciplinaPct == null ? '—' : `${d.disciplinaPct}%`, sub: `${d.dOk}/${d.dTotal} ítems aplicables`, cls: statValueClass(d.disciplinaPct) },
      { label: 'Fase más débil', value: d.faseDebil ? `${d.faseDebil.pct}%` : '—', sub: d.faseDebil ? d.faseDebil.label.replace('—','·') : 'sin datos', cls: d.faseDebil ? statValueClass(d.faseDebil.pct) : '' },
      { label: 'Errores', value: `${d.erroresTotal}`, sub: `${d.erroresPsico} psicológicos · ${d.totalConectadas} sesiones`, cls: d.erroresTotal === 0 ? 'pos' : d.erroresPsico > 0 ? 'neg' : '' },
      { label: 'Días limpios', value: d.diasLimpiosPct == null ? '—' : `${d.diasLimpiosPct}%`, sub: `${d.diasLimpios}/${d.totalConectadas} sin errores`, cls: statValueClass(d.diasLimpiosPct) },
      { label: 'En ventana noticia', value: `${d.violacionesNoticia}`, sub: 'días operando en ±5 min', cls: d.violacionesNoticia === 0 ? 'pos' : 'neg' },
    ]
    const stripHtml = stats.map(s => `
      <div class="dd-stat">
        <div class="dd-stat-label">${s.label}</div>
        <div class="dd-stat-value ${s.cls || ''}">${s.value}</div>
        <div class="dd-stat-sub">${s.sub}</div>
      </div>`).join('')

    // ── Phase board ──
    const phaseHtml = d.phases.map(p => {
      const col = p.pct == null ? p.color : p.pct >= 85 ? '#3FE0A6' : p.pct >= 60 ? '#E0A33B' : '#E24B4A'
      const fila = fc => {
        const noData = fc.cobertura === 0
        const ok = !noData && fc.fails.length === 0
        const dotCls = noData ? 'na' : ok ? 'ok' : 'fail'
        const cov = (!noData && fc.aplicablesTotal > fc.cobertura)
          ? `<span class="dd-cov" title="Sesiones con dato registrado / sesiones aplicables">datos ${fc.cobertura}/${fc.aplicablesTotal}</span>`
          : ''
        const rate = noData ? `<span class="dd-nodata">sin datos</span>` : `${fc.ok}/${fc.aplica}`
        // Solo se abre lo que tiene algo que mostrar: los días en que falló.
        const clic = fc.fails.length > 0
        return `
          <div class="dd-check-row${clic ? ' dd-clickable' : ''}"${clic ? ` data-fail-key="${fc.key}" title="Ver ${fc.fails.length} día${fc.fails.length !== 1 ? 's' : ''} en que falló"` : ''}>
            <span class="dd-dot ${dotCls}"></span>
            <span class="dd-check-label">${esc(fc.label)}${cov ? ' ' + cov : ''}</span>
            <span class="dd-check-rate">${rate}</span>
            ${clic ? '<i class="ti ti-chevron-right dd-chev"></i>' : ''}
          </div>`
      }
      // Las reglas de un setup solo aplican a ese setup, así que mezclarlas en una
      // lista única hacía leer "sin datos" en las 4 del Reingreso cada día de Continuación.
      // Con una sola familia presente no se parte nada (Fases 1 y 3).
      const rows = agruparPorSetup(p.factores).map(g => {
        const cuerpo = g.factores.map(fila).join('')
        if (!g.nombre) return cuerpo
        const con = g.factores.filter(fc => fc.cobertura > 0)
        const ok = con.reduce((a, fc) => a + fc.ok, 0)
        const tot = con.reduce((a, fc) => a + fc.aplica, 0)
        return `
          <div class="dd-group-head">
            <span class="dd-group-name">${esc(g.nombre)}</span>
            <span class="dd-group-rate">${tot ? `${ok}/${tot}` : 'no aplicó'}</span>
          </div>${cuerpo}`
      }).join('')
      return `
        <div class="dd-phase">
          <div class="dd-phase-head">
            <div>
              <div class="dd-phase-name" style="color:${p.color}">${p.label}</div>
              <div class="dd-phase-when">${p.when}</div>
            </div>
            <div class="dd-phase-score" style="color:${col}">${p.pct == null ? '—' : p.pct + '%'}</div>
          </div>
          <div class="dd-phase-list">${rows}</div>
        </div>`
    }).join('')

    // ── Streak banner ──
    const histHtml = d.hist.map(h => `<div class="dd-hist-cell ${h}"></div>`).join('')
    const streakMsg = d.racha > 0
      ? `Llevas <b>${d.racha}</b> día${d.racha !== 1 ? 's' : ''} operado${d.racha !== 1 ? 's' : ''} cumpliendo el checklist al 100%. Mantener el proceso es el objetivo principal — por encima del P&L.`
      : `El último día operado tuvo algún ítem del checklist sin cumplir. Recupera la racha respetando el proceso completo.`
    const streakHtml = `
      <div class="dd-streak">
        <div class="dd-streak-left">
          <div class="dd-streak-num">${d.racha}</div>
          <div>
            <div class="dd-streak-label">Racha actual</div>
            <div class="dd-streak-main">${streakMsg}</div>
          </div>
        </div>
        ${d.hist.length ? `<div class="dd-streak-hist" title="Últimas ${d.hist.length} sesiones operadas — verde: checklist 100%, ámbar: incumplimiento menor, rojo: error o varios incumplimientos">${histHtml}</div>` : ''}
      </div>`

    cont.innerHTML = `
      <div class="dd-strip">${stripHtml}</div>

      <div class="dd-sec-head"><span class="dd-sec-num">01</span><span class="dd-sec-title">Checklist por fase del proceso</span><div class="dd-sec-line"></div></div>
      <div class="dd-phase-board">${phaseHtml}</div>
      ${streakHtml}
      ${erroresHtml(d, '02')}`

    lastData = d
    wireErrores(cont)
    cont.querySelectorAll('[data-fail-key]').forEach(el =>
      el.addEventListener('click', () => openFactorModal(el.dataset.failKey)))
  }

  // ── Errores por tipo + causa raíz (las dos medidas) ──
  function erroresHtml(d, num) {
    const tipoOrder = ['psicologico', 'analitico', 'operativo', 'marcado']
    const maxTipo = Math.max(1, ...tipoOrder.map(t => d.tipoCount[t] || 0))
    const barsHtml = tipoOrder.filter(t => (d.tipoCount[t] || 0) > 0).map(t => {
      const n = d.tipoCount[t] || 0
      const info = TIPO[t]
      return `
        <div class="dd-bar-row dd-clickable" data-err-tipo="${t}" title="Ver los días con errores de este tipo">
          <div class="dd-bar-top"><span>${info.emoji} ${info.label}</span><b>${n}</b></div>
          <div class="dd-bar-track"><div class="dd-bar-fill ${info.cls}" style="width:${Math.round(n / maxTipo * 100)}%"></div></div>
        </div>`
    }).join('') || '<p class="dd-soft">Sin errores registrados en el período.</p>'

    const causaHtml = d.causaRaiz.length ? d.causaRaiz.map(c => {
      const info = TIPO[c.tipo] || { label: '—', cls: 'op' }
      return `
        <div class="dd-cause-row dd-clickable" data-err-causa="${esc(c.n)}" title="Ver los días con este error">
          <span class="dd-cause-name"><span class="dd-tag ${info.cls}">${info.label.slice(0,5)}</span>${esc(c.n)}</span>
          <span class="dd-cause-count">${c.count}</span>
        </div>`
    }).join('') : '<p class="dd-soft">Sin causas registradas.</p>'

    return `
      <div class="dd-sec-head"><span class="dd-sec-num">${num}</span><span class="dd-sec-title">Errores por tipo y causa raíz</span><div class="dd-sec-line"></div></div>
      <div class="dd-error-grid">
        <div class="dd-panel"><div class="dd-panel-title">Distribución por tipo (${d.totalConectadas} sesiones)</div>${barsHtml}</div>
        <div class="dd-panel"><div class="dd-panel-title">Causa raíz más frecuente</div><div class="dd-cause-list">${causaHtml}</div></div>
      </div>`
  }
  // Clic en un tipo o una causa → modal con los días de esos errores
  function wireErrores(cont) {
    cont.querySelectorAll('[data-err-tipo]').forEach(el =>
      el.addEventListener('click', () => openErrorsModal({ tipo: el.dataset.errTipo })))
    cont.querySelectorAll('[data-err-causa]').forEach(el =>
      el.addEventListener('click', () => openErrorsModal({ causa: el.dataset.errCausa })))
  }

  // ── La pantalla: tu fuga, tres cifras y un cuadrito por día (D-052, boceto del 10/11) ──
  // Kris no abría la de D-047: decía *que* se salió del plan, no *qué regla* rompió. Lo primero
  // que se ve ahora es la regla que más rompe, con sus días y sus propias notas.
  const diaCorto = f => f.slice(8, 10)
  const fechaCorta = f => `${diaCorto(f)}/${f.slice(5, 7)}`
  const listaFechas = fs => {
    const d = fs.map(diaCorto)
    return d.length > 1 ? `${d.slice(0, -1).join(', ')} y ${d[d.length - 1]}/${fs[0].slice(5, 7)}` : fechaCorta(fs[0])
  }
  // El cuadrito de un día: tono y etiqueta corta.
  function cuadro(x) {
    const j = x.j
    if (j.estado === 'sin_trade') return { tono: 'n', corto: 'no operaste',
      tit: 'No operaste: nunca es fallo' + (j.plan ? ` (el plan: ${fmtOpPlan(j.plan)})` : '') }
    if (j.estado === 'pendiente') return { tono: 'n', corto: 'pendiente', tit: 'Aún sin el juicio del motor' }
    if (j.estado === 'discusion') return { tono: 'b', corto: 'en discusión', tit: j.discusion?.nota || 'En discusión' }
    const rota = j.ops.find(op => !op.juicio.cumple)
    if (!rota) return { tono: 'g', corto: j.ops.every(op => op.coincide) ? 'el del plan' : 'válido',
      tit: j.ops.map(op => op.juicio.texto).join(' · ') }
    const pts = /(\d+) pts/.exec(rota.juicio.texto)
    const delPlan = /stop del plan/.test(rota.juicio.texto)   // el suyo cabía; el del plan, no (05/11)
    return { tono: 'r', corto: rota.juicio.regla === 'stop_max' && pts ? (delPlan ? `stop del plan ${pts[1]}` : `stop ${pts[1]} pts`) : reglaTxt(rota.juicio.regla).corto,
      tit: rota.juicio.texto }
  }
  function renderPlan(cont, d) {
    const p = d.plan
    const mes = periodoInfo().k === 'month' ? MESES[parseInt(d.r.from.slice(5, 7)) - 1].toLowerCase() : 'el período'

    let fuga
    if (p.fuga) {
      const t = reglaTxt(p.fuga.regla)
      fuga = `
        <div class="dd-fuga">
          <div class="dd-fuga-l">Tu fuga ${periodoInfo().k === 'month' ? 'de ' + mes : 'del período'}</div>
          <div class="dd-fuga-t">${esc(t.titulo)}</div>
          <div class="dd-fuga-c">${p.fuga.n} de tus ${p.total} trade${p.total !== 1 ? 's' : ''} · ${listaFechas(p.fuga.fechas)}</div>
          ${t.plan ? `<div class="dd-fuga-p">${esc(t.plan)}</div>` : ''}
          ${p.fuga.notas.length ? `<div class="dd-fuga-n">Tus notas esos días: ${p.fuga.notas.map(n => `«${esc(n.length > 90 ? n.slice(0, 90).trim() + '…' : n)}»`).join(' · ')}</div>` : ''}
        </div>`
    } else {
      fuga = `
        <div class="dd-fuga ${p.total ? 'ok' : 'nada'}">
          <div class="dd-fuga-l">${p.total ? 'Sin fugas' : 'Sin trades juzgados'}</div>
          <div class="dd-fuga-t">${p.total ? 'Todos tus trades, dentro de las reglas' : 'No operaste en el período'}</div>
        </div>`
    }

    const tonoPct = v => v == null ? '' : v >= 80 ? 'pos' : v < 55 ? 'neg' : 'ama'
    const stats = [
      { label: 'Dentro de las reglas', value: p.total ? `${p.ok} de ${p.total}` : '—', cls: tonoPct(p.pct),
        sub: p.total ? `${p.pct}% de tus trades` : 'sin trades juzgados' },
      { label: 'Racha', value: `${p.racha}`, cls: p.racha ? 'pos' : '', sub: 'trades seguidos dentro de las reglas' },
      { label: 'En discusión', value: `${p.enDiscusion.length}`, cls: p.enDiscusion.length ? 'blu' : '', sub: 'días en que crees que el motor se equivoca' },
    ]
    const strip = stats.map(s => `
      <div class="dd-stat">
        <div class="dd-stat-label">${s.label}</div>
        <div class="dd-stat-value ${s.cls}">${s.value}</div>
        <div class="dd-stat-sub">${s.sub}</div>
      </div>`).join('')

    const cuadros = p.dias.map(x => {
      const c = cuadro(x)
      return `<div class="dd-dia ${c.tono}" data-dia="${x.fecha}" title="${esc(fechaCorta(x.fecha))} · ${esc(c.tit)}">${diaCorto(x.fecha)}<small>${esc(c.corto)}</small></div>`
    }).join('')
    const leyenda = `
      <div class="dd-ley">
        <span><i class="dd-sw g"></i>Dentro de las reglas (aunque no sea el trade del bot)</span>
        <span><i class="dd-sw r"></i>Regla rota</span>
        <span><i class="dd-sw n"></i>No operaste: nunca es fallo</span>
        ${p.enDiscusion.length ? '<span><i class="dd-sw b"></i>En discusión</span>' : ''}
      </div>`

    const discusion = p.enDiscusion.length ? `
      <div class="dd-sec-head"><span class="dd-sec-num">02</span><span class="dd-sec-title">En discusión</span><div class="dd-sec-line"></div></div>
      <div class="dd-panel">${p.enDiscusion.map(x => {
        const rota = x.j.ops.find(op => !op.juicio.cumple)
        const cerrada = x.j.discusion.estado === 'plan'
        return `
          <div class="dd-disc">
            <div class="dd-disc-txt" data-dia="${x.fecha}" title="Ver el día">
              <b>${fechaCorta(x.fecha)}</b> · el motor: ${esc(rota ? rota.juicio.texto : 'dentro de las reglas')}
              <div class="dd-disc-nota">${x.j.discusion.nota ? `Tú: «${esc(x.j.discusion.nota)}»` : 'Sin nota'}</div>
            </div>
            ${cerrada ? '<span class="dd-disc-cerrada">Tenías razón: no cuenta</span>' : `
            <div class="dd-disc-bts">
              <button type="button" class="dd-btn" data-cerrar="${x.fecha}" data-estado="motor">El motor tenía razón</button>
              <button type="button" class="dd-btn" data-cerrar="${x.fecha}" data-estado="plan">Tenía yo razón</button>
            </div>`}
          </div>`
      }).join('')}</div>` : ''

    cont.innerHTML = `
      ${fuga}
      <div class="dd-strip dd-strip-reglas">${strip}</div>

      <div class="dd-sec-head"><span class="dd-sec-num">01</span><span class="dd-sec-title">Cada día</span><div class="dd-sec-line"></div></div>
      <div class="dd-dias">${cuadros}</div>
      ${leyenda}
      ${discusion}
      ${erroresHtml(d, p.enDiscusion.length ? '03' : '02')}`

    lastData = d
    wireErrores(cont)
    cont.querySelectorAll('[data-dia]').forEach(el => el.addEventListener('click', () => abrirDia(el.dataset.dia)))
    cont.querySelectorAll('[data-cerrar]').forEach(b => b.addEventListener('click', async () => {
      b.disabled = true
      try { await DB.cerrarDiscusion(b.dataset.cerrar, b.dataset.estado); await load() }
      catch (e) { b.disabled = false; Toast.show('No se pudo cerrar la discusión: ' + e.message, 'error') }
    }))
  }

  // El visor del día, recorriendo los días que enseña esta pantalla.
  function abrirDia(fecha) {
    const fechas = [...new Set([...document.querySelectorAll('#section-disciplina [data-dia]')].map(el => el.dataset.dia))].sort()
    Visor.abrir({ items: fechas.map(f => ({ fecha: f, fuente: 'mio' })), actual: { fecha, fuente: 'mio' }, titulo: 'Disciplina' })
  }

  // Agrupa los ítems de una fase por familia de setup. Devuelve un solo grupo sin
  // nombre (no se pinta encabezado) si todos son comunes o todos del mismo setup.
  // Los nombres salen del catálogo `catalogo_setups`, no de una lista fija.
  function agruparPorSetup(factores) {
    const claves = [...new Set(factores.map(fc => fc.setup || ''))]
    if (claves.length < 2) return [{ nombre: null, factores }]
    const nombreDe = k => {
      if (!k) return 'Comunes'
      const c = setupsCat.find(x => x.codigo === k)
      return c ? c.nombre : k.charAt(0).toUpperCase() + k.slice(1)
    }
    // Comunes primero; el resto en el orden del catálogo.
    const orden = k => k ? 1 + Math.max(0, setupsCat.findIndex(x => x.codigo === k)) : 0
    return claves.sort((a, b) => orden(a) - orden(b)).map(k => ({
      nombre: nombreDe(k),
      factores: factores.filter(fc => (fc.setup || '') === k),
    }))
  }

  // ── Modal: días en que falló una regla del checklist ──────────────────────
  // Muestra el enunciado completo (no visible en el tablero) y, por día, POR QUÉ
  // falló. Cada día es clicable → modal del día (delegación en metrics.js).
  function openFactorModal(key) {
    if (!lastData) return
    let fc = null
    lastData.phases.forEach(p => p.factores.forEach(f => { if (f.key === key) fc = f }))
    if (!fc) return

    const meta = [
      `Fase ${fc.fase}`,
      fc.evidencia === 'auto' ? '⚙ verificada por datos' : 'declarada por ti',
      fc.bloqueaGo ? 'bloquea el GO' : 'no bloquea el GO',
      fc.aplica_si === 'dia_fomc' ? 'solo días FOMC'
        : fc.aplica_si === 'hay_noticia' ? 'solo con noticia roja' : 'aplica siempre',
    ].map(m => `<span class="dd-rule-meta-item">${esc(m)}</span>`).join('')

    const dias = fc.failsInfo.map(fi => {
      const mo = MOTIVOS[fi.tipo] || MOTIVOS.sin_marcar
      const dow = DOW[new Date(fi.date + 'T00:00:00').getDay()]
      const tags = (fi.errores || []).map(c =>
        `<span class="disc-fail-tag">${(TIPO[c.tipo]?.emoji) || '❔'} ${esc(c.casuistica || 'Error')}</span>`).join('')
      const desc = (fi.errores || []).filter(c => c.descripcion)
        .map(c => `<div class="dd-fail-desc">${esc(c.descripcion)}</div>`).join('')
      return `
        <div class="disc-fail-day" data-date="${fi.date}" style="cursor:pointer" title="Ver el detalle del día">
          <div class="disc-fail-day-header">
            <span class="disc-date-dow">${dow}</span>
            <span class="disc-date-val">${fi.date}</span>
            <span class="dd-fail-badge ${mo.cls}">${mo.badge}</span>
          </div>
          <div class="dd-fail-why">${fi.texto}</div>
          ${tags ? `<div class="disc-fail-tags">${tags}</div>` : ''}
          ${desc}
        </div>`
    }).join('') || '<p style="color:var(--text3);padding:8px 0">Sin fallos en el período.</p>'

    const h = document.getElementById('disciplineModalTitle')
    if (h) h.innerHTML = `<i class="ti ti-checkup-list"></i> ${esc(fc.label)}`
    document.getElementById('disciplineModalContent').innerHTML = `
      <div style="padding:16px 20px 20px">
        ${fc.enunciado ? `<div class="dd-rule-enunciado">${esc(fc.enunciado)}</div>` : ''}
        <div class="dd-rule-meta">${meta}</div>
        <p class="disc-section-title">${fc.failsInfo.length} día${fc.failsInfo.length !== 1 ? 's' : ''} sin cumplirla de ${fc.aplica} evaluado${fc.aplica !== 1 ? 's' : ''} — ${esc(lastData.r.label)}</p>
        ${dias}
      </div>`
    document.getElementById('disciplineModal').classList.remove('hidden')
  }

  // ── Modal: días con errores (por tipo o por causa/nombre) ────────────────
  let lastData = null
  function openErrorsModal(filtro) {
    if (!lastData) return
    const nombreDe = c => c.casuistica || c.descripcion || 'Error'
    const lista = lastData.cas.filter(c => filtro.tipo
      ? (c.tipo || 'sintipo') === filtro.tipo
      : nombreDe(c) === filtro.causa)

    const info = filtro.tipo ? TIPO[filtro.tipo] : null
    const titulo = filtro.tipo
      ? `Errores ${info ? info.label.toLowerCase() + 's' : 'sin tipo'}`
      : filtro.causa

    // Agrupar por fecha (más reciente primero)
    const porDia = {}
    lista.forEach(c => { (porDia[c.sesion_date] = porDia[c.sesion_date] || []).push(c) })
    const fechas = Object.keys(porDia).sort((a, b) => b.localeCompare(a))

    const rows = fechas.map(fecha => {
      const dow = DOW[new Date(fecha + 'T00:00:00').getDay()]
      const tags = porDia[fecha].map(c => {
        const ti = TIPO[c.tipo] || { emoji: '❔' }
        return `<span class="disc-fail-tag">${ti.emoji} ${esc(nombreDe(c))}</span>`
      }).join('')
      return `
        <div class="disc-fail-day" data-date="${fecha}" style="cursor:pointer" title="Ver el detalle del día">
          <div class="disc-fail-day-header">
            <span class="disc-date-dow">${dow}</span>
            <span class="disc-date-val">${fecha}</span>
          </div>
          <div class="disc-fail-tags">${tags}</div>
        </div>`
    }).join('') || '<p style="color:var(--text3);padding:8px 0">Sin ocurrencias en el período.</p>'

    const h = document.getElementById('disciplineModalTitle')
    if (h) h.innerHTML = `<i class="ti ti-alert-triangle"></i> ${info ? info.emoji + ' ' : ''}${esc(titulo)}`
    document.getElementById('disciplineModalContent').innerHTML = `
      <div style="padding:16px 20px 20px">
        <p class="disc-section-title">${lista.length} ocurrencia${lista.length !== 1 ? 's' : ''} en ${fechas.length} día${fechas.length !== 1 ? 's' : ''} — ${esc(lastData.r.label)}</p>
        ${rows}
      </div>`
    document.getElementById('disciplineModal').classList.remove('hidden')
  }

  // Desplegable (no píldoras): comparte la barra con el título y las flechas, y
  // en móvil las 4 opciones a la vista no caben.
  function renderPeriodPicker() {
    const el = document.getElementById('disciplinaPeriod')
    if (!el) return
    const abierto = !!el.querySelector('.per-filter-panel:not(.hidden)')
    const opts = PERIODOS.map(p => `
      <button type="button" class="per-filter-opt ${period === p.k ? 'on' : ''}" data-period="${p.k}">
        <i class="ti ${period === p.k ? 'ti-check' : ''}"></i>${p.label}
      </button>`).join('')
    // Etapa: solo aparece cuando hay más de una. Va en el MISMO desplegable que el
    // período para no sumar un tercer control a la barra en móvil.
    const etapas = DB.etapasSync()
    const ev = DB.etapaVista()
    const optsEtapa = etapas.length < 2 ? '' : `
      <div class="per-filter-sep"></div>
      <div class="per-filter-h">Etapa</div>
      ${[{ id: 'auto', nombre: 'La del período' }, ...etapas].map(e => `
        <button type="button" class="per-filter-opt ${ev === e.id ? 'on' : ''}" data-etapa="${e.id}">
          <i class="ti ${ev === e.id ? 'ti-check' : ''}"></i>${esc(e.nombre)}
        </button>`).join('')}`
    el.innerHTML = `
      <button type="button" class="per-filter-btn" id="disciplinaPeriodBtn" title="Período del dashboard">
        <span class="per-filter-text">${periodoInfo().label}</span>
        <i class="ti ti-chevron-down"></i>
      </button>
      <div class="per-filter-panel ${abierto ? '' : 'hidden'}">${opts}${optsEtapa}</div>`
  }
  function togglePeriodPanel(abrir) {
    const p = document.querySelector('#disciplinaPeriod .per-filter-panel')
    if (p) p.classList.toggle('hidden', abrir === undefined ? !p.classList.contains('hidden') : !abrir)
  }

  // Las flechas de la barra superior son compartidas: aquí solo se deciden
  // visibilidad y rótulo. En "Todo" no hay nada que navegar.
  function updateMonthNav() {
    const info = periodoInfo()
    ;['prevMonth', 'nextMonth'].forEach((id, i) => {
      const b = document.getElementById(id)
      if (!b) return
      b.classList.toggle('hidden', !info.paso)
      const txt = info.k === 'year' ? 'Año' : info.k === 'quarter' ? 'Trimestre' : 'Mes'
      b.title = `${txt} ${i ? 'siguiente' : 'anterior'}`
    })
  }

  function refreshTitle() {
    // El rango del período va al contexto de la barra superior (título único).
    // Con dos etapas, el nombre de la que se mide va junto al período. Se calcula
    // aquí y no se lee de `etapaActual`: el título se pinta antes que el tablero.
    const r = range()
    const idEt = etapaDelPeriodo(sesiones.filter(s => s.sesion_date && inR(s.sesion_date, r)), DB.etapaVista())
    const et = DB.etapasSync().length > 1 ? DB.etapasSync().find(e => e.id === idEt) : null
    Nav.setContexto('disciplina', et ? `${range().label} · ${et.nombre}` : range().label)
  }

  async function load() {
    const cont = document.getElementById('disciplinaContent')
    try {
      const [t, s, c, cat, items, fe, obj, sup, mo, disc] = await Promise.all([
        DB.getTrades(),
        DB.getSesiones(),
        DB.getAllCasuisticas(),
        DB.getCatalogoCasuisticas().catch(() => []),
        // TODAS, activas o no: cada día se mide con las de su etapa.
        DB.getChecklistItems().catch(() => null),
        DB.getFechasEspeciales().catch(() => []),
        DB.getObjetivos().catch(() => null),
        DB.getSetups ? DB.getSetups().catch(() => []) : [],
        DB.getMotorDisciplina().catch(() => undefined),   // sin él, la medida de las reglas
        DB.getDiscusiones().catch(() => []),
      ])
      motor = mo; discusiones = disc
      trades = t || []; sesiones = s || []; casuisticas = c || []; catalogo = cat || []
      fechasEsp = fe || []; stopMax = obj?.stop_max_puntos || 80; setupsCat = sup || []
      await DB.getEtapas().catch(() => [])
      buildFactors(DB.checklistDeEtapa(etapaDelPeriodo(sesiones, DB.etapaVista())))
      loaded = true
    } catch (e) {
      if (cont) cont.innerHTML = `<p class="coach-error">Error al cargar disciplina: ${esc(e.message)}</p>`
      return
    }
    renderPeriodPicker(); updateMonthNav(); refreshTitle(); render()
  }

  function wire() {
    document.getElementById('disciplinaPeriod')?.addEventListener('click', e => {
      if (e.target.closest('.per-filter-btn')) { togglePeriodPanel(); return }
      const et = e.target.closest('[data-etapa]')
      if (et) {
        DB.elegirEtapaVista(et.dataset.etapa)
        togglePeriodPanel(false)
        renderPeriodPicker(); refreshTitle(); render()
        return
      }
      const b = e.target.closest('[data-period]'); if (!b) return
      period = b.dataset.period
      renderPeriodPicker(); updateMonthNav(); refreshTitle(); render()
    })
    // Clic fuera → se cierra el desplegable.
    document.addEventListener('click', e => {
      if (!e.target.closest('#disciplinaPeriod')) togglePeriodPanel(false)
    })
    // Flechas de la barra superior, compartidas con el Calendario.
    const aqui = () => typeof Nav === 'undefined' || Nav.actual() === 'disciplina'
    document.getElementById('prevMonth')?.addEventListener('click', () => { if (aqui()) navPeriodo(-1) })
    document.getElementById('nextMonth')?.addEventListener('click', () => { if (aqui()) navPeriodo(1) })
  }

  async function init() {
    if (!wired) { wire(); wired = true }
    // Por defecto, el mes que se ve en el calendario.
    if (!loaded) period = 'month'
    await load()
  }

  // Al volver a la sección: refrescar datos y reflejar el mes actual del calendario
  async function reload() { updateMonthNav(); await load() }

  return { init, reload }
})()
