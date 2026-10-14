# Workflow: branches, deploys, sessions

## Two games, one repo
* **Neo Marines: Lizards from Chain** (`neo.html`, `src/neo/`): the public game. It is what the Railway domain serves at `/`.
* **Lizards Over Rus** (`index.html`, `src/level*.js`): the first game. It stays in the repo but is not served by the Railway server
  (set `SERVE_RUS=1` on a private test service to serve it). GitHub Pages, if still on, would still show it, so switch Pages off once Railway is the home.

## Branches
* `main` = what real players play. Railway's production service deploys from `main`. Nothing goes here until it has been tried.
* `claude/festive-dirac-8ebprl` = the working branch: every experiment and fix is pushed here first.
* To release: merge the working branch into `main` (ask Claude "promote to main", or open a pull request on GitHub). Railway redeploys `main` in 1-2 minutes.
* Optional test site: in Railway add a second service from the same repo with its branch set to `claude/festive-dirac-8ebprl` (and `SERVE_RUS=1` if
  you want the old game there). It gives a private URL that always shows the latest experiment, so players on `main` never see half-finished work.

## Sessions
* Game work (code, art, balance) happens in the main chat, which has the full history. It pushes to the working branch only.
* Railway checks (variables, deploy status, logs) can be done in any new session that has `RAILWAY_TOKEN` in its environment. That session starts with no
  memory, so keep it to checking; it reads this file and `server/README.md` for the setup.
* Before every push: `node tools/stamp.mjs` (writes the build number to `src/version.js`; the dev box, key P, shows it).

## Tests (headless Chromium via playwright-core)
`node tests/errs.mjs` (no console errors), `node tests/neo_fail.mjs [levelIndex]` (towers fall with no defence), `npm test` (everything, 10-15 min).
