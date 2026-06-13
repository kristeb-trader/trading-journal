// ── Apex Tracker — seguimiento de pruebas de fondeo ─────────────────────────
// Cards por cuenta: balance/threshold/espacio, progreso a target, hitos,
// historial diario, registro de días y gestión de cuentas.
const Apex = (() => {
  let cuentas   = []
  let registros = []   // apex_registros manuales, orden fecha asc
  let trades    = []   // apex_trades (auto-export NT8), orden fecha asc
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

  const fmt$ = (v, dec = 0) => {
    const n = parseFloat(v) || 0
    const s = Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec })
    return `${n < 0 ? '−' : ''}$${s}`
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

      // Trades de esta cuenta (match por número de cuenta = AccountName de NT)
      const ctaTrades = trades.filter(t => t.account === cta.numero_cuenta)
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

    wrap.innerHTML = ordenadas.map(cta => {
      const s = calc(cta)
      const est = ESTADOS[cta.estado] || ESTADOS.evaluacion
      const espColor = s.espacio <= 0 ? 'var(--red)' : s.riesgo === 'alto' ? 'var(--red)' : s.riesgo === 'medio' ? 'var(--warning)' : 'var(--accent)'
      const bordeCls = !cta.activa ? '' : s.riesgo === 'critico' ? 'ax-borde-crit' : s.riesgo === 'alto' ? 'ax-borde-crit' : s.riesgo === 'medio' ? 'ax-borde-warn' : 'ax-borde-ok'

      const alerta = s.espacio <= 0 && cta.activa && !['aprobada', 'pa', 'quemada'].includes(cta.estado) ? `
        <div class="ax-alerta">
          <i class="ti ti-alert-octagon"></i>
          Balance (${fmt$(s.balance)}) por debajo del threshold (${fmt$(s.threshold)}) — verificar estado real en Rithmic antes de operar
        </div>` : ''

      const hitosHtml = s.hitos.map(h => {
        const cls = h.alcanzado ? 'hito-ok' : (s.siguiente && h.valor === s.siguiente.valor) ? 'hito-next' : ''
        return `<span class="ax-hito ${cls}">${h.alcanzado ? '✓ ' : ''}${h.label}</span>`
      }).join('')

      const statsLine = [
        s.diasOperados ? `${s.wins}W · ${s.losses}L días` : 'Sin días operados',
        cta.min_dias ? `${s.diasOperados}/${cta.min_dias} días mín` : null,
        s.avgWin ? `prom. +${fmt$(s.avgWin)}/día ganador` : null,
        (s.proyeccion != null && s.proyeccion > 0 && s.siguiente) ? `~${s.proyeccion} días a ${s.siguiente.label.split(' ')[0].toLowerCase()}` : null,
      ].filter(Boolean).join(' · ')

      const histRows = [...s.regs].reverse().map(r => `
        <tr>
          <td>${r.fecha}</td>
          <td style="color:${parseFloat(r.pnl_dia) > 0 ? 'var(--accent)' : parseFloat(r.pnl_dia) < 0 ? 'var(--red)' : 'var(--text3)'}">${fmt$(r.pnl_dia, 2)}</td>
          <td>${fmt$(r.balance, 2)}</td>
          <td>${fmt$(r.threshold, 2)}</td>
          <td>${r.contratos ?? '—'}</td>
          <td class="ax-hist-nota">${r._auto ? '<i class="ti ti-bolt" title="Auto desde NinjaTrader" style="color:var(--accent)"></i> ' : ''}${r.nota || ''}</td>
          <td>${r._auto ? '' : `<button class="btn-icon ax-del-reg" data-id="${r.id}" title="Eliminar registro"><i class="ti ti-trash" style="font-size:0.85rem"></i></button>`}</td>
        </tr>`).join('')

      const faltan = s.targetBal - s.balance

      return `
        <div class="ax-card ${bordeCls} ${cta.activa ? '' : 'ax-inactiva'}">
          <div class="ax-head">
            <div class="ax-head-left">
              <span class="ax-nombre">${cta.nombre}</span>
              <span class="ax-numero">${cta.numero_cuenta || ''} · ${(parseFloat(cta.tamano) / 1000).toFixed(0)}K${cta.contratos_max ? ` · máx ${cta.contratos_max} ctos` : ''}</span>
            </div>
            <div class="ax-head-right">
              <span class="ax-badge ${est.cls}">${est.label}</span>
              <button class="btn-icon ax-edit" data-id="${cta.id}" title="Editar cuenta"><i class="ti ti-pencil"></i></button>
            </div>
          </div>
          ${alerta}
          <div class="ax-stats">
            <div><div class="ax-stat-label">Balance</div><div class="ax-stat-val">${fmt$(s.balance)}</div></div>
            <div><div class="ax-stat-label">Threshold</div><div class="ax-stat-val">${fmt$(s.threshold)}</div></div>
            <div><div class="ax-stat-label">Espacio</div><div class="ax-stat-val" style="color:${espColor}">${fmt$(s.espacio)}</div></div>
            <div><div class="ax-stat-label">Stop máx sugerido</div><div class="ax-stat-val" style="color:${s.stopMax > 0 ? 'var(--text)' : 'var(--red)'}">${s.stopMax > 0 ? fmt$(s.stopMax) : 'No operar'}</div></div>
          </div>
          <div class="ax-prog-head"><span>Progreso al target ${fmt$(s.targetBal)}</span><span>${faltan > 0 ? `faltan ${fmt$(faltan)}` : '🎯 ¡Target alcanzado!'}</span></div>
          <div class="ax-prog"><div style="width:${s.progreso ?? 0}%"></div></div>
          <div class="ax-hitos">${hitosHtml}</div>
          <div class="ax-foot">
            <span class="ax-foot-stats">${statsLine}</span>
            <span class="ax-foot-actions">
              <button class="btn-secondary btn-sm ax-ver-detalle" data-id="${cta.id}"><i class="ti ti-chart-area-line"></i> Ver detalle</button>
              <button class="btn-secondary btn-sm ax-toggle-hist" data-id="${cta.id}"><i class="ti ti-history"></i> Historial</button>
              <button class="btn-primary btn-sm ax-reg-dia" data-id="${cta.id}"><i class="ti ti-plus"></i> Registrar día</button>
            </span>
          </div>
          <div class="ax-hist hidden" id="axHist-${cta.id}">
            ${s.regs.length ? `
              <table class="ax-hist-table">
                <thead><tr><th>Fecha</th><th>P&L</th><th>Balance</th><th>Threshold</th><th>Ctos</th><th>Nota</th><th></th></tr></thead>
                <tbody>${histRows}</tbody>
              </table>` : '<p style="color:var(--text3);font-size:0.82rem;padding:8px 0">Sin registros aún</p>'}
          </div>
        </div>`
    }).join('')

    // Wire de acciones
    wrap.querySelectorAll('.ax-toggle-hist').forEach(btn => {
      btn.addEventListener('click', () => {
        document.getElementById(`axHist-${btn.dataset.id}`)?.classList.toggle('hidden')
      })
    })
    wrap.querySelectorAll('.ax-reg-dia').forEach(btn => {
      btn.addEventListener('click', () => openDiaModal(parseInt(btn.dataset.id)))
    })
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
    const est = ESTADOS[cta.estado] || ESTADOS.evaluacion

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
        return `<tr>
          <td>${t.trade_date}</td>
          <td>${(t.entry_time || '').slice(0, 5)}</td>
          <td><span class="ax-instr-tag ${base === 'NQ' ? 'ax-instr-nq' : ''}">${base}</span></td>
          <td>${t.market_pos || ''}</td>
          <td>${t.qty ?? '—'}</td>
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
          <div class="ax-numero">${cta.numero_cuenta || ''} · ${(parseFloat(cta.tamano) / 1000).toFixed(0)}K Intraday Trail</div>
        </div>
        <button class="btn-primary btn-sm ax-reg-dia" data-id="${cta.id}" style="margin-left:auto"><i class="ti ti-plus"></i> Registrar día</button>
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
    document.querySelector('#apexDetalle .ax-reg-dia').addEventListener('click', () => openDiaModal(cta.id))

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
    ;[cuentas, registros, trades] = await Promise.all([
      DB.getApexCuentas(), DB.getApexRegistros(),
      DB.getApexTrades().catch(() => []),  // tabla puede no existir aún
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
