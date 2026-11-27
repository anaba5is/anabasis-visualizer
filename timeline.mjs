const romanBooks = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];

export function makeTimeline(container, stops, phases, onSelect) {
  const colors = new Map(phases.map(phase => [phase.name, phase.timelineColor ?? phase.color]));
  const viewport = document.createElement('div');
  viewport.className = 'route-timeline__viewport';
  const stage = document.createElement('div');
  stage.className = 'route-timeline__stage';
  stage.style.setProperty('--timeline-count', stops.length);
  const bookBands = document.createElement('div');
  bookBands.className = 'route-timeline__books';
  bookBands.setAttribute('aria-hidden', 'true');
  const track = document.createElement('ol');
  track.className = 'route-timeline__track';
  track.setAttribute('aria-label', 'Journey stops');
  track.setAttribute('role', 'list');
  container.classList.add('route-timeline');

  const books = [];
  const entries = stops.map((stop, index) => {
    const color = colors.get(stop.phase) ?? 'var(--rust, #8a402d)';
    const book = romanBooks[Number.parseInt(stop.book, 10) - 1];
    const previousBook = books.at(-1);
    if (previousBook && previousBook.name === book) previousBook.count++;
    else books.push({ name: book, count: 1, color });

    const entry = document.createElement('li');
    entry.className = 'route-timeline__entry';
    entry.style.setProperty('--timeline-phase', color);
    if (index && stops[index - 1].phase !== stop.phase) entry.classList.add('begins-phase');

    const button = document.createElement('button');
    button.className = 'route-timeline__stop';
    button.type = 'button';
    button.tabIndex = -1;
    const description = `${index + 1} of ${stops.length}, ${stop.name}, ${stop.phase}`;
    button.setAttribute('aria-label', book ? `${description}, Book ${book}` : description);
    button.addEventListener('click', () => onSelect(index));

    const number = document.createElement('span');
    number.className = 'route-timeline__number';
    number.setAttribute('aria-hidden', 'true');
    number.textContent = String(index + 1).padStart(2, '0');

    const dot = document.createElement('span');
    dot.className = 'route-timeline__dot';
    dot.setAttribute('aria-hidden', 'true');

    const name = document.createElement('span');
    name.className = 'route-timeline__name';
    name.textContent = stop.name;

    button.append(number, dot, name);
    entry.append(button);
    track.append(entry);
    return { entry, button };
  });

  for (const book of books) {
    const band = document.createElement('span');
    band.className = 'route-timeline__book';
    band.style.gridColumn = `span ${book.count}`;
    band.style.setProperty('--timeline-phase', book.color);
    band.textContent = book.name ? `Book ${book.name}` : '';
    bookBands.append(band);
  }
  stage.append(bookBands, track);
  viewport.append(stage);

  const scrubber = document.createElement('label');
  scrubber.className = 'route-timeline__scrubber';
  const scrubLabel = document.createElement('span');
  scrubLabel.textContent = 'Scrub route';
  const range = document.createElement('input');
  range.type = 'range';
  range.className = 'route-timeline__range';
  range.min = '1';
  range.max = String(Math.max(1, stops.length));
  range.step = '1';
  range.disabled = stops.length < 2;
  scrubber.hidden = range.disabled;
  scrubber.append(scrubLabel, range);
  container.replaceChildren(viewport, scrubber);

  let selectedIndex = 0;
  let progress = 0;

  function setProgress(fraction) {
    const next = Number.isFinite(fraction) ? Math.min(1, Math.max(0, fraction)) : 0;
    if (next === progress) return;
    progress = next;
    entries[selectedIndex]?.button.style.setProperty('--beat-progress', next);
  }

  range.addEventListener('input', () => {
    const index = range.valueAsNumber - 1;
    if (index !== selectedIndex && entries[index]) onSelect(index);
  });

  function select(index, { reveal = true } = {}) {
    if (!entries[index]) return;
    setProgress(0);
    selectedIndex = index;
    range.value = String(index + 1);
    range.setAttribute('aria-valuetext', `${index + 1} of ${stops.length}, ${stops[index].name}`);

    entries.forEach(({ entry, button }, position) => {
      const isCurrent = position === index;
      button.tabIndex = isCurrent ? 0 : -1;
      entry.classList.toggle('is-complete', position < index);
      if (isCurrent) button.setAttribute('aria-current', 'step');
      else button.removeAttribute('aria-current');
    });

    if (reveal && viewport.scrollWidth > viewport.clientWidth) {
      const view = viewport.getBoundingClientRect();
      const stop = entries[index].button.getBoundingClientRect();
      if (stop.left < view.left || stop.right > view.right) {
        const offset = stop.left - view.left - (viewport.clientWidth - stop.width) / 2;
        viewport.scrollLeft += offset;
      }
    }
  }

  track.addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    const current = entries.findIndex(({ button }) => button === event.target);
    if (current < 0) return;

    let next;
    switch (event.key) {
      case 'ArrowLeft': next = Math.max(0, current - 1); break;
      case 'ArrowRight': next = Math.min(entries.length - 1, current + 1); break;
      case 'Home': next = 0; break;
      case 'End': next = entries.length - 1; break;
      default: return;
    }

    event.preventDefault();
    if (next === current) return;
    entries[next].button.focus({ preventScroll: true });
    onSelect(next);
  });

  select(0, { reveal: false });
  return { select, setProgress };
}
