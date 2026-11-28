import { journeyChapters, stops } from './story.mjs';
import { scenes } from './scenes.mjs';
import { html, link } from './dom.mjs';
import { expeditionContext, sceneContext } from './scene-context.mjs';
import { placeAndBook, formatStopDate } from './journey-format.mjs';
import { primaryQuotes, stopMetrics } from './expedition-metrics.mjs';
import { figures, stopFigures } from './expedition-figures.mjs';

const SVG_NS = 'http://www.w3.org/2000/svg';
const MAX_ELEVATION = 2300;

function svgEl(tag, attrs = {}, text = '') {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [key, val] of Object.entries(attrs)) node.setAttribute(key, val);
  if (text) node.textContent = text;
  return node;
}

function noteSummary(label, preview) {
  const summary = html('summary', 'reader-note-summary');
  const caret = html('span', 'reader-note-caret');
  caret.setAttribute('aria-hidden', 'true');
  summary.append(caret, html('span', '', label));
  if (preview) summary.append(html('span', 'reader-note-preview', preview));
  return summary;
}

function passageNotes(stop, scene) {
  const notes = html('details', 'stop-notes');
  const citation = html('p', 'text-citation', `Xenophon, Anabasis ${stop.book}`);
  const chapters = new Set([...stop.book.matchAll(/\b([1-7])\.(\d+)\.\d+/g)]
    .map(([, book, chapter]) => `${book}.${chapter}`));
  const links = html('div', 'passage-links');
  for (const reference of chapters) {
    const [book, chapter] = reference.split('.');
    const url = stop.source.replace(/Book_\d+\/Chapter_\d+$/, `Book_${book}/Chapter_${chapter}`);
    links.append(link(`Read ${reference}`, url));
  }
  const credit = html('p', 'image-credit', 'Image ');
  credit.append(link(scene.credit, scene.source));
  if (scene.licenseUrl) credit.append(' · ', link(scene.licenseName, scene.licenseUrl));
  if (scene.objectSource) credit.append(' · ', link('Museum catalogue', scene.objectSource));
  if (stop.locationSource) links.append(link('Location study', stop.locationSource));
  notes.append(
    noteSummary('Passages & image credit', `${stop.certainty} location`),
    citation,
    links,
    credit,
  );
  return notes;
}

function contextNote({ title, text, source, sourceLabel }) {
  const note = html('section', 'reader-context');
  note.append(html('h3', '', title), html('p', '', text), link(sourceLabel, source));
  return note;
}

function buildElevationCard(activeIndex, select) {
  const stop = stops[activeIndex];
  const metrics = stopMetrics[stop.id];
  if (!metrics) return null;

  const card = html('div', 'reader-telemetry');
  const pills = html('div', 'telemetry-pills');
  pills.append(
    html('span', 'telemetry-pill', metrics.terrain),
    html('span', 'telemetry-pill', metrics.plottedKm ? `~${metrics.plottedKm.toLocaleString('en-US')} km plotted` : 'Start of march'),
  );
  if (metrics.muster) {
    pills.append(html('span', 'telemetry-pill telemetry-muster', `${metrics.muster} (${metrics.musterCite})`));
  }

  const width = 280;
  const top = 7;
  const bottom = 39;
  const left = 10;
  const right = width - 10;
  const coords = stops.map((item, idx) => {
    const elev = stopMetrics[item.id]?.elevationM ?? 0;
    const x = left + (right - left) * (idx / (stops.length - 1));
    const y = bottom - (bottom - top) * (elev / MAX_ELEVATION);
    return { x, y, item, idx, elev };
  });

  const chart = svgEl('svg', {
    class: 'elevation-chart',
    viewBox: `0 0 ${width} 46`,
    role: 'img',
    'aria-label': `Expedition elevation profile. Current stop: ${stop.name}, ${metrics.terrain}.`,
  });
  const lineD = coords.map((pt, idx) => `${idx ? 'L' : 'M'}${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`).join('');
  const areaD = `${lineD}L${right} ${bottom}L${left} ${bottom}Z`;
  const activeX = coords[activeIndex].x.toFixed(1);

  chart.append(
    svgEl('line', { class: 'elev-sea-line', x1: left, y1: bottom, x2: right, y2: bottom }),
    svgEl('path', { class: 'elev-area', d: areaD }),
    svgEl('path', { class: 'elev-line', d: lineD }),
    svgEl('line', { class: 'elev-cursor', x1: activeX, y1: top - 2, x2: activeX, y2: bottom }),
  );

  for (const pt of coords) {
    const current = pt.idx === activeIndex;
    const dot = svgEl('circle', {
      class: current ? 'elev-dot is-current' : 'elev-dot',
      cx: pt.x.toFixed(1),
      cy: pt.y.toFixed(1),
      r: current ? '3.6' : '2.1',
    });
    dot.append(svgEl('title', {}, `${pt.item.name}: ${stopMetrics[pt.item.id]?.terrain ?? ''}`));
    dot.addEventListener('click', () => select(pt.idx));
    chart.append(dot);
  }

  const labels = html('div', 'elev-axis');
  labels.setAttribute('aria-hidden', 'true');
  labels.append(
    html('span', '', 'Sardis'),
    html('span', '', 'Peak ~2,200 m (Theches)'),
    html('span', '', 'Pergamum'),
  );

  card.append(pills, chart, labels);
  return card;
}

function buildFiguresSection(stopId, select) {
  const ids = stopFigures[stopId];
  if (!ids?.length) return null;

  const section = html('div', 'reader-figures');
  const heading = html('span', 'figures-heading', 'Key figures');
  const chips = html('div', 'figure-chips');
  const detail = html('div', 'figure-bio');
  detail.hidden = true;
  let openId = null;

  const buttons = new Map();
  for (const id of ids) {
    const person = figures[id];
    if (!person) continue;
    const btn = html('button', `figure-chip faction-${person.faction.toLowerCase()}`);
    btn.type = 'button';
    btn.setAttribute('aria-pressed', 'false');
    btn.append(html('span', 'figure-dot'), html('span', '', person.name));
    btn.addEventListener('click', () => {
      const same = openId === id;
      openId = same ? null : id;
      for (const [k, b] of buttons) b.setAttribute('aria-pressed', String(k === openId));
      if (!openId) {
        detail.hidden = true;
        return;
      }
      const appears = stops
        .map((s, idx) => ({ s, idx }))
        .filter(({ s }) => stopFigures[s.id]?.includes(id));
      const head = html('div', 'figure-bio-head');
      head.append(html('strong', '', person.name), html('span', 'figure-role', `${person.faction} · ${person.role}`));
      const stopsRow = html('div', 'figure-stops');
      stopsRow.append(html('span', 'figure-stops-label', 'Appears at:'));
      for (const { s, idx } of appears) {
        const jump = html('button', s.id === stopId ? 'figure-stop-link is-here' : 'figure-stop-link', s.name);
        jump.type = 'button';
        jump.addEventListener('click', () => select(idx));
        stopsRow.append(jump);
      }
      detail.replaceChildren(head, html('p', '', person.bio), stopsRow, link(person.cite, person.source));
      detail.hidden = false;
    });
    buttons.set(id, btn);
    chips.append(btn);
  }
  section.append(heading, chips, detail);
  return section;
}

export function createSceneReader(dialog, {
  index, select, pause, fallbackFocus, onLayout, isAltRoute, onToggleAltRoute,
}) {
  const readerFigure = dialog.querySelector('figure');
  const readerImage = dialog.querySelector('img');
  const readerCaption = dialog.querySelector('figcaption');
  const readerRegion = dialog.querySelector('#scene-viewer-region');
  const readerTitle = dialog.querySelector('h2');
  const readerLead = dialog.querySelector('#scene-viewer-lead');
  const readerCopy = dialog.querySelector('#scene-viewer-copy');
  const readerPrevious = dialog.querySelector('#reader-previous');
  const readerNext = dialog.querySelector('#reader-next');
  const readerExpand = dialog.querySelector('#reader-expand');
  const readerCopyLink = dialog.querySelector('#reader-copy-link');
  const desktop = matchMedia('(min-width: 52.01rem) and (min-height: 30.01rem), (min-width: 70.01rem)');
  let opener;
  let restoreOnClose = true;
  let renderedIndex;
  readerTitle.tabIndex = -1;

  function syncExpandButton() {
    if (!readerExpand) return;
    const isSheet = dialog.dataset.presentation === 'sheet';
    readerExpand.hidden = !isSheet;
    const expanded = dialog.dataset.expanded === 'true';
    readerExpand.setAttribute('aria-pressed', String(expanded));
    readerExpand.textContent = expanded ? 'Map view' : 'Full view';
  }

  function notifyLayout() {
    const sideOpen = dialog.open && dialog.dataset.presentation === 'side';
    const halfSheet = dialog.open && dialog.dataset.presentation === 'sheet' && dialog.dataset.expanded !== 'true';
    onLayout(sideOpen, halfSheet);
  }

  function render(i, force = false) {
    if (i === renderedIndex && !force) return;
    renderedIndex = i;
    const stop = stops[i];
    const scene = scenes[stop.id];
    readerRegion.textContent = placeAndBook(stop) + ' · ' + formatStopDate(stop);
    readerTitle.textContent = stop.name;
    readerFigure.dataset.surface = scene.surface ?? (scene.mount ? 'mount' : 'bleed');
    if (scene.mount) readerFigure.style.setProperty('--scene-mount', scene.mount);
    else readerFigure.style.removeProperty('--scene-mount');
    readerImage.src = `./assets/${scene.file}`;
    readerImage.alt = scene.alt;
    const objectMetadata = [scene.imageKind, scene.objectDate].filter(Boolean);
    const caption = html('span', '', scene.caption);
    if (objectMetadata.length) {
      readerCaption.replaceChildren(html('span', 'image-kind', objectMetadata.join(' · ')), caption);
    } else {
      readerCaption.replaceChildren(caption);
    }
    const chapter = journeyChapters[stop.phase];
    const startsChapter = chapter && stops[i - 1]?.phase !== stop.phase;
    const opening = stop.id === 'sardis' ? expeditionContext : startsChapter ? {
      title: chapter.title,
      text: chapter.synopsis,
      source: chapter.source,
      sourceLabel: `Read Xenophon ${chapter.book}`,
    } : null;
    const context = sceneContext[stop.id];
    const hasBackstory = opening || context || stop.whyItMatters;
    const lead = hasBackstory && stop.detail.match(/^(.+?[.!?]) (.+)$/);
    readerLead.replaceChildren(html('h3', '', stop.title), html('p', '', stop.summary));
    if (lead) readerLead.append(html('p', '', lead[1]));

    const quote = stop.id === 'mount-theches' ? null : primaryQuotes[stop.id];
    if (quote) {
      const block = html('blockquote', 'reader-quote');
      const cite = html('cite', '', 'Xenophon, ');
      cite.append(html('i', '', 'Anabasis'), ` ${quote.cite}`);
      block.append(html('p', '', `“${quote.text}”`), cite);
      readerLead.append(block);
    }

    if (onToggleAltRoute && (stop.id === 'mount-theches' || stop.id === 'armenian-highlands')) {
      const toggle = html('button', 'alt-route-toggle');
      toggle.type = 'button';
      const syncAlt = () => {
        const active = Boolean(isAltRoute?.());
        toggle.setAttribute('aria-pressed', String(active));
        toggle.textContent = active ? 'Hide eastern route hypothesis' : 'Compare eastern route hypothesis';
      };
      syncAlt();
      toggle.addEventListener('click', () => {
        onToggleAltRoute();
        syncAlt();
      });
      readerLead.append(toggle);
    }

    const telemetry = buildElevationCard(i, nextIdx => {
      select(nextIdx);
      readerTitle.focus({ preventScroll: true });
    });
    if (telemetry) readerLead.append(telemetry);

    const cast = buildFiguresSection(stop.id, nextIdx => {
      select(nextIdx);
      readerTitle.focus({ preventScroll: true });
    });
    if (cast) readerLead.append(cast);

    const backstory = html('details', 'reader-backstory');
    backstory.append(noteSummary(hasBackstory ? 'Backstory' : 'More about this stop', (context ?? opening)?.title));
    const content = html('div', 'reader-backstory-copy');
    if (opening) content.append(contextNote(opening));
    content.append(html('p', '', lead ? lead[2] : stop.detail));
    if (stop.whyItMatters) content.append(html('p', 'reader-takeaway', stop.whyItMatters));
    if (context) content.append(contextNote(context));
    backstory.append(content);
    readerCopy.replaceChildren(backstory, passageNotes(stop, scene));
    readerPrevious.disabled = i === 0;
    readerNext.disabled = i === stops.length - 1;
    dialog.scrollTop = 0;
  }

  function isSideOpen() {
    return dialog.open && dialog.dataset.presentation === 'side';
  }

  function isHalfSheetOpen() {
    return dialog.open && dialog.dataset.presentation === 'sheet' && dialog.dataset.expanded !== 'true';
  }

  function show() {
    dialog.dataset.presentation = desktop.matches ? 'side' : 'sheet';
    if (!desktop.matches && !dialog.dataset.expanded) dialog.dataset.expanded = 'false';
    syncExpandButton();
    if (desktop.matches) dialog.show();
    else dialog.showModal();
    notifyLayout();
  }

  function close(restoreFocus = true) {
    if (!dialog.open) return;
    restoreOnClose = restoreFocus;
    dialog.close();
  }

  function step(delta) {
    const next = index() + delta;
    if (!stops[next]) return;
    select(next);
    readerTitle.focus({ preventScroll: true });
  }

  readerExpand?.addEventListener('click', () => {
    dialog.dataset.expanded = dialog.dataset.expanded === 'true' ? 'false' : 'true';
    syncExpandButton();
    notifyLayout();
  });
  readerCopyLink?.addEventListener('click', async () => {
    try {
      await navigator.clipboard?.writeText(location.href);
      readerCopyLink.textContent = 'Copied';
      setTimeout(() => { readerCopyLink.textContent = 'Link'; }, 1500);
    } catch {
      readerCopyLink.textContent = 'Link';
    }
  });
  readerPrevious.addEventListener('click', () => step(-1));
  readerNext.addEventListener('click', () => step(1));
  dialog.addEventListener('close', () => {
    if (dialog.open) return;
    notifyLayout();
    if (restoreOnClose) {
      const target = opener?.isConnected && opener.getClientRects().length ? opener : fallbackFocus();
      target.focus({ preventScroll: true });
    }
    restoreOnClose = true;
  });
  dialog.addEventListener('click', event => {
    if (isSideOpen() || event.target !== dialog) return;
    const box = dialog.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right
      || event.clientY < box.top || event.clientY > box.bottom) close();
  });
  dialog.addEventListener('keydown', event => {
    if (!event.defaultPrevented && event.key === 'Escape' && isSideOpen()) {
      event.preventDefault();
      close();
    }
  });
  desktop.addEventListener('change', () => {
    if (!dialog.open) return;
    dialog.close();
    show();
  });

  return {
    open(trigger) {
      pause();
      opener = trigger;
      restoreOnClose = true;
      if (!desktop.matches) dialog.dataset.expanded = 'false';
      render(index(), true);
      if (!dialog.open) show();
      else {
        syncExpandButton();
        notifyLayout();
      }
      dialog.scrollTop = 0;
      readerTitle.focus({ preventScroll: true });
    },
    update(i) {
      if (dialog.open) render(i);
    },
    refresh() {
      if (dialog.open) render(index(), true);
    },
    isSideOpen,
    isHalfSheetOpen,
    close,
  };
}
