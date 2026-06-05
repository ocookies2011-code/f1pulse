const BASE = 'https://api.openf1.org/v1'
let cachedToken = null, tokenExpiry = 0

async function getToken() {
  if (cachedToken && Date.now() < tokenExpiry - 60000) return cachedToken
  try {
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/openf1-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
    })
    if (!res.ok) return null
    const { access_token, expires_in } = await res.json()
    cachedToken = access_token
    tokenExpiry = Date.now() + parseInt(expires_in) * 1000
    return access_token
  } catch { return null }
}

async function get(endpoint, params = {}) {
  const url = new URL(`${BASE}${endpoint}`)
  Object.entries(params).forEach(([k, v]) => { if (v != null && v !== '') url.searchParams.set(k, v) })
  const token = await getToken()
  const headers = token ? { Authorization: `Bearer ${token}` } : {}
  const res = await fetch(url.toString(), { headers })
  if (!res.ok) throw new Error(`OpenF1 ${res.status}: ${res.statusText}`)
  return res.json()
}

export const getMeetings    = (year) => get('/meetings', { year: year ?? new Date().getFullYear() })
export const getSessions    = (p = {}) => get('/sessions', p)
export const getDrivers     = (sk = 'latest') => get('/drivers', { session_key: sk })
export const getPositions   = (sk = 'latest') => get('/position', { session_key: sk })
export const getLaps        = (sk = 'latest', dn) => get('/laps', { session_key: sk, driver_number: dn })
export const getAllLaps      = (sk = 'latest') => get('/laps', { session_key: sk })
export const getStints      = (sk = 'latest') => get('/stints', { session_key: sk })
export const getPitStops    = (sk = 'latest') => get('/pit', { session_key: sk })
export const getIntervals   = (sk = 'latest') => get('/intervals', { session_key: sk })
export const getRaceControl = (sk = 'latest') => get('/race_control', { session_key: sk })
export const getTeamRadio   = (sk = 'latest') => get('/team_radio', { session_key: sk })
export const getCarData     = (sk, dn) => get('/car_data', { session_key: sk, driver_number: dn })
export const getLocation    = (sk, dn) => get('/location', { session_key: sk, driver_number: dn })
export const getStartingGrid = (sk) => get('/starting_grid', { session_key: sk })
export const getSessionResult = (sk) => get('/session_result', { session_key: sk })
export const getChampionshipDrivers = (sk) => get('/championship_drivers', { session_key: sk })
export const getChampionshipTeams   = (sk) => get('/championship_teams', { session_key: sk })

export async function getLatestSession() {
  const d = await get('/sessions', { session_key: 'latest' })
  return d[0] ?? null
}

// Latest RACE session (championship endpoints only work on race sessions)
export async function getLatestRaceSession(year = 2026) {
  const all = await get('/sessions', { year, session_name: 'Race' })
  const now = Date.now()
  const past = all.filter(s => new Date(s.date_start) < now)
    .sort((a, b) => new Date(b.date_start) - new Date(a.date_start))
  return past[0] ?? null
}

export async function getWeather(sk = 'latest') {
  const d = await get('/weather', { session_key: sk })
  return d[d.length - 1] ?? null
}

// Build full live timing table from multiple endpoints
export async function buildLiveStandings(session_key = 'latest') {
  const [positions, drivers, stints, laps, pits, intervals] = await Promise.all([
    getPositions(session_key),
    getDrivers(session_key),
    getStints(session_key),
    getAllLaps(session_key),
    getPitStops(session_key).catch(() => []),
    getIntervals(session_key).catch(() => []),
  ])

  const posMap = {}
  for (const p of positions)
    if (!posMap[p.driver_number] || p.date > posMap[p.driver_number].date) posMap[p.driver_number] = p

  const stintMap = {}
  for (const s of stints)
    if (!stintMap[s.driver_number] || s.stint_number > stintMap[s.driver_number].stint_number) stintMap[s.driver_number] = s

  const lapMap = {}
  for (const l of laps) { if (!lapMap[l.driver_number]) lapMap[l.driver_number] = []; lapMap[l.driver_number].push(l) }

  const intMap = {}
  for (const i of intervals) intMap[i.driver_number] = i

  const pitMap = {}
  for (const p of pits) pitMap[p.driver_number] = (pitMap[p.driver_number] ?? 0) + 1

  const drvMap = {}
  for (const d of drivers) drvMap[d.driver_number] = d

  // Global best lap + best sectors
  let globalBestLap = null
  const bestSectors = [null, null, null]
  for (const dl of Object.values(lapMap)) {
    for (const l of dl) {
      if (l.lap_duration && (!globalBestLap || l.lap_duration < globalBestLap)) globalBestLap = l.lap_duration
      if (l.duration_sector_1 && (!bestSectors[0] || l.duration_sector_1 < bestSectors[0])) bestSectors[0] = l.duration_sector_1
      if (l.duration_sector_2 && (!bestSectors[1] || l.duration_sector_2 < bestSectors[1])) bestSectors[1] = l.duration_sector_2
      if (l.duration_sector_3 && (!bestSectors[2] || l.duration_sector_3 < bestSectors[2])) bestSectors[2] = l.duration_sector_3
    }
  }

  return Object.values(posMap).sort((a, b) => a.position - b.position).map(p => {
    const drv = drvMap[p.driver_number] ?? {}
    const stint = stintMap[p.driver_number]
    const dl = lapMap[p.driver_number] ?? []
    const lastLap = dl[dl.length - 1]
    const bestLap = dl.reduce((b, l) => l.lap_duration && (!b || l.lap_duration < b.lap_duration) ? l : b, null)
    const iv = intMap[p.driver_number]
    const lapNum = lastLap?.lap_number ?? 0
    const tyreAge = stint ? lapNum - (stint.lap_start ?? 0) + (stint.tyre_age_at_start ?? 0) : null
    return {
      position: p.position,
      driver_number: p.driver_number,
      name_acronym: drv.name_acronym ?? `#${p.driver_number}`,
      full_name: drv.full_name ?? '',
      team_name: drv.team_name ?? '',
      team_colour: drv.team_colour ?? '555555',
      headshot_url: drv.headshot_url ?? null,
      tyre: stint?.compound ?? null,
      tyre_age: tyreAge,
      pit_stops: pitMap[p.driver_number] ?? 0,
      last_lap: lastLap?.lap_duration ?? null,
      best_lap: bestLap?.lap_duration ?? null,
      is_personal_best: bestLap && lastLap && bestLap.lap_number === lastLap.lap_number,
      is_overall_best: lastLap?.lap_duration === globalBestLap,
      lap_number: lapNum,
      gap_to_leader: iv?.gap_to_leader ?? null,
      interval: iv?.interval ?? null,
      is_pit_out_lap: lastLap?.is_pit_out_lap ?? false,
      sectors: lastLap ? [lastLap.duration_sector_1, lastLap.duration_sector_2, lastLap.duration_sector_3] : [],
      best_sectors: bestSectors,
      segments: lastLap ? [lastLap.segments_sector_1 ?? [], lastLap.segments_sector_2 ?? [], lastLap.segments_sector_3 ?? []] : [],
      all_laps: dl,
    }
  })
}

// Formatters
export function fmt(s) {
  if (!s) return '--:--.---'
  const m = Math.floor(s / 60), r = (s % 60).toFixed(3).padStart(6, '0')
  return `${m}:${r}`
}
export function fmtS(s) { return s ? s.toFixed(3) : '--.---' }
export function fmtGap(g) {
  if (g === null || g === undefined) return '—'
  if (typeof g === 'string') return g
  return `+${g.toFixed(3)}`
}
export function segClass(v) {
  if (v === 2051) return 'seg-purple'
  if (v === 2049) return 'seg-green'
  if (v === 2064) return 'seg-pit'
  return 'seg-yellow'
}

// Country code → flagcdn ISO-2
export const FLAG_MAP = {
  BRN:'bh', AUS:'au', CHN:'cn', JPN:'jp', SAU:'sa', USA:'us', ITA:'it',
  MCO:'mc', CAN:'ca', AUT:'at', GBR:'gb', BEL:'be', HUN:'hu', NED:'nl',
  SGP:'sg', MEX:'mx', BRA:'br', QAT:'qa', UAE:'ae', AZE:'az', ESP:'es',
  MON:'mc', NET:'nl', GER:'de', FRA:'fr', BAH:'bh', LVG:'us',
}
export function flagUrl(code, size='32x24') {
  const iso = code ? FLAG_MAP[code.toUpperCase()] : null
  return iso ? `https://flagcdn.com/${size}/${iso}.png` : null
}
