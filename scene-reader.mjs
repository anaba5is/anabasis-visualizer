import { journeyChapters, stops } from './story.mjs';
import { scenes } from './scenes.mjs';
import { html, link } from './dom.mjs';
import { expeditionContext, sceneContext } from './scene-context.mjs';

export function bookFor(stop) {
  return ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'][Number(stop.book[0]) - 1];
}

export function placeAndBook(stop) {
  return `${stop.region} · Book ${bookFor(stop)}`;
}

export function formatStopDate(stop) {
  return stop.date.startsWith('Winter ') ? stop.date : 'c. ' + stop.date;
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
    html('summary', '', 'Passages & image credit'),
    html('p', '', `Location ${stop.certainty.toLowerCase()}`),
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
    readerLead.replaceChildren(html('h3', '', stop.title), html('p', '', stop.summary));
    const backstory = html('details', 'reader-backstory');
    backstory.append(html('summary', '', 'Backstory'));
    const content = html('div', 'reader-backstory-copy');
    const chapter = journeyChapters[stop.phase];
    if (stop.id === 'sardis') {
      content.append(contextNote(expeditionContext));
    } else if (chapter && stops[i - 1]?.phase !== stop.phase) {
      content.append(contextNote({
        title: chapter.title,
        text: chapter.synopsis,
        source: chapter.source,
        sourceLabel: `Read Xenophon ${chapter.book}`,
      }));
    }
    content.append(html('p', '', stop.detail));
    if (stop.whyItMatters) content.append(html('p', 'reader-takeaway', stop.whyItMatters));
    const context = sceneContext[stop.id];
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
