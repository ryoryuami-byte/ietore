// Pictogram specs for イエトレ. Canvas 44x44.
// part kinds:  ['h',x,y] head | ['l',d] body stroke | ['p',d] prop stroke (pink)
//              ['g',animClass,originX,originY,[parts]] animated group
// Conventions: ground line y=36.5, standing head y≈9, feet y≈35.5.

const GND = ['p', 'M5 36.5 H39'];

export const FIGS = {
  // ---------- standing, legs ----------
  squat: [
    GND,
    ['g', 'an-bob', 22, 30, [
      ['h', 18, 9],
      ['l', 'M18.5 13.4 L20 22'],         // torso, slight forward lean
      ['l', 'M19 16.5 L28.5 16'],         // arms reaching forward
      ['l', 'M20 22 L28 26'],             // hip -> knee (hips back)
      ['l', 'M28 26 L27 35'],             // knee -> ankle
    ]],
  ],
  wallsit: [
    GND,
    ['p', 'M8 5 V36.5'],                  // wall
    ['h', 13, 11],
    ['l', 'M12 15.2 V24'],                // back against wall
    ['l', 'M12 24 H25'],                  // thigh horizontal
    ['l', 'M25 24 V35'],                  // shin vertical
    ['l', 'M12.5 18 L19.5 19.5'],         // arms forward
  ],
  lunge: [
    GND,
    ['g', 'an-bob', 21, 30, [
      ['h', 20, 9],
      ['l', 'M20 13.4 V22.5'],
      ['l', 'M20 22.5 L27 27'],           // front thigh
      ['l', 'M27 27 L27 35'],             // front shin
      ['l', 'M20 22.5 L14 29'],           // back thigh
      ['l', 'M14 29 L11 35'],             // back shin
    ]],
  ],
  calf: [
    GND,
    ['g', 'an-rise', 21, 30, [
      ['h', 20, 9],
      ['l', 'M20 13.4 V24'],
      ['l', 'M20 17 L26 19.5'],           // arm
      ['l', 'M20.5 24 V33'],              // straight shin
      ['l', 'M20.5 33 L25 35.8'],         // only the toe reaches the floor
      ['l', 'M20.5 33 L17.5 33.5'],       // lifted heel
    ]],
  ],
  hinge: [
    GND,
    ['g', 'an-torso', 26, 22, [
      ['h', 13, 13],
      ['l', 'M16.5 15.5 L26 21'],         // flat back, hinged forward
      ['l', 'M19 17.5 L18.5 27'],         // arm hanging
    ]],
    ['l', 'M26 21 L27 35'],               // near-straight legs
  ],
  march: [
    GND,
    ['h', 22, 8],
    ['l', 'M22 12.4 V22'],
    ['l', 'M22 22 V35'],                  // standing leg
    ['g', 'an-legup', 22, 22, [
      ['l', 'M22 22 L29 23.5'],           // lifted thigh
      ['l', 'M29 23.5 L29 31'],           // shin hanging
    ]],
    ['g', 'an-swing-alt', 22, 16, [
      ['l', 'M22 16 L16 19.5'],           // opposite arm
    ]],
  ],
  walk: [
    GND,
    ['h', 22, 8],
    ['l', 'M22 12.4 V23'],
    ['g', 'an-swing-slow', 22, 23, [['l', 'M22 23 L17 35']]],
    ['g', 'an-swing-slow-alt', 22, 23, [['l', 'M22 23 L27 35']]],
    ['g', 'an-swing-slow-alt', 22, 16, [['l', 'M22 16 L26 21']]],
    ['g', 'an-swing-slow', 22, 16, [['l', 'M22 16 L18 21']]],
  ],
  stepup: [
    GND,
    ['p', 'M25 29.5 H38 V36.5'],          // step box
    ['p', 'M25 29.5 V36.5'],
    ['g', 'an-rise', 16, 30, [
      ['h', 15, 9],
      ['l', 'M15 13.4 V23'],
      ['l', 'M15 17 L21 20'],             // arm
      ['l', 'M15 23 L22 26 L25 29'],      // leg up onto the box
      ['l', 'M15 23 L13 35'],             // standing leg
    ]],
  ],

  // ---------- floor, face up ----------
  hip: [
    GND,
    ['h', 9, 32],
    ['g', 'an-lift', 13, 32, [
      ['l', 'M13 32.5 L22 27'],           // shoulder -> lifted hip
      ['l', 'M22 27 L29 28.5'],           // hip -> knee
    ]],
    ['l', 'M29 28.5 V35'],                // shin down to floor
  ],
  legraise: [
    GND,
    ['h', 9, 33],
    ['l', 'M13 34 H22'],                  // torso on the floor
    ['g', 'an-legup', 22, 34, [
      ['l', 'M22 34 L33 25'],             // straight legs raised
      ['l', 'M22 34 L31.5 27.5'],
    ]],
  ],
  deadbug: [
    GND,
    ['h', 9, 33],
    ['l', 'M13 34 H25'],
    ['g', 'an-swing', 24, 34, [['l', 'M24 34 L29 25']]],      // leg up
    ['g', 'an-swing-alt', 14, 34, [['l', 'M14 34 L15 24.5']]], // opposite arm up
  ],
  twist: [
    GND,
    ['l', 'M14 34.5 H22'],                // hips on the floor
    ['l', 'M22 34.5 L28 30'],             // bent knees, dropped to one side
    ['l', 'M28 30 L32 33.5'],
    ['g', 'an-twist', 14, 34.5, [
      ['h', 13, 25.5],
      ['l', 'M13.5 29.8 L14 34.3'],       // curled-up torso
      ['l', 'M15 28.5 L20.5 28'],         // arm reaching across
    ]],
  ],

  // ---------- floor, face down ----------
  plank: [
    GND,
    ['g', 'an-breathe', 22, 28, [
      ['h', 9, 19],
      ['l', 'M13 21 L33 29'],             // straight body
      ['l', 'M13.5 21.5 V32'],            // forearm down
      ['l', 'M11 32.5 H17'],              // forearm on the floor
      ['l', 'M33 29 L36 34.5'],           // feet
    ]],
  ],
  pushup: [
    GND,
    ['g', 'an-pushdown', 22, 28, [
      ['h', 9, 18],
      ['l', 'M13 20 L33 28'],
      ['l', 'M14 20.5 L11.5 27 L15 34'],  // bent pushing arm
      ['l', 'M33 28 L36 34.5'],
    ]],
  ],
  climber: [
    GND,
    ['h', 9, 19],
    ['l', 'M13 21 L31 28'],
    ['l', 'M13.5 21.5 V34'],              // straight support arm
    ['g', 'an-swing-fast', 31, 28, [['l', 'M31 28 L24 32']]],   // knee driving in
    ['g', 'an-swing-fast-alt', 31, 28, [['l', 'M31 28 L36 34']]],
  ],
  backext: [
    GND,
    ['l', 'M20 34.5 H35'],                // hips and legs on the floor
    ['g', 'an-torso', 20, 34.5, [
      ['h', 11, 25],
      ['l', 'M13.5 28.5 L20 34'],         // chest lifted off the floor
    ]],
  ],
  birddog: [
    GND,
    ['h', 10, 22],
    ['l', 'M14 24 H29'],                  // back, on all fours
    ['l', 'M15 25 V34.5'],                // support arm
    ['l', 'M28 25 V34.5'],                // support knee
    ['g', 'an-swing-alt', 14, 24, [['l', 'M14 24 L6.5 19']]],  // arm forward
    ['g', 'an-swing', 29, 24, [['l', 'M29 24 L37 19.5']]],     // opposite leg back
  ],
  sideplank: [
    GND,
    ['g', 'an-breathe', 22, 26, [
      ['h', 11, 12],
      ['l', 'M13.5 15.5 L33 34'],         // body diagonal to the feet
      ['l', 'M13.5 16 V34'],              // support arm straight down
    ]],
  ],
  sideleg: [
    GND,
    ['h', 9, 23.5],
    ['l', 'M12.5 26 H26'],                // side-lying torso
    ['l', 'M12.5 26 L12 34.5'],           // propping arm down to the floor
    ['l', 'M26 26.5 L35 31'],             // bottom leg
    ['g', 'an-legup', 26, 26.5, [['l', 'M26 26.5 L35 22']]],   // top leg lifted
  ],
  burpee: [
    GND,
    ['g', 'an-squash', 22, 30, [
      ['h', 16, 16],
      ['l', 'M17 20 L23 27'],             // folded torso
      ['l', 'M16.5 20 L15.5 34.5'],       // arm reaching the floor
      ['l', 'M13.5 35 H17.5'],            // hand planted
      ['l', 'M23 27 L29 31'],             // tucked leg
      ['l', 'M29 31 L29 35.5'],
    ]],
  ],

  // ---------- upper body, standing ----------
  wallpush: [
    ['p', 'M36 4 V38'],                   // wall
    GND,
    ['g', 'an-push', 20, 26, [
      ['h', 15, 12],
      ['l', 'M16 16 L21 31'],             // leaning body
      ['l', 'M16.5 16.5 L33 14.5'],       // arms to the wall
      ['l', 'M21 31 L18 35.5'],
    ]],
  ],
  wallangel: [
    ['p', 'M9 4 V38'],                    // wall behind the back
    GND,
    ['h', 15, 10],
    ['l', 'M13.5 14 V27'],                // back flat on the wall
    ['l', 'M13.5 27 L14 35.5'],
    ['g', 'an-reach', 14, 17.5, [
      ['l', 'M14 17.5 H21'],              // elbow out ...
      ['l', 'M21 17.5 V10'],              // ... forearm up the wall
    ]],
  ],
  scap: [
    GND,
    ['h', 22, 9],
    ['l', 'M22 13.4 V26'],
    ['l', 'M22 26 L19 35.5'],
    ['l', 'M22 26 L25 35.5'],
    ['g', 'an-pull', 22, 17.5, [['l', 'M22 17.5 L15 19 L17 24']]],   // elbow driven back and down
    ['g', 'an-pull-alt', 22, 17.5, [['l', 'M22 17.5 L29 19 L27 24']]],
  ],
  row: [
    GND,
    ['h', 22, 9],
    ['l', 'M22 13.4 V26'],
    ['l', 'M22 26 L19 35.5'],
    ['l', 'M22 26 L25 35.5'],
    ['g', 'an-pull', 22, 17.5, [['l', 'M22 17.5 L13.5 20']]],
    ['g', 'an-pull-alt', 22, 17.5, [['l', 'M22 17.5 L30.5 20']]],
    ['p', 'M13.5 20 Q22 24 30.5 20'],     // the towel, held slack
  ],
  chestopen: [
    GND,
    ['h', 22, 9],
    ['l', 'M22 13.4 V26'],
    ['l', 'M22 26 L19 35.5'],
    ['l', 'M22 26 L25 35.5'],
    ['g', 'an-pull', 22, 17.5, [['l', 'M22 17.5 L11.5 12.5']]],   // arms wide open
    ['g', 'an-pull-alt', 22, 17.5, [['l', 'M22 17.5 L32.5 12.5']]],
  ],
  armcircle: [
    GND,
    ['h', 22, 10],
    ['l', 'M22 14.4 V26'],
    ['l', 'M22 26 L19 35.5'],
    ['l', 'M22 26 L25 35.5'],
    ['g', 'an-pull', 22, 18, [['l', 'M22 18 L31 12']]],
    ['g', 'an-pull-alt', 22, 18, [['l', 'M22 18 L13 12']]],
    ['p', 'M32.5 15.5 A6 6 0 1 0 29 8.5'], // circling arc
  ],
  stretch: [
    GND,
    ['h', 22, 12],
    ['l', 'M22 16.4 V26'],
    ['l', 'M22 26 L19 35.5'],
    ['l', 'M22 26 L25 35.5'],
    ['g', 'an-reach', 22, 19, [['l', 'M22 19 L16 8.5']]],   // both arms overhead
    ['l', 'M22 19 L28 8.5'],
  ],
  sidebend: [
    GND,
    ['l', 'M22 26 L19 35.5'],
    ['l', 'M22 26 L25 35.5'],
    ['g', 'an-torso', 22, 26, [
      ['h', 20, 10],
      ['l', 'M20.5 14.4 L22 26'],
      ['l', 'M21 17 L28 9'],              // top arm reaching over
      ['l', 'M21 18 L18 25'],
    ]],
  ],
  hipcircle: [
    GND,
    ['h', 22, 8],
    ['l', 'M22 12.4 V21'],
    ['l', 'M22 16 L17.5 21'],             // hands on the hips
    ['l', 'M22 16 L26.5 21'],
    ['g', 'an-twist', 22, 22, [
      ['l', 'M17 23 H27'],                // pelvis
      ['l', 'M19 23 L18 35'],
      ['l', 'M25 23 L26 35'],
    ]],
  ],

  // ---------- seated / kneeling stretches ----------
  catcow: [
    GND,
    ['h', 9, 21],
    ['g', 'an-arch', 22, 24, [
      ['l', 'M13 22 Q22 15 32 23'],       // rounding / arching back
    ]],
    ['l', 'M14 23.5 V34.5'],
    ['l', 'M31 24 V34.5'],
  ],
  hamstretch: [
    GND,
    ['l', 'M13 34.5 H28'],                // leg out along the floor
    ['l', 'M28 34.5 L28.5 30.5'],         // flexed foot
    ['g', 'an-reach', 13.5, 34.5, [
      ['h', 20, 24.5],
      ['l', 'M13.5 34.5 L18 28.5'],       // torso folded forward over the leg
      ['l', 'M18 28.5 L26.5 32'],         // reaching for the toes
    ]],
  ],
  hipstretch: [
    GND,
    ['h', 22, 14],
    ['l', 'M22 18.2 V26.5'],
    ['g', 'an-breathe', 22, 30, [
      ['l', 'M22 26.5 L14 32.5 L22 35'],  // soles together
      ['l', 'M22 26.5 L30 32.5 L22 35'],
    ]],
  ],
};

export const FIG_KEYS = Object.keys(FIGS);
