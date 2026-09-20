/** Ícones tab — nomes Ionicons do tabs.ts, SVG minimal */
export function tabIconSvg(name, active) {
  var stroke = active ? 'currentColor' : 'currentColor';
  var fill = active ? 'currentColor' : 'none';
  var common =
    'xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="' +
    fill +
    '" stroke="' +
    stroke +
    '" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"';

  if (name === 'home' || name === 'home-outline') {
    return '<svg ' + common + '><path d="M3 10.5L12 3l9 7.5"/><path d="M5 10v10h14V10" fill="none"/></svg>';
  }
  if (name === 'chatbubble-ellipses' || name === 'chatbubble-ellipses-outline') {
    return (
      '<svg ' +
      common +
      '><path d="M21 12a8 8 0 0 1-8 8H7l-4 3V12a8 8 0 1 1 18 0z" fill="none"/><circle cx="9" cy="12" r="1" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="15" cy="12" r="1" fill="currentColor"/></svg>'
    );
  }
  if (name === 'add') {
    return (
      '<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>'
    );
  }
  if (name === 'flash' || name === 'flash-outline') {
    return (
      '<svg ' +
      common +
      '><path d="M13 2L4 14h7l-1 8 10-14h-7l0-6z" fill="' +
      (active ? 'currentColor' : 'none') +
      '"/></svg>'
    );
  }
  if (name === 'person' || name === 'person-outline') {
    return (
      '<svg ' +
      common +
      '><circle cx="12" cy="8" r="4" fill="none"/><path d="M4 20c1.5-4 4-6 8-6s6.5 2 8 6" fill="none"/></svg>'
    );
  }
  return '';
}
