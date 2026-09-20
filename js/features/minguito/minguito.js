import { talkToMinguito } from '../../api/minguito.js';
import { fetchListingById } from '../../api/listings.js';
import { requireAuth } from '../../core/require-auth.js';
import { isAuthenticated } from '../../state/session.js';
import { navigate } from '../../core/router.js';
import { getDemand } from '../../local/demands.js';
import { pageHeaderHtml } from '../../components/page-header.js';
import { COPY } from '../../constants/copy.js';
import { getSession } from '../../state/session.js';
import { resolveUserId } from '../../core/user-id.js';
import {
  loadSessionMessages,
  saveSessionMessages,
} from '../../local/minguito-sessions.js';
import { sweepExpiredNegotiations } from '../../local/negotiations.js';

var AVATAR = './assets/images/minguito.png';

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function idsFromHash() {
  try {
    var q = location.hash.split('?')[1] || '';
    var sp = new URLSearchParams(q);
    return {
      listingId: sp.get('listingId') || undefined,
      demandId: sp.get('demandId') || undefined,
    };
  } catch (e) {
    return {};
  }
}

function sendIcon() {
  return (
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 2L11 13"/><path d="M22 2L15 22l-4-9-9-4 20-7z"/></svg>'
  );
}

export function renderMinguito(root) {
  if (!isAuthenticated()) {
    var ok = requireAuth({
      context: 'chat',
      action: function () {
        renderMinguito(root);
      },
    });
    if (!ok) {
      root.innerHTML =
        pageHeaderHtml(COPY.headerMinguito) +
        '<p class="mc-muted" style="margin-top:12px">Entra na conta para falar com o Minguito.</p>';
      return;
    }
  }

  var fromHash = idsFromHash();
  var listingId = fromHash.listingId;
  var demandId = fromHash.demandId;
  var userId = resolveUserId();
  if (!userId) {
    root.innerHTML =
      pageHeaderHtml(COPY.headerMinguito) +
      '<p class="mc-muted" style="margin-top:12px">Entra na conta para falar com o Minguito.</p>';
    return;
  }
  var sessionCtx = { listingId: listingId, demandId: demandId, userId: userId };
  try {
    sweepExpiredNegotiations();
  } catch (e0) {}
  var msgs = loadSessionMessages(sessionCtx);
  var loading = false;
  var pinned = null;
  var pinnedDemand = demandId ? getDemand(demandId) : null;

  root.innerHTML =
    pageHeaderHtml(COPY.headerMinguito) +
    '<div class="mc-ming-shell">' +
    '<div class="mc-ming-hero">' +
    '<img class="mc-ming-avatar" src="' +
    AVATAR +
    '" alt="Minguito" width="72" height="72" />' +
    '<p class="mc-ming-hero-title">' +
    escapeHtml(COPY.minguito) +
    '</p>' +
    '<p class="mc-ming-hero-sub">' +
    escapeHtml(COPY.minguitoWelcome) +
    '</p>' +
    '</div>' +
    '<div id="mc-pin" class="mc-ming-pin" hidden></div>' +
    '<div id="mc-msgs" class="mc-ming-thread" role="log" aria-live="polite"></div>' +
    '<div class="mc-ming-composer">' +
    '<form id="mc-m-form" class="mc-ming-composer-box">' +
    '<textarea class="mc-ming-input" id="mc-m-in" rows="1" placeholder="' +
    escapeHtml(COPY.minguitoPlaceholder || 'Escreve a tua mensagem…') +
    '" autocomplete="off"></textarea>' +
    '<button class="mc-ming-send" type="submit" aria-label="Enviar">' +
    sendIcon() +
    '</button>' +
    '</form></div></div>';

  var msgsEl = root.querySelector('#mc-msgs');
  var pinEl = root.querySelector('#mc-pin');
  var form = root.querySelector('#mc-m-form');
  var input = root.querySelector('#mc-m-in');
  var sendBtn = root.querySelector('.mc-ming-send');

  function scrollBottom() {
    msgsEl.scrollTop = msgsEl.scrollHeight;
  }

  function paint() {
    var html = '';
    if (!msgs.length && !loading) {
      html =
        '<div class="mc-ming-row mc-ming-row--bot">' +
        '<img class="mc-ming-row-avatar" src="' +
        AVATAR +
        '" alt="" />' +
        '<div class="mc-ming-bubble mc-ming-bubble--bot">' +
        escapeHtml(COPY.minguitoWelcomeSub || COPY.minguitoWelcome) +
        '</div></div>';
    }
    for (var i = 0; i < msgs.length; i++) {
      var m = msgs[i];
      var isUser = m.role === 'user';
      var extra = '';
      if (m.items && m.items.length) {
        extra =
          '<div class="mc-ming-items">' +
          m.items
            .map(function (it) {
              return (
                '<button type="button" class="mc-ming-item" data-open-listing="' +
                escapeHtml(it.listingId) +
                '">' +
                escapeHtml(it.title || '') +
                (it.price != null ? ' · ' + escapeHtml(String(it.price)) + ' Kz' : '') +
                '</button>'
              );
            })
            .join('') +
          '</div>';
      }
      if (isUser) {
        html +=
          '<div class="mc-ming-row mc-ming-row--user">' +
          '<div class="mc-ming-bubble mc-ming-bubble--user">' +
          escapeHtml(m.text) +
          '</div></div>';
      } else {
        html +=
          '<div class="mc-ming-row mc-ming-row--bot">' +
          '<img class="mc-ming-row-avatar" src="' +
          AVATAR +
          '" alt="" />' +
          '<div class="mc-ming-bubble mc-ming-bubble--bot">' +
          escapeHtml(m.text) +
          extra +
          '</div></div>';
      }
    }
    if (loading) {
      html +=
        '<div class="mc-ming-row mc-ming-row--bot">' +
        '<img class="mc-ming-row-avatar" src="' +
        AVATAR +
        '" alt="" />' +
        '<div class="mc-ming-typing">' +
        escapeHtml(COPY.minguitoTyping || 'Minguito a responder…') +
        '</div></div>';
    }
    msgsEl.innerHTML = html;
    msgsEl.querySelectorAll('[data-open-listing]').forEach(function (btn) {
      btn.onclick = function () {
        navigate('/listing/' + btn.getAttribute('data-open-listing'));
      };
    });
    scrollBottom();
  }

  function setPin() {
    if (pinnedDemand) {
      pinEl.hidden = false;
      pinEl.textContent =
        (COPY.minguitoPinDemand || 'A acompanhar a tua procura') +
        ': «' +
        pinnedDemand.title +
        '»' +
        (pinnedDemand.neighborhood ? ' · ' + pinnedDemand.neighborhood : '');
      return;
    }
    if (pinned) {
      pinEl.hidden = false;
      pinEl.textContent =
        (COPY.minguitoPinListing || 'A falar sobre este anúncio') +
        ': «' +
        (pinned.title || '') +
        '»' +
        (pinned.price != null ? ' · ' + pinned.price + ' Kz' : '');
      return;
    }
    pinEl.hidden = true;
    pinEl.textContent = '';
  }

  setPin();
  paint();

  if (listingId) {
    fetchListingById(listingId)
      .then(function (item) {
        pinned = item;
        setPin();
      })
      .catch(function () {
        pinEl.hidden = false;
        pinEl.textContent = 'Não consegui carregar o anúncio do contexto.';
      });
  }

  if (demandId && pinnedDemand) {
    loading = true;
    paint();
    talkToMinguito({ demandId: demandId, message: 'mostra opções' })
      .then(function (res) {
        msgs.push({
          role: 'assistant',
          text: res.reply || '',
          items: (res.domain && res.domain.items) || [],
        });
        saveSessionMessages(sessionCtx, msgs);
        paint();
      })
      .catch(function () {
        msgs.push({
          role: 'assistant',
          text: 'Não consegui cruzar a procura agora.',
        });
        paint();
      })
      .finally(function () {
        loading = false;
        paint();
        sendBtn.disabled = false;
      });
  }

  input.addEventListener('input', function () {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 120) + 'px';
  });

  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      form.requestSubmit();
    }
  });

  form.onsubmit = function (e) {
    e.preventDefault();
    var text = input.value.trim();
    if (!text || loading) return;
    input.value = '';
    input.style.height = 'auto';
    msgs.push({ role: 'user', text: text });
    saveSessionMessages(sessionCtx, msgs);
    loading = true;
    sendBtn.disabled = true;
    paint();
    talkToMinguito({ listingId: listingId, demandId: demandId, message: text })
      .then(function (res) {
        msgs.push({
          role: 'assistant',
          text: res.reply || '',
          items: (res.domain && res.domain.items) || [],
        });
        saveSessionMessages(sessionCtx, msgs);
        paint();
      })
      .catch(function (err) {
        msgs.push({
          role: 'assistant',
          text: (err && err.message) || 'Falha ao responder.',
        });
        saveSessionMessages(sessionCtx, msgs);
        paint();
      })
      .finally(function () {
        loading = false;
        sendBtn.disabled = false;
        paint();
        input.focus();
      });
  };
}
