import { achaemenidRings, macedonRings, odrysianRings } from './assets/polity-geometry.mjs';

const cliopatria = 'https://github.com/Seshat-Global-History-Databank/cliopatria/releases/tag/v0.2.2';
const satrapies = 'https://www.iranicaonline.org/articles/achaemenid-satrapies/';
const egypt = 'https://www.cambridge.org/core/books/abs/cambridge-ancient-history/egypt-404332-bc/7B70F72C3389EB2B29D646F7BAA6318D';
const cyprus = 'https://www.iranicaonline.org/articles/cyprus-achaemenid/';
const greekCities = 'https://assets.cambridge.org/97805218/50490/excerpt/9780521850490_excerpt.pdf';
const anabasis = (book, chapter) => `https://en.wikisource.org/wiki/Anabasis_(Dakyns)/Book_${book}/Chapter_${chapter}`;

export const politicalRegions = [
  {
    id: 'achaemenid-empire',
    name: 'Achaemenid Empire',
    coords: [46.2, 34.0],
    rings: achaemenidRings,
    color: '#d89d6a',
    source: cliopatria,
    note: 'Approximate imperial extent around 401 BCE under Artaxerxes II. Authority varied within the outline, and Egypt’s transition zone is left unshaded.',
  },
  {
    id: 'odrysian-thrace',
    name: 'Odrysian Kingdom',
    coords: [25.8, 42.42],
    rings: odrysianRings,
    color: '#b8a4d1',
    source: cliopatria,
    note: 'Approximate Odrysian extent in Thrace. Xenophon describes several rulers and competing local claims, including those of Seuthes and Medocus.',
  },
  {
    id: 'macedon',
    name: 'Kingdom of Macedon',
    coords: [22.45, 40.84],
    rings: macedonRings,
    color: '#99be97',
    source: cliopatria,
    note: 'Approximate extent of the kingdom under Archelaus I, decades before the conquests of Philip II and Alexander.',
  },
];

export const administrations = [
  {
    id: 'sardis-lydia', name: 'Sardis', kind: 'seat', coords: [28.04, 38.49], source: satrapies,
    note: 'Seat of Achaemenid Lydia, called Sparda in Old Persian. Cyrus gathered the expedition here.',
  },
  {
    id: 'dascylium', name: 'Dascylium', kind: 'seat', coords: [28.05, 40.13], source: satrapies,
    note: 'Residence of Pharnabazus and center of Hellespontine Phrygia, near modern Ergili.',
  },
  {
    id: 'celaenae', name: 'Celaenae', kind: 'seat', coords: [30.17, 38.07], source: anabasis(1, 2),
    note: 'Administrative center in Greater Phrygia, near modern Dinar. Xenophon describes Cyrus’s palace and park here.',
  },
  {
    id: 'cappadocia-province', name: 'Cappadocia', kind: 'province', coords: [34.85, 38.65], source: satrapies,
    note: 'An attested Achaemenid province. The marker locates the broad region, whose administrative divisions and frontiers changed over time.',
  },
  {
    id: 'tarsus-cilicia', name: 'Tarsus', kind: 'seat', coords: [34.89, 36.92], source: anabasis(1, 2),
    note: 'Seat of Syennesis, the local ruler of Cilicia in 401 BCE. Cilicia’s administration was reorganized under direct royal appointees after this period.',
  },
  {
    id: 'damascus-ebir-nari', name: 'Damascus', kind: 'seat', coords: [36.31, 33.51], source: satrapies,
    note: 'A probable administrative center of Ebir-nāri, or Beyond the River. The identification as provincial capital is inferred from later evidence.',
  },
  {
    id: 'babylon', name: 'Babylon', kind: 'seat', coords: [44.42, 32.54], source: satrapies,
    note: 'Major imperial center and administrative seat of Babylonia. Cyrus marched toward Babylon before the battle at Cunaxa.',
  },
  {
    id: 'arbela', name: 'Arbela', kind: 'seat', coords: [44.01, 36.19], source: satrapies,
    note: 'Center of the district of Arbelitis, at modern Erbil. Its exact relationship to larger provinces changed over time.',
  },
  {
    id: 'western-armenia', name: 'Western Armenia', kind: 'province', coords: [40.25, 39.40], source: anabasis(4, 4),
    note: 'Xenophon names Tiribazus as governor of Western Armenia. The marker indicates a broad region, and his rank and jurisdiction are debated.',
  },
  {
    id: 'armenia-province', name: 'Armenia', kind: 'province', coords: [43.4, 39.82], source: anabasis(3, 5),
    note: 'Xenophon identifies Orontas as ruler of Armenia. The marker locates the broad region without assigning a capital or a frontier.',
  },
  {
    id: 'susa', name: 'Susa', kind: 'seat', coords: [48.25, 32.19], source: anabasis(3, 5),
    note: 'A royal residence and a center of Achaemenid administration. Guides name the road toward Susa and Ecbatana during the retreat.',
  },
  {
    id: 'ecbatana', name: 'Ecbatana', kind: 'seat', coords: [48.52, 34.80], source: satrapies,
    note: 'The old Median capital and a royal residence at modern Hamadan. Xenophon associates Ecbatana with the king’s summer court.',
  },
  {
    id: 'salamis-cyprus', name: 'Salamis, Cyprus', kind: 'local', coords: [33.90, 35.18], source: cyprus,
    note: 'Chief city of Evagoras I. The empire generally left Cyprus’s local kings in place, and the island’s relationship to the Great King varied.',
  },
  {
    id: 'egypt-in-revolt', name: 'Egypt in revolt', kind: 'context', coords: [30.77, 30.96], source: egypt,
    note: 'Amyrtaeus came to power in the Nile Delta around 404 BCE. Documents still recognize Artaxerxes II at Elephantine in 401 BCE.',
  },
  {
    id: 'carduchians', name: 'Carduchians', kind: 'context', coords: [42.68, 37.58], source: anabasis(3, 5),
    note: 'Xenophon says these mountain communities were outside the Great King’s authority. Their exact territory is unknown.',
  },
  {
    id: 'athens', name: 'Athens', kind: 'local', coords: [23.73, 37.97], source: greekCities,
    note: 'Greek city-state and Xenophon’s home. The democracy returned in 403 BCE after Sparta’s defeat of Athens in the Peloponnesian War.',
  },
  {
    id: 'sparta', name: 'Sparta', kind: 'local', coords: [22.43, 37.08], source: greekCities,
    note: 'Leading Greek city-state after the Peloponnesian War. The surviving mercenaries eventually came under the Spartan commander Thibron.',
  },
];

export const historicalSources = [
  {
    name: 'Cliopatria v0.2.2', url: cliopatria,
    note: 'James S. Bennett and colleagues, Seshat Global History Databank. Selected historical outlines, generalized and adapted. Distributed under CC BY 4.0.',
  },
  {
    name: 'Creative Commons Attribution 4.0', url: 'https://creativecommons.org/licenses/by/4.0/',
    note: 'License for the adapted Cliopatria geometry.',
  },
  {
    name: 'Achaemenid Satrapies', url: satrapies,
    note: 'Bruno Jacobs in Encyclopaedia Iranica. Provincial centers, ranks and geographical uncertainties.',
  },
  {
    name: 'Egypt, 404–332 B.C.', url: egypt,
    note: 'Cambridge Ancient History on the uneven end of Persian rule under Amyrtaeus.',
  },
  {
    name: 'Cyprus in the Achaemenid Period', url: cyprus,
    note: 'Antigoni Zournatzi in Encyclopaedia Iranica on the island’s local kingdoms and Persian authority.',
  },
];
