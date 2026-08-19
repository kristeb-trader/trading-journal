// Comparador Chaumer vs yo — pestaña "Día"
//
// Su lado sale de `chaumer_operativas`; el mío, de `sesiones` + `trades`. Aquí
// no se guarda nada mío: se lee.
//
// El veredicto del día NO se persiste — se calcula cada vez cruzando las tres
// fuentes, así que no puede quedarse obsoleto cuando cambia cualquiera de ellas.
//
// Las dos horas se comparan en ET. `trades.entry_time` viene de NinjaTrader en
// hora de Colombia y pasa por `horaEt()` antes de restar; su `hora_entrada` ya
// se guarda en ET. Restarlas a pelo daría 60 min de error medio año.
//
// Diseño: docs/disenos/2026-08-19-chaumer-vs-yo.md (v2), Fase 2 de 4.

const Chaumer = (() => {

  // Los seis estados del diseño §3, más "sin cargar" — que no es un estado del
  // día sino la ausencia del dato, y se ve distinto a propósito.
  const ESTADOS = {
    igual:        { label: 'Igual',                     cls: 'ch-v-igual',   icon: 'ti-check' },
    ejecucion:    { label: 'Mismo setup · ejecución',   cls: 'ch-v-ejec',    icon: 'ti-clock-exclamation' },
    otra_lectura: { label: 'Otra lectura',              cls: 'ch-v-otra',    icon: 'ti-arrows-split' },
    fuga:         { label: 'Fuga · él operó, tú no',    cls: 'ch-v-fuga',    icon: 'ti-arrow-down-right' },
    de_mas:       { label: 'De más · tú operaste, él no', cls: 'ch-v-demas', icon: 'ti-arrow-up-right' },
    ambos_fuera:  { label: 'Ninguno operó',             cls: 'ch-v-nada',    icon: 'ti-minus' },
    sin_cargar:   { label: 'Sin cargar su operativa',   cls: 'ch-v-sin',     icon: 'ti-help-circle' },
  }

  const MOTIVOS = ['No lo vi', 'Duda', 'Miedo', 'Zona naranja', 'Desconfianza', 'Otro']
  const RESULTADOS = { target: 'Target', stop: 'Stop', be: 'Break-even', parcial: 'Parcial' }

  // Δ de hora a partir del cual la entrada deja de considerarse "la misma".
  const TOLERANCIA_MIN = 5

  let fecha = null
  let variantes = []      // catalogo_setup_variantes, para nombres y desplegables
  let datos = null        // { ch, sesion, trades } del día en pantalla

  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
  const nombreVariante = cod => variantes.find(v => v.codigo === cod)?.nombre || cod || '—'
  const fmtPts = n => (n == null ? '—' : `${n > 0 ? '+' : ''}${String(n).replace('.', ',')} pts`)

  // ── Mi lado, normalizado ──────────────────────────────────────────────────
  // Los trades del día NO se filtran por cuenta principal, igual que en Sesión
  // Operativa: lo que se compara es si operé, no en qué cuenta.
  function miLado(sesion, trades) {
    const opero = trades.length > 0
    const pts = trades.map(t => puntosTrade(t)).filter(n => n != null)
    return {
      opero,
      setup_codigo: sesion?.setup_codigo || null,
      hora_et: opero ? horaEt(trades[0].entry_time, fecha) : null,
      resultado: opero ? trades[0].resultado : null,
      puntos: pts.length ? Math.round(pts.reduce((a, b) => a + b, 0) * 100) / 100 : null,
      dinero: opero ? trades.reduce((a, t) => a + (parseFloat(t.profit) || 0), 0) : null,
      confianza: sesion?.nivel_confianza || null,
      notas: sesion?.analisis_trader || null,
      imagen: sesion?.imagen_url || null,
      // El "por qué no operé" del día ("Sin setup", "Noticia roja"…). En un día
      // sin operación es lo único que explica el gráfico que se está mirando.
      motivoNoOpero: sesion?.motivo_no_opero || null,
      nTrades: trades.length,
    }
  }

  // ── El veredicto ──────────────────────────────────────────────────────────
  function veredicto(ch, yo) {
    if (!ch) return { k: 'sin_cargar', diffs: [] }
    const elOpero = !!(ch.opero && ch.setup_codigo)
    if (!elOpero && !yo.opero) return { k: 'ambos_fuera', diffs: [] }
    if (elOpero && !yo.opero)  return { k: 'fuga', diffs: [] }
    if (!elOpero && yo.opero)  return { k: 'de_mas', diffs: [] }

    const diffs = []
    const dMin = difMinutos(ch.hora_entrada, yo.hora_et)

    if (ch.setup_codigo !== yo.setup_codigo) {
      diffs.push({ mal: true, txt: `Él ${nombreVariante(ch.setup_codigo)} · tú ${nombreVariante(yo.setup_codigo)}` })
      return { k: 'otra_lectura', diffs }
    }
    diffs.push({ mal: false, txt: 'Mismo setup' })

    if (ch.resultado !== yo.resultado) {
      diffs.push({ mal: true, txt: `Él ${RESULTADOS[ch.resultado] || '—'} · tú ${RESULTADOS[yo.resultado] || '—'}` })
    } else {
      diffs.push({ mal: false, txt: 'Mismo resultado' })
    }

    if (dMin != null && Math.abs(dMin) > TOLERANCIA_MIN) {
      diffs.push({ mal: true, txt: `Entraste ${Math.abs(dMin)} min ${dMin > 0 ? 'después' : 'antes'}` })
    } else if (dMin != null) {
      diffs.push({ mal: false, txt: `Entrada a la vez (${dMin >= 0 ? '+' : ''}${dMin} min)` })
    }

    if (ch.puntos != null && yo.puntos != null) {
      const d = Math.round((yo.puntos - ch.puntos) * 100) / 100
      if (Math.abs(d) >= 1) diffs.push({ mal: d < 0, txt: `${fmtPts(d)} que él` })
    }

    const mismoResultado = ch.resultado === yo.resultado
    const aTiempo = dMin == null || Math.abs(dMin) <= TOLERANCIA_MIN
    return { k: (mismoResultado && aTiempo) ? 'igual' : 'ejecucion', diffs }
  }

  // ── Pintado ───────────────────────────────────────────────────────────────
  // El gráfico es el del DÍA, no el de la operación: existe igual en los días en
  // que no hubo setup, y son justo los días en que ver el gráfico explica por qué
  // no lo hubo. Por eso se pinta también cuando no se operó.
  function imgBloque(url, alt) {
    return url
      ? `<img class="ch-img" src="${esc(url)}" alt="${esc(alt)}" data-act="zoom">`
      : `<div class="ch-img ch-img-off"><i class="ti ti-photo-off"></i></div>`
  }

  function ladoChaumer(ch) {
    if (!ch) {
      return `
        <div class="ch-lado ch-lado-el ch-vacio">
          <div class="ch-lado-tit">Chaumer</div>
          <i class="ti ti-cloud-off ch-vacio-ico"></i>
          <p class="ch-vacio-txt">Sin cargar su operativa de este día.</p>
          <button type="button" class="btn-primary" data-act="editar">
            <i class="ti ti-plus"></i> Registrar su operativa
          </button>
        </div>`
    }
    if (!ch.opero) {
      return `
        <div class="ch-lado ch-lado-el">
          <div class="ch-lado-tit">Chaumer <button type="button" class="ch-edit" data-act="editar" title="Editar"><i class="ti ti-pencil"></i></button></div>
          ${imgBloque(ch.imagen_url, 'Gráfico de Chaumer')}
          <div class="ch-nooper"><i class="ti ti-minus"></i> No operó</div>
          ${ch.motivo_no_opero ? `<p class="ch-notas">${esc(ch.motivo_no_opero)}</p>` : ''}
          ${ch.notas ? `<p class="ch-notas">${esc(ch.notas)}</p>` : ''}
        </div>`
    }
    return `
      <div class="ch-lado ch-lado-el">
        <div class="ch-lado-tit">Chaumer <button type="button" class="ch-edit" data-act="editar" title="Editar"><i class="ti ti-pencil"></i></button></div>
        ${imgBloque(ch.imagen_url, 'Gráfico de Chaumer')}
        <div class="ch-setup">${esc(nombreVariante(ch.setup_codigo))}</div>
        <dl class="ch-campos">
          <dt>Resultado</dt><dd class="${ch.puntos > 0 ? 'pos' : ch.puntos < 0 ? 'neg' : ''}">${RESULTADOS[ch.resultado] || '—'} · ${fmtPts(ch.puntos)}</dd>
          <dt>Entrada</dt><dd>${ch.hora_entrada ? esc(String(ch.hora_entrada).slice(0, 5)) + ' ET' : '—'}</dd>
          <dt>Contexto</dt><dd>${esc(ch.contexto || '—')}</dd>
        </dl>
        ${ch.notas ? `<p class="ch-notas">${esc(ch.notas)}</p>` : ''}
      </div>`
  }

  function ladoYo(yo) {
    if (!yo.opero) {
      return `
        <div class="ch-lado ch-lado-yo">
          <div class="ch-lado-tit">Yo</div>
          ${imgBloque(yo.imagen, 'Mi gráfico')}
          <div class="ch-nooper"><i class="ti ti-minus"></i> No operé${yo.motivoNoOpero ? ` · ${esc(yo.motivoNoOpero)}` : ''}</div>
          ${yo.notas ? `<p class="ch-notas">${esc(yo.notas)}</p>` : ''}
        </div>`
    }
    return `
      <div class="ch-lado ch-lado-yo">
        <div class="ch-lado-tit">Yo</div>
        ${imgBloque(yo.imagen, 'Mi gráfico')}
        <div class="ch-setup">${esc(nombreVariante(yo.setup_codigo))}</div>
        <dl class="ch-campos">
          <dt>Resultado</dt><dd class="${yo.puntos > 0 ? 'pos' : yo.puntos < 0 ? 'neg' : ''}">${RESULTADOS[yo.resultado] || '—'} · ${fmtPts(yo.puntos)}</dd>
          <dt>Entrada</dt><dd>${yo.hora_et ? esc(yo.hora_et) + ' ET' : '—'}</dd>
          <dt>Confianza</dt><dd>${yo.confianza ? '★'.repeat(yo.confianza) + '☆'.repeat(5 - yo.confianza) : '—'}</dd>
        </dl>
        ${yo.notas ? `<p class="ch-notas">${esc(yo.notas)}</p>` : ''}
      </div>`
  }

  // Bloque de motivo: solo en las fugas, y solo si aún no está declarado.
  function bloqueFuga(ch, sesion) {
    const ya = sesion?.setup_valido_no_tomado && sesion?.motivo_no_entrada
    if (ya) {
      return `
        <div class="ch-fuga ch-fuga-ok">
          <i class="ti ti-check"></i>
          Motivo declarado: <strong>${esc(sesion.motivo_no_entrada)}</strong>
          ${sesion.setup_observado ? ` · setup visto: ${esc(sesion.setup_observado)}` : ''}
        </div>`
    }
    return `
      <div class="ch-fuga">
        <div class="ch-fuga-tit">Él operó ${esc(nombreVariante(ch.setup_codigo))} y tú no entraste. ¿Por qué?</div>
        <div class="btn-group ch-motivos">
          ${MOTIVOS.map(m => `<button type="button" class="btn-option" data-motivo="${esc(m)}">${esc(m)}</button>`).join('')}
        </div>
        <p class="ch-fuga-nota">Se guarda en tu sesión del día, en el mismo campo que el Diario — el Coach y Disciplina lo verán.</p>
      </div>`
  }

  function render() {
    const cont = document.getElementById('chaumerDia')
    if (!cont || !datos) return
    const { ch, sesion, trades } = datos
    const yo = miLado(sesion, trades)
    const v = veredicto(ch, yo)
    const e = ESTADOS[v.k]

    Nav.setContexto('chaumer', fmtFechaLarga(fecha))

    cont.innerHTML = `
      <div class="ch-veredicto ${e.cls}">
        <i class="ti ${e.icon}"></i> ${e.label}
      </div>

      <div class="ch-split">
        ${ladoChaumer(ch)}
        ${ladoYo(yo)}
      </div>

      ${v.diffs.length ? `
        <div class="ch-diffs">
          <div class="ch-diffs-tit">En qué se diferencian</div>
          <div class="ch-diffs-chips">
            ${v.diffs.map(d => `<span class="ch-chip ${d.mal ? 'mal' : 'bien'}">${esc(d.txt)}</span>`).join('')}
          </div>
        </div>` : ''}

      ${v.k === 'fuga' ? bloqueFuga(ch, sesion) : ''}
    `
  }

  function fmtFechaLarga(f) {
    // Ancla al mediodía: sobre una fecha ya anclada, pasar por Date es seguro.
    return new Date(`${f}T12:00:00`).toLocaleDateString('es-ES', {
      weekday: 'long', day: 'numeric', month: 'long',
    })
  }

  // ── Carga ─────────────────────────────────────────────────────────────────
  async function cargar(f) {
    fecha = f
    const inp = document.getElementById('chDate')
    if (inp) inp.value = f
    const cont = document.getElementById('chaumerDia')
    if (cont) cont.innerHTML = '<p class="catalog-empty">Cargando…</p>'
    try {
      const [ch, sesion, trades] = await Promise.all([
        DB.getChaumerOperativa(f),
        DB.getSesionByDate(f),
        DB.getTradesByDate(f),
      ])
      datos = { ch, sesion, trades: trades || [] }
      render()
    } catch (err) {
      if (cont) cont.innerHTML = `<p class="catalog-empty">No se pudo cargar el día: ${esc(err.message)}</p>`
    }
  }

  function mueveDia(delta) {
    const d = new Date(`${fecha}T12:00:00`)
    d.setDate(d.getDate() + delta)
    cargar(isoLocal(d))
  }

  // ── Modal de su operativa ─────────────────────────────────────────────────
  function abrirModal() {
    const ch = datos?.ch
    const sel = document.getElementById('chOpSetup')
    sel.innerHTML = '<option value="">Seleccionar setup…</option>' +
      variantes.map(v => `<option value="${esc(v.codigo)}">${esc(v.nombre)}</option>`).join('')

    document.getElementById('chOpModalTitle').textContent =
      (ch ? 'Editar' : 'Registrar') + ' operativa de Chaumer'
    document.getElementById('chOpOpero').checked = ch ? !!ch.opero : true
    sel.value = ch?.setup_codigo || ''
    document.getElementById('chOpHora').value = ch?.hora_entrada ? String(ch.hora_entrada).slice(0, 5) : ''
    document.getElementById('chOpResultado').value = ch?.resultado || ''
    document.getElementById('chOpPuntos').value = ch?.puntos ?? ''
    document.getElementById('chOpContexto').value = ch?.contexto || ''
    document.getElementById('chOpNotas').value = ch?.notas || ''
    document.getElementById('chOpMotivo').value = ch?.motivo_no_opero || ''
    document.getElementById('chOpImagenUrl').value = ch?.imagen_url || ''
    document.getElementById('chOpBorrar').classList.toggle('hidden', !ch)
    sincOpero()
    document.getElementById('chOpModal').classList.remove('hidden')
  }

  // ── El signo de los puntos ────────────────────────────────────────────────
  // `puntos` va CON SIGNO, y el signo lo manda el resultado: un stop resta.
  // Escribirlo a mano se olvida —pasó el primer día de uso: un stop quedó como
  // +20,50 e inflaba sus puntos en el KPI de Δ—, así que se deriva.
  //
  // OJO: se deriva de SU resultado (`#chOpResultado`), no del de Kris. Este
  // formulario es la operativa de Chaumer entera; el lado de Kris no se escribe
  // aquí, se calcula desde `trades` con `puntosTrade()`.
  //
  // Solo se fuerza en target y stop, que son inequívocos. Un `parcial` puede
  // cerrar arriba o abajo y un `be` puede dejar un residuo de cualquier signo:
  // en esos dos manda lo que escriba Kris.
  function signoPuntos(valor, resultado) {
    const n = parseFloat(String(valor).replace(',', '.'))
    if (!Number.isFinite(n)) return null
    if (resultado === 'stop')   return -Math.abs(n)
    if (resultado === 'target') return Math.abs(n)
    return n
  }

  // Reescribe el input para que el signo se VEA antes de guardar, no después.
  function normalizaPuntosInput() {
    const inp = document.getElementById('chOpPuntos')
    if (!inp || inp.value === '') return
    const n = signoPuntos(inp.value, document.getElementById('chOpResultado').value)
    if (n != null && String(n) !== inp.value) inp.value = n
  }

  // Un día sin operativa no pide setup ni resultado — y la BD lo rechazaría.
  function sincOpero() {
    const opero = document.getElementById('chOpOpero').checked
    document.getElementById('chOpSiOpero').classList.toggle('hidden', !opero)
    document.getElementById('chOpNoOpero').classList.toggle('hidden', opero)
  }

  async function guardar() {
    const opero = document.getElementById('chOpOpero').checked
    const setup = document.getElementById('chOpSetup').value
    if (opero && !setup) { Toast.show('Elige el setup que operó', 'warning'); return }

    const resultado = document.getElementById('chOpResultado').value
    const pts = document.getElementById('chOpPuntos').value
    try {
      await DB.upsertChaumerOperativa({
        fecha,
        opero,
        setup_codigo: setup || null,
        hora_entrada: document.getElementById('chOpHora').value || null,
        resultado: resultado || null,
        puntos: pts === '' ? null : signoPuntos(pts, resultado),
        contexto: document.getElementById('chOpContexto').value || null,
        imagen_url: document.getElementById('chOpImagenUrl').value || null,
        notas: document.getElementById('chOpNotas').value || null,
        motivo_no_opero: document.getElementById('chOpMotivo').value || null,
      })
      document.getElementById('chOpModal').classList.add('hidden')
      cacheDif = null   // el dashboard tiene que releer
      Toast.show('Operativa guardada', 'success')
      await cargar(fecha)
    } catch (err) {
      Toast.show('Error al guardar: ' + err.message, 'error')
    }
  }

  async function borrar() {
    if (!confirm('¿Borrar la operativa de Chaumer de este día?')) return
    try {
      await DB.deleteChaumerOperativa(fecha)
      document.getElementById('chOpModal').classList.add('hidden')
      cacheDif = null
      Toast.show('Operativa borrada', 'success')
      await cargar(fecha)
    } catch (err) {
      Toast.show('Error al borrar: ' + err.message, 'error')
    }
  }

  async function declararMotivo(motivo) {
    try {
      await DB.marcarSetupNoTomado(fecha, nombreVariante(datos.ch.setup_codigo), motivo)
      cacheDif = null
      Toast.show('Motivo guardado en la sesión del día', 'success')
      await cargar(fecha)
    } catch (err) {
      Toast.show('Error al guardar el motivo: ' + err.message, 'error')
    }
  }

  // ══ Pestaña "Diferencias" ═════════════════════════════════════════════════
  // Mismo selector Mes/Trimestre/Año/Todo que Disciplina. La aritmética del
  // rango es compartida (`rangoPeriodo` en db.js); aquí solo vive el estado.

  const PERIODOS = [
    { k: 'month',   label: 'Mes',       paso: 1 },
    { k: 'quarter', label: 'Trimestre', paso: 3 },
    { k: 'year',    label: 'Año',       paso: 12 },
    { k: 'all',     label: 'Todo',      paso: 0 },
  ]
  let period = 'month'
  let navY = null, navM = null
  let cacheDif = null      // { trades, sesiones, chaumer, festivos }

  const pInfo = () => PERIODOS.find(p => p.k === period) || PERIODOS[0]
  const enDif = () => Nav.actual() === 'chaumer' &&
    document.querySelector('#chaumerTabs .so-tab.active')?.dataset.tab === 'dif'

  function ensureNav() {
    if (navM != null) return
    const d = new Date()
    navM = d.getMonth() + 1
    navY = d.getFullYear()
  }
  function rango() { ensureNav(); return rangoPeriodo(period, navY, navM) }

  function navPeriodo(delta) {
    const paso = pInfo().paso
    if (!paso) return
    ensureNav()
    const idx = (navY * 12 + (navM - 1)) + delta * paso
    navY = Math.floor(idx / 12)
    navM = (idx % 12) + 1
    renderPeriodPicker(); renderDif()
  }

  function renderPeriodPicker() {
    const el = document.getElementById('chaumerPeriod')
    if (!el) return
    const abierto = !!el.querySelector('.per-filter-panel:not(.hidden)')
    el.innerHTML = `
      <button type="button" class="per-filter-btn" id="chaumerPeriodBtn" title="Período del dashboard">
        <span class="per-filter-text">${pInfo().label}</span>
        <i class="ti ti-chevron-down"></i>
      </button>
      <div class="per-filter-panel ${abierto ? '' : 'hidden'}">
        ${PERIODOS.map(p => `
          <button type="button" class="per-filter-opt ${period === p.k ? 'on' : ''}" data-period="${p.k}">
            <i class="ti ${period === p.k ? 'ti-check' : ''}"></i>${p.label}
          </button>`).join('')}
      </div>`
    // Las flechas son compartidas: en "Todo" no hay nada que navegar.
    ;['prevMonth', 'nextMonth'].forEach((id, i) => {
      const b = document.getElementById(id)
      if (!b || !enDif()) return
      b.classList.toggle('hidden', !pInfo().paso)
      const t = period === 'year' ? 'Año' : period === 'quarter' ? 'Trimestre' : 'Mes'
      b.title = `${t} ${i ? 'siguiente' : 'anterior'}`
    })
  }

  // ── El cálculo ────────────────────────────────────────────────────────────
  function computar(r) {
    const { trades, sesiones, chaumer, festivos } = cacheDif
    const enR = f => f >= r.from && f <= r.to
    const hoy = hoyISO()

    const porFecha = {}
    const anota = (f, k, v) => { (porFecha[f] ||= {}).f = f; porFecha[f][k] = v }
    chaumer.filter(c => enR(c.fecha)).forEach(c => anota(c.fecha, 'ch', c))
    sesiones.filter(s => enR(s.sesion_date)).forEach(s => anota(s.sesion_date, 'ses', s))
    trades.filter(t => enR(t.trade_date)).forEach(t => {
      const d = (porFecha[t.trade_date] ||= { f: t.trade_date })
      ;(d.tr ||= []).push(t)
    })

    // ── Cobertura ──
    // Denominador: días hábiles no festivos del rango, acotados a lo ya vivido.
    // Sin esto, "Año" contaría diciembre y el porcentaje sería una mentira.
    const fest = new Set((festivos || []).filter(x => x.tipo === 'festivo').map(x => x.fecha))
    const conDato = Object.keys(porFecha).sort()
    const desde = r.from === '0000-00-00' ? (conDato[0] || hoy) : r.from
    const hasta = r.to > hoy ? hoy : r.to
    let habiles = 0
    for (let d = new Date(`${desde}T12:00:00`); isoLocal(d) <= hasta; d.setDate(d.getDate() + 1)) {
      const f = isoLocal(d)
      if (esDiaHabil(f) && !fest.has(f)) habiles++
    }
    const cargados = chaumer.filter(c => enR(c.fecha) && c.fecha <= hasta).length

    // ── Un veredicto por día ──
    const dias = Object.values(porFecha)
      .filter(d => d.ch)                       // sin su operativa no hay comparación
      .map(d => {
        const yo = miLadoDe(d.ses, d.tr || [], d.f)
        return { f: d.f, ch: d.ch, ses: d.ses, yo, v: veredictoCon(d.ch, yo, d.f) }
      })
      .sort((a, b) => a.f.localeCompare(b.f))

    const cuenta = k => dias.filter(d => d.v.k === k).length
    const suyosOperados = dias.filter(d => d.ch.opero && d.ch.setup_codigo)
    const fugas = dias.filter(d => d.v.k === 'fuga')
    const deMas = dias.filter(d => d.v.k === 'de_mas')

    const sum = (arr, fn) => Math.round(arr.reduce((a, x) => a + (fn(x) || 0), 0) * 100) / 100
    const coincidencias = cuenta('igual')

    // ── Motivos de no entrada, desde `sesiones` ──
    const motivos = {}
    fugas.forEach(d => {
      const m = d.ses?.motivo_no_entrada || 'Sin declarar'
      motivos[m] = (motivos[m] || 0) + 1
    })

    // ── Por setup: cuántas de las suyas se te escaparon ──
    const porSetup = {}
    suyosOperados.forEach(d => {
      const n = nombreVariante(d.ch.setup_codigo)
      const e = (porSetup[n] ||= { total: 0, fugas: 0 })
      e.total++
      if (d.v.k === 'fuga') e.fugas++
    })

    // ── Δ hora, solo en días en que ambos operaron ──
    const deltas = dias
      .filter(d => d.ch.opero && d.ch.hora_entrada && d.yo.hora_et)
      .map(d => difMinutos(d.ch.hora_entrada, d.yo.hora_et))
      .filter(n => n != null)
    const deltaMedia = deltas.length
      ? Math.round((deltas.reduce((a, b) => a + b, 0) / deltas.length) * 10) / 10
      : null

    // ── Por semana, para la evolución ──
    const semanas = {}
    dias.forEach(d => {
      const k = semanaDe(d.f)
      const s = (semanas[k] ||= { k, igual: 0, ejecucion: 0, otra_lectura: 0, fuga: 0, de_mas: 0, ambos_fuera: 0 })
      s[d.v.k] = (s[d.v.k] || 0) + 1
    })

    return {
      rango: r,
      cobertura: { cargados, habiles, pct: habiles ? Math.round((cargados / habiles) * 100) : 0 },
      totalComparables: suyosOperados.length,
      coincidencia: { n: coincidencias, pct: suyosOperados.length ? Math.round((coincidencias / suyosOperados.length) * 100) : null },
      fugas: { n: fugas.length, puntos: sum(fugas, d => d.ch.puntos) },
      deMas: { n: deMas.length, puntos: sum(deMas, d => d.yo.puntos) },
      puntos: { el: sum(dias, d => d.ch.puntos), yo: sum(dias, d => d.yo.puntos) },
      estados: { igual: cuenta('igual'), ejecucion: cuenta('ejecucion'), otra_lectura: cuenta('otra_lectura'), fuga: fugas.length, de_mas: deMas.length, ambos_fuera: cuenta('ambos_fuera') },
      motivos, porSetup, deltaMedia, nDeltas: deltas.length,
      semanas: Object.values(semanas).sort((a, b) => a.k.localeCompare(b.k)),
      nDias: dias.length,
    }
  }

  // Lunes de la semana de `f`. El ancla al mediodía evita el salto de día por UTC.
  function semanaDe(f) {
    const d = new Date(`${f}T12:00:00`)
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
    return isoLocal(d)
  }

  // Variantes de `miLado` y `veredicto` que no dependen del día en pantalla.
  function miLadoDe(sesion, trades, f) {
    const opero = trades.length > 0
    const pts = trades.map(t => puntosTrade(t)).filter(n => n != null)
    return {
      opero,
      setup_codigo: sesion?.setup_codigo || null,
      hora_et: opero ? horaEt(trades[0].entry_time, f) : null,
      resultado: opero ? trades[0].resultado : null,
      puntos: pts.length ? Math.round(pts.reduce((a, b) => a + b, 0) * 100) / 100 : null,
    }
  }
  function veredictoCon(ch, yo, f) {
    const guardado = fecha
    fecha = f
    const v = veredicto(ch, yo)
    fecha = guardado
    return v
  }

  // ── Pintado del dashboard ─────────────────────────────────────────────────
  const barra = (n, max, cls) => `<span class="ch-bar"><span class="ch-bar-fill ${cls}" style="width:${max ? Math.round((n / max) * 100) : 0}%"></span></span>`

  function renderDif() {
    const cont = document.getElementById('chaumerDif')
    if (!cont || !cacheDif) return
    const r = rango()
    const d = computar(r)
    Nav.setContexto('chaumer', r.label)

    if (!d.nDias) {
      cont.innerHTML = `
        <p class="catalog-empty">
          No hay ninguna operativa suya cargada en ${esc(r.label.toLowerCase())}.<br>
          Cárgalas desde la pestaña <strong>Día</strong> y este panel se llena solo.
        </p>`
      return
    }

    const cobFlaca = d.cobertura.pct < 60
    const maxMotivo = Math.max(1, ...Object.values(d.motivos))
    const maxSem = Math.max(1, ...d.semanas.map(s => s.igual + s.ejecucion + s.otra_lectura + s.fuga + s.de_mas))

    cont.innerHTML = `
      <div class="ch-cob ${cobFlaca ? 'flaca' : ''}">
        <i class="ti ti-${cobFlaca ? 'alert-triangle' : 'checkbox'}"></i>
        Cobertura: <strong>${d.cobertura.cargados} de ${d.cobertura.habiles}</strong> días hábiles cargados
        (${d.cobertura.pct} %).${cobFlaca ? ' Con esta cobertura los porcentajes de abajo dicen poco.' : ''}
      </div>

      <div class="ch-kpis">
        <div class="ch-kpi">
          <span class="ch-kpi-lab">Coincidencia</span>
          <span class="ch-kpi-n ok">${d.coincidencia.pct == null ? '—' : d.coincidencia.pct + '%'}</span>
          <span class="ch-kpi-sub">${d.coincidencia.n} de ${d.totalComparables} días suyos</span>
        </div>
        <div class="ch-kpi">
          <span class="ch-kpi-lab">Fugas</span>
          <span class="ch-kpi-n mal">${d.fugas.n}</span>
          <span class="ch-kpi-sub">${fmtPts(d.fugas.puntos)} que dejaste pasar</span>
        </div>
        <div class="ch-kpi">
          <span class="ch-kpi-lab">De más</span>
          <span class="ch-kpi-n mal">${d.deMas.n}</span>
          <span class="ch-kpi-sub">${fmtPts(d.deMas.puntos)} en esos días</span>
        </div>
        <div class="ch-kpi">
          <span class="ch-kpi-lab">Δ puntos</span>
          <span class="ch-kpi-n ${d.puntos.yo - d.puntos.el >= 0 ? 'ok' : 'mal'}">${fmtPts(Math.round((d.puntos.yo - d.puntos.el) * 100) / 100)}</span>
          <span class="ch-kpi-sub">él ${fmtPts(d.puntos.el)} · tú ${fmtPts(d.puntos.yo)}</span>
        </div>
      </div>

      <div class="ch-graficas">
        <div class="ch-card">
          <div class="ch-card-tit">Cómo evoluciona, por semana</div>
          <div class="ch-sem">
            ${d.semanas.map(s => {
              const tot = s.igual + s.ejecucion + s.otra_lectura + s.fuga + s.de_mas
              const h = n => (tot ? Math.round((n / tot) * 84 * (tot / maxSem)) : 0)
              return `
                <div class="ch-sem-col" title="Semana del ${esc(s.k)}">
                  <div class="ch-sem-pila">
                    ${s.de_mas ? `<span class="ch-seg s-demas" style="height:${h(s.de_mas)}px"></span>` : ''}
                    ${s.fuga ? `<span class="ch-seg s-fuga" style="height:${h(s.fuga)}px"></span>` : ''}
                    ${s.otra_lectura ? `<span class="ch-seg s-otra" style="height:${h(s.otra_lectura)}px"></span>` : ''}
                    ${s.ejecucion ? `<span class="ch-seg s-ejec" style="height:${h(s.ejecucion)}px"></span>` : ''}
                    ${s.igual ? `<span class="ch-seg s-igual" style="height:${h(s.igual)}px"></span>` : ''}
                  </div>
                  <span class="ch-sem-lab">${esc(s.k.slice(8))}/${esc(s.k.slice(5, 7))}</span>
                </div>`
            }).join('')}
          </div>
          <div class="ch-leyenda">
            <span><i class="ch-pt s-igual"></i>Igual</span>
            <span><i class="ch-pt s-ejec"></i>Ejecución</span>
            <span><i class="ch-pt s-otra"></i>Otra lectura</span>
            <span><i class="ch-pt s-fuga"></i>Fuga</span>
            <span><i class="ch-pt s-demas"></i>De más</span>
          </div>
        </div>

        <div class="ch-card">
          <div class="ch-card-tit">Por qué no entraste</div>
          ${Object.keys(d.motivos).length ? `
            <div class="ch-lista">
              ${Object.entries(d.motivos).sort((a, b) => b[1] - a[1]).map(([m, n]) => `
                <div class="ch-fila">
                  <span class="ch-fila-nom">${esc(m)}</span>
                  ${barra(n, maxMotivo, m === 'Sin declarar' ? 'gris' : 'rojo')}
                  <span class="ch-fila-n">${n}</span>
                </div>`).join('')}
            </div>
            <p class="ch-card-pie">Sale de <code>sesiones.motivo_no_entrada</code>, el campo que rellenas en el Diario y en las fugas de aquí.</p>
          ` : '<p class="ch-card-pie">Ninguna fuga en este período.</p>'}
        </div>

        <div class="ch-card">
          <div class="ch-card-tit">Dónde te pierdes, por setup</div>
          ${Object.keys(d.porSetup).length ? `
            <div class="ch-lista">
              ${Object.entries(d.porSetup).sort((a, b) => (b[1].fugas / b[1].total) - (a[1].fugas / a[1].total)).map(([n, e]) => {
                const pct = e.total ? e.fugas / e.total : 0
                return `
                  <div class="ch-fila">
                    <span class="ch-fila-nom" title="${esc(n)}">${esc(n)}</span>
                    ${barra(e.fugas, e.total, pct >= 0.5 ? 'rojo' : pct > 0 ? 'violeta' : 'verde')}
                    <span class="ch-fila-n">${e.fugas}/${e.total}</span>
                  </div>`
              }).join('')}
            </div>
            <p class="ch-card-pie">Fugas sobre las operativas suyas de cada setup.</p>
          ` : '<p class="ch-card-pie">Sin operativas suyas con setup en este período.</p>'}
        </div>

        <div class="ch-card">
          <div class="ch-card-tit">Δ hora de entrada</div>
          ${d.deltaMedia == null ? '<p class="ch-card-pie">Ningún día con hora en los dos lados.</p>' : `
            <div class="ch-delta">
              <span class="ch-delta-n ${Math.abs(d.deltaMedia) > 5 ? 'mal' : 'ok'}">${d.deltaMedia > 0 ? '+' : ''}${String(d.deltaMedia).replace('.', ',')}</span>
              <span class="ch-delta-lab">minutos de media${d.deltaMedia > 0 ? ' más tarde que él' : d.deltaMedia < 0 ? ' antes que él' : ''}</span>
            </div>
            <p class="ch-card-pie">Sobre ${d.nDeltas} día${d.nDeltas === 1 ? '' : 's'} en que ambos operaron. Las dos horas en ET: tu <code>entry_time</code> viene en hora Colombia y se convierte antes de restar.</p>
          `}
        </div>
      </div>`
  }

  async function cargarDif() {
    const cont = document.getElementById('chaumerDif')
    if (!cont) return
    if (!cacheDif) cont.innerHTML = '<p class="catalog-empty">Cargando…</p>'
    try {
      const [trades, sesiones, chaumer, festivos] = await Promise.all([
        DB.getTrades(),
        DB.getSesiones(),
        DB.getChaumerOperativas({}),
        DB.getFechasEspeciales().catch(() => []),
      ])
      cacheDif = { trades: trades || [], sesiones: sesiones || [], chaumer: chaumer || [], festivos: festivos || [] }
      renderDif()
    } catch (err) {
      cont.innerHTML = `<p class="catalog-empty">No se pudo cargar: ${esc(err.message)}</p>`
    }
  }

  // ── Arranque ──────────────────────────────────────────────────────────────
  let iniciado = false

  async function init() {
    if (iniciado) return
    iniciado = true

    try { variantes = await DB.getSetupVariantes({ soloActivos: false }) } catch (_) { variantes = [] }

    // Pestañas: mismo componente que Sesión Operativa y Datos.
    document.getElementById('chaumerTabs')?.addEventListener('click', e => {
      const btn = e.target.closest('.so-tab')
      if (btn) showTab(btn.dataset.tab)
    })

    // Selector de período y flechas de mes, solo activos en "Diferencias".
    document.getElementById('chaumerPeriod')?.addEventListener('click', e => {
      if (e.target.closest('#chaumerPeriodBtn')) {
        const p = document.querySelector('#chaumerPeriod .per-filter-panel')
        p?.classList.toggle('hidden')
        return
      }
      const k = e.target.closest('.per-filter-opt')?.dataset.period
      if (!k) return
      period = k
      document.querySelector('#chaumerPeriod .per-filter-panel')?.classList.add('hidden')
      renderPeriodPicker(); renderDif()
    })
    document.addEventListener('click', e => {
      if (!e.target.closest('#chaumerPeriod')) {
        document.querySelector('#chaumerPeriod .per-filter-panel')?.classList.add('hidden')
      }
    })
    document.getElementById('prevMonth')?.addEventListener('click', () => { if (enDif()) navPeriodo(-1) })
    document.getElementById('nextMonth')?.addEventListener('click', () => { if (enDif()) navPeriodo(1) })

    document.getElementById('chDatePrev')?.addEventListener('click', () => mueveDia(-1))
    document.getElementById('chDateNext')?.addEventListener('click', () => mueveDia(1))
    document.getElementById('chDate')?.addEventListener('change', e => { if (e.target.value) cargar(e.target.value) })

    // Delegación: el contenido se repinta entero en cada carga.
    document.getElementById('chaumerDia')?.addEventListener('click', e => {
      const act = e.target.closest('[data-act]')?.dataset.act
      if (act === 'editar') return abrirModal()
      if (act === 'zoom') return Lightbox?.open?.(e.target.src)
      const motivo = e.target.closest('[data-motivo]')?.dataset.motivo
      if (motivo) declararMotivo(motivo)
    })

    document.getElementById('chOpOpero')?.addEventListener('change', sincOpero)
    // El signo se ajusta al elegir resultado y al salir del campo de puntos, para
    // que se vea antes de guardar y no sorprenda después.
    document.getElementById('chOpResultado')?.addEventListener('change', normalizaPuntosInput)
    document.getElementById('chOpPuntos')?.addEventListener('blur', normalizaPuntosInput)
    document.getElementById('chOpGuardar')?.addEventListener('click', guardar)
    document.getElementById('chOpBorrar')?.addEventListener('click', borrar)
    document.getElementById('closeChOpModal')?.addEventListener('click', () => {
      document.getElementById('chOpModal').classList.add('hidden')
    })
    document.getElementById('chOpImagen')?.addEventListener('change', async e => {
      const file = e.target.files?.[0]
      if (!file) return
      try {
        document.getElementById('chOpImagenUrl').value = await subirACloudinary(file)
        Toast.show('Imagen subida correctamente', 'success')
      } catch (err) {
        Toast.show('Error al subir la imagen: ' + err.message, 'error')
      }
    })

    renderPeriodPicker()
    showTab('dia')
    await cargar(hoyISO())
  }

  // Las herramientas de la barra superior (período + flechas) pertenecen a
  // "Diferencias". En "Día" manda el selector de fecha del propio panel, así que
  // se esconden: Nav las enciende por sección y aquí se afinan por pestaña.
  function showTab(tab) {
    document.querySelectorAll('#chaumerTabs .so-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === tab))
    document.querySelectorAll('#section-chaumer .so-panel').forEach(p => {
      p.classList.toggle('active', p.id === `chaumer-panel-${tab}`)
    })
    const dif = tab === 'dif'
    document.getElementById('chDateNav')?.classList.toggle('hidden', dif)
    document.getElementById('chaumerPeriod')?.classList.toggle('hidden', !dif)
    document.querySelectorAll('.header-info .hdr-nav').forEach(el => el.classList.toggle('hidden', !dif || !pInfo().paso))
    if (dif) { renderPeriodPicker(); cargarDif() }
    else if (fecha) Nav.setContexto('chaumer', fmtFechaLarga(fecha))
  }

  function reload() {
    if (!iniciado) return
    const tab = document.querySelector('#chaumerTabs .so-tab.active')?.dataset.tab || 'dia'
    showTab(tab)
    if (tab === 'dia' && fecha) cargar(fecha)
  }

  return { init, reload }
})()
