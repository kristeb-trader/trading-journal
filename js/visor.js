// ── El visor del día ───────────────────────────────────────────────────────
// Una sola pantalla para ver un día (Kris, 03/11/2026): sustituye a la vista del día con su gráfico fijo y a
// la lupa que se abría encima, que enseñaban la misma imagen dos veces. Arriba, la placa con la fecha; en
// medio, el gráfico maximizado; abajo, el banner con el resultado (con el relieve del color del resultado)
// y un enlace discreto al análisis del día, que se abre en una hoja por encima y solo se pide al abrirla.
//
// Recorre una LISTA de días: la del calendario desde el que se entró, o lo filtrado en Trades. Cada día es
// { fecha, fuente, url? }: la fuente (mio · chaumer · bot · manual) dice de dónde salen el banner y el
// análisis (Calendarios.diaVisor). ← / → , las flechas o deslizar pasan de día; A abre el análisis; Esc
// cierra la hoja y, otro Esc, el visor. El día de antes y el de después se piden por adelantado.
// Un clic en el gráfico (o Z) lo acerca al punto clicado y se recorre moviendo el ratón o el dedo; otro clic
// lo devuelve. El botón «atrás» del celular cierra el visor en vez de salir de la app.
// La tira de días (12/11/2026, opción B): oculta tras el enlace «Días» (o D), una miniatura por día con el
// borde de su resultado; un clic salta a ese día. Recuerda si se dejó abierta.
const Visor = {
  _el: null,
  _items: [],       // [{ fecha, fuente, url? }], del más viejo al más nuevo
  _i: 0,
  _cargada: false,  // la lista completa ya llegó (si no, solo está el día abierto)
  _cache: null,     // `${fuente}|${fecha}` → Promise<día>
  _token: 0,
  _hoja: false,     // la hoja del análisis, abierta (se queda abierta al pasar de día)
  _zoom: false,     // el gráfico, acercado
  _url: null,       // la URL original del gráfico que se ve (para pedirlo en grande al acercar)
  _tira: false,     // la tira de días, abierta (se recuerda entre aperturas: localStorage)
  _tonos: null,     // `${fuente}|AAAA-MM` → Promise<{ fecha: tono }>, por apertura
  TIRA_KEY: 'visorTira',

  // items: la lista o una promesa de ella. actual: { fecha, fuente } con el que se abre, aunque la lista
  // aún no haya llegado. titulo: de dónde viene el recorrido («Mío», «Trades · Reingreso»).
  abrir({ items, actual, titulo = '' }) {
    if (!this._el) this._montar()
    this._cache = new Map()
    this._tonos = new Map()
    this._items = [actual]
    this._i = 0
    this._cargada = false
    this._hoja = false
    this._el.querySelector('.vs-ctx').textContent = titulo
    // Una entrada en el historial: el «atrás» del celular (o del navegador) cierra el visor.
    if (!this.abierto() && history.state?.visor !== 1) history.pushState({ visor: 1 }, '')
    this._el.classList.remove('hidden')
    document.body.classList.add('modal-open')
    try { this._tira = localStorage.getItem(this.TIRA_KEY) === '1' } catch { this._tira = false }
    this._pintarHoja()
    this._pintarTira()
    this._pintar()
    Promise.resolve(items).then(lista => {
      if (this._el.classList.contains('hidden') || this._items[0] !== actual) return
      lista = (lista || []).slice()
      let i = lista.findIndex(x => x.fecha === actual.fecha && x.fuente === actual.fuente)
      if (i < 0) {
        lista.push(actual)
        lista.sort((a, b) => (a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : 0))
        i = lista.indexOf(actual)
      }
      this._items = lista
      this._i = i
      this._cargada = true
      this._cabecera()
      this._precargar()
      this._pintarTira()
    }).catch(err => console.warn('[visor] lista:', err))
  },

  cerrar() {
    if (!this.abierto()) return
    // Si el visor dejó su entrada en el historial, se gasta: al volver, popstate lo cierra (_quitar).
    if (history.state?.visor === 1) history.back()
    else this._quitar()
  },

  _quitar() {
    if (!this.abierto()) return
    this._quitarZoom()
    this._el.classList.add('hidden')
    this._token++
    if (document.getElementById('dayModal')?.classList.contains('hidden') !== false) document.body.classList.remove('modal-open')
  },

  abierto() { return !!this._el && !this._el.classList.contains('hidden') },

  // ── Piezas del banner, para quien lo arma (Calendarios.diaVisor, Modal.bannerDia) ──
  celda(lab, val, cls = '') { return `<div class="mh-stat ${cls}"><label>${lab}</label>${val}</div>` },
  // Puntos exactos con su signo y coma decimal: +34 · −47,5 · +34,25
  pts(v) { return `${v < 0 ? '−' : v > 0 ? '+' : ''}${Math.abs(v).toLocaleString('es-ES', { maximumFractionDigits: 2 })}` },

  _montar() {
    const el = document.createElement('div')
    el.className = 'ld vs hidden'
    el.setAttribute('role', 'dialog')
    el.setAttribute('aria-modal', 'true')
    el.setAttribute('aria-label', 'Gráfico del día')
    el.innerHTML = `
      <header class="ld-placa ld-arriba">
        <div class="vs-izq"><span class="vs-ctx"></span></div>
        <div class="ld-titulo"><span class="ld-quien"></span><h2 class="ld-fecha"></h2></div>
        <div class="ld-der">
          <span class="ld-cuenta"></span>
          <button class="ld-cerrar vs-tres" type="button" title="Las 3 gráficas del día: la mía, la del Bot y la de Chaumer" aria-label="Las 3 gráficas del día"><i class="ti ti-layout-rows"></i></button>
          <button class="ld-cerrar vs-x" type="button" title="Cerrar (Esc)" aria-label="Cerrar"><i class="ti ti-x"></i></button>
        </div>
      </header>
      <div class="ld-marco">
        <button class="ld-paso ld-ant" type="button" title="Día anterior (←)" aria-label="Día anterior"><i class="ti ti-chevron-left"></i></button>
        <img class="ld-img" alt="">
        <div class="vs-sin-img hidden"><i class="ti ti-photo-off"></i><span>Sin gráfico de este día</span></div>
        <button class="ld-paso ld-sig" type="button" title="Día siguiente (→)" aria-label="Día siguiente"><i class="ti ti-chevron-right"></i></button>
      </div>
      <footer class="vs-abajo">
        <div class="mh-box vs-banner tone-o"></div>
        <div class="vs-tira hidden" role="list" aria-label="Días"></div>
        <div class="vs-enlaces">
          <button class="vs-mas" type="button" title="Análisis del día (A)"><i class="ti ti-chevron-up"></i> <span>Análisis del día</span></button>
          <button class="vs-mas vs-dias" type="button" title="Todos los días, en miniatura (D)" aria-pressed="false"><i class="ti ti-layout-columns"></i> <span>Días</span></button>
        </div>
      </footer>
      <aside class="vs-hoja hidden" aria-label="Análisis del día">
        <div class="vs-hoja-cab">
          <span class="vs-hoja-tit">Análisis del día</span>
          <button class="ld-cerrar vs-hoja-x" type="button" title="Ocultar el análisis (Esc)" aria-label="Ocultar el análisis"><i class="ti ti-chevron-down"></i></button>
        </div>
        <div class="vs-hoja-cuerpo"><div class="dv-body"></div></div>
      </aside>`
    document.body.appendChild(el)

    el.addEventListener('click', e => {
      if (e.target === el || e.target.closest('.vs-x')) this.cerrar()
      else if (e.target.closest('.ld-ant')) this._mover(-1)
      else if (e.target.closest('.ld-sig')) this._mover(1)
      else if (e.target.closest('.vs-dias')) this._alternarTira()
      else if (e.target.closest('.vs-mini')) this._ir(+e.target.closest('.vs-mini').dataset.i)
      else if (e.target.closest('.vs-mas') || e.target.closest('.vs-hoja-x')) this._alternarHoja()
      else if (e.target.closest('.vs-tres')) TresGraficas.open(this._items[this._i].fecha)
    })
    // En el celular, deslizar sobre el gráfico: a la izquierda, el día siguiente. Acercado, el dedo lo recorre.
    const marco = el.querySelector('.ld-marco')
    el.querySelector('.ld-img').addEventListener('click', e => this._alternarZoom(e))
    marco.addEventListener('mousemove', e => { if (this._zoom) this._origen(e) })
    let x0 = null, y0 = null
    marco.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY }, { passive: true })
    marco.addEventListener('touchmove', e => { if (this._zoom) this._origen(e.touches[0]) }, { passive: true })
    marco.addEventListener('touchend', e => {
      if (x0 == null || this._zoom) { x0 = null; return }
      const dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0
      x0 = null
      if (Math.abs(dx) > 60 && Math.abs(dx) > 1.5 * Math.abs(dy)) this._mover(dx < 0 ? 1 : -1)
    })
    // En captura y cortando: debajo puede haber otras pantallas que también escuchan Esc y las flechas.
    // Las 3 gráficas, abiertas encima, mandan sobre el teclado.
    window.addEventListener('keydown', e => {
      if (!this.abierto() || TresGraficas.abierta()) return
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target?.tagName)) return
      const tecla = {
        Escape: () => (this._zoom ? this._quitarZoom() : this._hoja ? this._alternarHoja() : this.cerrar()),
        ArrowLeft: () => this._mover(-1),
        ArrowRight: () => this._mover(1),
        a: () => this._alternarHoja(), A: () => this._alternarHoja(),
        z: () => this._alternarZoom(), Z: () => this._alternarZoom(),
        d: () => this._alternarTira(), D: () => this._alternarTira(),
      }[e.key]
      if (!tecla) return
      e.stopImmediatePropagation()
      e.preventDefault()
      tecla()
    }, true)
    // El gráfico se queda con el alto que dejan la placa y el banner: las tres piezas van juntas y
    // centradas. Si cambia la pantalla o el banner (un día con dos operaciones), se vuelve a medir.
    // El «atrás»: con las 3 gráficas encima, cierra solo esas y el visor sigue (vuelve a dejar su entrada).
    window.addEventListener('popstate', () => {
      if (!this.abierto()) return
      if (TresGraficas.abierta()) { TresGraficas.close(); history.pushState({ visor: 1 }, ''); return }
      this._quitar()
    })
    const ro = new ResizeObserver(() => this._medir())
    ;[el, el.querySelector('.ld-arriba'), el.querySelector('.vs-abajo')].forEach(n => ro.observe(n))
    this._el = el
  },

  _medir() {
    const el = this._el
    if (!this.abierto()) return
    const cs = getComputedStyle(el)
    const libre = el.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom)
      - el.querySelector('.ld-arriba').offsetHeight - el.querySelector('.vs-abajo').offsetHeight
      - 2 * (parseFloat(cs.rowGap) || 0)
    el.style.setProperty('--ld-alto', `${Math.max(120, Math.floor(libre))}px`)
  },

  _mover(d) { this._ir(this._i + d) },

  _ir(n) {
    if (!(n >= 0 && n < this._items.length) || n === this._i) return
    this._quitarZoom()
    this._i = n
    this._pintar()
  },

  // El día de una fuente, pedido una sola vez por apertura del visor.
  _dia(item) {
    const k = `${item.fuente}|${item.fecha}`
    if (!this._cache.has(k)) {
      this._cache.set(k, Calendarios.diaVisor(item.fuente, item.fecha).catch(err => {
        console.warn('[visor]', k, err)
        return { error: true, tono: 'o', celdas: this.celda('Resultado', '<span class="cz-rb r-o">SIN DATOS</span>') +
          '<div class="mh-stat vs-nota"><span>No se pudo leer este día</span></div>' }
      }))
    }
    return this._cache.get(k)
  },

  // Los dos vecinos: su día y su gráfico, ya pedidos.
  _precargar() {
    ;[this._items[this._i - 1], this._items[this._i + 1]].forEach(it => {
      if (!it) return
      this._dia(it).then(d => { const u = it.url || d?.url; if (u) new Image().src = imgOpt(u) })
    })
  },

  // Fecha, quién y la cuenta «12 de 47»; las flechas, apagadas en los extremos.
  _cabecera() {
    const el = this._el, it = this._items[this._i]
    const f = Calendarios.FUENTE[it.fuente] || { nombre: '', color: 'neutro' }
    el.style.setProperty('--c', f.color === 'neutro' ? 'var(--text2)' : `var(--${f.color}-txt)`)
    el.querySelector('.ld-quien').textContent = f.nombre
    const largo = new Date(`${it.fecha}T12:00:00`).toLocaleDateString('es-CO',
      { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    el.querySelector('.ld-fecha').textContent = largo.charAt(0).toUpperCase() + largo.slice(1)
    el.querySelector('.ld-cuenta').textContent = this._cargada ? `${this._i + 1} de ${this._items.length}` : '…'
    el.querySelector('.ld-ant').disabled = this._i === 0
    el.querySelector('.ld-sig').disabled = this._i === this._items.length - 1
    return largo
  },

  _ponerImagen(url, largo) {
    const img = this._el.querySelector('.ld-img'), sin = this._el.querySelector('.vs-sin-img')
    img.classList.toggle('hidden', !url)
    sin.classList.toggle('hidden', !!url)
    this._url = url || null
    if (url) {
      const src = imgOpt(url)
      if (img.getAttribute('src') !== src) { img.src = src; this._entra(img) }
      img.alt = `Gráfico del ${largo}`
    } else img.removeAttribute('src')
  },

  // Las placas entran con un giro corto, como en el portal, y lo repiten al pasar de día.
  _entra(nodo) {
    nodo.classList.remove('entra')
    void nodo.offsetWidth
    nodo.classList.add('entra')
  },

  async _pintar() {
    const el = this._el, it = this._items[this._i], token = ++this._token
    const largo = this._cabecera()
    this._marcarTira()
    this._entra(el.querySelector('.ld-arriba'))
    // El gráfico sale ya si la lista trae su URL; si no (Trades), en cuanto llega el día.
    if (it.url) this._ponerImagen(it.url, largo)
    const abajo = el.querySelector('.vs-abajo')
    abajo.classList.add('cargando')
    if (this._hoja) this._cuerpoHoja('<p class="vs-cargando"><i class="ti ti-loader-2"></i> Cargando…</p>')
    this._precargar()

    const d = await this._dia(it)
    if (token !== this._token) return   // ya se pasó a otro día
    if (!it.url) {
      this._ponerImagen(d.url, largo)
      // Trades no trae las URLs: el día ya visto pone su gráfico en su miniatura.
      if (d.url) { it.url = d.url; this._miniImagen(this._i) }
    }
    const banner = el.querySelector('.vs-banner')
    banner.className = `mh-box vs-banner tone-${d.tono || 'o'}`
    banner.innerHTML = d.celdas || ''
    abajo.classList.remove('cargando')
    this._entra(banner)
    el.querySelector('.vs-mas').classList.toggle('hidden', !d.analisis)
    if (this._hoja) this._cargarAnalisis(d, token)
  },

  // ── El zoom ──
  // Acercado, el gráfico se agranda alrededor del punto que hay bajo el ratón o el dedo (transform-origin),
  // así que moverlos lo recorre sin arrastrar. Al acercar se pide en grande (2560 px) para que no se vea borroso.
  _alternarZoom(e) {
    const img = this._el.querySelector('.ld-img')
    if (!this._url || img.classList.contains('hidden')) return
    if (this._zoom) { this._quitarZoom(); return }
    this._zoom = true
    img.classList.remove('entra')   // la animación de entrada deja su transform y taparía el del zoom
    this._el.querySelector('.ld-marco').classList.add('zoom')
    if (e && 'clientX' in e) this._origen(e)
    const grande = imgOpt(this._url, 2560), url = this._url
    if (img.getAttribute('src') !== grande) {
      const pre = new Image()
      pre.onload = () => { if (this._zoom && this._url === url) img.src = grande }
      pre.src = grande
    }
  },

  _quitarZoom() {
    if (!this._zoom) return
    this._zoom = false
    this._el.querySelector('.ld-marco').classList.remove('zoom')
    this._el.querySelector('.ld-img').style.transformOrigin = ''
  },

  // El punto bajo el puntero, en % de la imagen SIN escalar (centrada en el marco).
  _origen(p) {
    const img = this._el.querySelector('.ld-img'), m = img.parentElement.getBoundingClientRect()
    const x = (p.clientX - m.left - img.offsetLeft) / img.offsetWidth
    const y = (p.clientY - m.top - img.offsetTop) / img.offsetHeight
    const pc = v => `${Math.round(Math.min(1, Math.max(0, v)) * 1000) / 10}%`
    img.style.transformOrigin = `${pc(x)} ${pc(y)}`
  },

  // ── La tira de días ──
  // Una miniatura por día del recorrido (imagen de 240 px, perezosa: solo baja la que se ve), con la fecha y
  // el borde del resultado. El día abierto, resaltado y centrado. Abierta, le quita alto al gráfico (_medir).
  _alternarTira() {
    this._tira = !this._tira
    try { localStorage.setItem(this.TIRA_KEY, this._tira ? '1' : '0') } catch {}
    this._pintarTira()
  },

  _pintarTira() {
    const el = this._el, tira = el.querySelector('.vs-tira'), btn = el.querySelector('.vs-dias')
    tira.classList.toggle('hidden', !this._tira)
    btn.classList.toggle('abierta', this._tira)
    btn.setAttribute('aria-pressed', String(this._tira))
    if (!this._tira) { tira.innerHTML = ''; return }
    const dm = f => `${f.slice(8)}/${f.slice(5, 7)}`
    tira.innerHTML = this._items.map((it, i) => `
      <button type="button" class="vs-mini" role="listitem" data-i="${i}" title="${dm(it.fecha)}/${it.fecha.slice(0, 4)}">
        <span class="vs-mini-img">${it.url ? `<img loading="lazy" alt="" src="${imgOpt(it.url, 240)}">` : '<i class="ti ti-photo-off"></i>'}</span>
        <span class="vs-mini-f">${dm(it.fecha)}</span>
      </button>`).join('')
    this._marcarTira()
    this._tonosTira()
  },

  _miniImagen(i) {
    const caja = this._el.querySelector(`.vs-mini[data-i="${i}"] .vs-mini-img`), it = this._items[i]
    if (caja && it?.url) caja.innerHTML = `<img loading="lazy" alt="" src="${imgOpt(it.url, 240)}">`
  },

  // El día abierto, resaltado y centrado en la tira.
  _marcarTira() {
    if (!this._tira) return
    const tira = this._el.querySelector('.vs-tira')
    tira.querySelectorAll('.vs-mini.actual').forEach(b => { b.classList.remove('actual'); b.removeAttribute('aria-current') })
    const b = tira.querySelector(`.vs-mini[data-i="${this._i}"]`)
    if (!b) return
    b.classList.add('actual')
    b.setAttribute('aria-current', 'true')
    tira.scrollTo({ left: b.offsetLeft - (tira.clientWidth - b.offsetWidth) / 2,
                    behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
  },

  // Los bordes: el tono de cada día, pedido por mes y fuente (una lectura por mes, no por día).
  _tonosTira() {
    const grupos = new Map()
    this._items.forEach((it, i) => {
      const k = `${it.fuente}|${it.fecha.slice(0, 7)}`
      if (!grupos.has(k)) grupos.set(k, [])
      grupos.get(k).push(i)
    })
    const items = this._items
    grupos.forEach((idx, k) => {
      if (!this._tonos.has(k)) {
        const [fuente, ym] = k.split('|'), [y, m] = ym.split('-').map(Number)
        this._tonos.set(k, Calendarios.tonosMes(fuente, y, m).catch(err => { console.warn('[visor] tonos', k, err); return {} }))
      }
      this._tonos.get(k).then(tonos => {
        if (this._items !== items || !this._tira) return
        idx.forEach(i => {
          const t = tonos[items[i].fecha]
          if (t) this._el.querySelector(`.vs-mini[data-i="${i}"]`)?.classList.add(`tone-${t}`)
        })
      })
    })
  },

  // ── La hoja del análisis ──
  _alternarHoja() {
    this._hoja = !this._hoja
    this._pintarHoja()
    const token = this._token
    if (this._hoja) this._dia(this._items[this._i]).then(d => this._cargarAnalisis(d, token))
  },

  _pintarHoja() {
    const el = this._el
    el.querySelector('.vs-hoja').classList.toggle('hidden', !this._hoja)
    el.querySelector('.vs-mas').classList.toggle('abierta', this._hoja)
    if (this._hoja) this._entra(el.querySelector('.vs-hoja'))
  },

  _cuerpoHoja(html) {
    const c = this._el.querySelector('.vs-hoja .dv-body')
    c.innerHTML = html
    c.parentElement.scrollTop = 0
    return c
  },

  async _cargarAnalisis(d, token) {
    if (!d?.analisis) { this._cuerpoHoja('<p class="modal-empty-sub">Este día no tiene análisis.</p>'); return }
    this._cuerpoHoja('<p class="vs-cargando"><i class="ti ti-loader-2"></i> Cargando…</p>')
    let a
    try { a = await d.analisis() }
    catch (err) { console.warn('[visor] análisis:', err); a = { html: '<p class="modal-empty-sub">No se pudo leer el análisis de este día.</p>' } }
    if (token !== this._token || !this._hoja) return
    const c = this._cuerpoHoja(a.html || '<p class="modal-empty-sub">Este día aún no tiene análisis.</p>')
    a.wire?.(c)
  },
}
