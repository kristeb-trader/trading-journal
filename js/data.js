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
        <span class="catalog-nombre">${item.nombre}</span>
        <select class="catalog-tipo-select tipo-select" data-id="${item.id}" title="Tipo de error">
          ${tipoOptions(item.tipo)}
        </select>
        <button class="btn-edit-catalog" data-id="${item.id}" data-nombre="${item.nombre}" title="Editar nombre">
          <i class="ti ti-pencil"></i>
        </button>
        <button class="btn-del-catalog" data-id="${item.id}" title="Eliminar">
          <i class="ti ti-trash"></i>
        </button>
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

      const ids = [...container.querySelectorAll('[data-id]')].map(el => parseInt(el.dataset.id))
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
        <span class="catalog-emoji">${item.emoji || '😐'}</span>
        <span class="catalog-nombre">${item.nombre}</span>
        <button class="btn-edit-catalog" data-id="${item.id}" data-nombre="${item.nombre}" data-emoji="${item.emoji || '😐'}" title="Editar">
          <i class="ti ti-pencil"></i>
        </button>
        <button class="btn-del-catalog" data-id="${item.id}" title="Eliminar">
          <i class="ti ti-trash"></i>
        </button>
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

  async function init() {
    await Promise.all([loadCasuisticas(), loadEmociones(), loadRecomendaciones()])

    // ── Casuísticas ──
    document.getElementById('addCasuistica').addEventListener('click', async () => {
      const input = document.getElementById('newCasuistica')
      const tipoSel = document.getElementById('newCasuisticaTipo')
      const nombre = input.value.trim()
      if (!nombre) { Toast.show('Escribe el nombre del error', 'warning'); return }
      try {
        await DB.addCatalogoCasuistica(nombre, tipoSel?.value || null)
        input.value = ''
        if (tipoSel) tipoSel.value = ''
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
        <span class="catalog-nombre">${item.nombre}</span>
        <button class="btn-del-catalog" data-id="${item.id}" title="Eliminar"><i class="ti ti-trash"></i></button>
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
        <span class="catalog-nombre">${item.nombre}</span>
        <select class="catalog-tipo-select tipo-select-rec" data-id="${item.id}" title="Tipo">
          ${tipoOptions(item.tipo)}
        </select>
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
