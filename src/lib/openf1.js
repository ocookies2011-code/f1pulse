// Use our Vercel proxy to avoid ad blocker interference with api.openf1.org
// Falls back to direct if proxy fails
const PROXY_BASE = '/api/openf1'
const DIRECT_BASE = 'https://api.openf1.org/v1'
const BASE = PROXY_BASE

// ── Auth token ────────────────────────────────────────────────────────────────
let _token = null
let _tokenExp = 0
let _tokenPromise = null

async function getToken() {
  if (_token && Date.now() < _tokenExp - 30000) return _token
  if (_tokenPromise) return _tokenPromise
  _tokenPromise = _fetchToken().finally(() => { _tokenPromise = null })
  return _tokenPromise
}

async function _fetchToken() {
  try {
    // Try Supabase edge function proxy first
    const url  = import.meta.env.VITE_SUPABASE_URL
    const anon = import.meta.env.VITE_SUPABASE_ANON_KEY
    if (url && anon) {
      const r = await fetch(`${url}/functions/v1/openf1-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${anon}` },
        signal: AbortSignal.timeout(8000),
      })
      if (r.ok) {
        const d = await r.json()
        if (d.access_token) {
          _token = d.access_token
          _tokenExp = Date.now() + (parseInt(d.expires_in ?? '3600') * 1000)
          return _token
        }
      }
    }
  } catch {}

  try {
    // Direct client-side auth fallback
    const user = import.meta.env.VITE_OPENF1_USERNAME
    const pass = import.meta.env.VITE_OPENF1_PASSWORD
    if (user && pass) {
      const params = new URLSearchParams({ username: user, password: pass })
      const r = await fetch('https://api.openf1.org/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params,
        signal: AbortSignal.timeout(8000),
      })
      if (r.ok) {
        const d = await r.json()
        if (d.access_token) {
          _token = d.access_token
          _tokenExp = Date.now() + (parseInt(d.expires_in ?? '3600') * 1000)
          return _token
        }
      }
    }
  } catch {}

  return null
}

// ── Simple fetch with retry ───────────────────────────────────────────────────
const _cache = new Map()

async function apiFetch(endpoint, params = {}, ttlMs = 8000) {
  const qs = Object.entries(params)
    .filter(([, v]) => v != null && v !== '')
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join('&')
  const path = `${endpoint}${qs ? '?' + qs : ''}`
  const key = path

  // Cache hit
  const hit = _cache.get(key)
  if (hit && Date.now() < hit.exp) return hit.data

  // Try proxy first (avoids ad blocker blocking api.openf1.org)
  const urls = [
    `${PROXY_BASE}${path}`,
    `${DIRECT_BASE}${path}`,
  ]

  for (const url of urls) {
    try {
      const headers = url.startsWith(PROXY_BASE) ? {} : (await getToken() ? { Authorization: `Bearer ${await getToken()}` } : {})
      const r = await fetch(url, { headers, signal: AbortSignal.timeout(15000) })
      if (!r.ok) continue
      const data = await r.json()
      if (Array.isArray(data) || (data && typeof data === 'object')) {
        _cache.set(key, { data, exp: Date.now() + ttlMs })
        return data
      }
    } catch {}
  }

  // Return stale cache if all fail
  return hit?.data ?? []
}

// ── Endpoints ─────────────────────────────────────────────────────────────────
export const getMeetings    = (year = 2026)     => apiFetch('/meetings',     { year }, 300_000)
export const getSessions    = (p = {})          => apiFetch('/sessions',     p,        60_000)
export const getDrivers     = (sk = 'latest')   => apiFetch('/drivers',      { session_key: sk }, 300_000)
export const getPositions   = (sk = 'latest')   => apiFetch('/position',     { session_key: sk }, 6_000)
export const getAllLaps      = (sk = 'latest')   => apiFetch('/laps',         { session_key: sk }, 10_000)
export const getLaps        = (sk, dn)          => apiFetch('/laps',         { session_key: sk, driver_number: dn }, 10_000)
export const getStints      = (sk = 'latest')   => apiFetch('/stints',       { session_key: sk }, 15_000)
export const getPitStops    = (sk = 'latest')   => apiFetch('/pit',          { session_key: sk }, 15_000)
export const getIntervals   = (sk = 'latest')   => apiFetch('/intervals',    { session_key: sk }, 6_000)
export const getTeamRadio   = (sk = 'latest')   => apiFetch('/team_radio',   { session_key: sk }, 15_000)
export const getCarData     = (sk, dn)          => apiFetch('/car_data',     { session_key: sk, driver_number: dn }, 5_000)
export const getLocation    = (sk, dn)          => apiFetch('/location',     { session_key: sk, driver_number: dn }, 5_000)
export const getStartingGrid      = (sk)        => apiFetch('/starting_grid',     { session_key: sk }, 300_000)
export const getSessionResult     = (sk)        => apiFetch('/session_result',    { session_key: sk }, 60_000)
export const getChampionshipDrivers = (sk)      => apiFetch('/championship_drivers', { session_key: sk }, 60_000)
export const getChampionshipTeams   = (sk)      => apiFetch('/championship_teams',   { session_key: sk }, 60_000)

export async function getWeather(sk = 'latest') {
  const d = await apiFetch('/weather', { session_key: sk }, 20_000)
  return Array.isArray(d) && d.length ? d[d.length - 1] : null
}

export async function getRaceControl(sk = 'latest') {
  const d = await apiFetch('/race_control', { session_key: sk }, 10_000)
  return Array.isArray(d) ? d : []
}

// ── Session helpers ───────────────────────────────────────────────────────────
export async function getLatestSession() {
  try {
    // Try authenticated latest
    const token = await getToken()
    if (token) {
      const d = await apiFetch('/sessions', { session_key: 'latest' }, 30_000)
      if (Array.isArray(d) && d.length) return d[d.length - 1]
    }
    // Fallback: find most recent started session from public year API
    const all = await getSessions({ year: 2026 })
    if (!Array.isArray(all) || !all.length) return null
    const now = Date.now()
    const started = all.filter(s => new Date(s.date_start).getTime() <= now)
      .sort((a, b) => new Date(b.date_start) - new Date(a.date_start))
    return started[0] ?? all[all.length - 1]
  } catch { return null }
}

export async function getLatestRaceSession(year = 2026) {
  try {
    const all = await getSessions({ year, session_name: 'Race' })
    const now = Date.now()
    return all.filter(s => new Date(s.date_start).getTime() < now)
      .sort((a, b) => new Date(b.date_start) - new Date(a.date_start))[0] ?? null
  } catch { return null }
}

export async function getBestStandingsSession(year = 2026) {
  try {
    const all = await getSessions({ year })
    if (!Array.isArray(all) || !all.length) return null
    const now = Date.now()
    const done = all.filter(s => new Date(s.date_end ?? s.date_start).getTime() < now)
      .sort((a, b) => new Date(b.date_end ?? b.date_start) - new Date(a.date_end ?? a.date_start))
    return done.find(s => s.session_name === 'Race')
        ?? done.find(s => s.session_name === 'Qualifying')
        ?? done.find(s => s.session_name === 'Practice 3')
        ?? done[0]
        ?? null
  } catch { return null }
}

export function flagUrl(code, size = '32x24') {
  if (!code) return null
  return `https://flagcdn.com/${size}/${code.toLowerCase()}.png`
}

// ── Formatters ────────────────────────────────────────────────────────────────
export function fmt(s) {
  if (!s) return '--:--.---'
  const m = Math.floor(s / 60)
  const r = (s % 60).toFixed(3).padStart(6, '0')
  return `${m}:${r}`
}

export function fmtS(s) { return s ? s.toFixed(3) : '--.---' }

export function fmtGap(g) {
  if (g === null || g === undefined) return '—'
  if (typeof g === 'string') return g.startsWith('+') ? g : `+${g}`
  if (typeof g === 'number') return g === 0 ? '—' : `+${g.toFixed(3)}`
  return '—'
}

export function segClass(v) {
  if (v === 2051) return 'seg-purple'
  if (v === 2049) return 'seg-green'
  if (v === 2064) return 'seg-pit'
  if (v === 2048) return 'seg-yellow'
  return 'seg-grey'
}

// ── Live standings builder ────────────────────────────────────────────────────
export async function buildLiveStandings(session_key = 'latest') {
  const [positions, drivers, stints, laps, intervals, pits] = await Promise.all([
    getPositions(session_key),
    getDrivers(session_key),
    getStints(session_key),
    getAllLaps(session_key),
    getIntervals(session_key),
    getPitStops(session_key),
  ])

  if (!drivers.length && !positions.length) return []

  const posMap = {}
  for (const p of positions)
    if (!posMap[p.driver_number] || p.date > posMap[p.driver_number].date)
      posMap[p.driver_number] = p

  const stintMap = {}
  for (const s of stints)
    if (!stintMap[s.driver_number] || s.stint_number > stintMap[s.driver_number].stint_number)
      stintMap[s.driver_number] = s

  const lapMap = {}
  for (const l of laps) {
    if (!lapMap[l.driver_number]) lapMap[l.driver_number] = []
    lapMap[l.driver_number].push(l)
  }

  const intMap = {}
  for (const i of intervals) intMap[i.driver_number] = i
  const pitMap = {}
  for (const p of pits) pitMap[p.driver_number] = (pitMap[p.driver_number] ?? 0) + 1
  const drvMap = {}
  for (const d of drivers) drvMap[d.driver_number] = d

  let globalBest = null
  const bestSectors = [null, null, null]
  for (const dl of Object.values(lapMap)) {
    for (const l of dl) {
      if (l.lap_duration && (!globalBest || l.lap_duration < globalBest)) globalBest = l.lap_duration
      if (l.duration_sector_1 && (!bestSectors[0] || l.duration_sector_1 < bestSectors[0])) bestSectors[0] = l.duration_sector_1
      if (l.duration_sector_2 && (!bestSectors[1] || l.duration_sector_2 < bestSectors[1])) bestSectors[1] = l.duration_sector_2
      if (l.duration_sector_3 && (!bestSectors[2] || l.duration_sector_3 < bestSectors[2])) bestSectors[2] = l.duration_sector_3
    }
  }

  // Build base from positions if available, else from drivers
  let base = Object.values(posMap)
  if (!base.length) {
    // No live positions — build from laps/drivers
    const driverNums = [...new Set([...Object.keys(lapMap), ...drivers.map(d => String(d.driver_number))])]
    const bestLapByDrv = {}
    for (const dl of Object.values(lapMap))
      for (const l of dl)
        if (l.lap_duration && (!bestLapByDrv[l.driver_number] || l.lap_duration < bestLapByDrv[l.driver_number]))
          bestLapByDrv[l.driver_number] = l.lap_duration
    base = driverNums
      .sort((a, b) => (bestLapByDrv[a] ?? 999) - (bestLapByDrv[b] ?? 999))
      .map((dn, i) => ({ driver_number: Number(dn), position: i + 1 }))
  }

  return base.sort((a, b) => (a.position ?? 99) - (b.position ?? 99)).map(p => {
    const drv    = drvMap[p.driver_number] ?? {}
    const stint  = stintMap[p.driver_number]
    const dl     = lapMap[p.driver_number] ?? []
    const lastLap = dl[dl.length - 1]
    const bestLap = dl.reduce((b, l) => l.lap_duration && (!b || l.lap_duration < b.lap_duration) ? l : b, null)
    const iv     = intMap[p.driver_number]
    const lapNum = lastLap?.lap_number ?? 0
    const tyreAge = stint ? lapNum - (stint.lap_start ?? 0) + (stint.tyre_age_at_start ?? 0) : null

    return {
      position:         p.position,
      driver_number:    p.driver_number,
      name_acronym:     drv.name_acronym ?? `#${p.driver_number}`,
      full_name:        drv.full_name ?? '',
      team_name:        drv.team_name ?? '',
      team_colour:      drv.team_colour ?? '555555',
      headshot_url:     drv.headshot_url ?? null,
      tyre:             stint?.compound ?? null,
      tyre_age:         tyreAge,
      pit_stops:        pitMap[p.driver_number] ?? 0,
      last_lap:         lastLap?.lap_duration ?? null,
      best_lap:         bestLap?.lap_duration ?? null,
      is_personal_best: !!(bestLap && lastLap && bestLap.lap_number === lastLap.lap_number),
      is_overall_best:  lastLap?.lap_duration === globalBest,
      lap_number:       lapNum,
      gap_to_leader:    iv?.gap_to_leader ?? null,
      interval:         iv?.interval ?? null,
      is_pit_out_lap:   lastLap?.is_pit_out_lap ?? false,
      sectors:          lastLap ? [lastLap.duration_sector_1, lastLap.duration_sector_2, lastLap.duration_sector_3] : [],
      best_sectors:     bestSectors,
      segments:         lastLap ? [lastLap.segments_sector_1 ?? [], lastLap.segments_sector_2 ?? [], lastLap.segments_sector_3 ?? []] : [],
      all_laps:         dl,
    }
  })
}

// ── Historical standings (from session_result) ────────────────────────────────
export async function buildHistoricalStandings(session_key) {
  try {
    const [result, drivers, stints, laps] = await Promise.all([
      getSessionResult(session_key),
      getDrivers(session_key),
      getStints(session_key),
      getAllLaps(session_key),
    ])

    if (!result?.length) return null

    const drvMap = {}
    for (const d of drivers) drvMap[d.driver_number] = d

    const lapMap = {}
    for (const l of laps) {
      if (!lapMap[l.driver_number]) lapMap[l.driver_number] = []
      lapMap[l.driver_number].push(l)
    }

    const bestSectors = [null, null, null]
    let globalBest = null
    for (const dl of Object.values(lapMap)) {
      for (const l of dl) {
        if (l.lap_duration && (!globalBest || l.lap_duration < globalBest)) globalBest = l.lap_duration
        if (l.duration_sector_1 && (!bestSectors[0] || l.duration_sector_1 < bestSectors[0])) bestSectors[0] = l.duration_sector_1
        if (l.duration_sector_2 && (!bestSectors[1] || l.duration_sector_2 < bestSectors[1])) bestSectors[1] = l.duration_sector_2
        if (l.duration_sector_3 && (!bestSectors[2] || l.duration_sector_3 < bestSectors[2])) bestSectors[2] = l.duration_sector_3
      }
    }

    const stintMap = {}
    for (const s of stints)
      if (!stintMap[s.driver_number] || s.stint_number > stintMap[s.driver_number].stint_number)
        stintMap[s.driver_number] = s

    const pitMap = {}
    for (const s of stints) if (s.lap_start > 1) pitMap[s.driver_number] = (pitMap[s.driver_number] ?? 0) + 1

    return result.sort((a, b) => a.position - b.position).map(r => {
      const drv = drvMap[r.driver_number] ?? {}
      const dl = lapMap[r.driver_number] ?? []
      const lastLap = dl[dl.length - 1]
      const bestLap = dl.reduce((b, l) => l.lap_duration && (!b || l.lap_duration < b.lap_duration) ? l : b, null)
      const stint = stintMap[r.driver_number]
      const lapNum = lastLap?.lap_number ?? 0
      const tyreAge = stint ? lapNum - (stint.lap_start ?? 0) + (stint.tyre_age_at_start ?? 0) : null

      return {
        position:       r.position,
        driver_number:  r.driver_number,
        name_acronym:   drv.name_acronym ?? `#${r.driver_number}`,
        full_name:      drv.full_name ?? '',
        team_name:      drv.team_name ?? '',
        team_colour:    drv.team_colour ?? '555555',
        headshot_url:   drv.headshot_url ?? null,
        tyre:           stint?.compound ?? null,
        tyre_age:       tyreAge,
        pit_stops:      pitMap[r.driver_number] ?? 0,
        last_lap:       lastLap?.lap_duration ?? null,
        best_lap:       bestLap?.lap_duration ?? null,
        is_personal_best: !!(bestLap && lastLap && bestLap.lap_number === lastLap.lap_number),
        is_overall_best:  lastLap?.lap_duration === globalBest,
        lap_number:     lapNum,
        gap_to_leader:  r.position === 1 ? null : r.time ?? null,
        interval:       r.time ?? null,
        is_pit_out_lap: false,
        sectors:        lastLap ? [lastLap.duration_sector_1, lastLap.duration_sector_2, lastLap.duration_sector_3] : [],
        best_sectors:   bestSectors,
        segments:       [],
        all_laps:       dl,
      }
    })
  } catch { return null }
}
