/**
 * Router por hash (#/feed, #/login, #/listing/:id).
 * Evita depender de location.pathname (quebra em subpasta / index.html / Spck).
 */
const routes = [];
let current = { path: '/feed', params: {} };
let onChange = null;

export function setOnChange(fn) { onChange = fn; }

export function register(pattern, handler) {
  routes.push({ pattern, handler });
}

function match(pattern, path) {
  const pp = pattern.split('/').filter(Boolean);
  const tp = path.split('/').filter(Boolean);
  if (pp.length !== tp.length) return null;
  const params = {};
  for (let i = 0; i < pp.length; i++) {
    if (pp[i].startsWith(':')) params[pp[i].slice(1)] = decodeURIComponent(tp[i]);
    else if (pp[i] !== tp[i]) return null;
  }
  return params;
}

/** Normaliza hash → path interno (/feed, /listing/xyz) */
export function pathFromLocation() {
  let h = (typeof location !== 'undefined' && location.hash) ? location.hash : '';
  if (h.startsWith('#')) h = h.slice(1);
  if (h.startsWith('/')) h = h.slice(1);
  h = h.split('?')[0];
  if (!h || h === 'index.html') return '/feed';
  return '/' + h.replace(/^\/+/, '');
}

export function navigate(path, { replace = false } = {}) {
  let p = path || '/feed';
  if (!p.startsWith('/')) p = '/' + p;
  /* Hash completo, incluindo ?query (Minguito lê listingId/demandId do hash) */
  const hash = '#' + p;
  if (replace) {
    const url = (location.pathname || '') + (location.search || '') + hash;
    history.replaceState({}, '', url);
  } else {
    location.hash = hash;
  }
  resolve(p);
}

export function back() { history.back(); }

export function resolve(path) {
  const pathname = (path || pathFromLocation()).split('?')[0] || '/feed';
  for (const r of routes) {
    const params = match(r.pattern, pathname);
    if (params) {
      current = { path: pathname, params };
      r.handler(params, current);
      if (onChange) onChange(current);
      return;
    }
  }
  current = { path: '/feed', params: {} };
  navigate('/feed', { replace: true });
}

export function getRoute() { return { ...current }; }

export function start() {
  window.addEventListener('hashchange', () => resolve(pathFromLocation()));
  const initial = pathFromLocation();
  if (!location.hash || location.hash === '#' || location.hash === '#/') {
    navigate('/feed', { replace: true });
  } else {
    resolve(initial);
  }
}
