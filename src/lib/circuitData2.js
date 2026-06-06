// Shared F1 circuit data — SVG paths, corners, sectors, DRS zones
// Used by both LiveTiming track map and TrackMap page
export const CIRCUITS = {
  'Monaco': {
    // SVG path of the Monaco street circuit outline
    path: 'M 480 80 L 520 75 L 600 90 L 650 120 L 660 160 L 640 200 L 600 220 L 560 230 L 530 250 L 520 290 L 530 330 L 550 360 L 560 400 L 540 430 L 500 450 L 450 460 L 400 450 L 360 430 L 340 400 L 330 360 L 340 320 L 360 290 L 380 260 L 390 230 L 380 200 L 360 180 L 340 160 L 330 130 L 340 100 L 370 80 L 420 72 L 480 80 Z',
    corners: [
      {n:1,  x:530, y:95,  label:'Ste Dévote'},
      {n:3,  x:645, y:145, label:'Massenet'},
      {n:5,  x:645, y:195, label:'Casino'},
      {n:6,  x:570, y:228, label:'Mirabeau'},
      {n:8,  x:522, y:340, label:'Portier'},
      {n:10, x:543, y:415, label:'Tabac'},
      {n:11, x:495, y:455, label:'Piscine S1'},
      {n:13, x:420, y:455, label:'Piscine S2'},
      {n:14, x:365, y:425, label:'La Rascasse'},
      {n:15, x:338, y:390, label:'Antony Noghes'},
      {n:19, x:365, y:180, label:'Loews'},
      {n:20, x:335, y:125, label:'Portier'},
    ],
    sectors: [
      { id:1, color:'#3671C6', points:'530,95 645,145 645,195 570,228 522,340', label:'S1', midX:590, midY:160 },
      { id:2, color:'#E8002D', points:'522,340 543,415 495,455 420,455 365,425 338,390', label:'S2', midX:440, midY:440 },
      { id:3, color:'#FF8000', points:'338,390 365,180 335,125 340,100 370,80 420,72 480,80 530,95', label:'S3', midX:390, midY:110 },
    ],
    drs: [
      { x1:400, y1:72, x2:530, y2:80, label:'DRS 1' },
    ],
    viewBox: '280 60 420 420',
    startLine: { x:482, y:79, angle: 0 },
  },
  'Albert Park': {
    path: 'M 500 100 L 650 95 L 720 120 L 750 160 L 740 200 L 700 230 L 660 240 L 640 270 L 650 310 L 680 340 L 700 380 L 680 420 L 640 440 L 580 450 L 520 445 L 470 430 L 430 400 L 380 390 L 340 410 L 310 440 L 280 430 L 260 400 L 270 360 L 300 330 L 330 300 L 320 260 L 290 230 L 280 190 L 300 150 L 340 120 L 400 100 L 500 100 Z',
    corners: [
      {n:1,  x:575, y:95,  label:'Turn 1'},
      {n:3,  x:735, y:140, label:'Turn 3'},
      {n:6,  x:695, y:235, label:'Turn 6'},
      {n:9,  x:690, y:360, label:'Turn 9'},
      {n:11, x:610, y:447, label:'Turn 11'},
      {n:13, x:450, y:435, label:'Turn 13'},
      {n:14, x:385, y:395, label:'Turn 14'},
      {n:15, x:295, y:425, label:'Turn 15'},
      {n:16, x:265, y:395, label:'Turn 16'},
    ],
    sectors: [
      { id:1, color:'#3671C6', points:'500,100 650,95 720,120 750,160 740,200 700,230', label:'S1', midX:640, midY:140 },
      { id:2, color:'#E8002D', points:'700,230 660,240 640,270 650,310 680,340 700,380 680,420 640,440', label:'S2', midX:670, midY:320 },
      { id:3, color:'#FF8000', points:'640,440 580,450 520,445 470,430 430,400 380,390 340,410 310,440 280,430 260,400 270,360 300,330 330,300 320,260 290,230 280,190 300,150 340,120 400,100 500,100', label:'S3', midX:360, midY:290 },
    ],
    drs: [
      { x1:400, y1:100, x2:500, y2:100, label:'DRS 1' },
      { x1:690, y1:360, x2:710, y2:390, label:'DRS 2' },
    ],
    viewBox: '230 80 550 390',
    startLine: { x:500, y:100, angle: 0 },
  },

  'Suzuka': {
    path: 'M 500 120 L 600 110 L 680 140 L 720 190 L 710 250 L 670 300 L 640 350 L 660 400 L 690 440 L 670 480 L 620 490 L 560 470 L 520 440 L 480 400 L 450 360 L 420 380 L 400 420 L 370 440 L 330 430 L 300 400 L 290 350 L 310 300 L 350 270 L 390 240 L 400 200 L 380 160 L 400 130 L 440 115 L 500 120 Z',
    corners: [
      {n:1, x:560, y:112, label:'Turn 1'},
      {n:3, x:715, y:180, label:'S Curves'},
      {n:7, x:655, y:355, label:'Dunlop'},
      {n:11,x:685, y:460, label:'Hairpin'},
      {n:13,x:500, y:455, label:'Spoon'},
      {n:16,x:315, y:300, label:'130R'},
      {n:17,x:300, y:375, label:'Casio'},
    ],
    sectors: [
      { id:1, color:'#3671C6', points:'500,120 600,110 680,140 720,190 710,250', label:'S1', midX:640, midY:145 },
      { id:2, color:'#E8002D', points:'710,250 670,300 640,350 660,400 690,440 670,480 620,490', label:'S2', midX:680, midY:390 },
      { id:3, color:'#FF8000', points:'620,490 560,470 520,440 480,400 450,360 420,380 400,420 370,440 330,430 300,400 290,350 310,300 350,270 390,240 400,200 380,160 400,130 440,115 500,120', label:'S3', midX:370, midY:300 },
    ],
    drs: [
      { x1:500, y1:120, x2:600, y2:110, label:'DRS 1' },
      { x1:290, y1:350, x2:310, y2:300, label:'DRS 2' },
    ],
    viewBox: '260 100 480 410',
    startLine: { x:500, y:120, angle:0 },
  },
  'Monza': {
    path: 'M 350 150 L 550 140 L 650 160 L 700 200 L 720 260 L 700 320 L 650 360 L 580 380 L 520 370 L 480 340 L 460 380 L 470 430 L 440 460 L 400 465 L 360 450 L 330 420 L 320 380 L 340 340 L 380 310 L 390 270 L 360 240 L 310 230 L 280 200 L 290 160 L 320 145 L 350 150 Z',
    corners: [
      {n:1, x:450, y:143, label:'Prima Variante'},
      {n:4, x:690, y:195, label:'Curva Grande'},
      {n:7, x:710, y:295, label:'Seconda V.'},
      {n:8, x:635, y:365, label:'Lesmo 1'},
      {n:10,x:465, y:360, label:'Lesmo 2'},
      {n:11,x:450, y:440, label:'Ascari'},
      {n:14,x:350, y:460, label:'Parabolica'},
    ],
    sectors: [
      { id:1, color:'#3671C6', points:'350,150 550,140 650,160 700,200 720,260', label:'S1', midX:550, midY:148 },
      { id:2, color:'#E8002D', points:'720,260 700,320 650,360 580,380 520,370 480,340', label:'S2', midX:640, midY:330 },
      { id:3, color:'#FF8000', points:'480,340 460,380 470,430 440,460 400,465 360,450 330,420 320,380 340,340 380,310 390,270 360,240 310,230 280,200 290,160 320,145 350,150', label:'S3', midX:360, midY:300 },
    ],
    drs: [
      { x1:350, y1:150, x2:550, y2:140, label:'DRS 1' },
      { x1:320, y1:380, x2:350, y2:340, label:'DRS 2' },
    ],
    viewBox: '260 130 480 360',
    startLine: { x:350, y:150, angle:0 },
  },
  'Catalunya': {
    path: 'M 300 200 L 500 185 L 600 200 L 670 240 L 680 300 L 650 350 L 600 380 L 560 400 L 540 440 L 550 480 L 520 510 L 470 515 L 420 500 L 380 470 L 360 430 L 340 390 L 300 370 L 260 350 L 240 310 L 255 265 L 280 230 L 300 200 Z',
    corners: [
      {n:1, x:400, y:187, label:'Turn 1'},
      {n:3, x:665, y:230, label:'Repsol'},
      {n:5, x:670, y:325, label:'Seat'},
      {n:7, x:570, y:393, label:'La Caixa'},
      {n:9, x:537, y:460, label:'Campsa'},
      {n:10,x:487, y:513, label:'La Caixa'},
      {n:12,x:345, y:395, label:'Chicane'},
      {n:14,x:247, y:310, label:'New Holland'},
    ],
    sectors: [
      { id:1, color:'#3671C6', points:'300,200 500,185 600,200 670,240 680,300', label:'S1', midX:515, midY:192 },
      { id:2, color:'#E8002D', points:'680,300 650,350 600,380 560,400 540,440 550,480', label:'S2', midX:600, midY:400 },
      { id:3, color:'#FF8000', points:'550,480 520,510 470,515 420,500 380,470 360,430 340,390 300,370 260,350 240,310 255,265 280,230 300,200', label:'S3', midX:330, midY:380 },
    ],
    drs: [
      { x1:300, y1:200, x2:500, y2:185, label:'DRS 1' },
      { x1:260, y1:350, x2:240, y2:310, label:'DRS 2' },
    ],
    viewBox: '220 170 480 370',
    startLine: { x:300, y:200, angle:0 },
  },
  'Silverstone': {
    path: 'M 300 150 L 450 120 L 550 130 L 640 160 L 700 210 L 720 270 L 700 330 L 650 370 L 680 420 L 700 470 L 680 510 L 620 530 L 540 520 L 480 490 L 440 450 L 400 430 L 340 440 L 290 430 L 250 400 L 230 360 L 240 310 L 270 270 L 260 230 L 240 200 L 250 160 L 280 140 L 300 150 Z',
    corners: [
      {n:1,  x:370, y:125, label:'Abbey'},
      {n:3,  x:595, y:145, label:'Village'},
      {n:6,  x:710, y:240, label:'Brooklands'},
      {n:7,  x:710, y:300, label:'Luffield'},
      {n:9,  x:665, y:395, label:'Copse'},
      {n:10, x:690, y:445, label:'Maggotts'},
      {n:13, x:510, y:510, label:'Becketts'},
      {n:15, x:370, y:435, label:'Hangar S'},
      {n:16, x:295, y:432, label:'Stowe'},
      {n:18, x:237, y:335, label:'Vale'},
    ],
    sectors: [
      { id:1, color:'#3671C6', points:'300,150 450,120 550,130 640,160 700,210 720,270', label:'S1', midX:530, midY:145 },
      { id:2, color:'#E8002D', points:'720,270 700,330 650,370 680,420 700,470 680,510 620,530', label:'S2', midX:690, midY:420 },
      { id:3, color:'#FF8000', points:'620,530 540,520 480,490 440,450 400,430 340,440 290,430 250,400 230,360 240,310 270,270 260,230 240,200 250,160 280,140 300,150', label:'S3', midX:290, midY:300 },
    ],
    drs: [
      { x1:450, y1:120, x2:550, y2:130, label:'DRS 1' },
      { x1:250, y1:400, x2:230, y2:360, label:'DRS 2' },
    ],
    viewBox: '210 110 530 440',
    startLine: { x:300, y:150, angle: 30 },
  },
}

export function getCircuitByName(name) {
  if (!name) return null
  const direct = CIRCUITS[name]
  if (direct) return direct
  // Fuzzy match on meeting name
  const key = Object.keys(CIRCUITS).find(k =>
    name.toLowerCase().includes(k.toLowerCase()) ||
    k.toLowerCase().includes(name.toLowerCase().split(' ')[0])
  )
  return key ? CIRCUITS[key] : null
}
