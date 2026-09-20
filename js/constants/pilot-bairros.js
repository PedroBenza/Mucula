/**
 * Bairros do piloto — só estes estão abertos.
 * Não são editáveis pelo utilizador.
 */
export var PILOT_BAIRROS = [
  { id: 'muculangola', label: 'Muculangola' },
  { id: 'engevia', label: 'Engevia' },
];

export function isPilotBairro(name) {
  var n = String(name || '').trim().toLowerCase();
  for (var i = 0; i < PILOT_BAIRROS.length; i++) {
    if (PILOT_BAIRROS[i].label.toLowerCase() === n) return true;
  }
  return false;
}
