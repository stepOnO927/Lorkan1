// Runs before the game scripts, only in AI tabs. Never calls the site's logout API.
(() => {
  'use strict';
  const url = new URL(location.href);
  const room = url.searchParams.get('game');
  const role = Number(url.searchParams.get('lorkanRole'));
  if (url.protocol !== 'https:' || !['frontwars.io', 'www.frontwars.io'].includes(url.hostname) ||
      !/^[A-Za-z0-9_-]{6,32}$/.test(room ?? '') || !Number.isInteger(role) || role < 1 || role > 25) return;
  if (window.__lorkanGuestBootstrap) return;
  const state = {ready: false, room, role, guestID: null, guestName: 'LorkanGuestAI' + role, error: null};
  window.__lorkanGuestBootstrap = state;
  try {
    const key = 'lorkan.guest07.' + room + '.role' + role;
    const session = window.sessionStorage;
    let saved;
    try { saved = JSON.parse(session.getItem(key) || 'null'); } catch {}
    const validID = value => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
    const guestID = validID(saved?.guestID) ? saved.guestID : crypto.randomUUID();
    const entries = saved?.guestID === guestID && Array.isArray(saved.entries) ? saved.entries : [];
    const data = new Map(entries.filter(e => Array.isArray(e) && typeof e[0] === 'string' && typeof e[1] === 'string'));
    data.set('persistent_id', guestID);
    for (const name of ['username', 'custom_username', 'guest_username']) {
      data.set('frontwars:player:' + name, JSON.stringify(state.guestName));
    }
    data.set('frontwars:player:clan_tag', JSON.stringify(''));
    // Do not import any host storage, account token or creating-lobby information.
    data.delete('frontwars:player:creating_lobby');
    try { const seat = JSON.parse(session.getItem('lorkan.private06.seat.' + room + '.role' + role) || 'null'); if (seat?.gameID === room && /^[A-Za-z0-9]{8}$/.test(seat.clientID ?? '')) data.set('frontwars:player:frontwars_session', JSON.stringify(seat)); } catch {}

    const persist = () => session.setItem(key, JSON.stringify({guestID, entries: [...data]}));
    persist();
    const methods = {
      getItem: name => data.get(String(name)) ?? null,
      setItem: (name, value) => { data.set(String(name), String(value)); persist(); },
      removeItem: name => { data.delete(String(name)); persist(); },
      clear: () => { data.clear(); data.set('persistent_id', guestID); persist(); },
      key: index => [...data.keys()][Number(index)] ?? null
    };
    const storage = new Proxy(Object.create(null), {
      get: (_, name) => name === 'length' ? data.size : Object.hasOwn(methods, name) ? methods[name] : data.get(name),
      set: (_, name, value) => { methods.setItem(name, value); return true; },
      deleteProperty: (_, name) => { methods.removeItem(name); return true; },
      has: (_, name) => Object.hasOwn(methods, name) || name === 'length' || data.has(name),
      ownKeys: () => [...data.keys()],
      getOwnPropertyDescriptor: (_, name) => data.has(name) ? {value: data.get(name), enumerable: true, configurable: true, writable: true} : undefined
    });
    Object.defineProperty(window, 'localStorage', {configurable: true, get: () => storage});
    // A real anonymous request: omit account cookies and Authorization. Do not fake
    // auth responses or alter CAPTCHA requests, proof data, or WebSocket messages.
    const fetchNative = window.fetch.bind(window);
    window.fetch = (input, init) => {
      const requestURL = new URL(typeof input === 'string' || input instanceof URL ? input : input.url, location.href);
      const gameHost = requestURL.hostname === 'frontwars.io' || requestURL.hostname.endsWith('.frontwars.io');
      if (!gameHost || requestURL.protocol !== 'https:') return fetchNative(input, init);
      const headers = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined));
      headers.delete('Authorization');
      return fetchNative(input, {...init, headers, credentials: 'omit'});
    };
    state.guestID = guestID;
    state.ready = true;
  } catch (error) {
    state.error = String(error?.message ?? error);
  }
})();
