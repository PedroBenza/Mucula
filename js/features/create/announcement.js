import { backButtonHtml } from '../../components/icons.js';
import { addAnnouncement } from '../../local/announcements.js';
import { navigate } from '../../core/router.js';

/** Local only — RN AnnouncementFlow desligado do backend */
export function renderCreateAnnouncement(root) {
  root.innerHTML =
    backButtonHtml('mc-a-back') +
    '<h1 class="mc-h1">Aviso</h1>' +
    '<p class="mc-muted">Guarda em local e aparece no feed (promo). No original o fluxo Convex está desligado.</p>' +
    '<div class="mc-field"><label class="mc-label">Título</label><input class="mc-input" id="mc-a-title" /></div>' +
    '<div class="mc-field"><label class="mc-label">Texto</label><textarea class="mc-input" id="mc-a-body" rows="3"></textarea></div>' +
    '<button type="button" class="mc-btn mc-btn-primary mc-btn-block" id="mc-a-save">Publicar aviso</button>';

  root.querySelector('#mc-a-back').onclick = function () { navigate('/create'); };
  root.querySelector('#mc-a-save').onclick = function () {
    addAnnouncement({
      title: root.querySelector('#mc-a-title').value,
      body: root.querySelector('#mc-a-body').value,
    });
    navigate('/feed', { replace: true });
  };
}
