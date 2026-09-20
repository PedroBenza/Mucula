import { createDemand, getDemand, listDemands } from '../js/local/demands.js';

var mem = {};
globalThis.localStorage = {
  getItem: function (k) { return mem[k] || null; },
  setItem: function (k, v) { mem[k] = String(v); },
};

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

var d = createDemand(
  { title: 'Máquina de solda', category: 'electrodomesticos', neighborhood: 'Cazenga', budgetMax: '150000' },
  'user-1'
);
assert(d.id.indexOf('demand-') === 0, 'id prefix');
assert(d.title === 'Máquina de solda', 'title');
assert(d.budgetMax === 150000, 'budget number');
assert(getDemand(d.id).category === 'electrodomesticos', 'get');
assert(listDemands('user-1').length === 1, 'list author');
assert(listDemands('other').length === 0, 'list other');

var threw = false;
try {
  createDemand({ title: '', category: 'gas' }, 'user-1');
} catch (e) {
  threw = true;
}
assert(threw, 'title required');

console.log('PASS demands-store.test.js');
