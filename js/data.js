// Data management — catalogo_casuisticas
const DataManager = (() => {

  function renderList(items, containerId) {
    const el = document.getElementById(containerId)
    if (!items.length) {
      el.innerHTML = `<p class="catalog-empty">${I18n.t('data.empty')}</p>`
      return
    }
    el.innerHTML = items.map(item => `
      <div class="catalog-item ${!item.activa ? 'catalog-item-inactive' : ''}" data-id="${item.id}" draggable="true">
        <span class="drag-handle" title="${I18n.t('data.drag_hint')}"><i class="ti ti-grip-vertical"></i></span>
        <label class="catalog-toggle" title="${item.activa ? I18n.t('data.active') : I18n.t('data.inactive')}">
          <input type="checkbox" class="tog-activa" data-id="${item.id}" ${item.activa ? 'checked' : ''}>
          <span class="toggle-track"></span>
        </label>
        <span class="catalog-nombre">${item.nombre}</span>
        <button class="btn-edit-catalog" data-id="${item.id}" data-nombre="${item.nombre}" title="Editar nombre">
          <i class="ti ti-pencil"></i>
        </button>
        <button class="btn-del-catalog" data-id="${item.id}" title="Eliminar">
          <i class="ti ti-trash"></i>
        </button>
      </div>`).join('')

    // ── Toggles ────────────────────────────────────────────────────────────
    el.querySelectorAll('.tog-activa').forEach(chk => {
      chk.addEventListener('change', async () => {
        const id = parseInt(chk.dataset.id)
        try {
          await DB.toggleCatalogoCasuistica(id, chk.checked)
          chk.closest('.catalog-item').classList.toggle('catalog-item-inactive', !chk.checked)
        } catch (e) {
          Toast.show(I18n.t('toast.update_error'), 'error')
          chk.checked = !chk.checked
        }
      })
    })

    // ── Editar nombre ──────────────────────────────────────────────────────
    el.querySelectorAll('.btn-edit-catalog').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = parseInt(btn.dataset.id)
        const actual = btn.dataset.nombre
        const nuevo = prompt(I18n.t('data.edit_name_prompt'), actual)
        if (!nuevo || nuevo.trim() === actual) return
        try {
          await DB.renameCatalogoCasuistica(id, nuevo.trim())
          btn.dataset.nombre = nuevo.trim()
          btn.closest('.catalog-item').querySelector('.catalog-nombre').textContent = nuevo.trim()
          Toast.show(I18n.t('toast.name_updated'), 'success')
        } catch (e) {
          Toast.show(I18n.t('toast.update_error'), 'error')
        }
      })
    })

    // ── Eliminar ───────────────────────────────────────────────────────────
    el.querySelectorAll('.btn-del-catalog').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm(I18n.t('data.confirm_delete'))) return
        const id = parseInt(btn.dataset.id)
        try {
          await DB.deleteCatalogoCasuistica(id)
          btn.closest('.catalog-item').remove()
        } catch (e) {
          Toast.show(I18n.t('toast.delete_error'), 'error')
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
        Toast.show(I18n.t('toast.order_saved'), 'success')
      } catch {
        Toast.show(I18n.t('toast.order_error'), 'error')
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
      el.innerHTML = `<p class="catalog-empty">${I18n.t('data.emociones_empty')}</p>`
      return
    }
    el.innerHTML = items.map(item => `
      <div class="catalog-item ${!item.activa ? 'catalog-item-inactive' : ''}" data-id="${item.id}" draggable="true">
        <span class="drag-handle" title="${I18n.t('data.drag_hint')}"><i class="ti ti-grip-vertical"></i></span>
        <label class="catalog-toggle" title="${item.activa ? I18n.t('data.active') : I18n.t('data.inactive')}">
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
          Toast.show(I18n.t('toast.update_error'), 'error')
          chk.checked = !chk.checked
        }
      })
    })

    // Editar nombre + emoji
    el.querySelectorAll('.btn-edit-catalog').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id      = parseInt(btn.dataset.id)
        const nombre  = prompt(I18n.t('data.emocion_name_prompt'), btn.dataset.nombre)
        if (nombre === null) return
        const emoji   = prompt(I18n.t('data.emocion_emoji_prompt'), btn.dataset.emoji)
        if (emoji === null) return
        try {
          await DB.renameCatalogoEmocion(id, nombre.trim(), emoji.trim() || '😐')
          btn.dataset.nombre = nombre.trim()
          btn.dataset.emoji  = emoji.trim() || '😐'
          const item = btn.closest('.catalog-item')
          item.querySelector('.catalog-nombre').textContent = nombre.trim()
          item.querySelector('.catalog-emoji').textContent  = emoji.trim() || '😐'
          Toast.show(I18n.t('toast.emocion_updated'), 'success')
        } catch (e) {
          Toast.show(I18n.t('toast.update_error'), 'error')
        }
      })
    })

    // Eliminar
    el.querySelectorAll('.btn-del-catalog').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm(I18n.t('data.confirm_delete_emocion'))) return
        const id = parseInt(btn.dataset.id)
        try {
          await DB.deleteCatalogoEmocion(id)
          btn.closest('.catalog-item').remove()
        } catch (e) {
          Toast.show(I18n.t('toast.delete_error'), 'error')
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
    await Promise.all([loadCasuisticas(), loadEmociones()])

    // ── Casuísticas ──
    document.getElementById('addCasuistica').addEventListener('click', async () => {
      const input = document.getElementById('newCasuistica')
      const nombre = input.value.trim()
      if (!nombre) { Toast.show(I18n.t('data.enter_cas'), 'warning'); return }
      try {
        await DB.addCatalogoCasuistica(nombre)
        input.value = ''
        await loadCasuisticas()
        Toast.show(I18n.t('toast.cas_added'), 'success')
      } catch (e) {
        Toast.show(I18n.t('toast.update_error') + ': ' + e.message, 'error')
      }
    })

    document.getElementById('newCasuistica').addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); document.getElementById('addCasuistica').click() }
    })

    // ── Emociones ──
    document.getElementById('addEmocion')?.addEventListener('click', async () => {
      const emoji  = document.getElementById('newEmocionEmoji').value.trim() || '😐'
      const nombre = document.getElementById('newEmocionNombre').value.trim()
      if (!nombre) { Toast.show(I18n.t('data.enter_emocion'), 'warning'); return }
      try {
        await DB.addCatalogoEmocion(nombre, emoji)
        document.getElementById('newEmocionNombre').value = ''
        document.getElementById('newEmocionEmoji').value  = ''
        await loadEmociones()
        Toast.show(I18n.t('toast.emocion_added'), 'success')
      } catch (e) {
        Toast.show(I18n.t('toast.update_error') + ': ' + e.message, 'error')
      }
    })

    document.getElementById('newEmocionNombre')?.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); document.getElementById('addEmocion').click() }
    })
  }

  return { init }
})()
