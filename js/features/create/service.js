/**
 * Oferecer serviço — mesma lógica-chave do produto, em 3 passos.
 * 1 foto+título+descrição  2 preço+banda  3 resumo
 */
import { createListing } from '../../api/listings.js';
import { pickAndReadImage } from '../../local/media.js';
import { navigate } from '../../core/router.js';
import { getSession } from '../../state/session.js';
import { ApiError, NetworkError } from '../../api/client.js';
import { esc, stepDots, stepHeader, photoZoneHtml } from '../../shared/create-ui.js';
import { backButtonHtml } from '../../components/icons.js';
import { calcPlatformFee } from '../../local/platform-fee.js';
import { fmtKz } from '../../core/format.js';
import { PILOT_BAIRROS } from '../../constants/pilot-bairros.js';

var MIN_TITLE = 6;
var MIN_DESC_LETTERS = 10;

var PRICE_UNITS = [
  { key: 'total', label: 'Total' },
  { key: 'hora', label: 'Por hora' },
  { key: 'dia', label: 'Por dia' },
  { key: 'mes', label: 'Por mês' },
];

function letterCount(s) {
  return String(s || '').replace(/\s/g, '').length;
}

function firstName(user) {
  if (!user) return 'Amigo';
  var n = (user.firstName || user.name || user.username || 'Amigo').trim();
  return n.split(/\s+/)[0] || 'Amigo';
}

export function renderCreateService(root) {
  var step = 1;
  var state = {
    imageUrl: '',
    storageKey: '',
    title: '',
    description: '',
    price: '',
    priceUnit: 'hora',
    negotiable: false,
    floorPrice: '',
    neighborhood: '',
  };
  var bandaTimer = null;
  var sess = getSession();
  var userName = firstName(sess.user);

  function clearBandaTimer() {
    if (bandaTimer) {
      clearInterval(bandaTimer);
      bandaTimer = null;
    }
  }

  function unitLabel(key) {
    for (var i = 0; i < PRICE_UNITS.length; i++) {
      if (PRICE_UNITS[i].key === key) return PRICE_UNITS[i].label;
    }
    return key;
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
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay || e.target.closest('[data-ok]')) overlay.remove();
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
      '<p class="mc-muted" style="font-size:13px;margin:8px 0 14px">Só estes bairros estão abertos no piloto.</p>' +
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
      '<div class="mc-fee-box">' +
      '<div class="mc-fee-row"><span>Preço no anúncio</span><strong id="mc-s-fee-price">' +
      esc(fmtKz(Number(priceVal) || 0)) +
      '</strong></div>' +
      '<div class="mc-fee-row"><span>Comissão Mucula (' +
      f.ratePct +
      '%)</span><strong id="mc-s-fee-amt">' +
      esc(fmtKz(f.fee)) +
      '</strong></div>' +
      '<div class="mc-fee-row mc-fee-row--net"><span>Ficas com</span><strong id="mc-s-fee-net">' +
      esc(fmtKz(f.net)) +
      '</strong></div>' +
      '<p class="mc-fee-note">A comissão aplica-se no acordo confirmado.</p>' +
      '</div>'
    );
  }

  function updateFeeUI() {
    var priceEl = root.querySelector('#mc-s-price');
    var p = priceEl ? priceEl.value : state.price;
    var f = calcPlatformFee(p);
    var a = root.querySelector('#mc-s-fee-price');
    var b = root.querySelector('#mc-s-fee-amt');
    var c = root.querySelector('#mc-s-fee-net');
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

  function showErr(msg) {
    var el = root.querySelector('#mc-s-step-err');
    if (el) {
      el.hidden = false;
      el.textContent = msg;
    }
  }

  function paint() {
    clearBandaTimer();
    var html = '';
    html += backButtonHtml('mc-s-back');
    html += stepDots(3, step - 1);

    if (step === 1) {
      html += stepHeader(
        'serviço · passo 1 de 3',
        'O teu serviço',
        'Foto, nome e descrição são obrigatórios'
      );
      html += photoZoneHtml(state.imageUrl, 'mc-s-img');
      html +=
        '<div class="mc-field"><label class="mc-label">Nome do serviço <span class="mc-req">*</span></label>' +
        '<input class="mc-input" id="mc-s-title" placeholder="Ex.: Electricista ao domicílio" maxlength="80" /></div>';
      html +=
        '<div class="mc-field"><label class="mc-label">Descrição <span class="mc-req">*</span></label>' +
        '<textarea class="mc-input" id="mc-s-desc" rows="3" placeholder="O que fazes, zona, horários…"></textarea>' +
        '<p class="mc-muted" style="font-size:11px;margin-top:4px">Mínimo ' +
        MIN_DESC_LETTERS +
        ' letras (espaços não contam).</p></div>';
      html +=
        '<p class="mc-error" id="mc-s-step-err" hidden style="margin-top:12px"></p>';
      html +=
        '<button type="button" class="mc-btn mc-btn-primary mc-btn-block" id="mc-s-next" style="margin-top:20px">Continuar</button>';
    } else if (step === 2) {
      html += stepHeader(
        'serviço · passo 2 de 3',
        'Preço e banda',
        'Como cobras e onde trabalhas'
      );

      html +=
        '<div class="mc-field"><label class="mc-label">Selecciona a tua banda <span class="mc-req">*</span></label>' +
        '<button type="button" class="mc-banda-field" id="mc-s-banda">' +
        (state.neighborhood
          ? '<span class="mc-banda-value">' + esc(state.neighborhood) + '</span>'
          : '<span class="mc-banda-ph" id="mc-s-banda-ph"></span>') +
        '</button></div>';

      html +=
        '<p class="mc-label">Como cobras <span class="mc-req">*</span></p>' +
        '<div class="mc-cond-row" style="margin-bottom:12px">';
      PRICE_UNITS.forEach(function (u) {
        html +=
          '<button type="button" class="mc-cat-opt' +
          (state.priceUnit === u.key ? ' is-on' : '') +
          '" data-unit="' +
          u.key +
          '">' +
          esc(u.label) +
          '</button>';
      });
      html += '</div>';

      html +=
        '<div class="mc-field"><label class="mc-label">Preço (Kz) <span class="mc-req">*</span></label>' +
        '<input class="mc-input mc-input-price" id="mc-s-price" type="number" min="1" step="1" placeholder="0" inputmode="numeric" /></div>';

      html += feeBox(state.price);

      html +=
        '<label class="mc-check" style="margin-top:14px"><input type="checkbox" id="mc-s-neg"' +
        (state.negotiable ? ' checked' : '') +
        '/> Preço negociável</label>';

      html +=
        '<div id="mc-s-floor-wrap"' +
        (state.negotiable ? '' : ' hidden') +
        '>' +
        '<p class="mc-muted" style="margin:12px 0 6px;font-size:12px">Mínimo que aceitas (só o Minguito vê).</p>' +
        '<div class="mc-field"><label class="mc-label">Preço mínimo (Kz)</label>' +
        '<input class="mc-input" id="mc-s-floor" type="number" min="0" step="1" placeholder="0" inputmode="numeric" /></div>' +
        '</div>';

      html +=
        '<p class="mc-error" id="mc-s-step-err" hidden style="margin-top:12px"></p>';
      html +=
        '<button type="button" class="mc-btn mc-btn-primary mc-btn-block" id="mc-s-next" style="margin-top:20px">Ver resumo</button>';
    } else {
      var f = calcPlatformFee(state.price);
      html += stepHeader(
        'serviço · passo 3 de 3',
        'Tudo certo?',
        'Confirma antes de publicar'
      );
      html +=
        '<div class="mc-pub-note">' +
        '<p class="mc-pub-note-title">O que acontece a seguir</p>' +
        '<ul class="mc-pub-note-list">' +
        '<li>O serviço aparece no Feed do teu bairro.</li>' +
        '<li>Quem precisa fala contigo pelo Minguito.</li>' +
        '<li>Acordos confirmam-se em Fluxo.</li>' +
        '<li>A comissão só conta no acordo confirmado.</li>' +
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
        '<div class="mc-muted" style="font-size:13px;margin-top:4px">Serviço · ' +
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
        ' · ' +
        esc(unitLabel(state.priceUnit).toLowerCase()) +
        (state.negotiable ? ' · negociável' : '') +
        '</div>';
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
      html += '<p class="mc-error" id="mc-s-err" hidden></p>';
      html +=
        '<button type="button" class="mc-btn mc-btn-primary mc-btn-block" id="mc-s-pub">Publicar</button>';
    }

    root.innerHTML = html;

    var titleEl = root.querySelector('#mc-s-title');
    var descEl = root.querySelector('#mc-s-desc');
    var priceEl = root.querySelector('#mc-s-price');
    var floorEl = root.querySelector('#mc-s-floor');
    if (titleEl) titleEl.value = state.title;
    if (descEl) descEl.value = state.description;
    if (priceEl) priceEl.value = state.price;
    if (floorEl) floorEl.value = state.floorPrice;

    var ph = root.querySelector('#mc-s-banda-ph');
    if (ph) startBandaAnim(ph);

    var bandaBtn = root.querySelector('#mc-s-banda');
    if (bandaBtn) {
      bandaBtn.onclick = function () {
        openBairroPicker();
      };
    }

    var back = root.querySelector('#mc-s-back');
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

    var imgIn = root.querySelector('#mc-s-img');
    if (imgIn) {
      imgIn.onchange = function () {
        var file = imgIn.files && imgIn.files[0];
        if (!file) return;
        pickAndReadImage(file)
          .then(function (r) {
            if (!r) return;
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

    if (titleEl) {
      titleEl.oninput = function () {
        state.title = titleEl.value;
      };
    }
    if (descEl) {
      descEl.oninput = function () {
        state.description = descEl.value;
      };
    }
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

    root.querySelectorAll('[data-unit]').forEach(function (btn) {
      btn.onclick = function () {
        state.priceUnit = btn.getAttribute('data-unit');
        paint();
      };
    });

    var neg = root.querySelector('#mc-s-neg');
    if (neg) {
      neg.onchange = function () {
        state.negotiable = neg.checked;
        var wrap = root.querySelector('#mc-s-floor-wrap');
        if (wrap) wrap.hidden = !state.negotiable;
        if (!state.negotiable) state.floorPrice = '';
      };
    }

    var next = root.querySelector('#mc-s-next');
    if (next) {
      next.onclick = function () {
        if (step === 1) {
          state.title = titleEl ? titleEl.value.trim() : state.title;
          state.description = descEl ? descEl.value.trim() : state.description;
          if (!state.imageUrl) {
            showErr('A foto do serviço é obrigatória.');
            return;
          }
          if (!state.title || state.title.length < MIN_TITLE) {
            showErr(
              'O nome precisa de pelo menos ' + MIN_TITLE + ' caracteres.'
            );
            return;
          }
          var letters = letterCount(state.description);
          if (letters < MIN_DESC_LETTERS) {
            showDescModal(MIN_DESC_LETTERS - letters);
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
            showErr('Selecciona a tua banda.');
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
              showErr('Indica o preço mínimo que aceitas.');
              return;
            }
            if (fl >= p) {
              showErr('O mínimo tem de ser inferior ao preço.');
              return;
            }
          }
          step = 3;
          paint();
        }
      };
    }

    var pub = root.querySelector('#mc-s-pub');
    if (pub) {
      pub.onclick = async function () {
        var err = root.querySelector('#mc-s-err');
        pub.disabled = true;
        try {
          var res = await createListing({
            type: 'servico',
            title: state.title,
            description: state.description || undefined,
            price: parseFloat(state.price) || 0,
            priceUnit: state.priceUnit,
            negotiable: state.negotiable,
            floorPrice:
              state.negotiable && state.floorPrice
                ? Number(state.floorPrice)
                : undefined,
            category: 'servicos',
            location: { neighborhood: state.neighborhood },
            imageStorageIds: state.storageKey ? [state.storageKey] : undefined,
            _localImageUrl: state.imageUrl || undefined,
            _platformFee: calcPlatformFee(state.price),
          });
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
