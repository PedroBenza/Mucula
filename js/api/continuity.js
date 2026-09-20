/**
 * Continuity / Fluxo — ramo api (Supabase).
 * Não mistura localStorage. Procura local fica fora até D4.
 */
import { sameUserId } from '../core/user-id.js';
import { negotiationLabel } from '../domain/human-state.js';
import { COPY } from '../constants/copy.js';
import { getExpiryInfo } from '../local/negotiations.js';
import { fluxHintForNegotiation } from '../local/negotiation-map.js';
import { listNegotiations } from './negotiations.js';
import { fetchListingById, fetchMyListings } from './listings.js';

async function resolveListingMeta(listingId, cache) {
  if (!listingId) return { title: 'Negociação', imageUrl: '' };
  if (cache[listingId]) return cache[listingId];
  try {
    var L = await fetchListingById(listingId);
    var meta = {
      title: (L && L.title) || 'Publicação',
      imageUrl:
        (L && (L.imageUrl || (L.imageUrls && L.imageUrls[0]))) || '',
      price: L && L.price != null ? Number(L.price) : null,
      status: (L && L.status) || null,
    };
    cache[listingId] = meta;
    return meta;
  } catch (e) {
    var fallback = { title: 'Publicação', imageUrl: '' };
    cache[listingId] = fallback;
    return fallback;
  }
}

export async function buildContinuityItemsFromApi(userId) {
  var uid = userId ? String(userId) : null;
  if (!uid) return [];

  var negs = [];
  try {
    negs = (await listNegotiations(uid)) || [];
  } catch (e) {
    negs = [];
  }

  var cache = {};
  var items = [];

  for (var j = 0; j < negs.length; j++) {
    var n = negs[j];
    if (!n || n.state === 'closed') continue;

    var asSeller = sameUserId(n.sellerId, uid);
    var asBuyer = sameUserId(n.buyerId, uid);
    if (!asSeller && !asBuyer) continue;

    var role = asSeller ? 'seller' : 'buyer';
    var meta = await resolveListingMeta(n.listingId, cache);
    var title = meta.title || (n.demandId ? 'Procura activa' : 'Negociação');
    var changed = fluxHintForNegotiation(n, role);
    var exp = getExpiryInfo(n);
    if (exp && exp.warn && exp.label) {
      changed = exp.label + ' — ' + changed;
    }

    var actionLabel = 'Ver no Fluxo';
    var href = '/activities';
    var needsSeller = !!(
      n.needsSellerDecision ||
      n.belowFloor ||
      n.state === 'pending_seller'
    );

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
      actionLabel = 'Ver publicação';
      href = n.listingId ? '/listing/' + n.listingId : '/activities';
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
      imageUrl: meta.imageUrl || '',
      role: role,
      proposedPrice: n.proposedPrice != null ? Number(n.proposedPrice) : null,
      belowFloor: !!n.belowFloor,
      needsSellerDecision: !!n.needsSellerDecision || needsSeller,
      expiry: exp || null,
    });
  }

  items.sort(function (a, b) {
    return (b.sort || 0) - (a.sort || 0);
  });
  return items;
}

export async function dashboardForAuthorFromApi(userId) {
  var list = [];
  try {
    list = (await fetchMyListings()) || [];
  } catch (e) {
    list = [];
  }

  var pubs = [];
  var ads = [];

  for (var i = 0; i < list.length; i++) {
    var L = list[i];
    var id = L.id || L._id;
    var st = {
      listingId: id,
      title: L.title || '',
      isAnuncio: !!L.isFeatured,
      imageUrl: L.imageUrl || (L.imageUrls && L.imageUrls[0]) || '',
      price: L.price != null ? Number(L.price) : 0,
      views: 0,
      clicks: 0,
      interests: 0,
      minguitoConversations: 0,
      features: 0,
      matched: 0,
      retentionPct: 0,
      listing: L,
      status: L.status || 'disponivel',
    };
    if (st.isAnuncio) ads.push(st);
    else pubs.push(st);
  }

  return {
    publications: pubs,
    announcements: ads,
    totals: {
      publications: pubs.length,
      announcements: ads.length,
      views: 0,
      clicks: 0,
      interests: 0,
      minguitoConversations: 0,
      matched: 0,
      retentionPct: 0,
    },
  };
}
