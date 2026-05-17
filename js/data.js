// Data management — catalogo_casuisticas + catalogo_reglas
const DataManager = (() => {

  function renderList(items, containerId, type) {
    const el = document.getElementById(containerId)
    if (!items.length) {
      el.innerHTML = '<p class="catalog-empty">Sin ítems registrados</p>'
      return
    }
    el.innerHTML = items.map(item => `
      <div class="catalog-item ${!item.activa ? 'catalog-item-inactive' : ''}" data-id="${item.id}">
        <label class="catalog-toggle" title="${item.activa ? 'Activa' : 'Inactiva'}">
          <input type="checkbox" class="tog-activa" data-id="${item.id}" data-type="${type}" ${item.activa ? 'checked' : ''}>
          <span class="toggle-track"></span>
        </label>
        <span class="catalog-nombre">${item.nombre}</span>
        <button class="btn-edit-catalog" data-id="${item.id}" data-type="${type}" data-nombre="${item.nombre}" title="Editar nombre">
          <i class="ti ti-pencil"></i>
        </button>
        <button class="btn-del-catalog" data-id="${item.id}" data-type="${type}" title="Eliminar">
          <i class="ti ti-trash"></i>
        </button>
      </div>`).join('')

    el.querySelectorAll('.tog-activa').forEach(chk => {
      chk.addEventListener('change', async () => {
        const id = parseInt(chk.dataset.id)
        try {
          if (chk.dataset.type === 'cas') await DB.toggleCatalogoCasuistica(id, chk.checked)
          else await DB.toggleCatalogoRegla(id, chk.checked)
          chk.closest('.catalog-item').classList.toggle('catalog-item-inactive', !chk.checked)
        } catch (e) {
          Toast.show('Error al actualizar', 'error')
          chk.checked = !chk.checked
        }
      })
    })

    el.querySelectorAll('.btn-edit-catalog').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = parseInt(btn.dataset.id)
        const actual = btn.dataset.nombre
        const nuevo = prompt('Editar nombre:', actual)
        if (!nuevo || nuevo.trim() === actual) return
        try {
          if (btn.dataset.type === 'cas') await DB.renameCatalogoCasuistica(id, nuevo.trim())
          else await DB.renameCatalogoRegla(id, nuevo.trim())
          btn.dataset.nombre = nuevo.trim()
          btn.closest('.catalog-item').querySelector('.catalog-nombre').textContent = nuevo.trim()
          Toast.show('Nombre actualizado', 'success')
        } catch (e) {
          Toast.show('Error al actualizar', 'error')
        }
      })
    })

    el.querySelectorAll('.btn-del-catalog').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('¿Eliminar este ítem? Si tiene registros asociados, se perderá la referencia.')) return
        const id = parseInt(btn.dataset.id)
        try {
          if (btn.dataset.type === 'cas') await DB.deleteCatalogoCasuistica(id)
          else await DB.deleteCatalogoRegla(id)
          btn.closest('.catalog-item').remove()
        } catch (e) {
          Toast.show('Error al eliminar', 'error')
        }
      })
    })
  }

  async function loadCasuisticas() {
    const items = await DB.getCatalogoCasuisticas()
    renderList(items, 'catalogoCasuisticasList', 'cas')
  }

  async function loadReglas() {
    const items = await DB.getCatalogoReglas()
    renderList(items, 'catalogoReglasList', 'reg')
  }

  async function init() {
    await Promise.all([loadCasuisticas(), loadReglas()])

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

    document.getElementById('addRegla').addEventListener('click', async () => {
      const input = document.getElementById('newRegla')
      const nombre = input.value.trim()
      if (!nombre) { Toast.show('Escribe el nombre de la regla', 'warning'); return }
      try {
        await DB.addCatalogoRegla(nombre)
        input.value = ''
        await loadReglas()
        Toast.show('Regla agregada', 'success')
      } catch (e) {
        Toast.show('Error al agregar: ' + e.message, 'error')
      }
    })

    document.getElementById('newRegla').addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); document.getElementById('addRegla').click() }
    })
  }

  return { init }
})()
