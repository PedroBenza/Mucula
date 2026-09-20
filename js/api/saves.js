/**
 * Favoritos — tabela public.saves (schema 001).
 * Local: localStorage. Api: Supabase.
 */
import { isLocalMode } from '../config.js';
import { getSupabase } from './supabase-client.js';
import * as localSaves from '../local/saves.js';

/**
 * @returns {Promise<boolean>}
 */
export async function isSaved(listingId, userId) {
  if (isLocalMode()) return localSaves.isSaved(listingId, userId);
  if (listingId == null) return false;
  const sb = getSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return false;
  const { data, error } = await sb
    .from('saves')
    .select('listing_id')
    .eq('user_id', user.id)
    .eq('listing_id', listingId)
    .maybeSingle();
  if (error) return false;
  return !!data;
}

/**
 * @returns {Promise<boolean>} true se ficou guardado
 */
export async function toggleSave(listingId, userId) {
  if (isLocalMode()) return localSaves.toggleSave(listingId, userId);
  if (listingId == null) return false;
  const sb = getSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return false;

  const { data: existing } = await sb
    .from('saves')
    .select('listing_id')
    .eq('user_id', user.id)
    .eq('listing_id', listingId)
    .maybeSingle();

  if (existing) {
    const { error } = await sb
      .from('saves')
      .delete()
      .eq('user_id', user.id)
      .eq('listing_id', listingId);
    if (error) throw new Error(error.message);
    return false;
  }

  const { error: insErr } = await sb.from('saves').insert({
    user_id: user.id,
    listing_id: listingId,
  });
  if (insErr) throw new Error(insErr.message);
  return true;
}

/**
 * @returns {Promise<string[]>}
 */
export async function listSavedIds(userId) {
  if (isLocalMode()) return localSaves.listSavedIds(userId);
  const sb = getSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return [];
  const { data, error } = await sb
    .from('saves')
    .select('listing_id')
    .eq('user_id', user.id);
  if (error) throw new Error(error.message);
  return (data || []).map(function (r) {
    return r.listing_id;
  });
}
