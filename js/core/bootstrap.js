import { isLocalMode } from '../config.js';
import { fetchMe, persistLocalSessionUser } from '../api/auth.js';
import { getSupabase } from '../api/supabase-client.js';
import { setUser, enterAsGuest } from '../state/session.js';
import { ensureLocalSeed } from '../local/store.js';
import { ensureDemandSeed } from '../local/demands.js';

async function hasAnySession() {
  if (isLocalMode()) {
    return !!localStorage.getItem('mc_local_session_user');
  }
  const sb = getSupabase();
  const { data } = await sb.auth.getSession();
  return !!data.session;
}

export async function runBootstrap() {
  if (isLocalMode()) {
    ensureLocalSeed();
    try {
      ensureDemandSeed();
    } catch (e) {}
  }

  if (!(await hasAnySession())) {
    enterAsGuest();
    return { mode: 'guest' };
  }
  try {
    const me = await fetchMe();
    setUser(me);
    if (isLocalMode()) await persistLocalSessionUser(me);
    return { mode: 'user', user: me };
  } catch {
    enterAsGuest();
    return { mode: 'guest', reason: 'fetchMe_failed' };
  }
}
