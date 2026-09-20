import { isLocalMode } from '../../config.js';
import { fetchListingById, setListingStatus } from '../../api/listings.js';
import { fmtKz } from '../../core/format.js';
import { navigate } from '../../core/router.js';
import { ApiError, NetworkError } from '../../api/client.js';
import {
  openNegotiation,
  findOpenForListing,
} from '../../api/negotiations.js';
import { getSession, isAuthenticated } from '../../state/session.js';
import { resolveUserId, sameUserId } from '../../core/user-id.js';
import { negotiationLabel } from '../../domain/human-state.js';
import { COPY } from '../../constants/copy.js';
import { track } from '../../local/telemetry.js';
import { recordListingViewOncePerDay } from '../../local/listing-views.js';
import { calcPlatformFee } from '../../local/platform-fee.js';
import { listingStatusLabel } from '../../domain/listing-market.js';
import { setResumePath } from '../../core/resume.js';
import { FEATURE_PLANS } from '../../local/feature-plans.js';
import { localActivateFeature } from '../../local/store.js';
import { backButtonHtml } from '../../components/icons.js';

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function renderListingDetail(root, id) {
  root.innerHTML =
    backButtonHtml('mc-back') +
    '<div id="mc-detail" style="margin-top:12px"><div class="mc-loading"></div></div>';
  root.querySelector('#mc-back').onclick = function() {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      navigate('/feed');
    }
  };
  var box = root.querySelector('#mc-detail');
  try {
    var item = await fetchListingById(id);
    var sess = getSession();
    var uid = resolveUserId();
    try { recordListingViewOncePerDay(id, uid); } catch (eTrack) {}
    var isSeller = !!(uid && item.authorId && sameUserId(item.authorId, uid));
    var myNeg = await findOpenForListing(id, uid);
    
    /* priceHidden por categoria (paridade RN) */
    try {
      var { CATEGORIES } = await import('../../constants/categories.js');
      for (var ci = 0; ci < CATEGORIES.length; ci++) {
        if (CATEGORIES[ci].key === item.category && CATEGORIES[ci].priceHidden) {
          item._priceHidden = true;
          break;
        }
      }
    } catch (eCat) {}
    var src = item.imageUrl || (item.imageUrls && item.imageUrls[0]);
    var img = src ?
      '<img src="' +
      escapeHtml(src) +
      '" alt="" style="width:100%;border-radius:var(--mc-radius-lg);margin-bottom:12px" />' :
      '';
    var stateLine = myNeg ?
      '<p style="margin-top:10px;font-size:13px"><span class="mc-muted">Estado: </span><strong>' +
      escapeHtml(negotiationLabel(myNeg.state)) +
      '</strong></p>' :
      '';
    
    var actions = '';
    if (isSeller) {
      actions +=
        '<p class="mc-muted" style="margin-top:16px;font-size:13px">Esta publicação é tua. Interesses e confirmações aparecem em Fluxo.</p>';
      actions +=
        '<div class="mc-boost">' +
        '<button type="button" class="mc-boost-toggle" id="mc-boost-open">' +
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2l2.2 6.6H21l-5.4 4 2.1 6.5L12 15.6 6.3 19l2.1-6.5L3 8.6h6.8L12 2z"/></svg>' +
        '<span>Tornar anúncio (destaque)</span></button>' +
        '<div class="mc-boost-panel" id="mc-boost-panel" hidden>' +
        '<p class="mc-muted" style="font-size:12px;margin:0 0 10px">Destaque pago: a tua publicação passa a anúncio no Feed do bairro pelo tempo escolhido.</p>';
      for (var pi = 0; pi < FEATURE_PLANS.length; pi++) {
        var pl = FEATURE_PLANS[pi];
        actions +=
          '<button type="button" class="mc-boost-plan" data-feat="' +
          pl.id +
          '">' +
          '<div class="mc-boost-plan-top"><span>' +
          escapeHtml(pl.label) +
          '</span><span class="mc-boost-plan-price">' +
          escapeHtml(String(pl.priceKz)) +
          ' Kz</span></div>' +
          '<p class="mc-boost-blurb" data-blurb="' +
          pl.id +
          '" hidden>' +
          escapeHtml(pl.blurb || '') +
          '</p></button>';
      }
      actions += '</div></div>';
      actions +=
        '<p class="mc-muted" style="margin-top:10px;font-size:12px">Estado: ' +
        escapeHtml(listingStatusLabel(item.status || 'disponivel')) +
        '</p>';
      var stPub = String(item.status || 'disponivel').toLowerCase();
      if (stPub === 'disponivel' || stPub === 'active' || stPub === 'activo') {
        actions +=
          '<button type="button" class="mc-btn mc-btn-secondary mc-btn-block" style="margin-top:10px" id="mc-archive-listing">Arquivar publicação</button>';
      }
      if (myNeg && sameUserId(myNeg.sellerId, uid) && myNeg.state !== 'closed') {
        actions +=
          '<p class="mc-muted" style="margin-top:12px;font-size:13px">Negociação a cargo do Minguito. Acompanha em Fluxo.</p>';
        actions +=
          '<button type="button" class="mc-btn mc-btn-secondary mc-btn-block" style="margin-top:8px" id="mc-open-minguito-seller">Abrir Minguito</button>';
      }
    } else {
      actions +=
        '<button type="button" class="mc-btn mc-btn-primary mc-btn-block" style="margin-top:20px" id="mc-minguito-cta">' + COPY.negotiateWithMinguito + '</button>';
      if (myNeg && myNeg.state === 'matched') {
        actions +=
          '<p class="mc-muted" style="margin-top:10px;font-size:13px">Acordo feito. O Minguito tem o resumo.</p>';
      }
    }
    
    var priceHtml;
    if (item._priceHidden) {
      priceHtml = '<div class="mc-price mc-lcard-price--muted">Preço sob consulta</div>';
    } else {
      var unit = item.priceUnit && item.priceUnit !== 'total' ? ' / ' + item.priceUnit : '';
      var num = (Number(item.price) || 0).toLocaleString('pt-AO');
      priceHtml = '<div class="mc-price">' + num + unit + ' Kz</div>';
    }
    var metaBits = [];
    if (item.location && item.location.neighborhood) metaBits.push(item.location.neighborhood);
    if (item.type) metaBits.push(item.type);
    if (item.condition) metaBits.push(item.condition);
    if (item.coversAllLuanda) metaBits.push('Toda Luanda');
    if (item.availableDays && item.availableDays.length) metaBits.push(item.availableDays.length + ' dia(s)');
    if (item.estimatedDuration) metaBits.push(item.estimatedDuration);
    if (item.negotiable) metaBits.push('negociável');
    
    box.innerHTML =
      img +
      priceHtml +
      '<h1 class="mc-h1" style="margin-top:8px">' +
      escapeHtml(item.title || '') +
      '</h1>' +
      '<p class="mc-muted">' +
      escapeHtml(metaBits.join(' · ')) +
      '</p>' +
      stateLine +
      '<p style="margin-top:12px;line-height:1.45;font-size:14px">' +
      escapeHtml(item.description || '') +
      '</p>' +
      actions +
      '<p class="mc-error" id="mc-d-err" hidden style="margin-top:8px"></p>';
    
    function showErr(msg) {
      var el = box.querySelector('#mc-d-err');
      if (!el) return;
      el.hidden = false;
      el.textContent = msg;
    }
    
    var ming = box.querySelector('#mc-minguito-cta');
    if (ming) {
      ming.onclick = async function() {
        if (!uid) {
          if (!isAuthenticated()) setResumePath('/listing/' + id);
          showErr('Entra na conta para negociar.');
          return;
        }
        try {
          await openNegotiation({
            listingId: id,
            buyerId: uid,
            sellerId: item.authorId || null,
          });
          if (isLocalMode()) {
            navigate('/services?listingId=' + encodeURIComponent(id));
          } else {
            showErr('Minguito estará disponível na próxima fase.');
          }
        } catch (e) {
          showErr((e && e.message) || 'Não foi possível iniciar.');
        }
      };
    }
    
    var mingSeller = box.querySelector('#mc-open-minguito-seller');
    if (mingSeller) {
      mingSeller.onclick = function() {
        if (isLocalMode()) {
          navigate('/services?listingId=' + encodeURIComponent(id));
        } else {
          showErr('Minguito estará disponível na próxima fase.');
        }
      };
    }
    var arch = box.querySelector('#mc-archive-listing');
    if (arch) {
      arch.onclick = async function () {
        if (arch.disabled) return;
        arch.disabled = true;
        var prevLabel = arch.textContent;
        arch.textContent = 'A arquivar…';
        try {
          await setListingStatus(id, 'pausado');
          navigate('/feed', { replace: true });
        } catch (e) {
          arch.disabled = false;
          arch.textContent = prevLabel || 'Arquivar publicação';
          showErr((e && e.message) || 'Não foi possível arquivar.');
        }
      };
    }
    var boostOpen = box.querySelector('#mc-boost-open');
    var boostPanel = box.querySelector('#mc-boost-panel');
    if (boostOpen && boostPanel) {
      boostOpen.onclick = function() {
        boostPanel.hidden = !boostPanel.hidden;
      };
    }
    var selectedFeat = null;
    box.querySelectorAll('[data-feat]').forEach(function(btn) {
      btn.onclick = function() {
        var fid = btn.getAttribute('data-feat');
        selectedFeat = fid;
        box.querySelectorAll('.mc-boost-plan').forEach(function(b) {
          b.classList.toggle('is-on', b.getAttribute('data-feat') === fid);
        });
        box.querySelectorAll('[data-blurb]').forEach(function(bl) {
          bl.hidden = bl.getAttribute('data-blurb') !== fid;
        });
        var act = box.querySelector('#mc-boost-act');
        if (!act && boostPanel) {
          act = document.createElement('button');
          act.type = 'button';
          act.id = 'mc-boost-act';
          act.className = 'mc-btn mc-btn-primary mc-btn-block';
          act.style.marginTop = '10px';
          act.textContent = 'Activar divulgação';
          boostPanel.appendChild(act);
          act.onclick = function() {
            if (!selectedFeat) return;
            try {
              localActivateFeature(id, selectedFeat, uid);
              showErr('');
              var el = box.querySelector('#mc-d-err');
              if (el) {
                el.hidden = false;
                el.className = 'mc-muted';
                el.textContent = 'Divulgação activada.';
              }
              renderListingDetail(root, id);
            } catch (e) {
              showErr((e && e.message) || 'Erro ao divulgar');
            }
          };
        }
      };
    });
  } catch (err) {
    var msg = 'Anúncio indisponível.';
    if (err instanceof NetworkError || err instanceof ApiError) msg = err.message;
    else if (err && err.message) msg = err.message;
    box.innerHTML = '<p class="mc-error">' + escapeHtml(msg) + '</p>';
  }
}