export default {
  async fetch(request, env) {

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, x-api-key, anthropic-version, X-Dashboard-Token',
        }
      })
    }

    if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 })

    // Validar secret
    const token = request.headers.get('X-Dashboard-Token')
    if (!token || token !== env.DASHBOARD_SECRET) {
      return new Response('Unauthorized', { status: 403 })
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
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
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
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
  })
}
