// ── Apex Tracker — seguimiento de pruebas de fondeo ─────────────────────────
// Cards por cuenta: balance/threshold/espacio, progreso a target, hitos,
// historial diario, registro de días y gestión de cuentas.
const Apex = (() => {
  let cuentas   = []
  let registros = []   // todos, orden fecha asc

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
    return registros.filter(r => r.cuenta_id === cuentaId)
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

    return { regs, last, balance, threshold, espacio, inicial, targetBal, maxBal,
      diasOperados, wins: wins.length, losses: losses.length, avgWin, riesgo,
      stopMax, hitos, siguiente, proyeccion }
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
          <td class="ax-hist-nota">${r.nota || ''}</td>
          <td><button class="btn-icon ax-del-reg" data-id="${r.id}" title="Eliminar registro"><i class="ti ti-trash" style="font-size:0.85rem"></i></button></td>
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
    ;[cuentas, registros] = await Promise.all([DB.getApexCuentas(), DB.getApexRegistros()])
  }

  async function reload() {
    try {
      await loadData()
      render()
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
