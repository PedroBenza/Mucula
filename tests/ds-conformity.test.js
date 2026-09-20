/**
 * Blindagem Design System — conformidade etapas 1–3
 * Corre com: node tests/ds-conformity.test.js
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
let fails = 0;
function ok(name, cond, detail) {
  if (cond) console.log('PASS', name);
  else {
    fails++;
    console.log('FAIL', name, detail || '');
  }
}

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}
function walk(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (e.name.endsWith('.js')) acc.push(p);
  }
  return acc;
}

const index = read('index.html');
ok('tokens linked', index.includes('css/tokens.css'));
ok('actions linked', index.includes('design-system/actions.css'));
ok('type-surface linked', index.includes('design-system/type-surface.css'));
ok('states linked', index.includes('design-system/states.css'));

const tokens = read('css/tokens.css');
ok('space scale', /--mc-space-1:/.test(tokens) && /--mc-space-8:/.test(tokens));
ok('focus ring', /--mc-focus-ring:/.test(tokens));
ok('accent', /--mc-accent:/.test(tokens));
ok('reduced motion', /prefers-reduced-motion/.test(tokens));

const actions = read('css/design-system/actions.css');
ok('primary btn', /\.mc-btn-primary/.test(actions));
ok('mc-action', /\.mc-action\s*\{/.test(actions));
ok('mc-action--back', /\.mc-action--back/.test(actions));
ok('mc-action-row', /\.mc-action-row/.test(actions));

const surface = read('css/design-system/type-surface.css');
ok('list-item', /\.mc-list-item/.test(surface));
ok('empty', /\.mc-empty/.test(surface));
ok('card', /\.mc-card\s*\{/.test(surface));

const states = read('css/design-system/states.css');
ok('focus-visible', /:focus-visible/.test(states));
ok('states reduced motion', /prefers-reduced-motion/.test(states));

const icons = read('js/components/icons.js');
ok('backButtonHtml', /export function backButtonHtml/.test(icons));
ok('back has svg', /<svg/.test(icons) && /Voltar/.test(icons));

const copy = read('js/constants/copy.js');
ok('Fluxo', /tabFlows:\s*'Fluxo'/.test(copy));
ok('Acordo confirmado', /stateMatched:\s*'Acordo confirmado'/.test(copy));
ok('Negociar state', /stateNegotiating:\s*'Negociar'/.test(copy));
ok('Acompanhar actividade', /headerFlows:\s*'Acompanhar actividade'/.test(copy));

const jsFiles = walk(path.join(root, 'js'));
let ghost = 0;
let rawVoltar = 0;
for (const f of jsFiles) {
  const c = fs.readFileSync(f, 'utf8');
  if (c.includes('mc-btn-ghost')) ghost++;
  // raw Voltar button without backButtonHtml only if class action--back with just text - allow backButtonHtml
  if (/mc-action--back"[^>]*>Voltar</.test(c) || /mc-action--back'>Voltar</.test(c)) {
    if (!f.includes('icons.js')) rawVoltar++;
  }
}
ok('zero mc-btn-ghost', ghost === 0, 'files=' + ghost);
ok('Voltar via helper (no bare text-only in features)', rawVoltar === 0, 'count=' + rawVoltar);

const act = read('js/features/activities/activities.js');
ok('fluxo empty', /mc-fx-empty|mc-empty/.test(act));
ok('fluxo structured', /mc-fx|mc-card/.test(act));
ok('fluxo confirm acordo', /confirmMatch|Confirmar acordo/.test(act) || /COPY\.confirmMatch/.test(act));

const comb = read('js/features/negotiation/combinamos.js');
ok('combinamos keeps card unit', /mc-card/.test(comb));
ok('combinamos uses backButtonHtml', /backButtonHtml/.test(comb));

if (fails) {
  console.log('RESULT FAIL', fails);
  process.exit(1);
}
console.log('RESULT PASS ds-conformity');
