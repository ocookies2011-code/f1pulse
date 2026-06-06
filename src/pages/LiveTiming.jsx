import { useEffect, useState, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Activity, RefreshCw, CloudRain, Thermometer, Zap, AlertTriangle, Radio } from 'lucide-react'
import {
  buildLiveStandings, getLatestSession, getWeather, getRaceControl,
  getBestStandingsSession, getChampionshipDrivers, getChampionshipTeams,
  getDrivers, getTeamRadio, fmt, fmtGap
} from '../lib/openf1'
import { useAuth } from '../hooks/useAuth'
import styles from './LiveTiming.module.css'

const TYRE_COLOURS = { SOFT:'#e10600', MEDIUM:'#f5a623', HARD:'#d8d8d8', INTERMEDIATE:'#39a847', WET:'#0067ff' }
const TYRE_LABELS  = { SOFT:'S', MEDIUM:'M', HARD:'H', INTERMEDIATE:'I', WET:'W' }

// ── Circuit SVG paths keyed by meeting_name substring ─────────────────────────
const CIRCUIT_PATHS = {
  'Monaco':       { path:'M 480 80 L 520 75 L 600 90 L 650 120 L 660 160 L 640 200 L 600 220 L 560 230 L 530 250 L 520 290 L 530 330 L 550 360 L 560 400 L 540 430 L 500 450 L 450 460 L 400 450 L 360 430 L 340 400 L 330 360 L 340 320 L 360 290 L 380 260 L 390 230 L 380 200 L 360 180 L 340 160 L 330 130 L 340 100 L 370 80 L 420 72 L 480 80 Z', viewBox:'280 60 420 420' },
  'Albert Park':  { path:'M 500 100 L 650 95 L 720 120 L 750 160 L 740 200 L 700 230 L 660 240 L 640 270 L 650 310 L 680 340 L 700 380 L 680 420 L 640 440 L 580 450 L 520 445 L 470 430 L 430 400 L 380 390 L 340 410 L 310 440 L 280 430 L 260 400 L 270 360 L 300 330 L 330 300 L 320 260 L 290 230 L 280 190 L 300 150 L 340 120 L 400 100 L 500 100 Z', viewBox:'230 80 550 390' },
  'Suzuka':       { path:'M 500 120 L 600 110 L 680 140 L 720 190 L 710 250 L 670 300 L 640 350 L 660 400 L 690 440 L 670 480 L 620 490 L 560 470 L 520 440 L 480 400 L 450 360 L 420 380 L 400 420 L 370 440 L 330 430 L 300 400 L 290 350 L 310 300 L 350 270 L 390 240 L 400 200 L 380 160 L 400 130 L 440 115 L 500 120 Z', viewBox:'260 100 480 410' },
  'Monza':        { path:'M 350 150 L 550 140 L 650 160 L 700 200 L 720 260 L 700 320 L 650 360 L 580 380 L 520 370 L 480 340 L 460 380 L 470 430 L 440 460 L 400 465 L 360 450 L 330 420 L 320 380 L 340 340 L 380 310 L 390 270 L 360 240 L 310 230 L 280 200 L 290 160 L 320 145 L 350 150 Z', viewBox:'250 130 500 360' },
  'Silverstone':  { path:'M 300 150 L 450 120 L 550 130 L 640 160 L 700 210 L 720 270 L 700 330 L 650 370 L 680 420 L 700 470 L 680 510 L 620 530 L 540 520 L 480 490 L 440 450 L 400 430 L 340 440 L 290 430 L 250 400 L 230 360 L 240 310 L 270 270 L 260 230 L 240 200 L 250 160 L 280 140 L 300 150 Z', viewBox:'210 110 530 440' },
  'Sakhir':       { path:'M 300 200 L 500 185 L 600 200 L 670 240 L 680 300 L 650 350 L 600 380 L 560 400 L 540 440 L 550 480 L 520 510 L 470 515 L 420 500 L 380 470 L 360 430 L 340 390 L 300 370 L 260 350 L 240 310 L 255 265 L 280 230 L 300 200 Z', viewBox:'210 170 490 370' },
  'Jeddah':       { path:'M 400 100 L 550 90 L 650 110 L 720 150 L 740 210 L 720 270 L 680 310 L 650 360 L 660 410 L 680 460 L 660 500 L 620 520 L 570 510 L 530 480 L 500 440 L 470 400 L 430 380 L 380 390 L 330 380 L 290 350 L 270 310 L 280 270 L 310 240 L 330 200 L 320 160 L 340 130 L 370 110 L 400 100 Z', viewBox:'250 80 520 460' },
  'Miami':        { path:'M 350 180 L 500 160 L 600 170 L 670 200 L 700 250 L 690 310 L 650 350 L 600 370 L 560 400 L 550 450 L 570 490 L 550 520 L 500 530 L 440 515 L 400 480 L 370 440 L 340 400 L 300 390 L 260 370 L 240 330 L 250 290 L 280 260 L 300 230 L 290 200 L 310 175 L 350 180 Z', viewBox:'220 150 510 400' },
  'Spa':          { path:'M 300 200 L 450 180 L 550 160 L 650 180 L 720 220 L 740 280 L 720 340 L 680 380 L 650 420 L 660 460 L 640 500 L 590 510 L 540 490 L 500 450 L 460 410 L 410 420 L 360 430 L 310 410 L 270 370 L 260 320 L 280 270 L 300 230 L 300 200 Z', viewBox:'240 150 520 380' },
  'Zandvoort':    { path:'M 400 150 L 520 140 L 600 165 L 640 210 L 630 270 L 600 320 L 570 370 L 580 420 L 560 460 L 510 475 L 460 460 L 420 430 L 390 390 L 360 360 L 330 330 L 310 290 L 320 250 L 350 210 L 380 175 L 400 150 Z', viewBox:'290 130 380 360' },
  'Imola':        { path:'M 350 160 L 480 140 L 570 160 L 630 200 L 650 260 L 630 320 L 590 360 L 560 410 L 570 460 L 550 500 L 500 510 L 450 495 L 410 460 L 390 420 L 360 400 L 320 390 L 280 360 L 270 310 L 290 265 L 320 230 L 330 195 L 350 160 Z', viewBox:'250 130 420 400' },
  'Budapest':     { path:'M 350 170 L 480 150 L 580 165 L 650 205 L 670 265 L 650 325 L 610 365 L 570 395 L 550 440 L 560 490 L 530 520 L 470 525 L 410 505 L 370 465 L 350 420 L 320 400 L 280 380 L 260 340 L 275 295 L 310 260 L 330 220 L 350 170 Z', viewBox:'240 140 450 400' },
  'Baku':         { path:'M 350 150 L 520 130 L 630 145 L 700 185 L 720 245 L 700 305 L 660 340 L 620 365 L 600 410 L 620 460 L 600 500 L 545 510 L 490 495 L 450 460 L 420 415 L 380 405 L 330 415 L 285 395 L 265 350 L 280 300 L 310 265 L 320 220 L 305 185 L 320 155 L 350 150 Z', viewBox:'245 120 500 410' },
  'Singapore':    { path:'M 380 160 L 520 140 L 620 160 L 690 200 L 710 260 L 690 320 L 650 355 L 610 385 L 590 430 L 605 480 L 580 515 L 525 520 L 465 500 L 425 460 L 395 415 L 355 405 L 305 390 L 270 355 L 268 305 L 295 265 L 320 230 L 310 190 L 340 163 L 380 160 Z', viewBox:'248 130 490 410' },
  'Austin':       { path:'M 340 160 L 490 140 L 590 160 L 665 200 L 690 260 L 668 320 L 625 360 L 585 390 L 565 440 L 580 490 L 555 520 L 495 525 L 430 505 L 385 460 L 355 415 L 315 405 L 268 388 L 250 345 L 268 300 L 300 265 L 312 222 L 298 182 L 318 157 L 340 160 Z', viewBox:'232 130 490 415' },
  'Mexico City':  { path:'M 370 165 L 510 142 L 615 160 L 685 205 L 702 268 L 678 330 L 632 368 L 592 398 L 574 448 L 590 498 L 562 528 L 500 530 L 434 508 L 388 462 L 358 416 L 316 408 L 268 390 L 250 348 L 266 302 L 298 268 L 310 224 L 296 184 L 318 160 L 370 165 Z', viewBox:'232 132 500 418' },
  'São Paulo':    { path:'M 345 155 L 495 135 L 600 155 L 672 198 L 698 262 L 674 325 L 628 364 L 588 395 L 568 445 L 584 496 L 558 526 L 496 528 L 430 506 L 383 460 L 352 413 L 310 405 L 262 386 L 244 343 L 262 298 L 294 264 L 308 220 L 294 180 L 316 155 L 345 155 Z', viewBox:'226 125 502 422' },
  'Las Vegas':    { path:'M 340 170 L 520 150 L 640 170 L 710 215 L 728 278 L 705 340 L 660 377 L 618 407 L 598 458 L 613 509 L 586 539 L 522 541 L 455 519 L 408 473 L 376 426 L 333 418 L 284 400 L 266 356 L 283 310 L 315 275 L 328 231 L 313 190 L 334 165 L 340 170 Z', viewBox:'248 140 510 420' },
  'Lusail':       { path:'M 360 155 L 510 135 L 616 153 L 688 197 L 712 262 L 688 325 L 641 364 L 600 395 L 580 446 L 596 497 L 569 527 L 507 530 L 440 508 L 393 462 L 362 415 L 320 407 L 272 389 L 254 346 L 272 300 L 304 266 L 317 222 L 303 182 L 325 157 L 360 155 Z', viewBox:'236 125 506 424' },
  'Yas Marina':   { path:'M 360 160 L 510 140 L 615 160 L 686 204 L 710 268 L 686 330 L 640 370 L 598 400 L 578 452 L 594 503 L 567 533 L 504 535 L 437 513 L 390 467 L 360 420 L 318 412 L 270 393 L 252 350 L 270 304 L 302 270 L 315 226 L 300 186 L 322 161 L 360 160 Z', viewBox:'234 130 510 424' },
  'Barcelona':    { path:'M 350 160 L 500 140 L 605 160 L 677 204 L 700 268 L 676 330 L 630 370 L 588 400 L 568 452 L 584 503 L 557 533 L 494 535 L 427 513 L 380 467 L 350 420 L 308 412 L 260 393 L 242 350 L 260 304 L 292 270 L 305 226 L 290 186 L 312 161 L 350 160 Z', viewBox:'224 130 510 424' },
}

function getCircuitForSession(session) {
  if (!session?.meeting_name) return null
  const name = session.meeting_name.toLowerCase()
  return Object.entries(CIRCUIT_PATHS).find(([k]) =>
    name.includes(k.toLowerCase()) || k.toLowerCase().includes(name.split(' ')[0])
  )?.[1] ?? null
}

function TyreChip({ compound, age }) {
  if (!compound) return <span className={styles.dash}>—</span>
  const k = compound.toUpperCase()
  const col = TYRE_COLOURS[k] ?? '#888'
  return (
    <span className={styles.tyreChip}>
      <span className={styles.tyreDot} style={{ background: col }} />
      <span style={{ color: col, fontWeight: 800 }}>{TYRE_LABELS[k] ?? compound[0]}</span>
      {age != null && <span className={styles.tyreAge}>{age}</span>}
    </span>
  )
}

function RCBadge({ msg }) {
  const f = msg.flag
  if (f === 'RED')    return <span className={`${styles.flagBadge} ${styles.flagRed}`}>🔴 RED FLAG</span>
  if (f === 'SAFETY CAR' || msg.category === 'SafetyCar') return <span className={`${styles.flagBadge} ${styles.flagSc}`}>🚗 SAFETY CAR</span>
  if (f === 'VIRTUAL SAFETY CAR') return <span className={`${styles.flagBadge} ${styles.flagSc}`}>VSC</span>
  if (f === 'YELLOW' || f === 'DOUBLE YELLOW') return <span className={`${styles.flagBadge} ${styles.flagYellow}`}>⚠ YELLOW</span>
  if (f === 'GREEN')     return <span className={`${styles.flagBadge} ${styles.flagGreen}`}>🟢 CLEAR</span>
  if (f === 'CHEQUERED') return <span className={`${styles.flagBadge} ${styles.flagGreen}`}>🏁 CHEQUERED</span>
  return null
}

// ── Right panel: track map + car positions + team radio tabs ──────────────────
function RightPanel({ session, standings, rc, isPremium }) {
  const [tab, setTab] = useState('map')
  const [positions, setPositions] = useState({})
  const [radio, setRadio] = useState([])
  const [trackPts, setTrackPts] = useState([]) // accumulated for track outline
  const pollRef = useRef(null)
  const circuit = getCircuitForSession(session)

  // Fetch live car positions
  const fetchPos = useCallback(async () => {
    if (!session?.session_key) return
    try {
      const supaUrl  = import.meta.env.VITE_SUPABASE_URL
      const supaAnon = import.meta.env.VITE_SUPABASE_ANON_KEY
      const tokenRes = await fetch(`${supaUrl}/functions/v1/openf1-token`, { method:'POST', headers:{ Authorization:`Bearer ${supaAnon}` } })
      let headers = {}
      if (tokenRes.ok) { const { access_token } = await tokenRes.json(); if (access_token) headers.Authorization = `Bearer ${access_token}` }
      const now  = new Date(); const from = new Date(now - 8000).toISOString()
      const res  = await fetch(`https://api.openf1.org/v1/location?session_key=${session.session_key}&date>${from}`, { headers })
      if (!res.ok) return
      const raw  = await res.json()
      if (!raw?.length) return
      const latest = {}
      for (const p of raw) if (!latest[p.driver_number] || p.date > latest[p.driver_number].date) latest[p.driver_number] = p
      setPositions(latest)
      // Accumulate track points (limited set) for outline when no circuit path
      setTrackPts(prev => {
        const all = [...prev, ...raw.filter(p=>p.x&&p.y)]
        return all.slice(-2000)
      })
    } catch {}
  }, [session])

  const fetchRadio = useCallback(async () => {
    if (!session?.session_key || !isPremium) return
    try {
      const r = await getTeamRadio(session.session_key)
      setRadio(r?.slice(-20).reverse() ?? [])
    } catch {}
  }, [session, isPremium])

  useEffect(() => {
    if (!session?.session_key) return
    fetchPos()
    if (isPremium) fetchRadio()
    pollRef.current = setInterval(() => { fetchPos(); if(isPremium) fetchRadio() }, 5000)
    return () => clearInterval(pollRef.current)
  }, [session?.session_key, fetchPos, fetchRadio, isPremium])

  const drvMap = {}
  for (const d of standings) drvMap[d.driver_number] = d

  // Build SVG coordinate mapper for live positions
  const pts = Object.values(positions).filter(p => p.x && p.y)
  const useCircuit = !!circuit
  let toSvg = null
  let svgViewBox = '0 0 300 260'

  if (!useCircuit && pts.length > 2) {
    const xs = pts.map(p=>p.x), ys = pts.map(p=>p.y)
    const xMin = Math.min(...xs), xMax = Math.max(...xs)
    const yMin = Math.min(...ys), yMax = Math.max(...ys)
    toSvg = (p) => ({
      x: 20 + ((p.x - xMin) / (xMax - xMin || 1)) * 260,
      y: 20 + (1 - (p.y - yMin) / (yMax - yMin || 1)) * 220,
    })
    svgViewBox = '0 0 300 260'
  } else if (useCircuit) {
    svgViewBox = circuit.viewBox
    // Parse viewBox to map coordinates
    const [vx, vy, vw, vh] = circuit.viewBox.split(' ').map(Number)
    // OpenF1 x/y are in metres from track datum, need to map to circuit SVG space
    // Since we don't have the exact datum, we map live positions to fill the circuit's viewBox
    if (pts.length > 2) {
      const xs = pts.map(p=>p.x), ys = pts.map(p=>p.y)
      const xMin = Math.min(...xs), xMax = Math.max(...xs)
      const yMin = Math.min(...ys), yMax = Math.max(...ys)
      toSvg = (p) => ({
        x: vx + ((p.x - xMin) / (xMax - xMin || 1)) * vw,
        y: vy + (1 - (p.y - yMin) / (yMax - yMin || 1)) * vh,
      })
    }
  }

  // Build track outline path from accumulated raw points (when no circuit SVG)
  let trackOutline = null
  if (!useCircuit && trackPts.length > 50) {
    const xs = trackPts.map(p=>p.x), ys = trackPts.map(p=>p.y)
    const xMin = Math.min(...xs), xMax = Math.max(...xs)
    const yMin = Math.min(...ys), yMax = Math.max(...ys)
    const mapPt = (p) => ({
      x: 20 + ((p.x - xMin) / (xMax - xMin || 1)) * 260,
      y: 20 + (1 - (p.y - yMin) / (yMax - yMin || 1)) * 220,
    })
    const pts2 = trackPts.map(mapPt)
    trackOutline = 'M ' + pts2.map(p=>`${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L ')
  }

  return (
    <div className={styles.rightPanel}>
      {/* Tab bar */}
      <div className={styles.rpTabs}>
        <button className={`${styles.rpTab} ${tab==='map'?styles.rpTabActive:''}`} onClick={()=>setTab('map')}>
          Track Map
        </button>
        <button className={`${styles.rpTab} ${tab==='radio'?styles.rpTabActive:''}`} onClick={()=>setTab('radio')}>
          <Radio size={10} /> Team Radio {!isPremium && <Zap size={9} style={{color:'var(--gold)',marginLeft:2}} />}
        </button>
        <button className={`${styles.rpTab} ${tab==='rc'?styles.rpTabActive:''}`} onClick={()=>setTab('rc')}>
          Race Control
        </button>
      </div>

      {tab === 'map' && (
        <div className={styles.rpMapWrap}>
          <svg viewBox={svgViewBox} xmlns="http://www.w3.org/2000/svg" className={styles.rpMapSvg}>
            {/* Circuit outline — official SVG path */}
            {useCircuit && (
              <>
                {/* Thick grey base */}
                <path d={circuit.path} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" />
                {/* White centre line */}
                <path d={circuit.path} fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
              </>
            )}
            {/* Accumulated track from live data (fallback) */}
            {!useCircuit && trackOutline && (
              <>
                <path d={trackOutline} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
                <path d={trackOutline} fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
              </>
            )}
            {!useCircuit && !trackOutline && (
              <text x="50%" y="50%" textAnchor="middle" fill="rgba(255,255,255,0.2)" fontSize="11" fontFamily="monospace" dominantBaseline="middle">
                Waiting for position data…
              </text>
            )}
            {/* Live car dots */}
            {toSvg && Object.entries(positions).map(([dn, pos]) => {
              const drv = drvMap[Number(dn)]
              if (!drv || !pos.x) return null
              const { x, y } = toSvg(pos)
              const col = `#${drv.team_colour ?? 'aaaaaa'}`
              return (
                <g key={dn}>
                  <circle cx={x} cy={y} r={7} fill={col} stroke="rgba(0,0,0,0.6)" strokeWidth={1.5} />
                  <text x={x} y={y+0.5} textAnchor="middle" dominantBaseline="middle" fill="#fff" fontSize="6" fontWeight="900" fontFamily="monospace">{drv.name_acronym}</text>
                </g>
              )
            })}
          </svg>
          <Link to="/trackmap" className={styles.rpMapLink}>Open full track map →</Link>
        </div>
      )}

      {tab === 'radio' && (
        <div className={styles.rpRadio}>
          {!isPremium ? (
            <div className={styles.rpGate}>
              <Zap size={20} style={{color:'var(--gold)',marginBottom:8}} />
              <p>Team radio playback is a Pro feature</p>
              <Link to="/premium" className="btn btn-gold btn-sm" style={{marginTop:8}}>Upgrade to Pro</Link>
            </div>
          ) : radio.length === 0 ? (
            <div className={styles.rpEmpty}>No team radio messages yet</div>
          ) : radio.map((r, i) => {
            const drv = standings.find(d => d.driver_number === r.driver_number)
            const col = `#${drv?.team_colour ?? '555555'}`
            return (
              <div key={i} className={styles.radioMsg}>
                <span className={styles.radioDriver} style={{color:col}}>{drv?.name_acronym ?? `#${r.driver_number}`}</span>
                {r.recording_url
                  ? <audio src={r.recording_url} controls className={styles.radioAudio} />
                  : <span className={styles.radioNoAudio}>No audio</span>
                }
                <span className={styles.radioTime}>{r.date ? new Date(r.date).toLocaleTimeString('en-GB',{hour12:false}) : ''}</span>
              </div>
            )
          })}
        </div>
      )}

      {tab === 'rc' && (
        <div className={styles.rpRc}>
          {rc.length === 0
            ? <div className={styles.rpEmpty}>No race control messages</div>
            : [...rc].reverse().slice(0, 30).map((m, i) => (
                <div key={i} className={`${styles.rcLine} ${
                  m.flag==='RED'?styles.rcRed
                  :m.flag?.includes('YELLOW')?styles.rcYellow
                  :m.flag==='GREEN'||m.flag==='CHEQUERED'?styles.rcGreen
                  :m.category==='SafetyCar'?styles.rcOrange:''
                }`}>
                  <span className={styles.rcTime}>{m.date ? new Date(m.date).toLocaleTimeString('en-GB',{hour12:false,hour:'2-digit',minute:'2-digit'}) : ''}</span>
                  <span className={styles.rcMsg}>{m.message}</span>
                </div>
              ))
          }
        </div>
      )}
    </div>
  )
}

// ── Mini sector segments ───────────────────────────────────────────────────────
function Segs({ segments, styles: s }) {
  if (!segments?.some(sg => sg?.length > 0)) return <span className={s.dash}>—</span>
  return (
    <div className={s.segRow}>
      {[0,1,2].map(si => (
        <div key={si} className={s.segGroup}>
          {(segments[si] ?? []).slice(0,8).map((v, j) => {
            const sc = v===2051?s.segPurple:v===2049?s.segGreen:v===2064?s.segPit:s.segYellow
            return <span key={j} className={`${s.seg} ${sc}`} />
          })}
        </div>
      ))}
    </div>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function LiveTiming() {
  const { isPremium } = useAuth()
  const [standings,   setStandings]   = useState([])
  const [session,     setSession]     = useState(null)
  const [weather,     setWeather]     = useState(null)
  const [rc,          setRc]          = useState([])
  const [loading,     setLoading]     = useState(true)
  const [lastUpdate,  setLastUpdate]  = useState(null)
  const [error,       setError]       = useState(null)
  const [compact,     setCompact]     = useState(false)
  const [drvChamp,    setDrvChamp]    = useState([])
  const [teamChamp,   setTeamChamp]   = useState([])
  const [champLoaded, setChampLoaded] = useState(false)
  const intervalRef = useRef(null)

  const fetchLive = useCallback(async () => {
    try {
      const sess = await getLatestSession()
      const wthr = await getWeather('latest')
      const rcData = await getRaceControl('latest').catch(() => [])
      const standing = await buildLiveStandings('latest')
      setSession(sess); setWeather(wthr); setRc(rcData || []); setStandings(standing)
      setLastUpdate(new Date()); setError(null)
    } catch { setError('Could not load live data.') }
    finally { setLoading(false) }
  }, [])

  const fetchChamp = useCallback(async () => {
    try {
      const sess = await getBestStandingsSession(2026)
      if (!sess) return
      const driverList = await getDrivers(sess.session_key)
      const drvMap = {}; for (const d of driverList) drvMap[d.driver_number] = d
      const cd = await getChampionshipDrivers(sess.session_key).catch(()=>[])
      const ct = await getChampionshipTeams(sess.session_key).catch(()=>[])
      if (cd?.length) setDrvChamp(cd.sort((a,b)=>a.position_current-b.position_current).slice(0,10).map(c=>({
        pos:c.position_current, name:drvMap[c.driver_number]?.full_name??`#${c.driver_number}`,
        acronym:drvMap[c.driver_number]?.name_acronym??'???', colour:drvMap[c.driver_number]?.team_colour??'555555', pts:c.points_current??0
      })))
      if (ct?.length) setTeamChamp(ct.sort((a,b)=>a.position_current-b.position_current).slice(0,11).map(c=>{
        const td = driverList.find(d=>d.team_name===c.team_name)
        return { pos:c.position_current, team:c.team_name, colour:td?.team_colour??'555555', pts:c.points_current??0 }
      }))
      setChampLoaded(true)
    } catch {}
  }, [])

  useEffect(() => {
    fetchLive(); fetchChamp()
    const ms = isPremium ? 4000 : 10000
    intervalRef.current = setInterval(fetchLive, ms)
    return () => clearInterval(intervalRef.current)
  }, [isPremium, fetchLive, fetchChamp])

  const rcReversed = [...rc].reverse()
  const latestFlag = rcReversed.find(m => ['RED','YELLOW','DOUBLE YELLOW','GREEN','SAFETY CAR','VIRTUAL SAFETY CAR','CHEQUERED'].includes(m.flag) || m.category==='SafetyCar')

  return (
    <div className={styles.root}>

      {/* ── Top bar: session info + weather ── */}
      <div className={styles.topBar}>
        <div className={styles.topBarInner}>
          <div className={styles.topLeft}>
            {session ? (
              <>
                <span className={styles.sessionDot} />
                <span className={styles.sessionName}>{session.meeting_name}</span>
                <span className={styles.sessionType}>{session.session_name}</span>
                {weather && (
                  <span className={styles.weatherInline}>
                    <Thermometer size={11} /> {weather.track_temperature}°
                    <span className={styles.wLabel}>TRC</span>
                    <Thermometer size={11} /> {weather.air_temperature}°
                    <span className={styles.wLabel}>AIR</span>
                    {weather.humidity}%
                    <span className={styles.wLabel}>HUM</span>
                    {weather.wind_speed > 0 && <><span>{weather.wind_speed}</span><span className={styles.wLabel}>M/S</span></>}
                    {weather.rainfall > 0 && <span className={styles.wetBadge}><CloudRain size={10} /> WET</span>}
                  </span>
                )}
              </>
            ) : <span className={styles.noSession}>No active session</span>}
          </div>
          <div className={styles.topRight}>
            {latestFlag && <RCBadge msg={latestFlag} />}
            {!isPremium && <Link to="/premium" className={styles.proBadge}><Zap size={10} /> Pro</Link>}
            <span className={styles.updateInfo}>
              <RefreshCw size={10} className={loading ? styles.spinning : ''} />
              {lastUpdate?.toLocaleTimeString('en-GB',{hour12:false})}
            </span>
            <button className="btn btn-ghost btn-sm" style={{padding:'3px 8px'}} onClick={fetchLive}>
              <RefreshCw size={11} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Toolbar ── */}
      <div className={styles.toolBar}>
        <div className={styles.toolBarInner}>
          <div className={styles.toggleGroup}>
            <button className={`${styles.toggle} ${compact?styles.toggleOn:''}`} onClick={()=>setCompact(v=>!v)}>Compact</button>
          </div>
          <span className={styles.refreshNote}>{isPremium ? '⚡ ~4s refresh (Pro)' : '~10s refresh · Upgrade for 4s'}</span>
        </div>
      </div>

      {/* ── Main area: timing table LEFT + right panel RIGHT ── */}
      <div className={styles.mainRow}>

        {/* Timing table */}
        <div className={styles.tableCol}>
          {loading ? (
            <div className="spinner-wrap"><div className="spinner" /></div>
          ) : error ? (
            <div className={styles.emptyState}><AlertTriangle size={28} style={{color:'var(--text-3)',marginBottom:8}} /><p>{error}</p></div>
          ) : standings.length === 0 ? (
            <div className={styles.emptyState}><Activity size={28} style={{color:'var(--text-3)',marginBottom:8}} /><p>No active session. Data appears automatically.</p></div>
          ) : (
            <div className={styles.tableScroll}>
              <table className={`${styles.table} ${compact?styles.compact:''}`}>
                <thead>
                  <tr>
                    <th className={styles.thPit}>PIT</th>
                    <th className={styles.thPos}>#</th>
                    <th className={styles.thDriver}>DRIVER</th>
                    <th className={styles.thNum}>INTERVAL</th>
                    <th className={styles.thTyre}>TYRE</th>
                    <th className={styles.thNum}>BEST LAP</th>
                    <th className={styles.thNum}>LEADER</th>
                    <th className={styles.thNum}>LAST LAP</th>
                    <th className={styles.thMini}>MINI SECTORS</th>
                    <th className={styles.thSec}>LAST SECTORS</th>
                    <th className={styles.thSec}>BEST SECTORS</th>
                    <th className={styles.thLap}>LAP</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((d, i) => {
                    const isP1  = i === 0
                    const isPit = d.is_pit_out_lap
                    const isBestOverall = d.is_overall_best
                    return (
                      <tr key={d.driver_number} className={`${styles.row} ${isPit?styles.rowPit:''} ${isP1?styles.rowP1:''}`}>

                        <td className={styles.tdPit}>
                          {d.pit_stops > 0 && <span className={styles.pitTag}>PIT</span>}
                        </td>

                        <td className={styles.tdPos}>
                          <span className={styles.posNum} style={{color:`#${d.team_colour}`,borderColor:`#${d.team_colour}`}}>
                            {d.position}
                          </span>
                        </td>

                        <td className={styles.tdDriver}>
                          <span className={styles.teamBar} style={{background:`#${d.team_colour}`}} />
                          <div>
                            <div className={styles.acronym}>{d.name_acronym}</div>
                            <div className={styles.teamShort}>{d.team_name?.replace('F1 Team','').replace('Racing','').replace('Scuderia','').trim().split(' ')[0]}</div>
                          </div>
                        </td>

                        <td className={`mono ${styles.tdNum}`}>
                          {isP1
                            ? <span className={styles.intervalLbl}>Interval</span>
                            : <span className={styles.intervalVal}>{fmtGap(d.interval)}</span>
                          }
                        </td>

                        <td><TyreChip compound={d.tyre} age={d.tyre_age} /></td>

                        <td className={`mono ${isBestOverall?styles.purple:styles.dimTime}`}>{fmt(d.best_lap)}</td>

                        <td className={`mono ${styles.tdNum} ${styles.dimTime}`}>
                          {isP1
                            ? <span className={styles.leaderLbl}>Leader</span>
                            : fmtGap(d.gap_to_leader)
                          }
                        </td>

                        <td className={`mono ${d.is_personal_best?styles.green:styles.dimTime}`}>{fmt(d.last_lap)}</td>

                        {/* Mini sector segments */}
                        <td className={styles.tdMini}>
                          {isPremium
                            ? <Segs segments={d.segments} styles={styles} />
                            : <span className={styles.dash}>—</span>
                          }
                        </td>

                        {/* Last sectors */}
                        <td className={styles.tdSec}>
                          {d.sectors?.some(Boolean) ? (
                            <span className={styles.secRow}>
                              {[0,1,2].map(si => {
                                const isSB = d.sectors[si] && d.best_sectors[si] && Math.abs(d.sectors[si]-d.best_sectors[si]) < 0.001
                                const isPB = d.sectors[si] && d.sectors[si] === Math.min(...standings.map(x=>x.sectors[si]).filter(Boolean))
                                return (
                                  <span key={si} className={`mono ${styles.sec} ${isSB?styles.purple:isPB?styles.green:d.sectors[si]?styles.yellow:styles.dimTime}`}>
                                    {d.sectors[si]?d.sectors[si].toFixed(3):'——'}
                                  </span>
                                )
                              })}
                            </span>
                          ) : <span className={styles.dash}>—</span>}
                        </td>

                        {/* Best sectors */}
                        <td className={styles.tdSec}>
                          {d.best_sectors?.some(Boolean) ? (
                            <span className={styles.secRow}>
                              {[0,1,2].map(si => (
                                <span key={si} className={`mono ${styles.sec} ${d.best_sectors[si]?styles.purple:styles.dimTime}`}>
                                  {d.best_sectors[si]?d.best_sectors[si].toFixed(3):'——'}
                                </span>
                              ))}
                            </span>
                          ) : <span className={styles.dash}>—</span>}
                        </td>

                        <td className={`mono ${styles.tdLap}`}>{d.lap_number||'—'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right panel: track map / team radio / race control */}
        {!loading && (
          <RightPanel session={session} standings={standings} rc={rc} isPremium={isPremium} />
        )}
      </div>

      {/* ── Bottom panels ── */}
      <div className={styles.bottomPanels}>
        <div className={styles.champPanel}>
          <div className={styles.champTitle}>DRIVER CHAMPIONSHIP</div>
          {champLoaded ? drvChamp.map(d => (
            <div key={d.acronym} className={styles.champRow}>
              <span className={styles.champPos}>{d.pos}</span>
              <span className={styles.champDot} style={{background:`#${d.colour}`}} />
              <span className={styles.champName}>{d.acronym}</span>
              <span className={styles.champPts}>{d.pts}</span>
            </div>
          )) : <div className={styles.champLoading}>Loading…</div>}
        </div>

        <div className={styles.champPanel}>
          <div className={styles.champTitle}>TEAM CHAMPIONSHIP</div>
          {champLoaded ? teamChamp.map(t => (
            <div key={t.team} className={styles.champRow}>
              <span className={styles.champPos}>{t.pos}</span>
              <span className={styles.champDot} style={{background:`#${t.colour}`}} />
              <span className={styles.champName}>{t.team?.replace(' F1 Team','').replace(' Racing','')}</span>
              <span className={styles.champPts}>{t.pts}</span>
            </div>
          )) : <div className={styles.champLoading}>Loading…</div>}
        </div>

        <div className={`${styles.champPanel} ${styles.champPenalties}`}>
          <div className={styles.champTitle} style={{color:'var(--red)'}}>PENALTIES</div>
          {(() => {
            const pens = rc.filter(m => m.category==='CarEvent'&&m.message?.includes('PENALTY'))
            const tls  = rc.filter(m => m.message?.includes('TRACK LIMITS')||m.message?.includes('DELETED'))
            return pens.length===0&&tls.length===0
              ? <span className={styles.noPenalty}>NO ACTIVE PENALTIES</span>
              : <div className={styles.penRow}>
                  {pens.length>0&&<span className={styles.penTag}>{pens.length} penalty</span>}
                  {tls.length>0&&<span className={styles.tlTag}>{tls.length} TL violation</span>}
                </div>
          })()}
        </div>
      </div>

      {/* ── Pro upsell ── */}
      {!isPremium && !loading && (
        <div className={styles.upsell}>
          <Zap size={13} style={{color:'var(--gold)',flexShrink:0}} />
          <div><strong>F1Pulse Pro</strong> — mini-sectors, ~4s refresh, team radio, full track map</div>
          <Link to="/premium" className="btn btn-gold btn-sm" style={{marginLeft:'auto'}}>£3.99/mo</Link>
        </div>
      )}
    </div>
  )
}
