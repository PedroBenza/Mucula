import { sameUserId } from '../core/user-id.js';
import { listDemands } from './demands.js';
import { listNegotiations, getExpiryInfo } from './negotiations.js';
import { findOpportunitiesForSeller, listOffersForDemand } from './demand-offers.js';
import { localGetListing, localMyListings } from './store.js';
import { negotiationLabel, demandLabel } from '../domain/human-state.js';
import { COPY } from '../constants/copy.js';
import { fluxHintForNegotiation } from './negotiation-map.js';

export function buildContinuityItems(userId) {
  var items = [];
  var uid = userId ? String(userId) : null;
  if (!uid) return [];

  var demands = listDemands(uid) || [];
  for (var i = 0; i < demands.length; i++) {
    var d = demands[i];
    if (d.status !== 'active' && d.status !== 'paused') continue;
    var offers = listOffersForDemand(d.id);
    var offerN = offers.length;
    items.push({
      id: 'demand-' + d.id,
      kind: 'demand',
      title: d.title,
      stateLabel: demandLabel(d.status),
      changed:
        offerN > 0
          ? offerN + ' resposta(s) de vendedor'
          : 'A procura continua no mercado',
      actionLabel: offerN > 0 ? 'Ver respostas' : 'Ver procura',
      href: '/demand/' + d.id,
      sort: d.updatedAt || d.createdAt || 0,
    });
  }

  var negs = listNegotiations(uid) || [];
  for (var j = 0; j < negs.length; j++) {
    var n = negs[j];
    if (n.state === 'closed') continue;
    var listing = n.listingId ? localGetListing(n.listingId) : null;
    var title = listing ? listing.title : n.demandId ? 'Procura activa' : 'Negociação';
    var asSeller = sameUserId(n.sellerId, uid);
    var asBuyer = sameUserId(n.buyerId, uid);
    var role = asSeller ? 'seller' : 'buyer';
    var changed = fluxHintForNegotiation(n, role);
    var exp = getExpiryInfo(n);
    if (exp.warn && exp.label) {
      changed = exp.label + ' — ' + changed;
    }
    var actionLabel = 'Ver no Fluxo';
    var href = '/activities';
    var needsSeller =
      !!(n.needsSellerDecision || n.belowFloor || n.state === 'pending_seller');

    if (n.state === 'matched') {
      actionLabel = COPY.viewMatch || 'Ver acordo';
      href = '/combinamos/' + n.id;
    } else if (asSeller && needsSeller) {
      actionLabel = 'Aceitar ou recusar';
      href = '/activities';
    } else if (asSeller) {
      actionLabel = 'Ver interesse';
      href = n.listingId ? '/listing/' + n.listingId : '/activities';
    } else if (asBuyer) {
      actionLabel = 'Falar com o Minguito';
      href = n.listingId ? '/services?listingId=' + n.listingId : '/services';
    }

    items.push({
      id: 'neg-' + n.id,
      kind: 'negotiation',
      title: title,
      stateLabel: negotiationLabel(n.state),
      changed: changed,
      actionLabel: actionLabel,
      href: href,
      sort: n.updatedAt || n.createdAt || 0,
      negotiationId: n.id,
      listingId: n.listingId || null,
      demandId: n.demandId || null,
      imageUrl: listing
        ? listing.imageUrl ||
          (listing.imageUrls && listing.imageUrls[0]) ||
          ''
        : '',
      role: role,
      proposedPrice: n.proposedPrice != null ? Number(n.proposedPrice) : null,
      belowFloor: !!n.belowFloor,
      needsSellerDecision: !!n.needsSellerDecision || needsSeller,
      expiry: getExpiryInfo(n),
    });
  }

  var opps = findOpportunitiesForSeller(uid) || [];
  for (var k = 0; k < opps.length; k++) {
    var o = opps[k];
    items.push({
      id: 'opp-' + o.demand.id,
      kind: 'opportunity',
      title: 'Procura: ' + o.demand.title,
      stateLabel: COPY.stateOpportunity,
      changed:
        o.matchTier === 'exact'
          ? 'Bate certo com o teu anúncio'
          : 'Pode servir — categoria e preço próximos',
      actionLabel: 'Responder',
      href: '/activities',
      sort: o.demand.createdAt || 0,
      demandId: o.demand.id,
      listingId: o.matchedListings[0] && o.matchedListings[0]._id,
      opportunity: o,
      matchTier: o.matchTier || null,
    });
  }

  items.sort(function (a, b) {
    return (b.sort || 0) - (a.sort || 0);
  });
  return items;
}

export function buildMyListingItems(userId) {
  var list = localMyListings(userId) || [];
  return list.map(function (l) {
    return {
      id: l.id,
      title: l.title,
      price: l.price,
      status: l.status,
    };
  });
}
