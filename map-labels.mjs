import { firstAvailableLabel } from './label-geometry.mjs';

const defaultStopOffsets = [[13, 4, 'start'], [-13, 4, 'end'], [0, -15, 'middle'], [0, 24, 'middle'], [0, -31, 'middle'], [0, 38, 'middle']];

export function createMapLabels(stops, stopNodes, places, stopLayouts) {
  const measurements = new Map();
  let viewportWidth;

  function measure(node) {
    if (measurements.has(node)) return measurements.get(node);
    const size = Number.parseFloat(getComputedStyle(node).fontSize) || 13;
    const width = node.getComputedTextLength() || node.textContent.length * size * .56;
    const metrics = { width: width + 5, above: size * .9 + 2, below: size * .25 + 2 };
    measurements.set(node, metrics);
    return metrics;
  }

  function place(node, point, candidates, bounds, occupied) {
    const label = firstAvailableLabel(point, measure(node), candidates, bounds, occupied);
    node.setAttribute('visibility', label ? 'visible' : 'hidden');
    if (!label) return undefined;

    node.style.textAnchor = label.anchor;
    node.setAttribute('x', label.x);
    node.setAttribute('y', label.y);
    occupied.push(label);
    return label;
  }

  function clearMetrics() {
    measurements.clear();
  }

  function drawStops(view, positions, selectedIndex, layers, pins) {
    if (view.width !== viewportWidth) {
      viewportWidth = view.width;
      clearMetrics();
    }

    const occupied = [...pins];
    let selectedBox;
    const order = [selectedIndex, ...stops.keys()].filter((index, position) => position === 0 || index !== selectedIndex);
    for (const index of order) {
      const node = stopNodes[index];
      const point = positions[index];
      const layout = stopLayouts[stops[index].id] ?? {};
      const isSelected = index === selectedIndex;
      const isFeatured = view.width >= 690 && view.scale > .54 && layout.featured;
      const isPreviewed = node.classList.contains('preview');
      if (!layers.route || !layers.places || !point.visible || !(isSelected || isFeatured || isPreviewed)) {
        node.setAttribute('visibility', 'hidden');
        continue;
      }

      const preferred = [layout.dx ?? 0, layout.dy ?? -16, layout.anchor ?? 'middle'];
      const label = place(node, point, [preferred, ...defaultStopOffsets], view.labelBounds, occupied);
      if (isSelected) selectedBox = label;
    }
    return { occupied: occupied.slice(pins.length), selectedBox };
  }

  function drawPlaces(view, occupied, showPlaces) {
    const narrow = view.width < 540;
    const limit = narrow ? 8 : 14;
    let shown = 0;
    for (const { node, coords, kind, minScale, offset = [0, 0] } of places) {
      const point = view.locate(coords);
      const requiredScale = (minScale ?? (kind === 'sea' ? .55 : .72)) + (narrow && kind !== 'sea' ? .17 : 0);
      if (!showPlaces || node.style.display === 'none' || !point.visible || view.scale < requiredScale || shown >= limit) {
        node.setAttribute('visibility', 'hidden');
        continue;
      }

      const [dx, dy] = offset;
      const candidates = [[dx, dy, 'middle'], [dx, dy - 14, 'middle'], [dx, dy + 13, 'middle']];
      if (place(node, point, candidates, view.labelBounds, occupied)) shown += 1;
    }
  }

  return { drawStops, drawPlaces, clearMetrics, forget: node => measurements.delete(node) };
}
