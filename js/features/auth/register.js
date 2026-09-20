import { register, persistLocalSessionUser } from '../../api/auth.js';
import { isLocalMode } from '../../config.js';
import { setUser } from '../../state/session.js';
import { navigate } from '../../core/router.js';
import { consumeResumePath } from '../../core/resume.js';
import { ApiError, NetworkError } from '../../api/client.js';

/** Username: minúsculas, números, _ . — mínimo 3 (paridade com copy/RN) */
function isValidUsername(u) {
  return /^[a-z0-9._]{3,}$/.test(u);
}

function isValidContact(email, phone) {
  const e = (email || '').trim();
  const p = (phone || '').trim();
  if (!e && !p) return false;
  if (e && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return false;
  if (p && p.replace(/\s/g, '').length < 6) return false;
  return true;
}

function errorMessage(err) {
  if (!err) return 'Não foi possível registar.';
  if (err.code === 'REGISTER_PARTIAL_SUCCESS' || err.name === 'RegisterPartialSuccessError') {
    return err.message;
  }
  if (err instanceof NetworkError) return err.message;
  if (err instanceof ApiError) return err.message;
  return err.message || 'Não foi possível registar.';
}

export function renderRegister(root) {
  root.innerHTML = `
    <h1 class="mc-h1">Criar conta</h1>
    <p class="mc-muted" style="margin-bottom:16px">Username, nome e contacto (email ou telefone). Senha mín. 8.</p>
    <form id="mc-reg-form">
      <div class="mc-field"><label class="mc-label">Username</label>
        <input class="mc-input" name="username" required minlength="3" autocomplete="username"
          placeholder="só minúsculas, números, _ ." /></div>
      <div class="mc-field"><label class="mc-label">Primeiro nome</label>
        <input class="mc-input" name="firstName" required autocomplete="given-name" /></div>
      <div class="mc-field"><label class="mc-label">Apelido</label>
        <input class="mc-input" name="lastName" required autocomplete="family-name" /></div>
      <div class="mc-field"><label class="mc-label">Email (opcional se tiveres telefone)</label>
        <input class="mc-input" name="email" type="email" autocomplete="email" /></div>
      <div class="mc-field"><label class="mc-label">Telefone (opcional se tiveres email)</label>
        <input class="mc-input" name="phone" autocomplete="tel" /></div>
      <div class="mc-field"><label class="mc-label">Palavra-passe</label>
        <input class="mc-input" name="password" type="password" required minlength="8" autocomplete="new-password" /></div>
      <p class="mc-error" id="mc-reg-err" hidden></p>
      <button class="mc-btn mc-btn-primary mc-btn-block" type="submit">Criar conta</button>
    </form>
    <p class="mc-muted" style="margin-top:16px"><a href="#/login" data-nav="/login">Já tenho conta</a></p>`;

  var linkLogin = root.querySelector('[data-nav]');
  if (linkLogin) {
    linkLogin.addEventListener('click', function (e) {
      e.preventDefault();
      navigate('/login');
    });
  }

  root.querySelector('#mc-reg-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    let username = String(fd.get('username') || '').trim().toLowerCase();
    const input = {
      username,
      firstName: String(fd.get('firstName') || '').trim(),
      lastName: String(fd.get('lastName') || '').trim(),
      password: String(fd.get('password') || ''),
      email: String(fd.get('email') || '').trim() || undefined,
      phone: String(fd.get('phone') || '').trim() || undefined,
    };
    const errEl = root.querySelector('#mc-reg-err');
    errEl.hidden = true;

    if (!isValidUsername(input.username)) {
      errEl.textContent = 'Username: mín. 3 caracteres, só minúsculas, números, _ ou .';
      errEl.hidden = false;
      return;
    }
    if (input.password.length < 8) {
      errEl.textContent = 'A palavra-passe precisa de pelo menos 8 caracteres.';
      errEl.hidden = false;
      return;
    }
    if (!isValidContact(input.email, input.phone)) {
      errEl.textContent = 'Indica um email válido ou um telefone (mín. 6 dígitos).';
      errEl.hidden = false;
      return;
    }

    const btn = e.target.querySelector('[type=submit]');
    btn.disabled = true;
    try {
      const user = await register(input);
      setUser(user);
      if (isLocalMode()) await persistLocalSessionUser(user);
      navigate(consumeResumePath() || '/feed', { replace: true });
    } catch (err) {
      errEl.textContent = errorMessage(err);
      errEl.hidden = false;
      if (err && (err.code === 'REGISTER_PARTIAL_SUCCESS' || err.name === 'RegisterPartialSuccessError')) {
        const go = document.createElement('button');
        go.type = 'button';
        go.className = 'mc-action mc-action--accent';
        go.style.marginTop = '10px';
        go.textContent = 'Ir para Entrar';
        go.onclick = () => navigate('/login');
        if (!root.querySelector('[data-partial-login]')) {
          go.setAttribute('data-partial-login', '1');
          errEl.after(go);
        }
      }
    } finally {
      btn.disabled = false;
    }
  });
}
