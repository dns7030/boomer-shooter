# Lizards Over Rus

A first-person boomer shooter in the browser (Three.js). Lizard invaders drop from the sky into different eras of Russia
and you fight them with twelve weapons. Real sun shadows, bloom, bullet holes and scorch marks, dynamic explosion light,
exploding barrels, breakable crates and windows, and lizards that are 3D models baked into 16-direction sprite sheets at startup. Lizards turn slowly, so you can run around them and see their sides and backs; they need to face you to bite or shoot.

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
| 1–9 | weapon slot (press again to cycle weapons in the slot) |
| Mouse wheel, Q | previous / next weapon |
| M | music on / off |
| G | graphics quality (low / medium / high: shadows + bloom) |
| L | lizard look: baked 3D models or the original pixel sprites (also buttons on the Esc / pause screen) |
| Esc | pause |

## Weapons

| Slot | Weapon | Notes |
| --- | --- | --- |
| 1 | Shashka | melee swing |
| 2 | Pistol | accurate, bullets |
| 3 | Pump Shotgun / Super Shotgun | shells; fast pump, 20-pellet double barrel |
| 4 | Chaingun | bullets, spinning barrels |
| 5 | Rocket Launcher / Grenade Launcher | splash damage (careful — it hurts you too); grenades bounce and have a fuse |
| 6 | Plasma Rifle / Frost Gun | cells; plasma = fast bolts, frost = freezes lizards solid for 15 s (flames thaw them, hits shatter them; a frozen drake drops out of the sky) |
| 7 | Flamethrower | fuel; sets lizards on fire |
| 8 | Railgun | cells, pierces every lizard in a line |
| 9 | BFG 9000 | 25 cells, huge splash |

No weapon ever covers the crosshair (the headless test checks that).

## Levels

1. **Muscovy Street (1550s)** — three waves of lizards on a small street of period buildings (Izba, Boyar Terem, Merchant
   Palaty, Gostiny Dvor, Kizhi church, bell tower, Kremlin gate tower…). Every weapon is lying around somewhere.
2. **Soviet Avenue (1970s)** — a 350 m boulevard with real-scale buildings (Khrushchyovka, Brezhnevka, 16-storey tower block,
   Stalinist tower, Hotel Cosmos, factory with chimneys and cooling towers, Palace of Culture, circus, metro, Univermag,
   Workers' Club, trams, TV tower, obelisk and eternal flame) ending at the Motherland monument. You and the lizards keep the
   same size, so the world feels huge — run, fight seven encounters, reach the monument.

3. **St. Petersburg (1800s)** — six city blocks around a street grid, a canal with bridges (one drawbridge is up) and the Neva
   beyond. Palace Square (Winter Palace, General Staff arch, Alexander Column), St. Isaac's, the Bronze Horseman, Rostral columns,
   the Admiralty and Kunstkamera around a garden, Kazan Cathedral, Nevsky frontage, and an industrial yard (ropeworks, porcelain
   works, mint, foundry, sawmill). You can walk around whole blocks; lizards find their way round them (`src/nav.js`).
   Five waves, with flying **Fire Drakes** that hover over the streets and throw fireballs (shoot them out of the sky).

Pick a level from the title screen; clearing one offers the next.

## Music

Procedural techno generated live in the browser (`src/music.js`): kick, hats, clap, bass line, arpeggio, pad and stabs. The layers fade in
and out with the fight intensity (lizards alive, damage taken), so exploring is calm and fights are driving but friendly.
Each level has its own key, tempo and chord progression. `npm test` renders it offline and checks it is audible and not clipping.

## Layout

```
index.html        page + HUD
src/main.js       input, overlay, main loop
src/game.js       player, weapons, lizards, waves, pickups, rendering
src/levels.js     level registry
src/level.js      level 1 (Muscovy): layout, colliders, sky, UFOs
src/level_soviet.js  level 2 (Soviet avenue)
src/level_petersburg.js  level 3 (St. Petersburg blocks, canal, river)
src/nav.js        flow-field pathfinding around city blocks
src/lizard3d.js   3D lizard model + 8-angle sprite atlas baking
src/post.js       bloom + colour grade + vignette
src/decals.js, src/debris.js, src/props.js  bullet holes / scorch, flying debris, barrels and crates
src/buildings.js  Muscovy façade builders
src/buildings2.js Soviet building builders (real scale)
src/buildings3.js, src/landmarks3.js  Imperial Petersburg buildings and landmarks
src/geo.js        geometry helpers, collision + ray helpers
src/textures.js   procedural tileable textures
src/sprites.js    lizard / pickup / plasma sprites
src/weapons.js    weapon stats and ammo
src/weaponmodels.js  first-person weapons (3D models in their own scene, auto-aligned off the crosshair)
src/audio.js      WebAudio synth sound effects
src/music.js      procedural techno that follows the fight
tests/            headless-Chromium smoke test (npm test) and screenshot helpers
```

## Tests

`npm install && npm test` boots the game in headless Chromium, checks combat, collisions and that a bot can clear
all three waves, and writes screenshots. It cannot judge game feel — playtest for that.

## Adding content

* A new lizard variant: add a palette in `src/sprites.js`, an entry in `ENEMY` and `WAVES` in `src/game.js`.
* A new building: write a builder in `src/buildings.js` / `src/buildings2.js` (front faces +Z) and add a `side(...)` line in the level file.
* A new level: write a `build(scene)` like `level_soviet.js` (return colliders, spawn points, pickups, rules) and add it to `src/levels.js`.
* A new weapon: add its stats to `src/weapons.js`, a model in `src/weaponmodels.js` (give it a `muzzle` and a `tip`), and its behaviour in `fire()` in `src/game.js`.
