import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync } from 'node:fs';
import { stops } from '../story.mjs';
import { scenes } from '../scenes.mjs';
import { captions } from '../captions.mjs';
import { readAtlasLocation, writeAtlasLocation } from '../atlas-location.mjs';
import { createMapLabels } from '../map-labels.mjs';

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
