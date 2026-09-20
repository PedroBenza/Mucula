/**
 * Comissão da plataforma sobre o preço do anúncio (piloto).
 * Taxa fixa 5% — transparente no passo de preço.
 */
var RATE = 0.05;
var MIN_FEE = 0;

export function getPlatformFeeRate() {
  return RATE;
}

/**
 * @param {number|string} priceKz
 * @returns {{ rate: number, ratePct: number, fee: number, net: number }}
 */
export function calcPlatformFee(priceKz) {
  var p = Math.max(0, Math.round(Number(priceKz) || 0));
  if (p <= 0) {
    return { rate: RATE, ratePct: Math.round(RATE * 100), fee: 0, net: 0 };
  }
  var fee = Math.round(p * RATE);
  if (MIN_FEE > 0 && fee < MIN_FEE) fee = MIN_FEE;
  if (fee > p) fee = p;
  return {
    rate: RATE,
    ratePct: Math.round(RATE * 100),
    fee: fee,
    net: Math.max(0, p - fee),
  };
}