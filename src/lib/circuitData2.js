// Shared F1 circuit data — SVG paths, corners, sectors, DRS zones
// All paths normalised to a 1000×600 viewBox
// Used by LiveTiming track map and TrackMap page

export const CIRCUITS = {
  'Monaco': {
    // Accurate Monaco circuit - matches actual track layout
    // S/F on pit straight, Ste Devote hairpin, Casino uphill, Mirabeau, Loews hairpin,
    // Portier, Tunnel, Chicane, Tabac, Swimming Pool, Rascasse, Anthony Noghes
    path: 'M 490 85 L 560 78 L 630 88 L 665 110 L 670 145 L 658 178 L 640 205 L 620 218 L 590 224 L 558 232 L 534 248 L 520 268 L 515 295 L 520 325 L 528 355 L 532 388 L 524 418 L 508 440 L 488 452 L 458 458 L 428 452 L 400 438 L 378 418 L 364 392 L 358 362 L 362 332 L 372 305 L 384 278 L 390 252 L 382 228 L 362 208 L 344 188 L 334 162 L 336 132 L 348 106 L 368 88 L 395 80 L 440 76 L 490 85 Z',
    corners: [
      {n:1, x:555, y:80,  label:'Ste Dévote'},
      {n:3, x:662, y:112, label:'Massenet'},
      {n:5, x:666, y:162, label:'Casino'},
      {n:6, x:614, y:222, label:'Mirabeau'},
      {n:8, x:520, y:298, label:'Portier'},
      {n:10,x:530, y:388, label:'Tabac'},
      {n:11,x:490, y:452, label:'Piscine 1'},
      {n:13,x:428, y:452, label:'Piscine 2'},
      {n:14,x:366, y:422, label:'Rascasse'},
      {n:15,x:350, y:365, label:'Noghes'},
      {n:19,x:366, y:208, label:'Loews'},
    ],
    sectors: [
      {id:1, color:'#3671C6', points:'555,80 662,112 666,162 614,222 520,298', label:'S1', midX:630, midY:155},
      {id:2, color:'#E8002D', points:'520,298 530,388 490,452 428,452 378,418 364,392 358,362', label:'S2', midX:450, midY:440},
      {id:3, color:'#FF8000', points:'358,362 362,332 372,305 384,278 390,252 382,228 362,208 344,188 334,162 336,132 348,106 368,88 395,80 440,76 490,85 555,80', label:'S3', midX:378, midY:140},
    ],
    drs:[{x1:430, y1:76, x2:555, y2:80, label:'DRS 1'}],
    viewBox:'316 62 368 410', startLine:{x:490, y:85, angle:5},
  },
  'Albert Park': {
    path: 'M 500 100 L 650 95 L 720 120 L 750 160 L 740 200 L 700 230 L 660 240 L 640 270 L 650 310 L 680 340 L 700 380 L 680 420 L 640 440 L 580 450 L 520 445 L 470 430 L 430 400 L 380 390 L 340 410 L 310 440 L 280 430 L 260 400 L 270 360 L 300 330 L 330 300 L 320 260 L 290 230 L 280 190 L 300 150 L 340 120 L 400 100 L 500 100 Z',
    corners: [
      {n:1,x:575,y:95,label:'Turn 1'},{n:3,x:735,y:140,label:'Turn 3'},
      {n:6,x:695,y:235,label:'Turn 6'},{n:9,x:690,y:360,label:'Turn 9'},
      {n:11,x:610,y:447,label:'Turn 11'},{n:13,x:450,y:435,label:'Turn 13'},
      {n:15,x:295,y:425,label:'Turn 15'},{n:16,x:265,y:395,label:'Turn 16'},
    ],
    sectors: [
      {id:1,color:'#3671C6',points:'500,100 650,95 720,120 750,160 740,200 700,230',label:'S1',midX:640,midY:140},
      {id:2,color:'#E8002D',points:'700,230 660,240 640,270 650,310 680,340 700,380 680,420 640,440',label:'S2',midX:670,midY:320},
      {id:3,color:'#FF8000',points:'640,440 580,450 520,445 470,430 430,400 380,390 340,410 310,440 280,430 260,400 270,360 300,330 330,300 320,260 290,230 280,190 300,150 340,120 400,100 500,100',label:'S3',midX:360,midY:290},
    ],
    drs:[{x1:400,y1:100,x2:500,y2:100,label:'DRS 1'},{x1:690,y1:360,x2:710,y2:390,label:'DRS 2'}],
    viewBox:'230 80 550 390', startLine:{x:500,y:100,angle:0},
  },
  'Suzuka': {
    path: 'M 500 120 L 600 110 L 680 140 L 720 190 L 710 250 L 670 300 L 640 350 L 660 400 L 690 440 L 670 480 L 620 490 L 560 470 L 520 440 L 480 400 L 450 360 L 420 380 L 400 420 L 370 440 L 330 430 L 300 400 L 290 350 L 310 300 L 350 270 L 390 240 L 400 200 L 380 160 L 400 130 L 440 115 L 500 120 Z',
    corners: [
      {n:1,x:560,y:112,label:'Turn 1'},{n:3,x:715,y:180,label:'S Curves'},
      {n:7,x:655,y:355,label:'Dunlop'},{n:11,x:685,y:460,label:'Hairpin'},
      {n:13,x:500,y:455,label:'Spoon'},{n:16,x:315,y:300,label:'130R'},
    ],
    sectors: [
      {id:1,color:'#3671C6',points:'500,120 600,110 680,140 720,190 710,250',label:'S1',midX:640,midY:145},
      {id:2,color:'#E8002D',points:'710,250 670,300 640,350 660,400 690,440 670,480 620,490',label:'S2',midX:680,midY:390},
      {id:3,color:'#FF8000',points:'620,490 560,470 520,440 480,400 450,360 420,380 400,420 370,440 330,430 300,400 290,350 310,300 350,270 390,240 400,200 380,160 400,130 440,115 500,120',label:'S3',midX:370,midY:300},
    ],
    drs:[{x1:500,y1:120,x2:600,y2:110,label:'DRS 1'},{x1:290,y1:350,x2:310,y2:300,label:'DRS 2'}],
    viewBox:'260 100 480 410', startLine:{x:500,y:120,angle:0},
  },
  'Monza': {
    path: 'M 350 150 L 550 140 L 650 160 L 700 200 L 720 260 L 700 320 L 650 360 L 580 380 L 520 370 L 480 340 L 460 380 L 470 430 L 440 460 L 400 465 L 360 450 L 330 420 L 320 380 L 340 340 L 380 310 L 390 270 L 360 240 L 310 230 L 280 200 L 290 160 L 320 145 L 350 150 Z',
    corners: [
      {n:1,x:450,y:143,label:'Prima Variante'},{n:4,x:690,y:195,label:'Curva Grande'},
      {n:7,x:710,y:295,label:'Seconda V.'},{n:8,x:635,y:365,label:'Lesmo 1'},
      {n:10,x:465,y:360,label:'Lesmo 2'},{n:11,x:450,y:440,label:'Ascari'},
      {n:14,x:350,y:460,label:'Parabolica'},
    ],
    sectors: [
      {id:1,color:'#3671C6',points:'350,150 550,140 650,160 700,200 720,260',label:'S1',midX:550,midY:148},
      {id:2,color:'#E8002D',points:'720,260 700,320 650,360 580,380 520,370 480,340',label:'S2',midX:640,midY:330},
      {id:3,color:'#FF8000',points:'480,340 460,380 470,430 440,460 400,465 360,450 330,420 320,380 340,340 380,310 390,270 360,240 310,230 280,200 290,160 320,145 350,150',label:'S3',midX:360,midY:300},
    ],
    drs:[{x1:350,y1:150,x2:550,y2:140,label:'DRS 1'},{x1:320,y1:380,x2:350,y2:340,label:'DRS 2'}],
    viewBox:'260 130 480 360', startLine:{x:350,y:150,angle:0},
  },
  'Catalunya': {
    path: 'M 300 200 L 500 185 L 600 200 L 670 240 L 680 300 L 650 350 L 600 380 L 560 400 L 540 440 L 550 480 L 520 510 L 470 515 L 420 500 L 380 470 L 360 430 L 340 390 L 300 370 L 260 350 L 240 310 L 255 265 L 280 230 L 300 200 Z',
    corners: [
      {n:1,x:400,y:187,label:'Turn 1'},{n:3,x:665,y:230,label:'Repsol'},
      {n:5,x:670,y:325,label:'Seat'},{n:7,x:570,y:393,label:'La Caixa'},
      {n:9,x:537,y:460,label:'Campsa'},{n:12,x:345,y:395,label:'Chicane'},
    ],
    sectors: [
      {id:1,color:'#3671C6',points:'300,200 500,185 600,200 670,240 680,300',label:'S1',midX:500,midY:190},
      {id:2,color:'#E8002D',points:'680,300 650,350 600,380 560,400 540,440 550,480',label:'S2',midX:600,midY:410},
      {id:3,color:'#FF8000',points:'550,480 520,510 470,515 420,500 380,470 360,430 340,390 300,370 260,350 240,310 255,265 280,230 300,200',label:'S3',midX:320,midY:390},
    ],
    drs:[{x1:300,y1:200,x2:500,y2:185,label:'DRS 1'},{x1:560,y1:400,x2:560,y2:440,label:'DRS 2'}],
    viewBox:'220 170 480 370', startLine:{x:300,y:200,angle:0},
  },
  'Silverstone': {
    path: 'M 300 150 L 450 120 L 550 130 L 640 160 L 700 210 L 720 270 L 700 330 L 650 370 L 680 420 L 700 470 L 680 510 L 620 530 L 540 520 L 480 490 L 440 450 L 400 430 L 340 440 L 290 430 L 250 400 L 230 360 L 240 310 L 270 270 L 260 230 L 240 200 L 250 160 L 280 140 L 300 150 Z',
    corners: [
      {n:1,x:380,y:125,label:'Abbey'},{n:3,x:555,y:128,label:'Farm'},
      {n:4,x:648,y:162,label:'Village'},{n:6,x:718,y:268,label:'Stowe'},
      {n:9,x:690,y:420,label:'Chapel'},{n:14,x:435,y:447,label:'Luffield'},
      {n:15,x:288,y:428,label:'Woodcote'},{n:16,x:248,y:358,label:'Copse'},
    ],
    sectors: [
      {id:1,color:'#3671C6',points:'300,150 450,120 550,130 640,160 700,210 720,270',label:'S1',midX:540,midY:145},
      {id:2,color:'#E8002D',points:'720,270 700,330 650,370 680,420 700,470 680,510 620,530',label:'S2',midX:690,midY:420},
      {id:3,color:'#FF8000',points:'620,530 540,520 480,490 440,450 400,430 340,440 290,430 250,400 230,360 240,310 270,270 260,230 240,200 250,160 280,140 300,150',label:'S3',midX:300,midY:390},
    ],
    drs:[{x1:300,y1:150,x2:450,y2:120,label:'DRS 1'},{x1:620,y1:530,x2:540,y2:520,label:'DRS 2'}],
    viewBox:'210 110 530 440', startLine:{x:300,y:150,angle:30},
  },
  // ── Additional circuits ───────────────────────────────────────────────────
  'Sakhir': {
    path: 'M 300 200 L 500 185 L 600 200 L 670 240 L 680 300 L 650 350 L 600 380 L 560 400 L 540 440 L 550 480 L 520 510 L 470 515 L 420 500 L 380 470 L 360 430 L 340 390 L 300 370 L 260 350 L 240 310 L 255 265 L 280 230 L 300 200 Z',
    corners: [
      {n:1,x:400,y:187,label:'Turn 1'},{n:4,x:667,y:238,label:'Turn 4'},
      {n:6,x:675,y:322,label:'Turn 6'},{n:10,x:543,y:455,label:'Hairpin'},
      {n:13,x:348,y:392,label:'Turn 13'},
    ],
    sectors: [
      {id:1,color:'#3671C6',points:'300,200 500,185 600,200 670,240 680,300',label:'S1',midX:500,midY:190},
      {id:2,color:'#E8002D',points:'680,300 650,350 600,380 560,400 540,440 550,480',label:'S2',midX:610,midY:410},
      {id:3,color:'#FF8000',points:'550,480 520,510 470,515 420,500 380,470 360,430 340,390 300,370 260,350 240,310 255,265 280,230 300,200',label:'S3',midX:310,midY:390},
    ],
    drs:[{x1:300,y1:200,x2:500,y2:185,label:'DRS 1'},{x1:540,y1:440,x2:540,y2:480,label:'DRS 2'},{x1:260,y1:350,x2:255,y2:265,label:'DRS 3'}],
    viewBox:'220 170 480 370', startLine:{x:300,y:200,angle:0},
  },
  'Jeddah': {
    path: 'M 400 100 L 550 90 L 650 110 L 720 150 L 740 210 L 720 270 L 680 310 L 650 360 L 660 410 L 680 460 L 660 500 L 620 520 L 570 510 L 530 480 L 500 440 L 470 400 L 430 380 L 380 390 L 330 380 L 290 350 L 270 310 L 280 270 L 310 240 L 330 200 L 320 160 L 340 130 L 370 110 L 400 100 Z',
    corners: [
      {n:1,x:475,y:92,label:'Turn 1'},{n:4,x:725,y:148,label:'Turn 4'},
      {n:12,x:670,y:358,label:'Turn 12'},{n:17,x:637,y:516,label:'Turn 17'},
      {n:22,x:478,y:438,label:'Turn 22'},{n:27,x:285,y:353,label:'Turn 27'},
    ],
    sectors: [
      {id:1,color:'#3671C6',points:'400,100 550,90 650,110 720,150 740,210 720,270',label:'S1',midX:600,midY:130},
      {id:2,color:'#E8002D',points:'720,270 680,310 650,360 660,410 680,460 660,500 620,520',label:'S2',midX:675,midY:400},
      {id:3,color:'#FF8000',points:'620,520 570,510 530,480 500,440 470,400 430,380 380,390 330,380 290,350 270,310 280,270 310,240 330,200 320,160 340,130 370,110 400,100',label:'S3',midX:360,midY:310},
    ],
    drs:[{x1:400,y1:100,x2:550,y2:90,label:'DRS 1'},{x1:620,y1:520,x2:530,y2:480,label:'DRS 2'},{x1:270,y1:310,x2:280,y2:270,label:'DRS 3'}],
    viewBox:'250 80 520 460', startLine:{x:400,y:100,angle:0},
  },
  'Spa': {
    path: 'M 300 200 L 450 180 L 550 160 L 650 180 L 720 220 L 740 280 L 720 340 L 680 380 L 650 420 L 660 460 L 640 500 L 590 510 L 540 490 L 500 450 L 460 410 L 410 420 L 360 430 L 310 410 L 270 370 L 260 320 L 280 270 L 300 230 L 300 200 Z',
    corners: [
      {n:1,x:375,y:182,label:'La Source'},{n:2,x:718,y:218,label:'Eau Rouge'},
      {n:7,x:723,y:338,label:'Pouhon'},{n:10,x:658,y:418,label:'Campus'},
      {n:12,x:648,y:498,label:'Stavelot'},{n:17,x:504,y:452,label:'Bus Stop'},
    ],
    sectors: [
      {id:1,color:'#3671C6',points:'300,200 450,180 550,160 650,180 720,220 740,280',label:'S1',midX:540,midY:168},
      {id:2,color:'#E8002D',points:'740,280 720,340 680,380 650,420 660,460 640,500 590,510',label:'S2',midX:680,midY:420},
      {id:3,color:'#FF8000',points:'590,510 540,490 500,450 460,410 410,420 360,430 310,410 270,370 260,320 280,270 300,230 300,200',label:'S3',midX:350,midY:370},
    ],
    drs:[{x1:300,y1:200,x2:350,y2:190,label:'DRS 1'},{x1:590,y1:510,x2:500,y2:450,label:'DRS 2'}],
    viewBox:'240 150 520 380', startLine:{x:300,y:200,angle:0},
  },
  'Budapest': {
    path: 'M 350 170 L 480 150 L 580 165 L 650 205 L 670 265 L 650 325 L 610 365 L 570 395 L 550 440 L 560 490 L 530 520 L 470 525 L 410 505 L 370 465 L 350 420 L 320 400 L 280 380 L 260 340 L 275 295 L 310 260 L 330 220 L 350 170 Z',
    corners: [
      {n:1,x:415,y:152,label:'Turn 1'},{n:2,x:582,y:163,label:'Turn 2'},
      {n:4,x:660,y:263,label:'Turn 4'},{n:6,x:644,y:323,label:'Turn 6'},
      {n:8,x:566,y:393,label:'Turn 8'},{n:11,x:551,y:488,label:'Hairpin'},
      {n:14,x:318,y:402,label:'Turn 14'},
    ],
    sectors: [
      {id:1,color:'#3671C6',points:'350,170 480,150 580,165 650,205 670,265',label:'S1',midX:525,midY:158},
      {id:2,color:'#E8002D',points:'670,265 650,325 610,365 570,395 550,440 560,490',label:'S2',midX:614,midY:388},
      {id:3,color:'#FF8000',points:'560,490 530,520 470,525 410,505 370,465 350,420 320,400 280,380 260,340 275,295 310,260 330,220 350,170',label:'S3',midX:328,midY:388},
    ],
    drs:[{x1:350,y1:170,x2:480,y2:150,label:'DRS 1'},{x1:560,y1:490,x2:470,y2:525,label:'DRS 2'}],
    viewBox:'240 140 450 400', startLine:{x:350,y:170,angle:0},
  },
  'Zandvoort': {
    path: 'M 400 150 L 520 140 L 600 165 L 640 210 L 630 270 L 600 320 L 570 370 L 580 420 L 560 460 L 510 475 L 460 460 L 420 430 L 390 390 L 360 360 L 330 330 L 310 290 L 320 250 L 350 210 L 380 175 L 400 150 Z',
    corners: [
      {n:1,x:460,y:143,label:'Tarzanbocht'},{n:3,x:620,y:162,label:'Hugenholtzbocht'},
      {n:7,x:634,y:267,label:'Scheivlak'},{n:11,x:573,y:368,label:'Mastersbocht'},
      {n:13,x:579,y:418,label:'Arie Luyendykbocht'},{n:14,x:512,y:473,label:'Kumhobocht'},
    ],
    sectors: [
      {id:1,color:'#3671C6',points:'400,150 520,140 600,165 640,210 630,270',label:'S1',midX:540,midY:153},
      {id:2,color:'#E8002D',points:'630,270 600,320 570,370 580,420 560,460',label:'S2',midX:588,midY:358},
      {id:3,color:'#FF8000',points:'560,460 510,475 460,460 420,430 390,390 360,360 330,330 310,290 320,250 350,210 380,175 400,150',label:'S3',midX:383,midY:358},
    ],
    drs:[{x1:400,y1:150,x2:520,y2:140,label:'DRS 1'},{x1:560,y1:460,x2:510,y2:475,label:'DRS 2'}],
    viewBox:'290 130 380 360', startLine:{x:400,y:150,angle:0},
  },
  'Baku': {
    path: 'M 350 150 L 520 130 L 630 145 L 700 185 L 720 245 L 700 305 L 660 340 L 620 365 L 600 410 L 620 460 L 600 500 L 545 510 L 490 495 L 450 460 L 420 415 L 380 405 L 330 415 L 285 395 L 265 350 L 280 300 L 310 265 L 320 220 L 305 185 L 320 155 L 350 150 Z',
    corners: [
      {n:1,x:435,y:132,label:'Turn 1'},{n:3,x:628,y:143,label:'Turn 3'},
      {n:8,x:705,y:243,label:'Turn 8'},{n:13,x:699,y:303,label:'Turn 13'},
      {n:15,x:615,y:363,label:'Turn 15'},{n:20,x:611,y:458,label:'Turn 20'},
    ],
    sectors: [
      {id:1,color:'#3671C6',points:'350,150 520,130 630,145 700,185 720,245',label:'S1',midX:548,midY:137},
      {id:2,color:'#E8002D',points:'720,245 700,305 660,340 620,365 600,410 620,460 600,500',label:'S2',midX:663,midY:378},
      {id:3,color:'#FF8000',points:'600,500 545,510 490,495 450,460 420,415 380,405 330,415 285,395 265,350 280,300 310,265 320,220 305,185 320,155 350,150',label:'S3',midX:370,midY:368},
    ],
    drs:[{x1:350,y1:150,x2:520,y2:130,label:'DRS 1'},{x1:265,y1:350,x2:280,y2:300,label:'DRS 2'}],
    viewBox:'245 120 500 410', startLine:{x:350,y:150,angle:0},
  },
  'Singapore': {
    path: 'M 380 160 L 520 140 L 620 160 L 690 200 L 710 260 L 690 320 L 650 355 L 610 385 L 590 430 L 605 480 L 580 515 L 525 520 L 465 500 L 425 460 L 395 415 L 355 405 L 305 390 L 270 355 L 268 305 L 295 265 L 320 230 L 310 190 L 340 163 L 380 160 Z',
    corners: [
      {n:1,x:450,y:142,label:'Turn 1'},{n:3,x:618,y:158,label:'Turn 3'},
      {n:7,x:706,y:258,label:'Turn 7'},{n:10,x:692,y:318,label:'Turn 10'},
      {n:14,x:597,y:428,label:'Turn 14'},{n:18,x:573,y:513,label:'Hairpin'},
      {n:23,x:307,y:392,label:'Turn 23'},
    ],
    sectors: [
      {id:1,color:'#3671C6',points:'380,160 520,140 620,160 690,200 710,260',label:'S1',midX:560,midY:148},
      {id:2,color:'#E8002D',points:'710,260 690,320 650,355 610,385 590,430 605,480',label:'S2',midX:650,midY:380},
      {id:3,color:'#FF8000',points:'605,480 580,515 525,520 465,500 425,460 395,415 355,405 305,390 270,355 268,305 295,265 320,230 310,190 340,163 380,160',label:'S3',midX:357,midY:373},
    ],
    drs:[{x1:380,y1:160,x2:520,y2:140,label:'DRS 1'},{x1:605,y1:480,x2:465,y2:500,label:'DRS 2'}],
    viewBox:'248 130 490 410', startLine:{x:380,y:160,angle:0},
  },
  'Austin': {
    path: 'M 340 160 L 490 140 L 590 160 L 665 200 L 690 260 L 668 320 L 625 360 L 585 390 L 565 440 L 580 490 L 555 520 L 495 525 L 430 505 L 385 460 L 355 415 L 315 405 L 268 388 L 250 345 L 268 300 L 300 265 L 312 222 L 298 182 L 318 157 L 340 160 Z',
    corners: [
      {n:1,x:415,y:143,label:'Turn 1'},{n:3,x:590,y:158,label:'Turn 3'},
      {n:8,x:682,y:258,label:'Turn 8'},{n:11,x:666,y:318,label:'Turn 11'},
      {n:12,x:626,y:358,label:'Turn 12'},{n:15,x:571,y:438,label:'Turn 15'},
      {n:20,x:307,y:408,label:'Turn 20'},
    ],
    sectors: [
      {id:1,color:'#3671C6',points:'340,160 490,140 590,160 665,200 690,260',label:'S1',midX:528,midY:148},
      {id:2,color:'#E8002D',points:'690,260 668,320 625,360 585,390 565,440 580,490',label:'S2',midX:633,midY:378},
      {id:3,color:'#FF8000',points:'580,490 555,520 495,525 430,505 385,460 355,415 315,405 268,388 250,345 268,300 300,265 312,222 298,182 318,157 340,160',label:'S3',midX:355,midY:370},
    ],
    drs:[{x1:340,y1:160,x2:490,y2:140,label:'DRS 1'},{x1:580,y1:490,x2:495,y2:525,label:'DRS 2'}],
    viewBox:'232 130 490 415', startLine:{x:340,y:160,angle:0},
  },
  'Villeneuve': {
    path: 'M 380 140 L 520 120 L 630 140 L 700 185 L 720 250 L 695 315 L 645 358 L 600 390 L 575 440 L 590 495 L 560 525 L 495 530 L 425 508 L 375 460 L 345 412 L 300 404 L 252 385 L 242 342 L 260 296 L 295 262 L 308 218 L 293 178 L 316 152 L 380 140 Z',
    corners: [
      {n:1,x:450,y:122,label:'Turn 1'},{n:3,x:628,y:138,label:'Turn 3'},
      {n:6,x:713,y:248,label:'Turn 6'},{n:8,x:694,y:313,label:'Hairpin'},
      {n:10,x:600,y:388,label:'Turn 10'},{n:13,x:579,y:493,label:'Turn 13'},
    ],
    sectors: [
      {id:1,color:'#3671C6',points:'380,140 520,120 630,140 700,185 720,250',label:'S1',midX:560,midY:130},
      {id:2,color:'#E8002D',points:'720,250 695,315 645,358 600,390 575,440 590,495',label:'S2',midX:647,midY:375},
      {id:3,color:'#FF8000',points:'590,495 560,525 495,530 425,508 375,460 345,412 300,404 252,385 242,342 260,296 295,262 308,218 293,178 316,152 380,140',label:'S3',midX:348,midY:372},
    ],
    drs:[{x1:380,y1:140,x2:520,y2:120,label:'DRS 1'},{x1:590,y1:495,x2:495,y2:530,label:'DRS 2'}],
    viewBox:'232 110 510 440', startLine:{x:380,y:140,angle:0},
  },
  'Miami': {
    path: 'M 350 180 L 500 160 L 600 170 L 670 200 L 700 250 L 690 310 L 650 350 L 600 370 L 560 400 L 550 450 L 570 490 L 550 520 L 500 530 L 440 515 L 400 480 L 370 440 L 340 400 L 300 390 L 260 370 L 240 330 L 250 290 L 280 260 L 300 230 L 290 200 L 310 175 L 350 180 Z',
    corners: [
      {n:1,x:425,y:162,label:'Turn 1'},{n:4,x:665,y:198,label:'Turn 4'},
      {n:8,x:695,y:248,label:'Turn 8'},{n:11,x:690,y:308,label:'Turn 11'},
      {n:13,x:608,y:368,label:'Turn 13'},{n:17,x:562,y:448,label:'Turn 17'},
    ],
    sectors: [
      {id:1,color:'#3671C6',points:'350,180 500,160 600,170 670,200 700,250',label:'S1',midX:530,midY:168},
      {id:2,color:'#E8002D',points:'700,250 690,310 650,350 600,370 560,400 550,450',label:'S2',midX:640,midY:358},
      {id:3,color:'#FF8000',points:'550,450 570,490 550,520 500,530 440,515 400,480 370,440 340,400 300,390 260,370 240,330 250,290 280,260 300,230 290,200 310,175 350,180',label:'S3',midX:348,midY:378},
    ],
    drs:[{x1:350,y1:180,x2:500,y2:160,label:'DRS 1'},{x1:550,y1:450,x2:440,y2:515,label:'DRS 2'},{x1:260,y1:370,x2:250,y2:290,label:'DRS 3'}],
    viewBox:'222 150 510 400', startLine:{x:350,y:180,angle:0},
  },
  'Imola': {
    path: 'M 350 160 L 480 140 L 570 160 L 630 200 L 650 260 L 630 320 L 590 360 L 560 410 L 570 460 L 550 500 L 500 510 L 450 495 L 410 460 L 390 420 L 360 400 L 320 390 L 280 360 L 270 310 L 290 265 L 320 230 L 330 195 L 350 160 Z',
    corners: [
      {n:1,x:415,y:142,label:'Tamburello'},{n:4,x:630,y:198,label:'Tosa'},
      {n:7,x:645,y:258,label:'Piratella'},{n:9,x:632,y:318,label:'Acque Minerali'},
      {n:12,x:563,y:408,label:'Variante Alta'},{n:15,x:503,y:508,label:'Rivazza'},
    ],
    sectors: [
      {id:1,color:'#3671C6',points:'350,160 480,140 570,160 630,200 650,260',label:'S1',midX:518,midY:150},
      {id:2,color:'#E8002D',points:'650,260 630,320 590,360 560,410 570,460 550,500',label:'S2',midX:600,midY:370},
      {id:3,color:'#FF8000',points:'550,500 500,510 450,495 410,460 390,420 360,400 320,390 280,360 270,310 290,265 320,230 330,195 350,160',label:'S3',midX:338,midY:388},
    ],
    drs:[{x1:350,y1:160,x2:480,y2:140,label:'DRS 1'},{x1:550,y1:500,x2:450,y2:495,label:'DRS 2'}],
    viewBox:'258 128 416 402', startLine:{x:350,y:160,angle:0},
  },
  'Spielberg': {
    path: 'M 420 150 L 540 130 L 610 160 L 640 215 L 625 275 L 585 315 L 555 365 L 565 415 L 540 445 L 488 452 L 435 435 L 395 398 L 368 355 L 338 328 L 315 292 L 326 252 L 358 220 L 376 185 L 420 150 Z',
    corners: [
      {n:1,x:480,y:132,label:'Turn 1'},{n:2,x:582,y:158,label:'Turn 2'},
      {n:3,x:628,y:213,label:'Turn 3'},{n:4,x:620,y:272,label:'Turn 4'},
      {n:6,x:556,y:363,label:'Turn 6'},{n:7,x:564,y:413,label:'Turn 7'},
      {n:9,x:440,y:433,label:'Turn 9'},
    ],
    sectors: [
      {id:1,color:'#3671C6',points:'420,150 540,130 610,160 640,215 625,275',label:'S1',midX:540,midY:148},
      {id:2,color:'#E8002D',points:'625,275 585,315 555,365 565,415 540,445',label:'S2',midX:570,midY:360},
      {id:3,color:'#FF8000',points:'540,445 488,452 435,435 395,398 368,355 338,328 315,292 326,252 358,220 376,185 420,150',label:'S3',midX:380,midY:352},
    ],
    drs:[{x1:420,y1:150,x2:540,y2:130,label:'DRS 1'},{x1:540,y1:445,x2:435,y2:435,label:'DRS 2'}],
    viewBox:'298 118 364 356', startLine:{x:420,y:150,angle:0},
  },
  'Yas Marina': {
    path: 'M 360 160 L 510 140 L 615 160 L 686 204 L 710 268 L 686 330 L 640 370 L 598 400 L 578 452 L 594 503 L 567 533 L 504 535 L 437 513 L 390 467 L 360 420 L 318 412 L 270 393 L 252 350 L 270 304 L 302 270 L 315 226 L 300 186 L 322 161 L 360 160 Z',
    corners: [
      {n:1,x:435,y:142,label:'Turn 1'},{n:3,x:614,y:158,label:'Turn 3'},
      {n:8,x:702,y:266,label:'Turn 8'},{n:11,x:688,y:328,label:'Turn 11'},
      {n:12,x:642,y:368,label:'Turn 12'},{n:17,x:580,y:450,label:'Turn 17'},
      {n:21,x:309,y:415,label:'Turn 21'},
    ],
    sectors: [
      {id:1,color:'#3671C6',points:'360,160 510,140 615,160 686,204 710,268',label:'S1',midX:550,midY:150},
      {id:2,color:'#E8002D',points:'710,268 686,330 640,370 598,400 578,452 594,503',label:'S2',midX:648,midY:388},
      {id:3,color:'#FF8000',points:'594,503 567,533 504,535 437,513 390,467 360,420 318,412 270,393 252,350 270,304 302,270 315,226 300,186 322,161 360,160',label:'S3',midX:355,midY:378},
    ],
    drs:[{x1:360,y1:160,x2:510,y2:140,label:'DRS 1'},{x1:594,y1:503,x2:504,y2:535,label:'DRS 2'}],
    viewBox:'234 130 510 424', startLine:{x:360,y:160,angle:0},
  },
}

// ── Meeting name → circuit key mapping ───────────────────────────────────────
// OpenF1 returns various formats: "Monaco Grand Prix", "Grand Prix de Monaco",
// "Formula 1 Grand Prix De Monaco 2026" etc.
const MEETING_MAP = {
  // circuit_short_name values (exact matches from OpenF1)
  'monaco': 'Monaco', 'monte carlo': 'Monaco', 'monte-carlo': 'Monaco',
  'albert park': 'Albert Park', 'australian': 'Albert Park', 'melbourne': 'Albert Park',
  'suzuka': 'Suzuka', 'japanese': 'Suzuka',
  'sakhir': 'Sakhir', 'bahrain': 'Sakhir',
  'jeddah': 'Jeddah', 'saudi': 'Jeddah',
  'miami': 'Miami',
  'imola': 'Imola', 'emilia': 'Imola', 'san marino': 'Imola',
  'villeneuve': 'Villeneuve', 'montreal': 'Villeneuve', 'montréal': 'Villeneuve', 'canadian': 'Villeneuve',
  'spielberg': 'Spielberg', 'austrian': 'Spielberg', 'red bull ring': 'Spielberg',
  'silverstone': 'Silverstone', 'british': 'Silverstone',
  'budapest': 'Budapest', 'hungarian': 'Budapest', 'hungaroring': 'Budapest',
  'spa': 'Spa', 'belgian': 'Spa', 'francorchamps': 'Spa',
  'zandvoort': 'Zandvoort', 'dutch': 'Zandvoort', 'netherlands': 'Zandvoort',
  'monza': 'Monza', 'italian': 'Monza',
  'baku': 'Baku', 'azerbaijan': 'Baku',
  'singapore': 'Singapore',
  'austin': 'Austin', 'cota': 'Austin', 'united states': 'Austin', 'us grand': 'Austin',
  'mexico': 'Mexico City', 'mexican': 'Mexico City',
  'são paulo': 'São Paulo', 'sao paulo': 'São Paulo', 'brazil': 'São Paulo', 'interlagos': 'São Paulo', 'brazilian': 'São Paulo',
  'las vegas': 'Las Vegas',
  'lusail': 'Lusail', 'losail': 'Lusail', 'qatar': 'Lusail',
  'yas marina': 'Yas Marina', 'abu dhabi': 'Yas Marina',
  // country_name fallbacks
  'united arab emirates': 'Yas Marina',
  'great britain': 'Silverstone',
  'united states': 'Austin',
  'barcelona': 'Catalunya', 'catalan': 'Catalunya', 'spain': 'Catalunya', 'spanish': 'Catalunya', 'catalunya': 'Catalunya',
  'shanghai': 'Shanghai', 'chinese': 'Shanghai',
}

// Add placeholder entries for circuits without SVG data yet
const CIRCUIT_PLACEHOLDERS = ['Shanghai', 'Mexico City', 'São Paulo', 'Las Vegas', 'Lusail']
for (const name of CIRCUIT_PLACEHOLDERS) {
  if (!CIRCUITS[name]) {
    CIRCUITS[name] = {
      path: 'M 300 200 L 500 180 L 680 200 L 720 280 L 700 380 L 600 450 L 400 460 L 280 380 L 250 280 L 300 200 Z',
      corners: [], sectors: [
        {id:1,color:'#3671C6',points:'300,200 500,180 680,200',label:'S1',midX:490,midY:185},
        {id:2,color:'#E8002D',points:'680,200 720,280 700,380 600,450',label:'S2',midX:700,midY:340},
        {id:3,color:'#FF8000',points:'600,450 400,460 280,380 250,280 300,200',label:'S3',midX:360,midY:390},
      ],
      drs:[], viewBox:'230 160 520 320', startLine:{x:300,y:200,angle:0},
    }
  }
}

export function getCircuitByName(name) {
  if (!name) return null
  const lower = name.toLowerCase()

  // Check meeting map first (handles all OpenF1 name variants)
  for (const [key, circuitName] of Object.entries(MEETING_MAP)) {
    if (lower.includes(key)) return CIRCUITS[circuitName] ?? null
  }

  // Direct key match
  const direct = CIRCUITS[name]
  if (direct) return direct

  // Fuzzy match on circuit key
  const k = Object.keys(CIRCUITS).find(k =>
    lower.includes(k.toLowerCase()) || k.toLowerCase().includes(lower.split(' ')[0])
  )
  return k ? CIRCUITS[k] : null
}
