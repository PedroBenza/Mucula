/**
 * Disponibilidade pública no mercado (R9).
 * Uma única fonte — Feed, matching, negociação, oportunidades.
 *
 * Ciclo de vida (R6):
 *   disponivel → (acordo) reservado → (entrega) vendido
 *
 * No mercado: status vazio | disponivel | active | activo
 * Fora: reservado | vendido | pausado | apagado | isActive===false
 */
export function isListingOnMarket(listing) {
  if (!listing) return false;
  if (listing.isActive === false) return false;
  var st = listing.status;
  if (st == null || st === '') return true;
  st = String(st).toLowerCase();
  if (st === 'disponivel' || st === 'active' || st === 'activo') return true;
  return false;
}

/** Lista só o que ainda pode aparecer / ser negociado / matched. */
export function filterOnMarket(listings) {
  var list = listings || [];
  var out = [];
  for (var i = 0; i < list.length; i++) {
    if (isListingOnMarket(list[i])) out.push(list[i]);
  }
  return out;
}

export function listingStatusLabel(status) {
  var st = status == null || status === '' ? 'disponivel' : String(status).toLowerCase();
  if (st === 'disponivel' || st === 'active' || st === 'activo') return 'Disponível';
  if (st === 'reservado' || st === 'reservada') return 'Reservado';
  if (st === 'vendido' || st === 'vendida') return 'Vendido';
  if (st === 'pausado' || st === 'pausada') return 'Pausado';
  return st;
}
