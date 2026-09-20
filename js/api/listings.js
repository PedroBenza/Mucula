/**
 * Listings — bifurca local vs Supabase.
 */
import { isLocalMode, MEDIA_BASE } from '../config.js';
import {
  localGetListings,
  localGetListing,
  localCreateListing,
  localMyListings,
  localSetListingStatus,
  ensureLocalSeed,
} from '../local/store.js';
import { filterOnMarket } from '../domain/listing-market.js';
import { resolvePersistedLocalUserId } from '../core/user-id.js';
import { getSupabase } from './supabase-client.js';

/**
 * Resolve URL de imagem para UI / persistência.
 * - data: e http(s): passam intactos (usáveis no browser).
 * - Chaves local-media-* NÃO se concatenam a MEDIA_BASE em produção
 *   (não existe :9000 no Vercel) → null (placeholder na UI).
 * - Outras chaves opacas: só prefixa MEDIA_BASE em modo local (dev media server).
 */
function isDisplayableImageRef(value) {
  if (value == null || value === '') return false;
  var s = String(value);
  if (s.indexOf('data:image/') === 0) return true;
  if (s.indexOf('blob:') === 0) return true;
  /* URLs antigas inventadas (:9000 / local-media) não são servíveis em Vercel */
  if (s.indexOf(':9000/') >= 0 || s.indexOf('local-media-') >= 0) return false;
  if (s.indexOf('https://') === 0 || s.indexOf('http://') === 0) return true;
  return false;
}

function isLocalMediaKey(value) {
  var s = String(value || '');
  return s.indexOf('local-media-') === 0;
}

function publicUrlForKey(key) {
  if (!key) return null;
  var s = String(key);
  if (isDisplayableImageRef(s)) return s;
  if (isLocalMediaKey(s)) return null;
  if (isLocalMode()) {
    return MEDIA_BASE.replace(/\/$/, '') + '/' + s;
  }
  return null;
}

/**
 * Monta image_urls para INSERT api: prioriza data URL / URL absoluta.
 * Nunca grava URL inventada para mucula.vercel.app:9000.
 */
function collectImageUrlsForApiInsert(input) {
  input = input || {};
  var out = [];
  var seen = {};

  function push(ref) {
    if (!ref || seen[ref]) return;
    if (!isDisplayableImageRef(ref)) return;
    seen[ref] = true;
    out.push(ref);
  }

  if (Array.isArray(input.imageUrls)) {
    for (var i = 0; i < input.imageUrls.length; i++) push(input.imageUrls[i]);
  }
  push(input._localImageUrl);
  push(input.imageUrl);

  if (Array.isArray(input.imageStorageIds)) {
    for (var j = 0; j < input.imageStorageIds.length; j++) {
      var k = input.imageStorageIds[j];
      if (isDisplayableImageRef(k)) push(k);
      /* local-media-* ignorado de propósito — não é URL servível em api */
    }
  }
  return out;
}

function mapRowToListing(row) {
  if (!row) return null;
  const imageUrls = (row.image_urls || []).map(publicUrlForKey).filter(Boolean);
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
    .select('id, title, price, status, category, created_at, image_urls, is_featured')
    .eq('author_id', user.id)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []).map((row) => {
    const mapped = mapRowToListing(row) || {};
    return {
      id: row.id,
      _id: row.id,
      title: row.title,
      price: Number(row.price),
      status: row.status,
      category: row.category,
      createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
      imageUrl: mapped.imageUrl || null,
      imageUrls: mapped.imageUrls || [],
      isFeatured: !!row.is_featured,
      authorId: user.id,
    };
  });
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

  const imageUrls = collectImageUrlsForApiInsert(input);

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

/** Status que o dono pode alterar pela UI (arquivar / voltar ao mercado).
 *  reservado / vendido ficam só para o motor de negociação (RPCs). */
var OWNER_STATUS_ALLOW = {
  pausado: true,
  disponivel: true,
  active: true,
};

/**
 * Altera o status de uma publicação do autor autenticado.
 * Local → localStorage. Api → UPDATE listings (RLS: só o autor).
 *
 * @param {string} id
 * @param {string} status  ex.: 'pausado' | 'disponivel'
 * @returns {Promise<{ id: string, status: string }>}
 */
export async function setListingStatus(id, status) {
  if (!id) {
    const e = new Error('Publicação não encontrada.');
    e.code = 'NOT_FOUND';
    throw e;
  }
  const st = String(status || '').toLowerCase().trim();
  if (!OWNER_STATUS_ALLOW[st]) {
    const e = new Error('Este estado não pode ser alterado assim.');
    e.code = 'STATUS_NOT_ALLOWED';
    throw e;
  }
  /* Normaliza active → disponivel no servidor */
  const normalized = st === 'active' ? 'disponivel' : st;

  if (isLocalMode()) {
    const row = localSetListingStatus(id, normalized);
    return {
      id: row._id || row.id || id,
      status: row.status || normalized,
    };
  }

  const sb = getSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) {
    const e = new Error('Precisas de entrar na conta para arquivar.');
    e.code = 'NEED_AUTH';
    throw e;
  }

  const { data, error } = await sb
    .from('listings')
    .update({ status: normalized })
    .eq('id', id)
    .eq('author_id', user.id)
    .select('id, status')
    .maybeSingle();

  if (error) {
    const e = new Error(
      error.message || 'Não foi possível actualizar a publicação.'
    );
    e.code = error.code || 'UPDATE_FAILED';
    throw e;
  }
  if (!data) {
    const e = new Error(
      'Publicação não encontrada ou não tens permissão para a alterar.'
    );
    e.code = 'NOT_FOUND_OR_FORBIDDEN';
    throw e;
  }
  return { id: data.id, status: data.status };
}
