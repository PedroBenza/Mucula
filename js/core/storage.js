/** Keys exactas do client.ts RN (SecureStore → localStorage na web) */
const ACCESS = 'mucula_access_token';
const REFRESH = 'mucula_refresh_token';

export async function getAccessToken() {
  try { return localStorage.getItem(ACCESS); } catch { return null; }
}
export async function getRefreshToken() {
  try { return localStorage.getItem(REFRESH); } catch { return null; }
}
export async function saveTokens(accessToken, refreshToken) {
  localStorage.setItem(ACCESS, accessToken);
  localStorage.setItem(REFRESH, refreshToken);
}
export async function clearTokens() {
  localStorage.removeItem(ACCESS);
  localStorage.removeItem(REFRESH);
}
export async function hasSession() {
  return (await getRefreshToken()) !== null;
}
