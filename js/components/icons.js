/** SVG de interface — Design System (sem bolha, currentColor). */

export function iconBack() {
  return (
    '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>'
  );
}

/** Voltar canónico: SVG + texto, classe mc-action mc-action--back */
export function backButtonHtml(id) {
  return (
    '<div class="mc-back-bar">' +
    '<button type="button" class="mc-action mc-action--back" id="' +
    id +
    '">' +
    iconBack() +
    '<span>Voltar</span></button></div>'
  );
}
