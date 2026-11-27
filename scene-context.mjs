const anabasis = (book, chapter) =>
  `https://en.wikisource.org/wiki/Anabasis_(Dakyns)/Book_${book}/Chapter_${chapter}`;

export const expeditionContext = {
  title: 'Cyrus and Sparta',
  text: 'Sparta defeated Athens in 404 BCE. In the closing years of that war, Cyrus had provided Persian funds to the Spartan admiral Lysander. When Cyrus prepared his own bid for the Persian throne, he could draw on an alliance he had helped to build.',
  source: 'https://www.iranicaonline.org/articles/cyrus-vi-younger/',
  sourceLabel: 'Encyclopaedia Iranica, Cyrus the Younger',
};

export const sceneContext = {
  tarsus: {
    title: 'Epyaxa’s diplomacy',
    text: 'Cilicia had its own royal court under Persian rule. Xenophon reports that Queen Epyaxa may have given Cyrus money on the march. At Tarsus she persuaded Syennesis, her husband and Cilicia’s ruler, to meet Cyrus under pledges of good faith.',
    source: anabasis(1, 2),
    sourceLabel: 'Xenophon, Anabasis 1.2.11–12, 1.2.25–27',
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
  'mount-theches': {
    title: 'The guide from Gymnias',
    text: 'The ruler of Gymnias sent the army a guide through land held by his enemies. On the way the guide urged the troops to ravage the country. Xenophon took this as the man’s reason for helping them.',
    source: anabasis(4, 7),
    sourceLabel: 'Xenophon, Anabasis 4.7.19–20',
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
  pergamum: {
    title: 'Why Sparta sent Thibron',
    text: 'In his Hellenica, Xenophon explains that Tissaphernes took over the provinces Cyrus had governed and demanded that the Ionian cities submit. The cities appealed to Sparta, which sent Thibron. Cyrus’s surviving troops joined a campaign already under way.',
    source: 'https://en.wikisource.org/wiki/Hellenica_(Dakyns)/Book_3/Chapter_1',
    sourceLabel: 'Xenophon, Hellenica 3.1.3–6',
  },
};
