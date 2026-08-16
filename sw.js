// Service Worker — Trading Journal PWA
// Estrategia:
//   - app shell (JS/CSS/HTML propios): network-first → siempre frescos, caché de respaldo offline
//   - CDN (tabler, supabase, chart.js): cache-first → no cambian, carga instantánea
//   - APIs externas (supabase, cloudinary, workers.dev...): network-only

const CACHE = 'nqjournal-v6'

// Recursos CDN que no cambian → cache-first
const CDN_SHELL = [
  'https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.19.0/dist/tabler-icons.min.css',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.4/dist/chart.umd.min.js',
]

// Archivos propios del journal → se precachean al instalar y luego network-first.
// ⚠️ Mantener en sincronía con los <script> de index.html: un archivo que falte aquí
// no está disponible en la PRIMERA visita sin conexión (después sí, porque
// network-first va guardando lo que descarga).
const APP_SHELL = [
  './',
  './index.html',
  './css/styles.css',
  // en el mismo orden en que los carga index.html
  './js/config.js',
  './js/db.js',
  './js/account-filter.js',
  './js/calendar.js',
  './js/metrics.js',
  './js/table.js',
  './js/form.js',
  './js/charts.js',
  './js/data.js',
  './js/gallery.js',
  './js/experimentos.js',
  './js/apex.js',
  './js/estrategia.js',
  './js/disciplina.js',
  './js/coach.js',
  './js/fechas.js',
  './js/app.js',
  // recursos del manifest, para que la PWA instalada abra sin red
  './favicon.svg',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
]

// APIs externas → nunca cachear
const NETWORK_ONLY_HOSTS = [
  'supabase.co',
  'cloudinary.com',
  'workers.dev',
  'anthropic.com',
  'telegram.org',
  'api.telegram.org',
]

// ── Instalación: pre-cachear el app shell + el CDN ────────────────────────
// Uno a uno con `allSettled` y no con `addAll`: `addAll` es atómico, así que un
// solo 404 abortaría la instalación entera y dejaría la PWA sin caché.
self.addEventListener('install', e => {
  self.skipWaiting()
  e.waitUntil(
    caches.open(CACHE).then(cache =>
      Promise.allSettled(
        [...APP_SHELL, ...CDN_SHELL].map(url => cache.add(url).catch(() => null))
      )
    )
  )
})

// ── Activación: eliminar cachés viejos y tomar control inmediato ──────────
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

// ── Fetch ─────────────────────────────────────────────────────────────────
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url)

  // 1. APIs externas → siempre red, sin intervención
  if (NETWORK_ONLY_HOSTS.some(h => url.hostname.includes(h))) return

  // 2. Solo interceptar GET
  if (e.request.method !== 'GET') return

  const isCDN = CDN_SHELL.some(u => e.request.url.startsWith(u))

  if (isCDN) {
    // Cache-first para CDN: respuesta instantánea, actualiza en background
    e.respondWith(
      caches.match(e.request).then(cached => {
        const networkFetch = fetch(e.request).then(res => {
          if (res && res.ok) {
            caches.open(CACHE).then(c => c.put(e.request, res.clone()))
          }
          return res
        }).catch(() => null)
        return cached || networkFetch
      })
    )
  } else {
    // Network-first para app shell: siempre intenta red → guarda en caché → fallback a caché si offline
    e.respondWith(
      fetch(e.request)
        .then(res => {
          if (res && res.ok) {
            caches.open(CACHE).then(c => c.put(e.request, res.clone()))
          }
          return res
        })
        .catch(() => caches.match(e.request))
    )
  }
})
