// All team logos as inline SVG - no external dependencies, no CORS issues

const LOGOS = {
  'Mercedes': (
    <svg viewBox="0 0 120 60" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="60" cy="30" r="24" stroke="#27F4D2" strokeWidth="3.5" fill="none"/>
      <line x1="60" y1="6" x2="60" y2="30" stroke="#27F4D2" strokeWidth="3.5" strokeLinecap="round"/>
      <line x1="60" y1="30" x2="39" y2="42" stroke="#27F4D2" strokeWidth="3.5" strokeLinecap="round"/>
      <line x1="60" y1="30" x2="81" y2="42" stroke="#27F4D2" strokeWidth="3.5" strokeLinecap="round"/>
      <circle cx="60" cy="30" r="4" fill="#27F4D2"/>
    </svg>
  ),
  'Ferrari': (
    <svg viewBox="0 0 120 60" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="38" y="5" width="44" height="50" rx="4" fill="#E8002D"/>
      <path d="M60 12 C52 16 46 22 48 30 C50 38 60 34 60 46 C60 34 70 38 72 30 C74 22 68 16 60 12Z" fill="#FFD700"/>
      <rect x="45" y="47" width="30" height="5" fill="#1a1a1a" rx="1"/>
    </svg>
  ),
  'McLaren': (
    <svg viewBox="0 0 120 60" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 46 Q30 10 60 14 Q90 10 112 46 Q90 42 60 38 Q30 42 8 46Z" fill="#FF8000"/>
      <ellipse cx="60" cy="38" rx="28" ry="10" fill="#FF8000"/>
    </svg>
  ),
  'Red Bull Racing': (
    <svg viewBox="0 0 120 60" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="36" cy="26" r="18" fill="#CC1E2B"/>
      <circle cx="84" cy="26" r="18" fill="#3671C6"/>
      <path d="M36 44 Q60 56 84 44" stroke="#FFD700" strokeWidth="3" fill="none" strokeLinecap="round"/>
      <circle cx="36" cy="20" r="6" fill="#FFD700"/>
      <circle cx="84" cy="20" r="6" fill="#FFD700"/>
    </svg>
  ),
  'Aston Martin': (
    <svg viewBox="0 0 120 60" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M60 5 L110 55 L10 55 Z" stroke="#229971" strokeWidth="3.5" fill="none" strokeLinejoin="round"/>
      <path d="M60 18 L95 50 L25 50 Z" stroke="#229971" strokeWidth="1.8" fill="none" strokeLinejoin="round" opacity="0.5"/>
      <circle cx="60" cy="38" r="6" fill="#229971"/>
    </svg>
  ),
  'Alpine': (
    <svg viewBox="0 0 120 60" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 52 L60 8 L112 52" stroke="#FF87BC" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M24 52 L60 20 L96 52" stroke="#0078D4" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  'Williams': (
    <svg viewBox="0 0 120 60" fill="none" xmlns="http://www.w3.org/2000/svg">
      <text x="60" y="42" textAnchor="middle" fill="#64C4FF" fontSize="38" fontWeight="900" fontFamily="Arial,sans-serif">W</text>
    </svg>
  ),
  'Haas F1 Team': (
    <svg viewBox="0 0 120 60" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="14" y="14" width="36" height="32" rx="3" stroke="#B6BABD" strokeWidth="3.5" fill="none"/>
      <rect x="70" y="14" width="36" height="32" rx="3" stroke="#B6BABD" strokeWidth="3.5" fill="none"/>
      <line x1="50" y1="30" x2="70" y2="30" stroke="#B6BABD" strokeWidth="3.5" strokeLinecap="round"/>
    </svg>
  ),
  'Racing Bulls': (
    <svg viewBox="0 0 120 60" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="60" cy="30" rx="38" ry="22" stroke="#6692FF" strokeWidth="3" fill="none"/>
      <text x="60" y="36" textAnchor="middle" fill="#6692FF" fontSize="16" fontWeight="900" fontFamily="Arial,sans-serif">VCARB</text>
    </svg>
  ),
  'Sauber': (
    <svg viewBox="0 0 120 60" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="60" cy="30" r="24" stroke="#52E252" strokeWidth="3.5" fill="none"/>
      <path d="M44 30 L60 16 L76 30 L60 44 Z" fill="#52E252" opacity="0.85"/>
    </svg>
  ),
  'Cadillac': (
    <svg viewBox="0 0 120 60" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="18" width="100" height="24" rx="4" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5"/>
      <text x="60" y="35" textAnchor="middle" fill="#fff" fontSize="13" fontWeight="900" fontFamily="Arial,sans-serif" letterSpacing="1">CADILLAC</text>
    </svg>
  ),
}

function normTeam(name) {
  if (!name) return null
  const map = {
    'mercedes': 'Mercedes',
    'ferrari': 'Ferrari', 'scuderia ferrari': 'Ferrari',
    'mclaren': 'McLaren', 'mclaren f1': 'McLaren',
    'red bull': 'Red Bull Racing', 'oracle red bull': 'Red Bull Racing',
    'aston martin': 'Aston Martin',
    'alpine': 'Alpine', 'bwt alpine': 'Alpine',
    'williams': 'Williams',
    'haas': 'Haas F1 Team', 'moneygram haas': 'Haas F1 Team',
    'racing bulls': 'Racing Bulls', 'visa cash app rb': 'Racing Bulls', 'rb formula': 'Racing Bulls',
    'sauber': 'Sauber', 'kick sauber': 'Sauber', 'stake': 'Sauber',
    'cadillac': 'Cadillac', 'andretti': 'Cadillac',
  }
  const lower = name.toLowerCase()
  for (const [k, v] of Object.entries(map)) {
    if (lower.includes(k)) return v
  }
  return name
}

export function TeamLogo({ team, size = 52 }) {
  const key = normTeam(team)
  const svg = LOGOS[key] ?? LOGOS[Object.keys(LOGOS).find(k => key?.includes(k) || k?.includes(key?.split(' ')[0])) ?? '']
  if (!svg) return <div style={{width:size,height:size*0.55,background:'rgba(255,255,255,0.05)',borderRadius:4}}/>
  return (
    <div style={{width:size,height:size*0.55,display:'flex',alignItems:'center',justifyContent:'center'}}>
      {svg}
    </div>
  )
}
