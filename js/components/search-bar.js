/**
 * Paridade SearchBar.tsx
 * placeholder: sofa, gas, telemovel…
 */
export function mountSearchBar(container, opts) {
  opts = opts || {};
  var onChange = opts.onChange || function () {};
  var value = opts.value || '';

  container.innerHTML =
    '<div class="mc-search">' +
    '<span class="mc-search-icon" aria-hidden="true">⌕</span>' +
    '<input class="mc-search-input" type="search" enterkeyhint="search" ' +
    'placeholder="' + (opts.placeholder || 'sofá, gás, telemóvel…') + '" ' +
    'value="" />' +
    '</div>';

  var input = container.querySelector('.mc-search-input');
  input.value = value;
  input.addEventListener('input', function () {
    onChange(input.value);
  });

  return {
    setValue: function (v) {
      input.value = v;
    },
    getValue: function () {
      return input.value;
    },
  };
}
