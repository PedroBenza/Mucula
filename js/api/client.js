import { API_URL } from '../config.js';
import {
  getAccessToken, getRefreshToken, saveTokens, clearTokens, hasSession,
} from '../core/storage.js';

export class ApiError extends Error {
  constructor(status, code, message, reasons) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.reasons = reasons;
  }
}

/** Falha de rede/CORS/DNS — não é resposta HTTP do backend. */
export class NetworkError extends Error {
  constructor(message, cause) {
    super(message);
    this.name = 'NetworkError';
    this.code = 'NETWORK_ERROR';
    this.status = 0;
    this.cause = cause;
  }
}

let refreshInFlight = null;

async function refreshAccessToken() {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
    const refreshToken = await getRefreshToken();
    if (!refreshToken) return null;
    try {
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
        mode: 'cors',
      });
      if (!res.ok) {
        await clearTokens();
        return null;
      }
      const data = await res.json();
      await saveTokens(data.accessToken, data.refreshToken);
      return data.accessToken;
    } catch {
      return null;
    }
  })();
  const result = await refreshInFlight;
  refreshInFlight = null;
  return result;
}

export async function apiRequest(path, options = {}) {
  const { method = 'GET', body, skipAuth = false } = options;

  const doFetch = async (token) => {
    const headers = { 'Content-Type': 'application/json', Accept: 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    try {
      return await fetch(`${API_URL}${path}`, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
        mode: 'cors',
      });
    } catch (err) {
      throw new NetworkError(
        `Sem ligação à API (${API_URL}). Verifica a rede, o servidor e CORS para esta origem.`,
        err
      );
    }
  };

  const token = skipAuth ? null : await getAccessToken();
  let res = await doFetch(token);

  if (res.status === 401 && !skipAuth && (await hasSession())) {
    const newToken = await refreshAccessToken();
    if (newToken) res = await doFetch(newToken);
  }

  if (res.status === 204) return undefined;

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const err = (data && data.error) ? data.error : {};
    throw new ApiError(
      res.status,
      err.code || 'UNKNOWN_ERROR',
      err.message || 'Erro inesperado',
      err.reasons
    );
  }
  return data;
}

export { saveTokens, clearTokens, getRefreshToken, hasSession, refreshAccessToken, API_URL };
