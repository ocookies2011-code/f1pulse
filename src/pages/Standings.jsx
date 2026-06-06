import { useEffect, useState } from 'react'
import { Trophy, Info } from 'lucide-react'
import { getBestStandingsSession, getChampionshipDrivers, getChampionshipTeams, getDrivers, getSessions } from '../lib/openf1'
import styles from './Standings.module.css'

function medal(pos) {
  if (pos === 1) return '🥇'
  if (pos === 2) return '🥈'
  if (pos === 3) return '🥉'
  return pos
}

export default function Standings() {
  const [tab,    setTab]    = useState('drivers')
  const [drivers, setDrivers] = useState([])
  const [teams,   setTeams]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)
  const [sessionInfo, setSessionInfo] = useState(null)

  useEffect(() => {
    async function load() {
      try {
        let sess = await getBestStandingsSession(2026)
        // Fallback: if no completed race session, try any session from 2026
        if (!sess) {
          const allSess = await getSessions({ year: 2026 }).catch(() => [])
          const started = allSess.filter(s => new Date(s.date_start) < new Date())
            .sort((a, b) => new Date(b.date_start) - new Date(a.date_start))
          sess = started[0] ?? null
        }
        if (!sess) { setError('No session data available yet for 2026.'); return }

        setSessionInfo(sess)
        const sk = sess.session_key

        // Sequential to avoid 429
        const champDrivers = await getChampionshipDrivers(sk).catch(() => null)
        const drvInfo      = await getDrivers(sk).catch(() => [])
        const champTeams   = await getChampionshipTeams(sk).catch(() => null)

        const drvMap = {}
        for (const d of drvInfo) drvMap[d.driver_number] = d

        if (champDrivers?.length) {
          setDrivers(
            champDrivers
              .sort((a, b) => a.position_current - b.position_current)
              .map(c => {
                const d = drvMap[c.driver_number] ?? {}
                return {
                  position: c.position_current,
                  driver_number: c.driver_number,
                  name: d.full_name ?? `Driver #${c.driver_number}`,
                  acronym: d.name_acronym ?? '???',
                  team: d.team_name ?? '—',
                  colour: d.team_colour ?? '555555',
                  points: c.points_current ?? 0,
                }
              })
          )
        } else {
          setError(`Championship standings not available for ${sess.session_name} sessions — will show after first race.`)
        }

        if (champTeams?.length) {
          setTeams(
            champTeams
              .sort((a, b) => a.position_current - b.position_current)
              .map(c => {
                const td = drvInfo.find(d => d.team_name === c.team_name)
                return {
                  position: c.position_current,
                  team: c.team_name,
                  colour: td?.team_colour ?? '555555',
                  points: c.points_current ?? 0,
                }
              })
          )
        }
      } catch (e) {
        console.error(e)
        setError('Could not load standings. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const maxPts = tab === 'drivers'
    ? (drivers[0]?.points || 1)
    : (teams[0]?.points    || 1)

  const rows = tab === 'drivers' ? drivers : teams

  return (
    <div className="page">
      <div className="page-hd">
        <h1><Trophy size={20} /> Championship Standings</h1>
        <p>
          2026 Formula 1 World Championship
          {sessionInfo && (
            <span style={{ color: 'var(--text-3)', marginLeft: 8, fontSize: '0.8rem' }}>
              · After {sessionInfo.session_name}, {sessionInfo.meeting_name}
            </span>
          )}
        </p>
      </div>

      <div className="tabs">
        <button className={`tab-btn ${tab === 'drivers' ? 'active' : ''}`} onClick={() => setTab('drivers')}>Drivers</button>
        <button className={`tab-btn ${tab === 'constructors' ? 'active' : ''}`} onClick={() => setTab('constructors')}>Constructors</button>
      </div>

      {loading ? (
        <div className="spinner-wrap"><div className="spinner" /></div>
      ) : error ? (
        <div className={styles.notice}>
          <Info size={16} />
          <span>{error}</span>
        </div>
      ) : rows.length === 0 ? (
        <div className={styles.notice}>
          <Info size={16} />
          <span>No standings data available yet.</span>
        </div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: 52 }}>POS</th>
                <th>{tab === 'drivers' ? 'DRIVER' : 'CONSTRUCTOR'}</th>
                {tab === 'drivers' && <th className={styles.teamCol}>TEAM</th>}
                <th className="mono" style={{ textAlign: 'right', paddingRight: 16 }}>PTS</th>
                <th className={styles.barCol}></th>
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={row.driver_number ?? row.team} className={styles.row}>
                  <td className={styles.pos}>{medal(row.position)}</td>
                  <td className={styles.driver}>
                    <span className={styles.driverBar} style={{ background: `#${row.colour}` }} />
                    <div>
                      <div className={styles.driverName}>{row.name ?? row.team}</div>
                      {row.acronym && <div className={styles.driverAcro}>{row.acronym}</div>}
                    </div>
                  </td>
                  {tab === 'drivers' && <td className={styles.team}>{row.team}</td>}
                  <td className={`mono ${styles.pts}`}>{row.points}</td>
                  <td className={styles.barCol}>
                    <div className={styles.barBg}>
                      <div className={styles.barFill} style={{ width: `${(row.points / maxPts) * 100}%`, background: `#${row.colour}` }} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
