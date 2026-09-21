/**
 * Voz do Minguito via Edge Function (Groq).
 * Nunca altera domain / preço — só o texto reply.
 * Falha → devolve o reply determinístico intacto.
 */
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config.js';
import { getSupabase } from './supabase-client.js';

/**
 * @param {{ message?: string, deterministicReply: string, context?: object }} opts
 * @returns {Promise<string>} reply final
 */
export async function polishMinguitoReply(opts) {
  opts = opts || {};
  var fallback = String(opts.deterministicReply || '').trim();
  if (!fallback) return fallback;

  try {
    var headers = {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON_KEY,
    };
    try {
      const sb = getSupabase();
      const {
        data: { session },
      } = await sb.auth.getSession();
      if (session && session.access_token) {
        headers.Authorization = 'Bearer ' + session.access_token;
      } else {
        headers.Authorization = 'Bearer ' + SUPABASE_ANON_KEY;
      }
    } catch (eAuth) {
      headers.Authorization = 'Bearer ' + SUPABASE_ANON_KEY;
    }

    var url = SUPABASE_URL.replace(/\/$/, '') + '/functions/v1/minguito-chat';
    var ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var timer =
      ctrl &&
      setTimeout(function () {
        try {
          ctrl.abort();
        } catch (e) {}
      }, 8000);

    var res = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        message: opts.message || '',
        deterministicReply: fallback,
        context: opts.context || {},
      }),
      signal: ctrl ? ctrl.signal : undefined,
    });
    if (timer) clearTimeout(timer);

    if (!res.ok) return fallback;
    var data = await res.json();
    if (data && data.skip) return fallback;
    var polished = data && data.reply ? String(data.reply).trim() : '';
    if (!polished || polished.length < 8) return fallback;
    /* Guard: se a IA inventou um número de preço que não estava no texto original, recusar */
    if (inventedPrice(polished, fallback, opts.context)) return fallback;
    return polished;
  } catch (e) {
    return fallback;
  }
}

function inventedPrice(polished, original, context) {
  var nums = polished.match(/\d[\d\s.]{2,}/g) || [];
  if (!nums.length) return false;
  var allowed = String(original || '');
  if (context) {
    if (context.ask != null) allowed += ' ' + context.ask;
    if (context.offer != null) allowed += ' ' + context.offer;
    if (context.proposedPrice != null) allowed += ' ' + context.proposedPrice;
  }
  for (var i = 0; i < nums.length; i++) {
    var n = nums[i].replace(/\s/g, '').replace(/\./g, '');
    if (n.length < 3) continue;
    if (allowed.indexOf(n) < 0 && allowed.indexOf(nums[i]) < 0) {
      /* número novo longo → suspeito */
      if (Number(n) >= 1000) return true;
    }
  }
  return false;
}
