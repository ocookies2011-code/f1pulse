import { useEffect, useState, useRef, useCallback } from 'react'
import { Play, Pause, SkipBack, SkipForward, ChevronDown, Film, ChevronRight, Zap, Flag, Clock } from 'lucide-react'
import { getSessions, getMeetings, getAllLaps, getDrivers, getStints, flagUrl, fmt, fmtGap } from '../lib/openf1'
import { useAuth } from '../hooks/useAuth'
import { format, parseISO, isPast } from 'date-fns'
import { Link } from 'react-router-dom'
import styles from './Replay.module.css'

const SPEEDS = [0.25, 0.5, 1, 2, 5, 10]
const TYRE_COLOURS = { SOFT:'#e10600', MEDIUM:'#f5a623', HARD:'#e8e8e8', INTERMEDIATE:'#39a847', WET:'#0067ff' }
const TYRE_LABEL   = { SOFT:'S', MEDIUM:'M', HARD:'H', INTERMEDIATE:'I', WET:'W' }

export default function Replay() {
  const { isPremium } = useAuth()

  const [year,        setYear]        = useState(2026)
  const [meetings,    setMeetings]    = useState([])
  const [sessions,    setSessions]    = useState([])
  const [selMeeting,  setSelMeeting]  = useState(null)
  const [selSession,  setSelSession]  = useState(null)
  const [loadingMeta, setLoadingMeta] = useState(true)
  const [loadingData, setLoadingData] = useState(false)
  const [replayData,  setReplayData]  = useState(null)
  const [frame,       setFrame]       = useState(0)
  const [playing,     setPlaying]     = useState(false)
  const [speed,       setSpeed]       = useState(1)
  const [error,       setError]       = useState(null)
  const intervalRef = useRef(null)

  // Load meetings for year — no auth needed, public historical data
  useEffect(() => {
    setLoadingMeta(true)
    setMeetings([])
    setSessions([])
    setSelMeeting(null)
    setSelSession(null)
    setReplayData(null)

    getMeetings(year)
      .then(d => {
        const r = (d ?? [])
          .filter(m => !m.meeting_name?.toLowerCase().includes('testing') && isPast(parseISO(m.date_start)))
          .sort((a, b) => new Date(b.date_start) - new Date(a.date_start))
        setMeetings(r)
        if (r.length) setSelMeeting(r[0])
      })
      .catch(() => setError('Could not load race calendar'))
      .finally(() => setLoadingMeta(false))
  }, [year])

  // Load sessions when meeting changes
  useEffect(() => {
    if (!selMeeting) return
    setSessions([])
    setSelSession(null)
    setReplayData(null)

    getSessions({ meeting_key: selMeeting.meeting_key })
      .then(d => {
        const s = (d ?? [])
          .filter(sess => isPast(parseISO(sess.date_start)))
          .sort((a, b) => new Date(a.date_start) - new Date(b.date_start))
        setSessions(s)
        // Default to Race, else last session
        const race = s.find(x => x.session_name === 'Race')
        setSelSession(race ?? s[s.length - 1] ?? null)
      })
      .catch(() => {})
  }, [selMeeting])

  // Load replay data
  const loadReplay = useCallback(async () => {
    if (!selSession) return
    if (!isPremium) return
    setLoadingData(true)
    setPlaying(false)
    setFrame(0)
    setReplayData(null)
    setError(null)

    try {
      const [laps, drivers, stints] = await Promise.all([
        getAllLaps(selSession.session_key),
        getDrivers(selSession.session_key),
        getStints(selSession.session_key),
      ])

      if (!laps?.length) { setError('No lap data available for this session'); return }

      const drvMap = {}
      for (const d of drivers) drvMap[d.driver_number] = d

      const stintMap = {}
      for (const s of stints) {
        if (!stintMap[s.driver_number]) stintMap[s.driver_number] = []
        stintMap[s.driver_number].push(s)
      }

      const maxLap = Math.max(...laps.map(l => l.lap_number ?? 0))
      const frames = []

      for (let lapN = 1; lapN <= maxLap; lapN++) {
        const lapSlice = laps.filter(l => l.lap_number === lapN)
        if (!lapSlice.length) continue

        const driverStates = lapSlice.map(l => {
          const drv = drvMap[l.driver_number] ?? {}
          const allPrior = laps.filter(x => x.driver_number === l.driver_number && x.lap_number <= lapN)
          const bestLap = allPrior.reduce((b, x) => x.lap_duration && (!b || x.lap_duration < b.lap_duration) ? x : b, null)
          const cumTime = allPrior.reduce((s, x) => s + (x.lap_duration ?? 0), 0)
          const stint = (stintMap[l.driver_number] ?? [])
            .filter(s => (s.lap_start ?? 0) <= lapN)
            .sort((a, b) => b.lap_start - a.lap_start)[0]

          return {
            driver_number: l.driver_number,
            name_acronym:  drv.name_acronym ?? `#${l.driver_number}`,
            full_name:     drv.full_name ?? `Driver #${l.driver_number}`,
            team_name:     drv.team_name ?? '',
            team_colour:   drv.team_colour ?? '555555',
            lap_time:      l.lap_duration,
            cum_time:      cumTime,
            tyre:          stint?.compound ?? null,
            pit_stops:     (stintMap[l.driver_number] ?? []).filter(s => (s.lap_start ?? 0) < lapN && s.lap_start > 1).length,
            is_pit_out:    l.is_pit_out_lap ?? false,
            best_lap:      bestLap?.lap_duration ?? null,
            s1:            l.duration_sector_1,
            s2:            l.duration_sector_2,
            s3:            l.duration_sector_3,
          }
        })

        const sorted = driverStates.filter(d => d.cum_time > 0).sort((a, b) => a.cum_time - b.cum_time)
        const leaderTime = sorted[0]?.cum_time ?? 0

        frames.push({
          lap: lapN,
          standings: sorted.map((d, i) => ({ ...d, position: i + 1, gap: i === 0 ? 0 : d.cum_time - leaderTime }))
        })
      }

      setReplayData({
        session: selSession,
        meeting: selMeeting,
        drivers: Object.values(drvMap),
        frames,
        maxLap,
      })
    } catch (e) {
      setError('Failed to load session data')
    } finally {
      setLoadingData(false)
    }
  }, [selSession, isPremium, selMeeting])

  // Playback timer
  useEffect(() => {
    clearInterval(intervalRef.current)
    if (!playing || !replayData) return
    const ms = Math.max(100, 1000 / speed)
    intervalRef.current = setInterval(() => {
      setFrame(f => {
        if (f >= replayData.frames.length - 1) { setPlaying(false); return f }
        return f + 1
      })
    }, ms)
    return () => clearInterval(intervalRef.current)
  }, [playing, speed, replayData])

  const currentFrame = replayData?.frames[frame]
  const totalFrames  = replayData?.frames.length ?? 0
  const progress     = totalFrames > 1 ? (frame / (totalFrames - 1)) * 100 : 0

  // Global best sectors across all loaded data
  const globalBestS = [null, null, null]
  if (replayData) {
    for (const fr of replayData.frames) {
      for (const d of fr.standings) {
        if (d.s1 && (!globalBestS[0] || d.s1 < globalBestS[0])) globalBestS[0] = d.s1
        if (d.s2 && (!globalBestS[1] || d.s2 < globalBestS[1])) globalBestS[1] = d.s2
        if (d.s3 && (!globalBestS[2] || d.s3 < globalBestS[2])) globalBestS[2] = d.s3
      }
    }
  }

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <h1 className={styles.title}><Film size={20} /> Formula 1 Replay Sessions</h1>
        <p className={styles.sub}>Relive every session with full timing data and playback controls</p>
      </div>

      {/* ── Session selector ── */}
      <div className={styles.selectorCard}>
        <div className={styles.selectorTitle}>Select replay session</div>
        <div className={styles.selectorRow}>

          {/* Year */}
          <div className={styles.selectorGroup}>
            <label className={styles.selectorLabel}>Year</label>
            <div className={styles.selectWrap}>
              <select className={styles.select} value={year} onChange={e => setYear(Number(e.target.value))}>
                {[2026, 2025, 2024, 2023].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <ChevronDown size={13} className={styles.selectIcon} />
            </div>
          </div>

          {/* Grand Prix */}
          <div className={styles.selectorGroup} style={{ flex: 2 }}>
            <label className={styles.selectorLabel}>Grand Prix</label>
            <div className={styles.selectWrap}>
              <select
                className={styles.select}
                value={selMeeting?.meeting_key ?? ''}
                onChange={e => {
                  const m = meetings.find(x => String(x.meeting_key) === e.target.value)
                  setSelMeeting(m ?? null)
                }}
                disabled={loadingMeta}
              >
                {loadingMeta
                  ? <option>Loading…</option>
                  : meetings.length === 0
                  ? <option>No races yet for {year}</option>
                  : meetings.map(m => (
                      <option key={m.meeting_key} value={String(m.meeting_key)}>
                        {m.meeting_name} · {format(parseISO(m.date_start), 'd MMM yyyy')}
                      </option>
                    ))
                }
              </select>
              <ChevronDown size={13} className={styles.selectIcon} />
            </div>
          </div>

          {/* Session */}
          <div className={styles.selectorGroup}>
            <label className={styles.selectorLabel}>Session</label>
            <div className={styles.selectWrap}>
              <select
                className={styles.select}
                value={selSession?.session_key ?? ''}
                onChange={e => {
                  const s = sessions.find(x => String(x.session_key) === e.target.value)
                  setSelSession(s ?? null)
                  setReplayData(null)
                }}
                disabled={!sessions.length}
              >
                {sessions.length === 0
                  ? <option>Select a Grand Prix first…</option>
                  : sessions.map(s => <option key={s.session_key} value={String(s.session_key)}>{s.session_name}</option>)
                }
              </select>
              <ChevronDown size={13} className={styles.selectIcon} />
            </div>
          </div>

          {/* Load button */}
          {isPremium
            ? <button
                className={styles.loadBtn}
                onClick={loadReplay}
                disabled={!selSession || loadingData}
              >
                {loadingData ? <><span className={styles.loadSpinner} /> Loading data…</> : <><Play size={13} /> Load Replay</>}
              </button>
            : <Link to="/premium" className={styles.proBtn}>
                <Zap size={13} /> Unlock Pro
              </Link>
          }
        </div>

        {/* Session info strip */}
        {selMeeting && selSession && (
          <div className={styles.sessionInfo}>
            {selMeeting.country_flag && <img src={selMeeting.country_flag} alt="" style={{width:20,height:14,objectFit:'cover',borderRadius:2}} onError={e=>e.target.style.display='none'} />}
            <span className={styles.sessionInfoName}>{selMeeting.meeting_name}</span>
            <span className={styles.sessionInfoSep}>·</span>
            <span className={styles.sessionInfoType}>{selSession.session_name}</span>
            <span className={styles.sessionInfoSep}>·</span>
            <span className={styles.sessionInfoDate}><Clock size={11} /> {format(parseISO(selSession.date_start), 'd MMM yyyy, HH:mm')}</span>
            {!isPremium && <span className={styles.sessionInfoPro}><Zap size={10} style={{color:'var(--gold)'}} /> Pro required to load</span>}
          </div>
        )}
      </div>

      {error && <div className={styles.errorMsg}>{error}</div>}

      {/* ── No data state ── */}
      {!replayData && !loadingData && (
        <div className={styles.emptyState}>
          <Film size={40} style={{ color: 'rgba(255,255,255,0.1)', marginBottom: 16 }} />
          <p>{isPremium ? 'Select a session above and click Load Replay' : 'Upgrade to Pro to access session replays'}</p>
          {!isPremium && (
            <Link to="/premium" className="btn btn-gold" style={{ marginTop: 12 }}>
              <Zap size={14} /> F1Pulse Pro — £3.99/mo
            </Link>
          )}
        </div>
      )}

      {/* ── Player ── */}
      {replayData && (
        <div className={styles.playerWrap}>

          {/* Session header */}
          <div className={styles.playerHeader}>
            <div className={styles.playerHeaderLeft}>
              <span className={styles.playerMeeting}>{replayData.meeting?.meeting_name}</span>
              <span className={styles.playerSession}>{replayData.session?.session_name}</span>
            </div>
            <div className={styles.playerHeaderRight}>
              <span className={styles.playerLap}>LAP {currentFrame?.lap ?? '—'} / {replayData.maxLap}</span>
            </div>
          </div>

          {/* Playback controls */}
          <div className={styles.playerBar}>
            <div className={styles.playerControls}>
              <button className={styles.playerBtn} onClick={() => { setPlaying(false); setFrame(0) }} title="Restart">
                <SkipBack size={14} />
              </button>
              <button className={styles.playerBtn} onClick={() => setFrame(f => Math.max(0, f - 1))} title="Prev lap">
                <ChevronRight size={14} style={{ transform: 'rotate(180deg)' }} />
              </button>
              <button
                className={`${styles.playerBtn} ${styles.playBtn}`}
                onClick={() => {
                  if (frame >= totalFrames - 1) setFrame(0)
                  setPlaying(v => !v)
                }}
              >
                {playing ? <Pause size={18} /> : <Play size={18} />}
              </button>
              <button className={styles.playerBtn} onClick={() => setFrame(f => Math.min(f + 1, totalFrames - 1))} title="Next lap">
                <ChevronRight size={14} />
              </button>
              <button className={styles.playerBtn} onClick={() => { setPlaying(false); setFrame(totalFrames - 1) }} title="End">
                <SkipForward size={14} />
              </button>
            </div>

            {/* Scrubber */}
            <div className={styles.scrubberWrap}>
              <input
                type="range" min={0} max={totalFrames - 1} value={frame}
                onChange={e => { setPlaying(false); setFrame(Number(e.target.value)) }}
                className={styles.scrubber}
                style={{ '--progress': `${progress}%` }}
              />
              <div className={styles.scrubberLabels}>
                <span>Lap 1</span>
                <span>Lap {Math.round(totalFrames / 2)}</span>
                <span>Lap {replayData.maxLap}</span>
              </div>
            </div>

            {/* Speed */}
            <div className={styles.speedGroup}>
              {SPEEDS.map(s => (
                <button key={s} className={`${styles.speedBtn} ${speed === s ? styles.speedActive : ''}`} onClick={() => setSpeed(s)}>
                  {s}×
                </button>
              ))}
            </div>
          </div>

          {/* Standings table */}
          {currentFrame && (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.thPos}>POS</th>
                    <th className={styles.thDriver}>DRIVER</th>
                    <th className={styles.thTyre}>TYRE</th>
                    <th className={styles.thTime}>LAP TIME</th>
                    <th className={styles.thGap}>GAP</th>
                    <th className={styles.thSec} style={{color:'#3671C6'}}>S1</th>
                    <th className={styles.thSec} style={{color:'#E8002D'}}>S2</th>
                    <th className={styles.thSec} style={{color:'#FF8000'}}>S3</th>
                    <th className={styles.thTime}>BEST LAP</th>
                    <th className={styles.thPit}>PIT</th>
                  </tr>
                </thead>
                <tbody>
                  {currentFrame.standings.map((d, i) => {
                    const isLead = d.position === 1
                    const col = `#${d.team_colour}`
                    return (
                      <tr key={d.driver_number} className={`${styles.row} ${d.is_pit_out ? styles.rowPit : ''}`}>
                        <td className={styles.tdPos}>
                          <span className={styles.posBox} style={{ color: col, borderColor: col }}>{d.position}</span>
                        </td>
                        <td className={styles.tdDriver}>
                          <span className={styles.driverBar} style={{ background: col }} />
                          <div>
                            <div className={styles.driverName}>{d.name_acronym}</div>
                            <div className={styles.driverTeam}>{d.team_name?.split(' ')[0]}</div>
                          </div>
                        </td>
                        <td className={styles.tdTyre}>
                          {d.tyre && (
                            <span className={styles.tyreChip} style={{ color: TYRE_COLOURS[d.tyre] ?? '#aaa' }}>
                              <span className={styles.tyreDot} style={{ background: TYRE_COLOURS[d.tyre] ?? '#aaa' }} />
                              {TYRE_LABEL[d.tyre] ?? d.tyre[0]}
                            </span>
                          )}
                        </td>
                        <td className={`mono ${styles.tdTime}`}>{d.lap_time ? fmt(d.lap_time) : '—'}</td>
                        <td className={`mono ${styles.tdGap}`}>
                          {isLead
                            ? <span className={styles.lead}>LEAD</span>
                            : d.gap > 0 ? `+${d.gap.toFixed(3)}` : '—'
                          }
                        </td>
                        {[d.s1, d.s2, d.s3].map((sv, si) => {
                          const SCOL = ['#3671C6','#E8002D','#FF8000'][si]
                          const isBest = sv && globalBestS[si] && Math.abs(sv - globalBestS[si]) < 0.001
                          return (
                            <td key={si} className={`mono ${styles.tdSec}`}>
                              {sv
                                ? <span style={{ color: isBest ? '#b45cf4' : SCOL, fontWeight: isBest ? 800 : 400, opacity: isBest ? 1 : 0.8 }}>{sv.toFixed(3)}</span>
                                : <span style={{ color: 'rgba(255,255,255,0.15)' }}>—</span>
                              }
                            </td>
                          )
                        })}
                        <td className={`mono ${styles.tdTime}`} style={{ color: 'rgba(255,255,255,0.5)' }}>
                          {d.best_lap ? fmt(d.best_lap) : '—'}
                        </td>
                        <td className={`mono ${styles.tdPit}`} style={{ color: 'rgba(255,255,255,0.4)' }}>{d.pit_stops || '—'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
