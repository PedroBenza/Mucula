/**
 * Continuity / Fluxo — ramo api (Supabase).
 * Metadados de listings em paralelo (sem N+1 sequencial).
 */
import { sameUserId } from '../core/user-id.js';
import { negotiationLabel } from '../domain/human-state.js';
import { COPY } from '../constants/copy.js';
import { getExpiryInfo } from '../local/negotiations.js';
import { fluxHintForNegotiation } from '../local/negotiation-map.js';
import { listNegotiations } from './negotiations.js';
import { fetchListingById, fetchMyListings } from './listings.js';
import { listDemands } from './demands.js';
import { demandLabel } from '../domain/human-state.js';

async function buildListingCache(listingIds) {
  var cache = {};
  var unique = [];
  var seen = {};
  for (var i = 0; i < listingIds.length; i++) {
    var id = listingIds[i];
    if (!id || seen[id]) continue;
    seen[id] = true;
    unique.push(id);
  }
  await Promise.all(
    unique.map(function (id) {
      return fetchListingById(id)
        .then(function (L) {
          cache[id] = {
            title: (L && L.title) || 'Publicação',
            imageUrl:
              (L && (L.imageUrl || (L.imageUrls && L.imageUrls[0]))) || '',
            price: L && L.price != null ? Number(L.price) : null,
            status: (L && L.status) || null,
          };
        })
        .catch(function () {
          cache[id] = { title: 'Publicação', imageUrl: '' };
        });
    })
  );
  return cache;
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

  var ids = [];
  for (var i = 0; i < negs.length; i++) {
    if (negs[i] && negs[i].listingId) ids.push(negs[i].listingId);
  }
  var cache = await buildListingCache(ids);
  var items = [];

  try {
    var demands = (await listDemands(uid)) || [];
    for (var di = 0; di < demands.length; di++) {
      var d = demands[di];
      if (d.status !== 'active' && d.status !== 'paused') continue;
      items.push({
        id: 'demand-' + d.id,
        kind: 'demand',
        title: d.title,
        stateLabel: demandLabel(d.status),
        changed: 'A procura continua no mercado',
        actionLabel: 'Ver procura',
        href: '/demand/' + d.id,
        sort: d.updatedAt || d.createdAt || 0,
        demandId: d.id,
        imageUrl: '',
      });
    }
  } catch (eDem) {}

  for (var j = 0; j < negs.length; j++) {
    var n = negs[j];
    if (!n || n.state === 'closed') continue;

    var asSeller = sameUserId(n.sellerId, uid);
    var asBuyer = sameUserId(n.buyerId, uid);
    if (!asSeller && !asBuyer) continue;

    var role = asSeller ? 'seller' : 'buyer';
    var meta = (n.listingId && cache[n.listingId]) || {
      title: 'Negociação',
      imageUrl: '',
    };
    var title = meta.title || (n.demandId ? 'Procura activa' : 'Negociação');
    var changed = fluxHintForNegotiation(n, role);
    var exp = getExpiryInfo(n);
    if (exp && exp.warn && exp.label) {
      changed = exp.label + ' — ' + changed;
    }

    var actionLabel = 'Ver';
    var href = n.listingId ? '/listing/' + n.listingId : '/activities';
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
