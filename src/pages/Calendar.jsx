import { useEffect, useState } from 'react'
import { Calendar as CalIcon, MapPin, Clock } from 'lucide-react'
import { getMeetings } from '../lib/openf1'
import { format, isPast, isFuture, parseISO, formatDistanceToNow } from 'date-fns'
import styles from './Calendar.module.css'

// Map OpenF1 country_code (3-letter) → flagcdn 2-letter ISO
const FLAG_MAP = {
  BRN: 'bh', AUS: 'au', CHN: 'cn', JPN: 'jp', SAU: 'sa',
  USA: 'us', ITA: 'it', MCO: 'mc', CAN: 'ca', AUT: 'at',
  GBR: 'gb', BEL: 'be', HUN: 'hu', NED: 'nl', SGP: 'sg',
  MEX: 'mx', BRA: 'br', LVG: 'us', QAT: 'qa', UAE: 'ae',
  AZE: 'az', ESP: 'es', BAH: 'bh',
}

function getFlagUrl(meeting) {
  // Prefer the direct country_flag URL from the API
  if (meeting.country_flag) return meeting.country_flag
  // Fallback to flagcdn using mapped code
  const code = meeting.country_code ? FLAG_MAP[meeting.country_code.toUpperCase()] : null
  if (code) return `https://flagcdn.com/32x24/${code}.png`
  return null
}

function Countdown({ target }) {
  const [diff, setDiff] = useState('')
  useEffect(() => {
    function tick() {
      const d = new Date(target) - new Date()
      if (d <= 0) { setDiff('LIVE NOW'); return }
      const days = Math.floor(d / 86400000)
      const hrs = Math.floor((d % 86400000) / 3600000)
      const mins = Math.floor((d % 3600000) / 60000)
      const secs = Math.floor((d % 60000) / 1000)
      setDiff(`${days}d ${String(hrs).padStart(2,'0')}h ${String(mins).padStart(2,'0')}m ${String(secs).padStart(2,'0')}s`)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [target])
  return <span className={styles.countdown}>{diff}</span>
}

export default function Calendar() {
  const [meetings, setMeetings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getMeetings(2026).then(data => {
      // Filter out pre-season testing, sort by date
      const races = data
        .filter(m => !m.meeting_name?.toLowerCase().includes('testing'))
        .sort((a, b) => new Date(a.date_start) - new Date(b.date_start))
      setMeetings(races)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const upcoming = meetings.filter(m => isFuture(parseISO(m.date_start)))
  const next = upcoming[0]

  return (
    <div className="page-wrap">
      <h1 className="page-title"><CalIcon size={22} /> 2026 Race Calendar</h1>
      <p className="page-sub">Formula 1 World Championship — {meetings.length} rounds</p>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>
      ) : (
        <>
          {/* Next race hero */}
          {next && (
            <div className={styles.nextCard}>
              <div className={styles.nextCardInner}>
                <div>
                  <div className={styles.nextLabel}>Next Race</div>
                  <div className={styles.nextTitle}>{next.meeting_name}</div>
                  <div className={styles.nextMeta}>
                    <span><MapPin size={13} /> {next.circuit_short_name}, {next.country_name}</span>
                    <span><Clock size={13} /> {format(parseISO(next.date_start), 'd MMM yyyy')}</span>
                  </div>
                </div>
                <div className={styles.nextRight}>
                  {getFlagUrl(next) && (
                    <img
                      src={getFlagUrl(next)}
                      alt={next.country_name}
                      className={styles.nextFlag}
                    />
                  )}
                  <Countdown target={next.date_start} />
                </div>
              </div>
            </div>
          )}

          {/* Race grid */}
          <div className={styles.grid}>
            {meetings.map((m, i) => {
              const done = isPast(parseISO(m.date_end ?? m.date_start))
              const isNext = m === next
              const flagUrl = getFlagUrl(m)
              return (
                <div
                  key={m.meeting_key}
                  className={`${styles.card} ${done ? styles.done : ''} ${isNext ? styles.isNext : ''}`}
                >
                  <div className={styles.cardTop}>
                    <span className={styles.round}>R{i + 1}</span>
                    {done && <span className={styles.doneBadge}>COMPLETE</span>}
                    {isNext && <span className={styles.nextBadge}>NEXT</span>}
                  </div>

                  {flagUrl && (
                    <img
                      src={flagUrl}
                      alt={m.country_name}
                      className={styles.flag}
                      onError={e => { e.target.style.display = 'none' }}
                    />
                  )}

                  <div className={styles.name}>{m.meeting_name}</div>
                  <div className={styles.circuit}>
                    <MapPin size={10} /> {m.circuit_short_name}
                  </div>
                  <div className={styles.date}>
                    {format(parseISO(m.date_start), 'd MMM')}
                    {m.date_end && m.date_end !== m.date_start
                      ? ` – ${format(parseISO(m.date_end), 'd MMM')}`
                      : ''}
                  </div>
                  {!done && !isNext && (
                    <div className={styles.future}>
                      {formatDistanceToNow(parseISO(m.date_start), { addSuffix: true })}
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
