/**
 * Desempenho de publicações / anúncios (modo local).
 * Anúncio = publicação com divulgação activa (featuredUntil > now).
 */
import { listEvents, countEvents } from './telemetry.js';
import { localMyListings, localGetListing } from './store.js';
import { listNegotiations } from './negotiations.js';

export function isAnuncio(listing) {
  if (!listing) return false;
  var until = listing.featuredUntil;
  return !!(until && Number(until) > Date.now());
}

export function publicationKindLabel(listing) {
  return isAnuncio(listing) ? 'Anúncio' : 'Publicação';
}

function eventsForListing(listingId, eventName) {
  var all = listEvents(500) || [];
  var n = 0;
  for (var i = 0; i < all.length; i++) {
    var row = all[i];
    if (eventName && row.e !== eventName) continue;
    var p = row.p || {};
    if (p.listingId === listingId || p.id === listingId) n++;
  }
  return n;
}

/** Métricas por publicação (factuais a partir de telemetria local). */
export function statsForListing(listingId) {
  var listing = localGetListing(listingId);
  var views = eventsForListing(listingId, 'listing_view');
  var interests = eventsForListing(listingId, 'interest_open');
  var minguito = eventsForListing(listingId, 'minguito_protocol');
  if (!minguito) minguito = eventsForListing(listingId, 'minguito_message');
  var features = eventsForListing(listingId, 'listing_feature_start');
  var matched = 0;
  var negs = listNegotiations() || [];
  for (var i = 0; i < negs.length; i++) {
    if (negs[i].listingId === listingId && negs[i].state === 'matched') matched++;
  }
  var clicks = views; /* no piloto, abrir detalhe = clique */
  var retention =
    views > 0 ? Math.round((interests / views) * 100) : 0;
  return {
    listingId: listingId,
    title: listing ? listing.title : '',
    isAnuncio: isAnuncio(listing),
    imageUrl: listing
      ? listing.imageUrl ||
        (listing.imageUrls && listing.imageUrls[0]) ||
        ''
      : '',
    price: listing ? listing.price : 0,
    views: views,
    clicks: clicks,
    interests: interests,
    minguitoConversations: minguito,
    features: features,
    matched: matched,
    retentionPct: retention,
    featuredUntil: listing && listing.featuredUntil,
    featuredPlan: listing && listing.featuredPlan,
  };
}

/** Dashboard agregado do autor. */
export function dashboardForAuthor(authorId) {
  var list = localMyListings(authorId) || [];
  var pubs = [];
  var ads = [];
  var totalViews = 0;
  var totalClicks = 0;
  var totalInterests = 0;
  var totalMinguito = 0;
  var totalMatched = 0;

  for (var i = 0; i < list.length; i++) {
    var L = list[i];
    var id = L._id || L.id;
    var st = statsForListing(id);
    st.listing = L;
    if (st.isAnuncio) ads.push(st);
    else pubs.push(st);
    totalViews += st.views;
    totalClicks += st.clicks;
    totalInterests += st.interests;
    totalMinguito += st.minguitoConversations;
    totalMatched += st.matched;
  }

  var retention =
    totalViews > 0 ? Math.round((totalInterests / totalViews) * 100) : 0;

  return {
    publications: pubs,
    announcements: ads,
    totals: {
      publications: pubs.length,
      announcements: ads.length,
      views: totalViews,
      clicks: totalClicks,
      interests: totalInterests,
      minguitoConversations: totalMinguito,
      matched: totalMatched,
      retentionPct: retention,
    },
  };
}
