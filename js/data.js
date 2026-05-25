// Data management — catalogo_casuisticas
const DataManager = (() => {

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
        if (!confirm('¿Eliminar esta casuística? Los registros históricos conservarán el nombre anterior.')) return
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
    setupDragDrop(el)
  }

  function setupDragDrop(container) {
    let dragged = null

    container.addEventListener('dragstart', e => {
      dragged = e.target.closest('[draggable]')
      if (!dragged) return
      // Pequeño delay para que se vea el elemento original al empezar el drag
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

      // Insertar antes o después según posición del cursor
      const { top, height } = target.getBoundingClientRect()
      if (e.clientY < top + height / 2) {
        container.insertBefore(dragged, target)
      } else {
        target.after(dragged)
      }

      // Guardar nuevo orden en Supabase
      const ids = [...container.querySelectorAll('[data-id]')].map(el => parseInt(el.dataset.id))
      try {
        await Promise.all(ids.map((id, i) => DB.updateCasuisticaOrden(id, i + 1)))
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

  async function init() {
    await loadCasuisticas()

    document.getElementById('addCasuistica').addEventListener('click', async () => {
      const input = document.getElementById('newCasuistica')
      const nombre = input.value.trim()
      if (!nombre) { Toast.show('Escribe el nombre de la casuística', 'warning'); return }
      try {
        await DB.addCatalogoCasuistica(nombre)
        input.value = ''
        await loadCasuisticas()
        Toast.show('Casuística agregada', 'success')
      } catch (e) {
        Toast.show('Error al agregar: ' + e.message, 'error')
      }
    })

    document.getElementById('newCasuistica').addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); document.getElementById('addCasuistica').click() }
    })
  }

  return { init }
})()
