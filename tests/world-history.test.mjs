import assert from 'node:assert/strict';
import test from 'node:test';
import { worldPolitySource } from '../assets/world-polity-geometry.mjs';
import { worldRegions, worldSiteRecords } from '../world-history.mjs';
import { worldViews } from '../world-sites.mjs';

test('world outlines are reviewed dated records with usable rings', () => {
  const year = worldPolitySource.year;
  assert.equal(year, -401);
  assert(worldRegions.length >= 12);
  for (const region of worldRegions) {
    assert(region.fromYear <= year && region.toYear >= year, region.name);
    assert.equal(region.kind, 'territory');
    for (const ring of region.rings) {
      assert(ring.length >= 4, region.name);
      assert.deepEqual(ring[0], ring.at(-1), region.name);
    }
  }
});

test('disputed or late source outlines are excluded from the shaded layer', () => {
  const outlines = new Set(worldRegions.map(region => region.sourceName));
  for (const name of ['Roman Republic', 'Xu', 'Yuezhi', 'Magadha - Shaishunaga Dynasty', 'Zapotec Civilization']) {
    assert(!outlines.has(name), name);
  }

  const sites = new Set(worldSiteRecords.map(site => site.id));
  for (const id of ['rome', 'monte-alban', 'budj-bim', 'taxila-gandhara', 'anuradhapura']) assert(sites.has(id), id);
});

test('all world index records link to sources and a browsable geographic region', () => {
  const groups = new Set(worldViews.map(view => view.id));
  const records = [...worldRegions, ...worldSiteRecords];
  assert.equal(new Set(records.map(record => record.id)).size, records.length);
  for (const entry of records) {
    const [longitude, latitude] = entry.coords;
    assert(groups.has(entry.group), entry.name);
    assert(Number.isFinite(longitude) && Math.abs(longitude) <= 180, entry.name);
    assert(Number.isFinite(latitude) && Math.abs(latitude) <= 90, entry.name);
    assert.equal(new URL(entry.source).protocol, 'https:', entry.name);
    assert(entry.note.length > 0, entry.name);
  }
  for (const group of groups) assert(records.some(entry => entry.group === group), group);
});
