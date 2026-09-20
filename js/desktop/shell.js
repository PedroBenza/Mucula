/**
 * Shell Desktop — navegação lateral + área principal.
 * Não duplica rotas nem lógica de negócio.
 */
import { COPY } from '../constants/copy.js';
import { navigate, getRoute } from '../core/router.js';
import { tabIconSvg } from '../components/tab-icons.js';

var MQ = '(min-width: 1024px)';
var mql = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(MQ) : null;

var NAV = [
  { path: '/feed', label: COPY.tabFeed, ico: 'home' },
  { path: '/services', label: COPY.tabMinguito, ico: 'chat' },
  { path: '/create', label: COPY.tabPublish, ico: 'add', special: true },
  { path: '/activities', label: COPY.tabFlows, ico: 'flash' },
  { path: '/profile', label: COPY.tabProfile, ico: 'person' },
];

var icoMap = {
  home: ['home-outline', 'home'],
  chat: ['chatbubble-ellipses-outline', 'chatbubble-ellipses'],
  add: ['add', 'add'],
  flash: ['flash-outline', 'flash'],
  person: ['person-outline', 'person'],
};

function isDesktop() {
  return mql ? mql.matches : false;
}

function applyMode() {
  var on = isDesktop();
  document.documentElement.classList.toggle('mc-is-desktop', on);
  document.body.classList.toggle('mc-is-desktop', on);
  var side = document.getElementById('mc-desktop-nav');
  if (side) side.hidden = !on;
  var bottom = document.getElementById('mc-bottom-nav');
  if (bottom) {
    if (on) bottom.setAttribute('aria-hidden', 'true');
    else bottom.removeAttribute('aria-hidden');
  }
}

function paintSideIcons() {
  var side = document.getElementById('mc-desktop-nav');
  if (!side) return;
  side.querySelectorAll('[data-ico]').forEach(function (el) {
    var key = el.getAttribute('data-ico');
    var pair = icoMap[key];
    if (!pair) return;
    var btn = el.closest('button');
    var active = btn && btn.classList.contains('is-active');
    el.innerHTML = tabIconSvg(active ? pair[1] : pair[0], !!active);
  });
}

function setActiveSide(path) {
  var side = document.getElementById('mc-desktop-nav');
  if (!side) return;
  side.querySelectorAll('[data-nav]').forEach(function (btn) {
    var n = btn.getAttribute('data-nav');
    var active = path === n || (n.length > 1 && path.indexOf(n + '/') === 0);
    btn.classList.toggle('is-active', active);
  });
  paintSideIcons();
}

function setRouteAttr(path) {
  var shell = document.getElementById('app');
  if (!shell) return;
  var base = (path || '/feed').split('?')[0];
  var key = 'other';
  if (base === '/feed' || base === '/') key = 'feed';
  else if (base.indexOf('/services') === 0) key = 'minguito';
  else if (base.indexOf('/create') === 0) key = 'publish';
  else if (base.indexOf('/activities') === 0) key = 'fluxo';
  else if (base.indexOf('/profile') === 0) key = 'profile';
  else if (base.indexOf('/listing/') === 0) key = 'listing';
  else if (base.indexOf('/demand/') === 0) key = 'demand';
  else if (base.indexOf('/combinamos/') === 0) key = 'match';
  shell.setAttribute('data-mc-route', key);
}

function buildSidebar() {
  var existing = document.getElementById('mc-desktop-nav');
  if (existing) return existing;

  var nav = document.createElement('nav');
  nav.id = 'mc-desktop-nav';
  nav.className = 'mc-desktop-nav';
  nav.setAttribute('aria-label', 'Principal');
  nav.hidden = true;

  var brand = document.createElement('div');
  brand.className = 'mc-desktop-brand';
  brand.textContent = COPY.brand || 'Mucula';
  nav.appendChild(brand);

  var list = document.createElement('div');
  list.className = 'mc-desktop-nav-list';

  for (var i = 0; i < NAV.length; i++) {
    var item = NAV[i];
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.setAttribute('data-nav', item.path);
    if (item.special) btn.className = 'mc-desktop-nav-item mc-desktop-nav-item--publish';
    else btn.className = 'mc-desktop-nav-item';
    btn.innerHTML =
      '<span class="mc-tab-ico" data-ico="' +
      item.ico +
      '"></span><span class="mc-desktop-nav-lbl">' +
      item.label +
      '</span>';
    (function (path) {
      btn.addEventListener('click', function () {
        navigate(path);
      });
    })(item.path);
    list.appendChild(btn);
  }
  nav.appendChild(list);

  var shell = document.getElementById('app');
  if (shell) shell.insertBefore(nav, shell.firstChild);
  return nav;
}

/**
 * @param {{ onRoute?: function(string): void }} [opts]
 */
export function initDesktopShell(opts) {
  opts = opts || {};
  buildSidebar();
  applyMode();
  paintSideIcons();

  if (mql) {
    var onChange = function () {
      applyMode();
      paintSideIcons();
    };
    if (mql.addEventListener) mql.addEventListener('change', onChange);
    else if (mql.addListener) mql.addListener(onChange);
  }

  return {
    syncRoute: function (path) {
      path = path || (getRoute && getRoute().path) || '/feed';
      setActiveSide(path);
      setRouteAttr(path);
      if (typeof opts.onRoute === 'function') opts.onRoute(path);
    },
    isDesktop: isDesktop,
  };
}
