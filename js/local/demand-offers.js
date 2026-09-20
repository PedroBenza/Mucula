import { listDemands, getDemand } from './demands.js';
import { localMyListings, localGetListings } from './store.js';
import { filterOnMarket, isListingOnMarket } from '../domain/listing-market.js';
import { matchDemandToListings, matchDemandTiers, classifyListingAgainstDemand } from '../domain/match-demand.js';
import { openNegotiation } from './negotiations.js';
import { track } from './telemetry.js';

var KEY = 'mc_local_demand_offers';

function read() {
  try {
    var raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return [];
}

function write(list) {
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function listOffersForDemand(demandId) {
  return read().filter(function (o) {
    return o.demandId === demandId && o.status !== 'withdrawn';
  });
}

export function listOffersBySeller(sellerId) {
  return read().filter(function (o) {
    return o.sellerId === sellerId;
  });
}

export function findOpportunitiesForSeller(sellerId) {
  var my = (localMyListings(sellerId) || []).filter(isListingOnMarket);
  if (!my.length) return [];
  var myIds = {};
  for (var i = 0; i < my.length; i++) {
    var lid = my[i]._id || my[i].id;
    if (lid) myIds[lid] = my[i];
  }
  var allListings = filterOnMarket(localGetListings());
  var demands = listDemands().filter(function (d) {
    return d.status === 'active';
  });
  var out = [];
  for (var d = 0; d < demands.length; d++) {
    var demand = demands[d];
    if (demand.authorId === sellerId) continue;
    var tiers = matchDemandTiers(demand, allListings);
    var exactMine = [];
    var nearMine = [];
    for (var m = 0; m < tiers.exact.length; m++) {
      if (myIds[tiers.exact[m]._id]) exactMine.push(tiers.exact[m]);
    }
    for (var n = 0; n < tiers.near.length; n++) {
      if (myIds[tiers.near[n]._id]) nearMine.push(tiers.near[n]);
    }
    /* Preferir exact; near só se não houver exact do vendedor */
    var mine = exactMine.length ? exactMine : nearMine;
    var tier = exactMine.length ? 'exact' : nearMine.length ? 'near' : null;
    if (mine.length) {
      out.push({
        demand: demand,
        matchedListings: mine,
        matchTier: tier,
      });
    }
  }
  /* Exact opportunities first */
  out.sort(function (a, b) {
    if (a.matchTier === b.matchTier) return 0;
    if (a.matchTier === 'exact') return -1;
    return 1;
  });
  return out;
}

/**
 * Resposta do vendedor + abre negociação com o dono da procura.
 */
export function createDemandOffer(input) {
  input = input || {};
  if (!input.demandId || !input.sellerId) {
    throw new Error('Falta procura ou vendedor.');
  }
  var demand = getDemand(input.demandId);
  if (!demand) throw new Error('Procura não encontrada.');
  if (demand.authorId === input.sellerId) {
    throw new Error('Não podes responder à tua própria procura.');
  }

  var all = read();
  for (var i = 0; i < all.length; i++) {
    if (
      all[i].demandId === input.demandId &&
      all[i].sellerId === input.sellerId &&
      all[i].status !== 'withdrawn'
    ) {
      return all[i];
    }
  }
  var item = {
    id: 'doffer-' + Date.now(),
    demandId: input.demandId,
    sellerId: input.sellerId,
    listingId: input.listingId || null,
    message: String(input.message || '').trim().slice(0, 280) || 'Tenho oferta compatível.',
    status: 'pending',
    createdAt: Date.now(),
  };
  all.unshift(item);
  write(all);
  track('demand_offer_create', { id: item.id, demandId: item.demandId });

  try {
    openNegotiation({
      demandId: input.demandId,
      listingId: input.listingId || null,
      buyerId: demand.authorId,
      sellerId: input.sellerId,
    });
  } catch (e) {
    /* resposta grava-se na mesma */
  }
  return item;
}
