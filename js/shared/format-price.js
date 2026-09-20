/** Paridade fmt ListingCard RN + unidade de serviço */
export function fmtCardPrice(n) {
  var v = Number(n) || 0;
  if (v >= 1000000) return (v / 1000000).toFixed(1) + 'M';
  if (v >= 1000) return String(Math.round(v / 1000)) + 'K';
  return v.toLocaleString('pt-AO');
}

/** Preço de cartão com unidade opcional (hora/dia/mes). */
export function fmtCardPriceWithUnit(listing) {
  if (!listing) return '0';
  var unit = listing.priceUnit && listing.priceUnit !== 'total' ? ' / ' + listing.priceUnit : '';
  return fmtCardPrice(listing.price) + unit;
}
