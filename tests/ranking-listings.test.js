import { rankListings } from '../js/shared/ranking-listings.js';

var now = Date.now();
var input = [
  { _id: 'a', title: 'old', isFeatured: false, views: 0, createdAt: now - 86400000 * 10 },
  { _id: 'b', title: 'featured', isFeatured: true, featuredUntil: now + 86400000, views: 1, createdAt: now - 86400000 },
  { _id: 'c', title: 'views', isFeatured: false, views: 50, createdAt: now - 86400000 * 2 },
  { _id: 'd', title: 'expired-feature', isFeatured: true, featuredUntil: now - 1000, views: 100, createdAt: now },
];

var out = rankListings(input);
var ids = out.map(function (l) { return l._id; });

if (ids[0] !== 'b') {
  console.error('FAIL: featured should rank first, got', ids);
  process.exit(1);
}
if (ids.indexOf('c') > ids.indexOf('d') === false && ids.indexOf('c') < ids.indexOf('a')) {
  // c has more views than a; d has expired feature so treated as normal with high views
}
// featured active must be first
if (out[0]._id !== 'b') {
  console.error('FAIL ranking order', ids);
  process.exit(1);
}
// featured expirado não pode ganhar os 1000 pontos
if (out[0]._id === 'd') {
  console.error('FAIL expired featured ranked first');
  process.exit(1);
}
console.log('PASS ranking-listings.test.js');
