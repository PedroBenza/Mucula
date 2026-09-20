import { CATEGORIES, WIDE_CATEGORIES } from '../constants/categories.js';
import { fmtCardPrice, fmtCardPriceWithUnit } from '../shared/format-price.js';
import { navigate } from '../core/router.js';
import { isSaved, toggleSave } from '../local/saves.js';

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function pickImage(item) {
  if (item.imageUrl) return item.imageUrl;
  if (item.imageUrls && item.imageUrls.length) return item.imageUrls[0];
  return null;
}

function findCat(key) {
  for (var i = 0; i < CATEGORIES.length; i++) {
    if (CATEGORIES[i].key === key) return CATEGORIES[i];
  }
  return null;
}

function isWide(listing) {
  return WIDE_CATEGORIES && WIDE_CATEGORIES.has && WIDE_CATEGORIES.has(listing.category);
}

export function createListingCard(listing) {
  if (isWide(listing)) return createWideCard(listing);

  var catDef = findCat(listing.category);
  var isPriceHidden = catDef && catDef.priceHidden ? true : false;
  var src = pickImage(listing);
  var cond = listing.condition === 'novo' || listing.condition === 'usado' ? listing.condition : null;
  var saved = isSaved(listing._id);

  var wrap = document.createElement('div');
  wrap.className = 'mc-lcard';
  wrap.innerHTML =
    '<a class="mc-lcard-link" href="#/listing/' +
    encodeURIComponent(listing._id) +
    '">' +
    '<div class="mc-lcard-media">' +
    (src
      ? '<img src="' + escapeHtml(src) + '" alt="" loading="lazy" decoding="async" />'
      : '<div class="mc-lcard-ph"></div>') +
    (cond === 'novo' ? '<span class="mc-lcard-badge mc-lcard-badge--novo">Novo</span>' : '') +
    (listing.isFeatured && (listing.featuredUntil == null || Number(listing.featuredUntil) > Date.now())
      ? '<span class="mc-lcard-badge" style="left:8px;right:auto;background:#D97706;color:#fff">Destaque</span>'
      : '') +
    '<button type="button" class="mc-lcard-heart" aria-label="Guardar">' +
    (saved ? '❤️' : '🤍') +
    '</button>' +
    '</div>' +
    '<div class="mc-lcard-body">' +
    (isPriceHidden
      ? '<div class="mc-lcard-price mc-lcard-price--muted">Preço sob consulta</div>'
      : '<div class="mc-lcard-price">' + escapeHtml(fmtCardPriceWithUnit(listing)) + ' Kz</div>') +
    '<div class="mc-lcard-title">' +
    escapeHtml(listing.title || '') +
    '</div>' +
    '<div class="mc-lcard-meta">' +
    escapeHtml((listing.location && listing.location.neighborhood) || '') +
    '</div>' +
    '</div></a>';

  wrap.querySelector('.mc-lcard-link').addEventListener('click', function (e) {
    if (e.target.closest && e.target.closest('.mc-lcard-heart')) return;
    e.preventDefault();
    navigate('/listing/' + listing._id);
  });
  wrap.querySelector('.mc-lcard-heart').addEventListener('click', function (e) {
    e.preventDefault();
    e.stopPropagation();
    var on = toggleSave(listing._id);
    e.currentTarget.textContent = on ? '❤️' : '🤍';
  });
  return wrap;
}

/** Paridade ListingsCardWide — row 115px */
function createWideCard(listing) {
  var src = pickImage(listing);
  var catDef = findCat(listing.category);
  var isPriceHidden = catDef && catDef.priceHidden ? true : false;
  var unit = listing.priceUnit && listing.priceUnit !== 'total' ? ' / ' + listing.priceUnit : '';
  var price;
  if (isPriceHidden) {
    price = 'Preço sob consulta';
  } else if (!listing.price || listing.price === 0) {
    price = 'Sob Orçamento';
  } else {
    price = 'A partir de ' + Number(listing.price).toLocaleString('pt-AO') + ' Kz' + unit;
  }
  var saved = isSaved(listing._id);

  var wrap = document.createElement('div');
  wrap.className = 'mc-lcard-wide';
  wrap.innerHTML =
    '<a class="mc-lcard-wide-link" href="#/listing/' +
    encodeURIComponent(listing._id) +
    '">' +
    '<div class="mc-lcard-wide-img">' +
    (src
      ? '<img src="' + escapeHtml(src) + '" alt="" loading="lazy" />'
      : '<div class="mc-lcard-ph" style="height:100%"></div>') +
    '</div>' +
    '<div class="mc-lcard-wide-body">' +
    '<div class="mc-lcard-meta" style="text-transform:uppercase;letter-spacing:0.5px">' +
    escapeHtml((listing.location && listing.location.neighborhood) || 'Luanda') +
    '</div>' +
    '<div class="mc-lcard-title" style="font-weight:700;font-size:14px">' +
    escapeHtml(listing.title || '') +
    '</div>' +
    '<div class="mc-muted" style="font-size:12px;margin-top:2px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">' +
    escapeHtml(listing.description || '') +
    '</div>' +
    '<div class="mc-lcard-price" style="margin-top:6px">' +
    escapeHtml(price) +
    '</div>' +
    '</div></a>' +
    '<button type="button" class="mc-lcard-heart mc-lcard-heart--wide" aria-label="Guardar">' +
    (saved ? '❤️' : '🤍') +
    '</button>';

  wrap.querySelector('.mc-lcard-wide-link').addEventListener('click', function (e) {
    e.preventDefault();
    navigate('/listing/' + listing._id);
  });
  wrap.querySelector('.mc-lcard-heart').addEventListener('click', function (e) {
    e.preventDefault();
    e.stopPropagation();
    var on = toggleSave(listing._id);
    e.currentTarget.textContent = on ? '❤️' : '🤍';
  });
  return wrap;
}

export function renderListingGrid(container, listings) {
  container.className = 'mc-lgrid';
  container.innerHTML = '';
  for (var i = 0; i < listings.length; i++) {
    container.appendChild(createListingCard(listings[i]));
  }
}
