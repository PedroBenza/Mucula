import { subscribe, closeGuestWall, getSession } from '../state/session.js';
import { navigate } from '../core/router.js';

const COPY = {
  anunciar: 'Para anunciar precisas de entrar na tua conta.',
  perfil: 'Entra para ver e editar o teu perfil.',
  actividades: 'Entra para ver as tuas actividades.',
  guardar: 'Entra para guardar este anúncio.',
  chat: 'Entra para falar com o Minguito.',
  criar_listing: 'Entra para criar um anúncio.',
};

export function mountGuestWall() {
  let overlay = document.getElementById('mc-guest-wall');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'mc-guest-wall';
    overlay.className = 'mc-modal-overlay';
    overlay.hidden = true;
    overlay.innerHTML = `
      <div class="mc-modal-sheet" role="dialog">
        <h2 class="mc-h2">Entra na Mucula</h2>
        <p class="mc-muted" id="mc-gw-msg"></p>
        <div style="display:flex;gap:12px;align-items:center;justify-content:flex-end;flex-wrap:wrap;margin-top:20px">
          <button type="button" class="mc-action" data-gw="close">Agora não</button>
          <button type="button" class="mc-action" data-gw="register">Criar conta</button>
          <button type="button" class="mc-btn mc-btn-primary" data-gw="login">Entrar</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', (e) => {
      const t = e.target.closest('[data-gw]');
      if (!t) return;
      const a = t.getAttribute('data-gw');
      if (a === 'close') closeGuestWall();
      if (a === 'login') { closeGuestWall(); navigate('/login'); }
      if (a === 'register') { closeGuestWall(); navigate('/register'); }
    });
  }
  function render(s) {
    if (!s.guestWall) { overlay.hidden = true; return; }
    overlay.querySelector('#mc-gw-msg').textContent =
      COPY[s.guestWall] || 'Entra na tua conta para continuar.';
    overlay.hidden = false;
  }
  subscribe(render);
  render(getSession());
}
