import { MAX_ACTIVE_LISTINGS, MAX_LISTINGS_PER_DAY, MAX_ACTIVE_DEMANDS } from '../js/local/limits.js';
import { FEATURE_PLANS } from '../js/local/feature-plans.js';
import { track, countEvents } from '../js/local/telemetry.js';

var mem = {};
globalThis.localStorage = {
  getItem: function (k) { return mem[k] != null ? mem[k] : null; },
  setItem: function (k, v) { mem[k] = String(v); },
  removeItem: function (k) { delete mem[k]; },
};

function assert(c, m) {
  if (!c) throw new Error(m || 'assert');
}

assert(MAX_ACTIVE_LISTINGS === 15, '15');
assert(MAX_LISTINGS_PER_DAY === 5, '5');
assert(MAX_ACTIVE_DEMANDS === 8, '8');
assert(FEATURE_PLANS.length === 3, 'plans');
assert(FEATURE_PLANS[0].priceKz + FEATURE_PLANS[1].priceKz + FEATURE_PLANS[2].priceKz === 1500 + 3500 + 7000, 'prices');

track('demand_match_shown', { n: 2 });
track('negotiation_matched', { id: 'n1' });
assert(countEvents('demand_match_shown') >= 1, 'match shown');
assert(countEvents('negotiation_matched') >= 1, 'matched');

// snapshot module (imports store — needs minimal seed keys)
mem['mc_local_seed_version'] = '8';
mem['mc_local_listings'] = JSON.stringify([
  { _id: 't1', authorId: 'u1', status: 'disponivel', createdAt: Date.now() },
  { _id: 't2', authorId: 'u1', status: 'disponivel', createdAt: Date.now() },
]);
mem['mc_local_demands'] = JSON.stringify([
  { id: 'd1', authorId: 'u1', status: 'active', title: 'x', category: 'gas' },
]);

var mod = await import('../js/local/pilot-economy.js');
var snap = mod.getPilotSnapshot('u1');
assert(snap.listings.active === 2, 'active count');
assert(snap.listings.activeMax === 15, 'max');
assert(snap.listings.activeLeft === 13, 'left');
assert(snap.demands.active === 1, 'demands');
assert(snap.featurePlans.length === 3, 'plans in snap');
assert(typeof mod.formatPilotQuotaLine(snap) === 'string', 'line');

console.log('PASS pilot-economy.test.js');
