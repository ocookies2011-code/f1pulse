// Vercel Edge Function - proxies all OpenF1 API calls
// Prevents ad blockers from blocking direct api.openf1.org requests
// Auth is handled server-side so credentials never leave the server

export const config = { runtime: 'edge' }

const OPENF1_BASE = 'https://api.openf1.org/v1'

export default async function handler(req) {
  const { pathname, search } = new URL(req.url)
  
  // Strip /api/openf1 prefix to get the actual endpoint
  // e.g. /api/openf1/sessions?year=2026 -> /sessions?year=2026
  const endpoint = pathname.replace(/^\/api\/openf1/, '') || '/'
  const targetUrl = `${OPENF1_BASE}${endpoint}${search}`

  // Get auth token server-side
  let authHeader = null
  try {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
    const supabaseAnon = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
    if (supabaseUrl && supabaseAnon) {
      const tr = await fetch(`${supabaseUrl}/functions/v1/openf1-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${supabaseAnon}` },
      })
      if (tr.ok) {
        const td = await tr.json()
        if (td.access_token) authHeader = `Bearer ${td.access_token}`
      }
    }
  } catch {}

  try {
    const r = await fetch(targetUrl, {
      headers: {
        Accept: 'application/json',
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      signal: AbortSignal.timeout(20000),
    })

    const body = await r.text()

    return new Response(body, {
      status: 200, // Always 200 so client code doesn't have to handle errors
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, s-maxage=5, stale-while-revalidate=10',
      },
    })
  } catch (e) {
    return new Response('[]', {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }
}
