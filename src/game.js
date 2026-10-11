// Core game: player, weapons, lizards, waves, pickups, rendering.
import * as THREE from 'three';
import { LEVELS } from './levels.js';
import { resolveCircle, rayBox, rayCyl } from './geo.js';
import { makeLizardTextures, makePickupTextures, makePlasmaTexture } from './sprites.js';
import { WEAPONS, AMMO, WEAPON_INDEX, SLOTS } from './weapons.js';
import { WeaponView } from './weaponmodels.js';
import { sfx } from './audio.js';

const EYE = 1.7;
const ENEMY = {
  grunt: { name: 'Lizard Raider', hp: 70, speed: 4.2, radius: 0.5, melee: 10, w: 2.1, h: 2.62 },
  spitter: { name: 'Lizard Spitter', hp: 45, speed: 2.6, radius: 0.5, w: 2.1, h: 2.62 },
};
const ALIVE = new Set(['spawn', 'move', 'attack', 'pain']);

export class Game {
  constructor({ canvas, ui }) {
    this.ui = ui || {};
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.autoClear = false;
    this.wview = new WeaponView(this.renderer);
    this.camera = new THREE.PerspectiveCamera(75, 16 / 9, 0.2, 3000);
    this.camera.rotation.order = 'YXZ';
    this.liz = makeLizardTextures();
    this.pickTex = makePickupTextures();
    for (const [id, t] of Object.entries(this.wview.renderIcons(this.renderer))) this.pickTex['w_' + id] = t;
    const spriteMat = (tint) => new THREE.SpriteMaterial({ map: makePlasmaTexture(tint), blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
    this.plasmaMat = spriteMat('green');                       // lizard spit
    this.shotMats = { rocket: spriteMat('orange'), plasma: spriteMat('blue'), bfg: spriteMat('green'), boom: spriteMat('orange'), boomBlue: spriteMat('blue'), boomGreen: spriteMat('green') };
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
    this.makeParticlePool();
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
    this.clearEntities();
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
  }

  setState(s) { this.state = s; if (this.ui.onState) this.ui.onState(s); }
  begin() { if (this.state === 'dead' || this.state === 'won') this.reset(); this.setState('playing'); }
  nextLevel() { return this.levelIndex + 1 < LEVELS.length ? this.levelIndex + 1 : null; }
  pause() { if (this.state === 'playing') this.setState('paused'); }

  // ---------------- particles ----------------
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
    this.smats = { flameY: sp('orange', true), flameR: sp('orange', true), smoke: null, fire: sp('orange', true) };
    const smokeTex = makePlasmaTexture('orange');
    this.smats.smoke = new THREE.SpriteMaterial({ map: smokeTex, color: 0x302c28, depthWrite: false, transparent: true });
    this.sprites = [];
    for (let i = 0; i < 140; i++) {
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
  emit(x, y, z, kind, vx, vy, vz, life, size, grav = 12) {
    if (kind === 'flameY' || kind === 'flameR' || kind === 'smoke' || kind === 'fire') {
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
      q.m.scale.setScalar(q.size * (q.kind === 'smoke' ? 0.6 + (1 - u) * 1.2 : 0.35 + u * 0.65));
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
  addPickup(type, x, z) {
    const weapon = type.startsWith('w_');
    const mesh = new THREE.Mesh(weapon ? new THREE.PlaneGeometry(2.3, 1.15) : new THREE.PlaneGeometry(0.8, 0.8), new THREE.MeshBasicMaterial({ map: this.pickTex[type], transparent: true, alphaTest: 0.4, side: THREE.DoubleSide }));
    mesh.position.set(x, 0.7, z);
    this.scene.add(mesh);
    const glow = new THREE.Mesh(new THREE.CircleGeometry(weapon ? 0.9 : 0.45, 14), new THREE.MeshBasicMaterial({ color: weapon ? 0xffd060 : 0xffffff, transparent: true, opacity: 0.25, depthWrite: false }));
    glow.rotation.x = -Math.PI / 2; glow.position.set(0, weapon ? -0.8 : -0.65, 0); mesh.add(glow);
    this.pickups.push({ type, mesh, x, z, t: Math.random() * 6 });
  }
  updatePickups(dt) {
    const p = this.p;
    for (let i = this.pickups.length - 1; i >= 0; i--) {
      const k = this.pickups[i];
      k.t += dt;
      k.mesh.position.y = (k.type.startsWith('w_') ? 0.95 : 0.75) + Math.sin(k.t * 3) * 0.1;
      k.mesh.rotation.y = Math.atan2(this.camera.position.x - k.x, this.camera.position.z - k.z);
      if (Math.hypot(p.x - k.x, p.z - k.z) < 1.1 && this.collect(k.type)) {
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
      const hit = this.hitscan(o, d, this.level.range);
      const pt = o.clone().addScaledVector(d, hit.t);
      if (hit.enemy) this.damageEnemy(hit.enemy, w.damage, pt);
      else if (hit.t < this.level.range) this.burst(pt.x - d.x * 0.1, pt.y, pt.z - d.z * 0.1, 'dust', 3, 2.2, 0.08);
    }
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
    else { obj = new THREE.Sprite(this.shotMats[S.type]); obj.scale.setScalar(S.type === 'bfg' ? 1.8 : S.type === 'plasma' ? 0.55 : 0.8); }
    obj.position.copy(o); this.scene.add(obj);
    this.pshots.push({ S, obj, x: o.x, y: o.y, z: o.z, vx: d.x * S.speed, vy: d.y * S.speed + (S.type === 'grenade' ? 3 : 0), vz: d.z * S.speed, life: S.fuse || 5, bounces: 0 });
  }

  fireFlame(w) {
    const { dir, right, up } = this.basis(), eye = this.eye();
    const o = this.muzzlePos(0.9);
    const wall = this.hitscan(eye, dir, w.range).t;
    const reach = Math.min(w.range, wall);
    for (let i = 0; i < 3; i++) {
      const d = dir.clone().addScaledVector(right, (Math.random() - 0.5) * 0.18).addScaledVector(up, (Math.random() - 0.5) * 0.14);
      const sp = 9 + Math.random() * 5;
      this.emit(o.x, o.y, o.z, Math.random() < 0.5 ? 'flameY' : 'flameR', d.x * sp, d.y * sp + 0.6, d.z * sp, Math.min(0.55, reach / sp + 0.05), 0.2 + Math.random() * 0.2, -1.5);
    }
    for (const e of this.enemies) {
      if (!ALIVE.has(e.state) || e.state === 'spawn') continue;
      const dx = e.x - eye.x, dz = e.z - eye.z, dy = 1.2 - eye.y, d = Math.hypot(dx, dz);
      if (d > reach + 0.5) continue;
      if ((dx * dir.x + dy * dir.y + dz * dir.z) / Math.hypot(dx, dy, dz) < 0.93) continue;
      this.damageEnemy(e, w.damage, new THREE.Vector3(e.x, 1.2, e.z), true);
      e.burn = 2.5;
    }
  }

  fireRail(w) {
    const { dir, right, up } = this.basis(), eye = this.eye();
    const wall = this.hitscan(eye, dir, this.level.range).t;
    const hits = [];
    for (const e of this.enemies) {
      if (!ALIVE.has(e.state) || e.state === 'spawn') continue;
      const t = rayCyl(eye, dir, e.x, e.z, 0.7, 0, 2.4);
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
    if (wall < 200) this.burst(end.x, end.y, end.z, 'blue', 8, 4, 0.12);
  }

  explode(x, y, z, R, dmg, tint = 'boom') {
    sfx.explosion();
    const s = new THREE.Sprite(this.shotMats[tint].clone());
    s.position.set(x, y + 0.3, z); s.scale.setScalar(R * 0.5); this.scene.add(s);
    this.fx.push({ obj: s, t: 0.45, dur: 0.45, kind: 'boom', size: R * 2.2 });
    const kind = tint === 'boomGreen' ? 'plasma' : tint === 'boomBlue' ? 'blue' : 'fire';
    this.burst(x, y + 0.4, z, kind, 14, R * 1.6, 0.12);
    if (tint === 'boom') for (let i = 0; i < 10; i++) this.emit(x + (Math.random() - 0.5), y + 0.4, z + (Math.random() - 0.5), 'smoke', (Math.random() - 0.5) * R, 1 + Math.random() * 2, (Math.random() - 0.5) * R, 1.2 + Math.random() * 0.6, 0.9 + Math.random() * 0.6, -0.5);
    this.p.kick += Math.max(0, 0.06 * (1 - Math.hypot(x - this.p.x, z - this.p.z) / (R * 5)));
    for (const e of this.enemies) {
      if (!ALIVE.has(e.state) || e.state === 'spawn') continue;
      const d = Math.hypot(e.x - x, (1.2 - y) * 0.6, e.z - z);
      if (d > R + 0.6) continue;
      const f = 1 - d / (R + 0.6);
      this.damageEnemy(e, dmg * (0.3 + 0.7 * f), new THREE.Vector3(e.x, 1.2, e.z));
    }
    const dp = Math.hypot(this.p.x - x, this.p.y + 1 - y, this.p.z - z);
    if (dp < R && tint !== 'boomBlue') this.hurt(Math.min(35, dmg * 0.25 * (1 - dp / R)));
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
      let boom = hitWall || q.life <= 0;
      if (!boom) for (const e of this.enemies) {
        if (!ALIVE.has(e.state) || e.state === 'spawn') continue;
        if (Math.hypot(q.x - e.x, q.z - e.z) < 0.75 && q.y > 0 && q.y < 2.5) { boom = true; break; }
      }
      if (boom) {
        this.explode(q.x, q.y, q.z, S.radius, S.damage, S.type === 'plasma' ? 'boomBlue' : S.type === 'bfg' ? 'boomGreen' : 'boom');
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
      if (d > w.range + 0.5) continue;
      if ((dx * fx + dz * fz) / (d || 1) < 0.45) continue;
      this.damageEnemy(e, w.damage, new THREE.Vector3(e.x, 1.3, e.z)); hit = true;
    }
    if (hit) this.p.kick += 0.03;
  }

  hitscan(o, d, range) {
    let best = { t: range, enemy: null };
    for (const b of this.boxes) { const t = rayBox(o, d, b); if (t < best.t) best = { t, enemy: null }; }
    for (const e of this.enemies) {
      if (!ALIVE.has(e.state) || e.state === 'spawn') continue;
      const t = rayCyl(o, d, e.x, e.z, 0.6, 0, 2.3);
      if (t < best.t) best = { t, enemy: e };
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
    const [rMin, rMax] = this.level.spawnRange;
    const pts = this.level.spawnPoints.filter((s) => Math.hypot(s.x - p.x, s.z - p.z) > rMin && Math.hypot(s.x - p.x, s.z - p.z) < rMax);
    const pool = pts.length ? pts : this.level.spawnPoints;
    const sp = pool[(Math.random() * pool.length) | 0];
    const mat = new THREE.MeshBasicMaterial({ map: this.liz[type].idle, transparent: true, alphaTest: 0.5, side: THREE.DoubleSide });
    const geo = new THREE.PlaneGeometry(cfg.w, cfg.h); geo.translate(0, cfg.h / 2, 0);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.visible = false;
    mesh.position.set(sp.x, 0, sp.z);
    this.scene.add(mesh);
    const shadow = new THREE.Mesh(this.shadowGeo, this.shadowMat);
    shadow.position.set(sp.x, 0.04, sp.z); shadow.visible = false; this.scene.add(shadow);
    const beam = new THREE.Mesh(this.beamGeo, new THREE.MeshBasicMaterial({ color: 0x8dff9d, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
    beam.position.set(sp.x, 9, sp.z); this.scene.add(beam);
    const e = { type, cfg, mesh, shadow, beam, hp: cfg.hp, x: sp.x, z: sp.z, state: 'spawn', timer: 0.9, cool: 0.6 + Math.random() * 0.8, anim: 0, deadT: 0, hit: false, flip: Math.random() < 0.5 ? 1 : -1, slide: 0, slideT: 0, stuck: 0, strafe: Math.random() < 0.5 ? 1 : -1, strafeT: 1 + Math.random() * 2 };
    this.enemies.push(e);
    sfx.beam();
    return e;
  }
  disposeEnemy(e) {
    this.scene.remove(e.mesh, e.shadow, e.beam);
    e.mesh.geometry.dispose(); e.mesh.material.dispose(); e.beam.material.dispose();
  }
  aliveCount() { let n = 0; for (const e of this.enemies) if (ALIVE.has(e.state)) n++; return n; }

  damageEnemy(e, dmg, pt, quiet = false) {
    if (!ALIVE.has(e.state) || e.state === 'spawn') return;
    e.hp -= dmg;
    this.burst(pt.x, pt.y, pt.z, quiet ? 'fire' : 'green', quiet ? 2 : 5, 3.2, 0.12);
    if (!quiet) sfx.hit();
    if (e.hp <= 0) this.killEnemy(e);
    else if (!quiet && e.state !== 'attack' && (Math.random() < 0.45 || dmg >= 40)) { e.state = 'pain'; e.timer = 0.28; sfx.lizardPain(); }
  }
  killEnemy(e) {
    e.state = 'dying'; e.deadT = 0; this.stats.kills++; sfx.lizardDie();
    this.burst(e.x, 1.2, e.z, 'green', 14, 4.5, 0.16);
    e.shadow.visible = false;
    if (Math.random() < 0.4) {
      const r = Math.random();
      this.addPickup(r < 0.25 ? 'kvass' : r < 0.7 ? 'powder' : 'shot', e.x, e.z);
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
    for (const e of this.enemies) {
      const dx = p.x - e.x, dz = p.z - e.z, dist = Math.hypot(dx, dz) || 1;
      const nx = dx / dist, nz = dz / dist;
      e.cool -= dt;
      if (e.burn > 0 && ALIVE.has(e.state) && e.state !== 'spawn') {
        e.burn -= dt; e.burnT = (e.burnT || 0) + dt;
        if (Math.random() < dt * 14) this.emit(e.x + (Math.random() - 0.5) * 0.6, 0.8 + Math.random() * 1.4, e.z + (Math.random() - 0.5) * 0.6, Math.random() < 0.5 ? 'flameY' : 'flameR', 0, 1.8, 0, 0.4, 0.3, -2);
        if (e.burnT > 0.3) { e.burnT = 0; this.damageEnemy(e, 5, new THREE.Vector3(e.x, 1.2, e.z), true); }
      }
      switch (e.state) {
        case 'spawn':
          e.timer -= dt;
          e.beam.material.opacity = Math.max(0, Math.min(0.55, e.timer * 1.2 + (0.9 - e.timer) * 0.2));
          if (e.timer <= 0.35 && !e.mesh.visible) { e.mesh.visible = true; e.shadow.visible = true; this.burst(e.x, 0.5, e.z, 'plasma', 12, 4, 0.14); }
          if (e.timer <= 0) { e.state = 'move'; this.scene.remove(e.beam); }
          break;
        case 'move': {
          let mx = 0, mz = 0, speed = e.cfg.speed;
          if (e.type === 'grunt') {
            mx = nx; mz = nz;
            if (dist < 1.8 && e.cool <= 0) { e.state = 'attack'; e.timer = 0.55; e.hit = false; sfx.hiss(); }
          } else {
            e.strafeT -= dt; if (e.strafeT <= 0) { e.strafe *= -1; e.strafeT = 1 + Math.random() * 2; }
            if (dist > 15) { mx = nx; mz = nz; } else if (dist < 8) { mx = -nx; mz = -nz; speed *= 0.8; } else { mx = -nz * e.strafe; mz = nx * e.strafe; speed *= 0.6; }
            if (e.cool <= 0 && dist < 36 && this.hasLOS(e.x, 1.5, e.z, p.x, p.y + 1.4, p.z)) { e.state = 'attack'; e.timer = 0.5; e.hit = false; sfx.hiss(); }
          }
          if (e.slideT > 0) { // steer around props we got stuck on
            e.slideT -= dt;
            const tx = -mz * e.slide, tz = mx * e.slide;
            mx = mx * 0.25 + tx; mz = mz * 0.25 + tz;
            const l = Math.hypot(mx, mz) || 1; mx /= l; mz /= l;
          }
          const pos = { x: e.x + mx * speed * dt, z: e.z + mz * speed * dt };
          for (const o of this.enemies) {
            if (o === e || !ALIVE.has(o.state)) continue;
            const ox = pos.x - o.x, oz = pos.z - o.z, od = Math.hypot(ox, oz);
            if (od < 1.0 && od > 0.001) { pos.x += (ox / od) * (1.0 - od) * 0.5; pos.z += (oz / od) * (1.0 - od) * 0.5; }
          }
          const pd = Math.hypot(pos.x - p.x, pos.z - p.z);
          if (pd < 0.95) { pos.x = p.x + ((pos.x - p.x) / (pd || 1)) * 0.95; pos.z = p.z + ((pos.z - p.z) / (pd || 1)) * 0.95; }
          resolveCircle(pos, e.cfg.radius, this.boxes);
          if (dist > 2.5 && Math.hypot(pos.x - e.x, pos.z - e.z) < speed * dt * 0.35) {
            e.stuck += dt;
            if (e.stuck > 0.25) { e.slide = e.slide ? -e.slide : (Math.random() < 0.5 ? 1 : -1); e.slideT = 1.2; e.stuck = 0; }
          } else e.stuck = 0;
          e.x = pos.x; e.z = pos.z;
          e.anim += dt * (e.type === 'grunt' ? 9 : 6);
          break;
        }
        case 'attack':
          e.timer -= dt;
          if (e.type === 'grunt') {
            if (!e.hit && e.timer < 0.25) { e.hit = true; if (dist < 2.3) this.hurt(e.cfg.melee); }
          } else if (!e.hit && e.timer < 0.2) {
            e.hit = true;
            const sx = e.x, sy = 1.5, sz = e.z;
            const tx = p.x - sx, ty = p.y + 1.3 - sy, tz = p.z - sz, l = Math.hypot(tx, ty, tz) || 1;
            const sprite = new THREE.Sprite(this.plasmaMat); sprite.scale.set(1.1, 1.1, 1.1); sprite.position.set(sx, sy, sz);
            this.scene.add(sprite);
            this.projectiles.push({ sprite, x: sx, y: sy, z: sz, vx: (tx / l) * 14, vy: (ty / l) * 14, vz: (tz / l) * 14, life: 6 });
            sfx.spit();
          }
          if (e.timer <= 0) { e.state = 'move'; e.cool = e.type === 'grunt' ? 0.8 : 1.6 + Math.random(); }
          break;
        case 'pain':
          e.timer -= dt; if (e.timer <= 0) e.state = 'move';
          break;
        case 'dying':
          e.deadT += dt; if (e.deadT > 0.5) e.state = 'dead';
          break;
      }
      // visuals
      const m = e.mesh;
      m.position.set(e.x, 0, e.z);
      e.shadow.position.set(e.x, 0.04, e.z);
      m.rotation.y = Math.atan2(cam.x - e.x, cam.z - e.z);
      const T = this.liz[e.type];
      let tx = T.idle;
      if (e.state === 'move') tx = [T.walk1, T.idle, T.walk2, T.idle][Math.floor(e.anim) % 4];
      else if (e.state === 'attack') tx = T.attack;
      else if (e.state === 'pain') tx = T.pain;
      else if (e.state === 'dying' || e.state === 'dead') { tx = T.dead[e.deadT < 0.1 ? 0 : e.deadT < 0.26 ? 1 : e.deadT < 0.45 ? 2 : 3]; m.scale.x = 1.5 * e.flip; }
      if (m.material.map !== tx) { m.material.map = tx; m.material.needsUpdate = true; }
      if (e.beam.parent) e.beam.position.set(e.x, 9, e.z);
    }
  }

  updateProjectiles(dt) {
    const p = this.p;
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const q = this.projectiles[i];
      q.x += q.vx * dt; q.y += q.vy * dt; q.z += q.vz * dt; q.life -= dt;
      q.sprite.position.set(q.x, q.y, q.z);
      let dead = q.life <= 0 || q.y < 0.05;
      if (!dead) for (const b of this.boxes) if (q.x > b.x0 && q.x < b.x1 && q.z > b.z0 && q.z < b.z1 && q.y < b.h) { dead = true; break; }
      if (!dead && Math.hypot(q.x - p.x, q.z - p.z) < 0.7 && q.y > p.y && q.y < p.y + 1.9) { this.hurt(12); sfx.plasmaHit(); dead = true; }
      if (dead) { this.burst(q.x, q.y, q.z, 'plasma', 8, 3.5, 0.12); this.scene.remove(q.sprite); this.projectiles.splice(i, 1); }
    }
  }

  // ---------------- waves / encounters ----------------
  queue(def) {
    const w = this.wave;
    for (const [type, n] of Object.entries(def)) for (let k = 0; k < n; k++) w.toSpawn.push(type);
    for (let k = w.toSpawn.length - 1; k > 0; k--) { const j = (Math.random() * (k + 1)) | 0; [w.toSpawn[k], w.toSpawn[j]] = [w.toSpawn[j], w.toSpawn[k]]; }
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
    this.updatePShots(dt);
    this.updateFx(dt);
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
    this.renderer.clear();
    this.renderer.render(this.scene, cam);

    // weapon viewmodel: separate 3D scene drawn on top of the world
    const sw = p.switching, lower = sw <= 0 ? 0 : sw < 1 ? sw : 2 - sw;
    const w = WEAPONS[p.weapon];
    this.wview.update({
      id: w.id === 'sabre' ? 'sabre' : w.id, bob: p.bob, bobAmp: p.bobAmp, flash: p.flash, swing: p.swing, shotN: p.shotN, spin: p.spin, lower,
      since: p.since, firing: p.firing,
    });
    this.renderer.clearDepth();
    this.renderer.render(this.wview.scene, this.wview.camera);
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
    set(u.msg, this.messageT > 0 ? this.message : '');
    u.hurt.style.opacity = String(Math.min(0.7, p.hurt * 2));
    u.slots.forEach((el, i) => {
      const n = i + 1;
      el.classList.toggle('on', w.slot === n);
      el.classList.toggle('locked', !WEAPONS.some((x) => x.slot === n && p.has[x.id]));
    });
  }
}
