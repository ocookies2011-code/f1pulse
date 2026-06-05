import { useEffect, useState } from 'react'
import { Map, MapPin, Search } from 'lucide-react'
import { getMeetings, flagUrl } from '../lib/openf1'
import styles from './Circuits.module.css'

export default function Circuits() {
  const [circuits, setCircuits] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    getMeetings(2026).then(data => {
      // Deduplicate by circuit_key, filter out testing
      const seen = new Set()
      const uniq = []
      for (const m of data.sort((a,b) => new Date(a.date_start) - new Date(b.date_start))) {
        if (m.meeting_name?.toLowerCase().includes('testing')) continue
        if (!seen.has(m.circuit_key)) {
          seen.add(m.circuit_key)
          uniq.push(m)
        }
      }
      setCircuits(uniq)
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  const filtered = circuits.filter(c =>
    !search || [c.circuit_short_name, c.meeting_name, c.country_name, c.location]
      .some(v => v?.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="page-wrap">
      <div className="page-header">
        <div>
          <h1 className="page-title"><Map size={20}/> Circuits</h1>
          <p className="page-sub">2026 Formula 1 race venues</p>
        </div>
        <div className={styles.search}>
          <Search size={14} style={{color:'var(--text-3)',flexShrink:0}}/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search circuits…"/>
        </div>
      </div>

      {loading ? <div className="center-spin"><div className="spinner"/></div> : (
        <div className={styles.grid}>
          {filtered.map((c, i) => {
            const flag = c.country_code ? flagUrl(c.country_code) : null
            return (
              <div key={c.circuit_key} className={styles.card}>
                <div className={styles.cardHeader}>
                  <span className={styles.country} style={{color:'var(--red)'}}>
                    {c.country_name?.toUpperCase()}
                  </span>
                  {flag && (
                    <img src={flag} alt={c.country_name}
                      className={styles.flag}
                      onError={e=>e.target.style.display='none'}/>
                  )}
                </div>
                <div className={styles.circuitName}>{c.circuit_short_name}</div>
                <div className={styles.gp}>{c.meeting_name}</div>
                <div className={styles.location}>
                  <MapPin size={10}/> {c.location}
                </div>
                <div className={styles.round}>Round {i+1}</div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
