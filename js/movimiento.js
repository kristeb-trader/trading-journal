// ── Movimiento ─────────────────────────────────────────────────────────────
// Rediseño «Cristal» (docs/disenos/2026-11-13-rediseno-cristal.md, §2b). La capa de movimiento de toda la app,
// sin tocar cada pantalla: vale para lo que ya existe y para lo que se pinte después.
//   · Entrada: cada tarjeta entra (sube y aparece) cuando llega a la pantalla, escalonada; las casillas del
//     calendario, en cascada. Lo que se vuelve a pintar (cambio de mes, filtros) entra otra vez.
//   · Cifras: los números grandes cuentan desde cero hasta su valor.
//   · Luz: en escritorio, un foco suave sigue al cursor por la tarjeta, y las tarjetas de cifras se inclinan hacia él.
// Solo se anima posición y opacidad (fluido en el celular). Con «reducir movimiento» del sistema, nada se mueve.
const Movimiento = (() => {
  const quieto = matchMedia('(prefers-reduced-motion: reduce)').matches
  const fino = matchMedia('(hover: hover) and (pointer: fine)').matches

  const TARJETAS = [
    '.metric-card', '.an-kpi', '.an-card', '.card', '.otros-card', '.annual-table-card', '.form-card',
    '.catalog-card', '.bt-card', '.bt-kpi', '.ch-card', '.ch-kpi', '.expd-card', '.expd-kpi', '.hub-card',
    '.hub-curva-card', '.ax-plan-card', '.ax-plan-kpi', '.axm-card', '.ajustes-card', '.phase-card', '.dd-panel',
  ].join(',')
  const CASILLAS = '.cal-cell'
  const CIFRAS = '.metric-value, .an-kpi-value, .otros-card-n'
  const INCLINAN = '.metric-card, .an-kpi, .otros-card, .hub-card, .ch-kpi, .bt-kpi'

  // ── Entrada ──
  let lote = 0, loteT = null
  const io = new IntersectionObserver(entradas => {
    entradas.forEach(e => {
      if (!e.isIntersecting) return
      const el = e.target
      const paso = el.matches(CASILLAS) ? 14 : 70
      el.style.setProperty('--mv-d', `${Math.min(lote++ * paso, 560)}ms`)
      el.classList.add('mv-vis')
      io.unobserve(el)
    })
    clearTimeout(loteT); loteT = setTimeout(() => { lote = 0 }, 120)
  }, { rootMargin: '0px 0px -4% 0px' })

  const preparar = raiz => {
    const els = []
    if (raiz.matches?.(TARJETAS) || raiz.matches?.(CASILLAS)) els.push(raiz)
    raiz.querySelectorAll?.(`${TARJETAS},${CASILLAS}`).forEach(el => els.push(el))
    els.forEach(el => {
      if (el.closest('.modal, .ld, .vs-hoja')) return    // lo que va en ventanas ya tiene su propia entrada
      el.classList.remove('mv-vis'); el.classList.add('mv-in'); io.observe(el)
    })
    raiz.querySelectorAll?.(CIFRAS).forEach(contar)
    if (raiz.matches?.(CIFRAS)) contar(raiz)
  }

  // ── Cifras que cuentan ──
  // Formato del Journal: miles con punto, decimales con coma, signo y $ o % alrededor ("+$1.252", "74%", "2,46").
  const FORMA = /^([+−-]?\s?\$?)(\d{1,3}(?:\.\d{3})*|\d+)(,\d+)?(\s?%?)$/
  const contar = el => {
    if (el.children.length || el.dataset.mvContado === el.textContent) return
    const txt = el.textContent.trim(), m = txt.match(FORMA)
    if (!m) return
    const [, pre, ent, dec = '', suf] = m
    const fin = parseFloat(ent.replace(/\./g, '') + (dec ? '.' + dec.slice(1) : ''))
    if (!(fin > 0)) return
    const nd = dec ? dec.length - 1 : 0
    const fmt = v => {
      const [e, d] = v.toFixed(nd).split('.')
      return pre + e.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + (d ? ',' + d : '') + suf
    }
    el.dataset.mvContado = txt
    const t0 = performance.now(), dura = 1100
    el.textContent = fmt(0)
    const paso = t => {
      const p = Math.min(1, (t - t0) / dura), e = 1 - Math.pow(1 - p, 4)
      el.textContent = p < 1 ? fmt(fin * e) : txt
      if (p < 1) requestAnimationFrame(paso)
    }
    requestAnimationFrame(paso)
  }

  // ── Luz e inclinación ──
  let pm = null
  const luz = e => {
    if (pm) return
    pm = requestAnimationFrame(() => {
      pm = null
      const c = e.target.closest?.(TARJETAS)
      if (!c) return
      const r = c.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top
      c.style.setProperty('--mx', `${x}px`); c.style.setProperty('--my', `${y}px`)
      if (c.matches(INCLINAN)) {
        c.style.setProperty('--ry', `${((x / r.width - 0.5) * 7).toFixed(2)}deg`)
        c.style.setProperty('--rx', `${((0.5 - y / r.height) * 7).toFixed(2)}deg`)
      }
    })
  }
  const suelta = e => {
    const c = e.target.closest?.(INCLINAN)
    if (c && !c.contains(e.relatedTarget)) { c.style.removeProperty('--rx'); c.style.removeProperty('--ry') }
  }

  function init() {
    const area = document.querySelector('.content-area')
    if (!area || quieto) return
    document.documentElement.classList.add('mv')
    preparar(area)
    // Lo que se pinta después (cambio de mes, filtros, pantallas que cargan al entrar) también entra.
    new MutationObserver(cambios => {
      cambios.forEach(c => c.addedNodes.forEach(n => { if (n.nodeType === 1) preparar(n) }))
    }).observe(area, { childList: true, subtree: true })
    if (fino) {
      document.addEventListener('pointermove', luz, { passive: true })
      document.addEventListener('pointerout', suelta)
    }
    // Exportar a PDF o imagen captura toda la pantalla: lo que aún no ha entrado tiene que estar visible.
    document.addEventListener('click', e => {
      if (e.target.closest('#analysisExportPdf, #analysisExportImg')) {
        document.querySelectorAll('.mv-in').forEach(el => { el.classList.add('mv-vis'); io.unobserve(el) })
      }
    }, true)
  }

  return { init }
})()

document.addEventListener('DOMContentLoaded', () => Movimiento.init())
