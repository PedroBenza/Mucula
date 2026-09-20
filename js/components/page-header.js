/**
 * Cabeçalho fixo por aba — só o título.
 * Feed: logotipo M + «Mucula» juntos.
 */
function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * @param {string} title
 * @param {{ brand?: boolean }} [opts]
 */
export function pageHeaderHtml(title, opts) {
  opts = opts || {};
  var inner;
  if (opts.brand) {
    inner =
      '<span class="mc-brand">' +
      '<img class="mc-brand-logo" src="./assets/images/logo-m.png" alt="" width="28" height="28" />' +
      '<span class="mc-brand-name">' +
      esc(title) +
      '</span></span>';
  } else {
    inner = esc(title);
  }
  return (
    '<header class="mc-page-header">' +
    '<h1 class="mc-page-header-title">' +
    inner +
    '</h1></header>'
  );
}

export function pageLeadHtml(text) {
  if (!text) return '';
  return '<p class="mc-page-lead">' + esc(text) + '</p>';
}
