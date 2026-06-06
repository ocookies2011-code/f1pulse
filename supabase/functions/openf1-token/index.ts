const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const username = Deno.env.get('OPENF1_USERNAME')
  const password = Deno.env.get('OPENF1_PASSWORD')

  if (!username || !password) {
    return new Response(
      JSON.stringify({ error: 'OpenF1 credentials not configured', username_set: !!username, password_set: !!password }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    )
  }

  try {
    const params = new URLSearchParams()
    params.append('username', username)
    params.append('password', password)

    const res = await fetch('https://api.openf1.org/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params,
    })

    if (!res.ok) {
      const text = await res.text()
      return new Response(
        JSON.stringify({ error: `OpenF1 auth failed: ${res.status}`, detail: text }),
        { status: res.status, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    }

    const data = await res.json()
    if (!data.access_token) {
      return new Response(
        JSON.stringify({ error: 'No access_token in OpenF1 response', raw: data }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    }

    return new Response(
      JSON.stringify({
        access_token: data.access_token,
        expires_in: data.expires_in ?? '3600',
        token_type: data.token_type ?? 'bearer',
      }),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    )
  } catch (e) {
    return new Response(
      JSON.stringify({ error: String(e) }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    )
  }
})
