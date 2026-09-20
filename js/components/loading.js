export function showBootLoading() {
  let el = document.getElementById('mc-boot');
  if (!el) {
    el = document.createElement('div');
    el.id = 'mc-boot';
    el.className = 'mc-boot';
    el.innerHTML = '<div class="mc-loading" aria-label="A carregar"></div>';
    document.body.appendChild(el);
  }
  el.hidden = false;
}
export function hideBootLoading() {
  const el = document.getElementById('mc-boot');
  if (el) el.hidden = true;
}
