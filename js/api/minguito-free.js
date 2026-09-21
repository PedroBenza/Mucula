/**
 * Conversa livre Minguito (sem listingId) — api.
 * Busca leve no feed quando há intenção de produto; senão texto base + voz Groq.
 */
import { getSupabase } from './supabase-client.js';

function norm(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function isGreeting(msg) {
  var m = norm(msg).trim();
  return /^(oi|ola|olá|hey|e ai|eai|bom dia|boa tarde|boa noite|como estas|como estás|tudo bem|td bem)\b/.test(
    m
  ) || m === 'hi' || m === 'hello';
}

function isWhatDoYouDo(msg) {
  var m = norm(msg);
  return (
    m.indexOf('o que faz') >= 0 ||
    m.indexOf('o que vc faz') >= 0 ||
    m.indexOf('o que voce faz') >= 0 ||
    m.indexOf('quem es') >= 0 ||
    m.indexOf('quem e') >= 0 ||
    m.indexOf('para que serves') >= 0
  );
}

/** Extrai pedido de produto simples */
function extractWant(msg) {
  var m = String(msg || '').trim();
  var n = norm(m);
  var patterns = [
    /(?:quero|preciso|procuro|anda\s+me|anda)\s+(?:de\s+|um\s+|uma\s+|uns\s+|umas\s+)?(.{2,40})/i,
    /(?:tens|tem|ha|há)\s+(.{2,40})/i,
  ];
  for (var i = 0; i < patterns.length; i++) {
    var match = m.match(patterns[i]);
    if (match && match[1]) {
      return match[1].replace(/[?.!]+$/, '').trim();
    }
  }
  if (n.length >= 3 && n.length <= 40 && !isGreeting(m) && !isWhatDoYouDo(m)) {
    if (
      /telefone|telemovel|iphone|samsung|gas|gás|buba|carro|moto|roupa|sapat|geladeira|tv\b/.test(
        n
      )
    ) {
      return m;
    }
  }
  return null;
}

async function searchListingsHint(query) {
  try {
    const sb = getSupabase();
    const q = String(query || '').trim().slice(0, 40);
    if (!q) return [];
    /* RPC feed se existir; senão select simples */
    var { data, error } = await sb.rpc('listings_feed', {
      p_limit: 5,
      p_query: q,
    });
    if (error || !data) {
      var res = await sb
        .from('listings')
        .select('id, title, price, status')
        .eq('status', 'disponivel')
        .ilike('title', '%' + q + '%')
        .limit(5);
      data = res.data;
    }
    return (data || []).slice(0, 3).map(function (row) {
      return {
        listingId: row.id,
        title: row.title,
        price: row.price != null ? Number(row.price) : null,
      };
    });
  } catch (e) {
    return [];
  }
}

/**
 * @returns {Promise<{ reply: string, domain: object }>}
 */
export async function handleFreeChat(input) {
  input = input || {};
  var msg = String(input.message || '').trim();
  var domain = { status: 'free_chat' };

  if (!msg) {
    return {
      reply:
        'Olá. Diz-me o que procuras no bairro ou abre uma publicação no Feed para negociarmos o preço.',
      domain: domain,
    };
  }

  if (isGreeting(msg)) {
    return {
      reply:
        'Olá — tudo bem. Procuras alguma coisa no bairro ou já viste uma publicação no Feed para tratarmos do preço?',
      domain: Object.assign({}, domain, { intent: 'greeting' }),
    };
  }

  if (isWhatDoYouDo(msg)) {
    return {
      reply:
        'Sou o Minguito: faço a ponte do preço entre quem vende e quem compra no Mucula. Vocês não trocam contacto aqui — escolhes uma publicação no Feed, negocias comigo, e o vendedor confirma no Fluxo.',
      domain: Object.assign({}, domain, { intent: 'about' }),
    };
  }

  var want = extractWant(msg);
  if (want) {
    var items = await searchListingsHint(want);
    domain.intent = 'search';
    domain.query = want;
    domain.items = items;
    if (items.length) {
      var bits = items.map(function (it, i) {
        var p =
          it.price != null
            ? ' — ' + Number(it.price).toLocaleString('pt-AO') + ' Kz'
            : '';
        return it.title + p;
      });
      return {
        reply:
          'Para «' +
          want +
          '» encontrei no mercado: ' +
          bits.join('; ') +
          '. Abre a que te interessar no Feed e toca em «Negociar com o Minguito» — aí tratamos do valor em Kz, sem contacto directo.',
        domain: domain,
      };
    }
    return {
      reply:
        'Entendi que procuras «' +
        want +
        '». No Feed vês o que há de real no bairro agora. Quando escolheres uma publicação, toca em «Negociar com o Minguito» e eu trato do preço contigo.',
      domain: domain,
    };
  }

  if (/o que ha|o que há|o que e que ha|para mim|sugere/.test(norm(msg))) {
    return {
      reply:
        'Depende do que precisas — telemóvel, gás, serviço, outra coisa. Diz a categoria ou abre o Feed: lá está o que o bairro está a publicar agora.',
      domain: Object.assign({}, domain, { intent: 'explore' }),
    };
  }

  return {
    reply:
      'Posso ajudar a encontrar no Feed ou a negociar o preço duma publicação concreta. Diz o que procuras (ex.: telemóvel, gás) ou abre um anúncio e escolhe «Negociar com o Minguito».',
    domain: domain,
  };
}
