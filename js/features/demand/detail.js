/**
 * Detalhe da procura — caminho alinhado a Publicar (claro, poucos CTAs).
 */
import { getDemand, updateDemandStatus } from '../../api/demands.js';
import { localGetListings } from '../../local/store.js';
import { matchDemandTiersLimited } from '../../domain/match-demand.js';
import { navigate } from '../../core/router.js';
import { fmtCardPrice } from '../../shared/format-price.js';
import { CATEGORIES } from '../../constants/categories.js';
import { openNegotiation } from '../../api/negotiations.js';
import { getSession } from '../../state/session.js';
import { resolveUserId } from '../../core/user-id.js';
import { listOffersForDemand } from '../../local/demand-offers.js';
import { demandLabel } from '../../domain/human-state.js';
import { backButtonHtml } from '../../components/icons.js';

var POLL_MS = 4000;

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function catLabel(key) {
  for (var i = 0; i < CATEGORIES.length; i++) {
    if (CATEGORIES[i].key === key) return CATEGORIES[i].label;
  }
  return key || '';
}

function tierSignature(tiers) {
  function ids(arr) {
    return (arr || [])
      .map(function (l) {
        return l._id;
      })
      .join(',');
  }
  return ids(tiers.exact) + '#' + ids(tiers.near);
}

function cardListing(l, badge) {
  var nb = (l.location && l.location.neighborhood) || '';
  var img =
    l.imageUrl || (l.imageUrls && l.imageUrls[0]) || '';
  return (
    '<button type="button" class="mc-dd-card" data-lid="' +
    esc(l._id) +
    '">' +
    (img
      ? '<img class="mc-dd-card-img" src="' + esc(img) + '" alt="" loading="lazy" />'
      : '<span class="mc-dd-card-img mc-dd-card-img--empty" aria-hidden="true"></span>') +
    '<span class="mc-dd-card-body">' +
    '<span class="mc-dd-card-title">' +
    esc(l.title || '') +
    '</span>' +
    '<span class="mc-dd-card-meta">' +
    esc(fmtCardPrice(l.price)) +
    ' Kz' +
    (nb ? ' · ' + esc(nb) : '') +
    (badge ? ' · ' + esc(badge) : '') +
    '</span></span></button>'
  );
}

export async function renderDemandDetail(root, id) {
  if (root._mcDemandCleanup) {
    try {
      root._mcDemandCleanup();
    } catch (e) {}
    root._mcDemandCleanup = null;
  }

  var demand = await getDemand(id);
  if (!demand) {
    root.innerHTML =
      backButtonHtml('mc-dx') +
      '<p class="mc-muted" style="margin-top:12px">Procura não encontrada.</p>';
    root.querySelector('#mc-dx').onclick = function () {
      navigate('/activities');
    };
    return;
  }

  var lastSig = null;
  var timer = null;

  function getTiers() {
    var listings = [];
    try {
      listings = localGetListings();
    } catch (e) {
      listings = [];
    }
    return matchDemandTiersLimited(demand, listings, 8, 5);
  }

  function cleanup() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
    if (root._mcDdCarousel) {
      clearInterval(root._mcDdCarousel);
      root._mcDdCarousel = null;
    }
    root._mcDemandCleanup = null;
  }

  function paint(tiers, opts) {
    opts = opts || {};
    var offers = listOffersForDemand(demand.id) || [];
    var exact = tiers.exact || [];
    var near = tiers.near || [];
    var active = demand.status === 'active';

    var meta = [];
    if (demand.category) meta.push(catLabel(demand.category));
    if (demand.neighborhood) meta.push(demand.neighborhood);
    if (demand.budgetMax != null)
      meta.push('até ' + fmtCardPrice(demand.budgetMax) + ' Kz');

    var html =
      backButtonHtml('mc-dd-back') +
      '<div class="mc-dd">' +
      '<div class="mc-hero mc-dd-hero-banner" id="mc-dd-banner">' +
      '<div class="mc-hero-bg">' +
      '<img class="mc-hero-img" id="mc-dd-banner-img" src="./assets/minguito/minguito-binoculos.png" alt="" />' +
      '</div></div>' +
      '<div class="mc-dd-box">' +
      '<div class="mc-dd-box-top">' +
      '<div class="mc-dd-box-text">' +
      '<h1 class="mc-dd-title">' +
      esc(demand.title) +
      '</h1>' +
      (meta.length
        ? '<p class="mc-dd-meta">' + esc(meta.join(' · ')) + '</p>'
        : '') +
      '<p class="mc-dd-status">' +
      esc(demandLabel(demand.status) || demand.status) +
      '</p></div>' +
      '<img class="mc-dd-aponta" src="./assets/minguito/minguito-aponta.png" alt="" />' +
      '</div>';

    if (opts.updated && active) {
      html += '<p class="mc-dd-flash">Resultados actualizados</p>';
    }

    if (offers.length) {
      html +=
        '<section class="mc-dd-sec">' +
        '<h2 class="mc-dd-sec-title">Quem respondeu</h2>' +
        '<p class="mc-dd-sec-body">Vendedores que disseram ter o que precisas.</p>';
      for (var o = 0; o < offers.length; o++) {
        html +=
          '<div class="mc-dd-offer">' +
          esc(offers[o].message || 'Tenho oferta compatível.') +
          '</div>';
      }
      html += '</section>';
    }

    if (active) {
      if (!exact.length && !near.length) {
        html +=
          '<section class="mc-dd-sec">' +
          '<h2 class="mc-dd-sec-title">Ainda sem opções certas</h2>' +
          '<p class="mc-dd-sec-body">O Mucula continua a cruzar com o que há no bairro. Podes actualizar ou falar com o Minguito.</p>' +
          '<p class="mc-dd-poll" id="mc-dd-poll">A verificar…</p></section>';
      } else {
        if (exact.length) {
          html +=
            '<section class="mc-dd-sec">' +
            '<h2 class="mc-dd-sec-title">Encontrámos opções</h2>' +
            '<p class="mc-dd-sec-body">Batém certo com o que pediste.</p>' +
            exact
              .map(function (l) {
                return cardListing(l, null);
              })
              .join('') +
            '</section>';
        }
        if (near.length) {
          html +=
            '<section class="mc-dd-sec">' +
            '<h2 class="mc-dd-sec-title">Próximas do que pediste</h2>' +
            '<p class="mc-dd-sec-body">Outro bairro ou um pouco acima do orçamento.</p>' +
            near
              .map(function (l) {
                return cardListing(l, 'próxima');
              })
              .join('') +
            '</section>';
        }
        html +=
          '<p class="mc-dd-poll" id="mc-dd-poll">Última verificação…</p>';
      }
      html += '</div>'; /* fecha caixa */

      html +=
        '<div class="mc-dd-actions">' +
        '<button type="button" class="mc-btn mc-btn-secondary mc-btn-block" id="mc-dd-refresh">Actualizar agora</button>' +
        '<button type="button" class="mc-btn mc-btn-primary mc-btn-block" id="mc-dd-ming">Encontrar com o Minguito</button>' +
        '<button type="button" class="mc-btn mc-btn-secondary mc-btn-block" id="mc-dd-cancel">Cancelar procura</button>' +
        '</div>';
    } else {
      html +=
        '<p class="mc-dd-sec-body">Esta procura já não está activa.</p></div>' +
        '<button type="button" class="mc-btn mc-btn-primary mc-btn-block" id="mc-dd-flux" style="margin-top:16px">Voltar ao Fluxo</button>';
    }

    html += '</div>';
    root.innerHTML = html;

    /* Banner = mesma arquitectura do hero do Feed (só imagens, sem texto) */
    if (root._mcDdCarousel) {
      clearInterval(root._mcDdCarousel);
      root._mcDdCarousel = null;
    }
    var bannerImg = root.querySelector('#mc-dd-banner-img');
    var pool = [
      './assets/minguito/minguito-binoculos.png',
      './assets/minguito/minguito-maos.png',
      './assets/minguito/minguito-baixo.png',
    ];
    var vIdx = 0;
    if (bannerImg && pool.length > 1) {
      root._mcDdCarousel = setInterval(function () {
        vIdx = (vIdx + 1) % pool.length;
        bannerImg.src = pool[vIdx];
      }, 5000);
    }

    root.querySelector('#mc-dd-back').onclick = function () {
      cleanup();
      navigate('/activities');
    };

    var flux = root.querySelector('#mc-dd-flux');
    if (flux)
      flux.onclick = function () {
        cleanup();
        navigate('/activities');
      };

    var refresh = root.querySelector('#mc-dd-refresh');
    if (refresh)
      refresh.onclick = async function () {
        demand = (await getDemand(id)) || demand;
        lastSig = null;
        paint(getTiers(), { updated: true });
      };

    var ming = root.querySelector('#mc-dd-ming');
    if (ming)
      ming.onclick = async function () {
        var buyerId = resolveUserId();
        if (!buyerId) return;
        try {
          await openNegotiation({ demandId: demand.id, buyerId: buyerId });
        } catch (e) {}
        cleanup();
        navigate('/services?demandId=' + encodeURIComponent(demand.id));
      };

    var can = root.querySelector('#mc-dd-cancel');
    if (can)
      can.onclick = async function () {
        try {
          await updateDemandStatus(demand.id, 'expired');
          demand = (await getDemand(id)) || demand;
        } catch (e) {}
        cleanup();
        paint(getTiers(), {});
      };

    root.querySelectorAll('[data-lid]').forEach(function (btn) {
      btn.onclick = function () {
        cleanup();
        navigate('/listing/' + btn.getAttribute('data-lid'));
      };
    });
  }

  async function tick(force) {
    demand = (await getDemand(id)) || demand;
    if (demand.status !== 'active') {
      paint(getTiers(), {});
      cleanup();
      return;
    }
    var tiers = getTiers();
    var sig = tierSignature(tiers);
    var changed = sig !== lastSig;
    if (force || lastSig === null || changed) {
      var showUpdated = lastSig !== null && changed;
      lastSig = sig;
      paint(tiers, { updated: showUpdated });
    } else {
      var el = root.querySelector('#mc-dd-poll');
      if (el) {
        var t = new Date();
        function z(n) {
          return (n < 10 ? '0' : '') + n;
        }
        el.textContent =
          'Última verificação ' +
          z(t.getHours()) +
          ':' +
          z(t.getMinutes()) +
          ':' +
          z(t.getSeconds());
      }
    }
  }

  tick(true);
  if (demand.status === 'active') {
    timer = setInterval(function () {
      tick(false);
    }, POLL_MS);
    root._mcDemandCleanup = cleanup;
  }
}
