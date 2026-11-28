import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync } from 'node:fs';
import { stops } from '../story.mjs';
import { scenes } from '../scenes.mjs';
import { captions } from '../captions.mjs';
import { expeditionContext, sceneContext } from '../scene-context.mjs';
import { readAtlasLocation, writeAtlasLocation } from '../atlas-location.mjs';
import { createMapLabels } from '../map-labels.mjs';
import { bookFor, formatStopDate } from '../journey-format.mjs';
import { stopMetrics, primaryQuotes } from '../expedition-metrics.mjs';
import { routeLandmarks, seaLegs, alternativeBook4Corridor } from '../map-data.mjs';
import { figures, stopFigures } from '../expedition-figures.mjs';

test('every stop has key figures with valid bios and Wikisource links', () => {
  const ids = stops.map(stop => stop.id);
  assert.deepEqual([...ids].sort(), Object.keys(stopFigures).sort());
  for (const [stopId, list] of Object.entries(stopFigures)) {
    assert(list.length >= 2, stopId);
    for (const id of list) {
      const person = figures[id];
      assert(person && person.name && person.faction && person.bio, id);
      assert.equal(new URL(person.source).protocol, 'https:', id);
    }
  }
  for (const leg of seaLegs) assert(ids.includes(leg), leg);
});

test('every stop has historical context, elevation metrics, and non-decreasing distance', () => {
  const ids = stops.map(stop => stop.id);
  assert.deepEqual([...ids].sort(), Object.keys(sceneContext).sort());
  assert.deepEqual([...ids].sort(), Object.keys(stopMetrics).sort());
  let prevKm = -1;
  for (const id of ids) {
    const m = stopMetrics[id];
    assert(Number.isFinite(m.elevationM) && m.elevationM >= 0, id);
    assert(m.terrain.length > 0, id);
    assert(m.plottedKm >= prevKm, id);
    prevKm = m.plottedKm;
    if (m.muster) assert.match(m.musterCite, /^[1-7]\.\d+\.\d+$/);
  }
  for (const [id, quote] of Object.entries(primaryQuotes)) {
    assert(ids.includes(id), id);
    assert(quote.text.length > 0 && /^[1-7]\.\d+\.\d+$/.test(quote.cite), id);
  }
});

test('route landmarks and alternative Book IV corridor carry valid coordinates and citations', () => {
  const ids = new Set(stops.map(stop => stop.id));
  assert(routeLandmarks.length >= 10);
  for (const lm of routeLandmarks) {
    assert(ids.has(lm.leg), lm.id);
    assert(Math.abs(lm.coords[0]) <= 180 && Math.abs(lm.coords[1]) <= 90, lm.id);
    assert(lm.cite && lm.note, lm.id);
  }
  assert(alternativeBook4Corridor.points.length >= 5);
  assert.equal(new URL(alternativeBook4Corridor.source).protocol, 'https:');
});

test('every stop has a date label, a scene, and its local image', () => {
  const ids = stops.map(stop => stop.id).sort();
  assert.equal(new Set(ids).size, 15);
  assert.deepEqual(ids, Object.keys(scenes).sort());
  assert.deepEqual(ids, Object.keys(captions).sort());
  for (const { id, date } of stops) {
    assert.match(date, /BCE$/);
    assert(existsSync(new URL('../assets/' + scenes[id].file, import.meta.url)), id);
  }
});

test('historical context and artwork link to their source', () => {
  const ids = new Set(stops.map(stop => stop.id));
  for (const id of Object.keys(sceneContext)) assert(ids.has(id), id);
  for (const entry of [expeditionContext, ...Object.values(sceneContext)]) {
    assert(entry.title && entry.text && entry.sourceLabel);
    assert.equal(new URL(entry.source).protocol, 'https:');
  }

  for (const [id, scene] of Object.entries(scenes)) {
    assert(scene.alt && scene.caption && scene.credit, id);
    assert.equal(new URL(scene.source).protocol, 'https:', id);
    assert.equal(new URL(scene.licenseUrl).protocol, 'https:', id);
    if (scene.imageKind) assert(scene.objectDate, id);
    for (const variant of ['card-', 'thumb-']) {
      assert(existsSync(new URL('../assets/previews/' + variant + scene.file, import.meta.url)), id);
    }
  }
});

test('journey dates use the same wording in the reader and accessible timeline', () => {
  const winter = stops.find(stop => stop.id === 'armenian-highlands');
  assert.equal(bookFor(winter), 'IV');
  assert.equal(formatStopDate(winter), 'Winter 401–400 BCE');
  assert.equal(formatStopDate(winter, { spoken: true }), 'Winter 401–400 BCE');
  assert.equal(formatStopDate(stops[0]), 'c. 401 BCE');
  assert.equal(formatStopDate(stops[0], { spoken: true }), 'circa 401 BCE');
});

test('route, region and place bookmarks round-trip as distinct locations', () => {
  for (const [type, id] of [['stop', 'pergamum'], ['world', 'east-asia'], ['place', 'monte-alban']]) {
    assert.deepEqual(readAtlasLocation(writeAtlasLocation(type, id)), { type, id });
  }
  assert.equal(readAtlasLocation('#sources'), undefined);
  assert.equal(readAtlasLocation('#place=invalid#stop=sardis'), undefined);
});

test('stop label placement gives another pin room before trying its preferred anchor', t => {
  globalThis.getComputedStyle = () => ({ fontSize: '13px' });
  t.after(() => { delete globalThis.getComputedStyle; });
  const attrs = new Map();
  const node = {
    getComputedTextLength: () => 67,
    classList: { contains: () => false },
    style: {},
    setAttribute: (name, value) => attrs.set(name, value),
  };
  const labels = createMapLabels([{ id: 'byzantium' }], [node], [], {
    byzantium: { dx: -8, dy: -19, anchor: 'middle', featured: true },
  });
  const pin = { left: 138, right: 152, top: 71, bottom: 85 };
  const result = labels.drawStops(
    { width: 1024, scale: 1, labelBounds: { left: 0, right: 1024, top: 0, bottom: 768 } },
    [{ x: 170, y: 101, visible: true }], 0, { route: true, places: true }, [pin],
  );
  assert.equal(attrs.get('visibility'), 'visible');
  assert(result.selectedBox.left >= pin.right || result.selectedBox.top >= pin.bottom);
});
