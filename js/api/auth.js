/**
 * Auth — bifurca local vs Supabase.
 * Em api mode: email obrigatório.
 */
import { isLocalMode } from '../config.js';
import { localRegister, localLogin } from '../local/store.js';
import { getSupabase } from './supabase-client.js';

export async function register(input) {
  if (isLocalMode()) {
    const user = localRegister(input);
    await persistLocalSessionUser(user);
    return user;
  }
  const email = String(input.email || '').trim();
  if (!email) {
    const e = new Error('Email é obrigatório para criar conta.');
    e.code = 'REGISTER_NO_EMAIL';
    throw e;
  }
  const sb = getSupabase();
  const displayName =
    [input.firstName, input.lastName].filter(Boolean).join(' ').trim() ||
    input.username ||
    email;
  const { error } = await sb.auth.signUp({
    email,
    password: input.password,
    options: {
      data: {
        username: input.username || null,
        display_name: displayName,
        phone: input.phone || null,
      },
    },
  });
  if (error) {
    const e = new Error(error.message);
    e.code = error.code || 'REGISTER_FAILED';
    throw e;
  }
  return await fetchMe();
}

export async function login(input) {
  if (isLocalMode()) {
    const user = localLogin(input);
    await persistLocalSessionUser(user);
    return user;
  }
  const email = String(input.identifier || '').trim();
  if (!email.includes('@')) {
    const e = new Error('Em modo servidor, entra com o teu email.');
    e.code = 'LOGIN_NEEDS_EMAIL';
    throw e;
  }
  const sb = getSupabase();
  const { error } = await sb.auth.signInWithPassword({
    email,
    password: input.password,
  });
  if (error) {
    const e = new Error('Credenciais inválidas.');
    e.code = 'INVALID_CREDENTIALS';
    throw e;
  }
  return await fetchMe();
}

export async function fetchMe() {
  if (isLocalMode()) {
    try {
      const raw = localStorage.getItem('mc_local_session_user');
      if (raw) return JSON.parse(raw);
    } catch (_) {}
    const e = new Error('Sem sessão local');
    e.code = 'NO_SESSION';
    throw e;
  }
  const sb = getSupabase();
  const {
    data: { user },
    error,
  } = await sb.auth.getUser();
  if (error || !user) {
    const e = new Error('Sem sessão');
    e.code = 'NO_SESSION';
    throw e;
  }
  const { data: profile } = await sb
    .from('profiles')
    .select('id, username, display_name, phone, neighborhood')
    .eq('id', user.id)
    .maybeSingle();
  const displayName = (profile && profile.display_name) || user.email;
  const parts = String(displayName).split(/\s+/);
  return {
    id: user.id,
    username: (profile && profile.username) || null,
    firstName: parts[0] || displayName,
    lastName: parts.slice(1).join(' '),
    email: user.email,
    phone: (profile && profile.phone) || null,
    neighborhood: (profile && profile.neighborhood) || null,
    verified: !!user.email_confirmed_at,
    createdAt: user.created_at,
  };
}

export async function persistLocalSessionUser(user) {
  if (user) localStorage.setItem('mc_local_session_user', JSON.stringify(user));
  else localStorage.removeItem('mc_local_session_user');
}

export async function updateAvatar() {
  return { id: 'noop', avatar: '', avatarStorageId: '' };
}

export async function logout() {
  if (isLocalMode()) {
    localStorage.removeItem('mc_local_session_user');
    return;
  }
  const sb = getSupabase();
  await sb.auth.signOut();
}
