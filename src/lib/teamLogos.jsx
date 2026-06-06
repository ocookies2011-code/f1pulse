// Team logos served from /public/logos/ — hosted on Vercel, zero CORS issues

const TEAM_LOGOS = {
  'McLaren':        '/logos/mclaren.svg',
  'Ferrari':        '/logos/ferrari.svg',
  'Mercedes':       '/logos/mercedes.svg',
  'Red Bull Racing':'/logos/redbull.svg',
  'Aston Martin':   '/logos/astonmartin.svg',
  'Alpine':         '/logos/alpine.svg',
  'Williams':       '/logos/williams.svg',
  'Haas F1 Team':   '/logos/haas.svg',
  'Racing Bulls':   '/logos/racingbulls.svg',
  'Sauber':         '/logos/sauber.svg',
  'Cadillac':       '/logos/cadillac.svg',
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
  if (lower.includes('racing bulls') || lower.includes('vcarb') || lower.includes('visa cash')) return 'Racing Bulls'
  if (lower.includes('sauber') || lower.includes('kick') || lower.includes('stake')) return 'Sauber'
  if (lower.includes('cadillac') || lower.includes('andretti')) return 'Cadillac'
  return name
}

export function TeamLogo({ team, size = 52 }) {
  const key = normTeam(team)
  const src = TEAM_LOGOS[key]
  const col = TEAM_COLOURS[key] ?? '#555555'
  const initials = key?.split(' ').map(w => w[0]).join('').slice(0, 3) ?? '?'
  const h = Math.round(size * 0.6)

  if (!src) {
    return (
      <div style={{
        width: size, height: h, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'monospace', fontWeight: 900, fontSize: size * 0.22, color: col,
      }}>
        {initials}
      </div>
    )
  }

  return (
    <div style={{ width: size, height: h, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <img
        src={src}
        alt={key ?? team}
        style={{ maxWidth: size, maxHeight: h, objectFit: 'contain', display: 'block' }}
        onError={e => {
          e.target.style.display = 'none'
          if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex'
        }}
      />
      <div style={{
        display: 'none', width: size, height: h,
        alignItems: 'center', justifyContent: 'center',
        fontFamily: 'monospace', fontWeight: 900, fontSize: size * 0.22, color: col,
      }}>
        {initials}
      </div>
    </div>
  )
}
