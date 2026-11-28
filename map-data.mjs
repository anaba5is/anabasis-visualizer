// Higher-priority labels take precedence at a shared screen position. Regional
// anchors are representative points. Optional offsets position text in screen pixels.
export const mapLabels = [
  { name: 'Black Sea', kind: 'sea', coords: [36.35, 43.05], priority: 100, minScale: .34 },
  { name: 'Mediterranean Sea', kind: 'sea', coords: [30.8, 33.95], priority: 95, minScale: .34 },
  { name: 'Aegean Sea', kind: 'sea', coords: [26.25, 37.31], priority: 87, minScale: .48 },
  { name: 'Armenia', kind: 'land', coords: [43.55, 40.42], priority: 83, minScale: .57 },
  { name: 'Mesopotamia', kind: 'land', coords: [41.48, 35.30], priority: 81, minScale: .59 },
  { name: 'Thrace', kind: 'land', coords: [26.9, 42.49], priority: 78, minScale: .62 },
  { name: 'Babylonia', kind: 'land', coords: [44.7, 32.55], priority: 76, minScale: .64 },
  { name: 'Syria', kind: 'land', coords: [37.47, 34.10], priority: 74, minScale: .64 },
  { name: 'Cilicia', kind: 'land', coords: [35.6, 37.55], priority: 72, minScale: .69 },
  { name: 'Lydia', kind: 'land', coords: [28.73, 38.62], priority: 70, minScale: .72 },
  { name: 'Phrygia', kind: 'land', coords: [31.6, 38.77], priority: 68, minScale: .73 },
  { name: 'Cappadocia', kind: 'land', coords: [34.94, 39.04], priority: 65, minScale: .76 },
  { name: 'Bithynia', kind: 'land', coords: [31.03, 40.38], priority: 63, minScale: .78 },
  { name: 'Colchis', kind: 'land', coords: [42.63, 42.18], priority: 61, minScale: .84 },
  { name: 'Paphlagonia', kind: 'land', coords: [33.53, 41.05], priority: 59, minScale: .86 },
  { name: 'Mysia', kind: 'land', coords: [27.73, 39.61], priority: 57, minScale: .95 },
  { name: 'Euphrates', kind: 'river', coords: [41.5274, 34.4239], priority: 75, minScale: .74, offset: [-5, 12] },
  { name: 'Tigris', kind: 'river', coords: [43.7698, 34.5297], priority: 75, minScale: .74, offset: [6, -7] },
  { name: 'Sea of Marmara', kind: 'sea', coords: [28.06, 40.72], priority: 49, minScale: 1.18 },
  { name: 'Bosporus', kind: 'sea', coords: [29.074, 41.12], priority: 51, minScale: 1.27, offset: [4, -11] },
  { name: 'Hellespont', kind: 'sea', coords: [26.4, 40.158], priority: 50, minScale: 1.27, offset: [-7, 11] },
  { name: 'Maeander', kind: 'river', coords: [28.8313, 37.9595], priority: 46, minScale: 1.31, offset: [3, 11] },
  { name: 'Pyramus', kind: 'river', coords: [35.7952, 37.055], priority: 45, minScale: 1.31, offset: [5, 11] },
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
  mespila: [[43.33, 36.10]], // Larisa, usually identified with Nimrud
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
    [38.38, 40.88], // Cerasus vicinity
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

// Named text landmarks along the march shown quietly at closer route zoom.
export const routeLandmarks = [
  { id: 'celaenae-park', name: 'Celaenae', leg: 'tarsus', coords: [30.17, 38.07], cite: '1.2.7–9', note: 'Cyrus’s palace and game park at the sources of the Maeander; 30 days halt.' },
  { id: 'iconium', name: 'Iconium', leg: 'tarsus', coords: [32.48, 37.87], cite: '1.2.19', note: 'Last city of Phrygia before entering Lycaonia.' },
  { id: 'cilician-gates', name: 'Cilician Gates', leg: 'tarsus', coords: [34.78, 37.31], cite: '1.2.21', note: 'Narrow wagon pass through the Taurus range into Cilicia.' },
  { id: 'myriandrus', name: 'Myriandrus', leg: 'thapsacus', coords: [36.21, 36.64], cite: '1.4.6–8', note: 'Phoenician coastal trading port where Xenias and Pasion deserted by ship.' },
  { id: 'larisa-nimrud', name: 'Larisa (Nimrud)', leg: 'mespila', coords: [43.33, 36.10], cite: '3.4.7–9', note: 'Massive deserted brick walls beside a stone pyramid on the Tigris.' },
  { id: 'centrites', name: 'Centrites', leg: 'armenian-highlands', coords: [42.03, 37.93], cite: '4.3.1–34', note: 'Border river between Carduchia and Armenia, commonly the Botan.' },
  { id: 'gymnias', name: 'Gymnias', leg: 'mount-theches', coords: [40.25, 40.25], cite: '4.7.19', note: 'Inland city whose ruler supplied the five-day guide toward the sea.' },
  { id: 'cerasus', name: 'Cerasus', leg: 'cotyora', coords: [38.38, 40.88], cite: '5.3.2–3', note: 'Sinopean colony where a review counted 8,600 surviving soldiers.' },
  { id: 'sinope', name: 'Sinope', leg: 'calpe', coords: [35.17, 42.02], cite: '6.1.15–18', note: 'Milesian mother-city on the Black Sea where the army elected Cheirisophus sole commander.' },
  { id: 'heraclea', name: 'Heraclea', leg: 'calpe', coords: [31.34, 41.32], cite: '6.2.1–16', note: 'Megarian colony where disputes split the army into three divisions.' },
  { id: 'chrysopolis', name: 'Chrysopolis', leg: 'byzantium', coords: [29.06, 41.04], cite: '6.6.38', note: 'Chalcedonian port opposite Byzantium where the soldiers sold their plunder.' },
  { id: 'lampsacus', name: 'Lampsacus', leg: 'pergamum', coords: [26.69, 40.34], cite: '7.8.1–6', note: 'Hellespontine city where Xenophon sold his horse and sacrificed to Zeus Meilichios.' },
];

// Eastern Erzurum / Polut Dagi corridor compared in Brennan & Tuplin (2023).
export const alternativeBook4Corridor = {
  name: 'Eastern Polut corridor (alt.)',
  points: [
    [41.64, 39.18],
    [41.27, 39.91],
    [40.92, 40.26],
    [40.52, 40.54],
    [40.28, 40.62],
    [40.02, 40.88],
    [39.72, 41.00],
  ],
  labelCoords: [40.52, 40.54],
  source: 'https://doi.org/10.1017/S0066154623000054',
};

export const mapReferences = [
  {
    name: 'Natural Earth',
    note: 'Public-domain coastline, inland water and terrain. The physical basemap uses modern geography.',
    url: 'https://www.naturalearthdata.com/about/terms-of-use/',
  },
  {
    name: 'The Archaeological Exploration of Sardis',
    note: 'Crawford H. Greenewalt Jr. on the Hermus valley and the geography of Lydia and neighboring Mysia.',
    url: 'https://www.sardisexpedition.org/en/essays/latw-greenewalt-introduction',
  },
  {
    name: 'Colchis',
    note: 'Encyclopaedia Iranica on the historical region at the eastern end of the Black Sea.',
    url: 'https://www.iranicaonline.org/articles/colchis/',
  },
  {
    name: 'Strabo, Geography 12.3',
    note: 'A later ancient description of Paphlagonia, Mount Olgassys and the southern Black Sea coast.',
    url: 'https://penelope.uchicago.edu/Thayer/e/roman/texts/strabo/12c%2A.html',
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
