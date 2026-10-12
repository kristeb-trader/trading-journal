// ⚠️ TODA respuesta tiene que llevar `Access-Control-Allow-Origin`, también las de
// error. Sin esa cabecera el navegador descarta la respuesta antes de que llegue al
// JS y `fetch` revienta con un `TypeError: Failed to fetch` opaco: el 403 nunca se
// ve. Pasó el 12/10/2026 — Kris borró los datos del sitio, se perdió el
// `dashboard_secret` del localStorage y «Guardar sesión» decía «Failed to fetch»
// en vez de «no autorizado».
const CORS = { 'Access-Control-Allow-Origin': '*' }

export default {
  async fetch(request, env) {

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          ...CORS,
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, x-api-key, anthropic-version, X-Dashboard-Token',
        }
      })
    }

    if (request.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: CORS })

    // Validar secret
    const token = request.headers.get('X-Dashboard-Token')
    if (!token || token !== env.DASHBOARD_SECRET) {
      return new Response('Unauthorized', { status: 403, headers: CORS })
    }

    const url = new URL(request.url)

    if (url.pathname === '/api/session') return handleSession(request, env)
    return handleClaude(request)
  }
}

async function handleClaude(request) {
  const body = await request.json()
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': request.headers.get('x-api-key'),
      'anthropic-version': request.headers.get('anthropic-version') || '2023-06-01',
    },
    body: JSON.stringify(body)
  })
  return new Response(await res.text(), {
    status: res.status,
    headers: { 'Content-Type': 'application/json', ...CORS }
  })
}

async function handleSession(request, env) {
  const payload = await request.json()
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/sesiones?on_conflict=sesion_date`, {
    method: 'POST',
    headers: {
      apikey:          env.SUPABASE_SERVICE_KEY,
      Authorization:   `Bearer ${env.SUPABASE_SERVICE_KEY}`,
      'Content-Type':  'application/json',
      Prefer:          'resolution=merge-duplicates',
    },
    body: JSON.stringify(payload)
  })
  return new Response(await res.text() || '{}', {
    status: res.status,
    headers: { 'Content-Type': 'application/json', ...CORS }
  })
}
