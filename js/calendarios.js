// Calendarios — la pantalla de los cuatro calendarios (Mío · Chaumer · Claude ·
// Backtesting manual) y la vista completa de los tres que no son el mío.
// Diseño: docs/disenos/2026-09-29-cuatro-calendarios.md
//
// Reglas que no se rompen aquí:
//   · Todo se lee en PUNTOS y el P&L va debajo. En Chaumer y Claude el P&L se
//     CALCULA con los datos de inicio del backtesting (bt_cabecera); el del
//     manual está congelado y el de Mío es el real (`trades.profit`).
//   · El calendario de Claude respeta el candado del motor (D-026): un día sin
//     registrar se pinta 🔒, y su operación ni se pide ni se enseña.
//   · El mes es UNO para los cuatro y vive en Calendar (getYear / getMonth).
//   · "Mío" es la pantalla de siempre (#calMio, calendar.js + metrics.js): aquí
//     solo se resume para su cuadro y para la curva comparada.
const Calendarios = (() => {

  const FUENTES = [
    { id: 'mio',     nombre: 'Mío',                icono: 'ti-user',        color: 'accent' },
    { id: 'chaumer', nombre: 'Chaumer',            icono: 'ti-arrows-diff', color: 'blue',   calc: true },
    { id: 'claude',  nombre: 'Claude',             icono: 'ti-robot',       color: 'violet', calc: true },
    { id: 'manual',  nombre: 'Backtesting manual', icono: 'ti-history',     color: 'neutro' },
  ]
  const FUENTE = Object.fromEntries(FUENTES.map(f => [f.id, f]))
  const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio',
                 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
  const MES_CORTO = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
  const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
  const SETUP = { continuacion: 'Continuación', reingreso: 'Reingreso' }

  let vista = 'hub'            // hub · mio · chaumer · claude · manual
  let fuentes = null           // promesa de los datos de Chaumer, Claude y el manual
  let especiales = {}          // año → { fecha: 'festivo' | 'fomc' }
  let pedido = 0               // descarta respuestas de un mes que ya no se ve
  let curvaInst = null

  const $ = id => document.getElementById(id)
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
  const pad = n => String(n).padStart(2, '0')
  const prefijo = (y, m) => `${y}-${pad(m)}`
  const mesNombre = (y, m) => `${MESES[m - 1]} ${y}`
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1)

  // Puntos con su signo: 40.5 → "+40,5" · -1234.25 → "−1.234,25" (fmtPuntos, db.js)
  const fmtPts = (v, { signo = true } = {}) =>
    `${v < 0 ? '−' : v > 0 && signo ? '+' : ''}${fmtPuntos(v)}`
  const clsSigno = v => (v > 0 ? 'pos' : v < 0 ? 'neg' : '')
  // "08:41:00" → "8:41"
  const horaCorta = h => (h ? String(h).slice(0, 5).replace(/^0/, '') : '')

  // ── Datos ────────────────────────────────────────────────────────────────
  // Chaumer, Claude y el manual son pocas filas (decenas), así que se piden
  // enteros una vez por entrada a la pantalla y se filtran por mes aquí. Así el
  // enlace "última: enero 2026" sabe adónde ir sin otra consulta.
  function cargarFuentes() {
    const hoy = hoyISO()
    const aviso = nombre => err => { console.warn(`[calendarios] ${nombre}:`, err); return null }
    fuentes = Promise.all([
      DB.getChaumerOperativas().catch(aviso('chaumer')),
      DB.motorEstados('2000-01-01', hoy).catch(aviso('motor_estados')),
      DB.getMotorRango('2000-01-01', hoy).catch(aviso('motor_fichas')),
      DB.getBacktesting().catch(aviso('backtesting')),
    ]).then(([chaumer, estados, motor, bt]) => {
      // Los datos de inicio del backtesting ponen el precio del punto al P&L
      // calculado. Sin ellos, los del plan: MNQ, 1 contrato, $1,02.
      cabActual = { valor_punto: 2, contratos: 1, comision: 1.02, ...(bt && bt.cabecera || {}) }
      return { chaumer, estados, motor, manual: bt ? bt.jornadas : null, cab: cabActual }
    })
    return fuentes
  }

  async function especialesDe(y) {
    if (especiales[y]) return especiales[y]
    const filas = await DB.getFechasEspeciales(y).catch(() => [])
    const map = {}
    ;(filas || []).forEach(f => { if (f.tipo === 'festivo' || f.tipo === 'fomc') map[f.fecha] = f.tipo })
    return (especiales[y] = map)
  }

  const pnlCalc = (p, cab) => {
    const c = Number(cab.contratos) || 1
    return p * Number(cab.valor_punto) * c - Number(cab.comision) * c
  }

  // Un día, en el mismo formato para las cuatro fuentes (diseño §3):
  //   { fecha, estado, ops: [{ puntos, pnl, res, setup, hora, dir, obs }], nota, url }
  //   estado: target · stop · mixed · be · sin-entradas · no-opero · sin-op · bloqueado · error
  function estadoPorOps(ops) {
    const t = ops.filter(o => o.res === 'target').length
    const s = ops.filter(o => o.res === 'stop').length
    return t && !s ? 'target' : s && !t ? 'stop' : t && s ? 'mixed' : 'be'
  }
  const resDeTrade = t => ({ win: 'target', loss: 'stop' }[tradeOutcome(t)] || 'be')

  async function diasMio(y, m) {
    const [trades, sesiones] = await Promise.all([
      DB.getTradesByMonth(y, m),
      DB.getSesiones(),
    ])
    const dias = {}
    AccountFilter.filter('calendar', trades).forEach(t => {
      const f = t.trade_date || t.entry_time?.slice(0, 10)
      if (!f || !esDiaHabil(f)) return
      ;(dias[f] ||= { fecha: f, ops: [] }).ops.push({
        puntos: puntosDeTrade(t) ?? 0,
        pnl: parseFloat(t.profit) || 0,
        res: resDeTrade(t),
        dir: t.market_pos === 'Short' ? 'Corto' : 'Largo',
      })
    })
    Object.values(dias).forEach(d => { d.estado = estadoPorOps(d.ops) })
    const pre = prefijo(y, m)
    ;(sesiones || []).forEach(s => {
      const f = s.sesion_date
      if (!f?.startsWith(pre) || dias[f] || !s.no_opero || !esDiaHabil(f)) return
      if (s.motivo_no_opero === 'FOMC' || s.motivo_no_opero === 'Festivo') return
      dias[f] = { fecha: f, ops: [], estado: s.se_conecto !== false ? 'sin-entradas' : 'no-opero',
                  nota: s.motivo_no_opero || '' }
    })
    return dias
  }

  // Lo que Chaumer dejó escrito del día, para la vista del día.
  const textosChaumer = c => [['Contexto', c.contexto], ['Notas', c.notas]].filter(t => t[1])

  function diasChaumer(filas, y, m, cab) {
    const pre = prefijo(y, m), dias = {}
    ;(filas || []).filter(c => c.fecha?.startsWith(pre)).forEach(c => {
      if (!c.opero) {
        dias[c.fecha] = { fecha: c.fecha, ops: [], estado: 'no-opero', nota: c.motivo_no_opero || '',
                             url: c.imagen_url || null, textos: textosChaumer(c) }
        return
      }
      const p = parseFloat(c.puntos) || 0
      const [tipo, sentido] = String(c.setup_codigo || '').split('_')
      const op = {
        puntos: p, pnl: pnlCalc(p, cab),
        res: c.resultado === 'target' || c.resultado === 'stop' ? c.resultado : 'be',
        setup: [SETUP[tipo] || tipo, sentido].filter(Boolean).join(' '),
        hora: horaCorta(c.hora_entrada),
      }
      dias[c.fecha] = { fecha: c.fecha, ops: [op], estado: estadoPorOps([op]),
                        url: c.imagen_url || null, textos: textosChaumer(c) }
    })
    return dias
  }

  function diasClaude(estados, motor, y, m, cab) {
    const pre = prefijo(y, m), dias = {}
    const fichas = Object.fromEntries((motor || []).map(r => [r.fecha, r]))
    ;(estados || []).filter(e => e.fecha?.startsWith(pre)).forEach(e => {
      const f = e.fecha, r = fichas[f]
      if (e.estado === 'bloqueada') { dias[f] = { fecha: f, ops: [], estado: 'bloqueado' }; return }
      if (e.estado === 'error')     { dias[f] = { fecha: f, ops: [], estado: 'error', nota: 'El motor falló ese día' }; return }
      const o = r && r.operacion
      if (e.estado !== 'ok' || !o) {
        dias[f] = { fecha: f, ops: [], estado: 'sin-op', url: r?.grafico_url || null,
                    nota: e.estado === 'ok' ? 'El motor no encontró operación' : 'Sin jornada completa' }
        return
      }
      const p = parseFloat(o.puntos) || 0
      const res = String(o.resultado || '').toLowerCase()
      const op = {
        puntos: p, pnl: pnlCalc(p, cab),
        res: res === 'target' || res === 'stop' ? res : 'be',
        setup: [o.setup, o.sentido].filter(Boolean).join(' '),
        hora: horaCorta(o.hora),
      }
      dias[f] = { fecha: f, ops: [op], estado: estadoPorOps([op]), url: r.grafico_url || null }
    })
    return dias
  }

  function diasManual(jornadas, y, m) {
    const pre = prefijo(y, m), dias = {}
    ;(jornadas || []).filter(j => j.fecha?.startsWith(pre)).forEach(j => {
      // `puntos` va siempre en positivo: el signo lo pone el resultado.
      const ops = (j.operaciones || []).filter(o => o.puntos != null).map(o => ({
        puntos: o.resultado === 'stop' ? -Math.abs(o.puntos) : Math.abs(o.puntos),
        pnl: parseFloat(o.pnl) || 0,
        res: o.resultado === 'target' || o.resultado === 'stop' ? o.resultado : 'be',
        setup: SETUP[o.setup] || o.setup || '',
        hora: horaCorta(o.hora),
        dir: o.direccion === 'corto' ? 'Corto' : o.direccion === 'largo' ? 'Largo' : '',
        obs: o.observaciones || '',
      }))
      dias[j.fecha] = ops.length
        ? { fecha: j.fecha, ops, estado: estadoPorOps(ops), nota: j.notas || '', url: j.imagen || null }
        : { fecha: j.fecha, ops: [], estado: 'sin-op', nota: j.notas || 'Jornada sin operación', url: j.imagen || null }
    })
    return dias
  }

  // Los días de las cuatro fuentes para el mes. `null` = esa fuente no cargó.
  async function diasDelMes(y, m) {
    const [d, mio] = await Promise.all([
      fuentes || cargarFuentes(),
      diasMio(y, m).catch(err => { console.warn('[calendarios] mío:', err); return null }),
    ])
    return {
      mio,
      chaumer: d.chaumer && diasChaumer(d.chaumer, y, m, d.cab),
      claude:  d.estados && diasClaude(d.estados, d.motor, y, m, d.cab),
      manual:  d.manual && diasManual(d.manual, y, m),
    }
  }

  // El último mes con datos de una fuente, para el enlace del cuadro vacío.
  async function ultimoMes(id) {
    const d = await (fuentes || cargarFuentes())
    const fechas = id === 'chaumer' ? (d.chaumer || []).map(c => c.fecha)
      : id === 'claude' ? (d.estados || []).map(e => e.fecha)
      : id === 'manual' ? (d.manual || []).map(j => j.fecha) : []
    const f = fechas.sort().at(-1)
    return f ? { y: +f.slice(0, 4), m: +f.slice(5, 7) } : null
  }

  function resumen(dias) {
    const lista = Object.values(dias || {})
    const ops = lista.flatMap(d => d.ops)
    const suma = k => ops.reduce((s, o) => s + (o[k] || 0), 0)
    return {
      puntos: suma('puntos'), pnl: suma('pnl'), n: ops.length,
      targets: ops.filter(o => o.res === 'target').length,
      stops: ops.filter(o => o.res === 'stop').length,
      be: ops.filter(o => o.res === 'be').length,
      diasOp: lista.filter(d => d.ops.length).length,
      hayDias: lista.length > 0,
    }
  }

  // Los días hábiles del mes, con los huecos del inicio para cuadrar en L–V.
  function semanasDelMes(y, m) {
    const semanas = []
    const ultimo = new Date(y, m, 0).getDate()
    let fila = null
    for (let d = 1; d <= ultimo; d++) {
      const dow = new Date(y, m - 1, d, 12).getDay()
      if (dow === 0 || dow === 6) continue
      if (!fila || dow === 1) { fila = new Array(5).fill(null); semanas.push(fila) }
      fila[dow - 1] = `${y}-${pad(m)}-${pad(d)}`
    }
    return semanas
  }

  // ── Pantalla principal ───────────────────────────────────────────────────
  function miniCalendario(dias, y, m, esp) {
    const hoy = hoyISO()
    const cab = ['L', 'M', 'X', 'J', 'V'].map(d => `<div class="hub-mini-cab">${d}</div>`).join('')
    const celdas = semanasDelMes(y, m).flat().map(f => {
      if (!f) return '<div class="hub-dia hueco"></div>'
      const d = dias[f]
      const estado = d ? d.estado : esp[f] || ''
      const pts = d?.ops.length ? d.ops.reduce((s, o) => s + o.puntos, 0) : null
      const cuerpo = d?.estado === 'bloqueado' ? '<i class="ti ti-lock"></i>'
        : pts != null ? fmtPts(pts) : ''
      const cls = ['hub-dia', estado && `est-${estado}`, f > hoy && 'futuro', f === hoy && 'hoy'].filter(Boolean).join(' ')
      return `<div class="${cls}"><span class="hub-dia-n">${+f.slice(8)}</span><span class="hub-dia-p">${cuerpo}</span></div>`
    }).join('')
    return `<div class="hub-mini">${cab}${celdas}</div>`
  }

  function tarjeta(f, dias, y, m, esp) {
    const cabecera = `
      <header class="hub-card-head">
        <span class="hub-dot"></span>
        <i class="ti ${f.icono} hub-icono"></i>
        <span class="hub-nombre">${f.nombre}</span>
        <span class="hub-abrir">Abrir <i class="ti ti-arrow-right"></i></span>
      </header>`
    let cuerpo
    if (dias == null) {
      cuerpo = `<div class="hub-vacio"><i class="ti ti-cloud-off"></i> No se pudo cargar</div>`
    } else {
      const r = resumen(dias)
      const cifras = r.n
        ? `<div class="hub-cifras">
             <div class="hub-pts ${clsSigno(r.puntos)}">${fmtPts(r.puntos)}<small>pts</small></div>
             <div class="hub-sec">
               <span class="${clsSigno(r.pnl)}">${fmtDinero(r.pnl)}</span>${f.calc ? '<span class="hub-calc" title="P&L calculado con los datos de inicio del backtesting">calc.</span>' : ''}
               <span class="hub-ts"><span class="ts-t">${r.targets}</span><span class="ts-sep">/</span><span class="ts-s">${r.stops}</span></span>
             </div>
           </div>`
        : `<div class="hub-cifras hub-cifras-vacias">
             <div class="hub-pts">—</div>
             <div class="hub-sec"><span class="hub-muted">${r.hayDias ? 'Sin operaciones' : `Sin jornadas en ${MESES[m - 1]}`}</span>
               ${r.hayDias ? '' : `<button type="button" class="hub-ir" data-ultimo="${f.id}" hidden></button>`}</div>
           </div>`
      cuerpo = cifras + miniCalendario(dias, y, m, esp)
    }
    return `
      <article class="hub-card hc-${f.color}" data-fuente="${f.id}" tabindex="0" role="button"
               aria-label="Abrir el calendario ${f.id === 'mio' ? 'mío' : `de ${f.nombre}`}">
        ${cabecera}${cuerpo}
      </article>`
  }

  async function renderHub() {
    const y = Calendar.getYear(), m = Calendar.getMonth()
    const token = ++pedido
    const [dias, esp] = await Promise.all([diasDelMes(y, m), especialesDe(y)])
    if (token !== pedido) return   // el mes cambió mientras se cargaba

    const grid = $('hubGrid')
    grid.innerHTML = FUENTES.map(f => tarjeta(f, dias[f.id], y, m, esp)).join('')
    grid.querySelectorAll('.hub-card').forEach(card => {
      const abrirla = () => abrir(card.dataset.fuente)
      card.addEventListener('click', e => { if (!e.target.closest('.hub-ir')) abrirla() })
      card.addEventListener('keydown', e => {
        if ((e.key === 'Enter' || e.key === ' ') && !e.target.closest('.hub-ir')) { e.preventDefault(); abrirla() }
      })
    })
    // Cuadro vacío: enlace al último mes con datos de esa fuente (mueve los cuatro).
    grid.querySelectorAll('.hub-ir[data-ultimo]').forEach(async btn => {
      const u = await ultimoMes(btn.dataset.ultimo)
      if (!u || token !== pedido) return
      btn.textContent = `Última: ${MES_CORTO[u.m - 1]} ${u.y} →`
      btn.hidden = false
      btn.addEventListener('click', e => { e.stopPropagation(); Calendar.irAMes(u.y, u.m) })
    })
    pintarCurvaComparada(dias, y, m)
  }

  // ── Curva comparada: los puntos acumulados de cada fuente en el mes ─────
  function pintarCurvaComparada(dias, y, m) {
    const ctx = $('hubCurva')
    if (!ctx || typeof Chart === 'undefined') return
    if (curvaInst) { curvaInst.destroy(); curvaInst = null }

    const css = getComputedStyle(document.documentElement)
    const tok = (n, def) => css.getPropertyValue(n).trim() || def
    const COLOR = {
      mio: tok('--accent-txt', '#3FE0A6'), chaumer: tok('--blue-txt', '#8FBDE8'),
      claude: tok('--violet-txt', '#AFA9EC'), manual: tok('--text2', '#A8A89B'),
    }
    const TINTA = tok('--text', '#F4F3EF'), TINTA3 = tok('--text3', '#6B6B60')
    const FONDO = tok('--bg', '#1a1a18'), SUPERF = tok('--bg3', '#2e2e2b')

    // Eje X: los días hábiles del mes hasta hoy (o hasta el último con datos,
    // si el mes ya pasó). Cada serie arrastra su acumulado en los días sin operar.
    const hoy = hoyISO()
    const fechas = semanasDelMes(y, m).flat().filter(f => f && f <= hoy)
    const series = FUENTES.map(f => {
      const d = dias[f.id]
      if (!d || !resumen(d).n) return null
      let acum = 0
      const data = fechas.map(fe => {
        acum += (d[fe]?.ops || []).reduce((s, o) => s + o.puntos, 0)
        return Math.round(acum * 100) / 100
      })
      return { f, data }
    }).filter(Boolean)

    const leyenda = $('hubCurvaLeyenda')
    if (leyenda) leyenda.innerHTML = series.map(s => {
      const v = s.data.at(-1)
      return `<span class="hub-ley hc-${s.f.color}"><span class="hub-dot"></span>${s.f.nombre}
                <b class="${clsSigno(v)}">${fmtPts(v)}</b></span>`
    }).join('')
    const lienzo = ctx.parentElement
    lienzo.classList.toggle('vacio', !series.length)
    lienzo.dataset.vacio = `Ningún calendario tiene operaciones en ${mesNombre(y, m)}`
    if (!series.length) return

    const etiqueta = f => `${+f.slice(8)} ${MES_CORTO[+f.slice(5, 7) - 1]}`
    curvaInst = new Chart(ctx, {
      type: 'line',
      data: {
        labels: fechas.map(etiqueta),
        datasets: series.map(s => ({
          label: s.f.nombre, data: s.data,
          borderColor: COLOR[s.f.id], backgroundColor: COLOR[s.f.id],
          // Monótona: suaviza sin inventar picos ni valles que no existieron.
          borderWidth: 2, cubicInterpolationMode: 'monotone',
          borderCapStyle: 'round', borderJoinStyle: 'round',
          // Solo el último punto: el dato que se busca al mirar.
          pointRadius: s.data.map((_, i) => (i === s.data.length - 1 ? 3.5 : 0)),
          pointHoverRadius: 4.5,
          pointBorderColor: FONDO, pointBorderWidth: 2,
        })),
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        layout: { padding: { top: 8, right: 8 } },
        interaction: { mode: 'index', intersect: false },
        animation: { duration: 450, easing: 'easeOutQuart' },
        plugins: {
          legend: { display: false },   // la leyenda va en HTML, con el valor final
          tooltip: {
            backgroundColor: SUPERF, titleColor: TINTA3, bodyColor: TINTA,
            borderColor: 'rgba(255,255,255,0.09)', borderWidth: 1,
            padding: { x: 12, y: 10 }, cornerRadius: 10,
            boxWidth: 8, boxHeight: 8, boxPadding: 4, usePointStyle: true,
            titleFont: { size: 10, weight: '600' }, bodyFont: { size: 12, weight: '600' },
            callbacks: {
              title: items => items[0]?.label?.toUpperCase() || '',
              label: c => ` ${c.dataset.label}  ${fmtPts(c.raw)} pts`,
            },
          },
        },
        scales: {
          x: {
            grid: { display: false }, border: { display: false },
            ticks: { color: TINTA3, font: { size: 10 }, maxRotation: 0, autoSkip: true, maxTicksLimit: 7 },
          },
          y: {
            beginAtZero: true, border: { display: false },
            grid: { color: c => (c.tick.value === 0 ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.035)') },
            ticks: { color: TINTA3, font: { size: 10 }, maxTicksLimit: 5, padding: 6, callback: v => fmtPts(v, { signo: false }) },
          },
        },
      },
    })
  }

  // ── Navegación entre la principal y las vistas ───────────────────────────
  function contexto() {
    const y = Calendar.getYear(), m = Calendar.getMonth()
    const estrecho = window.matchMedia('(max-width: 768px)').matches
    const mes = cap(estrecho ? MES_CORTO[m - 1] : MESES[m - 1])
    const nombre = vista === 'hub' ? '' : `${FUENTE[vista].nombre} · `
    Nav.setContexto('calendar', `${estrecho && vista !== 'hub' ? '' : nombre}${mes} ${y}`)
  }

  function mostrar(v) {
    vista = v
    ocultarTip()
    $('calHub').classList.toggle('hidden', v !== 'hub')
    $('calMio').classList.toggle('hidden', v !== 'mio')
    $('calFuente').classList.toggle('hidden', !(v in FUENTE) || v === 'hub' || v === 'mio')
    // El filtro de cuentas solo afecta a "Mío": fuera de él y de la principal sobra.
    $('accountFilterCalendar')?.classList.toggle('hidden', !(v === 'hub' || v === 'mio'))
    Nav.setVolver(v === 'hub' ? null : () => abrir('hub'))
    contexto()
    document.querySelector('.content-area')?.scrollTo?.(0, 0)
    window.scrollTo(0, 0)
  }

  function abrir(v) {
    mostrar(v)
    if (v === 'hub') renderHub()
    else if (v !== 'mio') renderFuente(v)
    else {
      // Su curva se dibujó con #calMio oculto (alto 0) y Chart.js no se
      // recoloca solo al aparecer: se vuelve a pintar ya visible. Metrics pisa
      // el contexto con el mes a secas, así que se repone después.
      Metrics.rerender()
      contexto()
    }
  }

  // ── Vista completa de Chaumer, Claude y el manual (diseño §5.2) ─────────
  // Las mismas piezas que "Mío" —.metric-card, .cal-cell, la curva y el recuadro
  // del día—, con lo que cada fuente tiene: sin disciplina, errores ni desglose.
  const CLASE_DIA = {
    target: 'day-target', stop: 'day-stop', mixed: 'day-mixed', be: 'day-be',
    'sin-entradas': 'day-sin-setup', 'no-opero': 'day-sin-setup', 'sin-op': 'day-sin-setup',
    bloqueado: 'day-no-trade', error: 'day-no-trade', festivo: 'day-festivo', fomc: 'day-fomc',
  }
  const BADGE = {
    'no-opero':  ['badge-sinsetup', 'ti-eye-off',        'No operó'],
    'sin-op':    ['badge-sinsetup', 'ti-eye-off',        'Sin operación'],
    bloqueado:   ['badge-noopero',  'ti-lock',           'Registra tu día'],
    error:       ['badge-noopero',  'ti-alert-circle',   'Error del motor'],
    be:          ['badge-be',       'ti-scale',          'B.E.'],
    festivo:     ['badge-festivo',  'ti-building-bank',  'Festivo'],
    fomc:        ['badge-fomc',     'ti-chart-candle',   'FOMC'],
  }
  const LEYENDA = {
    chaumer: [['green', 'Target'], ['red', 'Stop'], ['sinsetup', 'No operó'], ['festivo', 'Festivo'], ['fomc', 'FOMC']],
    claude:  [['green', 'Target'], ['red', 'Stop'], ['sinsetup', 'Sin operación'], ['gray', 'Registra tu día'], ['festivo', 'Festivo'], ['fomc', 'FOMC']],
    manual:  [['green', 'Target'], ['red', 'Stop'], ['sinsetup', 'Sin operación'], ['festivo', 'Festivo'], ['fomc', 'FOMC']],
  }

  let diasVista = {}   // fecha → día, de la vista abierta (lo lee el recuadro)
  let fuenteVista = null

  async function diasFuente(id, y, m) {
    const d = await (fuentes || cargarFuentes())
    if (id === 'chaumer') return d.chaumer && diasChaumer(d.chaumer, y, m, d.cab)
    if (id === 'claude')  return d.estados && diasClaude(d.estados, d.motor, y, m, d.cab)
    if (id === 'manual')  return d.manual && diasManual(d.manual, y, m)
    return null
  }

  function habilesHastaHoy(y, m, esp) {
    const hoy = hoyISO()
    return semanasDelMes(y, m).flat().filter(f => f && f <= hoy && esp[f] !== 'festivo').length
  }

  const ptsDe = d => d.ops.reduce((s, o) => s + o.puntos, 0)
  const pnlDe = d => d.ops.reduce((s, o) => s + o.pnl, 0)

  function tarjetasFuente(f, dias, y, m, esp) {
    const r = resumen(dias)
    const conRes = r.targets + r.stops
    const acierto = conRes ? Math.round(r.targets / conRes * 100) : null
    const ratio = r.stops ? (r.targets / r.stops).toFixed(2).replace('.', ',') : r.targets ? '∞' : '—'
    const tono = v => (v > 0 ? 'green' : v < 0 ? 'red' : 'neutral')
    const cards = [
      // 30 sep: aquí manda el P&L y los puntos van debajo (Kris). En la principal,
      // en las celdas y en la curva siguen mandando los puntos.
      { label: f.calc ? 'P&L calc.' : 'P&L Neto', value: r.n ? fmtDinero(r.pnl) : '—',
        color: r.n ? tono(r.pnl) : 'neutral',
        sec: r.n ? `<span class="${clsSigno(r.puntos)}">${fmtPts(r.puntos)} pts</span> · ${fmtPts(r.puntos / r.n)} pts/op.` : 'Sin operaciones' },
      { label: 'Acierto', value: acierto == null ? '—' : `${acierto}%`,
        color: acierto == null ? 'neutral' : acierto >= 50 ? 'green' : 'red',
        sec: r.n ? `sobre ${conRes} operaciones${r.be ? ` · ${r.be} en B.E.` : ''}` : 'Sin operaciones' },
      { label: 'Targets / Stops', color: 'neutral',
        value: `<span class="ts-t">${r.targets}</span><span class="ts-sep">/</span><span class="ts-s">${r.stops}</span>`,
        tono: r.targets > r.stops ? 'green' : r.stops > r.targets ? 'red' : 'neutral',
        sec: `Ratio T/S: ${ratio}` },
      { label: 'Días operados', value: `${r.diasOp}`, color: 'neutral',
        sec: `de ${habilesHastaHoy(y, m, esp)} días hábiles` },
    ]
    return cards.map(c => `
      <div class="metric-card" data-tono="${c.tono || c.color}">
        <div class="metric-body">
          <div class="metric-label">${c.label}</div>
          <div class="metric-value color-${c.color}">${c.value}</div>
          <div class="metric-sec">${c.sec}</div>
        </div>
      </div>`).join('')
  }

  function cuadricula(f, dias, y, m, esp) {
    const hoy = hoyISO()
    let html = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Semana'].map((d, i) =>
      `<div class="cal-header${i === 5 ? ' cal-header-week' : ''}">${d}</div>`).join('')

    semanasDelMes(y, m).forEach((semana, i) => {
      let sPts = 0, sPnl = 0, sOps = 0
      semana.forEach(fe => {
        if (!fe) { html += '<div class="cal-cell empty-cell"></div>'; return }
        const d = dias[fe]
        const futuro = fe > hoy
        const estado = d ? d.estado : esp[fe] || null
        let cls = 'cal-cell'
        if (estado) cls += ` ${CLASE_DIA[estado] || ''}`
        if (futuro) cls += esp[fe] ? ' future-especial' : ' future'
        if (fe === hoy) cls += ' today'

        let cifra = ''
        if (d && d.ops.length) {
          const p = ptsDe(d), usd = pnlDe(d)
          sPts += p; sPnl += usd; sOps += d.ops.length
          cifra = `<div class="cal-pnl ${p >= 0 ? 'positive' : 'negative'}">${fmtPts(p)}</div>
                   <div class="cal-usd">${fmtDinero(usd)}</div>`
        }
        // Badge: el de la fuente; si no hay, el de la fecha especial.
        const b = BADGE[d && !d.ops.length ? d.estado : ''] || (!d?.ops.length && BADGE[esp[fe]])
          || (d?.estado === 'be' && BADGE.be)
        const badge = b ? `<div class="cal-status-badge ${b[0]}"><i class="ti ${b[1]}"></i> ${b[2]}</div>` : ''
        const dir = d?.ops.length && d.ops[0].res !== 'be' ? (() => {
          const sube = d.ops.every(o => /alcista|largo/i.test(`${o.setup} ${o.dir || ''}`))
          const baja = d.ops.every(o => /bajista|corto/i.test(`${o.setup} ${o.dir || ''}`))
          return sube ? '<div class="cal-icon-dir dir-long"><i class="ti ti-trending-up"></i></div>'
            : baja ? '<div class="cal-icon-dir dir-short"><i class="ti ti-trending-down"></i></div>' : ''
        })() : ''
        const clicable = !futuro && d ? ` data-date="${fe}" style="cursor:pointer"` : ''
        html += `<div class="${cls}"${clicable}>
                   <div class="cal-day-num">${+fe.slice(8)}</div>${cifra}${badge}${dir}</div>`
      })
      html += sOps
        ? `<div class="cal-cell cal-week-summary ${sPts >= 0 ? 'week-positive' : 'week-negative'}">
             <div class="week-label">Semana ${i + 1}</div>
             <div class="week-pnl ${sPts >= 0 ? 'positive' : 'negative'}">${fmtPts(sPts)}</div>
             <div class="week-trades">${fmtDinero(sPnl)} · ${sOps} op.</div>
           </div>`
        : `<div class="cal-cell cal-week-summary week-empty">
             <div class="week-label">Semana ${i + 1}</div>
             <div class="week-pnl" style="color:var(--text3)">—</div>
           </div>`
    })

    const r = resumen(dias)
    html += `
      <div class="cal-month-total-widget ${r.pnl >= 0 ? 'positive' : 'negative'}">
        <span class="cmt-label">TOTAL ${MESES[m - 1].toUpperCase()} ${y}</span>
        <span class="cmt-sub">${r.diasOp} día${r.diasOp !== 1 ? 's' : ''} · ${r.n} operaci${r.n !== 1 ? 'ones' : 'ón'}${f.calc ? ' · P&L calc.' : ''}</span>
        <span class="cmt-amount ${r.pnl >= 0 ? 'positive' : 'negative'}">${fmtDinero(r.pnl)}
          <small class="cmt-usd">${fmtPts(r.puntos)} pts</small></span>
      </div>`
    return html
  }

  async function renderFuente(id) {
    const f = FUENTE[id]
    const y = Calendar.getYear(), m = Calendar.getMonth()
    const token = ++pedido
    const [dias, esp] = await Promise.all([diasFuente(id, y, m), especialesDe(y)])
    if (token !== pedido || vista !== id) return
    ocultarTip()
    fuenteVista = f
    diasVista = dias || {}

    $('fuenteMetrics').innerHTML = dias == null
      ? '<div class="hub-vacio"><i class="ti ti-cloud-off"></i> No se pudo cargar</div>'
      : tarjetasFuente(f, dias, y, m, esp)
    $('fuenteLeyenda').innerHTML = LEYENDA[id].map(([c, t]) =>
      `<span class="legend-item"><span class="dot ${c}"></span> ${t}</span>`).join('') +
      (f.calc ? `<span class="legend-item cal-leyenda-nota">P&amp;L calculado a ${cabTexto()}</span>` : '')
    const grid = $('fuenteGrid')
    grid.innerHTML = cuadricula(f, diasVista, y, m, esp)
    grid.querySelectorAll('[data-date]').forEach(cell => {
      cell.addEventListener('click', () => { ocultarTip(); abrirDia(cell.dataset.date) })
      if (conRaton) {
        cell.addEventListener('mouseenter', () => mostrarTip(cell))
        cell.addEventListener('mouseleave', ocultarTip)
      }
    })

    const porDia = {}
    Object.values(diasVista).forEach(d => { if (d.ops.length) porDia[d.fecha] = ptsDe(d) })
    Metrics.pintarEquity('fuenteEquity', {
      porDia, unidad: 'pts',
      pie: fe => `${f.calc ? 'P&L calc.' : 'P&L'}  ${fmtDinero(pnlDe(diasVista[fe]))}`,
    })
  }

  let cabActual = null
  function cabTexto() {
    const c = cabActual || { valor_punto: 2, contratos: 1, comision: 1.02 }
    const n = Number(c.contratos) || 1
    return `${n} contrato${n !== 1 ? 's' : ''} · $${String(c.valor_punto).replace('.', ',')}/punto · ` +
           `$${Number(c.comision).toFixed(2).replace('.', ',')} de comisión`
  }

  // ── Recuadro del día ─────────────────────────────────────────────────────
  // Al pasar el ratón, como en "Mío". El clic abre la vista del día (abrirDia).
  const conRaton = window.matchMedia?.('(hover: hover) and (pointer: fine)').matches

  function tipHtml(fe) {
    const d = diasVista[fe]
    if (!d) return null
    const f = new Date(`${fe}T12:00:00`)
    const fila = (lab, val) => `<div class="cal-tip-fila"><span class="cal-tip-lab">${lab}</span><span class="cal-tip-val">${val}</span></div>`
    let html = `<div class="cal-tip-fecha">${DIAS[f.getDay()]} ${f.getDate()} ${MES_CORTO[f.getMonth()]} · ${fuenteVista.nombre}</div>`
    if (d.estado === 'bloqueado') {
      html += `<div class="cal-tip-muted"><i class="ti ti-lock"></i> Registra tu día para ver lo que marcó el motor</div>`
      return html
    }
    if (!d.ops.length) {
      html += `<div class="cal-tip-muted">${esc(d.nota || 'Sin operación')}</div>`
    }
    d.ops.forEach((o, i) => {
      if (i) html += '<div class="cal-tip-sep"></div>'
      const setup = [o.setup, o.dir && !/alcista|bajista/i.test(o.setup) ? o.dir.toLowerCase() : '']
        .filter(Boolean).join(' ')
      html += fila('Setup', `${esc(setup || '—')}${o.hora ? ` <span class="cal-tip-muted">· ${esc(o.hora)}</span>` : ''}`)
      html += fila('Resultado', { target: 'Target', stop: 'Stop', be: 'B.E.' }[o.res])
      html += fila('Puntos', `<span class="${clsSigno(o.puntos)}">${fmtPts(o.puntos)} pts</span>`)
      html += fila(fuenteVista.calc ? 'P&L calc.' : 'P&L', `<span class="${clsSigno(o.pnl)}">${fmtDinero(o.pnl)}</span>`)
      if (o.obs) html += `<div class="cal-tip-muted cal-tip-obs">${esc(o.obs)}</div>`
    })
    return html
  }

  // ── Vista del día ────────────────────────────────────────────────────────
  // La misma pantalla completa que abre "Mío" (Modal, app.js): cabecera con el
  // resultado, el gráfico fijo —se amplía al clicar— y debajo lo escrito del día.
  // El día 🔒 de Claude no enseña ni gráfico ni operación.
  function abrirDia(fe) {
    const d = diasVista[fe]
    if (!d) return
    const f = fuenteVista, fecha = new Date(`${fe}T12:00:00`)
    const titulo = `${DIAS[fecha.getDay()]} ${fecha.getDate()} ${cap(MES_CORTO[fecha.getMonth()])} ${fecha.getFullYear()} · ${f.nombre}`
    const bloque = (lbl, txt, tono = '') =>
      `<div class="dv-block ${tono}"><div class="dv-lbl">${lbl}</div><div class="dv-txt"><p>${esc(txt).replace(/\n/g, '<br>')}</p></div></div>`
    const celda = (lab, val) => `<div class="mh-stat"><label>${lab}</label>${val}</div>`

    if (d.estado === 'bloqueado') {
      Modal.openFuente({ titulo, cuerpo: bloque('Día sin registrar', 'Registra tu día para ver lo que marcó el motor.', 'gry') })
      return
    }

    const ETIQ = { target: ['TARGET', 'r-t', 'tone-t'], stop: ['STOP', 'r-s', 'tone-s'], mixed: ['MIXTO', 'r-o', 'tone-o'],
                   be: ['B.E.', 'r-o', 'tone-o'], 'no-opero': ['NO OPERÓ', 'r-o', 'tone-o'],
                   'sin-op': ['SIN OPERACIÓN', 'r-o', 'tone-o'], error: ['ERROR', 'r-o', 'tone-o'] }
    const [txt, rb, tono] = ETIQ[d.estado] || ETIQ['sin-op']
    const celdas = [celda('Resultado', `<span class="cz-rb ${rb}">${txt}</span>`)]
    if (d.ops.length) {
      const p = ptsDe(d), usd = pnlDe(d)
      celdas.push(celda('Puntos', `<span class="mh-val ${p < 0 ? 'neg' : 'pos'}">${fmtPts(p)}</span>`))
      celdas.push(celda(f.calc ? 'P&amp;L calc.' : 'P&amp;L', `<span class="mh-val ${usd < 0 ? 'neg' : 'pos'}">${fmtDinero(usd)}</span>`))
      const o = d.ops[0]
      const setup = [o.setup, o.dir && !/alcista|bajista/i.test(o.setup) ? o.dir.toLowerCase() : ''].filter(Boolean).join(' ')
      if (setup) celdas.push(`<div class="mh-stat mh-stat-setup"><label>Setup</label><span class="mh-setup">${esc(setup)}${o.hora ? ` · ${esc(o.hora)}` : ''}</span></div>`)
    }

    let cuerpo = ''
    if (!d.ops.length && d.nota) cuerpo += bloque(d.estado === 'no-opero' ? 'Por qué no operó' : 'Sin operación', d.nota, 'gry')
    d.ops.forEach((o, i) => {
      const lineas = [
        d.ops.length > 1 ? `${o.setup}${o.hora ? ` · ${o.hora}` : ''} — ${fmtPts(o.puntos)} pts · ${fmtDinero(o.pnl)}` : '',
        o.obs,
      ].filter(Boolean).join('\n')
      if (lineas) cuerpo += bloque(d.ops.length > 1 ? `Operación ${i + 1}` : 'Observaciones', lineas, o.res === 'stop' ? 'red' : '')
    })
    ;(d.textos || []).forEach(([lbl, t]) => { cuerpo += bloque(lbl, t, 'blu') })
    if (d.ops.length && d.nota) cuerpo += bloque('Notas', d.nota, 'blu')

    Modal.openFuente({ titulo, stats: `<div class="mh-box ${tono}">${celdas.join('')}</div>`, imagen: d.url, cuerpo })
  }

  function tipEl() {
    let el = $('calTipFuente')
    if (!el) {
      el = document.createElement('div')
      el.id = 'calTipFuente'
      el.className = 'cal-tip'
      el.setAttribute('role', 'tooltip')
      document.body.appendChild(el)
      window.addEventListener('scroll', ocultarTip, { passive: true, capture: true })
    }
    return el
  }

  function mostrarTip(cell) {
    const html = tipHtml(cell.dataset.date)
    if (!html) return
    const el = tipEl()
    el.innerHTML = html
    el.classList.add('visible')
    const r = cell.getBoundingClientRect()
    const w = el.offsetWidth, h = el.offsetHeight, mg = 8
    let x = Math.max(mg, Math.min(r.left + r.width / 2 - w / 2, window.innerWidth - w - mg))
    let y = r.top - h - 8
    if (y < mg) y = r.bottom + 8
    el.style.left = `${Math.round(x)}px`
    el.style.top  = `${Math.round(y)}px`
  }

  function ocultarTip() {
    $('calTipFuente')?.classList.remove('visible')
  }

  // ── API ──────────────────────────────────────────────────────────────────
  async function init() {
    mostrar('hub')
    await renderHub()
  }

  // Al volver a la sección: siempre la principal, con datos frescos (el motor
  // sube el día solo y Chaumer puede haberse cargado mientras tanto).
  function alEntrar() {
    cargarFuentes()
    abrir('hub')
  }

  function alCambiarMes() {
    contexto()
    if (vista === 'hub') renderHub()
    else if (vista !== 'mio') renderFuente(vista)
  }

  return { init, alEntrar, alCambiarMes, vista: () => vista }
})()
