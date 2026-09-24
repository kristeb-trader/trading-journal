// Backtesting — la bitácora del backtesting visual de días pasados (bt_*).
//
// Aquí se REGISTRA: jornadas, su operación, su gráfico y los datos de inicio. La
// curva de capital, las cifras y la tabla por meses las enseña el portal de
// Chaumer, que lee estas mismas tablas en solo lectura (vistas `portal_bt_*`).
// Diseño: docs/disenos/2026-09-24-unificacion-chaumer.md (fase 4b) y
// chaumer/04_Web/DISENO_BACKTESTING.md.
//
// Reglas que no se rompen aquí:
//   · No hay metodología: no se valida si una operación cumple el plan. Es un
//     registro de decisiones ya tomadas. Solo se rechaza lo que corrompería el
//     registro (sin fecha, puntos negativos, sin hora).
//   · El P&L lo calcula la BD al guardar (`bt_guardar_jornada`). La cuenta de
//     este archivo es solo la vista previa del formulario.
//   · Una jornada que se corrige conserva sus contratos, valor del punto y
//     comisión. Los datos de inicio valen para las jornadas nuevas.
//   · Nunca se mezcla con `trades` ni `apex_trades`.
const Backtesting = (() => {

  const NOMBRE = {
    largo: 'Largo', corto: 'Corto',
    continuacion: 'Continuación', reingreso: 'Reingreso',
    target: 'Target', stop: 'Stop',
  }
  const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio',
                 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
  const MES_CORTO = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
  const DIAS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb']

  let cabecera = null
  let jornadas = []
  let wired = false
  let subiendo = false

  const $ = id => document.getElementById(id)
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
  const pts = n => String(Number(n)).replace('.', ',')
  // La comisión es una TARIFA (1,02 por contrato): sin decimales diría "$1".
  const tarifa = n => `$${Number(n || 0).toFixed(2).replace('.', ',')}`
  const cls = v => (v > 0 ? 'bt-pos' : v < 0 ? 'bt-neg' : '')
  // Un cero no lleva signo: «+$0» sugiere una ganancia que no hubo.
  const dinero = v => fmtDinero(v, { masEnPositivo: v !== 0 })
  const plural = (n, s, p = s + 's') => `${n} ${n === 1 ? s : p}`

  // Anclado al mediodía: sobre una fecha YA fijada, pasar por Date es seguro.
  function fechaCorta(iso) {
    const d = new Date(`${iso}T12:00:00`)
    return `${DIAS[d.getDay()]} ${d.getDate()} ${MES_CORTO[d.getMonth()]}`
  }
  function fechaLarga(iso) {
    const d = new Date(`${iso}T12:00:00`)
    return `${d.getDate()} ${MES_CORTO[d.getMonth()]} ${d.getFullYear()}`
  }

  // El backtesting recorre el mercado pasado día a día: la propuesta para una
  // jornada nueva es el día hábil siguiente a la última registrada.
  function siguienteHabil() {
    if (!jornadas.length) return hoyISO()
    const d = new Date(`${jornadas[0].fecha}T12:00:00`)
    do { d.setDate(d.getDate() + 1) } while (d.getDay() === 0 || d.getDay() === 6)
    return isoLocal(d)
  }

  const pnlJornada = j => (j.operaciones || []).reduce((a, o) => a + Number(o.pnl), 0)

  async function init() {
    if (!wired) { wire(); wired = true }
    await load()
  }
  async function reload() { await load() }

  async function load() {
    const cont = $('btContent'); if (!cont) return
    cont.innerHTML = '<p class="bt-vacio">Cargando la bitácora…</p>'
    try {
      ({ cabecera, jornadas } = await DB.getBacktesting())
    } catch (e) {
      cont.innerHTML = `<p class="coach-error">No se pudo leer la bitácora: ${esc(e.message)}. Vuelve a entrar en la sección para reintentar.</p>`
      return
    }
    render()
  }

  // ── Pantalla ─────────────────────────────────────────────────────────────
  function render() {
    const cont = $('btContent'); if (!cont) return
    const ops = jornadas.flatMap(j => j.operaciones || [])
    const total = ops.reduce((a, o) => a + Number(o.pnl), 0)
    const inicial = Number(cabecera?.valor_inicial) || 0

    Nav.setContexto('backtesting', jornadas.length ? plural(jornadas.length, 'jornada') : '')

    const cab = cabecera ? `
      <div class="bt-cab">
        <div class="bt-cab-item"><span>Valor inicial</span><b>${fmtDinero(inicial, { masEnPositivo: false })}</b>
          <small>${esc(cabecera.instrumento)} · ${plural(cabecera.contratos, 'contrato')}</small></div>
        <div class="bt-cab-item"><span>Saldo actual</span><b class="${cls(total)}">${fmtDinero(inicial + total, { masEnPositivo: false })}</b>
          <small>${dinero(total)} de P&amp;L</small></div>
        <div class="bt-cab-item"><span>Registrado</span><b>${plural(jornadas.length, 'jornada')}</b>
          <small>${plural(ops.length, 'operación', 'operaciones')}</small></div>
        <div class="bt-cab-item"><span>Comisión · punto</span><b>${tarifa(cabecera.comision)}</b>
          <small>por contrato · ${tarifa(cabecera.valor_punto)} el punto</small></div>
        <button class="btn-icon-sm bt-cab-editar" id="btEditarInicio" title="Datos de inicio" aria-label="Datos de inicio">
          <i class="ti ti-pencil"></i></button>
      </div>` : ''

    if (!jornadas.length) {
      cont.innerHTML = cab + `<p class="bt-vacio">Todavía no hay jornadas. Registra la primera con
        <b>Registrar jornada</b>: un día sin entrada también se registra, con su nota.</p>`
      return
    }

    // Por meses, del más nuevo al más viejo (como el portal).
    const meses = []
    jornadas.forEach(j => {
      const k = j.fecha.slice(0, 7)
      if (!meses.length || meses[meses.length - 1].k !== k) meses.push({ k, js: [] })
      meses[meses.length - 1].js.push(j)
    })

    cont.innerHTML = cab + meses.map(m => {
      const [y, mm] = m.k.split('-').map(Number)
      const o = m.js.flatMap(j => j.operaciones || [])
      const t = o.filter(x => x.resultado === 'target').length
      const pnl = o.reduce((a, x) => a + Number(x.pnl), 0)
      return `
        <div class="bt-mes">
          <div class="bt-mes-h">
            <span>${MESES[mm - 1]} ${y}</span>
            <span class="bt-mes-n">${plural(o.length, 'operación', 'operaciones')} · ${t} T · ${o.length - t} S</span>
            <span class="bt-mes-pnl ${cls(pnl)}">${dinero(pnl)}</span>
          </div>
          ${m.js.map(fila).join('')}
        </div>`
    }).join('')
  }

  function fila(j) {
    const o = (j.operaciones || [])[0]
    // La miniatura la recorta Cloudinary (unos KB); el original (~400 KB) solo
    // se baja al abrirlo en grande.
    const mini = j.imagen && j.imagen.replace('/image/upload/', '/image/upload/c_fill,w_96,h_66,q_auto,f_auto/')
    const img = j.imagen
      ? `<img class="bt-img" src="${esc(mini)}" data-full="${esc(j.imagen)}" alt="Gráfico del ${esc(fechaLarga(j.fecha))}" loading="lazy">`
      : ''
    const acc = `
      <span class="bt-acc">
        <button class="btn-icon-sm" data-edit="${j.id}" title="Corregir" aria-label="Corregir la jornada"><i class="ti ti-edit"></i></button>
        <button class="btn-icon-sm danger" data-del="${j.id}" title="Borrar" aria-label="Borrar la jornada"><i class="ti ti-trash"></i></button>
      </span>`

    if (!o) {
      return `
        <div class="bt-row vacia">
          <span class="bt-fecha">${fechaCorta(j.fecha)}</span>
          <span class="bt-c-hora">—</span><span class="bt-c-dir">—</span><span class="bt-c-setup">—</span>
          <span class="bt-c-pts bt-num">—</span><span class="bt-c-pnl bt-num">—</span>
          <span class="bt-c-res"><span class="bt-res">Sin operación</span></span>
          <span class="bt-obs" title="${esc(j.notas || '')}">${esc(j.notas || '')}</span>
          <span class="bt-c-img">${img}</span>
          ${acc}
          <span class="bt-det">${esc(j.notas || 'Sin entrada')}</span>
        </div>`
    }
    const pnl = pnlJornada(j)
    const flecha = o.direccion === 'largo' ? 'ti-arrow-up-right' : 'ti-arrow-down-right'
    return `
      <div class="bt-row">
        <span class="bt-fecha">${fechaCorta(j.fecha)}</span>
        <span class="bt-c-hora bt-num">${esc(o.hora)}</span>
        <span class="bt-c-dir"><i class="ti ${flecha}"></i> ${NOMBRE[o.direccion]}</span>
        <span class="bt-c-setup">${NOMBRE[o.setup]}</span>
        <span class="bt-c-pts bt-num">${pts(o.puntos)}</span>
        <span class="bt-c-pnl bt-num ${cls(pnl)}">${dinero(pnl)}</span>
        <span class="bt-c-res"><span class="bt-res ${o.resultado}">${NOMBRE[o.resultado]}</span></span>
        <span class="bt-obs" title="${esc(o.observaciones || '')}">${esc(o.observaciones || '')}</span>
        <span class="bt-c-img">${img}</span>
        ${acc}
        <span class="bt-det">${esc(o.hora)} · ${NOMBRE[o.direccion]} · ${NOMBRE[o.setup]} · ${pts(o.puntos)} pts</span>
      </div>`
  }

  // ── Formulario de jornada ────────────────────────────────────────────────
  // La base con la que se calcula: la congelada si se corrige, la de inicio si es nueva.
  function base() {
    const j = jornadas.find(x => String(x.id) === $('btId').value)
    const b = j || cabecera || {}
    return {
      instrumento: b.instrumento, contratos: Number(b.contratos) || 1,
      valor_punto: Number(b.valor_punto) || 0, comision: Number(b.comision) || 0,
    }
  }

  function vistaPrevia() {
    const res = $('btResultado').value
    const opera = !!res
    $('btSiOpera').classList.toggle('hidden', !opera)
    $('btNotasLabel').textContent = opera ? 'Observaciones' : 'Nota del día'
    if (!opera) return
    const b = base()
    const p = parseFloat($('btPuntos').value)
    const el = $('btPnl')
    $('btPnlBase').textContent =
      `${b.instrumento || ''} · ${plural(b.contratos, 'contrato')} · ${tarifa(b.valor_punto)} el punto · comisión ${tarifa(b.comision)}`
    if (!Number.isFinite(p) || p < 0) { el.textContent = '—'; el.className = ''; return }
    const com = Math.round(b.comision * b.contratos * 100) / 100
    const v = Math.round(((res === 'stop' ? -1 : 1) * p * b.valor_punto * b.contratos - com) * 100) / 100
    el.textContent = dinero(v)
    el.className = cls(v)
  }

  function abrir(j) {
    const o = j && (j.operaciones || [])[0]
    $('btId').value = j?.id || ''
    $('btFecha').value = j?.fecha || siguienteHabil()
    $('btResultado').value = j ? (o ? o.resultado : '') : 'target'
    $('btHora').value = o?.hora || ''
    $('btDireccion').value = o?.direccion || 'largo'
    $('btSetup').value = o?.setup || 'continuacion'
    $('btPuntos').value = o ? o.puntos : ''
    $('btNotas').value = o ? (o.observaciones || '') : (j?.notas || '')
    $('btImagen').value = ''
    $('btImagenUrl').value = j?.imagen || ''
    $('btImagenActual').textContent = j?.imagen ? 'Tiene gráfico. Elige otro archivo solo si quieres cambiarlo.' : ''
    $('btBorrar').classList.toggle('hidden', !j)
    $('btModalTitle').innerHTML = `<i class="ti ti-history"></i> ${j ? 'Corregir jornada' : 'Registrar jornada'}`
    vistaPrevia()
    $('btModal').classList.remove('hidden')
    document.body.classList.add('modal-open')
  }

  function cerrar(id) {
    $(id).classList.add('hidden')
    document.body.classList.remove('modal-open')
  }

  async function subirImagen(e) {
    const file = e.target.files?.[0]
    if (!file) return
    subiendo = true
    $('btGuardar').disabled = true
    $('btImagenActual').textContent = 'Subiendo el gráfico…'
    try {
      $('btImagenUrl').value = await subirACloudinary(file, { carpeta: 'backtesting' })
      $('btImagenActual').textContent = 'Gráfico subido. Se guarda con la jornada.'
    } catch (err) {
      $('btImagenActual').textContent = ''
      $('btImagen').value = ''
      Toast.show('No se pudo subir el gráfico: ' + err.message, 'error')
    } finally {
      subiendo = false
      $('btGuardar').disabled = false
    }
  }

  async function guardar() {
    if (subiendo) return
    const id = $('btId').value
    const fecha = $('btFecha').value
    const resultado = $('btResultado').value
    const texto = $('btNotas').value.trim()
    if (!fecha) { Toast.show('Falta la fecha', 'warning'); return }

    const operaciones = []
    if (resultado) {
      const hora = $('btHora').value
      const puntos = parseFloat($('btPuntos').value)
      if (!hora) { Toast.show('Falta la hora de la entrada', 'warning'); return }
      if (!Number.isFinite(puntos) || puntos < 0) { Toast.show('Los puntos van en positivo: el signo lo pone el resultado', 'warning'); return }
      operaciones.push({
        hora, puntos, resultado,
        direccion: $('btDireccion').value,
        setup: $('btSetup').value,
        observaciones: texto || null,
      })
    }

    const btn = $('btGuardar')
    btn.disabled = true
    try {
      await DB.guardarBtJornada({
        id: id || null,
        fecha,
        imagen: $('btImagenUrl').value || null,
        notas: resultado ? null : (texto || null),
        operaciones,
      })
      cerrar('btModal')
      Toast.show(id ? 'Jornada corregida' : 'Jornada registrada', 'success')
      await load()
    } catch (e) {
      Toast.show('No se pudo guardar: ' + e.message, 'error')
    } finally {
      btn.disabled = false
    }
  }

  async function borrar(id) {
    const j = jornadas.find(x => String(x.id) === String(id))
    if (!j) return
    if (!confirm(`¿Borrar la jornada del ${fechaLarga(j.fecha)}? No se puede deshacer.`)) return
    try {
      await DB.borrarBtJornada(j.id)
      cerrar('btModal')
      Toast.show('Jornada borrada', 'success')
      await load()
    } catch (e) { Toast.show('No se pudo borrar: ' + e.message, 'error') }
  }

  // ── Datos de inicio ──────────────────────────────────────────────────────
  function abrirInicio() {
    if (!cabecera) return
    $('btIniValor').value = cabecera.valor_inicial
    $('btIniContratos').value = cabecera.contratos
    $('btIniInstrumento').value = cabecera.instrumento
    $('btIniComision').value = cabecera.comision
    $('btIniPunto').textContent =
      `Valor del punto: ${tarifa(cabecera.valor_punto)}, del plan. Estos datos valen para las jornadas nuevas: las registradas conservan los suyos.`
    $('btInicioModal').classList.remove('hidden')
    document.body.classList.add('modal-open')
  }

  async function guardarInicio() {
    const valor_inicial = parseFloat($('btIniValor').value)
    const contratos = Number($('btIniContratos').value)
    const instrumento = $('btIniInstrumento').value.trim()
    const comision = parseFloat($('btIniComision').value)
    if (!Number.isFinite(valor_inicial) || valor_inicial < 0) { Toast.show('El valor inicial tiene que ser 0 o más', 'warning'); return }
    if (!Number.isInteger(contratos) || contratos < 1) { Toast.show('Los contratos son un entero de 1 en adelante', 'warning'); return }
    if (!instrumento) { Toast.show('Falta el instrumento', 'warning'); return }
    if (!Number.isFinite(comision) || comision < 0) { Toast.show('La comisión tiene que ser 0 o más', 'warning'); return }
    try {
      await DB.guardarBtCabecera({ valor_inicial, contratos, instrumento, comision })
      cerrar('btInicioModal')
      Toast.show('Datos de inicio guardados', 'success')
      await load()
    } catch (e) { Toast.show('No se pudieron guardar: ' + e.message, 'error') }
  }

  function wire() {
    $('btNueva')?.addEventListener('click', () => abrir(null))
    $('btContent')?.addEventListener('click', e => {
      if (e.target.closest('#btEditarInicio')) return abrirInicio()
      const ed = e.target.closest('[data-edit]')?.dataset.edit
      if (ed) return abrir(jornadas.find(j => String(j.id) === ed))
      const del = e.target.closest('[data-del]')?.dataset.del
      if (del) return borrar(del)
      const full = e.target.closest('[data-full]')?.dataset.full
      if (full) {
        const urls = jornadas.filter(j => j.imagen).map(j => j.imagen)
        Lightbox.open(full, urls, urls.indexOf(full))
      }
    })
    $('btResultado')?.addEventListener('change', vistaPrevia)
    $('btPuntos')?.addEventListener('input', vistaPrevia)
    $('btImagen')?.addEventListener('change', subirImagen)
    $('btGuardar')?.addEventListener('click', guardar)
    $('btBorrar')?.addEventListener('click', () => borrar($('btId').value))
    $('closeBtModal')?.addEventListener('click', () => cerrar('btModal'))
    $('btIniGuardar')?.addEventListener('click', guardarInicio)
    $('closeBtInicioModal')?.addEventListener('click', () => cerrar('btInicioModal'))
  }

  return { init, reload }
})()
