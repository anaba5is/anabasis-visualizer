import { stops } from './story.mjs';
import { captions } from './captions.mjs';

import { scenes } from './scenes.mjs';
import { mapLabels, routeWaypoints, uncertainLegs, routeLandmarks, alternativeBook4Corridor } from './map-data.mjs';
import { createGlobe, createProjector, keepPointInFrame } from './globe.mjs';
import { makeTimeline } from './timeline.mjs?v=storytelling-v3';
import { createPlayback } from './playback.mjs';
import { addHistoricalLayer } from './historical-layer.mjs';
import { historicalSources, politicalRegions } from './historical-data.mjs';
import { createMapLabels } from './map-labels.mjs';
import { firstAvailableLabel } from './label-geometry.mjs';
import { connectPopover } from './popover.mjs';
import { readAtlasLocation, writeAtlasLocation } from './atlas-location.mjs';
import { connectWorldPanel } from './world-panel.mjs';
import { html, link } from './dom.mjs';
import { createSceneReader } from './scene-reader.mjs?v=storytelling-v3';
import { bookFor, placeAndBook, formatStopDate } from './journey-format.mjs';
import { fitMapViewport } from './map-viewport.mjs';
import { primaryQuotes } from './expedition-metrics.mjs';

const phases = [
  { name: 'March inland', color: '#f1b66f', timelineColor: '#a4662a' },
  { name: 'Retreat', color: '#d4e3ec', timelineColor: '#657f91' },
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
const masthead = find('.masthead');
const atlasWindow = find('.atlas-window');
const intro = find('#journey-intro');
const seaMoment = find('#sea-moment');
const momentQuote = find('#moment-quote');
const momentCite = find('#moment-cite');
const bordersEra = find('#borders-era');
const mapModes = find('.map-mode');
const mapTools = find('.map-controls');
const worldCard = find('#world-focus-card');
const phoneScene = find('#phone-scene');
const phoneBegin = find('#phone-begin');
const phoneThumb = find('#phone-thumb-image');
const phoneStage = find('.phone-stage');
const phonePlace = find('.phone-place');
const stationsToggle = find('#stations-toggle');
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
const readerDialog = find('#image-viewer');
const timelinePanel = find('.timeline-panel');
const phaseControls = find('#phase-controls');
const mapKey = find('.map-key');
const navSources = find('.site-nav a');
const closeSources = find('#close-sources');
const fullscreen = find('#fullscreen-toggle');
const timelineBook = find('#timeline-book');
const stopCounter = find('#stop-counter');
const playLabel = find('#play-label');
const speedControl = find('#playback-speed');
const followControl = find('#follow-camera');
const layers = {
  route: true, terrain: true, borders: true, worldSites: true,
  administration: false, neighbors: false, altRoute: false, places: true, grid: true,
};
const scaleBar = find('#map-scale');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const routeCenter = { lon: 35.5, lat: 37.8 };
const globeCenter = { lon: 26, lat: 29 };
const camera = { ...globeCenter, scale: .19 };
const markerNodes = [];
const labelNodes = [];
const routeNodes = [];
const gridNodes = [];
const riverNodes = [];
const landmarkNodes = [];
const altRoutePoints = along(alternativeBook4Corridor.points);
let altRouteLayer;
let altRouteShadow;
let altRoutePath;
let altRouteLabel;
let landmarkLayer;
let riverLayer;
let riverRequest;
const mapLabelNodes = [];
const labelRenderer = createMapLabels(stops, labelNodes, mapLabelNodes, labelLayouts);
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
let namesLayer;
let trail;
let tracer;
let viewAtLastDraw;
let beatProgress = 0;
let worldFocus;
let worldPanel;
let worldFocusMarker;
let frameBounds;
let lastSurfaceView;
let lastProjectedView;

function svg(tag, attrs = {}, content = '') {
  const node = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [name, value] of Object.entries(attrs)) node.setAttribute(name, value);
  node.textContent = content;
  return node;
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
    const point = view.locate(coordinates);
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
    addGrid(Array.from({ length: 37 }, (_, step) => [lon, -90 + step * 5]));
  }
  for (let lat = -75; lat <= 75; lat += 15) {
    addGrid(Array.from({ length: 73 }, (_, step) => [-180 + step * 5, lat]));
  }
  for (let lon = 20; lon <= 55; lon += 5) {
    addGrid(Array.from({ length: 25 }, (_, step) => [lon, 24 + step]), true);
  }
  for (let lat = 25; lat <= 50; lat += 5) {
    addGrid(Array.from({ length: 39 }, (_, step) => [18 + step, lat]), true);
  }
  riverLayer = svg('g');
  base.append(riverLayer);
  const labels = [...mapLabels].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
  for (const label of labels) {
    const { name, kind, minScale } = label;
    const minorWater = kind === 'sea' && minScale > 1.1;
    const node = svg('text', { class: `map-label ${kind}${minorWater ? ' strait' : ''}` }, name);
    mapLabelNodes.push({ node, ...label });
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

  altRouteLayer = svg('g', { class: 'alt-route-layer', 'aria-hidden': 'true' });
  altRouteShadow = svg('path', { class: 'alt-route-shadow' });
  altRoutePath = svg('path', { class: 'alt-route-path' });
  altRouteLabel = svg('text', { class: 'alt-route-label' }, alternativeBook4Corridor.name);
  altRouteLayer.append(altRouteShadow, altRoutePath, altRouteLabel);

  landmarkLayer = svg('g', { class: 'route-landmarks', 'aria-hidden': 'true' });
  for (const landmark of routeLandmarks) {
    const group = svg('g', { class: 'route-landmark' });
    group.append(
      svg('title', {}, `${landmark.name} (Anabasis ${landmark.cite}): ${landmark.note}`),
      svg('circle', { class: 'landmark-dot', r: 2.3 }),
    );
    const text = svg('text', { class: 'landmark-label' }, landmark.name);
    landmarkLayer.append(group, text);
    landmarkNodes.push({ ...landmark, group, text });
  }
  map.append(legs, altRouteLayer, landmarkLayer);
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
  const position = view.locate(head);
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
          const point = view.locate(place.coords);
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
    const setPreview = active => {
      labelNodes[i].classList.toggle('preview', active);
      labelRenderer.forget(labelNodes[i]);
      lastProjectedView = undefined;
      queueDraw();
    };
    const preview = () => setPreview(true);
    const unpreview = () => setPreview(false);
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

function sceneFigure(scene) {
  const figure = html('figure', 'scene');
  figure.dataset.surface = scene.surface ?? (scene.mount ? 'mount' : 'bleed');
  if (scene.mount) figure.style.setProperty('--scene-mount', scene.mount);
  const image = html('img', scene.contain ? 'contain' : '');
  image.loading = 'lazy';
  image.src = `./assets/previews/card-${scene.file}`;
  image.alt = scene.alt;
  image.decoding = 'async';
  figure.append(image, html('figcaption', '', scene.caption));
  return figure;
}

function openScene(trigger) {
  closeLayers?.();
  closePlaybackSettings?.();
  if (sources.open) sources.open = false;
  sceneReader.open(trigger);
}

function renderStory(stop, i) {
  const book = bookFor(stop);
  const scene = scenes[stop.id];
  const title = html('h2', 'stop-name', stop.name);
  title.id = 'stop-title';
  const copy = html('div', 'story-copy');
  copy.append(
    html('p', 'stop-region', placeAndBook(stop) + ' · ' + formatStopDate(stop)),
    title,
  );
  const summary = html('p', 'stop-summary', captions[stop.id]);
  const expand = html('button', 'scene-action');
  expand.type = 'button';
  expand.setAttribute('aria-label', `Read scene for ${stop.name}`);
  expand.setAttribute('aria-haspopup', 'dialog');
  expand.append(html('span', 'scene-action-label', 'Read scene'));
  expand.addEventListener('click', () => openScene(expand));
  storyContent.replaceChildren(copy, sceneFigure(scene), summary, expand);

  phoneThumb.src = `./assets/previews/thumb-${scene.file}`;
  phoneStage.textContent = `${formatStopDate(stop)} · ${i + 1}/${stops.length}`;
  phonePlace.textContent = stop.name;
  phoneScene.setAttribute('aria-label', `Details for ${stop.name}`);
  timelineBook.textContent = `Book ${book} · ${formatStopDate(stop)}`;
  stopCounter.textContent = `${String(i + 1).padStart(2, '0')} / ${stops.length}`;
  previousButton.disabled = i === 0;
  nextButton.disabled = i === stops.length - 1;
}

function bookmark(i) {
  history.replaceState(null, '', writeAtlasLocation('stop', stops[i].id));
}

function frameStopCamera(i) {
  const points = routeNodes[i]?.points ?? [stops[i].coords];
  const [startLon, startLat] = points[0];
  const [endLon, endLat] = points.at(-1);
  const extent = Math.max(
    ...points.map(([lon, lat]) => Math.hypot((lon - endLon) * .8, lat - endLat)),
  );
  const scale = i === 0 ? 1.08 : clamp(1.38 - extent * .038, 1.06, 1.34);
  const target = {
    lon: i === 0 ? 31.2 : startLon + (endLon - startLon) * .64,
    lat: i === 0 ? 38.4 : startLat + (endLat - startLat) * .64,
    scale,
  };
  const frame = cameraFrame();
  const adjusted = keepPointInFrame(stops[i].coords, {
    ...frame, ...target, radius: frame.baseline * scale,
  });
  if (adjusted) Object.assign(target, adjusted);
  return target;
}

function chooseStop(i) {
  if (!stops[i]) return;
  const fromOpening = awaitingIntro || !intro.hidden;
  if (sources.open) sources.open = false;
  setPlaying(false);
  if (fromOpening && i === 0) {
    setMode('route');
    selectStop(i, { move: false });
  } else if (followControl.checked) {
    if (worldFocus) {
      worldFocus = undefined;
      worldPanel.hide();
      atlasWindow.classList.remove('world-focused');
      frameBounds = undefined;
    }
    dismissIntro();
    awaitingIntro = false;
    mode = 'free';
    syncMode();
    selectStop(i, { move: false });
    goTo(frameStopCamera(i), { duration: 660 });
  } else {
    if (worldFocus || fromOpening || mode === 'globe') setMode('route');
    selectStop(i);
  }
  playback.reset(beatDuration(i));
  syncPlayButton(false);
}

function selectStop(i, { updateHash = true, announce = true, move = true } = {}) {
  const stop = stops[i];
  if (!stop) return;
  selectedIndex = i;
  renderStory(stop, i);
  sceneReader.update(i);
  markerNodes.forEach((marker, index) => {
    const here = i === index;
    marker.classList.toggle('selected', here);
    marker.setAttribute('aria-pressed', String(here));
    if (labelNodes[index].classList.contains('selected') !== here) labelRenderer.forget(labelNodes[index]);
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
  playLabel.textContent = label;
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
  if (worldFocus) {
    setMode('route');
    bookmark(selectedIndex);
  }
  dismissIntro();
  const progress = playback.getProgress();
  if (selectedIndex === stops.length - 1 && progress === 1) {
    selectStop(0, { move: false });
    playback.reset(beatDuration(0));
  }
  playback.play(beatDuration());
  followLeg(selectedIndex);
}

function layoutBox(element, origin) {
  if (element.hidden) return null;
  const box = element.getBoundingClientRect();
  if (box.width <= 2 || box.height <= 2) return null;
  return {
    width: box.width,
    left: box.left - origin.left,
    right: box.right - origin.left,
    top: box.top - origin.top,
    bottom: box.bottom - origin.top,
  };
}

function measureCameraFrame() {
  const width = mapFrame.clientWidth;
  const height = mapFrame.clientHeight;
  const origin = mapFrame.getBoundingClientRect();
  const box = element => layoutBox(element, origin);
  const readerFraming = sceneReader.isSideOpen() || sceneReader.isHalfSheetOpen();
  const scene = readerFraming ? readerDialog : storyPanel;
  const headers = width < 690 ? [masthead, phaseControls, worldCard] : [masthead, phaseControls];
  return fitMapViewport(width, height, {
    headers: headers.map(box),
    panels: [scene, timelinePanel].map(box),
    tools: readerFraming && width < 690 ? [] : [mapKey, mapModes, mapTools].map(box),
    intro: box(intro),
  });
}

function cameraFrame() {
  return frameBounds ??= measureCameraFrame();
}

function getView() {
  const frame = cameraFrame();
  const readerOpen = sceneReader.isSideOpen() || sceneReader.isHalfSheetOpen();
  const view = { ...frame, ...camera, radius: frame.baseline * camera.scale, focusId: worldFocus?.id, readerOpen };
  view.locate = createProjector(view);
  return view;
}

function globeScale() {
  return cameraFrame().world;
}

function loadRivers() {
  riverRequest ??= import('./assets/map-geometry.mjs').then(({ rivers }) => {
    for (const river of rivers) {
      const node = svg('path', { class: 'map-river' });
      riverNodes.push({ node, lines: river.lines });
      riverLayer.append(node);
    }
    lastProjectedView = undefined;
    queueDraw();
  }).catch(error => console.error('River data could not load', error));
}

function draw() {
  drawFrame = undefined;
  const view = getView();
  if (!view.width || !view.height) return;
  const storyMap = !worldFocus && mode === 'route' && view.scale >= .75;
  atlasWindow.classList.toggle('story-map', storyMap);
  view.storyMap = storyMap;
  const showQuoteContext = !worldFocus && !sceneReader.isHalfSheetOpen() && mode !== 'globe' && view.scale >= .65;
  const activeQuote = showQuoteContext ? primaryQuotes[stops[selectedIndex].id] : null;
  const showQuote = Boolean(activeQuote?.mapCallout);
  seaMoment.hidden = !showQuote;
  if (showQuote) {
    seaMoment.classList.toggle('is-short', activeQuote.text.length <= 24);
    momentQuote.textContent = `“${activeQuote.text}”`;
    momentCite.replaceChildren('Xenophon, ', html('i', '', 'Anabasis'), ` ${activeQuote.cite}`);
  }
  if (bordersEra) bordersEra.hidden = !layers.borders;
  const projection = [view.width, view.height, view.x, view.y, view.lon, view.lat, view.radius, view.scale].join(',');
  const surfaceKey = `${projection}|${layers.terrain}|${window.devicePixelRatio}`;
  if (lastSurfaceView !== surfaceKey) {
    lastSurfaceView = surfaceKey;
    surface.draw({ ...view, terrain: layers.terrain });
  }
  viewAtLastDraw = view;
  const overlayKey = `${projection}|${selectedIndex}|${worldFocus?.id ?? ''}|${storyMap}|${view.readerOpen}|${Object.values(layers).join(',')}`;
  if (lastProjectedView === overlayKey) {
    drawTrail(view);
    return;
  }
  lastProjectedView = overlayKey;
  const viewBox = `0 0 ${view.width} ${view.height}`;
  if (map.getAttribute('viewBox') !== viewBox) map.setAttribute('viewBox', viewBox);
  const positions = stops.map(stop => view.locate(stop.coords));
  routeLayer.style.display = layers.route ? '' : 'none';
  const showPin = i => i === selectedIndex ? layers.route || view.readerOpen : layers.route && view.scale > .39;
  namesLayer.style.display = layers.places && (layers.route || view.readerOpen) ? '' : 'none';
  const pinBounds = positions.flatMap((point, i) => {
    if (!point.visible || !showPin(i)) return [];
    const r = i === selectedIndex ? 12 : 7;
    return [{ left: point.x - r, right: point.x + r, top: point.y - r, bottom: point.y + r }];
  });
  const callout = seaMoment.hidden ? null : layoutBox(seaMoment, mapFrame.getBoundingClientRect());
  const occupied = callout ? [...pinBounds, callout] : pinBounds;
  const { occupied: stopLabels } = labelRenderer.drawStops(view, positions, selectedIndex, layers, occupied);
  const visibleStopIds = new Set(stops.filter((_, i) =>
    labelNodes[i].getAttribute('visibility') === 'visible' || (showPin(i) && positions[i].visible),
  ).map(stop => stop.id));
  const routeAnchor = layers.route ? positions[selectedIndex] : null;
  const historicalLabels = drawHistoricalLayer(view, layers, routeAnchor, callout ? [...stopLabels, callout] : stopLabels, visibleStopIds);
  const focusedPlace = worldFocus?.kind ? view.locate(worldFocus.coords) : undefined;
  worldFocusMarker.setAttribute('visibility', focusedPlace?.visible ? 'visible' : 'hidden');
  if (focusedPlace?.visible) worldFocusMarker.setAttribute('transform', `translate(${focusedPlace.x} ${focusedPlace.y})`);
  const allOccupied = [...historicalLabels, ...pinBounds];
  labelRenderer.drawPlaces(view, allOccupied, layers.places);

  altRouteLayer.style.display = layers.altRoute ? '' : 'none';
  if (layers.altRoute) {
    const altD = linePath(altRoutePoints, view);
    altRouteShadow.setAttribute('d', altD);
    altRoutePath.setAttribute('d', altD);
    const altPt = view.locate(alternativeBook4Corridor.labelCoords);
    const altMetrics = { width: 158, above: 12, below: 4 };
    const altBox = altPt.visible && layers.places
      ? firstAvailableLabel(altPt, altMetrics, [[-10, -10, 'end'], [10, -10, 'start'], [0, 18, 'middle']], view.labelBounds, allOccupied)
      : undefined;
    altRouteLabel.setAttribute('visibility', altBox ? 'visible' : 'hidden');
    if (altBox) {
      altRouteLabel.style.textAnchor = altBox.anchor;
      altRouteLabel.setAttribute('x', altBox.x.toFixed(1));
      altRouteLabel.setAttribute('y', altBox.y.toFixed(1));
      allOccupied.push(altBox);
    }
  }

  const showLandmarks = layers.route && layers.places && view.scale > .98 && !worldFocus;
  landmarkLayer.style.display = showLandmarks ? '' : 'none';
  if (showLandmarks) {
    for (const item of landmarkNodes) {
      if (layers.administration && item.id === 'celaenae-park') {
        item.group.setAttribute('visibility', 'hidden');
        item.text.setAttribute('visibility', 'hidden');
        continue;
      }
      const pt = view.locate(item.coords);
      const inBounds = pt.visible && pt.x > 8 && pt.x < view.width - 8 && pt.y > 8 && pt.y < view.height - 8;
      item.group.setAttribute('visibility', inBounds ? 'visible' : 'hidden');
      if (!inBounds) {
        item.text.setAttribute('visibility', 'hidden');
        continue;
      }
      item.group.setAttribute('transform', `translate(${pt.x.toFixed(1)} ${pt.y.toFixed(1)})`);
      allOccupied.push({ left: pt.x - 4, right: pt.x + 4, top: pt.y - 4, bottom: pt.y + 4 });
      const metrics = { width: item.name.length * 6.2 + 8, above: 11, below: 3 };
      const box = firstAvailableLabel(pt, metrics, [[7, 3, 'start'], [-7, 3, 'end'], [0, -8, 'middle'], [0, 14, 'middle']], view.labelBounds, allOccupied);
      item.text.setAttribute('visibility', box ? 'visible' : 'hidden');
      if (box) {
        item.text.style.textAnchor = box.anchor;
        item.text.setAttribute('x', box.x.toFixed(1));
        item.text.setAttribute('y', box.y.toFixed(1));
        allOccupied.push(box);
      }
    }
  }
  for (const { node, points, regional } of gridNodes) {
    node.setAttribute('d', layers.grid && regional === (view.scale >= .52) ? linePath(points, view) : '');
  }
  if (view.scale > .48) loadRivers();
  for (const { node, lines } of riverNodes) {
    node.setAttribute('d', view.scale > .48 ? lines.map(line => linePath(line, view)).join('') : '');
  }
  for (const { shadow, line, points } of layers.route ? routeNodes.slice(1) : []) {
    const d = linePath(points, view);
    shadow.setAttribute('d', d);
    line.setAttribute('d', d);
  }
  stops.forEach((stop, i) => {
    const { x, y, visible } = positions[i];
    const inFrame = visible && x > 5 && x < view.width - 5 && y > 5 && y < view.height - 5;
    const showMarker = inFrame && showPin(i);
    const marker = markerNodes[i];
    marker.setAttribute('visibility', showMarker ? 'visible' : 'hidden');
    marker.setAttribute('tabindex', showMarker ? '0' : '-1');
    marker.setAttribute('transform', `translate(${x} ${y})`);
  });
  drawTrail(view);
  scaleBar.hidden = view.scale < .5;
  if (!scaleBar.hidden) {
    const kilometers = view.radius > 1750 ? 200 : 500;
    scaleBar.style.width = `${view.radius * kilometers / 6371}px`;
    scaleBar.textContent = `${kilometers} km`;
  }
  zoomOut.disabled = view.scale <= view.world + .005;
  zoomIn.disabled = view.scale >= 4.15;
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

function dismissIntro() {
  if (intro.hidden) return;
  intro.hidden = true;
  atlasWindow.classList.remove('journey-opening');
  frameBounds = undefined;
  queueDraw();
}

function setMode(nextMode) {
  if (nextMode !== 'free' && worldFocus) {
    worldFocus = undefined;
    worldPanel.hide();
    atlasWindow.classList.remove('world-focused');
    frameBounds = undefined;
  }
  if (nextMode === 'route') dismissIntro();
  awaitingIntro = false;
  mode = nextMode;
  syncMode();
  if (mode === 'route') goTo({ ...routeCenter, scale: 1 });
  if (mode === 'globe') goTo({ ...globeCenter, scale: globeScale() });
}

function changeZoom(factor, { animate = true } = {}) {
  setPlaying(false);
  const scale = clamp(camera.scale * factor, globeScale(), 4.2);
  setMode('free');
  if (animate) {
    goTo({ ...camera, scale });
  } else {
    stopCameraAnimation();
    camera.scale = scale;
    queueDraw();
  }
}

function glideGlobe(vLon, vLat) {
  if (reducedMotion.matches || Math.hypot(vLon, vLat) < .03) return;
  stopCameraAnimation();
  const step = () => {
    vLon *= .9;
    vLat *= .9;
    camera.lon = wrapLon(camera.lon + vLon);
    camera.lat = clamp(camera.lat + vLat, -83, 83);
    queueDraw();
    animation = Math.hypot(vLon, vLat) > .02 ? requestAnimationFrame(step) : undefined;
  };
  animation = requestAnimationFrame(step);
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
    gesture = {
      startX: event.clientX, startY: event.clientY,
      lastLon: camera.lon, lastLat: camera.lat, vLon: 0, vLat: 0,
      radius: getView().radius, origin: { ...camera }, gap, moved: false,
    };
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
    camera.scale = clamp(gesture.origin.scale * gap / gesture.gap, globeScale(), 4.2);
  } else if (!gesture.gap) {
    const degreesPerPixel = 57.296 / gesture.radius;
    const nextLon = wrapLon(gesture.origin.lon - dx * degreesPerPixel / Math.max(.4, Math.cos(camera.lat * Math.PI / 180)));
    const nextLat = clamp(gesture.origin.lat + dy * degreesPerPixel, -83, 83);
    gesture.vLon = wrapLon(nextLon - gesture.lastLon);
    gesture.vLat = nextLat - gesture.lastLat;
    gesture.lastLon = nextLon;
    gesture.lastLat = nextLat;
    camera.lon = nextLon;
    camera.lat = nextLat;
  }
  queueDraw();
}

function endPointer(event) {
  if (!pointers.delete(event.pointerId)) return;
  const done = gesture;
  if (done?.moved) suppressClickUntil = performance.now() + 250;
  if (pointers.size) {
    const [remaining] = pointers.values();
    gesture = {
      startX: remaining.x, startY: remaining.y,
      lastLon: camera.lon, lastLat: camera.lat, vLon: 0, vLat: 0,
      radius: getView().radius, origin: { ...camera }, gap: 0, moved: true,
    };
  } else {
    gesture = undefined;
    mapFrame.classList.remove('dragging');
    if (done?.moved && !done.gap) glideGlobe(clamp(done.vLon, -4, 4), clamp(done.vLat, -3, 3));
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
  const target = readAtlasLocation(location.hash);
  if (target?.type !== 'stop') return false;
  const index = indexById.get(target.id);
  if (index === undefined) return false;
  setPlaying(false);
  if (worldFocus || !intro.hidden) setMode('route');
  selectStop(index, { updateHash: false });
  playback.reset(beatDuration(index));
  syncPlayButton(false);
  return true;
}

surface = createGlobe(find('#globe-canvas'));
setupBase();
drawHistoricalLayer = addHistoricalLayer(map, {
  onSelectWorldSite(id) {
    if (performance.now() < suppressClickUntil) return;
    worldPanel?.selectById(id);
  },
});
setupRoute();
setupMarkers();
worldFocusMarker = svg('g', { class: 'world-focus-marker', visibility: 'hidden', 'aria-hidden': 'true' });
worldFocusMarker.append(svg('circle', { r: 10 }), svg('circle', { r: 3.5 }));
map.append(worldFocusMarker);
setupPhases();
const timeline = makeTimeline(find('#stop-timeline'), stops, phases, chooseStop);
const stations = find('.route-timeline__viewport');
stations.id = 'journey-stations';
const playback = createPlayback({
  onAdvance() {
    if (selectedIndex === stops.length - 1) return false;
    selectStop(selectedIndex + 1, { move: false, announce: false });
    playback.setDuration(beatDuration());
    followLeg(selectedIndex);
    return true;
  },
  onProgress(fraction) {
    beatProgress = fraction;
    timeline.setProgress(fraction);
    drawTrail();
  },
  onStateChange(playing) {
    syncPlayButton(playing);
    if (!playing) {
      const finished = selectedIndex === stops.length - 1 && playback.getProgress() === 1;
      announcement.textContent = (finished ? 'Journey complete at ' : 'Playback paused at ') + stops[selectedIndex].name;
    }
  },
});
const sceneReader = createSceneReader(readerDialog, {
  index: () => selectedIndex,
  select: chooseStop,
  pause: () => setPlaying(false),
  isAltRoute: () => layers.altRoute,
  onToggleAltRoute() {
    layers.altRoute = !layers.altRoute;
    const checkbox = layerMenu.querySelector('[data-layer="altRoute"]');
    if (checkbox) checkbox.checked = layers.altRoute;
    if (layers.altRoute && camera.scale < 1.1) {
      mode = 'free';
      syncMode();
      goTo({ lon: 40.3, lat: 40.1, scale: 1.38 });
    }
    lastProjectedView = undefined;
    queueDraw();
  },
  onLayout(sideOpen, halfSheet) {
    atlasWindow.classList.toggle('scene-reading', sideOpen);
    atlasWindow.classList.toggle('sheet-reading', Boolean(halfSheet));
    storyPanel.inert = sideOpen;
    frameBounds = undefined;
    if (sideOpen || halfSheet) {
      const frame = cameraFrame();
      const adjusted = keepPointInFrame(stops[selectedIndex].coords, {
        ...frame, ...camera, radius: frame.baseline * camera.scale,
      });
      if (adjusted) Object.assign(camera, adjusted);
    }
    resizeMap();
  },
  fallbackFocus() {
    const trigger = phoneScene.getClientRects().length ? phoneScene : find('.scene-action');
    return trigger?.getClientRects().length ? trigger : mapFrame;
  },
});
const initialLocation = readAtlasLocation(location.hash);
if (initialLocation?.type === 'stop' && indexById.has(initialLocation.id)) {
  dismissIntro();
  awaitingIntro = false;
  mode = 'route';
  Object.assign(camera, routeCenter, { scale: 1 });
}
syncMode();
if (!selectFromHash()) selectStop(0, { updateHash: false, announce: false, move: false });
if (mode === 'globe') camera.scale = globeScale();

function refreshTypography() {
  labelRenderer.clearMetrics();
  drawHistoricalLayer.refreshMetrics?.();
  lastProjectedView = undefined;
  resizeMap();
}

document.fonts.addEventListener('loadingdone', refreshTypography);

function resizeMap() {
  frameBounds = undefined;
  if (mode === 'globe' && !animation) camera.scale = globeScale();
  queueDraw();
}

const observer = new ResizeObserver(resizeMap);
for (const node of [mapFrame, masthead, phaseControls, timelinePanel, storyPanel, mapModes, mapTools]) observer.observe(node);
surface.ready.then(queueDraw);
queueDraw();

function setStationsExpanded(expanded) {
  if (!expanded) {
    closePlaybackSettings();
    if (stations.contains(document.activeElement)) stationsToggle.focus({ preventScroll: true });
  }
  timelinePanel.dataset.stationsExpanded = String(expanded);
  stationsToggle.setAttribute('aria-expanded', String(expanded));
  stationsToggle.setAttribute('aria-label', expanded ? 'Hide all stops' : 'Show all stops');
  stationsToggle.title = expanded ? 'Hide all stops' : 'Show all stops';
  if (expanded) timeline.reveal();
  resizeMap();
}
stationsToggle.addEventListener('click', () => setStationsExpanded(stationsToggle.getAttribute('aria-expanded') !== 'true'));
timelinePanel.addEventListener('keydown', event => {
  if (event.key === 'Escape' && timelinePanel.dataset.stationsExpanded === 'true') {
    setStationsExpanded(false);
    stationsToggle.focus({ preventScroll: true });
  }
});
phoneScene.addEventListener('click', () => openScene(phoneScene));
phoneBegin.addEventListener('click', () => {
  chooseStop(0);
  phoneScene.focus({ preventScroll: true });
});
find('#begin-journey').addEventListener('click', () => {
  chooseStop(0);
  find('.scene-action').focus({ preventScroll: true });
});
find('#explore-globe').addEventListener('click', () => {
  dismissIntro();
  showPreset('globe');
  mapFrame.focus({ preventScroll: true });
});
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
function showPreset(preset) {
  const returningFromWorld = Boolean(worldFocus);
  setPlaying(false);
  setMode(preset);
  if (returningFromWorld) bookmark(selectedIndex);
}
reset.addEventListener('click', () => showPreset('route'));
viewRoute.addEventListener('click', () => showPreset('route'));
viewGlobe.addEventListener('click', () => showPreset('globe'));
sceneToggle.addEventListener('click', () => {
  if (sceneReader.isSideOpen()) {
    sceneReader.close();
    return;
  }
  storyPanel.hidden = !storyPanel.hidden;
  sceneToggle.setAttribute('aria-expanded', String(!storyPanel.hidden));
  atlasWindow.classList.toggle('scene-hidden', storyPanel.hidden);
  resizeMap();
});
mapFrame.addEventListener('pointerdown', startPointer);
mapFrame.addEventListener('pointermove', movePointer);
window.addEventListener('pointerup', endPointer);
window.addEventListener('pointercancel', endPointer);
mapFrame.addEventListener('keydown', keyboardGlobe);
mapFrame.addEventListener('wheel', event => {
  event.preventDefault();
  const isZoom = event.ctrlKey || event.deltaMode !== 0 || (event.deltaX === 0 && Math.abs(event.deltaY) >= 48);
  if (isZoom) {
    const sensitivity = event.deltaMode ? .05 : event.ctrlKey ? .008 : .0025;
    const factor = Math.exp(clamp(-event.deltaY * sensitivity, -.45, .45));
    changeZoom(factor, { animate: false });
    return;
  }
  setPlaying(false);
  stopCameraAnimation();
  setMode('free');
  const degreesPerPixel = 57.296 / getView().radius;
  camera.lon = wrapLon(camera.lon + event.deltaX * degreesPerPixel / Math.max(.4, Math.cos(camera.lat * Math.PI / 180)));
  camera.lat = clamp(camera.lat - event.deltaY * degreesPerPixel, -83, 83);
  queueDraw();
}, { passive: false });
navSources.addEventListener('click', event => {
  event.preventDefault();
  setPlaying(false);
  closeLayers();
  closePlaybackSettings();
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
const layerMenu = find('#layers-panel');
const polityLegend = find('#polity-legend');
for (const region of politicalRegions) {
  const entry = html('li', 'polity-legend-row');
  entry.dataset.polity = region.id;
  entry.style.setProperty('--polity-color', region.color);
  if (region.fillColor) entry.style.setProperty('--polity-fill', region.fillColor);
  const swatch = html('span', 'polity-legend-swatch');
  swatch.setAttribute('aria-hidden', 'true');
  entry.append(swatch, region.name);
  polityLegend.append(entry);
}
polityLegend.hidden = !layers.borders;
const closeLayers = connectPopover(find('#layers-toggle'), layerMenu);
const closePlaybackSettings = connectPopover(find('#playback-settings-toggle'), find('#playback-settings'));
layerMenu.addEventListener('change', event => {
  if (!(event.target instanceof HTMLInputElement)) return;
  const { layer } = event.target.dataset;
  layers[layer] = event.target.checked;
  if (layer === 'borders') polityLegend.hidden = !layers.borders;
  if (layer === 'altRoute') {
    sceneReader.refresh();
    if (layers.altRoute && camera.scale < 1.05) {
      mode = 'free';
      syncMode();
      goTo({ lon: 40.3, lat: 40.1, scale: 1.38 });
    }
  }
  if ((layer === 'administration' || layer === 'neighbors') && layers[layer] && camera.scale < .34) showPreset('route');
  queueDraw();
});
worldPanel = connectWorldPanel({
  onLayerReady(regions, sites) {
    drawHistoricalLayer.addWorld(regions, sites);
    lastProjectedView = undefined;
    queueDraw();
  },
  onBrowse() {
    setPlaying(false);
    closeLayers();
    sources.open = true;
    const heading = find('#world-notes h2');
    heading.tabIndex = -1;
    heading.focus();
  },
  onFocus(entry, zoom) {
    sceneReader.close(false);
    setPlaying(false);
    dismissIntro();
    setMode('free');
    worldFocus = entry;
    atlasWindow.classList.add('world-focused');
    frameBounds = undefined;
    if (entry.kind === 'territory') layers.borders = true;
    if (entry.kind && entry.kind !== 'territory') layers.worldSites = true;
    if (entry.kind) layers.places = true;
    for (const key of ['borders', 'worldSites', 'places']) {
      layerMenu.querySelector(`[data-layer="${key}"]`).checked = layers[key];
    }
    polityLegend.hidden = !layers.borders;
    closeLayers();
    if (sources.open) dismissSources();
    goTo({ lon: entry.coords[0], lat: entry.coords[1], scale: Math.max(globeScale(), zoom ?? globeScale()) });
    worldCard.querySelector('button').focus({ preventScroll: true });
    announcement.textContent = 'Globe centered on ' + entry.name;
  },
  onReturn() {
    showPreset('route');
    viewRoute.focus({ preventScroll: true });
  },
});

for (const source of historicalSources) {
  const citation = link(source.name, source.url);
  citation.title = source.note;
  find('#historical-links').append(citation);
}
window.addEventListener('hashchange', () => {
  if (!selectFromHash()) worldPanel.syncFromHash();
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden) setPlaying(false);
});
