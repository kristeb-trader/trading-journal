// ── Selector de cristal ────────────────────────────────────────────────────
// Rediseño «Cristal» (17/11/2026, Kris: «la ventana para seleccionar setup… los colores no contrastan, se ve muy
// feo»). La lista nativa del navegador no se deja pintar: los grupos («Continuación», «Reingreso») salían en blanco
// con letra clara. En el escritorio, al abrir cualquier <select> sale esta lista de cristal en su lugar.
//   · El <select> sigue siendo la verdad: se elige → se pone su value y se lanza `change` (y `input`), así que el
//     código de cada pantalla no se entera. Las opciones se leen al abrir: vale para las que se pintan después.
//   · Teclado: ↑ ↓ Inicio Fin para moverse, Enter o Espacio para elegir, Esc o Tab para cerrar, y escribir salta a
//     la primera que empiece por esa letra. Con el <select> enfocado y cerrado, las flechas siguen como siempre.
//   · No toca los múltiples, los deshabilitados (el Diario en lectura) ni el celular (su selector nativo es mejor).
const Selector = (() => {
  const fino = matchMedia('(hover: hover) and (pointer: fine)').matches
  const quieto = matchMedia('(prefers-reduced-motion: reduce)').matches
  let caja = null, sel = null, items = [], foco = -1, busca = '', buscaT = null

  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
  const sirve = s => s && s.tagName === 'SELECT' && !s.multiple && !s.matches(':disabled') && s.size <= 1 && !s.closest('[data-nativo]')

  function montar() {
    caja = document.createElement('div')
    caja.className = 'sel-lista'
    caja.setAttribute('role', 'listbox')
    caja.hidden = true
    document.body.appendChild(caja)
    caja.addEventListener('mousedown', e => e.preventDefault())          // que el <select> no pierda el foco
    caja.addEventListener('click', e => { const o = e.target.closest('.sel-op'); if (o && !o.classList.contains('off')) elegir(+o.dataset.i) })
    caja.addEventListener('mousemove', e => { const o = e.target.closest('.sel-op'); if (o && +o.dataset.i !== foco) marcar(+o.dataset.i, false) })
  }

  function abrir(s) {
    if (!caja) montar()
    sel = s
    items = []
    let html = ''
    const op = (o, enGrupo) => {
      const i = items.push(o) - 1
      const vacia = o.value === '' && !enGrupo
      html += `<div class="sel-op${o.disabled ? ' off' : ''}${o.selected ? ' on' : ''}${vacia ? ' vacia' : ''}${enGrupo ? ' sangria' : ''}" role="option" data-i="${i}" aria-selected="${o.selected}">
        <span>${esc(o.textContent.trim())}</span><i class="ti ti-check"></i></div>`
    }
    ;[...s.children].forEach(n => {
      if (n.tagName === 'OPTGROUP') {
        html += `<div class="sel-grupo" role="presentation">${esc(n.label)}</div>`
        ;[...n.children].forEach(o => op(o, true))
      } else if (n.tagName === 'OPTION') op(n, false)
    })
    caja.innerHTML = html
    caja.hidden = false
    caja.classList.toggle('quieta', quieto)
    s.classList.add('sel-abierto')
    s.setAttribute('aria-expanded', 'true')
    colocar()
    marcar(Math.max(0, s.selectedIndex), true)
    caja.classList.remove('entra'); requestAnimationFrame(() => caja.classList.add('entra'))
  }

  // Debajo del <select> y de su ancho (al menos 220 px); si no cabe abajo, encima. Alto máximo con su scroll.
  function colocar() {
    const r = sel.getBoundingClientRect(), m = 8, vh = innerHeight
    const ancho = Math.max(r.width, 220)
    caja.style.width = `${ancho}px`
    caja.style.left = `${Math.min(Math.max(m, r.left), innerWidth - ancho - m)}px`
    caja.style.maxHeight = ''
    const alto = Math.min(caja.scrollHeight, 360)
    const abajo = vh - r.bottom - m, arriba = r.top - m
    const sube = abajo < Math.min(alto, 220) && arriba > abajo
    const libre = sube ? arriba : abajo
    caja.style.maxHeight = `${Math.max(140, Math.min(360, libre - 6))}px`
    caja.style.top = sube ? `${Math.max(m, r.top - 6 - Math.min(alto, libre - 6))}px` : `${r.bottom + 6}px`
    caja.dataset.lado = sube ? 'arriba' : 'abajo'
  }

  function cerrar() {
    if (!sel) return
    sel.classList.remove('sel-abierto')
    sel.setAttribute('aria-expanded', 'false')
    caja.hidden = true
    caja.classList.remove('entra')
    sel = null
  }

  function marcar(i, centrar) {
    caja.querySelector('.sel-op.foco')?.classList.remove('foco')
    foco = i
    const o = caja.querySelector(`.sel-op[data-i="${i}"]`)
    if (!o) return
    o.classList.add('foco')
    if (centrar) o.scrollIntoView({ block: 'nearest' })
  }

  function mover(d) {
    const n = items.length
    for (let k = 1; k <= n; k++) {
      const i = Math.min(n - 1, Math.max(0, foco + d * k))
      if (!items[i].disabled) { marcar(i, true); return }
      if (i === 0 || i === n - 1) return
    }
  }

  function elegir(i) {
    const s = sel, o = items[i]
    if (!s || !o || o.disabled) return
    const cambia = s.value !== o.value || s.selectedIndex !== o.index
    s.selectedIndex = o.index
    cerrar()
    s.focus({ preventScroll: true })
    if (cambia) {
      s.dispatchEvent(new Event('input', { bubbles: true }))
      s.dispatchEvent(new Event('change', { bubbles: true }))
    }
    // un pulso en el campo: se ve que tomó el valor
    s.classList.remove('sel-pulso'); void s.offsetWidth; s.classList.add('sel-pulso')
  }

  function init() {
    if (!fino) return
    document.addEventListener('mousedown', e => {
      const s = e.target.closest?.('select')
      if (sel && !e.target.closest('.sel-lista') && s !== sel) cerrar()
      if (e.button !== 0 || !sirve(s)) return
      e.preventDefault()
      s.focus({ preventScroll: true })
      if (sel === s) cerrar(); else abrir(s)
    }, true)
    document.addEventListener('keydown', e => {
      if (!sel) {
        // Alt+↓ o F4 con un <select> enfocado: también abre la de cristal
        const s = document.activeElement
        if (sirve(s) && ((e.altKey && e.key === 'ArrowDown') || e.key === 'F4')) { e.preventDefault(); abrir(s) }
        return
      }
      const k = e.key
      if (k === 'ArrowDown') mover(1)
      else if (k === 'ArrowUp') mover(-1)
      else if (k === 'Home') { foco = -1; mover(1) }
      else if (k === 'End') { foco = items.length; mover(-1) }
      else if (k === 'Enter' || k === ' ') elegir(foco)
      else if (k === 'Escape' || k === 'Tab') { cerrar(); if (k === 'Tab') return }
      else if (k.length === 1 && /\S/.test(k)) {
        busca += k.toLowerCase(); clearTimeout(buscaT); buscaT = setTimeout(() => { busca = '' }, 700)
        const i = items.findIndex(o => !o.disabled && o.textContent.trim().toLowerCase().startsWith(busca))
        if (i >= 0) marcar(i, true)
      } else return
      e.preventDefault(); e.stopPropagation()
    }, true)
    // La lista va pegada al campo: si la pantalla se mueve debajo, se cierra (como la nativa).
    addEventListener('scroll', e => { if (sel && !caja.contains(e.target)) cerrar() }, true)
    addEventListener('resize', cerrar)
    addEventListener('blur', cerrar)
  }

  return { init, cerrar }
})()

document.addEventListener('DOMContentLoaded', () => Selector.init())
