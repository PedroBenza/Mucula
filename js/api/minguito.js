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
  /* Modo api (Vercel/Supabase): sem servidor Node :3000 e sem Grok nesta fase.
   * Resposta determinística — não chama API_URL (evita ERR e CORS falsos). */
  return {
    reply:
      'Sou o Minguito. No servidor ainda não negoceio por chat — isso chega na fase Grok. ' +
      'Por agora: abre a publicação no Feed, segue no Fluxo quando houver proposta, ' +
      'e o acordo continua pelas regras da plataforma (sem contacto directo na app).',
    domain: {
      status: 'api_minguito_pending',
      phase: 'G',
    },
  };
}
