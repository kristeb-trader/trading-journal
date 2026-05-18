// Gallery — miniaturas de imágenes por día
const Gallery = (() => {
  let allImages = []     // [{ sesion_date, imagen_url }]
  let activeMonth = null // 'YYYY-MM' | null = todas

  const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
    'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

  function thumbUrl(url) {
    return url.replace('/upload/', '/upload/c_fill,w_280,h_180,q_auto,f_auto/')
  }

  function buildMonthNav() {
    const months = [...new Set(allImages.map(i => i.sesion_date.slice(0, 7)))]
      .sort().reverse()
    const list = document.getElementById('monthsList')
    if (!list) return

    list.innerHTML = months.map(m => {
      const [y, mo] = m.split('-')
      const label = `${MONTHS_ES[parseInt(mo) - 1]} ${y}`
      return `<li class="month-nav-item${m === activeMonth ? ' active' : ''}" data-month="${m}">${label}</li>`
    }).join('')

    list.querySelectorAll('.month-nav-item').forEach(item => {
      item.addEventListener('click', () => {
        const clicked = item.dataset.month
        activeMonth = clicked === activeMonth ? null : clicked
        Nav.go('gallery')
        render()
        buildMonthNav()
      })
    })
  }

  function render() {
    const grid = document.getElementById('galleryGrid')
    const title = document.getElementById('galleryTitle')
    if (!grid) return

    const filtered = activeMonth
      ? allImages.filter(i => i.sesion_date.startsWith(activeMonth))
      : allImages

    if (activeMonth) {
      const [y, mo] = activeMonth.split('-')
      title.textContent = `${MONTHS_ES[parseInt(mo) - 1]} ${y}`
    } else {
      title.textContent = 'Todas las imágenes'
    }

    if (filtered.length === 0) {
      grid.innerHTML = `<div class="gallery-empty"><i class="ti ti-photo-off"></i><p>Sin imágenes para este período</p></div>`
      return
    }

    grid.innerHTML = filtered.map(img => `
      <div class="gallery-thumb" data-url="${img.imagen_url}">
        <img src="${thumbUrl(img.imagen_url)}" alt="${img.sesion_date}" loading="lazy">
        <div class="gallery-date">${img.sesion_date}</div>
      </div>`).join('')

    grid.querySelectorAll('.gallery-thumb').forEach(thumb => {
      thumb.addEventListener('click', () => Lightbox.open(thumb.dataset.url))
    })
  }

  async function init() {
    allImages = await DB.getSessionsWithImages()
    buildMonthNav()
    render()
  }

  return { init }
})()
