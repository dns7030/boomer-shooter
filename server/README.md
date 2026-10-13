# Stats server (Railway)

Tiny Node server (no framework) for: global leaderboard, **players online now**, and usage stats for the developers.

## Deploy on Railway
1. Railway -> New Project -> *Deploy from GitHub repo* -> pick this repo -> set the **Root Directory** to `server`.
2. Add a **PostgreSQL** plugin to the project (Railway sets `DATABASE_URL` for the server automatically). Without it the server falls back
   to a JSON file, which Railway wipes on every deploy - use Postgres.
3. Variables: `ADMIN_KEY` = a long random string (needed for the admin summary), optional `ALLOW_ORIGIN` = `https://dns7030.github.io`.
4. Settings -> Networking -> *Generate domain*. Copy the URL (e.g. `https://neo-stats.up.railway.app`).
5. Put it into `index.html` and `neo.html` (`window.STATS_URL = '...'`) and push. Leave it empty to stay offline-only.

## Endpoints
* `POST /api/ping` `{sid, game, nick, level}` (every ~20 s while a tab is open) -> `{online, byGame}`
* `POST /api/stats` `{game, nick, best, bosses, waves, kills, plays}` -> keeps the maximum of each field per nickname
* `GET /api/online`, `GET /api/leaderboard?game=neo&limit=10`
* `GET /api/admin/summary?key=ADMIN_KEY` -> players / plays / waves / bosses, sessions per day, sessions per level, online now

`game` is `neo` (Neo: Lizards over the Chain) or `rus` (Lizards over Rus). Nicknames are not authenticated (anyone can use any name).
Run locally: `cd server && npm install && node index.js` (JSON file mode, port 3111).
