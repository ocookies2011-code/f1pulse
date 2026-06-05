import { useEffect, useState } from 'react'
import { Trophy } from 'lucide-react'
import { getSessions, getChampionshipDrivers, getChampionshipTeams, getDrivers } from '../lib/openf1'
import styles from './Standings.module.css'

function medal(pos) {
  if (pos === 1) return '🥇'
  if (pos === 2) return '🥈'
  if (pos === 3) return '🥉'
  return pos
}

export default function Standings() {
  const [tab, setTab] = useState('drivers')
  const [driverStandings, setDriverStandings] = useState([])
  const [constructorStandings, setConstructorStandings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function load() {
      try {
        // Get the latest race session to pull championship data from
        const sessions = await getSessions({ year: 2026, session_name: 'Race' })
        const raceSessions = sessions.filter(s => !s.session_name?.toLowerCase().includes('sprint'))
        const latestRace = raceSessions.sort((a, b) => new Date(b.date_start) - new Date(a.date_start))[0]

        if (!latestRace) {
          setError('No race sessions found yet for 2026.')
          return
        }

        const sessionKey = latestRace.session_key

        // Fetch championship standings + driver info in parallel
        const [champDrivers, champTeams, drivers] = await Promise.all([
          getChampionshipDrivers(sessionKey),
          getChampionshipTeams(sessionKey),
          getDrivers(sessionKey),
        ])

        // Build driver map for colours/names
        const drvMap = {}
        for (const d of drivers) drvMap[d.driver_number] = d

        const driverRows = champDrivers
          .sort((a, b) => a.position_current - b.position_current)
          .map(c => {
            const drv = drvMap[c.driver_number] ?? {}
            return {
              position: c.position_current,
              driver_number: c.driver_number,
              name: drv.full_name ?? `Driver #${c.driver_number}`,
              acronym: drv.name_acronym ?? '???',
              team: drv.team_name ?? '—',
              colour: drv.team_colour ?? '555555',
              headshot: drv.headshot_url ?? null,
              points: c.points_current ?? 0,
              points_gained: (c.points_current ?? 0) - (c.points_start ?? 0),
            }
          })

        const teamRows = champTeams
          .sort((a, b) => a.position_current - b.position_current)
          .map(c => {
            // Find a driver from this team for the colour
            const teamDriver = drivers.find(d => d.team_name === c.team_name)
            return {
              position: c.position_current,
              team: c.team_name,
              colour: teamDriver?.team_colour ?? '555555',
              points: c.points_current ?? 0,
              points_gained: (c.points_current ?? 0) - (c.points_start ?? 0),
            }
          })

        setDriverStandings(driverRows)
        setConstructorStandings(teamRows)
      } catch (e) {
        setError('Could not load standings. Try again shortly.')
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const maxPts = tab === 'drivers'
    ? (driverStandings[0]?.points || 1)
    : (constructorStandings[0]?.points || 1)

  return (
    <div className="page-wrap">
      <h1 className="page-title"><Trophy size={22} /> Championship Standings</h1>
      <p className="page-sub">2026 Formula 1 World Championship</p>

      <div className={styles.tabs}>
        <button className={`${styles.tab} ${tab === 'drivers' ? styles.active : ''}`} onClick={() => setTab('drivers')}>
          Drivers
        </button>
        <button className={`${styles.tab} ${tab === 'constructors' ? styles.active : ''}`} onClick={() => setTab('constructors')}>
          Constructors
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>
      ) : error ? (
        <div className={styles.error}>{error}</div>
      ) : tab === 'drivers' ? (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>POS</th>
                <th>DRIVER</th>
                <th>TEAM</th>
                <th className="mono">PTS</th>
                <th className={styles.barCol}></th>
              </tr>
            </thead>
            <tbody>
              {driverStandings.map((d) => (
                <tr key={d.driver_number} className={styles.row}>
                  <td className={styles.pos}>{medal(d.position)}</td>
                  <td className={styles.driver}>
                    <span className={styles.driverBar} style={{ backgroundColor: `#${d.colour}` }} />
                    <div>
                      <div className={styles.driverName}>{d.name}</div>
                      <div className={styles.driverAcro}>{d.acronym}</div>
                    </div>
                  </td>
                  <td className={styles.team}>{d.team}</td>
                  <td className={`mono ${styles.pts}`}>{d.points}</td>
                  <td className={styles.barCol}>
                    <div className={styles.barBg}>
                      <div className={styles.barFill} style={{ width: `${(d.points / maxPts) * 100}%`, backgroundColor: `#${d.colour}` }} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>POS</th>
                <th>CONSTRUCTOR</th>
                <th className="mono">PTS</th>
                <th className={styles.barCol}></th>
              </tr>
            </thead>
            <tbody>
              {constructorStandings.map((c) => (
                <tr key={c.team} className={styles.row}>
                  <td className={styles.pos}>{medal(c.position)}</td>
                  <td className={styles.driver}>
                    <span className={styles.driverBar} style={{ backgroundColor: `#${c.colour}` }} />
                    <span className={styles.driverName}>{c.team}</span>
                  </td>
                  <td className={`mono ${styles.pts}`}>{c.points}</td>
                  <td className={styles.barCol}>
                    <div className={styles.barBg}>
                      <div className={styles.barFill} style={{ width: `${(c.points / maxPts) * 100}%`, backgroundColor: `#${c.colour}` }} />
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
