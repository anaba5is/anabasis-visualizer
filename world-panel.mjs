import { readAtlasLocation, writeAtlasLocation } from './atlas-location.mjs';
import { politicalRegions } from './historical-data.mjs';
import { renderWorldIndex } from './world-index.mjs';
import { worldViews } from './world-sites.mjs';

export function connectWorldPanel({ onLayerReady, onFocus, onBrowse, onReturn }) {
  const picker = document.querySelector('#world-view');
  const index = document.querySelector('#world-index');
  const panel = document.querySelector('#world-focus-card');
  const title = panel.querySelector('h2');
  const note = panel.querySelector('p');
  const source = panel.querySelector('a');
  const entriesById = new Map();

  function activate(entry, type, updateHash = true) {
    const outline = entry.kind === 'territory';
    const zoom = type === 'world' ? entry.scale : outline && entry.areaKm2 < 35000 ? 1.25 : .55;
    title.textContent = entry.name;
    note.textContent = entry.note ?? 'Explore the historical layer around 401 BCE.';
    source.hidden = !entry.source;
    if (entry.source) source.href = entry.source;
    panel.hidden = false;
    if (updateHash) history.replaceState(null, '', writeAtlasLocation(type, entry.id));
    onFocus(entry, zoom);
  }

  function syncFromHash() {
    const target = readAtlasLocation(location.hash);
    if (target?.type === 'world') {
      const view = worldViews.find(item => item.id === target.id);
      if (view) activate(view, 'world', false);
    }
    if (target?.type === 'place') {
      const entry = entriesById.get(target.id);
      if (entry) activate(entry, 'place', false);
    }
  }

  for (const view of worldViews) {
    const option = document.createElement('option');
    option.textContent = view.name;
    option.value = view.id;
    picker.append(option);
  }
  picker.addEventListener('change', () => {
    const view = worldViews.find(item => item.id === picker.value);
    if (!view) return;
    picker.value = '';
    activate(view, 'world');
  });

  document.querySelector('#open-world-index').addEventListener('click', onBrowse);
  panel.querySelector('button').addEventListener('click', onReturn);

  import('./world-history.mjs').then(({ worldRegions, worldSiteRecords }) => {
    const expeditionPolities = politicalRegions.map(region => ({
      ...region,
      kind: 'territory',
      group: region.id === 'achaemenid-empire' ? 'west-asia' : 'europe',
    }));
    const entries = [...expeditionPolities, ...worldRegions, ...worldSiteRecords];
    for (const entry of entries) entriesById.set(entry.id, entry);
    renderWorldIndex(index, entries, entry => activate(entry, 'place'));
    onLayerReady(worldRegions, worldSiteRecords);
    if (readAtlasLocation(location.hash)?.type === 'place') syncFromHash();
  }).catch(error => {
    index.textContent = 'World geography could not load. Reload to try again.';
    console.error('World geography could not load', error);
  });

  if (readAtlasLocation(location.hash)?.type === 'world') syncFromHash();
  return {
    syncFromHash,
    hide: () => { panel.hidden = true; },
    selectById(id) {
      const entry = entriesById.get(id);
      if (entry) activate(entry, 'place');
    },
  };
}
