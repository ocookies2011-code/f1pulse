// Real F1 team car/livery images + logos from official sources
// Using Wikimedia Commons for freely licensed images
export const TEAM_IMAGES = {
  'Mercedes': {
    car: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Mercedes_AMG_F1_W15_2024.jpg/320px-Mercedes_AMG_F1_W15_2024.jpg',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/Mercedes_AMG_Petronas_2021_logo.svg/200px-Mercedes_AMG_Petronas_2021_logo.svg.png',
    color: '#27F4D2',
  },
  'Ferrari': {
    car: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Charles_Leclerc_2024_Bahrain.jpg/320px-Charles_Leclerc_2024_Bahrain.jpg',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/Ferrari_logo_2002.svg/200px-Ferrari_logo_2002.svg.png',
    color: '#E8002D',
  },
  'McLaren': {
    car: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/McLaren_MCL38_2024_Bahrain.jpg/320px-McLaren_MCL38_2024_Bahrain.jpg',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/54/McLaren_Racing_logo.svg/200px-McLaren_Racing_logo.svg.png',
    color: '#FF8000',
  },
  'Red Bull Racing': {
    car: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Max_Verstappen_2024_Bahrain.jpg/320px-Max_Verstappen_2024_Bahrain.jpg',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/Red_Bull_Racing_logo.svg/200px-Red_Bull_Racing_logo.svg.png',
    color: '#3671C6',
  },
  'Aston Martin': {
    car: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/Fernando_Alonso_2024_Bahrain.jpg/320px-Fernando_Alonso_2024_Bahrain.jpg',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/Aston_Martin_Aramco_Cognizant_F1_Team_Logo.svg/200px-Aston_Martin_Aramco_Cognizant_F1_Team_Logo.svg.png',
    color: '#229971',
  },
  'Alpine': {
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/BWT_Alpine_F1_Team_logo.svg/200px-BWT_Alpine_F1_Team_logo.svg.png',
    color: '#FF87BC',
  },
  'Williams': {
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/81/Williams_Racing_logo.svg/200px-Williams_Racing_logo.svg.png',
    color: '#64C4FF',
  },
  'Haas F1 Team': {
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/Haas_F1_Team_logo.svg/200px-Haas_F1_Team_logo.svg.png',
    color: '#B6BABD',
  },
  'Racing Bulls': {
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d8/Visa_Cash_App_RB_Formula_One_Team_Logo.svg/200px-Visa_Cash_App_RB_Formula_One_Team_Logo.svg.png',
    color: '#6692FF',
  },
  'Sauber': {
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Sauber_Motorsport_Logo.svg/200px-Sauber_Motorsport_Logo.svg.png',
    color: '#52E252',
  },
}

export function getTeamImage(name) {
  if (!name) return null
  const direct = TEAM_IMAGES[name]
  if (direct) return direct
  const key = Object.keys(TEAM_IMAGES).find(k =>
    name.toLowerCase().includes(k.toLowerCase()) ||
    k.toLowerCase().includes(name.toLowerCase())
  )
  return key ? TEAM_IMAGES[key] : null
}
