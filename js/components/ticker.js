/**
 * Ticker sob o hero — isolado por categoria.
 * Único emoji permitido: fogo (🔥).
 */

var FALLBACK_BY_CAT = {
  all: ['🔥 Novidades no teu bairro', 'Compra e venda perto de ti'],
  gas: ['🔥 Gás disponível no bairro', '🔥 Botija pronta a entregar'],
  telemoveis: ['iPhone disponível', 'Galaxy disponível', 'Telemóveis no bairro'],
  electronicos: ['Electrónicos perto de ti', 'Portáteis e mais'],
  roupas: ['Roupa a bom preço', 'Drips no bairro'],
  imoveis: ['Cubículo e arrendamento', 'Imóveis perto de ti'],
  veiculos: ['Carros e motas', 'Veículos no bairro'],
  alimentacao: ['Comida perto de ti', 'Piteus no bairro'],
  calcados: ['Sapatos e ténis', 'Calçado no bairro'],
  servicos: ['Serviços no bairro', 'Profissionais perto de ti'],
  electrodomesticos: ['Electrodomésticos', 'Para a casa'],
  materiais_construcao: ['Materiais de construção', 'Ferramentas no bairro'],
};

/** Remove qualquer emoji excepto 🔥 */
function stripEmojisKeepFire(s) {
  var str = String(s || '');
  // temporary token for fire
  str = str.split('🔥').join('__FIRE__');
  // strip most emoji / symbols outside basic latin + accents used in PT
  str = str.replace(
    /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F1E0}-\u{1F1FF}]/gu,
    ''
  );
  str = str.split('__FIRE__').join('🔥');
  return str.replace(/\s{2,}/g, ' ').trim();
}

function lineFromListing(l) {
  if (!l || !l.title) return null;
  var title = String(l.title).trim();
  if (!title) return null;
  var nb =
    (l.location && l.location.neighborhood) ||
    l.neighborhood ||
    '';
  var tail = nb ? ' · ' + nb : '';
  var line = (l.isFeatured ? '🔥 ' : '') + title + tail;
  return stripEmojisKeepFire(line);
}

export function buildTickerItems(category, listings) {
  var cat = category || 'all';
  var lines = [];
  var seen = {};
  var list = listings || [];
  for (var i = 0; i < list.length; i++) {
    var item = list[i];
    if (cat !== 'all') {
      if (!item.category || item.category !== cat) continue;
    }
    var line = lineFromListing(item);
    if (!line || seen[line]) continue;
    seen[line] = true;
    lines.push(line);
    if (lines.length >= 8) break;
  }
  if (lines.length === 0) {
    var fb = (FALLBACK_BY_CAT[cat] || FALLBACK_BY_CAT.all).slice();
    lines = fb.map(stripEmojisKeepFire);
  }
  return lines;
}

export function mountTicker(container, items, lockedCategory) {
  items = items && items.length ? items.map(stripEmojisKeepFire) : FALLBACK_BY_CAT.all.slice();
  var idx = 0;
  var cat = lockedCategory || '';
  container.className = 'mc-ticker';
  if (cat) container.setAttribute('data-ticker-cat', cat);
  container.innerHTML = '<div class="mc-ticker-text"></div>';
  var el = container.querySelector('.mc-ticker-text');

  function show() {
    el.style.opacity = '0';
    el.style.transform = 'translateY(6px)';
    setTimeout(function () {
      el.textContent = items[idx % items.length];
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
      idx = (idx + 1) % items.length;
    }, 200);
  }

  show();
  var timer = setInterval(show, 4000);
  return function () {
    clearInterval(timer);
  };
}
