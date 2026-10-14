// Small physical debris: shell casings, wood splinters, glass shards, metal chunks. Gravity, bouncing, rolling, fading away.
import * as THREE from 'three';
import { tex } from './textures.js';

const lam = (color, extra = {}) => new THREE.MeshLambertMaterial({ color, ...extra });
let KINDS = null;
const tmpM = new THREE.Matrix4();
function kinds() {
  if (KINDS) return KINDS;
  const box = new THREE.BoxGeometry(1, 1, 1);
  KINDS = {
    brass: { geo: new THREE.CylinderGeometry(0.007, 0.007, 0.032, 6), mat: new THREE.MeshLambertMaterial({ color: 0xe0b44a, emissive: 0x3a2a08 }), r: 0.012, bounce: 0.55, life: [6, 9], sound: 'tink' },
    shell: { geo: new THREE.CylinderGeometry(0.011, 0.011, 0.048, 8), mat: lam(0xc0382c, { emissive: 0x300808 }), r: 0.015, bounce: 0.4, life: [8, 11], sound: 'tink' },
    wood: { geo: box, mat: new THREE.MeshLambertMaterial({ map: tex('planks') }), r: 0.06, bounce: 0.35, life: [5, 8], size: [0.1, 0.34], flat: true },
    metal: { geo: box, mat: lam(0x6a6e74), r: 0.05, bounce: 0.45, life: [5, 8], size: [0.08, 0.26], sound: 'tink' },
    brick: { geo: box, mat: new THREE.MeshLambertMaterial({ map: tex('brick') }), r: 0.06, bounce: 0.3, life: [5, 8], size: [0.08, 0.2] },
    glass: { geo: new THREE.PlaneGeometry(1, 1), mat: new THREE.MeshLambertMaterial({ color: 0xbfe0f0, transparent: true, opacity: 0.7, side: THREE.DoubleSide, emissive: 0x203040 }), r: 0.03, bounce: 0.3, life: [3, 5], size: [0.06, 0.22], sound: 'glass' },
  };
  return KINDS;
}

export class Debris {
  constructor(scene, max = 260, onSound = null) {
    this.items = []; this.i = 0; this.onSound = onSound;
    const K = kinds();
    for (let n = 0; n < max; n++) {
      const m = new THREE.Mesh(K.brass.geo, K.brass.mat); m.visible = false; m.castShadow = false; m.receiveShadow = true;
      scene.add(m);
      this.items.push({ m, kind: 'brass', vx: 0, vy: 0, vz: 0, ax: 0, ay: 0, az: 0, r: 0.01, life: 0, rest: 0, scale: 1, sound: 0 });
    }
  }
  spawn(kind, x, y, z, vx, vy, vz, size = 1) {
    const K = kinds()[kind], d = this.items[this.i++ % this.items.length];
    d.kind = kind; d.m.geometry = K.geo; d.m.material = K.mat; d.m.visible = true;
    d.m.position.set(x, y, z); d.m.rotation.set(Math.random() * 6.28, Math.random() * 6.28, Math.random() * 6.28);
    const sz = K.size ? (K.size[0] + Math.random() * (K.size[1] - K.size[0])) * size : 1;
    if (K.size) d.m.scale.set(sz, K.flat ? sz * 0.4 : sz * (0.5 + Math.random() * 0.6), sz * (0.5 + Math.random() * 0.8)); else d.m.scale.set(1, 1, 1);
    d.scale = 1; d.baseScale = d.m.scale.clone();
    d.vx = vx; d.vy = vy; d.vz = vz; d.ax = (Math.random() - 0.5) * 24; d.ay = (Math.random() - 0.5) * 24; d.az = (Math.random() - 0.5) * 24;
    d.r = K.size ? sz * 0.4 : K.r; d.life = K.life[0] + Math.random() * (K.life[1] - K.life[0]); d.rest = 0; d.sound = 0;
  }
  update(dt, boxes) {
    const K = kinds();
    for (const d of this.items) {
      if (!d.m.visible) continue;
      const p = d.m.position, k = K[d.kind];
      d.life -= dt;
      if (d.life <= 0) { d.m.visible = false; continue; }
      if (d.life < 0.5) d.m.scale.copy(d.baseScale).multiplyScalar(d.life / 0.5);
      d.vy -= 17 * dt;
      p.x += d.vx * dt; p.y += d.vy * dt; p.z += d.vz * dt;
      d.sound -= dt;
      let floor = d.r;
      if (k.size) { // a tumbling box: rest on its lowest CORNER, so no part of it sinks into the ground
        const te = tmpM.makeRotationFromEuler(d.m.rotation).elements, sc = d.m.scale;
        floor = 0.5 * (Math.abs(te[1]) * sc.x + Math.abs(te[5]) * sc.y + (d.kind === 'glass' ? 0 : Math.abs(te[9]) * sc.z));
      }
      if (p.y < floor) {
        p.y = floor;
        if (d.vy < -0.8) {
          if (k.sound && d.sound <= 0 && this.onSound) { this.onSound(k.sound, -d.vy, p); d.sound = 0.08; }
          d.vy = -d.vy * k.bounce; d.vx *= 0.7; d.vz *= 0.7; d.ax *= 0.6; d.ay *= 0.6; d.az *= 0.6;
        } else { d.vy = 0; const f = Math.exp(-5 * dt); d.vx *= f; d.vz *= f; d.ax *= f; d.ay *= f; d.az *= f; }
      }
      for (const b of boxes) {
        if (p.y > b.h + d.r) continue;
        if (p.x > b.x0 - d.r && p.x < b.x1 + d.r && p.z > b.z0 - d.r && p.z < b.z1 + d.r) {
          const l = p.x - (b.x0 - d.r), rr = b.x1 + d.r - p.x, t = p.z - (b.z0 - d.r), bt = b.z1 + d.r - p.z, m = Math.min(l, rr, t, bt);
          if (m === l) { p.x = b.x0 - d.r; d.vx = -Math.abs(d.vx) * 0.5; } else if (m === rr) { p.x = b.x1 + d.r; d.vx = Math.abs(d.vx) * 0.5; }
          else if (m === t) { p.z = b.z0 - d.r; d.vz = -Math.abs(d.vz) * 0.5; } else { p.z = b.z1 + d.r; d.vz = Math.abs(d.vz) * 0.5; }
        }
      }
      const sp = Math.abs(d.vx) + Math.abs(d.vz) + Math.abs(d.vy);
      if (sp > 0.3) { d.m.rotation.x += d.ax * dt; d.m.rotation.y += d.ay * dt; d.m.rotation.z += d.az * dt; } else d.rest += dt;
    }
  }
  clear() { for (const d of this.items) d.m.visible = false; }
}
