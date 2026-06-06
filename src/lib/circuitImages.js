// Real circuit track map images
// Using Wikimedia Commons SVG maps (freely licensed, high quality)
export const CIRCUIT_IMAGES = {
  'Albert Park':    'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/Albert_Park_circuit_map.svg/320px-Albert_Park_circuit_map.svg.png',
  'Shanghai':       'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Shanghai_International_Circuit_map.svg/320px-Shanghai_International_Circuit_map.svg.png',
  'Suzuka':         'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Suzuka_circuit_map.svg/320px-Suzuka_circuit_map.svg.png',
  'Sakhir':         'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/Bahrain_International_Circuit_map.svg/320px-Bahrain_International_Circuit_map.svg.png',
  'Jeddah':         'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Jeddah_Street_Circuit_2021.svg/320px-Jeddah_Street_Circuit_2021.svg.png',
  'Miami Gardens':  'https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Miami_International_Autodrome_Circuit_map.svg/320px-Miami_International_Autodrome_Circuit_map.svg.png',
  'Imola':          'https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/Autodromo_Enzo_e_Dino_Ferrari_map.svg/320px-Autodromo_Enzo_e_Dino_Ferrari_map.svg.png',
  'Monaco':         'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Circuit_de_Monaco_map.svg/320px-Circuit_de_Monaco_map.svg.png',
  'Montréal':       'https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Circuit_Gilles_Villeneuve_map.svg/320px-Circuit_Gilles_Villeneuve_map.svg.png',
  'Spielberg':      'https://upload.wikimedia.org/wikipedia/commons/thumb/2/29/Red_Bull_Ring_Circuit_map.svg/320px-Red_Bull_Ring_Circuit_map.svg.png',
  'Silverstone':    'https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/Silverstone_Circuit_2020.svg/320px-Silverstone_Circuit_2020.svg.png',
  'Budapest':       'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Hungaroring_track_map.svg/320px-Hungaroring_track_map.svg.png',
  'Spa':            'https://upload.wikimedia.org/wikipedia/commons/thumb/0/03/Spa-Francorchamps_circuit_map.svg/320px-Spa-Francorchamps_circuit_map.svg.png',
  'Zandvoort':      'https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Circuit_Zandvoort_map.svg/320px-Circuit_Zandvoort_map.svg.png',
  'Monza':          'https://upload.wikimedia.org/wikipedia/commons/thumb/d/dc/Monza_track_map.svg/320px-Monza_track_map.svg.png',
  'Baku':           'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Baku_City_Circuit_map.svg/320px-Baku_City_Circuit_map.svg.png',
  'Singapore':      'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/Singapore_street_circuit_2023.svg/320px-Singapore_street_circuit_2023.svg.png',
  'Austin':         'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/COTA_USA_circuit_map.svg/320px-COTA_USA_circuit_map.svg.png',
  'Mexico City':    'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Autodrome_Hermanos_Rodriguez_GP.svg/320px-Autodrome_Hermanos_Rodriguez_GP.svg.png',
  'São Paulo':      'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Autodromo_Jose_Carlos_Pace_track_map.svg/320px-Autodromo_Jose_Carlos_Pace_track_map.svg.png',
  'Las Vegas':      'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Las_Vegas_Street_Circuit_Map.svg/320px-Las_Vegas_Street_Circuit_Map.svg.png',
  'Lusail':         'https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/Losail_International_Circuit_track_map.svg/320px-Losail_International_Circuit_track_map.svg.png',
  'Yas Marina':     'https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/Yas_Marina_Circuit_F1_2021.svg/320px-Yas_Marina_Circuit_F1_2021.svg.png',
  'Barcelona':      'https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/Circuit_de_Catalunya_2020_track_map.svg/320px-Circuit_de_Catalunya_2020_track_map.svg.png',
}

// Fallback: match by partial name
export function getCircuitImage(name) {
  if (!name) return null
  const direct = CIRCUIT_IMAGES[name]
  if (direct) return direct
  const key = Object.keys(CIRCUIT_IMAGES).find(k =>
    name.toLowerCase().includes(k.toLowerCase()) ||
    k.toLowerCase().includes(name.toLowerCase())
  )
  return key ? CIRCUIT_IMAGES[key] : null
}
