import { useEffect, useState, useRef, useCallback } from 'react'
import { Play, Pause, SkipBack, SkipForward, Zap, Clock, ChevronDown } from 'lucide-react'
import { getSessions, getMeetings, getAllLaps, getDrivers, getPositions, getStints, flagUrl, fmt } from '../lib/openf1'
import { useAuth } from '../hooks/useAuth'
import { Link } from 'react-router-dom'
import styles from './Replay.module.css'

const SPEEDS = [0.5, 1, 2, 5, 10]

export default function Replay() {
  const { isPremium } = useAuth()
  const [meetings, setMeetings] = useState([])
  const [sessions, setSessions] = useState([])
  const [selMeeting, setSelMeeting] = useState('')
  const [selSession, setSelSession] = useState('')
  const [loading, setLoading] = useState(false)
  const [replayData, setReplayData] = useState(null) // { drivers, frames: [{time, standings}] }
  const [frame, setFrame] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const intervalRef = useRef(null)

  // Load meetings on mount
  useEffect(() => {
    getMeetings(2026).then(d => {
      const r = d.filter(m => !m.meeting_name?.toLowerCase().includes('testing'))
                 .sort((a,b) => new Date(b.date_start) - new Date(a.date_start))
      setMeetings(r)
      if (r[0]) setSelMeeting(r[0].meeting_key)
    }).catch(console.error)
  }, [])

  // Load sessions when meeting changes
  useEffect(() => {
    if (!selMeeting) return
    getSessions({ meeting_key: selMeeting })
      .then(d => {
        const s = d.sort((a,b) => new Date(a.date_start) - new Date(b.date_start))
        setSessions(s)
        setSelSession(s.find(x => x.session_name==='Race')?.session_key || s[s.length-1]?.session_key || '')
      }).catch(console.error)
  }, [selMeeting])

  async function loadReplay() {
    if (!selSession) return
    setLoading(true)
    setPlaying(false)
    setFrame(0)
    setReplayData(null)
    try {
      const [laps, drivers, stints] = await Promise.all([
        getAllLaps(selSession),
        getDrivers(selSession),
        getStints(selSession),
      ])
      const drvMap = {}
      for (const d of drivers) drvMap[d.driver_number] = d

      const stintMap = {}
      for (const s of stints) {
        if (!stintMap[s.driver_number] || s.stint_number > stintMap[s.driver_number].stint_number)
          stintMap[s.driver_number] = s
      }

      // Group laps by lap number — each lap number = one "frame"
      const lapByNum = {}
      for (const l of laps) {
        if (!lapByNum[l.lap_number]) lapByNum[l.lap_number] = []
        lapByNum[l.lap_number].push(l)
      }
      const maxLap = Math.max(...Object.keys(lapByNum).map(Number))

      // Build cumulative standings per lap
      const cumulative = {} // driver_number → total seconds
      for (const d of drivers) cumulative[d.driver_number] = 0

      const frames = []
      for (let lap = 1; lap <= maxLap; lap++) {
        const lapData = lapByNum[lap] || []
        for (const l of lapData) {
          if (l.lap_duration) cumulative[l.driver_number] = (cumulative[l.driver_number] || 0) + l.lap_duration
        }
        // Sort by cumulative time (lower = ahead) — pit laps count too
        const standings = Object.entries(cumulative)
          .map(([dn, total]) => {
            const drv = drvMap[parseInt(dn)] ?? {}
            const lapThis = lapData.find(l => l.driver_number === parseInt(dn))
            const stint = stintMap[parseInt(dn)]
            return {
              driver_number: parseInt(dn),
              name_acronym: drv.name_acronym ?? `#${dn}`,
              team_colour: drv.team_colour ?? '555555',
              tyre: stint?.compound ?? null,
              last_lap: lapThis?.lap_duration ?? null,
              s1: lapThis?.duration_sector_1 ?? null,
              s2: lapThis?.duration_sector_2 ?? null,
              s3: lapThis?.duration_sector_3 ?? null,
              total_time: total,
              is_pit_out: lapThis?.is_pit_out_lap ?? false,
            }
          })
          .filter(s => s.total_time > 0)
          .sort((a,b) => a.total_time - b.total_time)
          .map((s, i) => ({ ...s, position: i+1, gap: i===0 ? null : s.total_time - standings[0]?.total_time }))

        frames.push({ lap, standings })
      }

      setReplayData({ frames, drivers: drvMap })
    } catch(e) {
      console.error(e)
    } finally { setLoading(false) }
  }

  // Playback
  useEffect(() => {
    if (playing && replayData) {
      intervalRef.current = setInterval(() => {
        setFrame(f => {
          if (f >= replayData.frames.length - 1) { setPlaying(false); return f }
          return f + 1
        })
      }, 1000 / speed)
    } else {
      clearInterval(intervalRef.current)
    }
    return () => clearInterval(intervalRef.current)
  }, [playing, speed, replayData])

  const currentFrame = replayData?.frames[frame]
  const progress = replayData ? (frame / (replayData.frames.length - 1)) * 100 : 0

  if (!isPremium) return (
    <div className="page-wrap">
      <div className={styles.gate}>
        <Zap size={40} style={{color:'var(--gold)',marginBottom:16}}/>
        <h2>Session Replay is a Premium feature</h2>
        <p>Rewind any session, lap by lap. See how the race unfolded, who gained on which lap, and when pit windows changed everything.</p>
        <Link to="/premium" className="btn btn-gold" style={{marginTop:20}}>Upgrade to Premium</Link>
      </div>
    </div>
  )

  return (
    <div className="page-wrap">
      <div className="page-header">
        <div>
          <h1 className="page-title"><SkipBack size={20}/> Session Replay</h1>
          <p className="page-sub">Replay any 2026 session lap by lap</p>
        </div>
      </div>

      {/* Session selector */}
      <div className={styles.controls}>
        <select className={styles.sel} value={selMeeting} onChange={e=>setSelMeeting(e.target.value)}>
          {meetings.map(m => <option key={m.meeting_key} value={m.meeting_key}>{m.meeting_name}</option>)}
        </select>
        <select className={styles.sel} value={selSession} onChange={e=>setSelSession(e.target.value)}>
          {sessions.map(s => <option key={s.session_key} value={s.session_key}>{s.session_name}</option>)}
        </select>
        <button className="btn btn-primary btn-sm" onClick={loadReplay} disabled={loading || !selSession}>
          {loading ? <><div className="spinner" style={{width:14,height:14}}/> Loading…</> : 'Load Session'}
        </button>
      </div>

      {replayData && (
        <>
          {/* Playback bar */}
          <div className={styles.player}>
            <button className={styles.playBtn} onClick={()=>setFrame(0)} title="Restart"><SkipBack size={16}/></button>
            <button className={styles.playBtn} onClick={()=>setFrame(f=>Math.max(0,f-1))}><SkipBack size={14}/></button>
            <button className={`${styles.playBtn} ${styles.playBtnMain}`} onClick={()=>setPlaying(v=>!v)}>
              {playing ? <Pause size={18}/> : <Play size={18}/>}
            </button>
            <button className={styles.playBtn} onClick={()=>setFrame(f=>Math.min(replayData.frames.length-1,f+1))}><SkipForward size={14}/></button>
            <button className={styles.playBtn} onClick={()=>setFrame(replayData.frames.length-1)} title="End"><SkipForward size={16}/></button>

            <div className={styles.progressWrap} onClick={e=>{
              const rect = e.currentTarget.getBoundingClientRect()
              const pct = (e.clientX - rect.left) / rect.width
              setFrame(Math.round(pct*(replayData.frames.length-1)))
            }}>
              <div className={styles.progressBg}>
                <div className={styles.progressFill} style={{width:`${progress}%`}}/>
              </div>
            </div>

            <div className={styles.lapInfo}>
              <Clock size={12}/> Lap {currentFrame?.lap} / {replayData.frames.length}
            </div>

            <div className={styles.speedWrap}>
              {SPEEDS.map(s => (
                <button key={s} className={`${styles.speedBtn} ${speed===s?styles.speedActive:''}`} onClick={()=>setSpeed(s)}>
                  {s}×
                </button>
              ))}
            </div>
          </div>

          {/* Standings table */}
          <div className="dt-wrap">
            <table className="dt">
              <thead><tr>
                <th>POS</th><th>DRIVER</th><th>TYRE</th>
                <th className="mono">LAST LAP</th>
                <th className="mono">S1</th><th className="mono">S2</th><th className="mono">S3</th>
                <th className="mono">GAP</th>
              </tr></thead>
              <tbody>
                {currentFrame?.standings.map(d => (
                  <tr key={d.driver_number} className={d.is_pit_out ? styles.pitRow : ''}>
                    <td><span className="mono" style={{fontWeight:800}}>{d.position}</span></td>
                    <td>
                      <div style={{display:'flex',alignItems:'center',gap:8}}>
                        <span style={{width:3,height:22,borderRadius:2,background:`#${d.team_colour}`,display:'inline-block',flexShrink:0}}/>
                        <span style={{fontWeight:700}}>{d.name_acronym}</span>
                        {d.is_pit_out && <span className={styles.pitBadge}>PIT</span>}
                      </div>
                    </td>
                    <td>{d.tyre ? <span className={`tyre ${d.tyre[0]}`} title={d.tyre}/> : '—'}</td>
                    <td className="mono">{fmt(d.last_lap)}</td>
                    <td className="mono" style={{color:'var(--text-2)'}}>{d.s1?.toFixed(3) ?? '—'}</td>
                    <td className="mono" style={{color:'var(--text-2)'}}>{d.s2?.toFixed(3) ?? '—'}</td>
                    <td className="mono" style={{color:'var(--text-2)'}}>{d.s3?.toFixed(3) ?? '—'}</td>
                    <td className="mono" style={{color:'var(--text-2)'}}>
                      {d.gap === null ? <span style={{color:'var(--gold)',fontWeight:700}}>LEADER</span>
                        : typeof d.gap==='string' ? d.gap : `+${d.gap.toFixed(3)}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {!replayData && !loading && (
        <div className="state-msg">Select a session above and click Load Session to begin replay</div>
      )}
    </div>
  )
}
