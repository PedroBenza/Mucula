import { isListingOnMarket } from './listing-market.js';
/**
 * Matching procura → oferta (determinístico).
 * exact | near | (omitido = fora)
 * Regras de produto Etapa 3:
 * - exact: categoria + (bairro igual se procura tem bairro) + preço <= orçamento (se houver)
 * - near: categoria + activo + (preço até orçamento×1.15 OU bairro diferente com preço ok)
 */

export var BUDGET_FACTOR_NEAR = 1.15;

export function normalizeNeighborhood(s) {
  return String(s || '')
    .trim()
    .toLowerCase();
}

function listingNeighborhood(listing) {
  if (!listing) return '';
  if (listing.location && listing.location.neighborhood) {
    return normalizeNeighborhood(listing.location.neighborhood);
  }
  return normalizeNeighborhood(listing.neighborhood);
}

function isActiveListing(listing) {
  return isListingOnMarket(listing);
}

function budgetNum(demand) {
  if (!demand || demand.budgetMax == null || demand.budgetMax === '') return null;
  var n = Number(demand.budgetMax);
  return isNaN(n) ? null : n;
}

/**
 * @returns {'exact'|'near'|null}
 */
export function classifyListingAgainstDemand(demand, listing) {
  if (!demand || !listing || !isActiveListing(listing)) return null;
  if (demand.category && listing.category !== demand.category) return null;

  var budget = budgetNum(demand);
  var price = Number(listing.price);
  if (isNaN(price)) price = 0;

  var dNb = normalizeNeighborhood(demand.neighborhood);
  var lNb = listingNeighborhood(listing);
  var nbOk = !dNb || !lNb || dNb === lNb;
  var nbDiff = dNb && lNb && dNb !== lNb;

  var withinExactBudget = budget == null || price <= budget;
  var withinNearBudget = budget == null || price <= budget * BUDGET_FACTOR_NEAR;

  if (nbOk && withinExactBudget) return 'exact';
  if (!withinNearBudget) return null;
  // próximo: ligeiramente acima do orçamento (mesmo bairro) OU outro bairro com preço aceitável
  if (nbOk && budget != null && price > budget && withinNearBudget) return 'near';
  if (nbDiff && withinNearBudget) return 'near';
  return null;
}

export function matchDemandToListings(demand, listings) {
  var tiers = matchDemandTiers(demand, listings);
  return tiers.exact.concat(tiers.near);
}

export function matchDemandTiers(demand, listings) {
  var exact = [];
  var near = [];
  if (!demand || !listings || !listings.length) {
    return { exact: exact, near: near };
  }
  for (var i = 0; i < listings.length; i++) {
    var l = listings[i];
    var t = classifyListingAgainstDemand(demand, l);
    if (t === 'exact') exact.push(l);
    else if (t === 'near') near.push(l);
  }
  function sortList(arr) {
    var budget = budgetNum(demand);
    var nb = normalizeNeighborhood(demand.neighborhood);
    arr.sort(function (a, b) {
      if (budget != null) {
        var da = Math.abs((Number(a.price) || 0) - budget);
        var db = Math.abs((Number(b.price) || 0) - budget);
        if (da !== db) return da - db;
      }
      return (b.createdAt || 0) - (a.createdAt || 0);
    });
    return arr;
  }
  return { exact: sortList(exact), near: sortList(near) };
}

export function matchDemandToListingsLimited(demand, listings, limit) {
  var cap = limit == null ? 8 : limit;
  return matchDemandToListings(demand, listings).slice(0, cap);
}

export function matchDemandTiersLimited(demand, listings, exactCap, nearCap) {
  var t = matchDemandTiers(demand, listings);
  return {
    exact: t.exact.slice(0, exactCap == null ? 8 : exactCap),
    near: t.near.slice(0, nearCap == null ? 5 : nearCap),
  };
}
