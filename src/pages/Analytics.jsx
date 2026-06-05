import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BarChart2, Zap, Lock } from 'lucide-react'
import { getSessions, getLaps, fmt as formatLapTime } from '../lib/openf1'
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts'
import { useAuth } from '../hooks/useAuth'
import styles from './Analytics.module.css'

const COLOURS = ['#e10600','#27F4D2','#FF8000','#3671C6','#229971','#E8002D','#6692FF','#FF87BC','#52E252','#B6BABD','#64C4FF']

const DRIVERS_2026 = [
  { driver_number: 63, acronym: 'RUS', name: 'Russell', colour: '27F4D2' },
  { driver_number: 16, acronym: 'LEC', name: 'Leclerc', colour: 'E8002D' },
  { driver_number: 4, acronym: 'NOR', name: 'Norris', colour: 'FF8000' },
  { driver_number: 44, acronym: 'HAM', name: 'Hamilton', colour: 'E8002D' },
  { driver_number: 1, acronym: 'VER', name: 'Verstappen', colour: '3671C6' },
]

function PremiumGate({ children }) {
  const { isPremium } = useAuth()
  if (isPremium) return children
  return (
    <div className={styles.gate}>
      <Lock size={28} />
      <h3>Pro Feature</h3>
      <p>Advanced analytics are available with F1Pulse Pro.</p>
      <Link to="/premium" className="btn btn-gold" style={{ marginTop: 8 }}><Zap size={14} /> Upgrade to Pro — £3.99/mo</Link>
    </div>
  )
}

function LapChart({ sessionKey }) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!sessionKey) return
    Promise.all(
      DRIVERS_2026.map(d => getLaps(sessionKey, d.driver_number).then(laps => ({ driver: d, laps })).catch(() => ({ driver: d, laps: [] })))
    ).then(results => {
      // Build lap-by-lap table
      const maxLap = Math.max(...results.flatMap(r => r.laps.map(l => l.lap_number ?? 0)))
      const rows = []
      for (let lap = 1; lap <= maxLap; lap++) {
        const row = { lap }
        for (const { driver, laps } of results) {
          const l = laps.find(x => x.lap_number === lap)
          row[driver.acronym] = l?.lap_duration ?? null
        }
        rows.push(row)
      }
      setData(rows)
    }).finally(() => setLoading(false))
  }, [sessionKey])

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div className="spinner" /></div>
  if (!data.length) return <div className={styles.empty}>No lap data available.</div>

  const minTime = Math.min(...data.flatMap(r => DRIVERS_2026.map(d => r[d.acronym]).filter(Boolean)))

  return (
    <ResponsiveContainer width="100%" height={340}>
      <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="rgba(255,255,255,0.05)" />
        <XAxis dataKey="lap" stroke="var(--text-3)" tick={{ fontSize: 11 }} label={{ value: 'Lap', position: 'insideBottom', offset: -2, fill: 'var(--text-3)', fontSize: 11 }} />
        <YAxis
          stroke="var(--text-3)"
          tick={{ fontSize: 11, fontFamily: 'var(--font-mono)' }}
          tickFormatter={v => formatLapTime(v)}
          domain={[minTime - 1, 'auto']}
          width={75}
        />
        <Tooltip
          contentStyle={{ background: 'var(--bg-1)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: 'var(--text-2)', marginBottom: 6 }}
          formatter={(v, name) => [formatLapTime(v), name]}
          labelFormatter={l => `Lap ${l}`}
        />
        <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
        {DRIVERS_2026.map((d, i) => (
          <Line
            key={d.acronym}
            type="monotone"
            dataKey={d.acronym}
            stroke={`#${d.colour}`}
            dot={false}
            strokeWidth={2}
            connectNulls={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}

export default function Analytics() {
  const { isPremium } = useAuth()
  const [sessions, setSessions] = useState([])
  const [selectedSession, setSelectedSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getSessions({ year: 2026 }).then(data => {
      const sorted = [...data].sort((a, b) => new Date(b.date_start) - new Date(a.date_start))
      setSessions(sorted)
      setSelectedSession(sorted[0]?.session_key ?? null)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  return (
    <div className="page-wrap">
      <h1 className="page-title"><BarChart2 size={22} /> Analytics</h1>
      <p className="page-sub">Lap charts, stint analysis and driver comparisons</p>

      {/* Session selector */}
      {!loading && sessions.length > 0 && (
        <div className={styles.sessionRow}>
          <label className={styles.sessionLabel}>Session</label>
          <select
            className={styles.sessionSelect}
            value={selectedSession ?? ''}
            onChange={e => setSelectedSession(e.target.value)}
          >
            {sessions.map(s => (
              <option key={s.session_key} value={s.session_key}>
                {s.meeting_name} — {s.session_name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>
          Lap Time Chart
          {!isPremium && <span className="premium-badge"><Zap size={9} /> Pro</span>}
        </h2>
        <PremiumGate>
          {selectedSession ? (
            <LapChart sessionKey={selectedSession} />
          ) : (
            <div className={styles.empty}>Select a session to view the lap chart.</div>
          )}
        </PremiumGate>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>
          Driver Comparison
          {!isPremium && <span className="premium-badge"><Zap size={9} /> Pro</span>}
        </h2>
        <PremiumGate>
          <div className={styles.empty}>Select two drivers to compare their lap-by-lap pace — coming soon.</div>
        </PremiumGate>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>
          Tyre Stint Analysis
          {!isPremium && <span className="premium-badge"><Zap size={9} /> Pro</span>}
        </h2>
        <PremiumGate>
          <div className={styles.empty}>Stint degradation visualisation — coming soon.</div>
        </PremiumGate>
      </div>
    </div>
  )
}
