import { TeamLogo } from '../lib/teamLogos.jsx'
import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Users, ArrowLeft, Globe, MapPin, Calendar, Trophy, Zap } from 'lucide-react'
import { getDrivers, getBestStandingsSession, getChampionshipTeams, getChampionshipDrivers, getMeetings, getAllLaps, fmt } from '../lib/openf1'
import styles from './Teams.module.css'

// Static 2026 team data (OpenF1 doesn't serve this)
const TEAM_DATA = {
  'Mercedes': {
    fullName: 'Mercedes-AMG PETRONAS F1 Team', nationality: 'German', base: 'Brackley, UK',
    chassis: 'W17', engine: 'Mercedes', firstEntry: 1954, championships: 8,
    color: '27F4D2', drivers: ['George Russell','Kimi Antonelli'],
    bio: 'The most successful team of the modern era, Mercedes dominated the turbo-hybrid era with an unprecedented run of constructors\' championships. George Russell and young Italian prodigy Kimi Antonelli lead their 2026 assault.',
  },
  'Ferrari': {
    fullName: 'Scuderia Ferrari', nationality: 'Italian', base: 'Maranello, Italy',
    chassis: 'SF-26', engine: 'Ferrari', firstEntry: 1950, championships: 16,
    color: 'E8002D', drivers: ['Charles Leclerc','Lewis Hamilton'],
    bio: 'The oldest and most iconic team in Formula 1. Seven-time world champion Lewis Hamilton joined Ferrari for 2025, partnering Charles Leclerc in the most hotly anticipated partnership in the sport\'s history.',
  },
  'McLaren': {
    fullName: 'McLaren F1 Team', nationality: 'British', base: 'Woking, UK',
    chassis: 'MCL40', engine: 'Mercedes', firstEntry: 1966, championships: 9,
    color: 'FF8000', drivers: ['Lando Norris','Oscar Piastri'],
    bio: 'McLaren\'s renaissance is complete. With Lando Norris and Oscar Piastri leading the charge, the papaya orange machinery is back fighting at the very front of the grid after years in the midfield.',
  },
  'Red Bull Racing': {
    fullName: 'Oracle Red Bull Racing', nationality: 'Austrian', base: 'Milton Keynes, UK',
    chassis: 'RB22', engine: 'Red Bull Powertrains', firstEntry: 2005, championships: 6,
    color: '3671C6', drivers: ['Max Verstappen','Liam Lawson'],
    bio: 'Four-time champion Max Verstappen leads Red Bull\'s 2026 defence. After domination in 2022 and 2023, the competition has closed, making for the most competitive midfield in years.',
  },
  'Aston Martin': {
    fullName: 'Aston Martin Aramco F1 Team', nationality: 'British', base: 'Silverstone, UK',
    chassis: 'AMR26', engine: 'Mercedes', firstEntry: 2021, championships: 0,
    color: '229971', drivers: ['Fernando Alonso','Lance Stroll'],
    bio: 'The resurgent Silverstone squad backed by Lawrence Stroll\'s billions. Two-time world champion Fernando Alonso continues to defy age, while the team targets their first race win.',
  },
  'Alpine': {
    fullName: 'BWT Alpine F1 Team', nationality: 'French', base: 'Enstone, UK',
    chassis: 'A526', engine: 'Renault', firstEntry: 1977, championships: 2,
    color: 'FF87BC', drivers: ['Pierre Gasly','Jack Doohan'],
    bio: 'The works Renault entry racing under the Alpine brand. Built around Pierre Gasly and emerging talent Jack Doohan, the French squad aims to return to consistent points finishes.',
  },
  'Williams': {
    fullName: 'Williams Racing', nationality: 'British', base: 'Grove, UK',
    chassis: 'FW47', engine: 'Mercedes', firstEntry: 1977, championships: 7,
    color: '64C4FF', drivers: ['Alexander Albon','Carlos Sainz'],
    bio: 'The most successful privateer in F1 history. Williams have been on an upward trajectory, with Alexander Albon regularly extracting results well beyond the car\'s potential.',
  },
  'Haas F1 Team': {
    fullName: 'MoneyGram Haas F1 Team', nationality: 'American', base: 'Kannapolis, USA',
    chassis: 'VF-26', engine: 'Ferrari', firstEntry: 2016, championships: 0,
    color: 'B6BABD', drivers: ['Oliver Bearman','Esteban Ocon'],
    bio: 'The only American F1 team since 2016, Haas have stabilised in the midfield with Ferrari power. Young British talent Oliver Bearman and veteran Esteban Ocon form an intriguing pairing.',
  },
  'Racing Bulls': {
    fullName: 'Visa Cash App RB F1 Team', nationality: 'Italian', base: 'Faenza, Italy',
    chassis: 'VCARB 02', engine: 'Red Bull Powertrains', firstEntry: 2006, championships: 0,
    color: '6692FF', drivers: ['Yuki Tsunoda','Isack Hadjar'],
    bio: 'Red Bull\'s junior team and development program. Based in Faenza, the team provides a pathway from Red Bull\'s junior roster to the main team, running closely related machinery.',
  },
  'Cadillac': {
    fullName: 'Cadillac F1 Team', nationality: 'American', base: 'Concord, USA',
    chassis: 'TWO026', engine: 'Ferrari', firstEntry: 2026, championships: 0,
    color: 'FFFFFF', drivers: ['Colton Herta','Marcus Ericsson'],
    bio: 'The 11th team to join the Formula 1 grid for 2026. Backed by General Motors and Andretti, Cadillac bring American ambition and resources to the sport after years of negotiation to secure entry.',
  },
  'Sauber': {
    fullName: 'Stake F1 Team Kick Sauber', nationality: 'Swiss', base: 'Hinwil, Switzerland',
    chassis: 'C46', engine: 'Ferrari', firstEntry: 1993, championships: 0,
    color: '52E252', drivers: ['Nico Hülkenberg','Gabriel Bortoleto'],
    bio: 'Transitioning to become the Audi works team from 2026, the Swiss outfit is in a period of significant change. Nico Hülkenberg and rookie Gabriel Bortoleto lead their charge up the grid.',
  },
}

// Normalise team name from API to our key
function normTeam(name) {
  if (!name) return null
  if (name.includes('Mercedes')) return 'Mercedes'
  if (name.includes('Ferrari')) return 'Ferrari'
  if (name.includes('McLaren')) return 'McLaren'
  if (name.includes('Red Bull')) return 'Red Bull Racing'
  if (name.includes('Aston')) return 'Aston Martin'
  if (name.includes('Alpine')) return 'Alpine'
  if (name.includes('Williams')) return 'Williams'
  if (name.includes('Haas')) return 'Haas F1 Team'
  if (name.includes('Racing Bulls') || name.includes('RB') || name.includes('VCARB')) return 'Racing Bulls'
  if (name.includes('Cadillac') || name.includes('Andretti') || name.includes('TWO')) return 'Cadillac'
  if (name.includes('Sauber') || name.includes('Kick')) return 'Sauber'
  return name
}

function TeamCard({ name, data, champPos, champPts }) {
  const col = `#${data.color}`
  return (
    <Link to={`/teams/${encodeURIComponent(name)}`} className={styles.card}>
      <div className={styles.cardAccent} style={{ background: col }} />
      <div className={styles.cardInner}>
        <div className={styles.cardTop}>
          <div className={styles.teamCircle} style={{ borderColor: col, background: 'var(--bg-3)' }}>
            <TeamLogo team={name} size={52} />
          </div>
          {champPos && (
            <div className={styles.champBadge} style={{ borderColor: `${col}40`, color: col }}>
              P{champPos} · {champPts} pts
            </div>
          )}
        </div>
        <div className={styles.cardName}>{name}</div>
        <div className={styles.cardFull}>{data.fullName}</div>
        <div className={styles.cardMeta}>
          <span><Globe size={10} /> {data.nationality}</span>
          <span><MapPin size={10} /> {data.base.split(',')[1]?.trim() ?? data.base}</span>
        </div>
        <div className={styles.cardDrivers}>
          {data.drivers.map(d => (
            <span key={d} className={styles.driverPill}>{d.split(' ').slice(-1)[0]}</span>
          ))}
        </div>
        <div className={styles.cardStats}>
          <div className={styles.stat}><span className={styles.statVal}>{data.championships}</span><span className={styles.statLbl}>Titles</span></div>
          <div className={styles.stat}><span className={styles.statVal}>{data.firstEntry}</span><span className={styles.statLbl}>First GP</span></div>
          <div className={styles.stat}><span className={styles.statVal}>{data.engine}</span><span className={styles.statLbl}>Power Unit</span></div>
        </div>
        <div className={styles.viewProfile}>View Profile →</div>
      </div>
    </Link>
  )
}

export function TeamsList() {
  const [champMap, setChampMap] = useState({})

  useEffect(() => {
    getBestStandingsSession(2026)
      .then(async sess => {
        if (!sess) return
        const ct = await getChampionshipTeams(sess.session_key).catch(() => [])
        const map = {}
        for (const t of ct ?? []) {
          const key = normTeam(t.team_name)
          if (key) map[key] = { pos: t.position_current, pts: t.points_current }
        }
        setChampMap(map)
      }).catch(() => {})
  }, [])

  const teams = Object.entries(TEAM_DATA)

  return (
    <div className="page">
      <div className="page-hd">
        <h1><Users size={20} /> Teams</h1>
        <p>2026 Formula 1 constructor profiles — {teams.length} teams</p>
      </div>
      <div className={styles.grid}>
        {teams.map(([name, data]) => (
          <TeamCard
            key={name} name={name} data={data}
            champPos={champMap[name]?.pos}
            champPts={champMap[name]?.pts}
          />
        ))}
      </div>
    </div>
  )
}

export function TeamProfile() {
  const { name } = useParams()
  const decoded  = decodeURIComponent(name)
  const data     = TEAM_DATA[decoded]
  const [champData,   setChampData]   = useState(null)
  const [teamDrivers, setTeamDrivers] = useState([])
  const [loading,     setLoading]     = useState(true)

  useEffect(() => {
    if (!data) return
    async function load() {
      try {
        const sess = await getBestStandingsSession(2026)
        if (!sess) return
        const [drivers, ct, cd] = await Promise.all([
          getDrivers(sess.session_key),
          getChampionshipTeams(sess.session_key).catch(()=>[]),
          getChampionshipDrivers(sess.session_key).catch(()=>[]),
        ])
        const myDrivers = drivers.filter(d => normTeam(d.team_name) === decoded)
        setTeamDrivers(myDrivers)
        const teamChamp = (ct ?? []).find(t => normTeam(t.team_name) === decoded)
        const driverChamp = (cd ?? []).filter(c => myDrivers.some(d => d.driver_number === c.driver_number))
        setChampData({ team: teamChamp, drivers: driverChamp.map(c => ({
          ...c, info: myDrivers.find(d => d.driver_number === c.driver_number)
        }))})
      } catch(e) { console.error(e) }
      finally { setLoading(false) }
    }
    load()
  }, [decoded, data])

  if (!data) return (
    <div className="page">
      <div className="page-hd">
        <h1>Team not found</h1>
        <p><Link to="/teams" className={styles.backLink}><ArrowLeft size={14} /> Back to Teams</Link></p>
      </div>
    </div>
  )

  const col = `#${data.color}`

  return (
    <div className="page">
      {/* Back */}
      <Link to="/teams" className={styles.backLink}><ArrowLeft size={13} /> All Teams</Link>

      {/* Hero */}
      <div className={styles.hero} style={{ borderColor: `${col}30`, background: `linear-gradient(135deg, var(--bg-1), ${col}08)` }}>
        <div className={styles.heroLeft}>
          <div className={styles.heroBadge} style={{ color: col, borderColor: `${col}50` }}>{data.nationality}</div>
          <h1 className={styles.heroName} style={{ color: col }}>{decoded}</h1>
          <p className={styles.heroFull}>{data.fullName}</p>
          <p className={styles.heroBio}>{data.bio}</p>
          <div className={styles.heroMeta}>
            <span><MapPin size={12} /> {data.base}</span>
            <span><Calendar size={12} /> Est. {data.firstEntry}</span>
            <span>🏆 {data.championships} world title{data.championships !== 1 ? 's' : ''}</span>
          </div>
        </div>
        <div className={styles.heroRight}>
          <div className={styles.heroStats}>
            {[
              { val: data.chassis,       lbl: 'Chassis' },
              { val: data.engine,        lbl: 'Power Unit' },
              { val: data.championships, lbl: 'WCC Titles' },
              { val: data.firstEntry,    lbl: 'First Entry' },
            ].map(({ val, lbl }) => (
              <div key={lbl} className={styles.heroStat}>
                <span className={styles.heroStatVal} style={{ color: col }}>{val}</span>
                <span className={styles.heroStatLbl}>{lbl}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Championship position */}
      {champData?.team && (
        <div className={styles.champRow}>
          <Trophy size={14} style={{ color: col }} />
          <span>P{champData.team.position_current} in Constructors Championship</span>
          <span className={styles.champPts} style={{ color: col }}>{champData.team.points_current} pts</span>
        </div>
      )}

      {/* Drivers */}
      <h2 className={styles.sectionTitle}>2026 Drivers</h2>
      <div className={styles.driversGrid}>
        {loading ? (
          <div className="spinner-wrap"><div className="spinner" /></div>
        ) : teamDrivers.length > 0 ? teamDrivers.map(d => {
          const dc = champData?.drivers?.find(c => c.driver_number === d.driver_number)
          return (
            <div key={d.driver_number} className={styles.driverCard} style={{ borderColor: `${col}30` }}>
              <div className={styles.driverTop} style={{ background: `${col}12` }}>
                {d.headshot_url && <img src={d.headshot_url} alt={d.full_name} className={styles.headshot} onError={e=>e.target.style.display='none'} />}
                <div className={styles.driverNum} style={{ color: col }}>#{d.driver_number}</div>
              </div>
              <div className={styles.driverInfo}>
                <div className={styles.driverName}>{d.full_name}</div>
                <div className={styles.driverAcro}>{d.name_acronym}</div>
                {dc && <div className={styles.driverPts}><Trophy size={11} /> P{dc.position_current} · {dc.points_current} pts</div>}
              </div>
            </div>
          )
        }) : data.drivers.map(name => (
          <div key={name} className={styles.driverCard} style={{ borderColor: `${col}30` }}>
            <div className={styles.driverTop} style={{ background: `${col}12` }}>
              <div className={styles.driverNum} style={{ color: col }}>—</div>
            </div>
            <div className={styles.driverInfo}>
              <div className={styles.driverName}>{name}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
