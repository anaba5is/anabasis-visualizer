import { politicalRegions, administrations } from './historical-data.mjs';
import { project } from './globe.mjs?v=2';

const NS = 'http://www.w3.org/2000/svg';

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
    point = project(a.coords.map((value, i) => value + (b.coords[i] - value) * t), view);
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
  const points = ring.slice(0, -1).map(coords => ({ coords, point: project(coords, view) }));
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

function placeText(node, coords, view, offset = [0, 0]) {
  const point = project(coords, view);
  const visible = point.visible && point.x > 12 && point.x < view.width - 12
    && point.y > 12 && point.y < view.height - 12;
  node.setAttribute('visibility', visible ? 'visible' : 'hidden');
  if (visible) {
    node.setAttribute('x', round(point.x + offset[0]));
    node.setAttribute('y', round(point.y + offset[1]));
  }
  return visible ? point : null;
}

export function addHistoricalLayer(map) {
  const holder = element('g', 'historical-layer');
  holder.setAttribute('aria-hidden', 'true');
  const territories = element('g', 'political-territories');
  const territoryNames = element('g', 'political-names');
  const seats = element('g', 'administrative-seats');
  const neighbors = element('g', 'neighboring-places');

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
    name.setAttribute('x', kind === 'seat' || kind === 'local' ? '8' : '0');
    name.setAttribute('y', '3');
    group.append(name);
    (isNeighbor ? neighbors : seats).append(group);
    return { coords, group, isNeighbor };
  });

  holder.append(territories, territoryNames, seats, neighbors);
  map.append(holder);

  return function drawHistoricalLayer(view, layers, routePoint) {
    const bordersVisible = layers.borders;
    const namesVisible = bordersVisible && view.scale > .58;
    const seatsVisible = layers.administration && view.scale > .33;
    const neighborsVisible = layers.neighbors && view.scale > .33;
    territories.style.display = bordersVisible ? '' : 'none';
    territoryNames.style.display = namesVisible ? '' : 'none';
    seats.style.display = seatsVisible ? '' : 'none';
    neighbors.style.display = neighborsVisible ? '' : 'none';

    if (bordersVisible) {
      for (const shape of shapes) {
        const paths = shape.rings.map(ring => ringPaths(ring, view));
        shape.fill.setAttribute('d', paths.map(path => path.fill).join(''));
        shape.fill.setAttribute('opacity', view.scale < .35 ? '.17' : '.11');
        shape.outline.setAttribute('d', paths.map(path => path.outline).join(''));
        if (namesVisible) placeText(shape.label, shape.coords, view);
      }
    }

    if (seatsVisible || neighborsVisible) {
      const prior = routePoint?.visible ? [routePoint] : [];
      for (const { group, coords, isNeighbor } of anchors) {
        if (isNeighbor ? !neighborsVisible : !seatsVisible) continue;
        const point = project(coords, view);
        const space = !prior.some(p => Math.abs(p.x - point.x) < 56 && Math.abs(p.y - point.y) < 16);
        const shown = point.visible && point.x > 12 && point.x < view.width - 65
          && point.y > 12 && point.y < view.height - 12;
        group.setAttribute('visibility', shown ? 'visible' : 'hidden');
        if (!shown) continue;
        group.setAttribute('transform', `translate(${round(point.x)} ${round(point.y)})`);
        group.lastElementChild.setAttribute('visibility', space ? 'visible' : 'hidden');
        if (space) prior.push(point);
      }
    }
  };
}
