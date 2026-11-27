export { rivers } from './assets/map-geometry.mjs?v=2';

export const mapLabels = [
  { name: 'Aegean Sea', kind: 'sea', coords: [26.25, 37.31] },
  { name: 'Mediterranean Sea', kind: 'sea', coords: [30.8, 33.95] },
  { name: 'Black Sea', kind: 'sea', coords: [36.35, 42.78] },
  { name: 'Thrace', kind: 'land', coords: [26.9, 42.49] },
  { name: 'Lydia', kind: 'land', coords: [28.95, 39.52] },
  { name: 'Bithynia', kind: 'land', coords: [31.03, 40.38] },
  { name: 'Phrygia', kind: 'land', coords: [31.6, 38.77] },
  { name: 'Cappadocia', kind: 'land', coords: [34.94, 39.04] },
  { name: 'Cilicia', kind: 'land', coords: [35.6, 37.55] },
  { name: 'Armenia', kind: 'land', coords: [43.55, 40.42] },
  { name: 'Syria', kind: 'land', coords: [37.47, 34.1] },
  { name: 'Mesopotamia', kind: 'land', coords: [41.48, 35.3] },
  { name: 'Babylonia', kind: 'land', coords: [44.7, 32.55] },
];

// Intermediate points keyed by the next story stop. They show the broad direction
// of travel and selected landmarks from the text at the scale of this atlas.
export const routeWaypoints = {
  tarsus: [
    [28.96, 37.96],
    [29.26, 37.79], // Colossae
    [30.17, 38.07], // Celaenae
    [30.57, 38.52],
    [31.24, 38.32], // Tyriaeum area
    [32.48, 37.87], // Iconium
    [33.54, 37.72],
    [34.57, 37.85], // Tyana area
    [34.78, 37.31], // Cilician Gates
  ],
  thapsacus: [
    [35.35, 36.99],
    [35.89, 36.99],
    [36.17, 36.94], // Head of the Gulf of Issus
    [36.25, 36.79],
    [36.21, 36.64], // Myriandrus area
    [36.36, 36.49],
    [37.15, 36.24], // Aleppo and the Quwayq valley
    [37.75, 36.09],
  ],
  cunaxa: [
    [38.94, 35.92],
    [39.44, 35.64],
    [40.13, 35.37],
    [40.44, 35.16], // Khabur meets the Euphrates
    [40.96, 34.67],
    [41.32, 34.38],
    [42.15, 34.11],
    [42.95, 34.03],
    [43.24, 33.65],
    [43.72, 33.47],
  ],
  'great-zab': [
    [44.83, 33.25], // Broad detour toward the Tigris plain
    [44.46, 33.71],
    [44.29, 34.25],
    [43.87, 34.68],
    [43.72, 35.21],
    [43.58, 35.59],
  ],
  mespila: [[43.33, 36.10]], // Larissa, usually identified with Nimrud
  'carduchian-mountains': [
    [42.98, 36.59],
    [42.82, 36.97],
    [42.70, 37.13],
  ],
  'armenian-highlands': [
    [42.18, 37.69],
    [42.03, 37.93], // Bohtan valley, commonly identified with the Centrites
    [42.10, 38.23],
    [41.82, 38.66],
  ],
  'mount-theches': [
    [41.43, 39.51],
    [41.23, 39.85],
    [40.62, 40.01],
    [40.25, 40.25], // Bayburt, proposed vicinity of Gymnias
    [39.88, 40.46],
  ],
  trapezus: [[39.67, 40.85]],
  cotyora: [
    [39.23, 41.02],
    [38.81, 40.93],
    [38.38, 40.88], // Kerasus vicinity
    [38.02, 40.92],
  ],
  calpe: [
    [37.62, 41.27],
    [36.55, 41.61],
    [35.44, 42.10],
    [35.17, 42.02], // Sinope harbor
    [35.26, 42.13],
    [34.89, 42.20],
    [33.97, 42.15],
    [32.71, 41.93],
    [31.34, 41.32], // Heraclea Pontica
    [30.80, 41.19],
  ],
  byzantium: [
    [29.92, 41.05],
    [29.57, 41.01],
    [29.30, 41.01],
    [29.06, 41.04], // Chrysopolis area, opposite Byzantium on the Bosporus
  ],
  salmydessus: [
    [28.55, 41.08],
    [28.20, 41.11], // Inland of Selymbria
    [27.97, 41.04], // Inland of Perinthus
    [27.83, 41.28],
    [27.84, 41.54],
  ],
  pergamum: [
    [27.63, 41.53],
    [27.22, 41.17],
    [26.87, 40.74],
    [26.70, 40.54],
    [26.65, 40.41], // European side of the Hellespont
    [26.69, 40.34], // Lampsacus
    [26.44, 40.14],
    [26.29, 40.01],
    [26.55, 39.76], // Crossing of Mount Ida
    [26.82, 39.57], // Antandrus
    [27.02, 39.59],
    [27.04, 39.52], // Adramyttium area
  ],
};

export const uncertainLegs = new Set([
  'thapsacus',
  'cunaxa',
  'great-zab',
  'carduchian-mountains',
  'armenian-highlands',
  'mount-theches',
  'trapezus',
  'salmydessus',
  'pergamum',
]);

export const mapReferences = [
  {
    name: 'Natural Earth',
    note: 'Public-domain coastline, inland water and terrain. The physical basemap uses modern geography.',
    url: 'https://www.naturalearthdata.com/about/terms-of-use/',
  },
  {
    name: 'C. J. Tuplin, The Anabasis in Atlas of Classical History',
    note: 'An overview of the itinerary with alternatives for the Babylonia and Armenian sections.',
    url: 'https://stuff.mit.edu/afs/athena.mit.edu/course/21/21h.401/www/local/talbert_ach.Gr.2.pdf',
  },
  {
    name: 'Brennan and Tuplin, Theches: An Elusive Mountain',
    note: 'A study of competing locations for the first sight of the Black Sea, including the İskobel ridge shown here.',
    url: 'https://doi.org/10.1017/S0066154623000054',
  },
];
