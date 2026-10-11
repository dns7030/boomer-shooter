# Lizards Over Rus

A first-person boomer shooter in the browser (Three.js). Muscovy, 1550s: lizard invaders drop from the sky onto a
street of period buildings, and you fight them with a sabre, a pistol, a pump shotgun and a chaingun.
You stay on the street — buildings are façades only.

Everything (textures, sprites, sounds) is generated procedurally at runtime. No asset files, no build step.

## Run

```
git clone https://github.com/dns7030/boomer-shooter
cd boomer-shooter
python3 -m http.server 8000      # or: npx serve
```

Open <http://localhost:8000> and click **PLAY**. (A local server is required: browsers block ES modules on `file://`.)

## Controls

| Key | Action |
| --- | --- |
| WASD | move |
| Mouse | look |
| Left click | fire / swing (hold to repeat) |
| Space | jump |
| Shift | run |
| 1–4, mouse wheel, Q | switch weapon |
| Esc | pause |

## Level 1 — the street

Three waves of two lizard types (Raider: melee runner; Spitter: kites you and fires slow plasma).
Find the **shotgun** (near the start) and the **chaingun** (mid-street). Pick up kvass (health), powder and shot.

Buildings (Old Rus & Muscovy list): Izba, Boyar Terem, Merchant Palaty, Gostiny Dvor, Kizhi-style wooden church,
Bell Tower, Banya, Windmill, Kuznitsa (smithy), Kremlin wall + Spasskaya-style gate tower, wooden ostrog palisade
with guard towers, plus market stalls, holy well, wayside cross, hay carts and barrels.

## Layout

```
index.html        page + HUD
src/main.js       input, overlay, main loop
src/game.js       player, weapons, lizards, waves, pickups, rendering
src/level.js      street layout, colliders, sky, UFOs
src/buildings.js  façade builders
src/geo.js        geometry helpers, collision + ray helpers
src/textures.js   procedural tileable textures
src/sprites.js    lizard / pickup / plasma sprites
src/weapons.js    weapon stats        src/weaponmodels.js  first-person weapons (3D models, own scene)
src/audio.js      WebAudio synth sound
tests/            headless-Chromium smoke test (npm test) and screenshot helpers
```

## Tests

`npm install && npm test` boots the game in headless Chromium, checks combat, collisions and that a bot can clear
all three waves, and writes screenshots. It cannot judge game feel — playtest for that.

## Adding content

* A new lizard variant: add a palette in `src/sprites.js`, an entry in `ENEMY` and `WAVES` in `src/game.js`.
* A new building: write a builder in `src/buildings.js` (front faces +Z) and add a `side(...)` line in `src/level.js`.
* A new epoch: swap the building list and palette in `src/level.js`.
