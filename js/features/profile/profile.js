import {
  getSession,
  clearUser,
  enterAsGuest,
  setUser,
} from '../../state/session.js';
import { logout } from '../../api/auth.js';
import { navigate } from '../../core/router.js';
import { pageHeaderHtml } from '../../components/page-header.js';
import { COPY } from '../../constants/copy.js';
import { dashboardForAuthor } from '../../local/listing-stats.js';

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function row(label, id, danger) {
  return (
    '<button type="button" class="mc-pf-row' +
    (danger ? ' mc-pf-row--danger' : '') +
    '" id="' +
    id +
    '">' +
    '<span class="mc-pf-row-t">' +
    escapeHtml(label) +
    '</span>' +
    '<svg class="mc-fx-chevron" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18l6-6-6-6"/></svg>' +
    '</button>'
  );
}

function toast(msg) {
  var t = document.createElement('div');
  t.className = 'mc-pf-toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(function () {
    if (t.parentNode) t.remove();
  }, 2200);
}

export async function renderProfile(root) {
  var session = getSession();
  var user = session.user;
  if (!user) {
    root.innerHTML = '<p class="mc-muted">Sem sessão.</p>';
    return;
  }
  var uid = user.id || user._id;
  var name =
    [user.firstName, user.lastName].filter(Boolean).join(' ') ||
    user.username ||
    'Utilizador';
  var avatar = user.avatar || user.photoUrl || '';

  var dash = null;
  try {
    dash = dashboardForAuthor(uid);
  } catch (e) {}
  var T = dash && dash.totals;

  root.innerHTML =
    pageHeaderHtml(COPY.headerProfile || 'Perfil') +
    '<div class="mc-pf">' +
    '<div class="mc-pf-avatar-wrap">' +
    (avatar
      ? '<img class="mc-pf-avatar" src="' + escapeHtml(avatar) + '" alt="" />'
      : '<div class="mc-pf-avatar mc-pf-avatar--empty">' +
        escapeHtml((name || '?').charAt(0).toUpperCase()) +
        '</div>') +
    '<label class="mc-pf-avatar-btn" for="mc-pf-photo">Alterar foto</label>' +
    '<input type="file" id="mc-pf-photo" accept="image/*" hidden />' +
    '</div>' +
    '<h2 class="mc-pf-name">' +
    escapeHtml(name) +
    '</h2>' +
    '<p class="mc-pf-meta">@' +
    escapeHtml(user.username || '') +
    (user.neighborhood ? ' · ' + escapeHtml(user.neighborhood) : '') +
    '</p>' +
    (T
      ? '<div class="mc-profile-stats">' +
        '<div><strong>' +
        T.publications +
        '</strong><span>Publicações</span></div>' +
        '<div><strong>' +
        T.announcements +
        '</strong><span>Anúncios</span></div>' +
        '<div><strong>' +
        T.views +
        '</strong><span>Vistas</span></div></div>'
      : '') +
    '<p class="mc-pf-sec">Conta</p>' +
    row('Editar nome', 'mc-pf-name-btn') +
    row('Alterar palavra-passe', 'mc-pf-pass') +
    row('Os teus dados', 'mc-pf-data') +
    '<p class="mc-pf-sec">App</p>' +
    row('Configurações', 'mc-pf-settings') +
    row('Política de privacidade', 'mc-pf-privacy') +
    row('Termos de uso', 'mc-pf-terms') +
    '<p class="mc-pf-sec">Zona sensível</p>' +
    row('Eliminar conta', 'mc-pf-delete', true) +
    '<button type="button" class="mc-btn mc-btn-primary mc-btn-block" id="mc-go-fluxos" style="margin-top:20px">' +
    (COPY.openFlows || 'Abrir Fluxo') +
    '</button>' +
    '<button type="button" class="mc-btn mc-btn-secondary mc-btn-block" id="mc-logout" style="margin-top:10px">Sair</button>' +
    '</div>';

  var photo = root.querySelector('#mc-pf-photo');
  if (photo) {
    photo.onchange = function () {
      var f = photo.files && photo.files[0];
      if (!f) return;
      var reader = new FileReader();
      reader.onload = function () {
        try {
          var raw = localStorage.getItem('mc_local_users');
          var users = raw ? JSON.parse(raw) : [];
          for (var i = 0; i < users.length; i++) {
            if (
              String(users[i].id) === String(uid) ||
              String(users[i]._id) === String(uid)
            ) {
              users[i].avatar = reader.result;
              localStorage.setItem('mc_local_users', JSON.stringify(users));
              setUser(Object.assign({}, user, { avatar: reader.result }));
              break;
            }
          }
        } catch (e) {}
        toast('Foto actualizada neste aparelho.');
        renderProfile(root);
      };
      reader.readAsDataURL(f);
    };
  }

  function soon() {
    toast('Disponível em breve.');
  }

  root.querySelector('#mc-pf-name-btn').onclick = soon;
  root.querySelector('#mc-pf-pass').onclick = soon;
  root.querySelector('#mc-pf-data').onclick = soon;
  root.querySelector('#mc-pf-settings').onclick = soon;
  root.querySelector('#mc-pf-privacy').onclick = soon;
  root.querySelector('#mc-pf-terms').onclick = soon;
  root.querySelector('#mc-pf-delete').onclick = function () {
    toast('Eliminar conta estará disponível com a conta no servidor.');
  };

  root.querySelector('#mc-go-fluxos').onclick = function () {
    navigate('/activities');
  };
  root.querySelector('#mc-logout').onclick = function () {
    var existing = document.getElementById('mc-logout-modal');
    if (existing) existing.remove();
    var overlay = document.createElement('div');
    overlay.id = 'mc-logout-modal';
    overlay.className = 'mc-modal-overlay';
    overlay.innerHTML =
      '<div class="mc-modal-sheet" role="dialog">' +
      '<h2 class="mc-h2">Sair da conta?</h2>' +
      '<p class="mc-muted">Podes entrar outra vez quando quiseres.</p>' +
      '<div style="display:flex;gap:12px;justify-content:flex-end;margin-top:20px">' +
      '<button type="button" class="mc-action" data-lo="cancel">Agora não</button>' +
      '<button type="button" class="mc-btn mc-btn-primary" data-lo="ok">Sair</button>' +
      '</div></div>';
    document.body.appendChild(overlay);
    overlay.addEventListener('click', function (e) {
      var t = e.target.closest('[data-lo]');
      if (!t && e.target !== overlay) return;
      if (!t || t.getAttribute('data-lo') === 'cancel' || e.target === overlay) {
        overlay.remove();
        return;
      }
      overlay.remove();
      Promise.resolve(logout())
        .catch(function () {})
        .then(function () {
          clearUser();
          enterAsGuest();
          navigate('/feed', { replace: true });
        });
    });
  };
}
