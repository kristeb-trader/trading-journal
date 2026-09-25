// Estrategia — el rulebook, DE SOLO LECTURA (fase 5c, 24 sep).
//
// «Plan de Chaumer» (etapa 2, desde el 24/09): tu checklist (las casillas y las
// automáticas), la checklist diaria del plan en el orden del documento, y sus
// reglas. El texto sale del plan (chaumer/01_Plan) y se edita SOLO allí (D-028);
// lo trae scripts/plan/sincronizar.mjs. Aquí no se toca.
// «Etapa anterior» (hasta el 23/09): el rulebook propio tal como quedó —sus 17
// casillas y los textos de filosofía—. Tampoco se edita: es la historia.
//
// Lo único editable es el límite de stop (`objetivos.stop_max_puntos`): lo usa la
// automática del stop en las dos etapas.
// Diseño: docs/disenos/2026-09-24-etapa-plan-chaumer.md §3.3 y §7.
const Estrategia = (() => {
  const TABS = [
    { k: 'plan',     label: 'Plan de Chaumer', icon: 'ti-book-2' },
    { k: 'anterior', label: 'Etapa anterior',  icon: 'ti-archive' },
  ]
  const VISTAS = {
    plan:     [{ k: 'checklist', label: 'Tu checklist' }, { k: 'diaria', label: 'Checklist diaria' }, { k: 'reglas', label: 'Reglas' }],
    anterior: [{ k: 'checklist', label: 'Checklist' }, { k: 'filosofia', label: 'Filosofía' }],
  }
  const TIPO = {
    casilla: { label: 'Casilla',    cls: 'b-casilla' },
    auto:    { label: 'Automática', cls: 'b-auto' },
    guia:    { label: 'Guía',       cls: 'b-guia' },
  }
  const FASE_CLS = { 1: 'b-f1', 2: 'b-f2', 3: 'b-f3' }
  const FASE_TITLE = { 1: 'Fase 1 · Pre-sesión', 2: 'Fase 2 · Lectura del setup', 3: 'Fase 3 · Ejecución' }
  const STOP_CODIGOS = ['p2_stop_max', 'stop_max_puntos']

  let reglas = []
  let objetivos = null
  let tab = 'plan'
  let vista = 'checklist'
  let wired = false

  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
  const porOrden = (a, b) => (a.fase || 0) - (b.fase || 0) || (a.orden || 0) - (b.orden || 0)

  // ── Qué es de cada etapa ─────────────────────────────────────────────────
  const plan = () => reglas.filter(r => r.etapa === 2)
  const planChecklist = () => plan().filter(r => r.es_checklist && r.activa !== false).sort(porOrden)
  const planLineas = () => plan().filter(r => r.origen === 'plan_linea' && r.activa !== false)
    .sort((a, b) => (a.plan_linea || 0) - (b.plan_linea || 0))
  const planReglas = () => plan().filter(r => r.origen === 'plan_regla' && !r.es_checklist && r.activa !== false)
    .sort((a, b) => (a.orden || 0) - (b.orden || 0))
  const anteriorChecklist = () => reglas.filter(r => r.etapa === 1).sort(porOrden)
  const anteriorFilosofia = () => reglas.filter(r => r.origen === 'journal' && r.capa === 'filosofia' && r.activa !== false)
    .sort((a, b) => (a.orden || 0) - (b.orden || 0))

  async function load() {
    const cont = document.getElementById('reglasList')
    try {
      // Todas, activas o no: la etapa anterior tiene sus casillas desactivadas.
      const [r, o] = await Promise.all([DB.getReglas(), DB.getObjetivos().catch(() => null)])
      reglas = r || []
      objetivos = o
    } catch (e) {
      if (cont) cont.innerHTML = `<p class="coach-error">No se pudieron leer las reglas: ${esc(e.message)}</p>`
      return
    }
    render()
  }

  function render() { renderTabs(); renderFilters(); renderList() }

  function renderTabs() {
    const el = document.getElementById('rbCapaPills'); if (!el) return
    const n = { plan: planReglas().length, anterior: anteriorChecklist().length }
    el.innerHTML = TABS.map(t => `
      <button class="rb-tab ${tab === t.k ? 'on' : ''}" data-tab="${t.k}">
        <i class="ti ${t.icon}"></i> ${t.label}
        <span class="n">${n[t.k]}</span>
      </button>`).join('')
  }

  function renderFilters() {
    const el = document.getElementById('rbFilters'); if (!el) return
    el.innerHTML = VISTAS[tab].map(v =>
      `<span class="rb-f ${vista === v.k ? 'on' : ''}" data-vista="${v.k}">${v.label}</span>`).join('')
  }

  // ── Tarjetas (sin edición) ───────────────────────────────────────────────
  function badges(r) {
    let b = ''
    if (r.plan_tipo && TIPO[r.plan_tipo]) b += `<span class="rb-bdg ${TIPO[r.plan_tipo].cls}">${TIPO[r.plan_tipo].label}</span>`
    else if (r.es_checklist) b += `<span class="rb-bdg ${r.evidencia === 'auto' ? 'b-auto' : 'b-casilla'}">${r.evidencia === 'auto' ? 'Automática' : 'Casilla'}</span>`
    if (r.es_checklist && r.fase) b += `<span class="rb-bdg ${FASE_CLS[r.fase]}">Fase ${r.fase}</span>`
    if (r.setup) b += `<span class="rb-bdg b-setup">${esc(DB.setupLabel(r.setup))}</span>`
    if (r.es_checklist && r.bloquea_go) b += `<span class="rb-bdg b-capa">Antes del GO</span>`
    return b
  }

  function card(r, { refs = true } = {}) {
    const refsTxt = refs && (r.plan_reglas || []).length && r.origen === 'plan_linea'
      ? `<span class="rb-refs">${(r.plan_reglas || []).map(esc).join(' · ')}</span>` : ''
    let foot = ''
    if (r.evidencia === 'auto' && r.campo) foot += `<span class="rb-nota"><i class="ti ti-database"></i> Se comprueba con ${esc(r.campo)}</span>`
    if (STOP_CODIGOS.includes(r.codigo)) {
      foot += `<span class="rb-param">Límite: <input type="number" class="rb-stopinput" value="${objetivos?.stop_max_puntos ?? 80}" min="1"> pts</span>`
    }
    const b = badges(r)
    return `
      <div class="rb-card${r.es_checklist ? ' dura' : ''}">
        ${b || refsTxt ? `<div class="rb-crow">${b}${refsTxt}</div>` : ''}
        <p class="rb-ttl">${esc(r.titulo)}</p>
        ${r.enunciado && r.enunciado !== r.titulo ? `<p class="rb-enu">${esc(r.enunciado)}</p>` : ''}
        ${foot ? `<div class="rb-foot">${foot}</div>` : ''}
      </div>`
  }

  // Agrupa en el orden en que aparecen, con un encabezado por grupo.
  function porGrupo(list, clave) {
    const grupos = []
    list.forEach(r => {
      const g = clave(r) || 'Sin grupo'
      if (!grupos.length || grupos[grupos.length - 1].g !== g) grupos.push({ g, rs: [] })
      grupos[grupos.length - 1].rs.push(r)
    })
    return grupos.map(x => `<div class="rb-fase-head">${esc(x.g)}</div>` + x.rs.map(r => card(r)).join('')).join('')
  }

  function renderList() {
    const cont = document.getElementById('reglasList'); if (!cont) return
    let html = ''
    if (tab === 'plan') {
      html = `<p class="rb-intro"><i class="ti ti-lock"></i> El plan de Chaumer, de solo lectura. El texto se cambia en el plan y llega aquí al sincronizar.</p>`
      if (vista === 'checklist') html += porGrupo(planChecklist(), r => FASE_TITLE[r.fase])
      else if (vista === 'diaria') html += porGrupo(planLineas(), r => r.plan_bloque)
      else html += porGrupo(planReglas(), r => r.plan_bloque)
    } else {
      html = `<p class="rb-intro"><i class="ti ti-archive"></i> El rulebook propio hasta el 23/09/2026, tal como quedó. Sus casillas siguen contando en la disciplina de esa etapa.</p>`
      html += vista === 'checklist'
        ? porGrupo(anteriorChecklist(), r => FASE_TITLE[r.fase] || 'Sin fase')
        : anteriorFilosofia().map(r => card(r)).join('')
    }
    cont.innerHTML = html || `<p class="rb-empty">No hay nada que enseñar aquí.</p>`
  }

  function wire() {
    document.getElementById('rbCapaPills')?.addEventListener('click', e => {
      const t = e.target.closest('[data-tab]'); if (!t) return
      tab = t.dataset.tab; vista = VISTAS[tab][0].k; render()
    })
    document.getElementById('rbFilters')?.addEventListener('click', e => {
      const v = e.target.closest('[data-vista]'); if (!v) return
      vista = v.dataset.vista; renderFilters(); renderList()
    })
    document.getElementById('reglasList')?.addEventListener('change', async e => {
      const stop = e.target.closest('.rb-stopinput')
      if (!stop) return
      const val = parseFloat(stop.value)
      if (isNaN(val) || val <= 0) { Toast.show('Valor de stop inválido', 'warning'); return }
      try {
        await DB.saveObjetivos({ stop_max_puntos: val })
        objetivos = { ...(objetivos || {}), stop_max_puntos: val }
        if (typeof Coach !== 'undefined' && Coach.clearCache) Coach.clearCache()
        Toast.show(`Límite de stop: ${val} pts`, 'success')
        renderList()
      } catch (err) { Toast.show('Error al guardar el límite: ' + err.message, 'error') }
    })
  }

  async function init() {
    if (!wired) { wire(); wired = true }
    await load()
  }

  return { init }
})()
