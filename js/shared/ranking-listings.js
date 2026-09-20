/**
 * rankListings — paridade exacta mucula-develop/src/shared/utils/rankingListings.ts
 * score = featured*1000 + views*2 + recência (mais recente = maior score residual)
 */
export function rankListings(listings) {
  var list = listings || [];
  var now = Date.now();
  return list
    .map(function (l) {
      var created = l.createdAt ? Number(l.createdAt) : now;
      var score =
        (l.isFeatured && (l.featuredUntil == null || Number(l.featuredUntil) > now) ? 1000 : 0) +
        (l.views != null ? Number(l.views) : 0) * 2 +
        (now - created) * -0.000001;
      return { listing: l, score: score };
    })
    .sort(function (a, b) {
      return b.score - a.score;
    })
    .map(function (x) {
      return x.listing;
    });
}
