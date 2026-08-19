// Data management — catalogo_errores
const DataManager = (() => {

  // Taxonomía de errores (compartida con el Coach IA)
  const TIPOS = [
    { val: 'psicologico', label: '🧠 Psicológico' },
    { val: 'analitico',   label: '📐 Analítico'   },
    { val: 'operativo',   label: '⚙️ Operativo'   },
    { val: 'marcado',     label: '🗺️ Marcado'     },
  ]

  function tipoOptions(selected) {
    return '<option value="">Tipo…</option>' +
      TIPOS.map(t => `<option value="${t.val}" ${t.val === selected ? 'selected' : ''}>${t.label}</option>`).join('')
  }

  const FASES = [
    { val: '1', label: 'Fase 1 · Pre-sesión' },
    { val: '2', label: 'Fase 2 · Lectura' },
    { val: '3', label: 'Fase 3 · Ejecución' },
  ]
  function faseOptions(selected) {
    return '<option value="">Fase…</option>' +
      FASES.map(f => `<option value="${f.val}" ${String(selected) === f.val ? 'selected' : ''}>${f.label}</option>`).join('')
  }

  function renderList(items, containerId) {
    const el = document.getElementById(containerId)
    if (!items.length) {
      el.innerHTML = '<p class="catalog-empty">Sin ítems registrados</p>'
      return
    }
    el.innerHTML = items.map(item => `
      <div class="catalog-item ${!item.activa ? 'catalog-item-inactive' : ''}" data-id="${item.id}" draggable="true">
        <span class="drag-handle" title="Arrastra para reordenar"><i class="ti ti-grip-vertical"></i></span>
        <label class="catalog-toggle" title="${item.activa ? 'Activa' : 'Inactiva'}">
          <input type="checkbox" class="tog-activa" data-id="${item.id}" ${item.activa ? 'checked' : ''}>
          <span class="toggle-track"></span>
        </label>
        <span class="catalog-item-main"><span class="catalog-nombre">${item.nombre}</span></span>
        <span class="catalog-item-meta">
          <select class="catalog-tipo-select tipo-select" data-id="${item.id}" title="Tipo de error">
            ${tipoOptions(item.tipo)}
          </select>
          <select class="catalog-tipo-select fase-select" data-id="${item.id}" title="Fase del proceso">
            ${faseOptions(item.fase)}
          </select>
        </span>
        <span class="catalog-item-acts">
          <button class="btn-edit-catalog" data-id="${item.id}" data-nombre="${item.nombre}" title="Editar nombre">
            <i class="ti ti-pencil"></i>
          </button>
          <button class="btn-del-catalog" data-id="${item.id}" title="Eliminar">
            <i class="ti ti-trash"></i>
          </button>
        </span>
      </div>`).join('')

    // ── Tipo (taxonomía de error) ────────────────────────────────────────────
    el.querySelectorAll('.tipo-select').forEach(sel => {
      sel.addEventListener('change', async () => {
        const id = parseInt(sel.dataset.id)
        try {
          await DB.updateCasuisticaTipo(id, sel.value)
          Toast.show('Tipo guardado', 'success')
        } catch (e) {
          Toast.show('Error al actualizar el tipo', 'error')
        }
      })
    })

    // ── Fase del proceso ──────────────────────────────────────────────────────
    el.querySelectorAll('.fase-select').forEach(sel => {
      sel.addEventListener('change', async () => {
        const id = parseInt(sel.dataset.id)
        try {
          await DB.updateCasuisticaFase(id, sel.value ? parseInt(sel.value) : null)
          Toast.show('Fase guardada', 'success')
        } catch (e) {
          Toast.show('Error al actualizar la fase', 'error')
        }
      })
    })

    // ── Toggles ────────────────────────────────────────────────────────────
    el.querySelectorAll('.tog-activa').forEach(chk => {
      chk.addEventListener('change', async () => {
        const id = parseInt(chk.dataset.id)
        try {
          await DB.toggleCatalogoCasuistica(id, chk.checked)
          chk.closest('.catalog-item').classList.toggle('catalog-item-inactive', !chk.checked)
        } catch (e) {
          Toast.show('Error al actualizar', 'error')
          chk.checked = !chk.checked
        }
      })
    })

    // ── Editar nombre ──────────────────────────────────────────────────────
    el.querySelectorAll('.btn-edit-catalog').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = parseInt(btn.dataset.id)
        const actual = btn.dataset.nombre
        const nuevo = prompt('Editar nombre:', actual)
        if (!nuevo || nuevo.trim() === actual) return
        try {
          await DB.renameCatalogoCasuistica(id, nuevo.trim())
          btn.dataset.nombre = nuevo.trim()
          btn.closest('.catalog-item').querySelector('.catalog-nombre').textContent = nuevo.trim()
          Toast.show('Nombre actualizado', 'success')
        } catch (e) {
          Toast.show('Error al actualizar', 'error')
        }
      })
    })

    // ── Eliminar ───────────────────────────────────────────────────────────
    el.querySelectorAll('.btn-del-catalog').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('¿Eliminar este error? Los registros históricos conservarán el nombre anterior.')) return
        const id = parseInt(btn.dataset.id)
        try {
          await DB.deleteCatalogoCasuistica(id)
          btn.closest('.catalog-item').remove()
        } catch (e) {
          Toast.show('Error al eliminar', 'error')
        }
      })
    })

    // ── Drag & Drop para reordenar ────────────────────────────────────────
    setupDragDrop(el, ids => Promise.all(ids.map((id, i) => DB.updateCasuisticaOrden(id, i + 1))))
  }

  // saveFn(ids) receives the ordered array of IDs after a drag-drop reorder
  function setupDragDrop(container, saveFn) {
    let dragged = null

    container.addEventListener('dragstart', e => {
      dragged = e.target.closest('[draggable]')
      if (!dragged) return
      setTimeout(() => dragged.classList.add('dragging'), 0)
      e.dataTransfer.effectAllowed = 'move'
    })

    container.addEventListener('dragend', () => {
      if (dragged) dragged.classList.remove('dragging')
      clearDropIndicators(container)
      dragged = null
    })

    container.addEventListener('dragover', e => {
      e.preventDefault()
      e.dataTransfer.dropEffect = 'move'
      const target = e.target.closest('[draggable]')
      clearDropIndicators(container)
      if (!target || target === dragged) return
      const { top, height } = target.getBoundingClientRect()
      target.classList.add(e.clientY < top + height / 2 ? 'drag-over-top' : 'drag-over-bot')
    })

    container.addEventListener('dragleave', e => {
      if (!container.contains(e.relatedTarget)) clearDropIndicators(container)
    })

    container.addEventListener('drop', async e => {
      e.preventDefault()
      const target = e.target.closest('[draggable]')
      clearDropIndicators(container)
      if (!target || !dragged || target === dragged) return

      const { top, height } = target.getBoundingClientRect()
      if (e.clientY < top + height / 2) {
        container.insertBefore(dragged, target)
      } else {
        target.after(dragged)
      }

      // `:scope >` — solo las FILAS. Sin él entran también el checkbox, los selects
      // y los botones de dentro, que llevan su propio data-id: la lista salía con 6
      // entradas por fila y el `orden` guardado eran múltiplos (6, 12, 18…). Se
      // sostenía de milagro, porque todas las filas aportaban el mismo número.
      const ids = [...container.querySelectorAll(':scope > [data-id]')].map(el => parseInt(el.dataset.id))
      try {
        await saveFn(ids)
        Toast.show('Orden guardado', 'success')
      } catch {
        Toast.show('Error al guardar el orden', 'error')
      }
    })
  }

  function clearDropIndicators(container) {
    container.querySelectorAll('.drag-over-top, .drag-over-bot')
      .forEach(el => el.classList.remove('drag-over-top', 'drag-over-bot'))
  }

  async function loadCasuisticas() {
    const items = await DB.getCatalogoCasuisticas()
    renderList(items, 'catalogoCasuisticasList')
  }

  // ── Emociones ─────────────────────────────────────────────────────────────

  function renderEmocionesList(items) {
    const el = document.getElementById('catalogoEmocionesList')
    if (!el) return
    if (!items.length) {
      el.innerHTML = '<p class="catalog-empty">Sin emociones registradas</p>'
      return
    }
    el.innerHTML = items.map(item => `
      <div class="catalog-item ${!item.activa ? 'catalog-item-inactive' : ''}" data-id="${item.id}" draggable="true">
        <span class="drag-handle" title="Arrastra para reordenar"><i class="ti ti-grip-vertical"></i></span>
        <label class="catalog-toggle" title="${item.activa ? 'Activa' : 'Inactiva'}">
          <input type="checkbox" class="tog-emocion" data-id="${item.id}" ${item.activa ? 'checked' : ''}>
          <span class="toggle-track"></span>
        </label>
        <span class="catalog-item-main">
          <span class="catalog-emoji">${item.emoji || '😐'}</span>
          <span class="catalog-nombre">${item.nombre}</span>
        </span>
        <span class="catalog-item-meta"></span>
        <span class="catalog-item-acts">
          <button class="btn-edit-catalog" data-id="${item.id}" data-nombre="${item.nombre}" data-emoji="${item.emoji || '😐'}" title="Editar">
            <i class="ti ti-pencil"></i>
          </button>
          <button class="btn-del-catalog" data-id="${item.id}" title="Eliminar">
            <i class="ti ti-trash"></i>
          </button>
        </span>
      </div>`).join('')

    // Toggles
    el.querySelectorAll('.tog-emocion').forEach(chk => {
      chk.addEventListener('change', async () => {
        const id = parseInt(chk.dataset.id)
        try {
          await DB.toggleCatalogoEmocion(id, chk.checked)
          chk.closest('.catalog-item').classList.toggle('catalog-item-inactive', !chk.checked)
        } catch (e) {
          Toast.show('Error al actualizar', 'error')
          chk.checked = !chk.checked
        }
      })
    })

    // Editar nombre + emoji
    el.querySelectorAll('.btn-edit-catalog').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id      = parseInt(btn.dataset.id)
        const nombre  = prompt('Nombre de la emoción:', btn.dataset.nombre)
        if (nombre === null) return
        const emoji   = prompt('Emoji:', btn.dataset.emoji)
        if (emoji === null) return
        try {
          await DB.renameCatalogoEmocion(id, nombre.trim(), emoji.trim() || '😐')
          btn.dataset.nombre = nombre.trim()
          btn.dataset.emoji  = emoji.trim() || '😐'
          const item = btn.closest('.catalog-item')
          item.querySelector('.catalog-nombre').textContent = nombre.trim()
          item.querySelector('.catalog-emoji').textContent  = emoji.trim() || '😐'
          Toast.show('Emoción actualizada', 'success')
        } catch (e) {
          Toast.show('Error al actualizar', 'error')
        }
      })
    })

    // Eliminar
    el.querySelectorAll('.btn-del-catalog').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('¿Eliminar esta emoción?')) return
        const id = parseInt(btn.dataset.id)
        try {
          await DB.deleteCatalogoEmocion(id)
          btn.closest('.catalog-item').remove()
        } catch (e) {
          Toast.show('Error al eliminar', 'error')
        }
      })
    })

    // Drag & Drop (save using emociones-specific order function)
    setupDragDrop(el, ids => Promise.all(ids.map((id, i) => DB.updateEmocionOrden(id, i + 1))))
  }

  async function loadEmociones() {
    // getCatalogoEmociones solo devuelve activas; necesitamos todas para el manager
    const { data, error } = await supa
      .from('catalogo_emociones')
      .select('*')
      .order('orden', { ascending: true })
    if (error) throw error
    renderEmocionesList(data)
  }

  async function initCuentaPrincipal() {
    const esc = s => (s || '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
    const sel = document.getElementById('dataCuentaPrincipal')
    const hint = document.getElementById('cuentaPrincipalHint')
    if (!sel) return
    let actual = 'PA-APEX-232411-03'
    let cuentas = []
    try {
      const [obj, conocidas] = await Promise.all([DB.getObjetivos(), DB.getCuentasConocidas()])
      actual = obj?.cuenta_principal || actual
      cuentas = conocidas || []
    } catch (_) {}
    // La cuenta principal actual debe estar en la lista aunque aún no tenga trades
    if (actual && !cuentas.includes(actual)) cuentas.unshift(actual)
    sel.innerHTML = cuentas.map(c => `<option value="${esc(c)}"${c === actual ? ' selected' : ''}>${esc(c)}</option>`).join('')
    const setHint = c => { if (hint) hint.textContent = `El journal (calendario, análisis, Coach IA) usa "${c}" como cuenta principal.` }
    setHint(actual)
    sel.addEventListener('change', async () => {
      const nueva = sel.value
      try {
        await DB.saveObjetivos({ cuenta_principal: nueva })
        setHint(nueva)
        Toast.show('Cuenta principal actualizada', 'success')
      } catch (e) { Toast.show('Error al guardar: ' + e.message, 'error') }
    })
  }

  // ── Setups operativos (familias + variantes) ──────────────────────────────
  // El `codigo` no se edita: lo referencian catalogo_reglas.setup y
  // sesiones.setup_codigo. Renombrar cambia solo la etiqueta visible.
  function renderSetups(familias, variantes) {
    const cont = document.getElementById('setupsList')
    if (!cont) return
    const esc = s => (s || '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
    if (!familias.length) { cont.innerHTML = '<p class="catalog-sub">Sin setups. Agrega una familia para empezar.</p>'; return }

    cont.innerHTML = familias.map(f => {
      const vs = variantes.filter(v => v.setup_codigo === f.codigo)
      const chips = vs.length ? vs.map(v => `
        <div class="setup-var ${v.activo === false ? 'off' : ''}">
          <span class="setup-var-nom">${esc(v.nombre)}</span>
          <button class="setup-var-tog" data-act="var-toggle" data-codigo="${esc(v.codigo)}" data-activo="${v.activo !== false}"
                  title="${v.activo !== false ? 'Desactivar' : 'Activar'}">
            <i class="ti ${v.activo !== false ? 'ti-eye' : 'ti-eye-off'}"></i>
          </button>
        </div>`).join('') : '<p class="catalog-sub">Sin variantes todavía.</p>'
      return `
        <div class="setup-fam ${f.activo === false ? 'off' : ''}">
          <div class="setup-fam-head">
            <input class="setup-fam-nom" value="${esc(f.nombre)}" data-codigo="${esc(f.codigo)}" maxlength="40" title="Renombrar (el código interno no cambia)">
            <code class="setup-fam-cod">${esc(f.codigo)}</code>
            <button class="setup-var-tog" data-act="fam-toggle" data-codigo="${esc(f.codigo)}" data-activo="${f.activo !== false}"
                    title="${f.activo !== false ? 'Desactivar familia' : 'Activar familia'}">
              <i class="ti ${f.activo !== false ? 'ti-eye' : 'ti-eye-off'}"></i>
            </button>
          </div>
          <div class="setup-vars">${chips}</div>
          <div class="setup-var-add">
            <input type="text" class="setup-newvar" data-familia="${esc(f.codigo)}" placeholder="Nueva variante (ej: ${esc(f.nombre)} Alcista)..." maxlength="60">
            <select class="setup-newdir" data-familia="${esc(f.codigo)}" title="Dirección">
              <option value="alcista">Alcista</option>
              <option value="bajista">Bajista</option>
              <option value="ambas">Ambas</option>
            </select>
            <button class="btn-sm btn-secondary" data-act="var-add" data-familia="${esc(f.codigo)}"><i class="ti ti-plus"></i></button>
          </div>
        </div>`
    }).join('')
  }

  async function loadSetups() {
    const [familias, variantes] = await Promise.all([
      DB.getSetups({ force: true, soloActivos: false }),
      DB.getSetupVariantes({ force: true, soloActivos: false }),
    ])
    renderSetups(familias, variantes)
  }

  function wireSetups() {
    document.getElementById('addSetupFamilia')?.addEventListener('click', async () => {
      const inp = document.getElementById('newSetupFamilia')
      const nombre = inp.value.trim()
      if (!nombre) { Toast.show('Escribe el nombre de la familia', 'warning'); return }
      try {
        await DB.addSetup({ nombre })
        inp.value = ''
        await loadSetups()
        Toast.show('Familia de setup agregada', 'success')
      } catch (e) { Toast.show('Error al agregar: ' + e.message, 'error') }
    })

    const cont = document.getElementById('setupsList')
    cont?.addEventListener('click', async e => {
      const btn = e.target.closest('[data-act]'); if (!btn) return
      const act = btn.dataset.act
      try {
        if (act === 'fam-toggle') {
          await DB.updateSetup(btn.dataset.codigo, { activo: btn.dataset.activo !== 'true' })
        } else if (act === 'var-toggle') {
          await DB.updateSetupVariante(btn.dataset.codigo, { activo: btn.dataset.activo !== 'true' })
        } else if (act === 'var-add') {
          const fam = btn.dataset.familia
          const inp = cont.querySelector(`.setup-newvar[data-familia="${fam}"]`)
          const dir = cont.querySelector(`.setup-newdir[data-familia="${fam}"]`)
          const nombre = inp.value.trim()
          if (!nombre) { Toast.show('Escribe el nombre de la variante', 'warning'); return }
          await DB.addSetupVariante({ setup_codigo: fam, nombre, direccion: dir?.value || 'ambas' })
        } else return
        await loadSetups()
        Toast.show('Setups actualizados', 'success')
      } catch (err) { Toast.show('Error: ' + err.message, 'error') }
    })

    // Renombrar familia (solo la etiqueta; el código interno se conserva)
    cont?.addEventListener('change', async e => {
      const inp = e.target.closest('.setup-fam-nom'); if (!inp) return
      const nombre = inp.value.trim()
      if (!nombre) { Toast.show('El nombre no puede ir vacío', 'warning'); await loadSetups(); return }
      try {
        await DB.updateSetup(inp.dataset.codigo, { nombre })
        Toast.show('Familia renombrada', 'success')
      } catch (err) { Toast.show('Error al renombrar: ' + err.message, 'error'); await loadSetups() }
    })
  }

  async function init() {
    await Promise.all([loadCasuisticas(), loadEmociones(), loadRecomendaciones(), loadSetups()])
    wireSetups()

    // El checklist de disciplina se gestiona ahora desde Reglas y Estrategia
    // (rulebook `reglas`, capa proceso con es_checklist). Ya no se edita aquí.

    // ── Capital inicial (para rentabilidad % en Análisis) ──
    const capInput = document.getElementById('dataCapitalInicial')
    if (capInput) {
      const saved = parseFloat(localStorage.getItem('annual_capital_inicial') || '0')
      if (saved > 0) capInput.value = saved
      capInput.addEventListener('change', () => {
        localStorage.setItem('annual_capital_inicial', String(parseFloat(capInput.value) || 0))
        Toast.show('Capital inicial guardado', 'success')
      })
    }

    // ── Cuenta principal (la que el journal usa para P&L, análisis y Coach) ──
    await initCuentaPrincipal()

    // ── Casuísticas ──
    document.getElementById('addCasuistica').addEventListener('click', async () => {
      const input = document.getElementById('newCasuistica')
      const tipoSel = document.getElementById('newCasuisticaTipo')
      const faseSel = document.getElementById('newCasuisticaFase')
      const nombre = input.value.trim()
      if (!nombre) { Toast.show('Escribe el nombre del error', 'warning'); return }
      try {
        await DB.addCatalogoCasuistica(nombre, tipoSel?.value || null, faseSel?.value ? parseInt(faseSel.value) : null)
        input.value = ''
        if (tipoSel) tipoSel.value = ''
        if (faseSel) faseSel.value = ''
        await loadCasuisticas()
        Toast.show('Error agregado', 'success')
      } catch (e) {
        Toast.show('Error al agregar: ' + e.message, 'error')
      }
    })

    document.getElementById('newCasuistica').addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); document.getElementById('addCasuistica').click() }
    })

    // ── Emociones ──
    document.getElementById('addEmocion')?.addEventListener('click', async () => {
      const emoji  = document.getElementById('newEmocionEmoji').value.trim() || '😐'
      const nombre = document.getElementById('newEmocionNombre').value.trim()
      if (!nombre) { Toast.show('Escribe el nombre de la emoción', 'warning'); return }
      try {
        await DB.addCatalogoEmocion(nombre, emoji)
        document.getElementById('newEmocionNombre').value = ''
        document.getElementById('newEmocionEmoji').value  = ''
        await loadEmociones()
        Toast.show('Emoción agregada', 'success')
      } catch (e) {
        Toast.show('Error al agregar: ' + e.message, 'error')
      }
    })

    document.getElementById('newEmocionNombre')?.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); document.getElementById('addEmocion').click() }
    })

    // ── Experimentos ──
    await loadExperimentos()
    document.getElementById('addExperimento')?.addEventListener('click', async () => {
      const input = document.getElementById('newExperimento')
      const nombre = input.value.trim()
      if (!nombre) { Toast.show('Escribe el nombre del experimento', 'warning'); return }
      try {
        await DB.addExperimento(nombre)
        input.value = ''
        await loadExperimentos()
        Toast.show('Experimento agregado', 'success')
      } catch (e) {
        Toast.show('Error al agregar: ' + e.message, 'error')
      }
    })
    document.getElementById('newExperimento')?.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); document.getElementById('addExperimento').click() }
    })

    // ── Recomendaciones ──
    await loadRecomendaciones()
    document.getElementById('addRecomendacion')?.addEventListener('click', async () => {
      const input  = document.getElementById('newRecomendacion')
      const tipoSel = document.getElementById('newRecomendacionTipo')
      const nombre = input.value.trim()
      if (!nombre) { Toast.show('Escribe el nombre de la recomendación', 'warning'); return }
      try {
        await DB.addCatalogoRecomendacion(nombre, tipoSel?.value || null)
        input.value = ''
        if (tipoSel) tipoSel.value = ''
        await loadRecomendaciones()
        Toast.show('Recomendación agregada', 'success')
      } catch (e) {
        Toast.show('Error al agregar: ' + e.message, 'error')
      }
    })
    document.getElementById('newRecomendacion')?.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); document.getElementById('addRecomendacion').click() }
    })
  }

  function renderExperimentosList(items) {
    const el = document.getElementById('catalogoExperimentosList')
    if (!el) return
    if (!items.length) { el.innerHTML = '<p class="catalog-empty">Sin experimentos registrados</p>'; return }
    el.innerHTML = items.map(item => `
      <div class="catalog-item ${!item.activo ? 'catalog-item-inactive' : ''}" data-id="${item.id}">
        <span class="drag-handle"><i class="ti ti-grip-vertical"></i></span>
        <label class="catalog-toggle">
          <input type="checkbox" class="tog-exp" data-id="${item.id}" ${item.activo ? 'checked' : ''}>
          <span class="toggle-track"></span>
        </label>
        <span class="catalog-item-main"><span class="catalog-nombre">${item.nombre}</span></span>
        <span class="catalog-item-meta"></span>
        <span class="catalog-item-acts">
          <button class="btn-del-catalog" data-id="${item.id}" title="Eliminar"><i class="ti ti-trash"></i></button>
        </span>
      </div>`).join('')

    el.querySelectorAll('.tog-exp').forEach(chk => {
      chk.addEventListener('change', async () => {
        const id = parseInt(chk.dataset.id)
        try {
          await DB.toggleExperimento(id, chk.checked)
          chk.closest('.catalog-item').classList.toggle('catalog-item-inactive', !chk.checked)
        } catch (e) {
          Toast.show('Error al actualizar', 'error')
          chk.checked = !chk.checked
        }
      })
    })
  }

  async function loadExperimentos() {
    const items = await DB.getCatalogoExperimentos()
    renderExperimentosList(items)
  }

  function renderRecomendacionesList(items) {
    const el = document.getElementById('catalogoRecomendacionesList')
    if (!el) return
    if (!items.length) { el.innerHTML = '<p class="catalog-empty">Sin recomendaciones registradas</p>'; return }
    el.innerHTML = items.map(item => `
      <div class="catalog-item ${!item.activa ? 'catalog-item-inactive' : ''}" data-id="${item.id}">
        <span class="drag-handle"><i class="ti ti-grip-vertical"></i></span>
        <label class="catalog-toggle">
          <input type="checkbox" class="tog-rec" data-id="${item.id}" ${item.activa ? 'checked' : ''}>
          <span class="toggle-track"></span>
        </label>
        <span class="catalog-item-main"><span class="catalog-nombre">${item.nombre}</span></span>
        <span class="catalog-item-meta">
          <select class="catalog-tipo-select tipo-select-rec" data-id="${item.id}" title="Tipo">
            ${tipoOptions(item.tipo)}
          </select>
        </span>
        <span class="catalog-item-acts"></span>
      </div>`).join('')

    el.querySelectorAll('.tog-rec').forEach(chk => {
      chk.addEventListener('change', async () => {
        const id = parseInt(chk.dataset.id)
        try {
          await DB.toggleCatalogoRecomendacion(id, chk.checked)
          chk.closest('.catalog-item').classList.toggle('catalog-item-inactive', !chk.checked)
        } catch (e) {
          Toast.show('Error al actualizar', 'error')
          chk.checked = !chk.checked
        }
      })
    })
    el.querySelectorAll('.tipo-select-rec').forEach(sel => {
      sel.addEventListener('change', async () => {
        const id = parseInt(sel.dataset.id)
        try { await supa.from('catalogo_recomendaciones').update({ tipo: sel.value || null }).eq('id', id) } catch (_) {}
      })
    })
  }

  async function loadRecomendaciones() {
    const items = await DB.getCatalogoRecomendaciones()
    renderRecomendacionesList(items)
  }

  return { init }
})()
