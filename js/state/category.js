/** Categoria activa do feed — paridade activeCategory no index RN */
let active = 'all';
const listeners = new Set();

export function getActiveCategory() {
  return active;
}

export function setActiveCategory(key) {
  active = key || 'all';
  listeners.forEach((fn) => {
    try { fn(active); } catch (_) {}
  });
}

export function onCategoryChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
