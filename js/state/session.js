const listeners = new Set();
const state = {
  user: null,
  isGuest: false,
  isBootstrapping: true,
  guestWall: null,
};

export function getSession() { return { ...state }; }
export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
function emit() {
  const snap = getSession();
  listeners.forEach((fn) => { try { fn(snap); } catch (e) { console.warn(e); } });
}
export function setUser(user) {
  state.user = user; state.isGuest = false; state.isBootstrapping = false; state.guestWall = null; emit();
}
export function clearUser() {
  state.user = null; state.isBootstrapping = false; emit();
}
export function enterAsGuest() {
  state.isGuest = true; state.user = null; state.isBootstrapping = false; emit();
}
export function openGuestWall(context) { state.guestWall = context; emit(); }
export function closeGuestWall() { state.guestWall = null; emit(); }
export function isAuthenticated() { return !!state.user && !state.isGuest; }
