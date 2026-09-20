/**
 * Sessões de chat Minguito isoladas (H4).
 * Chave: listing+user | demand+user | discovery+user
 * Sem userId válido → não lê/grava (R11 — sem misturar contas).
 */
var KEY = 'mc_local_minguito_sessions';
var MAX_TURNS = 40;

function readAll() {
  try {
    var raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return {};
}

function writeAll(map) {
  localStorage.setItem(KEY, JSON.stringify(map));
}

/**
 * @param {{ listingId?: string, demandId?: string, userId?: string }} ctx
 * @returns {string|null}
 */
export function sessionKey(ctx) {
  ctx = ctx || {};
  var uid = ctx.userId ? String(ctx.userId) : null;
  if (!uid) return null;
  if (ctx.listingId) return 'L:' + ctx.listingId + ':U:' + uid;
  if (ctx.demandId) return 'D:' + ctx.demandId + ':U:' + uid;
  return 'DISC:U:' + uid;
}

export function loadSessionMessages(ctx) {
  var k = sessionKey(ctx);
  if (!k) return [];
  var map = readAll();
  var s = map[k];
  if (!s || !s.messages) return [];
  return s.messages.slice();
}

export function saveSessionMessages(ctx, messages) {
  var k = sessionKey(ctx);
  if (!k) return;
  var map = readAll();
  var list = (messages || []).slice(-MAX_TURNS);
  map[k] = {
    messages: list,
    listingId: ctx.listingId || null,
    demandId: ctx.demandId || null,
    userId: String(ctx.userId),
    updatedAt: Date.now(),
  };
  writeAll(map);
}

export function appendSessionMessage(ctx, msg) {
  var list = loadSessionMessages(ctx);
  list.push(msg);
  saveSessionMessages(ctx, list);
  return list;
}

export function clearSession(ctx) {
  var k = sessionKey(ctx);
  if (!k) return;
  var map = readAll();
  delete map[k];
  writeAll(map);
}
