// Estrategia — Rulebook canónico (reglas) por capas: filosofía/setup/proceso/riesgo
const Estrategia = (() => {
  const CAPAS = ['filosofia', 'proceso', 'riesgo']
  const CAPA_LABEL = { filosofia: 'Filosofía', proceso: 'Proceso', riesgo: 'Riesgo' }
  const SETUP_LABEL = { iri: 'IRI', reingreso: 'Reingreso' }
  const FASE_CLS = { 1: 'b-f1', 2: 'b-f2', 3: 'b-f3' }

  let reglas = []
  let objetivos = null
  let filtro = { capa: 'todas', fase: null, soloDuras: false, soloActivas: false }
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

  function filtradas() {
    return reglas.filter(r => {
      if (filtro.capa !== 'todas' && r.capa !== filtro.capa) return false
      if (filtro.fase != null && r.fase !== filtro.fase) return false
      if (filtro.soloDuras && r.tipo !== 'dura') return false
      if (filtro.soloActivas && r.activa === false) return false
      return true
    }).sort((a, b) =>
      a.capa.localeCompare(b.capa) || ((a.fase || 9) - (b.fase || 9)) || ((a.orden || 0) - (b.orden || 0)))
  }

  function render() { renderPills(); renderFilters(); renderList() }

  function renderPills() {
    const el = document.getElementById('rbCapaPills'); if (!el) return
    const pill = (key, label, n) =>
      `<span class="rb-pill ${filtro.capa === key ? 'on' : ''}" data-capa="${key}">${label}${n != null ? ` <span class="n">${n}</span>` : ''}</span>`
    el.innerHTML = pill('todas', 'Todas', reglas.length) +
      CAPAS.map(c => pill(c, CAPA_LABEL[c], capaCount(c))).join('')
  }

  function renderFilters() {
    const el = document.getElementById('rbFilters'); if (!el) return
    const showFase = filtro.capa === 'proceso' || filtro.capa === 'todas'
    const f = (active, attr, label) => `<span class="rb-f ${active ? 'on' : ''}" ${attr}>${label}</span>`
    let html = ''
    if (showFase) {
      html += f(filtro.fase == null, 'data-fase="all"', 'Todas las fases')
      html += [1, 2, 3].map(n => f(filtro.fase === n, `data-fase="${n}"`, `Fase ${n}`)).join('')
      html += `<span class="rb-sep">·</span>`
    }
    html += f(filtro.soloActivas, 'data-tog="activas"', 'Solo activas')
    html += f(filtro.soloDuras, 'data-tog="duras"', 'Solo DURAS')
    el.innerHTML = html
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
    foot += sw(r.activa !== false, 'activa', 'Activa')
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

  function renderList() {
    const cont = document.getElementById('reglasList'); if (!cont) return
    const list = filtradas()
    cont.innerHTML = list.length
      ? list.map(cardHtml).join('')
      : `<p class="rb-empty">No hay reglas con estos filtros.</p>`
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

  async function nuevaRegla() {
    const capa = filtro.capa === 'todas' ? 'proceso' : filtro.capa
    const payload = {
      codigo: capa.slice(0, 3) + '_' + Date.now().toString(36),
      titulo: 'Nueva regla', enunciado: '', capa, tipo: 'blanda',
      direccion: 'ambas', es_checklist: capa === 'proceso',
      activa: true, estado: 'vigente',
      fase: capa === 'proceso' ? (filtro.fase || 1) : null, orden: 99,
    }
    try {
      const r = await DB.addRegla(payload)
      reglas.push(r); editId = r.id
      if (filtro.capa === 'todas') filtro.capa = capa
      render()
    } catch (e) { Toast.show('Error al crear la regla: ' + e.message, 'error') }
  }

  function togKey(t) { return t === 'activas' ? 'soloActivas' : 'soloDuras' }

  function wire() {
    document.getElementById('rbCapaPills')?.addEventListener('click', e => {
      const p = e.target.closest('[data-capa]'); if (!p) return
      filtro.capa = p.dataset.capa; filtro.fase = null; editId = null; render()
    })
    document.getElementById('rbFilters')?.addEventListener('click', e => {
      const fa = e.target.closest('[data-fase]')
      if (fa) { filtro.fase = fa.dataset.fase === 'all' ? null : parseInt(fa.dataset.fase); renderFilters(); renderList(); return }
      const tg = e.target.closest('[data-tog]')
      if (tg) { filtro[togKey(tg.dataset.tog)] = !filtro[togKey(tg.dataset.tog)]; renderFilters(); renderList() }
    })
    document.getElementById('reglaNuevaBtn')?.addEventListener('click', nuevaRegla)

    const cont = document.getElementById('reglasList')
    cont?.addEventListener('click', async e => {
      const t = e.target.closest('[data-act]'); if (!t) return
      const id = parseInt(t.dataset.id); const act = t.dataset.act; const r = find(id)
      if (!r) return
      if (act === 'tipo') { if (await patch(id, { tipo: r.tipo === 'dura' ? 'blanda' : 'dura' })) renderList() }
      else if (act === 'chk') { if (await patch(id, { es_checklist: !r.es_checklist })) renderList() }
      else if (act === 'activa') { if (await patch(id, { activa: r.activa === false })) renderList() }
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
      const inp = e.target.closest('.rb-stopinput'); if (!inp) return
      const val = parseFloat(inp.value)
      if (isNaN(val) || val <= 0) { Toast.show('Valor de stop inválido', 'warning'); return }
      try {
        await DB.saveObjetivos({ stop_max_puntos: val })
        objetivos = { ...(objetivos || {}), stop_max_puntos: val }
        if (typeof Coach !== 'undefined' && Coach.clearCache) Coach.clearCache()
        Toast.show(`Límite de stop: ${val} pts`, 'success')
      } catch (e) { Toast.show('Error al guardar el límite: ' + e.message, 'error') }
    })
  }

  async function init() {
    if (!wired) { wire(); wired = true }
    await load()
  }

  return { init }
})()
