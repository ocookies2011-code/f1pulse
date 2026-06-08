import { useEffect, useState, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Activity, RefreshCw, Zap, Radio, CloudRain, Thermometer, Wind, Gauge, TrendingUp, AlertTriangle } from 'lucide-react'
import {
  buildLiveStandings, buildHistoricalStandings, getLatestSession, getWeather,
  getRaceControl, getSessions, getTeamRadio, getDrivers, fmt, fmtGap
} from '../lib/openf1'
import { useAuth } from '../hooks/useAuth'
import styles from './LiveTiming.module.css'
import { getCircuitImage } from '../lib/circuitImages'

// ── Tyre chip ─────────────────────────────────────────────────────────────────
const TYRE_COLOR = { SOFT:'#e8002d', MEDIUM:'#ffd700', HARD:'#f0f0f0', INTER:'#39b54a', WET:'#0067ff' }
function TyreChip({ compound, age }) {
  if (!compound) return <span className={styles.dash}>—</span>
  const c = compound.toUpperCase()
  const col = TYRE_COLOR[c] ?? '#888'
  const letter = c[0]
  return (
    <span style={{display:'inline-flex',alignItems:'center',gap:3}}>
      <span style={{width:16,height:16,borderRadius:'50%',background:col,display:'inline-flex',alignItems:'center',justifyContent:'center',fontSize:'0.55rem',fontWeight:900,color:'#000',flexShrink:0}}>{letter}</span>
      {age != null && <span style={{fontSize:'0.65rem',color:'var(--text-3)'}}>{age}</span>}
    </span>
  )
}

// ── RC badge ──────────────────────────────────────────────────────────────────
function RCBadge({ msg }) {
  if (!msg) return null
  const f = msg.flag ?? msg.category ?? ''
  const col = f.includes('RED') ? '#e8002d' : f.includes('YELLOW') ? '#ffd700' : f === 'GREEN' || f === 'CHEQUERED' ? '#39d98a' : f === 'SafetyCar' ? '#ff8c00' : '#aaa'
  const label = f.includes('SAFETY') || f === 'SafetyCar' ? 'SC' : f.includes('VIRTUAL') ? 'VSC' : f === 'CHEQUERED' ? '🏁' : f.replace(' ', ' ')
  return <span style={{padding:'2px 8px',borderRadius:3,background:col,color:'#000',fontSize:'0.6rem',fontWeight:900,flexShrink:0}}>{label}</span>
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function LiveTiming() {
  const { isPremium } = useAuth()
  const [session,    setSession]    = useState(null)
  const [standings,  setStandings]  = useState([])
  const [weather,    setWeather]    = useState(null)
  const [rc,         setRc]         = useState([])
  const [radio,      setRadio]      = useState([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState(null)
  const [selDriver,  setSelDriver]  = useState(null)
  const [compact,    setCompact]    = useState(false)
  const [lastUpdate, setLastUpdate] = useState(null)
  const mountedRef   = useRef(true)
  const intervalRef  = useRef(null)
  const sessionRef   = useRef(null)

  useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false } }, [])

  const fetchData = useCallback(async () => {
    if (!mountedRef.current) return
    try {
      const sess = await getLatestSession()
      const sk = sess?.session_key ?? 'latest'
      sessionRef.current = sess

      const [wthr, rcData] = await Promise.all([
        getWeather(sk).catch(() => null),
        getRaceControl(sk).catch(() => []),
      ])

      if (!mountedRef.current) return

      // Try live standings first
      let rows = await buildLiveStandings(sk).catch(() => [])

      // If live returns nothing (session completed), try historical
      if (!rows?.length) {
        rows = await buildHistoricalStandings(sk).catch(() => [])
      }

      // Last resort: search recent sessions
      if (!rows?.length) {
        const all = await getSessions({ year: 2026 }).catch(() => [])
        const past = (all || [])
          .filter(s => new Date(s.date_start) < new Date())
          .sort((a, b) => new Date(b.date_start) - new Date(a.date_start))
        for (const s of past.slice(0, 6)) {
          if (!mountedRef.current) return
          rows = await buildHistoricalStandings(s.session_key).catch(() => [])
          if (rows?.length) { sessionRef.current = s; break }
          rows = await buildLiveStandings(s.session_key).catch(() => [])
          if (rows?.length) { sessionRef.current = s; break }
        }
      }

      if (!mountedRef.current) return
      setSession(sessionRef.current)
      setWeather(wthr)
      setRc(rcData || [])
      if (rows?.length) setStandings(rows)
      setLastUpdate(new Date())
      setError(null)
    } catch (e) {
      if (mountedRef.current) setError('Failed to load timing data')
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }, [])

  const fetchRadio = useCallback(async () => {
    const sk = sessionRef.current?.session_key
    if (!sk || !isPremium) return
    try {
      const r = await getTeamRadio(sk)
      if (r?.length && mountedRef.current) setRadio(r.slice(-20).reverse())
    } catch {}
  }, [isPremium])

  useEffect(() => {
    fetchData()
    const ms = isPremium ? 10000 : 30000
    intervalRef.current = setInterval(fetchData, ms)
    const radioTimer = setInterval(fetchRadio, 25000)
    setTimeout(fetchRadio, 8000)
    return () => { clearInterval(intervalRef.current); clearInterval(radioTimer) }
  }, [isPremium, fetchData, fetchRadio])

  const latestFlag = [...rc].reverse().find(m =>
    ['RED','YELLOW','DOUBLE YELLOW','GREEN','SAFETY CAR','VIRTUAL SAFETY CAR','CHEQUERED'].includes(m.flag) || m.category === 'SafetyCar'
  )

  return (
    <div className={styles.root}>
      {/* Top bar */}
      <div className={styles.topBar}>
        <div className={styles.topBarInner}>
          <div className={styles.topLeft}>
            {session ? (
              <>
                <span className={styles.sessionDot} />
                <span className={styles.sessionType}>{session.session_name}</span>
                <span className={styles.sessionCircuit}>{session.circuit_short_name ?? session.meeting_name}</span>
                {weather && (
                  <span className={styles.weatherInline}>
                    <Thermometer size={11} style={{color:'#ff8800',opacity:0.8}} />
                    <span>{weather.track_temperature?.toFixed(1)}°</span>
                    <span className={styles.wLabel}>TRC</span>
                    <Thermometer size={11} style={{color:'#4488ff',opacity:0.8}} />
                    <span>{weather.air_temperature?.toFixed(1)}°</span>
                    <span className={styles.wLabel}>AIR</span>
                    <span>{weather.humidity}%</span>
                    <span className={styles.wLabel}>HUM</span>
                    {weather.wind_speed != null && <><Wind size={10} style={{opacity:0.6}} /><span>{weather.wind_speed}</span><span className={styles.wLabel}>M/S</span></>}
                    {weather.pressure != null && <><Gauge size={10} style={{opacity:0.6}} /><span>{weather.pressure?.toFixed(0)}</span><span className={styles.wLabel}>hPa</span></>}
                    {weather.rainfall > 0 && <span className={styles.wetBadge}><CloudRain size={10} /> WET</span>}
                  </span>
                )}
              </>
            ) : <span className={styles.noSession}>No live session — showing last session</span>}
          </div>
          <div className={styles.topRight}>
            <button className={`${styles.toggle} ${compact ? styles.toggleOn : ''}`} onClick={() => setCompact(v => !v)} style={{fontSize:'0.62rem',padding:'2px 8px',marginRight:8}}>Compact</button>
            {latestFlag && <RCBadge msg={latestFlag} />}
            <span className={styles.updateInfo}>
              <RefreshCw size={10} className={loading ? styles.spinning : ''} />
              {lastUpdate?.toLocaleTimeString('en-GB', {hour12:false})}
            </span>
            <button className="btn btn-ghost btn-sm" style={{padding:'3px 8px'}} onClick={fetchData}>
              <RefreshCw size={11} />
            </button>
          </div>
        </div>
      </div>

      {/* Main layout */}
      <div className={styles.mainRow}>
        {/* Timing table */}
        <div className={styles.tableCol}>
          {loading ? (
            <div className={styles.emptyState}><Activity size={28} style={{color:'var(--text-3)',marginBottom:8}} /><p>Loading timing data…</p></div>
          ) : error ? (
            <div className={styles.emptyState}><AlertTriangle size={28} style={{color:'var(--red)',marginBottom:8}} /><p>{error}</p></div>
          ) : standings.length === 0 ? (
            <div className={styles.emptyState}><Activity size={28} style={{color:'var(--text-3)',marginBottom:8}} /><p>Fetching timing data…</p></div>
          ) : (
            <>
              {/* Fixed header */}
              <div className={styles.tableHead} id="lt-hdr">
                <table className={styles.table} style={{tableLayout:'fixed'}}>
                  <colgroup>
                    <col style={{width:28}}/><col style={{width:34}}/><col style={{width:120}}/>
                    <col style={{width:72}}/><col style={{width:52}}/><col style={{width:72}}/>
                    <col style={{width:68}}/><col style={{width:72}}/>
                    {isPremium && <col style={{width:90}}/>}
                    <col style={{width:58}}/><col style={{width:58}}/><col style={{width:58}}/>
                    {isPremium && <><col style={{width:58}}/><col style={{width:58}}/><col style={{width:58}}/><col style={{width:38}}/></>}
                    <col style={{width:34}}/>
                  </colgroup>
                  <thead>
                    <tr>
                      <th></th><th style={{textAlign:'center'}}>#</th><th>DRIVER</th>
                      <th>INTERVAL</th><th>TYRE</th><th>BEST LAP</th>
                      <th>LEADER</th><th>LAST LAP</th>
                      {isPremium && <th>MINI SEC</th>}
                      <th style={{textAlign:'right',color:'#3671C6'}}>S1</th>
                      <th style={{textAlign:'right',color:'#E8002D'}}>S2</th>
                      <th style={{textAlign:'right',color:'#FF8000'}}>S3</th>
                      {isPremium && <>
                        <th style={{textAlign:'right',color:'#3671C6',opacity:0.5}}>S1pb</th>
                        <th style={{textAlign:'right',color:'#E8002D',opacity:0.5}}>S2pb</th>
                        <th style={{textAlign:'right',color:'#FF8000',opacity:0.5}}>S3pb</th>
                        <th style={{textAlign:'right',opacity:0.5}}>ST</th>
                      </>}
                      <th style={{textAlign:'right'}}>LAP</th>
                    </tr>
                  </thead>
                </table>
              </div>
              {/* Scrollable body */}
              <div className={styles.tableScroll} onScroll={e => {
                const h = document.getElementById('lt-hdr')
                if (h) h.scrollLeft = e.currentTarget.scrollLeft
              }}>
                <table className={`${styles.table} ${compact ? styles.compact : ''}`} style={{tableLayout:'fixed'}}>
                  <colgroup>
                    <col style={{width:28}}/><col style={{width:34}}/><col style={{width:120}}/>
                    <col style={{width:72}}/><col style={{width:52}}/><col style={{width:72}}/>
                    <col style={{width:68}}/><col style={{width:72}}/>
                    {isPremium && <col style={{width:90}}/>}
                    <col style={{width:58}}/><col style={{width:58}}/><col style={{width:58}}/>
                    {isPremium && <><col style={{width:58}}/><col style={{width:58}}/><col style={{width:58}}/><col style={{width:38}}/></>}
                    <col style={{width:34}}/>
                  </colgroup>
                  <tbody>
                    {standings.map((d, i) => {
                      const isP1 = i === 0
                      const sessionBest = standings.reduce((b, x) => {
                        if (x.best_lap && (!b || x.best_lap < b)) return x.best_lap
                        return b
                      }, null)
                      const isOverallBest = d.best_lap && d.best_lap === sessionBest
                      return (
                        <tr key={d.driver_number} className={`${styles.row} ${d.is_pit_out_lap ? styles.rowPit : ''} ${isP1 ? styles.rowP1 : ''}`}>
                          <td className={styles.tdPit}>{d.pit_stops > 0 && <span className={styles.pitTag}>PIT</span>}</td>
                          <td className={styles.tdPos}>
                            <span className={styles.posNum} style={{color:`#${d.team_colour}`,borderColor:`#${d.team_colour}`}}>{d.position}</span>
                          </td>
                          <td className={styles.tdDriver} onClick={() => isPremium && setSelDriver(d)} style={{cursor: isPremium ? 'pointer' : 'default'}}>
                            <span className={styles.teamBar} style={{background:`#${d.team_colour}`}} />
                            <div>
                              <div className={styles.acronym}>{d.name_acronym}</div>
                              <div className={styles.teamShort}>{d.team_name?.replace('F1 Team','').replace('Racing','').replace('Scuderia','').trim().split(' ')[0]}</div>
                            </div>
                          </td>
                          <td className={`mono ${styles.tdNum}`}>
                            {isP1 ? <span className={styles.intervalLbl}>Interval</span> : <span className={styles.intervalVal}>{fmtGap(d.interval)}</span>}
                          </td>
                          <td className={styles.tdTyre}><TyreChip compound={d.tyre} age={d.tyre_age} /></td>
                          <td className={`mono ${isOverallBest ? styles.purple : styles.dimTime}`}>{fmt(d.best_lap)}</td>
                          <td className={`mono ${styles.tdNum} ${styles.dimTime}`}>
                            {isP1 ? <span className={styles.leaderLbl}>Leader</span> : fmtGap(d.gap_to_leader)}
                          </td>
                          <td className={`mono ${d.is_personal_best ? styles.green : styles.dimTime}`}>{fmt(d.last_lap)}</td>
                          {isPremium && <td className={`${styles.tdMini} ${styles.hideMobile}`}><span className={styles.dash}>—</span></td>}
                          {[0,1,2].map(si => {
                            const val = d.sectors?.[si]
                            const SCOL = ['#3671C6','#E8002D','#FF8000'][si]
                            const sVals = standings.map(x => x.sectors?.[si]).filter(Boolean)
                            const sessionBestSector = sVals.length ? sVals.reduce((a, b) => a < b ? a : b) : null
                            const isSessionBest = val && sessionBestSector && val === sessionBestSector
                            const isPersonalBest = val && d.best_sectors?.[si] && Math.abs(val - d.best_sectors[si]) < 0.001
                            return (
                              <td key={si} className={`mono ${styles.tdSecCell} ${styles.hideMobile}`}>
                                {val
                                  ? <span style={{color: isPersonalBest ? '#b45cf4' : isSessionBest ? '#39d98a' : SCOL, fontWeight: isPersonalBest || isSessionBest ? 800 : 400}}>
                                      {val.toFixed(3)}
                                    </span>
                                  : <span className={styles.dash}>—</span>
                                }
                              </td>
                            )
                          })}
                          {isPremium && <>
                            {[0,1,2].map(si => {
                              const val = d.best_sectors?.[si]
                              const SCOL = ['#3671C6','#E8002D','#FF8000'][si]
                              return <td key={`pb${si}`} className={`mono ${styles.tdSecCell} ${styles.hideTablet}`} style={{opacity:0.6}}>
                                {val ? <span style={{color:SCOL}}>{val.toFixed(3)}</span> : <span className={styles.dash}>—</span>}
                              </td>
                            })}
                            <td className={`mono ${styles.hideTablet}`}>
                              {d.st_speed ?? <span className={styles.dash}>—</span>}
                            </td>
                          </>}
                          <td className={`mono ${styles.tdNum}`} style={{textAlign:'right',color:'var(--text-3)'}}>{d.lap_number || '—'}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* Right panel - track map only */}
        <div className={styles.rightPanel}>
          <div className={styles.rpMapWrap}>
            <div style={{padding:'4px 10px',fontSize:'0.6rem',fontWeight:700,letterSpacing:'0.1em',color:'var(--text-3)',textTransform:'uppercase',borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
              {session?.circuit_short_name ?? 'TRACK MAP'} <span style={{opacity:0.5,marginLeft:8}}>{session?.session_name}</span>
            </div>
            <TrackMap session={session} />
          </div>
        </div>
      </div>

      {/* Bottom panels */}
      <div className={styles.bottomPanels}>
        {/* Team Radio */}
        <div className={styles.champPanel}>
          <div className={styles.champTitle}>
            <Radio size={11} style={{marginRight:4}} /> TEAM RADIO
            {!isPremium && <span style={{fontSize:'0.55rem',color:'var(--gold)',marginLeft:'auto'}}>⚡ PRO</span>}
          </div>
          {radio.length === 0
            ? <div className={styles.champLoading}>{isPremium ? 'No radio yet' : 'Pro feature'}</div>
            : <div style={{overflowY:'auto',height:148}}>
                {radio.map((r, i) => {
                  const drv = standings.find(d => d.driver_number === r.driver_number)
                  return (
                    <div key={i} className={styles.radioRow}>
                      <span className={styles.radioAcr} style={{color:`#${drv?.team_colour ?? '555'}`}}>{drv?.name_acronym ?? `#${r.driver_number}`}</span>
                      {r.recording_url ? <audio src={r.recording_url} controls className={styles.radioAudio} /> : <span className={styles.radioNoAudio}>No audio</span>}
                      <span className={styles.radioTs}>{r.date ? new Date(r.date).toLocaleTimeString('en-GB',{hour12:false,hour:'2-digit',minute:'2-digit'}) : ''}</span>
                    </div>
                  )
                })}
              </div>
          }
        </div>

        {/* Race Control */}
        <div className={styles.champPanel}>
          <div className={styles.champTitle}>RACE CONTROL</div>
          {rc.length === 0
            ? <div className={styles.champLoading}>No messages</div>
            : <div style={{overflowY:'auto',height:148}}>
                {[...rc].reverse().slice(0,60).map((m, i) => (
                  <div key={i} className={styles.rcRow}>
                    <span className={styles.rcTs}>{m.date ? new Date(m.date).toLocaleTimeString('en-GB',{hour12:false,hour:'2-digit',minute:'2-digit'}) : ''}</span>
                    <span className={styles.rcTxt}>{m.message}</span>
                  </div>
                ))}
              </div>
          }
        </div>

        {/* Penalties */}
        <div className={`${styles.champPanel} ${styles.champPenalties}`}>
          <div className={styles.champTitle} style={{color:'var(--red)'}}>PENALTIES</div>
          {(() => {
            const tls = rc.filter(m => m.message?.toLowerCase().includes('track limit') || m.message?.toLowerCase().includes('deleted') || m.message?.toLowerCase().includes('time deleted'))
            const pens = rc.filter(m => m.message?.includes('PENALTY') || m.message?.includes('DRIVE THROUGH') || m.message?.includes('STOP GO'))
            const all = [...pens, ...tls].slice(-8).reverse()
            return all.length === 0
              ? <div className={styles.noPenalty}>No active penalties</div>
              : <div className={styles.penList}>
                  {all.map((m, i) => (
                    <div key={i} className={styles.penItem}>
                      <span className={pens.includes(m) ? styles.penTag : styles.tlTag}>{pens.includes(m) ? 'PEN' : 'TL'}</span>
                      <span className={styles.penMsg}>{m.message}</span>
                    </div>
                  ))}
                </div>
          })()}
        </div>
      </div>

      {/* Telemetry modal placeholder */}

      {/* Pro upsell */}
      {!isPremium && !loading && standings.length > 0 && (
        <div className={styles.upsell}>
          <Zap size={13} style={{color:'var(--gold)',flexShrink:0}} />
          <div><strong>F1Pulse Pro</strong> — <span style={{color:'var(--text-3)',fontWeight:400}}>live car dots, telemetry, 3s refresh, team radio</span></div>
          <Link to="/premium" className="btn btn-gold btn-sm" style={{marginLeft:'auto',flexShrink:0}}>Upgrade £3.99/mo</Link>
        </div>
      )}
    </div>
  )
}

// ── Track map component ────────────────────────────────────────────────────────
function TrackMap({ session }) {
  const [imgErr, setImgErr] = useState(false)
  const name = session?.circuit_short_name ?? ''
  const imgUrl = getCircuitImage(name)

  return (
    <div style={{flex:1,position:'relative',minHeight:0,overflow:'hidden'}}>
      {imgUrl && !imgErr
        ? <img src={imgUrl} alt={name} style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'contain',padding:10,opacity:0.9}} onError={() => setImgErr(true)} />
        : <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',color:'var(--text-3)',fontSize:'0.75rem'}}>No circuit data</div>
      }
    </div>
  )
}
