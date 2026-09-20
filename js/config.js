/**
 * API_URL — quando modo api.
 * DATA_MODE: 'local' | 'api'
 *   local = fixtures no browser (sem backend) — visualização / demos
 *   api   = HTTP real (futuro Supabase/Node)
 * Ordem: window.__MC_DATA_MODE__ → localStorage mc_data_mode → default 'local'
 */
function resolveDataMode() {
  if (typeof window !== 'undefined' && window.__MC_DATA_MODE__) {
    return window.__MC_DATA_MODE__ === 'api' ? 'api' : 'local';
  }
  try {
    const m = localStorage.getItem('mc_data_mode');
    if (m === 'api' || m === 'local') return m;
  } catch (_) {}
  return 'local';
}

function resolveApiUrl() {
  if (typeof window !== 'undefined' && window.__MC_API_URL__) {
    return String(window.__MC_API_URL__).replace(/\/$/, '');
  }
  try {
    const stored = localStorage.getItem('mc_api_url');
    if (stored && stored.trim()) return stored.trim().replace(/\/$/, '');
  } catch (_) {}
  if (typeof window !== 'undefined' && window.location && window.location.hostname) {
    return `http://${window.location.hostname}:3000`;
  }
  return 'http://127.0.0.1:3000';
}

export const DATA_MODE = resolveDataMode();
export const API_URL = resolveApiUrl();

export const MEDIA_BASE = (() => {
  try {
    const stored = localStorage.getItem('mc_media_base');
    if (stored && stored.trim()) return stored.trim().replace(/\/$/, '');
  } catch (_) {}
  if (typeof window !== 'undefined' && window.location && window.location.hostname) {
    return `http://${window.location.hostname}:9000/mucula-media`;
  }
  return 'http://127.0.0.1:9000/mucula-media';
})();

// ---------------------------------------------------------------------------
// Supabase (staging)
// ---------------------------------------------------------------------------
export const SUPABASE_URL = 'https://domkswueipwpyicebotc.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvbWtzd3VlaXB3cHlpY2Vib3RjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk4NTQ1MDIsImV4cCI6MjEwNTQzMDUwMn0.3J-PKmdJAdWduaiIMV5FJbH0kakwugroQpMkUqMUtcQ';

export function isLocalMode() {
  return DATA_MODE === 'local';
}
