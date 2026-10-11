// Core game: player, weapons, lizards, waves, pickups, rendering.
import * as THREE from 'three';
import { buildLevel, STREET_HALF } from './level.js';
import { resolveCircle, rayBox, rayCyl } from './geo.js';
import { makeLizardTextures, makePickupTextures, makePlasmaTexture, makeBeamTexture } from './sprites.js';
import { WEAPONS, AMMO } from './weapons.js';
import { drawWeapon, VIEW_W, VIEW_H } from './weaponart.js';
import { sfx } from './audio.js';

const EYE = 1.7;
const ENEMY = {
  grunt: { name: 'Lizard Raider', hp: 70, speed: 4.2, radius: 0.5, melee: 10, w: 1.9, h: 2.55 },
  spitter: { name: 'Lizard Spitter', hp: 45, speed: 2.6, radius: 0.5, w: 1.9, h: 2.55 },
};
const WAVES = [
  { grunt: 4 },
  { grunt: 4, spitter: 3 },
  { grunt: 6, spitter: 5 },
];
const MAX_ALIVE = 8;
const ALIVE = new Set(['spawn', 'move', 'attack', 'pain']);

export class Game {
  constructor({ canvas, weaponCanvas, ui }) {
    this.ui = ui || {};
    this.canvas = canvas;
    this.wctx = weaponCanvas.getContext('2d');
    this.wctx.imageSmoothingEnabled = false;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, 16 / 9, 0.1, 500);
    this.camera.rotation.order = 'YXZ';
    this.scene.add(this.camera);

    this.level = buildLevel(this.scene);
    this.boxes = this.level.boxes;
    this.liz = makeLizardTextures();
    this.pickTex = makePickupTextures();
    this.plasmaTex = makePlasmaTexture();
    this.plasmaMat = new THREE.SpriteMaterial({ map: this.plasmaTex, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
    this.beamGeo = new THREE.CylinderGeometry(0.9, 0.9, 18, 14, 1, true);
    this.shadowGeo = new THREE.CircleGeometry(0.7, 12); this.shadowGeo.rotateX(-Math.PI / 2);
    this.shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.35, depthWrite: false });

    this.makeParticlePool();
    this.keys = new Set();
    this.mouseDown = false;
    this.state = 'title';
    this.time = 0;
    this.reset();
    this.resize(canvas.clientWidth || 960, canvas.clientHeight || 540);
  }

  // ---------------- setup / reset ----------------
  reset() {
    for (const e of this.enemies || []) this.disposeEnemy(e);
    for (const pr of this.projectiles || []) this.scene.remove(pr.sprite);
    for (const pk of this.pickups || []) this.scene.remove(pk.mesh);
    this.enemies = []; this.projectiles = []; this.pickups = [];
    this.p = {
      x: 0, y: 0, z: 34, vx: 0, vz: 0, vy: 0, yaw: 0, pitch: 0, grounded: true,
      health: 100, ammo: { powder: AMMO.powder.start, shot: AMMO.shot.start },
      unlocked: [true, true, false, false], weapon: 1, cd: 0,
      switching: 0, switchTo: 1, flash: 0, swing: -1, pendingMelee: 0, shotN: 0,
      bob: 0, bobAmp: 0, kick: 0, hurt: 0, roll: 0,
    };
    this.stats = { kills: 0, time: 0, shots: 0 };
    this.wave = { index: -1, phase: 'intro', timer: 2.5, toSpawn: [], spawnTimer: 0 };
    this.messageT = 0;
    for (const s of this.level.pickupSpawns) this.addPickup(s.type, s.x, s.z);
    this.setMessage('LIZARDS FROM THE SKY — HOLD THE STREET', 4);
  }

  resize(w, h) {
    const H = 540, W = Math.round((H * w) / h);
    this.renderer.setPixelRatio(1);
    this.renderer.setSize(W, H, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  setState(s) { this.state = s; if (this.ui.onState) this.ui.onState(s); }
  begin() { if (this.state === 'dead' || this.state === 'won') this.reset(); this.setState('playing'); }
  pause() { if (this.state === 'playing') this.setState('paused'); }

  // ---------------- particles ----------------
  makeParticlePool() {
    const geo = new THREE.BoxGeometry(1, 1, 1);
    this.pmats = {
      green: new THREE.MeshBasicMaterial({ color: 0x66e04a }),
      dust: new THREE.MeshBasicMaterial({ color: 0xcdbb9a }),
      fire: new THREE.MeshBasicMaterial({ color: 0xffc040 }),
      plasma: new THREE.MeshBasicMaterial({ color: 0x8dff9d }),
    };
    this.particles = [];
    for (let i = 0; i < 160; i++) {
      const m = new THREE.Mesh(geo, this.pmats.dust);
      m.visible = false; this.scene.add(m);
      this.particles.push({ m, life: 0, vx: 0, vy: 0, vz: 0 });
    }
    this.pIdx = 0;
  }
  burst(x, y, z, kind, n, speed = 3, size = 0.1) {
    for (let i = 0; i < n; i++) {
      const p = this.particles[this.pIdx++ % this.particles.length];
      p.m.material = this.pmats[kind]; p.m.visible = true;
      p.m.position.set(x, y, z);
      const s = size * (0.6 + Math.random() * 0.8); p.m.scale.set(s, s, s);
      p.vx = (Math.random() - 0.5) * speed; p.vy = Math.random() * speed * 0.9; p.vz = (Math.random() - 0.5) * speed;
      p.life = 0.35 + Math.random() * 0.35;
    }
  }
  updateParticles(dt) {
    for (const p of this.particles) {
      if (p.life <= 0) continue;
      p.life -= dt;
      if (p.life <= 0) { p.m.visible = false; continue; }
      p.vy -= 12 * dt;
      p.m.position.x += p.vx * dt; p.m.position.y = Math.max(0.03, p.m.position.y + p.vy * dt); p.m.position.z += p.vz * dt;
    }
  }

  // ---------------- pickups ----------------
  addPickup(type, x, z) {
    const weapon = type.startsWith('w_');
    const size = weapon ? 1.1 : 0.8;
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.MeshBasicMaterial({ map: this.pickTex[type], transparent: true, alphaTest: 0.5, side: THREE.DoubleSide }));
    mesh.position.set(x, 0.7, z);
    this.scene.add(mesh);
    const glow = new THREE.Mesh(new THREE.CircleGeometry(0.45, 10), new THREE.MeshBasicMaterial({ color: weapon ? 0xffd060 : 0xffffff, transparent: true, opacity: 0.25, depthWrite: false }));
    glow.rotation.x = -Math.PI / 2; glow.position.set(0, -0.65, 0); mesh.add(glow);
    this.pickups.push({ type, mesh, x, z, t: Math.random() * 6 });
  }
  updatePickups(dt) {
    const p = this.p;
    for (let i = this.pickups.length - 1; i >= 0; i--) {
      const k = this.pickups[i];
      k.t += dt;
      k.mesh.position.y = 0.75 + Math.sin(k.t * 3) * 0.1;
      k.mesh.rotation.y = Math.atan2(this.camera.position.x - k.x, this.camera.position.z - k.z);
      if (Math.hypot(p.x - k.x, p.z - k.z) < 1.1 && this.collect(k.type)) {
        this.scene.remove(k.mesh); this.pickups.splice(i, 1); sfx.pickup();
      }
    }
  }
  collect(type) {
    const p = this.p;
    if (type === 'kvass') { if (p.health >= 100) return false; p.health = Math.min(100, p.health + 30); this.setMessage('KVASS  +30 HEALTH'); return true; }
    if (type === 'powder') { if (p.ammo.powder >= AMMO.powder.max) return false; p.ammo.powder = Math.min(AMMO.powder.max, p.ammo.powder + 24); this.setMessage('POWDER KEG  +24'); return true; }
    if (type === 'shot') { if (p.ammo.shot >= AMMO.shot.max) return false; p.ammo.shot = Math.min(AMMO.shot.max, p.ammo.shot + 6); this.setMessage('BUCKSHOT  +6'); return true; }
    const wi = type === 'w_blunder' ? 2 : 3;
    p.unlocked[wi] = true;
    if (wi === 2) p.ammo.shot = Math.min(AMMO.shot.max, p.ammo.shot + 8); else p.ammo.powder = Math.min(AMMO.powder.max, p.ammo.powder + 30);
    this.selectWeapon(wi);
    this.setMessage(`${WEAPONS[wi].name.toUpperCase()} ACQUIRED  [${wi + 1}]`, 3);
    return true;
  }

  // ---------------- player ----------------
  selectWeapon(i) {
    const p = this.p;
    if (i === p.weapon || !p.unlocked[i] || p.switching > 0) return;
    p.switchTo = i; p.switching = 0.0001;
  }
  cycleWeapon(dir) {
    const p = this.p; let i = p.weapon;
    for (let n = 0; n < 4; n++) { i = (i + dir + 4) % 4; if (p.unlocked[i]) return this.selectWeapon(i); }
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
    const p = this.p, w = WEAPONS[p.weapon];
    p.cd = Math.max(0, p.cd - dt);
    p.flash = Math.max(0, p.flash - dt * 12);
    if (p.swing >= 0) { p.swing += dt / 0.38; if (p.swing >= 1) p.swing = -1; }
    if (p.pendingMelee > 0) { p.pendingMelee -= dt; if (p.pendingMelee <= 0) this.meleeHit(); }
    if (p.switching > 0) {
      p.switching += dt / 0.16;
      if (p.switching >= 1 && p.weapon !== p.switchTo) { p.weapon = p.switchTo; p.swing = -1; p.flash = 0; }
      if (p.switching >= 2) p.switching = 0;
    }
    if (this.mouseDown && p.switching === 0 && p.cd <= 0) this.fire();
    void w;
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
      p.cd = w.cooldown; p.swing = 0; p.pendingMelee = 0.14; sfx.sabre(); return true;
    }
    if (p.ammo[w.ammo] < w.use) {
      sfx.empty(); p.cd = 0.3;
      const alt = [3, 2, 1, 0].find((i) => p.unlocked[i] && (WEAPONS[i].melee || p.ammo[WEAPONS[i].ammo] > 0));
      if (alt !== undefined && alt !== p.weapon) { this.setMessage('OUT OF AMMO'); this.selectWeapon(alt); }
      return false;
    }
    p.ammo[w.ammo] -= w.use;
    p.cd = w.cooldown; p.flash = 1; p.shotN++; this.stats.shots++;
    p.kick += w.kick;
    sfx[w.sfx]();
    const { dir, right, up } = this.basis();
    const o = this.eye();
    for (let i = 0; i < w.pellets; i++) {
      const d = dir.clone();
      if (w.spread) {
        const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * w.spread;
        d.addScaledVector(right, Math.cos(a) * r).addScaledVector(up, Math.sin(a) * r).normalize();
      }
      const hit = this.hitscan(o, d, 90);
      const pt = o.clone().addScaledVector(d, hit.t);
      if (hit.enemy) this.damageEnemy(hit.enemy, w.damage, pt);
      else if (hit.t < 90) this.burst(pt.x - d.x * 0.1, pt.y, pt.z - d.z * 0.1, 'dust', 3, 2.2, 0.08);
    }
    return true;
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
    const pts = this.level.spawnPoints.filter((s) => Math.hypot(s.x - p.x, s.z - p.z) > 14 && Math.hypot(s.x - p.x, s.z - p.z) < 48);
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
    const e = { type, cfg, mesh, shadow, beam, hp: cfg.hp, x: sp.x, z: sp.z, state: 'spawn', timer: 0.9, cool: 0.6 + Math.random() * 0.8, anim: 0, deadT: 0, hit: false, slide: 0, slideT: 0, stuck: 0, strafe: Math.random() < 0.5 ? 1 : -1, strafeT: 1 + Math.random() * 2 };
    this.enemies.push(e);
    sfx.beam();
    return e;
  }
  disposeEnemy(e) {
    this.scene.remove(e.mesh, e.shadow, e.beam);
    e.mesh.geometry.dispose(); e.mesh.material.dispose(); e.beam.material.dispose();
  }
  aliveCount() { let n = 0; for (const e of this.enemies) if (ALIVE.has(e.state)) n++; return n; }

  damageEnemy(e, dmg, pt) {
    if (!ALIVE.has(e.state) || e.state === 'spawn') return;
    e.hp -= dmg;
    this.burst(pt.x, pt.y, pt.z, 'green', 5, 3.2, 0.12);
    sfx.hit();
    if (e.hp <= 0) this.killEnemy(e);
    else if (e.state !== 'attack' && (Math.random() < 0.45 || dmg >= 40)) { e.state = 'pain'; e.timer = 0.28; sfx.lizardPain(); }
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
          e.deadT += dt; if (e.deadT > 0.7) e.state = 'dead';
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
      else if (e.state === 'dying' || e.state === 'dead') tx = T.dead[Math.min(2, Math.floor(e.deadT / 0.2))];
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

  // ---------------- waves ----------------
  startWave(i) {
    const w = this.wave, def = WAVES[i];
    w.index = i; w.phase = 'fight'; w.spawnTimer = 0.3; w.toSpawn = [];
    for (const [type, n] of Object.entries(def)) for (let k = 0; k < n; k++) w.toSpawn.push(type);
    for (let k = w.toSpawn.length - 1; k > 0; k--) { const j = (Math.random() * (k + 1)) | 0; [w.toSpawn[k], w.toSpawn[j]] = [w.toSpawn[j], w.toSpawn[k]]; }
    this.setMessage(`WAVE ${i + 1} / ${WAVES.length}`, 3); sfx.wave();
  }
  updateWaves(dt) {
    const w = this.wave;
    if (w.phase === 'intro' || w.phase === 'between') {
      w.timer -= dt;
      if (w.timer <= 0) this.startWave(w.index + 1);
    } else if (w.phase === 'fight') {
      w.spawnTimer -= dt;
      if (w.toSpawn.length && this.aliveCount() < MAX_ALIVE && w.spawnTimer <= 0) { this.spawnEnemy(w.toSpawn.pop()); w.spawnTimer = 1.1; }
      if (!w.toSpawn.length && this.aliveCount() === 0) {
        if (w.index >= WAVES.length - 1) { w.phase = 'done'; this.stats.time = this.time; sfx.win(); this.setState('won'); }
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
    this.renderer.render(this.scene, cam);

    // weapon viewmodel
    const sw = p.switching, lower = sw <= 0 ? 0 : sw < 1 ? sw : 2 - sw;
    const w = WEAPONS[p.weapon];
    drawWeapon(this.wctx, w.id, {
      ox: Math.sin(p.bob) * 3 * p.bobAmp, oy: Math.abs(Math.cos(p.bob)) * 3 * p.bobAmp + lower * 70 + p.flash * 4,
      fire: p.flash, swing: p.swing, shotN: p.shotN,
    });
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
    const wv = this.wave.index < 0 ? 'GET READY' : `WAVE ${this.wave.index + 1}/${WAVES.length} · LIZARDS ${this.remaining()}`;
    set(u.wave, wv);
    set(u.msg, this.messageT > 0 ? this.message : '');
    u.hurt.style.opacity = String(Math.min(0.7, p.hurt * 2));
    u.slots.forEach((s, i) => { s.classList.toggle('on', i === p.weapon); s.classList.toggle('locked', !p.unlocked[i]); });
  }
}
