/**
 * Fluxo — guia simples.
 * Listas em ecrã cheio com Voltar. Linhas: título + chevron.
 */
import { getSession } from '../../state/session.js';
import { resolveUserId } from '../../core/user-id.js';
import { buildContinuityItems } from '../../local/continuity.js';
import { navigate } from '../../core/router.js';
import { isLocalMode } from '../../config.js';
import { createDemandOffer, listOffersBySeller } from '../../local/demand-offers.js';
import {
  confirmAsSeller,
  rejectAsSeller,
  sweepExpiredNegotiations,
} from '../../api/negotiations.js';
import { fmtKz } from '../../core/format.js';
import { ensureDemandSeed } from '../../local/demands.js';
import { pageHeaderHtml } from '../../components/page-header.js';
import { COPY } from '../../constants/copy.js';
import { backButtonHtml } from '../../components/icons.js';
import { dashboardForAuthor, statsForListing } from '../../local/listing-stats.js';

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function chevron() {
  return (
    '<svg class="mc-fx-chevron" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18l6-6-6-6"/></svg>'
  );
}

function humanTitle(it) {
  return String(it.title || '').replace(/^Procura:\s*/i, '');
}

function humanHint(it) {
  var d = String(it.changed || '');
  if (it.role === 'buyer') {
    if (/Demonstraste|interesse registado|à espera/i.test(d))
      return 'O teu interesse está registado';
    if (/negoci/i.test(d)) return 'Ainda a alinhar o preço com o Minguito';
    if (/acordo|confirmado/i.test(d)) return 'Negócio fechado';
    return 'Segue no Minguito';
  }
  if (/Encerra em|Tempo esgotado|48 horas/i.test(d))
    return d.split('—')[0].trim() || 'Tempo a esgotar';
  if (/abaixo do teu mínimo|abaixo do mínimo/i.test(d))
    return 'Oferta abaixo do teu mínimo';
  if (/precisa do teu ok|Proposta de/i.test(d)) return 'Precisa do teu ok';
  if (/Há uma pessoa interessada|interessou-se|Alguém ofereceu/i.test(d))
    return 'Alguém interessou-se';
  if (/encaixa|bate certo/i.test(d)) return 'Encaixa no que tu tens';
  if (/parecid|pode servir/i.test(d)) return 'Pode servir';
  if (/negoci/i.test(d)) return 'Minguito a tratar do preço';
  if (/acordo|confirmado|fechado/i.test(d)) return 'Negócio fechado';
  if (/abaixo do mínimo/i.test(d)) return 'Oferta abaixo do teu mínimo';
  if (/resposta/i.test(d) || /Minguito trata/i.test(d))
    return 'Já há resultado — toca para ver';
  if (/procura continua/i.test(d)) return 'Ainda à procura no bairro';
  if (/oferta/i.test(d)) return 'Há uma proposta';
  return 'Toca para ver';
}

/** Texto de procura: orientação clara se já há resultado. */
function demandHint(it) {
  var d = String(it.changed || '');
  var n = 0;
  var m = d.match(/(\d+)\s*resposta/);
  if (m) n = Number(m[1]);
  if (n > 0 || /Minguito trata|resultado|opç/i.test(d)) {
    return n > 0
      ? 'Hoje já temos resultado da tua procura (' + n + '). Toca para ver.'
      : 'Hoje já temos resultado da tua procura. Toca para ver.';
  }
  return 'Ainda não há resultado. O Minguito avisa quando houver.';
}

function closeSheet() {
  var m = document.getElementById('mc-fx-sheet');
  if (m) m.remove();
}

function openSheet(title, contentHtml, onBind) {
  closeSheet();
  var el = document.createElement('div');
  el.id = 'mc-fx-sheet';
  el.className = 'mc-fx-sheet-overlay';
  el.innerHTML =
    '<div class="mc-fx-sheet" role="dialog">' +
    '<div class="mc-fx-sheet-handle" aria-hidden="true"></div>' +
    '<div class="mc-fx-sheet-top">' +
    '<h2 class="mc-fx-sheet-title">' +
    esc(title) +
    '</h2>' +
    '<button type="button" class="mc-fx-sheet-x" data-close aria-label="Fechar">×</button>' +
    '</div>' +
    '<div class="mc-fx-sheet-body">' +
    contentHtml +
    '</div></div>';
  document.body.appendChild(el);
  el.addEventListener('click', function (e) {
    if (e.target === el || e.target.closest('[data-close]')) closeSheet();
  });
  if (typeof onBind === 'function') onBind(el);
}

export async function renderActivities(root) {
  var uid = resolveUserId();

  if (!uid) {
    root.innerHTML =
      pageHeaderHtml(COPY.headerFlows) +
      '<p class="mc-fx-quiet">Entra na conta para ver o teu Fluxo.</p>';
    return;
  }

  if (isLocalMode()) {
    try {
      ensureDemandSeed();
    } catch (e0) {}
  }

  var items = [];
  try {
    items = isLocalMode() ? buildContinuityItems(uid) : [];
  } catch (e) {
    items = [];
  }

  var myOffers = [];
  try {
    myOffers = listOffersBySeller(uid) || [];
  } catch (e2) {}
  var offered = {};
  for (var oi = 0; oi < myOffers.length; oi++) {
    if (myOffers[oi].status !== 'withdrawn') offered[myOffers[oi].demandId] = true;
  }
  items = items.filter(function (it) {
    return !(it.kind === 'opportunity' && offered[it.demandId]);
  });

  var attention = [];
  var myDemands = [];
  var buying = [];
  for (var i = 0; i < items.length; i++) {
    var it = items[i];
    it._idx = i;
    if (it.kind === 'opportunity') {
      attention.push({ it: it, respond: true });
    } else if (it.kind === 'demand') {
      myDemands.push({ it: it });
    } else if (
      it.kind === 'negotiation' &&
      it.role === 'seller' &&
      it.stateLabel !== COPY.stateMatched &&
      it.stateLabel !== COPY.stateClosed
    ) {
      /* R3: abaixo do chão — sem Aceitar (muro); só recusar / outro valor via Minguito */
      var canConfirm =
        !!it.negotiationId &&
        it.proposedPrice != null &&
        !it.belowFloor;
      attention.push({
        it: it,
        confirm: canConfirm ? it.negotiationId : null,
        reject: it.negotiationId && it.proposedPrice != null ? it.negotiationId : null,
        belowFloor: !!it.belowFloor,
      });
    } else if (it.kind === 'negotiation' && it.role === 'buyer') {
      buying.push({ it: it });
    }
  }

  var dash = dashboardForAuthor(uid);
  var T = dash.totals;
  var nAtt = attention.length;

  function paintHome() {
    try {
      sweepExpiredNegotiations();
    } catch (e) {}
    var html =
      pageHeaderHtml(COPY.headerFlows) +
      '<div class="mc-fx">';

    html +=
      '<article class="mc-fx-hero">' +
      '<p class="mc-fx-hero-label">Os teus resultados</p>' +
      '<div class="mc-fx-hero-row">' +
      '<div><b>' +
      T.publications +
      '</b><span>Publicações</span></div>' +
      '<div><b>' +
      T.announcements +
      '</b><span>Anúncios</span></div>' +
      '<div><b>' +
      T.views +
      '</b><span>Vistas</span></div>' +
      '</div>';
    if (nAtt > 0) {
      html +=
        '<p class="mc-fx-hero-alert">' +
        nAtt +
        (nAtt === 1 ? ' oportunidade de negócio' : ' oportunidades de negócio') +
        '</p>';
    }
    html += '</article>';

    if (nAtt > 0) {
      html += '<p class="mc-fx-block-label">Oportunidade de negócio</p>';
      for (var a = 0; a < attention.length; a++) {
        var row = attention[a];
        html +=
          '<button type="button" class="mc-fx-card" data-att="' +
          a +
          '">' +
          '<span class="mc-fx-card-title">' +
          esc(humanTitle(row.it)) +
          '</span>' +
          '<span class="mc-fx-card-hint">' +
          esc(humanHint(row.it)) +
          '</span></button>';
      }
    }

    /* Detalhes (máx. 2) — acima das secções de navegação */
    if (myDemands.length) {
      html += '<div class="mc-fx-preview">';
      html += '<p class="mc-fx-preview-label">O que pedi ao bairro</p>';
      var dMax = Math.min(2, myDemands.length);
      for (var di = 0; di < dMax; di++) {
        var dRow = myDemands[di].it;
        html +=
          '<button type="button" class="mc-fx-preview-row" data-home-dem="' +
          di +
          '">' +
          '<span class="mc-fx-preview-text">' +
          '<span class="mc-fx-preview-name">' +
          esc(humanTitle(dRow)) +
          '</span>' +
          '<span class="mc-fx-preview-hint">' +
          esc(demandHint(dRow)) +
          '</span></span></button>';
      }
      html +=
        '<div class="mc-fx-preview-foot">' +
        '<button type="button" class="mc-fx-ver-todos" id="mc-fx-demands-more">Ver todos</button>' +
        '</div></div>';
    }

    if (buying.length) {
      html += '<div class="mc-fx-preview">';
      html += '<p class="mc-fx-preview-label">Onde mostrei interesse</p>';
      var bMax = Math.min(2, buying.length);
      for (var bi = 0; bi < bMax; bi++) {
        var bRow = buying[bi].it;
        var bImg = bRow.imageUrl || '';
        html +=
          '<button type="button" class="mc-fx-preview-row" data-home-buy="' +
          bi +
          '">' +
          '<span class="mc-fx-preview-text">' +
          '<span class="mc-fx-preview-name">' +
          esc(humanTitle(bRow)) +
          '</span>' +
          '<span class="mc-fx-preview-hint">' +
          esc(humanHint(bRow)) +
          '</span></span>' +
          (bImg
            ? '<img class="mc-fx-preview-img" src="' +
              esc(bImg) +
              '" alt="" loading="lazy" />'
            : '<span class="mc-fx-preview-img mc-fx-preview-img--empty" aria-hidden="true"></span>') +
          '</button>';
      }
      html +=
        '<div class="mc-fx-preview-foot">' +
        '<button type="button" class="mc-fx-ver-todos" id="mc-fx-buy-more">Ver todos</button>' +
        '</div></div>';
    }

    /* Secções — navegação limpa, abaixo dos detalhes */
    html +=
      '<button type="button" class="mc-fx-nav" id="mc-fx-pubs">' +
      '<span class="mc-fx-nav-t">Vê as tuas publicações</span>' +
      '<span class="mc-fx-nav-right"><span class="mc-fx-nav-n">+' +
      T.publications +
      '</span>' +
      chevron() +
      '</span></button>';
    html +=
      '<button type="button" class="mc-fx-nav" id="mc-fx-demands">' +
      '<span class="mc-fx-nav-t">O que pedi ao bairro</span>' +
      '<span class="mc-fx-nav-right"><span class="mc-fx-nav-n">+' +
      myDemands.length +
      '</span>' +
      chevron() +
      '</span></button>';
    html +=
      '<button type="button" class="mc-fx-nav" id="mc-fx-buy">' +
      '<span class="mc-fx-nav-t">Onde mostrei interesse</span>' +
      '<span class="mc-fx-nav-right"><span class="mc-fx-nav-n">+' +
      buying.length +
      '</span>' +
      chevron() +
      '</span></button>';
    html +=
      '<button type="button" class="mc-fx-nav mc-fx-nav--ad" id="mc-fx-ads">' +
      '<span class="mc-fx-nav-t">Controla os teus anúncios activos</span>' +
      '<span class="mc-fx-nav-right"><span class="mc-fx-nav-n">+' +
      T.announcements +
      '</span>' +
      chevron() +
      '</span></button>';

    if (!T.publications && !T.announcements) {
      html +=
        '<button type="button" class="mc-btn mc-btn-primary mc-btn-block" id="mc-pub" style="margin-top:20px">Publicar</button>';
    }

    html += '</div>';
    root.innerHTML = html;
    bindHome();
  }

  function bindHome() {
    root.querySelectorAll('[data-att]').forEach(function (btn) {
      btn.onclick = function () {
        openAttention(Number(btn.getAttribute('data-att')));
      };
    });
    var pubs = root.querySelector('#mc-fx-pubs');
    if (pubs)
      pubs.onclick = function () {
        paintListingScreen('Vê as tuas publicações', dash.publications, false);
      };
    var ads = root.querySelector('#mc-fx-ads');
    if (ads)
      ads.onclick = function () {
        paintListingScreen(
          'Controla os teus anúncios activos',
          dash.announcements,
          true
        );
      };
    var dem = root.querySelector('#mc-fx-demands');
    if (dem)
      dem.onclick = function () {
        paintDemandsScreen();
      };
    var demMore = root.querySelector('#mc-fx-demands-more');
    if (demMore)
      demMore.onclick = function (e) {
        e.preventDefault();
        e.stopPropagation();
        paintDemandsScreen();
      };
    var buy = root.querySelector('#mc-fx-buy');
    if (buy)
      buy.onclick = function () {
        paintBuyingScreen();
      };
    var buyMore = root.querySelector('#mc-fx-buy-more');
    if (buyMore)
      buyMore.onclick = function (e) {
        e.preventDefault();
        e.stopPropagation();
        paintBuyingScreen();
      };
    root.querySelectorAll('[data-home-dem]').forEach(function (btn) {
      btn.onclick = function () {
        var row = myDemands[Number(btn.getAttribute('data-home-dem'))].it;
        if (row.href && row.href !== '/activities') navigate(row.href);
      };
    });
    root.querySelectorAll('[data-home-buy]').forEach(function (btn) {
      btn.onclick = function () {
        var row = buying[Number(btn.getAttribute('data-home-buy'))].it;
        if (row.href && row.href !== '/activities') navigate(row.href);
      };
    });
    var pub = root.querySelector('#mc-pub');
    if (pub)
      pub.onclick = function () {
        navigate('/create');
      };
  }

  function paintListingScreen(title, list, isAd) {
    var html =
      backButtonHtml('mc-fx-back') +
      '<div class="mc-fx-page">' +
      '<h1 class="mc-fx-page-title">' +
      esc(title) +
      '</h1>';

    if (!list.length) {
      html +=
        '<p class="mc-fx-quiet">' +
        (isAd
          ? 'Ainda não tens anúncios activos. Numa publicação, usa «Divulgar em massa».'
          : 'Ainda não publicaste. Podes começar em Publicar.') +
        '</p>';
      if (!isAd) {
        html +=
          '<button type="button" class="mc-btn mc-btn-primary mc-btn-block" id="mc-page-create">Publicar</button>';
      }
    } else {
      html += '<div class="mc-fx-grid">';
      for (var i = 0; i < list.length; i++) {
        var st = list[i];
        var img =
          st.imageUrl ||
          (st.listing &&
            (st.listing.imageUrl ||
              (st.listing.imageUrls && st.listing.imageUrls[0]))) ||
          '';
        html +=
          '<button type="button" class="mc-fx-tile" data-id="' +
          esc(st.listingId) +
          '">' +
          (img
            ? '<img class="mc-fx-tile-img" src="' +
              esc(img) +
              '" alt="" loading="lazy" />'
            : '<div class="mc-fx-tile-img mc-fx-tile-img--empty" aria-hidden="true"></div>') +
          '<span class="mc-fx-tile-body">' +
          '<span class="mc-fx-tile-name">' +
          esc(st.title || 'Sem nome') +
          '</span>' +
          '<span class="mc-fx-tile-meta">' +
          esc(fmtKz(st.price || 0)) +
          ' · ' +
          st.views +
          ' vistas</span></span></button>';
      }
      html += '</div>';
    }
    html += '</div>';
    root.innerHTML = html;
    root.querySelector('#mc-fx-back').onclick = paintHome;
    var c = root.querySelector('#mc-page-create');
    if (c)
      c.onclick = async function () {
        navigate('/create');
      };
    root.querySelectorAll('[data-id]').forEach(function (btn) {
      btn.onclick = function () {
        paintPerfScreen(btn.getAttribute('data-id'), title, list, isAd);
      };
    });
  }

  function paintPerfScreen(listingId, backTitle, list, isAd) {
    var st = statsForListing(listingId);
    var kind = st.isAnuncio ? 'Anúncio' : 'Publicação';
    var img = st.imageUrl || '';
    var html =
      backButtonHtml('mc-fx-back') +
      '<div class="mc-fx-page">' +
      (img
        ? '<img class="mc-fx-perf-hero" src="' + esc(img) + '" alt="" />'
        : '') +
      '<p class="mc-fx-sheet-badge">' +
      esc(kind) +
      '</p>' +
      '<h1 class="mc-fx-page-title">' +
      esc(st.title || kind) +
      '</h1>' +
      '<div class="mc-fx-sheet-stats">' +
      '<div><b>' +
      st.views +
      '</b><span>Visualizações</span></div>' +
      '<div><b>' +
      st.clicks +
      '</b><span>Cliques</span></div>' +
      '<div><b>' +
      st.interests +
      '</b><span>Interesses</span></div>' +
      '<div><b>' +
      st.minguitoConversations +
      '</b><span>Minguito</span></div>' +
      '</div>' +
      '<div class="mc-fx-sheet-actions" style="margin-top:16px">' +
      (st.isAnuncio
        ? ''
        : '<button type="button" class="mc-btn mc-btn-primary mc-btn-block" data-go-boost="' +
          esc(listingId) +
          '">Divulgar em massa</button>') +
      '<button type="button" class="mc-btn mc-btn-secondary mc-btn-block" data-go-l="' +
      esc(listingId) +
      '">Ver no Feed</button>' +
      '<button type="button" class="mc-btn mc-btn-secondary mc-btn-block" data-go-m="' +
      esc(listingId) +
      '">Minguito</button></div></div>';
    root.innerHTML = html;
    root.querySelector('#mc-fx-back').onclick = function () {
      paintListingScreen(backTitle, list, isAd);
    };
    var boost = root.querySelector('[data-go-boost]');
    if (boost)
      boost.onclick = function () {
        navigate('/listing/' + listingId);
      };
    root.querySelector('[data-go-l]').onclick = function () {
      navigate('/listing/' + listingId);
    };
    root.querySelector('[data-go-m]').onclick = function () {
      navigate('/services?listingId=' + encodeURIComponent(listingId));
    };
  }

  function paintNumbersScreen() {
    var html =
      backButtonHtml('mc-fx-back') +
      '<div class="mc-fx-page">' +
      '<h1 class="mc-fx-page-title">Os teus resultados</h1>' +
      '<p class="mc-fx-quiet">Como as tuas publicações e anúncios estão a correr no Mucula.</p>' +
      '<p class="mc-fx-block-label">Alcance</p>' +
      '<div class="mc-fx-sheet-stats">' +
      '<div><b>' +
      T.views +
      '</b><span>Visualizações</span></div>' +
      '<div><b>' +
      T.clicks +
      '</b><span>Cliques</span></div>' +
      '</div>' +
      '<p class="mc-fx-block-label">Interesse</p>' +
      '<div class="mc-fx-sheet-stats">' +
      '<div><b>' +
      T.interests +
      '</b><span>Interesses</span></div>' +
      '<div><b>' +
      T.minguitoConversations +
      '</b><span>Conversas Minguito</span></div>' +
      '</div>' +
      '<div class="mc-fx-retention-card">' +
      '<span class="mc-fx-retention-label">Retenção</span>' +
      '<strong class="mc-fx-retention-val">' +
      T.retentionPct +
      '%</strong>' +
      '<span class="mc-fx-retention-hint">De quem viu, quantos mostraram interesse</span>' +
      '</div></div>';
    root.innerHTML = html;
    root.querySelector('#mc-fx-back').onclick = paintHome;
  }

  function paintDemandsScreen() {
    var html =
      backButtonHtml('mc-fx-back') +
      '<div class="mc-fx-page mc-fx-page--flush">' +
      '<h1 class="mc-fx-page-title">O que pedi ao bairro</h1>' +
      '<p class="mc-fx-quiet">As tuas procuras e o que o Mucula já encontrou.</p>';
    if (!myDemands.length) {
      html +=
        '<p class="mc-fx-quiet">Ainda não tens procura. Em Publicar escolhe «Estou à procura».</p>' +
        '<button type="button" class="mc-btn mc-btn-primary mc-btn-block" id="mc-go-procura">Criar procura</button>';
    } else {
      html += '<div class="mc-fx-list">';
      for (var i = 0; i < myDemands.length; i++) {
        var row = myDemands[i].it;
        html +=
          '<button type="button" class="mc-fx-list-item" data-dem="' +
          i +
          '">' +
          '<span class="mc-fx-list-title">' +
          esc(humanTitle(row)) +
          '</span>' +
          '<span class="mc-fx-list-body">' +
          esc(demandHint(row)) +
          '</span>' +
          chevron() +
          '</button>';
      }
      html += '</div>';
    }
    html += '</div>';
    root.innerHTML = html;
    root.querySelector('#mc-fx-back').onclick = paintHome;
    var g = root.querySelector('#mc-go-procura');
    if (g)
      g.onclick = function () {
        navigate('/create/procura');
      };
    root.querySelectorAll('[data-dem]').forEach(function (btn) {
      btn.onclick = function () {
        var row = myDemands[Number(btn.getAttribute('data-dem'))].it;
        if (row.href && row.href !== '/activities') navigate(row.href);
      };
    });
  }

  function paintBuyingScreen() {
    var html =
      backButtonHtml('mc-fx-back') +
      '<div class="mc-fx-page mc-fx-page--flush">' +
      '<h1 class="mc-fx-page-title">Onde mostrei interesse</h1>' +
      '<p class="mc-fx-quiet">Publicações em que já falaste com o Minguito. Ainda pode não haver acordo.</p>';
    if (!buying.length) {
      html +=
        '<p class="mc-fx-quiet">Ainda não mostraste interesse em nenhuma publicação.</p>';
    } else {
      html += '<div class="mc-fx-list">';
      for (var i = 0; i < buying.length; i++) {
        var row = buying[i].it;
        var img = row.imageUrl || '';
        html +=
          '<button type="button" class="mc-fx-list-item mc-fx-list-item--media" data-buy="' +
          i +
          '">' +
          '<span class="mc-fx-list-main">' +
          '<span class="mc-fx-list-title">' +
          esc(humanTitle(row)) +
          '</span>' +
          '<span class="mc-fx-list-body">' +
          esc(humanHint(row)) +
          '</span></span>' +
          (img
            ? '<img class="mc-fx-list-img" src="' +
              esc(img) +
              '" alt="" loading="lazy" />'
            : '<span class="mc-fx-list-img mc-fx-list-img--empty" aria-hidden="true"></span>') +
          '</button>';
      }
      html += '</div>';
    }
    html += '</div>';
    root.innerHTML = html;
    root.querySelector('#mc-fx-back').onclick = paintHome;
    root.querySelectorAll('[data-buy]').forEach(function (btn) {
      btn.onclick = function () {
        var row = buying[Number(btn.getAttribute('data-buy'))].it;
        if (row.href && row.href !== '/activities') navigate(row.href);
      };
    });
  }

  function openAttention(ix) {
    var row = attention[ix];
    if (!row) return;
    var it = row.it;
    var actions = '';
    if (row.belowFloor) {
      actions +=
        '<p class="mc-fx-sheet-text" style="margin-bottom:8px">Proposta abaixo do mínimo — não dá para confirmar. Recusa ou pede outro valor no Minguito.</p>';
      if (row.reject) {
        actions +=
          '<button type="button" class="mc-btn mc-btn-secondary mc-btn-block" data-ok-reject="' +
          esc(row.reject) +
          '">Recusar proposta</button>';
      }
    } else if (row.confirm) {
      actions +=
        '<button type="button" class="mc-btn mc-btn-primary mc-btn-block" data-ok-confirm="' +
        esc(row.confirm) +
        '">Aceitar acordo</button>';
      actions +=
        '<button type="button" class="mc-btn mc-btn-secondary mc-btn-block" data-ok-reject="' +
        esc(row.confirm) +
        '">Recusar proposta</button>';
    }
    if (row.respond) {
      actions +=
        '<button type="button" class="mc-btn mc-btn-primary mc-btn-block" data-ok-respond="' +
        it._idx +
        '">Tenho isto</button>';
    }
    if (it.href && it.href !== '/activities') {
      actions +=
        '<button type="button" class="mc-btn mc-btn-secondary mc-btn-block" data-ok-href="' +
        esc(it.href) +
        '">Abrir Minguito</button>';
    }
    var priceLine =
      it.proposedPrice != null
        ? '<p class="mc-fx-sheet-text"><strong>' +
          esc(String(it.proposedPrice)) +
          ' Kz</strong>' +
          (it.belowFloor ? ' — abaixo do mínimo' : '') +
          '</p>'
        : '';
    var expiryLine =
      it.expiry && it.expiry.warn && it.expiry.label
        ? '<p class="mc-fx-sheet-text" style="color:var(--mc-accent,#d97706)">' +
          esc(it.expiry.label) +
          '</p>'
        : '';
    openSheet(
      humanTitle(it),
      '<p class="mc-fx-sheet-kicker">Oportunidade de negócio</p>' +
        '<p class="mc-fx-sheet-text">' +
        esc(it.changed || humanHint(it)) +
        '</p>' +
        priceLine +
        expiryLine +
        '<p class="mc-error" data-err hidden></p><div class="mc-fx-sheet-actions">' +
        actions +
        '</div>',
      function (el) {
        var err = el.querySelector('[data-err]');
        var c = el.querySelector('[data-ok-confirm]');
        if (c)
          c.onclick = async function () {
            try {
              await confirmAsSeller(c.getAttribute('data-ok-confirm'), uid);
              closeSheet();
              navigate('/combinamos/' + c.getAttribute('data-ok-confirm'));
            } catch (e) {
              if (err) {
                err.hidden = false;
                err.textContent = (e && e.message) || 'Não deu.';
              }
            }
          };
        var rj = el.querySelector('[data-ok-reject]');
        if (rj)
          rj.onclick = function () {
            try {
              rejectAsSeller(rj.getAttribute('data-ok-reject'), uid);
              closeSheet();
              renderActivities(root);
            } catch (e) {
              if (err) {
                err.hidden = false;
                err.textContent = (e && e.message) || 'Não deu.';
              }
            }
          };
        var r = el.querySelector('[data-ok-respond]');
        if (r)
          r.onclick = function () {
            var idx = Number(r.getAttribute('data-ok-respond'));
            var item = items[idx];
            try {
              createDemandOffer({
                demandId: item.demandId,
                sellerId: uid,
                listingId: item.listingId || null,
                message: 'Tenho oferta compatível.',
              });
              closeSheet();
              paintHome();
            } catch (e) {
              if (err) {
                err.hidden = false;
                err.textContent = (e && e.message) || 'Não deu.';
              }
            }
          };
        var h = el.querySelector('[data-ok-href]');
        if (h)
          h.onclick = function () {
            closeSheet();
            navigate(h.getAttribute('data-ok-href'));
          };
      }
    );
  }

  paintHome();
}
