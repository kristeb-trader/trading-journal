// ════════════════════════════════════════════════════════════════════════════
//  Datos → Parámetros (D-055, fase 2, 17/11/2026)
//  Los números que pueden cambiar, en un solo sitio: Supabase (`parametros_*`).
//  - Riesgo y gestión, por perfil («Mi operativa», «Bot»…); la lectura del mercado, común.
//  - Un valor nunca se pisa: cambiarlo es una fila nueva con su «desde». Así un día se
//    juzga con el valor que tenía su perfil ese día, y el 01/10 se pudo poner hacia atrás.
//  - Desde la fase 5 (18/11) el bot lee de aquí su perfil al armarse, y la cadena dibuja cada
//    día con los del perfil bot en esa fecha. Por eso lo del bot y lo común solo valen desde el
//    siguiente día hábil: el bot ya se armó hoy, y el umbral no se cambia con la sesión empezada
//    (P-37). Tu perfil sí admite una fecha pasada: solo cambia cómo se juzgan tus días.
//    `PARAMETROS.md` y `reglas.json` (el plan escrito) son una copia: la cadena avisa si se desfasan.
// ════════════════════════════════════════════════════════════════════════════
const Parametros = (() => {
  let D = null                 // { claves, perfiles, cuentas, valores }
  let perfil = null            // el perfil que se está mirando
  let claveHist = 'STOP_MAX'   // la clave del historial de la derecha
  let cambios = {}             // clave → número pendiente de guardar
  let conocidas = []           // cuentas con trades o dadas de alta en Apex
  let creando = false          // el formulario de «+ nuevo perfil», abierto
  let desde = null             // la fecha elegida para los cambios pendientes
  let cableado = false

  // Los perfiles que opera el bot: lo que cambia en ellos, igual que lo común, vale desde el siguiente día hábil.
  const DEL_BOT = new Set(['bot'])

  const AYUDA = {
    STOP_MAX:          { operativa: 'Si el stop de tu entrada lo pasa, la regla se rompe', bot: 'Si el stop del setup lo pasa, no se opera' },
    RIESGO_MAX:        'Decide cuántos contratos caben',
    ATM_DEFECTO:       'Se calcula: el stop máximo en ticks, ÷ contratos',
    OPS_POR_SESION:    'Operaciones llenadas por sesión',
    RATIO_TARGET:      'El objetivo recorre N veces el stop',
    UMBRAL_VOL:        'Lo fija el operador; nunca con la sesión empezada',
    VENTANA_NOTICIA:   'No se entra a menos de esos minutos de una noticia roja',
    PLAZO_CONSECUCION: 'Velas para la consecución tras el rompimiento',
  }
  const PASO = { STOP_MAX: 0.25, RIESGO_MAX: 1, OPS_POR_SESION: 1, RATIO_TARGET: 0.25 }

  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
  const num = n => n == null ? '—' : (Math.abs(n) >= 1000 ? fmtMiles(n) : String(+n).replace('.', ','))
  const dm = f => `${f.slice(8, 10)}/${f.slice(5, 7)}`
  const dma = f => `${dm(f)}/${f.slice(0, 4)}`
  const nombre = c => (D.perfiles.find(p => p.codigo === c) || {}).nombre || c
  const predeterminado = () => (D.perfiles.find(p => p.predeterminado) || D.perfiles[0] || {}).codigo
  const clave = k => D.claves.find(c => c.clave === k)
  const valoresDe = (k, p) => D.valores.filter(v => v.clave === k && (v.perfil == null || v.perfil === p))
    .sort((a, b) => b.desde.localeCompare(a.desde))

  function siguienteHabil() {
    const d = new Date()
    do { d.setDate(d.getDate() + 1) } while (!esDiaHabil(isoLocal(d)))
    return isoLocal(d)
  }

  // El valor que se está viendo: el pendiente si lo hay, si no el de hoy.
  function valor(k) {
    if (k in cambios) return cambios[k]
    if (k === 'ATM_DEFECTO') {
      const s = valor('STOP_MAX'), t = valor('TICK')
      return s && t ? Math.round(s / t) : null
    }
    const v = paramVigente(D.valores, k, perfil)
    return v ? (v.numero != null ? +v.numero : null) : null
  }

  // ── Pintar ──────────────────────────────────────────────────────────────
  function render() {
    if (!D) return
    pintarPerfiles()
    pintarRiesgo()
    pintarMercado()
    pintarHistorial()
    pintarCuentas()
  }

  function pintarPerfiles() {
    const el = document.getElementById('pmPerfiles')
    if (!el) return
    const chips = D.perfiles.map(p => {
      const cs = D.cuentas.filter(c => c.perfil === p.codigo).map(c => c.cuenta)
      if (p.predeterminado) cs.push('las demás')
      return `<button type="button" class="pm-perfil${p.codigo === perfil ? ' on' : ''}" data-perfil="${esc(p.codigo)}">
        ${esc(p.nombre)}<small>${esc(cs.join(' · ') || 'sin cuentas')}</small></button>`
    }).join('')
    const nuevo = creando
      ? `<span class="pm-nuevo-form"><input type="text" id="pmNuevoNombre" maxlength="30" placeholder="Nombre del perfil">
           <button type="button" class="btn-primary pm-btn-sm" id="pmNuevoOk">Crear</button>
           <button type="button" class="btn-ghost pm-btn-sm" id="pmNuevoNo">Cancelar</button></span>`
      : `<button type="button" class="pm-perfil pm-perfil-nuevo" id="pmNuevo"><i class="ti ti-plus"></i> nuevo perfil</button>`
    el.innerHTML = `<span class="pm-etq">Perfil</span>${chips}${nuevo}`
    if (creando) document.getElementById('pmNuevoNombre')?.focus()
  }

  function fila(c) {
    const k = c.clave
    const hist = valoresDe(k, perfil)
    const hoy = hoyISO()
    const vig = hist.find(v => v.desde <= hoy)
    const prog = hist.filter(v => v.desde > hoy).pop()   // el programado más cercano
    const ayuda = typeof AYUDA[k] === 'object' ? (AYUDA[k][perfil] || AYUDA[k].operativa) : (AYUDA[k] || '')
    const puede = c.editable && !c.calculado
    const v = valor(k)
    const cambiado = k in cambios
    let campo
    if (c.calculado) campo = `<span class="pm-inp pm-ro">${num(v)}</span>`
    else if (vig && vig.numero == null) campo = `<span class="pm-inp pm-ro pm-txt">${esc(vig.texto)}</span>`
    else if (puede) campo = `<input class="pm-inp${cambiado ? ' pm-chg' : ''}" type="number" inputmode="decimal" min="0"
        step="${PASO[k] || 1}" value="${v ?? ''}" data-clave="${k}" aria-label="${esc(c.etiqueta)}">`
    else campo = `<span class="pm-inp pm-ro">${num(v)}</span>`
    let d
    if (c.calculado) d = 'calculado'
    else if (cambiado) d = `${num(vig && vig.numero)} → <b>${num(cambios[k])}</b>`
    else if (prog) d = `${num(vig && vig.numero)} → <b>${num(prog.numero)} desde ${dm(prog.desde)}</b>`
    else if (vig) {
      const ant = hist.find(x => x.desde < vig.desde)
      d = ant && ant.numero != null && vig.numero != null
        ? `${num(ant.numero)} → <b>${num(vig.numero)}</b> desde ${dm(vig.desde)}`
        : `desde ${dm(vig.desde)}`
    } else d = '—'
    const unidad = c.unidad && !(vig && vig.numero == null) ? `<span class="pm-u">${esc(c.unidad)}</span>` : ''
    return `<div class="pm-row${vig && vig.numero == null ? ' pm-row-txt' : ''}">
      <div class="pm-n">${esc(c.etiqueta)}${ayuda ? `<small>${esc(ayuda)}</small>` : ''}</div>
      <div class="pm-v">${campo}${unidad}</div>
      <div class="pm-d">${d}</div>
      ${c.calculado ? '<span></span>' : `<button type="button" class="pm-hist${claveHist === k ? ' on' : ''}" data-hist="${k}" title="Historial" aria-label="Historial de ${esc(c.etiqueta)}"><i class="ti ti-history"></i></button>`}
    </div>`
  }

  function pintarRiesgo() {
    const el = document.getElementById('pmRiesgo')
    if (!el) return
    const filas = D.claves.filter(c => c.grupo === 'riesgo').map(fila).join('')
    const stop = valor('STOP_MAX'), riesgo = valor('RIESGO_MAX')
    const caben = contratosQueCaben(stop, riesgo)
    // Cuántos contratos caben con cada stop: el stop más grande que admite cada número.
    let tabla = ''
    if (stop > 0 && riesgo > 0) {
      const celdas = []
      for (let n = 1; n <= 5; n++) {
        const max = Math.min(stop, Math.floor(riesgo / (n * USD_PUNTO_MNQ) / 0.25) * 0.25)
        if (max < 1) break
        celdas.push(`<div><b>${n} ${n === 1 ? 'contrato' : 'contratos'}</b>hasta ${num(max)} pts</div>`)
      }
      tabla = `<div class="pm-sub">Contratos que caben (MNQ, $${USD_PUNTO_MNQ} por punto) · <b>se calcula solo</b></div>
        <div class="pm-contratos">${celdas.join('')}</div>`
    }
    const aviso = !(stop > 0 && riesgo > 0) ? '' : caben >= 1
      ? `<div class="pm-aviso pm-ok"><i class="ti ti-circle-check"></i><div>Coherente: con <b>${num(stop)} pts</b> y <b>$${fmtMiles(riesgo)}</b> cabe <b>${caben} ${caben === 1 ? 'contrato' : 'contratos'}</b> en el stop máximo (${num(stop)} × $${USD_PUNTO_MNQ} = $${fmtMiles(stop * USD_PUNTO_MNQ)}).</div></div>`
      : `<div class="pm-aviso pm-mal"><i class="ti ti-alert-triangle"></i><div>Con un stop de <b>${num(stop)} pts</b> y <b>$${fmtMiles(riesgo)}</b> no cabe ni un contrato (hacen falta $${fmtMiles(stop * USD_PUNTO_MNQ)}). Sube el riesgo o baja el stop.</div></div>`
    const n = Object.keys(cambios).length
    const sinLectura = DEL_BOT.has(perfil)
      ? `<div class="pm-nota"><i class="ti ti-robot"></i> El bot lee estos números de aquí cada mañana, al armarse. Un cambio vale desde el siguiente día hábil.</div>` : ''
    const guardar = n ? `<div class="pm-guardar">
        <label>Desde <input type="date" id="pmDesde" value="${desde || (desde = siguienteHabil())}"></label>
        <span class="pm-desde-hint" id="pmDesdeHint"></span>
        <button type="button" class="btn-secondary" id="pmDescartar">Descartar</button>
        <button type="button" class="btn-primary" id="pmGuardar"${caben >= 1 ? '' : ' disabled'}>Guardar ${n} ${n === 1 ? 'cambio' : 'cambios'}</button>
      </div>` : ''
    el.innerHTML = `<div class="pm-h"><i class="ti ti-shield-half"></i> Riesgo y gestión · ${esc(nombre(perfil))}
        <span class="pm-tag">cada perfil tiene los suyos</span></div>
      ${filas}${tabla}${aviso}${sinLectura}${guardar}`
    pintarDesdeHint()
  }

  function pintarDesdeHint() {
    const inp = document.getElementById('pmDesde'), h = document.getElementById('pmDesdeHint')
    if (!inp || !h) return
    const f = inp.value, hoy = hoyISO()
    const delBot = DEL_BOT.has(perfil) || Object.keys(cambios).some(k => clave(k).ambito === 'comun')
    h.textContent = !f ? '' : f > hoy ? 'programado: hasta entonces sigue el de hoy'
      : delBot ? 'lo del bot y lo común: desde el siguiente día hábil'
      : f === hoy ? 'desde hoy' : `cambia cómo se juzgan los días desde el ${dma(f)}`
    h.classList.toggle('pm-atras', !!f && f <= hoy && (delBot || f < hoy))
  }

  function pintarMercado() {
    const el = document.getElementById('pmMercado')
    if (!el) return
    const mercado = D.claves.filter(c => c.grupo === 'mercado').map(fila).join('')
    const tecnicos = D.claves.filter(c => c.grupo === 'tecnico')
    el.innerHTML = `<div class="pm-h"><i class="ti ti-chart-candle"></i> Lectura del mercado · común a todos los perfiles
        <span class="pm-tag">el motor marca con estos</span></div>
      ${mercado}
      <details class="pm-tecnicos"><summary>Técnicos (${tecnicos.length}) · se ven, no se editan</summary>${tecnicos.map(fila).join('')}</details>
      <div class="pm-nota"><i class="ti ti-info-circle"></i> Comunes porque el mercado es uno: tu juicio y el del bot salen de la misma lectura. Un cambio vale desde el siguiente día hábil (el bot ya se armó hoy, y el umbral no se cambia con la sesión empezada).</div>`
  }

  function pintarHistorial() {
    const el = document.getElementById('pmHistorial')
    if (!el) return
    const c = clave(claveHist) || clave('STOP_MAX')
    if (!c) { el.innerHTML = ''; return }
    const hoy = hoyISO()
    // Del perfil que se mira, y de los demás perfiles para comparar (si la clave es de perfil).
    const filas = D.valores.filter(v => v.clave === c.clave && (c.ambito === 'comun' || v.perfil))
      .sort((a, b) => b.desde.localeCompare(a.desde) || (a.perfil === perfil ? -1 : 1))
    const vigentes = new Set(D.perfiles.map(p => (paramVigente(D.valores, c.clave, p.codigo, hoy) || {}).id))
    const items = filas.map(v => {
      const fut = v.desde > hoy
      const etq = v.perfil ? `<span class="pm-lbl${v.perfil === perfil ? ' pm-lbl-on' : ''}">${esc(nombre(v.perfil))}</span>` : ''
      const estado = fut ? '<span class="pm-lbl pm-lbl-prog">programado</span>' : vigentes.has(v.id) ? '<span class="pm-lbl pm-lbl-vig">vigente</span>' : ''
      const borrar = fut
        ? `<button type="button" class="pm-borrar" data-borrar="${v.id}" title="Quitar el programado"><i class="ti ti-x"></i></button>` : ''
      return `<li class="${fut ? 'pm-fut' : ''}${v.perfil && v.perfil !== perfil ? ' pm-otro' : ''}">
        <b>${esc(v.numero != null ? `${num(v.numero)}${c.unidad && c.unidad !== 'fecha' ? ' ' + esc(c.unidad) : ''}` : v.texto)}</b>
        desde ${dma(v.desde)} ${etq}${estado}${borrar}
        ${v.nota ? `<small>${esc(v.nota)}</small>` : ''}</li>`
    }).join('')
    el.innerHTML = `<div class="pm-h"><i class="ti ti-history"></i> Historial · ${esc(c.etiqueta)}</div>
      <ul class="pm-tl">${items || '<li>Sin valores</li>'}</ul>
      <div class="pm-sub">Cada día se juzga con el valor que su perfil tenía ese día.</div>`
  }

  function pintarCuentas() {
    const el = document.getElementById('pmCuentas')
    if (!el) return
    const opts = sel => D.perfiles.map(p => `<option value="${esc(p.codigo)}"${p.codigo === sel ? ' selected' : ''}>${esc(p.nombre)}</option>`).join('')
    const principal = DB.cuentaPrincipal()
    const filas = D.cuentas.map(c => `<div class="pm-cta">
        <div class="pm-n">${esc(c.cuenta)}<small>${c.cuenta === principal ? 'cuenta principal' : c.perfil === 'bot' ? 'el bot' : ''}</small></div>
        <select class="filter-select pm-sel" data-cuenta="${esc(c.cuenta)}">${opts(c.perfil)}</select>
        <button type="button" class="pm-borrar" data-quitar="${esc(c.cuenta)}" title="Quitar: usará el perfil predeterminado"><i class="ti ti-x"></i></button>
      </div>`).join('')
    const libres = conocidas.filter(c => !D.cuentas.some(x => x.cuenta === c))
    const anadir = libres.length ? `<div class="pm-cta pm-cta-nueva">
        <select class="filter-select" id="pmCtaNueva"><option value="">+ cuenta…</option>${libres.map(c => `<option>${esc(c)}</option>`).join('')}</select>
        <select class="filter-select pm-sel" id="pmCtaNuevaPerfil">${opts(predeterminado())}</select>
        <button type="button" class="btn-primary pm-btn-sm" id="pmCtaAnadir">Añadir</button>
      </div>` : ''
    el.innerHTML = `<div class="pm-h"><i class="ti ti-link"></i> Cuentas → perfil</div>
      ${filas}${anadir}
      <div class="pm-sub">Una cuenta que no esté aquí usa <b>${esc(nombre(predeterminado()))}</b>.</div>`
  }

  // ── Acciones ────────────────────────────────────────────────────────────
  async function guardar() {
    desde = document.getElementById('pmDesde')?.value || desde
    if (!desde) { Toast.show('Elige desde qué día vale', 'warning'); return }
    for (const [k, n] of Object.entries(cambios)) {
      if (!(n > 0)) { Toast.show(`${clave(k).etiqueta}: tiene que ser mayor que 0`, 'warning'); return }
      if (k === 'STOP_MAX' && Math.round(n * 4) !== n * 4) { Toast.show('El stop va en cuartos de punto (0,25)', 'warning'); return }
    }
    if (contratosQueCaben(valor('STOP_MAX'), valor('RIESGO_MAX')) < 1) return
    // Lo que lee el bot (su perfil y lo común) no puede valer desde hoy ni hacia atrás: hoy ya se armó con lo de antes,
    // y una fecha pasada diría que operó con números que no tenía.
    const delBot = DEL_BOT.has(perfil) || Object.keys(cambios).some(k => clave(k).ambito === 'comun')
    if (delBot && desde <= hoyISO()) {
      Toast.show(`Lo del bot y lo común valen desde el siguiente día hábil (${dma(siguienteHabil())}): hoy el bot ya se armó`, 'warning'); return
    }
    const btn = document.getElementById('pmGuardar')
    if (btn) btn.disabled = true
    try {
      for (const [k, n] of Object.entries(cambios)) {
        const comun = clave(k).ambito === 'comun'
        await DB.guardarParametro({ clave: k, perfil: comun ? null : perfil, numero: n, texto: textoParametro(k, n), desde })
      }
      const cuantos = Object.keys(cambios).length, f = desde
      cambios = {}; desde = null
      await recargar()
      Toast.show(`${cuantos === 1 ? 'Guardado' : `${cuantos} cambios guardados`} · desde el ${dma(f)}`, 'success')
    } catch (e) {
      Toast.show('Error al guardar: ' + e.message, 'error')
      if (btn) btn.disabled = false
    }
  }

  async function recargar() {
    D = await DB.getParametros()
    if (!D.perfiles.some(p => p.codigo === perfil)) perfil = predeterminado()
    render()
  }

  function cablear() {
    if (cableado) return
    cableado = true
    const panel = document.getElementById('data-panel-parametros')
    if (!panel) return
    panel.addEventListener('click', async e => {
      const t = e.target.closest('button')
      if (!t) return
      if (t.dataset.perfil) {
        if (Object.keys(cambios).length && !confirm('Hay cambios sin guardar. ¿Descartarlos?')) return
        cambios = {}; desde = null; perfil = t.dataset.perfil; render(); return
      }
      if (t.dataset.hist) { claveHist = t.dataset.hist; pintarHistorial(); pintarRiesgo(); pintarMercado(); return }
      if (t.id === 'pmDescartar') { cambios = {}; desde = null; render(); return }
      if (t.id === 'pmGuardar') { await guardar(); return }
      if (t.id === 'pmNuevo') { creando = true; pintarPerfiles(); return }
      if (t.id === 'pmNuevoNo') { creando = false; pintarPerfiles(); return }
      if (t.id === 'pmNuevoOk') {
        const n = document.getElementById('pmNuevoNombre')?.value.trim()
        if (!n) { Toast.show('Escribe el nombre del perfil', 'warning'); return }
        try {
          perfil = await DB.crearPerfil(n, perfil || predeterminado())
          creando = false; cambios = {}
          await recargar()
          Toast.show(`Perfil «${n}» creado con los valores de hoy`, 'success')
        } catch (err) { Toast.show('Error al crear el perfil: ' + err.message, 'error') }
        return
      }
      if (t.dataset.borrar) {
        if (!confirm('¿Quitar este valor programado?')) return
        try { await DB.borrarParametro(+t.dataset.borrar); await recargar() }
        catch (err) { Toast.show('Error: ' + err.message, 'error') }
        return
      }
      if (t.dataset.quitar) {
        try { await DB.quitarCuentaPerfil(t.dataset.quitar); await recargar() }
        catch (err) { Toast.show('Error: ' + err.message, 'error') }
        return
      }
      if (t.id === 'pmCtaAnadir') {
        const c = document.getElementById('pmCtaNueva')?.value
        const p = document.getElementById('pmCtaNuevaPerfil')?.value
        if (!c) { Toast.show('Elige la cuenta', 'warning'); return }
        try { await DB.asignarPerfil(c, p); await recargar(); Toast.show(`${c} → ${nombre(p)}`, 'success') }
        catch (err) { Toast.show('Error: ' + err.message, 'error') }
      }
    })
    panel.addEventListener('input', e => {
      const inp = e.target.closest('.pm-inp[data-clave]')
      if (inp) {
        const k = inp.dataset.clave
        const n = parseFloat(inp.value)
        const vig = paramVigente(D.valores, k, perfil)
        if (!isNaN(n) && !(vig && +vig.numero === n)) cambios[k] = n
        else delete cambios[k]
        // Repintar sin perder el foco: se reconstruye el bloque y se devuelve el cursor.
        const pos = inp.selectionStart
        pintarRiesgo()
        if (clave(k).ambito === 'comun') pintarMercado()     // su fila está en el bloque de mercado
        const de = document.querySelector(`.pm-inp[data-clave="${k}"]`)
        if (de) { de.focus(); try { de.setSelectionRange(pos, pos) } catch (_) {} }
        return
      }
      if (e.target.id === 'pmDesde') { desde = e.target.value; pintarDesdeHint() }
    })
    panel.addEventListener('change', async e => {
      const s = e.target.closest('select[data-cuenta]')
      if (!s) return
      try { await DB.asignarPerfil(s.dataset.cuenta, s.value); await recargar(); Toast.show(`${s.dataset.cuenta} → ${nombre(s.value)}`, 'success') }
      catch (err) { Toast.show('Error: ' + err.message, 'error') }
    })
    panel.addEventListener('keydown', e => {
      if (e.key === 'Enter' && e.target.id === 'pmNuevoNombre') { e.preventDefault(); document.getElementById('pmNuevoOk')?.click() }
    })
  }

  async function init() {
    cablear()
    try {
      const [d, c] = await Promise.all([DB.getParametros(), DB.getCuentasConocidas().catch(() => [])])
      D = d
      conocidas = [...new Set([...(c || []), 'SimBot'])].sort()
      if (!perfil) perfil = predeterminado()
      render()
    } catch (e) {
      const el = document.getElementById('pmRiesgo')
      if (el) el.innerHTML = `<div class="pm-aviso pm-mal"><i class="ti ti-alert-triangle"></i><div>No se pudieron leer los parámetros: ${esc(e.message)}</div></div>`
    }
  }

  return { init }
})()
