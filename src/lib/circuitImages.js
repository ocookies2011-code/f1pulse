// Circuit maps from formula-timer.com
// Slug mapping matches their /circuit/{slug} pages exactly
const FT = 'https://formula-timer.com/circuits'

export const CIRCUIT_IMAGES = {
  // Round 1-5
  'Albert Park':   `${FT}/albert_park.png`,
  'Shanghai':      `${FT}/shanghai.png`,
  'Suzuka':        `${FT}/suzuka.png`,
  'Sakhir':        `${FT}/bahrain.png`,
  'Jeddah':        `${FT}/jeddah.png`,
  // Round 6-10
  'Miami Gardens': `${FT}/miami.png`,
  'Imola':         `${FT}/imola.png`,
  'Monaco':        `${FT}/monaco.png`,
  'Montréal':      `${FT}/villeneuve.png`,
  'Spielberg':     `${FT}/spielberg.png`,
  // Round 11-15
  'Silverstone':   `${FT}/silverstone.png`,
  'Budapest':      `${FT}/budapest.png`,
  'Spa':           `${FT}/spa.png`,
  'Zandvoort':     `${FT}/zandvoort.png`,
  'Monza':         `${FT}/monza.png`,
  // Round 16-20
  'Baku':          `${FT}/baku.png`,
  'Singapore':     `${FT}/singapore.png`,
  'Austin':        `${FT}/austin.png`,
  'Mexico City':   `${FT}/mexico.png`,
  'São Paulo':     `${FT}/sao_paulo.png`,
  // Round 21-24
  'Las Vegas':     `${FT}/las_vegas.png`,
  'Lusail':        `${FT}/losail.png`,
  'Yas Marina':    `${FT}/yas_marina.png`,
  'Barcelona':     `${FT}/barcelona.png`,
}

// Broader matching for API circuit names that may not match exactly
const SLUG_MAP = {
  'monte carlo': 'monaco', 'monte-carlo': 'monaco',
  'albert': 'albert_park', 'melbourne': 'albert_park',
  'suzuka': 'suzuka', 'japan': 'suzuka',
  'sakhir': 'bahrain', 'bahrain': 'bahrain',
  'jeddah': 'jeddah', 'saudi': 'jeddah',
  'miami': 'miami',
  'imola': 'imola', 'emilia': 'imola',
  'villeneuve': 'villeneuve', 'montreal': 'villeneuve', 'montréal': 'villeneuve', 'canada': 'villeneuve',
  'spielberg': 'spielberg', 'austria': 'spielberg', 'red bull ring': 'spielberg',
  'silverstone': 'silverstone', 'britain': 'silverstone',
  'budapest': 'budapest', 'hungary': 'budapest', 'hungaroring': 'budapest',
  'spa': 'spa', 'belgium': 'spa',
  'zandvoort': 'zandvoort', 'netherlands': 'zandvoort',
  'monza': 'monza', 'italy': 'monza',
  'baku': 'baku', 'azerbaijan': 'baku',
  'singapore': 'singapore',
  'austin': 'austin', 'cota': 'austin', 'usa': 'austin',
  'mexico': 'mexico',
  'são paulo': 'sao_paulo', 'sao paulo': 'sao_paulo', 'brazil': 'sao_paulo', 'interlagos': 'sao_paulo',
  'las vegas': 'las_vegas',
  'lusail': 'losail', 'losail': 'losail', 'qatar': 'losail',
  'yas': 'yas_marina', 'abu dhabi': 'yas_marina',
  'barcelona': 'barcelona', 'spain': 'barcelona', 'catalunya': 'barcelona',
  'shanghai': 'shanghai', 'china': 'shanghai',
}

export function getCircuitImage(name) {
  if (!name) return null
  // Direct match first
  const direct = CIRCUIT_IMAGES[name]
  if (direct) return direct
  // Try slug map
  const lower = name.toLowerCase()
  for (const [key, slug] of Object.entries(SLUG_MAP)) {
    if (lower.includes(key)) return `${FT}/${slug}.png`
  }
  // Fuzzy match on CIRCUIT_IMAGES keys
  const k = Object.keys(CIRCUIT_IMAGES).find(k =>
    lower.includes(k.toLowerCase()) || k.toLowerCase().includes(lower.split(' ')[0])
  )
  return k ? CIRCUIT_IMAGES[k] : null
}

// Also export slug lookup for use in circuit profiles
export function getCircuitSlug(name) {
  if (!name) return null
  const lower = name.toLowerCase()
  for (const [key, slug] of Object.entries(SLUG_MAP)) {
    if (lower.includes(key)) return slug
  }
  return null
}
