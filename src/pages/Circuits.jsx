import { useEffect, useState } from 'react'
import { Map, MapPin, Search, Calendar } from 'lucide-react'
import { getMeetings, flagUrl } from '../lib/openf1'
import { format, isPast, parseISO } from 'date-fns'
import styles from './Circuits.module.css'

export default function Circuits() {
  const [circuits, setCircuits] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')

  useEffect(() => {
    getMeetings(2026)
      .then(data => {
        const seen = new Set()
        const uniq = []
        for (const m of data.sort((a, b) => new Date(a.date_start) - new Date(b.date_start))) {
          if (m.meeting_name?.toLowerCase().includes('testing')) continue
          if (!seen.has(m.circuit_key)) { seen.add(m.circuit_key); uniq.push(m) }
        }
        setCircuits(uniq)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const filtered = circuits.filter(c =>
    !search ||
    [c.circuit_short_name, c.meeting_name, c.country_name, c.location]
      .some(v => v?.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="page">
      <div className="page-hd" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1><Map size={20} /> Circuits</h1>
          <p>2026 Formula 1 race venues — {circuits.length} rounds</p>
        </div>
        <div className={styles.searchBox}>
          <Search size={13} style={{ color: 'var(--text-3)', flexShrink: 0 }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search circuits…"
          />
        </div>
      </div>

      {loading ? (
        <div className="spinner-wrap"><div className="spinner" /></div>
      ) : (
        <div className={styles.grid}>
          {filtered.map((c, i) => {
            const flag = c.country_flag || flagUrl(c.country_code)
            const done = isPast(parseISO(c.date_end ?? c.date_start))
            return (
              <div key={c.circuit_key} className={`${styles.card} ${done ? styles.done : ''}`}>
                <div className={styles.cardTop}>
                  <span className={styles.round}>R{i + 1}</span>
                  {done && <span className={styles.doneBadge}>DONE</span>}
                </div>
                {flag && (
                  <img src={flag} alt={c.country_name} className={styles.flag}
                    onError={e => e.target.style.display = 'none'} />
                )}
                <div className={styles.country}>{c.country_name?.toUpperCase()}</div>
                <div className={styles.name}>{c.circuit_short_name}</div>
                <div className={styles.gp}>{c.meeting_name}</div>
                <div className={styles.meta}>
                  <span><MapPin size={10} /> {c.location}</span>
                  <span><Calendar size={10} /> {format(parseISO(c.date_start), 'd MMM')}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
