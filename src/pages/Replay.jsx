import { useEffect, useState, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Play, Pause, SkipBack, SkipForward, Zap, ChevronDown, Film, ChevronRight } from 'lucide-react'
import { getSessions, getMeetings, getAllLaps, getDrivers, getStints, flagUrl, fmt } from '../lib/openf1'
import { useAuth } from '../hooks/useAuth'
import { format, parseISO } from 'date-fns'
import styles from './Replay.module.css'

const SPEEDS = [0.5, 1, 2, 5, 10]

function PremiumGate() {
  return (
    <div className={styles.gate}>
      <div className={styles.gateIcon}><Film size={32} /></div>
      <h2 className={styles.gateTitle}>Session Replay</h2>
      <p className={styles.gateSub}>
        Replay any session from the 2026 season. Watch positions evolve lap-by-lap,
        track tyre strategies, pit windows and championship-defining moments.
      </p>
      <ul className={styles.gateFeatures}>
        <li><ChevronRight size={13} style={{ color: 'var(--gold)' }} /> Replay any race, qualifying or practice session</li>
        <li><ChevronRight size={13} style={{ color: 'var(--gold)' }} /> Adjustable playback speed (0.5× to 10×)</li>
        <li><ChevronRight size={13} style={{ color: 'var(--gold)' }} /> Lap-by-lap position and gap changes</li>
        <li><ChevronRight size={13} style={{ color: 'var(--gold)' }} /> Full tyre strategy timeline</li>
        <li><ChevronRight size={13} style={{ color: 'var(--gold)' }} /> Fastest lap and sector comparisons</li>
      </ul>
      <Link to="/premium" className="btn btn-gold" style={{ marginTop: 8 }}>
        <Zap size={14} /> Unlock with F1Pulse Pro — £3.99/mo
      </Link>
    </div>
  )
}

export default function Replay() {
  const { isPremium } = useAuth()
  const [meetings,    setMeetings]    = useState([])
  const [sessions,    setSessions]    = useState([])
  const [selMeeting,  setSelMeeting]  = useState('')
  const [selSession,  setSelSession]  = useState('')
  const [loading,     setLoading]     = useState(false)
  const [loadingMeta, setLoadingMeta] = useState(true)
  const [replayData,  setReplayData]  = useState(null)
  const [frame,       setFrame]       = useState(0)
  const [playing,     setPlaying]     = useState(false)
  const [speed,       setSpeed]       = useState(1)
  const intervalRef = useRef(null)

  // Load meetings
  useEffect(() => {
    if (!isPremium) return
    getMeetings(2026)
      .then(d => {
        const r = d
          .filter(m => !m.meeting_name?.toLowerCase().includes('testing'))
          .sort((a, b) => new Date(b.date_start) - new Date(a.date_start))
        setMeetings(r)
        if (r[0]) setSelMeeting(String(r[0].meeting_key))
      })
      .catch(console.error)
      .finally(() => setLoadingMeta(false))
  }, [isPremium])

  // Load sessions when meeting changes
  useEffect(() => {
    if (!selMeeting) return
    getSessions({ meeting_key: selMeeting })
      .then(d => {
        const s = d.sort((a, b) => new Date(a.date_start) - new Date(b.date_start))
        setSessions(s)
        const race = s.find(x => x.session_name === 'Race')
        setSelSession(String(race?.session_key ?? s[s.length - 1]?.session_key ?? ''))
        setReplayData(null)
        setFrame(0)
        setPlaying(false)
      })
      .catch(console.error)
  }, [selMeeting])

  const loadReplay = useCallback(async () => {
    if (!selSession) return
    setLoading(true)
    setPlaying(false)
    setFrame(0)
    setReplayData(null)

    try {
      // Sequential fetching
      const laps    = await getAllLaps(selSession)
      const drivers = await getDrivers(selSession)
      const stints  = await getStints(selSession)

      const drvMap   = {}
      for (const d of drivers) drvMap[d.driver_number] = d

      const stintMap = {}
      for (const s of stints) {
        if (!stintMap[s.driver_number]) stintMap[s.driver_number] = []
        stintMap[s.driver_number].push(s)
      }

      // Group laps by lap number → array of driver states per lap
      const maxLap = Math.max(...laps.map(l => l.lap_number ?? 0))
      const frames = []

      for (let lapN = 1; lapN <= maxLap; lapN++) {
        const lapSlice = laps.filter(l => l.lap_number === lapN)
        if (!lapSlice.length) continue

        // Build standings for this lap
        const driverStates = lapSlice.map(l => {
          const drv   = drvMap[l.driver_number] ?? {}
          const allPrior = laps.filter(x => x.driver_number === l.driver_number && x.lap_number <= lapN)
          const bestLap  = allPrior.reduce((b, x) => x.lap_duration && (!b || x.lap_duration < b.lap_duration) ? x : b, null)
          const stint    = (stintMap[l.driver_number] ?? [])
            .filter(s => (s.lap_start ?? 0) <= lapN)
            .sort((a, b) => b.lap_start - a.lap_start)[0]
          const cumTime  = allPrior.reduce((s, x) => s + (x.lap_duration ?? 0), 0)
          return {
            driver_number: l.driver_number,
            name_acronym:  drv.name_acronym ?? `#${l.driver_number}`,
            team_name:     drv.team_name ?? '',
            team_colour:   drv.team_colour ?? '555555',
            lap_time:      l.lap_duration,
            cum_time:      cumTime,
            tyre:          stint?.compound ?? null,
            pit_stops:     (stintMap[l.driver_number] ?? []).filter(s => (s.lap_start ?? 0) < lapN).length,
            is_pit_out:    l.is_pit_out_lap ?? false,
            best_lap:      bestLap?.lap_duration ?? null,
          }
        })

        // Sort by cumulative time ascending
        const sorted = driverStates
          .filter(d => d.cum_time > 0)
          .sort((a, b) => a.cum_time - b.cum_time)

        const leaderTime = sorted[0]?.cum_time ?? 0
        const withPos = sorted.map((d, i) => ({
          ...d,
          position: i + 1,
          gap: i === 0 ? 0 : d.cum_time - leaderTime,
        }))

        frames.push({ lap: lapN, standings: withPos })
      }

      setReplayData({ drivers: Object.values(drvMap), frames })
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [selSession])

  // Playback
  useEffect(() => {
    clearInterval(intervalRef.current)
    if (!playing || !replayData) return
    const ms = Math.max(200, 1000 / speed)
    intervalRef.current = setInterval(() => {
      setFrame(f => {
        if (f >= replayData.frames.length - 1) { setPlaying(false); return f }
        return f + 1
      })
    }, ms)
    return () => clearInterval(intervalRef.current)
  }, [playing, speed, replayData])

  if (!isPremium) return (
    <div className="page"><PremiumGate /></div>
  )

  const currentFrame = replayData?.frames[frame]
  const totalFrames  = replayData?.frames.length ?? 0

  const TYRE_COLOURS = { SOFT: '#e10600', MEDIUM: '#f5a623', HARD: '#d8d8d8', INTERMEDIATE: '#39a847', WET: '#0067ff' }

  return (
    <div className="page">
      <div className="page-hd">
        <h1><Film size={20} /> Session Replay</h1>
        <p>Replay any 2026 season session lap-by-lap</p>
      </div>

      {/* Controls */}
      <div className={styles.controls}>
        {/* Meeting picker */}
        <div className={styles.selectWrap}>
          <select
            value={selMeeting}
            onChange={e => setSelMeeting(e.target.value)}
            className={styles.select}
          >
            <option value="">Select race weekend…</option>
            {meetings.map(m => (
              <option key={m.meeting_key} value={String(m.meeting_key)}>
                {m.meeting_name} ({format(parseISO(m.date_start), 'd MMM')})
              </option>
            ))}
          </select>
          <ChevronDown size={14} className={styles.selectIcon} />
        </div>

        {/* Session picker */}
        <div className={styles.selectWrap}>
          <select
            value={selSession}
            onChange={e => { setSelSession(e.target.value); setReplayData(null) }}
            className={styles.select}
            disabled={!sessions.length}
          >
            <option value="">Select session…</option>
            {sessions.map(s => (
              <option key={s.session_key} value={String(s.session_key)}>
                {s.session_name}
              </option>
            ))}
          </select>
          <ChevronDown size={14} className={styles.selectIcon} />
        </div>

        <button
          className="btn btn-primary btn-sm"
          onClick={loadReplay}
          disabled={!selSession || loading}
        >
          {loading ? 'Loading…' : 'Load Session'}
        </button>
      </div>

      {/* Player */}
      {loading ? (
        <div className="spinner-wrap"><div className="spinner" /></div>
      ) : replayData ? (
        <>
          {/* Playback bar */}
          <div className={styles.playerBar}>
            <div className={styles.playerLeft}>
              <button className={styles.playerBtn} onClick={() => setFrame(0)} title="Restart">
                <SkipBack size={16} />
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
              <button
                className={styles.playerBtn}
                onClick={() => setFrame(f => Math.min(f + 1, totalFrames - 1))}
                title="Next lap"
              >
                <SkipForward size={16} />
              </button>
            </div>

            {/* Scrubber */}
            <input
              type="range" min={0} max={totalFrames - 1} value={frame}
              onChange={e => { setPlaying(false); setFrame(Number(e.target.value)) }}
              className={styles.scrubber}
            />

            <div className={styles.playerRight}>
              <span className={styles.lapLabel}>LAP {currentFrame?.lap ?? '—'}</span>
              {/* Speed selector */}
              <div className={styles.speedWrap}>
                {SPEEDS.map(s => (
                  <button
                    key={s}
                    className={`${styles.speedBtn} ${speed === s ? styles.speedActive : ''}`}
                    onClick={() => setSpeed(s)}
                  >
                    {s}×
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Standings table */}
          {currentFrame && (
            <div className="data-table-wrap" style={{ marginTop: 16 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>POS</th>
                    <th>DRIVER</th>
                    <th>LAP TIME</th>
                    <th>GAP</th>
                    <th>TYRE</th>
                    <th>STOPS</th>
                    <th>BEST LAP</th>
                  </tr>
                </thead>
                <tbody>
                  {currentFrame.standings.map(d => (
                    <tr key={d.driver_number}>
                      <td className="mono" style={{ fontWeight: 800, fontSize: '0.95rem' }}>{d.position}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                          <span style={{ width: 3, height: 24, borderRadius: 2, background: `#${d.team_colour}`, flexShrink: 0 }} />
                          <div>
                            <div style={{ fontWeight: 700 }}>{d.name_acronym}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-3)' }}>{d.team_name?.split(' ')[0]}</div>
                          </div>
                        </div>
                      </td>
                      <td className="mono" style={{ color: 'var(--text-2)' }}>{fmt(d.lap_time)}</td>
                      <td className="mono" style={{ color: 'var(--text-3)', fontSize: '0.82rem' }}>
                        {d.position === 1 ? <span style={{ color: 'var(--green)', fontWeight: 700 }}>LEAD</span> : `+${d.gap?.toFixed(3) ?? '—'}`}
                      </td>
                      <td>
                        {d.tyre && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.8rem', fontWeight: 700, color: TYRE_COLOURS[d.tyre] ?? 'var(--text-2)' }}>
                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: TYRE_COLOURS[d.tyre] ?? '#888' }} />
                            {d.tyre[0]}
                          </span>
                        )}
                      </td>
                      <td className="mono" style={{ color: 'var(--text-3)', fontSize: '0.82rem' }}>{d.pit_stops}</td>
                      <td className="mono" style={{ color: 'var(--text-2)', fontSize: '0.82rem' }}>{fmt(d.best_lap)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : (
        <div className={styles.empty}>
          <Film size={36} style={{ color: 'var(--text-3)', marginBottom: 12 }} />
          <p>Select a race weekend and session above, then click <strong>Load Session</strong></p>
        </div>
      )}
    </div>
  )
}
