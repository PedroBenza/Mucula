/**
 * Vistas — tabela public.listing_views (schema 001).
 * Coluna: day (date, timezone Africa/Luanda no servidor).
 * PK: (user_id, listing_id, day) — 1 vista por utilizador + listing + dia.
 * Local: localStorage. Api: Supabase.
 */
import { isLocalMode } from '../config.js';
import { getSupabase } from './supabase-client.js';
import * as localViews from '../local/listing-views.js';

/**
 * Dia civil em Africa/Luanda (YYYY-MM-DD).
 * Alinhado ao default do 001 (timezone Africa/Luanda).
 */
function dayKeyLuanda(ts) {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Africa/Luanda',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(ts != null ? new Date(ts) : new Date());
  } catch (e) {
    var d = new Date(ts != null ? ts : Date.now());
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + day;
  }
}

/**
 * @returns {Promise<boolean>} true se contou vista nova
 */
export async function recordListingViewOncePerDay(listingId, userId) {
  if (isLocalMode()) {
    return localViews.recordListingViewOncePerDay(listingId, userId);
  }
  if (listingId == null) return false;

  const sb = getSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return false;

  var day = dayKeyLuanda();

  const { error } = await sb.from('listing_views').insert({
    user_id: user.id,
    listing_id: listingId,
    day: day,
  });

  if (error) {
    /* 23505 = já contou este dia — esperado, não é falha de produto */
    if (
      error.code === '23505' ||
      /duplicate|unique/i.test(String(error.message || ''))
    ) {
      return false;
    }
    return false;
  }
  return true;
}

/**
 * Contagem de vistas por listing (dono — RLS author).
 * @param {string[]} listingIds
 * @returns {Promise<Record<string, number>>}
 */
export async function countViewsByListingIds(listingIds) {
  var map = {};
  if (isLocalMode() || !listingIds || !listingIds.length) return map;

  const sb = getSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return map;

  /* Chunk para não estourar .in() */
  var ids = listingIds.filter(Boolean);
  var chunk = 80;
  for (var i = 0; i < ids.length; i += chunk) {
    var part = ids.slice(i, i + chunk);
    const { data, error } = await sb
      .from('listing_views')
      .select('listing_id')
      .in('listing_id', part);
    if (error || !data) continue;
    for (var j = 0; j < data.length; j++) {
      var lid = data[j].listing_id;
      map[lid] = (map[lid] || 0) + 1;
    }
  }
  return map;
}
