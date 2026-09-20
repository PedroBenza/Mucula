import { fetchListingFeed } from '../../api/listings.js';
import { ApiError, NetworkError } from '../../api/client.js';
import { mountCategoryBar } from '../../components/category-bar.js';
import { mountHero } from '../../components/hero.js';
import { mountSearchBar } from '../../components/search-bar.js';
import { pageHeaderHtml, pageLeadHtml } from '../../components/page-header.js';
import { COPY } from '../../constants/copy.js';
import { mountTicker, buildTickerItems } from '../../components/ticker.js';
import { renderListingGrid } from '../../components/listing-card.js';
import { buildFeed } from '../../shared/field-build.js';
import { listAnnouncements } from '../../local/announcements.js';
import { getActiveCategory, onCategoryChange } from '../../state/category.js';
import { getSession } from '../../state/session.js';

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function filterSearch(items, q) {
  q = String(q || '').trim().toLowerCase();
  if (!q) return items;
  var out = [];
  for (var i = 0; i < items.length; i++) {
    var it = items[i];
    var hay = ((it.title || '') + ' ' + (it.description || '') + ' ' + (it.category || '')).toLowerCase();
    if (hay.indexOf(q) !== -1) out.push(it);
  }
  return out;
}

export async function renderFeed(root) {
  if (root._mcFeedCleanup) {
    try { root._mcFeedCleanup(); } catch (e) {}
  }

  var session = getSession();
  var loc = (session.user && session.user.neighborhood) || 'Luanda';
  var searchQuery = '';
  var allItems = [];
  var cleanups = [];

  root.innerHTML =
    pageHeaderHtml(COPY.headerFeed, { brand: true }) +
    (loc ? pageLeadHtml(loc) : '') +
    '<div id="mc-search-slot"></div>' +
    '<div id="mc-cat-slot"></div>' +
    '<div id="mc-blocks"></div>';

  var blocksEl = root.querySelector('#mc-blocks');

  mountSearchBar(root.querySelector('#mc-search-slot'), {
    onChange: function (v) {
      searchQuery = v;
      paintBlocks();
    },
  });

  cleanups.push(mountCategoryBar(root.querySelector('#mc-cat-slot')));

  var blockCleanups = [];

  function clearBlockCleanups() {
    for (var c = 0; c < blockCleanups.length; c++) {
      if (typeof blockCleanups[c] === 'function') {
        try { blockCleanups[c](); } catch (e) {}
      }
    }
    blockCleanups = [];
  }

  function paintBlocks() {
    var category = getActiveCategory() || 'all';
    var items = allItems.slice();
    if (category && category !== 'all') {
      items = items.filter(function (i) {
        return i.category === category;
      });
    }
    items = filterSearch(items, searchQuery);

    var blocks = buildFeed(items, listAnnouncements());
    clearBlockCleanups();
    blocksEl.innerHTML = '';

    for (var b = 0; b < blocks.length; b++) {
      var block = blocks[b];
      if (block.type === 'hero') {
        var heroWrap = document.createElement('div');
        var heroSlot = document.createElement('div');
        heroSlot.id = 'mc-hero-slot';
        heroWrap.appendChild(heroSlot);
        var tick = document.createElement('div');
        tick.id = 'mc-ticker-slot';
        heroWrap.appendChild(tick);
        blocksEl.appendChild(heroWrap);
        blockCleanups.push(mountHero(heroSlot));
        /* Ticker isolado: só linhas desta categoria (listings filtrados) */
        var tickItems = buildTickerItems(category, items);
        blockCleanups.push(mountTicker(tick, tickItems, category));
      } else if (block.type === 'section') {
        var sec = document.createElement('div');
        sec.className = 'mc-feed-section';
        sec.textContent = block.title;
        blocksEl.appendChild(sec);
      } else if (block.type === 'promo') {
        var promo = document.createElement('div');
        promo.className = 'mc-promo-card';
        var ann = block.announcement || {};
        promo.innerHTML = '<strong></strong><span class="mc-muted"></span>';
        promo.querySelector('strong').textContent = ann.title || 'Aviso';
        promo.querySelector('span').textContent = ann.body || '';
        blocksEl.appendChild(promo);
      } else if (block.type === 'grid') {
        var grid = document.createElement('div');
        blocksEl.appendChild(grid);
        renderListingGrid(grid, block.listings || []);
      }
    }

    if (items.length === 0 && allItems.length > 0) {
      var empty = document.createElement('p');
      empty.className = 'mc-muted';
      empty.textContent = 'Nenhum anúncio com este filtro.';
      blocksEl.appendChild(empty);
    }
    /* Faixa "Assets do projecto (45)" removida de propósito — não pertence ao produto */
  }

  async function loadListings() {
    blocksEl.innerHTML =
      '<div style="display:flex;justify-content:center;padding:24px"><div class="mc-loading"></div></div>';
    try {
      var page = await fetchListingFeed({ limit: 40 });
      allItems = page.items || [];
      paintBlocks();
    } catch (err) {
      var msg = 'Não deu para carregar o feed.';
      if (err instanceof NetworkError) msg = err.message;
      else if (err instanceof ApiError) msg = err.message;
      else if (err && err.message) msg = err.message;
      blocksEl.innerHTML = '<p class="mc-error">' + escapeHtml(msg) + '</p>';
    }
  }

  await loadListings();
  cleanups.push(
    onCategoryChange(function () {
      paintBlocks();
    })
  );

  root._mcFeedCleanup = function () {
    clearBlockCleanups();
    for (var i = 0; i < cleanups.length; i++) {
      if (typeof cleanups[i] === 'function') {
        try { cleanups[i](); } catch (e) {}
      }
    }
  };
}
