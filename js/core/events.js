const bus = new EventTarget();
export function on(type, handler) {
  bus.addEventListener(type, handler);
  return () => bus.removeEventListener(type, handler);
}
export function emit(type, detail) {
  bus.dispatchEvent(new CustomEvent(type, { detail }));
}
