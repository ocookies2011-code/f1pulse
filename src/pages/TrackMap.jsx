import { useEffect, useState, useRef, useCallback } from 'react'
import { useAuth } from '../hooks/useAuth'
import { Link } from 'react-router-dom'
import { Zap, RefreshCw, AlertTriangle } from 'lucide-react'
import { getLatestSession, getDrivers, fmt } from '../lib/openf1'
import styles from './TrackMap.module.css'

// ── Circuit SVG paths + metadata ─────────────────────────────────────────────
// All paths are normalised to a 1000×600 viewBox.
// Corners, sector boundaries and DRS zones are embedded per circuit.
const CIRCUITS = {
  'Monaco': {
    // SVG path of the Monaco street circuit outline
    path: 'M 480 80 L 520 75 L 600 90 L 650 120 L 660 160 L 640 200 L 600 220 L 560 230 L 530 250 L 520 290 L 530 330 L 550 360 L 560 400 L 540 430 L 500 450 L 450 460 L 400 450 L 360 430 L 340 400 L 330 360 L 340 320 L 360 290 L 380 260 L 390 230 L 380 200 L 360 180 L 340 160 L 330 130 L 340 100 L 370 80 L 420 72 L 480 80 Z',
    corners: [
      {n:1,  x:530, y:95,  label:'Ste Dévote'},
      {n:3,  x:645, y:145, label:'Massenet'},
      {n:5,  x:645, y:195, label:'Casino'},
      {n:6,  x:570, y:228, label:'Mirabeau'},
      {n:8,  x:522, y:340, label:'Portier'},
      {n:10, x:543, y:415, label:'Tabac'},
      {n:11, x:495, y:455, label:'Piscine S1'},
      {n:13, x:420, y:455, label:'Piscine S2'},
      {n:14, x:365, y:425, label:'La Rascasse'},
      {n:15, x:338, y:390, label:'Antony Noghes'},
      {n:19, x:365, y:180, label:'Loews'},
      {n:20, x:335, y:125, label:'Portier'},
    ],
    sectors: [
      { id:1, color:'#3671C6', points:'530,95 645,145 645,195 570,228 522,340', label:'S1', midX:590, midY:160 },
      { id:2, color:'#E8002D', points:'522,340 543,415 495,455 420,455 365,425 338,390', label:'S2', midX:440, midY:440 },
      { id:3, color:'#FF8000', points:'338,390 365,180 335,125 340,100 370,80 420,72 480,80 530,95', label:'S3', midX:390, midY:110 },
    ],
    drs: [
      { x1:400, y1:72, x2:530, y2:80, label:'DRS 1' },
    ],
    viewBox: '280 60 420 420',
    startLine: { x:482, y:79, angle: 0 },
  },
  'Albert Park': {
    path: 'M 500 100 L 650 95 L 720 120 L 750 160 L 740 200 L 700 230 L 660 240 L 640 270 L 650 310 L 680 340 L 700 380 L 680 420 L 640 440 L 580 450 L 520 445 L 470 430 L 430 400 L 380 390 L 340 410 L 310 440 L 280 430 L 260 400 L 270 360 L 300 330 L 330 300 L 320 260 L 290 230 L 280 190 L 300 150 L 340 120 L 400 100 L 500 100 Z',
    corners: [
      {n:1,  x:575, y:95,  label:'Turn 1'},
      {n:3,  x:735, y:140, label:'Turn 3'},
      {n:6,  x:695, y:235, label:'Turn 6'},
      {n:9,  x:690, y:360, label:'Turn 9'},
      {n:11, x:610, y:447, label:'Turn 11'},
      {n:13, x:450, y:435, label:'Turn 13'},
      {n:14, x:385, y:395, label:'Turn 14'},
      {n:15, x:295, y:425, label:'Turn 15'},
      {n:16, x:265, y:395, label:'Turn 16'},
    ],
    sectors: [
      { id:1, color:'#3671C6', points:'500,100 650,95 720,120 750,160 740,200 700,230', label:'S1', midX:640, midY:140 },
      { id:2, color:'#E8002D', points:'700,230 660,240 640,270 650,310 680,340 700,380 680,420 640,440', label:'S2', midX:670, midY:320 },
      { id:3, color:'#FF8000', points:'640,440 580,450 520,445 470,430 430,400 380,390 340,410 310,440 280,430 260,400 270,360 300,330 330,300 320,260 290,230 280,190 300,150 340,120 400,100 500,100', label:'S3', midX:360, midY:290 },
    ],
    drs: [
      { x1:400, y1:100, x2:500, y2:100, label:'DRS 1' },
      { x1:690, y1:360, x2:710, y2:390, label:'DRS 2' },
    ],
    viewBox: '230 80 550 390',
    startLine: { x:500, y:100, angle: 0 },
  },

  'Suzuka': {
    path: 'M 500 120 L 600 110 L 680 140 L 720 190 L 710 250 L 670 300 L 640 350 L 660 400 L 690 440 L 670 480 L 620 490 L 560 470 L 520 440 L 480 400 L 450 360 L 420 380 L 400 420 L 370 440 L 330 430 L 300 400 L 290 350 L 310 300 L 350 270 L 390 240 L 400 200 L 380 160 L 400 130 L 440 115 L 500 120 Z',
    corners: [
      {n:1, x:560, y:112, label:'Turn 1'},
      {n:3, x:715, y:180, label:'S Curves'},
      {n:7, x:655, y:355, label:'Dunlop'},
      {n:11,x:685, y:460, label:'Hairpin'},
      {n:13,x:500, y:455, label:'Spoon'},
      {n:16,x:315, y:300, label:'130R'},
      {n:17,x:300, y:375, label:'Casio'},
    ],
    sectors: [
      { id:1, color:'#3671C6', points:'500,120 600,110 680,140 720,190 710,250', label:'S1', midX:640, midY:145 },
      { id:2, color:'#E8002D', points:'710,250 670,300 640,350 660,400 690,440 670,480 620,490', label:'S2', midX:680, midY:390 },
      { id:3, color:'#FF8000', points:'620,490 560,470 520,440 480,400 450,360 420,380 400,420 370,440 330,430 300,400 290,350 310,300 350,270 390,240 400,200 380,160 400,130 440,115 500,120', label:'S3', midX:370, midY:300 },
    ],
    drs: [
      { x1:500, y1:120, x2:600, y2:110, label:'DRS 1' },
      { x1:290, y1:350, x2:310, y2:300, label:'DRS 2' },
    ],
    viewBox: '260 100 480 410',
    startLine: { x:500, y:120, angle:0 },
  },
  'Monza': {
    path: 'M 350 150 L 550 140 L 650 160 L 700 200 L 720 260 L 700 320 L 650 360 L 580 380 L 520 370 L 480 340 L 460 380 L 470 430 L 440 460 L 400 465 L 360 450 L 330 420 L 320 380 L 340 340 L 380 310 L 390 270 L 360 240 L 310 230 L 280 200 L 290 160 L 320 145 L 350 150 Z',
    corners: [
      {n:1, x:450, y:143, label:'Prima Variante'},
      {n:4, x:690, y:195, label:'Curva Grande'},
      {n:7, x:710, y:295, label:'Seconda V.'},
      {n:8, x:635, y:365, label:'Lesmo 1'},
      {n:10,x:465, y:360, label:'Lesmo 2'},
      {n:11,x:450, y:440, label:'Ascari'},
      {n:14,x:350, y:460, label:'Parabolica'},
    ],
    sectors: [
      { id:1, color:'#3671C6', points:'350,150 550,140 650,160 700,200 720,260', label:'S1', midX:550, midY:148 },
      { id:2, color:'#E8002D', points:'720,260 700,320 650,360 580,380 520,370 480,340', label:'S2', midX:640, midY:330 },
      { id:3, color:'#FF8000', points:'480,340 460,380 470,430 440,460 400,465 360,450 330,420 320,380 340,340 380,310 390,270 360,240 310,230 280,200 290,160 320,145 350,150', label:'S3', midX:360, midY:300 },
    ],
    drs: [
      { x1:350, y1:150, x2:550, y2:140, label:'DRS 1' },
      { x1:320, y1:380, x2:350, y2:340, label:'DRS 2' },
    ],
    viewBox: '260 130 480 360',
    startLine: { x:350, y:150, angle:0 },
  },
  'Catalunya': {
    path: 'M 300 200 L 500 185 L 600 200 L 670 240 L 680 300 L 650 350 L 600 380 L 560 400 L 540 440 L 550 480 L 520 510 L 470 515 L 420 500 L 380 470 L 360 430 L 340 390 L 300 370 L 260 350 L 240 310 L 255 265 L 280 230 L 300 200 Z',
    corners: [
      {n:1, x:400, y:187, label:'Turn 1'},
      {n:3, x:665, y:230, label:'Repsol'},
      {n:5, x:670, y:325, label:'Seat'},
      {n:7, x:570, y:393, label:'La Caixa'},
      {n:9, x:537, y:460, label:'Campsa'},
      {n:10,x:487, y:513, label:'La Caixa'},
      {n:12,x:345, y:395, label:'Chicane'},
      {n:14,x:247, y:310, label:'New Holland'},
    ],
    sectors: [
      { id:1, color:'#3671C6', points:'300,200 500,185 600,200 670,240 680,300', label:'S1', midX:515, midY:192 },
      { id:2, color:'#E8002D', points:'680,300 650,350 600,380 560,400 540,440 550,480', label:'S2', midX:600, midY:400 },
      { id:3, color:'#FF8000', points:'550,480 520,510 470,515 420,500 380,470 360,430 340,390 300,370 260,350 240,310 255,265 280,230 300,200', label:'S3', midX:330, midY:380 },
    ],
    drs: [
      { x1:300, y1:200, x2:500, y2:185, label:'DRS 1' },
      { x1:260, y1:350, x2:240, y2:310, label:'DRS 2' },
    ],
    viewBox: '220 170 480 370',
    startLine: { x:300, y:200, angle:0 },
  },
  'Silverstone': {
    path: 'M 300 150 L 450 120 L 550 130 L 640 160 L 700 210 L 720 270 L 700 330 L 650 370 L 680 420 L 700 470 L 680 510 L 620 530 L 540 520 L 480 490 L 440 450 L 400 430 L 340 440 L 290 430 L 250 400 L 230 360 L 240 310 L 270 270 L 260 230 L 240 200 L 250 160 L 280 140 L 300 150 Z',
    corners: [
      {n:1,  x:370, y:125, label:'Abbey'},
      {n:3,  x:595, y:145, label:'Village'},
      {n:6,  x:710, y:240, label:'Brooklands'},
      {n:7,  x:710, y:300, label:'Luffield'},
      {n:9,  x:665, y:395, label:'Copse'},
      {n:10, x:690, y:445, label:'Maggotts'},
      {n:13, x:510, y:510, label:'Becketts'},
      {n:15, x:370, y:435, label:'Hangar S'},
      {n:16, x:295, y:432, label:'Stowe'},
      {n:18, x:237, y:335, label:'Vale'},
    ],
    sectors: [
      { id:1, color:'#3671C6', points:'300,150 450,120 550,130 640,160 700,210 720,270', label:'S1', midX:530, midY:145 },
      { id:2, color:'#E8002D', points:'720,270 700,330 650,370 680,420 700,470 680,510 620,530', label:'S2', midX:690, midY:420 },
      { id:3, color:'#FF8000', points:'620,530 540,520 480,490 440,450 400,430 340,440 290,430 250,400 230,360 240,310 270,270 260,230 240,200 250,160 280,140 300,150', label:'S3', midX:290, midY:300 },
    ],
    drs: [
      { x1:450, y1:120, x2:550, y2:130, label:'DRS 1' },
      { x1:250, y1:400, x2:230, y2:360, label:'DRS 2' },
    ],
    viewBox: '210 110 530 440',
    startLine: { x:300, y:150, angle: 30 },
  },
}

// Default/generic fallback track (oval placeholder)
const GENERIC_CIRCUIT = {
  path: 'M 200 300 Q 200 100 500 100 Q 800 100 800 300 Q 800 500 500 500 Q 200 500 200 300 Z',
  corners: [],
  sectors: [
    { id:1, color:'#3671C6', points:'200,300 200,100 500,100', label:'S1', midX:350, midY:150 },
    { id:2, color:'#E8002D', points:'500,100 800,100 800,300', label:'S2', midX:700, midY:180 },
    { id:3, color:'#FF8000', points:'800,300 800,500 500,500 200,500 200,300', label:'S3', midX:500, midY:490 },
  ],
  drs: [],
  viewBox: '150 80 700 450',
  startLine: { x:200, y:300, angle: 90 },
}

// Meeting name → CIRCUITS key mapping (same logic as circuitData2)
const MEETING_MAP_LOCAL = {
  'monaco': 'Monaco', 'monte carlo': 'Monaco',
  'albert park': 'Albert Park', 'australian': 'Albert Park', 'melbourne': 'Albert Park',
  'suzuka': 'Suzuka', 'japanese': 'Suzuka',
  'sakhir': 'Catalunya', 'bahrain': 'Catalunya', // use Catalunya SVG as fallback
  'jeddah': 'Monaco', // closest shape fallback
  'miami': 'Albert Park',
  'imola': 'Monza',
  'villeneuve': 'Albert Park', 'montreal': 'Albert Park', 'canadian': 'Albert Park',
  'spielberg': 'Silverstone',
  'silverstone': 'Silverstone', 'british': 'Silverstone',
  'budapest': 'Monza',
  'spa': 'Silverstone', 'belgian': 'Silverstone',
  'zandvoort': 'Monza',
  'monza': 'Monza', 'italian': 'Monza',
  'baku': 'Monaco',
  'singapore': 'Monaco',
  'austin': 'Silverstone',
  'mexico': 'Albert Park',
  'são paulo': 'Monza', 'sao paulo': 'Monza', 'brazil': 'Monza',
  'las vegas': 'Albert Park',
  'lusail': 'Catalunya', 'losail': 'Catalunya', 'qatar': 'Catalunya',
  'yas marina': 'Catalunya', 'abu dhabi': 'Catalunya',
  'barcelona': 'Catalunya', 'spain': 'Catalunya', 'catalan': 'Catalunya',
  'shanghai': 'Albert Park', 'chinese': 'Albert Park',
}

function getCircuit(sessionName) {
  if (!sessionName) return GENERIC_CIRCUIT
  const lower = sessionName.toLowerCase()
  // Direct CIRCUITS key match
  for (const k of Object.keys(CIRCUITS)) {
    if (lower.includes(k.toLowerCase())) return CIRCUITS[k]
  }
  // Meeting map fallback
  for (const [key, circuitKey] of Object.entries(MEETING_MAP_LOCAL)) {
    if (lower.includes(key)) return CIRCUITS[circuitKey] ?? GENERIC_CIRCUIT
  }
  return GENERIC_CIRCUIT
}

// Normalise raw OpenF1 x/y to SVG viewBox space
function normalisePositions(rawPositions, circuit) {
  if (!rawPositions?.length || !circuit) return []
  const xs = rawPositions.map(p => p.x).filter(Boolean)
  const ys = rawPositions.map(p => p.y).filter(Boolean)
  if (!xs.length) return []
  const xMin = Math.min(...xs), xMax = Math.max(...xs)
  const yMin = Math.min(...ys), yMax = Math.max(...ys)
  const [vx, vy, vw, vh] = circuit.viewBox.split(' ').map(Number)
  return rawPositions.map(p => ({
    ...p,
    svgX: vx + ((p.x - xMin) / (xMax - xMin || 1)) * vw,
    svgY: vy + vh - ((p.y - yMin) / (yMax - yMin || 1)) * vh, // flip Y
  }))
}

export default function TrackMap() {
  const { isPremium } = useAuth()
  const [session,     setSession]     = useState(null)
  const [drivers,     setDrivers]     = useState([])
  const [positions,   setPositions]   = useState({}) // driverNum → {svgX, svgY, ...}
  const [sectorBest,  setSectorBest]  = useState({ 1: null, 2: null, 3: null }) // sectorId → driverNum
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState(null)
  const [selected,    setSelected]    = useState(null) // selected driver number
  const [lastUpdate,  setLastUpdate]  = useState(null)
  const wsRef   = useRef(null)
  const pollRef = useRef(null)

  const circuit = getCircuit(session?.circuit_short_name ?? session?.meeting_name ?? '')

  // ── Fetch current car positions via REST (fallback / free tier) ─────────────
  const fetchPositions = useCallback(async (sk) => {
    if (!sk) return
    try {
      const { getCached } = await import('../lib/openf1')
      // Get latest location for each driver (last few seconds of data)
      const now  = new Date()
      const from = new Date(now - 10000).toISOString()
      const url  = `${proxyBase}/location?session_key=${sk}&date>${from}`
      const supaUrl = import.meta.env.VITE_SUPABASE_URL
      const proxyBase = supaUrl ? `${supaUrl}/functions/v1/openf1-proxy/v1` : 'https://api.openf1.org/v1'
      const headers = {}
      const res  = await fetch(url, { headers })
      if (!res.ok) return
      const raw  = await res.json()
      if (!raw?.length) return

      // Latest position per driver
      const latest = {}
      for (const p of raw) {
        if (!latest[p.driver_number] || p.date > latest[p.driver_number].date) {
          latest[p.driver_number] = p
        }
      }
      const normalised = {}
      for (const [dn, p] of Object.entries(latest)) {
        const pts = normalisePositions([p], circuit ?? GENERIC_CIRCUIT)
        if (pts[0]) normalised[dn] = pts[0]
      }
      setPositions(normalised)
      setLastUpdate(new Date())
    } catch (e) { console.error('position fetch', e) }
  }, [circuit])

  // ── Bootstrap ─────────────────────────────────────────────────────────────
  useEffect(() => {
    async function init() {
      try {
        const sess = await getLatestSession()
        setSession(sess)
        if (!sess) { setLoading(false); return }
        const drvs = await getDrivers(sess.session_key)
        setDrivers(drvs)
        await fetchPositions(sess.session_key)
      } catch (e) { setError('Could not load track map data.') }
      finally { setLoading(false) }
    }
    init()
  }, [fetchPositions])

  // ── Poll positions ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!session) return
    const ms = isPremium ? 3000 : 8000
    pollRef.current = setInterval(() => fetchPositions(session.session_key), ms)
    return () => clearInterval(pollRef.current)
  }, [session, isPremium, fetchPositions])

  const drvMap = {}
  for (const d of drivers) drvMap[d.driver_number] = d

  const selectedDriver = selected ? drvMap[selected] : null

  return (
    <div className="page">
      <div className="page-hd" style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ display:'flex', alignItems:'center', gap:8 }}>
            🗺 Track Map
          </h1>
          <p>
            {session
              ? `${session.session_name} · ${session.meeting_name ?? session.circuit_short_name ?? ''}`
              : 'No active session — showing circuit layout'
            }
          </p>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          {!isPremium && (
            <Link to="/premium" className={styles.proBadge}><Zap size={11} /> Pro: live positions</Link>
          )}
          <div className={styles.updateTime}>
            <RefreshCw size={10} />
            {lastUpdate ? lastUpdate.toLocaleTimeString('en-GB') : '—'}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="spinner-wrap"><div className="spinner" /></div>
      ) : (
        <div className={styles.layout}>
          {/* ── SVG Map ── */}
          <div className={styles.mapWrap}>
            <svg
              className={styles.svg}
              viewBox={circuit?.viewBox ?? '0 0 1000 600'}
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>
              </defs>

              {/* ── Sector backgrounds ── */}
              {(circuit?.sectors ?? []).map(s => {
                const bestDrv   = sectorBest[s.id]
                const bestDriver = bestDrv ? drvMap[bestDrv] : null
                const col = bestDriver ? `#${bestDriver.team_colour}` : s.color
                return (
                  <polyline
                    key={s.id}
                    points={s.points}
                    fill="none"
                    stroke={`${col}28`}
                    strokeWidth="18"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )
              })}

              {/* ── Track outline ── */}
              {circuit?.path && (
                <path
                  d={circuit.path}
                  fill="none"
                  stroke="rgba(255,255,255,0.12)"
                  strokeWidth="2"
                />
              )}

              {/* ── Sector lines (bold coloured) ── */}
              {(circuit?.sectors ?? []).map(s => {
                const bestDrv   = sectorBest[s.id]
                const bestDriver = bestDrv ? drvMap[bestDrv] : null
                const col = bestDriver ? `#${bestDriver.team_colour}` : s.color
                return (
                  <polyline
                    key={`line-${s.id}`}
                    points={s.points}
                    fill="none"
                    stroke={col}
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity="0.85"
                  />
                )
              })}

              {/* ── DRS zones ── */}
              {(circuit?.drs ?? []).map((z, i) => (
                <g key={i}>
                  <line x1={z.x1} y1={z.y1} x2={z.x2} y2={z.y2} stroke="#39d98a" strokeWidth="6" strokeLinecap="round" opacity="0.7" />
                  <text x={(z.x1+z.x2)/2} y={(z.y1+z.y2)/2 - 8} textAnchor="middle" fill="#39d98a" fontSize="9" fontWeight="700" fontFamily="JetBrains Mono, monospace">DRS</text>
                </g>
              ))}

              {/* ── Corner numbers ── */}
              {(circuit?.corners ?? []).map(c => (
                <g key={c.n}>
                  <circle cx={c.x} cy={c.y} r="9" fill="rgba(0,0,0,0.7)" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
                  <text x={c.x} y={c.y + 4} textAnchor="middle" fill="rgba(255,255,255,0.8)" fontSize="8" fontWeight="700" fontFamily="JetBrains Mono, monospace">{c.n}</text>
                </g>
              ))}

              {/* ── Sector labels ── */}
              {(circuit?.sectors ?? []).map(s => {
                const bestDrv   = sectorBest[s.id]
                const bestDriver = bestDrv ? drvMap[bestDrv] : null
                const col = bestDriver ? `#${bestDriver.team_colour}` : s.color
                return (
                  <g key={`lbl-${s.id}`}>
                    <rect x={s.midX-16} y={s.midY-10} width={32} height={18} rx={4} fill={col} opacity="0.9" />
                    <text x={s.midX} y={s.midY+4} textAnchor="middle" fill="#fff" fontSize="10" fontWeight="800" fontFamily="JetBrains Mono, monospace">{s.label}</text>
                    {bestDriver && (
                      <text x={s.midX} y={s.midY+18} textAnchor="middle" fill={col} fontSize="9" fontWeight="700" fontFamily="JetBrains Mono, monospace">{bestDriver.name_acronym}</text>
                    )}
                  </g>
                )
              })}

              {/* ── Start/finish line ── */}
              {circuit?.startLine && (
                <g>
                  <rect
                    x={circuit.startLine.x - 2} y={circuit.startLine.y - 12}
                    width={4} height={24}
                    fill="white" opacity="0.9"
                    transform={`rotate(${circuit.startLine.angle}, ${circuit.startLine.x}, ${circuit.startLine.y})`}
                  />
                  <text x={circuit.startLine.x + 10} y={circuit.startLine.y + 4} fill="rgba(255,255,255,0.6)" fontSize="9" fontFamily="JetBrains Mono, monospace">S/F</text>
                </g>
              )}

              {/* ── Live car positions ── */}
              {Object.entries(positions).map(([dn, pos]) => {
                const drv  = drvMap[Number(dn)]
                if (!drv || !pos.svgX || !pos.svgY) return null
                const col  = `#${drv.team_colour ?? 'aaaaaa'}`
                const isSelected = Number(dn) === selected
                const r = isSelected ? 9 : 7
                return (
                  <g
                    key={dn}
                    onClick={() => setSelected(isSelected ? null : Number(dn))}
                    style={{ cursor:'pointer' }}
                    filter={isSelected ? 'url(#glow)' : ''}
                  >
                    <circle cx={pos.svgX} cy={pos.svgY} r={r+3} fill={col} opacity="0.25" />
                    <circle cx={pos.svgX} cy={pos.svgY} r={r} fill={col} stroke={isSelected ? '#fff' : col} strokeWidth={isSelected ? 2 : 0} />
                    <text
                      x={pos.svgX}
                      y={pos.svgY - r - 3}
                      textAnchor="middle"
                      fill="#fff"
                      fontSize="8"
                      fontWeight="800"
                      fontFamily="JetBrains Mono, monospace"
                      style={{ pointerEvents:'none' }}
                    >
                      {drv.name_acronym}
                    </text>
                  </g>
                )
              })}
            </svg>

            {/* Legend */}
            <div className={styles.legend}>
              <div className={styles.legendItem}><span className={styles.legendLine} style={{ background:'#3671C6' }} /><span>Sector 1</span></div>
              <div className={styles.legendItem}><span className={styles.legendLine} style={{ background:'#E8002D' }} /><span>Sector 2</span></div>
              <div className={styles.legendItem}><span className={styles.legendLine} style={{ background:'#FF8000' }} /><span>Sector 3</span></div>
              <div className={styles.legendItem}><span className={styles.legendLine} style={{ background:'#39d98a' }} /><span>DRS zone</span></div>
              <div className={styles.legendItem}><span className={styles.cornerCircle}>n</span><span>Corner #</span></div>
            </div>
          </div>

          {/* ── Driver list sidebar ── */}
          <div className={styles.sidebar}>
            <div className={styles.sidebarTitle}>Drivers on track</div>
            {drivers.length === 0 ? (
              <div className={styles.sidebarEmpty}>No session data</div>
            ) : (
              drivers.map(d => {
                const pos = positions[d.driver_number]
                const isLive = !!pos
                const isSelected = d.driver_number === selected
                return (
                  <div
                    key={d.driver_number}
                    className={`${styles.driverRow} ${isSelected ? styles.driverSelected : ''} ${!isLive ? styles.driverOffline : ''}`}
                    onClick={() => setSelected(isSelected ? null : d.driver_number)}
                  >
                    <span className={styles.drvBar} style={{ background:`#${d.team_colour}` }} />
                    <span className={styles.drvNum} style={{ color:`#${d.team_colour}` }}>#{d.driver_number}</span>
                    <span className={styles.drvAcro}>{d.name_acronym}</span>
                    <span className={styles.drvTeam}>{d.team_name?.split(' ')[0]}</span>
                    {isLive
                      ? <span className={styles.liveDot} />
                      : <span className={styles.offlineDot} />
                    }
                  </div>
                )
              })
            )}

            {/* Selected driver detail */}
            {selectedDriver && (
              <div className={styles.driverDetail} style={{ borderColor:`#${selectedDriver.team_colour}40` }}>
                <div className={styles.detailName}>{selectedDriver.full_name}</div>
                <div className={styles.detailTeam} style={{ color:`#${selectedDriver.team_colour}` }}>{selectedDriver.team_name}</div>
                {positions[selected] && (
                  <div className={styles.detailCoords}>
                    <span>X: {positions[selected].x?.toFixed(0)}</span>
                    <span>Y: {positions[selected].y?.toFixed(0)}</span>
                  </div>
                )}
              </div>
            )}

            {/* Pro upsell */}
            {!isPremium && (
              <div className={styles.sidebarUpsell}>
                <Zap size={13} style={{ color:'var(--gold)' }} />
                <div>
                  <strong>Pro</strong> gets you ~3s position updates vs 8s on free
                </div>
                <Link to="/premium" className="btn btn-gold btn-sm" style={{ marginTop:8 }}>Upgrade</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
