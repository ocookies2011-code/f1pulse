const BASE = 'https://api.openf1.org/v1'

// Proxy URL - all OpenF1 requests go through Supabase edge function
// No token management in browser - the edge function handles auth server-side
const PROXY_URL = (() => {
  const base = import.meta.env.VITE_SUPABASE_URL
  return base ? `${base}/functions/v1/openf1-proxy` : null
})()

// Response cache
const _cache = new Map()
function cacheGet(k) { const h = _cache.get(k); return (h && Date.now() < h.exp) ? h.data : null }
function cacheSet(k, data, ttl) { _cache.set(k, { data, exp: Date.now() + ttl }) }

// Rate-limited queue: max 3 concurrent, 300ms gap
const _q = []; let _running = 0
function _dispatch() {
  // Cap queue at 12 to prevent unbounded growth during live sessions
  if (_q.length > 12) {
    // Drop oldest requests (they'll be re-fetched on next poll)
    const dropped = _q.splice(0, _q.length - 12)
    dropped.forEach(r => r.resolve([]))
  }
  while (_running < 3 && _q.length) {
    const { url, headers, resolve } = _q.shift()
    _running++
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 8000)
    fetch(url, { headers, signal: ctrl.signal })
      .then(async res => {
        clearTimeout(timer)
        if (res.status === 429) {
          // Rate limited - back off, don't retry if queue is large
          if (_q.length < 6) setTimeout(() => { _q.unshift({ url, headers, resolve }); _dispatch() }, 2000)
          else resolve([])
          return
        }
        resolve(res.ok ? await res.json().catch(() => []) : [])
      })
      .catch(() => { clearTimeout(timer); resolve([]) })
      .finally(() => { _running--; setTimeout(_dispatch, 350) })
  }
}

async function apiFetch(endpoint, params = {}) {
  // Use Supabase proxy if available (handles auth server-side)
  // Falls back to direct OpenF1 call (no auth, public data only)
  let urlStr
  if (PROXY_URL) {
    const proxyUrl = new URL(`${PROXY_URL}/v1${endpoint}`)
    Object.entries(params).forEach(([k, v]) => { if (v != null && v !== '') proxyUrl.searchParams.set(k, String(v)) })
    urlStr = proxyUrl.toString()
  } else {
    const directUrl = new URL(`${BASE}${endpoint}`)
    Object.entries(params).forEach(([k, v]) => { if (v != null && v !== '') directUrl.searchParams.set(k, String(v)) })
    urlStr = directUrl.toString()
  }
  return new Promise(resolve => { _q.push({ url: urlStr, headers: {}, resolve }); _dispatch() })
}

async function cached(endpoint, params, ttl) {
  const key = endpoint + JSON.stringify(params)
  const hit = cacheGet(key); if (hit !== null) return hit
  const data = await apiFetch(endpoint, params)
  cacheSet(key, data, ttl); return data
}

// Endpoints
export const getMeetings    = (year=2026) => cached('/meetings',            { year },              300_000)
export const getSessions    = (p={})      => cached('/sessions',            p,                     60_000)
export const getDrivers     = (sk='latest')=>cached('/drivers',             { session_key: sk },   300_000)
export const getPositions   = (sk='latest')=>cached('/position',            { session_key: sk },   4_000)
export const getLaps        = (sk,dn)     => cached('/laps',                { session_key:sk, driver_number:dn }, 8_000)
export const getAllLaps      = (sk='latest')=>cached('/laps',                { session_key: sk },   8_000)
export const getStints      = (sk='latest')=>cached('/stints',              { session_key: sk },   15_000)
export const getPitStops    = (sk='latest')=>cached('/pit',                 { session_key: sk },   15_000)
export const getIntervals   = (sk='latest')=>cached('/intervals',           { session_key: sk },   4_000)
export const getRaceControl = (sk='latest')=>cached('/race_control',        { session_key: sk },   8_000)
export const getTeamRadio   = (sk='latest')=>cached('/team_radio',          { session_key: sk },   20_000)
export const getCarData     = (sk,dn)     => cached('/car_data',            { session_key:sk, driver_number:dn }, 3_000)
export const getOvertakes   = (sk='latest')=>cached('/overtakes',           { session_key: sk },   15_000)
export const getWeatherRaw  = (sk='latest')=>cached('/weather',             { session_key: sk },   15_000)
export const getSessionResult     = (sk)  => cached('/session_result',      { session_key: sk },   300_000)
export const getStartingGrid      = (sk)  => cached('/starting_grid',       { session_key: sk },   300_000)
export const getChampionshipDrivers=(sk)  => cached('/championship_drivers',{ session_key: sk },   120_000)
export const getChampionshipTeams  =(sk)  => cached('/championship_teams',  { session_key: sk },   120_000)

// Helpers
export function fmt(s) { if (!s||s<=0) return '--:--.---'; const m=Math.floor(s/60); const sec=(s%60).toFixed(3).padStart(6,'0'); return m>0?`${m}:${sec}`:sec }
export function fmtGap(s) { if (!s||s<=0) return '—'; return s<60?`+${s.toFixed(3)}`:`+${Math.floor(s/60)}:${(s%60).toFixed(3).padStart(6,'0')}` }
export function flagUrl(code) { return code?`https://flagcdn.com/24x18/${code.toLowerCase()}.png`:null }

export async function getLatestSession() {
  try { const d = await cached('/sessions',{ session_key:'latest' },20_000); return Array.isArray(d)&&d[0]?d[0]:null } catch { return null }
}
export async function getWeather(sk='latest') {
  try { const d = await getWeatherRaw(sk); return Array.isArray(d)&&d.length?d[d.length-1]:null } catch { return null }
}

// Best session to show: current race weekend first, then most recent past session
export async function getBestRecentSession() {
  try {
    const all = await getSessions({ year: 2026 })
    if (!all?.length) return null
    const now = Date.now()
    const recent = all.filter(s => new Date(s.date_start)<now && new Date(s.date_start)>now-7*86400_000)
                      .sort((a,b)=>new Date(b.date_start)-new Date(a.date_start))
    if (recent.length) return recent[0]
    return all.filter(s=>new Date(s.date_start)<now).sort((a,b)=>new Date(b.date_start)-new Date(a.date_start))[0]??null
  } catch { return null }
}
export const getBestStandingsSession = () => getBestRecentSession()

export async function buildLiveStandings(session_key='latest') {
  const [positions,laps,intervals,drivers,stints,pits] = await Promise.all([
    getPositions(session_key).catch(()=>[]),
    getAllLaps(session_key).catch(()=>[]),
    getIntervals(session_key).catch(()=>[]),
    getDrivers(session_key).catch(()=>[]),
    getStints(session_key).catch(()=>[]),
    getPitStops(session_key).catch(()=>[]),
  ])
  const posMap={},drvMap={},stintMap={},lapMap={},intMap={},pitMap={}
  for(const p of positions??[]) if(!posMap[p.driver_number]||p.date>posMap[p.driver_number].date) posMap[p.driver_number]=p
  for(const d of drivers??[]) drvMap[d.driver_number]=d
  for(const s of stints??[]) if(!stintMap[s.driver_number]||s.stint_number>stintMap[s.driver_number].stint_number) stintMap[s.driver_number]=s
  for(const l of laps??[]) { if(!lapMap[l.driver_number]) lapMap[l.driver_number]=[]; lapMap[l.driver_number].push(l) }
  for(const i of intervals??[]) intMap[i.driver_number]=i
  for(const p of pits??[]) pitMap[p.driver_number]=(pitMap[p.driver_number]??0)+1

  let globalBest=null; const bestS=[null,null,null]
  for(const dl of Object.values(lapMap)) for(const l of dl) {
    if(l.lap_duration>0&&(!globalBest||l.lap_duration<globalBest)) globalBest=l.lap_duration
    if(l.duration_sector_1&&(!bestS[0]||l.duration_sector_1<bestS[0])) bestS[0]=l.duration_sector_1
    if(l.duration_sector_2&&(!bestS[1]||l.duration_sector_2<bestS[1])) bestS[1]=l.duration_sector_2
    if(l.duration_sector_3&&(!bestS[2]||l.duration_sector_3<bestS[2])) bestS[2]=l.duration_sector_3
  }

  let base = Object.values(posMap)
  if(!base.length) {
    const nums=[...new Set((laps??[]).map(l=>l.driver_number))]
    if(!nums.length&&drivers?.length) { for(const d of drivers) posMap[d.driver_number]={driver_number:d.driver_number,position:0} }
    else { const best={}; for(const l of laps??[]) if(l.lap_duration>0&&(!best[l.driver_number]||l.lap_duration<best[l.driver_number])) best[l.driver_number]=l.lap_duration; nums.sort((a,b)=>(best[a]??999)-(best[b]??999)).forEach((dn,i)=>{posMap[dn]={driver_number:dn,position:i+1}}) }
    base=Object.values(posMap)
  }

  return base.sort((a,b)=>(a.position||99)-(b.position||99)).map(p=>{
    const drv=drvMap[p.driver_number]??{},stint=stintMap[p.driver_number],dl=lapMap[p.driver_number]??[]
    const lastLap=dl[dl.length-1],bestLap=dl.reduce((b,l)=>(l.lap_duration>0&&(!b||l.lap_duration<b.lap_duration))?l:b,null)
    const iv=intMap[p.driver_number],lapNum=lastLap?.lap_number??0
    return {
      position:p.position,driver_number:p.driver_number,
      name_acronym:drv.name_acronym??`#${p.driver_number}`,full_name:drv.full_name??'',
      team_name:drv.team_name??'',team_colour:drv.team_colour??'555555',headshot_url:drv.headshot_url??null,
      tyre:stint?.compound??null,tyre_age:stint?lapNum-(stint.lap_start??0)+(stint.tyre_age_at_start??0):null,
      pit_stops:pitMap[p.driver_number]??0,last_lap:lastLap?.lap_duration??null,best_lap:bestLap?.lap_duration??null,
      is_personal_best:bestLap&&lastLap&&bestLap.lap_number===lastLap.lap_number,
      is_overall_best:lastLap?.lap_duration===globalBest&&globalBest!=null,
      lap_number:lapNum,gap_to_leader:iv?.gap_to_leader??null,interval:iv?.interval??null,
      is_pit_out_lap:lastLap?.is_pit_out_lap??false,
      sectors:lastLap?[lastLap.duration_sector_1,lastLap.duration_sector_2,lastLap.duration_sector_3]:[],
      best_sectors:bestS,segments:lastLap?[lastLap.segments_sector_1??[],lastLap.segments_sector_2??[],lastLap.segments_sector_3??[]]:[]
      ,all_laps:dl,
    }
  })
}

export async function buildHistoricalStandings(session_key) {
  try {
    const [result,drivers,stints]=await Promise.all([getSessionResult(session_key).catch(()=>null),getDrivers(session_key).catch(()=>[]),getStints(session_key).catch(()=>[])])
    if(!result?.length) return []
    const drvMap={},stintMap={}
    for(const d of drivers??[]) drvMap[d.driver_number]=d
    for(const s of stints??[]) if(!stintMap[s.driver_number]||s.stint_number>stintMap[s.driver_number].stint_number) stintMap[s.driver_number]=s
    return result.sort((a,b)=>(a.position||99)-(b.position||99)).map((r,i)=>{
      const drv=drvMap[r.driver_number]??{},stint=stintMap[r.driver_number]
      return {position:r.position??i+1,driver_number:r.driver_number,name_acronym:drv.name_acronym??r.name_acronym??`#${r.driver_number}`,full_name:drv.full_name??'',team_name:drv.team_name??r.team_name??'',team_colour:drv.team_colour??r.team_colour??'555555',headshot_url:drv.headshot_url??null,tyre:stint?.compound??null,tyre_age:null,pit_stops:r.number_of_pit_stops??0,last_lap:null,best_lap:r.time??null,is_personal_best:false,is_overall_best:r.position===1,lap_number:r.number_of_laps??0,gap_to_leader:r.gap_to_leader??null,interval:null,sectors:[],best_sectors:[null,null,null],segments:[],all_laps:[]}
    })
  } catch { return [] }
}
