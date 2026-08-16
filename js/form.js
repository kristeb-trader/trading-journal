// Session registration form
const SessionForm = (() => {
  let editingDate = null // set when editing an existing session
  let retrocesoCancelId = 0
  let suppressAutoLoad = false // evita que onShow pise la carga de prefill (editar día pasado)
  let objetivos = null // stop_max_usd etc. para la alerta de riesgo (Bloque 1)

  function setToday() {
    const today = new Date().toISOString().slice(0, 10)
    document.getElementById('sesionDate').value = today
  }

  // Propaga la fecha activa al resto de Sesión Operativa: el recuadro de
  // resultado de la cabecera y, si el Coach ya se abrió alguna vez, la fecha que
  // analiza. Antes cada pantalla llevaba su propia fecha y no se hablaban.
  function syncFechaGlobal(date) {
    if (typeof SesionOperativa !== 'undefined') SesionOperativa.syncHead(date)
    if (typeof Coach !== 'undefined' && Coach.setFecha) Coach.setFecha(date)
  }

  // Modo lectura ('view') vs edición ('edit'). En 'view' se bloquea todo el
  // fieldset y se ocultan acciones; el botón "Editar sesión" desbloquea.
  function setMode(mode) {
    const view = mode === 'view'
    const fs  = document.getElementById('sessionFieldset')
    const sec = document.getElementById('section-register')
    if (fs)  fs.disabled = view
    if (sec) sec.classList.toggle('view-mode', view)
    marcarVacios(view)
  }

  // En lectura, un día se consulta: los valores se leen como texto (lo hace el
  // CSS) y lo que está vacío se esconde, en vez de dejar decenas de cajas en
  // blanco. Al pulsar "Editar sesión" vuelve a aparecer todo para poder llenarlo.
  function marcarVacios(view) {
    const sec = document.getElementById('section-register')
    if (!sec) return
    const conValor = el => {
      if (!el) return false
      if (el.type === 'checkbox' || el.type === 'radio') return el.checked
      return String(el.value || '').trim() !== ''
    }
    // Grupos simples: se ocultan si ninguno de sus controles tiene valor
    sec.querySelectorAll('.premkt-field, .premkt-lines-col, .emo-col, .form-group[data-vacio-auto]')
      .forEach(g => {
        const controles = [...g.querySelectorAll('input, select, textarea')]
          .filter(c => c.type !== 'hidden')
        const vacio = controles.length > 0 && !controles.some(conValor)
        g.classList.toggle('vacio-en-lectura', view && vacio)
      })
    // Grupos de botones (corrida, zonas en contra…): vacíos si no hay opción
    // activa. OJO: solo se oculta el grupo si los botones son TODO su contenido.
    // Sin esta comprobación, los T/S de errores y experimentos —que están sin
    // elegir mientras solo se consulta— se llevaban por delante la lista entera
    // de errores y experimentos del día.
    sec.querySelectorAll('.btn-group').forEach(g => {
      const grupo = g.closest('.form-group')
      if (!grupo) return
      const tieneMasContenido = grupo.querySelector(
        '.cas-list, .exp-list, select, textarea, input:not([type="hidden"])')
      if (tieneMasContenido) return
      const sinElegir = !g.querySelector('.btn-option.active')
      grupo.classList.toggle('vacio-en-lectura', view && sinElegir)
    })
    // Estrellas de confianza: sin valoración no aportan nada en lectura
    const conf = document.getElementById('confianzaVal')
    document.getElementById('confianzaStars')?.closest('.emo-col')
      ?.classList.toggle('vacio-en-lectura', view && !conValor(conf))

    // "No operé hoy": en lectura solo se enseña si el día FUE de no operar.
    const noOpero = document.getElementById('noOpero')
    noOpero?.closest('.form-row')
      ?.classList.toggle('vacio-en-lectura', view && !noOpero.checked)
  }

  // ── Checklist dinámico (catálogo en BD) ────────────────────────────────────
  let checklistItems = []
  let _checklistResolve
  let checklistReady = new Promise(r => { _checklistResolve = r })

  const FASE_META = {
    1: { titulo: 'Fase 1 · Pre-sesión',        when: 'antes de que exista setup',      icon: 'ti-sunrise' },
    2: { titulo: 'Fase 2 · Lectura del setup', when: 'análisis antes de entrar',        icon: 'ti-eye' },
    3: { titulo: 'Fase 3 · Ejecución',         when: 'colocar y gestionar la orden',    icon: 'ti-target' },
  }

  async function loadChecklist() {
    try { checklistItems = await DB.getChecklistItems({ soloActivos: true }) }
    catch { checklistItems = [] }
    if (!checklistItems || !checklistItems.length) checklistItems = DB.checklistClaves().length ? checklistItems : []
    renderChecklist()
    _checklistResolve()
  }

  // ── Setups paramétricos (catalogo_setups + catalogo_setup_variantes) ───────
  let _setupsResolve
  let setupsReady = new Promise(r => { _setupsResolve = r })

  // Puebla los dos selectores de setup desde el catálogo, agrupados por familia.
  // Un setup nuevo en BD aparece aquí solo, sin tocar código.
  async function loadSetups() {
    try {
      const [familias, variantes] = await Promise.all([DB.getSetups(), DB.getSetupVariantes()])
      const opts = familias.map(f => {
        const vs = variantes.filter(v => v.setup_codigo === f.codigo)
        if (!vs.length) return ''
        const items = vs.map(v => `<option value="${v.nombre}" data-codigo="${v.codigo}">${v.nombre}</option>`).join('')
        return `<optgroup label="${f.nombre}">${items}</optgroup>`
      }).join('')
      // Variantes sin familia válida (defensivo): no deben quedar ocultas
      const huerfanas = variantes
        .filter(v => !familias.some(f => f.codigo === v.setup_codigo))
        .map(v => `<option value="${v.nombre}" data-codigo="${v.codigo}">${v.nombre}</option>`).join('')
      const html = '<option value="">Seleccionar setup...</option>' + opts + huerfanas
      ;['setup', 'setupObservado'].forEach(id => {
        const sel = document.getElementById(id)
        if (!sel) return
        const prev = sel.value
        sel.innerHTML = html
        if (prev) sel.value = prev   // conservar la selección al recargar
      })
    } catch (_) { /* sin conexión: quedan las opciones que hubiera */ }
    _setupsResolve()
  }

  // Familia del setup elegido en el formulario (para filtrar el checklist).
  function setupFamily() {
    return DB.setupFamily({ setup: document.getElementById('setup')?.value || null })
  }

  function renderChecklist() {
    const cont = document.getElementById('checklistContainer')
    if (!cont) return
    // Preservar marcas actuales (al re-renderizar tras cambiar el setup)
    const prev = {}
    cont.querySelectorAll('input[type="checkbox"]').forEach(c => { prev[c.dataset.clave] = c.checked })
    // Filtrar por el setup del día: ítems universales + los del setup elegido.
    // Sin setup elegido solo se muestran los universales: las reglas de un setup
    // no se pueden validar si aún no se sabe cuál se operó (antes se mostraban
    // las de TODOS los setups mezcladas).
    const fam = setupFamily()
    const visibles = checklistItems.filter(i => !i.setup || i.setup === fam)
    const byFase = { 1: [], 2: [], 3: [] }
    visibles.forEach(i => (byFase[i.fase] || byFase[1]).push(i))
    // El GO se marca UNA sola vez en todo el checklist (cae dentro de la Fase 2):
    // a partir de ahí, lo que queda solo se puede confirmar con el trade ya hecho.
    let goPuesto = false
    cont.innerHTML = [1, 2, 3].map(f => {
      const items = byFase[f]
      if (!items.length) return ''
      // Fase 1 siempre visible; Fases 2/3 solo cuando se operó (op-only)
      const opOnly = f !== 1 ? ' op-only' : ''
      // Separador del GO: hay ítems que se marcan ANTES de entrar y otros que solo
      // se pueden confirmar DESPUÉS. Marcar los segundos antes de tiempo obligaba
      // a mentir o a perder el trade.
      const checks = items.map(i => {
        let sep = ''
        if (!goPuesto && i.bloquea_go === false) {
          goPuesto = true
          sep = `<div class="go-sep"><span><i class="ti ti-player-play"></i> GO</span><small>lo de abajo se marca después de entrar</small></div>`
        }
        // Ítems verificados por dato: no se marcan, los resuelve el sistema con los
        // trades del día. Se muestran para que se vea que existen y qué vigilan.
        if ((i.evidencia || 'declarada') === 'auto') {
          return `${sep}
        <div class="check-item check-auto" title="${(i.enunciado || '').replace(/"/g, '&quot;')}">
          <span class="check-auto-icon"><i class="ti ti-settings-automation"></i></span>
          <span>${i.texto}</span>
          <span class="check-auto-tag">automático</span>
        </div>`
        }
        return `${sep}
        <label class="check-item">
          <input type="checkbox" id="chk__${i.clave}" data-clave="${i.clave}" data-fase="${f}" name="${i.clave}"${prev[i.clave] ? ' checked' : ''}>
          <span class="check-box"></span>
          <span>${i.texto}</span>
        </label>`
      }).join('')
      // Fase 2 sin setup elegido: avisar que faltan las reglas propias del setup
      const aviso = (f === 2 && !fam)
        ? `<div class="phase-hint"><i class="ti ti-info-circle"></i> Elige el <b>SetUp</b> en Operativa para ver sus reglas propias.</div>`
        : ''
      const badge = (f === 2 && fam) ? `<span class="phase-setup-badge">${DB.setupLabel(fam)}</span>` : ''
      // Cada fase se pliega por separado: de un vistazo se ven las 3 con su
      // contador, y solo se abre la que se quiera revisar.
      return `
        <div class="phase-card phase-card-${f}${opOnly} plegada">
          <button type="button" class="phase-card-head" data-fase-toggle="${f}">
            <span class="phase-card-icon"><i class="ti ${FASE_META[f].icon}"></i></span>
            <div class="phase-card-titles">
              <div class="phase-card-title">${FASE_META[f].titulo}${badge}</div>
              <div class="phase-card-when">${FASE_META[f].when}</div>
            </div>
            <span class="phase-progress" id="phaseProg${f}">0/${items.filter(i => (i.evidencia || 'declarada') !== 'auto').length}</span>
            <i class="ti ti-chevron-down phase-chevron"></i>
          </button>
          <div class="phase-card-body">
            ${aviso}
            <div class="checklist">${checks}</div>
          </div>
        </div>`
    }).join('')
    cont.querySelectorAll('input[type="checkbox"]').forEach(c => c.addEventListener('change', updatePhaseProgress))
    cont.querySelectorAll('[data-fase-toggle]').forEach(btn => {
      btn.addEventListener('click', () => btn.closest('.phase-card').classList.toggle('plegada'))
    })
    // Fases 2/3 solo aplican cuando se operó: ocultarlas si "No operé Hoy" está activo
    if (document.getElementById('noOpero')?.checked)
      cont.querySelectorAll('.op-only').forEach(el => el.classList.add('hidden'))
    updatePhaseProgress()
  }

  // Barra de cumplimiento del checklist (visible con la tarjeta plegada).
  // Cuenta solo los ítems VISIBLES, que son los aplicables al setup del día.
  function updateChecklistBar() {
    const fill = document.getElementById('chkProgFill')
    const pct  = document.getElementById('chkProgPct')
    if (!fill || !pct) return
    const inputs = [...document.querySelectorAll('#checklistContainer input[type="checkbox"]')]
      .filter(i => i.offsetParent !== null || !i.closest('.hidden'))
    const total = inputs.length
    const ok = inputs.filter(i => i.checked).length
    const p = total ? Math.round(ok / total * 100) : 0
    fill.style.width = p + '%'
    fill.classList.toggle('full', total > 0 && ok === total)
    pct.textContent = total ? `${p}%` : '—'
    pct.title = total ? `${ok} de ${total} reglas` : 'Sin reglas aplicables'
  }

  // ── Emoción y confianza (antes vivían en el Coach) ────────────────────────
  let emocionesCat = []

  async function loadEmociones() {
    try { emocionesCat = await DB.getCatalogoEmociones() } catch { emocionesCat = [] }
    const opts = e => `<option value="${e.id}">${e.emoji || ''} ${e.nombre}</option>`
    const ini = document.getElementById('emocionInicio')
    const fin = document.getElementById('emocionFin')
    if (ini) { const p = ini.value; ini.innerHTML = '<option value="">Estado al inicio</option>' + emocionesCat.map(opts).join(''); ini.value = p }
    if (fin) { const p = fin.value; fin.innerHTML = '<option value="">Estado al cierre</option>' + emocionesCat.map(opts).join(''); fin.value = p }
  }

  function setConfianza(n) {
    const val = document.getElementById('confianzaVal')
    if (val) val.value = n || ''
    document.querySelectorAll('#confianzaStars .emo-star').forEach(b =>
      b.classList.toggle('on', n && parseInt(b.dataset.val) <= n))
  }

  // Delegación en el contenedor y con guarda: si `init()` llegara a correr dos
  // veces, dos listeners por estrella harían que el segundo leyera el valor que
  // acaba de poner el primero y lo interpretara como "volver a pulsar" → la
  // valoración se borraba sola al hacer clic.
  function setupConfianza() {
    const cont = document.getElementById('confianzaStars')
    if (!cont || cont.dataset.wired) return
    cont.dataset.wired = '1'
    cont.addEventListener('click', e => {
      const b = e.target.closest('.emo-star')
      if (!b) return
      const n = parseInt(b.dataset.val)
      // Volver a pulsar la misma estrella limpia la valoración
      const actual = parseInt(document.getElementById('confianzaVal')?.value) || 0
      setConfianza(actual === n ? 0 : n)
    })
  }

  // Chips del título de "Cierre del día": errores y experimentos del día.
  function updateCierreMeta() {
    const el = document.getElementById('cierreMeta')
    if (!el) return
    const chips = []
    if (casPendientes.length) chips.push(`<span class="chip-soft">${casPendientes.length} error${casPendientes.length !== 1 ? 'es' : ''}</span>`)
    if (expRegistros.length)  chips.push(`<span class="chip-soft">${expRegistros.length} experimento${expRegistros.length !== 1 ? 's' : ''}</span>`)
    el.innerHTML = chips.join('')
  }

  // Trades del día dentro de "La operación" + sus chips (puntos y nº de trades).
  // Misma cuenta y mismo cálculo de puntos que usa la vista del día.
  let tradesCancelId = 0
  async function renderTradesDia(date) {
    const wrap = document.getElementById('opTradesWrap')
    const meta = document.getElementById('opMeta')
    if (!wrap) return
    const myId = ++tradesCancelId
    wrap.innerHTML = ''
    if (meta) meta.innerHTML = ''
    if (!date) return

    let trades = []
    try { trades = await DB.getTradesByDate(date) } catch { return }
    if (myId !== tradesCancelId) return          // llegó una fecha más nueva

    // Sin filtro por cuenta principal: la cuenta de Apex rota y filtrar por la
    // de hoy vaciaba los días operados con una cuenta anterior.
    const propios = trades || []
    if (!propios.length) {
      wrap.innerHTML = '<p class="op-trades-empty">Sin trades registrados este día.</p>'
      return
    }

    const ptsDe = t => {
      const e = parseFloat(t.entry_price), x = parseFloat(t.exit_price)
      if (!isFinite(e) || !isFinite(x)) return null
      return /short|sell/i.test(t.market_pos || '') ? e - x : x - e
    }
    const totalPts = propios.reduce((a, t) => a + (ptsDe(t) ?? 0), 0)
    const totalPnl = propios.reduce((a, t) => a + (parseFloat(t.profit) || 0), 0)

    if (meta) meta.innerHTML =
      `<span class="chip-pts ${totalPts < 0 ? 'neg' : 'pos'}">${totalPts >= 0 ? '+' : ''}${totalPts.toFixed(1)} pts</span>` +
      `<span class="chip-soft">${propios.length} trade${propios.length !== 1 ? 's' : ''}</span>`

    const fmtHora = h => (h || '').slice(0, 5)
    wrap.innerHTML = `
      <table class="op-trades">
        <tr><th>Hora</th><th>Dir</th><th>Entrada → Salida</th><th>Puntos</th><th>Resultado</th><th class="ta-r">P&amp;L</th></tr>
        ${propios.map(t => {
          const p = ptsDe(t)
          const pnl = parseFloat(t.profit) || 0
          const dir = /short|sell/i.test(t.market_pos || '') ? 'Short' : 'Long'
          return `<tr>
            <td>${fmtHora(t.entry_time)}</td>
            <td>${dir}</td>
            <td>${t.entry_price ?? '—'} → ${t.exit_price ?? '—'}</td>
            <td class="${p != null && p < 0 ? 'neg' : 'pos'}">${p != null ? (p >= 0 ? '+' : '') + p.toFixed(1) : '—'}</td>
            <td>${t.resultado || '—'}</td>
            <td class="ta-r ${pnl < 0 ? 'neg' : 'pos'}">${pnl >= 0 ? '+' : '−'}$${Math.abs(pnl).toFixed(2)}</td>
          </tr>`
        }).join('')}
        <tr class="op-trades-total">
          <td colspan="3">Total</td>
          <td class="${totalPts < 0 ? 'neg' : 'pos'}">${totalPts >= 0 ? '+' : ''}${totalPts.toFixed(1)}</td>
          <td></td>
          <td class="ta-r ${totalPnl < 0 ? 'neg' : 'pos'}">${totalPnl >= 0 ? '+' : '−'}$${Math.abs(totalPnl).toFixed(2)}</td>
        </tr>
      </table>`
  }

  function updatePhaseProgress() {
    [1, 2, 3].forEach(f => {
      const inputs = [...document.querySelectorAll(`#checklistContainer input[data-fase="${f}"]`)]
      const el = document.getElementById('phaseProg' + f)
      if (!el) return
      const done = inputs.filter(i => i.checked).length
      el.textContent = `${done}/${inputs.length}`
      el.classList.toggle('complete', inputs.length > 0 && done === inputs.length)
    })
    updateChecklistBar()   // la barra del título resume las tres fases
  }

  // Cards colapsables: el título hace de cabecera clickable con flecha.
  // Arrancan colapsadas (vista compacta). La card Imagen no lleva .collapsible.
  function setupCollapsibles() {
    document.querySelectorAll('#section-register .collapsible').forEach(card => {
      const title = card.querySelector(':scope > .form-section-title')
      if (!title || title.dataset.collapsibleReady) return
      title.dataset.collapsibleReady = '1'
      const chev = document.createElement('i')
      chev.className = 'ti collapse-chevron'
      title.appendChild(chev)
      // El glifo indica el estado: ▼ colapsado (clic para abrir), ▲ abierto.
      // Se intercambia el icono en vez de rotarlo con CSS transform, que es
      // frágil sobre los <i> de icono-fuente de Tabler.
      const syncChevron = () => {
        const collapsed = card.classList.contains('collapsed')
        chev.classList.toggle('ti-chevron-down', collapsed)
        chev.classList.toggle('ti-chevron-up', !collapsed)
      }
      card.classList.add('collapsed')
      syncChevron()
      title.addEventListener('click', () => { card.classList.toggle('collapsed'); syncChevron() })
    })
  }

  function setupBtnGroups() {
    document.querySelectorAll('.btn-group').forEach(group => {
      group.querySelectorAll('.btn-option').forEach(btn => {
        btn.addEventListener('click', () => {
          group.querySelectorAll('.btn-option').forEach(b => b.classList.remove('active'))
          btn.classList.add('active')
          // write value to associated hidden input
          const hiddenId = { corrida:'numCorrida', zonasContra:'zonasContraVal', alertaVista:'alertaVistaVal' }[group.id]
          const hidden = hiddenId && document.getElementById(hiddenId)
          if (hidden) hidden.value = btn.dataset.value
        })
      })
    })
  }

  function setupNoOperoToggle() {
    const toggle = document.getElementById('noOpero')
    const motivoGroup = document.getElementById('motivoGroup')
    // Bloques que solo aplican cuando sí se operó (Operativa, checklist operativa, experimentos)
    const setOpOnly = hidden =>
      document.querySelectorAll('.op-only').forEach(el => el.classList.toggle('hidden', hidden))
    toggle.addEventListener('change', () => {
      if (toggle.checked) {
        motivoGroup.classList.remove('hidden')
        setOpOnly(true)
      } else {
        motivoGroup.classList.add('hidden')
        setOpOnly(false)
      }
      updatePremercadoVisibility()
      renderExpList()
    })

    // Mostrar campos extra cuando el motivo es "Setup válido no tomado".
    // Experimentos visibles en motivos donde hubo conexión y análisis de jornada
    // (aunque no se operara); ocultos si no hubo conexión (festivo, personal, otro).
    const MOTIVOS_CONECTADO = ['Setup válido no tomado', 'Sin setup', 'Noticia roja', 'FOMC']
    document.getElementById('motivoNoOpero').addEventListener('change', function() {
      const isSetupNoTomado = this.value === 'Setup válido no tomado'
      document.getElementById('setupNoTomadoGroup').classList.toggle('hidden', !isSetupNoTomado)
      document.getElementById('expNoOperoWrap').classList.toggle('hidden', !MOTIVOS_CONECTADO.includes(this.value))
    })

    // Btn-group: motivo no entrada
    setupBtnGroupHidden('motivoNoEntradaGroup', 'motivoNoEntradaVal')

    // Nada que hacer aquí — los experimentos se cargan dinámicamente en loadExperimentos()
  }

  // Helper: btn-group que escribe en un hidden input
  function setupBtnGroupHidden(groupId, hiddenId) {
    document.getElementById(groupId)?.querySelectorAll('.btn-option').forEach(btn => {
      btn.addEventListener('click', () => {
        document.getElementById(groupId).querySelectorAll('.btn-option').forEach(b => b.classList.remove('active'))
        btn.classList.add('active')
        document.getElementById(hiddenId).value = btn.dataset.value
      })
    })
  }

  // ── Premercado ─────────────────────────────────────────────────────────────
  let soportesNaranja = null
  let resistenciasNaranja = null

  // Líneas naranjas progresivas: muestra una input vacía a la vez; al llenarla
  // se revela la siguiente, hasta 5. Ninguna obligatoria.
  function setupNaranjaLines(wrapId) {
    const wrap = document.getElementById(wrapId)
    if (!wrap) return null
    // Sin placeholder "Línea N": en lectura se leía como si hubiera un registro
    // vacío. Las cajas sin valor se esconden solas (ver `refresh`).
    wrap.innerHTML = Array.from({ length: 5 }, (_, i) =>
      `<input type="number" step="0.25" class="premkt-line${i > 0 ? ' hidden' : ''}" data-i="${i}" placeholder="">`
    ).join('')
    const inputs = [...wrap.querySelectorAll('.premkt-line')]
    const refresh = () => {
      inputs.forEach((inp, i) => {
        const reveal = i === 0 || inputs[i - 1].value.trim() !== ''
        inp.classList.toggle('hidden', !reveal && inp.value.trim() === '')
      })
    }
    inputs.forEach(inp => inp.addEventListener('input', refresh))
    return {
      refresh,
      getValues: () => inputs.map(i => i.value.trim()).filter(v => v !== '').map(Number),
      setValues: (arr) => { inputs.forEach((inp, i) => { inp.value = (arr && arr[i] != null) ? arr[i] : '' }); refresh() },
      clear: () => { inputs.forEach(i => { i.value = '' }); refresh() },
    }
  }

  function updatePremktPuntos() {
    const num = id => parseFloat(document.getElementById(id)?.value)
    const rango = (a, b) => (!isNaN(a) && !isNaN(b)) ? `${(a - b).toFixed(2)} pts` : '— pts'
    const prev = document.getElementById('rangoPrevDay')   // PDH − PDL
    const on   = document.getElementById('rangoOvernight') // ONH − ONL
    if (prev) prev.textContent = rango(num('precioMaxAyer'), num('precioMinAyer'))
    if (on)   on.textContent   = rango(num('precioMaxPre'), num('precioMinPre'))
  }

  // Premercado visible cuando se operó, o cuando no se operó pero sí se conectó
  function updatePremercadoVisibility() {
    const noOpero = document.getElementById('noOpero')?.checked
    const seConecto = document.getElementById('seConecto')?.checked
    document.getElementById('seConectoGroup')?.classList.toggle('hidden', !noOpero)
    const show = !noOpero || seConecto
    document.getElementById('premercadoSection')?.classList.toggle('hidden', !show)
  }

  function setupPremercado() {
    soportesNaranja     = setupNaranjaLines('soportesNaranjaWrap')
    resistenciasNaranja = setupNaranjaLines('resistenciasNaranjaWrap')
    ;['precioMaxAyer','precioMinAyer','precioMaxPre','precioMinPre'].forEach(id =>
      document.getElementById(id)?.addEventListener('input', updatePremktPuntos))
    document.getElementById('seConecto')?.addEventListener('change', updatePremercadoVisibility)
    document.getElementById('addNoticiaRoja')?.addEventListener('click', addNoticiaRoja)
    renderNoticiasRojas([])
    updatePremercadoVisibility()
  }

  // ── Noticias rojas del día (varias) ───────────────────────────────────────
  // Cada una define una ventana de ±5 min en la que NO se abre posición. Estar ya
  // dentro cuando sale la noticia es válido: la regla es sobre la entrada.
  // Cada fila lleva DOS caras: la de lectura (hora + noticia, limpia) y la de
  // edición (los inputs). El CSS enseña una u otra según el modo, así el día se
  // lee de un vistazo y solo aparecen los campos cuando se va a escribir.
  // No se muestra la ventana "No operar HH:MM → HH:MM": ocupa sitio y el dato
  // que importa es la noticia. El cálculo de ±5 min sigue vivo en db.js, que es
  // quien avisa si un trade entró dentro de la ventana.
  function filaNoticiaHtml(n = {}) {
    const hora = n.hora || ''
    const nombre = (n.nombre || '').replace(/"/g, '&quot;')
    const esc = s => (s || '').replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]))
    return `
      <div class="nr-row">
        <div class="nr-read">
          <span class="nr-hora-txt">${esc(hora) || '--:--'}</span>
          <span class="nr-nombre-txt">${esc(n.nombre) || 'Sin nombre'}</span>
        </div>
        <div class="nr-edit">
          <input type="time" class="nr-hora" value="${hora}">
          <input type="text" class="nr-nombre" placeholder="Nombre de la noticia (ISM, NFP…)" value="${nombre}">
          <button type="button" class="nr-del" title="Quitar"><i class="ti ti-x"></i></button>
        </div>
      </div>`
  }

  function renderNoticiasRojas(lista) {
    const cont = document.getElementById('noticiasRojasList')
    if (!cont) return
    const rows = (lista || [])
    cont.innerHTML = rows.length
      ? rows.map(filaNoticiaHtml).join('')
      : '<div class="nr-empty">Sin noticias rojas</div>'
    wireNoticiasRojas()
  }

  function wireNoticiasRojas() {
    const cont = document.getElementById('noticiasRojasList')
    if (!cont) return
    cont.querySelectorAll('.nr-row').forEach(row => {
      // Escribir en los inputs actualiza la cara de lectura de esa misma fila,
      // para que al guardar no salte de un texto a otro.
      const hora   = row.querySelector('.nr-hora')
      const nombre = row.querySelector('.nr-nombre')
      const hTxt   = row.querySelector('.nr-hora-txt')
      const nTxt   = row.querySelector('.nr-nombre-txt')
      hora?.addEventListener('input',   () => { if (hTxt) hTxt.textContent = hora.value || '--:--' })
      nombre?.addEventListener('input', () => { if (nTxt) nTxt.textContent = nombre.value || 'Sin nombre' })
      row.querySelector('.nr-del')?.addEventListener('click', () => {
        row.remove()
        if (!cont.querySelector('.nr-row')) renderNoticiasRojas([])
      })
    })
  }

  function addNoticiaRoja() {
    const cont = document.getElementById('noticiasRojasList')
    if (!cont) return
    cont.querySelector('.nr-empty')?.remove()
    cont.insertAdjacentHTML('beforeend', filaNoticiaHtml())
    wireNoticiasRojas()
    cont.querySelector('.nr-row:last-child .nr-hora')?.focus()
  }

  // Lee las filas para guardar en `sesion_noticias`
  function getNoticiasRojas() {
    return [...document.querySelectorAll('#noticiasRojasList .nr-row')]
      .map(r => ({ hora: r.querySelector('.nr-hora')?.value || '', nombre: r.querySelector('.nr-nombre')?.value || '' }))
      .filter(n => n.hora)
  }

  function setupImageUpload() {
    const area = document.getElementById('uploadArea')
    const input = document.getElementById('imageUpload')
    const preview = document.getElementById('imagePreview')
    const previewImg = document.getElementById('previewImg')
    const removeBtn = document.getElementById('removeImage')

    area.addEventListener('click', () => input.click())
    area.addEventListener('dragover', e => { e.preventDefault(); area.classList.add('drag-over') })
    area.addEventListener('dragleave', () => area.classList.remove('drag-over'))
    area.addEventListener('drop', e => {
      e.preventDefault()
      area.classList.remove('drag-over')
      if (e.dataTransfer.files[0]) handleImageFile(e.dataTransfer.files[0])
    })
    input.addEventListener('change', () => { if (input.files[0]) handleImageFile(input.files[0]) })
    removeBtn.addEventListener('click', () => {
      previewImg.src = ''
      document.getElementById('imagenUrl').value = ''
      preview.classList.add('hidden')
      area.classList.remove('hidden')
    })
  }

  function handleImageFile(file) {
    // Show local preview immediately
    const reader = new FileReader()
    reader.onload = e => {
      document.getElementById('previewImg').src = e.target.result
      document.getElementById('uploadArea').classList.add('hidden')
      document.getElementById('imagePreview').classList.remove('hidden')
    }
    reader.readAsDataURL(file)

    // Upload to Cloudinary if configured
    if (CLOUDINARY_CLOUD_NAME && CLOUDINARY_UPLOAD_PRESET) {
      uploadToCloudinary(file)
    } else {
      Toast.show('Cloudinary no configurado — imagen solo visible localmente', 'warning')
    }
  }

  async function uploadToCloudinary(file) {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('upload_preset', CLOUDINARY_UPLOAD_PRESET)
    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
        method: 'POST', body: fd
      })
      const json = await res.json()
      document.getElementById('imagenUrl').value = json.secure_url
      Toast.show('Imagen subida correctamente', 'success')
    } catch {
      Toast.show('Error al subir imagen a Cloudinary', 'error')
    }
  }

  async function updateRetroceso(date) {
    const myId = ++retrocesoCancelId
    const display = document.getElementById('puntosRetrocesoDisplay')
    const hidden = document.getElementById('puntosRetroceso')
    display.textContent = '— pts'
    hidden.value = ''
    if (!date) return
    let trades = await DB.getTradesByDate(date)
    if (myId !== retrocesoCancelId) return
    // Filtrar por la cuenta seleccionada (persistida en el calendario)
    const acc = localStorage.getItem('calendarAccount')
    if (acc && acc !== 'all') {
      const abbr = a => { if (!a) return '—'; const p = a.split('-'); return p.length > 2 ? p.slice(0, 2).join('-') : a }
      trades = trades.filter(t => abbr(t.account) === acc)
    }
    let pts = null
    if (trades.length > 0) {
      // Retroceso en PUNTOS puros (independiente de # de contratos): se divide el
      // P&L neto entre $2/punto y entre el total de contratos del día.
      const netPnl = trades.reduce((s, t) => s + (parseFloat(t.profit) || 0), 0)
      const totalQty = trades.reduce((s, t) => s + (parseInt(t.qty) || 1), 0)
      pts = Math.abs(netPnl) / (2 * Math.max(totalQty, 1))
      display.textContent = `${pts.toFixed(2)} pts`
      hidden.value = pts.toFixed(2)
    }
    evalRiesgo(pts)
    renderTradesDia(date)
  }

  // Bloque 1: alerta proactiva si el retroceso (en PUNTOS) supera el stop máximo.
  function evalRiesgo(pts) {
    const group = document.getElementById('riesgoAlertGroup')
    if (!group) return
    const stopMaxPts = objetivos && objetivos.stop_max_puntos != null ? parseFloat(objetivos.stop_max_puntos) : 80
    if (pts != null && stopMaxPts != null && pts > stopMaxPts) {
      group.classList.remove('hidden')
      const txt = document.getElementById('riesgoAlertText')
      if (txt) txt.innerHTML = `El retroceso fue <b>${pts.toFixed(1)} pts</b> y supera tu límite de <b>${stopMaxPts.toFixed(0)} pts</b>.`
    } else {
      group.classList.add('hidden')
    }
  }

  function collectFormData() {
    const sesionDate = document.getElementById('sesionDate').value
    const noOpero = document.getElementById('noOpero').checked

    const payload = {
      sesion_date: sesionDate,
      no_opero: noOpero,
    }

    if (noOpero) {
      payload.motivo_no_opero = document.getElementById('motivoNoOpero').value || null
    } else {
      payload.contexto = document.getElementById('contexto').value || null
      payload.num_corrida = parseInt(document.getElementById('numCorrida').value) || null
      payload.velas_corrida = parseInt(document.getElementById('velasCorrida').value) || null
      payload.puntos_retroceso = parseFloat(document.getElementById('puntosRetroceso').value) || null
      const zonasVal = document.getElementById('zonasContraVal').value
      payload.zonas_contra = zonasVal === 'true' ? true : zonasVal === 'false' ? false : null
      payload.setup = document.getElementById('setup').value || null
      // Alerta de riesgo (Bloque 1): solo si se mostró la alerta y se respondió
      const alertaShown = !document.getElementById('riesgoAlertGroup').classList.contains('hidden')
      const alertaVal = document.getElementById('alertaVistaVal').value
      payload.alerta_riesgo_vista = (alertaShown && alertaVal !== '') ? (alertaVal === 'true') : null
    }

    // ── Checklist dinámico → { clave: bool } ──
    // Se arma el objeto de los checkboxes; DB.upsertSesion lo persiste como filas
    // en sesion_checklist (modelo relacional). La lectura se hidrata desde ahí
    // (hydrateChecklist en db.js reconstruye sesion.checklist en memoria).
    const checklist = {}
    document.querySelectorAll('#checklistContainer input[type="checkbox"]').forEach(c => {
      checklist[c.dataset.clave] = c.checked
    })
    payload.checklist = checklist

    payload.analisis_trader = document.getElementById('analisisTrader').value || null
    payload.resumen_ia = document.getElementById('resumenIA').value || null

    // Emoción de llegada y confianza son de la sesión. La de cierre pertenece al
    // diagnóstico del día, así que va aparte (ver handleSubmit).
    payload.estado_emocional_id = parseInt(document.getElementById('emocionInicio')?.value) || null
    payload.nivel_confianza     = parseInt(document.getElementById('confianzaVal')?.value) || null
    payload.imagen_url = document.getElementById('imagenUrl').value || null

    // ── Premercado (se captura si operó, o si no operó pero se conectó) ──
    const seConecto = noOpero ? document.getElementById('seConecto').checked : true
    payload.se_conecto = seConecto
    const numOrNull = id => { const v = document.getElementById(id).value; return v === '' ? null : parseFloat(v) }
    if (seConecto) {
      payload.precio_apertura_ayer = numOrNull('precioAperturaAyer')
      payload.precio_max_ayer      = numOrNull('precioMaxAyer')
      payload.precio_min_ayer      = numOrNull('precioMinAyer')
      payload.precio_cierre_ayer   = numOrNull('precioCierreAyer')
      payload.precio_apertura      = numOrNull('precioApertura')
      payload.precio_max_pre       = numOrNull('precioMaxPre')
      payload.precio_min_pre       = numOrNull('precioMinPre')
      payload.soportes_naranja     = soportesNaranja ? soportesNaranja.getValues() : []
      payload.resistencias_naranja = resistenciasNaranja ? resistenciasNaranja.getValues() : []
      // Las noticias van a sesion_noticias; un trigger sincroniza hora_noticia_roja.
      // `sesiones.noticias` (textarea libre) se retiró del formulario el 16-ago:
      // no se escribe más, pero NO se manda null para no borrar el texto histórico
      // de los días viejos (ya migrado a sesion_noticias, se conserva por si acaso).
      payload.noticiasRojas        = getNoticiasRojas()
    } else {
      payload.precio_apertura_ayer = null
      payload.precio_max_ayer    = null
      payload.precio_min_ayer    = null
      payload.precio_cierre_ayer = null
      payload.precio_apertura    = null
      payload.precio_max_pre     = null
      payload.precio_min_pre     = null
      payload.soportes_naranja     = []
      payload.resistencias_naranja = []
      payload.noticiasRojas      = []
    }

    // Setup válido no tomado (aplica cuando no_opero = true)
    if (noOpero) {
      const svnt = document.getElementById('motivoNoOpero').value === 'Setup válido no tomado'
      payload.setup_valido_no_tomado = svnt
      if (svnt) {
        payload.setup_observado   = document.getElementById('setupObservado').value || null
        payload.motivo_no_entrada = document.getElementById('motivoNoEntradaVal').value || null
      }
    }

    return payload
  }

  function clearForm() {
    document.getElementById('sessionForm').reset()
    renderChecklist()   // el reset vacía el setup: el checklist debe re-filtrarse
    updatePhaseProgress()
    document.querySelectorAll('.btn-option').forEach(b => b.classList.remove('active'))
    document.getElementById('motivoGroup').classList.add('hidden')
    document.getElementById('setupNoTomadoGroup').classList.add('hidden')
    document.getElementById('expNoOperoWrap').classList.add('hidden')
    document.querySelectorAll('.op-only').forEach(el => el.classList.remove('hidden'))
    document.getElementById('imagePreview').classList.add('hidden')
    document.getElementById('uploadArea').classList.remove('hidden')
    document.getElementById('imagenUrl').value = ''
    // Premercado
    soportesNaranja?.clear()
    resistenciasNaranja?.clear()
    const seConectoEl = document.getElementById('seConecto')
    if (seConectoEl) seConectoEl.checked = true
    updatePremktPuntos()
    updatePremercadoVisibility()
    updateRetroceso(document.getElementById('sesionDate').value)
    casPendientes = []
    renderCasList()
    setConfianza(0)
    const _ei = document.getElementById('emocionInicio'); if (_ei) _ei.value = ''
    const _ef = document.getElementById('emocionFin');    if (_ef) _ef.value = ''
    editingDate = null
    setToday()
    setMode('edit')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const sesionDate = document.getElementById('sesionDate').value
    if (!sesionDate) { Toast.show('Selecciona una fecha', 'warning'); return }

    const payload = collectFormData()
    const btn = document.getElementById('saveSession')
    btn.disabled = true
    btn.innerHTML = '<i class="ti ti-loader-2 spin"></i> Guardando...'

    try {
      await DB.upsertSesion(payload)

      // La emoción de cierre vive en `diagnosticos_diarios` (es del diagnóstico,
      // no de la sesión). Se guarda solo si hay valor, para no crear filas vacías
      // en días que nunca pasaron por el Coach.
      const emoFin = parseInt(document.getElementById('emocionFin')?.value) || null
      if (emoFin) {
        await DB.saveDiagnostico({ sesion_date: sesionDate, estado_emocional_fin_id: emoFin })
          .catch(e => Toast.show('La emoción de cierre no se pudo guardar: ' + e.message, 'warning'))
      }

      Toast.show('Sesión guardada correctamente', 'success')
      clearForm()
      setTimeout(() => {
        Nav.go('calendar')
        Calendar.load()
      }, 500)
    } catch (err) {
      Toast.show('Error al guardar: ' + err.message, 'error')
    } finally {
      btn.disabled = false
      btn.innerHTML = '<i class="ti ti-device-floppy"></i> Guardar sesión'
    }
  }

  async function prefill(sesion, date) {
    // Al navegar, prefill dispara Nav.go('register') → onShow(); este flag evita
    // que onShow recargue la sesión de hoy y pise lo que vamos a cargar aquí.
    suppressAutoLoad = true
    clearForm()
    // Navegar primero: si es la primera vez, init() llama setToday() aquí.
    // Los valores correctos se asignan DESPUÉS para pisarlo.
    document.querySelector('[data-section="register"]').click()

    if (!sesion) {
      if (date) {
        document.getElementById('sesionDate').value = date
        updateRetroceso(date)
      }
      setMode('edit') // día sin sesión: abrir editable para crear
      return
    }

    editingDate = sesion.sesion_date
    document.getElementById('sesionDate').value = sesion.sesion_date
    loadCasuisticasForDate(sesion.sesion_date)
    updateRetroceso(sesion.sesion_date)
    document.getElementById('noOpero').checked = sesion.no_opero || false
    document.getElementById('noOpero').dispatchEvent(new Event('change'))

    // ── Premercado ──
    const seConectoEl = document.getElementById('seConecto')
    if (seConectoEl) seConectoEl.checked = sesion.se_conecto !== false
    document.getElementById('precioAperturaAyer').value = sesion.precio_apertura_ayer ?? ''
    document.getElementById('precioMaxAyer').value    = sesion.precio_max_ayer ?? ''
    document.getElementById('precioMinAyer').value    = sesion.precio_min_ayer ?? ''
    document.getElementById('precioCierreAyer').value = sesion.precio_cierre_ayer ?? ''
    document.getElementById('precioApertura').value   = sesion.precio_apertura ?? ''
    document.getElementById('precioMaxPre').value     = sesion.precio_max_pre ?? ''
    document.getElementById('precioMinPre').value     = sesion.precio_min_pre ?? ''
    // Noticias rojas: se leen de sesion_noticias (con su nombre). Si la consulta
    // falla, se cae al texto sincronizado de la sesión para no perder las horas.
    DB.getNoticiasByDate(sesion.sesion_date)
      .then(ns => renderNoticiasRojas(ns))
      .catch(() => renderNoticiasRojas(
        String(sesion.hora_noticia_roja || '').split(',').filter(Boolean).map(h => ({ hora: h.trim() }))
      ))
    soportesNaranja?.setValues(sesion.soportes_naranja || [])
    resistenciasNaranja?.setValues(sesion.resistencias_naranja || [])
    updatePremktPuntos()
    updatePremercadoVisibility()

    // Los <option> de setup se pueblan desde el catálogo: hay que esperarlos
    // antes de asignar `setup` o `setupObservado` (si no, el value se descarta).
    // El checklist también, porque se re-filtra según el setup que se cargue.
    await setupsReady
    await checklistReady

    if (!sesion.no_opero) {
      document.getElementById('contexto').value = sesion.contexto || ''
      document.getElementById('velasCorrida').value = sesion.velas_corrida || ''
      document.getElementById('setup').value = sesion.setup || ''
      // Asignar .value por código NO dispara 'change', así que el checklist se
      // quedaba con el filtro del render inicial (sin setup = todas las reglas
      // mezcladas). Hay que re-renderizar a mano.
      renderChecklist()

      if (sesion.num_corrida) {
        document.getElementById('numCorrida').value = sesion.num_corrida
        document.querySelector(`#corrida [data-value="${sesion.num_corrida}"]`)?.classList.add('active')
      }
      if (sesion.zonas_contra != null) {
        const v = String(sesion.zonas_contra)
        document.getElementById('zonasContraVal').value = v
        document.querySelector(`#zonasContra [data-value="${v}"]`)?.classList.add('active')
      }
      // Alerta de riesgo: updateRetroceso (más abajo) muestra/oculta el bloque;
      // aquí restauramos la respuesta guardada de "¿la viste?".
      if (sesion.alerta_riesgo_vista != null) {
        const v = String(sesion.alerta_riesgo_vista)
        document.getElementById('alertaVistaVal').value = v
        document.querySelector(`#alertaVista [data-value="${v}"]`)?.classList.add('active')
      }
    } else {
      document.getElementById('motivoNoOpero').value = sesion.motivo_no_opero || ''
      document.getElementById('motivoNoOpero').dispatchEvent(new Event('change'))
    }

    // Setup válido no tomado
    if (sesion.setup_valido_no_tomado) {
      document.getElementById('motivoNoOpero').value = 'Setup válido no tomado'
      document.getElementById('motivoNoOpero').dispatchEvent(new Event('change'))
      if (sesion.setup_observado)   document.getElementById('setupObservado').value = sesion.setup_observado
      if (sesion.motivo_no_entrada) {
        document.getElementById('motivoNoEntradaVal').value = sesion.motivo_no_entrada
        document.querySelector(`#motivoNoEntradaGroup [data-value="${sesion.motivo_no_entrada}"]`)?.classList.add('active')
      }
    }

    // Cargar experimentos del día (se pre-llenan con los valores guardados)
    loadExperimentos(sesion.sesion_date)

    // Emoción y confianza: la de llegada y la confianza vienen en la sesión; la
    // de cierre hay que traerla del diagnóstico del día.
    const selIni = document.getElementById('emocionInicio')
    if (selIni) selIni.value = sesion.estado_emocional_id || ''
    setConfianza(parseInt(sesion.nivel_confianza) || 0)
    DB.getDiagnosticoByDate(sesion.sesion_date)
      .then(d => {
        const selFin = document.getElementById('emocionFin')
        if (selFin) selFin.value = d?.estado_emocional_fin_id || ''
      })
      .catch(() => {})

    document.getElementById('analisisTrader').value = sesion.analisis_trader || ''
    const taIA = document.getElementById('resumenIA')
    taIA.value = sesion.resumen_ia || ''
    taIA.style.height = 'auto'
    taIA.style.height = taIA.scrollHeight + 'px'
    if (sesion.imagen_url) {
      document.getElementById('imagenUrl').value = sesion.imagen_url
      document.getElementById('previewImg').src = sesion.imagen_url
      document.getElementById('imagePreview').classList.remove('hidden')
      document.getElementById('uploadArea').classList.add('hidden')
    }

    // Restaurar el checklist (desde el JSONB sesion.checklist o las columnas chk_* hidratadas)
    await checklistReady
    document.querySelectorAll('#checklistContainer input[type="checkbox"]').forEach(c => {
      const clave = c.dataset.clave
      const val = (sesion.checklist && sesion.checklist[clave] != null) ? sesion.checklist[clave] : sesion[clave]
      c.checked = !!val
    })
    updatePhaseProgress()

    setMode('view') // sesión existente: abrir en modo lectura
  }

  // ── Casuísticas ──────────────────────────────────────────────────────────
  let casResultado = null
  let casPendientes = [] // { casuistica, resultado } — sin guardar aún

  let casCatalogoTipo = {}  // nombre → tipo (para denormalizar al registrar)
  let casCatalogoFase = {}  // nombre → fase (auto-rellena el selector de fase)

  async function loadCasuisticasDropdown() {
    const items = await DB.getCatalogoCasuisticas()
    const select = document.getElementById('casCasuistica')
    const active = items.filter(i => i.activa)
    casCatalogoTipo = {}
    casCatalogoFase = {}
    items.forEach(i => { casCatalogoTipo[i.nombre] = i.tipo || null; casCatalogoFase[i.nombre] = i.fase || null })
    select.innerHTML = '<option value="">Seleccionar situación...</option>' +
      active.map(i => `<option value="${i.nombre}">${i.nombre}</option>`).join('')
  }

  function setupCasuisticas() {
    // Botones T / S
    document.querySelectorAll('#casResultadoGroup .btn-option').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#casResultadoGroup .btn-option').forEach(b => b.classList.remove('active'))
        btn.classList.add('active')
        casResultado = btn.dataset.value
      })
    })

    document.getElementById('casAgregar').addEventListener('click', async () => {
      const casuistica = document.getElementById('casCasuistica').value
      if (!casuistica) { Toast.show('Selecciona una situación', 'warning'); return }
      if (!casResultado) { Toast.show('Selecciona T o S', 'warning'); return }
      const sesionDate = document.getElementById('sesionDate').value
      if (!sesionDate) { Toast.show('Selecciona la fecha primero', 'warning'); return }

      try {
        // La fase es implícita: sale del catálogo del error
        const fase = casCatalogoFase[casuistica] || null
        const saved = await DB.saveCasuistica(sesionDate, casuistica, casResultado, casCatalogoTipo[casuistica] || null, fase)
        casPendientes.push(saved)
        renderCasList()
        document.getElementById('casCasuistica').value = ''
        document.querySelectorAll('#casResultadoGroup .btn-option').forEach(b => b.classList.remove('active'))
        casResultado = null
      } catch (e) {
        Toast.show('Error al guardar: ' + e.message, 'error')
      }
    })
  }

  function renderCasList() {
    updateCierreMeta()
    const list = document.getElementById('casList')
    // En lectura la fila de "añadir" está oculta: sin este texto la tarjeta
    // quedaría en blanco y no se sabría si es que no hubo errores o falta cargar.
    if (!casPendientes.length) { list.innerHTML = '<p class="lista-vacia">Sin errores registrados</p>'; return }
    list.innerHTML = casPendientes.map((c, i) => `
      <div class="cas-tag">
        <div class="cas-tag-left">
          <span class="${c.resultado === 'T' ? 'cas-badge-t' : 'cas-badge-s'}">${c.resultado}</span>
          ${c.fase ? `<span class="cas-fase-badge fase-${c.fase}">F${c.fase}</span>` : ''}
          <span>${c.casuistica}</span>
        </div>
        <button type="button" class="cas-del" data-idx="${i}" data-id="${c.id}" title="Eliminar">
          <i class="ti ti-x"></i>
        </button>
      </div>`).join('')

    list.querySelectorAll('.cas-del').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = parseInt(btn.dataset.id)
        const idx = parseInt(btn.dataset.idx)
        try {
          await DB.deleteCasuistica(id)
          casPendientes.splice(idx, 1)
          renderCasList()
        } catch (e) {
          Toast.show('Error al eliminar', 'error')
        }
      })
    })
  }

  async function loadCasuisticasForDate(date) {
    casPendientes = date ? await DB.getCasuisticasByDate(date) : []
    renderCasList()
  }

  function init() {
    setToday()
    DB.getObjetivos().then(o => { objetivos = o; updateRetroceso(document.getElementById('sesionDate').value) }).catch(() => {})
    updateRetroceso(document.getElementById('sesionDate').value)
    setupBtnGroups()
    setupCollapsibles()
    setupNoOperoToggle()
    setupPremercado()
    loadSetups()
    loadEmociones()
    setupConfianza()
    loadChecklist()
    setupImageUpload()
    setupCasuisticas()
    setupExperimentos()
    loadCasuisticasDropdown()
    loadExperimentos(document.getElementById('sesionDate').value)
    document.getElementById('resumenIA').addEventListener('input', function() {
      this.style.height = 'auto'
      this.style.height = this.scrollHeight + 'px'
    })
    document.getElementById('sessionForm').addEventListener('submit', handleSubmit)
    document.getElementById('clearForm').addEventListener('click', clearForm)
    document.getElementById('editarSesionBtn')?.addEventListener('click', () => setMode('edit'))

    // Navegar a una fecha: carga la sesión completa de ese día (o form limpio).
    async function goToDate(date) {
      if (!date) return
      let sesion = null
      try { sesion = await DB.getSesionByDate(date) } catch (_) {}
      prefill(sesion, date)
      // La fecha es única para toda la pantalla: arrastra la cabecera y, si el
      // Coach ya está abierto, también su análisis.
      syncFechaGlobal(date)
    }
    // Mover ±1 día con las flechas (◀ atrás / ▶ adelante)
    function shiftDate(delta) {
      const cur = document.getElementById('sesionDate').value || new Date().toISOString().slice(0, 10)
      const d = new Date(cur + 'T00:00:00')
      d.setDate(d.getDate() + delta)
      goToDate(d.toISOString().slice(0, 10))
    }
    document.getElementById('sesionDatePrev')?.addEventListener('click', () => shiftDate(-1))
    document.getElementById('sesionDateNext')?.addEventListener('click', () => shiftDate(1))

    // Cambiar la fecha con el selector carga ese día (igual que las flechas)
    document.getElementById('sesionDate').addEventListener('change', () => {
      goToDate(document.getElementById('sesionDate').value)
    })

    // Cambiar el setup del día re-filtra el checklist (IRI / Reingreso / universales)
    document.getElementById('setup')?.addEventListener('change', renderChecklist)

    // Auto-invalidar checklist de 5 velas si velas > 5
    document.getElementById('velasCorrida').addEventListener('input', () => {
      const velas = parseInt(document.getElementById('velasCorrida').value) || 0
      const chk = document.getElementById('chk__chk_5velas')
      if (!chk) return
      const item = chk.closest('.check-item')
      if (velas > 5) {
        chk.checked = false
        chk.disabled = true
        item.style.opacity = '0.5'
        item.title = `Invalidado: ${velas} velas superan el máximo de 5`
      } else {
        chk.disabled = false
        item.style.opacity = '1'
        item.title = ''
      }
    })
  }

  // ── Experimentos ─────────────────────────────────────────────────────────

  let expRegistros      = []  // [{ id, experimento_id, nombre, resultado, valor, nota }]
  let expResulTrade     = null
  let expResulSNT       = null

  async function loadExperimentos(date) {
    try {
      const [catalogo, registros] = await Promise.all([
        DB.getCatalogoExperimentos(),
        date ? DB.getExperimentosByDate(date) : Promise.resolve([]),
      ])

      // Poblar ambos dropdowns con TODOS los experimentos (activos e inactivos)
      const options = '<option value="">Seleccionar experimento...</option>' +
        catalogo.map(e =>
          `<option value="${e.id}">${e.nombre}${!e.activo ? ' (inactivo)' : ''}</option>`
        ).join('')
      const selTrade = document.getElementById('expTradeSelect')
      const selSNT   = document.getElementById('expSNTSelect')
      if (selTrade) selTrade.innerHTML = options
      if (selSNT)   selSNT.innerHTML   = options

      // Cargar los registrados hoy (solo los presentes)
      expRegistros = registros
        .filter(r => r.presente)
        .map(r => ({
          id:            r.id,
          experimento_id: r.experimento_id,
          nombre:        r.experimento?.nombre || `Experimento ${r.experimento_id}`,
          resultado:     r.resultado || null,
          valor:         r.valor != null ? parseFloat(r.valor) : null,
          nota:          r.nota || '',
        }))

      renderExpList()
    } catch (_) { /* sin conexión */ }
  }

  function setupExperimentos() {
    _setupExpRow('expTradeResultGrp', 'expTradeAgregar', 'expTradeSelect', 'expTradeNota', 'expTradeValor', 'trade')
    _setupExpRow('expSNTResultGrp',   'expSNTAgregar',   'expSNTSelect',   'expSNTNota',   'expSNTValor',   'snt')
  }

  function _setupExpRow(grpId, btnId, selectId, notaId, valorId, key) {
    const grp = document.getElementById(grpId)
    const btn = document.getElementById(btnId)
    if (!grp || !btn) return

    grp.querySelectorAll('.btn-option').forEach(b => {
      b.addEventListener('click', () => {
        const val = b.dataset.value
        const cur = key === 'trade' ? expResulTrade : expResulSNT
        const next = cur === val ? null : val
        if (key === 'trade') expResulTrade = next
        else                 expResulSNT   = next
        grp.querySelectorAll('.btn-option').forEach(x => x.classList.remove('active'))
        if (next) b.classList.add('active')
      })
    })

    btn.addEventListener('click', async () => {
      const sel   = document.getElementById(selectId)
      const nota  = document.getElementById(notaId)
      const valor = document.getElementById(valorId)
      const expId = parseInt(sel?.value)
      const res   = key === 'trade' ? expResulTrade : expResulSNT
      const date  = document.getElementById('sesionDate').value

      if (!expId) { Toast.show('Selecciona un experimento', 'warning'); return }
      if (!res)   { Toast.show('Selecciona T o S', 'warning'); return }
      if (!date)  { Toast.show('Selecciona la fecha primero', 'warning'); return }
      if (expRegistros.find(r => r.experimento_id === expId)) {
        Toast.show('Ese experimento ya está registrado hoy', 'warning'); return
      }

      const nombre   = sel.options[sel.selectedIndex].text.replace(' (inactivo)', '').trim()
      const notaVal  = nota?.value?.trim() || null
      // Valor propio del experimento: signo automático según resultado (T +, S −)
      let valorVal = parseFloat(valor?.value)
      if (isNaN(valorVal)) valorVal = null
      else valorVal = res === 'T' ? Math.abs(valorVal) : -Math.abs(valorVal)

      try {
        await DB.saveExperimentoRegistro(date, expId, true, res, notaVal, valorVal)
        // Recargar para obtener el id real de la fila
        const todos  = await DB.getExperimentosByDate(date)
        const nuevo  = todos.find(r => r.experimento_id === expId && r.presente)
        expRegistros.push({
          id:             nuevo?.id || null,
          experimento_id: expId,
          nombre,
          resultado:      res,
          valor:          valorVal,
          nota:           notaVal || '',
        })
        // Reset controles
        sel.value = ''
        if (nota) nota.value = ''
        if (valor) valor.value = ''
        grp.querySelectorAll('.btn-option').forEach(x => x.classList.remove('active'))
        if (key === 'trade') expResulTrade = null
        else                 expResulSNT   = null
        renderExpList()
      } catch (e) {
        Toast.show('Error al guardar: ' + e.message, 'error')
      }
    })
  }

  function renderExpList() {
    updateCierreMeta()
    // El `;` inicial NO es opcional: sin él, la línea anterior y este array se
    // leen como `updateCierreMeta()['expSNTList']` y revienta al guardar.
    ;['expTradeList', 'expSNTList'].forEach(listId => {
      const list = document.getElementById(listId)
      if (!list) return

      if (!expRegistros.length) { list.innerHTML = '<p class="lista-vacia">Sin experimentos registrados</p>'; return }

      list.innerHTML = expRegistros.map((r, i) => `
        <div class="exp-tag">
          <div class="exp-tag-left">
            <span class="${r.resultado === 'T' ? 'cas-badge-t' : 'cas-badge-s'}">${r.resultado || '?'}</span>
            <span class="exp-tag-nombre">${r.nombre}</span>
            ${r.valor != null ? `<span class="exp-tag-valor" style="color:${r.valor >= 0 ? 'var(--accent)' : 'var(--red)'}">${r.valor >= 0 ? '+' : '−'}$${Math.abs(r.valor).toFixed(0)}</span>` : ''}
            ${r.nota ? `<span class="exp-tag-nota">· ${r.nota}</span>` : ''}
          </div>
          <button type="button" class="cas-del" data-idx="${i}" title="Eliminar">
            <i class="ti ti-x"></i>
          </button>
        </div>`).join('')

      list.querySelectorAll('.cas-del').forEach(btn => {
        btn.addEventListener('click', async () => {
          const i   = parseInt(btn.dataset.idx)
          const reg = expRegistros[i]
          if (!reg) return
          try {
            const date = document.getElementById('sesionDate').value
            await DB.saveExperimentoRegistro(date, reg.experimento_id, false, null, null)
            expRegistros.splice(i, 1)
            renderExpList()
          } catch (e) {
            Toast.show('Error al eliminar', 'error')
          }
        })
      })
    })
  }

  // Al entrar a "Registrar" (sin editar un día pasado), carga la sesión de HOY
  // si ya existe — así se muestran (y se conservan al guardar) los niveles que
  // escribió el indicador SupabaseDailyLevels. Si no existe, deja el form limpio.
  async function onShow() {
    if (suppressAutoLoad) { suppressAutoLoad = false; return }
    // Recargar catálogos: si se editaron reglas en Estrategia o setups en Datos,
    // sus cachés quedaron invalidadas y el formulario debe reflejarlo sin
    // obligar a recargar la página.
    await Promise.all([loadSetups(), loadChecklist()])
    const today = new Date().toISOString().slice(0, 10)
    let sesion = null
    try { sesion = await DB.getSesionByDate(today) } catch (_) { return }
    if (sesion) prefill(sesion)
    else clearForm()
  }

  return { init, prefill, onShow }
})()
