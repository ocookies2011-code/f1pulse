import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Activity, Zap, Trophy, Calendar, BarChart2, ArrowRight, Clock, MapPin, ChevronRight } from 'lucide-react'
import { getMeetings, getLatestSession } from '../lib/openf1'
import { format, formatDistanceToNow, isPast, isFuture, parseISO } from 'date-fns'
import styles from './Home.module.css'

function Countdown({ target }) {
  const [diff, setDiff] = useState('')
  useEffect(() => {
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
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id)
  }, [target])
  return <span className={styles.cdVal}>{diff}</span>
}

const FEATURES = [
  { icon: Activity, title: 'Live Timing',    desc: 'Real-time positions, lap times, sector splits and gaps. Updated every few seconds during sessions.',    to: '/live',      pro: false },
  { icon: Trophy,   title: 'Standings',      desc: 'Live driver and constructor championship standings, updated after every race weekend.',                 to: '/standings', pro: false },
  { icon: BarChart2,title: 'Analytics',      desc: 'Lap charts, stint breakdowns, tyre degradation and head-to-head driver comparison tools.',             to: '/analytics', pro: true  },
  { icon: Calendar, title: 'Race Calendar',  desc: 'Full 2026 season calendar with session times, circuit info and live countdowns.',                       to: '/calendar',  pro: false },
]

export default function Home() {
  const [nextRace, setNextRace] = useState(null)
  const [session,  setSession]  = useState(null)
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    Promise.all([getMeetings(2026), getLatestSession()])
      .then(([meetings, sess]) => {
        const upcoming = meetings
          .filter(m => !m.meeting_name?.toLowerCase().includes('testing') && isFuture(parseISO(m.date_start)))
          .sort((a, b) => new Date(a.date_start) - new Date(b.date_start))
        setNextRace(upcoming[0] ?? null)
        setSession(sess)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className={styles.wrap}>
      {/* Background glow */}
      <div className={styles.bg} />

      {/* ── Hero ── */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <div className="live-badge">
            <span className="live-dot" />
            2026 Season Live
          </div>
          <h1 className={styles.h1}>
            Every Millisecond.<br />
            <span className={styles.h1Red}>Every Insight.</span>
          </h1>
          <p className={styles.heroSub}>
            Real-time Formula 1 timing, strategy analysis and telemetry.
            Built for fans who want the full picture.
          </p>
          <div className={styles.heroCta}>
            <Link to="/live" className="btn btn-primary" style={{ fontSize: '0.9rem', padding: '11px 22px' }}>
              <Activity size={15} /> Open Live Timing
            </Link>
            <Link to="/standings" className="btn btn-ghost" style={{ fontSize: '0.9rem', padding: '11px 22px' }}>
              <Trophy size={15} /> Standings
            </Link>
          </div>
        </div>

        {/* Next race card */}
        {nextRace && (
          <div className={styles.nextCard}>
            <div className={styles.nextCardLabel}>
              <Clock size={11} /> Next Race
            </div>
            {nextRace.country_flag && (
              <img src={nextRace.country_flag} alt={nextRace.country_name} className={styles.nextFlag} onError={e => e.target.style.display='none'} />
            )}
            <div className={styles.nextName}>{nextRace.meeting_name}</div>
            <div className={styles.nextMeta}>
              <span><MapPin size={11} /> {nextRace.circuit_short_name}</span>
              <span>{format(parseISO(nextRace.date_start), 'd MMM yyyy')}</span>
            </div>
            <Countdown target={nextRace.date_start} />
            <Link to="/calendar" className={styles.nextLink}>
              Full calendar <ChevronRight size={13} />
            </Link>
          </div>
        )}
      </section>

      {/* ── Live timing preview bar ── */}
      {session && (
        <div className={styles.sessionBar}>
          <div className={styles.sessionBarInner}>
            <span className={styles.sessionDot} />
            <span className={styles.sessionName}>{session.session_name}</span>
            <span className={styles.sessionMeeting}>{session.meeting_name}</span>
            <Link to="/live" className={styles.sessionCta}>
              View live timing <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      )}

      {/* ── Features ── */}
      <section className={styles.features}>
        <div className={styles.featuresInner}>
          <div className={styles.sectionHd}>
            <h2 className={styles.sectionTitle}>Everything you need trackside</h2>
            <p className={styles.sectionSub}>Professional-grade tools built for serious F1 fans</p>
          </div>
          <div className={styles.grid}>
            {FEATURES.map(({ icon: Icon, title, desc, to, pro }) => (
              <Link key={to} to={to} className={styles.card}>
                <div className={styles.cardIcon}><Icon size={19} /></div>
                <div className={styles.cardTitle}>
                  {title}
                  {pro && <span className="premium-badge" style={{ marginLeft: 6 }}><Zap size={8} /> Pro</span>}
                </div>
                <p className={styles.cardDesc}>{desc}</p>
                <div className={styles.cardArrow}><ArrowRight size={14} /></div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats strip ── */}
      <div className={styles.statsStrip}>
        <div className={styles.statsInner}>
          {[
            { val: '0.001s', label: 'Timing accuracy' },
            { val: '20+',    label: 'Metrics per driver' },
            { val: '~3s',    label: 'Live data delay (Pro)' },
            { val: '18',     label: 'API endpoints' },
          ].map(({ val, label }) => (
            <div key={label} className={styles.stat}>
              <span className={styles.statVal}>{val}</span>
              <span className={styles.statLabel}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Premium CTA ── */}
      <section className={styles.premiumSection}>
        <div className={styles.premiumCard}>
          <div className={styles.premiumLeft}>
            <div className="premium-badge" style={{ marginBottom: 16, padding: '4px 12px' }}>
              <Zap size={10} /> F1Pulse Pro
            </div>
            <h2 className={styles.premiumTitle}>Unlock the full picture</h2>
            <p className={styles.premiumSub}>Everything a serious F1 fan needs in one place.</p>
            <ul className={styles.premiumList}>
              {[
                'Live data with ~3s delay',
                'Mini-sector breakdowns',
                'Full lap charts & analytics',
                'Driver comparison tools',
                'Team radio playback',
                'Track map with car positions',
              ].map(f => (
                <li key={f}><span className={styles.checkmark}>✓</span> {f}</li>
              ))}
            </ul>
            <Link to="/premium" className="btn btn-gold" style={{ marginTop: 8 }}>
              <Zap size={14} /> Get F1Pulse Pro — £3.99/mo
            </Link>
          </div>
          <div className={styles.premiumRight}>
            <div className={styles.pricePill}>
              <span className={styles.priceAmount}>£3.99</span>
              <span className={styles.pricePer}>/month</span>
            </div>
            <p className={styles.priceNote}>Cancel anytime</p>
          </div>
        </div>
      </section>
    </div>
  )
}
