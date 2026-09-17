// Comparador Chaumer vs yo — pestañas "Diferencias" (la principal) y "Registrar"
//
// Su lado sale de `chaumer_operativas`; el mío, de `sesiones` + `trades`. Aquí
// no se guarda nada mío: se lee.
//
// El veredicto del día NO se persiste — se calcula cada vez cruzando las tres
// fuentes, así que no puede quedarse obsoleto cuando cambia cualquiera de ellas.
//
// Las dos horas van en hora de COLOMBIA y se comparan tal cual: `trades.entry_time`
// llega así de NinjaTrader, y su `hora_entrada` se guarda así desde el 17 sep 2026
// (antes era ET y Kris la escribía a veces en una y a veces en otra). Aquí NO se
// usa `horaEt()`: convertir solo uno de los dos lados daría 60 min de error.
//
// Diseño: docs/disenos/2026-08-19-chaumer-vs-yo.md (v8).

const Chaumer = (() => {

  // Los seis estados del diseño §3, más "sin cargar" — que no es un estado del
  // día sino la ausencia del dato, y se ve distinto a propósito.
  // «Fuga», «De más» y «Otra lectura» son nombres internos y se quedan en el
  // código y en el diseño. En pantalla se dice lo que pasó, con palabras: Kris
  // no tiene por qué recordar cinco definiciones para leer un gráfico.
  const ESTADOS = {
    igual:        { label: 'Misma operativa que él',       corto: 'Misma operativa',      cls: 'ch-v-igual', icon: 'ti-check' },
    ejecucion:    { label: 'Mismo setup, distinta salida', corto: 'Distinta salida',      cls: 'ch-v-ejec',  icon: 'ti-clock-exclamation' },
    otra_lectura: { label: 'Cada uno vio un setup',        corto: 'Otro setup',           cls: 'ch-v-otra',  icon: 'ti-arrows-split' },
    fuga:         { label: 'Él entró, tú no',              corto: 'Él entró, yo no',      cls: 'ch-v-fuga',  icon: 'ti-arrow-down-right' },
    de_mas:       { label: 'Tú entraste, él no',           corto: 'Yo entré, él no',      cls: 'ch-v-demas', icon: 'ti-arrow-up-right' },
    ambos_fuera:  { label: 'Ninguno operó',                corto: 'Ninguno operó',        cls: 'ch-v-nada',  icon: 'ti-minus' },
    sin_cargar:   { label: 'Sin cargar su operativa',      corto: 'Sin cargar',           cls: 'ch-v-sin',   icon: 'ti-help-circle' },
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
  // hh:mm en hora Colombia, sin conversión. Ver la cabecera.
  const horaCol = h => (h ? String(h).slice(0, 5) : null)
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
      hora: opero ? horaCol(trades[0].entry_time) : null,
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
    const dMin = difMinutos(ch.hora_entrada, yo.hora)

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
          <dt>Entrada</dt><dd>${esc(horaCol(ch.hora_entrada) || '—')}</dd>
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
          <dt>Entrada</dt><dd>${esc(yo.hora || '—')}</dd>
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

    // Registrar se carga también estando en Diferencias (para tenerla lista), y
    // entonces el título es el período, no la fecha.
    if (!enDif()) Nav.setContexto('chaumer', fmtFechaLarga(fecha))

    cont.innerHTML = `
      <div class="ch-veredicto ${e.cls}">
        <i class="ti ${e.icon}"></i> ${e.label}
      </div>

      <div class="ch-split">
        ${ladoYo(yo)}
        ${ladoChaumer(ch)}
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

  // Sábados y domingos no son operables, así que las flechas los saltan: sin
  // esto, retroceder desde un lunes daba dos pantallas vacías garantizadas.
  function mueveDia(delta) {
    const d = new Date(`${fecha}T12:00:00`)
    do { d.setDate(d.getDate() + delta) } while (!esDiaHabil(isoLocal(d)))
    cargar(isoLocal(d))
  }

  // Retrocede hasta el último día hábil. Se usa al abrir la pantalla en fin de
  // semana y al elegir un sábado o domingo a mano en el selector.
  function ultimoHabil(f) {
    const d = new Date(`${f}T12:00:00`)
    while (!esDiaHabil(isoLocal(d))) d.setDate(d.getDate() - 1)
    return isoLocal(d)
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
    // `delta` = lo que ese día te separó de él, en PUNTOS. Es la unidad de todo
    // el panel: la brecha total es su suma, y el desglose por causa es esa misma
    // suma agrupada. Quien no operó cuenta 0, no null: no haber entrado no es
    // "sin dato", es cero puntos.
    const dias = Object.values(porFecha)
      .filter(d => d.ch)                       // sin su operativa no hay comparación
      .map(d => {
        const yo = miLado(d.ses, d.tr || [])
        const delta = Math.round(((yo.puntos ?? 0) - (d.ch.puntos ?? 0)) * 100) / 100
        return { f: d.f, ch: d.ch, ses: d.ses, yo, delta, v: veredicto(d.ch, yo) }
      })
      .sort((a, b) => a.f.localeCompare(b.f))

    const cuenta = k => dias.filter(d => d.v.k === k).length
    const suyosOperados = dias.filter(d => d.ch.opero && d.ch.setup_codigo)
    const fugas = dias.filter(d => d.v.k === 'fuga')

    const sum = (arr, fn) => Math.round(arr.reduce((a, x) => a + (fn(x) || 0), 0) * 100) / 100

    // ── Motivos de no entrada, desde `sesiones` ──
    // Se cuentan los días Y lo que costaron. Ordenar por veces engaña: dudar una
    // sola vez puede costar más que tres días de zona naranja.
    const motivos = {}
    fugas.forEach(d => {
      const m = d.ses?.motivo_no_entrada || 'Sin declarar'
      const e = (motivos[m] ||= { dias: 0, puntos: 0 })
      e.dias++
      e.puntos = Math.round((e.puntos + d.delta) * 100) / 100
    })

    // ── De dónde sale la brecha ──
    // El desglose por causa, en puntos. Es la respuesta a "¿dónde pierdo más?",
    // así que se ordena por lo que cuesta, no por número de días.
    // `ambos_fuera` queda fuera: siempre aporta 0 y solo añadiría ruido.
    const CAUSAS = {
      fuga:         'Él entró, yo no',
      de_mas:       'Yo entré, él no',
      otra_lectura: 'Cada uno vio un setup',
      ejecucion:    'Mismo setup, distinta salida',
      igual:        'Misma operativa que él',
    }
    const causas = Object.keys(CAUSAS)
      .map(k => {
        const ds = dias.filter(d => d.v.k === k)
        return { k, label: CAUSAS[k], dias: ds.length, delta: Math.round(ds.reduce((a, d) => a + d.delta, 0) * 100) / 100 }
      })
      .filter(c => c.dias)
      .sort((a, b) => a.delta - b.delta)

    const brecha = Math.round(dias.reduce((a, d) => a + d.delta, 0) * 100) / 100

    // Días suyos cargados SIN puntos. Cuentan como 0 en la brecha, que es lo
    // único honesto que se puede hacer con un dato que falta — pero hay que
    // decirlo: si no, un día que costó 60 puntos pasa por un día que costó nada.
    const sinPuntos = dias.filter(d => d.ch.opero && d.ch.setup_codigo && d.ch.puntos == null).length

    // ── Por setup: cuántas de las suyas se te escaparon ──
    const porSetup = {}
    suyosOperados.forEach(d => {
      const n = nombreVariante(d.ch.setup_codigo)
      const e = (porSetup[n] ||= { total: 0, fugas: 0 })
      e.total++
      if (d.v.k === 'fuga') e.fugas++
    })

    // ── Δ hora, solo en días en que ambos operaron EL MISMO setup ──
    // Con setups distintos las dos entradas no son la misma operación y restarlas
    // no dice nada (llegó a dar "+14 min" con tres días de 0 min reales).
    // Las dos en hora Colombia: se restan sin convertir.
    const deltas = dias
      .filter(d => d.ch.opero && d.ch.hora_entrada && d.yo.hora && d.ch.setup_codigo === d.yo.setup_codigo)
      .map(d => difMinutos(d.ch.hora_entrada, d.yo.hora))
      .filter(n => n != null)
    const deltaMedia = deltas.length
      ? Math.round((deltas.reduce((a, b) => a + b, 0) / deltas.length) * 10) / 10
      : null

    // ── Targets y stops de cada uno, sobre los mismos días ──
    const conteo = lados => {
      const c = { target: 0, stop: 0, otro: 0, nada: 0 }
      lados.forEach(l => {
        if (!l.opero) c.nada++
        else if (l.resultado === 'target' || l.resultado === 'stop') c[l.resultado]++
        else c.otro++
      })
      return c
    }

    // ── La lista: un día por fila ──
    // Del más antiguo al más reciente, como se lee un diario (lo pidió Kris).
    // Entra todo día con dato en cualquiera de los dos lados. Un día en que yo
    // operé y su operativa no está cargada también sale, marcado "Sin cargar":
    // esconderlo haría creer que ese día no existe.
    const filas = Object.values(porFecha)
      .filter(d => d.ch || d.tr?.length)
      .map(d => dias.find(x => x.f === d.f) || {
        f: d.f, ch: null, ses: d.ses, yo: miLado(d.ses, d.tr || []), delta: null, v: { k: 'sin_cargar', diffs: [] },
      })
      .sort((a, b) => a.f.localeCompare(b.f))

    return {
      rango: r,
      cobertura: { cargados, habiles, pct: habiles ? Math.round((cargados / habiles) * 100) : 0 },
      totalComparables: suyosOperados.length,
      puntos: { el: sum(dias, d => d.ch.puntos), yo: sum(dias, d => d.yo.puntos) },
      resultados: { el: conteo(dias.map(d => ladoDeEl(d.ch))), yo: conteo(dias.map(d => d.yo)) },
      brecha, causas, sinPuntos,
      // Cuánto te aporta entrar en SU mismo setup, que es la comparación limpia.
      mismoSetup: {
        dias: cuenta('igual') + cuenta('ejecucion'),
        ambos: dias.filter(d => d.yo.opero && d.ch.opero && d.ch.setup_codigo).length,
        delta: Math.round(dias.filter(d => ['igual', 'ejecucion'].includes(d.v.k))
          .reduce((a, d) => a + d.delta, 0) * 100) / 100,
      },
      motivos, porSetup, deltaMedia, nDeltas: deltas.length,
      filas,
      nDias: dias.length,
    }
  }

  // Su fila, con la misma forma que `miLado` para poder tratarlas igual.
  function ladoDeEl(ch) {
    const opero = !!(ch?.opero && ch?.setup_codigo)
    return { opero, resultado: opero ? ch.resultado : null, puntos: opero ? ch.puntos : null }
  }

  // ── Pintado del dashboard ─────────────────────────────────────────────────
  // La frase que faltaba. Un panel que solo enseña métricas obliga a sacar la
  // conclusión a mano cada vez; esto la dice. Se construye desde los datos, no
  // es un texto fijo: si el patrón cambia, la frase cambia.
  function conclusion(d) {
    const peor = d.causas.find(c => c.delta < 0)   // ya vienen de peor a mejor
    const ms = d.mismoSetup
    const partes = []

    if (ms.dias && ms.delta > 0) {
      partes.push(`Cuando entras <strong class="ok">al mismo setup que él, le sacas ventaja</strong>: ${fmtPts(ms.delta)} en ${ms.dias} día${ms.dias === 1 ? '' : 's'}.`)
    } else if (ms.dias && ms.delta < 0) {
      partes.push(`Incluso entrando a su mismo setup vas <strong class="mal">por detrás</strong>: ${fmtPts(ms.delta)} en ${ms.dias} día${ms.dias === 1 ? '' : 's'}.`)
    }
    if (peor) {
      partes.push(`Lo que más te cuesta es <strong class="mal">«${esc(peor.label.toLowerCase())}»</strong>: ${peor.dias} día${peor.dias === 1 ? '' : 's'}, ${fmtPts(peor.delta)}.`)
    } else if (d.brecha > 0) {
      partes.push('No hay ninguna causa que te reste en este período.')
    }
    return partes.join(' ')
  }

  const barra = (n, max, cls) => `<span class="ch-bar"><span class="ch-bar-fill ${cls}" style="width:${max ? Math.round((n / max) * 100) : 0}%"></span></span>`
  const num = n => `${n > 0 ? '+' : ''}${String(n).replace('.', ',')}`
  const plural = (n, s, p = s + 's') => `${n} ${n === 1 ? s : p}`
  const fechaFila = f => new Date(`${f}T12:00:00`)
    .toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })
    .replace(/[.,]/g, '').replace(/\bsept\b/, 'sep')

  // Target / Stop / Sin operativa, con su color. `lado` = miLado o ladoDeEl.
  // El resultado de mi trade puede venir vacío: entonces lo dice el signo.
  function resultadoDe(lado) {
    if (!lado.opero) return null
    if (lado.resultado) return lado.resultado
    if (lado.puntos > 0) return 'target'
    if (lado.puntos < 0) return 'stop'
    return null
  }
  function badge(lado, sinCargar) {
    if (sinCargar) return '<span class="ch-res ch-res-sin">Sin cargar</span>'
    if (!lado.opero) return '<span class="ch-res ch-res-nada">Sin operativa</span>'
    const r = resultadoDe(lado)
    const cls = r === 'target' ? 'ok' : r === 'stop' ? 'mal' : 'neutro'
    return `<span class="ch-res ch-res-${cls}">${RESULTADOS[r] || 'Operó'}</span>`
  }

  // ── La tabla día a día ──
  // Columnas de verdad (no leyendas): resultado · hora · puntos por cada lado.
  // La franja de la izquierda dice UNA sola cosa: si hicimos lo mismo.
  //   verde = misma operación: el mismo setup, o ninguno de los dos operó.
  //   rojo  = diferente: setups distintos, o uno operó y el otro no.
  // Sin franja solo cuando su operativa no está cargada: no hay con qué comparar.
  function franjaSetup(x) {
    if (!x.ch) return ''
    const el = ladoDeEl(x.ch)
    if (!x.yo.opero && !el.opero) return 'mismo'
    if (x.yo.opero !== el.opero) return 'distinto'
    return x.yo.setup_codigo && x.yo.setup_codigo === x.ch.setup_codigo ? 'mismo' : 'distinto'
  }

  const celdaPts = n => n == null
    ? '<td class="ch-dd-pts ch-dd-vacio">—</td>'
    : `<td class="ch-dd-pts ${n > 0 ? 'pos' : n < 0 ? 'neg' : ''}">${num(n)}</td>`

  function filaLista(x) {
    const el = ladoDeEl(x.ch)
    const franja = franjaSetup(x)
    const dCls = x.delta == null ? '' : x.delta < 0 ? 'neg' : x.delta > 0 ? 'pos' : 'cero'
    const setupYo = x.yo.opero ? nombreVariante(x.yo.setup_codigo) : ''
    const setupEl = el.opero ? nombreVariante(x.ch.setup_codigo) : ''
    return `
      <tr class="ch-dd-fila ${franja ? 'fr-' + franja : ''}" data-cmp="${x.f}" tabindex="0"
          title="Ver las dos gráficas${setupYo || setupEl ? ` · Yo: ${esc(setupYo || '—')} · Él: ${esc(setupEl || '—')}` : ''}">
        <td class="ch-dd-fecha">${esc(fechaFila(x.f))}</td>
        <td class="ch-dd-res g-yo">${badge(x.yo)}</td>
        <td class="ch-dd-hora g-yo">${esc(x.yo.hora || '—')}</td>
        ${celdaPts(x.yo.opero ? x.yo.puntos : null).replace('class="', 'class="g-yo ')}
        <td class="ch-dd-res g-el">${badge(el, !x.ch)}</td>
        <td class="ch-dd-hora g-el">${esc(el.opero ? (horaCol(x.ch.hora_entrada) || '—') : '—')}</td>
        ${celdaPts(el.opero ? x.ch.puntos : null).replace('class="', 'class="g-el ')}
        <td class="ch-dd-delta"><span class="ch-dd-dn ${dCls}">${x.delta == null ? '—' : x.delta === 0 ? '0' : num(x.delta)}</span></td>
        <td class="ch-dd-que">${esc(ESTADOS[x.v.k]?.corto || '')}</td>
      </tr>`
  }

  // Totales de la tabla: targets, stops, % de efectividad y puntos, por lado.
  // Efectividad = targets / (targets + stops); break-even y parciales no entran.
  function totalesLista(filas) {
    const lado = lados => {
      let t = 0, st = 0, pts = 0
      lados.forEach(l => {
        if (!l.opero) return
        const r = resultadoDe(l)
        if (r === 'target') t++
        else if (r === 'stop') st++
        pts += l.puntos || 0
      })
      return { t, st, pts: Math.round(pts * 100) / 100, ef: (t + st) ? Math.round((t / (t + st)) * 100) : null }
    }
    return {
      yo: lado(filas.map(x => x.yo)),
      el: lado(filas.map(x => ladoDeEl(x.ch))),
      delta: Math.round(filas.reduce((a, x) => a + (x.delta || 0), 0) * 100) / 100,
    }
  }

  function celdasTotal(t, g) {
    return `
      <td class="ch-dd-res g-${g}" colspan="2">
        <span class="ch-dd-tot-ts"><b class="pos">${t.t}</b> T · <b class="neg">${t.st}</b> S</span>
        <span class="ch-dd-ef ${t.ef == null ? '' : t.ef >= 50 ? 'pos' : 'neg'}">${t.ef == null ? '—' : t.ef + ' %'} <small>efectividad</small></span>
      </td>
      <td class="ch-dd-pts g-${g} ${t.pts > 0 ? 'pos' : t.pts < 0 ? 'neg' : ''}">${num(t.pts)}</td>`
  }

  function tablaDias(filas) {
    const tot = totalesLista(filas)
    return `
      <div class="ch-dd-wrap">
        <table class="ch-dd">
          <thead>
            <tr class="ch-dd-grupos">
              <th rowspan="2" class="ch-dd-fecha">Fecha</th>
              <th colspan="3" class="g-yo g-tit">Yo</th>
              <th colspan="3" class="g-el g-tit">Chaumer</th>
              <th rowspan="2" class="ch-dd-delta">Δ Puntos</th>
              <th rowspan="2" class="ch-dd-que">Qué pasó</th>
            </tr>
            <tr class="ch-dd-cols">
              <th class="g-yo">Resultado</th><th class="g-yo">Hora</th><th class="g-yo">Puntos</th>
              <th class="g-el">Resultado</th><th class="g-el">Hora</th><th class="g-el">Puntos</th>
            </tr>
          </thead>
          <tbody>${filas.map(filaLista).join('')}</tbody>
          <tfoot>
            <tr>
              <td class="ch-dd-fecha">Total · ${plural(filas.length, 'día')}</td>
              ${celdasTotal(tot.yo, 'yo')}
              ${celdasTotal(tot.el, 'el')}
              <td class="ch-dd-delta"><span class="ch-dd-dn ${tot.delta < 0 ? 'neg' : tot.delta > 0 ? 'pos' : 'cero'}">${num(tot.delta)}</span></td>
              <td class="ch-dd-que">${tot.delta < 0 ? 'por detrás de él' : tot.delta > 0 ? 'por delante de él' : 'empatados'}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      <div class="ch-dd-leyenda">
        <span><i class="ch-dd-sw fr-mismo"></i>Misma operación que él</span>
        <span><i class="ch-dd-sw fr-distinto"></i>Operación diferente</span>
      </div>`
  }

  function kpiResultados(c) {
    return [c.target && `${c.target} T`, c.stop && `${c.stop} S`, c.otro && `${c.otro} otros`, c.nada && `${c.nada} sin operar`]
      .filter(Boolean).join(' · ') || '—'
  }

  let filasVista = []   // la lista en pantalla, para ← → dentro del modal

  function renderDif() {
    const cont = document.getElementById('chaumerDif')
    if (!cont || !cacheDif) return
    const r = rango()
    const d = computar(r)
    filasVista = d.filas
    Nav.setContexto('chaumer', r.label)

    if (!d.filas.length) {
      cont.innerHTML = `
        <p class="catalog-empty">
          No hay ninguna operativa en ${esc(r.label.toLowerCase())}.<br>
          Carga las suyas desde la pestaña <strong>Registrar</strong> y este panel se llena solo.
        </p>`
      return
    }

    const cobFlaca = d.cobertura.pct < 60
    const maxMotivo = Math.max(1, ...Object.values(d.motivos).map(m => Math.abs(m.puntos)))
    const maxCausa = Math.max(1, ...d.causas.map(c => Math.abs(c.delta)))
    const ms = d.mismoSetup
    const txtConclusion = conclusion(d)

    cont.innerHTML = `
      ${cobFlaca || d.sinPuntos ? `
        <div class="ch-avisos">
          ${cobFlaca ? `<div class="ch-cob flaca"><i class="ti ti-alert-triangle"></i>
            Solo ${d.cobertura.cargados} de ${d.cobertura.habiles} días hábiles tienen su operativa cargada: las cifras dicen poco todavía.</div>` : ''}
          ${d.sinPuntos ? `<div class="ch-cob flaca"><i class="ti ti-alert-triangle"></i>
            ${plural(d.sinPuntos, 'día suyo', 'días suyos')} sin puntos: cuenta${d.sinPuntos === 1 ? '' : 'n'} como 0, así que la brecha real puede ser mayor.</div>` : ''}
        </div>` : ''}

      <!-- La tabla va primero: es lo que Kris viene a mirar. Las tarjetas, debajo. -->
      <div class="ch-card ch-tabla">
        <div class="ch-dd-titulo">Día a día</div>
        ${tablaDias(d.filas)}
      </div>

      <div class="ch-kpis">
        <div class="ch-kpi ch-kpi-brecha ${d.brecha < 0 ? 'mal' : 'ok'}">
          <span class="ch-kpi-lab">La brecha</span>
          <span class="ch-kpi-n ${d.brecha < 0 ? 'mal' : d.brecha > 0 ? 'ok' : ''}">${num(d.brecha)}</span>
          <span class="ch-kpi-sub">puntos ${d.brecha < 0 ? 'por detrás de él' : d.brecha > 0 ? 'por delante de él' : '— empatados'} · ${plural(d.nDias, 'día')}</span>
        </div>
        <div class="ch-kpi ch-kpi-yo">
          <span class="ch-kpi-lab">Yo</span>
          <span class="ch-kpi-n">${num(d.puntos.yo)}</span>
          <span class="ch-kpi-sub">${kpiResultados(d.resultados.yo)}</span>
        </div>
        <div class="ch-kpi ch-kpi-el">
          <span class="ch-kpi-lab">Chaumer</span>
          <span class="ch-kpi-n">${num(d.puntos.el)}</span>
          <span class="ch-kpi-sub">${kpiResultados(d.resultados.el)}</span>
        </div>
        <div class="ch-kpi">
          <span class="ch-kpi-lab">Mismo setup que él</span>
          <span class="ch-kpi-n">${ms.dias}<small> / ${ms.ambos}</small></span>
          <span class="ch-kpi-sub">días en que operaron los dos${ms.dias ? ` · ${fmtPts(ms.delta)}` : ''}</span>
        </div>
        <div class="ch-kpi">
          <span class="ch-kpi-lab">Hora de entrada</span>
          <span class="ch-kpi-n ${d.deltaMedia != null && Math.abs(d.deltaMedia) > TOLERANCIA_MIN ? 'mal' : ''}">${d.deltaMedia == null ? '—' : `${num(d.deltaMedia)}<small> min</small>`}</span>
          <span class="ch-kpi-sub">${d.deltaMedia == null ? 'ningún día con el mismo setup y hora en los dos lados'
            : `${d.deltaMedia > 0 ? 'de media después' : d.deltaMedia < 0 ? 'de media antes' : 'entras a la vez'} que él ·${plural(d.nDeltas, 'día')} con el mismo setup`}</span>
        </div>
      </div>

      ${txtConclusion ? `<div class="ch-conclusion"><i class="ti ti-bulb"></i><p>${txtConclusion}</p></div>` : ''}

      <div class="ch-graficas">
        <div class="ch-card">
          <div class="ch-card-tit">De dónde sale la brecha</div>
          <div class="ch-card-sub">Lo que cada causa te suma o te resta, en puntos.</div>
          ${d.causas.length ? `
          <div class="ch-causas">
            ${d.causas.map(c => {
              const pct = (Math.abs(c.delta) / maxCausa) * 50
              const neg = c.delta < 0
              return `
                <div class="ch-causa">
                  <div class="ch-causa-top">
                    <span class="ch-causa-lab">${esc(c.label)} <span class="ch-causa-dias">· ${plural(c.dias, 'día')}</span></span>
                    <span class="ch-causa-n ${neg ? 'mal' : 'ok'}">${num(c.delta)}</span>
                  </div>
                  <div class="ch-carril">
                    <span class="ch-carril-cero"></span>
                    <span class="ch-carril-barra ${neg ? 'neg' : 'pos'}" style="${neg ? 'right' : 'left'}:50%;width:${pct}%"></span>
                  </div>
                </div>`
            }).join('')}
          </div>
          <div class="ch-carril-ejes"><span>te resta</span><span>0</span><span>te suma</span></div>
          ` : '<p class="ch-card-pie">Ningún día con diferencia todavía.</p>'}
        </div>

        <div class="ch-card">
          <div class="ch-card-tit">Por qué no entraste</div>
          <div class="ch-card-sub">Los días en que él entró y tú no, por lo que costaron.</div>
          ${Object.keys(d.motivos).length ? `
            <div class="ch-lista">
              ${Object.entries(d.motivos).sort((a, b) => a[1].puntos - b[1].puntos).map(([m, e]) => `
                <div class="ch-motivo">
                  <div class="ch-motivo-top">
                    <span class="ch-fila-nom">${esc(m)}</span>
                    <span class="ch-motivo-n">${plural(e.dias, 'día')} · <strong>${fmtPts(e.puntos)}</strong></span>
                  </div>
                  <span class="ch-bar"><span class="ch-bar-fill ${m === 'Sin declarar' ? 'gris' : 'rojo'}" style="width:${Math.round((Math.abs(e.puntos) / maxMotivo) * 100)}%"></span></span>
                </div>`).join('')}
            </div>
          ` : '<p class="ch-card-pie">Ningún día en que él entrara y tú no.</p>'}
        </div>

        <div class="ch-card">
          <div class="ch-card-tit">Sus setups que se te escapan</div>
          <div class="ch-card-sub">De las veces que él operó cada setup, en cuántas no entraste.</div>
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
          ` : '<p class="ch-card-pie">Sin operativas suyas con setup en este período.</p>'}
        </div>
      </div>

    `
  }

  // ── Modal de comparación: las dos gráficas grandes ────────────────────────
  let cmpFecha = null

  function abrirComparacion(f) {
    const x = filasVista.find(r => r.f === f)
    if (!x) return
    cmpFecha = f
    const e = ESTADOS[x.v.k]
    const idx = filasVista.indexOf(x)
    // La lista va del más antiguo al más reciente, igual que las flechas.
    const hayAnt = idx > 0
    const haySig = idx < filasVista.length - 1

    document.getElementById('chCmpTitulo').textContent = fmtFechaLarga(f)
    document.getElementById('chCmpVeredicto').className = `ch-veredicto ch-cmp-v ${e.cls}`
    document.getElementById('chCmpVeredicto').innerHTML = `<i class="ti ${e.icon}"></i> ${esc(e.label)}${x.delta ? ` · ${num(x.delta)} pts` : ''}`
    document.getElementById('chCmpPrev').disabled = !hayAnt
    document.getElementById('chCmpNext').disabled = !haySig

    document.getElementById('chCmpCuerpo').innerHTML = `
      <div class="ch-split">
        ${ladoYo(x.yo)}
        ${ladoChaumer(x.ch)}
      </div>
      ${x.v.diffs.length ? `
        <div class="ch-diffs">
          <div class="ch-diffs-tit">En qué se diferencian</div>
          <div class="ch-diffs-chips">
            ${x.v.diffs.map(dd => `<span class="ch-chip ${dd.mal ? 'mal' : 'bien'}">${esc(dd.txt)}</span>`).join('')}
          </div>
        </div>` : ''}
      ${x.v.k === 'fuga' && x.ses?.motivo_no_entrada ? `
        <div class="ch-fuga ch-fuga-ok"><i class="ti ti-info-circle"></i>
          Por qué no entraste: <strong>${esc(x.ses.motivo_no_entrada)}</strong></div>` : ''}
    `
    const m = document.getElementById('chCmpModal')
    if (m.classList.contains('hidden')) {
      m.classList.remove('hidden')
      document.body.classList.add('modal-open')
    }
  }

  function cerrarComparacion() {
    document.getElementById('chCmpModal')?.classList.add('hidden')
    document.body.classList.remove('modal-open')
    cmpFecha = null
  }

  function moverComparacion(paso) {
    const idx = filasVista.findIndex(r => r.f === cmpFecha)
    const x = filasVista[idx + paso]
    if (x) abrirComparacion(x.f)
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
    // Cada fila de la lista abre las dos gráficas del día.
    document.getElementById('chaumerDif')?.addEventListener('click', e => {
      const f = e.target.closest('[data-cmp]')?.dataset.cmp
      if (f) abrirComparacion(f)
    })

    // Modal de comparación. Se cierra con Esc, con la X o pulsando fuera; ← → pasan
    // de día sin cerrarlo. Si el Lightbox está abierto encima, las teclas son suyas.
    const cmp = document.getElementById('chCmpModal')
    cmp?.addEventListener('click', e => {
      if (e.target === cmp || e.target.closest('#chCmpCerrar')) return cerrarComparacion()
      if (e.target.closest('#chCmpPrev')) return moverComparacion(-1)
      if (e.target.closest('#chCmpNext')) return moverComparacion(1)
      const act = e.target.closest('[data-act]')?.dataset.act
      if (act === 'zoom') {
        const urls = [...cmp.querySelectorAll('img.ch-img')].map(i => i.src)
        return Lightbox.open(e.target.src, urls, urls.indexOf(e.target.src))
      }
      // Editar su operativa se hace en Registrar, en ese mismo día.
      if (act === 'editar' || e.target.closest('#chCmpEditar')) {
        const f = cmpFecha
        cerrarComparacion()
        showTab('dia')
        cargar(f).then(() => { if (e.target.closest('[data-act="editar"]')) abrirModal() })
      }
    })
    document.getElementById('chaumerDif')?.addEventListener('keydown', e => {
      const f = e.key === 'Enter' && e.target.closest?.('[data-cmp]')?.dataset.cmp
      if (f) abrirComparacion(f)
    })
    document.addEventListener('keydown', e => {
      if (!cmpFecha || document.getElementById('lightbox')) return
      if (e.key === 'Escape') cerrarComparacion()
      else if (e.key === 'ArrowLeft') moverComparacion(-1)
      else if (e.key === 'ArrowRight') moverComparacion(1)
    })

    document.getElementById('prevMonth')?.addEventListener('click', () => { if (enDif()) navPeriodo(-1) })
    document.getElementById('nextMonth')?.addEventListener('click', () => { if (enDif()) navPeriodo(1) })

    document.getElementById('chDatePrev')?.addEventListener('click', () => mueveDia(-1))
    document.getElementById('chDateNext')?.addEventListener('click', () => mueveDia(1))
    document.getElementById('chDate')?.addEventListener('change', e => {
      if (!e.target.value) return
      // Elegir un sábado o domingo a mano cae al viernes anterior en vez de
      // abrir un día que nunca va a tener nada.
      const f = ultimoHabil(e.target.value)
      if (f !== e.target.value) Toast.show('Sábados y domingos no son operables — te llevo al viernes', 'warning')
      cargar(f)
    })

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

    // Diferencias es la pestaña principal. Registrar se deja cargada en el
    // último día hábil para cuando se cambie a ella.
    renderPeriodPicker()
    showTab('dif')
    await cargar(ultimoHabil(hoyISO()))
  }

  // Las herramientas de la barra superior (período + flechas) pertenecen a
  // "Diferencias". En "Registrar" manda el selector de fecha del propio panel, así que
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
    const tab = document.querySelector('#chaumerTabs .so-tab.active')?.dataset.tab || 'dif'
    showTab(tab)
    if (tab === 'dia' && fecha) cargar(fecha)
  }

  return { init, reload }
})()
