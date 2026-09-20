import { track } from './telemetry.js';
import { localGetListing, localSetListingStatus } from './store.js';
import { isListingOnMarket } from '../domain/listing-market.js';
import { sameUserId } from '../core/user-id.js';

export { isListingOnMarket } from '../domain/listing-market.js';

/**
 * Negociação — Etapas 1+2 blindadas + limite 48h.
 * Ver docs/PRODUTO_MUCULA.md e auditoria backend.
 */
var KEY = 'mc_local_negotiations';

export var MAX_AUTO_ROUNDS = 3;
export var DEFAULT_MARGIN_PCT = 0.15;
/** Limite total de vida de uma negociação aberta (produto). */
export var NEGOTIATION_TTL_MS = 48 * 60 * 60 * 1000;
/** A partir daqui mostra aviso de tempo restante (24h após o início). */
export var NEGOTIATION_WARN_AFTER_MS = 24 * 60 * 60 * 1000;

/**
 * Transições via transitionNegotiation() — congeladas (doc + teste).
 * setProposedPrice / confirmAsSeller são escritas de domínio próprias
 * (proposta e fecho do vendedor) e não dependem desta tabela para pending_seller.
 */
export var ALLOWED = {
  interest: ['negotiating', 'closed'],
  negotiating: ['agreed_buyer', 'closed'],
  agreed_buyer: ['pending_seller', 'closed'],
  pending_seller: ['matched', 'closed'],
  matched: ['closed'],
  closed: [],
};

function readRaw() {
  try {
    var raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return [];
}

function write(list) {
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function computeCeiling(listingPrice, floorPrice) {
  var price = Number(listingPrice);
  if (!Number.isFinite(price) || price <= 0) return null;
  if (
    floorPrice != null &&
    floorPrice !== '' &&
    Number.isFinite(Number(floorPrice))
  ) {
    var floor = Number(floorPrice);
    if (floor > 0 && floor < price) {
      return Math.round((price + floor) / 2);
    }
  }
  return Math.round(price * (1 - DEFAULT_MARGIN_PCT / 2));
}

export function isListingNegotiable(listing) {
  return !!(listing && listing.negotiable);
}

export function assertBuyer(n, userId) {
  if (!n || !sameUserId(n.buyerId, userId)) {
    throw new Error('Só o comprador desta conversa pode fazer isto.');
  }
}

export function assertSeller(n, userId) {
  if (!n || !sameUserId(n.sellerId, userId)) {
    throw new Error('Só o vendedor desta conversa pode fazer isto.');
  }
}

/**
 * Info de expiração (48h desde createdAt).
 * @returns {{ expired: boolean, remainingMs: number, warn: boolean, label: string|null }}
 */
export function getExpiryInfo(n, now) {
  now = now != null ? now : Date.now();
  if (!n || n.state === 'matched' || n.state === 'closed') {
    return { expired: false, remainingMs: 0, warn: false, label: null };
  }
  var start = Number(n.createdAt) || now;
  var endsAt = start + NEGOTIATION_TTL_MS;
  var remainingMs = endsAt - now;
  if (remainingMs <= 0) {
    return {
      expired: true,
      remainingMs: 0,
      warn: true,
      label: 'Tempo esgotado',
    };
  }
  var elapsed = now - start;
  var warn = elapsed >= NEGOTIATION_WARN_AFTER_MS;
  var label = null;
  if (warn) {
    var h = Math.ceil(remainingMs / (60 * 60 * 1000));
    if (h <= 1) label = 'Encerra em menos de 1 hora';
    else if (h <= 12) label = 'Encerra em cerca de ' + h + 'h';
    else label = 'Encerra em cerca de ' + h + 'h';
  }
  return { expired: false, remainingMs: remainingMs, warn: warn, label: label };
}

export function evaluateProposal(n, proposedPrice) {
  var offer = Number(proposedPrice);
  if (!Number.isFinite(offer) || offer <= 0) {
    throw new Error('A oferta tem de ser um valor positivo.');
  }
  var floor =
    n.floorPrice != null && Number.isFinite(Number(n.floorPrice))
      ? Number(n.floorPrice)
      : null;
  var ceiling =
    n.ceilingPrice != null && Number.isFinite(Number(n.ceilingPrice))
      ? Number(n.ceilingPrice)
      : null;
  var round = Number(n.round) || 0;
  var maxR =
    n.maxAutoRounds != null ? Number(n.maxAutoRounds) : MAX_AUTO_ROUNDS;

  if (floor != null && offer < floor) {
    return { outcome: 'below_floor', ceiling: ceiling, floor: floor };
  }
  /* Sem teto (dados legados): qualquer oferta pede vendedor */
  if (ceiling == null) {
    return { outcome: 'needs_seller', ceiling: null, floor: floor };
  }
  if (offer >= ceiling && round < maxR) {
    return { outcome: 'auto', ceiling: ceiling, floor: floor };
  }
  return { outcome: 'needs_seller', ceiling: ceiling, floor: floor };
}

/** Completa snapshot em negociações antigas (pré-Etapa 1). */
function backfillSnapshot(n) {
  if (!n || !n.listingId) return n;
  if (
    n.listingPrice != null &&
    n.ceilingPrice != null &&
    n.negotiable !== undefined
  ) {
    return n;
  }
  var listing = localGetListing(n.listingId);
  if (!listing) return n;
  if (n.listingPrice == null) n.listingPrice = Number(listing.price) || null;
  if (n.floorPrice == null && listing.floorPrice != null && listing.floorPrice !== '') {
    var f = Number(listing.floorPrice);
    n.floorPrice = Number.isFinite(f) && f > 0 ? f : null;
  }
  if (n.ceilingPrice == null) {
    n.ceilingPrice = computeCeiling(n.listingPrice, n.floorPrice);
  }
  if (n.negotiable === undefined) n.negotiable = isListingNegotiable(listing);
  if (!n.offerHistory) n.offerHistory = [];
  if (n.round == null) n.round = 0;
  if (n.maxAutoRounds == null) n.maxAutoRounds = MAX_AUTO_ROUNDS;
  return n;
}

function expireOne(n, now) {
  n.state = 'closed';
  n.closedReason = 'timeout';
  n.updatedAt = now;
  if (n.offerHistory && n.offerHistory.length) {
    for (var i = 0; i < n.offerHistory.length; i++) {
      if (n.offerHistory[i].status === 'pending') {
        n.offerHistory[i].status = 'expired';
        n.offerHistory[i].endedAt = now;
      }
    }
  }
  n.needsSellerDecision = false;
  return n;
}

/**
 * Varre e fecha negociações com mais de 48h (excepto matched).
 * Idempotente — seguro chamar ao abrir Fluxo / Minguito.
 */
export function sweepExpiredNegotiations(now) {
  now = now != null ? now : Date.now();
  var all = readRaw();
  var changed = false;
  for (var i = 0; i < all.length; i++) {
    var n = all[i];
    if (n.state === 'matched' || n.state === 'closed') continue;
    var info = getExpiryInfo(n, now);
    if (info.expired) {
      all[i] = expireOne(n, now);
      changed = true;
      track('negotiation_expired', { id: n.id, reason: 'timeout' });
    }
  }
  if (changed) write(all);
  return changed;
}

function read() {
  sweepExpiredNegotiations();
  var all = readRaw();
  var changed = false;
  for (var i = 0; i < all.length; i++) {
    var before = JSON.stringify(all[i]);
    all[i] = backfillSnapshot(all[i]);
    if (!all[i].offerHistory) {
      all[i].offerHistory = [];
      /* Legado: uma proposedPrice sem histórico */
      if (all[i].proposedPrice != null && all[i].offerHistory.length === 0) {
        all[i].offerHistory.push({
          id: 'off-legacy-' + all[i].id,
          price: Number(all[i].proposedPrice),
          status:
            all[i].state === 'matched'
              ? 'accepted'
              : all[i].state === 'closed'
                ? 'expired'
                : 'pending',
          outcome: 'unknown',
          createdAt: all[i].updatedAt || all[i].createdAt || Date.now(),
        });
        all[i].activeOfferId = all[i].offerHistory[0].id;
      }
    }
    if (JSON.stringify(all[i]) !== before) changed = true;
  }
  if (changed) write(all);
  return all;
}

export function listNegotiations(userId) {
  var all = read();
  if (!userId) return all;
  return all.filter(function (n) {
    return n.buyerId === userId || n.sellerId === userId;
  });
}

export function getNegotiation(id) {
  var all = read();
  for (var i = 0; i < all.length; i++) {
    if (all[i].id === id) return all[i];
  }
  return null;
}

export function findOpenForListing(listingId, userId) {
  var all = read();
  for (var i = 0; i < all.length; i++) {
    var n = all[i];
    if (n.listingId !== listingId) continue;
    if (n.state === 'closed' || n.state === 'matched') continue;
    if (!userId || n.buyerId === userId || n.sellerId === userId) return n;
  }
  return null;
}

export function closeCompeting(listingId, keepId) {
  if (!listingId) return;
  var all = readRaw();
  var now = Date.now();
  var changed = false;
  for (var i = 0; i < all.length; i++) {
    var n = all[i];
    if (n.listingId !== listingId) continue;
    if (n.id === keepId) continue;
    if (n.state === 'closed' || n.state === 'matched') continue;
    n.state = 'closed';
    n.closedReason = 'listing_sold';
    n.updatedAt = now;
    n.needsSellerDecision = false;
    if (n.offerHistory) {
      for (var h = 0; h < n.offerHistory.length; h++) {
        if (n.offerHistory[h].status === 'pending') {
          n.offerHistory[h].status = 'expired';
          n.offerHistory[h].endedAt = now;
        }
      }
    }
    changed = true;
  }
  if (changed) write(all);
}

export function openNegotiation(opts) {
  opts = opts || {};
  var buyerId = opts.buyerId ? String(opts.buyerId) : null;
  var listingId = opts.listingId || null;
  var demandId = opts.demandId || null;
  var sellerId = opts.sellerId || null;

  if (!buyerId) {
    throw new Error('Precisas de entrar na conta para negociar.');
  }
  if (!listingId && !demandId) {
    throw new Error('Negociação precisa de listing ou procura.');
  }
  if (sellerId && sameUserId(buyerId, sellerId)) {
    throw new Error('Não podes negociar o teu próprio anúncio.');
  }

  var listing = null;
  var snapPrice = null;
  var snapFloor = null;
  var snapCeiling = null;
  var snapNegotiable = true;

  if (listingId) {
    listing = localGetListing(listingId);
    if (!listing) throw new Error('Publicação não encontrada.');
    if (listing.authorId && sameUserId(listing.authorId, buyerId)) {
      throw new Error('Não podes negociar o teu próprio anúncio.');
    }
    if (!isListingOnMarket(listing)) {
      throw new Error('Esta publicação já não está disponível.');
    }
    snapNegotiable = isListingNegotiable(listing);
    snapPrice = Number(listing.price) || null;
    if (listing.floorPrice != null && listing.floorPrice !== '') {
      var f = Number(listing.floorPrice);
      snapFloor = Number.isFinite(f) && f > 0 ? f : null;
    }
    snapCeiling = computeCeiling(snapPrice, snapFloor);
    if (!sellerId && listing.authorId) sellerId = listing.authorId;
  }

  var all = read();
  for (var i = 0; i < all.length; i++) {
    var n = all[i];
    if (n.buyerId !== buyerId) continue;
    if (n.state === 'closed' || n.state === 'matched') continue;
    if (listingId && n.listingId === listingId) {
      n = backfillSnapshot(n);
      if (sellerId && !n.sellerId) n.sellerId = sellerId;
      n.updatedAt = Date.now();
      all[i] = n;
      write(all);
      return n;
    }
    if (
      demandId &&
      n.demandId === demandId &&
      (!sellerId || n.sellerId === sellerId)
    ) {
      return n;
    }
  }

  var item = {
    id: 'neg-' + Date.now() + '-' + Math.floor(Math.random() * 1e4),
    listingId: listingId,
    demandId: demandId,
    buyerId: buyerId,
    sellerId: sellerId,
    state: 'interest',
    proposedPrice: null,
    listingPrice: snapPrice,
    floorPrice: snapFloor,
    ceilingPrice: snapCeiling,
    negotiable: snapNegotiable,
    round: 0,
    maxAutoRounds: MAX_AUTO_ROUNDS,
    belowFloor: false,
    needsSellerDecision: false,
    offerHistory: [],
    activeOfferId: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  all.unshift(item);
  write(all);
  track('interest_open', {
    id: item.id,
    listingId: listingId,
    demandId: demandId,
  });
  return item;
}

export function transitionNegotiation(id, toState) {
  var all = read();
  for (var i = 0; i < all.length; i++) {
    if (all[i].id !== id) continue;
    var info = getExpiryInfo(all[i]);
    if (info.expired) {
      throw new Error('Esta negociação já encerrou por tempo.');
    }
    var from = all[i].state;
    var ok = ALLOWED[from] || [];
    if (ok.indexOf(toState) === -1) {
      throw new Error('Transição inválida: ' + from + ' → ' + toState);
    }
    all[i].state = toState;
    all[i].updatedAt = Date.now();
    write(all);
    return all[i];
  }
  throw new Error('Negociação não encontrada.');
}

export function advanceAsBuyer(id, buyerId) {
  var n = getNegotiation(id);
  if (!n) throw new Error('Negociação não encontrada.');
  assertBuyer(n, buyerId);
  if (getExpiryInfo(n).expired) {
    throw new Error('Esta negociação já encerrou por tempo.');
  }
  if (n.state === 'interest') return transitionNegotiation(id, 'negotiating');
  return n;
}

/**
 * Vendedor confirma acordo — exige oferta registada.
 */
export function confirmAsSeller(id, sellerId, opts) {
  opts = opts || {};
  var all = read();
  for (var i = 0; i < all.length; i++) {
    var n = all[i];
    if (n.id !== id) continue;
    assertSeller(n, sellerId);
    if (n.state === 'matched') return n;
    if (n.state === 'closed') throw new Error('Negociação já encerrada.');
    if (getExpiryInfo(n).expired) {
      throw new Error('Esta negociação já encerrou por tempo.');
    }
    if (n.proposedPrice == null || !Number.isFinite(Number(n.proposedPrice))) {
      throw new Error('Ainda não há proposta de preço para confirmar.');
    }

    /* R3: chão é muro — abaixo do chão só com excepção explícita */
    if (n.belowFloor === true && !(opts && opts.allowBelowFloorException === true)) {
      throw new Error(
        'Esta proposta está abaixo do mínimo. Não dá para confirmar assim — recusa ou pede outro valor ao interessado.'
      );
    }

    var from = n.state;
    if (
      from !== 'interest' &&
      from !== 'negotiating' &&
      from !== 'agreed_buyer' &&
      from !== 'pending_seller'
    ) {
      throw new Error('Estado não permite confirmar: ' + from);
    }

    var now = Date.now();
    n.state = 'matched';
    n.needsSellerDecision = false;
    n.belowFloor = false;
    n.updatedAt = now;
    n.dealPrice = Number(n.proposedPrice);
    if (n.offerHistory && n.offerHistory.length) {
      for (var oh = 0; oh < n.offerHistory.length; oh++) {
        if (n.offerHistory[oh].status === 'pending') {
          n.offerHistory[oh].status = 'accepted';
          n.offerHistory[oh].endedAt = now;
        }
      }
    }
    write(all);

    closeCompeting(n.listingId, n.id);
    if (n.listingId) {
      try {
        localSetListingStatus(n.listingId, 'reservado');
      } catch (e) {}
    }

    track('negotiation_matched', {
      id: n.id,
      listingId: n.listingId,
      demandId: n.demandId,
    });
    return n;
  }
  throw new Error('Negociação não encontrada.');
}

/**
 * Regista proposta — uma pending activa; histórico com snapshot de outcome.
 */
export function setProposedPrice(id, price, opts) {
  opts = opts || {};
  var all = read();
  for (var i = 0; i < all.length; i++) {
    if (all[i].id !== id) continue;
    var n = all[i];
    if (n.state === 'matched' || n.state === 'closed') {
      throw new Error('Esta negociação já fechou.');
    }
    if (getExpiryInfo(n).expired) {
      throw new Error('Esta negociação já encerrou por tempo.');
    }
    if (n.negotiable === false) {
      throw new Error('Este preço é fixo — não há propostas de desconto.');
    }

    n = backfillSnapshot(n);
    var offer = price == null ? null : Number(price);
    if (offer != null && (!Number.isFinite(offer) || offer <= 0)) {
      throw new Error('A oferta tem de ser um valor positivo.');
    }

    n.updatedAt = Date.now();
    if (n.state === 'interest') n.state = 'negotiating';
    if (!n.offerHistory) n.offerHistory = [];

    for (var h = 0; h < n.offerHistory.length; h++) {
      if (n.offerHistory[h].status === 'pending') {
        n.offerHistory[h].status = 'superseded';
        n.offerHistory[h].endedAt = Date.now();
      }
    }

    n.proposedPrice = offer;

    if (offer != null) {
      var ev = evaluateProposal(n, offer);
      var offerId = 'off-' + Date.now() + '-' + Math.floor(Math.random() * 1e3);
      n.belowFloor = ev.outcome === 'below_floor';
      /* Mesmo "auto" exige ok do vendedor no Fluxo (piloto) — bandeira para UI */
      n.needsSellerDecision = true;
      if (ev.outcome === 'auto') {
        n.round = (Number(n.round) || 0) + 1;
        n.belowFloor = false;
        /* estado continua negotiating; vendedor confirma */
      } else {
        n.state = 'pending_seller';
      }
      if (opts.belowFloor === true || ev.outcome === 'below_floor') {
        n.belowFloor = true;
        n.state = 'pending_seller';
      }
      n.offerHistory.push({
        id: offerId,
        price: offer,
        status: 'pending',
        outcome: ev.outcome,
        ceilingSnapshot: ev.ceiling,
        floorSnapshot: ev.floor,
        listingPriceSnapshot: n.listingPrice,
        createdAt: Date.now(),
      });
      n.activeOfferId = offerId;
    }

    all[i] = n;
    write(all);
    return n;
  }
  throw new Error('Negociação não encontrada.');
}

export function getActiveOffer(negotiationId) {
  var n = getNegotiation(negotiationId);
  if (!n) return null;
  if (n.offerHistory && n.offerHistory.length) {
    for (var i = n.offerHistory.length - 1; i >= 0; i--) {
      if (n.offerHistory[i].status === 'pending') return n.offerHistory[i];
    }
  }
  if (n.proposedPrice != null) {
    return {
      id: n.activeOfferId || null,
      price: Number(n.proposedPrice),
      status: 'pending',
    };
  }
  return null;
}

/** Lista ofertas com status canónico (para debug / Fluxo). */
export function listOfferHistory(negotiationId) {
  var n = getNegotiation(negotiationId);
  if (!n) return [];
  return (n.offerHistory || []).slice();
}

/**
 * Vendedor recusa a proposta / encerra sem acordo.
 */

/**
 * R6: Acordo (matched + reservado) ≠ vendido.
 * Só o vendedor marca entrega/conclusão → status vendido (sai definitivamente do mercado).
 */
export function completeDealAsSeller(negotiationId, sellerId) {
  var n = getNegotiation(negotiationId);
  if (!n) throw new Error('Negociação não encontrada.');
  assertSeller(n, sellerId);
  if (n.state !== 'matched') {
    throw new Error('Só podes concluir depois do acordo confirmado.');
  }
  if (!n.listingId) {
    throw new Error('Este acordo não está ligado a uma publicação.');
  }
  var listing = localGetListing(n.listingId);
  if (!listing) throw new Error('Publicação não encontrada.');
  if (!sameUserId(listing.authorId, sellerId)) {
    throw new Error('Só o dono da publicação pode marcar como vendido.');
  }
  var st = listing.status || 'disponivel';
  if (st === 'vendido') {
    return { negotiation: n, listing: listing, already: true };
  }
  if (st !== 'reservado' && st !== 'reservada') {
    /* ainda assim permitir se matched (dados antigos) */
  }
  try {
    localSetListingStatus(n.listingId, 'vendido');
  } catch (e) {
    throw new Error((e && e.message) || 'Não foi possível marcar como vendido.');
  }
  var all = read();
  for (var i = 0; i < all.length; i++) {
    if (all[i].id !== negotiationId) continue;
    all[i].completedAt = Date.now();
    all[i].updatedAt = Date.now();
    write(all);
    n = all[i];
    break;
  }
  track('negotiation_completed', {
    id: negotiationId,
    listingId: n.listingId,
  });
  return {
    negotiation: n,
    listing: localGetListing(n.listingId),
    already: false,
  };
}

export function rejectAsSeller(id, sellerId) {
  var all = read();
  for (var i = 0; i < all.length; i++) {
    var n = all[i];
    if (n.id !== id) continue;
    assertSeller(n, sellerId);
    if (n.state === 'matched') {
      throw new Error('O acordo já foi confirmado — não dá para recusar assim.');
    }
    if (n.state === 'closed') return n;
    var now = Date.now();
    n.state = 'closed';
    n.closedReason = 'rejected';
    n.needsSellerDecision = false;
    n.updatedAt = now;
    if (n.offerHistory && n.offerHistory.length) {
      for (var h = 0; h < n.offerHistory.length; h++) {
        if (n.offerHistory[h].status === 'pending') {
          n.offerHistory[h].status = 'rejected';
          n.offerHistory[h].endedAt = now;
        }
      }
    }
    write(all);
    track('negotiation_rejected', { id: n.id, listingId: n.listingId });
    return n;
  }
  throw new Error('Negociação não encontrada.');
}

export function confirmAsBuyer() {
  throw new Error(
    'Só o vendedor confirma o acordo. Continua com o Minguito ou espera no Fluxo.'
  );
}
