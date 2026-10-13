// Optional online stats (see server/README.md). Does nothing when window.STATS_URL is empty / unreachable.
export function createOnline(game) {
  const url = (window.STATS_URL || '').replace(/\/$/, '');
  const api = { enabled: !!url, online: null, board: [], start() {}, setContext() {}, sendStats() {} };
  if (!url) return api;
  let sid = ''; try { sid = sessionStorage.getItem('sid') || ''; } catch (e) { /* ignore */ }
  if (!sid) { sid = Math.random().toString(36).slice(2) + Date.now().toString(36); try { sessionStorage.setItem('sid', sid); } catch (e) { /* ignore */ } }
  let nick = '', level = '', onUpdate = () => {};
  const post = (path, body) => fetch(url + path, { method: 'POST', headers: { 'content-type': 'text/plain' }, body: JSON.stringify(body), keepalive: true }).then((r) => r.json());
  async function ping() {
    try { const r = await post('/api/ping', { sid, game, nick, level }); api.online = r.online; onUpdate(); } catch (e) { /* offline */ }
  }
  async function refreshBoard() {
    try { api.board = await (await fetch(`${url}/api/leaderboard?game=${game}&limit=5`)).json(); onUpdate(); } catch (e) { /* offline */ }
  }
  let t = 0;
  api.start = (cb) => { onUpdate = cb; ping(); refreshBoard(); setInterval(ping, 20000); setInterval(refreshBoard, 60000); };
  api.setContext = (n, l) => { nick = n || nick; level = l || level; };
  api.sendStats = (n, s) => { clearTimeout(t); t = setTimeout(() => post('/api/stats', { game, nick: n, ...s }).then(refreshBoard).catch(() => {}), 1500); };
  return api;
}
