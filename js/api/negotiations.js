/**
 * Negotiations — bifurca local vs Supabase.
 */
import { isLocalMode } from '../config.js';
import { getSupabase } from './supabase-client.js';
import * as localNeg from '../local/negotiations.js';

export const computeCeiling = localNeg.computeCeiling;
export const evaluateProposal = localNeg.evaluateProposal;
export const isListingNegotiable = localNeg.isListingNegotiable;
export const isListingOnMarket = localNeg.isListingOnMarket;
export const ALLOWED = localNeg.ALLOWED;
export const NEGOTIATION_TTL_MS = localNeg.NEGOTIATION_TTL_MS;
export const NEGOTIATION_WARN_AFTER_MS = localNeg.NEGOTIATION_WARN_AFTER_MS;
export const getExpiryInfo = localNeg.getExpiryInfo;
export const transitionNegotiation = localNeg.transitionNegotiation;
export const getActiveOffer = localNeg.getActiveOffer;
export const listOfferHistory = localNeg.listOfferHistory;

function mapRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    listingId: row.listing_id,
    demandId: row.demand_id,
    buyerId: row.buyer_id,
    sellerId: row.seller_id,
    state: row.state,
    listingPrice: row.listing_price != null ? Number(row.listing_price) : null,
    floorPrice: row.floor_price != null ? Number(row.floor_price) : null,
    ceilingPrice: row.ceiling_price != null ? Number(row.ceiling_price) : null,
    negotiable: !!row.negotiable,
    proposedPrice: row.proposed_price != null ? Number(row.proposed_price) : null,
    belowFloor: !!row.below_floor,
    needsSellerDecision: !!row.needs_seller_decision,
    closedReason: row.closed_reason || null,
    completedAt: row.completed_at ? new Date(row.completed_at).getTime() : null,
    expiresAt: row.expires_at ? new Date(row.expires_at).getTime() : null,
    createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
    updatedAt: row.updated_at ? new Date(row.updated_at).getTime() : Date.now(),
  };
}

export async function openNegotiation(opts) {
  if (isLocalMode()) return localNeg.openNegotiation(opts);
  const sb = getSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) {
    const e = new Error('Precisas de entrar para iniciar conversa.');
    e.code = 'NEED_AUTH';
    throw e;
  }
  const { data, error } = await sb
    .from('negotiations')
    .insert({
      buyer_id: user.id,
      seller_id: opts.sellerId,
      listing_id: opts.listingId,
      state: 'interest',
    })
    .select()
    .single();
  if (error) {
    const e = new Error(error.message);
    e.code = error.code || 'NEG_CREATE_FAILED';
    throw e;
  }
  return mapRow(data);
}

export async function setProposedPrice(id, price, opts) {
  if (isLocalMode()) return localNeg.setProposedPrice(id, price, opts);
  const sb = getSupabase();
  const { data, error } = await sb.rpc('set_proposed_price', {
    p_negotiation_id: id,
    p_price: price,
  });
  if (error) {
    const e = new Error(error.message);
    e.code = error.code || 'NEG_PRICE_FAILED';
    throw e;
  }
  return mapRow(data);
}

function humanRpcError(error, fallback) {
  var msg = (error && (error.message || error.details || error.hint)) || '';
  msg = String(msg);
  if (/NEED_AUTH/i.test(msg)) return 'Precisas de entrar na conta.';
  if (/não encontrada|not found/i.test(msg)) return 'Negociação não encontrada.';
  if (/Só o vendedor|seller/i.test(msg)) return 'Só o vendedor pode fazer isto.';
  if (/já confirmado|matched/i.test(msg)) return 'O acordo já foi confirmado.';
  if (/não há proposta|proposed/i.test(msg)) return 'Ainda não há proposta do Minguito para recusar.';
  if (/function .* does not exist|PGRST202|42883/i.test(msg)) {
    return 'Falta aplicar a função no servidor (SQL 007). Contacta o suporte técnico.';
  }
  return msg || fallback || 'Não foi possível concluir.';
}

export async function confirmAsSeller(id, userId, opts) {
  if (isLocalMode()) return localNeg.confirmAsSeller(id, userId, opts);
  const sb = getSupabase();
  const { data, error } = await sb.rpc('confirm_as_seller', {
    p_negotiation_id: id,
    p_allow_below_floor: !!(opts && (opts.allowBelowFloor || opts.allowBelowFloorException)),
  });
  if (error) {
    const e = new Error(humanRpcError(error, 'Não foi possível confirmar o acordo.'));
    e.code = error.code || 'NEG_CONFIRM_FAILED';
    throw e;
  }
  return mapRow(data);
}

export async function completeDealAsSeller(id, userId) {
  if (isLocalMode()) return localNeg.completeDealAsSeller(id, userId);
  if (!id) {
    const e = new Error('Negociação inválida.');
    e.code = 'INVALID';
    throw e;
  }
  const sb = getSupabase();
  const { data, error } = await sb.rpc('complete_deal', {
    p_negotiation_id: id,
  });
  if (error) {
    const e = new Error(
      humanRpcError(error, 'Não foi possível marcar como vendido.')
    );
    e.code = error.code || 'NEG_COMPLETE_FAILED';
    throw e;
  }
  return mapRow(Array.isArray(data) ? data[0] : data);
}

export async function getNegotiation(id) {
  if (isLocalMode()) return localNeg.getNegotiation(id);
  const sb = getSupabase();
  const { data, error } = await sb
    .from('negotiations')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return mapRow(data);
}

export async function listNegotiations(userId) {
  if (isLocalMode()) return localNeg.listNegotiations(userId);
  const sb = getSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return [];
  const { data, error } = await sb
    .from('negotiations')
    .select('*')
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
    .order('updated_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []).map(mapRow);
}

export async function findOpenForListing(listingId, userId) {
  if (isLocalMode()) return localNeg.findOpenForListing(listingId, userId);
  const sb = getSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return null;
  const { data, error } = await sb
    .from('negotiations')
    .select('*')
    .eq('listing_id', listingId)
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
    .not('state', 'eq', 'closed')
    .order('updated_at', { ascending: false })
    .limit(1);
  if (error) return null;
  const row = (data || [])[0];
  return row ? mapRow(row) : null;
}


export async function rejectAsSeller(id, sellerId) {
  if (isLocalMode()) return localNeg.rejectAsSeller(id, sellerId);
  if (!id) {
    const e = new Error('Negociação inválida.');
    e.code = 'INVALID';
    throw e;
  }
  const sb = getSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) {
    const e = new Error('Precisas de entrar para recusar.');
    e.code = 'NEED_AUTH';
    throw e;
  }
  const { data, error } = await sb.rpc('reject_as_seller', {
    p_negotiation_id: id,
  });
  if (error) {
    const e = new Error(humanRpcError(error, 'Não foi possível recusar.'));
    e.code = error.code || 'REJECT_FAILED';
    throw e;
  }
  const row = mapRow(Array.isArray(data) ? data[0] : data);
  return row || { id: id, state: 'closed', closedReason: 'rejected' };
}

/**
 * Em api: pede ao servidor fechar negociações expiradas (48h).
 * Em local: sweep in-memory / localStorage.
 * Silencioso se a RPC ainda não existir (não parte o Fluxo).
 */
export async function sweepExpiredNegotiations(now) {
  if (isLocalMode()) return localNeg.sweepExpiredNegotiations(now);
  try {
    const sb = getSupabase();
    const { data, error } = await sb.rpc('expire_stale_negotiations');
    if (error) return null;
    return data;
  } catch (e) {
    return null;
  }
}
