// First-person weapons as low-poly 3D models, drawn in their own scene on top of the world.
// Rule: a weapon never covers the crosshair. Each model has a `tip` (screen position of its muzzle) and
// WeaponView.align() slides the model so the tip lands there: low and to the right of the crosshair.
import * as THREE from 'three';
import { RoundedBoxGeometry } from '../vendor/RoundedBoxGeometry.js';
import { makeCanvas, toTexture, mulberry, tex } from './textures.js';

const TIP_RIGHT = 0.03;   // how much further right (screen units) the weapons sit
const AIM_DIST = 12;      // the barrel points at the spot AIM_DIST metres straight ahead, so shots seem to leave the muzzle and land on the crosshair
// ---------- materials ----------
function makeMaterials() {
  const scuff = toTexture(makeCanvas(64, 64, (g) => {
    const r = mulberry(3);
    g.fillStyle = '#fff'; g.fillRect(0, 0, 64, 64);
    for (let i = 0; i < 380; i++) { g.fillStyle = `rgba(0,0,0,${0.05 + r() * 0.22})`; g.fillRect((r() * 64) | 0, (r() * 64) | 0, 1 + ((r() * 4) | 0), 1); }
  }));
  const grain = toTexture(makeCanvas(32, 128, (g) => {
    const r = mulberry(8);
    g.fillStyle = '#b0733a'; g.fillRect(0, 0, 32, 128);
    for (let i = 0; i < 70; i++) { g.fillStyle = r() < 0.5 ? 'rgba(60,28,8,0.35)' : 'rgba(255,200,130,0.18)'; g.fillRect((r() * 32) | 0, (r() * 128) | 0, 1, 6 + ((r() * 40) | 0)); }
  }));
  const S = (color, metalness, roughness, map) => new THREE.MeshStandardMaterial({ color, metalness, roughness, map: map || null });
  return {
    steel: S(0x7a828d, 0.9, 0.34, scuff),
    blued: S(0x353a43, 0.9, 0.3, scuff),
    poly: S(0x2a2d33, 0.15, 0.55, scuff),
    wood: S(0xc78443, 0.0, 0.5, grain),
    brass: S(0xd9ad45, 1.0, 0.28),
    copper: S(0xc0693a, 1.0, 0.3),
    olive: S(0x59673f, 0.25, 0.55, scuff),
    skin: S(0xc29478, 0.0, 0.62),
    sleeve: new THREE.MeshLambertMaterial({ color: 0x4a563d }),
    cuff: new THREE.MeshLambertMaterial({ color: 0x232a1c }),
    blade: S(0xc8d0da, 1.0, 0.16),
    leather: S(0x4a2d1a, 0.0, 0.7),
    dark: new THREE.MeshBasicMaterial({ color: 0x050607 }),
    glowCyan: new THREE.MeshBasicMaterial({ color: 0x5ae0ff }),
    glowGreen: new THREE.MeshBasicMaterial({ color: 0x6aff7a }),
    glowRed: new THREE.MeshBasicMaterial({ color: 0xff5030 }),
    shellRed: S(0xb8352a, 0.0, 0.5),
    ice: new THREE.MeshStandardMaterial({ color: 0xa8e8ff, emissive: 0x2a8ab0, emissiveIntensity: 0.6, metalness: 0.1, roughness: 0.15 }),
  };
}

// ---------- helpers ----------
const rbox = (w, h, d, r, m) => new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 3, Math.max(0.0004, Math.min(r, w / 2 - 0.0003, h / 2 - 0.0003, d / 2 - 0.0003))), m);
const box = (w, h, d, m) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
const at = (o, x, y, z) => { o.position.set(x, y, z); return o; };
const sphere = (r, m, x, y, z) => at(new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), m), x, y, z);
// cylinder along -Z starting at z=0; rFar is the far (-z) radius
function zcyl(rFar, rNear, len, m, seg = 16) {
  const g = new THREE.CylinderGeometry(rFar, rNear, len, seg);
  g.rotateX(-Math.PI / 2); g.translate(0, 0, -len / 2);
  return new THREE.Mesh(g, m);
}
function zring(r, tube, m) { return new THREE.Mesh(new THREE.TorusGeometry(r, tube, 6, 20), m); }
function limb(a, b, r0, r1, m) {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), d = B.clone().sub(A), len = d.length();
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r1, r0, len, 14), m);
  mesh.position.copy(A).addScaledVector(d, 0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
  return mesh;
}
// forearm with cuff and sleeve, from the wrist backwards/downwards off screen
function arm(M, wrist, dir, len = 0.5, r = 0.03) {
  const g = new THREE.Group();
  const P = (t) => [wrist[0] + dir[0] * t, wrist[1] + dir[1] * t, wrist[2] + dir[2] * t];
  g.add(limb(wrist, P(0.06), r * 0.85, r * 0.9, M.skin));
  g.add(limb(P(0.06), P(0.085), r * 1.12, r * 1.12, M.cuff));
  g.add(limb(P(0.085), P(len), r * 1.2, r * 1.5, M.sleeve));
  g.userData.skip = true;
  return g;
}
// back of a hand with knuckles gripping something (no finger sausages)
function hand(M, x, y, z, w = 0.058, h = 0.044, d = 0.085) {
  const g = new THREE.Group();
  const back = rbox(w, h, d, 0.016, M.skin); back.position.set(x, y, z); g.add(back);
  for (let i = 0; i < 4; i++) g.add(sphere(w * 0.15, M.skin, x - w * 0.36 + i * (w * 0.24), y - h * 0.1, z - d * 0.5));
  g.userData.skip = true;
  return g;
}
function glowSprite(texName, tint) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: texName === 'flame' ? tex('flame') : flashTexture(tint), blending: THREE.AdditiveBlending, depthTest: false, depthWrite: false, transparent: true }));
  s.renderOrder = 20; s.visible = false;
  return s;
}
const flashCache = {};
function flashTexture(tint) {
  if (flashCache[tint]) return flashCache[tint];
  const C = { orange: ['255,250,200', '255,200,70', '255,90,20', '180,30,0', '#ffb43a', '#fff2b8'], blue: ['235,250,255', '120,210,255', '30,110,255', '10,40,160', '#7ad0ff', '#e8fbff'], green: ['235,255,235', '110,255,130', '30,200,60', '10,110,20', '#7aff90', '#eaffea'] }[tint];
  flashCache[tint] = toTexture(makeCanvas(128, 128, (g) => {
    const rg = g.createRadialGradient(64, 64, 2, 64, 64, 62);
    rg.addColorStop(0, `rgba(${C[0]},1)`); rg.addColorStop(0.25, `rgba(${C[1]},0.95)`); rg.addColorStop(0.55, `rgba(${C[2]},0.55)`); rg.addColorStop(1, `rgba(${C[3]},0)`);
    g.fillStyle = rg; g.fillRect(0, 0, 128, 128);
    g.fillStyle = C[4];
    const r = mulberry(5);
    g.beginPath();
    for (let i = 0; i < 18; i++) { const a = (i / 18) * Math.PI * 2, rr = i % 2 ? 20 + r() * 10 : 44 + r() * 18; g.lineTo(64 + Math.cos(a) * rr, 64 + Math.sin(a) * rr); }
    g.closePath(); g.fill();
    g.fillStyle = C[5]; g.beginPath(); g.arc(64, 64, 13, 0, 7); g.fill();
  }), false);
  return flashCache[tint];
}

// ---------- models ----------
// Each returns { group, muzzle, flash (size), tint, tip:[ndcX, ndcY], rot, recoil, ...animated parts }
function buildPistol(M) {
  const g = new THREE.Group();
  g.add(at(rbox(0.034, 0.034, 0.2, 0.005, M.blued), 0, 0.017, -0.1));
  g.add(at(rbox(0.013, 0.0035, 0.19, 0.001, M.steel), 0, 0.0345, -0.1));
  for (let i = 0; i < 6; i++) for (const s of [-1, 1]) g.add(at(box(0.0025, 0.024, 0.0035, M.poly), s * 0.0172, 0.016, -0.014 - i * 0.0075));
  for (const s of [-1, 1]) { g.add(at(rbox(0.0075, 0.009, 0.009, 0.001, M.blued), s * 0.0125, 0.0385, -0.012)); g.add(at(box(0.0022, 0.0022, 0.001, M.brass), s * 0.0125, 0.0392, -0.0075)); }
  g.add(at(rbox(0.005, 0.009, 0.007, 0.001, M.blued), 0, 0.0385, -0.192)); g.add(at(box(0.0022, 0.0022, 0.001, M.brass), 0, 0.0392, -0.1885));
  g.add(at(box(0.0012, 0.012, 0.045, M.dark), 0.0175, 0.026, -0.085));
  g.add(at(zcyl(0.0075, 0.0075, 0.014, M.steel), 0, 0.013, -0.2));
  g.add(at(new THREE.Mesh(new THREE.CircleGeometry(0.0048, 12), M.dark), 0, 0.013, -0.2145));
  g.add(at(rbox(0.032, 0.024, 0.17, 0.004, M.poly), 0, -0.012, -0.09));
  g.add(at(box(0.004, 0.012, 0.055, M.poly), 0, -0.03, -0.12));
  g.add(at(box(0.004, 0.012, 0.004, M.poly), 0, -0.022, -0.095));
  const grip = rbox(0.036, 0.1, 0.052, 0.006, M.poly); grip.position.set(0, -0.078, -0.012); grip.rotation.x = -0.2; g.add(grip);
  g.add(hand(M, 0.004, -0.05, 0.026, 0.06, 0.046, 0.09));
  g.add(arm(M, [0.006, -0.065, 0.06], [0.03, -0.28, 0.96], 0.5, 0.03));
  const muzzle = new THREE.Object3D(); muzzle.position.set(0, 0.014, -0.225); g.add(muzzle);
  return { group: g, muzzle, flash: 0.12, tint: 'orange', tip: [0.14, -0.18], rot: [0.4, 0.07, 0], recoil: 1 };
}

function buildShotgun(M) {
  const g = new THREE.Group();
  g.add(at(rbox(0.05, 0.062, 0.22, 0.008, M.blued), 0, 0.0, -0.11));
  g.add(at(box(0.0012, 0.014, 0.05, M.dark), 0.0255, 0.008, -0.09));
  g.add(at(rbox(0.014, 0.003, 0.2, 0.001, M.steel), 0, 0.0315, -0.11));
  const barrel = zcyl(0.0165, 0.0175, 0.46, M.steel, 18); barrel.position.set(0, 0.014, -0.22); g.add(barrel);
  const mag = zcyl(0.0135, 0.0135, 0.34, M.blued, 14); mag.position.set(0, -0.02, -0.22); g.add(mag);
  g.add(at(rbox(0.006, 0.003, 0.44, 0.001, M.steel), 0, 0.0335, -0.44));
  for (const z of [-0.5, -0.66]) g.add(at(zcyl(0.02, 0.02, 0.012, M.poly), 0, 0.0, z));
  g.add(sphere(0.0035, M.brass, 0, 0.034, -0.675));
  g.add(at(new THREE.Mesh(new THREE.CircleGeometry(0.0155, 14), M.dark), 0, 0.014, -0.6805));
  const pump = new THREE.Group(); pump.position.set(0, -0.014, -0.34);
  pump.add(rbox(0.056, 0.05, 0.19, 0.014, M.wood));
  for (let i = 0; i < 4; i++) pump.add(at(box(0.058, 0.0015, 0.004, M.poly), 0, 0, -0.06 + i * 0.03));
  pump.add(hand(M, 0, 0.034, 0.0, 0.056, 0.034, 0.09));
  pump.add(arm(M, [-0.01, 0.03, 0.06], [-0.5, -0.4, 0.77], 0.55, 0.024));
  g.add(pump);
  const grip = rbox(0.04, 0.1, 0.05, 0.01, M.wood); grip.position.set(0, -0.075, 0.02); grip.rotation.x = -0.3; g.add(grip);
  g.add(at(box(0.004, 0.012, 0.05, M.poly), 0, -0.04, -0.03));
  g.add(hand(M, 0.006, -0.065, 0.075, 0.06, 0.046, 0.09));
  g.add(arm(M, [0.012, -0.085, 0.12], [0.2, -0.35, 0.91], 0.5, 0.026));
  const muzzle = new THREE.Object3D(); muzzle.position.set(0, 0.014, -0.7); g.add(muzzle);
  return { group: g, muzzle, flash: 0.26, tint: 'orange', tip: [0.15, -0.18], rot: [0.3, 0.04, 0], recoil: 2.2, pump, pumpZ: -0.34 };
}

function shellMesh(M) {
  const g = new THREE.Group();
  g.add(at(zcyl(0.0095, 0.0095, 0.036, M.shellRed, 12), 0, 0, -0.012));
  g.add(at(zcyl(0.0102, 0.0102, 0.014, M.brass, 12), 0, 0, 0.002));
  g.scale.setScalar(1.5);
  g.visible = false;
  return g;
}
function buildSSG(M) {
  const g = new THREE.Group();
  g.add(at(rbox(0.06, 0.06, 0.2, 0.008, M.blued), 0, 0.0, -0.1));
  g.add(at(rbox(0.016, 0.014, 0.02, 0.003, M.brass), 0, 0.03, -0.205));
  // barrels + forend + left hand hinge on the receiver so the gun can "break open" for the reload
  const PIV = [0, 0.012, -0.2];
  const hinge = new THREE.Group(); hinge.position.set(...PIV); g.add(hinge);
  const H = (o, x, y, z) => { o.position.set(x - PIV[0], y - PIV[1], z - PIV[2]); hinge.add(o); return o; };
  for (const sd of [-1, 1]) {
    H(zcyl(0.0165, 0.0175, 0.46, M.steel, 16), sd * 0.0185, 0.012, -0.2);
    H(new THREE.Mesh(new THREE.CircleGeometry(0.0125, 14), M.dark), sd * 0.0185, 0.012, -0.6605);
  }
  H(box(0.006, 0.006, 0.46, M.steel), 0, 0.03, -0.43);
  H(sphere(0.0035, M.brass, 0, 0, 0), 0, 0.0345, -0.655);
  H(rbox(0.07, 0.042, 0.17, 0.012, M.wood), 0, -0.03, -0.32);
  // the front hand (+ arm) is NOT part of the hinge: it holds the forend, then lets go during the reload and carries the shells in
  const lhGrp = new THREE.Group(); g.add(lhGrp); lhGrp.userData.skip = true;
  lhGrp.add(hand(M, 0, 0.0, -0.31, 0.058, 0.034, 0.09)); lhGrp.add(arm(M, [0, -0.02, -0.26], [-0.5, -0.4, 0.77], 0.55, 0.024));
  const grip = rbox(0.042, 0.1, 0.05, 0.01, M.wood); grip.position.set(0, -0.075, 0.02); grip.rotation.x = -0.3; g.add(grip);
  g.add(at(box(0.004, 0.012, 0.05, M.poly), 0, -0.04, -0.03));
  g.add(hand(M, 0.006, -0.065, 0.075, 0.06, 0.046, 0.09));
  g.add(arm(M, [0.012, -0.085, 0.12], [0.2, -0.35, 0.91], 0.5, 0.026));
  const spent = [shellMesh(M), shellMesh(M)], fresh = [shellMesh(M), shellMesh(M)];
  for (const sh of [...spent, ...fresh]) g.add(sh);
  const muzzle = new THREE.Object3D(); muzzle.position.set(0, 0.012, -0.69); g.add(muzzle);
  return { group: g, muzzle, flash: 0.34, tint: 'orange', tip: [0.16, -0.18], rot: [0.3, 0.04, 0], recoil: 3, ssg: { hinge, spent, fresh, lh: lhGrp } };
}

function buildChaingun(M) {
  const g = new THREE.Group();
  g.add(at(rbox(0.1, 0.085, 0.2, 0.012, M.blued), 0, -0.04, -0.1));              // housing
  g.add(at(rbox(0.05, 0.02, 0.12, 0.005, M.poly), 0, 0.012, -0.1));             // top block
  g.add(at(zcyl(0.052, 0.054, 0.09, M.steel, 20), 0, -0.03, -0.17));                  // fixed breech collar (joins housing and barrels)
  const spinner = new THREE.Group(); spinner.position.set(0, -0.03, -0.26); g.add(spinner);
  spinner.add(zcyl(0.02, 0.02, 0.5, M.poly, 12));                                  // hub
  for (let k = 0; k < 3; k++) {
    const a = (k * Math.PI * 2) / 3 + Math.PI / 6;
    const b = zcyl(0.011, 0.0125, 0.5, M.steel, 14); b.position.set(Math.cos(a) * 0.027, Math.sin(a) * 0.027, 0); spinner.add(b);
    spinner.add(at(new THREE.Mesh(new THREE.CircleGeometry(0.0085, 10), M.dark), Math.cos(a) * 0.027, Math.sin(a) * 0.027, -0.5005));
  }
  for (const z of [-0.04, -0.22, -0.44]) spinner.add(at(zcyl(0.046, 0.046, 0.014, M.poly, 18), 0, 0, z));
  // ammo box + a belt that actually runs from the box into the gun
  const boxPos = new THREE.Vector3(-0.1, -0.1, -0.09), feed = new THREE.Vector3(-0.052, -0.035, -0.1);
  g.add(at(rbox(0.07, 0.055, 0.1, 0.008, M.olive), boxPos.x - 0.02, boxPos.y - 0.012, boxPos.z));
  for (let i = 0; i <= 7; i++) {
    const t = i / 7, p = boxPos.clone().lerp(feed, t);
    const c = zcyl(0.0065, 0.0065, 0.04, M.brass, 8); c.position.set(p.x, p.y, p.z + 0.02); g.add(c);
    g.add(at(box(0.012, 0.004, 0.034, M.poly), p.x, p.y - 0.004, p.z));
  }
  g.add(at(rbox(0.016, 0.03, 0.06, 0.004, M.poly), -0.05, -0.03, -0.1));         // feed tray
  // grip + hand
  g.add(at(rbox(0.04, 0.09, 0.05, 0.008, M.poly), 0.012, -0.11, -0.02));
  g.add(hand(M, 0.012, -0.095, 0.03, 0.062, 0.05, 0.09));
  g.add(arm(M, [0.012, -0.115, 0.07], [0.1, -0.3, 0.95], 0.55, 0.032));
  const muzzle = new THREE.Object3D(); muzzle.position.set(0, -0.03, -0.78); g.add(muzzle);
  return { group: g, muzzle, flash: 0.2, tint: 'orange', tip: [0.21, -0.22], rot: [0.28, 0.06, 0], recoil: 0.7, spinner };
}

function buildRocket(M) {
  const g = new THREE.Group();
  g.add(at(zcyl(0.05, 0.052, 0.62, M.olive, 20), 0, 0, -0.08));
  const flare = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 0.09, 20, 1, true), M.olive); flare.rotation.x = Math.PI / 2; flare.position.set(0, 0, 0.0); g.add(flare);
  g.add(at(zcyl(0.055, 0.055, 0.016, M.poly, 20), 0, 0, -0.68));
  g.add(at(rbox(0.012, 0.03, 0.2, 0.004, M.poly), 0, 0.063, -0.3));
  g.add(at(rbox(0.01, 0.014, 0.01, 0.002, M.steel), 0, 0.085, -0.4));
  const warhead = new THREE.Group();
  warhead.add(at(zcyl(0.032, 0.032, 0.08, M.steel, 14), 0, 0, -0.68));
  const cone = new THREE.Mesh(new THREE.ConeGeometry(0.032, 0.1, 14), M.glowRed); cone.rotation.x = -Math.PI / 2; cone.position.set(0, 0, -0.81); warhead.add(cone);
  g.add(warhead);
  g.add(at(rbox(0.04, 0.09, 0.05, 0.008, M.poly), 0, -0.1, -0.06));
  g.add(hand(M, 0, -0.095, -0.01, 0.062, 0.05, 0.09));
  g.add(arm(M, [0.0, -0.115, 0.03], [0.2, -0.3, 0.93], 0.55, 0.032));
  g.add(hand(M, 0, -0.07, -0.4, 0.06, 0.05, 0.09));
  g.add(arm(M, [-0.01, -0.07, -0.35], [-0.5, -0.35, 0.79], 0.6, 0.03));
  const muzzle = new THREE.Object3D(); muzzle.position.set(0, 0, -0.86); g.add(muzzle);
  return { group: g, muzzle, flash: 0.3, tint: 'orange', tip: [0.22, -0.18], rot: [0.26, 0.07, 0], recoil: 1.6, warhead };
}

function buildGrenade(M) {
  const g = new THREE.Group();
  g.add(at(rbox(0.06, 0.07, 0.17, 0.01, M.blued), 0, -0.01, -0.08));
  const drum = new THREE.Group(); drum.position.set(0, 0.012, -0.16);
  drum.add(at(zcyl(0.052, 0.052, 0.08, M.steel, 18), 0, 0, 0.04));
  for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2; drum.add(at(new THREE.Mesh(new THREE.CircleGeometry(0.013, 10), M.dark), Math.cos(a) * 0.03, Math.sin(a) * 0.03, 0.0805)); }
  g.add(drum);
  g.add(at(zcyl(0.027, 0.029, 0.36, M.steel, 16), 0, 0.012, -0.2));
  g.add(at(new THREE.Mesh(new THREE.CircleGeometry(0.0205, 14), M.dark), 0, 0.012, -0.5605));
  g.add(at(rbox(0.012, 0.012, 0.3, 0.003, M.poly), 0, 0.045, -0.35));
  g.add(at(rbox(0.008, 0.02, 0.01, 0.002, M.steel), 0, 0.06, -0.52));
  g.add(at(rbox(0.04, 0.1, 0.05, 0.01, M.wood), 0, -0.095, -0.03));
  g.add(hand(M, 0.003, -0.085, 0.02, 0.06, 0.05, 0.09));
  g.add(arm(M, [0.0, -0.105, 0.06], [0.2, -0.3, 0.93], 0.55, 0.03));
  g.add(hand(M, 0, -0.05, -0.34, 0.056, 0.04, 0.09));
  g.add(arm(M, [-0.01, -0.05, -0.3], [-0.5, -0.35, 0.79], 0.6, 0.028));
  const muzzle = new THREE.Object3D(); muzzle.position.set(0, 0.012, -0.58); g.add(muzzle);
  return { group: g, muzzle, flash: 0.22, tint: 'orange', tip: [0.19, -0.18], rot: [0.28, 0.06, 0], recoil: 1.2, drum };
}

function buildPlasma(M) {
  const g = new THREE.Group();
  g.add(at(rbox(0.062, 0.07, 0.3, 0.012, M.blued), 0, 0, -0.15));
  for (const s of [-1, 1]) g.add(at(box(0.003, 0.014, 0.22, M.glowCyan), s * 0.032, 0.006, -0.16));
  g.add(at(rbox(0.04, 0.012, 0.22, 0.004, M.steel), 0, 0.04, -0.15));
  g.add(at(zcyl(0.02, 0.024, 0.3, M.poly, 14), 0, 0.004, -0.3));
  g.add(at(zcyl(0.011, 0.011, 0.32, M.glowCyan, 8), 0, 0.004, -0.3));
  for (const z of [-0.36, -0.46, -0.56]) g.add(at(zring(0.03, 0.008, M.blued), 0, 0.004, z));
  g.add(sphere(0.022, M.glowCyan, 0, 0.004, -0.62));
  for (const s of [-1, 1]) { const f = rbox(0.004, 0.05, 0.12, 0.002, M.steel); f.position.set(s * 0.038, 0.01, -0.3); f.rotation.z = s * 0.35; g.add(f); }
  g.add(at(rbox(0.04, 0.036, 0.1, 0.008, M.glowCyan), 0, -0.05, -0.18));
  g.add(at(rbox(0.04, 0.09, 0.05, 0.01, M.poly), 0, -0.085, -0.02));
  g.add(hand(M, 0.003, -0.078, 0.03, 0.06, 0.05, 0.09));
  g.add(arm(M, [0.0, -0.1, 0.07], [0.2, -0.3, 0.93], 0.55, 0.03));
  const muzzle = new THREE.Object3D(); muzzle.position.set(0, 0.004, -0.64); g.add(muzzle);
  return { group: g, muzzle, flash: 0.17, tint: 'blue', tip: [0.16, -0.18], rot: [0.3, 0.05, 0], recoil: 0.5 };
}

function buildFrost(M) {
  const g = new THREE.Group();
  g.add(at(rbox(0.07, 0.08, 0.3, 0.012, M.blued), 0, 0, -0.15));
  g.add(at(zcyl(0.036, 0.036, 0.24, M.ice, 14), 0, 0.066, -0.04));                 // coolant canister on top
  for (const z of [-0.0, -0.1, -0.2]) g.add(at(zring(0.038, 0.006, M.steel), 0, 0.066, z));
  g.add(at(zcyl(0.03, 0.034, 0.3, M.poly, 14), 0, 0, -0.3));                       // barrel
  g.add(at(zcyl(0.058, 0.032, 0.14, M.steel, 14), 0, 0, -0.5));                    // flared nozzle
  g.add(at(zcyl(0.048, 0.048, 0.02, M.glowCyan, 14), 0, 0, -0.645));
  for (const z of [-0.36, -0.44]) g.add(at(zring(0.036, 0.007, M.glowCyan), 0, 0, z));
  for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2, c = new THREE.Mesh(new THREE.ConeGeometry(0.012, 0.07, 5), M.ice); c.rotation.x = -Math.PI / 2; c.position.set(Math.sin(a) * 0.062, Math.cos(a) * 0.062, -0.5); g.add(c); }
  g.add(at(rbox(0.04, 0.09, 0.05, 0.01, M.poly), 0, -0.085, -0.02));
  g.add(hand(M, 0.003, -0.078, 0.03, 0.06, 0.05, 0.09));
  g.add(arm(M, [0.0, -0.1, 0.07], [0.2, -0.3, 0.93], 0.55, 0.03));
  const muzzle = new THREE.Object3D(); muzzle.position.set(0, 0, -0.66); g.add(muzzle);
  return { group: g, muzzle, flash: 0.2, tint: 'blue', tip: [0.17, -0.18], rot: [0.3, 0.05, 0], recoil: 0.7 };
}

function buildFlamer(M) {
  const g = new THREE.Group();
  g.add(at(rbox(0.05, 0.06, 0.18, 0.01, M.blued), 0, 0, -0.09));
  g.add(at(zcyl(0.02, 0.022, 0.46, M.steel, 14), 0, 0.006, -0.18));
  g.add(at(zcyl(0.03, 0.02, 0.07, M.poly, 14), 0, 0.006, -0.64));
  g.add(at(new THREE.Mesh(new THREE.CircleGeometry(0.022, 12), M.dark), 0, 0.006, -0.7105));
  g.add(at(rbox(0.008, 0.02, 0.01, 0.002, M.steel), 0, 0.045, -0.5));
  // fuel tank on the left with a hose to the gun
  const tank = zcyl(0.048, 0.048, 0.34, M.olive, 18); tank.position.set(-0.098, -0.03, -0.02); g.add(tank);
  g.add(at(zcyl(0.04, 0.048, 0.03, M.poly, 18), -0.098, -0.03, -0.36));
  g.add(limb([-0.098, -0.03, -0.3], [-0.03, -0.01, -0.3], 0.007, 0.007, M.poly));
  g.add(limb([-0.03, -0.01, -0.3], [-0.015, 0.0, -0.3], 0.01, 0.01, M.brass));
  g.add(at(rbox(0.04, 0.09, 0.05, 0.01, M.poly), 0, -0.085, 0.0));
  g.add(hand(M, 0.003, -0.078, 0.05, 0.06, 0.05, 0.09));
  g.add(arm(M, [0.0, -0.1, 0.09], [0.2, -0.3, 0.93], 0.55, 0.03));
  g.add(hand(M, 0, -0.03, -0.3, 0.054, 0.04, 0.09));
  g.add(arm(M, [-0.01, -0.03, -0.26], [-0.5, -0.35, 0.79], 0.6, 0.028));
  const pilot = glowSprite('flame'); pilot.visible = true; pilot.scale.setScalar(0.05); pilot.position.set(0, 0.006, -0.72); g.add(pilot);
  const muzzle = new THREE.Object3D(); muzzle.position.set(0, 0.006, -0.72); g.add(muzzle);
  return { group: g, muzzle, flash: 0.0, tint: 'orange', tip: [0.18, -0.18], rot: [0.28, 0.06, 0], recoil: 0.2, flame: true, pilot };
}

function buildRail(M) {
  const g = new THREE.Group();
  g.add(at(rbox(0.056, 0.075, 0.24, 0.01, M.blued), 0, 0, -0.12));
  for (const s of [-1, 1]) g.add(at(zcyl(0.008, 0.009, 0.5, M.copper, 10), s * 0.021, 0.014, -0.22));
  const coils = [];
  for (let i = 0; i < 4; i++) { const r = zring(0.036, 0.0065, new THREE.MeshBasicMaterial({ color: 0x3a8ab0 })); r.position.set(0, 0.014, -0.3 - i * 0.1); g.add(r); coils.push(r); }
  g.add(at(zcyl(0.005, 0.005, 0.52, M.glowCyan, 6), 0, 0.014, -0.22));
  g.add(sphere(0.015, M.glowCyan, 0, 0.014, -0.72));
  // scope
  g.add(at(zcyl(0.02, 0.022, 0.16, M.poly, 14), 0, 0.062, -0.16));
  g.add(at(new THREE.Mesh(new THREE.CircleGeometry(0.016, 12), M.glowCyan), 0, 0.062, -0.321));
  g.add(at(box(0.01, 0.025, 0.02, M.poly), 0, 0.045, -0.1)); g.add(at(box(0.01, 0.025, 0.02, M.poly), 0, 0.045, -0.2));
  g.add(at(rbox(0.04, 0.09, 0.05, 0.01, M.poly), 0, -0.085, -0.02));
  g.add(hand(M, 0.003, -0.078, 0.03, 0.06, 0.05, 0.09));
  g.add(arm(M, [0.0, -0.1, 0.07], [0.2, -0.3, 0.93], 0.55, 0.03));
  g.add(hand(M, 0, -0.05, -0.2, 0.054, 0.04, 0.09));
  g.add(arm(M, [-0.01, -0.05, -0.16], [-0.5, -0.35, 0.79], 0.6, 0.028));
  const muzzle = new THREE.Object3D(); muzzle.position.set(0, 0.014, -0.74); g.add(muzzle);
  return { group: g, muzzle, flash: 0.22, tint: 'blue', tip: [0.16, -0.18], rot: [0.3, 0.05, 0], recoil: 1.5, coils };
}

function buildBFG(M) {
  const g = new THREE.Group();
  g.add(at(rbox(0.13, 0.12, 0.3, 0.02, M.olive), 0, 0, -0.15));
  g.add(at(rbox(0.09, 0.03, 0.2, 0.008, M.blued), 0, 0.075, -0.15));
  g.add(at(zcyl(0.075, 0.082, 0.2, M.blued, 22), 0, 0, -0.3));
  g.add(at(zring(0.078, 0.012, M.glowGreen), 0, 0, -0.46));
  g.add(at(zcyl(0.05, 0.05, 0.02, M.glowGreen, 18), 0, 0, -0.5));
  g.add(at(new THREE.Mesh(new THREE.CircleGeometry(0.05, 18), M.glowGreen), 0, 0, -0.5205));
  for (const s of [-1, 1]) { g.add(at(zcyl(0.026, 0.026, 0.2, M.glowGreen, 10), s * 0.085, 0.01, -0.15)); g.add(at(zring(0.03, 0.006, M.poly), s * 0.085, 0.01, -0.1)); }
  g.add(at(rbox(0.05, 0.09, 0.06, 0.01, M.poly), 0, -0.1, -0.03));
  g.add(hand(M, 0.003, -0.095, 0.02, 0.07, 0.055, 0.1));
  g.add(arm(M, [0.0, -0.12, 0.07], [0.2, -0.3, 0.93], 0.55, 0.034));
  g.add(hand(M, 0, -0.085, -0.3, 0.07, 0.05, 0.1));
  g.add(arm(M, [-0.01, -0.085, -0.25], [-0.5, -0.35, 0.79], 0.6, 0.032));
  const muzzle = new THREE.Object3D(); muzzle.position.set(0, 0, -0.53); g.add(muzzle);
  return { group: g, muzzle, flash: 0.22, tint: 'green', tip: [0.22, -0.16], rot: [0.28, 0.06, 0], recoil: 2 };
}

function buildSabre(M) {
  const g = new THREE.Group();
  const sh = new THREE.Shape();
  sh.moveTo(-0.012, 0); sh.lineTo(-0.013, 0.2); sh.quadraticCurveTo(-0.011, 0.5, 0.045, 0.78); sh.lineTo(0.052, 0.8); sh.quadraticCurveTo(0.016, 0.5, 0.016, 0.2); sh.lineTo(0.014, 0); sh.lineTo(-0.012, 0);
  const bg = new THREE.ExtrudeGeometry(sh, { depth: 0.006, bevelEnabled: true, bevelThickness: 0.0015, bevelSize: 0.0015, bevelSegments: 1 });
  bg.translate(0, 0, -0.003);
  const blade = new THREE.Mesh(bg, M.blade); blade.position.y = 0.02; g.add(blade);
  g.add(at(box(0.0015, 0.5, 0.0072, M.steel), 0.0015, 0.28, 0));
  g.add(at(rbox(0.1, 0.012, 0.022, 0.004, M.brass), 0.0, 0.016, 0));
  g.add(at(rbox(0.012, 0.03, 0.026, 0.004, M.brass), -0.05, 0.03, 0));
  const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.0145, 0.0125, 0.12, 12), M.leather); grip.position.y = -0.05; g.add(grip);
  for (let i = 0; i < 8; i++) { const t = at(new THREE.Mesh(new THREE.TorusGeometry(0.0138, 0.0013, 4, 12), M.dark), 0, -0.1 + i * 0.0135, 0); t.rotation.x = Math.PI / 2; g.add(t); }
  g.add(sphere(0.0165, M.brass, 0, -0.118, 0));
  const fist = rbox(0.042, 0.065, 0.048, 0.015, M.skin); fist.position.set(0.0, -0.05, 0.005); fist.userData.skip = true; g.add(fist);
  for (let i = 0; i < 4; i++) { const f = sphere(0.0095, M.skin, 0.0, -0.025 - i * 0.0135, -0.022); f.userData.skip = true; g.add(f); }
  g.add(arm(M, [0.0, -0.1, 0.01], [0.15, -0.55, 0.82], 0.6, 0.028));
  g.scale.setScalar(0.72);
  const muzzle = new THREE.Object3D(); muzzle.position.set(0.05, 0.82, 0); g.add(muzzle);
  return { group: g, muzzle, flash: 0, tint: 'orange', tip: [0.26, 0.1], rot: [-0.9, 0.25, -0.35], recoil: 0, sabre: true };
}

export class WeaponView {
  constructor(renderer) {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(46, 16 / 9, 0.01, 6);
    // cool sky above, warm sunset band at the horizon, dark ground: metal picks up believable reflections
    const envTex = toTexture(makeCanvas(256, 128, (g) => {
      const gr = g.createLinearGradient(0, 0, 0, 128);
      gr.addColorStop(0, '#9fb0d0'); gr.addColorStop(0.42, '#c9c0c8'); gr.addColorStop(0.5, '#f0b078'); gr.addColorStop(0.56, '#6a5448'); gr.addColorStop(1, '#1c1815');
      g.fillStyle = gr; g.fillRect(0, 0, 256, 128);
      g.fillStyle = 'rgba(255,255,255,0.5)'; g.fillRect(40, 20, 60, 10); g.fillRect(160, 34, 50, 8);
    }), false);
    envTex.mapping = THREE.EquirectangularReflectionMapping;
    const pm = new THREE.PMREMGenerator(renderer);
    this.env = pm.fromEquirectangular(envTex).texture;
    this.scene.environment = this.env;
    this.scene.add(this.camera);
    this.scene.add(new THREE.AmbientLight(0xa08c80, 0.5));
    const key = new THREE.DirectionalLight(0xffcf9a, 2.2); key.position.set(-0.6, 1, 0.7); this.scene.add(key);
    const rim = new THREE.DirectionalLight(0x7f8fc0, 0.9); rim.position.set(0.8, 0.3, -0.5); this.scene.add(rim);
    this.key = key;
    this.light = new THREE.PointLight(0xffa040, 0, 1.2); this.scene.add(this.light);
    const M = makeMaterials();
    this.M = M;
    this.models = {
      sabre: buildSabre(M), pistol: buildPistol(M), shotgun: buildShotgun(M), ssg: buildSSG(M), chaingun: buildChaingun(M),
      rocket: buildRocket(M), grenade: buildGrenade(M), plasma: buildPlasma(M), frost: buildFrost(M), flamer: buildFlamer(M), rail: buildRail(M), bfg: buildBFG(M),
    };
    for (const [id, m] of Object.entries(this.models)) {
      m.id = id;
      if (id !== 'sabre') m.tip = [m.tip[0] + TIP_RIGHT, m.tip[1]];   // sit a little further to the right
      m.root = new THREE.Group(); m.root.add(m.group); m.root.visible = false;
      if (m.flash) { m.sprite = glowSprite('flash', m.tint); m.sprite.scale.setScalar(m.flash); m.muzzle.add(m.sprite); }
      if (m.flame) { m.fire = glowSprite('flame'); m.muzzle.add(m.fire); }
      this.camera.add(m.root);
      m.pos = [0.08, -0.14, -0.3];
    }
    for (const mm of Object.values(M)) if (mm.isMeshStandardMaterial) { mm.envMap = this.env; mm.envMapIntensity = mm.metalness > 0.5 ? 1.25 : 0.3; }
    this.align();
  }

  // Slide every model so its muzzle lands on its screen-space `tip` (below / right of the crosshair).
  align() {
    const cam = this.camera, v = new THREE.Vector3();
    cam.updateMatrixWorld(true);
    for (const m of Object.values(this.models)) {
      m.root.rotation.set(...m.rot); m.root.visible = true;
      for (let it = 0; it < 8; it++) {
        if (!m.sabre) {   // turn the barrel toward the crosshair point
          const lp = cam.worldToLocal(m.muzzle.getWorldPosition(v.clone())), want = new THREE.Vector3(0, 0, -AIM_DIST).sub(lp).normalize();
          const ry = Math.asin(-want.x); m.rot[1] = ry; m.rot[0] = Math.asin(Math.max(-1, Math.min(1, want.y / Math.cos(ry))));
          m.root.rotation.set(...m.rot);
        }
        m.root.position.set(...m.pos); m.root.updateMatrixWorld(true);
        m.muzzle.getWorldPosition(v);
        const depth = -v.z, ndc = v.clone().project(cam);
        const hh = Math.tan((cam.fov * Math.PI) / 360) * depth;
        m.pos[0] += (m.tip[0] - ndc.x) * hh * cam.aspect;
        m.pos[1] += (m.tip[1] - ndc.y) * hh;
      }
      m.root.visible = false;
    }
  }
  // Little side-view pictures of each weapon (no hands) for the pickups lying in the world.
  renderIcons(renderer, W = 256, H = 128) {
    const out = {}, cam = new THREE.PerspectiveCamera(20, W / H, 0.01, 20);
    const prevRT = renderer.getRenderTarget(), prevClear = new THREE.Color(), prevAlpha = renderer.getClearAlpha();
    renderer.getClearColor(prevClear);
    const keyPos = this.key.position.clone(); this.key.position.set(0.7, 1, 0.6);
    const skipped = (o) => { for (; o; o = o.parent) if (o.userData && o.userData.skip) return true; return false; };
    const sprites = [];
    this.scene.traverse((o) => { if (o.isSprite && o.visible) { sprites.push(o); o.visible = false; } });
    const savedVis = Object.fromEntries(Object.entries(this.models).map(([id, m]) => [id, m.root.visible]));
    for (const [id, m] of Object.entries(this.models)) {
      if (id === 'sabre') continue;
      for (const o of Object.values(this.models)) o.root.visible = o === m;
      m.root.position.set(0, 0, 0); m.root.rotation.set(0, 0, 0); m.root.updateMatrixWorld(true);
      const hidden = [], box = new THREE.Box3();
      m.group.traverse((o) => { if (o.userData && o.userData.skip && o.visible) { o.visible = false; hidden.push(o); } });
      m.group.traverse((o) => { if (o.isMesh && o.visible && !skipped(o) && o.parent.visible !== false) box.union(new THREE.Box3().setFromObject(o)); });
      const c = box.getCenter(new THREE.Vector3()), size = box.getSize(new THREE.Vector3());
      const dir = new THREE.Vector3(1, 0.32, 0.5).normalize();
      const dist = Math.max(size.z * 1.55, size.y * 3.2, 0.5);
      cam.position.copy(c).addScaledVector(dir, dist); cam.lookAt(c); cam.updateMatrixWorld(true);
      const rt = new THREE.WebGLRenderTarget(W, H, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, generateMipmaps: false });
      rt.texture.colorSpace = THREE.SRGBColorSpace;
      renderer.setRenderTarget(rt); renderer.setClearColor(0x000000, 0); renderer.clear();
      renderer.render(this.scene, cam);
      out[id] = rt.texture;
      for (const o of hidden) o.visible = true;
    }
    renderer.setRenderTarget(prevRT); renderer.setClearColor(prevClear, prevAlpha);
    this.key.position.copy(keyPos);
    for (const sp of sprites) sp.visible = true;
    for (const [id, m] of Object.entries(this.models)) m.root.visible = savedVis[id];
    return out;
  }
  resize(aspect) { this.camera.aspect = aspect; this.camera.updateProjectionMatrix(); this.align(); }

  // st: { id, bob, bobAmp, flash, swing, shotN, spin, lower, since, firing }
  update(st) {
    const cur = this.models[st.id];
    for (const m of Object.values(this.models)) m.root.visible = m === cur;
    const r = cur.root, [px, py, pz] = cur.pos, [rx, ry, rz] = cur.rot;
    const bx = Math.sin(st.bob) * 0.007 * st.bobAmp, by = Math.abs(Math.cos(st.bob)) * 0.006 * st.bobAmp;
    const k = st.flash * cur.recoil;
    r.position.set(px + bx, py - by - st.lower * 0.3, pz + k * 0.03);
    r.rotation.set(rx + k * 0.12 + st.lower * 0.5, ry, rz);
    if (cur.sabre && st.swing >= 0) {
      const s = st.swing, e = 1 - (1 - s) * (1 - s);
      r.position.set(px - e * 0.35, py + Math.sin(s * Math.PI) * 0.04 - st.lower * 0.3, pz - Math.sin(s * Math.PI) * 0.08);
      r.rotation.set(rx + Math.sin(s * Math.PI) * 0.4, ry - e * 1.5, rz + e * 0.9);
    }
    const t = st.since;
    if (cur.pump) { const u = Math.min(1, Math.max(0, (t - 0.1) / 0.26)); cur.pump.position.z = cur.pumpZ + Math.sin(u * Math.PI) * 0.12; }
    if (cur.ssg) {
      const { hinge, spent, fresh, lh } = cur.ssg, clamp = (v) => Math.min(1, Math.max(0, v)), ease = (u) => u * u * (3 - 2 * u);
      const open = ease(clamp((t - 0.14) / 0.2)), shut = ease(clamp((t - 0.9) / 0.08));
      const o = open * (1 - shut);
      hinge.rotation.x = -0.3 * o;
      r.position.y += 0.05 * o; r.rotation.x += 0.16 * o;   // lift the gun while it is broken open
      spent.forEach((sh, i) => {
        const te = t - 0.34 - i * 0.03, sd = i ? 1 : -1;
        sh.visible = te > 0 && te < 0.4;
        if (sh.visible) { sh.position.set(sd * 0.0185 + sd * 0.07 * te, 0.012 + 0.45 * te - 4.2 * te * te, -0.2 + 0.7 * te); sh.rotation.set(te * 9, te * 4 * sd, te * 6); }
      });
      fresh.forEach((sh, i) => {
        const ts = 0.5 + i * 0.17, u = clamp((t - (ts - 0.16)) / 0.3), sd = i ? 1 : -1;
        sh.visible = u > 0 && u < 1;
        if (sh.visible) {
          const e = ease(u);
          sh.position.set(sd * 0.0185 + sd * 0.09 * (1 - e), 0.012 - 0.11 * (1 - e), -0.2 + 0.2 * (1 - e));
          sh.rotation.set(0.5 * (1 - e), 0, 0);
        }
      });
      // the front hand: rides on the forend, then lets go, fetches each shell from below and carries it into the breech, then grabs the forend again
      const away = ease(clamp((t - 0.3) / 0.12)) * (1 - ease(clamp((t - 0.84) / 0.1)));
      const sh = fresh[1].visible ? fresh[1] : fresh[0].visible ? fresh[0] : null;
      const tx = sh ? sh.position.x : (t > 0.6 ? 0.0185 : -0.0185) + (t > 0.6 ? 0.09 : -0.09), ty = sh ? sh.position.y : 0.012 - 0.11, tz = sh ? sh.position.z : 0.0;
      const hx = tx - 0.035, hy = ty + 0.005, hz = tz + 0.03;                    // where the hand's centre goes (gun space)
      lh.position.set(hx * away, -0.033 * o * (1 - away) + (hy - 0) * away, (hz + 0.31) * away);   // offsets from the forend position (0, 0, -0.31)
    }
    if (cur.spinner) cur.spinner.rotation.z = st.spin;
    if (cur.warhead) cur.warhead.visible = t > 0.32 || t < 0;
    if (cur.drum) { const u = Math.min(1, Math.max(0, (t - 0.04) / 0.22)); cur.drum.rotation.z = (st.shotN - 1 + u * u * (3 - 2 * u)) * (Math.PI / 3); }
    if (cur.coils) { const glow = Math.max(0, 1 - t / 0.7); for (const c of cur.coils) c.material.color.setRGB(0.23 + glow * 0.6, 0.54 + glow * 0.4, 0.69 + glow * 0.3); }
    if (cur.pilot) cur.pilot.scale.setScalar(0.045 + Math.random() * 0.02);
    if (cur.fire) {
      cur.fire.visible = !!st.firing;
      cur.fire.scale.setScalar(0.22 + Math.random() * 0.1);
      cur.fire.position.z = -0.1;
    }
    if (cur.sprite) {
      cur.sprite.visible = st.flash > 0.05;
      cur.sprite.material.opacity = Math.min(1, st.flash * 1.4);
      cur.sprite.material.rotation = (st.shotN * 1.7) % 6.28;
      cur.sprite.scale.setScalar(cur.flash * (0.75 + st.flash * 0.5));
    }
    const lit = (cur.sprite && st.flash > 0.05) || st.firing;
    if (lit) {
      cur.muzzle.getWorldPosition(this.light.position);
      this.light.color.set(cur.tint === 'blue' ? 0x60b0ff : cur.tint === 'green' ? 0x60ff80 : 0xffa040);
      this.light.intensity = (st.firing ? 1.2 : st.flash * 2.2);
    } else this.light.intensity = 0;
  }
}
