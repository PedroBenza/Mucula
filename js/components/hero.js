/**
 * Hero do feed — isolado por categoria activa.
 * O carrossel de imagens NÃO cruza categorias.
 */
import { heroFor } from '../constants/hero.js';
import { getActiveCategory, onCategoryChange } from '../state/category.js';

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function mountHero(container) {
  if (!container) return function () {};
  var timer = null;

  function paint() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
    /* Snapshot da categoria no momento do paint — o timer usa este pool fixo */
    var key = getActiveCategory() || 'all';
    var h = heroFor(key);
    var pool = [h.image].concat(h.variants || []).filter(Boolean);
    var vIdx = 0;
    var lockedKey = key;
    container.className = 'mc-hero';
    container.setAttribute('data-hero-cat', lockedKey);

    function renderImg() {
      /* Se a categoria mudou, este timer já não deve pintar (cleanup trata) */
      if ((getActiveCategory() || 'all') !== lockedKey) return;
      var src = pool.length ? pool[vIdx % pool.length] : '';
      container.innerHTML =
        '<div class="mc-hero-bg" style="--mc-hero-accent:' +
        h.accent +
        '">' +
        (src
          ? '<img class="mc-hero-img" src="' +
            src +
            '" alt="" data-cat="' +
            lockedKey +
            '" loading="eager" decoding="async" />'
          : '') +
        '<div class="mc-hero-veil"></div>' +
        '<div class="mc-hero-copy">' +
        '<div class="mc-hero-title">' +
        escapeHtml(h.headline) +
        '</div>' +
        '<div class="mc-hero-sub">' +
        escapeHtml(h.sub) +
        '</div>' +
        '</div></div>';
      vIdx++;
    }

    renderImg();
    if (pool.length > 1) {
      timer = setInterval(renderImg, 5000);
    }
  }

  paint();
  var unsub = onCategoryChange(paint);
  return function () {
    if (timer) clearInterval(timer);
    timer = null;
    if (typeof unsub === 'function') unsub();
  };
}
