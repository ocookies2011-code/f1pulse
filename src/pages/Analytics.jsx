import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { BarChart2, Zap, Lock, TrendingUp, Users, Layers } from 'lucide-react'
import { getSessions, getLaps, getDrivers, getStints, fmt } from '../lib/openf1'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid,
  BarChart, Bar, Cell, ReferenceLine, ScatterChart, Scatter,
} from 'recharts'
import { useAuth } from '../hooks/useAuth'
import styles from './Analytics.module.css'

function PremiumGate({ children, title }) {
  const { isPremium } = useAuth()
  if (isPremium) return children
  return (
    <div className={styles.gate}>
      <Lock size={22} style={{ color:'var(--gold)' }} />
      <div className={styles.gateText}>
        <strong>{title}</strong> is a Pro feature
      </div>
      <Link to="/premium" className="btn btn-gold btn-sm"><Zap size={11} /> Upgrade</Link>
    </div>
  )
}

// ── Lap chart ─────────────────────────────────────────────────────────────────
function LapTimesChart({ sessionKey, drivers }) {
  const [data, setData]       = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState([])

  useEffect(() => {
    if (!sessionKey || !drivers.length) return
    setLoading(true)
    const top = drivers.slice(0, 6)
    setSelected(top.map(d => d.driver_number))
    Promise.all(top.map(d =>
      getLaps(sessionKey, d.driver_number)
        .then(laps => ({ driver: d, laps }))
        .catch(() => ({ driver: d, laps: [] }))
    )).then(results => {
      const maxLap = Math.max(...results.flatMap(r => r.laps.map(l => l.lap_number ?? 0)))
      const rows = []
      for (let lap = 1; lap <= maxLap; lap++) {
        const row = { lap }
        for (const { driver, laps } of results) {
          const l = laps.find(x => x.lap_number === lap)
          if (l?.lap_duration && l.lap_duration < 200) row[driver.name_acronym] = l.lap_duration
        }
        rows.push(row)
      }
      setData(rows.filter(r => Object.keys(r).length > 1))
    }).finally(() => setLoading(false))
  }, [sessionKey, drivers])

  if (loading) return <div className="spinner-wrap"><div className="spinner" /></div>
  if (!data.length) return <div className={styles.empty}>No lap data available for this session.</div>

  const driverKeys = drivers.slice(0,6).map(d => d.name_acronym)
  const allTimes   = data.flatMap(r => driverKeys.map(k => r[k]).filter(Boolean))
  const minT = allTimes.length ? Math.min(...allTimes) - 0.5 : 0
  const maxT = allTimes.length ? Math.max(...allTimes) + 2 : 200

  return (
    <div>
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={data} margin={{ top:8, right:16, left:0, bottom:0 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.04)" />
          <XAxis dataKey="lap" stroke="var(--text-3)" tick={{ fontSize:10 }} label={{ value:'Lap', position:'insideBottom', offset:-2, fill:'var(--text-3)', fontSize:10 }} />
          <YAxis stroke="var(--text-3)" tick={{ fontSize:10, fontFamily:'var(--font-mono)' }}
            tickFormatter={v => fmt(v)} domain={[minT, maxT]} width={80} />
          <Tooltip
            contentStyle={{ background:'var(--bg-2)', border:'1px solid var(--border)', borderRadius:8, fontSize:12 }}
            labelStyle={{ color:'var(--text-2)', marginBottom:6 }}
            formatter={(v, name) => [fmt(v), name]}
            labelFormatter={l => `Lap ${l}`}
          />
          <Legend wrapperStyle={{ fontSize:12, paddingTop:10 }} />
          {drivers.slice(0,6).map(d => (
            <Line key={d.driver_number} type="monotone" dataKey={d.name_acronym}
              stroke={`#${d.team_colour}`} dot={false} strokeWidth={2} connectNulls={false}
              opacity={selected.includes(d.driver_number) ? 1 : 0.2}
              onClick={() => setSelected(s => s.includes(d.driver_number) ? s.filter(x=>x!==d.driver_number) : [...s, d.driver_number])}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
      <p style={{ fontSize:'0.75rem', color:'var(--text-3)', marginTop:6 }}>Click a driver in the legend to toggle visibility</p>
    </div>
  )
}

// ── Potential lap chart (best sectors) ────────────────────────────────────────
function PotentialLapChart({ sessionKey, drivers }) {
  const [data, setData]       = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!sessionKey || !drivers.length) return
    setLoading(true)
    Promise.all(drivers.slice(0,12).map(d =>
      getLaps(sessionKey, d.driver_number)
        .then(laps => ({ driver: d, laps }))
        .catch(() => ({ driver: d, laps: [] }))
    )).then(results => {
      const rows = results.map(({ driver, laps }) => {
        const validLaps = laps.filter(l => l.lap_duration && l.lap_duration < 200)
        if (!validLaps.length) return null
        const bestLap  = Math.min(...validLaps.map(l => l.lap_duration))
        const bestS1   = Math.min(...validLaps.map(l => l.duration_sector_1).filter(Boolean))
        const bestS2   = Math.min(...validLaps.map(l => l.duration_sector_2).filter(Boolean))
        const bestS3   = Math.min(...validLaps.map(l => l.duration_sector_3).filter(Boolean))
        const potential = (bestS1||0) + (bestS2||0) + (bestS3||0)
        return {
          acronym: driver.name_acronym,
          colour: driver.team_colour,
          bestLap, potential: potential || bestLap,
          delta: potential ? potential - bestLap : 0,
        }
      }).filter(Boolean).sort((a,b) => a.bestLap - b.bestLap)
      setData(rows)
    }).finally(() => setLoading(false))
  }, [sessionKey, drivers])

  if (loading) return <div className="spinner-wrap"><div className="spinner" /></div>
  if (!data.length) return <div className={styles.empty}>No data available.</div>

  const minVal = Math.min(...data.map(d => d.bestLap)) - 0.5

  return (
    <ResponsiveContainer width="100%" height={Math.max(280, data.length * 28)}>
      <BarChart data={data} layout="vertical" margin={{ top:0, right:80, left:40, bottom:0 }}>
        <CartesianGrid stroke="rgba(255,255,255,0.04)" horizontal={false} />
        <XAxis type="number" domain={[minVal, 'auto']} stroke="var(--text-3)" tick={{ fontSize:10, fontFamily:'var(--font-mono)' }} tickFormatter={v => fmt(v)} />
        <YAxis type="category" dataKey="acronym" stroke="var(--text-3)" tick={{ fontSize:11, fontWeight:700 }} width={38} />
        <Tooltip
          contentStyle={{ background:'var(--bg-2)', border:'1px solid var(--border)', borderRadius:8, fontSize:12 }}
          formatter={(v, name) => [fmt(v), name === 'bestLap' ? 'Best Lap' : 'Potential']}
        />
        <Bar dataKey="bestLap" name="bestLap" radius={[0,3,3,0]}>
          {data.map(d => <Cell key={d.acronym} fill={`#${d.colour}`} />)}
        </Bar>
        <Bar dataKey="potential" name="potential" fill="rgba(255,255,255,0.12)" radius={[0,3,3,0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

// ── Stint/tyre analysis ────────────────────────────────────────────────────────
function TyreStintChart({ sessionKey, drivers }) {
  const [stintData, setStintData] = useState([])
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    if (!sessionKey || !drivers.length) return
    setLoading(true)
    getStints(sessionKey).then(stints => {
      const drvMap = {}
      for (const d of drivers) drvMap[d.driver_number] = d
      // Group by driver
      const byDriver = {}
      for (const s of stints) {
        if (!byDriver[s.driver_number]) byDriver[s.driver_number] = []
        byDriver[s.driver_number].push(s)
      }
      const rows = Object.entries(byDriver).map(([dn, stints]) => {
        const drv = drvMap[Number(dn)] ?? {}
        return {
          acronym: drv.name_acronym ?? `#${dn}`,
          colour: drv.team_colour ?? 'aaaaaa',
          stints: stints.sort((a,b) => (a.lap_start??0) - (b.lap_start??0)),
        }
      }).sort((a,b) => a.acronym.localeCompare(b.acronym))
      setStintData(rows)
    }).finally(() => setLoading(false))
  }, [sessionKey, drivers])

  const TYRE_COL = { SOFT:'#e10600', MEDIUM:'#f5a623', HARD:'#d8d8d8', INTERMEDIATE:'#39a847', WET:'#0067ff' }
  const maxLap = Math.max(...stintData.flatMap(d => d.stints.map(s => (s.lap_start??0) + (s.lap_end ? s.lap_end - s.lap_start : 0))), 0)

  if (loading) return <div className="spinner-wrap"><div className="spinner" /></div>
  if (!stintData.length) return <div className={styles.empty}>No stint data available.</div>

  return (
    <div className={styles.stintWrap}>
      {stintData.map(drv => (
        <div key={drv.acronym} className={styles.stintRow}>
          <span className={styles.stintAcro} style={{ color:`#${drv.colour}` }}>{drv.acronym}</span>
          <div className={styles.stintBar}>
            {drv.stints.map((s, i) => {
              const start = (s.lap_start ?? 1) - 1
              const end   = s.lap_end ?? start + 10
              const col   = TYRE_COL[s.compound?.toUpperCase()] ?? '#555'
              const pct   = (end - start) / (maxLap || 60) * 100
              const left  = start / (maxLap || 60) * 100
              return (
                <div key={i} className={styles.stintSegment} title={`${s.compound} · L${s.lap_start}-${s.lap_end}`}
                  style={{ left:`${left}%`, width:`${pct}%`, background:col }}>
                  <span className={styles.stintLabel}>{s.compound?.[0]}</span>
                </div>
              )
            })}
          </div>
        </div>
      ))}
      <div className={styles.stintLapAxis}>
        {[...Array(Math.floor(maxLap/10)+1)].map((_,i) => (
          <span key={i} style={{ left:`${(i*10)/maxLap*100}%` }} className={styles.stintLapMark}>{i*10}</span>
        ))}
      </div>
    </div>
  )
}

// ── Driver head-to-head ────────────────────────────────────────────────────────
function DriverComparison({ sessionKey, drivers }) {
  const [dA, setDA] = useState('')
  const [dB, setDB] = useState('')
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)

  const compare = useCallback(async () => {
    if (!dA || !dB || !sessionKey) return
    setLoading(true)
    try {
      const [lapsA, lapsB] = await Promise.all([
        getLaps(sessionKey, dA),
        getLaps(sessionKey, dB),
      ])
      const maxLap = Math.max(...lapsA.map(l=>l.lap_number??0), ...lapsB.map(l=>l.lap_number??0))
      const drvA = drivers.find(d => d.driver_number === Number(dA))
      const drvB = drivers.find(d => d.driver_number === Number(dB))
      const rows = []
      for (let lap = 1; lap <= maxLap; lap++) {
        const la = lapsA.find(l=>l.lap_number===lap)
        const lb = lapsB.find(l=>l.lap_number===lap)
        if (la?.lap_duration && lb?.lap_duration) {
          rows.push({
            lap,
            [drvA?.name_acronym ?? dA]: la.lap_duration,
            [drvB?.name_acronym ?? dB]: lb.lap_duration,
            delta: la.lap_duration - lb.lap_duration,
          })
        }
      }
      setData(rows)
    } finally { setLoading(false) }
  }, [dA, dB, sessionKey, drivers])

  const drvA = drivers.find(d => d.driver_number === Number(dA))
  const drvB = drivers.find(d => d.driver_number === Number(dB))

  return (
    <div>
      <div className={styles.compareControls}>
        <select className={styles.sel} value={dA} onChange={e=>{setDA(e.target.value);setData([])}}>
          <option value="">Driver A…</option>
          {drivers.map(d => <option key={d.driver_number} value={d.driver_number}>{d.name_acronym} — {d.full_name}</option>)}
        </select>
        <span style={{ color:'var(--text-3)' }}>vs</span>
        <select className={styles.sel} value={dB} onChange={e=>{setDB(e.target.value);setData([])}}>
          <option value="">Driver B…</option>
          {drivers.map(d => <option key={d.driver_number} value={d.driver_number}>{d.name_acronym} — {d.full_name}</option>)}
        </select>
        <button className="btn btn-primary btn-sm" onClick={compare} disabled={!dA||!dB||loading}>
          {loading ? 'Loading…' : 'Compare'}
        </button>
      </div>
      {data.length > 0 && drvA && drvB && (
        <>
          <ResponsiveContainer width="100%" height={260} style={{ marginTop:16 }}>
            <LineChart data={data} margin={{ top:8, right:16, left:0, bottom:0 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="lap" stroke="var(--text-3)" tick={{ fontSize:10 }} />
              <YAxis stroke="var(--text-3)" tick={{ fontSize:10, fontFamily:'var(--font-mono)' }} tickFormatter={v=>fmt(v)} width={80} />
              <Tooltip contentStyle={{ background:'var(--bg-2)', border:'1px solid var(--border)', borderRadius:8, fontSize:12 }}
                formatter={(v,k) => [fmt(v), k]} labelFormatter={l=>`Lap ${l}`} />
              <Legend wrapperStyle={{ fontSize:12 }} />
              <Line type="monotone" dataKey={drvA.name_acronym} stroke={`#${drvA.team_colour}`} dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey={drvB.name_acronym} stroke={`#${drvB.team_colour}`} dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
          {/* Delta chart */}
          <ResponsiveContainer width="100%" height={120} style={{ marginTop:8 }}>
            <BarChart data={data} margin={{ top:0, right:16, left:0, bottom:0 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.04)" horizontal={false} />
              <XAxis dataKey="lap" stroke="var(--text-3)" tick={{ fontSize:9 }} />
              <YAxis stroke="var(--text-3)" tick={{ fontSize:9, fontFamily:'var(--font-mono)' }} tickFormatter={v=>`${v>0?'+':''}${v.toFixed(2)}`} width={52} />
              <ReferenceLine y={0} stroke="rgba(255,255,255,0.2)" />
              <Tooltip contentStyle={{ background:'var(--bg-2)', border:'1px solid var(--border)', borderRadius:8, fontSize:11 }}
                formatter={v => [`${v>0?'+':''}${v.toFixed(3)}s delta`, '']} labelFormatter={l=>`Lap ${l}`} />
              <Bar dataKey="delta" name="Delta" radius={[2,2,0,0]}>
                {data.map((d,i) => <Cell key={i} fill={d.delta > 0 ? `#${drvB.team_colour}` : `#${drvA.team_colour}`} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p style={{ fontSize:'0.72rem', color:'var(--text-3)', marginTop:4 }}>
            Positive = {drvB.name_acronym} faster · Negative = {drvA.name_acronym} faster
          </p>
        </>
      )}
    </div>
  )
}

// ── Main Analytics page ────────────────────────────────────────────────────────
export default function Analytics() {
  const { isPremium } = useAuth()
  const [meetings,   setMeetings]   = useState([])
  const [sessions,   setSessions]   = useState([])
  const [selMeeting, setSelMeeting] = useState('')
  const [selSession, setSelSession] = useState('')
  const [drivers,    setDrivers]    = useState([])
  const [tab,        setTab]        = useState('laps')
  const [loading,    setLoading]    = useState(true)

  useEffect(() => {
    import('../lib/openf1').then(({ getMeetings }) => {
      getMeetings(2026).then(data => {
        const races = data.filter(m => !m.meeting_name?.toLowerCase().includes('testing'))
          .sort((a,b) => new Date(b.date_start) - new Date(a.date_start))
        setMeetings(races)
        if (races[0]) setSelMeeting(String(races[0].meeting_key))
      }).finally(() => setLoading(false))
    })
  }, [])

  useEffect(() => {
    if (!selMeeting) return
    getSessions({ meeting_key: selMeeting }).then(d => {
      const s = d.sort((a,b) => new Date(b.date_start) - new Date(a.date_start))
      setSessions(s)
      const race = s.find(x => x.session_name === 'Race') ?? s[0]
      if (race) setSelSession(String(race.session_key))
    }).catch(() => {})
  }, [selMeeting])

  useEffect(() => {
    if (!selSession) return
    getDrivers(selSession).then(setDrivers).catch(() => {})
  }, [selSession])

  const TABS = [
    { id:'laps',    label:'Lap Times',         icon:TrendingUp },
    { id:'potential',label:'Potential Lap',    icon:Zap },
    { id:'stints',  label:'Tyre Stints',       icon:Layers },
    { id:'compare', label:'Driver Comparison', icon:Users },
  ]

  return (
    <div className="page">
      <div className="page-hd">
        <h1><BarChart2 size={20} /> Analytics</h1>
        <p>Advanced race data, lap charts and driver comparisons</p>
      </div>

      {/* Session pickers */}
      <div className={styles.pickers}>
        <div className={styles.pickerWrap}>
          <label className={styles.pickerLabel}>Grand Prix</label>
          <select className={styles.sel} value={selMeeting} onChange={e => setSelMeeting(e.target.value)} disabled={loading}>
            {meetings.map(m => <option key={m.meeting_key} value={String(m.meeting_key)}>{m.meeting_name}</option>)}
          </select>
        </div>
        <div className={styles.pickerWrap}>
          <label className={styles.pickerLabel}>Session</label>
          <select className={styles.sel} value={selSession} onChange={e => setSelSession(e.target.value)} disabled={!sessions.length}>
            {sessions.map(s => <option key={s.session_key} value={String(s.session_key)}>{s.session_name}</option>)}
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom:20 }}>
        {TABS.map(({ id, label, icon:Icon }) => (
          <button key={id} className={`tab-btn ${tab===id?'active':''}`} onClick={() => setTab(id)}>
            <Icon size={12} style={{ marginRight:5 }} />{label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className={styles.chartCard}>
        {tab === 'laps' && (
          <PremiumGate title="Lap Time Chart">
            {selSession
              ? <LapTimesChart sessionKey={selSession} drivers={drivers} />
              : <div className={styles.empty}>Select a session above</div>
            }
          </PremiumGate>
        )}
        {tab === 'potential' && (
          <PremiumGate title="Potential Lap">
            {selSession
              ? <PotentialLapChart sessionKey={selSession} drivers={drivers} />
              : <div className={styles.empty}>Select a session above</div>
            }
          </PremiumGate>
        )}
        {tab === 'stints' && (
          <PremiumGate title="Tyre Stint Analysis">
            {selSession
              ? <TyreStintChart sessionKey={selSession} drivers={drivers} />
              : <div className={styles.empty}>Select a session above</div>
            }
          </PremiumGate>
        )}
        {tab === 'compare' && (
          <PremiumGate title="Driver Comparison">
            {selSession
              ? <DriverComparison sessionKey={selSession} drivers={drivers} />
              : <div className={styles.empty}>Select a session above</div>
            }
          </PremiumGate>
        )}
      </div>
    </div>
  )
}
