export function fmtKz(n) {
  const v = Number(n) || 0;
  return v.toLocaleString('pt-AO') + ' Kz';
}
