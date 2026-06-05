import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Activity, Zap, Trophy, Calendar, BarChart2, ArrowRight, Clock, MapPin } from 'lucide-react'
import { getMeetings, getLatestSession } from '../lib/openf1'
import { format, formatDistanceToNow, isPast, parseISO } from 'date-fns'
import styles from './Home.module.css'

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
  return <span className={styles.countdownVal}>{diff}</span>
}

export default function Home() {
  const [nextRace, setNextRace] = useState(null)
  const [session, setSession] = useState(null)

  useEffect(() => {
    getMeetings().then(meetings => {
      const upcoming = meetings
        .filter(m => !isPast(parseISO(m.date_start)))
        .sort((a, b) => new Date(a.date_start) - new Date(b.date_start))
      setNextRace(upcoming[0] ?? null)
    }).catch(() => {})

    getLatestSession().then(setSession).catch(() => {})
  }, [])

  return (
    <div className={styles.wrap}>
      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroBg} />
        <div className={styles.heroContent}>
          <div className={styles.livePill}>
            <span className={styles.liveDot} />
            2026 Season Active
          </div>
          <h1 className={styles.heroTitle}>
            Every Millisecond.<br />
            <span className={styles.heroAccent}>Live.</span>
          </h1>
          <p className={styles.heroSub}>
            Real-time Formula 1 timing, strategy analysis and telemetry.<br />
            Built for fans who need the full picture.
          </p>
          <div className={styles.heroCta}>
            <Link to="/live" className="btn btn-primary" style={{ fontSize: '1rem', padding: '12px 28px' }}>
              <Activity size={16} /> Open Live Timing
            </Link>
            <Link to="/analytics" className="btn btn-ghost" style={{ fontSize: '1rem', padding: '12px 28px' }}>
              <BarChart2 size={16} /> Analytics
            </Link>
          </div>
        </div>

        {/* Next race card */}
        {nextRace && (
          <div className={styles.nextRace}>
            <div className={styles.nextRaceLabel}><Clock size={12} /> Next Race</div>
            <div className={styles.nextRaceName}>{nextRace.meeting_name}</div>
            <div className={styles.nextRaceCircuit}><MapPin size={12} /> {nextRace.circuit_short_name}, {nextRace.country_name}</div>
            <div className={styles.nextRaceDate}>{format(parseISO(nextRace.date_start), 'd MMM yyyy')}</div>
            <Countdown target={nextRace.date_start} />
          </div>
        )}
      </section>

      {/* Features grid */}
      <section className={styles.features}>
        <h2 className={styles.sectionTitle}>Everything you need trackside</h2>
        <div className={styles.grid}>
          {[
            { icon: Activity, title: 'Live Timing', desc: 'Real-time positions, lap times, sector splits and gaps updated every second during sessions.', to: '/live', badge: null },
            { icon: Trophy, title: 'Standings', desc: 'Live driver and constructor championship standings updated after every race.', to: '/standings', badge: null },
            { icon: BarChart2, title: 'Analytics', desc: 'Lap charts, stint analysis, tyre degradation and driver comparison tools.', to: '/analytics', badge: '⚡ Pro' },
            { icon: Calendar, title: 'Race Calendar', desc: 'Full 2026 season calendar with session times, countdowns and circuit info.', to: '/calendar', badge: null },
          ].map(({ icon: Icon, title, desc, to, badge }) => (
            <Link key={to} to={to} className={styles.featureCard}>
              <div className={styles.featureIcon}><Icon size={22} /></div>
              <div className={styles.featureTitle}>
                {title}
                {badge && <span className="premium-badge"><Zap size={9} />{badge}</span>}
              </div>
              <p className={styles.featureDesc}>{desc}</p>
              <div className={styles.featureArrow}><ArrowRight size={16} /></div>
            </Link>
          ))}
        </div>
      </section>

      {/* Premium CTA */}
      <section className={styles.premiumSection}>
        <div className={styles.premiumCard}>
          <div className={styles.premiumBadge}><Zap size={14} /> F1Pulse Pro</div>
          <h2 className={styles.premiumTitle}>Unlock the full picture</h2>
          <p className={styles.premiumSub}>Real-time data, advanced analytics, telemetry and more for serious fans.</p>
          <ul className={styles.premiumFeatures}>
            {['Live data with &lt;3s delay', 'Mini-sector breakdowns', 'Lap charts & stint analysis', 'Driver comparison tools', 'Team radio access', 'Track map with live positions'].map(f => (
              <li key={f} dangerouslySetInnerHTML={{ __html: `✓ ${f}` }} />
            ))}
          </ul>
          <div className={styles.premiumPrice}>
            <span className={styles.premiumAmount}>£3.99</span>
            <span className={styles.premiumPer}>/month</span>
          </div>
          <Link to="/premium" className="btn btn-gold" style={{ fontSize: '1rem', padding: '13px 32px' }}>
            <Zap size={16} /> Get F1Pulse Pro
          </Link>
        </div>
      </section>
    </div>
  )
}
