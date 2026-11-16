// ── El día, paso a paso ─────────────────────────────────────────────────────
// Rediseño «Cristal» (docs/disenos/2026-11-13-rediseno-cristal.md, §6). En Sesión, encima de las pestañas:
// la rutina del día en cinco casillas — Niveles → Noticias → Operación → Diario → Coach —, cada una con su
// estado, y la que falta resaltada. Al tocar una, lleva a donde se hace. Solo LEE lo que ya existe:
//   Niveles   = los escribe NinjaTrader en la sesión (precio de apertura)
//   Noticias  = sesion_noticias del día (se guardan desde el Diario)
//   Operación = los trades del día
//   Diario    = sesiones.registrada_at (el primer guardado)
//   Coach     = el diagnóstico del día (diagnosticos_diarios)
const Pasos = (() => {
  const $ = id => document.getElementById(id)
  let pedido = 0

  function montar() {
    const tabs = $('soTabs')
    if (!tabs || $('pasos')) return
    const el = document.createElement('div')
    el.className = 'pasos'; el.id = 'pasos'
    tabs.parentNode.insertBefore(el, tabs)
    el.addEventListener('click', e => {
      const b = e.target.closest('[data-ir]'); if (!b) return
      const ir = b.dataset.ir
      if (ir === 'coach') SesionOperativa.showTab('coach')
      else {
        SesionOperativa.showTab('diario')
        const destino = { noticias: '#noticiasRojasBox, .noticias-box, [id*="oticias"]', operacion: '#tradesDelDia, [id*="radesDia"], .trades-dia' }[ir]
        if (destino) document.querySelector(destino)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    })
  }

  async function pintar(fecha) {
    montar()
    const el = $('pasos'); if (!el || !fecha) return
    const yo = ++pedido
    el.innerHTML = Array.from({ length: 5 }, () => '<div class="paso cargando-brillo" style="height:96px"></div>').join('')
    const [ses, noticias, trades, diag] = await Promise.all([
      DB.getSesionByDate(fecha).catch(() => null),
      DB.getNoticiasByDate(fecha).catch(() => null),
      DB.getTradesByDate(fecha).catch(() => []),
      DB.getDiagnosticoByDate(fecha).catch(() => null),
    ])
    if (yo !== pedido) return
    const hora = iso => { if (!iso) return ''; const d = new Date(iso); return isNaN(d) ? '' : d.toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' }) }
    const pnl = (trades || []).reduce((s, t) => s + (parseFloat(t.profit) || 0), 0)
    const noOpero = ses?.no_opero
    const pasos = [
      { id: 'niveles', ic: 'ti-ruler-measure', l: 'Niveles', ok: ses?.precio_apertura != null, v: ses?.precio_apertura != null ? 'Cargados' : 'Sin niveles', s: ses?.precio_apertura != null ? 'desde NinjaTrader' : 'los sube NinjaTrader al abrir' },
      { id: 'noticias', ic: 'ti-news', l: 'Noticias', ok: (noticias || []).length > 0, v: (noticias || []).length ? `${noticias.length} roja${noticias.length > 1 ? 's' : ''}` : 'Sin rojas', s: (noticias || []).length ? noticias.map(n => String(n.hora).slice(0, 5)).join(' · ') : 'ninguna guardada', neutro: !(noticias || []).length },
      { id: 'operacion', ic: 'ti-target-arrow', l: 'Operación', ok: (trades || []).length > 0 || noOpero, v: (trades || []).length ? fmtDinero(pnl) : noOpero ? 'No operé' : 'Sin trades', s: (trades || []).length ? `${trades.length} trade${trades.length > 1 ? 's' : ''}${ses?.setup ? ' · ' + ses.setup : ''}` : noOpero ? (ses?.motivo_no_opero || '') : 'aún no hay operaciones', c: pnl > 0 ? 'pos' : pnl < 0 ? 'neg' : '' },
      { id: 'diario', ic: 'ti-notebook', l: 'Diario', ok: !!ses?.registrada_at, v: ses?.registrada_at ? 'Registrado' : 'Pendiente', s: ses?.registrada_at ? `a las ${hora(ses.registrada_at)}` : 'guarda tu día' },
      { id: 'coach', ic: 'ti-sparkles', l: 'Coach', ok: !!diag, v: diag ? 'Revisado' : 'Pendiente', s: diag ? 'el día ya tiene su análisis' : 'revisa el día con el Coach' },
    ]
    const primero = pasos.findIndex(p => !p.ok && !p.neutro)
    el.innerHTML = pasos.map((p, i) => {
      const est = p.ok ? '' : i === primero ? 'pend' : 'nada'
      return `<button type="button" class="paso ${est}" data-ir="${p.id}"><div class="h"><i class="ti ${p.ic}"></i>${p.l}<span class="ok"><i class="ti ti-${p.ok ? 'check' : i === primero ? 'clock' : 'minus'}"></i></span></div>
        <b class="${p.c || ''}">${p.v}</b><small>${p.s}</small><div class="bar"><i data-w="${p.ok ? 100 : i === primero ? 22 : 0}"></i></div></button>`
    }).join('')
    requestAnimationFrame(() => setTimeout(() => el.querySelectorAll('[data-w]').forEach((b, i) => setTimeout(() => { b.style.transform = `translateX(${b.dataset.w - 100}%)` }, i * 90)), 120))
  }

  // Cada vez que la cabecera de Sesión cambia de día, los pasos también.
  const sync = SesionOperativa.syncHead.bind(SesionOperativa)
  SesionOperativa.syncHead = function (date) { pintar(date); return sync(date) }
  return { pintar }
})()
