/** Preços Destaque (Kz) — calibração piloto. */
export var FEATURE_PLANS = [
  { id: '24h', label: '24 horas', hours: 24, priceKz: 1500 },
  { id: '3d', label: '3 dias', hours: 72, priceKz: 3500 },
  { id: '7d', label: '7 dias', hours: 168, priceKz: 7000 },
];

export function getPlan(id) {
  for (var i = 0; i < FEATURE_PLANS.length; i++) {
    if (FEATURE_PLANS[i].id === id) return FEATURE_PLANS[i];
  }
  return null;
}
