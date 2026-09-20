/**
 * Criar procura — mesmo espírito de vender produto / oferecer serviço.
 */
import { createDemand } from '../../local/demands.js';
import { navigate } from '../../core/router.js';
import { getSession } from '../../state/session.js';
import { resolveUserId } from '../../core/user-id.js';
import { CATEGORIES } from '../../constants/categories.js';
import { backButtonHtml } from '../../components/icons.js';

function catOptions() {
  var html = '';
  for (var i = 0; i < CATEGORIES.length; i++) {
    var c = CATEGORIES[i];
    if (c.key === 'all') continue;
    html += '<option value="' + c.key + '">' + c.label + '</option>';
  }
  return html;
}

export function renderCreateDemand(root) {
  var sess = getSession();
  var nb = (sess.user && sess.user.neighborhood) || '';

  root.innerHTML =
    backButtonHtml('mc-d-back') +
    '<div class="mc-dd">' +
    '<p class="mc-dd-kicker">Publicar</p>' +
    '<h1 class="mc-dd-title">Estou à procura</h1>' +
    '<p class="mc-dd-sec-body">Diz o que precisas. O Mucula cruza com o que há no bairro.</p>' +
    '<div class="mc-field"><label class="mc-label">O que procuras</label>' +
    '<input class="mc-input" id="mc-d-title" placeholder="ex: botija de gás 12kg" maxlength="80" /></div>' +
    '<div class="mc-field"><label class="mc-label">Categoria</label>' +
    '<select class="mc-input" id="mc-d-cat">' +
    catOptions() +
    '</select></div>' +
    '<div class="mc-field"><label class="mc-label">Bairro</label>' +
    '<input class="mc-input" id="mc-d-nb" placeholder="Onde precisas" /></div>' +
    '<div class="mc-field"><label class="mc-label">Orçamento máximo (Kz)</label>' +
    '<input class="mc-input" id="mc-d-budget" type="number" min="0" placeholder="Opcional" /></div>' +
    '<div class="mc-field"><label class="mc-label">Estado preferido</label>' +
    '<select class="mc-input" id="mc-d-cond">' +
    '<option value="qualquer">Qualquer</option>' +
    '<option value="novo">Novo</option>' +
    '<option value="usado">Usado</option></select></div>' +
    '<p class="mc-error" id="mc-d-err" hidden></p>' +
    '<button type="button" class="mc-btn mc-btn-primary mc-btn-block" id="mc-d-go" style="margin-top:12px">Publicar procura</button>' +
    '</div>';

  root.querySelector('#mc-d-nb').value = nb;
  root.querySelector('#mc-d-back').onclick = function () {
    navigate('/create');
  };
  root.querySelector('#mc-d-go').onclick = function () {
    var err = root.querySelector('#mc-d-err');
    err.hidden = true;
    var title = String(root.querySelector('#mc-d-title').value || '').trim();
    if (title.length < 3) {
      err.hidden = false;
      err.textContent = 'Escreve o que procuras (mínimo 3 letras).';
      return;
    }
    try {
      var authorId = resolveUserId();
      if (!authorId) {
        err.hidden = false;
        err.textContent = 'Entra na conta para publicar uma procura.';
        return;
      }
      var d = createDemand(
        {
          title: title,
          category: root.querySelector('#mc-d-cat').value,
          neighborhood: root.querySelector('#mc-d-nb').value,
          budgetMax: root.querySelector('#mc-d-budget').value,
          conditionPref: root.querySelector('#mc-d-cond').value,
        },
        authorId
      );
      navigate('/demand/' + d.id);
    } catch (e) {
      err.hidden = false;
      err.textContent =
        (e && e.message) || 'Não foi possível gravar a procura.';
    }
  };
}
