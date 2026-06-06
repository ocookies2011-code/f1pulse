// Official F1 circuit map images from media.formula1.com (Cloudinary CDN)
// These load correctly in browser img tags
const F1_CDN = 'https://media.formula1.com/image/upload/f_auto/q_auto/v0/fom-website/2018-redesign-assets/Circuit%20maps%2016x9'

export const CIRCUIT_IMAGES = {
  'Albert Park':   `${F1_CDN}/Australia_Circuit.png`,
  'Shanghai':      `${F1_CDN}/China_Circuit.png`,
  'Suzuka':        `${F1_CDN}/Japan_Circuit.png`,
  'Sakhir':        `${F1_CDN}/Bahrain_Circuit.png`,
  'Jeddah':        `${F1_CDN}/Saudi_Arabia_Circuit.png`,
  'Miami Gardens': `${F1_CDN}/Miami_Circuit.png`,
  'Imola':         `${F1_CDN}/Emilia_Romagna_Circuit.png`,
  'Monaco':        `${F1_CDN}/Monaco_Circuit.png`,
  'Montréal':      `${F1_CDN}/Canada_Circuit.png`,
  'Spielberg':     `${F1_CDN}/Austria_Circuit.png`,
  'Silverstone':   `${F1_CDN}/Great_Britain_Circuit.png`,
  'Budapest':      `${F1_CDN}/Hungary_Circuit.png`,
  'Spa':           `${F1_CDN}/Belgium_Circuit.png`,
  'Zandvoort':     `${F1_CDN}/Netherlands_Circuit.png`,
  'Monza':         `${F1_CDN}/Italy_Circuit.png`,
  'Baku':          `${F1_CDN}/Azerbaijan_Circuit.png`,
  'Singapore':     `${F1_CDN}/Singapore_Circuit.png`,
  'Austin':        `${F1_CDN}/USA_Circuit.png`,
  'Mexico City':   `${F1_CDN}/Mexico_Circuit.png`,
  'São Paulo':     `${F1_CDN}/Brazil_Circuit.png`,
  'Las Vegas':     `${F1_CDN}/Las_Vegas_Circuit.png`,
  'Lusail':        `${F1_CDN}/Qatar_Circuit.png`,
  'Yas Marina':    `${F1_CDN}/Abu_Dhabi_Circuit.png`,
  'Barcelona':     `${F1_CDN}/Spain_Circuit.png`,
}

export function getCircuitImage(name) {
  if (!name) return null
  const direct = CIRCUIT_IMAGES[name]
  if (direct) return direct
  // Fuzzy match
  const key = Object.keys(CIRCUIT_IMAGES).find(k =>
    name.toLowerCase().includes(k.toLowerCase()) ||
    k.toLowerCase().includes(name.toLowerCase().split(' ')[0])
  )
  return key ? CIRCUIT_IMAGES[key] : null
}
