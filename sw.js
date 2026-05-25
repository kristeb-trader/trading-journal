// Service Worker — NQ Journal PWA
// Estrategia: cache-first para app shell, network-only para APIs externas

const CACHE = 'nqjournal-v1'

const SHELL = [
  './',
  './index.html',
  './css/styles.css',
  './js/config.js',
  './js/db.js',
  './js/calendar.js',
  './js/metrics.js',
  './js/table.js',
  './js/form.js',
  './js/charts.js',
  './js/data.js',
  './js/gallery.js',
  './js/app.js',
  './favicon.svg',
  './manifest.json',
  // CDN — se cachean para funcionamiento offline
  'https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.19.0/dist/tabler-icons.min.css',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.4/dist/chart.umd.min.js',
]

// ── Instalación: cachear el app shell ─────────────────────────────────────
self.addEventListener('install', e => {
  self.skipWaiting()
  e.waitUntil(
    caches.open(CACHE).then(cache => {
      // Cachear todo el shell; si algo falla, continuar igualmente
      return Promise.allSettled(SHELL.map(url => cache.add(url).catch(() => null)))
    })
  )
})

// ── Activación: limpiar caches viejos ─────────────────────────────────────
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
})

// ── Fetch: network-only para APIs, cache-first para app shell ─────────────
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url)

  // Siempre ir a la red para llamadas externas (datos en tiempo real)
  const isExternal =
    url.hostname.includes('supabase.co') ||
    url.hostname.includes('cloudinary.com') ||
    url.hostname.includes('workers.dev') ||
    url.hostname.includes('anthropic.com') ||
    url.hostname.includes('telegram.org')

  if (isExternal) return  // deja que el navegador maneje normalmente

  // POST/PUT/DELETE → siempre red
  if (e.request.method !== 'GET') return

  // App shell y CDN: cache-first, actualizar en background
  e.respondWith(
    caches.match(e.request).then(cached => {
      const networkFetch = fetch(e.request)
        .then(response => {
          if (response && response.ok) {
            const clone = response.clone()
            caches.open(CACHE).then(cache => cache.put(e.request, clone))
          }
          return response
        })
        .catch(() => null)

      return cached || networkFetch
    })
  )
})
