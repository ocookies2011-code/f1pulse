const BASE = 'https://api.openf1.org/v1'

// Token cache (in-memory, per browser session)
let cachedToken = null
let tokenExpiry = 0

// Fetch OAuth2 token via our Supabase Edge Function proxy
// (credentials never leave the backend)
async function getToken() {
  if (cachedToken && Date.now() < tokenExpiry - 60000) {
    return cachedToken
  }
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const supabaseAnon = import.meta.env.VITE_SUPABASE_ANON_KEY
  const res = await fetch(`${supabaseUrl}/functions/v1/openf1-token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseAnon}`,
    },
  })
  if (!res.ok) return null
  const { access_token, expires_in } = await res.json()
  cachedToken = access_token
  tokenExpiry = Date.now() + (parseInt(expires_in) * 1000)
  return access_token
}

async function authHeaders() {
  const token = await getToken()
  if (!token) return {}
  return { Authorization: `Bearer ${token}` }
}

async function get(endpoint, params = {}) {
  const url = new URL(`${BASE}${endpoint}`)
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) url.searchParams.set(k, v)
  })
  const headers = await authHeaders()
  const res = await fetch(url.toString(), { headers })
  if (!res.ok) throw new Error(`OpenF1 ${res.status}: ${res.statusText}`)
  return res.json()
}

// ── Sessions ─────────────────────────────────────────
export async function getLatestSession() {
  const data = await get('/sessions', { session_key: 'latest' })
  return data[0] ?? null
}

export async function getSessions(params = {}) {
  return get('/sessions', params)
}

// ── Drivers ───────────────────────────────────────────
export async function getDrivers(session_key = 'latest') {
  return get('/drivers', { session_key })
}

// ── Positions ─────────────────────────────────────────
export async function getPositions(session_key = 'latest') {
  return get('/position', { session_key })
}

// ── Laps ──────────────────────────────────────────────
export async function getLaps(session_key = 'latest', driver_number) {
  return get('/laps', { session_key, driver_number })
}

export async function getLatestLaps(session_key = 'latest') {
  return get('/laps', { session_key })
}

// ── Stints / Tyres ────────────────────────────────────
export async function getStints(session_key = 'latest') {
  return get('/stints', { session_key })
}

// ── Pit stops ─────────────────────────────────────────
export async function getPitStops(session_key = 'latest') {
  return get('/pit', { session_key })
}

// ── Weather ───────────────────────────────────────────
export async function getWeather(session_key = 'latest') {
  const data = await get('/weather', { session_key })
  return data[data.length - 1] ?? null
}

// ── Race control ──────────────────────────────────────
export async function getRaceControl(session_key = 'latest') {
  return get('/race_control', { session_key })
}

// ── Team radio ────────────────────────────────────────
export async function getTeamRadio(session_key = 'latest') {
  return get('/team_radio', { session_key })
}

// ── Car telemetry ─────────────────────────────────────
export async function getCarData(session_key, driver_number) {
  return get('/car_data', { session_key, driver_number })
}

// ── Intervals ─────────────────────────────────────────
export async function getIntervals(session_key = 'latest') {
  return get('/intervals', { session_key })
}

// ── Meetings ──────────────────────────────────────────
export async function getMeetings(year) {
  return get('/meetings', { year: year ?? new Date().getFullYear() })
}

// ── Championship standings (from API) ─────────────────
export async function getChampionshipDrivers(session_key = 'latest') {
  return get('/championship_drivers', { session_key })
}

export async function getChampionshipTeams(session_key = 'latest') {
  return get('/championship_teams', { session_key })
}

// ── Session results ───────────────────────────────────
export async function getSessionResult(session_key) {
  return get('/session_result', { session_key })
}

// ── Build live standings from positions + laps + stints ──
export async function buildLiveStandings(session_key = 'latest') {
  const [positions, drivers, stints, intervals, laps] = await Promise.all([
    getPositions(session_key),
    getDrivers(session_key),
    getStints(session_key),
    getIntervals(session_key).catch(() => []),
    getLatestLaps(session_key),
  ])

  const posMap = {}
  for (const p of positions) {
    if (!posMap[p.driver_number] || p.date > posMap[p.driver_number].date) {
      posMap[p.driver_number] = p
    }
  }

  const stintMap = {}
  for (const s of stints) {
    if (!stintMap[s.driver_number] || s.stint_number > stintMap[s.driver_number].stint_number) {
      stintMap[s.driver_number] = s
    }
  }

  const lapMap = {}
  for (const l of laps) {
    if (!lapMap[l.driver_number]) lapMap[l.driver_number] = []
    lapMap[l.driver_number].push(l)
  }

  const intMap = {}
  for (const i of intervals) intMap[i.driver_number] = i

  const drvMap = {}
  for (const d of drivers) drvMap[d.driver_number] = d

  return Object.values(posMap)
    .sort((a, b) => a.position - b.position)
    .map(p => {
      const drv = drvMap[p.driver_number] ?? {}
      const stint = stintMap[p.driver_number]
      const driverLaps = lapMap[p.driver_number] ?? []
      const lastLap = driverLaps[driverLaps.length - 1]
      const bestLap = driverLaps.reduce((best, l) => {
        if (!l.lap_duration) return best
        if (!best || l.lap_duration < best.lap_duration) return l
        return best
      }, null)
      const interval = intMap[p.driver_number]

      return {
        position: p.position,
        driver_number: p.driver_number,
        name_acronym: drv.name_acronym ?? `#${p.driver_number}`,
        full_name: drv.full_name ?? '',
        team_name: drv.team_name ?? '',
        team_colour: drv.team_colour ?? '555555',
        headshot_url: drv.headshot_url ?? null,
        tyre: stint?.compound ?? null,
        tyre_age: stint?.tyre_age_at_start != null && lastLap?.lap_number != null
          ? (lastLap.lap_number - (stint.lap_start ?? 0) + (stint.tyre_age_at_start ?? 0))
          : null,
        last_lap: lastLap?.lap_duration ?? null,
        best_lap: bestLap?.lap_duration ?? null,
        lap_number: lastLap?.lap_number ?? null,
        gap_to_leader: interval?.gap_to_leader ?? null,
        interval: interval?.interval ?? null,
        is_pit_out_lap: lastLap?.is_pit_out_lap ?? false,
        sectors: lastLap ? [
          lastLap.duration_sector_1,
          lastLap.duration_sector_2,
          lastLap.duration_sector_3,
        ] : [],
        segments: lastLap ? [
          lastLap.segments_sector_1 ?? [],
          lastLap.segments_sector_2 ?? [],
          lastLap.segments_sector_3 ?? [],
        ] : [],
      }
    })
}

export function formatLapTime(seconds) {
  if (!seconds) return '--:--.---'
  const mins = Math.floor(seconds / 60)
  const secs = (seconds % 60).toFixed(3).padStart(6, '0')
  return `${mins}:${secs}`
}

export function formatGap(gap) {
  if (!gap && gap !== 0) return '--'
  if (typeof gap === 'string') return gap
  return `+${gap.toFixed(3)}`
}

// ── WebSocket live stream (premium) ──────────────────
// Returns a cleanup function
export function subscribeToLiveData(topics, onMessage) {
  // Lazily import mqtt (browser build via CDN or bundled)
  const wsUrl = 'wss://mqtt.openf1.org:8084/mqtt'
  let client = null

  getToken().then(token => {
    if (!token) return
    // Use mqtt.js if available (added via CDN in index.html for premium)
    if (typeof window.mqtt === 'undefined') return
    client = window.mqtt.connect(wsUrl, {
      username: 'f1pulse',
      password: token,
    })
    client.on('connect', () => {
      topics.forEach(t => client.subscribe(t))
    })
    client.on('message', (topic, message) => {
      try {
        onMessage(topic, JSON.parse(message.toString()))
      } catch {}
    })
  })

  return () => { if (client) client.end() }
}
