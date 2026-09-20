/**
 * Identidade de sessão (R11 / H4).
 *
 * - resolveUserId() → id da sessão ou null (nunca inventa)
 * - requireUserId() → id ou throw legível
 * - sameUserId(a,b) → comparação estável (string)
 *
 * 'local-user-1' só é válido se for o id REAL gravado na sessão (demo).
 * Não usar como fallback em fluxos autenticados.
 */
import { getSession } from '../state/session.js';

export function resolveUserId() {
  try {
    var sess = getSession();
    var u = sess && sess.user;
    if (u && (u.id != null || u._id != null)) {
      var id = u.id != null ? u.id : u._id;
      if (id !== '' && id != null) return String(id);
    }
  } catch (e) {}
  return null;
}

export function requireUserId() {
  var id = resolveUserId();
  if (!id) {
    var err = new Error('Precisas de entrar na conta para continuar.');
    err.code = 'NEED_AUTH';
    throw err;
  }
  return id;
}

export function sameUserId(a, b) {
  if (a == null || b == null || a === '' || b === '') return false;
  return String(a) === String(b);
}

/** Sessão local persistida (modo local) — só o que está gravado. */
export function resolvePersistedLocalUserId() {
  try {
    var u = JSON.parse(localStorage.getItem('mc_local_session_user') || 'null');
    if (u && u.id != null && u.id !== '') return String(u.id);
  } catch (e) {}
  return null;
}
