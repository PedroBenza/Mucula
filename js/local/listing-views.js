/**
 * H3 — 1 vista por utilizador + listing + dia civil (fuso local do aparelho).
 * Telemetria listing_view só é emitida na primeira vez do dia.
 */
import { track } from './telemetry.js';
import { resolveUserId } from '../core/user-id.js';

var KEY = 'mc_local_listing_views_day';

function dayKey(ts) {
  var d = new Date(ts != null ? ts : Date.now());
  var y = d.getFullYear();
  var m = String(d.getMonth() + 1).padStart(2, '0');
  var day = String(d.getDate()).padStart(2, '0');
  return y + '-' + m + '-' + day;
}

function read() {
  try {
    var raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return {};
}

function write(map) {
  localStorage.setItem(KEY, JSON.stringify(map));
}

/**
 * @returns {boolean} true se contou vista nova hoje
 */
export function recordListingViewOncePerDay(listingId, userId) {
  if (listingId == null) return false;
  var uid = userId != null ? String(userId) : resolveUserId() || 'anon';
  var day = dayKey();
  var map = read();
  var k = uid + '::' + String(listingId) + '::' + day;
  if (map[k]) return false;
  map[k] = Date.now();
  /* limpeza leve: remover chaves de dias antigos (>14) */
  var cutoff = Date.now() - 14 * 24 * 3600 * 1000;
  for (var key in map) {
    if (Object.prototype.hasOwnProperty.call(map, key) && map[key] < cutoff) {
      delete map[key];
    }
  }
  write(map);
  try {
    track('listing_view', { listingId: String(listingId), userId: uid, day: day });
  } catch (e) {}
  return true;
}
