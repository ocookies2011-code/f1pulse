// Circuit maps from formula-timer.com - load directly in browser img tags
// Fallback to our inline SVG if image fails

const FT = 'https://formula-timer.com/circuits'

export const CIRCUIT_IMAGES = {
  'Albert Park':   `${FT}/albert_park.png`,
  'Shanghai':      `${FT}/shanghai.png`,
  'Suzuka':        `${FT}/suzuka.png`,
  'Sakhir':        `${FT}/bahrain.png`,
  'Jeddah':        `${FT}/jeddah.png`,
  'Miami Gardens': `${FT}/miami.png`,
  'Imola':         `${FT}/imola.png`,
  'Monaco':        `${FT}/monaco.png`,
  'Montréal':      `${FT}/villeneuve.png`,
  'Spielberg':     `${FT}/spielberg.png`,
  'Silverstone':   `${FT}/silverstone.png`,
  'Budapest':      `${FT}/budapest.png`,
  'Spa':           `${FT}/spa.png`,
  'Zandvoort':     `${FT}/zandvoort.png`,
  'Monza':         `${FT}/monza.png`,
  'Baku':          `${FT}/baku.png`,
  'Singapore':     `${FT}/singapore.png`,
  'Austin':        `${FT}/austin.png`,
  'Mexico City':   `${FT}/mexico.png`,
  'São Paulo':     `${FT}/sao_paulo.png`,
  'Las Vegas':     `${FT}/las_vegas.png`,
  'Lusail':        `${FT}/losail.png`,
  'Yas Marina':    `${FT}/yas_marina.png`,
  'Barcelona':     `${FT}/barcelona.png`,
}

export function getCircuitImage(name) {
  if (!name) return null
  const direct = CIRCUIT_IMAGES[name]
  if (direct) return direct
  const key = Object.keys(CIRCUIT_IMAGES).find(k =>
    name.toLowerCase().includes(k.toLowerCase()) ||
    k.toLowerCase().includes(name.toLowerCase().split(' ')[0])
  )
  return key ? CIRCUIT_IMAGES[key] : null
}
