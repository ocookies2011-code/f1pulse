import { useEffect, useState, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Activity, RefreshCw, CloudRain, Thermometer, Wind, Flag, Zap, Radio, AlertTriangle } from 'lucide-react'
import { buildLiveStandings, getLatestSession, getWeather, getRaceControl, fmt as formatLapTime, fmtGap as formatGap } from '../lib/openf1'
import { useAuth } from '../hooks/useAuth'
import styles from './LiveTiming.module.css'

const TYRE_MAP = { SOFT: 'S', MEDIUM: 'M', HARD: 'H', INTERMEDIATE: 'I', WET: 'W' }

function TyreChip({ compound }) {
  const k = compound?.toUpperCase()
  const label = TYRE_MAP[k] ?? (compound?.[0] ?? '?')
  return (
    <span className={`${styles.tyreChip} ${styles[`tyre${label}`] ?? ''}`}>
      <span className={`tyre ${label}`} />
      {label}
    </span>
  )
}

function MiniSectors({ segments }) {
  // segments = [[s1segs], [s2segs], [s3segs]]
  // 2049=green, 2051=purple, 2048=yellow, 2064=pit
  const colMap = { 2049: 'g', 2051: 'p', 2048: 'y', 2064: 'pit', 0: 'off' }
  return (
    <div className={styles.miniSectors}>
      {[0,1,2].map(si => (
        <div key={si} className={styles.sectorGroup}>
          {(segments[si] || []).slice(0, 8).map((v, i) => (
            <span key={i} className={`${styles.seg} ${styles[`seg-${colMap[v] ?? 'off'}`]}`} />
          ))}
        </div>
      ))}
    </div>
  )
}

function WeatherStrip({ weather }) {
  if (!weather) return null
  return (
    <div className={styles.weather}>
      <span><Thermometer size={12} /> {weather.track_temperature}°C track</span>
      <span><Thermometer size={12} /> {weather.air_temperature}°C air</span>
      <span><Wind size={12} /> {weather.wind_speed} m/s</span>
      {weather.rainfall > 0 && <span className={styles.rain}><CloudRain size={12} /> Wet</span>}
    </div>
  )
}

function RcMessage({ msg }) {
  const cls = msg.flag === 'RED' ? styles.rcRed
    : msg.flag === 'YELLOW' || msg.flag === 'DOUBLE YELLOW' ? styles.rcYellow
    : msg.flag === 'GREEN' ? styles.rcGreen
    : msg.category === 'SafetyCar' ? styles.rcSc
    : ''
  return <div className={`${styles.rcMsg} ${cls}`}>{msg.message}</div>
}

export default function LiveTiming() {
  const { isPremium } = useAuth()
  const [standing, setStanding]     = useState([])
  const [session,  setSession]      = useState(null)
  const [weather,  setWeather]      = useState(null)
  const [rc,       setRc]           = useState([])
  const [loading,  setLoading]      = useState(true)
  const [lastUpdate, setLastUpdate] = useState(null)
  const [error,    setError]        = useState(null)
  const [showMini, setShowMini]     = useState(false)
  const [compact,  setCompact]      = useState(false)
  const intervalRef = useRef(null)

  const fetchAll = useCallback(async () => {
    try {
      const [sess, wthr, rcData, standings] = await Promise.all([
        getLatestSession(),
        getWeather('latest'),
        getRaceControl('latest'),
        buildLiveStandings('latest'),
      ])
      setSession(sess)
      setWeather(wthr)
      setRc(rcData || [])
      setStanding(standings)
      setLastUpdate(new Date())
      setError(null)
    } catch {
      setError('Could not load live data. No active session or connection issue.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAll()
    const ms = isPremium ? 4000 : 10000
    intervalRef.current = setInterval(fetchAll, ms)
    return () => clearInterval(intervalRef.current)
  }, [isPremium, fetchAll])

  const lastRc = [...rc].reverse().slice(0, 4)
  const hasRc  = lastRc.length > 0

  return (
    <div className="page">
      {/* ── Header ── */}
      <div className={styles.hd}>
        <div className={styles.hdLeft}>
          <h1 className={styles.title}>
            <Activity size={18} strokeWidth={2.5} />
            Live Timing
          </h1>
          {session && (
            <div className={styles.sessionInfo}>
              <span className={styles.sessionDot} />
              {session.session_name} · {session.meeting_name}
            </div>
          )}
        </div>
        <div className={styles.hdRight}>
          {!isPremium && (
            <Link to="/premium" className={styles.proBadge}>
              <Zap size={11} /> Get Pro — faster refresh
            </Link>
          )}
          <button
            className={`${styles.toggleBtn} ${compact ? styles.active : ''}`}
            onClick={() => setCompact(v => !v)}
            title="Compact view"
          >
            Compact
          </button>
          <button
            className={`${styles.toggleBtn} ${showMini ? styles.active : ''}`}
            onClick={() => setShowMini(v => !v)}
            title="Mini sectors (Pro)"
          >
            Mini Sectors
          </button>
          <div className={styles.updateTime}>
            <RefreshCw size={11} className={loading ? styles.spinning : ''} />
            {lastUpdate ? lastUpdate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—'}
          </div>
          <button className={`btn btn-ghost btn-sm`} onClick={fetchAll} style={{ padding: '5px 10px' }}>
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      {/* ── Weather + RC ── */}
      <div className={styles.metaRow}>
        <WeatherStrip weather={weather} />
        {hasRc && (
          <div className={styles.rcRow}>
            <Flag size={12} className={styles.rcIcon} />
            {lastRc.slice(0, 1).map((m, i) => <RcMessage key={i} msg={m} />)}
          </div>
        )}
      </div>

      {/* ── Race Control Panel ── */}
      {hasRc && (
        <details className={styles.rcPanel}>
          <summary className={styles.rcSummary}>
            <Flag size={12} /> Race Control Messages ({rc.length})
          </summary>
          <div className={styles.rcList}>
            {lastRc.map((m, i) => <RcMessage key={i} msg={m} />)}
          </div>
        </details>
      )}

      {/* ── Table ── */}
      {loading ? (
        <div className="spinner-wrap"><div className="spinner" /></div>
      ) : error ? (
        <div className={styles.empty}>
          <AlertTriangle size={28} style={{ color: 'var(--text-3)', marginBottom: 10 }} />
          <p>{error}</p>
        </div>
      ) : standing.length === 0 ? (
        <div className={styles.empty}>
          <Activity size={28} style={{ color: 'var(--text-3)', marginBottom: 10 }} />
          <p>No active session. Data will appear when a session goes live.</p>
        </div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={`${styles.table} ${compact ? styles.compact : ''}`}>
            <thead>
              <tr>
                <th className={styles.thPos}>POS</th>
                <th className={styles.thDriver}>DRIVER</th>
                <th>BEST LAP</th>
                <th>LAST LAP</th>
                <th>GAP</th>
                <th>INT</th>
                <th>TYRE</th>
                <th className={styles.thAge}>AGE</th>
                <th className={styles.thLap}>LAP</th>
                {showMini && <th className={styles.thMini}>SECTORS</th>}
              </tr>
            </thead>
            <tbody>
              {standing.map((d, i) => {
                const isLeader = i === 0
                const isPit    = d.is_pit_out_lap
                return (
                  <tr
                    key={d.driver_number}
                    className={`${styles.row} ${isLeader ? styles.rowLeader : ''} ${isPit ? styles.rowPit : ''}`}
                  >
                    {/* Position */}
                    <td className={styles.tdPos}>
                      <span className={styles.posNum}>{d.position}</span>
                    </td>

                    {/* Driver */}
                    <td className={styles.tdDriver}>
                      <span
                        className={styles.teamBar}
                        style={{ background: `#${d.team_colour}` }}
                      />
                      <div className={styles.driverInfo}>
                        <span className={styles.acronym}>{d.name_acronym}</span>
                        <span className={styles.teamName}>{d.team_name?.split(' ')[0]}</span>
                      </div>
                      <span className={styles.driverNum}>#{d.driver_number}</span>
                    </td>

                    {/* Best lap */}
                    <td className={`mono ${isLeader ? styles.timePurple : styles.timeCell}`}>
                      {formatLapTime(d.best_lap)}
                    </td>

                    {/* Last lap */}
                    <td className={`mono ${styles.timeCell}`}>
                      {formatLapTime(d.last_lap)}
                    </td>

                    {/* Gap */}
                    <td className={`mono ${styles.gapCell}`}>
                      {isLeader
                        ? <span className={styles.leaderTag}>LEAD</span>
                        : formatGap(d.gap_to_leader)
                      }
                    </td>

                    {/* Interval */}
                    <td className={`mono ${styles.intCell}`}>
                      {isLeader ? '—' : formatGap(d.interval)}
                    </td>

                    {/* Tyre */}
                    <td>
                      {d.tyre ? <TyreChip compound={d.tyre} /> : <span className={styles.dash}>—</span>}
                    </td>

                    {/* Age */}
                    <td className={`mono ${styles.ageCell}`}>
                      {d.tyre_age ?? <span className={styles.dash}>—</span>}
                    </td>

                    {/* Lap */}
                    <td className={`mono ${styles.lapCell}`}>
                      {d.lap_number ?? <span className={styles.dash}>—</span>}
                    </td>

                    {/* Mini sectors */}
                    {showMini && (
                      <td>
                        {isPremium
                          ? <MiniSectors segments={d.segments ?? [[],[],[]]} />
                          : <Link to="/premium" className={styles.lockLink}><Zap size={11} /> Pro</Link>
                        }
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Pro upsell ── */}
      {!isPremium && !loading && (
        <div className={styles.upsell}>
          <div className={styles.upsellLeft}>
            <Zap size={15} style={{ color: 'var(--gold)', flexShrink: 0 }} />
            <div>
              <strong>F1Pulse Pro</strong>
              <span className={styles.upsellSub}> — Live mini-sectors, 3s refresh, team radio & track map</span>
            </div>
          </div>
          <Link to="/premium" className="btn btn-gold btn-sm">Upgrade — £3.99/mo</Link>
        </div>
      )}
    </div>
  )
}
