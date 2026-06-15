// Gallery — miniaturas de imágenes por día
const Gallery = (() => {
  let allImages     = []  // [{ sesion_date, imagen_url }]
  let tradesByDate  = {}  // date → [trades]
  let errorDates    = {}  // date → true
  let activeMonth   = null

  const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
    'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
  const DAYS_ES = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']

  function thumbUrl(url) {
    return url.replace('/upload/', '/upload/c_fill,w_280,h_180,q_auto,f_auto/')
  }

  // Lunes de la semana de una fecha dada
  function mondayOf(dateStr) {
    const d = new Date(dateStr + 'T12:00:00')
    const dow = d.getDay() || 7
    d.setDate(d.getDate() - (dow - 1))
    return d.toISOString().slice(0, 10)
  }

  function weekLabel(mondayStr) {
    const mon = new Date(mondayStr + 'T12:00:00')
    const fri = new Date(mon); fri.setDate(mon.getDate() + 4)
    const fmtDay = d => `${d.getDate()} ${MONTHS_ES[d.getMonth()]}`
    return `${DAYS_ES[mon.getDay()]} ${fmtDay(mon)} — ${DAYS_ES[fri.getDay()]} ${fmtDay(fri)} ${fri.getFullYear()}`
  }

  function dayResult(date) {
    const trades = tradesByDate[date] || []
    if (!trades.length) return 'empty'
    const targets = trades.filter(t => t.resultado === 'target').length
    const stops   = trades.filter(t => t.resultado === 'stop').length
    if (targets > 0 && stops === 0) return 'target'
    if (stops > 0 && targets === 0) return 'stop'
    if (targets > 0 && stops > 0)   return 'mixed'
    return 'other'
  }

  function dayDirection(date) {
    const trades = tradesByDate[date] || []
    if (!trades.length) return null
    const longs  = trades.filter(t => t.market_pos?.toLowerCase() === 'long').length
    const shorts = trades.filter(t => t.market_pos?.toLowerCase() === 'short').length
    if (longs > 0 && shorts === 0)      return 'long'
    if (shorts > 0 && longs === 0)      return 'short'
    if (longs > 0 && shorts > 0)        return 'mixed'
    return null
  }

  function buildMonthsBar() {
    const months = [...new Set(allImages.map(i => i.sesion_date.slice(0, 7)))].sort()
    const bar = document.getElementById('galleryMonthsBar')
    if (!bar) return
    bar.innerHTML =
      `<button class="gallery-month-btn${!activeMonth ? ' active' : ''}" data-month="">Todas</button>` +
      months.map(m => {
        const [y, mo] = m.split('-')
        return `<button class="gallery-month-btn${m === activeMonth ? ' active' : ''}" data-month="${m}">${MONTHS_ES[parseInt(mo)-1]} ${y}</button>`
      }).join('')
    bar.querySelectorAll('.gallery-month-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        activeMonth = btn.dataset.month || null
        render(); buildMonthsBar()
      })
    })
  }

  function thumbCard(img) {
    const result = dayResult(img.sesion_date)
    const dir    = dayDirection(img.sesion_date)
    const hasErr = errorDates[img.sesion_date]

    const dirIcon = dir === 'long'
      ? `<span class="gal-dir long"  title="Long"><i class="ti ti-trending-up"></i></span>`
      : dir === 'short'
        ? `<span class="gal-dir short" title="Short"><i class="ti ti-trending-down"></i></span>`
        : dir === 'mixed'
          ? `<span class="gal-dir mixed" title="Long + Short"><i class="ti ti-arrows-split-2"></i></span>`
          : ''

    const errIcon = hasErr
      ? `<span class="gal-err" title="Errores registrados"><i class="ti ti-alert-triangle"></i></span>`
      : ''

    return `
      <div class="gallery-thumb result-${result}" data-url="${img.imagen_url}">
        <img src="${thumbUrl(img.imagen_url)}" alt="${img.sesion_date}" loading="lazy">
        <div class="gallery-footer">
          <div class="gal-footer-left">${dirIcon}</div>
          <div class="gal-footer-date">${img.sesion_date}</div>
          <div class="gal-footer-right">${errIcon}</div>
        </div>
      </div>`
  }

  function emptyCard(dateStr) {
    const today    = new Date().toISOString().slice(0, 10)
    const isFuture = dateStr > today
    const icon     = isFuture ? 'ti-clock' : 'ti-photo-off'
    return `
      <div class="gallery-thumb gallery-thumb-empty${isFuture ? ' gallery-thumb-future' : ''}">
        <div class="gallery-thumb-placeholder">
          <i class="ti ${icon}"></i>
        </div>
        <div class="gallery-footer">
          <div class="gal-footer-left"></div>
          <div class="gal-footer-date">${dateStr}</div>
          <div class="gal-footer-right"></div>
        </div>
      </div>`
  }

  // Genera todos los días de lunes a viernes entre dos fechas (ISO)
  function weekdaysBetween(startStr, endStr) {
    const result = []
    const cur = new Date(startStr + 'T12:00:00')
    const end = new Date(endStr  + 'T12:00:00')
    while (cur <= end) {
      const dow = cur.getDay()
      if (dow >= 1 && dow <= 5) result.push(cur.toISOString().slice(0, 10))
      cur.setDate(cur.getDate() + 1)
    }
    return result
  }

  function render() {
    const grid  = document.getElementById('galleryGrid')
    const title = document.getElementById('galleryTitle')
    if (!grid) return

    const today    = new Date().toISOString().slice(0, 10)
    const filtered = activeMonth
      ? allImages.filter(i => i.sesion_date.startsWith(activeMonth))
      : allImages

    if (activeMonth) {
      const [y, mo] = activeMonth.split('-')
      title.textContent = `${MONTHS_ES[parseInt(mo)-1]} ${y}`
    } else {
      title.textContent = 'Todas las imágenes'
    }

    // Mapa de imágenes por fecha
    const imageByDate = {}
    filtered.forEach(img => { imageByDate[img.sesion_date] = img })

    let weekMap = {}  // monday → [dateStr, ...]

    if (activeMonth) {
      // Mes seleccionado: mostrar todos los días hábiles del mes (hasta hoy)
      const [y, mo] = activeMonth.split('-').map(Number)
      const monthStart = `${y}-${String(mo).padStart(2, '0')}-01`
      const lastDay    = new Date(y, mo, 0).getDate()
      const monthEnd   = `${y}-${String(mo).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
      const rangeEnd   = monthEnd < today ? monthEnd : today

      const days = weekdaysBetween(mondayOf(monthStart), rangeEnd)
      days.forEach(d => {
        const mon = mondayOf(d)
        if (!weekMap[mon]) weekMap[mon] = []
        weekMap[mon].push(d)
      })
    } else {
      // Vista "todas": solo semanas que tienen al menos una imagen;
      // se rellenan los huecos Mon–Vie de esas semanas
      if (!filtered.length) {
        grid.innerHTML = `<div class="gallery-empty"><i class="ti ti-photo-off"></i><p>Sin imágenes para este período</p></div>`
        return
      }
      const imageWeeks = [...new Set(filtered.map(img => mondayOf(img.sesion_date)))]
      imageWeeks.forEach(monday => {
        const fri = new Date(monday + 'T12:00:00')
        fri.setDate(fri.getDate() + 4)
        const friStr = fri.toISOString().slice(0, 10)
        weekMap[monday] = weekdaysBetween(monday, friStr < today ? friStr : today)
      })
    }

    const weeks = Object.keys(weekMap).sort()

    if (!weeks.length) {
      grid.innerHTML = `<div class="gallery-empty"><i class="ti ti-photo-off"></i><p>Sin imágenes para este período</p></div>`
      return
    }

    // Lista ordenada de URLs (solo imágenes reales) para navegación en Lightbox
    const allUrls = filtered.map(img => img.imagen_url)

    grid.innerHTML = weeks.map(monday => `
      <div class="gallery-week">
        <div class="gallery-week-header">${weekLabel(monday)}</div>
        <div class="gallery-week-row">
          ${weekMap[monday].map(d => imageByDate[d] ? thumbCard(imageByDate[d]) : emptyCard(d)).join('')}
        </div>
      </div>`).join('')

    grid.querySelectorAll('.gallery-thumb:not(.gallery-thumb-empty)').forEach(thumb => {
      thumb.addEventListener('click', () => {
        const url = thumb.dataset.url
        const idx = allUrls.indexOf(url)
        Lightbox.open(url, allUrls, idx >= 0 ? idx : 0)
      })
    })
  }

  async function init() {
    const [images, trades, casuisticas] = await Promise.all([
      DB.getSessionsWithImages(),
      DB.getTrades(),
      DB.getAllCasuisticas(),
    ])

    allImages = images

    tradesByDate = {}
    trades.forEach(t => {
      const d = t.trade_date
      if (!d) return
      if (!tradesByDate[d]) tradesByDate[d] = []
      tradesByDate[d].push(t)
    })

    errorDates = {}
    casuisticas.forEach(c => { errorDates[c.sesion_date] = true })

    // Por defecto, mes actual si tiene imágenes; si no, queda en "Todas"
    const now = new Date()
    const curMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    if (allImages.some(i => i.sesion_date.slice(0, 7) === curMonth)) activeMonth = curMonth

    buildMonthsBar()
    render()
  }

  return { init }
})()
