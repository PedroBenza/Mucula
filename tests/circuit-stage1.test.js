import { openNegotiation, advanceAsBuyer, confirmAsSeller, getNegotiation } from '../js/local/negotiations.js';
import { createDemand, getDemand } from '../js/local/demands.js';
import { createDemandOffer, listOffersForDemand } from '../js/local/demand-offers.js';

var mem = {};
globalThis.localStorage = {
  getItem: function (k) { return mem[k] || null; },
  setItem: function (k, v) { mem[k] = String(v); },
};

function assert(c, m) {
  if (!c) throw new Error(m);
}

// Circuit listing: buyer interest → advance → seller match
var n = openNegotiation({ listingId: 'list-x', buyerId: 'buyer', sellerId: 'seller' });
advanceAsBuyer(n.id, 'buyer');
confirmAsSeller(n.id, 'seller');
assert(getNegotiation(n.id).state === 'matched', 'circuit listing');

// Circuit demand: buyer demand, seller offer opens neg
var d = createDemand(
  { title: 'Gás', category: 'gas', neighborhood: 'Rangel', budgetMax: 10000 },
  'buyer'
);
// demand-offers needs getDemand + listings for opps not required for createDemandOffer
var off = createDemandOffer({
  demandId: d.id,
  sellerId: 'seller',
  listingId: 'list-gas',
  message: 'Tenho botija',
});
assert(off.demandId === d.id, 'offer');
assert(listOffersForDemand(d.id).length === 1, 'offer listed');

console.log('PASS circuit-stage1.test.js');
