# Building builders — contract (for level 4, the Soviet metropolis)

Game: "Lizards Over Rus", a retro first-person shooter in the browser (Three.js r170, no build step, ES modules,
everything procedural: canvas textures, primitives). The player is 1.7 m tall; lizards are ~2 m. A storey is ~3 m.
Look at `src/buildings3.js`, `src/landmarks3.js` (Imperial Petersburg) and `src/buildings2.js` (Soviet) for the house style:
chunky low-poly primitives + pixel-art canvas textures + painted window decals. Match that look; do NOT use external assets.

## What a builder is
```js
export function school(opts = {}) { const g = new THREE.Group(); ... return size(g, w, d, h, cols?); }
```
* origin = centre of the footprint, on the ground (y = 0); the FRONT (main entrance) faces local +Z.
* every builder returns a THREE.Group and sets `g.userData = { w, d, h }` (footprint width along x, depth along z, height in metres).
* Optional `g.userData.cols = [[x0, x1, z0, z1, h], ...]`: local-space collider rectangles (before the level rotates/places the building).
  If you give `cols`, the level uses them INSTEAD of the w×d box — use this for anything with walkable gaps
  (archway passages, courtyards, the stadium bowl, the space under a bridge-like building). Colliders are axis-aligned boxes
  standing on the ground (no overhangs): bullets and players treat them as solid from y = 0 up to `h`.
  Make walkable gaps at least 6 m wide, and keep the visible geometry consistent with the colliders.
* If there is no `cols`, the collider is the full w×d rectangle with height h, so w/d must cover the whole visible footprint
  (steps, porticos included).
* Keep triangle counts modest (a building should stay under ~15k triangles; use 8–14 segment cylinders/spheres).
  Reuse materials (`mat(name)` / `color(hex)` are cached). Avoid per-building canvas textures unless cached by name.
* Name textures with your own prefix (see below) so nothing collides.

## Helpers you may import
```js
import * as THREE from 'three';
import { mat, color, boxT, cylT, place, gableRoof, decal, plane, onionDome } from './geo.js';
import { slab, tiledPlane, sign } from './buildings2.js';       // slab(w,h,d, sideMat, roofMat, tile): box with separate roof
import { addPainters, makeCanvas, toTexture, mulberry } from './textures.js';
```
* `mat('name')` → cached Lambert material with the named procedural texture; `color(0xRRGGBB, {emissive})` → flat colour material.
  Existing texture names you can use: `concrete, concreteDark, panel, panelLoggia, ribbon, stalin, curtain, brick, stone, plaster,
  roofTar, metalRoof, asphalt, paving, pavingDark, grass, glass, planks, domeSilver, domeGold, domeBlue, granite, gravel, water,
  shopfront, rustic, ironDoor, lattice, chimney, circus, awningRed, awningBlue, stuccoWhite, stuccoGrey, plainYellow, plainBlue,
  plainTerra, plainPink, plainMint, plainCream, plainOchre` (the `stucco*` ones have windows painted in; the `plain*` ones do not).
* `boxT(w,h,d,material,tile)`: box whose UVs tile every `tile` metres. `cylT(rTop,rBot,h,segments,material,tile)`.
  `place(mesh,x,y,z)` sets position and returns the mesh. `slab()` is for walls that get a different roof texture.
* Windows: `decal('window', w, h, x, y, z, { c: '#fbfaf4' /*frame colour*/, lit: true|false, fixed: true|false })` returns a plane
  facing +Z (rotate it with `.rotation.y` for other faces; it is double-sided). Windows are shatterable by bullets/explosions
  unless `fixed: true` (use fixed for back/side faces and decorative ones). `decal('door', w, h, x, y, z, { c })` is a door.
  Place decals ~0.06 m in front of the wall they sit on.
* `sign(text, w, h, { bg, fg })` → a plane with Cyrillic/Latin text (use Soviet slogans / names).
* New textures: `addPainters({ s4_name: (g, w, h) => { /* 2D canvas context g */ } }, { s4_name: [64, 64] })` at module load;
  textures are 64×64 by default, nearest-filtered pixel art, repeat-wrapped. Draw with `g.fillStyle = '#..'; g.fillRect(...)`.
  Use `mulberry(seed)` for deterministic noise. Prefix your texture names (`s4a_`, `s4b_`, `s4c_`).
* Never import from `game.js`. Do not edit any file other than your own module (and your own tests output under /tmp).

## Look & feel notes
* Sun comes from direction (0.32, 0.5, -0.8), real shadows are on: give things relief (cornices, recesses, protruding balconies,
  stepped silhouettes) rather than flat boxes. Colours: sunny blue sky, so use light concrete, white, pastel, rust, glass-blue,
  brick red, with a few strong accent colours (red banners, gold stars, signal blue). Add a Soviet sign/slogan/mosaic where it fits
  (use `sign()`), and roof detail (antennas, water tanks, parapets, flag poles).
* Real-world proportions matter more than perfect detail; the silhouette must be recognisable from 100 m away.
* Sizes in the brief are TARGET footprints; the level may scale a building a little.

## Testing
`node tests/gallery.mjs src/<yourmodule>.js /tmp/<yourdir> [name ...]` builds each export on flat ground, prints size/triangle
count and writes `<name>-front|side|back.png` screenshots (open them with the Read tool and LOOK at them, fix what is ugly).
Pass options as `name:{"floors":9}`. Run `node tests/errs.mjs` to check the page loads without errors after your module is
imported by something. Iterate until each building looks good from front, side and back.

---
# Addendum for the Neo game cities (Shanghai, Tokyo, Singapore, Rio) — rules learned the hard way

The Neo game (neo.html) uses the same builders. Read `src/buildings5s.js` (Seattle) and `src/buildings5d.js` (Dubai) as the most
recent examples of the house style and of the helper patterns (merge helpers, glass, signs, enterable halls via `hall()` from `src/interiors.js`).

**Content rules**
* NO Cyrillic text anywhere. Latin text only, short (signs render with canvas fonts; CJK glyphs are NOT reliable — do not use Chinese/Japanese
  characters in `sign()`/canvas text; use Latin words, numbers, or purely graphic neon shapes: bars, circles, arrows, stripes, stars).
* No people, no tents/homeless, nothing offensive. Humour is fine (cats, coffee, closed shops, silly sign words).
* Only the Neo green `#00E599` as brand colour: small emissive accents (thin light strips, a sign border, a screen) — never a logo, never the word "node".
* Each city has its own atmosphere; build for the lighting stated in your task.

**Geometry rules (each of these was a real bug)**
* Nothing may stick below the ground: keep every vertex at y >= 0 (domes/blobs/spheres: build only the part above ground, or move them up).
  Ground layers don't write depth, so anything below y = 0 shows through the ground.
* No coplanar faces: signs, windows, door plates, stripes must sit at least 0.05–0.08 m in front of the wall they decorate (z-fighting flickers).
  Two boxes must not share the same face plane either (offset one by a few cm).
* Steps, podiums, plinths and porches wider than the main body MUST be covered by `cols` (a low collider, e.g. h = their height), otherwise lizards walk into them.
  `cols` rectangles must match the visible geometry (no big invisible walls, no missing walls). Walkable gaps >= 6 m wide.
* Vertex-coloured meshes (`vertexColors: true`) lose their colours when the level merges static meshes: set `mesh.userData.keep = true` on them.
  Animated/emissive parts that must stay separate also need `userData.keep = true`.
* Transparent glass: `depthWrite:false`, `side: DoubleSide` is fine, but keep it above ground.
* Enterable halls: use `hall()` from `src/interiors.js`; expose `userData.inside = {x0,x1,z0,z1}` and `userData.doors` (door side, centre, width) so the level can place pickups and spawns inside.
  Aisles >= 4 m, doors >= 6 m wide, interior must be walkable end to end.
* Keep every building < ~15k triangles; props < 2k. Reuse geometry/materials.
* Origin = footprint centre on the ground, front = +Z, `g.userData = { w, d, h[, cols] }` where w/d cover everything visible at ground level.

**Test like this:** `node tests/gallery.mjs src/<yourmodule>.js /tmp/<dir>` and LOOK at the front/side/back PNGs (Read tool). Fix anything
floating, flickering, below ground, or ugly. Then `node tests/errs.mjs` must print nothing.
