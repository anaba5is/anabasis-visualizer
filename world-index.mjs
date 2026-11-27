import { worldViews } from './world-sites.mjs';

const kinds = {
  territory: 'Approximate territory',
  polity: 'Political center',
  site: 'Archaeological site',
  community: 'Community or cultural region',
};

function node(tag, text) {
  const element = document.createElement(tag);
  if (text) element.textContent = text;
  return element;
}

export function renderWorldIndex(container, entries, onLocate) {
  const sections = document.createDocumentFragment();
  for (const view of worldViews) {
    const matches = entries.filter(entry => entry.group === view.id)
      .sort((a, b) => a.name.localeCompare(b.name));
    if (!matches.length) continue;
    const details = node('details');
    details.append(node('summary', view.name + ' (' + matches.length + ')'));
    const list = node('ul');
    for (const entry of matches) {
      const row = node('li');
      const heading = node('h3', entry.name);
      const kind = node('p', kinds[entry.kind]);
      kind.className = 'world-entry-kind';
      const locate = node('button', 'Show on globe');
      locate.type = 'button';
      locate.setAttribute('aria-label', 'Show ' + entry.name + ' on the globe');
      locate.addEventListener('click', () => onLocate(entry));
      const citation = node('a', 'Source');
      citation.href = entry.source;
      const actions = node('div');
      actions.className = 'world-entry-actions';
      actions.append(locate, citation);
      row.append(heading, kind, node('p', entry.note), actions);
      list.append(row);
    }
    details.append(list);
    sections.append(details);
  }
  container.replaceChildren(sections);
}
