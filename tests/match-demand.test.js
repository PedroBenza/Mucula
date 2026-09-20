import {
  matchDemandToListings,
  matchDemandTiers,
  classifyListingAgainstDemand,
  normalizeNeighborhood,
  BUDGET_FACTOR_NEAR,
} from '../js/domain/match-demand.js';

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

var listings = [
  {
    _id: 'a',
    title: 'Solda usada',
    category: 'electrodomesticos',
    price: 140000,
    status: 'disponivel',
    location: { neighborhood: 'Cazenga' },
    createdAt: 3,
  },
  {
    _id: 'b',
    title: 'Solda cara',
    category: 'electrodomesticos',
    price: 160000,
    status: 'disponivel',
    location: { neighborhood: 'Cazenga' },
    createdAt: 2,
  },
  {
    _id: 'c',
    title: 'Solda outro bairro',
    category: 'electrodomesticos',
    price: 100000,
    status: 'disponivel',
    location: { neighborhood: 'Viana' },
    createdAt: 4,
  },
  {
    _id: 'd',
    title: 'Gás',
    category: 'gas',
    price: 6500,
    status: 'disponivel',
    location: { neighborhood: 'Cazenga' },
    createdAt: 5,
  },
];

var demand = {
  title: 'Máquina de solda',
  category: 'electrodomesticos',
  neighborhood: 'Cazenga',
  budgetMax: 150000,
};

assert(normalizeNeighborhood('  Cazenga ') === 'cazenga', 'normalize');
assert(BUDGET_FACTOR_NEAR === 1.15, 'factor');
assert(classifyListingAgainstDemand(demand, listings[0]) === 'exact', 'a exact');
assert(classifyListingAgainstDemand(demand, listings[1]) === 'near', 'b near budget');
assert(classifyListingAgainstDemand(demand, listings[2]) === 'near', 'c near nb');
assert(classifyListingAgainstDemand(demand, listings[3]) === null, 'gas out');

var tiers = matchDemandTiers(demand, listings);
assert(tiers.exact.length === 1 && tiers.exact[0]._id === 'a', 'exact list');
assert(tiers.near.length === 2, 'near list');

var m = matchDemandToListings(demand, listings);
assert(m.length === 3, 'combined');

console.log('PASS match-demand.test.js');
