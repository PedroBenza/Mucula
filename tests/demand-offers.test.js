import { matchDemandToListings } from '../js/domain/match-demand.js';

function findOpps(sellerListings, demands, allListings) {
  var myIds = {};
  sellerListings.forEach(function (l) {
    myIds[l.id || l._id] = l;
  });
  var out = [];
  demands.forEach(function (demand) {
    if (demand.status !== 'active') return;
    var matched = matchDemandToListings(demand, allListings);
    var mine = matched.filter(function (m) {
      return myIds[m._id];
    });
    if (mine.length) out.push({ demand: demand, matchedListings: mine });
  });
  return out;
}

function assert(c, m) {
  if (!c) throw new Error(m);
}

var all = [
  {
    _id: 'mine-1',
    category: 'gas',
    price: 7000,
    status: 'disponivel',
    location: { neighborhood: 'Cazenga' },
    title: 'Botija',
  },
];
var demands = [
  {
    id: 'd1',
    status: 'active',
    authorId: 'buyer',
    category: 'gas',
    neighborhood: 'Cazenga',
    budgetMax: 10000,
    title: 'Gás',
  },
];
var opps = findOpps([{ id: 'mine-1' }], demands, all);
assert(opps.length === 1, 'one opp');
assert(opps[0].matchedListings[0]._id === 'mine-1', 'my listing');
console.log('PASS demand-offers.test.js');
