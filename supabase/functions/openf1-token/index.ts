import { serve } from 'https://deno.land/x/sift@0.6.0/mod.ts'

const OPENF1_TOKEN_URL = 'https://api.openf1.org/token'

serve(async (req: Request) => {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, content-type',
      },
    })
  }

  const username = Deno.env.get('OPENF1_USERNAME')
  const password = Deno.env.get('OPENF1_PASSWORD')

  if (!username || !password) {
    return new Response(JSON.stringify({ error: 'OpenF1 credentials not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }

  try {
    const params = new URLSearchParams()
    params.append('username', username)
    params.append('password', password)

    const res = await fetch(OPENF1_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params,
    })

    if (!res.ok) {
      const text = await res.text()
      return new Response(JSON.stringify({ error: `OpenF1 auth failed: ${res.status}`, detail: text }), {
        status: res.status,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }

    const data = await res.json()
    // Return token to client — they use it as Bearer for direct OpenF1 REST calls
    return new Response(JSON.stringify({
      access_token: data.access_token,
      expires_in: data.expires_in ?? '3600',
      token_type: data.token_type ?? 'bearer',
    }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }
})
