// Optional online stats (see server/README.md): players online, world leaderboard, lifetime stats.
// window.STATS_URL = 'https://...' uses that server. server/index.js (Railway) rewrites it to its own origin when it serves the pages;
// everywhere else it stays '' and stats are offline-only (GitHub Pages, local file server, ...).
export function createOnline(game) {
  const explicit = (window.STATS_URL || '').replace(/\/$/, '');
  const api = { enabled: false, online: null, board: [], start(cb) { api._cb = cb; if (api.enabled) api._go(); }, setContext(n, l) { nick = n || nick; level = l || level; }, sendStats(n, s) { if (!api.enabled) return; clearTimeout(t); t = setTimeout(() => post('/api/stats', { game, nick: n, ...s }).then(refresh).catch(() => {}), 1500); }, _cb: () => {}, _go() {} };
  let url = explicit, nick = '', level = '', t = 0, started = false, sid = '';
  try { sid = sessionStorage.getItem('sid') || ''; } catch (e) { /* ignore */ }
  if (!sid) { sid = Math.random().toString(36).slice(2) + Date.now().toString(36); try { sessionStorage.setItem('sid', sid); } catch (e) { /* ignore */ } }
  const post = (path, body) => fetch(url + path, { method: 'POST', headers: { 'content-type': 'text/plain' }, body: JSON.stringify(body), keepalive: true }).then((r) => r.json());
  const note = () => { try { api._cb(); } catch (e) { /* ignore */ } };
  async function ping() { try { const r = await post('/api/ping', { sid, game, nick, level }); api.online = r.online; note(); } catch (e) { /* offline */ } }
  async function refresh() { try { api.board = await (await fetch(`${url}/api/leaderboard?game=${game}&limit=5`)).json(); note(); } catch (e) { /* offline */ } }
  api._go = () => { if (started) return; started = true; ping(); refresh(); setInterval(ping, 20000); setInterval(refresh, 60000); };
  if (explicit) api.enabled = true;
  return api;
}
