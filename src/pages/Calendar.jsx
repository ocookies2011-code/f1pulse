import { useEffect, useState } from 'react'
import { MapPin, Clock, Calendar as CalIcon } from 'lucide-react'
import { getMeetings, getSessions, flagUrl } from '../lib/openf1'
import { format, isPast, isFuture, parseISO, formatDistanceToNow, differenceInDays } from 'date-fns'
import styles from './Calendar.module.css'

function Countdown({ target }) {
  const [txt, setTxt] = useState('')
  useEffect(() => {
    function tick() {
      const d = new Date(target) - Date.now()
      if (d <= 0) { setTxt('Starting soon'); return }
      const dy = Math.floor(d/86400000), h = Math.floor((d%86400000)/3600000)
      const m = Math.floor((d%3600000)/60000), s = Math.floor((d%60000)/1000)
      setTxt(`${dy}d ${String(h).padStart(2,'0')}h ${String(m).padStart(2,'0')}m ${String(s).padStart(2,'0')}s`)
    }
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id)
  }, [target])
  return <span className={styles.countdown}>{txt}</span>
}

export default function Calendar() {
  const [meetings, setMeetings] = useState([])
  const [sessions, setSessions] = useState({}) // meeting_key → sessions[]
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    async function load() {
      try {
        const [mtgs, sess] = await Promise.all([
          getMeetings(2026),
          getSessions({ year: 2026 })
        ])
        const races = mtgs
          .filter(m => !m.meeting_name?.toLowerCase().includes('testing'))
          .sort((a,b) => new Date(a.date_start) - new Date(b.date_start))
        setMeetings(races)
        // Group sessions by meeting_key
        const map = {}
        for (const s of sess) {
          if (!map[s.meeting_key]) map[s.meeting_key] = []
          map[s.meeting_key].push(s)
        }
        setSessions(map)
      } catch(e) { console.error(e) } finally { setLoading(false) }
    }
    load()
  }, [])

  const now = new Date()
  const nextMeeting = meetings.find(m => isFuture(parseISO(m.date_start)))
  // Current meeting = sessions happening now (started but not fully ended)
  const currentMeeting = meetings.find(m => {
    const s = parseISO(m.date_start), e = m.date_end ? parseISO(m.date_end) : s
    return s <= now && now <= new Date(e.getTime() + 3*24*60*60*1000)
  })
  const heroMeeting = currentMeeting || nextMeeting

  function sessionStatus(s) {
    const start = parseISO(s.date_start)
    const end = s.date_end ? parseISO(s.date_end) : new Date(start.getTime() + 2*60*60*1000)
    if (now >= start && now <= end) return 'live'
    if (now > end) return 'done'
    return 'upcoming'
  }

  return (
    <div className="page-wrap">
      <div className="page-header">
        <div><h1 className="page-title"><CalIcon size={20}/> 2026 Race Calendar</h1>
        <p className="page-sub">Formula 1 World Championship — {meetings.length} rounds</p></div>
      </div>

      {loading ? <div className="center-spin"><div className="spinner"/></div> : (
        <>
          {/* Hero next/current race */}
          {heroMeeting && (
            <div className={styles.hero}>
              <div className={styles.heroLeft}>
                <div className={styles.heroLabel}>{currentMeeting ? '🔴 RACE WEEKEND LIVE' : 'NEXT RACE'}</div>
                <div className={styles.heroName}>{heroMeeting.meeting_name}</div>
                <div className={styles.heroMeta}>
                  <span><MapPin size={12}/> {heroMeeting.circuit_short_name}, {heroMeeting.country_name}</span>
                  <span><Clock size={12}/> {format(parseISO(heroMeeting.date_start), 'd MMM yyyy')}</span>
                </div>
              </div>
              <div className={styles.heroRight}>
                {heroMeeting.country_code && (
                  <img src={flagUrl(heroMeeting.country_code, '64x48')} alt={heroMeeting.country_name}
                    className={styles.heroFlag} onError={e=>e.target.style.display='none'}/>
                )}
                {nextMeeting && !currentMeeting && <Countdown target={heroMeeting.date_start}/>}
              </div>
            </div>
          )}

          {/* Race grid */}
          <div className={styles.grid}>
            {meetings.map((m, i) => {
              const started = parseISO(m.date_start) <= now
              const endDate = m.date_end ? parseISO(m.date_end) : parseISO(m.date_start)
              const fullyDone = endDate < now && differenceInDays(now, endDate) > 0
              const isNext = m === nextMeeting
              const isCurrent = m === currentMeeting
              const meetSessions = (sessions[m.meeting_key] || []).sort((a,b) => new Date(a.date_start) - new Date(b.date_start))
              const flag = flagUrl(m.country_code)

              return (
                <div key={m.meeting_key}
                  className={`${styles.card} ${fullyDone?styles.done:''} ${isNext?styles.next:''} ${isCurrent?styles.current:''}`}
                  onClick={() => setExpanded(expanded === m.meeting_key ? null : m.meeting_key)}
                >
                  <div className={styles.cardTop}>
                    <span className={styles.round}>R{i+1}</span>
                    {fullyDone && <span className={styles.badge}>COMPLETE</span>}
                    {isNext && <span className={`${styles.badge} ${styles.badgeNext}`}>NEXT</span>}
                    {isCurrent && <span className={`${styles.badge} ${styles.badgeLive}`}><span className="live-dot"/>LIVE</span>}
                  </div>
                  {flag && <img src={flag} alt={m.country_name} className={styles.flag} onError={e=>e.target.style.display='none'}/>}
                  <div className={styles.cardName}>{m.meeting_name}</div>
                  <div className={styles.cardCircuit}><MapPin size={10}/> {m.circuit_short_name}</div>
                  <div className={styles.cardDate}>
                    {format(parseISO(m.date_start), 'd MMM')}
                    {m.date_end && m.date_end !== m.date_start ? ` – ${format(parseISO(m.date_end),'d MMM')}` : ''}
                  </div>
                  {!fullyDone && !isCurrent && (
                    <div className={styles.cardIn}>
                      {isNext ? <Countdown target={m.date_start}/> : formatDistanceToNow(parseISO(m.date_start),{addSuffix:true})}
                    </div>
                  )}

                  {/* Session breakdown when expanded */}
                  {expanded === m.meeting_key && meetSessions.length > 0 && (
                    <div className={styles.sessions} onClick={e=>e.stopPropagation()}>
                      {meetSessions.map(s => {
                        const st = sessionStatus(s)
                        return (
                          <div key={s.session_key} className={`${styles.sess} ${st==='live'?styles.sessLive:st==='done'?styles.sessDone:''}`}>
                            <span className={styles.sessName}>{s.session_name}</span>
                            <span className={styles.sessDate}>{format(parseISO(s.date_start),'d MMM HH:mm')}</span>
                            {st==='live' && <span className={styles.sessLiveDot}><span className="live-dot"/>LIVE</span>}
                            {st==='done' && <span className={styles.sessDoneLabel}>Done</span>}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
