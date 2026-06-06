import { useEffect, useState, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Activity, RefreshCw, CloudRain, Thermometer, Wind, Flag, Zap, AlertTriangle, ChevronDown } from 'lucide-react'
import {
  buildLiveStandings, getLatestSession, getWeather, getRaceControl,
  getBestStandingsSession, getChampionshipDrivers, getChampionshipTeams,
  getDrivers, fmt, fmtGap
} from '../lib/openf1'
import { useAuth } from '../hooks/useAuth'
import styles from './LiveTiming.module.css'

const TYRE_COLOURS = { SOFT:'#e10600', MEDIUM:'#f5a623', HARD:'#d8d8d8', INTERMEDIATE:'#39a847', WET:'#0067ff' }
const TYRE_LABELS  = { SOFT:'S', MEDIUM:'M', HARD:'H', INTERMEDIATE:'I', WET:'W' }

function TyreChip({ compound, age }) {
  if (!compound) return <span className={styles.dash}>—</span>
  const k   = compound.toUpperCase()
  const lbl = TYRE_LABELS[k] ?? compound[0]
  const col = TYRE_COLOURS[k] ?? '#888'
  return (
    <span className={styles.tyreChip}>
      <span className={styles.tyreDot} style={{ background: col }} />
      <span style={{ color: col, fontWeight: 700 }}>{lbl}</span>
      {age != null && <span className={styles.tyreAge}>{age}</span>}
    </span>
  )
}

function MiniSectors({ sectors, segments, bestSectors }) {
  // Colour each sector based on time vs session best
  const secColour = (val, best) => {
    if (!val || !best) return styles.secGrey
    if (Math.abs(val - best) < 0.001) return styles.secPurple
    return styles.secYellow
  }
  // Segment mini-bars: 2051=purple, 2049=green, 2048/else=yellow, 2064=pit
  const segCol = v => v === 2051 ? styles.segPurple : v === 2049 ? styles.segGreen : v === 2064 ? styles.segPit : styles.segYellow
  return (
    <div className={styles.miniWrap}>
      <div className={styles.sectorTimes}>
        {[0,1,2].map(i => (
          <span key={i} className={`mono ${styles.secTime} ${sectors[i] ? secColour(sectors[i], bestSectors[i]) : styles.secGrey}`}>
            {sectors[i] ? sectors[i].toFixed(3) : '——'}
          </span>
        ))}
      </div>
      {segments?.some(sg => sg?.length > 0) && (
        <div className={styles.segRow}>
          {[0,1,2].map(si => (
            <div key={si} className={styles.segGroup}>
              {(segments[si] ?? []).slice(0,8).map((v, j) => (
                <span key={j} className={`${styles.seg} ${segCol(v)}`} />
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function RCBadge({ msg }) {
  const flag = msg.flag
  if (flag === 'RED')    return <span className={`${styles.flagBadge} ${styles.flagRed}`}>🔴 RED FLAG</span>
  if (flag === 'SAFETY CAR' || msg.category === 'SafetyCar') return <span className={`${styles.flagBadge} ${styles.flagSc}`}>🚗 SAFETY CAR</span>
  if (flag === 'VIRTUAL SAFETY CAR') return <span className={`${styles.flagBadge} ${styles.flagSc}`}>VSC</span>
  if (flag === 'YELLOW' || flag === 'DOUBLE YELLOW') return <span className={`${styles.flagBadge} ${styles.flagYellow}`}>⚠ YELLOW</span>
  if (flag === 'GREEN')  return <span className={`${styles.flagBadge} ${styles.flagGreen}`}>🟢 TRACK CLEAR</span>
  if (flag === 'CHEQUERED') return <span className={`${styles.flagBadge} ${styles.flagGreen}`}>🏁 CHEQUERED</span>
  return null
}

function PenaltyCount({ rc }) {
  const penalties = rc.filter(m => m.category === 'CarEvent' && m.message?.includes('PENALTY'))
  const trackLimits = rc.filter(m => m.message?.includes('TRACK LIMITS') || m.message?.includes('DELETED'))
  if (!penalties.length && !trackLimits.length) return <span className={styles.noPenalty}>No active penalties</span>
  return (
    <div className={styles.penaltySummary}>
      {penalties.length > 0 && <span className={styles.penTag}>{penalties.length} penalty</span>}
      {trackLimits.length > 0 && <span className={styles.tlTag}>{trackLimits.length} TL violation</span>}
    </div>
  )
}


function MiniTrackMap({ session, drivers }) {
  const [positions, setPositions] = useState({})
  const pollRef = useRef(null)

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

  useEffect(() => {
    fetchPos()
    pollRef.current = setInterval(fetchPos, 5000)
    return () => clearInterval(pollRef.current)
  }, [fetchPos])

  // Normalise to SVG viewBox 0 0 300 200
  const pts = Object.values(positions)
  const xs  = pts.map(p=>p.x).filter(Boolean)
  const ys  = pts.map(p=>p.y).filter(Boolean)
  const xMin = xs.length ? Math.min(...xs) : 0, xMax = xs.length ? Math.max(...xs) : 1
  const yMin = ys.length ? Math.min(...ys) : 0, yMax = ys.length ? Math.max(...ys) : 1
  const toSvg = (p) => ({
    x: 20 + ((p.x - xMin) / (xMax - xMin || 1)) * 260,
    y: 20 + (1 - (p.y - yMin) / (yMax - yMin || 1)) * 160,
  })

  const drvMap = {}
  for (const d of drivers) drvMap[d.driver_number] = d

  if (!session) return null

  return (
    <div className={styles.miniMap}>
      <div className={styles.miniMapTitle}><span className={styles.sessionDot2} /> Track Map</div>
      <svg viewBox="0 0 300 200" xmlns="http://www.w3.org/2000/svg" className={styles.miniMapSvg}>
        {/* track outline from location history - dots */}
        {pts.length === 0 && (
          <text x="150" y="105" textAnchor="middle" fill="rgba(255,255,255,0.2)" fontSize="11" fontFamily="monospace">No live position data</text>
        )}
        {Object.entries(positions).map(([dn, pos]) => {
          const drv = drvMap[Number(dn)]
          if (!drv || !pos.x) return null
          const { x, y } = toSvg(pos)
          const col = `#${drv.team_colour ?? 'aaaaaa'}`
          return (
            <g key={dn}>
              <circle cx={x} cy={y} r={5} fill={col} opacity="0.9" />
              <text x={x} y={y-7} textAnchor="middle" fill="#fff" fontSize="7" fontWeight="700" fontFamily="monospace">{drv.name_acronym}</text>
            </g>
          )
        })}
      </svg>
      <Link to="/trackmap" className={styles.miniMapLink}>Full track map →</Link>
    </div>
  )
}

export default function LiveTiming() {
  const { isPremium } = useAuth()
  const [standings,   setStandings]   = useState([])
  const [session,     setSession]     = useState(null)
  const [weather,     setWeather]     = useState(null)
  const [rc,          setRc]          = useState([])
  const [loading,     setLoading]     = useState(true)
  const [lastUpdate,  setLastUpdate]  = useState(null)
  const [error,       setError]       = useState(null)
  const [showMini,    setShowMini]    = useState(false)
  const [compact,     setCompact]     = useState(false)
  const [drvChamp,    setDrvChamp]    = useState([])
  const [teamChamp,   setTeamChamp]   = useState([])
  const [champLoaded, setChampLoaded] = useState(false)
  const intervalRef = useRef(null)

  const fetchLive = useCallback(async () => {
    try {
      const sess      = await getLatestSession()
      const wthr      = await getWeather('latest')
      const rcData    = await getRaceControl('latest').catch(() => [])
      const standing  = await buildLiveStandings('latest')
      setSession(sess)
      setWeather(wthr)
      setRc(rcData || [])
      setStandings(standing)
      setLastUpdate(new Date())
      setError(null)
    } catch (e) {
      setError('Could not load live data.')
    } finally {
      setLoading(false)
    }
  }, [])

  // Load championship standings separately (lower priority)
  const fetchChamp = useCallback(async () => {
    try {
      const sess = await getBestStandingsSession(2026)
      if (!sess) return
      const driverList = await getDrivers(sess.session_key)
      const drvMap = {}
      for (const d of driverList) drvMap[d.driver_number] = d
      const cd = await getChampionshipDrivers(sess.session_key).catch(() => [])
      const ct = await getChampionshipTeams(sess.session_key).catch(() => [])
      if (cd?.length) {
        setDrvChamp(cd.sort((a,b) => a.position_current - b.position_current).slice(0,10).map(c => ({
          pos: c.position_current,
          name: drvMap[c.driver_number]?.full_name ?? `#${c.driver_number}`,
          acronym: drvMap[c.driver_number]?.name_acronym ?? '???',
          colour: drvMap[c.driver_number]?.team_colour ?? '555555',
          pts: c.points_current ?? 0,
        })))
      }
      if (ct?.length) {
        setTeamChamp(ct.sort((a,b) => a.position_current - b.position_current).slice(0,11).map(c => {
          const td = driverList.find(d => d.team_name === c.team_name)
          return { pos: c.position_current, team: c.team_name, colour: td?.team_colour ?? '555555', pts: c.points_current ?? 0 }
        }))
      }
      setChampLoaded(true)
    } catch {}
  }, [])

  useEffect(() => {
    fetchLive()
    fetchChamp()
    const ms = isPremium ? 4000 : 10000
    intervalRef.current = setInterval(fetchLive, ms)
    return () => clearInterval(intervalRef.current)
  }, [isPremium, fetchLive, fetchChamp])

  // Latest RC flags for the top bar
  const rcReversed = [...rc].reverse()
  const latestFlag = rcReversed.find(m => ['RED','YELLOW','DOUBLE YELLOW','GREEN','SAFETY CAR','VIRTUAL SAFETY CAR','CHEQUERED'].includes(m.flag) || m.category === 'SafetyCar')
  const recentRC   = rcReversed.slice(0, 8)

  return (
    <div className={styles.root}>
      {/* ── Top bar ── */}
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
                    <Thermometer size={11} /> {weather.track_temperature}°C TRC
                    &nbsp;·&nbsp;
                    <Thermometer size={11} /> {weather.air_temperature}°C AIR
                    &nbsp;·&nbsp;
                    {weather.humidity}% HUM
                    {weather.rainfall > 0 && <span className={styles.wetBadge}><CloudRain size={10} /> WET</span>}
                  </span>
                )}
              </>
            ) : <span className={styles.noSession}>No active session</span>}
          </div>
          <div className={styles.topRight}>
            {latestFlag && <RCBadge msg={latestFlag} />}
            {!isPremium && (
              <Link to="/premium" className={styles.proBadge}><Zap size={10} /> Pro: faster data</Link>
            )}
            <div className={styles.updateInfo}>
              <RefreshCw size={10} className={loading ? styles.spinning : ''} />
              {lastUpdate?.toLocaleTimeString('en-GB', { hour12: false })}
            </div>
            <button className="btn btn-ghost btn-sm" style={{ padding: '4px 9px' }} onClick={fetchLive}>
              <RefreshCw size={12} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Column toggles ── */}
      <div className={styles.toolBar}>
        <div className={styles.toolBarInner}>
          <div className={styles.toggleGroup}>
            <button className={`${styles.toggle} ${compact ? styles.toggleOn : ''}`} onClick={() => setCompact(v=>!v)}>Compact</button>

          </div>
          <span className={styles.refreshNote}>{isPremium ? '~4s refresh (Pro)' : '~10s refresh · Upgrade for faster'}</span>
        </div>
      </div>

      {/* ── Main timing table ── */}
      {loading ? (
        <div className="spinner-wrap"><div className="spinner" /></div>
      ) : error ? (
        <div className={styles.emptyState}>
          <AlertTriangle size={30} style={{ color:'var(--text-3)', marginBottom:10 }} />
          <p>{error}</p>
        </div>
      ) : standings.length === 0 ? (
        <div className={styles.emptyState}>
          <Activity size={30} style={{ color:'var(--text-3)', marginBottom:10 }} />
          <p>No active session. Live data will appear here automatically.</p>
        </div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={`${styles.table} ${compact ? styles.compact : ''}`}>
            <thead>
              <tr>
                <th className={styles.thPit}>PIT</th>
                <th className={styles.thPos}>#</th>
                <th className={styles.thDriver}>DRIVER</th>
                <th className={styles.thInterval}>INTERVAL</th>
                <th className={styles.thTyre}>TYRE</th>
                <th className={styles.thTime}>BEST LAP</th>
                <th className={styles.thTime}>LEADER</th>
                <th className={styles.thTime}>LAST LAP</th>
                <th className={styles.thMiniSectors}>MINI SECTORS</th>
                <th className={styles.thSectors}>LAST SECTORS</th>
                <th className={styles.thSectors}>BEST SECTORS</th>
                <th className={styles.thLap}>LAP</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((d, i) => {
                const isP1      = i === 0
                const isPit     = d.is_pit_out_lap
                const isBestLap = d.is_overall_best
                const rowClass  = `${styles.row} ${isPit ? styles.rowPit : ''} ${isP1 ? styles.rowP1 : ''}`
                return (
                  <tr key={d.driver_number} className={rowClass}>
                    {/* Pit indicator */}
                    <td className={styles.tdPit}>
                      {d.pit_stops > 0 && <span className={styles.pitTag}>PIT</span>}
                    </td>

                    {/* Position */}
                    <td className={styles.tdPos}>
                      <span className={styles.posBox} style={{ borderColor: `#${d.team_colour}`, color: `#${d.team_colour}` }}>
                        {d.position}
                      </span>
                    </td>

                    {/* Driver */}
                    <td className={styles.tdDriver}>
                      <span className={styles.teamBar} style={{ background:`#${d.team_colour}` }} />
                      <div className={styles.driverBlock}>
                        <span className={styles.acronym}>{d.name_acronym}</span>
                        <span className={styles.teamShort}>{d.team_name?.replace('F1 Team','').replace('Racing','').trim()}</span>
                      </div>
                    </td>

                    {/* Interval */}
                    <td className={`mono ${styles.tdInterval}`}>
                      {isP1
                        ? <span className={styles.intervalLabel}>Interval</span>
                        : <span className={styles.intervalVal}>{fmtGap(d.interval)}</span>
                      }
                    </td>

                    {/* Tyre */}
                    <td><TyreChip compound={d.tyre} age={d.tyre_age} /></td>

                    {/* Best lap */}
                    <td className={`mono ${isBestLap ? styles.timePurple : styles.timeNormal}`}>
                      {fmt(d.best_lap)}
                    </td>

                    {/* Gap to leader */}
                    <td className={`mono ${styles.tdGap}`}>
                      {isP1
                        ? <span className={styles.leaderLabel}>Leader</span>
                        : fmtGap(d.gap_to_leader)
                      }
                    </td>

                    {/* Last lap */}
                    <td className={`mono ${d.is_personal_best ? styles.timeGreen : styles.timeNormal}`}>
                      {fmt(d.last_lap)}
                    </td>

                    {/* Mini segments */}
                    <td className={styles.tdMiniSegs}>
                      {isPremium && d.segments?.some(sg => sg?.length > 0) ? (
                        <div className={styles.segRow}>
                          {[0,1,2].map(si => (
                            <div key={si} className={styles.segGroup}>
                              {(d.segments[si] ?? []).slice(0,8).map((v, j) => {
                                const sc = v===2051?styles.segPurple:v===2049?styles.segGreen:v===2064?styles.segPit:styles.segYellow
                                return <span key={j} className={`${styles.seg} ${sc}`} />
                              })}
                            </div>
                          ))}
                        </div>
                      ) : <span className={styles.dash}>—</span>}
                    </td>
                    {/* Last sectors */}
                    <td className={styles.tdSectors}>
                      {d.sectors?.some(Boolean) ? (
                        <div className={styles.sectorTimes}>
                          {[0,1,2].map(i => {
                            const isBest = d.sectors[i] && d.best_sectors[i] && Math.abs(d.sectors[i]-d.best_sectors[i]) < 0.001
                            const isPB   = d.sectors[i] && (!d.best_sectors[i] || d.sectors[i] <= d.best_sectors[i])
                            return (
                              <span key={i} className={`mono ${styles.secTime} ${isBest?styles.secPurple:isPB?styles.secGreen:d.sectors[i]?styles.secYellow:styles.secGrey}`}>
                                {d.sectors[i]?d.sectors[i].toFixed(3):'——'}
                              </span>
                            )
                          })}
                        </div>
                      ) : <span className={styles.dash}>—</span>}
                    </td>
                    {/* Best sectors */}
                    <td className={styles.tdSectors}>
                      {d.best_sectors?.some(Boolean) ? (
                        <div className={styles.sectorTimes}>
                          {[0,1,2].map(i => (
                            <span key={i} className={`mono ${styles.secTime} ${d.best_sectors[i]?styles.secPurple:styles.secGrey}`}>
                              {d.best_sectors[i]?d.best_sectors[i].toFixed(3):'——'}
                            </span>
                          ))}
                        </div>
                      ) : <span className={styles.dash}>—</span>}
                    </td>

                    {/* Lap */}
                    <td className={`mono ${styles.tdLap}`}>{d.lap_number || '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Main content + mini map ── */}
      <div className={styles.mainAndMap}>
        <div className={styles.mainContent}>
          {/* timing table is above */}
        </div>
        <MiniTrackMap session={session} drivers={standings} />
      </div>

      {/* ── Bottom panels ── */}
      <div className={styles.bottomPanels}>
        {/* Driver championship */}
        <div className={styles.champPanel}>
          <div className={styles.champTitle}>DRIVER CHAMPIONSHIP</div>
          {champLoaded ? drvChamp.map(d => (
            <div key={d.acronym} className={styles.champRow}>
              <span className={styles.champPos}>{d.pos}</span>
              <span className={styles.champDot} style={{ background:`#${d.colour}` }} />
              <span className={styles.champName}>{d.name}</span>
              <span className={styles.champPts}>{d.pts}</span>
            </div>
          )) : <div className={styles.champLoading}>Loading…</div>}
        </div>

        {/* Team championship */}
        <div className={styles.champPanel}>
          <div className={styles.champTitle}>TEAM CHAMPIONSHIP</div>
          {champLoaded ? teamChamp.map(t => (
            <div key={t.team} className={styles.champRow}>
              <span className={styles.champPos}>{t.pos}</span>
              <span className={styles.champDot} style={{ background:`#${t.colour}` }} />
              <span className={styles.champName}>{t.team?.replace(' F1 Team','')}</span>
              <span className={styles.champPts}>{t.pts}</span>
            </div>
          )) : <div className={styles.champLoading}>Loading…</div>}
        </div>

        {/* Penalties / Race Control */}
        <div className={`${styles.champPanel} ${styles.rcBigPanel}`}>
          <div className={styles.champTitle} style={{ color:'var(--red)' }}>PENALTIES</div>
          <PenaltyCount rc={rc} />
          <div className={styles.champTitle} style={{ marginTop:12 }}>RACE CONTROL</div>
          <div className={styles.rcFeed}>
            {recentRC.length === 0
              ? <span className={styles.noPenalty}>No messages</span>
              : recentRC.map((m, i) => (
                  <div key={i} className={`${styles.rcLine} ${
                    m.flag === 'RED' ? styles.rcRed
                    : m.flag?.includes('YELLOW') ? styles.rcYellow
                    : m.flag === 'GREEN' || m.flag === 'CHEQUERED' ? styles.rcGreen
                    : m.category === 'SafetyCar' ? styles.rcOrange
                    : ''
                  }`}>
                    {m.message}
                  </div>
                ))
            }
          </div>
        </div>
      </div>

      {/* ── Pro upsell ── */}
      {!isPremium && !loading && (
        <div className={styles.upsell}>
          <Zap size={14} style={{ color:'var(--gold)', flexShrink:0 }} />
          <div><strong>F1Pulse Pro</strong> — mini-sectors, ~3s refresh, team radio, track map</div>
          <Link to="/premium" className="btn btn-gold btn-sm" style={{ marginLeft:'auto' }}>Upgrade £3.99/mo</Link>
        </div>
      )}
    </div>
  )
}
