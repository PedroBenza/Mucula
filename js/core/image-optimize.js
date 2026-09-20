/**
 * Compressão client-side antes de upload / data URL.
 * Reduz peso sem o utilizador notar (max lado, JPEG qualidade controlada).
 */
var DEFAULT_MAX = 1280;
var DEFAULT_QUALITY = 0.72;
var FEED_MAX = 720;
var FEED_QUALITY = 0.68;

/**
 * @param {File|Blob} file
 * @param {{ maxSide?: number, quality?: number, mime?: string }} opts
 * @returns {Promise<Blob>}
 */
export function compressImageBlob(file, opts) {
  opts = opts || {};
  var maxSide = opts.maxSide != null ? opts.maxSide : DEFAULT_MAX;
  var quality = opts.quality != null ? opts.quality : DEFAULT_QUALITY;
  var mime = opts.mime || 'image/jpeg';

  return new Promise(function (resolve, reject) {
    if (!file) {
      reject(new Error('Sem imagem'));
      return;
    }
    /* GIF animado: não reprocessar */
    if (file.type === 'image/gif') {
      resolve(file);
      return;
    }

    var url = URL.createObjectURL(file);
    var img = new Image();
    img.onload = function () {
      try {
        var w = img.naturalWidth || img.width;
        var h = img.naturalHeight || img.height;
        if (!w || !h) {
          URL.revokeObjectURL(url);
          resolve(file);
          return;
        }
        var scale = 1;
        if (w > maxSide || h > maxSide) {
          scale = maxSide / Math.max(w, h);
        }
        var tw = Math.max(1, Math.round(w * scale));
        var th = Math.max(1, Math.round(h * scale));

        var canvas = document.createElement('canvas');
        canvas.width = tw;
        canvas.height = th;
        var ctx = canvas.getContext('2d');
        if (!ctx) {
          URL.revokeObjectURL(url);
          resolve(file);
          return;
        }
        ctx.drawImage(img, 0, 0, tw, th);
        URL.revokeObjectURL(url);

        if (canvas.toBlob) {
          canvas.toBlob(
            function (blob) {
              if (!blob) {
                resolve(file);
                return;
              }
              /* Se comprimido ficou maior (raro), manter original se menor */
              if (file.size && blob.size > file.size * 0.95 && w <= maxSide) {
                resolve(file);
              } else {
                resolve(blob);
              }
            },
            mime,
            quality
          );
        } else {
          var dataUrl = canvas.toDataURL(mime, quality);
          var blob = dataUrlToBlob(dataUrl);
          resolve(blob || file);
        }
      } catch (e) {
        URL.revokeObjectURL(url);
        resolve(file);
      }
    };
    img.onerror = function () {
      URL.revokeObjectURL(url);
      resolve(file);
    };
    img.src = url;
  });
}

function dataUrlToBlob(dataUrl) {
  var s = String(dataUrl || '');
  var m = s.match(/^data:([^;]+);base64,(.+)$/);
  if (!m) return null;
  var bin = atob(m[2]);
  var len = bin.length;
  var arr = new Uint8Array(len);
  for (var i = 0; i < len; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: m[1] });
}

/**
 * Preview leve para UI (data URL pequeno).
 * @returns {Promise<{ blob: Blob, dataUrl: string }>}
 */
export function compressForPreview(file) {
  return compressImageBlob(file, {
    maxSide: FEED_MAX,
    quality: FEED_QUALITY,
    mime: 'image/jpeg',
  }).then(function (blob) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () {
        resolve({ blob: blob, dataUrl: String(reader.result || '') });
      };
      reader.onerror = function () {
        reject(new Error('Falha a ler preview'));
      };
      reader.readAsDataURL(blob);
    });
  });
}

/**
 * Upload-ready: JPEG ≤ 1280px, ~0.72 qualidade.
 * @returns {Promise<File>}
 */
export function compressForUpload(file) {
  return compressImageBlob(file, {
    maxSide: DEFAULT_MAX,
    quality: DEFAULT_QUALITY,
    mime: 'image/jpeg',
  }).then(function (blob) {
    var name = (file && file.name) || 'foto.jpg';
    if (!/\.jpe?g$/i.test(name)) {
      name = name.replace(/\.[^.]+$/, '') + '.jpg';
      if (name === '.jpg') name = 'foto.jpg';
    }
    try {
      return new File([blob], name, { type: 'image/jpeg', lastModified: Date.now() });
    } catch (e) {
      return blob;
    }
  });
}
