import { ALLOWED } from '../js/local/negotiations.js';

var expected = {
  interest: ['negotiating', 'closed'],
  negotiating: ['agreed_buyer', 'closed'],
  agreed_buyer: ['pending_seller', 'closed'],
  pending_seller: ['matched', 'closed'],
  matched: ['closed'],
  closed: [],
};

var keys = Object.keys(expected);
for (var i = 0; i < keys.length; i++) {
  var k = keys[i];
  if (!ALLOWED[k]) {
    console.error('FAIL missing state', k);
    process.exit(1);
  }
  var a = ALLOWED[k].slice().sort().join(',');
  var b = expected[k].slice().sort().join(',');
  if (a !== b) {
    console.error('FAIL ALLOWED drift on', k, 'got', ALLOWED[k], 'expected', expected[k]);
    process.exit(1);
  }
}
if (Object.keys(ALLOWED).length !== keys.length) {
  console.error('FAIL extra states in ALLOWED', Object.keys(ALLOWED));
  process.exit(1);
}
console.log('PASS negotiation-allowed-freeze.test.js');
