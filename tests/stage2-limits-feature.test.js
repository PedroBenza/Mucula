import { MAX_ACTIVE_LISTINGS, MAX_LISTINGS_PER_DAY, MAX_ACTIVE_DEMANDS } from '../js/local/limits.js';
import { FEATURE_PLANS, getPlan } from '../js/local/feature-plans.js';
import { track, listEvents, countEvents } from '../js/local/telemetry.js';

var mem = {};
globalThis.localStorage = {
  getItem: function (k) { return mem[k] || null; },
  setItem: function (k, v) { mem[k] = String(v); },
};

function assert(c, m) {
  if (!c) throw new Error(m);
}

assert(MAX_ACTIVE_LISTINGS === 15, 'active 15');
assert(MAX_LISTINGS_PER_DAY === 5, 'day 5');
assert(MAX_ACTIVE_DEMANDS === 8, 'demands 8');
assert(getPlan('24h').priceKz === 1500, '1500');
assert(getPlan('3d').priceKz === 3500, '3500');
assert(getPlan('7d').priceKz === 7000, '7000');
assert(FEATURE_PLANS.length === 3, '3 plans');

track('listing_create', { id: 'x' });
track('listing_feature_start', { plan: '24h' });
assert(listEvents(10).length >= 2, 'events');
assert(countEvents('listing_create') >= 1, 'count');

console.log('PASS stage2-limits-feature.test.js');
