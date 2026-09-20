/**
 * Singleton do cliente Supabase.
 * Só usado em DATA_MODE=api.
 */
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config.js';

let _client = null;

export function getSupabase() {
  if (!_client) {
    _client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        storageKey: 'mucula_sb_auth',
      },
    });
  }
  return _client;
}
