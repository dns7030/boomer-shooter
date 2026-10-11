// Core game: player, weapons, lizards, waves, pickups, rendering.
import * as THREE from 'three';
import { LEVELS } from './levels.js';
import { resolveCircle, rayBox, rayBoxN, rayCyl } from './geo.js';
import { Decals } from './decals.js';
import { Debris } from './debris.js';
import { makeBarrel, makeCrate } from './props.js';
import { brokenWindowMaterial } from './geo.js';
import { makeLizardTextures, makePickupTextures, makePlasmaTexture } from './sprites.js';
import { renderLizardAtlases, frameUV, POSE, ANGLES, SPRITE_SIZE, SPRITE_FOOT } from './lizard3d.js';
import { WEAPONS, AMMO, WEAPON_INDEX, SLOTS } from './weapons.js';
import { WeaponView } from './weaponmodels.js';
import { sfx } from './audio.js';
import { PostFX } from './post.js';
import { Nav } from './nav.js';

const EYE = 1.7;
const ENEMY = {
  grunt: { name: 'Lizard Raider', hp: 70, speed: 4.2, radius: 0.5, melee: 10, w: 2.1, h: 2.62, ai: 'melee', reach: 1.8 },
  spitter: { name: 'Lizard Spitter', hp: 45, speed: 2.6, radius: 0.5, w: 2.1, h: 2.62, ai: 'ranged', shot: 'spit' },
  drake: { name: 'Fire Drake', hp: 60, speed: 3.4, radius: 0.6, w: 2.1, h: 2.62, ai: 'ranged', shot: 'fire', hover: 4.2 },       // flies, throws fireballs
  bomber: { name: 'Egg Bomber', hp: 70, speed: 2.7, radius: 0.7, w: 2.1, h: 2.62, ai: 'bomber', hover: 7.5 },                       // slow flyer dropping bouncing explosive eggs
  gargoyle: { name: 'Gargoyle', hp: 55, speed: 7.5, radius: 0.55, melee: 14, w: 2.1, h: 2.62, ai: 'melee', reach: 2.0, hover: 2.4, perch: true },   // statue on a ledge until you pass
  shield: { name: 'Shield Lizard', hp: 120, speed: 3.0, radius: 0.65, melee: 16, w: 2.1, h: 2.62, ai: 'melee', reach: 2.3, shield: true, scale: 1.12, hitR: 0.8, hitH: 2.7 },
  tsar: { name: 'Great Lizard Tsar', hp: 1600, speed: 2.5, radius: 1.7, melee: 32, w: 2.1, h: 2.62, ai: 'melee', reach: 4.6, boss: true, scale: 2.8, hitR: 1.6, hitH: 6.0 },
};
const TURN = { grunt: 3.4, spitter: 2.8, drake: 2.3, bomber: 1.8, gargoyle: 5, shield: 1.7, tsar: 0.9 };   // rad/s: lizards turn slower than you can run around them
const hitR = (e) => e.cfg.hitR || 0.6, hitH = (e) => e.cfg.hitH || 2.3;

const angDiff = (a, b) => { const d = a - b; return Math.atan2(Math.sin(d), Math.cos(d)); };
const ALIVE = new Set(['spawn', 'move', 'attack', 'pain', 'perch', 'dive']);

export class Game {
  constructor({ canvas, ui }) {
    this.ui = ui || {};
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.autoClear = false;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.quality = 2;   // 0 = plain, 1 = bloom + grading, 2 = + sun shadows
    try { const q = localStorage.getItem('lor.quality'); if (q !== null) this.quality = Math.min(2, Math.max(0, Number(q))); } catch (e) { /* no storage */ }
    this.wview = new WeaponView(this.renderer);
    this.camera = new THREE.PerspectiveCamera(75, 16 / 9, 0.2, 3000);
    this.camera.rotation.order = 'YXZ';
    this.lizStyle = 'sprite3d';   // 'sprite3d' (baked 3D) or 'pixel' (the original hand-drawn pixel lizards)
    try { const ls = localStorage.getItem('lor.lizards'); if (ls === 'pixel' || ls === 'sprite3d') this.lizStyle = ls; } catch (e) { /* no storage */ }
    this.liz = makeLizardTextures();
    this.atlas = {};
    this.ensureAtlas(['grunt', 'spitter']);   // 3D lizards baked into 8-direction sprite sheets
    this.pickTex = makePickupTextures();
    for (const [id, t] of Object.entries(this.wview.renderIcons(this.renderer))) this.pickTex['w_' + id] = t;
    const spriteMat = (tint) => new THREE.SpriteMaterial({ map: makePlasmaTexture(tint), blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
    this.plasmaMat = spriteMat('green');                       // lizard spit
    this.fireballMat = spriteMat('orange');                    // drake fireballs
    this.shotMats = { rocket: spriteMat('orange'), plasma: spriteMat('blue'), frost: spriteMat('blue'), bfg: spriteMat('green'), boom: spriteMat('orange'), boomBlue: spriteMat('blue'), boomGreen: spriteMat('green') };
    this.eggGeo = new THREE.SphereGeometry(0.26, 12, 10); this.eggGeo.scale(0.8, 1.15, 0.8);
    this.eggMat = new THREE.MeshStandardMaterial({ color: 0xf0e6a0, emissive: 0xff7a20, emissiveIntensity: 0.25, roughness: 0.4 });
    this.eggs = [];
    this.grenadeGeo = new THREE.SphereGeometry(0.13, 10, 8);
    this.grenadeMat = new THREE.MeshLambertMaterial({ color: 0x3a4a2a });
    this.beamMat = new THREE.MeshBasicMaterial({ color: 0x7ae0ff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
    this.beamGeo = new THREE.CylinderGeometry(0.9, 0.9, 18, 14, 1, true);
    this.shadowGeo = new THREE.CircleGeometry(0.7, 12); this.shadowGeo.rotateX(-Math.PI / 2);
    this.shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.35, depthWrite: false });

    this.keys = new Set();
    this.mouseDown = false;
    this.state = 'title';
    this.time = 0;
    this.levelIndex = 0;
    this.loadLevel(0);
    this.resize(canvas.clientWidth || 960, canvas.clientHeight || 540);
    this.post = new PostFX(this.renderer, this.scene, this.camera, this.wview.scene, this.wview.camera, this.renderer.domElement.width, this.renderer.domElement.height);
    this.setQuality(this.quality);
  }

  setQuality(q) {
    this.quality = q;
    try { localStorage.setItem('lor.quality', String(q)); } catch (e) { /* no storage */ }
    if (this.post) this.post.setEnabled(q >= 1);
    if (this.sun) this.sun.castShadow = q >= 2;
  }
  // bake the 3D sprite sheets for the enemy types a level uses (lazily, so startup stays quick)
  ensureAtlas(types) {
    const need = [...new Set(types)].filter((t) => !this.atlas[t]);
    if (need.length) Object.assign(this.atlas, renderLizardAtlases(this.renderer, need));
  }
  // lizard look: baked 3D models or the original pixel sprites; swaps live lizards too (drakes are always 3D)
  setLizStyle(st) {
    this.lizStyle = st;
    try { localStorage.setItem('lor.lizards', st); } catch (e) { /* no storage */ }
    for (const e of this.enemies || []) this.styleEnemy(e);
    return st === 'pixel' ? 'PIXEL' : '3D MODELS';
  }
  toggleLizStyle() { return this.setLizStyle(this.lizStyle === 'pixel' ? 'sprite3d' : 'pixel'); }
  styleEnemy(e) {
    const pix = this.lizStyle === 'pixel' && !!this.liz[e.type], cfg = e.cfg, sc = cfg.scale || 1;
    e.pix = pix;
    const geo = pix ? new THREE.PlaneGeometry(cfg.w * sc, cfg.h * sc) : new THREE.PlaneGeometry(SPRITE_SIZE * sc, SPRITE_SIZE * sc);
    geo.translate(0, pix ? cfg.h * sc / 2 : (SPRITE_SIZE / 2 - SPRITE_FOOT) * sc, 0);
    e.mesh.geometry.dispose(); e.mesh.geometry = geo; e.uv = geo.attributes.uv;
    e.mesh.material.map = pix ? this.liz[e.type].idle : this.atlas[e.type].texture; e.mesh.material.needsUpdate = true;
    e.mesh.scale.x = 1; e.frameKey = -1;
  }
  cycleQuality() { this.setQuality((this.quality + 1) % 3); return ['LOW', 'MEDIUM (BLOOM)', 'HIGH (BLOOM + SHADOWS)'][this.quality]; }

  // Sun shadows: everything lit casts and receives, except flat ground layers and see-through decals.
  setupShadows() {
    this.sun = null;
    this.scene.traverse((o) => {
      if (o.isDirectionalLight) this.sun = o;
      if (!o.isMesh && !o.isInstancedMesh) return;
      const m = Array.isArray(o.material) ? o.material[0] : o.material;
      if (!m || !(m.isMeshLambertMaterial || m.isMeshStandardMaterial || m.isMeshPhongMaterial)) return;
      o.receiveShadow = true;
      o.castShadow = !m.transparent && !(o.renderOrder <= -6);
    });
    if (this.sun) {
      const sh = this.sun.shadow;
      sh.mapSize.set(2048, 2048); sh.camera.left = -75; sh.camera.right = 75; sh.camera.top = 75; sh.camera.bottom = -75; sh.camera.near = 1; sh.camera.far = 700;
      sh.bias = -0.0006; sh.normalBias = 0.06;
      this.scene.add(this.sun.target);
      this.sun.castShadow = this.quality >= 2;
    }
  }

  // Build (or rebuild) a level: fresh scene, colliders, spawn data, particle pool.
  loadLevel(i) {
    this.clearEntities();
    if (this.scene) this.scene.traverse((o) => { if (o.geometry) o.geometry.dispose(); });
    this.levelIndex = i;
    this.scene = new THREE.Scene();
    this.scene.add(this.camera);
    this.level = LEVELS[i].build(this.scene);
    this.boxes = this.level.boxes;
    this.ensureAtlas(this.level.enemyTypes || ['grunt', 'spitter']);
    this.nav = this.level.navBounds ? new Nav(this.boxes, this.level.navBounds) : null;
    this.makeParticlePool();
    this.setupShadows();
    this.decals = new Decals(this.scene);
    this.debris = new Debris(this.scene, 260, (k, v, p) => this.debrisSound(k, v, p));
    this.props = [];
    this.timers = [];
    this.scene.updateMatrixWorld(true);
    this.windows = (this.level.windows || []).map((w) => { w.pos = w.mesh.getWorldPosition(new THREE.Vector3()); w.n = w.mesh.getWorldDirection(new THREE.Vector3()); return w; });
    this.setupLights();
    if (this.post) this.post.setScene(this.scene);
    this.reset();
  }
  get levelCount() { return LEVELS.length; }

  // ---------------- setup / reset ----------------
  clearEntities() {
    for (const e of this.enemies || []) this.disposeEnemy(e);
    for (const pr of this.projectiles || []) this.scene.remove(pr.sprite);
    for (const pk of this.pickups || []) this.scene.remove(pk.mesh);
    for (const q of this.pshots || []) this.scene.remove(q.obj);
    for (const f of this.fx || []) this.scene.remove(f.obj);
    this.enemies = []; this.projectiles = []; this.pickups = []; this.pshots = []; this.fx = [];
    for (const q of this.sprites || []) { q.life = 0; q.m.visible = false; }
    for (const q of this.particles || []) { q.life = 0; q.m.visible = false; }
  }

  reset() {
    for (const q of this.eggs || []) { this.scene.remove(q.obj); q.obj.material.dispose(); }
    this.eggs = [];
    this.clearEntities();
    if (this.decals) this.decals.clear();
    if (this.debris) this.debris.clear();
    this.timers = [];
    this.resetWorld();
    for (const d of this.dlights || []) { d.owner = null; d.t = 0; d.l.intensity = 0; }
    const L = this.level, st = L.start;
    this.p = {
      x: st.x, y: 0, z: st.z, vx: 0, vz: 0, vy: 0, yaw: st.yaw || 0, pitch: 0, grounded: true,
      health: 100, ammo: Object.fromEntries(Object.entries(AMMO).map(([k, v]) => [k, v.start])),
      has: Object.fromEntries(L.startWeapons.map((id) => [id, true])), weapon: WEAPON_INDEX.pistol, cd: 0, since: 10, firing: false,
      switching: 0, switchTo: 1, flash: 0, swing: -1, pendingMelee: 0, shotN: 0,
      bob: 0, bobAmp: 0, kick: 0, hurt: 0, roll: 0, spin: 0, spinV: 0,
    };
    this.stats = { kills: 0, time: 0, shots: 0 };
    this.wave = { index: -1, phase: L.mode === 'waves' ? 'intro' : 'fight', timer: 2.5, toSpawn: [], spawnTimer: 0, enc: 0 };
    this.messageT = 0;
    for (const s of L.pickupSpawns) this.addPickup(s.type, s.x, s.z);
    this.setMessage(L.intro, 5);
  }

  resize(w, h) {
    const H = 540, W = Math.round((H * w) / h);
    this.renderer.setPixelRatio(1);
    this.renderer.setSize(W, H, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.wview.resize(w / h);
    if (this.post) this.post.setSize(W, H);
  }

  setState(s) { this.state = s; if (this.ui.onState) this.ui.onState(s); }
  begin() { if (this.state === 'dead' || this.state === 'won') this.reset(); this.setState('playing'); }
  nextLevel() { return this.levelIndex + 1 < LEVELS.length ? this.levelIndex + 1 : null; }
  pause() { if (this.state === 'playing') this.setState('paused'); }

  // ---------------- particles ----------------
  // ---------------- breakable world: props, windows, debris, timers ----------------
  schedule(delay, fn) { this.timers.push({ t: delay, fn }); }
  updateTimers(dt) {
    for (let i = this.timers.length - 1; i >= 0; i--) { const tm = this.timers[i]; tm.t -= dt; if (tm.t <= 0) { this.timers.splice(i, 1); tm.fn(); } }
  }
  debrisSound(kind, v) {
    const now = this.time;
    if (now - (this._lastTink || 0) < 0.03) return;
    this._lastTink = now;
    if (kind === 'glass') sfx.glass(); else sfx.tink(v);
  }
  resetWorld() {
    for (const p of this.props || []) { this.scene.remove(p.obj); const i = this.boxes.indexOf(p.box); if (i >= 0) this.boxes.splice(i, 1); }
    this.props = [];
    for (const w of this.windows || []) if (w.broken) { w.broken = false; w.mesh.material = w.orig; }
    for (const spec of this.level.propSpawns || []) this.addProp(spec);
  }
  addProp({ type, x, z, rot = 0 }) {
    const obj = type === 'barrel' ? makeBarrel() : makeCrate(1.15);
    const r = type === 'barrel' ? 0.42 : 0.62, h = type === 'barrel' ? 1.0 : 1.15;
    obj.position.set(x, 0, z); obj.rotation.y = rot; this.scene.add(obj);
    obj.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    const box = { x0: x - r, x1: x + r, z0: z - r, z1: z + r, h };
    this.boxes.push(box);
    const prop = { type, obj, box, x, z, r, h, hp: type === 'barrel' ? 24 : 40, explosive: type === 'barrel', dead: false };
    this.props.push(prop);
    return prop;
  }
  hitProps(pt, dmg) {
    for (const p of this.props) {
      if (p.dead) continue;
      if (pt.x > p.box.x0 - 0.2 && pt.x < p.box.x1 + 0.2 && pt.z > p.box.z0 - 0.2 && pt.z < p.box.z1 + 0.2 && pt.y < p.h + 0.2) this.damageProp(p, dmg);
    }
  }
  blastProps(x, y, z, R, dmg) {
    for (const p of this.props) {
      if (p.dead) continue;
      const d = Math.hypot(p.x - x, p.z - z) - p.r;
      if (d < R) this.damageProp(p, dmg * 1.2 * (1 - Math.max(0, d) / R));
    }
  }
  damageProp(p, dmg) {
    if (p.dead) return;
    p.hp -= dmg;
    p.obj.position.y = 0.02; // tiny jolt
    if (p.hp <= 0) this.destroyProp(p);
  }
  destroyProp(p) {
    p.dead = true;
    this.scene.remove(p.obj);
    const i = this.boxes.indexOf(p.box); if (i >= 0) this.boxes.splice(i, 1);
    const n = p.explosive ? 7 : 11;
    for (let k = 0; k < n; k++) {
      const a = Math.random() * 6.283, sp = 2 + Math.random() * (p.explosive ? 7 : 4);
      this.debris.spawn(p.explosive ? 'metal' : 'wood', p.x, 0.3 + Math.random() * 0.8, p.z, Math.cos(a) * sp, 3 + Math.random() * 5, Math.sin(a) * sp);
    }
    if (p.explosive) {
      this.schedule(0.1 + Math.random() * 0.14, () => this.explode(p.x, 0.8, p.z, 5.2, 120, 'boom', null));
    } else {
      sfx.crate();
      this.burst(p.x, 0.6, p.z, 'dust', 8, 3, 0.15);
      if (Math.random() < 0.5) { const r = Math.random(); this.addPickup(r < 0.2 ? 'kvass' : r < 0.6 ? 'powder' : 'shot', p.x, p.z, true); }
    }
  }
  shatterWindowsNear(pt, r) {
    for (const w of this.windows) {
      if (w.broken) continue;
      const dx = w.pos.x - pt.x, dy = w.pos.y - pt.y, dz = w.pos.z - pt.z;
      if (dx * dx + dy * dy + dz * dz < r * r) this.breakWindow(w);
    }
  }
  breakWindow(w) {
    w.broken = true; w.orig = w.mesh.material; w.mesh.material = brokenWindowMaterial();
    sfx.glass();
    for (let k = 0; k < 10; k++) {
      const sp = 1.5 + Math.random() * 3.5;
      this.debris.spawn('glass', w.pos.x + (Math.random() - 0.5) * 0.7, w.pos.y + (Math.random() - 0.5) * 1.0, w.pos.z + (Math.random() - 0.5) * 0.7,
        w.n.x * sp + (Math.random() - 0.5) * 2, Math.random() * 3, w.n.z * sp + (Math.random() - 0.5) * 2);
    }
  }
  ejectCasing(kind) {
    const { dir, right, up } = this.basis(), p = this.p, o = this.eye().addScaledVector(dir, 0.55).addScaledVector(right, 0.16).addScaledVector(up, -0.14);
    const count = kind === 'shell2' ? 2 : 1, type = kind === 'brass' ? 'brass' : 'shell';
    for (let i = 0; i < count; i++) {
      const sp = 1.6 + Math.random() * 1.4;
      this.debris.spawn(type, o.x, o.y, o.z, right.x * sp + dir.x * (Math.random() - 0.4) + p.vx * 0.4 + (i - 0.5) * 0.4, 1.4 + Math.random() * 1.6, right.z * sp + dir.z * (Math.random() - 0.4) + p.vz * 0.4);
    }
  }

  // Four reusable point lights: explosions, fire and plasma light up their surroundings.
  setupLights() {
    this.dlights = [];
    for (let i = 0; i < 4; i++) {
      const l = new THREE.PointLight(0xffffff, 0, 36, 2);
      this.scene.add(l);
      this.dlights.push({ l, t: 0, dur: 1, peak: 0, owner: null });
    }
  }
  acquireLight() {
    let best = null;
    for (const d of this.dlights) { if (d.owner) continue; if (d.t <= 0) return d; if (!best || d.t < best.t) best = d; }
    return best;
  }
  flash(x, y, z, color, peak, dur) {
    const d = this.acquireLight(); if (!d) return;
    d.l.color.set(color); d.l.position.set(x, y, z); d.peak = peak; d.dur = dur; d.t = dur;
  }
  updateLights(dt) {
    for (const d of this.dlights) {
      if (d.owner) continue;
      if (d.t > 0) { d.t -= dt; d.l.intensity = d.peak * Math.max(0, d.t) / d.dur; } else d.l.intensity = 0;
    }
  }

  makeParticlePool() {
    const geo = new THREE.BoxGeometry(1, 1, 1);
    this.pmats = {
      green: new THREE.MeshBasicMaterial({ color: 0x3f7a2a }),
      dust: new THREE.MeshBasicMaterial({ color: 0xcdbb9a }),
      fire: new THREE.MeshBasicMaterial({ color: 0xffc040 }),
      plasma: new THREE.MeshBasicMaterial({ color: 0x8dff9d }),
      smoke: new THREE.MeshBasicMaterial({ color: 0x555049 }),
      flameY: new THREE.MeshBasicMaterial({ color: 0xffd860 }),
      flameR: new THREE.MeshBasicMaterial({ color: 0xff6a20 }),
      blue: new THREE.MeshBasicMaterial({ color: 0x8adfff }),
    };
    this.particles = [];
    for (let i = 0; i < 160; i++) {
      const m = new THREE.Mesh(geo, this.pmats.dust);
      m.visible = false; this.scene.add(m);
      this.particles.push({ m, life: 0, vx: 0, vy: 0, vz: 0 });
    }
    this.pIdx = 0;
    // soft sprite particles for fire and smoke
    const sp = (tint, additive) => new THREE.SpriteMaterial({ map: makePlasmaTexture(tint), blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending, depthWrite: false, transparent: true });
    this.smats = { flameY: sp('orange', true), flameR: sp('orange', true), smoke: null, fire: sp('orange', true), spark: sp('orange', true) };
    const smokeTex = makePlasmaTexture('orange');
    this.smats.smoke = new THREE.SpriteMaterial({ map: smokeTex, color: 0x302c28, depthWrite: false, transparent: true });
    this.sprites = [];
    for (let i = 0; i < 260; i++) {
      const m = new THREE.Sprite(this.smats.fire.clone()); m.visible = false; this.scene.add(m);
      this.sprites.push({ m, life: 0, max: 1, vx: 0, vy: 0, vz: 0, size: 0.3, grav: 0, kind: 'fire' });
    }
    this.sIdx = 0;
  }
  burst(x, y, z, kind, n, speed = 3, size = 0.1) {
    for (let i = 0; i < n; i++) {
      const p = this.particles[this.pIdx++ % this.particles.length];
      p.m.material = this.pmats[kind]; p.m.visible = true;
      p.m.position.set(x, y, z);
      const s = size * (0.6 + Math.random() * 0.8); p.m.scale.set(s, s, s);
      p.vx = (Math.random() - 0.5) * speed; p.vy = Math.random() * speed * 0.9; p.vz = (Math.random() - 0.5) * speed;
      p.life = 0.35 + Math.random() * 0.35; p.grav = 12;
    }
  }
  sparks(x, y, z, n, speed = 5, nx = 0, ny = 0.3, nz = 0) {
    for (let i = 0; i < n; i++) this.emit(x, y, z, 'spark', nx * speed * 0.6 + (Math.random() - 0.5) * speed, ny * speed + Math.random() * speed * 0.7, nz * speed * 0.6 + (Math.random() - 0.5) * speed, 0.25 + Math.random() * 0.3, 0.16 + Math.random() * 0.12, 16);
  }
  emit(x, y, z, kind, vx, vy, vz, life, size, grav = 12) {
    if (kind === 'flameY' || kind === 'flameR' || kind === 'smoke' || kind === 'fire' || kind === 'spark') {
      const q = this.sprites[this.sIdx++ % this.sprites.length], base = this.smats[kind];
      q.m.material.map = base.map; q.m.material.blending = base.blending; q.m.material.color.copy(base.color);
      q.m.material.needsUpdate = true;
      if (kind === 'flameR') q.m.material.color.setRGB(1, 0.45, 0.2);
      q.m.visible = true; q.m.position.set(x, y, z); q.life = q.max = life; q.vx = vx; q.vy = vy; q.vz = vz; q.size = size * 2.2; q.grav = grav; q.kind = kind;
      q.m.scale.setScalar(q.size * 0.5);
      return;
    }
    const p = this.particles[this.pIdx++ % this.particles.length];
    p.m.material = this.pmats[kind]; p.m.visible = true; p.m.position.set(x, y, z);
    p.m.scale.set(size, size, size); p.vx = vx; p.vy = vy; p.vz = vz; p.life = life; p.grav = grav; p.grow = 0;
  }
  updateParticles(dt) {
    for (const q of this.sprites) {
      if (q.life <= 0) continue;
      q.life -= dt;
      if (q.life <= 0) { q.m.visible = false; continue; }
      const u = q.life / q.max;
      q.vy -= q.grav * dt;
      q.m.position.x += q.vx * dt; q.m.position.y += q.vy * dt; q.m.position.z += q.vz * dt;
      q.m.scale.setScalar(q.size * (q.kind === 'smoke' ? 0.6 + (1 - u) * 1.2 : q.kind === 'spark' ? 0.25 + u * 0.75 : 0.35 + u * 0.65));
      q.m.material.opacity = q.kind === 'smoke' ? 0.55 * u : Math.min(1, u * 1.5);
    }
    for (const p of this.particles) {
      if (p.life <= 0) continue;
      p.life -= dt;
      if (p.life <= 0) { p.m.visible = false; continue; }
      p.vy -= (p.grav === undefined ? 12 : p.grav) * dt;
      p.m.position.x += p.vx * dt; p.m.position.y = Math.max(0.03, p.m.position.y + p.vy * dt); p.m.position.z += p.vz * dt;
    }
  }

  // ---------------- pickups ----------------
  addPickup(type, x, z, toss = false) {
    const weapon = type.startsWith('w_');
    const mesh = new THREE.Mesh(weapon ? new THREE.PlaneGeometry(2.3, 1.15) : new THREE.PlaneGeometry(0.8, 0.8), new THREE.MeshBasicMaterial({ map: this.pickTex[type], transparent: true, alphaTest: 0.4, side: THREE.DoubleSide }));
    mesh.position.set(x, 0.7, z);
    this.scene.add(mesh);
    const glow = new THREE.Mesh(new THREE.CircleGeometry(weapon ? 0.9 : 0.45, 14), new THREE.MeshBasicMaterial({ color: weapon ? 0xffd060 : 0xffffff, transparent: true, opacity: 0.25, depthWrite: false }));
    glow.rotation.x = -Math.PI / 2; glow.position.set(0, weapon ? -0.8 : -0.65, 0); mesh.add(glow);
    mesh.rotation.order = 'YXZ';
    const k = { type, mesh, x, z, t: Math.random() * 6, py: toss ? 1.0 : 0.75, vx: 0, vy: 0, vz: 0, rise: toss ? 0 : 1, toss, roll: 0 };
    if (toss) { const a = Math.random() * 6.283, sp = 2.5 + Math.random() * 2.5; k.vx = Math.cos(a) * sp; k.vz = Math.sin(a) * sp; k.vy = 4 + Math.random() * 3; }
    this.pickups.push(k);
  }
  updatePickups(dt) {
    const p = this.p;
    for (let i = this.pickups.length - 1; i >= 0; i--) {
      const k = this.pickups[i];
      k.t += dt;
      const base = k.type.startsWith('w_') ? 0.95 : 0.75, rad = 0.32;
      if (k.toss && k.rise < 1) {
        // thrown by a lizard / broken crate: falls, bounces, rolls to a stop, then floats up as a normal pickup
        if (k.settling) { k.rise = Math.min(1, k.rise + dt / 0.5); k.py = rad + (base - rad) * k.rise; if (k.rise >= 1) k.toss = false; }
        else {
          k.vy -= 18 * dt; k.py += k.vy * dt; k.x += k.vx * dt; k.z += k.vz * dt;
          const pos = { x: k.x, z: k.z }, ox = k.x, oz = k.z; resolveCircle(pos, 0.3, this.boxes);
          if (pos.x !== ox) k.vx = -k.vx * 0.5; if (pos.z !== oz) k.vz = -k.vz * 0.5; k.x = pos.x; k.z = pos.z;
          if (k.py < rad) { k.py = rad; if (k.vy < -1.2) { k.vy = -k.vy * 0.5; k.vx *= 0.8; k.vz *= 0.8; } else { k.vy = 0; const f = Math.exp(-3.5 * dt); k.vx *= f; k.vz *= f; } }
          const sp = Math.hypot(k.vx, k.vz); k.roll += sp * dt * 3;
          k.mesh.rotation.z = Math.sin(k.roll) * 0.5 * Math.min(1, sp);
          if (k.py <= rad + 0.001 && sp < 0.25) { k.settling = true; k.mesh.rotation.z = 0; }
        }
        k.mesh.position.set(k.x, k.py, k.z);
      } else k.mesh.position.set(k.x, base + Math.sin(k.t * 3) * 0.1, k.z);
      k.mesh.rotation.y = Math.atan2(this.camera.position.x - k.x, this.camera.position.z - k.z);
      if (!(k.toss && k.rise < 0.2 && k.py > 0.5 && k.vy > 0) && Math.hypot(p.x - k.x, p.z - k.z) < 1.1 && this.collect(k.type)) {
        this.scene.remove(k.mesh); this.pickups.splice(i, 1); sfx.pickup();
      }
    }
  }
  addAmmo(kind, n) {
    const p = this.p, A = AMMO[kind];
    if (p.ammo[kind] >= A.max) return false;
    p.ammo[kind] = Math.min(A.max, p.ammo[kind] + n); return true;
  }
  collect(type) {
    const p = this.p;
    if (type === 'kvass') { if (p.health >= 100) return false; p.health = Math.min(100, p.health + 30); this.setMessage('KVASS  +30 HEALTH'); return true; }
    const ammoPickups = {
      powder: ['bullets', 24, 'POWDER KEG  +24 BULLETS'], shot: ['shells', 6, 'SHOT POUCH  +6 SHELLS'],
      rockets: ['rockets', 4, 'ROCKET CRATE  +4 ROCKETS'], cells: ['cells', 30, 'ENERGY CELL  +30'], fuel: ['fuel', 60, 'FUEL CAN  +60'],
    };
    if (ammoPickups[type]) {
      const [kind, n, msg] = ammoPickups[type];
      if (type === 'rockets') { const a = this.addAmmo('rockets', 4), b = this.addAmmo('grenades', 4); if (!a && !b) return false; this.setMessage('ROCKETS +4  GRENADES +4'); return true; }
      if (!this.addAmmo(kind, n)) return false;
      this.setMessage(msg); return true;
    }
    const id = type.slice(2), wi = WEAPON_INDEX[id], w = WEAPONS[wi];
    if (wi === undefined) return false;
    const had = p.has[id];
    p.has[id] = true;
    this.addAmmo(w.ammo, w.starter || 0);
    if (!had) { this.selectWeapon(wi); this.setMessage(`${w.name.toUpperCase()} ACQUIRED  [${w.slot}]`, 3); } else this.setMessage(`${w.name.toUpperCase()}  +AMMO`);
    return true;
  }

  // ---------------- player ----------------
  owned(i) { return !!this.p.has[WEAPONS[i].id]; }
  selectWeapon(i) {
    const p = this.p;
    if (i === p.weapon || !this.owned(i) || p.switching > 0) return;
    p.switchTo = i; p.switching = 0.0001;
  }
  // number keys: press again to cycle weapons that share the slot
  selectSlot(n) {
    const p = this.p, list = WEAPONS.map((w, i) => i).filter((i) => WEAPONS[i].slot === n && this.owned(i));
    if (!list.length) return;
    const cur = list.indexOf(p.weapon);
    this.selectWeapon(cur < 0 ? list[0] : list[(cur + 1) % list.length]);
  }
  cycleWeapon(dir) {
    const p = this.p, n = WEAPONS.length; let i = p.weapon;
    for (let k = 0; k < n; k++) { i = (i + dir + n) % n; if (this.owned(i)) return this.selectWeapon(i); }
  }
  bestFallback() {
    const p = this.p;
    for (let i = WEAPONS.length - 1; i >= 0; i--) if (this.owned(i) && (WEAPONS[i].melee || p.ammo[WEAPONS[i].ammo] >= WEAPONS[i].use)) return i;
    return 0;
  }

  updatePlayer(dt) {
    const p = this.p, k = this.keys;
    const f = (k.has('KeyW') || k.has('ArrowUp') ? 1 : 0) - (k.has('KeyS') || k.has('ArrowDown') ? 1 : 0);
    const s = (k.has('KeyD') || k.has('ArrowRight') ? 1 : 0) - (k.has('KeyA') || k.has('ArrowLeft') ? 1 : 0);
    const sin = Math.sin(p.yaw), cos = Math.cos(p.yaw);
    let wx = -sin * f + cos * s, wz = -cos * f - sin * s;
    const len = Math.hypot(wx, wz);
    if (len > 0) { wx /= len; wz /= len; }
    const speed = k.has('ShiftLeft') ? 9.5 : 7.5;
    const accel = p.grounded ? 70 : 18;
    p.vx += (wx * speed - p.vx) * Math.min(1, (len > 0 ? accel : 55) * dt / speed);
    p.vz += (wz * speed - p.vz) * Math.min(1, (len > 0 ? accel : 55) * dt / speed);
    if (k.has('Space') && p.grounded) { p.vy = 7.2; p.grounded = false; }
    p.vy -= 22 * dt;
    p.y += p.vy * dt;
    if (p.y <= 0) { p.y = 0; p.vy = 0; p.grounded = true; }
    p.x += p.vx * dt; p.z += p.vz * dt;
    resolveCircle(p, 0.45, this.boxes);
    for (const e of this.enemies) { // lizards are solid: you can't walk through them (flying ones only when you're under/over them)
      if (!ALIVE.has(e.state) || e.state === 'spawn' || p.y + 1.8 < e.y || p.y > e.y + 2.4) continue;
      const dx = p.x - e.x, dz = p.z - e.z, d = Math.hypot(dx, dz), min = 0.45 + e.cfg.radius;
      if (d < min) { const f = d > 1e-4 ? (min - d) / d : 0; p.x += d > 1e-4 ? dx * f : min; p.z += dz * f; }
    }
    resolveCircle(p, 0.45, this.boxes);
    const moving = Math.hypot(p.vx, p.vz);
    p.bob += dt * (6 + moving * 0.9) * (p.grounded ? 1 : 0);
    p.bobAmp += ((p.grounded ? Math.min(1, moving / 7) : 0) - p.bobAmp) * Math.min(1, dt * 10);
    p.kick *= Math.max(0, 1 - dt * 12);
    p.hurt = Math.max(0, p.hurt - dt);
    p.roll *= Math.max(0, 1 - dt * 8);
  }

  updateWeapon(dt) {
    const p = this.p;
    p.cd = Math.max(0, p.cd - dt);
    const prevSince = p.since;
    p.since += dt;
    if (WEAPONS[p.weapon].id === 'ssg') for (const [th, name] of [[0.3, 'ssgOpen'], [0.5, 'shellIn'], [0.67, 'shellIn'], [0.9, 'ssgClose']]) if (prevSince < th && p.since >= th) sfx[name]();
    p.flash = Math.max(0, p.flash - dt * 12);
    p.firing = p.firing && p.since < 0.12;
    if (p.swing >= 0) { p.swing += dt / 0.38; if (p.swing >= 1) p.swing = -1; }
    if (p.pendingMelee > 0) { p.pendingMelee -= dt; if (p.pendingMelee <= 0) this.meleeHit(); }
    if (p.switching > 0) {
      p.switching += dt / 0.16;
      if (p.switching >= 1 && p.weapon !== p.switchTo) { p.weapon = p.switchTo; p.swing = -1; p.flash = 0; p.firing = false; }
      if (p.switching >= 2) p.switching = 0;
    }
    p.spinV = p.flash > 0.2 ? 28 : Math.max(0, p.spinV - dt * 40);
    p.spin += p.spinV * dt;
    if (this.mouseDown && p.switching === 0 && p.cd <= 0) this.fire();
  }

  basis() {
    const q = this.camera.quaternion;
    return {
      dir: new THREE.Vector3(0, 0, -1).applyQuaternion(q),
      right: new THREE.Vector3(1, 0, 0).applyQuaternion(q),
      up: new THREE.Vector3(0, 1, 0).applyQuaternion(q),
    };
  }
  eye() { return new THREE.Vector3(this.p.x, this.p.y + EYE, this.p.z); }

  fire() {
    const p = this.p, w = WEAPONS[p.weapon];
    if (this.state !== 'playing' || p.cd > 0 || p.switching > 0) return false;
    if (w.melee) {
      p.cd = w.cooldown; p.swing = 0; p.pendingMelee = 0.14; p.since = 0; sfx.sabre(); return true;
    }
    if (p.ammo[w.ammo] < w.use) {
      sfx.empty(); p.cd = 0.3;
      const alt = this.bestFallback();
      if (alt !== p.weapon) { this.setMessage('OUT OF AMMO'); this.selectWeapon(alt); }
      return false;
    }
    p.ammo[w.ammo] -= w.use;
    p.cd = w.cooldown; p.flash = 1; p.since = 0; p.shotN++; this.stats.shots++;
    p.kick += w.kick;
    if (w.kind === 'flame') p.firing = true;
    if (w.kind !== 'flame' || p.shotN % 3 === 0) sfx[w.sfx]();
    if (w.eject) { if (w.ejectDelay) this.schedule(w.ejectDelay, () => this.ejectCasing(w.eject)); else this.ejectCasing(w.eject); }
    if (w.kind === 'hitscan') this.fireHitscan(w);
    else if (w.kind === 'projectile') this.fireProjectile(w);
    else if (w.kind === 'flame') this.fireFlame(w);
    else if (w.kind === 'rail') this.fireRail(w);
    return true;
  }

  fireHitscan(w) {
    const { dir, right, up } = this.basis();
    const o = this.eye();
    for (let i = 0; i < w.pellets; i++) {
      const d = dir.clone();
      if (w.spread) {
        const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * w.spread;
        d.addScaledVector(right, Math.cos(a) * r).addScaledVector(up, Math.sin(a) * r).normalize();
      }
      const hit = this.hitscan(o, d, this.level.range, true);
      const pt = o.clone().addScaledVector(d, hit.t);
      if (hit.corpse) this.corpseHit(hit.corpse, d, w.damage, pt);
      else if (hit.enemy) this.damageEnemy(hit.enemy, w.damage, pt, false, d);
      else if (hit.t < this.level.range) this.impact(pt, hit, d, i < 6, w.damage);
    }
  }

  // bullet hit a wall / the ground: dust, sparks and (a few) bullet holes
  impact(pt, hit, d, mark = true, dmg = 12) {
    this.burst(pt.x - d.x * 0.1, pt.y, pt.z - d.z * 0.1, 'dust', 2, 2.2, 0.08);
    if (!hit.n) return;
    this.sparks(pt.x, pt.y, pt.z, hit.ground ? 2 : 3, 4, hit.n.x, hit.n.y, hit.n.z);
    if (mark && !hit.invisible) this.decals.add('bullet', pt, hit.n, 0.16 + Math.random() * 0.08);
    this.shatterWindowsNear(pt, 0.9);
    this.hitProps(pt, dmg);
  }

  // muzzle position in the world (right hand side, slightly low)
  muzzlePos(forward = 0.7) {
    const { dir, right, up } = this.basis();
    return this.eye().addScaledVector(dir, forward).addScaledVector(right, 0.22).addScaledVector(up, -0.2);
  }

  fireProjectile(w) {
    const { dir } = this.basis(), eye = this.eye(), S = w.shot;
    const aim = this.hitscan(eye, dir, 70);
    const target = eye.clone().addScaledVector(dir, aim.t);
    const o = this.muzzlePos(S.type === 'bfg' ? 2.2 : 0.9);
    const d = target.sub(o).normalize();
    let obj;
    if (S.type === 'grenade') obj = new THREE.Mesh(this.grenadeGeo, this.grenadeMat);
    else { obj = new THREE.Sprite(this.shotMats[S.type]); obj.scale.setScalar(S.type === 'bfg' ? 1.8 : S.type === 'plasma' ? 0.55 : S.type === 'frost' ? 0.7 : 0.8); }
    obj.position.copy(o); this.scene.add(obj);
    this.pshots.push({ S, obj, x: o.x, y: o.y, z: o.z, vx: d.x * S.speed, vy: d.y * S.speed + (S.type === 'grenade' ? 3 : 0), vz: d.z * S.speed, life: S.fuse || 5, bounces: 0 });
  }

  fireFlame(w) {
    const { dir, right, up } = this.basis(), eye = this.eye();
    const o = this.muzzlePos(0.9);
    this.flash(o.x + dir.x * 2, o.y + dir.y * 2, o.z + dir.z * 2, 0xff8a30, 120, 0.12);
    const wall = this.hitscan(eye, dir, w.range).t;
    const reach = Math.min(w.range, wall);
    for (let i = 0; i < 3; i++) {
      const d = dir.clone().addScaledVector(right, (Math.random() - 0.5) * 0.18).addScaledVector(up, (Math.random() - 0.5) * 0.14);
      const sp = 9 + Math.random() * 5;
      this.emit(o.x, o.y, o.z, Math.random() < 0.5 ? 'flameY' : 'flameR', d.x * sp, d.y * sp + 0.6, d.z * sp, Math.min(0.55, reach / sp + 0.05), 0.2 + Math.random() * 0.2, -1.5);
    }
    for (const p of this.props) { if (!p.dead && p.explosive) { const dx = p.x - eye.x, dz = p.z - eye.z, d = Math.hypot(dx, dz); if (d < reach + 0.5 && (dx * dir.x + dz * dir.z) / (d || 1) > 0.9) this.damageProp(p, 1.4); } }
    for (const e of this.enemies) {
      if (!ALIVE.has(e.state) || e.state === 'spawn') continue;
      const dx = e.x - eye.x, dz = e.z - eye.z, dy = hitH(e) / 2 + e.y - eye.y, d = Math.hypot(dx, dz);
      if (d > reach + 0.5) continue;
      if ((dx * dir.x + dy * dir.y + dz * dir.z) / Math.hypot(dx, dy, dz) < 0.93) continue;
      if (e.frozen > 0) this.thaw(e, false);
      this.damageEnemy(e, w.damage, new THREE.Vector3(e.x, 1.2 + e.y, e.z), true);
      e.burn = 2.5;
    }
  }

  fireRail(w) {
    const { dir, right, up } = this.basis(), eye = this.eye();
    const wall = this.hitscan(eye, dir, this.level.range).t;
    const hits = [];
    for (const e of this.enemies) {
      if (!ALIVE.has(e.state) || e.state === 'spawn') continue;
      const t = rayCyl(eye, dir, e.x, e.z, hitR(e) + 0.1, e.y, e.y + hitH(e) + 0.1);
      if (t < wall) hits.push([t, e]);
    }
    for (const [t, e] of hits) this.damageEnemy(e, w.damage, eye.clone().addScaledVector(dir, t));
    const a = eye.clone().addScaledVector(dir, 0.6).addScaledVector(right, 0.2).addScaledVector(up, -0.16);
    const end = eye.clone().addScaledVector(dir, Math.min(wall, 200));
    const len = a.distanceTo(end);
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1, 8), this.beamMat.clone());
    mesh.position.copy(a).lerp(end, 0.5); mesh.scale.y = len;
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), end.clone().sub(a).normalize());
    this.scene.add(mesh);
    this.fx.push({ obj: mesh, t: 0.4, dur: 0.4, kind: 'beam' });
    for (let i = 0; i < 14; i++) { const q = a.clone().lerp(end, Math.random()); this.emit(q.x, q.y, q.z, 'blue', (Math.random() - 0.5) * 2, Math.random() * 2, (Math.random() - 0.5) * 2, 0.4, 0.08, 0); }
    if (wall < 200) { this.burst(end.x, end.y, end.z, 'blue', 8, 4, 0.12); this.sparks(end.x, end.y, end.z, 14, 7, 0, 0.4, 0); const h = this.hitscan(eye, dir, 200); if (h.n && !h.invisible) this.decals.add('scorch', end, h.n, 1.3); }
    this.flash(a.x + dir.x * 3, a.y + dir.y * 3, a.z + dir.z * 3, 0x7ad0ff, 90, 0.18);
  }

  explode(x, y, z, R, dmg, tint = 'boom', wall = null) {
    sfx.explosion();
    const s = new THREE.Sprite(this.shotMats[tint].clone());
    s.position.set(x, y + 0.3, z); s.scale.setScalar(R * 0.5); this.scene.add(s);
    this.fx.push({ obj: s, t: 0.45, dur: 0.45, kind: 'boom', size: R * 2.2 });
    const kind = tint === 'boomGreen' ? 'plasma' : tint === 'boomBlue' ? 'blue' : 'fire';
    this.burst(x, y + 0.4, z, kind, 14, R * 1.6, 0.12);
    this.sparks(x, y + 0.4, z, tint === 'boom' ? 22 : 10, R * 2.2, 0, 0.6, 0);
    if (tint === 'boom') for (let i = 0; i < 12; i++) this.emit(x + (Math.random() - 0.5), y + 0.4, z + (Math.random() - 0.5), 'smoke', (Math.random() - 0.5) * R, 1 + Math.random() * 2, (Math.random() - 0.5) * R, 1.4 + Math.random() * 0.7, 1.0 + Math.random() * 0.7, -0.5);
    this.flash(x, y + 0.6, z, tint === 'boomBlue' ? 0x70b8ff : tint === 'boomGreen' ? 0x70ff90 : 0xffa040, tint === 'boomBlue' ? 110 : 300, 0.45);
    // scorch marks on the ground and on the wall that was hit
    if (y < R * 1.2) this.decals.add('scorch', { x, y: 0, z }, { x: 0, y: 1, z: 0 }, Math.min(8, R * 1.7));
    if (wall && !wall.invisible) this.decals.add('scorch', wall.pt, wall.n, Math.min(6, R * 1.3));
    this.p.kick += Math.max(0, 0.06 * (1 - Math.hypot(x - this.p.x, z - this.p.z) / (R * 5)));
    for (const e of this.enemies) {
      if (!ALIVE.has(e.state) && (e.state === 'dying' || e.state === 'dead')) {   // corpses get flung about
        const dc = Math.hypot(e.x - x, e.z - z);
        if (dc < R + 1.8) { const f = 1 - dc / (R + 1.8); this.knock(e, e.x - x, e.z - z, 5 + 13 * f); e.cvy = 4 + 8 * f; e.spin = (Math.random() < 0.5 ? -1 : 1) * (6 + 10 * f); }
        continue;
      }
      if (!ALIVE.has(e.state) || e.state === 'spawn') continue;
      const d = Math.hypot(e.x - x, (hitH(e) / 2 + e.y - y) * 0.6, e.z - z), RR = R + 0.6 + (e.cfg.hitR ? e.cfg.hitR - 0.6 : 0);
      if (d > RR) continue;
      const f = 1 - d / RR;
      this.damageEnemy(e, dmg * (0.3 + 0.7 * f), new THREE.Vector3(e.x, hitH(e) / 2 + e.y, e.z), false, null, { x, z });
      this.knock(e, e.x - x, e.z - z, tint === 'boomBlue' ? 4 * f : 16 * f + 4);
    }
    this.blastProps(x, y, z, R, dmg);
    this.shatterWindowsNear({ x, y, z }, R * 1.5);
    const dp = Math.hypot(this.p.x - x, this.p.y + 1 - y, this.p.z - z);
    if (dp < R && tint !== 'boomBlue') this.hurt(Math.min(35, dmg * 0.25 * (1 - dp / R)));
  }

  // which face of a collider is (x,z) closest to? (for putting a scorch on the wall a rocket hit)
  wallHit(x, y, z) {
    let best = null, bd = 1.2;
    for (const b of this.boxes) {
      if (y > b.h + 0.5 || x < b.x0 - 1.2 || x > b.x1 + 1.2 || z < b.z0 - 1.2 || z > b.z1 + 1.2) continue;
      for (const [d, nx, nz, px, pz] of [[Math.abs(x - b.x0), -1, 0, b.x0, z], [Math.abs(x - b.x1), 1, 0, b.x1, z], [Math.abs(z - b.z0), 0, -1, x, b.z0], [Math.abs(z - b.z1), 0, 1, x, b.z1]]) {
        if (d < bd && (nx ? z >= b.z0 - 0.5 && z <= b.z1 + 0.5 : x >= b.x0 - 0.5 && x <= b.x1 + 0.5)) { bd = d; best = { pt: { x: px, y, z: pz }, n: { x: nx, y: 0, z: nz }, invisible: b.vis === false }; }
      }
    }
    return best;
  }

  // ---- freezing ----
  freezeEnemy(e, secs) {
    if (!ALIVE.has(e.state) || e.state === 'spawn') return;
    if (e.cfg.boss) secs = Math.min(secs, 3.5);   // the Tsar shrugs it off quickly
    if (!(e.frozen > 0)) { this.burst(e.x, e.y + 1.2, e.z, 'blue', 10, 3, 0.14); for (let k = 0; k < 6; k++) this.debris.spawn('glass', e.x + (Math.random() - 0.5) * 0.8, e.y + 0.4 + Math.random() * 1.6, e.z + (Math.random() - 0.5) * 0.8, (Math.random() - 0.5) * 3, 1 + Math.random() * 2, (Math.random() - 0.5) * 3, 0.8); }
    e.frozen = secs; e.burn = 0; e.kx = e.kz = 0;
    if (e.state === 'attack' || e.state === 'pain') e.state = 'move';
    sfx.freeze();
  }
  thaw(e, natural) {
    e.frozen = 0; e.mesh.material.color.setHex(0xffffff);
    if (natural) { this.burst(e.x, e.y + 1.0, e.z, 'smoke', 6, 2, 0.2); sfx.tink(3); }
  }
  // frost bolt hit something: freeze every lizard in the small cloud
  frostBurst(x, y, z, R, S) {
    sfx.freeze();
    const sp = new THREE.Sprite(this.shotMats.boomBlue.clone()); sp.position.set(x, y + 0.3, z); sp.scale.setScalar(R * 0.5); this.scene.add(sp);
    this.fx.push({ obj: sp, t: 0.4, dur: 0.4, kind: 'boom', size: R * 1.8 });
    this.burst(x, y + 0.3, z, 'blue', 14, R * 1.8, 0.12);
    for (let k = 0; k < 8; k++) this.debris.spawn('glass', x + (Math.random() - 0.5), y + 0.3, z + (Math.random() - 0.5), (Math.random() - 0.5) * 6, 2 + Math.random() * 4, (Math.random() - 0.5) * 6, 0.7);
    this.flash(x, y + 0.6, z, 0xa8e4ff, 120, 0.4);
    for (const e of this.enemies) {
      if (!ALIVE.has(e.state) || e.state === 'spawn') continue;
      if (Math.hypot(e.x - x, (1.2 + e.y - y) * 0.7, e.z - z) > R + 0.6) continue;
      this.damageEnemy(e, S.damage, new THREE.Vector3(e.x, 1.2 + e.y, e.z), true);
      if (ALIVE.has(e.state)) this.freezeEnemy(e, S.freeze);
    }
    this.hitProps({ x, y, z }, 0);
  }

  // knock a lizard back (it slides and decays)
  knock(e, dx, dz, power) {
    if (e.frozen > 0) return;   // frozen solid: nothing moves them
    if (e.cfg.boss) power *= 0.1;
    const l = Math.hypot(dx, dz) || 1;
    e.kx = (e.kx || 0) + (dx / l) * power; e.kz = (e.kz || 0) + (dz / l) * power;
  }

  updatePShots(dt) {
    const p = this.p;
    for (let i = this.pshots.length - 1; i >= 0; i--) {
      const q = this.pshots[i], S = q.S;
      q.life -= dt;
      if (S.type === 'grenade') q.vy -= S.gravity * dt;
      const nx = q.x + q.vx * dt, ny = q.y + q.vy * dt, nz = q.z + q.vz * dt;
      let hitWall = false;
      const inBox = (x, y, z) => this.boxes.some((b) => x > b.x0 && x < b.x1 && z > b.z0 && z < b.z1 && y < b.h);
      if (S.type === 'grenade') {
        if (inBox(nx, q.y, q.z)) { q.vx *= -S.bounce; q.bounces++; } else q.x = nx;
        if (inBox(q.x, q.y, nz)) { q.vz *= -S.bounce; q.bounces++; } else q.z = nz;
        if (ny < 0.13) { q.y = 0.13; q.vy = Math.abs(q.vy) * S.bounce; q.vx *= 0.75; q.vz *= 0.75; if (Math.abs(q.vy) < 1.2) q.vy = 0; } else q.y = ny;
      } else {
        if (inBox(nx, ny, nz) || ny < 0.05) hitWall = true; else { q.x = nx; q.y = ny; q.z = nz; }
      }
      q.obj.position.set(q.x, q.y, q.z);
      // trails
      if (S.type === 'rocket') this.emit(q.x - q.vx * 0.02, q.y, q.z - q.vz * 0.02, Math.random() < 0.5 ? 'smoke' : 'flameY', 0, 0.5, 0, 0.5, 0.18, -0.5);
      else if (S.type === 'bfg') this.emit(q.x, q.y, q.z, 'plasma', (Math.random() - 0.5) * 3, (Math.random() - 0.5) * 3, (Math.random() - 0.5) * 3, 0.35, 0.18, 0);
      else if (S.type === 'plasma') this.emit(q.x, q.y, q.z, 'blue', 0, 0, 0, 0.15, 0.07, 0);
      else if (S.type === 'frost') { this.emit(q.x, q.y, q.z, 'blue', (Math.random() - 0.5) * 1.5, (Math.random() - 0.5) * 1.5, (Math.random() - 0.5) * 1.5, 0.35, 0.1, 0); }
      let boom = hitWall || q.life <= 0;
      if (!boom) for (const e of this.enemies) {
        if (!ALIVE.has(e.state) || e.state === 'spawn') continue;
        if (Math.hypot(q.x - e.x, q.z - e.z) < hitR(e) + 0.15 && q.y > e.y && q.y < e.y + hitH(e) + 0.2) { boom = true; break; }
      }
      // glow around fast shots
      if (S.type !== 'grenade') {
        if (!q.dl) { q.dl = this.acquireLight(); if (q.dl) { q.dl.owner = q; q.dl.l.color.set(S.type === 'plasma' || S.type === 'frost' ? 0x60b0ff : S.type === 'bfg' ? 0x60ff80 : 0xff9a30); q.dl.l.intensity = S.type === 'bfg' ? 260 : S.type === 'plasma' ? 70 : 150; } }
        if (q.dl) q.dl.l.position.set(q.x, q.y, q.z);
      }
      if (boom) {
        if (q.dl) { q.dl.owner = null; q.dl.t = 0; q.dl.l.intensity = 0; }
        const wall = S.type === 'grenade' ? null : this.wallHit(q.x, q.y, q.z);
        if (S.type === 'frost') this.frostBurst(q.x, q.y, q.z, S.radius, S); else this.explode(q.x, q.y, q.z, S.radius, S.damage, S.type === 'plasma' ? 'boomBlue' : S.type === 'bfg' ? 'boomGreen' : 'boom', wall);
        this.scene.remove(q.obj); this.pshots.splice(i, 1);
      }
    }
    void p;
  }

  updateFx(dt) {
    for (let i = this.fx.length - 1; i >= 0; i--) {
      const f = this.fx[i];
      f.t -= dt;
      const u = Math.max(0, f.t / f.dur);
      if (f.kind === 'boom') { f.obj.scale.setScalar(f.size * (1 - u * u) + 0.1); f.obj.material.opacity = Math.min(1, u * 1.6); }
      else if (f.kind === 'beam') { f.obj.material.opacity = u; f.obj.scale.x = f.obj.scale.z = 0.3 + u; }
      if (f.t <= 0) { this.scene.remove(f.obj); if (f.obj.material) f.obj.material.dispose(); this.fx.splice(i, 1); }
    }
  }

  meleeHit() {
    const p = this.p, w = WEAPONS[0];
    const fx = -Math.sin(p.yaw), fz = -Math.cos(p.yaw);
    let hit = false;
    for (const e of this.enemies) {
      if (!ALIVE.has(e.state) || e.state === 'spawn') continue;
      const dx = e.x - p.x, dz = e.z - p.z, d = Math.hypot(dx, dz);
      if (d > w.range + 0.5 + e.cfg.radius || e.y > 2.0) continue;
      if ((dx * fx + dz * fz) / (d || 1) < 0.45) continue;
      this.damageEnemy(e, w.damage, new THREE.Vector3(e.x, 1.3, e.z)); hit = true;
    }
    if (hit) this.p.kick += 0.03;
  }

  hitscan(o, d, range, corpses = false) {
    let best = { t: range, enemy: null, n: null, ground: false, invisible: false };
    for (const b of this.boxes) { const h = rayBoxN(o, d, b); if (h && h.t < best.t) best = { t: h.t, enemy: null, n: { x: h.nx, y: h.ny, z: h.nz }, ground: false, invisible: b.vis === false }; }
    if (d.y < -1e-4) { const tg = -o.y / d.y; if (tg > 0 && tg < best.t) best = { t: tg, enemy: null, n: { x: 0, y: 1, z: 0 }, ground: true, invisible: false }; }
    for (const e of this.enemies) {
      if (!ALIVE.has(e.state) || e.state === 'spawn') continue;
      const t = rayCyl(o, d, e.x, e.z, hitR(e), e.y, e.y + hitH(e));
      if (t < best.t) best = { t, enemy: e, n: null, ground: false, invisible: false };
    }
    if (corpses) for (const e of this.enemies) {
      if (e.state !== 'dying' && e.state !== 'dead') continue;
      const t = rayCyl(o, d, e.x, e.z, 0.9, 0, 0.9 + (e.cy || 0));
      if (t < best.t) best = { t, enemy: null, corpse: e, n: null, ground: false, invisible: false };
    }
    return best;
  }

  hurt(dmg) {
    const p = this.p;
    if (this.state !== 'playing') return;
    p.health -= dmg; p.hurt = 0.35; p.roll = (Math.random() - 0.5) * 0.12; p.kick += 0.02;
    sfx.hurt();
    if (p.health <= 0) { p.health = 0; this.setState('dead'); }
  }

  // ---------------- enemies ----------------
  spawnEnemy(type) {
    const cfg = ENEMY[type], p = this.p;
    this.ensureAtlas([type]);
    let sp, perch = null;
    if (cfg.perch && this.level.perches && this.level.perches.length) {   // gargoyles sit on rooftop ledges
      const free = this.level.perches.filter((q) => !this.enemies.some((o) => o.state === 'perch' && Math.hypot(o.x - q.x, o.z - q.z) < 1));
      const pool = free.length ? free : this.level.perches;
      perch = pool[(Math.random() * pool.length) | 0]; sp = perch;
    } else {
      const [rMin, rMax] = this.level.spawnRange;
      const pts = this.level.spawnPoints.filter((s) => Math.hypot(s.x - p.x, s.z - p.z) > rMin && Math.hypot(s.x - p.x, s.z - p.z) < rMax);
      const pool = pts.length ? pts : this.level.spawnPoints;
      sp = pool[(Math.random() * pool.length) | 0];
    }
    const mat = new THREE.MeshBasicMaterial({ map: this.atlas[type].texture, transparent: true, alphaTest: 0.5, side: THREE.DoubleSide });
    const geo = new THREE.PlaneGeometry(SPRITE_SIZE, SPRITE_SIZE);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.visible = !!perch;
    mesh.position.set(sp.x, perch ? perch.y : 0, sp.z);
    this.scene.add(mesh);
    const shadow = new THREE.Mesh(this.shadowGeo, this.shadowMat);
    shadow.position.set(sp.x, 0.04, sp.z); shadow.visible = false; shadow.scale.setScalar(cfg.scale || 1); this.scene.add(shadow);
    const beam = new THREE.Mesh(this.beamGeo, new THREE.MeshBasicMaterial({ color: 0x8dff9d, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
    beam.position.set(sp.x, 9, sp.z); if (!perch) this.scene.add(beam);
    const e = { type, cfg, mesh, shadow, beam, hp: cfg.hp, maxHp: cfg.hp, x: sp.x, y: perch ? perch.y : 0, flip: Math.random() < 0.5 ? -1 : 1, z: sp.z, state: perch ? 'perch' : 'spawn', perchT: 0, timer: 0.9, cool: 0.6 + Math.random() * 0.8, stompCd: 5, anim: 0, deadT: 0, hit: false, uv: geo.attributes.uv, frameKey: -1, face: Math.atan2(p.x - sp.x, p.z - sp.z), want: Math.atan2(p.x - sp.x, p.z - sp.z), slide: 0, slideT: 0, stuck: 0, strafe: Math.random() < 0.5 ? 1 : -1, strafeT: 1 + Math.random() * 2, cy: 0, cvy: 0, tumble: 0, spin: 0, fall: 0 };
    this.styleEnemy(e);
    this.enemies.push(e);
    if (cfg.boss) { this.setMessage('THE GREAT LIZARD TSAR! — HIT HIM IN THE BACK', 5); sfx.roar(); }
    else if (!perch) sfx.beam();
    return e;
  }
  disposeEnemy(e) {
    this.scene.remove(e.mesh, e.shadow, e.beam);
    e.mesh.geometry.dispose(); e.mesh.material.dispose(); e.beam.material.dispose();
  }
  aliveCount() { let n = 0; for (const e of this.enemies) if (ALIVE.has(e.state)) n++; return n; }

  // src = where the hit came from (default: you); used for shields and the boss's weak back. Fire/burn damage passes null.
  damageEnemy(e, dmg, pt, quiet = false, dir = null, src) {
    if (!ALIVE.has(e.state) || e.state === 'spawn') return;
    const cfg = e.cfg;
    if (src === undefined) src = quiet ? null : { x: this.p.x, z: this.p.z };
    let blocked = false, crit = false;
    if (src && !(e.frozen > 0)) {
      const vx = src.x - e.x, vz = src.z - e.z, c = (Math.sin(e.face) * vx + Math.cos(e.face) * vz) / (Math.hypot(vx, vz) || 1);
      if (cfg.shield && c > 0.38) { dmg *= 0.05; blocked = true; }
      else if (cfg.boss) { if (c > 0.3) { dmg *= 0.1; blocked = true; } else if (c < -0.3) { dmg *= 1.9; crit = true; } else dmg *= 0.5; }
    }
    if (e.frozen > 0) dmg *= 1.3;                                   // frozen lizards are brittle (and a frozen shield lizard has no shield)
    e.hp -= dmg;
    if (blocked) {
      sfx.tink(4); this.sparks(pt.x, pt.y, pt.z, 6, 5, 0, 0.4, 0);
      if (this.time > (this.armourMsgT || 0)) { this.armourMsgT = this.time + 4; this.setMessage(cfg.boss ? 'ARMOURED FRONT — GO AROUND TO HIS BACK' : 'SHIELD — GET BEHIND IT OR FREEZE IT', 2.5); }
    }
    if (crit && this.time > (this.critMsgT || 0)) { this.critMsgT = this.time + 3; this.setMessage('WEAK SPOT!', 1.2); }
    if (dir && !blocked && !cfg.boss) this.knock(e, dir.x, dir.z, Math.min(5, dmg * 0.09));
    if (!quiet && !blocked && Math.random() < 0.55) this.decals.add('blood', { x: e.x + (Math.random() - 0.5) * 1.4, y: 0, z: e.z + (Math.random() - 0.5) * 1.4 }, { x: 0, y: 1, z: 0 }, 0.45 + Math.random() * 0.6);
    if (!blocked) this.burst(pt.x, pt.y, pt.z, quiet ? 'fire' : crit ? 'fire' : 'green', quiet ? 2 : 5, 3.2, 0.12);
    if (!quiet && !blocked) sfx.hit();
    if (e.state === 'perch') this.wakeGargoyle(e);
    if (e.hp <= 0) this.killEnemy(e);
    else if (!quiet && !blocked && !cfg.boss && e.state !== 'attack' && e.state !== 'dive' && (Math.random() < 0.45 || dmg >= 40)) { e.state = 'pain'; e.timer = 0.28; sfx.lizardPain(); }
  }
  wakeGargoyle(e) {
    const far = Math.hypot(this.p.x - e.x, this.p.z - e.z) > 40;
    e.state = far ? 'move' : 'dive'; e.diveT = 0; e.cool = 0; e.mesh.material.color.setHex(0xffffff); sfx.hiss(); this.setMessage('THE STATUES MOVE!', 2);
  }
  killEnemy(e) {
    const wasIced = e.frozen > 0;
    e.state = 'dying'; e.deadT = 0; this.stats.kills++; sfx.lizardDie();
    if (wasIced) { sfx.glass(); for (let k = 0; k < 14; k++) this.debris.spawn('glass', e.x + (Math.random() - 0.5), e.y + 0.3 + Math.random() * 1.8, e.z + (Math.random() - 0.5), (Math.random() - 0.5) * 7, 2 + Math.random() * 4, (Math.random() - 0.5) * 7, 1); this.burst(e.x, e.y + 1.2, e.z, 'blue', 12, 4, 0.14); }
    this.decals.add('blood', { x: e.x, y: 0, z: e.z }, { x: 0, y: 1, z: 0 }, 1.7 + Math.random() * 0.8);
    for (let k = 0; k < 3; k++) this.decals.add('blood', { x: e.x + (Math.random() - 0.5) * 2.6, y: 0, z: e.z + (Math.random() - 0.5) * 2.6 }, { x: 0, y: 1, z: 0 }, 0.5 + Math.random() * 0.7);
    this.burst(e.x, 1.2 + e.y, e.z, 'green', 14, 4.5, 0.16);
    e.shadow.visible = false;
    e.cvy = e.cfg.boss ? 0 : 2.8 + Math.random() * 1.5; e.spin = (Math.random() < 0.5 ? -1 : 1) * (4 + Math.random() * 4);
    if (e.cfg.boss) { this.setMessage('THE TSAR FALLS!', 4); sfx.explosion(); this.flash(e.x, 3, e.z, 0xffd060, 400, 0.8); for (let k = 0; k < 7; k++) this.addPickup(['kvass', 'powder', 'shot', 'rockets', 'cells'][k % 5], e.x, e.z, true); }
    else if (Math.random() < 0.4) {
      const r = Math.random();
      this.addPickup(r < 0.25 ? 'kvass' : r < 0.7 ? 'powder' : 'shot', e.x, e.z, true);
    }
    // keep corpse count bounded
    const dead = this.enemies.filter((x) => x.state === 'dying' || x.state === 'dead');
    while (dead.length > 14) { const old = dead.shift(); this.disposeEnemy(old); this.enemies.splice(this.enemies.indexOf(old), 1); }
  }

  hasLOS(ax, ay, az, bx, by, bz) {
    const d = new THREE.Vector3(bx - ax, by - ay, bz - az); const len = d.length(); d.normalize();
    const o = { x: ax, y: ay, z: az };
    for (const b of this.boxes) if (rayBox(o, d, b) < len) return false;
    return true;
  }

  updateEnemies(dt) {
    const p = this.p, cam = this.camera.position;
    if (this.nav) this.nav.update(p.x, p.z, dt);
    for (const e of this.enemies) {
      const cfg = e.cfg, dx = p.x - e.x, dz = p.z - e.z, dist = Math.hypot(dx, dz) || 1;
      let nx = dx / dist, nz = dz / dist;
      const alive = ALIVE.has(e.state);
      e.cool -= dt;
      if (e.state !== 'move' && e.state !== 'perch' && e.state !== 'dive') e.want = Math.atan2(nx, nz);
      let iced = false;
      if (e.frozen > 0) {
        if (alive && e.state !== 'spawn') { iced = true; e.frozen -= dt; if (e.frozen <= 0) this.thaw(e, true); }
        else this.thaw(e, false);
      }
      // knockback (and corpses sliding / bouncing off props)
      if ((e.kx || e.kz) && e.state !== 'spawn') {
        const tx = e.x + e.kx * dt, tz = e.z + e.kz * dt, kp = { x: tx, z: tz, y: e.y + (e.cy || 0) };
        resolveCircle(kp, alive ? cfg.radius : Math.min(cfg.radius, 0.7), this.boxes);
        if (!alive) { if (Math.abs(kp.x - tx) > 1e-4) e.kx *= -0.45; if (Math.abs(kp.z - tz) > 1e-4) e.kz *= -0.45; }
        e.x = kp.x; e.z = kp.z;
        const air = (e.cy || 0) > 0.02, kf = Math.exp(-(alive ? 5 : air ? 0.9 : 3.2) * dt);
        e.kx *= kf; e.kz *= kf; if (Math.abs(e.kx) + Math.abs(e.kz) < 0.05) e.kx = e.kz = 0;
      }
      // corpse hop / tumble
      if (!alive && (e.cvy || e.cy > 0)) {
        e.cvy -= 24 * dt; e.cy += e.cvy * dt; e.tumble += (e.spin || 0) * dt;
        if (e.cy <= 0) {
          e.cy = 0;
          if (Math.abs(e.cvy) > 2.2) { e.cvy = -e.cvy * 0.38; e.spin *= 0.5; sfx.tink(1); } else { e.cvy = 0; e.spin = 0; e.tumble = 0; }
        }
      }
      if (e.burn > 0 && alive && e.state !== 'spawn' && !iced) {
        e.burn -= dt; e.burnT = (e.burnT || 0) + dt;
        if (Math.random() < dt * 14) this.emit(e.x + (Math.random() - 0.5) * 0.6, e.y + 0.8 + Math.random() * 1.4, e.z + (Math.random() - 0.5) * 0.6, Math.random() < 0.5 ? 'flameY' : 'flameR', 0, 1.8, 0, 0.4, 0.3, -2);
        if (e.burnT > 0.3) { e.burnT = 0; this.damageEnemy(e, 5, new THREE.Vector3(e.x, 1.2 + e.y, e.z), true); }
      }
      // flyers: rise off the ground and bob; drop out of the sky when killed or frozen
      // a flyer trapped inside a hall while you are outside: climb out through the roof
      let climbing = false;
      if (cfg.hover && alive && e.state !== 'perch' && this.level.interiors) {
        const inZ = (q, x, z) => x > q.x0 && x < q.x1 && z > q.z0 && z < q.z1;
        const z0 = this.level.interiors.find((q) => inZ(q, e.x, e.z));
        if (z0 && !inZ(z0, p.x, p.z) && e.y < z0.top + 1.5) { climbing = true; e.y += 9 * dt; e.fall = 0; e.climbTop = z0.top; if (e.state === 'dive') e.state = 'move'; }
      }
      if (cfg.hover && e.state !== 'perch') {
        if (!alive || iced) { e.fall = Math.min(30, (e.fall || 0) + 26 * dt); e.y = Math.max(0, e.y - e.fall * dt); }
        else if (!climbing) {
          e.fall = 0;
          if (e.state !== 'dive') { const tgt = (e.state === 'move' || e.state === 'attack' || e.state === 'pain') ? (e.rise > 0 ? 46 : cfg.hover + Math.sin(this.time * 2.2 + e.x) * 0.45) : 0; e.y += (tgt - e.y) * Math.min(1, dt * 1.6); }
        }
      }
      switch (iced ? 'iced' : e.state) {
        case 'iced':
          if (Math.random() < dt * 2.5) this.emit(e.x + (Math.random() - 0.5) * 0.8, e.y + 0.4 + Math.random() * 1.6, e.z + (Math.random() - 0.5) * 0.8, 'blue', 0, -0.3, 0, 0.5, 0.08, 0);
          break;
        case 'spawn':
          e.timer -= dt;
          e.beam.material.opacity = Math.max(0, Math.min(0.55, e.timer * 1.2 + (0.9 - e.timer) * 0.2));
          if (e.timer <= 0.35 && !e.mesh.visible) { e.mesh.visible = true; e.shadow.visible = true; this.burst(e.x, 0.5, e.z, 'plasma', 12, 4, 0.14); }
          if (e.timer <= 0) { e.state = 'move'; this.scene.remove(e.beam); if (cfg.hover) sfx.hiss(); }
          break;
        case 'perch':   // a statue until you come near (or hurt it)
          e.perchT += dt;
          if (dist < 32 || e.perchT > 30) this.wakeGargoyle(e);
          break;
        case 'dive': {  // swoop straight at the player (gives up after a few seconds and flies like the others)
          e.diveT = (e.diveT || 0) + dt; if (e.diveT > 4) { e.state = 'move'; e.cool = 0.5; break; }
          const vx = p.x - e.x, vy = p.y + 0.4 - e.y, vz = p.z - e.z, l = Math.hypot(vx, vy, vz) || 1;
          if (l < 2.1) { this.hurt(cfg.melee); sfx.hiss(); e.state = 'move'; e.cool = 1.4; break; }
          const pos = { x: e.x + (vx / l) * 17 * dt, z: e.z + (vz / l) * 17 * dt, y: e.y };
          resolveCircle(pos, cfg.radius, this.boxes);
          e.x = pos.x; e.z = pos.z; e.y = Math.max(0.3, e.y + (vy / l) * 17 * dt);
          e.face = e.want = Math.atan2(vx, vz); e.anim += dt * 12;
          if (Math.random() < dt * 20) this.emit(e.x, e.y + 1, e.z, 'smoke', 0, 0, 0, 0.5, 0.25, 0);
          break;
        }
        case 'move': {
          let mx = 0, mz = 0, speed = cfg.speed;
          if (this.nav && dist > 3) { // no line of sight: follow the street grid around the buildings
            e.losT = (e.losT || 0) - dt;
            if (e.losT <= 0) { e.losT = 0.25 + Math.random() * 0.15; e.los = this.hasLOS(e.x, e.y + 1.4, e.z, p.x, p.y + 1.4, p.z); }
            // stuck for a while (e.g. hugging a wall near a door the line of sight slips through)? follow the street grid regardless
            e.progT = (e.progT || 0) + dt;
            if (e.progT > 1.5) { e.progT = 0; if (e.px !== undefined && Math.hypot(e.x - e.px, e.z - e.pz) < 0.6 && dist > 4) { if (cfg.hover) e.rise = 7; else e.forcePath = 3; } e.px = e.x; e.pz = e.z; }
            if (e.forcePath > 0) e.forcePath -= dt;
            if (e.rise > 0) e.rise -= dt;
            if (e.rise > 0) e.pathing = false;   // flyers that got boxed in climb high and fly straight over the buildings
            else if (!e.los || e.forcePath > 0) { const nd = this.nav.dir(e.x, e.z); if (nd) { nx = nd.x; nz = nd.z; e.pathing = true; } else e.pathing = false; } else e.pathing = false;
          } else e.pathing = false;
          const faceErr = Math.abs(angDiff(Math.atan2(nx, nz), e.face));
          const flyer = !!cfg.hover, dy = Math.abs((e.y + 1) - (p.y + 1));
          if (e.pathing) {
            mx = nx; mz = nz;
          } else if (cfg.ai === 'melee') {
            mx = nx; mz = nz;
            if (cfg.boss) {
              e.stompCd -= dt;
              if (e.stompCd <= 0 && dist < 22 && dist > 5.5 && faceErr < 1.2) { e.state = 'attack'; e.atk = 'stomp'; e.timer = 1.1; e.hitAt = 0.25; e.hit = false; e.stompCd = 6 + Math.random() * 3; sfx.roar(); }
            }
            if (e.state === 'move' && dist < cfg.reach && e.cool <= 0 && faceErr < 0.7 && (!flyer || dy < 2.6)) { e.state = 'attack'; e.atk = 'melee'; e.timer = cfg.boss ? 0.95 : 0.55; e.hitAt = 0.25; e.hit = false; sfx.hiss(); }
          } else {
            e.strafeT -= dt; if (e.strafeT <= 0) { e.strafe *= -1; e.strafeT = 1 + Math.random() * 2; }
            const far = cfg.ai === 'bomber' ? 15 : flyer ? 24 : 15, near = cfg.ai === 'bomber' ? 9 : flyer ? 13 : 8;
            if (dist > far) { mx = nx; mz = nz; } else if (dist < near) { mx = -nx; mz = -nz; speed *= 0.8; } else { mx = -nz * e.strafe; mz = nx * e.strafe; speed *= 0.6; }
            if (cfg.ai === 'bomber') {
              if (e.cool <= 0 && dist < 17) { e.state = 'attack'; e.atk = 'drop'; e.timer = 0.6; e.hitAt = 0.25; e.hit = false; }
            } else if (e.cool <= 0 && dist < (flyer ? 48 : 36) && this.hasLOS(e.x, e.y + 1.5, e.z, p.x, p.y + 1.4, p.z) && faceErr < 0.5) { e.state = 'attack'; e.atk = 'shoot'; e.timer = 0.5; e.hitAt = 0.2; e.hit = false; sfx.hiss(); }
          }
          if (e.slideT > 0) { // steer around props we got stuck on
            e.slideT -= dt;
            const tx = -mz * e.slide, tz = mx * e.slide;
            mx = mx * 0.25 + tx; mz = mz * 0.25 + tz;
            const l = Math.hypot(mx, mz) || 1; mx /= l; mz /= l;
          }
          const steer = cfg.ai === 'melee';
          e.want = steer && (mx || mz) ? Math.atan2(mx, mz) : Math.atan2(nx, nz);
          // slow turning: they only move at full speed while facing where they are going (melee lizards steer along their facing)
          const wantA = Math.atan2(mx, mz), turnErr = Math.abs(angDiff(wantA, e.face));
          if (!(e.slideT > 0)) {   // (when sliding off an obstacle just move, don't wait to turn)
            speed *= Math.max(0.18, Math.cos(Math.min(turnErr, 1.4)));
            if (steer || e.pathing) { mx = Math.sin(e.face); mz = Math.cos(e.face); }
          }
          if (climbing && e.y < e.climbTop - 0.3) speed = 0;   // straight up until clear of the walls, then out over the roof
          const pos = { x: e.x + mx * speed * dt, z: e.z + mz * speed * dt, y: e.y };
          for (const o of this.enemies) {
            if (o === e || !ALIVE.has(o.state) || o.state === 'perch') continue;
            const rr = cfg.radius + o.cfg.radius, ox = pos.x - o.x, oz = pos.z - o.z, od = Math.hypot(ox, oz);
            if (od < rr && od > 0.001) { pos.x += (ox / od) * (rr - od) * 0.5; pos.z += (oz / od) * (rr - od) * 0.5; }
          }
          const pr = 0.45 + cfg.radius, pd = Math.hypot(pos.x - p.x, pos.z - p.z);
          if (pd < pr && (!flyer || dy < 2.6)) { pos.x = p.x + ((pos.x - p.x) / (pd || 1)) * pr; pos.z = p.z + ((pos.z - p.z) / (pd || 1)) * pr; }
          resolveCircle(pos, cfg.radius, this.boxes);
          if (dist > 2.5 + cfg.radius && Math.hypot(pos.x - e.x, pos.z - e.z) < speed * dt * 0.35) {
            e.stuck += dt;
            if (e.stuck > 0.25) { e.slide = e.slide ? -e.slide : (Math.random() < 0.5 ? 1 : -1); e.slideT = 1.2; e.stuck = 0; }
          } else e.stuck = 0;
          e.x = pos.x; e.z = pos.z;
          const a0 = Math.floor(e.anim);
          e.anim += dt * (e.type === 'grunt' || e.type === 'shield' ? 9 : cfg.boss ? 4 : flyer ? 8 : 6);
          if (cfg.boss && Math.floor(e.anim) !== a0 && Math.floor(e.anim) % 2 === 0) { sfx.thud(); this.p.kick += 0.025 * Math.max(0, 1 - dist / 45); }
          break;
        }
        case 'attack':
          e.timer -= dt;
          if (!e.hit && e.timer < (e.hitAt || 0.25)) {
            e.hit = true;
            if (e.atk === 'melee') {
              const dy = Math.abs((e.y + 1) - (p.y + 1));
              if (dist < cfg.reach + 0.6 && Math.abs(angDiff(Math.atan2(nx, nz), e.face)) < 1.0 && (!cfg.hover || dy < 2.6)) this.hurt(cfg.melee);
              if (cfg.boss) { this.p.kick += 0.08; sfx.thud(); }
            } else if (e.atk === 'stomp') this.stomp(e);
            else if (e.atk === 'drop') this.dropEgg(e);
            else {
              const fire = cfg.shot === 'fire', sx = e.x, sy = e.y + 1.5, sz = e.z, spd = fire ? 17 : 14;
              const tx = p.x - sx, ty = p.y + 1.3 - sy, tz = p.z - sz, l = Math.hypot(tx, ty, tz) || 1;
              const sprite = new THREE.Sprite(fire ? this.fireballMat : this.plasmaMat); const sc = fire ? 2.0 : 1.1; sprite.scale.set(sc, sc, sc); sprite.position.set(sx, sy, sz);
              this.scene.add(sprite);
              this.projectiles.push({ sprite, x: sx, y: sy, z: sz, vx: (tx / l) * spd, vy: (ty / l) * spd, vz: (tz / l) * spd, life: 6, fire, dmg: fire ? 14 : 12 });
              if (fire) { this.flash(sx, sy, sz, 0xff8a30, 90, 0.2); sfx.fireball(); } else sfx.spit();
            }
          }
          if (e.timer <= 0) { e.state = 'move'; e.cool = cfg.ai === 'melee' ? (cfg.boss ? 1.4 : 0.8) : cfg.ai === 'bomber' ? 2.4 + Math.random() * 1.2 : cfg.hover ? 2.0 + Math.random() * 1.2 : 1.6 + Math.random(); }
          break;
        case 'pain':
          e.timer -= dt; if (e.timer <= 0) e.state = 'move';
          break;
        case 'dying':
          e.deadT += dt; if (e.deadT > 0.5) e.state = 'dead';
          break;
      }
      // visuals: pick the frame of the 3D-lizard sprite sheet that matches pose and viewing angle
      const m = e.mesh, nowAlive = ALIVE.has(e.state);
      m.position.set(e.x, e.y + (e.cy || 0), e.z);
      m.rotation.z = e.tumble || 0;
      if (nowAlive && e.state !== 'spawn') { e.shadow.visible = e.state !== 'perch' && e.y < 12; e.shadow.scale.setScalar((cfg.scale || 1) * Math.max(0.35, 1 - e.y / 14)); }
      e.shadow.position.set(e.x, 0.04, e.z);
      const toCam = Math.atan2(cam.x - e.x, cam.z - e.z);
      m.rotation.y = toCam;
      if (nowAlive && !iced && e.state !== 'perch' && e.state !== 'dive') { const dd = angDiff(e.want, e.face), mx = (TURN[e.type] || 3) * dt * (e.state === 'attack' ? 0.6 : 1); e.face += Math.max(-mx, Math.min(mx, dd)); }
      m.material.color.setHex(e.frozen > 0 && nowAlive ? 0x8fd2ff : e.state === 'perch' ? 0xb4b8c4 : 0xffffff);
      let pose = POSE.idle;
      if (e.state === 'move' || e.state === 'dive') pose = POSE.walk0 + (Math.floor(e.anim) % 4);
      else if (e.state === 'attack') pose = e.timer > (e.hitAt || 0.25) + 0.03 ? POSE.windup : POSE.strike;
      else if (e.state === 'pain') pose = POSE.pain;
      if (iced) pose = e.icePose || 0; else e.icePose = pose;
      if (e.state === 'dying' || e.state === 'dead') pose = POSE.die0 + (e.deadT < 0.09 ? 0 : e.deadT < 0.2 ? 1 : e.deadT < 0.32 ? 2 : e.deadT < 0.44 ? 3 : 4);
      if (e.pix) { // the original pixel sprites
        const T = this.liz[e.type]; let tx = T.idle;
        if (e.state === 'move') tx = [T.walk1, T.idle, T.walk2, T.idle][Math.floor(e.anim) % 4];
        else if (e.state === 'attack') tx = T.attack;
        else if (e.state === 'pain') tx = T.pain;
        else if (e.state === 'dying' || e.state === 'dead') { tx = T.dead[e.deadT < 0.1 ? 0 : e.deadT < 0.26 ? 1 : e.deadT < 0.45 ? 2 : 3]; m.scale.x = 1.5 * e.flip; }
        if (m.material.map !== tx) { m.material.map = tx; m.material.needsUpdate = true; }
        if (e.beam.parent) e.beam.position.set(e.x, 9, e.z);
        continue;
      }
      let dl = toCam - e.face; dl = Math.atan2(Math.sin(dl), Math.cos(dl));
      const ang = ((Math.round(-dl / (Math.PI * 2 / ANGLES)) % ANGLES) + ANGLES) % ANGLES, key = pose * ANGLES + ang;
      if (key !== e.frameKey) {
        e.frameKey = key;
        const [u0, v0, u1, v1] = frameUV(pose, ang), uv = e.uv;
        uv.setXY(0, u0, v1); uv.setXY(1, u1, v1); uv.setXY(2, u0, v0); uv.setXY(3, u1, v0); uv.needsUpdate = true;
      }
      if (e.beam.parent) e.beam.position.set(e.x, 9, e.z);
    }
  }

  // ---- boss stomp: a shockwave on the ground. Jump to avoid it. ----
  stomp(e) {
    const p = this.p, d = Math.hypot(p.x - e.x, p.z - e.z);
    sfx.explosion(); this.p.kick += 0.18;
    const sp = new THREE.Sprite(this.shotMats.boom.clone()); sp.position.set(e.x, 0.6, e.z); sp.scale.setScalar(3); this.scene.add(sp);
    this.fx.push({ obj: sp, t: 0.55, dur: 0.55, kind: 'boom', size: 22 });
    for (let k = 0; k < 22; k++) { const a = (k / 22) * Math.PI * 2; this.emit(e.x + Math.cos(a) * 2.5, 0.4, e.z + Math.sin(a) * 2.5, 'smoke', Math.cos(a) * 9, 1.2, Math.sin(a) * 9, 0.9, 1.0, -0.5); }
    this.decals.add('scorch', { x: e.x, y: 0, z: e.z }, { x: 0, y: 1, z: 0 }, 6);
    this.shatterWindowsNear({ x: e.x, y: 1, z: e.z }, 16);
    for (const o of this.enemies) if (o !== e && !ALIVE.has(o.state) && Math.hypot(o.x - e.x, o.z - e.z) < 12) { this.knock(o, o.x - e.x, o.z - e.z, 9); o.cvy = 5; o.spin = 8; }
    if (d < 11 && p.y < 0.9) this.hurt(Math.round(32 * (1 - d / 13)) + 4);
  }

  // ---- bomber eggs: bouncing, rolling bombs with a fuse ----
  dropEgg(e) {
    const p = this.p;
    const obj = new THREE.Mesh(this.eggGeo, this.eggMat.clone());
    obj.position.set(e.x, e.y + 0.6, e.z); this.scene.add(obj);
    this.eggs.push({ obj, x: e.x, y: e.y + 0.6, z: e.z, vx: (p.x - e.x) * 0.3, vy: -1, vz: (p.z - e.z) * 0.3, fuse: 2.8, age: 0, bounces: 0 });
    sfx.tink(2);
  }
  updateEggs(dt) {
    const p = this.p;
    for (let i = this.eggs.length - 1; i >= 0; i--) {
      const q = this.eggs[i];
      q.age += dt; q.fuse -= dt; q.vy -= 18 * dt;
      const inBox = (x, y, z) => this.boxes.some((b) => x > b.x0 && x < b.x1 && z > b.z0 && z < b.z1 && y < b.h);
      const nx = q.x + q.vx * dt, nz = q.z + q.vz * dt, ny = q.y + q.vy * dt;
      if (inBox(nx, q.y, q.z)) { q.vx *= -0.45; q.bounces++; } else q.x = nx;
      if (inBox(q.x, q.y, nz)) { q.vz *= -0.45; q.bounces++; } else q.z = nz;
      if (ny < 0.26) {
        q.y = 0.26;
        if (q.vy < -1.5) { q.vy = -q.vy * 0.5; q.bounces++; sfx.tink(2); } else q.vy = 0;
        const f = Math.exp(-1.6 * dt); q.vx *= f; q.vz *= f;
      } else if (inBox(q.x, ny, q.z)) { q.vy = Math.abs(q.vy) * 0.3; } else q.y = ny;
      q.obj.position.set(q.x, q.y, q.z);
      q.obj.rotation.x += q.vz * dt * 3; q.obj.rotation.z -= q.vx * dt * 3;            // rolls as it moves
      const rate = 6 + (1 - q.fuse / 2.8) * 26;
      q.obj.material.emissiveIntensity = 0.25 + 0.75 * (0.5 + 0.5 * Math.sin(q.age * rate));
      q.obj.scale.setScalar(1 + 0.08 * Math.sin(q.age * rate));
      if (Math.random() < dt * 14) this.emit(q.x, q.y + 0.2, q.z, 'smoke', 0, 0.6, 0, 0.35, 0.18, 0);
      const near = Math.hypot(q.x - p.x, q.z - p.z) < 1.5 && Math.abs(q.y - (p.y + 0.9)) < 1.6;
      if (q.fuse <= 0 || (near && q.age > 0.7)) {
        this.scene.remove(q.obj); q.obj.material.dispose(); this.eggs.splice(i, 1);
        this.explode(q.x, q.y, q.z, 4.8, 85, 'boom', null);
      }
    }
  }

  // shooting a corpse shoves it along and makes it hop
  corpseHit(e, d, dmg, pt) {
    this.knock(e, d.x, d.z, Math.min(7, 1.0 + dmg * 0.12));
    e.cvy = Math.max(e.cvy || 0, 1.2 + Math.random() * 1.6); e.spin = (Math.random() < 0.5 ? -1 : 1) * (3 + Math.random() * 4);
    this.burst(pt.x, pt.y, pt.z, 'green', 2, 2.2, 0.1);
  }

  updateProjectiles(dt) {
    const p = this.p;
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const q = this.projectiles[i];
      q.x += q.vx * dt; q.y += q.vy * dt; q.z += q.vz * dt; q.life -= dt;
      q.sprite.position.set(q.x, q.y, q.z);
      let dead = q.life <= 0 || q.y < 0.05;
      if (!dead) for (const b of this.boxes) if (q.x > b.x0 && q.x < b.x1 && q.z > b.z0 && q.z < b.z1 && q.y < b.h) { dead = true; break; }
      if (!dead && Math.hypot(q.x - p.x, q.z - p.z) < 0.7 && q.y > p.y && q.y < p.y + 1.9) { this.hurt(q.dmg || 12); sfx.plasmaHit(); dead = true; }
      if (dead && q.fire) { this.burst(q.x, q.y, q.z, 'fire', 10, 4.5, 0.25); this.sparks(q.x, q.y, q.z, 8, 6, 0, 0.35, 0); this.flash(q.x, q.y, q.z, 0xff8a30, 160, 0.3); }
      if (dead && !q.fire) this.burst(q.x, q.y, q.z, 'plasma', 8, 3.5, 0.12);
      if (dead) { this.scene.remove(q.sprite); this.projectiles.splice(i, 1); }
    }
  }

  // ---------------- waves / encounters ----------------
  queue(def) {
    const w = this.wave;
    for (const [type, n] of Object.entries(def)) for (let k = 0; k < n; k++) w.toSpawn.push(type);
    for (let k = w.toSpawn.length - 1; k > 0; k--) { const j = (Math.random() * (k + 1)) | 0; [w.toSpawn[k], w.toSpawn[j]] = [w.toSpawn[j], w.toSpawn[k]]; }
    w.toSpawn.sort((a, b) => (a === 'tsar') - (b === 'tsar'));   // the boss comes in first (spawn takes from the end)
  }
  startWave(i) {
    const w = this.wave;
    w.index = i; w.phase = 'fight'; w.spawnTimer = 0.3; w.toSpawn = [];
    this.queue(this.level.waves[i]);
    this.setMessage(`WAVE ${i + 1} / ${this.level.waves.length}`, 3); sfx.wave();
  }
  win() { this.wave.phase = 'done'; this.stats.time = this.time; sfx.win(); this.setState('won'); }
  trySpawn(dt) {
    const w = this.wave;
    w.spawnTimer -= dt;
    if (w.toSpawn.length && this.aliveCount() < (this.level.maxAlive || 8) && w.spawnTimer <= 0) { this.spawnEnemy(w.toSpawn.pop()); w.spawnTimer = this.level.mode === 'waves' ? 1.1 : 0.6; }
  }
  updateWaves(dt) {
    const w = this.wave, L = this.level, p = this.p;
    if (L.mode === 'advance') {
      // lizards drop in as the player passes each trigger line
      while (w.enc < L.encounters.length && p.z < L.encounters[w.enc].z) {
        const e = L.encounters[w.enc++];
        this.queue(e.spawn); w.index = w.enc - 1;
        this.setMessage(e.msg || 'LIZARDS INBOUND!', 3); sfx.wave();
      }
      this.trySpawn(dt);
      if (w.enc >= L.encounters.length && !w.toSpawn.length && this.aliveCount() === 0 && p.z < L.goalZ) this.win();
      return;
    }
    if (w.phase === 'intro' || w.phase === 'between') {
      w.timer -= dt;
      if (w.timer <= 0) this.startWave(w.index + 1);
    } else if (w.phase === 'fight') {
      this.trySpawn(dt);
      if (!w.toSpawn.length && this.aliveCount() === 0) {
        if (w.index >= L.waves.length - 1) this.win();
        else { w.phase = 'between'; w.timer = 5; this.setMessage('WAVE CLEARED — REARM', 4); }
      }
    }
  }
  // 0 = quiet exploring, 1 = a big fight: drives the music layers
  intensity() {
    if (this.state !== 'playing') return 0;
    return Math.min(1, (this.aliveCount() + this.wave.toSpawn.length * 0.5) / 9 + (this.p.hurt > 0 ? 0.15 : 0));
  }
  remaining() { return this.enemies.filter((e) => ALIVE.has(e.state)).length + this.wave.toSpawn.length; }

  setMessage(t, secs = 2) { this.message = t; this.messageT = secs; }

  // ---------------- main step ----------------
  step(dt) {
    dt = Math.min(dt, 0.05);
    if (this.state !== 'playing') return;
    this.time += dt;
    this.updatePlayer(dt);
    this.updateWeapon(dt);
    this.updateWaves(dt);
    this.updateEnemies(dt);
    this.updateProjectiles(dt);
    this.updateEggs(dt);
    this.updatePShots(dt);
    this.updateFx(dt);
    this.updateLights(dt);
    this.updateTimers(dt);
    this.debris.update(dt, this.boxes);
    this.updatePickups(dt);
    this.updateParticles(dt);
    this.messageT = Math.max(0, this.messageT - dt);
  }

  render() {
    const p = this.p, cam = this.camera;
    const bobY = Math.sin(p.bob * 2) * 0.05 * p.bobAmp;
    cam.position.set(p.x, p.y + EYE + bobY, p.z);
    cam.rotation.set(p.pitch + p.kick, p.yaw, p.roll + Math.sin(p.bob) * 0.006 * p.bobAmp);
    this.level.update(this.state === 'playing' ? 1 / 60 : 0, this.time, cam.position);
    // keep the sun's shadow window centred on the player (snapped so shadows don't shimmer)
    if (this.sun && this.quality >= 2) {
      const sx = Math.round(p.x / 1.5) * 1.5, sz = Math.round(p.z / 1.5) * 1.5;
      this.sun.target.position.set(sx, 0, sz);
      this.sun.position.set(sx, 0, sz).addScaledVector(this.sunDir || (this.sunDir = this.sun.position.clone().normalize()), 300);
    }

    // weapon viewmodel: separate 3D scene drawn on top of the world
    const sw = p.switching, lower = sw <= 0 ? 0 : sw < 1 ? sw : 2 - sw;
    const w = WEAPONS[p.weapon];
    this.wview.update({
      id: w.id === 'sabre' ? 'sabre' : w.id, bob: p.bob, bobAmp: p.bobAmp, flash: p.flash, swing: p.swing, shotN: p.shotN, spin: p.spin, lower,
      since: p.since, firing: p.firing,
    });
    if (this.post && this.quality >= 1) this.post.render();
    else {
      this.renderer.clear();
      this.renderer.render(this.scene, cam);
      this.renderer.clearDepth();
      this.renderer.render(this.wview.scene, this.wview.camera);
    }
    this.updateHud();
  }

  updateHud() {
    const u = this.ui, p = this.p, w = WEAPONS[p.weapon];
    if (!u.hp) return;
    const set = (el, v) => { if (el.textContent !== v) el.textContent = v; };
    set(u.hp, String(Math.max(0, Math.ceil(p.health))));
    u.hpBar.style.width = `${Math.max(0, p.health)}%`;
    set(u.weapon, w.name.toUpperCase());
    set(u.ammo, w.melee ? '∞' : `${AMMO[w.ammo].name} ${p.ammo[w.ammo]}`);
    const L = this.level;
    const wv = L.mode === 'advance'
      ? `GOAL ${Math.max(0, Math.round(p.z - L.goalZ))} m · LIZARDS ${this.remaining()}`
      : this.wave.index < 0 ? 'GET READY' : `WAVE ${this.wave.index + 1}/${L.waves.length} · LIZARDS ${this.remaining()}`;
    set(u.wave, wv);
    if (u.boss) {
      const boss = this.enemies.find((e) => e.cfg.boss && ALIVE.has(e.state));
      u.boss.style.display = boss ? 'block' : 'none';
      if (boss) u.bossBar.style.width = `${Math.max(0, (boss.hp / boss.maxHp) * 100)}%`;
    }
    set(u.msg, this.messageT > 0 ? this.message : '');
    u.hurt.style.opacity = String(Math.min(0.7, p.hurt * 2));
    u.slots.forEach((el, i) => {
      const n = i + 1;
      el.classList.toggle('on', w.slot === n);
      el.classList.toggle('locked', !WEAPONS.some((x) => x.slot === n && p.has[x.id]));
    });
  }
}
