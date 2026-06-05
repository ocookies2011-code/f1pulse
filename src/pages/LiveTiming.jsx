import { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Activity, RefreshCw, CloudRain, Thermometer, Wind, Flag, Zap, Radio } from 'lucide-react'
import { buildLiveStandings, getLatestSession, getWeather, getRaceControl, formatLapTime, formatGap } from '../lib/openf1'
import { useAuth } from '../hooks/useAuth'
import styles from './LiveTiming.module.css'

const TYRE_LABELS = { SOFT: 'S', MEDIUM: 'M', HARD: 'H', INTERMEDIATE: 'I', WET: 'W' }
const TYRE_CLASS = { SOFT: 'S', MEDIUM: 'M', HARD: 'H', INTERMEDIATE: 'I', WET: 'W' }

function TyreDot({ compound }) {
  const key = compound?.toUpperCase()
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <span className={`tyre ${TYRE_CLASS[key] ?? ''}`} />
      <span style={{ fontSize: '0.75rem', color: 'var(--text-2)' }}>{TYRE_LABELS[key] ?? compound ?? '?'}</span>
    </span>
  )
}

function SessionBadge({ session }) {
  if (!session) return null
  return (
    <div className={styles.sessionBadge}>
      <span className={styles.sessionDot} />
      {session.session_name} — {session.meeting_name}
    </div>
  )
}

function WeatherBar({ weather }) {
  if (!weather) return null
  return (
    <div className={styles.weather}>
      <span><Thermometer size={13} /> Track {weather.track_temperature}°C</span>
      <span><Thermometer size={13} /> Air {weather.air_temperature}°C</span>
      <span><Wind size={13} /> {weather.wind_speed} m/s</span>
      {weather.rainfall > 0 && <span className={styles.rain}><CloudRain size={13} /> Rain</span>}
    </div>
  )
}

function RaceControlMessages({ messages }) {
  if (!messages?.length) return null
  const last5 = [...messages].reverse().slice(0, 5)
  return (
    <div className={styles.rcPanel}>
      <div className={styles.rcTitle}><Flag size={13} /> Race Control</div>
      {last5.map((m, i) => (
        <div key={i} className={`${styles.rcMsg} ${m.flag === 'RED' ? styles.rcRed : m.flag === 'YELLOW' ? styles.rcYellow : m.flag === 'GREEN' ? styles.rcGreen : ''}`}>
          {m.message}
        </div>
      ))}
    </div>
  )
}

export default function LiveTiming() {
  const { isPremium } = useAuth()
  const [standing, setStanding] = useState([])
  const [session, setSession] = useState(null)
  const [weather, setWeather] = useState(null)
  const [raceControl, setRaceControl] = useState([])
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState(null)
  const [error, setError] = useState(null)
  const intervalRef = useRef(null)

  async function fetchAll() {
    try {
      const [sess, wthr, rc, standings] = await Promise.all([
        getLatestSession(),
        getWeather('latest'),
        getRaceControl('latest'),
        buildLiveStandings('latest'),
      ])
      setSession(sess)
      setWeather(wthr)
      setRaceControl(rc)
      setStanding(standings)
      setLastUpdate(new Date())
      setError(null)
    } catch (e) {
      setError('Could not load live data. Session may be offline.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAll()
    // Refresh every 4s for premium, 10s for free
    const delay = isPremium ? 4000 : 10000
    intervalRef.current = setInterval(fetchAll, delay)
    return () => clearInterval(intervalRef.current)
  }, [isPremium])

  return (
    <div className="page-wrap">
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className="page-title"><Activity size={24} /> Live Timing</h1>
          <SessionBadge session={session} />
        </div>
        <div className={styles.headerRight}>
          {!isPremium && (
            <Link to="/premium" className={styles.premiumNudge}>
              <Zap size={12} /> Pro: &lt;3s refresh
            </Link>
          )}
          <div className={styles.refreshInfo}>
            <RefreshCw size={12} />
            {lastUpdate ? `Updated ${lastUpdate.toLocaleTimeString()}` : 'Updating...'}
          </div>
          <button className="btn btn-ghost" style={{ padding: '7px 12px' }} onClick={fetchAll}>
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      <WeatherBar weather={weather} />
      <div className="glow-line" />

      {/* Race control */}
      <RaceControlMessages messages={raceControl} />

      {/* Table */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>
      ) : error ? (
        <div className={styles.error}>{error}</div>
      ) : standing.length === 0 ? (
        <div className={styles.empty}>No active session. Check back when a session is live.</div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>POS</th>
                <th>DRIVER</th>
                <th>TEAM</th>
                <th className="mono">BEST LAP</th>
                <th className="mono">LAST LAP</th>
                <th className="mono">GAP</th>
                <th className="mono">INT</th>
                <th>TYRE</th>
                <th>AGE</th>
                <th>LAP</th>
              </tr>
            </thead>
            <tbody>
              {standing.map((d, i) => (
                <tr key={d.driver_number} className={`${styles.row} ${i === 0 ? styles.leader : ''} ${d.is_pit_out_lap ? styles.pitOut : ''}`}>
                  <td className={styles.pos}>
                    <span className={styles.posNum}>{d.position}</span>
                  </td>
                  <td className={styles.driver}>
                    <span
                      className={styles.driverLine}
                      style={{ borderLeftColor: `#${d.team_colour}` }}
                    />
                    <span className={styles.driverAcronym}>{d.name_acronym}</span>
                    <span className={styles.driverNum}>#{d.driver_number}</span>
                  </td>
                  <td className={styles.team}>{d.team_name?.split(' ').slice(0, 1).join(' ')}</td>
                  <td className={`mono ${styles.lapTime} ${i === 0 ? styles.purple : ''}`}>
                    {formatLapTime(d.best_lap)}
                  </td>
                  <td className={`mono ${styles.lapTime}`}>{formatLapTime(d.last_lap)}</td>
                  <td className="mono">{i === 0 ? <span className={styles.leader}>LEADER</span> : formatGap(d.gap_to_leader)}</td>
                  <td className="mono">{i === 0 ? '—' : formatGap(d.interval)}</td>
                  <td><TyreDot compound={d.tyre} /></td>
                  <td className="mono" style={{ color: 'var(--text-2)' }}>{d.tyre_age ?? '—'}</td>
                  <td className="mono" style={{ color: 'var(--text-2)' }}>{d.lap_number ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Premium upsell if not premium */}
      {!isPremium && (
        <div className={styles.upsell}>
          <Zap size={16} />
          <div>
            <strong>F1Pulse Pro</strong> — Get live mini-sectors, team radio, track map & data refreshed every 3 seconds.
          </div>
          <Link to="/premium" className="btn btn-gold" style={{ padding: '8px 18px', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
            Upgrade — £3.99/mo
          </Link>
        </div>
      )}
    </div>
  )
}
