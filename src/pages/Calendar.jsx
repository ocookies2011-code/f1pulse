import { useEffect, useState } from 'react'
import { Calendar as CalIcon, MapPin, Clock, ChevronRight } from 'lucide-react'
import { getMeetings } from '../lib/openf1'
import { format, isPast, isFuture, parseISO, formatDistanceToNow } from 'date-fns'
import styles from './Calendar.module.css'

export default function Calendar() {
  const [meetings, setMeetings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getMeetings(2026).then(data => {
      setMeetings(data.sort((a, b) => new Date(a.date_start) - new Date(b.date_start)))
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const past = meetings.filter(m => isPast(parseISO(m.date_end ?? m.date_start)))
  const upcoming = meetings.filter(m => isFuture(parseISO(m.date_start)))
  const next = upcoming[0]

  return (
    <div className="page-wrap">
      <h1 className="page-title"><CalIcon size={22} /> 2026 Race Calendar</h1>
      <p className="page-sub">Full Formula 1 season schedule</p>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>
      ) : (
        <>
          {next && (
            <div className={styles.nextCard}>
              <div className={styles.nextLabel}>Next Race</div>
              <div className={styles.nextTitle}>{next.meeting_name}</div>
              <div className={styles.nextMeta}>
                <span><MapPin size={13} /> {next.circuit_short_name}, {next.country_name}</span>
                <span><Clock size={13} /> {format(parseISO(next.date_start), 'd MMM yyyy')}</span>
                <span className={styles.nextIn}>In {formatDistanceToNow(parseISO(next.date_start))}</span>
              </div>
            </div>
          )}

          <div className={styles.grid}>
            {meetings.map((m, i) => {
              const done = isPast(parseISO(m.date_end ?? m.date_start))
              const isNext = m === next
              return (
                <div key={m.meeting_key} className={`${styles.card} ${done ? styles.done : ''} ${isNext ? styles.isNext : ''}`}>
                  <div className={styles.round}>R{i + 1}</div>
                  <div className={styles.flag}>{m.country_code ? `https://flagcdn.com/24x18/${m.country_code.toLowerCase()}.png` : ''}</div>
                  <div className={styles.name}>{m.meeting_name}</div>
                  <div className={styles.circuit}><MapPin size={11} /> {m.circuit_short_name}</div>
                  <div className={styles.date}>{format(parseISO(m.date_start), 'd MMM')}</div>
                  {done && <div className={styles.doneBadge}>Complete</div>}
                  {isNext && <div className={styles.nextBadge}>Next</div>}
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
