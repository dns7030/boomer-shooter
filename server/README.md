# Railway: game + leaderboard + players online (one service)

`server/index.js` is a tiny Node server (no framework) that **serves the game** (`index.html`, `neo.html`, `src/`, `vendor/`, `assets/`) **and** the stats API.
So with a private GitHub repo you do not need GitHub Pages (it needs a paid plan for private repos): Railway hosts everything from one URL.
Nothing else in the repo is served (no `.git`, `server/`, `tests/`, `docs/`).

## One-time setup (about 5 minutes)
1. railway.com -> **New Project** -> **Deploy from GitHub repo** -> pick `dns7030/boomer-shooter` (install/authorise the Railway GitHub app for that repo if asked).
2. In the service **Settings -> Source**: set the **branch** to `claude/festive-dirac-8ebprl` (or merge it into `main` and use `main`). Leave **Root Directory empty** (the repo root: `railway.json` there sets the build and start commands).
3. In the project click **+ New -> Database -> Add PostgreSQL**. Then in the game service **Variables** add a reference to it: `DATABASE_URL` = `${{Postgres.DATABASE_URL}}`.
   (Without a database the server falls back to a JSON file, which Railway erases at every deploy: fine for a quick try, not for a real leaderboard.)
4. In the game service **Variables** also add:
   - `ADMIN_KEY` = a long random string (e.g. 32+ characters). It protects the admin summary.
   - optional `PGSSL` = `off` only if the database connection fails with an SSL error on a private network URL.
5. **Settings -> Networking -> Generate Domain**. That URL (e.g. `https://neo-xxxx.up.railway.app`) is the game: open `/neo.html` for the Neo game and `/` for Lizards Over Rus.
6. Every push to the branch redeploys automatically (about 1-2 minutes). The dev box (key **P**) shows the build number.

## Using it
* Players online and the world leaderboard appear on the title screen automatically (the server rewrites `STATS_URL` to its own origin when it serves the pages).
* Admin summary (players, plays, waves, bosses, sessions per day, sessions per level, online now):
  `https://YOUR-URL/api/admin/summary?key=YOUR_ADMIN_KEY`
* Health check: `/health`.

## Endpoints
* `POST /api/ping` `{sid, game, nick, level}` (every ~20 s while a tab is open) -> `{online, byGame}`
* `POST /api/stats` `{game, nick, best, bosses, waves, kills, plays}` -> keeps the maximum of each field per nickname
* `GET /api/online`, `GET /api/leaderboard?game=neo&limit=10`
* `GET /api/admin/summary?key=ADMIN_KEY`

`game` is `neo` or `rus`. Nicknames are not authenticated (anyone can use any name). A rate limit of 120 requests/minute/IP applies.
Run locally: `cd server && npm install && node index.js` -> http://localhost:3111/neo.html (JSON file mode).

## If the game is hosted elsewhere (e.g. GitHub Pages)
Put the Railway URL into the `window.STATS_URL = ''` line of `index.html` / `neo.html` and set the Railway variable `ALLOW_ORIGIN` to the page's origin.
