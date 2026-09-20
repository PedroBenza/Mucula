/**
 * PWA Mucula — SW + barra de instalação discreta (topo).
 * Estilo: ícone + nome + Instalar + fechar. Sem texto promocional.
 */
var deferredPrompt = null;
var DISMISS_KEY = 'mc_pwa_dismiss_until';
var DISMISS_MS = 14 * 24 * 60 * 60 * 1000;

function isDismissed() {
  try {
    return Number(localStorage.getItem(DISMISS_KEY) || 0) > Date.now();
  } catch (e) {
    return false;
  }
}

function setDismissed() {
  try {
    localStorage.setItem(DISMISS_KEY, String(Date.now() + DISMISS_MS));
  } catch (e) {}
}

function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  );
}

function hideBanner() {
  var el = document.getElementById('mc-pwa-banner');
  if (el) el.remove();
  document.documentElement.classList.remove('mc-pwa-open');
}

function showBanner() {
  if (isStandalone() || isDismissed()) return;
  if (document.getElementById('mc-pwa-banner')) return;

  var banner = document.createElement('div');
  banner.id = 'mc-pwa-banner';
  banner.setAttribute('role', 'region');
  banner.setAttribute('aria-label', 'Instalar Mucula');
  banner.innerHTML =
    '<div class="mc-pwa-bar">' +
    '<img class="mc-pwa-logo" src="./assets/images/icon.png" width="28" height="28" alt="" />' +
    '<span class="mc-pwa-name">Mucula</span>' +
    '<button type="button" class="mc-pwa-install" id="mc-pwa-install">Instalar</button>' +
    '<button type="button" class="mc-pwa-close" id="mc-pwa-later" aria-label="Fechar">×</button>' +
    '</div>';

  document.body.appendChild(banner);
  document.documentElement.classList.add('mc-pwa-open');

  document.getElementById('mc-pwa-install').addEventListener('click', function () {
    if (!deferredPrompt) {
      hideBanner();
      return;
    }
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(function () {
      deferredPrompt = null;
      hideBanner();
    });
  });

  document.getElementById('mc-pwa-later').addEventListener('click', function () {
    setDismissed();
    hideBanner();
  });
}

export function initPwa() {
  if (typeof window === 'undefined') return;

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('./sw.js', { scope: './' }).catch(function () {});
    });
  }

  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferredPrompt = e;
    showBanner();
  });

  window.addEventListener('appinstalled', function () {
    deferredPrompt = null;
    hideBanner();
    try {
      localStorage.removeItem(DISMISS_KEY);
    } catch (e) {}
  });
}
