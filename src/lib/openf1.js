const BASE = 'https://api.openf1.org/v1'

// ── Auth token (cached, fetched via edge function) ────────────────────────────
let cachedToken = null
let tokenExpiry  = 0
let tokenFetching = null // prevents concurrent fetches

async function getToken() {
  if (cachedToken && Date.now() < tokenExpiry - 60000) return cachedToken
  if (tokenFetching) return tokenFetching
  tokenFetching = (async () => {
    try {
      const url  = import.meta.env.VITE_SUPABASE_URL
      const anon = import.meta.env.VITE_SUPABASE_ANON_KEY
      if (!url || !anon) return null
      const res = await fetch(`${url}/functions/v1/openf1-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${anon}` },
      })
      if (!res.ok) return null
      const { access_token, expires_in } = await res.json()
      cachedToken  = access_token
      tokenExpiry  = Date.now() + parseInt(expires_in ?? '3600') * 1000
      return access_token
    } catch { return null }
    finally { tokenFetching = null }
  })()
  return tokenFetching
}

// ── Rate-limit aware request queue ────────────────────────────────────────────
const queue  = []
let running  = 0
const MAX_CONCURRENT = 2        // max simultaneous requests
const MIN_GAP_MS     = 250      // min ms between each dispatched request

function dispatch() {
  if (running >= MAX_CONCURRENT || queue.length === 0) return
  const { url, headers, resolve, reject } = queue.shift()
  running++
  fetch(url, { headers })
    .then(async res => {
      if (res.status === 429) {
        // Back-off: re-queue after 2s
        await new Promise(r => setTimeout(r, 2000))
        queue.unshift({ url, headers, resolve, reject })
        running--
        setTimeout(dispatch, 100)
        return
      }
      if (!res.ok) throw new Error(`OpenF1 ${res.status}: ${res.statusText}`)
      const data = await res.json()
      resolve(data)
    })
    .catch(reject)
    .finally(() => {
      running--
      setTimeout(dispatch, MIN_GAP_MS)
    })
  setTimeout(dispatch, MIN_GAP_MS)
}

async function get(endpoint, params = {}) {
  const url = new URL(`${BASE}${endpoint}`)
  Object.entries(params).forEach(([k, v]) => { if (v != null && v !== '') url.searchParams.set(k, String(v)) })
  const token   = await getToken()
  const headers = token ? { Authorization: `Bearer ${token}` } : {}
  return new Promise((resolve, reject) => {
    queue.push({ url: url.toString(), headers, resolve, reject })
    dispatch()
  })
}

// ── Simple in-memory response cache ───────────────────────────────────────────
const cache    = new Map()
const CACHE_MS = 8000  // 8s for live data; longer for static

async function getCached(endpoint, params, ttl = CACHE_MS) {
  const key = endpoint + JSON.stringify(params)
  const hit  = cache.get(key)
  if (hit && Date.now() < hit.exp) return hit.data
  const data = await get(endpoint, params)
  cache.set(key, { data, exp: Date.now() + ttl })
  return data
}

// ── Raw endpoints ─────────────────────────────────────────────────────────────
export const getMeetings   = (year) => getCached('/meetings', { year: year ?? 2026 }, 300_000)
export const getSessions   = (p = {}) => getCached('/sessions', p, 60_000)
export const getDrivers    = (sk = 'latest') => getCached('/drivers', { session_key: sk }, 300_000)
export const getPositions  = (sk = 'latest') => getCached('/position', { session_key: sk }, 8_000)
export const getLaps       = (sk, dn) => getCached('/laps', { session_key: sk, driver_number: dn }, 8_000)
export const getAllLaps     = (sk = 'latest') => getCached('/laps', { session_key: sk }, 12_000)
export const getStints     = (sk = 'latest') => getCached('/stints', { session_key: sk }, 15_000)
export const getPitStops   = (sk = 'latest') => getCached('/pit', { session_key: sk }, 15_000)
export const getIntervals  = (sk = 'latest') => getCached('/intervals', { session_key: sk }, 8_000)
export const getRaceControl= (sk = 'latest') => getCached('/race_control', { session_key: sk }, 10_000)
export const getTeamRadio  = (sk = 'latest') => getCached('/team_radio', { session_key: sk }, 15_000)
export const getCarData    = (sk, dn) => getCached('/car_data', { session_key: sk, driver_number: dn }, 5_000)
export const getLocation   = (sk, dn) => getCached('/location', { session_key: sk, driver_number: dn }, 5_000)
export const getStartingGrid      = (sk) => getCached('/starting_grid', { session_key: sk }, 300_000)
export const getSessionResult     = (sk) => getCached('/session_result', { session_key: sk }, 60_000)
export const getChampionshipDrivers = (sk) => getCached('/championship_drivers', { session_key: sk }, 60_000)
export const getChampionshipTeams   = (sk) => getCached('/championship_teams', { session_key: sk }, 60_000)

// ── Smart session helpers ─────────────────────────────────────────────────────

// Returns the most recent completed or in-progress session of any type
export async function getLatestSession() {
  try {
    const d = await getCached('/sessions', { session_key: 'latest' }, 30_000)
    return Array.isArray(d) ? (d[0] ?? null) : null
  } catch { return null }
}

// Returns the most recent completed RACE session (for championship data)
export async function getLatestRaceSession(year = 2026) {
  try {
    const all  = await getSessions({ year, session_name: 'Race' })
    const now  = Date.now()
    const past = all
      .filter(s => new Date(s.date_start) < now)
      .sort((a, b) => new Date(b.date_start) - new Date(a.date_start))
    return past[0] ?? null
  } catch { return null }
}

// Returns the most useful session for standings:
//  1. If a race is complete → use that
//  2. If qualifying/sprint complete → use that
//  3. Otherwise → latest session
export async function getBestStandingsSession(year = 2026) {
  try {
    const all  = await getSessions({ year })
    const now  = Date.now()
    const done = all
      .filter(s => new Date(s.date_end ?? s.date_start) < now)
      .sort((a, b) => new Date(b.date_end) - new Date(a.date_end))
    // Prefer race, then qualifying, then anything
    return done.find(s => s.session_name === 'Race')
        ?? done.find(s => s.session_name === 'Qualifying')
        ?? done[0]
        ?? null
  } catch { return null }
}

export async function getWeather(sk = 'latest') {
  try {
    const d = await getCached('/weather', { session_key: sk }, 15_000)
    return Array.isArray(d) ? (d[d.length - 1] ?? null) : null
  } catch { return null }
}

// ── Live standings (sequential to avoid 429) ─────────────────────────────────
export async function buildLiveStandings(session_key = 'latest') {
  const delay = (ms) => new Promise(r => setTimeout(r, ms))

  // Fetch all data in parallel with individual error handling
  const [positions, drivers, stints, laps, intervals, pits] = await Promise.all([
    getPositions(session_key).catch(() => []),
    getDrivers(session_key).catch(() => []),
    getStints(session_key).catch(() => []),
    getAllLaps(session_key).catch(() => []),
    getIntervals(session_key).catch(() => []),
    getPitStops(session_key).catch(() => []),
  ])

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

  const intMap  = {}
  for (const i of intervals) intMap[i.driver_number]  = i
  const pitMap  = {}
  for (const p of pits) pitMap[p.driver_number] = (pitMap[p.driver_number] ?? 0) + 1
  const drvMap  = {}
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

  // Fallback: if positions is empty (e.g. between sessions), build from drivers + laps
  let baseDrivers = Object.values(posMap)
  if (baseDrivers.length === 0 && drivers.length > 0) {
    // Build virtual positions from best lap times
    const driverNums = [...new Set(laps.map(l => l.driver_number))]
    if (driverNums.length === 0) {
      // No lap data either - just list all drivers
      for (const d of drivers) {
        posMap[d.driver_number] = { driver_number: d.driver_number, position: 0 }
      }
    } else {
      // Sort by best lap
      const bestLapByDriver = {}
      for (const l of laps) {
        if (l.lap_duration && (!bestLapByDriver[l.driver_number] || l.lap_duration < bestLapByDriver[l.driver_number]))
          bestLapByDriver[l.driver_number] = l.lap_duration
      }
      const sorted = driverNums.sort((a, b) => (bestLapByDriver[a] ?? 999) - (bestLapByDriver[b] ?? 999))
      sorted.forEach((dn, i) => { posMap[dn] = { driver_number: dn, position: i + 1 } })
    }
    baseDrivers = Object.values(posMap)
  }

  return baseDrivers.sort((a, b) => (a.position || 99) - (b.position || 99)).map(p => {
    const drv    = drvMap[p.driver_number] ?? {}
    const stint  = stintMap[p.driver_number]
    const dl     = lapMap[p.driver_number] ?? []
    const lastLap = dl[dl.length - 1]
    const bestLap = dl.reduce((b, l) => l.lap_duration && (!b || l.lap_duration < b.lap_duration) ? l : b, null)
    const iv     = intMap[p.driver_number]
    const lapNum = lastLap?.lap_number ?? 0
    const tyreAge = stint ? lapNum - (stint.lap_start ?? 0) + (stint.tyre_age_at_start ?? 0) : null
    return {
      position:        p.position,
      driver_number:   p.driver_number,
      name_acronym:    drv.name_acronym ?? `#${p.driver_number}`,
      full_name:       drv.full_name ?? '',
      team_name:       drv.team_name ?? '',
      team_colour:     drv.team_colour ?? '555555',
      headshot_url:    drv.headshot_url ?? null,
      tyre:            stint?.compound ?? null,
      tyre_age:        tyreAge,
      pit_stops:       pitMap[p.driver_number] ?? 0,
      last_lap:        lastLap?.lap_duration ?? null,
      best_lap:        bestLap?.lap_duration ?? null,
      is_personal_best:bestLap && lastLap && bestLap.lap_number === lastLap.lap_number,
      is_overall_best: lastLap?.lap_duration === globalBest,
      lap_number:      lapNum,
      gap_to_leader:   iv?.gap_to_leader ?? null,
      interval:        iv?.interval ?? null,
      is_pit_out_lap:  lastLap?.is_pit_out_lap ?? false,
      sectors:         lastLap ? [lastLap.duration_sector_1, lastLap.duration_sector_2, lastLap.duration_sector_3] : [],
      best_sectors:    bestSectors,
      segments:        lastLap ? [lastLap.segments_sector_1 ?? [], lastLap.segments_sector_2 ?? [], lastLap.segments_sector_3 ?? []] : [],
      all_laps:        dl,
    }
  })
}

// ── Build standings from completed session result (cleaner for historical sessions) ──
export async function buildHistoricalStandings(session_key) {
  try {
    const [result, drivers, stints] = await Promise.all([
      getSessionResult(session_key).catch(() => null),
      getDrivers(session_key).catch(() => []),
      getStints(session_key).catch(() => []),
    ])

    if (!result?.length) return null

    const drvMap = {}
    for (const d of drivers) drvMap[d.driver_number] = d

    // Build lap data for best laps
    const laps = await getAllLaps(session_key).catch(() => [])
    const lapMap = {}
    for (const l of laps) {
      if (!lapMap[l.driver_number]) lapMap[l.driver_number] = []
      lapMap[l.driver_number].push(l)
    }

    // Best sectors
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

    // Stint data
    const stintMap = {}
    for (const s of stints) {
      if (!stintMap[s.driver_number] || s.stint_number > stintMap[s.driver_number].stint_number)
        stintMap[s.driver_number] = s
    }
    const pitMap = {}
    for (const s of stints) pitMap[s.driver_number] = (pitMap[s.driver_number] ?? 0)
    for (const s of stints) { if (s.lap_start > 1) pitMap[s.driver_number] = (pitMap[s.driver_number] ?? 0) + 1 }

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
        is_personal_best: bestLap && lastLap && bestLap.lap_number === lastLap.lap_number,
        is_overall_best:  lastLap?.lap_duration === globalBest,
        lap_number:     lapNum,
        gap_to_leader:  r.time ? (r.position === 1 ? null : r.time) : null,
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

// ── Formatters ────────────────────────────────────────────────────────────────
export function fmt(s) {
  if (!s) return '--:--.---'
  const m = Math.floor(s / 60), r = (s % 60).toFixed(3).padStart(6, '0')
  return `${m}:${r}`
}
export function fmtS(s) { return s ? s.toFixed(3) : '--.---' }
export function fmtGap(g) {
  if (g === null || g === undefined) return '—'
  if (typeof g === 'string') return g.startsWith('+') ? g : `+${g}`
  return `+${Number(g).toFixed(3)}`
}
export function segClass(v) {
  if (v === 2051) return 'seg-purple'
  if (v === 2049) return 'seg-green'
  if (v === 2064) return 'seg-pit'
  return 'seg-yellow'
}

export const FLAG_MAP = {
  BRN:'bh', AUS:'au', CHN:'cn', JPN:'jp', SAU:'sa', USA:'us', ITA:'it',
  MCO:'mc', CAN:'ca', AUT:'at', GBR:'gb', BEL:'be', HUN:'hu', NED:'nl',
  SGP:'sg', MEX:'mx', BRA:'br', QAT:'qa', UAE:'ae', AZE:'az', ESP:'es',
  MON:'mc', NET:'nl', GER:'de', FRA:'fr', BAH:'bh', LVG:'us',
}
export function flagUrl(code, size = '32x24') {
  const iso = code ? FLAG_MAP[code.toUpperCase()] : null
  return iso ? `https://flagcdn.com/${size}/${iso}.png` : null
}
