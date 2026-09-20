import { buildTickerItems } from '../js/components/ticker.js';
import { heroFor } from '../js/constants/hero.js';

function assert(c, m) {
  if (!c) throw new Error(m || 'assert');
}

var list = [
  { title: 'iPhone 12', category: 'telemoveis', location: { neighborhood: 'Rangel' } },
  { title: 'Cubículo T3', category: 'imoveis', location: { neighborhood: 'Maianga' } },
  { title: 'Galaxy A14', category: 'telemoveis', location: { neighborhood: 'Rangel' } },
  { title: 'Botija 12kg', category: 'gas', location: { neighborhood: 'Rangel' } },
];

var tel = buildTickerItems('telemoveis', list);
assert(tel.length >= 1, 'tel has lines');
assert(!tel.some(function (x) { return /Cubículo|Botija|imóvel/i.test(x); }), 'no leak imoveis/gas');
assert(tel.every(function (x) { return /iPhone|Galaxy|Telemóvel/i.test(x); }), 'only phones');

var gas = buildTickerItems('gas', list);
assert(!gas.some(function (x) { return /iPhone|Galaxy|Cubículo/i.test(x); }), 'gas isolated');

var empty = buildTickerItems('calcados', list);
assert(empty.length >= 1, 'fallback exists');
assert(empty.every(function (x) { return /Sapato|Calçado|ténis/i.test(x); }), 'fallback only calcados');

var hTel = heroFor('telemoveis');
assert(hTel.image.indexOf('telemoveis') !== -1 || hTel.image.indexOf('categories') !== -1, 'hero tel image');
(hTel.variants || []).forEach(function (v) {
  assert(v.indexOf('imoveis') === -1 && v.indexOf('cubico') === -1, 'hero variant no imoveis');
});

var hIm = heroFor('imoveis');
assert((hIm.image + (hIm.variants || []).join('')).indexOf('telemoveis') === -1, 'imoveis no phones');

console.log('PASS ticker-category-isolation.test.js');
