/**
 * Leitura local de imagem (data URL).
 * Aceita File, Blob ou <input type="file">.
 * Devolve aliases estáveis para product/service/announcement.
 */
export function pickAndReadImage(input) {
  return new Promise(function (resolve, reject) {
    var file = null;
    if (!input) {
      reject(new Error('Sem ficheiro'));
      return;
    }
    if (typeof File !== 'undefined' && input instanceof File) {
      file = input;
    } else if (typeof Blob !== 'undefined' && input instanceof Blob && !(input instanceof File)) {
      file = input;
    } else if (input.files && input.files.length) {
      file = input.files[0];
    } else if (input.target && input.target.files && input.target.files.length) {
      file = input.target.files[0];
    }
    if (!file) {
      reject(new Error('Sem ficheiro'));
      return;
    }
    if (file.type && file.type.indexOf('image/') !== 0) {
      reject(new Error('Escolhe uma imagem'));
      return;
    }
    var reader = new FileReader();
    reader.onload = function () {
      var url = String(reader.result || '');
      if (!url) {
        reject(new Error('Falha a ler imagem'));
        return;
      }
      var key = 'local-media-' + Date.now();
      resolve({
        key: key,
        storageKey: key,
        publicUrl: url,
        dataUrl: url,
        url: url,
      });
    };
    reader.onerror = function () {
      reject(new Error('Falha a ler imagem'));
    };
    reader.readAsDataURL(file);
  });
}
