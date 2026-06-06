import { useEffect, useState, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Activity, RefreshCw, CloudRain, Thermometer, Zap, AlertTriangle, Radio, Wind, Gauge, TrendingUp, X } from 'lucide-react'
import {
  buildLiveStandings, buildHistoricalStandings, getLatestSession, getWeather, getRaceControl,
  getBestStandingsSession, getChampionshipDrivers, getChampionshipTeams,
  getDrivers, getTeamRadio, getOvertakes, getCarData, fmt, fmtGap, fmtS
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
  'Monaco':'monaco','Silverstone':'silverstone','Monza':'monza','Spa':'spa',
  'Suzuka':'suzuka','Albert Park':'albert_park','Sakhir':'bahrain','Jeddah':'jeddah',
  'Miami':'miami','Imola':'imola','Barcelona':'barcelona','Budapest':'budapest',
  'Zandvoort':'zandvoort','Baku':'baku','Singapore':'singapore','Austin':'austin',
  'Mexico City':'mexico','Spielberg':'spielberg','Yas Marina':'yas_marina',
  'Las Vegas':'las_vegas','Lusail':'losail','São Paulo':'sao_paulo','Montréal':'villeneuve',
  'Shanghai':'shanghai',
}
function getCircuitSlug(shortName) {
  if (!shortName) return null
  return CIRCUIT_SLUGS[shortName] ?? shortName.toLowerCase().replace(/[^a-z0-9]/g,'_')
}

// ── Right panel: full track map with toggles + team radio + race control ──────
function RightPanel({ session, standings, rc, isPremium }) {
  const [tab, setTab] = useState('map')
  const [positions, setPositions] = useState({})
  const [radio, setRadio] = useState([])
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

  const fetchRadio = useCallback(async () => {
    if (!session?.session_key || !isPremium) return
    try {
      const r = await getTeamRadio(session.session_key)
      setRadio(r?.slice(-20).reverse() ?? [])
    } catch {}
  }, [session, isPremium])

  useEffect(() => {
    if (!session?.session_key) return
    fetchPos()
    if (isPremium) fetchRadio()
    // Position data updates every ~2s on OpenF1 for live sessions
    const posInterval = isPremium ? 2000 : 5000
    pollRef.current = setInterval(() => { fetchPos(); if (isPremium) fetchRadio() }, posInterval)
    return () => clearInterval(pollRef.current)
  }, [session?.session_key, fetchPos, fetchRadio, isPremium])

  const drvMap = {}
  for (const d of standings) drvMap[d.driver_number] = d


  return (
    <div className={styles.rightPanel}>
      {/* ── Tab bar ── */}
      <div className={styles.rpTabs}>
        <button className={`${styles.rpTab} ${tab==='map'?styles.rpTabActive:''}`} onClick={()=>setTab('map')}>
          Track Map
        </button>
        <button className={`${styles.rpTab} ${tab==='radio'?styles.rpTabActive:''}`} onClick={()=>setTab('radio')}>
          <Radio size={9} /> Radio {!isPremium && <Zap size={8} style={{color:'var(--gold)',marginLeft:2}}/>}
        </button>
        <button className={`${styles.rpTab} ${tab==='rc'?styles.rpTabActive:''}`} onClick={()=>setTab('rc')}>
          Race Control
        </button>
      </div>

      {/* ── Track Map tab ── */}
      {tab === 'map' && (() => {
        // Try multiple sources for circuit identification
        const circuitName = session?.circuit_short_name ?? session?.country_name ?? session?.meeting_name ?? ''
        let slug = getCircuitSlug(circuitName)
        // Extra fallback: scan CIRCUIT_SLUGS keys for partial match
        if (!slug && circuitName) {
          const lower = circuitName.toLowerCase()
          for (const [key, val] of Object.entries(CIRCUIT_SLUGS)) {
            if (lower.includes(key.toLowerCase()) || key.toLowerCase().includes(lower.split(' ')[0])) {
              slug = val; break
            }
          }
        }
        const imgUrl = slug ? `https://formula-timer.com/circuits/${slug}.png` : null
        // Normalize positions to 0-100% for CSS overlay
        const pts = Object.values(positions).filter(p => p.x && p.y)
        let normPos = {}
        if (pts.length >= 3) {
          const xs = pts.map(p=>p.x), ys = pts.map(p=>p.y)
          const xMin=Math.min(...xs), xMax=Math.max(...xs)
          const yMin=Math.min(...ys), yMax=Math.max(...ys)
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
            {/* Controls */}
            <div className={styles.mapToggles}>
              <span className={styles.mapSessionLabel} style={{marginRight:'auto', textTransform:'uppercase', letterSpacing:'0.1em'}}>
                {session?.circuit_short_name ?? circuitName?.split(' ')[0] ?? 'TRACK MAP'}
              </span>
              {session?.session_name && <span style={{fontSize:'0.6rem',color:'rgba(255,255,255,0.3)',fontFamily:'var(--font-mono)'}}>{session.session_name}</span>}
              {Object.keys(positions).length > 0 && <span style={{fontSize:'0.6rem',color:'#39d98a',fontFamily:'var(--font-mono)',marginLeft:6}}>● {Object.keys(positions).length} live</span>}
            </div>

            {/* Map area — circuit image + car dot overlay */}
            <div style={{flex:1,position:'relative',minHeight:0,overflow:'hidden'}}>
              {/* Circuit image — the actual accurate track map */}
              {imgUrl && (
                <img
                  src={imgUrl}
                  alt={session?.circuit_short_name}
                  style={{
                    position:'absolute', inset:0,
                    width:'100%', height:'100%',
                    objectFit:'contain', objectPosition:'center',
                    padding:'12px',
                  }}
                  onError={e => e.target.style.display='none'}
                />
              )}

              {/* Car position dots overlaid with CSS % */}
              {Object.entries(normPos).map(([dn, pos]) => {
                const drv = drvMap[Number(dn)]
                if (!drv) return null
                const col = `#${drv.team_colour ?? 'aaaaaa'}`
                return (
                  <div key={dn} style={{
                    position:'absolute',
                    left: pos.left, top: pos.top,
                    transform:'translate(-50%,-50%)',
                    zIndex:10,
                  }}>
                    <div style={{
                      width:22, height:22, borderRadius:'50%',
                      background:col, border:'2px solid #000',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontSize:'7px', fontWeight:900, color:'#fff',
                      fontFamily:'monospace', boxShadow:`0 0 6px ${col}88`,
                      userSelect:'none',
                    }}>
                      {drv.name_acronym?.slice(0,3)}
                    </div>
                  </div>
                )
              })}

              {/* No data overlay */}
              {!imgUrl && Object.keys(normPos).length === 0 && (
                <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',color:'rgba(255,255,255,0.15)',fontSize:'0.75rem',fontFamily:'monospace'}}>
                  No circuit data
                </div>
              )}
              {/* When no live positions, show drivers in P order around a simple path */}
              {imgUrl && Object.keys(positions).length === 0 && Object.keys(drvMap).length === 0 && (
                <div className={styles.mapNoData} style={{bottom:'50%',transform:'translateY(50%)'}}>
                  No session active
                </div>
              )}
              {imgUrl && Object.keys(positions).length === 0 && Object.keys(drvMap).length > 0 && (
                <div className={styles.mapNoData}>No live position data</div>
              )}
            </div>

            {/* Legend */}
            <div className={styles.mapLegend}>
              <div className={styles.mapLegendItem}><div className={styles.mapLegendLine} style={{background:'#3671C6'}}/> S1</div>
              <div className={styles.mapLegendItem}><div className={styles.mapLegendLine} style={{background:'#E8002D'}}/> S2</div>
              <div className={styles.mapLegendItem}><div className={styles.mapLegendLine} style={{background:'#FF8000'}}/> S3</div>
              <div className={styles.mapLegendItem}><div className={styles.mapLegendLine} style={{background:'#39d98a'}}/> DRS</div>
            </div>
          </div>
        )
      })()}

      {/* ── Team Radio tab ── */}
      {tab === 'radio' && (
        <div className={styles.rpRadio}>
          {radio.length === 0 ? (
            <div className={styles.rpEmpty}>
              {isPremium 
                ? <>No team radio available<br/><span style={{fontSize:'0.7rem',opacity:0.5}}>Coverage is very limited in 2026</span></>
                : <><Zap size={14} style={{color:'var(--gold)',marginBottom:6}}/><br/>Team radio requires Pro<br/><Link to="/premium" style={{color:'var(--gold)',fontSize:'0.72rem'}}>Upgrade →</Link></>
              }
            </div>
          ) : radio.map((r, i) => {
            const drv = standings.find(d => d.driver_number === r.driver_number)
            const col = `#${drv?.team_colour ?? '555555'}`
            return (
              <div key={i} className={styles.radioMsg}>
                <span className={styles.radioDriver} style={{color:col}}>{drv?.name_acronym ?? `#${r.driver_number}`}</span>
                {r.recording_url
                  ? <audio src={r.recording_url} controls className={styles.radioAudio} />
                  : <span className={styles.radioNoAudio}>No audio available</span>
                }
                <span className={styles.radioTime}>{r.date ? new Date(r.date).toLocaleTimeString('en-GB',{hour12:false}) : ''}</span>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Race Control tab ── */}
      {tab === 'rc' && (
        <div className={styles.rpRc}>
          {rc.length === 0
            ? <div className={styles.rpEmpty}>No race control messages</div>
            : [...rc].reverse().slice(0,40).map((m, i) => (
                <div key={i} className={`${styles.rcLine} ${m.flag==='RED'?styles.rcRed:m.flag?.includes('YELLOW')?styles.rcYellow:m.flag==='GREEN'||m.flag==='CHEQUERED'?styles.rcGreen:m.category==='SafetyCar'?styles.rcOrange:''}`}>
                  <span className={styles.rcTime}>{m.date ? new Date(m.date).toLocaleTimeString('en-GB',{hour12:false,hour:'2-digit',minute:'2-digit'}) : ''}</span>
                  <span className={styles.rcMsg}>{m.message}</span>
                </div>
              ))
          }
        </div>
      )}
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
  const intervalRef = useRef(null)

  const fetchLive = useCallback(async () => {
    try {
      // Get latest session - if no live data (standings empty), fall back to last completed session
      const sess = await getLatestSession()
      const sk = sess?.session_key ?? 'latest'
      const wthr = await getWeather(sk).catch(() => null)
      const rcData = await getRaceControl(sk).catch(() => [])
      let standing = await buildLiveStandings(sk)

      // If no standings from 'latest', find the best session to show
      if (!standing?.length) {
        // Import getSessions to find current meeting sessions
        const { getSessions: _getSess } = await import('../lib/openf1')
        // First try: sessions from the current meeting week (within 7 days)
        const now = new Date()
        const weekAgo = new Date(now - 7 * 24 * 3600 * 1000)
        const recentSess = await _getSess({ year: 2026 }).catch(() => [])
        const thisWeek = (recentSess ?? [])
          .filter(s => new Date(s.date_start) > weekAgo && new Date(s.date_start) < now)
          .sort((a, b) => new Date(b.date_start) - new Date(a.date_start))
        
        const targetSess = thisWeek[0] ?? null
        
        if (targetSess) {
          const hist = await buildHistoricalStandings(targetSess.session_key).catch(() => null)
          standing = hist?.length ? hist : await buildLiveStandings(targetSess.session_key).catch(() => [])
          setSession(targetSess)
        } else {
          // Last resort: most recent completed session of any kind
          const bestSess = await getBestStandingsSession(2026).catch(() => null)
          if (bestSess) {
            const hist = await buildHistoricalStandings(bestSess.session_key).catch(() => null)
            standing = hist?.length ? hist : await buildLiveStandings(bestSess.session_key).catch(() => [])
            setSession(bestSess)
          } else {
            setSession(sess)
          }
        }
      } else {
        setSession(sess)
      }

      setWeather(wthr); setRc(rcData || []); setStandings(standing)
      // Fetch overtakes for races
      if (sk && (session?.session_type === 'Race' || sess?.session_type === 'Race')) {
        getOvertakes(sk).then(ov => setOvertakes(ov ?? [])).catch(() => {})
      }
      setLastUpdate(new Date()); setError(null)
    } catch { setError('Could not load live data.') }
    finally { setLoading(false) }
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
    fetchLive(); fetchChamp()
    // OpenF1 rate limit: 30 req/10s. buildLiveStandings uses 6 endpoints.
    // Premium authenticated: poll every 3s (6 req / 3s = within limit)
    // Free unauthenticated: poll every 8s
    const ms = isPremium ? 3000 : 8000
    intervalRef.current = setInterval(fetchLive, ms)
    return () => clearInterval(intervalRef.current)
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

      {/* ── Toolbar ── */}
      <div className={styles.toolBar}>
        <div className={styles.toolBarInner}>
          <div className={styles.toggleGroup}>
            <button className={`${styles.toggle} ${compact?styles.toggleOn:''}`} onClick={()=>setCompact(v=>!v)}>Compact</button>
          </div>
          <span className={styles.refreshNote}>{isPremium ? '⚡ ~3s live · positions 2s' : '~8s refresh · Go Pro for faster'}</span>
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
          ) : (
            <div className={styles.tableScroll}>
              <table className={`${styles.table} ${compact?styles.compact:''}`}>
                <thead>
                  <tr>
                    <th className={styles.thPit}>PIT</th>
                    <th className={styles.thPos}>#</th>
                    <th className={styles.thDriver}>DRIVER</th>
                    <th className={styles.thNum}>INTERVAL</th>
                    <th className={styles.thTyre}>TYRE</th>
                    <th className={styles.thNum}>BEST LAP</th>
                    <th className={styles.thNum}>LEADER</th>
                    <th className={styles.thNum}>LAST LAP</th>
                    <th className={styles.thMini}>MINI SECTORS</th>
                    <th className={styles.thSecGroup} colSpan={3} style={{borderRight:'1px solid rgba(255,255,255,0.06)'}}>
                      LAST SECTORS&nbsp;
                      <span style={{color:'#3671C6',fontSize:'0.55rem'}}>S1</span>
                      <span style={{color:'#E8002D',fontSize:'0.55rem'}}> S2</span>
                      <span style={{color:'#FF8000',fontSize:'0.55rem'}}> S3</span>
                    </th>
                    <th className={styles.thSecGroup} colSpan={3}>
                      BEST SECTORS&nbsp;
                      <span style={{color:'#3671C6',fontSize:'0.55rem',opacity:0.7}}>S1</span>
                      <span style={{color:'#E8002D',fontSize:'0.55rem',opacity:0.7}}> S2</span>
                      <span style={{color:'#FF8000',fontSize:'0.55rem',opacity:0.7}}> S3</span>
                    </th>
                    <th className={styles.thSpeed} title="Speed Trap">ST</th>
                    <th className={styles.thLap}>LAP</th>
                  </tr>
                </thead>
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

                        <td className={styles.tdDriver} onClick={() => setSelDriver(d)} style={{cursor:'pointer'}} title="Click for live telemetry">
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
                        <td className={styles.tdMini}>
                          {isPremium
                            ? <Segs segments={d.segments} styles={styles} />
                            : <span className={styles.dash}>—</span>
                          }
                        </td>

                        {/* Last sectors — S1, S2, S3 as individual cells */}
                        {[0,1,2].map(si => {
                          const SCOL = ['#3671C6','#E8002D','#FF8000'][si]
                          const val = d.sectors?.[si]
                          const isSB = val && d.best_sectors?.[si] && Math.abs(val - d.best_sectors[si]) < 0.001
                          const isSessionBest = val && val === Math.min(...standings.map(x=>x.sectors?.[si]).filter(Boolean))
                          return (
                            <td key={`ls${si}`} className={`mono ${styles.tdSecCell}`}>
                              {val
                                ? <span style={{color: isSB ? '#b45cf4' : isSessionBest ? '#39d98a' : SCOL, fontWeight: isSB||isSessionBest ? 800 : 400, opacity: isSB||isSessionBest ? 1 : 0.8}}>
                                    {val.toFixed(3)}
                                  </span>
                                : <span className={styles.dash}>—</span>
                              }
                            </td>
                          )
                        })}

                        {/* Best sectors — S1, S2, S3 as individual cells */}
                        {[0,1,2].map(si => {
                          const SCOL = ['#3671C6','#E8002D','#FF8000'][si]
                          const val = d.best_sectors?.[si]
                          return (
                            <td key={`bs${si}`} className={`mono ${styles.tdSecCell} ${styles.tdSecBest}`}>
                              {val
                                ? <span style={{color: '#b45cf4', opacity: 0.75}}>{val.toFixed(3)}</span>
                                : <span className={styles.dash}>—</span>
                              }
                            </td>
                          )
                        })}

                        <td className={`mono ${styles.tdSpeed}`} title="Speed trap km/h">
                          {d.all_laps?.at(-1)?.st_speed
                            ? <span style={{color:'rgba(255,255,255,0.5)',fontSize:'0.72rem'}}>{d.all_laps.at(-1).st_speed}</span>
                            : <span className={styles.dash}>—</span>}
                        </td>
                        <td className={`mono ${styles.tdLap}`}>{d.lap_number||'—'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right panel: track map / team radio / race control */}
        {!loading && (
          <RightPanel session={session} standings={standings} rc={rc} isPremium={isPremium} />
        )}
      </div>

      {/* ── Bottom panels ── */}
      <div className={styles.bottomPanels}>
        <div className={styles.champPanel}>
          <div className={styles.champTitle}>DRIVER CHAMPIONSHIP</div>
          {champLoaded ? drvChamp.map(d => (
            <div key={d.acronym} className={styles.champRow}>
              <span className={styles.champPos}>{d.pos}</span>
              <span className={styles.champDot} style={{background:`#${d.colour}`}} />
              <span className={styles.champName}>{d.acronym}</span>
              <span className={styles.champPts}>{d.pts}</span>
            </div>
          )) : <div className={styles.champLoading}>Loading…</div>}
        </div>

        <div className={styles.champPanel}>
          <div className={styles.champTitle}>TEAM CHAMPIONSHIP</div>
          {champLoaded ? teamChamp.map(t => (
            <div key={t.team} className={styles.champRow}>
              <span className={styles.champPos}>{t.pos}</span>
              <span className={styles.champDot} style={{background:`#${t.colour}`}} />
              <span className={styles.champName}>{t.team?.replace(' F1 Team','').replace(' Racing','')}</span>
              <span className={styles.champPts}>{t.pts}</span>
            </div>
          )) : <div className={styles.champLoading}>Loading…</div>}
        </div>

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
                        <span className={isTL ? styles.tlTag : styles.penTag}>
                          {isTL ? 'TL' : 'PEN'}
                        </span>
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

      {/* ── Pro upsell ── */}
      {!isPremium && !loading && (
        <div className={styles.upsell}>
          <Zap size={13} style={{color:'var(--gold)',flexShrink:0}} />
          <div><strong>F1Pulse Pro</strong> — mini-sectors, ~4s refresh, team radio, full track map</div>
          <Link to="/premium" className="btn btn-gold btn-sm" style={{marginLeft:'auto'}}>£3.99/mo</Link>
        </div>
      )}
    </div>
  )
}
