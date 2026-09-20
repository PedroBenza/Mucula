/**
 * Publicar — identidade visual + três caminhos.
 * Carrossel superior (30s) com imagens de marca.
 */
import { navigate } from '../../core/router.js';
import { getSession } from '../../state/session.js';
import { resolveUserId } from '../../core/user-id.js';
import { isLocalMode } from '../../config.js';
import { getPilotSnapshot, formatPilotQuotaLine } from '../../local/pilot-economy.js';
import { pageHeaderHtml } from '../../components/page-header.js';
import { COPY } from '../../constants/copy.js';

var IDENTITY_SLIDES = [
  './assets/images/publicar/identity-1.png',
  './assets/images/publicar/identity-2.png',
];
var ROTATE_MS = 30000;

export function renderCreateHub(root) {
  var uid = resolveUserId();

  var quota = '';
  var limitMsg = '';
  if (isLocalMode() && uid) {
    try {
      var snap = getPilotSnapshot(uid);
      quota = '<p class="mc-pub-quota">' + formatPilotQuotaLine(snap) + '</p>';
      if (snap.listings.activeLeft === 0 || snap.listings.todayLeft === 0) {
        limitMsg =
          '<p class="mc-error mc-pub-limit">Limite de publicação atingido — arquiva um anúncio ou espera o próximo dia.</p>';
      }
    } catch (e2) {}
  } else if (isLocalMode() && !uid) {
    quota = '<p class="mc-pub-quota">Entra na conta para ver os teus limites de publicação.</p>';
  }

  var slidesHtml = IDENTITY_SLIDES.map(function (src, i) {
    return (
      '<img class="mc-pub-id-img' +
      (i === 0 ? ' is-on' : '') +
      '" src="' +
      src +
      '" alt="" data-slide="' +
      i +
      '" decoding="async" />'
    );
  }).join('');

  root.innerHTML =
    pageHeaderHtml(COPY.headerPublish) +
    '<div class="mc-pub">' +
    '<div class="mc-pub-identity" aria-hidden="true">' +
    '<div class="mc-pub-id-frame">' +
    slidesHtml +
    '</div></div>' +
    quota +
    limitMsg +
    '<div class="mc-pub-choices">' +
    '<button type="button" class="mc-btn mc-btn-primary mc-btn-block" data-go="produto">' +
    COPY.publishProduct +
    '</button>' +
    '<p class="mc-pub-hint">' +
    (COPY.publishProductHint || 'Coloca um produto no mercado do teu bairro.') +
    '</p>' +
    '<button type="button" class="mc-btn mc-btn-primary mc-btn-block" data-go="servico">' +
    COPY.publishService +
    '</button>' +
    '<p class="mc-pub-hint">' +
    (COPY.publishServiceHint || 'Oferece o que sabes fazer, perto de ti.') +
    '</p>' +
    '<button type="button" class="mc-btn mc-btn-primary mc-btn-block" data-go="demand">' +
    COPY.publishDemand +
    '</button>' +
    '<p class="mc-pub-hint">' +
    (COPY.publishDemandHint ||
      'Diz o que precisas — o mercado responde-te.') +
    '</p>' +
    '</div></div>';

  /* Remove slides que falham a carregar (ficheiro em falta) */
  var imgs = root.querySelectorAll('.mc-pub-id-img');
  var valid = [];
  imgs.forEach(function (img) {
    img.onerror = function () {
      img.remove();
      rebuildValid();
    };
    img.onload = function () {
      if (valid.indexOf(img) < 0) valid.push(img);
    };
  });

  function rebuildValid() {
    valid = Array.prototype.slice.call(
      root.querySelectorAll('.mc-pub-id-img')
    );
    if (!valid.length) {
      var frame = root.querySelector('.mc-pub-identity');
      if (frame) frame.hidden = true;
      return;
    }
    valid.forEach(function (el, i) {
      el.classList.toggle('is-on', i === 0);
    });
  }

  var slideIdx = 0;
  var timer = null;
  function tick() {
    valid = Array.prototype.slice.call(
      root.querySelectorAll('.mc-pub-id-img')
    );
    if (valid.length < 2) return;
    valid.forEach(function (el) {
      el.classList.remove('is-on');
    });
    slideIdx = (slideIdx + 1) % valid.length;
    valid[slideIdx].classList.add('is-on');
  }
  timer = setInterval(tick, ROTATE_MS);

  /* Limpa timer se o hub for desmontado (navegação) */
  root._mcPubCleanup = function () {
    if (timer) clearInterval(timer);
  };

  root.querySelector('[data-go="produto"]').onclick = function () {
    if (root._mcPubCleanup) root._mcPubCleanup();
    navigate('/create/produto');
  };
  root.querySelector('[data-go="servico"]').onclick = function () {
    if (root._mcPubCleanup) root._mcPubCleanup();
    navigate('/create/servico');
  };
  root.querySelector('[data-go="demand"]').onclick = function () {
    if (root._mcPubCleanup) root._mcPubCleanup();
    navigate('/create/procura');
  };
}
