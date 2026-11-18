// ── La portada del Calendario ───────────────────────────────────────────────
// Rediseño «Cristal» (docs/disenos/2026-11-13-rediseno-cristal.md, §5). Ordena el Calendario como la maqueta y
// le añade tres piezas, todas con las cifras que ya calcula Metrics (evento «metrics:pintado»): no recalcula nada.
//   · Saludo con el mes en una frase, y arriba la curva del mes junto a la META DEL MES: cumplir las reglas
//     (la disciplina del mes en un medidor; la meta es el 100 %).
//   · «Lo que destaca»: mejor día, mejor setup, mejor franja, mejor día de la semana y el setup a vigilar.
//   · «Esta semana»: una columna por día con su resultado.
const Portada = (() => {
  const $ = id => document.getElementById(id)
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
  const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
  const DSEM = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
  const cls = v => (v > 0 ? 'pos' : v < 0 ? 'neg' : '')
  let ultimo = null

  function montar() {
    const mio = $('calMio'), eq = $('calEquityChart')?.closest('.annual-table-card')
    if (!mio || !eq || $('ptSaludo')) return
    const sal = document.createElement('div')
    sal.className = 'pt-saludo'; sal.id = 'ptSaludo'
    sal.innerHTML = `<div><span class="pt-vivo"><i></i><span id="ptVivo"></span></span><h1 id="ptHola"></h1><p id="ptFrase"></p></div>
      <span class="sp"></span><button type="button" class="pt-cta" data-mas><i class="ti ti-plus"></i>Registrar sesión</button>`
    const top = document.createElement('div')
    top.className = 'pt-top'
    const meta = document.createElement('section')
    meta.className = 'pt-card pt-meta'
    meta.innerHTML = `<div class="h"><div><h3>Meta del mes</h3><div class="s">Cumplir las reglas en cada entrada</div></div><span class="pt-chip"><i class="ti ti-flag"></i>Meta 100%</span></div>
      <div class="pt-gauge"><svg viewBox="0 0 300 172" aria-hidden="true">
        <defs><linearGradient id="ptGg" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#2f7f8f"/><stop offset="1" stop-color="#1aa373"/></linearGradient></defs>
        <path d="M30 150A120 120 0 0 1 270 150" fill="none" stroke="var(--bg3)" stroke-width="20" stroke-linecap="round"/>
        <path class="arc" id="ptArc" d="M30 150A120 120 0 0 1 270 150" fill="none" stroke="url(#ptGg)" stroke-width="20" stroke-linecap="round" stroke-dasharray="377" stroke-dashoffset="377"/>
        ${Array.from({ length: 11 }, (_, i) => { const a = Math.PI * (1 - i / 10), r2 = i % 5 ? 102 : 106; return `<line x1="${150 + 96 * Math.cos(a)}" y1="${150 - 96 * Math.sin(a)}" x2="${150 + r2 * Math.cos(a)}" y2="${150 - r2 * Math.sin(a)}" stroke="var(--text3)" stroke-width="${i % 5 ? 1 : 2}" stroke-linecap="round"/>` }).join('')}
        <g class="ag" id="ptAg"><path d="M150 150L146 62L150 44L154 62Z" fill="var(--text)"/></g>
        <circle cx="150" cy="150" r="11" fill="var(--text)"/><circle cx="150" cy="150" r="4" fill="var(--card)"/></svg></div>
      <div class="pt-gv"><b class="num" id="ptPct">—</b><small id="ptPctS"></small></div>
      <div class="pt-tiles" id="ptTiles"></div>`
    mio.prepend(sal, top)
    top.append(eq, meta)
    const bajo = document.createElement('div')
    bajo.className = 'pt-bajo'
    bajo.innerHTML = `<section class="pt-card"><h3>Lo que destaca</h3><div class="s" id="ptDesS"></div><div class="pt-des" id="ptDes"></div></section>
      <section class="pt-card" style="display:flex;flex-direction:column"><div style="display:flex;justify-content:space-between;gap:8px"><div><h3>Esta semana</h3><div class="s" id="ptSemS"></div></div><span class="pt-chip" id="ptSemT" style="background:var(--accent-dim);color:var(--accent-txt)"></span></div><div class="pt-sem" id="ptSem"></div></section>`
    const des = $('diasDesglose')?.closest('.annual-table-card')
    if (des) mio.insertBefore(bajo, des); else mio.appendChild(bajo)
    // el mejor día se abre en el visor
    bajo.addEventListener('click', e => { const d = e.target.closest('[data-fecha]'); if (d) Calendarios.abrirVisor('mio', d.dataset.fecha) })
  }

  // Grupos de trades por una clave: { k, n, w (en target), pnl }
  const agrupa = (trades, clave) => Object.values(trades.reduce((m, t) => {
    const k = clave(t); if (!k) return m
    const g = (m[k] ||= { k, n: 0, w: 0, pnl: 0 }); g.n++; g.w += (parseFloat(t.profit) || 0) > 0; g.pnl += parseFloat(t.profit) || 0
    return m
  }, {})).sort((a, b) => b.pnl - a.pnl)
  const franja = t => {
    const m = String(t.entry_time || '').match(/^(\d{1,2}):(\d{2})/); if (!m) return null
    const min = +m[1] * 60 + Math.floor(+m[2] / 15) * 15, f = x => `${Math.floor(x / 60)}:${String(x % 60).padStart(2, '0')}`
    return `${f(min)} – ${f(min + 15)}`
  }

  function pintar({ trades, sesiones, netPnl, year, month, disciplina }) {
    montar()
    if (!$('ptSaludo')) return
    const setupDe = Object.fromEntries((sesiones || []).filter(s => s.setup).map(s => [s.sesion_date, s.setup]))
    const ops = [...trades].filter(t => t.trade_date).sort((a, b) => (a.trade_date + (a.entry_time || '')).localeCompare(b.trade_date + (b.entry_time || '')))
    let racha = 0
    for (let i = ops.length - 1; i >= 0 && (parseFloat(ops[i].profit) || 0) > 0; i--) racha++
    const setups = agrupa(ops, t => setupDe[t.trade_date])
    // saludo
    const h = new Date().getHours()
    $('ptHola').textContent = `${h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches'}, Kris`
    const dias = new Set(ops.map(t => t.trade_date)).size
    $('ptVivo').textContent = `${MESES[month - 1].charAt(0).toUpperCase() + MESES[month - 1].slice(1)} ${year} · ${dias} día${dias === 1 ? '' : 's'} operado${dias === 1 ? '' : 's'}`
    $('ptFrase').textContent = !ops.length ? 'Aún no hay operaciones este mes.'
      : `${racha ? `Llevas ${racha} target${racha > 1 ? 's' : ''} seguido${racha > 1 ? 's' : ''} y el` : 'El'} mes va ${fmtDinero(netPnl)}.${setups[0] ? ` Tu mejor setup: ${setups[0].k.toLowerCase()}.` : ''}`
    // meta del mes: la disciplina
    const p = disciplina.total ? disciplina.pct : null
    $('ptPct').textContent = p == null ? '—' : `${p}%`
    $('ptPctS').textContent = p == null ? 'Sin trades que medir este mes' : `${disciplina.ok} de ${disciplina.total} ${disciplina.medida === 'plan' ? 'dentro de las reglas (trades y días sin operar)' : 'ítems del checklist'}`
    const tile = ([l, v]) => `<div class="pt-tile"><small>${l}</small><b class="num">${v}</b></div>`
    $('ptTiles').innerHTML = [
      ['Fuera', p == null ? '—' : disciplina.total - disciplina.ok],
      ['Mes anterior', disciplina.anterior == null ? '—' : `${disciplina.anterior}%`],
      ['Faltan', p == null ? '—' : `${100 - p} pts`],
    ].map(tile).join('')
    const P = (p || 0) / 100
    $('ptArc').style.strokeDashoffset = 377; $('ptAg').style.transform = 'rotate(-90deg)'
    requestAnimationFrame(() => setTimeout(() => { $('ptArc').style.strokeDashoffset = 377 * (1 - P); $('ptAg').style.transform = `rotate(${-90 + 180 * P}deg)` }, 250))
    // lo que destaca
    const porDia = agrupa(ops, t => t.trade_date)
    const horas = agrupa(ops, franja)
    const sem = agrupa(ops, t => DSEM[new Date(`${t.trade_date}T12:00:00`).getDay()])
    const peor = setups.length && setups.at(-1).pnl < 0 ? setups.at(-1) : null
    const fila = (ic, k, l, t, v, fecha) => `<div class="pt-de"${fecha ? ` data-fecha="${fecha}" style="cursor:pointer"` : ''}><span class="ic" style="--k:var(${k})"><i class="ti ${ic}"></i></span><div><small>${l}</small><b>${t}</b></div><span class="v num ${cls(v)}">${fmtDinero(v)}</span></div>`
    const de = (g, l) => `${g.w} de ${g.n}${l ? ' ' + l : ''}`
    $('ptDesS').textContent = ops.length ? `Lo que dicen tus ${ops.length} operaciones del mes` : ''
    $('ptDes').innerHTML = !ops.length ? '<div class="s" style="padding:18px 0">Cuando operes este mes, aquí saldrá lo que más te funciona.</div>' : [
      porDia[0] && porDia[0].pnl > 0 && fila('ti-trophy', '--accent', 'Mejor día', `${+porDia[0].k.slice(8)} de ${MESES[month - 1]}${setupDe[porDia[0].k] ? ' · ' + esc(setupDe[porDia[0].k]) : ''}`, porDia[0].pnl, porDia[0].k),
      setups[0] && setups[0].pnl > 0 && fila('ti-bolt', '--accent', 'Mejor setup', `${esc(setups[0].k)} · ${de(setups[0])}`, setups[0].pnl),
      horas[0] && horas[0].pnl > 0 && fila('ti-clock', '--warning', 'Mejor franja (hora Colombia)', `${horas[0].k} · ${de(horas[0])}`, horas[0].pnl),
      sem[0] && sem[0].pnl > 0 && fila('ti-calendar-week', '--blue', 'Mejor día de la semana', `Los ${sem[0].k} · ${de(sem[0])}`, sem[0].pnl),
      peor && fila('ti-alert-triangle', '--red', 'A vigilar', `${esc(peor.k)} · ${de(peor)}`, peor.pnl),
    ].filter(Boolean).join('')
    // esta semana: la de hoy si el mes es el actual; si no, la última del mes
    const hoy = hoyISO(), ultimoDia = `${year}-${String(month).padStart(2, '0')}-${String(new Date(year, month, 0).getDate()).padStart(2, '0')}`
    const esteMes = hoy.slice(0, 7) === ultimoDia.slice(0, 7)
    const ref = new Date(`${esteMes ? hoy : ultimoDia}T12:00:00`)
    while (ref.getDay() === 0 || ref.getDay() === 6) ref.setDate(ref.getDate() - 1)
    // un mes pasado: su última semana con al menos tres días dentro del mes
    if (!esteMes && ref.getDay() < 3) ref.setDate(ref.getDate() - 7)
    const lunes = new Date(ref); lunes.setDate(ref.getDate() - ((ref.getDay() + 6) % 7))
    const semana = Array.from({ length: 5 }, (_, i) => { const d = new Date(lunes); d.setDate(lunes.getDate() + i); return isoLocal(d) })
    const pnlDia = Object.fromEntries(porDia.map(g => [g.k, g]))
    const vals = semana.map(f => pnlDia[f]?.pnl ?? null), mx = Math.max(1, ...vals.map(v => Math.abs(v || 0)))
    $('ptSemS').textContent = `Del ${+semana[0].slice(8)} al ${+semana[4].slice(8)} de ${MESES[+semana[4].slice(5, 7) - 1]}`
    $('ptSemT').textContent = fmtDinero(vals.reduce((s, v) => s + (v || 0), 0))
    $('ptSem').innerHTML = semana.map((f, i) => {
      const v = vals[i], g = pnlDia[f]
      return `<div class="pt-car"><span class="num ${cls(v)}">${v == null ? '—' : fmtDinero(v)}</span><div class="trk"><i data-h style="height:${v == null ? 0 : Math.round(12 + 88 * Math.abs(v) / mx)}%;background:var(--${v > 0 ? 'accent' : 'red'})"></i></div>${['Lun', 'Mar', 'Mié', 'Jue', 'Vie'][i]}<small>${g ? `${g.n} op.` : +f.slice(8)}</small></div>`
    }).join('')
    requestAnimationFrame(() => setTimeout(() => $('ptSem').querySelectorAll('[data-h]').forEach((e, i) => setTimeout(() => { e.style.transform = 'none' }, i * 70)), 200))
    ultimo = `${fmtDinero(netPnl)}${p == null ? '' : ` · ${p}% en reglas`}`
  }

  document.addEventListener('metrics:pintado', e => pintar(e.detail))
  return { resumen: () => ultimo }
})()
