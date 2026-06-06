import { useEffect, useState, useCallback } from 'react'
import { Flag, ChevronDown, ChevronUp, Clock, Zap, Trophy, AlertCircle } from 'lucide-react'
import { getMeetings, getSessions, getDrivers, getSessionResult, getStints, flagUrl, fmt } from '../lib/openf1'
import { format, isPast, parseISO } from 'date-fns'
import styles from './Results.module.css'

const TYRE_COLOURS = { SOFT:'#e10600', MEDIUM:'#f5a623', HARD:'#d8d8d8', INTERMEDIATE:'#39a847', WET:'#0067ff' }
const TYRE_LABELS  = { SOFT:'S', MEDIUM:'M', HARD:'H', INTERMEDIATE:'I', WET:'W' }

function TyreChip({ compound }) {
  if (!compound) return null
  const k = compound.toUpperCase()
  return (
    <span className={styles.tyre} style={{ color: TYRE_COLOURS[k] ?? '#888', borderColor: TYRE_COLOURS[k] ?? '#888' }}>
      {TYRE_LABELS[k] ?? compound[0]}
    </span>
  )
}

function medal(pos) {
  if (pos === 1) return <span className={styles.medal} style={{ color:'#ffd700' }}>●</span>
  if (pos === 2) return <span className={styles.medal} style={{ color:'#c0c0c0' }}>●</span>
  if (pos === 3) return <span className={styles.medal} style={{ color:'#cd7f32' }}>●</span>
  return null
}

function RaceResult({ raceSession, drivers }) {
  const [result,  setResult]  = useState(null)
  const [stints,  setStints]  = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    if (!raceSession?.session_key) return
    const sk = raceSession.session_key
    setLoading(true)
    setResult(null)
    setError(null)
    Promise.all([
      getSessionResult(sk).catch(() => null),
      getStints(sk).catch(() => []),
    ]).then(([res, st]) => {
      setResult(res)
      setStints(st ?? [])
    }).catch(() => setError('Failed to load result'))
      .finally(() => setLoading(false))
  }, [raceSession?.session_key])

  const drvMap = {}
  for (const d of drivers) drvMap[d.driver_number] = d

  // Build final tyre for each driver (last stint compound)
  const finalTyreMap = {}
  for (const s of stints) {
    if (!finalTyreMap[s.driver_number] || s.stint_number > finalTyreMap[s.driver_number].stint_number)
      finalTyreMap[s.driver_number] = s
  }

  // Stint sequence per driver
  const stintsByDriver = {}
  for (const s of stints) {
    if (!stintsByDriver[s.driver_number]) stintsByDriver[s.driver_number] = []
    stintsByDriver[s.driver_number].push(s)
  }
  for (const k of Object.keys(stintsByDriver))
    stintsByDriver[k].sort((a,b) => a.stint_number - b.stint_number)

  if (loading) return <div className={styles.resultLoading}><div className="spinner" /></div>
  if (error)   return <div className={styles.resultError}><AlertCircle size={14} /> {error}</div>
  if (!result?.length) return <div className={styles.resultError}>No result data available</div>

  const fastest = result.reduce((b, r) => {
    if (!r.time) return b
    const s = parseTimeToSecs(r.time)
    if (!b || s < parseTimeToSecs(b.time)) return r
    return b
  }, null)

  return (
    <div className={styles.resultTable}>
      <table>
        <thead>
          <tr>
            <th className={styles.thPos}>POS</th>
            <th className={styles.thDriver}>DRIVER</th>
            <th className={styles.thTeam}>TEAM</th>
            <th className={styles.thStrats}>TYRES</th>
            <th className={styles.thTime}>TIME / GAP</th>
            <th className={styles.thPts}>PTS</th>
          </tr>
        </thead>
        <tbody>
          {result.sort((a,b) => a.position - b.position).map(row => {
            const drv = drvMap[row.driver_number] ?? {}
            const col = `#${drv.team_colour ?? '555555'}`
            const isFastest = fastest && row.driver_number === fastest.driver_number
            const stintSeq  = stintsByDriver[row.driver_number] ?? []
            const dnf       = row.points === 0 && row.position > result.length * 0.7
            return (
              <tr key={row.driver_number} className={`${styles.resultRow} ${isFastest ? styles.fastestRow : ''}`}>
                <td className={styles.pos}>
                  {medal(row.position)}
                  <span className={row.position <= 3 ? styles.podium : ''}>{row.position}</span>
                </td>
                <td className={styles.driver}>
                  <span className={styles.driverBar} style={{ background: col }} />
                  <span className={styles.num} style={{ color: col }}>#{row.driver_number}</span>
                  <div>
                    <div className={styles.driverName}>{drv.full_name ?? `Driver #${row.driver_number}`}</div>
                    <div className={styles.driverAcro}>{drv.name_acronym ?? '—'}</div>
                  </div>
                </td>
                <td className={styles.team}>{drv.team_name ?? '—'}</td>
                <td className={styles.strats}>
                  {stintSeq.map((s, i) => (
                    <TyreChip key={i} compound={s.compound} />
                  ))}
                </td>
                <td className={`${styles.time} mono`}>
                  {isFastest && <span className={styles.flBadge}><Zap size={9} /> FL</span>}
                  {row.position === 1
                    ? (row.time ?? '—')
                    : row.time ? `+${row.time}` : <span className={styles.dnf}>DNF</span>
                  }
                </td>
                <td className={`${styles.pts} mono`}>
                  {row.points > 0
                    ? <span className={styles.ptsVal}>{row.points}</span>
                    : <span style={{ color:'var(--text-3)' }}>—</span>
                  }
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function parseTimeToSecs(t) {
  if (!t) return Infinity
  // "1:23.456" or "23.456"
  const parts = t.replace('+','').split(':')
  if (parts.length === 2) return parseFloat(parts[0])*60 + parseFloat(parts[1])
  return parseFloat(parts[0])
}

function RaceCard({ meeting, round, sessions, open: defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen)
  const [tab,  setTab]  = useState('race')
  const [drivers, setDrivers] = useState([])

  const raceSession   = sessions.find(s => s.session_name === 'Race')
  const qualSession   = sessions.find(s => s.session_name === 'Qualifying')
  const sprintSession = sessions.find(s => s.session_name === 'Sprint')
  const flag = meeting.country_flag || flagUrl(meeting.country_code)

  useEffect(() => {
    if (!open || drivers.length) return
    const sk = (raceSession ?? sessions[0])?.session_key
    if (!sk) return
    getDrivers(sk).then(setDrivers).catch(() => {})
  }, [open])

  const activeSession = tab === 'race' ? raceSession : tab === 'sprint' ? sprintSession : qualSession

  return (
    <div className={`${styles.card} ${defaultOpen ? styles.latest : ''}`}>
      <div className={styles.cardHd} onClick={() => setOpen(v => !v)}>
        <div className={styles.cardLeft}>
          <span className={styles.roundBadge}>R{round}</span>
          {flag && <img src={flag} alt={meeting.country_name} className={styles.flagImg} onError={e=>e.target.style.display='none'} />}
          <div>
            <div className={styles.meetingName}>{meeting.meeting_name}</div>
            <div className={styles.meetingMeta}>
              {meeting.circuit_short_name} · {format(parseISO(meeting.date_start), 'd MMM yyyy')}
              {defaultOpen && <span className={styles.latestBadge}>LATEST</span>}
            </div>
          </div>
        </div>
        <button className={styles.chevron}>{open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}</button>
      </div>

      {open && (
        <div className={styles.cardBody}>
          {/* Session tabs */}
          <div className={styles.sessionTabs}>
            {raceSession   && <button className={`${styles.sTab} ${tab==='race'?styles.sTabActive:''}`}   onClick={()=>setTab('race')}>Race</button>}
            {sprintSession && <button className={`${styles.sTab} ${tab==='sprint'?styles.sTabActive:''}`} onClick={()=>setTab('sprint')}>Sprint</button>}
            {qualSession   && <button className={`${styles.sTab} ${tab==='qual'?styles.sTabActive:''}`}   onClick={()=>setTab('qual')}>Qualifying</button>}
          </div>
          {activeSession
            ? <RaceResult raceSession={activeSession} drivers={drivers} />
            : <div className={styles.noData}>Session data not available</div>
          }
        </div>
      )}
    </div>
  )
}

export default function Results() {
  const [meetings, setMeetings] = useState([])
  const [sessionsMap, setSessionsMap] = useState({})
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    async function load() {
      try {
        const [allMeetings, allSessions] = await Promise.all([
          getMeetings(2026),
          getSessions({ year: 2026 }),
        ])
        // Filter to non-testing meetings that are complete
        const past = allMeetings
          .filter(m =>
            !m.meeting_name?.toLowerCase().includes('testing') &&
            isPast(parseISO(m.date_end ?? m.date_start))
          )
          .sort((a,b) => new Date(b.date_start) - new Date(a.date_start))

        setMeetings(past)

        // Group sessions by meeting key
        const map = {}
        for (const s of allSessions) {
          if (!map[s.meeting_key]) map[s.meeting_key] = []
          map[s.meeting_key].push(s)
        }
        setSessionsMap(map)
      } catch(e) {
        setError('Could not load race results')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div className="page">
      <div className="page-hd">
        <h1><Flag size={20} style={{ strokeWidth:2 }} /> Race Results</h1>
        <p>2026 Formula 1 Season — Full finishing orders, points and strategy</p>
      </div>

      {loading ? (
        <div className="spinner-wrap"><div className="spinner" /></div>
      ) : error ? (
        <div className={styles.errorMsg}><AlertCircle size={16} /> {error}</div>
      ) : meetings.length === 0 ? (
        <div className={styles.errorMsg}>No completed races yet for 2026.</div>
      ) : (
        <div className={styles.list}>
          {meetings.map((m, i) => (
            <RaceCard
              key={m.meeting_key}
              meeting={m}
              round={meetings.length - i}
              sessions={sessionsMap[m.meeting_key] ?? []}
              open={i === 0}
            />
          ))}
        </div>
      )}
    </div>
  )
}
