export function makeTimeline(container, stops, phases, onSelect) {
  const colors = new Map(phases.map(phase => [phase.name, phase.timelineColor ?? phase.color]));
  const track = document.createElement('ol');
  track.className = 'route-timeline__track';
  track.setAttribute('aria-label', 'Journey stops');
  track.setAttribute('role', 'list');
  track.style.setProperty('--timeline-count', stops.length);
  container.classList.add('route-timeline');

  const entries = stops.map((stop, index) => {
    const entry = document.createElement('li');
    entry.className = 'route-timeline__entry';
    entry.style.setProperty('--timeline-phase', colors.get(stop.phase) ?? 'var(--rust, #8a402d)');

    const button = document.createElement('button');
    button.className = 'route-timeline__stop';
    button.type = 'button';
    button.tabIndex = -1;
    button.setAttribute('aria-label', `${index + 1} of ${stops.length}, ${stop.name}, ${stop.phase}`);
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

  container.replaceChildren(track);

  function select(index, { reveal = true } = {}) {
    if (!entries[index]) return;

    entries.forEach(({ entry, button }, position) => {
      const isCurrent = position === index;
      button.tabIndex = isCurrent ? 0 : -1;
      entry.classList.toggle('is-complete', position < index);
      if (isCurrent) button.setAttribute('aria-current', 'step');
      else button.removeAttribute('aria-current');
    });

    if (reveal && container.scrollWidth > container.clientWidth) {
      const view = container.getBoundingClientRect();
      const stop = entries[index].button.getBoundingClientRect();
      if (stop.left < view.left || stop.right > view.right) {
        const offset = stop.left - view.left - (container.clientWidth - stop.width) / 2;
        container.scrollLeft += offset;
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
  return { select };
}
