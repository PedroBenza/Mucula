/** Tetos free — calibração piloto. */
export var MAX_ACTIVE_LISTINGS = 15;
export var MAX_LISTINGS_PER_DAY = 5;
export var MAX_ACTIVE_DEMANDS = 8;

export function startOfDayTs() {
  var d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}
