import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { UsersRound, Search, AlertCircle } from 'lucide-react'
import { getBestStandingsSession, getDrivers, getChampionshipDrivers } from '../lib/openf1'
import styles from './Drivers.module.css'

const TEAM_SHORT = {
  'Red Bull Racing': 'Red Bull',
  'Mercedes-AMG Petronas F1 Team': 'Mercedes',
  'Scuderia Ferrari': 'Ferrari',
  'McLaren F1 Team': 'McLaren',
  'Aston Martin Aramco F1 Team': 'Aston Martin',
  'Alpine F1 Team': 'Alpine',
  'Williams Racing': 'Williams',
  'Visa Cash App RB Formula One Team': 'RB',
  'Stake F1 Team Kick Sauber': 'Kick Sauber',
  'MoneyGram Haas F1 Team': 'Haas',
}

function DriverCard({ driver, champPos, champPts }) {
  const col = `#${driver.team_colour ?? '555555'}`
  const teamShort = TEAM_SHORT[driver.team_name] ?? driver.team_name ?? '—'

  return (
    <div className={styles.card} style={{ '--team-col': col }}>
      {/* Colour accent top bar */}
      <div className={styles.accentBar} style={{ background: col }} />

      {/* Headshot */}
      <div className={styles.headshotWrap}>
        {driver.headshot_url
          ? <img src={driver.headshot_url} alt={driver.full_name} className={styles.headshot} onError={e=>e.target.style.display='none'} />
          : <div className={styles.headshotPlaceholder}>{driver.name_acronym}</div>
        }
      </div>

      {/* Info */}
      <div className={styles.info}>
        <div className={styles.num} style={{ color: col }}>#{driver.driver_number}</div>
        <div className={styles.name}>{driver.full_name}</div>
        <div className={styles.team}>{teamShort}</div>

        {/* Nationality flag */}
        {driver.country_code && (
          <img
            src={`https://flagcdn.com/24x18/${(driver.country_code ?? '').toLowerCase()}.png`}
            alt={driver.country_code}
            className={styles.flag}
            onError={e=>e.target.style.display='none'}
          />
        )}

        {/* Championship stats */}
        <div className={styles.stats}>
          {champPos != null && (
            <div className={styles.stat}>
              <span className={styles.statLabel}>POS</span>
              <span className={styles.statVal}>{champPos}</span>
            </div>
          )}
          {champPts != null && (
            <div className={styles.stat}>
              <span className={styles.statLabel}>PTS</span>
              <span className={styles.statVal} style={{ color: champPts > 0 ? 'var(--gold)' : 'var(--text-3)' }}>{champPts}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Drivers() {
  const [drivers, setDrivers] = useState([])
  const [champMap, setChampMap] = useState({})
  const [loading, setLoading]  = useState(true)
  const [error,   setError]    = useState(null)
  const [search,  setSearch]   = useState('')
  const [teamFilter, setTeamFilter] = useState('all')
  const [sessionInfo, setSessionInfo] = useState(null)

  useEffect(() => {
    async function load() {
      try {
        const sess = await getBestStandingsSession(2026)
        setSessionInfo(sess)
        const sk = sess?.session_key ?? 'latest'

        const [drvList, champ] = await Promise.all([
          getDrivers(sk),
          getChampionshipDrivers(sk).catch(() => []),
        ])

        // Dedupe by driver number, keep first occurrence
        const seen = new Set()
        const deduped = drvList.filter(d => {
          if (seen.has(d.driver_number)) return false
          seen.add(d.driver_number)
          return true
        })

        setDrivers(deduped)

        const cm = {}
        for (const c of (champ ?? [])) cm[c.driver_number] = c
        setChampMap(cm)
      } catch (e) {
        setError('Could not load drivers')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const teams = ['all', ...new Set(drivers.map(d => TEAM_SHORT[d.team_name] ?? d.team_name).filter(Boolean).sort())]

  const filtered = drivers
    .filter(d => {
      if (teamFilter !== 'all') {
        const ts = TEAM_SHORT[d.team_name] ?? d.team_name
        if (ts !== teamFilter) return false
      }
      if (search) {
        const q = search.toLowerCase()
        return (
          d.full_name?.toLowerCase().includes(q) ||
          d.name_acronym?.toLowerCase().includes(q) ||
          d.team_name?.toLowerCase().includes(q)
        )
      }
      return true
    })
    // Sort by championship position if available, else by driver number
    .sort((a, b) => {
      const pa = champMap[a.driver_number]?.position_current ?? 99
      const pb = champMap[b.driver_number]?.position_current ?? 99
      return pa - pb
    })

  return (
    <div className="page">
      <div className="page-hd">
        <h1><UsersRound size={20} /> Drivers</h1>
        <p>
          2026 Formula 1 Season Drivers
          {sessionInfo && (
            <span style={{ color: 'var(--text-3)', marginLeft: 8, fontSize: '0.8rem' }}>
              · As of {sessionInfo.session_name}, {sessionInfo.meeting_name}
            </span>
          )}
        </p>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <div className={styles.searchWrap}>
          <Search size={14} className={styles.searchIcon} />
          <input
            className={styles.search}
            placeholder="Search driver or team…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className={styles.teamFilters}>
          {teams.map(t => (
            <button
              key={t}
              className={`${styles.teamBtn} ${teamFilter === t ? styles.teamBtnActive : ''}`}
              onClick={() => setTeamFilter(t)}
            >
              {t === 'all' ? 'All Teams' : t}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="spinner-wrap"><div className="spinner" /></div>
      ) : error ? (
        <div className={styles.errMsg}><AlertCircle size={14} /> {error}</div>
      ) : (
        <div className={styles.grid}>
          {filtered.map(d => (
            <DriverCard
              key={d.driver_number}
              driver={d}
              champPos={champMap[d.driver_number]?.position_current ?? null}
              champPts={champMap[d.driver_number]?.points_current ?? null}
            />
          ))}
          {filtered.length === 0 && (
            <div className={styles.noResults}>No drivers match your search</div>
          )}
        </div>
      )}
    </div>
  )
}
