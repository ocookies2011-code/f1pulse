import { useEffect, useState, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Activity, RefreshCw, CloudRain, Thermometer, Zap, AlertTriangle, Radio } from 'lucide-react'
import { getCircuitByName } from '../lib/circuitData2'
import {
  buildLiveStandings, buildHistoricalStandings, getLatestSession, getWeather, getRaceControl,
  getBestStandingsSession, getChampionshipDrivers, getChampionshipTeams,
  getDrivers, getTeamRadio, fmt, fmtGap
} from '../lib/openf1'
import { useAuth } from '../hooks/useAuth'
import styles from './LiveTiming.module.css'

const TYRE_COLOURS = { SOFT:'#e10600', MEDIUM:'#f5a623', HARD:'#d8d8d8', INTERMEDIATE:'#39a847', WET:'#0067ff' }
const TYRE_LABELS  = { SOFT:'S', MEDIUM:'M', HARD:'H', INTERMEDIATE:'I', WET:'W' }

// ── Right panel: full track map with toggles + team radio + race control ──────
function RightPanel({ session, standings, rc, isPremium }) {
  const [tab, setTab] = useState('map')
  const [positions, setPositions] = useState({})
  const [radio, setRadio] = useState([])
  const [showCorners, setShowCorners] = useState(true)
  const [showSectors, setShowSectors] = useState(true)
  const [showDrs, setShowDrs]     = useState(true)
  const pollRef = useRef(null)

  // Look up circuit data by session meeting name
  const circuit = session ? getCircuitByName(session.meeting_name ?? '') : null

  // ── Fetch live car positions ──────────────────────────────────────────────
  const fetchPos = useCallback(async () => {
    if (!session?.session_key) return
    try {
      const supaUrl  = import.meta.env.VITE_SUPABASE_URL
      const supaAnon = import.meta.env.VITE_SUPABASE_ANON_KEY
      const tokenRes = await fetch(`${supaUrl}/functions/v1/openf1-token`, { method:'POST', headers:{ Authorization:`Bearer ${supaAnon}` } })
      let headers = {}
      if (tokenRes.ok) { const { access_token } = await tokenRes.json(); if (access_token) headers.Authorization = `Bearer ${access_token}` }
      const now  = new Date(); const from = new Date(now - 8000).toISOString()
      const res  = await fetch(`https://api.openf1.org/v1/location?session_key=${session.session_key}&date>${from}`, { headers })
      if (!res.ok) return
      const raw  = await res.json()
      if (!raw?.length) return
      const latest = {}
      for (const p of raw) if (!latest[p.driver_number] || p.date > latest[p.driver_number].date) latest[p.driver_number] = p
      setPositions(latest)
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
    pollRef.current = setInterval(() => { fetchPos(); if (isPremium) fetchRadio() }, 5000)
    return () => clearInterval(pollRef.current)
  }, [session?.session_key, fetchPos, fetchRadio, isPremium])

  const drvMap = {}
  for (const d of standings) drvMap[d.driver_number] = d

  // ── Map live OpenF1 x/y coords → circuit SVG space ───────────────────────
  const pts = Object.values(positions).filter(p => p.x && p.y)
  let toSvg = null
  let svgViewBox = circuit?.viewBox ?? '0 0 400 300'

  if (circuit && pts.length >= 3) {
    const [vx, vy, vw, vh] = circuit.viewBox.split(' ').map(Number)
    const xs = pts.map(p => p.x), ys = pts.map(p => p.y)
    const xMin = Math.min(...xs), xMax = Math.max(...xs)
    const yMin = Math.min(...ys), yMax = Math.max(...ys)
    toSvg = p => ({
      x: vx + ((p.x - xMin) / (xMax - xMin || 1)) * vw,
      y: vy + (1 - (p.y - yMin) / (yMax - yMin || 1)) * vh,
    })
  } else if (!circuit && pts.length >= 3) {
    svgViewBox = '0 0 400 300'
    const xs = pts.map(p => p.x), ys = pts.map(p => p.y)
    const xMin = Math.min(...xs), xMax = Math.max(...xs)
    const yMin = Math.min(...ys), yMax = Math.max(...ys)
    toSvg = p => ({
      x: 20 + ((p.x - xMin) / (xMax - xMin || 1)) * 360,
      y: 20 + (1 - (p.y - yMin) / (yMax - yMin || 1)) * 260,
    })
  }

  // ── Sector polylines (drawn on top of base path) ──────────────────────────
  const sectorPaths = circuit?.sectors?.map(sec => {
    // Build an SVG path from the sector's keypoints string
    const coords = sec.points.split(' ').map(pt => {
      const [x, y] = pt.split(',').map(Number)
      return `${x},${y}`
    })
    return { ...sec, d: 'M ' + coords.join(' L ') }
  }) ?? []

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
      {tab === 'map' && (
        <div className={styles.rpMapWrap}>
          {/* Toggle controls */}
          <div className={styles.mapToggles}>
            <button className={`${styles.mapToggle} ${showSectors?styles.mapToggleOn:''}`} onClick={()=>setShowSectors(v=>!v)}>Sectors</button>
            <button className={`${styles.mapToggle} ${showCorners?styles.mapToggleOn:''}`} onClick={()=>setShowCorners(v=>!v)}>Corners</button>
            <button className={`${styles.mapToggle} ${showDrs?styles.mapToggleOn:''}`} onClick={()=>setShowDrs(v=>!v)}>DRS</button>
            <Link to="/trackmap" className={styles.mapFullLink}>Full map →</Link>
          </div>

          {/* SVG Track Map */}
          <svg viewBox={svgViewBox} xmlns="http://www.w3.org/2000/svg" className={styles.rpMapSvg} preserveAspectRatio="xMidYMid meet">
            {circuit ? (
              <>
                {/* Base track — thick grey */}
                <path d={circuit.path} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" />
                {/* Sector-coloured overlay lines */}
                {showSectors && sectorPaths.map(sec => (
                  <path key={sec.id} d={sec.d} fill="none" stroke={sec.color} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />
                ))}
                {/* White centre line when sectors off */}
                {!showSectors && (
                  <path d={circuit.path} fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                )}
                {/* Start/finish line */}
                {circuit.startLine && (
                  <line
                    x1={circuit.startLine.x - 8} y1={circuit.startLine.y}
                    x2={circuit.startLine.x + 8} y2={circuit.startLine.y}
                    stroke="#fff" strokeWidth="3" strokeLinecap="round"
                  />
                )}
                {/* DRS zones */}
                {showDrs && circuit.drs?.map((d, i) => (
                  <g key={i}>
                    <line x1={d.x1} y1={d.y1} x2={d.x2} y2={d.y2} stroke="#39d98a" strokeWidth="7" strokeLinecap="round" opacity="0.9" />
                    <text x={(d.x1+d.x2)/2} y={(d.y1+d.y2)/2-6} textAnchor="middle" fill="#39d98a" fontSize="7" fontWeight="700" fontFamily="monospace" opacity="0.85">DRS</text>
                  </g>
                ))}
                {/* Corner numbers */}
                {showCorners && circuit.corners?.map(c => (
                  <g key={c.n}>
                    <circle cx={c.x} cy={c.y} r="8" fill="rgba(0,0,0,0.75)" stroke="rgba(255,255,255,0.25)" strokeWidth="0.8" />
                    <text x={c.x} y={c.y+0.5} textAnchor="middle" dominantBaseline="middle" fill="rgba(255,255,255,0.85)" fontSize="6.5" fontWeight="700" fontFamily="monospace">{c.n}</text>
                  </g>
                ))}
                {/* Sector labels */}
                {showSectors && circuit.sectors?.map(sec => (
                  <text key={sec.id} x={sec.midX} y={sec.midY} textAnchor="middle" fill={sec.color} fontSize="9" fontWeight="800" fontFamily="monospace" opacity="0.7">{sec.label}</text>
                ))}
              </>
            ) : (
              /* No circuit data — show "waiting" message */
              <text x="50%" y="50%" textAnchor="middle" fill="rgba(255,255,255,0.2)" fontSize="12" fontFamily="monospace" dominantBaseline="middle">
                No circuit data
              </text>
            )}

            {/* ── Live car position dots ── */}
            {toSvg && Object.entries(positions).map(([dn, pos]) => {
              const drv = drvMap[Number(dn)]
              if (!drv || !pos.x) return null
              const { x, y } = toSvg(pos)
              const col = `#${drv.team_colour ?? 'aaaaaa'}`
              const pos_num = standings.find(s => s.driver_number === Number(dn))?.position
              return (
                <g key={dn}>
                  <circle cx={x} cy={y} r={8} fill={col} stroke="rgba(0,0,0,0.7)" strokeWidth="1.5" />
                  <text x={x} y={y + 0.5} textAnchor="middle" dominantBaseline="middle" fill="#fff" fontSize="6.5" fontWeight="900" fontFamily="monospace">
                    {drv.name_acronym}
                  </text>
                </g>
              )
            })}
          </svg>

          {/* No position data notice */}
          {Object.keys(positions).length === 0 && (
            <div className={styles.mapNoData}>Waiting for live position data…</div>
          )}
        </div>
      )}

      {/* ── Team Radio tab ── */}
      {tab === 'radio' && (
        <div className={styles.rpRadio}>
          {!isPremium ? (
            <div className={styles.rpGate}>
              <Zap size={20} style={{color:'var(--gold)',marginBottom:8}} />
              <p>Team radio playback is a Pro feature</p>
              <Link to="/premium" className="btn btn-gold btn-sm" style={{marginTop:8}}>Upgrade to Pro</Link>
            </div>
          ) : radio.length === 0 ? (
            <div className={styles.rpEmpty}>No team radio messages yet</div>
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


function TyreChip({ compound, age }) {
  if (!compound) return <span className={styles.dash}>—</span>
  const k = compound.toUpperCase()
  const col = TYRE_COLOURS[k] ?? '#888'
  return (
    <span className={styles.tyreChip}>
      <span className={styles.tyreDot} style={{ background: col }} />
      <span style={{ color: col, fontWeight: 800 }}>{TYRE_LABELS[k] ?? compound[0]}</span>
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
  const intervalRef = useRef(null)

  const fetchLive = useCallback(async () => {
    try {
      // Get latest session - if no live data (standings empty), fall back to last completed session
      const sess = await getLatestSession()
      const sk = sess?.session_key ?? 'latest'
      const wthr = await getWeather(sk).catch(() => null)
      const rcData = await getRaceControl(sk).catch(() => [])
      let standing = await buildLiveStandings(sk)

      // If no standings from 'latest', try the best completed session (last race/quali)
      if (!standing?.length) {
        const bestSess = await getBestStandingsSession(2026).catch(() => null)
        if (bestSess) {
          // Try historical result first (cleaner for completed sessions)
          const hist = await buildHistoricalStandings(bestSess.session_key).catch(() => null)
          standing = hist?.length ? hist : await buildLiveStandings(bestSess.session_key).catch(() => [])
          setSession(bestSess)
        } else {
          setSession(sess)
        }
      } else {
        setSession(sess)
      }

      setWeather(wthr); setRc(rcData || []); setStandings(standing)
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
    const ms = isPremium ? 4000 : 10000
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
                <span className={styles.sessionName}>{session.meeting_name}</span>
                <span className={styles.sessionType}>{session.session_name}</span>
                {weather && (
                  <span className={styles.weatherInline}>
                    <Thermometer size={11} /> {weather.track_temperature}°
                    <span className={styles.wLabel}>TRC</span>
                    <Thermometer size={11} /> {weather.air_temperature}°
                    <span className={styles.wLabel}>AIR</span>
                    {weather.humidity}%
                    <span className={styles.wLabel}>HUM</span>
                    {weather.wind_speed > 0 && <><span>{weather.wind_speed}</span><span className={styles.wLabel}>M/S</span></>}
                    {weather.rainfall > 0 && <span className={styles.wetBadge}><CloudRain size={10} /> WET</span>}
                  </span>
                )}
              </>
            ) : <span className={styles.noSession}>No live session — showing last session</span>}
          </div>
          <div className={styles.topRight}>
            {latestFlag && <RCBadge msg={latestFlag} />}
            {!isPremium && <Link to="/premium" className={styles.proBadge}><Zap size={10} /> Pro</Link>}
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
          <span className={styles.refreshNote}>{isPremium ? '⚡ ~4s · ±0.001s precision' : '~10s refresh · ±0.001s precision'}</span>
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
                    <th className={styles.thSec}>LAST SECTORS</th>
                    <th className={styles.thSec}>BEST SECTORS</th>
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

                        <td className={styles.tdDriver}>
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

                        {/* Last sectors */}
                        <td className={styles.tdSec}>
                          {d.sectors?.some(Boolean) ? (
                            <span className={styles.secRow}>
                              {[0,1,2].map(si => {
                                const isSB = d.sectors[si] && d.best_sectors[si] && Math.abs(d.sectors[si]-d.best_sectors[si]) < 0.001
                                const isPB = d.sectors[si] && d.sectors[si] === Math.min(...standings.map(x=>x.sectors[si]).filter(Boolean))
                                return (
                                  <span key={si} className={`mono ${styles.sec} ${isSB?styles.purple:isPB?styles.green:d.sectors[si]?styles.yellow:styles.dimTime}`}>
                                    {d.sectors[si]?d.sectors[si].toFixed(3):'——'}
                                  </span>
                                )
                              })}
                            </span>
                          ) : <span className={styles.dash}>—</span>}
                        </td>

                        {/* Best sectors */}
                        <td className={styles.tdSec}>
                          {d.best_sectors?.some(Boolean) ? (
                            <span className={styles.secRow}>
                              {[0,1,2].map(si => (
                                <span key={si} className={`mono ${styles.sec} ${d.best_sectors[si]?styles.purple:styles.dimTime}`}>
                                  {d.best_sectors[si]?d.best_sectors[si].toFixed(3):'——'}
                                </span>
                              ))}
                            </span>
                          ) : <span className={styles.dash}>—</span>}
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
            const pens = rc.filter(m => m.category==='CarEvent'&&m.message?.includes('PENALTY'))
            const tls  = rc.filter(m => m.message?.includes('TRACK LIMITS')||m.message?.includes('DELETED'))
            return pens.length===0&&tls.length===0
              ? <span className={styles.noPenalty}>NO ACTIVE PENALTIES</span>
              : <div className={styles.penRow}>
                  {pens.length>0&&<span className={styles.penTag}>{pens.length} penalty</span>}
                  {tls.length>0&&<span className={styles.tlTag}>{tls.length} TL violation</span>}
                </div>
          })()}
        </div>
      </div>

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
