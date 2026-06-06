import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { BarChart2, Zap, Lock, TrendingUp, Users, Layers, ChevronDown, AlertCircle } from 'lucide-react'
import { getSessions, getMeetings, getAllLaps, getDrivers, getStints, fmt } from '../lib/openf1'
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid, BarChart, Bar, Cell } from 'recharts'
import { useAuth } from '../hooks/useAuth'
import { isPast, parseISO, format } from 'date-fns'
import styles from './Analytics.module.css'

function PremiumGate({ children }) {
  const { isPremium } = useAuth()
  if (isPremium) return children
  return (
    <div className={styles.gate}>
      <Lock size={22} style={{ color:'var(--gold)' }} />
      <p>This chart requires <strong>F1Pulse Pro</strong></p>
      <Link to="/premium" className="btn btn-gold btn-sm" style={{marginTop:8}}><Zap size={11} /> Upgrade — £3.99/mo</Link>
    </div>
  )
}

function LapTimesChart({ allLaps, drivers }) {
  if (!allLaps?.length || !drivers?.length) return <div className={styles.empty}>No lap data</div>
  const top = drivers.slice(0, 8)
  const maxLap = Math.max(...allLaps.map(l => l.lap_number ?? 0))
  const rows = []
  for (let lap = 1; lap <= maxLap; lap++) {
    const row = { lap }
    for (const d of top) {
      const l = allLaps.find(x => x.driver_number === d.driver_number && x.lap_number === lap)
      if (l?.lap_duration && l.lap_duration > 0 && l.lap_duration < 300 && !l.is_pit_out_lap)
        row[d.name_acronym] = +l.lap_duration.toFixed(3)
    }
    rows.push(row)
  }
  const filled = rows.filter(r => Object.keys(r).length > 1)
  if (!filled.length) return <div className={styles.empty}>No lap time data for this session</div>
  const allTimes = filled.flatMap(r => top.map(d => r[d.name_acronym]).filter(Boolean))
  const minT = allTimes.length ? Math.min(...allTimes) - 0.5 : 0
  const maxT = allTimes.length ? Math.max(...allTimes) + 2 : 200
  return (
    <ResponsiveContainer width="100%" height={340}>
      <LineChart data={filled} margin={{ top:10, right:20, left:0, bottom:20 }}>
        <CartesianGrid stroke="rgba(255,255,255,0.04)" />
        <XAxis dataKey="lap" stroke="var(--text-3)" tick={{ fontSize:10 }}
          label={{ value:'Lap', position:'insideBottom', offset:-10, fill:'var(--text-3)', fontSize:10 }} />
        <YAxis stroke="var(--text-3)" tick={{ fontSize:10, fontFamily:'var(--font-mono)' }}
          tickFormatter={v => fmt(v)} domain={[minT, maxT]} width={80} />
        <Tooltip contentStyle={{ background:'var(--bg-2)', border:'1px solid var(--border)', borderRadius:8, fontSize:12 }}
          labelFormatter={l => `Lap ${l}`} formatter={(v, n) => [fmt(v), n]} />
        <Legend wrapperStyle={{ fontSize:11, paddingTop:12 }} />
        {top.map(d => <Line key={d.driver_number} type="monotone" dataKey={d.name_acronym}
          stroke={`#${d.team_colour ?? '888888'}`} strokeWidth={1.5} dot={false} connectNulls={false} />)}
      </LineChart>
    </ResponsiveContainer>
  )
}

function PotentialLapChart({ allLaps, drivers }) {
  if (!allLaps?.length || !drivers?.length) return <div className={styles.empty}>No lap data</div>
  const rows = drivers.slice(0, 20).map(driver => {
    const laps = allLaps.filter(l => l.driver_number === driver.driver_number && !l.is_pit_out_lap)
    const valid = laps.filter(l => l.lap_duration && l.lap_duration > 0 && l.lap_duration < 300)
    if (!valid.length) return null
    const bestLap = Math.min(...valid.map(l => l.lap_duration))
    const bestS1  = Math.min(...valid.map(l => l.duration_sector_1).filter(Boolean))
    const bestS2  = Math.min(...valid.map(l => l.duration_sector_2).filter(Boolean))
    const bestS3  = Math.min(...valid.map(l => l.duration_sector_3).filter(Boolean))
    const potential = bestS1 && bestS2 && bestS3 ? bestS1+bestS2+bestS3 : bestLap
    return { acronym:driver.name_acronym, colour:driver.team_colour??'888888',
      bestLap:+bestLap.toFixed(3), potential:+potential.toFixed(3), delta:+(bestLap-potential).toFixed(3) }
  }).filter(Boolean).sort((a,b) => a.bestLap - b.bestLap)
  if (!rows.length) return <div className={styles.empty}>No sector data for this session</div>
  const minVal = Math.min(...rows.map(r => Math.min(r.bestLap, r.potential))) - 0.5
  return (
    <ResponsiveContainer width="100%" height={Math.max(280, rows.length * 30 + 40)}>
      <BarChart data={rows} layout="vertical" margin={{ top:8, right:90, left:44, bottom:8 }}>
        <CartesianGrid stroke="rgba(255,255,255,0.04)" horizontal={false} />
        <XAxis type="number" domain={[minVal,'auto']} stroke="var(--text-3)"
          tick={{ fontSize:10, fontFamily:'var(--font-mono)' }} tickFormatter={v => fmt(v)} />
        <YAxis type="category" dataKey="acronym" stroke="var(--text-3)" tick={{ fontSize:11, fontWeight:700 }} width={40} />
        <Tooltip contentStyle={{ background:'var(--bg-2)', border:'1px solid var(--border)', borderRadius:8, fontSize:12 }}
          formatter={(v, n) => [fmt(v), n]} />
        <Legend wrapperStyle={{ fontSize:11, paddingTop:10 }} />
        <Bar dataKey="bestLap" name="Best Lap" radius={[0,3,3,0]}>
          {rows.map(r => <Cell key={r.acronym} fill={`#${r.colour}`} fillOpacity={0.85} />)}
        </Bar>
        <Bar dataKey="potential" name="Theoretical Best" radius={[0,3,3,0]}>
          {rows.map(r => <Cell key={r.acronym} fill={`#${r.colour}`} fillOpacity={0.35} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

function TyreStintChart({ sessionKey, drivers }) {
  const [stints, setStints] = useState([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    if (!sessionKey || !drivers.length) return
    setLoading(true)
    getStints(sessionKey).then(s => setStints(s??[])).catch(()=>{}).finally(()=>setLoading(false))
  }, [sessionKey, drivers])
  if (loading) return <div className="spinner-wrap"><div className="spinner" /></div>
  const TYRE_COLS = { SOFT:'#e10600', MEDIUM:'#f5a623', HARD:'#d8d8d8', INTERMEDIATE:'#39a847', WET:'#0067ff' }
  const maxLap = Math.max(...stints.map(s => s.lap_end ?? 0), 1)
  const rows = drivers.map(d => ({ driver:d, stints:stints.filter(s=>s.driver_number===d.driver_number).sort((a,b)=>(a.lap_start??0)-(b.lap_start??0)) })).filter(r=>r.stints.length)
  if (!rows.length) return <div className={styles.empty}>No stint data for this session</div>
  return (
    <div>
      {rows.map(({ driver, stints:ds }) => {
        const col = `#${driver.team_colour??'888888'}`
        return (
          <div key={driver.driver_number} style={{display:'flex',alignItems:'center',gap:8,marginBottom:5,minWidth:400}}>
            <span style={{width:36,fontSize:'0.72rem',fontWeight:800,color:col,fontFamily:'var(--font-mono)',textAlign:'right',flexShrink:0}}>{driver.name_acronym}</span>
            <div style={{flex:1,height:20,position:'relative',background:'rgba(255,255,255,0.04)',borderRadius:3}}>
              {ds.map((s,i) => {
                const start = ((s.lap_start??0)-1)/maxLap*100
                const end = ((s.lap_end??maxLap)-1)/maxLap*100
                const w = Math.max(end-start, 0.5)
                const tc = TYRE_COLS[s.compound]??'#888'
                return <div key={i} title={`${s.compound} L${s.lap_start}–${s.lap_end}`} style={{
                  position:'absolute',left:`${start}%`,width:`${w}%`,top:0,bottom:0,
                  background:tc,borderRadius:2,borderRight:'2px solid rgba(0,0,0,0.5)',
                  display:'flex',alignItems:'center',justifyContent:'center',
                  fontSize:'0.58rem',fontWeight:900,color:'#000',overflow:'hidden',
                }}>{w>6?s.compound?.[0]:''}</div>
              })}
            </div>
          </div>
        )
      })}
      <div style={{display:'flex',gap:10,marginTop:10,fontSize:'0.7rem',flexWrap:'wrap'}}>
        {Object.entries(TYRE_COLS).map(([k,v]) => (
          <span key={k} style={{display:'flex',alignItems:'center',gap:4,color:'var(--text-2)'}}>
            <span style={{width:10,height:10,borderRadius:2,background:v,display:'inline-block'}}/>
            {k[0]+k.slice(1).toLowerCase()}
          </span>
        ))}
      </div>
    </div>
  )
}

function DriverComparison({ allLaps, drivers }) {
  const [dA, setDA] = useState('')
  const [dB, setDB] = useState('')
  const [data, setData] = useState([])
  useEffect(() => {
    if (!dA || !dB || !allLaps?.length) return
    const lapsA = allLaps.filter(l => l.driver_number===Number(dA) && !l.is_pit_out_lap)
    const lapsB = allLaps.filter(l => l.driver_number===Number(dB) && !l.is_pit_out_lap)
    const maxLap = Math.max(...lapsA.map(l=>l.lap_number??0), ...lapsB.map(l=>l.lap_number??0))
    const drvA = drivers.find(d=>d.driver_number===Number(dA))
    const drvB = drivers.find(d=>d.driver_number===Number(dB))
    const rows = []
    for (let lap=1; lap<=maxLap; lap++) {
      const la = lapsA.find(l=>l.lap_number===lap), lb = lapsB.find(l=>l.lap_number===lap)
      if (la?.lap_duration && lb?.lap_duration && la.lap_duration<300 && lb.lap_duration<300)
        rows.push({ lap, [drvA?.name_acronym??dA]:+la.lap_duration.toFixed(3), [drvB?.name_acronym??dB]:+lb.lap_duration.toFixed(3), delta:+(la.lap_duration-lb.lap_duration).toFixed(3) })
    }
    setData(rows)
  }, [dA, dB, allLaps, drivers])
  const drvA = drivers.find(d=>d.driver_number===Number(dA))
  const drvB = drivers.find(d=>d.driver_number===Number(dB))
  return (
    <div>
      <div style={{display:'flex',gap:12,marginBottom:16,alignItems:'center',flexWrap:'wrap'}}>
        <select className={styles.sel} value={dA} onChange={e=>{setDA(e.target.value);setData([])}} style={{width:180}}>
          <option value="">Driver A…</option>
          {drivers.map(d=><option key={d.driver_number} value={d.driver_number}>{d.name_acronym} — {d.full_name}</option>)}
        </select>
        <span style={{color:'var(--text-3)',fontWeight:700}}>vs</span>
        <select className={styles.sel} value={dB} onChange={e=>{setDB(e.target.value);setData([])}} style={{width:180}}>
          <option value="">Driver B…</option>
          {drivers.map(d=><option key={d.driver_number} value={d.driver_number}>{d.name_acronym} — {d.full_name}</option>)}
        </select>
      </div>
      {dA && dB && !data.length && <div className={styles.empty}>No shared laps found</div>}
      {data.length > 0 && (
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={data} margin={{top:8,right:20,left:0,bottom:20}}>
            <CartesianGrid stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="lap" stroke="var(--text-3)" tick={{fontSize:10}}
              label={{value:'Lap',position:'insideBottom',offset:-10,fill:'var(--text-3)',fontSize:10}} />
            <YAxis stroke="var(--text-3)" tick={{fontSize:10,fontFamily:'var(--font-mono)'}} tickFormatter={v=>fmt(v)} width={80} />
            <Tooltip contentStyle={{background:'var(--bg-2)',border:'1px solid var(--border)',borderRadius:8,fontSize:12}}
              formatter={(v,n)=>[fmt(v),n]} labelFormatter={l=>`Lap ${l}`} />
            <Legend wrapperStyle={{fontSize:11,paddingTop:10}} />
            {drvA && <Line type="monotone" dataKey={drvA.name_acronym} stroke={`#${drvA.team_colour??'e10600'}`} strokeWidth={2} dot={false} />}
            {drvB && <Line type="monotone" dataKey={drvB.name_acronym} stroke={`#${drvB.team_colour??'3671c6'}`} strokeWidth={2} dot={false} />}
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

export default function Analytics() {
  const { isPremium } = useAuth()
  const [year,        setYear]        = useState(2026)
  const [meetings,    setMeetings]    = useState([])
  const [sessions,    setSessions]    = useState([])
  const [selMeeting,  setSelMeeting]  = useState(null)
  const [selSession,  setSelSession]  = useState(null)
  const [drivers,     setDrivers]     = useState([])
  const [allLaps,     setAllLaps]     = useState([])
  const [tab,         setTab]         = useState('laps')
  const [metaLoading, setMetaLoading] = useState(true)
  const [dataLoading, setDataLoading] = useState(false)
  const [dataError,   setDataError]   = useState(null)

  useEffect(() => {
    setMetaLoading(true); setMeetings([]); setSessions([]); setSelMeeting(null); setSelSession(null)
    Promise.all([ getMeetings(year), getSessions({ year }) ]).then(([mtgs, sess]) => {
      const races = (mtgs??[]).filter(m=>!m.meeting_name?.toLowerCase().includes('testing')&&isPast(parseISO(m.date_start)))
        .sort((a,b)=>new Date(b.date_start)-new Date(a.date_start))
      setMeetings(races)
      window._f1AllSessions = sess ?? []
      if (races[0]) {
        setSelMeeting(races[0])
        const mSess = (sess??[]).filter(s=>s.meeting_key===races[0].meeting_key)
          .sort((a,b)=>new Date(a.date_start)-new Date(b.date_start))
        setSessions(mSess)
        const best = mSess.find(s=>s.session_name==='Race')??mSess.find(s=>s.session_name==='Qualifying')??mSess[mSess.length-1]
        if (best) setSelSession(best)
      }
    }).finally(()=>setMetaLoading(false))
  }, [year])

  const onMeetingChange = useCallback((mk) => {
    const m = meetings.find(x=>x.meeting_key===Number(mk)); if(!m) return
    setSelMeeting(m); setAllLaps([]); setDrivers([]); setDataError(null)
    const mSess = (window._f1AllSessions??[]).filter(s=>s.meeting_key===m.meeting_key)
      .sort((a,b)=>new Date(a.date_start)-new Date(b.date_start))
    setSessions(mSess)
    const best = mSess.find(s=>s.session_name==='Race')??mSess.find(s=>s.session_name==='Qualifying')??mSess[mSess.length-1]
    setSelSession(best??null)
  }, [meetings])

  const onSessionChange = useCallback((sk) => {
    const s = sessions.find(x=>x.session_key===Number(sk))
    setSelSession(s??null); setAllLaps([]); setDrivers([]); setDataError(null)
  }, [sessions])

  useEffect(() => {
    if (!selSession?.session_key) return
    setDataLoading(true); setAllLaps([]); setDrivers([]); setDataError(null)
    Promise.all([
      getDrivers(selSession.session_key).catch(()=>[]),
      getAllLaps(selSession.session_key).catch(()=>[]),
    ]).then(([drvs, laps]) => {
      if (!laps?.length) setDataError('No lap data available for this session')
      setDrivers(drvs??[]); setAllLaps(laps??[])
    }).catch(()=>setDataError('Failed to load session data')).finally(()=>setDataLoading(false))
  }, [selSession?.session_key])

  const TABS = [
    { id:'laps',     label:'Lap Times',         icon:TrendingUp, desc:'Lap-by-lap pace for top 8 drivers. Spikes = pit stops or incidents.' },
    { id:'potential',label:'Potential Lap',     icon:Zap,        desc:'Best S1+S2+S3 vs actual best lap. Gap shows time left on the table.' },
    { id:'stints',   label:'Tyre Stints',       icon:Layers,     desc:'Each driver\'s tyre strategy — bar length = stint, colour = compound.' },
    { id:'compare',  label:'Driver Comparison', icon:Users,      desc:'Head-to-head lap times. +ve delta = Driver A slower, −ve = Driver B slower.' },
  ]

  return (
    <div className="page">
      <div className="page-hd"><h1><BarChart2 size={20}/> Analytics</h1><p>Advanced race data, lap charts and driver comparisons</p></div>

      <div className={styles.selectorCard}>
        <div className={styles.selectorRow}>
          <div className={styles.selectorGroup}>
            <label className={styles.selectorLabel}>Year</label>
            <div className={styles.selectWrap}>
              <select className={styles.sel} value={year} onChange={e=>setYear(Number(e.target.value))}>
                {[2026,2025,2024,2023].map(y=><option key={y} value={y}>{y}</option>)}
              </select><ChevronDown size={13} className={styles.selectIcon}/>
            </div>
          </div>
          <div className={styles.selectorGroup} style={{flex:2}}>
            <label className={styles.selectorLabel}>Grand Prix</label>
            <div className={styles.selectWrap}>
              <select className={styles.sel} value={selMeeting?.meeting_key??''} onChange={e=>onMeetingChange(e.target.value)} disabled={metaLoading}>
                {metaLoading?<option>Loading…</option>:meetings.map(m=><option key={m.meeting_key} value={m.meeting_key}>{m.meeting_name} · {format(parseISO(m.date_start),'d MMM yyyy')}</option>)}
              </select><ChevronDown size={13} className={styles.selectIcon}/>
            </div>
          </div>
          <div className={styles.selectorGroup}>
            <label className={styles.selectorLabel}>Session</label>
            <div className={styles.selectWrap}>
              <select className={styles.sel} value={selSession?.session_key??''} onChange={e=>onSessionChange(e.target.value)} disabled={!sessions.length}>
                {sessions.map(s=><option key={s.session_key} value={s.session_key}>{s.session_name}</option>)}
              </select><ChevronDown size={13} className={styles.selectIcon}/>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.tabs}>
        {TABS.map(({id,label,icon:Icon})=>(
          <button key={id} className={`${styles.tab} ${tab===id?styles.tabActive:''}`} onClick={()=>setTab(id)}>
            <Icon size={11}/> {label}
          </button>
        ))}
      </div>

      <div className={styles.chartCard}>
        <div className={styles.chartDesc}><strong>{TABS.find(t=>t.id===tab)?.label}</strong> — {TABS.find(t=>t.id===tab)?.desc}</div>
        {dataLoading && <div className={styles.loadingState}><div className="spinner"/><p>Loading {selSession?.session_name} data…</p></div>}
        {!dataLoading && dataError && <div className={styles.errorState}><AlertCircle size={16}/> {dataError}</div>}
        {!dataLoading && !dataError && allLaps.length > 0 && (
          <PremiumGate>
            {tab==='laps'     && <LapTimesChart allLaps={allLaps} drivers={drivers}/>}
            {tab==='potential'&& <PotentialLapChart allLaps={allLaps} drivers={drivers}/>}
            {tab==='stints'   && <TyreStintChart sessionKey={selSession?.session_key} drivers={drivers} allLaps={allLaps}/>}
            {tab==='compare'  && <DriverComparison allLaps={allLaps} drivers={drivers}/>}
          </PremiumGate>
        )}
        {!dataLoading && !dataError && !allLaps.length && !metaLoading && <div className={styles.emptyState}>Select a session above to load analytics data</div>}
      </div>
    </div>
  )
}
