// Team logos from formula-timer.com - load directly in browser img tags (no CORS needed)
// Fallback to inline SVG if image fails to load

const FT = 'https://formula-timer.com/teams'

const TEAM_LOGOS = {
  'McLaren':        `${FT}/mclaren.svg`,
  'Ferrari':        `${FT}/ferrari.svg`,
  'Mercedes':       `${FT}/mercedes.svg`,
  'Red Bull Racing':`${FT}/red-bull.svg`,
  'Aston Martin':   `${FT}/aston-martin.svg`,
  'Alpine':         `${FT}/alpine.svg`,
  'Williams':       `${FT}/williams.svg`,
  'Haas F1 Team':   `${FT}/haas.svg`,
  'Racing Bulls':   `${FT}/rb.svg`,
  'Sauber':         `${FT}/audi.svg`,
  'Cadillac':       `${FT}/cadillac.svg`,
}

const TEAM_COLOURS = {
  'McLaren': '#FF8000', 'Ferrari': '#DC0000', 'Mercedes': '#00D2BE',
  'Red Bull Racing': '#3671C6', 'Aston Martin': '#006F51', 'Alpine': '#FF87BC',
  'Williams': '#64C4FF', 'Haas F1 Team': '#B6BABD', 'Racing Bulls': '#5B8AF5',
  'Sauber': '#52E252', 'Cadillac': '#ffffff',
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
  if (lower.includes('racing bulls') || lower.includes('vcarb') || lower.includes('visa cash') || lower.includes(' rb ') || lower.includes('rb f1')) return 'Racing Bulls'
  if (lower.includes('sauber') || lower.includes('kick') || lower.includes('stake') || lower.includes('audi')) return 'Sauber'
  if (lower.includes('cadillac') || lower.includes('andretti')) return 'Cadillac'
  return name
}

// Fallback inline SVGs per team colour
const FALLBACK = {
  'McLaren':        (c) => `<path d="M5 60 Q40 8 80 16 Q120 8 155 60 Q120 54 80 50 Q40 54 5 60Z" fill="${c}"/>`,
  'Ferrari':        (c) => `<rect x="5" y="5" width="70" height="90" rx="4" fill="${c}"/><text x="40" y="58" text-anchor="middle" fill="#FFD700" font-size="20" font-weight="900" font-family="Arial">SF</text>`,
  'Mercedes':       (c) => `<circle cx="80" cy="80" r="70" stroke="${c}" stroke-width="8" fill="none"/><line x1="80" y1="10" x2="80" y2="80" stroke="${c}" stroke-width="8" stroke-linecap="round"/><line x1="80" y1="80" x2="19" y2="115" stroke="${c}" stroke-width="8" stroke-linecap="round"/><line x1="80" y1="80" x2="141" y2="115" stroke="${c}" stroke-width="8" stroke-linecap="round"/>`,
  'Red Bull Racing':(c) => `<text x="80" y="55" text-anchor="middle" fill="#CC1E2B" font-size="28" font-weight="900" font-family="Arial">RED</text><text x="80" y="90" text-anchor="middle" fill="${c}" font-size="28" font-weight="900" font-family="Arial">BULL</text>`,
  'Aston Martin':   (c) => `<text x="80" y="90" text-anchor="middle" fill="${c}" font-size="18" font-weight="900" font-family="Arial" letter-spacing="2">ASTON</text>`,
  'Alpine':         (c) => `<path d="M10 120 L80 15 L150 120" stroke="${c}" stroke-width="10" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
  'Williams':       (c) => `<text x="80" y="115" text-anchor="middle" fill="${c}" font-size="130" font-weight="900" font-family="Arial">W</text>`,
  'Haas F1 Team':   (c) => `<text x="80" y="95" text-anchor="middle" fill="${c}" font-size="52" font-weight="900" font-family="Arial">HAAS</text>`,
  'Racing Bulls':   (c) => `<text x="80" y="95" text-anchor="middle" fill="${c}" font-size="38" font-weight="900" font-family="Arial">VCARB</text>`,
  'Sauber':         (c) => `<path d="M130 30 A60 60 0 1 0 130 130" stroke="${c}" stroke-width="16" fill="none" stroke-linecap="round"/>`,
  'Cadillac':       (c) => `<text x="80" y="90" text-anchor="middle" fill="${c}" font-size="20" font-weight="900" font-family="Arial" letter-spacing="2">CADILLAC</text>`,
}

export function TeamLogo({ team, size = 52 }) {
  const key = normTeam(team)
  const src = TEAM_LOGOS[key]
  const col = TEAM_COLOURS[key] ?? '#777'
  const fallbackPath = FALLBACK[key]?.(col) ?? `<text x="80" y="90" text-anchor="middle" fill="${col}" font-size="28" font-weight="900" font-family="Arial">${key?.slice(0,3)??'?'}</text>`
  const h = Math.round(size * 0.65)

  return (
    <div style={{ width: size, height: h, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
      <img
        src={src}
        alt={key ?? team}
        width={size}
        height={h}
        style={{ maxWidth: size, maxHeight: h, objectFit: 'contain', display: 'block' }}
        onError={e => {
          e.target.style.display = 'none'
          const fb = e.target.nextSibling
          if (fb) fb.style.display = 'flex'
        }}
      />
      <div style={{ display: 'none', position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center' }}>
        <svg viewBox="0 0 160 140" width={size} height={h} xmlns="http://www.w3.org/2000/svg"
          dangerouslySetInnerHTML={{ __html: fallbackPath }} />
      </div>
    </div>
  )
}
