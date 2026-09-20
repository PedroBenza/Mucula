/**
 * Resumo do acordo — mediado pelo Minguito (Etapa 2).
 * Não é contacto entre comprador e vendedor.
 */
import { getNegotiation, completeDealAsSeller } from '../../api/negotiations.js';
import { fetchListingById } from '../../api/listings.js';
import { getDemand } from '../../local/demands.js';
import { navigate } from '../../core/router.js';
import { fmtKz } from '../../core/format.js';
import { negotiationLabel } from '../../domain/human-state.js';
import { COPY } from '../../constants/copy.js';
import { backButtonHtml } from '../../components/icons.js';
import { getSession } from '../../state/session.js';
import { resolveUserId, sameUserId } from '../../core/user-id.js';

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export async function renderCombinamos(root, negId) {
  var n = await getNegotiation(negId);
  if (!n) {
    root.innerHTML =
      '<p class="mc-muted">' +
      (COPY.matchedNotFound || 'Resumo não encontrado.') +
      '</p>' +
      backButtonHtml('b');
    root.querySelector('#b').onclick = function() {
      navigate('/activities');
    };
    return;
  }
  
  var uid = resolveUserId();
  var listing = n.listingId ?
    await fetchListingById(n.listingId).catch(function() { return null; }) :
    null;
  var demand = n.demandId ? getDemand(n.demandId) : null;
  var title =
    (listing && listing.title) || (demand && demand.title) || 'Acordo';
  var price =
    n.proposedPrice != null ? n.proposedPrice : listing ? listing.price : null;
  var nb =
    (listing && listing.location && listing.location.neighborhood) ||
    (demand && demand.neighborhood) ||
    '';
  
  var isSeller = !!(uid && n.sellerId && sameUserId(n.sellerId, uid));
  
  var rows = '';
  rows +=
    '<div class="mc-match-row"><span class="mc-match-label">O quê</span><div class="mc-match-value">' +
    esc(title) +
    '</div></div>';
  if (price != null) {
    rows +=
      '<div class="mc-match-row"><span class="mc-match-label">Preço combinado</span><div class="mc-match-value">' +
      esc(fmtKz(price)) +
      '</div></div>';
  }
  if (nb) {
    rows +=
      '<div class="mc-match-row"><span class="mc-match-label">Zona</span><div class="mc-match-value">' +
      esc(nb) +
      '</div></div>';
  }
  rows +=
    '<div class="mc-match-row"><span class="mc-match-label">Situação</span><div class="mc-match-value">' +
    esc(negotiationLabel(n.state)) +
    '</div></div>';
  
  var soldBlock = '';
  if (isSeller && n.state === 'matched') {
    soldBlock =
      '<button type="button" class="mc-btn mc-btn-primary mc-btn-block" id="mc-match-sold" style="margin-top:16px">' +
      'Marcar como vendido' +
      '</button>' +
      '<p class="mc-error" id="mc-match-sold-err" hidden style="margin-top:8px"></p>';
  }
  
  root.innerHTML =
    backButtonHtml('mc-match-back') +
    '<div class="mc-match">' +
    '<p class="mc-match-kicker">Minguito</p>' +
    '<h1 class="mc-h1" style="margin:4px 0 8px">Acordo confirmado</h1>' +
    '<p class="mc-muted" style="margin:0 0 20px;font-size:14px;line-height:1.45">' +
    'Este resumo ficou registado pelo Minguito. Não há contacto directo entre as partes na app — o intermediário trata da conversa de preço e do acordo.' +
    '</p>' +
    '<div class="mc-match-card">' +
    rows +
    '</div>' +
    '<div class="mc-match-note">' +
    '<p class="mc-match-note-title">O que acontece a seguir</p>' +
    '<ul class="mc-match-note-list">' +
    '<li>O Minguito guarda o que ficou combinado.</li>' +
    '<li>Qualquer dúvida sobre este acordo: fala com o Minguito.</li>' +
    '<li>O vendedor e o comprador não trocam contacto aqui.</li>' +
    '</ul></div>' +
    soldBlock +
    '<button type="button" class="mc-btn mc-btn-primary mc-btn-block" id="mc-match-ming" style="margin-top:20px">Falar com o Minguito</button>' +
    '<button type="button" class="mc-action" id="mc-match-fx" style="margin-top:12px;display:block;width:100%;text-align:center">Voltar ao Fluxo</button>' +
    '</div>';
  
  root.querySelector('#mc-match-back').onclick = function() {
    navigate('/activities');
  };
  root.querySelector('#mc-match-ming').onclick = function() {
    var dest = '/services';
    if (n.listingId) dest += '?listingId=' + encodeURIComponent(n.listingId);
    else if (n.demandId) dest += '?demandId=' + encodeURIComponent(n.demandId);
    navigate(dest);
  };
  root.querySelector('#mc-match-fx').onclick = function() {
    navigate('/activities');
  };
  
  var soldBtn = root.querySelector('#mc-match-sold');
  if (soldBtn) {
    soldBtn.onclick = async function () {
      if (soldBtn.disabled) return;
      var errEl = root.querySelector('#mc-match-sold-err');
      soldBtn.disabled = true;
      var prev = soldBtn.textContent;
      soldBtn.textContent = 'A concluir…';
      try {
        await completeDealAsSeller(n.id, uid);
        await renderCombinamos(root, negId);
      } catch (e) {
        soldBtn.disabled = false;
        soldBtn.textContent = prev || 'Marcar como vendido';
        if (errEl) {
          errEl.hidden = false;
          errEl.textContent =
            (e && e.message) || 'Não foi possível marcar como vendido.';
        }
      }
    };
  }
}
