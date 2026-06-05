import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Map, MapPin, Search, ArrowLeft, Clock, Calendar, Flag, Zap, ChevronRight } from 'lucide-react'
import { getMeetings, flagUrl, getSessions, getSessionResult, getDrivers, fmt } from '../lib/openf1'
import { format, isPast, parseISO } from 'date-fns'
import { CIRCUITS_2026, findCircuit } from '../lib/circuitData'
import styles from './Circuits.module.css'

// ── Helper: characteristic badge colour ──────────────────────────────────────
function CharBadge({ label }) {
  const col = label.includes('High Speed') || label.includes('Very High') || label.includes('Extreme') ? '#3671C6'
    : label.includes('Street') ? '#E8002D'
    : label.includes('Night') ? '#b45cf4'
    : label.includes('Overtaking') ? '#229971'
    : label.includes('Technical') || label.includes('Banked') ? '#f5a623'
    : 'rgba(255,255,255,0.15)'
  return (
    <span className={styles.charBadge} style={{ borderColor: `${col}50`, color: col, background: `${col}15` }}>
      {label}
    </span>
  )
}

// ── Circuit image using the official F1 SVG track maps (via flagcdn workaround) ──
function CircuitImage({ circuitKey, countryCode }) {
  // Use a placeholder SVG track outline until we have live data
  const flag = flagUrl(countryCode, '64x48')
  return (
    <div className={styles.circuitImg}>
      <div className={styles.circuitImgBg}>
        <div className={styles.trackOutline}>
          {/* Generic track silhouette — replaced by real data when available */}
          <svg viewBox="0 0 300 180" xmlns="http://www.w3.org/2000/svg" style={{ width:'100%', height:'100%', opacity:0.6 }}>
            <path
              d="M 60 90 Q 60 40 150 40 Q 240 40 240 90 Q 240 140 150 140 Q 80 140 60 110 Z"
              fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="8" strokeLinecap="round"
            />
            <circle cx="60" cy="90" r="4" fill="#e10600" />
          </svg>
        </div>
      </div>
      {flag && <img src={flag} alt="" className={styles.circuitFlag} onError={e=>e.target.style.display='none'} />}
    </div>
  )
}

// ── Circuit card (grid view) ──────────────────────────────────────────────────
function CircuitCard({ data, round, done, slug }) {
  const flag = flagUrl(data.countryCode)
  return (
    <Link to={`/circuits/${encodeURIComponent(slug)}`} className={`${styles.card} ${done ? styles.done : ''}`}>
      <div className={styles.cardImgWrap}>
        <div className={styles.cardImgBg}>
          <svg viewBox="0 0 300 160" xmlns="http://www.w3.org/2000/svg" style={{ width:'100%', height:'100%', opacity:0.5 }}>
            <path d="M 60 80 Q 60 30 150 30 Q 240 30 240 80 Q 240 130 150 130 Q 80 130 60 100 Z"
              fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="6" strokeLinecap="round" />
            <circle cx="60" cy="80" r="3.5" fill="#e10600" />
          </svg>
        </div>
        {flag && <img src={flag} alt={data.country} className={styles.cardFlag} onError={e=>e.target.style.display='none'} />}
        <div className={styles.cardImgOverlay}>
          <span className={styles.cardCircuitName}>{slug}</span>
          <span className={styles.cardLocation}>{data.location}</span>
        </div>
      </div>
      <div className={styles.cardBody}>
        <div className={styles.cardTop2}>
          <span className={styles.roundPill}>R{round}</span>
          {done && <span className={styles.donePill}>DONE</span>}
        </div>
        <div className={styles.cardTitle}>{data.fullName}</div>
        <div className={styles.cardStats}>
          <div className={styles.cardStat}><span className={styles.csl}>Length</span><strong>{data.length} km</strong></div>
          <div className={styles.cardStat}><span className={styles.csl}>Corners</span><strong>{data.corners}</strong></div>
          <div className={styles.cardStat}><span className={styles.csl}>First GP</span><strong>{data.firstGP}</strong></div>
          <div className={styles.cardStat}><span className={styles.csl}>Races</span><strong>{data.totalRaces}</strong></div>
        </div>
        <div className={styles.cardChars}>
          {(data.characteristics ?? []).slice(0,2).map(c => <CharBadge key={c} label={c} />)}
        </div>
        <div className={styles.lapRecord}>
          <span className={styles.lrLabel}>Lap Record</span>
          <span className={styles.lrTime}>{data.lapRecord}</span>
          <span className={styles.lrHolder}>{data.lapRecordHolder} ({data.lapRecordYear})</span>
        </div>
        <div className={styles.viewLink}>View circuit profile <ChevronRight size={13} /></div>
      </div>
    </Link>
  )
}

// ── Circuit profile page ──────────────────────────────────────────────────────
export function CircuitProfile() {
  const { slug } = useParams()
  const decoded  = decodeURIComponent(slug)
  const data     = CIRCUITS_2026[decoded] ?? findCircuit(decoded)
  const [results, setResults] = useState([])
  const [drivers, setDrivers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!data) { setLoading(false); return }
    async function load() {
      try {
        // Find the most recent session for this circuit
        const allSessions = await getSessions({ year: 2026 })
        const match = allSessions.find(s =>
          s.meeting_name?.toLowerCase().includes(decoded.toLowerCase()) ||
          s.session_name === 'Race' && s.meeting_name?.includes(data.grandPrix?.split(' ')[0])
        )
        if (match) {
          const [res, drvs] = await Promise.all([
            getSessionResult(match.session_key).catch(()=>[]),
            getDrivers(match.session_key).catch(()=>[]),
          ])
          setResults(res ?? [])
          setDrivers(drvs ?? [])
        }
      } catch(e) { console.error(e) }
      finally { setLoading(false) }
    }
    load()
  }, [decoded, data])

  if (!data) return (
    <div className="page">
      <Link to="/circuits" className={styles.backLink}><ArrowLeft size={13} /> All Circuits</Link>
      <div className="page-hd"><h1>Circuit not found</h1></div>
    </div>
  )

  const flag = flagUrl(data.countryCode, '64x48')
  const drvMap = {}
  for (const d of drivers) drvMap[d.driver_number] = d

  return (
    <div className="page">
      <Link to="/circuits" className={styles.backLink}><ArrowLeft size={13} /> All Circuits</Link>

      {/* ── Hero ── */}
      <div className={styles.hero}>
        <div className={styles.heroLeft}>
          <div className={styles.heroMeta2}>
            {flag && <img src={flag} alt={data.country} className={styles.heroFlag} onError={e=>e.target.style.display='none'} />}
            <span className={styles.heroCountry}>{data.country?.toUpperCase()}</span>
          </div>
          <h1 className={styles.heroName}>{decoded}</h1>
          <div className={styles.heroFull}>{data.fullName}</div>
          <div className={styles.heroLocation}><MapPin size={12} /> {data.location}</div>
          <p className={styles.heroDesc}>{data.description}</p>
          <div className={styles.heroChars}>
            {(data.characteristics ?? []).map(c => <CharBadge key={c} label={c} />)}
          </div>
        </div>
        <div className={styles.heroRight}>
          {/* Track outline SVG */}
          <div className={styles.heroTrack}>
            <svg viewBox="0 0 400 280" xmlns="http://www.w3.org/2000/svg" style={{ width:'100%', height:'100%' }}>
              <path d="M 80 140 Q 80 50 200 50 Q 320 50 320 140 Q 320 230 200 230 Q 110 230 80 170 Z"
                fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="16" strokeLinecap="round" />
              <path d="M 80 140 Q 80 50 200 50 Q 320 50 320 140 Q 320 230 200 230 Q 110 230 80 170 Z"
                fill="none" stroke="rgba(225,6,0,0.8)" strokeWidth="4" strokeLinecap="round"
                strokeDasharray="20 8" />
              <circle cx="80" cy="140" r="6" fill="#e10600" />
              <text x="95" y="145" fill="rgba(255,255,255,0.5)" fontSize="11" fontFamily="monospace">S/F</text>
              {/* DRS zones */}
              {[...Array(data.drsZones)].map((_, i) => (
                <line key={i}
                  x1={160 + i*80} y1={50} x2={160+i*80+40} y2={50}
                  stroke="#39d98a" strokeWidth="6" strokeLinecap="round" />
              ))}
            </svg>
            <div className={styles.heroTrackLabel}>{data.grandPrix}</div>
          </div>
        </div>
      </div>

      {/* ── Key facts ── */}
      <div className={styles.factsGrid}>
        {[
          { label: 'Circuit Length', value: `${data.length} km` },
          { label: 'Corners', value: data.corners },
          { label: 'DRS Zones', value: data.drsZones },
          { label: 'First Grand Prix', value: data.firstGP },
          { label: 'Total Races', value: data.totalRaces },
          { label: 'Elevation Change', value: `${data.elevation ?? 0} m` },
        ].map(({ label, value }) => (
          <div key={label} className={styles.fact}>
            <span className={styles.factVal}>{value}</span>
            <span className={styles.factLbl}>{label}</span>
          </div>
        ))}
      </div>

      {/* ── Lap record ── */}
      <div className={styles.lapRecordCard}>
        <div className={styles.lrcLabel}><Clock size={13} /> Circuit Lap Record</div>
        <div className={styles.lrcTime}>{data.lapRecord}</div>
        <div className={styles.lrcHolder}>{data.lapRecordHolder} · {data.lapRecordYear}</div>
      </div>

      {/* ── 2026 race result ── */}
      {results.length > 0 && (
        <div className={styles.resultsSection}>
          <h2 className={styles.sectionTitle}>2026 Race Result</h2>
          <div className="data-table-wrap">
            <table className="data-table">
              <thead><tr><th>POS</th><th>DRIVER</th><th>TEAM</th><th>TIME/GAP</th></tr></thead>
              <tbody>
                {results.slice(0, 10).map((r, i) => {
                  const drv = drvMap[r.driver_number] ?? {}
                  return (
                    <tr key={r.driver_number}>
                      <td className="mono" style={{ fontWeight:800 }}>{r.position ?? i+1}</td>
                      <td>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <span style={{ width:3, height:20, borderRadius:2, background:`#${drv.team_colour ?? 'aaa'}`, flexShrink:0 }} />
                          {drv.full_name ?? `#${r.driver_number}`}
                        </div>
                      </td>
                      <td style={{ color:'var(--text-2)', fontSize:'0.82rem' }}>{drv.team_name ?? '—'}</td>
                      <td className="mono" style={{ color:'var(--text-2)', fontSize:'0.82rem' }}>{r.gap_to_leader ?? r.duration ?? '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Circuits list page ────────────────────────────────────────────────────────
export function CircuitsList() {
  const [meetings, setMeetings] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')

  useEffect(() => {
    getMeetings(2026)
      .then(data => {
        const seen = new Set()
        const uniq = []
        for (const m of data.sort((a,b)=>new Date(a.date_start)-new Date(b.date_start))) {
          if (m.meeting_name?.toLowerCase().includes('testing')) continue
          if (!seen.has(m.circuit_key)) { seen.add(m.circuit_key); uniq.push(m) }
        }
        setMeetings(uniq)
      })
      .finally(() => setLoading(false))
  }, [])

  const filtered = meetings.filter(m =>
    !search ||
    [m.circuit_short_name, m.meeting_name, m.country_name, m.location]
      .some(v => v?.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="page">
      <div className="page-hd" style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
        <div>
          <h1><Map size={20} /> Circuits</h1>
          <p>2026 Formula 1 race venues — {meetings.length} rounds</p>
        </div>
        <div className={styles.searchBox}>
          <Search size={13} style={{ color:'var(--text-3)', flexShrink:0 }} />
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search circuits…" />
        </div>
      </div>

      {loading ? (
        <div className="spinner-wrap"><div className="spinner" /></div>
      ) : (
        <div className={styles.grid}>
          {filtered.map((m, i) => {
            const slug = m.circuit_short_name ?? m.location ?? m.meeting_name
            const circData = CIRCUITS_2026[slug] ?? findCircuit(m.circuit_short_name ?? m.meeting_name)
            const done = isPast(parseISO(m.date_end ?? m.date_start))
            if (!circData) return (
              <div key={m.circuit_key} className={styles.card} style={{ opacity:0.7 }}>
                <div className={styles.cardBody}>
                  <div className={styles.cardTop2}><span className={styles.roundPill}>R{i+1}</span></div>
                  <div className={styles.cardTitle}>{m.circuit_short_name}</div>
                  <div style={{ fontSize:'0.8rem', color:'var(--text-3)' }}>{m.meeting_name}</div>
                  <div style={{ fontSize:'0.78rem', color:'var(--text-3)', marginTop:8 }}>{format(parseISO(m.date_start),'d MMM yyyy')}</div>
                </div>
              </div>
            )
            return (
              <CircuitCard key={m.circuit_key} data={circData} round={i+1} done={done} slug={slug} />
            )
          })}
        </div>
      )}
    </div>
  )
}
