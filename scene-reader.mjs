import { journeyChapters, stops } from './story.mjs';
import { scenes } from './scenes.mjs';
import { html, link } from './dom.mjs';

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

export function createSceneReader(dialog, { index, select, pause, fallbackFocus }) {
  const readerImage = dialog.querySelector('img');
  const readerCaption = dialog.querySelector('figcaption');
  const readerRegion = dialog.querySelector('#scene-viewer-region');
  const readerTitle = dialog.querySelector('h2');
  const readerCopy = dialog.querySelector('#scene-viewer-copy');
  const readerPrevious = dialog.querySelector('#reader-previous');
  const readerNext = dialog.querySelector('#reader-next');
  let opener;
  readerTitle.tabIndex = -1;

  function render(i) {
    const stop = stops[i];
    const scene = scenes[stop.id];
    readerRegion.textContent = placeAndBook(stop) + ' · ' + formatStopDate(stop);
    readerTitle.textContent = stop.name;
    readerImage.src = `./assets/${scene.file}`;
    readerImage.alt = scene.alt;
    readerCaption.textContent = scene.caption;
    const content = document.createDocumentFragment();
    const chapter = journeyChapters[stop.phase];
    if (chapter && stops[i - 1]?.phase !== stop.phase) {
      const opening = html('section', 'reader-context');
      opening.append(
        html('h3', '', chapter.title),
        html('p', '', chapter.synopsis),
        link(`Read Xenophon ${chapter.book}`, chapter.source),
      );
      content.append(opening);
    }
    content.append(html('h3', '', stop.title), html('p', '', stop.summary), html('p', '', stop.detail));
    if (stop.whyItMatters) content.append(html('p', 'reader-takeaway', stop.whyItMatters));
    content.append(passageNotes(stop, scene));
    readerCopy.replaceChildren(content);
    readerPrevious.disabled = i === 0;
    readerNext.disabled = i === stops.length - 1;
    dialog.scrollTop = 0;
  }

  function step(delta) {
    const next = index() + delta;
    if (!stops[next]) return;
    select(next);
    render(next);
    readerTitle.focus({ preventScroll: true });
  }

  readerPrevious.addEventListener('click', () => step(-1));
  readerNext.addEventListener('click', () => step(1));
  dialog.addEventListener('close', () => {
    const target = opener?.isConnected && opener.getClientRects().length ? opener : fallbackFocus();
    target.focus({ preventScroll: true });
  });
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const box = dialog.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right
      || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
  });

  return {
    open(trigger) {
      pause();
      opener = trigger;
      render(index());
      dialog.showModal();
    },
  };
}
