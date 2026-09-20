import { CATEGORIES, accentFor } from '../constants/categories.js';
import { getActiveCategory, setActiveCategory, onCategoryChange } from '../state/category.js';

export function mountCategoryBar(container) {
  if (!container) return function () {};

  function paint() {
    var active = getActiveCategory();
    container.innerHTML = '';
    container.className = 'mc-cat-bar';
    var scroller = document.createElement('div');
    scroller.className = 'mc-cat-scroll';
    scroller.setAttribute('role', 'listbox');

    for (var i = 0; i < CATEGORIES.length; i++) {
      var cat = CATEGORIES[i];
      var isActive = cat.key === active;
      var accent = accentFor(cat.key);
      var item = document.createElement('button');
      item.type = 'button';
      item.className = 'mc-cat-item' + (isActive ? ' is-active' : '');
      item.setAttribute('aria-selected', isActive ? 'true' : 'false');
      item.style.setProperty('--mc-cat-accent', accent.primary);

      var media = '';
      if (cat.image) {
        var srcset = '';
        if (cat.image3x) srcset += cat.image3x + ' 3x, ';
        if (cat.image2x) srcset += cat.image2x + ' 2x, ';
        srcset += cat.image + ' 1x';
        media =
          '<img class="mc-cat-img" src="' +
          cat.image +
          '" srcset="' +
          srcset +
          '" sizes="62px" alt="" loading="eager" decoding="async" />';
      } else {
        media = '<span class="mc-cat-emoji">' + cat.emoji + '</span>';
      }

      item.innerHTML =
        '<span class="mc-cat-thumb">' + media + '</span>' +
        '<span class="mc-cat-label">' + cat.label + '</span>';
      (function (key) {
        item.addEventListener('click', function () {
          setActiveCategory(key);
        });
      })(cat.key);
      scroller.appendChild(item);
    }
    container.appendChild(scroller);
    var activeBtn = scroller.querySelector('.is-active');
    if (activeBtn && activeBtn.scrollIntoView) {
      activeBtn.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
    }
  }

  paint();
  return onCategoryChange(paint);
}
