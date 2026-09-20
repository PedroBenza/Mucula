/**
 * Listings — bifurca local vs Supabase.
 */
import { isLocalMode, MEDIA_BASE } from '../config.js';
import {
  localGetListings,
  localGetListing,
  localCreateListing,
  localMyListings,
  ensureLocalSeed,
} from '../local/store.js';
import { filterOnMarket } from '../domain/listing-market.js';
import { resolvePersistedLocalUserId } from '../core/user-id.js';
import { getSupabase } from './supabase-client.js';

function publicUrlForKey(key) {
  if (!key) return null;
  if (String(key).startsWith('http://') || String(key).startsWith('https://')) return key;
  return `${MEDIA_BASE}/${key}`;
}

function mapRowToListing(row) {
  if (!row) return null;
  const imageUrls = (row.image_urls || []).filter(Boolean).map(publicUrlForKey);
  return {
    _id: row.id,
    title: row.title,
    description: row.description || undefined,
    price: Number(row.price),
    priceUnit: row.price_unit || null,
    type: row.type,
    category: row.category,
    condition: row.condition || null,
    location: {
      neighborhood: row.neighborhood || '',
      lat: row.lat != null ? Number(row.lat) : undefined,
      lng: row.lng != null ? Number(row.lng) : undefined,
    },
    imageUrl: imageUrls[0] || null,
    imageUrls,
    authorId: row.author_id,
    author: null,
    createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
    isFeatured: !!row.is_featured,
    status: row.status,
    availableDays: row.available_days || undefined,
    estimatedDuration: row.estimated_duration || null,
    coversAllLuanda: !!row.covers_all_luanda,
    tags: row.tags || undefined,
    negotiable: !!row.negotiable,
  };
}

export function mapFeedItemToListing(raw) {
  return mapRowToListing(raw);
}

export async function fetchListingFeed(params = {}) {
  if (isLocalMode()) {
    ensureLocalSeed();
    let items = filterOnMarket(localGetListings());
    if (params.type) items = items.filter((i) => i.type === params.type);
    if (params.category) items = items.filter((i) => i.category === params.category);
    return { items, nextCursor: null, hasMore: false };
  }
  const sb = getSupabase();
  const { data, error } = await sb.rpc('listings_feed', {
    p_type: params.type || null,
    p_category: params.category || null,
    p_limit: params.limit || 50,
  });
  if (error) {
    const e = new Error(error.message);
    e.code = 'FEED_FAILED';
    throw e;
  }
  return {
    items: (data || []).map(mapRowToListing),
    nextCursor: null,
    hasMore: false,
  };
}

export async function fetchListingById(id) {
  if (isLocalMode()) {
    const item = localGetListing(id);
    if (!item) {
      const e = new Error('Anúncio não encontrado');
      e.status = 404;
      throw e;
    }
    return item;
  }
  const sb = getSupabase();
  const { data, error } = await sb.rpc('listing_detail_public', { p_id: id });
  if (error) {
    const e = new Error(error.message);
    e.code = 'DETAIL_FAILED';
    throw e;
  }
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) {
    const e = new Error('Anúncio não encontrado');
    e.status = 404;
    throw e;
  }
  return mapRowToListing(row);
}

export async function fetchMyListings() {
  if (isLocalMode()) {
    const authorId = resolvePersistedLocalUserId();
    if (!authorId) return [];
    return localMyListings(authorId);
  }
  const sb = getSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return [];
  const { data, error } = await sb
    .from('listings')
    .select('id, title, price, status, category, created_at')
    .eq('author_id', user.id)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []).map((row) => ({
    id: row.id,
    title: row.title,
    price: Number(row.price),
    status: row.status,
    category: row.category,
    createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
  }));
}

export async function createListing(input) {
  if (isLocalMode()) {
    const authorId = resolvePersistedLocalUserId();
    if (!authorId) {
      const e = new Error('Precisas de entrar na conta para publicar.');
      e.code = 'NEED_AUTH';
      throw e;
    }
    return localCreateListing(input, authorId);
  }

  const sb = getSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) {
    const e = new Error('Precisas de entrar na conta para publicar.');
    e.code = 'NEED_AUTH';
    throw e;
  }

  const imageUrls = [];
  if (input.imageStorageIds && input.imageStorageIds.length) {
    for (const key of input.imageStorageIds) {
      if (key) imageUrls.push(publicUrlForKey(key) || key);
    }
  }
  if (input._localImageUrl && imageUrls.length === 0) {
    imageUrls.push(input._localImageUrl);
  }

  const payload = {
    author_id: user.id,
    title: input.title,
    description: input.description || null,
    price: Number(input.price) || 0,
    price_unit: input.priceUnit || 'total',
    type: input.type || 'produto',
    category: input.category || 'outros',
    condition: input.condition || null,
    neighborhood: (input.location && input.location.neighborhood) || null,
    negotiable: !!input.negotiable,
    floor_price:
      input.floorPrice != null && input.floorPrice !== ''
        ? Number(input.floorPrice)
        : null,
    image_urls: imageUrls,
    status: 'disponivel',
  };

  const { data, error } = await sb
    .from('listings')
    .insert(payload)
    .select('id, title, type, category, status, created_at')
    .single();

  if (error) {
    const e = new Error(error.message);
    e.code = error.code || 'CREATE_FAILED';
    throw e;
  }

  return {
    id: data.id,
    title: data.title,
    type: data.type,
    category: data.category,
    status: data.status,
    createdAt: data.created_at ? new Date(data.created_at).getTime() : Date.now(),
  };
}
