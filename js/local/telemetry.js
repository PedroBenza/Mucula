/**
 * Telemetria local — preparada para enviar ao backend (Supabase) depois.
 * Eventos alinhados à Etapa 5.
 */
var KEY = 'mc_local_events';
var MAX = 500;

function read() {
  try {
    var raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return [];
}

function write(arr) {
  localStorage.setItem(KEY, JSON.stringify(arr.slice(0, MAX)));
}

export function track(eventName, payload) {
  if (!eventName) return;
  var row = {
    e: String(eventName),
    t: Date.now(),
    p: payload || {},
  };
  var all = read();
  all.unshift(row);
  write(all);
  return row;
}

export function listEvents(limit) {
  var all = read();
  if (limit) return all.slice(0, limit);
  return all;
}

export function countEvents(eventName, sinceTs) {
  var all = read();
  var n = 0;
  for (var i = 0; i < all.length; i++) {
    if (all[i].e !== eventName) continue;
    if (sinceTs && all[i].t < sinceTs) continue;
    n++;
  }
  return n;
}
