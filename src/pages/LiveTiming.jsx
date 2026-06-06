import { useEffect, useState, useRef, useCallback, memo } from 'react'
import { Link } from 'react-router-dom'
import { Activity, RefreshCw, CloudRain, Thermometer, Zap, AlertTriangle, Radio, Wind, Gauge, TrendingUp, X } from 'lucide-react'
import {
  buildLiveStandings, buildHistoricalStandings, getLatestSession, getWeather, getRaceControl,
  getBestStandingsSession, getChampionshipDrivers, getChampionshipTeams,
  getDrivers, getTeamRadio, getOvertakes, getCarData, fmt, fmtGap
} from '../lib/openf1'
import { useAuth } from '../hooks/useAuth'
import styles from './LiveTiming.module.css'

const TYRE_COLOURS = { SOFT:'#e10600', MEDIUM:'#f5a623', HARD:'#d8d8d8', INTERMEDIATE:'#39a847', WET:'#0067ff' }
const TYRE_LABELS  = { SOFT:'S', MEDIUM:'M', HARD:'H', INTERMEDIATE:'I', WET:'W' }



// ── Car Telemetry Modal ──────────────────────────────────────────────────────
function TelemetryModal({ driver, session, onClose }) {
  const [data, setData] = useState(null)
  const ref = useRef(null)

  useEffect(() => {
    if (!session?.session_key || !driver?.driver_number) return
    const fetch_ = async () => {
      try {
        const d = await getCarData(session.session_key, driver.driver_number)
        if (d?.length) setData(d[d.length - 1])
      } catch {}
    }
    fetch_()
    ref.current = setInterval(fetch_, 2000)
    return () => clearInterval(ref.current)
  }, [session?.session_key, driver?.driver_number])

  if (!driver) return null
  const col = `#${driver.team_colour ?? 'aaaaaa'}`
  const drs = data?.drs
  const drsOn = drs === 10 || drs === 12 || drs === 14
  const drsElig = drs === 8

  return (
    <div style={{
      position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', zIndex:1000,
      display:'flex', alignItems:'center', justifyContent:'center',
    }} onClick={onClose}>
      <div style={{
        background:'var(--bg-1)', border:'1px solid var(--border)', borderRadius:12,
        padding:20, minWidth:280, maxWidth:340,
        borderTop:`3px solid ${col}`,
      }} onClick={e => e.stopPropagation()}>
        <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14}}>
          <div style={{display:'flex', alignItems:'center', gap:10}}>
            <span style={{
              width:32, height:32, borderRadius:'50%', background:col,
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:'0.72rem', fontWeight:900, color:'#fff', fontFamily:'monospace',
            }}>{driver.driver_number}</span>
            <div>
              <div style={{fontWeight:800, fontSize:'0.95rem'}}>{driver.name_acronym}</div>
              <div style={{fontSize:'0.68rem', color:'var(--text-3)'}}>{driver.team_name}</div>
            </div>
          </div>
          <button onClick={onClose} style={{color:'var(--text-3)', padding:4}}><X size={16}/></button>
        </div>

        {!data ? (
          <div style={{textAlign:'center', padding:'20px 0', color:'var(--text-3)', fontSize:'0.8rem'}}>
            {session ? 'Fetching telemetry…' : 'No live session'}
          </div>
        ) : (
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
            {/* Speed */}
            <div style={{background:'var(--bg-2)', borderRadius:8, padding:'10px 12px'}}>
              <div style={{fontSize:'0.58rem', color:'var(--text-3)', letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:2}}>Speed</div>
              <div style={{fontSize:'1.5rem', fontWeight:900, fontFamily:'monospace', color:'#fff'}}>{data.speed ?? '—'}</div>
              <div style={{fontSize:'0.62rem', color:'var(--text-3)'}}>km/h</div>
            </div>
            {/* RPM */}
            <div style={{background:'var(--bg-2)', borderRadius:8, padding:'10px 12px'}}>
              <div style={{fontSize:'0.58rem', color:'var(--text-3)', letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:2}}>RPM</div>
              <div style={{fontSize:'1.5rem', fontWeight:900, fontFamily:'monospace', color:'#fff'}}>{data.rpm ? (data.rpm/1000).toFixed(1) : '—'}</div>
              <div style={{fontSize:'0.62rem', color:'var(--text-3)'}}>×1000</div>
            </div>
            {/* Gear */}
            <div style={{background:'var(--bg-2)', borderRadius:8, padding:'10px 12px'}}>
              <div style={{fontSize:'0.58rem', color:'var(--text-3)', letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:2}}>Gear</div>
              <div style={{fontSize:'1.5rem', fontWeight:900, fontFamily:'monospace', color: data?.n_gear === 0 ? 'var(--text-3)' : col}}>
                {data.n_gear === 0 ? 'N' : data.n_gear ?? '—'}
              </div>
            </div>
            {/* DRS */}
            <div style={{background: drsOn ? 'rgba(57,217,138,0.12)' : 'var(--bg-2)', borderRadius:8, padding:'10px 12px', border: drsOn ? '1px solid rgba(57,217,138,0.4)' : '1px solid transparent'}}>
              <div style={{fontSize:'0.58rem', color:'var(--text-3)', letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:2}}>DRS</div>
              <div style={{fontSize:'1rem', fontWeight:900, color: drsOn ? '#39d98a' : drsElig ? '#f5a623' : 'var(--text-3)'}}>
                {drsOn ? '✓ OPEN' : drsElig ? '~ ELIGIBLE' : '✗ CLOSED'}
              </div>
            </div>
            {/* Throttle bar */}
            <div style={{background:'var(--bg-2)', borderRadius:8, padding:'10px 12px', gridColumn:'span 2'}}>
              <div style={{display:'flex', justifyContent:'space-between', marginBottom:4}}>
                <span style={{fontSize:'0.58rem', color:'var(--text-3)', letterSpacing:'0.08em', textTransform:'uppercase'}}>Throttle</span>
                <span style={{fontSize:'0.72rem', fontFamily:'monospace', color:'#39d98a', fontWeight:700}}>{data.throttle ?? 0}%</span>
              </div>
              <div style={{height:6, borderRadius:3, background:'rgba(255,255,255,0.08)'}}>
                <div style={{height:'100%', borderRadius:3, background:'#39d98a', width:`${data.throttle ?? 0}%`, transition:'width 0.3s'}} />
              </div>
            </div>
            {/* Brake */}
            <div style={{background: data.brake ? 'rgba(225,6,0,0.1)' : 'var(--bg-2)', borderRadius:8, padding:'10px 12px', gridColumn:'span 2', border: data.brake ? '1px solid rgba(225,6,0,0.3)' : '1px solid transparent'}}>
              <div style={{display:'flex', justifyContent:'space-between', marginBottom:4}}>
                <span style={{fontSize:'0.58rem', color:'var(--text-3)', letterSpacing:'0.08em', textTransform:'uppercase'}}>Brake</span>
                <span style={{fontSize:'0.72rem', fontFamily:'monospace', color: data.brake ? 'var(--red)' : 'var(--text-3)', fontWeight:700}}>{data.brake ? 'BRAKING' : 'OFF'}</span>
              </div>
              <div style={{height:6, borderRadius:3, background:'rgba(255,255,255,0.08)'}}>
                <div style={{height:'100%', borderRadius:3, background:'var(--red)', width: data.brake ? '100%' : '0%', transition:'width 0.2s'}} />
              </div>
            </div>
          </div>
        )}

        <div style={{marginTop:10, fontSize:'0.62rem', color:'rgba(255,255,255,0.15)', textAlign:'center'}}>
          Live telemetry · 3.7Hz · click outside to close
        </div>
      </div>
    </div>
  )
}

const CIRCUIT_SLUGS = {
  'Monaco':'monaco','Monte Carlo':'monaco','Monte-Carlo':'monaco',
  'Silverstone':'silverstone','Monza':'monza','Spa':'spa','Spa-Francorchamps':'spa',
  'Suzuka':'suzuka','Albert Park':'albert_park','Melbourne':'albert_park',
  'Sakhir':'bahrain','Bahrain':'bahrain','Jeddah':'jeddah','Saudi Arabia':'jeddah',
  'Miami':'miami','Miami Gardens':'miami',
  'Imola':'imola','Emilia Romagna':'imola',
  'Barcelona':'barcelona','Catalunya':'barcelona',
  'Budapest':'budapest','Hungaroring':'budapest',
  'Zandvoort':'zandvoort','Netherlands':'zandvoort',
  'Baku':'baku','Azerbaijan':'baku',
  'Singapore':'singapore',
  'Austin':'austin','COTA':'austin','United States':'austin',
  'Mexico City':'mexico','Mexico':'mexico',
  'Spielberg':'spielberg','Red Bull Ring':'spielberg','Austria':'spielberg',
  'Yas Marina':'yas_marina','Abu Dhabi':'yas_marina',
  'Las Vegas':'las_vegas',
  'Lusail':'losail','Losail':'losail','Qatar':'losail',
  'São Paulo':'sao_paulo','Sao Paulo':'sao_paulo','Interlagos':'sao_paulo','Brazil':'sao_paulo',
  'Montréal':'villeneuve','Montreal':'villeneuve','Villeneuve':'villeneuve','Canada':'villeneuve',
  'Shanghai':'shanghai','China':'shanghai',
}
function getCircuitSlug(name) {
  if (!name) return null
  // Direct match
  if (CIRCUIT_SLUGS[name]) return CIRCUIT_SLUGS[name]
  // Case-insensitive scan
  const lower = name.toLowerCase()
  for (const [key, val] of Object.entries(CIRCUIT_SLUGS)) {
    if (key.toLowerCase() === lower) return val
    if (lower.includes(key.toLowerCase())) return val
    if (key.toLowerCase().includes(lower)) return val
  }
  // Last resort: sanitize the name itself
  return lower.replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'') || null
}


// ── Track Map Panel ───────────────────────────────────────────────────────────
function TrackMapPanel({ session, positions, drvMap, isPremium, styles }) {
  const circuitName = session?.circuit_short_name ?? session?.country_name ?? session?.meeting_name ?? ''
  let slug = getCircuitSlug(circuitName)
  const imgUrl = slug ? `https://formula-timer.com/circuits/${slug}.png` : null

  // Normalize positions to 0–100% for CSS overlay
  const pts = Object.values(positions).filter(p => p.x && p.y)
  let normPos = {}
  if (isPremium && pts.length >= 3) {
    const xs = pts.map(p => p.x), ys = pts.map(p => p.y)
    const xMin = Math.min(...xs), xMax = Math.max(...xs)
    const yMin = Math.min(...ys), yMax = Math.max(...ys)
    for (const [dn, pos] of Object.entries(positions)) {
      if (!pos.x || !pos.y) continue
      normPos[dn] = {
        left: `${((pos.x - xMin) / (xMax - xMin || 1)) * 86 + 7}%`,
        top:  `${(1 - (pos.y - yMin) / (yMax - yMin || 1)) * 86 + 7}%`,
      }
    }
  }

  return (
    <div className={styles.rpMapWrap}>
      <div className={styles.mapToggles}>
        <span className={styles.mapSessionLabel} style={{marginRight:'auto', textTransform:'uppercase', letterSpacing:'0.1em'}}>
          {circuitName?.split(' ')[0] || 'TRACK MAP'}
        </span>
        {session?.session_name && <span style={{fontSize:'0.6rem',color:'rgba(255,255,255,0.3)',fontFamily:'var(--font-mono)'}}>{session.session_name}</span>}
        {isPremium && Object.keys(positions).length > 0 && (
          <span style={{fontSize:'0.6rem',color:'#39d98a',fontFamily:'var(--font-mono)',marginLeft:6}}>● {Object.keys(positions).length} live</span>
        )}
      </div>

      <div style={{flex:1, position:'relative', minHeight:0, overflow:'hidden'}}>
        {imgUrl
          ? <img src={imgUrl} alt={circuitName} style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'contain',objectPosition:'center',padding:'10px'}} onError={e=>e.target.style.display='none'} />
          : <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',color:'rgba(255,255,255,0.12)',fontSize:'0.75rem'}}>No circuit data</div>
        }

        {/* Live car dots — Pro only */}
        {isPremium && Object.entries(normPos).map(([dn, pos]) => {
          const drv = drvMap[Number(dn)]
          if (!drv) return null
          const col = `#${drv.team_colour ?? 'aaaaaa'}`
          return (
            <div key={dn} style={{position:'absolute',left:pos.left,top:pos.top,transform:'translate(-50%,-50%)',zIndex:10}}>
              <div style={{width:20,height:20,borderRadius:'50%',background:col,border:'2px solid #000',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'6px',fontWeight:900,color:'#fff',fontFamily:'monospace',boxShadow:`0 0 5px ${col}88`}}>
                {drv.name_acronym?.slice(0,3)}
              </div>
            </div>
          )
        })}

        {imgUrl && !isPremium && Object.keys(positions).length === 0 && (
          <div className={styles.mapNoData}>
            <span style={{color:'var(--gold)',fontSize:'0.7rem'}}>⚡ Pro for live car tracking</span>
          </div>
        )}
        {imgUrl && isPremium && Object.keys(positions).length === 0 && (
          <div className={styles.mapNoData}>Waiting for live position data…</div>
        )}
      </div>

      <div className={styles.mapLegend}>
        <div className={styles.mapLegendItem}><div className={styles.mapLegendLine} style={{background:'#3671C6'}}/> S1</div>
        <div className={styles.mapLegendItem}><div className={styles.mapLegendLine} style={{background:'#E8002D'}}/> S2</div>
        <div className={styles.mapLegendItem}><div className={styles.mapLegendLine} style={{background:'#FF8000'}}/> S3</div>
        <div className={styles.mapLegendItem}><div className={styles.mapLegendLine} style={{background:'#39d98a'}}/> DRS</div>
      </div>
    </div>
  )
}

// ── Right panel: full track map with toggles + team radio + race control ──────
function RightPanel({ session, standings, rc, radio, isPremium }) {
  const [tab, setTab] = useState('map')
  const [positions, setPositions] = useState({})
  // radio state now in parent LiveTiming
  const pollRef = useRef(null)

  // ── Fetch live car positions ──────────────────────────────────────────────
  const fetchPos = useCallback(async () => {
    if (!session?.session_key) return
    try {
      const supaUrl  = import.meta.env.VITE_SUPABASE_URL
      const supaAnon = import.meta.env.VITE_SUPABASE_ANON_KEY
      let headers = {}
      if (supaUrl && supaAnon) {
        try {
          const tokenRes = await fetch(`${supaUrl}/functions/v1/openf1-token`, { method:'POST', headers:{ Authorization:`Bearer ${supaAnon}` } })
          if (tokenRes.ok) { const { access_token } = await tokenRes.json(); if (access_token) headers.Authorization = `Bearer ${access_token}` }
        } catch {}
      }
      // Try live positions first (last 8 seconds)
      const now = new Date()
      const from = new Date(now - 8000).toISOString()
      const liveRes = await fetch(`https://api.openf1.org/v1/location?session_key=${session.session_key}&date>${from}`, { headers })
      if (liveRes.ok) {
        const raw = await liveRes.json()
        if (raw?.length) {
          const latest = {}
          for (const p of raw) if (!latest[p.driver_number] || p.date > latest[p.driver_number].date) latest[p.driver_number] = p
          setPositions(latest)
          return
        }
      }
      // No live data — try fetching last known positions for this session (last 60s window)
      const fromWide = new Date(now - 60000).toISOString()
      const histRes = await fetch(`https://api.openf1.org/v1/location?session_key=${session.session_key}&date>${fromWide}`, { headers })
      if (histRes.ok) {
        const raw = await histRes.json()
        if (raw?.length) {
          const latest = {}
          for (const p of raw) if (!latest[p.driver_number] || p.date > latest[p.driver_number].date) latest[p.driver_number] = p
          setPositions(latest)
        }
      }
    } catch {}
  }, [session])

  useEffect(() => {
    if (!session?.session_key) return
    fetchPos()
    const posInterval = isPremium ? 2000 : 5000
    pollRef.current = setInterval(fetchPos, posInterval)
    return () => clearInterval(pollRef.current)
  }, [session?.session_key, fetchPos, isPremium])

  const drvMap = {}
  for (const d of standings) drvMap[d.driver_number] = d


  return (
    <div className={styles.rightPanel}>
      {/* Right panel is now ONLY the track map - Radio/RC moved to bottom panels */}
      <TrackMapPanel session={session} positions={positions} drvMap={drvMap} isPremium={isPremium} styles={styles} />

    </div>
  )
}


// Tyre compound images from formula-timer.com
const TYRE_IMG_SLUGS = { SOFT:'soft', MEDIUM:'medium', HARD:'hard', INTERMEDIATE:'intermediate', WET:'wet' }

function TyreChip({ compound, age }) {
  if (!compound) return <span className={styles.dash}>—</span>
  const k = compound.toUpperCase()
  const slug = TYRE_IMG_SLUGS[k]
  const col = TYRE_COLOURS[k] ?? '#888'
  const [imgFailed, setImgFailed] = useState(false)
  return (
    <span className={styles.tyreChip}>
      {slug && !imgFailed
        ? <img
            src={`https://formula-timer.com/tyres/${slug}.svg`}
            alt={k}
            className={styles.tyreImg}
            onError={() => setImgFailed(true)}
          />
        : <span className={styles.tyreDot} style={{ background: col }} />
      }
      {age != null && <span className={styles.tyreAge}>{age}</span>}
    </span>
  )
}

function RCBadge({ msg }) {
  const f = msg.flag
  if (f === 'RED')    return <span className={`${styles.flagBadge} ${styles.flagRed}`}>🔴 RED FLAG</span>
  if (f === 'SAFETY CAR' || msg.category === 'SafetyCar') return <span className={`${styles.flagBadge} ${styles.flagSc}`}>🚗 SAFETY CAR</span>
  if (f === 'VIRTUAL SAFETY CAR') return <span className={`${styles.flagBadge} ${styles.flagSc}`}>VSC</span>
  if (f === 'YELLOW' || f === 'DOUBLE YELLOW') return <span className={`${styles.flagBadge} ${styles.flagYellow}`}>⚠ YELLOW</span>
  if (f === 'GREEN')     return <span className={`${styles.flagBadge} ${styles.flagGreen}`}>🟢 CLEAR</span>
  if (f === 'CHEQUERED') return <span className={`${styles.flagBadge} ${styles.flagGreen}`}>🏁 CHEQUERED</span>
  return null
}
function Segs({ segments, styles: s }) {
  if (!segments?.some(sg => sg?.length > 0)) return <span className={s.dash}>—</span>
  return (
    <div className={s.segRow}>
      {[0,1,2].map(si => (
        <div key={si} className={s.segGroup}>
          {(segments[si] ?? []).slice(0,8).map((v, j) => {
            const sc = v===2051?s.segPurple:v===2049?s.segGreen:v===2064?s.segPit:s.segYellow
            return <span key={j} className={`${s.seg} ${sc}`} />
          })}
        </div>
      ))}
    </div>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function LiveTiming() {
  const { isPremium } = useAuth()
  const [standings,   setStandings]   = useState([])
  const [session,     setSession]     = useState(null)
  const sessionRef = useRef(null)  // ref so radio can always access latest session
  const [weather,     setWeather]     = useState(null)
  const [rc,          setRc]          = useState([])
  const [loading,     setLoading]     = useState(true)
  const [lastUpdate,  setLastUpdate]  = useState(null)
  const [error,       setError]       = useState(null)
  const [compact,     setCompact]     = useState(false)
  const [drvChamp,    setDrvChamp]    = useState([])
  const [teamChamp,   setTeamChamp]   = useState([])
  const [champLoaded, setChampLoaded] = useState(false)
  const [selDriver,   setSelDriver]   = useState(null)  // for telemetry modal
  const [overtakes,   setOvertakes]   = useState([])
  const [radio,       setRadio]       = useState([])    // team radio - top level so it persists
  const intervalRef = useRef(null)

  // Track if component is still mounted to avoid state updates after unmount
  const mountedRef = useRef(true)
  useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false } }, [])

  const fetchLive = useCallback(async () => {
    if (!mountedRef.current) return
    // Only show loading spinner on first load (no existing standings)
    try {
      // Step 1: Get session (fast - cached after first call)
      const sess = await getLatestSession()
      const sk = sess?.session_key ?? 'latest'

      // Step 2: Fetch standings + weather + RC in parallel (not sequential)
      const [standing, wthr, rcData] = await Promise.all([
        buildLiveStandings(sk).catch(() => []),
        getWeather(sk).catch(() => null),
        getRaceControl(sk).catch(() => []),
      ])

      if (!mountedRef.current) return

      // Step 3: If no live standings, try fallback (one attempt only, no chain)
      let finalStanding = standing ?? []
      let finalSession = sess

      if (!finalStanding.length) {
        const bestSess = await getBestStandingsSession(2026).catch(() => null)
        if (bestSess && mountedRef.current) {
          finalStanding = await buildHistoricalStandings(bestSess.session_key).catch(() => [])
          finalSession = bestSess
        }
      } else {
        finalSession = sess
      }

      if (!mountedRef.current) return

      // Step 4: Fix #NNN driver names (drivers should be in standings already from buildLiveStandings)
      // Only do driver lookup if genuinely missing
      if (finalStanding.some(d => d.name_acronym?.startsWith('#'))) {
        const drvs = await getDrivers(sk).catch(() => [])
        if (drvs?.length) {
          const dm = {}; for (const d of drvs) dm[d.driver_number] = d
          finalStanding = finalStanding.map(d => dm[d.driver_number]
            ? { ...d, name_acronym: dm[d.driver_number].name_acronym, team_name: dm[d.driver_number].team_name, team_colour: dm[d.driver_number].team_colour }
            : d
          )
        }
      }

      if (!mountedRef.current) return
      setSession(finalSession)
      sessionRef.current = finalSession
      setWeather(wthr)
      setRc(rcData || [])
      // Merge standings to avoid full re-render when only some values change
      setStandings(prev => {
        if (!prev.length) return finalStanding
        // Same length and same driver order = update in place
        if (prev.length === finalStanding.length &&
            prev.every((p, i) => p.driver_number === finalStanding[i]?.driver_number)) {
          return finalStanding // React diffs by key(driver_number), only changed rows re-render
        }
        return finalStanding
      })
      setLastUpdate(new Date())
      setError(null)
    } catch { if (mountedRef.current) setError('Could not load timing data') }
    finally { if (mountedRef.current) { setLoading(false) } }
  }, [])

  const fetchChamp = useCallback(async () => {
    try {
      const sess = await getBestStandingsSession(2026)
      if (!sess) return
      const driverList = await getDrivers(sess.session_key)
      const drvMap = {}; for (const d of driverList) drvMap[d.driver_number] = d
      const cd = await getChampionshipDrivers(sess.session_key).catch(()=>[])
      const ct = await getChampionshipTeams(sess.session_key).catch(()=>[])
      if (cd?.length) setDrvChamp(cd.sort((a,b)=>a.position_current-b.position_current).slice(0,10).map(c=>({
        pos:c.position_current, name:drvMap[c.driver_number]?.full_name??`#${c.driver_number}`,
        acronym:drvMap[c.driver_number]?.name_acronym??'???', colour:drvMap[c.driver_number]?.team_colour??'555555', pts:c.points_current??0
      })))
      if (ct?.length) setTeamChamp(ct.sort((a,b)=>a.position_current-b.position_current).slice(0,11).map(c=>{
        const td = driverList.find(d=>d.team_name===c.team_name)
        return { pos:c.position_current, team:c.team_name, colour:td?.team_colour??'555555', pts:c.points_current??0 }
      }))
      setChampLoaded(true)
    } catch {}
  }, [])

  useEffect(() => {
    // Initial load
    fetchLive()
    // Delay championship to not block initial render
    const champTimer = setTimeout(fetchChamp, 3000)
    
    // Fetch radio on its own slow interval (30s) - state lives here so it persists
    async function doRadio() {
      if (!mountedRef.current) return
      try {
        const sk = sessionRef.current?.session_key
        if (!sk) return
        const r = await getTeamRadio(sk)
        if (mountedRef.current && r?.length) setRadio(prev => {
          // Merge new messages, keeping most recent 25
          const existing = new Set(prev.map(x => x.date + x.driver_number))
          const newMsgs = (r || []).filter(x => !existing.has(x.date + x.driver_number))
          return [...newMsgs, ...prev].slice(0, 25)
        })
      } catch {}
    }
    // Fire radio fetch after session loads (delay 5s), then every 20s
    const radioInitTimer = setTimeout(doRadio, 5000)
    const radioTimer = setInterval(doRadio, 20000)
    
    // Polling: Pro = 5s (fast enough, safe on rate limits), Free = 20s
    const ms = isPremium ? 5000 : 20000
    intervalRef.current = setInterval(fetchLive, ms)
    
    return () => {
      clearInterval(intervalRef.current)
      clearTimeout(champTimer)
      clearTimeout(radioInitTimer)
      clearInterval(radioTimer)
    }
  }, [isPremium, fetchLive, fetchChamp])

  const rcReversed = [...rc].reverse()
  const latestFlag = rcReversed.find(m => ['RED','YELLOW','DOUBLE YELLOW','GREEN','SAFETY CAR','VIRTUAL SAFETY CAR','CHEQUERED'].includes(m.flag) || m.category==='SafetyCar')

  return (
    <div className={styles.root}>

      {/* ── Top bar: session info + weather ── */}
      <div className={styles.topBar}>
        <div className={styles.topBarInner}>
          <div className={styles.topLeft}>
            {session ? (
              <>
                <span className={styles.sessionDot} />
                <span className={styles.sessionType}>{session.session_name}</span>
                {(session.circuit_short_name || session.meeting_name) && (
                  <span className={styles.sessionCircuit}>
                    {session.circuit_short_name ?? session.meeting_name}
                  </span>
                )}
                {weather && (
                  <span className={styles.weatherInline}>
                    <Thermometer size={11} style={{color:'#ff8800',opacity:0.8}} />
                    <span>{weather.track_temperature?.toFixed(1) ?? '—'}°</span>
                    <span className={styles.wLabel}>TRC</span>
                    <Thermometer size={11} style={{color:'#4488ff',opacity:0.8}} />
                    <span>{weather.air_temperature?.toFixed(1) ?? '—'}°</span>
                    <span className={styles.wLabel}>AIR</span>
                    <span>{weather.humidity ?? '—'}%</span>
                    <span className={styles.wLabel}>HUM</span>
                    {weather.wind_speed != null && <>
                      <Wind size={10} style={{opacity:0.6}} />
                      <span>{weather.wind_speed}</span>
                      <span className={styles.wLabel}>M/S</span>
                    </>}
                    {weather.pressure != null && <>
                      <Gauge size={10} style={{opacity:0.6}} />
                      <span>{weather.pressure?.toFixed(0)}</span>
                      <span className={styles.wLabel}>hPa</span>
                    </>}
                    {weather.rainfall > 0 && <span className={styles.wetBadge}><CloudRain size={10} /> WET</span>}
                  </span>
                )}
              </>
            ) : <span className={styles.noSession}>No live session — showing last session</span>}
          </div>
          <div className={styles.topRight}>
            <button className={`${styles.toggle} ${compact?styles.toggleOn:''}`} onClick={()=>setCompact(v=>!v)} style={{fontSize:'0.62rem',padding:'2px 8px',marginRight:8}}>Compact</button>
            {latestFlag && <RCBadge msg={latestFlag} />}
            {!isPremium && <Link to="/premium" className={styles.proBadge}><Zap size={10} /> Pro</Link>}
            {overtakes.length > 0 && (
              <span style={{fontSize:'0.62rem',color:'var(--text-3)',display:'flex',alignItems:'center',gap:3}}>
                <TrendingUp size={10}/> {overtakes.length} OT
              </span>
            )}
            <span className={styles.updateInfo}>
              <RefreshCw size={10} className={loading ? styles.spinning : ''} />
              {lastUpdate?.toLocaleTimeString('en-GB',{hour12:false})}
            </span>
            <button className="btn btn-ghost btn-sm" style={{padding:'3px 8px'}} onClick={fetchLive}>
              <RefreshCw size={11} />
            </button>
          </div>
        </div>
      </div>



      {/* ── Main area: timing table LEFT + right panel RIGHT ── */}
      <div className={styles.mainRow}>

        {/* Timing table */}
        <div className={styles.tableCol}>
          {loading ? (
            <div className="spinner-wrap"><div className="spinner" /></div>
          ) : error ? (
            <div className={styles.emptyState}><AlertTriangle size={28} style={{color:'var(--text-3)',marginBottom:8}} /><p>{error}</p></div>
          ) : standings.length === 0 ? (
            <div className={styles.emptyState}><Activity size={28} style={{color:'var(--text-3)',marginBottom:8}} /><p>Loading last session data…</p></div>
          ) : (() => {
            const COLS = (
              <colgroup>
                <col style={{width:28}}/>
                <col style={{width:34}}/>
                <col style={{width:120}}/>
                <col style={{width:72}}/>
                <col style={{width:52}}/>
                <col style={{width:72}}/>
                <col style={{width:68}}/>
                <col style={{width:72}}/>
                {isPremium && <col style={{width:90}}/>}
                <col style={{width:58}}/>
                <col style={{width:58}}/>
                <col style={{width:58}}/>
                {isPremium && <><col style={{width:58}}/><col style={{width:58}}/><col style={{width:58}}/><col style={{width:38}}/></>}
                <col style={{width:34}}/>
              </colgroup>
            )
            return (
            <>
            {/* Fixed header — overflow:hidden so no scrollbar, JS syncs scroll with body */}
            <div className={styles.tableHead} id="lt-hdr">
              <table className={styles.table} style={{tableLayout:'fixed'}}>
                {COLS}
                <thead>
                  <tr>
                    <th></th>
                    <th style={{textAlign:'center'}}>#</th>
                    <th>DRIVER</th>
                    <th>INTERVAL</th>
                    <th>TYRE</th>
                    <th>BEST LAP</th>
                    <th>LEADER</th>
                    <th>LAST LAP</th>
                    {isPremium && <th className={styles.hideMobile}>MINI SECTORS</th>}
                    <th className={styles.hideMobile} style={{textAlign:'right',color:'#3671C6'}}>S1</th>
                    <th className={styles.hideMobile} style={{textAlign:'right',color:'#E8002D'}}>S2</th>
                    <th className={styles.hideMobile} style={{textAlign:'right',color:'#FF8000'}}>S3</th>
                    {isPremium && <>
                      <th className={styles.hideTablet} style={{textAlign:'right',color:'#3671C6',opacity:0.5}}>S1<sup>pb</sup></th>
                      <th className={styles.hideTablet} style={{textAlign:'right',color:'#E8002D',opacity:0.5}}>S2<sup>pb</sup></th>
                      <th className={styles.hideTablet} style={{textAlign:'right',color:'#FF8000',opacity:0.5}}>S3<sup>pb</sup></th>
                      <th className={styles.hideTablet} style={{textAlign:'right',opacity:0.5}}>ST</th>
                    </>}
                    <th style={{textAlign:'right'}}>LAP</th>
                  </tr>
                </thead>
              </table>
            </div>
            {/* Scrollable body — when scrolled, syncs to header above */}
            <div className={styles.tableScroll} onScroll={e => {
              const h = document.getElementById('lt-hdr')
              if (h) h.scrollLeft = e.currentTarget.scrollLeft
            }}>
              <table className={`${styles.table} ${compact?styles.compact:''}`} style={{tableLayout:'fixed'}}>
                {COLS}
                <tbody>
                  {standings.map((d, i) => {
                    const isP1  = i === 0
                    const isPit = d.is_pit_out_lap
                    const isBestOverall = d.is_overall_best
                    return (
                      <tr key={d.driver_number} className={`${styles.row} ${isPit?styles.rowPit:''} ${isP1?styles.rowP1:''}`}>

                        <td className={styles.tdPit}>
                          {d.pit_stops > 0 && <span className={styles.pitTag}>PIT</span>}
                        </td>

                        <td className={styles.tdPos}>
                          <span className={styles.posNum} style={{color:`#${d.team_colour}`,borderColor:`#${d.team_colour}`}}>
                            {d.position}
                          </span>
                        </td>

                        <td className={styles.tdDriver} onClick={() => isPremium && setSelDriver(d)} style={{cursor: isPremium ? 'pointer' : 'default'}} title={isPremium ? 'Click for live telemetry' : 'Pro feature'}>
                          <span className={styles.teamBar} style={{background:`#${d.team_colour}`}} />
                          <div>
                            <div className={styles.acronym}>{d.name_acronym}</div>
                            <div className={styles.teamShort}>{d.team_name?.replace('F1 Team','').replace('Racing','').replace('Scuderia','').trim().split(' ')[0]}</div>
                          </div>
                        </td>

                        <td className={`mono ${styles.tdNum}`}>
                          {isP1
                            ? <span className={styles.intervalLbl}>Interval</span>
                            : <span className={styles.intervalVal}>{fmtGap(d.interval)}</span>
                          }
                        </td>

                        <td><TyreChip compound={d.tyre} age={d.tyre_age} /></td>

                        <td className={`mono ${isBestOverall?styles.purple:styles.dimTime}`}>{fmt(d.best_lap)}</td>

                        <td className={`mono ${styles.tdNum} ${styles.dimTime}`}>
                          {isP1
                            ? <span className={styles.leaderLbl}>Leader</span>
                            : fmtGap(d.gap_to_leader)
                          }
                        </td>

                        <td className={`mono ${d.is_personal_best?styles.green:styles.dimTime}`}>{fmt(d.last_lap)}</td>

                        {/* Mini sector segments */}
                        {isPremium && (
                          <td className={`${styles.tdMini} ${styles.hideMobile}`}>
                            <Segs segments={d.segments} styles={styles} />
                          </td>
                        )}

                        {/* Last sectors — S1, S2, S3 as individual cells */}
                        {[0,1,2].map(si => {
                          const SCOL = ['#3671C6','#E8002D','#FF8000'][si]
                          const val = d.sectors?.[si]
                          const isSB = val && d.best_sectors?.[si] && Math.abs(val - d.best_sectors[si]) < 0.001
                          const isSessionBest = val && val === Math.min(...standings.map(x=>x.sectors?.[si]).filter(Boolean))
                          return (
                            <td key={`ls${si}`} className={`mono ${styles.tdSecCell} ${styles.hideMobile}`}>
                              {val
                                ? <span style={{color: isSB ? '#b45cf4' : isSessionBest ? '#39d98a' : SCOL, fontWeight: isSB||isSessionBest ? 800 : 400, opacity: isSB||isSessionBest ? 1 : 0.8}}>
                                    {val.toFixed(3)}
                                  </span>
                                : <span className={styles.dash}>—</span>
                              }
                            </td>
                          )
                        })}

                        {/* Best sectors — Pro only */}
                        {isPremium && [0,1,2].map(si => {
                          const val = d.best_sectors?.[si]
                          return (
                            <td key={`bs${si}`} className={`mono ${styles.tdSecCell} ${styles.tdSecBest} ${styles.hideTablet}`}>
                              {val
                                ? <span style={{color: '#b45cf4', opacity: 0.75}}>{val.toFixed(3)}</span>
                                : <span className={styles.dash}>—</span>
                              }
                            </td>
                          )
                        })}

                        {isPremium && (
                          <td className={`mono ${styles.tdSpeed} ${styles.hideTablet}`} title="Speed trap km/h">
                            {d.all_laps?.at(-1)?.st_speed
                              ? <span style={{color:'rgba(255,255,255,0.5)',fontSize:'0.72rem'}}>{d.all_laps.at(-1).st_speed}</span>
                              : <span className={styles.dash}>—</span>}
                          </td>
                        )}
                        <td className={`mono ${styles.tdLap}`}>{d.lap_number||'—'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            </>
            )
          })}
        </div>

        {/* Right panel: track map / team radio / race control */}
        {/* Always render RightPanel so tab state persists across refreshes */}
        <RightPanel session={session} standings={standings} rc={rc} radio={radio} isPremium={isPremium} />
      </div>

      {/* ── Bottom panels: Radio | Race Control | Penalties ── */}
      <div className={styles.bottomPanels}>

        {/* Team Radio */}
        <div className={styles.champPanel}>
          <div className={styles.champTitle} style={{display:'flex',alignItems:'center',gap:6}}>
            <Radio size={11}/> TEAM RADIO
            {!isPremium && <span style={{fontSize:'0.55rem',color:'var(--gold)',marginLeft:'auto'}}>⚡ PRO</span>}
          </div>
          {radio.length === 0 ? (
            <div className={styles.champLoading}>{isPremium ? 'No radio messages yet' : 'Pro feature'}</div>
          ) : (
            <div style={{overflowY:'auto',height:148}}>
              {radio.map((r, i) => {
                const drv = standings.find(d => d.driver_number === r.driver_number)
                const col = `#${drv?.team_colour ?? '555'}`
                return (
                  <div key={i} className={styles.radioRow}>
                    <span className={styles.radioAcr} style={{color:col}}>{drv?.name_acronym ?? `#${r.driver_number}`}</span>
                    {r.recording_url
                      ? <audio src={r.recording_url} controls className={styles.radioAudio} />
                      : <span className={styles.radioNoAudio}>No audio</span>
                    }
                    <span className={styles.radioTs}>{r.date ? new Date(r.date).toLocaleTimeString('en-GB',{hour12:false,hour:'2-digit',minute:'2-digit'}) : ''}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Race Control */}
        <div className={styles.champPanel}>
          <div className={styles.champTitle}>RACE CONTROL</div>
          {rc.length === 0 ? (
            <div className={styles.champLoading}>No messages</div>
          ) : (
            <div style={{overflowY:'auto',height:148}}>
              {[...rc].reverse().slice(0,80).map((m, i) => (
                <div key={i} className={`${styles.rcRow} ${m.flag==='RED'?styles.rcRed:m.flag?.includes('YELLOW')?styles.rcYellow:m.flag==='GREEN'||m.flag==='CHEQUERED'?styles.rcGreen:m.category==='SafetyCar'?styles.rcOrange:''}`}>
                  <span className={styles.rcTs}>{m.date?new Date(m.date).toLocaleTimeString('en-GB',{hour12:false,hour:'2-digit',minute:'2-digit'}):''}</span>
                  <span className={styles.rcTxt}>{m.message}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Penalties */}
        <div className={`${styles.champPanel} ${styles.champPenalties}`}>
          <div className={styles.champTitle} style={{color:'var(--red)'}}>PENALTIES</div>
          {(() => {
            const pens = rc.filter(m => m.category==='CarEvent'&&(m.message?.includes('PENALTY')||m.message?.includes('DRIVE THROUGH')||m.message?.includes('STOP GO')))
            const tls  = rc.filter(m => m.message?.toLowerCase().includes('track limit')||m.message?.toLowerCase().includes('deleted')||m.message?.toLowerCase().includes('time deleted'))
            const all  = [...pens, ...tls].slice(-8).reverse()
            return all.length===0
              ? <div className={styles.noPenalty}>No active penalties</div>
              : <div className={styles.penList}>
                  {all.map((m,i) => {
                    const isTL = !pens.includes(m)
                    return (
                      <div key={i} className={styles.penItem}>
                        <span className={isTL ? styles.tlTag : styles.penTag}>{isTL?'TL':'PEN'}</span>
                        <span className={styles.penMsg}>{m.message}</span>
                      </div>
                    )
                  })}
                </div>
          })()}
        </div>
      </div>

      {/* ── Telemetry modal ── */}
      {selDriver && (
        <TelemetryModal driver={selDriver} session={session} onClose={() => setSelDriver(null)} />
      )}

      {/* ── Pro upsell bar ── */}
      {!isPremium && !loading && (
        <div className={styles.upsell}>
          <Zap size={13} style={{color:'var(--gold)',flexShrink:0}} />
          <div>
            <strong>F1Pulse Pro</strong> — 
            <span style={{color:'var(--text-3)',fontWeight:400}}> live car dots, telemetry, best sectors, speed trap, 3s refresh, team radio</span>
          </div>
          <Link to="/premium" className="btn btn-gold btn-sm" style={{marginLeft:'auto',flexShrink:0}}>Upgrade £3.99/mo</Link>
        </div>
      )}
    </div>
  )
}
