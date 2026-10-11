// Breakable street props: explosive barrels and wooden crates.
import * as THREE from 'three';
import { mat, color, boxT, cylT } from './geo.js';

export function makeBarrel() {
  const g = new THREE.Group();
  const red = color(0xb8352a), band = color(0xd9a62a), dark = color(0x2a2a2c);
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.4, 0.95, 14), red); body.position.y = 0.475; g.add(body);
  for (const y of [0.18, 0.78]) { const r = new THREE.Mesh(new THREE.CylinderGeometry(0.405, 0.405, 0.07, 14), dark); r.position.y = y; g.add(r); }
  const stripe = new THREE.Mesh(new THREE.CylinderGeometry(0.392, 0.392, 0.2, 14), band); stripe.position.y = 0.48; g.add(stripe);
  const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.04, 14), dark); lid.position.y = 0.96; g.add(lid);
  // little hazard triangle
  const tri = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.14, 3), color(0x1a1a1a)); tri.position.set(0, 0.48, 0.4); tri.rotation.x = Math.PI / 2; g.add(tri);
  return g;
}
export function makeCrate(size = 1.1) {
  const g = new THREE.Group();
  const m = boxT(size, size, size, mat('crate'), 1); m.position.y = size / 2; g.add(m);
  return g;
}
