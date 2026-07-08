// Fechas Especiales — gestión de catalogo_fechas (FOMC, festivos, vacaciones, otras)
const Fechas = (() => {

  const TIPOS = {
    fomc:       { label: 'FOMC',       emoji: '🏛️' },
    festivo:    { label: 'Festivos',   emoji: '🏦' },
    vacaciones: { label: 'Vacaciones', emoji: '🏖️' },
    otro:       { label: 'Otras',      emoji: '⭐' },
  }
  const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
  const DIAS  = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']

  let year   = new Date().getFullYear()
  let fechas = []
  let wired  = false

  const esc = s => (s || '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
  function fmtFecha(iso) {
    const d = new Date(iso + 'T00:00:00')
    if (isNaN(d)) return iso
    return `${DIAS[d.getDay()]} ${String(d.getDate()).padStart(2, '0')} ${MESES[d.getMonth()]} ${d.getFullYear()}`
  }

  async function init() {
    if (!wired) { wire(); wired = true }
    buildYearSelect()
    await load()
  }
  async function reload() { await load() }

  function buildYearSelect() {
    const sel = document.getElementById('fechasYear'); if (!sel) return
    const cur = new Date().getFullYear()
    let html = ''
    for (let y = cur + 1; y >= cur - 3; y--) html += `<option value="${y}" ${y === year ? 'selected' : ''}>${y}</option>`
    sel.innerHTML = html
  }

  async function load() {
    const cont = document.getElementById('fechasContent'); if (!cont) return
    cont.innerHTML = '<p class="fechas-empty">Cargando…</p>'
    try { fechas = await DB.getFechasEspeciales(year) }
    catch (e) { cont.innerHTML = `<p class="coach-error">Error al cargar fechas: ${esc(e.message)}</p>`; return }
    render()
  }

  function render() {
    const cont = document.getElementById('fechasContent'); if (!cont) return
    const byTipo = { fomc: [], festivo: [], vacaciones: [], otro: [] }
    fechas.forEach(f => (byTipo[f.tipo] || byTipo.otro).push(f))

    cont.innerHTML = Object.keys(TIPOS).map(tipo => {
      const list = byTipo[tipo].sort((a, b) => a.fecha.localeCompare(b.fecha))
      const rows = list.length
        ? list.map(f => `
          <div class="fechas-row">
            <span class="fechas-emoji">${f.emoji || TIPOS[tipo].emoji}</span>
            <span class="fechas-date">${fmtFecha(f.fecha)}</span>
            <span class="fechas-name">${esc(f.nombre || '')}</span>
            <span class="fechas-notes">${esc(f.notas || '')}</span>
            <span class="fechas-row-actions">
              <button class="btn-icon-sm" data-edit="${f.id}" title="Editar"><i class="ti ti-edit"></i></button>
              <button class="btn-icon-sm danger" data-del="${f.id}" title="Eliminar"><i class="ti ti-trash"></i></button>
            </span>
          </div>`).join('')
        : `<p class="fechas-empty">Sin fechas de este tipo en ${year}.</p>`
      return `<div class="fechas-group">
        <div class="fechas-gh"><span>${TIPOS[tipo].emoji} ${TIPOS[tipo].label}</span><span class="fechas-count">${list.length}</span></div>
        ${rows}
      </div>`
    }).join('')

    cont.querySelectorAll('[data-edit]').forEach(b => b.addEventListener('click', () => openModal(fechas.find(f => String(f.id) === b.dataset.edit))))
    cont.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', () => del(b.dataset.del)))
  }

  // ── Modal nueva / editar ──────────────────────────────────────────────────
  function openModal(f) {
    document.getElementById('fechaId').value     = f?.id || ''
    document.getElementById('fechaInput').value  = f?.fecha || `${year}-01-01`
    document.getElementById('fechaTipo').value   = f?.tipo || 'otro'
    document.getElementById('fechaNombre').value = f?.nombre || ''
    document.getElementById('fechaEmoji').value  = f?.emoji || ''
    document.getElementById('fechaNotas').value  = f?.notas || ''
    document.getElementById('fechaModalTitle').innerHTML =
      `<i class="ti ti-calendar-star"></i> ${f ? 'Editar fecha' : 'Nueva fecha'}`
    document.getElementById('fechaModal').classList.remove('hidden')
    document.body.classList.add('modal-open')
  }
  function closeModal() {
    document.getElementById('fechaModal').classList.add('hidden')
    document.body.classList.remove('modal-open')
  }

  async function guardar() {
    const id     = document.getElementById('fechaId').value
    const fecha  = document.getElementById('fechaInput').value
    const tipo   = document.getElementById('fechaTipo').value
    const nombre = document.getElementById('fechaNombre').value.trim() || null
    const emoji  = document.getElementById('fechaEmoji').value.trim() || null
    const notas  = document.getElementById('fechaNotas').value.trim() || null
    if (!fecha) { Toast.show('Selecciona una fecha', 'warning'); return }
    try {
      if (id) await DB.updateFechaEspecial(id, { fecha, tipo, nombre, emoji, notas })
      else    await DB.addFechaEspecial({ fecha, tipo, nombre, emoji, notas })
      closeModal()
      Toast.show('Fecha guardada', 'success')
      await load()
      refrescarCalendario()
    } catch (e) { Toast.show('Error al guardar: ' + e.message, 'error') }
  }

  async function del(id) {
    if (!confirm('¿Eliminar esta fecha del calendario?')) return
    try { await DB.deleteFechaEspecial(id); await load(); refrescarCalendario() }
    catch (e) { Toast.show('Error al eliminar: ' + e.message, 'error') }
  }

  // Genera los festivos CME del año (reusa la fórmula del calendario), sin duplicar
  async function generarFestivos() {
    if (typeof Calendar === 'undefined' || !Calendar.calcCMEHolidays) {
      Toast.show('No se pudo acceder al generador de festivos', 'error'); return
    }
    const hol = Calendar.calcCMEHolidays(year)  // { iso: { name, emoji } }
    const yaHay = new Set(fechas.filter(f => f.tipo === 'festivo').map(f => f.fecha))
    const nuevos = Object.keys(hol).filter(iso => !yaHay.has(iso))
    if (!nuevos.length) { Toast.show(`Los festivos de ${year} ya están registrados`, 'info'); return }
    try {
      for (const iso of nuevos) await DB.addFechaEspecial({ fecha: iso, tipo: 'festivo', nombre: hol[iso].name, emoji: hol[iso].emoji })
      Toast.show(`${nuevos.length} festivo(s) generados para ${year}`, 'success')
      await load()
      refrescarCalendario()
    } catch (e) { Toast.show('Error al generar: ' + e.message, 'error') }
  }

  // Recarga el calendario si ya está inicializado (para reflejar los cambios)
  function refrescarCalendario() {
    try { if (typeof Calendar !== 'undefined' && Calendar.load) Calendar.load() } catch (_) {}
  }

  function wire() {
    document.getElementById('fechasYear')?.addEventListener('change', e => { year = parseInt(e.target.value); load() })
    document.getElementById('fechasNueva')?.addEventListener('click', () => openModal(null))
    document.getElementById('fechasGenFestivos')?.addEventListener('click', generarFestivos)
    document.getElementById('fechaGuardar')?.addEventListener('click', guardar)
    document.getElementById('closeFechaModal')?.addEventListener('click', closeModal)
    document.getElementById('fechaModal')?.addEventListener('click', e => {
      if (e.target === document.getElementById('fechaModal')) closeModal()
    })
  }

  return { init, reload }
})()
