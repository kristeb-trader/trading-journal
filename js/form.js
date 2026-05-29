// Session registration form
const SessionForm = (() => {
  let editingDate = null // set when editing an existing session
  let retrocesoCancelId = 0

  function setToday() {
    const today = new Date().toISOString().slice(0, 10)
    document.getElementById('sesionDate').value = today
  }

  function setupBtnGroups() {
    document.querySelectorAll('.btn-group').forEach(group => {
      group.querySelectorAll('.btn-option').forEach(btn => {
        btn.addEventListener('click', () => {
          group.querySelectorAll('.btn-option').forEach(b => b.classList.remove('active'))
          btn.classList.add('active')
          // write value to associated hidden input
          const hiddenId = group.id === 'corrida' ? 'numCorrida' : 'zonasContraVal'
          const hidden = document.getElementById(hiddenId)
          if (hidden) hidden.value = btn.dataset.value
        })
      })
    })
  }

  function setupNoOperoToggle() {
    const toggle = document.getElementById('noOpero')
    const motivoGroup = document.getElementById('motivoGroup')
    const tradingFields = document.getElementById('tradingFields')
    toggle.addEventListener('change', () => {
      if (toggle.checked) {
        motivoGroup.classList.remove('hidden')
        tradingFields.classList.add('hidden')
      } else {
        motivoGroup.classList.add('hidden')
        tradingFields.classList.remove('hidden')
      }
    })

    // Mostrar campos extra cuando el motivo es "Setup válido no tomado"
    document.getElementById('motivoNoOpero').addEventListener('change', function() {
      const isSetupNoTomado = this.value === 'Setup válido no tomado'
      document.getElementById('setupNoTomadoGroup').classList.toggle('hidden', !isSetupNoTomado)
    })

    // Btn-group: motivo no entrada
    setupBtnGroupHidden('motivoNoEntradaGroup', 'motivoNoEntradaVal')

    // Btn-group: zona naranja en setup no tomado
    document.getElementById('zonaNaranjaHabiaSNTGroup')?.querySelectorAll('.btn-option').forEach(btn => {
      btn.addEventListener('click', () => {
        document.getElementById('zonaNaranjaHabiaSNTGroup').querySelectorAll('.btn-option').forEach(b => b.classList.remove('active'))
        btn.classList.add('active')
        document.getElementById('zonaNaranjaHabiaVal').value = btn.dataset.value
        document.getElementById('zonaNaranjaReaccionSNT').classList.toggle('hidden', btn.dataset.value !== 'true')
      })
    })
    setupBtnGroupHidden('zonaNaranjaReaccionSNTGroup', 'zonaNaranjaReaccionVal')

    // Btn-group: zona naranja en trade normal
    document.getElementById('zonaNaranjaHabiaGroup')?.querySelectorAll('.btn-option').forEach(btn => {
      btn.addEventListener('click', () => {
        document.getElementById('zonaNaranjaHabiaGroup').querySelectorAll('.btn-option').forEach(b => b.classList.remove('active'))
        btn.classList.add('active')
        document.getElementById('zonaNaranjaHabiaTradeVal').value = btn.dataset.value
        document.getElementById('zonaNaranjaReaccionGroup').classList.toggle('hidden', btn.dataset.value !== 'true')
      })
    })
    setupBtnGroupHidden('zonaNaranjaReaccionTradeGroup', 'zonaNaranjaReaccionTradeVal')
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
    const trades = await DB.getTradesByDate(date)
    if (myId !== retrocesoCancelId) return
    if (trades.length > 0) {
      const netPnl = trades.reduce((s, t) => s + (parseFloat(t.profit) || 0), 0)
      const pts = Math.abs(netPnl / 2).toFixed(2)
      display.textContent = `${pts} pts`
      hidden.value = pts
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
      payload.chk_zonas = document.getElementById('chkZonas').checked
      payload.chk_orden = document.getElementById('chkOrden').checked
      payload.chk_5velas = document.getElementById('chk5Velas').checked
      payload.chk_noticias = document.getElementById('chkNoticias').checked
      payload.chk_consecucion = document.getElementById('chkConsecucion').checked
      payload.chk_estructura = document.getElementById('chkEstructura').checked
    }

    payload.analisis_trader = document.getElementById('analisisTrader').value || null
    payload.resumen_ia = document.getElementById('resumenIA').value || null
    payload.imagen_url = document.getElementById('imagenUrl').value || null

    // Setup válido no tomado (aplica cuando no_opero = true)
    if (noOpero) {
      const svnt = document.getElementById('motivoNoOpero').value === 'Setup válido no tomado'
      payload.setup_valido_no_tomado = svnt
      if (svnt) {
        payload.setup_observado   = document.getElementById('setupObservado').value || null
        payload.motivo_no_entrada = document.getElementById('motivoNoEntradaVal').value || null
        // Zona naranja desde el bloque "setup no tomado"
        const znHabia = document.getElementById('zonaNaranjaHabiaVal').value
        payload.zona_naranja_habia    = znHabia === 'true' ? true : znHabia === 'false' ? false : null
        payload.zona_naranja_reaccion = document.getElementById('zonaNaranjaReaccionVal').value || null
        payload.zona_naranja_nota     = document.getElementById('zonaNaranjaNotaVal').value || null
      }
    } else {
      // Zona naranja desde el bloque de trading normal
      const znHabia = document.getElementById('zonaNaranjaHabiaTradeVal').value
      payload.zona_naranja_habia    = znHabia === 'true' ? true : znHabia === 'false' ? false : null
      payload.zona_naranja_reaccion = document.getElementById('zonaNaranjaReaccionTradeVal').value || null
      payload.zona_naranja_nota     = document.getElementById('zonaNaranjaNotaTradeVal').value || null
    }

    return payload
  }

  function clearForm() {
    document.getElementById('sessionForm').reset()
    document.querySelectorAll('.btn-option').forEach(b => b.classList.remove('active'))
    document.getElementById('motivoGroup').classList.add('hidden')
    document.getElementById('tradingFields').classList.remove('hidden')
    document.getElementById('imagePreview').classList.add('hidden')
    document.getElementById('uploadArea').classList.remove('hidden')
    document.getElementById('imagenUrl').value = ''
    updateRetroceso(document.getElementById('sesionDate').value)
    casPendientes = []
    renderCasList()
    editingDate = null
    setToday()
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

  function prefill(sesion, date) {
    clearForm()
    // Navegar primero: si es la primera vez, init() llama setToday() aquí.
    // Los valores correctos se asignan DESPUÉS para pisarlo.
    document.querySelector('[data-section="register"]').click()

    if (!sesion) {
      if (date) {
        document.getElementById('sesionDate').value = date
        updateRetroceso(date)
      }
      return
    }

    editingDate = sesion.sesion_date
    document.getElementById('sesionDate').value = sesion.sesion_date
    loadCasuisticasForDate(sesion.sesion_date)
    updateRetroceso(sesion.sesion_date)
    document.getElementById('noOpero').checked = sesion.no_opero || false
    document.getElementById('noOpero').dispatchEvent(new Event('change'))

    if (!sesion.no_opero) {
      document.getElementById('contexto').value = sesion.contexto || ''
      document.getElementById('velasCorrida').value = sesion.velas_corrida || ''
      document.getElementById('setup').value = sesion.setup || ''
      document.getElementById('chkZonas').checked = sesion.chk_zonas || false
      document.getElementById('chkOrden').checked = sesion.chk_orden || false
      document.getElementById('chk5Velas').checked = sesion.chk_5velas || false
      document.getElementById('chkNoticias').checked = sesion.chk_noticias || false
      document.getElementById('chkConsecucion').checked = sesion.chk_consecucion || false
      document.getElementById('chkEstructura').checked = sesion.chk_estructura || false

      if (sesion.num_corrida) {
        document.getElementById('numCorrida').value = sesion.num_corrida
        document.querySelector(`#corrida [data-value="${sesion.num_corrida}"]`)?.classList.add('active')
      }
      if (sesion.zonas_contra != null) {
        const v = String(sesion.zonas_contra)
        document.getElementById('zonasContraVal').value = v
        document.querySelector(`#zonasContra [data-value="${v}"]`)?.classList.add('active')
      }
    } else {
      document.getElementById('motivoNoOpero').value = sesion.motivo_no_opero || ''
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
      if (sesion.zona_naranja_habia != null) {
        const v = String(sesion.zona_naranja_habia)
        document.getElementById('zonaNaranjaHabiaVal').value = v
        document.querySelector(`#zonaNaranjaHabiaSNTGroup [data-value="${v}"]`)?.classList.add('active')
        if (sesion.zona_naranja_habia) {
          document.getElementById('zonaNaranjaReaccionSNT').classList.remove('hidden')
          if (sesion.zona_naranja_reaccion) {
            document.getElementById('zonaNaranjaReaccionVal').value = sesion.zona_naranja_reaccion
            document.querySelector(`#zonaNaranjaReaccionSNTGroup [data-value="${sesion.zona_naranja_reaccion}"]`)?.classList.add('active')
          }
          document.getElementById('zonaNaranjaNotaVal').value = sesion.zona_naranja_nota || ''
        }
      }
    }
    // Zona naranja en sesión con trade
    if (!sesion.no_opero && sesion.zona_naranja_habia != null) {
      const v = String(sesion.zona_naranja_habia)
      document.getElementById('zonaNaranjaHabiaTradeVal').value = v
      document.querySelector(`#zonaNaranjaHabiaGroup [data-value="${v}"]`)?.classList.add('active')
      if (sesion.zona_naranja_habia) {
        document.getElementById('zonaNaranjaReaccionGroup').classList.remove('hidden')
        if (sesion.zona_naranja_reaccion) {
          document.getElementById('zonaNaranjaReaccionTradeVal').value = sesion.zona_naranja_reaccion
          document.querySelector(`#zonaNaranjaReaccionTradeGroup [data-value="${sesion.zona_naranja_reaccion}"]`)?.classList.add('active')
        }
        document.getElementById('zonaNaranjaNotaTradeVal').value = sesion.zona_naranja_nota || ''
      }
    }

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
  }

  // ── Casuísticas ──────────────────────────────────────────────────────────
  let casResultado = null
  let casPendientes = [] // { casuistica, resultado } — sin guardar aún

  let casCatalogoTipo = {}  // nombre → tipo (para denormalizar al registrar)

  async function loadCasuisticasDropdown() {
    const items = await DB.getCatalogoCasuisticas()
    const select = document.getElementById('casCasuistica')
    const active = items.filter(i => i.activa)
    casCatalogoTipo = {}
    items.forEach(i => { casCatalogoTipo[i.nombre] = i.tipo || null })
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
        const saved = await DB.saveCasuistica(sesionDate, casuistica, casResultado, casCatalogoTipo[casuistica] || null)
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
    const list = document.getElementById('casList')
    if (!casPendientes.length) { list.innerHTML = ''; return }
    list.innerHTML = casPendientes.map((c, i) => `
      <div class="cas-tag">
        <div class="cas-tag-left">
          <span class="${c.resultado === 'T' ? 'cas-badge-t' : 'cas-badge-s'}">${c.resultado}</span>
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
    updateRetroceso(document.getElementById('sesionDate').value)
    setupBtnGroups()
    setupNoOperoToggle()
    setupImageUpload()
    setupCasuisticas()
    loadCasuisticasDropdown()
    document.getElementById('resumenIA').addEventListener('input', function() {
      this.style.height = 'auto'
      this.style.height = this.scrollHeight + 'px'
    })
    document.getElementById('sessionForm').addEventListener('submit', handleSubmit)
    document.getElementById('clearForm').addEventListener('click', clearForm)

    // Cargar casuísticas y auto-calcular retroceso al cambiar fecha
    document.getElementById('sesionDate').addEventListener('change', () => {
      const date = document.getElementById('sesionDate').value
      loadCasuisticasForDate(date)
      updateRetroceso(date)
    })

    // Auto-invalidar checklist de 5 velas si velas > 5
    document.getElementById('velasCorrida').addEventListener('input', () => {
      const velas = parseInt(document.getElementById('velasCorrida').value) || 0
      const chk = document.getElementById('chk5Velas')
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

  return { init, prefill }
})()
