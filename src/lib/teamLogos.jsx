// Real F1 team logos using Wikipedia SVG sources + inline SVG fallbacks
const LOGO_URLS = {
  'Mercedes':       'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/Mercedes_AMG_Petronas_2021_logo.svg/200px-Mercedes_AMG_Petronas_2021_logo.svg.png',
  'Ferrari':        'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/Ferrari_logo_2002.svg/200px-Ferrari_logo_2002.svg.png',
  'McLaren':        'https://upload.wikimedia.org/wikipedia/commons/thumb/5/54/McLaren_Racing_logo.svg/200px-McLaren_Racing_logo.svg.png',
  'Red Bull Racing':'https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/Red_Bull_Racing_logo.svg/200px-Red_Bull_Racing_logo.svg.png',
  'Aston Martin':   'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Aston_Martin_F1_Logo.svg/200px-Aston_Martin_F1_Logo.svg.png',
  'Alpine':         'https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/BWT_Alpine_F1_Team_logo.svg/200px-BWT_Alpine_F1_Team_logo.svg.png',
  'Williams':       'https://upload.wikimedia.org/wikipedia/commons/thumb/8/81/Williams_Racing_logo.svg/200px-Williams_Racing_logo.svg.png',
  'Haas F1 Team':   'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/Haas_F1_Team_logo.svg/200px-Haas_F1_Team_logo.svg.png',
  'Racing Bulls':   'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d8/Visa_Cash_App_RB_Formula_One_Team_Logo.svg/200px-Visa_Cash_App_RB_Formula_One_Team_Logo.svg.png',
  'Sauber':         'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Sauber_Motorsport_Logo.svg/200px-Sauber_Motorsport_Logo.svg.png',
  'Cadillac':       null,
}

// Inline SVG fallbacks per team
const FALLBACK_SVGS = {
  'Mercedes':  '<circle cx="50" cy="30" r="22" stroke="#27F4D2" stroke-width="3" fill="none"/><path d="M50 8 L50 30 L28 42" stroke="#27F4D2" stroke-width="3" stroke-linecap="round"/><path d="M50 30 L72 42" stroke="#27F4D2" stroke-width="3" stroke-linecap="round"/><circle cx="50" cy="30" r="4" fill="#27F4D2"/>',
  'Ferrari':   '<path d="M50 6 C42 10 36 18 38 26 C40 34 50 30 50 42 C50 30 60 34 62 26 C64 18 58 10 50 6Z" fill="#E8002D"/><rect x="36" y="44" width="28" height="5" rx="1" fill="#FFD700"/>',
  'McLaren':   '<path d="M10 38 Q30 10 50 14 Q70 10 90 38 Q70 35 50 32 Q30 35 10 38Z" fill="#FF8000"/>',
  'Red Bull Racing': '<circle cx="30" cy="25" r="15" fill="#3671C6"/><circle cx="70" cy="25" r="15" fill="#CC1E2B"/><path d="M30 40 Q50 52 70 40" stroke="#FFD700" stroke-width="2.5" fill="none"/>',
  'Aston Martin': '<path d="M50 6 L18 50 L82 50 Z" stroke="#229971" stroke-width="3" fill="none"/><circle cx="50" cy="33" r="5" fill="#229971"/>',
  'Alpine':    '<path d="M10 50 L50 10 L90 50" stroke="#FF87BC" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
  'Williams':  '<path d="M10 20 L25 45 L40 20 L55 45 L70 20 L85 38" stroke="#64C4FF" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
  'Haas F1 Team': '<rect x="15" y="15" width="30" height="28" rx="2" stroke="#B6BABD" stroke-width="3" fill="none"/><rect x="55" y="15" width="30" height="28" rx="2" stroke="#B6BABD" stroke-width="3" fill="none"/><line x1="45" y1="29" x2="55" y2="29" stroke="#B6BABD" stroke-width="3"/>',
  'Racing Bulls': '<ellipse cx="50" cy="30" rx="30" ry="20" stroke="#6692FF" stroke-width="3" fill="none"/><text x="50" y="35" text-anchor="middle" fill="#6692FF" font-size="14" font-weight="900" font-family="sans-serif">RB</text>',
  'Sauber':    '<circle cx="50" cy="30" r="22" stroke="#52E252" stroke-width="3" fill="none"/><path d="M38 30 L50 20 L62 30 L50 40 Z" fill="#52E252"/>',
  'Cadillac':  '<text x="50" y="35" text-anchor="middle" fill="#fff" font-size="13" font-weight="900" font-family="sans-serif">CADILLAC</text>',
}

function getFallback(team) {
  const key = Object.keys(FALLBACK_SVGS).find(k =>
    team?.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(team?.toLowerCase())
  )
  return key ? FALLBACK_SVGS[key] : null
}

function getLogoUrl(team) {
  if (!team) return null
  const direct = LOGO_URLS[team]
  if (direct !== undefined) return direct
  const key = Object.keys(LOGO_URLS).find(k =>
    team.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(team.toLowerCase())
  )
  return key ? LOGO_URLS[key] : null
}

export function TeamLogo({ team, size = 48 }) {
  const url = getLogoUrl(team)
  const fallback = getFallback(team)

  if (url) {
    return (
      <img
        src={url}
        alt={team}
        style={{ width: size, height: size * 0.6, objectFit: 'contain', display: 'block' }}
        onError={e => {
          e.target.style.display = 'none'
          if (e.target.nextSibling) e.target.nextSibling.style.display = 'block'
        }}
      />
    )
  }

  // Fallback SVG
  return (
    <svg viewBox="0 0 100 60" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ width: size, height: size * 0.6 }}
      dangerouslySetInnerHTML={{ __html: fallback ?? '' }}
    />
  )
}
