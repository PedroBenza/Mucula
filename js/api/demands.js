/**
 * Demands (procuras) — bifurca local vs Supabase.
 */
import { isLocalMode } from '../config.js';
import { getSupabase } from './supabase-client.js';
import * as localDemands from '../local/demands.js';

function mapRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    authorId: row.author_id,
    title: row.title,
    category: row.category || '',
    neighborhood: row.neighborhood || '',
    budgetMax:
      row.budget_max != null && row.budget_max !== ''
        ? Number(row.budget_max)
        : null,
    conditionPref: row.condition_pref || 'qualquer',
    urgency: row.urgency || '',
    status: row.status || 'active',
    createdAt: row.created_at
      ? new Date(row.created_at).getTime()
      : Date.now(),
    updatedAt: row.updated_at
      ? new Date(row.updated_at).getTime()
      : null,
  };
}

export async function listDemands(authorId) {
  if (isLocalMode()) return localDemands.listDemands(authorId);
  const sb = getSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return [];
  var q = sb.from('demands').select('*').order('created_at', { ascending: false });
  if (authorId) {
    q = q.eq('author_id', authorId);
  } else {
    q = q.eq('author_id', user.id);
  }
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data || []).map(mapRow);
}

export async function getDemand(id) {
  if (isLocalMode()) return localDemands.getDemand(id);
  if (!id) return null;
  const sb = getSupabase();
  const { data, error } = await sb
    .from('demands')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return mapRow(data);
}

export async function createDemand(input, authorId) {
  if (isLocalMode()) return localDemands.createDemand(input, authorId);

  const sb = getSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) {
    const e = new Error('Entra na conta para publicar uma procura.');
    e.code = 'NEED_AUTH';
    throw e;
  }

  var title = String((input && input.title) || '').trim();
  if (!title) throw new Error('Indica o que procuras.');
  var category = (input && input.category) || '';
  if (!category) throw new Error('Escolhe uma categoria.');

  /* Limite simples: 8 activas (paridade local MAX) */
  const { count, error: cErr } = await sb
    .from('demands')
    .select('id', { count: 'exact', head: true })
    .eq('author_id', user.id)
    .eq('status', 'active');
  if (!cErr && count != null && count >= 8) {
    throw new Error('Limite de 8 procuras activas.');
  }

  const { data, error } = await sb
    .from('demands')
    .insert({
      author_id: user.id,
      title: title,
      category: category,
      neighborhood: String((input && input.neighborhood) || '').trim() || null,
      budget_max:
        input && input.budgetMax !== '' && input.budgetMax != null
          ? Number(input.budgetMax)
          : null,
      condition_pref: (input && input.conditionPref) || 'qualquer',
      urgency: (input && input.urgency) || null,
      status: 'active',
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapRow(data);
}

export async function updateDemandStatus(id, status) {
  if (isLocalMode()) return localDemands.updateDemandStatus(id, status);

  const allowed = ['active', 'paused', 'expired', 'closed', 'resolved'];
  if (!allowed.includes(status)) {
    throw new Error('Estado de procura inválido.');
  }

  const sb = getSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) {
    const e = new Error('Entra na conta.');
    e.code = 'NEED_AUTH';
    throw e;
  }

  const { data, error } = await sb
    .from('demands')
    .update({ status: status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('author_id', user.id)
    .select()
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error('Procura não encontrada.');
  return mapRow(data);
}

/** Seed só em modo local — em api não inventa dados. */
export function ensureDemandSeed() {
  if (isLocalMode()) {
    try {
      localDemands.ensureDemandSeed();
    } catch (e) {}
  }
}
