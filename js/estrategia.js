// Estrategia — Reglas por setup (estructuradas) + estrategia general Chaumer
const Estrategia = (() => {

  // ── Definiciones de setups y campos ──────────────────────────────────────

  const SETUPS = [
    { key: 'iri_apertura',     nombre: 'IRI en Apertura',     icon: 'ti-sunrise',
      desc: 'Primer impulso tras el rompimiento del rango de premercado' },
    { key: 'iri_continuacion', nombre: 'IRI en Continuación', icon: 'ti-arrow-bear-right',
      desc: 'Continuación clásica Impulso · Retroceso · Impulso desde zona vigente' },
    { key: 'reingreso',        nombre: 'Reingreso',           icon: 'ti-rotate-2',
      desc: 'Reentrada tras consecución fallida + reversión + rompimiento del retroceso' },
  ]

  const DIRECCIONES = [
    { key: 'ambas',   label: 'Común',   sym: '⚖️' },
    { key: 'alcista', label: 'Alcista', sym: '▲' },
    { key: 'bajista', label: 'Bajista', sym: '▼' },
  ]

  const CAMPOS = [
    { key: 'activacion',   label: 'Activación · Contexto',  ph: '¿Cuándo aparece este setup? Condición de mercado que lo activa.' },
    { key: 'secuencia',    label: 'Secuencia · Estructura', ph: 'Estructura de velas exacta (IRI, consecución, reingreso…).' },
    { key: 'entrada',      label: 'Entrada',                ph: 'Gatillo y nivel exacto de entrada. Orden precolocada ¿cuándo?' },
    { key: 'stop',         label: 'Stop',                   ph: 'Ubicación y tamaño del stop (puntos / $). Máx 60 pts / $120.' },
    { key: 'gestion',      label: 'Gestión · Target',       ph: 'Target, R:R mínimo (1:1), gestión de zona, zonas vigentes.' },
    { key: 'invalidacion', label: 'Invalidación · Filtros', ph: 'Qué invalida el setup: 5 velas, zonas en contra, noticia roja, FOMC.' },
    { key: 'notas',        label: 'Notas',                  ph: 'Observaciones que evolucionan con la experiencia. Casos base.' },
  ]

  // ── Estado interno ────────────────────────────────────────────────────────
  // reglas['<setup>__<direccion>'] = { ...fila } (o construido en memoria)
  let reglas    = {}
  let activeDir = {} // { setupKey: direccionKey }

  function keyOf(setup, dir) { return `${setup}__${dir}` }

  function getRow(setup, dir) {
    const k = keyOf(setup, dir)
    if (!reglas[k]) reglas[k] = { setup, direccion: dir }
    return reglas[k]
  }

  // ── Carga ─────────────────────────────────────────────────────────────────

  async function loadReglas() {
    reglas = {}
    try {
      const filas = await DB.getSetupReglas()
      filas.forEach(f => { reglas[keyOf(f.setup, f.direccion)] = f })
    } catch (e) {
      Toast.show('Error al cargar reglas de setup: ' + e.message, 'error')
    }
    SETUPS.forEach(s => { if (!activeDir[s.key]) activeDir[s.key] = 'ambas' })
    renderReglas()
  }

  // ── Render reglas por setup ────────────────────────────────────────────────

  function renderReglas() {
    const cont = document.getElementById('setupReglasList')
    if (!cont) return
    cont.innerHTML = SETUPS.map(s => {
      const dir = activeDir[s.key]
      const row = getRow(s.key, dir)
      const dirBtns = DIRECCIONES.map(d => `
        <button type="button" class="setup-dir-btn ${d.key === dir ? 'active' : ''}"
          data-setup="${s.key}" data-dir="${d.key}">${d.sym} ${d.label}</button>`).join('')
      const campos = CAMPOS.map(c => `
        <div class="setup-field">
          <label>${c.label}</label>
          <textarea class="setup-input" data-setup="${s.key}" data-campo="${c.key}"
            rows="2" placeholder="${c.ph}">${row[c.key] || ''}</textarea>
        </div>`).join('')
      const updated = row.updated_at ? `Actualizado: ${row.updated_at.slice(0, 10)}` : 'Sin guardar aún'
      return `
        <div class="setup-card" data-setup="${s.key}">
          <div class="setup-card-header">
            <div class="setup-card-title">
              <i class="ti ${s.icon}"></i>
              <div>
                <span class="setup-name">${s.nombre}</span>
                <span class="setup-desc">${s.desc}</span>
              </div>
            </div>
            <div class="setup-dir-toggle">${dirBtns}</div>
          </div>
          <div class="setup-fields">${campos}</div>
          <div class="setup-card-footer">
            <span class="setup-updated">${updated}</span>
            <button type="button" class="btn-primary btn-sm setup-save-btn" data-setup="${s.key}">
              <i class="ti ti-device-floppy"></i> Guardar reglas
            </button>
          </div>
        </div>`
    }).join('')

    // Inputs → memoria
    cont.querySelectorAll('.setup-input').forEach(ta => {
      ta.addEventListener('input', () => {
        const { setup, campo } = ta.dataset
        getRow(setup, activeDir[setup])[campo] = ta.value
      })
    })

    // Toggle de dirección (captura ya está en memoria por el input handler)
    cont.querySelectorAll('.setup-dir-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        activeDir[btn.dataset.setup] = btn.dataset.dir
        renderReglas()
      })
    })

    // Guardar
    cont.querySelectorAll('.setup-save-btn').forEach(btn => {
      btn.addEventListener('click', () => guardarSetup(btn.dataset.setup, btn))
    })
  }

  async function guardarSetup(setup, btn) {
    const dir = activeDir[setup]
    const row = getRow(setup, dir)
    const payload = { setup, direccion: dir }
    CAMPOS.forEach(c => { payload[c.key] = (row[c.key] || '').trim() || null })

    const original = btn.innerHTML
    btn.disabled = true
    btn.innerHTML = '<i class="ti ti-loader-2 spin"></i> Guardando...'
    try {
      await DB.saveSetupRegla(payload)
      row.updated_at = new Date().toISOString()
      // Refrescar caché del Coach para que use las reglas nuevas
      if (typeof Coach !== 'undefined' && Coach.clearCache) Coach.clearCache()
      const lbl = DIRECCIONES.find(d => d.key === dir)?.label || dir
      Toast.show(`Reglas guardadas (${lbl})`, 'success')
      const card = btn.closest('.setup-card')
      const upd = card?.querySelector('.setup-updated')
      if (upd) upd.textContent = `Actualizado: ${row.updated_at.slice(0, 10)}`
    } catch (e) {
      Toast.show('Error al guardar: ' + e.message, 'error')
    } finally {
      btn.disabled = false
      btn.innerHTML = original
    }
  }

  // ── Estrategia general Chaumer (movida desde el Coach) ────────────────────

  async function renderEstrategiaGeneral() {
    const container = document.getElementById('estrategiaGeneralList')
    if (!container) return
    container.innerHTML = '<div class="coach-loading"><i class="ti ti-loader-2 spin"></i> Cargando...</div>'

    try {
      const secciones = await DB.getEstrategiaSecciones()
      container.innerHTML = secciones.map(s => `
        <div class="estrat-item" data-id="${s.id}">
          <div class="estrat-header">
            <span class="estrat-titulo">${s.titulo}</span>
            <span class="estrat-updated">actualizado: ${s.updated_at?.slice(0,10) || '—'}</span>
            <button class="estrat-edit-btn btn-icon" data-id="${s.id}" title="Editar"><i class="ti ti-pencil"></i></button>
          </div>
          <pre class="estrat-contenido" id="estrat-content-${s.id}">${s.contenido}</pre>
          <div class="estrat-editor hidden" id="estrat-editor-${s.id}">
            <textarea class="estrat-textarea" id="estrat-ta-${s.id}" rows="10">${s.contenido}</textarea>
            <div class="estrat-actions">
              <button class="btn-sm btn-primary estrat-save-btn" data-id="${s.id}"><i class="ti ti-device-floppy"></i> Guardar</button>
              <button class="btn-sm btn-ghost estrat-cancel-btn" data-id="${s.id}">Cancelar</button>
            </div>
          </div>
        </div>`).join('')

      container.querySelectorAll('.estrat-edit-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.dataset.id
          document.getElementById(`estrat-content-${id}`).classList.add('hidden')
          document.getElementById(`estrat-editor-${id}`).classList.remove('hidden')
          btn.classList.add('hidden')
        })
      })

      container.querySelectorAll('.estrat-save-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = parseInt(btn.dataset.id)
          const contenido = document.getElementById(`estrat-ta-${id}`).value.trim()
          try {
            await DB.updateEstrategiaSeccion(id, contenido)
            document.getElementById(`estrat-content-${id}`).textContent = contenido
            document.getElementById(`estrat-content-${id}`).classList.remove('hidden')
            document.getElementById(`estrat-editor-${id}`).classList.add('hidden')
            container.querySelector(`.estrat-edit-btn[data-id="${id}"]`).classList.remove('hidden')
            if (typeof Coach !== 'undefined' && Coach.clearCache) Coach.clearCache()
            Toast.show('Sección actualizada', 'success')
          } catch (e) {
            Toast.show('Error al guardar: ' + e.message, 'error')
          }
        })
      })

      container.querySelectorAll('.estrat-cancel-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.dataset.id
          document.getElementById(`estrat-content-${id}`).classList.remove('hidden')
          document.getElementById(`estrat-editor-${id}`).classList.add('hidden')
          container.querySelector(`.estrat-edit-btn[data-id="${id}"]`).classList.remove('hidden')
        })
      })

    } catch (err) {
      container.innerHTML = `<p class="coach-error">Error: ${err.message}</p>`
    }
  }

  // ── init ──────────────────────────────────────────────────────────────────

  async function init() {
    await Promise.all([loadReglas(), renderEstrategiaGeneral()])
  }

  return { init }
})()
