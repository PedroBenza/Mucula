import { LOCAL_LISTINGS, LOCAL_USER } from './fixtures.js';
import { MAX_ACTIVE_LISTINGS, MAX_LISTINGS_PER_DAY, startOfDayTs } from './limits.js';
import { track } from './telemetry.js';
import { getPlan } from './feature-plans.js';
import { sameUserId } from '../core/user-id.js';

const KEY_LISTINGS = 'mc_local_listings';
const KEY_USERS = 'mc_local_users';
const KEY_SEED_VER = 'mc_local_seed_version';
const SEED_VERSION = 9; /* Etapa3 blindagem: quota seed + Rangel demo */

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return fallback;
}

function write(key, val) {
  localStorage.setItem(key, JSON.stringify(val));
}


/** Reescreve fragmentos de paths poluídos (pré-Etapa 1) para nomes limpos. */
function sanitizeListingImages(item) {
  if (!item) return item;
  var map = {
    'ChatGPT Image 21_05_2026, 11_19_02.png': 'servicos.png',
    'Discover how mobile phones transformed from basic#U2026.jpeg': 'telemoveis-alt.jpeg',
    '_.jpeg': 'electrodomesticos.jpeg',
    'biles.jpeg': 'veiculo-alt.jpeg',
    'i101.jpeg': 'telemoveis-1.jpeg',
    'i102.jpeg': 'telemoveis-2.jpeg',
    'i103.jpeg': 'telemoveis-3.jpeg',
    'tomate2.png': 'alimentacao-alt.png',
    'moda-sapatos-e-tenis.jpg': 'calcados.jpg',
    'roupas.jpg': 'roupas-alt.jpg',
  };
  function fix(url) {
    if (!url || typeof url !== 'string') return url;
    for (var k in map) {
      if (url.indexOf(k) !== -1) {
        return url.split(k).join(map[k]);
      }
    }
    return url;
  }
  if (item.imageUrl) item.imageUrl = fix(item.imageUrl);
  if (item.imageUrls && item.imageUrls.length) {
    item.imageUrls = item.imageUrls.map(fix);
  }
  return item;
}

export function ensureLocalSeed() {
  var ver = 0;
  try {
    ver = Number(localStorage.getItem(KEY_SEED_VER) || 0) || 0;
  } catch (e) {}
  if (!read(KEY_LISTINGS, null)) {
    write(KEY_LISTINGS, LOCAL_LISTINGS);
  } else if (ver < SEED_VERSION) {
    var list = read(KEY_LISTINGS, []);
    var byId = {};
    for (var i = 0; i < LOCAL_LISTINGS.length; i++) {
      byId[LOCAL_LISTINGS[i]._id] = LOCAL_LISTINGS[i];
    }
    for (var j = 0; j < list.length; j++) {
      var patch = byId[list[j]._id];
      if (patch) {
        list[j].authorId = patch.authorId;
        list[j].isFeatured = patch.isFeatured;
        if (patch.featuredUntil) list[j].featuredUntil = patch.featuredUntil;
        /* Blindagem Etapa 1: URLs de imagem limpas (nomes antigos partiam) */
        if (patch.imageUrl) list[j].imageUrl = patch.imageUrl;
        if (patch.imageUrls) list[j].imageUrls = patch.imageUrls.slice();
        if (patch.category) list[j].category = patch.category;
        /* seed listings: alinhar createdAt para não consumir teto diário */
        if (patch.createdAt) list[j].createdAt = patch.createdAt;
      }
      /* Sanitizar paths poluídos residuais em anúncios do utilizador */
      list[j] = sanitizeListingImages(list[j]);
    }
    /* Etapa 3: inserir fixtures piloto em falta (não apaga anúncios do user) */
    var have = {};
    for (var h = 0; h < list.length; h++) have[list[h]._id] = true;
    for (var n = 0; n < LOCAL_LISTINGS.length; n++) {
      if (!have[LOCAL_LISTINGS[n]._id]) {
        list.push(LOCAL_LISTINGS[n]);
      }
    }
    write(KEY_LISTINGS, list);
  }
  try {
    localStorage.setItem(KEY_SEED_VER, String(SEED_VERSION));
  } catch (e2) {}
  if (!read(KEY_USERS, null)) {
    write(KEY_USERS, [{ ...LOCAL_USER, password: 'demo1234', email: 'demo@mucula.local', phone: '900000000' }]);
  } else if (ver < SEED_VERSION) {
    /* patch demo neighborhood (Etapa 3 piloto Rangel) */
    try {
      var users = read(KEY_USERS, []);
      for (var ui = 0; ui < users.length; ui++) {
        if (users[ui].email === 'demo@mucula.local' || users[ui].id === 'local-user-1') {
          users[ui].neighborhood = LOCAL_USER.neighborhood || 'Rangel';
        }
      }
      write(KEY_USERS, users);
    } catch (e3) {}
  }
}

export function localGetListings() {
  ensureLocalSeed();
  return read(KEY_LISTINGS, LOCAL_LISTINGS);
}

export function localGetListing(id) {
  return localGetListings().find((l) => l._id === id) || null;
}


/** Altera status do listing (ex.: reservado após acordo). Sem passo de entrega física. */
export function localSetListingStatus(listingId, status) {
  const list = localGetListings();
  const i = list.findIndex((l) => l._id === listingId || l.id === listingId);
  if (i < 0) throw new Error('Publicação não encontrada.');
  list[i] = { ...list[i], status: status, updatedAt: Date.now() };
  write(KEY_LISTINGS, list);
  return list[i];
}

export function localCreateListing(input, authorId) {
  const list = localGetListings();
  const aid = authorId ? String(authorId) : null;
  if (!aid) throw new Error('Precisas de entrar na conta para publicar.');
  const active = list.filter((l) => l.authorId === aid && (!l.status || l.status === 'disponivel' || l.status === 'active'));
  if (active.length >= MAX_ACTIVE_LISTINGS) {
    const e = new Error('Atingiste o limite de ' + MAX_ACTIVE_LISTINGS + ' anúncios activos. Arquiva um ou usa Destaque noutro anúncio.');
    e.code = 'LIMIT_ACTIVE';
    throw e;
  }
  const dayStart = startOfDayTs();
  const today = list.filter((l) => l.authorId === aid && (l.createdAt || 0) >= dayStart);
  if (today.length >= MAX_LISTINGS_PER_DAY) {
    const e = new Error('Limite de ' + MAX_LISTINGS_PER_DAY + ' anúncios novos por dia. Tenta amanhã.');
    e.code = 'LIMIT_DAY';
    throw e;
  }
  const item = {
    _id: 'local-' + Date.now(),
    title: input.title || 'Produto',
    description: input.description,
    price: Number(input.price) || 0,
    priceUnit: input.priceUnit || 'total',
    type: input.type || 'produto',
    category: input.category || 'outros',
    condition: input.condition || null,
    location: input.location || { neighborhood: '' },
    imageUrl: input._localImageUrl || null,
    imageUrls: input._localImageUrl ? [input._localImageUrl] : [],
    authorId: aid,
    author: null,
    createdAt: Date.now(),
    isFeatured: false,
    status: 'disponivel',
    negotiable: !!input.negotiable,
    floorPrice: input.floorPrice != null && input.floorPrice !== '' ? Number(input.floorPrice) : undefined,
    tags: input.tags,
    availableDays: input.availableDays,
    estimatedDuration: input.estimatedDuration,
    coversAllLuanda: !!input.coversAllLuanda,
    imageStorageIds: input.imageStorageIds,
  };
  list.unshift(item);
  write(KEY_LISTINGS, list);
  track('listing_create', { id: item._id, authorId: aid, category: item.category });
  return { id: item._id, title: item.title, type: item.type, category: item.category, status: item.status, createdAt: item.createdAt };
}

/** Activa Destaque (registo local; pagamento real no gateway futuro). */
export function localActivateFeature(listingId, planId, actorId) {
  const plan = getPlan(planId);
  if (!plan) throw new Error('Plano de destaque inválido.');
  const list = localGetListings();
  let found = null;
  for (let i = 0; i < list.length; i++) {
    if (list[i]._id !== listingId) continue;
    if (actorId && list[i].authorId && !sameUserId(list[i].authorId, actorId)) {
      throw new Error('Só o dono da publicação pode activar destaque.');
    }
    list[i].isFeatured = true;
    list[i].featuredUntil = Date.now() + plan.hours * 3600 * 1000;
    list[i].featuredPlan = plan.id;
    list[i].featuredPriceKz = plan.priceKz;
    found = list[i];
    break;
  }
  if (!found) throw new Error('Publicação não encontrada.');
  write(KEY_LISTINGS, list);
  track('listing_feature_start', {
    id: listingId,
    plan: plan.id,
    priceKz: plan.priceKz,
    until: found.featuredUntil,
  });
  return found;
}


export function localMyListings(authorId) {
  return localGetListings()
    .filter((l) => l.authorId === authorId)
    .map((l) => ({
      id: l._id,
      title: l.title,
      price: l.price,
      status: l.status || 'disponivel',
      category: l.category,
      createdAt: l.createdAt,
    }));
}

export function localRegister(input) {
  ensureLocalSeed();
  const users = read(KEY_USERS, []);
  if (users.some((u) => u.username === input.username)) {
    const e = new Error('Já existe uma conta com este username.');
    e.code = 'USER_EXISTS';
    throw e;
  }
  const user = {
    id: 'local-user-' + Date.now(),
    username: input.username,
    firstName: input.firstName,
    lastName: input.lastName,
    email: input.email,
    phone: input.phone,
    password: input.password,
    neighborhood: undefined,
    verified: false,
    createdAt: Date.now(),
  };
  users.push(user);
  write(KEY_USERS, users);
  return publicUser(user);
}

export function localLogin({ identifier, password }) {
  ensureLocalSeed();
  const users = read(KEY_USERS, []);
  const id = String(identifier || '').trim().toLowerCase();
  const user = users.find((u) =>
    (u.email && u.email.toLowerCase() === id) ||
    (u.phone && String(u.phone) === String(identifier).trim()) ||
    (u.username && u.username.toLowerCase() === id)
  );
  if (!user || user.password !== password) {
    const e = new Error('Credenciais inválidas.');
    e.code = 'INVALID_CREDENTIALS';
    throw e;
  }
  return publicUser(user);
}

function publicUser(u) {
  return {
    id: u.id,
    username: u.username,
    firstName: u.firstName,
    lastName: u.lastName,
    avatar: u.avatar,
    bio: u.bio,
    neighborhood: u.neighborhood,
    verified: !!u.verified,
    createdAt: u.createdAt,
  };
}

export function localDashboard() {
  const list = localGetListings();
  return {
    activeListings: list.filter((l) => l.status === 'disponivel').length,
    reservedListings: list.filter((l) => l.status === 'reservado').length,
    soldListings: list.filter((l) => l.status === 'vendido').length,
    viewsThisMonth: 12,
    savesTotal: 3,
    pendingApproval: 0,
    dealsClosed: 0,
    conversionRate: 0,
  };
}

/** Resposta local Minguito — shape TalkToMinguitoOutput (RN). */
export function localTalkToMinguito({ listingId, demandId, message }) {
  const text = String(message || '').trim();
  const listing = listingId ? localGetListing(listingId) : null;
  const lower = text.toLowerCase();

  // Procura com matches reais (sem inventar stock)
  if (demandId) {
    try {
      // dynamic import avoided — require match via listings only in this module
    } catch (e) {}
  }

  /* R1: texto nunca fecha acordo — só o motor (confirmAsSeller) grava matched/dealPrice */
  if (listing && (lower.includes('acordo') || lower.includes('aceito') || lower.includes('fechado'))) {
    return {
      reply:
        'O acordo só fica confirmado quando o vendedor aceita no Fluxo. Continua a conversa aqui ou abre o Fluxo — eu não fecho preço por mensagem.',
      domain: {
        status: 'pending',
        listingId: listing._id,
      },
    };
  }

  if (listing) {
    return {
      reply:
        'Estou a ver o anúncio «' +
        listing.title +
        '» (' +
        listing.price +
        ' Kz' +
        (listing.location && listing.location.neighborhood
          ? ', ' + listing.location.neighborhood
          : '') +
        '). Diz a tua oferta ou o que precisas — respostas com base neste anúncio.',
      domain: {
        status: 'pending',
        listingId: listing._id,
        negotiationId: 'local-neg-listing',
      },
    };
  }

  if (lower.includes('procura') || lower.includes('quero') || lower.includes('tens')) {
    const items = localGetListings().slice(0, 5).map(function (l) {
      return {
        listingId: l._id,
        title: l.title,
        price: l.price,
        neighborhood: (l.location && l.location.neighborhood) || '',
        imageUrl: l.imageUrl,
      };
    });
    return {
      reply: items.length
        ? 'Com base na oferta activa neste aparelho:'
        : 'Ainda não há anúncios locais para mostrar.',
      domain: { status: 'results', items: items },
    };
  }

  return {
    reply:
      'Sou o Minguito em modo local. Abre um anúncio ou uma procura e fala comigo a partir daí — assim uso o contexto certo.',
  };
}
