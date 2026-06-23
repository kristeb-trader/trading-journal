// ── Apex Tracker — seguimiento de pruebas de fondeo ─────────────────────────
// Cards por cuenta: balance/threshold/espacio, progreso a target, hitos,
// historial diario, registro de días y gestión de cuentas.
const Apex = (() => {
  let cuentas   = []
  let registros = []   // apex_registros manuales, orden fecha asc
  let trades    = []   // apex_trades (auto-export NT8 de cuentas de evaluación)
  let mainTrades = []  // tabla `trades` (journal): de aquí derivan los días de la PA
  let seriesPorCuenta = {}  // cuentaId → serie de días combinada (manual + derivada)
  let tradesPorCuenta = {}  // cuentaId → trades individuales de esa cuenta

  const ESTADOS = {
    evaluacion:   { label: 'Evaluación',       cls: 'ax-ev' },
    recuperacion: { label: 'En recuperación',  cls: 'ax-rec' },
    critico:      { label: 'Crítico',          cls: 'ax-crit' },
    safety_net:   { label: 'Safety net',       cls: 'ax-safe' },
    aprobada:     { label: 'Aprobada',         cls: 'ax-ok' },
    pa:           { label: 'PA (fondeada)',    cls: 'ax-ok' },
    quemada:      { label: 'Quemada',          cls: 'ax-dead' },
  }

  // Estado DERIVADO del balance (lo que se muestra). pa/aprobada/quemada son
  // terminales y se respetan tal cual (manuales); el resto se calcula en vivo.
  function estadoView(cta, s) {
    if (['pa', 'aprobada', 'quemada'].includes(cta.estado)) return ESTADOS[cta.estado] || ESTADOS.evaluacion
    const safety = cta.safety_net_balance != null ? parseFloat(cta.safety_net_balance) : null
    const f2 = s.inicial + 0.25 * parseFloat(cta.profit_target)
    if (s.espacio <= 0)                 return { label: 'En riesgo',         cls: 'ax-crit' }
    if (s.balance >= s.targetBal)       return { label: 'Target alcanzado',  cls: 'ax-ok'   }
    if (safety && s.balance >= safety)  return { label: 'Safety net',        cls: 'ax-safe' }
    if (s.balance >= f2)                return { label: 'Acelerar',          cls: 'ax-rec'  }
    if (s.balance >= s.inicial)         return { label: 'En marcha',         cls: 'ax-ev'   }
    return { label: 'En recuperación', cls: 'ax-rec' }
  }

  const fmt$ = (v, dec = 0) => {
    const n = parseFloat(v) || 0
    const s = Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec })
    return `${n < 0 ? '−' : ''}$${s}`
  }

  // ── Plan para pasar: perfiles de riesgo y ritmos (configurables en vivo) ──
  const PLAN_PERFILES = {
    conservador: { label: 'Conservador', trade: 0.08, dia: 0.24 },
    moderado:    { label: 'Moderado',    trade: 0.10, dia: 0.30 },
    agresivo:    { label: 'Agresivo',    trade: 0.15, dia: 0.45 },
  }
  const PLAN_RITMOS = {
    lento:       { label: 'Sin prisa',   dias: 20 },
    equilibrado: { label: 'Equilibrado', dias: 12 },
    rapido:      { label: 'Rápido',      dias: 7 },
  }
  const VP_MNQ = 2  // $ por punto MNQ

  function getPlanCfg(cuentaId) {
    const cta = cuentas.find(c => c.id === cuentaId)
    const perfil = cta && PLAN_PERFILES[cta.plan_perfil] ? cta.plan_perfil : 'moderado'
    const ritmo  = cta && PLAN_RITMOS[cta.plan_ritmo]   ? cta.plan_ritmo   : 'equilibrado'
    return { perfil, ritmo }
  }
  function setPlanCfg(cuentaId, cfg) {
    // Actualiza memoria al instante (render síncrono) y persiste en BD en background
    const cta = cuentas.find(c => c.id === cuentaId)
    if (cta) { cta.plan_perfil = cfg.perfil; cta.plan_ritmo = cfg.ritmo }
    DB.saveApexPlan(cuentaId, cfg.perfil, cfg.ritmo).catch(() => { /* tabla sin columnas aún */ })
  }

  // Stop de referencia en $/contrato MNQ, derivado de los stops reales (o default)
  function stopRefMNQ(cta) {
    const ts = tradesDe(cta.id).filter(t => t.resultado === 'stop' && parseFloat(t.profit) < 0)
    const vals = ts.map(t => {
      const base = (t.instrument || '').split(' ')[0]
      const vp = base === 'NQ' ? 20 : 2
      const qty = parseInt(t.qty) || 1
      const puntos = Math.abs(parseFloat(t.profit)) / (vp * qty)
      return puntos * VP_MNQ
    }).filter(v => v > 0)
    if (!vals.length) return 40  // ~20 pts MNQ por defecto
    return Math.max(10, Math.round(vals.reduce((a, b) => a + b, 0) / vals.length))
  }

  // Calcula el plan del día según el estado de la cuenta y la config (perfil+ritmo)
  function calcPlan(cta, s, cfg) {
    const perfil = PLAN_PERFILES[cfg.perfil] || PLAN_PERFILES.moderado
    const ritmo  = PLAN_RITMOS[cfg.ritmo]   || PLAN_RITMOS.equilibrado
    const colchon = s.espacio
    const stopRef = stopRefMNQ(cta)
    const maxApex = cta.contratos_max || null

    const riesgoTrade = colchon > 0 ? colchon * perfil.trade : 0
    const perdidaDia  = colchon > 0 ? colchon * perfil.dia : 0

    let contratos = stopRef > 0 ? Math.floor(riesgoTrade / stopRef) : 0
    contratos = Math.max(colchon > 0 ? 1 : 0, contratos)
    if (maxApex) contratos = Math.min(contratos, maxApex)

    const faltan = Math.max(0, s.targetBal - s.balance)
    const horizonte = Math.max(ritmo.dias, cta.min_dias || 0)
    const diasRest = Math.max(1, horizonte - s.diasOperados)
    const metaDia = faltan / diasRest

    const colchonParaN = n => n * stopRef / perfil.trade
    const topeEscalon = maxApex || (contratos + 4)
    const escalones = []
    for (let n = 1; n <= topeEscalon; n++) {
      escalones.push({ n, balance: s.threshold + colchonParaN(n), actual: n === contratos })
    }
    const subirA = contratos + 1
    const balSubir = s.threshold + colchonParaN(subirA)
    const balBajar = s.threshold + colchonParaN(contratos)  // si cae bajo esto → baja

    // Fase según balance
    const f2 = s.inicial + 0.25 * parseFloat(cta.profit_target)
    const f3 = cta.safety_net_balance != null ? parseFloat(cta.safety_net_balance) : s.targetBal
    let fase, faseLabel, faseDesc
    if (s.balance >= f3) {
      fase = 3; faseLabel = 'Cerrar seguro'
      faseDesc = `Piso congelado en ${fmt$(s.threshold)} y colchón de ${fmt$(colchon)}. Faltan ${fmt$(faltan)} para el target — empuje final con ${contratos} MNQ, sin avaricia.`
    } else if (s.balance >= f2) {
      fase = 2; faseLabel = 'Acelerar'
      faseDesc = `El piso ya sube contigo (${fmt$(s.threshold)}). Con ${fmt$(colchon)} de colchón puedes operar ${contratos} MNQ y apuntar a +${fmt$(metaDia)}/día (${fmt$(faltan)} al target).`
    } else {
      fase = 1; faseLabel = 'Construir colchón'
      faseDesc = `A ${fmt$(colchon)} del piso (${fmt$(s.threshold)}). Tamaño mínimo (${contratos} MNQ) hasta alejarte; sube a ${subirA} cuando llegues a ${fmt$(balSubir)}.`
    }

    return { perfil, ritmo, colchon, stopRef, riesgoTrade, perdidaDia, contratos, maxApex,
      metaDia, diasRest, faltan, escalones, subirA, balSubir, balBajar, fase, faseLabel, faseDesc }
  }

  // Lectura reactiva del último día operado: compara lo que hiciste contra el plan
  function planFeedback(cta, s, p) {
    const trades = tradesDe(cta.id).filter(t => t.trade_date)
    if (!trades.length) return ''
    const lastDate = trades.map(t => t.trade_date).sort().slice(-1)[0]
    const today = trades.filter(t => t.trade_date === lastDate)
    if (!today.length) return ''

    // Tamaño en MNQ-equivalente (1 NQ = 10 MNQ por el $/punto)
    const mnqEq = t => { const base = (t.instrument || '').split(' ')[0]; const vp = base === 'NQ' ? 20 : 2; return (parseInt(t.qty) || 1) * (vp / 2) }
    const maxSize    = Math.max(...today.map(mnqEq))
    const maxAdverse = Math.max(0, ...today.map(t => Math.abs(parseFloat(t.mae) || 0)))
    const pnlDia     = today.reduce((a, t) => a + (parseFloat(t.profit) || 0), 0)
    const sizeTxt    = maxSize % 1 ? maxSize.toFixed(1) : maxSize

    const rule = (txt, col, icon) => `<div class="ax-plan-rule" style="color:${col}"><i class="ti ${icon}"></i> ${txt}</div>`
    const out = []

    // Tamaño operado vs plan
    if (maxSize > p.contratos + 0.01)
      out.push(rule(`Hoy operaste hasta <b>${sizeTxt} MNQ-eq</b>, y el plan sugiere <b>${p.contratos}</b>. Estás sobre-dimensionado — baja el tamaño.`, 'var(--red)', 'ti-arrow-down-circle'))
    else
      out.push(rule(`Tamaño de hoy (máx <b>${sizeTxt} MNQ-eq</b>) dentro del plan (${p.contratos}).`, 'var(--accent)', 'ti-check'))

    // Riesgo por trade (excursión adversa real vs riesgo/trade del plan)
    if (p.riesgoTrade > 0 && maxAdverse > p.riesgoTrade * 1.25)
      out.push(rule(`Un trade llegó a <b>−${fmt$(maxAdverse)}</b> en contra (tu riesgo/trade: ${fmt$(p.riesgoTrade)}). Ajusta stop o tamaño.`, 'var(--warning)', 'ti-alert-triangle'))

    // Pérdida del día
    if (p.perdidaDia > 0 && pnlDia < -p.perdidaDia)
      out.push(rule(`El P&L de hoy (<b>${fmt$(pnlDia)}</b>) superó tu pérdida máx del día (${fmt$(p.perdidaDia)}). Para y revisa.`, 'var(--red)', 'ti-hand-stop'))

    // Ritmo vs meta del día
    if (p.metaDia > 0 && pnlDia >= p.metaDia)
      out.push(rule(`Hoy hiciste <b>+${fmt$(pnlDia)}</b> ≥ tu meta (${fmt$(p.metaDia)}). Asegura: baja tamaño o cierra el día.`, 'var(--accent)', 'ti-flag'))
    else if (pnlDia > 0)
      out.push(rule(`Vas <b>+${fmt$(pnlDia)}</b> hoy; faltan ${fmt$(Math.max(0, p.metaDia - pnlDia))} para la meta del día.`, 'var(--text2)', 'ti-trending-up'))

    return `<div class="ax-plan-feedback"><div class="ax-plan-esc-title">Lectura de hoy (${lastDate})</div>${out.join('')}</div>`
  }

  function planPanelHtml(cta, s, cfg) {
    const p = calcPlan(cta, s, cfg)
    const opt = (obj, cur) => Object.entries(obj).map(([k, v]) =>
      `<option value="${k}" ${k === cur ? 'selected' : ''}>${v.label}</option>`).join('')
    const faseCls = p.fase === 3 ? 'ax-ok' : p.fase === 2 ? 'ax-rec' : 'ax-ev'
    const noColchon = p.colchon <= 0

    const kpis = noColchon ? '' : `
      <div class="ax-plan-kpis">
        <div class="ax-plan-kpi"><div class="ax-plan-klabel">Opera máx</div><div class="ax-plan-kval">${p.contratos} MNQ</div></div>
        <div class="ax-plan-kpi"><div class="ax-plan-klabel">Riesgo / trade</div><div class="ax-plan-kval">${fmt$(p.riesgoTrade)}</div></div>
        <div class="ax-plan-kpi"><div class="ax-plan-klabel">Meta del día</div><div class="ax-plan-kval" style="color:var(--accent)">+${fmt$(p.metaDia)}</div></div>
        <div class="ax-plan-kpi"><div class="ax-plan-klabel">Pérdida máx día</div><div class="ax-plan-kval" style="color:var(--red)">${fmt$(p.perdidaDia)}</div></div>
      </div>`

    const reglas = noColchon
      ? `<div class="ax-plan-rule" style="color:var(--red)"><i class="ti ti-alert-octagon"></i> Sin colchón: no operar hasta verificar el estado real de la cuenta.</div>`
      : `
        <div class="ax-plan-rule"><i class="ti ti-arrow-up-circle" style="color:var(--accent)"></i> Sube a <b>${p.subirA} MNQ</b> cuando el balance llegue a <b>${fmt$(p.balSubir)}</b></div>
        ${p.contratos > 1 ? `<div class="ax-plan-rule"><i class="ti ti-arrow-down-circle" style="color:var(--red)"></i> Baja a <b>${p.contratos - 1} MNQ</b> si el balance cae bajo <b>${fmt$(p.balBajar)}</b></div>` : ''}
        <div class="ax-plan-rule"><i class="ti ti-flag" style="color:var(--warning)"></i> Al ganar <b>+${fmt$(p.metaDia)}</b> hoy → baja tamaño o cierra el día. No devuelvas la meta</div>`

    const maxN = p.escalones.length
    const escHtml = p.escalones.map((e, i) => {
      const h = 16 + (maxN > 1 ? (i / (maxN - 1)) * 34 : 0)
      return `<div class="ax-esc ${e.actual ? 'esc-actual' : ''}">
        <div class="ax-esc-bar" style="height:${h}px"></div>
        <span class="ax-esc-lbl">${e.actual ? '●hoy ' : ''}${e.n}<br>${(e.balance / 1000).toFixed(1)}k</span></div>`
    }).join('')

    return `
      <div class="ax-plan-head">
        <div class="ax-plan-title"><i class="ti ti-map-2" style="color:var(--accent)"></i> Plan para pasar — hoy
          <span class="ax-badge ${faseCls}">Fase ${p.fase} · ${p.faseLabel}</span></div>
        <div class="ax-plan-selects">
          <select id="planPerfil" title="Perfil de riesgo">${opt(PLAN_PERFILES, cfg.perfil)}</select>
          <select id="planRitmo" title="Ritmo">${opt(PLAN_RITMOS, cfg.ritmo)}</select>
        </div>
      </div>
      <p class="ax-plan-desc">${p.faseDesc} <span style="color:var(--text3)">· stop ref ${fmt$(p.stopRef)}/MNQ · ${p.diasRest} días al ritmo ${p.ritmo.label.toLowerCase()}</span></p>
      ${kpis}
      <div class="ax-plan-rules">${reglas}</div>
      ${noColchon ? '' : planFeedback(cta, s, p)}
      ${noColchon ? '' : `<div class="ax-plan-esc-wrap"><div class="ax-plan-esc-title">Escalones de contratos hacia ${fmt$(s.targetBal)}</div><div class="ax-plan-esc">${escHtml}</div></div>`}`
  }

  function wirePlanPanel(cta, s) {
    const reRender = () => {
      const cfg = {
        perfil: document.getElementById('planPerfil').value,
        ritmo:  document.getElementById('planRitmo').value,
      }
      setPlanCfg(cta.id, cfg)
      const panel = document.getElementById('apexPlanPanel')
      panel.innerHTML = planPanelHtml(cta, s, cfg)
      wirePlanPanel(cta, s)
    }
    document.getElementById('planPerfil')?.addEventListener('change', reRender)
    document.getElementById('planRitmo')?.addEventListener('change', reRender)
  }

  function regsDe(cuentaId) {
    return seriesPorCuenta[cuentaId] || []
  }

  function tradesDe(cuentaId) {
    return tradesPorCuenta[cuentaId] || []
  }

  // Construye, por cuenta, la serie de días combinando los registros manuales
  // (apex_registros) con los derivados de los trades auto-exportados (apex_trades).
  // Recalcula balance y threshold trailing (HWM desde MFE) sobre la serie unificada.
  function buildSeries() {
    seriesPorCuenta = {}
    tradesPorCuenta = {}

    cuentas.forEach(cta => {
      const dd     = parseFloat(cta.drawdown_max)
      const inicial = parseFloat(cta.balance_inicial)
      const safety = cta.safety_net_balance != null ? parseFloat(cta.safety_net_balance) : null
      const piso   = cta.piso_congelado    != null ? parseFloat(cta.piso_congelado)    : null

      // Trades de esta cuenta (match por número de cuenta = AccountName de NT).
      // La PA real vive en la tabla `trades` (journal); las cuentas de
      // evaluación viven en `apex_trades`. Como cada cuenta solo existe en una
      // de las dos tablas, concatenar ambas fuentes nunca duplica.
      const ctaTrades = [...trades, ...mainTrades].filter(t => t.account === cta.numero_cuenta)
      tradesPorCuenta[cta.id] = ctaTrades

      // Días auto: agrupar trades por fecha
      const autoPorFecha = {}
      ctaTrades.forEach(t => {
        const f = t.trade_date
        if (!autoPorFecha[f]) autoPorFecha[f] = []
        autoPorFecha[f].push(t)
      })

      // Días manuales: por fecha
      const manualPorFecha = {}
      registros.filter(r => r.cuenta_id === cta.id).forEach(r => { manualPorFecha[r.fecha] = r })

      // Unión de fechas, orden cronológico
      const fechas = [...new Set([...Object.keys(autoPorFecha), ...Object.keys(manualPorFecha)])].sort()

      let balanceAnt = inicial
      let hwm = inicial
      const serie = fechas.map(fecha => {
        const man = manualPorFecha[fecha]
        const dayTrades = autoPorFecha[fecha] || []

        if (man) {
          // Día manual: respetar sus valores guardados (verdad ajustada a Rithmic).
          // Recuperar el HWM implícito del threshold guardado.
          const bal = parseFloat(man.balance)
          const thr = parseFloat(man.threshold)
          hwm = Math.max(hwm, thr + dd)
          balanceAnt = bal
          return {
            id: man.id, cuenta_id: cta.id, fecha,
            pnl_dia: parseFloat(man.pnl_dia), balance: bal, threshold: thr,
            contratos: man.contratos, nota: man.nota || '', _auto: false,
            trades: dayTrades,
          }
        }

        // Día derivado de los trades auto
        const pnl = dayTrades.reduce((s, t) => s + (parseFloat(t.profit) || 0), 0)
        // HWM intradía: recorrer trades en orden sumando, considerando el MFE de cada uno
        let run = balanceAnt
        dayTrades.forEach(t => {
          const peak = run + (parseFloat(t.mfe) || 0)
          if (peak > hwm) hwm = peak
          run += parseFloat(t.profit) || 0
        })
        const balance = Math.round((balanceAnt + pnl) * 100) / 100
        balanceAnt = balance
        // Threshold trailing: congelado en piso si el HWM tocó el safety net
        let thr
        if (safety != null && piso != null && hwm >= safety) thr = piso
        else { thr = hwm - dd; if (piso != null) thr = Math.min(thr, piso) }
        thr = Math.round(thr * 100) / 100
        const maxQty = dayTrades.reduce((m, t) => Math.max(m, parseInt(t.qty) || 0), 0)
        const instrs = [...new Set(dayTrades.map(t => (t.instrument || '').split(' ')[0]))].filter(Boolean)
        return {
          id: null, cuenta_id: cta.id, fecha,
          pnl_dia: pnl, balance, threshold: thr,
          contratos: maxQty || null,
          nota: `${dayTrades.length} trade${dayTrades.length !== 1 ? 's' : ''}${instrs.length ? ' · ' + instrs.join('/') : ''}`,
          _auto: true, trades: dayTrades,
        }
      })

      seriesPorCuenta[cta.id] = serie
    })
  }

  // Estado calculado de una cuenta a partir de su último registro
  function calc(cta) {
    const regs = regsDe(cta.id)
    const last = regs.length ? regs[regs.length - 1] : null
    const balance   = last ? parseFloat(last.balance)   : parseFloat(cta.balance_inicial)
    const threshold = last ? parseFloat(last.threshold) : parseFloat(cta.balance_inicial) - parseFloat(cta.drawdown_max)
    const espacio   = balance - threshold
    const inicial   = parseFloat(cta.balance_inicial)
    const targetBal = inicial + parseFloat(cta.profit_target)
    const maxBal    = regs.length ? Math.max(...regs.map(r => parseFloat(r.balance))) : balance

    // Días operados: registros con P&L distinto de 0 (excluye el snapshot inicial)
    const diasOperados = regs.filter(r => parseFloat(r.pnl_dia) !== 0).length
    const wins   = regs.filter(r => parseFloat(r.pnl_dia) > 0)
    const losses = regs.filter(r => parseFloat(r.pnl_dia) < 0)
    const avgWin = wins.length ? wins.reduce((s, r) => s + parseFloat(r.pnl_dia), 0) / wins.length : null

    // Riesgo según espacio disponible vs drawdown
    const ratio = espacio / parseFloat(cta.drawdown_max)
    const riesgo = espacio <= 0 ? 'critico' : ratio < 0.25 ? 'alto' : ratio < 0.5 ? 'medio' : 'bajo'

    // Stop máximo sugerido: nunca arriesgar más de ⅓ del espacio
    const stopMax = espacio > 0 ? espacio / 3 : 0

    // Hitos
    const safetyNet = cta.safety_net_balance != null ? parseFloat(cta.safety_net_balance) : null
    const hitos = [
      { label: `Breakeven ${fmt$(inicial)}`, valor: inicial },
      ...(safetyNet ? [{ label: `Safety net ${fmt$(safetyNet)}`, valor: safetyNet }] : []),
      { label: `Target ${fmt$(targetBal)}`, valor: targetBal },
    ].map(h => ({ ...h, alcanzado: maxBal >= h.valor }))
    const siguiente = hitos.find(h => !h.alcanzado)

    // Proyección: días estimados al siguiente hito al ritmo medio de días ganadores
    let proyeccion = null
    if (siguiente && avgWin > 0) proyeccion = Math.ceil((siguiente.valor - balance) / avgWin)

    const progreso = Math.max(0, Math.min(100, (balance - inicial) / parseFloat(cta.profit_target) * 100))

    // P&L total acumulado
    const pnlTotal = balance - inicial

    // Drawdown usado: cuánto del colchón total ya se consumió (sobre el máximo alcanzado)
    const ddMax = parseFloat(cta.drawdown_max)
    const drawdownUsado = Math.max(0, ddMax - espacio)

    // Regla de consistencia (Apex PA): el mejor día no debe superar el 30% de las
    // ganancias brutas acumuladas. consistencia = mejorDía / sumaGanancias × 100
    const gananciasBrutas = wins.reduce((s, r) => s + parseFloat(r.pnl_dia), 0)
    const mejorDia = wins.length ? Math.max(...wins.map(r => parseFloat(r.pnl_dia))) : 0
    const consistencia = gananciasBrutas > 0 ? Math.round(mejorDia / gananciasBrutas * 100) : null
    const consistenciaOk = consistencia == null || consistencia <= 30

    return { regs, last, balance, threshold, espacio, inicial, targetBal, maxBal,
      diasOperados, wins: wins.length, losses: losses.length, avgWin, riesgo,
      stopMax, hitos, siguiente, proyeccion, progreso, pnlTotal,
      ddMax, drawdownUsado, gananciasBrutas, mejorDia, consistencia, consistenciaOk }
  }

  // Sugerencia de threshold para un nuevo registro (trail + congelamiento)
  function sugerirThreshold(cta, nuevoBalance) {
    const regs = regsDe(cta.id)
    const prevThr = regs.length
      ? parseFloat(regs[regs.length - 1].threshold)
      : parseFloat(cta.balance_inicial) - parseFloat(cta.drawdown_max)
    const maxBal = Math.max(nuevoBalance, ...(regs.length ? regs.map(r => parseFloat(r.balance)) : [0]))
    const safety = cta.safety_net_balance != null ? parseFloat(cta.safety_net_balance) : null
    const piso   = cta.piso_congelado    != null ? parseFloat(cta.piso_congelado)    : null
    if (safety != null && piso != null && maxBal >= safety) return piso
    let sug = Math.max(prevThr, nuevoBalance - parseFloat(cta.drawdown_max))
    if (piso != null) sug = Math.min(sug, piso)
    return Math.round(sug * 100) / 100
  }

  // ── Render ────────────────────────────────────────────────────────────────

  function renderKpis() {
    const activas = cuentas.filter(c => c.activa && !['aprobada', 'pa', 'quemada'].includes(c.estado))
    const enRiesgo = activas.filter(c => { const s = calc(c); return s.riesgo === 'critico' || s.riesgo === 'alto' }).length
    const pnlComb = activas.reduce((s, c) => s + (calc(c).balance - parseFloat(c.balance_inicial)), 0)
    const aprobadas = cuentas.filter(c => ['aprobada', 'pa'].includes(c.estado)).length

    const kpis = [
      { label: 'Cuentas activas',  value: activas.length, color: 'var(--text)' },
      { label: 'En riesgo',        value: enRiesgo,  color: enRiesgo > 0 ? 'var(--red)' : 'var(--text3)' },
      { label: 'P&L combinado',    value: fmt$(pnlComb), color: pnlComb >= 0 ? 'var(--accent)' : 'var(--red)' },
      { label: 'Aprobadas / PA',   value: aprobadas, color: aprobadas > 0 ? 'var(--accent)' : 'var(--text3)' },
    ]
    document.getElementById('apexKpis').innerHTML = kpis.map(k => `
      <div class="expd-kpi">
        <div class="expd-kpi-label">${k.label}</div>
        <div class="expd-kpi-value" style="color:${k.color}">${k.value}</div>
      </div>`).join('')
  }

  function renderCuentas() {
    const wrap = document.getElementById('apexCuentas')
    if (!cuentas.length) {
      wrap.innerHTML = '<p class="expd-empty">Sin cuentas registradas. Crea la primera con "Nueva cuenta".</p>'
      return
    }

    const ordenadas = [...cuentas].sort((a, b) => (b.activa - a.activa) || a.nombre.localeCompare(b.nombre))

    const cardHtml = cta => {
      const s = calc(cta)
      const est = estadoView(cta, s)
      const espColor = s.espacio <= 0 ? 'var(--red)' : s.riesgo === 'alto' ? 'var(--red)' : s.riesgo === 'medio' ? 'var(--warning)' : 'var(--accent)'
      const bordeCls = !cta.activa ? '' : s.riesgo === 'critico' ? 'ax-borde-crit' : s.riesgo === 'alto' ? 'ax-borde-crit' : s.riesgo === 'medio' ? 'ax-borde-warn' : 'ax-borde-ok'

      const alerta = s.espacio <= 0 && cta.activa && !['aprobada', 'pa', 'quemada'].includes(cta.estado) ? `
        <div class="ax-alerta">
          <i class="ti ti-alert-octagon"></i>
          Balance (${fmt$(s.balance)}) por debajo del threshold (${fmt$(s.threshold)}) — verificar estado real en Rithmic antes de operar
        </div>` : ''

      const esPACta = ['pa', 'aprobada'].includes(cta.estado)
      const quemada = cta.estado === 'quemada'
      const faltan = s.targetBal - s.balance
      const pnlColor = s.pnlTotal >= 0 ? 'var(--accent)' : 'var(--red)'

      const progLabel = esPACta ? 'Progreso al retiro' : 'Progreso al target'
      const progRight = quemada ? 'Cuenta quemada'
        : faltan > 0 ? `faltan ${fmt$(faltan)}` : '🎯 Alcanzado'

      return `
        <div class="axm-card ${bordeCls} ${cta.activa ? '' : 'ax-inactiva'}">
          <div class="axm-top">
            <div class="axm-id">
              <span class="axm-nombre">${cta.nombre}</span>
              <span class="ax-badge ${est.cls}">${est.label}</span>
            </div>
            <button class="btn-icon ax-edit" data-id="${cta.id}" title="Editar cuenta"><i class="ti ti-pencil"></i></button>
          </div>
          ${alerta}
          <div class="axm-balance">
            <span class="axm-balance-label">Balance</span>
            <span class="axm-balance-val">${fmt$(s.balance)}</span>
          </div>
          <div class="axm-metrics">
            <div class="axm-metric">
              <span class="axm-m-label">Colchón al piso</span>
              <span class="axm-m-val" style="color:${espColor}">${fmt$(s.espacio)}</span>
            </div>
            <div class="axm-metric">
              <span class="axm-m-label">P&L total</span>
              <span class="axm-m-val" style="color:${pnlColor}">${s.pnlTotal >= 0 ? '+' : ''}${fmt$(Math.abs(s.pnlTotal))}</span>
            </div>
          </div>
          <div class="axm-prog-head"><span>${progLabel}</span><span>${progRight}</span></div>
          <div class="ax-prog"><div style="width:${quemada ? 0 : (s.progreso ?? 0)}%;${quemada ? 'background:var(--red)' : ''}"></div></div>
          <button class="btn-primary ax-ver-detalle axm-btn" data-id="${cta.id}"><i class="ti ti-chart-area-line"></i> Ver detalle</button>
        </div>`
    }

    // Dos zonas en bloques separados: PA (fondeadas) arriba, evaluación abajo.
    // El contador muestra las cuentas ACTIVAS de la zona.
    const esPA = c => ['pa', 'aprobada'].includes(c.estado)
    const activa = c => c.activa && c.estado !== 'quemada'
    const paAccts  = ordenadas.filter(esPA)
    const evalAccts = ordenadas.filter(c => !esPA(c))
    const zona = (titulo, icon, accts) => accts.length ? `
      <div class="ax-zona-block">
        <div class="ax-zona-title"><i class="ti ${icon}"></i> ${titulo}
          <span class="ax-zona-count">${accts.filter(activa).length} activas</span></div>
        <div class="axm-grid">${accts.map(cardHtml).join('')}</div>
      </div>` : ''
    wrap.innerHTML =
      zona('Cuentas PA (fondeadas)', 'ti-trophy', paAccts) +
      zona('Cuentas de evaluación', 'ti-target', evalAccts)

    // Wire de acciones
    wrap.querySelectorAll('.ax-ver-detalle').forEach(btn => {
      btn.addEventListener('click', () => openDetalle(parseInt(btn.dataset.id)))
    })
    wrap.querySelectorAll('.ax-edit').forEach(btn => {
      btn.addEventListener('click', () => openCuentaModal(parseInt(btn.dataset.id)))
    })
    wrap.querySelectorAll('.ax-del-reg').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('¿Eliminar este registro diario?')) return
        try {
          await DB.deleteApexRegistro(parseInt(btn.dataset.id))
          await reload()
          Toast.show('Registro eliminado', 'success')
        } catch (e) { Toast.show('Error al eliminar: ' + e.message, 'error') }
      })
    })
  }

  function render() {
    renderKpis()
    renderCuentas()
  }

  // ── Vista de detalle de una cuenta ─────────────────────────────────────────

  let detalleChart = null
  let detalleCuentaId = null

  function volverLista() {
    if (detalleChart) { detalleChart.destroy(); detalleChart = null }
    detalleCuentaId = null
    document.getElementById('apexDetalle').classList.add('hidden')
    document.getElementById('apexLista').classList.remove('hidden')
  }

  function openDetalle(cuentaId) {
    const cta = cuentas.find(c => c.id === cuentaId)
    if (!cta) return
    detalleCuentaId = cuentaId
    const s = calc(cta)
    const planCfg = getPlanCfg(cta.id)
    const est = estadoView(cta, s)
    const esPACuenta = ['pa', 'aprobada'].includes(cta.estado)

    // KPIs
    const consColor = s.consistencia == null ? 'var(--text3)' : s.consistenciaOk ? 'var(--accent)' : 'var(--red)'
    const espColor = s.espacio <= 0 ? 'var(--red)' : s.riesgo === 'alto' ? 'var(--red)' : s.riesgo === 'medio' ? 'var(--warning)' : 'var(--accent)'
    const kpis = [
      { l: 'Balance', v: fmt$(s.balance), c: 'var(--text)' },
      { l: 'Piso (threshold)', v: fmt$(s.threshold), c: 'var(--text)' },
      { l: 'Espacio al piso', v: fmt$(s.espacio), c: espColor },
      { l: 'P&L total', v: fmt$(s.pnlTotal), c: s.pnlTotal >= 0 ? 'var(--accent)' : 'var(--red)' },
      { l: 'Días operados', v: `${s.diasOperados} / ${cta.min_dias || '—'}`, c: 'var(--text)' },
      { l: 'Consistencia', v: s.consistencia != null ? `${s.consistencia}%` : '—', c: consColor },
    ]

    // Barra MLL → Target con marcadores
    const piso = s.threshold, ini = s.inicial, tgt = s.targetBal
    const rango = tgt - piso
    const posInicio = Math.max(0, Math.min(100, (ini - piso) / rango * 100))
    const posBalance = Math.max(0, Math.min(100, (s.balance - piso) / rango * 100))
    const faltan = tgt - s.balance

    // Paneles
    const ddPct = Math.round(s.drawdownUsado / s.ddMax * 100)
    const espPctDD = Math.round(s.espacio / s.ddMax * 100)
    const minRestantes = cta.min_dias ? Math.max(0, cta.min_dias - s.diasOperados) : null

    const paraPasar = [
      faltan > 0 ? `Faltan <b>${fmt$(faltan)}</b> para el target` : `<b style="color:var(--accent)">🎯 Target alcanzado</b>`,
      minRestantes != null ? `Días mínimos: <b>${s.diasOperados} de ${cta.min_dias}</b>${minRestantes > 0 ? ` (faltan ${minRestantes})` : ' ✓'}` : null,
      s.avgWin ? `Ritmo de día ganador: <b>${fmt$(s.avgWin)}</b>` : 'Aún sin días ganadores',
      (s.proyeccion != null && s.proyeccion > 0) ? `Proyección: <b style="color:var(--accent)">~${s.proyeccion} días</b> al target` : null,
    ].filter(Boolean)

    const riesgo = [
      `Espacio al piso: <b style="color:${espColor}">${fmt$(s.espacio)}</b> (${espPctDD}% del DD)`,
      `Drawdown usado: <b>${fmt$(s.drawdownUsado)} de ${fmt$(s.ddMax)}</b> (${ddPct}%)`,
      `Stop máx hoy: <b>${s.stopMax > 0 ? fmt$(s.stopMax) : 'No operar'}</b> (⅓ del colchón)`,
      s.consistencia != null
        ? `Consistencia: <b style="color:${consColor}">${s.consistencia}%</b> (límite 30%)${!s.consistenciaOk ? ' ⚠️' : ''}`
        : `Consistencia: <span style="color:var(--text3)">sin días ganadores aún</span>`,
    ]

    // Historial (con espacio del día)
    const histRows = [...s.regs].reverse().map(r => {
      const esp = parseFloat(r.balance) - parseFloat(r.threshold)
      const espC = esp <= 0 ? 'var(--red)' : esp < s.ddMax * 0.25 ? 'var(--red)' : esp < s.ddMax * 0.5 ? 'var(--warning)' : 'var(--accent)'
      const pnl = parseFloat(r.pnl_dia)
      return `<tr>
        <td>${r.fecha}</td>
        <td style="color:${pnl > 0 ? 'var(--accent)' : pnl < 0 ? 'var(--red)' : 'var(--text3)'}">${fmt$(pnl, 2)}</td>
        <td>${fmt$(r.balance, 2)}</td>
        <td>${fmt$(r.threshold, 2)}</td>
        <td style="color:${espC}">${fmt$(esp, 0)}</td>
        <td>${r.contratos ?? '—'}</td>
        <td class="ax-hist-nota">${r.nota || ''}</td>
      </tr>`
    }).join('')

    // ── Trading History trade-por-trade + métricas (desde apex_trades) ──
    const ctaTrades = tradesDe(cta.id)
    let tradingHtml = ''
    if (ctaTrades.length) {
      const profits = ctaTrades.map(t => parseFloat(t.profit) || 0)
      const wins = profits.filter(p => p > 0), losses = profits.filter(p => p < 0)
      const grossWin = wins.reduce((a, b) => a + b, 0)
      const grossLoss = Math.abs(losses.reduce((a, b) => a + b, 0))
      const winRate = (wins.length + losses.length) ? Math.round(wins.length / (wins.length + losses.length) * 100) : 0
      const pf = grossLoss > 0 ? (grossWin / grossLoss) : (grossWin > 0 ? Infinity : 0)
      const expectativa = ctaTrades.length ? profits.reduce((a, b) => a + b, 0) / ctaTrades.length : 0

      // Distribución por instrumento base (NQ full vs MNQ micro)
      const porInstr = {}
      ctaTrades.forEach(t => {
        const base = (t.instrument || '?').split(' ')[0]
        if (!porInstr[base]) porInstr[base] = { n: 0, pnl: 0 }
        porInstr[base].n++; porInstr[base].pnl += parseFloat(t.profit) || 0
      })
      const usaNQ = Object.keys(porInstr).some(k => k === 'NQ')
      const alertaNQ = usaNQ ? `
        <div class="ax-alerta" style="margin-bottom:10px">
          <i class="ti ti-alert-triangle"></i>
          Usaste contratos <b>NQ full size</b> (10× el riesgo del MNQ) en esta cuenta — el error que más rápido quema una evaluación.
        </div>` : ''

      // Alerta de contratos máximos: trades cuya posición (qty) supera el límite Apex
      const maxApex = cta.contratos_max || null
      const excedidos = maxApex ? ctaTrades.filter(t => (parseInt(t.qty) || 0) > maxApex) : []
      const alertaCtos = excedidos.length ? `
        <div class="ax-alerta" style="margin-bottom:10px">
          <i class="ti ti-alert-octagon"></i>
          <b>Contratos máximos (${maxApex}):</b> ${excedidos.length} trade${excedidos.length !== 1 ? 's' : ''} superó el límite — la mayor posición fue <b>${Math.max(...excedidos.map(t => parseInt(t.qty)))} contratos</b>. Exceder el máximo de Apex anula la cuenta.
        </div>` : ''

      const chips = [
        { l: 'Win rate', v: `${winRate}%`, c: winRate >= 50 ? 'var(--accent)' : 'var(--red)' },
        { l: 'Profit factor', v: pf === Infinity ? '∞' : pf.toFixed(2), c: pf >= 1.5 ? 'var(--accent)' : pf >= 1 ? 'var(--warning)' : 'var(--red)' },
        { l: 'Expectativa/trade', v: fmt$(expectativa, 1), c: expectativa >= 0 ? 'var(--accent)' : 'var(--red)' },
        { l: 'Trades', v: ctaTrades.length, c: 'var(--text)' },
      ]
      const distChips = Object.entries(porInstr).map(([k, v]) =>
        `<span class="ax-instr-chip ${k === 'NQ' ? 'ax-instr-nq' : ''}">${k}: <b>${v.n}</b> · <b style="color:${v.pnl >= 0 ? 'var(--accent)' : 'var(--red)'}">${fmt$(v.pnl, 0)}</b></span>`).join('')

      const tRows = [...ctaTrades].reverse().map(t => {
        const p = parseFloat(t.profit) || 0
        const base = (t.instrument || '?').split(' ')[0]
        const resCls = t.resultado === 'target' ? 'res-t' : t.resultado === 'stop' ? 'res-s' : ''
        const qtyExc = maxApex && (parseInt(t.qty) || 0) > maxApex
        return `<tr class="${qtyExc ? 'ax-row-exc' : ''}">
          <td>${t.trade_date}</td>
          <td>${(t.entry_time || '').slice(0, 5)}</td>
          <td><span class="ax-instr-tag ${base === 'NQ' ? 'ax-instr-nq' : ''}">${base}</span></td>
          <td>${t.market_pos || ''}</td>
          <td>${qtyExc ? `<b style="color:var(--red)">${t.qty} ⚠</b>` : (t.qty ?? '—')}</td>
          <td style="color:${p > 0 ? 'var(--accent)' : p < 0 ? 'var(--red)' : 'var(--text3)'}">${fmt$(p, 2)}</td>
          <td style="color:var(--red)">${t.mae != null ? fmt$(-Math.abs(t.mae), 0) : '—'}</td>
          <td style="color:var(--accent)">${t.mfe != null ? fmt$(Math.abs(t.mfe), 0) : '—'}</td>
          <td>${t.bars != null ? t.bars + ' min' : '—'}</td>
          <td class="${resCls}">${t.resultado || ''}</td>
        </tr>`
      }).join('')

      tradingHtml = `
        <div class="ax-det-trades-card">
          <div class="expd-matrix-title"><i class="ti ti-list-details"></i> Trading History <span class="expd-matrix-hint">${ctaTrades.length} trades auto-importados de NinjaTrader</span></div>
          ${alertaNQ}
          ${alertaCtos}
          <div class="ax-det-tmetrics">
            ${chips.map(c => `<div class="expd-kpi"><div class="expd-kpi-label">${c.l}</div><div class="expd-kpi-value" style="color:${c.c};font-size:1.2rem">${c.v}</div></div>`).join('')}
          </div>
          <div class="ax-instr-row">${distChips}</div>
          <div style="overflow-x:auto;margin-top:10px">
            <table class="ax-hist-table">
              <thead><tr><th>Fecha</th><th>Hora</th><th>Instr</th><th>Dir</th><th>Qty</th><th>P&L</th><th>MAE</th><th>MFE</th><th>Dur</th><th>Resultado</th></tr></thead>
              <tbody>${tRows}</tbody>
            </table>
          </div>
        </div>`
    }

    document.getElementById('apexDetalle').innerHTML = `
      <div class="ax-det-head">
        <button class="btn-icon" id="apexVolver" title="Volver"><i class="ti ti-arrow-left"></i></button>
        <div>
          <div class="ax-det-title"><span class="ax-nombre">${cta.nombre}</span><span class="ax-badge ${est.cls}">${est.label}</span></div>
          <div class="ax-numero">${cta.numero_cuenta || ''} · ${(parseFloat(cta.tamano) / 1000).toFixed(0)}K ${esPACuenta ? 'PA fondeada' : 'Intraday Trail'}</div>
        </div>
      </div>

      <div class="ax-det-kpis">
        ${kpis.map(k => `<div class="expd-kpi"><div class="expd-kpi-label">${k.l}</div><div class="expd-kpi-value" style="color:${k.c}">${k.v}</div></div>`).join('')}
      </div>

      <div class="ax-det-chart-card">
        <div class="ax-det-legend">
          <span style="color:var(--accent)">● Balance</span>
          <span style="color:var(--red)">● Piso (threshold)</span>
          <span style="color:var(--text3)">— Target</span>
        </div>
        <div style="height:240px"><canvas id="apexDetChart"></canvas></div>
      </div>

      <div class="ax-det-bar-card">
        <div class="ax-det-bar-head">
          <span style="color:var(--red)">${fmt$(piso)} piso</span>
          <span style="color:var(--text3)">${fmt$(ini)} inicio</span>
          <span style="color:var(--accent)">${fmt$(tgt)} target</span>
        </div>
        <div class="ax-det-bar">
          <div class="ax-det-bar-fill" style="width:${posBalance}%"></div>
          <div class="ax-det-bar-mark ax-mark-inicio" style="left:${posInicio}%" title="Inicio"></div>
          <div class="ax-det-bar-mark ax-mark-balance" style="left:${posBalance}%" title="Balance actual"></div>
        </div>
        <div class="ax-det-bar-foot">
          <span><b style="color:${espColor}">${fmt$(s.espacio)}</b> colchón</span>
          <span><b>${fmt$(s.balance)}</b> balance</span>
          <span><b>${faltan > 0 ? fmt$(faltan) : '$0'}</b> al target</span>
        </div>
      </div>

      ${esPACuenta ? '' : `<div class="ax-plan-card" id="apexPlanPanel">${planPanelHtml(cta, s, planCfg)}</div>`}

      <div class="ax-det-panels">
        <div class="ax-det-panel ax-panel-ok">
          <div class="ax-panel-title" style="color:var(--accent)"><i class="ti ti-target-arrow"></i> Para pasar la prueba</div>
          ${paraPasar.map(t => `<div class="ax-panel-row">${t}</div>`).join('')}
        </div>
        <div class="ax-det-panel ax-panel-risk">
          <div class="ax-panel-title" style="color:var(--red)"><i class="ti ti-alert-triangle"></i> Riesgo de perderla</div>
          ${riesgo.map(t => `<div class="ax-panel-row">${t}</div>`).join('')}
        </div>
      </div>

      ${tradingHtml}

      <div class="ax-det-hist-card">
        <div class="expd-matrix-title"><i class="ti ti-history"></i> Historial diario</div>
        <div style="overflow-x:auto">
          ${s.regs.length ? `
            <table class="ax-hist-table">
              <thead><tr><th>Fecha</th><th>P&L</th><th>Balance</th><th>Piso</th><th>Espacio</th><th>Ctos</th><th>Nota</th></tr></thead>
              <tbody>${histRows}</tbody>
            </table>` : '<p style="color:var(--text3);font-size:0.82rem;padding:8px 0">Sin registros aún</p>'}
        </div>
      </div>`

    document.getElementById('apexLista').classList.add('hidden')
    document.getElementById('apexDetalle').classList.remove('hidden')

    document.getElementById('apexVolver').addEventListener('click', volverLista)
    wirePlanPanel(cta, s)

    renderDetalleChart(cta, s)
  }

  function renderDetalleChart(cta, s) {
    if (detalleChart) { detalleChart.destroy(); detalleChart = null }
    const ctx = document.getElementById('apexDetChart')
    if (!ctx || typeof Chart === 'undefined' || !s.regs.length) return

    const labels = s.regs.map(r => r.fecha.slice(5))  // MM-DD
    const balData = s.regs.map(r => parseFloat(r.balance))
    const thrData = s.regs.map(r => parseFloat(r.threshold))
    const tgtData = s.regs.map(() => s.targetBal)

    detalleChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          { label: 'Balance', data: balData, borderColor: '#1D9E75', backgroundColor: 'rgba(29,158,117,0.12)',
            fill: true, tension: 0.35, pointRadius: 2, pointBackgroundColor: '#1D9E75', borderWidth: 2.5 },
          { label: 'Piso', data: thrData, borderColor: '#E24B4A', backgroundColor: 'transparent',
            fill: false, tension: 0.35, pointRadius: 0, borderWidth: 2, borderDash: [5, 4] },
          { label: 'Target', data: tgtData, borderColor: 'rgba(136,135,128,0.6)', backgroundColor: 'transparent',
            fill: false, pointRadius: 0, borderWidth: 1, borderDash: [2, 3] },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#2a2a28', titleColor: '#F4F3EF', bodyColor: '#9B9B8E',
            borderColor: 'rgba(255,255,255,0.06)', borderWidth: 1,
            callbacks: { label: c => `${c.dataset.label}: ${fmt$(c.parsed.y, 0)}` },
          },
        },
        scales: {
          x: { ticks: { color: '#9B9B8E', maxRotation: 45 }, grid: { color: 'rgba(255,255,255,0.06)' } },
          y: { ticks: { color: '#9B9B8E', callback: v => '$' + (v / 1000).toFixed(1) + 'k' }, grid: { color: 'rgba(255,255,255,0.06)' } },
        },
      },
    })
  }

  // ── Modal: cuenta ─────────────────────────────────────────────────────────

  function openCuentaModal(cuentaId = null) {
    const cta = cuentaId ? cuentas.find(c => c.id === cuentaId) : null
    document.getElementById('apexCuentaModalTitle').innerHTML =
      `<i class="ti ti-trophy"></i> ${cta ? 'Editar ' + cta.nombre : 'Nueva cuenta'}`
    document.getElementById('apexCtaId').value        = cta?.id || ''
    document.getElementById('apexCtaNombre').value    = cta?.nombre || ''
    document.getElementById('apexCtaNumero').value    = cta?.numero_cuenta || ''
    document.getElementById('apexCtaTamano').value    = cta?.tamano ?? 50000
    document.getElementById('apexCtaDrawdown').value  = cta?.drawdown_max ?? 2000
    document.getElementById('apexCtaTarget').value    = cta?.profit_target ?? 3000
    document.getElementById('apexCtaSafety').value    = cta?.safety_net_balance ?? 52100
    document.getElementById('apexCtaPiso').value      = cta?.piso_congelado ?? 50100
    document.getElementById('apexCtaMinDias').value   = cta?.min_dias ?? 7
    document.getElementById('apexCtaContratos').value = cta?.contratos_max ?? ''
    document.getElementById('apexCtaEstado').value    = cta?.estado || 'evaluacion'
    document.getElementById('apexCtaFecha').value     = cta?.fecha_inicio || ''
    document.getElementById('apexCtaNotas').value     = cta?.notas || ''
    document.getElementById('apexCtaActiva').checked  = cta ? !!cta.activa : true
    document.getElementById('apexCuentaModal').classList.remove('hidden')
  }

  async function guardarCuenta() {
    const nombre = document.getElementById('apexCtaNombre').value.trim()
    if (!nombre) { Toast.show('El nombre es obligatorio', 'warning'); return }
    const tamano = parseFloat(document.getElementById('apexCtaTamano').value) || 50000
    const payload = {
      nombre,
      numero_cuenta:      document.getElementById('apexCtaNumero').value.trim() || null,
      tamano,
      balance_inicial:    tamano,
      drawdown_max:       parseFloat(document.getElementById('apexCtaDrawdown').value) || 2000,
      profit_target:      parseFloat(document.getElementById('apexCtaTarget').value) || 3000,
      safety_net_balance: parseFloat(document.getElementById('apexCtaSafety').value) || null,
      piso_congelado:     parseFloat(document.getElementById('apexCtaPiso').value) || null,
      min_dias:           parseInt(document.getElementById('apexCtaMinDias').value) || 7,
      contratos_max:      parseInt(document.getElementById('apexCtaContratos').value) || null,
      estado:             document.getElementById('apexCtaEstado').value,
      fecha_inicio:       document.getElementById('apexCtaFecha').value || null,
      notas:              document.getElementById('apexCtaNotas').value.trim() || null,
      activa:             document.getElementById('apexCtaActiva').checked,
    }
    const id = document.getElementById('apexCtaId').value
    if (id) payload.id = parseInt(id)
    try {
      await DB.saveApexCuenta(payload)
      document.getElementById('apexCuentaModal').classList.add('hidden')
      await reload()
      Toast.show('Cuenta guardada', 'success')
    } catch (e) { Toast.show('Error al guardar: ' + e.message, 'error') }
  }

  // ── Modal: registrar día ──────────────────────────────────────────────────

  function openDiaModal(cuentaId) {
    const cta = cuentas.find(c => c.id === cuentaId)
    if (!cta) return
    const s = calc(cta)
    document.getElementById('apexDiaModalTitle').innerHTML =
      `<i class="ti ti-calendar-plus"></i> Registrar día — ${cta.nombre}`
    document.getElementById('apexDiaCuentaId').value = cuentaId
    document.getElementById('apexDiaFecha').value = new Date().toISOString().slice(0, 10)
    document.getElementById('apexDiaPnl').value = ''
    document.getElementById('apexDiaBalance').value = ''
    document.getElementById('apexDiaThreshold').value = ''
    document.getElementById('apexDiaContratos').value = cta.contratos_max || ''
    document.getElementById('apexDiaNota').value = ''
    document.getElementById('apexDiaHint').innerHTML =
      `Balance actual: <b>${fmt$(s.balance, 2)}</b> · threshold actual: <b>${fmt$(s.threshold, 2)}</b>`
    document.getElementById('apexDiaModal').classList.remove('hidden')
  }

  function onPnlInput() {
    const cuentaId = parseInt(document.getElementById('apexDiaCuentaId').value)
    const cta = cuentas.find(c => c.id === cuentaId)
    if (!cta) return
    const s = calc(cta)
    const pnl = parseFloat(document.getElementById('apexDiaPnl').value)
    if (isNaN(pnl)) return
    const nuevoBalance = Math.round((s.balance + pnl) * 100) / 100
    document.getElementById('apexDiaBalance').value = nuevoBalance
    const sug = sugerirThreshold(cta, nuevoBalance)
    document.getElementById('apexDiaThreshold').value = sug
    document.getElementById('apexDiaHint').innerHTML =
      `Balance calculado: <b>${fmt$(nuevoBalance, 2)}</b> · threshold sugerido: <b>${fmt$(sug, 2)}</b> — ajústalo con el valor real de Rithmic (el trail intradía puede diferir)`
  }

  async function guardarDia() {
    const cuentaId = parseInt(document.getElementById('apexDiaCuentaId').value)
    const fecha    = document.getElementById('apexDiaFecha').value
    const pnl      = parseFloat(document.getElementById('apexDiaPnl').value)
    const balance  = parseFloat(document.getElementById('apexDiaBalance').value)
    const threshold = parseFloat(document.getElementById('apexDiaThreshold').value)
    if (!fecha) { Toast.show('Selecciona la fecha', 'warning'); return }
    if (isNaN(pnl)) { Toast.show('Ingresa el P&L del día', 'warning'); return }
    if (isNaN(balance) || isNaN(threshold)) { Toast.show('Balance y threshold son obligatorios', 'warning'); return }
    try {
      await DB.saveApexRegistro({
        cuenta_id: cuentaId, fecha, pnl_dia: pnl, balance, threshold,
        contratos: parseInt(document.getElementById('apexDiaContratos').value) || null,
        nota: document.getElementById('apexDiaNota').value.trim() || null,
      })
      document.getElementById('apexDiaModal').classList.add('hidden')
      await reload()
      Toast.show('Día registrado', 'success')
    } catch (e) { Toast.show('Error al guardar: ' + e.message, 'error') }
  }

  // ── Carga e init ─────────────────────────────────────────────────────────

  async function loadData() {
    ;[cuentas, registros, trades, mainTrades] = await Promise.all([
      DB.getApexCuentas(), DB.getApexRegistros(),
      DB.getApexTrades().catch(() => []),  // tabla puede no existir aún
      DB.getTrades().catch(() => []),      // journal: días recientes de la PA
    ])
    buildSeries()
  }

  async function reload() {
    try {
      await loadData()
      render()
      // Si estábamos en una vista de detalle, refrescarla con los datos nuevos
      if (detalleCuentaId != null) {
        if (cuentas.find(c => c.id === detalleCuentaId)) openDetalle(detalleCuentaId)
        else volverLista()
      }
    } catch (_) { /* tablas aún no creadas — init ya mostró el aviso */ }
  }

  async function init() {
    try {
      await loadData()
    } catch (e) {
      document.getElementById('apexCuentas').innerHTML =
        `<p class="expd-empty">No se pudieron cargar las tablas de Apex (${e.message}).<br>
         Corre la migración <code>docs/migrations/2026-06-12-apex-tracker.sql</code> en el SQL Editor de Supabase.</p>`
      return
    }
    render()

    document.getElementById('apexNuevaCuenta').addEventListener('click', () => openCuentaModal())
    document.getElementById('apexCtaGuardar').addEventListener('click', guardarCuenta)
    document.getElementById('apexDiaGuardar').addEventListener('click', guardarDia)
    document.getElementById('apexDiaPnl').addEventListener('input', onPnlInput)

    ;['apexCuentaModal', 'apexDiaModal'].forEach(id => {
      const modal = document.getElementById(id)
      modal.addEventListener('click', e => { if (e.target === modal) modal.classList.add('hidden') })
    })
    document.getElementById('closeApexCuentaModal').addEventListener('click', () =>
      document.getElementById('apexCuentaModal').classList.add('hidden'))
    document.getElementById('closeApexDiaModal').addEventListener('click', () =>
      document.getElementById('apexDiaModal').classList.add('hidden'))
  }

  return { init, reload }
})()
