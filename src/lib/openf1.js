// ── OpenF1 API client ─────────────────────────────────────────────────────────
// Docs: https://openf1.org/docs
// Historical data (2023+): free, no auth
// Real-time (session_key=latest): requires Bearer token via our proxy
//
// ALL requests go through Supabase proxy which:
//   1. Adds Bearer token server-side (cached 1hr)
//   2. Bypasses CORS/allowlist restrictions on direct browser calls

const BASE     = 'https://api.openf1.org/v1'
const PROXY    = (() => { const u = import.meta.env.VITE_SUPABASE_URL; return u ? `${u}/functions/v1/openf1-proxy/v1` : null })()

// ── Simple in-memory cache ────────────────────────────────────────────────────
const _cache = new Map()
function cacheGet(k)          { const h = _cache.get(k); return (h && Date.now() < h.exp) ? h.data : null }
function cacheSet(k, d, ttl)  { _cache.set(k, { data: d, exp: Date.now() + ttl }) }

// ── Rate-limited fetch queue ──────────────────────────────────────────────────
const _q = []; let _running = 0

function _dispatch() {
  // Drop excess queued requests to prevent pile-up during live sessions
  if (_q.length > 12) _q.splice(0, _q.length - 12).forEach(r => r.resolve([]))
  while (_running < 3 && _q.length) {
    const { url, resolve } = _q.shift()
    _running++
    fetch(url, { signal: AbortSignal.timeout(12000) })
      .then(async res => {
        if (res.status === 429) {
          // Rate limited — re-queue once after 3s if not too many pending
          if (_q.length < 6) setTimeout(() => { _q.unshift({ url, resolve }); _dispatch() }, 3000)
          else resolve([])
          return
        }
        resolve(res.ok ? await res.json().catch(() => []) : [])
      })
      .catch(() => resolve([]))
      .finally(() => { _running--; setTimeout(_dispatch, 350) })
  }
}

function _fetch(endpoint, params = {}) {
  // Build URL — prefer proxy (handles auth), fall back to direct for historical data
  const base = PROXY ?? BASE
  const url  = new URL(`${base}${endpoint}`)
  Object.entries(params).forEach(([k, v]) => { if (v != null && v !== '') url.searchParams.set(k, String(v)) })
  return new Promise(resolve => { _q.push({ url: url.toString(), resolve }); _dispatch() })
}

async function GET(endpoint, params = {}, ttl = 0) {
  if (ttl > 0) {
    const key = endpoint + JSON.stringify(params)
    const hit = cacheGet(key)
    if (hit !== null) return hit
    const data = await _fetch(endpoint, params)
    if (data?.length) cacheSet(key, data, ttl) // only cache non-empty responses
    return data
  }
  return _fetch(endpoint, params)
}

// ── Public API functions ──────────────────────────────────────────────────────
// Docs: https://openf1.org/docs/#api-endpoints

// Sessions — https://openf1.org/docs/#sessions
export const getSessions    = (p = {})    => GET('/sessions',    p,                      60_000)
export const getLatestSession = ()        => GET('/sessions',    { session_key: 'latest' }, 15_000).then(d => d?.[0] ?? null)

// Drivers — https://openf1.org/docs/#drivers
export const getDrivers     = (sk)        => GET('/drivers',     { session_key: sk },    300_000)

// Laps — https://openf1.org/docs/#laps
// For live sessions: fetch only the latest lap number to avoid huge responses
export const getLaps        = (sk, dn)    => GET('/laps',        { session_key: sk, driver_number: dn }, 8_000)
export const getAllLaps      = (sk)        => GET('/laps',        { session_key: sk },     15_000)

// Position — https://openf1.org/docs/#position (updates ~3.7Hz during session)
export const getPositions   = (sk)        => GET('/position',    { session_key: sk },     5_000)

// Intervals — https://openf1.org/docs/#intervals (races only, ~4s updates)
export const getIntervals   = (sk)        => GET('/intervals',   { session_key: sk },     5_000)

// Stints — https://openf1.org/docs/#stints
export const getStints      = (sk)        => GET('/stints',      { session_key: sk },     30_000)

// Pit stops — https://openf1.org/docs/#pit
export const getPitStops    = (sk)        => GET('/pit',         { session_key: sk },     30_000)

// Race control — https://openf1.org/docs/#race-control
export const getRaceControl = (sk)        => GET('/race_control',{ session_key: sk },     10_000)

// Team radio — https://openf1.org/docs/#team-radio
export const getTeamRadio   = (sk)        => GET('/team_radio',  { session_key: sk },     20_000)

// Weather — https://openf1.org/docs/#weather
export const getWeatherRaw  = (sk)        => GET('/weather',     { session_key: sk },     15_000)
export const getWeather     = (sk)        => getWeatherRaw(sk).then(d => Array.isArray(d) && d.length ? d[d.length - 1] : null)

// Car data/telemetry — https://openf1.org/docs/#car-data
export const getCarData     = (sk, dn)    => GET('/car_data',    { session_key: sk, driver_number: dn }, 3_000)

// Location — https://openf1.org/docs/#location
export const getLocation    = (sk, dn, since) => {
  const p = { session_key: sk, driver_number: dn }
  if (since) p[`date>`] = since
  return GET('/location', p, 3_000)
}

// Meetings — https://openf1.org/docs/#meetings
export const getMeetings    = (year)      => GET('/meetings',    { year },               300_000)

// Overtakes — https://openf1.org/docs/#overtakes
export const getOvertakes   = (sk)        => GET('/overtakes',   { session_key: sk },    30_000)

// Session result — https://openf1.org/docs/#session-result
export const getSessionResult = (sk)      => GET('/session_result', { session_key: sk }, 300_000)

// Starting grid — https://openf1.org/docs/#starting-grid
export const getStartingGrid  = (sk)      => GET('/starting_grid',  { session_key: sk }, 300_000)

// Championship — https://openf1.org/docs/#drivers-championship-beta (races only)
export const getChampionshipDrivers = (sk) => GET('/championship_drivers', { session_key: sk }, 120_000)
export const getChampionshipTeams   = (sk) => GET('/championship_teams',   { session_key: sk }, 120_000)

// ── Format helpers ────────────────────────────────────────────────────────────
export function fmt(s) {
  if (!s || s <= 0) return '--:--.---'
  const m = Math.floor(s / 60)
  const sec = (s % 60).toFixed(3).padStart(6, '0')
  return m > 0 ? `${m}:${sec}` : sec
}
export function fmtGap(s) {
  if (!s || s <= 0) return '—'
  return s < 60 ? `+${s.toFixed(3)}` : `+${Math.floor(s / 60)}:${(s % 60).toFixed(3).padStart(6, '0')}`
}

// ── Build live standings from API data ────────────────────────────────────────
export async function buildLiveStandings(session_key = 'latest') {
  // Fetch the 5 key datasets in parallel
  // Note: /intervals is races-only, fetched separately to avoid cascade failure
  const [positions, laps, drivers, stints, pits] = await Promise.all([
    getPositions(session_key).catch(() => []),
    getAllLaps(session_key).catch(() => []),
    getDrivers(session_key).catch(() => []),
    getStints(session_key).catch(() => []),
    getPitStops(session_key).catch(() => []),
  ])

  // /intervals only works during races — try separately, ignore failure
  let intervals = []
  try { intervals = await getIntervals(session_key) || [] } catch {}

  // Build lookup maps
  const posMap = {}, drvMap = {}, stintMap = {}, lapMap = {}, intMap = {}, pitCount = {}

  for (const p of positions ?? [])
    if (!posMap[p.driver_number] || p.date > posMap[p.driver_number].date) posMap[p.driver_number] = p

  for (const d of drivers ?? []) drvMap[d.driver_number] = d

  for (const s of stints ?? [])
    if (!stintMap[s.driver_number] || s.stint_number > stintMap[s.driver_number].stint_number) stintMap[s.driver_number] = s

  for (const l of laps ?? []) {
    if (!lapMap[l.driver_number]) lapMap[l.driver_number] = []
    lapMap[l.driver_number].push(l)
  }

  for (const i of intervals ?? []) intMap[i.driver_number] = i
  for (const p of pits ?? []) pitCount[p.driver_number] = (pitCount[p.driver_number] ?? 0) + 1

  // Session-wide best times
  let globalBest = null
  const bestS = [null, null, null]
  for (const dl of Object.values(lapMap)) {
    for (const l of dl) {
      if (l.lap_duration > 0 && (!globalBest || l.lap_duration < globalBest)) globalBest = l.lap_duration
      if (l.duration_sector_1 && (!bestS[0] || l.duration_sector_1 < bestS[0])) bestS[0] = l.duration_sector_1
      if (l.duration_sector_2 && (!bestS[1] || l.duration_sector_2 < bestS[1])) bestS[1] = l.duration_sector_2
      if (l.duration_sector_3 && (!bestS[2] || l.duration_sector_3 < bestS[2])) bestS[2] = l.duration_sector_3
    }
  }

  // Combine all driver numbers we have data for
  const allDriverNums = new Set([
    ...Object.keys(posMap),
    ...Object.keys(lapMap),
    ...Object.keys(drvMap),
  ].map(Number))

  if (!allDriverNums.size) return []

  return Array.from(allDriverNums)
    .map(dn => {
      const pos   = posMap[dn]
      const drv   = drvMap[dn] ?? {}
      const stint = stintMap[dn]
      const dl    = lapMap[dn] ?? []
      const lastL = dl[dl.length - 1]
      const bestL = dl.reduce((b, l) => (l.lap_duration > 0 && (!b || l.lap_duration < b.lap_duration)) ? l : b, null)
      const iv    = intMap[dn]
      const lapN  = lastL?.lap_number ?? 0
      const tyreAge = stint ? lapN - (stint.lap_start ?? 0) + (stint.tyre_age_at_start ?? 0) : null

      return {
        position:        pos?.position ?? 99,
        driver_number:   dn,
        name_acronym:    drv.name_acronym ?? `#${dn}`,
        full_name:       drv.full_name ?? '',
        team_name:       drv.team_name ?? '',
        team_colour:     drv.team_colour ?? '555555',
        headshot_url:    drv.headshot_url ?? null,
        tyre:            stint?.compound ?? null,
        tyre_age:        tyreAge,
        pit_stops:       pitCount[dn] ?? 0,
        last_lap:        lastL?.lap_duration ?? null,
        best_lap:        bestL?.lap_duration ?? null,
        is_personal_best: !!(bestL && lastL && bestL.lap_number === lastL.lap_number),
        is_overall_best:  lastL?.lap_duration === globalBest && globalBest != null,
        lap_number:      lapN,
        gap_to_leader:   iv?.gap_to_leader ?? null,
        interval:        iv?.interval ?? null,
        is_pit_out_lap:  lastL?.is_pit_out_lap ?? false,
        // Sector times from last lap
        sectors:         lastL ? [lastL.duration_sector_1, lastL.duration_sector_2, lastL.duration_sector_3] : [],
        best_sectors:    bestS,
        // Mini-sectors — note: not available during races per docs
        segments:        lastL ? [lastL.segments_sector_1 ?? [], lastL.segments_sector_2 ?? [], lastL.segments_sector_3 ?? []] : [],
        // Speed data
        i1_speed:        lastL?.i1_speed ?? null,
        i2_speed:        lastL?.i2_speed ?? null,
        st_speed:        lastL?.st_speed ?? null,
        all_laps:        dl,
      }
    })
    .sort((a, b) => (a.position || 99) - (b.position || 99))
}

// ── Build historical standings from session_result ────────────────────────────
// session_result is available for qualifying and race sessions
export async function buildHistoricalStandings(session_key) {
  try {
    const [result, drivers, stints] = await Promise.all([
      getSessionResult(session_key).catch(() => null),
      getDrivers(session_key).catch(() => []),
      getStints(session_key).catch(() => []),
    ])
    if (!result?.length) return []
    const drvMap = {}, stintMap = {}
    for (const d of drivers ?? []) drvMap[d.driver_number] = d
    for (const s of stints ?? [])
      if (!stintMap[s.driver_number] || s.stint_number > stintMap[s.driver_number].stint_number) stintMap[s.driver_number] = s
    return result
      .sort((a, b) => (a.position || 99) - (b.position || 99))
      .map((r, i) => {
        const drv = drvMap[r.driver_number] ?? {}
        const stint = stintMap[r.driver_number]
        return {
          position:       r.position ?? i + 1,
          driver_number:  r.driver_number,
          name_acronym:   drv.name_acronym ?? r.name_acronym ?? `#${r.driver_number}`,
          full_name:      drv.full_name ?? r.full_name ?? '',
          team_name:      drv.team_name ?? r.team_name ?? '',
          team_colour:    drv.team_colour ?? r.team_colour ?? '555555',
          headshot_url:   drv.headshot_url ?? null,
          tyre:           stint?.compound ?? null,
          tyre_age:       null,
          pit_stops:      r.number_of_pit_stops ?? 0,
          last_lap:       null,
          best_lap:       r.time ?? null,
          is_personal_best: false,
          is_overall_best:  r.position === 1,
          lap_number:     r.number_of_laps ?? 0,
          gap_to_leader:  r.gap_to_leader ?? null,
          interval:       null,
          is_pit_out_lap: false,
          sectors:        [],
          best_sectors:   [null, null, null],
          segments:       [],
          i1_speed: null, i2_speed: null, st_speed: null,
          all_laps:       [],
        }
      })
  } catch { return [] }
}

// Legacy compat
export const getBestStandingsSession = () => null

export function flagUrl(code) { return code ? `https://flagcdn.com/24x18/${code.toLowerCase()}.png` : null }
