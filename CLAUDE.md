# Notes for Claude sessions in this repo

Retro browser boomer shooter on Three.js r170: no build step, everything procedural (textures, models, music, sprites).
* Public game: **Neo Marines: Lizards from Chain** (`neo.html`, `src/neo/`). Old game: Lizards Over Rus (`index.html`), not served in production.
* Read `docs/WORKFLOW.md` (branches, deploy, sessions), `server/README.md` (Railway), `docs/BUILDER_BRIEF.md` (how buildings/levels are built), `docs/TODO.md`.
* Develop on `claude/festive-dirac-8ebprl`. Do NOT push to `main` unless the user says to promote/release. Never open a pull request unless asked.
* Run `node tools/stamp.mjs` before each commit. Check changes with `node tests/errs.mjs` and the relevant script in `tests/` (they render in headless Chromium).
* Never ask for passwords or tokens in chat. Railway access is the `RAILWAY_TOKEN` environment variable (a project token: header `Project-Access-Token`).
* Gotchas: keep offset surfaces at least 5 cm apart (z-fighting); nothing may go below y=0; meshes with vertex colours or emissive need `userData.keep = true`;
  steps and plinths need colliders; no Cyrillic or CJK text in textures; decals are placed by raycast on real meshes.
