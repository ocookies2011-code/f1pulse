// Official F1 team logos from media.formula1.com
// Fallback to clean inline SVGs if the CDN image fails

const F1_TEAM_CDN = 'https://media.formula1.com/content/dam/fom-website/teams/2025'

const TEAM_LOGO_URLS = {
  'Mercedes':       `${F1_TEAM_CDN}/mercedes-logo.png.transform/2col/image.png`,
  'Ferrari':        `${F1_TEAM_CDN}/ferrari-logo.png.transform/2col/image.png`,
  'McLaren':        `${F1_TEAM_CDN}/mclaren-logo.png.transform/2col/image.png`,
  'Red Bull Racing':`${F1_TEAM_CDN}/red-bull-racing-logo.png.transform/2col/image.png`,
  'Aston Martin':   `${F1_TEAM_CDN}/aston-martin-logo.png.transform/2col/image.png`,
  'Alpine':         `${F1_TEAM_CDN}/alpine-logo.png.transform/2col/image.png`,
  'Williams':       `${F1_TEAM_CDN}/williams-logo.png.transform/2col/image.png`,
  'Haas F1 Team':   `${F1_TEAM_CDN}/haas-logo.png.transform/2col/image.png`,
  'Racing Bulls':   `${F1_TEAM_CDN}/rb-logo.png.transform/2col/image.png`,
  'Sauber':         `${F1_TEAM_CDN}/kick-sauber-logo.png.transform/2col/image.png`,
}

// Clean inline SVG fallbacks (shown if CDN fails)
const SVG_FALLBACKS = {
  'Mercedes': '#27F4D2',
  'Ferrari': '#E8002D',
  'McLaren': '#FF8000',
  'Red Bull Racing': '#3671C6',
  'Aston Martin': '#229971',
  'Alpine': '#FF87BC',
  'Williams': '#64C4FF',
  'Haas F1 Team': '#B6BABD',
  'Racing Bulls': '#6692FF',
  'Sauber': '#52E252',
  'Cadillac': '#ffffff',
}

const TEAM_INITIALS = {
  'Mercedes': 'AMG', 'Ferrari': 'SF', 'McLaren': 'MCL',
  'Red Bull Racing': 'RBR', 'Aston Martin': 'AMR', 'Alpine': 'ALP',
  'Williams': 'WIL', 'Haas F1 Team': 'HAA', 'Racing Bulls': 'RB',
  'Sauber': 'SAU', 'Cadillac': 'CAD',
}

function normTeam(name) {
  if (!name) return null
  const lower = name.toLowerCase()
  const map = {
    'mercedes': 'Mercedes', 'ferrari': 'Ferrari', 'scuderia ferrari': 'Ferrari',
    'mclaren': 'McLaren', 'red bull': 'Red Bull Racing', 'oracle red bull': 'Red Bull Racing',
    'aston martin': 'Aston Martin', 'alpine': 'Alpine', 'bwt alpine': 'Alpine',
    'williams': 'Williams', 'haas': 'Haas F1 Team', 'moneygram haas': 'Haas F1 Team',
    'racing bulls': 'Racing Bulls', 'visa cash app rb': 'Racing Bulls', 'vcarb': 'Racing Bulls',
    'sauber': 'Sauber', 'kick sauber': 'Sauber', 'stake': 'Sauber',
    'cadillac': 'Cadillac', 'andretti': 'Cadillac',
  }
  for (const [k, v] of Object.entries(map)) {
    if (lower.includes(k)) return v
  }
  return name
}

export function TeamLogo({ team, size = 52 }) {
  const key = normTeam(team)
  const url = TEAM_LOGO_URLS[key]
  const col = SVG_FALLBACKS[key] ?? '#555555'
  const initials = TEAM_INITIALS[key] ?? key?.slice(0,3).toUpperCase() ?? '?'
  const h = Math.round(size * 0.55)

  if (url) {
    return (
      <div style={{ width: size, height: h, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <img
          src={url}
          alt={team}
          style={{ maxWidth: size, maxHeight: h, objectFit: 'contain', display: 'block', filter: 'brightness(0) invert(1)' }}
          onError={e => {
            e.target.style.display = 'none'
            if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex'
          }}
        />
        <div style={{
          display: 'none', position: 'absolute', inset: 0,
          alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-mono)', fontWeight: 900, fontSize: size * 0.18,
          color: col, letterSpacing: '0.05em',
        }}>
          {initials}
        </div>
      </div>
    )
  }

  // No URL - show initials with colour
  return (
    <div style={{
      width: size, height: h,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-mono)', fontWeight: 900, fontSize: size * 0.2,
      color: col, letterSpacing: '0.05em',
    }}>
      {initials}
    </div>
  )
}
