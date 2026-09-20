import { runBootstrap } from './core/bootstrap.js';
import { register, start, navigate, setOnChange, getRoute } from './core/router.js';
import { showBootLoading, hideBootLoading } from './components/loading.js';
import { mountGuestWall } from './components/guest-wall.js';
import { requireAuth } from './core/require-auth.js';
import { renderLogin } from './features/auth/login.js';
import { renderRegister } from './features/auth/register.js';
import { renderFeed } from './features/feed/feed.js';
import { renderListingDetail } from './features/listing/detail.js';
import { renderCreateProduct } from './features/create/product.js';
import { renderCreateHub } from './features/create/hub.js';
import { renderCreateService } from './features/create/service.js';
import { renderCreateAnnouncement } from './features/create/announcement.js';
import { renderCreateDemand } from './features/demand/create.js';
import { renderDemandDetail } from './features/demand/detail.js';
import { renderCombinamos } from './features/negotiation/combinamos.js';
import { renderProfile } from './features/profile/profile.js';
import { renderActivities } from './features/activities/activities.js';
import { renderMinguito } from './features/minguito/minguito.js';
import { isLocalMode } from './config.js';
import { tabIconSvg } from './components/tab-icons.js';
import { ensureLocalSeed } from './local/store.js';
import { initDesktopShell } from './desktop/shell.js';

var main = document.getElementById('mc-main');

function paintTabIcons() {
  var map = {
    home: ['home-outline', 'home'],
    chat: ['chatbubble-ellipses-outline', 'chatbubble-ellipses'],
    add: ['add', 'add'],
    flash: ['flash-outline', 'flash'],
    person: ['person-outline', 'person'],
  };
  document.querySelectorAll('#mc-bottom-nav [data-ico]').forEach(function (el) {
    var key = el.getAttribute('data-ico');
    var pair = map[key];
    if (!pair) return;
    var btn = el.parentNode;
    while (btn && btn.tagName !== 'BUTTON') btn = btn.parentNode;
    var active = btn && btn.classList.contains('is-active');
    el.innerHTML = tabIconSvg(active ? pair[1] : pair[0], !!active);
  });
}

var desktopShell = null;

function setActiveNav(path) {
  document.querySelectorAll('#mc-bottom-nav [data-nav]').forEach(function (btn) {
    var n = btn.getAttribute('data-nav');
    var active = path === n || (n.length > 1 && path.indexOf(n + '/') === 0);
    btn.classList.toggle('is-active', active);
  });
  paintTabIcons();
  if (desktopShell) desktopShell.syncRoute(path);
}

register('/feed', function () { renderFeed(main); });
register('/login', function () { renderLogin(main); });
register('/register', function () { renderRegister(main); });
register('/listing/:id', function (params) { renderListingDetail(main, params.id); });

register('/create', function () {
  var ok = requireAuth({
    context: 'criar_listing',
    action: function () { renderCreateHub(main); },
  });
  if (!ok && main) {
    main.innerHTML = '<p class="mc-muted">É preciso entrar para criar um anúncio.</p>';
  }
});
register('/create/produto', function () {
  requireAuth({
    context: 'criar_listing',
    action: function () { renderCreateProduct(main); },
  });
});
register('/create/servico', function () {
  requireAuth({
    context: 'criar_listing',
    action: function () { renderCreateService(main); },
  });
});
register('/create/aviso', function () {
  requireAuth({
    context: 'criar_listing',
    action: function () { renderCreateAnnouncement(main); },
  });
});
register('/create/procura', function () {
  requireAuth({
    context: 'criar_listing',
    action: function () { renderCreateDemand(main); },
  });
});
register('/demand/:id', function (params) {
  requireAuth({
    context: 'criar_listing',
    action: function () { renderDemandDetail(main, params.id); },
  });
});

register('/activities', function () {
  var ok = requireAuth({
    context: 'actividades',
    action: function () { renderActivities(main); },
  });
  if (!ok && main) {
    main.innerHTML = '<p class="mc-muted">É preciso entrar para ver os fluxos.</p>';
  }
});
register('/profile', function () {
  var ok = requireAuth({
    context: 'perfil',
    action: function () { renderProfile(main); },
  });
  if (!ok && main) {
    main.innerHTML = '<p class="mc-muted">É preciso entrar para ver o perfil.</p>';
  }
});
register('/combinamos/:id', function (params) {
  requireAuth({
    context: 'chat',
    action: function () { renderCombinamos(main, params.id); },
    resumePath: '/combinamos/' + (params && params.id ? params.id : ''),
  });
});
register('/services', function () { renderMinguito(main); });
register('/', function () { navigate('/feed', { replace: true }); });

setOnChange(function (route) { setActiveNav(route.path); });

var navEl = document.getElementById('mc-bottom-nav');
if (navEl) {
  navEl.addEventListener('click', function (e) {
    var t = e.target;
    while (t && t !== navEl) {
      if (t.getAttribute && t.getAttribute('data-nav')) {
        navigate(t.getAttribute('data-nav'));
        break;
      }
      t = t.parentNode;
    }
  });
}

async function boot() {
  if (isLocalMode()) ensureLocalSeed();
  showBootLoading();
  mountGuestWall();
  desktopShell = initDesktopShell();
  await runBootstrap();
  hideBootLoading();
  start();
  setActiveNav(getRoute().path);
  paintTabIcons();
  /* badge de modo removido da UI — não expor local/api ao utilizador */
}

boot().catch(function (e) {
  console.error(e);
  hideBootLoading();
  start();
  paintTabIcons();
  if (desktopShell) desktopShell.syncRoute(getRoute().path);
});
