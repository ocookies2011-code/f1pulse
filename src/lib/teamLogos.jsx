// SVG logo paths for each F1 team - rendered inline so no external deps
export const TEAM_LOGOS = {
  'Mercedes': `<svg viewBox="0 0 100 60" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="30" r="22" stroke="#27F4D2" stroke-width="3" fill="none"/>
    <path d="M50 8 L50 30 L28 42" stroke="#27F4D2" stroke-width="3" stroke-linecap="round"/>
    <path d="M50 30 L72 42" stroke="#27F4D2" stroke-width="3" stroke-linecap="round"/>
    <circle cx="50" cy="30" r="4" fill="#27F4D2"/>
  </svg>`,
  'Ferrari': `<svg viewBox="0 0 100 60" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="30" y="8" width="40" height="44" rx="4" fill="#E8002D"/>
    <path d="M50 14 C44 18 38 22 40 28 C42 34 50 32 50 40 C50 32 58 34 60 28 C62 22 56 18 50 14Z" fill="#FFD700"/>
    <rect x="38" y="42" width="24" height="4" fill="#1a1a1a"/>
  </svg>`,
  'McLaren': `<svg viewBox="0 0 100 60" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M15 40 Q35 15 50 18 Q65 15 85 40 Q65 38 50 36 Q35 38 15 40Z" fill="#FF8000"/>
    <ellipse cx="50" cy="36" rx="20" ry="8" fill="#FF8000"/>
  </svg>`,
  'Red Bull Racing': `<svg viewBox="0 0 100 60" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="32" cy="28" r="14" fill="#3671C6"/>
    <circle cx="68" cy="28" r="14" fill="#CC1E2B"/>
    <path d="M32 42 Q50 52 68 42" stroke="#FFD700" stroke-width="2.5" fill="none"/>
    <circle cx="32" cy="22" r="5" fill="#FFD700"/>
    <circle cx="68" cy="22" r="5" fill="#FFD700"/>
  </svg>`,
  'Aston Martin': `<svg viewBox="0 0 100 60" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M50 8 L15 52 L85 52 Z" stroke="#229971" stroke-width="3" fill="none"/>
    <path d="M50 18 L25 48 L75 48 Z" stroke="#229971" stroke-width="1.5" fill="none" opacity="0.5"/>
    <circle cx="50" cy="35" r="5" fill="#229971"/>
  </svg>`,
  'Alpine': `<svg viewBox="0 0 100 60" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M15 48 L50 12 L85 48" stroke="#FF87BC" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M28 48 L50 24 L72 48" stroke="#0078D4" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,
  'Williams': `<svg viewBox="0 0 100 60" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M15 20 L30 40 L45 20 L60 40 L75 20 L85 35" stroke="#64C4FF" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,
  'Haas F1 Team': `<svg viewBox="0 0 100 60" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="18" y="18" width="28" height="24" rx="2" stroke="#B6BABD" stroke-width="3" fill="none"/>
    <rect x="54" y="18" width="28" height="24" rx="2" stroke="#B6BABD" stroke-width="3" fill="none"/>
    <line x1="46" y1="30" x2="54" y2="30" stroke="#B6BABD" stroke-width="3"/>
  </svg>`,
  'Racing Bulls': `<svg viewBox="0 0 100 60" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 35 Q30 15 50 18 Q70 15 80 35 L75 45 Q60 38 50 40 Q40 38 25 45 Z" fill="#6692FF" opacity="0.9"/>
    <circle cx="35" cy="28" r="5" fill="white" opacity="0.8"/>
    <circle cx="65" cy="28" r="5" fill="white" opacity="0.8"/>
    <path d="M42 22 L50 18 L58 22" stroke="white" stroke-width="2" fill="none" opacity="0.8"/>
  </svg>`,
  'Cadillac': `<svg viewBox="0 0 100 60" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="20" y="15" width="60" height="30" rx="3" stroke="white" stroke-width="2.5" fill="none"/>
    <path d="M32 15 L32 45" stroke="white" stroke-width="1.5" opacity="0.6"/>
    <path d="M68 15 L68 45" stroke="white" stroke-width="1.5" opacity="0.6"/>
    <path d="M20 30 L80 30" stroke="white" stroke-width="1.5" opacity="0.4"/>
    <rect x="38" y="22" width="24" height="16" rx="2" fill="white" opacity="0.15"/>
  </svg>`,
  'Sauber': `<svg viewBox="0 0 100 60" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 40 Q20 15 50 15 Q80 15 80 40 Q65 32 50 32 Q35 32 20 40Z" fill="#52E252" opacity="0.85"/>
    <circle cx="50" cy="32" r="8" stroke="#52E252" stroke-width="2" fill="none"/>
  </svg>`,
}

export function TeamLogo({ team, size = 48, className = '' }) {
  const svg = TEAM_LOGOS[team]
  if (!svg) return null
  return (
    <div
      className={className}
      style={{ width: size, height: Math.round(size * 0.6), flexShrink: 0 }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}
