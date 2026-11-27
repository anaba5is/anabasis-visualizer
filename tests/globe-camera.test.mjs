import assert from 'node:assert/strict';
import test from 'node:test';
import { keepPointInFrame, project } from '../globe.mjs';
import { fitMapViewport } from '../map-viewport.mjs';

const frame = { x: 330, y: 300, radius: 4200, labelBounds: { left: 24, top: 100, right: 636, bottom: 500 } };
const sardis = [28.04, 38.49];

test('opening the reader preserves a camera that already shows the selected stop', () => {
  const centered = { ...frame, lon: 28.1, lat: 39 };
  assert.equal(keepPointInFrame(sardis, centered), null);
});

test('a stop under the reader or behind the globe is brought into the visible map', () => {
  for (const view of [{ ...frame, lon: 20, lat: 39 }, { ...frame, lon: -145, lat: -29 }]) {
    const adjusted = keepPointInFrame(sardis, view);
    assert.ok(adjusted);
    const point = project(sardis, { ...view, ...adjusted });
    assert.ok(point.visible);
    assert.ok(point.x >= 64 && point.x <= 596);
    assert.ok(point.y >= 132 && point.y <= 468);
  }
});

test('the projection and label bounds leave room for the desktop reader and controls', () => {
  const view = fitMapViewport(1024, 768, {
    headers: [{ bottom: 88 }],
    panels: [{ left: 650, width: 360, top: 64 }, { left: 14, width: 996, top: 631 }],
    tools: [{ left: 14, right: 334, top: 550 }],
  });
  const { left, top, right, bottom } = view.labelBounds;
  assert.equal(top, 97);
  assert.equal(bottom, 542);
  assert.ok(right < 650);
  assert.equal(view.x, (left + right) / 2);
  assert.equal(view.y, (top + bottom) / 2);
});

test('overlapping overlays still produce a usable map rectangle', () => {
  const view = fitMapViewport(40, 75, {
    headers: [{ bottom: 65 }],
    panels: [{ left: 2, width: 36, top: 24 }],
    tools: [],
  });
  assert.deepEqual(view.labelBounds, { left: 0, top: 21, right: 40, bottom: 75 });
  assert.equal(view.x, 20);
  assert.equal(view.y, 48);
  assert.ok(view.baseline > 0);
});
