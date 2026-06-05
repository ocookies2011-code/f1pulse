import { useEffect, useState } from 'react'
import { Map } from 'lucide-react'
import { getMeetings } from '../lib/openf1'
import styles from './Circuits.module.css'

export default function Circuits() {
  const [meetings, setMeetings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getMeetings(2026).then(data => {
      const unique = []
      const seen = new Set()
      for (const m of data) {
        if (!seen.has(m.circuit_key)) {
          seen.add(m.circuit_key)
          unique.push(m)
        }
      }
      setMeetings(unique.sort((a, b) => a.circuit_short_name?.localeCompare(b.circuit_short_name)))
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  return (
    <div className="page-wrap">
      <h1 className="page-title"><Map size={22} /> Circuits</h1>
      <p className="page-sub">2026 Formula 1 race venues</p>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>
      ) : (
        <div className={styles.grid}>
          {meetings.map(m => (
            <div key={m.circuit_key} className={styles.card}>
              <div className={styles.country}>{m.country_name}</div>
              <div className={styles.name}>{m.circuit_short_name}</div>
              <div className={styles.race}>{m.meeting_name}</div>
              <div className={styles.location}>{m.location}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
