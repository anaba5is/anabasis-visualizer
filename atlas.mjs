import { stops } from './story.mjs';
import { captions } from './captions.mjs';
import { scenes } from './scenes.mjs';
import { mapLabels, rivers, routeWaypoints, uncertainLegs } from './map-data.mjs';
import { createGlobe, project } from './globe.mjs?v=2';
import { makeTimeline } from './timeline.mjs?v=2';
import { createPlayback } from './playback.mjs';
import { addHistoricalLayer } from './historical-layer.mjs';
import { historicalSources } from './historical-data.mjs';

const phases = [
  { name: 'March inland', color: '#f1b66f', timelineColor: '#a4662a' },
  { name: 'Retreat', color: '#f69c89', timelineColor: '#a95141' },
  { name: 'Black Sea', color: '#92e4d6', timelineColor: '#2a796d' },
  { name: 'Aftermath', color: '#e6c6f2', timelineColor: '#755383' },
];
const phaseByName = new Map(phases.map(phase => [phase.name, phase]));
const indexById = new Map(stops.map((stop, index) => [stop.id, index]));
const labelLayouts = {
  sardis: { anchor: 'end', dx: -13, dy: 13, featured: true },
  tarsus: { dy: 22 },
  cunaxa: { dy: 22, featured: true },
  'great-zab': { dy: 20 },
  mespila: { dy: -15 },
  'carduchian-mountains': { dy: -14 },
  'mount-theches': { anchor: 'end', dx: -12, dy: 19 },
  trapezus: { anchor: 'start', dx: 14, dy: 3, featured: true },
  cotyora: { dy: -18 },
  calpe: { dy: -15 },
  byzantium: { dx: -8, dy: -19, featured: true },
  pergamum: { anchor: 'end', dx: -13, dy: -5 },
};
const find = selector => document.querySelector(selector);
const map = find('#expedition-map');
const mapFrame = find('.map-frame');
const storyContent = find('#story-content');
const announcement = find('#announcement');
const previousButton = find('#previous-stop');
const nextButton = find('#next-stop');
const playButton = find('#play-route');
const zoomIn = find('#zoom-in');
const zoomOut = find('#zoom-out');
const reset = find('#zoom-reset');
const viewRoute = find('#view-route');
const viewGlobe = find('#view-globe');
const sources = find('#sources');
const sceneToggle = find('#scene-toggle');
const storyPanel = find('#story-panel');
const timelinePanel = find('.timeline-panel');
const phaseControls = find('#phase-controls');
const mapKey = find('.map-key');
const navSources = find('.site-nav a');
const closeSources = find('#close-sources');
const fullscreen = find('#fullscreen-toggle');
const imageViewer = find('#image-viewer');
const speedControl = find('#playback-speed');
const followControl = find('#follow-camera');
const layers = { route: true, terrain: true, borders: true, administration: false, neighbors: false, places: true, grid: true };
const scaleBar = find('#map-scale');
const queuedScenes = new Set();
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const routeCenter = { lon: 35.5, lat: 37.8 };
const globeCenter = { lon: 26, lat: 29 };
const camera = { ...globeCenter, scale: .19 };
const markerNodes = [];
const labelNodes = [];
const routeNodes = [];
const gridNodes = [];
const riverNodes = [];
const mapLabelNodes = [];
const pointers = new Map();
const phaseButtons = [];
let selectedIndex = 0;
let mode = 'globe';
let awaitingIntro = true;
let animation;
let drawFrame;
let surface;
let gesture;
let suppressClickUntil = 0;
let drawHistoricalLayer;
let routeLayer;
let markerLayer;
let namesLayer;
let trail;
let tracer;
let viewAtLastDraw;
let beatProgress = 0;

function svg(tag, attrs = {}, content = '') {
  const node = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [name, value] of Object.entries(attrs)) node.setAttribute(name, value);
  node.textContent = content;
  return node;
}

function html(tag, className = '', content = '') {
  const node = document.createElement(tag);
  if (className) node.className = className;
  node.textContent = content;
  return node;
}

function link(text, href, className = '') {
  const anchor = html('a', className, text);
  anchor.href = href;
  return anchor;
}

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const wrapLon = lon => ((lon + 540) % 360) - 180;

function along(points) {
  const result = [points[0]];
  for (let i = 1; i < points.length; i++) {
    const [lon, lat] = points[i - 1];
    const [nextLon, nextLat] = points[i];
    const count = Math.max(1, Math.ceil(Math.hypot(nextLon - lon, nextLat - lat)));
    for (let j = 1; j <= count; j++) {
      result.push([lon + (nextLon - lon) * j / count, lat + (nextLat - lat) * j / count]);
    }
  }
  return result;
}

function linePath(line, view) {
  let path = '';
  let penDown = false;
  for (const coordinates of line) {
    const point = project(coordinates, view);
    if (point.visible) path += `${penDown ? 'L' : 'M'}${point.x.toFixed(1)} ${point.y.toFixed(1)}`;
    penDown = point.visible;
  }
  return path;
}

function setupBase() {
  const base = svg('g', { 'aria-hidden': 'true' });
  const addGrid = (points, regional = false) => {
    const node = svg('path', { class: 'map-grid' });
    gridNodes.push({ node, points, regional });
    base.append(node);
  };
  for (let lon = -180; lon < 180; lon += 15) {
    addGrid(Array.from({ length: 91 }, (_, step) => [lon, -90 + step * 2]));
  }
  for (let lat = -75; lat <= 75; lat += 15) {
    addGrid(Array.from({ length: 181 }, (_, step) => [-180 + step * 2, lat]));
  }
  for (let lon = 20; lon <= 55; lon += 5) {
    addGrid(Array.from({ length: 25 }, (_, step) => [lon, 24 + step]), true);
  }
  for (let lat = 25; lat <= 50; lat += 5) {
    addGrid(Array.from({ length: 39 }, (_, step) => [18 + step, lat]), true);
  }
  for (const river of rivers) {
    const node = svg('path', { class: 'map-river' });
    riverNodes.push({ node, lines: river.lines });
    base.append(node);
  }
  const labels = [
    ...mapLabels.map(label => label.name === 'Black Sea' ? { ...label, coords: [36.8, 42.7] } : label),
    { name: 'Euphrates', kind: 'river', coords: [40.9, 33.5] },
    { name: 'Tigris', kind: 'river', coords: [45.2, 34] },
  ];
  for (const { name, kind, coords } of labels) {
    const extraClass = name === 'Aegean Sea' ? ' aegean' : '';
    const node = svg('text', { class: `map-label ${kind}${extraClass}` }, name);
    mapLabelNodes.push({ node, coords });
    base.append(node);
  }
  map.append(base);
}

function distances(points) {
  const offsets = [0];
  for (let i = 1; i < points.length; i++) {
    const [lon, lat] = points[i - 1];
    const [nextLon, nextLat] = points[i];
    const meridian = Math.cos((lat + nextLat) * Math.PI / 360);
    offsets.push(offsets[i - 1] + Math.hypot((nextLon - lon) * meridian, nextLat - lat));
  }
  return offsets;
}

function setupRoute() {
  const legs = svg('g', { 'aria-hidden': 'true' });
  for (let i = 1; i < stops.length; i++) {
    const stop = stops[i];
    const points = along([stops[i - 1].coords, ...(routeWaypoints[stop.id] ?? []), stop.coords]);
    const dash = uncertainLegs.has(stop.id) ? ' uncertain' : '';
    const shadow = svg('path', { class: `route-shadow${dash}` });
    const line = svg('path', { class: `route-path${dash}` });
    line.style.setProperty('--phase', phaseByName.get(stop.phase).color);
    legs.append(shadow, line);
    routeNodes[i] = { shadow, line, points, offsets: distances(points) };
  }
  trail = svg('path', { class: 'route-progress', visibility: 'hidden' });
  tracer = svg('circle', { class: 'route-tracer', r: 3.1, visibility: 'hidden' });
  legs.append(trail, tracer);
  routeLayer = legs;
  map.append(legs);
}

function drawTrail(view = viewAtLastDraw) {
  const leg = routeNodes[selectedIndex];
  if (!view || !layers.route || !leg || beatProgress <= 0) {
    trail.setAttribute('visibility', 'hidden');
    tracer.setAttribute('visibility', 'hidden');
    return;
  }
  const target = beatProgress * leg.offsets.at(-1);
  let end = leg.offsets.findIndex(offset => offset >= target);
  if (end < 1) end = leg.points.length - 1;
  const start = end - 1;
  const stepLength = leg.offsets[end] - leg.offsets[start];
  const local = stepLength ? (target - leg.offsets[start]) / stepLength : 0;
  const head = leg.points[start].map((value, index) => value + (leg.points[end][index] - value) * local);
  const position = project(head, view);
  trail.classList.toggle('uncertain', uncertainLegs.has(stops[selectedIndex].id));
  trail.setAttribute('d', linePath([...leg.points.slice(0, end), head], view));
  trail.setAttribute('visibility', 'visible');
  tracer.setAttribute('visibility', position.visible ? 'visible' : 'hidden');
  tracer.setAttribute('cx', position.x);
  tracer.setAttribute('cy', position.y);
}

function setupMarkers() {
  const markers = svg('g', { 'aria-label': 'Stops in order of travel' });
  const labels = svg('g', { 'aria-hidden': 'true' });
  stops.forEach((stop, i) => {
    const approximate = stop.certainty !== 'Identified';
    const marker = svg('g', {
      class: approximate ? 'map-marker estimate' : 'map-marker',
      role: 'button',
      tabindex: 0,
      'aria-label': `Stop ${i + 1}, ${stop.name}, ${stop.certainty.toLowerCase()} location`,
      'aria-pressed': 'false',
    });
    marker.style.setProperty('--phase', phaseByName.get(stop.phase).color);
    marker.append(
      svg('title', {}, stop.name),
      svg('circle', { class: 'tap-zone', r: 13 }),
      svg('circle', { class: 'current-ring', r: 11 }),
      svg('circle', { class: 'point', r: 4.5 }),
    );
    marker.addEventListener('click', event => {
      if (performance.now() < suppressClickUntil && event.detail) return;
      if (event.detail) {
        const box = map.getBoundingClientRect();
        const view = getView();
        const x = event.clientX - box.left;
        const y = event.clientY - box.top;
        const nearest = stops.reduce((candidate, place, index) => {
          const point = project(place.coords, view);
          const distance = markerNodes[index].getAttribute('visibility') === 'visible'
            ? Math.hypot(point.x - x, point.y - y) : Infinity;
          return distance < candidate.distance ? { index, distance } : candidate;
        }, { index: i, distance: Infinity });
        chooseStop(nearest.index);
      } else {
        chooseStop(i);
      }
    });
    marker.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        chooseStop(i);
      }
    });
    const preview = () => labelNodes[i].classList.add('preview');
    const unpreview = () => labelNodes[i].classList.remove('preview');
    marker.addEventListener('pointerenter', preview);
    marker.addEventListener('pointerleave', unpreview);
    marker.addEventListener('focus', preview);
    marker.addEventListener('blur', unpreview);
    const { anchor = 'middle', featured = false } = labelLayouts[stop.id] ?? {};
    const label = svg('text', { class: featured ? 'map-stop-label featured' : 'map-stop-label', 'text-anchor': anchor }, stop.name);
    markers.append(marker);
    labels.append(label);
    markerNodes.push(marker);
    labelNodes.push(label);
  });
  markerLayer = markers;
  namesLayer = labels;
  map.append(markers, labels);
}

function setupPhases() {
  phases.forEach(phase => {
    const button = html('button', 'phase-button', phase.name);
    button.type = 'button';
    button.setAttribute('aria-pressed', 'false');
    button.style.setProperty('--phase', phase.color);
    const swatch = html('span', 'phase-swatch');
    swatch.setAttribute('aria-hidden', 'true');
    button.prepend(swatch);
    button.addEventListener('click', () => chooseStop(stops.findIndex(stop => stop.phase === phase.name)));
    phaseButtons.push(button);
    phaseControls.append(button);
  });
}

function renderScene(stop) {
  const scene = scenes[stop.id];
  const figure = html('figure', 'scene');
  const image = html('img', scene.contain ? 'contain' : '');
  image.src = `./assets/${scene.file}`;
  image.alt = scene.alt;
  image.decoding = 'async';
  const caption = html('figcaption', '', scene.caption);
  const enlarge = html('button', 'scene-enlarge');
  enlarge.type = 'button';
  enlarge.setAttribute('aria-label', `View image for ${stop.name}`);
  enlarge.append(image);
  enlarge.addEventListener('click', () => {
    imageViewer.querySelector('h2').textContent = stop.name;
    const fullImage = imageViewer.querySelector('img');
    fullImage.src = image.src;
    fullImage.alt = scene.alt;
    imageViewer.querySelector('figcaption').textContent = scene.caption;
    setPlaying(false);
    imageViewer.showModal();
  });
  figure.append(enlarge, caption);
  return figure;
}

function renderStory(stop, i) {
  const scene = scenes[stop.id];
  const romanBook = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'][Number(stop.book[0]) - 1];
  const place = html('h2', 'stop-name', stop.name);
  place.id = 'stop-title';
  const details = html('details', 'stop-notes');
  const source = html('p', 'text-citation', `Xenophon, Anabasis ${stop.book}`);
  const chapters = new Set([...stop.book.matchAll(/\b([1-7])\.(\d+)\.\d+/g)]
    .map(([, book, chapter]) => `${book}.${chapter}`));
  details.addEventListener('toggle', () => {
    if (details.open) setPlaying(false);
  });
  const passages = html('div', 'passage-links');
  for (const reference of chapters) {
    const [book, chapter] = reference.split('.');
    const url = stop.source.replace(/Book_\d+\/Chapter_\d+$/, `Book_${book}/Chapter_${chapter}`);
    passages.append(link(`Read ${reference}`, url));
  }
  const imageCredit = html('p', 'image-credit', 'Image ');
  imageCredit.append(link(scene.credit, scene.source));
  if (scene.licenseUrl) {
    imageCredit.append(' · ', link(scene.licenseName, scene.licenseUrl));
  }
  details.append(
    html('summary', '', 'Passage & image credit'),
    html('p', '', stop.detail),
    html('p', '', `Location ${stop.certainty.toLowerCase()}`),
    source,
    passages,
    imageCredit,
  );
  const copy = html('div', 'story-copy');
  copy.append(
    html('p', 'stop-region', `${stop.region} · Book ${romanBook}`),
    place,
    html('p', 'stop-title', stop.title),
    html('p', 'stop-summary', captions[stop.id]),
    details,
  );
  storyContent.replaceChildren(renderScene(stop), copy);
  find('#timeline-book').textContent = `Book ${romanBook}`;
  find('#stop-counter').textContent = `${String(i + 1).padStart(2, '0')} / ${stops.length}`;
  previousButton.disabled = i === 0;
  nextButton.disabled = i === stops.length - 1;
}

function preloadScene(i) {
  const scene = scenes[stops[i]?.id];
  if (!scene || queuedScenes.has(scene.file)) return;
  queuedScenes.add(scene.file);
  const image = new Image();
  image.fetchPriority = 'low';
  image.src = `./assets/${scene.file}`;
}

function bookmark(i) {
  history.replaceState(null, '', `#stop=${stops[i].id}`);
}

function chooseStop(i) {
  if (!stops[i]) return;
  if (awaitingIntro) setMode('route');
  setPlaying(false);
  selectStop(i);
  playback.reset(beatDuration(i));
  syncPlayButton(false);
}

function selectStop(i, { updateHash = true, announce = true, move = true } = {}) {
  const stop = stops[i];
  if (!stop) return;
  selectedIndex = i;
  renderStory(stop, i);
  preloadScene(i + 1);
  markerNodes.forEach((marker, index) => {
    const here = i === index;
    marker.classList.toggle('selected', here);
    marker.setAttribute('aria-pressed', String(here));
    labelNodes[index].classList.toggle('selected', here);
    routeNodes[index]?.line.classList.toggle('current', here);
    routeNodes[index]?.line.classList.toggle('traversed', index <= i);
  });
  phaseButtons.forEach((button, index) => {
    button.setAttribute('aria-pressed', String(phases[index].name === stop.phase));
  });
  timeline.select(i);
  if (move && mode !== 'route') {
    goTo({ lon: stop.coords[0], lat: stop.coords[1], scale: camera.scale });
  }
  queueDraw();
  if (updateHash) bookmark(i);
  if (announce) announcement.textContent = `Stop ${i + 1} of ${stops.length}. ${stop.name}. ${stop.title}`;
}

function beatDuration(i = selectedIndex) {
  const time = ['cunaxa', 'mount-theches', 'pergamum'].includes(stops[i].id) ? 7200 : 5800;
  return time / Number(speedControl.value);
}

function syncPlayButton(playing) {
  const finished = selectedIndex === stops.length - 1 && playback.getProgress() >= 1;
  const label = playing ? 'Pause' : finished ? 'Replay' : 'Play';
  playButton.setAttribute('aria-label', `${label} journey`);
  playButton.firstElementChild.textContent = playing ? 'Ⅱ' : '▶';
  find('#play-label').textContent = label;
}

function followLeg(i) {
  if (!followControl.checked) return;
  const points = routeNodes[i]?.points ?? [stops[i].coords];
  const [startLon, startLat] = points[0];
  const [endLon, endLat] = points.at(-1);
  const extent = Math.max(
    ...points.map(([lon, lat]) => Math.hypot((lon - endLon) * .8, lat - endLat)),
  );
  setMode('free');
  goTo({
    lon: startLon + (endLon - startLon) * .55,
    lat: startLat + (endLat - startLat) * .55,
    scale: clamp(1.5 - extent * .042, 1.04, 1.5),
  }, { duration: Math.min(1300, beatDuration(i) * .3) });
}

function setPlaying(playing) {
  if (!playing) {
    if (playback.isPlaying()) {
      playback.pause();
      stopCameraAnimation();
      queueDraw();
    }
    return;
  }
  const progress = playback.getProgress();
  if (selectedIndex === stops.length - 1 && progress === 1) {
    selectStop(0, { move: false });
    playback.reset(beatDuration(0));
  }
  playback.play(beatDuration());
  followLeg(selectedIndex);
}

function cameraFrame() {
  const mapBox = mapFrame.getBoundingClientRect();
  const width = mapFrame.clientWidth;
  const height = mapFrame.clientHeight;
  const padding = clamp(width * .035, 12, 42);
  const scene = storyPanel.getBoundingClientRect();
  const landscapePanel = !storyPanel.hidden && width >= 530 && scene.width < width * .56;
  const lowPanel = !storyPanel.hidden && !landscapePanel;
  const top = Math.max(0, phaseControls.getBoundingClientRect().bottom - mapBox.top) + 8;
  const bottom = Math.min(
    height - 8,
    timelinePanel.getBoundingClientRect().top - mapBox.top - 8,
    mapKey.getBoundingClientRect().top - mapBox.top - 7,
    lowPanel ? scene.top - mapBox.top - 7 : height,
  );
  const usableHeight = Math.max(54, bottom - top);
  const right = landscapePanel ? scene.left - mapBox.left - padding * .55 : width - padding;
  const usableWidth = Math.max(54, right - padding);
  const baseline = Math.min(usableWidth / .325, usableHeight / .215);
  return {
    width,
    height,
    x: padding + usableWidth / 2,
    y: top + usableHeight / 2,
    baseline,
    world: Math.min(usableWidth * .47, usableHeight * .476) / baseline,
  };
}

function getView() {
  const frame = cameraFrame();
  return { ...frame, ...camera, radius: frame.baseline * camera.scale };
}

function globeScale() {
  return cameraFrame().world;
}

function draw() {
  drawFrame = undefined;
  const view = getView();
  if (!view.width || !view.height) return;
  map.setAttribute('viewBox', `0 0 ${view.width} ${view.height}`);
  viewAtLastDraw = view;
  surface.draw({ ...view, terrain: layers.terrain });
  drawHistoricalLayer(view, layers, layers.route ? project(stops[selectedIndex].coords, view) : null);
  routeLayer.style.display = layers.route ? '' : 'none';
  markerLayer.style.display = layers.route ? '' : 'none';
  namesLayer.style.display = layers.route && layers.places ? '' : 'none';
  for (const { node, points, regional } of gridNodes) {
    node.setAttribute('d', layers.grid && regional === (view.scale >= .52) ? linePath(points, view) : '');
  }
  for (const { node, lines } of riverNodes) {
    node.setAttribute('d', view.scale > .48 ? lines.map(line => linePath(line, view)).join('') : '');
  }
  for (const { node, coords } of mapLabelNodes) {
    const { x, y, visible } = project(coords, view);
    node.setAttribute('visibility', visible && layers.places && view.scale > .56 ? 'visible' : 'hidden');
    node.setAttribute('x', x);
    node.setAttribute('y', y);
  }
  for (const { shadow, line, points } of layers.route ? routeNodes.slice(1) : []) {
    const d = linePath(points, view);
    shadow.setAttribute('d', d);
    line.setAttribute('d', d);
  }
  stops.forEach((stop, i) => {
    const { x, y, visible } = project(stop.coords, view);
    const inFrame = visible && x > 5 && x < view.width - 5 && y > 5 && y < view.height - 5;
    const showMarker = inFrame && (view.scale > .39 || i === selectedIndex);
    const marker = markerNodes[i];
    marker.setAttribute('visibility', showMarker ? 'visible' : 'hidden');
    marker.setAttribute('tabindex', showMarker ? '0' : '-1');
    marker.setAttribute('transform', `translate(${x} ${y})`);
    const { dx = 0, dy = -16 } = labelLayouts[stop.id] ?? {};
    labelNodes[i].setAttribute('x', x + dx);
    labelNodes[i].setAttribute('y', y + dy);
    labelNodes[i].setAttribute('visibility', inFrame && (view.scale > .5 || i === selectedIndex) ? 'visible' : 'hidden');
  });
  drawTrail(view);
  scaleBar.hidden = view.scale < .5;
  if (!scaleBar.hidden) {
    const kilometers = view.radius > 1750 ? 200 : 500;
    scaleBar.style.width = `${view.radius * kilometers / 6371}px`;
    scaleBar.textContent = `${kilometers} km`;
  }
  zoomOut.disabled = view.scale <= view.world + .005;
  zoomIn.disabled = view.scale >= 2.8;
}

function queueDraw() {
  if (drawFrame === undefined) drawFrame = requestAnimationFrame(draw);
}

function stopCameraAnimation() {
  cancelAnimationFrame(animation);
  animation = undefined;
}

function goTo(target, { duration = 720 } = {}) {
  stopCameraAnimation();
  if (reducedMotion.matches) {
    Object.assign(camera, target);
    queueDraw();
    return;
  }
  const start = performance.now();
  const origin = { ...camera };
  const deltaLon = wrapLon(target.lon - origin.lon);
  const deltaLat = target.lat - origin.lat;
  const logScale = Math.log(target.scale / origin.scale);
  const animate = now => {
    const progress = clamp((now - start) / duration, 0, 1);
    const t = progress * progress * (3 - 2 * progress);
    camera.lon = wrapLon(origin.lon + deltaLon * t);
    camera.lat = origin.lat + deltaLat * t;
    camera.scale = origin.scale * Math.exp(logScale * t);
    queueDraw();
    animation = progress < 1 ? requestAnimationFrame(animate) : undefined;
    if (progress === 1 && mode === 'globe') camera.scale = globeScale();
  };
  animation = requestAnimationFrame(animate);
}

function syncMode() {
  viewRoute.setAttribute('aria-pressed', String(mode === 'route'));
  viewGlobe.setAttribute('aria-pressed', String(mode === 'globe'));
}

function setMode(nextMode) {
  awaitingIntro = false;
  mode = nextMode;
  syncMode();
  if (mode === 'route') goTo({ ...routeCenter, scale: 1 });
  if (mode === 'globe') goTo({ ...globeCenter, scale: globeScale() });
}

function changeZoom(factor, { animate = true } = {}) {
  setPlaying(false);
  const scale = clamp(camera.scale * factor, globeScale(), 2.85);
  setMode('free');
  if (animate) {
    goTo({ ...camera, scale });
  } else {
    stopCameraAnimation();
    camera.scale = scale;
    queueDraw();
  }
}

function touchGap() {
  if (pointers.size < 2) return 0;
  const [a, b] = [...pointers.values()];
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function startPointer(event) {
  if (event.target.closest('button') || event.button !== 0) return;
  stopCameraAnimation();
  pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
  const gap = touchGap();
  if (pointers.size === 1 || gap) {
    gesture = { startX: event.clientX, startY: event.clientY, radius: getView().radius, origin: { ...camera }, gap, moved: false };
  }
}

function movePointer(event) {
  if (!gesture || !pointers.has(event.pointerId)) return;
  pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
  const gap = touchGap();
  const dx = event.clientX - gesture.startX;
  const dy = event.clientY - gesture.startY;
  if (!gesture.moved && !gap && Math.hypot(dx, dy) < 4) return;
  if (!mapFrame.hasPointerCapture(event.pointerId)) mapFrame.setPointerCapture(event.pointerId);
  if (!gesture.moved) {
    gesture.moved = true;
    mapFrame.classList.add('dragging');
    setPlaying(false);
    setMode('free');
  }
  if (gap && gesture.gap) {
    camera.scale = clamp(gesture.origin.scale * gap / gesture.gap, globeScale(), 2.85);
  } else if (!gesture.gap) {
    const degreesPerPixel = 57.296 / gesture.radius;
    camera.lon = wrapLon(gesture.origin.lon - dx * degreesPerPixel / Math.max(.4, Math.cos(camera.lat * Math.PI / 180)));
    camera.lat = clamp(gesture.origin.lat + dy * degreesPerPixel, -83, 83);
  }
  queueDraw();
}

function endPointer(event) {
  if (!pointers.delete(event.pointerId)) return;
  if (gesture?.moved) suppressClickUntil = performance.now() + 250;
  if (pointers.size) {
    const [remaining] = pointers.values();
    gesture = { startX: remaining.x, startY: remaining.y, radius: getView().radius, origin: { ...camera }, gap: 0, moved: true };
  } else {
    gesture = undefined;
    mapFrame.classList.remove('dragging');
  }
}

function keyboardGlobe(event) {
  if (event.target !== mapFrame) return;
  const step = 2.25 / camera.scale;
  const movements = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] };
  const movement = movements[event.key];
  if (!movement) return;
  event.preventDefault();
  setPlaying(false);
  stopCameraAnimation();
  setMode('free');
  camera.lon = wrapLon(camera.lon + movement[0]);
  camera.lat = clamp(camera.lat + movement[1], -83, 83);
  queueDraw();
}

function selectFromHash() {
  if (location.hash === '#sources') sources.open = true;
  if (!location.hash.startsWith('#stop=')) return false;
  const index = indexById.get(location.hash.slice('#stop='.length));
  if (index === undefined) return false;
  setPlaying(false);
  selectStop(index, { updateHash: false });
  playback.reset(beatDuration(index));
  syncPlayButton(false);
  return true;
}

surface = createGlobe(find('#globe-canvas'));
setupBase();
drawHistoricalLayer = addHistoricalLayer(map);
setupRoute();
setupMarkers();
setupPhases();
const timeline = makeTimeline(find('#stop-timeline'), stops, phases, chooseStop);
const playback = createPlayback({
  onAdvance() {
    if (selectedIndex === stops.length - 1) return false;
    selectStop(selectedIndex + 1, { move: false });
    playback.setDuration(beatDuration());
    followLeg(selectedIndex);
    return true;
  },
  onProgress(fraction) {
    beatProgress = fraction;
    timeline.setProgress(fraction);
    drawTrail();
  },
  onStateChange: syncPlayButton,
});
if (location.hash.startsWith('#stop=') && indexById.has(location.hash.slice(6))) {
  awaitingIntro = false;
  mode = 'route';
  Object.assign(camera, routeCenter, { scale: 1 });
}
syncMode();
if (!selectFromHash()) selectStop(0, { updateHash: false, announce: false, move: false });
if (mode === 'globe') camera.scale = globeScale();

function resizeMap() {
  if (mode === 'globe' && !animation) camera.scale = globeScale();
  queueDraw();
}

const observer = new ResizeObserver(resizeMap);
for (const node of [mapFrame, phaseControls, timelinePanel, storyPanel]) observer.observe(node);
surface.ready?.then(queueDraw);
queueDraw();

previousButton.addEventListener('click', () => chooseStop(selectedIndex - 1));
nextButton.addEventListener('click', () => chooseStop(selectedIndex + 1));
playButton.addEventListener('click', () => setPlaying(!playback.isPlaying()));
speedControl.addEventListener('change', () => playback.setDuration(beatDuration()));
followControl.addEventListener('change', () => {
  if (playback.isPlaying()) {
    if (followControl.checked) followLeg(selectedIndex);
    else stopCameraAnimation();
  }
});
zoomIn.addEventListener('click', () => changeZoom(1.36));
zoomOut.addEventListener('click', () => changeZoom(1 / 1.36));
function showPreset(mode) {
  setPlaying(false);
  setMode(mode);
}
reset.addEventListener('click', () => showPreset('route'));
viewRoute.addEventListener('click', () => showPreset('route'));
viewGlobe.addEventListener('click', () => showPreset('globe'));
sceneToggle.addEventListener('click', () => {
  storyPanel.hidden = !storyPanel.hidden;
  sceneToggle.setAttribute('aria-expanded', String(!storyPanel.hidden));
  find('.atlas-window').classList.toggle('scene-hidden', storyPanel.hidden);
  resizeMap();
});
mapFrame.addEventListener('pointerdown', startPointer);
mapFrame.addEventListener('pointermove', movePointer);
window.addEventListener('pointerup', endPointer);
window.addEventListener('pointercancel', endPointer);
mapFrame.addEventListener('keydown', keyboardGlobe);
mapFrame.addEventListener('wheel', event => {
  event.preventDefault();
  const sensitivity = event.deltaMode ? .05 : .0025;
  const factor = Math.exp(clamp(-event.deltaY * sensitivity, -.45, .45));
  changeZoom(factor, { animate: false });
}, { passive: false });
navSources.addEventListener('click', event => {
  event.preventDefault();
  setPlaying(false);
  sources.open = true;
  closeSources.focus({ preventScroll: true });
});
function dismissSources() {
  sources.open = false;
  navSources.focus({ preventScroll: true });
}
closeSources.addEventListener('click', dismissSources);
sources.querySelector('summary').addEventListener('click', event => {
  event.preventDefault();
  dismissSources();
});
sources.addEventListener('toggle', () => navSources.setAttribute('aria-expanded', String(sources.open)));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && sources.open && sources.contains(document.activeElement)) dismissSources();
});
if (document.fullscreenEnabled && document.documentElement.requestFullscreen) {
  fullscreen.hidden = false;
  fullscreen.addEventListener('click', async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      announcement.textContent = 'Fullscreen is unavailable in this browser.';
    }
  });
  document.addEventListener('fullscreenchange', () => {
    const label = document.fullscreenElement ? 'Exit fullscreen' : 'Enter fullscreen';
    fullscreen.setAttribute('aria-label', label);
    fullscreen.title = label;
    resizeMap();
  });
}
function connectPopover(trigger, panel) {
  function dismiss(restoreFocus = false) {
    if (panel.hidden) return;
    panel.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
    if (restoreFocus) trigger.focus({ preventScroll: true });
  }
  trigger.addEventListener('click', () => {
    if (!panel.hidden) {
      dismiss();
      return;
    }
    panel.hidden = false;
    trigger.setAttribute('aria-expanded', 'true');
    panel.querySelector('input, select')?.focus({ preventScroll: true });
  });
  panel.addEventListener('keydown', event => {
    if (event.key === 'Escape') dismiss(true);
  });
  document.addEventListener('pointerdown', event => {
    if (!panel.contains(event.target) && !trigger.contains(event.target)) dismiss();
  });
}

const layerMenu = find('#layers-panel');
connectPopover(find('#layers-toggle'), layerMenu);
connectPopover(find('#playback-settings-toggle'), find('#playback-settings'));
layerMenu.addEventListener('change', event => {
  if (!(event.target instanceof HTMLInputElement)) return;
  const { layer } = event.target.dataset;
  layers[layer] = event.target.checked;
  if ((layer === 'administration' || layer === 'neighbors') && layers[layer] && camera.scale < .34) showPreset('route');
  queueDraw();
});
for (const source of historicalSources) {
  const citation = link(source.name, source.url);
  citation.title = source.note;
  find('#historical-links').append(citation);
}
window.addEventListener('hashchange', selectFromHash);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) setPlaying(false);
});
