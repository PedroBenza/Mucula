/**
 * Favoritos — H2 idempotente por (userId + listingId).
 * Sem userId: não grava (evita misturar contas no mesmo aparelho).
 */
import { resolveUserId } from '../core/user-id.js';

var KEY = 'mc_local_saves_v2';

function readMap() {
  try {
    var raw = localStorage.getItem(KEY);
    if (raw) {
      var parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  /* migração legada: array global → ignorar (não há user) */
  return {};
}

function writeMap(map) {
  localStorage.setItem(KEY, JSON.stringify(map));
}

function keyFor(userId, listingId) {
  return String(userId) + '::' + String(listingId);
}

export function isSaved(listingId, userId) {
  var uid = userId != null ? String(userId) : resolveUserId();
  if (!uid || listingId == null) return false;
  var map = readMap();
  return !!map[keyFor(uid, listingId)];
}

/**
 * @returns {boolean} true se ficou guardado
 */
export function toggleSave(listingId, userId) {
  var uid = userId != null ? String(userId) : resolveUserId();
  if (!uid) return false;
  listingId = String(listingId);
  var map = readMap();
  var k = keyFor(uid, listingId);
  if (map[k]) {
    delete map[k];
    writeMap(map);
    return false;
  }
  map[k] = { listingId: listingId, userId: uid, at: Date.now() };
  writeMap(map);
  return true;
}

export function listSavedIds(userId) {
  var uid = userId != null ? String(userId) : resolveUserId();
  if (!uid) return [];
  var map = readMap();
  var out = [];
  var prefix = String(uid) + '::';
  for (var k in map) {
    if (Object.prototype.hasOwnProperty.call(map, k) && k.indexOf(prefix) === 0) {
      out.push(map[k].listingId || k.slice(prefix.length));
    }
  }
  return out;
}
