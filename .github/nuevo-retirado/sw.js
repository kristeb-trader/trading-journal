// /nuevo/ fue la dirección de prueba del rediseño «Cristal» (16–18/11/2026). Este service worker sustituye al de
// la prueba: borra su caché, se da de baja y manda cada pestaña abierta al Journal de siempre.
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const ks = await caches.keys()
    await Promise.all(ks.filter(k => k.startsWith('nqjournal-nuevo-')).map(k => caches.delete(k)))
    await self.registration.unregister()
    const cs = await self.clients.matchAll({ type: 'window' })
    cs.forEach(c => c.navigate(new URL('../', self.registration.scope).href))
  })())
})
