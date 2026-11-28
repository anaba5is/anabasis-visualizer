const anabasis = (book, chapter) =>
  `https://en.wikisource.org/wiki/Anabasis_(Dakyns)/Book_${book}/Chapter_${chapter}`;

export const expeditionContext = {
  title: 'Cyrus and Sparta',
  text: 'Sparta defeated Athens in 404 BCE. In the closing years of that war, Cyrus had provided Persian funds to the Spartan admiral Lysander. When Cyrus prepared his own bid for the Persian throne, he could draw on an alliance he had helped to build.',
  source: 'https://www.iranicaonline.org/articles/cyrus-vi-younger/',
  sourceLabel: 'Encyclopaedia Iranica, Cyrus the Younger',
};

export const sceneContext = {
  sardis: {
    title: 'Seat of western Anatolia',
    text: 'Called Sparda in Old Persian, Sardis served as the western Achaemenid satrapal capital and the western end of the Royal Road to Susa. Its citadel and treasury made it the main staging ground for Persian command near the Aegean.',
    source: 'https://www.iranicaonline.org/articles/sardis/',
    sourceLabel: 'Encyclopaedia Iranica, Sardis',
  },
  tarsus: {
    title: 'Epyaxa’s diplomacy',
    text: 'Cilicia had its own royal court under Persian rule. Xenophon reports that Queen Epyaxa may have given Cyrus money on the march. At Tarsus she persuaded Syennesis, her husband and Cilicia’s ruler, to meet Cyrus under pledges of good faith.',
    source: anabasis(1, 2),
    sourceLabel: 'Xenophon, Anabasis 1.2.11–12, 1.2.25–27',
  },
  thapsacus: {
    title: 'The burned boat-bridge',
    text: 'The Persian commander Abrocomas marched ahead of Cyrus and burned the boats normally used to cross at Thapsacus. When the army waded across with water no higher than the chest, local inhabitants said the river had never been forded on foot before, and Cyrus’s supporters treated the low water as a sign of favor.',
    source: anabasis(1, 4),
    sourceLabel: 'Xenophon, Anabasis 1.4.17–18',
  },
  cunaxa: {
    title: 'Two Greek witnesses',
    text: 'Xenophon fought with Cyrus. Ctesias, a Greek doctor at Artaxerxes’s court, witnessed the battle from the royal side. Parts of his account survive in later writers. The name Cunaxa comes from Plutarch’s Life of Artaxerxes.',
    source: 'https://www.iranicaonline.org/articles/cunaxa/',
    sourceLabel: 'Encyclopaedia Iranica, Cunaxa',
  },
  'great-zab': {
    title: 'Xenophon’s question at Delphi',
    text: 'Before joining the expedition, Xenophon asked Socrates for advice. At Delphi he asked which gods to honor for a safe and successful journey. When he returned, Socrates pointed out that Xenophon had already assumed he was going.',
    source: anabasis(3, 1),
    sourceLabel: 'Xenophon, Anabasis 3.1.5–7',
  },
  mespila: {
    title: 'The fall of Nineveh',
    text: 'Sennacherib made Nineveh the Assyrian capital and enclosed it in a massive wall. A coalition of Babylonian and Median forces captured the city in 612 BCE, roughly two centuries before the Greeks passed the ruins usually identified with it.',
    source: 'https://ninive.uni-heidelberg.de/nin_history_en.html',
    sourceLabel: 'Nineveh research project, Heidelberg University',
  },
  'carduchian-mountains': {
    title: 'Stripping the baggage train',
    text: 'Before climbing into Carduchia, the generals burned the wagons and tents, let go of excess pack animals, and released most of the captives taken on the march. Wagons slowed the column in narrow defiles and tied troops down guarding gear.',
    source: anabasis(4, 1),
    sourceLabel: 'Xenophon, Anabasis 4.1.12–14',
  },
  'armenian-highlands': {
    title: 'Subterranean winter houses',
    text: 'Xenophon describes villages whose houses were dug beneath the ground with narrow mouths like wells and broad rooms below. Goats, sheep, cattle, and fowl had separate dug-out entrances, while people went down by ladder and sipped barley wine through jointless reeds.',
    source: anabasis(4, 5),
    sourceLabel: 'Xenophon, Anabasis 4.5.25–27',
  },
  'mount-theches': {
    title: 'The guide from Gymnias',
    text: 'The ruler of Gymnias sent the army a guide through land held by his enemies. On the way the guide urged the troops to ravage the country. Xenophon took this as the man’s reason for helping them.',
    source: anabasis(4, 7),
    sourceLabel: 'Xenophon, Anabasis 4.7.19–20',
  },
  trapezus: {
    title: 'Intoxicating Pontic honey',
    text: 'In the mountain villages above Trapezus, soldiers ate honeycombs and collapsed with vomiting, delirium, and stupor. None died, and most recovered within three or four days. Modern botany links the account to grayanotoxins in Pontic rhododendron nectar.',
    source: anabasis(4, 8),
    sourceLabel: 'Xenophon, Anabasis 4.8.20–21',
  },
  cotyora: {
    title: 'Sinope’s network of ports',
    text: 'The envoy Hecatonymus says Cotyora, Cerasus and Trapezus all pay tribute to Sinope. In his view, the army’s raids around Cotyora harm Sinope itself. The connection gives the envoys a direct stake in the dispute.',
    source: anabasis(5, 5),
    sourceLabel: 'Xenophon, Anabasis 5.5.7–11',
  },
  calpe: {
    title: 'The idea of staying',
    text: 'At Cotyora, Xenophon says he considered founding a Greek city on the coast. The seer Silanus wanted to go home and spread word that Xenophon meant to keep the army there. That earlier dispute helps explain the soldiers’ suspicion at Calpe.',
    source: anabasis(5, 6),
    sourceLabel: 'Xenophon, Anabasis 5.6.15–17',
  },
  byzantium: {
    title: 'Persian pressure on the straits',
    text: 'Pharnabazus, governor of Hellespontine Phrygia, urged the Spartan admiral Anaxibius to move Cyrus’s veterans out of Asia so they would stop raiding his province. Anaxibius promised pay to lure them across the Bosporus, then tried to shut them outside Byzantium.',
    source: anabasis(7, 1),
    sourceLabel: 'Xenophon, Anabasis 7.1.2–7',
  },
  salmydessus: {
    title: 'Shipwrecks and written books',
    text: 'Ships entering the Black Sea often ran aground on the long shoals off Salmydessus, where local Thracians set boundary pillars along the beach to divide the wreckage cleanly. Among the washed-up couches and chests, Xenophon notes many written books.',
    source: anabasis(7, 5),
    sourceLabel: 'Xenophon, Anabasis 7.5.12–14',
  },
  pergamum: {
    title: 'Why Sparta sent Thibron',
    text: 'In his Hellenica, Xenophon explains that Tissaphernes took over the provinces Cyrus had governed and demanded that the Ionian cities submit. The cities appealed to Sparta, which sent Thibron. Cyrus’s surviving troops joined a campaign already under way.',
    source: 'https://en.wikisource.org/wiki/Hellenica_(Dakyns)/Book_3/Chapter_1',
    sourceLabel: 'Xenophon, Hellenica 3.1.3–6',
  },
};
