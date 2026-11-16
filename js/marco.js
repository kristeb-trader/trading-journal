// ── El marco del rediseño «Cristal» ─────────────────────────────────────────
// docs/disenos/2026-11-13-rediseno-cristal.md, §4. Se monta encima de lo que ya hay, sin cambiar cómo se
// navega por dentro (Nav.go sigue mandando):
//   · Escritorio: barra lateral con TODAS las pantallas por grupos (salen de Otros.ITEMS: una sección nueva
//     aparece sola), plegable a iconos, con la opción activa en una píldora que se desliza.
//   · Celular: barra de cristal con muesca y botón central «+» (registrar la sesión); «Otros» es una hoja.
//   · Tema claro / oscuro (el oscuro, por defecto), con un círculo que se abre desde el botón.
//   · Buscador (Ctrl K o la lupa): pantallas, días, setups, errores y observaciones.
//   · La isla: al bajar por una pantalla, lo esencial arriba; al tocarla, el estado de hoy en vivo.
//   · El día sale de su casilla del calendario hacia el visor y vuelve a ella.
const Marco = (() => {
  const $ = id => document.getElementById(id)
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
  const quieto = matchMedia('(prefers-reduced-motion: reduce)').matches
  const lee = k => { try { return localStorage.getItem(k) } catch { return null } }
  const guarda = (k, v) => { try { localStorage.setItem(k, v) } catch {} }
  const vibra = () => { try { navigator.vibrate?.(8) } catch {} }
  const vt = fn => (document.startViewTransition && !quieto ? document.startViewTransition(fn) : (fn(), null))

  const PRINCIPALES = [
    { id: 'calendar', name: 'Calendario', icon: 'ti-calendar-month' },
    { id: 'analysis', name: 'Análisis', icon: 'ti-chart-line' },
    { id: 'register', name: 'Sesión', icon: 'ti-notebook', badge: 'hoy' },
  ]
  const AJUSTES = { id: 'otros', name: 'Ajustes y más', icon: 'ti-adjustments-horizontal', grupo: 'Configurar' }
  const grupos = () => {
    const g = { Operativa: PRINCIPALES }
    ;[...Otros.ITEMS, AJUSTES].forEach(it => { (g[it.grupo] ||= []).push(it) })
    return g
  }

  // ── Tema ──
  const tema = () => (document.documentElement.dataset.tema === 'claro' ? 'claro' : 'oscuro')
  function ponerTema(t, desde) {
    const el = document.documentElement
    if (desde) { const r = desde.getBoundingClientRect(); el.style.setProperty('--tx', `${r.left + r.width / 2}px`); el.style.setProperty('--ty', `${r.top + r.height / 2}px`) }
    el.classList.add('cambia-tema')
    const t0 = vt(() => {
      if (t === 'claro') el.dataset.tema = 'claro'; else delete el.dataset.tema
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', t === 'claro' ? '#e6eeea' : '#06130d')
      document.querySelectorAll('.tema-ico').forEach(i => { i.className = `ti ${t === 'claro' ? 'ti-moon' : 'ti-sun'} tema-ico` })
    })
    ;(t0 ? t0.finished : Promise.resolve()).finally(() => el.classList.remove('cambia-tema'))
    guarda('tema', t)
  }
  const alternarTema = e => ponerTema(tema() === 'claro' ? 'oscuro' : 'claro', e?.currentTarget)

  // ── Barra lateral (escritorio) ──
  function montarLateral() {
    const sb = document.createElement('div')
    sb.className = 'sb'; sb.id = 'sb'
    const g = grupos()
    sb.innerHTML = '<span class="sb-pil" id="sbPil"></span>' + Object.entries(g).map(([nom, its]) =>
      `<div class="sb-grupo">${nom.toUpperCase()}</div>` + its.map(it =>
        `<button type="button" class="sb-it" data-go="${it.id}" data-tip="${esc(it.name)}"><i class="ti ${it.icon}"></i><span>${esc(it.name)}</span>${it.badge ? `<em>${it.badge}</em>` : ''}</button>`).join('')).join('')
    const pie = document.createElement('div')
    pie.className = 'sb-pie'
    pie.innerHTML = `<button type="button" class="sb-btn" data-buscar title="Buscar (Ctrl K)"><i class="ti ti-search"></i><span>Buscar</span><kbd>Ctrl K</kbd></button>
      <button type="button" class="sb-btn" data-tema title="Tema claro u oscuro"><i class="ti ${tema() === 'claro' ? 'ti-moon' : 'ti-sun'} tema-ico"></i></button>`
    const lat = $('sidebar')
    lat.append(sb, pie)
    if (lee('lateralPlegada') === '1') lat.classList.add('collapsed')
    $('menuToggle')?.addEventListener('click', () => {
      setTimeout(() => { guarda('lateralPlegada', lat.classList.contains('collapsed') ? '1' : '0'); marcar() }, 30)
    })
  }

  // ── Barra del celular ──
  const ICO = {
    cal: '<rect class="f" x="3.5" y="5" width="17" height="15.5" rx="4.5"/><rect x="3.5" y="5" width="17" height="15.5" rx="4.5"/><path d="M8 3v4M16 3v4M3.5 10.2h17"/><circle class="p" cx="8.3" cy="14.8" r="1.15"/><circle class="p" cx="12" cy="14.8" r="1.15"/><circle class="p" cx="15.7" cy="14.8" r="1.15"/>',
    ana: '<path class="f" d="M3.5 20v-5.5l5.5-5 4 3.2 7.5-7.2V20z"/><path d="M3.5 14.5l5.5-5 4 3.2 7.5-7.2"/><path d="M16 5.5h4.5V10"/><path d="M3.5 20h17"/>',
    ses: '<path class="f" d="M5 6.5A3 3 0 0 1 8 3.5h8a3 3 0 0 1 3 3v11a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3z"/><path d="M5 6.5A3 3 0 0 1 8 3.5h8a3 3 0 0 1 3 3v11a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3z"/><path d="M9 8.5h6M9 12h6M9 15.5h3"/>',
    otr: '<rect class="f" x="3.8" y="3.8" width="7" height="7" rx="2.4"/><rect x="3.8" y="3.8" width="7" height="7" rx="2.4"/><rect x="13.2" y="3.8" width="7" height="7" rx="2.4"/><rect x="3.8" y="13.2" width="7" height="7" rx="2.4"/><circle cx="16.7" cy="16.7" r="3.5"/>',
  }
  const svg = k => `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">${ICO[k]}</svg>`
  const FORMA = 'M32,0 H108 C126,0 131,9 137,19 C145,34 157,41 172,41 C187,41 199,34 207,19 C213,9 218,0 236,0 H312 A32,32 0 0 1 312,64 H32 A32,32 0 0 1 32,0 Z'
  function montarDock() {
    const d = document.createElement('nav')
    d.className = 'dock'; d.id = 'dock'; d.setAttribute('aria-label', 'Navegación')
    d.innerHTML = `<span class="dk-som"></span><span class="dk-bg"><i class="dk-luz" id="dkLuz"></i></span>
      <svg class="dk-borde" viewBox="0 0 344 64" aria-hidden="true"><path d="${FORMA}"/></svg>
      <button type="button" class="dk-mas" data-mas aria-label="Registrar la sesión de hoy"><i class="ti ti-plus"></i></button>
      <button type="button" class="dk" data-go="calendar" aria-label="Calendario">${svg('cal')}</button>
      <button type="button" class="dk" data-go="analysis" aria-label="Análisis">${svg('ana')}</button>
      <span></span>
      <button type="button" class="dk" data-go="register" aria-label="Sesión">${svg('ses')}</button>
      <button type="button" class="dk" data-hoja aria-label="Otros">${svg('otr')}</button>
      <span class="dk-ind" id="dkInd"></span>`
    const velo = document.createElement('div'); velo.className = 'hoja-velo'; velo.id = 'hojaVelo'
    const hoja = document.createElement('div'); hoja.className = 'hoja'; hoja.id = 'hoja'
    const COL = { accent: 'var(--accent-txt)', warning: 'var(--warning-txt)', violet: 'var(--violet-txt)', blue: 'var(--blue-txt)', red: 'var(--red-txt)', '': 'var(--text2)' }
    const g = grupos(); delete g.Operativa
    hoja.innerHTML = '<div class="asa"></div><h3>Otros</h3>' + Object.entries(g).map(([nom, its]) =>
      `<div class="hoja-grupo">${nom.toUpperCase()}</div><div class="hoja-gr">${its.map(it =>
        `<button type="button" data-go="${it.id}" style="--c:${COL[it.color || '']}"><i class="ti ${it.icon}"></i>${esc(it.name.replace('Fechas Especiales', 'Fechas'))}</button>`).join('')}</div>`).join('') +
      `<div class="hoja-acc"><button type="button" data-buscar><i class="ti ti-search"></i>Buscar</button><button type="button" class="g" data-tema><i class="ti ${tema() === 'claro' ? 'ti-moon' : 'ti-sun'} tema-ico"></i>Tema</button></div>`
    document.body.append(d, velo, hoja)
    // la hoja se cierra arrastrándola hacia abajo
    let y0 = null
    hoja.addEventListener('touchstart', e => { if (hoja.scrollTop <= 0) { y0 = e.touches[0].clientY; hoja.style.transition = 'none' } }, { passive: true })
    hoja.addEventListener('touchmove', e => { if (y0 != null) hoja.style.transform = `translateY(${Math.max(0, e.touches[0].clientY - y0)}px)` }, { passive: true })
    hoja.addEventListener('touchend', e => {
      if (y0 == null) return
      const dy = e.changedTouches[0].clientY - y0; y0 = null
      hoja.style.transition = ''; hoja.style.transform = ''
      if (dy > 70) cerrarHoja()
    })
    velo.addEventListener('click', cerrarHoja)
    // al tocar: onda y vibración; al bajar por la pantalla la barra se recoge un poco
    d.addEventListener('pointerdown', e => {
      const b = e.target.closest('.dk, .dk-mas'); if (!b) return
      vibra()
      const o = document.createElement('span'); o.className = 'onda'; b.appendChild(o)
      o.addEventListener('animationend', () => o.remove())
    })
    let yAnt = 0
    addEventListener('scroll', () => { const y = scrollY; d.classList.toggle('baja', y > yAnt && y > 140); yAnt = y }, { passive: true })
  }
  const abrirHoja = () => { $('hoja').classList.add('ab'); $('hojaVelo').classList.add('ab') }
  const cerrarHoja = () => { $('hoja')?.classList.remove('ab'); $('hojaVelo')?.classList.remove('ab') }

  // ── La opción activa (lateral y celular) ──
  let ultimo = null
  function marcar() {
    const act = Nav.actual?.() || 'calendar'
    const padre = Nav.PADRE?.[act] || null
    document.querySelectorAll('.sb-it').forEach(b => b.classList.toggle('on', b.dataset.go === act))
    const b = document.querySelector('.sb-it.on'), pil = $('sbPil')
    if (pil) {
      if (b) { pil.style.transform = `translateY(${b.offsetTop}px)`; pil.style.height = `${b.offsetHeight}px`; pil.style.opacity = '1' }
      else pil.style.opacity = '0'
    }
    document.querySelectorAll('#dock .dk').forEach(d => d.classList.toggle('on', d.dataset.hoja != null ? (padre === 'otros' || act === 'otros') : d.dataset.go === act))
    const d = document.querySelector('#dock .dk.on'), k = $('dock')
    if (d && k) {
      const c = d.offsetLeft + d.offsetWidth / 2
      $('dkInd').style.transform = `translateX(${c - 9}px)`
      $('dkLuz').style.transform = `translateX(${c - 48}px)`
      if (d !== ultimo) { ultimo = d; k.classList.remove('barre'); void k.offsetWidth; k.classList.add('barre') }
    }
    $('isla')?.classList.remove('ve', 'ab')
  }

  // ── El buscador ──
  let datos = null
  async function cargarDatos() {
    if (datos) return datos
    const [trades, sesiones, errores] = await Promise.all([
      DB.getTrades().catch(() => []), DB.getSesiones().catch(() => []), DB.getAllCasuisticas().catch(() => []),
    ])
    const pnl = {}, n = {}
    trades.forEach(t => { if (t.trade_date) { pnl[t.trade_date] = (pnl[t.trade_date] || 0) + (parseFloat(t.profit) || 0); n[t.trade_date] = (n[t.trade_date] || 0) + 1 } })
    const ses = Object.fromEntries(sesiones.map(s => [s.sesion_date, s]))
    const fechas = [...new Set([...Object.keys(pnl), ...sesiones.filter(s => s.setup || s.no_opero || s.imagen_url).map(s => s.sesion_date)])]
      .filter(f => esDiaHabil(f)).sort().reverse()
    const larga = f => new Date(`${f}T12:00:00`).toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    const dias = fechas.map(f => ({
      g: 'DÍAS', i: 'ti-calendar-event', fecha: f,
      t: `${larga(f)} ${f} ${ses[f]?.setup || ''}`,
      h: `<b>${larga(f)}</b> · ${esc(ses[f]?.setup || (ses[f]?.no_opero ? 'No operé' : ''))}`,
      e: pnl[f] != null ? fmtDinero(pnl[f]) : '', c: pnl[f] > 0 ? 'pos' : pnl[f] < 0 ? 'neg' : '',
    }))
    const porSetup = {}
    sesiones.forEach(s => { if (s.setup && pnl[s.sesion_date] != null) { const o = (porSetup[s.setup] ||= { n: 0, p: 0 }); o.n += n[s.sesion_date]; o.p += pnl[s.sesion_date] } })
    const setups = Object.entries(porSetup).sort((a, b) => b[1].p - a[1].p).map(([k, o]) => ({
      g: 'SETUPS', i: 'ti-bolt', go: 'analysis', t: k, h: `<b>${esc(k)}</b> · ${o.n} operaciones`, e: fmtDinero(o.p), c: o.p >= 0 ? 'pos' : 'neg',
    }))
    const errs = errores.filter(e => e.sesion_date).map(e => ({
      g: 'ERRORES', i: 'ti-alert-triangle', fecha: e.sesion_date,
      t: `${e.casuistica || ''} ${e.descripcion || ''} ${e.sesion_date}`,
      h: `<b>${esc(e.casuistica || 'Error')}</b> · ${esc(e.sesion_date.split('-').reverse().join('/'))}${e.descripcion ? ' · ' + esc(e.descripcion) : ''}`,
    }))
    const obs = []
    sesiones.forEach(s => ['analisis_trader', 'resumen_ia', 'motivo_no_opero', 'motivo_no_entrada'].forEach(k => {
      if (s[k] && String(s[k]).length > 3) obs.push({ g: 'OBSERVACIONES', i: 'ti-message-2', fecha: s.sesion_date, t: `${s[k]} ${s.sesion_date}`, h: `<b>${esc(s.sesion_date.split('-').reverse().join('/'))}</b> · ${esc(s[k])}` })
    }))
    datos = { dias, setups, errs, obs }
    return datos
  }
  const pantallas = () => Object.entries(Nav.sections).map(([id, name]) => ({ g: 'IR A', i: 'ti-arrow-right', go: id, t: name, h: `<b>${esc(name)}</b>` }))
  const ACC = () => [
    { g: 'ACCIONES', i: 'ti-plus', mas: 1, t: 'Registrar la sesión de hoy', h: '<b>Registrar la sesión de hoy</b>' },
    { g: 'ACCIONES', i: 'ti-sun', fn: () => alternarTema(), t: 'Cambiar tema claro oscuro', h: '<b>Cambiar entre tema claro y oscuro</b>' },
  ]
  let vis = [], sel = 0
  const norm = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  async function listar() {
    const q = norm($('palIn').value.trim()), ls = $('palLs')
    let res
    if (!q) res = [...pantallas().slice(0, 4), ...ACC()]
    else {
      const si = x => norm(x.t).includes(q)
      const d = datos || (ls.innerHTML = '<div class="pal-vacio cargando-brillo" style="height:60px"></div>', await cargarDatos())
      const tope = (arr, n) => arr.filter(si).slice(0, n)
      res = [...tope(pantallas(), 3), ...tope(d.dias, 5), ...tope(d.setups, 4), ...tope(d.errs, 4), ...tope(d.obs, 4), ...tope(ACC(), 2)]
    }
    vis = res; sel = Math.min(sel, Math.max(0, vis.length - 1))
    let g = ''
    ls.innerHTML = vis.length ? vis.map((x, i) => (x.g !== g ? ((g = x.g), `<small>${g}</small>`) : '') +
      `<button type="button" class="pal-it ${i === sel ? 'sel' : ''}" data-p="${i}"><i class="ti ${x.i}"></i><span>${x.h}</span>${x.e ? `<em class="${x.c}">${x.e}</em>` : ''}${i === sel ? '<kbd>Enter</kbd>' : ''}</button>`).join('')
      : '<div class="pal-vacio">Nada con ese nombre</div>'
    ls.querySelector('.sel')?.scrollIntoView({ block: 'nearest' })
  }
  function elegir(i) {
    const x = vis[i]; if (!x) return
    cerrarPal()
    if (x.fn) x.fn()
    else if (x.mas) irARegistrar()
    else if (x.fecha) Calendarios.abrirVisor('mio', x.fecha)
    else if (x.go) Nav.go(x.go)
  }
  function abrirPal() {
    cerrarHoja()
    $('pal').classList.add('ab'); $('palIn').value = ''; sel = 0; listar(); $('palIn').focus()
    cargarDatos()
  }
  const cerrarPal = () => $('pal')?.classList.remove('ab')
  function montarPal() {
    const p = document.createElement('div')
    p.className = 'pal'; p.id = 'pal'
    p.innerHTML = `<div class="pal-caja" role="dialog" aria-label="Buscar"><div class="pal-in"><i class="ti ti-search"></i>
      <input id="palIn" placeholder="Un día, un setup, un error o una observación…" autocomplete="off"><kbd>Esc</kbd></div><div class="pal-ls" id="palLs"></div></div>`
    document.body.appendChild(p)
    $('palIn').addEventListener('input', () => { sel = 0; listar() })
    p.addEventListener('click', e => { const b = e.target.closest('[data-p]'); if (b) elegir(+b.dataset.p); else if (e.target === p) cerrarPal() })
    addEventListener('keydown', e => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); abrirPal(); return }
      if (!p.classList.contains('ab')) return
      if (e.key === 'Escape') { e.stopImmediatePropagation(); cerrarPal() }
      else if (e.key === 'ArrowDown') { e.preventDefault(); sel = (sel + 1) % Math.max(1, vis.length); listar() }
      else if (e.key === 'ArrowUp') { e.preventDefault(); sel = (sel - 1 + vis.length) % Math.max(1, vis.length); listar() }
      else if (e.key === 'Enter') { e.preventDefault(); elegir(sel) }
    }, true)
  }

  // ── El botón «+»: la sesión de hoy ──
  function irARegistrar() {
    Nav.go('register')
    const inp = $('sesionDate'), hoy = hoyISO()
    if (inp && esDiaHabil(hoy) && inp.value !== hoy) { inp.value = hoy; inp.dispatchEvent(new Event('change', { bubbles: true })) }
  }

  // ── La isla ──
  function montarIsla() {
    const b = document.createElement('button')
    b.type = 'button'; b.className = 'isla'; b.id = 'isla'; b.setAttribute('aria-expanded', 'false')
    b.innerHTML = '<span class="il"><i class="pt"></i><span id="islaT"></span><i class="ti ti-chevron-down" style="opacity:.5"></i></span><span class="ix" id="islaX"></span>'
    document.body.appendChild(b)
    addEventListener('scroll', () => { if (!b.classList.contains('ab')) b.classList.toggle('ve', scrollY > 240) }, { passive: true })
    b.addEventListener('click', () => {
      const ab = !b.classList.contains('ab')
      vt(() => { b.classList.toggle('ab', ab); b.setAttribute('aria-expanded', ab) })
      if (ab) estadoHoy()
    })
    document.addEventListener('click', e => { if (!e.target.closest('#isla') && b.classList.contains('ab')) b.classList.remove('ab') })
  }
  function textoIsla() {
    const act = Nav.actual?.() || ''
    const t = `${Nav.sections[act] || ''}${Nav.CONTEXTO?.[act] ? ' · ' + Nav.CONTEXTO[act] : ''}`
    const p = typeof Portada !== 'undefined' && Portada.resumen?.()
    return act === 'calendar' && p ? `${t} · ${p}` : t
  }
  async function estadoHoy() {
    const x = $('islaX'), hoy = hoyISO()
    x.innerHTML = '<span class="cargando-brillo" style="height:18px"></span><span class="cargando-brillo" style="height:18px"></span>'
    const [bot, motor, ses, trs] = await Promise.all([
      DB.getBotOperaciones().then(r => r.filter(o => o.fecha === hoy)).catch(() => null),
      DB.motorEstado(hoy).catch(() => null),
      DB.getSesionByDate(hoy).catch(() => null),
      DB.getTradesByDate(hoy).catch(() => []),
    ])
    const b = bot?.at(-1)
    const tBot = bot == null ? 'sin datos' : !b ? 'aún sin fila de hoy' : b.resultado === 'NO ARMADO' ? `no se armó${b.motivo ? ' · ' + esc(b.motivo) : ''}` : esc(b.resultado || 'armado')
    const tMot = { sin_ficha: 'sin ficha todavía', bloqueada: 'ficha lista (registra tu día para verla)', abierta: 'ficha lista' }[motor] || esc(motor || 'sin datos')
    const pnl = (trs || []).reduce((s, t) => s + (parseFloat(t.profit) || 0), 0)
    x.innerHTML = `<span><i class="ti ti-cpu"></i>Bot: <b>${tBot}</b></span><span><i class="ti ti-wave-square"></i>Motor: <b>${tMot}</b></span>
      <span><i class="ti ti-notebook"></i>Tu día: <b>${ses?.registrada_at ? 'registrado' : 'sin registrar'}</b>${trs?.length ? ` · ${trs.length} trade${trs.length > 1 ? 's' : ''} · ${fmtDinero(pnl)}` : ''}</span>`
  }

  // ── El día sale de su casilla hacia el visor, y vuelve a ella ──
  let celda = null
  function montarDia() {
    document.addEventListener('pointerdown', e => { celda = e.target.closest('.cal-cell') }, true)
    const abrir = Visor.abrir.bind(Visor), quitar = Visor._quitar.bind(Visor)
    Visor.abrir = function (o) {
      const c = celda; celda = null
      if (!document.startViewTransition || quieto || !c || !document.contains(c) || Visor.abierto()) return abrir(o)
      c.style.viewTransitionName = 'dia'
      document.startViewTransition(() => {
        c.style.viewTransitionName = ''
        abrir(o)
        Visor._el.querySelector('.ld-marco').style.viewTransitionName = 'dia'
        Visor._celda = c
      }).finished.finally(() => { if (Visor._el) Visor._el.querySelector('.ld-marco').style.viewTransitionName = '' })
    }
    Visor._quitar = function () {
      const c = Visor._celda; Visor._celda = null
      if (!document.startViewTransition || quieto || !c || !document.contains(c) || !Visor.abierto()) return quitar()
      Visor._el.querySelector('.ld-marco').style.viewTransitionName = 'dia'
      document.startViewTransition(() => {
        Visor._el.querySelector('.ld-marco').style.viewTransitionName = ''
        quitar()
        c.style.viewTransitionName = 'dia'
      }).finished.finally(() => { c.style.viewTransitionName = '' })
    }
  }

  // ── Arranque ──
  // Se envuelve Nav.go para marcar la opción activa: el menú responde en el momento del toque.
  const go = Nav.go.bind(Nav)
  Nav.go = function (id) {
    cerrarHoja(); cerrarPal()
    const r = go(id)
    marcar()
    $('islaT') && ($('islaT').textContent = textoIsla())
    return r
  }

  function init() {
    if (lee('tema') === 'claro') document.documentElement.dataset.tema = 'claro'
    montarLateral(); montarDock(); montarPal(); montarIsla(); montarDia()
    document.addEventListener('click', e => {
      const g = e.target.closest('[data-go]')
      if (g && (g.closest('#sb') || g.closest('#dock') || g.closest('#hoja'))) { Nav.go(g.dataset.go); return }
      if (e.target.closest('[data-mas]')) { irARegistrar(); return }
      if (e.target.closest('[data-hoja]')) { abrirHoja(); return }
      if (e.target.closest('[data-buscar]')) { abrirPal(); return }
      const t = e.target.closest('[data-tema]'); if (t) { ponerTema(tema() === 'claro' ? 'oscuro' : 'claro', t) }
    })
    addEventListener('resize', () => marcar())
    // el texto de la isla sigue al contexto de cada pantalla (mes, período…)
    const sc = $('sectionContext')
    if (sc) new MutationObserver(() => { $('islaT').textContent = textoIsla() }).observe(sc, { childList: true, characterData: true, subtree: true })
    marcar()
  }
  // el tema se pone antes de pintar nada, para que no parpadee
  if (lee('tema') === 'claro') document.documentElement.dataset.tema = 'claro'

  return { init, marcar, abrirPal, irARegistrar }
})()

document.addEventListener('DOMContentLoaded', () => Marco.init())
