# Open issues / notes (written down, not fixed yet)

- **Shanghai:** the bronze bull (`bundBull`, placed at x=64, z=-14 in `src/neo/level_shanghai.js`) is too close to the Neo tower and overlaps it. Move it clear of the tower plinth (tower at x=76, z=0, plinth about 16 m half-width), e.g. further south on the promenade.
- **Pistol:** the first-person hand (`hand()` in `src/weaponmodels.js`, used by `buildPistol`) looks toy-like, basically a pink ball. Give it a more realistic shape (fingers wrapped round the grip, thumb, knuckles).
- Other pending: walk the four enterable halls (Shanghai lobby, Singapore conference hall, Tokyo pachinko, Rio samba club) with a bot; defended playthrough of the new cities; deploy the stats server on Railway and set `STATS_URL`.
