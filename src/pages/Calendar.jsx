import { useEffect, useState } from 'react'
import { Calendar as CalIcon, MapPin, Clock, ChevronDown, ChevronUp } from 'lucide-react'
import { getMeetings, getSessions, flagUrl } from '../lib/openf1'
import { format, isPast, isFuture, parseISO, formatDistanceToNow } from 'date-fns'
import styles from './Calendar.module.css'

function useLiveCountdown(target) {
  const [diff, setDiff] = useState(null)
  useEffect(() => {
    if (!target) return
    function tick() {
      const d = new Date(target) - new Date()
      if (d <= 0) { setDiff('LIVE NOW'); return }
      const days = Math.floor(d / 86400000)
      const hrs  = Math.floor((d % 86400000) / 3600000)
      const mins = Math.floor((d % 3600000) / 60000)
      const secs = Math.floor((d % 60000) / 1000)
      if (days > 0) setDiff(`${days}d ${String(hrs).padStart(2,'0')}h ${String(mins).padStart(2,'0')}m ${String(secs).padStart(2,'0')}s`)
      else setDiff(`${String(hrs).padStart(2,'0')}:${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [target])
  return diff
}

const SESSION_ORDER = ['Practice 1','Practice 2','Practice 3','Sprint Qualifying','Sprint','Qualifying','Race']

function getNextSession(sessions) {
  const now = new Date()
  return sessions
    .filter(s => new Date(s.date_start) > now)
    .sort((a,b) => new Date(a.date_start) - new Date(b.date_start))[0]
}

function MeetingCard({ meeting, round, isNext, sessions }) {
  const [open, setOpen] = useState(isNext)
  const done = isPast(parseISO(meeting.date_end ?? meeting.date_start))
  const flag = meeting.country_flag || flagUrl(meeting.country_code)
  const nextSess = getNextSession(sessions)
  const raceSession = sessions.find(s => s.session_name === 'Race')
  const raceCd = useLiveCountdown(raceSession?.date_start)

  return (
    <div className={`${styles.meetingCard} ${done ? styles.done : ''} ${isNext ? styles.isNext : ''}`}>
      {/* Card header */}
      <div className={styles.cardHd} onClick={() => setOpen(v => !v)}>
        <div className={styles.cardHdLeft}>
          <span className={styles.roundBadge}>R{round}</span>
          {flag && <img src={flag} alt={meeting.country_name} className={styles.flagImg} onError={e=>e.target.style.display='none'} />}
          <div>
            <div className={styles.meetingName}>{meeting.meeting_name}</div>
            <div className={styles.meetingMeta}>
              <MapPin size={10} /> {meeting.circuit_short_name} &nbsp;·&nbsp; {format(parseISO(meeting.date_start), 'd MMM yyyy')}
            </div>
          </div>
        </div>
        <div className={styles.cardHdRight}>
          {done && <span className={styles.donePill}>COMPLETE</span>}
          {isNext && <span className={styles.nextPill}>NEXT</span>}
          {!done && !isNext && raceSession && (
            <span className={styles.futureMeta}>{formatDistanceToNow(parseISO(raceSession.date_start), { addSuffix: true })}</span>
          )}
          <button className={styles.chevron}>{open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}</button>
        </div>
      </div>

      {/* Expandable schedule */}
      {open && (
        <div className={styles.schedule}>
          {isNext && nextSess && (
            <div className={styles.nextSessionBanner}>
              <Clock size={12} />
              <span>Next: <strong>{nextSess.session_name}</strong></span>
              <NextSessionCd target={nextSess.date_start} />
            </div>
          )}
          {SESSION_ORDER.map(sName => {
            const s = sessions.find(x => x.session_name === sName)
            if (!s) return null
            const sessDate = parseISO(s.date_start)
            const sessDone = isPast(sessDate)
            const isLive   = !sessDone && new Date() > new Date(s.date_start) - 60000
            return (
              <div key={sName} className={`${styles.sessRow} ${sessDone ? styles.sessDone : ''}`}>
                <span className={styles.sessName}>{sName}</span>
                <span className={styles.sessDate}>{format(sessDate, 'dd/MM, HH:mm')}</span>
                {sessDone
                  ? <span className={styles.sessDoneBadge}>✓</span>
                  : <span className={styles.sessFuture}>{format(sessDate, 'd MMM')}</span>
                }
              </div>
            )
          })}
          {isNext && raceSession && !isPast(parseISO(raceSession.date_start)) && (
            <div className={styles.raceCountdown}>
              <span>Race in</span>
              <span className={styles.raceCountdownVal}>{raceCd}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function NextSessionCd({ target }) {
  const cd = useLiveCountdown(target)
  return <span className={styles.nextSessCd}>{cd}</span>
}

export default function Calendar() {
  const [meetings, setMeetings] = useState([])
  const [sessMap,  setSessMap]  = useState({})
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    getMeetings(2026).then(async data => {
      const races = data
        .filter(m => !m.meeting_name?.toLowerCase().includes('testing'))
        .sort((a,b) => new Date(a.date_start) - new Date(b.date_start))
      setMeetings(races)

      // Load sessions for all meetings
      const map = {}
      for (const m of races) {
        try {
          const sess = await getSessions({ meeting_key: m.meeting_key })
          map[m.meeting_key] = sess.sort((a,b) => new Date(a.date_start) - new Date(b.date_start))
        } catch { map[m.meeting_key] = [] }
      }
      setSessMap(map)
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  // A meeting is "past" only when its end date has passed (not just start date)
  // This ensures Monaco shows as current even after FP1/FP2 have run
  const past   = meetings.filter(m => isPast(parseISO(m.date_end ?? m.date_start)))
  const future = meetings.filter(m => !isPast(parseISO(m.date_end ?? m.date_start)))
  // "Next" = the future meeting whose race session is soonest
  // Sort by date_start to find the current/next meeting
  const nextRace = future.sort((a,b) => new Date(a.date_start) - new Date(b.date_start))[0]

  const completedCount = past.length
  const remainingCount = future.length

  return (
    <div className="page">
      <div className="page-hd">
        <h1><CalIcon size={20} /> 2026 Race Calendar</h1>
        <p>{completedCount} races complete · {remainingCount} remaining</p>
      </div>

      {loading ? (
        <div className="spinner-wrap"><div className="spinner" /></div>
      ) : (
        <div className={styles.layout}>
          {/* Upcoming */}
          {future.length > 0 && (
            <section className={styles.section}>
              <div className={styles.sectionLabel}>Upcoming Races</div>
              {future.map((m, i) => (
                <MeetingCard
                  key={m.meeting_key}
                  meeting={m}
                  round={meetings.indexOf(m) + 1}
                  isNext={m === nextRace}
                  sessions={sessMap[m.meeting_key] ?? []}
                />
              ))}
            </section>
          )}

          {/* Past */}
          {past.length > 0 && (
            <section className={styles.section}>
              <div className={styles.sectionLabel}>Completed</div>
              {[...past].reverse().map((m) => (
                <MeetingCard
                  key={m.meeting_key}
                  meeting={m}
                  round={meetings.indexOf(m) + 1}
                  isNext={false}
                  sessions={sessMap[m.meeting_key] ?? []}
                />
              ))}
            </section>
          )}
        </div>
      )}
    </div>
  )
}
