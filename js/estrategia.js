// Estrategia — el rulebook, DE SOLO LECTURA (fase 5c, 24 sep).
//
// «Plan de Chaumer» (etapa 2, desde el 24/09): tu checklist (las casillas y las
// automáticas), la checklist diaria del plan en el orden del documento, y sus
// reglas. El texto sale del plan (chaumer/01_Plan) y se edita SOLO allí (D-028);
// lo trae scripts/plan/sincronizar.mjs. Aquí no se toca.
// «Etapa anterior» (hasta el 23/09): el rulebook propio tal como quedó —sus 17
// casillas y los textos de filosofía—. Tampoco se edita: es la historia.
//
// Nada se edita aquí. El límite de stop y el riesgo son de cada perfil y viven en Datos → Parámetros
// (D-055): aquí solo se ven, con un acceso. Antes había una casilla (`objetivos.stop_max_puntos`) y
// dos números más escritos a mano que ya no coincidían.
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
  // R-04 (plan 3.44): la regla lleva su tabla de ejemplos. Se calcula con el riesgo y el stop de TU perfil
  // (los mismos con los que db.js juzga), para que la tabla y el juicio no digan cosas distintas: por cada
  // número de contratos, el stop más grande que cabe.
  const RIESGO_CODIGOS = ['R-04', 'p2_un_contrato']
  function tablaRiesgo() {
    const riesgo = limiteDe('RIESGO_MAX'), stop = limiteDe('STOP_MAX')
    if (!(riesgo > 0)) return ''
    const filas = [1, 2, 3, 4, 8].map(n => {
      const max = Math.floor(riesgo / (n * USD_PUNTO_MNQ) / 0.25) * 0.25
      if (max < 1 || (stop > 0 && max > stop)) return ''
      return `<tr><td>hasta ${String(max).replace('.', ',')} pts</td><td>${n}</td><td>${fmtDinero(n * max * USD_PUNTO_MNQ, { masEnPositivo: false })}</td></tr>`
    }).join('')
    return `<table class="rb-tabla"><thead><tr><th>Stop</th><th>Contratos</th><th>Riesgo</th></tr></thead><tbody>${filas}</tbody></table>
      <p class="rb-nota">Con tu riesgo máximo de ${fmtDinero(riesgo, { masEnPositivo: false })} (Datos → Parámetros).</p>`
  }

  let reglas = []
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
      // getObjetivos también carga los parámetros (los límites que se enseñan aquí).
      const [r] = await Promise.all([DB.getReglas(), DB.getObjetivos().catch(() => null)])
      reglas = r || []
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
      const mio = limiteDe('STOP_MAX'), bot = limiteDe('STOP_MAX', { perfil: 'bot' })
      if (mio != null) foot += `<span class="rb-param">Tu límite: <b>${mio} pts</b>${bot != null && bot !== mio ? ` · el plan y el bot usan ${bot}` : ''}
        · <button type="button" class="rb-ir" data-ir-parametros>cambiar en Datos → Parámetros</button></span>`
    }
    const b = badges(r)
    return `
      <div class="rb-card${r.es_checklist ? ' dura' : ''}">
        ${b || refsTxt ? `<div class="rb-crow">${b}${refsTxt}</div>` : ''}
        <p class="rb-ttl">${esc(r.titulo)}</p>
        ${r.enunciado && r.enunciado !== r.titulo ? `<p class="rb-enu">${esc(r.enunciado)}</p>` : ''}
        ${RIESGO_CODIGOS.includes(r.codigo) ? tablaRiesgo() : ''}
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
    document.getElementById('reglasList')?.addEventListener('click', e => {
      if (!e.target.closest('[data-ir-parametros]')) return
      try { localStorage.setItem('datos.tab', 'parametros') } catch (_) {}
      Nav.go('data')
    })
  }

  async function init() {
    if (!wired) { wire(); wired = true }
    await load()
  }

  return { init }
})()
