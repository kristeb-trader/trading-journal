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
          <div class="ch-nooper"><i class="ti ti-minus"></i> No operó</div>
          ${ch.motivo_no_opero ? `<p class="ch-notas">${esc(ch.motivo_no_opero)}</p>` : ''}
        </div>`
    }
    return `
      <div class="ch-lado ch-lado-el">
        <div class="ch-lado-tit">Chaumer <button type="button" class="ch-edit" data-act="editar" title="Editar"><i class="ti ti-pencil"></i></button></div>
        ${ch.imagen_url
          ? `<img class="ch-img" src="${esc(ch.imagen_url)}" alt="Gráfico de Chaumer" data-act="zoom">`
          : `<div class="ch-img ch-img-off"><i class="ti ti-photo-off"></i></div>`}
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
          <div class="ch-nooper"><i class="ti ti-minus"></i> No operé</div>
          ${yo.notas ? `<p class="ch-notas">${esc(yo.notas)}</p>` : ''}
        </div>`
    }
    return `
      <div class="ch-lado ch-lado-yo">
        <div class="ch-lado-tit">Yo</div>
        ${yo.imagen
          ? `<img class="ch-img" src="${esc(yo.imagen)}" alt="Mi gráfico" data-act="zoom">`
          : `<div class="ch-img ch-img-off"><i class="ti ti-photo-off"></i></div>`}
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

    const pts = document.getElementById('chOpPuntos').value
    try {
      await DB.upsertChaumerOperativa({
        fecha,
        opero,
        setup_codigo: setup || null,
        hora_entrada: document.getElementById('chOpHora').value || null,
        resultado: document.getElementById('chOpResultado').value || null,
        puntos: pts === '' ? null : parseFloat(String(pts).replace(',', '.')),
        contexto: document.getElementById('chOpContexto').value || null,
        imagen_url: document.getElementById('chOpImagenUrl').value || null,
        notas: document.getElementById('chOpNotas').value || null,
        motivo_no_opero: document.getElementById('chOpMotivo').value || null,
      })
      document.getElementById('chOpModal').classList.add('hidden')
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
      Toast.show('Operativa borrada', 'success')
      await cargar(fecha)
    } catch (err) {
      Toast.show('Error al borrar: ' + err.message, 'error')
    }
  }

  async function declararMotivo(motivo) {
    try {
      await DB.marcarSetupNoTomado(fecha, nombreVariante(datos.ch.setup_codigo), motivo)
      Toast.show('Motivo guardado en la sesión del día', 'success')
      await cargar(fecha)
    } catch (err) {
      Toast.show('Error al guardar el motivo: ' + err.message, 'error')
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
      if (!btn) return
      document.querySelectorAll('#chaumerTabs .so-tab').forEach(b => b.classList.toggle('active', b === btn))
      document.querySelectorAll('#section-chaumer .so-panel').forEach(p => {
        p.classList.toggle('active', p.id === `chaumer-panel-${btn.dataset.tab}`)
      })
    })

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

    await cargar(hoyISO())
  }

  function reload() { if (iniciado && fecha) cargar(fecha) }

  return { init, reload }
})()
