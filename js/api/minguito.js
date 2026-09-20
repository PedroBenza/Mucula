import { isLocalMode } from '../config.js';
import { localTalkToMinguito, localGetListings } from '../local/store.js';
import { getDemand } from '../local/demands.js';
import { matchDemandToListingsLimited } from '../domain/match-demand.js';
import { track } from '../local/telemetry.js';
import { applyBuyerOffer, applySellerContext } from '../local/minguito-protocol.js';
import { localGetListing } from '../local/store.js';
import { getSession } from '../state/session.js';
import { filterOnMarket } from '../domain/listing-market.js';
import { resolveUserId, sameUserId } from '../core/user-id.js';

function itemsFromListings(list) {
  return (list || []).map(function (l) {
    return {
      listingId: l._id,
      title: l.title,
      price: l.price,
      neighborhood: (l.location && l.location.neighborhood) || '',
      imageUrl: l.imageUrl,
    };
  });
}

/** Paridade: POST /minguito/message → { reply, domain? } */
export async function talkToMinguito(input) {
  input = input || {};
  if (isLocalMode()) {
    var demandId = input.demandId;
    var listingId = input.listingId;
    var buyerId = resolveUserId();
    if (!buyerId) {
      return {
        reply: 'Entra na conta para falar com o Minguito.',
        domain: { status: 'need_auth' },
      };
    }

    /* Publicação com contexto: papel vendedor vs comprador */
    if (listingId && !demandId) {
      try {
        var listing = localGetListing(listingId);
        var authorId =
          listing && (listing.authorId || listing.userId);
        var isSeller = sameUserId(authorId, buyerId);
        var out = isSeller
          ? applySellerContext({
              listingId: listingId,
              sellerId: buyerId,
              message: input.message,
            })
          : applyBuyerOffer({
              listingId: listingId,
              buyerId: buyerId,
              message: input.message,
            });
        track('minguito_protocol', {
          listingId: listingId,
          status: out.domain && out.domain.status,
          role: isSeller ? 'seller' : 'buyer',
        });
        return out;
      } catch (e) {
        return {
          reply:
            (e && e.message) ||
            'Não consegui negociar agora. Tenta outra vez.',
          domain: { status: 'error' },
        };
      }
    }

    if (demandId) {
      var demand = getDemand(demandId);
      if (!demand) {
        return {
          reply: 'Não encontrei esse pedido.',
          domain: { status: 'error' },
        };
      }
      var matches = matchDemandToListingsLimited(demand, filterOnMarket(localGetListings()), 8);
      var items = itemsFromListings(matches);
      track('demand_match_shown', { demandId: demandId, n: items.length });
      var msg = String(input.message || '').trim().toLowerCase();
      var intro =
        'Pedido «' +
        demand.title +
        '»' +
        (demand.neighborhood ? ' em ' + demand.neighborhood : '') +
        (demand.budgetMax != null ? ' até ' + demand.budgetMax + ' Kz' : '') +
        '. ';
      if (!items.length) {
        return {
          reply:
            intro +
            'Ainda não há oferta activa a bater certo. O pedido continua — quando houver, eu mostro aqui.',
          domain: { status: 'results', items: [], demandId: demandId },
        };
      }
      if (
        !msg ||
        msg === 'olá' ||
        msg === 'ola' ||
        msg.indexOf('opç') >= 0 ||
        msg.indexOf('mostra') >= 0
      ) {
        return {
          reply:
            intro +
            'Encontrei ' +
            items.length +
            ' opção(ões). Abre uma e negoceia comigo — sem contacto directo com o vendedor.',
          domain: { status: 'results', items: items, demandId: demandId },
        };
      }
      return {
        reply:
          intro +
          'Tenho ' +
          items.length +
          ' opções reais. Escolhe uma e diz-me quanto queres oferecer.',
        domain: { status: 'results', items: items, demandId: demandId },
      };
    }

    return localTalkToMinguito(input);
  }
  /* Modo api: mediação determinística (sem Grok). Preço só via Minguito. */
  const { mediateBuyerMessage, mediateSellerMessage } = await import('./minguito-mediate.js');
  const { fetchListingById } = await import('./listings.js');
  const { sameUserId, resolveUserId } = await import('../core/user-id.js');

  var listingId = input.listingId;
  var demandId = input.demandId;
  var uid = resolveUserId();
  if (!uid) {
    return {
      reply: 'Entra na conta para falar com o Minguito.',
      domain: { status: 'need_auth' },
    };
  }

  if (listingId && !demandId) {
    try {
      var listing = await fetchListingById(listingId);
      var isSeller = sameUserId(listing && listing.authorId, uid);
      if (isSeller) return mediateSellerMessage(input);
      return mediateBuyerMessage(input);
    } catch (e) {
      return mediateBuyerMessage(input);
    }
  }

  return {
    reply:
      'Abre uma publicação no Feed e escolhe «Negociar com o Minguito». Eu trato do preço — sem contacto directo entre vocês.',
    domain: { status: 'need_listing' },
  };
}
