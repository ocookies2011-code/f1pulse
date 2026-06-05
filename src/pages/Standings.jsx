import { useEffect, useState } from 'react'
import { Trophy } from 'lucide-react'
import { getLatestRaceSession, getChampionshipDrivers, getChampionshipTeams, getDrivers } from '../lib/openf1'
import styles from './Standings.module.css'

export default function Standings() {
  const [tab, setTab] = useState('drivers')
  const [drivers, setDrivers] = useState([])
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [sessionInfo, setSessionInfo] = useState(null)

  useEffect(() => {
    async function load() {
      try {
        // Championship data is ONLY available on completed race sessions
        const raceSession = await getLatestRaceSession(2026)
        if (!raceSession) {
          setError('No completed race sessions found for 2026 yet.')
          return
        }
        setSessionInfo(raceSession)
        const sk = raceSession.session_key
        const [champD, champT, drvs] = await Promise.all([
          getChampionshipDrivers(sk),
          getChampionshipTeams(sk),
          getDrivers(sk),
        ])
        const drvMap = {}
        for (const d of drvs) drvMap[d.driver_number] = d

        setDrivers(
          champD.sort((a,b) => a.position_current - b.position_current).map(c => {
            const d = drvMap[c.driver_number] ?? {}
            return { ...c, full_name: d.full_name ?? `#${c.driver_number}`, acronym: d.name_acronym ?? '???', team: d.team_name ?? '—', colour: d.team_colour ?? '555555' }
          })
        )
        setTeams(
          champT.sort((a,b) => a.position_current - b.position_current).map(c => {
            const td = Object.values(drvMap).find(d => d.team_name === c.team_name)
            return { ...c, colour: td?.team_colour ?? '555555' }
          })
        )
      } catch(e) {
        setError('Could not load standings — try again shortly.')
        console.error(e)
      } finally { setLoading(false) }
    }
    load()
  }, [])

  const driverRows = tab === 'drivers' ? drivers : teams
  const maxPts = driverRows[0]?.points_current || 1

  function medal(p) {
    if (p===1) return <span style={{fontSize:'1.1rem'}}>🥇</span>
    if (p===2) return <span style={{fontSize:'1.1rem'}}>🥈</span>
    if (p===3) return <span style={{fontSize:'1.1rem'}}>🥉</span>
    return <span className={`mono`} style={{fontWeight:700}}>{p}</span>
  }

  return (
    <div className="page-wrap">
      <div className="page-header">
        <div>
          <h1 className="page-title"><Trophy size={20}/> Championship Standings</h1>
          <p className="page-sub">
            2026 Formula 1 World Championship
            {sessionInfo && ` · After ${sessionInfo.meeting_name}`}
          </p>
        </div>
      </div>

      <div className="tab-row">
        <button className={`tab-btn ${tab==='drivers'?'active':''}`} onClick={()=>setTab('drivers')}>Drivers</button>
        <button className={`tab-btn ${tab==='constructors'?'active':''}`} onClick={()=>setTab('constructors')}>Constructors</button>
      </div>

      {loading ? <div className="center-spin"><div className="spinner"/></div>
      : error ? <div className="state-msg err">{error}</div>
      : tab==='drivers' ? (
        <div className="dt-wrap">
          <table className="dt">
            <thead><tr>
              <th style={{width:48}}>POS</th>
              <th>DRIVER</th>
              <th>TEAM</th>
              <th className="mono" style={{textAlign:'right'}}>PTS</th>
              <th style={{width:180}}></th>
            </tr></thead>
            <tbody>
              {drivers.map(d => (
                <tr key={d.driver_number}>
                  <td style={{textAlign:'center'}}>{medal(d.position_current)}</td>
                  <td>
                    <div className={styles.driver}>
                      <span className={styles.bar} style={{background:`#${d.colour}`}}/>
                      <div>
                        <div style={{fontWeight:700}}>{d.full_name}</div>
                        <div className={`mono`} style={{fontSize:'.72rem',color:'var(--text-3)'}}>{d.acronym}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{color:'var(--text-2)',fontSize:'.82rem'}}>{d.team}</td>
                  <td className="mono" style={{textAlign:'right',fontWeight:800,fontSize:'1rem'}}>{d.points_current}</td>
                  <td>
                    <div className={styles.barBg}>
                      <div className={styles.barFill} style={{width:`${(d.points_current/maxPts)*100}%`,background:`#${d.colour}`}}/>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="dt-wrap">
          <table className="dt">
            <thead><tr>
              <th style={{width:48}}>POS</th>
              <th>CONSTRUCTOR</th>
              <th className="mono" style={{textAlign:'right'}}>PTS</th>
              <th style={{width:200}}></th>
            </tr></thead>
            <tbody>
              {teams.map(t => (
                <tr key={t.team_name}>
                  <td style={{textAlign:'center'}}>{medal(t.position_current)}</td>
                  <td>
                    <div className={styles.driver}>
                      <span className={styles.bar} style={{background:`#${t.colour}`}}/>
                      <span style={{fontWeight:700}}>{t.team_name}</span>
                    </div>
                  </td>
                  <td className="mono" style={{textAlign:'right',fontWeight:800,fontSize:'1rem'}}>{t.points_current}</td>
                  <td>
                    <div className={styles.barBg}>
                      <div className={styles.barFill} style={{width:`${(t.points_current/maxPts)*100}%`,background:`#${t.colour}`}}/>
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
