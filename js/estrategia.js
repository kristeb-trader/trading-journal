// Estrategia — Rulebook canónico (reglas) por capas: filosofía/proceso/riesgo
const Estrategia = (() => {
  const CAPAS = ['filosofia', 'proceso', 'riesgo']
  const CAPA_LABEL = { filosofia: 'Filosofía', proceso: 'Reglas', riesgo: 'Riesgo' }
  const CAPA_ICON = { filosofia: 'ti-bulb', proceso: 'ti-list-check', riesgo: 'ti-shield' }
  const SETUP_LABEL = { iri: 'IRI', reingreso: 'Reingreso' }
  const FASE_CLS = { 1: 'b-f1', 2: 'b-f2', 3: 'b-f3' }
  const FASE_TITLE = { 1: 'Fase 1 · Pre-sesión', 2: 'Fase 2 · Lectura del setup', 3: 'Fase 3 · Ejecución' }
  // Subgrupos por setup dentro de Fase 2 (IRI / Reingreso / General)
  const SETUP_GROUPS = [{ key: 'iri', label: 'IRI' }, { key: 'reingreso', label: 'Reingreso' }, { key: null, label: 'General' }]

  let reglas = []
  let objetivos = null
  let filtro = { capa: 'proceso', fase: null }
  let editId = null
  let wired = false

  const esc = s => (s || '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))

  async function load() {
    const cont = document.getElementById('reglasList')
    try {
      const [r, o] = await Promise.all([DB.getReglas(), DB.getObjetivos().catch(() => null)])
      reglas = r || []
      objetivos = o
    } catch (e) {
      if (cont) cont.innerHTML = `<p class="coach-error">Error al cargar reglas: ${esc(e.message)}</p>`
      return
    }
    render()
  }

  function capaCount(c) { return reglas.filter(r => r.capa === c).length }

  // Reglas de una capa, ordenadas por `orden` (sin aplicar el filtro de DURAS).
  function capaReglas(capa, fase = undefined) {
    return reglas
      .filter(r => r.capa === capa && (fase === undefined || (r.fase || null) === fase))
      .sort((a, b) => (a.orden || 0) - (b.orden || 0))
  }

  function render() { renderTabs(); renderFilters(); renderList() }

  function renderTabs() {
    const el = document.getElementById('rbCapaPills'); if (!el) return
    el.innerHTML = CAPAS.map(c => `
      <button class="rb-tab ${filtro.capa === c ? 'on' : ''}" data-capa="${c}">
        <i class="ti ${CAPA_ICON[c]}"></i> ${CAPA_LABEL[c]}
        <span class="n">${capaCount(c)}</span>
      </button>`).join('')
  }

  function renderFilters() {
    const el = document.getElementById('rbFilters'); if (!el) return
    // Filtro por fase: solo en la pestaña de Reglas (proceso)
    if (filtro.capa !== 'proceso') { el.innerHTML = ''; return }
    const f = (active, val, label) => `<span class="rb-f ${active ? 'on' : ''}" data-fase="${val}">${label}</span>`
    el.innerHTML = f(filtro.fase == null, 'all', 'Todas las fases') +
      [1, 2, 3].map(n => f(filtro.fase === n, n, `Fase ${n}`)).join('')
  }

  function metaBadges(r) {
    let b = `<span class="rb-bdg b-capa">${CAPA_LABEL[r.capa] || r.capa}</span>`
    if (r.capa === 'proceso' && r.fase) b += `<span class="rb-bdg ${FASE_CLS[r.fase]}">Fase ${r.fase}</span>`
    if (r.setup) b += `<span class="rb-bdg b-setup">${SETUP_LABEL[r.setup] || esc(r.setup)}</span>`
    return b
  }

  function cardHtml(r) {
    if (editId === r.id) return editHtml(r)
    const dura = r.tipo === 'dura'
    const tipoTxt = dura ? 'DURA' : (r.tipo === 'experimental' ? 'EXPERIM.' : 'BLANDA')
    const chip = `<span class="rb-chip ${dura ? 'c-dura' : 'c-blanda'}" data-act="tipo" data-id="${r.id}" title="Cambiar dura/blanda">${tipoTxt}</span>`
    const sw = (on, act, label) => `<span class="rb-tog"><span class="rb-sw ${on ? 'on' : ''}" data-act="${act}" data-id="${r.id}"></span> ${label}</span>`

    let foot = ''
    if (r.capa === 'proceso') foot += sw(r.es_checklist, 'chk', 'En checklist')
    if (r.codigo === 'stop_max_puntos') {
      foot += `<span class="rb-param">Límite: <input type="number" class="rb-stopinput" value="${objetivos?.stop_max_puntos ?? 80}" min="1"> pts</span>`
    }
    foot += `<span class="rb-move">
      <i class="ti ti-chevron-up" data-act="up" data-id="${r.id}" title="Subir"></i>
      <i class="ti ti-chevron-down" data-act="down" data-id="${r.id}" title="Bajar"></i>
    </span>`
    foot += `<i class="ti ti-pencil rb-edit" data-act="edit" data-id="${r.id}" title="Editar"></i>`

    return `
      <div class="rb-card ${dura ? 'dura' : ''}${r.activa === false ? ' inactiva' : ''}">
        <div class="rb-crow">${metaBadges(r)}${chip}</div>
        <p class="rb-ttl">${esc(r.titulo)}</p>
        ${r.enunciado && r.enunciado !== r.titulo ? `<p class="rb-enu">${esc(r.enunciado)}</p>` : ''}
        <div class="rb-foot">${foot}</div>
      </div>`
  }

  function editHtml(r) {
    return `
      <div class="rb-card editing">
        <div class="rb-crow">${metaBadges(r)}</div>
        <input class="rb-input rb-ettl" data-id="${r.id}" value="${esc(r.titulo)}" placeholder="Título de la regla">
        <textarea class="rb-input rb-eenu" data-id="${r.id}" rows="4" placeholder="Enunciado: qué dice la regla y por qué">${esc(r.enunciado)}</textarea>
        <div class="rb-eactions">
          <button class="btn-sm btn-primary" data-act="save" data-id="${r.id}"><i class="ti ti-device-floppy"></i> Guardar</button>
          <button class="btn-sm btn-ghost" data-act="cancel" data-id="${r.id}">Cancelar</button>
          <button class="btn-sm rb-del" data-act="del" data-id="${r.id}" title="Eliminar regla"><i class="ti ti-trash"></i></button>
        </div>
      </div>`
  }

  // Fase 2: separar en subgrupos por setup (IRI / Reingreso / General)
  function faseHtml(f) {
    const list = capaReglas('proceso', f)
    if (!list.length) return `<p class="rb-empty-sm">Sin reglas en esta fase.</p>`
    if (f !== 2) return list.map(cardHtml).join('')
    let html = ''
    for (const g of SETUP_GROUPS) {
      const sub = list.filter(r => (r.setup || null) === g.key)
      if (!sub.length) continue
      html += `<div class="rb-setup-head">${g.label}</div>` + sub.map(cardHtml).join('')
    }
    return html
  }

  function renderList() {
    const cont = document.getElementById('reglasList'); if (!cont) return
    const capa = filtro.capa

    if (capa === 'proceso') {
      const fases = filtro.fase ? [filtro.fase] : [1, 2, 3]
      let html = ''
      for (const f of fases) {
        html += `<div class="rb-fase-head">${FASE_TITLE[f]}</div>` + faseHtml(f)
      }
      if (!filtro.fase) {
        const sinFase = capaReglas('proceso', null)
        if (sinFase.length) html += `<div class="rb-fase-head">Sin fase asignada</div>` + sinFase.map(cardHtml).join('')
      }
      cont.innerHTML = html
      return
    }

    const list = capaReglas(capa)
    cont.innerHTML = list.length
      ? list.map(cardHtml).join('')
      : `<p class="rb-empty">No hay reglas en esta capa.</p>`
  }

  function find(id) { return reglas.find(r => r.id === id) }

  async function patch(id, p) {
    try {
      await DB.updateRegla(id, p)
      Object.assign(find(id), p)
      if (typeof Coach !== 'undefined' && Coach.clearCache) Coach.clearCache()
      return true
    } catch (e) { Toast.show('Error al guardar: ' + e.message, 'error'); return false }
  }

  // Grupo de reordenamiento: misma capa, misma fase (y mismo setup en Fase 2).
  function grupoDe(r) {
    if (r.capa !== 'proceso') return capaReglas(r.capa)
    const fase = r.fase || null
    const g = capaReglas('proceso', fase)
    return fase === 2 ? g.filter(x => (x.setup || null) === (r.setup || null)) : g
  }

  async function mover(id, dir) {
    const r = find(id); if (!r) return
    const grupo = grupoDe(r)
    const i = grupo.findIndex(x => x.id === id)
    const j = i + dir
    if (i < 0 || j < 0 || j >= grupo.length) return
    ;[grupo[i], grupo[j]] = [grupo[j], grupo[i]]
    const cambios = []
    grupo.forEach((g, k) => { if (g.orden !== k) { g.orden = k; cambios.push(g) } })
    try {
      await Promise.all(cambios.map(g => DB.updateRegla(g.id, { orden: g.orden })))
      if (typeof Coach !== 'undefined' && Coach.clearCache) Coach.clearCache()
      renderList()
    } catch (e) { Toast.show('Error al reordenar: ' + e.message, 'error') }
  }

  async function nuevaRegla() {
    const capa = filtro.capa
    const orden = capaReglas(capa).length
    const payload = {
      codigo: capa.slice(0, 3) + '_' + Date.now().toString(36),
      titulo: 'Nueva regla', enunciado: '', capa, tipo: 'blanda',
      direccion: 'ambas', es_checklist: capa === 'proceso',
      activa: true, estado: 'vigente',
      fase: capa === 'proceso' ? (filtro.fase || 1) : null, orden,
    }
    try {
      const r = await DB.addRegla(payload)
      reglas.push(r); editId = r.id
      render()
    } catch (e) { Toast.show('Error al crear la regla: ' + e.message, 'error') }
  }

  function wire() {
    document.getElementById('rbCapaPills')?.addEventListener('click', e => {
      const p = e.target.closest('[data-capa]'); if (!p) return
      filtro.capa = p.dataset.capa; filtro.fase = null; editId = null; render()
    })
    document.getElementById('rbFilters')?.addEventListener('click', e => {
      const fa = e.target.closest('[data-fase]'); if (!fa) return
      filtro.fase = fa.dataset.fase === 'all' ? null : parseInt(fa.dataset.fase)
      renderFilters(); renderList()
    })
    document.getElementById('reglaNuevaBtn')?.addEventListener('click', nuevaRegla)

    const cont = document.getElementById('reglasList')
    cont?.addEventListener('click', async e => {
      const t = e.target.closest('[data-act]'); if (!t) return
      const id = parseInt(t.dataset.id); const act = t.dataset.act; const r = find(id)
      if (!r) return
      if (act === 'tipo') { if (await patch(id, { tipo: r.tipo === 'dura' ? 'blanda' : 'dura' })) renderList() }
      else if (act === 'chk') { if (await patch(id, { es_checklist: !r.es_checklist })) renderList() }
      else if (act === 'up') { mover(id, -1) }
      else if (act === 'down') { mover(id, 1) }
      else if (act === 'edit') { editId = id; renderList() }
      else if (act === 'cancel') { editId = null; renderList() }
      else if (act === 'save') {
        const ttl = cont.querySelector(`.rb-ettl[data-id="${id}"]`).value.trim()
        const enu = cont.querySelector(`.rb-eenu[data-id="${id}"]`).value.trim()
        if (!ttl) { Toast.show('El título no puede ir vacío', 'warning'); return }
        if (await patch(id, { titulo: ttl, enunciado: enu })) { editId = null; renderList(); Toast.show('Regla guardada', 'success') }
      }
      else if (act === 'del') {
        if (!confirm('¿Eliminar esta regla? No se puede deshacer.')) return
        try {
          await DB.deleteRegla(id)
          reglas = reglas.filter(x => x.id !== id); editId = null; render()
          if (typeof Coach !== 'undefined' && Coach.clearCache) Coach.clearCache()
          Toast.show('Regla eliminada', 'success')
        } catch (e) { Toast.show('Error al eliminar: ' + e.message, 'error') }
      }
    })
    cont?.addEventListener('change', async e => {
      const stop = e.target.closest('.rb-stopinput')
      if (stop) {
        const val = parseFloat(stop.value)
        if (isNaN(val) || val <= 0) { Toast.show('Valor de stop inválido', 'warning'); return }
        try {
          await DB.saveObjetivos({ stop_max_puntos: val })
          objetivos = { ...(objetivos || {}), stop_max_puntos: val }
          if (typeof Coach !== 'undefined' && Coach.clearCache) Coach.clearCache()
          Toast.show(`Límite de stop: ${val} pts`, 'success')
        } catch (e) { Toast.show('Error al guardar el límite: ' + e.message, 'error') }
      }
    })
  }

  async function init() {
    if (!wired) { wire(); wired = true }
    await load()
  }

  return { init }
})()
