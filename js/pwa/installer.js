/**
 * PWA Mucula — registo SW + banner de instalação (primeira visita).
 * Não força prompt automático (política do browser).
 * Idioma alinhado à plataforma.
 */
var deferredPrompt = null;
var DISMISS_KEY = 'mc_pwa_dismiss_until';
var DISMISS_MS = 7 * 24 * 60 * 60 * 1000; /* 7 dias */

function isDismissed() {
  try {
    var until = Number(localStorage.getItem(DISMISS_KEY) || 0);
    return until > Date.now();
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
}

function showBanner() {
  if (isStandalone() || isDismissed()) return;
  if (document.getElementById('mc-pwa-banner')) return;

  var banner = document.createElement('div');
  banner.id = 'mc-pwa-banner';
  banner.setAttribute('role', 'dialog');
  banner.setAttribute('aria-label', 'Instalar Mucula');
  banner.innerHTML =
    '<div class="mc-pwa-sheet">' +
    '<p class="mc-pwa-title">Mucula no ecrã inicial</p>' +
    '<p class="mc-pwa-text">Instala a app para abrir mais depressa o teu bairro — Feed, Fluxo e Publicar.</p>' +
    '<div class="mc-pwa-actions">' +
    '<button type="button" class="mc-pwa-btn mc-pwa-btn--primary" id="mc-pwa-install">Instalar</button>' +
    '<button type="button" class="mc-pwa-btn mc-pwa-btn--ghost" id="mc-pwa-later">Agora não</button>' +
    '</div></div>';

  document.body.appendChild(banner);

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

/**
 * Inicia PWA: SW + beforeinstallprompt.
 * Chamar uma vez a partir de app.js.
 */
export function initPwa() {
  if (typeof window === 'undefined') return;

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker
        .register('./sw.js', { scope: './' })
        .catch(function () {
          /* SW falhou — app continua normal */
        });
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
