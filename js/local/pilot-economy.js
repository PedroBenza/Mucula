/**
 * Economia piloto (Etapa 3) — só leitura / apresentação.
 * Não processa pagamento. Números = calibração da Constituição/Etapa 4 economia.
 */
import {
  MAX_ACTIVE_LISTINGS,
  MAX_LISTINGS_PER_DAY,
  MAX_ACTIVE_DEMANDS,
  startOfDayTs,
} from './limits.js';
import { FEATURE_PLANS } from './feature-plans.js';
import { localGetListings } from './store.js';
import { listDemands } from './demands.js';
import { countEvents, listEvents } from './telemetry.js';

export { MAX_ACTIVE_LISTINGS, MAX_LISTINGS_PER_DAY, MAX_ACTIVE_DEMANDS, FEATURE_PLANS };

export function countActiveListingsFor(authorId) {
  var aid = authorId ? String(authorId) : null;
  if (!aid) return 0;
  var list = localGetListings() || [];
  var n = 0;
  for (var i = 0; i < list.length; i++) {
    var l = list[i];
    if (l.authorId !== aid) continue;
    var st = l.status;
    if (!st || st === 'disponivel' || st === 'active' || st === 'activo') n++;
  }
  return n;
}

export function countTodayListingsFor(authorId) {
  var aid = authorId ? String(authorId) : null;
  if (!aid) return 0;
  var dayStart = startOfDayTs();
  var list = localGetListings() || [];
  var n = 0;
  for (var i = 0; i < list.length; i++) {
    if (list[i].authorId === aid && (list[i].createdAt || 0) >= dayStart) n++;
  }
  return n;
}

export function countActiveDemandsFor(authorId) {
  var aid = authorId ? String(authorId) : null;
  if (!aid) return 0;
  var list = listDemands(aid) || [];
  var n = 0;
  for (var i = 0; i < list.length; i++) {
    if (list[i].status === 'active' || list[i].status === 'paused') n++;
  }
  return n;
}

/** Snapshot para UI de Fluxo / Publicar — previsível e testável. */
export function getPilotSnapshot(authorId) {
  var aid = authorId ? String(authorId) : null;
  if (!aid) {
    return {
      authorId: null,
      listings: {
        active: 0,
        activeMax: MAX_ACTIVE_LISTINGS,
        activeLeft: MAX_ACTIVE_LISTINGS,
        today: 0,
        todayMax: MAX_LISTINGS_PER_DAY,
        todayLeft: MAX_LISTINGS_PER_DAY,
      },
      demands: {
        active: 0,
        activeMax: MAX_ACTIVE_DEMANDS,
        activeLeft: MAX_ACTIVE_DEMANDS,
      },
    };
  }
  var active = countActiveListingsFor(aid);
  var today = countTodayListingsFor(aid);
  var demands = countActiveDemandsFor(aid);
  return {
    authorId: aid,
    listings: {
      active: active,
      activeMax: MAX_ACTIVE_LISTINGS,
      activeLeft: Math.max(0, MAX_ACTIVE_LISTINGS - active),
      today: today,
      todayMax: MAX_LISTINGS_PER_DAY,
      todayLeft: Math.max(0, MAX_LISTINGS_PER_DAY - today),
    },
    demands: {
      active: demands,
      activeMax: MAX_ACTIVE_DEMANDS,
      activeLeft: Math.max(0, MAX_ACTIVE_DEMANDS - demands),
    },
    featurePlans: FEATURE_PLANS.slice(),
    mission: {
      demandMatchShown: countEvents('demand_match_shown'),
      negotiationMatched: countEvents('negotiation_matched'),
      listingCreate: countEvents('listing_create'),
      demandCreate: countEvents('demand_create'),
      interestOpen: countEvents('interest_open'),
      listingFeatureStart: countEvents('listing_feature_start'),
    },
    recentEvents: listEvents(8),
  };
}

export function formatPilotQuotaLine(snap) {
  if (!snap) return '';
  return (
    'Publicações ' +
    snap.listings.active +
    '/' +
    snap.listings.activeMax +
    ' activos · ' +
    snap.listings.today +
    '/' +
    snap.listings.todayMax +
    ' hoje · Procuras ' +
    snap.demands.active +
    '/' +
    snap.demands.activeMax
  );
}
