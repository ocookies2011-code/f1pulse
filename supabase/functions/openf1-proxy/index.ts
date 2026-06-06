// OpenF1 proxy edge function - caches token server-side, proxies all API calls
// Deploy this via Supabase dashboard: Edge Functions → Deploy

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type, authorization',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

// Server-side token cache in Deno global scope
declare global {
  var _of1Token: string | null
  var _of1TokenExp: number
}
globalThis._of1Token = globalThis._of1Token ?? null
globalThis._of1TokenExp = globalThis._of1TokenExp ?? 0

async function getToken(): Promise<string | null> {
  if (globalThis._of1Token && Date.now() < globalThis._of1TokenExp - 300_000) {
    return globalThis._of1Token
  }
  const username = Deno.env.get('OPENF1_USERNAME')
  const password = Deno.env.get('OPENF1_PASSWORD')
  if (!username || !password) return null
  try {
    const params = new URLSearchParams()
    params.append('username', username)
    params.append('password', password)
    const res = await fetch('https://api.openf1.org/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params,
    })
    if (!res.ok) return null
    const data = await res.json()
    globalThis._of1Token = data.access_token
    globalThis._of1TokenExp = Date.now() + parseInt(data.expires_in ?? '3600') * 1000
    console.log('OpenF1 token refreshed, expires in', data.expires_in, 'seconds')
    return globalThis._of1Token
  } catch { return null }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors })

  const url = new URL(req.url)

  // Proxy: /openf1-proxy/v1/* → https://api.openf1.org/v1/*
  const match = url.pathname.match(/\/openf1-proxy(\/v1\/.*)$/)
  if (!match) {
    return new Response('Use /openf1-proxy/v1/<endpoint>', { status: 400, headers: cors })
  }

  const apiPath = match[1]
  const targetUrl = `https://api.openf1.org${apiPath}${url.search}`

  const token = await getToken()
  const headers: Record<string, string> = {}
  if (token) headers['Authorization'] = `Bearer ${token}`

  try {
    const res = await fetch(targetUrl, { headers, signal: AbortSignal.timeout(12000) })
    const body = await res.text()
    return new Response(body, {
      status: res.status,
      headers: { 'Content-Type': 'application/json', ...cors },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...cors },
    })
  }
})
