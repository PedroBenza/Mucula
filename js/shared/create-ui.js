/** UI partilhada CreateFlow — evita drift entre product/service (Etapa 1–2 blindagem). */

export function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function stepDots(total, current) {
  var html = '<div class="mc-step-dots" aria-hidden="true">';
  for (var i = 0; i < total; i++) {
    html +=
      '<span class="mc-step-dot' +
      (i === current ? ' is-on' : '') +
      (i < current ? ' is-done' : '') +
      '"></span>';
  }
  return html + '</div>';
}

export function stepHeader(label, title, sub) {
  return (
    '<div class="mc-step-head">' +
    '<p class="mc-step-label">' +
    esc(label) +
    '</p>' +
    '<h2 class="mc-h2">' +
    esc(title) +
    '</h2>' +
    (sub ? '<p class="mc-muted">' + esc(sub) + '</p>' : '') +
    '</div>'
  );
}

/** Zona de foto: um único input, sem double-fire. */
export function photoZoneHtml(imageUrl, inputId) {
  var body = imageUrl
    ? '<img src="' +
      esc(imageUrl) +
      '" alt="" class="mc-photo-preview" />' +
      '<span class="mc-photo-hint">Tocar para mudar</span>'
    : '<span class="mc-photo-plus">+</span><span class="mc-photo-hint">Adicionar foto</span>';
  return (
    '<label class="mc-photo-zone" for="' +
    esc(inputId) +
    '">' +
    body +
    '<input type="file" accept="image/*" id="' +
    esc(inputId) +
    '" class="mc-photo-input" /></label>'
  );
}
