import {
  openNegotiation,
  transitionNegotiation,
  getNegotiation,
  setProposedPrice,
  advanceAsBuyer,
  confirmAsSeller,
} from '../js/local/negotiations.js';

var mem = {};
globalThis.localStorage = {
  getItem: function (k) {
    return mem[k] || null;
  },
  setItem: function (k, v) {
    mem[k] = String(v);
  },
};

function assert(c, m) {
  if (!c) throw new Error(m);
}

var selfFail = false;
try {
  openNegotiation({ listingId: 'L1', buyerId: 'same', sellerId: 'same' });
} catch (e) {
  selfFail = true;
}
assert(selfFail, 'block self deal');

var n = openNegotiation({ listingId: 'L1', buyerId: 'buyer-1', sellerId: 'seller-1' });
assert(n.state === 'interest', 'interest');
var n2 = openNegotiation({ listingId: 'L1', buyerId: 'buyer-1', sellerId: 'seller-1' });
assert(n2.id === n.id, 'reuse');

advanceAsBuyer(n.id, 'buyer-1');
assert(getNegotiation(n.id).state === 'negotiating', 'buyer advance');

var buyerConfirmFail = false;
try {
  confirmAsSeller(n.id, 'buyer-1');
} catch (e) {
  buyerConfirmFail = true;
}
assert(buyerConfirmFail, 'buyer cannot confirm');

confirmAsSeller(n.id, 'seller-1');
assert(getNegotiation(n.id).state === 'matched', 'seller matched');

var bad = false;
try {
  transitionNegotiation(n.id, 'interest');
} catch (e) {
  bad = true;
}
assert(bad, 'no reverse');

setProposedPrice(
  openNegotiation({ listingId: 'L2', buyerId: 'b2', sellerId: 's2' }).id,
  100
);
console.log('PASS negotiations.test.js');
