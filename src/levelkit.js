// Shared level-building helpers: ground layers, placing buildings with colliders, scatter filters.
import * as THREE from 'three';
import { mat, getWindows } from './geo.js';

export const ROT = { S: 0, N: Math.PI, E: Math.PI / 2, W: -Math.PI / 2 };   // where the FRONT looks: S = +z, N = -z, E = +x, W = -x

// flat ground layers draw first, in order, without touching the depth buffer (no z-fighting at any distance)
export const flat = (name, order) => { const m = mat(name).clone(); m.depthWrite = false; m.userData.order = order; return m; };
export function tiledPlane(w, h, u, v, material) {
  const g = new THREE.PlaneGeometry(w, h), uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * u, uv.getY(i) * v);
  const m = new THREE.Mesh(g, material); m.rotation.x = -Math.PI / 2;
  if (material.userData.order !== undefined) m.renderOrder = material.userData.order;
  return m;
}

// Merge every static mesh of a building into one mesh per (material, renderOrder): thousands of tiny meshes become a few dozen draw calls.
// Shatterable windows (geo.getWindows), sprites, instanced meshes and anything flagged userData.keep stay separate.
export function mergeStatic(root) {
  root.updateMatrixWorld(true);
  const skip = new Set(getWindows().map((w) => w.mesh));
  const inv = new THREE.Matrix4().copy(root.matrixWorld).invert();
  const buckets = new Map(), dead = [], v = new THREE.Vector3(), nrm = new THREE.Vector3();
  root.traverse((o) => {
    if (!o.isMesh || o.isInstancedMesh || o.isSkinnedMesh || skip.has(o) || o.userData.keep || !o.visible) return;
    const geo = o.geometry, pos = geo.attributes.position; if (!pos) return;
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    const m = new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld), nm = new THREE.Matrix3().getNormalMatrix(m), flip = m.determinant() < 0;
    const total = geo.index ? geo.index.count : pos.count;
    const groups = Array.isArray(o.material) ? geo.groups : [{ start: 0, count: total, materialIndex: 0 }];
    for (const gr of groups) {
      const mt = mats[gr.materialIndex]; if (!mt) continue;
      const key = mt.uuid + '|' + o.renderOrder;
      if (!buckets.has(key)) buckets.set(key, { mt, ro: o.renderOrder, pos: [], nor: [], uv: [] });
      const b = buckets.get(key), nor = geo.attributes.normal, uv = geo.attributes.uv, idx = geo.index;
      const end = Math.min(total, gr.start + gr.count);
      for (let i = gr.start; i + 2 < end + 0; i += 3) {
        const tri = flip ? [2, 1, 0] : [0, 1, 2];
        for (const k of tri) {
          const vi = idx ? idx.getX(i + k) : i + k;
          v.fromBufferAttribute(pos, vi).applyMatrix4(m); b.pos.push(v.x, v.y, v.z);
          if (nor) { nrm.fromBufferAttribute(nor, vi).applyMatrix3(nm).normalize(); b.nor.push(nrm.x, nrm.y, nrm.z); } else b.nor.push(0, 1, 0);
          if (uv) b.uv.push(uv.getX(vi), uv.getY(vi)); else b.uv.push(0, 0);
        }
      }
    }
    dead.push(o);
  });
  for (const o of dead) { o.parent.remove(o); o.geometry.dispose(); }
  for (const b of buckets.values()) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(b.pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(b.nor, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(b.uv, 2));
    const mesh = new THREE.Mesh(g, b.mt); mesh.renderOrder = b.ro; root.add(mesh);
  }
  return root;
}

export function makeKit(scene, boxes) {
  const box = (x0, x1, z0, z1, h, hidden = false) => { boxes.push({ x0, x1, z0, z1, h, ...(hidden ? { vis: false } : {}) }); };
  const lay = (name, order, x0, x1, z0, z1, tile = 5) => {
    const m = tiledPlane(x1 - x0, z1 - z0, (x1 - x0) / tile, (z1 - z0) / tile, flat(name, order));
    m.position.set((x0 + x1) / 2, 0, (z0 + z1) / 2); scene.add(m); return m;
  };
  // put a building group at (x,z) facing f; adds colliders from userData.cols (local rects) or the w×d box; s = uniform scale
  function put(g, x, z, f, { s = 1, solid = true, hidden = false, size = null } = {}) {
    mergeStatic(g);
    g.position.set(x, 0, z); g.rotation.y = ROT[f]; g.scale.setScalar(s); scene.add(g);
    if (!solid) return g;
    const ud = size ? { ...g.userData, ...size } : g.userData, rot = ROT[f], c = Math.cos(rot), sn = Math.sin(rot);
    const rects = ud.cols ? ud.cols : [[-ud.w / 2, ud.w / 2, -ud.d / 2, ud.d / 2, ud.h]];
    for (const [a0, a1, b0, b1, h] of rects) {
      const pts = [[a0 * s, b0 * s], [a1 * s, b0 * s], [a0 * s, b1 * s], [a1 * s, b1 * s]].map(([lx, lz]) => [x + lx * c + lz * sn, z - lx * sn + lz * c]);
      box(Math.min(...pts.map((p) => p[0])), Math.max(...pts.map((p) => p[0])), Math.min(...pts.map((p) => p[1])), Math.max(...pts.map((p) => p[1])), h * s, hidden);
    }
    return g;
  }
  // local → world transform of a point for a building placed with put()
  const toWorld = (x, z, f, lx, lz, s = 1) => { const rot = ROT[f], c = Math.cos(rot), sn = Math.sin(rot); return { x: x + (lx * c + lz * sn) * s, z: z + (-lx * sn + lz * c) * s }; };
  const free = (x, z, m = 2, hMin = 1) => !boxes.some((b) => b.h > hMin && x > b.x0 - m && x < b.x1 + m && z > b.z0 - m && z < b.z1 + m);
  return { box, lay, put, toWorld, free };
}
