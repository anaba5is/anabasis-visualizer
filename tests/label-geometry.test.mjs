import assert from 'node:assert/strict';
import test from 'node:test';
import { firstAvailableLabel, labelBox, labelFits } from '../label-geometry.mjs';

const bounds = { left: 8, right: 312, top: 60, bottom: 420 };
const metrics = { width: 80, above: 12, below: 4 };

test('SVG text anchors reserve the correct side of a marker', () => {
  assert.equal(labelBox(100, 100, metrics, 'start').left, 100);
  assert.equal(labelBox(100, 100, metrics).left, 60);
  assert.equal(labelBox(100, 100, metrics, 'end').left, 20);
});

test('labels cannot enter the area occupied by the mobile controls', () => {
  assert.equal(labelFits(labelBox(160, 417, metrics), bounds, []), false);
  assert.equal(labelFits(labelBox(160, 72, metrics), bounds, []), true);
});

test('placement tries the opposite side when the first label is out of bounds', () => {
  const label = firstAvailableLabel(
    { x: 295, y: 110 }, metrics, [[12, 0, 'start'], [-12, 0, 'end']], bounds, [],
  );
  assert.equal(label.anchor, 'end');
});

test('placement avoids a route pin and declines when all options collide', () => {
  const pin = { left: 145, right: 157, top: 104, bottom: 116 };
  const point = { x: 160, y: 110 };
  const candidates = [[0, 0, 'middle'], [14, 0, 'start']];
  assert.equal(firstAvailableLabel(point, metrics, candidates, bounds, [pin]).anchor, 'start');
  assert.equal(firstAvailableLabel(point, metrics, candidates.slice(0, 1), bounds, [pin]), undefined);
});
