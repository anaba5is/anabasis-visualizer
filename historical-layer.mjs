import { politicalRegions, administrations } from './historical-data.mjs';
import { createProjector } from './globe.mjs';
import { labelBox, labelFits } from './label-geometry.mjs';

const NS = 'http://www.w3.org/2000/svg';
const SCREEN_MARGIN = 8;
const LABEL_ASCENT = 15;
const LABEL_DESCENT = 5;
const LABEL_OFFSETS = [0, -22, 22, -42, 42];

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
  let left = Infinity;
  let right = -Infinity;
  for (const { point } of points) {
    if (!point.visible) continue;
    left = Math.min(left, point.x);
    right = Math.max(right, point.x);
  }
  const firstHidden = points.findIndex(({ point }) => !point.visible);
  if (firstHidden === -1) {
    const closed = pathThrough(points.map(({ point }) => point)) + 'Z';
    return { outline: closed, fill: closed, left, right };
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
  return { outline, fill, left, right };
}

function onScreen(point, view) {
  return point.visible && point.x >= 0 && point.x <= view.width && point.y >= 0 && point.y <= view.height;
}

function limit(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function textWidth(node) {
  // Keep room for the halo when arranging labels beside one another.
  return Math.ceil(node.getComputedTextLength?.() || node.textContent.length * 7.5) + 8;
}

function labelAt(x, y, width, anchor) {
  return labelBox(x, y, { width, above: LABEL_ASCENT, below: LABEL_DESCENT }, anchor);
}

function labelBounds(view) {
  return {
    left: Math.max(SCREEN_MARGIN, view.labelBounds?.left ?? 0),
    right: Math.min(view.width - SCREEN_MARGIN, view.labelBounds?.right ?? view.width),
    top: Math.max(SCREEN_MARGIN, view.labelBounds?.top ?? 0),
    bottom: Math.min(view.height - SCREEN_MARGIN, view.labelBounds?.bottom ?? view.height),
  };
}

function centeredLabel(point, width, bounds, offset = 0, maxShift = 52) {
  if (bounds.right - bounds.left < width || bounds.bottom - bounds.top < LABEL_ASCENT + LABEL_DESCENT) return null;
  const x = limit(point.x, bounds.left + width / 2, bounds.right - width / 2);
  const y = limit(point.y + offset, bounds.top + LABEL_ASCENT, bounds.bottom - LABEL_DESCENT);
  if (Math.abs(x - point.x) > maxShift || Math.abs(y - point.y - offset) > maxShift) return null;
  return labelAt(x, y, width);
}

function labelBesideMarker(point, width, bounds, occupied) {
  const y = limit(point.y + 3, bounds.top + LABEL_ASCENT, bounds.bottom - LABEL_DESCENT);
  if (Math.abs(point.y + 3 - y) > 18) return null;
  const right = labelAt(point.x + 8, y, width, 'start');
  if (labelFits(right, bounds, occupied)) return right;
  const left = labelAt(point.x - 8, y, width, 'end');
  if (labelFits(left, bounds, occupied)) return left;
  const above = centeredLabel(point, width, bounds, -9, 24);
  if (labelFits(above, bounds, occupied)) return above;
  return centeredLabel(point, width, bounds, LABEL_ASCENT + 7, 24);
}

function showLabel(node, label, origin = { x: 0, y: 0 }) {
  node.setAttribute('visibility', label ? 'visible' : 'hidden');
  if (!label) return;
  node.style.setProperty('text-anchor', label.anchor);
  node.setAttribute('x', round(label.x - origin.x));
  node.setAttribute('y', round(label.y - origin.y));
}

function getCoverage(coords, rings) {
  const locate = createProjector({ lon: coords[0], lat: coords[1], x: 0, y: 0, radius: 1 });
  let minimumDepth = 1;
  for (const ring of rings) {
    for (const point of ring) minimumDepth = Math.min(minimumDepth, locate(point).depth);
  }
  const angularRadius = Math.acos(limit(minimumDepth, -1, 1));
  return {
    horizon: angularRadius < Math.PI / 2 ? -Math.sin(angularRadius) : -1,
    chord: Math.sqrt(2 - 2 * minimumDepth),
  };
}

function possiblyVisible(shape, view) {
  const center = view.locate(shape.coords);
  if (center.depth < shape.coverage.horizon) return false;
  const reach = view.radius * shape.coverage.chord;
  return center.x + reach >= 0 && center.x - reach <= view.width
    && center.y + reach >= 0 && center.y - reach <= view.height;
}

export function addHistoricalLayer(map) {
  const holder = element('g', 'historical-layer');
  holder.setAttribute('aria-hidden', 'true');
  const territories = element('g', 'political-territories');
  const territoryNames = element('g', 'political-names');
  const seats = element('g', 'administrative-seats');
  const neighbors = element('g', 'neighboring-places');
  const worldSites = element('g', 'world-map-sites');
  const genericNames = new Map(Array.from(map.querySelectorAll('.map-label.land'), node => [node.textContent, node]));

  function makeShape(region) {
    const shape = element('g', 'polity-shape');
    shape.dataset.polity = region.id;
    const definition = element('defs');
    const boundary = element('path', 'polity-boundary-geometry');
    boundary.id = `${map.id || 'history'}-boundary-${region.id}`;
    boundary.setAttribute('vector-effect', 'non-scaling-stroke');
    definition.append(boundary);
    const casing = element('use', 'polity-casing');
    casing.setAttribute('href', `#${boundary.id}`);
    const outline = element('use', 'polity-outline');
    outline.setAttribute('href', `#${boundary.id}`);
    const fill = element('path', 'polity-fill');
    shape.style.setProperty('--polity-color', region.color);
    shape.style.setProperty('--polity-fill', region.fillColor ?? region.color);
    shape.style.setProperty('--polity-fill-opacity', region.fillOpacity ?? .32);
    shape.style.setProperty('--polity-world-opacity', region.worldFillOpacity ?? .38);
    shape.append(definition, fill, casing, outline);
    territories.append(shape);

    const label = element('text', 'polity-name', region.shortLabel ?? region.name);
    label.dataset.polity = region.id;
    label.style.setProperty('--polity-fill', region.fillColor ?? region.color);
    territoryNames.append(label);
    const rings = region.rings.map(sampleRing);
    return {
      id: region.id, boundary, fill, label, coords: region.coords, rings,
      coverage: getCoverage(region.coords, rings),
      major: region.overview ?? region.id === 'achaemenid-empire',
    };
  }

  function makeAnchor(administration) {
    const { id, kind, coords } = administration;
    const isWorldSite = ['polity', 'site', 'community'].includes(kind);
    const isNeighbor = kind === 'local' || kind === 'context';
    const group = element('g', `historical-point ${kind}`);
    const hasMarker = isWorldSite || kind === 'seat' || kind === 'local';
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
    if (isWorldSite) {
      const marker = element(kind === 'polity' ? 'circle' : 'path', 'world-site-point');
      if (kind === 'polity') marker.setAttribute('r', '3.4');
      else marker.setAttribute('d', 'M0 -4L4 0L0 4L-4 0Z');
      group.append(marker);
    }
    const name = element('text', 'administration-name', administration.name);
    group.append(name);
    const parent = isWorldSite ? worldSites : isNeighbor ? neighbors : seats;
    parent.append(group);
    return {
      id, coords, group, isNeighbor, isWorldSite, hasMarker, label: name,
      overview: administration.overview ?? kind === 'polity',
      duplicate: isWorldSite ? undefined : genericNames.get(administration.name),
    };
  }

  const shapes = politicalRegions.map(makeShape);
  const anchors = administrations.map(makeAnchor);
  holder.append(territories, seats, neighbors, worldSites, territoryNames);
  map.append(holder);
  let measuredWidth;
  let lastProjection;

  function refreshMetrics() {
    for (const feature of [...shapes, ...anchors]) feature.width = textWidth(feature.label);
    measuredWidth = map.clientWidth;
  }

  function drawHistoricalLayer(view, layers, routePoint) {
    if (!view.locate) view = { ...view, locate: createProjector(view) };
    const bordersVisible = layers.borders;
    const namesVisible = bordersVisible && layers.places !== false;
    const seatsVisible = layers.administration && view.scale > .33;
    const neighborsVisible = layers.neighbors && view.scale > .33;
    const worldSitesVisible = layers.worldSites !== false;
    territories.style.display = bordersVisible ? '' : 'none';
    territoryNames.style.display = namesVisible ? '' : 'none';
    seats.style.display = seatsVisible ? '' : 'none';
    neighbors.style.display = neighborsVisible ? '' : 'none';
    worldSites.style.display = worldSitesVisible ? '' : 'none';
    holder.classList.toggle('is-overview', view.scale < .35);
    if (view.width !== measuredWidth) refreshMetrics();

    const bounds = labelBounds(view);
    const occupied = routePoint && onScreen(routePoint, view) ? [{
      left: routePoint.x - 48, right: routePoint.x + 48, top: routePoint.y - 28, bottom: routePoint.y + 24,
    }, ...(routePoint.labelBox ? [routePoint.labelBox] : [])] : [];

    if (bordersVisible) {
      const projection = [view.lon, view.lat, view.radius, view.x, view.y].join(',');
      for (const shape of shapes) {
        if (lastProjection !== projection) {
          shape.paths = possiblyVisible(shape, view) ? shape.rings.map(ring => ringPaths(ring, view)) : [];
          shape.fill.setAttribute('d', shape.paths.map(path => path.fill).join(''));
          shape.boundary.setAttribute('d', shape.paths.map(path => path.outline).join(''));
        }
        if (namesVisible) {
          const point = view.locate(shape.coords);
          const focused = shape.id === view.focusId;
          const footprint = shape.paths.some(({ left, right }) =>
            Math.min(right, bounds.right) - Math.max(left, bounds.left) > shape.width * .55,
          );
          const labelAllowed = point.visible && point.depth > .16
            && (focused || ((shape.major || view.scale > .43) && footprint));
          let label = null;
          if (labelAllowed) {
            for (const offset of LABEL_OFFSETS) {
              const candidate = centeredLabel(point, shape.width, bounds, offset, shape.major ? 72 : 36);
              if (labelFits(candidate, bounds, occupied)) {
                label = candidate;
                break;
              }
            }
          }
          showLabel(shape.label, label);
          if (label) occupied.push(label);
        }
      }
      lastProjection = projection;
    }

    for (const { id, group, label, coords, width, isNeighbor, isWorldSite, hasMarker, overview, duplicate } of anchors) {
      let placement = null;
      const layerVisible = isWorldSite ? worldSitesVisible : isNeighbor ? neighborsVisible : seatsVisible;
      if (layerVisible) {
        const point = view.locate(coords);
        const shown = onScreen(point, view) && (layers.places !== false || hasMarker);
        group.setAttribute('display', shown ? 'inline' : 'none');
        if (shown) {
          group.setAttribute('transform', `translate(${round(point.x)} ${round(point.y)})`);
          const labelVisible = layers.places !== false && (!isWorldSite || overview || view.scale > .34 || id === view.focusId);
          if (labelVisible) {
            const candidate = hasMarker
              ? labelBesideMarker(point, width, bounds, occupied) : centeredLabel(point, width, bounds, 3, 24);
            if (labelFits(candidate, bounds, occupied)) {
              placement = candidate;
              occupied.push(placement);
            }
          }
          showLabel(label, placement, point);
        }
      }
      // A visible administrative label takes the place of its general map name.
      if (duplicate) duplicate.style.display = placement ? 'none' : '';
    }
    return occupied;
  }

  refreshMetrics();
  drawHistoricalLayer.refreshMetrics = refreshMetrics;
  drawHistoricalLayer.addWorld = (regions, sites) => {
    shapes.push(...regions.map(makeShape));
    anchors.push(...sites.map(makeAnchor));
    lastProjection = undefined;
    refreshMetrics();
  };
  return drawHistoricalLayer;
}
