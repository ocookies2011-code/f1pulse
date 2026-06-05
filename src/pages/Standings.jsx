import { useEffect, useState } from 'react'
import { Trophy } from 'lucide-react'
import { getSessions, getLaps } from '../lib/openf1'
import styles from './Standings.module.css'

// Static 2026 driver/constructor data as OpenF1 doesn't have a standings endpoint directly
const DRIVERS_2026 = [
  { driver_number: 63, acronym: 'RUS', name: 'George Russell', team: 'Mercedes', colour: '27F4D2' },
  { driver_number: 12, acronym: 'ANT', name: 'Andrea Kimi Antonelli', team: 'Mercedes', colour: '27F4D2' },
  { driver_number: 16, acronym: 'LEC', name: 'Charles Leclerc', team: 'Ferrari', colour: 'E8002D' },
  { driver_number: 44, acronym: 'HAM', name: 'Lewis Hamilton', team: 'Ferrari', colour: 'E8002D' },
  { driver_number: 4, acronym: 'NOR', name: 'Lando Norris', team: 'McLaren', colour: 'FF8000' },
  { driver_number: 81, acronym: 'PIA', name: 'Oscar Piastri', team: 'McLaren', colour: 'FF8000' },
  { driver_number: 14, acronym: 'ALO', name: 'Fernando Alonso', team: 'Aston Martin', colour: '229971' },
  { driver_number: 18, acronym: 'STR', name: 'Lance Stroll', team: 'Aston Martin', colour: '229971' },
  { driver_number: 1, acronym: 'VER', name: 'Max Verstappen', team: 'Red Bull Racing', colour: '3671C6' },
  { driver_number: 30, acronym: 'LAW', name: 'Liam Lawson', team: 'Red Bull Racing', colour: '3671C6' },
  { driver_number: 55, acronym: 'SAI', name: 'Carlos Sainz', team: 'Williams', colour: '64C4FF' },
  { driver_number: 23, acronym: 'ALB', name: 'Alexander Albon', team: 'Williams', colour: '64C4FF' },
  { driver_number: 87, acronym: 'BEA', name: 'Oliver Bearman', team: 'Haas', colour: 'B6BABD' },
  { driver_number: 50, acronym: 'OCO', name: 'Esteban Ocon', team: 'Haas', colour: 'B6BABD' },
  { driver_number: 22, acronym: 'TSU', name: 'Yuki Tsunoda', team: 'Racing Bulls', colour: '6692FF' },
  { driver_number: 6, acronym: 'HAD', name: 'Isack Hadjar', team: 'Racing Bulls', colour: '6692FF' },
  { driver_number: 5, acronym: 'GAS', name: 'Pierre Gasly', team: 'Alpine', colour: 'FF87BC' },
  { driver_number: 10, acronym: 'DOO', name: 'Jack Doohan', team: 'Alpine', colour: 'FF87BC' },
  { driver_number: 20, acronym: 'MAG', name: 'Kevin Magnussen', team: 'Kick Sauber', colour: '52E252' },
  { driver_number: 27, acronym: 'HUL', name: 'Nico Hülkenberg', team: 'Kick Sauber', colour: '52E252' },
]

const PTS_SYSTEM = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1]

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

  useEffect(() => {
    // Build standings from 2026 race sessions
    async function load() {
      try {
        const sessions = await getSessions({ year: 2026, session_name: 'Race' })
        const pointsMap = {}
        const constructorPts = {}

        // Initialise
        DRIVERS_2026.forEach(d => { pointsMap[d.driver_number] = 0 })

        for (const sess of sessions) {
          try {
            // Get laps to determine finishing order (last lap number = finished laps)
            const laps = await getLaps(sess.session_key)
            const lapCounts = {}
            for (const l of laps) {
              if (!lapCounts[l.driver_number] || l.lap_number > lapCounts[l.driver_number]) {
                lapCounts[l.driver_number] = l.lap_number
              }
            }
            const sorted = Object.entries(lapCounts)
              .sort((a, b) => b[1] - a[1])
              .map(([num]) => parseInt(num))

            sorted.forEach((dnum, idx) => {
              const pts = PTS_SYSTEM[idx] ?? 0
              pointsMap[dnum] = (pointsMap[dnum] ?? 0) + pts
            })
          } catch {}
        }

        const drivers = DRIVERS_2026.map(d => ({ ...d, points: pointsMap[d.driver_number] ?? 0 }))
          .sort((a, b) => b.points - a.points)

        // Constructor standings
        const ctorMap = {}
        drivers.forEach(d => {
          ctorMap[d.team] = (ctorMap[d.team] ?? 0) + d.points
        })
        const constructors = Object.entries(ctorMap)
          .map(([team, points]) => {
            const drv = DRIVERS_2026.find(d => d.team === team)
            return { team, points, colour: drv?.colour ?? '555555' }
          })
          .sort((a, b) => b.points - a.points)

        setDriverStandings(drivers)
        setConstructorStandings(constructors)
      } catch (e) {
        // Fallback: no data
        setDriverStandings(DRIVERS_2026.map(d => ({ ...d, points: 0 })))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div className="page-wrap">
      <h1 className="page-title"><Trophy size={22} /> Championship Standings</h1>
      <p className="page-sub">2026 Formula 1 World Championship</p>

      <div className={styles.tabs}>
        <button className={`${styles.tab} ${tab === 'drivers' ? styles.active : ''}`} onClick={() => setTab('drivers')}>Drivers</button>
        <button className={`${styles.tab} ${tab === 'constructors' ? styles.active : ''}`} onClick={() => setTab('constructors')}>Constructors</button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>
      ) : tab === 'drivers' ? (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>POS</th>
                <th>DRIVER</th>
                <th>TEAM</th>
                <th>PTS</th>
              </tr>
            </thead>
            <tbody>
              {driverStandings.map((d, i) => (
                <tr key={d.driver_number} className={styles.row}>
                  <td className={styles.pos}>{medal(i + 1)}</td>
                  <td className={styles.driver}>
                    <span className={styles.driverBar} style={{ backgroundColor: `#${d.colour}` }} />
                    <div>
                      <div className={styles.driverName}>{d.name}</div>
                      <div className={styles.driverAcro}>{d.acronym}</div>
                    </div>
                  </td>
                  <td className={styles.team}>{d.team}</td>
                  <td className={`mono ${styles.pts}`}>{d.points}</td>
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
                <th>PTS</th>
                <th>BAR</th>
              </tr>
            </thead>
            <tbody>
              {constructorStandings.map((c, i) => {
                const max = constructorStandings[0]?.points || 1
                return (
                  <tr key={c.team} className={styles.row}>
                    <td className={styles.pos}>{medal(i + 1)}</td>
                    <td className={styles.driver}>
                      <span className={styles.driverBar} style={{ backgroundColor: `#${c.colour}` }} />
                      <span className={styles.driverName}>{c.team}</span>
                    </td>
                    <td className={`mono ${styles.pts}`}>{c.points}</td>
                    <td style={{ width: 180 }}>
                      <div className={styles.barBg}>
                        <div className={styles.barFill} style={{ width: `${(c.points / max) * 100}%`, backgroundColor: `#${c.colour}` }} />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
