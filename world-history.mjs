import { worldPolityGeometry, worldPolitySource } from './assets/world-polity-geometry.mjs';
import { asiaPolities, asiaSites } from './world-context-asia.mjs';
import { westPolities, westSites } from './world-context-west.mjs';
import { americanAndOceanianSites } from './world-sites.mjs';

const selectedPolities = { ...westPolities, ...asiaPolities };
const fills = ['#aa615f', '#577f93', '#aa8545', '#6e905e', '#8c71a7', '#ac783c', '#548c81'];

// The source archive is broader than this public layer. Keep only records
// reviewed for this year, and keep the early Roman Republic as a point at Rome.
export const worldRegions = worldPolityGeometry.flatMap((geometry, i) => {
  const entry = selectedPolities[geometry.sourceName];
  if (!entry || geometry.sourceName === 'Roman Republic') return [];
  const fillColor = entry.color ?? fills[i % fills.length];
  return [{
    ...geometry,
    ...entry,
    id: 'territory-' + geometry.id,
    kind: 'territory',
    color: '#192e32',
    fillColor,
    fillOpacity: .38,
    worldFillOpacity: .45,
    overview: geometry.areaKm2 >= 50000,
    source: entry.source ?? worldPolitySource.release,
    geometrySource: worldPolitySource.release,
  }];
});

export const worldSiteRecords = [...westSites, ...asiaSites, ...americanAndOceanianSites];
