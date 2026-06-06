// Proper inline SVG team logos — accurate shapes, no external dependencies

const LOGOS = {
  'McLaren': (size) => (
    <svg viewBox="0 0 200 100" width={size} height={size*0.5} xmlns="http://www.w3.org/2000/svg">
      <path d="M10 72 Q50 8 100 20 Q150 8 190 72 Q150 65 100 58 Q50 65 10 72Z" fill="#FF8000"/>
    </svg>
  ),
  'Ferrari': (size) => (
    <svg viewBox="0 0 100 120" width={size*0.75} height={size*0.9} xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="2" width="84" height="116" rx="6" fill="#DC0000"/>
      <path d="M50 18 C38 24 30 34 33 44 C36 54 50 50 50 64 C50 50 64 54 67 44 C70 34 62 24 50 18Z" fill="#FFD700"/>
      <path d="M30 68 L70 68 L72 76 L28 76Z" fill="#FFD700"/>
      <rect x="26" y="96" width="48" height="10" fill="#1a1a1a" rx="2"/>
      <text x="50" y="105" textAnchor="middle" fill="white" fontSize="7" fontWeight="900" fontFamily="Arial">SF</text>
    </svg>
  ),
  'Mercedes': (size) => (
    <svg viewBox="0 0 100 100" width={size*0.85} height={size*0.85} xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="46" stroke="#00D2BE" strokeWidth="5" fill="none"/>
      <line x1="50" y1="4" x2="50" y2="50" stroke="#00D2BE" strokeWidth="5" strokeLinecap="round"/>
      <line x1="50" y1="50" x2="10" y2="73" stroke="#00D2BE" strokeWidth="5" strokeLinecap="round"/>
      <line x1="50" y1="50" x2="90" y2="73" stroke="#00D2BE" strokeWidth="5" strokeLinecap="round"/>
      <circle cx="50" cy="50" r="6" fill="#00D2BE"/>
    </svg>
  ),
  'Red Bull Racing': (size) => (
    <svg viewBox="0 0 200 100" width={size} height={size*0.5} xmlns="http://www.w3.org/2000/svg">
      {/* Left bull */}
      <g transform="translate(35,20)">
        <ellipse cx="0" cy="15" rx="18" ry="12" fill="#CC1E4A" transform="rotate(-15)"/>
        <path d="M-12 5 Q-22 -5 -18 -18 Q-8 -20 -5 -10" fill="#CC1E4A"/>
        <path d="M12 5 Q22 -5 18 -18 Q8 -20 5 -10" fill="#CC1E4A"/>
        <circle cx="-6" cy="10" r="3" fill="#1a1a2e"/>
        <ellipse cx="0" cy="22" rx="10" ry="6" fill="#CC1E4A"/>
        <path d="M-10 25 L-14 45" stroke="#CC1E4A" strokeWidth="5" strokeLinecap="round"/>
        <path d="M10 25 L14 45" stroke="#CC1E4A" strokeWidth="5" strokeLinecap="round"/>
      </g>
      {/* Right bull */}
      <g transform="translate(165,20) scale(-1,1)">
        <ellipse cx="0" cy="15" rx="18" ry="12" fill="#1E3A8A" transform="rotate(-15)"/>
        <path d="M-12 5 Q-22 -5 -18 -18 Q-8 -20 -5 -10" fill="#1E3A8A"/>
        <path d="M12 5 Q22 -5 18 -18 Q8 -20 5 -10" fill="#1E3A8A"/>
        <circle cx="-6" cy="10" r="3" fill="#1a1a2e"/>
        <ellipse cx="0" cy="22" rx="10" ry="6" fill="#1E3A8A"/>
        <path d="M-10 25 L-14 45" stroke="#1E3A8A" strokeWidth="5" strokeLinecap="round"/>
        <path d="M10 25 L14 45" stroke="#1E3A8A" strokeWidth="5" strokeLinecap="round"/>
      </g>
      <path d="M75 50 Q100 38 125 50" stroke="#FFD700" strokeWidth="4" fill="none" strokeLinecap="round"/>
      <circle cx="75" cy="50" r="5" fill="#FFD700"/>
      <circle cx="125" cy="50" r="5" fill="#FFD700"/>
    </svg>
  ),
  'Aston Martin': (size) => (
    <svg viewBox="0 0 220 60" width={size*1.2} height={size*0.33} xmlns="http://www.w3.org/2000/svg">
      {/* Wings */}
      <path d="M10 50 Q30 10 60 30 Q80 40 90 30 Q100 20 110 30 Q120 20 130 30 Q140 40 160 30 Q190 10 210 50" stroke="#006F51" strokeWidth="4" fill="none" strokeLinecap="round"/>
      <path d="M40 50 Q55 25 70 35 Q85 42 110 30 Q135 42 150 35 Q165 25 180 50" stroke="#006F51" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.6"/>
      <text x="110" y="30" textAnchor="middle" fill="#006F51" fontSize="12" fontWeight="900" fontFamily="Arial" letterSpacing="3">ASTON MARTIN</text>
    </svg>
  ),
  'Alpine': (size) => (
    <svg viewBox="0 0 180 80" width={size} height={size*0.44} xmlns="http://www.w3.org/2000/svg">
      <path d="M10 70 L90 10 L170 70" stroke="#FF87BC" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M35 70 L90 25 L145 70" stroke="#0090D0" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M60 70 L90 42 L120 70" stroke="#FF87BC" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  'Williams': (size) => (
    <svg viewBox="0 0 100 80" width={size*0.75} height={size*0.6} xmlns="http://www.w3.org/2000/svg">
      <text x="50" y="70" textAnchor="middle" fill="white" fontSize="80" fontWeight="900" fontFamily="Arial,sans-serif" letterSpacing="-4">W</text>
    </svg>
  ),
  'Haas F1 Team': (size) => (
    <svg viewBox="0 0 200 80" width={size} height={size*0.4} xmlns="http://www.w3.org/2000/svg">
      <text x="100" y="65" textAnchor="middle" fill="white" fontSize="58" fontWeight="900" fontFamily="Arial,sans-serif" letterSpacing="2">HAAS</text>
    </svg>
  ),
  'Racing Bulls': (size) => (
    <svg viewBox="0 0 200 80" width={size} height={size*0.4} xmlns="http://www.w3.org/2000/svg">
      <rect x="5" y="10" width="190" height="60" rx="6" fill="none" stroke="#6692FF" strokeWidth="3"/>
      <text x="100" y="55" textAnchor="middle" fill="#6692FF" fontSize="32" fontWeight="900" fontFamily="Arial,sans-serif" letterSpacing="1">VCARB</text>
    </svg>
  ),
  'Sauber': (size) => (
    <svg viewBox="0 0 160 80" width={size*0.85} height={size*0.4} xmlns="http://www.w3.org/2000/svg">
      <text x="80" y="62" textAnchor="middle" fill="white" fontSize="44" fontWeight="900" fontFamily="Arial,sans-serif">C</text>
      <circle cx="80" cy="36" r="30" stroke="#52E252" strokeWidth="4" fill="none"/>
      <path d="M55 50 L80 20 L105 50" stroke="#52E252" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  'Cadillac': (size) => (
    <svg viewBox="0 0 200 80" width={size} height={size*0.4} xmlns="http://www.w3.org/2000/svg">
      <rect x="5" y="20" width="190" height="40" rx="4" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2"/>
      <text x="100" y="50" textAnchor="middle" fill="white" fontSize="22" fontWeight="900" fontFamily="Arial,sans-serif" letterSpacing="3">CADILLAC</text>
    </svg>
  ),
}

function normTeam(name) {
  if (!name) return null
  const lower = name.toLowerCase()
  if (lower.includes('mclaren')) return 'McLaren'
  if (lower.includes('ferrari') || lower.includes('scuderia')) return 'Ferrari'
  if (lower.includes('mercedes')) return 'Mercedes'
  if (lower.includes('red bull') || lower.includes('oracle')) return 'Red Bull Racing'
  if (lower.includes('aston martin')) return 'Aston Martin'
  if (lower.includes('alpine') || lower.includes('bwt')) return 'Alpine'
  if (lower.includes('williams')) return 'Williams'
  if (lower.includes('haas')) return 'Haas F1 Team'
  if (lower.includes('racing bulls') || lower.includes('vcarb') || lower.includes('visa cash')) return 'Racing Bulls'
  if (lower.includes('sauber') || lower.includes('kick') || lower.includes('stake')) return 'Sauber'
  if (lower.includes('cadillac') || lower.includes('andretti')) return 'Cadillac'
  return name
}

export function TeamLogo({ team, size = 52 }) {
  const key = normTeam(team)
  const logoFn = LOGOS[key]
  if (!logoFn) {
    return (
      <div style={{
        width: size, height: size * 0.5,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'monospace', fontWeight: 900, fontSize: size * 0.2,
        color: 'rgba(255,255,255,0.3)',
      }}>
        {key?.slice(0,3).toUpperCase() ?? '?'}
      </div>
    )
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 0 }}>
      {logoFn(size)}
    </div>
  )
}
