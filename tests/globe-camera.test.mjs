import assert from 'node:assert/strict';
import test from 'node:test';
import { keepPointInFrame, project } from '../globe.mjs';

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
