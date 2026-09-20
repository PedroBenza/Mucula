/**
 * Upload de imagens de listing → Supabase Storage (bucket listing-images).
 * Path: {user_id}/{timestamp}-{safeName}
 * Em modo local não sobe nada.
 */
import { isLocalMode } from '../config.js';
import { getSupabase } from './supabase-client.js';

var BUCKET = 'listing-images';
var MAX_BYTES = 5 * 1024 * 1024;

function safeName(name) {
  var base = String(name || 'foto')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  return base || 'foto';
}

function extFromType(type) {
  if (!type) return 'jpg';
  if (type.indexOf('png') >= 0) return 'png';
  if (type.indexOf('webp') >= 0) return 'webp';
  if (type.indexOf('gif') >= 0) return 'gif';
  return 'jpg';
}

/**
 * @param {File|Blob} file
 * @returns {Promise<string>} URL pública https
 */
export async function uploadListingImage(file) {
  if (isLocalMode()) {
    throw new Error('Upload Storage só em modo api.');
  }
  if (!file) {
    throw new Error('Sem ficheiro de imagem.');
  }
  if (file.size && file.size > MAX_BYTES) {
    throw new Error('A imagem deve ter no máximo 5 MB.');
  }
  var type = file.type || 'image/jpeg';
  if (type.indexOf('image/') !== 0) {
    throw new Error('Escolhe uma imagem (JPEG, PNG ou WebP).');
  }

  const sb = getSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) {
    const e = new Error('Entra na conta para enviar a foto.');
    e.code = 'NEED_AUTH';
    throw e;
  }

  var name =
    (file.name && safeName(file.name)) ||
    'foto.' + extFromType(type);
  if (name.indexOf('.') < 0) {
    name = name + '.' + extFromType(type);
  }
  var path = user.id + '/' + Date.now() + '-' + name;

  const { error } = await sb.storage.from(BUCKET).upload(path, file, {
    contentType: type,
    upsert: false,
    cacheControl: '3600',
  });
  if (error) {
    throw new Error(error.message || 'Falha no upload da imagem.');
  }

  const { data } = sb.storage.from(BUCKET).getPublicUrl(path);
  var url = data && data.publicUrl;
  if (!url) {
    throw new Error('Upload ok, mas não obtive o URL público.');
  }
  return url;
}

/**
 * Converte data URL em Blob (fallback se só houver preview base64).
 */
export function dataUrlToBlob(dataUrl) {
  var s = String(dataUrl || '');
  var m = s.match(/^data:([^;]+);base64,(.+)$/);
  if (!m) return null;
  var mime = m[1];
  var bin = atob(m[2]);
  var len = bin.length;
  var arr = new Uint8Array(len);
  for (var i = 0; i < len; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

/**
 * Garante URL pública para gravar em image_urls (api).
 * Preferência: File original → upload; senão data URL → blob → upload.
 * @returns {Promise<string|null>}
 */
export async function ensurePublicImageUrl(opts) {
  opts = opts || {};
  if (isLocalMode()) {
    return opts.imageUrl || null;
  }
  if (opts.file) {
    return uploadListingImage(opts.file);
  }
  var url = opts.imageUrl || '';
  if (url.indexOf('https://') === 0 || url.indexOf('http://') === 0) {
    return url;
  }
  if (url.indexOf('data:image/') === 0) {
    var blob = dataUrlToBlob(url);
    if (!blob) throw new Error('Imagem inválida.');
    return uploadListingImage(blob);
  }
  return null;
}
