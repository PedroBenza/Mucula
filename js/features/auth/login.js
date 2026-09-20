import { login, persistLocalSessionUser } from '../../api/auth.js';
import { setUser } from '../../state/session.js';
import { navigate } from '../../core/router.js';
import { ApiError, NetworkError } from '../../api/client.js';
import { isLocalMode } from '../../config.js';
import { consumeResumePath } from '../../core/resume.js';

function errorMessage(err) {
  if (err instanceof NetworkError) return err.message;
  if (err instanceof ApiError) return err.message;
  return (err && err.message) || 'Não foi possível entrar.';
}

export function renderLogin(root) {
  root.innerHTML =
    '<h1 class="mc-h1">Entrar</h1>' +
    '<p class="mc-muted" style="margin-bottom:16px">Email, telefone ou username e palavra-passe.' +
    (isLocalMode() ? '<br><strong>Modo local:</strong> demo@mucula.local / demo1234' : '') +
    '</p>' +
    '<form id="mc-login-form">' +
    '<div class="mc-field"><label class="mc-label" for="mc-id">Email, telefone ou username</label>' +
    '<input class="mc-input" id="mc-id" name="identifier" autocomplete="username" required /></div>' +
    '<div class="mc-field"><label class="mc-label" for="mc-pw">Palavra-passe</label>' +
    '<input class="mc-input" id="mc-pw" name="password" type="password" autocomplete="current-password" required /></div>' +
    '<p class="mc-error" id="mc-login-err" hidden></p>' +
    '<button class="mc-btn mc-btn-primary mc-btn-block" type="submit">Entrar</button></form>' +
    '<p class="mc-muted" style="margin-top:16px">Sem conta? <a href="#/register" data-nav="/register">Criar conta</a></p>';

  var linkReg = root.querySelector('[data-nav]');
  if (linkReg) {
    linkReg.addEventListener('click', function (e) {
      e.preventDefault();
      navigate('/register');
    });
  }

  root.querySelector('#mc-login-form').addEventListener('submit', async function (e) {
    e.preventDefault();
    var errEl = root.querySelector('#mc-login-err');
    errEl.hidden = true;
    var identifier = root.querySelector('#mc-id').value.trim();
    var password = root.querySelector('#mc-pw').value;
    var btn = e.target.querySelector('[type=submit]');
    btn.disabled = true;
    try {
      var user = await login({ identifier: identifier, password: password });
      setUser(user);
      if (isLocalMode()) await persistLocalSessionUser(user);
      var resume = consumeResumePath();
      navigate(resume || '/feed', { replace: true });
    } catch (err) {
      errEl.textContent = errorMessage(err);
      errEl.hidden = false;
    } finally {
      btn.disabled = false;
    }
  });
}
