/**
 * Mediação Minguito em modo api — única via para formalizar preço.
 * Comprador/vendedor falam com o Minguito; setProposedPrice só daqui.
 * Até 3 voltas (round) alinhadas a MAX_AUTO_ROUNDS do motor.
 */
import {
  openNegotiation,
  findOpenForListing,
  setProposedPrice,
  listNegotiations,
  evaluateProposal,
  isListingNegotiable,
  isListingOnMarket,
} from './negotiations.js';
import { fetchListingById } from './listings.js';
import { extractOfferKz } from '../local/minguito-protocol.js';
import { fmtKz } from '../core/format.js';
import { resolveUserId, sameUserId } from '../core/user-id.js';
import { MAX_AUTO_ROUNDS } from '../local/negotiations.js';

export async function mediateBuyerMessage(input) {
  input = input || {};
  var buyerId = resolveUserId();
  if (!buyerId) {
    return {
      reply: 'Entra na conta para eu negociar contigo.',
      domain: { status: 'need_auth', role: 'buyer' },
    };
  }

  var listingId = input.listingId;
  if (!listingId) {
    return {
      reply:
        'Abre uma publicação no Feed e toca em «Negociar com o Minguito». Sem anúncio, não fecho preço.',
      domain: { status: 'need_listing', role: 'buyer' },
    };
  }

  var listing;
  try {
    listing = await fetchListingById(listingId);
  } catch (e) {
    return {
      reply: 'Não encontrei essa publicação.',
      domain: { status: 'need_listing', role: 'buyer' },
    };
  }

  if (!isListingOnMarket(listing)) {
    return {
      reply: 'Esta publicação já não está no mercado. Escolhe outra no Feed.',
      domain: { status: 'listing_unavailable', listingId: listingId },
    };
  }

  if (listing.authorId && sameUserId(listing.authorId, buyerId)) {
    return {
      reply:
        'Isto é teu. No lado do vendedor eu mostro o que está no Fluxo — não negocias contigo.',
      domain: { status: 'own_listing', role: 'buyer' },
    };
  }

  var text = String(input.message || '');
  var offer = extractOfferKz(text);

  var neg;
  try {
    neg = await findOpenForListing(listingId, buyerId);
    if (!neg) {
      neg = await openNegotiation({
        listingId: listingId,
        buyerId: buyerId,
        sellerId: listing.authorId || null,
      });
    }
  } catch (err) {
    return {
      reply: (err && err.message) || 'Não consegui abrir a negociação.',
      domain: { status: 'error' },
    };
  }

  var ask =
    neg.listingPrice != null ? Number(neg.listingPrice) : Number(listing.price) || 0;
  var title = listing.title || 'esta publicação';
  var round = Number(neg.round) || 0;
  var maxR = Number(neg.maxAutoRounds) || MAX_AUTO_ROUNDS;

  if (offer == null) {
    return {
      reply:
        'Sou o Minguito e só eu levo o preço ao vendedor. Diz quanto queres oferecer em Kz (ex.: 45000). Temos até ' +
        maxR +
        ' voltas para alinhar antes de eu formalizar o que for possível.',
      domain: {
        status: 'need_price',
        listingId: listingId,
        negotiationId: neg.id,
        round: round,
        maxRounds: maxR,
      },
    };
  }

  if (!isListingNegotiable(listing) && listing.negotiable === false) {
    return {
      reply:
        'O preço de «' +
        title +
        '» é fixo (' +
        fmtKz(ask) +
        '). Não há desconto por aqui. O vendedor trata no Fluxo se quiser seguir — sem contacto directo.',
      domain: { status: 'not_negotiable', listingId: listingId, ask: ask },
    };
  }

  /* Já formalizou e espera vendedor */
  if (
    neg.proposedPrice != null &&
    (neg.needsSellerDecision || neg.state === 'pending_seller')
  ) {
    return {
      reply:
        'Já levei ' +
        fmtKz(Number(neg.proposedPrice)) +
        ' ao vendedor. Ele decide no Fluxo. Se quiseres outro valor, diz-me e eu trato de nova proposta (ainda dentro das voltas).',
      domain: {
        status: 'waiting_seller',
        negotiationId: neg.id,
        proposedPrice: Number(neg.proposedPrice),
      },
    };
  }

  if (neg.state === 'matched') {
    return {
      reply: 'O acordo já foi confirmado. Vê o Combinámos no Fluxo.',
      domain: { status: 'matched', negotiationId: neg.id },
    };
  }

  /* Formalizar via Minguito (única via) */
  var updated;
  try {
    updated = await setProposedPrice(neg.id, offer);
  } catch (err2) {
    return {
      reply: (err2 && err2.message) || 'Não consegui registar a proposta.',
      domain: { status: 'error', negotiationId: neg.id },
    };
  }

  var ev;
  try {
    ev = evaluateProposal(updated, offer);
  } catch (e3) {
    ev = { outcome: 'needs_seller' };
  }

  var newRound = Number(updated.round) || round + 1;

  if (ev.outcome === 'below_floor') {
    return {
      reply:
        'A oferta de ' +
        fmtKz(offer) +
        ' ficou abaixo do mínimo do vendedor. Eu não fecho sozinho — ficou no Fluxo dele. Podes propor outro valor aqui (volta ' +
        newRound +
        ' de ' +
        maxR +
        ').',
      domain: {
        status: 'below_floor',
        negotiationId: updated.id,
        proposedPrice: offer,
        round: newRound,
        maxRounds: maxR,
      },
    };
  }

  if (ev.outcome === 'needs_seller' || newRound >= maxR) {
    return {
      reply:
        'Volta ' +
        newRound +
        '/' +
        maxR +
        ': registei ' +
        fmtKz(offer) +
        ' por «' +
        title +
        '» (pedido ' +
        fmtKz(ask) +
        '). Enviei ao vendedor pelo Fluxo. Ele confirma ou recusa — vocês não falam um com o outro.',
      domain: {
        status: 'needs_seller',
        negotiationId: updated.id,
        proposedPrice: offer,
        round: newRound,
        maxRounds: maxR,
        needsSellerDecision: true,
      },
    };
  }

  return {
    reply:
      'Volta ' +
      newRound +
      '/' +
      maxR +
      ': anotei ' +
      fmtKz(offer) +
      ' (pedido ' +
      fmtKz(ask) +
      '). Ainda podemos alinhar. Diz se queres ajustar; quando estiver fechado do teu lado, eu deixo no Fluxo do vendedor.',
    domain: {
      status: 'offer_ok',
      negotiationId: updated.id,
      proposedPrice: offer,
      round: newRound,
      maxRounds: maxR,
    },
  };
}

export async function mediateSellerMessage(input) {
  input = input || {};
  var sellerId = resolveUserId();
  if (!sellerId) {
    return {
      reply: 'Entra na conta para ver os interesses.',
      domain: { status: 'need_auth', role: 'seller' },
    };
  }
  var listingId = input.listingId;
  if (!listingId) {
    return {
      reply: 'Abre uma das tuas publicações para eu mostrar o que está a decorrer.',
      domain: { status: 'need_listing', role: 'seller' },
    };
  }

  var negs = [];
  try {
    negs = (await listNegotiations(sellerId)) || [];
  } catch (e) {
    negs = [];
  }
  var open = negs.filter(function (n) {
    return (
      n.listingId === listingId &&
      n.state !== 'closed' &&
      sameUserId(n.sellerId, sellerId)
    );
  });

  if (!open.length) {
    return {
      reply:
        'Ainda não há propostas nesta publicação. Quando um comprador negociar comigo, aparece no Fluxo.',
      domain: { status: 'no_offers', listingId: listingId },
    };
  }

  var lines = open.map(function (n) {
    var p =
      n.proposedPrice != null ? fmtKz(Number(n.proposedPrice)) : 'ainda sem valor';
    return '· ' + p + ' — estado: ' + (n.state || '');
  });

  return {
    reply:
      'Há ' +
      open.length +
      ' negociação(ões) nesta publicação. Decisões (aceitar/recusar) são no Fluxo — eu continuo a ser o intermediário.\n' +
      lines.join('\n'),
    domain: { status: 'seller_summary', listingId: listingId, count: open.length },
  };
}
