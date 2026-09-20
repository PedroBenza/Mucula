import { sameUserId } from '../core/user-id.js';
/**
 * Protocolo Minguito (Etapa 1 blindagem + preço) — intermediário de preço.
 * - Negocia até ao chão (floorPrice) do vendedor.
 * - Abaixo do chão: não fecha; marca needsSellerDecision para o Fluxo.
 * - Sem contacto directo entre partes.
 */
import { localGetListing } from './store.js';
import {
  openNegotiation,
  findOpenForListing,
  setProposedPrice,
  getNegotiation,
  listNegotiations,
  evaluateProposal,
  isListingOnMarket,
  isListingNegotiable,
} from './negotiations.js';
import { fmtKz } from '../core/format.js';

/** Extrai primeiro valor monetário razoável da mensagem. */
export function extractOfferKz(text) {
  var s = String(text || '');
  var m = s.match(/(\d[\d\s.,]{0,18})/);
  if (!m) return null;
  var raw = m[1].replace(/\s/g, '').replace(/\./g, '').replace(',', '.');
  var n = Number(raw);
  if (!n || n <= 0 || !isFinite(n)) return null;
  return Math.round(n);
}

export function getListingFloor(listing) {
  if (!listing) return null;
  if (listing.floorPrice != null && listing.floorPrice !== '') {
    var f = Number(listing.floorPrice);
    if (f > 0) return f;
  }
  return null;
}

/**
 * Aplica oferta do comprador ao protocolo.
 * @returns {{ reply: string, domain: object }}
 */
export function applyBuyerOffer(opts) {
  opts = opts || {};
  var listingId = opts.listingId;
  var buyerId = opts.buyerId ? String(opts.buyerId) : null;
  if (!buyerId) {
    return {
      reply: 'Entra na conta para eu negociar contigo.',
      domain: { status: 'need_auth', role: 'buyer' },
    };
  }
  var text = String(opts.message || opts.text || '');
  var listing = listingId ? localGetListing(listingId) : null;

  if (!listing) {
    return {
      reply:
        'Abre uma publicação do Feed para eu negociar com base nela. Sem anúncio, não fecho preço.',
      domain: { status: 'need_listing', role: 'buyer' },
    };
  }

  if (!isListingOnMarket(listing)) {
    return {
      reply: 'Esta publicação já não está disponível. Escolhe outra no Feed.',
      domain: { status: 'listing_unavailable', listingId: listing._id },
    };
  }

  if (listing.authorId && sameUserId(listing.authorId, buyerId)) {
    return {
      reply: 'Isto é teu. No lado do vendedor eu mostro interesses — não negocias contigo.',
      domain: { status: 'own_listing', role: 'buyer' },
    };
  }

  var offer = extractOfferKz(text);
  if (offer == null) {
    return {
      reply:
        'Diz quanto queres oferecer em Kwanza (ex.: 5000 ou 5.000 Kz) para eu registar a proposta.',
      domain: { status: 'need_price', listingId: listing._id },
    };
  }

  if (!isListingNegotiable(listing)) {
    return {
      reply:
        'O preço de «' +
        (listing.title || 'esta publicação') +
        '» é fixo (' +
        fmtKz(Number(listing.price) || 0) +
        '). Não há desconto. Se quiseres seguir, o vendedor trata no Fluxo — sem contacto directo aqui.',
      domain: {
        status: 'not_negotiable',
        listingId: listing._id,
        ask: Number(listing.price) || 0,
      },
    };
  }

  var neg;
  try {
    neg = openNegotiation({
      listingId: listing._id || listingId,
      buyerId: buyerId,
      sellerId: listing.authorId,
    });
  } catch (err) {
    return {
      reply: err && err.message ? err.message : 'Não consegui abrir a negociação.',
      domain: { status: 'error' },
    };
  }

  /* Snapshot congelado tem prioridade sobre listing ao vivo */
  var ask =
    neg.listingPrice != null ? Number(neg.listingPrice) : Number(listing.price) || 0;
  var floor =
    neg.floorPrice != null
      ? Number(neg.floorPrice)
      : getListingFloor(listing);
  var title = listing.title || 'esta publicação';

  var updated;
  try {
    updated = setProposedPrice(neg.id, offer);
  } catch (err2) {
    return {
      reply: err2 && err2.message ? err2.message : 'Não registei a oferta.',
      domain: { status: 'error', negotiationId: neg.id },
    };
  }

  var ev = evaluateProposal(updated, offer);

  if (ev.outcome === 'below_floor') {
    return {
      reply:
        'A tua oferta de ' +
        fmtKz(offer) +
        ' fica abaixo do mínimo do vendedor. Não fecho sozinho. Já ficou no Fluxo do vendedor — se ele aceitar, o acordo avança. Podes propor outro valor aqui.',
      domain: {
        status: 'below_floor',
        listingId: listing._id,
        negotiationId: updated.id,
        proposedPrice: offer,
        floor: ev.floor,
        ceiling: ev.ceiling,
        belowFloor: true,
        needsSellerDecision: true,
      },
    };
  }

  if (ev.outcome === 'needs_seller') {
    return {
      reply:
        'Registei ' +
        fmtKz(offer) +
        ' por «' +
        title +
        '» (pedido ' +
        fmtKz(ask) +
        '). Este valor pede o ok do vendedor. Ele vê no Fluxo; eu trato da conversa — sem números de telefone na app.',
      domain: {
        status: 'needs_seller',
        listingId: listing._id,
        negotiationId: updated.id,
        proposedPrice: offer,
        floor: ev.floor,
        ceiling: ev.ceiling,
        belowFloor: false,
        needsSellerDecision: true,
      },
    };
  }

  /* auto: dentro do teto */
  return {
    reply:
      'Registei a tua oferta de ' +
      fmtKz(offer) +
      ' para «' +
      title +
      '» (pedido ' +
      fmtKz(ask) +
      '). Está dentro do intervalo automático. O vendedor confirma o acordo no Fluxo — continuo a ser o intermediário.',
    domain: {
      status: 'offer_ok',
      listingId: listing._id,
      negotiationId: updated.id,
      proposedPrice: offer,
      floor: ev.floor,
      ceiling: ev.ceiling,
      belowFloor: false,
      needsSellerDecision: false,
      round: updated.round,
    },
  };
}

export function applySellerContext(opts) {
  opts = opts || {};
  var listingId = opts.listingId;
  var sellerId = opts.sellerId;
  var listing = listingId ? localGetListing(listingId) : null;
  if (!listing) {
    return {
      reply:
        'Abre uma das tuas publicações para eu mostrar interesses e propostas.',
      domain: { status: 'need_listing', role: 'seller' },
    };
  }
  var title = listing.title || 'esta publicação';
  var ask = Number(listing.price) || 0;
  var floor = getListingFloor(listing);
  var negs = listNegotiations(sellerId) || [];
  var open = [];
  var below = [];
  for (var i = 0; i < negs.length; i++) {
    var n = negs[i];
    if (n.listingId !== listingId) continue;
    if (n.state === 'closed' || n.state === 'matched') continue;
    if (n.belowFloor && n.proposedPrice != null) below.push(n);
    else open.push(n);
  }
  var lines = [];
  lines.push(
    'Estás no lado do vendedor de «' +
      title +
      '» (' +
      fmtKz(ask) +
      '). Eu negoceio com os interessados — eles não vêem o teu contacto.'
  );
  if (floor != null) {
    lines.push('O teu mínimo é ' + fmtKz(floor) + '. Só fecho até esse valor.');
  }
  if (below.length) {
    lines.push(
      'Tens ' +
        below.length +
        ' oferta(s) abaixo do mínimo — vê no Fluxo e aceita só se quiseres.'
    );
  } else if (open.length) {
    lines.push(
      'Há ' +
        open.length +
        ' interesse(s) ou proposta(s) em curso. O Fluxo mostra o que podes aceitar.'
    );
  } else {
    lines.push(
      'Ainda não há propostas nesta publicação. Quando alguém falar comigo, aparece no Fluxo.'
    );
  }
  lines.push('Para impulsionar no Feed: Divulgar em massa no detalhe (aí passa a anúncio).');
  return {
    reply: lines.join(' '),
    domain: {
      status: 'seller_context',
      role: 'seller',
      listingId: listing._id || listingId,
      openCount: open.length,
      belowFloorCount: below.length,
      ask: ask,
      floor: floor,
    },
  };
}
