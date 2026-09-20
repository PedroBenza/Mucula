import { matchDemandToListingsLimited } from '../js/domain/match-demand.js';

function assert(c, m) {
  if (!c) throw new Error(m);
}

var demand = {
  title: 'Gás',
  category: 'gas',
  neighborhood: 'Cazenga',
  budgetMax: 10000,
};
var listings = [
  {
    _id: 'g1',
    title: 'Botija',
    category: 'gas',
    price: 6500,
    status: 'disponivel',
    location: { neighborhood: 'Cazenga' },
  },
  {
    _id: 'g2',
    title: 'Cara',
    category: 'gas',
    price: 50000,
    status: 'disponivel',
    location: { neighborhood: 'Cazenga' },
  },
];
var m = matchDemandToListingsLimited(demand, listings, 8);
assert(m.length === 1 && m[0]._id === 'g1', 'only real matches');
assert(matchDemandToListingsLimited(demand, [], 8).length === 0, 'empty honest');
console.log('PASS minguito-demand.test.js');
