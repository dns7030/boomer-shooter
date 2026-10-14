// Stats backend (no framework). Storage: Postgres when DATABASE_URL is set (Railway), otherwise a local JSON file (development).
//   POST /api/ping         { sid, game, nick, level }        -> { online }       (call every ~20 s while a game tab is open)
//   POST /api/stats        { game, nick, best, bosses, waves, kills, plays }     (lifetime stats; the server keeps the maximum of each)
//   GET  /api/online                                         -> { online, byGame }
//   GET  /api/leaderboard?game=neo&limit=10                  -> [{ nick, best, bosses, waves, kills, plays }]
//   GET  /api/admin/summary?key=ADMIN_KEY                    -> totals, daily sessions, online now, per-level sessions
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const PORT = Number(process.env.PORT || 3111);
const ADMIN_KEY = process.env.ADMIN_KEY || '';
const ORIGIN = process.env.ALLOW_ORIGIN || '*';
const ONLINE_WINDOW_MS = 45000;
const GAMES = new Set(['neo', 'rus']);

// ---------------- storage ----------------
const clean = (s, n = 16) => String(s || '').replace(/[^\p{L}\p{N} _.\-]/gu, '').trim().slice(0, n);
const int = (v) => Math.max(0, Math.min(1e9, Math.floor(Number(v) || 0)));

async function makeStore() {
  if (process.env.DATABASE_URL) {
    const { default: pg } = await import('pg');
    const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.PGSSL === 'off' ? false : { rejectUnauthorized: false } });
    await pool.query(`CREATE TABLE IF NOT EXISTS players (game text, nick text, best int DEFAULT 0, bosses int DEFAULT 0, waves int DEFAULT 0, kills int DEFAULT 0, plays int DEFAULT 0, updated timestamptz DEFAULT now(), PRIMARY KEY (game, nick));
      CREATE TABLE IF NOT EXISTS sessions (sid text PRIMARY KEY, game text, nick text, level text, first_seen timestamptz DEFAULT now(), last_seen timestamptz DEFAULT now());`);
    return {
      async upsertPlayer(p) {
        await pool.query(`INSERT INTO players (game,nick,best,bosses,waves,kills,plays) VALUES ($1,$2,$3,$4,$5,$6,$7)
          ON CONFLICT (game,nick) DO UPDATE SET best=GREATEST(players.best,$3), bosses=GREATEST(players.bosses,$4), waves=GREATEST(players.waves,$5), kills=GREATEST(players.kills,$6), plays=GREATEST(players.plays,$7), updated=now()`, [p.game, p.nick, p.best, p.bosses, p.waves, p.kills, p.plays]);
      },
      async leaderboard(game, limit) { return (await pool.query('SELECT nick,best,bosses,waves,kills,plays FROM players WHERE game=$1 ORDER BY best DESC LIMIT $2', [game, limit])).rows; },
      async touchSession(s) {
        await pool.query(`INSERT INTO sessions (sid,game,nick,level) VALUES ($1,$2,$3,$4) ON CONFLICT (sid) DO UPDATE SET last_seen=now(), nick=$3, level=$4`, [s.sid, s.game, s.nick, s.level]);
      },
      async online() { return (await pool.query(`SELECT game, count(*)::int AS n FROM sessions WHERE last_seen > now() - interval '${ONLINE_WINDOW_MS / 1000} seconds' GROUP BY game`)).rows; },
      async summary() {
        const one = async (q) => (await pool.query(q)).rows;
        return {
          players: await one('SELECT game, count(*)::int AS players, sum(plays)::int AS plays, sum(waves)::int AS waves, sum(bosses)::int AS bosses, sum(kills)::int AS kills FROM players GROUP BY game'),
          sessionsPerDay: await one(`SELECT to_char(first_seen,'YYYY-MM-DD') AS day, game, count(*)::int AS sessions FROM sessions WHERE first_seen > now() - interval '30 days' GROUP BY 1,2 ORDER BY 1 DESC`),
          sessionsPerLevel: await one('SELECT game, level, count(*)::int AS sessions FROM sessions GROUP BY 1,2 ORDER BY 3 DESC'),
        };
      },
    };
  }
  // ---- JSON file fallback (development / tiny deployments with a volume) ----
  const FILE = process.env.DATA_FILE || new URL('./data.json', import.meta.url).pathname;
  let db = { players: {}, sessions: {} };
  try { db = JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch (e) { /* new file */ }
  let dirty = false;
  setInterval(() => { if (dirty) { dirty = false; try { fs.writeFileSync(FILE, JSON.stringify(db)); } catch (e) { console.error('save failed', e.message); } } }, 5000).unref();
  return {
    async upsertPlayer(p) {
      const k = `${p.game}|${p.nick}`, o = db.players[k] || { game: p.game, nick: p.nick, best: 0, bosses: 0, waves: 0, kills: 0, plays: 0 };
      for (const f of ['best', 'bosses', 'waves', 'kills', 'plays']) o[f] = Math.max(o[f], p[f]);
      db.players[k] = o; dirty = true;
    },
    async leaderboard(game, limit) { return Object.values(db.players).filter((p) => p.game === game).sort((a, b) => b.best - a.best).slice(0, limit).map(({ nick, best, bosses, waves, kills, plays }) => ({ nick, best, bosses, waves, kills, plays })); },
    async touchSession(s) { const o = db.sessions[s.sid] || { ...s, first: Date.now() }; o.last = Date.now(); o.nick = s.nick; o.level = s.level; db.sessions[s.sid] = o; dirty = true; },
    async online() {
      const by = {}; const now = Date.now();
      for (const s of Object.values(db.sessions)) if (now - s.last < ONLINE_WINDOW_MS) by[s.game] = (by[s.game] || 0) + 1;
      return Object.entries(by).map(([game, n]) => ({ game, n }));
    },
    async summary() {
      const agg = {}, perDay = {}, perLevel = {};
      for (const p of Object.values(db.players)) { const a = (agg[p.game] ||= { game: p.game, players: 0, plays: 0, waves: 0, bosses: 0, kills: 0 }); a.players++; for (const f of ['plays', 'waves', 'bosses', 'kills']) a[f] += p[f]; }
      for (const s of Object.values(db.sessions)) { const d = new Date(s.first).toISOString().slice(0, 10) + '|' + s.game; perDay[d] = (perDay[d] || 0) + 1; const l = s.game + '|' + s.level; perLevel[l] = (perLevel[l] || 0) + 1; }
      return { players: Object.values(agg), sessionsPerDay: Object.entries(perDay).map(([k, sessions]) => ({ day: k.split('|')[0], game: k.split('|')[1], sessions })), sessionsPerLevel: Object.entries(perLevel).map(([k, sessions]) => ({ game: k.split('|')[0], level: k.split('|')[1], sessions })) };
    },
  };
}

const store = await makeStore();

// ---------------- the game itself (static files), so one Railway service hosts everything ----------------
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
// Neo Marines is the public game: "/" opens neo.html. The old Lizards Over Rus page (index.html) stays in the repo but is NOT served,
// unless the variable SERVE_RUS=1 is set (handy on a private staging service).
const SERVE_RUS = process.env.SERVE_RUS === '1';
const WEB_FILES = new Set(['neo.html', ...(SERVE_RUS ? ['index.html'] : [])]), WEB_DIRS = ['src', 'vendor', 'assets'];
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.json': 'application/json', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' };
function serveStatic(u, res) {
  let rel = decodeURIComponent(u.pathname).replace(/^\/+/, '');
  if (rel === '') rel = 'neo.html';
  const top = rel.split('/')[0];
  if (!(WEB_FILES.has(rel) || WEB_DIRS.includes(top))) return false;
  const f = path.resolve(ROOT, rel);
  if (!f.startsWith(ROOT + path.sep) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) return false;
  const headers = { 'content-type': MIME[path.extname(f)] || 'application/octet-stream', 'cache-control': 'no-cache' };   // always revalidate: players get new builds immediately
  if (f.endsWith('.html')) {   // pages served by this server talk to this same server for stats
    const html = fs.readFileSync(f, 'utf8').replace("window.STATS_URL = ''", 'window.STATS_URL = location.origin');
    res.writeHead(200, headers); res.end(html); return true;
  }
  res.writeHead(200, headers); fs.createReadStream(f).pipe(res); return true;
}

// ---------------- tiny rate limit (per IP) ----------------
const hits = new Map();
function limited(ip, max = 120) {
  const m = Math.floor(Date.now() / 60000), k = ip, h = hits.get(k);
  if (!h || h.m !== m) { hits.set(k, { m, n: 1 }); return false; }
  return ++h.n > max;
}
setInterval(() => hits.clear(), 10 * 60000).unref();

const send = (res, code, body) => { res.writeHead(code, { 'content-type': 'application/json', 'access-control-allow-origin': ORIGIN, 'access-control-allow-headers': 'content-type', 'access-control-allow-methods': 'GET,POST,OPTIONS' }); res.end(JSON.stringify(body)); };
const readJson = (req) => new Promise((resolve) => { let b = ''; req.on('data', (c) => { b += c; if (b.length > 4000) req.destroy(); }); req.on('end', () => { try { resolve(JSON.parse(b || '{}')); } catch (e) { resolve({}); } }); });

http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://x'), ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').toString().split(',')[0].trim();
  try {
    if (req.method === 'OPTIONS') return send(res, 204, {});
    if (limited(ip)) return send(res, 429, { error: 'slow down' });
    if (u.pathname === '/health') return send(res, 200, { ok: true, service: 'neo-stats' });
    if (req.method === 'GET' && !u.pathname.startsWith('/api/') && serveStatic(u, res)) return;
    if (req.method === 'POST' && u.pathname === '/api/ping') {
      const b = await readJson(req), game = GAMES.has(b.game) ? b.game : null, sid = clean(b.sid, 40);
      if (!game || !sid) return send(res, 400, { error: 'bad request' });
      await store.touchSession({ sid, game, nick: clean(b.nick), level: clean(b.level, 24) });
      const rows = await store.online();
      return send(res, 200, { online: rows.reduce((a, r) => a + r.n, 0), byGame: Object.fromEntries(rows.map((r) => [r.game, r.n])) });
    }
    if (req.method === 'POST' && u.pathname === '/api/stats') {
      const b = await readJson(req), game = GAMES.has(b.game) ? b.game : null, nick = clean(b.nick);
      if (!game || !nick) return send(res, 400, { error: 'bad request' });
      await store.upsertPlayer({ game, nick, best: int(b.best), bosses: int(b.bosses), waves: int(b.waves), kills: int(b.kills), plays: int(b.plays) });
      return send(res, 200, { ok: true });
    }
    if (u.pathname === '/api/online') { const rows = await store.online(); return send(res, 200, { online: rows.reduce((a, r) => a + r.n, 0), byGame: Object.fromEntries(rows.map((r) => [r.game, r.n])) }); }
    if (u.pathname === '/api/leaderboard') { const game = GAMES.has(u.searchParams.get('game')) ? u.searchParams.get('game') : 'neo'; return send(res, 200, await store.leaderboard(game, Math.min(50, Number(u.searchParams.get('limit')) || 10))); }
    if (u.pathname === '/api/admin/summary') { if (!ADMIN_KEY || u.searchParams.get('key') !== ADMIN_KEY) return send(res, 403, { error: 'forbidden' }); return send(res, 200, { ...(await store.summary()), online: await store.online() }); }
    return send(res, 404, { error: 'not found' });
  } catch (e) { console.error(e); return send(res, 500, { error: 'server error' }); }
}).listen(PORT, () => console.log(`stats server on :${PORT} (${process.env.DATABASE_URL ? 'postgres' : 'json file'})`));
