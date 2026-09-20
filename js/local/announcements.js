var KEY = 'mc_local_announcements';

export function listAnnouncements() {
  try {
    var raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return [];
}

export function addAnnouncement(input) {
  var list = listAnnouncements();
  var item = {
    id: 'ann-' + Date.now(),
    title: input.title || 'Aviso',
    body: input.body || '',
    createdAt: Date.now(),
    active: true,
  };
  list.unshift(item);
  localStorage.setItem(KEY, JSON.stringify(list));
  return item;
}
