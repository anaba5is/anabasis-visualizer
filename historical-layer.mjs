import { politicalRegions, administrations } from './historical-data.mjs';
import { createProjector } from './globe.mjs?v=4';

const NS = 'http://www.w3.org/2000/svg';
const SCREEN_MARGIN = 8;
const LABEL_ASCENT = 14;
const LABEL_DESCENT = 5;

function element(name, className, text) {
  const node = document.createElementNS(NS, name);
  if (className) node.setAttribute('class', className);
  if (text) node.textContent = text;
  return node;
}

function sampleRing(ring) {
  const samples = [ring[0]];
  for (let i = 1; i < ring.length; i++) {
    const [lon, lat] = ring[i - 1];
    const [nextLon, nextLat] = ring[i];
    const distance = Math.hypot(nextLon - lon, nextLat - lat);
    const pieces = Math.max(1, Math.ceil(distance / 2));
    for (let p = 1; p <= pieces; p++) {
      samples.push([lon + (nextLon - lon) * p / pieces, lat + (nextLat - lat) * p / pieces]);
    }
  }
  return samples;
}

function round(value) {
  return value.toFixed(1);
}

function pathThrough(points) {
  return points.map((point, index) => `${index ? 'L' : 'M'}${round(point.x)} ${round(point.y)}`).join('');
}

function horizonIntersection(a, b, view) {
  let start = 0;
  let end = 1;
  let point;
  for (let step = 0; step < 12; step++) {
    const t = (start + end) / 2;
    point = view.locate(a.coords.map((value, i) => value + (b.coords[i] - value) * t));
    if (point.visible === a.point.visible) start = t;
    else end = t;
  }
  const scale = view.radius / Math.hypot(point.x - view.x, point.y - view.y);
  return { x: view.x + (point.x - view.x) * scale, y: view.y + (point.y - view.y) * scale };
}

function closeAroundGlobe(start, end, view) {
  const angle = point => Math.atan2(point.y - view.y, point.x - view.x);
  const delta = (angle(start) - angle(end) + 3 * Math.PI) % (2 * Math.PI) - Math.PI;
  const sweep = delta >= 0 ? 1 : 0;
  const radius = round(view.radius);
  return `A${radius} ${radius} 0 0 ${sweep} ${round(start.x)} ${round(start.y)}Z`;
}

function ringPaths(ring, view) {
  const points = ring.slice(0, -1).map(coords => ({ coords, point: view.locate(coords) }));
  const firstHidden = points.findIndex(({ point }) => !point.visible);
  if (firstHidden === -1) {
    const closed = pathThrough(points.map(({ point }) => point)) + 'Z';
    return { outline: closed, fill: closed };
  }
  let outline = '';
  let fill = '';
  let visibleRun = [];
  let previous = points[firstHidden];
  for (let step = 1; step <= points.length; step++) {
    const next = points[(firstHidden + step) % points.length];
    if (next.point.visible) {
      if (!previous.point.visible) visibleRun.push(horizonIntersection(previous, next, view));
      visibleRun.push(next.point);
    } else if (previous.point.visible) {
      const end = horizonIntersection(previous, next, view);
      visibleRun.push(end);
      const path = pathThrough(visibleRun);
      outline += path;
      fill += path + closeAroundGlobe(visibleRun[0], end, view);
      visibleRun = [];
    }
    previous = next;
  }
  return { outline, fill };
}

function onScreen(point, view) {
  return point.visible && point.x >= 0 && point.x <= view.width && point.y >= 0 && point.y <= view.height;
}

function limit(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function textWidth(node) {
  // The SVG font rules do not change with zoom. Measure once and keep room for
  // the text stroke and differences between the fallback and loaded typeface.
  return Math.ceil(node.getComputedTextLength?.() || node.textContent.length * 8) + 8;
}

function labelAt(x, y, width, anchor = 'middle') {
  const offset = { start: 0, middle: width / 2, end: width }[anchor];
  return { x, y, anchor, left: x - offset, right: x - offset + width, top: y - LABEL_ASCENT, bottom: y + LABEL_DESCENT };
}

function centeredLabel(point, width, view, offset = 0) {
  const inset = SCREEN_MARGIN + width / 2;
  if (view.width < inset * 2 || view.height < SCREEN_MARGIN * 2 + LABEL_ASCENT + LABEL_DESCENT) return null;
  const x = limit(point.x, inset, view.width - inset);
  const y = limit(point.y + offset, SCREEN_MARGIN + LABEL_ASCENT, view.height - SCREEN_MARGIN - LABEL_DESCENT);
  return labelAt(x, y, width);
}

function labelFits(label, view, occupied) {
  return label && label.left >= SCREEN_MARGIN && label.right <= view.width - SCREEN_MARGIN
    && label.top >= SCREEN_MARGIN && label.bottom <= view.height - SCREEN_MARGIN
    && !occupied.some(other => label.left < other.right && label.right > other.left
      && label.top < other.bottom && label.bottom > other.top);
}

function labelBesideMarker(point, width, view, occupied) {
  const y = limit(point.y + 3, SCREEN_MARGIN + LABEL_ASCENT, view.height - SCREEN_MARGIN - LABEL_DESCENT);
  const right = labelAt(point.x + 8, y, width, 'start');
  if (labelFits(right, view, occupied)) return right;
  const left = labelAt(point.x - 8, y, width, 'end');
  if (labelFits(left, view, occupied)) return left;
  const inset = SCREEN_MARGIN + width / 2;
  const x = limit(point.x, inset, view.width - inset);
  const above = labelAt(x, point.y - 9, width);
  if (labelFits(above, view, occupied)) return above;
  return labelAt(x, point.y + LABEL_ASCENT + 7, width);
}

function showLabel(node, label, origin = { x: 0, y: 0 }) {
  node.setAttribute('visibility', label ? 'visible' : 'hidden');
  if (!label) return;
  node.style.setProperty('text-anchor', label.anchor);
  node.setAttribute('x', round(label.x - origin.x));
  node.setAttribute('y', round(label.y - origin.y));
}

export function addHistoricalLayer(map) {
  const holder = element('g', 'historical-layer');
  holder.setAttribute('aria-hidden', 'true');
  const territories = element('g', 'political-territories');
  const territoryNames = element('g', 'political-names');
  const seats = element('g', 'administrative-seats');
  const neighbors = element('g', 'neighboring-places');
  const genericNames = new Map(Array.from(map.querySelectorAll('.map-label.land'), node => [node.textContent, node]));

  const shapes = politicalRegions.map(region => {
    const outline = element('path', 'polity-outline');
    const fill = element('path', 'polity-fill');
    outline.style.setProperty('--polity-color', region.color);
    fill.style.setProperty('--polity-color', region.color);
    territories.append(fill, outline);
    const label = element('text', 'polity-name', region.name);
    territoryNames.append(label);
    return { outline, fill, label, coords: region.coords, rings: region.rings.map(sampleRing) };
  });

  const anchors = administrations.map(administration => {
    const { kind, coords } = administration;
    const isNeighbor = kind === 'local' || kind === 'context';
    const group = element('g', `historical-point ${kind}`);
    const hasMarker = kind === 'seat' || kind === 'local';
    if (kind === 'seat') {
      const marker = element('rect', 'administration-point');
      marker.setAttribute('x', '-2.5');
      marker.setAttribute('y', '-2.5');
      marker.setAttribute('width', '5');
      marker.setAttribute('height', '5');
      marker.setAttribute('transform', 'rotate(45)');
      group.append(marker);
    }
    if (kind === 'local') {
      const marker = element('circle', 'neighbor-point');
      marker.setAttribute('r', '2.6');
      group.append(marker);
    }
    const name = element('text', 'administration-name', administration.name);
    group.append(name);
    (isNeighbor ? neighbors : seats).append(group);
    return { coords, group, isNeighbor, hasMarker, label: name, duplicate: genericNames.get(administration.name) };
  });

  holder.append(territories, territoryNames, seats, neighbors);
  map.append(holder);
  for (const feature of [...shapes, ...anchors]) feature.width = textWidth(feature.label);

  return function drawHistoricalLayer(view, layers, routePoint) {
    if (!view.locate) view = { ...view, locate: createProjector(view) };
    const bordersVisible = layers.borders;
    const namesVisible = bordersVisible && view.scale > .58;
    const seatsVisible = layers.administration && view.scale > .33;
    const neighborsVisible = layers.neighbors && view.scale > .33;
    territories.style.display = bordersVisible ? '' : 'none';
    territoryNames.style.display = namesVisible ? '' : 'none';
    seats.style.display = seatsVisible ? '' : 'none';
    neighbors.style.display = neighborsVisible ? '' : 'none';
    const occupied = routePoint && onScreen(routePoint, view) ? [{
      left: routePoint.x - 45, right: routePoint.x + 45, top: routePoint.y - 28, bottom: routePoint.y + 16,
    }] : [];

    if (bordersVisible) {
      for (const shape of shapes) {
        const paths = shape.rings.map(ring => ringPaths(ring, view));
        shape.fill.setAttribute('d', paths.map(path => path.fill).join(''));
        shape.fill.setAttribute('opacity', view.scale < .35 ? '.17' : '.11');
        shape.outline.setAttribute('d', paths.map(path => path.outline).join(''));
        if (namesVisible) {
          const point = view.locate(shape.coords);
          const candidate = onScreen(point, view) && centeredLabel(point, shape.width, view);
          const label = labelFits(candidate, view, occupied) ? candidate : null;
          showLabel(shape.label, label);
          if (label) occupied.push(label);
        }
      }
    }

    for (const { group, label, coords, width, isNeighbor, hasMarker, duplicate } of anchors) {
      let placement = null;
      if (isNeighbor ? neighborsVisible : seatsVisible) {
        const point = view.locate(coords);
        const shown = onScreen(point, view);
        group.setAttribute('display', shown ? 'inline' : 'none');
        if (shown) {
          group.setAttribute('transform', `translate(${round(point.x)} ${round(point.y)})`);
          const candidate = hasMarker
            ? labelBesideMarker(point, width, view, occupied) : centeredLabel(point, width, view, 3);
          if (labelFits(candidate, view, occupied)) {
            placement = candidate;
            occupied.push(placement);
          }
          showLabel(label, placement, point);
        }
      }
      // A visible administrative label takes the place of its general map name.
      if (duplicate) duplicate.style.display = placement ? 'none' : '';
    }
  };
}
