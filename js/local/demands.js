import { MAX_ACTIVE_DEMANDS } from './limits.js';
import { track } from './telemetry.js';
var KEY = 'mc_local_demands';
var KEY_DEMAND_SEED = 'mc_local_demand_seed_v2';

export function ensureDemandSeed() {
  try {
    if (localStorage.getItem(KEY_DEMAND_SEED)) return;
  } catch (e) {}
  var all = read();
  var byId = {};
  for (var i = 0; i < all.length; i++) byId[all[i].id] = true;
  var seeds = [
    {
      id: 'demand-seed-gas',
      authorId: 'user-other-buyer',
      title: 'Botija de gás 12kg',
      category: 'gas',
      neighborhood: 'Rangel',
      budgetMax: 8000,
      conditionPref: 'qualquer',
      urgency: 'esta semana',
      status: 'active',
      createdAt: Date.now() - 60000,
    },
    {
      id: 'demand-seed-phone',
      authorId: 'user-other-buyer',
      title: 'Telemóvel Android usado',
      category: 'telemoveis',
      neighborhood: 'Maianga',
      budgetMax: 100000,
      conditionPref: 'usado',
      urgency: 'sem pressa',
      status: 'active',
      createdAt: Date.now() - 120000,
    },
    {
      id: 'demand-seed-elec',
      authorId: 'user-other-buyer',
      title: 'Electricista no Rangel',
      category: 'servicos',
      neighborhood: 'Rangel',
      budgetMax: 15000,
      conditionPref: 'qualquer',
      urgency: 'hoje',
      status: 'active',
      createdAt: Date.now() - 180000,
    },
  ];
  var changed = false;
  for (var s = 0; s < seeds.length; s++) {
    if (!byId[seeds[s].id]) {
      all.unshift(seeds[s]);
      changed = true;
    }
  }
  if (changed) write(all);
  try {
    localStorage.setItem(KEY_DEMAND_SEED, '1');
  } catch (e2) {}
}


function read() {
  try {
    var raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return [];
}

function write(list) {
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function listDemands(authorId) {
  var all = read();
  if (!authorId) return all;
  return all.filter(function (d) {
    return d.authorId === authorId;
  });
}

export function getDemand(id) {
  var all = read();
  for (var i = 0; i < all.length; i++) {
    if (all[i].id === id) return all[i];
  }
  return null;
}

export function createDemand(input, authorId) {
  if (!authorId) throw new Error('Precisas de entrar na conta para criar uma procura.');

  var item = {
    id: 'demand-' + Date.now(),
    authorId: authorId ? String(authorId) : null,
    title: String((input && input.title) || '').trim(),
    category: (input && input.category) || '',
    neighborhood: String((input && input.neighborhood) || '').trim(),
    budgetMax: input && input.budgetMax !== '' && input.budgetMax != null ? Number(input.budgetMax) : null,
    conditionPref: (input && input.conditionPref) || 'qualquer',
    urgency: (input && input.urgency) || '',
    status: 'active',
    createdAt: Date.now(),
  };
  if (!item.title) {
    throw new Error('Indica o que procuras.');
  }
  if (!item.category) {
    throw new Error('Escolhe uma categoria.');
  }
  var list = read();
  var activeN = 0;
  for (var ai = 0; ai < list.length; ai++) {
    if (list[ai].authorId === item.authorId && list[ai].status === 'active') activeN++;
  }
  if (activeN >= MAX_ACTIVE_DEMANDS) {
    throw new Error('Limite de ' + MAX_ACTIVE_DEMANDS + ' procuras activas.');
  }
  list.unshift(item);
  write(list);
  track('demand_create', { id: item.id, category: item.category });
  return item;
}

export function updateDemandStatus(id, status) {
  var all = read();
  for (var i = 0; i < all.length; i++) {
    if (all[i].id !== id) continue;
    all[i].status = status;
    all[i].updatedAt = Date.now();
    write(all);
    return all[i];
  }
  return null;
}
