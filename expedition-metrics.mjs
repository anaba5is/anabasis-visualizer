// Approximate stop elevations, schematic polyline distances, attested Greek
// muster counts, and primary-source lines from H. G. Dakyns's translation.

export const stopMetrics = {
  sardis: {
    elevationM: 120,
    terrain: 'Hermus valley (~120 m)',
    plottedKm: 0,
  },
  tarsus: {
    elevationM: 25,
    terrain: 'Cilician plain (~25 m, via ~1,050 m Cilician Gates)',
    plottedKm: 754,
  },
  thapsacus: {
    elevationM: 290,
    terrain: 'Upper Euphrates ford (~290 m)',
    plottedKm: 1095,
  },
  cunaxa: {
    elevationM: 40,
    terrain: 'Alluvial plain (~40 m)',
    plottedKm: 1740,
    muster: '10,400 heavy + 2,500 light infantry',
    musterCite: '1.7.10',
  },
  'great-zab': {
    elevationM: 270,
    terrain: 'Zab river plain (~270 m)',
    plottedKm: 2149,
  },
  mespila: {
    elevationM: 220,
    terrain: 'Tigris valley (~220 m)',
    plottedKm: 2194,
  },
  'carduchian-mountains': {
    elevationM: 1650,
    terrain: 'Zagros-Taurus gorges (~1,650 m passes)',
    plottedKm: 2328,
  },
  'armenian-highlands': {
    elevationM: 1950,
    terrain: 'Highland plateau (~1,950 m)',
    plottedKm: 2544,
  },
  'mount-theches': {
    elevationM: 2200,
    terrain: 'Pontic divide (~2,200 m proposed ridge)',
    plottedKm: 2792,
  },
  trapezus: {
    elevationM: 15,
    terrain: 'Black Sea coast (sea level)',
    plottedKm: 2827,
  },
  cotyora: {
    elevationM: 15,
    terrain: 'Pontic coast (sea level)',
    plottedKm: 2988,
    muster: '8,600 surviving troops at Cerasus',
    musterCite: '5.3.3',
  },
  calpe: {
    elevationM: 20,
    terrain: 'Bithynian headland (sea level)',
    plottedKm: 3711,
  },
  byzantium: {
    elevationM: 30,
    terrain: 'Bosporus strait (sea level)',
    plottedKm: 3817,
  },
  salmydessus: {
    elevationM: 20,
    terrain: 'Thracian coast (sea level)',
    plottedKm: 3986,
  },
  pergamum: {
    elevationM: 100,
    terrain: 'Caicus valley (~100 m)',
    plottedKm: 4372,
    muster: 'About 6,000 enter Thibron’s force',
    musterCite: '7.7.23',
  },
};

export const primaryQuotes = {
  tarsus: {
    text: 'The soldiers said flatly that they would go no further, for they had not been hired for this, to march against the King.',
    cite: '1.3.1',
  },
  cunaxa: {
    text: 'Not a man among the Greeks suffered even a wound in this battle, save one on the left wing who was said to have been shot with an arrow.',
    cite: '1.8.20',
  },
  'great-zab': {
    text: 'Few tasted food that evening, few kindled a fire, and many never came up to the camp at all that night.',
    cite: '3.1.3',
    mapCallout: true,
  },
  'armenian-highlands': {
    text: 'The third day’s march was hard, and a north wind blew full in their faces, parching everything and benumbing the men.',
    cite: '4.5.3',
    mapCallout: true,
  },
  'mount-theches': {
    text: 'The sea! The sea!',
    cite: '4.7.24',
    mapCallout: true,
  },
  byzantium: {
    text: 'Now the gates were shut, and the bolts fastened; the soldiers began beating down the gates and saying they were being treated with gross injustice.',
    cite: '7.1.16',
    mapCallout: true,
  },
  pergamum: {
    text: 'Then Thibron arrived and took over the army, and uniting it with the rest of his Hellenic forces proceeded to prosecute a war against Tissaphernes and Pharnabazus.',
    cite: '7.8.24',
  },
};
