import { ASSET_FILES, assetUrl } from '../constants/assets-manifest.js';

/** Garante que as 45 imagens do original aparecem no DOM (modo local). */
export function mountAssetStrip(container) {
  if (!container) return function () {};
  container.className = 'mc-asset-strip';
  container.innerHTML =
    '<div class="mc-asset-strip-title">Assets do projecto (' +
    ASSET_FILES.length +
    ')</div>' +
    '<div class="mc-asset-strip-scroll"></div>';
  var scroller = container.querySelector('.mc-asset-strip-scroll');
  for (var i = 0; i < ASSET_FILES.length; i++) {
    var rel = ASSET_FILES[i];
    var fig = document.createElement('figure');
    fig.className = 'mc-asset-fig';
    var img = document.createElement('img');
    img.src = assetUrl(rel);
    img.alt = rel;
    img.loading = 'lazy';
    img.decoding = 'async';
    var cap = document.createElement('figcaption');
    var parts = rel.split('/');
    cap.textContent = parts[parts.length - 1];
    fig.appendChild(img);
    fig.appendChild(cap);
    scroller.appendChild(fig);
  }
  return function () {};
}
