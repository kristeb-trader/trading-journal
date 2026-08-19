// Filtro de cuentas multi-selección — componente compartido
//
// Reemplaza a los 4 `<select>` de cuenta (Análisis, Calendario, Trades y el que
// Métricas lee del Calendario) y a las 4 copias de `abbreviateAccount()`, que
// recortaban el nombre a los 2 primeros segmentos: `APEX-232411-14` se mostraba
// como `APEX-232411` (indistinguible de una futura `-15`, que habría caído en la
// misma opción sumándose en silencio) y `PA-APEX-232411-03` como `PA-APEX`.
// Aquí el valor y la etiqueta son SIEMPRE el nombre completo de la cuenta.
//
// Selección: `null` = todas las cuentas · array = ese subconjunto.
const AccountFilter = (() => {
  const inst = {}          // id → estado de cada instancia
  let principalPromise = null

  // La cuenta principal (`objetivos.cuenta_principal`) se lee una sola vez por
  // carga y la comparten las 3 instancias. Hace falta pedirla explícitamente:
  // Calendar.init() corre antes que cualquier otro getObjetivos(), así que el
  // cache de DB todavía tendría el fallback histórico (la PA quemada).
  function principalOnce() {
    if (!principalPromise) {
      principalPromise = Promise.resolve()
        .then(() => (typeof DB !== 'undefined' && DB.fetchCuentaPrincipal) ? DB.fetchCuentaPrincipal() : null)
        .catch(() => null)
    }
    return principalPromise
  }

  const esc = s => String(s ?? '').replace(/[&<>"']/g, c =>
    ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]))

  // ── Persistencia ────────────────────────────────────────────────────────
  function persist(st) {
    if (!st.storageKey) return
    localStorage.setItem(st.storageKey, st.selected === null ? 'all' : JSON.stringify(st.selected))
  }

  // Devuelve: null (todas) | array | undefined (nada guardado → usar default)
  function restore(st) {
    const raw = st.storageKey ? localStorage.getItem(st.storageKey) : null
    if (raw === 'all') return null
    if (raw) {
      try {
        const arr = JSON.parse(raw)
        if (Array.isArray(arr)) {
          const vivas = arr.filter(a => st.accounts.includes(a))
          if (vivas.length) return vivas
        }
      } catch { /* valor corrupto → se ignora y cae al default */ }
    }
    // Migración desde la clave vieja, cuyo valor era el nombre ABREVIADO
    // ('PA-APEX', 'APEX-232411', 'all'). Se expande a las cuentas completas que
    // ese prefijo representaba — que es justo lo que el filtro viejo incluía.
    if (!st.legacyKey) return undefined
    const old = localStorage.getItem(st.legacyKey)
    if (!old) return undefined
    if (old === 'all') return null
    const match = st.accounts.filter(a => a === old || a.startsWith(old + '-'))
    return match.length ? match : undefined
  }

  function defaultSelection(st) {
    if (st.principal && st.accounts.includes(st.principal)) return [st.principal]
    const pa = st.accounts.find(a => a.startsWith('PA-APEX'))
    return pa ? [pa] : null
  }

  // ── Render ──────────────────────────────────────────────────────────────

  // Etiqueta completa: va al `title` del botón y a la API pública.
  function label(st) {
    if (st.selected === null) return 'Todas las cuentas'
    if (st.selected.length === 1) return st.selected[0]
    return `${st.selected.length} cuentas`
  }

  // Forma corta de un nombre de cuenta: PRIMER segmento (qué es) + ÚLTIMO (cuál
  // es), que es lo que de verdad la distingue.
  //   APEX-232411-15    → APEX-15
  //   PA-APEX-232411-03 → PA-03
  const abreviar = n => {
    const p = String(n).split('-')
    return p.length < 3 ? String(n) : `${p[0]}-${p[p.length - 1]}`
  }

  // Etiqueta del BOTÓN cerrado. En la barra superior el ancho útil en móvil son
  // ~70 px y el nombre completo no cabe. Antes se recortaba por delante desde el
  // CSS con `direction: rtl`, pero eso no mueve solo los puntos suspensivos:
  // cambia la dirección del párrafo y el algoritmo bidi reordena el texto, así
  // que "3 cuentas" se leía **"cuentas 3"** (18 ago 2026). Se acorta aquí.
  // El nombre completo sigue en el desplegable y en el `title` del botón.
  function labelBtn(st) {
    if (st.selected === null) return 'Todas'
    if (st.selected.length === 1) {
      const n = st.selected[0], corto = abreviar(n)
      // Si dos cuentas colapsaran en la misma forma corta (mismo prefijo y mismo
      // final), se muestran enteras: distinguirlas importa más que el ancho.
      return st.accounts.some(a => a !== n && abreviar(a) === corto) ? n : corto
    }
    return `${st.selected.length} cuentas`
  }

  function render(st) {
    const all = st.selected === null
    st.el.innerHTML = `
      <button type="button" class="acct-filter-btn" aria-expanded="false" title="Cuenta: ${esc(label(st))} — toca para cambiar">
        <span class="acct-filter-text">${esc(labelBtn(st))}</span>
        <i class="ti ti-chevron-down acct-filter-caret"></i>
      </button>
      <div class="acct-filter-panel hidden">
        <label class="acct-filter-opt acct-filter-opt-all">
          <input type="checkbox" data-all ${all ? 'checked' : ''}>
          <span class="acct-filter-name">Todas las cuentas</span>
        </label>
        <div class="acct-filter-sep"></div>
        ${st.accounts.length
          ? st.accounts.map(a => `
            <label class="acct-filter-opt">
              <input type="checkbox" value="${esc(a)}" ${!all && st.selected.includes(a) ? 'checked' : ''}>
              <span class="acct-filter-name">${esc(a)}</span>
              ${a === st.principal ? '<span class="acct-filter-badge">principal</span>' : ''}
            </label>`).join('')
          : '<div class="acct-filter-empty">Sin cuentas registradas</div>'}
      </div>`
  }

  function updateLabel(st) {
    const t = st.el.querySelector('.acct-filter-text')
    if (t) t.textContent = labelBtn(st)
    // El botón muestra la forma corta; el title lleva siempre el nombre entero.
    st.el.querySelector('.acct-filter-btn')?.setAttribute('title', `Cuenta: ${label(st)} — toca para cambiar`)
  }

  function closeAll(except) {
    Object.values(inst).forEach(st => {
      if (st === except) return
      st.el.querySelector('.acct-filter-panel')?.classList.add('hidden')
      st.el.querySelector('.acct-filter-btn')?.setAttribute('aria-expanded', 'false')
    })
  }

  function onBoxChange(st, box) {
    const panel  = st.el.querySelector('.acct-filter-panel')
    const allBox = panel.querySelector('input[data-all]')
    const boxes  = [...panel.querySelectorAll('input[type=checkbox]')].filter(b => b !== allBox)

    if (box === allBox) {
      // "Todas" es excluyente: marcarla limpia el subconjunto; desmarcarla sola
      // dejaría el filtro vacío, así que se re-marca.
      st.selected = null
      allBox.checked = true
      boxes.forEach(b => { b.checked = false })
    } else {
      const chosen = boxes.filter(b => b.checked).map(b => b.value)
      if (chosen.length === 0 || chosen.length === boxes.length) {
        st.selected = null
        allBox.checked = true
        boxes.forEach(b => { b.checked = false })
      } else {
        st.selected = chosen
        allBox.checked = false
      }
    }
    persist(st)
    updateLabel(st)
    st.onChange?.(st.selected)
  }

  // ── API pública ─────────────────────────────────────────────────────────

  // Monta el filtro en el contenedor `mountId`. `legacyKey` migra el valor
  // abreviado del `<select>` anterior. `onChange` recibe la selección.
  function create(id, { mountId, storageKey, legacyKey, onChange } = {}) {
    const el = document.getElementById(mountId)
    if (!el) return null
    // Idempotente: TradesTable.reload() reusa init(), y volver a registrar los
    // listeners haría que un clic abriera y cerrara el panel en el mismo evento.
    if (inst[id] && inst[id].el === el) {
      inst[id].onChange = onChange
      return inst[id]
    }
    const st = inst[id] = { id, el, storageKey, legacyKey, onChange, accounts: [], selected: null, principal: null }
    el.classList.add('acct-filter')
    render(st)

    // Delegación en el contenedor: sobrevive a los re-render del innerHTML.
    el.addEventListener('click', e => {
      const btn = e.target.closest('.acct-filter-btn')
      if (!btn) return
      const panel = el.querySelector('.acct-filter-panel')
      const open = panel.classList.contains('hidden')
      closeAll(st)
      panel.classList.toggle('hidden', !open)
      btn.setAttribute('aria-expanded', String(open))
    })
    el.addEventListener('change', e => {
      const box = e.target.closest('input[type=checkbox]')
      if (box) onBoxChange(st, box)
    })
    return st
  }

  // Carga la lista de cuentas (nombres completos) y resuelve la selección:
  // guardada → migrada desde la clave vieja → cuenta principal → PA-* → todas.
  // No dispara `onChange`: el llamador renderiza a continuación.
  async function setAccounts(id, accounts) {
    const st = inst[id]
    if (!st) return
    st.principal = await principalOnce()
    // La cuenta principal SIEMPRE está en la lista, aunque todavía no tenga trades.
    // La lista sale de las cuentas presentes en `trades`, así que una cuenta recién
    // estrenada quedaba invisible hasta su primer export — y con ella el default,
    // que cae en la principal (pasó con la Apex-15 el 14-ago).
    st.accounts = [...new Set([...accounts, st.principal].filter(Boolean))].sort()
    const restored = restore(st)
    st.selected = restored === undefined ? defaultSelection(st) : restored
    if (st.selected && !st.selected.length) st.selected = null
    persist(st)
    render(st)
  }

  const selected = id => inst[id]?.selected ?? null
  const isAll    = id => selected(id) === null
  const matches  = (id, account) => { const s = selected(id); return s === null || s.includes(account) }
  const filter   = (id, trades) => { const s = selected(id); return s === null ? trades : trades.filter(t => s.includes(t.account)) }

  // Texto para nombres de archivo exportados
  function slug(id) {
    const s = selected(id)
    if (s === null) return 'todas'
    return s.length === 1 ? s[0] : `${s.length}-cuentas`
  }

  document.addEventListener('click', e => { if (!e.target.closest('.acct-filter')) closeAll() })
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeAll() })

  // `corto` se expone para que otras pantallas (las tarjetas de Otros) acorten
  // un nombre de cuenta con el MISMO criterio que el filtro, en vez de copiarlo.
  return { create, setAccounts, selected, isAll, matches, filter, slug, corto: abreviar, label: id => inst[id] ? label(inst[id]) : '' }
})()
