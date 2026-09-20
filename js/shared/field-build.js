/** Feed: destaques só com janela activa; máx. 2 por lote (calibração).
 * Ranking: paridade rankListings da referência RN.
 */
import { rankListings } from './ranking-listings.js';

var PROMO_SLOT = 8;
var MAX_FEATURED = 2;

function isFeatureActive(l) {
  if (!l || !l.isFeatured) return false;
  if (l.featuredUntil != null && Number(l.featuredUntil) < Date.now()) return false;
  return true;
}

export function buildFeed(listings, announcements) {
  announcements = announcements || [];
  var blocks = [];
  blocks.push({ type: 'hero' });

  if (!listings || !listings.length) {
    if (announcements.length) {
      blocks.push({ type: 'promo', announcement: announcements[0] });
    }
    return blocks;
  }

  var ranked = rankListings(listings);
  var featured = [];
  var normal = [];
  for (var i = 0; i < ranked.length; i++) {
    if (isFeatureActive(ranked[i])) featured.push(ranked[i]);
    else normal.push(ranked[i]);
  }
  featured = featured.slice(0, MAX_FEATURED);

  if (featured.length > 0) {
    blocks.push({ type: 'section', title: 'Destaques' });
    blocks.push({ type: 'grid', listings: featured, featured: true });
  }

  if (normal.length > 0) {
    blocks.push({ type: 'section', title: 'Perto de ti' });
    var firstChunk = normal.slice(0, PROMO_SLOT);
    var secondChunk = normal.slice(PROMO_SLOT);
    blocks.push({ type: 'grid', listings: firstChunk });
    if (announcements.length > 0) {
      var promo = announcements.slice().sort(function (a, b) {
        return b.createdAt - a.createdAt;
      })[0];
      blocks.push({ type: 'promo', announcement: promo });
    }
    if (secondChunk.length > 0) {
      blocks.push({ type: 'grid', listings: secondChunk });
    }
  }

  return blocks;
}
