import { journeyChapters, stops } from './story.mjs';
import { scenes } from './scenes.mjs';
import { html, link } from './dom.mjs';
import { expeditionContext, sceneContext } from './scene-context.mjs';
import { placeAndBook, formatStopDate } from './journey-format.mjs';

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

export function createSceneReader(dialog, { index, select, pause, fallbackFocus, onLayout }) {
  const readerImage = dialog.querySelector('img');
  const readerCaption = dialog.querySelector('figcaption');
  const readerRegion = dialog.querySelector('#scene-viewer-region');
  const readerTitle = dialog.querySelector('h2');
  const readerLead = dialog.querySelector('#scene-viewer-lead');
  const readerCopy = dialog.querySelector('#scene-viewer-copy');
  const readerPrevious = dialog.querySelector('#reader-previous');
  const readerNext = dialog.querySelector('#reader-next');
  const desktop = matchMedia('(min-width: 52.01rem) and (min-height: 30.01rem), (min-width: 70.01rem)');
  let opener;
  let restoreOnClose = true;
  let renderedIndex;
  readerTitle.tabIndex = -1;

  function render(i) {
    if (i === renderedIndex) return;
    renderedIndex = i;
    const stop = stops[i];
    const scene = scenes[stop.id];
    readerRegion.textContent = placeAndBook(stop) + ' · ' + formatStopDate(stop);
    readerTitle.textContent = stop.name;
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

  function show() {
    dialog.dataset.presentation = desktop.matches ? 'side' : 'sheet';
    if (desktop.matches) dialog.show();
    else dialog.showModal();
    onLayout(isSideOpen());
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

  readerPrevious.addEventListener('click', () => step(-1));
  readerNext.addEventListener('click', () => step(1));
  dialog.addEventListener('close', () => {
    if (dialog.open) return;
    onLayout(false);
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
      render(index());
      if (!dialog.open) show();
      dialog.scrollTop = 0;
      readerTitle.focus({ preventScroll: true });
    },
    update(i) {
      if (dialog.open) render(i);
    },
    isSideOpen,
    close,
  };
}
