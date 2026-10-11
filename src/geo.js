// Geometry / material helpers shared by the level builders.
import * as THREE from 'three';
import { tex, toTexture, windowCanvas, doorCanvas, archDecal } from './textures.js';

const mats = {};
export function mat(name, opts = {}) {
  const key = name + JSON.stringify(opts);
  if (!mats[key]) {
    mats[key] = new THREE.MeshLambertMaterial({
      map: tex(name), side: opts.double ? THREE.DoubleSide : THREE.FrontSide,
    });
  }
  return mats[key];
}
const flat = {};
export function color(hex, opts = {}) {
  const key = hex + JSON.stringify(opts);
  if (!flat[key]) flat[key] = new THREE.MeshLambertMaterial({ color: hex, emissive: opts.emissive || 0x000000 });
  return flat[key];
}

// Box with UVs scaled so a texture tile covers `tile` world units.
export function boxT(w, h, d, material, tile = 2) {
  const g = new THREE.BoxGeometry(w, h, d);
  const uv = g.attributes.uv;
  const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) {
    const [a, b] = dims[f];
    for (let i = 0; i < 4; i++) {
      const k = f * 4 + i;
      uv.setXY(k, (uv.getX(k) * a) / tile, (uv.getY(k) * b) / tile);
    }
  }
  return new THREE.Mesh(g, material);
}
export function place(mesh, x, y, z) { mesh.position.set(x, y, z); return mesh; }

// Cylinder (n sides) with tiled UVs.
export function cylT(rTop, rBot, h, n, material, tile = 2) {
  const g = new THREE.CylinderGeometry(rTop, rBot, h, n, 1, false);
  const uv = g.attributes.uv;
  const circ = Math.PI * 2 * Math.max(rTop, rBot);
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) * circ) / tile, (uv.getY(i) * h) / tile);
  return new THREE.Mesh(g, material);
}

// Gable roof: ridge runs along local X. Origin = centre of wall top.
export function gableRoof(w, d, rise, over, roofMat, gableMat, tile = 2) {
  const grp = new THREE.Group();
  const L = w + 2 * over, hz = d / 2 + over;
  const slope = Math.hypot(hz, rise);
  for (const s of [1, -1]) {
    const pos = new Float32Array([
      -L / 2, 0, s * hz, L / 2, 0, s * hz, L / 2, rise, 0,
      -L / 2, 0, s * hz, L / 2, rise, 0, -L / 2, rise, 0,
    ]);
    const uvs = new Float32Array([0, 0, L / tile, 0, L / tile, slope / tile, 0, 0, L / tile, slope / tile, 0, slope / tile]);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    g.computeVertexNormals();
    grp.add(new THREE.Mesh(g, roofMat));
  }
  const h0 = rise * (1 - d / 2 / hz);
  for (const s of [1, -1]) {
    const x = (s * w) / 2;
    const P = [[-d / 2, 0], [d / 2, 0], [d / 2, h0], [0, rise], [-d / 2, h0]];
    const tris = [[0, 1, 2], [0, 2, 3], [0, 3, 4]];
    const pos = [], uvs = [];
    for (const t of tris) for (const i of t) { pos.push(x, P[i][1], P[i][0]); uvs.push(P[i][0] / tile, P[i][1] / tile); }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    g.computeVertexNormals();
    grp.add(new THREE.Mesh(g, gableMat));
  }
  return grp;
}

// Onion dome with a cross on top. Returns group with origin at the base.
export function onionDome(R, h, domeMat, crossMat) {
  const grp = new THREE.Group();
  const pts = [];
  for (let i = 0; i <= 18; i++) {
    const t = i / 18;
    pts.push(new THREE.Vector2(Math.max(0.001, R * Math.sin(Math.PI * Math.pow(t, 0.72)) * (1 - 0.08 * t)), t * h * 0.82));
  }
  const g = new THREE.LatheGeometry(pts, 12);
  const uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 4, uv.getY(i) * 3);
  const dome = new THREE.Mesh(g, domeMat);
  grp.add(dome);
  const top = h * 0.82;
  grp.add(place(new THREE.Mesh(new THREE.BoxGeometry(0.07 * R + 0.04, 0.55 * R + 0.3, 0.07 * R + 0.04), crossMat), 0, top + 0.28 * R + 0.1, 0));
  grp.add(place(new THREE.Mesh(new THREE.BoxGeometry(0.3 * R + 0.1, 0.06 * R + 0.03, 0.06 * R + 0.03), crossMat), 0, top + 0.3 * R + 0.2, 0));
  return grp;
}

// Flat decal plane facing +Z (so a window / door / arch on a wall).
const decalCache = {};
export function decal(kind, w, h, x, y, z, opts = {}) {
  const key = kind + (opts.c || '') + (opts.lit ? 'L' : '');
  if (!decalCache[key]) {
    let canvas;
    if (kind === 'window') canvas = windowCanvas(opts.c || '#a83a2a', !!opts.lit);
    else if (kind === 'door') canvas = doorCanvas(opts.c || '#6a4220');
    else canvas = archDecal(48, 64);
    const t = toTexture(canvas, false);
    decalCache[key] = new THREE.MeshBasicMaterial({ map: t, transparent: true, alphaTest: 0.5, side: THREE.DoubleSide });
    if (!opts.lit && kind !== 'arch') decalCache[key] = new THREE.MeshLambertMaterial({ map: t, transparent: true, alphaTest: 0.5, side: THREE.DoubleSide });
  }
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), decalCache[key]);
  m.position.set(x, y, z);
  return m;
}

export function plane(material, w, h, x, y, z) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), material);
  m.position.set(x, y, z);
  return m;
}

// ---------- collision / ray helpers (XZ boxes with a height) ----------
export function resolveCircle(pos, r, boxes) {
  for (let it = 0; it < 2; it++) {
    for (const b of boxes) {
      if (pos.y !== undefined && pos.y > b.h) continue;
      const cx = Math.min(Math.max(pos.x, b.x0), b.x1);
      const cz = Math.min(Math.max(pos.z, b.z0), b.z1);
      const dx = pos.x - cx, dz = pos.z - cz, d2 = dx * dx + dz * dz;
      if (d2 >= r * r) continue;
      if (d2 > 1e-9) {
        const d = Math.sqrt(d2);
        pos.x += (dx / d) * (r - d); pos.z += (dz / d) * (r - d);
      } else {
        const l = pos.x - b.x0, rr = b.x1 - pos.x, t = pos.z - b.z0, bt = b.z1 - pos.z;
        const m = Math.min(l, rr, t, bt);
        if (m === l) pos.x = b.x0 - r; else if (m === rr) pos.x = b.x1 + r;
        else if (m === t) pos.z = b.z0 - r; else pos.z = b.z1 + r;
      }
    }
  }
}

// Distance along ray (unit dir) to box, or Infinity.
export function rayBox(o, d, b) {
  let t0 = 0, t1 = Infinity;
  const slab = (oo, dd, lo, hi) => {
    if (Math.abs(dd) < 1e-9) return oo >= lo && oo <= hi;
    let a = (lo - oo) / dd, c = (hi - oo) / dd;
    if (a > c) [a, c] = [c, a];
    t0 = Math.max(t0, a); t1 = Math.min(t1, c);
    return t0 <= t1;
  };
  if (!slab(o.x, d.x, b.x0, b.x1)) return Infinity;
  if (!slab(o.y, d.y, 0, b.h)) return Infinity;
  if (!slab(o.z, d.z, b.z0, b.z1)) return Infinity;
  return t0;
}

export function rayCyl(o, d, cx, cz, r, y0, y1) {
  const ox = o.x - cx, oz = o.z - cz;
  const a = d.x * d.x + d.z * d.z;
  if (a < 1e-9) return Infinity;
  const b = 2 * (ox * d.x + oz * d.z), c = ox * ox + oz * oz - r * r;
  const disc = b * b - 4 * a * c;
  if (disc < 0) return Infinity;
  const s = Math.sqrt(disc);
  let t = (-b - s) / (2 * a);
  if (t < 0) { t = (-b + s) / (2 * a); if (t < 0) return Infinity; }
  const y = o.y + d.y * t;
  return y < y0 || y > y1 ? Infinity : t;
}
