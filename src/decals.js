// Bullet holes, scorch marks and blood splats stuck onto walls and the ground.
import * as THREE from 'three';
import { makeCanvas, toTexture, mulberry } from './textures.js';

const cache = {};
function textures() {
  if (cache.ready) return cache;
  const r = mulberry(404);
  cache.bullet = [0, 1].map((v) => toTexture(makeCanvas(64, 64, (g) => {
    g.clearRect(0, 0, 64, 64);
    g.fillStyle = 'rgba(40,36,32,0.55)'; g.beginPath();
    for (let i = 0; i < 14; i++) { const a = (i / 14) * 6.283, rad = 13 + r() * 9; g.lineTo(32 + Math.cos(a) * rad, 32 + Math.sin(a) * rad); }
    g.closePath(); g.fill();
    g.fillStyle = 'rgba(200,196,188,0.55)'; for (let i = 0; i < 6; i++) { const a = r() * 6.283; g.fillRect(32 + Math.cos(a) * 15, 32 + Math.sin(a) * 15, 3, 2); }
    g.fillStyle = 'rgba(8,8,8,0.95)'; g.beginPath(); g.arc(32, 32, 5 + v, 0, 7); g.fill();
    g.strokeStyle = 'rgba(20,20,20,0.5)'; g.lineWidth = 1;
    for (let i = 0; i < 5; i++) { const a = r() * 6.283; g.beginPath(); g.moveTo(32, 32); g.lineTo(32 + Math.cos(a) * (14 + r() * 12), 32 + Math.sin(a) * (14 + r() * 12)); g.stroke(); }
  }), false));
  cache.scorch = [0, 1].map(() => toTexture(makeCanvas(128, 128, (g) => {
    g.clearRect(0, 0, 128, 128);
    for (let i = 0; i < 26; i++) {
      const x = 64 + (r() - 0.5) * 46, y = 64 + (r() - 0.5) * 46, rad = 16 + r() * 30;
      const rg = g.createRadialGradient(x, y, 2, x, y, rad);
      rg.addColorStop(0, 'rgba(8,6,4,0.55)'); rg.addColorStop(0.7, 'rgba(14,10,6,0.25)'); rg.addColorStop(1, 'rgba(14,10,6,0)');
      g.fillStyle = rg; g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
    }
    for (let i = 0; i < 18; i++) { const a = r() * 6.283, l = 30 + r() * 30; g.strokeStyle = 'rgba(10,8,6,0.35)'; g.lineWidth = 1 + r() * 2; g.beginPath(); g.moveTo(64, 64); g.lineTo(64 + Math.cos(a) * l, 64 + Math.sin(a) * l); g.stroke(); }
  }), false));
  cache.blood = [0, 1, 2].map(() => toTexture(makeCanvas(64, 64, (g) => {
    g.clearRect(0, 0, 64, 64);
    g.fillStyle = 'rgba(30,70,20,0.92)';
    for (let i = 0; i < 9; i++) { g.beginPath(); g.arc(32 + (r() - 0.5) * 24, 32 + (r() - 0.5) * 24, 4 + r() * 9, 0, 7); g.fill(); }
    g.fillStyle = 'rgba(48,100,28,0.9)';
    for (let i = 0; i < 6; i++) { g.beginPath(); g.arc(32 + (r() - 0.5) * 34, 32 + (r() - 0.5) * 34, 1 + r() * 3, 0, 7); g.fill(); }
    g.fillStyle = 'rgba(20,50,12,0.9)'; for (let i = 0; i < 4; i++) { g.beginPath(); g.arc(32 + (r() - 0.5) * 18, 32 + (r() - 0.5) * 18, 3 + r() * 4, 0, 7); g.fill(); }
  }), false));
  cache.ready = true;
  return cache;
}

export class Decals {
  constructor(scene, max = 260) {
    const T = textures();
    this.scene = scene; this.max = max; this.i = 0;
    this.geo = new THREE.PlaneGeometry(1, 1);
    const GROUND = [new THREE.Plane(new THREE.Vector3(0, 1, 0), 0.005)];   // a mark stuck to a wall near the floor must not dip below it: cut off everything under y = 0
    const mat = (map) => new THREE.MeshLambertMaterial({ map, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3, clippingPlanes: GROUND });
    this.mats = { bullet: T.bullet.map(mat), scorch: T.scorch.map(mat), blood: T.blood.map(mat) };
    this.meshes = [];
    for (let k = 0; k < max; k++) {
      const m = new THREE.Mesh(this.geo, this.mats.bullet[0]);
      m.visible = false; m.receiveShadow = true; m.renderOrder = -5;
      scene.add(m); this.meshes.push(m);
    }
    this.z = new THREE.Vector3(0, 0, 1);
  }
  // kind: 'bullet' | 'scorch' | 'blood'; pos/normal are {x,y,z}
  add(kind, pos, n, size) {
    const m = this.meshes[this.i++ % this.max], list = this.mats[kind];
    m.material = list[(Math.random() * list.length) | 0];
    const nv = new THREE.Vector3(n.x, n.y, n.z).normalize();
    m.quaternion.setFromUnitVectors(this.z, nv);
    m.quaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(nv, Math.random() * 6.283));
    m.position.set(pos.x + nv.x * 0.015, pos.y + nv.y * 0.015, pos.z + nv.z * 0.015);
    m.scale.set(size, size, 1);
    m.visible = true;
  }
  clear() { for (const m of this.meshes) m.visible = false; }
}
