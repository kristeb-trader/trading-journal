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
          'Access-Control-Allow-Headers': 'Content-Type, x-api-key, anthropic-version, Authorization',
        }
      })
    }

    if (request.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: CORS })

    if (!await usuarioValido(request, env)) {
      return new Response('Sesión no válida: vuelve a iniciar sesión en el Journal', { status: 401, headers: CORS })
    }

    const url = new URL(request.url)

    if (url.pathname === '/api/session') return handleSession(request, env)
    return handleClaude(request)
  }
}

// La puerta del Worker es el MISMO login del Journal (Supabase Auth), no una clave
// aparte. Antes había un `DASHBOARD_SECRET` que Kris tecleaba a mano en ⚙ Ajustes:
// vivía solo en el localStorage, se perdía al borrar los datos del sitio y no era
// recuperable (en Cloudflare es un secret, de los que se escriben y no se leen).
// Ahora el navegador manda el `access_token` de su sesión y aquí se le pregunta a
// Supabase si vale. Borrar el navegador ya solo obliga a iniciar sesión otra vez.
//
// Se valida preguntando y no verificando la firma a mano para no meter el JWT
// secret como tercer secreto del Worker. Cuesta un salto extra a Supabase por
// petición; a este volumen no se nota.
async function usuarioValido(request, env) {
  const auth = request.headers.get('Authorization') || ''
  if (!auth.startsWith('Bearer ')) return false
  try {
    const res = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: env.SUPABASE_SERVICE_KEY, Authorization: auth },
    })
    return res.ok
  } catch {
    return false
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
