import { connectPopover } from './popover.mjs';

const choices = [
  { id: 'greek', label: 'GFS Didot / Commissioner', fonts: ['400 2rem "GFS Didot"', '650 1rem Commissioner'] },
  { id: 'scholar', label: 'Old Standard TT / Sofia Sans', fonts: ['400 2rem "Old Standard TT"', 'italic 400 1rem "Old Standard TT"', '650 1rem "Sofia Sans"'] },
  { id: 'current', label: 'Instrument Serif / System', fonts: ['400 2rem "Instrument Serif"'] },
];

const styles = document.createElement('link');
styles.rel = 'stylesheet';
styles.href = './type-preview.css?v=8';
document.head.append(styles);

const trigger = document.createElement('button');
trigger.type = 'button';
trigger.className = 'type-preview-trigger';
trigger.setAttribute('aria-label', 'Type preview');
trigger.setAttribute('aria-controls', 'type-preview-panel');
trigger.setAttribute('aria-expanded', 'false');
trigger.textContent = 'Type';

const panel = document.createElement('fieldset');
panel.id = 'type-preview-panel';
panel.className = 'type-preview-panel';
panel.hidden = true;
const legend = document.createElement('legend');
legend.textContent = 'Typography preview';
panel.append(legend);
for (const choice of choices) {
  const label = document.createElement('label');
  const input = document.createElement('input');
  input.type = 'radio';
  input.name = 'atlas-type-preview';
  input.value = choice.id;
  label.append(input, choice.label);
  panel.append(label);
}
document.querySelector('.site-nav').prepend(trigger);
document.body.append(panel);

function refreshAtlas() {
  document.dispatchEvent(new Event('atlas:type-preview'));
}

function select(choice, writeUrl = true) {
  const root = document.documentElement;
  root.dataset.typeface = choice.id;
  panel.querySelector('input[value="' + choice.id + '"]').checked = true;
  if (writeUrl) {
    const url = new URL(location.href);
    url.searchParams.set('type', choice.id);
    history.replaceState(history.state, '', url);
  }
  refreshAtlas();
  Promise.allSettled(choice.fonts.map(spec => document.fonts.load(spec))).then(() => {
    if (root.dataset.typeface === choice.id) refreshAtlas();
  });
}

connectPopover(trigger, panel, ':checked');
panel.addEventListener('change', event => {
  const choice = choices.find(item => item.id === event.target.value);
  if (choice) select(choice);
});
const requested = new URL(location.href).searchParams.get('type');
const initial = choices.find(choice => choice.id === requested) ?? choices[0];
styles.addEventListener('load', () => select(initial, false), { once: true });
