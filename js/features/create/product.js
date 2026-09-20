/**
 * Vender produto — validação rigorosa + banda piloto + comissão.
 */
import { createListing } from '../../api/listings.js';
import { pickAndReadImage } from '../../local/media.js';
import { ensurePublicImageUrl } from '../../api/storage.js';
import { isLocalMode } from '../../config.js';
import { navigate } from '../../core/router.js';
import { getSession } from '../../state/session.js';
import { CATEGORIES } from '../../constants/categories.js';
import { ApiError, NetworkError } from '../../api/client.js';
import { esc, stepDots, stepHeader, photoZoneHtml } from '../../shared/create-ui.js';
import { backButtonHtml } from '../../components/icons.js';
import { calcPlatformFee } from '../../local/platform-fee.js';
import { fmtKz } from '../../core/format.js';
import { PILOT_BAIRROS } from '../../constants/pilot-bairros.js';

var CATS_WITH_CONDITION = [
  'roupas',
  'calcados',
  'telemoveis',
  'electronicos',
  'electrodomesticos',
  'veiculos',
  'materiais_construcao',
];

var PRODUCT_CATS = CATEGORIES.filter(function (c) {
  return c.key !== 'all' && c.key !== 'servicos';
});

var MIN_TITLE = 6;
var MIN_DESC_LETTERS = 10;

/** Letras sem espaços. */
function letterCount(s) {
  return String(s || '').replace(/\s/g, '').length;
}

function firstName(user) {
  if (!user) return 'Amigo';
  var n = (user.firstName || user.name || user.username || 'Amigo').trim();
  return n.split(/\s+/)[0] || 'Amigo';
}

export function renderCreateProduct(root) {
  var step = 1;
  var state = {
    imageUrl: '',
    storageKey: '',
    title: '',
    description: '',
    price: '',
    floorPrice: '',
    category: '',
    condition: '',
    negotiable: false,
    neighborhood: '',
  };
  var bandaTimer = null;
  var sess = getSession();
  var userName = firstName(sess.user);

  function needsCondition() {
    return CATS_WITH_CONDITION.indexOf(state.category) !== -1;
  }

  function catLabel(key) {
    for (var i = 0; i < PRODUCT_CATS.length; i++) {
      if (PRODUCT_CATS[i].key === key) return PRODUCT_CATS[i].label;
    }
    return key || '';
  }

  function descReady() {
    return letterCount(state.description) >= 3;
  }

  function clearBandaTimer() {
    if (bandaTimer) {
      clearInterval(bandaTimer);
      bandaTimer = null;
    }
  }

  function showDescModal(missing) {
    var existing = document.getElementById('mc-desc-modal');
    if (existing) existing.remove();
    var overlay = document.createElement('div');
    overlay.id = 'mc-desc-modal';
    overlay.className = 'mc-modal-overlay';
    overlay.innerHTML =
      '<div class="mc-modal-sheet" role="dialog">' +
      '<h2 class="mc-h2">' +
      esc(userName) +
      '</h2>' +
      '<p style="margin:12px 0 0;font-size:15px;line-height:1.45">' +
      'A descrição é curta. Acrescenta só mais <strong>' +
      missing +
      '</strong> letra' +
      (missing === 1 ? '' : 's') +
      ' para nos ajudar a entender e explicar ao cliente.' +
      '</p>' +
      '<p class="mc-muted" style="font-size:12px;margin-top:8px">Espaços não contam como letra.</p>' +
      '<button type="button" class="mc-btn mc-btn-primary mc-btn-block" style="margin-top:20px" data-ok>Entendi</button>' +
      '</div>';
    document.body.appendChild(overlay);
    function close() {
      overlay.remove();
    }
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay || e.target.closest('[data-ok]')) close();
    });
  }

  function openBairroPicker() {
    var existing = document.getElementById('mc-bairro-modal');
    if (existing) existing.remove();
    var list = PILOT_BAIRROS.map(function (b) {
      return (
        '<button type="button" class="mc-bairro-opt' +
        (state.neighborhood === b.label ? ' is-on' : '') +
        '" data-bairro="' +
        esc(b.label) +
        '">' +
        esc(b.label) +
        '</button>'
      );
    }).join('');
    var overlay = document.createElement('div');
    overlay.id = 'mc-bairro-modal';
    overlay.className = 'mc-modal-overlay';
    overlay.innerHTML =
      '<div class="mc-modal-sheet" role="dialog">' +
      '<h2 class="mc-h2">Bairros disponíveis são</h2>' +
      '<p class="mc-muted" style="font-size:13px;margin:8px 0 14px">Só estes bairros estão abertos no piloto. Não podes escrever outro.</p>' +
      '<div class="mc-bairro-list">' +
      list +
      '</div>' +
      '<button type="button" class="mc-action" style="margin-top:16px" data-close>Fechar</button>' +
      '</div>';
    document.body.appendChild(overlay);
    overlay.addEventListener('click', function (e) {
      var b = e.target.closest('[data-bairro]');
      if (b) {
        state.neighborhood = b.getAttribute('data-bairro');
        overlay.remove();
        paint();
        return;
      }
      if (e.target === overlay || e.target.closest('[data-close]')) overlay.remove();
    });
  }

  function feeBox(priceVal) {
    var f = calcPlatformFee(priceVal);
    return (
      '<div class="mc-fee-box" id="mc-p-fee">' +
      '<div class="mc-fee-row"><span>Preço no anúncio</span><strong id="mc-p-fee-price">' +
      esc(fmtKz(Number(priceVal) || 0)) +
      '</strong></div>' +
      '<div class="mc-fee-row"><span>Comissão Mucula (' +
      f.ratePct +
      '%)</span><strong id="mc-p-fee-amt">' +
      esc(fmtKz(f.fee)) +
      '</strong></div>' +
      '<div class="mc-fee-row mc-fee-row--net"><span>Ficas com</span><strong id="mc-p-fee-net">' +
      esc(fmtKz(f.net)) +
      '</strong></div>' +
      '<p class="mc-fee-note">A comissão aplica-se quando o acordo é confirmado. O comprador vê só o preço do anúncio.</p>' +
      '</div>'
    );
  }

  function updateFeeUI() {
    var priceEl = root.querySelector('#mc-p-price');
    var p = priceEl ? priceEl.value : state.price;
    var f = calcPlatformFee(p);
    var a = root.querySelector('#mc-p-fee-price');
    var b = root.querySelector('#mc-p-fee-amt');
    var c = root.querySelector('#mc-p-fee-net');
    if (a) a.textContent = fmtKz(Number(p) || 0);
    if (b) b.textContent = fmtKz(f.fee);
    if (c) c.textContent = fmtKz(f.net);
  }

  function startBandaAnim(el) {
    clearBandaTimer();
    if (!el || state.neighborhood) return;
    var i = 0;
    var labels = PILOT_BAIRROS.map(function (b) {
      return b.label;
    });
    el.setAttribute('data-ph', labels[0]);
    el.textContent = labels[0];
    bandaTimer = setInterval(function () {
      i = (i + 1) % labels.length;
      el.classList.add('is-swap');
      setTimeout(function () {
        el.textContent = labels[i];
        el.classList.remove('is-swap');
      }, 180);
    }, 2200);
  }

  function paint() {
    clearBandaTimer();
    var html = '';
    html += backButtonHtml('mc-p-back');
    html += stepDots(3, step - 1);

    if (step === 1) {
      html += stepHeader(
        'produto · passo 1 de 3',
        'Foto e detalhes',
        'Foto, título e descrição são obrigatórios'
      );
      html += photoZoneHtml(state.imageUrl, 'mc-p-img');
      html +=
        '<div class="mc-field"><label class="mc-label">Título <span class="mc-req">*</span></label>' +
        '<input class="mc-input" id="mc-p-title" placeholder="Ex.: Botija de gás 12kg" maxlength="80" /></div>';
      html +=
        '<div class="mc-field"><label class="mc-label">Descrição <span class="mc-req">*</span></label>' +
        '<textarea class="mc-input" id="mc-p-desc" rows="3" placeholder="Estado, entrega, o que inclui…"></textarea>' +
        '<p class="mc-muted" style="font-size:11px;margin-top:4px">Mínimo ' +
        MIN_DESC_LETTERS +
        ' letras (espaços não contam).</p></div>';

      html +=
        '<div id="mc-p-cat-block"' +
        (descReady() ? '' : ' hidden') +
        '>' +
        '<p class="mc-label">Categoria <span class="mc-req">*</span></p>' +
        '<div class="mc-cat-grid" id="mc-p-cats">';
      PRODUCT_CATS.forEach(function (c) {
        html +=
          '<button type="button" class="mc-cat-opt' +
          (state.category === c.key ? ' is-on' : '') +
          '" data-cat="' +
          c.key +
          '">' +
          esc(c.label) +
          '</button>';
      });
      html += '</div></div>';

      html +=
        '<div id="mc-p-cond-block"' +
        (state.category && needsCondition() ? '' : ' hidden') +
        '>' +
        '<p class="mc-label" style="margin-top:14px">Condição <span class="mc-req">*</span></p>' +
        '<div class="mc-cond-row">' +
        '<button type="button" class="mc-cat-opt' +
        (state.condition === 'novo' ? ' is-on' : '') +
        '" data-cond="novo">Novo</button>' +
        '<button type="button" class="mc-cat-opt' +
        (state.condition === 'usado' ? ' is-on' : '') +
        '" data-cond="usado">Usado</button>' +
        '</div></div>';

      html +=
        '<p class="mc-error" id="mc-p-step-err" hidden style="margin-top:12px"></p>';
      html +=
        '<button type="button" class="mc-btn mc-btn-primary mc-btn-block" id="mc-p-next" style="margin-top:20px">Continuar</button>';
    } else if (step === 2) {
      html += stepHeader(
        'produto · passo 2 de 3',
        'Preço e banda',
        'Define o valor e o bairro onde estás'
      );
      if (state.imageUrl) {
        html +=
          '<div class="mc-mini-preview"><img src="' +
          esc(state.imageUrl) +
          '" alt="" /><span>' +
          esc(state.title) +
          '</span></div>';
      }

      html +=
        '<div class="mc-field"><label class="mc-label">Selecciona a tua banda <span class="mc-req">*</span></label>' +
        '<button type="button" class="mc-banda-field" id="mc-p-banda">' +
        (state.neighborhood
          ? '<span class="mc-banda-value">' + esc(state.neighborhood) + '</span>'
          : '<span class="mc-banda-ph" id="mc-banda-ph"></span>') +
        '</button>' +
        '<p class="mc-muted" style="font-size:11px;margin-top:6px">Assim o cliente sabe de onde és. Só bairros do piloto.</p></div>';

      html +=
        '<div class="mc-field"><label class="mc-label">Preço no anúncio (Kz) <span class="mc-req">*</span></label>' +
        '<input class="mc-input mc-input-price" id="mc-p-price" type="number" min="1" step="1" placeholder="0" inputmode="numeric" /></div>';

      html += feeBox(state.price);

      html +=
        '<label class="mc-check" style="margin-top:14px"><input type="checkbox" id="mc-p-neg"' +
        (state.negotiable ? ' checked' : '') +
        '/> Preço negociável</label>';

      html +=
        '<div id="mc-p-floor-wrap"' +
        (state.negotiable ? '' : ' hidden') +
        '>' +
        '<p class="mc-muted" style="margin:12px 0 6px;font-size:12px">' +
        'Preço mínimo que aceitas. Só o Minguito usa isto — nunca no anúncio.' +
        '</p>' +
        '<div class="mc-field"><label class="mc-label">Preço mínimo (Kz)</label>' +
        '<input class="mc-input" id="mc-p-floor" type="number" min="0" step="1" placeholder="0" inputmode="numeric" /></div>' +
        '<p class="mc-error" id="mc-p-floor-err" hidden>O mínimo tem de ser inferior ao preço do anúncio.</p>' +
        '</div>';

      html +=
        '<p class="mc-error" id="mc-p-step-err" hidden style="margin-top:12px"></p>';
      html +=
        '<button type="button" class="mc-btn mc-btn-primary mc-btn-block" id="mc-p-next" style="margin-top:20px">Ver resumo</button>';
    } else {
      var f = calcPlatformFee(state.price);
      html += stepHeader(
        'produto · passo 3 de 3',
        'Tudo certo?',
        'Confirma antes de publicar'
      );
      html +=
        '<div class="mc-pub-note">' +
        '<p class="mc-pub-note-title">O que acontece a seguir</p>' +
        '<ul class="mc-pub-note-list">' +
        '<li>O anúncio fica visível no Feed do teu bairro.</li>' +
        '<li>Quem se interessar trata contigo pelo Minguito.</li>' +
        '<li>Quando houver acordo, confirmas em Fluxo.</li>' +
        '<li>A comissão da Mucula só conta no acordo confirmado.</li>' +
        '</ul></div>';

      html += '<div class="mc-card" style="padding:14px;margin-bottom:12px">';
      if (state.imageUrl) {
        html +=
          '<img src="' +
          esc(state.imageUrl) +
          '" alt="" style="width:100%;max-height:160px;object-fit:cover;border-radius:8px;margin-bottom:10px" />';
      }
      html +=
        '<div style="font-weight:700;font-size:16px">' +
        esc(state.title) +
        '</div>';
      html +=
        '<div class="mc-muted" style="font-size:13px;margin-top:4px">' +
        esc(catLabel(state.category)) +
        (state.condition ? ' · ' + esc(state.condition) : '') +
        ' · ' +
        esc(state.neighborhood) +
        '</div>';
      if (state.description) {
        html +=
          '<p style="font-size:13px;margin:10px 0 0;line-height:1.4">' +
          esc(state.description) +
          '</p>';
      }
      html +=
        '<div style="margin-top:12px;font-weight:700">' +
        esc(fmtKz(Number(state.price) || 0)) +
        (state.negotiable ? ' · negociável' : '') +
        '</div>';
      if (state.negotiable && state.floorPrice) {
        html +=
          '<div class="mc-muted" style="font-size:12px">Mínimo (só Minguito): ' +
          esc(fmtKz(Number(state.floorPrice) || 0)) +
          '</div>';
      }
      html +=
        '<div class="mc-fee-box" style="margin-top:12px">' +
        '<div class="mc-fee-row"><span>Comissão (' +
        f.ratePct +
        '%)</span><strong>' +
        esc(fmtKz(f.fee)) +
        '</strong></div>' +
        '<div class="mc-fee-row mc-fee-row--net"><span>Estimativa a receber</span><strong>' +
        esc(fmtKz(f.net)) +
        '</strong></div></div>';
      html += '</div>';
      html += '<p class="mc-error" id="mc-p-err" hidden></p>';
      html +=
        '<button type="button" class="mc-btn mc-btn-primary mc-btn-block" id="mc-p-pub">Publicar</button>';
    }

    root.innerHTML = html;

    var titleEl = root.querySelector('#mc-p-title');
    var descEl = root.querySelector('#mc-p-desc');
    var priceEl = root.querySelector('#mc-p-price');
    var floorEl = root.querySelector('#mc-p-floor');
    if (titleEl) titleEl.value = state.title;
    if (descEl) descEl.value = state.description;
    if (priceEl) priceEl.value = state.price;
    if (floorEl) floorEl.value = state.floorPrice;

    var ph = root.querySelector('#mc-banda-ph');
    if (ph) startBandaAnim(ph);

    var bandaBtn = root.querySelector('#mc-p-banda');
    if (bandaBtn) {
      bandaBtn.onclick = function () {
        openBairroPicker();
      };
    }

    var back = root.querySelector('#mc-p-back');
    if (back) {
      back.onclick = function () {
        clearBandaTimer();
        if (step > 1) {
          step -= 1;
          paint();
        } else {
          navigate('/create');
        }
      };
    }

    var imgIn = root.querySelector('#mc-p-img');
    if (imgIn) {
      imgIn.onchange = function () {
        var file = imgIn.files && imgIn.files[0];
        if (!file) return;
        pickAndReadImage(file)
          .then(function (r) {
            if (!r) return;
            state.imageFile = file;
            state.imageUrl = r.dataUrl || r.url || r.publicUrl || '';
            state.storageKey = r.storageKey || r.key || '';
            paint();
          })
          .catch(function (err) {
            var el = root.querySelector('#mc-s-step-err') || root.querySelector('#mc-p-step-err');
            if (el) {
              el.hidden = false;
              el.textContent = (err && err.message) || 'Não foi possível carregar a foto.';
            }
          });
      };
    }

    if (descEl) {
      descEl.oninput = function () {
        state.description = descEl.value;
        var catBlock = root.querySelector('#mc-p-cat-block');
        if (catBlock) catBlock.hidden = !descReady();
        if (!descReady()) {
          state.category = '';
          state.condition = '';
          var condBlock = root.querySelector('#mc-p-cond-block');
          if (condBlock) condBlock.hidden = true;
        }
      };
    }
    if (titleEl) {
      titleEl.oninput = function () {
        state.title = titleEl.value;
      };
    }

    root.querySelectorAll('[data-cat]').forEach(function (btn) {
      btn.onclick = function () {
        state.category = btn.getAttribute('data-cat');
        if (!needsCondition()) state.condition = '';
        paint();
      };
    });
    root.querySelectorAll('[data-cond]').forEach(function (btn) {
      btn.onclick = function () {
        state.condition = btn.getAttribute('data-cond');
        paint();
      };
    });

    if (priceEl) {
      priceEl.oninput = function () {
        state.price = priceEl.value;
        updateFeeUI();
      };
    }
    if (floorEl) {
      floorEl.oninput = function () {
        state.floorPrice = floorEl.value;
      };
    }

    var neg = root.querySelector('#mc-p-neg');
    if (neg) {
      neg.onchange = function () {
        state.negotiable = neg.checked;
        var wrap = root.querySelector('#mc-p-floor-wrap');
        if (wrap) wrap.hidden = !state.negotiable;
        if (!state.negotiable) state.floorPrice = '';
      };
    }

    function showErr(msg) {
      var el = root.querySelector('#mc-p-step-err');
      if (el) {
        el.hidden = false;
        el.textContent = msg;
      }
    }

    var next = root.querySelector('#mc-p-next');
    if (next) {
      next.onclick = function () {
        if (step === 1) {
          state.title = titleEl ? titleEl.value.trim() : state.title;
          state.description = descEl ? descEl.value.trim() : state.description;
          if (!state.imageUrl) {
            showErr('A foto do produto é obrigatória.');
            return;
          }
          if (!state.title || state.title.length < MIN_TITLE) {
            showErr(
              'O título precisa de pelo menos ' + MIN_TITLE + ' caracteres.'
            );
            return;
          }
          var letters = letterCount(state.description);
          if (letters < MIN_DESC_LETTERS) {
            var missing = MIN_DESC_LETTERS - letters;
            showDescModal(missing);
            return;
          }
          if (!state.category) {
            showErr('Escolhe a categoria.');
            return;
          }
          if (needsCondition() && !state.condition) {
            showErr('Indica se é novo ou usado.');
            return;
          }
          step = 2;
          paint();
          return;
        }
        if (step === 2) {
          state.price = priceEl ? priceEl.value : state.price;
          state.negotiable = !!(neg && neg.checked);
          state.floorPrice = floorEl ? floorEl.value : state.floorPrice;
          if (!state.neighborhood) {
            showErr('Selecciona a tua banda (bairro do piloto).');
            return;
          }
          var p = Number(state.price);
          if (!state.price || !p || p <= 0) {
            showErr('Indica um preço válido.');
            return;
          }
          if (state.negotiable) {
            var fl = Number(state.floorPrice);
            if (!state.floorPrice || !fl || fl <= 0) {
              showErr('Com preço negociável, indica o mínimo que aceitas.');
              return;
            }
            if (fl >= p) {
              var fe = root.querySelector('#mc-p-floor-err');
              if (fe) fe.hidden = false;
              showErr('O mínimo tem de ser inferior ao preço do anúncio.');
              return;
            }
          }
          step = 3;
          paint();
        }
      };
    }

    var pub = root.querySelector('#mc-p-pub');
    if (pub) {
      pub.onclick = async function () {
        var err = root.querySelector('#mc-p-err');
        pub.disabled = true;
        try {
          var payload = {
            type: 'produto',
            title: state.title,
            description: state.description || undefined,
            price: Number(state.price) || 0,
            priceUnit: 'total',
            category: state.category,
            condition: needsCondition() ? state.condition : undefined,
            negotiable: state.negotiable,
            floorPrice:
              state.negotiable && state.floorPrice
                ? Number(state.floorPrice)
                : undefined,
            location: { neighborhood: state.neighborhood },
            imageStorageIds: state.storageKey ? [state.storageKey] : undefined,
            _localImageUrl: undefined,
            imageUrl: undefined,
            imageUrls: undefined,
            _platformFee: calcPlatformFee(state.price),
          };
          var publicImg = null;
          if (isLocalMode()) {
            publicImg = state.imageUrl || null;
          } else {
            publicImg = await ensurePublicImageUrl({
              file: state.imageFile || null,
              imageUrl: state.imageUrl || null,
            });
          }
          if (publicImg) {
            payload.imageUrl = publicImg;
            payload.imageUrls = [publicImg];
            payload._localImageUrl = publicImg;
          }
          var res = await createListing(payload);
          clearBandaTimer();
          navigate('/listing/' + res.id, { replace: true });
        } catch (e) {
          if (err) {
            err.hidden = false;
            err.textContent =
              e instanceof NetworkError || e instanceof ApiError
                ? e.message
                : (e && e.message) || 'Não foi possível publicar.';
          }
        } finally {
          pub.disabled = false;
        }
      };
    }
  }

  paint();
}
